package com.tunisiainvest.platform.payment;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.config.AppProperties;
import com.tunisiainvest.platform.sales.Achat;
import com.tunisiainvest.platform.sales.Paiement;
import com.tunisiainvest.platform.sales.SalesService;
import com.tunisiainvest.platform.security.CompteCourant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Paiement — /api/payment (CDC §6, étape 2)
 *
 * Deux modes, choisis par `app.paypal.mode` :
 *
 *   simulation — la commande est validée dans la plateforme. Aucun débit,
 *        aucun prestataire externe, aucune configuration. Le montant
 *        enregistré reste le TARIF du rapport et non zéro : une ligne de
 *        paiement doit refléter la valeur de ce qui a été commandé, sinon la
 *        comptabilité est inexploitable. L'absence de débit réel est portée
 *        par `achats.mode_paiement`, et le tableau de bord sépare le chiffre
 *        d'affaires réel du montant simulé.
 *
 *   paypal — transaction réelle (API Orders v2), en trois temps :
 *        1. create-order : on crée l'achat en base PUIS la commande PayPal ;
 *        2. l'acheteur approuve sur le domaine de PayPal ;
 *        3. capture : on encaisse et on vérifie le montant reçu.
 *
 * Dans les deux cas, c'est l'enregistrement en base qui fait foi pour
 * débloquer la génération du rapport — jamais une affirmation du navigateur.
 */
@RestController
@RequestMapping("/api/payment")
@Tag(name = "Paiement", description = "Commande et encaissement PayPal")
public class PaymentController {

    /** Tolérance sur le montant encaissé, pour absorber les arrondis de conversion. */
    private static final BigDecimal TOLERANCE = new BigDecimal("0.02");

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+[.][^\\s@]+$");

    private final SalesService ventes;
    private final PayPalClient paypal;
    private final AppProperties properties;

    public PaymentController(SalesService ventes, PayPalClient paypal, AppProperties properties) {
        this.ventes = ventes;
        this.paypal = paypal;
        this.properties = properties;
    }

    private boolean estSimulation() {
        return !"paypal".equalsIgnoreCase(properties.getPaypal().getMode()) || !paypal.estConfigure();
    }

    public record DemandeCommande(Long sectorId) {
    }

    public record DemandeCapture(String orderId, Long achatId, String emailPayeur, String nomPayeur) {
    }

    @GetMapping("/config")
    @Operation(summary = "Configuration publique du paiement, consommée par le frontend")
    public Map<String, Object> configuration() {
        Map<String, Object> reponse = new HashMap<>();
        reponse.put("deviseAffichage", properties.getDevise());

        if (estSimulation()) {
            reponse.put("mode", "simulation");
            reponse.put("configure", true);
            reponse.put("argentReel", false);
            return reponse;
        }

        Map<String, Object> statut = paypal.statut();
        reponse.put("mode", "paypal");
        reponse.put("configure", statut.get("configure"));
        reponse.put("clientId", statut.get("clientId"));
        reponse.put("environnement", statut.get("environnement"));
        reponse.put("devisePaiement", statut.get("devise"));
        reponse.put("tauxConversion", statut.get("tauxTND"));
        reponse.put("locale", statut.get("locale"));
        reponse.put("argentReel", statut.get("argentReel"));
        return reponse;
    }

    @PostMapping("/create-order")
    @Operation(summary = "Crée l'achat en base puis la commande PayPal")
    public ResponseEntity<Map<String, Object>> creerCommande(@RequestBody DemandeCommande demande) {
        if (demande.sectorId() == null) throw ApiException.badRequest("sectorId est obligatoire");

        boolean simulation = estSimulation();
        String mode = simulation ? Achat.MODE_SIMULATION : Achat.MODE_PAYPAL;

        if (!simulation && !paypal.estConfigure()) {
            throw ApiException.indisponible("Paiement indisponible : PayPal n'est pas configuré");
        }

        // La commande est rattachée à un titulaire. `exige()` échoue en 401 si
        // la session manque : sans rattachement, le rapport payé ne serait
        // retrouvable dans aucun espace client.
        Long idAcheteur = CompteCourant.exige().getId();
        SalesService.Commande commande = ventes.creerCommande(demande.sectorId(), idAcheteur, mode);

        Map<String, Object> reponse = new HashMap<>();
        reponse.put("success", true);
        reponse.put("mode", mode);
        reponse.put("achatId", commande.achat().getId());
        reponse.put("secteur", commande.secteur().getNom());
        reponse.put("montantAffiche", commande.achat().getMontant());
        reponse.put("deviseAffichage", properties.getDevise());

        if (simulation) {
            reponse.put("montantPaiement", commande.achat().getMontant());
            reponse.put("devisePaiement", properties.getDevise());
            return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
        }

        PayPalClient.CommandeCreee paypalCommande = paypal.creerCommande(
                commande.achat().getId(),
                commande.achat().getMontant(),
                commande.secteur().getNom());

        reponse.put("orderId", paypalCommande.orderId());
        reponse.put("montantPaiement", paypalCommande.montantPaiement());
        reponse.put("devisePaiement", paypalCommande.devisePaiement());
        reponse.put("environnement", properties.getPaypal().getEnv());
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }

    @PostMapping("/capture")
    @Operation(summary = "Encaisse la commande approuvée et débloque la génération")
    public Map<String, Object> encaisser(@RequestBody DemandeCapture demande) {
        if (demande.achatId() == null) throw ApiException.badRequest("achatId est obligatoire");

        // Le compte PayPal déclaré est conservé pour le rapprochement comptable.
        // Seule l'adresse est demandée : un marchand n'a jamais à connaître le
        // mot de passe de son client, et aucune API PayPal ne permettrait de le
        // vérifier — un formulaire qui le collecterait serait techniquement une
        // page de hameçonnage, quelle que soit l'intention.
        if (demande.emailPayeur() != null && !demande.emailPayeur().isBlank()
                && !EMAIL.matcher(demande.emailPayeur()).matches()) {
            throw ApiException.badRequest("Adresse du compte PayPal invalide");
        }

        Achat achat = ventes.exigerAchat(demande.achatId());
        if (achat.estPaye()) {
            return Map.of("success", true, "message", "Commande déjà confirmée", "achatId", achat.getId());
        }

        return achat.estSimulation() ? encaisserSimulation(achat, demande) : encaisserPayPal(achat, demande);
    }

    /** Mode simulation : validation locale, aucun débit réel. */
    private Map<String, Object> encaisserSimulation(Achat achat, DemandeCapture demande) {
        if (demande.emailPayeur() == null || demande.emailPayeur().isBlank()) {
            throw ApiException.badRequest("L'adresse du compte PayPal est requise");
        }

        ventes.enregistrerPaiement(Paiement.builder()
                .achatId(achat.getId())
                .utilisateurId(CompteCourant.idOuNull() != null ? CompteCourant.idOuNull() : achat.getIdUtilisateur())
                .montant(achat.getMontant())
                .devise(properties.getDevise())
                .methode(Achat.MODE_SIMULATION)
                .transactionId("SIM-" + achat.getId() + "-" + System.currentTimeMillis())
                .statut(Paiement.COMPLETE)
                .emailPayeur(demande.emailPayeur())
                .nomPayeur(demande.nomPayeur())
                .environnement("simulation")
                .build());

        ventes.marquerPaye(achat.getId());

        Map<String, Object> reponse = new HashMap<>();
        reponse.put("success", true);
        reponse.put("mode", "simulation");
        reponse.put("message", "Commande confirmée");
        reponse.put("achatId", achat.getId());
        reponse.put("montant", achat.getMontant());
        reponse.put("devise", properties.getDevise());
        reponse.put("emailPayeur", demande.emailPayeur());
        return reponse;
    }

    /** Mode PayPal : encaissement réel, puis contrôle de ce qui a été reçu. */
    private Map<String, Object> encaisserPayPal(Achat achat, DemandeCapture demande) {
        if (demande.orderId() == null || demande.orderId().isBlank()) {
            throw ApiException.badRequest("orderId est obligatoire pour un paiement PayPal");
        }

        // Un refus de PayPal (commande non approuvée, expirée, déjà encaissée)
        // est une situation de paiement, pas une panne serveur : elle ressort
        // en 402 et non en 500.
        PayPalClient.ResultatCapture capture = paypal.encaisser(demande.orderId());

        // La commande PayPal doit correspondre à l'achat présenté. Sans ce
        // contrôle, un acheteur pourrait régler le rapport le moins cher et
        // faire débloquer le plus cher.
        if (capture.achatId() != null && !capture.achatId().equals(achat.getId())) {
            throw ApiException.conflict("La commande PayPal ne correspond pas à cet achat");
        }
        if (!capture.estComplete()) {
            throw ApiException.paiementRequis("Paiement non abouti (statut PayPal : " + capture.statut() + ")");
        }

        BigDecimal attendu = paypal.convertirDepuisTND(achat.getMontant());
        if (capture.montant().add(TOLERANCE).compareTo(attendu) < 0) {
            // L'encaissement insuffisant est tracé avant d'être refusé : sans
            // cette ligne, un montant reçu resterait sans trace comptable.
            ventes.enregistrerPaiement(paiementDepuis(capture, achat, Paiement.MONTANT_INSUFFISANT, demande));
            throw ApiException.paiementRequis("Montant encaissé insuffisant ("
                    + capture.montant() + " " + capture.devise() + " pour " + attendu + " attendus)");
        }

        ventes.enregistrerPaiement(paiementDepuis(capture, achat, Paiement.COMPLETE, demande));
        ventes.marquerPaye(achat.getId());

        Map<String, Object> reponse = new HashMap<>();
        reponse.put("success", true);
        reponse.put("mode", "paypal");
        reponse.put("message", "Paiement confirmé");
        reponse.put("achatId", achat.getId());
        reponse.put("transactionId", capture.captureId());
        reponse.put("montant", capture.montant());
        reponse.put("devise", capture.devise());
        return reponse;
    }

    private Paiement paiementDepuis(PayPalClient.ResultatCapture capture, Achat achat,
                                    String statut, DemandeCapture demande) {
        Long idCompte = CompteCourant.idOuNull();
        return Paiement.builder()
                .achatId(achat.getId())
                .utilisateurId(idCompte != null ? idCompte : achat.getIdUtilisateur())
                .montant(capture.montant())
                .devise(capture.devise())
                .methode(Achat.MODE_PAYPAL)
                .transactionId(capture.captureId())
                .statut(statut)
                // En mode PayPal, l'adresse vient de la réponse de PayPal
                // elle-même : elle est authentifiée, contrairement à une saisie
                // faite dans le navigateur.
                .emailPayeur(capture.emailPayeur() != null ? capture.emailPayeur() : demande.emailPayeur())
                .nomPayeur(capture.nomPayeur() != null ? capture.nomPayeur() : demande.nomPayeur())
                .paypalOrderId(capture.orderId())
                .paypalCaptureId(capture.captureId())
                .statutPaypal(capture.statut())
                .environnement(properties.getPaypal().getEnv())
                .payloadCapture(capture.payloadBrut())
                .build();
    }
}
