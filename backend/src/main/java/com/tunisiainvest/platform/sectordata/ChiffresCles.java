package com.tunisiainvest.platform.sectordata;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/** Indicateurs agrégés affichés en cartes KPI dans le rapport et le tableau de bord. */
@Entity
@Table(name = "chiffres_cles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiffresCles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @JsonProperty("contribution_pib_pct")
    @Column(name = "contribution_pib_pct")
    private BigDecimal contributionPibPct;

    @JsonProperty("croissance_annuelle_pct")
    @Column(name = "croissance_annuelle_pct")
    private BigDecimal croissanceAnnuellePct;

    @JsonProperty("nombre_emplois")
    @Column(name = "nombre_emplois")
    private Integer nombreEmplois;

    @JsonProperty("exportations_mdt")
    @Column(name = "exportations_mdt")
    private BigDecimal exportationsMdt;

    @JsonProperty("nombre_entreprises")
    @Column(name = "nombre_entreprises")
    private Integer nombreEntreprises;

    @JsonProperty("investissements_ide_mdt")
    @Column(name = "investissements_ide_mdt")
    private BigDecimal investissementsIdeMdt;

    @JsonProperty("part_marche_regional_pct")
    @Column(name = "part_marche_regional_pct")
    private BigDecimal partMarcheRegionalPct;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
