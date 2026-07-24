-- ============================================================
-- SCHÉMA DE BASE DE DONNÉES — InvestPlatform
-- Projet : Rapport Sectoriel PDF (Tunisia Invest)
-- Date : 24 Juillet 2026
-- SGBD : PostgreSQL (recommandé)
-- ============================================================

-- -----------------------------------------------------------
-- 1. TABLE : secteurs
-- Les 6 secteurs économiques disponibles
-- -----------------------------------------------------------
CREATE TABLE secteurs (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(50) UNIQUE NOT NULL,   -- ex: tourisme, agriculture
    nom             VARCHAR(100) NOT NULL,          -- ex: Tourisme
    description     TEXT,
    icone           VARCHAR(255),                   -- URL icône SVG/PNG
    prix_rapport    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Prix en TND ou USD
    nombre_pages    INT DEFAULT 13,
    date_maj        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_actif       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 2. TABLE : donnees_statistiques
-- Données chiffrées sur 5 ans (2020-2024) par secteur
-- -----------------------------------------------------------
CREATE TABLE donnees_statistiques (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    indicateur      VARCHAR(100) NOT NULL,          -- ex: recettes_touristiques
    unite           VARCHAR(50),                    -- ex: millions_dinars, tonnes
    valeur_2020     DECIMAL(15, 2),
    valeur_2021     DECIMAL(15, 2),
    valeur_2022     DECIMAL(15, 2),
    valeur_2023     DECIMAL(15, 2),
    valeur_2024     DECIMAL(15, 2),
    projection_2025 DECIMAL(15, 2),
    projection_2026 DECIMAL(15, 2),
    projection_2027 DECIMAL(15, 2),
    projection_2028 DECIMAL(15, 2),
    source          VARCHAR(255),                   -- ex: INS, Banque Mondiale
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secteur_id, indicateur)
);

-- -----------------------------------------------------------
-- 3. TABLE : chiffres_cles
-- Indicateurs agrégés par secteur
-- -----------------------------------------------------------
CREATE TABLE chiffres_cles (
    id                      SERIAL PRIMARY KEY,
    secteur_id              INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    contribution_pib_pct    DECIMAL(5, 2),          -- % du PIB national
    croissance_annuelle_pct DECIMAL(5, 2),
    nombre_emplois          INT,
    exportations_mdt        DECIMAL(15, 2),           -- millions de dinars
    nombre_entreprises      INT,
    investissements_ide_mdt   DECIMAL(15, 2),
    part_marche_regional_pct DECIMAL(5, 2),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secteur_id)
);

-- -----------------------------------------------------------
-- 4. TABLE : zones_geographiques
-- Zones d'activité par secteur (zones franches, côtières, etc.)
-- -----------------------------------------------------------
CREATE TABLE zones_geographiques (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    nom             VARCHAR(150) NOT NULL,          -- ex: Zone Franche de Nabeul
    type            VARCHAR(50) NOT NULL,           -- zone_franche | zone_cotiere | pole_industriel | port | aeroport
    gouvernorat     VARCHAR(50),
    superficie_km2  DECIMAL(10, 2),
    description     TEXT,
    avantages       TEXT,                           -- ex: exonération fiscale 10 ans
    coordonnees     POINT,                          -- latitude, longitude (optionnel)
    est_actif       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 5. TABLE : acteurs_principaux
-- Entreprises, agences, startups clés par secteur
-- -----------------------------------------------------------
CREATE TABLE acteurs_principaux (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    nom             VARCHAR(150) NOT NULL,
    type            VARCHAR(50) NOT NULL,           -- entreprise | agence_publique | startup | tour_operateur | banque
    role            VARCHAR(255),                   -- ex: leader du marché, régulateur
    description     TEXT,
    site_web        VARCHAR(255),
    chiffre_affaires DECIMAL(15, 2),                -- en MDT (optionnel)
    nombre_employes INT,
    est_national    BOOLEAN DEFAULT TRUE,           -- true = tunisien, false = étranger
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 6. TABLE : cadre_reglementaire
-- Lois, incitations fiscales, régulations par secteur
-- -----------------------------------------------------------
CREATE TABLE cadre_reglementaire (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id) ON DELETE CASCADE,
    titre           VARCHAR(200) NOT NULL,          -- ex: Code d'Investissement
    annee           INT,
    description     TEXT NOT NULL,
    avantages       TEXT,                           -- ex: exonération IRPP 5 ans
    obligations     TEXT,                           -- ex: création d'emplois locaux
    type_texte      VARCHAR(50),                   -- loi | decret | convention | zone_franche
    est_en_vigueur  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 7. TABLE : utilisateurs
-- Clients qui achètent les rapports
-- -----------------------------------------------------------
CREATE TABLE utilisateurs (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe    VARCHAR(255) NOT NULL,          -- hash bcrypt
    nom             VARCHAR(100),
    prenom          VARCHAR(100),
    entreprise      VARCHAR(150),
    pays            VARCHAR(100),
    telephone       VARCHAR(20),
    est_verifie     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 8. TABLE : admins
-- Administrateurs du panneau admin
-- -----------------------------------------------------------
CREATE TABLE admins (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe    VARCHAR(255) NOT NULL,          -- hash bcrypt
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    role            VARCHAR(50) DEFAULT 'admin',   -- admin | super_admin
    est_actif       BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 9. TABLE : rapports
-- Les rapports PDF générés et achetés
-- -----------------------------------------------------------
CREATE TABLE rapports (
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    titre           VARCHAR(200) NOT NULL,          -- ex: Rapport Sectoriel - Tourisme 2026
    chemin_fichier  VARCHAR(500),                   -- URL ou path du PDF généré
    taille_fichier  INT,                            -- en octets
    nombre_pages    INT DEFAULT 13,
    statut          VARCHAR(50) DEFAULT 'en_attente', -- en_attente | en_generation | genere | erreur
    contenu_ia      JSONB,                          -- sections générées par Groq (cache)
    date_generation TIMESTAMP,
    date_achat      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_telecharge  BOOLEAN DEFAULT FALSE,
    date_telechargement TIMESTAMP
);

-- -----------------------------------------------------------
-- 10. TABLE : paiements
-- Transactions PayPal (ou Stripe)
-- -----------------------------------------------------------
CREATE TABLE paiements (
    id                  SERIAL PRIMARY KEY,
    rapport_id          INT NOT NULL REFERENCES rapports(id) ON DELETE CASCADE,
    utilisateur_id      INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    montant             DECIMAL(10, 2) NOT NULL,
    devise              VARCHAR(3) DEFAULT 'TND',
    methode             VARCHAR(50) DEFAULT 'paypal', -- paypal | stripe | carte
    transaction_id      VARCHAR(255),               -- ID externe PayPal
    statut              VARCHAR(50) DEFAULT 'en_attente', -- en_attente | complete | echoue | rembourse
    date_paiement       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 11. TABLE : logs_generation
-- Suivi des générations IA (debug + stats admin)
-- -----------------------------------------------------------
CREATE TABLE logs_generation (
    id              SERIAL PRIMARY KEY,
    rapport_id      INT REFERENCES rapports(id) ON DELETE SET NULL,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    prompt_envoye   TEXT,                           -- le prompt complet envoyé à Groq
    reponse_ia      TEXT,                           -- réponse brute de Groq
    duree_ms        INT,                            -- temps de génération en ms
    modele_ia       VARCHAR(50) DEFAULT 'llama3-8b-8192',
    statut          VARCHAR(50),                    -- succes | erreur | timeout
    message_erreur  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 12. TABLE : statistiques_ventes (vue matérialisée recommandée)
-- Agrégation pour le panneau admin
-- -----------------------------------------------------------
CREATE TABLE statistiques_ventes (
    id              SERIAL PRIMARY KEY,
    secteur_id      INT NOT NULL REFERENCES secteurs(id),
    mois            INT NOT NULL,                   -- 1-12
    annee           INT NOT NULL,
    nb_ventes       INT DEFAULT 0,
    revenu_total    DECIMAL(15, 2) DEFAULT 0.00,
    nb_telechargements INT DEFAULT 0,
    UNIQUE(secteur_id, mois, annee)
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX idx_donnees_stat_secteur ON donnees_statistiques(secteur_id);
CREATE INDEX idx_zones_secteur ON zones_geographiques(secteur_id);
CREATE INDEX idx_acteurs_secteur ON acteurs_principaux(secteur_id);
CREATE INDEX idx_cadre_secteur ON cadre_reglementaire(secteur_id);
CREATE INDEX idx_rapports_utilisateur ON rapports(utilisateur_id);
CREATE INDEX idx_rapports_secteur ON rapports(secteur_id);
CREATE INDEX idx_paiements_rapport ON paiements(rapport_id);
CREATE INDEX idx_logs_rapport ON logs_generation(rapport_id);

-- ============================================================
-- SEED DATA — Les 6 secteurs
-- ============================================================
INSERT INTO secteurs (slug, nom, description, prix_rapport, nombre_pages) VALUES
('tourisme', 'Tourisme', 'Flux touristiques, capacité hôtelière, revenus, zones côtières', 49.99, 13),
('agriculture', 'Agriculture', 'Surfaces cultivées, exportations, cultures principales', 39.99, 13),
('technologies', 'Technologies & Numérique', 'Startups, export IT, centres offshore', 59.99, 13),
('energies', 'Énergies Renouvelables', 'Capacité installée, projets en cours, objectifs 2030', 54.99, 13),
('textile', 'Textile & Habillement', 'Exportations, emplois, marchés', 44.99, 13),
('logistique', 'Logistique & Transport', 'Ports, aéroports, corridors commerciaux', 49.99, 13);
