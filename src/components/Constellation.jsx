import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Network, RotateCcw, Maximize2, Search, Users, MapPin, Sparkles, Landmark,
  Braces, Clapperboard, X, MessageSquare, Copy, Waypoints,
} from 'lucide-react';
import { useApp } from '../store.jsx';
import { nodeTypeColor } from '../data/graph.js';

const GROUPS = [
  { id: 'people', label: 'People', types: ['person'], icon: Users, c: '#D97706' },
  { id: 'place', label: 'Places', types: ['place'], icon: MapPin, c: '#0891B2' },
  { id: 'culture', label: 'Traditions & Idioms', types: ['idiom', 'dialect', 'tradition'], icon: Sparkles, c: '#7C3AED' },
  { id: 'event', label: 'Events', types: ['event'], icon: Landmark, c: '#E11D48' },
  { id: 'tech', label: 'Institutions & Tech', types: ['institution', 'tech'], icon: Braces, c: '#4F46E5' },
  { id: 'reel', label: 'Reels', types: ['reel'], icon: Clapperboard, c: '#059669' },
];

const TYPE_TO_GROUP = {};
GROUPS.forEach((g) => g.types.forEach((t) => { TYPE_TO_GROUP[t] = g.id; }));

export default function Constellation() {
  const app = useApp();
  const { graph, activeReel, reels } = app;
  const [scope, setScope] = useState('archive');
  const [activeGroups, setActiveGroups] = useState(() => new Set(GROUPS.map((g) => g.id)));
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [, forceTick] = useState(0); // for drawer re-renders on selection changes

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const sim = useRef({
    nodes: [], edges: [], alpha: 1, zoom: 0.9, panX: 0, panY: 0,
    drag: null, panning: false, hover: null, size: { w: 0, h: 0, dpr: 1 },
  });

  const visible = useMemo(() => {
    const allowedTypes = new Set();
    activeGroups.forEach((gid) => {
      const g = GROUPS.find((x) => x.id === gid);
      if (g) g.types.forEach((t) => allowedTypes.add(t));
    });
    let ids = new Set();
    if (scope === 'archive') {
      graph.nodes.forEach((n) => { if (allowedTypes.has(n.type)) ids.add(n.id); });
    } else {
      ids.add(activeReel.id);
      graph.edges.forEach((e) => {
        if (e.a === activeReel.id && allowedTypes.has(graph.byId.get(e.b)?.type)) ids.add(e.b);
        if (e.b === activeReel.id && allowedTypes.has(graph.byId.get(e.a)?.type)) ids.add(e.a);
      });
    }
    return ids;
  }, [graph, scope, activeGroups, activeReel]);

  const visEdges = useMemo(
    () => graph.edges.filter((e) => visible.has(e.a) && visible.has(e.b)),
    [graph, visible]
  );

  // (re)build simulation bodies when the visible set changes (positions preserved)
  useEffect(() => {
    const s = sim.current;
    const prev = new Map(s.nodes.map((n) => [n.id, n]));
    s.nodes = graph.nodes
      .filter((n) => visible.has(n.id))
      .map((n, i) => {
        const old = prev.get(n.id);
        const ang = (i / Math.max(1, visible.size)) * Math.PI * 2;
        return {
          id: n.id, label: n.label, type: n.type, r: n.r || 8, degree: n.degree || 0,
          x: old ? old.x : Math.cos(ang) * 220 * (0.6 + 0.6 * Math.random()),
          y: old ? old.y : Math.sin(ang) * 160 * (0.6 + 0.6 * Math.random()),
          vx: 0, vy: 0,
        };
      });
    s.edges = visEdges.map((e) => ({ a: e.a, b: e.b, w: e.w }));
    s.byId = new Map(s.nodes.map((n) => [n.id, n]));
    s.alpha = Math.max(s.alpha, 0.6);
    forceTick((x) => x + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, graph]);

  // physics step (runs inside the rAF draw loop)
  const step = (s, w, h) => {
    if (s.alpha < 0.012 && !s.drag && !s.dragging) return;
    const nodes = s.nodes;
    const REP = 2600;
    const SPRING = 0.015;
    const LEN = 120;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x; let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = dx * dx + dy * dy; }
        if (d2 > 90000) continue;
        const d = Math.sqrt(d2);
        const f = (REP * (a.r + b.r) * 0.02) / d2;
        const fx = (dx / d) * f; const fy = (dy / d) * f;
        a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
      }
      // gentle gravity to canvas center
      a.vx += -a.x * 0.00035;
      a.vy += -a.y * 0.00035;
    }
    s.edges.forEach((e) => {
      const a = s.byId.get(e.a); const b = s.byId.get(e.b);
      if (!a || !b) return;
      const dx = b.x - a.x; const dy = b.y - a.y;
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const len = e.w > 2 ? LEN * 0.85 : LEN;
      const f = (d - len) * SPRING * Math.min(3, e.w);
      const fx = (dx / d) * f; const fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });
    nodes.forEach((n) => {
      if (s.drag && s.drag.id === n.id) { n.vx = 0; n.vy = 0; return; }
      n.vx *= 0.84; n.vy *= 0.84;
      n.x += Math.max(-6, Math.min(6, n.vx * s.alpha));
      n.y += Math.max(-6, Math.min(6, n.vy * s.alpha));
    });
    s.alpha *= 0.994;
  };

  const worldToScreen = (s, x, y) => [x * s.zoom + s.size.w / 2 + s.panX, y * s.zoom + s.size.h / 2 + s.panY];
  const screenToWorld = (s, sx, sy) => [(sx - s.size.w / 2 - s.panX) / s.zoom, (sy - s.size.h / 2 - s.panY) / s.zoom];

  const draw = () => {
    const canvas = canvasRef.current;
    const s = sim.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h, dpr } = s.size;
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    step(s, w, h);

    const hoverId = s.hover?.id;
    const selId = selected?.id || null;
    const focusId = s.drag?.id || hoverId || selId;
    const neighbors = new Set();
    if (focusId) {
      s.edges.forEach((e) => {
        if (e.a === focusId) neighbors.add(e.b);
        if (e.b === focusId) neighbors.add(e.a);
      });
    }

    // edges
    s.edges.forEach((e) => {
      const a = s.byId.get(e.a); const b = s.byId.get(e.b);
      if (!a || !b) return;
      const [ax, ay] = worldToScreen(s, a.x, a.y);
      const [bx, by] = worldToScreen(s, b.x, b.y);
      const lit = focusId && (e.a === focusId || e.b === focusId);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      const mx = (ax + bx) / 2 + (by - ay) * 0.06;
      const my = (ay + by) / 2 - (bx - ax) * 0.06;
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.strokeStyle = lit ? 'rgba(217,119,6,0.55)' : 'rgba(100,116,139,0.20)';
      ctx.lineWidth = lit ? Math.min(2.4, 0.7 + e.w * 0.3) : Math.min(1.6, 0.4 + e.w * 0.16);
      ctx.stroke();
    });

    // nodes
    s.nodes.forEach((n) => {
      const [x, y] = worldToScreen(s, n.x, n.y);
      const c = nodeTypeColor(n.type);
      const rr = n.r * s.zoom;
      const isFocus = focusId === n.id;
      const isNeighbor = focusId && neighbors.has(n.id);
      const dimmed = focusId && !isFocus && !isNeighbor;

      if (isFocus) {
        const pulse = 1 + 0.12 * Math.sin(performance.now() / 260);
        ctx.beginPath();
        ctx.arc(x, y, rr * pulse + 7, 0, Math.PI * 2);
        ctx.strokeStyle = `${c.ring}55`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(2, rr));
      g.addColorStop(0, c.ring);
      g.addColorStop(1, c.fill);
      ctx.globalAlpha = dimmed ? 0.25 : 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, rr), 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = isFocus ? '#292524' : `${c.ring}aa`;
      ctx.lineWidth = isFocus ? 2 : 1;
      ctx.stroke();

      if (n.type === 'reel') {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(3, rr * 0.55), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(11,15,23,0.85)';
        ctx.fill();
        ctx.fillStyle = c.ring;
        ctx.font = '700 8px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', x, y + 0.5);
      }

      const showLabel = s.zoom > 0.75 || isFocus || isNeighbor;
      if (showLabel) {
        ctx.font = `${n.type === 'reel' ? '600 ' : ''}10px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = n.label.length > 26 ? `${n.label.slice(0, 24)}…` : n.label;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        const tw = ctx.measureText(label).width;
        roundRectFill(ctx, x - tw / 2 - 4, y + rr + 4, tw + 8, 15, 4);
        ctx.fillStyle = dimmed ? 'rgba(100,116,139,0.6)' : isFocus ? '#92400E' : 'rgba(51,65,85,0.95)';
        ctx.fillText(label, x, y + rr + 6);
      }
      ctx.globalAlpha = 1;
    });

    // hint when empty
    if (!s.nodes.length) {
      ctx.fillStyle = 'rgba(100,116,139,0.85)';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No nodes match the current filters — enable more types or switch scope.', w / 2, h / 2);
    }

    requestAnimationFrame(draw);
  };

  useEffect(() => {
    let raf;
    const loop = () => { draw(); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, scope, activeGroups]);

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return undefined;
    const sync = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sim.current.size = { w: r.width, h: r.height, dpr };
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pickNode = (mx, my) => {
    const s = sim.current;
    let best = null; let bestD = 1e9;
    s.nodes.forEach((n) => {
      const [x, y] = worldToScreen(s, n.x, n.y);
      const d = Math.hypot(mx - x, my - y);
      const hitR = n.r * s.zoom + 7;
      if (d < hitR && d < bestD) { best = n; bestD = d; }
    });
    return best;
  };

  const onPointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const n = pickNode(mx, my);
    const s = sim.current;
    if (n) {
      s.drag = { id: n.id, moved: false };
      const [wx, wy] = screenToWorld(s, mx, my);
      s.dragOff = { x: wx - n.x, y: wy - n.y };
      setSelectedIdSilent(n.id);
    } else {
      s.panning = true;
      s.panStart = { x: mx, y: my, panX: s.panX, panY: s.panY };
    }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const setSelectedIdSilent = (id) => {
    // selection for canvas highlight lives in a ref-friendly shim
    sim.current.hover = sim.current.nodes.find((n) => n.id === id) || null;
  };

  const onPointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const s = sim.current;
    if (s.drag) {
      const n = s.byId.get(s.drag.id);
      const [wx, wy] = screenToWorld(s, mx, my);
      n.x = wx - s.dragOff.x; n.y = wy - s.dragOff.y;
      s.drag.moved = true;
      s.alpha = Math.max(s.alpha, 0.3);
      return;
    }
    if (s.panning && s.panStart) {
      s.panX = s.panStart.panX + (mx - s.panStart.x);
      s.panY = s.panStart.panY + (my - s.panStart.y);
      return;
    }
    const n = pickNode(mx, my);
    s.hover = n || null;
    canvasRef.current.style.cursor = n ? 'pointer' : 'grab';
  };

  const onPointerUp = (e) => {
    const s = sim.current;
    const wasDrag = s.drag;
    s.drag = null; s.panning = false; s.panStart = null;
    if (wasDrag && !wasDrag.moved) {
      const n = s.byId.get(wasDrag.id);
      if (n) openDrawer(n.id);
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const s = sim.current;
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const z2 = Math.max(0.45, Math.min(3.2, s.zoom * f));
    s.panX = mx - (mx - s.panX) * (z2 / s.zoom);
    s.panY = my - (my - s.panY) * (z2 / s.zoom);
    s.zoom = z2;
  };

  const openDrawer = (id) => {
    const node = graph.byId.get(id);
    setSelected(node);
  };

  const reheat = () => {
    const s = sim.current;
    s.alpha = 1;
    s.nodes.forEach((n) => { n.vx += (Math.random() - 0.5) * 6; n.vy += (Math.random() - 0.5) * 6; });
  };

  const fit = () => {
    const s = sim.current;
    if (!s.nodes.length) return;
    let minX = 1e9; let maxX = -1e9; let minY = 1e9; let maxY = -1e9;
    s.nodes.forEach((n) => {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    });
    const w = Math.max(220, maxX - minX); const h = Math.max(160, maxY - minY);
    const { w: cw, h: chh } = s.size;
    const z = Math.max(0.45, Math.min(2, Math.min((cw - 120) / w, (chh - 140) / h)));
    s.zoom = z;
    s.panX = -(((minX + maxX) / 2) * z);
    s.panY = -(((minY + maxY) / 2) * z);
  };

  // search: select first match
  const doSearch = (e) => {
    if (e.key !== 'Enter') return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit = sim.current.nodes.find((n) => n.label.toLowerCase().includes(q)) || null;
    if (hit) { openDrawer(hit.id); sim.current.hover = hit; setQuery(''); }
  };

  const toggleGroup = (gid) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next.size ? next : prev; // never allow an empty canvas
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-edge/70 flex-wrap">
          <div className="flex items-center gap-2">
            <Waypoints size={14} className="text-gold" />
            <span className="font-display text-[15px] text-slate-100">Heritage Constellation</span>
            <span className="chip bg-aqua/10 border-aqua/30 text-aqua text-[10px]">{visible.size} nodes · {visEdges.length} links</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={doSearch}
                placeholder="Find node… (↵)"
                className="field !w-40 !py-1.5 !pl-7 text-[11.5px]"
              />
            </div>
            <button onClick={reheat} className="btn-ghost !py-1.5 !px-2 text-[11px]" title="Re-run the force simulation"><RotateCcw size={12} /> Re-run</button>
            <button onClick={fit} className="btn-ghost !py-1.5 !px-2 text-[11px]" title="Fit graph to view"><Maximize2 size={12} /> Fit</button>
          </div>
        </div>

        {/* filters */}
        <div className="px-4 py-2 border-b border-edge/60 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="h-label mr-1">Scope</span>
          <div className="flex rounded-lg border border-edge overflow-hidden">
            {['archive', 'reel'].map((m) => (
              <button
                key={m}
                onClick={() => setScope(m)}
                className={`px-2.5 py-1 transition ${scope === m ? 'bg-gold/15 text-gold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {m === 'archive' ? 'Whole archive' : 'Active reel'}
              </button>
            ))}
          </div>
          <span className="h-label ml-2 mr-1">Types</span>
          {GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGroup(g.id)}
              className={`chip !px-2 transition ${activeGroups.has(g.id) ? '' : 'opacity-35 grayscale'}`}
              style={{ color: g.c, background: `${g.c}14`, borderColor: `${g.c}55` }}
            >
              <g.icon size={10} /> {g.label}
            </button>
          ))}
        </div>

        <div ref={wrapRef} className="relative h-[62vh] min-h-[460px] bg-[#FAFAFB]">
          <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          />
          <div className="absolute bottom-3 left-3 text-[10px] text-slate-600 font-mono pointer-events-none">
            drag nodes · pan background · scroll to zoom · click to inspect
          </div>
        </div>
      </div>

      {/* drawer */}
      <NodeDrawer
        selected={selected}
        onClose={() => setSelected(null)}
        graph={graph}
        reels={reels}
        onSelect={(id) => openDrawer(id)}
        app={app}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Node inspection drawer                                              *
 * ------------------------------------------------------------------ */
function NodeDrawer({ selected, onClose, graph, reels, onSelect, app }) {
  if (!selected) {
    return (
      <aside className="card p-4 hidden xl:block">
        <div className="flex items-center gap-2 mb-2">
          <Network size={14} className="text-gold" />
          <span className="h-label">Node Inspector</span>
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          Click any star in the constellation to inspect its story: relationships, the reels that mention
          it, and one-click paths to keep exploring. Everything here is derived from the same local NLP
          index that answers the RAG chat — one memory, two lenses.
        </p>
        <div className="mt-3 space-y-2">
          {reels.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-[11px] text-slate-400 bg-panel2/50 border border-edge/50 rounded-lg px-2.5 py-2">
              <Clapperboard size={11} className="text-mint shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-slate-300">{r.title}</div>
                <div className="text-[10px] text-slate-600">{r.year} · {(r.annotations || []).length} annotations</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const c = nodeTypeColor(selected.type);
  const neighbors = [];
  graph.edges.forEach((e) => {
    if (e.a === selected.id) neighbors.push({ id: e.b, w: e.w });
    if (e.b === selected.id) neighbors.push({ id: e.a, w: e.w });
  });
  neighbors.sort((a, b) => b.w - a.w);
  const node = graph.byId.get(selected.id) || {};
  const reelNodes = neighbors
    .map((n) => graph.byId.get(n.id))
    .filter((n) => n && n.type === 'reel' && reels.find((r) => r.id === n.id));
  const entityNodes = neighbors
    .map((n) => ({ n: graph.byId.get(n.id), w: n.w }))
    .filter((x) => x.n && x.n.type !== 'reel');

  const askAbout = () => {
    onClose();
    app.setTab('assistant');
    app.send(`Trace how "${selected.label}" is connected across the archive`);
  };

  const jumpReel = (r) => {
    app.setActiveId(r.id);
    app.setTab('studio');
  };

  return (
    <aside className="card overflow-hidden xl:sticky xl:top-20 animate-fadeUp">
      <div className="px-4 py-3 border-b border-edge/70 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg mt-0.5 shrink-0 border" style={{ background: `${c.fill}33`, borderColor: c.ring, boxShadow: `0 0 14px ${c.ring}44` }} />
          <div className="min-w-0">
            <div className="font-display text-[15px] text-slate-100 leading-tight truncate">{selected.label}</div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="chip !px-2" style={{ color: c.ring, background: `${c.ring}14`, borderColor: `${c.ring}55` }}>
                {node.type === 'reel' ? 'Archival Reel' : selected.type}
              </span>
              {node.era && <span className="text-[10px] text-slate-500">{node.era}</span>}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost !p-1.5 shrink-0"><X size={13} /></button>
      </div>

      <div className="p-4 space-y-3.5 max-h-[64vh] overflow-y-auto">
        {node.type !== 'reel' && (
          <div>
            <div className="h-label mb-1">Historical context</div>
            <p className="text-[12.5px] text-slate-300 leading-relaxed">{node.desc || '—'}</p>
          </div>
        )}

        <div>
          <div className="h-label mb-1.5">Relationships ({entityNodes.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {entityNodes.slice(0, 14).map(({ n }) => {
              const nc = nodeTypeColor(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n.id)}
                  className="chip !px-2 hover:scale-105 transition"
                  style={{ color: nc.ring, background: `${nc.ring}12`, borderColor: `${nc.ring}44` }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="h-label mb-1.5">Mentioned in reels ({reelNodes.length})</div>
          <div className="space-y-1">
            {reelNodes.map((n) => {
              const r = reels.find((x) => x.id === n.id);
              return (
                <button key={n.id} onClick={() => jumpReel(r)} className="w-full text-left px-2.5 py-2 rounded-lg bg-mint/5 border border-mint/20 hover:bg-mint/15 transition flex items-center justify-between gap-2">
                  <span className="text-[12px] text-slate-200 truncate">{r.title}</span>
                  <span className="text-mint text-[10px] shrink-0">{r.year}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={askAbout} className="btn-emerald text-xs flex-1"><MessageSquare size={13} /> Ask the Assistant</button>
          <button
            onClick={() => {
              try {
                navigator.clipboard.writeText(JSON.stringify({ id: node.id, label: node.label, type: node.type, desc: node.desc }, null, 2));
                app.pushToast('Node JSON copied to clipboard.', 'emerald');
              } catch { app.pushToast('Clipboard unavailable in this browser.', 'gold'); }
            }}
            className="btn-ghost text-xs"
            title="Copy node JSON"
          >
            <Copy size={13} />
          </button>
        </div>

        <div className="text-[10px] text-slate-600 font-mono pt-1">node id: {node.id} · graph edges: {graph.edges.length}</div>
      </div>
    </aside>
  );
}

function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
