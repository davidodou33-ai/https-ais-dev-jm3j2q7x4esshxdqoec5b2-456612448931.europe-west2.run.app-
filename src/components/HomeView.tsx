import { useState } from 'react';
import { ArrowRight, Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import WhatsappSupportRow from './WhatsappSupportRow';
import {
  DESTINATIONS,
  NATIONALITIES,
  VISA_CATEGORIES,
  calculateFeeBreakdown,
} from '../data/visaCatalog';
import { VisaCategoryId } from '../types/visa';

interface HomeViewProps {
  onStartApplication: (preset?: {
    destinationId: string;
    visaCategory: VisaCategoryId;
    nationality: string;
  }) => void;
  onOpenTracker: () => void;
  dossierCount: number;
}

export default function HomeView({
  onStartApplication,
  onOpenTracker,
  dossierCount,
}: HomeViewProps) {
  const [simDestination, setSimDestination] = useState<string>('schengen-fr');
  const [simCategory, setSimCategory] = useState<VisaCategoryId>('tourisme');
  const [simNationality, setSimNationality] = useState<string>('Marocaine');

  const [heroImgError, setHeroImgError] = useState(false);
  const [deskImgError, setDeskImgError] = useState(false);
  const [officerImgError, setOfficerImgError] = useState(false);

  const selectedDest =
    DESTINATIONS.find((d) => d.id === simDestination) ?? DESTINATIONS[0];
  const selectedCat = VISA_CATEGORIES[simCategory];
  const fee = calculateFeeBreakdown(simDestination, simCategory, 'simple', 'standard');

  return (
    <div className="space-y-12 pb-16">
      {/* Split Hero Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Value Proposition + Quick Eligibility Estimator */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-lg p-6 sm:p-10">
            <div className="space-y-5">
              <p className="text-xs font-medium text-slate-500 tracking-wide">
                Guichet consulaire électronique · Procédure dématérialisée
              </p>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-950 leading-[1.12] [text-wrap:balance]">
                Déposez et suivez votre demande de visa en ligne.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Préparez votre dossier consulaire étape par étape, téléversez vos pièces
                justificatives certifiées et obtenez votre récépissé officiel avec suivi en temps
                réel.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onStartApplication()}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
                >
                  <span>Commencer une demande</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenTracker}
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-950 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Suivre un dossier ({dossierCount})
                </button>
              </div>
            </div>

            {/* Integrated Eligibility & Fee Quick Estimator */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Simulateur rapide d’éligibilité et de frais
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {selectedCat.requiredDocIds.length} pièces requises
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="sim-nationality"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Nationalité
                  </label>
                  <select
                    id="sim-nationality"
                    value={simNationality}
                    onChange={(e) => setSimNationality(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {NATIONALITIES.map((nat) => (
                      <option key={nat} value={nat}>
                        {nat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-destination"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Destination
                  </label>
                  <select
                    id="sim-destination"
                    value={simDestination}
                    onChange={(e) => setSimDestination(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {DESTINATIONS.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-category"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Motif de séjour
                  </label>
                  <select
                    id="sim-category"
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value as VisaCategoryId)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                  >
                    {Object.values(VISA_CATEGORIES).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Frais estimés : </span>
                    <span className="font-mono font-medium text-slate-950 tabular-nums">
                      {fee.totalEur} EUR
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Délai standard : </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {selectedDest.standardDays} jours ouvrés
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Séjour max : </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {selectedCat.maxDurationDays} jours
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onStartApplication({
                      destinationId: simDestination,
                      visaCategory: simCategory,
                      nationality: simNationality,
                    })
                  }
                  className="text-sm font-medium text-blue-900 hover:text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Pré-remplir avec ces critères
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Consular Architectural Photography */}
          <div className="lg:col-span-5 relative rounded-lg overflow-hidden border border-slate-200 bg-slate-200 min-h-[340px]">
            {!heroImgError ? (
              <img
                src="/src/assets/images/hero_consular_architecture_1794603584816.jpg"
                alt="Hall d'accueil architectural du guichet consulaire"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="w-full h-full lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium">Guichet Consulaire Numérique</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent text-white">
              <p className="text-xs font-medium text-slate-200">
                Service de délivrance dématérialisée · Chiffrement conforme RGPD
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                5 zones consulaires couvertes · Dépôt 24h/24 et 7j/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column KPI / Service Strip */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <div className="p-6">
            <p className="text-xs font-medium text-slate-500">Délai d’instruction standard</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
              5 jours ouvrés
            </p>
            <p className="mt-1 text-xs text-slate-600">Option express sous 24 heures</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium text-slate-500">Droits consulaires dès</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
              60 EUR
            </p>
            <p className="mt-1 text-xs text-slate-600">Barème officiel transparent sans surprise</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium text-slate-500">Validité maximale</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
              12 à 36 mois
            </p>
            <p className="mt-1 text-xs text-slate-600">Entrées simples ou multiples</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium text-slate-500">Dossiers enregistrés</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
              {dossierCount}
            </p>
            <p className="mt-1 text-xs text-slate-600">Suivi horodaté étape par étape</p>
          </div>
        </div>
      </section>

      {/* Editorial Procedure & Document Prep Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Passport Desk Photo + Specialist Support Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]">
              {!deskImgError ? (
                <img
                  src="/src/assets/images/visa_passport_desk_1794603587010.jpg"
                  alt="Passeport biométrique et dossier de voyage préparé pour une demande de visa"
                  referrerPolicy="no-referrer"
                  onError={() => setDeskImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
                  <FileCheck2 className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">Préparation du dossier de voyage</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  {!officerImgError ? (
                    <img
                      src="/assets/aistudio/6613FD9A-DAF0-4136-AB95-00C22474C224_cf25d516.png"
                      alt="Assistant client Visa Travelling"
                      referrerPolicy="no-referrer"
                      onError={() => setOfficerImgError(true)}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    Assistant client · Visa Travelling
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Chargé d’assistance et de conformité documentaire
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Contrôle préalable des pièces sous 24 heures ouvrées
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <WhatsappSupportRow compact />
              </div>
            </div>
          </div>

          {/* Right: Numbered Procedure Steps */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-slate-950 tracking-tight">
              Comment fonctionne le dépôt en ligne
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Une démarche structurée en quatre phases pour éviter les rejets pour pièce
              manquante et recevoir votre autorisation électronique directement dans votre espace.
            </p>

            <div className="mt-6 divide-y divide-slate-200">
              <div className="py-5 first:pt-0">
                <h3 className="text-base font-semibold text-slate-900">
                  01. Sélection du visa et vérification des dates
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Choisissez la destination, le motif de séjour et la cadence d’instruction. La
                  validité de votre passeport (6 mois après la date de retour) est vérifiée
                  automatiquement.
                </p>
              </div>

              <div className="py-5">
                <h3 className="text-base font-semibold text-slate-900">
                  02. Saisie de l’état civil et de l’hébergement
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Renseignez vos informations d’identité, coordonnées de résidence et adresse
                  d’accueil à destination. Votre brouillon reste sauvegardé localement à chaque
                  champ.
                </p>
              </div>

              <div className="py-5">
                <h3 className="text-base font-semibold text-slate-900">
                  03. Téléversement des pièces justificatives
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Déposez votre passeport, photo OACI et justificatifs au format PDF ou image. La
                  liste des pièces s’adapte automatiquement à la catégorie de visa sélectionnée.
                </p>
              </div>

              <div className="py-5 last:pb-0">
                <h3 className="text-base font-semibold text-slate-900">
                  04. Règlement des frais et délivrance du récépissé
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Validez votre déclaration sur l’honneur, réglez les droits consulaires et obtenez
                  un numéro de dossier unique permettant le suivi en temps réel et l’impression de
                  l’attestation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
