/**
 * Local NLP & Annotation Engine (deterministic, fully offline).
 * - matches dictionary aliases + gazetteer entities inside reel transcripts
 * - builds the SmritiGraph knowledge graph (nodes + weighted edges)
 * - derives telemetry (context density, entity count)
 * - analyzes custom ingested text with the same pipeline so uploaded reels
 *   behave exactly like curated ones — even with zero connectivity.
 */
import { DICTIONARY } from '../data/dictionary.js';
import { GAZETTEER, CURATED_EDGES } from '../data/graph.js';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ *
 * Alias index built once: normalized alias → { kind, id, entry|node } *
 * ------------------------------------------------------------------ */
const ALIAS_INDEX = [];
for (const entry of DICTIONARY) {
  for (const alias of entry.aliases) {
    ALIAS_INDEX.push({ alias, norm: alias.toLowerCase(), kind: 'entry', id: entry.id, entry });
  }
}
for (const node of GAZETTEER) {
  for (const alias of node.aliases) {
    ALIAS_INDEX.push({ alias, norm: alias.toLowerCase(), kind: 'entity', id: node.id, node });
  }
}
ALIAS_INDEX.sort((a, b) => b.alias.length - a.alias.length); // longest-match first

const regexCache = new Map();
function getRegex(norm) {
  let re = regexCache.get(norm);
  if (!re) {
    // \p{L}/\p{N} boundaries keep word-part matches out while tolerating
    // mixed-script archival text (Kannada + Latin in the same sentence).
    re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRe(norm)})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
    regexCache.set(norm, re);
  }
  return re;
}

function matchAliasInText(text) {
  const found = [];
  const taken = new Array(text.length).fill(false);
  for (const item of ALIAS_INDEX) {
    const re = getRegex(item.norm);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const at = m.index + (m[1] ? m[1].length : 0);
      const end = at + item.alias.length;
      let overlap = false;
      for (let i = at; i < end; i++) if (taken[i]) { overlap = true; break; }
      if (!overlap) {
        for (let i = at; i < end; i++) taken[i] = true;
        found.push({ ...item, start: at, end, surface: text.slice(at, end) });
      }
      if (m.index === re.lastIndex) break; // zero-length safety
    }
  }
  found.sort((a, b) => a.start - b.start);
  return found;
}

/* ------------------------------------------------------------------ *
 * Reel → annotations                                                  *
 * ------------------------------------------------------------------ */
export function annotateReel(reel) {
  const perSegment = {};
  const flat = [];
  reel.segments.forEach((seg) => {
    const hits = matchAliasInText(seg.text);
    perSegment[seg.id] = hits;
    hits.forEach((h) => flat.push({ segId: seg.id, t: seg.t, surface: h.surface, ...pickRef(h) }));
  });
  return { perSegment, flat };
}

export { matchAliasInText as findRefsInText };

function pickRef(hit) {
  if (hit.kind === 'entry') {
    const e = hit.entry;
    return { refKind: 'entry', refId: e.id, label: e.aliases[0], type: e.type };
  }
  const n = hit.node;
  return { refKind: 'entity', refId: n.id, label: n.label, type: n.type };
}

/* ------------------------------------------------------------------ *
 * Custom ingestion: crude but honest NLP over arbitrary text          *
 * ------------------------------------------------------------------ */
const STOP = new Set('the a an and or but of to in on at for with from by is are was were be been being it its this that these those we you they he she his her their our your my not no if then so as than there here what which who whom whose when where why how all any both each few more most other some such only own same too very can will just don should now said says say into out up down over under again once about above below between during before after because until while against off further per via etc also'.split(' '));

function guessType(token) {
  const t = token.toLowerCase();
  if (/(pur|halli|palli|pete|pet|uru|kote|gudda|betta|wadi|vadi|kere|nagar)$/.test(t)) return 'place';
  if (/(rao|shetty|gowda|naik|patil|desai|pandit|sharma|devi|bai|amma|appa|kumar|singh|khan|reddy|murthy|hegde|prasad)$/.test(t)) return 'person';
  if (/^(19|20)\d{2}$/.test(t)) return 'event';
  if (/(movement|year|century|decade|era|revolution|war|act|amendment|session|launch|project|mission)$/.test(t)) return 'event';
  return 'culture';
}

export function analyzeCustomText(rawText, metaFallback) {
  const text = String(rawText || '').replace(/\r/g, '').trim();
  const sentences = text
    .split(/(?<=[.!?…])\s+|(?<=\n)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  // pack sentences into segments (≈2 sentences each, ≥40 chars)
  const chunks = [];
  let buf = '';
  sentences.forEach((s) => {
    buf = buf ? `${buf} ${s}` : s;
    if (buf.length > 90) { chunks.push(buf); buf = ''; }
  });
  if (buf) chunks.push(buf);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const duration = Math.max(20, Math.min(1800, Math.round((wordCount / 2.6) + chunks.length * 3 + 8)));
  const per = Math.max(12, Math.floor(duration / Math.max(1, chunks.length)));

  const segments = chunks.map((segText, i) => ({
    id: `cs-${i + 1}`,
    t: Math.min(duration - per + 2, 4 + i * per),
    speaker: i === 0 ? (metaFallback?.firstSpeaker || 'Custom Ingest Voice') : (i % 3 === 0 ? 'Custom Ingest Voice' : `Custom Ingest Voice (${i + 1})`),
    role: 'ingested transcript segment',
    text: segText,
  }));

  const ym = text.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  const year = ym ? Number(ym[0]) : (metaFallback?.year || '—');

  const reel = {
    id: metaFallback?.id || `custom-${Date.now().toString(36)}`,
    title: metaFallback?.title || 'Custom Ingested Reel',
    year,
    month: metaFallback?.month || '',
    kind: metaFallback?.kind || 'transcript',
    duration,
    source: metaFallback?.source || 'Local ingestion (SmritiGraph Studio)',
    place: metaFallback?.place || 'Unspecified coverage',
    languages: metaFallback?.languages || ['Auto-detected'],
    tapeLabel: metaFallback?.tapeLabel || 'LOCAL',
    ingestNote: metaFallback?.ingestNote || 'Indexed by the built-in local heuristics engine; no external service was contacted.',
    description: metaFallback?.description || text.slice(0, 180) + (text.length > 180 ? '…' : ''),
    tags: metaFallback?.tags || ['Custom', 'Community Ingest'],
    segments,
    custom: true,
  };

  const { perSegment, flat } = annotateReel(reel);
  reel.annotations = flat;
  reel.perSegment = perSegment;

  // proper nouns not in the gazetteer → new community-reviewable nodes
  const mentioned = new Set(flat.map((f) => f.refId));
  const invented = [];
  const seenTok = new Map();
  segments.forEach((seg) => {
    const toks = seg.text.replace(/["'“”‘’(){}\[\],.;:!?—–]/g, ' ').split(/\s+/);
    toks.forEach((tok, idx) => {
      if (tok.length < 4 || !/^[A-Z][a-zA-Z]+$/.test(tok)) return;
      if (STOP.has(tok.toLowerCase())) return;
      if (idx === 0) return; // sentence-start capital is unreliable
      const norm = tok.toLowerCase();
      if (mentioned.has(norm) || ALIAS_INDEX.some((a) => a.norm === norm)) return;
      seenTok.set(norm, (seenTok.get(norm) || 0) + 1);
    });
  });
  for (const [norm, count] of seenTok) {
    if (count < 2 && seenTok.size > 14) continue; // dense pages → keep recurring only
    const surface = norm.charAt(0).toUpperCase() + norm.slice(1);
    const type = guessType(norm);
    invented.push({
      id: `c-${norm.replace(/[^a-z0-9]/g, '')}`.slice(0, 42),
      label: surface, type, era: 'custom',
      aliases: [surface],
      desc: `Extracted from the ingested reel "${reel.title}" (occurs ${count}×) and classified as ${type} by local heuristics. Community review welcome!`,
      custom: true,
    });
  }
  reel.discoveredNodes = invented;
  return reel;
}

/* ------------------------------------------------------------------ *
 * Graph builder                                                       *
 * ------------------------------------------------------------------ */
export function buildGraph(reels, annotationMap) {
  const nodes = [];
  const byId = new Map();
  const addNode = (n) => { if (n && !byId.has(n.id)) { byId.set(n.id, n); nodes.push(n); } };

  DICTIONARY.forEach((e) => addNode({
    id: e.id, label: e.aliases[0], type: e.type, era: e.era, desc: e.cultural, dict: e,
  }));
  GAZETTEER.forEach((n) => addNode({ ...n }));

  const edgeMap = new Map();
  const addEdge = (a, b, w0 = 1) => {
    if (a === b || !byId.has(a) || !byId.has(b)) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const prev = edgeMap.get(key) || { a: key.split('|')[0], b: key.split('|')[1], w: 0 };
    prev.w += w0;
    edgeMap.set(key, prev);
  };
  CURATED_EDGES.forEach(([a, b]) => addEdge(a, b, 2));

  reels.forEach((reel) => {
    addNode({ id: reel.id, label: reel.title, type: 'reel', era: String(reel.year), desc: reel.description, reelRef: reel });
    const hits = (annotationMap.get(reel.id) || []).map((f) => f.refId);
    if (reel.discoveredNodes) reel.discoveredNodes.forEach((n) => {
      addNode({ ...n });
      hits.push(n.id);
    });
    hits.forEach((nid) => addEdge(reel.id, nid, 1));
  });

  // co-occurrence within a reel: entities sharing a reel get a whisper of weight
  reels.forEach((reel) => {
    const flat = annotationMap.get(reel.id) || [];
    const uniq = [...new Set(flat.map((f) => f.refId))];
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < Math.min(uniq.length, i + 8); j++) addEdge(uniq[i], uniq[j], 1);
    }
  });

  const edges = [...edgeMap.values()];
  // degree → radius
  const deg = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => { deg.set(e.a, deg.get(e.a) + 1); deg.set(e.b, deg.get(e.b) + 1); });
  nodes.forEach((n) => {
    n.degree = deg.get(n.id) || 0;
    n.r = n.type === 'reel' ? 15 : Math.min(15, 6 + n.degree * 0.55);
  });
  return { nodes, edges, byId };
}

/* ------------------------------------------------------------------ *
 * Telemetry                                                           *
 * ------------------------------------------------------------------ */
export function metrics(reels, annotationMap) {
  let annCount = 0, minutes = 0;
  reels.forEach((r) => {
    annCount += (annotationMap.get(r.id) || []).length;
    minutes += r.duration / 60;
  });
  const contextDensity = Math.round(Math.min(100, (annCount / Math.max(0.5, minutes)) * 15));
  return { annCount, minutes: Math.round(minutes), contextDensity };
}
