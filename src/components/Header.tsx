import { useState } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import { ViewId } from '../types/visa';

interface HeaderProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  hasDraft: boolean;
}

const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'apply', label: 'Nouvelle demande' },
  { id: 'track', label: 'Suivi de dossier' },
  { id: 'guide', label: 'Tarifs & Guide' },
  { id: 'admin', label: 'Administration' },
];

export default function Header({ activeView, onNavigate, hasDraft }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSelect = (view: ViewId) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand lockup */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 cursor-pointer"
        >
          {!logoError ? (
            <img
              src="/src/assets/images/logo_visa_travelling_1794604358248.jpg"
              alt="Logo Visa Travelling"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-md bg-blue-900 text-white inline-flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </span>
          )}
          <span>Visa Travelling</span>
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 ${
                  isActive
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-900"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('apply')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
          >
            {hasDraft ? 'Reprendre le dossier' : 'Déposer un dossier'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelect('apply')}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 whitespace-nowrap cursor-pointer"
            >
              {hasDraft ? 'Reprendre le dossier' : 'Déposer un dossier'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
