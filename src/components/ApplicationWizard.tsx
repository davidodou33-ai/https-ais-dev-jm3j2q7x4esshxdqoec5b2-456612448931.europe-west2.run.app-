import { ChangeEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  RotateCcw,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BANK_OPERATORS,
  DESTINATIONS,
  DOCUMENT_REQUIREMENTS,
  NATIONALITIES,
  PAYMENT_METHODS,
  PROCESSING_OPTIONS,
  VISA_CATEGORIES,
  calculateFeeBreakdown,
  createInitialFormData,
} from '../data/visaCatalog';
import {
  EntryType,
  ProcessingTier,
  UploadedDocument,
  VisaCategoryId,
  VisaDossier,
  VisaFormData,
} from '../types/visa';

interface ApplicationWizardProps {
  formData: VisaFormData;
  onChangeForm: (updater: (prev: VisaFormData) => VisaFormData) => void;
  onResetForm: () => void;
  onSubmitSuccess: (dossier: VisaDossier) => void;
}

const STEPS = [
  { id: 1, label: '01. Voyage & Visa' },
  { id: 2, label: '02. Identité & Passeport' },
  { id: 3, label: '03. Coordonnées & Accueil' },
  { id: 4, label: '04. Pièces justificatives' },
  { id: 5, label: '05. Récapitulatif & Paiement' },
];

function diffDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

function addMonths(dateStr: string, months: number): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function ApplicationWizard({
  formData,
  onChangeForm,
  onResetForm,
  onSubmitSuccess,
}: ApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [cardNumberInput, setCardNumberInput] = useState<string>('4970 1000 3482 9104');
  const [cardExpiryInput, setCardExpiryInput] = useState<string>('09/29');
  const [cardCvcInput, setCardCvcInput] = useState<string>('418');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDestination =
    DESTINATIONS.find((d) => d.id === formData.destinationId) ?? DESTINATIONS[0];
  const selectedCategory = VISA_CATEGORIES[formData.visaCategory];
  const requiredDocIds = selectedCategory.requiredDocIds;

  const stayDurationDays = useMemo(
    () => diffDays(formData.arrivalDate, formData.departureDate),
    [formData.arrivalDate, formData.departureDate]
  );

  const fees = useMemo(
    () =>
      calculateFeeBreakdown(
        formData.destinationId,
        formData.visaCategory,
        formData.entryType,
        formData.processingTier
      ),
    [
      formData.destinationId,
      formData.visaCategory,
      formData.entryType,
      formData.processingTier,
    ]
  );

  const uploadedCount = requiredDocIds.filter((id) => Boolean(formData.documents[id])).length;

  const updateField = <K extends keyof VisaFormData>(key: K, value: VisaFormData[K]) => {
    setStepErrors([]);
    onChangeForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDestinationChange = (destId: string) => {
    const dest = DESTINATIONS.find((d) => d.id === destId);
    setStepErrors([]);
    onChangeForm((prev) => ({
      ...prev,
      destinationId: destId,
      entryCity: dest ? dest.entryCityDefault : prev.entryCity,
    }));
  };

  const handleFileUpload = (docId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const req = DOCUMENT_REQUIREMENTS[docId];
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    if (req && file.size > req.maxSizeMb * 1024 * 1024) {
      setStepErrors([
        `Le fichier "${file.name}" dépasse la taille maximale autorisée (${req.maxSizeMb} Mo).`,
      ]);
      return;
    }

    const uploaded: UploadedDocument = {
      docId,
      fileName: file.name,
      fileSizeKb: sizeKb,
      uploadedAt: new Date().toISOString(),
      mimeType: file.type || 'application/pdf',
    };

    setStepErrors([]);
    onChangeForm((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docId]: uploaded,
      },
    }));
  };

  const attachSampleDocument = (docId: string) => {
    const sampleMap: Record<string, { name: string; kb: number; mime: string }> = {
      passeport: { name: 'passeport_biometrique_mrz.pdf', kb: 1240, mime: 'application/pdf' },
      photo_oaci: { name: 'photo_identite_35x45_oaci.jpg', kb: 380, mime: 'image/jpeg' },
      billet_avion: { name: 'reservation_vol_aller_retour.pdf', kb: 620, mime: 'application/pdf' },
      hebergement: { name: 'attestation_hebergement.pdf', kb: 540, mime: 'application/pdf' },
      ressources: { name: 'releves_bancaires_3_mois.pdf', kb: 1850, mime: 'application/pdf' },
      lettre_invitation: { name: 'lettre_invitation_officielle.pdf', kb: 430, mime: 'application/pdf' },
      attestation_admission: {
        name: 'attestation_admission_universite.pdf',
        kb: 510,
        mime: 'application/pdf',
      },
      contrat_travail: { name: 'contrat_travail_vise.pdf', kb: 980, mime: 'application/pdf' },
    };
    const item = sampleMap[docId] ?? { name: `${docId}.pdf`, kb: 450, mime: 'application/pdf' };
    setStepErrors([]);
    onChangeForm((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docId]: {
          docId,
          fileName: item.name,
          fileSizeKb: item.kb,
          uploadedAt: new Date().toISOString(),
          mimeType: item.mime,
        },
      },
    }));
  };

  const removeDocument = (docId: string) => {
    onChangeForm((prev) => {
      const next = { ...prev.documents };
      delete next[docId];
      return { ...prev, documents: next };
    });
  };

  const fillDemoData = () => {
    setStepErrors([]);
    const demoDocs: Record<string, UploadedDocument> = {};
    requiredDocIds.forEach((docId) => {
      demoDocs[docId] = {
        docId,
        fileName: `${docId}_conforme.pdf`,
        fileSizeKb: 640,
        uploadedAt: new Date().toISOString(),
        mimeType: docId === 'photo_oaci' ? 'image/jpeg' : 'application/pdf',
      };
    });

    onChangeForm((prev) => ({
      ...createInitialFormData(),
      destinationId: prev.destinationId,
      visaCategory: prev.visaCategory,
      entryType: prev.entryType,
      processingTier: prev.processingTier,
      entryCity: selectedDestination.entryCityDefault,
      travelPurposeDetails: 'Séjour culturel et rencontres professionnelles programmées.',
      lastName: 'Khelifi',
      firstName: 'Nadia',
      birthDate: '1993-04-18',
      birthPlace: 'Tunis',
      nationality: 'Tunisienne',
      gender: 'F',
      maritalStatus: 'celibataire',
      passportNumber: 'TN8492015',
      passportIssueCountry: 'Tunisie',
      passportIssueDate: '2022-06-10',
      passportExpiryDate: '2032-06-09',
      occupation: 'Architecte urbaniste',
      employerName: 'Atelier Méditerranée',
      addressLine: '24 Avenue Habib Bourguiba',
      postalCode: '1001',
      city: 'Tunis',
      residenceCountry: 'Tunisie',
      email: 'nadia.khelifi@atelier-med.tn',
      phone: '+216 71 240 890',
      accommodationType: 'hotel',
      hostName: 'Hôtel Saint-Germain',
      hostAddress: '18 Rue du Bac, 75007 Paris',
      emergencyContactName: 'Karim Khelifi',
      emergencyContactPhone: '+216 98 310 442',
      documents: demoDocs,
      paymentMethod: 'orange_money',
      mobileMoneyPhone: '695613056',
      cardNetwork: 'Visa',
      bankOperator: 'Afriland First Bank',
      bankAccountRef: 'CM21 10005 00001 04829104210 45',
      paypalEmail: 'nadia.khelifi@atelier-med.tn',
      cardHolder: 'NADIA KHELIFI',
      cardLastFour: '9104',
      declarationTruthful: false,
      declarationPrivacy: false,
    }));
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    if (step === 1) {
      if (!formData.arrivalDate || !formData.departureDate) {
        errors.push('Veuillez renseigner les dates d’arrivée et de départ.');
      } else if (stayDurationDays <= 0) {
        errors.push('La date de départ doit être postérieure à la date d’arrivée.');
      } else if (stayDurationDays > selectedCategory.maxDurationDays) {
        errors.push(
          `La durée de séjour (${stayDurationDays} jours) dépasse le maximum autorisé pour ce visa (${selectedCategory.maxDurationDays} jours).`
        );
      }
      if (!formData.entryCity.trim()) {
        errors.push('Veuillez indiquer le point ou la ville d’entrée prévu(e).');
      }
    }

    if (step === 2) {
      if (!formData.lastName.trim()) errors.push('Le nom de famille est requis.');
      if (!formData.firstName.trim()) errors.push('Le prénom est requis.');
      if (!formData.birthDate) errors.push('La date de naissance est requise.');
      if (!/^[A-Za-z0-9]{6,15}$/.test(formData.passportNumber.trim())) {
        errors.push(
          'Le numéro de passeport doit contenir entre 6 et 15 caractères alphanumériques.'
        );
      }
      if (!formData.passportExpiryDate) {
        errors.push('La date d’expiration du passeport est requise.');
      } else if (formData.departureDate) {
        const minExpiry = addMonths(formData.departureDate, 6);
        const expiry = new Date(formData.passportExpiryDate);
        if (minExpiry && expiry < minExpiry) {
          errors.push(
            'Votre passeport doit rester valide au moins 6 mois après la date prévue de votre départ.'
          );
        }
      }
    }

    if (step === 3) {
      if (!formData.addressLine.trim()) errors.push('L’adresse postale de résidence est requise.');
      if (!formData.city.trim()) errors.push('La ville de résidence est requise.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.push('Veuillez saisir une adresse e-mail valide.');
      }
      if (formData.phone.trim().length < 7) {
        errors.push('Veuillez saisir un numéro de téléphone valide.');
      }
      if (!formData.hostName.trim()) {
        errors.push('Veuillez indiquer le nom de l’hôtel, de l’établissement ou de l’hôte.');
      }
    }

    if (step === 4) {
      const missing = requiredDocIds.filter((id) => !formData.documents[id]);
      if (missing.length > 0) {
        errors.push(
          `Il reste ${missing.length} pièce(s) justificative(s) obligatoire(s) à téléverser avant de poursuivre.`
        );
      }
    }

    if (step === 5) {
      if (!formData.declarationTruthful || !formData.declarationPrivacy) {
        errors.push('Vous devez accepter les deux déclarations obligatoires pour soumettre.');
      }

      const activePayMethod = PAYMENT_METHODS.some((m) => m.id === formData.paymentMethod)
        ? formData.paymentMethod
        : 'orange_money';

      if (
        activePayMethod === 'orange_money' ||
        activePayMethod === 'mtn_momo' ||
        activePayMethod === 'wave' ||
        activePayMethod === 'moov_money'
      ) {
        const phoneDigits = (formData.mobileMoneyPhone ?? '').replace(/\D/g, '');
        if (phoneDigits.length < 8) {
          errors.push(
            'Veuillez saisir un numéro Mobile Money valide (au moins 8 chiffres).'
          );
        }
      } else if (activePayMethod === 'carte') {
        const digits = cardNumberInput.replace(/\s+/g, '');
        if (digits.length < 12) {
          errors.push('Veuillez saisir un numéro de carte bancaire valide.');
        }
        if (!cardExpiryInput.trim() || !cardCvcInput.trim()) {
          errors.push('Veuillez renseigner la date d’expiration et le cryptogramme de la carte.');
        }
      } else if (activePayMethod === 'virement_bancaire') {
        if ((formData.bankAccountRef ?? '').trim().length < 6) {
          errors.push(
            'Veuillez renseigner l’IBAN, le RIB ou la référence du compte bancaire émetteur.'
          );
        }
      } else if (activePayMethod === 'paypal') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((formData.paypalEmail ?? '').trim())) {
          errors.push('Veuillez saisir une adresse e-mail PayPal valide.');
        }
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors([]);
    setCurrentStep((prev) => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStepErrors([]);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = () => {
    const errors = validateStep(5);
    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const now = new Date();
      const randomSuffix = String(Math.floor(100000 + Math.random() * 899999));
      const reference = `VIS-${now.getFullYear()}-${randomSuffix}`;
      const formattedNow = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const selectedPayMeta =
        PAYMENT_METHODS.find((m) => m.id === formData.paymentMethod) ?? PAYMENT_METHODS[0];
      const paymentLabel =
        selectedPayMeta.id === 'virement_bancaire'
          ? `${selectedPayMeta.label} (${formData.bankOperator || BANK_OPERATORS[0]})`
          : selectedPayMeta.id === 'carte'
            ? `${selectedPayMeta.label} ${formData.cardNetwork || 'Visa'}`
            : selectedPayMeta.label;

      const newDossier: VisaDossier = {
        reference,
        submittedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: 'verification_pieces',
        destinationId: selectedDestination.id,
        destinationName: selectedDestination.name,
        visaCategory: formData.visaCategory,
        visaCategoryLabel: selectedCategory.label,
        entryType: formData.entryType,
        processingTier: formData.processingTier,
        applicantFullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber.trim().toUpperCase(),
        email: formData.email.trim(),
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        totalFeeEur: fees.totalEur,
        documents: formData.documents,
        timeline: [
          {
            id: 't1',
            label: 'Dossier déposé & frais acquittés',
            date: `${formattedNow} · ${formattedTime}`,
            completed: true,
            note: `Règlement validé via ${paymentLabel} (${fees.totalEur} EUR)`,
          },
          {
            id: 't2',
            label: 'Contrôle de conformité documentaire',
            date: 'En cours',
            completed: false,
            current: true,
            note: `${requiredDocIds.length} pièces transmises pour vérification`,
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
      };

      setIsSubmitting(false);
      onSubmitSuccess(newDossier);
    }, 350);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Page Title & Utility Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Demande de visa électronique · Sauvegarde automatique locale
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
            Constitution du dossier de visa
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fillDemoData}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Pré-remplir un exemple
          </button>
          <button
            type="button"
            onClick={() => {
              setStepErrors([]);
              setCurrentStep(1);
              onResetForm();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Horizontal Step Navigation */}
      <nav aria-label="Étapes du formulaire" className="py-6">
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const isCurrent = currentStep === step.id;
            const isPast = step.id < currentStep;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={step.id > currentStep}
                  onClick={() => {
                    if (step.id < currentStep) {
                      setStepErrors([]);
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-blue-900 text-white border-blue-900'
                      : isPast
                        ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <span className="truncate">{step.label}</span>
                  {isPast && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Main Content Grid: Form Left (8 cols) + Live Summary Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
          {/* Validation Errors Banner */}
          {stepErrors.length > 0 && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-900"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Vérification requise avant de continuer</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs text-red-800">
                    {stepErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  01. Destination, catégorie et calendrier de voyage
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Sélectionnez le pays de destination et la nature de votre séjour pour adapter
                  automatiquement la liste des justificatifs et le barème des frais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dest-select"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Pays ou zone de destination *
                  </label>
                  <select
                    id="dest-select"
                    value={formData.destinationId}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cat-select"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Catégorie de visa *
                  </label>
                  <select
                    id="cat-select"
                    value={formData.visaCategory}
                    onChange={(e) =>
                      updateField('visaCategory', e.target.value as VisaCategoryId)
                    }
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {Object.values(VISA_CATEGORIES).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5">
                {selectedCategory.shortDesc} · Validité type : {selectedCategory.validityLabel}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="arrival-date"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date d’arrivée prévue *
                  </label>
                  <input
                    id="arrival-date"
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => updateField('arrivalDate', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="departure-date"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date de départ prévue *
                  </label>
                  <input
                    id="departure-date"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => updateField('departureDate', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="entry-city"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Ville ou aéroport d’entrée *
                  </label>
                  <input
                    id="entry-city"
                    type="text"
                    value={formData.entryCity}
                    onChange={(e) => updateField('entryCity', e.target.value)}
                    placeholder="Ex: Paris — Roissy-CDG"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre d’entrées demandées
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'simple', label: 'Simple entrée' },
                        { id: 'multiple', label: 'Entrées multiples (+20 EUR)' },
                      ] as { id: EntryType; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateField('entryType', opt.id)}
                        className={`h-11 px-3 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                          formData.entryType === opt.id
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cadence de traitement
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'prioritaire', 'express'] as ProcessingTier[]).map((tier) => {
                      const info = PROCESSING_OPTIONS[tier];
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => updateField('processingTier', tier)}
                          className={`h-11 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                            formData.processingTier === tier
                              ? 'bg-blue-900 text-white border-blue-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {tier === 'standard'
                            ? 'Standard'
                            : tier === 'prioritaire'
                              ? '48h (+45€)'
                              : '24h (+85€)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="purpose-details"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Précisions sur l’objet du déplacement (optionnel)
                </label>
                <textarea
                  id="purpose-details"
                  rows={3}
                  value={formData.travelPurposeDetails}
                  onChange={(e) => updateField('travelPurposeDetails', e.target.value)}
                  placeholder="Ex: Participation au salon professionnel annuel, visite familiale ou programme d’échange..."
                  className="w-full p-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  02. État civil et informations du passeport
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Saisissez vos noms et prénoms exactement tels qu’ils figurent sur la bande MRZ
                  de votre passeport biométrique.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="last-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Nom de famille *
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Ex: KHELIFI"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="first-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Prénom(s) *
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Ex: Nadia"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="birth-date"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date de naissance *
                  </label>
                  <input
                    id="birth-date"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="birth-place"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Lieu de naissance
                  </label>
                  <input
                    id="birth-place"
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => updateField('birthPlace', e.target.value)}
                    placeholder="Ville et pays"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nationality"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Nationalité actuelle *
                  </label>
                  <select
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => updateField('nationality', e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {NATIONALITIES.map((nat) => (
                      <option key={nat} value={nat}>
                        {nat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Sexe
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        updateField('gender', e.target.value as 'F' | 'M' | 'X')
                      }
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    >
                      <option value="F">Féminin</option>
                      <option value="M">Masculin</option>
                      <option value="X">Non spécifié</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="marital-status"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Situation
                    </label>
                    <select
                      id="marital-status"
                      value={formData.maritalStatus}
                      onChange={(e) =>
                        updateField(
                          'maritalStatus',
                          e.target.value as VisaFormData['maritalStatus']
                        )
                      }
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    >
                      <option value="celibataire">Célibataire</option>
                      <option value="marie">Marié(e)</option>
                      <option value="pacse">Pacsé(e)</option>
                      <option value="divorce">Divorcé(e)</option>
                      <option value="veuf">Veuf / Veuve</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="passport-num"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Numéro de passeport *
                  </label>
                  <input
                    id="passport-num"
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      updateField('passportNumber', e.target.value.toUpperCase())
                    }
                    placeholder="Ex: TN8492015"
                    className="w-full h-11 px-3 text-sm font-mono uppercase bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passport-country"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Pays de délivrance
                  </label>
                  <input
                    id="passport-country"
                    type="text"
                    value={formData.passportIssueCountry}
                    onChange={(e) => updateField('passportIssueCountry', e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passport-issue"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date de délivrance
                  </label>
                  <input
                    id="passport-issue"
                    type="date"
                    value={formData.passportIssueDate}
                    onChange={(e) => updateField('passportIssueDate', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passport-expiry"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date d’expiration * (min. 6 mois après retour)
                  </label>
                  <input
                    id="passport-expiry"
                    type="date"
                    value={formData.passportExpiryDate}
                    onChange={(e) => updateField('passportExpiryDate', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="occupation"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Profession actuelle
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    placeholder="Ex: Ingénieure, Étudiant, Commerçant"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="employer"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Employeur ou établissement
                  </label>
                  <input
                    id="employer"
                    type="text"
                    value={formData.employerName}
                    onChange={(e) => updateField('employerName', e.target.value)}
                    placeholder="Nom de l'entreprise ou université"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  03. Coordonnées de contact et lieu d’hébergement
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  L’e-Visa et les notifications d’instruction seront transmis à l’adresse e-mail
                  indiquée ci-dessous.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address-line"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Adresse postale de résidence *
                  </label>
                  <input
                    id="address-line"
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => updateField('addressLine', e.target.value)}
                    placeholder="Numéro, rue, appartement"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postal-code"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Code postal
                  </label>
                  <input
                    id="postal-code"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Ville *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Adresse e-mail *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="nom@domaine.com"
                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Téléphone mobile *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full h-11 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Type d’hébergement à destination
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'hotel', label: 'Hôtel / Résidence' },
                        { id: 'prive', label: 'Hébergement privé' },
                        { id: 'universitaire', label: 'Campus universitaire' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateField('accommodationType', opt.id)}
                        className={`h-11 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                          formData.accommodationType === opt.id
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="host-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nom de l’hôtel, de l’hôte ou de l’institution *
                    </label>
                    <input
                      id="host-name"
                      type="text"
                      value={formData.hostName}
                      onChange={(e) => updateField('hostName', e.target.value)}
                      placeholder="Ex: Hôtel Saint-Germain"
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="host-address"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Adresse à destination
                    </label>
                    <input
                      id="host-address"
                      type="text"
                      value={formData.hostAddress}
                      onChange={(e) => updateField('hostAddress', e.target.value)}
                      placeholder="Rue, code postal, ville"
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emerg-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Contact d’urgence (nom complet)
                    </label>
                    <input
                      id="emerg-name"
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => updateField('emergencyContactName', e.target.value)}
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emerg-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Téléphone du contact d’urgence
                    </label>
                    <input
                      id="emerg-phone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                      className="w-full h-11 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    04. Pièces justificatives obligatoires
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Liste adaptée au visa <span className="font-medium text-slate-900">{selectedCategory.label}</span>.
                    Déposez vos fichiers depuis votre appareil.
                  </p>
                </div>

                {uploadedCount < requiredDocIds.length && (
                  <button
                    type="button"
                    onClick={() => requiredDocIds.forEach(attachSampleDocument)}
                    className="px-3 py-2 text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Joindre des spécimens de test
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {requiredDocIds.map((docId) => {
                  const req = DOCUMENT_REQUIREMENTS[docId];
                  const uploaded = formData.documents[docId];
                  if (!req) return null;

                  return (
                    <div
                      key={docId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {uploaded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <h3 className="text-sm font-semibold text-slate-900">
                            {req.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-6">
                          {req.description}
                        </p>
                        <p className="text-xs text-slate-500 pl-6">
                          Formats : {req.formats} · Max {req.maxSizeMb} Mo
                        </p>

                        {uploaded && (
                          <div className="pl-6 pt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-mono text-emerald-700 font-medium">
                              {uploaded.fileName}
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              {uploaded.fileSizeKb} Ko · Téléversé
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploaded ? 'Remplacer' : 'Choisir un fichier'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(docId, e)}
                            className="sr-only"
                          />
                        </label>

                        {uploaded ? (
                          <button
                            type="button"
                            onClick={() => removeDocument(docId)}
                            aria-label={`Supprimer ${req.title}`}
                            className="p-2 text-slate-500 hover:text-red-600 border border-slate-200 rounded-md hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => attachSampleDocument(docId)}
                            className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer whitespace-nowrap"
                          >
                            Spécimen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  05. Récapitulatif, déclaration et règlement des droits
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Relisez attentivement vos informations avant de valider le dépôt officiel.
                </p>
              </div>

              {/* Clean Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Demandeur</p>
                  <p className="font-semibold text-slate-950">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-xs text-slate-600">
                    Nationalité : {formData.nationality} · Né(e) le{' '}
                    <span className="font-mono tabular-nums">{formData.birthDate}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    Passeport :{' '}
                    <span className="font-mono font-medium text-slate-900">
                      {formData.passportNumber}
                    </span>{' '}
                    (exp. <span className="font-mono tabular-nums">{formData.passportExpiryDate}</span>)
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Séjour demandé</p>
                  <p className="font-semibold text-slate-950">{selectedDestination.name}</p>
                  <p className="text-xs text-slate-600">
                    {selectedCategory.label} ·{' '}
                    {formData.entryType === 'multiple' ? 'Entrées multiples' : 'Simple entrée'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Du <span className="font-mono tabular-nums">{formData.arrivalDate}</span> au{' '}
                    <span className="font-mono tabular-nums">{formData.departureDate}</span> (
                    <span className="tabular-nums">{stayDurationDays}</span> jours)
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              {(() => {
                const activePayMethod = PAYMENT_METHODS.some(
                  (m) => m.id === formData.paymentMethod
                )
                  ? formData.paymentMethod
                  : 'orange_money';
                const mobileMethods = PAYMENT_METHODS.filter((m) => m.group === 'mobile');
                const bankMethods = PAYMENT_METHODS.filter((m) => m.group === 'bank');
                const isMobileMoney =
                  activePayMethod === 'orange_money' ||
                  activePayMethod === 'mtn_momo' ||
                  activePayMethod === 'wave' ||
                  activePayMethod === 'moov_money';

                return (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Choix de l’opérateur de paiement ({fees.totalEur} EUR)
                      </span>
                      <span className="text-xs text-slate-500">
                        Transaction chiffrée · Confirmation immédiate
                      </span>
                    </div>

                    {/* Mobile Money Operators */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Opérateurs Mobile Money</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {mobileMethods.map((method) => {
                          const isSelected = activePayMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => updateField('paymentMethod', method.id)}
                              className={`p-3 rounded-md border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-blue-900 text-white border-blue-900'
                                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`px-2 py-1 rounded text-[11px] font-mono font-bold shrink-0 ${method.badgeBgClass}`}
                              >
                                {method.badgeText}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold truncate">
                                  {method.label}
                                </span>
                                <span
                                  className={`block text-[11px] truncate ${
                                    isSelected ? 'text-blue-100' : 'text-slate-500'
                                  }`}
                                >
                                  {method.sublabel}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bank & Card Operators */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cartes & Opérateurs bancaires</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {bankMethods.map((method) => {
                          const isSelected = activePayMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => updateField('paymentMethod', method.id)}
                              className={`p-3 rounded-md border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-blue-900 text-white border-blue-900'
                                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`px-2 py-1 rounded text-[11px] font-mono font-bold shrink-0 ${method.badgeBgClass}`}
                              >
                                {method.badgeText}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold truncate">
                                  {method.label}
                                </span>
                                <span
                                  className={`block text-[11px] truncate ${
                                    isSelected ? 'text-blue-100' : 'text-slate-500'
                                  }`}
                                >
                                  {method.sublabel}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operator-Specific Details */}
                    {isMobileMoney && (
                      <div className="p-4 border border-slate-200 rounded-md space-y-3 bg-slate-50/70">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                          <div>
                            <label
                              htmlFor="momo-phone"
                              className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                              Numéro de téléphone{' '}
                              {
                                PAYMENT_METHODS.find((m) => m.id === activePayMethod)
                                  ?.label
                              }{' '}
                              *
                            </label>
                            <input
                              id="momo-phone"
                              type="tel"
                              value={formData.mobileMoneyPhone ?? ''}
                              onChange={(e) =>
                                updateField('mobileMoneyPhone', e.target.value)
                              }
                              placeholder="Ex: 695613056"
                              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                            />
                          </div>
                          <div className="text-xs text-slate-600 leading-relaxed">
                            {activePayMethod === 'orange_money' && (
                              <span>
                                Une demande de confirmation USSD (<strong>#150#</strong>) sera
                                envoyée sur ce numéro pour autoriser le débit de{' '}
                                <strong className="font-mono">{fees.totalEur} EUR</strong>.
                              </span>
                            )}
                            {activePayMethod === 'mtn_momo' && (
                              <span>
                                Vous recevrez une notification MTN MoMo (<strong>*126#</strong>)
                                afin de valider le paiement avec votre code secret.
                              </span>
                            )}
                            {activePayMethod === 'wave' && (
                              <span>
                                Validez la transaction instantanément depuis votre application
                                mobile Wave associée à ce numéro.
                              </span>
                            )}
                            {activePayMethod === 'moov_money' && (
                              <span>
                                Confirmez le prélèvement depuis votre menu Moov Money après
                                validation du formulaire.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activePayMethod === 'carte' && (
                      <div className="p-4 border border-slate-200 rounded-md space-y-3 bg-slate-50/70">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label
                              htmlFor="card-network"
                              className="block text-xs font-medium text-slate-600 mb-1"
                            >
                              Réseau bancaire
                            </label>
                            <select
                              id="card-network"
                              value={formData.cardNetwork ?? 'Visa'}
                              onChange={(e) => updateField('cardNetwork', e.target.value)}
                              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
                            >
                              <option value="Visa">Visa</option>
                              <option value="Mastercard">Mastercard</option>
                              <option value="GIMAC / GIM-UEMOA">GIMAC / GIM-UEMOA</option>
                              <option value="American Express">American Express</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="card-number"
                              className="block text-xs font-medium text-slate-600 mb-1"
                            >
                              Numéro de carte
                            </label>
                            <input
                              id="card-number"
                              type="text"
                              value={cardNumberInput}
                              onChange={(e) => setCardNumberInput(e.target.value)}
                              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="card-exp"
                              className="block text-xs font-medium text-slate-600 mb-1"
                            >
                              Expiration
                            </label>
                            <input
                              id="card-exp"
                              type="text"
                              value={cardExpiryInput}
                              onChange={(e) => setCardExpiryInput(e.target.value)}
                              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="card-cvc"
                              className="block text-xs font-medium text-slate-600 mb-1"
                            >
                              CVC
                            </label>
                            <input
                              id="card-cvc"
                              type="text"
                              value={cardCvcInput}
                              onChange={(e) => setCardCvcInput(e.target.value)}
                              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activePayMethod === 'virement_bancaire' && (
                      <div className="p-4 border border-slate-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70">
                        <div>
                          <label
                            htmlFor="bank-operator"
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Opérateur bancaire *
                          </label>
                          <select
                            id="bank-operator"
                            value={formData.bankOperator ?? BANK_OPERATORS[0]}
                            onChange={(e) => updateField('bankOperator', e.target.value)}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900"
                          >
                            {BANK_OPERATORS.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="bank-ref"
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            IBAN, RIB ou référence de virement *
                          </label>
                          <input
                            id="bank-ref"
                            type="text"
                            value={formData.bankAccountRef ?? ''}
                            onChange={(e) => updateField('bankAccountRef', e.target.value)}
                            placeholder="Ex: CM21 10005 00001 ..."
                            className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {activePayMethod === 'paypal' && (
                      <div className="p-4 border border-slate-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-slate-50/70">
                        <div>
                          <label
                            htmlFor="paypal-email"
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Adresse e-mail du compte PayPal *
                          </label>
                          <input
                            id="paypal-email"
                            type="email"
                            value={formData.paypalEmail ?? ''}
                            onChange={(e) => updateField('paypalEmail', e.target.value)}
                            placeholder="nom@exemple.com"
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900"
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          Vous serez authentifié sur la passerelle sécurisée pour confirmer le
                          règlement de <strong className="font-mono">{fees.totalEur} EUR</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sworn Declarations */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.declarationTruthful}
                    onChange={(e) => updateField('declarationTruthful', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-blue-900 rounded cursor-pointer"
                  />
                  <span>
                    Je certifie sur l’honneur que l’ensemble des renseignements fournis et des
                    pièces jointes sont exacts et authentiques.
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.declarationPrivacy}
                    onChange={(e) => updateField('declarationPrivacy', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-blue-900 rounded cursor-pointer"
                  />
                  <span>
                    J’accepte le traitement consulaire de mes données personnelles et biométriques
                    conformément à la réglementation en vigueur.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Wizard Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                currentStep === 1
                  ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                  : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape précédente</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Enregistrement...' : 'Valider et déposer la demande'}</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Sticky Dossier & Fee Summary Rail */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 lg:sticky lg:top-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-slate-500">Synthèse en direct</p>
            <h3 className="font-display text-lg font-bold text-slate-950 mt-0.5">
              {selectedDestination.name}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {selectedCategory.label} ·{' '}
              {formData.entryType === 'multiple' ? 'Entrées multiples' : 'Simple entrée'}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Durée du séjour</span>
              <span className="font-mono font-medium text-slate-950 tabular-nums">
                {stayDurationDays > 0 ? `${stayDurationDays} jours` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Cadence d’instruction</span>
              <span className="font-medium text-slate-900">
                {PROCESSING_OPTIONS[formData.processingTier].delayLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Pièces justificatives</span>
              <span className="font-mono font-medium text-slate-950 tabular-nums">
                {uploadedCount} / {requiredDocIds.length}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-slate-700 mb-2">Détail des droits</p>
            <div className="flex items-center justify-between text-slate-600">
              <span>Droits consulaires</span>
              <span className="font-mono tabular-nums">{fees.consularFee} EUR</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Frais biométriques</span>
              <span className="font-mono tabular-nums">{fees.biometricFee} EUR</span>
            </div>
            {fees.multipleEntryFee > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Option entrées multiples</span>
                <span className="font-mono tabular-nums">{fees.multipleEntryFee} EUR</span>
              </div>
            )}
            {fees.processingFee > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Option {formData.processingTier}</span>
                <span className="font-mono tabular-nums">{fees.processingFee} EUR</span>
              </div>
            )}
            <div className="pt-3 mt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-950">Total à régler</span>
              <span className="font-mono text-lg font-bold text-blue-900 tabular-nums">
                {fees.totalEur} EUR
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
