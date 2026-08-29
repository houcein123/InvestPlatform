package com.tunisiainvest.platform.report;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import tools.jackson.databind.JsonNode;
import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.config.AppProperties;

/**
 * Client du moteur de rapports (service Node « report-engine »).
 *
 * Le moteur détient la fabrication du PDF : mise en page PDFKit, rédaction des
 * sections par Groq, projections statistiques. Ce backend ne la réimplémente
 * pas — il en reste le seul donneur d'ordre, et n'appelle le moteur qu'après
 * avoir vérifié en base qu'un achat payé couvre bien le secteur demandé.
 *
 * L'appel est authentifié par un jeton partagé : le moteur n'est pas exposé
 * publiquement et n'accepte que les requêtes de ce backend.
 */
@Component
public class ReportEngineClient {

    private static final Logger log = LoggerFactory.getLogger(ReportEngineClient.class);

    private final RestClient http;
    private final String jeton;

    public ReportEngineClient(AppProperties properties, RestClient.Builder builder) {
        AppProperties.ReportEngine config = properties.getReportEngine();
        this.jeton = config.getToken();
        // Le moteur peut mettre plusieurs dizaines de secondes a repondre sur
        // une reconstruction de PDF : le delai de lecture par defaut est trop
        // court, et une coupure au milieu d'une generation deja payee serait
        // le pire moment pour abandonner.
        SimpleClientHttpRequestFactory fabrique = new SimpleClientHttpRequestFactory();
        fabrique.setConnectTimeout(Duration.ofSeconds(10));
        fabrique.setReadTimeout(Duration.ofSeconds(config.getTimeoutSeconds()));

        this.http = builder
                .baseUrl(config.getBaseUrl())
                .requestFactory(fabrique)
                .build();
    }

    /**
     * Démarre une génération et renvoie l'identifiant de suivi.
     * Le moteur répond immédiatement : la génération prend 20 à 40 secondes,
     * elle ne peut pas tenir dans une requête HTTP confortable.
     */
    public String demarrerGeneration(Long sectorId, Long achatId, Long utilisateurId, String langue) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("sectorId", sectorId);
        corps.put("achatId", achatId);
        corps.put("utilisateurId", utilisateurId);
        // Le moteur retombe sur le français si la valeur est absente : une
        // langue manquante ne doit pas faire échouer une génération payée.
        corps.put("langue", langue);

        JsonNode reponse = appeler("/internal/report/generate", corps);
        String jobId = reponse.path("jobId").asText(null);
        if (jobId == null || jobId.isBlank()) {
            throw ApiException.indisponible("Le moteur de rapports n'a pas ouvert de tâche de génération");
        }
        return jobId;
    }

    /** Progression d'une génération, telle que la barre du frontend la consomme. */
    public JsonNode progression(String jobId) {
        try {
            return http.get()
                    .uri("/internal/report/status/{jobId}", jobId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception ex) {
            throw ApiException.notFound("Tâche de génération inconnue ou expirée");
        }
    }

    /** Aperçu gratuit : couverture et sommaire, produits par les mêmes fonctions que le rapport payant. */
    public byte[] apercu(Long sectorId, String langue) {
        try {
            return http.get()
                    .uri(b -> b.path("/internal/report/preview/{sectorId}")
                            .queryParam("langue", langue)
                            .build(sectorId))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                    .accept(MediaType.APPLICATION_PDF)
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception ex) {
            log.error("Aperçu indisponible pour le secteur {}", sectorId, ex);
            throw ApiException.indisponible("Aperçu indisponible : le moteur de rapports ne répond pas");
        }
    }

    /** Recalcul des projections d'un secteur (panneau de contrôle). */
    public JsonNode recalculerProjections(Long sectorId) {
        return appeler("/internal/projections/" + sectorId, Map.of());
    }

    /** Reconstruction d'un PDF à partir de sections corrigées à la main. */
    public JsonNode reconstruireRapport(Long rapportId, Object narratives) {
        return appeler("/internal/report/" + rapportId + "/rebuild", Map.of("narratives", narratives));
    }

    /** État du moteur : clé Groq, modèle, accessibilité. */
    public JsonNode etat() {
        try {
            return http.get()
                    .uri("/internal/health")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Appel POST au moteur.
     *
     * Les deux familles d'echec sont distinguees, et cette distinction n'est
     * pas cosmetique : un « moteur injoignable » envoye alors que le moteur
     * avait parfaitement repondu — l'echec portait en realite sur la lecture de
     * sa reponse — envoie chercher le probleme au mauvais endroit pendant des
     * heures. Le message rendu au client reste generique ; c'est le journal qui
     * porte la cause exacte.
     */
    private JsonNode appeler(String chemin, Object corps) {
        try {
            return http.post()
                    .uri(chemin)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (ResourceAccessException reseau) {
            log.error("Moteur de rapports injoignable sur {} : {}", chemin, reseau.getMessage());
            throw ApiException.indisponible("Le moteur de rapports est injoignable");
        } catch (RestClientResponseException refus) {
            log.error("Le moteur de rapports a refuse {} : HTTP {} — {}",
                    chemin, refus.getStatusCode().value(), refus.getResponseBodyAsString());
            throw ApiException.indisponible("Le moteur de rapports a refuse la demande");
        } catch (RuntimeException autre) {
            // Reponse illisible, conversion impossible, erreur inattendue :
            // le moteur a repondu, c'est son exploitation qui echoue.
            log.error("Reponse du moteur de rapports inexploitable sur {}", chemin, autre);
            throw ApiException.indisponible("Reponse inexploitable du moteur de rapports");
        }
    }
}
