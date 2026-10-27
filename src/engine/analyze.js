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

function matchAliasInText(text, extraIndex = []) {
  const found = [];
  const taken = new Array(text.length).fill(false);
  const combined = extraIndex.length ? [...extraIndex, ...ALIAS_INDEX] : ALIAS_INDEX;
  for (const item of combined) {
    const re = getRegex(item.norm);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const at = m.index + (m[1] ? m[1].length : 0);
      const matchLen = m[2] ? m[2].length : item.alias.length;
      const end = at + matchLen;
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
 * Autonomous Entity Extraction & Cultural Decoding Engine             *
 * ------------------------------------------------------------------ */
const STOP = new Set('the a an and or but of to in on at for with from by is are was were be been being it its this that these those we you they he she his her their our your my not no if then so as than there here what which who whom whose when where why how all any both each few more most other some such only own same too very can will just don should now said says say into out up down over under again once about above below between during before after because until while against off further per via etc also'.split(' '));

const COMMON_SENTENCE_STARTERS = new Set([
  'the', 'and', 'then', 'now', 'so', 'there', 'here', 'what', 'when', 'where', 'why', 'how',
  'today', 'yesterday', 'tomorrow', 'ask', 'also', 'because', 'every', 'each', 'all', 'some',
  'one', 'two', 'three', 'after', 'before', 'during', 'first', 'last', 'next', 'another',
  'these', 'those', 'this', 'that', 'they', 'their', 'them', 'with', 'from', 'into', 'about',
  'over', 'under', 'above', 'below', 'between', 'again', 'once', 'just', 'such', 'only',
  'even', 'more', 'most', 'very', 'well', 'yes', 'no', 'not', 'please', 'thank', 'thanks',
  'hello', 'whisper', 'audio', 'video', 'sound', 'meanwhile', 'furthermore', 'however',
  'therefore', 'moreover', 'nonetheless', 'suddenly', 'later', 'soon', 'finally', 'certainly',
]);

function guessType(token, localContext = '') {
  const t = token.toLowerCase();
  const c = localContext.toLowerCase();
  if (/\b(president|prime minister|governor|viceroy|emperor|king|queen|prince|princess|lord|lady|sir|dr|general|colonel|major|captain|minister|secretary|ambassador)\b/.test(t)) {
    return 'person';
  }
  if (/(court|assembly|police|army|navy|air force|corps|legion|cordon|parliament|council|ministry|committee|commission|party|league|congress|government|department|radio|press|broadcasting|board|agency|bureau)$/.test(t)) {
    return 'institution';
  }
  if (/(movement|year|century|decade|era|revolution|war|act|amendment|session|launch|project|mission|day|jubilee|festival|festivities|rejoicing|celebration|anniversary|treaty|pact|march|procession|rally|speech|address|independence|republic|coronation|partition)$/.test(t)) {
    return 'event';
  }
  if (/(pur|halli|palli|pete|pet|uru|kote|gudda|betta|wadi|vadi|kere|nagar|fort|gate|park|hall|palace|house|street|road|avenue|hill|river|lake|sea|ocean|mount|port|delhi|bombay|bengal|punjab|london|mysore|madras|india|pakistan|britain|america|europe|asia|africa|lunar|moon|mars)$/.test(t) ||
      /\b(sea|ocean|lake|river|mount|mountain|island|cape|gulf|bay|harbor|port)\b/.test(t)) {
    return 'place';
  }
  if (/(rao|shetty|gowda|naik|patil|desai|pandit|sharma|devi|bai|amma|appa|kumar|singh|khan|reddy|murthy|hegde|prasad|sen|roy|bose|das|mukherjee|chatterjee|banerjee|menon|nair|iyer|iyengar|pamela|emily|nehru|patel|gandhi|mountbatten|hicks|churchill|attlee|nixon|armstrong|kennedy|roosevelt|lincoln|washington)$/.test(t)) {
    return 'person';
  }
  if (/\b(at|in|near|across|from|to|into)\s+$/.test(c)) return 'place';
  if (/\b(mr|mrs|miss|lord|lady|dr|sir|general|colonel|major|captain|pandit|sardar|swami|mahatma|president)\s*$/.test(c)) return 'person';
  if (/^\s*(said|spoke|stepped|signed|attended|declared|announced|stated|wrote)\b/.test(c)) return 'person';
  return 'culture';
}

function pickRef(hit) {
  if (hit.kind === 'entry') {
    const e = hit.entry;
    return { refKind: 'entry', refId: e.id, label: e.aliases?.[0] || e.label || hit.surface, type: e.type, entry: e };
  }
  const n = hit.node;
  return { refKind: 'entity', refId: n.id, label: n.label || hit.surface, type: n.type, node: n };
}

/**
 * Universal Annotation & Cultural Discovery Pass.
 * Works on ANY reel transcript (curated, Whisper-transcribed, or text-ingested).
 * Auto-discovers named entities and synthesizes rich 4-block Cultural Context Cards.
 */
export function annotateReelWithDiscovery(reel) {
  const segments = reel.segments || [];
  const perSegment = {};
  const flat = [];
  const discoveredMap = new Map();

  (reel.discoveredNodes || []).forEach((n) => {
    if (n && n.id) discoveredMap.set(n.id, n);
  });

  const extraIndex = [];
  for (const n of discoveredMap.values()) {
    (n.aliases || [n.label]).forEach((alias) => {
      extraIndex.push({ alias, norm: alias.toLowerCase(), kind: 'entry', id: n.id, entry: n });
    });
  }
  extraIndex.sort((a, b) => b.alias.length - a.alias.length);

  segments.forEach((seg) => {
    const text = seg.text || '';
    const hits = matchAliasInText(text, extraIndex);
    const taken = new Array(text.length).fill(false);
    hits.forEach((h) => {
      for (let i = h.start; i < h.end; i++) taken[i] = true;
    });

    // Autonomous Named Entity Recognition over unhighlighted spans
    const candRe = /\b([A-Z][a-zA-Z0-9'’]+(?:\s+(?:of|the|and|in|at|de|da)?\s*[A-Z][a-zA-Z0-9'’]+)*)\b/gu;
    let m;
    while ((m = candRe.exec(text)) !== null) {
      const surface = m[1].trim();
      const start = m.index;
      const end = start + surface.length;
      if (surface.length < 3) continue;

      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (taken[i]) { overlaps = true; break; }
      }
      if (overlaps) continue;

      const norm = surface.toLowerCase();
      if (STOP.has(norm)) continue;

      const isStartOfSentence = (start === 0 || /[.!?…]\s+$/.test(text.slice(Math.max(0, start - 4), start)));
      if (isStartOfSentence && !surface.includes(' ')) {
        if (COMMON_SENTENCE_STARTERS.has(norm) || STOP.has(norm)) continue;
      }

      let entry = null;
      const slug = `c-${norm.replace(/[^a-z0-9]+/g, '-')}`.slice(0, 42);
      if (discoveredMap.has(slug)) {
        entry = discoveredMap.get(slug);
      } else {
        const localContext = text.slice(Math.max(0, start - 25), start);
        const afterContext = text.slice(end, Math.min(text.length, end + 25));
        const type = guessType(surface, `${localContext} ${afterContext}`);
        const era = reel.year && reel.year !== '—' ? `${reel.year} era` : 'Archival record';
        const region = reel.place && reel.place !== 'Unspecified coverage' ? reel.place : 'Archival soundscape';
        entry = {
          id: slug,
          label: surface,
          aliases: [surface],
          type,
          era,
          region,
          literal: `Archival record: "${surface}" identified in the historical transcript.`,
          cultural: `Key entity preserved in the archival recording of "${reel.title}". Contextually documents the people, places, and events recorded in this historical reel.`,
          evolution: `Traced through archival documentation and historical records from the ${reel.year || 'historical'} period to modern public collections.`,
          beginner: `Key ${type} documented in this historic audio-visual recording. Listen for how the speaker refers to ${surface} at this timestamp.`,
          desc: `Extracted from the reel "${reel.title}" and classified as ${type} by local heuristics. Community review welcome!`,
          custom: true,
        };
        discoveredMap.set(slug, entry);
      }

      for (let i = start; i < end; i++) taken[i] = true;
      hits.push({
        kind: 'entry',
        id: entry.id,
        entry,
        alias: surface,
        surface,
        start,
        end,
      });
    }

    hits.sort((a, b) => a.start - b.start);
    perSegment[seg.id] = hits;
    hits.forEach((h) => {
      flat.push({
        segId: seg.id,
        t: seg.t,
        surface: h.surface,
        ...pickRef(h),
        entry: h.kind === 'entry' ? h.entry : undefined,
      });
    });
  });

  return {
    perSegment,
    flat,
    discoveredNodes: Array.from(discoveredMap.values()),
  };
}

/* ------------------------------------------------------------------ *
 * Reel → annotations                                                  *
 * ------------------------------------------------------------------ */
export function annotateReel(reel) {
  return annotateReelWithDiscovery(reel);
}

export { matchAliasInText as findRefsInText };

export function analyzeCustomText(rawText, metaFallback) {
  const text = String(rawText || '').replace(/\r/g, '').trim();
  const sentences = text
    .split(/(?<=[.!?…])\s+|(?<=\n)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
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

  const { perSegment, flat, discoveredNodes } = annotateReelWithDiscovery(reel);
  reel.annotations = flat;
  reel.perSegment = perSegment;
  reel.discoveredNodes = discoveredNodes;
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
  GAZETTEER.forEach((n) => addNode({ ...n, dict: n }));

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
      addNode({ ...n, dict: n });
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
