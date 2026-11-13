/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdminView from './components/AdminView';
import ApplicationWizard from './components/ApplicationWizard';
import GuideView from './components/GuideView';
import Header from './components/Header';
import HomeView from './components/HomeView';
import TrackingView from './components/TrackingView';
import {
  DESTINATIONS,
  INITIAL_DOSSIERS,
  createInitialFormData,
} from './data/visaCatalog';
import {
  DossierStatus,
  UploadedDocument,
  ViewId,
  VisaCategoryId,
  VisaDossier,
  VisaFormData,
} from './types/visa';

const DRAFT_STORAGE_KEY = 'consulpass_draft_v1';
const DOSSIERS_STORAGE_KEY = 'consulpass_dossiers_v1';

function loadDraft(): VisaFormData {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createInitialFormData();
    return { ...createInitialFormData(), ...JSON.parse(raw) };
  } catch {
    return createInitialFormData();
  }
}

function loadDossiers(): VisaDossier[] {
  try {
    const raw = localStorage.getItem(DOSSIERS_STORAGE_KEY);
    if (!raw) return INITIAL_DOSSIERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DOSSIERS;
  } catch {
    return INITIAL_DOSSIERS;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [formData, setFormData] = useState<VisaFormData>(() => loadDraft());
  const [dossiers, setDossiers] = useState<VisaDossier[]>(() => loadDossiers());
  const [selectedReference, setSelectedReference] = useState<string | null>(
    () => loadDossiers()[0]?.reference ?? null
  );
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore storage quota errors
    }
  }, [formData]);

  useEffect(() => {
    try {
      localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(dossiers));
    } catch {
      // Ignore storage quota errors
    }
  }, [dossiers]);

  const hasDraft = Boolean(
    formData.lastName.trim() ||
      formData.firstName.trim() ||
      formData.passportNumber.trim() ||
      Object.keys(formData.documents).length > 0
  );

  const handleNavigate = (view: ViewId) => {
    setSubmissionNotice(null);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartApplication = (preset?: {
    destinationId: string;
    visaCategory: VisaCategoryId;
    nationality: string;
  }) => {
    if (preset) {
      const dest = DESTINATIONS.find((d) => d.id === preset.destinationId);
      setFormData((prev) => ({
        ...prev,
        destinationId: preset.destinationId,
        visaCategory: preset.visaCategory,
        nationality: preset.nationality,
        entryCity: dest ? dest.entryCityDefault : prev.entryCity,
      }));
    }
    setSubmissionNotice(null);
    setActiveView('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    const fresh = createInitialFormData();
    setFormData(fresh);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSubmitSuccess = (newDossier: VisaDossier) => {
    setDossiers((prev) => [newDossier, ...prev]);
    setSelectedReference(newDossier.reference);
    handleResetForm();
    setSubmissionNotice(
      `Demande enregistrée sous la référence ${newDossier.reference}. Vous pouvez consulter votre récépissé et suivre l’instruction ci-dessous.`
    );
    setActiveView('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResolveActionRequired = (
    reference: string,
    docId: string,
    doc: UploadedDocument
  ) => {
    const nowLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.reference !== reference) return d;
        return {
          ...d,
          status: 'en_instruction',
          updatedAt: new Date().toISOString(),
          missingDocId: undefined,
          missingDocReason: undefined,
          documents: {
            ...d.documents,
            [docId]: doc,
          },
          timeline: d.timeline.map((step) => {
            if (step.id === 't2') {
              return {
                ...step,
                completed: true,
                current: false,
                date: `${nowLabel} · ${timeLabel}`,
                note: `Pièce complémentaire (${doc.fileName}) validée`,
              };
            }
            if (step.id === 't3') {
              return {
                ...step,
                current: true,
                date: 'En cours',
                note: 'Dossier transmis au pôle d’instruction consulaire',
              };
            }
            return step;
          }),
        };
      })
    );
  };

  const handleAdvanceDossierStep = (reference: string) => {
    const nowLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.reference !== reference) return d;

        if (d.status === 'verification_pieces') {
          return {
            ...d,
            status: 'en_instruction',
            updatedAt: new Date().toISOString(),
            timeline: d.timeline.map((s) => {
              if (s.id === 't2') {
                return {
                  ...s,
                  completed: true,
                  current: false,
                  date: `${nowLabel} · ${timeLabel}`,
                  note: 'Toutes les pièces ont été vérifiées conformes',
                };
              }
              if (s.id === 't3') {
                return {
                  ...s,
                  current: true,
                  date: `${nowLabel} · ${timeLabel}`,
                  note: 'Examen consulaire en cours',
                };
              }
              return s;
            }),
          };
        }

        if (d.status === 'en_instruction') {
          return {
            ...d,
            status: 'approuve',
            updatedAt: new Date().toISOString(),
            timeline: d.timeline.map((s) => {
              if (s.id === 't3') {
                return {
                  ...s,
                  completed: true,
                  current: false,
                  date: `${nowLabel} · ${timeLabel}`,
                  note: 'Avis consulaire favorable',
                };
              }
              if (s.id === 't4') {
                return {
                  ...s,
                  completed: true,
                  current: true,
                  date: `${nowLabel} · ${timeLabel}`,
                  note: 'Autorisation e-Visa délivrée et prête à l’impression',
                };
              }
              return s;
            }),
          };
        }

        return d;
      })
    );
  };

  const handleAdminUpdateStatus = (
    reference: string,
    newStatus: DossierStatus,
    options?: {
      note?: string;
      missingDocId?: string;
      missingDocReason?: string;
      officerName?: string;
    }
  ) => {
    const nowLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const stamp = `${nowLabel} · ${timeLabel}`;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.reference !== reference) return d;

        const nextTimeline = d.timeline.map((s) => {
          if (newStatus === 'en_instruction') {
            if (s.id === 't2') {
              return {
                ...s,
                completed: true,
                current: false,
                date: stamp,
                note: options?.note ?? 'Pièces validées par le service consulaire',
              };
            }
            if (s.id === 't3') {
              return {
                ...s,
                current: true,
                date: stamp,
                note: `Instruction ouverte (${options?.officerName ?? 'Opérateur'})`,
              };
            }
          }

          if (newStatus === 'action_requise') {
            if (s.id === 't2') {
              return {
                ...s,
                completed: false,
                current: true,
                date: stamp,
                note: options?.missingDocReason ?? 'Pièce complémentaire demandée',
              };
            }
          }

          if (newStatus === 'approuve') {
            if (s.id === 't2' || s.id === 't3') {
              return {
                ...s,
                completed: true,
                current: false,
                date: s.date === 'En attente' || s.date === 'En cours' ? stamp : s.date,
              };
            }
            if (s.id === 't4') {
              return {
                ...s,
                completed: true,
                current: true,
                date: stamp,
                note: options?.note ?? 'e-Visa approuvé et disponible',
              };
            }
          }

          if (newStatus === 'refuse') {
            if (s.id === 't2' || s.id === 't3') {
              return {
                ...s,
                completed: true,
                current: false,
                date: s.date === 'En attente' || s.date === 'En cours' ? stamp : s.date,
              };
            }
            if (s.id === 't4') {
              return {
                ...s,
                label: 'Décision émise · Demande refusée',
                completed: true,
                current: true,
                date: stamp,
                note: options?.note ?? 'Refus motivé notifié au demandeur',
              };
            }
          }

          return s;
        });

        return {
          ...d,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          missingDocId:
            newStatus === 'action_requise' ? options?.missingDocId : undefined,
          missingDocReason:
            newStatus === 'action_requise' ? options?.missingDocReason : undefined,
          timeline: nextTimeline,
        };
      })
    );
  };

  const handleAdminAddNote = (reference: string, note: string, officer: string) => {
    const nowLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.reference !== reference) return d;
        return {
          ...d,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...d.timeline,
            {
              id: `note-${Date.now()}`,
              label: `Note consulaire (${officer})`,
              date: `${nowLabel} · ${timeLabel}`,
              completed: true,
              note,
            },
          ],
        };
      })
    );
  };

  const handleAdminDeleteDossier = (reference: string) => {
    setDossiers((prev) => prev.filter((d) => d.reference !== reference));
    if (selectedReference === reference) {
      setSelectedReference(null);
    }
  };

  const handleResetSampleDossiers = () => {
    setDossiers(INITIAL_DOSSIERS);
    setSelectedReference(INITIAL_DOSSIERS[0]?.reference ?? null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        hasDraft={hasDraft}
      />

      <main className="flex-1">
        {submissionNotice && activeView === 'track' && (
          <div className="no-print max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{submissionNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionNotice(null)}
                className="text-xs font-medium text-emerald-900 hover:underline whitespace-nowrap cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {activeView === 'home' && (
          <HomeView
            onStartApplication={handleStartApplication}
            onOpenTracker={() => handleNavigate('track')}
            dossierCount={dossiers.length}
          />
        )}

        {activeView === 'apply' && (
          <ApplicationWizard
            formData={formData}
            onChangeForm={setFormData}
            onResetForm={handleResetForm}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}

        {activeView === 'track' && (
          <TrackingView
            dossiers={dossiers}
            selectedReference={selectedReference}
            onSelectReference={setSelectedReference}
            onResolveActionRequired={handleResolveActionRequired}
            onAdvanceDossierStep={handleAdvanceDossierStep}
            onStartNew={() => handleNavigate('apply')}
          />
        )}

        {activeView === 'guide' && (
          <GuideView
            onSelectCategoryToApply={(categoryId) => {
              setFormData((prev) => ({ ...prev, visaCategory: categoryId }));
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminView
            dossiers={dossiers}
            onUpdateStatus={handleAdminUpdateStatus}
            onAddNote={handleAdminAddNote}
            onDeleteDossier={handleAdminDeleteDossier}
            onResetSampleDossiers={handleResetSampleDossiers}
          />
        )}
      </main>

      <footer className="no-print bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/logo_visa_travelling_1794604358248.jpg"
              alt="Logo Visa Travelling"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
            />
            <span className="font-display font-semibold text-slate-900">Visa Travelling</span>
            <span>Portail de demande de visa électronique</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('guide')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Tarifs & Conditions
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('track')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Suivi de dossier
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Administration
            </button>
            <a
              href="https://wa.me/695613056"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 hover:underline whitespace-nowrap"
            >
              Assistance WhatsApp : <span className="font-mono tabular-nums">695613056</span>
            </a>
            <span>Protection des données · Conformité OACI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
