package com.tunisiainvest.platform.security;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tunisiainvest.platform.account.Utilisateur;
import com.tunisiainvest.platform.common.ApiException;

/**
 * Accès au compte de la requête en cours.
 *
 * Deux lectures distinctes, et la distinction compte :
 *   - {@link #optionnel()} sur le parcours d'achat, ouvert aux visiteurs ;
 *   - {@link #exige()} partout où un compte est nécessaire.
 */
public final class CompteCourant {

    private CompteCourant() {
    }

    public static Optional<Utilisateur> optionnel() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof CompteAuthentifie compte) {
            return Optional.of(compte.getCompte());
        }
        return Optional.empty();
    }

    public static Utilisateur exige() {
        return optionnel().orElseThrow(() -> ApiException.unauthorized("Connexion requise"));
    }

    /** Identifiant du compte connecté, ou null pour un visiteur anonyme. */
    public static Long idOuNull() {
        return optionnel().map(Utilisateur::getId).orElse(null);
    }
}
