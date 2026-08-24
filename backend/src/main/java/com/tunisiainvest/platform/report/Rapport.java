package com.tunisiainvest.platform.report;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
 * Rapport PDF produit pour un secteur.
 *
 * L'écriture de cette table appartient au moteur de rapports (service Node) :
 * c'est lui qui fabrique le fichier et connaît le résultat de chaque section.
 * Le backend la lit pour alimenter l'espace client et le panneau de contrôle.
 */
@Entity
@Table(name = "rapports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("utilisateur_id")
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @JsonProperty("secteur_id")
    @Column(name = "secteur_id", nullable = false)
    private Long secteurId;

    @Column(nullable = false)
    private String titre;

    @JsonProperty("chemin_fichier")
    @Column(name = "chemin_fichier")
    private String cheminFichier;

    @JsonProperty("taille_fichier")
    @Column(name = "taille_fichier")
    private Integer tailleFichier;

    @JsonProperty("nombre_pages")
    @Column(name = "nombre_pages")
    private Integer nombrePages;

    private String statut;

    /**
     * Textes rédigés du rapport, section par section (JSONB).
     *
     * Écrits par le moteur ; relus ici pour alimenter l'écran de correction du
     * panneau de contrôle, qui permet de reprendre à la main une section que le
     * service de rédaction n'a pas produite.
     */
    @JsonIgnore
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "contenu_ia", columnDefinition = "jsonb")
    private String contenuIa;

    @JsonProperty("date_generation")
    @Column(name = "date_generation")
    private LocalDateTime dateGeneration;

    @JsonProperty("date_achat")
    @Column(name = "date_achat")
    private LocalDateTime dateAchat;

    @JsonProperty("est_telecharge")
    @Column(name = "est_telecharge")
    private Boolean estTelecharge;

    @JsonProperty("date_telechargement")
    @Column(name = "date_telechargement")
    private LocalDateTime dateTelechargement;
}
