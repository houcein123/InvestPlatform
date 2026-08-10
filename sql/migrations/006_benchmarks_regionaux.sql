-- ============================================================================
-- Migration 006 — données comparatives régionales
-- ----------------------------------------------------------------------------
-- Le CDC §4 exige une comparaison de la Tunisie avec le Maroc et l'Égypte.
-- Jusqu'ici, AUCUNE donnée sur ces deux pays n'existait en base : le modèle de
-- langage devait donc produire tous les chiffres comparatifs de lui-même, dans
-- un rapport d'investissement vendu. C'est la plus grosse faille de fiabilité
-- du service.
--
-- Cette table fournit l'emplacement de ces données. Les lignes sont créées
-- VIDES, avec seulement l'indicateur et son unité : c'est à l'administrateur
-- de saisir des valeurs sourcées. Tant qu'une valeur manque, le prompt indique
-- explicitement au modèle de traiter la comparaison de façon qualitative et de
-- signaler l'absence de chiffre, au lieu d'en inventer un.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS benchmarks_regionaux (
    id           SERIAL PRIMARY KEY,
    secteur_id   INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    indicateur   VARCHAR(200) NOT NULL,
    unite        VARCHAR(80),
    annee        INT,
    valeur_tunisie DECIMAL(15, 2),
    valeur_maroc   DECIMAL(15, 2),
    valeur_egypte  DECIMAL(15, 2),
    source       VARCHAR(255),
    commentaire  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (secteur_id, indicateur)
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_secteur ON benchmarks_regionaux(secteur_id);

COMMENT ON TABLE benchmarks_regionaux IS
    'Comparatif Tunisie / Maroc / Égypte par secteur (CDC §4). Valeurs à saisir par l''admin, jamais générées.';

-- Grille d'indicateurs à renseigner, adaptée à chaque secteur.
-- Les valeurs restent NULL : les inventer ici reviendrait à commettre l'erreur
-- que cette migration corrige.
INSERT INTO benchmarks_regionaux (secteur_id, indicateur, unite, annee, source)
SELECT s.id, g.indicateur, g.unite, NULL, g.source
  FROM secteurs s
  JOIN (VALUES
        ('tourisme',     'Arrivées de touristes internationaux',        'Millions',        'OMT / ONTT'),
        ('tourisme',     'Recettes touristiques',                       'Milliards USD',   'Banque Mondiale'),
        ('tourisme',     'Capacité hôtelière',                          'Milliers de lits','Ministères du tourisme'),
        ('agriculture',  'Valeur ajoutée agricole (% du PIB)',          '%',               'Banque Mondiale'),
        ('agriculture',  'Exportations agroalimentaires',               'Milliards USD',   'FAO / INS'),
        ('agriculture',  'Surface agricole utile',                      'Millions ha',     'FAO'),
        ('technologies', 'Exportations de services numériques',         'Milliards USD',   'CNUCED'),
        ('technologies', 'Nombre de startups financées',                'Nombre',          'Rapports sectoriels'),
        ('technologies', 'Diplômés en ingénierie par an',               'Milliers',        'Ministères de l''enseignement'),
        ('energies',     'Capacité renouvelable installée',             'MW',              'IRENA'),
        ('energies',     'Part des renouvelables dans le mix',          '%',               'IRENA / AIE'),
        ('energies',     'Objectif renouvelable 2030',                  '%',               'Stratégies nationales'),
        ('textile',      'Exportations textile-habillement',            'Milliards USD',   'OMC / CNUCED'),
        ('textile',      'Emplois du secteur',                          'Milliers',        'Ministères de l''industrie'),
        ('textile',      'Part du marché européen',                     '%',               'Eurostat'),
        ('logistique',   'Indice de performance logistique',            'Score sur 5',     'Banque Mondiale (LPI)'),
        ('logistique',   'Trafic conteneurisé portuaire',               'Millions EVP',    'Banque Mondiale'),
        ('logistique',   'Délai moyen de dédouanement',                 'Jours',           'Doing Business / OMD')
  ) AS g(slug, indicateur, unite, source) ON g.slug = s.slug
ON CONFLICT (secteur_id, indicateur) DO NOTHING;

COMMIT;
