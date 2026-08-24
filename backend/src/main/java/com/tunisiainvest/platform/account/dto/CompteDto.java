package com.tunisiainvest.platform.account.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.tunisiainvest.platform.account.Utilisateur;

/**
 * Vue publique d'un compte.
 *
 * Les noms de champs sont ceux des colonnes SQL, en snake_case : le frontend
 * lisait jusqu'ici les lignes renvoyées telles quelles par PostgreSQL, et ce
 * contrat est conservé à l'identique pour que le passage à Spring Boot ne
 * demande aucune retouche côté navigateur.
 *
 * L'empreinte du mot de passe n'y figure évidemment pas.
 */
public record CompteDto(
        Long id,
        String email,
        String nom,
        String prenom,
        String entreprise,
        String pays,
        String telephone,
        String role,
        @JsonProperty("est_actif") Boolean estActif,
        @JsonProperty("est_verifie") Boolean estVerifie,
        @JsonProperty("derniere_connexion") LocalDateTime derniereConnexion,
        @JsonProperty("created_at") LocalDateTime createdAt) {

    public static CompteDto de(Utilisateur compte) {
        return new CompteDto(
                compte.getId(),
                compte.getEmail(),
                compte.getNom(),
                compte.getPrenom(),
                compte.getEntreprise(),
                compte.getPays(),
                compte.getTelephone(),
                compte.getRole(),
                compte.getEstActif(),
                compte.getEstVerifie(),
                compte.getDerniereConnexion(),
                compte.getCreatedAt());
    }
}
