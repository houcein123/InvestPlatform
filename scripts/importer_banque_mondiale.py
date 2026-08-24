# -*- coding: utf-8 -*-
"""Importe des donnees officielles de la Banque mondiale.

    python scripts/importer_banque_mondiale.py --simuler
    python scripts/importer_banque_mondiale.py

POURQUOI PAS DU SCRAPING
-------------------------------------------------------------------------------
La Banque mondiale publie une API REST ouverte et documentee. Extraire les
memes chiffres en analysant des pages HTML serait plus fragile (toute refonte
du site casse l'extraction), plus lent, et juridiquement moins net. Ici, la
source est officielle, la licence explicite (CC BY 4.0) et le format stable.

CE QUE LE SCRIPT ECRIT
-------------------------------------------------------------------------------
1. `benchmarks_regionaux` — comparatif Tunisie / Maroc / Egypte. Seules les
   lignes ayant un EQUIVALENT REEL dans le catalogue de la Banque mondiale sont
   renseignees. Les autres (capacite hoteliere, nombre de startups, objectif
   2030...) restent vides : aucune source officielle ne les couvre a l'echelle
   des trois pays, et les inventer serait exactement l'erreur que la table a
   ete creee pour eviter.

2. `donnees_statistiques` — series tunisiennes 2020-2024, pour alimenter les
   graphiques du rapport et de l'interface.

REGLES RESPECTEES
-------------------------------------------------------------------------------
- Aucune valeur n'est interpolee, lissee ni estimee : une annee sans donnee
  publiee reste vide.
- Chaque ligne porte sa source et l'annee de reference.
- Les conversions d'unite sont explicites et commentees.
- Le script est idempotent : relance = mise a jour, jamais de doublon.
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.request

import psycopg2

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAYS = {"TUN": "valeur_tunisie", "MAR": "valeur_maroc", "EGY": "valeur_egypte"}
ANNEES_SERIE = [2020, 2021, 2022, 2023, 2024]

SOURCE = "Banque mondiale — World Development Indicators (CC BY 4.0)"


def sans_conversion(v):
    return v


def en_millions(v):
    return v / 1_000_000.0


def en_milliards(v):
    return v / 1_000_000_000.0


# ── Comparatif regional ──────────────────────────────────────────────────────
# Chaque entree relie un libelle DEJA PRESENT en base a l'indicateur officiel
# qui lui correspond reellement. Les libelles sans equivalent n'y figurent pas :
# mieux vaut une case vide qu'un chiffre approchant presente comme exact.
BENCHMARKS = {
    "tourisme": [
        ("Arrivées de touristes internationaux", "ST.INT.ARVL", en_millions),
        ("Recettes touristiques", "ST.INT.RCPT.CD", en_milliards),
    ],
    "agriculture": [
        ("Valeur ajoutée agricole (% du PIB)", "NV.AGR.TOTL.ZS", sans_conversion),
    ],
    "energies": [
        ("Part des renouvelables dans le mix", "EG.ELC.RNEW.ZS", sans_conversion),
    ],
    "logistique": [
        ("Trafic conteneurisé portuaire", "IS.SHP.GOOD.TU", en_millions),
    ],
}

# Indicateurs comparatifs SUPPLEMENTAIRES, crees s'ils n'existent pas encore.
BENCHMARKS_NOUVEAUX = {
    "tourisme": [
        ("Recettes touristiques (% des exportations)", "%", "ST.INT.RCPT.XP.ZS", sans_conversion),
    ],
    "agriculture": [
        ("Surface agricole (% du territoire)", "%", "AG.LND.AGRI.ZS", sans_conversion),
        ("Emploi agricole (% de l'emploi total)", "%", "SL.AGR.EMPL.ZS", sans_conversion),
    ],
    "technologies": [
        ("Internautes (% de la population)", "%", "IT.NET.USER.ZS", sans_conversion),
        ("Abonnements mobiles (pour 100 habitants)", "Nombre", "IT.CEL.SETS.P2", sans_conversion),
        ("Exportations de services TIC (% des services)", "%", "BX.GSR.CCIS.ZS", sans_conversion),
    ],
    "energies": [
        ("Renouvelables dans la consommation finale", "%", "EG.FEC.RNEW.ZS", sans_conversion),
        ("Consommation électrique par habitant", "kWh", "EG.USE.ELEC.KH.PC", sans_conversion),
    ],
    "textile": [
        ("Valeur ajoutée manufacturière (% du PIB)", "%", "NV.IND.MANF.ZS", sans_conversion),
        ("Exportations manufacturées (% des marchandises)", "%", "TX.VAL.MANF.ZS.UN", sans_conversion),
        ("Emploi industriel (% de l'emploi total)", "%", "SL.IND.EMPL.ZS", sans_conversion),
    ],
    "logistique": [
        ("Passagers aériens transportés", "Millions", "IS.AIR.PSGR", en_millions),
        ("Fret aérien", "Millions de tonnes-km", "IS.AIR.GOOD.MT.K1", sans_conversion),
    ],
}

# ── Series tunisiennes, pour les graphiques ──────────────────────────────────
SERIES_TUNISIE = {
    "tourisme": [
        ("Arrivées de touristes internationaux (Banque mondiale)", "Personnes", "ST.INT.ARVL", sans_conversion),
        ("Recettes du tourisme international", "USD courants", "ST.INT.RCPT.CD", sans_conversion),
    ],
    "agriculture": [
        ("Valeur ajoutée agricole (% du PIB)", "%", "NV.AGR.TOTL.ZS", sans_conversion),
        ("Surface agricole (% du territoire)", "%", "AG.LND.AGRI.ZS", sans_conversion),
        ("Emploi agricole (% de l'emploi total)", "%", "SL.AGR.EMPL.ZS", sans_conversion),
    ],
    "technologies": [
        ("Internautes (% de la population)", "%", "IT.NET.USER.ZS", sans_conversion),
        ("Abonnements mobiles (pour 100 habitants)", "Nombre", "IT.CEL.SETS.P2", sans_conversion),
        ("Exportations de services TIC (% des services)", "%", "BX.GSR.CCIS.ZS", sans_conversion),
    ],
    "energies": [
        ("Part des renouvelables dans l'électricité", "%", "EG.ELC.RNEW.ZS", sans_conversion),
        ("Renouvelables dans la consommation finale", "%", "EG.FEC.RNEW.ZS", sans_conversion),
        ("Consommation électrique par habitant", "kWh", "EG.USE.ELEC.KH.PC", sans_conversion),
    ],
    "textile": [
        ("Valeur ajoutée manufacturière (% du PIB)", "%", "NV.IND.MANF.ZS", sans_conversion),
        ("Exportations manufacturées (% des marchandises)", "%", "TX.VAL.MANF.ZS.UN", sans_conversion),
        ("Emploi industriel (% de l'emploi total)", "%", "SL.IND.EMPL.ZS", sans_conversion),
    ],
    "logistique": [
        ("Trafic conteneurisé portuaire", "EVP", "IS.SHP.GOOD.TU", sans_conversion),
        ("Passagers aériens transportés", "Personnes", "IS.AIR.PSGR", sans_conversion),
        ("Fret aérien", "Millions de tonnes-km", "IS.AIR.GOOD.MT.K1", sans_conversion),
    ],
}


def lire_url_base():
    chemin = os.path.join(RACINE, "report-engine", ".env")
    for ligne in io.open(chemin, encoding="utf-8"):
        trouve = re.match(r"^\s*DATABASE_URL\s*=\s*(.+?)\s*$", ligne)
        if trouve:
            return trouve.group(1).split("#")[0].strip()
    sys.exit("DATABASE_URL absente de report-engine/.env")


_cache = {}


def recuperer(code, pays="TUN;MAR;EGY", debut=2010, fin=2024):
    """Valeurs d'un indicateur, par pays puis par annee. Mises en cache."""
    cle = (code, pays, debut, fin)
    if cle in _cache:
        return _cache[cle]

    url = ("https://api.worldbank.org/v2/country/%s/indicator/%s"
           "?format=json&date=%d:%d&per_page=500" % (pays, code, debut, fin))

    for tentative in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as reponse:
                charge = json.load(reponse)
            break
        except Exception as erreur:
            if tentative == 2:
                print("    ! indicateur %s inaccessible : %s" % (code, str(erreur)[:60]))
                _cache[cle] = {}
                return {}
            time.sleep(1.5 * (tentative + 1))

    valeurs = {}
    for ligne in (charge[1] or []):
        if ligne["value"] is None:
            continue
        valeurs.setdefault(ligne["countryiso3code"], {})[int(ligne["date"])] = float(ligne["value"])

    _cache[cle] = valeurs
    return valeurs


def annee_commune(valeurs):
    """Annee la plus recente ou la Tunisie dispose d'une valeur publiee."""
    annees_tun = valeurs.get("TUN", {})
    return max(annees_tun) if annees_tun else None


def secteurs_par_slug(curseur):
    curseur.execute("SELECT slug, id FROM secteurs")
    return dict(curseur.fetchall())


def _f(valeur):
    """Valeur lisible dans les journaux, ou « n.d. » si elle manque."""
    if valeur is None:
        return "n.d."
    return "%.0f" % valeur if abs(valeur) >= 1000 else "%.2f" % valeur


def colonnes_pays(valeurs, convertir):
    """Derniere valeur publiee de chaque pays.

    Chaque pays garde SON annee la plus recente : imposer une annee commune
    viderait des cases pour lesquelles une valeur officielle existe pourtant.
    """
    colonnes = {}
    for iso, champ in PAYS.items():
        annees = valeurs.get(iso, {})
        colonnes[champ] = convertir(annees[max(annees)]) if annees else None
    return colonnes


def maj_benchmarks_existants(curseur, secteurs, simuler):
    """Renseigne les lignes comparatives deja presentes en base."""
    touchees = 0
    for slug, entrees in BENCHMARKS.items():
        if slug not in secteurs:
            continue
        for libelle, code, convertir in entrees:
            valeurs = recuperer(code)
            annee = annee_commune(valeurs)
            if annee is None:
                print("    - %-44s aucune donnee" % libelle[:44])
                continue

            colonnes = colonnes_pays(valeurs, convertir)
            print("    . %-44s %s  TN=%s MA=%s EG=%s" % (
                libelle[:44], annee, _f(colonnes["valeur_tunisie"]),
                _f(colonnes["valeur_maroc"]), _f(colonnes["valeur_egypte"])))

            if not simuler:
                curseur.execute("""
                    UPDATE benchmarks_regionaux
                       SET annee = %s, valeur_tunisie = %s, valeur_maroc = %s,
                           valeur_egypte = %s, source = %s, updated_at = CURRENT_TIMESTAMP
                     WHERE secteur_id = %s AND indicateur = %s
                """, (annee, colonnes["valeur_tunisie"], colonnes["valeur_maroc"],
                      colonnes["valeur_egypte"], SOURCE + " - " + code,
                      secteurs[slug], libelle))
            touchees += 1
    return touchees


def creer_benchmarks(curseur, secteurs, simuler):
    """Ajoute des indicateurs comparatifs supplementaires."""
    crees = 0
    for slug, entrees in BENCHMARKS_NOUVEAUX.items():
        if slug not in secteurs:
            continue
        for libelle, unite, code, convertir in entrees:
            valeurs = recuperer(code)
            annee = annee_commune(valeurs)
            if annee is None:
                continue

            colonnes = colonnes_pays(valeurs, convertir)
            print("    + %-44s %s  TN=%s MA=%s EG=%s" % (
                libelle[:44], annee, _f(colonnes["valeur_tunisie"]),
                _f(colonnes["valeur_maroc"]), _f(colonnes["valeur_egypte"])))

            if not simuler:
                # ON CONFLICT sur (secteur_id, indicateur) : relancer le script
                # met a jour au lieu de dupliquer.
                curseur.execute("""
                    INSERT INTO benchmarks_regionaux
                        (secteur_id, indicateur, unite, annee, valeur_tunisie,
                         valeur_maroc, valeur_egypte, source)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (secteur_id, indicateur) DO UPDATE
                       SET unite = EXCLUDED.unite, annee = EXCLUDED.annee,
                           valeur_tunisie = EXCLUDED.valeur_tunisie,
                           valeur_maroc = EXCLUDED.valeur_maroc,
                           valeur_egypte = EXCLUDED.valeur_egypte,
                           source = EXCLUDED.source, updated_at = CURRENT_TIMESTAMP
                """, (secteurs[slug], libelle, unite, annee, colonnes["valeur_tunisie"],
                      colonnes["valeur_maroc"], colonnes["valeur_egypte"],
                      SOURCE + " - " + code))
            crees += 1
    return crees


def importer_series(curseur, secteurs, simuler):
    """Series tunisiennes 2020-2024, pour les graphiques."""
    importees = 0
    for slug, entrees in SERIES_TUNISIE.items():
        if slug not in secteurs:
            continue
        print("  [%s]" % slug)
        for libelle, unite, code, convertir in entrees:
            valeurs = recuperer(code, pays="TUN").get("TUN", {})
            annuelles = dict((a, convertir(valeurs[a])) for a in ANNEES_SERIE if a in valeurs)

            if not annuelles:
                print("    - %-50s aucune donnee 2020-2024" % libelle[:50])
                continue

            apercu = " ".join("%d=%s" % (a, _f(v)) for a, v in sorted(annuelles.items()))
            print("    . %-50s %s" % (libelle[:50], apercu))

            if not simuler:
                # Les annees absentes restent NULL : une lacune de la source
                # publique ne se comble pas par interpolation.
                curseur.execute("""
                    INSERT INTO donnees_statistiques
                        (secteur_id, indicateur, unite, valeur_2020, valeur_2021,
                         valeur_2022, valeur_2023, valeur_2024, source)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (secteur_id, indicateur) DO UPDATE
                       SET unite = EXCLUDED.unite,
                           valeur_2020 = EXCLUDED.valeur_2020,
                           valeur_2021 = EXCLUDED.valeur_2021,
                           valeur_2022 = EXCLUDED.valeur_2022,
                           valeur_2023 = EXCLUDED.valeur_2023,
                           valeur_2024 = EXCLUDED.valeur_2024,
                           source = EXCLUDED.source, updated_at = CURRENT_TIMESTAMP
                """, (secteurs[slug], libelle, unite,
                      annuelles.get(2020), annuelles.get(2021), annuelles.get(2022),
                      annuelles.get(2023), annuelles.get(2024),
                      SOURCE + " - " + code))
            importees += 1
    return importees


def main():
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--simuler", action="store_true",
                           help="affiche ce qui serait importe, sans rien ecrire")
    options = analyseur.parse_args()

    connexion = psycopg2.connect(lire_url_base(), connect_timeout=30)
    connexion.autocommit = False
    curseur = connexion.cursor()

    try:
        secteurs = secteurs_par_slug(curseur)
        print("Source : %s\n" % SOURCE)

        print("COMPARATIF REGIONAL - lignes existantes")
        a = maj_benchmarks_existants(curseur, secteurs, options.simuler)

        print("\nCOMPARATIF REGIONAL - indicateurs ajoutes")
        b = creer_benchmarks(curseur, secteurs, options.simuler)

        print("\nSERIES TUNISIENNES 2020-2024")
        c = importer_series(curseur, secteurs, options.simuler)

        if options.simuler:
            connexion.rollback()
            print("\nSimulation : aucune ecriture.")
            print("%d comparatif(s) a mettre a jour, %d a ajouter, %d serie(s)." % (a, b, c))
        else:
            connexion.commit()
            print("\n%d comparatif(s) mis a jour, %d ajoute(s), %d serie(s) importee(s)." % (a, b, c))
            print("Recalculez ensuite les projections depuis Secteurs -> Donnees.")
    except Exception as erreur:
        connexion.rollback()
        print("\nECHEC - rien n'a ete ecrit :\n%s" % erreur, file=sys.stderr)
        sys.exit(1)
    finally:
        connexion.close()


if __name__ == "__main__":
    main()
