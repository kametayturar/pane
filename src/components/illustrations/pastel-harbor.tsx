"use client"

import * as React from "react"
import { rng, type StudioPieceProps, type Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type HarborPalette = "first-light" | "blue-hour" | "sun-up"

export type PastelHarborProps = StudioPieceProps & {
  /** Time of day: first light (sun on the horizon), blue hour (before sunrise, lamps strong), sun up (clear morning). */
  palette?: HarborPalette
  /** How many strokes make each surface. 1 is the designed density. */
  density?: number
  /** How much the paper's grain breaks the strokes, 0 to 1. */
  tooth?: number
  /** How much of the sky is covered by the rows of small clouds, 0 to 1. */
  clouds?: number
  /** The ferry's and the boats' lamps. */
  lamps?: boolean
  /** Accessible description of the drawing. */
  label?: string
  className?: string
}

type RGB = [number, number, number]
type Ctx = CanvasRenderingContext2D
type Cvs = HTMLCanvasElement | OffscreenCanvas
type Pt = [number, number]

type Pal = {
  paper: RGB
  sky: RGB[]; warm: RGB[]; cloud: RGB[]; chalk: RGB
  city: RGB[]; dark: RGB[]; rim: RGB[]; crane: RGB[]; box: RGB[]
  water: RGB[]; ripple: RGB[]; sun: RGB[]; lamp: RGB[]
  hull: RGB[]; wood: RGB[]; stone: RGB[]; pencil: RGB
  sunX: number; sunY: number; sunR: number; disc: boolean
  glow: number; lampK: number; stars: number; lit: number; path: number
}

const hx = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const set = (...s: string[]) => s.map(hx)

/* Three sets of sticks. Each array is a row of pastel sticks laid out dark to light (or top to horizon): a stroke picks
   one stick, never an in-between colour, so tone is built by layering neighbouring sticks, as on paper. */
const PALETTES: Record<HarborPalette, Pal> = {
  "first-light": {
    paper: hx("#f4e6c8"),
    sky: set("#262d68", "#333a7a", "#47488c", "#655a9b", "#876ba2", "#ae7aa5", "#d28e9f", "#ea9f93", "#f5b996", "#fad2a2", "#fde6bc"),
    warm: set("#f2a084", "#f7b588", "#fbc98e", "#fddca4", "#ffefc8"),
    cloud: set("#3c3d7e", "#574d8d", "#7d5e99", "#a86f9e", "#cf839c", "#ea9b93", "#f6b78e", "#fcd49f", "#ffebc3"),
    chalk: hx("#fff6de"),
    city: set("#6f6497", "#8a79a6", "#a88aae", "#cb9fae", "#ecbfb0"),
    dark: set("#1f2150", "#2b2c5f", "#3b3a6f", "#544b83"),
    rim: set("#ee9483", "#f7b48d", "#fdd29e"),
    crane: set("#5f2a4c", "#8c3a4d", "#b8514f", "#dd7259", "#f39a74"),
    box: set("#b44e58", "#2f6c84", "#cf953f", "#5d5b98", "#cdbfc4", "#3d8678"),
    water: set("#fde2b1", "#f8c39b", "#eda299", "#d08ea4", "#a37ca8", "#7c6ca5", "#5b5f9b", "#43508b", "#333f77", "#283268"),
    ripple: set("#1e275a", "#2a4a78", "#3e6c88"),
    sun: set("#ffd38a", "#ffe6b0", "#fff4d8", "#fffcf0"),
    lamp: set("#ff9a42", "#ffbe58", "#ffe5a0"),
    hull: set("#e6dccd", "#2f6c84", "#c0534f", "#2a3466"),
    wood: set("#28223f", "#3b2f4f", "#58405f", "#8a5a62"),
    stone: set("#27244a", "#37335a", "#4e456b", "#76627c"),
    pencil: hx("#1b1d44"),
    sunX: 1.12, sunY: 0.552, sunR: 0.034, disc: true, glow: 1, lampK: 1, stars: 0, lit: 0.72, path: 1,
  },
  "blue-hour": {
    paper: hx("#efe2c8"),
    sky: set("#121840", "#19214e", "#212d5d", "#2b3c6e", "#384e80", "#4c6292", "#6876a3", "#8b88b0", "#b497b0", "#d9a6a4", "#f0ba98"),
    warm: set("#dd9f92", "#eeb79c", "#f6cfae", "#fae2c4", "#fdeedb"),
    cloud: set("#1b2350", "#283566", "#3b497a", "#556193", "#7577a6", "#9a8aae", "#c19bae", "#e1ada6", "#f4c8ac"),
    chalk: hx("#f6efe2"),
    city: set("#36406e", "#4a5384", "#64689a", "#8a80aa", "#b197b0"),
    dark: set("#0f1334", "#171c43", "#212853", "#303864"),
    rim: set("#b98299", "#d89d9e", "#efbba7"),
    crane: set("#36203f", "#552a46", "#7c364b", "#a64e58", "#cc766b"),
    box: set("#8a3f52", "#24506e", "#a4783f", "#46477f", "#9d92a8", "#2f6a66"),
    water: set("#eebb9b", "#d6a2a5", "#a78ead", "#7c7aa6", "#5b679b", "#44548b", "#344479", "#283767", "#1e2b57", "#162149"),
    ripple: set("#0f1840", "#1f3864", "#36577e"),
    sun: set("#f2b796", "#f8cdb0", "#fbe2cc", "#fff1e4"),
    lamp: set("#ff9437", "#ffbb52", "#ffe196"),
    hull: set("#b9b3c2", "#24506e", "#9a4250", "#1d2552"),
    wood: set("#1b1834", "#2a2444", "#3f3253", "#634a62"),
    stone: set("#1a1a3c", "#26264c", "#363559", "#544a6e"),
    pencil: hx("#0e1236"),
    sunX: 1.12, sunY: 0.64, sunR: 0.03, disc: false, glow: 0.62, lampK: 1, stars: 46, lit: 0.88, path: 0.45,
  },
  "sun-up": {
    paper: hx("#f6ead0"),
    sky: set("#3a77a8", "#4886b4", "#5a95bf", "#71a5c6", "#8ab6ca", "#a5c5ca", "#c0d2c6", "#d9d9c1", "#ece1bf", "#f7e8c2", "#fdf0d4"),
    warm: set("#f6d49c", "#f9e0b0", "#fcebc4", "#fff3d8", "#fffaec"),
    cloud: set("#6a84aa", "#859bbd", "#a3b2ca", "#c2c5d2", "#ddd3d5", "#efdfd1", "#f9e9d4", "#fff3e2", "#fffaf0"),
    chalk: hx("#fffdf5"),
    city: set("#7489a6", "#8d9fb7", "#a7b5c3", "#c3cbcb", "#ddddd0"),
    dark: set("#22325a", "#2c3f69", "#3b4f79", "#51658b"),
    rim: set("#f4cd9c", "#fbe0b2", "#fff0cc"),
    crane: set("#713644", "#9a464b", "#c66152", "#e3825d", "#f6a676"),
    box: set("#b8505a", "#2f7690", "#d6a443", "#5f6aa6", "#d8d0cf", "#3f9180"),
    water: set("#f6ebc8", "#d9e0c8", "#b3cfc8", "#8cbac3", "#6aa1b8", "#5289aa", "#43749a", "#355f87", "#2b4e76", "#223f66"),
    ripple: set("#1c3a5d", "#295977", "#4a8a98"),
    sun: set("#fbd27e", "#fff2c8", "#fffdf1", "#ffffff"),
    lamp: set("#ffaa4a", "#ffc967", "#ffe9b0"),
    hull: set("#ece4d6", "#2f7690", "#c65b52", "#2a3c6c"),
    wood: set("#2a2a45", "#3e3a56", "#5b4e66", "#8e6f6c"),
    stone: set("#2b2f50", "#3d4262", "#565a76", "#7e7b8c"),
    pencil: hx("#1e2a4e"),
    sunX: 1.1, sunY: 0.4, sunR: 0.03, disc: true, glow: 0.75, lampK: 0.38, stars: 0, lit: 0.3, path: 1.15,
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ph {
  --ph-ink: #000;
  --ph-accent: #0060e2;
  --ph-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 18px 40px -14px rgb(40 30 60 / .24);
  --ph-radius: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 1100px;
}
:is(.dark, [data-theme="dark"]) .ph {
  --ph-accent: #4d8dff;
  --ph-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 18px 40px -14px rgb(0 0 0 / .55);
}
html[data-style="mono"] .ph { --ph-radius: 4px; --ph-accent: #111; --ph-shadow: 0 0 0 1px rgb(0 0 0 / .16) }
html[data-style="mono"].dark .ph { --ph-accent: #f2f2f2; --ph-shadow: 0 0 0 1px rgb(255 255 255 / .18) }
html[data-style="mono"] .ph-cv { filter: grayscale(.82) contrast(1.1) }
html[data-style="glass"] .ph { --ph-accent: var(--pane-accent); --ph-radius: 26px; --ph-shadow: var(--pane-shadow) }
html[data-style="glass"] .ph-stage { box-shadow: var(--pane-card) }
.ph *, .ph *::before, .ph *::after { box-sizing: border-box }
.ph-stage { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--ph-radius); overflow: hidden; background: #f4e6c8; box-shadow: var(--ph-shadow); isolation: isolate }
.ph-stage:focus-visible { outline: 2px solid var(--ph-accent); outline-offset: 3px }
@container (max-width: 520px) { .ph-stage { aspect-ratio: 4 / 5 } }
.ph-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
`

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

const LOOP = 20 // seconds in one seamless loop
const STILL_T = 6.5 // the frame shown for reduced motion
const TAU = Math.PI * 2

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function mkCanvas(w: number, h: number): Cvs {
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    return c
  }
  return new OffscreenCanvas(w, h)
}
const ctxOf = (c: Cvs) => c.getContext("2d", { willReadFrequently: false }) as Ctx

/** A 256×256 table of random values: 2D value noise reads it, wrapped, so the hot loops never hash. */
function noiseTable(seed: number) {
  const r = rng(seed)
  const t = new Float32Array(65536)
  for (let i = 0; i < t.length; i++) t[i] = r()
  return t
}
function vnoise(T: Float32Array, x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  let fx = x - ix
  let fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const x0 = ix & 255
  const x1 = (ix + 1) & 255
  const y0 = (iy & 255) << 8
  const y1 = ((iy + 1) & 255) << 8
  const a = T[y0 + x0]
  const b = T[y0 + x1]
  const c = T[y1 + x0]
  const d = T[y1 + x1]
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** One colour string per stroke, with a small brightness and hue wobble so no two marks of a stick match exactly. */
function rgba(c: RGB, a: number, r: () => number, j = 7) {
  const k = (r() - 0.5) * j
  const q = (r() - 0.5) * j * 0.5
  const R = clamp(Math.round(c[0] + k + q), 0, 255)
  const G = clamp(Math.round(c[1] + k), 0, 255)
  const B = clamp(Math.round(c[2] + k - q), 0, 255)
  return `rgba(${R},${G},${B},${a.toFixed(3)})`
}

/** Pick a stick from a row: v in 0..1, plus a random reach of `spread` sticks either way. */
function stick(row: RGB[], v: number, r: () => number, spread = 1.2): RGB {
  const i = Math.round(clamp(v, 0, 1) * (row.length - 1) + (r() - 0.5) * spread)
  return row[clamp(i, 0, row.length - 1)]
}

/* ------------------------------- the marks -------------------------------- */

const MX = new Float32Array(32)
const MY = new Float32Array(32)

/**
 * The basic mark: a short tapered ribbon along a bent path. Thin at the start, full in the middle, thin at the end (or
 * heavier at the start with `head`), the way a stick lands, presses and lifts.
 */
function ribbon(c: Ctx, x: number, y: number, ang: number, len: number, wid: number, fill: string, bend: number, head = 0) {
  const ca = Math.cos(ang)
  const sa = Math.sin(ang)
  const hx0 = (ca * len) / 2
  const hy0 = (sa * len) / 2
  const nx = -sa
  const ny = ca
  const bx = nx * bend * len
  const by = ny * bend * len
  const N = len > 30 ? 7 : 5
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const u = 1 - t
    const px = u * u * (x - hx0) + 2 * u * t * (x + bx) + t * t * (x + hx0)
    const py = u * u * (y - hy0) + 2 * u * t * (y + by) + t * t * (y + hy0)
    const tt = head ? t ** (1 + head) : t
    const pr = Math.sin(Math.PI * (0.08 + 0.84 * tt)) ** 0.55
    const ww = wid * 0.5 * pr
    MX[i] = px + nx * ww
    MY[i] = py + ny * ww
    MX[2 * N + 1 - i] = px - nx * ww
    MY[2 * N + 1 - i] = py - ny * ww
  }
  c.beginPath()
  c.moveTo(MX[0], MY[0])
  for (let i = 1; i <= 2 * N + 1; i++) c.lineTo(MX[i], MY[i])
  c.closePath()
  c.fillStyle = fill
  c.fill()
}

/** Oil pastel: wide, waxy and nearly opaque, with a lighter drag line where the stick smears along its own path. */
function pastel(c: Ctx, r: () => number, x: number, y: number, ang: number, len: number, wid: number, col: RGB, a = 0.92, drag = 0.55) {
  ribbon(c, x, y, ang, len, wid, rgba(col, a, r), (r() - 0.5) * 0.12, 0.3)
  if (len > 12 && r() < drag) {
    const off = (r() - 0.5) * wid * 0.5
    const ca = Math.cos(ang)
    const sa = Math.sin(ang)
    const l2 = len * (0.35 + 0.4 * r())
    const sx = x + ca * (r() - 0.5) * len * 0.3 - sa * off
    const sy = y + sa * (r() - 0.5) * len * 0.3 + ca * off
    c.strokeStyle = rgba(mixc(col, [255, 250, 240], 0.12), 0.35, r)
    c.lineWidth = Math.max(0.6, wid * 0.16)
    c.lineCap = "round"
    c.beginPath()
    c.moveTo(sx - (ca * l2) / 2, sy - (sa * l2) / 2)
    c.lineTo(sx + (ca * l2) / 2, sy + (sa * l2) / 2)
    c.stroke()
  }
}

/** Wax crayon: medium width, more translucent, a second offset pass so the edge is doubled and gritty. */
function crayon(c: Ctx, r: () => number, x: number, y: number, ang: number, len: number, wid: number, col: RGB, a = 0.8) {
  const bend = (r() - 0.5) * 0.16
  ribbon(c, x, y, ang, len, wid, rgba(col, a, r), bend)
  if (wid > 2.2) {
    const o = wid * 0.35
    ribbon(c, x + Math.sin(ang) * o * (r() - 0.5), y - Math.cos(ang) * o * (r() - 0.5), ang + (r() - 0.5) * 0.05, len * 0.8, wid * 0.45, rgba(col, a * 0.55, r, 12), bend)
  }
}

/** Coloured pencil: a thin line with a slight bow, wider in the middle. */
function pencil(c: Ctx, r: () => number, x: number, y: number, ang: number, len: number, col: RGB, a: number, lw: number) {
  ribbon(c, x, y, ang, len, lw, rgba(col, a, r, 10), (r() - 0.5) * 0.06, 0.15)
}

/** White chalk: a soft, dusty halo under a narrower core. */
function chalk(c: Ctx, r: () => number, x: number, y: number, ang: number, len: number, wid: number, col: RGB, a = 0.75) {
  ribbon(c, x, y, ang, len * 1.1, wid * 1.9, rgba(col, a * 0.22, r, 4), (r() - 0.5) * 0.1)
  ribbon(c, x, y, ang, len, wid, rgba(col, a, r, 4), (r() - 0.5) * 0.1)
}

/** A group of parallel pencil lines: one gesture of hatching. */
function hatch(c: Ctx, r: () => number, x: number, y: number, ang: number, len: number, n: number, gap: number, col: RGB, a: number, lw: number) {
  const nx = -Math.sin(ang)
  const ny = Math.cos(ang)
  const ca = Math.cos(ang)
  const sa = Math.sin(ang)
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * gap + (r() - 0.5) * gap * 0.4
    const sh = (r() - 0.5) * len * 0.3
    pencil(c, r, x + nx * o + ca * sh, y + ny * o + sa * sh, ang + (r() - 0.5) * 0.04, len * (0.7 + 0.4 * r()), col, a * (0.7 + 0.3 * r()), lw)
  }
}

/** A drawn line between two points: overlapping crayon pulls along it, so a beam is beaded, not ruled. */
function beam(c: Ctx, r: () => number, a: Pt, b: Pt, wid: number, col: RGB, alpha: number, U: number, light?: RGB, lightSide = 1) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const L = Math.hypot(dx, dy)
  if (L < 0.5) return
  const ang = Math.atan2(dy, dx)
  const seg = Math.max(8 * U, Math.min(34 * U, L * 0.5))
  const n = Math.max(1, Math.ceil(L / (seg * 0.62)))
  const nx = -dy / L
  const ny = dx / L
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const j = (r() - 0.5) * wid * 0.25
    ribbon(c, a[0] + dx * t + nx * j, a[1] + dy * t + ny * j, ang + (r() - 0.5) * 0.03, Math.min(L * 1.04, seg * (0.95 + 0.3 * r())), wid * (0.9 + 0.25 * r()), rgba(col, alpha, r), (r() - 0.5) * 0.04, 0.2)
  }
  if (light && wid > 1.4 * U) {
    const o = wid * 0.38 * lightSide
    for (let i = 0; i < n; i++) {
      if (r() < 0.25) continue
      const t = (i + 0.5) / n
      ribbon(c, a[0] + dx * t + nx * o, a[1] + dy * t + ny * o, ang, seg * (0.6 + 0.4 * r()), Math.max(0.8 * U, wid * 0.32), rgba(light, 0.85, r), 0, 0.2)
    }
  }
}

/** Point-in-polygon (even-odd). */
function inPoly(x: number, y: number, p: Pt[]) {
  let ins = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i][0]
    const yi = p[i][1]
    const xj = p[j][0]
    const yj = p[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins
  }
  return ins
}
function bbox(p: Pt[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const q of p) {
    if (q[0] < x0) x0 = q[0]
    if (q[0] > x1) x1 = q[0]
    if (q[1] < y0) y0 = q[1]
    if (q[1] > y1) y1 = q[1]
  }
  return { x0, y0, x1, y1 }
}

/** Scatter marks on a jittered grid inside a polygon; `fray` lets the test point wander so the edge is ragged. */
function fillPoly(r: () => number, p: Pt[], sx: number, sy: number, fray: number, fn: (x: number, y: number, bb: ReturnType<typeof bbox>) => void) {
  const bb = bbox(p)
  for (let y = bb.y0 - sy * 0.5; y <= bb.y1 + sy * 0.5; y += sy) {
    for (let x = bb.x0 - sx * 0.5; x <= bb.x1 + sx * 0.5; x += sx) {
      const px = x + (r() - 0.5) * sx
      const py = y + (r() - 0.5) * sy
      if (!inPoly(px + (r() - 0.5) * fray, py + (r() - 0.5) * fray, p)) continue
      fn(px, py, bb)
    }
  }
}

/** A polygon's outline in coloured pencil: each side a separate pull that overshoots a little and sometimes skips. */
function outline(c: Ctx, r: () => number, p: Pt[], col: RGB, a: number, lw: number, U: number, closed = true) {
  const n = closed ? p.length : p.length - 1
  for (let i = 0; i < n; i++) {
    const A = p[i]
    const B = p[(i + 1) % p.length]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    if (L < 1 || r() < 0.08) continue
    const ang = Math.atan2(B[1] - A[1], B[0] - A[0])
    const parts = Math.max(1, Math.round(L / (60 * U)))
    for (let k = 0; k < parts; k++) {
      const t = (k + 0.5) / parts
      pencil(c, r, lerp(A[0], B[0], t) + (r() - 0.5) * U, lerp(A[1], B[1], t) + (r() - 0.5) * U, ang + (r() - 0.5) * 0.03, (L / parts) * (1.04 + 0.12 * r()), col, a, lw)
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           Resolve props and values                         */
/* -------------------------------------------------------------------------- */

type Resolved = { palette: HarborPalette; density: number; tooth: number; clouds: number; lamps: boolean; seed: number }

function resolve(v: Values | undefined, fb: Partial<Resolved> = {}): Resolved {
  const p = (v?.palette ?? fb.palette) as string | undefined
  return {
    palette: p === "blue-hour" || p === "sun-up" || p === "first-light" ? p : "first-light",
    density: clamp(num(v?.density ?? fb.density, 1), 0.5, 1.6),
    tooth: clamp(num(v?.tooth ?? fb.tooth, 0.6), 0, 1),
    clouds: clamp(num(v?.clouds ?? fb.clouds, 0.65), 0, 1),
    lamps: (v?.lamps ?? fb.lamps ?? true) !== false,
    seed: Math.round(num(v?.seed ?? fb.seed, 11)),
  }
}

/* -------------------------------------------------------------------------- */
/*                         The drawing, baked in passes                       */
/* -------------------------------------------------------------------------- */

type Tool = "ground" | "pencil" | "pastel" | "crayon" | "chalk"
type Lamp = { x: number; y: number; wl: number; len: number; col: RGB; k: number; w: number }
type Glint = { x: number; y: number; len: number; w: number; ph: number; f: number; col: RGB }
type Gull = { x: number; y: number; s: number; ph: number; col: RGB }
type Obj = { id: number; wl: number; k: number }

type Bake = {
  key: string
  w: number; h: number; k: number; W: number; H: number
  S: number; U: number; CX: number; HZ: number
  R: Resolved; P: Pal; T: Float32Array
  base: Cvs; bc: Ctx; obj: Cvs; oc: Ctx; layer: Cvs; lc: Ctx
  ids: Uint8Array; iw: number; ih: number; idc: Ctx; idCv: Cvs
  objs: Obj[]
  punch: Record<Tool, Cvs>; shade: Cvs
  final: Cvs | null
  lamps: Lamp[]; glints: Glint[]; gulls: Gull[]
  live: Cvs; lv: Ctx
  it: Generator<void, void, void>
  done: boolean
  passN: number
}

const PAD = 64

const QUAY = 0.622 // port quay top, scene units

/** Scene → canvas. x: scene units across (the 16:9 frame spans 0 to 1.78); y: 0 top, 0.6 horizon, 1 bottom. */
function sceneFns(B: Pick<Bake, "w" | "h" | "S" | "CX" | "HZ">) {
  const X = (sx: number) => B.w / 2 + (sx - B.CX) * B.S
  const Y = (sy: number) => B.HZ + (sy - 0.6) * B.S
  // Near things hang from the bottom edge in tall frames, far things from the horizon.
  const off = (wl: number) => {
    const yb = B.h - (1 - wl) * B.S
    return (yb - Y(wl)) * clamp((wl - 0.6) / 0.4, 0, 1) ** 1.4
  }
  return { X, Y, off }
}

function makeBake(w: number, h: number, k: number, R: Resolved, key: string): Bake {
  const P = PALETTES[R.palette]
  const A = w / h
  const S = Math.min(h, w * 1.05)
  const U = S / 1080
  const CX = A >= 1.55 ? 0.889 : 0.86
  const HZ = h * (A >= 1.3 ? 0.6 : A >= 0.9 ? 0.6 : 0.6)
  const W = Math.max(1, Math.round(w * k))
  const H = Math.max(1, Math.round(h * k))
  const base = mkCanvas(W, H)
  const obj = mkCanvas(W, H)
  const layer = mkCanvas(W, H)
  const live = mkCanvas(W, H)
  const iw = Math.max(1, Math.ceil(w / 2))
  const ih = Math.max(1, Math.ceil(h / 2))
  const idCv = mkCanvas(iw, ih)
  const B: Bake = {
    key, w, h, k, W, H, S, U, CX, HZ, R, P, T: noiseTable(R.seed * 7919 + 13),
    base, bc: ctxOf(base), obj, oc: ctxOf(obj), layer, lc: ctxOf(layer),
    ids: new Uint8Array(0), iw, ih, idc: ctxOf(idCv), idCv, objs: [],
    punch: {} as Record<Tool, Cvs>, shade: base,
    final: null, lamps: [], glints: [], gulls: [], live, lv: ctxOf(live),
    it: (function* () {})(), done: false, passN: 0,
  }
  B.idc.setTransform(0.5, 0, 0, 0.5, 0, 0)
  B.it = bakeSteps(B)
  return B
}

/** Paint one pass on the scratch layer, let the paper's tooth eat into it, then lay it on the target. */
function pass(B: Bake, target: "base" | "obj", tool: Tool | null, fn: (c: Ctx) => void) {
  const c = B.lc
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalCompositeOperation = "source-over"
  c.globalAlpha = 1
  c.clearRect(0, 0, B.W, B.H)
  c.setTransform(B.k, 0, 0, B.k, 0, 0)
  c.lineCap = "round"
  c.lineJoin = "round"
  fn(c)
  c.setTransform(1, 0, 0, 1, 0, 0)
  if (tool && B.R.tooth > 0.01) {
    c.globalCompositeOperation = "destination-out"
    c.imageSmoothingEnabled = true
    const o = (B.passN++ * 37) % PAD
    const o2 = (B.passN * 23) % PAD
    c.drawImage(B.punch[tool], o, o2, B.w, B.h, 0, 0, B.W, B.H)
    c.globalCompositeOperation = "source-over"
  }
  const t = target === "base" ? B.bc : B.oc
  t.setTransform(1, 0, 0, 1, 0, 0)
  t.drawImage(B.layer, 0, 0)
}

/** A rubbed-in ground under an object, so the tooth in its later layers shows the object's own dark, not the sky. */
function ground(B: Bake, polys: Pt[][], col: (x: number, y: number) => RGB, seed: number) {
  const r = rng(seed)
  const U = B.U
  pass(B, "obj", "ground", (c) => {
    for (const p of polys) fillPoly(r, p, 3 * U, 2.6 * U, 0, (x, y) => ribbon(c, x, y, (r() - 0.5) * 0.3, 9 * U, 6 * U, rgba(col(x, y), 0.95, r, 8), 0, 0.1))
  })
}

/** Mark a silhouette in the id map, so the water can find what it should mirror. */
function idFill(B: Bake, id: number, p: Pt[]) {
  const c = B.idc
  c.fillStyle = `rgb(${id},0,0)`
  c.beginPath()
  c.moveTo(p[0][0], p[0][1])
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1])
  c.closePath()
  c.fill()
}
function idLine(B: Bake, id: number, a: Pt, b: Pt, wd: number) {
  const c = B.idc
  c.strokeStyle = `rgb(${id},0,0)`
  c.lineWidth = Math.max(2, wd)
  c.lineCap = "round"
  c.beginPath()
  c.moveTo(a[0], a[1])
  c.lineTo(b[0], b[1])
  c.stroke()
}

/* ------------------------------- paper ------------------------------------ */

function paperStep(B: Bake) {
  const { w, h, R, P, T } = B
  // The tooth map is a little larger than the sheet, so each pass can take it at its own offset.
  const iw = Math.ceil(w) + PAD
  const ih = Math.ceil(h) + PAD
  const N = iw * ih
  const Hm = new Float32Array(N)
  const Pm = new Float32Array(N)
  // Tooth: a bumpy height field (cold-pressed paper: 3px bumps over 1px grit and a slow 10px swell).
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const a = vnoise(T, x / 2.7 + 11.3, y / 2.2 + 3.1)
      const b = vnoise(T, x / 1.1 + 91.7, y / 1.1 + 47.2)
      const cc = vnoise(T, x / 7 + 17.1, y / 5.5 + 201.4)
      Hm[y * iw + x] = clamp((0.5 * a + 0.24 * b + 0.26 * cc - 0.5) * 2.8 + 0.5, 0, 1)
      // hand pressure: patches where the stick was pressed hard (little paper) and patches where it skimmed
      Pm[y * iw + x] = vnoise(T, x / 80 + 300.5, y / 46 + 120.2) * 0.65 + vnoise(T, x / 23 + 61.7, y / 17 + 9.3) * 0.35
    }
  }
  const mkImg = () => {
    const cv = mkCanvas(iw, ih)
    const c = ctxOf(cv)
    return { cv, c, img: c.createImageData(iw, ih) }
  }
  // Each tool skips the valleys deeper than its threshold: crayon and chalk skip many, pencil and oil pastel few.
  // The tooth control raises or lowers every threshold, so more or less paper shows; the specks stay crisp.
  const tools: [Tool, number][] = [["ground", 0.99], ["pencil", 0.9], ["pastel", 0.86], ["crayon", 0.77], ["chalk", 0.68]]
  for (const [tool, th0] of tools) {
    const m = mkImg()
    const d = m.img.data
    const th = th0 + (1 - R.tooth) * 0.3 - 0.08
    for (let i = 0; i < N; i++) {
      const v = 1 - Hm[i]
      const t2 = th + (Pm[i] - 0.5) * 0.42
      d[i * 4 + 3] = Math.round(clamp((v - t2) / 0.07, 0, 1) * 255)
    }
    m.c.putImageData(m.img, 0, 0)
    B.punch[tool] = m.cv
  }
  // The paper itself: cream, a faint mottle, darker in the valleys of the tooth.
  const pp = mkImg()
  const pd = pp.img.data
  const sh = mkImg()
  const sd = sh.img.data
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const i = y * iw + x
      const v = 1 - Hm[i]
      const mot = vnoise(T, x / 140 + 5.5, y / 110 + 9.9) - 0.5
      const f = 1 + mot * 0.05 - v * v * 0.07
      pd[i * 4] = clamp(P.paper[0] * f, 0, 255)
      pd[i * 4 + 1] = clamp(P.paper[1] * f, 0, 255)
      pd[i * 4 + 2] = clamp(P.paper[2] * (f - 0.01), 0, 255)
      pd[i * 4 + 3] = 255
      const s = 255 - Math.max(0, v - 0.55) * 46 * R.tooth
      sd[i * 4] = s
      sd[i * 4 + 1] = s
      sd[i * 4 + 2] = Math.min(255, s + 2)
      sd[i * 4 + 3] = 255
    }
  }
  pp.c.putImageData(pp.img, 0, 0)
  sh.c.putImageData(sh.img, 0, 0)
  B.shade = sh.cv
  B.bc.imageSmoothingEnabled = true
  B.bc.drawImage(pp.cv, 0, 0, w, h, 0, 0, B.W, B.H)
  // Paper fibres: a few short pale and warm curls pressed into the sheet.
  pass(B, "base", null, (c) => {
    const r = rng(R.seed * 31 + 7)
    const n = Math.round((w * h) / 2600)
    for (let i = 0; i < n; i++) {
      const light = r() < 0.6
      pencil(c, r, r() * w, r() * h, r() * TAU, (5 + 10 * r()) * B.U, light ? [255, 252, 240] : mixc(P.paper, [120, 90, 60], 0.35), light ? 0.35 : 0.12, 0.8)
    }
  })
}

/* --------------------------------- sky ------------------------------------ */

function skyV(B: Bake, y: number) {
  return clamp(y / B.HZ, 0, 1) ** 1.55
}
function sunPx(B: Bake) {
  const { X, Y } = sceneFns(B)
  return { sx: X(B.P.sunX), sy: Y(B.P.sunY), sr: B.P.sunR * B.S }
}
/** How much a point sits in the sun's warm glow (wide, flattened ellipse). */
function glowAt(B: Bake, x: number, y: number) {
  const s = sunPx(B)
  const dx = (x - s.sx) / (0.46 * B.S)
  const dy = (y - s.sy) / (0.2 * B.S)
  return Math.exp(-(dx * dx + dy * dy)) * B.P.glow
}
function skyCol(B: Bake, x: number, y: number, r: () => number, shift = 0): RGB {
  const g = glowAt(B, x, y)
  if (r() < g * 0.8) return stick(B.P.warm, g * 0.72 + shift * 0.5, r, 1.3)
  const v = skyV(B, y)
  return stick(B.P.sky, v + g * 0.16 + shift, r, 0.7 + v * 1.1)
}
/** Hatching direction drifts patch by patch, the way a hand changes angle as it moves across the sheet. */
function skyAng(B: Bake, x: number, y: number) {
  const n = vnoise(B.T, x / (230 * B.U) + 40, y / (140 * B.U) + 70)
  const s = sunPx(B)
  const g = glowAt(B, x, y)
  const tang = Math.atan2(y - s.sy, x - s.sx) + Math.PI / 2
  const flat = -0.08 + (n - 0.5) * 1.0
  return g > 0.5 ? lerp(flat, Math.atan(Math.tan(tang) * 0.4), (g - 0.5) * 1.4) : flat
}

function skySteps(B: Bake): (() => void)[] {
  const { w, U, R, P } = B
  const dn = Math.sqrt(R.density)
  const top = B.HZ + 4 * U
  return [
    // 0. Toned ground: broad soft pastel laid flat with the side of the stick, rubbed into the tooth, so later layers
    //    break over colour rather than over bare paper. Only the deepest pits of the paper stay clean.
    () => pass(B, "base", "ground", (c) => {
      const r = rng(R.seed * 97 + 5)
      const st = 20 * U
      for (let y = -st; y < top; y += st * 0.55) {
        for (let x = -st; x < w + st; x += st * 1.4) {
          const px = x + (r() - 0.5) * st
          const py = y + (r() - 0.5) * st * 0.6
          ribbon(c, px, py, skyAng(B, px, py) * 0.6, (50 + 30 * r()) * U, (22 + 8 * r()) * U, rgba(skyCol(B, px, py, r, 0.04), 0.9, r, 10), (r() - 0.5) * 0.1, 0.1)
        }
      }
    }),
    // 1. Oil pastel block-in: wide waxy strokes, nearly opaque.
    () => pass(B, "base", "pastel", (c) => {
      const r = rng(R.seed * 101 + 1)
      const st = (13 * U) / dn
      for (let y = -st; y < top; y += st * 0.62) {
        for (let x = -st; x < w + st; x += st * 1.25) {
          const px = x + (r() - 0.5) * st * 1.3
          const py = y + (r() - 0.5) * st * 0.8
          pastel(c, r, px, py, skyAng(B, px, py) + (r() - 0.5) * 0.12, (38 + 30 * r()) * U, (10 + 6 * r()) * U, skyCol(B, px, py, r, 0.02), 0.94)
        }
      }
    }),
    // 2. Wax crayon over it, at a crossing angle, one stick lighter or darker than the block-in.
    () => pass(B, "base", "crayon", (c) => {
      const r = rng(R.seed * 103 + 2)
      const st = (9 * U) / dn
      for (let y = -st; y < top; y += st * 0.7) {
        for (let x = -st; x < w + st; x += st * 1.2) {
          const px = x + (r() - 0.5) * st * 1.4
          const py = y + (r() - 0.5) * st
          if (r() < 0.4) continue
          const a = skyAng(B, px, py) + (r() < 0.5 ? 0.38 : -0.28) + (r() - 0.5) * 0.12
          crayon(c, r, px, py, a, (16 + 18 * r()) * U, (4 + 3 * r()) * U, skyCol(B, px, py, r, (r() - 0.5) * 0.16), 0.82)
        }
      }
    }),
    // 3. Coloured-pencil hatching in small sets, cooler up high, warmer near the glow.
    () => pass(B, "base", "pencil", (c) => {
      const r = rng(R.seed * 107 + 3)
      const st = (22 * U) / dn
      for (let y = -st; y < top - 10 * U; y += st * 0.8) {
        for (let x = -st; x < w + st; x += st) {
          const px = x + (r() - 0.5) * st
          const py = y + (r() - 0.5) * st
          if (r() < 0.3) continue
          const g = glowAt(B, px, py)
          const col = g > 0.35 && r() < 0.7 ? stick(P.warm, g, r, 2) : stick(P.sky, skyV(B, py) + (r() < 0.6 ? -0.12 : 0.1), r, 1.4)
          const a = skyAng(B, px, py) + (r() < 0.5 ? 0.9 : -0.75)
          hatch(c, r, px, py, a, (14 + 18 * r()) * U, 3 + Math.floor(r() * 4), 2.6 * U, col, 0.55, 1.3 * U)
        }
      }
      // Stars, before dawn: chalk pricks high up.
      for (let i = 0; i < P.stars; i++) {
        const x = r() * w
        const y = r() ** 1.8 * B.HZ * 0.55
        const s = (1 + r() * 1.8) * U
        chalk(c, r, x, y, r() * TAU, s * 1.6, s, P.chalk, 0.5 + 0.4 * r())
      }
    }),
  ]
}

/* -------------------------------- clouds ---------------------------------- */

type Puff = { x: number; y: number; rx: number; ry: number; t: number }

function cloudPuffs(B: Bake): Puff[] {
  const { R, S, w } = B
  const { X, Y } = sceneFns(B)
  const r = rng(R.seed * 211 + 5)
  const out: Puff[] = []
  const sxMin = (0 - w / 2) / S + B.CX - 0.1
  const sxMax = (w - w / 2) / S + B.CX + 0.1
  const topSy = 0.6 - B.HZ / S - 0.02
  const rows = 13
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1) // 0 near (high), 1 far (at the horizon)
    const sy = lerp(topSy + 0.06, 0.545, t ** 1.25)
    const size = lerp(1, 0.16, t ** 0.9)
    let sx = sxMin + r() * 0.05
    while (sx < sxMax) {
      const rx = size * 0.085 * (0.55 + 0.9 * r())
      // Streets of cloud: a slow noise along each row, and a broad diagonal sweep toward the sun.
      const nn = vnoise(B.T, sx * 3.2 + j * 1.7, j * 0.9 + 33)
      const vv = (sy - topSy) / (0.6 - topSy)
      const sweep = 1 - Math.abs(vv - (0.26 + 0.55 * clamp((sx - sxMin) / (sxMax - sxMin), 0, 1))) / 0.38
      const p = nn * 0.75 + clamp(sweep, 0, 1) * 0.55 - (1 - R.clouds) * 0.95
      if (p > 0.42) {
        const tilt = (sx - B.P.sunX) * 0.028 * (1 - t)
        out.push({ x: X(sx), y: Y(sy + tilt + (r() - 0.5) * 0.014 * size), rx: rx * S, ry: rx * S * lerp(0.36, 0.22, t) * (0.8 + 0.4 * r()), t })
      }
      sx += rx * (0.75 + 0.7 * r())
    }
  }
  // Far rows first, so nearer cloud overlaps them.
  return out.sort((a, b) => b.t - a.t)
}

function cloudSteps(B: Bake): (() => void)[] {
  const { U, R, P } = B
  const dn = Math.sqrt(R.density)
  const puffs = cloudPuffs(B)
  const s = sunPx(B)
  /** Light on a cloud at dawn comes from below and from the sun's side. */
  const litAt = (pf: Puff, u: number, v: number) => {
    const side = clamp((s.sx - pf.x) / (0.9 * B.S), -1, 1)
    const g = glowAt(B, pf.x + u * pf.rx, pf.y + v * pf.ry)
    return clamp(0.42 + 0.42 * v + 0.16 * u * side + g * 0.35 - pf.t * 0.05, 0, 1)
  }
  const shape = (pf: Puff, u: number, v: number) => {
    const e = u * u + v * v * (v < 0 ? 1.15 : 0.85)
    const n = vnoise(B.T, (pf.x + u * pf.rx) / (14 * U), (pf.y + v * pf.ry) / (9 * U)) - 0.5
    return e + n * (0.22 + 0.25 * (1 - pf.t)) < 1
  }
  return [
    () => pass(B, "base", "pastel", (c) => {
      const r = rng(R.seed * 223 + 1)
      for (const pf of puffs) {
        const st = Math.max(5 * U, Math.min(12 * U, pf.ry * 0.5)) / dn
        const n = Math.ceil(((pf.rx * pf.ry * 3.6) / (st * st)) * 1.1)
        for (let i = 0; i < n; i++) {
          const u = r() * 2 - 1
          const v = r() * 2 - 1
          if (!shape(pf, u, v)) continue
          const x = pf.x + u * pf.rx
          const y = pf.y + v * pf.ry
          const th = Math.atan2(v * pf.rx, u * pf.ry)
          const tg = Math.atan2(Math.cos(th) * pf.ry, -Math.sin(th) * pf.rx)
          const ang = Math.atan(Math.tan(tg) * (0.45 - pf.t * 0.35))
          const len = Math.min(pf.rx * 0.8, (12 + 16 * r()) * U * (1 - pf.t * 0.5))
          pastel(c, r, x, y, ang + (r() - 0.5) * 0.14, len, Math.min(pf.ry * 0.6, (6 + 4 * r()) * U), stick(P.cloud, litAt(pf, u, v), r, 1.2), 0.94)
        }
      }
    }),
    () => pass(B, "base", "crayon", (c) => {
      const r = rng(R.seed * 227 + 2)
      for (const pf of puffs) {
        const st = Math.max(4 * U, Math.min(9 * U, pf.ry * 0.4)) / dn
        const n = Math.ceil((pf.rx * pf.ry * 3.6) / (st * st))
        for (let i = 0; i < n; i++) {
          const u = r() * 2 - 1
          const v = r() * 2 - 1
          if (!shape(pf, u, v) || r() < 0.3) continue
          const x = pf.x + u * pf.rx
          const y = pf.y + v * pf.ry
          const lit = litAt(pf, u, v)
          const ang = (v < 0 ? -0.4 : 0.08) + (r() - 0.5) * 0.25
          crayon(c, r, x, y, ang, (10 + 14 * r()) * U * (1 - pf.t * 0.5), (3 + 2.5 * r()) * U, stick(P.cloud, lit + (r() - 0.5) * 0.25, r, 1.2), 0.8)
        }
      }
    }),
    // High mares' tails: long thin crayon pulls fanning away from the sun, lit rose on their undersides.
    () => pass(B, "base", "crayon", (c) => {
      const r = rng(R.seed * 233 + 4)
      const { X, Y } = sceneFns(B)
      const n = Math.round(9 * (0.3 + R.clouds))
      for (let gi = 0; gi < n; gi++) {
        const gx = X(lerp(0.85, 2.0, r()))
        const gy = Y(lerp(0.04, 0.3, r() ** 1.3))
        if (gx > B.w + 40 * U) continue
        // a gentle fan: tilted up away from the sun on either side, as streaks converge toward it in perspective
        const base = -0.05 - clamp((gx - s.sx) / B.w, -1, 1) * 0.22
        const m = 5 + Math.floor(r() * 8)
        for (let i = 0; i < m; i++) {
          const x = gx + (r() - 0.5) * 120 * U
          const y = gy + (i - m / 2) * (5 + 4 * r()) * U
          const g = glowAt(B, x, y)
          pastel(c, r, x, y, base + (r() - 0.5) * 0.06, (50 + 80 * r()) * U, (4 + 4 * r()) * U, stick(P.cloud, 0.35 + 0.3 * r() + g * 0.2, r, 1), 0.55, 0.3)
          if (r() < 0.4) chalk(c, r, x + 6 * U, y + 3 * U, base, (30 + 40 * r()) * U, 1.8 * U, stick(P.cloud, 0.75, r, 1), 0.4)
        }
      }
    }),
    // The lit underside: white chalk and the lightest sticks along the lower rim, with gaps.
    () => pass(B, "base", "chalk", (c) => {
      const r = rng(R.seed * 229 + 3)
      for (const pf of puffs) {
        const g = glowAt(B, pf.x, pf.y)
        const steps = Math.ceil((pf.rx * 2.2) / (7 * U))
        for (let i = 0; i < steps; i++) {
          if (r() < 0.25) continue
          const th = lerp(0.12, Math.PI - 0.12, (i + r()) / steps)
          const u = Math.cos(th) * (0.9 + 0.1 * r())
          const v = Math.sin(th) * (0.82 + 0.12 * r())
          const x = pf.x + u * pf.rx
          const y = pf.y + v * pf.ry
          const ang = Math.atan2(Math.cos(th) * pf.ry, -Math.sin(th) * pf.rx)
          const col = r() < 0.35 + g * 0.5 ? P.chalk : stick(P.cloud, 0.85 + g * 0.2, r, 1)
          const wd = (2 + 2.5 * r()) * U * (1 - pf.t * 0.55)
          chalk(c, r, x, y, ang, (8 + 12 * r()) * U * (1 - pf.t * 0.5), wd, col, 0.55 + 0.4 * Math.max(g, 0.3))
        }
        // pencil shading on the top of the nearer puffs
        if (pf.t < 0.6) {
          const m = Math.ceil(pf.rx / (16 * U))
          for (let i = 0; i < m; i++) {
            const u = (r() * 2 - 1) * 0.7
            hatch(c, r, pf.x + u * pf.rx, pf.y - pf.ry * (0.35 + 0.3 * r()), -0.7 + (r() - 0.5) * 0.3, (9 + 8 * r()) * U, 3, 2.4 * U, stick(P.cloud, 0.15, r, 1.5), 0.5, 1.2 * U)
          }
        }
      }
    }),
  ]
}

/* ---------------------------------- sun ----------------------------------- */

function sunStep(B: Bake) {
  const { U, R, P } = B
  const s = sunPx(B)
  pass(B, "base", "chalk", (c) => {
    const r = rng(R.seed * 307 + 1)
    // Halo: tangential strokes in the warm sticks, thinning outward.
    const n = Math.round(300 * Math.sqrt(R.density))
    for (let i = 0; i < n; i++) {
      const rr = s.sr * (1.15 + 3.4 * r() ** 1.6)
      const a = r() * TAU
      const x = s.sx + Math.cos(a) * rr * 1.25
      const y = s.sy + Math.sin(a) * rr * 0.92
      if (y > B.HZ - 2 * U) continue
      const f = 1 - (rr / s.sr - 1) / 3.4
      chalk(c, r, x, y, a + Math.PI / 2 + (r() - 0.5) * 0.9, (10 + 14 * r()) * U, (2.5 + 3 * r()) * U, stick(P.warm, 0.15 + f * 0.45, r, 1.4), 0.4 + 0.35 * f)
    }
    if (!P.disc) return
    // a gold ring of pastel round the disc, so it reads against the glow
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU
      const rr = s.sr * (0.98 + 0.12 * r())
      const x = s.sx + Math.cos(a) * rr
      const y = s.sy + Math.sin(a) * rr
      if (y > B.HZ - 1 * U) continue
      pastel(c, r, x, y, a + Math.PI / 2, (8 + 8 * r()) * U, (2.4 + 1.6 * r()) * U, stick(P.sun, 0.05, r, 0.8), 0.9, 0)
    }
    // The disc: tight curling strokes, cream at the rim to near white at the core.
    for (let i = 0; i < 520; i++) {
      const rr = s.sr * 0.96 * Math.sqrt(r())
      const a = r() * TAU
      const x = s.sx + Math.cos(a) * rr
      const y = s.sy + Math.sin(a) * rr
      if (y > B.HZ - 1 * U) continue
      chalk(c, r, x, y, a + Math.PI / 2 + (r() - 0.5) * 0.6, (6 + 8 * r()) * U, (2.5 + 2.5 * r()) * U, stick(P.sun, 1.1 - rr / s.sr * 0.7, r, 1), 1)
    }
  })
  // A thin band of morning haze drawn across the lower half of the sun.
  if (P.disc) {
    pass(B, "base", "crayon", (c) => {
      const r = rng(R.seed * 311 + 2)
      for (let i = 0; i < 26; i++) {
        const y = s.sy + s.sr * (0.15 + 0.55 * r())
        const x = s.sx + (r() - 0.5) * s.sr * 5
        if (y > B.HZ - 2 * U) continue
        crayon(c, r, x, y, (r() - 0.5) * 0.06, (20 + 40 * r()) * U, (1.6 + 1.6 * r()) * U, stick(P.warm, 0.25, r, 1.5), 0.6)
      }
    })
  }
}

/* --------------------------------- city ----------------------------------- */

function cityStep(B: Bake) {
  const { U, R, P, S, w } = B
  const { X, Y } = sceneFns(B)
  const r = rng(R.seed * 401 + 3)
  const sxMin = (0 - w / 2) / S + B.CX - 0.05
  const sxMax = (w - w / 2) / S + B.CX + 0.05
  const blocks: { p: Pt[]; lit: number; sx: number }[] = []
  let sx = sxMin
  while (sx < sxMax) {
    const bw = 0.01 + 0.035 * r()
    const cluster = vnoise(B.T, sx * 4 + 3, 17)
    let bh = 0.006 + 0.022 * r() * (0.4 + cluster)
    const nearSun = Math.abs(sx - B.P.sunX) < 0.16
    if (nearSun) bh *= 0.6
    else if (cluster > 0.62 && r() < 0.35) bh += 0.03 + 0.04 * r()
    const x0 = X(sx)
    const x1 = X(sx + bw)
    const y0 = Y(0.6 + 0.002)
    const y1 = Y(0.6 - bh)
    const p: Pt[] = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]]
    if (r() < 0.2) p.splice(2, 0, [(x0 + x1) / 2, y1 - (2 + 6 * r()) * U]) // a pitched or stepped roof
    blocks.push({ p, lit: r(), sx })
    sx += bw * (0.7 + 0.5 * r())
  }
  const s = sunPx(B)
  const hazeV = (x: number) => clamp(0.35 + Math.exp(-(((x - s.sx) / (0.4 * S)) ** 2)) * 0.6 * P.glow, 0, 1)
  for (const b of blocks) idFill(B, 1, b.p)
  ground(B, blocks.map((b) => b.p), (x) => stick(P.city, hazeV(x) - 0.1, r, 0.5), R.seed * 403)
  pass(B, "obj", "crayon", (c) => {
    for (const b of blocks) {
      fillPoly(r, b.p, 3.2 * U, 5 * U, 2 * U, (x, y) => {
        crayon(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.25, (5 + 6 * r()) * U, (2.4 + 1.4 * r()) * U, stick(P.city, hazeV(x) + (r() - 0.5) * 0.2, r, 1), 0.86)
      })
    }
  })
  pass(B, "obj", "pencil", (c) => {
    for (const b of blocks) {
      outline(c, r, b.p.slice(1, -1), stick(P.city, 0.1, r, 0.5), 0.6, 1.1 * U, U, false)
      outline(c, r, b.p.slice(0, 2), stick(P.city, 0.1, r, 0.5), 0.45, 1 * U, U, false)
      // windows still on
      const bb = bbox(b.p)
      const nwin = Math.floor(((bb.x1 - bb.x0) * (bb.y1 - bb.y0)) / (90 * U * U))
      for (let i = 0; i < nwin; i++) {
        if (r() > P.lit * 0.35) continue
        const x = lerp(bb.x0 + 2 * U, bb.x1 - 2 * U, r())
        const y = lerp(bb.y0 + 3 * U, bb.y1 - 2 * U, r())
        chalk(c, r, x, y, 0, 1.8 * U, 1.3 * U, stick(P.lamp, 0.7, r, 1), 0.5 + 0.4 * P.lampK)
      }
    }
  })
}

/* --------------------------- breakwater, lighthouse ------------------------ */

function breakwaterStep(B: Bake) {
  const { U, R, P, S, w } = B
  const { X, Y } = sceneFns(B)
  const r = rng(R.seed * 431 + 1)
  const sxEnd = (w - w / 2) / S + B.CX + 0.1
  const x0 = X(1.42)
  const wall: Pt[] = [[x0, Y(0.607)], [x0 + 6 * U, Y(0.598)], [X(sxEnd), Y(0.595)], [X(sxEnd), Y(0.607)]]
  idFill(B, 2, wall)
  const lx = X(1.47)
  const tw = 0.006 * S
  const tower: Pt[] = [[lx - tw, Y(0.599)], [lx - tw * 0.7, Y(0.556)], [lx + tw * 0.7, Y(0.556)], [lx + tw, Y(0.599)]]
  const cap: Pt[] = [[lx - tw * 0.9, Y(0.556)], [lx - tw * 0.6, Y(0.546)], [lx + tw * 0.6, Y(0.546)], [lx + tw * 0.9, Y(0.556)]]
  idFill(B, 2, tower)
  idFill(B, 2, cap)
  ground(B, [wall, cap], () => P.dark[1], R.seed * 433)
  ground(B, [tower], () => mixc(P.hull[0], P.dark[2], 0.45), R.seed * 434)
  pass(B, "obj", "crayon", (c) => {
    fillPoly(r, wall, 4 * U, 3 * U, 1.5 * U, (x, y) => crayon(c, r, x, y, (r() - 0.5) * 0.3, (6 + 8 * r()) * U, (2.4 + 1.2 * r()) * U, stick(P.dark, 0.45, r, 1.4), 0.9))
    fillPoly(r, tower, 2.2 * U, 3 * U, 1 * U, (x, y) => {
      const band = Math.floor(((Y(0.599) - y) / (0.043 * S)) * 4) % 2 === 1
      const col = band ? P.crane[2] : mixc(P.hull[0], P.dark[2], 0.35)
      crayon(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.2, (4 + 4 * r()) * U, 2.2 * U, col, 0.92)
    })
    fillPoly(r, cap, 2 * U, 2 * U, 0.5 * U, (x, y) => crayon(c, r, x, y, 0, 4 * U, 2 * U, P.dark[1], 0.95))
    // the right side of the tower catches the sun
    beam(c, r, [lx + tw * 0.75, Y(0.597)], [lx + tw * 0.55, Y(0.558)], 1.6 * U, P.rim[1], 0.7, U)
  })
  B.lamps.push({ x: lx, y: Y(0.551), wl: Y(0.6), len: 0.16 * S, col: P.lamp[2], k: 0.9, w: 2.4 * U })
}

/* ---------------------------------- port ----------------------------------- */

function portSteps(B: Bake): (() => void)[] {
  const { U, R, P, S, w } = B
  const { X, Y } = sceneFns(B)
  const sxMin = (0 - w / 2) / S + B.CX - 0.08
  const quayEnd = 0.64
  const quayTop: Pt[] = [[X(sxMin), Y(QUAY)], [X(quayEnd), Y(QUAY - 0.001)], [X(quayEnd + 0.004), Y(QUAY + 0.012)], [X(sxMin), Y(QUAY + 0.012)]]
  type Box = { p: Pt[]; col: RGB }
  const boxes: Box[] = []
  const rb = rng(R.seed * 503 + 1)
  // Container stacks along the quay, with lanes left open under the cranes.
  const lanes = [0.12, 0.33, 0.52]
  for (let sx = sxMin; sx < quayEnd - 0.04; sx += 0.034 + 0.004 * rb()) {
    if (lanes.some((l) => Math.abs(sx + 0.017 - (l + 0.035)) < 0.03)) continue
    const n = Math.floor(rb() * 4.2)
    for (let j = 0; j < n; j++) {
      const y1 = QUAY - 0.0005 - j * 0.0118
      const xo = (rb() - 0.5) * 0.003
      const p: Pt[] = [[X(sx + xo), Y(y1)], [X(sx + xo), Y(y1 - 0.0112)], [X(sx + xo + 0.032), Y(y1 - 0.0112)], [X(sx + xo + 0.032), Y(y1)]]
      boxes.push({ p, col: P.box[Math.floor(rb() * P.box.length)] })
    }
  }
  idFill(B, 3, quayTop)
  for (const b of boxes) idFill(B, 3, b.p)

  type Crane = { x0: number; s: number; up: boolean }
  const cranes: Crane[] = [{ x0: 0.1, s: 1.05, up: false }, { x0: 0.31, s: 0.95, up: false }, { x0: 0.5, s: 0.86, up: true }]
  type Bm = { a: Pt; b: Pt; wd: number; tone: number; light: boolean }
  const beams: Bm[] = []
  const cabs: { p: Pt[]; lamp: Pt }[] = []
  const houses: Pt[][] = []
  const ropes: { a: Pt; b: Pt }[] = []
  for (const cr of cranes) {
    const s = cr.s
    const at = (dx: number, dy: number): Pt => [X(cr.x0 + dx * s), Y(QUAY + dy * s)]
    const add = (a: Pt, b: Pt, wd: number, tone: number, light = false) => beams.push({ a, b, wd: Math.max(1.3 * U, wd * S * s * 1.4), tone: tone - 0.1, light })
    const gauge = 0.075
    const pt = -0.17 // portal top
    // legs and portal
    add(at(0, 0), at(0.004, pt), 0.0062, 0.3, true)
    add(at(gauge, 0), at(gauge - 0.004, pt), 0.0062, 0.35, true)
    add(at(-0.004, pt), at(gauge + 0.004, pt), 0.006, 0.45, true)
    add(at(0.001, -0.05), at(gauge - 0.001, -0.05), 0.0035, 0.3)
    add(at(0.002, -0.05), at(gauge - 0.003, pt + 0.004), 0.0024, 0.25)
    add(at(gauge - 0.002, -0.05), at(0.003, pt + 0.004), 0.0024, 0.25)
    // A-frame above the portal
    const apex = at(0.036, -0.335)
    add(at(0.004, -0.19), apex, 0.0042, 0.4, true)
    add(at(gauge - 0.004, -0.19), apex, 0.0042, 0.45, true)
    add(at(0.036, -0.19), apex, 0.0026, 0.35)
    add(at(0.012, -0.245), at(gauge - 0.012, -0.245), 0.0022, 0.35)
    // boom: two chords and a zigzag truss; the outreach is raised on one crane
    const back0 = at(-0.075, -0.19)
    const hinge = at(gauge + 0.004, -0.19)
    add(back0, hinge, 0.0045, 0.45, true)
    add(at(-0.075, -0.177), at(gauge + 0.004, -0.177), 0.0028, 0.3)
    for (let i = 0; i < 7; i++) {
      const x1 = -0.075 + (i / 7) * (gauge + 0.079)
      const x2 = -0.075 + ((i + 1) / 7) * (gauge + 0.079)
      add(at(x1, -0.177), at(x2, -0.19), 0.0016, 0.3)
    }
    let tip: Pt
    if (cr.up) {
      const a = -1.18
      const L = 0.2 * s * S
      tip = [hinge[0] + Math.cos(a) * L, hinge[1] + Math.sin(a) * L]
      const a2: Pt = [hinge[0] + Math.cos(a) * L * 0.98 + 0.012 * s * S * Math.cos(a + Math.PI / 2), hinge[1] + Math.sin(a) * L * 0.98 + 0.012 * s * S * Math.sin(a + Math.PI / 2)]
      const h2 = at(gauge + 0.004, -0.177)
      beams.push({ a: hinge, b: tip, wd: 0.0042 * S * s, tone: 0.45, light: true })
      beams.push({ a: h2, b: a2, wd: 0.0026 * S * s, tone: 0.3, light: false })
      for (let i = 0; i < 8; i++) {
        const t1 = i / 8
        const t2 = (i + 1) / 8
        beams.push({ a: [lerp(h2[0], a2[0], t1), lerp(h2[1], a2[1], t1)], b: [lerp(hinge[0], tip[0], t2), lerp(hinge[1], tip[1], t2)], wd: 0.0015 * S * s, tone: 0.3, light: false })
      }
      add(apex, tip, 0.0013, 0.2)
    } else {
      tip = at(gauge + 0.2, -0.19)
      add(hinge, tip, 0.0042, 0.45, true)
      add(at(gauge + 0.004, -0.177), at(gauge + 0.19, -0.181), 0.0026, 0.3)
      for (let i = 0; i < 9; i++) {
        const x1 = gauge + 0.004 + (i / 9) * 0.186
        const x2 = gauge + 0.004 + ((i + 1) / 9) * 0.186
        add(at(x1, -0.177 - (i / 9) * 0.004), at(x2, -0.19), 0.0015, 0.3)
      }
      add(apex, at(gauge + 0.11, -0.19), 0.0013, 0.2)
      add(apex, tip, 0.0013, 0.2)
      // trolley, hoist ropes and a hanging spreader
      const tx = gauge + 0.13 + 0.03 * Math.sin(cr.x0 * 40)
      ropes.push({ a: at(tx, -0.177), b: at(tx, -0.07) })
      ropes.push({ a: at(tx + 0.008, -0.177), b: at(tx + 0.008, -0.07) })
      beams.push({ a: at(tx - 0.012, -0.068), b: at(tx + 0.02, -0.068), wd: 0.004 * S * s, tone: 0.5, light: true })
      const cab: Pt[] = [at(tx - 0.004, -0.177), at(tx + 0.014, -0.177), at(tx + 0.013, -0.163), at(tx - 0.003, -0.163)]
      cabs.push({ p: cab, lamp: at(tx + 0.005, -0.169) })
    }
    add(apex, back0, 0.0013, 0.2)
    houses.push([at(-0.068, -0.19), at(-0.068, -0.212), at(-0.01, -0.212), at(-0.004, -0.19)])
    beams.push({ a: apex, b: [apex[0], apex[1] - 0.012 * S * s], wd: 0.0016 * S * s, tone: 0.3, light: false })
  }
  for (const b of beams) idLine(B, 3, b.a, b.b, b.wd)
  for (const h of houses) idFill(B, 3, h)
  for (const cb of cabs) idFill(B, 3, cb.p)

  const sunSide = (x: number) => (x < sunPx(B).sx ? -1 : 1)
  return [
    // quay and containers
    () => {
      const r = rng(R.seed * 509 + 2)
      ground(B, [quayTop, ...boxes.map((b) => b.p)], () => P.dark[1], R.seed * 511)
      pass(B, "obj", "crayon", (c) => {
        fillPoly(r, quayTop, 5 * U, 2.5 * U, 1 * U, (x, y) => {
          const top = y < Y(QUAY + 0.003)
          crayon(c, r, x, y, (r() - 0.5) * 0.1, (8 + 10 * r()) * U, (2 + 1.2 * r()) * U, top ? stick(P.stone, 0.85, r, 1) : stick(P.stone, 0.15, r, 1), 0.92)
        })
        for (const b of boxes) {
          const bb = bbox(b.p)
          fillPoly(r, b.p, 2.6 * U, 3.6 * U, 0.6 * U, (x, y) => {
            const shade = 0.42 + 0.25 * ((y - bb.y0) / (bb.y1 - bb.y0))
            crayon(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.15, (4 + 4 * r()) * U, (2 + 1 * r()) * U, mixc(b.col, P.dark[1], shade), 0.92)
          })
        }
      })
      pass(B, "obj", "pencil", (c) => {
        for (const b of boxes) {
          const bb = bbox(b.p)
          for (let x = bb.x0 + 2.4 * U; x < bb.x1 - 1 * U; x += 2.6 * U) pencil(c, r, x, (bb.y0 + bb.y1) / 2, Math.PI / 2, bb.y1 - bb.y0 - 2 * U, mixc(b.col, P.pencil, 0.6), 0.35, 0.8 * U)
          pencil(c, r, (bb.x0 + bb.x1) / 2, bb.y0 + 0.6 * U, 0, bb.x1 - bb.x0, P.rim[1], 0.6, 1.1 * U)
          outline(c, r, b.p, P.pencil, 0.4, 0.9 * U, U)
        }
        outline(c, r, quayTop, P.pencil, 0.45, 1.1 * U, U)
        // fenders along the quay face
        for (let x = X(sxMin) + 10 * U; x < X(quayEnd); x += 34 * U) crayon(c, r, x, Y(QUAY + 0.008), Math.PI / 2, 8 * U, 4 * U, P.dark[0], 0.9)
      })
    },
    // cranes: dark crayon beams, then warm edge light on the sun side
    () => {
      const r = rng(R.seed * 521 + 3)
      pass(B, "obj", "pastel", (c) => {
        for (const h of houses) {
          fillPoly(r, h, 3 * U, 3 * U, 1 * U, (x, y) => crayon(c, r, x, y, (r() - 0.5) * 0.2, (6 + 6 * r()) * U, 3 * U, stick(P.crane, 0.3, r, 1.2), 0.94))
        }
        for (const b of beams) {
          // backlit: the steel is mostly in shadow, plum at the top shading to the darker sticks near the quay
          const low = clamp((Math.max(b.a[1], b.b[1]) - Y(0.45)) / (Y(QUAY) - Y(0.45)), 0, 1)
          beam(c, r, b.a, b.b, b.wd, stick(P.crane, b.tone - low * 0.15 + (r() - 0.5) * 0.12, r, 0.7), 0.96, U)
        }
        for (const cb of cabs) fillPoly(r, cb.p, 2 * U, 2 * U, 0.5 * U, (x, y) => crayon(c, r, x, y, 0, 4 * U, 2 * U, P.dark[2], 0.95))
      })
      pass(B, "obj", "pencil", (c) => {
        for (const b of beams) {
          if (!b.light) continue
          // warm edge light on the side that faces the sun
          const dx = b.b[0] - b.a[0]
          const dy = b.b[1] - b.a[1]
          const L = Math.hypot(dx, dy) || 1
          let nx = -dy / L
          let ny = dx / L
          if (nx * sunSide(b.a[0]) < 0 || (Math.abs(nx) < 0.2 && ny > 0)) { nx = -nx; ny = -ny }
          const o = b.wd * 0.36
          beam(c, r, [b.a[0] + nx * o, b.a[1] + ny * o], [b.b[0] + nx * o, b.b[1] + ny * o], Math.max(1 * U, b.wd * 0.3), stick(P.rim, 0.6, r, 1.5), 0.8, U)
        }
        for (const rp of ropes) pencil(c, r, (rp.a[0] + rp.b[0]) / 2, (rp.a[1] + rp.b[1]) / 2, Math.PI / 2, rp.b[1] - rp.a[1], P.pencil, 0.7, 1 * U)
        for (const h of houses) {
          outline(c, r, h, P.pencil, 0.5, 1 * U, U)
          pencil(c, r, (h[1][0] + h[2][0]) / 2, h[1][1] + 1 * U, 0, h[2][0] - h[1][0], P.rim[1], 0.8, 1.4 * U)
        }
        for (const cb of cabs) chalk(c, r, cb.lamp[0], cb.lamp[1], 0, 3 * U, 2.2 * U, stick(P.lamp, 0.8, r, 1), 0.5 + 0.45 * P.lampK)
      })
      for (const cb of cabs) B.lamps.push({ x: cb.lamp[0], y: cb.lamp[1], wl: Y(QUAY + 0.012), len: 0.1 * S, col: P.lamp[1], k: 0.45 * P.lampK, w: 1.6 * U })
      // aircraft warning lamps on the apexes
      for (const b of beams) if (b.wd < 0.0017 * S && b.a[0] === b.b[0]) B.lamps.push({ x: b.b[0], y: b.b[1], wl: Y(QUAY + 0.012), len: 0, col: [255, 90, 70], k: 0.8, w: 2 * U })
    },
  ]
}

/* ---------------------------------- ferry ---------------------------------- */

function ferrySteps(B: Bake): (() => void)[] {
  const { U, R, P, S } = B
  const { X, Y } = sceneFns(B)
  const at = (sx: number, sy: number): Pt => [X(sx), Y(sy)]
  const WL = 0.662
  const hull: Pt[] = [at(0.566, WL), at(0.553, 0.633), at(0.62, 0.6315), at(0.76, 0.6295), at(0.86, 0.6245), at(0.908, 0.6175), at(0.9, 0.633), at(0.878, WL)]
  const deck1: Pt[] = [at(0.585, 0.632), at(0.587, 0.6105), at(0.836, 0.6085), at(0.853, 0.627)]
  const deck2: Pt[] = [at(0.62, 0.6105), at(0.622, 0.5935), at(0.8, 0.5925), at(0.812, 0.6085)]
  const bridge: Pt[] = [at(0.77, 0.5935), at(0.776, 0.5805), at(0.826, 0.58), at(0.836, 0.5925)]
  const funnel: Pt[] = [at(0.678, 0.5935), at(0.682, 0.5655), at(0.711, 0.5655), at(0.716, 0.5935)]
  const mastTop = at(0.803, 0.541)
  for (const p of [hull, deck1, deck2, bridge, funnel]) idFill(B, 4, p)
  idLine(B, 4, at(0.803, 0.58), mastTop, 3 * U)
  const r0 = rng(R.seed * 601 + 1)
  const windows: { x: number; y: number; on: boolean; w: number; h: number }[] = []
  for (const [y, xa, xb] of [[0.618, 0.594, 0.83], [0.6005, 0.63, 0.795]] as const) {
    for (let sx = xa; sx < xb; sx += 0.0102) windows.push({ x: X(sx), y: Y(y), on: B.R.lamps && r0() < P.lit, w: 0.0062 * S, h: 0.006 * S })
  }
  const portholes: Pt[] = []
  for (let sx = 0.6; sx < 0.86; sx += 0.0135) portholes.push(at(sx, 0.6395 - (sx - 0.6) * 0.012))
  return [
    () => {
      const r = rng(R.seed * 607 + 2)
      ground(B, [hull], (_x, y) => (y > Y(0.645) ? P.dark[1] : P.city[1]), R.seed * 611)
      ground(B, [deck1, deck2, bridge, funnel], () => P.city[1], R.seed * 613)
      pass(B, "obj", "pastel", (c) => {
        // hull: navy below the rubbing strake, pale above it, a coral boot-top at the water
        fillPoly(r, hull, 4 * U, 2.6 * U, 1 * U, (x, y) => {
          const q = (y - Y(0.6315)) / (Y(WL) - Y(0.6315))
          const col = q > 0.86 ? P.crane[2] : q > 0.36 ? stick(P.dark, 0.35 + (r() - 0.5) * 0.4, r, 0.8) : stick([P.city[0], P.city[2], P.hull[0]], 0.55, r, 1.4)
          pastel(c, r, x, y, (r() - 0.5) * 0.08 - 0.02, (8 + 10 * r()) * U, (2.6 + 1.4 * r()) * U, col, 0.95, 0.3)
        })
        for (const p of [deck1, deck2, bridge]) {
          fillPoly(r, p, 3.4 * U, 2.6 * U, 0.8 * U, (x, y) => pastel(c, r, x, y, (r() - 0.5) * 0.1, (6 + 8 * r()) * U, (2.4 + 1.2 * r()) * U, stick([P.city[1], P.city[2], P.city[3], P.hull[0]], 0.6 + (r() - 0.5) * 0.3, r, 1), 0.95, 0.4))
        }
        fillPoly(r, funnel, 2.4 * U, 2.4 * U, 0.6 * U, (x, y) => {
          const top = y < Y(0.5725)
          pastel(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.2, (5 + 4 * r()) * U, 2.4 * U, top ? P.dark[0] : stick(P.crane, 0.45, r, 1), 0.95, 0.3)
        })
      })
      pass(B, "obj", "crayon", (c) => {
        // windows: warm where the lamps are still on, dusky where they are not
        for (const wd of windows) {
          const col = wd.on ? stick(P.lamp, 0.55 + 0.3 * r(), r, 1) : stick(P.dark, 0.6, r, 1)
          for (let i = 0; i < 3; i++) crayon(c, r, wd.x + (r() - 0.5) * wd.w * 0.3, wd.y + (i - 1) * wd.h * 0.3, (r() - 0.5) * 0.1, wd.w * 0.95, wd.h * 0.42, col, 0.95)
        }
        // bridge window band
        for (let sx = 0.779; sx < 0.826; sx += 0.006) crayon(c, r, X(sx), Y(0.586), 0.05, 0.006 * S, 0.0045 * S, P.dark[0], 0.95)
        // lifeboats
        for (const sx of [0.65, 0.735]) {
          crayon(c, r, X(sx), Y(0.5915), 0, 0.03 * S, 0.0055 * S, P.crane[3], 0.95)
          crayon(c, r, X(sx), Y(0.5935), 0, 0.026 * S, 0.0025 * S, P.crane[1], 0.9)
        }
      })
      pass(B, "obj", "pencil", (c) => {
        for (const p of [hull, deck1, deck2, bridge, funnel]) outline(c, r, p, P.pencil, 0.5, 1.1 * U, U)
        for (const ph of portholes) chalk(c, r, ph[0], ph[1], 0, 2 * U, 1.6 * U, stick(P.lamp, 0.8, r, 1), B.R.lamps ? 0.75 : 0.25)
        // railings: a top rail and short posts
        for (const [y, xa, xb] of [[0.6085, 0.59, 0.835], [0.5915, 0.625, 0.8], [0.629, 0.56, 0.87]] as const) {
          pencil(c, r, X((xa + xb) / 2), Y(y) - 2.6 * U, -0.004, X(xb) - X(xa), P.pencil, 0.55, 0.9 * U)
          for (let sx = xa; sx < xb; sx += 0.006) pencil(c, r, X(sx), Y(y) - 1.4 * U, Math.PI / 2, 2.8 * U, P.pencil, 0.5, 0.8 * U)
        }
        // the edge light: top of the hull and the bow catch the sun
        pencil(c, r, X(0.73), Y(0.6315) - 0.5 * U, -0.012, X(0.9) - X(0.56), P.rim[2], 0.8, 1.8 * U)
        beam(c, r, at(0.908, 0.6175), at(0.879, WL - 0.002), 1.8 * U, P.rim[1], 0.8, U)
        beam(c, r, at(0.836, 0.6085), at(0.853, 0.627), 1.4 * U, P.rim[1], 0.7, U)
        beam(c, r, at(0.826, 0.58), at(0.836, 0.5925), 1.4 * U, P.rim[1], 0.7, U)
        beam(c, r, at(0.711, 0.5655), at(0.716, 0.5935), 1.6 * U, P.rim[2], 0.8, U)
        // mast and its yard
        beam(c, r, at(0.803, 0.58), mastTop, 1.8 * U, P.dark[1], 0.95, U)
        beam(c, r, at(0.795, 0.553), at(0.811, 0.553), 1.3 * U, P.dark[1], 0.9, U)
      })
      // lamps: masthead, string lights to bow and stern, and the reflections of the window rows
      pass(B, "obj", "chalk", (c) => {
        const k = B.R.lamps ? P.lampK : 0.15
        const strings: [Pt, Pt, number][] = [[mastTop, at(0.907, 0.617), 14], [mastTop, at(0.556, 0.632), 34]]
        for (const [a, b, n] of strings) {
          for (let i = 0; i <= n; i++) {
            const t = i / n
            const x = lerp(a[0], b[0], t)
            const y = lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * 0.006 * S
            pencil(c, r, x, y, Math.atan2(b[1] - a[1], b[0] - a[0]), ((b[0] - a[0]) / n) * 1.05, P.pencil, 0.35, 0.7 * U)
            if (i % 2 === 0) chalk(c, r, x, y + 1 * U, 0, 2.2 * U, 1.8 * U, stick(P.lamp, 0.85, r, 1), 0.35 + 0.6 * k)
          }
        }
        chalk(c, r, mastTop[0], mastTop[1], 0, 3 * U, 3 * U, P.chalk, 0.5 + 0.5 * k)
        // soft glow over the lit windows
        for (const wd of windows) if (wd.on) chalk(c, r, wd.x, wd.y, 0, wd.w * 1.6, wd.h * 1.4, P.lamp[2], 0.18 * k)
      })
      if (B.R.lamps) {
        const lit = windows.filter((wd) => wd.on)
        for (let i = 0; i < lit.length; i += 3) B.lamps.push({ x: lit[i].x, y: lit[i].y, wl: Y(WL), len: (0.12 + 0.1 * r()) * S, col: lit[i].y > Y(0.61) ? P.lamp[1] : P.lamp[2], k: 0.75 * P.lampK, w: 2.2 * U })
        B.lamps.push({ x: mastTop[0], y: mastTop[1], wl: Y(WL), len: 0.22 * S, col: P.chalk, k: 0.8 * P.lampK, w: 2.4 * U })
      }
    },
  ]
}

/* --------------------------- pilings, boats, quay -------------------------- */

function nearSteps(B: Bake): (() => void)[] {
  const { U, R, P, S, w, h } = B
  const { X, Y, off } = sceneFns(B)
  const sxMin = (0 - w / 2) / S + B.CX - 0.08
  const sxMax = (w - w / 2) / S + B.CX + 0.08
  const atW = (wl: number) => (sx: number, sy: number): Pt => [X(sx), Y(sy) + off(wl)]
  // In narrow frames the boats and pontoon stay tucked into the right edge and the quay into the left one.
  const shR = Math.min(0, sxMax - 0.08 - 1.78)
  const shL = Math.max(0, sxMin + 0.08)
  const atR = (wl: number) => (sx: number, sy: number): Pt => [X(sx + shR), Y(sy) + off(wl)]
  const atL = (wl: number) => (sx: number, sy: number): Pt => [X(sx + shL), Y(sy) + off(wl)]

  // Pilings: a cluster of old timber posts lashed together.
  const PW = 0.748
  const ap = atW(PW)
  const posts: Pt[][] = []
  for (const [sx, top, wd] of [[0.295, 0.684, 0.009], [0.307, 0.672, 0.0095], [0.319, 0.69, 0.0085], [0.345, 0.705, 0.008], [0.356, 0.712, 0.007]] as const) {
    posts.push([ap(sx - wd / 2, PW + 0.004), ap(sx - wd / 2, top + 0.002), ap(sx, top - 0.002), ap(sx + wd / 2, top + 0.001), ap(sx + wd / 2, PW + 0.004)])
  }
  for (const p of posts) idFill(B, 5, p)

  // Two fishing boats moored on the right, bows to the left.
  type Boat = { id: number; wl: number; x0: number; L: number; hull: RGB; band: RGB; poly: Pt[]; house: Pt[]; roof: Pt[]; mast: [Pt, Pt]; at: (sx: number, sy: number) => Pt }
  const mkBoat = (id: number, wl: number, x0: number, L: number, hullC: RGB, band: RGB): Boat => {
    const at = atR(wl)
    const poly: Pt[] = [at(x0, wl - 0.072), at(x0 + L * 0.12, wl - 0.058), at(x0 + L * 0.5, wl - 0.05), at(x0 + L, wl - 0.054), at(x0 + L - 0.004, wl - 0.02), at(x0 + L - 0.02, wl + 0.002), at(x0 + L * 0.25, wl + 0.003), at(x0 + 0.03, wl - 0.012)]
    const house: Pt[] = [at(x0 + L * 0.56, wl - 0.051), at(x0 + L * 0.57, wl - 0.105), at(x0 + L * 0.82, wl - 0.105), at(x0 + L * 0.83, wl - 0.053)]
    const roof: Pt[] = [at(x0 + L * 0.545, wl - 0.104), at(x0 + L * 0.55, wl - 0.112), at(x0 + L * 0.85, wl - 0.112), at(x0 + L * 0.845, wl - 0.104)]
    return { id, wl, x0, L, hull: hullC, band, poly, house, roof, mast: [at(x0 + L * 0.33, wl - 0.055), at(x0 + L * 0.31, wl - 0.36)], at }
  }
  const boats = [mkBoat(6, 0.83, 1.3, 0.25, P.hull[1], P.hull[0]), mkBoat(7, 0.858, 1.53, 0.27, P.hull[2], P.hull[0])]
  for (const b of boats) {
    idFill(B, b.id, b.poly)
    idFill(B, b.id, b.house)
    idFill(B, b.id, b.roof)
    idLine(B, b.id, b.mast[0], b.mast[1], 4 * U)
  }

  // A low floating pontoon along the bottom right on a few piles, and the stone quay corner bottom left.
  const pw = 0.935
  const pa = atR(pw)
  const deck: Pt[] = [pa(1.17, pw - 0.016), pa(sxMax + 0.1 - shR, pw - 0.02), pa(sxMax + 0.1 - shR, pw - 0.006), pa(1.165, pw - 0.003)]
  const face: Pt[] = [pa(1.165, pw - 0.004), pa(sxMax + 0.1 - shR, pw - 0.007), pa(sxMax + 0.1 - shR, pw + 0.012), pa(1.168, pw + 0.012)]
  const piles: Pt[][] = [1.21, 1.52, 1.83].map((sx) => [pa(sx - 0.006, pw + 0.01), pa(sx - 0.006, pw - 0.082), pa(sx, pw - 0.086), pa(sx + 0.006, pw - 0.083), pa(sx + 0.006, pw + 0.01)])
  const qw = 0.95
  const qa = atL(qw)
  const qBack: Pt[] = [qa(-0.4, 0.852), qa(0.16, 0.864), qa(0.248, 0.884)]
  const qFront: Pt[] = [qa(-0.4, 0.884), qa(0.17, 0.894), qa(0.262, 0.911)]
  const quayTop: Pt[] = [...qBack, qFront[2], qFront[1], qFront[0]]
  const quayFace: Pt[] = [...qFront, qa(0.266, 1.3), qa(-0.4, 1.3)]
  const quay = [...qBack, ...qFront.slice(2), qa(0.266, 1.3), qa(-0.4, 1.3)]
  for (const p of [deck, face, ...piles]) idFill(B, 8, p)
  idFill(B, 9, quay)
  const bol = qa(0.12, 0.878)
  const joints: Pt[][] = []

  return [
    // pilings
    () => {
      const r = rng(R.seed * 701 + 1)
      ground(B, posts, () => P.wood[1], R.seed * 703)
      pass(B, "obj", "crayon", (c) => {
        for (const p of posts) {
          const bb = bbox(p)
          fillPoly(r, p, 2.4 * U, 4 * U, 0.8 * U, (x, y) => {
            const lit = (x - bb.x0) / (bb.x1 - bb.x0)
            crayon(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.12, (6 + 8 * r()) * U, (2.2 + 1 * r()) * U, stick(P.wood, lit * 0.8 + (r() - 0.5) * 0.3, r, 0.8), 0.94)
          })
          // weed at the waterline
          for (let i = 0; i < 4; i++) crayon(c, r, lerp(bb.x0, bb.x1, r()), bb.y1 - (2 + 4 * r()) * U, Math.PI / 2, 5 * U, 2.4 * U, P.box[5], 0.8)
        }
      })
      pass(B, "obj", "pencil", (c) => {
        for (const p of posts) {
          outline(c, r, p, P.pencil, 0.5, 1 * U, U, false)
          beam(c, r, p[3], p[4], 1.3 * U, P.rim[1], 0.6, U)
          const bb = bbox(p)
          for (let y = bb.y0 + 6 * U; y < bb.y1; y += (6 + 6 * r()) * U) pencil(c, r, (bb.x0 + bb.x1) / 2, y, Math.PI / 2 + (r() - 0.5) * 0.1, 5 * U, P.wood[0], 0.4, 0.8 * U)
        }
        // rope lashings
        for (const y of [0.712, 0.722]) for (let i = 0; i < 6; i++) pencil(c, r, X(0.326) + (r() - 0.5) * 2 * U, Y(y) + off(PW) + i * 1.2 * U, (r() - 0.5) * 0.1, 0.07 * S, mixc(P.rim[0], P.wood[2], 0.5), 0.7, 1.1 * U)
      })
    },
    // boats
    () => {
      const r = rng(R.seed * 709 + 2)
      for (const b of boats) {
        const at = b.at
        ground(B, [b.poly], () => mixc(b.hull, P.dark[0], 0.55), R.seed * 711 + b.id)
        ground(B, [b.house, b.roof], () => P.city[1], R.seed * 713 + b.id)
        pass(B, "obj", "pastel", (c) => {
          const bb = bbox(b.poly)
          const sheer = (x: number) => {
            const p = b.poly
            for (let i = 0; i < 3; i++) if (x >= p[i][0] && x <= p[i + 1][0]) return lerp(p[i][1], p[i + 1][1], (x - p[i][0]) / (p[i + 1][0] - p[i][0]))
            return p[0][1]
          }
          fillPoly(r, b.poly, 4 * U, 2.6 * U, 1 * U, (x, y) => {
            const top = sheer(x)
            const q = (y - top) / (bb.y1 - top)
            // gunwale stripe, a shadow under it, the topsides, then the bilge turning away into darkness
            const col = q < 0.13 ? mixc(b.band, P.rim[1], 0.2) : q < 0.24 ? mixc(b.hull, P.dark[0], 0.62) : q > 0.84 ? mixc(b.hull, P.dark[0], 0.7) : mixc(b.hull, P.dark[1], 0.12 + q * 0.42)
            const ang = Math.atan2(sheer(x + 10) - sheer(x - 10), 20) * (1 - q) + (r() - 0.5) * 0.08
            pastel(c, r, x, y, ang, (10 + 14 * r()) * U, (3 + 1.8 * r()) * U, col, 0.95, 0.5)
          })
          const hb = bbox(b.house)
          fillPoly(r, b.house, 3.2 * U, 3 * U, 0.8 * U, (x, y) => {
            const u = (x - hb.x0) / (hb.x1 - hb.x0)
            // the forward face turns toward the sun (left): warm; the long side is in cool half-shade
            const col = u < 0.2 ? mixc(P.hull[0], P.rim[1], 0.5) : mixc(P.hull[0], P.city[1], 0.3 + 0.25 * u + 0.1 * r())
            pastel(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.2, (6 + 6 * r()) * U, (2.8 + 1.2 * r()) * U, col, 0.95, 0.3)
          })
          fillPoly(r, b.roof, 3 * U, 2 * U, 0.6 * U, (x, y) => pastel(c, r, x, y, 0, 6 * U, 2.6 * U, P.dark[1], 0.95, 0))
        })
        pass(B, "obj", "crayon", (c) => {
          // rust streaks running down from the scuppers, and the lit edge of the stem
          for (let i = 0; i < 9; i++) {
            const sx = b.x0 + b.L * (0.15 + 0.8 * r())
            const p = at(sx, b.wl - 0.044)
            crayon(c, r, p[0], p[1] + 8 * U, Math.PI / 2 + (r() - 0.5) * 0.1, (10 + 14 * r()) * U, 2 * U, mixc(P.crane[1], b.hull, 0.3), 0.55)
          }
          beam(c, r, b.poly[0], b.poly[7], 2.4 * U, mixc(b.hull, P.rim[2], 0.5), 0.8, U)
          // light thrown up off the water onto the bow flare, and the bilge's cool reflected light low down
          const hbb = bbox(b.poly)
          for (let i = 0; i < 26; i++) {
            const x = lerp(hbb.x0 + 0.02 * S, hbb.x0 + (hbb.x1 - hbb.x0) * 0.35, r())
            const y = lerp(hbb.y0 + 0.012 * S, hbb.y1 - 0.008 * S, r())
            if (!inPoly(x, y, b.poly)) continue
            crayon(c, r, x, y, -0.2 + (r() - 0.5) * 0.2, (8 + 8 * r()) * U, 2.4 * U, mixc(b.hull, P.rim[1], 0.35 + 0.2 * r()), 0.6)
          }
          for (let i = 0; i < 30; i++) {
            const x = lerp(hbb.x0 + 0.03 * S, hbb.x1 - 0.02 * S, r())
            const y = hbb.y1 - (0.004 + 0.01 * r()) * S
            if (!inPoly(x, y, b.poly)) continue
            crayon(c, r, x, y, (r() - 0.5) * 0.08, (10 + 10 * r()) * U, 2 * U, stick(P.water, 0.5, r, 2), 0.55)
          }
          // lifebuoy on the wheelhouse side
          const lb = at(b.x0 + b.L * 0.6, b.wl - 0.066)
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * TAU
            crayon(c, r, lb[0] + Math.cos(a) * 6 * U, lb[1] + Math.sin(a) * 6 * U, a + Math.PI / 2, 6 * U, 3 * U, k % 3 === 0 ? P.hull[0] : P.crane[3], 0.95)
          }
          // radar bar and a short aerial on the roof
          const rf = at(b.x0 + b.L * 0.7, b.wl - 0.112)
          beam(c, r, [rf[0], rf[1]], [rf[0], rf[1] - 12 * U], 2 * U, P.dark[0], 0.95, U)
          beam(c, r, [rf[0] - 12 * U, rf[1] - 13 * U], [rf[0] + 12 * U, rf[1] - 13 * U], 3 * U, P.dark[1], 0.95, U, P.rim[2], -1)
          beam(c, r, at(b.x0 + b.L * 0.8, b.wl - 0.112), at(b.x0 + b.L * 0.8, b.wl - 0.19), 1.2 * U, P.dark[0], 0.9, U)
        })
        pass(B, "obj", "crayon", (c) => {
          // wheelhouse windows, one lamp still burning inside
          for (let i = 0; i < 3; i++) {
            const sx = b.x0 + b.L * (0.6 + i * 0.075)
            const lamp = B.R.lamps && i === 1
            const p = at(sx, b.wl - 0.088)
            for (let k = 0; k < 3; k++) crayon(c, r, p[0] + (r() - 0.5) * U, p[1] + (k - 1) * 3 * U, 0, 0.032 * S, 3.4 * U, lamp ? stick(P.lamp, 0.6, r, 1) : stick(P.dark, 0.2, r, 1), 0.95)
            if (lamp) B.lamps.push({ x: p[0], y: p[1], wl: at(0, b.wl)[1], len: 0.1 * S, col: P.lamp[1], k: 0.7 * P.lampK, w: 3 * U })
          }
          // tyres hung as fenders
          for (let i = 0; i < 4; i++) {
            const p = at(b.x0 + b.L * (0.25 + i * 0.18), b.wl - 0.03)
            for (let k = 0; k < 5; k++) crayon(c, r, p[0], p[1], (k / 5) * Math.PI, 7 * U, 3 * U, P.dark[0], 0.9)
          }
          // a heap of net on the stern deck
          const nh = at(b.x0 + b.L * 0.9, b.wl - 0.06)
          for (let i = 0; i < 40; i++) crayon(c, r, nh[0] + (r() - 0.5) * 0.04 * S, nh[1] - r() * 0.02 * S, r() * TAU, (4 + 6 * r()) * U, 2 * U, stick([P.box[5], P.box[1], P.ripple[2]], r(), r, 1), 0.85)
          // mast and boom, crayon
          beam(c, r, b.mast[0], b.mast[1], 3.4 * U, P.dark[1], 0.95, U, P.rim[1], 1)
          beam(c, r, at(b.x0 + b.L * 0.32, b.wl - 0.13), at(b.x0 + b.L * 0.75, b.wl - 0.24), 2.2 * U, P.dark[1], 0.9, U)
          const flag = at(b.x0 + b.L * 0.31, b.wl - 0.36)
          crayon(c, r, flag[0] + 7 * U, flag[1] + 4 * U, 0.1, 12 * U, 5 * U, P.crane[3], 0.95)
        })
        pass(B, "obj", "pencil", (c) => {
          outline(c, r, b.poly, P.pencil, 0.55, 1.2 * U, U)
          outline(c, r, b.house, P.pencil, 0.5, 1 * U, U)
          // the sheer catches the light
          pencil(c, r, (b.poly[0][0] + b.poly[3][0]) / 2, (b.poly[1][1] + b.poly[2][1]) / 2 + 0.5 * U, Math.atan2(b.poly[3][1] - b.poly[0][1], b.poly[3][0] - b.poly[0][0]) * 0.6, b.poly[3][0] - b.poly[0][0], P.rim[2], 0.85, 2.2 * U)
          beam(c, r, b.house[2], b.house[3], 1.6 * U, P.rim[2], 0.75, U)
          // rigging: stays from the masthead to bow and stern
          const top = b.mast[1]
          for (const end of [at(b.x0 + 0.005, b.wl - 0.07), at(b.x0 + b.L, b.wl - 0.055), at(b.x0 + b.L * 0.75, b.wl - 0.24)]) {
            const L = Math.hypot(end[0] - top[0], end[1] - top[1])
            pencil(c, r, (top[0] + end[0]) / 2, (top[1] + end[1]) / 2, Math.atan2(end[1] - top[1], end[0] - top[0]), L, P.pencil, 0.6, 1 * U)
          }
          // mooring lines down to the pontoon cleats
          for (const [sx, sy] of [[b.x0 + 0.01, b.wl - 0.065], [b.x0 + b.L - 0.01, b.wl - 0.05]] as const) {
            const a = at(sx, sy)
            const e = pa(sx + (sx < b.x0 + 0.1 ? -0.07 : 0.05), pw - 0.014)
            const n = 8
            for (let i = 0; i < n; i++) {
              const t1 = i / n
              const t2 = (i + 1) / n
              const y1 = lerp(a[1], e[1], t1) + Math.sin(t1 * Math.PI) * 10 * U
              const y2 = lerp(a[1], e[1], t2) + Math.sin(t2 * Math.PI) * 10 * U
              const x1 = lerp(a[0], e[0], t1)
              const x2 = lerp(a[0], e[0], t2)
              pencil(c, r, (x1 + x2) / 2, (y1 + y2) / 2, Math.atan2(y2 - y1, x2 - x1), Math.hypot(x2 - x1, y2 - y1) * 1.1, mixc(P.rim[0], P.pencil, 0.55), 0.75, 1.3 * U)
            }
          }
        })
      }
    },
    // pontoon and quay corner
    () => {
      const r = rng(R.seed * 719 + 3)
      ground(B, [deck, face, ...piles], () => P.wood[1], R.seed * 721)
      ground(B, [quayTop], () => P.stone[2], R.seed * 723)
      ground(B, [quayFace], () => P.stone[1], R.seed * 725)
      pass(B, "obj", "crayon", (c) => {
        // piles first, behind the deck
        for (const p of piles) {
          const bb = bbox(p)
          fillPoly(r, p, 2.4 * U, 4 * U, 0.8 * U, (x, y) => crayon(c, r, x, y, Math.PI / 2 + (r() - 0.5) * 0.12, (8 + 8 * r()) * U, (2.4 + 1 * r()) * U, stick(P.wood, ((x - bb.x0) / (bb.x1 - bb.x0)) * 0.9, r, 0.8), 0.95))
          beam(c, r, p[3], p[4], 1.6 * U, P.rim[1], 0.7, U)
        }
        fillPoly(r, face, 4 * U, 2.6 * U, 1 * U, (x, y) => crayon(c, r, x, y, (r() - 0.5) * 0.08, (10 + 12 * r()) * U, (2.6 + 1.4 * r()) * U, stick(P.wood, 0.12, r, 1), 0.95))
        // the deck planks catch the low sun
        fillPoly(r, deck, 3.4 * U, 2.2 * U, 0.8 * U, (x, y) => crayon(c, r, x, y, (r() - 0.5) * 0.05, (12 + 16 * r()) * U, (2.2 + 1.2 * r()) * U, mixc(stick(P.wood, 0.95, r, 1), P.rim[1], 0.2 + 0.35 * r()), 0.95))
        // floats under the deck
        for (let sx = 1.2; sx < sxMax + 0.1 - shR; sx += 0.07) {
          const p = pa(sx, pw + 0.014)
          crayon(c, r, p[0], p[1], 0, 0.05 * S, 6 * U, P.dark[0], 0.9)
        }
        // quay: lit top, shadowed stone face
        fillPoly(r, quayTop, 5 * U, 3 * U, 1.2 * U, (x, y) => crayon(c, r, x, y, 0.06 + (r() - 0.5) * 0.15, (10 + 12 * r()) * U, (3 + 2 * r()) * U, r() < 0.45 ? mixc(P.stone[3], P.rim[1], 0.45 + 0.2 * r()) : mixc(stick(P.stone, 0.85, r, 1), P.rim[0], 0.2), 0.95))
        joints.length = 0
        // the quay face, course by course: each block its own stone, lit a little on its sun side, wet and weedy low down
        const qb = bbox(quayFace)
        const course = 0.03 * S
        const wetY = Math.min(qb.y1, h) - 0.03 * S
        for (let row = 0, y0 = Y(0.9) + off(qw) - course; y0 < h + course; row++, y0 += course) {
          let x0 = qb.x0 - (row % 2) * 0.03 * S
          while (x0 < qb.x1) {
            const bwid = (0.05 + 0.035 * r()) * S
            const tone = 0.3 + 0.55 * r()
            const blk: Pt[] = [[x0 + 1.5 * U, y0 + 1.5 * U], [x0 + bwid - 1.5 * U, y0 + 1.5 * U], [x0 + bwid - 1.5 * U, y0 + course - 1.5 * U], [x0 + 1.5 * U, y0 + course - 1.5 * U]]
            joints.push(blk)
            fillPoly(r, blk, 4 * U, 3 * U, 0.6 * U, (x, y) => {
              if (!inPoly(x, y, quayFace)) return
              const wet = clamp((y - wetY) / (0.03 * S), 0, 1)
              const lit = (x - x0) / bwid > 0.8 ? 0.25 : (y - y0) / course < 0.25 ? 0.15 : 0
              const col = wet > 0.2 && r() < wet * 0.8 ? mixc(P.box[5], P.dark[0], 0.4) : lit > 0.2 && r() < 0.5 ? mixc(P.stone[3], P.rim[0], 0.3) : stick(P.stone, tone + lit - wet * 0.4, r, 0.8)
              crayon(c, r, x, y, (r() - 0.5) * 0.25, (8 + 8 * r()) * U, (3 + 1.5 * r()) * U, col, 0.95)
            })
            x0 += bwid
          }
        }
        // bollard: a cast-iron mushroom, dark on the shadow side, a warm edge where the sun reaches it
        const bw = 0.028 * S
        const bh = 0.04 * S
        const post: Pt[] = [[bol[0] - bw * 0.42, bol[1]], [bol[0] - bw * 0.34, bol[1] - bh], [bol[0] + bw * 0.34, bol[1] - bh], [bol[0] + bw * 0.42, bol[1]]]
        const capP: Pt[] = [[bol[0] - bw * 0.62, bol[1] - bh + 2 * U], [bol[0] - bw * 0.55, bol[1] - bh - 5 * U], [bol[0] + bw * 0.55, bol[1] - bh - 5 * U], [bol[0] + bw * 0.62, bol[1] - bh + 2 * U]]
        for (const pp of [post, capP]) {
          fillPoly(r, pp, 2.2 * U, 2.6 * U, 0.4 * U, (x, y) => {
            const u = (x - bol[0]) / bw + 0.5
            crayon(c, r, x, y, pp === post ? Math.PI / 2 + (r() - 0.5) * 0.15 : (r() - 0.5) * 0.1, (6 + 4 * r()) * U, 2.6 * U, u > 0.82 ? P.rim[0] : stick(P.dark, u * 1.1, r, 0.8), 0.96)
          })
        }
        // its shadow, thrown left across the lit stone
        for (let i = 0; i < 10; i++) crayon(c, r, bol[0] - (8 + i * 4.5) * U, bol[1] - 1 * U + (r() - 0.5) * 2 * U, -0.05, 14 * U, 4 * U, P.stone[1], 0.6)
      })
      pass(B, "obj", "pencil", (c) => {
        const db = bbox(deck)
        for (let x = db.x0 + 10 * U; x < w + 20 * U; x += (12 + 6 * r()) * U) pencil(c, r, x, (db.y0 + db.y1) / 2, Math.PI / 2 - 0.5, (db.y1 - db.y0) * 1.1, P.wood[1], 0.55, 1 * U)
        pencil(c, r, (db.x0 + w) / 2, db.y0 + 1 * U, -0.004, w - db.x0 + 20 * U, P.rim[2], 0.9, 2 * U)
        outline(c, r, face, P.pencil, 0.5, 1.2 * U, U)
        for (const sx of [1.3, 1.62, 1.92]) {
          const p = pa(sx, pw - 0.013)
          crayon(c, r, p[0], p[1], 0, 14 * U, 3.4 * U, P.dark[0], 0.95)
        }
        // stone joints on the quay face
        for (const blk of joints) {
          if (!inPoly((blk[0][0] + blk[1][0]) / 2, blk[2][1], quayFace)) continue
          outline(c, r, [blk[3], blk[0], blk[1]], P.pencil, 0.5, 1.1 * U, U, false)
          pencil(c, r, (blk[0][0] + blk[1][0]) / 2, blk[0][1] + 1.6 * U, (r() - 0.5) * 0.03, (blk[1][0] - blk[0][0]) * 0.8, mixc(P.stone[3], P.rim[0], 0.4), 0.5, 1.4 * U)
        }
        for (let i = 0; i < 2; i++) pencil(c, r, (qFront[i][0] + qFront[i + 1][0]) / 2, (qFront[i][1] + qFront[i + 1][1]) / 2, Math.atan2(qFront[i + 1][1] - qFront[i][1], qFront[i + 1][0] - qFront[i][0]), qFront[i + 1][0] - qFront[i][0], P.rim[2], 0.85, 2.2 * U)
        // a coil of rope by the bollard
        for (let i = 0; i < 6; i++) {
          const cx = bol[0] + 0.045 * S
          const cy = bol[1] - 3 * U
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * TAU
            pencil(c, r, cx + Math.cos(a) * (10 + i) * U, cy + Math.sin(a) * (3.4 + i * 0.3) * U, a + Math.PI / 2, 8 * U, mixc(P.rim[0], P.wood[2], 0.4), 0.7, 1.4 * U)
          }
        }
        outline(c, r, [[bol[0] - 0.012 * S, bol[1]], [bol[0] - 0.0095 * S, bol[1] - 0.04 * S], [bol[0] + 0.0095 * S, bol[1] - 0.04 * S], [bol[0] + 0.012 * S, bol[1]]], P.pencil, 0.6, 1.1 * U, U, false)
      })
    },
  ]
}

/* ---------------------------------- water ---------------------------------- */

function waterSteps(B: Bake): (() => void)[] {
  const { U, R, P, w, h } = B
  const dn = Math.sqrt(R.density)
  const y0 = B.HZ - 1 * U
  const depth = (y: number) => clamp((y - B.HZ) / (h - B.HZ), 0, 1)
  const ripple = (x: number, y: number) => {
    const d = depth(y)
    return vnoise(B.T, x / ((50 + 260 * d) * U) + 7, y / ((1.6 + 9 * d) * U) + 99)
  }
  const waterV = (y: number) => depth(y) ** 0.7
  return [
    // Toned ground under the water, as under the sky.
    () => pass(B, "base", "ground", (c) => {
      const r = rng(R.seed * 797 + 5)
      let y = y0
      while (y < h + 10 * U) {
        const d = depth(y)
        const st = (6 + 14 * d) * U
        for (let x = -st * 2; x < w + st * 2; x += st * 2.6) {
          const px = x + (r() - 0.5) * st
          const g = glowAt(B, px, B.HZ - (y - B.HZ) * 0.6)
          const col = r() < g * 0.5 ? stick(P.warm, g * 0.8, r, 1.2) : stick(P.water, waterV(y) + 0.06, r, 1.2)
          ribbon(c, px, y + (r() - 0.5) * st * 0.4, (r() - 0.5) * 0.03, (40 + 60 * d) * U, st * 1.5, rgba(col, 0.9, r, 10), 0, 0.1)
        }
        y += st * 0.6
      }
    }),
    // Long horizontal oil pastel pulls, warm near the horizon, indigo underfoot.
    () => pass(B, "base", "pastel", (c) => {
      const r = rng(R.seed * 801 + 1)
      let y = y0
      while (y < h + 10 * U) {
        const d = depth(y)
        const dy = ((2.2 + 7 * d) * U) / dn
        const dx = ((12 + 30 * d) * U) / dn
        for (let x = -dx; x < w + dx; x += dx) {
          const px = x + (r() - 0.5) * dx
          const py = y + (r() - 0.5) * dy
          const g = glowAt(B, px, B.HZ - (py - B.HZ) * 0.6)
          const col = r() < g * 0.6 ? stick(P.warm, g, r, 1.5) : stick(P.water, waterV(py) - g * 0.12, r, 1.5)
          pastel(c, r, px, py, (r() - 0.5) * 0.05, (16 + 50 * d) * U * (0.7 + 0.6 * r()), (2.4 + 8 * d) * U * (0.8 + 0.4 * r()), col, 0.93, 0.5)
        }
        y += dy * 0.8
      }
    }),
    // Crayon ripples: bands of darker and lighter sticks, thin near the horizon and broad close by.
    () => pass(B, "base", "crayon", (c) => {
      const r = rng(R.seed * 809 + 2)
      let y = y0
      while (y < h + 10 * U) {
        const d = depth(y)
        const dy = ((1.8 + 5.5 * d) * U) / dn
        const dx = ((8 + 22 * d) * U) / dn
        for (let x = -dx; x < w + dx; x += dx) {
          const px = x + (r() - 0.5) * dx
          const py = y + (r() - 0.5) * dy
          const nb = ripple(px, py)
          const len = (10 + 40 * d) * U * (0.6 + 0.8 * r())
          const wd = (1.4 + 5 * d) * U * (0.7 + 0.5 * r())
          if (nb < 0.4) crayon(c, r, px, py, (r() - 0.5) * 0.04, len, wd, r() < 0.5 ? stick(P.ripple, r(), r, 1) : stick(P.water, waterV(py) + 0.25, r, 1.2), 0.75)
          else if (nb > 0.62) {
            const g = glowAt(B, px, B.HZ - (py - B.HZ) * 0.6)
            crayon(c, r, px, py, (r() - 0.5) * 0.04, len, wd * 0.8, r() < g ? stick(P.warm, 0.6, r, 2) : stick(P.water, waterV(py) - 0.28, r, 1.2), 0.8)
          }
        }
        y += dy
      }
    }),
    // Fine pencil lines riding the swell.
    () => pass(B, "base", "pencil", (c) => {
      const r = rng(R.seed * 811 + 3)
      let y = y0
      while (y < h + 10 * U) {
        const d = depth(y)
        const dy = ((3 + 8 * d) * U) / dn
        const dx = ((30 + 60 * d) * U) / dn
        for (let x = -dx; x < w + dx; x += dx) {
          if (r() < 0.35) continue
          const px = x + (r() - 0.5) * dx
          const py = y + (r() - 0.5) * dy
          const dark = ripple(px, py) < 0.5
          pencil(c, r, px, py, (r() - 0.5) * 0.03, (20 + 60 * d) * U, dark ? P.ripple[Math.floor(r() * 2)] : stick(P.water, waterV(py) - 0.3, r, 1), 0.5, (1 + 0.8 * d) * U)
        }
        y += dy
      }
    }),
  ]
}

/** The water mirrors whatever stands on it: every dash looks up the id map at its mirrored point and borrows that colour. */
function reflectStep(B: Bake) {
  const { U, R, P, w, h, S, k } = B
  const { Y, off } = sceneFns(B)
  // read the id map and the drawn objects once
  const idd = B.idc.getImageData(0, 0, B.iw, B.ih).data
  const ids = new Uint8Array(B.iw * B.ih)
  for (let i = 0; i < ids.length; i++) ids[i] = idd[i * 4 + 3] > 150 ? idd[i * 4] : 0
  const od = B.oc.getImageData(0, 0, B.W, B.H).data
  const objs: Obj[] = [
    { id: 9, wl: 0.95, k: 0.8 }, { id: 8, wl: 0.935, k: 0.8 }, { id: 7, wl: 0.858, k: 1 }, { id: 6, wl: 0.83, k: 1 },
    { id: 5, wl: 0.748, k: 1 }, { id: 4, wl: 0.662, k: 1 }, { id: 3, wl: QUAY + 0.012, k: 0.95 }, { id: 2, wl: 0.607, k: 0.7 }, { id: 1, wl: 0.601, k: 0.5 },
  ].map((o) => ({ ...o, wl: Y(o.wl) + off(o.wl) }))
  const depth = (y: number) => clamp((y - B.HZ) / (h - B.HZ), 0, 1)
  const dn = Math.sqrt(R.density)
  pass(B, "base", "crayon", (c) => {
    const r = rng(R.seed * 821 + 1)
    let y = B.HZ + 1 * U
    while (y < h) {
      const d = depth(y)
      const dy = ((1.4 + 3.2 * d) * U) / Math.max(1, dn)
      const dx = ((4 + 7 * d) * U) / dn
      // swell: whole rows break up into slices
      for (let x = -dx; x < w + dx; x += dx) {
        const px = x + (r() - 0.5) * dx
        const py = y + (r() - 0.5) * dy * 0.6
        let hit: Obj | null = null
        let mx = 0
        let my = 0
        for (const o of objs) {
          if (o.wl >= py - 0.5) continue
          const dd = py - o.wl
          const wob = (vnoise(B.T, py / (2.4 * U + dd * 0.02) + 3, px / (180 * U) + 11) - 0.5) * (3 * U + dd * 0.11)
          const ox = px + wob
          const oy = o.wl - dd * 0.94
          if (oy < 0 || ox < 0 || ox >= w) continue
          const ii = ((oy / 2) | 0) * B.iw + ((ox / 2) | 0)
          const id = ids[ii]
          if (id === o.id) {
            hit = o
            mx = ox
            my = oy
            break
          }
          if (id && id > o.id) break // a nearer object stands in front of this point of the mirror
        }
        if (!hit) continue
        const dd = py - hit.wl
        const fade = clamp(1 - dd / (0.42 * S), 0, 1)
        if (r() > 0.25 + 0.75 * fade) continue
        // a broken mirror: skip dashes on the swell's crests
        if (vnoise(B.T, px / ((30 + 90 * d) * U) + 51, py / ((1.2 + 4 * d) * U) + 5) > 0.72) continue
        // borrow the colour from the drawing, a few pixels around the mirrored point
        let rr = 0
        let gg = 0
        let bb = 0
        let n = 0
        for (let t = 0; t < 4; t++) {
          const qx = clamp(Math.round((mx + (r() - 0.5) * 3 * U) * k), 0, B.W - 1)
          const qy = clamp(Math.round((my + (r() - 0.5) * 3 * U) * k), 0, B.H - 1)
          const qi = (qy * B.W + qx) * 4
          if (od[qi + 3] < 120) continue
          rr += od[qi]
          gg += od[qi + 1]
          bb += od[qi + 2]
          n++
        }
        if (!n) continue
        let col: RGB = [rr / n, gg / n, bb / n]
        const wcol = stick(P.water, depth(py) ** 0.7 + 0.1, r, 1)
        col = mixc(mixc(col, P.dark[1], 0.18), wcol, 0.18 + 0.4 * (1 - fade))
        crayon(c, r, px, py, (r() - 0.5) * 0.04, (5 + 14 * d + 6 * r()) * U, (1.4 + 2.6 * d) * U * (0.8 + 0.4 * r()), col, (0.55 + 0.4 * fade) * hit.k)
      }
      y += dy
    }
    // dark contact lines where hulls, posts and walls meet the water
    for (const o of objs) {
      if (o.id === 1) continue
      for (let x = 0; x < w; x += 3 * U) {
        const ii = (((o.wl - 3 * U) / 2) | 0) * B.iw + ((x / 2) | 0)
        if (ids[ii] !== o.id || r() < 0.3) continue
        crayon(c, r, x, o.wl + (1 + r() * 2) * U, 0, (5 + 6 * r()) * U, 2 * U, P.dark[0], 0.7)
      }
    }
  })
  // Sun path: crayon and chalk glitter in a column that widens toward you, broken by the swell.
  pass(B, "base", "chalk", (c) => {
    const r = rng(R.seed * 827 + 2)
    const s = sunPx(B)
    let y = B.HZ + 1 * U
    while (y < h) {
      const d = depth(y)
      const hw = (0.014 + 0.12 * d ** 1.1) * S * (P.disc ? 1 : 0.8)
      const n = Math.ceil((hw / ((5 + 6 * d) * U)) * P.path)
      for (let i = 0; i < n; i++) {
        const u = (r() + r() + r() - 1.5) / 1.5
        const x = s.sx + u * hw
        const py = y + (r() - 0.5) * 2 * U
        if (vnoise(B.T, x / ((24 + 70 * d) * U) + 19, py / ((1.3 + 3.5 * d) * U) + 77) < 0.42) continue
        const core = 1 - Math.abs(u)
        const col = r() < core * 0.6 ? P.chalk : stick(P.sun, core * 0.9, r, 1.5)
        const a = (0.5 + 0.45 * core) * (1 - d * 0.45) * (P.disc ? 1 : 0.7)
        chalk(c, r, x, py, (r() - 0.5) * 0.04, (5 + 22 * d) * U * (0.5 + r()), (1.2 + 3 * d) * U, col, a)
      }
      y += (1.8 + 4.5 * d) * U
    }
  })
}

/* ---------------------------------- live ----------------------------------- */

function liveSetup(B: Bake) {
  const { U, R, P, S, h } = B
  const { X, Y } = sceneFns(B)
  const r = rng(R.seed * 901 + 1)
  const s = sunPx(B)
  const depth = (y: number) => clamp((y - B.HZ) / (h - B.HZ), 0, 1)
  for (let i = 0; i < 150; i++) {
    const y = B.HZ + (r() ** 1.3) * (h - B.HZ) * 0.95
    const d = depth(y)
    const hw = (0.014 + 0.12 * d ** 1.1) * S
    const u = (r() + r() - 1) * 0.9
    B.glints.push({ x: s.sx + u * hw, y, len: (4 + 14 * d) * U, w: (1.2 + 2 * d) * U, ph: r(), f: 1 + Math.floor(r() * 3), col: r() < 0.6 ? P.chalk : P.sun[1] })
  }
  const flock: [number, number, number][] = [
    [0.2, 0.2, 1], [0.235, 0.215, 0.9], [0.27, 0.19, 0.8], [0.4, 0.26, 0.85], [0.74, 0.47, 0.9], [0.79, 0.455, 0.8], [0.86, 0.5, 0.7],
    [1.3, 0.2, 0.6], [1.36, 0.23, 0.55], [1.42, 0.18, 0.5], [1.02, 0.33, 1.3], [1.58, 0.34, 0.7], [0.58, 0.14, 0.9],
  ]
  for (const [sx, sy, sc] of flock) {
    const g = glowAt(B, X(sx), Y(sy))
    B.gulls.push({ x: X(sx), y: Y(sy), s: sc * 5 * U * (0.85 + 0.3 * r()), ph: r(), col: g > 0.45 && r() < 0.5 ? P.rim[2] : P.dark[1] })
  }
}

/** The only moving parts: lamp reflections shimmer, the sun path glitters, the gulls drift. All periodic over LOOP. */
function paintLive(B: Bake, t: number) {
  const c = B.lv
  const { U, P } = B
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalCompositeOperation = "source-over"
  c.clearRect(0, 0, B.W, B.H)
  c.setTransform(B.k, 0, 0, B.k, 0, 0)
  const ph = (TAU * t) / LOOP
  // lamp reflections: a column of dashes that sway sideways a little
  for (let li = 0; li < B.lamps.length; li++) {
    const L = B.lamps[li]
    const r = rng(B.R.seed * 1000 + li * 17)
    const flick = 1 + 0.03 * Math.sin(ph * 3 + li)
    chalk(c, r, L.x, L.y, 0, L.w * 1.6, L.w * 1.5, L.col, 0.5 * L.k * flick)
    if (L.len <= 0) continue
    let y = L.wl + 1 * U
    let i = 0
    while (y < L.wl + L.len) {
      const q = (y - L.wl) / L.len
      const sway = Math.sin(ph * 2 + i * 0.9 + li) * (0.6 + 2.2 * q) * U + Math.sin(ph * 3 - i * 0.37) * 0.8 * U
      if (r() < 0.72 - q * 0.3) {
        const len = (3 + 10 * q + 6 * r()) * U * (0.8 + 0.4 * Math.sin(ph + i))
        crayon(c, r, L.x + sway + (r() - 0.5) * 3 * U * q, y, 0, len, (1.3 + 1.2 * r()) * U, L.col, (0.85 - 0.6 * q) * L.k)
      }
      y += (2.2 + 3.5 * q) * U
      i++
    }
  }
  // glints on the sun path
  const r = rng(B.R.seed * 2003 + 1)
  for (const g of B.glints) {
    const b = Math.max(0, Math.sin(ph * g.f + g.ph * TAU)) ** 3
    if (b < 0.05) continue
    chalk(c, r, g.x, g.y, 0, g.len * (0.6 + 0.4 * b), g.w, g.col, 0.85 * b * P.path)
  }
  // gulls: a pair of thin bent strokes each, drifting on a slow small circle
  for (let i = 0; i < B.gulls.length; i++) {
    const g = B.gulls[i]
    const a = ph + g.ph * TAU
    const x = g.x + Math.cos(a) * 7 * U
    const y = g.y + Math.sin(a * 2) * 2.5 * U
    const flap = 0.28 + 0.16 * Math.sin(ph * 5 + g.ph * TAU)
    const rr = rng(B.R.seed * 3001 + i)
    const s = g.s
    ribbon(c, x - s * 0.5, y - s * flap * 0.5, -flap * 1.2, s * 1.1, Math.max(1, s * 0.22), rgba(g.col, 0.92, rr, 4), -0.12, 0)
    ribbon(c, x + s * 0.5, y - s * flap * 0.5, flap * 1.2, s * 1.1, Math.max(1, s * 0.22), rgba(g.col, 0.92, rr, 4), 0.12, 0)
  }
  c.setTransform(1, 0, 0, 1, 0, 0)
  if (B.R.tooth > 0.01) {
    c.globalCompositeOperation = "destination-out"
    c.drawImage(B.punch.chalk, 7, 11, B.w, B.h, 0, 0, B.W, B.H)
    c.globalCompositeOperation = "source-over"
  }
}

/* --------------------------------- steps ----------------------------------- */

function* bakeSteps(B: Bake): Generator<void, void, void> {
  paperStep(B)
  yield
  for (const s of skySteps(B)) { s(); yield }
  for (const s of cloudSteps(B)) { s(); yield }
  sunStep(B)
  yield
  cityStep(B)
  breakwaterStep(B)
  yield
  for (const s of portSteps(B)) { s(); yield }
  for (const s of ferrySteps(B)) { s(); yield }
  for (const s of nearSteps(B)) { s(); yield }
  for (const s of waterSteps(B)) { s(); yield }
  reflectStep(B)
  yield
  // Compose: paper and water, the objects on top, then the tooth pressed into everything.
  const f = mkCanvas(B.W, B.H)
  const fc = ctxOf(f)
  fc.drawImage(B.base, 0, 0)
  fc.drawImage(B.obj, 0, 0)
  if (B.R.tooth > 0.01) {
    fc.globalCompositeOperation = "multiply"
    fc.imageSmoothingEnabled = true
    fc.drawImage(B.shade, 0, 0, B.w, B.h, 0, 0, B.W, B.H)
    fc.globalCompositeOperation = "source-over"
  }
  B.final = f
  liveSetup(B)
  // free what is no longer needed
  B.layer.width = 1
  B.obj.width = 1
  B.base.width = 1
  B.done = true
}

const CACHE = new Map<string, Bake>()
function keyOf(w: number, h: number, k: number, R: Resolved) {
  return [w, h, k.toFixed(2), R.seed, R.palette, R.density, R.tooth, R.clouds, R.lamps].join("|")
}
function getBake(w: number, h: number, k: number, R: Resolved) {
  const key = keyOf(w, h, k, R)
  let b = CACHE.get(key)
  if (!b) {
    b = makeBake(w, h, k, R, key)
    CACHE.set(key, b)
    if (CACHE.size > 3) CACHE.delete(CACHE.keys().next().value as string)
  } else {
    CACHE.delete(key)
    CACHE.set(key, b)
  }
  return b
}
function finish(B: Bake) {
  while (!B.done) B.it.next()
}
/** Run bake steps until the time budget is spent. Returns true when the drawing is complete. */
function advance(B: Bake, budgetMs: number) {
  const t0 = performance.now()
  while (!B.done && performance.now() - t0 < budgetMs) B.it.next()
  return B.done
}

function composite(ctx: Ctx, B: Bake, w: number, h: number, t: number | null) {
  ctx.save()
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"
  ctx.imageSmoothingEnabled = true
  if (B.done && B.final) {
    ctx.drawImage(B.final, 0, 0, w, h)
    if (t != null) {
      paintLive(B, t)
      ctx.drawImage(B.live, 0, 0, w, h)
    }
  } else {
    // block-in while detail arrives: what is drawn so far
    ctx.drawImage(B.base, 0, 0, w, h)
    ctx.drawImage(B.obj, 0, 0, w, h)
  }
  ctx.restore()
}

function scaleOf(ctx: Ctx) {
  const m = ctx.getTransform()
  return clamp(Math.round(Math.hypot(m.a, m.b) * 100) / 100, 0.25, 3)
}

/**
 * Paint one frame at exactly `t` seconds (0 to 20, then it repeats) into a w × h area of the context, in the context's
 * own units. The context's transform is respected: a 2× scaled context gets a 2× drawing.
 */
export function draw(ctx: Ctx, w: number, h: number, t: number, values: Values = {}) {
  const tt = ((t % LOOP) + LOOP) % LOOP
  const B = getBake(Math.round(w), Math.round(h), scaleOf(ctx), resolve(values))
  finish(B)
  composite(ctx, B, w, h, tt)
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

export function PastelHarbor(props: PastelHarborProps) {
  const {
    speed = 1, paused = false, values, seed, size, time, canvasRef,
    palette, density, tooth, clouds, lamps,
    label = "A harbour at first light drawn in oil pastel, crayon, coloured pencil and chalk: cranes on the quay, a ferry with its lamps still on, moored fishing boats and long reflections on the water",
    className,
  } = props
  const R = React.useMemo(() => resolve(values, { palette, density, tooth, clouds, lamps, seed }), [values, palette, density, tooth, clouds, lamps, seed])
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const cv = React.useRef<HTMLCanvasElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const live = React.useRef({ R, speed: Math.max(0.05, speed), paused, reduced, time })
  const api = React.useRef<{ kick: () => void }>({ kick: () => {} })
  live.current = { R, speed: Math.max(0.05, speed), paused, reduced, time }

  React.useEffect(() => {
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
    let clock = 0
    let visible = true
    let rt = 0
    let lastPaint = 0

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
        h = Math.max(120, Math.round(r.height * dpr * k))
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const still = () => live.current.time != null || live.current.reduced || live.current.paused
    const frameT = () => {
      const lv = live.current
      if (lv.time != null) return ((lv.time % LOOP) + LOOP) % LOOP
      if (lv.reduced) return STILL_T
      return clock % LOOP
    }

    /** One frame: advance the bake a little if it is not finished, then paint whatever exists. */
    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      fit()
      const w = canvas.width
      const h = canvas.height
      const B = getBake(w, h, 1, live.current.R)
      if (!B.done) {
        advance(B, 28)
        c.setTransform(1, 0, 0, 1, 0, 0)
        composite(c, B, w, h, B.done ? frameT() : null)
        raf = requestAnimationFrame(frame)
        last = now
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000) * live.current.speed
      last = now
      if (!still()) clock += dt
      // ~24 fps is plenty for motion this slow
      if (still() || now - lastPaint > 40) {
        lastPaint = now
        c.setTransform(1, 0, 0, 1, 0, 0)
        composite(c, B, w, h, frameT())
      }
      if (!still()) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    api.current = { kick }

    const io = new IntersectionObserver((es) => {
      visible = es[es.length - 1].isIntersecting
      if (visible) kick()
    }, { threshold: 0.01 })
    io.observe(box)
    const onVis = () => { if (!document.hidden) kick() }
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
    <div className={["ph", className].filter(Boolean).join(" ")}>
      <style href="pastel-harbor" precedence="default">{CSS}</style>
      <div ref={stage} className="ph-stage" role="img" aria-label={label} style={size ? { aspectRatio: `${size.w} / ${size.h}` } : undefined}>
        <canvas ref={setRefs} className="ph-cv" aria-hidden="true" />
      </div>
    </div>
  )
}

export default PastelHarbor
