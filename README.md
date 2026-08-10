# InvestPlatform — Rapport Sectoriel PDF

> **Projet de stage — 3LM Solutions**
> Stagiaires : Houcein, Zakariya · Encadrante : Lilia Aouani
> Cahier des charges : [`CDC_Rapport_Sectoriel.docx`](CDC_Rapport_Sectoriel.docx)

Service de génération de rapports sectoriels PDF pour les investisseurs
étrangers intéressés par la Tunisie. Chaque rapport combine des **données
chiffrées officielles** stockées en base et des **sections rédigées** produites
à partir de ces mêmes chiffres.

---

## 🚀 Démarrage

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Tests de la logique métier (projections, mise en page PDF, prompts) :

```bash
cd backend && npm test
```

Le frontend est servi sur http://localhost:5173, l'API sur http://localhost:3001.
En développement, le proxy Vite redirige `/api` et `/reports` vers le backend :
aucune URL de backend n'est écrite en dur dans le code React.

### Configuration

Copier `backend/.env.example` vers `backend/.env` et renseigner :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion Neon (obligatoire) |
| `JWT_SECRET` | Signature des jetons de session (obligatoire) |
| `GROQ_API_KEY` | Clé Groq — sans elle, les sections rédigées restent vides |
| `PAIEMENT_MODE` | `simulation` (défaut) ou `paypal` |
| `PORT`, `CORS_ORIGIN`, `DEVISE` | Réseau et affichage |

**Aucune configuration de paiement n'est nécessaire pour démarrer.** Le serveur
refuse de démarrer si une variable obligatoire manque ou si la base est
injoignable.

---

## 👤 Comptes et rôles

**Un seul écran de connexion pour tout le monde.** L'inscription publique crée
uniquement des comptes **client** ; le champ `role` est ignoré s'il est envoyé
dans la requête, ce qui rend l'élévation de privilèges impossible depuis le
site. Un administrateur existe déjà en base et se connecte par le même
formulaire — c'est son rôle enregistré qui décide de la suite :

| Rôle | Après connexion | Navigation |
|------|-----------------|------------|
| `client` | Catalogue | Catalogue · Mes rapports · Profil · Paramètres |
| `admin` | Tableau de bord | Pilotage (tableau de bord, secteurs, comptes) · Profil · Paramètres · Catalogue |

Le rôle est **relu en base à chaque requête**, jamais fait confiance au jeton :
un compte rétrogradé ou désactivé perd ses droits immédiatement.

La promotion d'un compte se fait depuis **Comptes** dans le panneau de contrôle.
Le dernier administrateur actif ne peut pas être rétrogradé, et personne ne peut
retirer son propre rôle : la plateforme ne peut pas se retrouver sans admin.

---

## 🗂️ Structure du projet

```
InvestPlatform/
├── backend/
│   └── src/
│       ├── server.js              ← point d'entrée
│       ├── config/                env.js (config centralisée), db.js (pool pg)
│       ├── middleware/            auth.js (requireAuth / requireAdmin), errorHandler.js
│       ├── routes/                index.js = table de routage complète
│       │   ├── auth.routes.js         /api/auth      inscription, connexion, profil
│       │   ├── catalogue.routes.js    /api/catalogue  public + aperçu gratuit
│       │   ├── payment.routes.js      /api/payment    PayPal Orders v2
│       │   ├── report.routes.js       /api/report     génération + progression
│       │   └── admin.routes.js        /api/admin      réservé au rôle admin
│       ├── services/
│       │   ├── accountRepository.js   comptes et rôles
│       │   ├── sectorRepository.js    seul accès SQL aux tables métier
│       │   ├── promptService.js       les 7 prompts + contexte chiffré
│       │   ├── groqService.js         client de rédaction
│       │   ├── projectionService.js   estimations 2024-2028
│       │   ├── paypalService.js       jeton OAuth, création et capture
│       │   ├── reportService.js       orchestration données → texte → PDF → base
│       │   ├── salesService.js        achats, paiements, statistiques
│       │   └── jobStore.js            suivi de progression des générations
│       └── pdf/
│           ├── sections.js            SOURCE UNIQUE des 12 sections
│           ├── theme.js               charte + primitives de mise en page
│           └── reportPdf.js           rapport complet et aperçu 2 pages
├── frontend/
│   └── src/
│       ├── api/client.js          seul point d'appel au backend
│       ├── auth/AuthContext.jsx
│       ├── preferences.js         réglages locaux à l'appareil
│       ├── components/
│       │   ├── layout/            AppShell, Sidebar
│       │   ├── SectorCard.jsx     carte catalogue + parcours d'achat
│       │   ├── PayPalButton.jsx   SDK PayPal
│       │   └── ProgressBar.jsx
│       ├── pages/
│       │   ├── Catalogue.jsx          page d'accueil publique
│       │   ├── LoginPage.jsx          connexion + inscription client
│       │   ├── Profil.jsx             informations et mot de passe
│       │   ├── Parametres.jsx         préférences + état des services
│       │   ├── MesRapports.jsx        espace client
│       │   └── admin/                 Dashboard, Secteurs, SecteurDonnees, Comptes
│       └── styles/global.css      charte unique (aucun style inline)
├── data/                          CSV de l'INS, un dossier par secteur
├── sql/
│   ├── schema.sql                 SOURCE UNIQUE du modèle de données
│   ├── migrations/                évolutions d'une base existante
│   └── setup_database.py          création du schéma + import des CSV
└── CDC_Rapport_Sectoriel.docx
```

**Deux principes structurants :**

1. **Une source de vérité par sujet.** Les sections du rapport sont décrites une
   seule fois (`pdf/sections.js`) et alimentent couverture, sommaire, aperçu et
   corps du document : le sommaire ne peut plus annoncer une section absente.
   Le schéma SQL n'existe qu'à un endroit (`sql/schema.sql`), lu par le script
   Python.
2. **Une porte d'entrée par couche.** Le SQL métier vit dans les *repositories*,
   les appels HTTP du frontend dans `api/client.js`.

---

## 🔄 Flow du service (CDC §6)

| Étape | Route | Détail |
|-------|-------|--------|
| 1. Catalogue | `GET /api/catalogue` | 6 secteurs, prix, pages, date de mise à jour |
| 1bis. Aperçu | `GET /api/catalogue/:id/preview` | 2 pages — couverture + sommaire, sans rédaction |
| 2. Commande | `POST /api/payment/create-order` | crée l'achat puis la commande PayPal |
| 2bis. Paiement | `POST /api/payment/capture` | encaisse, vérifie le montant, marque l'achat payé |
| 3. Génération | `POST /api/report/generate` | renvoie un `jobId` (202) |
| 3bis. Progression | `GET /api/report/status/:jobId` | alimente la barre de progression |
| 4. Téléchargement | `GET /reports/<fichier>.pdf` | PDF servi en statique, retrouvable dans **Mes rapports** |

Contrôles appliqués côté serveur, jamais délégués au navigateur :

- la génération exige un achat **payé** portant sur le **même secteur** (`402` sinon) ;
- le montant réellement encaissé est comparé au tarif du catalogue converti ;
- la commande PayPal doit correspondre à l'achat présenté (`custom_id`) ;
- une capture rejouée ne crée pas de second encaissement.

L'aperçu gratuit est produit par les mêmes fonctions que le rapport payant :
l'acheteur voit exactement les deux premières pages de ce qu'il achètera, et
l'aperçu reste instantané même si le quota de rédaction est épuisé.

---

## 💳 Paiement

La plateforme accepte deux modes de règlement, choisis par `PAIEMENT_MODE`.

### Mode `simulation` — par défaut

**Aucune configuration, aucun compte externe, aucun débit.** « Commander ce
rapport » ouvre la page dédiée `/paiement/:id`, qui déroule tout le parcours :
récapitulatif, saisie du compte PayPal, règlement, barre de progression et
téléchargement.

Le montant enregistré dans `paiements.montant` est le **tarif du rapport**, pas
zéro : une ligne de paiement doit refléter la valeur de ce qui a été commandé.
L'absence de débit réel est portée par `achats.mode_paiement` et
`paiements.methode`, et le tableau de bord sépare le chiffre d'affaires réel du
montant simulé.

L'adresse du compte est enregistrée dans `paiements.email_payeur` (avec le nom
du titulaire s'il est fourni) et affichée dans la colonne **Compte payeur** du
tableau de bord : c'est la trace comptable de la commande, la même information
qu'une transaction PayPal réelle renvoie via `payer.email_address`.

> **Aucun mot de passe n'est demandé ni stocké.** Il n'existe aucune API PayPal
> permettant de valider un couple email/mot de passe — la redirection vers leur
> domaine existe précisément pour qu'un marchand ne voie jamais les
> identifiants de ses clients. Un formulaire qui les collecterait serait
> techniquement une page de hameçonnage, quelle que soit l'intention.

C'est le mode de développement et de démonstration : il permet de dérouler
l'intégralité du parcours du CDC §6 — catalogue, commande, génération,
téléchargement, espace client — sans dépendre d'un prestataire de paiement.

Ces commandes sont enregistrées avec `achats.mode_paiement = 'simulation'` et
**exclues du chiffre d'affaires** du tableau de bord : elles y apparaissent
comptées à part. Sans cette séparation, le revenu affiché serait faux.

### Mode `paypal`

Transaction réelle via l'API **Orders v2**. À activer en renseignant dans
`backend/.env` :

```
PAIEMENT_MODE=paypal
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

Si `PAIEMENT_MODE=paypal` mais que les identifiants manquent, le serveur
repasse automatiquement en simulation avec un avertissement au démarrage,
plutôt que d'afficher un bouton qui échouerait au premier clic.

> **Le dinar tunisien n'est pas une devise acceptée par PayPal.** Les tarifs
> restent affichés et comptabilisés en TND ; la transaction est présentée à
> PayPal en `PAYPAL_CURRENCY` (EUR par défaut), convertie au taux
> `PAYPAL_TAUX_TND`. La carte du catalogue affiche les deux montants.
> Ce taux est une constante de configuration, à réviser périodiquement.

Réglages appliqués à la commande, dans
`payment_source.paypal.experience_context` (API actuelle ;
`application_context` est déprécié) :

| Réglage | Effet |
|---------|-------|
| `landing_page: "LOGIN"` | Ouvre la page **de connexion au compte PayPal**. Avec la valeur par défaut (`NO_PREFERENCE`), PayPal choisit lui-même et ouvre souvent le formulaire de carte bancaire. |
| `locale` | Fixe la langue. Sans lui, PayPal la déduit de l'adresse IP et sert la page en arabe ou en anglais. |

Le composant fixe aussi `fundingSource: FUNDING.PAYPAL` : **un seul bouton**.
Par défaut le SDK ajoute un bouton « Carte bancaire » qui ouvre le paiement
invité — un parcours distinct, sur lequel `landing_page` n'a aucun effet.

#### Tester en sandbox

**Votre compte PayPal réel ne fonctionne pas en mode sandbox.** Le bac à sable
est un univers séparé qui ne contient que des comptes fictifs.

1. https://developer.paypal.com → **Testing Tools → Sandbox accounts**
2. Prendre le compte de type **Personal** (`sb-xxxxx@personal.example.com`)
3. **⋮ → View/Edit account** pour lire ou définir son mot de passe
4. Utiliser ces identifiants dans la fenêtre PayPal

> **Symptôme d'un email non reconnu :** vous saisissez votre adresse, cliquez
> sur « Suivant », et au lieu de l'écran mot de passe PayPal affiche « Payer
> par carte bancaire » avec adresse de facturation et date de naissance. Le
> sandbox ne dit jamais « compte inconnu » — il bascule silencieusement sur
> l'inscription invité. Aucun réglage serveur ne change cela, seul l'email
> compte.

Testez en **navigation privée** : PayPal mémorise les tentatives précédentes en
cookie et peut vous renvoyer au parcours invité même avec le bon compte.

#### Passer en production

Créer des identifiants **Live** sur developer.paypal.com, les placer dans
`backend/.env` et basculer `PAYPAL_ENV=live`. Le serveur affiche alors un
avertissement au démarrage.

### Piège de mise en page à connaître

Les cellules de tableau sont tronquées **en amont**, par mesure du texte
(`theme.tronquer`). L'option `lineBreak: false` de PDFKit ne fait pas ce que sa
documentation laisse entendre : mesuré, un libellé de 172 pt placé dans une
colonne de 76 pt occupe 28,8 pt de hauteur — trois lignes — avec ou sans
l'option. Des lignes de tableau à hauteur fixe se chevauchaient donc, et un
libellé long poussait le reste de sa ligne sur la page suivante, produisant des
pages presque vides.

Toute nouvelle cellule de tableau doit passer par `tronquer()`.
---

## 📄 Structure du rapport (CDC §5)

Couverture + sommaire, puis 12 sections — 14 pages minimum (15 à 18 en pratique) :

| # | Section | Nature |
|---|---------|--------|
| 1 | Présentation générale du secteur | Analyse |
| 2 | Chiffres clés et graphiques | Données |
| 3 | Analyse des tendances | Analyse |
| 4 | Acteurs principaux | Données |
| 5 | Cadre réglementaire et fiscal | Données |
| 6 | Zones géographiques et zones franches | Données |
| 7 | Opportunités identifiées | Analyse |
| 8 | Analyse des risques | Analyse |
| 9 | Benchmarking régional (Maroc, Égypte) | Analyse |
| 10 | Recommandations investisseur | Analyse |
| 11 | Perspectives 2025-2028 | Analyse |
| 12 | Sources et méthodologie | Données |

Les graphiques sont dessinés avec les primitives vectorielles de PDFKit :
aucune librairie de charts n'est nécessaire.

Le document ne signale nulle part que les sections rédigées sont produites par
un modèle de langage, **sauf dans « Sources et méthodologie »**, où le procédé
et le modèle employé sont décrits explicitement. C'est le seul endroit prévu
pour cette mention.

### Comparatif régional : aucune valeur inventée

Le CDC §4 exige une comparaison avec le Maroc et l'Égypte. Or le contexte
transmis au modèle ne contenait **que des chiffres tunisiens** : il devait donc
produire lui-même toutes les valeurs marocaines et égyptiennes, dans un rapport
vendu.

La table `benchmarks_regionaux` fournit l'emplacement de ces données, une
grille de trois indicateurs par secteur, **livrée vide**. Deux garanties :

- seules les lignes réellement renseignées sont transmises au modèle, avec leur
  source ;
- quand aucune ne l'est, le prompt le dit explicitement et impose de traiter la
  comparaison en termes qualitatifs — « n'avance AUCUNE valeur chiffrée
  concernant le Maroc ou l'Égypte qui ne figure pas dans le comparatif ».

Le PDF affiche le tableau comparatif au-dessus de l'analyse, avec ses sources.
Saisie dans **Secteurs → Données → Comparatif régional**.

Les valeurs ne sont volontairement pas pré-remplies : les inventer reviendrait
à commettre l'erreur que ce dispositif corrige.

### Approche hybride

`promptService.buildDataContext()` sérialise les données chiffrées du secteur
et **injecte ce bloc dans chacun des 7 prompts**, avec la consigne de ne pas
inventer de chiffre absent. Les estimations y sont transmises étiquetées
`ESTIMÉ`, pour que la section « Perspectives » s'appuie dessus sans les
présenter comme des données publiées.

Chaque appel est tracé dans `logs_generation` (prompt, réponse, durée, statut).
Une section en échec n'interrompt pas la génération : le PDF affiche un encart
explicite et le rapport reste livrable.

### Résistance aux quotas

Sept appels s'enchaînent en moins d'une minute et Groq répond `429` dès que sa
limite par minute est atteinte — cas rencontré en conditions réelles, où les
sept sections ont échoué d'un coup et le rapport **payé** est sorti sans aucune
partie rédigée.

Trois protections désormais :

1. **Reprise automatique** — jusqu'à 4 tentatives par section, attente
   croissante (2 s, 4 s, 8 s), en respectant l'en-tête `retry-after` de Groq.
2. **Message visible** — pendant l'attente, la barre de progression affiche
   « service de rédaction saturé, nouvelle tentative dans N s » au lieu de
   sembler figée.
3. **Relance sans repaiement** — un achat payé dont le rapport manque reste
   listé dans **Mes rapports** avec un bouton *Relancer la génération*. Le
   droit vient de l'achat vérifié en base, pas d'une affirmation du navigateur.

En dernier recours, l'écran **Rapports** du panneau admin permet de saisir le
texte à la main et de reconstruire le PDF.

---

## 📈 Données observées et estimations

Distinction respectée de la base jusqu'au PDF :

| | Signification | Rendu |
|---|---|---|
| `valeur_YYYY` | Donnée **observée**, publiée par la source officielle | Barre pleine, couleur primaire |
| `projection_YYYY` | **Estimation** calculée | Barre claire, mention « estimation », légende dédiée |

`projectionService` met deux modèles en concurrence pour chaque série et retient
celui qui s'ajuste le mieux à l'historique :

- **régression linéaire** par moindres carrés (≥ 4 points), avec R² ;
- **taux de croissance annuel moyen** (≥ 3 points), pour les séries à profil
  exponentiel ;
- **prolongement de tendance** quand seuls 2 points existent.

Une série dont aucun modèle n'atteint un R² de 0,30 ne reçoit **aucune
estimation** — une case vide vaut mieux qu'un chiffre inventé. Les extrapolations
sont bornées (pas de valeur négative sur une série positive, pas de dérive
au-delà du triple du maximum observé).

État actuel : **251 séries projetées sur 345**, R² moyen 0,80 pour la régression
et 0,94 pour le TCAM. Les 94 séries restantes n'ont pas assez d'historique.

Recalcul depuis le panneau de contrôle (**Secteurs → Données → Recalculer les
projections**) ou par l'API `POST /api/admin/projections`. À relancer après
chaque mise à jour des séries.

---

## 🛠️ Base de données

13 tables sur PostgreSQL (Neon). Le script de setup couvre quatre opérations
indépendantes :

```bash
pip install -r requirements.txt
python sql/setup_database.py --import-csv   # importe data/*.csv
python sql/setup_database.py --reimport     # vide puis réimporte (après changement de nommage)
python sql/setup_database.py --seed         # zones, acteurs, cadre, chiffres clés
python sql/setup_database.py --all          # --reset + --import-csv + --seed
```

`--reset` exécute `sql/schema.sql`, qui **supprime toutes les tables** ; le
script demande confirmation. Les CSV sont lus dans le dossier local `data/`.

Pour faire évoluer une base existante sans la vider, utiliser `sql/migrations/`
dans l'ordre numérique.

### Limites connues des données

- Les CSV de l'INS couvrent **2015-2023**, parfois 2024 : les années
  antérieures à 2020 ne sont pas importées (le schéma commence en 2020) et
  35 séries seulement disposent d'une valeur 2024 publiée.
- Certains tableaux de l'INS sont **trimestriels** ; l'import retient la
  dernière valeur connue de chaque année.
- Les libellés de ligne ambigus (« Algérie », « Masculin ») sont préfixés par
  le titre du tableau source pour rester lisibles hors contexte.

---

## 🔐 Panneau de contrôle (CDC §7)

- **Tableau de bord** — rapports vendus, revenu total, répartition par secteur,
  derniers rapports générés.
- **Secteurs** — tarif, description, mise en ligne.
- **Données d'un secteur** — formulaire des chiffres clés, ajout/suppression des
  zones, acteurs et textes réglementaires, séries statistiques avec leurs
  estimations, **Recalculer les projections** et **Régénérer le rapport** (avec
  suivi de progression).
- **Rapports** — relecture et correction du texte d'un rapport déjà produit
  (`/admin/rapports/:id`), puis reconstruction du PDF. **Aucun appel au modèle
  n'est refait** : une régénération complète écraserait les corrections. Les
  sections chiffrées, elles, sont relues en base, donc le document repart des
  valeurs à jour. Utile notamment quand le quota de rédaction est épuisé : le
  rapport sort avec ses sections chiffrées, et le texte se saisit à la main.
- **Comptes** — liste des comptes et gestion des rôles.

Sécurité : `/api/auth/login` est plafonné à 10 tentatives par quart d'heure et
par adresse IP, l'inscription à 5 par heure. bcrypt ralentit chaque
vérification mais n'empêche pas d'en enchaîner des milliers — le plafond, si.

Enregistrer des chiffres clés rafraîchit automatiquement la date de mise à jour
affichée au catalogue.

---

## ⚠️ Points ouverts

| Sujet | État |
|-------|------|
| **Paiement réel** | La plateforme tourne en mode `simulation` par défaut : aucun encaissement. L'intégration PayPal est complète et testée, il reste à fournir des identifiants et basculer `PAIEMENT_MODE=paypal`. Le taux TND → EUR est figé en configuration. |
| **Vérification d'email** | La colonne `est_verifie` existe mais aucun email de confirmation n'est envoyé à l'inscription. |
| **Suivi des générations** | En mémoire (`jobStore`) : un job ne survit pas à un redémarrage du serveur. Le PDF produit, lui, est bien persisté. |
| **Achat sans compte** | Techniquement possible (`id_utilisateur` NULL) mais l'interface impose la connexion, afin que le rapport soit retrouvable dans « Mes rapports ». |

---

## 📁 Sources de données

| Source | URL | Données |
|--------|-----|---------|
| **INS** | https://www.ins.tn | PIB, comptes nationaux, emploi, secteurs |
| **BCT** | https://www.bct.gov.tn | Recettes touristiques, balance des paiements |
| **FIPA** | https://www.fipa.tn | IDE par secteur, réglementation |
| **ONAGRI** | https://www.onagri.nat.tn | Agriculture |
| **ANME** | https://www.anme.nat.tn | Énergies renouvelables |
| **Banque Mondiale** | api.worldbank.org | Macro-économie |

---

## 🐛 Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Variables d'environnement manquantes` | `.env` absent ou incomplet | Copier `backend/.env.example` |
| `Connexion PostgreSQL impossible` | URL Neon invalide | Vérifier `DATABASE_URL` |
| `GROQ_API_KEY absente` (avertissement) | Clé non configurée | Les sections rédigées restent vides ; le reste fonctionne |
| `Paiement indisponible` | `PAIEMENT_MODE=paypal` sans identifiants | Renseigner les identifiants, ou revenir à `PAIEMENT_MODE=simulation` |
| `Payer has not yet approved the Order` | Capture appelée avant approbation | Passer par le bouton PayPal, qui enchaîne les deux étapes |
| `Accès réservé aux administrateurs` | Compte client sur une route admin | Faire promouvoir le compte depuis **Comptes** |
| `Serveur injoignable` côté React | Backend arrêté | `cd backend && npm run dev` |
| `Port 3001 already in use` | Instance déjà lancée | Fermer l'autre processus ou changer `PORT` |
