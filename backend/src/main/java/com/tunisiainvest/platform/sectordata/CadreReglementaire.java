package com.tunisiainvest.platform.sectordata;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

/** Texte réglementaire ou fiscal applicable au secteur (section 5 du rapport). */
@Entity
@Table(name = "cadre_reglementaire")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadreReglementaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @Column(nullable = false)
    private String titre;

    private Integer annee;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String avantages;

    @Column(columnDefinition = "TEXT")
    private String obligations;

    @JsonProperty("type_texte")
    @Column(name = "type_texte")
    private String typeTexte;

    @JsonProperty("est_en_vigueur")
    @Column(name = "est_en_vigueur")
    @Builder.Default
    private Boolean estEnVigueur = true;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
