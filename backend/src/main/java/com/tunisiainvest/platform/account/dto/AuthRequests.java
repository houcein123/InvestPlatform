package com.tunisiainvest.platform.account.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Corps de requête du parcours d'authentification. */
public final class AuthRequests {

    private AuthRequests() {
    }

    public record Inscription(
            String email,
            @JsonProperty("mot_de_passe") String motDePasse,
            String nom,
            String prenom,
            String entreprise,
            String pays,
            String telephone) {
    }

    public record Connexion(
            String email,
            @JsonProperty("mot_de_passe") String motDePasse) {
    }

    public record MiseAJourProfil(
            String nom,
            String prenom,
            String entreprise,
            String pays,
            String telephone) {
    }

    public record ChangementMotDePasse(
            @JsonProperty("mot_de_passe_actuel") String motDePasseActuel,
            @JsonProperty("nouveau_mot_de_passe") String nouveauMotDePasse) {
    }
}
