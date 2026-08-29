-- ============================================================================
-- 011 — Version anglaise des données sectorielles.
--
-- POURQUOI. La migration 009 a traduit les six secteurs. Mais un rapport et un
-- écran d'analyse affichent bien plus que cela : intitulés d'indicateurs,
-- unités, types de zones, rôles d'acteurs, textes réglementaires. En anglais,
-- tout ce contenu restait français, au milieu d'une interface traduite.
--
-- CE QUI N'EST PAS TRADUIT, ET POURQUOI.
--   - `nom` d'un acteur       → raison sociale, un nom propre ne se traduit pas
--   - `gouvernorat`           → toponyme officiel tunisien (Bizerte, Sfax…)
--   - `source`                → sigle d'organisme (INS, BCT, Banque mondiale)
--   - `site_web`, `slug`      → identifiants techniques
--   - `nom` d'une zone        → contient une part de toponyme ; le traduire
--                               produirait des libellés introuvables dans les
--                               documents officiels que l'investisseur ira
--                               ensuite consulter
-- Traduire un nom propre rend la donnée intraçable jusqu'à sa source, ce qui
-- est exactement la garantie que ce service vend.
--
-- `chiffres_cles` n'apparaît pas ici : la table est entièrement numérique.
--
-- Colonnes NULLABLES : une donnée non traduite s'affiche dans sa version
-- française plutôt que de laisser un vide. Non destructif et rejouable.
-- ============================================================================

-- ── Séries statistiques ──
ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS indicateur_en VARCHAR(200);
ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS unite_en VARCHAR(80);

-- ── Zones géographiques ──
ALTER TABLE zones_geographiques ADD COLUMN IF NOT EXISTS type_en VARCHAR(50);
ALTER TABLE zones_geographiques ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE zones_geographiques ADD COLUMN IF NOT EXISTS avantages_en TEXT;

-- ── Acteurs principaux ──
ALTER TABLE acteurs_principaux ADD COLUMN IF NOT EXISTS type_en VARCHAR(50);
ALTER TABLE acteurs_principaux ADD COLUMN IF NOT EXISTS role_en VARCHAR(255);
ALTER TABLE acteurs_principaux ADD COLUMN IF NOT EXISTS description_en TEXT;

-- ── Cadre réglementaire ──
ALTER TABLE cadre_reglementaire ADD COLUMN IF NOT EXISTS titre_en VARCHAR(200);
ALTER TABLE cadre_reglementaire ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE cadre_reglementaire ADD COLUMN IF NOT EXISTS avantages_en TEXT;
ALTER TABLE cadre_reglementaire ADD COLUMN IF NOT EXISTS obligations_en TEXT;
ALTER TABLE cadre_reglementaire ADD COLUMN IF NOT EXISTS type_texte_en VARCHAR(50);

-- ── Comparatif régional ──
ALTER TABLE benchmarks_regionaux ADD COLUMN IF NOT EXISTS indicateur_en VARCHAR(200);
ALTER TABLE benchmarks_regionaux ADD COLUMN IF NOT EXISTS unite_en VARCHAR(80);
ALTER TABLE benchmarks_regionaux ADD COLUMN IF NOT EXISTS commentaire_en TEXT;

COMMENT ON COLUMN donnees_statistiques.indicateur_en IS
    'Intitulé anglais. NULL = repli sur `indicateur`. Rempli par scripts/traduire_donnees.py.';
COMMENT ON COLUMN acteurs_principaux.description_en IS
    'Description anglaise. Le NOM de l''acteur n''est jamais traduit : raison sociale.';
COMMENT ON COLUMN zones_geographiques.description_en IS
    'Description anglaise. Le NOM et le GOUVERNORAT ne sont jamais traduits : toponymes.';

-- ── Journal des traductions ──
-- Sans cette trace, rejouer le script retraduirait tout à chaque exécution, et
-- surtout : une traduction retouchée à la main serait écrasée sans que
-- personne ne s'en aperçoive.
CREATE TABLE IF NOT EXISTS traductions_journal (
    id           SERIAL PRIMARY KEY,
    table_cible  VARCHAR(60)  NOT NULL,
    colonne      VARCHAR(60)  NOT NULL,
    ligne_id     INT          NOT NULL,
    source_fr    TEXT,
    resultat_en  TEXT,
    modele       VARCHAR(80),
    -- 'auto' : produite par le script. 'manuelle' : corrigée par un humain,
    -- et dès lors protégée d'un nouvel écrasement automatique.
    origine      VARCHAR(20)  NOT NULL DEFAULT 'auto',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (table_cible, colonne, ligne_id)
);

CREATE INDEX IF NOT EXISTS idx_traductions_cible
    ON traductions_journal (table_cible, colonne);
