package com.tunisiainvest.platform.sectordata;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/**
 * Comparatif régional Tunisie / Maroc / Égypte (CDC §4).
 *
 * Les lignes sont créées VIDES, avec seulement l'indicateur et son unité :
 * c'est à l'administrateur de saisir des valeurs sourcées. Tant qu'une valeur
 * manque, le prompt impose au modèle de traiter la comparaison de façon
 * qualitative plutôt que d'inventer un chiffre — dans un rapport vendu, une
 * valeur fabriquée est la pire des sorties possibles.
 */
@Entity
@Table(name = "benchmarks_regionaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkRegional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @Column(nullable = false)
    private String indicateur;

    private String unite;

    private Integer annee;

    @JsonProperty("valeur_tunisie")
    @Column(name = "valeur_tunisie")
    private BigDecimal valeurTunisie;

    @JsonProperty("valeur_maroc")
    @Column(name = "valeur_maroc")
    private BigDecimal valeurMaroc;

    @JsonProperty("valeur_egypte")
    @Column(name = "valeur_egypte")
    private BigDecimal valeurEgypte;

    private String source;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

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

    @JsonProperty("commentaire_en")
    @Column(name = "commentaire_en")
    private String commentaireEn;

    /**
     * Libellé anglais de la source (migration 012).
     *
     * Contrairement aux séries sectorielles, les sources du comparatif régional
     * sont des libellés composés (« Banque mondiale — World Development
     * Indicators »), pas des sigles : elles se traduisent.
     */
    @JsonProperty("source_en")
    @Column(name = "source_en")
    private String sourceEn;
}
