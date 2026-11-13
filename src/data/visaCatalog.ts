import {
  DestinationOption,
  DocumentRequirement,
  ProcessingTier,
  VisaCategoryId,
  VisaCategoryInfo,
  VisaDossier,
  VisaFormData,
} from '../types/visa';

export const NATIONALITIES: string[] = [
  'Marocaine',
  'Tunisienne',
  'Algérienne',
  'Sénégalaise',
  'Ivoirienne',
  'Camerounaise',
  'Française',
  'Belge',
  'Suisse',
  'Canadienne',
  'Britannique',
  'Brésilienne',
  'Indienne',
  'Japonaise',
  'Américaine',
];

export const DESTINATIONS: DestinationOption[] = [
  {
    id: 'schengen-fr',
    name: 'France (Espace Schengen)',
    zone: 'Europe · Code Schengen',
    eVisaSupported: true,
    standardDays: 5,
    baseFeeEur: 80,
    maxStayDays: 90,
    entryCityDefault: 'Paris — Roissy-CDG',
  },
  {
    id: 'canada',
    name: 'Canada (AVE / Visa Visiteur)',
    zone: 'Amérique du Nord',
    eVisaSupported: true,
    standardDays: 7,
    baseFeeEur: 95,
    maxStayDays: 180,
    entryCityDefault: 'Montréal — Trudeau',
  },
  {
    id: 'uk',
    name: 'Royaume-Uni (Standard / ETA)',
    zone: 'Europe hors Schengen',
    eVisaSupported: true,
    standardDays: 5,
    baseFeeEur: 115,
    maxStayDays: 180,
    entryCityDefault: 'Londres — Heathrow',
  },
  {
    id: 'japan',
    name: 'Japon (eVISA)',
    zone: 'Asie-Pacifique',
    eVisaSupported: true,
    standardDays: 4,
    baseFeeEur: 45,
    maxStayDays: 90,
    entryCityDefault: 'Tokyo — Haneda',
  },
  {
    id: 'usa',
    name: 'États-Unis (B1/B2 & ESTA)',
    zone: 'Amérique du Nord',
    eVisaSupported: true,
    standardDays: 10,
    baseFeeEur: 160,
    maxStayDays: 90,
    entryCityDefault: 'New York — JFK',
  },
];

export const VISA_CATEGORIES: Record<VisaCategoryId, VisaCategoryInfo> = {
  tourisme: {
    id: 'tourisme',
    label: 'Tourisme (Court séjour)',
    shortDesc: 'Séjours touristiques, visites familiales ou circuits culturels.',
    maxDurationDays: 90,
    baseFeeEur: 80,
    biometricFeeEur: 25,
    validityLabel: '6 mois · 90 jours max',
    requiredDocIds: ['passeport', 'photo_oaci', 'billet_avion', 'hebergement', 'ressources'],
  },
  affaires: {
    id: 'affaires',
    label: 'Affaires & Conférence',
    shortDesc: 'Réunions commerciales, salons professionnels, missions d’audit.',
    maxDurationDays: 90,
    baseFeeEur: 95,
    biometricFeeEur: 25,
    validityLabel: '1 an · Entrées multiples',
    requiredDocIds: [
      'passeport',
      'photo_oaci',
      'billet_avion',
      'hebergement',
      'ressources',
      'lettre_invitation',
    ],
  },
  etudes: {
    id: 'etudes',
    label: 'Études & Recherche',
    shortDesc: 'Inscription universitaire, échange académique ou stage encadré.',
    maxDurationDays: 365,
    baseFeeEur: 110,
    biometricFeeEur: 30,
    validityLabel: '12 mois · Renouvelable',
    requiredDocIds: [
      'passeport',
      'photo_oaci',
      'hebergement',
      'ressources',
      'attestation_admission',
    ],
  },
  travail: {
    id: 'travail',
    label: 'Travail qualifié',
    shortDesc: 'Contrat salarié visé, détachement ou passeport talent.',
    maxDurationDays: 365,
    baseFeeEur: 150,
    biometricFeeEur: 35,
    validityLabel: '12 à 36 mois',
    requiredDocIds: [
      'passeport',
      'photo_oaci',
      'hebergement',
      'contrat_travail',
    ],
  },
  transit: {
    id: 'transit',
    label: 'Transit aéroportuaire',
    shortDesc: 'Correspondance internationale nécessitant un passage en zone sous douane.',
    maxDurationDays: 5,
    baseFeeEur: 45,
    biometricFeeEur: 15,
    validityLabel: '5 jours · Simple ou double',
    requiredDocIds: ['passeport', 'photo_oaci', 'billet_avion'],
  },
};

export const DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirement> = {
  passeport: {
    id: 'passeport',
    title: 'Page d’identité du passeport',
    description: 'Scan couleur haute définition des deux pages comportant la bande MRZ et la signature.',
    formats: 'PDF, JPG, PNG',
    maxSizeMb: 5,
    mandatory: true,
  },
  photo_oaci: {
    id: 'photo_oaci',
    title: 'Photographie d’identité norme OACI',
    description: 'Format 35 × 45 mm récent (moins de 6 mois), fond uni clair, visage dégagé sans lunettes.',
    formats: 'JPG, PNG',
    maxSizeMb: 3,
    mandatory: true,
  },
  billet_avion: {
    id: 'billet_avion',
    title: 'Réservation de vol aller-retour',
    description: 'Itinéraire complet mentionnant le numéro de dossier PNR et les dates concordantes.',
    formats: 'PDF',
    maxSizeMb: 5,
    mandatory: true,
  },
  hebergement: {
    id: 'hebergement',
    title: 'Justificatif d’hébergement',
    description: 'Confirmation hôtelière nominative, attestation d’accueil ou bail de résidence universitaire.',
    formats: 'PDF, JPG',
    maxSizeMb: 5,
    mandatory: true,
  },
  ressources: {
    id: 'ressources',
    title: 'Justificatifs de ressources financières',
    description: 'Trois derniers relevés bancaires mensuels certifiés ou attestation de prise en charge.',
    formats: 'PDF',
    maxSizeMb: 8,
    mandatory: true,
  },
  lettre_invitation: {
    id: 'lettre_invitation',
    title: 'Lettre d’invitation professionnelle',
    description: 'Courrier officiel à en-tête de l’entreprise hôte précisant l’objet et la durée de la mission.',
    formats: 'PDF',
    maxSizeMb: 5,
    mandatory: true,
  },
  attestation_admission: {
    id: 'attestation_admission',
    title: 'Attestation d’inscription ou d’admission',
    description: 'Lettre définitive délivrée par l’établissement d’enseignement supérieur ou le laboratoire.',
    formats: 'PDF',
    maxSizeMb: 5,
    mandatory: true,
  },
  contrat_travail: {
    id: 'contrat_travail',
    title: 'Contrat de travail & Autorisation préalable',
    description: 'Contrat signé et arrêté d’autorisation d’emploi visé par l’autorité compétente.',
    formats: 'PDF',
    maxSizeMb: 8,
    mandatory: true,
  },
};

export const PROCESSING_OPTIONS: Record<
  ProcessingTier,
  { label: string; delayLabel: string; surchargeEur: number; description: string }
> = {
  standard: {
    label: 'Instruction standard',
    delayLabel: '5 jours ouvrés',
    surchargeEur: 0,
    description: 'Traitement consulaire dans l’ordre d’arrivée des dossiers complets.',
  },
  prioritaire: {
    label: 'Traitement prioritaire',
    delayLabel: '48 heures ouvrées',
    surchargeEur: 45,
    description: 'Examen accéléré et contrôle de conformité documentaire prioritaire.',
  },
  express: {
    label: 'Procédure express',
    delayLabel: '24 heures ouvrées',
    surchargeEur: 85,
    description: 'Instruction dédiée le jour même pour les déplacements professionnels urgents.',
  },
};

export function calculateFeeBreakdown(
  destinationId: string,
  visaCategory: VisaCategoryId,
  entryType: 'simple' | 'multiple',
  processingTier: ProcessingTier
) {
  const dest = DESTINATIONS.find((d) => d.id === destinationId) ?? DESTINATIONS[0];
  const cat = VISA_CATEGORIES[visaCategory];
  const proc = PROCESSING_OPTIONS[processingTier];

  const consularFee = Math.round((dest.baseFeeEur + cat.baseFeeEur) / 2);
  const biometricFee = cat.biometricFeeEur;
  const multipleEntryFee = entryType === 'multiple' ? 20 : 0;
  const processingFee = proc.surchargeEur;
  const totalEur = consularFee + biometricFee + multipleEntryFee + processingFee;

  return {
    consularFee,
    biometricFee,
    multipleEntryFee,
    processingFee,
    totalEur,
  };
}

export function createInitialFormData(): VisaFormData {
  return {
    destinationId: 'schengen-fr',
    visaCategory: 'tourisme',
    entryType: 'simple',
    processingTier: 'standard',
    arrivalDate: '2027-01-15',
    departureDate: '2027-01-28',
    entryCity: 'Paris — Roissy-CDG',
    travelPurposeDetails: '',

    lastName: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    nationality: 'Marocaine',
    gender: 'F',
    maritalStatus: 'celibataire',
    passportNumber: '',
    passportIssueCountry: 'Maroc',
    passportIssueDate: '',
    passportExpiryDate: '',
    occupation: '',
    employerName: '',

    addressLine: '',
    postalCode: '',
    city: '',
    residenceCountry: 'Maroc',
    email: '',
    phone: '',
    accommodationType: 'hotel',
    hostName: '',
    hostAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',

    documents: {},

    declarationTruthful: false,
    declarationPrivacy: false,
    paymentMethod: 'orange_money',
    cardHolder: '',
    cardLastFour: '',
    mobileMoneyPhone: '',
    cardNetwork: 'Visa',
    bankOperator: 'Afriland First Bank',
    bankAccountRef: '',
    paypalEmail: '',
  };
}

export const PAYMENT_METHODS: {
  id:
    | 'orange_money'
    | 'mtn_momo'
    | 'wave'
    | 'moov_money'
    | 'carte'
    | 'virement_bancaire'
    | 'paypal';
  group: 'mobile' | 'bank';
  label: string;
  sublabel: string;
  badgeText: string;
  badgeBgClass: string;
}[] = [
  {
    id: 'orange_money',
    group: 'mobile',
    label: 'Orange Money',
    sublabel: 'Validation mobile · #150#',
    badgeText: 'OM',
    badgeBgClass: 'bg-orange-600 text-white',
  },
  {
    id: 'mtn_momo',
    group: 'mobile',
    label: 'MTN MoMo',
    sublabel: 'Mobile Money · *126#',
    badgeText: 'MoMo',
    badgeBgClass: 'bg-amber-400 text-slate-950',
  },
  {
    id: 'wave',
    group: 'mobile',
    label: 'Wave',
    sublabel: 'Transfert mobile instantané',
    badgeText: 'Wave',
    badgeBgClass: 'bg-sky-500 text-white',
  },
  {
    id: 'moov_money',
    group: 'mobile',
    label: 'Moov Money',
    sublabel: 'Portefeuille mobile Flooz',
    badgeText: 'Moov',
    badgeBgClass: 'bg-blue-700 text-white',
  },
  {
    id: 'carte',
    group: 'bank',
    label: 'Carte bancaire',
    sublabel: 'Visa · Mastercard · GIMAC',
    badgeText: 'CB',
    badgeBgClass: 'bg-slate-900 text-white',
  },
  {
    id: 'virement_bancaire',
    group: 'bank',
    label: 'Virement bancaire',
    sublabel: 'Banques locales & SEPA',
    badgeText: 'RIB',
    badgeBgClass: 'bg-blue-900 text-white',
  },
  {
    id: 'paypal',
    group: 'bank',
    label: 'PayPal',
    sublabel: 'Compte international',
    badgeText: 'PP',
    badgeBgClass: 'bg-indigo-800 text-white',
  },
];

export const BANK_OPERATORS: string[] = [
  'Afriland First Bank',
  'Société Générale (SGBC / SG)',
  'BICEC',
  'Ecobank',
  'UBA (United Bank for Africa)',
  'BGFI Bank',
  'Banque Atlantique',
  'BNP Paribas',
  'Crédit Agricole',
  'Autre opérateur bancaire',
];

export const INITIAL_DOSSIERS: VisaDossier[] = [
  {
    reference: 'VIS-2026-841920',
    submittedAt: '2026-11-04T09:15:00Z',
    updatedAt: '2026-11-11T16:40:00Z',
    status: 'approuve',
    destinationId: 'schengen-fr',
    destinationName: 'France (Espace Schengen)',
    visaCategory: 'affaires',
    visaCategoryLabel: 'Affaires & Conférence',
    entryType: 'multiple',
    processingTier: 'prioritaire',
    applicantFullName: 'Youssef Benali',
    nationality: 'Marocaine',
    passportNumber: 'MA9482710',
    email: 'y.benali@atlas-ingenierie.ma',
    arrivalDate: '2026-11-24',
    departureDate: '2026-12-03',
    totalFeeEur: 178,
    documents: {
      passeport: {
        docId: 'passeport',
        fileName: 'passeport_benali_mrz.pdf',
        fileSizeKb: 1420,
        uploadedAt: '2026-11-04T09:10:00Z',
        mimeType: 'application/pdf',
      },
      photo_oaci: {
        docId: 'photo_oaci',
        fileName: 'photo_identite_oaci.jpg',
        fileSizeKb: 412,
        uploadedAt: '2026-11-04T09:11:00Z',
        mimeType: 'image/jpeg',
      },
      billet_avion: {
        docId: 'billet_avion',
        fileName: 'billet_casablanca_cdg.pdf',
        fileSizeKb: 680,
        uploadedAt: '2026-11-04T09:12:00Z',
        mimeType: 'application/pdf',
      },
      hebergement: {
        docId: 'hebergement',
        fileName: 'reservation_hotel_la_defense.pdf',
        fileSizeKb: 520,
        uploadedAt: '2026-11-04T09:13:00Z',
        mimeType: 'application/pdf',
      },
      ressources: {
        docId: 'ressources',
        fileName: 'releves_bancaires_t3.pdf',
        fileSizeKb: 2150,
        uploadedAt: '2026-11-04T09:14:00Z',
        mimeType: 'application/pdf',
      },
      lettre_invitation: {
        docId: 'lettre_invitation',
        fileName: 'invitation_forum_industrie.pdf',
        fileSizeKb: 490,
        uploadedAt: '2026-11-04T09:14:30Z',
        mimeType: 'application/pdf',
      },
    },
    timeline: [
      {
        id: 't1',
        label: 'Dossier déposé & frais acquittés',
        date: '04 nov. 2026 · 09:15',
        completed: true,
        note: 'Paiement carte bancaire validé (178 EUR)',
      },
      {
        id: 't2',
        label: 'Contrôle de conformité documentaire',
        date: '05 nov. 2026 · 14:22',
        completed: true,
        note: '6 pièces justificatives certifiées conformes',
      },
      {
        id: 't3',
        label: 'Instruction par l’autorité consulaire',
        date: '08 nov. 2026 · 11:05',
        completed: true,
        note: 'Avis favorable émis par le pôle affaires',
      },
      {
        id: 't4',
        label: 'Décision émise · e-Visa délivré',
        date: '11 nov. 2026 · 16:40',
        completed: true,
        current: true,
        note: 'Autorisation multi-entrées valide 12 mois disponible au téléchargement',
      },
    ],
  },
  {
    reference: 'VIS-2026-845302',
    submittedAt: '2026-11-10T14:20:00Z',
    updatedAt: '2026-11-12T10:05:00Z',
    status: 'action_requise',
    destinationId: 'canada',
    destinationName: 'Canada (AVE / Visa Visiteur)',
    visaCategory: 'etudes',
    visaCategoryLabel: 'Études & Recherche',
    entryType: 'multiple',
    processingTier: 'standard',
    applicantFullName: 'Amina Diallo',
    nationality: 'Sénégalaise',
    passportNumber: 'SN4820194',
    email: 'amina.diallo@ucad-alumni.sn',
    arrivalDate: '2027-01-05',
    departureDate: '2027-06-30',
    totalFeeEur: 153,
    missingDocId: 'ressources',
    missingDocReason:
      'Le troisième relevé bancaire fourni est illisible sur la partie inférieure. Merci de déposer un document PDF net.',
    documents: {
      passeport: {
        docId: 'passeport',
        fileName: 'passeport_diallo.pdf',
        fileSizeKb: 1180,
        uploadedAt: '2026-11-10T14:12:00Z',
        mimeType: 'application/pdf',
      },
      photo_oaci: {
        docId: 'photo_oaci',
        fileName: 'portrait_oaci_diallo.jpg',
        fileSizeKb: 388,
        uploadedAt: '2026-11-10T14:14:00Z',
        mimeType: 'image/jpeg',
      },
      hebergement: {
        docId: 'hebergement',
        fileName: 'bail_residence_montreal.pdf',
        fileSizeKb: 830,
        uploadedAt: '2026-11-10T14:16:00Z',
        mimeType: 'application/pdf',
      },
      attestation_admission: {
        docId: 'attestation_admission',
        fileName: 'admission_polytechnique_mtl.pdf',
        fileSizeKb: 645,
        uploadedAt: '2026-11-10T14:18:00Z',
        mimeType: 'application/pdf',
      },
    },
    timeline: [
      {
        id: 't1',
        label: 'Dossier déposé & frais acquittés',
        date: '10 nov. 2026 · 14:20',
        completed: true,
      },
      {
        id: 't2',
        label: 'Contrôle de conformité documentaire',
        date: '12 nov. 2026 · 10:05',
        completed: false,
        current: true,
        note: 'Pièce complémentaire demandée : Justificatif de ressources financières',
      },
      {
        id: 't3',
        label: 'Instruction par l’autorité consulaire',
        date: 'En attente',
        completed: false,
      },
      {
        id: 't4',
        label: 'Décision émise · e-Visa délivré',
        date: 'En attente',
        completed: false,
      },
    ],
  },
  {
    reference: 'VIS-2026-847015',
    submittedAt: '2026-11-12T17:50:00Z',
    updatedAt: '2026-11-13T08:30:00Z',
    status: 'en_instruction',
    destinationId: 'japan',
    destinationName: 'Japon (eVISA)',
    visaCategory: 'tourisme',
    visaCategoryLabel: 'Tourisme (Court séjour)',
    entryType: 'simple',
    processingTier: 'express',
    applicantFullName: 'Lucas Mercier',
    nationality: 'Tunisienne',
    passportNumber: 'TN7731902',
    email: 'l.mercier@mail-pro.tn',
    arrivalDate: '2026-12-08',
    departureDate: '2026-12-22',
    totalFeeEur: 173,
    documents: {
      passeport: {
        docId: 'passeport',
        fileName: 'passeport_mercier_2026.pdf',
        fileSizeKb: 1090,
        uploadedAt: '2026-11-12T17:42:00Z',
        mimeType: 'application/pdf',
      },
      photo_oaci: {
        docId: 'photo_oaci',
        fileName: 'photo_identite_mercier.png',
        fileSizeKb: 455,
        uploadedAt: '2026-11-12T17:44:00Z',
        mimeType: 'image/png',
      },
      billet_avion: {
        docId: 'billet_avion',
        fileName: 'vol_ana_tunis_tokyo.pdf',
        fileSizeKb: 710,
        uploadedAt: '2026-11-12T17:46:00Z',
        mimeType: 'application/pdf',
      },
      hebergement: {
        docId: 'hebergement',
        fileName: 'hotels_tokyo_kyoto.pdf',
        fileSizeKb: 590,
        uploadedAt: '2026-11-12T17:48:00Z',
        mimeType: 'application/pdf',
      },
      ressources: {
        docId: 'ressources',
        fileName: 'attestation_solde_bancaire.pdf',
        fileSizeKb: 920,
        uploadedAt: '2026-11-12T17:49:00Z',
        mimeType: 'application/pdf',
      },
    },
    timeline: [
      {
        id: 't1',
        label: 'Dossier déposé & frais acquittés',
        date: '12 nov. 2026 · 17:50',
        completed: true,
      },
      {
        id: 't2',
        label: 'Contrôle de conformité documentaire',
        date: '13 nov. 2026 · 08:10',
        completed: true,
        note: 'Dossier complet vérifié',
      },
      {
        id: 't3',
        label: 'Instruction par l’autorité consulaire',
        date: '13 nov. 2026 · 08:30',
        completed: false,
        current: true,
        note: 'Examen express en cours · Décision attendue sous 24h',
      },
      {
        id: 't4',
        label: 'Décision émise · e-Visa délivré',
        date: 'En attente',
        completed: false,
      },
    ],
  },
];

export const CONSULAR_FAQ = [
  {
    q: 'Combien de temps avant le départ dois-je déposer ma demande de visa ?',
    a: 'Il est recommandé de déposer votre dossier au minimum 15 jours ouvrés avant votre date d’arrivée prévue, et au maximum 6 mois à l’avance (9 mois pour les marins et étudiants).',
  },
  {
    q: 'Quelle doit être la durée de validité restante de mon passeport ?',
    a: 'Votre passeport doit impérativement être valide au moins 6 mois après la date prévue de votre départ du pays de destination et comporter au moins deux pages vierges consécutives.',
  },
  {
    q: 'Puis-je enregistrer mon dossier et reprendre ma saisie ultérieurement ?',
    a: 'Oui. Chaque modification dans le formulaire multi-étapes est sauvegardée automatiquement sur votre navigateur. Vous pouvez interrompre votre saisie et la reprendre exactement à l’étape en cours.',
  },
  {
    q: 'Que faire si une pièce justificative est refusée lors du contrôle ?',
    a: 'Le statut de votre dossier passe en « Action requise ». Rendez-vous dans l’onglet Suivi de dossier, consultez le motif exact indiqué par l’instructeur et téléversez le document corrigé sans repayer de frais.',
  },
];
