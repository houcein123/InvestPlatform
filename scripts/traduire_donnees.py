"""
Traduit en anglais les données textuelles de la base (migration 011).

    python scripts/traduire_donnees.py --essai        # montre, n'ecrit rien
    python scripts/traduire_donnees.py                # traduit et ecrit
    python scripts/traduire_donnees.py zones acteurs  # seulement ces cibles
    python scripts/traduire_donnees.py --forcer       # retraduit meme l'existant

CE QUE FAIT CE SCRIPT
    Il lit les colonnes francaises, demande leur traduction au modele Groq,
    et ecrit le resultat dans les colonnes `_en` correspondantes.

DEUX PRECAUTIONS QUI COMPTENT

1. LA DEDUPLICATION. Les intitules d'indicateurs et les unites se repetent
   massivement d'une ligne a l'autre : « Millions de dinars » peut apparaitre
   des centaines de fois dans donnees_statistiques. Traduire ligne par ligne
   couterait des centaines d'appels pour une poignee de valeurs distinctes.
   Le script regroupe donc par VALEUR, traduit une fois, et applique partout.

2. LES TRADUCTIONS MANUELLES SONT PROTEGEES. Une traduction corrigee a la main
   est marquee 'manuelle' dans traductions_journal et n'est jamais ecrasee par
   une nouvelle execution, meme avec --forcer. Sans cela, la premiere relance
   du script effacerait silencieusement le travail de relecture.

Les noms propres ne sont pas traduits : raisons sociales, gouvernorats,
organismes sources. Voir l'en-tete de la migration 011 pour le detail.
"""

import os
import re
import sys
import json
import time
import urllib.error
import urllib.request

import psycopg2
import psycopg2.extras

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Une cible = une table, et les colonnes textuelles a traduire.
# `libelle` sert aux arguments de ligne de commande.
CIBLES = [
    {
        "libelle": "series",
        "table": "donnees_statistiques",
        "colonnes": ["indicateur", "unite"],
        "contexte": "intitules d'indicateurs statistiques et unites de mesure",
    },
    {
        "libelle": "zones",
        "table": "zones_geographiques",
        # `type` est un CODE d'enumeration (zone_franche, port) compare par le
        # code metier : son libelle se traduit dans le dictionnaire du moteur,
        # jamais en base. Le traduire ici casserait les comparaisons.
        "colonnes": ["description", "avantages"],
        "contexte": "types de zones economiques et leurs descriptions",
    },
    {
        "libelle": "acteurs",
        "table": "acteurs_principaux",
        "colonnes": ["role", "description"],  # `type` : code d'enumeration
        "contexte": "types d'entreprises et leurs roles dans le secteur",
    },
    {
        "libelle": "cadre",
        "table": "cadre_reglementaire",
        "colonnes": ["titre", "description", "avantages", "obligations"],  # `type_texte` : code
        "contexte": "textes reglementaires et fiscaux tunisiens",
    },
    {
        "libelle": "benchmarks",
        "table": "benchmarks_regionaux",
        # `source` est inclus ICI et pas dans les series sectorielles : les
        # valeurs y sont des libelles composes (« Banque mondiale — World
        # Development Indicators »), pas des sigles. Un sigle sans forme
        # anglaise distincte est rendu a l'identique par le modele.
        "colonnes": ["indicateur", "unite", "commentaire", "source"],
        "contexte": "indicateurs de comparaison regionale et leurs sources",
    },
]

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Un lot par appel : assez pour amortir le cout, assez court pour que le
# modele ne perde pas l'alignement entre entree et sortie.
TAILLE_LOT = 20


def lire_env(cle):
    """Valeur lue dans report-engine/.env — jamais affichee."""
    chemin = os.path.join(RACINE, "report-engine", ".env")
    if not os.path.exists(chemin):
        sys.exit("report-engine/.env introuvable.")
    with open(chemin, encoding="utf-8") as fichier:
        for ligne in fichier:
            trouve = re.match(r"^\s*%s\s*=\s*(.+?)\s*$" % re.escape(cle), ligne)
            if trouve:
                return trouve.group(1).split("#")[0].strip()
    return None


def appeler_groq(cle_api, modele, prompt):
    """Un appel de completion, avec reprise sur saturation de quota."""
    corps = json.dumps({
        "model": modele,
        "messages": [{"role": "user", "content": prompt}],
        # Une traduction doit etre reproductible : deux executions sur la meme
        # entree ne doivent pas produire deux libelles differents en base.
        "temperature": 0,
        "max_tokens": 4000,
    }).encode("utf-8")

    for tentative in range(1, 5):
        requete = urllib.request.Request(
            GROQ_URL,
            data=corps,
            headers={
                "Authorization": "Bearer %s" % cle_api,
                "Content-Type": "application/json",
                # Sans User-Agent, la protection Cloudflare devant l'API rejette
                # la requete avec un « 403 error code: 1010 » qui ressemble a une
                # cle invalide sans en etre une. urllib n'en envoie aucun par
                # defaut, contrairement aux SDK officiels.
                "User-Agent": "tunisia-invest-traduction/1.0",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(requete, timeout=120) as reponse:
                charge = json.loads(reponse.read().decode("utf-8"))
                return charge["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as erreur:
            if erreur.code == 429 and tentative < 4:
                attente = 2 ** tentative
                print("    quota atteint, reprise dans %d s" % attente)
                time.sleep(attente)
                continue
            raise
    raise RuntimeError("Groq injoignable apres 4 tentatives")


# Caracteres que les modeles glissent volontiers dans leurs sorties et que
# l'encodage WinAnsi des polices standard du PDF ne connait pas. Non traites,
# ils disparaissent du document ou le font echouer au rendu.
SUBSTITUTIONS_PDF = {
    "‑": "-",   # trait d'union insecable
    "‐": "-",   # trait d'union typographique
    "‒": "-",   # tiret numerique
    "⁃": "-",   # puce tiret
    " ": " ",   # espace insecable etroite exclue par certaines polices
    " ": " ",   # espace fine insecable
    "−": "-",   # signe moins mathematique
}


def assainir(texte):
    """Ramene une traduction au jeu de caracteres que le PDF sait rendre."""
    for source, remplacement in SUBSTITUTIONS_PDF.items():
        texte = texte.replace(source, remplacement)
    return texte


def traduire_lot(cle_api, modele, valeurs, contexte):
    """
    Traduit une liste de chaines, et rend un dictionnaire {source: traduction}.

    Le modele repond en JSON indexe par NUMERO, pas par texte source : un
    modele qui doit recopier la chaine francaise comme cle finit par la
    reformuler, et l'appariement casse silencieusement.
    """
    numerotees = "\n".join("%d. %s" % (i + 1, v) for i, v in enumerate(valeurs))

    prompt = (
        "You are translating database content for an economic report platform "
        "about Tunisia. Context: %s.\n\n"
        "Translate each numbered French entry into English.\n\n"
        "Rules:\n"
        "- Keep proper nouns unchanged (company names, Tunisian place names, "
        "institution acronyms such as INS, BCT, APII, FIPA).\n"
        "- Keep numbers, years and units of measurement exactly as they are.\n"
        "- Use the standard economic English term, not a literal word-for-word "
        "rendering.\n"
        "- Preserve the register: these are entries in a professional report.\n"
        "- If an entry is already English or is a bare code, return it unchanged.\n\n"
        "ENTRIES:\n%s\n\n"
        'Answer with STRICT JSON only, no prose, no markdown fence:\n'
        '{"1":"translation","2":"translation"}'
    ) % (contexte, numerotees)

    brut = appeler_groq(cle_api, modele, prompt)

    debut, fin = brut.find("{"), brut.rfind("}")
    if debut == -1 or fin <= debut:
        raise ValueError("reponse illisible du modele")
    par_numero = json.loads(brut[debut:fin + 1])

    resultat = {}
    for index, source in enumerate(valeurs):
        traduction = par_numero.get(str(index + 1))
        if isinstance(traduction, str) and traduction.strip():
            resultat[source] = assainir(traduction.strip())
    return resultat


def valeurs_a_traduire(curseur, table, colonne, forcer):
    """
    Valeurs françaises distinctes restant a traduire.

    Le regroupement par valeur est ce qui rend l'operation abordable : une
    unite repetee sur 300 lignes ne coute qu'une seule traduction.
    """
    condition = "" if forcer else "AND (t.%s_en IS NULL OR t.%s_en = '')" % (colonne, colonne)
    curseur.execute(
        """
        SELECT t.{col} AS source, array_agg(t.id) AS ids
        FROM {table} t
        WHERE t.{col} IS NOT NULL AND t.{col} <> ''
          {condition}
          -- Une traduction corrigee a la main ne doit jamais etre ecrasee.
          AND NOT EXISTS (
              SELECT 1 FROM traductions_journal j
              WHERE j.table_cible = %s AND j.colonne = %s
                AND j.ligne_id = t.id AND j.origine = 'manuelle'
          )
        GROUP BY t.{col}
        ORDER BY t.{col}
        """.format(col=colonne, table=table, condition=condition),
        (table, colonne),
    )
    return curseur.fetchall()


def ecrire_traductions(curseur, table, colonne, groupes, traductions, modele):
    """Applique les traductions et journalise chaque ligne touchee."""
    lignes_touchees = 0
    for groupe in groupes:
        traduction = traductions.get(groupe["source"])
        if not traduction:
            continue

        curseur.execute(
            "UPDATE {table} SET {col}_en = %s WHERE id = ANY(%s)".format(
                table=table, col=colonne),
            (traduction, groupe["ids"]),
        )
        lignes_touchees += len(groupe["ids"])

        psycopg2.extras.execute_batch(curseur, """
            INSERT INTO traductions_journal
                (table_cible, colonne, ligne_id, source_fr, resultat_en, modele, origine)
            VALUES (%s, %s, %s, %s, %s, %s, 'auto')
            ON CONFLICT (table_cible, colonne, ligne_id) DO UPDATE
                SET resultat_en = EXCLUDED.resultat_en,
                    modele = EXCLUDED.modele,
                    created_at = CURRENT_TIMESTAMP
                -- La clause protege une nouvelle fois les corrections humaines :
                -- meme un ON CONFLICT ne doit pas les remplacer.
                WHERE traductions_journal.origine <> 'manuelle'
        """, [
            (table, colonne, ligne_id, groupe["source"], traduction, modele)
            for ligne_id in groupe["ids"]
        ])
    return lignes_touchees


def main():
    arguments = sys.argv[1:]
    essai = "--essai" in arguments
    forcer = "--forcer" in arguments
    filtres = [a for a in arguments if not a.startswith("--")]

    cibles = [c for c in CIBLES if not filtres or c["libelle"] in filtres]
    if not cibles:
        sys.exit("Cible inconnue. Disponibles : %s"
                 % ", ".join(c["libelle"] for c in CIBLES))

    url = lire_env("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL absente de report-engine/.env")

    # La traduction est un travail de fond : elle passe par la cle du controle
    # qualite, pas par celle de redaction. Un import massif ne doit pas epuiser
    # le quota qui sert a produire les rapports vendus.
    cle_api = lire_env("GROQ_API_KEY_TEST_QUALITY") or lire_env("GROQ_API_KEY")
    if not cle_api:
        sys.exit("Aucune cle Groq dans report-engine/.env")
    modele = lire_env("GROQ_MODEL") or "openai/gpt-oss-120b"

    print("Modele    : %s" % modele)
    print("Mode      : %s%s" % ("ESSAI (aucune ecriture)" if essai else "ecriture",
                                " + forcage" if forcer else ""))
    print()

    connexion = psycopg2.connect(url, connect_timeout=20)
    connexion.autocommit = False
    total_valeurs = 0
    total_lignes = 0

    try:
        for cible in cibles:
            table = cible["table"]
            print("== %s ==" % table)

            for colonne in cible["colonnes"]:
                with connexion.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as curseur:
                    groupes = valeurs_a_traduire(curseur, table, colonne, forcer)

                if not groupes:
                    print("   %-14s a jour" % colonne)
                    continue

                lignes = sum(len(g["ids"]) for g in groupes)
                print("   %-14s %d valeur(s) distincte(s) sur %d ligne(s)"
                      % (colonne, len(groupes), lignes))
                total_valeurs += len(groupes)

                if essai:
                    for groupe in groupes[:3]:
                        apercu = groupe["source"][:70]
                        print("        « %s »%s" % (apercu, "…" if len(groupe["source"]) > 70 else ""))
                    if len(groupes) > 3:
                        print("        … et %d autre(s)" % (len(groupes) - 3))
                    continue

                traductions = {}
                for depart in range(0, len(groupes), TAILLE_LOT):
                    lot = groupes[depart:depart + TAILLE_LOT]
                    sources = [g["source"] for g in lot]
                    try:
                        traductions.update(traduire_lot(cle_api, modele, sources, cible["contexte"]))
                    except Exception as erreur:
                        # Un lot en echec ne doit pas perdre les precedents :
                        # on signale et on continue, le script est rejouable.
                        print("        lot %d en echec : %s" % (depart // TAILLE_LOT + 1, erreur))

                with connexion.cursor() as curseur:
                    touchees = ecrire_traductions(curseur, table, colonne, groupes, traductions, modele)
                connexion.commit()
                total_lignes += touchees
                print("        %d traduction(s) appliquee(s) sur %d ligne(s)"
                      % (len(traductions), touchees))
            print()

        if essai:
            print("Essai termine : %d valeur(s) distincte(s) seraient traduites." % total_valeurs)
            print("Relancez sans --essai pour ecrire en base.")
        else:
            print("Termine : %d ligne(s) mises a jour." % total_lignes)
            print("Les traductions corrigees a la main se marquent ainsi :")
            print("  UPDATE traductions_journal SET origine = 'manuelle' WHERE id = <id>;")

    except Exception:
        connexion.rollback()
        raise
    finally:
        connexion.close()


if __name__ == "__main__":
    main()
