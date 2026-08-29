package com.tunisiainvest.platform.sales;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
 * Une commande de rapport.
 *
 * Créé « en attente » avant l'appel à PayPal, passé à « paye » à la capture.
 * C'est CET enregistrement qui autorise la génération du rapport — jamais une
 * affirmation du navigateur.
 *
 * `idUtilisateur` est nullable : l'achat à l'acte est possible sans compte.
 */
@Entity
@Table(name = "achats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achat {

    public static final String EN_ATTENTE = "en_attente";
    public static final String PAYE = "paye";

    public static final String MODE_SIMULATION = "simulation";
    public static final String MODE_PAYPAL = "paypal";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("id_utilisateur")
    @Column(name = "id_utilisateur")
    private Long idUtilisateur;

    @JsonProperty("id_secteur")
    @Column(name = "id_secteur", nullable = false)
    private Long idSecteur;

    @JsonProperty("date_achat")
    @Column(name = "date_achat")
    private LocalDateTime dateAchat;

    @Column(nullable = false)
    private BigDecimal montant;

    @JsonProperty("statut_paiement")
    @Column(name = "statut_paiement")
    @Builder.Default
    private String statutPaiement = EN_ATTENTE;

    /**
     * Mémorisé sur l'achat plutôt que relu dans la configuration au moment de
     * la capture : le mode du serveur a pu changer entre la commande et sa
     * validation, et c'est la commande qui fait foi.
     */
    @JsonProperty("mode_paiement")
    @Column(name = "mode_paiement")
    @Builder.Default
    private String modePaiement = MODE_PAYPAL;

    @JsonProperty("pdf_genere")
    @Column(name = "pdf_genere")
    private String pdfGenere;

    /**
     * Langue de rédaction commandée (migration 010).
     *
     * Portée par l'ACHAT, pas par la session : une relance doit reproduire la
     * langue payée, pas celle du navigateur au moment du clic.
     */
    @JsonProperty("langue_rapport")
    @Column(name = "langue_rapport")
    @Builder.Default
    private String langueRapport = "fr";

    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public boolean estPaye() {
        return PAYE.equals(statutPaiement);
    }

    public boolean estSimulation() {
        return MODE_SIMULATION.equals(modePaiement);
    }
}
