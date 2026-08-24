package com.tunisiainvest.platform.config;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration applicative — une seule lecture des propriétés dans tout le
 * projet. Reprend, en typé, le rôle que tenait `config/env.js` côté Node.
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String devise = "TND";
    private Jwt jwt = new Jwt();
    private Paypal paypal = new Paypal();
    private ReportEngine reportEngine = new ReportEngine();
    private Cors cors = new Cors();

    public static class Jwt {
        private String secret;
        private long expirationHours = 24;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationHours() { return expirationHours; }
        public void setExpirationHours(long expirationHours) { this.expirationHours = expirationHours; }
    }

    public static class Paypal {
        /** « simulation » ou « paypal ». */
        private String mode = "simulation";
        /** « sandbox » ou « live ». */
        private String env = "sandbox";
        private String clientId = "";
        private String clientSecret = "";
        private String currency = "EUR";
        private BigDecimal tauxTnd = new BigDecimal("0.29");
        private String locale = "fr_FR";
        /** Identifiant du webhook, nécessaire pour vérifier la signature. */
        private String webhookId = "";

        public boolean isConfigure() {
            return clientId != null && !clientId.isBlank()
                    && clientSecret != null && !clientSecret.isBlank();
        }

        public boolean isArgentReel() {
            return "live".equalsIgnoreCase(env);
        }

        public String hote() {
            return isArgentReel() ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
        }

        /**
         * Convertit un tarif du catalogue vers la devise acceptee par PayPal.
         *
         * Le plancher a 0,01 n'est pas cosmetique : PayPal refuse une commande
         * d'un montant nul, et un secteur mal configure ferait alors echouer la
         * creation de commande avec un message incomprehensible pour l'acheteur.
         */
        public BigDecimal convertirDepuisTND(BigDecimal montantTND) {
            BigDecimal converti = montantTND.multiply(tauxTnd)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            return converti.max(new BigDecimal("0.01"));
        }

        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
        public String getEnv() { return env; }
        public void setEnv(String env) { this.env = env; }
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public BigDecimal getTauxTnd() { return tauxTnd; }
        public void setTauxTnd(BigDecimal tauxTnd) { this.tauxTnd = tauxTnd; }
        public String getLocale() { return locale; }
        public void setLocale(String locale) { this.locale = locale; }
        public String getWebhookId() { return webhookId; }
        public void setWebhookId(String webhookId) { this.webhookId = webhookId; }
    }

    public static class ReportEngine {
        private String baseUrl = "http://localhost:3001";
        /** Jeton partagé : le moteur n'accepte que les appels du backend. */
        private String token = "dev-internal-token";
        private int timeoutSeconds = 180;

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    }

    public static class Cors {
        private List<String> origins = List.of("http://localhost:5173");

        public List<String> getOrigins() { return origins; }
        public void setOrigins(List<String> origins) { this.origins = origins; }
    }

    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }
    public Jwt getJwt() { return jwt; }
    public void setJwt(Jwt jwt) { this.jwt = jwt; }
    public Paypal getPaypal() { return paypal; }
    public void setPaypal(Paypal paypal) { this.paypal = paypal; }
    public ReportEngine getReportEngine() { return reportEngine; }
    public void setReportEngine(ReportEngine reportEngine) { this.reportEngine = reportEngine; }
    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }
}
