import React from 'react';
import {
  Activity, Network, ShieldCheck, Settings, Upload, Command, Github, Radio,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { PROVIDERS } from '../engine/llm.js';
import { StatChip } from './ui.jsx';

function EngineStatus() {
  const { settings, setSettingsOpen, chatBusy } = useApp();
  const prov = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0];
  const live = prov.needsKey ? Boolean(
    (prov.id === 'openai' && settings.openai?.key) || (prov.id === 'gemini' && settings.gemini?.key)
  ) : true;
  const dot = chatBusy
    ? 'bg-gold animate-pulse-soft'
    : settings.provider === 'local' ? 'bg-mint' : live ? 'bg-aqua' : 'bg-gold';
  const text = settings.provider === 'local'
    ? 'Local Heuristics Engine'
    : `${prov.name}${live ? '' : ' (key missing → fallback ready)'}`;
  return (
    <button
      onClick={() => setSettingsOpen(true)}
      className="chip bg-emerald-400/10 border-mint/30 text-emerald-200 hover:bg-emerald-400/20 transition"
      title="Click to open AI engine settings"
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {text}
    </button>
  );
}

export default function Header({ tabs, activeTab, onSelect }) {
  const { telemetry, setIngestOpen, setSettingsOpen, setPaletteOpen } = useApp();
  return (
    <header className="relative z-30 sticky top-0 border-b border-edge/60 bg-obsidian/85 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center gap-4">
          {/* brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl bg-panel2 border border-gold/30 flex items-center justify-center shadow-glow">
              <Radio size={18} className="text-gold" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-mint battement" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[17px] text-slate-100 tracking-wide">
                Smriti<span className="text-gold">Graph</span>
              </div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
                Heritage Context Engine · Open Archive
              </div>
            </div>
          </div>

          {/* desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1 ml-2 bg-panel rounded-2xl border border-edge/70 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                title={t.hint}
                className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 ${
                  activeTab === t.id
                    ? 'bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* telemetry */}
          <div className="hidden xl:flex items-center gap-5 pr-2 border-r border-edge/70 mr-2">
            <StatChip icon={Activity} label="Context density" value={telemetry.contextDensity} tone="text-gold" title="Cultural annotations decoded per minute of archival audio" />
            <StatChip icon={Network} label="Entities linked" value={telemetry.entities} tone="text-aqua" title="Nodes in the Heritage Constellation" />
            <StatChip icon={ShieldCheck} label="Openness" value={`${telemetry.openness}%`} tone="text-mint" title="Open-standards compliance score" />
          </div>

          {/* actions */}
          <div className="flex items-center gap-2">
            <EngineStatus />
            <button onClick={() => setIngestOpen(true)} className="btn-gold !py-2 !px-3 text-xs" title="Ingest a custom reel, audio or transcript">
              <Upload size={14} /> <span className="hidden sm:inline">Ingest Reel</span>
            </button>
            <button onClick={() => setPaletteOpen(true)} className="btn-ghost !py-2 !px-2.5" title="Command palette (Ctrl/Cmd + K)">
              <Command size={15} />
            </button>
            <button onClick={() => setSettingsOpen(true)} className="btn-ghost !py-2 !px-2.5" title="AI engine settings">
              <Settings size={15} />
            </button>
            <a
              href="https://github.com/smritigraph/smritigraph"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost !py-2 !px-2.5 hidden md:inline-flex"
              title="Open-source repository (MIT)"
            >
              <Github size={15} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
