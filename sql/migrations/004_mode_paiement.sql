-- ============================================================================
-- Migration 004 — distinguer les achats simulés des achats réels
-- ----------------------------------------------------------------------------
-- La plateforme accepte deux modes de règlement :
--   'simulation' → validation locale, aucun débit, aucun prestataire externe
--   'paypal'     → transaction PayPal réelle (sandbox ou production)
--
-- Sans cette colonne, un achat simulé serait comptabilisé comme une vente dans
-- le tableau de bord : le chiffre d'affaires affiché ne voudrait plus rien dire.
-- ============================================================================

BEGIN;

ALTER TABLE achats
    ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(20) NOT NULL DEFAULT 'paypal';

ALTER TABLE achats DROP CONSTRAINT IF EXISTS achats_mode_paiement_valide;
ALTER TABLE achats ADD  CONSTRAINT achats_mode_paiement_valide
    CHECK (mode_paiement IN ('paypal', 'simulation'));

COMMENT ON COLUMN achats.mode_paiement IS
    'simulation = validation locale sans débit ; paypal = transaction réelle';

CREATE INDEX IF NOT EXISTS idx_achats_mode ON achats(mode_paiement);

COMMIT;
