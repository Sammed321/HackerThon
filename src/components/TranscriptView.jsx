import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollText, MousePointerClick } from 'lucide-react';
import { useApp, useT } from '../store.jsx';
import { fmtTime } from '../utils/toolkit.js';

const LEGEND = [
  { c: '#F59E0B', label: 'People' },
  { c: '#22D3EE', label: 'Places' },
  { c: '#A78BFA', label: 'Idioms & Traditions' },
  { c: '#FB7185', label: 'Events' },
  { c: '#818CF8', label: 'Institutions & Tech' },
];

const TYPE_HEX = {
  person: '#F59E0B', place: '#22D3EE', idiom: '#A78BFA', dialect: '#A78BFA',
  tradition: '#A78BFA', event: '#FB7185', institution: '#818CF8', tech: '#818CF8',
};

export default function TranscriptView() {
  const { activeReel, openContext, highlight, seek } = useApp();
  const time = useT(3);
  const scrollRef = useRef(null);
  const lastAuto = useRef(null);

  const segments = activeReel.segments || [];

  const activeSegId = useMemo(() => {
    if (!segments.length) return null;
    let cur = segments[0].id;
    segments.forEach((s) => { if (time >= s.t - 0.3) cur = s.id; });
    return cur;
  }, [time, segments]);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c || !activeSegId || activeSegId === lastAuto.current) return;
    lastAuto.current = activeSegId;
    const el = c.querySelector(`[data-segid="${activeSegId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const crest = c.getBoundingClientRect();
    const above = rect.top < crest.top + 34;
    const below = rect.bottom > crest.bottom - 20;
    if (above || below) {
      c.scrollTo({
        top: c.scrollTop + (rect.top - crest.top) - crest.height * 0.28,
        behavior: 'smooth',
      });
    }
  }, [activeSegId]);

  const flashSegId = highlight?.reelId === activeReel.id ? highlight.segId : null;

  if (!segments.length) {
    return (
      <div className="card p-6 text-center">
        <ScrollText size={22} className="text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">This reel has no transcript yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Use <span className="text-gold">Ingest Reel → paste archival text</span> to create a decodable transcript (works fully offline).
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-edge/70 flex-wrap">
        <div className="flex items-center gap-2">
          <ScrollText size={14} className="text-gold" />
          <span className="font-display text-[15px] text-slate-100">Synchronized Cultural Transcript</span>
          <span className="chip bg-gold/10 border-gold/30 text-gold text-[10px] ml-1">
            {segments.length} segments
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><MousePointerClick size={12} className="text-gold/70" /> Click a highlighted term for its Context Card</span>
          <span className="hidden md:flex items-center gap-2.5">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: l.c }} /> {l.label}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="relative max-h-[420px] overflow-y-auto px-4 py-3 space-y-2.5 scroll-smooth">
        {segments.map((seg) => (
          <SegmentRow
            key={seg.id}
            seg={seg}
            hits={activeReel.perSegment ? activeReel.perSegment[seg.id] : null}
            active={seg.id === activeSegId}
            flash={seg.id === flashSegId}
            openContext={openContext}
            seek={seek}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentRow({ seg, hits, active, flash, openContext, seek }) {
  const parts = useMemo(
    () => buildParts(seg.text, hits, openContext),
    [seg.text, hits, openContext]
  );
  return (
    <div
      data-segid={seg.id}
      style={flash ? { animation: 'flashCit 2.8s ease-out both' } : undefined}
      className={`group rounded-xl px-3.5 py-2.5 border transition-all duration-200 ${
        active ? 'bg-gold/[0.07] border-gold/25' : 'bg-panel2/40 border-transparent hover:border-edge/60'
      }`}
    >
      <div className="flex items-baseline gap-2.5 mb-1">
        <button
          onClick={(e) => { e.stopPropagation(); seek(seg.t); }}
          className={`shrink-0 font-mono text-[11px] px-1.5 py-0.5 rounded border transition ${
            active ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-obsidian/80 border-edge text-slate-400 group-hover:text-gold group-hover:border-gold/40'
          }`}
          title="Jump to this moment"
        >
          {fmtTime(seg.t)}
        </button>
        <span className="text-[12.5px] font-semibold text-slate-200">{seg.speaker}</span>
        <span className="text-[10.5px] text-slate-500 truncate hidden sm:inline">{seg.role}</span>
      </div>
      <p className="text-[13.5px] leading-relaxed text-slate-300 group-hover:text-slate-200">
        {parts}
      </p>
    </div>
  );
}

function buildParts(text, hits, openContext) {
  if (!text) return null;
  if (!hits || !hits.length) return text;
  const sorted = [...hits].sort((a, b) => a.start - b.start);
  const out = [];
  let cursor = 0;
  sorted.forEach((h, i) => {
    if (h.start < cursor) return;
    if (h.start > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, h.start)}</span>);
    const color = TYPE_HEX[typeOf(h)] || '#94A3B8';
    out.push(<Term key={`h${i}`} text={text.slice(h.start, h.end)} h={h} color={color} onOpen={openContext} />);
    cursor = h.end;
  });
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return out;
}

function typeOf(h) {
  return (h.kind === 'entry' ? h.entry?.type : h.node?.type) || '';
}

function Term({ text, h, color, onOpen }) {
  const meta = h.kind === 'entry' ? h.entry : h.node;
  return (
    <span
      className="term-hit font-medium"
      style={{ color, background: `${color}16`, borderBottom: `1.5px solid ${color}66` }}
      title={`${meta?.aliases?.[0] || meta?.label || text} — click to open the Cultural Context Card`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(h.kind === 'entry' ? meta : { refId: h.id });
      }}
    >
      {text}
    </span>
  );
}
