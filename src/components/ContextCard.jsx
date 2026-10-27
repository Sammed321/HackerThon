import React from 'react';
import {
  X, BookOpen, Languages, History, GraduationCap, Copy, Network,
  MessageSquare, Clapperboard, MapPin, Users, Landmark, Mic2, Braces,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { fmtTime } from '../utils/toolkit.js';

const TYPE_META = {
  place: { icon: MapPin, cls: 'text-aqua border-aqua/40 bg-aqua/10', name: 'Location / Region' },
  idiom: { icon: Languages, cls: 'text-iris border-iris/40 bg-iris/10', name: 'Cultural Idiom' },
  dialect: { icon: Mic2, cls: 'text-iris border-iris/40 bg-iris/10', name: 'Dialect Phrase' },
  tradition: { icon: Users, cls: 'text-iris border-iris/40 bg-iris/10', name: 'Cultural Tradition' },
  institution: { icon: Landmark, cls: 'text-indigo-300 border-indigo-400/40 bg-indigo-400/10', name: 'Institution' },
  tech: { icon: Braces, cls: 'text-indigo-300 border-indigo-400/40 bg-indigo-400/10', name: 'Technology' },
  event: { icon: History, cls: 'text-coral border-coral/40 bg-coral/10', name: 'Historical Event' },
  person: { icon: Users, cls: 'text-gold border-gold/40 bg-gold/10', name: 'Historical Figure' },
};

export default function ContextCard() {
  const app = useApp();
  const { contextEntry, closeContext, openContext, reels, setActiveId, graph, highlightSegment, setTab, setDrawerNode, pushToast } = app;
  if (!contextEntry) return null;

  const isEntry = Boolean(contextEntry && contextEntry.aliases && contextEntry.literal);
  const entry = isEntry ? contextEntry : graph?.byId?.get(contextEntry.refId);
  const node = graph?.byId?.get(isEntry ? contextEntry.id : contextEntry.refId);
  if (!entry) return null;

  const meta = TYPE_META[entry.type] || TYPE_META.idiom;

  // occurrences in each reel (same-dictionary annotations)
  const occ = [];
  reels.forEach((reel) => {
    const hits = (reel.perSegment || {});
    if (isEntry) {
      Object.entries(hits).forEach(([segId, list]) => {
        list.forEach((h) => {
          if (h.id === entry.id) {
            const seg = reel.segments.find((s) => s.id === segId);
            occ.push({ reel, segId, t: seg ? seg.t : h.start, surface: h.surface });
          }
        });
      });
    } else {
      const id = node?.id;
      Object.entries(hits).forEach(([segId, list]) => {
        list.forEach((h) => {
          if (h.id === id) {
            const seg = reel.segments.find((s) => s.id === segId);
            occ.push({ reel, segId, t: seg ? seg.t : 0, surface: h.surface || node?.label });
          }
        });
      });
    }
  });
  const occLimited = occ.slice(0, 8);

  // related reels from meta or edges
  const relatedReels = isEntry
    ? (entry.reels || []).map((id) => reels.find((r) => r.id === id)).filter(Boolean)
    : graph.edges
        .filter((e) => e.a === entry.id || e.b === entry.id)
        .map((e) => (e.a === entry.id ? e.b : e.a))
        .map((id) => reels.find((r) => r.id === id))
        .filter(Boolean);

  const uniqRelated = [...new Map(relatedReels.map((r) => [r.id, r])).values()];

  const askAbout = () => {
    const title = isEntry ? entry.aliases[0] : entry.label;
    closeContext();
    setTab('assistant');
    app.send(`Explain the cultural meaning of ${title} for a high school student`);
    pushToast('Gloss request queued in Talk to the Archive.', 'emerald');
  };

  const viewGraph = () => {
    closeContext();
    setDrawerNode(node);
    setTab('graph');
  };

  const copyEntry = () => {
    const payload = isEntry ? { ...entry } : { id: entry.id, label: entry.label, type: entry.type, desc: entry.desc };
    try {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      pushToast('Annotation JSON copied — ready for a PR or dataset patch.', 'emerald');
    } catch {
      pushToast('Clipboard blocked by the browser — use the Standards Hub export instead.', 'gold');
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-end md:justify-end px-4 pb-4 md:p-0" onClick={closeContext}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[min(560px,96vw)] max-h-[85vh] overflow-y-auto rounded-2xl border border-gold/30 bg-panel shadow-2xl animate-fadeUp m-auto"
      >
        <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur px-5 py-4 border-b border-edge/70 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.cls}`}>
              <meta.icon size={16} />
            </div>
            <div>
              <div className="font-display text-lg text-slate-100 leading-tight">
                {isEntry ? entry.aliases[0] : entry.label}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`chip ${meta.cls}`}><meta.icon size={10} /> {meta.name}</span>
                <span className="text-[11px] text-slate-500">{entry.era}</span>
              </div>
            </div>
          </div>
          <button onClick={closeContext} className="btn-ghost !p-2 shrink-0" title="Close"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">
          {isEntry ? (
            <>
              <Block icon={BookOpen} label="Original term / dialect phrase" tint="text-gold">
                <span className="text-[14px]">「{entry.aliases.join(' · ')}{entry.anchors ? ` (${entry.anchors})` : ''}」</span>
                <div className="text-slate-500 text-[12px] mt-1">{entry.region} · heard at {occLimited.length} timestamped spot{occLimited.length === 1 ? '' : 's'}</div>
              </Block>
              <Block icon={Languages} label="Literal vs. cultural meaning" tint="text-aqua">
                <p className="text-[13px] text-slate-300"><span className="h-label block mb-0.5">Literal</span>{entry.literal}</p>
                <p className="text-[13px] text-slate-300 mt-2"><span className="h-label block mb-0.5">Cultural</span>{entry.cultural}</p>
              </Block>
              <Block icon={History} label="Historical / geographical evolution" tint="text-iris">
                <p className="text-[13px] text-slate-300">{entry.evolution}</p>
              </Block>
              <Block icon={GraduationCap} label="Beginner-friendly decoding" tint="text-gold">
                <p className="text-[13px] text-slate-300">{entry.beginner}</p>
              </Block>
            </>
          ) : (
            <>
              <Block icon={entry.type === 'person' ? Users : History} label="Who / what is this?" tint="text-gold">
                <p className="text-[13px] text-slate-300">{entry.desc}</p>
              </Block>
              {entry.aliases && (
                <Block icon={Languages} label="Name variants" tint="text-aqua">
                  <p className="text-[13px] text-slate-300">{entry.aliases.join(' · ')}</p>
                </Block>
              )}
            </>
          )}

          {/* occurrences */}
          {occLimited.length > 0 && (
            <Block icon={Clapperboard} label="Hear it in the archive" tint="text-coral">
              <div className="flex flex-wrap gap-1.5">
                {occLimited.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => { closeContext(); highlightSegment(o.reel.id, o.t, o.segId); }}
                    className="chip bg-coral/10 border-coral/30 text-coral hover:bg-coral/20"
                    title={o.reel.title}
                  >
                    <Clapperboard size={10} /> {o.reel.tapeLabel} @ {fmtTime(o.t)}
                  </button>
                ))}
              </div>
            </Block>
          )}

          {/* related reels */}
          {uniqRelated.length > 0 && (
            <Block icon={Clapperboard} label="Related archival reels" tint="text-mint">
              <div className="space-y-1.5">
                {uniqRelated.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { closeContext(); setActiveId(r.id); setTab('studio'); }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-mint/5 border border-mint/20 hover:bg-mint/15 transition text-[12.5px] text-slate-200 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="text-mint text-[10px] shrink-0">{r.year}</span>
                  </button>
                ))}
              </div>
            </Block>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={viewGraph} className="btn-ghost text-xs"><Network size={13} /> View in Heritage Constellation</button>
            <button onClick={askAbout} className="btn-emerald text-xs"><MessageSquare size={13} /> Ask the Assistant</button>
            <button onClick={copyEntry} className="btn-ghost text-xs"><Copy size={13} /> Copy annotation JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ icon: Icon, label, tint, children }) {
  return (
    <div className="bg-obsidian/50 border border-edge/60 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className={tint} />
        <span className="h-label">{label}</span>
      </div>
      {children}
    </div>
  );
}
