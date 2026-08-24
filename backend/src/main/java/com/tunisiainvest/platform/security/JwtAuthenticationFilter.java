package com.tunisiainvest.platform.security;

import java.io.IOException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.tunisiainvest.platform.account.Utilisateur;
import com.tunisiainvest.platform.account.UtilisateurRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Vérifie le jeton porteur puis RECHARGE le compte en base.
 *
 * Le rôle n'est jamais lu depuis le jeton : c'est ce rechargement qui garantit
 * qu'un compte désactivé ou rétrogradé perd ses droits sur-le-champ.
 * Un jeton absent ou invalide ne bloque pas la requête — les routes publiques
 * (catalogue, aperçu) doivent rester accessibles ; c'est la configuration de
 * sécurité qui décide de ce qui exige une authentification.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UtilisateurRepository comptes;

    public JwtAuthenticationFilter(JwtService jwtService, UtilisateurRepository comptes) {
        this.jwtService = jwtService;
        this.comptes = comptes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String entete = request.getHeader("Authorization");
        if (entete != null && entete.startsWith("Bearer ")) {
            Long idCompte = jwtService.lireIdCompte(entete.substring(7));
            if (idCompte != null) {
                comptes.findById(idCompte)
                        .filter(Utilisateur::getEstActif)
                        .ifPresent(compte -> SecurityContextHolder.getContext()
                                .setAuthentication(new CompteAuthentifie(compte)));
            }
        }

        chain.doFilter(request, response);
    }
}
