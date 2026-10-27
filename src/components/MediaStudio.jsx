import React, { useMemo, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Film, FileAudio, FileText, Mic2, Clapperboard,
  CloudFog, Sparkles, MapPin, Languages, Timer, Database, Lightbulb, Library, Upload,
} from 'lucide-react';
import { useApp, useT } from '../store.jsx';
import WaveformCanvas, { makeMarkers } from './WaveformCanvas.jsx';
import TranscriptView from './TranscriptView.jsx';
import { fmtTime } from '../utils/toolkit.js';
import { nodeTypeColor } from '../data/graph.js';
import { ENTRIES_BY_ID } from '../data/dictionary.js';

const KIND_ICON = { audio: FileAudio, film: Film, 'field-recording': Mic2, transcript: FileText };

export default function MediaStudio() {
  const { activeReel, openEntryAt } = useRest();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_296px] gap-4 items-start">
      <ReelRail />
      <div className="space-y-4 min-w-0">
        <Player openEntryAt={openEntryAt} />
        <TranscriptView />
      </div>
      <ContextRail />
    </div>
  );
}

function useRest() {
  const app = useApp();
  const openEntryAt = (hit, t) => {
    app.openContext(hit.kind === 'entry' ? hit.entry : { refId: hit.id });
  };
  return { ...app, openEntryAt };
}

/* ------------------------------------------------------------------ *
 * Reel rail                                                           *
 * ------------------------------------------------------------------ */
function ReelRail() {
  const { reels, activeId, setActiveId, telemetry } = useApp();
  return (
    <aside className="card overflow-hidden lg:sticky lg:top-20">
      <div className="px-4 py-3 border-b border-edge/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library size={14} className="text-gold" />
          <span className="h-label">Archive Collections</span>
        </div>
        <span className="text-[10px] text-slate-500">{reels.length} reels</span>
      </div>
      <div className="max-h-[560px] overflow-y-auto p-2 space-y-1.5">
        {reels.map((r) => {
          const Icon = KIND_ICON[r.kind] || FileAudio;
          const active = r.id === activeId;
          return (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`w-full text-left rounded-xl p-2.5 border transition-all duration-150 ${
                active
                  ? 'bg-gold/10 border-gold/40 shadow-[0_0_18px_-6px_rgba(245,158,11,0.4)]'
                  : 'bg-panel2/40 border-transparent hover:bg-panel2/80 hover:border-edge/60'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${active ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-obsidian/60 border-edge text-slate-400'}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-[10px] px-1 rounded ${active ? 'bg-gold/20 text-gold' : 'bg-obsidian/60 text-slate-500'}`}>{r.year}</span>
                    {r.custom ? <Upload size={9} className="text-mint" /> : <Library size={9} className="text-slate-500" />}
                  </div>
                  <div className={`text-[12px] leading-snug mt-1 line-clamp-2 ${active ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
                    {r.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span>{r.tapeLabel}</span>
                    <span className="flex items-center gap-0.5"><Sparkles size={9} className="text-gold/70" /> {(r.annotations || []).length}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-edge/70 text-[10px] text-slate-500 flex items-center justify-between">
        <span>{telemetry.annotations} annotations archive-wide</span>
        <span className="text-gold/70">{fmtTime(telemetry.minutes * 60)} tape</span>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * Player: screen + transport + progress markers                       *
 * ------------------------------------------------------------------ */
function Player({ openEntryAt }) {
  const app = useApp();
  const { activeReel: reel, playing, play, pause, toggle, seek, engine, grain, setGrain, restored, setRestored } = app;
  const time = useT(8);
  const markers = useMemo(() => makeMarkers(reel), [reel]);
  const markTimes = useMemo(() => {
    const seen = [];
    markers.forEach((m) => { if (!seen.some((x) => Math.abs(x - m.t) < 2)) seen.push(m.t); });
    return seen.sort((a, b) => a - b);
  }, [markers]);

  const jumpMarker = (dir) => {
    const list = markTimes.length ? markTimes : [0];
    let target = null;
    if (dir < 0) target = [...list].reverse().find((t) => t < time - 0.7);
    else target = list.find((t) => t > time + 0.7);
    seek(target != null ? target : (dir < 0 ? 0 : reel.duration));
  };

  const Icon = KIND_ICON[reel.kind] || FileAudio;
  const raw = grain && !restored;

  return (
    <div className="card overflow-hidden">
      {/* screen */}
      <div
        className="relative h-[280px] sm:h-[340px] bg-[#05070D] overflow-hidden"
        style={{ filter: raw ? 'sepia(0.38) contrast(1.06) saturate(0.82)' : restored ? 'contrast(1.1) brightness(1.07) saturate(1.08)' : 'none' }}
      >
        <WaveformCanvas reel={reel} openEntryAt={openEntryAt} />

        {raw && (
          <>
            <div className="grain-layer" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27240%27 height=%27240%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.5%27/%3E%3C/svg%3E")' }} />
            <div className="scanline" />
          </>
        )}
        <div className="vignette" />

        {/* screen furniture */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="chip bg-obsidian/80 border-edge text-slate-300 font-mono !px-2">
            <Icon size={11} className="text-gold" /> {reel.tapeLabel} · {reel.year}
          </span>
          {playing && (
            <span className="chip bg-red-500/15 border-red-400/40 text-red-300 !px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-soft" /> REC
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className={`chip !px-2 ${raw ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-aqua/10 border-aqua/40 text-aqua'}`}>
            {raw ? <CloudFog size={11} /> : <Sparkles size={11} />} {raw ? 'Archival raw' : restored ? 'Restored' : 'Native'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          SmritiGraph · heritage/{reel.kind}
        </div>
        {reel.audioUrl && !playing && (
          <button onClick={play} className="absolute inset-0 z-[5] flex items-center justify-center group" title="Play local media">
            <span className="w-16 h-16 rounded-full bg-gold/90 text-obsidian flex items-center justify-center shadow-glow group-hover:scale-105 transition">
              <Play size={26} className="ml-1" />
            </span>
          </button>
        )}
      </div>

      {/* transport */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-edge/70 flex-wrap">
        <button onClick={playing ? pause : play} className="w-11 h-11 rounded-full bg-gold text-obsidian flex items-center justify-center hover:bg-gold-soft shadow-glow transition active:scale-95" title={playing ? 'Pause (Space)' : 'Play (Space)'}>
          {playing ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
        </button>
        <button onClick={() => jumpMarker(-1)} className="btn-ghost !p-2" title="Previous cultural marker">
          <SkipBack size={15} />
        </button>
        <button onClick={() => jumpMarker(1)} className="btn-ghost !p-2" title="Next cultural marker">
          <SkipForward size={15} />
        </button>
        <div className="font-mono text-[12px] text-slate-400">
          <span className="text-gold">{fmtTime(time)}</span> <span className="text-slate-600">/ {fmtTime(reel.duration)}</span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button onClick={() => setGrain(!grain)} className={`btn text-[11px] !px-2.5 !py-1.5 ${grain ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/5 text-slate-400 border-white/10'}`} title="Toggle vintage film grain + scanlines">
            <Film size={12} /> Grain
          </button>
          <button onClick={() => setRestored(!restored)} className={`btn text-[11px] !px-2.5 !py-1.5 ${restored ? 'bg-aqua/10 text-aqua border-aqua/40' : 'bg-white/5 text-slate-400 border-white/10'}`} title="Toggle archival restoration profile">
            <Sparkles size={12} /> Restore
          </button>
        </div>
      </div>

      {/* slim progress bar with cultural markers */}
      <div className="px-4 pb-4">
        <div
          className="relative h-7 cursor-crosshair group"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * reel.duration);
          }}
        >
          <div className="absolute top-3 left-0 right-0 h-1 rounded-full bg-edge/80 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold-deep to-gold" style={{ width: `${reel.duration ? Math.min(100, (time / reel.duration) * 100) : 0}%` }} />
          </div>
          {markers.map((m, i) => {
            const c = nodeTypeColor(m.items[0]?.type || 'event');
            const left = `${reel.duration ? (m.t / reel.duration) * 100 : 0}%`;
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); seek(m.t); openEntryAt(m.items[0], m.t); }}
                title={m.items.map((it) => it.label).slice(0, 3).join(' · ') + ` @ ${fmtTime(m.t)}`}
                className="absolute top-[7px] -translate-x-1/2 w-2.5 h-2.5 rotate-45 rounded-[2px] border transition hover:scale-150 z-10"
                style={{ left, background: c.fill, borderColor: c.ring, boxShadow: `0 0 6px ${c.ring}66` }}
              />
            );
          })}
          <div
            className="absolute top-[6px] -translate-x-1/2 w-[3px] h-3 rounded bg-gold-soft pointer-events-none"
            style={{ left: `${reel.duration ? Math.min(100, (time / reel.duration) * 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Context rail (xl)                                                   *
 * ------------------------------------------------------------------ */
function ContextRail() {
  const { activeReel: reel, telemetry, openContext, highlightSegment } = useApp();
  const anns = reel.annotations || [];
  const topEntities = useMemo(() => {
    const byRef = new Map();
    anns.forEach((a) => {
      const cur = byRef.get(a.refId) || { ...a, count: 0 };
      cur.count += 1;
      byRef.set(a.refId, cur);
    });
    return [...byRef.values()].sort((a, b) => b.count - a.count).slice(0, 9);
  }, [anns]);

  return (
    <aside className="hidden xl:flex flex-col gap-4">
      <div className="card p-4">
        <div className="h-label mb-2">Reel dossier</div>
        <div className="space-y-2 text-[12px]">
          <Meta icon={Clapperboard} k="Source" v={reel.source} />
          <Meta icon={MapPin} k="Coverage" v={reel.place} />
          <Meta icon={Languages} k="Languages" v={reel.languages.join(' · ')} />
          <Meta icon={Timer} k="Runtime" v={`${fmtTime(reel.duration)} · ${reel.kind}`} />
          <Meta icon={Database} k="Ingest" v={reel.ingestNote} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Mini k="Anns" v={anns.length} />
          <Mini k="Ann/min" v={(anns.length / Math.max(1, reel.duration / 60)).toFixed(1)} />
          <Mini k="Global ✓" v={`${telemetry.openness}%`} />
        </div>
      </div>

      <div className="card p-4">
        <div className="h-label mb-2.5">Dominant decoded entities</div>
        <div className="flex flex-wrap gap-1.5">
          {topEntities.map((e) => {
            const c = nodeTypeColor(e.type);
            return (
              <button
                key={e.refId}
                onClick={() => openContext(e.refKind === 'entry' ? (ENTRIES_BY_ID[e.refId] || { refId: e.refId }) : { refId: e.refId })}
                className="chip !px-2 hover:scale-105 transition"
                style={{ color: c.ring, background: `${c.ring}14`, borderColor: `${c.ring}55` }}
                title={`${e.type} · ${e.count} mention(s)`}
              >
                {e.label} <span className="opacity-60">×{e.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <div className="h-label mb-2.5">Recent cultural markers</div>
        <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
          {anns.slice(0, 14).map((a, i) => {
            const c = nodeTypeColor(a.type);
            return (
              <button
                key={`${a.segId}-${i}`}
                onClick={() => highlightSegment(a.reelId || reel.id, a.t, a.segId)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
              >
                <span className="font-mono text-[10.5px] text-slate-500">{fmtTime(a.t)}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.ring }} />
                <span className="text-[12px] text-slate-300 truncate">{a.label}</span>
                <span className="ml-auto text-[10px] text-slate-600 shrink-0">{a.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4 bg-gold/[0.04] border-gold/25">
        <div className="flex items-center gap-2 mb-1.5">
          <Lightbulb size={13} className="text-gold" />
          <span className="h-label !text-gold/80">Guide</span>
        </div>
        <ul className="text-[11.5px] text-slate-400 space-y-1.5 leading-relaxed list-none">
          <li>◆ <b className="text-slate-300">Space</b> plays; markers jump between decoded cultural moments.</li>
          <li>◆ Each colored term opens its <b className="text-slate-300">Context Card</b> — literal vs cultural meaning, evolution, related reels.</li>
          <li>◆ Upload your own MP3/MP4 via <b className="text-slate-300">Ingest Reel</b> — waveform audio-reactive via Web Audio API.</li>
        </ul>
      </div>
    </aside>
  );
}

function Meta({ icon: Icon, k, v }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={11} className="text-gold/70 mt-1 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-600">{k}</div>
        <div className="text-slate-300 leading-snug">{v}</div>
      </div>
    </div>
  );
}

function Mini({ k, v }) {
  return (
    <div className="bg-obsidian/60 border border-edge/60 rounded-lg px-2 py-1.5 text-center">
      <div className="text-[13px] font-bold text-gold">{v}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{k}</div>
    </div>
  );
}
