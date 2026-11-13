"use client"

import * as React from "react"
import { rng, type StudioPieceProps, type Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GouachePalette = "alpine" | "dusk" | "spring"

export type GouacheLakeProps = StudioPieceProps & {
  /** Colour set: alpine (cool greens, cream sky), dusk (violet and amber), spring (yellow-green, blossom). */
  palette?: GouachePalette
  /** Brush size multiplier. 1 is the designed size. */
  dabSize?: number
  /** How thickly the hillside is painted. 1 is the designed coverage. */
  density?: number
  /** 0 – the water keeps moving; 1 – it is nearly still. */
  calm?: number
  /** Show the boat and its wake. */
  boat?: boolean
  /** 0 – morning light, 1 – late warm light. */
  timeOfDay?: number
  /** Paper grain laid over the finished painting, 0 to 1. */
  grain?: number
  /** Accessible description of the painting. */
  label?: string
  className?: string
  /** The boat's horizontal position (0 to 1) every time the person steers it. */
  onSteer?: (x: number) => void
  /** Fires once, when the person first touches the painting and the built-in crossing hands over. */
  onInteract?: () => void
}

type RGB = [number, number, number]

type Pal = {
  skyTop: RGB; skyLow: RGB; cloud: RGB; haze: RGB
  far: RGB[]; conifer: RGB[]; leaf: RGB[]; warm: RGB[]; ground: RGB[]; bank: RGB[]
  wTop: RGB; wDeep: RGB; wLight: RGB; wDark: RGB; wake: RGB
  hull: RGB; rim: RGB; oar: RGB; skin: RGB; warmTint: RGB
}

const hx = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const set = (...s: string[]) => s.map(hx)

const PALETTES: Record<GouachePalette, Pal> = {
  alpine: {
    skyTop: hx("#84b9d4"), skyLow: hx("#f6e9c8"), cloud: hx("#fbf6e6"), haze: hx("#c9d4cc"),
    far: set("#6f8fa0", "#86a3b0", "#a9c0c6"),
    conifer: set("#16392f", "#245647", "#3f7a62"),
    leaf: set("#2a5730", "#4a7f3a", "#8aae4c"),
    warm: set("#8a5a2c", "#c88a2f", "#e6bb59"),
    ground: set("#1b3d32", "#2b5842", "#3f6f4f"),
    bank: set("#46572e", "#7a8943", "#b6a95e"),
    wTop: hx("#5f93a3"), wDeep: hx("#1d566e"), wLight: hx("#a8cfd2"), wDark: hx("#164659"), wake: hx("#eaf1e6"),
    hull: hx("#1b2e35"), rim: hx("#f0e7ca"), oar: hx("#6a5136"), skin: hx("#dcae88"), warmTint: hx("#ffb878"),
  },
  dusk: {
    skyTop: hx("#5a5f8f"), skyLow: hx("#f2b48a"), cloud: hx("#f6d2b5"), haze: hx("#b79aa3"),
    far: set("#4b4f7c", "#6b6a92", "#9c85a1"),
    conifer: set("#0f2b2e", "#1b4440", "#2f6a5c"),
    leaf: set("#1f4636", "#3b6b45", "#7c9a50"),
    warm: set("#7a3c3a", "#b9604a", "#e8935a"),
    ground: set("#12302f", "#1d4741", "#2f5f4f"),
    bank: set("#3a4a2e", "#6b7a3c", "#d09a54"),
    wTop: hx("#7586ab"), wDeep: hx("#1c3a5c"), wLight: hx("#e5ae92"), wDark: hx("#14304e"), wake: hx("#f3d6c2"),
    hull: hx("#14232b"), rim: hx("#f0d9b5"), oar: hx("#5c4230"), skin: hx("#d6a07c"), warmTint: hx("#ff9a60"),
  },
  spring: {
    skyTop: hx("#a8cde0"), skyLow: hx("#f6efd8"), cloud: hx("#fffaf0"), haze: hx("#d8e2d2"),
    far: set("#7da097", "#98b8ab", "#bcd3c1"),
    conifer: set("#1f5240", "#35755a", "#5c9a76"),
    leaf: set("#3d7a3a", "#72a33f", "#b8d15c"),
    warm: set("#c0728a", "#e59ab0", "#f6d0d9"),
    ground: set("#2a5a3a", "#41784a", "#5d9559"),
    bank: set("#5c7a35", "#98b04a", "#d4d27a"),
    wTop: hx("#7db2bf"), wDeep: hx("#2e7d93"), wLight: hx("#bddfe0"), wDark: hx("#226a80"), wake: hx("#f3f8f0"),
    hull: hx("#20363a"), rim: hx("#f4ecd2"), oar: hx("#6e5a3f"), skin: hx("#e0b490"), warmTint: hx("#ffc890"),
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gq {
  --gq-ink: #000;
  --gq-surface: #fff;
  --gq-accent: #0060e2;
  --gq-t1: color-mix(in oklab, var(--gq-ink) 88%, transparent);
  --gq-t2: color-mix(in oklab, var(--gq-ink) 61%, transparent);
  --gq-t3: color-mix(in oklab, var(--gq-ink) 45%, transparent);
  --gq-fill: color-mix(in oklab, var(--gq-ink) 6%, transparent);
  --gq-line: color-mix(in oklab, var(--gq-ink) 7%, transparent);
  --gq-scrim: rgb(255 255 255 / .74);
  --gq-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 18px 40px -14px rgb(20 40 40 / .22);
  --gq-ease: cubic-bezier(.22, 1, .36, 1);
  --gq-radius: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 1000px;
  font: 13px/20px var(--gq-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--gq-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gq {
  --gq-ink: #fff; --gq-surface: #1c1c1e; --gq-accent: #4d8dff;
  --gq-scrim: rgb(24 24 28 / .66);
  --gq-fill: color-mix(in oklab, var(--gq-ink) 8%, transparent);
  --gq-line: color-mix(in oklab, var(--gq-ink) 10%, transparent);
  --gq-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 18px 40px -14px rgb(0 0 0 / .55);
}
html[data-style="mono"] .gq {
  --gq-radius: 4px; --gq-accent: #111; --gq-shadow: 0 0 0 1px rgb(0 0 0 / .16);
  --gq-ease: cubic-bezier(.2, .9, .1, 1); --gq-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .gq { --gq-accent: #f2f2f2; --gq-shadow: 0 0 0 1px rgb(255 255 255 / .18) }
html[data-style="mono"] .gq-cv { filter: grayscale(.82) contrast(1.1) }
html[data-style="glass"] .gq {
  --gq-ink: var(--pane-ink); --gq-accent: var(--pane-accent); --gq-ease: var(--pane-ease); --gq-font: var(--pane-font);
  --gq-t1: var(--pane-t1); --gq-t2: var(--pane-t2); --gq-t3: var(--pane-t3);
  --gq-radius: 26px; --gq-shadow: var(--pane-shadow);
}
html[data-style="glass"] .gq-stage { box-shadow: var(--pane-card) }
html[data-style="glass"] .gq-btn { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(14px) saturate(1.8); backdrop-filter: blur(14px) saturate(1.8) }
.gq *, .gq *::before, .gq *::after { box-sizing: border-box }
:where(.gq) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.gq button:focus-visible { outline: 2px solid var(--gq-accent); outline-offset: 2px }
.gq-stage:focus-visible { outline: 2px solid var(--gq-accent); outline-offset: 3px }
.gq-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.gq-stage { position: relative; width: 100%; aspect-ratio: 16 / 10; border-radius: var(--gq-radius); overflow: hidden; background: #dfe5de; box-shadow: var(--gq-shadow); touch-action: none; user-select: none; -webkit-user-select: none; isolation: isolate }
@container (max-width: 520px) { .gq-stage { aspect-ratio: 1 / 1 } }
.gq-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair }

.gq-ctl { position: absolute; right: 12px; bottom: 12px; display: flex; gap: 6px; z-index: 2 }
.gq-btn { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: var(--gq-t1); background: var(--gq-scrim);
  -webkit-backdrop-filter: blur(10px) saturate(1.4); backdrop-filter: blur(10px) saturate(1.4);
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--gq-ink) 14%, transparent), 0 1px 2px rgb(0 0 0 / .12);
  transition: transform .16s var(--gq-ease), opacity .24s var(--gq-ease) }
html[data-style="mono"] .gq-btn { border-radius: 4px; box-shadow: 0 0 0 1px var(--gq-t3) }
.gq-btn:active { transform: scale(.94) }
.gq-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.gq-btn[hidden] { display: none }
@media (hover: hover) { .gq-btn:hover { transform: translateY(-1px) } .gq-btn:active { transform: scale(.94) } }
@media (prefers-reduced-motion: reduce) { .gq-btn { transition: none } }
`

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

type Ctx = CanvasRenderingContext2D
type Cvs = HTMLCanvasElement | OffscreenCanvas

const LOOP = 24 // seconds in one seamless loop
const CROSS = 17 // the boat is on screen for this long
const WAKE_LIFE = 7 // a wake mark lives this long
const STILL_T = 10.6 // the frame shown for reduced motion: boat mid-lake, long wake
const TAU = Math.PI * 2

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)

function mk(w: number, h: number): Cvs {
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    return c
  }
  return new OffscreenCanvas(w, h)
}
const ctx2 = (c: Cvs) => c.getContext("2d") as Ctx

function hash(x: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(s | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function n1(x: number, s: number) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, s) * (1 - u) + hash(i + 1, s) * u
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const css = (c: RGB, k = 0, a = 1) => {
  const f = (v: number) => (v + k < 0 ? 0 : v + k > 255 ? 255 : Math.round(v + k))
  return a >= 1 ? `rgb(${f(c[0])},${f(c[1])},${f(c[2])})` : `rgb(${f(c[0])} ${f(c[1])} ${f(c[2])} / ${a.toFixed(3)})`
}
/** Three flat tones, like three mixed pots of paint: shadow, mid, light. */
const tone = (fam: RGB[], v: number): RGB => (v < 0.34 ? fam[0] : v < 0.67 ? fam[1] : fam[2])

/* ----------------------------- the brush dab ------------------------------ */

const SA = (() => {
  const c = new Float32Array(8)
  const s = new Float32Array(8)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    c[k] = Math.sign(ca) * Math.abs(ca) ** 0.72 // squarer than an ellipse, like a flat brush
    s[k] = Math.sign(sa) * Math.abs(sa) ** 0.72
  }
  return { c, s }
})()
const DX = new Float32Array(8)
const DY = new Float32Array(8)

/** One flat, opaque stroke of gouache: a squared blob with a slightly irregular edge and a couple of bristle streaks. */
function dab(c: Ctx, x: number, y: number, rx: number, ry: number, rot: number, fill: string, r: () => number, streak?: string) {
  const cs = Math.cos(rot)
  const sn = Math.sin(rot)
  for (let k = 0; k < 8; k++) {
    const f = 0.86 + 0.24 * r()
    const ex = SA.c[k] * rx * f
    const ey = SA.s[k] * ry * f
    DX[k] = x + ex * cs - ey * sn
    DY[k] = y + ex * sn + ey * cs
  }
  c.beginPath()
  c.moveTo((DX[7] + DX[0]) / 2, (DY[7] + DY[0]) / 2)
  for (let k = 0; k < 8; k++) {
    const n = (k + 1) & 7
    c.quadraticCurveTo(DX[k], DY[k], (DX[k] + DX[n]) / 2, (DY[k] + DY[n]) / 2)
  }
  c.closePath()
  c.fillStyle = fill
  c.fill()
  if (streak && rx > 4) {
    c.strokeStyle = streak
    c.lineWidth = Math.max(0.7, ry * 0.13)
    c.lineCap = "round"
    for (let i = 0; i < 2; i++) {
      const oy = (r() - 0.5) * ry * 1.1
      const l = rx * (0.5 + 0.4 * r())
      const sx = (r() - 0.5) * rx * 0.5
      c.beginPath()
      c.moveTo(x + (sx - l) * cs - oy * sn, y + (sx - l) * sn + oy * cs)
      c.lineTo(x + (sx + l) * cs - oy * sn, y + (sx + l) * sn + oy * cs)
      c.stroke()
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           Resolve props and values                         */
/* -------------------------------------------------------------------------- */

type Resolved = {
  palette: GouachePalette; dab: number; density: number; calm: number; boat: boolean; tod: number; grain: number; seed: number; coat: string
}

export const DEFAULT_COAT = "#c4553a"

function resolve(v: Values | undefined, fb: Partial<Resolved> = {}): Resolved {
  const p = (v?.palette ?? fb.palette) as string | undefined
  return {
    palette: p === "dusk" || p === "spring" || p === "alpine" ? p : "alpine",
    dab: clamp(num(v?.dab ?? fb.dab, 1), 0.5, 2),
    density: clamp(num(v?.density ?? fb.density, 1), 0.4, 1.8),
    calm: clamp(num(v?.calm ?? fb.calm, 0.55), 0, 1),
    boat: (v?.boat ?? fb.boat ?? true) !== false,
    tod: clamp(num(v?.tod ?? fb.tod, 0.3), 0, 1),
    grain: clamp(num(v?.grain ?? fb.grain, 0.45), 0, 1),
    seed: Math.round(num(v?.seed ?? fb.seed, 7)),
    coat: typeof (v?.coat ?? fb.coat) === "string" ? ((v?.coat ?? fb.coat) as string) : DEFAULT_COAT,
  }
}

/* -------------------------------------------------------------------------- */
/*                         The painting, baked once                           */
/* -------------------------------------------------------------------------- */

type Bake = {
  w: number; h: number; U: number; yS: number; M: number
  land: Cvs; refl: Cvs; fg: Cvs; boat: Cvs; ox: number; oy: number; L: number
  grain: Cvs
}

const SHORE = 0.57 // shoreline height as a fraction of the picture

const farRidge = (x: number, s: number) =>
  0.36 - 0.13 * Math.max(0, 1 - Math.abs(x - (0.6 + (hash(1, s) - 0.5) * 0.14)) / 0.45) ** 1.3 - 0.07 * Math.max(0, 1 - Math.abs(x - 0.1) / 0.25) + 0.03 * (n1(x * 6, s) - 0.5)

const midRidge = (x: number, s: number) => {
  const c1 = 0.27 + (hash(2, s) - 0.5) * 0.1
  const c2 = 0.85 + (hash(3, s) - 0.5) * 0.06
  const a = 0.62 - 0.46 * Math.exp(-(((x - c1) / 0.3) ** 2))
  const b = 0.62 - 0.27 * Math.exp(-(((x - c2) / 0.2) ** 2))
  return Math.min(SHORE - 0.01, Math.min(a, b) + 0.028 * (n1(x * 9 + 3, s) - 0.5))
}

type Region = {
  rx: number; ry: number; tones?: RGB[]; haze?: RGB; hazeAmt?: number; lb?: number
  color?: (q: number, v: number) => RGB; streak?: boolean; grid?: number
}

/** Fill the area between two edges with rows of overlapping dabs, back to front, top row first. */
function fillRegion(c: Ctx, r: () => number, w: number, topPx: (xf: number) => number, botPx: (xf: number) => number, y0: number, y1: number, o: Region) {
  const sy = o.ry * 1.1 * (o.grid ?? 1)
  const sx = o.rx * 1.2 * (o.grid ?? 1)
  let row = 0
  for (let y = y0; y <= y1; y += sy, row++) {
    const off = (row % 2) * sx * 0.5
    for (let x = -o.rx + off; x < w + o.rx; x += sx) {
      const px = x + (r() - 0.5) * sx * 0.6
      const py = y + (r() - 0.5) * sy * 0.7
      const xf = px / w
      const t = topPx(xf)
      const b = botPx(xf)
      if (py < t - o.ry * 0.3 || py > b + o.ry) continue
      const q = clamp((py - t) / (b - t || 1), 0, 1)
      const v = 0.5 + (0.5 - q) * (o.lb ?? 0.8) + (r() - 0.5) * 0.62 + (0.5 - xf) * 0.1
      let col = o.color ? o.color(q, v) : tone(o.tones as RGB[], v)
      if (o.haze) col = mix(col, o.haze, (o.hazeAmt ?? 0.3) * (1 - q * 0.5))
      const k = (r() - 0.5) * 9
      dab(c, px, py, o.rx * (0.75 + 0.5 * r()), o.ry * (0.75 + 0.5 * r()), (r() - 0.5) * 0.3, css(col, k), r, o.streak ? css(mix(col, [255, 255, 255], 0.2), k, 0.5) : undefined)
    }
  }
}

type TreeKind = "conifer" | "leaf" | "warm"

/** A tree mass: dabs scattered inside its silhouette, three tones picked by how much it faces the light (upper left). */
function paintTree(c: Ctx, r: () => number, x: number, y: number, ht: number, kind: TreeKind, P: Pal, U: number, dab0: number, dens: number, hazeAmt: number, dark: number) {
  const fam = (kind === "conifer" ? P.conifer : kind === "leaf" ? P.leaf : P.warm).map((cc) => mix(mix(cc, P.haze, hazeAmt), [6, 14, 16], dark))
  const dr = clamp(ht * 0.105, 4.5 * U, 13 * U) * dab0
  const wd = kind === "conifer" ? ht * 0.5 : ht * 0.84
  const n = clamp(Math.round(((ht * wd * 0.62) / (dr * dr * 1.6)) * dens), 8, 420)
  const tiers = 3 + Math.floor(ht / (46 * U))
  const lobes = [
    { x: -0.2, y: 0.52, r: 0.34 }, { x: 0.2, y: 0.5, r: 0.36 }, { x: 0, y: 0.34, r: 0.32 }, { x: 0, y: 0.68, r: 0.3 },
  ]
  for (let i = 0; i < n; i++) {
    let px = 0
    let py = 0
    let s = 0
    let rot = 0
    if (kind === "conifer") {
      const f = Math.sqrt(r())
      const hw = (wd / 2) * f ** 0.85 * (1 + 0.2 * Math.sin(f * tiers * TAU * 0.5))
      const u = r() * 2 - 1
      px = x + u * hw
      py = y - ht + f * ht
      s = -u * 0.62 - (f - 0.5) * 0.55
      rot = u * 0.45 + (r() - 0.5) * 0.25
    } else {
      const lb = lobes[Math.floor(r() * lobes.length)]
      const a = r() * TAU
      const rr = Math.sqrt(r()) * lb.r * ht * 1.05
      const cx = x + lb.x * ht
      const cy = y - ht + lb.y * ht
      const ex = Math.cos(a) * rr
      const ey = Math.sin(a) * rr * 0.9
      px = cx + ex
      py = cy + ey
      s = (-ex * 0.55 - ey * 0.8) / (lb.r * ht) * 0.9
      rot = a + Math.PI / 2 + (r() - 0.5) * 0.5
    }
    const v = 0.5 + s * 0.62 + (r() - 0.5) * 0.5
    const col = tone(fam, v)
    const k = (r() - 0.5) * 9
    dab(c, px, py, dr * (kind === "conifer" ? 1.15 : 0.95) * (0.8 + 0.4 * r()), dr * (kind === "conifer" ? 0.58 : 0.68) * (0.8 + 0.4 * r()), rot, css(col, k), r, dr > 6 * U ? css(mix(col, [255, 255, 235], 0.18), k, 0.45) : undefined)
  }
}

function bake(w: number, h: number, R: Resolved): Bake {
  const P = PALETTES[R.palette]
  const U = Math.min(w, h) / 1080
  const ds = R.dab
  const yS = Math.round(h * SHORE)
  const seed = R.seed

  /* ---- the land: sky, ranges, hillside, trees, bank ---- */
  const land = mk(w, h)
  const c = ctx2(land)
  c.imageSmoothingEnabled = true
  const rS = rng(seed * 977 + 11)

  // Sky: broad horizontal strokes, cooler at the top.
  fillRegion(c, rS, w, () => -20 * U, () => yS * 0.8, -10 * U, yS * 0.8, {
    rx: 78 * U * ds, ry: 14 * U * ds, grid: 0.85 / Math.sqrt(R.density),
    color: (q, v) => mix(P.skyTop, P.skyLow, clamp(q ** 1.1 + (v - 0.5) * 0.16, 0, 1)),
  })
  // Clouds: a flat lit top and a shaded belly.
  for (let i = 0; i < 4; i++) {
    const cx = (0.1 + 0.8 * rS()) * w
    const cy = (0.08 + 0.15 * rS()) * h
    const cw = (80 + 90 * rS()) * U
    for (let k = 0; k < 9; k++) {
      const bx = cx + (rS() - 0.5) * cw * 1.6
      const by = cy + (rS() - 0.5) * 8 * U - Math.abs(bx - cx) * 0.04
      const belly = k % 3 === 0
      dab(c, bx, by + (belly ? 5 * U : 0), (22 + 34 * rS()) * U * ds, (5 + 3 * rS()) * U * ds, (rS() - 0.5) * 0.06, css(belly ? mix(P.cloud, P.skyLow, 0.45) : P.cloud, (rS() - 0.5) * 6), rS)
    }
  }
  // Far range, hazy blue.
  fillRegion(c, rS, w, (x) => farRidge(x, seed) * h, () => yS, farRidge(0.6, seed) * h - 18 * U, yS, {
    rx: 36 * U * ds, ry: 9 * U * ds, tones: P.far, haze: P.skyLow, hazeAmt: 0.42, lb: 1.1, grid: 0.95 / Math.sqrt(R.density),
  })
  // The hillside's ground colour.
  fillRegion(c, rS, w, (x) => midRidge(x, seed) * h, () => yS, 0.14 * h, yS, {
    rx: 26 * U * ds, ry: 8 * U * ds, tones: P.ground, haze: P.haze, hazeAmt: 0.12, lb: 0.7, grid: 0.95 / Math.sqrt(R.density),
  })
  // Tree masses, farthest first.
  const rT = rng(seed * 463 + 5)
  const trees: { x: number; y: number; ht: number; kind: TreeKind; d: number }[] = []
  const count = Math.round(70 * (w / h) * R.density * 0.8 + 40)
  for (let i = 0; i < count; i++) {
    const xf = rT()
    const ridge = midRidge(xf, seed)
    if (ridge > SHORE - 0.045) continue
    const d = rT() ** 1.15
    const yf = ridge + d * (SHORE - 0.012 - ridge)
    const dd = clamp((yf - 0.16) / 0.42, 0, 1)
    const ht = (0.045 + 0.1 * dd ** 1.2) * h * (0.8 + 0.4 * rT())
    const roll = rT()
    trees.push({ x: xf * w, y: yf * h, ht, kind: roll < 0.5 ? "conifer" : roll < (R.palette === "spring" ? 0.84 : 0.94) ? "leaf" : "warm", d: dd })
  }
  trees.sort((a, b) => a.y - b.y)
  const rP = rng(seed * 131 + 9)
  for (const t of trees) paintTree(c, rP, t.x, t.y, t.ht, t.kind, P, U, ds, R.density, (1 - t.d) * 0.4, (t.d - 0.3) * 0.12)
  // Bank along the water's edge: a hard, low strip of reeds-and-grass colour.
  const shorePx = (xf: number) => yS + (n1(xf * 14, seed) - 0.5) * 0.012 * h
  fillRegion(c, rS, w, (x) => shorePx(x) - 0.03 * h, (x) => shorePx(x) + 4 * U, yS - 0.04 * h, yS + 2 * U, {
    rx: 20 * U * ds, ry: 6 * U * ds, tones: P.bank, lb: 0.9, streak: true,
  })
  // Near, dark conifers that frame the left and the right edge.
  for (const [fx, fh, kind] of [[0.045, 0.42, "conifer"], [0.14, 0.27, "conifer"], [0.965, 0.25, "conifer"], [0.9, 0.15, "leaf"]] as const) {
    paintTree(c, rP, fx * w, yS - 0.012 * h, fh * h, kind, P, U, ds, R.density * 1.15, 0, 0.16)
  }
  // Late light: a warm multiply, then cut the picture off at the shoreline.
  if (R.tod > 0.01) {
    c.globalCompositeOperation = "multiply"
    c.fillStyle = css(mix([255, 255, 255], P.warmTint, R.tod * 0.36))
    c.fillRect(0, 0, w, yS + 0.03 * h)
    c.globalCompositeOperation = "source-over"
  }
  c.globalCompositeOperation = "destination-in"
  c.beginPath()
  c.moveTo(0, 0)
  c.lineTo(w, 0)
  for (let x = w; x >= 0; x -= 8) c.lineTo(x, shorePx(x / w))
  c.closePath()
  c.fillStyle = "#000"
  c.fill()
  c.globalCompositeOperation = "source-over"

  /* ---- the water: mirrored land with less contrast, then surface strokes ---- */
  const M = Math.round(14 * U)
  const wh = h - yS
  const refl = mk(w + 2 * M, wh)
  const rc = ctx2(refl)
  const grad = rc.createLinearGradient(0, 0, 0, wh)
  grad.addColorStop(0, css(P.wTop))
  grad.addColorStop(1, css(P.wDeep))
  rc.fillStyle = grad
  rc.fillRect(0, 0, w + 2 * M, wh)
  const ky = 0.9
  rc.save()
  rc.globalAlpha = 0.82
  rc.setTransform(1, 0, 0, -ky, M, ky * yS)
  rc.drawImage(land, 0, 0)
  rc.restore()
  rc.drawImage(refl, M, 0, 1, wh, 0, 0, M, wh)
  rc.drawImage(refl, M + w - 1, 0, 1, wh, M + w, 0, M, wh)
  rc.fillStyle = css(P.wDeep, 0, 0.3)
  rc.fillRect(0, 0, w + 2 * M, wh)
  const depth = rc.createLinearGradient(0, 0, 0, wh)
  depth.addColorStop(0, css(P.wDeep, 0, 0))
  depth.addColorStop(1, css(P.wDeep, 0, 0.5))
  rc.fillStyle = depth
  rc.fillRect(0, 0, w + 2 * M, wh)
  const rW = rng(seed * 59 + 3)
  const nSurf = Math.round(((w + 2 * M) * wh) / (900 * U * U) * R.density)
  for (let i = 0; i < nSurf; i++) {
    const yy = rW() ** 0.9 * wh
    const d = yy / wh
    const light = rW() < 0.62
    dab(rc, rW() * (w + 2 * M), yy, (10 + 62 * d) * U * ds * (0.5 + rW()), (1.2 + 2.4 * d) * U * ds, (rW() - 0.5) * 0.03, css(light ? P.wLight : P.wDark, 0, light ? 0.5 : 0.55), rW)
  }

  /* ---- foreground reeds, painted over everything ---- */
  const fg = mk(w, h)
  const fc = ctx2(fg)
  const rF = rng(seed * 41 + 17)
  const blades: { x: number; len: number; lean: number; bw: number; col: RGB; head: boolean }[] = []
  for (let i = 0; i < 70; i++) {
    const left = i % 7 < 4
    const x = (left ? 0.1 * rF() ** 1.5 : 1 - 0.09 * rF() ** 1.5) * w
    const edge = left ? 1 - x / (0.12 * w) : (x - 0.9 * w) / (0.1 * w)
    blades.push({ x, len: (0.07 + 0.15 * rF() * (0.5 + 0.5 * clamp(edge, 0, 1))) * h, lean: (left ? 1 : -1) * (rF() * 0.05 + 0.005) * h * (rF() < 0.5 ? 1 : -0.4), bw: (2 + 2.6 * rF()) * U, col: P.conifer[rF() < 0.55 ? 0 : 1], head: rF() < 0.18 })
  }
  blades.sort((a, b) => a.len - b.len)
  for (const b of blades) {
    const tipX = b.x + b.lean
    const tipY = h - b.len
    fc.fillStyle = css(mix(b.col, [6, 14, 16], 0.28), (rF() - 0.5) * 8)
    fc.beginPath()
    fc.moveTo(b.x - b.bw, h + 2)
    fc.quadraticCurveTo(b.x + b.lean * 0.25 - b.bw * 0.5, h - b.len * 0.55, tipX, tipY)
    fc.quadraticCurveTo(b.x + b.lean * 0.25 + b.bw * 0.5, h - b.len * 0.55, b.x + b.bw, h + 2)
    fc.closePath()
    fc.fill()
    if (b.head) dab(fc, tipX, tipY + 7 * U, 2.6 * U, 9 * U, Math.atan2(b.lean, b.len) * -1, css(mix(P.oar, [20, 16, 12], 0.4)), rF)
  }

  /* ---- the little boat (drawn facing right, waterline at y = 0) ---- */
  const L = Math.max(40, Math.round(0.17 * Math.min(h, w * 0.8)))
  const bw = Math.ceil(L * 1.5)
  const bh = Math.ceil(L * 0.8)
  const ox = bw / 2
  const oy = Math.round(L * 0.6)
  const boat = mk(bw, bh)
  const bc = ctx2(boat)
  bc.translate(ox, oy)
  bc.scale(L, L)
  bc.lineJoin = "round"
  bc.lineCap = "round"
  const hull = new Path2D()
  hull.moveTo(-0.5, -0.1)
  hull.quadraticCurveTo(-0.05, -0.03, 0.5, -0.12)
  hull.quadraticCurveTo(0.46, 0.0, 0.3, 0.025)
  hull.lineTo(-0.34, 0.025)
  hull.quadraticCurveTo(-0.47, -0.01, -0.5, -0.1)
  hull.closePath()
  bc.fillStyle = css(P.hull)
  bc.fill(hull)
  bc.save()
  bc.clip(hull)
  bc.fillStyle = css(mix(P.hull, [0, 0, 0], 0.4))
  bc.fillRect(-0.6, -0.012, 1.2, 0.1)
  bc.strokeStyle = css(P.rim, 0, 0.28)
  bc.lineWidth = 0.011
  bc.beginPath()
  bc.moveTo(-0.46, -0.062)
  bc.quadraticCurveTo(-0.05, 0.0, 0.43, -0.082)
  bc.stroke()
  bc.restore()
  bc.strokeStyle = css(P.rim)
  bc.lineWidth = 0.016
  bc.beginPath()
  bc.moveTo(-0.5, -0.1)
  bc.quadraticCurveTo(-0.05, -0.03, 0.5, -0.12)
  bc.stroke()
  // The rower: coat, head, a flat straw hat. One small warm accent in a cool picture.
  const coat = hx(/^#[0-9a-f]{6}$/i.test(R.coat) ? R.coat : DEFAULT_COAT)
  bc.save()
  bc.translate(-0.1, -0.2)
  bc.rotate(-0.12)
  bc.fillStyle = css(coat)
  bc.beginPath()
  bc.ellipse(0, 0, 0.068, 0.125, 0, 0, TAU)
  bc.fill()
  bc.fillStyle = css(mix(coat, [20, 10, 10], 0.28))
  bc.beginPath()
  bc.ellipse(0.03, 0.01, 0.036, 0.105, 0, -Math.PI / 2, Math.PI / 2)
  bc.fill()
  bc.restore()
  bc.fillStyle = css(P.skin)
  bc.beginPath()
  bc.arc(-0.082, -0.355, 0.04, 0, TAU)
  bc.fill()
  bc.fillStyle = css(mix(P.skin, [30, 20, 10], 0.25))
  bc.beginPath()
  bc.arc(-0.082, -0.355, 0.04, -0.3, Math.PI * 0.55)
  bc.lineTo(-0.082, -0.355)
  bc.fill()
  bc.fillStyle = css(mix(P.rim, P.warm[1], 0.45))
  bc.beginPath()
  bc.ellipse(-0.08, -0.385, 0.082, 0.014, -0.05, 0, TAU)
  bc.fill()
  bc.beginPath()
  bc.ellipse(-0.08, -0.397, 0.037, 0.02, 0, Math.PI, TAU)
  bc.fill()

  /* ---- paper grain tile ---- */
  const gt = Math.max(64, Math.round(180 * Math.max(0.7, U)))
  const grain = mk(gt, gt)
  const gc = ctx2(grain)
  const img = gc.createImageData(gt, gt)
  const rg = rng(seed * 7 + 1)
  for (let i = 0; i < gt * gt; i++) {
    const v = 128 + Math.round((rg() + rg() + rg() - 1.5) * 110)
    img.data[i * 4] = v
    img.data[i * 4 + 1] = v
    img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  gc.putImageData(img, 0, 0)

  return { w, h, U, yS, M, land, refl, fg, boat, ox, oy, L, grain }
}

const CACHE = new Map<string, Bake>()
function getBake(w: number, h: number, R: Resolved) {
  const key = [w, h, R.seed, R.palette, R.dab, R.density, R.tod, R.coat].join("|")
  let b = CACHE.get(key)
  if (!b) {
    b = bake(w, h, R)
    CACHE.set(key, b)
    if (CACHE.size > 3) CACHE.delete(CACHE.keys().next().value as string)
  } else {
    CACHE.delete(key)
    CACHE.set(key, b)
  }
  return b
}

/* -------------------------------------------------------------------------- */
/*                           The frame: water, wake, boat                      */
/* -------------------------------------------------------------------------- */

export type BoatPoint = { x: number; y: number }
export type Ring = { x: number; y: number; t0: number }
type Extras = { path: (tau: number) => BoatPoint | null; rings?: Ring[]; dir?: number }

/** The built-in crossing: left to right in 17 seconds on a gentle S, then the wake fades out. Periodic over LOOP. */
export function crossingPath(tau: number): BoatPoint | null {
  if (tau < 0 || tau > CROSS) return null
  return { x: -0.17 + 1.34 * (tau / CROSS), y: 0.745 + 0.03 * Math.sin(tau * 0.37 + 0.8) }
}

function paintFrame(c: Ctx, w: number, h: number, t: number, R: Resolved, ex: Extras) {
  const B = getBake(w, h, R)
  const P = PALETTES[R.palette]
  const { U, yS, M } = B
  const calm = R.calm
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalAlpha = 1
  c.globalCompositeOperation = "source-over"
  c.clearRect(0, 0, w, h)
  c.drawImage(B.land, 0, 0)

  // Wake marks are fixed in the water: one every 0.2s along the path, then they spread and fade.
  const STEP = 0.2
  const marks: { x: number; y: number; px: number; py: number; s: number; k: number }[] = []
  const infl: { x: number; y: number; a: number; r: number }[] = []
  if (R.boat) {
    const k1 = Math.floor(t / STEP)
    for (let j = 0; j <= Math.ceil(WAKE_LIFE / STEP); j++) {
      const k = k1 - j
      const tau = k * STEP
      const s = t - tau
      if (s >= WAKE_LIFE) break
      const p = ex.path(tau)
      const q = ex.path(tau - STEP)
      if (!p) continue
      const px = p.x * w
      const py = p.y * h
      let hxv = 1
      let hyv = 0
      let moved = 3
      if (q) {
        const dx = px - q.x * w
        const dy = py - q.y * h
        moved = Math.hypot(dx, dy)
        if (moved > 0.01) { hxv = dx / moved; hyv = dy / moved }
      }
      if (moved < 1.2 * U) continue
      marks.push({ x: px, y: py, px: -hyv, py: hxv, s, k })
      if (j % 4 === 0) infl.push({ x: px, y: py, a: (1 - s / WAKE_LIFE) ** 1.2, r: (0.07 + 0.012 * s) * w })
    }
  }

  // Mirrored water, in rows. Every row is a few segments shifted sideways: a slow swell everywhere, a stronger one around the wake.
  const sh = Math.max(2, Math.round(3 * U))
  const rows = Math.ceil((h - yS) / sh)
  const segs = 9
  const sw = w / segs
  const A0 = U * (0.5 + (1 - calm) * 3.4)
  const ph1 = (TAU * 3 * t) / LOOP
  const ph2 = (TAU * 5 * t) / LOOP
  const ph3 = (TAU * 8 * t) / LOOP
  const Ry = 0.07 * h
  for (let i = 0; i < rows; i++) {
    const sy = i * sh
    const d = i / rows
    const wy = yS + sy + sh / 2
    const base = A0 * (0.25 + 0.75 * d)
    const hh = Math.min(sh, h - yS - sy)
    for (let j = 0; j < segs; j++) {
      const cx = j * sw + sw / 2
      let dx = base * (Math.sin(i * 0.31 + ph1 + j * 0.35) + 0.5 * Math.sin(i * 0.77 - ph2 + j * 0.8))
      for (let m = 0; m < infl.length; m++) {
        const f = infl[m]
        const ddx = (cx - f.x) / f.r
        const ddy = (wy - f.y) / Ry
        const g = Math.exp(-ddx * ddx - ddy * ddy * (ddy > 0 ? 0.45 : 1.4))
        if (g > 0.02) dx += 5.2 * U * (1 - 0.45 * calm) * f.a * g * Math.sin(i * 0.9 - ph3 + m * 1.7)
      }
      const x0 = Math.floor(j * sw) - 1
      c.drawImage(B.refl, M + x0, sy, Math.ceil(sw) + 2, hh, x0 + Math.round(dx), yS + sy, Math.ceil(sw) + 2, hh)
    }
  }

  if (R.boat) {
    // Wake: broken pale dashes on two arms that widen, a darker twin under each, a short trail down the middle.
    const wake = css(P.wake)
    const shade = css(P.wDark)
    for (let m = marks.length - 1; m >= 0; m--) {
      const mk0 = marks[m]
      const fade = (1 - mk0.s / WAKE_LIFE) ** 0.9
      const hs = hash(mk0.k, R.seed)
      const hs2 = hash(mk0.k, R.seed + 91)
      const off = (5 * U + 13 * U * mk0.s) * 0.6
      const rx = (13 * U + 6 * U * mk0.s) * (0.7 + 0.6 * hs) * (0.5 + 0.5 * fade)
      const ry = 2.4 * U + 0.3 * U * mk0.s
      const rr = rng(mk0.k * 17 + R.seed)
      for (const sg of [-1, 1]) {
        const jit = (hs2 - 0.5) * 3 * U
        const ax = mk0.x + (hs - 0.5) * 6 * U
        const ay = mk0.y + sg * (off + jit) * mk0.py
        c.globalAlpha = 0.34 * fade
        dab(c, ax, ay + ry * 2.4, rx, ry * 1.1, 0, shade, rr)
        c.globalAlpha = 0.96 * fade
        if (hs > 0.14) dab(c, ax, ay, rx, ry, (hs2 - 0.5) * 0.04, wake, rr)
      }
      if (mk0.s < 2.4) {
        c.globalAlpha = 0.7 * fade
        dab(c, mk0.x - 6 * U * mk0.s, mk0.y + 2 * U, (4 + 4 * hs) * U, 1.3 * U, 0, wake, rr)
      }
    }
    c.globalAlpha = 1

    // The boat, its mirror and the oar.
    const p = ex.path(t)
    if (p) {
      const dir = ex.dir ?? 1
      const bob = Math.sin((TAU * 6 * t) / LOOP) * 0.0022 * h
      const bx = p.x * w
      const by = p.y * h + bob
      // mirror, sliced and wobbled
      const slices = 9
      const bhh = B.boat.height
      c.save()
      c.translate(bx, by)
      c.scale(dir, -0.8)
      c.globalAlpha = 0.55
      for (let i = 0; i < slices; i++) {
        const sy0 = (i * bhh) / slices
        const dxr = Math.sin(i * 1.5 + (TAU * 12 * t) / LOOP) * (1.2 + (1 - calm) * 2.4) * U
        c.drawImage(B.boat, 0, sy0, B.boat.width, bhh / slices + 1, -B.ox + dxr, -B.oy + sy0, B.boat.width, bhh / slices + 1)
      }
      c.restore()
      c.globalAlpha = 1
      // hull + oar share one transform
      c.save()
      c.translate(bx, by)
      c.rotate(Math.sin((TAU * 4 * t) / LOOP) * 0.012 * dir)
      c.scale(dir, 1)
      c.drawImage(B.boat, -B.ox, -B.oy)
      const phi = 0.78 + 0.34 * Math.sin((TAU * 4 * t) / LOOP)
      const dxo = -Math.cos(phi)
      const dyo = Math.sin(phi)
      const Lq = B.L
      const pvx = 0.03 * Lq
      const pvy = -0.085 * Lq
      const bxo = pvx + dxo * 0.5 * Lq
      const byo = pvy + dyo * 0.5 * Lq
      c.strokeStyle = css(P.oar)
      c.lineCap = "round"
      c.lineWidth = Math.max(1.4, 0.02 * Lq)
      c.beginPath()
      c.moveTo(pvx - dxo * 0.15 * Lq, pvy - dyo * 0.15 * Lq)
      c.lineTo(bxo, byo)
      c.stroke()
      c.strokeStyle = css(hx(/^#[0-9a-f]{6}$/i.test(R.coat) ? R.coat : DEFAULT_COAT))
      c.lineWidth = Math.max(2, 0.034 * Lq)
      c.beginPath()
      c.moveTo(-0.09 * Lq, -0.27 * Lq)
      c.lineTo(pvx - dxo * 0.15 * Lq, pvy - dyo * 0.15 * Lq)
      c.stroke()
      dab(c, bxo + dxo * 0.03 * Lq, byo, 0.06 * Lq, 0.017 * Lq, Math.atan2(dyo, dxo), css(mix(P.oar, P.rim, 0.25)), rng(7))
      c.restore()
      // water laps at the hull and the blade
      const lap = rng(R.seed + 3)
      c.fillStyle = css(P.wake)
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = 0.8
        dab(c, bx + dir * (-0.24 + i * 0.26) * B.L, by + 1.5 * U, (0.07 + 0.03 * lap()) * B.L, 1.3 * U, 0, css(P.wake), lap)
      }
      c.globalAlpha = 0.7
      const bladeX = bx + dir * (0.03 * B.L + dxo * 0.5 * B.L)
      dab(c, bladeX, by + 0.03 * B.L, 0.07 * B.L, 1.5 * U, 0, css(P.wake), lap)
      c.globalAlpha = 1
    }
  }

  // Rings where someone touched the water.
  if (ex.rings) {
    c.strokeStyle = css(P.wake)
    c.lineCap = "round"
    for (const r of ex.rings) {
      const u = (t - r.t0) / 2.6
      if (u < 0 || u > 1) continue
      const rr = (8 + 70 * (1 - (1 - u) ** 2)) * U
      c.globalAlpha = 0.7 * (1 - u) ** 1.5
      c.lineWidth = 1.8 * U
      c.setLineDash([rr * 0.7, rr * 0.35])
      c.beginPath()
      c.ellipse(r.x * w, r.y * h, rr, rr * 0.24, 0, 0, TAU)
      c.stroke()
    }
    c.setLineDash([])
    c.globalAlpha = 1
  }

  c.drawImage(B.fg, 0, 0)

  // Paper grain, last.
  if (R.grain > 0.01) {
    const pat = c.createPattern(B.grain, "repeat")
    if (pat) {
      c.globalCompositeOperation = "soft-light"
      c.globalAlpha = 0.85 * R.grain
      c.fillStyle = pat
      c.fillRect(0, 0, w, h)
      c.globalCompositeOperation = "source-over"
      c.globalAlpha = 1
    }
  }
}

/**
 * Paint one frame at exactly `t` seconds (0 to 24, then it repeats) into a canvas of w by h pixels.
 * Pure: the same arguments always give the same picture. Used by the Studio for stills and video.
 */
export function draw(ctx: Ctx, w: number, h: number, t: number, values: Values = {}) {
  const tt = ((t % LOOP) + LOOP) % LOOP
  paintFrame(ctx, w, h, tt, resolve(values), { path: crossingPath, dir: 1 })
}

/* -------------------------------------------------------------------------- */
/*                                The component                               */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED_QUERY)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

type Hist = { t: number; x: number; y: number }
type Sim = {
  clock: number
  mode: "demo" | "user"
  x: number; y: number; vx: number; vy: number; tx: number; ty: number; dir: number
  hist: Hist[]
  rings: Ring[]
  lastPush: number
}

const Y_MIN = 0.66
const Y_MAX = 0.92

function histPath(hist: Hist[]) {
  return (tau: number): BoatPoint | null => {
    const n = hist.length
    if (!n || tau < hist[0].t - 1e-6) return null
    if (tau >= hist[n - 1].t) return { x: hist[n - 1].x, y: hist[n - 1].y }
    let lo = 0
    let hi = n - 1
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1
      if (hist[m].t <= tau) lo = m
      else hi = m
    }
    const a = hist[lo]
    const b = hist[hi]
    const f = b.t === a.t ? 0 : (tau - a.t) / (b.t - a.t)
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
  }
}

const Arrow = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={d} /></svg>
)

export function GouacheLake(props: GouacheLakeProps) {
  const {
    speed = 1, paused = false, values, seed, size, time, canvasRef,
    palette, dabSize, density, calm, boat, timeOfDay, grain,
    label = "A painted hillside and its reflection in a lake, with a small boat leaving a wake", className, onSteer, onInteract,
  } = props
  const R = React.useMemo(
    () => resolve(values, { palette, dab: dabSize, density, calm, boat, tod: timeOfDay, grain, seed }),
    [values, palette, dabSize, density, calm, boat, timeOfDay, grain, seed],
  )
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)

  const cv = React.useRef<HTMLCanvasElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const sim = React.useRef<Sim>({ clock: 0, mode: "demo", x: 0.5, y: 0.75, vx: 0, vy: 0, tx: 0.5, ty: 0.75, dir: 1, hist: [], rings: [], lastPush: 0 })
  const live = React.useRef({ R, speed: Math.max(0.05, speed), paused, reduced, time, onSteer, onInteract })
  const api = React.useRef<{ paint: () => void; kick: () => void }>({ paint: () => {}, kick: () => {} })
  const steerRef = React.useRef<((x: number, y: number, ring: boolean) => void) | null>(null)
  const [taken, setTaken] = React.useState(false)
  const [said, setSaid] = React.useState("")

  live.current = { R, speed: Math.max(0.05, speed), paused, reduced, time, onSteer, onInteract }
  React.useEffect(() => {
    if (time == null && reduced) sim.current.clock = STILL_T
    api.current.paint()
    api.current.kick()
  }, [R, speed, paused, reduced, time, size?.w, size?.h])

  const setRefs = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cv.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  React.useEffect(() => {
    const canvas = cv.current
    const box = stage.current
    if (!canvas || !box) return
    const c = canvas.getContext("2d")
    if (!c) return
    let raf = 0
    let last = 0
    let visible = true
    let rt = 0

    const fit = () => {
      let w: number
      let h: number
      if (size) {
        w = Math.round(size.w)
        h = Math.round(size.h)
      } else {
        const r = box.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const k = Math.min(1, 2200 / Math.max(1, Math.max(r.width, r.height) * dpr))
        w = Math.max(160, Math.round(r.width * dpr * k))
        h = Math.max(160, Math.round(r.height * dpr * k))
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const takeOver = () => {
      const s = sim.current
      if (s.mode === "user") return
      s.mode = "user"
      const tt = s.clock % LOOP
      const p = crossingPath(tt)
      s.x = p ? clamp(p.x, 0.04, 0.96) : -0.17
      s.y = p ? p.y : 0.745
      s.tx = clamp(s.x, 0.06, 0.94)
      s.ty = s.y
      s.vx = p ? 1.34 / CROSS : 0
      s.vy = 0
      s.dir = 1
      s.hist = []
      if (p) for (let k = WAKE_LIFE; k >= 0; k -= 0.1) {
        const q = crossingPath(tt - k)
        if (q) s.hist.push({ t: s.clock - k, x: q.x, y: q.y })
      }
      s.hist.push({ t: s.clock, x: s.x, y: s.y })
      setTaken(true)
      live.current.onInteract?.()
    }

    const paint = () => {
      fit()
      const lv = live.current
      const s = sim.current
      const w = canvas.width
      const h = canvas.height
      let t = s.clock
      if (lv.time != null) {
        paintFrame(c, w, h, ((lv.time % LOOP) + LOOP) % LOOP, lv.R, { path: crossingPath, dir: 1 })
        return
      }
      if (s.mode === "demo") {
        t = s.clock % LOOP
        paintFrame(c, w, h, t, lv.R, { path: crossingPath, dir: 1, rings: s.rings })
      } else {
        paintFrame(c, w, h, s.clock, lv.R, { path: histPath(s.hist), dir: s.dir, rings: s.rings })
      }
    }

    const step = (dt: number) => {
      const s = sim.current
      s.clock += dt
      if (s.mode !== "user") return
      const dx = s.tx - s.x
      const dy = s.ty - s.y
      const dist = Math.hypot(dx, dy * 1.4)
      const want = dist > 0.004 ? Math.min(0.085, dist * 1.1) : 0
      const wvx = dist > 0 ? (dx / dist) * want : 0
      const wvy = dist > 0 ? ((dy * 1.4) / dist) * want * 0.7 : 0
      const a = 1 - Math.exp(-dt * 1.9)
      s.vx += (wvx - s.vx) * a
      s.vy += (wvy - s.vy) * a
      s.x += s.vx * dt
      s.y = clamp(s.y + s.vy * dt, Y_MIN, Y_MAX)
      if (Math.abs(s.vx) > 0.006) s.dir = s.vx > 0 ? 1 : -1
      if (s.clock - s.lastPush >= 0.06) {
        s.lastPush = s.clock
        s.hist.push({ t: s.clock, x: s.x, y: s.y })
        while (s.hist.length > 2 && s.hist[0].t < s.clock - WAKE_LIFE - 1.5) s.hist.shift()
      }
      s.rings = s.rings.filter((r) => s.clock - r.t0 < 2.6)
    }

    const running = () => visible && !document.hidden && !live.current.paused && !live.current.reduced && live.current.time == null
    const tick = (now: number) => {
      raf = 0
      if (!running()) return
      const dt = Math.min(0.05, (now - last) / 1000) * live.current.speed
      last = now
      step(dt)
      if (sim.current.mode === "demo") sim.current.rings = sim.current.rings.filter((r) => sim.current.clock - r.t0 < 2.6)
      paint()
      raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (raf || !running()) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    api.current = { paint, kick }

    // Steering: a tap or drag on the water sets where the boat heads; arrows nudge it.
    const target = (x: number, y: number, ring: boolean) => {
      takeOver()
      const s = sim.current
      s.tx = clamp(x, 0.06, 0.94)
      s.ty = clamp(y, Y_MIN, Y_MAX)
      if (ring) s.rings.push({ x, y: clamp(y, SHORE + 0.03, 0.97), t0: s.clock })
      live.current.onSteer?.(s.tx)
      if (!running()) {
        s.x = s.tx
        s.y = s.ty
        s.vx = 0
        s.vy = 0
        s.hist.push({ t: s.clock, x: s.x, y: s.y })
        paint()
      } else kick()
      setSaid(s.tx < 0.36 ? "Boat heading to the left bank" : s.tx > 0.64 ? "Boat heading to the right bank" : "Boat heading to the middle of the lake")
    }
    steerRef.current = target

    let dragging = false
    const frac = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
    }
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".gq-ctl")) return
      dragging = true
      canvas.setPointerCapture?.(e.pointerId)
      const f = frac(e)
      target(f.x, f.y, true)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const f = frac(e)
      target(f.x, f.y, false)
    }
    const up = () => { dragging = false }
    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointercancel", up)

    const io = new IntersectionObserver((es) => {
      visible = es[es.length - 1].isIntersecting
      if (visible) kick()
    }, { threshold: 0.01 })
    io.observe(box)
    const onVis = () => { if (!document.hidden) kick() }
    document.addEventListener("visibilitychange", onVis)
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt)
      rt = window.setTimeout(() => { paint(); kick() }, 120)
    })
    ro.observe(box)

    if (live.current.time == null && live.current.reduced) sim.current.clock = STILL_T
    paint()
    kick()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(rt)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size?.w, size?.h])

  const steer = (dx: number, dy = 0) => {
    const s = sim.current
    const go = steerRef.current
    if (!go) return
    const bx = s.mode === "user" ? s.tx : clamp((crossingPath(s.clock % LOOP)?.x ?? 0.5), 0.1, 0.9)
    const by = s.mode === "user" ? s.ty : 0.75
    go(bx + dx, by + dy, false)
  }
  const replay = () => {
    const s = sim.current
    s.mode = "demo"
    s.clock = 0
    s.rings = []
    setTaken(false)
    setSaid("")
    api.current.paint()
    api.current.kick()
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); steer(-0.14) }
    else if (e.key === "ArrowRight") { e.preventDefault(); steer(0.14) }
    else if (e.key === "ArrowUp") { e.preventDefault(); steer(0, -0.05) }
    else if (e.key === "ArrowDown") { e.preventDefault(); steer(0, 0.05) }
    else if ((e.key === "Escape" || e.key === "r") && taken) { e.preventDefault(); replay() }
  }

  return (
    <div className={["gq", className].filter(Boolean).join(" ")}>
      <style href="gouache-lake" precedence="default">{CSS}</style>
      <div
        ref={stage}
        className="gq-stage"
        role="group"
        aria-label={`${label}. Use the arrow keys, or tap the water, to steer the boat.`}
        tabIndex={0}
        onKeyDown={onKey}
        style={size ? { aspectRatio: `${size.w} / ${size.h}` } : undefined}
      >
        <canvas ref={setRefs} className="gq-cv" aria-hidden="true" />
        <div className="gq-ctl">
          <button type="button" className="gq-btn" aria-label="Row left" onClick={() => steer(-0.14)}>
            <Arrow d="M10 3 5 8l5 5" />
          </button>
          <button type="button" className="gq-btn" aria-label="Row right" onClick={() => steer(0.14)}>
            <Arrow d="m6 3 5 5-5 5" />
          </button>
          <button type="button" className="gq-btn" aria-label="Replay the crossing" hidden={!taken} onClick={replay}>
            <Arrow d="M3 8a5 5 0 1 0 1.8-3.8M3 2.5v3h3" />
          </button>
        </div>
        <span className="gq-sr" role="status" aria-live="polite">{said}</span>
      </div>
    </div>
  )
}

export default GouacheLake
