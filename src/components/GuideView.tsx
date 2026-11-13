import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CONSULAR_FAQ, DESTINATIONS, VISA_CATEGORIES } from '../data/visaCatalog';
import { VisaCategoryId } from '../types/visa';
import WhatsappSupportRow from './WhatsappSupportRow';

interface GuideViewProps {
  onSelectCategoryToApply: (categoryId: VisaCategoryId) => void;
}

export default function GuideView({ onSelectCategoryToApply }: GuideViewProps) {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Barèmes officiels · Conditions d’admission
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
          Tarifs consulaires et guide des visas
        </h1>
      </div>

      {/* Visa Categories Comparison Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="font-display text-lg font-bold text-slate-950">
            Barème par catégorie de visa
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Montants exprimés en euros (EUR), hors option de traitement prioritaire (+45 EUR) ou
            express (+85 EUR).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Catégorie</th>
                <th className="py-3 px-4">Validité & Séjour</th>
                <th className="py-3 px-4 text-right">Pièces requises</th>
                <th className="py-3 px-4 text-right">Droits base</th>
                <th className="py-3 px-4 text-right">Biométrie</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.values(VISA_CATEGORIES).map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6">
                    <p className="font-semibold text-slate-950">{cat.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{cat.shortDesc}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                    {cat.validityLabel}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {cat.requiredDocIds.length}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {cat.baseFeeEur} EUR
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {cat.biometricFeeEur} EUR
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectCategoryToApply(cat.id)}
                      className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap cursor-pointer"
                    >
                      Déposer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-950">
          Zones et délais consulaires couverts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              className="bg-white border border-slate-200 rounded-lg p-5 space-y-2"
            >
              <p className="text-xs text-slate-500">{dest.zone}</p>
              <h3 className="font-display text-base font-bold text-slate-950">{dest.name}</h3>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Délai standard</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {dest.standardDays} jours ouvrés
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Séjour court max</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {dest.maxStayDays} jours
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Point d’entrée principal</span>
                <span className="font-medium text-slate-900">{dest.entryCityDefault}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-slate-950 mb-4">
          Questions fréquentes
        </h2>
        <div className="divide-y divide-slate-200">
          {CONSULAR_FAQ.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-950">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <WhatsappSupportRow />
        </div>
      </section>
    </div>
  );
}
