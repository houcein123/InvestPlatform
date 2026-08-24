package com.tunisiainvest.platform.payment;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.config.AppProperties;

/**
 * Client de l'API PayPal Orders v2.
 *
 * Le dinar tunisien ne fait PAS partie des devises acceptées par PayPal : les
 * tarifs du catalogue restent en TND (affichage et comptabilité) et la
 * transaction est présentée dans la devise configurée, convertie au taux
 * `app.paypal.taux-tnd`.
 *
 * En environnement sandbox, aucun argent réel ne circule : le parcours est
 * identique à la production, sur des comptes de test.
 */
@Component
public class PayPalClient {

    private static final Logger log = LoggerFactory.getLogger(PayPalClient.class);

    private final AppProperties.Paypal config;
    private final RestClient http;
    private final ObjectMapper json = new ObjectMapper();

    /** Jeton OAuth mis en cache : PayPal le délivre pour environ 9 heures. */
    private volatile String jeton;
    private volatile Instant jetonExpireLe = Instant.EPOCH;

    /** Marge avant expiration, pour ne jamais présenter un jeton périmé. */
    private static final Duration MARGE = Duration.ofMinutes(1);

    public PayPalClient(AppProperties properties, RestClient.Builder builder) {
        this.config = properties.getPaypal();
        this.http = builder.baseUrl(config.hote()).build();
    }

    public boolean estConfigure() {
        return config.isConfigure();
    }

    /** Convertit un montant TND vers la devise acceptée par PayPal. */
    public BigDecimal convertirDepuisTND(BigDecimal montantTND) {
        return config.convertirDepuisTND(montantTND);
    }

    private synchronized String jetonAcces() {
        if (!config.isConfigure()) {
            throw ApiException.indisponible(
                    "PayPal non configuré : renseignez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET");
        }
        if (jeton != null && Instant.now().isBefore(jetonExpireLe.minus(MARGE))) {
            return jeton;
        }

        String identifiants = Base64.getEncoder().encodeToString(
                (config.getClientId() + ":" + config.getClientSecret()).getBytes());

        try {
            JsonNode reponse = http.post()
                    .uri("/v1/oauth2/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + identifiants)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body("grant_type=client_credentials")
                    .retrieve()
                    .body(JsonNode.class);

            jeton = reponse.path("access_token").asText();
            jetonExpireLe = Instant.now().plusSeconds(reponse.path("expires_in").asLong(32400));
            return jeton;
        } catch (Exception ex) {
            log.error("Authentification PayPal refusée", ex);
            throw ApiException.indisponible("Authentification PayPal refusée : " + messageLisible(ex));
        }
    }

    private JsonNode appeler(String chemin, Object corps) {
        try {
            return http.post()
                    .uri(chemin)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jetonAcces())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corps == null ? Map.of() : corps)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw ApiException.paiementRequis("PayPal : " + messageLisible(ex));
        }
    }

    private static String messageLisible(Exception ex) {
        String message = ex.getMessage();
        return (message == null || message.isBlank()) ? "erreur inattendue" : message;
    }

    /** Résultat d'une commande créée : ce que le frontend doit connaître. */
    public record CommandeCreee(String orderId, BigDecimal montantPaiement, String devisePaiement) {
    }

    /** Résultat d'un encaissement, tel que PayPal le rapporte. */
    public record ResultatCapture(
            String orderId,
            String captureId,
            String statut,
            BigDecimal montant,
            String devise,
            Long achatId,
            String emailPayeur,
            String nomPayeur,
            String payloadBrut) {

        public boolean estComplete() {
            return "COMPLETED".equals(statut);
        }
    }

    /**
     * Crée une commande PayPal pour un achat déjà enregistré en base.
     *
     * `custom_id` relie la transaction PayPal à notre achat : c'est ce qui
     * permet de recouper les deux systèmes en cas de litige, et ce que la
     * capture revérifie avant de débloquer le rapport.
     */
    public CommandeCreee creerCommande(Long achatId, BigDecimal montantTND, String secteur) {
        BigDecimal montantPaiement = convertirDepuisTND(montantTND);

        Map<String, Object> unite = Map.of(
                "custom_id", String.valueOf(achatId),
                "description", tronquer("Rapport sectoriel — " + secteur, 127),
                "amount", Map.of(
                        "currency_code", config.getCurrency(),
                        "value", montantPaiement.toPlainString()));

        // `payment_source.paypal` déclare que la commande se règle avec un
        // COMPTE PayPal. C'est ce qui supprime le repli « paiement invité par
        // carte » : avec l'ancien `application_context`, PayPal restait libre
        // de renvoyer l'acheteur vers le formulaire de carte dès que l'email
        // saisi ne correspondait à aucun compte connu.
        Map<String, Object> contexte = Map.of(
                "brand_name", "Tunisia Invest",
                // PAY_NOW : le bouton final affiche « Payer maintenant »
                // plutôt que « Continuer ».
                "user_action", "PAY_NOW",
                // Rapport téléchargeable : aucune adresse de livraison.
                "shipping_preference", "NO_SHIPPING",
                // Page de connexion au compte, et non page d'inscription.
                "landing_page", "LOGIN",
                // Sinon PayPal déduit la langue de l'adresse IP.
                "locale", config.getLocale().replace("_", "-"));

        JsonNode commande = appeler("/v2/checkout/orders", Map.of(
                "intent", "CAPTURE",
                "purchase_units", java.util.List.of(unite),
                "payment_source", Map.of("paypal", Map.of("experience_context", contexte))));

        return new CommandeCreee(commande.path("id").asText(), montantPaiement, config.getCurrency());
    }

    /** Encaisse une commande approuvée par l'acheteur. */
    public ResultatCapture encaisser(String orderId) {
        JsonNode resultat = appeler("/v2/checkout/orders/" + orderId + "/capture", null);
        return lireCapture(resultat);
    }

    /** Relit une commande sans l'encaisser — utilisé par le webhook. */
    public ResultatCapture relire(String orderId) {
        try {
            JsonNode resultat = http.get()
                    .uri("/v2/checkout/orders/" + orderId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jetonAcces())
                    .retrieve()
                    .body(JsonNode.class);
            return lireCapture(resultat);
        } catch (Exception ex) {
            throw ApiException.paiementRequis("PayPal : " + messageLisible(ex));
        }
    }

    private ResultatCapture lireCapture(JsonNode resultat) {
        JsonNode unite = resultat.path("purchase_units").path(0);
        JsonNode capture = unite.path("payments").path("captures").path(0);
        JsonNode payeur = resultat.path("payer");

        String customId = unite.path("custom_id").asText(null);
        if (customId == null || customId.isBlank()) {
            // Sur une capture, PayPal remonte custom_id au niveau de la capture.
            customId = capture.path("custom_id").asText(null);
        }

        String nom = (payeur.path("name").path("given_name").asText("")
                + " " + payeur.path("name").path("surname").asText("")).trim();

        return new ResultatCapture(
                resultat.path("id").asText(null),
                capture.path("id").asText(resultat.path("id").asText(null)),
                resultat.path("status").asText(null),
                new BigDecimal(capture.path("amount").path("value").asText("0")),
                capture.path("amount").path("currency_code").asText(config.getCurrency()),
                (customId == null || customId.isBlank()) ? null : Long.valueOf(customId),
                emptyToNull(payeur.path("email_address").asText(null)),
                emptyToNull(nom),
                resultat.toString());
    }

    /**
     * Vérifie la signature d'un webhook auprès de PayPal.
     *
     * Sans cette vérification, n'importe qui connaissant l'URL pourrait
     * déclarer un paiement abouti : le webhook est une route publique, sa
     * seule authentification est cette signature.
     *
     * @return false si le webhook n'est pas configuré ou si la signature est refusée
     */
    public boolean signatureValide(Map<String, String> entetes, String corpsBrut) {
        if (config.getWebhookId() == null || config.getWebhookId().isBlank()) {
            log.warn("PAYPAL_WEBHOOK_ID absent : la notification reçue ne peut pas être authentifiée, elle est ignorée.");
            return false;
        }
        try {
            Map<String, Object> demande = new java.util.HashMap<>();
            demande.put("auth_algo", entetes.get("paypal-auth-algo"));
            demande.put("cert_url", entetes.get("paypal-cert-url"));
            demande.put("transmission_id", entetes.get("paypal-transmission-id"));
            demande.put("transmission_sig", entetes.get("paypal-transmission-sig"));
            demande.put("transmission_time", entetes.get("paypal-transmission-time"));
            demande.put("webhook_id", config.getWebhookId());
            demande.put("webhook_event", json.readTree(corpsBrut));

            JsonNode reponse = appeler("/v1/notifications/verify-webhook-signature", demande);
            return "SUCCESS".equals(reponse.path("verification_status").asText());
        } catch (Exception ex) {
            log.error("Vérification de signature du webhook impossible", ex);
            return false;
        }
    }

    /** État de la configuration, exposé au frontend et au panneau de contrôle. */
    public Map<String, Object> statut() {
        Map<String, Object> statut = new java.util.HashMap<>();
        statut.put("configure", config.isConfigure());
        statut.put("environnement", config.getEnv());
        statut.put("devise", config.getCurrency());
        statut.put("tauxTND", config.getTauxTnd());
        statut.put("locale", config.getLocale());
        statut.put("clientId", config.getClientId().isBlank() ? null : config.getClientId());
        statut.put("argentReel", config.isArgentReel());
        return statut;
    }

    private static String tronquer(String valeur, int max) {
        return valeur.length() <= max ? valeur : valeur.substring(0, max);
    }

    private static String emptyToNull(String valeur) {
        return (valeur == null || valeur.isBlank()) ? null : valeur;
    }
}
