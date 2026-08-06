-- ============================================================================
-- Migration 001 — aligne une base existante sur sql/schema.sql
-- ----------------------------------------------------------------------------
-- Non destructive : aucune donnée n'est supprimée. Les contraintes NOT NULL
-- sont relâchées et une colonne jamais alimentée est retirée.
--
-- À exécuter une fois sur la base Neon existante :
--   psql "$DATABASE_URL" -f sql/migrations/001_achat_sans_compte_client.sql
-- ============================================================================

BEGIN;

-- 1. Achat à l'acte sans compte client.
--    Le service n'expose que l'authentification admin : exiger un
--    utilisateurs.id rendait tout enregistrement d'achat impossible.
ALTER TABLE achats   ALTER COLUMN id_utilisateur DROP NOT NULL;
ALTER TABLE rapports ALTER COLUMN utilisateur_id DROP NOT NULL;

-- 2. Les clés étrangères deviennent ON DELETE SET NULL (cohérent avec le
--    caractère désormais optionnel du client).
ALTER TABLE achats   DROP CONSTRAINT IF EXISTS achats_id_utilisateur_fkey;
ALTER TABLE achats   ADD  CONSTRAINT achats_id_utilisateur_fkey
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE SET NULL;

ALTER TABLE rapports DROP CONSTRAINT IF EXISTS rapports_utilisateur_id_fkey;
ALTER TABLE rapports ADD  CONSTRAINT rapports_utilisateur_id_fkey
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- 3. paiements se rattache à un achat (et non à un rapport) : le paiement
--    précède la génération dans le flux du CDC §6.
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS achat_id INT REFERENCES achats(id) ON DELETE CASCADE;
ALTER TABLE paiements ALTER COLUMN utilisateur_id DROP NOT NULL;
ALTER TABLE paiements DROP COLUMN IF EXISTS rapport_id;
CREATE INDEX IF NOT EXISTS idx_paiements_achat ON paiements(achat_id);

-- 4. Colonne redondante : secteurs.donnees_statistiques (JSONB) doublonnait la
--    table donnees_statistiques et n'a jamais été alimentée (0 ligne non nulle).
ALTER TABLE secteurs DROP COLUMN IF EXISTS donnees_statistiques;

-- 5. Les libellés d'indicateurs de l'INS dépassent parfois 100 caractères une
--    fois préfixés par le titre du tableau source.
ALTER TABLE donnees_statistiques ALTER COLUMN indicateur TYPE VARCHAR(200);
ALTER TABLE donnees_statistiques ALTER COLUMN unite      TYPE VARCHAR(80);
ALTER TABLE logs_generation      ALTER COLUMN modele_ia  TYPE VARCHAR(80);

-- 6. Nombre de pages annoncé au catalogue = couverture + sommaire + 12 sections.
UPDATE secteurs SET nombre_pages = 14 WHERE nombre_pages IS DISTINCT FROM 14;
ALTER TABLE secteurs ALTER COLUMN nombre_pages SET DEFAULT 14;
ALTER TABLE rapports ALTER COLUMN nombre_pages SET DEFAULT 14;

COMMIT;
