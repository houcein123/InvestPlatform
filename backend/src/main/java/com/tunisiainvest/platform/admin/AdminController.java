package com.tunisiainvest.platform.admin;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import tools.jackson.databind.JsonNode;
import com.tunisiainvest.platform.account.AccountService;
import com.tunisiainvest.platform.account.dto.CompteDto;
import com.tunisiainvest.platform.catalogue.Secteur;
import com.tunisiainvest.platform.catalogue.SecteurRepository;
import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.config.AppProperties;
import com.tunisiainvest.platform.report.Rapport;
import com.tunisiainvest.platform.report.RapportRepository;
import com.tunisiainvest.platform.report.ReportEngineClient;
import com.tunisiainvest.platform.sales.SalesService;
import com.tunisiainvest.platform.sectordata.*;
import com.tunisiainvest.platform.security.CompteCourant;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Panneau de contrôle — /api/admin (CDC §7)
 *
 * Réservé au rôle administrateur : la règle est portée par la configuration de
 * sécurité, une seule fois, plutôt que répétée dans chaque méthode.
 */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administration", description = "Données sectorielles, rapports, comptes, statistiques")
public class AdminController {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(AdminController.class);

    /** Mapper du contexte : reprend la configuration de l'application. */
    private final tools.jackson.databind.ObjectMapper json = new tools.jackson.databind.ObjectMapper();

    private final SecteurRepository secteurs;
    private final ChiffresClesRepository chiffres;
    private final ZoneRepository zones;
    private final ActeurRepository acteurs;
    private final CadreRepository cadres;
    private final BenchmarkRepository benchmarks;
    private final StatistiqueRepository statistiques;
    private final RapportRepository rapports;
    private final SalesService ventes;
    private final AccountService comptes;
    private final ReportEngineClient moteur;
    private final AppProperties properties;

    public AdminController(SecteurRepository secteurs, ChiffresClesRepository chiffres, ZoneRepository zones,
                           ActeurRepository acteurs, CadreRepository cadres, BenchmarkRepository benchmarks,
                           StatistiqueRepository statistiques, RapportRepository rapports, SalesService ventes,
                           AccountService comptes, ReportEngineClient moteur, AppProperties properties) {
        this.secteurs = secteurs;
        this.chiffres = chiffres;
        this.zones = zones;
        this.acteurs = acteurs;
        this.cadres = cadres;
        this.benchmarks = benchmarks;
        this.statistiques = statistiques;
        this.rapports = rapports;
        this.ventes = ventes;
        this.comptes = comptes;
        this.moteur = moteur;
        this.properties = properties;
    }

    // ── Secteurs ────────────────────────────────────────────────────────────

    @GetMapping("/secteurs")
    public Map<String, Object> listerSecteurs() {
        return Map.of("secteurs", secteurs.findAllByOrderById());
    }

    @GetMapping("/secteurs/{id}")
    public Map<String, Object> secteurComplet(@PathVariable Long id) {
        Secteur secteur = exigerSecteur(id);
        Map<String, Object> donnees = new HashMap<>();
        donnees.put("secteur", secteur);
        donnees.put("chiffresCles", chiffres.findBySecteurId(id).orElse(null));
        donnees.put("donneesStatistiques", statistiques.findBySecteurIdOrderByIndicateur(id));
        donnees.put("zonesGeographiques", zones.findBySecteurIdAndEstActifTrueOrderByNom(id));
        donnees.put("acteursPrincipaux", acteurs.findBySecteurIdOrderByNom(id));
        donnees.put("cadreReglementaire", cadres.findBySecteurIdAndEstEnVigueurTrueOrderByAnneeDesc(id));
        donnees.put("benchmarksRegionaux", benchmarks.findBySecteurIdOrderByIndicateur(id));
        return donnees;
    }

    public record MajSecteur(String nom, String description, java.math.BigDecimal prix_rapport, Boolean est_actif) {
    }

    @PutMapping("/secteurs/{id}")
    public Map<String, Object> modifierSecteur(@PathVariable Long id, @RequestBody MajSecteur demande) {
        Secteur secteur = exigerSecteur(id);
        if (demande.nom() != null) secteur.setNom(demande.nom());
        if (demande.description() != null) secteur.setDescription(demande.description());
        if (demande.prix_rapport() != null) secteur.setPrixRapport(demande.prix_rapport());
        if (demande.est_actif() != null) secteur.setEstActif(demande.est_actif());
        secteur.setUpdatedAt(LocalDateTime.now());
        return Map.of("secteur", secteurs.save(secteur));
    }

    private Secteur exigerSecteur(Long id) {
        return secteurs.findById(id).orElseThrow(() -> ApiException.notFound("Secteur introuvable"));
    }

    // ── Chiffres clés ───────────────────────────────────────────────────────

    /** Champs éditables, envoyés au frontend pour qu'il construise son formulaire. */
    private static final List<Map<String, String>> CHAMPS_CHIFFRES = List.of(
            Map.of("cle", "contribution_pib_pct", "libelle", "Contribution au PIB", "unite", "%"),
            Map.of("cle", "croissance_annuelle_pct", "libelle", "Croissance annuelle", "unite", "%"),
            Map.of("cle", "nombre_emplois", "libelle", "Emplois", "unite", "postes"),
            Map.of("cle", "exportations_mdt", "libelle", "Exportations", "unite", "MDT"),
            Map.of("cle", "nombre_entreprises", "libelle", "Entreprises", "unite", "unités"),
            Map.of("cle", "investissements_ide_mdt", "libelle", "IDE", "unite", "MDT"),
            Map.of("cle", "part_marche_regional_pct", "libelle", "Part de marché régionale", "unite", "%"));

    @GetMapping("/secteurs/{id}/chiffres-cles")
    public Map<String, Object> lireChiffres(@PathVariable Long id) {
        Map<String, Object> reponse = new HashMap<>();
        reponse.put("chiffresCles", chiffres.findBySecteurId(id).orElse(null));
        reponse.put("champs", CHAMPS_CHIFFRES);
        return reponse;
    }

    @PutMapping("/secteurs/{id}/chiffres-cles")
    public Map<String, Object> enregistrerChiffres(@PathVariable Long id, @RequestBody ChiffresCles demande) {
        exigerSecteur(id);
        ChiffresCles cible = chiffres.findBySecteurId(id)
                .orElseGet(() -> ChiffresCles.builder().secteurId(id).createdAt(LocalDateTime.now()).build());

        cible.setContributionPibPct(demande.getContributionPibPct());
        cible.setCroissanceAnnuellePct(demande.getCroissanceAnnuellePct());
        cible.setNombreEmplois(demande.getNombreEmplois());
        cible.setExportationsMdt(demande.getExportationsMdt());
        cible.setNombreEntreprises(demande.getNombreEntreprises());
        cible.setInvestissementsIdeMdt(demande.getInvestissementsIdeMdt());
        cible.setPartMarcheRegionalPct(demande.getPartMarcheRegionalPct());
        cible.setUpdatedAt(LocalDateTime.now());

        return Map.of("chiffresCles", chiffres.save(cible));
    }

    // ── Séries statistiques ─────────────────────────────────────────────────

    @GetMapping("/secteurs/{id}/statistiques")
    public Map<String, Object> listerStatistiques(@PathVariable Long id) {
        return Map.of("statistiques", statistiques.findBySecteurIdOrderByIndicateur(id));
    }

    @PutMapping("/statistiques/{statId}")
    public Map<String, Object> modifierStatistique(@PathVariable Long statId,
                                                   @RequestBody DonneeStatistique demande) {
        DonneeStatistique ligne = statistiques.findById(statId)
                .orElseThrow(() -> ApiException.notFound("Série introuvable"));

        // Seules les valeurs OBSERVÉES sont modifiables à la main. Les
        // projections restent la sortie du calcul : les saisir effacerait la
        // distinction entre donnée publiée et estimation, qui est le socle de
        // la crédibilité du rapport.
        ligne.setValeur2020(demande.getValeur2020());
        ligne.setValeur2021(demande.getValeur2021());
        ligne.setValeur2022(demande.getValeur2022());
        ligne.setValeur2023(demande.getValeur2023());
        ligne.setValeur2024(demande.getValeur2024());
        if (demande.getUnite() != null) ligne.setUnite(demande.getUnite());
        if (demande.getSource() != null) ligne.setSource(demande.getSource());
        ligne.setUpdatedAt(LocalDateTime.now());

        return Map.of("statistique", statistiques.save(ligne));
    }

    // ── Zones, acteurs, cadre réglementaire ─────────────────────────────────

    @GetMapping("/secteurs/{id}/zones")
    public Map<String, Object> listerZones(@PathVariable Long id) {
        return Map.of("zones", zones.findBySecteurIdAndEstActifTrueOrderByNom(id));
    }

    @PostMapping("/secteurs/{id}/zones")
    public Map<String, Object> creerZone(@PathVariable Long id, @RequestBody ZoneGeographique zone) {
        exigerSecteur(id);
        zone.setId(null);
        zone.setSecteurId(id);
        zone.setEstActif(true);
        zone.setCreatedAt(LocalDateTime.now());
        return Map.of("zone", zones.save(zone));
    }

    @GetMapping("/secteurs/{id}/acteurs")
    public Map<String, Object> listerActeurs(@PathVariable Long id) {
        return Map.of("acteurs", acteurs.findBySecteurIdOrderByNom(id));
    }

    @PostMapping("/secteurs/{id}/acteurs")
    public Map<String, Object> creerActeur(@PathVariable Long id, @RequestBody ActeurPrincipal acteur) {
        exigerSecteur(id);
        acteur.setId(null);
        acteur.setSecteurId(id);
        acteur.setCreatedAt(LocalDateTime.now());
        return Map.of("acteur", acteurs.save(acteur));
    }

    @GetMapping("/secteurs/{id}/cadre")
    public Map<String, Object> listerCadre(@PathVariable Long id) {
        return Map.of("cadre", cadres.findBySecteurIdAndEstEnVigueurTrueOrderByAnneeDesc(id));
    }

    @PostMapping("/secteurs/{id}/cadre")
    public Map<String, Object> creerCadre(@PathVariable Long id, @RequestBody CadreReglementaire texte) {
        exigerSecteur(id);
        texte.setId(null);
        texte.setSecteurId(id);
        texte.setEstEnVigueur(true);
        texte.setCreatedAt(LocalDateTime.now());
        return Map.of("cadre", cadres.save(texte));
    }

    /**
     * Suppression d'un élément de données sectorielles.
     * La liste des tables concernées est fermée : accepter un nom de table
     * fourni par le client ouvrirait la porte à la suppression de n'importe
     * quelle ligne de la base.
     */
    @DeleteMapping("/{kind}/{itemId}")
    public Map<String, Object> supprimer(@PathVariable String kind, @PathVariable Long itemId) {
        switch (kind) {
            case "zones" -> zones.deleteById(itemId);
            case "acteurs" -> acteurs.deleteById(itemId);
            case "cadre" -> cadres.deleteById(itemId);
            default -> throw ApiException.badRequest("Type d'élément inconnu : " + kind);
        }
        return Map.of("success", true);
    }

    // ── Comparatif régional ─────────────────────────────────────────────────

    @GetMapping("/secteurs/{id}/benchmarks")
    public Map<String, Object> listerBenchmarks(@PathVariable Long id) {
        List<BenchmarkRegional> lignes = benchmarks.findBySecteurIdOrderByIndicateur(id);
        long renseignes = lignes.stream()
                .filter(b -> b.getValeurMaroc() != null || b.getValeurEgypte() != null)
                .count();
        Map<String, Object> reponse = new HashMap<>();
        reponse.put("benchmarks", lignes);
        reponse.put("renseignes", renseignes);
        reponse.put("total", lignes.size());
        return reponse;
    }

    @PutMapping("/benchmarks/{benchmarkId}")
    public Map<String, Object> modifierBenchmark(@PathVariable Long benchmarkId,
                                                 @RequestBody BenchmarkRegional demande) {
        BenchmarkRegional ligne = benchmarks.findById(benchmarkId)
                .orElseThrow(() -> ApiException.notFound("Indicateur comparatif introuvable"));

        ligne.setAnnee(demande.getAnnee());
        ligne.setValeurTunisie(demande.getValeurTunisie());
        ligne.setValeurMaroc(demande.getValeurMaroc());
        ligne.setValeurEgypte(demande.getValeurEgypte());
        ligne.setSource(demande.getSource());
        ligne.setCommentaire(demande.getCommentaire());
        ligne.setUpdatedAt(LocalDateTime.now());

        return Map.of("benchmark", benchmarks.save(ligne));
    }

    // ── Projections et régénération ─────────────────────────────────────────

    @PostMapping("/secteurs/{id}/projections")
    public JsonNode recalculerProjections(@PathVariable Long id) {
        exigerSecteur(id);
        return moteur.recalculerProjections(id);
    }

    @PostMapping("/secteurs/{id}/regenerer")
    public JsonNode regenerer(@PathVariable Long id) {
        exigerSecteur(id);
        // Régénération administrative : aucun achat n'est exigé, c'est une
        // opération de maintenance du catalogue et non une vente.
        return moteur.reconstruireRapport(null, Map.of("sectorId", id));
    }

    // ── Rapports ────────────────────────────────────────────────────────────

    @GetMapping("/rapports")
    public Map<String, Object> listerRapports() {
        return Map.of("rapports", rapports.findTop50ByOrderByDateGenerationDesc());
    }

    /**
     * Les sept sections rédigées d'un rapport, dans l'ordre du document.
     *
     * Cette liste est la SOURCE UNIQUE côté backend : l'écran de correction
     * s'y fie pour construire ses champs. Elle doit rester alignée sur
     * SECTION_KEYS du moteur de rapports.
     */
    private static final List<String> SECTIONS_REDIGEES = List.of(
            "introduction", "tendances", "opportunites", "risques",
            "benchmarking", "recommandations", "perspectives");

    /**
     * Rapport enrichi pour l'écran de correction.
     *
     * L'entité brute ne suffisait pas : la page attend le nom du secteur, la
     * liste des sections et leurs textes. Servir la ligne telle quelle faisait
     * échouer l'écran sur `rapport.sections.map(...)` — page blanche, sans
     * message, alors que le rapport existait bien.
     */
    @GetMapping("/rapports/{rapportId}")
    public Map<String, Object> lireRapport(@PathVariable Long rapportId) {
        Rapport rapport = rapports.findById(rapportId)
                .orElseThrow(() -> ApiException.notFound("Rapport introuvable"));

        Map<String, Object> vue = new HashMap<>();
        vue.put("id", rapport.getId());
        vue.put("secteurId", rapport.getSecteurId());
        vue.put("secteur", secteurs.findById(rapport.getSecteurId())
                .map(Secteur::getNom).orElse(rapport.getTitre()));
        vue.put("titre", rapport.getTitre());
        vue.put("cheminFichier", rapport.getCheminFichier());
        vue.put("tailleFichier", rapport.getTailleFichier());
        vue.put("nombrePages", rapport.getNombrePages());
        vue.put("statut", rapport.getStatut());
        vue.put("dateGeneration", rapport.getDateGeneration());
        vue.put("sections", SECTIONS_REDIGEES);
        vue.put("narratives", lireNarratives(rapport.getContenuIa()));

        return Map.of("rapport", vue);
    }

    /**
     * Textes rédigés, désérialisés depuis le JSONB.
     * Un contenu illisible ne doit pas rendre l'écran inaccessible : on rend
     * des sections vides, que le correcteur pourra remplir — c'est justement
     * la raison d'être de cet écran.
     */
    private Map<String, String> lireNarratives(String contenuIa) {
        if (contenuIa == null || contenuIa.isBlank()) return Map.of();
        try {
            JsonNode arbre = json.readTree(contenuIa);
            Map<String, String> textes = new HashMap<>();
            SECTIONS_REDIGEES.forEach((cle) -> {
                JsonNode valeur = arbre.path(cle);
                if (!valeur.isMissingNode() && !valeur.isNull()) textes.put(cle, valeur.asText(""));
            });
            return textes;
        } catch (Exception ex) {
            log.warn("Contenu rédigé du rapport illisible : {}", ex.getMessage());
            return Map.of();
        }
    }

    public record CorrectionRapport(Object narratives) {
    }

    /**
     * Reconstruit un PDF à partir de sections corrigées à la main.
     * Dernier recours quand le service de rédaction a échoué sur un rapport
     * déjà payé : mieux vaut une saisie manuelle qu'un client sans livrable.
     */
    @PutMapping("/rapports/{rapportId}")
    public JsonNode corrigerRapport(@PathVariable Long rapportId, @RequestBody CorrectionRapport demande) {
        rapports.findById(rapportId).orElseThrow(() -> ApiException.notFound("Rapport introuvable"));
        return moteur.reconstruireRapport(rapportId, demande.narratives());
    }

    // ── Comptes ─────────────────────────────────────────────────────────────

    @GetMapping("/comptes")
    public Map<String, Object> listerComptes() {
        return Map.of("comptes", comptes.lister().stream().map(CompteDto::de).toList());
    }

    public record ChangementRole(String role) {
    }

    @PutMapping("/comptes/{id}/role")
    public Map<String, Object> changerRole(@PathVariable Long id, @RequestBody ChangementRole demande) {
        return Map.of("compte", CompteDto.de(
                comptes.changerRole(id, demande.role(), CompteCourant.exige().getId())));
    }

    // ── Pilotage ────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public Map<String, Object> statistiques() {
        List<Map<String, Object>> parSecteur = ventes.statistiquesVentes();

        Map<String, Object> reponse = new HashMap<>();
        reponse.put("parSecteur", parSecteur);
        reponse.put("totaux", consolider(parSecteur));
        reponse.put("chiffreAffaires", ventes.chiffreAffairesReel());
        reponse.put("devise", properties.getDevise());
        reponse.put("rapportsRecents", rapports.findTop50ByOrderByDateGenerationDesc());
        return reponse;
    }

    /**
     * Totaux consolides.
     *
     * Le reel et le simule sont sommes SEPAREMENT, et le total est expose en
     * plus des deux : additionner les deux sans le dire donnerait un chiffre
     * d'affaires mensonger, ne montrer que le reel laisserait le tableau de
     * bord entierement a zero en mode demonstration. L'interface a besoin des
     * trois pour dire la verite dans les deux situations.
     */
    private Map<String, Object> consolider(List<Map<String, Object>> parSecteur) {
        long ventesReelles = 0;
        long ventesSimulees = 0;
        long rapportsGeneres = 0;
        double revenuReel = 0;
        double revenuSimule = 0;

        for (Map<String, Object> secteur : parSecteur) {
            ventesReelles += nombre(secteur.get("nb_ventes")).longValue();
            ventesSimulees += nombre(secteur.get("nb_ventes_simulees")).longValue();
            rapportsGeneres += nombre(secteur.get("nb_rapports_generes")).longValue();
            revenuReel += nombre(secteur.get("revenu")).doubleValue();
            revenuSimule += nombre(secteur.get("revenu_simule")).doubleValue();
        }

        Map<String, Object> totaux = new HashMap<>();
        totaux.put("nb_ventes", ventesReelles);
        totaux.put("revenu", arrondi(revenuReel));
        totaux.put("nb_ventes_simulees", ventesSimulees);
        totaux.put("revenu_simule", arrondi(revenuSimule));
        totaux.put("nb_ventes_total", ventesReelles + ventesSimulees);
        totaux.put("revenu_total", arrondi(revenuReel + revenuSimule));
        totaux.put("nb_rapports_generes", rapportsGeneres);
        return totaux;
    }

    private static Number nombre(Object valeur) {
        return valeur instanceof Number n ? n : 0;
    }

    private static double arrondi(double valeur) {
        return Math.round(valeur * 100.0) / 100.0;
    }

    /** État des services externes : paiement et moteur de rédaction. */
    @GetMapping("/systeme")
    public Map<String, Object> systeme() {
        Map<String, Object> reponse = new HashMap<>();
        reponse.put("paiement", Map.of(
                "mode", properties.getPaypal().getMode(),
                "environnement", properties.getPaypal().getEnv(),
                "configure", properties.getPaypal().isConfigure(),
                "argentReel", properties.getPaypal().isArgentReel(),
                "devise", properties.getDevise()));

        JsonNode etatMoteur = moteur.etat();
        reponse.put("moteurRapports", etatMoteur != null ? etatMoteur : Map.of("joignable", false));
        return reponse;
    }
}
