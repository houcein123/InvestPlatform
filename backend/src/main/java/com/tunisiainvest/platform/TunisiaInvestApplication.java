package com.tunisiainvest.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Tunisia Invest — backend principal.
 *
 * Périmètre : comptes et rôles, catalogue des 6 secteurs, achats et paiement
 * PayPal, analyse comparative, orchestration de la génération des rapports.
 *
 * La fabrication du PDF elle-même (mise en page, rédaction Groq, projections)
 * reste confiée au moteur Node « report-engine », appelé en interne : c'est le
 * seul composant que ce backend ne réimplémente pas.
 */
@SpringBootApplication
@EnableAsync
public class TunisiaInvestApplication {

    public static void main(String[] args) {
        SpringApplication.run(TunisiaInvestApplication.class, args);
    }
}
