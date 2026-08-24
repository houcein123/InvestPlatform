package com.tunisiainvest.platform.catalogue;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un des 6 secteurs économiques du catalogue (CDC §2).
 *
 * Les noms JSON reprennent les colonnes SQL : le frontend consommait jusqu'ici
 * les lignes PostgreSQL telles quelles (`prix_rapport`, `nombre_pages`,
 * `date_maj`), et ce contrat est préservé au caractère près.
 */
@Entity
@Table(name = "secteurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Secteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String icone;

    @JsonProperty("prix_rapport")
    @Column(name = "prix_rapport", nullable = false)
    private BigDecimal prixRapport;

    @JsonProperty("nombre_pages")
    @Column(name = "nombre_pages")
    private Integer nombrePages;

    @JsonProperty("date_maj")
    @Column(name = "date_maj")
    private LocalDateTime dateMaj;

    @JsonProperty("est_actif")
    @Column(name = "est_actif")
    private Boolean estActif;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
