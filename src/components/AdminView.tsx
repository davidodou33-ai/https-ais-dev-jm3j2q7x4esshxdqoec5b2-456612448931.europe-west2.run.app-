import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  EUROPEAN_EMBASSIES,
  EuropeanEmbassyContact,
  EuropeanZone,
} from '../data/europeanEmbassies';
import { DESTINATIONS, DOCUMENT_REQUIREMENTS, VISA_CATEGORIES } from '../data/visaCatalog';
import { DossierStatus, VisaDossier } from '../types/visa';

const EMBASSIES_STORAGE_KEY = 'consulpass_eu_embassies_v1';

function loadEmbassies(): EuropeanEmbassyContact[] {
  try {
    const raw = localStorage.getItem(EMBASSIES_STORAGE_KEY);
    if (!raw) return EUROPEAN_EMBASSIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EUROPEAN_EMBASSIES;
  } catch {
    return EUROPEAN_EMBASSIES;
  }
}

interface AdminViewProps {
  dossiers: VisaDossier[];
  onUpdateStatus: (
    reference: string,
    newStatus: DossierStatus,
    options?: {
      note?: string;
      missingDocId?: string;
      missingDocReason?: string;
      officerName?: string;
    }
  ) => void;
  onAddNote: (reference: string, note: string, officerName: string) => void;
  onDeleteDossier: (reference: string) => void;
  onResetSampleDossiers: () => void;
}

type AdminTab = 'queue' | 'embassies' | 'analytics' | 'settings';
type QueueFilter = 'tous' | 'a_traiter' | 'action_requise' | 'approuve' | 'refuse';
type EmbassyZoneFilter = 'toutes' | EuropeanZone;

function getStatusInfo(status: DossierStatus) {
  switch (status) {
    case 'approuve':
      return {
        label: 'Approuvé',
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
        label: 'Vérif. pièces',
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

export default function AdminView({
  dossiers,
  onUpdateStatus,
  onAddNote,
  onDeleteDossier,
  onResetSampleDossiers,
}: AdminViewProps) {
  const [adminTab, setAdminTab] = useState<AdminTab>('queue');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('tous');
  const [destFilter, setDestFilter] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRef, setSelectedRef] = useState<string | null>(
    () => dossiers[0]?.reference ?? null
  );

  // Consular operator state
  const [officerName, setOfficerName] = useState<string>('Claire Moreau — Pôle Visas');
  const [customNote, setCustomNote] = useState<string>('');
  const [requestDocId, setRequestDocId] = useState<string>('passeport');
  const [requestDocReason, setRequestDocReason] = useState<string>(
    'Le document transmis est partiellement illisible. Merci de fournir un scan net en haute résolution.'
  );
  const [refusalReason, setRefusalReason] = useState<string>(
    'Conditions de séjour ou justificatifs de ressources insuffisants au regard de la durée demandée.'
  );
  const [showRequestDocForm, setShowRequestDocForm] = useState<boolean>(false);
  const [showRefusalForm, setShowRefusalForm] = useState<boolean>(false);
  const [confirmDeleteRef, setConfirmDeleteRef] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // European embassies directory state
  const [embassies, setEmbassies] = useState<EuropeanEmbassyContact[]>(() => loadEmbassies());
  const [embassySearch, setEmbassySearch] = useState<string>('');
  const [embassyZoneFilter, setEmbassyZoneFilter] = useState<EmbassyZoneFilter>('toutes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingEmbassyId, setEditingEmbassyId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EuropeanEmbassyContact | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(EMBASSIES_STORAGE_KEY, JSON.stringify(embassies));
    } catch {
      // Ignore storage quota errors
    }
  }, [embassies]);

  const filteredEmbassies = useMemo(() => {
    const q = embassySearch.trim().toLowerCase();
    return embassies.filter((item) => {
      const matchesZone =
        embassyZoneFilter === 'toutes' || item.zone === embassyZoneFilter;
      const matchesSearch =
        !q ||
        item.country.toLowerCase().includes(q) ||
        item.missionName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.visaCenterNote.toLowerCase().includes(q);
      return matchesZone && matchesSearch;
    });
  }, [embassies, embassySearch, embassyZoneFilter]);

  const handleCopyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const stats = useMemo(() => {
    const total = dossiers.length;
    const pendingReview = dossiers.filter(
      (d) => d.status === 'verification_pieces' || d.status === 'en_instruction'
    ).length;
    const actionRequired = dossiers.filter((d) => d.status === 'action_requise').length;
    const approved = dossiers.filter((d) => d.status === 'approuve').length;
    const decided = dossiers.filter(
      (d) => d.status === 'approuve' || d.status === 'refuse'
    ).length;
    const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
    const totalRevenueEur = dossiers.reduce((sum, d) => sum + d.totalFeeEur, 0);

    return {
      total,
      pendingReview,
      actionRequired,
      approved,
      approvalRate,
      totalRevenueEur,
    };
  }, [dossiers]);

  const filteredDossiers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dossiers.filter((d) => {
      const matchesStatus =
        queueFilter === 'tous'
          ? true
          : queueFilter === 'a_traiter'
            ? d.status === 'verification_pieces' || d.status === 'en_instruction'
            : d.status === queueFilter;

      const matchesDest = destFilter === 'toutes' || d.destinationId === destFilter;

      const matchesQuery =
        !q ||
        d.reference.toLowerCase().includes(q) ||
        d.applicantFullName.toLowerCase().includes(q) ||
        d.passportNumber.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.destinationName.toLowerCase().includes(q);

      return matchesStatus && matchesDest && matchesQuery;
    });
  }, [dossiers, queueFilter, destFilter, searchQuery]);

  const activeDossier =
    filteredDossiers.find((d) => d.reference === selectedRef) ??
    filteredDossiers[0] ??
    null;

  const destinationBreakdown = useMemo(() => {
    return DESTINATIONS.map((dest) => {
      const items = dossiers.filter((d) => d.destinationId === dest.id);
      const revenue = items.reduce((s, d) => s + d.totalFeeEur, 0);
      const approvedCount = items.filter((d) => d.status === 'approuve').length;
      return {
        id: dest.id,
        name: dest.name,
        count: items.length,
        approvedCount,
        revenue,
      };
    });
  }, [dossiers]);

  const categoryBreakdown = useMemo(() => {
    return Object.values(VISA_CATEGORIES).map((cat) => {
      const items = dossiers.filter((d) => d.visaCategory === cat.id);
      const revenue = items.reduce((s, d) => s + d.totalFeeEur, 0);
      return {
        id: cat.id,
        label: cat.label,
        count: items.length,
        revenue,
      };
    });
  }, [dossiers]);

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Reference',
      'DateDepot',
      'Demandeur',
      'Nationalite',
      'Passeport',
      'Email',
      'Destination',
      'Categorie',
      'Entrees',
      'Cadence',
      'Arrivee',
      'Depart',
      'MontantEUR',
      'Statut',
    ];
    const rows = dossiers.map((d) => [
      d.reference,
      d.submittedAt,
      `"${d.applicantFullName.replace(/"/g, '""')}"`,
      d.nationality,
      d.passportNumber,
      d.email,
      `"${d.destinationName.replace(/"/g, '""')}"`,
      `"${d.visaCategoryLabel.replace(/"/g, '""')}"`,
      d.entryType,
      d.processingTier,
      d.arrivalDate,
      d.departureDate,
      String(d.totalFeeEur),
      d.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consulpass_dossiers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Export CSV généré (${dossiers.length} dossiers).`);
  };

  const handleSelectDossier = (ref: string) => {
    setSelectedRef(ref);
    setShowRequestDocForm(false);
    setShowRefusalForm(false);
    setConfirmDeleteRef(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Admin Top Header & Workspace Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Administration consulaire · Opérateur : {officerName}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
            Espace administrateur
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Workspace Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md">
            {(
              [
                { id: 'queue', label: 'File d’instruction' },
                { id: 'embassies', label: `Ambassades UE (${embassies.length})` },
                { id: 'analytics', label: 'Statistiques & Recettes' },
                { id: 'settings', label: 'Paramètres opérateur' },
              ] as { id: AdminTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  adminTab === tab.id
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-medium text-emerald-900 hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Total des demandes</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-950 tabular-nums">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            {stats.totalRevenueEur} EUR encaissés
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">File à instruire</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-blue-900 tabular-nums">
            {stats.pendingReview}
          </p>
          <p className="mt-1 text-xs text-slate-600">Vérification ou instruction en cours</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Compléments attendus</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-amber-700 tabular-nums">
            {stats.actionRequired}
          </p>
          <p className="mt-1 text-xs text-slate-600">Dossiers en statut Action requise</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">e-Visas délivrés</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {stats.approved}
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Taux d’approbation : {stats.approvalRate}%
          </p>
        </div>
      </div>

      {/* TAB 1: INSTRUCTION QUEUE */}
      {adminTab === 'queue' && (
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md overflow-x-auto">
              {(
                [
                  { id: 'tous', label: 'Tous' },
                  { id: 'a_traiter', label: 'À traiter' },
                  { id: 'action_requise', label: 'Action requise' },
                  { id: 'approuve', label: 'Approuvés' },
                  { id: 'refuse', label: 'Refusés' },
                ] as { id: QueueFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    queueFilter === tab.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                aria-label="Filtrer par destination"
                className="h-10 px-3 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-blue-800"
              >
                <option value="toutes">Toutes destinations</option>
                {DESTINATIONS.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Référence, nom, passeport..."
                  aria-label="Rechercher un dossier dans la file"
                  className="w-full sm:w-64 h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                />
              </div>
            </div>
          </div>

          {filteredDossiers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-slate-900">
                Aucun dossier dans cette sélection
              </p>
              <p className="text-sm text-slate-600">
                Modifiez les filtres actifs ou la recherche pour afficher les demandes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQueueFilter('tous');
                  setDestFilter('toutes');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* High-Density Queue Table */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Dossier</th>
                        <th className="py-3 px-3">Demandeur</th>
                        <th className="py-3 px-3">Destination</th>
                        <th className="py-3 px-3 text-right">Droits</th>
                        <th className="py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDossiers.map((dossier) => {
                        const isSelected = activeDossier?.reference === dossier.reference;
                        const statusMeta = getStatusInfo(dossier.status);
                        const StatusIcon = statusMeta.Icon;

                        return (
                          <tr
                            key={dossier.reference}
                            onClick={() => handleSelectDossier(dossier.reference)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 align-top">
                              <p className="font-mono text-xs font-semibold text-slate-950 tabular-nums">
                                {dossier.reference}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                                {dossier.processingTier}
                              </p>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <p className="text-xs font-semibold text-slate-950">
                                {dossier.applicantFullName}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                                {dossier.passportNumber}
                              </p>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <p className="text-xs text-slate-900">{dossier.destinationName}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {dossier.visaCategoryLabel}
                              </p>
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                              {dossier.totalFeeEur} EUR
                            </td>
                            <td className="py-3 px-4 align-top whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{statusMeta.label}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consular Decision Inspector */}
              {activeDossier && (
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                      <p className="font-mono text-xs text-slate-500 tabular-nums">
                        {activeDossier.reference}
                      </p>
                      <h2 className="font-display text-lg font-bold text-slate-950 mt-0.5">
                        {activeDossier.applicantFullName}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {activeDossier.email} · {activeDossier.nationality}
                      </p>
                    </div>

                    {confirmDeleteRef === activeDossier.reference ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteDossier(activeDossier.reference);
                            setConfirmDeleteRef(null);
                            notify(`Dossier ${activeDossier.reference} supprimé.`);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRef(null)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRef(activeDossier.reference)}
                        aria-label={`Supprimer le dossier ${activeDossier.reference}`}
                        className="p-2 text-slate-400 hover:text-red-600 border border-slate-200 rounded-md hover:bg-red-50 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Metadata Summary */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Passeport</p>
                      <p className="font-mono font-semibold text-slate-950 mt-0.5">
                        {activeDossier.passportNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Séjour & Entrées</p>
                      <p className="font-mono text-slate-900 mt-0.5 tabular-nums">
                        {activeDossier.arrivalDate} → {activeDossier.departureDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Destination</p>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {activeDossier.destinationName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Frais réglés</p>
                      <p className="font-mono font-semibold text-slate-950 mt-0.5 tabular-nums">
                        {activeDossier.totalFeeEur} EUR
                      </p>
                    </div>
                  </div>

                  {/* Submitted Documents Verification */}
                  <div className="pt-4 border-t border-slate-200 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-900">
                      Pièces justificatives jointes ({Object.keys(activeDossier.documents).length})
                    </p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                      {Object.values(activeDossier.documents).map((doc) => (
                        <div
                          key={doc.docId}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-slate-800 truncate">
                              {DOCUMENT_REQUIREMENTS[doc.docId]?.title ?? doc.docId}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                            {doc.fileSizeKb} Ko
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-900">
                      Décision & Workflow d’instruction
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDossier.status === 'verification_pieces' && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(activeDossier.reference, 'en_instruction', {
                              officerName,
                              note: 'Pièces conformes · Dossier passé en instruction',
                            });
                            notify(
                              `Dossier ${activeDossier.reference} validé et passé en instruction.`
                            );
                          }}
                          className="sm:col-span-2 px-3 py-2.5 text-xs font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer"
                        >
                          Valider les pièces et passer en instruction
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={activeDossier.status === 'approuve'}
                        onClick={() => {
                          setShowRequestDocForm(false);
                          setShowRefusalForm(false);
                          onUpdateStatus(activeDossier.reference, 'approuve', {
                            officerName,
                            note: `e-Visa approuvé et délivré par ${officerName}`,
                          });
                          notify(
                            `Dossier ${activeDossier.reference} approuvé. L’e-Visa est disponible pour le demandeur.`
                          );
                        }}
                        className="px-3 py-2.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-600 disabled:opacity-45 cursor-pointer"
                      >
                        Approuver & Délivrer e-Visa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowRefusalForm(false);
                          setShowRequestDocForm((prev) => !prev);
                        }}
                        className="px-3 py-2.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 cursor-pointer"
                      >
                        Demander un complément
                      </button>

                      <button
                        type="button"
                        disabled={activeDossier.status === 'refuse'}
                        onClick={() => {
                          setShowRequestDocForm(false);
                          setShowRefusalForm((prev) => !prev);
                        }}
                        className="sm:col-span-2 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-45 cursor-pointer"
                      >
                        Notifier un refus motivé
                      </button>
                    </div>

                    {/* Inline Missing Document Request Form */}
                    {showRequestDocForm && (
                      <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 space-y-2.5">
                        <label className="block text-xs font-semibold text-amber-950">
                          Pièce à corriger ou compléter
                        </label>
                        <select
                          value={requestDocId}
                          onChange={(e) => setRequestDocId(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs bg-white border border-amber-300 rounded-md text-slate-900"
                        >
                          {Object.values(DOCUMENT_REQUIREMENTS).map((req) => (
                            <option key={req.id} value={req.id}>
                              {req.title}
                            </option>
                          ))}
                        </select>
                        <textarea
                          rows={2}
                          value={requestDocReason}
                          onChange={(e) => setRequestDocReason(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-amber-300 rounded-md text-slate-900"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRequestDocForm(false)}
                            className="px-3 py-1.5 text-xs text-slate-700 hover:underline cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(activeDossier.reference, 'action_requise', {
                                officerName,
                                missingDocId: requestDocId,
                                missingDocReason: requestDocReason.trim(),
                              });
                              setShowRequestDocForm(false);
                              notify(
                                `Demande de complément envoyée pour ${activeDossier.reference}.`
                              );
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 cursor-pointer"
                          >
                            Envoyer la demande
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Refusal Form */}
                    {showRefusalForm && (
                      <div className="p-3.5 rounded-md bg-red-50 border border-red-200 space-y-2.5">
                        <label className="block text-xs font-semibold text-red-950">
                          Motif officiel du refus
                        </label>
                        <textarea
                          rows={2}
                          value={refusalReason}
                          onChange={(e) => setRefusalReason(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-red-300 rounded-md text-slate-900"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRefusalForm(false)}
                            className="px-3 py-1.5 text-xs text-slate-700 hover:underline cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(activeDossier.reference, 'refuse', {
                                officerName,
                                note: refusalReason.trim(),
                              });
                              setShowRefusalForm(false);
                              notify(`Refus enregistré pour ${activeDossier.reference}.`);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800 cursor-pointer"
                          >
                            Confirmer le refus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Note Composer */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <label
                      htmlFor="admin-audit-note"
                      className="block text-xs font-semibold text-slate-900"
                    >
                      Ajouter une note au journal du dossier
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="admin-audit-note"
                        type="text"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Ex: Vérification passeport effectuée..."
                        className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                      />
                      <button
                        type="button"
                        disabled={!customNote.trim()}
                        onClick={() => {
                          onAddNote(activeDossier.reference, customNote.trim(), officerName);
                          setCustomNote('');
                          notify(`Note ajoutée au dossier ${activeDossier.reference}.`);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: EUROPEAN EMBASSIES DIRECTORY */}
      {adminTab === 'embassies' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-900" />
                <h2 className="font-display text-lg font-bold text-slate-950">
                  Annuaire des ambassades et services consulaires européens
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                27 États membres de l’Union européenne, Délégation UE, Suisse, Royaume-Uni, Norvège
                et Islande · Coordonnées locales modifiables pour vos dossiers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={embassyZoneFilter}
                onChange={(e) => setEmbassyZoneFilter(e.target.value as EmbassyZoneFilter)}
                aria-label="Filtrer par zone européenne"
                className="h-10 px-3 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-blue-800"
              >
                <option value="toutes">Toutes zones ({embassies.length})</option>
                <option value="Schengen">Espace Schengen</option>
                <option value="UE hors Schengen">UE hors Schengen</option>
                <option value="Europe hors UE">Europe hors UE</option>
                <option value="Institution UE">Institution UE</option>
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={embassySearch}
                  onChange={(e) => setEmbassySearch(e.target.value)}
                  placeholder="Pays, email, TLS, VFS..."
                  aria-label="Rechercher une ambassade européenne"
                  className="w-full sm:w-64 h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
                />
              </div>
            </div>
          </div>

          {filteredEmbassies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
              <p className="font-display text-base font-semibold text-slate-900">
                Aucune ambassade ne correspond à votre recherche
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmbassySearch('');
                  setEmbassyZoneFilter('toutes');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Afficher toutes les ambassades
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmbassies.map((item) => {
                const isEditing = editingEmbassyId === item.id && editDraft;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-display text-sm font-bold text-slate-950">
                            Modifier · {item.country}
                          </span>
                          <span className="text-xs text-slate-500">{item.zone}</span>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Mission / Service
                            </label>
                            <input
                              type="text"
                              value={editDraft.missionName}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, missionName: e.target.value })
                              }
                              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Téléphone
                              </label>
                              <input
                                type="text"
                                value={editDraft.phone}
                                onChange={(e) =>
                                  setEditDraft({ ...editDraft, phone: e.target.value })
                                }
                                className="w-full h-9 px-2.5 font-mono bg-white border border-slate-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Adresse e-mail
                              </label>
                              <input
                                type="text"
                                value={editDraft.email}
                                onChange={(e) =>
                                  setEditDraft({ ...editDraft, email: e.target.value })
                                }
                                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Adresse consulaire
                            </label>
                            <input
                              type="text"
                              value={editDraft.address}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, address: e.target.value })
                              }
                              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Note centre de visas (TLS / VFS / BLS)
                            </label>
                            <input
                              type="text"
                              value={editDraft.visaCenterNote}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, visaCenterNote: e.target.value })
                              }
                              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmbassyId(null);
                              setEditDraft(null);
                            }}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:underline cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmbassies((prev) =>
                                prev.map((e) => (e.id === item.id ? editDraft : e))
                              );
                              setEditingEmbassyId(null);
                              setEditDraft(null);
                              notify(`Coordonnées mises à jour pour ${item.country}.`);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-500">{item.zone}</p>
                              <h3 className="font-display text-base font-bold text-slate-950 mt-0.5">
                                {item.country}
                              </h3>
                              <p className="text-xs font-medium text-slate-700 mt-0.5">
                                {item.missionName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmbassyId(item.id);
                                setEditDraft(item);
                              }}
                              aria-label={`Modifier les contacts de ${item.country}`}
                              className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 shrink-0 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-start gap-2 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span>{item.address}</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-slate-800 min-w-0">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-mono truncate tabular-nums">
                                  {item.phone}
                                </span>
                              </div>
                              {item.phone.includes('+') && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(`${item.id}-phone`, item.phone)
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-950 shrink-0 cursor-pointer"
                                >
                                  {copiedKey === `${item.id}-phone` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-700" />
                                      <span>Copié</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copier</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-slate-800 min-w-0">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {item.email.includes('@') ? (
                                  <a
                                    href={`mailto:${item.email}`}
                                    className="text-blue-900 hover:underline truncate"
                                  >
                                    {item.email}
                                  </a>
                                ) : (
                                  <span className="text-slate-600 truncate">{item.email}</span>
                                )}
                              </div>
                              {item.email.includes('@') && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(`${item.id}-email`, item.email)
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-950 shrink-0 cursor-pointer"
                                >
                                  {copiedKey === `${item.id}-email` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-700" />
                                      <span>Copié</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copier</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500">{item.visaCenterNote}</span>
                          <a
                            href={item.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
                          >
                            <span>Portail officiel</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEmbassies(EUROPEAN_EMBASSIES);
                notify('Annuaire des ambassades réinitialisé.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser l’annuaire</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & REVENUE BREAKDOWN */}
      {adminTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-slate-950">
                Répartition par zone consulaire
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-6">Destination</th>
                  <th className="py-2.5 px-4 text-right">Dossiers</th>
                  <th className="py-2.5 px-4 text-right">Approuvés</th>
                  <th className="py-2.5 px-6 text-right">Recettes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {destinationBreakdown.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 px-6 font-medium text-slate-900">{row.name}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                      {row.approvedCount}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-semibold tabular-nums text-slate-950">
                      {row.revenue} EUR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-slate-950">
                Répartition par catégorie de visa
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-6">Catégorie</th>
                  <th className="py-2.5 px-4 text-right">Demandes</th>
                  <th className="py-2.5 px-6 text-right">Montant total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categoryBreakdown.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 px-6 font-medium text-slate-900">{row.label}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.count}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-semibold tabular-nums text-slate-950">
                      {row.revenue} EUR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATOR SETTINGS */}
      {adminTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h2 className="font-display text-base font-bold text-slate-950">
                Identité de l’instructeur actif
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ce nom est enregistré dans la chronologie officielle des dossiers lors de chaque
              validation, demande de complément ou décision consulaire.
            </p>
            <div>
              <label
                htmlFor="operator-name-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nom et affectation de l’opérateur
              </label>
              <input
                id="operator-name-input"
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-950">
              Maintenance des données locales
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restaurez le jeu de dossiers de démonstration initiaux (conserve votre configuration
              courante et réinitialise la file de test).
            </p>
            <button
              type="button"
              onClick={() => {
                onResetSampleDossiers();
                notify('Dossiers de démonstration restaurés.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurer les dossiers initiaux</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
