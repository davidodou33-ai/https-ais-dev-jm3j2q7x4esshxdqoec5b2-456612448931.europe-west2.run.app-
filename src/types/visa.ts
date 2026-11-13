export type ViewId = 'home' | 'apply' | 'track' | 'guide' | 'admin';

export type VisaCategoryId = 'tourisme' | 'affaires' | 'etudes' | 'travail' | 'transit';

export type ProcessingTier = 'standard' | 'prioritaire' | 'express';

export type EntryType = 'simple' | 'multiple';

export type DossierStatus =
  | 'en_instruction'
  | 'verification_pieces'
  | 'action_requise'
  | 'approuve'
  | 'refuse';

export interface DestinationOption {
  id: string;
  name: string;
  zone: string;
  eVisaSupported: boolean;
  standardDays: number;
  baseFeeEur: number;
  maxStayDays: number;
  entryCityDefault: string;
}

export interface VisaCategoryInfo {
  id: VisaCategoryId;
  label: string;
  shortDesc: string;
  maxDurationDays: number;
  baseFeeEur: number;
  biometricFeeEur: number;
  validityLabel: string;
  requiredDocIds: string[];
}

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  formats: string;
  maxSizeMb: number;
  mandatory: boolean;
}

export interface UploadedDocument {
  docId: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
  mimeType: string;
}

export interface VisaFormData {
  // Etape 1: Voyage & Type
  destinationId: string;
  visaCategory: VisaCategoryId;
  entryType: EntryType;
  processingTier: ProcessingTier;
  arrivalDate: string;
  departureDate: string;
  entryCity: string;
  travelPurposeDetails: string;

  // Etape 2: Identité & Passeport
  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  gender: 'F' | 'M' | 'X';
  maritalStatus: 'celibataire' | 'marie' | 'pacse' | 'divorce' | 'veuf';
  passportNumber: string;
  passportIssueCountry: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  occupation: string;
  employerName: string;

  // Etape 3: Coordonnées & Hébergement
  addressLine: string;
  postalCode: string;
  city: string;
  residenceCountry: string;
  email: string;
  phone: string;
  accommodationType: 'hotel' | 'prive' | 'universitaire';
  hostName: string;
  hostAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Etape 4: Documents
  documents: Record<string, UploadedDocument>;

  // Etape 5: Déclaration & Paiement
  declarationTruthful: boolean;
  declarationPrivacy: boolean;
  paymentMethod: PaymentMethodId;
  cardHolder: string;
  cardLastFour: string;
  mobileMoneyPhone?: string;
  cardNetwork?: string;
  bankOperator?: string;
  bankAccountRef?: string;
  paypalEmail?: string;
}

export type PaymentMethodId =
  | 'orange_money'
  | 'mtn_momo'
  | 'wave'
  | 'moov_money'
  | 'carte'
  | 'virement_bancaire'
  | 'paypal';

export interface TimelineStep {
  id: string;
  label: string;
  date: string;
  completed: boolean;
  current?: boolean;
  note?: string;
}

export interface VisaDossier {
  reference: string;
  submittedAt: string;
  updatedAt: string;
  status: DossierStatus;
  destinationId: string;
  destinationName: string;
  visaCategory: VisaCategoryId;
  visaCategoryLabel: string;
  entryType: EntryType;
  processingTier: ProcessingTier;
  applicantFullName: string;
  nationality: string;
  passportNumber: string;
  email: string;
  arrivalDate: string;
  departureDate: string;
  totalFeeEur: number;
  missingDocId?: string;
  missingDocReason?: string;
  documents: Record<string, UploadedDocument>;
  timeline: TimelineStep[];
}
