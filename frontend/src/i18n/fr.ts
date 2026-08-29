/* ==========================================================================
   Dictionnaire français — RÉFÉRENCE.
   --------------------------------------------------------------------------
   Ce fichier fait autorité : le type `Dictionnaire` en est déduit, et toute
   autre langue doit le satisfaire intégralement. Ajouter une clé ici sans la
   traduire ailleurs casse la compilation — c'est voulu. Une traduction
   manquante doit se voir au build, jamais en production sous la forme d'un
   libellé français au milieu d'une page anglaise.

   Les valeurs sont soit des chaînes, soit des fonctions quand un nombre ou un
   nom doit s'y insérer : la grammaire d'insertion n'est pas la même d'une
   langue à l'autre, et une fonction laisse chaque langue placer ses variables
   où sa syntaxe l'exige.
   ========================================================================== */

export const fr = {
  /** Nom de la langue dans sa propre langue, pour le sélecteur. */
  metaLangue: {
    nom: 'Français',
    court: 'FR',
    /** Attribut `lang` de <html> : lu par les lecteurs d'écran et Google. */
    codeHtml: 'fr',
    /** Titre de l'onglet et resultat dans les moteurs de recherche. */
    titrePage: 'Tunisia Invest — Rapports sectoriels',
    descriptionPage:
      "Rapports sectoriels pour investisseurs etrangers : donnees officielles, analyses " +
      "et perspectives sur six secteurs cles de l'economie tunisienne.",
  },

  commun: {
    ouvrirNavigation: 'Ouvrir la navigation',
    emailExemple: 'vous@exemple.com',
    chargement: 'Chargement…',
    erreur: 'Une erreur est survenue',
    reessayer: 'Réessayer',
    annuler: 'Annuler',
    fermer: 'Fermer',
    enregistrer: 'Enregistrer',
    seConnecter: 'Se connecter',
    seDeconnecter: 'Se déconnecter',
    creerCompte: 'Créer un compte',
    changerLangue: 'Changer de langue',
    themeClair: 'Passer au thème clair',
    themeSombre: 'Passer au thème sombre',
  },

  role: {
    administrateur: 'Administrateur',
    client: 'Client',
  },

  nav: {
    principale: 'Navigation principale',
    catalogue: 'Catalogue',
    catalogueDetail: 'Les six secteurs et leurs rapports',
    mesRapports: 'Mes rapports',
    mesRapportsDetail: 'Commandes réglées et documents livrés',
    analyse: 'Analyse',
    comparateur: 'Comparateur de secteurs',
    comparateurDetail: 'Les six secteurs face à face, sur sept indicateurs',
    regional: 'Comparatif régional',
    regionalDetail: 'Tunisie, Maroc et Égypte sur données officielles',
    glossaire: 'Glossaire',
    glossaireDetail: "Termes de l'investissement en Tunisie",
    administration: 'Administration',
    pilotage: 'Pilotage',
    pilotageDetail: 'Ventes, revenus et rapports produits',
    secteurs: 'Secteurs',
    secteursDetail: 'Tarifs, visibilité et données sectorielles',
    rapports: 'Rapports',
    rapportsDetail: 'Documents générés et corrections',
    comptes: 'Comptes',
    comptesDetail: 'Rôles et accès des utilisateurs',
    compte: 'Compte',
    profil: 'Profil',
    profilDetail: 'Informations personnelles et mot de passe',
    parametres: 'Paramètres',
    parametresDetail: 'Thème, préférences et état des services',
  },

  connexion: {
    titreConnexion: 'Connexion',
    titreInscription: 'Créer un compte',
    accrocheConnexion: 'Accédez à vos rapports et à votre espace.',
    accrocheInscription: 'Retrouvez vos commandes et vos rapports au même endroit.',
    prenom: 'Prénom',
    nom: 'Nom',
    email: 'Adresse email',
    motDePasse: 'Mot de passe',
    longueurMinimale: '8 caractères minimum.',
    entreprise: 'Entreprise (facultatif)',
    pays: 'Pays (facultatif)',
    boutonConnexion: 'Se connecter',
    boutonInscription: 'Créer mon compte',
    pasDeCompte: 'Pas encore de compte ?',
    dejaInscrit: 'Déjà inscrit ?',
    bascculerVersInscription: 'Créer un compte',
    basculerVersConnexion: 'Se connecter',
    bienvenue: (qui: string) => `Bienvenue, ${qui}`,
    echec: 'Connexion impossible.',
  },

  catalogue: {
    surtitre: 'Rapports sectoriels — Tunisie',
    titre: 'Six secteurs, une lecture chiffrée du marché tunisien.',
    accroche:
      "Chaque rapport réunit les données publiées par les sources officielles, leurs " +
      "perspectives estimées et une analyse rédigée à partir de ces mêmes chiffres. " +
      "Aucun montant n'est avancé sans sa source.",
    argumentDonnees: 'Données officielles',
    argumentDonneesTexte:
      "Séries de l'Institut National de la Statistique, importées et tracées jusqu'à leur source.",
    argumentPerspectives: 'Perspectives chiffrées',
    argumentPerspectivesTexte:
      'Estimations 2025-2028 calculées, présentées comme telles et jamais confondues avec une donnée publiée.',
    argumentLivraison: 'Livraison immédiate',
    argumentLivraisonTexte:
      'Rapport PDF de 14 pages minimum, généré et téléchargeable dès la validation du paiement.',
    sectionTitre: 'Catalogue',
    sectionAccroche:
      'Consultez gratuitement les deux premières pages de chaque rapport avant de commander.',
    erreurTitre: "Le catalogue n'a pas pu être chargé.",
  },

  carteSecteur: {
    pages: (nombre: number) => `${nombre} pages`,
    misAJourLe: (date: string) => `Mis à jour le ${date}`,
    debite: (montant: string) => `débité ${montant}`,
    apercu: 'Aperçu',
    commander: 'Commander',
  },

  risques: {
    surtitre: 'Information réglementaire',
    titre: 'Avertissement sur les risques',
    accroche: 'À lire avant toute utilisation des rapports proposés sur cette plateforme.',
    encadre:
      "Les rapports de Tunisia Invest sont des documents d'information. Ils ne " +
      'constituent ni un conseil en investissement, ni une recommandation, ni une ' +
      'garantie de résultat. Tout investissement comporte un risque de perte en capital.',
    derniereMiseAJour: (date: string) => `Dernière mise à jour de cet avertissement : ${date}.`,

    natureTitre: '1. Nature de l’information fournie',
    natureP1:
      'Les rapports sectoriels publiés sur cette plateforme constituent des documents ' +
      'd’information économique à caractère général. Ils ne constituent pas un conseil ' +
      'en investissement, une recommandation personnalisée, une sollicitation d’achat ' +
      'ou de vente, ni une offre de service financier réglementé.',
    natureP2:
      'L’éditeur n’évalue ni votre situation patrimoniale, ni vos objectifs, ni votre ' +
      'horizon de placement, ni votre tolérance au risque. Aucun élément de ces rapports ' +
      'ne doit être compris comme une incitation à réaliser une opération déterminée.',

    perteTitre: '2. Risque de perte en capital',
    perteP1:
      'Tout investissement comporte un risque de perte, pouvant aller jusqu’à la totalité ' +
      'des sommes engagées. Les performances passées d’un secteur ne préjugent pas de ses ' +
      'performances futures.',
    perteP2:
      'Un investissement direct à l’étranger expose en outre à des risques spécifiques : ' +
      'évolution du cadre réglementaire et fiscal, variation du taux de change, ' +
      'restrictions de change ou de rapatriement des capitaux, risque politique, risque ' +
      'de contrepartie et risque de liquidité.',

    projectionsTitre: '3. Statut des projections',
    projectionsP1:
      'Les valeurs présentées pour les années 2025 à 2028 sont des ESTIMATIONS obtenues ' +
      'par extrapolation statistique de séries historiques. Elles sont systématiquement ' +
      'signalées comme telles dans l’interface comme dans les documents PDF, et ne ' +
      'doivent jamais être lues comme des données publiées.',
    projectionsP2:
      'Une série dont l’ajustement statistique est jugé insuffisant ne reçoit aucune ' +
      'estimation : l’absence de projection est un résultat, pas une omission.',

    sourcesTitre: '4. Sources et exactitude',
    sourcesP1:
      'Les données chiffrées proviennent d’organismes publics tunisiens et sont ' +
      'reproduites en l’état. L’éditeur ne garantit ni leur exhaustivité, ni leur ' +
      'actualité, ni l’absence d’erreur à la source, et ne saurait être tenu responsable ' +
      'd’une décision fondée sur ces informations.',
    sourcesP2:
      'Les sections rédigées des rapports sont produites à partir du seul jeu de données ' +
      'du secteur concerné. Le procédé employé est décrit explicitement dans la section ' +
      '« Sources et méthodologie » de chaque document.',

    conseilTitre: '5. Recours à un conseil professionnel',
    conseilP1:
      'Avant toute décision d’investissement en Tunisie, il est recommandé de consulter ' +
      'un conseil juridique, fiscal et financier établi localement, et de procéder aux ' +
      'vérifications d’usage (due diligence) propres au projet envisagé.',
    conseilP2:
      'Les rapports de cette plateforme ne remplacent en aucun cas ces démarches.',
  },

  legal: {
    titre: 'Mentions légales',
    accroche:
      "Informations relatives à l'éditeur du service, à son hébergement et au " +
      'traitement des données.',
    aRenseigner: 'à renseigner',
    manquantsTitre: (nombre: number) =>
      `${nombre} information(s) légale(s) manquante(s)`,
    manquantsAvant: 'Ces champs sont vides dans',
    manquantsApres:
      ". Ils n'ont pas été pré-remplis : une raison sociale ou un numéro " +
      "d'immatriculation inventés seraient indiscernables de vrais renseignements et " +
      'engageraient votre responsabilité. À compléter avant toute mise en ligne publique.',

    editeur: 'Éditeur du service',
    nomCommercial: 'Nom commercial',
    raisonSociale: 'Raison sociale',
    formeJuridique: 'Forme juridique',
    immatriculation: 'Immatriculation',
    capitalSocial: 'Capital social',
    siegeSocial: 'Siège social',
    directeurPublication: 'Directeur de la publication',
    contact: 'Contact',

    hebergement: 'Hébergement',
    hebergeur: 'Hébergeur',
    adresse: 'Adresse',

    donneesTitre: 'Données personnelles',
    donneesCollecteesTitre: 'Données collectées.',
    donneesCollecteesTexte:
      "À la création d'un compte : adresse email, nom, prénom, et facultativement " +
      'entreprise, pays et téléphone. À chaque commande : le secteur acheté, le montant, ' +
      "la date, ainsi que l'adresse du compte payeur et la référence de transaction " +
      'transmises par le prestataire de paiement.',
    donneesJamaisTitre: "Ce qui n'est jamais collecté.",
    donneesJamaisTexte:
      'Aucun numéro de carte, aucun identifiant bancaire, aucun mot de passe de service ' +
      "tiers. Le règlement s'effectue intégralement sur le domaine du prestataire de " +
      'paiement, qui ne nous communique jamais les identifiants de ses clients.',
    donneesFinaliteTitre: 'Finalité.',
    donneesFinaliteTexte:
      'Ces données servent exclusivement à exécuter la commande, à donner accès aux ' +
      'rapports achetés et à tenir la comptabilité du service. Elles ne sont ni revendues, ' +
      'ni cédées à des fins publicitaires.',
    donneesDroitsTitre: 'Vos droits.',
    donneesDroitsTexte:
      'Vous pouvez consulter et modifier vos informations depuis la page « Profil ». Pour ' +
      "toute demande d'accès, de rectification ou de suppression, écrivez à l'adresse de " +
      'contact indiquée ci-dessus.',

    stockageTitre: 'Stockage local',
    stockageIntro:
      "Le service n'utilise aucun cookie publicitaire ni traceur tiers. Quatre " +
      'informations seulement sont conservées dans le navigateur :',
    stockageJeton: 'le jeton de session, qui vous maintient connecté ;',
    stockageTheme: 'le thème choisi, clair ou sombre ;',
    stockageLangue: 'la langue choisie, française ou anglaise ;',
    stockagePreferences: "vos préférences d'affichage, réglables depuis « Paramètres ».",
    stockageConclusion:
      'Ces éléments restent sur votre appareil et ne sont pas transmis à des tiers. ' +
      'Se déconnecter efface le jeton de session.',
  },

  apropos: {
    surtitre: 'Qui sommes-nous',
    titre:
      "Rendre l'économie tunisienne lisible pour ceux qui envisagent d'y investir.",
    accroche:
      'Un investisseur étranger qui étudie la Tunisie se heurte à des données dispersées ' +
      'entre plusieurs organismes, publiées à des rythmes différents et rarement mises en ' +
      'perspective. Tunisia Invest rassemble ces séries, les met en forme et les commente, ' +
      'secteur par secteur, dans un document unique.',

    chiffreSecteurs: 'secteurs couverts',
    chiffreSections: 'sections par rapport',
    chiffrePages: 'pages par document',
    chiffreProfondeur: 'profondeur temporelle',

    methodeTitre: 'Notre méthode',
    methodeAccroche:
      "La valeur d'un rapport d'investissement tient à ce qu'on peut vérifier. Chaque " +
      "étape de fabrication est donc conçue pour qu'un lecteur puisse remonter d'une " +
      'affirmation à la donnée qui la fonde.',
    methodeCollecteTitre: 'Collecte des données publiées',
    methodeCollecteTexte:
      'Les séries statistiques proviennent des organismes publics tunisiens. Elles sont ' +
      'importées telles quelles, sans retraitement, et chaque indicateur conserve la ' +
      'référence de sa source.',
    methodeCalculTitre: 'Calcul des perspectives',
    methodeCalculTexte:
      'Deux modèles sont mis en concurrence sur chaque série — régression linéaire par ' +
      "moindres carrés et taux de croissance annuel moyen — et celui qui s'ajuste le mieux " +
      "à l'historique est retenu. Une série dont aucun modèle n'atteint un coefficient de " +
      'détermination suffisant ne reçoit aucune estimation.',
    methodeRedactionTitre: 'Rédaction adossée aux chiffres',
    methodeRedactionTexte:
      "Les sections d'analyse sont rédigées à partir du seul jeu de données du secteur, " +
      "transmis intégralement au modèle de langage avec la consigne de n'avancer aucun " +
      'chiffre absent de ce jeu. Le procédé et le modèle employés sont décrits dans la ' +
      'section « Sources et méthodologie » de chaque rapport.',
    methodeSeparationTitre: "Séparation de l'observé et de l'estimé",
    methodeSeparationTexte:
      'Une donnée publiée et une projection calculée ne sont jamais présentées de la même ' +
      "façon, ni dans l'interface ni dans le PDF : couleurs distinctes, tracé différent, " +
      'mention explicite. Présenter une extrapolation comme un fait serait la faute la plus ' +
      'grave que puisse commettre ce service.',

    sourcesTitre: 'Sources de données',
    sourcesAccroche:
      "Les chiffres publiés dans nos rapports proviennent d'organismes publics tunisiens. " +
      'Nous ne produisons aucune donnée primaire : notre travail consiste à rassembler, ' +
      'structurer et mettre en perspective ce qui est déjà publié.',
    siteOfficiel: 'Site officiel',

    limitesTitre: 'Ce que nos rapports ne sont pas',
    limitesConseilFort: 'pas des conseils en investissement',
    limitesConseilAvant: 'Ce ne sont ',
    limitesConseilApres:
      ". Nous n'évaluons pas votre situation, vos objectifs ni votre tolérance au risque, " +
      'et nous ne recommandons aucune opération. Un rapport documente un secteur ; la ' +
      'décision vous appartient.',
    limitesPrevisionsFort: 'pas des prévisions garanties',
    limitesPrevisionsApres:
      ". Les projections 2025-2028 sont des extrapolations statistiques d'un historique. " +
      "Elles sont utiles pour situer un ordre de grandeur, jamais pour affirmer ce qui " +
      'adviendra.',
    limitesAuditFort: "pas des documents d'audit",
    limitesAuditApres:
      ". Ils ne remplacent ni une due diligence, ni l'avis d'un conseil juridique ou " +
      'fiscal établi en Tunisie.',
  },

  contact: {
    titre: 'Nous contacter',
    accroche:
      'Choisissez le canal correspondant à votre demande : elle sera traitée par ' +
      "l'interlocuteur compétent, sans transfert intermédiaire.",

    aucunCanalTitre: 'Coordonnées non renseignées',
    aucunCanalAvant: 'Les adresses de contact sont vides dans',
    aucunCanalApres:
      ". Elles n'ont volontairement pas été inventées : une adresse fictive renverrait " +
      'les demandes dans le vide. Renseignez-les avant la mise en ligne.',

    supportTitre: 'Support client',
    supportTexte: "Commande, téléchargement d'un rapport, question sur votre compte.",
    supportDelai: 'Réponse sous 1 jour ouvré',
    commercialTitre: 'Demandes commerciales',
    commercialTexte: 'Rapports sur mesure, accès multi-utilisateurs, partenariats.',
    commercialDelai: 'Réponse sous 2 jours ouvrés',
    generalTitre: 'Question générale',
    generalTexte: 'Méthode, sources, couverture sectorielle, presse.',
    generalDelai: 'Réponse sous 3 jours ouvrés',
    aRenseigner: '— à renseigner —',

    coordonnees: 'Coordonnées',
    adresseARenseigner: 'Adresse à renseigner',
    telephoneARenseigner: 'Téléphone à renseigner',

    avantEcrireTitre: "Avant d'écrire",
    avantEcrire1:
      'Un rapport payé mais non livré se relance seul depuis « Mes rapports », sans ' +
      'nouveau paiement.',
    avantEcrire2:
      'Les deux premières pages de chaque rapport sont consultables gratuitement depuis ' +
      'le catalogue.',
    avantEcrire3:
      'Pour une question sur une commande, indiquez la référence de transaction : elle ' +
      "figure sur l'écran de confirmation.",
  },

  glossaire: {
    surtitre: 'Ressources',
    titre: 'Glossaire',
    accroche: 'Les termes rencontrés dans les rapports sectoriels, définis sans jargon.',
    rechercher: 'Rechercher un terme…',
    toutes: 'Toutes',
    aucunResultat: 'Aucun terme ne correspond',
    avertissement:
      'Ces définitions décrivent des notions et des dispositifs, sans mentionner de taux ' +
      'ni de seuils : ceux-ci évoluent au fil des lois de finances, et une valeur figée ' +
      "ici deviendrait fausse sans que personne ne s'en aperçoive. Les chiffres à jour " +
      'figurent dans les rapports, avec leur date et leur source.',

    categorieFiscalite: 'Fiscalité',
    categorieStatistique: 'Statistique',
    categorieLogistique: 'Logistique',
    categorieInvestissement: 'Investissement',
    categorieEnergie: 'Énergie',

    totalementExportatriceTerme: 'Société totalement exportatrice',
    totalementExportatriceDefinition:
      "Régime tunisien réservé aux entreprises dont l'essentiel du chiffre d'affaires est " +
      "réalisé à l'export. Il ouvre droit à des avantages fiscaux et douaniers, en " +
      "contrepartie d'obligations déclaratives et d'un seuil d'exportation à respecter.",
    totalementExportatriceNuance:
      'Le seuil et la durée des avantages relèvent de la loi de finances en vigueur : ' +
      "vérifiez-les auprès de l'APII avant de bâtir un plan financier dessus.",

    zoneFrancheTerme: 'Zone franche',
    zoneFrancheDefinition:
      "Périmètre douanier où les marchandises entrent et sortent sans droits ni taxes tant " +
      "qu'elles ne sont pas mises à la consommation sur le marché local. Conçu pour les " +
      'activités de transformation destinées à la réexportation.',

    ideTerme: 'IDE — Investissement direct étranger',
    ideDefinition:
      "Prise de participation durable d'un investisseur non-résident dans une entreprise " +
      "résidente, avec intention d'influer sur sa gestion. Se distingue de l'investissement " +
      'de portefeuille, purement financier et liquide.',

    valeurAjouteeTerme: 'Valeur ajoutée sectorielle',
    valeurAjouteeDefinition:
      'Richesse créée par un secteur : sa production diminuée des consommations ' +
      "intermédiaires. Exprimée en pourcentage du PIB, elle mesure le poids réel du secteur " +
      "dans l'économie.",
    valeurAjouteeNuance:
      "À ne pas confondre avec le chiffre d'affaires : deux secteurs au chiffre d'affaires " +
      'identique peuvent créer une richesse très différente.',

    evpTerme: 'EVP — Équivalent vingt pieds',
    evpDefinition:
      'Unité de mesure du trafic conteneurisé (TEU en anglais). Un conteneur standard de ' +
      '20 pieds vaut 1 EVP, un conteneur de 40 pieds en vaut 2. Sert à comparer ' +
      "l'activité des ports indépendamment de la taille des boîtes.",

    r2Terme: 'Coefficient de détermination (R²)',
    r2Definition:
      "Mesure de la qualité d'ajustement d'un modèle à des données observées, entre 0 et 1. " +
      'Plus il approche de 1, mieux le modèle explique la série historique.',
    r2Nuance:
      'Un R² élevé ne garantit pas que la projection se réalisera : il dit que le modèle ' +
      "colle au passé, pas qu'il prédit l'avenir. Les séries dont l'ajustement est " +
      'insuffisant ne reçoivent aucune estimation dans nos rapports.',

    observeeEstimeeTerme: 'Donnée observée / donnée estimée',
    observeeEstimeeDefinition:
      'Une donnée observée a été publiée par une source officielle pour une année donnée. ' +
      "Une donnée estimée est calculée par extrapolation de l'historique.",
    observeeEstimeeNuance:
      'Nos rapports et cette interface ne les présentent jamais de la même façon : couleur, ' +
      'tracé et mention diffèrent. Présenter une extrapolation comme un fait serait la ' +
      'faute la plus grave que puisse commettre ce service.',

    balanceTerme: 'Balance commerciale sectorielle',
    balanceDefinition:
      "Différence entre les exportations et les importations d'un secteur sur une période. " +
      'Un solde positif signale un secteur exportateur net.',

    capaciteTerme: 'Capacité installée',
    capaciteDefinition:
      "Puissance maximale qu'un parc de production peut délivrer, exprimée en mégawatts " +
      "(MW). Elle ne dit rien de l'énergie réellement produite, qui dépend du facteur de " +
      'charge.',
    capaciteNuance:
      "Une centrale solaire de 10 MW ne produit pas 10 MW en continu : l'ensoleillement " +
      'conditionne sa production réelle.',

    facteurChargeTerme: 'Facteur de charge',
    facteurChargeDefinition:
      "Rapport entre l'énergie effectivement produite sur une période et celle qu'une " +
      'installation aurait produite en fonctionnant à pleine puissance sur la même durée.',

    nonDoubleImpositionTerme: 'Convention de non-double imposition',
    nonDoubleImpositionDefinition:
      "Accord bilatéral qui répartit le droit d'imposer entre deux États, afin qu'un même " +
      'revenu ne soit pas taxé deux fois. Détermine notamment le traitement des dividendes ' +
      'rapatriés.',

    dueDiligenceTerme: 'Due diligence',
    dueDiligenceDefinition:
      'Ensemble des vérifications menées avant un investissement : situation juridique, ' +
      'comptable, fiscale, sociale et environnementale de la cible.',
    dueDiligenceNuance:
      'Un rapport sectoriel documente un marché ; il ne remplace en aucun cas une due ' +
      'diligence, qui porte sur une entreprise précise.',
  },

  mesRapports: {
    titre: 'Mes rapports',
    accroche:
      'Vos commandes réglées et les documents livrés. Un rapport reste téléchargeable ' +
      'indéfiniment.',
    aucuneCommande: 'Aucune commande pour le moment',
    aucuneCommandeTexte:
      'Les rapports que vous commandez apparaîtront ici, avec leur lien de téléchargement.',
    parcourirCatalogue: 'Parcourir le catalogue',
    commandeDu: (date: string) => `Commande du ${date}`,
    demonstration: 'démonstration',
    pages: (nombre: number) => `${nombre} pages`,
    livreLe: (date: string) => `Livré le ${date}`,
    telecharger: 'Télécharger',
    aProduire: 'Rapport à produire',
    relancer: 'Relancer',
  },

  generation: {
    qualiteTitre: (nombre: number) =>
      `${nombre} section(s) à relire avant diffusion`,
    qualiteTexte:
      "Un second modèle a relu le rapport et signale des chiffres qu'il n'a pas " +
      'retrouvés dans les données du secteur. Le document reste livrable ; ' +
      "corrigez-le depuis l'écran d'édition si le signalement est fondé.",
    qualiteModele: (modele: string) => `Relecture par ${modele}`,
    echecTitre: "La génération n'a pas abouti",
    echecDefaut: 'Une erreur est survenue pendant la fabrication du rapport.',
    echecPaiement:
      'Votre paiement reste enregistré. Relancer la génération ne vous sera pas refacturé.',
    relancerGeneration: 'Relancer la génération',

    pretTitre: 'Votre rapport est prêt',
    pretPages: (pages: number, secondes: number) =>
      `${pages} pages, générées en ${secondes} secondes.`,
    pretSansPages: (secondes: number) => `Généré en ${secondes} secondes.`,
    pretDisponible: 'Il reste disponible dans « Mes rapports ».',
    sectionsManquantes: (nombre: number) =>
      `${nombre} section(s) rédigée(s) n'ont pas pu être produites. Le rapport reste ` +
      'complet pour ses parties chiffrées et peut être relancé.',
    telechargerRapport: 'Télécharger le rapport',

    enCoursTitre: 'Rédaction de votre rapport sectoriel',
    enCoursTexte: (secondes: number) =>
      'Données officielles, projections et analyses sont assemblées en un document ' +
      `unique. Comptez environ ${secondes} secondes.`,
    etapeParDefaut: 'Préparation des données sectorielles',
    avancement: (pourcent: number, secondes: number) => `${pourcent} % · ${secondes} s`,
    neFermezPas: 'Ne fermez pas cette page : le suivi de la génération y est rattaché.',
  },

  paiement: {
    langueRapportTitre: 'Langue du rapport',
    langueRapportAide:
      'Le document PDF sera intégralement rédigé et mis en page dans cette langue. ' +
      "Ce choix est enregistré avec la commande : une relance produira le même document.",
    langueFrancais: 'Français',
    langueAnglais: 'English',
    retourCatalogue: 'Retour au catalogue',
    etapePaiement: 'Paiement',
    etapeGeneration: 'Génération',
    etapeLivraison: 'Téléchargement',

    reglementTitre: 'Règlement',
    reglementTexte:
      'Le montant est calculé par le serveur à partir du tarif du catalogue. ' +
      "Il n'est jamais transmis depuis votre navigateur.",
    identifiantsJamais:
      'Vos identifiants de paiement ne transitent jamais par cette plateforme.',
    secteurIntrouvable: 'Secteur introuvable.',

    paiementConfirme: 'Paiement confirmé',
    commandeConfirmee: 'Commande confirmée',
    redactionDemarre: (montant: string) => `${montant} — la rédaction démarre.`,
    paiementInterrompu: 'Paiement interrompu',
    commandeInterrompue: 'Commande interrompue',

    recapitulatif: 'Récapitulatif',
    descriptionLigne: (pages: number) =>
      `Rapport sectoriel · ${pages} pages minimum · format PDF`,
    sousTotal: 'Sous-total',
    fraisService: 'Frais de service',
    aucunFrais: 'Aucun',
    totalARegler: 'Total à régler',
    montantDebite: 'Montant débité par PayPal',
    montantDebiteTexte: (devise: string) =>
      "Le dinar tunisien n'est pas une devise acceptée : la transaction est présentée " +
      `en ${devise}.`,
    garantieLivraison: 'Rapport PDF livré immédiatement après validation',
    garantieRegeneration: 'Régénération gratuite en cas d’échec technique',
    garantieBancaire: 'Aucun identifiant bancaire conservé par la plateforme',
    argentReel: ' · argent réel',
    bacASable: ' · bac à sable',
    modeDemonstration: 'Mode démonstration',
    consulterApercu: "Consulter l'aperçu gratuit",

    demoTitre: 'Mode démonstration — aucun paiement',
    demoAvant:
      "Aucun montant n'est débité et aucun prestataire n'est sollicité. La commande est " +
      "enregistrée puis comptabilisée séparément du chiffre d'affaires réel. Le règlement " +
      "PayPal s'active en renseignant",
    demoEt: 'et',
    demoApres: 'côté serveur.',
    adresseFacturation: 'Adresse de facturation',
    adresseFacturationAide: 'Figure sur le justificatif de commande.',
    nomFacturation: 'Nom ou raison sociale (facultatif)',
    nomFacturationExemple: 'Prénom Nom / Société',
    validerCommande: 'Valider la commande',
    aucunIdentifiantDemande: 'Aucun identifiant de paiement ne vous est demandé.',
    emailInvalide: 'Saisissez une adresse email valide pour recevoir le justificatif.',
    validationEchouee: 'La validation a échoué.',
  },

  paypal: {
    chargement: 'Chargement de PayPal…',
    fenetreBloquee:
      "La fenêtre PayPal n'a pas pu s'ouvrir. Autorisez les fenêtres surgissantes pour " +
      'ce site, puis réessayez.',
    sessionExpiree: 'Votre session a expiré. Reconnectez-vous puis relancez le paiement.',
    echecDefaut: 'Le paiement a échoué.',
    testTitre: 'Environnement de test.',
    testTexte:
      'Aucun montant réel ne sera débité. Cliquez sur « Connexion » dans la fenêtre ' +
      'PayPal et utilisez un compte acheteur sandbox (developer.paypal.com → Testing ' +
      "Tools → Sandbox accounts) : un compte PayPal réel n'existe pas dans cet " +
      'environnement.',
  },

  profil: {
    verifie: 'Vérifié',
    rapportsCommandes: 'Rapports commandés',
    livres: (nombre: string) => `${nombre} livré(s)`,
    totalRegle: 'Total réglé',
    derniereConnexion: 'Dernière connexion',
    membreDepuis: (date: string) => `Membre depuis le ${date}`,

    infosTitre: 'Informations personnelles',
    infosDescription: 'Ces informations figurent sur vos commandes et vos rapports.',
    prenom: 'Prénom',
    nom: 'Nom',
    entreprise: 'Entreprise',
    pays: 'Pays',
    telephone: 'Téléphone',
    telephoneAide: "Utilisé uniquement pour vous joindre au sujet d'une commande.",
    email: 'Adresse email',
    emailAide:
      "L'adresse identifie votre compte et ne peut pas être modifiée ici. Contactez le " +
      'support pour en changer.',
    enregistrer: 'Enregistrer les modifications',
    profilMisAJour: 'Profil mis à jour',
    enregistrementImpossible: 'Enregistrement impossible',

    motDePasseTitre: 'Mot de passe',
    motDePasseDescription:
      'Le mot de passe actuel est exigé : sans lui, une session laissée ouverte suffirait ' +
      'à verrouiller le compte de son titulaire.',
    motDePasseActuel: 'Mot de passe actuel',
    nouveauMotDePasse: 'Nouveau mot de passe',
    confirmation: 'Confirmation',
    forceFaible: 'Faible',
    forceCorrecte: 'Correct',
    forceSolide: 'Solide',
    robustesseAvant: 'Robustesse :',
    robustesseApres:
      '— 8 caractères minimum ; au-delà de 12, avec chiffres et symboles, la résistance ' +
      'augmente nettement.',
    changerMotDePasse: 'Changer le mot de passe',
    motDePasseMisAJour: 'Mot de passe mis à jour',
    saisiesDifferentes: 'Les deux saisies ne correspondent pas.',
    motDePasseTropCourt: 'Le mot de passe doit contenir au moins 8 caractères.',

    securiteTitre: 'Sécurité du compte',
    securiteBcrypt:
      "Votre mot de passe est conservé sous forme d'empreinte bcrypt. Personne, y compris " +
      "l'équipe Tunisia Invest, ne peut le lire.",
    securitePaiement:
      "Aucun identifiant de paiement n'est stocké : les règlements se font sur le domaine " +
      "de PayPal, qui ne nous transmet que l'adresse du compte payeur.",
    securiteRoles:
      'Vos droits sont relus en base à chaque requête : une modification de rôle prend ' +
      "effet immédiatement, sans attendre l'expiration de votre session.",
  },

  parametres: {
    titre: 'Paramètres',
    accroche: "Réglages d'affichage propres à cet appareil, et état de votre compte.",

    apparenceTitre: 'Apparence',
    apparenceDescription:
      'Le thème est mémorisé sur ce navigateur. Par défaut, il suit le réglage de votre ' +
      'système.',
    themeClair: 'Clair',
    themeSombre: 'Sombre',
    langueTitre: 'Langue',
    langueDescription:
      "La langue de l'interface est mémorisée sur ce navigateur. Les rapports PDF sont " +
      'produits en français, quelle que soit la langue choisie ici.',
    affichageCompact: 'Affichage compact',
    affichageCompactDescription:
      "Réduit les espacements des tableaux et des listes pour voir plus de lignes à l'écran.",

    rapportsTitre: 'Rapports et notifications',
    ouvrirPdf: 'Ouvrir le PDF automatiquement',
    ouvrirPdfDescription:
      "Dès qu'une génération aboutit, le rapport s'ouvre dans un nouvel onglet.",
    afficherEstimations: 'Afficher les estimations',
    afficherEstimationsDescription:
      'Présente les projections 2025-2028 à côté des données publiées. Elles restent ' +
      'visuellement distinctes : jamais confondues avec un chiffre officiel.',
    notifications: "Notifications à l'écran",
    notificationsDescription:
      "Confirmations de paiement, fin de génération et messages d'erreur.",

    compteTitre: 'Compte',
    adresseEmail: 'Adresse email',
    role: 'Rôle',
    reinitialiser: 'Réinitialiser les préférences',
    preferencesReinitialisees: 'Préférences réinitialisées',

    donneesTitre: 'Données et confidentialité',
    donneesLocal:
      'Les réglages de cette page ne quittent pas ce navigateur : ils sont stockés ' +
      'localement, jamais transmis au serveur ni rattachés à votre compte.',
    donneesPaiement:
      "Pour chaque règlement, seules l'adresse du compte payeur et la référence de " +
      'transaction sont conservées — la trace comptable, rien de plus.',
    donneesConservation:
      'Les rapports que vous achetez restent accessibles dans « Mes rapports » sans ' +
      'limite de durée.',

    servicesTitre: 'État des services',
    servicesDescription: 'Paiement et moteur de rédaction.',
    servicePaiement: 'Paiement',
    serviceMode: 'Mode',
    serviceEnvironnement: 'Environnement',
    serviceArgentReel: ' · argent réel',
    serviceTest: ' · test',
    serviceIdentifiants: 'Identifiants',
    serviceConfigures: 'configurés',
    serviceAbsents: 'absents',
    serviceMoteur: 'Moteur de rapports',
    serviceDisponibilite: 'Disponibilité',
    serviceInjoignable: 'injoignable',
    serviceEnLigne: 'en ligne',
    serviceRedaction: 'Rédaction',
    serviceActive: 'active',
    serviceCleAbsente: 'clé absente',
    serviceModele: 'Modèle',
    serviceGenerations: 'Générations en cours',
    actualiser: 'Actualiser',
  },

  analyse: {
    surtitre: 'Analyse comparative',
    titre: 'Comparateur de secteurs',
    accroche:
      'Les six secteurs face à face, sur sept indicateurs agrégés. Cet écran est gratuit ' +
      "et sans compte : il sert à situer un secteur avant de commander l'analyse " +
      'détaillée.',

    indicateurPib: 'Contribution au PIB',
    indicateurPibCourt: 'PIB',
    indicateurCroissance: 'Croissance annuelle',
    indicateurCroissanceCourt: 'Croissance',
    indicateurEmplois: 'Emplois générés',
    indicateurEmploisCourt: 'Emplois',
    indicateurEmploisUnite: 'postes',
    indicateurExportations: 'Exportations',
    indicateurExportationsCourt: 'Export',
    indicateurEntreprises: 'Entreprises actives',
    indicateurEntreprisesCourt: 'Entreprises',
    indicateurEntreprisesUnite: 'unités',
    indicateurIde: 'Investissements directs étrangers',
    indicateurIdeCourt: 'IDE',
    indicateurPartMarche: 'Part de marché régionale',
    indicateurPartMarcheCourt: 'Part rég.',

    classementTitre: 'Classement par indicateur',
    classementDescription: "Choisissez l'indicateur qui compte pour votre projet.",
    profilTitre: 'Profil comparé',
    profilDescription:
      'Chaque axe est ramené à 100 pour le secteur le mieux placé. Le radar montre des ' +
      'positions relatives, pas des valeurs absolues — celles-ci figurent dans le tableau ' +
      'ci-dessous.',
    valeursTitre: 'Valeurs détaillées',
    colonneSecteur: 'Secteur',
    boutonRapport: 'Rapport',
    noteAgregats:
      'Ces indicateurs agrégés situent un ordre de grandeur. Les séries annuelles ' +
      'détaillées, leurs sources et les perspectives 2025-2028 figurent dans le rapport ' +
      'sectoriel.',
    nonContractuel: 'Données non contractuelles',
  },

  regional: {
    indicateursComparables: (nombre: number) => `${nombre} indicateur(s) comparable(s)`,
    titre: 'Tunisie, Maroc et Égypte',
    accroche:
      "Un investisseur qui étudie l'Afrique du Nord ne choisit pas un pays dans l'absolu : " +
      'il arbitre entre plusieurs. Ces indicateurs situent la Tunisie face à ses deux ' +
      'voisins les plus comparables.',
    sourceAvant: 'Toutes les valeurs proviennent des',
    sourceFort: 'World Development Indicators de la Banque mondiale',
    sourceApres:
      ' (licence CC BY 4.0), reproduites sans retraitement. Chaque pays est présenté à sa ' +
      "dernière année publiée — elles peuvent différer d'un pays à l'autre, la source ne " +
      "les publiant pas au même rythme. Aucune valeur n'est estimée ni interpolée.",
    nombreIndicateurs: (nombre: number) => `${nombre} indicateurs`,
    aucunComparatif: 'Aucun comparatif renseigné',
    aucunComparatifAvant: 'Importez les indicateurs officiels avec',
    aucunComparatifApres: 'ou saisissez-les depuis le panneau de contrôle.',
    paysTunisie: 'Tunisie',
    paysMaroc: 'Maroc',
    paysEgypte: 'Égypte',
    nonDisponible: 'n.d.',
  },

  admin: {
    rapportsTitre: 'Rapports produits',
    rapportsAccroche:
      'Documents générés par le moteur. Un rapport dont la rédaction a échoué peut être ' +
      'corrigé à la main puis reconstruit, sans nouveau paiement pour le client.',
    fichiersDisponibles: 'Fichiers disponibles',
    sansFichier: (nombre: number) => `${nombre} sans fichier`,
    tousLivres: 'tous livrés',
    volumeTotal: 'Volume total',
    historique: 'Historique',
    rechercherRapport: 'Rechercher un rapport…',
    colonneTitre: 'Titre',
    colonneGenereLe: 'Généré le',
    colonnePages: 'Pages',
    colonneTaille: 'Taille',
    colonneStatut: 'Statut',
    aucunRapportCorrespond: 'Aucun rapport ne correspond.',

    comptesTitre: 'Comptes',
    comptesAccroche:
      'Un rôle prend effet immédiatement : il est relu en base à chaque requête, sans ' +
      "attendre l'expiration de la session concernée.",
    nombreComptes: 'Comptes',
    administrateurs: 'Administrateurs',
    comptesActifs: 'Comptes actifs',
    desactives: (nombre: number) => `${nombre} désactivé(s)`,
    rechercherCompte: 'Nom, email, entreprise…',
    colonneCompte: 'Compte',
    colonneEntreprise: 'Entreprise',
    colonnePays: 'Pays',
    colonneInscritLe: 'Inscrit le',
    colonneDerniereConnexion: 'Dernière connexion',
    colonneRole: 'Rôle',
    aucunCompteCorrespond: 'Aucun compte ne correspond à ces critères.',
    jamais: 'jamais',
    desactive: 'désactivé',
    promouvoir: 'Promouvoir',
    retrograder: 'Rétrograder',
    roleChange: (qui: string, role: string) => `${qui} est désormais ${role}`,
    changementRefuse: 'Changement refusé',
    filtreTous: 'Tous',
    filtreClients: 'Clients',
    filtreAdministrateurs: 'Administrateurs',

    secteursTitre: 'Secteurs',
    secteursAccroche:
      'Tarif, description et visibilité au catalogue. Un secteur masqué disparaît du ' +
      "catalogue public mais reste téléchargeable par ceux qui l'ont acheté.",
    actifsSurTotal: (actifs: number, total: number) => `${actifs} / ${total} actif(s)`,
    catalogue: 'Catalogue',
    rechercherSecteur: 'Rechercher un secteur…',
    colonneDescription: 'Description',
    colonnePrix: 'Prix',
    colonneMiseAJour: 'Mise à jour',
    colonneEtat: 'État',
    aucunSecteurCorrespond: 'Aucun secteur ne correspond à cette recherche.',
    aucunSecteur: 'Aucun secteur.',
    nomSecteur: 'Nom du secteur',
    description: 'Description',
    prixRapport: 'Prix du rapport',
    actif: 'Actif',
    masque: 'Masqué',
    enregistrer: 'Enregistrer',
    annulerEdition: "Annuler l'édition",
    modifier: 'Modifier',
    donnees: 'Données',
    secteurMisAJour: 'Secteur mis à jour',
    enregistrementImpossible: 'Enregistrement impossible',

    sectionIntroduction: 'Présentation générale du secteur',
    sectionTendances: 'Analyse des tendances',
    sectionOpportunites: 'Opportunités identifiées',
    sectionRisques: 'Analyse des risques',
    sectionBenchmarking: 'Benchmarking régional',
    sectionRecommandations: 'Recommandations investisseur',
    sectionPerspectives: 'Perspectives 2025-2028',

    retourRapports: 'Retour aux rapports',
    rapportInaccessible: 'Rapport inaccessible',
    rapportIntrouvable: 'Rapport introuvable.',
    genereLe: (date: string, pages: string) =>
      `Généré le ${date} · ${pages} pages. Les sections chiffrées sont reconstruites ` +
      'automatiquement depuis la base.',
    sectionsVides: (nombre: number) => `${nombre} section(s) vide(s)`,
    pdfActuel: 'PDF actuel',
    mots: (nombre: number) => `${nombre} mot${nombre > 1 ? 's' : ''}`,
    sectionVidePlaceholder: 'Section vide — elle apparaîtra comme indisponible dans le PDF.',
    enregistrerReconstruire: 'Enregistrer et reconstruire le PDF',
    annuler: 'Annuler',
    aucunAppelRedaction:
      'Aucun appel au service de rédaction : vos corrections ne seront pas écrasées.',
    pdfReconstruit: 'PDF reconstruit',
    correctionsDansDocument: 'Les corrections sont dans le document.',
    reconstructionImpossible: 'Reconstruction impossible',

    retourSecteurs: 'Retour aux secteurs',
    resume: (series: string, zones: number, acteurs: number, textes: number) =>
      `${series} séries · ${zones} zones · ${acteurs} acteurs · ${textes} textes réglementaires`,
    recalculerProjections: 'Recalculer les projections',
    regenererRapport: 'Régénérer le rapport',
    rapportRegenere: 'Rapport régénéré —',
    ouvrirDocument: 'ouvrir le document',
    supprimer: 'Supprimer',

    chiffresCles: 'Chiffres clés',
    champPib: 'Contribution au PIB (%)',
    champCroissance: 'Croissance annuelle (%)',
    champEmplois: 'Emplois générés',
    champExportations: 'Exportations (MDT)',
    champEntreprises: 'Entreprises actives',
    champIde: 'Investissements IDE (MDT)',
    champPartMarche: 'Part de marché régionale (%)',
    enregistrerChiffres: 'Enregistrer les chiffres clés',

    zonesTitre: 'Zones géographiques et zones franches',
    zonesVide: 'Aucune zone renseignée.',
    ajouterZone: 'Ajouter la zone',
    descriptionZone: 'Description de la zone',
    acteursTitre: 'Acteurs principaux',
    acteursVide: 'Aucun acteur renseigné.',
    ajouterActeur: "Ajouter l'acteur",
    cadreTitre: 'Cadre réglementaire et fiscal',
    cadreVide: 'Aucun texte renseigné.',
    ajouterTexte: 'Ajouter le texte',
    descriptionTexte: 'Description du texte',

    champNom: 'Nom',
    champType: 'Type',
    champGouvernorat: 'Gouvernorat',
    champSuperficie: 'Superficie (km²)',
    champRole: 'Rôle',
    champSiteWeb: 'Site web',
    champCa: 'CA (MDT)',
    champEmployes: 'Employés',
    champTitre: 'Titre',
    champAnnee: 'Année',
    champDescription: 'Description',

    seriesTitre: 'Séries statistiques',
    colonneIndicateur: 'Indicateur',
    colonneUnite: 'Unité',
    colonneEstimation: '2028 (est.)',
    colonneMethode: 'Méthode',
    aucuneSerie: 'Aucune série pour ce secteur.',
    seriesTronquees: (total: string) => `40 premières séries affichées sur ${total}.`,

    chiffresEnregistres: 'Chiffres clés enregistrés',
    elementSupprime: 'Élément supprimé',
    suppressionImpossible: 'Suppression impossible',
    projectionsRecalculees: 'Projections recalculées',
    recalculImpossible: 'Recalcul impossible',
    rapportRegenereToast: 'Rapport régénéré',
    regenerationImpossible: 'Régénération impossible',
    ajoute: 'Ajouté',
    ajoutImpossible: 'Ajout impossible',
    erreurInconnue: 'Erreur inconnue',

    comparatifTitre: 'Comparatif régional',
    comparatifRenseignes: (renseignes: number, total: number) =>
      `${renseignes} / ${total} renseigné(s)`,
    comparatifAvant:
      "Ces cases sont volontairement vides. Tant qu'une valeur manque, le rapport traite " +
      "la comparaison en termes qualitatifs plutôt que d'avancer un chiffre étranger non " +
      'sourcé. ',
    comparatifFort: 'Renseignez uniquement des valeurs vérifiables',
    comparatifApres:
      ', avec leur source — elles apparaîtront dans le graphique comparatif du PDF.',
    comparatifAnnee: 'Année',
    comparatifSource: 'Source',
    comparatifSourcePlaceholder: 'Organisme, année',
    indicateurEnregistre: 'Indicateur enregistré',

    accesAdministrateur: 'Accès administrateur',
    documentReconstruit: 'Le document a été reconstruit avec vos corrections.',
    ouvrirNouveauPdf: 'Ouvrir le nouveau PDF',

    nomAnglais: 'Nom (anglais)',
    descriptionAnglaise: 'Description (anglais)',
    traductionAbsente: 'non traduit',
    legendeReel: "Chiffre d'affaires",
    legendeSimule: 'Commandes simulées',
    corriger: 'Corriger',
    statutGenere: 'généré',
    statutEnAttente: 'en attente',
    statutErreur: 'erreur',
    statutInconnu: 'inconnu',
    serieObservee: 'Donnée observée',
    serieEstimation: 'Estimation',
    serieDemandes: 'Demandes',
    titreRapport: (secteur: string) => `Rapport Sectoriel — ${secteur}`,
    tableauBordTitre: 'Tableau de bord',
    tableauBordAccroche: 'Activité commerciale et rapports produits.',
    modeDemonstration: 'Mode démonstration',
    aucuneVenteReelle:
      'Aucune vente réelle enregistrée : les montants ci-dessous correspondent à des ' +
      'commandes validées sans débit.',
    rapportsVendus: 'Rapports vendus',
    dontDemonstration: (nombre: string) => `dont ${nombre} en démonstration`,
    montantCommandes: 'Montant des commandes',
    chiffreAffaires: "Chiffre d'affaires",
    simulesExclus: (montant: string) => `${montant} simulés, exclus`,
    rapportsGeneres: 'Rapports générés',
    secteurPlusDemande: 'Secteur le plus demandé',
    ventesParSecteur: 'Ventes par secteur',
    partChaqueSecteur: 'Part de chaque secteur',
    toutesVentes: 'toutes ventes',
    detailParSecteur: 'Détail par secteur',
    colonneSecteur: 'Secteur',
    colonneVentes: 'Ventes',
    colonneRevenus: 'Revenus',
    colonneRapports: 'Rapports',
    derniersRapports: 'Derniers rapports produits',
    ouvrir: 'Ouvrir',
    pages: (nombre: number) => `${nombre} pages`,
    aucunRapportProduit: 'Aucun rapport produit pour le moment.',
  },

  pied: {
    presentation:
      "Rapports sectoriels sur l'économie tunisienne, construits à partir des données " +
      "publiées par les organismes officiels et enrichis d'analyses rédigées à partir " +
      'de ces mêmes chiffres.',
    nousContacter: 'Nous contacter',
    colonnePlateforme: 'Plateforme',
    colonneAPropos: 'À propos',
    colonneLegal: 'Informations légales',
    quiSommesNous: 'Qui sommes-nous',
    notreMethode: 'Notre méthode',
    sourcesDonnees: 'Sources de données',
    mentionsLegales: 'Mentions légales',
    avertissementRisques: 'Avertissement sur les risques',
    donneesPersonnelles: 'Données personnelles',
    avertissementTitre: 'Avertissement.',
    avertissementTexte:
      "Les rapports proposés sur cette plateforme sont des documents d'information " +
      "économique. Ils ne constituent ni un conseil en investissement, ni une " +
      "recommandation d'achat ou de vente, ni une garantie de résultat. Les " +
      'projections qu\'ils contiennent sont des estimations calculées, signalées ' +
      'comme telles, et ne préjugent pas de l\'évolution réelle des marchés. ' +
      'Tout investissement comporte un risque de perte en capital.',
    avertissementLien: "Lire l'avertissement complet",
    copyright: (annee: number, nom: string) => `© ${annee} ${nom}. Tous droits réservés.`,
  },
} as const;

/**
 * Remplace chaque chaîne littérale par `string`, en conservant l'arborescence
 * des clés et la signature des fonctions.
 *
 * Sans cette étape, le `as const` ci-dessus figerait chaque valeur à son texte
 * français exact : le type attendu pour `commun.fermer` serait la chaîne
 * « Fermer » elle-même, et « Close » serait refusé. On veut l'inverse — les
 * CLÉS imposées, les VALEURS libres.
 */
type Elargi<T> =
  T extends (...args: infer Args) => infer Retour ? (...args: Args) => Retour
  : T extends string ? string
  : { [K in keyof T]: Elargi<T[K]> };

/** Forme que toute langue doit respecter. */
export type Dictionnaire = Elargi<typeof fr>;
