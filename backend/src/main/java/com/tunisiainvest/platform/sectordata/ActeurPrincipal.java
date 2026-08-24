package com.tunisiainvest.platform.sectordata;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/** Acteur principal du secteur (section 4 du rapport). */
@Entity
@Table(name = "acteurs_principaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActeurPrincipal {

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

    private String role;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JsonProperty("site_web")
    @Column(name = "site_web")
    private String siteWeb;

    @JsonProperty("chiffre_affaires")
    @Column(name = "chiffre_affaires")
    private BigDecimal chiffreAffaires;

    @JsonProperty("nombre_employes")
    @Column(name = "nombre_employes")
    private Integer nombreEmployes;

    @JsonProperty("est_national")
    @Column(name = "est_national")
    @Builder.Default
    private Boolean estNational = true;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
