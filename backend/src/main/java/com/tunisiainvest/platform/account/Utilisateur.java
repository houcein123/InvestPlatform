package com.tunisiainvest.platform.account;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
 * Compte — clients ET administrateurs, dans une seule table.
 *
 * C'est la colonne `role` qui décide de ce que la personne voit une fois
 * connectée. L'inscription publique crée toujours un « client » : le rôle
 * envoyé dans une requête d'inscription est ignoré, ce qui rend l'élévation
 * de privilèges impossible depuis le site.
 */
@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur {

    public static final String ROLE_CLIENT = "client";
    public static final String ROLE_ADMIN = "admin";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    /** Empreinte bcrypt. Jamais sérialisée vers le frontend. */
    @JsonIgnore
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    private String nom;
    private String prenom;
    private String entreprise;
    private String pays;
    private String telephone;

    @Column(nullable = false)
    @Builder.Default
    private String role = ROLE_CLIENT;

    @Column(name = "est_actif", nullable = false)
    @Builder.Default
    private Boolean estActif = true;

    @Column(name = "est_verifie")
    @Builder.Default
    private Boolean estVerifie = false;

    @Column(name = "derniere_connexion")
    private LocalDateTime derniereConnexion;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean estAdmin() {
        return ROLE_ADMIN.equals(role);
    }
}
