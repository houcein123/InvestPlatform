-- ============================================================================
-- 010 — Langue de rédaction choisie pour un rapport.
--
-- POURQUOI SUR L'ACHAT ET NON SUR LA SESSION. La langue est un attribut de la
-- COMMANDE, pas de l'interface : un client qui commande un rapport anglais,
-- puis repasse son interface en français, doit retrouver son rapport anglais.
-- Surtout, la relance d'une génération échouée (« Relancer », dans Mes
-- rapports) doit reproduire la langue commandée et payée — pas celle du
-- navigateur au moment du clic, des jours plus tard.
--
-- Le défaut 'fr' vaut pour tout l'historique : les achats antérieurs ont été
-- livrés en français, et c'est ce que leurs titulaires retrouveront s'ils
-- relancent une génération.
--
-- Non destructif et rejouable.
-- ============================================================================

ALTER TABLE achats ADD COLUMN IF NOT EXISTS langue_rapport VARCHAR(5) NOT NULL DEFAULT 'fr';

COMMENT ON COLUMN achats.langue_rapport IS
    'Langue de rédaction commandée (fr, en). Rejouée à l''identique en cas de relance.';

-- Le jeu de valeurs est verrouillé : une langue non prévue produirait un
-- rapport dont la mise en page n'existe pas, découvert seulement à la
-- livraison. La contrainte est ajoutée seulement si elle manque, pour rester
-- rejouable.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'achats_langue_rapport_valide'
    ) THEN
        ALTER TABLE achats
            ADD CONSTRAINT achats_langue_rapport_valide
            CHECK (langue_rapport IN ('fr', 'en'));
    END IF;
END $$;
