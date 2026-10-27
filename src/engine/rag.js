/**
 * Grounded RAG Engine — deterministic, fully offline ("Local Heuristics").
 * Pipeline: intent detection → gazetteer-aware retrieval (IDF-weighted) →
 * grounded synthesis with timestamped citations + confidence.
 * Live LLMs only *rephrase* the same grounded context (see llm.js); the
 * retrieval, citations and fallback always come from here — so the demo
 * cannot fail even with zero connectivity or no API key.
 */
import { DICTIONARY, ENTRIES_BY_ID } from '../data/dictionary.js';
import { GAZETTEER } from '../data/graph.js';
import { findRefsInText } from './analyze.js';

export const DEMO_PROMPTS = [
  'How did geographical names in North Karnataka change between the 1924 and 1956 broadcasts?',
  'Explain the cultural meaning of the folk idioms in this clip for a high school student',
  'Find all connections between Belagavi and the national movement in the archive',
  'Trace how community broadcasting evolved from All India Radio to the SITE experiment',
];

const STOP = new Set('the a an and or but of to in on at for with from by is are was were be been am it its this that these those of earn as than there here what which who whom whose when where how why all any both each few more most other some such only own same too very can will just should now do did does not no between showing show me about into from'.split(' '));

function tokenize(q) {
  return String(q || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((t) => t && !STOP.has(t) && t.length > 1);
}

/* ------------------------------------------------------------------ *
 * Retrieval                                                           *
 * ------------------------------------------------------------------ */
export function buildCorpus(ctx) {
  const corpus = [];
  ctx.reels.forEach((reel) => {
    reel.segments.forEach((seg) => {
      corpus.push({
        reelId: reel.id, reelTitle: reel.title, year: reel.year, segId: seg.id,
        t: seg.t, speaker: seg.speaker, text: seg.text,
        reel: reel,
      });
    });
  });
  // IDF over segment documents
  const df = new Map();
  corpus.forEach((doc) => {
    tokenize(doc.text).forEach((tok, i, arr) => {
      if (i === arr.indexOf(tok)) df.set(tok, (df.get(tok) || 0) + 1);
    });
  });
  corpus.idf = (tok) => Math.log(1 + corpus.length / (1 + (df.get(tok) || 0)));
  return corpus;
}

export function retrieve(query, ctx, corpus) {
  const scope = ctx.scope === 'reel' ? [ctx.activeReelId] : null;
  const qTokens = tokenize(query);
  const qLower = query.toLowerCase();
  const pool = corpus.filter((doc) => !scope || doc.reelId === ctx.activeReelId);
  const scored = pool.map((doc) => {
    const docTokens = tokenize(doc.text);
    const docSet = new Set(docTokens);
    let score = 0;
    qTokens.forEach((tok) => {
      if (docSet.has(tok)) score += 2 * corpus.idf(tok);
      else if (tok.length > 3 && docTokens.some((d) => d.startsWith(tok.slice(0, 4)))) score += 0.7 * corpus.idf(tok);
    });
    if (qLower && doc.text.toLowerCase().includes(qLower.trim())) score += 4;
    if (ctx.scope === 'archive' && doc.reelId === ctx.activeReelId) score += 0.8;
    return { doc, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 6);
  const max = top[0]?.score || 1;
  return top.map(({ doc, score }) => ({
    ...doc,
    score,
    confidence: Math.max(0.52, Math.min(0.96, 0.52 + 0.44 * (score / max))),
  }));
}

/* ------------------------------------------------------------------ *
 * Graph helpers                                                       *
 * ------------------------------------------------------------------ */
function adjacency(graph) {
  const adj = new Map();
  graph.edges.forEach((e) => {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push({ to: e.b, w: e.w });
    adj.get(e.b).push({ to: e.a, w: e.w });
  });
  return adj;
}

function bfsPath(graph, from, to) {
  const adj = adjacency(graph);
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    (adj.get(cur) || []).forEach(({ to: nxt }) => {
      if (!prev.has(nxt)) { prev.set(nxt, cur); queue.push(nxt); }
    });
  }
  if (!prev.has(to)) return null;
  const path = [];
  let cur = to;
  while (cur) { path.unshift(cur); cur = prev.get(cur); }
  return path;
}

export function entityNeighbors(graph, id) {
  const adj = adjacency(graph);
  return (adj.get(id) || []).sort((a, b) => b.w - a.w).map((n) => n.to);
}

/* ------------------------------------------------------------------ *
 * Intent detection & answer composition                               *
 * ------------------------------------------------------------------ */
function refsInQuery(query) {
  return findRefsInText(query).map((h) => ({
    refKind: h.kind, refId: h.id, label: h.kind === 'entry' ? h.entry.aliases[0] : h.node.label,
    type: h.kind === 'entry' ? h.entry.type : h.node.type,
  }));
}

function typeLabel(t) {
  return ({
    person: 'historical figure', place: 'location', idiom: 'idiom', dialect: 'dialect term',
    tradition: 'cultural tradition', institution: 'institution', tech: 'technology', event: 'historical event',
  })[t] || t;
}

function nodeLabel(graph, id) {
  return graph.byId.get(id)?.label || id;
}

function cite(doc, confidence) {
  return {
    reelId: doc.reelId, reelTitle: doc.reelTitle, year: doc.year, segId: doc.segId, t: doc.t,
    quote: doc.text, speaker: doc.speaker, confidence,
  };
}

function pickCitations(retrieved, n = 3) {
  const out = [];
  const seen = new Set();
  retrieved.forEach((r) => {
    if (out.length >= n) return;
    if (seen.has(r.segId)) return;
    seen.add(r.segId);
    out.push(cite(r, r.confidence));
  });
  return out;
}

function fmtTime(t) {
  const m = Math.floor(t / 60); const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ragAnswer(query, ctx) {
  const { graph, activeReel } = ctx;
  const corpus = ctx.corpus || buildCorpus(ctx);
  const qLower = String(query || '').toLowerCase();
  const qRefs = refsInQuery(query);
  const retrieved = retrieve(query, ctx, corpus);

  const wantsGloss = /(explain|meaning|mean|what does|what is|definition|gloss|decodes?|break ?down)/.test(qLower);
  const wantsEvolution = /(chang|evolv|renam|became|becomes|between|shift|transform|histor(y|ical)|trace|progress|decade)/.test(qLower);
  const wantsConnect = /(connect|relation|related|between|link|path|network|ties|joins?|across|hidden)/.test(qLower);
  const wantsList = /(list|find all|all (mentions|references|clips|reels|occurrences|appearances)|every occurrence|everywhere|enumerate|collect)/.test(qLower);
  const wantsSummary = /(summar|overview|about this reel|about the clip|what is this|tell me about the (reel|clip|archive)|introduce)/.test(qLower);
  const beginner = /(high school|student|beginner|simply|simple|child|kid)/.test(qLower);

  // 1) Gloss a specific cultural term
  const entryRef = qRefs.find((r) => r.refKind === 'entry');
  if (entryRef && (wantsGloss || qLower.split(/\s+/).length <= 4 || beginningQueryEntry(qLower, entryRef.refId))) {
    return answerGloss(ENTRIES_BY_ID[entryRef.refId], ctx, corpus, retrieved, beginner);
  }

  // 2) Evolution / change questions (place renames, movement arcs, technologies)
  if (wantsEvolution) {
    return answerEvolution(query, qRefs, ctx, corpus, retrieved, beginner);
  }

  // 3) Connections / path questions
  if (wantsConnect && qRefs.length >= 1) {
    return answerConnections(query, qRefs, ctx, graph, corpus, retrieved, beginner);
  }

  // 4) Enumeration questions
  if (wantsList && qRefs.length >= 1) {
    return answerListAll(qRefs[0], ctx, corpus, graph);
  }

  // 5) Summary / overview
  if (wantsSummary) {
    return answerOverview(ctx, corpus, beginner);
  }

  // 6) Grounded default
  return answerGrounded(query, ctx, retrieved, graph, corpus, beginner);
}

function beginningQueryEntry(qLower, entryId) {
  const entry = ENTRIES_BY_ID[entryId];
  if (!entry) return false;
  const aliasHit = entry.aliases.find((a) => qLower.includes(a.toLowerCase()));
  return Boolean(aliasHit);
}

function answerGloss(entry, ctx, corpus, retrieved, beginner) {
  const lines = [];
  lines.push(`**${entry.aliases[0]}** — a ${typeLabel(entry.type)} from ${entry.era.replace(/_/g, ' ')} (${entry.region}).`);
  lines.push('');
  lines.push(`▸ **Literal reading:** ${entry.literal}`);
  lines.push(`▸ **Cultural meaning:** ${entry.cultural}`);
  lines.push(`▸ **Historical evolution:** ${entry.evolution}`);
  if (beginner) {
    lines.push('');
    lines.push(`**For a beginner:** ${entry.beginner}`);
  }
  // cite literal occurrences in the archive
  const docHits = corpus.filter((doc) => (ctx.annotationMap.get(doc.reelId) || []).some(
    (a) => a.segId === doc.segId && a.refId === entry.id
  )).slice(0, 3);
  const firstReelWithTerm = entry.reels && entry.reels.length ? entry.reels[0] : ctx.activeReelId;
  const fallbackDocs = corpus.filter((doc) => doc.reelId === firstReelWithTerm).slice(0, 2);
  const cits = (docHits.length ? docHits : fallbackDocs).slice(0, 3).map((doc) => cite(doc, entry ? 0.94 : 0.8));
  lines.push('');
  lines.push(`You can hear *${entry.aliases[0]}* in ${cits.length} timestamped passage${cits.length === 1 ? '' : 's'} — click a badge below to jump straight there.`);
  return {
    text: lines.join('\n'),
    citations: cits,
    confidence: 0.96,
    engine: 'local',
    followups: [
      `Where does ${entry.aliases[0]} appear across the archive?`,
      `How is ${entry.aliases[0]} connected to ${(ctx.graph.byId.get(entry.id) || {}).label || 'the wider graph'}?`,
      beginner ? 'Now explain it to a domain researcher instead' : 'Explain this for a high school student',
    ],
  };
}

function answerEvolution(query, qRefs, ctx, corpus, retrieved, beginner) {
  // gather referenced entries across query (any type) + place entries by name hints
  const refIds = qRefs.map((r) => r.refId);
  const qLower = query.toLowerCase();
  DICTIONARY.forEach((entry) => {
    if (refIds.includes(entry.id)) return;
    const hit = entry.aliases.find((a) => qLower.includes(a.toLowerCase()));
    if (hit) refIds.push(entry.id);
  });
  GAZETTEER.forEach((n) => {
    if (refIds.includes(n.id)) return;
    const hit = n.aliases.find((a) => qLower.includes(a.toLowerCase()));
    if (hit) refIds.push(n.id);
  });

  const focus = [...new Set(refIds.length ? refIds : ['ev-ekikarana', 'g-reorg1956', 'plc-belgaum', 'plc-mysore-state'])];
  const lines = [];
  const headerScope = ctx.scope === 'reel'
    ? `the reel **${ctx.activeReel.title}**`
    : 'the **whole archive**';
  lines.push(`Reading the ${headerScope}, here is how the names and meanings shifted across the decades:`);
  lines.push('');
  let rows = 0;
  focus.forEach((id) => {
    const dictEntry = ENTRIES_BY_ID[id];
    const gnode = ctx.graph.byId.get(id);
    if (dictEntry) {
      rows += 1;
      lines.push(`• **${dictEntry.aliases[0]}** → ${dictEntry.evolution}`);
    } else if (gnode) {
      rows += 1;
      lines.push(`• **${gnode.label}** — ${gnode.desc || gnode.era}`);
    }
  });
  if (beginner) {
    lines.push('');
    lines.push('**One-line version for school:** borders and spellings changed around our grandparents — the listeners, the songs and the food stayed the same.');
  }
  if (!rows) {
    lines.push('• (No explicit rename candidates matched — try asking about *Belgaum*, *Mysore*, *Hyderabad-Karnatak*, *Dharwar* or *Kodagu*.)');
  }
  const cits = pickCitations(retrieved, 4);
  lines.push('');
  lines.push(`Grounded on the ${cits.length} passages below — these are the speakers\' own announcements, verbatim on tape. Click a badge to hear the moment.`);
  return {
    text: lines.join('\n'),
    citations: cits,
    confidence: 0.9,
    engine: 'local',
    followups: [
      'Find all connections between Belagavi and the national movement in the archive',
      'What did Hyderabad-Karnatak mean by "coming home"?',
      'Play the unification day broadcast moments',
    ],
  };
}

function answerConnections(query, qRefs, ctx, graph, corpus, retrieved, beginner) {
  const ids = qRefs.map((r) => r.refId).filter((id) => graph.byId.has(id));
  const lines = [];
  let path = null;
  if (ids.length >= 2) {
    path = bfsPath(graph, ids[0], ids[1]);
  }
  const aLabel = nodeLabel(graph, ids[0] || '');
  const bLabel = ids[1] ? nodeLabel(graph, ids[1]) : 'the national movement (1924 constellation)';
  if (path && path.length > 1) {
    lines.push(`A grounded link-chain between **${aLabel}** and **${bLabel}** — each arrow is a real edge in the Heritage Constellation:`);
    lines.push('');
    lines.push('  ' + path.map((id) => `**${nodeLabel(graph, id)}**`).join(' ⟶ '));
    lines.push('');
    lines.push(`That is **${path.length - 1} hop${path.length - 1 === 1 ? '' : 's'}** of cultural memory — name by name, tape by tape.`);
  } else if (ids.length >= 1) {
    const nb = entityNeighbors(graph, ids[0]).slice(0, 8);
    lines.push(`Showing the immediate constellation of **${aLabel}**: its strongest neighbours in the graph.`);
    lines.push('');
    nb.forEach((id) => lines.push(`• ${nodeLabel(graph, id)}`));
    if (!nb.length) lines.push('• (This node stands mostly alone — a dispersal signal worth a historian\'s look!)');
  } else {
    lines.push('I could not bind your question to a named node yet — mention a person, place or tradition (e.g. *Belagavi*, *Khadi*, *Kuvempu*, *SITE*) and I will trace the edges.');
  }
  // cross-archive reel join
  const reelSets = ctx.reels.map((reel) => {
    const hits = new Set((ctx.annotationMap.get(reel.id) || []).map((a) => a.refId));
    return { reel, hits };
  });
  if (ids.length >= 2) {
    const both = reelSets.filter((s) => ids.every((id) => s.hits.has(id)));
    if (both.length) {
      lines.push('');
      lines.push(`**Reels that mention both names:** ${both.map((s) => `*${s.reel.title}* (${s.reel.year})`).join(' · ')}`);
    }
  }
  const cits = pickCitations(retrieved, 4);
  lines.push('');
  lines.push(`Grounded on the ${cits.length} passages below${beginner ? ' — in a school sentence: people who spun cloth together ended up renaming a whole State together.' : ''}.`);
  return {
    text: lines.join('\n'),
    citations: cits,
    confidence: path ? 0.93 : 0.8,
    engine: 'local',
    followups: [
      `How does ${aLabel} reach the 1984 broadcast reel?`,
      'Open the Heritage Constellation view',
      'List every mention of Khadi in the archive',
    ],
  };
}

function answerListAll(ref, ctx, corpus, graph) {
  const id = ref.refId;
  const docs = corpus.filter((doc) => (ctx.annotationMap.get(doc.reelId) || []).some(
    (a) => a.segId === doc.segId && a.refId === id
  ));
  const scopeDocs = docs.length ? docs : retrieve(nodeLabel(graph, id), ctx, corpus);
  const label = nodeLabel(graph, id);
  const byReel = new Map();
  scopeDocs.forEach((doc) => {
    if (!byReel.has(doc.reelId)) byReel.set(doc.reelId, []);
    byReel.get(doc.reelId).push(doc);
  });
  const lines = [];
  lines.push(`**Every mention of ${label}** in ${ctx.scope === 'reel' ? 'the active reel' : 'the whole archive'} — ${scopeDocs.length} timestamped hit${scopeDocs.length === 1 ? '' : 's'}:`);
  lines.push('');
  [...byReel.entries()].slice(0, 5).forEach(([reelId, list]) => {
    const reel = ctx.reels.find((r) => r.id === reelId);
    lines.push(`*${reel.title} (${reel.year})*:`);
    list.slice(0, 4).forEach((doc) => {
      const snip = doc.text.length > 130 ? `${doc.text.slice(0, 130)}…` : doc.text;
      lines.push(`   — ${fmtTime(doc.t)} | ${snip}`);
    });
    if (list.length > 4) lines.push(`   — …and ${list.length - 4} more`);
  });
  const cits = scopeDocs.slice(0, 4).map((doc, i) => cite(doc, Math.max(0.6, 0.94 - i * 0.06)));
  return {
    text: lines.join('\n'),
    citations: cits,
    confidence: 0.92,
    engine: 'local',
    followups: [
      `Explain ${label} for a high school student`,
      `How is ${label} connected to the media history nodes?`,
      'Switch scope to the whole archive',
    ],
  };
}

function answerOverview(ctx, corpus, beginner) {
  const rel = ctx.scope === 'reel' ? [ctx.activeReel] : ctx.reels;
  const lines = [];
  if (ctx.scope === 'reel') {
    const r = ctx.activeReel;
    const anns = (ctx.annotationMap.get(r.id) || []).length;
    lines.push(`**${r.title}** (${r.year} · ${r.kind})`);
    lines.push(`▸ Source: ${r.source}`);
    lines.push(`▸ Coverage: ${r.place} · Languages: ${r.languages.join(', ')}`);
    lines.push(`▸ ${r.description}`);
    lines.push(`▸ ${anns} cultural annotations are auto-decoded in this reel — yellow marks on the progress bar take you to each one.`);
    if (beginner) lines.push(`▸ **Beginner hook:** ${r.tags.join(' · ')}`);
  } else {
    lines.push('**The SmritiGraph archive holds four digitized heritage reels:**');
    rel.forEach((r) => {
      lines.push(`• *${r.title}* (${r.year}) — ${r.description.slice(0, 110)}…`);
    });
    lines.push('');
    lines.push('Ask me about names, idioms, or connections — for example *"How did geographical names change between 1924 and 1956?"*');
  }
  const cits = pickCitations(retrieve('key announcements unification congress SITE folk water', ctx, corpus), 3);
  return { text: lines.join('\n'), citations: cits, confidence: 0.95, engine: 'local', followups: [...DEMO_PROMPTS.slice(0, 2)] };
}

function answerGrounded(query, ctx, retrieved, graph, corpus, beginner) {
  const cits = pickCitations(retrieved, 4);
  const lines = [];
  const scopeName = ctx.scope === 'reel' ? `**${ctx.activeReel.title}**` : 'all four reels';
  lines.push(`Here is what the archive itself says (grounded on ${cits.length} passage${cits.length === 1 ? '' : 's'} in ${scopeName}):`);
  lines.push('');
  cits.slice(0, 3).forEach((c) => {
    const snip = c.quote.length > 200 ? `${c.quote.slice(0, 200)}…` : c.quote;
    lines.push(`> ${snip} — *${c.speaker}, ${c.reelTitle} @ ${fmtTime(c.t)}*`);
  });
  const entities = [...new Set(retrieved.slice(0, 3).flatMap(
    (r) => (ctx.annotationMap.get(r.reelId) || []).filter((a) => a.segId === r.segId).map((a) => a.refId)
  ))].slice(0, 5);
  if (entities.length) {
    lines.push('');
    lines.push(`Nodes now speaking: ${entities.map((id) => `**${nodeLabel(graph, id)}**`).join(' · ')}`);
  }
  if (beginner) lines.push('In plain words: the tapes agree with each other — and the badges below let you verify every claim in one click.');
  return {
    text: lines.join('\n'),
    citations: cits,
    confidence: Math.max(0.6, (retrieved[0]?.confidence || 0.6) - 0.05),
    engine: 'local',
    followups: DEMO_PROMPTS.slice(0, 3),
  };
}

/** Build the grounded prompt handed to a live LLM (retrieval stays local). */
export function prepareGroundedPrompt(query, ctx) {
  const corpus = ctx.corpus || buildCorpus(ctx);
  const retrieved = retrieve(query, ctx, corpus);
  const contextBlocks = retrieved.map((r, i) => (
    `[${i + 1}] reel="${r.reelTitle}" year=${r.year} t=${fmtTime(r.t)} speaker="${r.speaker}" seg=${r.segId}\n"${r.text}"`
  )).join('\n\n');
  const scopeNote = ctx.scope === 'reel' ? `Active reel: ${ctx.activeReel.title} (${ctx.activeReel.year}).` : 'Scope: the whole 4-reel archive.';
  const system = [
    'You are SmritiGraph\'s "Talk to the Archive" assistant for a public history archive of digitized Indian audiovisual heritage.',
    'Answer strictly using ONLY the numbered transcript passages provided. Cite passages inline like [1], [2].',
    'Explain archaic dialect, idioms and renamed places in beginner-friendly language. Never invent facts not present in the passages.',
    'Keep answers under 180 words unless asked for depth. Use short paragraphs or bullet lines.',
  ].join(' ');
  const user = `${scopeNote}\n\nPassages:\n${contextBlocks}\n\nQuestion: ${query}`;
  return { system, user, retrieved, confidence: Math.max(0.52, retrieved[0]?.confidence || 0.6) };
}
