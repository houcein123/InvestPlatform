package com.tunisiainvest.platform.sectordata;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/** Zone géographique ou zone franche (section 6 du rapport). */
@Entity
@Table(name = "zones_geographiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneGeographique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String type;

    private String gouvernorat;

    @JsonProperty("superficie_km2")
    @Column(name = "superficie_km2")
    private BigDecimal superficieKm2;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String avantages;

    @JsonProperty("est_actif")
    @Column(name = "est_actif")
    @Builder.Default
    private Boolean estActif = true;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
