# InvestPlatform — Rapport Sectoriel PDF

> **Projet de stage — 3LM Solutions**  
> Stagiaires : Houcein, Zakariya  
> Encadrante : Lilia Aouani  
> Date de démarrage : Juillet 2026  
> Dernière mise à jour : 28 Juillet 2026

---

## 📌 Contexte

InvestPlatform est un service de génération de rapports sectoriels PDF destinés aux investisseurs étrangers souhaitant s'informer sur les opportunités économiques en Tunisie.

**Flow du service :**
1. **Catalogue** — L'utilisateur parcourt les 6 secteurs et consulte un aperçu gratuit des 2 premières pages.
2. **Paiement** — Paiement à l'acte via PayPal.
3. **Génération** — Données sectorielles + analyse narrative IA (Groq API) → PDF assemblé (20–40 sec).
4. **Téléchargement** — PDF téléchargeable et sauvegardé dans l'espace utilisateur.

**Approche hybride :**
- Données structurées stockées en base (admin)
- Analyse narrative enrichie par IA (Groq API — modèle `llama3-8b-8192`)

---

## 🏗️ Architecture du Rapport PDF (13 sections)

| # | Section | Source |
|---|---------|--------|
| 1 | Couverture + Sommaire | Template |
| 2 | Présentation générale du secteur | IA |
| 3 | Chiffres clés et graphiques | **Base de données** |
| 4 | Analyse des tendances | IA |
| 5 | Acteurs principaux | **Base de données** |
| 6 | Cadre réglementaire et fiscal | **Base de données** |
| 7 | Zones géographiques et zones franches | **Base de données** |
| 8 | Opportunités identifiées | IA |
| 9 | Analyse des risques | IA |
| 10 | Benchmarking régional (Maroc, Égypte) | IA |
| 11 | Recommandations investisseur | IA |
| 12 | Perspectives 2025–2028 | IA |
| 13 | Sources et méthodologie | Mixte |

---

## 📊 Les 6 Secteurs Disponibles

| Secteur | Données clés | Catégorie INS correspondante |
|---------|-------------|------------------------------|
| 🏖️ **Tourisme** | Flux touristiques, capacité hôtelière, recettes, zones côtières | Tourisme + Commerce Extérieur |
| 🌾 **Agriculture** | Surfaces cultivées, exportations, cultures principales | Agriculture + Climatologie |
| 💻 **Technologies & Numérique** | Startups, export IT, centres offshore | Technologies de communication |
| ⚡ **Énergies Renouvelables** | Capacité installée, projets, objectifs 2030 | Energie + Environnement |
| 👕 **Textile & Habillement** | Exportations, emplois, marchés | Industrie + Commerce Extérieur |
| 🚢 **Logistique & Transport** | Ports, aéroports, corridors commerciaux | Transport + Commerce Extérieur |

---

## 🛠️ Stack Technique Confirmée

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de données | PostgreSQL (Neon) |
| Auth | JWT + bcryptjs |
| Génération PDF | À implémenter (Puppeteer / wkhtmltopdf) |
| IA (Narrative) | Groq API — `llama3-8b-8192` |
| Paiement | PayPal |

---

## ✅ Avancement Détaillé

### ✅ Tâche TERMINÉE : "Concevoir la structure de base de données"
- **Priorité** : Haute
- **Date** : 24–28 Juillet 2026
- **Livrable** : Schéma SQL complet (12 tables) déployé sur Neon

**Tables créées :**
- `secteurs` — Les 6 secteurs économiques
- `donnees_statistiques` — Séries temporelles 2020–2024 + projections
- `chiffres_cles` — Indicateurs agrégés (PIB, emplois, exportations)
- `zones_geographiques` — Zones franches, côtières, pôles
- `acteurs_principaux` — Entreprises, agences, startups
- `cadre_reglementaire` — Lois, incitations, régulations
- `utilisateurs` — Clients
- `admins` — Administrateurs
- `rapports` — PDF générés
- `paiements` — Transactions
- `logs_generation` — Traces IA
- `statistiques_ventes` — Agrégation mensuelle

**Seed data insérée :** Les 6 secteurs avec prix et métadonnées.

---

### 🟡 Tâche EN COURS : "Implémenter l'authentification admin"
- **Priorité** : Haute
- **Sous-tâches** :
  - [x] Créer la table `admins` avec hash sécurisé et rôles
  - [x] Implémenter l'API login avec JWT
  - [x] Créer le middleware `verifyAdmin`
  - [x] Développer la page de login React
  - [x] Développer le Dashboard admin React
  - [ ] Connecter le backend à la base Neon (en cours)
  - [ ] Tester le flux complet register → login → accès protégé

**Fichiers livrés :**
- `backend/server-neon.js` — Backend connecté à Neon
- `backend/server.js` — Backend avec fausse DB (backup/test)
- `frontend/src/pages/LoginPage.jsx` — Interface login
- `frontend/src/pages/Dashboard.jsx` — Interface dashboard
- `frontend/src/auth/AuthContext.jsx` — Contexte auth React

---

### ⬜ Tâches À FAIRE (ordre de priorité)

| Ordre | Tâche | Priorité | Statut CRM |
|-------|-------|----------|------------|
| 1 | Créer les modèles de données sectorielles | Moyenne | En cours |
| 2 | Créer la page catalogue des secteurs | Haute | À faire |
| 3 | Configurer l'API Groq pour génération IA | Haute | À faire |
| 4 | Implémenter l'intégration de paiement | Haute | À faire |
| 5 | Créer le système de génération PDF | Haute | À faire |
| 6 | Développer le panneau admin secteurs | Moyenne | À faire |
| 7 | Tester le flux complet achat-génération | Moyenne | À faire |

---

## 🔌 Connexion à Neon — Guide Technique

### Schéma de connexion

```
Frontend React (localhost:5173)
         │
         ▼
Backend Express (localhost:3001)
         │
         ▼
    PostgreSQL Neon
    (console.neon.tech)
```

### Configuration du `.env`

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/investplatform?sslmode=require
JWT_SECRET=ma_cle_super_secrete_pour_investplatform_2026
PORT=3001
```

> **Important** : Remplace `DATABASE_URL` par l'URL réelle copiée depuis le dashboard Neon.

### Démarrage du projet

```bash
# Terminal 1 — Backend
cd backend
npm install
npm start

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Accès : http://localhost:5173

### Vérification de la connexion

| Test | Commande SQL sur Neon | Résultat attendu |
|------|----------------------|------------------|
| Tables existantes | `\dt` | Liste des 12 tables |
| Secteurs insérés | `SELECT * FROM secteurs;` | 6 lignes |
| Admin créé | `SELECT * FROM admins;` | Compte visible |

---

## 📁 Structure du Projet

```
investplatform-admin/
├── backend/
│   ├── server-neon.js      ← Backend connecté à Neon
│   ├── server.js           ← Backend avec fausse DB (backup)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── auth/
│       │   └── AuthContext.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           └── Dashboard.jsx
└── sql/
    └── verify-neon.sql     ← Vérification/création rapide
```

---

## 📁 Sources de Données Identifiées

### Sources Officielles Tunisiennes
| Source | URL | Données |
|--------|-----|---------|
| **INS** | https://www.ins.tn/statistiques/74 | PIB, comptes nationaux, secteurs, emploi |
| **BCT** | https://www.bct.gov.tn | Recettes touristiques, balance des paiements |
| **FIPA** | https://www.fipa.tn | IDE par secteur, projets, réglementation |
| **ONAGRI** | https://www.onagri.nat.tn | Agriculture, surfaces, exportations |
| **ANME** | https://www.anme.nat.tn | Énergies renouvelables, capacité installée |

### Sources Internationales (API)
| Source | API | Données |
|--------|-----|---------|
| **Banque Mondiale** | api.worldbank.org | Macro, PIB sectoriel, énergie, tourisme |
| **FMI** | data.imf.org | Commerce, dette, projections |
| **UNCTAD** | unctadstat.unctad.org | Commerce extérieur, IDE |

---

## 🐛 Erreurs Connues & Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `self signed certificate` | SSL Neon | Déjà géré (`rejectUnauthorized: false`) |
| `database does not exist` | Mauvais nom de DB | Vérifier l'URL dans `.env` |
| `relation does not exist` | Table manquante | Exécuter `sql/verify-neon.sql` sur Neon |
| `ECONNREFUSED` | Mauvais host/port | Vérifier l'URL Neon complète |
| `npm : terme non reconnu` | Node.js non installé | Installer depuis nodejs.org |
| `Port 3001 already in use` | Conflit de port | Fermer l'autre processus ou changer le port |

---

## 👥 Méthode de Travail

- **Mode** : 100% remote
- **Horaires** : Flexibles (équipe de 9h à 18h)
- **Suivi quotidien** : Groupe WhatsApp
- **Point hebdomadaire** : Réunion de suivi avec Lilia
- **Questions techniques** : Posées sur le groupe WhatsApp
- **Contact privé** : WhatsApp Lilia

---

## 📅 Prochaines Étapes Immédiates

1. [ ] Finaliser la connexion backend ↔ Neon et valider les tests
2. [ ] Remplir les tables métier avec les données de l'INS (Tourisme en priorité)
3. [ ] Compléter le panneau admin avec l'édition des données chiffrées
4. [ ] Intégrer l'API Groq pour les sections d'analyse narrative
5. [ ] Développer la page catalogue des 6 secteurs (aperçu gratuit)
6. [ ] Implémenter le paiement PayPal
7. [ ] Créer le système de génération PDF hybride (DB + IA)

---

## 📄 Documents du Projet

- Cahier des charges : `CDC_Rapport_Sectoriel.docx`
- Schéma SQL : `schema_investplatform.sql`
- Ce README : `README.md`

---

*Dernière mise à jour : 28 Juillet 2026*
