# InvestPlatform — Rapport Sectoriel PDF

> **Projet de stage — 3LM Solutions**  
> Stagiaire : Houcein et Zakariya
> Encadrante : Lilia Aouani  
> Date de démarrage : Juillet 2026

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

## ✅ Avancement Actuel

### Tâche en cours : "Créer les modèles de données sectorielles"
- **Statut** : 🟡 En cours
- **Priorité** : Moyenne
- **Projet** : InvestPlatform

#### Ce qui a été fait :
- [x] Lecture et analyse du cahier des charges (CDC_Rapport_Sectoriel.docx)
- [x] Identification des 6 secteurs et de leurs données requises
- [x] Mapping des catégories de l'INS (Institut National de la Statistique) avec les secteurs du projet
- [x] Recherche des sources de données officielles (INS, BCT, FIPA, ONAGRI, Banque Mondiale, FMI)
- [x] Collecte de données brutes récentes (2023–2025) via recherche web
- [x] Définition de la structure JSON type pour chaque secteur
- [x] Décision de ne PAS utiliser le web scraping (sites tunisiens lents/instables) — privilégier téléchargement Excel + APIs internationales + parsing PDF

#### Structure du modèle de données par secteur :
```json
{
  "secteur": "nom_du_secteur",
  "donnees_statistiques": { "indicateurs sur 5 ans (2020-2024)" },
  "chiffres_cles": { "croissance, PIB, emplois, exportations" },
  "zones_geographiques": [ { "nom", "type", "description" } ],
  "acteurs_principaux": [ { "nom", "type", "role" } ],
  "cadre_reglementaire": [ { "titre", "annee", "description", "avantages" } ]
}
```

#### Ce qui reste à faire :
- [ ] Confirmer la stack technique avec Lilia (backend, DB, ORM, génération PDF)
- [ ] Télécharger les fichiers Excel de l'INS (ins.tn/statistiques)
- [ ] Récupérer les données via API Banque Mondiale / FMI
- [ ] Parser les rapports PDF (CST Tourisme, Annuaire Statistique)
- [ ] Remplir les modèles JSON pour les 6 secteurs
- [ ] Créer les migrations / seeds pour la base de données
- [ ] Implémenter le panneau admin d'édition des données

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

## 🛠️ Stack Technique (À confirmer)

> ⚠️ En attente de confirmation par Lilia / équipe 3LM Solutions

| Couche | Technologie (proposition) |
|--------|---------------------------|
| Frontend | React / Next.js |
| Backend | Node.js (Express) ou Python (FastAPI) |
| Base de données | PostgreSQL ou MongoDB |
| ORM | Prisma / Sequelize / SQLAlchemy |
| Génération PDF | Puppeteer / wkhtmltopdf |
| IA (Narrative) | Groq API — `llama3-8b-8192` |
| Paiement | PayPal |

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

1. **Confirmer la stack technique** avec l'équipe
2. **Accéder au repo GitHub** du projet
3. **Télécharger les Excel de l'INS** (priorité : Tourisme, Agriculture, Energie)
4. **Récupérer les données API** Banque Mondiale
5. **Structurer le premier secteur** (Tourisme — le plus documenté)
6. **Soumettre le modèle** à Lilia pour validation

---

## 📄 Documents du Projet

- [Cahier des charges — Rapport Sectoriel PDF](CDC_Rapport_Sectoriel.docx)
  
---

*Dernière mise à jour : 23 Juillet 2026*
