// ==========================================
// Prompt Service
// Génération des sections IA du rapport
// ==========================================

const prompts = {

    introduction: (sector) => `
Tu es un expert en analyse économique.

Rédige une introduction professionnelle sur le secteur suivant.

Secteur :
${sector.nom}

Description :
${sector.description}

Le texte doit :

- être rédigé en français ;
- avoir un ton professionnel ;
- contenir environ 250 mots ;
- être clair et structuré ;
- ne pas utiliser de listes à puces.
`,

    tendances: (sector) => `
Tu es un économiste.

Analyse les tendances actuelles du secteur suivant :

Secteur :
${sector.nom}

Description :
${sector.description}

Rédige environ 300 mots.

Explique :

- les évolutions récentes ;
- la croissance du marché ;
- les nouvelles technologies ;
- les changements économiques.

Le texte doit être professionnel.
`,

    opportunites: (sector) => `
Tu es un consultant en investissement.

Analyse les opportunités d'investissement du secteur :

${sector.nom}

en Tunisie.

Présente :

- Opportunités à court terme
- Opportunités à moyen terme
- Régions les plus attractives
- Projets porteurs
- Secteurs complémentaires
- Conseils pour un investisseur étranger

Réponse professionnelle.
`,

    risques: (sector) => `
Tu es analyste des risques.

Analyse les principaux risques du secteur :

${sector.nom}

Description :

${sector.description}

Présente :

- risques économiques
- risques politiques
- risques financiers
- risques réglementaires

Environ 250 mots.
`,

    benchmarking: (sector) => `
Tu es un expert en investissement en Tunisie.

Réalise un benchmarking du secteur :

${sector.nom}

Compare uniquement la Tunisie avec :

- Maroc
- Égypte

Présente les informations sous les sections suivantes :

1. Position de la Tunisie
2. Comparaison avec le Maroc
3. Comparaison avec l'Égypte
4. Avantages compétitifs de la Tunisie
5. Faiblesses de la Tunisie
6. Recommandations pour améliorer la compétitivité

Utilise un style professionnel et analytique.

Ne compare avec aucun autre pays.
`,

    recommandations: (sector) => `
Tu es conseiller stratégique.

Donne des recommandations pour développer le secteur :

${sector.nom}

Présente des recommandations :

- pour les investisseurs
- pour les entreprises
- pour les décideurs publics

Environ 250 mots.
`,

    perspectives: (sector) => `
Tu es un économiste spécialisé dans les prévisions sectorielles.

Analyse les perspectives du secteur :

${sector.nom}

en Tunisie pour la période 2025-2028.

Présente :

1. Évolution attendue du secteur
2. Opportunités de croissance
3. Investissements prévus
4. Innovations et nouvelles tendances
5. Défis futurs
6. Conclusion

Réponse professionnelle, détaillée et spécifique à la Tunisie.
`,

};

module.exports = prompts;