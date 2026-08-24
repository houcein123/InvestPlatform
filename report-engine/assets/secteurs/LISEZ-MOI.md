# Photographies sectorielles

Trois photographies **réelles** par secteur, prises en Tunisie, nommées d'après
le `slug` du secteur :

```
<slug>.jpg     couverture du rapport (bandeau supérieur, sous voile sombre)
<slug>-2.jpg   section « Présentation générale du secteur »
<slug>-3.jpg   section « Zones géographiques et zones franches »
```

Secteurs : `tourisme`, `agriculture`, `technologies`, `energies`, `textile`,
`logistique`.

Le rapport ne dessine plus aucun motif de remplacement : si un fichier manque,
le bandeau se réduit à un aplat aux couleurs du secteur et la section concernée
n'est simplement pas illustrée. Un rapport reste donc livrable sans image.

## `credits.json` — obligatoire

Chaque image est décrite dans `credits.json`, et **c'est ce fichier qui fait
foi** : le moteur n'affiche que les images qui y figurent.

```json
"agriculture": [
  {
    "fichier": "agriculture.jpg",
    "titre":   "Cap Bon olive groves.JPG",
    "auteur":  "Nicholas.gosse",
    "licence": "CC BY-SA 4.0",
    "source":  "https://commons.wikimedia.org/wiki/File:Cap_Bon_olive_groves.JPG",
    "legende": "Oliveraies du Cap Bon, face au littoral méditerranéen."
  }
]
```

`auteur` et `licence` sont repris sous chaque image et dans la section
« Sources et méthodologie » du rapport ; `legende` est la phrase affichée sous
l'illustration.

## Droits

Le rapport est un document **vendu** : chaque photographie doit être libre pour
un usage commercial. Le fonds actuel provient de Wikimedia Commons, sous
licences CC BY, CC BY-SA, CC0 ou domaine public — toutes autorisent l'usage
commercial **à condition de citer l'auteur**, ce que fait le document.

Remplacer une image impose donc de mettre à jour son entrée dans
`credits.json`. Une photographie sans licence vérifiée n'a rien à faire ici.

Éviter par ailleurs les portraits où des personnes sont identifiables : le
droit à l'image ne se règle pas par la licence du fichier.

## Format conseillé

Cadrage paysage, 1600 px de large. L'image est recadrée en `cover` (le centre
est conservé, les bords sont rognés) : un sujet centré supporte mieux le
bandeau de couverture, très large et peu haut.
