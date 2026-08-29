package com.tunisiainvest.platform.analyse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tunisiainvest.platform.catalogue.Secteur;
import com.tunisiainvest.platform.catalogue.SecteurRepository;
import com.tunisiainvest.platform.sectordata.BenchmarkRegional;
import com.tunisiainvest.platform.sectordata.ChiffresCles;
import com.tunisiainvest.platform.sectordata.BenchmarkRepository;
import com.tunisiainvest.platform.sectordata.ChiffresClesRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Analyse comparative — /api/analyse
 *
 * PUBLIC, et c'est délibéré. Ces écrans montrent ce que la plateforme sait
 * faire : un investisseur qui compare six secteurs avant de payer comprend la
 * valeur du rapport. Les mettre derrière un compte reviendrait à demander de
 * s'inscrire pour savoir si le service vaut quelque chose.
 *
 * Aucune section rédigée n'y figure : ce sont des données brutes et leurs
 * sources, pas l'analyse vendue dans le rapport.
 */
@RestController
@RequestMapping("/api/analyse")
@Tag(name = "Analyse", description = "Comparaison sectorielle et régionale")
public class AnalyseController {

    private final SecteurRepository secteurs;
    private final ChiffresClesRepository chiffres;
    private final BenchmarkRepository benchmarks;

    public AnalyseController(SecteurRepository secteurs, ChiffresClesRepository chiffres,
                             BenchmarkRepository benchmarks) {
        this.secteurs = secteurs;
        this.chiffres = chiffres;
        this.benchmarks = benchmarks;
    }

    /** Les six secteurs et leurs indicateurs agrégés, pour le comparateur. */
    @GetMapping("/secteurs")
    @Operation(summary = "Indicateurs clés des secteurs actifs")
    public Map<String, Object> comparateur() {
        List<Map<String, Object>> lignes = new ArrayList<>();

        for (Secteur secteur : secteurs.findByEstActifTrueOrderById()) {
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("id", secteur.getId());
            ligne.put("slug", secteur.getSlug());
            ligne.put("nom", secteur.getNom());
            ligne.put("description", secteur.getDescription());
            // Les libelles anglais accompagnent le francais : le comparateur
            // affichait des noms de secteurs francais en mode anglais, parce
            // que cette reponse est construite champ par champ et les omettait.
            ligne.put("nom_en", secteur.getNomEn());
            ligne.put("description_en", secteur.getDescriptionEn());
            ligne.put("prix_rapport", secteur.getPrixRapport());

            // Un secteur sans chiffres clés apparaît quand même, avec des cases
            // vides : le masquer laisserait croire qu'il n'existe pas.
            ChiffresCles c = chiffres.findBySecteurId(secteur.getId()).orElse(null);
            ligne.put("contribution_pib_pct", c == null ? null : c.getContributionPibPct());
            ligne.put("croissance_annuelle_pct", c == null ? null : c.getCroissanceAnnuellePct());
            ligne.put("nombre_emplois", c == null ? null : c.getNombreEmplois());
            ligne.put("exportations_mdt", c == null ? null : c.getExportationsMdt());
            ligne.put("nombre_entreprises", c == null ? null : c.getNombreEntreprises());
            ligne.put("investissements_ide_mdt", c == null ? null : c.getInvestissementsIdeMdt());
            ligne.put("part_marche_regional_pct", c == null ? null : c.getPartMarcheRegionalPct());

            lignes.add(ligne);
        }

        return Map.of("secteurs", lignes);
    }

    /**
     * Comparatif régional Tunisie / Maroc / Égypte, groupé par secteur.
     *
     * Seules les lignes portant au moins une valeur étrangère sont renvoyées :
     * une ligne vide n'apporte rien à un lecteur et laisserait croire à une
     * donnée manquante plutôt qu'à une donnée non publiée.
     */
    @GetMapping("/regional")
    @Operation(summary = "Comparatif Tunisie / Maroc / Égypte")
    public Map<String, Object> regional() {
        List<Map<String, Object>> groupes = new ArrayList<>();

        for (Secteur secteur : secteurs.findByEstActifTrueOrderById()) {
            List<Map<String, Object>> indicateurs = new ArrayList<>();

            for (BenchmarkRegional b : benchmarks.findBySecteurIdOrderByIndicateur(secteur.getId())) {
                boolean exploitable = b.getValeurTunisie() != null
                        && (b.getValeurMaroc() != null || b.getValeurEgypte() != null);
                if (!exploitable) continue;

                Map<String, Object> indicateur = new LinkedHashMap<>();
                indicateur.put("id", b.getId());
                indicateur.put("indicateur", b.getIndicateur());
                indicateur.put("unite", b.getUnite());
                indicateur.put("indicateur_en", b.getIndicateurEn());
                indicateur.put("unite_en", b.getUniteEn());
                indicateur.put("annee", b.getAnnee());
                indicateur.put("tunisie", b.getValeurTunisie());
                indicateur.put("maroc", b.getValeurMaroc());
                indicateur.put("egypte", b.getValeurEgypte());
                // La source accompagne la donnée : un chiffre sans provenance
                // n'a aucune valeur dans un document d'investissement.
                indicateur.put("source", b.getSource());
                indicateur.put("source_en", b.getSourceEn());
                indicateurs.add(indicateur);
            }

            if (indicateurs.isEmpty()) continue;

            Map<String, Object> groupe = new HashMap<>();
            groupe.put("secteurId", secteur.getId());
            groupe.put("slug", secteur.getSlug());
            groupe.put("secteur", secteur.getNom());
            groupe.put("secteur_en", secteur.getNomEn());
            groupe.put("indicateurs", indicateurs);
            groupes.add(groupe);
        }

        return Map.of("groupes", groupes);
    }
}
