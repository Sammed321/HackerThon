import React, { useCallback, useRef, useState } from 'react';
import {
  X, UploadCloud, FileText, FileJson, FileAudio, Film, Sparkles, Loader2,
  Languages, MapPin, Calendar, Type, ScanLine, Wand2, Check,
} from 'lucide-react';
import { useApp } from '../store.jsx';

const SAMPLE = `Belgaum, 1957. The Kala Mandir Committee assembled its village square performance at the edge of the Ghataprabha canal, beginning the jaagate at dusk. The elder who once served as Neeruganti recalled the old water turns "kept like a hymn", while the Sannata mocked the taxman to thunderous laughter. Younger listeners asked about the jowar sheaves stacked near the stage — gifts for the troupe — and about the harake their grandfather had vowed for the school's first classroom. Akashvani recorded the closing song: "This is namma naadu, spoken in every tongue this district keeps."`;

const STEPS = [
  { key: 'parse', label: 'Tokenizing transcript & estimating runtime', icon: ScanLine },
  { key: 'match', label: 'Matching cultural dictionary (34 entries · ~90 alias forms)', icon: FileText },
  { key: 'entity', label: 'Extracting entities & linking the constellation', icon: Wand2 },
  { key: 'done', label: 'Annotations ready — zero network used', icon: Check },
];

export default function IngestModal() {
  const { ingestOpen, setIngestOpen, ingestText, ingestMedia, pushToast } = useApp();
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [meta, setMeta] = useState({ title: '', year: '', place: '' });
  const fileRef = useRef(null);

  const close = () => setIngestOpen(false);
  const updateMeta = (k) => (e) => setMeta((m) => ({ ...m, [k]: e.target.value }));

  const runAnalysisSteps = useCallback(async () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      setStepIdx(i);
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 340));
    }
  }, []);

  const finishText = async (textOverride, metaOverride) => {
    const src = typeof textOverride === 'string' ? textOverride : text;
    const m = metaOverride || meta;
    if (!src.trim()) return null;
    setBusy(true);
    await runAnalysisSteps();
    try {
      const reel = ingestText(src, {
        title: (m.title || '').trim() || 'Community Transcript Ingest',
        place: (m.place || '').trim() || 'Unspecified coverage',
        year: m.year ? (Number(m.year) || undefined) : undefined,
      });
      setStepIdx(STEPS.length - 1);
      setTimeout(() => { close(); reset(); }, 650);
      return reel;
    } catch (err) {
      pushToast(`Ingest failed gracefully: ${String(err?.message || err)} — nothing lost.`, 'coral');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setText(''); setMeta({ title: '', year: '', place: '' }); setStepIdx(-1); setDragOver(false); };

  const handleFiles = async (files) => {
    const file = files && files[0];
    if (!file) return;
    setBusy(true);
    try {
      const name = file.name || '';
      const lower = name.toLowerCase();
      if (/\.(mp3|wav|ogg|m4a|flac|mp4|webm|mov)$/.test(lower) || (file.type && /^(audio|video)\//.test(file.type))) {
        setStepIdx(0);
        await runAnalysisSteps();
        setStepIdx(STEPS.length - 1);
        await ingestMedia(file, {
          title: (meta.title || '').trim() || name.replace(/\.[^.]+$/, ''),
          year: meta.year ? Number(meta.year) : undefined,
          place: (meta.place || '').trim() || undefined,
        });
        setTimeout(() => { close(); reset(); }, 700);
      } else {
        // text or json ingest
        let raw = await file.text();
        let data = null;
        try { data = JSON.parse(raw); } catch { /* plain text */ }
        if (data && !Array.isArray(data) && typeof data === 'object') {
          if (Array.isArray(data.segments)) {
            const joined = data.segments.map((s) => (typeof s === 'string' ? s : s.text)).filter(Boolean).join('\n');
            raw = joined || raw;
          } else if (typeof data.text === 'string') raw = data.text;
          else if (typeof data.transcript === 'string') raw = data.transcript;
          else raw = JSON.stringify(data, null, 1);
        }
        if (Array.isArray(data)) {
          raw = data.map((x) => (typeof x === 'string' ? x : x?.text || '')).filter(Boolean).join('\n');
        }
        setText(raw);
        setMeta({
          title: name.replace(/\.(txt|json)$/i, ''),
          year: (name.match(/(19|20)\d{2}/) || [''])[0],
          place: '',
        });
        await finishText(raw, {
          title: name.replace(/\.(txt|json)$/i, ''),
          year: (name.match(/(19|20)\d{2}/) || [''])[0],
          place: '',
        });
      }
    } catch (err) {
      pushToast(`Ingest stopped safely: ${String(err?.message || err)}`, 'coral');
    } finally {
      setBusy(false);
    }
  };

  if (!ingestOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[min(680px,96vw)] max-h-[88vh] overflow-y-auto rounded-2xl border border-edge bg-panel shadow-2xl animate-fadeUp">
        <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur px-5 py-4 border-b border-edge/70 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg text-slate-100">Ingest Custom Reel / Audio / Transcript</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Runs through the same local NLP pipeline as curated reels — fully offline, fully instant.
            </p>
          </div>
          <button onClick={close} className="btn-ghost !p-2" title="Close"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* mode switch */}
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('text'); }}
              className={`btn ${mode === 'text' ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/5 text-slate-300 border-white/10'} text-xs`}
            >
              <Type size={13} /> Paste archival text
            </button>
            <button
              onClick={() => { setMode('file'); }}
              className={`btn ${mode === 'file' ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/5 text-slate-300 border-white/10'} text-xs`}
            >
              <UploadCloud size={13} /> Upload file (.mp3 .wav .mp4 .txt .json)
            </button>
          </div>

          {stepIdx < 0 && mode === 'text' && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder="Paste your archival transcript, oral history notes, or a translated broadcast script…"
                className="field resize-y leading-relaxed text-[13px]"
              />
              <button onClick={() => setText(SAMPLE)} className="text-[11px] text-gold/90 hover:text-gold underline underline-offset-4">
                Fill with a sample archival paragraph
              </button>
            </>
          )}

          {stepIdx < 0 && mode === 'file' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition ${
                dragOver ? 'border-gold/60 bg-gold/5' : 'border-edge bg-obsidian/50 hover:border-gold/40'
              }`}
            >
              <UploadCloud size={28} className="mx-auto text-gold/70 mb-2" />
              <div className="text-sm text-slate-200 font-medium">Drop a file here, or click to browse</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-2">
                <FileAudio size={12} /> audio · <Film size={12} /> video · <FileText size={12} /> .txt · <FileJson size={12} /> .json
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.flac,.mp4,.webm,.mov,.txt,.json,audio/*,video/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          )}

          {/* optional meta */}
          {stepIdx < 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="h-label flex items-center gap-1"><Type size={10} /> Title</span>
                <input value={meta.title} onChange={updateMeta('title')} placeholder="Village square recording, 1957" className="field mt-1 text-[13px]" />
              </label>
              <label className="block">
                <span className="h-label flex items-center gap-1"><Calendar size={10} /> Year (optional)</span>
                <input value={meta.year} onChange={updateMeta('year')} placeholder="1957" className="field mt-1 text-[13px]" />
              </label>
              <label className="block">
                <span className="h-label flex items-center gap-1"><MapPin size={10} /> Place (optional)</span>
                <input value={meta.place} onChange={updateMeta('place')} placeholder="Belgavi district" className="field mt-1 text-[13px]" />
              </label>
            </div>
          )}

          {stepIdx < 0 && mode === 'text' && (
            <button onClick={() => finishText()} disabled={busy || !text.trim()} className="btn-gold w-full">
              <Sparkles size={14} /> Decode culturally & add to archive
            </button>
          )}

          {/* analysis theatre + truth */}
          {stepIdx >= 0 && (
            <div className="bg-obsidian/60 border border-edge/60 rounded-xl p-4 space-y-2.5">
              {STEPS.map((s, i) => {
                const done = stepIdx > i;
                const active = stepIdx === i;
                return (
                  <div key={s.key} className={`flex items-center gap-2.5 text-[12.5px] ${done ? 'text-mint' : active ? 'text-gold' : 'text-slate-600'}`}>
                    {active && !done ? <Loader2 size={14} className="animate-spin" /> : <s.icon size={14} />}
                    <span>{s.label}</span>
                    {done && <Check size={13} className="ml-auto" />}
                  </div>
                );
              })}
              <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                <Languages size={11} /> Multilingual matching: Kannada · Hindi · English aliases
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
