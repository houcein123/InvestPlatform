-- ============================================================================
-- Migration 003 — projections estimées et traçables
-- ----------------------------------------------------------------------------
-- Les séries de l'INS s'arrêtent en 2023 (parfois 2024). Les colonnes
-- `projection_*` existaient mais n'étaient jamais alimentées : les graphiques
-- du rapport n'affichaient que l'historique.
--
-- Cette migration ajoute de quoi produire ET TRACER des estimations :
--   • projection_2024      : estimation quand la valeur réelle manque
--   • methode_projection   : modèle utilisé (régression linéaire, TCAM…)
--   • fiabilite_r2         : qualité d'ajustement du modèle (0 à 1)
--   • projections_calculees_le : date du dernier calcul
--
-- Distinction fondamentale conservée : `valeur_*` = donnée observée publiée
-- par la source officielle, `projection_*` = estimation calculée. Le rapport
-- et l'interface les présentent différemment et ne les confondent jamais.
-- ============================================================================

BEGIN;

ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS projection_2024          DECIMAL(15, 2);
ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS methode_projection       VARCHAR(60);
ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS fiabilite_r2             DECIMAL(5, 4);
ALTER TABLE donnees_statistiques ADD COLUMN IF NOT EXISTS projections_calculees_le TIMESTAMP;

COMMENT ON COLUMN donnees_statistiques.projection_2024 IS
    'Estimation calculée, utilisée uniquement lorsque valeur_2024 est absente';
COMMENT ON COLUMN donnees_statistiques.methode_projection IS
    'Modèle ayant produit les projections : regression_lineaire, tcam, tendance_courte';
COMMENT ON COLUMN donnees_statistiques.fiabilite_r2 IS
    'Coefficient de détermination du modèle sur l''historique observé (0 à 1)';

COMMIT;
