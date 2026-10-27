# REVIEW — SmritiGraph demo film (fast cut)

## What was built
A 48.5 s, 16:9, 30 fps demo film cut from the app's own captured screens (1920×1080 viewport,
2× plates) — six scenes: hook (annotated 1924 transcript) → tension ("source: AIR Dharwad — and
nothing else") → reveal (SmritiGraph · The Living Archive) → four proof beats (decode / connect /
ask / liberate) → payoff (IIIF manifest · "The museum outlives us.") → claim + end card
(github.com/smritigraph/smritigraph).

Storylines considered (STORYLINES.md): the built one is "The reel decodes itself" (recommended).
Not built: "One question to the archive" (one continuous cursor take) and "three tapes, one thread"
(decade match cuts).

## Creative calls
- Daylight app palette as world 1, the app's own dark player field as the tension/payoff world, gold
  rationed to one phrase per scene.
- Plus Jakarta Sans (the app's own brand face) embedded for titles; Inter/JetBrains Mono for
  body/mono labels.
- No voiceover (no request, no source script); SFX-only sound pass (whoosh/pop/riser/impact) on the
  world changes and beats.

## Measured vs looked at
- `hyperframes check`: ok=True · 0 lint errors · 11 warnings (short read-times / dead-stretch hints,
  kept on purpose for pace in a silent fast cut).
- Frames: captured states verified against the running app at localhost:5173 (puppeteer script
  `scripts/capture-app.mjs`); plates are 2× and text stays ≥26 px at 1080p in every crop.
- Sound: SFX placed at cue times; **not mixed, not heard** — no music bed (MusicGen deps failed to
  install on this network; see "Missing").

## Weakest shot / next pass
- The graph beat's punch-in is the least legible at phone width; next pass would add a dwell and a
  real node-click (context card of a graph node) instead of a pure camera push.
- Dead-stretch hints at 28.5–33.5 and 38–43: add a second micro-move (citation chip pop / manifest
  scroll) to remove them.

## Missing (fast run)
- **Music bed**: `audio_request.json` is ready; once `pip install transformers torch soundfile numpy`
  succeeds, run `node <media-use>/audio/scripts/audio.mjs --request ./audio_request.json --out
  ./audio_meta.json --only bgm` and add `<audio src="assets/bgm/track.mp3">` at `data-start="0"` with
  `data-volume="0.14"` + fades. The film is cut so cuts do not depend on the grid.
- Full 126 s cut with iris-cursor decode beat, whip transitions, community-PR beat and the complete
  payoff triptych remains in SPEC.md (shots table) if a longer version is wanted.
