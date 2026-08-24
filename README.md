# Tunisia Invest (ex-InvestPlatform)

> Portail de rapports sectoriels PDF pour investisseurs étrangers intéressés par la Tunisie.
> Catalogue de 6 secteurs · paiement PayPal · rapport enrichi par IA · espace client et panneau de contrôle.
>
> **Projet de stage — 3LM Solutions**
> Stagiaires : Houcein, Zakariya ·
> Cahier des charges : [`CDC_Rapport_Sectoriel.docx`](CDC_Rapport_Sectoriel.docx)

Chaque rapport combine des **données chiffrées officielles** stockées en base et des **sections rédigées** produites à partir de ces mêmes chiffres — jamais l'inverse : un chiffre absent de la base n'est jamais inventé par le modèle.

---

## Architecture

Trois services, une seule base PostgreSQL.

```
tunisia-invest/
├── frontend/        React 18 + Vite + TypeScript — l'unique interface
├── backend/         Spring Boot 4 / Java 25 — l'API principale
├── report-engine/   Node 24 / Express — moteur de fabrication des PDF
├── sql/             schema.sql + migrations versionnées
└── data/            CSV de l'INS, un dossier par secteur
```

**Qui fait quoi, et pourquoi :**

| Service | Responsabilité | Port |
|---------|----------------|------|
| `backend` | Comptes et rôles, catalogue, analyse comparative, achats, paiement PayPal, orchestration des rapports. Détient toutes les décisions d'autorisation. | 8080 |
| `report-engine` | Mise en page PDFKit, rédaction Groq, projections statistiques. **Ne vérifie aucun droit** : il fabrique sur ordre du backend. | 3001 |
| `frontend` | Interface unique — catalogue public, analyse comparative, espace client, panneau de contrôle. | 5173 |

Le moteur reste en Node parce qu'il concentre la logique la plus coûteuse à réécrire et la plus risquée à régresser : mise en page mesurée au point près, sept prompts, deux modèles de projection concurrents, reprise sur quota. Le porter en Java aurait pris des semaines sans rien apporter à l'utilisateur. Le backend Spring Boot détient en revanche tout ce qui touche à l'argent et aux droits d'accès — c'est la partie qui gagnait le plus à un typage strict et à un cadre de sécurité éprouvé.

**Règle non négociable :** `report-engine` n'est jamais exposé publiquement. Il n'accepte que les appels portant le jeton partagé `REPORT_ENGINE_TOKEN`, transmis par le backend.

**Deux principes structurants hérités de la version d'origine, toujours en vigueur :**

1. **Une source de vérité par sujet.** Les 12 sections du rapport sont décrites une seule fois (`report-engine/src/pdf/sections.js`) et alimentent couverture, sommaire, aperçu et corps du document : le sommaire ne peut plus annoncer une section absente. Le schéma SQL n'existe qu'à un endroit (`sql/schema.sql`).
2. **Une porte d'entrée par couche.** Côté `report-engine`, le SQL métier vit dans des *repositories* dédiés ; côté `frontend`, tous les appels HTTP passent par `api/client.js`. Le backend Spring Boot applique l'équivalent Java de ce principe (couches contrôleur / service / repository).

---

## Démarrage

Prérequis : Java 25+, Node 20+, PostgreSQL (Neon ou local).

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

Puis, dans l'ordre numérique, les migrations non encore appliquées (`sql/migrations/001` à `008`). Les données sectorielles s'importent avec :

```bash
pip install -r requirements.txt
python sql/setup_database.py --import-csv --seed
```

### Configuration

Chaque service lit sa configuration depuis son propre `.env` — copier le `.env.example` correspondant. **Aucun identifiant n'est jamais écrit en dur** (ni dans `application.properties`, ni dans le code React).

**`backend/.env`** (Spring Boot)

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion Neon (obligatoire) |
| `JWT_SECRET` | Signature des jetons de session (obligatoire) |
| `REPORT_ENGINE_URL`, `REPORT_ENGINE_TOKEN` | Adresse et jeton partagé pour appeler le moteur de rapports |
| `PAIEMENT_MODE` | `simulation` (défaut) ou `paypal` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `PAYPAL_WEBHOOK_ID` | Requis uniquement en mode `paypal` |
| `PORT`, `CORS_ORIGIN`, `DEVISE` | Réseau et affichage |

**`report-engine/.env`**

| Variable | Rôle |
|----------|------|
| `GROQ_API_KEY` | Clé Groq (**une seule par ligne**) — sans elle, les sections rédigées restent vides |
| `GROQ_MODEL` | Modèle de rédaction. Vérifier sa disponibilité avec `npm run modeles` |
| `REPORT_ENGINE_TOKEN` | Doit être identique à celui du backend |
| `PORT` | 3001 par défaut |

Le serveur backend refuse de démarrer si une variable obligatoire manque ou si la base est injoignable. **Aucune configuration de paiement n'est nécessaire pour démarrer** : le mode `simulation` fonctionne sans aucun identifiant externe.

### Les trois services

```bash
cd report-engine && cp .env.example .env && npm install && npm run dev
```

```bash
cd backend && ./mvnw spring-boot:run
```

```bash
cd frontend && npm install && npm run dev
```

L'interface est servie sur http://localhost:5173, la documentation interactive de l'API sur http://localhost:8080/swagger-ui.html.

En développement, le proxy Vite dirige `/api` vers le backend et `/reports` vers le moteur : aucune URL de service n'est écrite en dur dans le code React.

---

## Comptes et rôles

**Un seul écran de connexion pour tout le monde.** L'inscription publique crée uniquement des comptes **client** ; le champ `role` est ignoré s'il est envoyé dans la requête, ce qui rend l'élévation de privilèges impossible depuis le site. Un administrateur existe déjà en base et se connecte par le même formulaire — c'est son rôle enregistré qui décide de la suite :

| Rôle | Après connexion | Navigation |
|------|-----------------|------------|
| `client` | Catalogue | Catalogue · Analyse comparative · Mes rapports · Profil · Paramètres |
| `admin` | Tableau de bord | Pilotage (tableau de bord, secteurs, comptes) · Profil · Paramètres · Catalogue |

Le rôle est **relu en base à chaque requête**, jamais fait confiance au jeton : un compte rétrogradé ou désactivé perd ses droits immédiatement.

La promotion d'un compte se fait depuis **Comptes** dans le panneau de contrôle. Le dernier administrateur actif ne peut pas être rétrogradé, et personne ne peut retirer son propre rôle : la plateforme ne peut pas se retrouver sans admin.

---

## Parcours du service (CDC §6)

| Étape | Route | Détail |
|-------|-------|--------|
| 1. Catalogue | `GET /api/catalogue` | 6 secteurs, prix, pages, date de mise à jour |
| 1bis. Aperçu | `GET /api/catalogue/:id/preview` | 2 pages — couverture et sommaire, sans rédaction, produites par les mêmes fonctions que le rapport payant |
| 2. Commande | `POST /api/payment/create-order` | crée l'achat puis la commande PayPal |
| 2bis. Paiement | `POST /api/payment/capture` | encaisse, vérifie le montant, marque l'achat payé |
| 2ter. Filet | `POST /api/payment/webhook` | rattrape un encaissement si le navigateur s'est fermé |
| 3. Génération | `POST /api/report/generate` | renvoie un `jobId` (202) |
| 3bis. Progression | `GET /api/report/status/:jobId` | alimente la barre de progression |
| 4. Téléchargement | `GET /reports/<fichier>.pdf` | retrouvable dans **Mes rapports** |

Le **nombre de pages** affiché partout (couverture du PDF, espace client, panneau de contrôle) est celui du document réellement produit : compté à la fin du rendu, il recale le volume annoncé au catalogue. Deux rapports d'un même secteur n'ont pas forcément la même longueur, la rédaction variant d'une génération à l'autre.

Contrôles appliqués **côté serveur**, jamais délégués au navigateur :

- la génération exige un achat **payé** portant sur le **même secteur** (`402` sinon) ;
- le montant réellement encaissé est comparé au tarif du catalogue converti ;
- la commande PayPal doit correspondre à l'achat présenté (`custom_id`, `409` sinon) ;
- une capture rejouée ne crée pas de second encaissement (`UPDATE` conditionnel en SQL) ;
- le rôle est **relu en base à chaque requête**, jamais lu depuis le jeton.

---

## Paiement

Deux modes, choisis par `PAIEMENT_MODE`.

### Mode `simulation` — par défaut

**Aucune configuration, aucun compte externe, aucun débit.** La commande est validée directement dans la plateforme. Le montant enregistré reste le **tarif du rapport** et non zéro : une ligne de paiement doit refléter la valeur de ce qui a été commandé. L'absence de débit réel est portée par `achats.mode_paiement`, et le tableau de bord sépare le chiffre d'affaires réel du montant simulé — sans cette séparation, le revenu affiché serait faux.

C'est le mode de développement et de démonstration : il permet de dérouler l'intégralité du parcours du CDC §6 — catalogue, commande, génération, téléchargement, espace client — sans dépendre d'un prestataire de paiement.

### Mode `paypal`

Transaction réelle via l'API **Orders v2**. Renseigner `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET` ; si les identifiants manquent, le backend repasse automatiquement en simulation plutôt que d'afficher un bouton qui échouerait au premier clic.

Réglages appliqués à la commande, côté frontend, dans `payment_source.paypal.experience_context` (API actuelle ; `application_context` est déprécié) :

| Réglage | Effet |
|---------|-------|
| `landing_page: "LOGIN"` | Ouvre la page **de connexion au compte PayPal**. Avec la valeur par défaut (`NO_PREFERENCE`), PayPal choisit lui-même et ouvre souvent le formulaire de carte bancaire. |
| `locale` | Fixe la langue. Sans lui, PayPal la déduit de l'adresse IP et sert la page en arabe ou en anglais. |

Le composant fixe aussi `fundingSource: FUNDING.PAYPAL` : **un seul bouton**. Par défaut le SDK ajoute un bouton « Carte bancaire » qui ouvre le paiement invité — un parcours distinct, sur lequel `landing_page` n'a aucun effet.

> **Aucun mot de passe n'est demandé ni stocké.** Il n'existe aucune API PayPal permettant de valider un couple email / mot de passe — la redirection vers leur domaine existe précisément pour qu'un marchand ne voie jamais les identifiants de ses clients. Un formulaire qui les collecterait serait techniquement une page de hameçonnage, quelle que soit l'intention.

> **Le dinar tunisien n'est pas une devise acceptée par PayPal.** Les tarifs restent affichés et comptabilisés en TND ; la transaction est présentée en `PAYPAL_CURRENCY` (EUR par défaut), convertie au taux `PAYPAL_TAUX_TND` — une constante de configuration, à réviser périodiquement. Les deux montants sont affichés à l'acheteur avant qu'il ne règle.

### Le webhook, et pourquoi il existe

Le parcours nominal encaisse dans `POST /api/payment/capture`, pendant que l'acheteur est devant son écran. Mais si le navigateur se ferme entre l'approbation et la capture, **l'argent peut être débité sans que la plateforme l'ait enregistré**. Le webhook rattrape ce cas.

Trois garanties : la signature est vérifiée auprès de PayPal (`PAYPAL_WEBHOOK_ID` requis, sinon la notification est rejetée) ; `paypal_webhooks.event_id` est unique, donc un rejeu ne réencaisse rien ; le passage à « payé » reste conditionnel en SQL.

### Tester en sandbox

**Votre compte PayPal réel ne fonctionne pas en mode sandbox** : le bac à sable est un univers séparé qui ne contient que des comptes fictifs.

1. developer.paypal.com → **Testing Tools → Sandbox accounts**
2. Prendre le compte de type **Personal** (`sb-xxxxx@personal.example.com`)
3. **⋮ → View/Edit account** pour lire ou définir son mot de passe

> **Symptôme d'un email non reconnu :** vous saisissez votre adresse, cliquez sur « Suivant », et au lieu de l'écran mot de passe PayPal affiche « Payer par carte bancaire » avec adresse de facturation et date de naissance. Le sandbox ne dit jamais « compte inconnu » — il bascule silencieusement sur l'inscription invité. Aucun réglage serveur ne change cela, seul l'email compte.

Testez en **navigation privée** : PayPal mémorise les tentatives précédentes en cookie et peut vous renvoyer au parcours invité même avec le bon compte.

### Passer en production

Créer des identifiants **Live** sur developer.paypal.com, les placer dans `backend/.env` et basculer `PAYPAL_ENV=live`. Le serveur affiche alors un avertissement au démarrage.

---

## Structure du rapport (CDC §5)

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

Le document ne signale nulle part que les sections rédigées sont produites par un modèle de langage, **sauf dans « Sources et méthodologie »**, où le procédé et le modèle employé sont décrits explicitement. C'est le seul endroit prévu pour cette mention.

### Comparatif régional : aucune valeur inventée

Le CDC §4 exige une comparaison avec le Maroc et l'Égypte. Or le contexte transmis au modèle ne contient **que des chiffres tunisiens** : il doit donc produire lui-même toutes les valeurs marocaines et égyptiennes, dans un rapport vendu — un risque direct de désinformation si rien n'est fait.

La table `benchmarks_regionaux` fournit l'emplacement de ces données, une grille de trois indicateurs par secteur, **livrée vide**. Deux garanties :

- seules les lignes réellement renseignées sont transmises au modèle, avec leur source ;
- quand aucune ne l'est, le prompt le dit explicitement et impose de traiter la comparaison en termes qualitatifs — « n'avance AUCUNE valeur chiffrée concernant le Maroc ou l'Égypte qui ne figure pas dans le comparatif ».

Le PDF affiche le tableau comparatif au-dessus de l'analyse, avec ses sources. Saisie dans **Secteurs → Données → Comparatif régional** ; les valeurs ne sont volontairement pas pré-remplies, les inventer reviendrait à commettre l'erreur que ce dispositif corrige.

### Approche hybride

`promptService.buildDataContext()` (report-engine) sérialise les données chiffrées du secteur et **injecte ce bloc dans chacun des 7 prompts**, avec la consigne de ne pas inventer de chiffre absent. Les estimations y sont transmises étiquetées `ESTIMÉ`, pour que la section « Perspectives » s'appuie dessus sans les présenter comme des données publiées.

Chaque appel est tracé dans `logs_generation` (prompt, réponse, durée, statut). Une section en échec n'interrompt pas la génération : le PDF affiche un encart explicite et le rapport reste livrable.

### Choix du modèle

**Groq retire régulièrement des modèles de son catalogue.** `llama-3.3-70b-versatile`, utilisé au départ, a disparu et provoquait en pleine génération :

```
404 The model `llama-3.3-70b-versatile` does not exist or you do not have access to it
```

Ce message est trompeur : il désigne le modèle, alors que la cause peut aussi être une clé refusée. Deux garde-fous :

```bash
npm run modeles   # modèles réellement accessibles à la clé configurée
```

et une vérification **au démarrage du report-engine**, qui distingue explicitement les deux causes et liste les remplaçants possibles. Elle ne bloque jamais le lancement : catalogue, aperçu et espace client fonctionnent sans rédaction.

> **Une seule clé par ligne dans `.env`.** dotenv coupe la valeur au premier « # » : deux clés sur la même ligne aboutissent à utiliser silencieusement la première, la seconde étant traitée comme un commentaire.

### Résistance aux quotas

Sept appels s'enchaînent en moins d'une minute et Groq répond `429` dès que sa limite par minute est atteinte — cas rencontré en conditions réelles, où les sept sections ont échoué d'un coup et le rapport **payé** est sorti sans aucune partie rédigée.

Trois protections :

1. **Reprise automatique** — jusqu'à 4 tentatives par section, attente croissante (2 s, 4 s, 8 s), en respectant l'en-tête `retry-after` de Groq.
2. **Message visible** — pendant l'attente, la barre de progression affiche « service de rédaction saturé, nouvelle tentative dans N s » au lieu de sembler figée.
3. **Relance sans repaiement** — un achat payé dont le rapport manque reste listé dans **Mes rapports** avec un bouton *Relancer la génération*. Le droit vient de l'achat vérifié en base, pas d'une affirmation du navigateur.

En dernier recours, l'écran **Rapports** du panneau admin permet de saisir le texte à la main et de reconstruire le PDF.

### Données observées et estimations

Distinction respectée de la base jusqu'au PDF :

| | Signification | Rendu |
|---|---|---|
| `valeur_YYYY` | Donnée **observée**, publiée par la source officielle | Barre pleine, couleur primaire |
| `projection_YYYY` | **Estimation** calculée | Barre claire, mention « estimation », légende dédiée |

Deux modèles de projection sont mis en concurrence pour chaque série ; celui qui s'ajuste le mieux à l'historique est retenu :

- **régression linéaire** par moindres carrés (≥ 4 points), avec R² ;
- **taux de croissance annuel moyen** (≥ 3 points), pour les séries à profil exponentiel ;
- **prolongement de tendance** quand seuls 2 points existent.

Une série dont aucun modèle n'atteint un R² de 0,30 ne reçoit **aucune estimation** — une case vide vaut mieux qu'un chiffre inventé. Les extrapolations sont bornées (pas de valeur négative sur une série positive, pas de dérive au-delà du triple du maximum observé).

État observé lors de la dernière consolidation : **251 séries projetées sur 345**, R² moyen 0,80 pour la régression et 0,94 pour le TCAM. Les 94 séries restantes n'ont pas assez d'historique.

Recalcul depuis le panneau de contrôle (**Secteurs → Données → Recalculer les projections**) ou par l'API `POST /api/admin/projections`. À relancer après chaque mise à jour des séries et après tout import depuis la Banque mondiale (voir ci-dessous).

---

## Visuels sectoriels du PDF

Le rapport est illustré de **photographies réelles du secteur en Tunisie** : trois par secteur, livrées dans `report-engine/assets/secteurs/` — la couverture, la présentation générale et les zones géographiques. Chaque fichier est décrit dans `credits.json` (légende, auteur, licence, page d'origine) et son crédit est imprimé sous l'image ainsi que dans « Sources et méthodologie ».

Aucun motif n'est plus dessiné à la place d'une photo : si un fichier manque, le bandeau se réduit à un aplat aux couleurs du secteur et la section n'est pas illustrée — le rapport reste livrable sans image.

Le fonds actuel provient de Wikimedia Commons sous licences CC BY, CC BY-SA, CC0 ou domaine public, qui autorisent l'usage commercial à condition de citer l'auteur. Toute image ajoutée doit respecter les mêmes conditions — voir `report-engine/assets/secteurs/LISEZ-MOI.md`.

Les graphiques (barres, courbes, anneaux, classements, comparatifs) restent tracés avec les primitives vectorielles de PDFKit : aucune librairie de charts n'est nécessaire, le PDF s'imprime net à toute échelle et son poids ne dépend pas du nombre de graphiques.

---

## Enrichir les données depuis la Banque mondiale

```bash
python scripts/importer_banque_mondiale.py --simuler
python scripts/importer_banque_mondiale.py
```

Importe des indicateurs officiels via l'**API ouverte de la Banque mondiale** (World Development Indicators, CC BY 4.0) : séries tunisiennes 2020-2024 et comparatif Tunisie / Maroc / Égypte.

> **Pourquoi pas du scraping ?** La Banque mondiale publie une API REST documentée et stable. Extraire les mêmes chiffres depuis des pages HTML serait plus fragile — toute refonte du site casse l'extraction — plus lent, et juridiquement moins net.

Le script est idempotent (relance = mise à jour, jamais de doublon) et **n'interpole rien** : une année sans donnée publiée reste vide, chaque ligne porte sa source et son année de référence.

Certaines lignes comparatives restent volontairement vides — capacité hôtelière, nombre de startups, objectif renouvelable 2030 : aucune source officielle ne les couvre à l'échelle des trois pays. Renseignez-les à la main, avec leur source, depuis **Secteurs → Données → Comparatif régional**. Après l'import, recalculez les projections depuis le même écran.

---

## Analyse comparative (publique)

Trois écrans accessibles sans compte, adossés aux données déjà en base :

| Écran | Contenu |
|-------|---------|
| `/analyse/secteurs` | Les 6 secteurs face à face sur 7 indicateurs — classement filtrable et radar de profil |
| `/analyse/regional` | Tunisie / Maroc / Égypte, 18 indicateurs de la Banque mondiale avec leurs sources |
| `/ressources/glossaire` | Termes de l'investissement en Tunisie, sans taux ni seuils périssables |

Ces écrans sont **volontairement publics** : un investisseur doit pouvoir juger la valeur du service avant de créer un compte. Ils ne contiennent aucune section rédigée — ce sont des données brutes et leurs sources, pas l'analyse vendue dans le rapport.

Le radar normalise chaque axe à 100 pour le secteur le mieux placé : sans cela, les emplois (centaines de milliers) écraseraient les pourcentages. Il compare donc des **positions relatives**, et les valeurs absolues restent dans le tableau.

---

## Pages institutionnelles

`/a-propos`, `/contact`, `/mentions-legales` et `/avertissement-risques` sont publiques. Leurs coordonnées viennent toutes de `frontend/src/lib/entreprise.ts`.

> **Les champs légaux y sont volontairement vides.** Raison sociale, numéro d'immatriculation, adresse et hébergeur ne sont pas pré-remplis : des valeurs inventées seraient indiscernables de vrais renseignements aux yeux d'un investisseur et engageraient la responsabilité de l'éditeur. Les pages concernées affichent un avertissement visible tant qu'ils manquent.

---

## Interface

| Besoin | Choix | Motif |
|--------|-------|-------|
| Composants | **Radix UI** + jetons Tailwind 4 | primitives accessibles au clavier et aux lecteurs d'écran, sans style imposé |
| Graphiques | **Recharts 3** | API composable en React, pas de manipulation de canvas par référence |
| Animations | **Framer Motion** | transitions de pages, modales, barre de progression |
| Données | **TanStack Query 5** | cache, états de chargement, sondage natif de la génération |
| Paiement | **@paypal/react-paypal-js** | cycle de vie du SDK et démontage des iframes gérés par la librairie |

La charte vit dans `src/styles/theme.css` : **une seule définition de couleur par rôle**, déclinée clair / sombre. Les composants ne référencent jamais une couleur brute.

Deux détails qui distinguent un portail financier d'une maquette :

- **Chiffres en chasse fixe** (`font-variant-numeric: tabular-nums`). Sans cela, une variation de montant fait danser toute la colonne.
- **Distinction observé / estimé portée par le graphique lui-même** : courbe pleine contre pointillé, deux teintes, et une ligne verticale marquant la dernière donnée publiée. Présenter une extrapolation comme un fait serait la faute la plus grave que puisse commettre ce produit.

`prefers-reduced-motion` est respecté : une animation d'attente de 40 secondes est précisément le genre d'élément qui déclenche un malaise vestibulaire.

**Écrans en migration :** les pages du panneau de contrôle (`frontend/src/pages/admin/`) sont encore en `.jsx` et s'appuient sur `styles/legacy.css`. Elles fonctionnent — `allowJs` est actif et `api/client.js` réexporte le client TypeScript, il n'existe donc qu'une seule session et qu'un seul client HTTP. Elles restent à porter en `.tsx` avec la charte vivante ; `styles/legacy.css` et l'ancien `api/client.js` disparaîtront à ce moment-là.

---

## Base de données

13 tables sur PostgreSQL (Neon). Le script de setup couvre quatre opérations indépendantes :

```bash
pip install -r requirements.txt
python sql/setup_database.py --import-csv   # importe data/*.csv
python sql/setup_database.py --reimport     # vide puis réimporte (après changement de nommage)
python sql/setup_database.py --seed         # zones, acteurs, cadre, chiffres clés
python sql/setup_database.py --all          # --reset + --import-csv + --seed
```

`--reset` exécute `sql/schema.sql`, qui **supprime toutes les tables** ; le script demande confirmation. Les CSV sont lus dans le dossier local `data/`.

Pour faire évoluer une base existante sans la vider, utiliser `sql/migrations/` dans l'ordre numérique.

### Limites connues des données

- Les CSV de l'INS couvrent **2015-2023**, parfois 2024 : les années antérieures à 2020 ne sont pas importées (le schéma commence en 2020) et 35 séries seulement disposent d'une valeur 2024 publiée.
- Certains tableaux de l'INS sont **trimestriels** ; l'import retient la dernière valeur connue de chaque année.
- Les libellés de ligne ambigus (« Algérie », « Masculin ») sont préfixés par le titre du tableau source pour rester lisibles hors contexte.

---

## Panneau de contrôle (CDC §7)

- **Tableau de bord** — rapports vendus, revenu total, répartition par secteur, derniers rapports générés.
- **Secteurs** — tarif, description, mise en ligne.
- **Données d'un secteur** — formulaire des chiffres clés, ajout/suppression des zones, acteurs et textes réglementaires, séries statistiques avec leurs estimations, **Recalculer les projections** et **Régénérer le rapport** (avec suivi de progression).
- **Rapports** — relecture et correction du texte d'un rapport déjà produit (`/admin/rapports/:id`), puis reconstruction du PDF. **Aucun appel au modèle n'est refait** : une régénération complète écraserait les corrections. Les sections chiffrées, elles, sont relues en base, donc le document repart des valeurs à jour. Utile notamment quand le quota de rédaction est épuisé : le rapport sort avec ses sections chiffrées, et le texte se saisit à la main.
- **Comptes** — liste des comptes et gestion des rôles.

**Sécurité :** `/api/auth/login` est plafonné à 10 tentatives par quart d'heure et par adresse IP, l'inscription à 5 par heure. bcrypt ralentit chaque vérification mais n'empêche pas d'en enchaîner des milliers — le plafond, si.

Enregistrer des chiffres clés rafraîchit automatiquement la date de mise à jour affichée au catalogue.

---

## Dépannage

### « Unable to establish loopback connection » au démarrage du backend

Sur certains postes Windows, l'ouverture d'un `Selector` échoue parce que la boucle locale AF_UNIX est refusée par le système. Tomcat ne démarre alors pas du tout, avec cette trace :

```
java.io.IOException: Unable to establish loopback connection
    at sun.nio.ch.PipeImpl$Initializer.init
```

La JVM ne bascule sur TCP que si le `bind` échoue ; quand c'est le `connect` qui échoue, aucun repli n'a lieu et aucun réglage JVM n'y change rien — les deux sélecteurs Windows passent par le même code.

Le backend **détecte ce cas au démarrage** et bascule automatiquement sur le connecteur NIO2, qui s'appuie sur les ports d'achèvement de Windows plutôt que sur un `Selector`. Un avertissement le signale dans les journaux. Le service fonctionne normalement.

C'est un contournement, pas un correctif : la cause est système. Pour la traiter, ouvrir une invite de commandes **administrateur**, exécuter `netsh winsock reset`, puis redémarrer le poste. Un antivirus interceptant Winsock est le suspect habituel.

| Réglage | Effet |
|---------|-------|
| `app.tomcat.protocole=auto` | défaut — teste `Selector.open()` et ne bascule qu'en cas d'échec |
| `app.tomcat.protocole=nio` | force le connecteur standard |
| `app.tomcat.protocole=nio2` | force NIO2, sans détection |

### Jackson 2 contre Jackson 3

Spring Boot 4 embarque **Jackson 3**, dont le databind vit sous `tools.jackson.databind`. Les classes `com.fasterxml.jackson.databind` restent présentes sur le chemin de classes mais **aucun convertisseur ne sait les produire** : une méthode qui renvoie un `com.fasterxml.jackson.databind.JsonNode` compile parfaitement et échoue à l'exécution en `HttpMessageConversionException`.

Les **annotations** (`com.fasterxml.jackson.annotation.JsonProperty`, `JsonIgnore`) n'ont pas changé de paquet : elles restent telles quelles.

### Piège de mise en page à connaître (report-engine)

Les cellules de tableau sont tronquées **en amont**, par mesure du texte (`theme.tronquer`). L'option `lineBreak: false` de PDFKit ne fait pas ce que sa documentation laisse entendre : mesuré, un libellé de 172 pt placé dans une colonne de 76 pt occupe 28,8 pt de hauteur — trois lignes — avec ou sans l'option. Des lignes de tableau à hauteur fixe se chevauchaient donc, et un libellé long poussait le reste de sa ligne sur la page suivante, produisant des pages presque vides.

Toute nouvelle cellule de tableau doit passer par `tronquer()`.

---

## Vérification

```bash
cd backend && ./mvnw clean package
```

```bash
cd report-engine && npm test
```

```bash
cd frontend && npm run build
```

`npm run build` du frontend enchaîne `tsc --noEmit` puis `vite build` : une rupture de contrat avec l'API échoue à la compilation, pas en production. Les tests `report-engine` couvrent la logique métier la plus sensible : projections, mise en page PDF, construction des prompts.

---

## Points ouverts

| Sujet | État |
|-------|------|
| **Paiement réel** | Tourne en mode `simulation` par défaut. L'intégration PayPal (paiement + webhook) est complète et testée en sandbox ; il reste à fournir des identifiants Live et basculer `PAYPAL_ENV=live`. Le taux TND → devise reste figé en configuration, à réviser périodiquement. |
| **Vérification d'email** | La colonne `est_verifie` existe mais aucun email de confirmation n'est envoyé à l'inscription. |
| **Suivi des générations** | En mémoire côté report-engine (`jobStore`) : un job ne survit pas à un redémarrage du service. Le PDF produit, lui, est bien persisté et le bouton *Relancer* permet de reprendre sans nouveau paiement. |
| **Achat sans compte** | Techniquement possible (`id_utilisateur` NULL) mais l'interface impose la connexion, afin que le rapport soit retrouvable dans « Mes rapports ». |

---

## Sources de données

| Source | URL | Données |
|--------|-----|---------|
| **INS** | https://www.ins.tn | PIB, comptes nationaux, emploi, secteurs |
| **BCT** | https://www.bct.gov.tn | Recettes touristiques, balance des paiements |
| **FIPA** | https://www.fipa.tn | IDE par secteur, réglementation |
| **ONAGRI** | https://www.onagri.nat.tn | Agriculture |
| **ANME** | https://www.anme.nat.tn | Énergies renouvelables |
| **Banque Mondiale** | api.worldbank.org | Macro-économie, comparatif régional |
