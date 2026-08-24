# -*- coding: utf-8 -*-
"""Renseigne `rapports.taille_fichier` pour les rapports deja produits.

Le moteur n'ecrivait pas cette colonne : le panneau d'administration ne pouvait
donc afficher ni le poids d'un document ni le volume total. Le defaut est
corrige a la source ; ce script rattrape l'existant.

La taille est MESUREE sur le fichier reellement present sur disque. Un rapport
dont le PDF a disparu garde une taille nulle : inventer une valeur rendrait le
total faux sans que rien ne le signale.

    python scripts/restaurer_tailles_rapports.py
    python scripts/restaurer_tailles_rapports.py --simuler
"""

import argparse
import io
import os
import re
import sys

import psycopg2

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER_RAPPORTS = os.path.join(RACINE, "report-engine", "reports")


def lire_url():
    chemin = os.path.join(RACINE, "report-engine", ".env")
    for ligne in io.open(chemin, encoding="utf-8"):
        trouve = re.match(r"^\s*DATABASE_URL\s*=\s*(.+?)\s*$", ligne)
        if trouve:
            return trouve.group(1).split("#")[0].strip()
    sys.exit("DATABASE_URL absente de report-engine/.env")


def main():
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--simuler", action="store_true",
                           help="affiche ce qui serait fait, sans ecrire")
    options = analyseur.parse_args()

    connexion = psycopg2.connect(lire_url(), connect_timeout=20)
    connexion.autocommit = False
    curseur = connexion.cursor()

    curseur.execute("""
        SELECT id, chemin_fichier, taille_fichier
          FROM rapports
         WHERE chemin_fichier IS NOT NULL
      ORDER BY id
    """)
    lignes = curseur.fetchall()

    mesures, absents, deja = 0, 0, 0
    for rapport_id, chemin_url, taille_actuelle in lignes:
        if taille_actuelle is not None:
            deja += 1
            continue

        # `chemin_fichier` est une URL servie (/reports/xxx.pdf) : le fichier
        # vit dans report-engine/reports/.
        nom = os.path.basename(chemin_url)
        chemin_disque = os.path.join(DOSSIER_RAPPORTS, nom)

        if not os.path.exists(chemin_disque):
            print("  rapport %-4s : fichier absent (%s)" % (rapport_id, nom))
            absents += 1
            continue

        taille = os.path.getsize(chemin_disque)
        print("  rapport %-4s : %8d octets  %s" % (rapport_id, taille, nom))
        if not options.simuler:
            curseur.execute("UPDATE rapports SET taille_fichier = %s WHERE id = %s",
                            (taille, rapport_id))
        mesures += 1

    if options.simuler:
        connexion.rollback()
        print("\nSimulation : aucune ecriture. %d a mesurer, %d deja renseignes, %d fichiers absents."
              % (mesures, deja, absents))
    else:
        connexion.commit()
        print("\n%d taille(s) enregistree(s), %d deja renseignee(s), %d fichier(s) absent(s)."
              % (mesures, deja, absents))

    connexion.close()


if __name__ == "__main__":
    main()
