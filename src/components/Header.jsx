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
      className="chip bg-mint/10 border-mint/25 text-mint hover:bg-mint/15 transition"
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
    <header className="relative z-30 sticky top-0 border-b border-edge bg-panel/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="h-16 md:h-[72px] flex items-center gap-3 md:gap-4">
          {/* brand — reference-style amber tile + two-tone wordmark */}
          <button
            onClick={() => onSelect('studio')}
            className="flex items-center gap-2.5 shrink-0 group text-left"
            title="SmritiGraph — return to the studio"
          >
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#451A03] border border-[#F59E0B]/70 flex items-center justify-center shadow-[0_2px_10px_rgba(245,158,11,0.28)] group-hover:scale-105 transition-transform">
              <Radio size={17} className="stroke-[2.4]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-mint border-2 border-panel battement" />
            </div>
            <div className="leading-tight">
              <div className="font-brand font-extrabold text-[17px] md:text-[21px] tracking-[-0.035em] text-slate-100 leading-tight">
                Smriti<span className="text-gold">Graph</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-soft ml-1 md:ml-1.5 align-middle shadow-[0_0_6px_rgba(245,158,11,0.55)]" />
              </div>
              <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.16em] md:tracking-[0.22em] text-slate-500 font-bold mt-0.5 hidden sm:block">
                Heritage Context Engine · Open Archive
              </div>
            </div>
          </button>

          {/* desktop tabs — segmented control, reference-style */}
          <nav className="hidden lg:flex items-center gap-1 ml-1 bg-panel2 border border-edge rounded-xl p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                title={t.hint}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all duration-150 border ${
                  activeTab === t.id
                    ? 'bg-panel text-slate-100 shadow-xs border-edge'
                    : 'text-slate-500 border-transparent hover:text-slate-100 hover:bg-panel/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* telemetry */}
          <div className="hidden xl:flex items-center gap-5 pr-3 border-r border-edge mr-1">
            <StatChip icon={Activity} label="Context density" value={telemetry.contextDensity} tone="text-gold" title="Cultural annotations decoded per minute of archival audio" />
            <StatChip icon={Network} label="Entities linked" value={telemetry.entities} tone="text-aqua" title="Nodes in the Heritage Constellation" />
            <StatChip icon={ShieldCheck} label="Openness" value={`${telemetry.openness}%`} tone="text-mint" title="Open-standards compliance score" />
          </div>

          {/* actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <EngineStatus />
            <button onClick={() => setIngestOpen(true)} className="btn-gold !py-2 !px-3 text-xs" title="Ingest a custom reel, audio or transcript">
              <Upload size={14} className="stroke-[2.6]" /> <span className="hidden sm:inline">Ingest Reel</span>
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
