# InvestPlatform — Rapport Sectoriel PDF

> **Projet de stage — 3LM Solutions**
> Stagiaires : Houcein, Zakariya · Encadrante : Lilia Aouani
> Cahier des charges : [`CDC_Rapport_Sectoriel.docx`](CDC_Rapport_Sectoriel.docx)

Service de génération de rapports sectoriels PDF pour les investisseurs
étrangers intéressés par la Tunisie. Chaque rapport combine des **données
chiffrées officielles** stockées en base et une **analyse narrative rédigée par
IA** (Groq) à partir de ces mêmes chiffres.

---

## 🚀 Démarrage

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Le frontend est servi sur http://localhost:5173, l'API sur http://localhost:3001.
En développement, le proxy Vite redirige `/api` et `/reports` vers le backend :
aucune URL de backend n'est écrite en dur dans le code React.

### Configuration

Copier `backend/.env.example` vers `backend/.env` et renseigner :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion Neon (obligatoire) |
| `JWT_SECRET` | Signature des jetons admin (obligatoire) |
| `GROQ_API_KEY` | Clé Groq — sans elle, les sections IA restent vides |
| `GROQ_MODEL` | Modèle utilisé (défaut `llama-3.3-70b-versatile`) |
| `PORT`, `CORS_ORIGIN` | Réseau |

Le serveur refuse de démarrer si une variable obligatoire manque ou si la base
est injoignable — un échec explicite au lancement vaut mieux qu'une API qui
répond 500 à chaque requête.

---

## 🗂️ Structure du projet

```
InvestPlatform/
├── backend/
│   └── src/
│       ├── server.js              ← point d'entrée
│       ├── config/                env.js (config centralisée), db.js (pool pg)
│       ├── middleware/            auth.js (verifyAdmin), errorHandler.js
│       ├── routes/                index.js = table de routage complète
│       │   ├── auth.routes.js         /api/admin/register|login|me
│       │   ├── catalogue.routes.js    /api/catalogue (public + aperçu)
│       │   ├── payment.routes.js      /api/payment  (PayPal simulé)
│       │   ├── report.routes.js       /api/report   (génération + progression)
│       │   └── admin.routes.js        /api/admin/*  (protégé)
│       ├── services/
│       │   ├── sectorRepository.js    seul accès SQL aux tables métier
│       │   ├── promptService.js       les 7 prompts + contexte chiffré
│       │   ├── groqService.js         client Groq
│       │   ├── reportService.js       orchestration données → IA → PDF → base
│       │   ├── salesService.js        achats et statistiques de vente
│       │   └── jobStore.js            suivi de progression des générations
│       └── pdf/
│           ├── sections.js            SOURCE UNIQUE des 12 sections
│           ├── theme.js               charte + primitives de mise en page
│           └── reportPdf.js           rapport complet et aperçu 2 pages
├── frontend/
│   └── src/
│       ├── api/client.js          seul point d'appel au backend
│       ├── auth/AuthContext.jsx
│       ├── components/            NavBar, SectorCard, ProgressBar
│       ├── pages/
│       │   ├── Catalogue.jsx          page d'accueil publique
│       │   ├── LoginPage.jsx
│       │   └── admin/
│       │       ├── Dashboard.jsx      ventes, revenu, secteurs
│       │       └── SecteurDonnees.jsx édition des données + régénération
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
   seule fois (`pdf/sections.js`) et alimentent à la fois la couverture, le
   sommaire, l'aperçu gratuit et le corps du document : le sommaire ne peut plus
   annoncer une section qui n'est pas produite. De même, le schéma SQL n'existe
   qu'à un endroit (`sql/schema.sql`), lu par le script Python.
2. **Une porte d'entrée par couche.** Le SQL métier vit dans
   `sectorRepository.js`, les appels HTTP du frontend dans `api/client.js`.

---

## 🔄 Flow du service (CDC §6)

| Étape | Route | Détail |
|-------|-------|--------|
| 1. Catalogue | `GET /api/catalogue` | 6 secteurs, prix, pages, date de mise à jour |
| 1bis. Aperçu | `GET /api/catalogue/:id/preview` | 2 pages — couverture + sommaire, sans appel IA |
| 2. Commande | `POST /api/payment/create-order` | crée un achat `en_attente` |
| 2bis. Paiement | `POST /api/payment/capture` | passe l'achat à `paye` |
| 3. Génération | `POST /api/report/generate` | renvoie un `jobId` (202) |
| 3bis. Progression | `GET /api/report/status/:jobId` | alimente la barre de progression |
| 4. Téléchargement | `GET /reports/<fichier>.pdf` | PDF servi en statique |

La génération n'est possible qu'avec un achat **payé** portant sur le **même
secteur** : la route refuse sinon (`402`).

L'aperçu gratuit est produit par les mêmes fonctions que le rapport payant :
l'acheteur voit exactement les deux premières pages de ce qu'il achètera, et
l'aperçu reste instantané même si le quota Groq est épuisé.

---

## 📄 Structure du rapport (CDC §5)

Couverture + sommaire, puis 12 sections — 14 pages minimum (15 en pratique) :

| # | Section | Source |
|---|---------|--------|
| 1 | Présentation générale du secteur | IA |
| 2 | Chiffres clés et graphiques | Base |
| 3 | Analyse des tendances | IA |
| 4 | Acteurs principaux | Base |
| 5 | Cadre réglementaire et fiscal | Base |
| 6 | Zones géographiques et zones franches | Base |
| 7 | Opportunités identifiées | IA |
| 8 | Analyse des risques | IA |
| 9 | Benchmarking régional (Maroc, Égypte) | IA |
| 10 | Recommandations investisseur | IA |
| 11 | Perspectives 2025-2028 | IA |
| 12 | Sources et méthodologie | Base |

Les graphiques sont dessinés directement avec les primitives vectorielles de
PDFKit : aucune librairie de charts n'est nécessaire.

### Approche hybride

`promptService.buildDataContext()` sérialise les données chiffrées du secteur
(chiffres clés, séries statistiques, zones, acteurs, cadre réglementaire) et
**injecte ce bloc dans chacun des 7 prompts**, avec la consigne de ne pas
inventer de chiffre absent. L'analyse narrative commente donc les mêmes données
que celles imprimées dans les sections « données » du rapport.

Chaque appel est tracé dans `logs_generation` (prompt, réponse, durée, statut).
Une section IA en échec n'interrompt pas la génération : le PDF affiche un
encart explicite et le rapport reste livrable.

---

## 🛠️ Base de données

13 tables sur PostgreSQL (Neon). Le script de setup couvre trois opérations
indépendantes :

```bash
pip install -r requirements.txt
python sql/setup_database.py --import-csv   # importe data/*.csv
python sql/setup_database.py --seed         # zones, acteurs, cadre, chiffres clés
python sql/setup_database.py --all          # --reset + --import-csv + --seed
```

`--reset` exécute `sql/schema.sql`, qui **supprime toutes les tables** ; le
script demande confirmation. Les CSV sont lus dans le dossier local `data/`
(l'ancienne version les téléchargeait depuis GitHub).

Pour faire évoluer une base existante sans la vider, utiliser
`sql/migrations/`.

### Limites connues des données

- Les CSV de l'INS couvrent **2015-2023**, alors que le schéma stocke
  2020-2024 : `valeur_2024` reste donc vide pour la plupart des indicateurs,
  et les années 2015-2019 ne sont pas importées.
- Certains tableaux de l'INS sont **trimestriels** ; l'import retient la
  dernière valeur connue de chaque année.
- Les colonnes `projection_2025..2028` ne sont pas encore alimentées : les
  graphiques n'affichent donc que l'historique.

---

## 🔐 Panneau admin (CDC §7)

Accessible sur `/admin` après connexion (`/login`).

- **Tableau de bord** — rapports vendus, revenu total et par secteur, derniers
  rapports générés, édition rapide des secteurs (nom, description, prix, statut).
- **Données d'un secteur** (`/admin/secteurs/:id`) — formulaire des chiffres
  clés, ajout/suppression des zones, acteurs et textes réglementaires, liste des
  séries statistiques importées, et bouton **Régénérer le rapport** avec suivi de
  progression.

Enregistrer des chiffres clés rafraîchit automatiquement la date de mise à jour
affichée au catalogue.

---

## ⚠️ Points ouverts

| Sujet | État |
|-------|------|
| **PayPal** | Simulé. `payment.routes.js` trace un vrai achat en base mais valide le paiement sans appel externe ; l'intégration se limitera à remplacer le corps des deux routes. |
| **Comptes clients** | La table `utilisateurs` existe, mais seule l'authentification **admin** est implémentée. Les achats sont donc enregistrés sans client rattaché (`id_utilisateur` NULL) et il n'y a pas encore d'« espace utilisateur » où retrouver ses rapports. |
| **Projections 2025-2028** | Colonnes prévues au schéma, pas encore alimentées. |
| **Suivi des générations** | En mémoire (`jobStore`) : un job ne survit pas à un redémarrage du serveur. Le PDF produit, lui, est bien persisté. |

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
| `GROQ_API_KEY absente` (avertissement) | Clé non configurée | Les sections IA restent vides ; le reste fonctionne |
| `Serveur injoignable` côté React | Backend arrêté | `cd backend && npm run dev` |
| `Aucun paiement confirmé` | Génération appelée sans achat payé | Passer par `create-order` puis `capture` |
| `Port 3001 already in use` | Instance déjà lancée | Fermer l'autre processus ou changer `PORT` |
