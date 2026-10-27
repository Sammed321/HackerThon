from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

GOLD = RGBColor(0xD9, 0x77, 0x06); AMBER = RGBColor(0xF5, 0x9E, 0x0B)
MINT = RGBColor(0x05, 0x96, 0x69); AQUA = RGBColor(0x08, 0x91, 0xB2)
CORAL = RGBColor(0xE1, 0x1D, 0x48); IRIS = RGBColor(0x7C, 0x3A, 0xED)
WHITE = RGBColor(0xFA, 0xFA, 0xFA); GRAY = RGBColor(0x9C, 0x9C, 0xA4)
CARD = RGBColor(0x1B, 0x1B, 0x1F); GROUND = RGBColor(0x10, 0x10, 0x12)
EDGE = RGBColor(0x2A, 0x2A, 0x2E)

prs = Presentation()
prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]
SCREENS = r"D:\HackerThon\deliverables\promo-video\assets\screens"

def rect(s, x, y, w, h, fill=None, line=None, lw=1.25, radius=None):
    shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, x, y, w, h)
    if radius is not None:
        shp.adjustments[0] = radius
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line; shp.line.width = Pt(lw)
    return shp

def text(s, x, y, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, sp_after=6, line_spacing=1.05):
    tb = s.shapes.add_textbox(x, y, w, h); tf = tb.text_frame
    tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, r in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.space_after = Pt(sp_after); p.line_spacing = line_spacing
        run = p.add_run(); run.text = r.get("t", "")
        f = run.font; f.size = Pt(r.get("sz", 18)); f.bold = r.get("b", False)
        f.color.rgb = r.get("c", WHITE); f.name = r.get("f", "Segoe UI")
        if r.get("i"): f.italic = True
    return tb

def chrome(s, kicker, num):
    rect(s, 0, 0, SW, SH, fill=GROUND)
    rect(s, Inches(0.55), Inches(0.42), Inches(0.14), Inches(0.14), fill=AMBER)
    text(s, Inches(0.8), Inches(0.32), Inches(9), Inches(0.4),
         [{"t": kicker.upper(), "sz": 11.5, "b": True, "c": GRAY, "f": "Consolas"}])
    text(s, SW - Inches(1.4), SH - Inches(0.5), Inches(0.9), Inches(0.3),
         [{"t": f"{num:02d} / 10", "sz": 10.5, "c": RGBColor(0x55, 0x55, 0x5B), "f": "Consolas"}], align=PP_ALIGN.RIGHT)

def hero(s, runs, y=Inches(1.0), sz=40):
    text(s, Inches(0.8), y, SW - Inches(1.6), Inches(1.5),
         [{"t": r.get("t", ""), "sz": r.get("sz", sz), "b": True, "c": r.get("c", WHITE), "f": "Segoe UI Semibold"} for r in runs])

def pic_fit(s, path, x, y, w):
    return s.shapes.add_picture(path, x, y, width=w)

# ---------- 1 TITLE ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Hacktoberfest Hack Day 2026 · Track 2 · Audiovisual Heritage Day", 1)
text(s, Inches(0.8), Inches(1.9), Inches(11.7), Inches(2.2), [
    {"t": "Smriti", "sz": 78, "b": True, "c": WHITE, "f": "Segoe UI Semibold"},
    {"t": "Graph", "sz": 78, "b": True, "c": AMBER, "f": "Segoe UI Semibold"},
    {"t": "  —  The Living Archive", "sz": 34, "b": False, "c": GRAY, "f": "Segoe UI Light"},
])
text(s, Inches(0.85), Inches(3.6), Inches(11.4), Inches(1.2), [
    {"t": "A cultural context decoder, knowledge graph & grounded RAG engine —", "sz": 21, "c": RGBColor(0xE4, 0xE4, 0xE7), "f": "Segoe UI"},
    {"t": "built for Karnataka's endangered audiovisual heritage.", "sz": 21, "c": RGBColor(0xE4, 0xE4, 0xE7), "f": "Segoe UI"},
])
badges = [("React 18 · Vite · Tailwind", MINT), ("MIT", AQUA), ("Zero API keys", AMBER), ("Works 100% offline", IRIS)]
bx = Inches(0.85)
for label, col in badges:
    w = Inches(0.14 * len(label) + 0.5)
    b = rect(s, bx, Inches(5.15), w, Inches(0.5), fill=CARD, line=col, radius=0.5)
    text(s, bx, Inches(5.2), w, Inches(0.4), [{"t": label, "sz": 12.5, "b": True, "c": col}], align=PP_ALIGN.CENTER)
    bx += w + Inches(0.2)
text(s, Inches(0.85), Inches(6.4), Inches(11.5), Inches(0.5),
     [{"t": "github.com/smritigraph/smritigraph  ·  npm install && npm run dev  →  http://localhost:5173", "sz": 14, "c": GRAY, "f": "Consolas"}])

# ---------- 2 PROBLEM ----------
s = prs.slides.add_slide(BLANK); chrome(s, "The problem", 2)
hero(s, [{"t": "Digitization is not the same as comprehension."}])
rect(s, Inches(0.8), Inches(2.15), Inches(11.7), Inches(1.35), fill=CARD, line=GOLD, radius=0.08)
text(s, Inches(1.05), Inches(2.32), Inches(11.2), Inches(1.1), [
    {"t": "“Where a heritage file says  source: AIR Dharwad  and nothing else, a researcher is stuck.”", "sz": 19, "i": True, "c": RGBColor(0xF4, 0xF4, 0xF5), "f": "Segoe UI"},
])
text(s, Inches(0.85), Inches(3.95), Inches(11.6), Inches(2.9), [
    {"t": "Karnataka's tape archives — Akashvani discs, Doordarshan U-matics, Janapada field cassettes —", "sz": 18.5, "c": GRAY},
    {"t": "are digitizing fast. But a 1924 transcript is full of terms a modern listener can't parse:", "sz": 18.5, "c": GRAY, "sp_after": 14},
    {"t": "Suvarna Karnataka?   Bayalata?   Charkha?   Swaraj?   Satellite Instructional Television?", "sz": 20, "b": True, "c": AMBER, "sp_after": 14},
    {"t": "Digitization preserves the file. It does not preserve the *understanding of the file*.", "sz": 18.5, "c": WHITE},
])

# ---------- 3 WHAT IT DOES ----------
s = prs.slides.add_slide(BLANK); chrome(s, "What it does", 3)
hero(s, [{"t": "Decode  ·  Connect  ·  Liberate", "sz": 44}])
cols = [
    ("DECODE", GOLD, ["Every cultural term gets a", "Context Card: literal meaning,", "cultural meaning, era, region", "and 100 years of evolution —", "in place, inside the transcript."]),
    ("CONNECT", AQUA, ["Each term is woven into an", "interactive Heritage Constellation:", "people ↔ places ↔ traditions ↔", "institutions ↔ reels, built by", "hand with canvas physics."]),
    ("LIBERATE", MINT, ["Reel + decoded annotations are", "emitted as IIIF 3.0 JSON-LD,", "Dublin Core, Wikimedia Markdown,", "bulk CSV and a ready-to-merge", "GitHub PR — no Git needed."]),
]
cx = Inches(0.8); cw = Inches(3.75)
for title, col, lines in cols:
    rect(s, cx, Inches(2.3), cw, Inches(4.3), fill=CARD, line=EDGE, radius=0.06)
    rect(s, cx, Inches(2.3), cw, Inches(0.12), fill=col)
    text(s, cx + Inches(0.28), Inches(2.6), cw - Inches(0.5), Inches(0.5),
         [{"t": title, "sz": 15, "b": True, "c": col, "f": "Consolas"}])
    text(s, cx + Inches(0.28), Inches(3.25), cw - Inches(0.5), Inches(3.0),
         [{"t": l, "sz": 15.5, "c": RGBColor(0xD4, 0xD4, 0xD8), "sp_after": 2} for l in lines])
    cx += cw + Inches(0.22)

# ---------- 4 STUDIO ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Room 1 · Media Studio & Decoder", 4)
hero(s, [{"t": "The reel decodes itself, in place."}], sz=30)
pic_fit(s, os.path.join(SCREENS, "studio-default.png"), Inches(0.8), Inches(1.85), Inches(11.7))
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.6),
     [{"t": "Archival screen with film-grain & restoration toggle · generated waveform · timestamped transcript · click a highlighted term → Context Card.", "sz": 13, "c": GRAY, "f": "Segoe UI"}])

# ---------- 5 GRAPH ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Room 2 · Heritage Constellation", 5)
hero(s, [{"t": "One reel → a living knowledge graph.", "sz": 30}])
pic_fit(s, os.path.join(SCREENS, "graph.png"), Inches(0.8), Inches(1.85), Inches(11.7))
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.6),
     [{"t": "48 nodes · 267 links · force-directed canvas physics, no graph libraries. Click a node → inspector, neighbours, reels, full gloss.", "sz": 13, "c": GRAY, "f": "Segoe UI"}])

# ---------- 6 ASSISTANT ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Room 3 · Talk to the Archive", 6)
hero(s, [{"t": "The archive answers — with receipts.", "sz": 30}])
pic_fit(s, os.path.join(SCREENS, "assistant-answer.png"), Inches(0.8), Inches(1.85), Inches(11.7))
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.6),
     [{"t": "Grounded RAG chat. Every answer carries reel + timestamp + confidence citations — click one to jump to the exact moment. Works fully offline; live LLM optional.", "sz": 13, "c": GRAY, "f": "Segoe UI"}])

# ---------- 7 STANDARDS ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Room 4 · Open Standards Hub", 7)
hero(s, [{"t": "GLAM pipelines ingest it — same day.", "sz": 30}])
pic_fit(s, os.path.join(SCREENS, "standards.png"), Inches(0.8), Inches(1.85), Inches(11.7))
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.6),
     [{"t": "IIIF Presentation 3.0 manifest · Dublin Core (JSON + OAI-DC XML) · Wikimedia page · RFC 4180 CSV · RFC 6902 JSON-Patch → one-click GitHub PR.", "sz": 13, "c": GRAY, "f": "Segoe UI"}])

# ---------- 8 CONTEXT CARD ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Context Cards", 8)
hero(s, [{"t": "Meaning, era, region — and every echo.", "sz": 30}])
pic_fit(s, os.path.join(SCREENS, "studio-context-card.png"), Inches(0.8), Inches(1.85), Inches(11.7))
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.6),
     [{"t": "Literal + cultural meaning, name variants, every moment it appears on tape, and the reels that echo it — cross-reel, clickable to seek.", "sz": 13, "c": GRAY, "f": "Segoe UI"}])

# ---------- 9 TECH ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Under the hood", 9)
hero(s, [{"t": "Local-first. Deterministic. Open."}], sz=32)
rows = [
    ("Annotation engine", "Unicode-aware NLP matcher over scripted transcripts · 34-entry cultural dictionary · gazetteer"),
    ("Smart Local Heuristics", "Intent detection + IDF retrieval — the offline brain. Never throws; never invents a citation."),
    ("Live LLM (optional)", "Ollama / Gemma, OpenAI-compatible or Gemini — rephrases grounded answers only, never sources them."),
    ("Exporter", "IIIF Presentation 3.0 · Dublin Core · OAI-DC XML · Wikimedia · CSV · JSON Patch — all in-browser."),
    ("Build", "Vite production build ≈ 370 kB JS (117 kB gzip) · no accounts, no keys, no server mode."),
]
y = Inches(2.15)
for k, v in rows:
    rect(s, Inches(0.8), y, Inches(11.7), Inches(0.86), fill=CARD, line=EDGE, radius=0.1)
    text(s, Inches(1.05), y + Inches(0.14), Inches(3.1), Inches(0.6), [{"t": k, "sz": 15, "b": True, "c": AMBER}])
    text(s, Inches(4.25), y + Inches(0.15), Inches(8.0), Inches(0.62), [{"t": v, "sz": 13.5, "c": RGBColor(0xD4, 0xD4, 0xD8)}])
    y += Inches(1.0)

# ---------- 10 THESIS / CLOSE ----------
s = prs.slides.add_slide(BLANK); chrome(s, "Track-2 thesis", 10)
text(s, Inches(0.8), Inches(2.0), Inches(11.7), Inches(2.0), [
    {"t": "Heritage ends where", "sz": 54, "b": True, "c": WHITE, "f": "Segoe UI Semibold"},
    {"t": "context begins.", "sz": 54, "b": True, "c": AMBER, "f": "Segoe UI Semibold"},
])
text(s, Inches(0.85), Inches(4.15), Inches(11.4), Inches(1.2), [
    {"t": "We don't just preserve the file — we preserve the understanding of the file,", "sz": 20, "c": GRAY},
    {"t": "in open standards anyone can use, forever.   The museum outlives us.", "sz": 20, "c": GRAY},
])
text(s, Inches(0.85), Inches(6.2), Inches(11.5), Inches(0.8), [
    {"t": "github.com/smritigraph/smritigraph   ·   MIT · CC BY 4.0 annotations   ·   Built with ♥ for Hacktoberfest Hack Day 2026", "sz": 14, "c": RGBColor(0x71, 0x71, 0x7A), "f": "Consolas"},
])

out = r"D:\HackerThon\deliverables\smritigraph-pitch.pptx"
prs.save(out)
print("saved", out, os.path.getsize(out), "bytes,", len(prs.slides.__iter__.__self__._sldIdLst), "slides")
