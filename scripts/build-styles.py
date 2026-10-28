"""Generates src/styles.css: the Mono and Glass styles for every component (Classic is the components' own look).

Each component keeps its own tokens (--<prefix>-ink, -surface, -accent, -shadow, -font …); a style just overrides
them under html[data-style="…"]. Run: python3 scripts/build-styles.py

Glass is a layered material (see src/glass-defs.tsx for the refraction filters):
  Tier 0  opaque fallback: no backdrop-filter support, reduced transparency, more contrast, forced colours
  Tier 1  frosted glass + specular rim + shadow on every glass surface
  Tier 2  true refraction (backdrop-filter: url(#pane-glass-…)) on floating surfaces only, Chromium only
Glass surfaces are found by scanning each component's CSS for a card, panel or menu that paints a --<prefix>-surface
background; nothing nested inside a glass surface gets a backdrop-filter of its own (no glass on glass).
"""
import re
from pathlib import Path

PREFIXES = ["aia", "ths", "tl", "cc", "wa", "mp", "cw", "mm", "st", "ad", "tw"]

# Mono: crisp, monospaced, hairline. (Classic needs no overrides.)
MONO = {
    "font": '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
    "light": dict(ink="#000", surface="#fff", accent="#111", glint="rgb(255 255 255 / .95)", page="#fff", stage="#f5f5f5", dot="rgb(0 0 0 / .08)",
                  shadow="0 0 0 1px rgb(0 0 0 / .14)", float="0 0 0 1px rgb(0 0 0 / .2), 4px 4px 0 0 rgb(0 0 0 / .08)"),
    "dark": dict(ink="#fff", surface="#0a0a0a", accent="#f2f2f2", glint="rgb(255 255 255 / .9)", page="#000", stage="#0d0d0d", dot="rgb(255 255 255 / .07)",
                 shadow="0 0 0 1px rgb(255 255 255 / .16)", float="0 0 0 1px rgb(255 255 255 / .22), 4px 4px 0 0 rgb(255 255 255 / .06)"),
    "ease": "cubic-bezier(.2, .9, .1, 1)",
}

# Glass: values live in html-level --pane-* variables so one block per piece serves light, dark and every tier.
GLASS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, ui-sans-serif, system-ui, sans-serif'
GLASS_EASE = "cubic-bezier(.22, 1, .36, 1)"

W = lambda a: f"rgb(255 255 255 / {a})"

GLASS = {
    "light": dict(
        ink="#0a0e1a", accent="#0060e2", solid="#fff", glint=W(".95"), page="#e8ebf8",
        # secondary text floors (AA on the light glass): the pieces' own -t1..-t4 ink mixes are remapped to these in Glass
        t=(94, 78, 66, 52),
        # hairline rim for chips and buttons: lit from the top-left
        shadow=f"inset 0 0 0 .5px {W('.7')}, 0 0 0 .5px rgb(30 40 90 / .11), 0 1px 3px rgb(30 40 90 / .08)",
        # L1 cards: a full rim, crisp 1.5px speculars top-left and bottom-right, soft glows behind them, edge luminosity, depth
        card=(f"inset 0 0 0 1px {W('.4')}, inset 1.5px 1.5px 0 -.5px {W('1')}, inset -1.5px -1.5px 0 -.5px {W('.55')}, "
              f"inset 5px 5px 12px -5px {W('.85')}, inset -5px -5px 12px -5px {W('.4')}, inset 0 0 26px -6px {W('.5')}, "
              f"0 0 0 .5px rgb(30 40 90 / .14), 0 2px 6px rgb(30 40 90 / .1), 0 18px 44px -14px rgb(30 40 100 / .36)"),
        # L2 floating surfaces: thicker, deeper
        pop=(f"inset 0 0 0 1px {W('.46')}, inset 2px 2px 0 -.5px {W('1')}, inset -2px -2px 0 -.5px {W('.62')}, "
             f"inset 7px 7px 14px -6px {W('.9')}, inset -7px -7px 14px -6px {W('.45')}, inset 0 0 32px -6px {W('.55')}, "
             f"0 0 0 .5px rgb(30 40 90 / .16), 0 3px 8px rgb(30 40 90 / .1), 0 26px 56px -14px rgb(30 40 100 / .42)"),
        tier0=dict(tint=W(".95"), float=W(".97"), nested=W(".95"), over=W(".97"), sheen="none"),
        tier1=dict(tint=W(".46"), float=W(".42"), nested=W(".76"), over=W(".94"),
                   sheen=f"linear-gradient(135deg, {W('.55')} 0%, {W('.1')} 30%, {W('0')} 56%, {W('.28')} 100%)"),
        blur="blur(22px) saturate(2)", blur_float="blur(26px) saturate(2.1)",
    ),
    "dark": dict(
        ink="#fff", accent="#4d8dff", solid="#222227", glint=W(".9"), page="#07070f",
        t=(94, 76, 62, 48),
        shadow=f"inset 0 0 0 .5px {W('.16')}, 0 0 0 .5px rgb(0 0 0 / .5), 0 1px 3px rgb(0 0 0 / .4)",
        card=(f"inset 0 0 0 1px {W('.14')}, inset 1.5px 1.5px 0 -.5px {W('.62')}, inset -1.5px -1.5px 0 -.5px {W('.24')}, "
              f"inset 5px 5px 12px -5px {W('.3')}, inset -5px -5px 12px -5px {W('.12')}, inset 0 0 26px -8px {W('.16')}, "
              f"0 0 0 .5px rgb(0 0 0 / .6), 0 2px 6px rgb(0 0 0 / .3), 0 20px 46px -14px rgb(0 0 0 / .7)"),
        pop=(f"inset 0 0 0 1px {W('.18')}, inset 2px 2px 0 -.5px {W('.7')}, inset -2px -2px 0 -.5px {W('.28')}, "
             f"inset 7px 7px 14px -6px {W('.34')}, inset -7px -7px 14px -6px {W('.14')}, inset 0 0 32px -8px {W('.18')}, "
             f"0 0 0 .5px rgb(0 0 0 / .65), 0 3px 8px rgb(0 0 0 / .35), 0 28px 58px -14px rgb(0 0 0 / .78)"),
        tier0=dict(tint="rgb(32 32 38 / .96)", float="rgb(38 38 45 / .97)", nested="rgb(34 34 40 / .96)", over="rgb(38 38 45 / .97)", sheen="none"),
        tier1=dict(tint="rgb(20 20 30 / .54)", float="rgb(22 22 32 / .5)", nested="rgb(22 22 30 / .84)", over="rgb(28 28 36 / .95)",
                   sheen=f"linear-gradient(135deg, {W('.16')} 0%, {W('.03')} 32%, {W('0')} 58%, {W('.07')} 100%)"),
        blur="blur(22px) saturate(1.8)", blur_float="blur(26px) saturate(1.9)",
    ),
}

# Hand-listed surfaces for components the scan can't see (the app shell and the agent inbox use their own prefixes).
EXTRA_FROST = [".as-main", ".as-news__card", ".as-guide", ".ai-card", ".ai-lane", ".ipr-ctl", ".ipr-twrap", ".ipr-plist", ".imc-rail", ".imc-top"]
EXTRA_FLOAT = {"pill": [".dkm-bar"]}

# Surfaces that sit under a "backdrop root" (an ancestor with opacity<1, a filter, a mask, a clip-path or its own backdrop-filter):
# there a backdrop-filter only sees the parent's own content and blurs nothing. They get the near-opaque look instead.
# Found with docs/review/glass-roots.mjs; re-run it after adding pieces.
ROOT_EXCLUDE = [".ma-tip"]  # inside .ma-bar, which sits at opacity .6

# Floating surfaces by name, and the refraction filter size class each gets.
FLOAT_SIZE = [("tip", r"(tip|tooltip)$"), ("menu", r"(pop|popover|menu|palette|listbox)(-panel)?$"), ("card", r"(dialog|sheet)$"), ("pill", r"(dock|bar)$")]
FROST_NAME = r"(card|panel|surface|shell|body|window|frame|main|sheet)$"


def blended(pre: str) -> str | None:
    """A mix-blend-mode descendant under a backdrop-filter blanks it (verified in Chrome). Look in the component and its demo,
    in CSS, inline styles and Tailwind classes. Returns the file that blends, or None."""
    f = FILES[pre][0]
    rx = re.compile(r"mix-blend-mode:\s*(?!normal\b)[a-z]|mixBlendMode|\bmix-blend-(?!normal)[a-z-]+")
    for g in (f, Path("src/demos") / f"{f.stem}.demo.tsx"):
        if g.exists() and rx.search(g.read_text()):
            return str(g)
    return None


def block(sel: str, decls: dict) -> str:
    body = "\n".join(f"  {k}: {v};" for k, v in decls.items())
    return f"{sel} {{\n{body}\n}}\n"


def mix(color: str, pct: int) -> str:
    return f"color-mix(in oklab, {color} {pct}%, transparent)"


# --- discover components ----------------------------------------------------------------------------------------------
TOKENS = ["ink", "surface", "accent", "shadow", "float", "glint", "ease", "font"]
AUTO: dict[str, set[str]] = {}
FILES: dict[str, tuple[Path, str]] = {}
for f in sorted(Path("src/components").glob("*/*.tsx")):
    css = f.read_text()
    m = re.search(r"^\s*\.([a-z][a-z0-9]*)\s*[,{]", css, re.M)  # the first rule's class is the root prefix
    if not m:
        continue
    pre = m.group(1)
    FILES[pre] = (f, css)
    if pre in PREFIXES or pre in ("ai", "as"):
        continue
    toks = {t for t in TOKENS if f"--{pre}-{t}:" in css or f"var(--{pre}-{t}," in css}
    if toks:
        AUTO[pre] = toks

# Pieces in the paper family define --<prefix>-paper: Mono paints it, Glass lets the wallpaper through.
PAPER = [pre for pre in AUTO if any(f"--{pre}-paper:" in f.read_text() for f in Path("src/components").glob("*/*.tsx"))]


# Secondary text: pieces derive -t1..-t4 from their ink with an alpha mix. On translucent glass the light ones fall under AA, so Glass
# remaps every ink-derived tN (defined on the piece's root class) to a stronger floor, --pane-t1..t4.
TSCALE: dict[str, set[str]] = {}
ROOTS: dict[str, set[str]] = {}  # extra root classes (e.g. .tcc-group next to .tcc) that define the piece's own ink tokens
DARKPRE = r"(?::is\(\.dark, \[data-theme=\"dark\"\]\) |html\.dark |\.dark )?"
for _pre, (_f, _css) in FILES.items():
    _text = re.sub(r"/\*.*?\*/", "", _css, flags=re.S)
    for _m in re.finditer(r"([^{}]+)\{([^{}]*)\}", _text):
        _sel = re.split(r"[`;}]", _m.group(1))[-1]
        _parts = [x.strip() for x in _sel.split(",")]
        _roots = [re.sub(r"^" + DARKPRE, "", x).replace(".dark", "") for x in _parts if re.fullmatch(DARKPRE + r"\.%s(-[a-z0-9]+)?(\.dark)?" % _pre, x)]
        if not _roots:
            continue
        for _t in re.finditer(r"--%s-t([1-4]):\s*([^;]+)" % _pre, _m.group(2)):
            if f"var(--{_pre}-ink" in _t.group(2) or f"--{_pre}-ink:" in _m.group(2):  # derived from the ink, or a fixed palette that sets its own ink
                TSCALE.setdefault(_pre, set()).add(_t.group(1))
                ROOTS.setdefault(_pre, set()).update(_roots)

PAPER_TEXT: list[tuple[str, str]] = []  # rules that paint text or icons with --<prefix>-paper (the colour of text on an ink button)


ISOLATED: set[str] = set()  # classes that get isolation:isolate somewhere; a backdrop-filter on them breaks next to a blended child


def scan_surfaces() -> tuple[list[str], dict[str, list[str]]]:
    """Find the classes that paint a card, panel or menu with a --<prefix>-surface background."""
    frost: list[str] = []
    floats: dict[str, list[str]] = {k: [] for k, _ in FLOAT_SIZE}
    for pre, (f, css) in FILES.items():
        if f.parent.name == "motion" or "backdrop-filter" in css:  # pieces that are glass themselves keep their own
            continue
        if blended(pre):  # a blended descendant under a backdrop-filter can blank it
            continue
        text = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        decls: dict[str, str] = {}
        for m in re.finditer(r"([^{}]+)\{([^{}]*isolation:\s*isolate[^{}]*)\}", text):  # a class that isolates in ANY rule (compound or not)
            ISOLATED.update(re.findall(r"\.[a-zA-Z][\w-]*", m.group(1)))
        for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
            sel = re.split(r"[`;}]", m.group(1))[-1]
            pm = re.findall(r"(?:^|[;\s])(color|fill|stroke)\s*:\s*var\(--%s-paper\)\s*(?:;|$)" % pre, m.group(2)) if pre in PAPER else []
            if pm and "@" not in sel and "::" not in sel:
                PAPER_TEXT.extend((x.strip(), prop) for x in sel.split(",") if x.strip() for prop in pm)
            for part in sel.split(","):
                part = part.strip()
                if re.fullmatch(rf"\.{pre}(-[a-zA-Z0-9_-]+|__[a-zA-Z0-9_-]+)?", part):
                    decls[part] = decls.get(part, "") + m.group(2)
        for sel, body in decls.items():
            if sel in ISOLATED:
                continue
            if not re.search(rf"background(-color)?\s*:[^;]*var\(--{pre}-(surface|sheet)\b", body):
                continue
            name = sel[1:]
            if "border-radius" not in body and not re.search(FROST_NAME, name):  # square paper sheets count too
                continue
            for size, rx in FLOAT_SIZE:
                if re.search(rx, name) and (not name.endswith("sheet") or re.search(r"position:\s*(absolute|fixed)", body)):
                    floats[size].append(sel)
                    break
            else:
                if name == pre or re.search(FROST_NAME, name):
                    frost.append(sel)
    return frost, floats


FROST, FLOATS = scan_surfaces()
for sel in EXTRA_FROST + [x for v in EXTRA_FLOAT.values() for x in v]:  # the hand-listed surfaces get the same guard, and fail the build
    pre = re.match(r"\.([a-z]+)", sel).group(1)
    if pre in FILES and blended(pre):
        raise SystemExit(f"{sel}: {blended(pre)} uses mix-blend-mode under a glass surface, which blanks its backdrop-filter. Remove it from the list or the blend from the piece.")
FROST = sorted(set(FROST + EXTRA_FROST))
for size, sels in EXTRA_FLOAT.items():
    FLOATS[size] = sorted(set(FLOATS[size] + sels))
FROST = [x for x in FROST if x not in ROOT_EXCLUDE]
for size in FLOATS:
    FLOATS[size] = [x for x in FLOATS[size] if x not in ROOT_EXCLUDE]
FLOATS = {k: sorted(set(v)) for k, v in FLOATS.items()}
FROST = [s for s in FROST if not any(s in v for v in FLOATS.values())]
FLOAT_ALL = sorted({s for v in FLOATS.values() for s in v})
ALL_GLASS = sorted(set(FROST) | set(FLOAT_ALL))
G = 'html[data-style="glass"]'


def is_(sels: list[str]) -> str:
    return ":is(" + ", ".join(sels) + ")"


def glass_vars(mode: str, tier: int) -> dict:
    t = GLASS[mode]
    tt = t["tier1" if tier else "tier0"]
    return {"--pane-ink": t["ink"], "--pane-accent": t["accent"], "--pane-solid": t["solid"], "--pane-glint": t["glint"],
            "--pane-shadow": t["shadow"], "--pane-card": t["card"], "--pane-pop": t["pop"],
            "--pane-tint": tt["tint"], "--pane-tint-float": tt["float"], "--pane-tint-nested": tt["nested"], "--pane-tint-over": tt["over"], "--pane-sheen": tt["sheen"],
            **{f"--pane-t{i + 1}": mix("var(--pane-ink)", v) for i, v in enumerate(t["t"])}}


out = ["/* Generated by scripts/build-styles.py – do not edit by hand. */\n"]

# --- Mono ---------------------------------------------------------------------------------------------------------------
for mode in ("light", "dark"):
    t = MONO[mode]
    root = 'html[data-style="mono"]' + (".dark" if mode == "dark" else "")
    values = {"ink": t["ink"], "surface": t["surface"], "accent": t["accent"], "shadow": t["shadow"], "float": t["float"],
              "glint": t["glint"], "ease": MONO["ease"], "font": MONO["font"]}
    for p in PREFIXES:
        out.append(block(f"{root} .{p}", {f"--{p}-{k}": v for k, v in values.items()}))
    for pre, toks in AUTO.items():
        out.append(block(f"{root} .{pre}", {f"--{pre}-{k}": values[k] for k in TOKENS if k in toks}))
    for pre in PAPER:
        out.append(block(f"{root} .{pre}", {f"--{pre}-paper": t["page"], f"--{pre}-sheet": t["surface"], f"--{pre}-signal": t["accent"]}))
    ink, surf = t["ink"], t["surface"]
    out.append(block(f"{root} .ai", {
        "--ai-ink": ink, "--ai-text": mix(ink, 72), "--ai-muted": mix(ink, 50), "--ai-faint": mix(ink, 32),
        "--ai-card": surf, "--ai-lane": mix(ink, 5), "--ai-ring": mix(ink, 10), "--ai-card-shadow": t["shadow"],
        "--ai-accent": t["accent"], "--ai-primary-bg": ink, "--ai-primary-ink": t["page"], "--ai-ease": MONO["ease"], "--ai-font": MONO["font"]}))
    out.append(block(f"{root} .as", {
        "--as-bg": t["page"], "--as-surface": surf, "--as-border": mix(ink, 10), "--as-line": mix(ink, 7),
        "--as-ink": ink, "--as-text": mix(ink, 82), "--as-text-2": mix(ink, 62), "--as-muted": mix(ink, 55), "--as-subtle": mix(ink, 48), "--as-faint": mix(ink, 38),
        "--as-fill": mix(ink, 5), "--as-well": mix(ink, 4), "--as-code": mix(ink, 3), "--as-hover": mix(ink, 4), "--as-active": mix(ink, 7),
        "--as-accent": t["accent"], "--as-accent-soft": mix(t["accent"], 12), "--as-primary": ink, "--as-primary-ink": t["page"],
        "--as-card": t["shadow"], "--as-card-2": t["shadow"], "--as-inset": f"inset 0 0 0 1px {mix(ink, 9)}", "--as-ease": MONO["ease"], "--as-font": MONO["font"]}))
    out.append(block(root, {"--page-bg": t["page"], "--stage-bg": t["stage"], "--stage-dot": t["dot"]}))

out.append("""
/* Mono: crisp corners on the cards */
html[data-style="mono"] :is(.aia, .ths, .tl, .cc-body, .wa, .mp-pop, .cw, .mm-card, .st-card, .ad-card, .ai-card, .ai-lane, .tw, .as-main) { border-radius: 4px !important }
html[data-style="mono"] :is(.aia-source, .ths-source, .aia-cite, .mp-trigger, .cc-approval) { border-radius: 3px !important }
""")

# --- Glass --------------------------------------------------------------------------------------------------------------
out.append("\n/* ===== Glass ===== */\n/* Tier 0: the opaque fallback is the default. */")
for mode in ("light", "dark"):
    root = G + (".dark" if mode == "dark" else "")
    out.append(block(root, {**glass_vars(mode, 0), "--page-bg": GLASS[mode]["page"], "--stage-bg": "transparent", "--stage-dot": "transparent",
                            "--pane-font": GLASS_FONT, "--pane-ease": GLASS_EASE}))

# Per-piece tokens point at the html-level --pane-* variables, so they follow light/dark and every tier for free.
# The piece's --surface stays a SOLID colour (it is also used for text on ink buttons and for chips); the translucent
# tint is painted only on the glass surfaces below.
values = {"ink": "var(--pane-ink)", "surface": "var(--pane-solid)", "accent": "var(--pane-accent)", "shadow": "var(--pane-shadow)",
          "float": "var(--pane-shadow)", "glint": "var(--pane-glint)", "ease": "var(--pane-ease)", "font": "var(--pane-font)"}
for p in PREFIXES:
    out.append(block(f"{G} .{p}", {f"--{p}-{k}": v for k, v in values.items()}))
for pre, toks in AUTO.items():
    out.append(block(f"{G} .{pre}", {f"--{pre}-{k}": values[k] for k in TOKENS if k in toks}))
for pre, ns in sorted(TSCALE.items()):
    for root in sorted(ROOTS[pre] | {f".{pre}"}):
        out.append(block(f"{G} {root}", {f"--{pre}-t{n}": f"var(--pane-t{n})" for n in sorted(ns)}
                         | ({f"--{pre}-{k}": values[k] for k in TOKENS if k in AUTO.get(pre, ())} if root != f".{pre}" else {})))
for pre in PAPER:
    out.append(block(f"{G} .{pre}", {f"--{pre}-paper": "transparent", f"--{pre}-sheet": "var(--pane-solid)", f"--{pre}-signal": "var(--pane-accent)"}))
ink = "var(--pane-ink)"
out.append(block(f"{G} .ai", {
    "--ai-ink": ink, "--ai-text": "var(--pane-t2)", "--ai-muted": "var(--pane-t3)", "--ai-faint": "var(--pane-t4)",
    "--ai-card": "var(--pane-tint-nested)", "--ai-lane": mix(ink, 5), "--ai-ring": mix(ink, 10), "--ai-card-shadow": "var(--pane-shadow)",
    "--ai-accent": "var(--pane-accent)", "--ai-primary-bg": ink, "--ai-primary-ink": "var(--pane-solid)", "--ai-ease": "var(--pane-ease)", "--ai-font": "var(--pane-font)"}))
out.append(block(f"{G} .as", {
    "--as-bg": "transparent", "--as-surface": "var(--pane-tint-nested)", "--as-border": mix(ink, 10), "--as-line": mix(ink, 7),
    "--as-ink": ink, "--as-text": "var(--pane-t1)", "--as-text-2": "var(--pane-t2)", "--as-muted": "var(--pane-t3)", "--as-subtle": "var(--pane-t3)", "--as-faint": "var(--pane-t4)",
    "--as-fill": mix(ink, 5), "--as-well": mix(ink, 4), "--as-code": mix(ink, 3), "--as-hover": mix(ink, 4), "--as-active": mix(ink, 7),
    "--as-accent": "var(--pane-accent)", "--as-accent-soft": mix("var(--pane-accent)", 12), "--as-primary": ink, "--as-primary-ink": "var(--pane-solid)",
    "--as-card": "var(--pane-shadow)", "--as-card-2": "var(--pane-shadow)", "--as-inset": f"inset 0 0 0 1px {mix(ink, 9)}", "--as-ease": "var(--pane-ease)", "--as-font": "var(--pane-font)"}))

out.append("/* Text and icons painted with the paper colour sit on ink: in Glass the paper is see-through, so use the solid surface colour. */")
for sel, prop in sorted(set(PAPER_TEXT)):
    out.append(f'{G} {sel} {{ {prop}: var(--pane-solid) }}')
out.append(f"""
/* Glass surfaces: a translucent tint, a specular rim and a shadow. No ::before, no isolation, no blend modes. */
{G} {is_(FROST)} {{ background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }}
{G} {is_(FLOAT_ALL)} {{ background-color: var(--pane-tint-float); background-image: var(--pane-sheen); box-shadow: var(--pane-pop) }}
""")

# Tier 1: frost. Literal values, prefixed and unprefixed (Safari ignores var() in the prefixed property).
frost_rules = []
for mode in ("light", "dark"):
    root = G + (".dark" if mode == "dark" else "")
    frost_rules.append(block(root, glass_vars(mode, 1)))
for mode in ("light", "dark"):
    t = GLASS[mode]
    sel = G + (".dark" if mode == "dark" else "")
    frost_rules.append(f"{sel} {is_(FROST)} {{ -webkit-backdrop-filter: {t['blur']}; backdrop-filter: {t['blur']} }}\n")
    frost_rules.append(f"{sel} {is_(FLOAT_ALL)} {{ -webkit-backdrop-filter: {t['blur_float']}; backdrop-filter: {t['blur_float']} }}\n")
out.append("@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {\n" + "".join(frost_rules) + "}\n")

# Tier 2: refraction on floating surfaces, only when glass-defs.tsx has set <html data-refract> (Chromium, no reduced transparency).
# The filter itself blurs the flat centre and keeps the rim sharp so it can bend what is behind (see glass-defs.tsx).
for mode in ("light", "dark"):
    t = GLASS[mode]
    tail = "saturate(1.8) brightness(1.05)" if mode == "light" else "saturate(1.7) brightness(1.12)"
    sel = G + ("[data-refract]" if mode == "light" else ".dark[data-refract]")
    for size, sels in {**FLOATS, "card": sorted(set(FLOATS["card"]) | set(FROST))}.items():  # cards refract too, with the big map
        if not sels:
            continue
        v = f"url(#pane-glass-{size}-{"l" if mode == "light" else "d"}) {tail}"
        out.append(f"{sel} {is_(sels)} {{ -webkit-backdrop-filter: {v}; backdrop-filter: {v} }}\n")

# No glass on glass: a surface inside another glass surface keeps its tint but drops its own backdrop-filter and turns
# more opaque (a floating one nearly solid, since it covers the card's own text), so it stays readable. Browsers don't blur a nested backdrop anyway, and the doubled blur only muddies.
out.append(f"""
{G} {is_(ALL_GLASS)} {is_(ALL_GLASS)} {{ -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background-color: var(--pane-tint-nested) }}
{G} {is_(ALL_GLASS)} {is_(FLOAT_ALL)} {{ background-color: var(--pane-tint-over) }}
""")

# Surfaces under a backdrop root stay near-opaque (see ROOT_EXCLUDE).
if ROOT_EXCLUDE:
    out.append(f"{G} {is_(ROOT_EXCLUDE)} {{ background-color: var(--pane-tint-over); box-shadow: var(--pane-pop) }}\n")

# Tiers back down: reduced transparency, more contrast and forced colours get the opaque look.
fallback = []
for mode in ("light", "dark"):
    fallback.append(block(G + (".dark" if mode == "dark" else ""), glass_vars(mode, 0)))
fallback.append(f"{G} {is_(ALL_GLASS)} {{ -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background-image: none !important }}\n")
out.append("@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {\n" + "".join(fallback) + "}\n")

css_out = "\n".join(out)
# Safari ignores var() inside -webkit-backdrop-filter, so every backdrop-filter value must be literal.
bad = re.findall(r"[^;{}\n]*backdrop-filter\s*:[^;}]*var\(", css_out) + re.findall(r"[^;{}\n]*backdrop-filter\s*:[^;}]*var\(", Path("src/index.css").read_text())
if bad:
    raise SystemExit("backdrop-filter must use literal values, found var(): " + bad[0])
Path("src/styles.css").write_text(css_out)
print(f"wrote src/styles.css ({len(PREFIXES)} listed + {len(AUTO)} discovered; glass: {len(FROST)} frosted, {len(FLOAT_ALL)} floating)")
for k, v in FLOATS.items():
    print(f"  float/{k}: {' '.join(v)}")
print("  frost: " + " ".join(FROST))
