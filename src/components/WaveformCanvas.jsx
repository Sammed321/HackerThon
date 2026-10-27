import React, { useMemo, useRef } from 'react';
import { useApp } from '../store.jsx';
import { fmtTime } from '../utils/toolkit.js';

/** deterministic PRNG so each reel's synthesized tape always looks the same */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Pre-computed synthetic tape peaks (speech-like envelope with inter-segment
 * pauses) used when the reel has no real audio to analyze — this is what keeps
 * the "living museum" player alive for curated reels with zero setup.
 * sha: peaks-1
 */
export function makePeaks(reel, bars = 340) {
  const rng = mulberry32(hashStr(reel.id));
  const peaks = new Float32Array(bars);
  const starts = (reel.segments || []).map((s) => s.t).sort((a, b) => a - b);
  for (let i = 0; i < bars; i++) {
    const t = (i / bars) * (reel.duration || 1);
    let env = 0.5 + 0.45 * Math.abs(Math.sin(t * 1.7 + rng() * 0.9));
    env *= 0.6 + 0.5 * Math.abs(Math.sin(t * 0.23 + 2));
    for (const st of starts) {
      if (t > st - 2.2 && t < st) { env *= 0.22; break; }
    }
    const noise = 0.8 + 0.25 * rng();
    peaks[i] = Math.min(1, env * noise);
  }
  return peaks;
}

const MARKER_COLORS = {
  person: '#D97706', place: '#0891B2', tradition: '#7C3AED', idiom: '#7C3AED',
  dialect: '#7C3AED', event: '#E11D48', institution: '#4F46E5', tech: '#4F46E5',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** flatten per-segment alias hits into bucketed cultural markers */
export function makeMarkers(reel) {
  const byT = new Map();
  (reel.segments || []).forEach((seg) => {
    const hits = reel.perSegment ? reel.perSegment[seg.id] : null;
    if (!hits || !hits.length) return;
    const bucket = Math.round(seg.t * 2) / 2;
    if (!byT.has(bucket)) byT.set(bucket, []);
    hits.forEach((h) => {
      const type = h.kind === 'entry' ? h.entry?.type : h.node?.type;
      const label = h.kind === 'entry' ? h.entry?.aliases?.[0] : h.node?.label;
      if (label) byT.get(bucket).push({ t: bucket, type, label, kind: h.kind, entry: h.entry, node: h.node });
    });
  });
  return [...byT.entries()].map(([t, items]) => ({ t, items }));
}

export default function WaveformCanvas({ reel, openEntryAt }) {
  const { engine, seek } = useApp();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const hover = useRef(null);
  const scrubbing = useRef(false);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const stateRef = useRef({});
  stateRef.current = { reel, seek, openEntryAt, peaks: stateRef.current.peaks };

  const peaks = useMemo(() => makePeaks(reel), [reel]);
  stateRef.current.peaks = peaks;

  const markers = useMemo(() => makeMarkers(reel), [reel]);
  stateRef.current.markers = markers;

  const draw = () => {
    const canvas = canvasRef.current;
    const st = stateRef.current;
    if (!canvas || !st.peaks) return;
    const ctx = canvas.getContext('2d');
    const { w, h, dpr } = size.current;
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const r = st.reel;
    const dur = r.duration || 1;
    const time = engine.time || 0;
    const mid = h / 2;
    const bars = st.peaks.length;
    const barW = w / bars;

    const analyser = engine.analyser;
    let freq = null;
    if (analyser && engine.playing) {
      freq = new Uint8Array(analyser.frequencyBinCount);
      try { analyser.getByteFrequencyData(freq); } catch { freq = null; }
    }

    for (let i = 0; i < bars; i++) {
      const t = (i / bars) * dur;
      let amp = st.peaks[i] * (0.34 + 0.6 * (h / 340));
      if (freq) {
        const f = freq[Math.floor((i / bars) * freq.length * 0.65)] / 255;
        amp = Math.min(h * 0.46, amp + f * h * 0.34);
      }
      const x = i * barW;
      const played = t <= time;
      const barH = Math.max(2, amp * h * 0.86);
      if (played) {
        const g = ctx.createLinearGradient(x, mid - barH / 2, x, mid + barH / 2);
        g.addColorStop(0, 'rgba(245,158,11,0.92)');
        g.addColorStop(0.5, 'rgba(251,191,36,0.78)');
        g.addColorStop(1, 'rgba(180,83,9,0.92)');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(100,116,139,0.55)';
      }
      ctx.fillRect(x, mid - barH / 2, Math.max(1, barW * 0.62), barH);
    }

    // cultural markers along the timeline
    (st.markers || []).forEach((m) => {
      const x = (m.t / dur) * w;
      if (x > w - 4) return;
      const color = MARKER_COLORS[m.items[0]?.type] || '#64748B';
      ctx.fillStyle = color;
      ctx.beginPath();
      const y = h - 12;
      ctx.moveTo(x, y - 4.5);
      ctx.lineTo(x + 3.4, y);
      ctx.lineTo(x, y + 4.5);
      ctx.lineTo(x - 3.4, y);
      ctx.closePath();
      ctx.fill();
      if (hover.current && Math.abs(hover.current.x - x) < 9) {
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // playhead
    const px = (time / dur) * w;
    ctx.fillStyle = 'rgba(251,191,36,0.95)';
    ctx.fillRect(px - 1, 6, 2, h - 24);
    ctx.beginPath();
    ctx.arc(px, 7, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // hover tooltip
    if (hover.current) {
      const items = hover.current.items;
      if (items && items.length) {
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
        const labels = [...new Set(items.slice(0, 3).map((it) => it.label))];
        let maxTxt = 40;
        labels.forEach((l) => { maxTxt = Math.max(maxTxt, ctx.measureText(l).width); });
        const tw = Math.min(w - 20, maxTxt + 18);
        const th = labels.length * 14 + 12;
        const tx = Math.min(Math.max(8, hover.current.x - tw / 2), w - tw - 8);
        ctx.fillStyle = 'rgba(11,15,23,0.94)';
        ctx.strokeStyle = 'rgba(245,158,11,0.55)';
        roundRect(ctx, tx, 10, tw, th, 7);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FBBF24';
        labels.forEach((l, i) => ctx.fillText(l, tx + 9, 29 + i * 14));
      }
    }

    // timecode
    ctx.font = '600 12px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = 'rgba(71,85,105,0.8)';
    const tc = `${fmtTime(time)} / ${fmtTime(dur)}`;
    ctx.fillText(tc, w - ctx.measureText(tc).width - 12, h - 16);
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;

  // single persistent render loop
  React.useEffect(() => {
    let raf;
    const loop = () => { drawRef.current(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reel]);

  React.useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return undefined;
    const sync = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: r.width, h: r.height, dpr };
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const xToT = (clientX) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return { x, t: (x / Math.max(1, rect.width)) * (reel.duration || 0) };
  };

  const onMove = (e) => {
    const { x } = xToT(e.clientX);
    const w = Math.max(1, size.current.w);
    const hit = markers.find((m) => Math.abs((m.t / (reel.duration || 1)) * w - x) < 9);
    hover.current = hit ? { x, items: hit.items } : null;
    if (scrubbing.current) seek((x / w) * (reel.duration || 0));
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'crosshair';
  };

  const onDown = (e) => {
    const { t, x } = xToT(e.clientX);
    const w = Math.max(1, size.current.w);
    const hit = markers.find((m) => Math.abs((m.t / (reel.duration || 1)) * w - x) < 9);
    if (hit) {
      if (Number.isFinite(hit.t)) seek(hit.t);
      if (openEntryAt) openEntryAt(hit.items[0], hit.t);
      return;
    }
    scrubbing.current = true;
    if (Number.isFinite(t)) seek(t);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onUp = (e) => {
    scrubbing.current = false;
    try { e?.currentTarget?.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={() => { hover.current = null; }}
        onPointerMove={onMove}
        onPointerCancel={onUp}
      />
    </div>
  );
}
