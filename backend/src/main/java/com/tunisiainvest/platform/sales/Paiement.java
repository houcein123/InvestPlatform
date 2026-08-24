package com.tunisiainvest.platform.sales;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonProperty;

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
 * Transaction rattachée à un achat — la trace comptable du règlement.
 *
 * AUCUN MOT DE PASSE N'EST STOCKÉ, et il ne doit jamais l'être : un marchand
 * n'a pas à connaître les identifiants PayPal de ses clients, c'est
 * précisément ce que la redirection vers le domaine de PayPal garantit. Seule
 * l'adresse du compte, qui identifie le payeur, est conservée.
 */
@Entity
@Table(name = "paiements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    public static final String COMPLETE = "complete";
    public static final String MONTANT_INSUFFISANT = "montant_insuffisant";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("achat_id")
    @Column(name = "achat_id")
    private Long achatId;

    @JsonProperty("utilisateur_id")
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Column(nullable = false)
    private BigDecimal montant;

    private String devise;

    /** « paypal » ou « simulation ». */
    private String methode;

    /** Identifiant de capture PayPal, ou référence de simulation. */
    @JsonProperty("transaction_id")
    @Column(name = "transaction_id")
    private String transactionId;

    private String statut;

    @JsonProperty("email_payeur")
    @Column(name = "email_payeur")
    private String emailPayeur;

    @JsonProperty("nom_payeur")
    @Column(name = "nom_payeur")
    private String nomPayeur;

    // ── Traçabilité PayPal (migration 007) ──

    /** Commande PayPal : permet de recouper un litige sans rejouer l'API. */
    @JsonProperty("paypal_order_id")
    @Column(name = "paypal_order_id")
    private String paypalOrderId;

    @JsonProperty("paypal_capture_id")
    @Column(name = "paypal_capture_id")
    private String paypalCaptureId;

    /** Statut brut renvoyé par PayPal (COMPLETED, PENDING, DECLINED…). */
    @JsonProperty("statut_paypal")
    @Column(name = "statut_paypal")
    private String statutPaypal;

    /** « sandbox » ou « live » : un encaissement de test ne doit jamais être confondu avec un vrai. */
    private String environnement;

    /** Réponse complète de la capture, conservée telle quelle pour les litiges. */
    @JsonProperty("payload_capture")
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_capture", columnDefinition = "jsonb")
    private String payloadCapture;

    @JsonProperty("date_paiement")
    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
