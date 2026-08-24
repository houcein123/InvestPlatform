package com.tunisiainvest.platform.report;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;
import com.tunisiainvest.platform.catalogue.SecteurRepository;
import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.sales.Achat;
import com.tunisiainvest.platform.sales.SalesService;
import com.tunisiainvest.platform.security.CompteCourant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Génération de rapport — /api/report (CDC §6, étape 3)
 *
 * La génération prend 20 à 40 secondes : la route ne bloque pas la requête,
 * elle ouvre une tâche auprès du moteur et renvoie un identifiant que le
 * frontend interroge pour alimenter sa barre de progression.
 *
 * Le droit à la génération est TOUJOURS vérifié ici, jamais dans le moteur :
 * un achat payé portant sur le même secteur est exigé, lu en base.
 */
@RestController
@RequestMapping("/api/report")
@Tag(name = "Rapports", description = "Génération, progression, espace client")
public class ReportController {

    private final SalesService ventes;
    private final SecteurRepository secteurs;
    private final ReportEngineClient moteur;
    private final RapportRepository rapports;

    public ReportController(SalesService ventes, SecteurRepository secteurs,
                            ReportEngineClient moteur, RapportRepository rapports) {
        this.ventes = ventes;
        this.secteurs = secteurs;
        this.moteur = moteur;
        this.rapports = rapports;
    }

    public record DemandeGeneration(Long sectorId, Long achatId) {
    }

    public record DemandeRelance(Long achatId) {
    }

    @PostMapping("/generate")
    @Operation(summary = "Démarre la génération — exige un achat payé sur ce secteur")
    public ResponseEntity<Map<String, Object>> generer(@RequestBody DemandeGeneration demande) {
        if (demande.sectorId() == null) throw ApiException.badRequest("sectorId est obligatoire");

        if (!secteurs.existsById(demande.sectorId())) {
            throw ApiException.notFound("Secteur introuvable");
        }

        Achat achat = ventes.trouverAchat(demande.achatId())
                .filter(Achat::estPaye)
                .orElseThrow(() -> ApiException.paiementRequis("Aucun paiement confirmé pour ce rapport"));

        // Le paiement doit couvrir CE secteur : sans ce contrôle, un rapport
        // bon marché ouvrirait l'accès à n'importe quel autre.
        if (!achat.getIdSecteur().equals(demande.sectorId())) {
            throw ApiException.badRequest("Le paiement ne correspond pas à ce secteur");
        }

        // Le rapport appartient au titulaire de l'achat : il doit le retrouver
        // dans « Mes rapports ».
        Long utilisateurId = CompteCourant.exige().getId();

        String jobId = moteur.demarrerGeneration(demande.sectorId(), achat.getId(), utilisateurId);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "success", true,
                "jobId", jobId,
                "message", "Génération démarrée",
                "dureeEstimeeSec", 40));
    }

    @GetMapping("/status/{jobId}")
    @Operation(summary = "Progression, consommée par la barre du frontend")
    public JsonNode progression(@PathVariable String jobId) {
        return moteur.progression(jobId);
    }

    @GetMapping("/mes-rapports")
    @Operation(summary = "Espace client : achats payés et rapports livrés")
    public Map<String, Object> mesRapports() {
        return Map.of("achats", ventes.listerAchatsClient(CompteCourant.exige().getId()));
    }

    /**
     * Relance la génération d'un achat déjà payé dont le rapport manque.
     * Aucun nouveau paiement : le droit vient de l'achat, vérifié en base.
     * Le cas se produit quand le quota de rédaction est épuisé au mauvais moment.
     */
    @PostMapping("/relancer")
    @Operation(summary = "Relance sans repaiement un rapport payé mais absent")
    public ResponseEntity<Map<String, Object>> relancer(@RequestBody DemandeRelance demande) {
        if (demande.achatId() == null) throw ApiException.badRequest("achatId est obligatoire");

        Long idCompte = CompteCourant.exige().getId();
        Achat achat = ventes.trouverAchat(demande.achatId())
                .filter(Achat::estPaye)
                .filter(a -> idCompte.equals(a.getIdUtilisateur()))
                .orElseThrow(() -> ApiException.notFound("Achat introuvable ou non réglé"));

        String jobId = moteur.demarrerGeneration(achat.getIdSecteur(), achat.getId(), idCompte);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "success", true,
                "jobId", jobId,
                "message", "Génération relancée"));
    }

    /** Derniers rapports produits, pour le panneau de contrôle. */
    public List<Rapport> derniers() {
        return rapports.findTop50ByOrderByDateGenerationDesc();
    }
}
