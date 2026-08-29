-- ============================================================================
-- 009 — Noms et descriptions de secteurs en anglais.
--
-- POURQUOI. L'interface est traduite, mais le nom d'un secteur vient de la
-- base : « Textile & Habillement » restait en français au milieu d'une page
-- anglaise. Ces libellés sont des DONNÉES, pas des chaînes d'interface, et
-- n'ont donc pas leur place dans le dictionnaire du frontend — un secteur
-- ajouté en base par un administrateur y serait absent.
--
-- POURQUOI DEUX COLONNES ET NON UNE TABLE DE TRADUCTIONS. Deux langues sont
-- prévues, et une table `secteurs_traductions` imposerait une jointure à
-- chaque lecture du catalogue pour un gain nul tant qu'il n'y a pas une
-- troisième langue. Le jour où elle arrive, la migration reste possible.
--
-- Les colonnes sont NULLABLES à dessein : un secteur créé sans traduction
-- reste affichable, l'interface retombe alors sur le libellé français plutôt
-- que d'afficher une case vide.
--
-- Non destructif : ADD COLUMN IF NOT EXISTS, et les UPDATE ne touchent que les
-- lignes dont la traduction est encore vide. Rejouable sans effet de bord.
-- ============================================================================

ALTER TABLE secteurs ADD COLUMN IF NOT EXISTS nom_en VARCHAR(100);
ALTER TABLE secteurs ADD COLUMN IF NOT EXISTS description_en TEXT;

COMMENT ON COLUMN secteurs.nom_en IS
    'Nom affiché quand l''interface est en anglais. NULL = repli sur `nom`.';
COMMENT ON COLUMN secteurs.description_en IS
    'Description affichée en anglais. NULL = repli sur `description`.';

-- Traductions des six secteurs livrés avec la plateforme.
-- Le WHERE ... IS NULL protège une traduction retouchée à la main depuis
-- l'écran d'administration : rejouer la migration ne l'écrasera pas.

UPDATE secteurs SET
    nom_en = 'Tourism',
    description_en = 'Visitor flows, hotel capacity, revenue, coastal zones'
WHERE slug = 'tourisme' AND nom_en IS NULL;

UPDATE secteurs SET
    nom_en = 'Agriculture',
    description_en = 'Cultivated area, exports, principal crops'
WHERE slug = 'agriculture' AND nom_en IS NULL;

UPDATE secteurs SET
    nom_en = 'Technology & Digital',
    description_en = 'Startups, IT exports, offshore centres'
WHERE slug = 'technologies' AND nom_en IS NULL;

UPDATE secteurs SET
    nom_en = 'Renewable Energy',
    description_en = 'Installed capacity, projects under way, 2030 targets'
WHERE slug = 'energies' AND nom_en IS NULL;

UPDATE secteurs SET
    nom_en = 'Textiles & Clothing',
    description_en = 'Exports, employment, markets'
WHERE slug = 'textile' AND nom_en IS NULL;

UPDATE secteurs SET
    nom_en = 'Logistics & Transport',
    description_en = 'Ports, airports, trade corridors'
WHERE slug = 'logistique' AND nom_en IS NULL;
