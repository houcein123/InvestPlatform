package com.tunisiainvest.platform.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.tunisiainvest.platform.config.AppProperties;

/**
 * Conversion TND vers la devise de paiement.
 *
 * Le dinar tunisien n'est pas accepte par PayPal : le catalogue reste en TND
 * et la transaction est presentee dans une autre devise. Une erreur ici se
 * traduit directement par un montant errone debite a l'acheteur, ou par un
 * paiement refuse pour montant insuffisant alors qu'il etait correct.
 */
class PayPalConversionTest {

    private AppProperties.Paypal config(String taux) {
        AppProperties.Paypal paypal = new AppProperties.Paypal();
        paypal.setTauxTnd(new BigDecimal(taux));
        paypal.setCurrency("EUR");
        return paypal;
    }

    @Test
    @DisplayName("le montant converti est arrondi au centime")
    void arrondiAuCentime() {
        // 49,99 TND x 0,29 = 14,4971 -> 14,50
        assertEquals(new BigDecimal("14.50"), config("0.29").convertirDepuisTND(new BigDecimal("49.99")));
    }

    @Test
    @DisplayName("un tarif nul ne produit jamais une commande a zero")
    void jamaisZero() {
        // PayPal refuse une commande d'un montant nul : le plancher a 0,01
        // evite un echec de creation de commande sur un secteur mal configure.
        BigDecimal converti = config("0.29").convertirDepuisTND(BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.01"), converti);
        assertTrue(converti.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("le taux est bien applique, pas ignore")
    void tauxApplique() {
        assertEquals(new BigDecimal("50.00"), config("1.00").convertirDepuisTND(new BigDecimal("50.00")));
        assertEquals(new BigDecimal("25.00"), config("0.50").convertirDepuisTND(new BigDecimal("50.00")));
    }
}
