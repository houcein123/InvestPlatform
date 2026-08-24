package com.tunisiainvest.platform.payment;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
 * Notification reçue de PayPal.
 *
 * Conservée intégralement : c'est la seule preuve de ce que PayPal a réellement
 * annoncé, et `event_id` unique rend le traitement idempotent — PayPal rejoue
 * ses notifications jusqu'à obtenir un 200, parfois plusieurs fois.
 */
@Entity
@Table(name = "paypal_webhooks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaypalWebhook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "signature_verifiee", nullable = false)
    private Boolean signatureVerifiee;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String payload;

    @Column(name = "traite_le")
    private LocalDateTime traiteLe;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
