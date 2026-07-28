-- ============================================================
-- SCHÉMA INVESTPLATFORM — PostgreSQL
-- À exécuter sur Neon (ou tout PostgreSQL)
-- ============================================================

DROP TABLE IF EXISTS logs_generation CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS rapports CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS statistiques_ventes CASCADE;
DROP TABLE IF EXISTS cadre_reglementaire CASCADE;
DROP TABLE IF EXISTS acteurs_principaux CASCADE;
DROP TABLE IF EXISTS zones_geographiques CASCADE;
DROP TABLE IF EXISTS chiffres_cles CASCADE;
DROP TABLE IF EXISTS donnees_statistiques CASCADE;
DROP TABLE IF EXISTS secteurs CASCADE;

-- 1. SECTEURS
CREATE TABLE secteurs (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    icone           VARCHAR(255),
    prix_rapport    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    nombre_pages    INT DEFAULT 13,
    date_maj        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_actif       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONNÉES STATISTIQUES
CREATE TABLE donnees_statistiques (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    indicateur      VARCHAR(100) NOT NULL,
    unite           VARCHAR(50),
    valeur_2020     DECIMAL(15, 2),
    valeur_2021     DECIMAL(15, 2),
    valeur_2022     DECIMAL(15, 2),
    valeur_2023     DECIMAL(15, 2),
    valeur_2024     DECIMAL(15, 2),
    projection_2025 DECIMAL(15, 2),
    projection_2026 DECIMAL(15, 2),
    projection_2027 DECIMAL(15, 2),
    projection_2028 DECIMAL(15, 2),
    source          VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secteur_id, indicateur)
);

-- 3. CHIFFRES CLÉS
CREATE TABLE chiffres_cles (
    id                      SERIAL PRIMARY KEY,
    secteur_id              INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    contribution_pib_pct    DECIMAL(5, 2),
    croissance_annuelle_pct DECIMAL(5, 2),
    nombre_emplois          INT,
    exportations_mdt        DECIMAL(15, 2),
    nombre_entreprises      INT,
    investissements_ide_mdt   DECIMAL(15, 2),
    part_marche_regional_pct DECIMAL(5, 2),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secteur_id)
);

-- 4. ZONES GÉOGRAPHIQUES
CREATE TABLE zones_geographiques (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    nom             VARCHAR(150) NOT NULL,
    type            VARCHAR(50) NOT NULL,
    gouvernorat     VARCHAR(50),
    superficie_km2  DECIMAL(10, 2),
    description     TEXT,
    avantages       TEXT,
    coordonnees     POINT,
    est_actif       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACTEURS PRINCIPAUX
CREATE TABLE acteurs_principaux (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    nom             VARCHAR(150) NOT NULL,
    type            VARCHAR(50) NOT NULL,
    role            VARCHAR(255),
    description     TEXT,
    site_web        VARCHAR(255),
    chiffre_affaires DECIMAL(15, 2),
    nombre_employes INT,
    est_national    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CADRE RÉGLEMENTAIRE
CREATE TABLE cadre_reglementaire (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    titre           VARCHAR(200) NOT NULL,
    annee           INT,
    description     TEXT NOT NULL,
    avantages       TEXT,
    obligations     TEXT,
    type_texte      VARCHAR(50),
    est_en_vigueur  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. UTILISATEURS
CREATE TABLE utilisateurs (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe    VARCHAR(255) NOT NULL,
    nom             VARCHAR(100),
    prenom          VARCHAR(100),
    entreprise      VARCHAR(150),
    pays            VARCHAR(100),
    telephone       VARCHAR(20),
    est_verifie     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ADMINS
CREATE TABLE admins (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe    VARCHAR(255) NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    role            VARCHAR(50) DEFAULT 'admin',
    est_actif       BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. RAPPORTS
CREATE TABLE rapports (
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    titre           VARCHAR(200) NOT NULL,
    chemin_fichier  VARCHAR(500),
    taille_fichier  INT,
    nombre_pages    INT DEFAULT 13,
    statut          VARCHAR(50) DEFAULT 'en_attente',
    contenu_ia      JSONB,
    date_generation TIMESTAMP,
    date_achat      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_telecharge  BOOLEAN DEFAULT FALSE,
    date_telechargement TIMESTAMP
);

-- 10. PAIEMENTS
CREATE TABLE paiements (
    id                  SERIAL PRIMARY KEY,
    rapport_id          INT NOT NULL REFERENCES rapports(id) ON DELETE CASCADE,
    utilisateur_id      INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    montant             DECIMAL(10, 2) NOT NULL,
    devise              VARCHAR(3) DEFAULT 'TND',
    methode             VARCHAR(50) DEFAULT 'paypal',
    transaction_id      VARCHAR(255),
    statut              VARCHAR(50) DEFAULT 'en_attente',
    date_paiement       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. LOGS GÉNÉRATION
CREATE TABLE logs_generation (
    id              SERIAL PRIMARY KEY,
    rapport_id      INT REFERENCES rapports(id) ON DELETE SET NULL,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    prompt_envoye   TEXT,
    reponse_ia      TEXT,
    duree_ms        INT,
    modele_ia       VARCHAR(50) DEFAULT 'llama3-8b-8192',
    statut          VARCHAR(50),
    message_erreur  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. STATISTIQUES VENTES
CREATE TABLE statistiques_ventes (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    mois            INT NOT NULL,
    annee           INT NOT NULL,
    nb_ventes       INT DEFAULT 0,
    revenu_total    DECIMAL(15, 2) DEFAULT 0.00,
    nb_telechargements INT DEFAULT 0,
    UNIQUE(secteur_id, mois, annee)
);

-- INDEXES
CREATE INDEX idx_donnees_stat_secteur ON donnees_statistiques(secteur_id);
CREATE INDEX idx_zones_secteur ON zones_geographiques(secteur_id);
CREATE INDEX idx_acteurs_secteur ON acteurs_principaux(secteur_id);
CREATE INDEX idx_cadre_secteur ON cadre_reglementaire(secteur_id);
CREATE INDEX idx_rapports_utilisateur ON rapports(utilisateur_id);
CREATE INDEX idx_rapports_secteur ON rapports(secteur_id);
CREATE INDEX idx_paiements_rapport ON paiements(rapport_id);
CREATE INDEX idx_logs_rapport ON logs_generation(rapport_id);

-- SEED DATA : Les 6 secteurs
INSERT INTO secteurs (slug, nom, description, prix_rapport, nombre_pages) VALUES
('tourisme', 'Tourisme', 'Flux touristiques, capacité hôtelière, revenus, zones côtières', 49.99, 13),
('agriculture', 'Agriculture', 'Surfaces cultivées, exportations, cultures principales', 39.99, 13),
('technologies', 'Technologies & Numérique', 'Startups, export IT, centres offshore', 59.99, 13),
('energies', 'Énergies Renouvelables', 'Capacité installée, projets en cours, objectifs 2030', 54.99, 13),
('textile', 'Textile & Habillement', 'Exportations, emplois, marchés', 44.99, 13),
('logistique', 'Logistique & Transport', 'Ports, aéroports, corridors commerciaux', 49.99, 13);

-- 1. Ajouter le champ JSON demandé dans la table secteurs
ALTER TABLE secteurs 
ADD COLUMN IF NOT EXISTS donnees_statistiques JSONB;

CREATE TABLE achats (
    id              SERIAL PRIMARY KEY,
    id_utilisateur  INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    id_secteur      INT NOT NULL REFERENCES secteurs(id),
    date_achat      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    montant         DECIMAL(10, 2) NOT NULL,
    statut_paiement VARCHAR(50) DEFAULT 'en_attente',
    pdf_genere      VARCHAR(500),  -- chemin du fichier PDF
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les stats de vente (sous-tâche 3)
CREATE INDEX idx_achats_utilisateur ON achats(id_utilisateur);
CREATE INDEX idx_achats_secteur ON achats(id_secteur);
CREATE INDEX idx_achats_date ON achats(date_achat);
CREATE INDEX idx_stats_ventes_lookup ON statistiques_ventes(secteur_id, annee, mois);