-- ============================================================================
-- Migration 005 — coordonnées du payeur
-- ----------------------------------------------------------------------------
-- Trace, pour chaque règlement, le compte PayPal déclaré par l'acheteur.
-- C'est la même information qu'une transaction PayPal réelle renvoie
-- (`payer.email_address`) : elle sert au rapprochement comptable et au
-- traitement des litiges.
--
-- ⚠️  AUCUN MOT DE PASSE N'EST STOCKÉ, et il ne doit jamais l'être. Un
-- marchand n'a pas à connaître les identifiants PayPal de ses clients : c'est
-- précisément ce que la redirection vers le domaine de PayPal garantit. Seule
-- l'adresse du compte, qui identifie le payeur, est conservée.
-- ============================================================================

BEGIN;

ALTER TABLE paiements ADD COLUMN IF NOT EXISTS email_payeur VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS nom_payeur   VARCHAR(150);

COMMENT ON COLUMN paiements.email_payeur IS
    'Adresse du compte PayPal ayant réglé la commande. Jamais de mot de passe.';

CREATE INDEX IF NOT EXISTS idx_paiements_email ON paiements(email_payeur);

COMMIT;
