"use client"

import * as React from "react"
import { rng, type StudioPieceProps, type Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GreenhouseLight = "afternoon" | "morning" | "dusk"

export type PencilGreenhouseProps = StudioPieceProps & {
  /** The light: afternoon (gold after rain), morning (cool mist) or dusk (coral and indigo). */
  palette?: GreenhouseLight
  /** How many marks the drawing gets. 1 is the designed density. */
  density?: number
  /** How much the paper's tooth breaks up the marks, 0 to 1. */
  tooth?: number
  /** Strength of the light falling through the roof, 0 to 1. */
  shafts?: number
  /** Rain on the glass and water on the floor, 0 to 1. */
  wet?: number
  /** Accessible description of the drawing. */
  label?: string
  className?: string
}

type RGB = [number, number, number]
type Pt = [number, number]
type Rand = () => number
type Ctx = CanvasRenderingContext2D
type Cvs = HTMLCanvasElement | OffscreenCanvas

type Pal = {
  paper: RGB
  sky: [RGB, RGB]
  cloud: RGB
  outside: RGB[]
  mist: RGB
  frame: RGB
  frameShade: RGB
  wood: RGB
  woodShade: RGB
  brick: RGB
  tileA: RGB
  tileB: RGB
  grout: RGB
  leaf: RGB[]
  cool: RGB[]
  pot: RGB[]
  can: RGB[]
  bloom: RGB[]
  lemon: RGB
  sun: RGB
  shade: RGB
  conte: RGB
  chalk: RGB
  under: RGB
  sunDir: [number, number, number]
}

const hx = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const set = (...s: string[]) => s.map(hx)

const PALETTES: Record<GreenhouseLight, Pal> = {
  afternoon: {
    paper: hx("#f4efe3"),
    sky: [hx("#5f9fd0"), hx("#f6d6b6")],
    cloud: hx("#fff7ea"),
    outside: set("#4f8282", "#6f9f86", "#a8c597", "#e3e6c4"),
    mist: hx("#eef0e4"),
    frame: hx("#efe7d4"),
    frameShade: hx("#7d8ba3"),
    wood: hx("#a88a66"),
    woodShade: hx("#4d4248"),
    brick: hx("#93493a"),
    tileA: hx("#c1613f"),
    tileB: hx("#d8ab78"),
    grout: hx("#5a3f3c"),
    leaf: set("#123a3e", "#1f5a4c", "#3c8150", "#86b552", "#dfe48e"),
    cool: set("#173f55", "#2f747b", "#8cc3ae"),
    pot: set("#83392b", "#c86a43", "#f0a774"),
    can: set("#7f2626", "#d8513c", "#f8a07c"),
    bloom: set("#ec5d4b", "#f1879a", "#f6c6d0", "#ffcf5c"),
    lemon: hx("#f3c83a"),
    sun: hx("#ffd9a1"),
    shade: hx("#273e5e"),
    conte: hx("#3a2526"),
    chalk: hx("#fffaf0"),
    under: hx("#2a2f45"),
    sunDir: [-0.62, -0.72, -0.34],
  },
  morning: {
    paper: hx("#f2f0e8"),
    sky: [hx("#8cc4dc"), hx("#eef2df")],
    cloud: hx("#ffffff"),
    outside: set("#5f8f9a", "#7fae9f", "#b6d6c2", "#e6f0e6"),
    mist: hx("#f4f7f2"),
    frame: hx("#f2efe4"),
    frameShade: hx("#8193ad"),
    wood: hx("#a08c74"),
    woodShade: hx("#454555"),
    brick: hx("#8c5248"),
    tileA: hx("#b8664b"),
    tileB: hx("#d4b892"),
    grout: hx("#5a4a4e"),
    leaf: set("#133844", "#1f5a54", "#3a815c", "#86ba68", "#dbeb9c"),
    cool: set("#1b4060", "#357b86", "#9ccbbd"),
    pot: set("#86443a", "#c47450", "#efb08a"),
    can: set("#7f2a2c", "#d65a45", "#f7a587"),
    bloom: set("#e8664f", "#ee90a6", "#f7d0dc", "#ffe07a"),
    lemon: hx("#f4d24a"),
    sun: hx("#fff0c2"),
    shade: hx("#33467a"),
    conte: hx("#32283a"),
    chalk: hx("#ffffff"),
    under: hx("#2b3452"),
    sunDir: [0.6, -0.74, -0.3],
  },
  dusk: {
    paper: hx("#f1ebe2"),
    sky: [hx("#6c67a8"), hx("#f3a98a")],
    cloud: hx("#fbd3bd"),
    outside: set("#384a6e", "#53658c", "#9a8eb4", "#f0b99c"),
    mist: hx("#e9e2ea"),
    frame: hx("#eadfd4"),
    frameShade: hx("#5d5f8e"),
    wood: hx("#9a7a68"),
    woodShade: hx("#3a3046"),
    brick: hx("#874036"),
    tileA: hx("#b5543c"),
    tileB: hx("#cf9a78"),
    grout: hx("#4c3442"),
    leaf: set("#141f3c", "#1f404c", "#365f52", "#6f9256", "#b8b66c"),
    cool: set("#1a2a52", "#2f5a77", "#9fa9c4"),
    pot: set("#7a3030", "#bd5e40", "#f39a6e"),
    can: set("#6e2030", "#d14a40", "#ff9b78"),
    bloom: set("#f0644e", "#f08aa8", "#f8c8d6", "#ffc75c"),
    lemon: hx("#f5bf3c"),
    sun: hx("#ffa978"),
    shade: hx("#2a2756"),
    conte: hx("#2c1f33"),
    chalk: hx("#fff3e6"),
    under: hx("#241f42"),
    sunDir: [-0.78, -0.44, -0.34],
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pgh {
  --pgh-ink: #000;
  --pgh-accent: #0060e2;
  --pgh-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 18px 40px -14px rgb(40 50 40 / .22);
  --pgh-radius: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 1000px;
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .pgh {
  --pgh-ink: #fff; --pgh-accent: #4d8dff;
  --pgh-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 18px 40px -14px rgb(0 0 0 / .55);
}
html[data-style="mono"] .pgh { --pgh-radius: 4px; --pgh-accent: #111; --pgh-shadow: 0 0 0 1px rgb(0 0 0 / .16) }
html[data-style="mono"].dark .pgh { --pgh-accent: #f2f2f2; --pgh-shadow: 0 0 0 1px rgb(255 255 255 / .18) }
html[data-style="mono"] .pgh-cv { filter: grayscale(.82) contrast(1.08) }
html[data-style="glass"] .pgh { --pgh-ink: var(--pane-ink); --pgh-accent: var(--pane-accent); --pgh-radius: 26px; --pgh-shadow: var(--pane-shadow) }
html[data-style="glass"] .pgh-stage { box-shadow: var(--pane-card) }
.pgh *, .pgh *::before, .pgh *::after { box-sizing: border-box }
.pgh-stage { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--pgh-radius); overflow: hidden; background: #f4efe3; box-shadow: var(--pgh-shadow); isolation: isolate }
.pgh-stage:focus-visible { outline: 2px solid var(--pgh-accent); outline-offset: 3px }
@container (max-width: 520px) { .pgh-stage { aspect-ratio: 4 / 5 } }
.pgh-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
`

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

const LOOP = 30 // seconds in one seamless loop of the live layer
const STILL_T = 7.5 // the frame shown for reduced motion
const TAU = Math.PI * 2

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rr = (r: Rand, a: number, b: number) => a + (b - a) * r()
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

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

function h2(x: number, y: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}
/** Smooth value noise, 0..1. */
function vn(x: number, y: number, s: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = h2(xi, yi, s)
  const b = h2(xi + 1, yi, s)
  const c = h2(xi, yi + 1, s)
  const d = h2(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const css = (c: RGB, a = 1) => {
  const f = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
  return a >= 1 ? `rgb(${f(c[0])},${f(c[1])},${f(c[2])})` : `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a.toFixed(3)})`
}
const ramp = (cs: RGB[], v: number): RGB => {
  const t = clamp(v, 0, 1) * (cs.length - 1)
  const i = Math.min(cs.length - 2, Math.floor(t))
  return mix(cs[i], cs[i + 1], t - i)
}
const WHITE: RGB = [255, 253, 246]

function pointIn(poly: Pt[], x: number, y: number) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function hull(ps: Pt[]): Pt[] {
  const p = ps.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: Pt[] = []
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop()
    lo.push(q)
  }
  const up: Pt[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop()
    up.push(q)
  }
  up.pop()
  lo.pop()
  return lo.concat(up)
}

/* -------------------------------------------------------------------------- */
/*                          Camera and the greenhouse                         */
/* -------------------------------------------------------------------------- */

// The picture is a one-point perspective down the central aisle, in metres. World units: the 16:9 frame is
// x in [-0.889, 0.889], y in [0, 1] (y down). Other sizes see more or less of the same room.
// The eye is at a six-year-old's height, so the benches are walls of leaves and everything towers.
const F = 0.56
const VX = -0.04
const VY = 0.56
const CX = 0.08
const CY = 1.15
const GW = 1.9 // half width of the house
const HE = 2.2 // eaves
const HR = 3.2 // ridge
const ZB = 6.5 // back wall
const HB = 0.95 // bench top, just under the eye
const AW = 0.7 // half width of the aisle
const ZN = 0.3 // nearest thing drawn

const P = (X: number, Y: number, Z: number): Pt => [VX + ((X - CX) * F) / Z, VY - ((Y - CY) * F) / Z]
const scl = (Z: number) => F / Z
const depOf = (Z: number) => clamp(Math.round(255 * (1 - (Z - 0.8) / 7.6)), 2, 255)
const yFloor = (Z: number) => VY + (CY * F) / Z
const RAFTERS = Array.from({ length: 10 }, (_, i) => 1 + i * 0.55).concat([ZB])

/* -------------------------------------------------------------------------- */
/*                           Resolve props and values                         */
/* -------------------------------------------------------------------------- */

type Resolved = { palette: GreenhouseLight; density: number; tooth: number; shafts: number; wet: number; seed: number }

function resolve(v: Values | undefined, fb: Partial<Resolved> = {}): Resolved {
  const p = (v?.palette ?? fb.palette) as string | undefined
  return {
    palette: p === "morning" || p === "dusk" || p === "afternoon" ? p : "afternoon",
    density: clamp(num(v?.density ?? fb.density, 1), 0.5, 1.6),
    tooth: clamp(num(v?.tooth ?? fb.tooth, 0.55), 0, 1),
    shafts: clamp(num(v?.shafts ?? fb.shafts, 0.7), 0, 1),
    wet: clamp(num(v?.wet ?? fb.wet, 0.6), 0, 1),
    seed: Math.round(num(v?.seed ?? fb.seed, 11)),
  }
}

/* -------------------------------------------------------------------------- */
/*                 The reference: an invisible map the marks read             */
/* -------------------------------------------------------------------------- */

// The scene is first laid out as four hidden maps at half size: colour, hatch direction (doubled-angle vector) plus
// softness, highlights, and depth. Nothing of them is shown; every visible pixel is a mark that reads them.

type Shaft = { hull: Pt[]; top: Pt; bot: Pt; foot: Pt[]; a: number }

type Job = (L: Ctx, B: Bake) => void

type Builder = {
  col: Ctx
  att: Ctx
  hi: Ctx
  dep: Ctx
  colC: Cvs
  P: Pal
  R: Resolved
  pencil: Job[]
  conte: Job[]
  chalk: Job[]
  pastel: Job[]
  shafts: Shaft[]
  light: number // +1: light comes from the right, -1: from the left
}

const attCss = (a: number, soft: number) =>
  `rgb(${Math.round(128 + 127 * Math.cos(2 * a))},${Math.round(128 + 127 * Math.sin(2 * a))},${Math.round(clamp(soft, 0, 1) * 255)})`

function poly(pts: Pt[]) {
  const p = new Path2D()
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
  p.closePath()
  return p
}

function region(b: Builder, path: Path2D, fill: string | CanvasGradient, ang: number, soft: number, dep: number, rule: CanvasFillRule = "nonzero") {
  b.col.fillStyle = fill
  b.col.fill(path, rule)
  b.att.fillStyle = attCss(ang, soft)
  b.att.fill(path, rule)
  b.dep.fillStyle = `rgb(${dep},0,0)`
  b.dep.fill(path, rule)
}
function tint(b: Builder, path: Path2D, fill: string | CanvasGradient) {
  b.col.fillStyle = fill
  b.col.fill(path)
}
function glow(b: Builder, path: Path2D, a: number) {
  b.hi.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
  b.hi.fill(path)
}
const lineAng = (a: Pt, c: Pt) => Math.atan2(c[1] - a[1], c[0] - a[0])

/* -------------------------------------------------------------------------- */
/*                               Mark primitives                              */
/* -------------------------------------------------------------------------- */

type Bake = {
  w: number; h: number; S: number; oy: number
  DW: number; DH: number
  cx0: number; cy0: number; dsx: number; dsy: number; ds: number; q: number; lod: number
  vx0: number; vx1: number; vy0: number; vy1: number
  R: Resolved; P: Pal; box: RGB[]
  ref: Ref
  final: Cvs; scratch: Cvs; shaftL: Cvs; paperC: Cvs; fine: Cvs; deep: Cvs
  b: Builder
  live: Live
  gen: Generator<void, void, void> | null
  done: boolean
  stage: number
}

type Ref = { W: number; H: number; ox: number; oy: number; k: number; col: Uint8ClampedArray; att: Uint8ClampedArray; hi: Uint8ClampedArray; dep: Uint8ClampedArray }

type Smp = { r: number; g: number; b: number; ang: number; soft: number; hi: number; dep: number; lum: number; ink: number }
const SM: Smp = { r: 0, g: 0, b: 0, ang: 0, soft: 0, hi: 0, dep: 0, lum: 0, ink: 0 }

function refAt(f: Ref, x: number, y: number) {
  const i = Math.floor(f.ox + x * f.k)
  const j = Math.floor(f.oy + y * f.k)
  if (i < 0 || j < 0 || i >= f.W || j >= f.H) return -1
  return (j * f.W + i) * 4
}

function sample(B: Bake, x: number, y: number, out: Smp) {
  const f = B.ref
  const i = refAt(f, x, y)
  if (i < 0) return false
  out.r = f.col[i]
  out.g = f.col[i + 1]
  out.b = f.col[i + 2]
  out.ang = 0.5 * Math.atan2(f.att[i + 1] - 128, f.att[i] - 128)
  out.soft = f.att[i + 2] / 255
  out.hi = f.hi[i] / 255
  out.dep = f.dep[i]
  out.lum = (0.3 * out.r + 0.59 * out.g + 0.11 * out.b) / 255
  const p = B.P.paper
  out.ink = clamp(Math.max((p[0] - out.r) / p[0], (p[1] - out.g) / p[1], (p[2] - out.b) / p[2]), 0, 1)
  return true
}
const depAtDev = (B: Bake, X: number, Y: number) => {
  const i = refAt(B.ref, (X - B.cx0) / B.dsx, (Y - B.cy0) / B.dsy)
  return i < 0 ? 0 : B.ref.dep[i]
}

/** A coloured-pencil box: every palette colour plus a shaded and a paler version of it. */
function pencilBox(P: Pal): RGB[] {
  const base: RGB[] = [
    ...P.sky, P.cloud, ...P.outside, P.mist, P.frame, P.frameShade, P.wood, P.woodShade, P.brick, P.tileA, P.tileB, P.grout,
    ...P.leaf, ...P.cool, ...P.pot, ...P.can, ...P.bloom, P.lemon, P.sun, P.shade, P.under,
  ]
  const out: RGB[] = []
  for (const c of base) out.push(c, mix(c, P.shade, 0.42), mix(c, WHITE, 0.38))
  // the odd bright pencils every box has: cerulean, ultramarine, turquoise, peach, coral, lilac, lemon, leaf
  for (const e of ["#4f93d2", "#3a62b0", "#2ba39a", "#f5a985", "#e8705a", "#ac98d6", "#ffe08a", "#94c95e", "#7fc8e8"]) out.push(hx(e))
  return out
}
/** Pick one of the two nearest pencils, weighted, so layered strokes mix optically instead of blending. */
function pick(box: RGB[], r0: number, g0: number, b0: number, r: Rand): RGB {
  let i1 = 0
  let i2 = 0
  let d1 = 1e9
  let d2 = 1e9
  for (let i = 0; i < box.length; i++) {
    const c = box[i]
    const dr = c[0] - r0
    const dg = c[1] - g0
    const db = c[2] - b0
    const d = dr * dr * 0.8 + dg * dg + db * db * 0.7
    if (d < d1) {
      d2 = d1
      i2 = i1
      d1 = d
      i1 = i
    } else if (d < d2) {
      d2 = d
      i2 = i
    }
  }
  const s1 = Math.sqrt(d1)
  const s2 = Math.sqrt(d2)
  return r() < s2 / (s1 + s2 + 1e-6) ? box[i1] : box[i2]
}

/** One pencil mark: a lens that is thin, thick, thin, heaviest a little after it starts. Device px. */
function lens(L: Ctx, X: number, Y: number, ux: number, uy: number, a: number, b: number, hw: number, bend: number) {
  const nx = -uy
  const ny = ux
  const x0 = X - ux * a
  const y0 = Y - uy * a
  const x1 = X + ux * b
  const y1 = Y + uy * b
  const m = (b - a) * 0.5 - (a + b) * 0.14
  const mx = X + ux * m
  const my = Y + uy * m
  L.moveTo(x0, y0)
  L.quadraticCurveTo(mx + nx * (2 * hw + bend), my + ny * (2 * hw + bend), x1, y1)
  L.quadraticCurveTo(mx - nx * (2 * hw - bend), my - ny * (2 * hw - bend), x0, y0)
}

/** A conté stick mark: square-ended, a little skewed. */
function stick(L: Ctx, X: number, Y: number, ux: number, uy: number, a: number, b: number, hw: number) {
  const nx = -uy
  const ny = ux
  L.moveTo(X - ux * a + nx * hw * 0.7, Y - uy * a + ny * hw * 0.7)
  L.lineTo(X + ux * b + nx * hw, Y + uy * b + ny * hw)
  L.lineTo(X + ux * b * 0.92 - nx * hw * 0.8, Y + uy * b * 0.92 - ny * hw * 0.8)
  L.lineTo(X - ux * a - nx * hw, Y - uy * a - ny * hw)
  L.closePath()
}

type SK = { w: number; col: RGB; a: number; dep?: number; brk?: number; passes?: number; wob?: number; over?: number; taper?: number }

/** A hand-drawn line through world points: resampled, wobbled, broken, tapered, drawn twice. Hidden parts skipped. */
function sketch(L: Ctx, B: Bake, pts: Pt[], o: SK, r: Rand) {
  if (pts.length < 2) return
  const q = B.q
  const xs: number[] = []
  const ys: number[] = []
  const step = 2.2 * q
  let px = B.cx0 + pts[0][0] * B.dsx
  let py = B.cy0 + pts[0][1] * B.dsy
  xs.push(px)
  ys.push(py)
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const nx = B.cx0 + pts[i][0] * B.dsx
    const ny = B.cy0 + pts[i][1] * B.dsy
    const dx = nx - px
    const dy = ny - py
    const d = Math.hypot(dx, dy)
    let s = step - carry
    while (s <= d) {
      xs.push(px + (dx * s) / d)
      ys.push(py + (dy * s) / d)
      s += step
    }
    carry = d - (s - step)
    px = nx
    py = ny
  }
  xs.push(px)
  ys.push(py)
  const n = xs.length
  if (n < 2) return
  const total = (n - 1) * step
  if (total < 1.5 * q) return
  // overshoot past both ends a little, like a quick hand
  const over = o.over ?? 0.04
  const e0 = Math.min(10 * q, total * over * r())
  const e1 = Math.min(10 * q, total * over * r())
  const t0x = xs[1] - xs[0]
  const t0y = ys[1] - ys[0]
  const t0 = Math.hypot(t0x, t0y) || 1
  const t1x = xs[n - 1] - xs[n - 2]
  const t1y = ys[n - 1] - ys[n - 2]
  const t1 = Math.hypot(t1x, t1y) || 1
  xs.unshift(xs[0] - (t0x / t0) * e0)
  ys.unshift(ys[0] - (t0y / t0) * e0)
  xs.push(xs[xs.length - 1] + (t1x / t1) * e1)
  ys.push(ys[ys.length - 1] + (t1y / t1) * e1)
  const N = xs.length
  const vis: boolean[] = new Array(N)
  for (let i = 0; i < N; i++) vis[i] = o.dep == null || depAtDev(B, xs[i], ys[i]) <= o.dep + 4
  const passes = o.passes ?? 2
  const wob = (o.wob ?? 0.7) * q
  const brk = o.brk ?? 0.06
  const taper = o.taper ?? 0.18
  for (let pass = 0; pass < passes; pass++) {
    const off = pass ? (r() - 0.5) * 1.6 * q : 0
    const sd = Math.floor(r() * 1e5)
    const ax: number[] = []
    const ay: number[] = []
    const aw: number[] = []
    const flush = () => {
      if (ax.length >= 2) ribbon(L, ax, ay, aw)
      ax.length = 0
      ay.length = 0
      aw.length = 0
    }
    L.beginPath()
    for (let i = 0; i < N; i++) {
      const j0 = Math.max(0, i - 1)
      const j1 = Math.min(N - 1, i + 1)
      let tx = xs[j1] - xs[j0]
      let ty = ys[j1] - ys[j0]
      const tl = Math.hypot(tx, ty) || 1
      tx /= tl
      ty /= tl
      const u = i / (N - 1)
      const wv = (vn(i * 0.06, 0.5, sd) - 0.5) * 2 * wob + off
      const X = xs[i] - ty * wv
      const Y = ys[i] + tx * wv
      const tp = Math.min(1, u / taper, (1 - u) / taper)
      const press = 0.55 + 0.75 * vn(i * 0.09, 3.5, sd + 7)
      const hw = Math.max(0.25 * q, o.w * q * (0.25 + 0.75 * Math.sqrt(Math.max(0, tp))) * press)
      if (!vis[i] || r() < brk * 0.12) {
        flush()
        continue
      }
      ax.push(X)
      ay.push(Y)
      aw.push(hw)
    }
    flush()
    L.fillStyle = css(o.col, o.a * (pass ? 0.55 : 1))
    L.fill()
  }
}

function ribbon(L: Ctx, xs: number[], ys: number[], ws: number[]) {
  const n = xs.length
  const lx: number[] = []
  const ly: number[] = []
  const qx: number[] = []
  const qy: number[] = []
  for (let i = 0; i < n; i++) {
    const j0 = Math.max(0, i - 1)
    const j1 = Math.min(n - 1, i + 1)
    let tx = xs[j1] - xs[j0]
    let ty = ys[j1] - ys[j0]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const w = ws[i]
    lx.push(xs[i] - ty * w)
    ly.push(ys[i] + tx * w)
    qx.push(xs[i] + ty * w)
    qy.push(ys[i] - tx * w)
  }
  L.moveTo(lx[0], ly[0])
  for (let i = 1; i < n; i++) L.lineTo(lx[i], ly[i])
  for (let i = n - 1; i >= 0; i--) L.lineTo(qx[i], qy[i])
  L.closePath()
}

/** A world point to device px. */
const dX = (B: Bake, x: number) => B.cx0 + x * B.dsx
const dY = (B: Bake, y: number) => B.cy0 + y * B.dsy

/** A small leaf filled the way a hand fills it: a few parallel pencil strokes inside a lens, not one solid shape. */
function hatchedLeaf(L: Ctx, B: Bake, x: number, y: number, ang: number, len: number, hw: number, col: RGB, a: number, r: Rand) {
  const q = B.q
  const X = dX(B, x)
  const Y = dY(B, y)
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  const n = Math.max(2, Math.min(5, Math.round(hw / 0.9)))
  L.beginPath()
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1
    const off = t * hw * 0.75 * q
    const l = len * 0.5 * q * Math.sqrt(1 - t * t * 0.7) * rr(r, 0.85, 1.1)
    lens(L, X - uy * off, Y + ux * off, ux, uy, l, l * rr(r, 0.8, 1), Math.max(0.5, (hw / n) * 1.45) * q, (r() - 0.5) * 0.6 * q)
  }
  L.fillStyle = css(col, a)
  L.fill()
}

/** Single lens mark at a world point, size in design px. */
function mark(L: Ctx, B: Bake, x: number, y: number, ang: number, len: number, hw: number, col: RGB, a: number, r: Rand) {
  const q = B.q
  L.beginPath()
  lens(L, dX(B, x), dY(B, y), Math.cos(ang), Math.sin(ang), len * q * 0.5, len * q * 0.5, hw * q, (r() - 0.5) * hw * q)
  L.fillStyle = css(col, a)
  L.fill()
}

/* -------------------------------------------------------------------------- */
/*                               Building the room                            */
/* -------------------------------------------------------------------------- */

function quad3(a: [number, number, number], b: [number, number, number], off: [number, number, number]): Pt[] {
  return [
    P(a[0] + off[0], a[1] + off[1], a[2] + off[2]),
    P(b[0] + off[0], b[1] + off[1], b[2] + off[2]),
    P(b[0] - off[0], b[1] - off[1], b[2] - off[2]),
    P(a[0] - off[0], a[1] - off[1], a[2] - off[2]),
  ]
}

type V3 = [number, number, number]

/** A glazing bar, painted white: drawn into the maps and given two pencil edges, a conté shadow side and a chalk lit side. */
function bar(b: Builder, a: V3, c: V3, off: V3, Z: number, lit: number, r: Rand) {
  const qd = quad3(a, c, off)
  const pth = poly(qd)
  const ang = lineAng(P(...a), P(...c))
  const P0 = b.P
  const colr = mix(P0.frame, P0.frameShade, clamp(0.55 - lit * 0.5, 0, 0.85))
  const dp = depOf(Z) + 1
  region(b, pth, css(colr), ang, 0.1, dp)
  const e1: Pt[] = [qd[0], qd[1]]
  const e2: Pt[] = [qd[3], qd[2]]
  const near = scl(Z) > 0.12
  const seed = Math.floor(r() * 1e6)
  b.pencil.push((L, B) => {
    const r2 = rng(seed)
    sketch(L, B, e1, { w: 0.55, col: mix(P0.frameShade, P0.shade, 0.3), a: 0.6, dep: dp, brk: 0.4, over: 0.01 }, r2)
    sketch(L, B, e2, { w: 0.6, col: mix(P0.frameShade, P0.shade, 0.5), a: 0.7, dep: dp, brk: 0.4, over: 0.01 }, r2)
  })
  if (near) {
    b.chalk.push((L, B) => {
      const r2 = rng(seed + 1)
      sketch(L, B, lit > 0 ? e1 : e2, { w: 0.9, col: P0.chalk, a: 0.5 + 0.3 * Math.abs(lit), dep: dp, brk: 0.8, passes: 1, over: 0 }, r2)
    })
  }
}

function buildRoom(b: Builder, r: Rand, view: { x0: number; x1: number; y0: number; y1: number }) {
  const { P: C, R } = b
  const { col } = b
  const X0 = view.x0 - 0.05
  const X1 = view.x1 + 0.05
  const Y0 = view.y0 - 0.05
  const Y1 = view.y1 + 0.05
  const all = poly([[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]])

  /* ---- sky seen through the roof ---- */
  const g = col.createLinearGradient(0, -0.25, 0, 0.45)
  g.addColorStop(0, css(C.sky[0]))
  g.addColorStop(1, css(C.sky[1]))
  region(b, all, g, -0.95, 0.9, 0)
  // clouds left over from the rain: lumpy tops, flat shaded bellies
  for (let i = 0; i < 6; i++) {
    const cx = rr(r, -1, 1)
    const cy = rr(r, -0.22, 0.22)
    const cw = rr(r, 0.12, 0.3)
    const puffs = new Path2D()
    for (let k = 0; k < 9; k++) {
      const t = k / 8
      const px = cx + (t - 0.5) * cw * 2
      const pr = cw * (0.25 + 0.3 * Math.sin(Math.PI * t)) * rr(r, 0.8, 1.2)
      puffs.moveTo(px + pr, cy)
      puffs.arc(px, cy - pr * 0.35, pr, 0, TAU)
    }
    col.save()
    col.beginPath()
    col.rect(cx - cw * 2, cy - cw * 2, cw * 4, cw * 2 + 0.002)
    col.clip()
    col.fillStyle = css(C.cloud, 0.95)
    col.fill(puffs)
    col.restore()
    const belly = col.createLinearGradient(0, cy - cw * 0.25, 0, cy)
    belly.addColorStop(0, css(mix(C.cloud, C.shade, 0.22), 0))
    belly.addColorStop(1, css(mix(C.cloud, C.shade, 0.22), 0.85))
    col.save()
    col.beginPath()
    col.rect(cx - cw * 2, cy - cw * 2, cw * 4, cw * 2 + 0.002)
    col.clip()
    col.fillStyle = belly
    col.fill(puffs)
    col.restore()
  }

  /* ---- the garden beyond the back wall: bright, hazy ---- */
  const back: Pt[] = [P(-GW, 0, ZB), P(-GW, HE, ZB), P(0, HR, ZB), P(GW, HE, ZB), P(GW, 0, ZB)]
  const bp = poly(back)
  const yb0 = P(0, HR, ZB)[1]
  const yb1 = P(0, 0, ZB)[1]
  const gb = col.createLinearGradient(0, yb0, 0, yb1)
  gb.addColorStop(0, css(mix(C.sky[1], C.sun, 0.25)))
  gb.addColorStop(0.45, css(mix(C.outside[3], C.sun, 0.35)))
  gb.addColorStop(0.7, css(mix(C.outside[2], C.sun, 0.2)))
  gb.addColorStop(1, css(mix(C.outside[2], C.outside[3], 0.4)))
  region(b, bp, gb, 1.45, 0.95, 3)
  col.save()
  col.clip(bp)
  for (let i = 0; i < 26; i++) {
    const [x, y] = P(rr(r, -GW, GW), rr(r, 0.6, 1.8), ZB + 6)
    const s = rr(r, 0.012, 0.03)
    col.fillStyle = css(mix(C.outside[i % 2], C.outside[3], 0.35), 0.55)
    col.beginPath()
    col.ellipse(x, y + 0.015, s * 1.5, s, 0, 0, TAU)
    col.fill()
  }
  col.restore()
  glow(b, bp, 0.18)

  /* ---- side walls: the garden through wet glass, misted low down ---- */
  for (const s of [-1, 1]) {
    const wall: Pt[] = [P(s * GW, HB, ZN), P(s * GW, HE, ZN), P(s * GW, HE, ZB), P(s * GW, HB, ZB)]
    const wp = poly(wall)
    const gw = col.createLinearGradient(0, P(s * GW, HE, 2.2)[1], 0, P(s * GW, HB, 2.2)[1])
    gw.addColorStop(0, css(mix(C.sky[1], C.outside[3], 0.3)))
    gw.addColorStop(0.5, css(C.outside[2]))
    gw.addColorStop(1, css(C.outside[1]))
    region(b, wp, gw, Math.PI / 2 + s * 0.12, 0.75, depOf(3))
    col.save()
    col.clip(wp)
    for (let i = 0; i < 70; i++) {
      const Z = rr(r, ZN, ZB)
      const Y = rr(r, HB - 0.2, HB + 1.05)
      const [x, y] = P(s * (GW + 1.5), Y, Z + 1.2)
      const rad = rr(r, 0.25, 0.6) * scl(Z + 1.2)
      col.fillStyle = css(mix(C.outside[Math.floor(r() * 3)], C.mist, 0.15), 0.5)
      col.beginPath()
      col.ellipse(x, y, rad * 0.8, rad, 0, 0, TAU)
      col.fill()
    }
    col.restore()
    // per bay: mist, a cleared streak, a few rain tracks
    for (let k = 0; k < RAFTERS.length; k++) {
      const za = k === 0 ? ZN : RAFTERS[k - 1]
      const zb = RAFTERS[k]
      const pane = poly([P(s * GW, HB, za), P(s * GW, HE, za), P(s * GW, HE, zb), P(s * GW, HB, zb)])
      const zm = (za + zb) / 2
      const m = rr(r, 0.35, 0.8) * (0.5 + 0.5 * R.wet)
      const gm = col.createLinearGradient(0, P(s * GW, HB, zm)[1], 0, P(s * GW, 1.85, zm)[1])
      gm.addColorStop(0, css(C.mist, m))
      gm.addColorStop(1, css(C.mist, 0))
      tint(b, pane, gm)
      b.att.fillStyle = attCss(Math.PI / 2 + s * rr(r, 0.05, 0.25), 0.7)
      b.att.fill(pane)
      b.dep.fillStyle = `rgb(${depOf(zm)},0,0)`
      b.dep.fill(pane)
    }
  }

  /* ---- roof glass: one pane at a time, each with its own hatch direction and a green overlap line ---- */
  const slopeQ = (side: number, s: number, Z: number): V3 => [side * GW * (1 - s), HE + (HR - HE) * s, Z]
  const bands = [0, 0.36, 0.7, 1]
  for (let k = 0; k < RAFTERS.length; k++) {
    const za = k === 0 ? ZN : RAFTERS[k - 1]
    const zb = RAFTERS[k]
    const zm = (za + zb) / 2
    for (const side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const a = slopeQ(side, bands[j], za)
        const c = slopeQ(side, bands[j + 1], za)
        const d = slopeQ(side, bands[j + 1], zb)
        const e = slopeQ(side, bands[j], zb)
        const pts = [P(...a), P(...c), P(...d), P(...e)]
        const pth = poly(pts)
        const ang = lineAng(P(...slopeQ(side, bands[j], zm)), P(...slopeQ(side, bands[j + 1], zm))) + rr(r, -0.2, 0.2)
        const v = r()
        b.att.fillStyle = attCss(ang, 0.8)
        b.att.fill(pth)
        b.dep.fillStyle = `rgb(${depOf(zm)},0,0)`
        b.dep.fill(pth)
        tint(b, pth, v < 0.18 ? css(C.outside[1], 0.22) : v < 0.5 ? css(C.sky[0], 0.22 + 0.15 * r()) : v < 0.72 ? css(C.sun, 0.28) : css(WHITE, 0.2))
        // algae where panes overlap
        const lo = [P(...a), P(...e), P(...slopeQ(side, bands[j] + 0.03, zb)), P(...slopeQ(side, bands[j] + 0.03, za))]
        tint(b, poly(lo), css(mix(C.leaf[2], C.outside[1], 0.5), 0.45))
      }
    }
  }

  /* ---- the back wall: brick knee wall, glazing bars, a door left ajar ---- */
  for (const [xa, xb] of [[-GW, -0.45], [0.45, GW]]) {
    const kw = poly([P(xa, 0, ZB), P(xa, 0.62, ZB), P(xb, 0.62, ZB), P(xb, 0, ZB)])
    region(b, kw, css(mix(C.brick, C.shade, 0.35)), 0.02, 0.3, depOf(ZB))
  }
  // the door leaf, swung in
  const hinge = 0.45
  const dw = 0.88
  const da = 0.5
  const fx = hinge - dw * Math.cos(da)
  const fz = ZB - dw * Math.sin(da)
  const leaf = poly([P(hinge, 0, ZB), P(hinge, 2.05, ZB), P(fx, 2.05, fz), P(fx, 0, fz)])
  region(b, leaf, css(mix(mix(C.outside[2], C.sun, 0.25), C.frameShade, 0.25)), 1.5, 0.6, depOf(fz))
  const rB = rng(R.seed * 31 + 4)
  bar(b, [hinge, 0, ZB], [hinge, 2.05, ZB], [0.03, 0, 0], ZB, 0.3, rB)
  bar(b, [fx, 0, fz], [fx, 2.05, fz], [0.035, 0, 0], fz, 0.6, rB)
  bar(b, [hinge, 2.05, ZB], [fx, 2.05, fz], [0, 0.03, 0], fz, 0.4, rB)
  bar(b, [hinge, 1.0, ZB], [fx, 1.0, fz], [0, 0.025, 0], fz, 0.4, rB)
  bar(b, [-0.45, 0, ZB], [-0.45, 2.1, ZB], [0.035, 0, 0], ZB, 0.2, rB)
  bar(b, [-0.45, 2.1, ZB], [0.45, 2.1, ZB], [0, 0.035, 0], ZB, 0.2, rB)
  for (let i = 0; i <= 6; i++) {
    const X = -GW + (i * (GW - 0.45)) / 3
    const Xr = i < 4 ? X : 0.45 + ((i - 3) * (GW - 0.45)) / 3
    if (Math.abs(Xr) < 0.46 && i !== 3) continue
    const top = HE + (HR - HE) * (1 - Math.abs(Xr) / GW)
    bar(b, [Xr, 0.62, ZB], [Xr, top, ZB], [0.03, 0, 0], ZB, 0.2, rB)
  }
  for (const Y of [0.62, 1.4]) {
    bar(b, [-GW, Y, ZB], [-0.45, Y, ZB], [0, 0.025, 0], ZB, 0.2, rB)
    bar(b, [0.45, Y, ZB], [GW, Y, ZB], [0, 0.025, 0], ZB, 0.2, rB)
  }
  bar(b, [-GW, HE, ZB], [GW, HE, ZB], [0, 0.03, 0], ZB, 0.2, rB)

  /* ---- frames of the house, far to near ---- */
  const L = b.light
  const purl: { s: number; side: number }[] = [
    { s: 0.36, side: -1 }, { s: 0.7, side: -1 }, { s: 0.36, side: 1 }, { s: 0.7, side: 1 },
  ]
  for (const p of purl) {
    const a = slopeQ(p.side, p.s, ZB)
    const c = slopeQ(p.side, p.s, ZN)
    bar(b, a, c, [0, 0.03, 0], 2.4, p.side === L ? 0.2 : -0.3, rB)
  }
  bar(b, [0, HR, ZB], [0, HR, ZN], [0.05, 0, 0], 2.4, 0.1, rB)
  for (const side of [-1, 1]) {
    bar(b, [side * GW, HE, ZB], [side * GW, HE, ZN], [0, 0.06, 0], 2.2, side === L ? -0.2 : 0.4, rB)
    bar(b, [side * GW, 1.75, ZB], [side * GW, 1.75, ZN], [0, 0.025, 0], 2.2, side === L ? -0.2 : 0.4, rB)
    bar(b, [side * GW, HB + 0.04, ZB], [side * GW, HB + 0.04, ZN], [0, 0.04, 0], 2.2, 0.3, rB)
  }
  for (let k = RAFTERS.length - 1; k >= 0; k--) {
    const Z = RAFTERS[k]
    bar(b, [-GW, HE, Z], [0, HR, Z], [0, 0.04, 0], Z, L < 0 ? 0.3 : -0.4, rB)
    bar(b, [0, HR, Z], [GW, HE, Z], [0, 0.04, 0], Z, L > 0 ? 0.3 : -0.4, rB)
    for (const side of [-1, 1]) {
      bar(b, [side * GW, HB, Z], [side * GW, HE, Z], [0, 0, 0.035], Z, side === L ? -0.3 : 0.5, rB)
      if (Z < ZB - 0.1) bar(b, [side * GW, HB, Z + 0.3], [side * GW, HE, Z + 0.3], [0, 0, 0.018], Z + 0.3, side === L ? -0.3 : 0.4, rB)
    }
  }
}

/* ---- floor, benches ---- */

function buildFloor(b: Builder, r: Rand) {
  const { P: C } = b
  const fl = poly([P(-GW, 0, ZN), P(GW, 0, ZN), P(GW, 0, ZB), P(-GW, 0, ZB)])
  region(b, fl, css(mix(C.grout, C.under, 0.4)), 0, 0.3, depOf(ZB))
  const tw = (2 * AW) / 8
  const rows: number[] = []
  for (let z = ZN; z < ZB; z += tw) rows.push(z)
  for (let jz = 0; jz < rows.length; jz++) {
    const za = rows[jz]
    const zb = Math.min(ZB, za + tw)
    for (let i = 0; i < 8; i++) {
      const xa = -AW + i * tw
      const xb = xa + tw
      const pts = [P(xa, 0, za), P(xb, 0, za), P(xb, 0, zb), P(xa, 0, zb)]
      const A = (i + jz) % 2 === 0
      const side = Math.abs((xa + xb) / 2) / AW
      const fade = clamp((za - 1.2) / 6, 0, 1)
      let c = A ? C.tileA : C.tileB
      c = mix(c, C.shade, 0.18 + side * 0.22 + rr(r, -0.05, 0.08))
      c = mix(c, mix(C.sky[1], C.sun, 0.4), fade * 0.35)
      const ang = A ? lineAng(P((xa + xb) / 2, 0, za), P((xa + xb) / 2, 0, zb)) + rr(r, -0.25, 0.25) : rr(r, -0.3, 0.3)
      region(b, poly(pts), css(c), ang, 0.3, depOf((za + zb) / 2))
    }
  }
  // grout lines
  const seed = Math.floor(r() * 1e6)
  b.pencil.push((L, B) => {
    const r2 = rng(seed)
    for (let i = 0; i <= 8; i++) {
      const X = -AW + i * tw
      sketch(L, B, [P(X, 0, ZN + 0.05), P(X, 0, ZB)], { w: 0.55, col: C.grout, a: 0.55, dep: depOf(ZB) + 200, brk: 0.5, over: 0 }, r2)
    }
    for (const z of rows) {
      if (z < 1.05) continue
      sketch(L, B, [P(-AW, 0, z), P(AW, 0, z)], { w: 0.5 + 0.4 / z, col: C.grout, a: 0.5, dep: depOf(z) + 2, brk: 0.5, over: 0.01 }, r2)
    }
  })
}

const ZS = [0.08, 0.15, 0.22, 0.3, 0.45, 0.6, 0.8, 1, 1.25, 1.55, 1.9, 2.3, 2.8, 3.4, 4.1, 5, 6, ZB]
/** A receding plane cut into strips along Z, so the depth map stays right as it nears the eye. */
function strips(b: Builder, quad: (za: number, zb: number) => Pt[], fill: string | CanvasGradient, ang: number, soft: number, dOff = 0) {
  for (let i = 0; i < ZS.length - 1; i++) {
    const za = ZS[i]
    const zb = ZS[i + 1]
    region(b, poly(quad(za, zb + (i < ZS.length - 2 ? 0.02 : 0))), fill, ang, soft, depOf((za + zb) / 2) + dOff)
  }
}

function buildBenches(b: Builder, r: Rand) {
  const { P: C } = b
  for (const s of [-1, 1]) {
    const lit = s === -b.light ? 1 : 0
    strips(b, (za, zb) => [P(s * GW, HB, za), P(s * AW, HB, za), P(s * AW, HB, zb), P(s * GW, HB, zb)], css(mix(mix(C.wood, C.frame, 0.15), C.woodShade, 0.25)), lineAng(P(s * 1.7, HB, 2), P(s * 1.7, HB, 4)), 0.3)
    // the dark under the bench, with the brick wall behind
    const gu = b.col.createLinearGradient(0, P(s * AW, HB, 1.6)[1], 0, P(s * AW, 0, 1.6)[1])
    gu.addColorStop(0, css(C.under))
    gu.addColorStop(0.55, css(mix(C.under, C.outside[0], 0.35)))
    gu.addColorStop(1, css(mix(C.under, mix(C.tileB, C.outside[1], 0.4), 0.5)))
    strips(b, (za, zb) => [P(s * AW, HB - 0.09, za), P(s * AW, 0, za), P(s * AW, 0, zb), P(s * AW, HB - 0.09, zb)], gu, lineAng(P(s * AW, 0.3, 2), P(s * AW, 0.3, 4)) + 0.5 * s, 0.25, -2)
    // things kept under the bench
    const kept: number[] = []
    for (let Z = 0.45 + r() * 0.2; Z < 6; Z += rr(r, 0.22, 0.5)) kept.push(Z)
    kept.sort((a, c) => c - a)
    for (const Z of kept) {
      const X = s * (AW + rr(r, 0.2, 0.75))
      const n = r() < 0.4 ? 1 + Math.floor(r() * 3) : 1
      const rad = rr(r, 0.07, 0.12)
      for (let k = 0; k < n; k++) pot(b, X, k * rad * 0.55, Z, rad, rad * 1.1, r)
    }
    // the bench's own shadow over what is kept under it
    {
      const sh = new Path2D()
      for (let i = 0; i < ZS.length - 1; i++) {
        const q = [P(s * AW, HB - 0.09, ZS[i]), P(s * AW, 0, ZS[i]), P(s * AW, 0, ZS[i + 1] + 0.02), P(s * AW, HB - 0.09, ZS[i + 1] + 0.02)]
        q.forEach(([x, y], j) => (j ? sh.lineTo(x, y) : sh.moveTo(x, y)))
        sh.closePath()
      }
      const gs = b.col.createLinearGradient(0, P(s * AW, HB, 1.6)[1], 0, P(s * AW, 0, 1.6)[1])
      gs.addColorStop(0, css(C.under, 0.5))
      gs.addColorStop(1, css(C.under, 0.12))
      b.col.fillStyle = gs
      b.col.fill(sh)
    }
    // front plank
    strips(b, (za, zb) => [P(s * AW, HB, za), P(s * AW, HB - 0.09, za), P(s * AW, HB - 0.09, zb), P(s * AW, HB, zb)], css(lit ? C.wood : mix(C.wood, C.woodShade, 0.5)), lineAng(P(s * AW, HB, 2), P(s * AW, HB, 4)), 0.2, 1)
    // legs
    for (let Z = 1.5; Z < ZB; Z += 1.2) {
      const lg = poly([P(s * (AW - 0.02), HB - 0.09, Z), P(s * (AW - 0.02), 0, Z), P(s * (AW - 0.08), 0, Z), P(s * (AW - 0.08), HB - 0.09, Z)])
      region(b, lg, css(mix(C.wood, C.woodShade, lit ? 0.35 : 0.6)), Math.PI / 2, 0.15, depOf(Z) + 3)
    }
    const seed = Math.floor(r() * 1e6)
    const dp = depOf(1.4)
    b.conte.push((L, B) => {
      const r2 = rng(seed)
      sketch(L, B, [P(s * AW, HB - 0.09, ZN + 0.2), P(s * AW, HB - 0.09, ZB)], { w: 1.2, col: C.conte, a: 0.75, dep: dp, brk: 0.3, over: 0 }, r2)
    })
    b.pencil.push((L, B) => {
      const r2 = rng(seed + 2)
      // slats of the bench top, and the gaps between them
      for (let k = 1; k < 8; k++) {
        const X = s * (AW + k * 0.15)
        sketch(L, B, [P(X, HB, 0.32), P(X, HB, ZB)], { w: 0.7, col: C.woodShade, a: 0.55, dep: depOf(0.6), brk: 0.5, over: 0 }, r2)
      }
      sketch(L, B, [P(s * AW, HB, ZN + 0.2), P(s * AW, HB, ZB)], { w: 0.8, col: C.woodShade, a: 0.7, dep: dp, brk: 0.4, over: 0 }, r2)
      for (let Z = 1.5; Z < ZB; Z += 1.2) {
        sketch(L, B, [P(s * (AW - 0.02), HB - 0.09, Z), P(s * (AW - 0.02), 0, Z)], { w: 0.7, col: C.woodShade, a: 0.65, dep: depOf(Z) + 4, brk: 0.3 }, r2)
      }
    })
    if (lit) {
      b.chalk.push((L, B) => {
        const r2 = rng(seed + 3)
        sketch(L, B, [P(s * AW, HB + 0.005, ZN + 0.2), P(s * AW, HB + 0.005, ZB)], { w: 0.9, col: mix(C.chalk, C.sun, 0.4), a: 0.55, dep: dp, brk: 1.2, passes: 1, over: 0 }, r2)
      })
    }
  }
}

/* ---- plants ---- */

type Leaf = { L: Pt[]; R: Pt[]; mid: Pt[] }

/** A long leaf along a curved midrib (banana, strelitzia, dracaena, begonia). World coords. */
function bladePts(x: number, y: number, ang: number, len: number, wid: number, curl: number, droop: number, r: Rand, shape = 0.75): Leaf {
  const N = 16
  const mid: Pt[] = []
  const Lp: Pt[] = []
  const Rp: Pt[] = []
  let px = x
  let py = y
  const down = Math.cos(ang) >= 0 ? 1 : -1
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = ang + curl * t + droop * t * t * down
    if (i > 0) {
      px += (Math.cos(a) * len) / N
      py += (Math.sin(a) * len) / N
    }
    const w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + t * 0.98)), shape) * (1 + (r() - 0.5) * 0.08)
    mid.push([px, py])
    Lp.push([px - Math.sin(a) * w, py + Math.cos(a) * w])
    Rp.push([px + Math.sin(a) * w, py - Math.cos(a) * w])
  }
  return { L: Lp, R: Rp, mid }
}

type LeafOpt = { v: number; cool?: boolean; dep: number; beta: number; near: number; spots?: boolean; seed: number }

/** Paint a leaf: two halves in different values, hatch along the veins, contour and wet glints as marks. */
function paintLeaf(b: Builder, lf: Leaf, o: LeafOpt, holes?: Pt[][]) {
  const C = b.P
  const ramp0 = o.cool ? C.cool : C.leaf
  const hiSide = o.v > 0.5 ? 1 : 0
  const cA = ramp(ramp0, o.v + 0.16)
  const cB = ramp(ramp0, o.v - 0.08)
  const N = lf.mid.length
  const halfL: Pt[] = lf.mid.concat(lf.L.slice().reverse())
  const halfR: Pt[] = lf.mid.concat(lf.R.slice().reverse())
  const pL = poly(halfL)
  const pR = poly(halfR)
  if (holes && holes.length) {
    for (const h of holes) {
      pL.moveTo(h[0][0], h[0][1])
      for (let i = 1; i < h.length; i++) pL.lineTo(h[i][0], h[i][1])
      pL.closePath()
      pR.moveTo(h[0][0], h[0][1])
      for (let i = 1; i < h.length; i++) pR.lineTo(h[i][0], h[i][1])
      pR.closePath()
    }
  }
  const midA = lineAng(lf.mid[0], lf.mid[N - 1])
  const grad = (c: RGB) => {
    const g = b.col.createLinearGradient(lf.mid[0][0], lf.mid[0][1], lf.mid[N - 1][0], lf.mid[N - 1][1])
    g.addColorStop(0, css(mix(c, ramp0[0], 0.45)))
    g.addColorStop(0.45, css(c))
    g.addColorStop(1, css(mix(c, ramp0[ramp0.length - 1], 0.22)))
    return g
  }
  region(b, pL, grad(hiSide ? cA : cB), midA + o.beta, 0.12, o.dep, "evenodd")
  region(b, pR, grad(hiSide ? cB : cA), midA - o.beta, 0.12, o.dep, "evenodd")
  // segment-wise hatch angles so the strokes follow a curving midrib
  for (let i = 0; i < N - 1; i += 2) {
    const j = Math.min(N - 1, i + 2)
    const a = lineAng(lf.mid[i], lf.mid[j])
    const sl = poly([lf.mid[i], lf.mid[j], lf.L[j], lf.L[i]])
    const sr = poly([lf.mid[i], lf.mid[j], lf.R[j], lf.R[i]])
    b.att.fillStyle = attCss(a + o.beta, 0.12)
    b.att.fill(sl)
    b.att.fillStyle = attCss(a - o.beta, 0.12)
    b.att.fill(sr)
  }
  if (o.v > 0.55) {
    b.hi.strokeStyle = `rgba(255,255,255,${((o.v - 0.55) * 0.9).toFixed(3)})`
    b.hi.lineWidth = 0.0025
    b.hi.beginPath()
    const edge = hiSide ? lf.L : lf.R
    edge.forEach(([x, y], i) => (i ? b.hi.lineTo(x, y) : b.hi.moveTo(x, y)))
    b.hi.stroke()
  }
  const outline: Pt[] = lf.L.concat(lf.R.slice().reverse())
  const dark = mix(ramp0[0], C.shade, 0.3)
  const nearV = o.near
  if (nearV > 0.02) {
    const seed = o.seed
    const lineW = 0.5 + nearV * 1.6
    const job: Job = (L, B) => {
      const r2 = rng(seed)
      sketch(L, B, outline, { w: lineW, col: dark, a: 0.5 + nearV * 0.4, dep: o.dep, brk: 0.5, wob: 0.6 + nearV }, r2)
      sketch(L, B, lf.mid, { w: lineW * 0.55, col: mix(dark, ramp0[2], 0.3), a: 0.6, dep: o.dep, brk: 0.3, passes: 1 }, r2)
      if (holes) for (const h of holes) sketch(L, B, h, { w: lineW * 0.7, col: dark, a: 0.6, dep: o.dep, brk: 0.2, passes: 1 }, r2)
      // veins: many fine parallel ones on banana-like leaves, a few on the rest
      if (nearV > 0.2) {
        const many = o.beta > 1.1
        const stepV = many ? 0.5 : 2
        for (let f = 1.5; f < N - 2; f += stepV) {
          const i = Math.floor(f)
          const fr = f - i
          for (const side of [lf.L, lf.R]) {
            const m: Pt = [lerp(lf.mid[i][0], lf.mid[i + 1][0], fr), lerp(lf.mid[i][1], lf.mid[i + 1][1], fr)]
            const j = Math.min(N - 1, i + (many ? 1 : 2))
            const e: Pt = [lerp(side[j][0], side[Math.min(N - 1, j + 1)][0], fr), lerp(side[j][1], side[Math.min(N - 1, j + 1)][1], fr)]
            const lit = side === (hiSide ? lf.L : lf.R)
            sketch(L, B, [m, [lerp(m[0], e[0], 0.92), lerp(m[1], e[1], 0.92)]], { w: many ? 0.4 : 0.45, col: lit ? mix(ramp0[ramp0.length - 2], ramp0[ramp0.length - 1], 0.4) : mix(dark, ramp0[1], 0.4), a: many ? 0.4 : 0.35, dep: o.dep, brk: 0.3, passes: 1, over: 0 }, r2)
          }
        }
      }
    }
    if (nearV > 0.45) b.conte.push(job)
    else b.pencil.push(job)
    // rain on the leaf: chalk glints along the lit edge and the midrib
    b.chalk.push((L, B) => {
      const r2 = rng(seed + 5)
      const wet = B.R.wet
      const side = hiSide ? lf.L : lf.R
      const n = Math.round((3 + nearV * 8) * wet)
      for (let k = 0; k < n; k++) {
        const i = 1 + Math.floor(r2() * (N - 3))
        const p = side[i]
        const m = lf.mid[i]
        const t = rr(r2, 0.05, 0.3)
        const x = lerp(p[0], m[0], t)
        const y = lerp(p[1], m[1], t)
        mark(L, B, x, y, lineAng(side[i], side[i + 1]), rr(r2, 3, 9) * (0.6 + nearV), rr(r2, 0.6, 1.3), C.chalk, rr(r2, 0.5, 0.9), r2)
      }
      if (o.spots) {
        for (let k = 0; k < 6 + nearV * 14; k++) {
          const i = 2 + Math.floor(r2() * (N - 4))
          const sd = r2() < 0.5 ? lf.L : lf.R
          const t = rr(r2, 0.2, 0.8)
          mark(L, B, lerp(lf.mid[i][0], sd[i][0], t), lerp(lf.mid[i][1], sd[i][1], t), r2() * 3, rr(r2, 1.5, 3.5), rr(r2, 1, 1.8), mix(C.chalk, C.cool[2], 0.3), 0.75, r2)
        }
      }
    })
  }
}

/** Monstera-like leaf: a heart with slits and holes. */
function heartLeaf(b: Builder, x: number, y: number, ang: number, len: number, o: LeafOpt, r: Rand) {
  const N = 56
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  const nx = -uy
  const ny = ux
  const ring: Pt[] = []
  const uv: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const th = (i / N) * TAU
    const hxv = Math.pow(Math.sin(th), 3)
    const hyv = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
    const u = (0.31 - hyv) / 1.37
    const v = hxv * 0.82 * (1 + (r() - 0.5) * 0.05)
    uv.push([u, v])
    ring.push([x + ux * u * len + nx * v * len * 0.62, y + uy * u * len + ny * v * len * 0.62])
  }
  // split the ring into the two halves by side (v sign), keep a midrib
  const mid: Pt[] = []
  for (let i = 0; i <= 16; i++) {
    const u = (i / 16) * 1.0
    mid.push([x + ux * u * len, y + uy * u * len])
  }
  const Ls: Pt[] = []
  const Rs: Pt[] = []
  for (let i = 0; i <= 16; i++) {
    const u = i / 16
    let bl = 0
    let br = 0
    for (const [uu, vv] of uv) {
      if (Math.abs(uu - u) < 0.05) {
        if (vv > bl) bl = vv
        if (vv < br) br = vv
      }
    }
    if (i === 16) {
      bl = 0
      br = 0
    }
    Ls.push([x + ux * u * len + nx * bl * len * 0.62, y + uy * u * len + ny * bl * len * 0.62])
    Rs.push([x + ux * u * len + nx * br * len * 0.62, y + uy * u * len + ny * br * len * 0.62])
  }
  const holes: Pt[][] = []
  for (const side of [Ls, Rs]) {
    for (let k = 3; k <= 13; k += 2 + Math.floor(r() * 2)) {
      const e1 = side[k]
      const e2 = side[Math.min(15, k + 1)]
      const m = mid[Math.max(1, k - 2)]
      const t = rr(r, 0.35, 0.6)
      const inner: Pt = [lerp(m[0], (e1[0] + e2[0]) / 2, t), lerp(m[1], (e1[1] + e2[1]) / 2, t)]
      const ex1: Pt = [lerp(e1[0], e2[0], 0.25), lerp(e1[1], e2[1], 0.25)]
      const ex2: Pt = [lerp(e1[0], e2[0], 0.7), lerp(e1[1], e2[1], 0.7)]
      holes.push([ex1, inner, ex2])
    }
  }
  paintLeaf(b, { L: Ls, R: Rs, mid }, o, holes)
}

/** Round leaf (pelargonium, nasturtium): a scalloped disc, with a darker zone ring. */
function roundLeaf(b: Builder, x: number, y: number, rad: number, o: LeafOpt & { zone?: boolean }, r: Rand) {
  const C = b.P
  const pts: Pt[] = []
  const n = 14
  const a0 = r() * TAU
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU
    const k = (1 + 0.1 * Math.sin(i * 2.7)) * (0.92 + 0.12 * r())
    pts.push([x + Math.cos(a) * rad * k, y + Math.sin(a) * rad * k * 0.72])
  }
  const c = ramp(o.cool ? C.cool : C.leaf, o.v)
  region(b, poly(pts), css(c), r() * Math.PI, 0.15, o.dep)
  if (o.zone) {
    const z = new Path2D()
    z.ellipse(x, y, rad * 0.55, rad * 0.4, 0, 0, TAU)
    z.ellipse(x, y, rad * 0.32, rad * 0.22, 0, 0, TAU)
    b.col.fillStyle = css(mix(c, C.pot[0], 0.45), 0.7)
    b.col.fill(z, "evenodd")
  }
  if (o.near > 0.05) {
    const seed = o.seed
    b.pencil.push((L, B) => {
      const r2 = rng(seed)
      sketch(L, B, pts.concat([pts[0]]), { w: 0.45 + o.near, col: mix(C.leaf[0], C.shade, 0.3), a: 0.6, dep: o.dep, brk: 0.5, passes: 1 }, r2)
    })
  }
}

type Plant = { kind: string; X: number; Y: number; Z: number; s: number; seed: number; pot: number }

/** A terracotta pot; returns the crown (centre of the soil) in world coords. */
function pot(b: Builder, X: number, Y: number, Z: number, rad: number, hgt: number, r: Rand, label = false): Pt {
  const C = b.P
  const sc = scl(Z)
  const T = P(X, Y + hgt, Z)
  const Bt = P(X, Y, Z)
  const rx = rad * sc
  const ky = clamp((CY - (Y + hgt)) / Z, 0.05, 0.75)
  const ry = rx * ky
  const rb = rx * 0.76
  const ryb = rb * clamp((CY - Y) / Z, 0.05, 0.8)
  const rim = hgt * 0.17 * sc
  const dp = depOf(Z) + 2
  const body = new Path2D()
  body.moveTo(T[0] - rx, T[1])
  body.lineTo(Bt[0] - rb, Bt[1])
  body.ellipse(Bt[0], Bt[1], rb, ryb, 0, Math.PI, 0, true)
  body.lineTo(T[0] + rx, T[1])
  body.ellipse(T[0], T[1], rx, ry, 0, 0, Math.PI, true)
  body.closePath()
  const lit = b.light
  const gp = b.col.createLinearGradient(T[0] - rx * lit, 0, T[0] + rx * lit, 0)
  gp.addColorStop(0, css(mix(C.pot[0], C.shade, 0.25)))
  gp.addColorStop(0.45, css(C.pot[1]))
  gp.addColorStop(0.82, css(C.pot[2]))
  gp.addColorStop(1, css(C.pot[1]))
  const pa = 1.32 + rr(r, -0.15, 0.15)
  region(b, body, gp, pa, 0.2, dp)
  const rimP = new Path2D()
  rimP.ellipse(T[0], T[1] + rim, rx * 1.07, ry * 1.07, 0, 0, Math.PI)
  rimP.lineTo(T[0] - rx * 1.07, T[1])
  rimP.ellipse(T[0], T[1], rx * 1.07, ry * 1.07, 0, Math.PI, TAU)
  rimP.closePath()
  const gr = b.col.createLinearGradient(T[0] - rx * lit, 0, T[0] + rx * lit, 0)
  gr.addColorStop(0, css(C.pot[1]))
  gr.addColorStop(0.75, css(mix(C.pot[2], WHITE, 0.15)))
  gr.addColorStop(1, css(C.pot[1]))
  region(b, rimP, gr, pa + 0.2, 0.2, dp)
  const soil = new Path2D()
  soil.ellipse(T[0], T[1] + ry * 0.05, rx * 0.93, ry * 0.86, 0, 0, TAU)
  region(b, soil, css(mix(C.woodShade, C.under, 0.3)), 0.15, 0.2, dp)
  const seed = Math.floor(r() * 1e6)
  if (rx > 0.004) {
    const near = clamp((sc - 0.08) / 0.3, 0, 1)
    b.conte.push((L, B) => {
      const r2 = rng(seed)
      const arc = (cx: number, cy: number, ax: number, ay: number, a0: number, a1: number, n = 18): Pt[] =>
        Array.from({ length: n + 1 }, (_, i) => {
          const a = lerp(a0, a1, i / n)
          return [cx + Math.cos(a) * ax, cy + Math.sin(a) * ay] as Pt
        })
      sketch(L, B, arc(T[0], T[1] + rim, rx * 1.07, ry * 1.07, -0.1, Math.PI + 0.1), { w: 0.7 + near, col: mix(C.conte, C.pot[0], 0.3), a: 0.75, dep: dp, brk: 0.4 }, r2)
      sketch(L, B, [[T[0] - rx * lit, T[1] + rim], [Bt[0] - rb * lit, Bt[1]]], { w: 0.6 + near, col: mix(C.conte, C.pot[0], 0.2), a: 0.7, dep: dp, brk: 0.3 }, r2)
      sketch(L, B, arc(Bt[0], Bt[1], rb, ryb, 0.2, Math.PI - 0.2, 12), { w: 0.6 + near * 0.6, col: C.conte, a: 0.55, dep: dp, brk: 0.5, passes: 1 }, r2)
    })
    b.pencil.push((L, B) => {
      const r2 = rng(seed + 1)
      const arc: Pt[] = Array.from({ length: 19 }, (_, i) => {
        const a = Math.PI + (i / 18) * Math.PI
        return [T[0] + Math.cos(a) * rx * 1.07, T[1] + Math.sin(a) * ry * 1.07] as Pt
      })
      sketch(L, B, arc, { w: 0.5 + near * 0.5, col: mix(C.pot[0], C.shade, 0.3), a: 0.6, dep: dp, brk: 0.4, passes: 1 }, r2)
      sketch(L, B, [[T[0] + rx * lit, T[1] + rim], [Bt[0] + rb * lit, Bt[1]]], { w: 0.5, col: C.pot[0], a: 0.4, dep: dp, brk: 0.5, passes: 1 }, r2)
    })
    b.chalk.push((L, B) => {
      const r2 = rng(seed + 2)
      const x = T[0] + rx * 0.55 * lit
      sketch(L, B, [[x, T[1] + rim * 1.3], [lerp(x, Bt[0] + rb * 0.55 * lit, 0.75), lerp(T[1], Bt[1], 0.75)]], { w: 0.8 + near * 1.5, col: mix(C.chalk, C.sun, 0.3), a: 0.45, dep: dp, brk: 0.8, passes: 1 }, r2)
      // salt bloom on old terracotta
      for (let k = 0; k < 2 + near * 4; k++) {
        const t = rr(r2, 0.55, 0.95)
        const xx = lerp(T[0], Bt[0], t) + rr(r2, -0.6, 0.6) * lerp(rx, rb, t)
        mark(L, B, xx, lerp(T[1], Bt[1], t), rr(r2, -0.3, 0.3), rr(r2, 4, 12) * (0.4 + near), rr(r2, 1.5, 3) * (0.4 + near), mix(C.chalk, C.pot[2], 0.25), 0.3, r2)
      }
    })
    if (label && rx > 0.01) {
      const lx = T[0] + rr(r, -0.5, 0.5) * rx
      const ly = T[1]
      const lh = 0.07 * sc
      const lw = 0.018 * sc
      const tilt = rr(r, -0.25, 0.25)
      const lab = poly([[lx - lw, ly], [lx - lw + tilt * lh, ly - lh], [lx + lw + tilt * lh, ly - lh * 1.05], [lx + lw, ly]])
      region(b, lab, css(C.chalk), Math.PI / 2 + tilt, 0.1, dp + 2)
      b.pencil.push((L, B) => {
        const r2 = rng(seed + 9)
        for (let k = 0; k < 3; k++) {
          const yy = ly - lh * (0.45 + k * 0.17)
          sketch(L, B, [[lx - lw * 0.6 + tilt * (ly - yy), yy], [lx + lw * 0.6 + tilt * (ly - yy), yy + lw * 0.2]], { w: 0.35, col: C.conte, a: 0.6, wob: 1.2, passes: 1 }, r2)
        }
      })
    }
  }
  return [T[0], T[1] + ry * 0.05]
}

function inShaft(b: Builder, x: number, y: number) {
  let s = 0
  for (const sh of b.shafts) if (pointIn(sh.hull, x, y)) s = Math.max(s, sh.a)
  return s
}

function drawPlant(b: Builder, p: Plant) {
  const r = rng(p.seed)
  const C = b.P
  const sc = scl(p.Z)
  const near = clamp((sc - 0.1) / 0.28, 0, 1)
  const potR = p.pot
  const potH = potR * rr(r, 1.0, 1.3)
  const dep = depOf(p.Z)
  const crown = potR > 0 ? pot(b, p.X, p.Y, p.Z, potR, potH, r, r() < 0.45) : P(p.X, p.Y, p.Z)
  const [cx, cy] = crown
  const lightAt = (x: number, y: number, v: number) => clamp(v + inShaft(b, x, y) * 0.5, 0, 1)
  const S = p.s * sc
  let seed = p.seed * 13
  const nextSeed = () => ++seed
  switch (p.kind) {
    case "banana": {
      // pseudo-stem
      const sh = 0.28 * S
      const stem = poly([[cx - 0.025 * S, cy], [cx - 0.015 * S, cy - sh], [cx + 0.015 * S, cy - sh], [cx + 0.025 * S, cy]])
      region(b, stem, css(mix(C.leaf[1], C.pot[1], 0.25)), Math.PI / 2, 0.1, dep + 3)
      const n = 7
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1
        const ang = -Math.PI / 2 + side * rr(r, 0.25, 1.15)
        const len = rr(r, 0.75, 1.05) * S
        const lf = bladePts(cx + side * 0.01 * S, cy - sh * rr(r, 0.6, 1), ang, len, len * 0.17, side * rr(r, 0.1, 0.4), rr(r, 0.5, 1.3), r, 0.55)
        const v = lightAt(lf.mid[8][0], lf.mid[8][1], 0.35 + 0.35 * r() + (side === b.light ? 0.15 : 0))
        paintLeaf(b, lf, { v, dep: dep + 4 + i, beta: 1.3, near, seed: nextSeed() })
      }
      break
    }
    case "monstera": {
      const n = 7
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + rr(r, -1.5, 1.5)
        const pl = rr(r, 0.25, 0.55) * S
        const ex = cx + Math.cos(ang) * pl
        const ey = cy + Math.sin(ang) * pl * 0.8
        const dp2 = dep + 4 + i * 2
        const seedS = nextSeed()
        region(b, poly([[cx - 0.006 * S, cy], [ex, ey], [ex + 0.008 * S, ey], [cx + 0.006 * S, cy]]), css(C.leaf[2]), ang, 0.1, dp2 - 1)
        b.pencil.push((L, B) => sketch(L, B, [[cx, cy], [(cx + ex) / 2, (cy + ey) / 2 - 0.02 * S], [ex, ey]], { w: 0.6 + near, col: C.leaf[1], a: 0.7, dep: dp2, passes: 1 }, rng(seedS)))
        const la = ang + rr(r, 0.4, 1.0) * (Math.cos(ang) >= 0 ? 1 : -1)
        const v = lightAt(ex, ey, 0.3 + 0.4 * r() + (Math.cos(la) * b.light > 0 ? 0.12 : 0))
        heartLeaf(b, ex, ey, la, rr(r, 0.32, 0.45) * S, { v, dep: dp2, beta: 0.85, near, seed: nextSeed() }, r)
      }
      break
    }
    case "fern":
    case "palm": {
      const palm = p.kind === "palm"
      const n = palm ? 6 : 11
      const fronds: { pts: Pt[]; v: number; dp: number }[] = []
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + rr(r, -1.35, 1.35)
        const len = rr(r, 0.6, 1) * (palm ? 0.75 : 0.5) * S
        const down = Math.cos(ang) >= 0 ? 1 : -1
        const pts: Pt[] = []
        let x = cx
        let y = cy
        for (let k = 0; k <= 14; k++) {
          const t = k / 14
          const a = ang + down * t * t * rr(r, 0.9, 1.4)
          if (k) {
            x += (Math.cos(a) * len) / 14
            y += (Math.sin(a) * len) / 14
          }
          pts.push([x, y])
        }
        const v = lightAt(pts[7][0], pts[7][1], 0.35 + 0.35 * r())
        fronds.push({ pts, v, dp: dep + 3 + i })
        // a soft mass in the maps under the marks
        const lf = bladePts(cx, cy, ang, len, len * (palm ? 0.22 : 0.18), down * 0.3, down * 1.1, r, 0.9)
        region(b, poly(lf.L.concat(lf.R.slice().reverse())), css(ramp(C.leaf, v - 0.1)), ang + 0.9 * down, 0.2, dep + 3 + i)
      }
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (const f of fronds) {
          const pl = f.pts
          sketch(L, B, pl, { w: 0.5 + near * 0.5, col: C.leaf[0], a: 0.7, dep: f.dp, passes: 1 }, r2)
          const m = palm ? 16 : 22
          for (let k = 1; k < m; k++) {
            const t = k / m
            const i = Math.min(13, Math.floor(t * 14))
            const fr = t * 14 - i
            const x = lerp(pl[i][0], pl[i + 1][0], fr)
            const y = lerp(pl[i][1], pl[i + 1][1], fr)
            const a = lineAng(pl[i], pl[i + 1])
            const pinna = (palm ? 0.11 : 0.075) * p.s * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)) * (0.8 + 0.4 * r2())
            const plen = pinna * sc * B.ds / B.q
            for (const sd of [-1, 1]) {
              const pa = a + sd * (palm ? 0.5 : 0.95) + (palm ? Math.cos(a) * 0.4 : 0)
              const vv = f.v + (sd === b.light ? 0.12 : -0.08) + (r2() - 0.5) * 0.2
              const colr = pick(B.box, ...ramp(C.leaf, vv), r2)
              const ox = Math.cos(pa) * pinna * sc * 0.5
              const oy = Math.sin(pa) * pinna * sc * 0.5
              if (depAtDev(B, dX(B, x + ox), dY(B, y + oy)) > f.dp + 6) continue
              mark(L, B, x + ox, y + oy, pa, plen, Math.max(0.6, (palm ? 0.06 : 0.1) * plen), colr, 0.88, r2)
            }
          }
        }
      })
      break
    }
    case "spider": {
      const n = 16
      const blades: { pts: Pt[]; v: number }[] = []
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + rr(r, -1.4, 1.4)
        const lf = bladePts(cx, cy, ang, rr(r, 0.25, 0.45) * S, 0.012 * S, 0, 1.6, r, 0.4)
        blades.push({ pts: lf.mid, v: 0.35 + 0.45 * r() })
        region(b, poly(lf.L.concat(lf.R.slice().reverse())), css(ramp(C.leaf, 0.55)), lineAng(lf.mid[0], lf.mid[16]), 0.1, dep + 3)
      }
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (const bl of blades) sketch(L, B, bl.pts, { w: 0.9 + near * 1.6, col: pick(B.box, ...ramp(C.leaf, bl.v), r2), a: 0.9, dep: dep + 4, passes: 1, taper: 0.5, brk: 0 }, r2)
      })
      b.chalk.push((L, B) => {
        const r2 = rng(s0 + 1)
        for (const bl of blades) sketch(L, B, bl.pts.slice(1, 12), { w: 0.35 + near * 0.6, col: mix(C.chalk, C.leaf[4], 0.3), a: 0.7, dep: dep + 4, passes: 1, taper: 0.5, brk: 0.3 }, r2)
      })
      break
    }
    case "geranium": {
      const n = 13
      for (let i = 0; i < n; i++) {
        const a = rr(r, Math.PI * 1.05, Math.PI * 1.95)
        const d = rr(r, 0.02, 0.17) * S
        const x = cx + Math.cos(a) * d * 1.2
        const y = cy + Math.sin(a) * d * 0.9 - 0.02 * S
        roundLeaf(b, x, y, rr(r, 0.045, 0.065) * S, { v: lightAt(x, y, 0.3 + 0.45 * r()), dep: dep + 3 + i, beta: 0, near: near * 0.8, seed: nextSeed(), zone: true }, r)
      }
      const heads: Pt[] = []
      for (let k = 0; k < 3; k++) heads.push([cx + rr(r, -0.12, 0.12) * S, cy - rr(r, 0.2, 0.32) * S])
      const s0 = nextSeed()
      const bc = C.bloom[Math.floor(r() * 2)]
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (const h of heads) sketch(L, B, [[cx + rr(r2, -0.03, 0.03) * S, cy - 0.05 * S], h], { w: 0.45 + near * 0.4, col: C.leaf[2], a: 0.8, dep: dep + 20, passes: 1 }, r2)
      })
      b.pastel.push((L, B) => {
        const r2 = rng(s0 + 1)
        for (const h of heads) {
          const m = 8 + Math.round(near * 10)
          for (let k = 0; k < m; k++) {
            const a = r2() * TAU
            const d = Math.sqrt(r2()) * 0.045 * S
            const colr = mix(bc, k % 3 === 0 ? C.bloom[2] : C.shade, k % 3 === 0 ? 0.35 : r2() * 0.2)
            mark(L, B, h[0] + Math.cos(a) * d, h[1] + Math.sin(a) * d * 0.8, r2() * TAU, rr(r2, 4, 8) * (0.4 + near), rr(r2, 1.8, 3) * (0.4 + near), colr, 0.85, r2)
          }
        }
      })
      for (const h of heads) {
        const hp = new Path2D()
        hp.ellipse(h[0], h[1], 0.05 * S, 0.04 * S, 0, 0, TAU)
        region(b, hp, css(bc), 0.8, 0.3, dep + 20)
      }
      break
    }
    case "begonia": {
      const n = 6
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1
        const ang = -Math.PI / 2 + side * rr(r, 0.3, 1.3)
        const lf = bladePts(cx, cy - 0.03 * S, ang, rr(r, 0.16, 0.22) * S, 0.06 * S, side * 0.5, 0.6, r, 0.6)
        paintLeaf(b, lf, { v: lightAt(lf.mid[8][0], lf.mid[8][1], 0.3 + 0.35 * r()), cool: true, dep: dep + 3 + i, beta: 0.7, near: near * 0.8, seed: nextSeed(), spots: true })
      }
      break
    }
    case "herb": {
      for (let i = 0; i < 20; i++) {
        const a = rr(r, Math.PI * 1.05, Math.PI * 1.95)
        const d = rr(r, 0.01, 0.14) * S
        const x = cx + Math.cos(a) * d
        const y = cy + Math.sin(a) * d * 1.1 - 0.03 * S
        const lf = bladePts(x, y, a + rr(r, -0.5, 0.5), rr(r, 0.04, 0.07) * S, 0.022 * S, 0.3, 0.2, r, 0.8)
        paintLeaf(b, lf, { v: lightAt(x, y, 0.45 + 0.4 * r()), dep: dep + 3 + i, beta: 0.6, near: near * 0.5, seed: nextSeed() })
      }
      break
    }
    case "succulent": {
      for (let ring = 3; ring >= 1; ring--) {
        const m = ring * 4 + 2
        for (let k = 0; k < m; k++) {
          const a = (k / m) * TAU + ring
          const len = ring * 0.035 * S
          const ex = cx + Math.cos(a) * len
          const ey = cy + Math.sin(a) * len * 0.55 - 0.01 * S
          const lf = bladePts(cx, cy - 0.005 * S, lineAng([cx, cy], [ex, ey]), len * 1.1, len * 0.28, 0, 0, r, 0.9)
          paintLeaf(b, lf, { v: 0.3 + ring * 0.12 + r() * 0.15, cool: true, dep: dep + 5 + (3 - ring) * 3 + (Math.sin(a) > 0 ? 1 : 0), beta: 0.3, near: near * 0.6, seed: nextSeed() })
        }
      }
      break
    }
    case "cactus": {
      const hgt = rr(r, 0.18, 0.3) * S
      const wdt = 0.05 * S
      const body = new Path2D()
      body.moveTo(cx - wdt, cy)
      body.bezierCurveTo(cx - wdt * 1.1, cy - hgt * 0.7, cx - wdt * 0.8, cy - hgt, cx, cy - hgt)
      body.bezierCurveTo(cx + wdt * 0.8, cy - hgt, cx + wdt * 1.1, cy - hgt * 0.7, cx + wdt, cy)
      body.closePath()
      const gc = b.col.createLinearGradient(cx - wdt * b.light, 0, cx + wdt * b.light, 0)
      gc.addColorStop(0, css(C.cool[0]))
      gc.addColorStop(0.7, css(C.cool[1]))
      gc.addColorStop(1, css(C.cool[2]))
      region(b, body, gc, Math.PI / 2, 0.1, dep + 4)
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (let k = -2; k <= 2; k++) {
          const xo = (k / 2.6) * wdt
          sketch(L, B, [[cx + xo, cy], [cx + xo * 0.9, cy - hgt * 0.7], [cx + xo * 0.4, cy - hgt * 0.98]], { w: 0.4 + near * 0.4, col: C.cool[0], a: 0.7, dep: dep + 5, passes: 1 }, r2)
          for (let j = 1; j < 9; j++) {
            const yy = cy - (hgt * j) / 9.5
            mark(L, B, cx + xo, yy, -Math.PI / 2 + rr(r2, -0.8, 0.8), 3 + near * 3, 0.3, C.chalk, 0.8, r2)
          }
        }
      })
      if (r() < 0.6) {
        const fl = new Path2D()
        fl.ellipse(cx, cy - hgt, 0.022 * S, 0.016 * S, 0, 0, TAU)
        region(b, fl, css(C.bloom[1]), 0, 0.2, dep + 6)
      }
      break
    }
    case "seedlings": {
      // a shallow wooden tray of soil with rows of sprouts
      const tw = 0.22 * p.s
      const tl = 0.32 * p.s
      const corners: V3[] = [[p.X - tw, p.Y + 0.06, p.Z - tl], [p.X + tw, p.Y + 0.06, p.Z - tl], [p.X + tw, p.Y + 0.06, p.Z + tl], [p.X - tw, p.Y + 0.06, p.Z + tl]]
      region(b, poly(corners.map((c) => P(...c))), css(mix(C.woodShade, C.under, 0.3)), 0.1, 0.2, dep + 2)
      const front = poly([P(p.X - tw, p.Y, p.Z - tl), P(p.X + tw, p.Y, p.Z - tl), P(p.X + tw, p.Y + 0.06, p.Z - tl), P(p.X - tw, p.Y + 0.06, p.Z - tl)])
      region(b, front, css(C.wood), 0, 0.2, dep + 3)
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 9; j++) {
            const [x, y] = P(p.X - tw + ((i + 0.5) * 2 * tw) / 6, p.Y + 0.06, p.Z - tl + ((j + 0.5) * 2 * tl) / 9)
            const s2 = scl(p.Z) * 0.035 * p.s
            const c2 = pick(B.box, ...ramp(C.leaf, 0.55 + r2() * 0.35), r2)
            const sz = (s2 * B.ds) / B.q
            mark(L, B, x - s2 * 0.4, y - s2 * 0.5, -2.3 + rr(r2, -0.3, 0.3), sz * 0.9, Math.max(0.5, sz * 0.25), c2, 0.9, r2)
            mark(L, B, x + s2 * 0.4, y - s2 * 0.5, -0.8 + rr(r2, -0.3, 0.3), sz * 0.9, Math.max(0.5, sz * 0.25), c2, 0.9, r2)
          }
        }
      })
      break
    }
    case "lemon": {
      // a small tree in a big pot on the floor: trunk, a dark crown of small leaves, lemons
      const th = 0.9 * S
      const trunk = poly([[cx - 0.015 * S, cy], [cx - 0.008 * S, cy - th], [cx + 0.008 * S, cy - th], [cx + 0.015 * S, cy]])
      region(b, trunk, css(C.woodShade), Math.PI / 2, 0.1, dep + 3)
      const crownC: Pt = [cx, cy - th - 0.15 * S]
      const cr = new Path2D()
      cr.ellipse(crownC[0], crownC[1], 0.36 * S, 0.3 * S, 0, 0, TAU)
      const gl = b.col.createRadialGradient(crownC[0] + 0.15 * S * b.light, crownC[1] - 0.12 * S, 0, crownC[0], crownC[1], 0.4 * S)
      gl.addColorStop(0, css(C.leaf[3]))
      gl.addColorStop(0.6, css(C.leaf[1]))
      gl.addColorStop(1, css(C.leaf[0]))
      region(b, cr, gl, -0.6, 0.15, dep + 4)
      const fruits: Pt[] = []
      for (let k = 0; k < 9; k++) {
        const a = r() * TAU
        const d = Math.sqrt(r()) * 0.28 * S
        fruits.push([crownC[0] + Math.cos(a) * d, crownC[1] + Math.sin(a) * d * 0.8])
      }
      for (const f of fruits) {
        const fp = new Path2D()
        fp.ellipse(f[0], f[1], 0.03 * S, 0.022 * S, 0.3, 0, TAU)
        region(b, fp, css(C.lemon), 0.3, 0.2, dep + 8)
      }
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (let k = 0; k < 260; k++) {
          const a = r2() * TAU
          const d = Math.sqrt(r2()) * 0.36 * S
          const x = crownC[0] + Math.cos(a) * d
          const y = crownC[1] + Math.sin(a) * d * 0.83
          const v = 0.25 + 0.5 * (0.5 - (y - crownC[1]) / (0.6 * S)) + (x - crownC[0]) * b.light * 1.5 + (r2() - 0.5) * 0.3
          const sz = (0.05 * S * B.ds) / B.q
          if (depAtDev(B, dX(B, x), dY(B, y)) > dep + 10) continue
          mark(L, B, x, y, r2() * TAU, sz, sz * 0.28, pick(B.box, ...ramp(C.leaf, v), r2), 0.85, r2)
        }
        for (const f of fruits) {
          const sz = (0.03 * S * B.ds) / B.q
          mark(L, B, f[0] - 0.008 * S * b.light, f[1] + 0.006 * S, 0.3, sz * 1.4, sz * 0.4, mix(C.lemon, C.pot[1], 0.45), 0.6, r2)
        }
      })
      b.chalk.push((L, B) => {
        const r2 = rng(s0 + 1)
        for (const f of fruits) mark(L, B, f[0] + 0.008 * S * b.light, f[1] - 0.008 * S, 0.3, (0.012 * S * B.ds) / B.q, 1, C.chalk, 0.85, r2)
      })
      break
    }
    case "trail": {
      // spills over the front of the bench toward the aisle
      const toward = -Math.sign(p.X)
      const mound = new Path2D()
      mound.ellipse(cx, cy - 0.02 * S, 0.12 * S, 0.06 * S, 0, 0, TAU)
      region(b, mound, css(ramp(C.cool, 0.5)), -0.5, 0.2, dep + 3)
      strands(b, r, cx + toward * 0.05 * S, cy, S, dep + 30, near, 9, [0.35, 0.95], toward * 0.35, r() < 0.5, nextSeed())
      break
    }
    case "cane": {
      // a bamboo cane with a tomato tied to it
      const ht = rr(r, 0.8, 1.15) * S
      const top: Pt = [cx + rr(r, -0.02, 0.02) * S, cy - ht]
      const s0 = nextSeed()
      const fruits: Pt[] = []
      for (let i = 0; i < 9; i++) {
        const t = 0.15 + (i / 9) * 0.85
        const side = i % 2 ? 1 : -1
        const y = lerp(cy, top[1], t)
        const x = lerp(cx, top[0], t)
        const ang = -Math.PI / 2 + side * rr(r, 0.7, 1.3)
        const lf = bladePts(x, y, ang, rr(r, 0.12, 0.2) * S, 0.035 * S, side * 0.3, 0.9, r, 0.7)
        paintLeaf(b, lf, { v: lightAt(x, y, 0.3 + 0.45 * r()), dep: dep + 4 + i, beta: 0.8, near: near * 0.8, seed: nextSeed() })
        if (r() < 0.45) fruits.push([x + side * 0.03 * S, y + 0.03 * S])
      }
      for (const f of fruits) {
        const fp = new Path2D()
        fp.arc(f[0], f[1], 0.018 * S, 0, TAU)
        region(b, fp, css(r() < 0.6 ? C.bloom[0] : mix(C.bloom[3], C.leaf[3], 0.5)), 0.4, 0.2, dep + 16)
      }
      b.pencil.push((L, B) => sketch(L, B, [[cx, cy], top], { w: 0.8 + near * 0.7, col: mix(C.wood, C.lemon, 0.3), a: 0.9, dep: dep + 3, passes: 2, brk: 0.1 }, rng(s0)))
      b.chalk.push((L, B) => {
        const r2 = rng(s0 + 1)
        for (const f of fruits) mark(L, B, f[0] - 0.006 * S, f[1] - 0.007 * S, -0.5, (0.012 * S * B.ds) / B.q, 0.8, C.chalk, 0.85, r2)
      })
      break
    }
    case "ivy": {
      // a hanging basket with trailing strands
      const top = P(p.X, p.Y + 0.9, p.Z)
      const s0 = nextSeed()
      b.pencil.push((L, B) => {
        const r2 = rng(s0)
        for (const dx of [-0.12, 0, 0.12]) sketch(L, B, [[cx + dx * S, cy - 0.04 * S], top], { w: 0.35, col: C.frameShade, a: 0.6, dep: dep + 2, passes: 1, brk: 0.2 }, r2)
      })
      strands(b, r, cx, cy, S, dep + 6, near, 9, [0.4, 1.0], 0, false, nextSeed())
      // the basket: a half-bowl of moss
      const bowl = new Path2D()
      bowl.ellipse(cx, cy, 0.16 * S, 0.12 * S, 0, 0, Math.PI)
      bowl.closePath()
      region(b, bowl, css(mix(C.wood, C.leaf[1], 0.5)), 0.4, 0.25, dep + 5)
      const fol = new Path2D()
      fol.ellipse(cx, cy - 0.03 * S, 0.17 * S, 0.07 * S, 0, 0, TAU)
      region(b, fol, css(C.leaf[2]), -0.6, 0.2, dep + 4)
      break
    }
  }
}

/** Trailing stems with small pointed leaves, hanging from a basket or over a bench edge. */
function strands(b: Builder, r: Rand, cx: number, cy: number, S: number, dep: number, near: number, n: number, lenR: [number, number], drift: number, cool: boolean, seed: number) {
  const C = b.P
  const list: Pt[][] = []
  for (let k = 0; k < n; k++) {
    const pts: Pt[] = []
    let x = cx + rr(r, -0.1, 0.1) * S
    let y = cy
    const len = rr(r, lenR[0], lenR[1]) * S
    const sway = rr(r, -0.2, 0.2) + drift
    for (let i = 0; i <= 18; i++) {
      pts.push([x, y])
      const t = i / 18
      x += Math.sin(i * 0.5 + k) * 0.005 * S + ((sway * len) / 18) * (1 - t) * 1.6
      y += (len / 18) * (0.35 + 0.65 * Math.min(1, t * 2))
    }
    list.push(pts)
  }
  const ramp0 = cool ? C.cool : C.leaf
  b.pencil.push((L, B) => {
    const r2 = rng(seed)
    for (const st of list) {
      sketch(L, B, st, { w: 0.35 + near * 0.3, col: ramp0[1], a: 0.7, dep, passes: 1, brk: 0.1 }, r2)
      for (let i = 1; i < st.length; i++) {
        if (r2() < 0.2) continue
        const sd = i % 2 ? 1 : -1
        const sz = ((0.04 * S * B.ds) / B.q) * (1 - i / 34)
        const v = 0.25 + 0.55 * r2()
        const a = Math.PI / 2 + sd * 1.0 + rr(r2, -0.4, 0.4)
        const x = st[i][0] + Math.cos(a) * 0.014 * S
        const y = st[i][1] + Math.sin(a) * 0.014 * S
        if (depAtDev(B, dX(B, x), dY(B, y)) > dep + 6) continue
        const col = cool && r2() < 0.3 ? mix(C.bloom[1], C.cool[0], 0.5) : ramp(ramp0, v)
        hatchedLeaf(L, B, x, y, a, sz, sz * 0.36, pick(B.box, ...col, r2), 0.9, r2)
        if (sz > 5) mark(L, B, x, y, a, sz * 0.65, sz * 0.06, mix(C.chalk, ramp0[2], 0.4), 0.5, r2)
      }
    }
  })
}

/** The watering can, standing in a puddle in the aisle. Drawn facing right, local units are metres. */
function wateringCan(b: Builder, X: number, Z: number, r: Rand, reflect: boolean) {
  const C = b.P
  const sc = scl(Z)
  const [bx, by] = P(X, 0, Z)
  const flip = reflect ? -1 : 1
  const T = (u: number, v: number): Pt => [bx + u * sc, by - v * sc * flip]
  const dep = depOf(Z) + 6
  const R0 = 0.13
  const H0 = 0.25
  const ky = clamp((CY - H0) / Z, 0.1, 0.7)
  const lit = b.light
  const alpha = reflect ? 0.42 : 1
  const g = b.col.createLinearGradient(bx - R0 * sc * lit, 0, bx + R0 * sc * lit, 0)
  g.addColorStop(0, css(C.can[0], alpha))
  g.addColorStop(0.5, css(C.can[1], alpha))
  g.addColorStop(0.85, css(C.can[2], alpha))
  g.addColorStop(1, css(C.can[1], alpha))
  // spout (behind the body on the far side, drawn first)
  const sp0 = T(0.1, 0.04)
  const sp1 = T(0.43, 0.31)
  const sa = lineAng(sp0, sp1)
  const nx = -Math.sin(sa)
  const ny = Math.cos(sa)
  const w0 = 0.022 * sc
  const w1 = 0.011 * sc
  const spout = poly([[sp0[0] + nx * w0, sp0[1] + ny * w0], [sp1[0] + nx * w1, sp1[1] + ny * w1], [sp1[0] - nx * w1, sp1[1] - ny * w1], [sp0[0] - nx * w0, sp0[1] - ny * w0]])
  if (reflect) tint(b, spout, css(C.can[1], alpha))
  else region(b, spout, css(C.can[1]), sa, 0.1, dep)
  // the rose
  const rose = new Path2D()
  rose.ellipse(sp1[0] + Math.cos(sa) * 0.012 * sc, sp1[1] + Math.sin(sa) * 0.012 * sc, 0.022 * sc, 0.04 * sc, sa, 0, TAU)
  if (reflect) tint(b, rose, css(C.can[2], alpha))
  else region(b, rose, css(mix(C.can[2], C.sun, 0.2)), sa + Math.PI / 2, 0.1, dep + 1)
  // body
  const body = new Path2D()
  const [tl, tr] = [T(-R0, H0), T(R0, H0)]
  const [bl, br] = [T(-R0, 0), T(R0, 0)]
  body.moveTo(tl[0], tl[1])
  body.lineTo(bl[0], bl[1])
  body.ellipse(bx, by, R0 * sc, R0 * sc * ky * 0.8, 0, Math.PI, 0, !reflect)
  body.lineTo(tr[0], tr[1])
  body.ellipse(T(0, H0)[0], T(0, H0)[1], R0 * sc, R0 * sc * ky, 0, 0, Math.PI, !reflect)
  body.closePath()
  if (reflect) tint(b, body, g)
  else region(b, body, g, 1.4, 0.1, dep + 1)
  if (reflect) return
  const top = new Path2D()
  top.ellipse(T(0, H0)[0], T(0, H0)[1], R0 * sc, R0 * sc * ky, 0, 0, TAU)
  region(b, top, css(mix(C.can[2], C.can[1], 0.4)), 0.1, 0.1, dep + 2)
  const hole = new Path2D()
  hole.ellipse(T(-0.04, H0)[0], T(-0.04, H0)[1] - R0 * sc * ky * 0.2, R0 * sc * 0.55, R0 * sc * ky * 0.5, 0, 0, TAU)
  region(b, hole, css(mix(C.can[0], C.under, 0.6)), 0.1, 0.1, dep + 3)
  // handles: a bow over the top and one at the back
  const bow: Pt[] = []
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI
    bow.push(T(-0.02 + Math.cos(a) * 0.11, H0 + 0.01 + -Math.sin(a) * 0.13))
  }
  const backH: Pt[] = []
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI / 2 + (i / 12) * Math.PI
    backH.push(T(-R0 + Math.cos(a) * 0.06, 0.15 + Math.sin(a) * 0.08))
  }
  const seed = Math.floor(r() * 1e6)
  const S2 = sc
  b.pastel.push((L, B) => {
    const r2 = rng(seed + 7)
    for (const hd of [bow, backH]) sketch(L, B, hd, { w: (0.012 * S2 * B.ds) / B.q, col: C.can[1], a: 0.95, dep: dep + 4, passes: 1, taper: 0.05, brk: 0, over: 0 }, r2)
  })
  b.conte.push((L, B) => {
    const r2 = rng(seed)
    const cw = 1.3
    sketch(L, B, [tl, bl], { w: cw, col: C.conte, a: 0.8, dep: dep + 4 }, r2)
    sketch(L, B, [tr, br], { w: cw * 0.8, col: C.conte, a: 0.7, dep: dep + 4 }, r2)
    const arc: Pt[] = []
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI
      arc.push([bx + Math.cos(a) * R0 * sc, by + Math.sin(a) * R0 * sc * ky * 0.8])
    }
    sketch(L, B, arc, { w: cw, col: C.conte, a: 0.8, dep: dep + 4 }, r2)
    const tarc: Pt[] = []
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * TAU
      tarc.push([T(0, H0)[0] + Math.cos(a) * R0 * sc, T(0, H0)[1] + Math.sin(a) * R0 * sc * ky])
    }
    sketch(L, B, tarc, { w: cw * 0.8, col: C.conte, a: 0.7, dep: dep + 4, brk: 0.2 }, r2)
    sketch(L, B, [[sp0[0] + nx * w0, sp0[1] + ny * w0], [sp1[0] + nx * w1, sp1[1] + ny * w1]], { w: 0.9, col: C.conte, a: 0.75, dep: dep + 4 }, r2)
    sketch(L, B, [[sp0[0] - nx * w0, sp0[1] - ny * w0], [sp1[0] - nx * w1, sp1[1] - ny * w1]], { w: 0.8, col: C.conte, a: 0.6, dep: dep + 4 }, r2)
    for (const hd of [bow, backH]) sketch(L, B, hd, { w: 0.9, col: C.conte, a: 0.65, dep: dep + 5, brk: 0.3 }, r2)
    // a band riveted round the middle
    const band: Pt[] = []
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI
      band.push([bx + Math.cos(a) * R0 * sc, by - 0.1 * sc + Math.sin(a) * R0 * sc * ky * 0.85])
    }
    sketch(L, B, band, { w: 0.8, col: mix(C.conte, C.can[0], 0.4), a: 0.6, dep: dep + 4, brk: 0.3 }, r2)
  })
  b.chalk.push((L, B) => {
    const r2 = rng(seed + 1)
    const x = bx + R0 * sc * 0.55 * lit
    sketch(L, B, [[x, T(0, H0 * 0.92)[1]], [x + 0.004 * sc * lit, T(0, 0.04)[1]]], { w: (0.012 * sc * B.ds) / B.q, col: mix(C.chalk, C.sun, 0.2), a: 0.75, dep: dep + 4, passes: 2, brk: 0.6 }, r2)
    sketch(L, B, bow.slice(3, 10), { w: 1.1, col: C.chalk, a: 0.7, dep: dep + 5, passes: 1 }, r2)
    // the holes in the rose catch light
    const rc = [sp1[0] + Math.cos(sa) * 0.014 * sc, sp1[1] + Math.sin(sa) * 0.014 * sc]
    for (let k = 0; k < 9; k++) {
      const a = r2() * TAU
      const d = Math.sqrt(r2()) * 0.03 * sc
      mark(L, B, rc[0] + Math.cos(a) * d * 0.5, rc[1] + Math.sin(a) * d, 0, 1.4, 0.9, k % 2 ? C.conte : C.chalk, 0.8, r2)
    }
    // drips still on the can
    for (let k = 0; k < 4; k++) {
      const xx = bx + rr(r2, -0.8, 0.8) * R0 * sc
      const yy = by - rr(r2, 0.05, 0.2) * sc
      mark(L, B, xx, yy, Math.PI / 2, 4, 1.1, C.chalk, 0.8, r2)
    }
  })
}

/* ---- light through the roof ---- */

function makeShafts(b: Builder, r: Rand) {
  const d = b.P.sunDir
  const dl = Math.hypot(...d)
  const dx = d[0] / dl
  const dy = d[1] / dl
  const dz = d[2] / dl
  const side = dx < 0 ? 1 : -1
  const bays = [[1.55, 2.1], [2.65, 3.2], [3.75, 4.3], [4.85, 5.4]]
  const bands: [number, number][] = [[0.04, 0.33], [0.39, 0.67]]
  for (const [za, zb] of bays) {
    const [s0, s1] = bands[(b.shafts.length + (r() < 0.8 ? 0 : 1)) % 2]
    const corners: V3[] = [
      [side * GW * (1 - s0), HE + (HR - HE) * s0, za + 0.06],
      [side * GW * (1 - s1), HE + (HR - HE) * s1, za + 0.06],
      [side * GW * (1 - s1), HE + (HR - HE) * s1, zb - 0.06],
      [side * GW * (1 - s0), HE + (HR - HE) * s0, zb - 0.06],
    ]
    const hits: V3[] = corners.map(([X, Y, Z]) => {
      let t = Y / -dy
      let hx0 = X + dx * t
      let hz = Z + dz * t
      let hy = 0
      if (Math.abs(hx0) > AW) {
        const t2 = (Y - HB) / -dy
        const x2 = X + dx * t2
        if (Math.abs(x2) > AW) {
          t = t2
          hx0 = x2
          hz = Z + dz * t2
          hy = HB
        }
      }
      return [hx0, hy, Math.max(1.05, hz)]
    })
    const top = corners.map((c) => P(...c))
    const foot = hits.map((c) => P(...c))
    const hl = hull(top.concat(foot))
    const cen = (ps: Pt[]): Pt => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length]
    b.shafts.push({ hull: hl, top: cen(top), bot: cen(foot), foot, a: rr(r, 0.65, 1) })
  }
}

function paintShaftsIntoMaps(b: Builder) {
  const C = b.P
  const k = b.R.shafts
  if (k < 0.01) return
  b.col.save()
  b.col.globalCompositeOperation = "screen"
  for (const s of b.shafts) {
    const g = b.col.createLinearGradient(s.top[0], s.top[1], s.bot[0], s.bot[1])
    g.addColorStop(0, css(C.sun, 0.42 * k * s.a))
    g.addColorStop(1, css(C.sun, 0.1 * k * s.a))
    b.col.fillStyle = g
    b.col.fill(poly(s.hull))
    b.col.fillStyle = css(C.sun, 0.5 * k * s.a)
    b.col.fill(poly(s.foot))
  }
  b.col.restore()
  for (const s of b.shafts) glow(b, poly(s.foot), 0.5 * k * s.a)
}

/* ---- puddles: the room mirrored in water ---- */

function puddles(b: Builder, r: Rand, view: { x0: number; x1: number }) {
  const C = b.P
  const R = b.R
  const n = Math.round(2 + 5 * R.wet)
  const list: { X: number; Z: number; rx: number; rz: number }[] = [{ X: CAN[0] + 0.08, Z: CAN[1] + 0.06, rx: 0.36, rz: 0.24 }]
  for (let i = 0; i < n; i++) list.push({ X: rr(r, -0.55, 0.55), Z: rr(r, 1.5, 5.2), rx: rr(r, 0.14, 0.4), rz: rr(r, 0.12, 0.4) })
  if (R.wet < 0.15) list.length = 1
  const tmp = mk(b.colC.width, b.colC.height)
  const tc = ctx2(tmp)
  tc.drawImage(b.colC as CanvasImageSource, 0, 0)
  const T = b.col.getTransform()
  const ym = yFloor(ZB) - 0.004
  const ymRef = T.d * ym + T.f
  // the whole floor shines a little
  const aisle = poly([P(-AW, 0, ZN), P(AW, 0, ZN), P(AW, 0, ZB), P(-AW, 0, ZB)])
  const mirror = (clip: Path2D, a: number) => {
    b.col.save()
    b.col.clip(clip)
    b.col.setTransform(1, 0, 0, -1, 0, 2 * ymRef)
    b.col.globalAlpha = a
    b.col.drawImage(tmp as CanvasImageSource, 0, 0)
    b.col.restore()
  }
  mirror(aisle, 0.16 + 0.12 * R.wet)
  void view
  const pts: Pt[][] = []
  for (const pd of list) {
    const ring: Pt[] = []
    const m = 22
    const ph = r() * 10
    for (let i = 0; i < m; i++) {
      const a = (i / m) * TAU
      const k = 0.78 + 0.3 * vn(Math.cos(a) * 1.5 + ph, Math.sin(a) * 1.5, 9) + 0.08 * r()
      ring.push(P(pd.X + Math.cos(a) * pd.rx * k, 0, pd.Z + Math.sin(a) * pd.rz * k))
    }
    pts.push(ring)
    const pth = poly(ring)
    mirror(pth, 0.9)
    b.col.save()
    b.col.globalCompositeOperation = "screen"
    b.col.fillStyle = css(mix(C.sky[0], C.sky[1], 0.4), 0.45)
    b.col.fill(pth)
    b.col.restore()
    b.col.strokeStyle = css(mix(C.tileA, C.shade, 0.55), 0.8)
    b.col.lineWidth = 0.004
    b.col.stroke(pth)
    b.att.fillStyle = attCss(Math.PI / 2, 0.55)
    b.att.fill(pth)
    b.hi.strokeStyle = "rgba(255,255,255,.35)"
    b.hi.lineWidth = 0.003
    b.hi.stroke(pth)
  }
  const seed = Math.floor(r() * 1e6)
  b.chalk.push((L, B) => {
    const r2 = rng(seed)
    for (const ring of pts) {
      let x0 = 1e9
      let x1 = -1e9
      let y0 = 1e9
      let y1 = -1e9
      for (const [x, y] of ring) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
      for (let k = 0; k < 22; k++) {
        const x = rr(r2, x0, x1)
        const y = rr(r2, y0, lerp(y0, y1, 0.6))
        if (!pointIn(ring, x, y)) continue
        mark(L, B, x, y, rr(r2, -0.05, 0.05), rr(r2, 6, 22), rr(r2, 0.6, 1.2), C.chalk, rr(r2, 0.4, 0.8), r2)
      }
    }
  })
}

/* ---- rain on the glass ---- */

function rain(b: Builder, r: Rand) {
  const C = b.P
  const wet = b.R.wet
  if (wet < 0.03) return
  const drops: { x: number; y: number; s: number; dp: number }[] = []
  const trails: { pts: Pt[]; dp: number; s: number }[] = []
  const n = Math.round(1300 * wet)
  for (let i = 0; i < n; i++) {
    const roof = r() < 0.55
    const Z = ZN + Math.pow(r(), 1.3) * (ZB - ZN)
    let X: number
    let Y: number
    if (roof) {
      const side = r() < 0.5 ? -1 : 1
      const s = r()
      X = side * GW * (1 - s)
      Y = HE + (HR - HE) * s
    } else {
      X = r() < 0.5 ? -GW : GW
      Y = rr(r, HB + 0.05, HE)
    }
    const [x, y] = P(X, Y, Z)
    drops.push({ x, y, s: rr(r, 0.006, 0.016) * scl(Z), dp: depOf(Z) + 1 })
  }
  for (let i = 0; i < Math.round(60 * wet); i++) {
    const X = r() < 0.5 ? -GW : GW
    const Z = rr(r, 1.4, 5)
    let Y = rr(r, 1.2, HE - 0.05)
    const pts: Pt[] = []
    let dxx = 0
    const len = rr(r, 0.2, 0.7)
    for (let k = 0; k < 14; k++) {
      pts.push(P(X, Y, Z + dxx))
      Y -= len / 14
      dxx += rr(r, -0.012, 0.012)
      if (Y < HB) break
    }
    trails.push({ pts, dp: depOf(Z) + 1, s: scl(Z) })
  }
  const seed = Math.floor(r() * 1e6)
  b.pencil.push((L, B) => {
    const r2 = rng(seed)
    for (const t of trails) sketch(L, B, t.pts, { w: 0.4 + t.s * 2, col: mix(C.outside[0], C.shade, 0.3), a: 0.38, dep: t.dp, passes: 1, brk: 0.2 }, r2)
    for (const d of drops) {
      const s = (d.s * B.ds) / B.q
      if (s < 0.6 || depAtDev(B, dX(B, d.x), dY(B, d.y)) > d.dp + 3) continue
      mark(L, B, d.x, d.y + d.s * 0.3, 0.1, s * 1.6, Math.max(0.35, s * 0.32), mix(C.shade, C.outside[0], 0.3), 0.5, r2)
    }
  })
  b.chalk.push((L, B) => {
    const r2 = rng(seed + 1)
    for (const t of trails) {
      const e = t.pts[t.pts.length - 1]
      mark(L, B, e[0], e[1], Math.PI / 2, 3 + t.s * 12, 1 + t.s * 4, C.chalk, 0.8, r2)
    }
    for (const d of drops) {
      const s = (d.s * B.ds) / B.q
      if (s < 0.6 || depAtDev(B, dX(B, d.x), dY(B, d.y)) > d.dp + 3) continue
      mark(L, B, d.x - d.s * 0.25, d.y - d.s * 0.3, -0.6, Math.max(1, s * 0.9), Math.max(0.4, s * 0.35), C.chalk, 0.85, r2)
    }
  })
}

/** Plants, hanging baskets and floor things; sorted far to near and painted. */
function buildPlants(b: Builder, r: Rand, view: { x0: number; x1: number }) {
  const items: (Plant & { fn?: () => void })[] = []
  type Row = { off: [number, number]; kinds: [string, number][]; step: [number, number]; pot: [number, number]; s: [number, number] }
  const rows: Row[] = [
    { off: [0.1, 0.28], kinds: [["succulent", 8], ["cactus", 7], ["herb", 8], ["geranium", 8], ["trail", 24], ["seedlings", 5], ["begonia", 5]], step: [0.2, 0.32], pot: [0.06, 0.1], s: [0.8, 1.05] },
    { off: [0.38, 0.68], kinds: [["fern", 14], ["geranium", 10], ["begonia", 9], ["spider", 8], ["herb", 5], ["monstera", 4], ["cane", 4]], step: [0.24, 0.38], pot: [0.08, 0.13], s: [0.9, 1.2] },
    { off: [0.82, 1.12], kinds: [["banana", 5], ["palm", 8], ["monstera", 6], ["fern", 5], ["cane", 7]], step: [0.34, 0.55], pot: [0.12, 0.17], s: [1, 1.3] },
  ]
  for (const s of [-1, 1]) {
    for (const row of rows) {
      const tot = row.kinds.reduce((t, k) => t + k[1], 0)
      let Z = 0.42 + r() * 0.2
      while (Z < ZB - 0.35) {
        let v = r() * tot
        let kind = row.kinds[0][0]
        for (const [k, w] of row.kinds) if ((v -= w) < 0) { kind = k; break }
        const X = s * (AW + rr(r, row.off[0], row.off[1]))
        items.push({ kind, X, Y: HB, Z, s: rr(r, row.s[0], row.s[1]), seed: Math.floor(r() * 1e6), pot: kind === "seedlings" ? 0 : rr(r, row.pot[0], row.pot[1]) })
        Z += rr(r, row.step[0], row.step[1]) * (kind === "seedlings" ? 1.8 : 1)
      }
    }
  }
  // the ones nearest the eye
  items.push({ kind: "fern", X: -0.86, Y: HB, Z: 0.72, s: 0.9, seed: Math.floor(r() * 1e6), pot: 0.1 })
  // right at the eye, cropped by the frame
  items.push({ kind: "fern", X: -0.74, Y: HB, Z: 0.62, s: 0.75, seed: Math.floor(r() * 1e6), pot: 0.09 })
  items.push({ kind: "monstera", X: 0.76, Y: HB, Z: 0.46, s: 0.5, seed: Math.floor(r() * 1e6), pot: 0.1 })
  items.push({ kind: "trail", X: -0.8, Y: HB, Z: 0.5, s: 0.9, seed: Math.floor(r() * 1e6), pot: 0.08 })
  items.push({ kind: "begonia", X: 0.84, Y: HB, Z: 0.7, s: 1.05, seed: Math.floor(r() * 1e6), pot: 0.09 })
  items.push({ kind: "spider", X: 0.8, Y: HB, Z: 0.48, s: 0.85, seed: Math.floor(r() * 1e6), pot: 0.08 })
  items.push({ kind: "monstera", X: -1.3, Y: HB, Z: 1.4, s: 1.25, seed: Math.floor(r() * 1e6), pot: 0.18 })
  items.push({ kind: "banana", X: 1.55, Y: HB, Z: 1.55, s: 1.2, seed: Math.floor(r() * 1e6), pot: 0.18 })
  items.push({ kind: "fern", X: 0.98, Y: HB, Z: 1.3, s: 1.15, seed: Math.floor(r() * 1e6), pot: 0.12 })
  items.push({ kind: "trail", X: -0.86, Y: HB, Z: 1.62, s: 1.1, seed: Math.floor(r() * 1e6), pot: 0.09 })
  // floor things
  items.push({ kind: "lemon", X: 0.42, Y: 0, Z: 5.7, s: 1.15, seed: Math.floor(r() * 1e6), pot: 0.2 })
  items.push({ kind: "palm", X: -0.5, Y: 0, Z: 4.6, s: 1.35, seed: Math.floor(r() * 1e6), pot: 0.17 })
  // hanging baskets
  items.push({ kind: "ivy", X: -0.38, Y: 1.85, Z: 2.6, s: 1, seed: Math.floor(r() * 1e6), pot: 0 })
  items.push({ kind: "ivy", X: 0.42, Y: 1.95, Z: 3.9, s: 0.95, seed: Math.floor(r() * 1e6), pot: 0 })
  items.push({ kind: "ivy", X: -0.25, Y: 2.0, Z: 5.4, s: 0.9, seed: Math.floor(r() * 1e6), pot: 0 })
  // a stack of spare pots by the left bench
  const rP = rng(Math.floor(r() * 1e6))
  items.push({ kind: "stack", X: -0.55, Y: 0, Z: 2.7, s: 1, seed: 0, pot: 0, fn: () => {
    for (let k = 0; k < 4; k++) pot(b, -0.55, k * 0.06, 2.7, 0.1, 0.11, rP)
  } })
  const rC = rng(Math.floor(r() * 1e6))
  items.push({ kind: "puddles", X: 0, Y: 0, Z: 2.2, s: 1, seed: 0, pot: 0, fn: () => {
    puddles(b, rC, view)
    wateringCan(b, CAN[0], CAN[1], rng(b.R.seed + 5), true)
  } })
  const rW = rng(Math.floor(r() * 1e6))
  items.push({ kind: "can", X: CAN[0], Y: 0, Z: CAN[1], s: 1, seed: 0, pot: 0, fn: () => wateringCan(b, CAN[0], CAN[1], rW, false) })
  items.sort((a, c) => c.Z - a.Z || Math.abs(c.X) - Math.abs(a.X))
  for (const it of items) {
    if (it.fn) it.fn()
    else drawPlant(b, it)
  }
}
const CAN: [number, number] = [-0.22, 1.68]

/** A climbing vine along the roof purlin on the lit side, which breaks the light into shafts. */
function vine(b: Builder, r: Rand) {
  const C = b.P
  const side = -b.light
  const pts: Pt[] = []
  for (let Z = 1.7; Z < 6.2; Z += 0.15) {
    const s = 0.36 + Math.sin(Z * 2.1) * 0.05
    pts.push(P(side * GW * (1 - s), HE + (HR - HE) * s - 0.04, Z))
  }
  const leaves: { x: number; y: number; a: number; s: number; v: number; dp: number }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const Z = 1.7 + i * 0.15
    for (let k = 0; k < 2; k++) {
      const a = rr(r, 0, TAU)
      const sc = scl(Z)
      const x = pts[i][0] + Math.cos(a) * 0.06 * sc
      const y = pts[i][1] + Math.sin(a) * 0.06 * sc + 0.03 * sc
      leaves.push({ x, y, a: Math.PI / 2 + rr(r, -0.8, 0.8), s: rr(r, 0.07, 0.12) * sc, v: 0.5 + 0.45 * r(), dp: depOf(Z) + 3 })
    }
  }
  for (const l of leaves) {
    const lf = bladePts(l.x, l.y, l.a, l.s, l.s * 0.4, 0.2, 0.2, r, 0.7)
    paintLeaf(b, lf, { v: l.v, dep: l.dp, beta: 0.7, near: 0, seed: Math.floor(r() * 1e6) })
  }
  const seed = Math.floor(r() * 1e6)
  b.pencil.push((L, B) => sketch(L, B, pts, { w: 0.8, col: C.leaf[0], a: 0.6, dep: depOf(3), passes: 1, wob: 2 }, rng(seed)))
}

/* -------------------------------------------------------------------------- */
/*                                 The bake                                   */
/* -------------------------------------------------------------------------- */

type Mote = { x: number; y: number; r: number; ph: number; m: number; a: number; spr: number }
type Drip = { pts: Pt[]; ph: number; s: number }
type Glint = { x: number; y: number; s: number; ph: number }
type Live = { motes: Mote[]; drips: Drip[]; glints: Glint[]; sprites: Cvs[]; dropSpr: Cvs | null; glintSpr: Cvs | null }

function view(w: number, h: number) {
  const S = Math.min(Math.max(h, w / 1.9), w / 0.75)
  const oy = (h - S) / 2
  return { S, oy, x0: -w / 2 / S, x1: w / 2 / S, y0: -oy / S, y1: (h - oy) / S }
}

function makeBake(w: number, h: number, DW: number, DH: number, R: Resolved): Bake {
  const P0 = PALETTES[R.palette]
  const V = view(w, h)
  const dsx = (V.S * DW) / w
  const dsy = (V.S * DH) / h
  const ds = (dsx + dsy) / 2
  const q = ds / 1080
  const lod = Math.max(1, 0.5 / q)
  // reference maps at about half the logical size
  const rs = Math.min(0.5, 1100 / w)
  const RW = Math.max(16, Math.round(w * rs))
  const RH = Math.max(16, Math.round(h * rs))
  const colC = mk(RW, RH)
  const attC = mk(RW, RH)
  const hiC = mk(RW, RH)
  const depC = mk(RW, RH)
  const cs = [colC, attC, hiC, depC].map((c) => {
    const x = ctx2(c)
    x.setTransform(V.S * rs, 0, 0, V.S * rs, (w / 2) * rs, V.oy * rs)
    return x
  })
  const b: Builder = {
    col: cs[0], att: cs[1], hi: cs[2], dep: cs[3], colC, P: P0, R,
    pencil: [], conte: [], chalk: [], pastel: [], shafts: [], light: P0.sunDir[0] < 0 ? 1 : -1,
  }
  const B: Bake = {
    w, h, S: V.S, oy: V.oy, DW, DH,
    cx0: (w / 2) * (DW / w), cy0: V.oy * (DH / h), dsx, dsy, ds, q, lod,
    vx0: V.x0, vx1: V.x1, vy0: V.y0, vy1: V.y1,
    R, P: P0, box: pencilBox(P0),
    ref: { W: RW, H: RH, ox: (w / 2) * rs, oy: V.oy * rs, k: V.S * rs, col: new Uint8ClampedArray(0), att: new Uint8ClampedArray(0), hi: new Uint8ClampedArray(0), dep: new Uint8ClampedArray(0) },
    final: mk(DW, DH), scratch: mk(DW, DH), shaftL: mk(DW, DH), paperC: mk(DW, DH), fine: mk(DW, DH), deep: mk(DW, DH),
    b, live: { motes: [], drips: [], glints: [], sprites: [], dropSpr: null, glintSpr: null },
    gen: null, done: false, stage: 0,
  }
  B.gen = bakeSteps(B, attC, hiC, depC, V)
  return B
}

function* bakeSteps(B: Bake, attC: Cvs, hiC: Cvs, depC: Cvs, V: ReturnType<typeof view>): Generator<void, void, void> {
  const { b, R, P: C } = B
  const seed = R.seed

  /* 1. lay the scene out in the maps */
  const r0 = rng(seed * 977 + 13)
  makeShafts(b, rng(seed * 31 + 7))
  buildRoom(b, r0, V)
  buildFloor(b, rng(seed * 53 + 2))
  buildBenches(b, rng(seed * 71 + 3))
  vine(b, rng(seed * 89 + 5))
  buildPlants(b, rng(seed * 97 + 1), V)
  paintShaftsIntoMaps(b)
  rain(b, rng(seed * 101 + 9))
  const rd = (c: Cvs) => ctx2(c).getImageData(0, 0, B.ref.W, B.ref.H).data
  B.ref.col = rd(b.colC)
  B.ref.att = rd(attC)
  B.ref.hi = rd(hiC)
  B.ref.dep = rd(depC)
  yield

  /* 2. paper and its tooth */
  yield* paper(B)
  const F0 = ctx2(B.final)
  F0.drawImage(B.paperC as CanvasImageSource, 0, 0)
  B.stage = 1
  yield

  const L = ctx2(B.scratch)
  const tooth = R.tooth
  const commit = (mask: Cvs, k: number) => {
    if (k > 0.001) {
      L.save()
      L.globalCompositeOperation = "destination-out"
      L.globalAlpha = Math.min(1, k)
      L.drawImage(mask as CanvasImageSource, 0, 0)
      L.restore()
    }
    F0.drawImage(B.scratch as CanvasImageSource, 0, 0)
    L.clearRect(0, 0, B.DW, B.DH)
  }

  /* 3. soft pastel block-in: broad, waxy, broken by the tooth */
  yield* hatch(B, L, {
    id: 1, grid: 11, k: [1, 2], gap: 6, len: [18, 42], wid: [3.6, 6.5], alpha: [0.6, 0.85], angle: 0.08, jitter: 0.35, edge: 90,
    prob: (s) => 0.82 + 0.3 * s.ink,
    colour: (s) => ext(C.paper, s, 1.06),
    tool: "pastel",
  })
  for (const j of b.pastel) j(L, B)
  commit(B.deep, 0.35 + 0.75 * tooth)
  B.stage = 2
  yield

  /* 4. coloured pencil: a cool shadow layer cross-hatched, then local colour, then warm lights */
  yield* hatch(B, L, {
    id: 2, grid: 11, k: [3, 6], gap: 2.7, len: [9, 22], wid: [0.65, 1], alpha: [0.5, 0.8], angle: 0.75, jitter: 0.25, edge: 70,
    prob: (s) => smooth(0.35, 0.9, 1 - s.lum) * 0.95,
    colour: (s, r) => pick(B.box, ...mix(mix([s.r, s.g, s.b], C.shade, 0.45), [0, 0, 0], 0.18), r),
    tool: "pencil",
  })
  yield* hatch(B, L, {
    id: 3, grid: 7, k: [4, 7], gap: 2.4, len: [8, 20], wid: [0.6, 0.95], alpha: [0.7, 0.95], angle: 0, jitter: 0.3, edge: 55,
    prob: (s) => 0.5 + 0.65 * s.ink,
    colour: (s, r) => pick(B.box, ...sat(ext(C.paper, s, 1.22), 1.18), r),
    tool: "pencil",
  })
  // saturated accents, warm in the light and cool in the shade, like the odd pencil reached for out of order
  yield* hatch(B, L, {
    id: 7, grid: 15, k: [2, 4], gap: 2.6, len: [7, 16], wid: [0.6, 0.9], alpha: [0.7, 0.95], angle: 0.3, jitter: 0.4, edge: 55,
    prob: (s) => 0.25 + 0.3 * s.ink,
    colour: (s, r) => {
      const c = sat([s.r, s.g, s.b], 1.6)
      return pick(B.box, ...mix(c, s.lum > 0.55 ? C.sun : C.shade, 0.22), r)
    },
    tool: "pencil",
  })
  yield* hatch(B, L, {
    id: 4, grid: 12, k: [2, 5], gap: 2.6, len: [6, 15], wid: [0.55, 0.85], alpha: [0.45, 0.75], angle: -0.4, jitter: 0.3, edge: 55,
    prob: (s) => smooth(0.5, 0.85, s.lum) * 0.8 + s.hi * 0.4,
    colour: (s, r) => pick(B.box, ...mix([s.r, s.g, s.b], C.sun, 0.35), r),
    tool: "pencil",
  })
  for (let i = 0; i < b.pencil.length; i++) {
    b.pencil[i](L, B)
    if (i % 40 === 39) yield
  }
  commit(B.fine, 0.2 + 0.5 * tooth)
  B.stage = 3
  yield

  /* 5. conté: the darkest darks, grainy, and the contours of near things */
  yield* hatch(B, L, {
    id: 5, grid: 12, k: [2, 4], gap: 3.2, len: [8, 18], wid: [0.9, 1.5], alpha: [0.55, 0.85], angle: 0.35, jitter: 0.3, edge: 60,
    prob: (s) => smooth(0.3, 0.12, s.lum) * 0.9,
    colour: (s) => mix(C.conte, [s.r, s.g, s.b], 0.25),
    tool: "conte",
  })
  for (const j of b.conte) j(L, B)
  commit(B.deep, 0.25 + 0.6 * tooth)
  B.stage = 4
  yield

  /* 6. chalk: wet glints, rims, droplets */
  yield* hatch(B, L, {
    id: 6, grid: 10, k: [1, 3], gap: 3, len: [5, 14], wid: [0.9, 1.8], alpha: [0.35, 0.7], angle: -0.2, jitter: 0.3, edge: 0,
    prob: (s) => s.hi * 0.9,
    colour: (s) => mix(C.chalk, [s.r, s.g, s.b], 0.2),
    tool: "pencil",
  })
  for (const j of b.chalk) j(L, B)
  commit(B.deep, 0.3 + 0.6 * tooth)
  B.stage = 5
  yield

  /* 7. the shafts of light, on their own layer so they can breathe */
  const SL = ctx2(B.shaftL)
  shaftMarks(B, SL)
  SL.save()
  SL.globalCompositeOperation = "destination-out"
  SL.globalAlpha = Math.min(1, 0.25 + 0.45 * tooth)
  SL.drawImage(B.deep as CanvasImageSource, 0, 0)
  SL.restore()

  /* 8. ink sinks into the paper: a light multiply of the sheet over everything */
  F0.save()
  F0.globalCompositeOperation = "multiply"
  F0.globalAlpha = 0.45
  F0.drawImage(B.paperC as CanvasImageSource, 0, 0)
  F0.restore()

  makeLive(B)
  B.stage = 6
  B.done = true
}

function* paper(B: Bake): Generator<void, void, void> {
  const { DW, DH, q, R } = B
  const P0 = B.P.paper
  const pc = ctx2(B.paperC)
  const img = pc.createImageData(DW, DH)
  const fi = pc.createImageData(DW, DH)
  const di = pc.createImageData(DW, DH)
  const s = R.seed * 7 + 3
  const k1 = 1 / (1.35 * q)
  const k2 = 1 / (3.2 * q)
  const k3 = 1 / (9 * q)
  const km = 1 / (180 * q)
  const tooth = R.tooth
  for (let y = 0; y < DH; y++) {
    for (let x = 0; x < DW; x++) {
      const t = 0.52 * vn(x * k1, y * k1 * 1.15, s) + 0.3 * vn(x * k2, y * k2, s + 1) + 0.18 * vn(x * k3 * 0.6, y * k3, s + 2)
      const m = vn(x * km, y * km, s + 3)
      const i = (y * DW + x) * 4
      const g = (t - 0.5) * 16 * (0.4 + tooth) + (m - 0.5) * 9
      img.data[i] = P0[0] + g
      img.data[i + 1] = P0[1] + g
      img.data[i + 2] = P0[2] + g * 1.1
      img.data[i + 3] = 255
      fi.data[i + 3] = clamp((0.46 - t) / 0.13, 0, 1) * 255
      di.data[i + 3] = clamp((0.52 - t) / 0.13, 0, 1) * 255
    }
    if (y % 160 === 159) yield
  }
  pc.putImageData(img, 0, 0)
  ctx2(B.fine).putImageData(fi, 0, 0)
  ctx2(B.deep).putImageData(di, 0, 0)
  // fibres
  const r = rng(R.seed * 3 + 1)
  const n = Math.round((DW * DH) / (7000 * q * q))
  pc.lineCap = "round"
  for (let i = 0; i < n; i++) {
    const x = r() * DW
    const y = r() * DH
    const a = r() * TAU
    const l = (6 + 18 * r()) * q
    pc.strokeStyle = r() < 0.6 ? "rgba(120,100,80,.07)" : "rgba(255,255,255,.22)"
    pc.lineWidth = 0.6 * q
    pc.beginPath()
    pc.moveTo(x, y)
    pc.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 5 * q, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 5 * q, x + Math.cos(a) * l, y + Math.sin(a) * l)
    pc.stroke()
  }
}

type HatchOpt = {
  id: number
  grid: number
  k: [number, number]
  gap: number
  len: [number, number]
  wid: [number, number]
  alpha: [number, number]
  angle: number
  jitter: number
  edge: number
  prob: (s: Smp) => number
  colour: (s: Smp, r: Rand) => RGB
  tool: "pastel" | "pencil" | "conte"
}

const SM2: Smp = { ...SM }

/** One layer of hatching over the whole picture, read from the maps: patches of parallel marks. Sizes in design px. */
function* hatch(B: Bake, L: Ctx, o: HatchOpt): Generator<void, void, void> {
  const seed = B.R.seed
  const dens = B.R.density
  const g = (o.grid * B.lod) / Math.sqrt(dens) / 1080
  const i0 = Math.floor(B.vx0 / g) - 2
  const i1 = Math.ceil(B.vx1 / g) + 2
  const j0 = Math.floor(B.vy0 / g) - 2
  const j1 = Math.ceil(B.vy1 / g) + 2
  const cells: number[] = []
  const keys: number[] = []
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      cells.push(i, j)
      keys.push(h2(i, j, seed * 131 + o.id))
    }
  }
  const order = Array.from({ length: keys.length }, (_, i) => i).sort((a, b) => keys[a] - keys[b])
  const q = B.q * B.lod
  const D = 1 / 1080
  const s = SM
  const t = SM2
  let n = 0
  for (const oi of order) {
    const ci = cells[oi * 2]
    const cj = cells[oi * 2 + 1]
    const r = rng(Math.floor(keys[oi] * 4294967296) ^ (o.id * 7919))
    const x = (ci + r()) * g
    const y = (cj + r()) * g
    if (!sample(B, x, y, s)) continue
    if (r() > o.prob(s)) continue
    const ang = s.ang + o.angle + (vn(x * 7, y * 7, o.id + 40) - 0.5) * 2 * o.jitter + (r() - 0.5) * 0.12
    const ux = Math.cos(ang)
    const uy = Math.sin(ang)
    const nx = -uy
    const ny = ux
    const k = o.k[0] + Math.floor(r() * (o.k[1] - o.k[0] + 1))
    const hl = rr(r, o.len[0], o.len[1]) * 0.5
    const hw = rr(r, o.wid[0], o.wid[1])
    const gap = o.gap * rr(r, 0.85, 1.2)
    const col = o.colour(s, r)
    const a = rr(r, o.alpha[0], o.alpha[1])
    const sd = s.dep
    const sr = s.r
    const sg = s.g
    const sb = s.b
    const same = (xx: number, yy: number) => {
      if (!sample(B, xx, yy, t)) return false
      if (Math.abs(t.dep - sd) > 6) return false
      return !o.edge || Math.abs(t.r - sr) + Math.abs(t.g - sg) + Math.abs(t.b - sb) < o.edge
    }
    L.beginPath()
    for (let m = 0; m < k; m++) {
      const off = (m - (k - 1) / 2) * gap + (r() - 0.5) * gap * 0.35
      const sl = hl * rr(r, 0.65, 1.2)
      const sh = (r() - 0.5) * hl * 0.5
      const cx = x + (nx * off + ux * sh) * D
      const cy = y + (ny * off + uy * sh) * D
      if (m !== 0 && (k > 1) && !same(cx, cy)) continue
      let ea = sl
      let eb = sl
      if (!same(cx - ux * ea * D, cy - uy * ea * D)) ea *= 0.4
      if (!same(cx + ux * eb * D, cy + uy * eb * D)) eb *= 0.4
      const X = dX(B, cx)
      const Y = dY(B, cy)
      if (o.tool === "conte") stick(L, X, Y, ux, uy, ea * q, eb * q, hw * q)
      else lens(L, X, Y, ux, uy, ea * q, eb * q, hw * q * rr(r, 0.85, 1.15), (r() - 0.5) * hw * q * 1.4)
    }
    L.fillStyle = css(col, a)
    L.fill()
    if (o.tool === "pastel") {
      // waxy streaks dragged along the mark
      L.beginPath()
      const so = (r() - 0.5) * hw * 0.8
      lens(L, dX(B, x + nx * so * D), dY(B, y + ny * so * D), ux, uy, hl * q * 0.8, hl * q * 0.9, hw * q * 0.35, 0)
      L.fillStyle = css(mix(col, r() < 0.5 ? WHITE : C0(B), 0.18), a * 0.7)
      L.fill()
    }
    if (++n % 700 === 0) yield
  }
}
const C0 = (B: Bake) => B.P.shade
/** Push a colour away from the paper so partly covered marks still add up to it. */
const ext = (p: RGB, s: Smp, k: number): RGB => [p[0] + (s.r - p[0]) * k, p[1] + (s.g - p[1]) * k, p[2] + (s.b - p[2]) * k]
const sat = (c: RGB, k: number): RGB => {
  const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
  return [l + (c[0] - l) * k, l + (c[1] - l) * k, l + (c[2] - l) * k]
}

/** The light shafts: long, faint chalk strokes along the beam, densest at the roof. */
function shaftMarks(B: Bake, L: Ctx) {
  const k = B.R.shafts
  if (k < 0.01) return
  const C = B.P
  const r = rng(B.R.seed * 211 + 5)
  for (const s of B.b.shafts) {
    let x0 = 1e9
    let x1 = -1e9
    let y0 = 1e9
    let y1 = -1e9
    for (const [x, y] of s.hull) {
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
    }
    const ang = lineAng(s.top, s.bot)
    const ux = Math.cos(ang)
    const uy = Math.sin(ang)
    const span = Math.hypot(s.bot[0] - s.top[0], s.bot[1] - s.top[1])
    const area = (x1 - x0) * (y1 - y0)
    const n = Math.round(area * 1080 * 1080 * 0.009 * k * B.R.density / (B.lod * B.lod))
    for (let i = 0; i < n; i++) {
      const x = rr(r, x0, x1)
      const y = rr(r, y0, y1)
      if (!pointIn(s.hull, x, y)) continue
      const along = clamp(((x - s.top[0]) * ux + (y - s.top[1]) * uy) / span, 0, 1)
      const across = (x - s.top[0]) * -uy + (y - s.top[1]) * ux
      const ray = 0.35 + 0.65 * smooth(0.35, 0.7, vn(across * 60, 0.5, 31 + Math.round(s.a * 100)))
      const fade = ((1 - along) ** 1.2 * 0.8 + 0.2) * ray
      if (r() > fade) continue
      // mostly broad, soft pastel side-strokes laid along the beam; a few chalk edges
      const kind = r()
      const long = kind < 0.04
      const soft = kind > 0.3
      if (!soft && !long && r() < 0.6) continue
      const len = (long ? rr(r, 40, 90) : soft ? rr(r, 40, 120) : rr(r, 18, 44)) * B.q * B.lod
      const hw = (long ? rr(r, 0.8, 1.4) : soft ? rr(r, 6, 14) : rr(r, 2, 4)) * B.q * B.lod
      L.beginPath()
      lens(L, dX(B, x), dY(B, y), ux, uy, len * 0.5, len * 0.5, hw, 0)
      L.fillStyle = css(mix(C.sun, C.chalk, rr(r, 0.1, 0.5)), (long ? 0.3 : soft ? 0.12 : 0.24) * k * s.a * rr(r, 0.6, 1.2))
      L.fill()
    }
    // a warm pool where it lands
    for (let i = 0; i < 160 * k; i++) {
      const [fx0, fy0] = s.foot[0]
      const [fx1, fy1] = s.foot[2]
      const u = r()
      const v = r()
      const x = lerp(lerp(fx0, s.foot[1][0], u), lerp(s.foot[3][0], fx1, u), v)
      const y = lerp(lerp(fy0, s.foot[1][1], u), lerp(s.foot[3][1], fy1, u), v)
      L.beginPath()
      lens(L, dX(B, x), dY(B, y), 1, 0.05, rr(r, 8, 22) * B.q, rr(r, 8, 22) * B.q, rr(r, 2, 4) * B.q, 0)
      L.fillStyle = css(mix(C.chalk, C.sun, 0.55), 0.3 * k * s.a)
      L.fill()
    }
  }
}

/* ---- the live layer: dust in the light, a drip sliding down the glass, glints on the water ---- */

function speck(q: number, rad: number, col: RGB, seed: number): Cvs {
  const s = Math.max(4, Math.ceil(rad * 2 * q + 4))
  const c = mk(s, s)
  const x = ctx2(c)
  const r = rng(seed)
  for (let i = 0; i < 7; i++) {
    x.beginPath()
    x.arc(s / 2 + (r() - 0.5) * rad * q * 0.8, s / 2 + (r() - 0.5) * rad * q * 0.8, rad * q * rr(r, 0.35, 0.75), 0, TAU)
    x.fillStyle = css(col, rr(r, 0.25, 0.6))
    x.fill()
  }
  return c
}

function makeLive(B: Bake) {
  const C = B.P
  const r = rng(B.R.seed * 409 + 3)
  const lv = B.live
  for (let i = 0; i < 5; i++) lv.sprites.push(speck(B.q, rr(r, 0.9, 2.1), mix(C.chalk, C.sun, rr(r, 0, 0.5)), i + B.R.seed))
  if (B.R.shafts > 0.05) {
    for (const s of B.b.shafts) {
      let x0 = 1e9
      let x1 = -1e9
      let y0 = 1e9
      let y1 = -1e9
      for (const [x, y] of s.hull) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
      let tries = 0
      let got = 0
      while (got < 22 && tries++ < 400) {
        const x = rr(r, x0, x1)
        const y = rr(r, y0, y1)
        if (!pointIn(s.hull, x, y) || x < B.vx0 || x > B.vx1 || y < B.vy0 || y > B.vy1) continue
        lv.motes.push({ x, y, r: rr(r, 0.002, 0.006), ph: r() * TAU, m: 1 + Math.floor(r() * 2), a: rr(r, 0.35, 0.85) * B.R.shafts * s.a, spr: Math.floor(r() * lv.sprites.length) })
        got++
      }
    }
  }
  if (B.R.wet > 0.05) {
    lv.dropSpr = (() => {
      const s = Math.max(6, Math.ceil(9 * B.q))
      const c = mk(s, s)
      const x = ctx2(c)
      x.beginPath()
      x.ellipse(s / 2, s / 2 + 0.6 * B.q, 2.2 * B.q, 2.6 * B.q, 0, 0, TAU)
      x.fillStyle = css(mix(C.shade, C.outside[0], 0.3), 0.5)
      x.fill()
      x.beginPath()
      x.ellipse(s / 2 - 0.6 * B.q, s / 2 - 0.7 * B.q, 1.1 * B.q, 0.8 * B.q, -0.5, 0, TAU)
      x.fillStyle = css(C.chalk, 0.9)
      x.fill()
      return c
    })()
    const side = B.b.light
    for (let i = 0; i < 6; i++) {
      const X = (i % 2 ? side : -side) * GW
      const Z = rr(r, 1.7, 3.4)
      const Y0 = rr(r, 1.4, 2.1)
      const pts: Pt[] = []
      for (let k = 0; k <= 10; k++) pts.push(P(X, Y0 - k * 0.012 * rr(r, 0.8, 1.2), Z + (r() - 0.5) * 0.01))
      lv.drips.push({ pts, ph: i / 6 + r() * 0.1, s: scl(Z) })
    }
    lv.glintSpr = speck(B.q, 1.6, C.chalk, 99)
    const rP = rng(B.R.seed * 17 + 1)
    for (let i = 0; i < 10; i++) {
      const X = rr(rP, -0.9, 0.9)
      const Z = rr(rP, 1.8, 5)
      const [x, y] = P(X, 0, Z)
      const i0 = refAt(B.ref, x, y)
      if (i0 < 0) continue
      if (B.ref.hi[i0] < 40) continue
      lv.glints.push({ x, y, s: scl(Z), ph: rP() * TAU })
    }
  }
}

function paintLive(c: Ctx, B: Bake, w: number, h: number, t: number) {
  const lv = B.live
  const sx = w / B.DW
  const sy = h / B.DH
  const ph = (TAU * t) / LOOP
  c.save()
  // the shafts breathe by a percent or two
  c.globalAlpha = 0.975 + 0.025 * Math.sin(ph)
  c.globalCompositeOperation = "screen"
  c.drawImage(B.shaftL as CanvasImageSource, 0, 0, w, h)
  c.globalCompositeOperation = "source-over"
  for (const m of lv.motes) {
    const x = m.x + 0.004 * Math.sin(ph * m.m + m.ph)
    const y = m.y + 0.003 * Math.cos(ph * m.m + m.ph * 1.3) + 0.002 * Math.sin(ph + m.ph)
    const spr = lv.sprites[m.spr]
    c.globalAlpha = m.a * (0.8 + 0.2 * Math.sin(ph * 2 + m.ph))
    const X = (B.cx0 + x * B.dsx) * sx
    const Y = (B.cy0 + y * B.dsy) * sy
    c.drawImage(spr as CanvasImageSource, X - (spr.width * sx) / 2, Y - (spr.height * sy) / 2, spr.width * sx, spr.height * sy)
  }
  if (lv.dropSpr) {
    const spr = lv.dropSpr
    for (const d of lv.drips) {
      const u = (((t / LOOP + d.ph) % 1) + 1) % 1
      if (u > 0.8) continue
      const p = u < 0.6 ? 1 - (1 - u / 0.6) ** 2 : 1
      const a = u < 0.05 ? u / 0.05 : u > 0.6 ? 1 - (u - 0.6) / 0.2 : 1
      const f = p * (d.pts.length - 1)
      const i = Math.min(d.pts.length - 2, Math.floor(f))
      const fr = f - i
      const hx0 = lerp(d.pts[i][0], d.pts[i + 1][0], fr)
      const hy0 = lerp(d.pts[i][1], d.pts[i + 1][1], fr)
      // the clear trail it leaves
      c.globalAlpha = 0.28 * a
      c.fillStyle = css(mix(B.P.shade, B.P.outside[0], 0.4))
      const steps = Math.max(1, Math.round(f * 3))
      for (let k = 0; k < steps; k++) {
        const ff = (k / steps) * f
        const ii = Math.min(d.pts.length - 2, Math.floor(ff))
        const xx = lerp(d.pts[ii][0], d.pts[ii + 1][0], ff - ii)
        const yy = lerp(d.pts[ii][1], d.pts[ii + 1][1], ff - ii)
        c.fillRect((B.cx0 + xx * B.dsx) * sx - 0.5 * B.q * sx, (B.cy0 + yy * B.dsy) * sy, 1.1 * B.q * sx, 1.4 * B.q * sy)
      }
      c.globalAlpha = 0.9 * a
      const k = 0.6 + d.s * 3
      c.drawImage(spr as CanvasImageSource, (B.cx0 + hx0 * B.dsx) * sx - (spr.width * sx * k) / 2, (B.cy0 + hy0 * B.dsy) * sy - (spr.height * sy * k) / 2, spr.width * sx * k, spr.height * sy * k)
    }
  }
  if (lv.glintSpr) {
    const spr = lv.glintSpr
    for (const g of lv.glints) {
      c.globalAlpha = 0.5 + 0.2 * Math.sin(ph * 2 + g.ph)
      const k = 0.8 + g.s * 3
      c.drawImage(spr as CanvasImageSource, (B.cx0 + g.x * B.dsx) * sx - (spr.width * sx * k) / 2, (B.cy0 + g.y * B.dsy) * sy - (spr.height * sy * k) / 2, spr.width * sx * k, spr.height * sy * k)
    }
  }
  c.restore()
}

/* -------------------------------------------------------------------------- */
/*                             Cache and the frame                            */
/* -------------------------------------------------------------------------- */

const CACHE = new Map<string, Bake>()
function getBake(w: number, h: number, DW: number, DH: number, R: Resolved) {
  const key = [w, h, DW, DH, R.seed, R.palette, R.density, R.tooth, R.shafts, R.wet].join("|")
  let b = CACHE.get(key)
  if (!b) {
    b = makeBake(w, h, DW, DH, R)
    CACHE.set(key, b)
    if (CACHE.size > 4) CACHE.delete(CACHE.keys().next().value as string)
  } else {
    CACHE.delete(key)
    CACHE.set(key, b)
  }
  return b
}

/** Run the bake for up to `ms` milliseconds (Infinity: to the end). Returns true when it is finished. */
function advance(B: Bake, ms: number) {
  if (B.done || !B.gen) return true
  const t0 = performance.now()
  while (!B.done) {
    const it = B.gen.next()
    if (it.done) {
      B.done = true
      break
    }
    if (performance.now() - t0 > ms) break
  }
  return B.done
}

function deviceSize(ctx: Ctx, w: number, h: number) {
  const m = ctx.getTransform()
  const sx = Math.hypot(m.a, m.b) || 1
  const sy = Math.hypot(m.c, m.d) || 1
  const k = Math.min(1, 4400 / Math.max(w * sx, h * sy))
  return { DW: Math.max(32, Math.round(w * sx * k)), DH: Math.max(32, Math.round(h * sy * k)) }
}

function paintFrame(ctx: Ctx, w: number, h: number, t: number, B: Bake) {
  ctx.save()
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"
  ctx.drawImage(B.final as CanvasImageSource, 0, 0, w, h)
  if (!B.done) {
    ctx.drawImage(B.scratch as CanvasImageSource, 0, 0, w, h)
  } else {
    paintLive(ctx, B, w, h, t)
  }
  ctx.restore()
}

/**
 * Paint the drawing at exactly `t` seconds into a context already scaled by the caller. Pure: the same arguments give
 * the same picture. The heavy drawing is baked once per size and settings and cached; only the light layer moves.
 */
export function draw(ctx: Ctx, w: number, h: number, t: number, values: Values = {}) {
  const R = resolve(values)
  const { DW, DH } = deviceSize(ctx, w, h)
  const B = getBake(w, h, DW, DH, R)
  advance(B, Infinity)
  paintFrame(ctx, w, h, ((t % LOOP) + LOOP) % LOOP, B)
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

export function PencilGreenhouse(props: PencilGreenhouseProps) {
  const {
    speed = 1, paused = false, values, seed, size, time, canvasRef,
    palette, density, tooth, shafts, wet,
    label = "A drawing of the inside of a glass greenhouse just after rain: crowded leaves, terracotta pots, a watering can on a wet tiled floor, and light falling through the roof",
    className,
  } = props
  const R = React.useMemo(
    () => resolve(values, { palette, density, tooth, shafts, wet, seed }),
    [values, palette, density, tooth, shafts, wet, seed],
  )
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const cv = React.useRef<HTMLCanvasElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const live = React.useRef({ R, speed: Math.max(0.05, speed), paused, reduced, time })
  live.current = { R, speed: Math.max(0.05, speed), paused, reduced, time }
  const kickRef = React.useRef<() => void>(() => {})

  const setRefs = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cv.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  React.useEffect(() => {
    kickRef.current()
  }, [R, speed, paused, reduced, time, size?.w, size?.h])

  React.useEffect(() => {
    const canvas = cv.current
    const box = stage.current
    if (!canvas || !box) return
    const c = canvas.getContext("2d")
    if (!c) return
    let raf = 0
    let last = 0
    let clock = 0
    let visible = true
    let rt = 0
    let lw = 0
    let lh = 0

    const fit = () => {
      if (size) {
        lw = Math.round(size.w)
        lh = Math.round(size.h)
      } else {
        const r = box.getBoundingClientRect()
        lw = Math.max(80, Math.round(r.width))
        lh = Math.max(80, Math.round(r.height))
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const k = Math.min(dpr, 2400 / Math.max(lw, lh))
      const w = Math.round(lw * k)
      const h = Math.round(lh * k)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const frame = () => {
      fit()
      const lv = live.current
      c.setTransform(canvas.width / lw, 0, 0, canvas.height / lh, 0, 0)
      const { DW, DH } = deviceSize(c, lw, lh)
      const B = getBake(lw, lh, DW, DH, lv.R)
      const t = lv.time != null ? lv.time : lv.reduced ? STILL_T : clock
      if (!B.done) {
        advance(B, lv.reduced ? 40 : 14)
        if (lv.reduced && !B.done) return false
      }
      c.clearRect(0, 0, lw, lh)
      paintFrame(c, lw, lh, ((t % LOOP) + LOOP) % LOOP, B)
      return B.done
    }

    const animating = () => !live.current.paused && !live.current.reduced && live.current.time == null
    const tick = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      const dt = Math.min(0.05, (now - last) / 1000) * live.current.speed
      last = now
      if (animating()) clock += dt
      const done = frame()
      if (!done || animating()) raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (raf || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    kickRef.current = kick

    const io = new IntersectionObserver((es) => {
      visible = es[es.length - 1].isIntersecting
      if (visible) kick()
    }, { threshold: 0.01 })
    io.observe(box)
    const onVis = () => {
      if (!document.hidden) kick()
    }
    document.addEventListener("visibilitychange", onVis)
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt)
      rt = window.setTimeout(kick, 140)
    })
    ro.observe(box)
    kick()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(rt)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size?.w, size?.h])

  return (
    <div className={["pgh", className].filter(Boolean).join(" ")}>
      <style href="pencil-greenhouse" precedence="default">{CSS}</style>
      <div
        ref={stage}
        className="pgh-stage"
        role="img"
        aria-label={label}
        style={size ? { aspectRatio: `${size.w} / ${size.h}` } : undefined}
      >
        <canvas ref={setRefs} className="pgh-cv" aria-hidden="true" />
      </div>
    </div>
  )
}

export default PencilGreenhouse
