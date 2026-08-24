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
}
