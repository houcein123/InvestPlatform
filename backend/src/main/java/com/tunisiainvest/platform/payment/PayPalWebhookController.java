package com.tunisiainvest.platform.payment;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.tunisiainvest.platform.config.AppProperties;
import com.tunisiainvest.platform.sales.Achat;
import com.tunisiainvest.platform.sales.Paiement;
import com.tunisiainvest.platform.sales.SalesService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Webhook PayPal — /api/payment/webhook
 *
 * FILET DE SÉCURITÉ, et non chemin nominal. Le parcours normal encaisse dans
 * `POST /api/payment/capture`, pendant que l'acheteur est devant son écran.
 * Mais si le navigateur se ferme entre l'approbation et la capture, l'argent
 * peut être débité sans que la plateforme l'ait enregistré : le webhook
 * rattrape ce cas.
 *
 * Trois garanties :
 *   1. la signature est vérifiée auprès de PayPal — cette route est publique,
 *      c'est sa seule authentification ;
 *   2. `event_id` est unique en base : PayPal rejoue ses notifications jusqu'à
 *      obtenir un 200, le rejeu ne doit rien encaisser deux fois ;
 *   3. le passage à « payé » reste conditionnel en SQL, donc idempotent même
 *      si la capture et le webhook arrivent simultanément.
 */
@RestController
@RequestMapping("/api/payment")
@Tag(name = "Paiement", description = "Notifications PayPal")
public class PayPalWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PayPalWebhookController.class);

    private static final String CAPTURE_ABOUTIE = "PAYMENT.CAPTURE.COMPLETED";

    private final PayPalClient paypal;
    private final PaypalWebhookRepository journal;
    private final SalesService ventes;
    private final AppProperties properties;
    private final ObjectMapper json = new ObjectMapper();

    public PayPalWebhookController(PayPalClient paypal, PaypalWebhookRepository journal,
                                   SalesService ventes, AppProperties properties) {
        this.paypal = paypal;
        this.journal = journal;
        this.ventes = ventes;
        this.properties = properties;
    }

    @PostMapping("/webhook")
    @Operation(summary = "Notification PayPal (signature vérifiée)")
    @Transactional
    public ResponseEntity<Map<String, Object>> recevoir(@RequestHeader Map<String, String> entetes,
                                                        @RequestBody String corpsBrut) {
        // Les en-têtes HTTP sont insensibles à la casse, la Map ne l'est pas.
        Map<String, String> normalises = new java.util.HashMap<>();
        entetes.forEach((cle, valeur) -> normalises.put(cle.toLowerCase(Locale.ROOT), valeur));

        boolean valide = paypal.signatureValide(normalises, corpsBrut);
        if (!valide) {
            log.warn("Notification PayPal refusée : signature invalide ou webhook non configuré.");
            // 401 plutôt que 200 : PayPal doit savoir que la notification n'a
            // pas été acceptée, et un appelant illégitime ne doit pas croire
            // qu'il a été pris en compte.
            return ResponseEntity.status(401).body(Map.of("error", "Signature invalide"));
        }

        JsonNode evenement;
        try {
            evenement = json.readTree(corpsBrut);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Charge utile illisible"));
        }

        String eventId = evenement.path("id").asText(null);
        String eventType = evenement.path("event_type").asText("");
        JsonNode ressource = evenement.path("resource");

        if (eventId == null || journal.existsByEventId(eventId)) {
            // Déjà traité : on répond 200 pour que PayPal cesse de réémettre.
            return ResponseEntity.ok(Map.of("success", true, "message", "Notification déjà traitée"));
        }

        journal.save(PaypalWebhook.builder()
                .eventId(eventId)
                .eventType(eventType)
                .resourceId(ressource.path("id").asText(null))
                .signatureVerifiee(true)
                .payload(corpsBrut)
                .traiteLe(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build());

        if (CAPTURE_ABOUTIE.equals(eventType)) {
            rattraperEncaissement(ressource);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Enregistre l'encaissement si la capture synchrone ne l'a pas fait.
     * `custom_id` porte l'identifiant de notre achat depuis la création de la
     * commande : c'est lui qui relie la notification à une vente.
     */
    private void rattraperEncaissement(JsonNode ressource) {
        String customId = ressource.path("custom_id").asText(null);
        String captureId = ressource.path("id").asText(null);
        if (customId == null || customId.isBlank()) {
            log.warn("Notification de capture sans custom_id : impossible de la rattacher à un achat.");
            return;
        }
        if (ventes.captureDejaEnregistree(captureId)) {
            return;
        }

        Long achatId;
        try {
            achatId = Long.valueOf(customId);
        } catch (NumberFormatException ex) {
            log.warn("custom_id inattendu dans une notification PayPal : {}", customId);
            return;
        }

        ventes.trouverAchat(achatId).ifPresent(achat -> {
            java.math.BigDecimal montant =
                    new java.math.BigDecimal(ressource.path("amount").path("value").asText("0"));

            ventes.enregistrerPaiement(Paiement.builder()
                    .achatId(achat.getId())
                    .utilisateurId(achat.getIdUtilisateur())
                    .montant(montant)
                    .devise(ressource.path("amount").path("currency_code")
                            .asText(properties.getPaypal().getCurrency()))
                    .methode(Achat.MODE_PAYPAL)
                    .transactionId(captureId)
                    .statut(Paiement.COMPLETE)
                    .paypalCaptureId(captureId)
                    .statutPaypal(ressource.path("status").asText(null))
                    .environnement(properties.getPaypal().getEnv())
                    .payloadCapture(ressource.toString())
                    .build());

            boolean marque = ventes.marquerPaye(achat.getId());
            if (marque) {
                log.info("Achat {} confirmé par notification PayPal (capture {}).", achat.getId(), captureId);
            }
        });
    }
}
