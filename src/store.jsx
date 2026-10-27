import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { REELS } from './data/reels.js';
import { ENTRIES_BY_ID } from './data/dictionary.js';
import { annotateReel, buildGraph, analyzeCustomText, metrics } from './engine/analyze.js';
import { ragAnswer, buildCorpus, prepareGroundedPrompt, DEMO_PROMPTS } from './engine/rag.js';
import { callLLM, testConnection, DEFAULT_SETTINGS, PROVIDERS } from './engine/llm.js';
import { clamp, uid } from './utils/toolkit.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/* ------------------------------------------------------------------ *
 * Player publish/subscribe bus (module scope; one provider per app)   *
 * ------------------------------------------------------------------ */
const SUBS = new Map(); // fn -> { interval, last }
function publish(t, playing) {
  const now = performance.now();
  SUBS.forEach((info, fn) => {
    if (now - info.last >= info.interval) {
      info.last = now;
      try { fn(t, playing); } catch { /* listener errors are isolated */ }
    }
  });
}

/** Throttled playback-time hook — small re-render surface, smooth UI. */
export function useT(hz = 12) {
  const { engine } = useApp();
  const [t, setT] = useState(0);
  useEffect(() => {
    const fn = (time) => setT(time);
    SUBS.set(fn, { interval: 1000 / hz, last: 0 });
    setT(engine.time);
    return () => SUBS.delete(fn);
  }, [engine, hz]);
  return t;
}

/* ------------------------------------------------------------------ *
 * Boot the curated reels through the annotator once                   *
 * ------------------------------------------------------------------ */
function bootReels() {
  return REELS.map((reel) => {
    const { perSegment, flat } = annotateReel(reel);
    return { ...reel, annotations: flat, perSegment };
  });
}

/* ------------------------------------------------------------------ *
 * Provider                                                            *
 * ------------------------------------------------------------------ */
export function AppProvider({ children }) {
  /* ---------------- archive state ---------------- */
  const [reels, setReels] = useState(bootReels);
  const [activeId, setActiveId] = useState(REELS[0].id);
  const [tab, setTab] = useState('studio');

  const annotationMap = useMemo(() => {
    const m = new Map();
    reels.forEach((r) => m.set(r.id, r.annotations || []));
    return m;
  }, [reels]);

  const graph = useMemo(() => buildGraph(reels, annotationMap), [reels, annotationMap]);
  const corpus = useMemo(() => buildCorpus({ reels }), [reels]);

  const activeReel = useMemo(
    () => reels.find((r) => r.id === activeId) || reels[0],
    [reels, activeId]
  );

  const baseMetrics = useMemo(() => metrics(reels, annotationMap), [reels, annotationMap]);

  const [exportsDone, setExportsDone] = useState(new Set());
  const markExport = useCallback((kind) => {
    setExportsDone((prev) => {
      if (prev.has(kind)) return prev;
      const next = new Set(prev);
      next.add(kind);
      return next;
    });
  }, []);

  const openness = useMemo(() => {
    let score = 40; // open dataset + built-in standards tooling always available
    ['dc', 'wiki', 'csv', 'pr'].forEach((k) => { if (exportsDone.has(k)) score += 15; });
    return Math.min(100, score);
  }, [exportsDone]);

  const telemetry = {
    contextDensity: baseMetrics.contextDensity,
    entities: graph.nodes.length,
    edges: graph.edges.length,
    annotations: baseMetrics.annCount,
    minutes: baseMetrics.minutes,
    openness,
    reels: reels.length,
  };

  /* ---------------- playback engine ---------------- */
  const engine = useRef({
    time: 0, playing: false, audio: null, audioReelId: null,
    virtualStartedAt: 0, ac: null, analyser: null,
  }).current;
  const [playing, setPlaying] = useState(false);
  const [grain, setGrain] = useState(true);
  const [restored, setRestored] = useState(false);

  const play = useCallback(() => {
    const reel = activeReel;
    try {
      if (reel.audioUrl) {
        if (!engine.audio || engine.audioReelId !== reel.id) {
          if (engine.audio) { try { engine.audio.pause(); } catch { /* noop */ } }
          const dur = reel.duration || 0;
          const el = new Audio(reel.audioUrl);
          el.preload = 'auto';
          el.addEventListener('ended', () => {
            engine.time = dur;
            engine.playing = false;
            setPlaying(false);
            publish(dur, false);
          }, { once: true });
          engine.audio = el;
          engine.audioReelId = reel.id;
        }
        const el = engine.audio;
        if (!engine.ac) {
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            engine.ac = new AC();
            const src = engine.ac.createMediaElementSource(el);
            const analyser = engine.ac.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyser.connect(engine.ac.destination);
            engine.analyser = analyser;
          } catch { engine.analyser = null; }
        }
        if (engine.ac && engine.ac.state === 'suspended') engine.ac.resume().catch(() => {});
        el.currentTime = engine.time || 0;
        el.play().catch(() => { /* autoplay guard */ });
        engine.playing = true;
      } else {
        if (engine.time >= (reel.duration || 0) - 0.05) engine.time = 0;
        engine.virtualStartedAt = performance.now() - engine.time * 1000;
        engine.playing = true;
      }
      setPlaying(true);
      publish(engine.time, true);
    } catch { engine.playing = true; setPlaying(true); } // never throw on play
  }, [activeReel, engine]);

  const pause = useCallback(() => {
    try { if (engine.audio) engine.audio.pause(); } catch { /* noop */ }
    engine.playing = false;
    setPlaying(false);
    publish(engine.time, false);
  }, [engine]);

  const toggle = useCallback(() => (engine.playing ? pause() : play()), [pause, play, engine]);

  const seek = useCallback((t) => {
    const dur = activeReel.duration || 0;
    const nt = clamp(t, 0, dur);
    engine.time = nt;
    if (engine.audio && engine.audioReelId === activeReel.id) {
      try { engine.audio.currentTime = nt; } catch { /* noop */ }
    } else {
      engine.virtualStartedAt = performance.now() - nt * 1000;
    }
    publish(nt, engine.playing);
  }, [activeReel, engine]);

  useEffect(() => {
    let raf;
    const loop = () => {
      if (engine.playing) {
        if (engine.audio && engine.audioReelId === activeReel.id) {
          engine.time = engine.audio.currentTime;
          if (engine.audio.ended) { engine.playing = false; setPlaying(false); }
        } else {
          engine.time = (performance.now() - engine.virtualStartedAt) / 1000;
        }
        if (engine.time >= (activeReel.duration || 0) - 0.02) {
          engine.time = activeReel.duration || 0;
          engine.playing = false;
          setPlaying(false);
        }
      }
      publish(engine.time, engine.playing);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeReel, engine]);

  // reset the clock on reel switch
  useEffect(() => {
    engine.time = 0;
    engine.virtualStartedAt = performance.now();
    engine.playing = false;
    setPlaying(false);
    if (engine.audio && engine.audioReelId !== activeReel.id) {
      try { engine.audio.pause(); } catch { /* noop */ }
      engine.audio = null;
      engine.audioReelId = null;
      engine.analyser = null;
    }
    publish(0, false);
  }, [activeReel, engine]);

  /* ---------------- highlight sync (citations → transcript) ---------------- */
  const [highlight, setHighlight] = useState(null);
  const highlightSegment = useCallback((reelId, t, segId) => {
    const switching = reelId && reelId !== activeId;
    if (reelId && reelId !== activeId) setActiveId(reelId);
    setTab('studio');
    setHighlight({ reelId, segId, t, key: Date.now() });
    if (typeof t === 'number' && !Number.isNaN(t)) {
      setTimeout(() => seek(t), switching ? 80 : 0);
    }
  }, [activeId, seek]);

  /* ---------------- modals & overlays ---------------- */
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextEntry, setContextEntry] = useState(null); // dict entry | {kind:'node', node}
  const openContext = useCallback((payload) => setContextEntry(payload), []);
  const closeContext = useCallback(() => setContextEntry(null), []);
  const [drawerNode, setDrawerNode] = useState(null);

  /* ---------------- AI settings ---------------- */
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('smritigraph.settings.v1');
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_PROVIDER_SAFE();
  });
  const saveSettings = useCallback((next) => {
    setSettings(next);
    try { localStorage.setItem('smritigraph.settings.v1', JSON.stringify(next)); } catch { /* ignore */ }
    const prov = PROVIDERS.find((p) => p.id === next.provider) || PROVIDERS[0];
    pushToast(`AI engine set to ${prov.name}.`, 'emerald');
  }, []);

  /* ---------------- toasts ---------------- */
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((text, tone = 'gold') => {
    const id = uid('toast');
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4600);
  }, []);

  /* ---------------- chat ---------------- */
  const [messages, setMessages] = useState([]);
  const [scope, setScope] = useState('archive');
  const [chatBusy, setChatBusy] = useState(false);

  const send = useCallback(async (query) => {
    const q = String(query || '').trim();
    if (!q || chatBusy) return;
    setChatBusy(true);
    setMessages((prev) => [...prev, { id: uid('m'), role: 'user', text: q }]);

    const ctx = {
      reels, activeReelId: activeId, activeReel, scope, graph, annotationMap, corpus,
      dictionaryById: ENTRIES_BY_ID,
    };
    let aiMsg = null;
    const provider = settings.provider;
    try {
      if (provider !== 'local') {
        const prepped = prepareGroundedPrompt(q, ctx);
        try {
          const text = await callLLM(settings, { system: prepped.system, user: prepped.user });
          if (!text) throw new Error('Model returned an empty response');
          const cits = prepped.retrieved.slice(0, 4).map((r) => ({
            reelId: r.reelId, reelTitle: r.reelTitle, year: r.year, segId: r.segId, t: r.t,
            quote: r.text, speaker: r.speaker, confidence: r.confidence,
          }));
          aiMsg = {
            id: uid('m'), role: 'ai', text, citations: cits,
            confidence: prepped.confidence, engine: provider,
            followups: DEMO_PROMPTS.slice(0, 3),
          };
        } catch (err) {
          pushToast(`${String(err?.message || err).slice(0, 90) || 'Model unreachable'} → served by the Local Heuristics Engine instead.`, 'coral');
          const res = ragAnswer(q, ctx);
          aiMsg = { id: uid('m'), role: 'ai', ...res, engine: 'local-fallback' };
        }
      } else {
        const res = ragAnswer(q, ctx);
        aiMsg = { id: uid('m'), role: 'ai', ...res };
      }
    } catch (err) {
      aiMsg = {
        id: uid('m'), role: 'ai',
        text: `I hit an internal snag but stayed standing (that's the promise): **${String(err?.message || err).slice(0, 120)}**\n\nTry one of the demo prompts — they run fully offline.`,
        citations: [], confidence: 0.5, engine: 'local-fallback', followups: DEMO_PROMPTS.slice(0, 2),
      };
    }
    setMessages((prev) => [...prev, aiMsg]);
    setChatBusy(false);
  }, [chatBusy, reels, activeId, activeReel, scope, graph, annotationMap, corpus, settings, pushToast]);

  const clearChat = useCallback(() => setMessages([]), []);

  /* ---------------- ingestion ---------------- */
  const addReel = useCallback((reel) => {
    setReels((prev) => [...prev, reel]);
    setActiveId(reel.id);
    setTab('studio');
    const n = (reel.annotations || []).length;
    pushToast(`Reel ingested. Local engine surfaced ${n} cultural annotation${n === 1 ? '' : 's'} instantly — zero network needed.`, 'emerald');
  }, [pushToast]);

  const ingestText = useCallback((text, meta) => {
    const reel = analyzeCustomText(text, meta);
    addReel(reel);
    return reel;
  }, [addReel]);

  const ingestMedia = useCallback((file) => new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const el = isVideo ? document.createElement('video') : new Audio();
      el.preload = 'metadata';
      el.src = url;
      el.addEventListener('loadedmetadata', () => {
        const reel = {
          id: `custom-${uid('r').slice(-8)}`,
          title: file.name.replace(/\.[^.]+$/, ''),
          year: new Date(file.lastModified).getFullYear() || '—',
          month: '',
          kind: isVideo ? 'film' : 'audio',
          duration: Math.round(el.duration) || 120,
          source: `Local file upload (${file.name})`,
          place: 'Unspecified coverage',
          languages: ['Auto-detected'],
          tapeLabel: `LOCAL-${Date.now().toString(36).toUpperCase().slice(-5)}`,
          ingestNote: 'Ingested in the browser; decoded by the built-in offline heuristics engine.',
          description: `Community-uploaded ${isVideo ? 'video' : 'audio'} ingest, ready for cultural context decoding.`,
          tags: ['Community Ingest', isVideo ? 'Video' : 'Audio'],
          segments: [],
          annotations: [],
          perSegment: {},
          discoveredNodes: [],
          custom: true,
          audioUrl: url,
          mediaType: file.type,
        };
        addReel(reel);
        resolve(reel);
      }, { once: true });
      el.addEventListener('error', () => reject(new Error('This media file could not be decoded in-browser')), { once: true });
    } catch (err) { reject(err); }
  }), [addReel]);

  const values = {
    // archive
    reels, activeId, activeReel, setActiveId, tab, setTab, graph, annotationMap, corpus,
    // engine + telemetry
    settings, saveSettings, chatBusy, telemetry, exportsDone, markExport,
    // playback
    playing, play, pause, toggle, seek, engine,
    grain, setGrain, restored, setRestored,
    // highlight
    highlight, setHighlight, highlightSegment,
    // overlays
    paletteOpen, setPaletteOpen, ingestOpen, setIngestOpen, settingsOpen, setSettingsOpen,
    contextEntry, openContext, closeContext, drawerNode, setDrawerNode,
    // chat
    messages, send, clearChat, scope, setScope,
    // ingestion + toasts
    addReel, ingestText, ingestMedia, toasts, pushToast,
  };

  return <AppCtx.Provider value={values}>{children}</AppCtx.Provider>;
}

function DEFAULT_PROVIDER_SAFE() {
  return { ...DEFAULT_SETTINGS };
}
