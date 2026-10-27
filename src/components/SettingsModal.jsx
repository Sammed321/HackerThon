import React, { useState } from 'react';
import {
  X, Cpu, Server, Cloud, Braces, CheckCircle2, XCircle, Loader2, Plug, Info,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { PROVIDERS, testConnection } from '../engine/llm.js';

const ICONS = { local: Cpu, ollama: Server, openai: Braces, gemini: Cloud };

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, saveSettings } = useApp();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  if (!settingsOpen) return null;

  const prov = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0];

  const update = (patch) => {
    saveSettings({ ...settings, ...patch });
    setResult(null);
  };
  const updAuth = (id, patch) => {
    saveSettings({ ...settings, [id]: { ...settings[id], ...patch } });
    setResult(null);
  };

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await testConnection(settings);
    setResult(r);
    setTesting(false);
  };

  const close = () => setSettingsOpen(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[min(640px,96vw)] max-h-[88vh] overflow-y-auto rounded-2xl border border-edge bg-panel shadow-2xl animate-fadeUp">
        <div className="sticky top-0 bg-panel/95 backdrop-blur px-5 py-4 border-b border-edge/70 flex items-center justify-between z-10">
          <div>
            <h3 className="font-display text-lg text-slate-100">AI Engine Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live LLM APIs are optional — the deterministic <span className="text-mint">Local Heuristics Engine</span> always covers you offline.
            </p>
          </div>
          <button onClick={close} className="btn-ghost !p-2" title="Close"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* provider switch */}
          <div className="grid grid-cols-2 md:flex gap-2">
            {PROVIDERS.map((p) => {
              const Icon = ICONS[p.id] || Cpu;
              const active = settings.provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setResult(null); update({ provider: p.id }); }}
                  className={`btn ${active ? 'bg-gold/15 text-gold border-gold/50' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'} flex-col !items-start !px-3 !py-2.5 h-auto text-left`}
                >
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold"><Icon size={13} /> {p.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal leading-snug">{p.tagline}</span>
                </button>
              );
            })}
          </div>

          {/* provider fields */}
          <div className="bg-obsidian/60 border border-edge/70 rounded-xl p-4 space-y-3">
            {settings.provider === 'local' && (
              <p className="text-[12.5px] text-slate-400 leading-relaxed">
                The Local Heuristics Engine ships inside this page: alias-gazetteer NLP, intent routing, IDF
                retrieval and grounded synthesis — fully deterministic, zero network. Every answer still
                carries reel + timestamp citations and confidence scores. Perfect for judges &amp; demos in airplane mode.
              </p>
            )}

            {settings.provider === 'ollama' && (
              <>
                <Field label="Ollama base URL" value={settings.ollama.base} onChange={(v) => updAuth('ollama', { base: v })} placeholder="http://localhost:11434" />
                <Field label="Model (must be pulled locally)" value={settings.ollama.model} onChange={(v) => updAuth('ollama', { model: v })} placeholder="gemma2" hint={<code className="text-gold-soft">ollama pull gemma2</code>} />
              </>
            )}

            {settings.provider === 'openai' && (
              <>
                <Field label="Base URL (any OpenAI-compatible gateway)" value={settings.openai.base} onChange={(v) => updAuth('openai', { base: v })} />
                <Field label="API key" value={settings.openai.key} onChange={(v) => updAuth('openai', { key: v })} password placeholder="sk-… or Google AI Studio key for the OpenAI-compat layer" />
                <Field label="Model" value={settings.openai.model} onChange={(v) => updAuth('openai', { model: v })} />
              </>
            )}

            {settings.provider === 'gemini' && (
              <>
                <Field label="Gemini base URL" value={settings.gemini.base} onChange={(v) => updAuth('gemini', { base: v })} />
                <Field label="Gemini API key" value={settings.gemini.key} onChange={(v) => updAuth('gemini', { key: v })} password placeholder="AIza…" />
                <Field label="Model" value={settings.gemini.model} onChange={(v) => updAuth('gemini', { model: v })} placeholder="gemini-2.0-flash" />
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button onClick={runTest} disabled={testing} className="btn-gold text-xs">
                {testing ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />} Test connection
              </button>
              {resultsBlock(result, testing)}
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-panel2/70 border border-edge/60 rounded-xl p-3">
            <Info size={15} className="text-aqua shrink-0 mt-0.5" />
            <p className="text-[12px] text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">Bulletproof fallback guarantee:</span> if an endpoint is
              unreachable (CORS, wrong key, no internet inside the demo hall), SmritiGraph transparently serves the
              answer from the Local Heuristics Engine and shows a toast — the RAG conversation never errors out.
              Retrieved citations, timestamps and confidence stay local and identical in both modes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function resultsBlock(result, testing) {
  if (testing) return <span className="text-[12px] text-slate-500">Probing endpoint…</span>;
  if (!result) return <span className="text-[11px] text-slate-600">Local heuristics: always ready (no key needed).</span>;
  return result.ok ? (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-mint">
      <CheckCircle2 size={13} /> {result.detail} <span className="text-slate-500">({result.ms}ms)</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-coral">
      <XCircle size={13} /> {result.detail} — fallback armed
    </span>
  );
}

function Field({ label, value, onChange, placeholder, password, hint }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="h-label">{label}</span>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>
      <input
        type={password ? 'password' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field font-mono text-[12.5px]"
        spellCheck={false}
      />
    </label>
  );
}
