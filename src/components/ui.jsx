import React from 'react';

export function Ring({ value = 0, max = 100, size = 56, stroke = 5, color = '#F59E0B', children }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-track">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center leading-none">
        {children || <span className="text-[13px] font-bold" style={{ color }}>{Math.round(value)}</span>}
      </div>
    </div>
  );
}

export function StatChip({ icon: Icon, label, value, tone = 'text-gold', title }) {
  return (
    <div className="flex items-center gap-2" title={title}>
      <Icon size={15} className={tone} />
      <div className="leading-tight">
        <div className="text-[13px] font-bold text-slate-100">{value}</div>
        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function SectionHead({ icon: Icon, title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
            <Icon size={17} className="text-gold" />
          </div>
        )}
        <div>
          <h2 className="font-display text-lg text-slate-100 leading-snug">{title}</h2>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Toggle({ on, onChange, label, icon: Icon }) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={label}
      className={`btn ${on ? 'bg-gold/20 text-gold border-gold/50' : 'bg-white/5 text-slate-300 border-white/10'} !px-2.5 !py-1.5 text-[11px]`}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

export function Markdownish({ text, mentions = {} }) {
  // Render a lightweight markdown dialect: **bold**, *ital*, > quote, bullets — no external deps.
  const blocks = String(text || '').split('\n');
  return (
    <div className="space-y-1">
      {blocks.map((line, i) => {
        const inline = inlineFmt(line, mentions);
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-2 border-gold/50 pl-3 py-1 text-slate-300 italic text-[13px]">
              {inlineFmt(line.slice(2), mentions)}
            </blockquote>
          );
        }
        if (line.startsWith('• ') || line.startsWith('   — ')) {
          return <div key={i} className="pl-3 text-[13px] text-slate-300 flex gap-2"><span className="text-gold/70 shrink-0 pt-[3px] text-[9px]">◆</span><div>{inlineFmt(line.replace(/^• /, '').replace(/^   — /, ''), mentions)}</div></div>;
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-[13px] text-slate-200">{inline}</p>;
      })}
    </div>
  );
}

function inlineFmt(s) {
  // split on **bold** first
  const parts = String(s).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="text-gold-soft font-semibold">{p.slice(2, -2)}</strong>;
    }
    const italics = p.split(/(\*[^*]+\*)/g);
    return italics.map((q, j) => (
      q.startsWith('*') && q.endsWith('*') && q.length > 2
        ? <em key={`${i}-${j}`} className="text-slate-300/90">{q.slice(1, -1)}</em>
        : <span key={`${i}-${j}`}>{q}</span>
    ));
  });
}
