import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare, Send, Trash2, BadgeCheck, ChevronDown, ChevronRight,
  Quote, Sparkles, Archive, Wifi, WifiOff, Cpu, Hourglass,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { DEMO_PROMPTS } from '../engine/rag.js';
import { Markdownish } from './ui.jsx';
import { fmtTime, uid } from '../utils/toolkit.js';
import { PROVIDERS } from '../engine/llm.js';

const ENGINE_LABEL = {
  local: { text: 'Local Heuristics Engine', cls: 'bg-mint/10 border-mint/40 text-mint', icon: Cpu },
  'local-fallback': { text: 'Local fallback (model unreachable)', cls: 'bg-gold/10 border-gold/40 text-gold', icon: WifiOff },
  ollama: { text: 'Ollama (local LLM)', cls: 'bg-aqua/10 border-aqua/40 text-aqua', icon: Cpu },
  openai: { text: 'OpenAI-compatible endpoint', cls: 'bg-iris/10 border-iris/40 text-iris', icon: Wifi },
  gemini: { text: 'Gemini API', cls: 'bg-iris/10 border-iris/40 text-iris', icon: Wifi },
};

export default function Assistant() {
  const app = useApp();
  const { messages, send, clearChat, scope, setScope, chatBusy, activeReel, settings, openContext } = app;
  const [input, setInput] = useState('');
  const [openSources, setOpenSources] = useState({});
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, chatBusy]);

  const submit = () => {
    const q = input.trim();
    if (!q || chatBusy) return;
    setInput('');
    send(q);
  };

  const engineChip = useMemo(() => {
    if (settings.provider === 'local') {
      return (
        <span className="chip bg-mint/10 border-mint/40 text-mint !px-2">
          <Cpu size={10} /> Local Heuristics · armed &amp; offline
        </span>
      );
    }
    const p = PROVIDERS.find((x) => x.id === settings.provider);
    return (
      <span className="chip bg-aqua/10 border-aqua/40 text-aqua !px-2" title="Grounded with local retrieval; answer phrased by the live model">
        <Wifi size={10} /> {p?.name || settings.provider} + grounded retrieval
      </span>
    );
  }, [settings.provider]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <div className="card flex flex-col overflow-hidden h-[calc(100vh-190px)] min-h-[520px]">
        {/* header */}
        <div className="px-4 py-3 border-b border-edge/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-gold" />
            <span className="font-display text-[15px] text-slate-100">Talk to the Archive</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-edge overflow-hidden text-[11px]">
              <button
                onClick={() => setScope('reel')}
                className={`px-2.5 py-1.5 transition ${scope === 'reel' ? 'bg-gold/15 text-gold' : 'text-slate-400 hover:text-slate-200'}`}
                title={`Active reel: ${activeReel.title}`}
              >
                This reel
              </button>
              <button
                onClick={() => setScope('archive')}
                className={`px-2.5 py-1.5 transition ${scope === 'archive' ? 'bg-gold/15 text-gold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Whole archive
              </button>
            </div>
            {engineChip}
            <button onClick={clearChat} className="btn-ghost !py-1.5 !px-2 text-[11px]" title="Clear conversation"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* messages */}
        <div ref={listRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && <EmptyState activeReel={activeReel} send={send} />}
          {messages.map((m) => (m.role === 'user'
            ? <UserBubble key={m.id} m={m} />
            : <AiBubble key={m.id} m={m} app={app} openSources={openSources} setOpenSources={setOpenSources} />))}
          {chatBusy && (
            <div className="flex items-center gap-2 text-slate-500 text-[12px]">
              <Hourglass size={13} className="animate-spin text-gold" />
              {settings.provider === 'local'
                ? 'Retrieving grounded segments… (local IDF engine, deterministic)'
                : `Querying ${settings.provider}… (if it fails, the local engine answers instead)`}
            </div>
          )}
        </div>

        {/* suggestions + input */}
        <div className="border-t border-edge/70 px-4 py-3 space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <span className="chip bg-obsidian/60 border-edge text-slate-500 !px-2 shrink-0">Judge demos</span>
            {DEMO_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={chatBusy}
                className="chip shrink-0 bg-gold/[0.07] border-gold/30 text-gold/90 hover:bg-gold/15 hover:text-gold transition !px-2.5 text-[10.5px] whitespace-nowrap"
                title={p}
              >
                <Sparkles size={10} /> {p.length > 52 ? `${p.slice(0, 50)}…` : p}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={1}
              placeholder={scope === 'reel' ? `Ask about "${activeReel.title}"…` : 'Ask across the whole archive — names, idioms, connections…'}
              className="field resize-none max-h-28 py-2.5 text-[13px]"
            />
            <button onClick={submit} disabled={chatBusy || !input.trim()} className="btn-gold !px-4 !py-2.5" title="Ask (Enter)">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* context sidebar */}
      <aside className="hidden xl:flex flex-col gap-4">
        <div className="card p-4">
          <div className="h-label mb-2">Retrieval scope</div>
          <div className="flex items-center gap-2 text-[12px] text-slate-300">
            <Archive size={13} className="text-gold" />
            {scope === 'reel' ? activeReel.title : 'All reels · cross-collection links'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Retrieval is always executed by the built-in IDF engine over the transcript segments — so even
            live-model answers carry the exact same timestamped citations.
          </p>
        </div>
        <div className="card p-4">
          <div className="h-label mb-2.5">How grounded answers work</div>
          <ol className="text-[11.5px] text-slate-400 space-y-1.5 leading-relaxed">
            <li><b className="text-slate-300">1.</b> Intent detection (explain · connect · rename-history · enumerate)</li>
            <li><b className="text-slate-300">2.</b> Dictionary + gazetteer entities matched in your question</li>
            <li><b className="text-slate-300">3.</b> Segments ranked by IDF-weighted overlap</li>
            <li><b className="text-slate-300">4.</b> Cited synthesis with confidence &amp; tape markers</li>
          </ol>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-mint">
            <BadgeCheck size={13} /> Works with zero connectivity — guaranteed.
          </div>
        </div>
        <div className="card p-4">
          <div className="h-label mb-2">Citation anatomy</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-mint/8 border-mint/30 text-mint !px-2"><Quote size={9} /> AG-1024-A @ 1:28</span>
            <span className="chip bg-mint/10 border-mint/30 text-mint hover:bg-mint/20 transition">92%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Reel ID · timestamp · confidence. Clicking jumps to the exact moment in the Studio.</p>
        </div>
      </aside>
    </div>
  );
}

function EmptyState({ activeReel, send }) {
  return (
    <div className="text-center py-6 animate-fadeUp">
      <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-3 shadow-glow">
        <MessageSquare size={22} className="text-gold" />
      </div>
      <h3 className="font-display text-lg text-slate-100">The archive is listening</h3>
      <p className="text-[12.5px] text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
        Ask about archaic idioms, renamed places, hidden people-to-people links — or start with a judge
        demo prompt. Every reply ships with tape-accurate citations and confidence scores, generated by
        the offline Local Heuristics Engine (connect a live LLM in Settings anytime).
      </p>
      <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto mt-5 text-left">
        {DEMO_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="text-left group rounded-xl border border-edge/70 bg-panel2/40 hover:border-gold/40 hover:bg-gold/[0.05] transition px-3.5 py-3"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold/70 mb-1">
              <Sparkles size={10} /> Judge demo
            </div>
            <div className="text-[12.5px] text-slate-300 group-hover:text-slate-100 leading-snug">{p}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ m }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gold/[0.09] border border-gold/25 px-3.5 py-2.5 text-[13px] text-slate-100 animate-fadeUp">
        {m.text}
      </div>
    </div>
  );
}

function AiBubble({ m, app, openSources, setOpenSources }) {
  const eng = ENGINE_LABEL[m.engine] || ENGINE_LABEL.local;
  const conf = Math.round((m.confidence || 0.6) * 100);
  const open = openSources[m.id];
  return (
    <div className="animate-fadeUp">
      <div className="rounded-2xl rounded-bl-md bg-panel2/60 border border-edge/70 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`chip !px-2 ${eng.cls}`}><eng.icon size={10} /> {eng.text}</span>
          <span className="text-[10px] text-slate-500">confidence <b className="text-slate-300">{conf}%</b></span>
        </div>
        <Markdownish text={m.text} />

        {!!(m.citations && m.citations.length) && (
          <div className="mt-3 pt-2.5 border-t border-edge/60">
            <div className="h-label mb-1.5">Grounded source citations — click to verify</div>
            <div className="flex flex-wrap gap-1.5">
              {m.citations.map((c, i) => (
                <button
                  key={`${c.segId}-${i}`}
                  onClick={() => app.highlightSegment(c.reelId, c.t, c.segId)}
                  className="chip bg-mint/5 border-mint/30 text-mint hover:bg-mint/15 transition !px-2"
                  title={`${c.reelTitle} — "${c.quote.slice(0, 90)}…"`}
                >
                  <Quote size={9} /> REEL {String(c.year)} @ {fmtTime(c.t)}
                  <span className="opacity-70">{Math.round((c.confidence || 0.7) * 100)}%</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setOpenSources((s) => ({ ...s, [m.id]: !s[m.id] }))}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-gold transition"
            >
              {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {open ? 'Hide' : 'Show'} {m.citations.length} quoted segment{m.citations.length === 1 ? '' : 's'}
            </button>
            {open && (
              <div className="mt-2 space-y-1.5">
                {m.citations.map((c, i) => (
                  <div key={`q-${c.segId}-${i}`} className="bg-obsidian/50 border border-edge/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1 flex-wrap">
                      <span className="font-mono text-gold/80">{c.reelTitle}</span>
                      <span>@ {fmtTime(c.t)}</span>
                      <span>· {c.speaker}</span>
                    </div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">“{c.quote}”</p>
                    <button
                      onClick={() => app.highlightSegment(c.reelId, c.t, c.segId)}
                      className="mt-1 text-[10.5px] text-mint hover:underline"
                    >
                      Jump to this moment →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!!(m.followups && m.followups.length) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {m.followups.map((f) => (
              <button
                key={f}
                onClick={() => app.send(f)}
                className="chip bg-obsidian/60 border-edge text-slate-400 hover:text-gold hover:border-gold/40 transition !px-2 text-[10.5px]"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
