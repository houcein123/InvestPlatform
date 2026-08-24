package com.tunisiainvest.platform.security;

import java.util.List;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.tunisiainvest.platform.account.Utilisateur;

/**
 * Authentification portant le compte rechargé depuis la base.
 * Les contrôleurs récupèrent ainsi l'entité complète sans requête supplémentaire.
 */
public class CompteAuthentifie extends AbstractAuthenticationToken {

    private final transient Utilisateur compte;

    public CompteAuthentifie(Utilisateur compte) {
        super(List.of(new SimpleGrantedAuthority("ROLE_" + compte.getRole().toUpperCase())));
        this.compte = compte;
        setAuthenticated(true);
    }

    public Utilisateur getCompte() {
        return compte;
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return compte;
    }
}
