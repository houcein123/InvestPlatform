package com.tunisiainvest.platform.catalogue;

import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tunisiainvest.platform.common.ApiException;
import com.tunisiainvest.platform.report.ReportEngineClient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Catalogue public — /api/catalogue (CDC §3)
 *
 * Les 6 secteurs, leur prix, leur nombre de pages, leur date de mise à jour,
 * et l'aperçu gratuit de 2 pages.
 *
 * L'aperçu est produit par les mêmes fonctions que le rapport payant :
 * l'acheteur voit exactement les deux premières pages de ce qu'il achètera.
 */
@RestController
@RequestMapping("/api/catalogue")
@Tag(name = "Catalogue", description = "Les 6 secteurs et leur aperçu gratuit")
public class CatalogueController {

    private final SecteurRepository secteurs;
    private final ReportEngineClient moteur;

    public CatalogueController(SecteurRepository secteurs, ReportEngineClient moteur) {
        this.secteurs = secteurs;
        this.moteur = moteur;
    }

    @GetMapping
    @Operation(summary = "Les 6 secteurs actifs du catalogue")
    public Map<String, Object> catalogue() {
        return Map.of("secteurs", secteurs.findByEstActifTrueOrderById());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fiche d'un secteur")
    public Map<String, Object> secteur(@PathVariable Long id) {
        Secteur secteur = secteurs.findById(id)
                .filter(s -> Boolean.TRUE.equals(s.getEstActif()))
                .orElseThrow(() -> ApiException.notFound("Secteur introuvable"));
        return Map.of("secteur", secteur);
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Aperçu gratuit : couverture et sommaire, en PDF")
    public ResponseEntity<byte[]> apercu(@PathVariable Long id) {
        Secteur secteur = secteurs.findById(id)
                .filter(s -> Boolean.TRUE.equals(s.getEstActif()))
                .orElseThrow(() -> ApiException.notFound("Secteur introuvable"));

        byte[] pdf = moteur.apercu(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename("apercu-" + secteur.getSlug() + ".pdf")
                        .build()
                        .toString())
                .body(pdf);
    }
}
