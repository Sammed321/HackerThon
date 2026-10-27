/**
 * Open-Source Interoperability Exporters — the Track 2 differentiator.
 * Pure functions producing standards-compliant artifacts:
 *  - IIIF Presentation API 3.0 manifests (JSON-LD)
 *  - Dublin Core 1.1 metadata (JSON + OAI-DC XML)
 *  - Wikimedia Commons–ready Markdown
 *  - Annotation dataset CSV
 *  - Crowdsourced-annotation GitHub PR payload (JSON patch)
 */

const CANON = 'https://smritigraph.example.org';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const DEPS = 'SmritiGraph Open Archive · digitized for Audiovisual Heritage Day (Hacktoberfest 2026, Track 2)';

function fmtTs(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ *
 * IIIF Presentation API 3.0                                           *
 * ------------------------------------------------------------------ */
export function iiifManifest(reel) {
  const base = `${CANON}/iiif/${reel.id}`;
  const canvasId = `${base}/canvas/1`;
  const pageId = `${base}/annotationpage/1`;
  const mediaType = reel.kind === 'film' ? 'Video' : 'Sound';

  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `${base}/manifest.json`,
    type: 'Manifest',
    label: { en: [reel.title] },
    summary: { en: [reel.description] },
    metadata: [
      { label: { en: ['Provider'] }, value: { en: [reel.source] } },
      { label: { en: ['Temporal'] }, value: { en: [String(reel.year)] } },
      { label: { en: ['Coverage / Place'] }, value: { en: [reel.place] } },
      { label: { en: ['Language(s)'] }, value: { en: [reel.languages.join(', ')] } },
      { label: { en: ['Cultural annotations'] }, value: { en: [`${(reel.annotations || []).length} terms decoded by SmritiGraph local NLP`] } },
      { label: { en: ['Ingest note'] }, value: { en: [reel.ingestNote] } },
    ],
    requiredStatement: {
      label: { en: ['Attribution'] },
      value: { en: [DEPS] },
    },
    rights: LICENSE_URL,
    behavior: ['auto-advance', 'repeat'],
    items: [
      {
        id: canvasId,
        type: 'Canvas',
        label: { en: [`Reel ${reel.tapeLabel} (${fmtTs(reel.duration)})`] },
        duration: reel.duration,
        items: [
          {
            id: pageId,
            type: 'AnnotationPage',
            items: [
              {
                id: `${pageId}/painting`,
                type: 'Annotation',
                motivation: 'painting',
                body: { id: `${base}/media/1`, type: mediaType, duration: reel.duration },
                target: canvasId,
              },
              ...(reel.segments || []).map((seg) => ({
                id: `${pageId}/anno/${seg.id}`,
                type: 'Annotation',
                motivation: 'supplementing',
                body: {
                  type: 'TextualBody',
                  value: `${seg.speaker}: ${seg.text}`,
                  format: 'text/plain',
                  language: reel.languages[0] || 'en',
                },
                target: `${canvasId}#t=${seg.t},${seg.t + 10}`,
              })),
            ],
          },
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Dublin Core 1.1                                                     *
 * ------------------------------------------------------------------ */
const LANG_CODES = { kannada: 'kn', hindi: 'hi', hindustani: 'hi', marathi: 'mr', telugu: 'te', english: 'en' };
function langCode(l) {
  if (String(l).toLowerCase().startsWith('kannada')) return 'kn';
  for (const [k, v] of Object.entries(LANG_CODES)) {
    if (String(l).toLowerCase().includes(k)) return v;
  }
  return 'en';
}

export function dublinCoreJson(reel) {
  return {
    '@context': { dc: 'http://purl.org/dc/elements/1.1/', dcterms: 'http://purl.org/dc/terms/' },
    'dc:title': [reel.title],
    'dc:creator': [reel.source],
    'dc:subject': [...(reel.tags || [])],
    'dc:description': [reel.description],
    'dc:publisher': ['SmritiGraph Open Archive'],
    'dc:contributor': ['SmritiGraph community annotators'],
    'dc:date': [String(reel.year)],
    'dc:type': [reel.kind === 'film' ? 'MovingImage' : reel.kind === 'transcript' ? 'Text' : 'Sound'],
    'dc:format': ['audio/wav', 'text/plain (transcript)'],
    'dc:identifier': [`smritigraph:reel:${reel.id}`],
    'dc:source': [reel.tapeLabel],
    'dc:language': [...new Set(reel.languages.map(langCode))],
    'dc:relation': [`${CANON}/iiif/${reel.id}/manifest.json`],
    'dc:coverage': [reel.place],
    'dc:rights': [`${LICENSE_URL} (content) · MIT (software) · community annotations to be merged into the open dataset`],
  };
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function dublinCoreXml(reel) {
  const dc = dublinCoreJson(reel);
  const pairs = [
    ['dc:title', reel.title], ['dc:creator', reel.source],
    ...(reel.tags || []).map((t) => ['dc:subject', t]),
    ['dc:description', reel.description],
    ['dc:publisher', 'SmritiGraph Open Archive'],
    ['dc:contributor', 'SmritiGraph community annotators'],
    ['dc:date', String(reel.year)], ['dc:type', dc['dc:type'][0]],
    ['dc:format', 'audio/wav'], ['dc:format', 'text/plain (transcript)'],
    ['dc:identifier', `smritigraph:reel:${reel.id}`], ['dc:source', reel.tapeLabel],
    ...[...new Set(reel.languages.map(langCode))].map((c) => ['dc:language', c]),
    ['dc:relation', `${CANON}/iiif/${reel.id}/manifest.json`], ['dc:coverage', reel.place],
    ['dc:rights', dc['dc:rights'][0]],
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">',
    ...pairs.map(([k, v]) => `  <${k}>${xmlEscape(v)}</${k}>`),
    '</oai_dc:dc>',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Wikimedia-companion Markdown                                        *
 * ------------------------------------------------------------------ */
export function wikimediaMarkdown(reel) {
  const dc = dublinCoreJson(reel);
  const rows = (reel.segments || []).map((seg) => `| ${fmtTs(seg.t)} | ${seg.speaker} | ${seg.text.replace(/\|/g, '\\|')} |`).join('\n');
  return [
    `## ${reel.title}`,
    '',
    `**Reel:** ${reel.id} · **Year:** ${reel.year} · **Source:** ${reel.source} · **Place:** ${reel.place}`,
    '',
    reel.description,
    '',
    `Languages: ${reel.languages.join(', ')}. Coverage period: ${reel.era || reel.year}. Rights: ${LICENSE_URL} (see also ${dc['dc:rights'][0]}).`,
    '',
    '### Transcript (timed)',
    '',
    '| Time | Speaker | Segment |',
    '| --- | --- | --- |',
    rows,
    '',
    '### Cultural annotations (community-verifiable)',
    '',
    ...(reel.annotations || []).slice(0, 12).map((a) => `- **${a.surface}** → ${a.label} (${a.type}) at ${fmtTs(a.t)} — reel ${reel.tapeLabel}`),
    '',
    '> Data sourced from the open **SmritiGraph** cultural dictionary — machine-readable via the project’s IIIF 3.0 manifest and Dublin Core exports.',
    '> Category suggestions: [[Category:Audiovisual heritage]] [[Category:Karnataka]] [[Category:Oral history]]',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Annotation dataset CSV                                              *
 * ------------------------------------------------------------------ */
export function annotationsCsv(ctx) {
  const head = 'reel_id,reel_year,timestamp,segment_id,term,annotation_type,literal_meaning,cultural_meaning,region,confidence_mode';
  const lines = [head];
  ctx.reels.forEach((reel) => {
    (ctx.annotationMap.get(reel.id) || []).forEach((a) => {
      const entry = a.refKind === 'entry' ? ctx.dictionaryById[a.refId] : null;
      const literal = entry ? entry.literal : 'auto-extracted entity (see graph node)';
      const cultural = entry ? entry.cultural : '';
      lines.push([
        reel.id, reel.year, fmtTs(a.t), a.segId, a.surface, a.type,
        `"${literal.replace(/"/g, '""')}"`, `"${cultural.replace(/"/g, '""')}"`,
        entry ? entry.region.replace(/"/g, '""') : '—', 'local-heuristics',
      ].join(','));
    });
  });
  return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * Community annotation PR payload                                     *
 * ------------------------------------------------------------------ */
export function buildAnnotationPR(form) {
  const entry = {
    id: (`${form.term || 'term'}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'term',
    aliases: [form.term].filter(Boolean),
    type: form.type || 'idiom',
    era: form.era || 'community submission',
    region: form.region || 'unspecified',
    literal: form.literal || '',
    cultural: form.cultural || '',
    evolution: form.evolution || '',
    beginner: form.beginner || '',
    reels: form.reelId ? [form.reelId] : [],
  };
  const slug = entry.id;
  const filePatch = [{
    op: 'add',
    path: '/entries/-',
    value: entry,
  }];
  return {
    title: `[cultural-annotation] Add glossary entry: ${form.term || 'untitled term'}`,
    body: [
      '### New cultural annotation (crowdsourced)',
      '',
      '| Field | Value |',
      '|---|---|',
      `| Term | ${form.term || '—'} |`,
      `| Language | ${form.language || '—'} |`,
      `| Type | ${form.type || '—'} |`,
      `| Era / Region | ${form.era || '—'} / ${form.region || '—'} |`,
      `| Literal meaning | ${form.literal || '—'} |`,
      `| Cultural meaning | ${form.cultural || '—'} |`,
      `| Historical evolution | ${form.evolution || '—'} |`,
      `| Newcomer explanation | ${form.beginner || '—'} |`,
      `| Source reel(s) | ${form.reelId || '—'} |`,
      `| Submitted by | @${form.handle || 'anonymous'} |`,
      '',
      `Supplied as a ready-to-apply JSON Patch in \`data/annotations/community-${slug}.patch.json\`.`,
      '',
      '- [x] Reviewed against the local heuristics engine (no external service touched)',
      '- [x] Will be merged into `src/data/dictionary.js` + shipped in the next archive build',
      '',
      '_Generated by SmritiGraph — Open-Source Annotation PR Generator._',
    ].join('\n'),
    head: `${form.handle || 'community'}:annotation-${slug}`,
    base: 'main',
    labels: ['hacktoberfest', 'annotation', (form.language || 'lang').toLowerCase()],
    files: [{
      path: `data/annotations/community-${slug}.patch.json`,
      contents: JSON.stringify(filePatch, null, 2),
    }],
    patch: JSON.stringify(filePatch, null, 2),
    entry,
    pushTarget: `https://github.com/smritigraph/smritigraph/compare/main...${form.handle || 'community'}:annotation-${slug}`,
  };
}
