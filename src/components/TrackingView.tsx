import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Mail,
  Printer,
  Search,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { DOCUMENT_REQUIREMENTS } from '../data/visaCatalog';
import { DossierStatus, UploadedDocument, VisaDossier } from '../types/visa';
import { downloadVisaReceiptPdf } from '../utils/generateReceiptPdf';
import WhatsappSupportRow from './WhatsappSupportRow';

interface TrackingViewProps {
  dossiers: VisaDossier[];
  selectedReference: string | null;
  onSelectReference: (ref: string) => void;
  onResolveActionRequired: (ref: string, docId: string, doc: UploadedDocument) => void;
  onAdvanceDossierStep: (ref: string) => void;
  onStartNew: () => void;
}

type FilterTab = 'tous' | 'en_cours' | 'action_requise' | 'approuve';

interface SimulatedEmailNotification {
  id: string;
  reference: string;
  recipientEmail: string;
  applicantName: string;
  status: DossierStatus;
  subject: string;
  body: string;
  sentAt: string;
}

function buildSimulatedEmail(dossier: VisaDossier): SimulatedEmailNotification {
  const sentAt = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  let subjectStatus = 'Mise à jour de votre demande';
  let body = '';

  switch (dossier.status) {
    case 'verification_pieces':
      subjectStatus = 'Dossier reçu · Vérification des pièces en cours';
      body = `Bonjour ${dossier.applicantFullName},\n\nVotre demande de visa (${dossier.visaCategoryLabel}) à destination de ${dossier.destinationName} a bien été enregistrée sous la référence ${dossier.reference}.\n\nNos services procèdent actuellement au contrôle de conformité de vos pièces justificatives.`;
      break;
    case 'en_instruction':
      subjectStatus = 'Pièces validées · Dossier en cours d’instruction consulaire';
      body = `Bonjour ${dossier.applicantFullName},\n\nL’ensemble de vos pièces justificatives pour le dossier ${dossier.reference} a été validé. Votre demande est désormais en cours d’instruction auprès du service consulaire compétent (${dossier.destinationName}).\n\nVous serez averti(e) par e-mail dès qu’une décision sera émise.`;
      break;
    case 'action_requise':
      subjectStatus = 'Action requise · Pièce justificative complémentaire demandée';
      body = `Bonjour ${dossier.applicantFullName},\n\nLors du contrôle de votre dossier ${dossier.reference}, une pièce complémentaire a été demandée : ${dossier.missingDocReason ?? 'Merci de consulter votre espace de suivi.'}\n\nConnectez-vous à votre suivi de dossier pour déposer le document corrigé sans frais supplémentaires.`;
      break;
    case 'approuve':
      subjectStatus = 'Décision favorable · Votre e-Visa est disponible';
      body = `Bonjour ${dossier.applicantFullName},\n\nNous avons le plaisir de vous informer que votre demande de visa ${dossier.reference} pour ${dossier.destinationName} (séjour du ${dossier.arrivalDate} au ${dossier.departureDate}) a été APPROUVÉE.\n\nVotre autorisation électronique (e-Visa) est disponible en téléchargement PDF depuis votre espace de suivi.`;
      break;
    case 'refuse':
      subjectStatus = 'Décision consulaire émise concernant votre demande';
      body = `Bonjour ${dossier.applicantFullName},\n\nAprès examen de votre dossier ${dossier.reference}, l’autorité consulaire n’a pas pu donner une suite favorable à votre demande de visa pour ${dossier.destinationName}.\n\nLe détail du motif figure dans la chronologie de votre espace de suivi.`;
      break;
  }

  return {
    id: `mail-${dossier.reference}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    reference: dossier.reference,
    recipientEmail: dossier.email,
    applicantName: dossier.applicantFullName,
    status: dossier.status,
    subject: `[Visa Travelling] Dossier ${dossier.reference} — ${subjectStatus}`,
    body,
    sentAt,
  };
}

function getStatusMeta(status: DossierStatus) {
  switch (status) {
    case 'approuve':
      return {
        label: 'Approuvé · e-Visa prêt',
        textClass: 'text-emerald-700',
        Icon: CheckCircle2,
      };
    case 'action_requise':
      return {
        label: 'Action requise',
        textClass: 'text-amber-700',
        Icon: AlertTriangle,
      };
    case 'verification_pieces':
      return {
        label: 'Vérification des pièces',
        textClass: 'text-blue-800',
        Icon: Clock,
      };
    case 'en_instruction':
      return {
        label: 'En instruction',
        textClass: 'text-blue-800',
        Icon: Clock,
      };
    case 'refuse':
      return {
        label: 'Refusé',
        textClass: 'text-red-700',
        Icon: XCircle,
      };
  }
}

export default function TrackingView({
  dossiers,
  selectedReference,
  onSelectReference,
  onResolveActionRequired,
  onAdvanceDossierStep,
  onStartNew,
}: TrackingViewProps) {
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('tous');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [emailHistory, setEmailHistory] = useState<SimulatedEmailNotification[]>([]);
  const [activeEmailBanner, setActiveEmailBanner] =
    useState<SimulatedEmailNotification | null>(null);
  const [previewEmail, setPreviewEmail] = useState<SimulatedEmailNotification | null>(null);

  const prevStatusMapRef = useRef<Record<string, DossierStatus>>(
    Object.fromEntries(dossiers.map((d) => [d.reference, d.status]))
  );

  useEffect(() => {
    const prevMap = prevStatusMapRef.current;
    const changedDossiers = dossiers.filter(
      (d) => prevMap[d.reference] !== undefined && prevMap[d.reference] !== d.status
    );

    prevStatusMapRef.current = Object.fromEntries(
      dossiers.map((d) => [d.reference, d.status])
    );

    if (emailAlertsEnabled && changedDossiers.length > 0) {
      const generated = changedDossiers.map(buildSimulatedEmail);
      setEmailHistory((prev) => [...generated, ...prev]);
      setActiveEmailBanner(generated[0]);
    }
  }, [dossiers, emailAlertsEnabled]);

  const handleDownloadPdf = async (dossier: VisaDossier) => {
    setIsDownloadingPdf(true);
    try {
      await downloadVisaReceiptPdf(dossier);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const filteredDossiers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dossiers.filter((d) => {
      const matchesTab =
        filterTab === 'tous'
          ? true
          : filterTab === 'en_cours'
            ? d.status === 'en_instruction' || d.status === 'verification_pieces'
            : d.status === filterTab;

      const matchesQuery =
        !q ||
        d.reference.toLowerCase().includes(q) ||
        d.applicantFullName.toLowerCase().includes(q) ||
        d.passportNumber.toLowerCase().includes(q) ||
        d.destinationName.toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });
  }, [dossiers, filterTab, query]);

  const activeDossier =
    filteredDossiers.find((d) => d.reference === selectedReference) ??
    filteredDossiers[0] ??
    null;

  const handleMissingDocUpload = (
    dossier: VisaDossier,
    docId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onResolveActionRequired(dossier.reference, docId, {
      docId,
      fileName: file.name,
      fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
      uploadedAt: new Date().toISOString(),
      mimeType: file.type || 'application/pdf',
    });
  };

  const handleAttachSampleFix = (dossier: VisaDossier, docId: string) => {
    onResolveActionRequired(dossier.reference, docId, {
      docId,
      fileName: `${docId}_certifie_hd.pdf`,
      fileSizeKb: 1120,
      uploadedAt: new Date().toISOString(),
      mimeType: 'application/pdf',
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header & Controls */}
      <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Suivi consulaire en temps réel · {dossiers.length} dossiers enregistrés
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
            Suivi des demandes de visa
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, nom ou passeport..."
              aria-label="Rechercher un dossier"
              className="w-full sm:w-64 h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md overflow-x-auto">
            {(
              [
                { id: 'tous', label: 'Tous' },
                { id: 'en_cours', label: 'En cours' },
                { id: 'action_requise', label: 'Action requise' },
                { id: 'approuve', label: 'Approuvés' },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated Email Notification Banner */}
      {activeEmailBanner && (
        <div
          role="status"
          aria-live="polite"
          className="no-print p-4 rounded-md bg-blue-50 border border-blue-200 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <Mail className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <div className="min-w-0 text-xs sm:text-sm">
              <p className="font-semibold text-slate-950">
                Notification e-mail simulée envoyée à{' '}
                <span className="font-mono">{activeEmailBanner.recipientEmail}</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5 truncate">
                {activeEmailBanner.subject} · {activeEmailBanner.sentAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
            <button
              type="button"
              onClick={() => setPreviewEmail(activeEmailBanner)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 whitespace-nowrap cursor-pointer"
            >
              Lire l’e-mail
            </button>
            <button
              type="button"
              onClick={() => setActiveEmailBanner(null)}
              aria-label="Fermer la notification e-mail"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-blue-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Split: Dossier Table/List + Detail Panel */}
      {filteredDossiers.length === 0 ? (
        <div className="no-print bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-slate-900">
            Aucun dossier ne correspond à votre recherche
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Vérifiez le numéro de référence (format VIS-2026-XXXXXX) ou modifiez les filtres actifs.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilterTab('tous');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
            <button
              type="button"
              onClick={onStartNew}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer"
            >
              Nouvelle demande
            </button>
          </div>
        </div>
      ) : (
        <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dossier List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {filteredDossiers.map((dossier) => {
              const isSelected = activeDossier?.reference === dossier.reference;
              const statusMeta = getStatusMeta(dossier.status);
              const StatusIcon = statusMeta.Icon;

              return (
                <button
                  key={dossier.reference}
                  type="button"
                  onClick={() => onSelectReference(dossier.reference)}
                  className={`w-full text-left p-4 sm:p-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-medium text-slate-900 tabular-nums">
                      {dossier.reference}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>

                  <p className="mt-2 font-semibold text-sm text-slate-950">
                    {dossier.applicantFullName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {dossier.destinationName} · {dossier.visaCategoryLabel}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      Passeport {dossier.passportNumber}
                    </span>
                    <span className="font-mono tabular-nums">{dossier.totalFeeEur} EUR</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Dossier Detail Inspector */}
          {activeDossier && (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    Référence {activeDossier.reference}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
                    {activeDossier.applicantFullName}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {activeDossier.destinationName} · {activeDossier.visaCategoryLabel}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={() => handleDownloadPdf(activeDossier)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isDownloadingPdf
                        ? 'Génération PDF...'
                        : activeDossier.status === 'approuve'
                          ? 'Télécharger e-Visa (PDF)'
                          : 'Télécharger récépissé (PDF)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Aperçu</span>
                  </button>

                  {activeDossier.status !== 'approuve' &&
                    activeDossier.status !== 'action_requise' && (
                      <button
                        type="button"
                        onClick={() => onAdvanceDossierStep(activeDossier.reference)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Simuler l’étape suivante
                      </button>
                    )}
                </div>
              </div>

              {/* Action Required Alert & Inline Fix */}
              {activeDossier.status === 'action_requise' && activeDossier.missingDocId && (
                <div className="p-4 sm:p-5 rounded-md bg-amber-50 border border-amber-300 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-950">
                        Complément de pièce demandé :{' '}
                        {DOCUMENT_REQUIREMENTS[activeDossier.missingDocId]?.title}
                      </p>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        {activeDossier.missingDocReason}
                      </p>
                    </div>
                  </div>

                  <div className="pl-6 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-amber-950 bg-white border border-amber-400 rounded-md hover:bg-amber-100 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Téléverser le document corrigé</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleMissingDocUpload(
                            activeDossier,
                            activeDossier.missingDocId!,
                            e
                          )
                        }
                        className="sr-only"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        handleAttachSampleFix(activeDossier, activeDossier.missingDocId!)
                      }
                      className="text-xs font-medium text-amber-950 underline hover:text-amber-800 cursor-pointer"
                    >
                      Joindre un justificatif conforme (test)
                    </button>
                  </div>
                </div>
              )}

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Passeport</p>
                  <p className="font-mono font-medium text-slate-950 mt-0.5">
                    {activeDossier.passportNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nationalité</p>
                  <p className="font-medium text-slate-950 mt-0.5">
                    {activeDossier.nationality}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Séjour prévu</p>
                  <p className="font-mono text-xs font-medium text-slate-950 mt-1 tabular-nums">
                    {activeDossier.arrivalDate} → {activeDossier.departureDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Droits acquittés</p>
                  <p className="font-mono font-medium text-slate-950 mt-0.5 tabular-nums">
                    {activeDossier.totalFeeEur} EUR
                  </p>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-950 mb-4">
                  Historique d’instruction consulaire
                </h3>
                <ol className="space-y-4">
                  {activeDossier.timeline.map((step) => (
                    <li key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : step.current ? (
                          <Clock className="w-4 h-4 text-blue-800" />
                        ) : (
                          <span className="block w-4 h-4 rounded-full border border-slate-300 bg-slate-50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              step.completed || step.current
                                ? 'text-slate-950'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          <span className="text-xs font-mono text-slate-500 tabular-nums">
                            {step.date}
                          </span>
                        </div>
                        {step.note && (
                          <p className="text-xs text-slate-600 mt-0.5">{step.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Attached Documents List */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-950 mb-3">
                  Pièces transmises ({Object.keys(activeDossier.documents).length})
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                  {Object.values(activeDossier.documents).map((doc) => (
                    <div
                      key={doc.docId}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-900 truncate">
                          {DOCUMENT_REQUIREMENTS[doc.docId]?.title ?? doc.docId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 shrink-0">
                        <span className="font-mono hidden sm:inline">{doc.fileName}</span>
                        <span className="font-mono tabular-nums">{doc.fileSizeKb} Ko</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Email Notifications Log & Preference */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-950">
                      Notifications par e-mail (simulation)
                    </h3>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlertsEnabled}
                      onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                    />
                    <span>Alerte automatique à chaque changement de statut</span>
                  </label>
                </div>

                {(() => {
                  const dossierEmails = emailHistory.filter(
                    (m) => m.reference === activeDossier.reference
                  );
                  if (dossierEmails.length === 0) {
                    return (
                      <p className="text-xs text-slate-500">
                        Aucun e-mail émis durant cette session pour ce dossier. Cliquez sur
                        « Simuler l’étape suivante » ou déposez une pièce pour déclencher une
                        notification vers <span className="font-mono">{activeDossier.email}</span>.
                      </p>
                    );
                  }
                  return (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                      {dossierEmails.map((mail) => (
                        <div
                          key={mail.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {mail.subject}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                              À : {mail.recipientEmail} · Envoyé à {mail.sentAt}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewEmail(mail)}
                            className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Aperçu
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <WhatsappSupportRow compact />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Official Receipt / e-Visa Modal */}
      {showReceiptModal && activeDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-title"
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
              <p className="text-xs font-medium text-slate-500">Document officiel dématérialisé</p>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                aria-label="Fermer"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/src/assets/images/logo_visa_travelling_1794604358248.jpg"
                      alt="Logo Visa Travelling"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                    <p className="font-display text-lg font-bold text-slate-950">Visa Travelling</p>
                  </div>
                  <h3 id="receipt-title" className="font-display text-xl font-bold text-slate-950 mt-3">
                    {activeDossier.status === 'approuve'
                      ? 'Autorisation Électronique de Voyage (e-Visa)'
                      : 'Récépissé Officiel de Dépôt de Demande'}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Numéro de dossier</p>
                  <p className="font-mono text-base font-bold text-blue-900 tabular-nums">
                    {activeDossier.reference}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Titulaire</p>
                  <p className="font-semibold text-slate-950 mt-0.5">
                    {activeDossier.applicantFullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Numéro de passeport</p>
                  <p className="font-mono font-semibold text-slate-950 mt-0.5">
                    {activeDossier.passportNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {activeDossier.destinationName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Catégorie & Entrées</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {activeDossier.visaCategoryLabel} ·{' '}
                    {activeDossier.entryType === 'multiple' ? 'Multiples' : 'Simple'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dates de validité du séjour</p>
                  <p className="font-mono text-slate-900 mt-0.5 tabular-nums">
                    {activeDossier.arrivalDate} au {activeDossier.departureDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Droits consulaires acquittés</p>
                  <p className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">
                    {activeDossier.totalFeeEur} EUR
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 leading-relaxed">
                {activeDossier.status === 'approuve'
                  ? 'Le présent document atteste de la délivrance de votre autorisation électronique de séjour. Il doit être présenté à l’embarquement et aux contrôles aux frontières accompagné du passeport biométrique référencé ci-dessus.'
                  : 'Votre demande est enregistrée et en cours de traitement par les services consulaires compétents. Conservez ce numéro de référence pour suivre l’avancement ou déposer une pièce complémentaire.'}
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={() => handleDownloadPdf(activeDossier)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isDownloadingPdf ? 'Génération...' : 'Télécharger en PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Email Preview Modal */}
      {previewEmail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-preview-title"
          className="no-print fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-900" />
                <p id="email-preview-title" className="text-sm font-semibold text-slate-950">
                  Aperçu de la notification e-mail (simulation)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                aria-label="Fermer l’aperçu e-mail"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md p-3.5">
              <p>
                <span className="text-slate-500">De : </span>
                <span className="font-mono text-slate-900">
                  ne-pas-repondre@visatravelling.org
                </span>
              </p>
              <p>
                <span className="text-slate-500">À : </span>
                <span className="font-mono text-slate-900">{previewEmail.recipientEmail}</span>
              </p>
              <p>
                <span className="text-slate-500">Objet : </span>
                <span className="font-semibold text-slate-950">{previewEmail.subject}</span>
              </p>
              <p>
                <span className="text-slate-500">Horodatage : </span>
                <span className="font-mono tabular-nums text-slate-700">
                  {previewEmail.sentAt}
                </span>
              </p>
            </div>

            <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed border border-slate-200 rounded-md p-4">
              {previewEmail.body}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
