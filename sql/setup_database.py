#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup de la base InvestPlatform (Neon PostgreSQL).

Trois opérations indépendantes, combinables :

    python sql/setup_database.py --reset       # (re)crée le schéma — EFFACE TOUT
    python sql/setup_database.py --import-csv  # importe les CSV de data/
    python sql/setup_database.py --seed        # données de référence (zones, acteurs…)
    python sql/setup_database.py --all         # les trois, dans cet ordre

Deux différences importantes avec l'ancienne version :
  • le schéma n'est plus recopié ici : le script exécute sql/schema.sql, seule
    source de vérité du modèle de données ;
  • les CSV sont lus dans le dossier local data/ et non téléchargés depuis
    GitHub : l'import fonctionne hors ligne et reflète ce qui est réellement
    versionné dans le dépôt.
"""

import argparse
import csv
import os
import re
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# ── Chemins du projet ───────────────────────────────────────────────────────
SQL_DIR = Path(__file__).resolve().parent
ROOT_DIR = SQL_DIR.parent
DATA_DIR = ROOT_DIR / "data"
SCHEMA_FILE = SQL_DIR / "schema.sql"

# La configuration de la base est celle du backend : une seule URL à maintenir.
load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(SQL_DIR / ".env")  # repli si l'ancien fichier est encore utilisé

DATABASE_URL = os.getenv("DATABASE_URL")

# Dossier data/ → slug du secteur en base. « en general » regroupe des données
# macro-économiques non rattachées à un secteur : volontairement ignoré.
SECTEURS_MAP = {
    "Tourisme": "tourisme",
    "Agriculture": "agriculture",
    "Technologies & Numérique": "technologies",
    "Énergies Renouvelables": "energies",
    "Textile & Habillement": "textile",
    "Logistique & Transport": "logistique",
}

# Fenêtre temporelle du schéma. Les CSV de l'INS couvrent 2015-2023 :
# les années antérieures à 2020 sont ignorées, 2024 reste vide.
ANNEES = (2020, 2021, 2022, 2023, 2024)

MAX_INDICATEUR = 200


# ════════════════════════════════════════════════════════════════════════════
# Connexion
# ════════════════════════════════════════════════════════════════════════════

def get_connection():
    if not DATABASE_URL:
        sys.exit(
            "❌ DATABASE_URL introuvable.\n"
            "   Renseignez-la dans backend/.env (voir backend/.env.example)."
        )
    return psycopg2.connect(DATABASE_URL)


# ════════════════════════════════════════════════════════════════════════════
# 1. Schéma
# ════════════════════════════════════════════════════════════════════════════

def creer_schema(conn):
    """Exécute sql/schema.sql — supprime et recrée toutes les tables."""
    sql = SCHEMA_FILE.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("✅ Schéma créé et 6 secteurs insérés")


# ════════════════════════════════════════════════════════════════════════════
# 2. Import des CSV de l'INS
# ════════════════════════════════════════════════════════════════════════════

ANNEE_RE = re.compile(r"(19|20)\d{2}")


def extraire_annee(entete):
    """
    Année portée par un en-tête de colonne.

    Les tableaux INS mélangent deux formats : des colonnes annuelles (« 2023 »)
    et des colonnes trimestrielles (« quatrième-trimestre 2023 »). On ne retient
    que l'année — c'est la granularité du schéma.
    """
    trouve = ANNEE_RE.search(entete or "")
    return int(trouve.group(0)) if trouve else None


def parse_ins_csv(texte):
    """
    Parse un CSV au format INS tunisien :

        "NoFilter";...
        "Unité : Million de dinars";...
        "Source : Office National du Tourisme";...
        "Titre du tableau";...
        (lignes vides)
        "";"2015";"2016";...          ← ligne des périodes (années ou trimestres)
        "Libellé";"2415";"2373";...   ← lignes de données

    Retourne (unite, source, titre, annees, lignes) où `annees` contient une
    année par colonne (répétée quand le tableau est trimestriel).
    """
    lignes = texte.strip().split("\n")
    rows = list(csv.reader(lignes, delimiter=";", quotechar='"'))

    if len(rows) < 7:
        return None, None, None, [], []

    def cellule(i):
        return rows[i][0].strip() if len(rows) > i and rows[i] else ""

    unite = cellule(1).replace("Unité :", "").strip()
    source = cellule(2).replace("Source :", "").strip()
    titre = cellule(3)

    # Ligne des périodes : première colonne vide, colonnes suivantes datées
    idx_periodes = None
    for i, row in enumerate(rows):
        if i >= 4 and len(row) > 1 and row[0].strip() == "":
            if sum(1 for c in row[1:] if extraire_annee(c)) >= 2:
                idx_periodes = i
                break

    if idx_periodes is None:
        return unite, source, titre, [], []

    annees = [extraire_annee(c) for c in rows[idx_periodes][1:]]

    donnees = []
    for row in rows[idx_periodes + 1:]:
        if len(row) > 1 and row[0].strip():
            libelle = row[0].strip()
            valeurs = [c.strip().replace(" ", "").replace(",", ".") for c in row[1:]]
            donnees.append((libelle, valeurs))

    return unite, source, titre, annees, donnees


MOT_RE = re.compile(r"\w{5,}", re.UNICODE)


def _mots_significatifs(texte):
    return {m.lower() for m in MOT_RE.findall(texte or "")}


def nommer_indicateur(titre, libelle):
    """
    Construit un nom d'indicateur autoporteur.

    Beaucoup de tableaux INS ont des libellés de ligne qui ne veulent rien dire
    isolément : « Algérie », « Allemagne » dans le tableau des entrées de
    voyageurs, « Masculin » / « Féminin » dans les tableaux d'emploi. On les
    préfixe alors par le titre du tableau.

    Le préfixe est omis quand le libellé partage déjà au moins deux mots
    significatifs avec le titre : sans cela on produirait des noms redondants
    du type « Capacité d'hébergement par région — Capacité en lits par région ».
    """
    titre = (titre or "").strip()
    libelle = (libelle or "").strip()
    if not titre:
        return libelle[:MAX_INDICATEUR]

    communs = _mots_significatifs(titre) & _mots_significatifs(libelle)
    if len(communs) >= 2 or libelle.lower() in titre.lower():
        return libelle[:MAX_INDICATEUR]
    return f"{titre} — {libelle}"[:MAX_INDICATEUR]


def to_float(texte):
    try:
        return float(texte)
    except (TypeError, ValueError):
        return None


def inserer_serie(cur, secteur_id, indicateur, unite, source, annees, valeurs):
    """Insère (ou met à jour) une série ; renvoie True si une valeur est présente."""
    # Sur un tableau trimestriel, plusieurs colonnes portent la même année :
    # la dernière valeur renseignée l'emporte (trimestre le plus récent).
    par_annee = {a: None for a in ANNEES}
    for annee, valeur_txt in zip(annees, valeurs):
        if annee in par_annee:
            valeur = to_float(valeur_txt)
            if valeur is not None:
                par_annee[annee] = valeur

    if all(v is None for v in par_annee.values()):
        return False  # aucune donnée dans la fenêtre 2020-2024

    cur.execute(
        """
        INSERT INTO donnees_statistiques
            (secteur_id, indicateur, unite, valeur_2020, valeur_2021,
             valeur_2022, valeur_2023, valeur_2024, source)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (secteur_id, indicateur) DO UPDATE SET
            unite = EXCLUDED.unite,
            valeur_2020 = EXCLUDED.valeur_2020,
            valeur_2021 = EXCLUDED.valeur_2021,
            valeur_2022 = EXCLUDED.valeur_2022,
            valeur_2023 = EXCLUDED.valeur_2023,
            valeur_2024 = EXCLUDED.valeur_2024,
            source = EXCLUDED.source,
            updated_at = CURRENT_TIMESTAMP
        """,
        (secteur_id, indicateur, unite[:80] if unite else None,
         par_annee[2020], par_annee[2021], par_annee[2022],
         par_annee[2023], par_annee[2024], source[:255] if source else None),
    )
    return True


def get_secteur_id(cur, slug):
    cur.execute("SELECT id FROM secteurs WHERE slug = %s", (slug,))
    row = cur.fetchone()
    return row[0] if row else None


def importer_csv(conn, remplacer=False):
    """
    Parcourt data/<dossier>/*.csv et alimente donnees_statistiques.

    `remplacer=True` vide d'abord la table : indispensable après un changement
    de règle de nommage des indicateurs, sinon les anciennes lignes survivent
    à côté des nouvelles sous un autre nom. Les données sont intégralement
    reconstructibles depuis data/, l'opération est donc sans perte.
    """
    if not DATA_DIR.is_dir():
        sys.exit(f"❌ Dossier de données introuvable : {DATA_DIR}")

    total = 0
    with conn.cursor() as cur:
        if remplacer:
            cur.execute("DELETE FROM donnees_statistiques")
            print(f"   🗑️  {cur.rowcount} anciennes séries supprimées")
        for dossier, slug in SECTEURS_MAP.items():
            chemin = DATA_DIR / dossier
            if not chemin.is_dir():
                print(f"   ⚠️  Dossier absent : {dossier}")
                continue

            secteur_id = get_secteur_id(cur, slug)
            if not secteur_id:
                print(f"   ❌ Secteur « {slug} » absent de la base")
                continue

            compte = 0
            for fichier in sorted(chemin.glob("*.csv")):
                try:
                    texte = fichier.read_text(encoding="utf-8-sig")
                except UnicodeDecodeError:
                    texte = fichier.read_text(encoding="latin-1")

                unite, source, titre, annees, donnees = parse_ins_csv(texte)
                if not donnees:
                    print(f"      ⚠️  Format non reconnu : {fichier.name}")
                    continue

                for libelle, valeurs in donnees:
                    indicateur = nommer_indicateur(titre, libelle)
                    try:
                        if inserer_serie(cur, secteur_id, indicateur, unite, source, annees, valeurs):
                            compte += 1
                    except psycopg2.Error as err:
                        conn.rollback()
                        print(f"      ⚠️  « {indicateur[:50]} » ignoré : {err}")

            conn.commit()
            total += compte
            print(f"   📁 {dossier:<28} {compte:>3} indicateurs")

    print(f"✅ {total} indicateurs importés")


# ════════════════════════════════════════════════════════════════════════════
# 3. Données de référence
# ════════════════════════════════════════════════════════════════════════════

CHIFFRES_CLES = [
    # slug, PIB %, croissance %, emplois, exports MDT, entreprises, IDE MDT, part régionale %
    ("tourisme",     14.2,  8.5, 400000, 2500.0, 1200,  800.0, 3.5),
    ("agriculture",  12.5,  3.2, 350000, 1800.0, 5000,  400.0, 2.1),
    ("technologies",  5.8, 12.0,  85000, 3200.0,  800, 1200.0, 1.8),
    ("energies",      3.2, 15.5,  45000,  800.0,  300, 2500.0, 4.2),
    ("textile",       8.5,  4.1, 220000, 4200.0, 2200,  600.0, 5.5),
    ("logistique",    6.3,  6.8, 180000, 1500.0,  900,  900.0, 3.8),
]

ZONES = [
    ("tourisme", "Zone Touristique de Hammamet", "zone_cotiere", "Nabeul", 45.0,
     "Principal pôle touristique tunisien", "Exonération fiscale 10 ans"),
    ("tourisme", "Zone Franche de Nabeul", "zone_franche", "Nabeul", 12.0,
     "Zone franche dédiée au tourisme", "Exonération IRPP 5 ans"),
    ("agriculture", "Gouvernorat de Béja", "pole_industriel", "Béja", 320.0,
     "Production céréalière majeure", "Subventions agricoles"),
    ("technologies", "Technopole El Ghazala", "pole_industriel", "Ariana", 12.0,
     "Principal parc technologique du pays", "Exonération totale 10 ans"),
    ("energies", "Parc Éolien de Bizerte", "pole_industriel", "Bizerte", 25.0,
     "Premier parc éolien de Tunisie", "Tarifs d'achat garantis"),
    ("textile", "Zone Franche de Bizerte", "zone_franche", "Bizerte", 8.0,
     "Spécialisée textile et habillement", "Exonération fiscale 10 ans"),
    ("logistique", "Port de Radès", "port", "Ben Arous", 120.0,
     "Principal port commercial de Tunisie", "Zone franche portuaire"),
]

ACTEURS = [
    ("tourisme", "Office National du Tourisme Tunisien (ONTT)", "agence_publique",
     "Régulateur et promoteur du tourisme", "www.tunisie.tn", None, 250, True),
    ("tourisme", "Thomas Cook", "tour_operateur", "Voyagiste international",
     "www.thomascook.com", 5000.0, 8000, False),
    ("agriculture", "ONAGRI", "agence_publique", "Observatoire national de l'agriculture",
     "www.onagri.nat.tn", None, 120, True),
    ("technologies", "Vermeg", "entreprise", "Éditeur de solutions bancaires",
     "www.vermeg.com", 45.0, 1200, True),
    ("energies", "STEG", "agence_publique", "Société tunisienne d'électricité et de gaz",
     "www.steg.com.tn", 2500.0, 8000, True),
    ("textile", "Tunisia Textile", "entreprise", "Exportateur textile",
     None, 35.0, 850, True),
    ("logistique", "Tunisie Telecom", "entreprise", "Opérateur télécom historique",
     "www.tunisietelecom.tn", 450.0, 6000, True),
]

CADRES = [
    ("tourisme", "Code du Tourisme", 2020, "Cadre juridique régissant le secteur touristique",
     "Exonération IRPP 5 ans pour les nouveaux investissements", "Création d'emplois locaux", "loi"),
    ("agriculture", "Loi d'Orientation Agricole", 2018, "Modernisation du secteur agricole",
     "Subventions à l'équipement", "Respect des normes environnementales", "loi"),
    ("technologies", "Startup Act", 2018, "Cadre incitatif pour les startups",
     "Exonération fiscale 8 ans", "Création d'emplois qualifiés", "loi"),
    ("energies", "Loi sur les Énergies Renouvelables", 2019, "Promotion des énergies propres",
     "Tarifs d'achat garantis 20 ans", "Conventionnement avec la STEG", "loi"),
    ("textile", "Accord de Libre-Échange avec l'UE", 1995, "Accès préférentiel au marché européen",
     "Exonération douanière", "Règles d'origine strictes", "convention"),
    ("logistique", "Code des Transports", 2021, "Réforme du secteur logistique",
     "Libéralisation partielle", "Normes de sécurité renforcées", "loi"),
]


def inserer_reference(conn):
    """Insère les données de référence, sans doublon si le script est relancé."""
    with conn.cursor() as cur:
        for slug, *valeurs in CHIFFRES_CLES:
            secteur_id = get_secteur_id(cur, slug)
            if secteur_id:
                cur.execute(
                    """
                    INSERT INTO chiffres_cles
                        (secteur_id, contribution_pib_pct, croissance_annuelle_pct,
                         nombre_emplois, exportations_mdt, nombre_entreprises,
                         investissements_ide_mdt, part_marche_regional_pct)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (secteur_id) DO NOTHING
                    """,
                    (secteur_id, *valeurs),
                )

        for slug, nom, type_zone, gouvernorat, superficie, description, avantages in ZONES:
            secteur_id = get_secteur_id(cur, slug)
            if secteur_id:
                cur.execute(
                    "SELECT 1 FROM zones_geographiques WHERE secteur_id = %s AND nom = %s",
                    (secteur_id, nom),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO zones_geographiques
                            (secteur_id, nom, type, gouvernorat, superficie_km2, description, avantages)
                        VALUES (%s,%s,%s,%s,%s,%s,%s)
                        """,
                        (secteur_id, nom, type_zone, gouvernorat, superficie, description, avantages),
                    )

        for slug, nom, type_acteur, role, site, ca, employes, national in ACTEURS:
            secteur_id = get_secteur_id(cur, slug)
            if secteur_id:
                cur.execute(
                    "SELECT 1 FROM acteurs_principaux WHERE secteur_id = %s AND nom = %s",
                    (secteur_id, nom),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO acteurs_principaux
                            (secteur_id, nom, type, role, site_web, chiffre_affaires,
                             nombre_employes, est_national)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                        """,
                        (secteur_id, nom, type_acteur, role, site, ca, employes, national),
                    )

        for slug, titre, annee, description, avantages, obligations, type_texte in CADRES:
            secteur_id = get_secteur_id(cur, slug)
            if secteur_id:
                cur.execute(
                    "SELECT 1 FROM cadre_reglementaire WHERE secteur_id = %s AND titre = %s",
                    (secteur_id, titre),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO cadre_reglementaire
                            (secteur_id, titre, annee, description, avantages, obligations, type_texte)
                        VALUES (%s,%s,%s,%s,%s,%s,%s)
                        """,
                        (secteur_id, titre, annee, description, avantages, obligations, type_texte),
                    )

    conn.commit()
    print("✅ Données de référence insérées (zones, acteurs, cadre, chiffres clés)")


# ════════════════════════════════════════════════════════════════════════════
# 4. Vérification
# ════════════════════════════════════════════════════════════════════════════

TABLES_VERIFIEES = [
    "secteurs", "donnees_statistiques", "chiffres_cles",
    "zones_geographiques", "acteurs_principaux", "cadre_reglementaire",
]


def verifier(conn):
    print("\n📊 État de la base :")
    with conn.cursor() as cur:
        for table in TABLES_VERIFIEES:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            print(f"   • {table:<24} {cur.fetchone()[0]:>4}")


# ════════════════════════════════════════════════════════════════════════════
# Point d'entrée
# ════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Setup de la base InvestPlatform")
    parser.add_argument("--reset", action="store_true",
                        help="exécute sql/schema.sql (SUPPRIME toutes les tables)")
    parser.add_argument("--import-csv", action="store_true",
                        help="importe les CSV du dossier data/")
    parser.add_argument("--reimport", action="store_true",
                        help="vide donnees_statistiques puis réimporte les CSV")
    parser.add_argument("--seed", action="store_true",
                        help="insère les données de référence")
    parser.add_argument("--all", action="store_true",
                        help="équivaut à --reset --import-csv --seed")
    args = parser.parse_args()

    if args.reimport:
        args.import_csv = True

    if args.all:
        args.reset = args.import_csv = args.seed = True

    if not (args.reset or args.import_csv or args.seed):
        parser.print_help()
        return

    print("=" * 60)
    print("🚀 Setup InvestPlatform — base Neon")
    print("=" * 60)

    conn = get_connection()
    try:
        if args.reset:
            reponse = input("\n⚠️  --reset SUPPRIME toutes les tables. Confirmer ? [oui/N] ")
            if reponse.strip().lower() != "oui":
                print("   Annulé.")
                return
            print("\n📦 Création du schéma…")
            creer_schema(conn)

        if args.import_csv:
            print("\n📊 Import des CSV locaux…")
            importer_csv(conn, remplacer=args.reimport)

        if args.seed:
            print("\n🏗️  Données de référence…")
            inserer_reference(conn)

        verifier(conn)
    finally:
        conn.close()

    print("\n" + "=" * 60)
    print("✅ Terminé")
    print("=" * 60)


if __name__ == "__main__":
    main()
