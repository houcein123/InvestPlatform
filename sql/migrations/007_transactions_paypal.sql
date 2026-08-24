-- ============================================================================
-- Migration 007 — traçabilité complète des transactions PayPal
-- ----------------------------------------------------------------------------
-- La table `paiements` enregistrait déjà le montant, la devise, la méthode et
-- un `transaction_id`. Il lui manquait de quoi RECOUPER une transaction avec
-- PayPal sans rejouer l'API : l'identifiant de commande, celui de la capture,
-- le statut brut renvoyé, l'environnement, et la réponse complète.
--
-- Sans ces colonnes, un litige se traite à l'aveugle : on sait qu'un montant a
-- été encaissé, pas ce que PayPal a exactement répondu ni si l'encaissement
-- venait du bac à sable ou de la production.
--
-- Non destructive : aucune donnée existante n'est modifiée.
-- ============================================================================

ALTER TABLE paiements ADD COLUMN IF NOT EXISTS paypal_order_id   VARCHAR(64);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR(64);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS statut_paypal     VARCHAR(32);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS environnement     VARCHAR(12);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS payload_capture   JSONB;

COMMENT ON COLUMN paiements.paypal_order_id IS
    'Commande PayPal (Orders v2). Relie la vente à la transaction chez le prestataire.';
COMMENT ON COLUMN paiements.paypal_capture_id IS
    'Identifiant de la capture. Unique chez PayPal : sert de clé anti-doublon.';
COMMENT ON COLUMN paiements.statut_paypal IS
    'Statut brut renvoyé par PayPal (COMPLETED, PENDING, DECLINED...), conservé tel quel.';
COMMENT ON COLUMN paiements.environnement IS
    'sandbox, live ou simulation. Un encaissement de test ne doit jamais être confondu avec un vrai.';
COMMENT ON COLUMN paiements.payload_capture IS
    'Réponse complète de PayPal, conservée intégralement pour le traitement des litiges.';

-- Une capture ne peut être encaissée qu'une fois. L'index partiel laisse
-- coexister les paiements en simulation, qui n'ont pas d'identifiant PayPal.
CREATE UNIQUE INDEX IF NOT EXISTS uq_paiements_capture
    ON paiements (paypal_capture_id)
 WHERE paypal_capture_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paiements_order ON paiements (paypal_order_id);

-- ── Notifications PayPal ────────────────────────────────────────────────────
-- Filet de sécurité du parcours de paiement : si le navigateur se ferme entre
-- l'approbation et la capture, l'argent peut être débité sans que la
-- plateforme l'ait enregistré. PayPal rejoue ses notifications jusqu'à obtenir
-- un 200 — `event_id UNIQUE` rend le traitement idempotent.
CREATE TABLE IF NOT EXISTS paypal_webhooks (
    id                 SERIAL PRIMARY KEY,
    event_id           VARCHAR(64) UNIQUE NOT NULL,
    event_type         VARCHAR(64) NOT NULL,
    resource_id        VARCHAR(64),
    -- Une notification dont la signature n'est pas vérifiée n'est jamais
    -- traitée : cette route est publique, la signature est sa seule
    -- authentification.
    signature_verifiee BOOLEAN NOT NULL DEFAULT FALSE,
    payload            JSONB NOT NULL,
    traite_le          TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_type     ON paypal_webhooks (event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_resource ON paypal_webhooks (resource_id);
