import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Network, MessageSquare, Award, Upload, Settings, Command as CmdIcon,
  Film, Sparkles, RefreshCw, Eraser, Download, Waves, ChevronRight,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { DEMO_PROMPTS } from '../engine/rag.js';
import { iiifManifest, dublinCoreXml, wikimediaMarkdown } from '../engine/exporter.js';
import { downloadFile } from '../utils/toolkit.js';

export default function CommandPalette() {
  const app = useApp();
  const {
    paletteOpen, setPaletteOpen, setTab, setIngestOpen, setSettingsOpen,
    grain, setGrain, restored, setRestored, toggle, send, clearChat,
    activeReel, reels, setActiveId,
  } = app;
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef(null);

  const commands = useMemo(() => (paletteOpen ? buildCommands(app, {
    setTab, setIngestOpen, setSettingsOpen, grain, setGrain, restored, setRestored, toggle, send, clearChat,
  }) : []), [paletteOpen, app, grain, restored, activeReel, reels]); // eslint-disable-line

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => (c.label + ' ' + (c.keywords || '')).toLowerCase().includes(s));
  }, [q, commands]);

  useEffect(() => { if (paletteOpen) { setQ(''); setSel(0); } }, [paletteOpen]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    if (listRef.current && paletteOpen) {
      const el = listRef.current.querySelector(`[data-i="${sel}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [sel, filtered, paletteOpen]);

  if (!paletteOpen) return null;

  const run = (c) => {
    setPaletteOpen(false);
    setTimeout(() => c.run(), 10);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
      <div className="relative w-[min(640px,96vw)] rounded-2xl border border-gold/25 bg-panel shadow-2xl overflow-hidden animate-fadeUp">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-edge/70 bg-obsidian/60">
          <Search size={16} className="text-gold" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (filtered[sel]) run(filtered[sel]); }
              else if (e.key === 'Escape') { e.preventDefault(); setPaletteOpen(false); }
            }}
            placeholder="Type a command… (tabs, exports, reels, demo prompts)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No commands match “{q}”.</div>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              data-i={i}
              onMouseEnter={() => setSel(i)}
              onClick={() => run(c)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                i === sel ? 'bg-gold/10 border-l-2 border-gold' : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <c.icon size={15} className={i === sel ? 'text-gold' : 'text-slate-500'} />
              <div className="flex-1 leading-tight">
                <div className={`text-[13px] ${i === sel ? 'text-slate-100' : 'text-slate-300'}`}>{c.label}</div>
                {c.hint && <div className="text-[11px] text-slate-500">{c.hint}</div>}
              </div>
              {i === sel && <ChevronRight size={13} className="text-gold/60" />}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-edge/70 bg-obsidian/60 flex items-center gap-3 text-[10px] text-slate-500">
          <span>↑↓ navigate</span><span>↵ run</span><span>esc close</span>
          <span className="ml-auto flex items-center gap-1 text-slate-600"><CmdIcon size={10}/> ⌘/Ctrl K</span>
        </div>
      </div>
    </div>
  );
}

function buildCommands(app, actions) {
  const {
    setTab, setIngestOpen, setSettingsOpen, grain, setGrain, restored, setRestored,
    toggle, send, clearChat, activeReel, reels, setActiveId, markExport, pushToast,
  } = { ...app, ...actions };
  const cmds = [];
  const add = (id, icon, label, hint, run, keywords) => cmds.push({ id, icon, label, hint, run, keywords });

  setTab && add('tab-studio', Film, 'Open Media Studio & Cultural Decoder', 'Tab 1', () => setTab('studio'), 'player transcript decoder reel');
  setTab && add('tab-graph', Network, 'Open Heritage Constellation', 'Interactive knowledge graph · Tab 2', () => setTab('graph'), 'graph canvas nodes');
  setTab && add('tab-chat', MessageSquare, 'Open Talk to the Archive', 'Grounded RAG assistant · Tab 3', () => setTab('assistant'), 'chat rag citations question');
  setTab && add('tab-standards', Award, 'Open Open-Standards Hub', 'IIIF · Dublin Core · exports · Tab 4', () => setTab('standards'), 'iiif manifest json wikimedia dublin core');

  setIngestOpen && add('ingest', Upload, 'Ingest custom reel / audio / transcript', 'Local ingestion — works offline', () => setIngestOpen(true), 'upload file mp3 wav mp4 txt json paste');
  setSettingsOpen && add('settings', Settings, 'Configure AI engine (Ollama / OpenAI-compatible / Gemini)', 'Live API or deterministic local fallback', () => setSettingsOpen(true), 'llm ollama gemma model api key');

  toggle && add('play', Sparkles, 'Play / pause the archival player', 'Space', () => toggle(), 'playback pause resume');
  add('grain', Waves, `_archival grain ${grain ? 'off' : 'on'}`, 'Vintage film-grain overlay', () => setGrain(!grain), 'film grain vintage sepia');
  add('restore', RefreshCw, `Restoration mode ${restored ? 'off' : 'on'}`, 'Clean restored profile', () => setRestored(!restored), 'restore enhance clean');

  (reels || []).forEach((r) => {
    add(`reel-${r.id}`, Film, `Load reel: ${r.title}`, `${r.year} · ${r.place}`, () => { setActiveId(r.id); setTab('studio'); }, 'load reel clip archive');
  });

  DEMO_PROMPTS.forEach((p, i) => {
    add(`demo-${i}`, MessageSquare, `Ask: ${p}`, 'Judge demo prompt · grounded citations', () => { setTab('assistant'); send(p); }, 'demo prompt question ask judge');
  });

  if (setTab && activeReel) {
    const exportsFor = (kind) => () => {
      markExport(kind);
      setTab('standards');
    };
    add('exp-iiif', Download, 'Generate IIIF 3.0 manifest (JSON-LD)', 'Presentation API · copy & download', exportsFor('iiif'), 'iiif json-ld manifest codc');
    add('exp-dc', Download, 'Generate Dublin Core metadata', 'JSON + OAI-DC XML', exportsFor('dc'), 'dublin core metadata');
    add('exp-wiki', Download, 'Generate Wikimedia-ready Markdown', 'Commons transcript card', exportsFor('wiki'), 'wikimedia commons markdown');
    add('exp-csv', Download, 'Export annotation dataset (CSV)', 'Reproducible research artifact', exportsFor('csv'), 'csv dataset research');
    add('download-iiif', Download, `Download IIIF manifest JSON for "${activeReel.title}"`, `${activeReel.tapeLabel} · one click`, () => {
      downloadFile(`${activeReel.id}-iiif-manifest.json`, JSON.stringify(iiifManifest(activeReel), null, 2), 'application/json');
      pushToast('IIIF 3.0 manifest downloaded — valid JSON-LD.', 'emerald');
    }, 'download iiif json file');
    add('download-dc', Download, `Download Dublin Core XML for "${activeReel.title}"`, 'OAI-DC XML', () => {
      downloadFile(`${activeReel.id}-dublincore.xml`, dublinCoreXml(activeReel), 'application/xml');
      pushToast('Dublin Core XML downloaded.', 'emerald');
    }, 'download dublin core xml file');
    add('download-wiki', Download, `Download Wikimedia markdown for "${activeReel.title}"`, '.md', () => {
      downloadFile(`${activeReel.id}-wikidata.md`, wikimediaMarkdown(activeReel), 'text/markdown');
      pushToast('Wikimedia-ready markdown downloaded.', 'emerald');
    }, 'download wikimedia markdown file');
  }

  add('clear', Eraser, 'Clear the archive conversation', 'Start a fresh analysis session', () => { clearChat(); setTab('assistant'); }, 'clear chat reset messages');
  add('baseline', Film, 'Switch to the 1924 Belgaum Congress reel', 'The curated demo baseline', () => { setActiveId((reels || [])[0]?.id); setTab('studio'); }, 'reset baseline first reel 1924');

  return cmds;
}
