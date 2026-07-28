#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup complet de la base InvestPlatform sur Neon PostgreSQL
- Crée les tables du schéma
- Télécharge et parse les CSV depuis GitHub
- Insère les données dans les tables appropriées
"""

import os

from dotenv import load_dotenv
import psycopg2
import csv
import io
import requests
from urllib.parse import quote
load_dotenv()


# ============================================================
# CONFIGURATION — Remplace par ton vrai mot de passe Neon
# ============================================================
DATABASE_URL_PASSWORD = os.getenv("DATABASE_URL_PASSWORD")

DB_CONFIG = {
    "host": "ep-proud-silence-ayite9aq.c-5.us-east-2.aws.neon.tech",
    "database": "neondb",
    "user": "neondb_owner",
    "password": DATABASE_URL_PASSWORD,  
    "port": "5432",
    "sslmode": "require"
}

GITHUB_RAW = "https://raw.githubusercontent.com/houcein123/InvestPlatform/main/data"

# Mapping dossier GitHub → slug secteur
SECTEURS_MAP = {
    "Tourisme": "tourisme",
    "Agriculture": "agriculture",
    "Technologies & Numérique": "technologies",
    "Énergies Renouvelables": "energies",
    "Textile & Habillement": "textile",
    "Logistique & Transport": "logistique",
    "en general": None  # Données générales, pas liées à un secteur spécifique
}

# ============================================================
# 1. SCHÉMA SQL
# ============================================================
SCHEMA_SQL = """
-- Suppression des tables si elles existent (ordre inverse des dépendances)
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
DROP TABLE IF EXISTS achats CASCADE;

-- 1. TABLE : secteurs
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

-- 2. TABLE : donnees_statistiques
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

-- 3. TABLE : chiffres_cles
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

-- 4. TABLE : zones_geographiques
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

-- 5. TABLE : acteurs_principaux
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

-- 6. TABLE : cadre_reglementaire
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

-- 7. TABLE : utilisateurs
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

-- 8. TABLE : admins
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

-- 9. TABLE : rapports
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

-- 10. TABLE : paiements
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

-- 11. TABLE : logs_generation
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

-- 12. TABLE : statistiques_ventes
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

-- SEED DATA — Les 6 secteurs
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

-- 2. Créer la table Achats consolidée (vue matérialisée ou table)
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
"""

# ============================================================
# 2. FONCTIONS UTILITAIRES
# ============================================================

def get_connection():
    """Retourne une connexion à la base Neon."""
    return psycopg2.connect(**DB_CONFIG)

def creer_tables():
    """Exécute le schéma SQL complet."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(SCHEMA_SQL)
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Tables créées et secteurs insérés avec succès !")

def get_secteur_id(cursor, slug):
    """Récupère l'ID d'un secteur par son slug."""
    cursor.execute("SELECT id FROM secteurs WHERE slug = %s", (slug,))
    result = cursor.fetchone()
    return result[0] if result else None

def parse_ins_csv(raw_text):
    """
    Parse un CSV au format INS tunisien :
    - Lignes d'en-tête (NoFilter, Unité, Source, Titre)
    - Lignes vides
    - Ligne d'années
    - Lignes de données
    Retourne : (unite, source, titre, years, data_rows)
    """
    lines = raw_text.strip().split('\n')
    reader = csv.reader(lines, delimiter=';', quotechar='"')
    rows = list(reader)

    if len(rows) < 7:
        return None, None, None, [], []

    # Ligne 1 : Unité
    unite = rows[1][0].replace('Unité :', '').strip() if len(rows[1]) > 0 else ''
    # Ligne 2 : Source
    source = rows[2][0].replace('Source :', '').strip() if len(rows[2]) > 0 else ''
    # Ligne 3 : Titre
    titre = rows[3][0].strip() if len(rows[3]) > 0 else ''

    # Trouver la ligne des années (première ligne avec des années)
    years_row_idx = None
    for i, row in enumerate(rows):
        if i >= 6 and len(row) > 1:
            # Vérifier si la première colonne est vide et les suivantes sont des années
            if row[0] == '' and any(col.isdigit() and len(col) == 4 for col in row[1:] if col):
                years_row_idx = i
                break

    if years_row_idx is None:
        return unite, source, titre, [], []

    years = [col.strip('"') for col in rows[years_row_idx][1:] if col.strip('"')]

    # Lignes de données
    data_rows = []
    for i in range(years_row_idx + 1, len(rows)):
        row = rows[i]
        if len(row) > 1 and row[0].strip('"'):
            indicateur = row[0].strip('"')
            values = [col.strip('"').replace(' ', '').replace(',', '.') for col in row[1:]]
            data_rows.append((indicateur, values))

    return unite, source, titre, years, data_rows

def inserer_donnees_statistiques(cursor, secteur_id, indicateur, unite, source, years, values):
    """Insère une ligne dans donnees_statistiques."""
    # Mapper les années vers les colonnes
    vals = {2020: None, 2021: None, 2022: None, 2023: None, 2024: None}

    for year_str, val_str in zip(years, values):
        try:
            year = int(year_str)
            if year in vals and val_str and val_str.replace('.', '').replace('-', '').isdigit():
                vals[year] = float(val_str)
        except (ValueError, IndexError):
            continue

    # Vérifier si l'indicateur existe déjà pour ce secteur
    cursor.execute(
        "SELECT id FROM donnees_statistiques WHERE secteur_id = %s AND indicateur = %s",
        (secteur_id, indicateur)
    )
    if cursor.fetchone():
        return  # Déjà inséré

    cursor.execute("""
        INSERT INTO donnees_statistiques 
        (secteur_id, indicateur, unite, valeur_2020, valeur_2021, valeur_2022, valeur_2023, valeur_2024, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        secteur_id, indicateur, unite,
        vals[2020], vals[2021], vals[2022], vals[2023], vals[2024],
        source
    ))

def telecharger_csv(url):
    """Télécharge un CSV depuis GitHub Raw."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"   ⚠️ Erreur téléchargement {url}: {e}")
        return None

def traiter_dossier_secteur(cursor, dossier_nom, secteur_slug):
    """Traite tous les CSV d'un dossier secteur."""
    secteur_id = get_secteur_id(cursor, secteur_slug)
    if not secteur_id:
        print(f"   ❌ Secteur '{secteur_slug}' non trouvé")
        return 0

    # Lister les fichiers du dossier via l'API GitHub
    api_url = f"https://api.github.com/repos/houcein123/InvestPlatform/contents/data/{quote(dossier_nom)}"
    try:
        resp = requests.get(api_url, timeout=30)
        resp.raise_for_status()
        files = resp.json()
    except Exception as e:
        print(f"   ⚠️ Erreur listing {dossier_nom}: {e}")
        return 0

    count = 0
    for f in files:
        if f['type'] == 'file' and f['name'].endswith('.csv'):
            raw_url = f['download_url']
            text = telecharger_csv(raw_url)
            if not text:
                continue

            unite, source, titre, years, data_rows = parse_ins_csv(text)
            if not data_rows:
                continue

            for indicateur, values in data_rows:
                try:
                    inserer_donnees_statistiques(cursor, secteur_id, indicateur, unite, source, years, values)
                    count += 1
                except Exception as e:
                    print(f"   ⚠️ Erreur insertion '{indicateur}': {e}")

    return count

def inserer_donnees_exemple(cursor):
    """Insère des données d'exemple pour les tables vides."""

    # Chiffres clés par secteur (données approximatives/exemples)
    chiffres = [
        ("tourisme", 14.2, 8.5, 400000, 2500.0, 1200, 800.0, 3.5),
        ("agriculture", 12.5, 3.2, 350000, 1800.0, 5000, 400.0, 2.1),
        ("technologies", 5.8, 12.0, 85000, 3200.0, 800, 1200.0, 1.8),
        ("energies", 3.2, 15.5, 45000, 800.0, 300, 2500.0, 4.2),
        ("textile", 8.5, 4.1, 220000, 4200.0, 2200, 600.0, 5.5),
        ("logistique", 6.3, 6.8, 180000, 1500.0, 900, 900.0, 3.8),
    ]

    for slug, pib, croiss, emplois, exports, entreprises, ide, part in chiffres:
        secteur_id = get_secteur_id(cursor, slug)
        if secteur_id:
            cursor.execute("""
                INSERT INTO chiffres_cles 
                (secteur_id, contribution_pib_pct, croissance_annuelle_pct, nombre_emplois, 
                 exportations_mdt, nombre_entreprises, investissements_ide_mdt, part_marche_regional_pct)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (secteur_id) DO NOTHING
            """, (secteur_id, pib, croiss, emplois, exports, entreprises, ide, part))

    # Zones géographiques exemple
    zones = [
        ("tourisme", "Zone Touristique de Hammamet", "zone_cotiere", "Nabeul", 45.0, "Principal pôle touristique tunisien", "Exonération fiscale 10 ans"),
        ("tourisme", "Zone Franche de Nabeul", "zone_franche", "Nabeul", 12.0, "Zone franche dédiée au tourisme", "Exonération IRPP 5 ans"),
        ("agriculture", "Gouvernorat de Béja", "pole_industriel", "Béja", 320.0, "Production céréalière majeure", "Subventions agricoles"),
        ("technologies", "Technopole El Ghazala", "pole_industriel", "Ariana", 12.0, "Plus grand parc technologique d'Afrique", "Exonération totale 10 ans"),
        ("energies", "Parc Éolien de Bizerte", "pole_industriel", "Bizerte", 25.0, "Premier parc éolien de Tunisie", "Tarifs d'achat garantis"),
        ("textile", "Zone Franche de Bizerte", "zone_franche", "Bizerte", 8.0, "Spécialisée textile et habillement", "Exonération fiscale 10 ans"),
        ("logistique", "Port de Radès", "port", "Ben Arous", 120.0, "Principal port commercial de Tunisie", "Zone franche portuaire"),
    ]

    for slug, nom, type_zone, gov, superficie, desc, avantages in zones:
        secteur_id = get_secteur_id(cursor, slug)
        if secteur_id:
            cursor.execute("""
                INSERT INTO zones_geographiques 
                (secteur_id, nom, type, gouvernorat, superficie_km2, description, avantages)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (secteur_id, nom, type_zone, gov, superficie, desc, avantages))

    # Acteurs principaux exemple
    acteurs = [
        ("tourisme", "Office National du Tourisme Tunisien (ONTT)", "agence_publique", "Régulateur et promoteur du tourisme", "www.tunisie.tn", None, 250, True),
        ("tourisme", "Thomas Cook", "tour_operateur", "Leader mondial des voyages", "www.thomascook.com", 5000.0, 8000, False),
        ("agriculture", "ONAGRI", "agence_publique", "Office national des produits agricoles", "www.onagri.nat.tn", None, 120, True),
        ("technologies", "Vermeg", "entreprise", "Leader des solutions bancaires", "www.vermeg.com", 45.0, 1200, True),
        ("energies", "STEG", "agence_publique", "Société tunisienne d'électricité et de gaz", "www.steg.com.tn", 2500.0, 8000, True),
        ("textile", "Société de confection \"Tunisia Textile\"", "entreprise", "Exportateur textile majeur", None, 35.0, 850, True),
        ("logistique", "Tunisie Telecom", "entreprise", "Opérateur télécom historique", "www.tunisietelecom.tn", 450.0, 6000, True),
    ]

    for slug, nom, type_acteur, role, site, ca, employes, national in acteurs:
        secteur_id = get_secteur_id(cursor, slug)
        if secteur_id:
            cursor.execute("""
                INSERT INTO acteurs_principaux 
                (secteur_id, nom, type, role, site_web, chiffre_affaires, nombre_employes, est_national)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (secteur_id, nom, type_acteur, role, site, ca, employes, national))

    # Cadre réglementaire exemple
    cadres = [
        ("tourisme", "Code du Tourisme", 2020, "Cadre juridique régissant le secteur touristique", "Exonération IRPP 5 ans pour nouveaux investissements", "Création d'emplois locaux", "loi", True),
        ("agriculture", "Loi d'Orientation Agricole", 2018, "Modernisation du secteur agricole", "Subventions équipements", "Respect environnemental", "loi", True),
        ("technologies", "Startup Act", 2018, "Cadre incitatif pour les startups", "Exonération fiscale 8 ans", "Création d'emplois qualifiés", "loi", True),
        ("energies", "Loi sur les Énergies Renouvelables", 2019, "Promotion des énergies propres", "Tarifs d'achat garantis 20 ans", "Partenariat avec STEG", "loi", True),
        ("textile", "Accord de Libre-Échange avec l'UE", 1995, "Accès préférentiel au marché européen", "Exonération douanière", "Règles d'origine strictes", "convention", True),
        ("logistique", "Code des Transports", 2021, "Réforme du secteur logistique", "Libéralisation partielle", "Normes de sécurité", "loi", True),
    ]

    for slug, titre, annee, desc, avantages, obligations, type_texte, en_vigueur in cadres:
        secteur_id = get_secteur_id(cursor, slug)
        if secteur_id:
            cursor.execute("""
                INSERT INTO cadre_reglementaire 
                (secteur_id, titre, annee, description, avantages, obligations, type_texte, est_en_vigueur)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (secteur_id, titre, annee, desc, avantages, obligations, type_texte, en_vigueur))

# ============================================================
# 3. SCRIPT PRINCIPAL
# ============================================================

def main():
    print("=" * 60)
    print("🚀 Setup InvestPlatform — Base de données Neon")
    print("=" * 60)

    # Vérifier le mot de passe
    if DB_CONFIG["password"] == "TON_MOT_DE_PASSE_ICI":
        print("\n❌ ERREUR : Tu dois remplacer 'TON_MOT_DE_PASSE_ICI' par ton vrai mot de passe Neon !")
        print("   Trouve-le sur ton dashboard Neon → Connection Details → Show password")
        return

    # Étape 1 : Créer les tables
    print("\n📦 Étape 1/4 : Création des tables...")
    creer_tables()

    # Étape 2 : Insérer les données CSV
    print("\n📊 Étape 2/4 : Téléchargement et insertion des données CSV...")
    conn = get_connection()
    cursor = conn.cursor()

    total_insertions = 0
    for dossier, slug in SECTEURS_MAP.items():
        if slug is None:
            continue  # Skip "en general" pour l'instant
        print(f"\n   📁 Traitement : {dossier}")
        count = traiter_dossier_secteur(cursor, dossier, slug)
        total_insertions += count
        print(f"   ✅ {count} indicateurs insérés")

    conn.commit()

    # Étape 3 : Insérer les données d'exemple
    print("\n🏗️ Étape 3/4 : Insertion des données de référence (zones, acteurs, cadre)...")
    inserer_donnees_exemple(cursor)
    conn.commit()

    # Étape 4 : Vérification
    print("\n🔍 Étape 4/4 : Vérification...")
    cursor.execute("SELECT COUNT(*) FROM secteurs")
    nb_secteurs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM donnees_statistiques")
    nb_stats = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM chiffres_cles")
    nb_chiffres = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM zones_geographiques")
    nb_zones = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM acteurs_principaux")
    nb_acteurs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM cadre_reglementaire")
    nb_cadres = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("✅ SETUP TERMINÉ AVEC SUCCÈS !")
    print("=" * 60)
    print(f"   • Secteurs           : {nb_secteurs}")
    print(f"   • Données statistiques : {nb_stats}")
    print(f"   • Chiffres clés      : {nb_chiffres}")
    print(f"   • Zones géographiques : {nb_zones}")
    print(f"   • Acteurs principaux : {nb_acteurs}")
    print(f"   • Cadre réglementaire : {nb_cadres}")
    print("=" * 60)

if __name__ == "__main__":
    main()
