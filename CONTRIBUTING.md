<div align="center">

# 🤝 Contributing to SmritiGraph
**Preserve the understanding of the file, not just the file.**

</div>

---

Welcome — this repository was rebuilt in one hack day for **Hacktoberfest Hack Day 2026 (Track 2 · Audiovisual Heritage Day)**, and it is designed to be *extended by strangers*. Whether you speak Kannada, Konkani, Tulu, Kodava, Marathi — or only Git — there is a lane for you below.

## 📜 Code of conduct

Be patient with cultural claims. This archive deals in memory, and memory is contested. Confirm sources, mark uncertainty (`era: "disputed"` is a valid value), disagree kindly. Everything merged must remain **MIT (code) / CC BY 4.0 (annotation content)** — no proprietary data dumps.

## 🚪 The five contribution lanes

### Lane 1 · Add a cultural dictionary entry *(easiest — no coding)*

The heart of the project is [`src/data/dictionary.js`](src/data/dictionary.js) — a flat array:

```js
{
  id: 'ann-suvarna',              // 3-letter type prefix + slug
  term: 'Suvarna Karnataka',
  aliases: ['ಸುವರ್ಣ ಕರ್ನಾಟಕ', 'Golden Karnataka', 'Ekikarana'],
  type: 'event',                  // person | place | idiom | dialect | tradition | event | institution | technology | dish | attire
  era: '1950s',
  region: 'Mysuru & Karnataka-wide',
  literal: 'Golden Karnataka',
  cultural: 'The aspiration of a single Kannada-speaking state... membered in broadcast and song after the States Reorganisation Act.',
  evolution: 'From unification slogan (1956) to development branding (2010s).',
  beginner: 'Think “one state, one language” ceremonies every Nov 1 — Karnataka Rajyotsava.',
  reels: ['reel-1956-unification'],
}
```

> 💡 **You can do this from inside the app itself:** Open **Open Standards Hub → Crowdsourced Annotation → Generate PR payload**, fill the term form, download `data/annotations/community-<slug>.patch.json`, add its value into `dictionary.js` on a fork, and open your PR with the generated title/body. One screen, zero memorized commands.

**Rules for entries**
- The matcher is Unicode-aware for Kannada script aliases — **always include the native-script alias** when it exists.
- `cultural` should answer *why this matters to a community*, not just *what it is*.
- Cite the reel(s) the term actually appears in — the graph builds edges from this.

### Lane 2 · Regional language adapters

The matcher (`engine/analyze.js`) uses Unicode-property regexes so Kannada alias matching "just works." To certify a new language:

1. Prove alias detection on 10 real phrases (open a `docs/adapters/<lang>.md` with the test table).
2. Add any transliteration pitfalls (e.g., Kannada vowel-sign splitting, ZWJ/ZWNJ) as normalization helpers in `matchAliasInText`.
3. Add the language to `LANG_CODES` in `engine/exporter.js` (Dublin Core `dc:language` codes) *and* to the Languages pickers.

### Lane 3 · Archival connectors

SmritiGraph ingests files in-browser today (`IngestModal`: mp3/wav/mp4/txt/json/paste). Roadmap lanes:

- **IIIF input** — paste a remote Presentation 3.0 manifest URL and deconstruct it into a reel (transcript bodies → segments). Align with the exporter's exact shapes.
- **OAI-PMH harvest** — read a library endpoint, map OAI-DC → our reel schema.
- **Wikimedia Commons** — read wikitext companions back in (the reader of our own Markdown export).

Keep connectors **pure functions**: `(payload) => Reel-shaped object`. Tests stay trivial, and offline-first stays true.

### Lane 4 · Export extensions (IIIF siblings, EAD, Spectral…)

Every exporter is deterministic-pure in [`engine/exporter.js`](src/engine/exporter.js) and consumed by one screen — see `components/StandardsHub.jsx`. To add a format:

1. Pure generator `export function xFormat(reel)`.
2. A tab card in `StandardsHub.jsx` (preview + copy + download + `markExport('yourkind')`).
3. If it scores openness, wire `kind` into the ring math in store.jsx.

### Lane 5 · Motion, museum aesthetics, graph physics

- The knowledge graph is **hand-rolled Canvas**: `buildGraph` (data) + `components/Constellation.jsx` (sim + paint). Forces are honest physics — repulsion, spring edges, centering, damping — and it must remain dependency-free.
- Waveform generation for curated reels is deterministic (`makePeaks`) so judge demos replay identically. Render runs on rAF; never `setInterval` for frames.
- The palette lives in `tailwind.config.js` — the **Editorial Daylight theme** (modelled on the CenterStage reference): `#FBFBFC` dot-grid canvas with amber ambient washes, white cards with `#E7E7EA` hairlines, amber-500→600 gradient CTAs with white type, zinc-900 ink, emerald `#059669` for open/verified states, Inter body + Plus Jakarta Sans headings. Extending it? Keep contrast on the light canvas ≥ AA.

## 🧪 Ground rules (enforced, not aspirational)

1. **Zero placeholders.** Every button, tab, filter, marker and exporter must fully function out of the box. A PR that stubs a feature will be asked to finish it.
2. **Never throw at the user.** AI paths catch everything and fall back to the Local Heuristics Engine (see `store.jsx send()` for the gold-standard pattern).
3. **Offline-first.** New features must work with devtools open and network blocked. Live LLM is *rephrasing* only; heritage facts always come from local retrieval.
4. **`npm run build` must stay green.** Vite + React 18 + Tailwind 3.4; no new heavy graph/chart/animation deps without a strong argument.
5. **One intent per PR.** `feat:` `fix:` `docs:` `data:` prefixes; reference the lane ("Lane 3: IIIF ingest").

## 🔧 Setup & verification

```bash
npm install
npm run dev        # localhost:5173 — 4 reels render, 4 demo prompts answer offline
npm run build      # must complete clean
```

Manual smoke before every PR: click all four tabs, run the four judge prompts in *Local Heuristics* mode, click a citation (should seek + flash), open a Context Card, export all four artifact families, generate one annotation PR.

## 🏷️ Good first issues

Search issues tagged `good-first-issue` — annotation entries (Lane 1) and language adapters (Lane 2) are the classic on-ramps. If no issue exists for your lane, open one; link your lane doc and the PR that fulfills it.

---

<div align="center">
<em>"Every cultural term decoded here is one fewer term lost."</em><br/>
October 2026 · Karnataka heritage reel digitization, Team SmritiGraph
</div>
