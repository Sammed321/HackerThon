import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { REELS } from './data/reels.js';
import { ENTRIES_BY_ID } from './data/dictionary.js';
import { annotateReel, buildGraph, analyzeCustomText, metrics } from './engine/analyze.js';
import { ragAnswer, buildCorpus, prepareGroundedPrompt, DEMO_PROMPTS } from './engine/rag.js';
import { callLLM, DEFAULT_SETTINGS, PROVIDERS } from './engine/llm.js';
import { transcribeFile, transcribeSupported } from './engine/transcribe.js';
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
 * Audio output — procedural tape bed + spoken transcript narration    *
 * Curated reels ship without a media file, so the archive synthesises *
 * its own soundscape: brown-noise tape rumble, 50 Hz mains hum and a  *
 * slow flutter LFO. The transcript is read aloud by the browser's     *
 * built-in speech engine. Everything is best-effort: if a browser     *
 * withholds Web Audio or speech, playback still ticks normally.       *
 * ------------------------------------------------------------------ */
const SPEECH_OK = typeof window !== 'undefined' && 'speechSynthesis' in window;
let speechTimer = null;
let activeUtterance = null;

// Chrome populates voices asynchronously; touching the list at boot starts it.
if (SPEECH_OK) {
  try { window.speechSynthesis.getVoices(); } catch { /* noop */ }
}

function audioCtor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function ensureAudio(engine) {
  if (engine.ac) return engine.ac;
  const AC = audioCtor();
  if (!AC) return null;
  try { engine.ac = new AC(); } catch { engine.ac = null; }
  return engine.ac;
}

/** Prefer an Indian-English reader; fall back through English variants. */
function pickVoice() {
  if (!SPEECH_OK) return null;
  let voices = [];
  try { voices = window.speechSynthesis.getVoices() || []; } catch { return null; }
  if (!voices.length) return null;
  for (const lang of ['en-IN', 'en-GB', 'en-US', 'en-AU']) {
    const hit = voices.find((v) => String(v.lang || '').toLowerCase() === lang.toLowerCase());
    if (hit) return hit;
  }
  return voices.find((v) => /^en/i.test(String(v.lang || ''))) || voices[0] || null;
}

function cancelSpeech() {
  if (!SPEECH_OK) return;
  try {
    if (speechTimer) { clearTimeout(speechTimer); speechTimer = null; }
    activeUtterance = null;
    window.speechSynthesis.cancel();
  } catch { /* noop */ }
}

/**
 * Speak a transcript passage. Returns false when the browser has no voice.
 * `cancel()` then `speak()` in the same tick is flaky in Chromium, so the
 * utterance is queued a beat later and any pending one is cleared first.
 */
function speakNarration(text) {
  if (!SPEECH_OK || !text) return false;
  try {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (!clean) return false;
    if (speechTimer) { clearTimeout(speechTimer); speechTimer = null; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice();
    if (v) {
      // A malformed/foreign voice object must never silence the narration.
      try { u.voice = v; } catch { /* keep the engine default */ }
    }
    u.lang = (v && v.lang) || 'en-IN';
    u.rate = 0.97;
    u.pitch = 0.95;
    u.volume = 1;
    u.onend = () => { if (activeUtterance === u) activeUtterance = null; };
    u.onerror = () => { if (activeUtterance === u) activeUtterance = null; };
    speechTimer = setTimeout(() => {
      speechTimer = null;
      activeUtterance = u; // held so Chromium cannot collect it mid-sentence
      try { window.speechSynthesis.speak(u); } catch { /* noop */ }
    }, 70);
    return true;
  } catch {
    return false;
  }
}

/** Newest transcript segment at or before `t`. */
function segmentAt(reel, t) {
  const segs = (reel && reel.segments) || [];
  let best = null;
  for (const s of segs) {
    if (typeof s.t === 'number' && s.t <= t + 0.15 && (!best || s.t > best.t)) best = s;
  }
  return best;
}

/**
 * Start the looping tape bed. It is intentionally quiet and low-passed so
 * speech narration sits clearly on top of it.
 */
function startTapeBed(engine) {
  try {
    const ac = ensureAudio(engine);
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    if (engine.bed) return;

    // 4 s of pink noise (tape hiss) — audible on laptop speakers, unlike
    // pure brown noise, which most small drivers cannot reproduce.
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 4), ac.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2800;
    lp.Q.value = 0.4;

    const bedGain = ac.createGain();
    const now = ac.currentTime;
    bedGain.gain.setValueAtTime(0.0001, now);
    bedGain.gain.exponentialRampToValueAtTime(0.075, now + 0.9);

    // 50 Hz projector-motor hum
    const hum = ac.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 50;
    const humGain = ac.createGain();
    humGain.gain.value = 0.010;

    // slow wow/flutter amplitude drift
    const flutter = ac.createOscillator();
    flutter.type = 'sine';
    flutter.frequency.value = 0.27;
    const flutterGain = ac.createGain();
    flutterGain.gain.value = 0.018;

    src.connect(lp);
    lp.connect(bedGain);
    hum.connect(humGain);
    humGain.connect(bedGain);
    flutter.connect(flutterGain);
    flutterGain.connect(bedGain.gain);
    bedGain.connect(ac.destination);

    try { src.start(); hum.start(); flutter.start(); } catch { /* already started */ }

    // Deliberately not exposed as engine.analyser: the curated waveform keeps
    // its designed speech-like peaks instead of flattening under constant hiss.
    engine.bed = { gain: bedGain, flutter: flutterGain, nodes: [src, hum, flutter] };
  } catch { /* ambience is a bonus — never let it break the clock */ }
}

function stopTapeBed(engine) {
  const bed = engine.bed;
  if (!bed) return;
  engine.bed = null;
  try {
    const ac = engine.ac;
    const now = ac ? ac.currentTime : 0;
    try { bed.flutter && bed.flutter.disconnect(); } catch { /* noop */ }
    try {
      bed.gain.gain.cancelScheduledValues(now);
      bed.gain.gain.setValueAtTime(Math.max(0.0001, bed.gain.gain.value), now);
      bed.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    } catch { /* noop */ }
    (bed.nodes || []).forEach((n) => {
      try { n.stop(now + 0.42); } catch { /* noop */ }
    });
    setTimeout(() => {
      try { bed.gain.disconnect(); } catch { /* noop */ }
    }, 520);
  } catch { /* noop */ }
}

/**
 * Route an uploaded media element through the shared AudioContext so the
 * waveform can visualise it. If this fails the element still plays through
 * its native output — only the visualiser is lost.
 */
function wireMediaElement(engine, el) {
  try {
    const ac = ensureAudio(engine);
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    if (el.__smritiSource) return;
    const src = ac.createMediaElementSource(el);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser);
    analyser.connect(ac.destination);
    el.__smritiSource = src;
    engine.analyser = analyser;
  } catch { /* native playback continues */ }
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
    bed: null, lastSegId: null,
  }).current;
  const toastRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [grain, setGrain] = useState(true);
  const [restored, setRestored] = useState(false);
  const [narrate, setNarrate] = useState(true);
  const narrateRef = useRef(true);
  narrateRef.current = narrate;

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
            cancelSpeech();
            engine.lastSegId = null;
            publish(dur, false);
          }, { once: true });
          engine.audio = el;
          engine.audioReelId = reel.id;
        }
        const el = engine.audio;
        wireMediaElement(engine, el);
        try { el.currentTime = engine.time || 0; } catch { /* noop */ }
        // Always attempt playback, even when visualiser wiring failed.
        const attempt = el.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => {
            try {
              toastRef.current?.('The browser blocked media playback — press Play once more to grant it.', 'coral');
            } catch { /* noop */ }
          });
        }
        engine.playing = true;
      } else {
        if (engine.time >= (reel.duration || 0) - 0.05) engine.time = 0;
        engine.virtualStartedAt = performance.now() - engine.time * 1000;
        engine.lastSegId = null;
        startTapeBed(engine);
        engine.playing = true;
      }
      setPlaying(true);
      publish(engine.time, true);
    } catch { engine.playing = true; setPlaying(true); } // never throw on play
  }, [activeReel, engine]);

  const pause = useCallback(() => {
    try { if (engine.audio) engine.audio.pause(); } catch { /* noop */ }
    stopTapeBed(engine);
    cancelSpeech();
    engine.lastSegId = null;
    engine.playing = false;
    setPlaying(false);
    publish(engine.time, false);
  }, [engine]);

  const toggle = useCallback(() => (engine.playing ? pause() : play()), [pause, play, engine]);

  const seek = useCallback((t) => {
    const dur = activeReel.duration || 0;
    const nt = clamp(t, 0, dur);
    engine.time = nt;
    engine.lastSegId = null;
    cancelSpeech();
    if (engine.audio && engine.audioReelId === activeReel.id) {
      try { engine.audio.currentTime = nt; } catch { /* noop */ }
    } else {
      engine.virtualStartedAt = performance.now() - nt * 1000;
    }
    publish(nt, engine.playing);
  }, [activeReel, engine]);

  const toggleNarrate = useCallback(() => {
    const next = !narrateRef.current;
    narrateRef.current = next;
    setNarrate(next);
    cancelSpeech();
    engine.lastSegId = null;
    if (!next) {
      toastRef.current?.('Narration muted — the tape ambience keeps playing.', 'gold');
      return;
    }
    if (!SPEECH_OK) {
      narrateRef.current = false;
      setNarrate(false);
      toastRef.current?.('Speech synthesis is unavailable here — the tape ambience still plays.', 'coral');
      return;
    }
    toastRef.current?.('Narration on — the transcript is read aloud over the tape bed.', 'emerald');
    if (engine.playing && !engine.audio) {
      const seg = segmentAt(activeReel, engine.time);
      if (seg) {
        engine.lastSegId = seg.id;
        speakNarration(`${seg.speaker ? `${seg.speaker}: ` : ''}${seg.text}`);
      }
    }
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
          stopTapeBed(engine);
          cancelSpeech();
          engine.lastSegId = null;
        }
        // Speak each transcript passage once, for reels without their own audio.
        if (engine.playing && narrateRef.current && !engine.audio) {
          const seg = segmentAt(activeReel, engine.time);
          if (seg && seg.id !== engine.lastSegId) {
            engine.lastSegId = seg.id;
            speakNarration(`${seg.speaker ? `${seg.speaker}: ` : ''}${seg.text}`);
          }
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
    engine.lastSegId = null;
    setPlaying(false);
    stopTapeBed(engine);
    cancelSpeech();
    if (engine.audio && engine.audioReelId !== activeReel.id) {
      try { engine.audio.pause(); } catch { /* noop */ }
      engine.audio = null;
      engine.audioReelId = null;
    }
    engine.analyser = null;
    publish(0, false);
  }, [activeReel, engine]);

  // silence every source when the app unmounts
  useEffect(() => () => {
    cancelSpeech();
    stopTapeBed(engine);
    try { if (engine.audio) engine.audio.pause(); } catch { /* noop */ }
  }, [engine]);

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
  toastRef.current = pushToast;

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
          mediaName: file.name,
          mediaType: file.type,
        };
        addReel(reel);
        resolve(reel);
      }, { once: true });
      el.addEventListener('error', () => reject(new Error('This media file could not be decoded in-browser')), { once: true });
    } catch (err) { reject(err); }
  }), [addReel]);

  /* ---------------- on-device transcription (Whisper WASM) ---------------- */
  const [transcribing, setTranscribing] = useState(null); // { reelId, step, progress, message }
  const transcribeBusyRef = useRef(false);

  const transcribeReel = useCallback(async (reelId) => {
    if (transcribeBusyRef.current) return;
    const reel = reels.find((r) => r.id === reelId);
    if (!reel || !reel.audioUrl || !transcribeSupported()) return;
    transcribeBusyRef.current = true;
    setTranscribing({ reelId, step: 'decode', progress: 0.02, message: 'Decoding audio in the browser…' });
    try {
      // Blob URLs are session-only; refetching keeps this simple and safe.
      const blob = await (await fetch(reel.audioUrl)).blob();
      const file = new File(
        [blob],
        reel.mediaName || `${reel.title || 'reel'}.mp4`,
        { type: reel.mediaType || blob.type || 'audio/mpeg' }
      );
      const result = await transcribeFile(file, (p) => {
        setTranscribing({ reelId, step: p.step, progress: p.value, message: p.message });
      });

      const durationRounded = Math.round(result.duration) || reel.duration || 0;
      let lastEnd = 0;
      const segs = [];
      result.chunks.forEach((c, i) => {
        const text = String(c.text || '').replace(/<\|[^|]*\|>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text) return;
        const ts = Array.isArray(c.timestamp) ? c.timestamp : [];
        let s = typeof ts[0] === 'number' && !Number.isNaN(ts[0]) ? ts[0] : lastEnd;
        let e = typeof ts[1] === 'number' && !Number.isNaN(ts[1]) ? ts[1] : Math.min(durationRounded, s + Math.max(2, text.length / 14));
        s = clamp(s, 0, Math.max(0, durationRounded - 0.5));
        if (e <= s) e = Math.min(durationRounded, s + Math.max(2, text.length / 14));
        lastEnd = e;
        segs.push({
          id: `${reel.id}-w${i}`,
          t: s,
          speaker: 'Whisper (on-device)',
          role: 'auto-transcribed locally, no network',
          text,
        });
      });

      let annCount = 0;
      setReels((prev) => prev.map((r) => {
        if (r.id !== reelId) return r;
        let updated = {
          ...r,
          duration: durationRounded || r.duration,
          segments: segs,
          transcriptSource: segs.length ? 'Whisper tiny.en (on-device, WebAssembly)' : undefined,
        };
        if (segs.length) {
          const { perSegment, flat } = annotateReel(updated);
          annCount = flat.length;
          updated = { ...updated, annotations: flat, perSegment };
        }
        return updated;
      }));

      if (segs.length) {
        pushToast(`On-device transcription complete — ${segs.length} segment${segs.length === 1 ? '' : 's'}, ${annCount} cultural annotation${annCount === 1 ? '' : 's'} decoded instantly.`, 'emerald');
      } else {
        pushToast('Transcription finished — no clear speech was detected in this clip (tiny.en handles English best).', 'gold');
      }
    } catch (err) {
      pushToast(`On-device transcription stopped safely — ${String(err?.message || err).slice(0, 110)}. Your reel is untouched; paste archival text to decode instead.`, 'coral');
    } finally {
      transcribeBusyRef.current = false;
      setTranscribing(null);
    }
  }, [reels, pushToast]);

  const values = {
    // archive
    reels, activeId, activeReel, setActiveId, tab, setTab, graph, annotationMap, corpus,
    // engine + telemetry
    settings, saveSettings, chatBusy, telemetry, exportsDone, markExport,
    // playback
    playing, play, pause, toggle, seek, engine,
    grain, setGrain, restored, setRestored, narrate, toggleNarrate,
    // highlight
    highlight, setHighlight, highlightSegment,
    // overlays
    paletteOpen, setPaletteOpen, ingestOpen, setIngestOpen, settingsOpen, setSettingsOpen,
    contextEntry, openContext, closeContext, drawerNode, setDrawerNode,
    // chat
    messages, send, clearChat, scope, setScope,
    // ingestion + toasts
    addReel, ingestText, ingestMedia, toasts, pushToast,
    // transcription
    transcribing, transcribeReel,
  };

  return <AppCtx.Provider value={values}>{children}</AppCtx.Provider>;
}

function DEFAULT_PROVIDER_SAFE() {
  return { ...DEFAULT_SETTINGS };
}
