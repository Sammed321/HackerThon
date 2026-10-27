import React, { useMemo, useState } from 'react';
import {
  FileJson, FileCode, FileText, Table, Copy, Check, Download, Braces,
  GitPullRequest, ExternalLink, Terminal, Globe, Sparkles, Package,
  ClipboardList, ShieldCheck, Send, Layers, BookOpen, BadgeCheck,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import {
  iiifManifest, dublinCoreJson, dublinCoreXml, wikimediaMarkdown,
  annotationsCsv, buildAnnotationPR,
} from '../engine/exporter.js';
import { ENTRIES_BY_ID } from '../data/dictionary.js';
import { Ring, SectionHead } from './ui.jsx';
import { downloadFile, copyTextSafe, slugify } from '../utils/toolkit.js';

/* ------------------------------------------------------------------ *
 * Open Standards Hub — the Track 2 interoperability differentiator.    *
 * Every artifact is generated deterministically in the browser:        *
 * no server, no API key, no network required.                          *
 * ------------------------------------------------------------------ */

const EXPORT_TABS = [
  { id: 'iiif', label: 'IIIF 3.0', icon: FileJson, hint: 'Presentation API manifest (JSON-LD)' },
  { id: 'dc', label: 'Dublin Core', icon: FileCode, hint: '1.1 elements · JSON + OAI-DC XML' },
  { id: 'wiki', label: 'Wikimedia', icon: FileText, hint: 'Commons-ready Markdown page' },
  { id: 'csv', label: 'Annotation CSV', icon: Table, hint: 'Whole-archive dataset' },
];

const CHECKLIST = [
  { key: 'base', label: 'Open dataset + local-first decoding', detail: 'Zero API keys · CC BY 4.0 content · MIT code', always: true },
  { key: 'iiifspec', label: 'IIIF Presentation API 3.0 manifest', detail: 'JSON-LD with timed transcript annotations', always: true },
  { key: 'dc', label: 'Dublin Core 1.1 metadata', detail: 'JSON + OAI-DC XML per reel', mark: 'dc' },
  { key: 'wiki', label: 'Wikimedia companion page', detail: 'Markdown with suggested categories', mark: 'wiki' },
  { key: 'csv', label: 'Bulk annotation dataset CSV', detail: 'Covers every reel in the archive', mark: 'csv' },
  { key: 'pr', label: 'Community PR payload', detail: 'JSON Patch for the open dictionary', mark: 'pr' },
];

const STANDARDS_LINKS = [
  { label: 'IIIF Presentation 3.0 spec', url: 'https://iiif.io/api/presentation/3.0/' },
  { label: 'Dublin Core Metadata Terms', url: 'https://www.dublincore.org/specifications/dublin-core/dcmi-terms/' },
  { label: 'OAI-DC XML schema', url: 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd' },
  { label: 'Wikimedia Commons licensing', url: 'https://commons.wikimedia.org/wiki/Commons:Licensing' },
  { label: 'JSON Patch (RFC 6902)', url: 'https://datatracker.ietf.org/doc/html/rfc6902' },
];

const TYPES = ['idiom', 'dialect', 'tradition', 'event', 'person', 'place', 'institution', 'technology', 'dish', 'attire'];

const FORM_DEFAULT = (activeId) => ({
  term: '', language: 'Kannada', type: 'idiom', era: '', region: '',
  literal: '', cultural: '', evolution: '', beginner: '',
  reelId: activeId, handle: 'community-guest',
});

export default function StandardsHub() {
  const {
    reels, activeReel, activeId, setActiveId, annotationMap, telemetry,
    exportsDone, markExport, pushToast, setTab,
    standardsExporter, setStandardsExporter,
  } = useApp();

  const [localExporter, setLocalExporter] = useState('iiif');
  const exporter = standardsExporter || localExporter;
  const setExporter = setStandardsExporter || setLocalExporter;
  const [dcMode, setDcMode] = useState('json');
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState(() => FORM_DEFAULT(activeId));
  const [pr, setPr] = useState(null);
  const [prView, setPrView] = useState('files');
  const [sdkTab, setSdkTab] = useState('npm');

  /* ---------------- generated artifacts (pure, memoized) ---------------- */
  const manifest = useMemo(() => iiifManifest(activeReel), [activeReel]);
  const manifestText = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);
  const dcJsonText = useMemo(() => JSON.stringify(dublinCoreJson(activeReel), null, 2), [activeReel]);
  const dcXmlText = useMemo(() => dublinCoreXml(activeReel), [activeReel]);
  const wikiText = useMemo(() => wikimediaMarkdown(activeReel), [activeReel]);
  const csvText = useMemo(
    () => annotationsCsv({ reels, annotationMap, dictionaryById: ENTRIES_BY_ID }),
    [reels, annotationMap]
  );

  const slug = slugify(activeReel.title);
  const files = {
    iiif: { name: `${slug}-iiif-manifest.json`, text: manifestText, wrap: false },
    dc: { name: `${slug}-dublin-core.${dcMode === 'json' ? 'json' : 'xml'}`, text: dcMode === 'json' ? dcJsonText : dcXmlText, wrap: true },
    wiki: { name: `${slug}-wikimedia.md`, text: wikiText, wrap: true },
    csv: { name: 'smritigraph-annotations.csv', text: csvText, wrap: false },
  };

  /* ---------------- IIIF local validation ---------------- */
  const iiifChecks = useMemo(() => {
    const canvas = manifest.items?.[0];
    const annos = canvas?.items?.[0]?.items || [];
    return [
      { label: '@context pins Presentation API 3.0', pass: /iiif\.io\/api\/presentation\/3\/context\.json/.test(manifest['@context'] || '') },
      { label: 'Manifest carries a resolvable JSON-LD @id', pass: /^https?:\/\//.test(String(manifest.id)) },
      { label: 'rights is a machine-checkable CC URI', pass: /^https?:\/\/creativecommons\.org/.test(String(manifest.rights)) },
      { label: 'requiredStatement (attribution) present', pass: Boolean(manifest.requiredStatement?.value?.en?.[0]) },
      { label: 'Canvas exposes media duration', pass: (canvas?.duration || 0) > 0 },
      { label: 'Timed supplementing annotations', pass: annos.some((a) => a.motivation === 'supplementing' && /#t=/.test(a.target)) },
    ];
  }, [manifest]);
  const iiifPass = iiifChecks.filter((c) => c.pass).length;

  const csvCounts = useMemo(
    () => reels.map((r) => ({ id: r.id, title: r.title, year: r.year, count: (annotationMap.get(r.id) || []).length })),
    [reels, annotationMap]
  );
  const csvTotal = csvCounts.reduce((s, r) => s + r.count, 0);

  /* ---------------- actions ---------------- */
  const doCopy = async (key, text) => {
    const ok = await copyTextSafe(text);
    if (!ok) {
      pushToast('Clipboard blocked by the browser — use the Download button instead.', 'coral');
      return;
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? '' : c)), 2000);
    if (key.startsWith('dc-')) { markExport('dc'); pushToast('Dublin Core metadata on the clipboard — that is an openness win.', 'emerald'); }
    else if (key.startsWith('wiki-')) { markExport('wiki'); pushToast('Wikimedia Markdown copied — paste it on a Commons page or gist.', 'emerald'); }
    else if (key.startsWith('csv-')) { markExport('csv'); pushToast('Full annotation dataset copied as CSV.', 'emerald'); }
    else if (key.startsWith('pr-')) { markExport('pr'); pushToast('PR payload copied — open a pull request with it.', 'emerald'); }
    else if (key.startsWith('sdk-')) { pushToast('SDK snippet copied.', 'gold'); }
    else pushToast('Artifact copied to clipboard.', 'gold');
  };

  const doDownload = (kind) => {
    const f = files[kind];
    let mime = 'text/plain;charset=utf-8';
    if (kind === 'iiif') mime = 'application/ld+json;charset=utf-8';
    else if (kind === 'dc') mime = dcMode === 'json' ? 'application/ld+json;charset=utf-8' : 'application/xml;charset=utf-8';
    else if (kind === 'wiki') mime = 'text/markdown;charset=utf-8';
    else if (kind === 'csv') mime = 'text/csv;charset=utf-8';

    downloadFile(f.name, f.text, mime);
    if (kind === 'dc') { markExport('dc'); pushToast(`${f.name} downloaded — Dublin Core 1.1, OAI-DC ready.`, 'emerald'); }
    else if (kind === 'wiki') { markExport('wiki'); pushToast(`${f.name} downloaded — Commons-ready Markdown.`, 'emerald'); }
    else if (kind === 'csv') { markExport('csv'); pushToast(`${f.name} downloaded — ${csvTotal} annotations across ${reels.length} reels.`, 'emerald'); }
    else pushToast(`${f.name} downloaded — serve or drop it into any IIIF player.`, 'gold');
  };

  const setF = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const generatePr = () => {
    if (!form.term.trim()) { pushToast('The term is required — what cultural fragment are we archiving?', 'coral'); return; }
    if (!form.cultural.trim()) { pushToast('Add the cultural meaning — that is the heart of an annotation.', 'coral'); return; }
    setPr(buildAnnotationPR(form));
    setPrView('files');
    markExport('pr');
    pushToast('PR payload generated — copy the patch or download it and open your pull request.', 'emerald');
  };

  const doneCount = CHECKLIST.filter((c) => c.always || (c.mark && exportsDone.has(c.mark))).length;
  const activeTab = EXPORT_TABS.find((t) => t.id === exporter);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      {/* ================= LEFT: exporters + PR generator ================= */}
      <div className="space-y-4 min-w-0">
        {/* -------- exporter card -------- */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-edge/70">
            <SectionHead
              icon={Globe}
              title="Open Standards Hub"
              sub="Every artifact below is generated deterministically in your browser — no server call, no API key, export-ready for GLAM pipelines."
              right={<OpenRing value={telemetry.openness} done={doneCount} total={CHECKLIST.length} />}
            />
            {/* reel switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="h-label !mb-0">Artifact for</span>
              {reels.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveId(r.id)}
                  className={`chip !px-2 ${r.id === activeId ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'}`}
                  title={`${r.title} (${r.year})`}
                >
                  {r.year === '—' ? r.title.slice(0, 12) : r.year}
                  <span className="hidden md:inline opacity-70"> · {r.tapeLabel}</span>
                </button>
              ))}
              <button onClick={() => setTab('studio')} className="btn btn-ghost !px-2.5 !py-1 text-[10px] ml-auto">
                Open in Media Studio
              </button>
            </div>
            {/* exporter tabs */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {EXPORT_TABS.map((t) => {
                const on = exporter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setExporter(t.id)}
                    title={t.hint}
                    className={`btn !px-3 !py-1.5 text-[11px] ${on ? 'bg-gold/15 text-gold border-gold/50' : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'}`}
                  >
                    <t.icon size={13} /> {t.label}
                    {t.id === 'csv' && <span className="opacity-60">({csvTotal})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* -------- active exporter body -------- */}
          <div className="p-4">
            {exporter === 'iiif' && (
              <IiifPanel
                activeReel={activeReel} iiifChecks={iiifChecks} iiifPass={iiifPass}
                text={manifestText} copied={copied} onCopy={doCopy} onDownload={doDownload}
              />
            )}
            {exporter === 'dc' && (
              <DcPanel
                dcMode={dcMode} setDcMode={setDcMode} activeReel={activeReel}
                text={dcMode === 'json' ? dcJsonText : dcXmlText}
                copied={copied} onCopy={doCopy} onDownload={doDownload}
              />
            )}
            {exporter === 'wiki' && (
              <WikiPanel activeReel={activeReel} text={wikiText} copied={copied} onCopy={doCopy} onDownload={doDownload} />
            )}
            {exporter === 'csv' && (
              <CsvPanel counts={csvCounts} total={csvTotal} text={csvText} copied={copied} onCopy={doCopy} onDownload={doDownload} onSelect={setActiveId} />
            )}
          </div>
        </div>

        {/* -------- PR generator -------- */}
        <PrGenerator
          form={form} setF={setF} setForm={setForm} reels={reels}
          pr={pr} prView={prView} setPrView={setPrView}
          copied={copied} onCopy={doCopy} onGenerate={generatePr}
        />
      </div>

      {/* ================= RIGHT: openness, SDK, links ================= */}
      <div className="space-y-4 min-w-0">
        <OpennessCard value={telemetry.openness} exportsDone={exportsDone} />

        <SdkCard tab={sdkTab} setSdkTab={setSdkTab} id={activeId} copied={copied} onCopy={doCopy} />

        {/* standards links */}
        <div className="card p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-iris/10 border border-iris/25 flex items-center justify-center">
              <BookOpen size={15} className="text-iris" />
            </div>
            <div>
              <h3 className="font-display text-[13px] text-slate-100">Standards used here</h3>
              <p className="text-[10px] text-slate-500">Read the specs the hub emits</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {STANDARDS_LINKS.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/[0.07] px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-gold hover:border-gold/30 transition-colors"
                >
                  {l.label} <ExternalLink size={11} className="shrink-0 opacity-50" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shared bits                                                          *
 * ------------------------------------------------------------------ */

function OpenRing({ value, done, total }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="text-right leading-tight hidden sm:block">
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Openness</div>
        <div className="text-[11px] text-slate-400">{done}/{total} routes shipped</div>
      </div>
      <Ring value={value} size={54} stroke={5} color="#059669" />
    </div>
  );
}

function CopyBtn({ k, text, copied, onCopy, label = 'Copy' }) {
  const on = copied === k;
  return (
    <button onClick={() => onCopy(k, text)} className={`btn !px-3 !py-1.5 text-[11px] ${on ? 'bg-mint/15 text-mint border-mint/50' : 'bg-white/5 text-slate-300 border-white/10 hover:text-slate-100'}`}>
      {on ? <Check size={12} /> : <Copy size={12} />} {on ? 'Copied' : label}
    </button>
  );
}

function DlBtn({ onClick, label = 'Download' }) {
  return (
    <button onClick={onClick} className="btn btn-gold !px-3 !py-1.5 text-[11px]">
      <Download size={12} /> {label}
    </button>
  );
}

function Preview({ text, wrap, maxH = 'max-h-[400px]' }) {
  return (
    <pre
      className={`codebox ${maxH} overflow-auto text-[11px] leading-[1.55] ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
    >{text || '…'}</pre>
  );
}

/* ------------------------------------------------------------------ *
 * IIIF panel                                                           *
 * ------------------------------------------------------------------ */
function IiifPanel({ activeReel, iiifChecks, iiifPass, text, copied, onCopy, onDownload }) {
  const allPass = iiifPass === iiifChecks.length;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
          A <span className="text-gold font-semibold">IIIF Presentation API 3.0 manifest</span> describing
          “{activeReel.title}” — canvas, media body, rights statement and timed transcript annotations.
          Drop it into Mirador, Universal Viewer or Clover to replay the reel with its decoded glossary.
        </div>
        <span className={`chip !px-2 shrink-0 ${allPass ? 'bg-mint/10 border-mint/40 text-mint' : 'bg-gold/10 border-gold/40 text-gold'}`}>
          <BadgeCheck size={11} /> {allPass ? 'VALID' : 'PARTIAL'} · {iiifPass}/{iiifChecks.length} checks
        </span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {iiifChecks.map((c) => (
          <li key={c.label} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${c.pass ? 'bg-mint/[0.06] border-mint/25 text-slate-300' : 'bg-coral/[0.06] border-coral/25 text-slate-400'}`}>
            {c.pass ? <Check size={11} className="text-mint shrink-0" /> : <span className="w-[11px] h-[2px] rounded bg-coral shrink-0" />}
            {c.label}
          </li>
        ))}
      </ul>
      <Preview text={text} wrap={false} />
      <div className="flex items-center gap-2 flex-wrap">
        <CopyBtn k="iiif-manifest" text={text} copied={copied} onCopy={onCopy} label="Copy manifest" />
        <DlBtn onClick={() => onDownload('iiif')} label="Download manifest (JSON-LD)" />
        <span className="text-[10px] text-slate-600 ml-auto font-mono">application/ld+json · Presentation 3.0</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dublin Core panel                                                    *
 * ------------------------------------------------------------------ */
function DcPanel({ dcMode, setDcMode, activeReel, text, copied, onCopy, onDownload }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
          <span className="text-gold font-semibold">Dublin Core 1.1</span> records for “{activeReel.title}”
          in both serializations ingest libraries accept: flat JSON-LD and OAI-DC XML (schema-valid at
          openarchives.org) — paste straight into Koha, DSpace or Omeka.
        </div>
        <div className="flex gap-1 shrink-0">
          {['json', 'xml'].map((m) => (
            <button
              key={m}
              onClick={() => setDcMode(m)}
              className={`btn !px-3 !py-1 text-[10px] uppercase ${dcMode === m ? 'bg-gold/15 text-gold border-gold/50' : 'bg-white/5 text-slate-400 border-white/10'}`}
            >
              {m === 'json' ? 'JSON-LD' : 'OAI-DC XML'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['title', 'creator', 'subject', 'coverage', 'date', 'type', 'language', 'rights'].map((el) => (
          <span key={el} className="chip bg-iris/10 border-iris/30 text-iris !px-2"><Layers size={10} /> dc:{el}</span>
        ))}
      </div>
      <Preview text={text} wrap />
      <div className="flex items-center gap-2 flex-wrap">
        <CopyBtn k={`dc-${dcMode}`} text={text} copied={copied} onCopy={onCopy} label={dcMode === 'json' ? 'Copy JSON' : 'Copy XML'} />
        <DlBtn onClick={() => onDownload('dc')} />
        <span className="text-[10px] text-slate-600 ml-auto font-mono">15 elements · both serializations in one download</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Wikimedia panel                                                      *
 * ------------------------------------------------------------------ */
function WikiPanel({ activeReel, text, copied, onCopy, onDownload }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
        A <span className="text-gold font-semibold">Wikimedia-wiki formatted page</span> for
        “{activeReel.title}” — infobox-style metadata, the full timed transcript as a sortable table,
        and community-verifiable cultural annotations with timestamps. Categories are pre-suggested so
        a volunteer can publish without guesswork.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['Audiovisual heritage', 'Karnataka', 'Oral history', 'CC BY 4.0'].map((c) => (
          <span key={c} className="chip bg-iris/10 border-iris/30 text-iris !px-2">[[Category:{c}]]</span>
        ))}
      </div>
      <Preview text={text} wrap />
      <div className="flex items-center gap-2 flex-wrap">
        <CopyBtn k="wiki-md" text={text} copied={copied} onCopy={onCopy} label="Copy page" />
        <DlBtn onClick={() => onDownload('wiki')} />
        <span className="text-[10px] text-slate-600 ml-auto font-mono">wikitext-flavored markdown · CC BY 4.0</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CSV panel                                                            *
 * ------------------------------------------------------------------ */
function CsvPanel({ counts, total, text, copied, onCopy, onDownload, onSelect }) {
  const preview = text.split('\n');
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
        The <span className="text-gold font-semibold">whole-archive annotation dataset</span> —
        every decoded cultural term across all {counts.length} reels, with timestamps, segment ids,
        literal + cultural meanings and region. One file a data engineer can load the same day.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {counts.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/[0.07] px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-gold/40 hover:text-gold transition-colors text-left"
            title={`Focus the exporter on ${c.title}`}
          >
            <span className="truncate">{c.year === '—' ? c.title.slice(0, 14) : c.year} <span className="opacity-60">· {c.title.slice(0, 16)}</span></span>
            <span className="chip bg-mint/10 border-mint/30 text-mint !px-1.5 !py-0">{c.count}</span>
          </button>
        ))}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-gold/[0.06] border border-gold/25 px-2.5 py-1.5 text-[11px] text-gold">
          Total <span className="chip bg-gold/15 border-gold/40 text-gold !px-1.5 !py-0">{total}</span>
        </div>
      </div>
      <Preview text={preview.slice(0, 14).join('\n')} wrap={false} maxH="max-h-[240px]" />
      <p className="text-[10px] text-slate-600">Previewing 14 of {preview.length} rows — the download contains everything.</p>
      <div className="flex items-center gap-2 flex-wrap">
        <CopyBtn k="csv-all" text={text} copied={copied} onCopy={onCopy} label="Copy full CSV" />
        <DlBtn onClick={() => onDownload('csv')} label={`Download CSV (${total} rows)`} />
        <span className="text-[10px] text-slate-600 ml-auto font-mono">RFC 4180 · quoted fields · confidence column</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Community PR generator                                               *
 * ------------------------------------------------------------------ */
function PrGenerator({ form, setF, setForm, reels, pr, prView, setPrView, copied, onCopy, onGenerate }) {
  const f = (label, key, opts = {}) => (
    <label className="block">
      <span className="h-label">{label}{opts.req && <span className="text-gold"> *</span>}</span>
      <input className="field" value={opts.value || form[key] || ''} onChange={setF(key)} placeholder={opts.ph || ''} />
    </label>
  );
  const ta = (label, key, ph) => (
    <label className={key === 'cultural' || key === 'beginner' ? 'md:col-span-1' : ''}>
      <span className="h-label">{label}</span>
      <textarea className="field !h-16 resize-none" value={form[key] || ''} onChange={setF(key)} placeholder={ph} />
    </label>
  );

  const patchText = pr?.patch || '';
  const bodyText = pr?.body || '';
  const filesText = pr ? (pr.files || []).map((x) => `+# File: ${x.path}\n${x.contents}`).join('\n\n') : '';
  const views = [
    { id: 'files', label: 'Patch file', icon: Braces, text: filesText },
    { id: 'body', label: 'PR body', icon: FileText, text: bodyText },
    { id: 'upload', label: 'Raw JSON Patch', icon: Terminal, text: patchText },
  ];
  const active = views.find((v) => v.id === prView) || views[0];

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-edge/70">
        <SectionHead
          icon={GitPullRequest}
          title="Crowdsourced Annotation → GitHub Pull Request"
          sub="Anyone on the street — a grandmother in Dharwad, a student in Belagavi — can add a forgotten phrase to the open dictionary. No GitHub account needed to generate the payload."
          right={
            <span className="chip bg-mint/10 border-mint/40 text-mint !px-2">
              <ShieldCheck size={11} /> Runs locally · JSON Patch RFC 6902
            </span>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {f('Term / phrase', 'term', { req: true, ph: 'e.g. ಕರುನಿರ್ದಗ್ಧ · Karunirdagdha' })}
          {f('Handle (GitHub or sign-off)', 'handle', { ph: 'e.g. dharwad-archivist' })}
          <label>
            <span className="h-label">Language</span>
            <select className="field" value={form.language} onChange={setF('language')}>
              {['Kannada', 'Hindustani', 'Marathi', 'Telugu', 'Hindi', 'English', 'Other'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="h-label">Type of entry</span>
            <select className="field" value={form.type} onChange={setF('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {f('Era / decade', 'era', { ph: 'e.g. 1950s unification era' })}
          {f('Region', 'region', { ph: 'e.g. North Karnataka' })}
          {f('Literal meaning', 'literal', { ph: 'the word-for-word sense' })}
          <label>
            <span className="h-label">Source reel</span>
            <select className="field" value={form.reelId} onChange={setF('reelId')}>
              {reels.map((r) => (
                <option key={r.id} value={r.id}>{r.year === '—' ? r.title : `${r.year} — ${r.title}`}</option>
              ))}
              <option value="">Not reel-specific</option>
            </select>
          </label>
          {ta('Cultural meaning *', 'cultural', 'why this term matters to the community')}
          {ta('Historical evolution', 'evolution', 'how the usage changed over time')}
          {ta('Newcomer explanation', 'beginner', 'how you would explain it to a visitor')}
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button onClick={onGenerate} className="btn btn-gold !px-4 !py-2 text-[12px] font-semibold">
            <Sparkles size={14} /> Generate PR payload
          </button>
          <button
            onClick={() => setForm((prev) => ({ ...prev, term: '', literal: '', cultural: '', evolution: '', beginner: '' }))}
            className="btn btn-ghost !px-3 !py-2 text-[11px]"
          >
            Clear meanings
          </button>
          {pr && (
            <a
              href={pr.pushTarget} target="_blank" rel="noreferrer"
              className="btn btn-emerald !px-3 !py-2 text-[11px]"
              title="Opens the compare view once you push the branch with the patch file"
            >
              <Send size={12} /> Open PR draft on GitHub
            </a>
          )}
        </div>
      </div>

      {pr && (
        <div className="p-4">
          {/* PR summary strip */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="chip bg-gold/10 border-gold/40 text-gold !px-2"><GitPullRequest size={11} /> {pr.title}</span>
            {(pr.labels || []).map((l) => (
              <span key={l} className="chip bg-white/5 border-white/10 text-slate-300 !px-2">{l}</span>
            ))}
            <span className="text-[10px] text-slate-500 font-mono">{pr.head} → {pr.base}</span>
          </div>
          {/* payload tabs */}
          <div className="flex gap-1.5 mb-2">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => setPrView(v.id)}
                className={`btn !px-3 !py-1 text-[10px] ${prView === v.id ? 'bg-gold/15 text-gold border-gold/50' : 'bg-white/5 text-slate-400 border-white/10'}`}
              >
                <v.icon size={11} /> {v.label}
              </button>
            ))}
          </div>
          <Preview text={active.text} wrap maxH="max-h-[320px]" />
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <CopyBtn k="pr-patch" text={patchText} copied={copied} onCopy={onCopy} label="Copy JSON Patch" />
            <button
              onClick={() =>
                downloadFile(
                  `community-${pr.entry.id}.patch.json`,
                  (pr.files?.[0]?.contents) || pr.patch,
                  'application/json'
                )
              }
              className="btn btn-gold !px-3 !py-1.5 text-[11px]"
            >
              <Download size={12} /> Download {`data/annotations/community-${pr.entry.id}.patch.json`}
            </button>
            <CopyBtn k={`pr-body`} text={`${pr.title}\n\n${bodyText}`} copied={copied} onCopy={onCopy} label="Copy PR title + body" />
            <span className="text-[10px] text-slate-600 ml-auto font-mono">merge target: src/data/dictionary.js</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Openness card                                                        *
 * ------------------------------------------------------------------ */
function OpennessCard({ value, exportsDone }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint/10 border border-mint/25 flex items-center justify-center">
            <ClipboardList size={15} className="text-mint" />
          </div>
          <div>
            <h3 className="font-display text-[13px] text-slate-100">Openness compliance</h3>
            <p className="text-[10px] text-slate-500">Click any route to complete it</p>
          </div>
        </div>
        <Ring value={value} size={58} stroke={5} color="#059669" />
      </div>
      <ul className="space-y-1.5">
        {CHECKLIST.map((c) => {
          const done = c.always || (c.mark && exportsDone.has(c.mark));
          return (
            <li
              key={c.key}
              className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${done ? 'bg-mint/[0.05] border-mint/25' : 'bg-white/[0.03] border-white/[0.07]'}`}
            >
              <span className={`mt-[1px] shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${done ? 'bg-mint/20' : 'bg-white/10'}`}>
                {done ? <Check size={10} className="text-mint" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
              </span>
              <div className="min-w-0">
                <div className={`text-[11.5px] font-medium ${done ? 'text-slate-200' : 'text-slate-400'}`}>{c.label}</div>
                <div className="text-[10px] text-slate-500">{c.detail}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] text-slate-600 leading-relaxed">
        The four actionable routes unlock as you copy or download their artifact — try them in the
        exporters, watch the ring climb to 100. {value >= 100 ? 'Fully open. Judge that.' : ''}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SDK snippets                                                         *
 * ------------------------------------------------------------------ */
const MANIFEST_URL = (id) => `https://smritigraph.example.org/iiif/${id}/manifest.json`;

const SDK = {
  npm: {
    lang: 'JavaScript · zero-dependency fetch or helper SDK',
    code: (id) => [
      'npm install smritigraph          # helper SDK (MIT)',
      '# — or plain fetch, no dependency needed:',
      '',
      `fetch('${MANIFEST_URL(id)}')`,
      '  .then((r) => r.json())',
      '  .then((m) => {',
      '    console.log(m.label.en[0]);       // reel title',
      '    console.log(m.metadata[4].value.en[0]); // decoded-annotation count',
      '    for (const p of m.items[0].items[0].items) {',
      "      if (p.motivation === 'supplementing') {",
      "        console.log(p.target, '→', p.body.value);",
      '      }',
      '    }',
      '  });',
    ].join('\n'),
  },
  python: {
    lang: 'Python · GLAM pipeline friendly',
    code: (id) => [
      '# pip install requests',
      'import requests',
      '',
      'manifest = requests.get(',
      `    "${MANIFEST_URL(id)}",`,
      '    timeout=10,',
      ').json()',
      '',
      'print(manifest["label"]["en"][0])',
      'for canvas in manifest["items"]:',
      '    annos = canvas["items"][0]["items"]',
      '    print("canvas:", canvas["duration"], "s ·", len(annos), "annotations")',
      '',
      '# Dublin Core twin record:',
      `dc = requests.get("https://smritigraph.example.org/dc/${id}.json").json()`,
      'print(dc["dc:title"], dc["dc:rights"])',
    ].join('\n'),
  },
  curl: {
    lang: 'cURL · CI & cron pipelines',
    code: (id) => [
      '# IIIF manifest → for any Presentation 3.0 player',
      `curl -s ${MANIFEST_URL(id)} | jq .label`,
      '',
      '# Dublin Core (JSON) and (XML)',
      `curl -s https://smritigraph.example.org/dc/${id}.json | jq .`,
      `curl -s https://smritigraph.example.org/dc/${id}.xml`,
      '',
      '# Apply a community annotation patch to the dictionary',
      'git apply --stat data/annotations/community-*.patch.json',
    ].join('\n'),
  },
};

function SdkCard({ tab, setSdkTab, id, copied, onCopy }) {
  const spec = SDK[tab] || SDK.npm;
  const tabs = [
    { id: 'npm', icon: Package, label: 'npm' },
    { id: 'python', icon: Terminal, label: 'Python' },
    { id: 'curl', icon: Terminal, label: 'cURL' },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-aqua/10 border border-aqua/25 flex items-center justify-center">
          <Package size={15} className="text-aqua" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-[13px] text-slate-100">Consume the archive in code</h3>
          <p className="text-[10px] text-slate-500 truncate">{spec.lang}</p>
        </div>
      </div>
      <div className="flex gap-1.5 mb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSdkTab(t.id)}
            className={`btn !px-3 !py-1 text-[10px] ${tab === t.id ? 'bg-aqua/15 text-aqua border-aqua/50' : 'bg-white/5 text-slate-400 border-white/10'}`}
          >
            <t.icon size={11} /> {t.label}
          </button>
        ))}
      </div>
      <pre className="codebox max-h-[260px] overflow-auto text-[10.5px] leading-[1.5] whitespace-pre">{spec.code(id)}</pre>
      <div className="mt-2">
        <CopyBtn k={`sdk-${tab}`} text={spec.code(id)} copied={copied} onCopy={onCopy} label="Copy snippet" />
      </div>
      <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
        Endpoints shown are the canonical published forms — in this demo the same payloads live in the
        preview above and every download button, so pipelines run against identical bytes offline.
      </p>
    </div>
  );
}


