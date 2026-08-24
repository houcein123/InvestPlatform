"""
Applique les migrations SQL non encore presentes en base.

Non destructif : chaque migration est ecrite en ADD COLUMN IF NOT EXISTS /
CREATE TABLE IF NOT EXISTS, elle peut donc etre rejouee sans effet de bord.
Aucune table n'est supprimee, aucune donnee n'est modifiee.

Usage :
    python scripts/appliquer-migrations.py            # toutes les migrations
    python scripts/appliquer-migrations.py 007 008    # seulement celles-ci
"""

import os
import re
import sys
import glob

import psycopg2

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lire_url():
    """URL de connexion, lue dans report-engine/.env — jamais affichee."""
    chemin = os.path.join(RACINE, "report-engine", ".env")
    if not os.path.exists(chemin):
        sys.exit("report-engine/.env introuvable : copiez .env.example et renseignez DATABASE_URL.")

    with open(chemin, encoding="utf-8") as fichier:
        for ligne in fichier:
            correspondance = re.match(r"^\s*DATABASE_URL\s*=\s*(.+?)\s*$", ligne)
            if correspondance:
                return correspondance.group(1).split("#")[0].strip()
    sys.exit("DATABASE_URL absente de report-engine/.env")


def main():
    filtres = sys.argv[1:]
    fichiers = sorted(glob.glob(os.path.join(RACINE, "sql", "migrations", "*.sql")))
    if filtres:
        fichiers = [f for f in fichiers if any(os.path.basename(f).startswith(p) for p in filtres)]

    if not fichiers:
        sys.exit("Aucune migration correspondante.")

    connexion = psycopg2.connect(lire_url(), connect_timeout=20)
    connexion.autocommit = False

    try:
        for chemin in fichiers:
            nom = os.path.basename(chemin)
            with open(chemin, encoding="utf-8") as fichier:
                sql = fichier.read()

            # Chaque migration est jouee dans SA PROPRE transaction : une
            # migration en echec ne doit pas annuler celles deja appliquees.
            with connexion.cursor() as curseur:
                curseur.execute(sql)
            connexion.commit()
            print("  OK  %s" % nom)
    except Exception as erreur:
        connexion.rollback()
        print("\nECHEC sur %s :\n%s" % (nom, erreur), file=sys.stderr)
        sys.exit(1)
    finally:
        connexion.close()

    print("\nMigrations appliquees.")


if __name__ == "__main__":
    main()
