-- ============================================================================
-- Migration 002 — un seul compte, un rôle
-- ----------------------------------------------------------------------------
-- Avant : deux tables d'authentification (`admins` et `utilisateurs`), deux
-- parcours de connexion, et des achats impossibles à rattacher à un client.
--
-- Après : la table `utilisateurs` porte tous les comptes avec une colonne
-- `role` ('client' | 'admin'). L'inscription crée un client ; le rôle stocké
-- en base décide de ce que la personne voit après connexion.
--
-- Les mots de passe (hachés bcrypt) sont recopiés tels quels : les comptes
-- admin existants conservent leurs identifiants.
--
--   psql "$DATABASE_URL" -f sql/migrations/002_comptes_unifies.sql
-- ============================================================================

BEGIN;

-- 1. Colonnes de gestion de compte sur `utilisateurs`
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS role               VARCHAR(20) NOT NULL DEFAULT 'client';
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_actif          BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMP;

ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_valide;
ALTER TABLE utilisateurs ADD  CONSTRAINT utilisateurs_role_valide
    CHECK (role IN ('client', 'admin'));

-- 2. Reprise des comptes administrateurs existants.
--    ON CONFLICT : si l'email existe déjà côté client, on le promeut admin
--    plutôt que d'échouer.
INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, role, est_actif, derniere_connexion, created_at)
SELECT email, mot_de_passe, nom, prenom, 'admin', est_actif, derniere_connexion, created_at
  FROM admins
ON CONFLICT (email) DO UPDATE
    SET role = 'admin',
        mot_de_passe = EXCLUDED.mot_de_passe;

-- 3. Garde-fou : on ne supprime `admins` que si TOUS ses comptes ont bien été
--    repris. Sinon la transaction entière est annulée et rien n'est perdu.
DO $$
DECLARE
    attendus INT;
    repris   INT;
BEGIN
    SELECT COUNT(*) INTO attendus FROM admins;
    SELECT COUNT(*) INTO repris
      FROM utilisateurs u
     WHERE u.role = 'admin'
       AND EXISTS (SELECT 1 FROM admins a WHERE a.email = u.email);

    IF repris < attendus THEN
        RAISE EXCEPTION 'Reprise incomplète : % compte(s) admin sur % migré(s). Migration annulée.', repris, attendus;
    END IF;

    RAISE NOTICE 'Comptes admin repris : % / %', repris, attendus;
END $$;

DROP TABLE IF EXISTS admins CASCADE;

-- 4. Index de connexion
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);

COMMIT;
