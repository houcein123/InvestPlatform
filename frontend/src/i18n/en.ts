/* ==========================================================================
   English dictionary.
   --------------------------------------------------------------------------
   Typé d'après `Dictionnaire` : une clé oubliée ou mal nommée est refusée à la
   compilation. C'est la raison d'être de l'annotation ci-dessous — sans elle,
   TypeScript accepterait un objet incomplet et la page anglaise afficherait du
   français par endroits, sans que rien ne le signale.

   Registre : l'anglais d'un document d'analyse économique, pas d'une brochure
   commerciale. Le lecteur visé est un investisseur institutionnel ou un
   dirigeant qui compare des marchés — il attend de la précision, pas de
   l'enthousiasme.
   ========================================================================== */

import type { Dictionnaire } from './fr';

export const en: Dictionnaire = {
  metaLangue: {
    nom: 'English',
    court: 'EN',
    codeHtml: 'en',
    titrePage: 'Tunisia Invest — Sector Reports',
    descriptionPage:
      'Sector reports for foreign investors: official data, analysis and outlook across ' +
      'six key sectors of the Tunisian economy.',
  },

  commun: {
    ouvrirNavigation: 'Open navigation',
    emailExemple: 'you@example.com',
    chargement: 'Loading…',
    erreur: 'Something went wrong',
    reessayer: 'Try again',
    annuler: 'Cancel',
    fermer: 'Close',
    enregistrer: 'Save',
    seConnecter: 'Sign in',
    seDeconnecter: 'Sign out',
    creerCompte: 'Create an account',
    changerLangue: 'Change language',
    themeClair: 'Switch to light theme',
    themeSombre: 'Switch to dark theme',
  },

  role: {
    administrateur: 'Administrator',
    client: 'Client',
  },

  nav: {
    principale: 'Main navigation',
    catalogue: 'Catalogue',
    catalogueDetail: 'All six sectors and their reports',
    mesRapports: 'My reports',
    mesRapportsDetail: 'Completed orders and delivered documents',
    analyse: 'Analysis',
    comparateur: 'Sector comparison',
    comparateurDetail: 'All six sectors side by side, across seven indicators',
    regional: 'Regional benchmark',
    regionalDetail: 'Tunisia, Morocco and Egypt on official data',
    glossaire: 'Glossary',
    glossaireDetail: 'Key terms for investing in Tunisia',
    administration: 'Administration',
    pilotage: 'Overview',
    pilotageDetail: 'Sales, revenue and reports produced',
    secteurs: 'Sectors',
    secteursDetail: 'Pricing, visibility and sector data',
    rapports: 'Reports',
    rapportsDetail: 'Generated documents and corrections',
    comptes: 'Accounts',
    comptesDetail: 'User roles and access',
    compte: 'Account',
    profil: 'Profile',
    profilDetail: 'Personal details and password',
    parametres: 'Settings',
    parametresDetail: 'Theme, preferences and service status',
  },

  connexion: {
    titreConnexion: 'Sign in',
    titreInscription: 'Create an account',
    accrocheConnexion: 'Access your reports and your account area.',
    accrocheInscription: 'Keep your orders and your reports in one place.',
    prenom: 'First name',
    nom: 'Last name',
    email: 'Email address',
    motDePasse: 'Password',
    longueurMinimale: '8 characters minimum.',
    entreprise: 'Company (optional)',
    pays: 'Country (optional)',
    boutonConnexion: 'Sign in',
    boutonInscription: 'Create my account',
    pasDeCompte: 'No account yet?',
    dejaInscrit: 'Already registered?',
    bascculerVersInscription: 'Create an account',
    basculerVersConnexion: 'Sign in',
    bienvenue: (qui: string) => `Welcome, ${qui}`,
    echec: 'Sign-in failed.',
  },

  catalogue: {
    surtitre: 'Sector reports — Tunisia',
    titre: 'Six sectors, one evidence-based reading of the Tunisian market.',
    accroche:
      'Each report brings together the figures published by official sources, their ' +
      'projected outlook and an analysis written from those same figures. No number ' +
      'appears without its source.',
    argumentDonnees: 'Official data',
    argumentDonneesTexte:
      'Series from the National Institute of Statistics, imported and traceable back to their source.',
    argumentPerspectives: 'Quantified outlook',
    argumentPerspectivesTexte:
      'Calculated 2025-2028 estimates, presented as such and never conflated with published data.',
    argumentLivraison: 'Immediate delivery',
    argumentLivraisonTexte:
      'A PDF report of at least 14 pages, generated and downloadable as soon as payment clears.',
    sectionTitre: 'Catalogue',
    sectionAccroche:
      'Read the first two pages of any report free of charge before you order.',
    erreurTitre: 'The catalogue could not be loaded.',
  },

  carteSecteur: {
    pages: (nombre: number) => `${nombre} pages`,
    misAJourLe: (date: string) => `Updated ${date}`,
    debite: (montant: string) => `${montant} charged`,
    apercu: 'Preview',
    commander: 'Order',
  },

  risques: {
    surtitre: 'Regulatory information',
    titre: 'Risk disclosure',
    accroche: 'To be read before making any use of the reports offered on this platform.',
    encadre:
      'Tunisia Invest reports are information documents. They constitute neither ' +
      'investment advice, nor a recommendation, nor a guarantee of results. All ' +
      'investment carries a risk of capital loss.',
    derniereMiseAJour: (date: string) => `This disclosure was last updated on ${date}.`,

    natureTitre: '1. Nature of the information provided',
    natureP1:
      'The sector reports published on this platform are general economic information ' +
      'documents. They do not constitute investment advice, a personalised ' +
      'recommendation, a solicitation to buy or sell, or an offer of a regulated ' +
      'financial service.',
    natureP2:
      'The publisher assesses neither your financial situation, nor your objectives, nor ' +
      'your investment horizon, nor your risk tolerance. Nothing in these reports should ' +
      'be understood as an inducement to carry out any particular transaction.',

    perteTitre: '2. Risk of capital loss',
    perteP1:
      'All investment carries a risk of loss, up to and including the entire amount ' +
      'committed. The past performance of a sector does not predict its future ' +
      'performance.',
    perteP2:
      'Direct investment abroad further exposes you to specific risks: changes to the ' +
      'regulatory and tax framework, exchange-rate movements, currency controls or ' +
      'restrictions on repatriating capital, political risk, counterparty risk and ' +
      'liquidity risk.',

    projectionsTitre: '3. Status of projections',
    projectionsP1:
      'The figures shown for the years 2025 to 2028 are ESTIMATES obtained by ' +
      'statistical extrapolation from historical series. They are consistently flagged ' +
      'as such, both in the interface and in the PDF documents, and must never be read ' +
      'as published data.',
    projectionsP2:
      'A series whose statistical fit is judged insufficient receives no estimate at all: ' +
      'the absence of a projection is a result, not an omission.',

    sourcesTitre: '4. Sources and accuracy',
    sourcesP1:
      'The figures come from Tunisian public bodies and are reproduced as published. The ' +
      'publisher guarantees neither their completeness, nor their currency, nor the ' +
      'absence of error at source, and cannot be held liable for any decision based on ' +
      'this information.',
    sourcesP2:
      'The written sections of the reports are produced from the data set of the relevant ' +
      'sector alone. The method used is described explicitly in the “Sources and ' +
      'methodology” section of each document.',

    conseilTitre: '5. Seeking professional advice',
    conseilP1:
      'Before making any investment decision in Tunisia, we recommend consulting locally ' +
      'established legal, tax and financial advisers, and carrying out the customary due ' +
      'diligence for the project under consideration.',
    conseilP2:
      'The reports on this platform are in no way a substitute for those steps.',
  },

  legal: {
    titre: 'Legal notice',
    accroche:
      'Information about the publisher of this service, its hosting and how data is ' +
      'processed.',
    aRenseigner: 'to be provided',
    manquantsTitre: (nombre: number) =>
      `${nombre} legal detail(s) missing`,
    manquantsAvant: 'These fields are empty in',
    manquantsApres:
      '. They were deliberately left blank: an invented company name or registration ' +
      'number would be indistinguishable from genuine details and would expose you to ' +
      'liability. Complete them before any public launch.',

    editeur: 'Service publisher',
    nomCommercial: 'Trading name',
    raisonSociale: 'Registered name',
    formeJuridique: 'Legal form',
    immatriculation: 'Registration number',
    capitalSocial: 'Share capital',
    siegeSocial: 'Registered office',
    directeurPublication: 'Publication director',
    contact: 'Contact',

    hebergement: 'Hosting',
    hebergeur: 'Host',
    adresse: 'Address',

    donneesTitre: 'Personal data',
    donneesCollecteesTitre: 'Data collected.',
    donneesCollecteesTexte:
      'When an account is created: email address, last name, first name, and optionally ' +
      'company, country and telephone. With each order: the sector purchased, the amount, ' +
      'the date, together with the payer account address and transaction reference passed ' +
      'on by the payment provider.',
    donneesJamaisTitre: 'What is never collected.',
    donneesJamaisTexte:
      'No card number, no banking credentials, no third-party service password. Payment ' +
      'takes place entirely on the payment provider’s own domain, and the provider never ' +
      'discloses its customers’ credentials to us.',
    donneesFinaliteTitre: 'Purpose.',
    donneesFinaliteTexte:
      'This data is used solely to fulfil the order, to give access to the reports ' +
      'purchased and to keep the service’s accounts. It is neither sold nor passed on for ' +
      'advertising purposes.',
    donneesDroitsTitre: 'Your rights.',
    donneesDroitsTexte:
      'You can view and edit your information from the “Profile” page. For any request to ' +
      'access, correct or delete your data, write to the contact address given above.',

    stockageTitre: 'Local storage',
    stockageIntro:
      'The service uses no advertising cookies and no third-party trackers. Only four ' +
      'items are kept in your browser:',
    stockageJeton: 'the session token, which keeps you signed in;',
    stockageTheme: 'the theme you chose, light or dark;',
    stockageLangue: 'the language you chose, French or English;',
    stockagePreferences: 'your display preferences, adjustable from “Settings”.',
    stockageConclusion:
      'These items stay on your device and are not passed to third parties. Signing out ' +
      'clears the session token.',
  },

  apropos: {
    surtitre: 'Who we are',
    titre:
      'Making the Tunisian economy legible to those considering investing in it.',
    accroche:
      'A foreign investor studying Tunisia runs into data scattered across several ' +
      'bodies, published on different schedules and rarely put in perspective. Tunisia ' +
      'Invest gathers those series, sets them out and comments on them, sector by sector, ' +
      'in a single document.',

    chiffreSecteurs: 'sectors covered',
    chiffreSections: 'sections per report',
    chiffrePages: 'pages per document',
    chiffreProfondeur: 'time span',

    methodeTitre: 'Our method',
    methodeAccroche:
      'The worth of an investment report lies in what can be checked. Every stage of how ' +
      'it is built is therefore designed so that a reader can trace any claim back to the ' +
      'figure behind it.',
    methodeCollecteTitre: 'Collecting published data',
    methodeCollecteTexte:
      'The statistical series come from Tunisian public bodies. They are imported as ' +
      'published, without reprocessing, and every indicator keeps a reference to its ' +
      'source.',
    methodeCalculTitre: 'Computing the outlook',
    methodeCalculTexte:
      'Two models compete on each series — ordinary least-squares linear regression and ' +
      'compound annual growth rate — and whichever fits the history best is kept. A series ' +
      'for which no model reaches a sufficient coefficient of determination receives no ' +
      'estimate at all.',
    methodeRedactionTitre: 'Writing anchored to the figures',
    methodeRedactionTexte:
      'The analysis sections are written from the sector’s data set alone, passed in full ' +
      'to the language model with the instruction to put forward no figure absent from ' +
      'that set. The method and the model used are described in the “Sources and ' +
      'methodology” section of every report.',
    methodeSeparationTitre: 'Keeping observed and estimated apart',
    methodeSeparationTexte:
      'Published data and calculated projections are never presented the same way, in the ' +
      'interface or in the PDF: distinct colours, a different line style, an explicit ' +
      'note. Presenting an extrapolation as a fact would be the gravest error this service ' +
      'could commit.',

    sourcesTitre: 'Data sources',
    sourcesAccroche:
      'The figures published in our reports come from Tunisian public bodies. We produce ' +
      'no primary data: our work is to gather, structure and put in perspective what has ' +
      'already been published.',
    siteOfficiel: 'Official website',

    limitesTitre: 'What our reports are not',
    limitesConseilFort: 'not investment advice',
    limitesConseilAvant: 'They are ',
    limitesConseilApres:
      '. We do not assess your situation, your objectives or your risk tolerance, and we ' +
      'recommend no transaction. A report documents a sector; the decision is yours.',
    limitesPrevisionsFort: 'not guaranteed forecasts',
    limitesPrevisionsApres:
      '. The 2025-2028 projections are statistical extrapolations from a history. They are ' +
      'useful for placing an order of magnitude, never for asserting what will happen.',
    limitesAuditFort: 'not audit documents',
    limitesAuditApres:
      '. They replace neither due diligence nor the opinion of legal or tax advisers ' +
      'established in Tunisia.',
  },

  contact: {
    titre: 'Contact us',
    accroche:
      'Pick the channel that matches your request: it will be handled by the right ' +
      'person, with no intermediate hand-off.',

    aucunCanalTitre: 'Contact details not provided',
    aucunCanalAvant: 'The contact addresses are empty in',
    aucunCanalApres:
      '. They were deliberately not invented: a fictitious address would send enquiries ' +
      'into the void. Fill them in before going live.',

    supportTitre: 'Customer support',
    supportTexte: 'Orders, downloading a report, questions about your account.',
    supportDelai: 'Reply within 1 working day',
    commercialTitre: 'Business enquiries',
    commercialTexte: 'Bespoke reports, multi-user access, partnerships.',
    commercialDelai: 'Reply within 2 working days',
    generalTitre: 'General enquiry',
    generalTexte: 'Method, sources, sector coverage, press.',
    generalDelai: 'Reply within 3 working days',
    aRenseigner: '— to be provided —',

    coordonnees: 'Contact details',
    adresseARenseigner: 'Address to be provided',
    telephoneARenseigner: 'Telephone to be provided',

    avantEcrireTitre: 'Before you write',
    avantEcrire1:
      'A report that was paid for but not delivered can be restarted from “My reports” ' +
      'on its own, with no further payment.',
    avantEcrire2:
      'The first two pages of every report can be read free of charge from the catalogue.',
    avantEcrire3:
      'For a question about an order, quote the transaction reference: it appears on the ' +
      'confirmation screen.',
  },

  glossaire: {
    surtitre: 'Resources',
    titre: 'Glossary',
    accroche: 'The terms found in the sector reports, defined without jargon.',
    rechercher: 'Search for a term…',
    toutes: 'All',
    aucunResultat: 'No term matches',
    avertissement:
      'These definitions describe concepts and schemes, without quoting rates or ' +
      'thresholds: those change with each finance act, and a value frozen here would ' +
      'become wrong without anyone noticing. Up-to-date figures appear in the reports, ' +
      'with their date and their source.',

    categorieFiscalite: 'Taxation',
    categorieStatistique: 'Statistics',
    categorieLogistique: 'Logistics',
    categorieInvestissement: 'Investment',
    categorieEnergie: 'Energy',

    totalementExportatriceTerme: 'Wholly exporting company',
    totalementExportatriceDefinition:
      'A Tunisian regime reserved for companies whose turnover is generated mainly through ' +
      'exports. It grants tax and customs advantages, in return for reporting obligations ' +
      'and an export threshold that must be met.',
    totalementExportatriceNuance:
      'The threshold and the duration of the advantages are set by the finance act in ' +
      'force: check them with APII before building a financial plan on them.',

    zoneFrancheTerme: 'Free zone',
    zoneFrancheDefinition:
      'A customs perimeter where goods enter and leave free of duties and taxes for as long ' +
      'as they are not released for consumption on the local market. Designed for ' +
      'processing activities intended for re-export.',

    ideTerme: 'FDI — Foreign direct investment',
    ideDefinition:
      'A lasting equity stake taken by a non-resident investor in a resident company, with ' +
      'the intention of influencing its management. Distinct from portfolio investment, ' +
      'which is purely financial and liquid.',

    valeurAjouteeTerme: 'Sector value added',
    valeurAjouteeDefinition:
      'The wealth created by a sector: its output less intermediate consumption. Expressed ' +
      'as a percentage of GDP, it measures the sector’s real weight in the economy.',
    valeurAjouteeNuance:
      'Not to be confused with turnover: two sectors with identical turnover can create ' +
      'very different amounts of wealth.',

    evpTerme: 'TEU — Twenty-foot equivalent unit',
    evpDefinition:
      'The unit of measurement for containerised traffic. A standard 20-foot container is ' +
      '1 TEU, a 40-foot container is 2. It allows port activity to be compared regardless ' +
      'of box size.',

    r2Terme: 'Coefficient of determination (R²)',
    r2Definition:
      'A measure of how well a model fits observed data, between 0 and 1. The closer to 1, ' +
      'the better the model explains the historical series.',
    r2Nuance:
      'A high R² does not guarantee the projection will come true: it says the model fits ' +
      'the past, not that it predicts the future. Series whose fit is insufficient receive ' +
      'no estimate at all in our reports.',

    observeeEstimeeTerme: 'Observed data / estimated data',
    observeeEstimeeDefinition:
      'Observed data was published by an official source for a given year. Estimated data ' +
      'is calculated by extrapolating from the history.',
    observeeEstimeeNuance:
      'Our reports and this interface never present them the same way: colour, line style ' +
      'and wording all differ. Presenting an extrapolation as a fact would be the gravest ' +
      'error this service could commit.',

    balanceTerme: 'Sector trade balance',
    balanceDefinition:
      'The difference between a sector’s exports and imports over a period. A positive ' +
      'balance indicates a net exporting sector.',

    capaciteTerme: 'Installed capacity',
    capaciteDefinition:
      'The maximum power a generating fleet can deliver, expressed in megawatts (MW). It ' +
      'says nothing about the energy actually produced, which depends on the load factor.',
    capaciteNuance:
      'A 10 MW solar plant does not produce 10 MW continuously: how much sunlight it ' +
      'receives determines its actual output.',

    facteurChargeTerme: 'Load factor',
    facteurChargeDefinition:
      'The ratio between the energy actually produced over a period and the energy the ' +
      'installation would have produced running at full power over the same period.',

    nonDoubleImpositionTerme: 'Double taxation treaty',
    nonDoubleImpositionDefinition:
      'A bilateral agreement allocating taxing rights between two states, so that the same ' +
      'income is not taxed twice. It governs, among other things, the treatment of ' +
      'repatriated dividends.',

    dueDiligenceTerme: 'Due diligence',
    dueDiligenceDefinition:
      'The set of checks carried out before an investment: the target’s legal, accounting, ' +
      'tax, employment and environmental position.',
    dueDiligenceNuance:
      'A sector report documents a market; it is in no way a substitute for due diligence, ' +
      'which concerns one specific company.',
  },

  mesRapports: {
    titre: 'My reports',
    accroche:
      'Your completed orders and the documents delivered. A report stays downloadable ' +
      'indefinitely.',
    aucuneCommande: 'No orders yet',
    aucuneCommandeTexte:
      'The reports you order will appear here, together with their download link.',
    parcourirCatalogue: 'Browse the catalogue',
    commandeDu: (date: string) => `Ordered on ${date}`,
    demonstration: 'demonstration',
    pages: (nombre: number) => `${nombre} pages`,
    livreLe: (date: string) => `Delivered ${date}`,
    telecharger: 'Download',
    aProduire: 'Report to be produced',
    relancer: 'Restart',
  },

  generation: {
    qualiteTitre: (nombre: number) =>
      `${nombre} section(s) to review before distribution`,
    qualiteTexte:
      'A second model reviewed the report and flagged figures it could not trace back ' +
      'to the sector data. The document is still deliverable; correct it from the ' +
      'editing screen if the flag is justified.',
    qualiteModele: (modele: string) => `Reviewed by ${modele}`,
    echecTitre: 'Generation did not complete',
    echecDefaut: 'Something went wrong while building the report.',
    echecPaiement:
      'Your payment remains on record. Restarting generation will not be charged again.',
    relancerGeneration: 'Restart generation',

    pretTitre: 'Your report is ready',
    pretPages: (pages: number, secondes: number) =>
      `${pages} pages, generated in ${secondes} seconds.`,
    pretSansPages: (secondes: number) => `Generated in ${secondes} seconds.`,
    pretDisponible: 'It remains available under “My reports”.',
    sectionsManquantes: (nombre: number) =>
      `${nombre} written section(s) could not be produced. The report remains complete ` +
      'for its quantitative parts and can be restarted.',
    telechargerRapport: 'Download the report',

    enCoursTitre: 'Writing your sector report',
    enCoursTexte: (secondes: number) =>
      'Official data, projections and analysis are being assembled into a single ' +
      `document. Allow around ${secondes} seconds.`,
    etapeParDefaut: 'Preparing sector data',
    avancement: (pourcent: number, secondes: number) => `${pourcent}% · ${secondes}s`,
    neFermezPas: 'Do not close this page: generation tracking is tied to it.',
  },

  paiement: {
    langueRapportTitre: 'Report language',
    langueRapportAide:
      'The PDF document will be written and laid out entirely in this language. Your ' +
      'choice is saved with the order: a restart will produce the same document.',
    langueFrancais: 'Français',
    langueAnglais: 'English',
    retourCatalogue: 'Back to the catalogue',
    etapePaiement: 'Payment',
    etapeGeneration: 'Generation',
    etapeLivraison: 'Download',

    reglementTitre: 'Payment',
    reglementTexte:
      'The amount is calculated by the server from the catalogue price. It is never sent ' +
      'from your browser.',
    identifiantsJamais:
      'Your payment credentials never pass through this platform.',
    secteurIntrouvable: 'Sector not found.',

    paiementConfirme: 'Payment confirmed',
    commandeConfirmee: 'Order confirmed',
    redactionDemarre: (montant: string) => `${montant} — writing is starting.`,
    paiementInterrompu: 'Payment interrupted',
    commandeInterrompue: 'Order interrupted',

    recapitulatif: 'Summary',
    descriptionLigne: (pages: number) =>
      `Sector report · ${pages} pages minimum · PDF format`,
    sousTotal: 'Subtotal',
    fraisService: 'Service fees',
    aucunFrais: 'None',
    totalARegler: 'Total due',
    montantDebite: 'Amount charged by PayPal',
    montantDebiteTexte: (devise: string) =>
      'The Tunisian dinar is not an accepted currency: the transaction is presented in ' +
      `${devise}.`,
    garantieLivraison: 'PDF report delivered immediately after confirmation',
    garantieRegeneration: 'Free regeneration in the event of a technical failure',
    garantieBancaire: 'No banking credentials retained by the platform',
    argentReel: ' · real money',
    bacASable: ' · sandbox',
    modeDemonstration: 'Demonstration mode',
    consulterApercu: 'View the free preview',

    demoTitre: 'Demonstration mode — no payment',
    demoAvant:
      'No amount is charged and no provider is contacted. The order is recorded and then ' +
      'accounted for separately from real revenue. PayPal payment is enabled by setting',
    demoEt: 'and',
    demoApres: 'on the server.',
    adresseFacturation: 'Billing email address',
    adresseFacturationAide: 'Appears on the order receipt.',
    nomFacturation: 'Name or company name (optional)',
    nomFacturationExemple: 'First name Last name / Company',
    validerCommande: 'Confirm the order',
    aucunIdentifiantDemande: 'You are not asked for any payment credentials.',
    emailInvalide: 'Enter a valid email address to receive the receipt.',
    validationEchouee: 'Confirmation failed.',
  },

  paypal: {
    chargement: 'Loading PayPal…',
    fenetreBloquee:
      'The PayPal window could not open. Allow pop-ups for this site, then try again.',
    sessionExpiree: 'Your session has expired. Sign in again, then restart the payment.',
    echecDefaut: 'The payment failed.',
    testTitre: 'Test environment.',
    testTexte:
      'No real amount will be charged. Click “Log in” in the PayPal window and use a ' +
      'sandbox buyer account (developer.paypal.com → Testing Tools → Sandbox accounts): ' +
      'a real PayPal account does not exist in this environment.',
  },

  profil: {
    verifie: 'Verified',
    rapportsCommandes: 'Reports ordered',
    livres: (nombre: string) => `${nombre} delivered`,
    totalRegle: 'Total paid',
    derniereConnexion: 'Last sign-in',
    membreDepuis: (date: string) => `Member since ${date}`,

    infosTitre: 'Personal details',
    infosDescription: 'This information appears on your orders and your reports.',
    prenom: 'First name',
    nom: 'Last name',
    entreprise: 'Company',
    pays: 'Country',
    telephone: 'Telephone',
    telephoneAide: 'Used only to reach you about an order.',
    email: 'Email address',
    emailAide:
      'This address identifies your account and cannot be changed here. Contact support ' +
      'to change it.',
    enregistrer: 'Save changes',
    profilMisAJour: 'Profile updated',
    enregistrementImpossible: 'Could not save',

    motDePasseTitre: 'Password',
    motDePasseDescription:
      'The current password is required: without it, a session left open would be enough ' +
      'to lock the account holder out.',
    motDePasseActuel: 'Current password',
    nouveauMotDePasse: 'New password',
    confirmation: 'Confirmation',
    forceFaible: 'Weak',
    forceCorrecte: 'Fair',
    forceSolide: 'Strong',
    robustesseAvant: 'Strength:',
    robustesseApres:
      '— 8 characters minimum; beyond 12, with digits and symbols, resistance increases ' +
      'markedly.',
    changerMotDePasse: 'Change password',
    motDePasseMisAJour: 'Password updated',
    saisiesDifferentes: 'The two entries do not match.',
    motDePasseTropCourt: 'The password must contain at least 8 characters.',

    securiteTitre: 'Account security',
    securiteBcrypt:
      'Your password is stored as a bcrypt hash. Nobody, including the Tunisia Invest ' +
      'team, can read it.',
    securitePaiement:
      'No payment credentials are stored: payments take place on PayPal’s domain, and ' +
      'PayPal passes on only the payer account address.',
    securiteRoles:
      'Your permissions are re-read from the database on every request: a role change ' +
      'takes effect immediately, without waiting for your session to expire.',
  },

  parametres: {
    titre: 'Settings',
    accroche: 'Display settings specific to this device, and the state of your account.',

    apparenceTitre: 'Appearance',
    apparenceDescription:
      'The theme is remembered in this browser. By default it follows your system ' +
      'setting.',
    themeClair: 'Light',
    themeSombre: 'Dark',
    langueTitre: 'Language',
    langueDescription:
      'The interface language is remembered in this browser. PDF reports are produced in ' +
      'French, whichever language you choose here.',
    affichageCompact: 'Compact display',
    affichageCompactDescription:
      'Reduces spacing in tables and lists so more rows fit on screen.',

    rapportsTitre: 'Reports and notifications',
    ouvrirPdf: 'Open the PDF automatically',
    ouvrirPdfDescription:
      'As soon as generation completes, the report opens in a new tab.',
    afficherEstimations: 'Show estimates',
    afficherEstimationsDescription:
      'Shows the 2025-2028 projections alongside published data. They remain visually ' +
      'distinct: never confused with an official figure.',
    notifications: 'On-screen notifications',
    notificationsDescription:
      'Payment confirmations, completed generation and error messages.',

    compteTitre: 'Account',
    adresseEmail: 'Email address',
    role: 'Role',
    reinitialiser: 'Reset preferences',
    preferencesReinitialisees: 'Preferences reset',

    donneesTitre: 'Data and privacy',
    donneesLocal:
      'The settings on this page never leave this browser: they are stored locally, ' +
      'never sent to the server and never attached to your account.',
    donneesPaiement:
      'For each payment, only the payer account address and the transaction reference are ' +
      'kept — the accounting record, nothing more.',
    donneesConservation:
      'The reports you buy remain accessible under “My reports” with no time limit.',

    servicesTitre: 'Service status',
    servicesDescription: 'Payment and writing engine.',
    servicePaiement: 'Payment',
    serviceMode: 'Mode',
    serviceEnvironnement: 'Environment',
    serviceArgentReel: ' · real money',
    serviceTest: ' · test',
    serviceIdentifiants: 'Credentials',
    serviceConfigures: 'configured',
    serviceAbsents: 'missing',
    serviceMoteur: 'Report engine',
    serviceDisponibilite: 'Availability',
    serviceInjoignable: 'unreachable',
    serviceEnLigne: 'online',
    serviceRedaction: 'Writing',
    serviceActive: 'active',
    serviceCleAbsente: 'key missing',
    serviceModele: 'Model',
    serviceGenerations: 'Generations in progress',
    actualiser: 'Refresh',
  },

  analyse: {
    surtitre: 'Comparative analysis',
    titre: 'Sector comparison',
    accroche:
      'All six sectors side by side, across seven aggregated indicators. This screen is ' +
      'free and requires no account: it helps you place a sector before ordering the ' +
      'detailed analysis.',

    indicateurPib: 'Contribution to GDP',
    indicateurPibCourt: 'GDP',
    indicateurCroissance: 'Annual growth',
    indicateurCroissanceCourt: 'Growth',
    indicateurEmplois: 'Jobs generated',
    indicateurEmploisCourt: 'Jobs',
    indicateurEmploisUnite: 'posts',
    indicateurExportations: 'Exports',
    indicateurExportationsCourt: 'Exports',
    indicateurEntreprises: 'Active companies',
    indicateurEntreprisesCourt: 'Companies',
    indicateurEntreprisesUnite: 'units',
    indicateurIde: 'Foreign direct investment',
    indicateurIdeCourt: 'FDI',
    indicateurPartMarche: 'Regional market share',
    indicateurPartMarcheCourt: 'Reg. share',

    classementTitre: 'Ranking by indicator',
    classementDescription: 'Choose the indicator that matters for your project.',
    profilTitre: 'Compared profile',
    profilDescription:
      'Each axis is scaled to 100 for the best-placed sector. The radar shows relative ' +
      'positions, not absolute values — those appear in the table below.',
    valeursTitre: 'Detailed values',
    colonneSecteur: 'Sector',
    boutonRapport: 'Report',
    noteAgregats:
      'These aggregated indicators give an order of magnitude. The detailed annual ' +
      'series, their sources and the 2025-2028 outlook appear in the sector report.',
    nonContractuel: 'Non-contractual data',
  },

  regional: {
    indicateursComparables: (nombre: number) => `${nombre} comparable indicator(s)`,
    titre: 'Tunisia, Morocco and Egypt',
    accroche:
      'An investor studying North Africa does not choose a country in isolation: they ' +
      'weigh several against each other. These indicators place Tunisia alongside its two ' +
      'most comparable neighbours.',
    sourceAvant: 'All values come from the',
    sourceFort: 'World Bank World Development Indicators',
    sourceApres:
      ' (CC BY 4.0 licence), reproduced without reprocessing. Each country is shown at its ' +
      'most recent published year — these can differ from one country to another, as the ' +
      'source does not publish them on the same schedule. No value is estimated or ' +
      'interpolated.',
    nombreIndicateurs: (nombre: number) => `${nombre} indicators`,
    aucunComparatif: 'No benchmark data available',
    aucunComparatifAvant: 'Import the official indicators with',
    aucunComparatifApres: 'or enter them from the control panel.',
    paysTunisie: 'Tunisia',
    paysMaroc: 'Morocco',
    paysEgypte: 'Egypt',
    nonDisponible: 'n/a',
  },

  admin: {
    rapportsTitre: 'Reports produced',
    rapportsAccroche:
      'Documents generated by the engine. A report whose writing failed can be corrected ' +
      'by hand and rebuilt, at no further cost to the customer.',
    fichiersDisponibles: 'Files available',
    sansFichier: (nombre: number) => `${nombre} without a file`,
    tousLivres: 'all delivered',
    volumeTotal: 'Total size',
    historique: 'History',
    rechercherRapport: 'Search for a report…',
    colonneTitre: 'Title',
    colonneGenereLe: 'Generated on',
    colonnePages: 'Pages',
    colonneTaille: 'Size',
    colonneStatut: 'Status',
    aucunRapportCorrespond: 'No report matches.',

    comptesTitre: 'Accounts',
    comptesAccroche:
      'A role takes effect immediately: it is re-read from the database on every request, ' +
      'without waiting for the session concerned to expire.',
    nombreComptes: 'Accounts',
    administrateurs: 'Administrators',
    comptesActifs: 'Active accounts',
    desactives: (nombre: number) => `${nombre} deactivated`,
    rechercherCompte: 'Name, email, company…',
    colonneCompte: 'Account',
    colonneEntreprise: 'Company',
    colonnePays: 'Country',
    colonneInscritLe: 'Registered on',
    colonneDerniereConnexion: 'Last sign-in',
    colonneRole: 'Role',
    aucunCompteCorrespond: 'No account matches these criteria.',
    jamais: 'never',
    desactive: 'deactivated',
    promouvoir: 'Promote',
    retrograder: 'Demote',
    roleChange: (qui: string, role: string) => `${qui} is now ${role}`,
    changementRefuse: 'Change refused',
    filtreTous: 'All',
    filtreClients: 'Clients',
    filtreAdministrateurs: 'Administrators',

    secteursTitre: 'Sectors',
    secteursAccroche:
      'Price, description and catalogue visibility. A hidden sector disappears from the ' +
      'public catalogue but remains downloadable by those who bought it.',
    actifsSurTotal: (actifs: number, total: number) => `${actifs} / ${total} active`,
    catalogue: 'Catalogue',
    rechercherSecteur: 'Search for a sector…',
    colonneDescription: 'Description',
    colonnePrix: 'Price',
    colonneMiseAJour: 'Updated',
    colonneEtat: 'Status',
    aucunSecteurCorrespond: 'No sector matches this search.',
    aucunSecteur: 'No sectors.',
    nomSecteur: 'Sector name',
    description: 'Description',
    prixRapport: 'Report price',
    actif: 'Active',
    masque: 'Hidden',
    enregistrer: 'Save',
    annulerEdition: 'Cancel editing',
    modifier: 'Edit',
    donnees: 'Data',
    secteurMisAJour: 'Sector updated',
    enregistrementImpossible: 'Could not save',

    sectionIntroduction: 'General overview of the sector',
    sectionTendances: 'Trend analysis',
    sectionOpportunites: 'Opportunities identified',
    sectionRisques: 'Risk analysis',
    sectionBenchmarking: 'Regional benchmarking',
    sectionRecommandations: 'Investor recommendations',
    sectionPerspectives: '2025-2028 outlook',

    retourRapports: 'Back to reports',
    rapportInaccessible: 'Report unavailable',
    rapportIntrouvable: 'Report not found.',
    genereLe: (date: string, pages: string) =>
      `Generated on ${date} · ${pages} pages. The quantitative sections are rebuilt ` +
      'automatically from the database.',
    sectionsVides: (nombre: number) => `${nombre} empty section(s)`,
    pdfActuel: 'Current PDF',
    mots: (nombre: number) => `${nombre} word${nombre > 1 ? 's' : ''}`,
    sectionVidePlaceholder: 'Empty section — it will appear as unavailable in the PDF.',
    enregistrerReconstruire: 'Save and rebuild the PDF',
    annuler: 'Cancel',
    aucunAppelRedaction:
      'No call to the writing service: your corrections will not be overwritten.',
    pdfReconstruit: 'PDF rebuilt',
    correctionsDansDocument: 'Your corrections are in the document.',
    reconstructionImpossible: 'Rebuild failed',

    retourSecteurs: 'Back to sectors',
    resume: (series: string, zones: number, acteurs: number, textes: number) =>
      `${series} series · ${zones} zones · ${acteurs} players · ${textes} regulatory texts`,
    recalculerProjections: 'Recalculate projections',
    regenererRapport: 'Regenerate the report',
    rapportRegenere: 'Report regenerated —',
    ouvrirDocument: 'open the document',
    supprimer: 'Delete',

    chiffresCles: 'Key figures',
    champPib: 'Contribution to GDP (%)',
    champCroissance: 'Annual growth (%)',
    champEmplois: 'Jobs generated',
    champExportations: 'Exports (MDT)',
    champEntreprises: 'Active companies',
    champIde: 'FDI investment (MDT)',
    champPartMarche: 'Regional market share (%)',
    enregistrerChiffres: 'Save key figures',

    zonesTitre: 'Geographic zones and free zones',
    zonesVide: 'No zones recorded.',
    ajouterZone: 'Add the zone',
    descriptionZone: 'Zone description',
    acteursTitre: 'Main players',
    acteursVide: 'No players recorded.',
    ajouterActeur: 'Add the player',
    cadreTitre: 'Regulatory and tax framework',
    cadreVide: 'No texts recorded.',
    ajouterTexte: 'Add the text',
    descriptionTexte: 'Text description',

    champNom: 'Name',
    champType: 'Type',
    champGouvernorat: 'Governorate',
    champSuperficie: 'Area (km²)',
    champRole: 'Role',
    champSiteWeb: 'Website',
    champCa: 'Turnover (MDT)',
    champEmployes: 'Employees',
    champTitre: 'Title',
    champAnnee: 'Year',
    champDescription: 'Description',

    seriesTitre: 'Statistical series',
    colonneIndicateur: 'Indicator',
    colonneUnite: 'Unit',
    colonneEstimation: '2028 (est.)',
    colonneMethode: 'Method',
    aucuneSerie: 'No series for this sector.',
    seriesTronquees: (total: string) => `First 40 series shown out of ${total}.`,

    chiffresEnregistres: 'Key figures saved',
    elementSupprime: 'Item deleted',
    suppressionImpossible: 'Could not delete',
    projectionsRecalculees: 'Projections recalculated',
    recalculImpossible: 'Could not recalculate',
    rapportRegenereToast: 'Report regenerated',
    regenerationImpossible: 'Could not regenerate',
    ajoute: 'Added',
    ajoutImpossible: 'Could not add',
    erreurInconnue: 'Unknown error',

    comparatifTitre: 'Regional benchmark',
    comparatifRenseignes: (renseignes: number, total: number) =>
      `${renseignes} / ${total} filled in`,
    comparatifAvant:
      'These cells are deliberately empty. As long as a value is missing, the report ' +
      'treats the comparison qualitatively rather than putting forward an unsourced ' +
      'foreign figure. ',
    comparatifFort: 'Enter only verifiable values',
    comparatifApres:
      ', with their source — they will appear in the comparison chart of the PDF.',
    comparatifAnnee: 'Year',
    comparatifSource: 'Source',
    comparatifSourcePlaceholder: 'Body, year',
    indicateurEnregistre: 'Indicator saved',

    accesAdministrateur: 'Administrator access',
    documentReconstruit: 'The document has been rebuilt with your corrections.',
    ouvrirNouveauPdf: 'Open the new PDF',

    nomAnglais: 'Name (English)',
    descriptionAnglaise: 'Description (English)',
    traductionAbsente: 'not translated',
    legendeReel: 'Revenue',
    legendeSimule: 'Simulated orders',
    corriger: 'Correct',
    statutGenere: 'generated',
    statutEnAttente: 'pending',
    statutErreur: 'error',
    statutInconnu: 'unknown',
    serieObservee: 'Observed data',
    serieEstimation: 'Estimate',
    serieDemandes: 'Requests',
    titreRapport: (secteur: string) => `Sector Report — ${secteur}`,
    tableauBordTitre: 'Dashboard',
    tableauBordAccroche: 'Commercial activity and reports produced.',
    modeDemonstration: 'Demonstration mode',
    aucuneVenteReelle:
      'No real sales recorded: the amounts below correspond to orders confirmed without ' +
      'any charge.',
    rapportsVendus: 'Reports sold',
    dontDemonstration: (nombre: string) => `of which ${nombre} in demonstration`,
    montantCommandes: 'Order value',
    chiffreAffaires: 'Revenue',
    simulesExclus: (montant: string) => `${montant} simulated, excluded`,
    rapportsGeneres: 'Reports generated',
    secteurPlusDemande: 'Most requested sector',
    ventesParSecteur: 'Sales by sector',
    partChaqueSecteur: 'Share of each sector',
    toutesVentes: 'all sales',
    detailParSecteur: 'Detail by sector',
    colonneSecteur: 'Sector',
    colonneVentes: 'Sales',
    colonneRevenus: 'Revenue',
    colonneRapports: 'Reports',
    derniersRapports: 'Latest reports produced',
    ouvrir: 'Open',
    pages: (nombre: number) => `${nombre} pages`,
    aucunRapportProduit: 'No reports produced yet.',
  },

  pied: {
    presentation:
      'Sector reports on the Tunisian economy, built from data published by official ' +
      'bodies and expanded with analysis written from those same figures.',
    nousContacter: 'Contact us',
    colonnePlateforme: 'Platform',
    colonneAPropos: 'About',
    colonneLegal: 'Legal',
    quiSommesNous: 'Who we are',
    notreMethode: 'Our method',
    sourcesDonnees: 'Data sources',
    mentionsLegales: 'Legal notice',
    avertissementRisques: 'Risk disclosure',
    donneesPersonnelles: 'Personal data',
    avertissementTitre: 'Disclaimer.',
    avertissementTexte:
      'The reports offered on this platform are economic information documents. They ' +
      'constitute neither investment advice, nor a recommendation to buy or sell, nor ' +
      'a guarantee of results. The projections they contain are calculated estimates, ' +
      'identified as such, and do not prejudge how markets will actually develop. All ' +
      'investment carries a risk of capital loss.',
    avertissementLien: 'Read the full risk disclosure',
    copyright: (annee: number, nom: string) => `© ${annee} ${nom}. All rights reserved.`,
  },
};
