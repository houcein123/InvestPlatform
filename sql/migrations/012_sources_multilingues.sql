-- ============================================================================
-- 012 — Version anglaise des libellés de source.
--
-- POURQUOI CETTE MIGRATION EXISTE, ALORS QUE LA 011 AVAIT ÉCARTÉ `source`.
--
-- La 011 laissait `source` de côté au motif qu'un sigle d'organisme ne se
-- traduit pas — INS, BCT, FIPA restent INS, BCT, FIPA. C'était vrai pour les
-- séries sectorielles, faux pour le comparatif régional : les valeurs y sont
-- des libellés composés, pas des sigles.
--
--   « Banque mondiale — World Development Indicators (CC BY 4.0) »
--   « Ministères du tourisme »
--   « CNUCED »   → UNCTAD en anglais
--   « OMC »      → WTO
--
-- Ces intitulés apparaissent sous chaque graphique du comparatif régional.
-- Les laisser en français revenait à signer en français les seules données
-- étrangères que la plateforme publie, sur l'écran destiné aux investisseurs
-- étrangers.
--
-- Les sigles qui n'ont pas de forme anglaise distincte (FAO, IRENA, Eurostat)
-- sont rendus à l'identique par le script : c'est le comportement attendu.
--
-- Non destructif et rejouable.
-- ============================================================================

ALTER TABLE benchmarks_regionaux ADD COLUMN IF NOT EXISTS source_en VARCHAR(255);

COMMENT ON COLUMN benchmarks_regionaux.source_en IS
    'Libellé anglais de la source. NULL = repli sur `source`. '
    'Rempli par scripts/traduire_donnees.py.';
