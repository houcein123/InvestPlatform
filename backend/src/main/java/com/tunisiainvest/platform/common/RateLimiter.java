package com.tunisiainvest.platform.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Plafond de tentatives par adresse IP, en memoire.
 *
 * bcrypt ralentit chaque verification de mot de passe mais n'empeche pas d'en
 * enchainer des milliers : sans plafond, l'essai systematique reste ouvert.
 *
 * Stockage local au processus, comme l'implementation Express d'origine :
 * suffisant pour un service mono-instance. Derriere plusieurs repliques il
 * faudra un compteur partage (Redis) - le point est signale ici plutot que
 * decouvert en production.
 */
@Component
public class RateLimiter {

    private record Fenetre(Instant debut, AtomicInteger compte) {
    }

    private final Map<String, Fenetre> fenetres = new ConcurrentHashMap<>();

    public void verifier(String cle, int max, Duration duree, String message) {
        Instant maintenant = Instant.now();

        Fenetre fenetre = fenetres.compute(cle, (ignore, existante) -> {
            if (existante == null || Duration.between(existante.debut(), maintenant).compareTo(duree) > 0) {
                return new Fenetre(maintenant, new AtomicInteger(0));
            }
            return existante;
        });

        if (fenetre.compte().incrementAndGet() > max) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
        }

        // Purge opportuniste : sans elle, la table grossit indefiniment avec les
        // adresses vues une seule fois.
        if (fenetres.size() > 10000) {
            fenetres.entrySet().removeIf(entree ->
                    Duration.between(entree.getValue().debut(), maintenant).compareTo(duree) > 0);
        }
    }
}
