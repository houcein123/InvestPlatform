-- ============================================================
-- VÉRIFICATION / CRÉATION RAPIDE POUR NEON
-- À exécuter dans l'éditeur SQL de Neon (console.neon.tech)
-- ============================================================

-- 1. Vérifier si la table secteurs existe
SELECT * FROM secteurs LIMIT 1;

-- Si ça donne une erreur "relation does not exist", exécute le schéma complet
-- (le fichier schema_investplatform.sql que tu as déjà)

-- 2. Vérifier si la table admins existe
SELECT * FROM admins LIMIT 1;

-- 3. Si la table admins n'existe pas, crée-la :
CREATE TABLE IF NOT EXISTS admins (
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

-- 4. Vérifier que les 6 secteurs sont insérés
SELECT id, slug, nom FROM secteurs;

-- 5. Si les secteurs n'existent pas, insère-les :
INSERT INTO secteurs (slug, nom, description, prix_rapport, nombre_pages) VALUES
('tourisme', 'Tourisme', 'Flux touristiques, capacité hôtelière, revenus, zones côtières', 49.99, 13),
('agriculture', 'Agriculture', 'Surfaces cultivées, exportations, cultures principales', 39.99, 13),
('technologies', 'Technologies & Numérique', 'Startups, export IT, centres offshore', 59.99, 13),
('energies', 'Énergies Renouvelables', 'Capacité installée, projets en cours, objectifs 2030', 54.99, 13),
('textile', 'Textile & Habillement', 'Exportations, emplois, marchés', 44.99, 13),
('logistique', 'Logistique & Transport', 'Ports, aéroports, corridors commerciaux', 49.99, 13)
ON CONFLICT DO NOTHING;
