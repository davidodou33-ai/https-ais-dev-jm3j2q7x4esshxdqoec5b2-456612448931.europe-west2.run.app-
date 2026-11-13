import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';

export const WHATSAPP_SUPPORT_NUMBER = '695613056';
export const WHATSAPP_SUPPORT_URL = `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}`;

interface WhatsappSupportRowProps {
  compact?: boolean;
}

export default function WhatsappSupportRow({ compact = false }: WhatsappSupportRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_SUPPORT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback unavailable
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="text-slate-600">Assistance client WhatsApp :</span>
        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-semibold text-slate-950 hover:text-emerald-700 hover:underline tabular-nums whitespace-nowrap"
        >
          {WHATSAPP_SUPPORT_NUMBER}
        </a>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>

        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-600 whitespace-nowrap"
        >
          <span>Contacter</span>
        </a>
      </div>
    </div>
  );
}
