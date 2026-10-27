GOAL:    A hackathon judge leans back with "this is real, finished, and it matters" — then copies the repo URL.
OUTPUT:  HyperFrames, 1920×1080, 30 fps
TIME:    126 s × 30 fps = 3780 frames · music ~92 BPM → 19.57 frames/beat; cuts land on section/onset
         cues from `audio` analysis, not the (untrustworthy calm) beat grid.

LOOK:    World 1 — the product's daylight UI: ground #FBFBFC with its own 1px dot grid, ink #18181B,
         panels #FFFFFF over #F7F7F8, edges #E7E7EA, radii 12–16px, shadow `0 1px 3px rgba(0,0,0,.03),
         0 6px 16px rgba(0,0,0,.035)`. Product stills shown off a 2× plate (3840×2160), reduced to
         1:1 crop = 2× real UI size; text floor 26px at 1080p.
         World 2 — archival film loop: ground #0A0A0B, the app's dark player field, 4% grain,
         6% vignette, a paper-white strip edge like a processed reel, titles in white 92–100%.
         Accent: gold only — #F59E0B/#D97706 on one word per title, the payoff line, the end card.
         Type: display = Plus Jakarta Sans 800 (@font-face, assets/fonts/) — titles 4–9% of frame
         height (44–97px), tracking −2%; body = Inter 400/700 (bundled); labels/numbers = JetBrains
         Mono 400/700 (bundled), 11–13px caps with +0.16em tracking. Kannada text renders in system
         Nirmala UI (captures carry it).
OBJECTS: the reel (dark waveform plate + marker rows), a term hit (colored underline from the plate),
         the Context Card (white, 16px radius, real fields), the graph node (colored circles +
         hairline links from the plate), the citation chip (mint, mono), the IIIF code block (mono on
         paper), the VALID badge, the openness ring, the brand tile (amber gradient, lucide Radio
         glyph, mint status dot), the paper-white film strip border.
MOTION:  enter expo.out 0.30–0.42 s; camera power2.inOut 0.5–0.6 s; exits 40% shorter (power3.in);
         springs damping 0.75–0.85 on position/scale only (card and chips); stagger chips 0.16 s;
         hold a read 0.5 s + 0.3 s/word, last line ≥2 s; hero words 60–90% width; one move per shot;
         moves carry blur (data-motion-blur on during the whips/iris pushes).
SHOTS:   (s → frames @30fps)
   0.0–2.0    full Studio plate push 1.02→1.05 · read: the annotated transcript · bed: faint tape bed alone
   2.0–5.5    punch crop "Satyagraha begins where your village begins" (plate 2x) · line: "what does this actually mean?" gold on "actually"
   5.5–9.6    wide pull; marker row of reel validators emphasized · hands off on the click cursor entering
   9.6–17.0   film-loop world: reel dossier crop "INGESTED · from a 78rpm lacquer disc recovered from the Tilakwadi camp kitchen ledger box" · line (README verbatim): "a heritage file says source: AIR Dharwad — and nothing else."  · near-silent, tape hiss only
   17.0–24.0  giant un-parsed words on black: "charkha?" "Bayalata?" "Suvarna Karnataka?" · line: "digitization is not the same as comprehension." (README verbatim) · low pulse
   24.0–34.0  reveal: brand tile carried in (scale in, spring), wordmark "SmritiGraph", dot pops, sub "The Living Archive · a cultural context decoder" · music opens on the reveal
   34.0–42.0  P1 decode: cursor slides, real click at 36.3 → iris from click point → Context Card builds (real crop layers) · line: "every cultural term — decoded in place" · click + soft whoosh, key ticks
   42.0–50.0  P2 connect: card's "View in Heritage Constellation" chip morphs wide → graph plate; pan TL→C, punch Belgaum cluster · line: "…woven into a living knowledge graph" · whoosh-cinematic
   50.0–59.0  P3 ask: question bubble pops, answer bubble springs in with engine chip, citation chips stagger in · line: "the archive answers — with receipts" · pop per chip (3 takes rotated)
   59.0–67.0  P4 verify: chip click → whip back → transcript segment, its existing gold underline brightens via masked overlay · line: "reel + timestamp + confidence — click to verify" · whoosh-short, click
   67.0–76.0  P5 liberate: hub plate; pans chips → IIIF block; VALID badge pops; mono toast line · line: "IIIF 3.0 · Dublin Core · Wikimedia · CSV — GLAM pipelines ingest it same-day" · key ticks, pop on badge
   76.0–82.0  P6 community: PR card crop ("grandmother in Dharwad…") + JSON Patch mention · line: "a ready-to-merge PR — no GitHub account" · soft click
   82.0–88.0  payoff 1: film loop full-bleed (media-treatment grain), manifest crop carried in right; header line: "this reel re-opens — with its decoded glossary —" · riser under
   88.0–96.0  payoff 2: split wide (reel left, real manifest block right, both plate crops) · line: "…in Mirador, Universal Viewer, or any IIIF player that will exist in 2050."
   96.0–106.0 payoff 3: camera pull to THE hero line on black: "The museum outlives us." (hero 100px, gold "outlives") · impact + hold ≥2 s
   106.0–116.0 claim (daylight): kicker "TRACK-2 THESIS"; "Heritage ends where context begins."; sub (README verbatim stem): "not just the file — the understanding of the file, in open standards anyone can use, forever."; mono row "0 API keys · 100% offline · IIIF 3.0 · Dublin Core · MIT"
   116.0–126.0 end card: black re-sweep → tile carried in (scale 1.14→1 spring + mint dot pop), wordmark wipes in, "The Living Archive", CTA mono: "github.com/smritigraph/smritigraph · MIT · fully offline", holds ≥2.5 s while music ends on a bar line with 1.5 s fade
BANNED:  dark void with floating small UI; glow/bloom/particles; purple-blue mesh gradients; glass
         cards; cream-serif-italic-look ("01/02" numbered labels INCLUDED as decoration); everything
         fading/sliding up; titles that keep moving after landing; click rings; three-card filler
         rows (real chips excluded — they are the product's); title over a dimmed screenshot in the
         reveal/claim; docked logo during the story; "Introducing/Meet" opener; "unlock, seamless,
         supercharge, game-changer, effortless, in seconds"; invented metrics (only plate's own
         telemetry: 66 context density · 48 entities · 40% openness · 88 annotations); mocking a
         named competitor; invented UI chrome (lint oddities, extra buttons) inside the real plates.
INTEGRITY: every artifact is a crop of the real captured plate; captions name its source panel when
         the place is ambiguous; no screen exists that the app cannot show; no fake interaction —
         clicks/irises animate between captured states, real labels only.
QA:      snapshot --at 0.6, 3, 8, 12, 20, 26, 31, 36.9, 39, 44, 47.5, 52.5, 56.5, 61, 66, 70, 74.5,
         79, 84, 90, 97.5, 103, 108.5, 113, 118.5, 122.5, 125.5 — every read legible at 360 px
         phone width; 36.9 iris ends on the card; no seam jump at 9.6/24/42/59/67/82/106;
         audio measured: bed −16..−14 LUFS under nothing (no VO), hits 3–6 dB over bed.
