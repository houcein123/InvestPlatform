package com.tunisiainvest.platform.common;

import org.springframework.http.HttpStatus;

/**
 * Erreur métier portant son propre code HTTP.
 *
 * Un refus de paiement (402) ou une commande qui ne correspond pas à l'achat
 * présenté (409) sont des situations prévues, pas des pannes : elles ne doivent
 * jamais ressortir en 500, sans quoi le frontend ne peut pas les distinguer
 * d'un serveur en défaut.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    /** 402 — le paiement est requis ou n'a pas abouti. */
    public static ApiException paiementRequis(String message) {
        return new ApiException(HttpStatus.PAYMENT_REQUIRED, message);
    }

    public static ApiException indisponible(String message) {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
