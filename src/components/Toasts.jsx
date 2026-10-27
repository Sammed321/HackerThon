import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../store.jsx';

const TONES = {
  gold: { cls: 'bg-panel2/95 border-gold/40 text-slate-100', Icon: Info, iconCls: 'text-gold' },
  emerald: { cls: 'bg-panel2/95 border-mint/40 text-slate-100', Icon: CheckCircle2, iconCls: 'text-mint' },
  coral: { cls: 'bg-panel2/95 border-coral/40 text-slate-100', Icon: AlertTriangle, iconCls: 'text-coral' },
};

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 w-[min(92vw,560px)] pointer-events-none">
      {toasts.map((t) => {
        const tone = TONES[t.tone] || TONES.gold;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fadeUp flex items-start gap-2.5 px-4 py-2.5 rounded-xl border shadow-card backdrop-blur ${tone.cls}`}
          >
            <tone.Icon size={15} className={`mt-[2px] shrink-0 ${tone.iconCls}`} />
            <div className="text-[12.5px] leading-snug">{t.text}</div>
          </div>
        );
      })}
    </div>
  );
}
