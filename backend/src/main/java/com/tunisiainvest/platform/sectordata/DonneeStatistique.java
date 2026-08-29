package com.tunisiainvest.platform.sectordata;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/**
 * Série temporelle importée des CSV de l'INS.
 *
 * DISTINCTION FONDAMENTALE, respectée de la base jusqu'au PDF :
 *   valeur_YYYY     -> donnée OBSERVÉE, publiée par la source officielle ;
 *   projection_YYYY -> ESTIMATION calculée par le moteur de projections.
 *
 * L'interface et le rapport les présentent différemment et ne les confondent
 * jamais. `methodeProjection` et `fiabiliteR2` tracent le modèle retenu et la
 * qualité de son ajustement : une estimation sans traçabilité serait
 * indiscernable d'une donnée publiée.
 */
@Entity
@Table(name = "donnees_statistiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonneeStatistique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @Column(nullable = false)
    private String indicateur;

    private String unite;

    @JsonProperty("valeur_2020") @Column(name = "valeur_2020") private BigDecimal valeur2020;
    @JsonProperty("valeur_2021") @Column(name = "valeur_2021") private BigDecimal valeur2021;
    @JsonProperty("valeur_2022") @Column(name = "valeur_2022") private BigDecimal valeur2022;
    @JsonProperty("valeur_2023") @Column(name = "valeur_2023") private BigDecimal valeur2023;
    @JsonProperty("valeur_2024") @Column(name = "valeur_2024") private BigDecimal valeur2024;

    @JsonProperty("projection_2024") @Column(name = "projection_2024") private BigDecimal projection2024;
    @JsonProperty("projection_2025") @Column(name = "projection_2025") private BigDecimal projection2025;
    @JsonProperty("projection_2026") @Column(name = "projection_2026") private BigDecimal projection2026;
    @JsonProperty("projection_2027") @Column(name = "projection_2027") private BigDecimal projection2027;
    @JsonProperty("projection_2028") @Column(name = "projection_2028") private BigDecimal projection2028;

    @JsonProperty("methode_projection")
    @Column(name = "methode_projection")
    private String methodeProjection;

    @JsonProperty("fiabilite_r2")
    @Column(name = "fiabilite_r2")
    private BigDecimal fiabiliteR2;

    @JsonProperty("projections_calculees_le")
    @Column(name = "projections_calculees_le")
    private LocalDateTime projectionsCalculeesLe;

    private String source;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    /*
     * Libellés anglais (migration 011).
     *
     * Servis à côté du français dans la même réponse, comme pour les secteurs :
     * négocier la langue côté serveur invaliderait le cache du frontend à
     * chaque bascule. NULL est normal — l'interface retombe alors sur le
     * français plutôt que d'afficher un vide.
     */
    @JsonProperty("indicateur_en")
    @Column(name = "indicateur_en")
    private String indicateurEn;

    @JsonProperty("unite_en")
    @Column(name = "unite_en")
    private String uniteEn;
}
