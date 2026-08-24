package com.tunisiainvest.platform.common;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/**
 * Plafond de tentatives.
 *
 * bcrypt ralentit chaque verification de mot de passe mais n'empeche pas d'en
 * enchainer des milliers : sans ce plafond, l'essai systematique reste ouvert.
 */
class RateLimiterTest {

    @Test
    @DisplayName("les tentatives sous le plafond passent")
    void sousLePlafond() {
        RateLimiter limiteur = new RateLimiter();
        assertDoesNotThrow(() -> {
            for (int essai = 0; essai < 5; essai++) {
                limiteur.verifier("login:1.2.3.4", 5, Duration.ofMinutes(15), "trop d'essais");
            }
        });
    }

    @Test
    @DisplayName("la tentative de trop est refusee en 429")
    void auDelaDuPlafond() {
        RateLimiter limiteur = new RateLimiter();
        for (int essai = 0; essai < 3; essai++) {
            limiteur.verifier("login:1.2.3.4", 3, Duration.ofMinutes(15), "trop d'essais");
        }

        ApiException refus = assertThrows(ApiException.class,
                () -> limiteur.verifier("login:1.2.3.4", 3, Duration.ofMinutes(15), "trop d'essais"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, refus.getStatus());
    }

    @Test
    @DisplayName("le compteur est propre a chaque appelant")
    void compteurParAppelant() {
        RateLimiter limiteur = new RateLimiter();
        limiteur.verifier("login:1.1.1.1", 1, Duration.ofMinutes(15), "trop d'essais");

        // Une autre adresse ne doit pas heriter du compteur de la precedente,
        // sans quoi un seul attaquant bloquerait tous les utilisateurs.
        assertDoesNotThrow(() -> limiteur.verifier("login:2.2.2.2", 1, Duration.ofMinutes(15), "trop d'essais"));
    }

    @Test
    @DisplayName("la fenetre expiree remet le compteur a zero")
    void fenetreExpiree() throws InterruptedException {
        RateLimiter limiteur = new RateLimiter();
        limiteur.verifier("login:3.3.3.3", 1, Duration.ofMillis(50), "trop d'essais");
        Thread.sleep(80);
        assertDoesNotThrow(() -> limiteur.verifier("login:3.3.3.3", 1, Duration.ofMillis(50), "trop d'essais"));
    }
}
