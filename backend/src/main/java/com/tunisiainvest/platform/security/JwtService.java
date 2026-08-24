package com.tunisiainvest.platform.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.tunisiainvest.platform.account.Utilisateur;
import com.tunisiainvest.platform.config.AppProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Émission et vérification des jetons de session.
 *
 * Le jeton ne porte que l'identifiant du compte. Le rôle n'y figure
 * volontairement pas : il est relu en base à chaque requête, si bien qu'un
 * compte rétrogradé ou désactivé perd ses droits immédiatement, sans attendre
 * l'expiration du jeton.
 */
@Service
public class JwtService {

    private final SecretKey cle;
    private final long dureeMs;

    public JwtService(AppProperties properties) {
        String secret = properties.getJwt().getSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET doit faire au moins 32 caractères : un secret court rend les jetons falsifiables.");
        }
        this.cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.dureeMs = properties.getJwt().getExpirationHours() * 3_600_000L;
    }

    public String emettre(Utilisateur compte) {
        Date maintenant = new Date();
        return Jwts.builder()
                .setSubject(String.valueOf(compte.getId()))
                .claim("email", compte.getEmail())
                .setIssuedAt(maintenant)
                .setExpiration(new Date(maintenant.getTime() + dureeMs))
                .signWith(cle)
                .compact();
    }

    /** @return l'identifiant du compte, ou null si le jeton est absent ou invalide. */
    public Long lireIdCompte(String jeton) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(cle)
                    .build()
                    .parseClaimsJws(jeton)
                    .getBody();
            return Long.valueOf(claims.getSubject());
        } catch (Exception ex) {
            // Jeton expiré, signature invalide, format inattendu : dans tous les
            // cas la requête est simplement traitée comme anonyme.
            return null;
        }
    }

    public long dureeSecondes() {
        return dureeMs / 1000;
    }
}
