"use client"

import * as React from "react"
import { rng, type StudioPieceProps, type Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ObservatoryPalette = "midnight" | "bluehour" | "smallhours"

export type ChalkObservatoryProps = StudioPieceProps & {
  /** Colour set: midnight (indigo and teal), bluehour (just after dusk, warm horizon), smallhours (violet and mint). */
  palette?: ObservatoryPalette
  /** How many marks lay down each surface. 1 is the designed amount. */
  density?: number
  /** How much the paper's tooth breaks the chalk, 0 to 1. */
  tooth?: number
  /** How crowded the sky is. 1 is the designed amount. */
  stars?: number
  /** Comet tail length, 0 hides the comet. */
  comet?: number
  /** How many lights the valley town has. */
  lights?: number
  /** Accessible description of the drawing. */
  label?: string
  className?: string
}

type RGB = [number, number, number]

type Pal = {
  paper: RGB; fibre: RGB
  sky: RGB[]; skyAlt: RGB[]; skyHi: RGB[]; glow: RGB[]; band: RGB[]; dust: RGB; star: RGB[]; comet: RGB[]
  far: RGB[]; far2: RGB[]; valley: RGB[]; lights: RGB[]
  cloudTop: RGB[]; cloudMid: RGB[]; cloudUnder: RGB[]
  near: RGB[]; rimCool: RGB; rimWarm: RGB; dome: RGB[]; warm: RGB[]
  /** Land in cool pastels: deep, indigo, slate, violet, teal, light teal, starlit rim. */
  land: RGB[]
  starMul: number
}

const hx = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const set = (...s: string[]) => s.map(hx)

const PALETTES: Record<ObservatoryPalette, Pal> = {
  midnight: {
    paper: hx("#1d2150"), fibre: hx("#4c5498"),
    sky: set("#11143a", "#1a2058", "#243373", "#2d4d8a", "#3a6fa0"),
    skyAlt: set("#33216e", "#4a3290", "#22708f", "#3a92ab"),
    skyHi: set("#3c4fa0", "#4a6cb0", "#6a5cb8"),
    glow: set("#c0607e", "#e88a7c", "#f5b28a", "#fbdcae"),
    band: set("#6a68b0", "#9a95d0", "#d0c8ea", "#f6ecdc"),
    dust: hx("#15173f"),
    star: set("#fbf7ec", "#d4e3ff", "#ffd9b4", "#bfe8e4"),
    comet: set("#fbf3e2", "#f4c9a6", "#a8d6ea"),
    far: set("#272c6c", "#31397e", "#3c468e", "#7179bc"),
    far2: set("#1a1e4e", "#21275c", "#29316c", "#434d90"),
    valley: set("#0b0d27", "#11153a", "#19224e", "#24385f"),
    lights: set("#ffae5a", "#ffcd85", "#fff1c8", "#ff8a6a"),
    cloudTop: set("#3d3f84", "#4b4c96"), cloudMid: set("#7569a8", "#94739f"), cloudUnder: set("#d97f8a", "#efa287", "#f8d0a6"),
    near: set("#07081a", "#0d0f2a", "#15193c", "#222953"),
    rimCool: hx("#79b4cc"), rimWarm: hx("#e08b74"),
    dome: set("#2e336c", "#565da0", "#949bd0", "#d4d7f0", "#f6f4fb"),
    warm: set("#a8502f", "#e8893f", "#ffc274", "#fff0c8"),
    land: set("#121634", "#1e2554", "#4a5a96", "#5a46aa", "#2f7e9c", "#5ba8bc", "#bccaf2"),
    starMul: 1,
  },
  bluehour: {
    paper: hx("#252c63"), fibre: hx("#5862a8"),
    sky: set("#1b2260", "#243078", "#2d448e", "#36609f", "#4580ab"),
    skyAlt: set("#382680", "#4e389a", "#2a7f9e", "#4a9cb2"),
    skyHi: set("#4d63ad", "#5b80b8", "#6f72b8"),
    glow: set("#d06d78", "#ef977f", "#f8bf91", "#fde2b4"),
    band: set("#7270b4", "#a09bd2", "#d6cdea", "#f6ecdc"),
    dust: hx("#1c214e"),
    star: set("#fbf7ec", "#d4e3ff", "#ffd9b4", "#bfe8e4"),
    comet: set("#fbf3e2", "#f4c9a6", "#a8d6ea"),
    far: set("#2f3678", "#3a428a", "#46509a", "#7a82c0"),
    far2: set("#222866", "#2a3274", "#333c84", "#4a56a0"),
    valley: set("#11163a", "#18204c", "#22305e", "#2e4a72"),
    lights: set("#ffae5a", "#ffcd85", "#fff1c8", "#ff8a6a"),
    cloudTop: set("#454a8e", "#565ca2"), cloudMid: set("#8474ae", "#a882a8"), cloudUnder: set("#e8908a", "#f6b48c", "#fcdcad"),
    near: set("#0a0c22", "#111530", "#1a2042", "#262e58"),
    rimCool: hx("#86c2d4"), rimWarm: hx("#eb9478"),
    dome: set("#363c7a", "#6870ae", "#a9aedb", "#e0e2f4", "#f8f6fc"),
    warm: set("#a8502f", "#e8893f", "#ffc274", "#fff0c8"),
    land: set("#171d44", "#252e62", "#52649e", "#6050b0", "#358aa8", "#64b2c4", "#c4d0f2"),
    starMul: 0.62,
  },
  smallhours: {
    paper: hx("#1b1842"), fibre: hx("#4b448e"),
    sky: set("#110e33", "#1a154e", "#271f66", "#372c7c", "#4a3c8e"),
    skyAlt: set("#42207a", "#5a2c90", "#245c86", "#2f7c92"),
    skyHi: set("#4a3f96", "#5a52a8", "#3f5aa0"),
    glow: set("#a04f8e", "#d4709c", "#f0a0a8", "#fad4c4"),
    band: set("#6a5eae", "#998cd0", "#cbc0ec", "#f0eaf6"),
    dust: hx("#100d2e"),
    star: set("#fbf7f2", "#d9d4ff", "#ffd0dc", "#b8f0dc"),
    comet: set("#f6f1ff", "#e8b8d8", "#9ce8d8"),
    far: set("#271f62", "#302873", "#3a3184", "#6a5fb0"),
    far2: set("#1a1550", "#211b5e", "#29226c", "#3b3288"),
    valley: set("#0b0826", "#120e38", "#1a174c", "#22285e"),
    lights: set("#ffb56a", "#ffd59a", "#fff3d6", "#9fe8d0"),
    cloudTop: set("#3a2f7c", "#4a3d90"), cloudMid: set("#7a5aa8", "#9a66a6"), cloudUnder: set("#cc78a6", "#eba0b4", "#f8cec6"),
    near: set("#070519", "#0d0a26", "#161236", "#221c4c"),
    rimCool: hx("#86d6c4"), rimWarm: hx("#d77a9e"),
    dome: set("#2f2a6c", "#5c55a2", "#9d95d2", "#dcd6f2", "#f8f4fb"),
    warm: set("#a0503a", "#e88e4a", "#ffc87e", "#fff1cc"),
    land: set("#120e34", "#1e1950", "#4a4690", "#6a40a8", "#2a7088", "#55a6a8", "#cabff0"),
    starMul: 1.15,
  },
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.co {
  --co-ink: #000;
  --co-shadow: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .08), 0 22px 44px -16px rgb(16 18 50 / .38);
  --co-radius: 20px;
  --co-accent: #0060e2;
  position: relative; container-type: inline-size; width: 100%; max-width: 1000px; text-align: left;
}
:is(.dark, [data-theme="dark"]) .co {
  --co-accent: #4d8dff;
  --co-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 22px 44px -16px rgb(0 0 0 / .6);
}
html[data-style="mono"] .co { --co-radius: 4px; --co-accent: #111; --co-shadow: 0 0 0 1px rgb(0 0 0 / .16) }
html[data-style="mono"].dark .co { --co-accent: #f2f2f2; --co-shadow: 0 0 0 1px rgb(255 255 255 / .18) }
html[data-style="mono"] .co-cv { filter: grayscale(.82) contrast(1.1) }
html[data-style="glass"] .co { --co-radius: 26px; --co-shadow: var(--pane-shadow); --co-accent: var(--pane-accent) }
html[data-style="glass"] .co-stage { box-shadow: var(--pane-card) }
.co *, .co *::before, .co *::after { box-sizing: border-box }
.co-stage { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--co-radius); overflow: hidden; background: #1e2250; box-shadow: var(--co-shadow); isolation: isolate }
.co-stage:focus-visible { outline: 2px solid var(--co-accent); outline-offset: 3px }
@container (max-width: 520px) { .co-stage { aspect-ratio: 4 / 5 } }
.co-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
`

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

type Ctx = CanvasRenderingContext2D
type Cvs = HTMLCanvasElement | OffscreenCanvas

const LOOP = 40 // seconds in one seamless loop
const STILL_T = 34 // the frame for reduced motion: every late light already on
const TAU = Math.PI * 2

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function mk(w: number, h: number, read = false): Cvs {
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    if (read) c.getContext("2d", { willReadFrequently: true })
    return c
  }
  const o = new OffscreenCanvas(w, h)
  if (read) o.getContext("2d", { willReadFrequently: true })
  return o
}
const ctx2 = (c: Cvs) => c.getContext("2d") as Ctx

function hash(x: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(s | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function hash2(x: number, y: number, s: number) {
  return hash((Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663)) | 0, s)
}
function n1(x: number, s: number) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, s) * (1 - u) + hash(i + 1, s) * u
}
function n2(x: number, y: number, s: number) {
  const i = Math.floor(x)
  const j = Math.floor(y)
  const fx = x - i
  const fy = y - j
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = hash2(i, j, s)
  const b = hash2(i + 1, j, s)
  const c = hash2(i, j + 1, s)
  const d = hash2(i + 1, j + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const fbm1 = (x: number, s: number) => n1(x, s) * 0.55 + n1(x * 2.1 + 7, s + 1) * 0.28 + n1(x * 4.3 + 3, s + 2) * 0.17
const fbm2 = (x: number, y: number, s: number) => n2(x, y, s) * 0.55 + n2(x * 2.1 + 7, y * 2.1 + 3, s + 1) * 0.28 + n2(x * 4.4 + 1, y * 4.4 + 9, s + 2) * 0.17

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
/** Pick a tone from a family by v in 0..1: steps, never a blend. */
const pick = (fam: RGB[], v: number): RGB => fam[clamp(Math.floor(v * fam.length), 0, fam.length - 1)]
function gauss(r: () => number) {
  return (r() + r() + r() + r() - 2) * 0.866
}

/* -------------------------------------------------------------------------- */
/*                        The tools: sprite marks                             */
/* -------------------------------------------------------------------------- */

/**
 * Every mark is a stamped sprite: a white alpha shape with its tool's own texture, tinted once per colour.
 * chalk: a dusty stick stroke with lengthwise striations and soft, specky edges.
 * pencil: a thin line, thin-thick-thin, skipping on grain.
 * charcoal: broad, blotchy, with chunky broken edges.
 * dot: a pricked point for stars and lamps. smear: a finger drag, soft and streaky.
 */
type Kind = "chalk" | "pencil" | "charcoal" | "dot" | "smear"
const SPR: Record<Kind, [number, number]> = { chalk: [192, 48], pencil: [256, 12], charcoal: [192, 56], dot: [28, 28], smear: [128, 48] }
const KSEED: Record<Kind, number> = { chalk: 11, pencil: 23, charcoal: 37, dot: 41, smear: 53 }
const NV = 5

const BASE = new Map<string, Cvs>()
const TINT = new Map<string, Cvs>()

function makeSprite(kind: Kind, v: number): Cvs {
  const [W, H] = SPR[kind]
  const c = mk(W, H)
  const g = ctx2(c)
  const img = g.createImageData(W, H)
  const d = img.data
  const sd = KSEED[kind] * 97 + v * 13
  const r = rng(sd)
  const bend = (r() - 0.5) * (kind === "pencil" ? 0.6 : 0.45)
  const skew = 0.85 + r() * 0.3
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const s = (i + 0.5) / W
      const q = ((j + 0.5) / H) * 2 - 1
      let a = 0
      if (kind === "dot") {
        const dx = s * 2 - 1
        const dy = q
        const ang = Math.atan2(dy, dx)
        const rr = Math.hypot(dx * skew, dy / skew)
        const rad = 0.62 + 0.2 * (n1((ang + Math.PI) * 1.6, sd) - 0.5) * 2
        a = 1 - sstep(rad * 0.55, rad, rr)
        if (hash2(i, j, sd) < 0.1) a *= 0.4
      } else {
        const qc = bend * ((s - 0.5) * (s - 0.5) * 4 - 0.5)
        const dq = Math.abs(q - qc)
        const side = q > qc ? 0 : 50
        if (kind === "chalk") {
          const press = Math.min(1, s / 0.12) ** 0.7 * Math.min(1, (1 - s) / 0.5) ** 0.9
          const hw = 0.95 * (0.42 + 0.58 * press) * (0.8 + 0.32 * n1(s * 14 + side, sd))
          const inside = 1 - sstep(hw * 0.74, hw, dq)
          const st = 0.3 + 0.7 * n1((q - qc) * 9 + s * 1.3, sd + 3)
          a = inside * st * (0.35 + 0.65 * press)
          const hh = hash2(i, j, sd + 5)
          if (hh < 0.12) a *= 0.25
          if (inside < 0.05 && dq < hw * 1.6 && hh > 0.965) a = 0.4 * hash2(j, i, sd)
        } else if (kind === "pencil") {
          const press = Math.sin(Math.PI * s) ** 0.6
          const hw = 0.9 * (0.3 + 0.7 * press)
          const inside = 1 - sstep(hw * 0.45, hw, dq)
          const st = 0.7 + 0.3 * n1(s * 34, sd + 4)
          a = inside * st * (0.45 + 0.55 * press)
          if (hash2(i, j, sd + 6) < 0.22) a *= 0.3
        } else if (kind === "charcoal") {
          const press = Math.min(1, s / 0.1) ** 0.6 * Math.min(1, (1 - s) / 0.35) ** 0.8
          const hw = 0.92 * (0.45 + 0.55 * press) * (0.7 + 0.45 * n1(s * 22 + side, sd))
          const inside = 1 - sstep(hw * 0.65, hw, dq)
          const blot = 0.4 + 0.6 * n2(i * 0.3, j * 0.3, sd + 2)
          a = inside * blot * (0.4 + 0.6 * press) * (q > qc ? 1 : 0.82)
          if (hash2(i, j, sd + 8) < 0.16) a *= 0.2
        } else {
          // smear: soft ellipse with lengthwise streaks
          const e = Math.hypot((s - 0.5) * 2, q - qc)
          const st = 0.6 + 0.4 * n1((q - qc) * 6 + s * 0.6, sd + 9)
          a = (1 - sstep(0.25, 1, e)) * st
        }
      }
      const o = (j * W + i) * 4
      d[o] = 255
      d[o + 1] = 255
      d[o + 2] = 255
      d[o + 3] = clamp(a, 0, 1) * 255
    }
  }
  g.putImageData(img, 0, 0)
  return c
}

function base(kind: Kind, v: number) {
  const key = kind + v
  let c = BASE.get(key)
  if (!c) {
    c = makeSprite(kind, v)
    BASE.set(key, c)
  }
  return c
}

function tint(kind: Kind, v: number, col: RGB) {
  const r = Math.round(col[0] / 3) * 3
  const gg = Math.round(col[1] / 3) * 3
  const b = Math.round(col[2] / 3) * 3
  const key = `${kind}${v}|${r},${gg},${b}`
  let c = TINT.get(key)
  if (!c) {
    const src = base(kind, v)
    c = mk(src.width, src.height)
    const g = ctx2(c)
    g.drawImage(src, 0, 0)
    g.globalCompositeOperation = "source-in"
    g.fillStyle = `rgb(${clamp(r, 0, 255)},${clamp(gg, 0, 255)},${clamp(b, 0, 255)})`
    g.fillRect(0, 0, src.width, src.height)
    if (TINT.size > 4000) TINT.clear()
    TINT.set(key, c)
  }
  return c
}

/** A slight colour wobble, in three steps so the tinted sprites stay few. */
function jit(col: RGB, r: () => number, amt = 7): RGB {
  const l = Math.floor(r() * 3) - 1
  const hue = r() < 0.3 ? (r() < 0.5 ? 1 : -1) : 0
  return [col[0] + l * amt + hue * 4, col[1] + l * amt, col[2] + l * amt - hue * 4]
}

/* -------------------------------------------------------------------------- */
/*                                 The painter                                */
/* -------------------------------------------------------------------------- */

type Painter = {
  c: Ctx // the scratch layer a pass is drawn into
  k: number // device pixels per logical pixel
  r: () => number
  bb: [number, number, number, number]
  /** Detail: fewer, larger marks when the bake is tiny (thumbnails). */
  q: number
  dens: number
}

function mark(P: Painter, kind: Kind, x: number, y: number, len: number, wid: number, ang: number, col: RGB, alpha: number) {
  if (alpha <= 0.004 || len <= 0 || wid <= 0) return
  const v = (P.r() * NV) | 0
  const spr = tint(kind, v, col)
  const co = Math.cos(ang) * P.k
  const si = Math.sin(ang) * P.k
  P.c.setTransform(co, si, -si, co, x * P.k, y * P.k)
  P.c.globalAlpha = alpha > 1 ? 1 : alpha
  P.c.drawImage(spr, -len / 2, -wid / 2, len, wid)
  const e = len * 0.5 + wid
  const bb = P.bb
  if (x - e < bb[0]) bb[0] = x - e
  if (y - e < bb[1]) bb[1] = y - e
  if (x + e > bb[2]) bb[2] = x + e
  if (y + e > bb[3]) bb[3] = y + e
}

/** Jittered-grid scatter: even coverage with a hand-placed feel. `n` is the number of candidates. */
function scatter(P: Painter, x0: number, y0: number, x1: number, y1: number, n: number, each: (x: number, y: number) => void) {
  const area = Math.max(1, (x1 - x0) * (y1 - y0))
  const m = Math.max(1, Math.round(n * P.q * P.dens))
  const cell = Math.sqrt(area / m)
  for (let y = y0; y < y1; y += cell) {
    for (let x = x0; x < x1; x += cell) {
      each(x + P.r() * cell, y + P.r() * cell)
    }
  }
}

/** Marks along a polyline, each following the local direction: a hand-drawn line built from short strokes. */
function chain(P: Painter, kind: Kind, pts: [number, number][], seg: number, wid: number, col: RGB | ((i: number, f: number) => RGB), alpha: number | ((f: number) => number), wob = 0.06) {
  // resample to even spacing
  const out: [number, number][] = []
  let acc = 0
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      out.push(pts[0])
      continue
    }
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const d = Math.hypot(bx - ax, by - ay)
    let t = seg * 0.55 - acc
    while (t <= d) {
      out.push([ax + ((bx - ax) * t) / d, ay + ((by - ay) * t) / d])
      t += seg * 0.55
    }
    acc = d - (t - seg * 0.55)
  }
  for (let i = 1; i < out.length; i++) {
    const [ax, ay] = out[i - 1]
    const [bx, by] = out[i]
    const f = i / out.length
    const ang = Math.atan2(by - ay, bx - ax) + (P.r() - 0.5) * wob
    const c = typeof col === "function" ? col(i, f) : col
    const a = typeof alpha === "function" ? alpha(f) : alpha
    mark(P, kind, (ax + bx) / 2, (ay + by) / 2, seg * (0.9 + P.r() * 0.35), wid * (0.8 + P.r() * 0.4), ang, jit(c, P.r, 5), a * (0.75 + P.r() * 0.25))
  }
}

/* -------------------------------------------------------------------------- */
/*                                 The paper                                  */
/* -------------------------------------------------------------------------- */

/**
 * Pastel paper tooth, built from tileable pieces so it is cheap at any size: fine irregular bumps (value-noise fbm),
 * a faint net of cell walls (Voronoi), per-pixel grain and slow mottling. h = 255 is a peak that catches pigment,
 * 0 a pit that stays paper-coloured. Two tiles are read at different offsets and blended so nothing repeats visibly.
 */
function toothMap(BW: number, BH: number, cellPx: number, seed: number) {
  const TS = 256
  const r = rng(seed * 7 + 3)
  // Voronoi walls
  const n = Math.max(6, Math.round(TS / (cellPx * 1.6)))
  const cs = TS / n
  const fx = new Float32Array(n * n)
  const fy = new Float32Array(n * n)
  for (let i = 0; i < n * n; i++) {
    fx[i] = ((i % n) + 0.05 + 0.9 * r()) * cs
    fy[i] = (Math.floor(i / n) + 0.05 + 0.9 * r()) * cs
  }
  // tileable fine noise at three scales
  const per = [Math.max(8, Math.round(TS / (cellPx * 0.9))), Math.max(16, Math.round(TS / (cellPx * 0.45))), Math.max(4, Math.round(TS / (cellPx * 2.6)))]
  const tn = (x: number, y: number, p: number, sd: number) => {
    const fxp = (x / TS) * p
    const fyp = (y / TS) * p
    const i = Math.floor(fxp)
    const j = Math.floor(fyp)
    const ax = fxp - i
    const ay = fyp - j
    const u = ax * ax * (3 - 2 * ax)
    const v = ay * ay * (3 - 2 * ay)
    const i1 = (i + 1) % p
    const j1 = (j + 1) % p
    const a = hash2(i, j, sd)
    const b = hash2(i1, j, sd)
    const c = hash2(i, j1, sd)
    const d = hash2(i1, j1, sd)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  const tile = new Float32Array(TS * TS)
  for (let y = 0; y < TS; y++) {
    const cy = Math.floor(y / cs)
    for (let x = 0; x < TS; x++) {
      const cx = Math.floor(x / cs)
      let f1 = 1e9
      let f2 = 1e9
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          let ix = cx + ox
          let iy = cy + oy
          let sx = 0
          let sy = 0
          if (ix < 0) { ix += n; sx = -TS } else if (ix >= n) { ix -= n; sx = TS }
          if (iy < 0) { iy += n; sy = -TS } else if (iy >= n) { iy -= n; sy = TS }
          const k = iy * n + ix
          const dx = fx[k] + sx - x
          const dy = fy[k] + sy - y
          const dd = dx * dx + dy * dy
          if (dd < f1) { f2 = f1; f1 = dd } else if (dd < f2) f2 = dd
        }
      }
      const wall = 1 - sstep(0, cs * 0.35, Math.sqrt(f2) - Math.sqrt(f1))
      const fine = tn(x, y, per[0], seed + 1) * 0.5 + tn(x, y, per[1], seed + 2) * 0.3 + tn(x, y, per[2], seed + 3) * 0.2
      tile[y * TS + x] = fine * 0.9 + wall * 0.1
    }
  }
  const H = new Uint8Array(BW * BH)
  const mc = Math.max(12, cellPx * 14)
  for (let y = 0; y < BH; y++) {
    const ty = y % TS
    const ty2 = (y + 77) % TS
    for (let x = 0; x < BW; x++) {
      const m = n2(x / mc, y / mc, seed + 11)
      const a = tile[ty * TS + (x % TS)]
      const b = tile[((x + 131) % TS) * TS + ty2]
      const t = a * m + b * (1 - m)
      const g = hash2(x, y, seed + 5)
      const v = (t - 0.5) * 1.7 + 0.5 + (g - 0.5) * 0.32 + (n2(x / (mc * 3), y / (mc * 3), seed + 17) - 0.5) * 0.3
      H[y * BW + x] = clamp(v, 0, 1) * 255
    }
  }
  return H
}

/* -------------------------------------------------------------------------- */
/*                           Resolve props and values                         */
/* -------------------------------------------------------------------------- */

type Resolved = { palette: ObservatoryPalette; seed: number; density: number; tooth: number; stars: number; comet: number; lights: number }

function resolve(v: Values | undefined, fb: Partial<Resolved> = {}): Resolved {
  const p = (v?.palette ?? fb.palette) as string | undefined
  return {
    palette: p === "bluehour" || p === "smallhours" || p === "midnight" ? p : "midnight",
    seed: Math.round(num(v?.seed ?? fb.seed, 4)),
    density: clamp(num(v?.density ?? fb.density, 1), 0.5, 1.6),
    tooth: clamp(num(v?.tooth ?? fb.tooth, 0.6), 0, 1),
    stars: clamp(num(v?.stars ?? fb.stars, 1), 0.3, 1.8),
    comet: clamp(num(v?.comet ?? fb.comet, 1), 0, 1.5),
    lights: clamp(num(v?.lights ?? fb.lights, 1), 0, 1.6),
  }
}

/* -------------------------------------------------------------------------- */
/*                                The layout                                  */
/* -------------------------------------------------------------------------- */

type Layout = {
  w: number; h: number; U: number; t: number
  farA: (x: number) => number
  farB: (x: number) => number
  nearL: (x: number) => number
  nearR: (x: number) => number
  fgR: (x: number) => number
  cx: number; by: number; Rd: number; plat: number
  head: [number, number]; tailDir: [number, number]; tailLen: number
  band: { x0: number; y0: number; x1: number; y1: number; hw: number }
  vx: number; vy: number // lowest point of the valley window
}

function layout(w: number, h: number, R: Resolved): Layout {
  const a = w / h
  const t = clamp((a - 0.5625) / (1.7778 - 0.5625), 0, 1)
  const lerp = (p: number, q: number) => p + (q - p) * t
  const U = Math.min(w, h) / 1080
  const s = R.seed
  const j1 = (hash(1, s) - 0.5) * 0.06
  const j2 = (hash(2, s) - 0.5) * 0.08
  const hz = lerp(0.715, 0.66)
  const peakY = lerp(0.655, 0.57)
  const domeX = lerp(0.63, 0.7) + (hash(3, s) - 0.5) * 0.03
  const Rd = Math.min(0.1 * h, 0.11 * w)
  const plat = (Rd * 2.15) / w

  const peak = (X: number, c: number, wd: number) => {
    const d = Math.abs(X - c) / wd
    return d >= 1 ? 0 : (1 - d) ** 1.5
  }
  const farA = (x: number) => {
    const X = x / w
    return h * (hz - 0.06 * peak(X, 0.14 + j1, 0.14) - 0.035 * peak(X, 0.47 + j2, 0.17) - 0.05 * peak(X, 0.9, 0.15) - 0.012 + 0.02 * (fbm1(X * 9, s + 20) - 0.5) + 0.006 * (n1(X * 60, s + 21) - 0.5))
  }
  const farB = (x: number) => {
    const X = x / w
    return h * (hz + 0.024 - 0.032 * peak(X, 0.3 - j1, 0.22) - 0.022 * peak(X, 0.78, 0.16) + 0.014 * (fbm1(X * 13 + 5, s + 30) - 0.5) + 0.004 * (n1(X * 80, s + 31) - 0.5))
  }
  const yL0 = lerp(0.79, 0.715)
  const XL = lerp(0.36, 0.4)
  const nearL = (x: number) => {
    const X = x / w
    const u = X / XL
    return h * (yL0 + (1.06 - yL0) * Math.pow(Math.max(0, u), 1.65) + 0.016 * (fbm1(X * 18 + 11, s + 40) - 0.5) + 0.004 * (n1(X * 140, s + 41) - 0.5))
  }
  // the flanks keep a believable slope at any aspect: in tall frames they simply run off the edge
  const spanL = Math.max(domeX - plat - lerp(0.22, 0.27), ((1.08 - peakY) * h * 0.8) / w)
  const dropR = Math.min(lerp(0.19, 0.15), ((1 - domeX - plat) * w * 0.75) / h)
  const nearR = (x: number) => {
    const X = x / w
    const dx = X - domeX
    let y: number
    if (Math.abs(dx) <= plat) y = peakY + 0.002 * (n1(X * 300, s + 50) - 0.5)
    else if (dx < 0) {
      const u = (-dx - plat) / spanL
      const shoulder = 0.03 * Math.exp(-(((u - 0.38) / 0.1) ** 2)) + 0.015 * Math.exp(-(((u - 0.12) / 0.05) ** 2))
      const uu = Math.min(u, 1)
      y = peakY + (1.08 - peakY) * (0.55 * Math.pow(uu, 1.25) + 0.45 * uu * uu + Math.max(0, u - 1) * 1.5) - shoulder * Math.min(1, u * 6) + 0.022 * Math.min(1, u * 5) * (fbm1(X * 22, s + 51) - 0.5) + 0.006 * (n1(X * 160, s + 52) - 0.5)
    } else {
      const u = (dx - plat) / Math.max(0.05, 1 - domeX - plat)
      y = peakY + dropR * Math.pow(Math.min(1, u), 1.2) + 0.018 * Math.min(1, u * 5) * (fbm1(X * 20 + 4, s + 53) - 0.5) + 0.005 * (n1(X * 150, s + 54) - 0.5)
    }
    return h * y
  }

  const fgR = (x: number) => {
    const X = x / w
    return h * (lerp(0.96, 0.95) + 0.012 * Math.sin(X * 6.2 + s) + 0.03 * (fbm1(X * 7 + 2, s + 60) - 0.5) + 0.006 * (n1(X * 120, s + 61) - 0.5) - 0.085 * sstep(0.62, 1.05, X) - 0.06 * (1 - sstep(-0.05, 0.22, X)))
  }

  // lowest point of the window between the two near masses
  let vx = w * 0.4
  let vy = 0
  for (let x = 0; x < w; x += w / 200) {
    const y = Math.min(nearL(x), nearR(x))
    if (y > vy) { vy = y; vx = x }
  }

  const head: [number, number] = [w * lerp(0.3, 0.265), h * lerp(0.21, 0.225)]
  const td = Math.hypot(1, 0.3)
  const tailDir: [number, number] = [-1 / td, -0.3 / td]
  const tailLen = Math.min(0.34 * w, 0.46 * h) * R.comet

  const band = { x0: w * lerp(0.99, 0.96), y0: h * (hz + 0.02), x1: w * lerp(0.62, 0.6), y1: -0.1 * h, hw: 0.16 * Math.min(h, w * 0.8) }

  return { w, h, U, t, farA, farB, nearL, nearR, fgR, cx: domeX * w, by: peakY * h, Rd, plat: plat * w, head, tailDir, tailLen, band, vx, vy }
}

/* -------------------------------------------------------------------------- */
/*                          The drawing, baked once                           */
/* -------------------------------------------------------------------------- */

type Arrival = { x: number; y: number; s: number; t0: number; spr: Cvs }

type Bake = {
  w: number; h: number; k: number; BW: number; BH: number; pad: number
  back: Cvs; clouds: Cvs; front: Cvs; shade: Cvs
  arrivals: Arrival[]
  done: boolean
  step: () => void
}

/** Tool behaviour on the paper tooth: how deep into the pits the medium reaches at full pressure. */
const TOOTH: Record<string, number> = { chalk: 0.66, charcoal: 0.6, pastel: 0.48, white: 0.3 }

function makeBake(w: number, h: number, k: number, R: Resolved): Bake {
  const BW = Math.max(1, Math.round(w * k))
  const BH = Math.max(1, Math.round(h * k))
  const kk = BW / w
  const P0 = PALETTES[R.palette]
  const L = layout(w, h, R)
  const U = L.U
  const pad = Math.round(20 * U * kk)
  const back = mk(BW, BH)
  const clouds = mk(BW + pad * 2, BH)
  const front = mk(BW, BH)
  const shade = mk(BW, BH)
  const scratch = mk(BW + pad * 2, BH, true)
  const sc = ctx2(scratch)
  const q = clamp(Math.max(BW, BH) / 1700, 0.18, 1)
  const B: Bake = { w, h, k: kk, BW, BH, pad, back, clouds, front, shade, arrivals: [], done: false, step: () => {} }
  const gen = bakeSteps(B, L, P0, R, sc, scratch, q)
  B.step = () => {
    if (B.done) return
    const n = gen.next()
    if (n.done) {
      B.done = true
      scratch.width = 0
      scratch.height = 0
    }
  }
  return B
}

function* bakeSteps(B: Bake, L: Layout, P0: Pal, R: Resolved, sc: Ctx, scratch: Cvs, q: number): Generator<void, void, void> {
  const { w, h, U } = L
  const { BW, BH, pad } = B
  const k = B.k
  const s = R.seed
  const sz = 1 / Math.sqrt(q) // marks grow when there are fewer of them
  const dsz = Math.pow(R.density, -0.35)
  const SZ = U * sz * dsz
  const toothAmt = 0.35 + 0.95 * R.tooth
  const cellPx = clamp(3.4 * U * k, 1.6, 30)

  /* ---------- paper: indigo, mottled, with light fibres ---------- */
  const H = toothMap(BW, BH, cellPx, s)
  const paper = mk(BW, BH)
  {
    const g = ctx2(paper)
    const img = g.createImageData(BW, BH)
    const d = img.data
    const pc = P0.paper
    const mc = 140 * U * k
    for (let y = 0; y < BH; y++) {
      for (let x = 0; x < BW; x++) {
        const i = y * BW + x
        const m = (fbm2(x / mc, y / mc, s + 61) - 0.5) * 16
        const hh = (H[i] / 255 - 0.5) * 10
        const o = i * 4
        d[o] = pc[0] + m + hh
        d[o + 1] = pc[1] + m + hh
        d[o + 2] = pc[2] + m * 1.2 + hh * 1.1
        d[o + 3] = 255
      }
    }
    g.putImageData(img, 0, 0)
    const FP: Painter = { c: g, k, r: rng(s * 3 + 77), bb: [0, 0, 0, 0], q: 1, dens: 1 }
    const nF = Math.round((w * h) / (2600 * U * U))
    for (let i = 0; i < nF; i++) mark(FP, "pencil", FP.r() * w, FP.r() * h, (5 + FP.r() * 12) * U, (0.7 + FP.r() * 0.5) * U, FP.r() * TAU, P0.fibre, 0.12 + FP.r() * 0.2)
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.globalAlpha = 1
    ctx2(B.back).drawImage(paper, 0, 0)
    // the multiply pass that sinks everything into the paper's pits, used last at paint time
    const sg = ctx2(B.shade)
    const si = sg.createImageData(BW, BH)
    const sd = si.data
    for (let i = 0; i < BW * BH; i++) {
      const v = 255 * (1 - 0.32 * toothAmt * (1 - H[i] / 255) ** 1.6)
      const o = i * 4
      sd[o] = v
      sd[o + 1] = v
      sd[o + 2] = v
      sd[o + 3] = 255
    }
    sg.putImageData(si, 0, 0)
  }
  yield

  const P: Painter = { c: sc, k, r: rng(s * 31 + 1), bb: [1e9, 1e9, -1e9, -1e9], q, dens: R.density }
  const fork = (n: number) => { P.r = rng(s * 1009 + n * 7919) }

  /** Put the pass through the paper's tooth, then lay it onto a target layer (optionally dragged by a finger). */
  const commit = (target: Cvs, tool: keyof typeof TOOTH, smear?: { dx: number; dy: number; n: number; a: number }, padded = false) => {
    const bb = P.bb
    const SW = padded ? BW + pad * 2 : BW
    const shift = padded ? pad : 0
    const x0 = clamp(Math.floor(bb[0] * k) - 2, 0, SW)
    const y0 = clamp(Math.floor(bb[1] * k) - 2, 0, BH)
    const x1 = clamp(Math.ceil(bb[2] * k) + 2, 0, SW)
    const y1 = clamp(Math.ceil(bb[3] * k) + 2, 0, BH)
    P.bb = [1e9, 1e9, -1e9, -1e9]
    sc.setTransform(1, 0, 0, 1, 0, 0)
    sc.globalAlpha = 1
    if (x1 <= x0 || y1 <= y0) return
    const bw = x1 - x0
    const bh = y1 - y0
    const img = sc.getImageData(x0, y0, bw, bh)
    const d = img.data
    const T = TOOTH[tool] * toothAmt
    for (let y = 0; y < bh; y++) {
      let o = y * bw * 4 + 3
      const row = (y + y0) * BW
      for (let x = 0; x < bw; x++, o += 4) {
        const a = d[o]
        if (a === 0) continue
        const px = x + x0 - shift
        const dep = T * (1 - H[row + (px < 0 ? 0 : px >= BW ? BW - 1 : px)] / 255)
        const na = (a / 255 - dep) / (1 - dep * 0.55)
        d[o] = na <= 0 ? 0 : na >= 1 ? 255 : na * 255
      }
    }
    sc.putImageData(img, x0, y0)
    const tg = ctx2(target)
    tg.setTransform(1, 0, 0, 1, 0, 0)
    if (smear) {
      for (let i = smear.n; i >= 1; i--) {
        tg.globalAlpha = smear.a * (1 - (i - 1) / smear.n)
        tg.drawImage(scratch, x0, y0, bw, bh, x0 + smear.dx * i * k, y0 + smear.dy * i * k, bw, bh)
      }
    }
    tg.globalAlpha = 1
    tg.drawImage(scratch, x0, y0, bw, bh, x0, y0, bw, bh)
    sc.clearRect(x0, y0, bw, bh)
  }

  /* ---------- sky ---------- */
  const skyLimit = (x: number) => Math.max(L.farA(x), L.farB(x) - 8 * U)
  const glowX = L.vx - 0.02 * w
  const glowAt = (x: number, y: number) => {
    const dy = Math.max(0, (skyLimit(x) - y) / (0.26 * h))
    const dx = (x - glowX) / (0.55 * w)
    return Math.max(Math.exp(-dx * dx) * Math.exp(-dy * 2.2), 0.55 * Math.exp(-dy * 4.5))
  }
  const skyTone = (x: number, y: number, r: () => number, lift = 0) => {
    const lim = skyLimit(x)
    const v = clamp(clamp(y / lim, 0, 1) * 0.92 + (fbm2(x / (380 * U), y / (380 * U), s + 70) - 0.5) * 0.45 + (r() - 0.5) * 0.34 + lift, 0, 0.999)
    const zone = fbm2(x / (520 * U), y / (520 * U), s + 72)
    if (r() < 0.8 * sstep(0.36, 0.6, zone)) return P0.skyAlt[zone > 0.55 === v < 0.55 ? (r() < 0.55 ? 0 : 1) : r() < 0.55 ? 2 : 3]
    return pick(P0.sky, v)
  }
  const flow = (x: number, y: number) => {
    const lim = skyLimit(x)
    const flat = sstep(0.55, 1, y / lim)
    return (-0.38 + (n2(x / (520 * U), y / (520 * U), s + 71) - 0.5) * 1.2) * (1 - flat * 0.8)
  }
  const inSky = (x: number, y: number, m: number) => y < skyLimit(x) + m
  // 1. dark underlayer: low pressure, deep tones, broad strokes
  fork(1)
  scatter(P, -20 * U, -20 * U, w + 20 * U, h * 0.82, 2600, (x, y) => {
    if (!inSky(x, y, 6 * U)) return
    mark(P, "chalk", x, y, (50 + P.r() * 70) * SZ, (11 + P.r() * 10) * SZ, flow(x, y) + (P.r() - 0.5) * 0.3, jit(skyTone(x, y * 0.6, P.r), P.r, 6), 0.4 + P.r() * 0.3)
  })
  commit(B.back, "chalk", { dx: 3 * U, dy: -1 * U, n: 3, a: 0.3 })
  yield
  // 2. the main sky: directional strokes, side by side in distinct tones
  fork(2)
  scatter(P, -20 * U, -20 * U, w + 20 * U, h * 0.82, 13000, (x, y) => {
    if (!inSky(x, y, 4 * U)) return
    mark(P, "chalk", x, y, (22 + P.r() * 38) * SZ, (4.5 + P.r() * 4.5) * SZ, flow(x, y) + (P.r() - 0.5) * 0.32, jit(skyTone(x, y, P.r), P.r, 9), 0.55 + P.r() * 0.4)
  })
  commit(B.back, "chalk")
  yield
  // 3. a cross layer, lighter and sparser, and the warm haze over the valley
  fork(3)
  scatter(P, -20 * U, -20 * U, w + 20 * U, h * 0.82, 9500, (x, y) => {
    if (!inSky(x, y, 4 * U)) return
    const g = glowAt(x, y)
    if (P.r() < g * 1.1) {
      const col = pick(P0.glow, clamp(g * 1.1 + (P.r() - 0.5) * 0.5, 0, 0.999))
      mark(P, "chalk", x, y, (22 + P.r() * 36) * SZ, (4 + P.r() * 5) * SZ, (P.r() - 0.5) * 0.22 - 0.05, jit(col, P.r, 6), 0.35 + 0.6 * g * (0.5 + P.r() * 0.5))
      return
    }
    if (P.r() > 0.42) return
    const col = P.r() < 0.18 ? P0.skyHi[(P.r() * P0.skyHi.length) | 0] : skyTone(x, y, P.r, 0.18)
    mark(P, "chalk", x, y, (18 + P.r() * 30) * SZ, (3.5 + P.r() * 4) * SZ, flow(x, y) + 0.55 + (P.r() - 0.5) * 0.3, jit(col, P.r, 8), 0.4 + P.r() * 0.35)
  })
  commit(B.back, "chalk", { dx: 2 * U, dy: 0, n: 2, a: 0.25 })
  yield

  /* ---------- the milky band ---------- */
  const Bd = L.band
  const bdx = Bd.x1 - Bd.x0
  const bdy = Bd.y1 - Bd.y0
  const blen = Math.hypot(bdx, bdy)
  const bux = bdx / blen
  const buy = bdy / blen
  const bnx = -buy
  const bny = bux
  const bang = Math.atan2(buy, bux)
  const bandCentre = (f: number) => (n1(f * 3.2, s + 80) - 0.5) * Bd.hw * 0.8 - Math.sin(Math.PI * f) * Bd.hw * 0.6
  const bandHW = (f: number) => Bd.hw * (0.75 + 0.55 * n1(f * 3.4 + 4, s + 81)) * (0.65 + 0.35 * sstep(0, 0.25, f))
  const bandAt = (x: number, y: number) => {
    const rx = x - Bd.x0
    const ry = y - Bd.y0
    const f = (rx * bux + ry * buy) / blen
    if (f < -0.05 || f > 1.05) return 0
    const off = rx * bnx + ry * bny - bandCentre(f)
    const hw = bandHW(f)
    const clump = fbm2(x / (110 * U), y / (110 * U), s + 82)
    return Math.exp(-(off * off) / (2 * hw * hw * 0.42)) * (0.55 + 0.75 * clump) * sstep(-0.05, 0.12, f) * (1 - sstep(0.8, 1.05, f) * 0.45)
  }
  if (R.stars > 0) {
    fork(4)
    // a wide, faint halo of lilac dabs first, then many small dabs that get paler toward the core
    scatter(P, -20 * U, -20 * U, w + 20 * U, h * 0.82, 6000, (x, y) => {
      if (!inSky(x, y, -3 * U)) return
      const b = bandAt(x, y)
      if (P.r() > b * 2.2) return
      mark(P, "chalk", x, y, (14 + P.r() * 18) * SZ, (6 + P.r() * 6) * SZ, bang + (P.r() - 0.5) * 1.6, jit(pick(P0.band, 0.1 + b * 0.4), P.r, 7), 0.12 + 0.3 * b)
    })
    commit(B.back, "chalk", { dx: bux * 3 * U, dy: buy * 3 * U, n: 4, a: 0.4 })
    fork(41)
    scatter(P, -20 * U, -20 * U, w + 20 * U, h * 0.82, 30000, (x, y) => {
      if (!inSky(x, y, -3 * U)) return
      const b = bandAt(x, y)
      if (P.r() > b * 1.25) return
      const v = clamp(b * 1.1 + (P.r() - 0.5) * 0.4, 0, 0.999)
      mark(P, "chalk", x, y, (6 + P.r() * 12) * SZ, (2.8 + P.r() * 3.2) * SZ, P.r() * Math.PI, jit(pick(P0.band, v), P.r, 7), 0.35 + 0.65 * b * (0.6 + P.r() * 0.4))
    })
    commit(B.back, "chalk", { dx: bux * 1.5 * U, dy: buy * 1.5 * U, n: 2, a: 0.3 })
    yield
    // dust lanes: thin charcoal, broken, pushed along the band
    fork(5)
    for (let lane = 0; lane < 2; lane++) {
      const nM = Math.round(1100 * q * R.density)
      const fs = lane === 0 ? 0.1 : 0.4
      const fe = lane === 0 ? 0.85 : 0.7
      for (let i = 0; i < nM; i++) {
        const f = fs + (fe - fs) * P.r()
        if (n1(f * 14 + lane * 7, s + 84) < 0.35) continue
        const hw = bandHW(f)
        const lo = bandCentre(f) + (lane === 0 ? 1 : -1) * hw * (0.1 + 0.25 * n1(f * 5 + lane * 9, s + 83)) + gauss(P.r) * hw * 0.1
        const x = Bd.x0 + bux * f * blen + bnx * lo
        const y = Bd.y0 + buy * f * blen + bny * lo
        if (!inSky(x, y, -6 * U)) continue
        mark(P, "charcoal", x, y, (8 + P.r() * 18) * SZ, (2.5 + P.r() * 4) * SZ, bang + (P.r() - 0.5) * 0.6, jit(P0.dust, P.r, 4), 0.3 + P.r() * 0.35)
      }
    }
    commit(B.back, "charcoal", { dx: bux * 2 * U, dy: buy * 2 * U, n: 3, a: 0.3 })
    yield
  }

  /* ---------- stars: a white pencil pricked into the paper ---------- */
  fork(6)
  {
    const sm = R.stars * P0.starMul
    const nStars = Math.round(((w * h) / (1920 * 1080 * U * U)) * 8500 * sm * Math.sqrt(q))
    const starCol = (r: () => number) => {
      const v = r()
      return v < 0.72 ? P0.star[0] : v < 0.86 ? P0.star[1] : v < 0.95 ? P0.star[2] : P0.star[3]
    }
    for (let i = 0; i < nStars; i++) {
      const x = P.r() * w
      const y = P.r() * h * 0.8
      const lim = skyLimit(x)
      if (y > lim - 5 * U) continue
      const b = bandAt(x, y)
      const g = glowAt(x, y)
      if (P.r() > 0.32 + b * 0.9 - g * 0.3) continue
      const m = P.r() ** 3.6
      const sz = (1.3 + 5.4 * m) * U
      const col = starCol(P.r)
      const a = 0.35 + 0.65 * Math.sqrt(m) - clamp((y / lim - 0.75) * 1.6, 0, 0.3)
      mark(P, "dot", x, y, sz * (1 + P.r() * 0.5), sz, P.r() * Math.PI, jit(col, P.r, 6), a)
      if (m > 0.35) mark(P, "dot", x + (P.r() - 0.5) * sz * 0.4, y + (P.r() - 0.5) * sz * 0.4, sz * 0.8, sz * 0.7, P.r() * 3, col, a * 0.8)
      if (m > 0.92) {
        // a few bright ones get hand-drawn rays: unequal arms, slightly off square
        const rl = (8 + 22 * m) * U
        const a0 = Math.PI / 2 + (P.r() - 0.5) * 0.2
        mark(P, "pencil", x, y + (P.r() - 0.5) * 2 * U, rl * (1 + P.r() * 0.3), 1.4 * U, a0, col, 0.55)
        mark(P, "pencil", x + (P.r() - 0.5) * 2 * U, y, rl * (0.55 + P.r() * 0.25), 1.3 * U, a0 + Math.PI / 2 + (P.r() - 0.5) * 0.18, col, 0.5)
      }
    }
    // the band's dust of faint stars
    const nDust = Math.round(((w * h) / (1920 * 1080 * U * U)) * 11000 * sm * Math.sqrt(q))
    for (let i = 0; i < nDust; i++) {
      const f = P.r()
      const lo = bandCentre(f) + gauss(P.r) * bandHW(f) * 0.55
      const x = Bd.x0 + bux * f * blen + bnx * lo
      const y = Bd.y0 + buy * f * blen + bny * lo
      if (x < 0 || x > w || y < 0 || y > skyLimit(x) - 5 * U) continue
      const d = (1 + P.r() * 1.3) * U
      mark(P, "dot", x, y, d, d * 0.85, P.r() * 3, P.r() < 0.75 ? P0.star[0] : P0.band[2], 0.3 + P.r() * 0.45)
    }
  }
  commit(B.back, "white")
  yield

  /* ---------- the comet: streamers of chalk fanning from a hard white head ---------- */
  if (R.comet > 0.02 && L.tailLen > 0) {
    const [hx0, hy0] = L.head
    const [ax, ay] = L.tailDir
    const nx = -ay
    const ny = ax
    const Lt = L.tailLen
    const curv = 0.2
    const wdAt = (f: number) => (3 + 100 * f ** 0.9) * U
    const cpt = (f: number, u: number): [number, number] => {
      const bendOff = curv * f * f * Lt
      const wd = wdAt(f)
      return [hx0 + ax * f * Lt + nx * (bendOff + u * wd), hy0 + ay * f * Lt + ny * (bendOff + u * wd)]
    }
    fork(7)
    // a soft underlayer between the streamers
    const nT = Math.round(1300 * R.comet * q * R.density)
    for (let i = 0; i < nT; i++) {
      const f = P.r() ** 1.4
      const u = clamp(gauss(P.r) * 0.5, -1, 1)
      const [x, y] = cpt(f, u)
      const [x2, y2] = cpt(f + 0.02, u * 1.02)
      const col = P.r() < 0.3 ? P0.band[1] : f < 0.15 || P.r() < 0.5 ? P0.comet[0] : P0.comet[1]
      mark(P, "chalk", x, y, (14 + 40 * f) * SZ, (3 + 6 * f) * SZ, Math.atan2(y2 - y, x2 - x) + (P.r() - 0.5) * 0.1, jit(col, P.r, 6), (0.55 * (1 - f) ** 1.3 + 0.05) * (1 - 0.45 * Math.abs(u)))
    }
    commit(B.back, "chalk", { dx: ax * 2.5 * U, dy: ay * 2.5 * U, n: 4, a: 0.4 })
    yield
    fork(8)
    // streamers
    const nS = 19
    for (let si = 0; si < nS; si++) {
      const u0 = (si / (nS - 1) - 0.5) * 2 * (0.85 + P.r() * 0.2)
      const fl = (0.45 + 0.55 * P.r()) * (1 - Math.abs(u0) * 0.25)
      const bright = (1 - Math.abs(u0) * 0.45) * (0.6 + 0.4 * P.r())
      const pts: [number, number][] = []
      for (let i = 0; i <= 40; i++) {
        const f = 0.015 + (fl - 0.015) * (i / 40)
        const wig = (n1(f * 7 + si * 3.1, s + 90) - 0.5) * 0.12
        pts.push(cpt(f, u0 + wig))
      }
      const col = u0 > 0.35 ? P0.comet[1] : u0 < -0.55 ? P0.band[2] : P0.comet[0]
      chain(P, "chalk", pts, 22 * U, (3.4 + Math.abs(u0) * 1.8) * U, col, (f) => (0.95 * (1 - f) ** 1.2 + 0.06) * bright, 0.04)
    }
    // ion tail: a few straight pale-blue pencil strands on the inside of the curve
    const nI = Math.round(26 * R.comet)
    for (let i = 0; i < nI; i++) {
      const lo = (-2 - P.r() * 16) * U
      const fl = 0.5 + P.r() * 0.6
      const pts: [number, number][] = []
      for (let j = 0; j <= 10; j++) {
        const f = 0.03 + fl * (j / 10)
        pts.push([hx0 + ax * f * Lt * 1.05 + nx * lo * (1 + f * 3), hy0 + ay * f * Lt * 1.05 + ny * lo * (1 + f * 3)])
      }
      chain(P, "pencil", pts, 34 * U, (1.2 + P.r()) * U, P0.comet[2], (f) => 0.5 * (1 - f) + 0.06, 0.02)
    }
    commit(B.back, "chalk")
    // the head: radiating dabs, a solid white core, two pencil rays
    for (let i = 0; i < 380; i++) {
      const rr = Math.abs(gauss(P.r)) * 12 * U
      const an = P.r() * TAU
      const x = hx0 + Math.cos(an) * rr - ax * 4 * U
      const y = hy0 + Math.sin(an) * rr - ay * 4 * U
      mark(P, "chalk", x, y, (4 + P.r() * 7) * U, (2 + P.r() * 2.5) * U, an, jit(P.r() < 0.6 ? P0.comet[0] : P.r() < 0.5 ? P0.comet[1] : P0.star[0], P.r, 5), 0.4 + 0.5 * (1 - rr / (26 * U)))
    }
    for (let i = 0; i < 6; i++) mark(P, "dot", hx0 + (P.r() - 0.5) * 3 * U, hy0 + (P.r() - 0.5) * 3 * U, (7 + P.r() * 5) * U, (6 + P.r() * 4) * U, P.r() * 3, P0.star[0], 1)
    const ra = Math.atan2(ay, ax) + 0.55
    mark(P, "pencil", hx0, hy0, 46 * U, 1.7 * U, ra, P0.star[0], 0.7)
    mark(P, "pencil", hx0, hy0, 30 * U, 1.6 * U, ra + Math.PI / 2 + 0.06, P0.star[0], 0.6)
    commit(B.back, "white")
    yield
  }

  /* ---------- far ranges ---------- */
  const range = (top: (x: number) => number, depth: number, fam: RGB[], n: number, seedN: number) => {
    fork(seedN)
    const yTop = Math.min(...Array.from({ length: 40 }, (_, i) => top((i / 39) * w)))
    scatter(P, -10 * U, yTop - 6 * U, w + 10 * U, yTop + depth + 0.16 * h, n, (x, y) => {
      const t0 = top(x)
      if (y < t0 + 1.5 * U) return
      const dd = (y - t0) / depth
      const slope = Math.atan((top(x + 6 * U) - top(x - 6 * U)) / (12 * U))
      const v = clamp(0.62 - dd * 0.55 + (fbm2(x / (90 * U), y / (70 * U), s + seedN) - 0.5) * 0.8 + (P.r() - 0.5) * 0.3, 0, 0.999)
      const lightLine = P.r() < 0.14
      const zt = fbm2(x / (160 * U), y / (60 * U), s + seedN + 3)
      const col = lightLine ? fam[3] : P.r() < 0.3 ? mixc(fam[1], zt < 0.5 ? P0.land[3] : P0.land[4], 0.55) : pick(fam.slice(0, 3), v)
      const pencil = lightLine || P.r() < 0.4
      const ang = P.r() < 0.65 ? slope * (1 - Math.min(1, dd * 0.6)) + (P.r() - 0.5) * 0.4 : (slope > 0 ? 1.05 : 2.1) + (P.r() - 0.5) * 0.3
      mark(P, pencil ? "pencil" : "chalk", x, y, (pencil ? 14 + P.r() * 20 : 18 + P.r() * 26) * SZ, (pencil ? 1.6 + P.r() * 1.2 : 5 + P.r() * 5) * SZ, ang, jit(col, P.r, 7), lightLine ? 0.3 + P.r() * 0.25 : 0.6 + P.r() * 0.38)
    })
    commit(B.back, "pastel")
    // the skyline caught by the valley's glow on one side and the stars on the other
    const pts: [number, number][] = []
    for (let x = -10 * U; x <= w + 10 * U; x += 4 * U) pts.push([x, top(x) + 1.6 * U])
    chain(P, "chalk", pts, 16 * U, 2.6 * U, (_i, f) => (glowAt(f * w, top(f * w) - 10 * U) > 0.22 && P.r() < 0.75 ? P0.glow[1] : fam[3]), (f) => 0.4 + 0.35 * n1(f * 40, s + seedN))
    commit(B.back, "pastel")
  }
  range(L.farA, 0.05 * h, P0.far, 4200, 90)
  yield
  range(L.farB, 0.05 * h, P0.far2, 4200, 91)
  yield

  /* ---------- the valley floor, its river, its lights ---------- */
  const vTop = (x: number) => L.farB(x)
  const vBot = (x: number) => Math.min(L.nearL(x), L.nearR(x)) + 14 * U
  const inValley = (x: number, y: number, m = 0) => y > vTop(x) + m && y < Math.min(L.nearL(x), L.nearR(x)) - m
  const depthAt = (x: number, y: number) => clamp((y - vTop(x)) / (L.vy - vTop(x) + 1), 0, 1)
  {
    fork(100)
    const y0 = Math.min(...Array.from({ length: 30 }, (_, i) => vTop((i / 29) * w)))
    scatter(P, -10 * U, y0, w + 10 * U, h + 10 * U, 6000, (x, y) => {
      if (y < vTop(x) + 6 * U || y > vBot(x)) return
      const v = clamp(0.3 + (fbm2(x / (70 * U), y / (36 * U), s + 101) - 0.5) * 0.9 + (P.r() - 0.5) * 0.3, 0, 0.999)
      mark(P, "charcoal", x, y, (22 + P.r() * 30) * SZ, (5 + P.r() * 6) * SZ, (P.r() - 0.5) * 0.25, jit(pick(P0.valley, v), P.r, 5), 0.65 + P.r() * 0.35)
    })
    commit(B.back, "charcoal", { dx: 3 * U, dy: 0, n: 3, a: 0.3 })
    // fields as little patches of pencil hatching, flattened by distance
    fork(101)
    const nP = Math.round(520 * q * R.density)
    for (let i = 0; i < nP; i++) {
      const x = P.r() * w
      const y = vTop(x) + P.r() * (L.vy - vTop(x))
      if (!inValley(x, y, 4 * U)) continue
      const dz = depthAt(x, y)
      const pw = (10 + 46 * dz) * U
      const ang = (P.r() - 0.5) * 0.5 + (P.r() < 0.4 ? 0.9 : 0)
      const col = P.r() < 0.4 ? P0.land[2] : P.r() < 0.5 ? P0.land[4] : P.r() < 0.6 ? P0.land[3] : P0.valley[3]
      const nl = 3 + ((P.r() * 5) | 0)
      for (let l = 0; l < nl; l++) {
        const o = (l - nl / 2) * (1.6 + dz * 2.5) * U
        mark(P, "pencil", x - Math.sin(ang) * o, y + Math.cos(ang) * o * 0.5, pw * (0.7 + P.r() * 0.5), 1.8 * U, ang * (0.35 + dz * 0.65), jit(col, P.r, 6), 0.5 + P.r() * 0.35)
      }
    }
    commit(B.back, "pastel")
  }
  yield
  // the river, catching the sky's glow
  const riverPts: [number, number][] = []
  {
    const xs = clamp(L.vx - 0.2 * w, 0.04 * w, w)
    const ys = vTop(xs) + 5 * U
    for (let i = 0; i <= 80; i++) {
      const f = i / 80
      const x = xs + (L.vx - xs) * f + Math.sin(f * 8 + s) * 0.035 * w * Math.sin(Math.PI * f)
      const y = ys + (L.vy + 14 * U - ys) * f ** 1.4
      riverPts.push([x, y])
    }
    fork(102)
    for (let i = 1; i < riverPts.length; i++) {
      const [ax, ay] = riverPts[i - 1]
      const [bx, by] = riverPts[i]
      const f = i / riverPts.length
      const wd = (2 + 14 * f * f) * U
      const nn = 3 + Math.round(f * 8)
      for (let j = 0; j < nn; j++) {
        const t = P.r()
        const x = ax + (bx - ax) * t + (P.r() - 0.5) * wd
        const y = ay + (by - ay) * t + (P.r() - 0.5) * wd * 0.25
        if (!inValley(x, y, 1 * U)) continue
        const col = P.r() < 0.45 ? P0.glow[2] : P.r() < 0.5 ? P0.skyHi[1] : P0.band[1]
        mark(P, "pencil", x, y, (5 + 14 * f) * U, (1.3 + f * 1.3) * U, (P.r() - 0.5) * 0.15, jit(col, P.r, 5), 0.35 + P.r() * 0.4)
      }
    }
    commit(B.back, "pastel")
  }
  // the town sits on the river's middle reach: streets of single lamps, lit banks, reflections on the water
  const town: [number, number] = riverPts[Math.round(riverPts.length * 0.45)]
  {
    fork(103)
    const nH = Math.round(260 * q * R.density * (0.4 + 0.6 * R.lights))
    for (let i = 0; i < nH; i++) {
      const x = town[0] + gauss(P.r) * 0.09 * w
      const y = town[1] - Math.abs(gauss(P.r)) * 0.035 * h + 0.006 * h
      if (y > Math.min(L.nearL(x), L.nearR(x)) || y < vTop(x) - 30 * U) continue
      mark(P, "chalk", x, y, (20 + P.r() * 30) * SZ, (3.5 + P.r() * 4) * SZ, (P.r() - 0.5) * 0.12, jit(pick(P0.glow, 0.3 + P.r() * 0.6), P.r, 5), 0.05 + P.r() * 0.1)
    }
    commit(B.back, "chalk", { dx: 3 * U, dy: -0.5 * U, n: 3, a: 0.35 })
  }
  // streets: a few lines out of the centre, flattened by distance, each with lamps at a walking rhythm
  const streets: [number, number][][] = []
  {
    const r = rng(s * 19 + 3)
    const dzT = depthAt(town[0], town[1])
    const ti = Math.round(riverPts.length * 0.45)
    const ra = Math.atan2(riverPts[ti + 2][1] - riverPts[ti - 2][1], riverPts[ti + 2][0] - riverPts[ti - 2][0])
    const nSt = 11
    for (let i = 0; i < nSt; i++) {
      // streets mostly run along the river, a few cross it
      const a0 = (r() < 0.65 ? ra + (r() < 0.5 ? 0 : Math.PI) : ra + Math.PI / 2 * (r() < 0.5 ? 1 : -1)) + (r() - 0.5) * 0.3
      const len = (0.02 + r() * 0.045) * w * (0.7 + dzT * 0.6)
      const pts: [number, number][] = []
      let x = town[0] + gauss(r) * 0.035 * w
      let y = town[1] + gauss(r) * 0.01 * h
      let a = a0
      for (let d = 0; d < len; d += 4 * U) {
        pts.push([x, y])
        a += (r() - 0.5) * 0.12
        x += Math.cos(a) * 4 * U
        y += Math.sin(a) * 4 * U * 0.32
      }
      streets.push(pts)
    }
  }
  const riverDist = (x: number, y: number) => {
    let m = 1e9
    for (const [rx, ry] of riverPts) m = Math.min(m, Math.hypot(x - rx, (y - ry) * 2))
    return m
  }
  const lightAt = (r: () => number): [number, number] | null => {
    const mode = r()
    let x: number
    let y: number
    if (mode < 0.55) {
      const st = streets[Math.floor(r() * streets.length)]
      const p = st[Math.floor(r() * st.length)]
      x = p[0] + (r() - 0.5) * 2 * U
      y = p[1] + (r() - 0.5) * 2 * U
    } else if (mode < 0.82) {
      const p = riverPts[Math.floor(r() * riverPts.length)]
      x = p[0] + (r() < 0.5 ? -1 : 1) * (5 + r() * 10) * U * (0.6 + depthAt(p[0], p[1]))
      y = p[1] + (r() - 0.5) * 3 * U
    } else {
      x = r() * w
      y = vTop(x) + r() * (L.vy - vTop(x))
    }
    if (riverDist(x, y) < 3 * U) return null
    return inValley(x, y, 4 * U) ? [x, y] : null
  }
  const lampMark = (PP: Painter, x: number, y: number, d: number, col: RGB, halo: boolean) => {
    mark(PP, "dot", x, y, d * 1.5 * (1 + PP.r() * 0.35), d * 1.5, PP.r() * 3, col, 1)
    mark(PP, "dot", x, y, d * 0.8, d * 0.75, PP.r() * 3, P0.lights[2], 0.9)
    if (halo) {
      const nr = 4 + ((PP.r() * 3) | 0)
      for (let j = 0; j < nr; j++) {
        const an = (j / nr) * TAU + PP.r() * 0.7
        const rl = d * (1.6 + PP.r() * 1.5)
        mark(PP, "pencil", x + Math.cos(an) * rl * 0.9, y + Math.sin(an) * rl * 0.9, rl, 1.3 * U, an, jit(P0.lights[3], PP.r, 4), 0.35 + PP.r() * 0.25)
      }
    }
  }
  if (R.lights > 0) {
    fork(104)
    // street lamps at an even rhythm, then the rest
    for (const st of streets) {
      for (let i = 0; i < st.length; i += 2 + ((P.r() * 3) | 0)) {
        const x = st[i][0] + (P.r() - 0.5) * 2.5 * U
        const y = st[i][1] + (P.r() - 0.5) * 1.5 * U
        if (!inValley(x, y, 3 * U) || riverDist(x, y) < 3 * U || P.r() > R.lights) continue
        const dz = depthAt(x, y)
        lampMark(P, x, y, (1.8 + 2.4 * dz) * U, P.r() < 0.6 ? P0.lights[1] : P0.lights[0], P.r() < 0.2)
      }
    }
    const nL = Math.round(150 * R.lights)
    for (let i = 0; i < nL; i++) {
      const p = lightAt(P.r)
      if (!p) continue
      const dz = depthAt(p[0], p[1])
      const d = (2 + 3 * dz) * U * (0.7 + P.r() * 0.6)
      const v = P.r()
      const col = v < 0.45 ? P0.lights[0] : v < 0.82 ? P0.lights[1] : P0.lights[2]
      lampMark(P, p[0], p[1], d, col, P.r() < 0.35)
      // reflection: broken warm dashes stacked on the water below a bank light
      if (riverDist(p[0], p[1]) < 18 * U) {
        const nd = 3 + ((P.r() * 4) | 0)
        for (let j = 1; j <= nd; j++) mark(P, "pencil", p[0] + (P.r() - 0.5) * 2 * U, p[1] + j * 2.6 * U, (3 + P.r() * 5) * U * (1 - j / (nd + 2)), 1.3 * U, (P.r() - 0.5) * 0.1, jit(col, P.r, 5), 0.55 * (1 - j / (nd + 1)))
      }
    }
    commit(B.back, "white")
  }
  yield

  /* ---------- cloud banks lit from below by the town (own layer: they drift) ---------- */
  type Lobe = { x: number; y: number; rx: number; ry: number }
  type Bank = { lobes: Lobe[]; x0: number; x1: number; base: (x: number) => number; warmth: (x: number) => number; thin: boolean }
  const mkBank = (x0: number, x1: number, baseFn: (x: number) => number, hMax: number, nb: number, seedN: number, warmth: (x: number) => number, thin: boolean): Bank => {
    const r = rng(s * 13 + seedN)
    const lobes: Lobe[] = []
    const cw = (x1 - x0) / nb
    for (let i = 0; i < nb; i++) {
      const x = x0 + cw * (i + 0.5) + (r() - 0.5) * cw * 0.7
      const env = Math.sin(Math.PI * clamp((x - x0) / (x1 - x0), 0, 1)) ** 0.6
      const a = (0.45 + 0.55 * r()) * env
      const ry = hMax * a * 0.55 + 3 * U
      const rx = cw * (0.6 + 0.6 * r())
      lobes.push({ x, y: baseFn(x) - ry * 0.85, rx, ry })
      // a smaller lobe riding on top of the big ones
      if (!thin && a > 0.6 && r() < 0.7) lobes.push({ x: x + (r() - 0.5) * rx * 0.6, y: baseFn(x) - ry * 1.75, rx: rx * 0.5, ry: ry * 0.6 })
    }
    return { lobes, x0, x1, base: baseFn, warmth, thin }
  }
  const banks: Bank[] = [
    mkBank(-0.04 * w, 0.66 * w, (x) => L.farB(x) + 0.012 * h + 0.008 * h * (n1(x / (120 * U), s + 120) - 0.5), 0.1 * Math.min(h, w * 0.6), 11, 1, (x) => Math.exp(-(((x - town[0]) / (0.24 * w)) ** 2)), false),
    mkBank(-0.06 * w, 0.4 * w, (x) => L.farA(x) - 0.03 * h, 0.022 * h, 8, 2, (x) => 0.35 * glowAt(x, L.farA(x) - 0.02 * h) + 0.15, true),
  ]
  {
    const ox = pad / k
    for (let bi = 0; bi < banks.length; bi++) {
      const bk = banks[bi]
      // which lobe a point belongs to: the front-most (lowest) lobe that contains it
      const lobeAt = (x: number, y: number) => {
        if (y > bk.base(x) + (n1(x / (24 * U), s + 130 + bi) - 0.5) * 5 * U) return null
        let best: Lobe | null = null
        let bv = 0
        for (const lb of bk.lobes) {
          const dx = (x - lb.x) / lb.rx
          const dy = (y - lb.y) / lb.ry
          const v = 1 - dx * dx - dy * dy
          if (v > 0 && (!best || lb.y > best.y)) {
            best = lb
            bv = v
          }
        }
        return best ? { lb: best, v: bv } : null
      }
      const yTop = Math.min(...bk.lobes.map((lb) => lb.y - lb.ry)) - 4 * U
      const yBot = Math.max(...bk.lobes.map((lb) => bk.base(lb.x))) + 6 * U
      const tangent = (x: number, y: number, lb: Lobe) => {
        const a = Math.atan2((y - lb.y) / lb.ry, (x - lb.x) / lb.rx)
        let t = Math.atan2(Math.cos(a) * lb.ry, -Math.sin(a) * lb.rx)
        if (t > Math.PI / 2) t -= Math.PI
        if (t < -Math.PI / 2) t += Math.PI
        return t * 0.45
      }
      // lit = how far down the lobe a point is (the underside faces the town)
      const litAt = (y: number, lb: Lobe) => clamp((y - (lb.y - lb.ry)) / (lb.ry * 2), 0, 1)
      const n0 = bk.thin ? 900 : 3200
      // underlayer: cool dim tops, a little lighter than the sky behind the ridges
      fork(110 + bi * 5)
      scatter(P, bk.x0, yTop, bk.x1, yBot, n0, (x, y) => {
        const c = lobeAt(x, y)
        if (!c) return
        const l = litAt(y, c.lb)
        const col = l < 0.5 ? pick(P0.cloudTop, P.r()) : pick(P0.cloudMid, P.r() * 0.6)
        mark(P, "chalk", x + ox, y, (16 + P.r() * 24) * SZ, (5 + P.r() * 5) * SZ, tangent(x, y, c.lb) + (P.r() - 0.5) * 0.35, jit(col, P.r, 6), 0.75 + P.r() * 0.25)
      })
      commit(B.clouds, "chalk", undefined, true)
      // mid mauve, then the warm undersides where the town lights them
      fork(111 + bi * 5)
      scatter(P, bk.x0, yTop, bk.x1, yBot, n0 * 1.3, (x, y) => {
        const c = lobeAt(x, y)
        if (!c) return
        const wm = bk.warmth(x)
        const l = litAt(y, c.lb) + (P.r() - 0.5) * 0.25
        let col: RGB
        if (l < 0.42) {
          if (P.r() < 0.55) return
          col = l < 0.2 && P.r() < 0.5 ? mixc(P0.cloudTop[1], P0.band[1], 0.5) : pick(P0.cloudMid, P.r())
        } else if (l < 0.6 || P.r() > 0.2 + wm * 0.9) col = pick(P0.cloudMid, P.r())
        else col = pick(P0.cloudUnder, clamp((l - 0.55) * 1.9 * (0.45 + wm * 0.7) + (P.r() - 0.5) * 0.2, 0, 0.999))
        mark(P, "chalk", x + ox, y, (12 + P.r() * 22) * SZ, (3.5 + P.r() * 4) * SZ, tangent(x, y, c.lb) + (P.r() - 0.5) * 0.3, jit(col, P.r, 6), 0.55 + 0.45 * P.r())
      })
      commit(B.clouds, "chalk", { dx: 2 * U, dy: 0, n: 3, a: 0.3 }, true)
      // pencil: a pale lip along each lobe's top, warm light along each lobe's underside
      fork(112 + bi * 5)
      for (const lb of bk.lobes) {
        const wm = bk.warmth(lb.x)
        const arc = (a0: number, a1: number, inset: number) => {
          const pts: [number, number][] = []
          for (let i = 0; i <= 24; i++) {
            const a = a0 + (a1 - a0) * (i / 24)
            const x = lb.x + Math.cos(a) * lb.rx * inset
            const y = lb.y + Math.sin(a) * lb.ry * inset
            const c = lobeAt(x, y + 1.5 * U)
            if (c && c.lb === lb) pts.push([x + ox, y])
            else if (pts.length > 1) break
          }
          return pts
        }
        const top = arc(Math.PI * 1.08, Math.PI * 1.92, 0.97)
        if (top.length > 2) chain(P, "pencil", top, 10 * U, 1.5 * U, P0.cloudMid[1], (f) => 0.3 + 0.3 * Math.sin(Math.PI * f))
        const under = arc(Math.PI * 0.12, Math.PI * 0.88, 0.9)
        if (under.length > 2 && wm > 0.15) chain(P, "pencil", under, 10 * U, (1.4 + wm) * U, wm > 0.55 ? P0.cloudUnder[2] : P0.cloudUnder[1], (f) => (0.25 + 0.55 * wm) * Math.sin(Math.PI * f))
      }
      commit(B.clouds, "pastel", undefined, true)
    }
  }
  yield

  /* ---------- the near masses: charcoal laid straight onto the bare paper ---------- */
  const fg = ctx2(B.front)
  const paperUnder = (poly: [number, number][]) => {
    fg.save()
    fg.setTransform(k, 0, 0, k, 0, 0)
    fg.beginPath()
    poly.forEach(([x, y], i) => (i ? fg.lineTo(x, y) : fg.moveTo(x, y)))
    fg.closePath()
    fg.clip()
    fg.setTransform(1, 0, 0, 1, 0, 0)
    fg.drawImage(paper, 0, 0)
    fg.restore()
  }
  const massPoly = (top: (x: number) => number, xa: number, xb: number) => {
    const pts: [number, number][] = []
    for (let x = xa; x <= xb; x += 3 * U) pts.push([x, Math.min(h + 20 * U, top(x) + 2 * U) + (hash(Math.round(x), s + 7) - 0.5) * 1.5 * U])
    pts.push([xb, h + 20 * U], [xa, h + 20 * U])
    return pts
  }
  const xLend = (() => {
    let x = 0
    while (x < w && L.nearL(x) < h + 10 * U) x += 2 * U
    return x
  })()
  const xRstart = (() => {
    let x = L.cx
    while (x > 0 && L.nearR(x) < h + 10 * U) x -= 2 * U
    return x
  })()
  const LD = P0.land
  /** How much a slope faces the town's light (warm hatching and rims). */
  const townWarm = (x: number, y: number) => Math.exp(-(((x - town[0]) / (0.3 * w)) ** 2)) * Math.exp(-Math.abs(y - town[1]) / (0.3 * h))
  const charcoalMass = (top: (x: number) => number, xa: number, xb: number, seedN: number, lean: number, lift: number) => {
    fork(seedN)
    const yTop = Math.min(...Array.from({ length: 60 }, (_, i) => top(xa + ((xb - xa) * i) / 59)))
    const areaF = ((xb - xa) * (h - yTop)) / (w * h * 0.3)
    const slopeAt = (x: number) => Math.atan((top(x + 8 * U) - top(x - 8 * U)) / (16 * U))
    // 1. charcoal laid down first: deep at the foot, indigo and slate toward the starlit crest
    scatter(P, xa - 10 * U, yTop - 4 * U, xb + 10 * U, h + 10 * U, 8500 * areaF, (x, y) => {
      const t0 = top(x)
      if (y < t0 - 1 * U) return
      const dd = (y - t0) / (0.2 * h)
      const slope = slopeAt(x)
      const v = clamp(0.42 + lift - dd * 0.5 + (fbm2(x / (55 * U), y / (45 * U), s + seedN) - 0.5) * 0.9 + (P.r() - 0.5) * 0.3, 0, 0.999)
      const ang = P.r() < 0.72 ? slope * (1 - Math.min(0.7, dd)) + lean * Math.min(1, dd) + (P.r() - 0.5) * 0.45 : slope + 1.2 + (P.r() - 0.5) * 0.3
      mark(P, "charcoal", x, y, (22 + P.r() * 36) * SZ, (6 + P.r() * 9) * SZ, ang, jit(v > 0.8 ? mixc(LD[1], LD[2], 0.4) : pick(LD.slice(0, 2), v * 1.1), P.r, 5), 0.8 + P.r() * 0.2)
    })
    commit(B.front, "charcoal", { dx: Math.cos(lean) * 3.5 * U, dy: Math.sin(lean) * 3.5 * U, n: 4, a: 0.35 })
    // 2. slope hatching that follows the terrain, in zones of slate, violet and teal
    fork(seedN + 1)
    scatter(P, xa, yTop, xb, h + 6 * U, 15000 * areaF, (x, y) => {
      const t0 = top(x)
      if (y < t0 + 2 * U) return
      const dd = (y - t0) / (0.2 * h)
      if (P.r() > 0.9 + lift - dd * 0.5) return
      const slope = slopeAt(x)
      const zt = fbm2(x / (150 * U), y / (90 * U), s + seedN + 5)
      const warm = townWarm(x, y) * (1 - Math.min(1, dd * 0.9))
      let col: RGB
      if (warm > 0.22 && P.r() < warm * 1.2) col = P.r() < 0.6 ? P0.rimWarm : P0.glow[1]
      else if (zt < 0.43) col = P.r() < 0.7 ? LD[2] : LD[5]
      else if (zt < 0.57) col = P.r() < 0.75 ? LD[3] : LD[2]
      else col = dd < 0.35 && P.r() < 0.45 ? LD[5] : LD[4]
      const contour = P.r() < 0.78
      const ang = contour ? slope * (1 - Math.min(0.8, dd)) + lean * 0.4 * Math.min(1, dd) + (P.r() - 0.5) * 0.18 : (slope > 0 ? 1.15 : 1.95) + (P.r() - 0.5) * 0.25
      const pencil = P.r() < 0.35
      mark(P, pencil ? "pencil" : "chalk", x, y, (pencil ? 12 + P.r() * 16 : 14 + P.r() * 22) * U, (pencil ? 2 + P.r() * 1 : 4.5 + P.r() * 3.5) * U, ang, jit(col, P.r, 7), (0.6 + P.r() * 0.35) * (1 - Math.min(0.5, dd * 0.35)))
    })
    commit(B.front, "pastel")
    // dark charcoal accents back over the hatching: shadowed hollows under the lit planes
    fork(seedN + 6)
    scatter(P, xa, yTop, xb, h + 6 * U, 2600 * areaF, (x, y) => {
      const t0 = top(x)
      if (y < t0 + 6 * U) return
      if (fbm2(x / (90 * U), y / (60 * U), s + seedN + 7) > 0.48) return
      mark(P, "charcoal", x, y, (16 + P.r() * 26) * U, (5 + P.r() * 6) * U, slopeAt(x) * 0.6 + (P.r() - 0.5) * 0.5, jit(LD[0], P.r, 4), 0.55 + P.r() * 0.35)
    })
    commit(B.front, "charcoal", { dx: 2.5 * U, dy: 1.5 * U, n: 3, a: 0.3 })
    // 3. rock faces: a lit plane of parallel chalk with a dark crack along one side
    fork(seedN + 3)
    const nRock = Math.round(260 * areaF * R.density)
    for (let i = 0; i < nRock; i++) {
      const x = xa + (xb - xa) * P.r()
      const t0 = top(x)
      const y = t0 + (4 + P.r() * 0.12 * h) * (P.r() < 0.6 ? 0.5 : 1)
      if (y > h) continue
      const ang = slopeAt(x) + 1.25 + (P.r() - 0.5) * 0.4
      const nl = 3 + ((P.r() * 4) | 0)
      const ln = (9 + P.r() * 16) * U
      const col = P.r() < 0.5 ? LD[5] : P.r() < 0.6 ? LD[6] : LD[2]
      for (let l = 0; l < nl; l++) {
        const o = l * 2.6 * U
        mark(P, "chalk", x + Math.cos(ang - Math.PI / 2) * o, y + Math.sin(ang - Math.PI / 2) * o, ln * (0.8 + P.r() * 0.35), (2.4 + P.r() * 1.2) * U, ang + (P.r() - 0.5) * 0.08, jit(col, P.r, 6), 0.45 + P.r() * 0.3)
      }
      mark(P, "pencil", x + Math.cos(ang + Math.PI / 2) * 2.5 * U, y + Math.sin(ang + Math.PI / 2) * 2.5 * U, ln * 1.1, 1.6 * U, ang, LD[0], 0.85)
    }
    commit(B.front, "pastel")
    // 4. gullies: dark lines down the fall line, a lit edge beside each
    fork(seedN + 2)
    const nG = Math.round(((xb - xa) / w) * 26)
    for (let gi = 0; gi < nG; gi++) {
      let x = xa + (xb - xa) * ((gi + P.r()) / nG)
      let y = top(x) + (4 + P.r() * 30) * U
      if (y > h) continue
      const pts: [number, number][] = []
      const steps = 10 + ((P.r() * 14) | 0)
      const sl = slopeAt(x)
      let ang = sl > 0 ? sl + 0.9 * (0.6 + P.r() * 0.4) : Math.PI + sl - 0.9 * (0.6 + P.r() * 0.4)
      if (Math.sin(ang) < 0.3) ang = Math.PI / 2 + (P.r() - 0.5) * 0.8
      for (let i = 0; i < steps && y < h + 10 * U; i++) {
        pts.push([x, y])
        ang += (n1(i * 0.4 + gi * 5, s + seedN) - 0.5) * 0.5
        x += Math.cos(ang) * 9 * U
        y += Math.abs(Math.sin(ang)) * 9 * U
      }
      if (pts.length < 3) continue
      const warm = townWarm(pts[0][0], pts[0][1]) > 0.3
      chain(P, "pencil", pts, 11 * U, 1.7 * U, LD[0], (f) => 0.65 * (1 - f) + 0.15)
      chain(P, "pencil", pts.map(([px, py]) => [px - 2.6 * U, py] as [number, number]), 11 * U, 1.5 * U, warm && P.r() < 0.6 ? P0.rimWarm : LD[5], (f) => 0.55 * (1 - f) + 0.1)
    }
    commit(B.front, "pastel")
    // 5. the crest: starlight caught along the ridge in chalk, a band of short lit strokes just below it
    fork(seedN + 4)
    for (let x = xa; x <= xb; x += 2.2 * U) {
      const t0 = top(x)
      if (t0 > h) continue
      if (P.r() > 0.75) continue
      const yy = t0 + (2 + Math.abs(gauss(P.r)) * 12) * U
      const warm = townWarm(x, yy) > 0.35 && P.r() < 0.6
      mark(P, P.r() < 0.6 ? "chalk" : "pencil", x, yy, (8 + P.r() * 12) * U, (P.r() < 0.6 ? 2.6 : 1.5) * U, slopeAt(x) + (P.r() - 0.5) * 0.3, jit(warm ? P0.rimWarm : P.r() < 0.5 ? LD[5] : LD[6], P.r, 6), 0.3 + P.r() * 0.35)
    }
    const pts: [number, number][] = []
    for (let x = xa; x <= xb; x += 3 * U) if (top(x) < h) pts.push([x, top(x) + 1.4 * U])
    chain(P, "chalk", pts, 16 * U, 3 * U, (_i, f) => {
      const x = xa + (xb - xa) * f
      return townWarm(x, top(x)) > 0.4 && P.r() < 0.7 ? P0.rimWarm : P.r() < 0.6 ? LD[6] : P0.rimCool
    }, (f) => 0.4 + 0.45 * n1(f * 26, s + seedN))
    commit(B.front, "pastel")
  }

  paperUnder(massPoly(L.nearR, xRstart - 20 * U, w + 20 * U))
  charcoalMass(L.nearR, xRstart - 20 * U, w + 20 * U, 200, 0.55, 0.12)
  yield
  paperUnder(massPoly(L.nearL, -20 * U, xLend + 20 * U))
  charcoalMass(L.nearL, -20 * U, xLend + 20 * U, 210, 0.65, 0.3)
  yield

  // conifers along the left skyline and the lower right flank
  {
    fork(220)
    const tree = (x: number, base: number, ht: number) => {
      const nT = Math.max(4, Math.round(ht / (2.4 * U)))
      const lean = (P.r() - 0.5) * 0.06
      for (let i = 0; i < nT; i++) {
        const f = i / nT
        const yy = base - f * ht
        const hw = (1 - f) ** 0.85 * ht * 0.3 + 1.2 * U
        mark(P, "charcoal", x + f * ht * lean + (P.r() - 0.5) * 1.5 * U, yy, hw * 2 * (0.85 + P.r() * 0.3), (2.6 + P.r() * 1.6) * U, (P.r() - 0.5) * 0.25 + (P.r() < 0.5 ? 0.12 : -0.12), jit(P0.near[0], P.r, 3), 0.95)
      }
      mark(P, "pencil", x + ht * lean * 0.5, base - ht * 0.5, ht * 1.1, 1.6 * U, Math.PI / 2 + lean, P0.near[0], 0.9)
      if (P.r() < 0.75) mark(P, "pencil", x + ht * 0.1, base - ht * 0.55, ht * 0.55, 1.1 * U, -1.2 + (P.r() - 0.5) * 0.2, P0.rimCool, 0.32)
    }
    let x = 4 * U
    while (x < xLend * 0.9) {
      const ht = (12 + P.r() * 22) * U * (1 + 0.7 * (1 - x / xLend))
      if (P.r() < 0.8) tree(x, L.nearL(x) + 4 * U, ht)
      x += (4 + P.r() * 14) * U
    }
    let x2 = xRstart + 0.04 * w
    while (x2 < L.cx - L.plat - 0.07 * w) {
      if (P.r() < 0.4) tree(x2, L.nearR(x2) + 4 * U, (9 + P.r() * 13) * U)
      x2 += (5 + P.r() * 16) * U
    }
    commit(B.front, "charcoal")
  }
  yield

  /* ---------- firs in patches on the slopes: slightly lighter than the hill, tips caught by starlight ---------- */
  {
    fork(225)
    const trees: [number, number, number][] = []
    const plant = (top: (x: number) => number, xa: number, xb: number, n: number, d0: number, d1: number, sd: number) => {
      for (let i = 0; i < n; i++) {
        const x = xa + (xb - xa) * P.r()
        const t0 = top(x)
        const y = t0 + (d0 + (d1 - d0) * P.r()) * h
        if (y > h + 10 * U || y < t0 + 6 * U) continue
        if (fbm2(x / (110 * U), y / (70 * U), s + sd) < 0.47) continue
        trees.push([x, y, (14 + P.r() * 16) * U * (0.8 + 0.6 * ((y - t0) / (0.3 * h)))])
      }
    }
    plant(L.nearR, xRstart, L.cx - L.plat - 0.02 * w, Math.round(1100 * R.density), 0.03, 0.34, 226)
    plant(L.nearR, L.cx + L.plat + 0.02 * w, w + 10 * U, Math.round(520 * R.density), 0.03, 0.32, 227)
    plant(L.nearL, -10 * U, xLend, Math.round(650 * R.density), 0.02, 0.28, 228)
    trees.sort((a, b) => a[1] - b[1])
    for (const [x, y, ht] of trees) {
      const nT = Math.max(3, Math.round(ht / (2.6 * U)))
      const tone = P.r() < 0.6 ? P0.near[0] : P0.near[1]
      for (let i = 0; i < nT; i++) {
        const f = i / nT
        const hw = (1 - f) ** 0.9 * ht * 0.32 + 1 * U
        mark(P, "charcoal", x + (P.r() - 0.5) * 1.2 * U, y - f * ht, hw * 2 * (0.85 + P.r() * 0.3), (3.2 + P.r() * 1.6) * U, (P.r() - 0.5) * 0.3 + (P.r() < 0.5 ? 0.14 : -0.14), jit(tone, P.r, 4), 1)
      }
      mark(P, "pencil", x, y - ht * 0.5, ht * 1.05, 1.6 * U, Math.PI / 2, tone, 0.9)
      // starlight on the right-hand edge of a few tiers, warm on the trees that face the town
      const lit = townWarm(x, y) > 0.35 ? P0.rimWarm : P.r() < 0.5 ? P0.land[5] : P0.land[6]
      for (let i = 1; i < nT; i += 2) {
        if (P.r() < 0.35) continue
        const f = i / nT
        const hw = (1 - f) ** 0.9 * ht * 0.32
        mark(P, P.r() < 0.5 ? "chalk" : "pencil", x + hw * 0.5, y - f * ht - 0.6 * U, hw * 0.9 + 2 * U, 1.8 * U, -0.25 + (P.r() - 0.5) * 0.2, jit(lit, P.r, 5), 0.55 + P.r() * 0.3)
      }
    }
    commit(B.front, "pastel")
  }
  yield

  /* ---------- the path down from the observatory, with its lamps ---------- */
  {
    const lamps: [number, number][] = []
    fork(230)
    const xp = L.cx - L.plat
    const legs: [number, number, number, number][] = [
      [L.cx - L.plat * 0.9, 3, xp - 0.07 * w, 14],
      [xp - 0.07 * w, 14, xp - 0.02 * w, 40],
      [xp - 0.02 * w, 40, xp - 0.11 * w, 64],
      [xp - 0.11 * w, 64, xp - 0.05 * w, 110],
    ]
    const path: [number, number][] = []
    for (const [xa, da, xb, db] of legs) {
      for (let i = 0; i <= 20; i++) {
        const f = i / 20
        const x = xa + (xb - xa) * f
        const d = (da + (db - da) * f) * U
        path.push([x, L.nearR(x) + d])
      }
      lamps.push([xb, L.nearR(xb) + db * U])
    }
    chain(P, "chalk", path, 14 * U, 4.6 * U, P0.land[6], 0.55)
    chain(P, "pencil", path.map(([x, y]) => [x, y - 2.2 * U] as [number, number]), 12 * U, 1.8 * U, P0.dome[3], 0.7)
    chain(P, "pencil", path.map(([x, y]) => [x, y + 2.4 * U] as [number, number]), 12 * U, 1.8 * U, P0.land[0], 0.8)
    commit(B.front, "pastel")
    fork(231)
    for (const [x, y] of lamps) {
      for (let i = 0; i < 16; i++) mark(P, "chalk", x + gauss(P.r) * 9 * U, y + (P.r() - 0.2) * 5 * U, (8 + P.r() * 10) * U, 3 * U, (P.r() - 0.5) * 0.3, P.r() < 0.5 ? P0.lights[0] : P0.rimWarm, 0.22)
      mark(P, "pencil", x, y - 8 * U, 16 * U, 1.8 * U, Math.PI / 2, P0.land[0], 0.9)
      lampMark(P, x, y - 16 * U, 8 * U, P0.lights[1], true)
    }
    commit(B.front, "white")
  }
  yield

  /* ---------- the foreground ridge: the darkest charcoal, a row of firs on its crest ---------- */
  paperUnder(massPoly(L.fgR, -20 * U, w + 20 * U))
  {
    charcoalMass(L.fgR, -20 * U, w + 20 * U, 240, 0.2, -0.12)
    fork(244)
    let x = -6 * U
    while (x < w + 6 * U) {
      const ht = (18 + P.r() * 40) * U
      if (n1(x / (90 * U), s + 245) > 0.38) {
        const base0 = L.fgR(x) + 5 * U
        const nT = Math.max(5, Math.round(ht / (2.5 * U)))
        for (let i = 0; i < nT; i++) {
          const f = i / nT
          const hw = (1 - f) ** 0.85 * ht * 0.3 + 1.2 * U
          mark(P, "charcoal", x + (P.r() - 0.5) * 1.6 * U, base0 - f * ht, hw * 2 * (0.85 + P.r() * 0.3), (2.6 + P.r() * 1.8) * U, (P.r() - 0.5) * 0.25 + (P.r() < 0.5 ? 0.12 : -0.12), jit(P0.near[0], P.r, 3), 0.97)
        }
        mark(P, "pencil", x, base0 - ht * 0.5, ht * 1.1, 1.7 * U, Math.PI / 2, P0.near[0], 0.9)
        if (P.r() < 0.6) mark(P, "pencil", x + ht * 0.1, base0 - ht * 0.6, ht * 0.5, 1.1 * U, -1.2, P0.rimCool, 0.28)
      }
      x += (5 + P.r() * 13) * U
    }
    commit(B.front, "charcoal")
  }
  yield

  /* ---------- the observatory ---------- */
  // its marks keep their drawn size at every scale, so it keeps its full count of them too
  P.q = 1
  {
    const { cx, by, Rd } = L
    const RS = (Rd / (86 * U)) ** 2 // mark counts scale with the building's area
    const e = 0.1 // the base circles seen from below bow upward
    const bow = (x: number) => e * Rd * Math.sqrt(Math.max(0, 1 - ((x - cx) / Rd) ** 2))
    const base = (x: number) => by - bow(x)
    const dH = 0.92 * Rd
    const top = (x: number) => base(x) - dH
    const yc = by - dH
    const RR = Rd * 1.03
    const LX = -0.55
    const LY = -0.62
    const LZ = 0.56
    // plinth: stone under the drum
    fork(300)
    paperUnder([[cx - Rd * 1.55, by - 2 * U], [cx + Rd * 2.15, by - 2 * U], [cx + Rd * 2.15, by + Rd * 0.2], [cx - Rd * 1.55, by + Rd * 0.2]])
    scatter(P, cx - Rd * 1.55, by - 2 * U, cx + Rd * 2.15, by + Rd * 0.2, 380 * RS, (x, y) => {
      const col = P.r() < 0.6 ? P0.near[2] : P0.dome[0]
      mark(P, "charcoal", x, y, (12 + P.r() * 14) * U, (4 + P.r() * 4) * U, (P.r() - 0.5) * 0.15, jit(col, P.r, 4), 0.85)
    })
    commit(B.front, "charcoal")
    for (let r0 = 0; r0 < 3; r0++) {
      const yy = by + 2 * U + r0 * 0.065 * Rd
      const pts: [number, number][] = []
      for (let x = cx - Rd * 1.5; x <= cx + Rd * 2.1; x += 6 * U) pts.push([x, yy + (P.r() - 0.5) * 0.8 * U])
      chain(P, "pencil", pts, 9 * U, 1.2 * U, P0.dome[1], 0.32)
    }
    commit(B.front, "pastel")

    // annex
    fork(310)
    const ax0 = cx + Rd * 0.9
    const ax1 = cx + Rd * 1.98
    const aTop = (x: number) => by - Rd * 0.6 + ((x - ax0) / (ax1 - ax0)) * Rd * 0.07
    paperUnder([[ax0 + 3 * U, aTop(ax0) + 3 * U], [ax1 - 3 * U, aTop(ax1) + 3 * U], [ax1 - 3 * U, by + 1 * U], [ax0 + 3 * U, by + 1 * U]])
    scatter(P, ax0 - 3 * U, aTop(ax0) - 4 * U, ax1 + 3 * U, by, 900 * RS, (x, y) => {
      const m = (P.r() - 0.3) * 3.5 * U
      if (y < aTop(x) - m * 0.5 || x < ax0 - m || x > ax1 + m) return
      const u = (x - ax0) / (ax1 - ax0)
      const v = clamp(0.6 - u * 0.45 + (P.r() - 0.5) * 0.3, 0, 0.999)
      const ch = P.r() < 0.6
      mark(P, ch ? "chalk" : "pencil", x, y, (8 + P.r() * 12) * U, (ch ? 4 : 1.4) * U, Math.PI / 2 + (P.r() - 0.5) * 0.12, jit(pick(P0.dome.slice(0, 4), v), P.r, 5), 0.7 + P.r() * 0.3)
    })
    commit(B.front, "chalk")
    chain(P, "pencil", [[ax0 - 6 * U, aTop(ax0) - 1.5 * U], [ax1 + 5 * U, aTop(ax1) - 0.5 * U]], 10 * U, 2 * U, P0.dome[3], (f) => (n1(f * 12, s + 405) > 0.28 ? 0.7 : 0), 0.2)
    chain(P, "pencil", [[ax1 + 0.5 * U, aTop(ax1) - 4 * U], [ax1 + 1.5 * U, by + 3 * U]], 9 * U, 1.6 * U, P0.near[1], (f) => (n1(f * 10, s + 406) > 0.3 ? 0.7 : 0), 0.25)
    const wx = cx + Rd * 1.46
    const wy = by - Rd * 0.33
    const ww = Rd * 0.3
    const wh = Rd * 0.22
    scatter(P, wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2, 160 * RS, (x, y) => {
      const v = clamp(0.4 + (y - wy) / wh + (P.r() - 0.5) * 0.4, 0, 0.999)
      mark(P, "chalk", x, y, (5 + P.r() * 6) * U, (2.5 + P.r() * 2) * U, (P.r() - 0.5) * 0.4, jit(pick(P0.warm.slice(1), v), P.r, 5), 0.95)
    })
    commit(B.front, "chalk")
    chain(P, "pencil", [[wx - ww / 2, wy - wh / 2], [wx + ww / 2, wy - wh / 2], [wx + ww / 2, wy + wh / 2], [wx - ww / 2, wy + wh / 2], [wx - ww / 2, wy - wh / 2 - 1 * U]], 7 * U, 1.5 * U, P0.near[1], 0.75)
    chain(P, "pencil", [[wx, wy - wh / 2], [wx, wy + wh / 2]], 6 * U, 1.3 * U, P0.near[1], 0.75)
    chain(P, "pencil", [[wx - ww / 2, wy], [wx + ww / 2, wy]], 6 * U, 1.3 * U, P0.near[1], 0.6)
    chain(P, "pencil", [[ax1 - Rd * 0.25, aTop(ax1 - Rd * 0.25)], [ax1 - Rd * 0.25, aTop(ax1 - Rd * 0.25) - Rd * 0.2]], 6 * U, 2.6 * U, P0.near[1], 0.85)
    for (let i = 0; i < 26; i++) mark(P, "chalk", wx + gauss(P.r) * ww * 0.7, by + (1 + P.r() * 4) * U, (8 + P.r() * 10) * U, 2.5 * U, (P.r() - 0.5) * 0.2, P0.warm[1], 0.14 + P.r() * 0.1)
    commit(B.front, "pastel")
    yield

    // drum: a cylinder in vertical pastel strokes, lit from the upper left, warmed from the valley
    fork(320)
    const drumTone = (x: number, r: () => number) => {
      const u = clamp((x - cx) / Rd, -1, 1)
      const nz = Math.sqrt(1 - u * u)
      const I = Math.max(0, u * LX + nz * LZ) * 1.2 + 0.06
      return clamp(I + (r() - 0.5) * 0.28, 0, 0.999)
    }
    const inDrum = (x: number, y: number) => {
      const m = (P.r() - 0.3) * 3.5 * U // strokes overshoot the wall a little, or stop short of it
      return x > cx - Rd - m && x < cx + Rd + m && y > top(clamp(x, cx - Rd, cx + Rd)) - m * 0.5 && y < base(clamp(x, cx - Rd, cx + Rd)) + m * 0.4
    }
    scatter(P, cx - Rd, yc - 0.12 * Rd, cx + Rd, by, 700 * RS, (x, y) => {
      if (!inDrum(x, y)) return
      const v = drumTone(x, P.r) * 0.8
      mark(P, "chalk", x, y, (12 + P.r() * 14) * U, (6 + P.r() * 4) * U, Math.PI / 2 + (P.r() - 0.5) * 0.08, jit(pick(P0.dome.slice(0, 3), v), P.r, 4), 1)
    })
    commit(B.front, "pastel")
    scatter(P, cx - Rd, yc - 0.12 * Rd, cx + Rd, by, 1500 * RS, (x, y) => {
      if (!inDrum(x, y)) return
      const col = pick(P0.dome.slice(0, 4), drumTone(x, P.r))
      const ch = P.r() < 0.7
      mark(P, ch ? "chalk" : "pencil", x, y, (10 + P.r() * 16) * U, (ch ? 4 + P.r() * 3 : 1.5) * U, Math.PI / 2 + (P.r() - 0.5) * 0.1, jit(col, P.r, 5), 0.8 + P.r() * 0.2)
    })
    commit(B.front, "chalk")
    for (let c0 = 1; c0 < 6; c0++) {
      const pts: [number, number][] = []
      for (let x = cx - Rd * 0.97; x <= cx + Rd * 0.97; x += 5 * U) pts.push([x, base(x) - (c0 / 6) * dH + (P.r() - 0.5) * 0.8 * U])
      chain(P, "pencil", pts, 8 * U, 1.1 * U, (_i, f) => (f < 0.5 ? P0.dome[1] : P0.dome[0]), 0.3)
    }
    scatter(P, cx - Rd, yc, cx - Rd * 0.2, by, 260 * RS, (x, y) => {
      if (y < top(x) || y > base(x)) return
      const u = (x - cx) / Rd
      if (P.r() > (-u - 0.2) * 1.4) return
      mark(P, "pencil", x, y, (8 + P.r() * 10) * U, 1.4 * U, Math.PI / 2 + (P.r() - 0.5) * 0.2, jit(P0.rimWarm, P.r, 5), 0.3 + P.r() * 0.2)
    })
    commit(B.front, "pastel")
    // door with light spilling out
    {
      const d0 = cx - Rd * 0.42
      const d1 = cx - Rd * 0.2
      const dTop = (x: number) => base(x) - Rd * 0.52
      scatter(P, d0, dTop(d0), d1, base(d0), 110 * RS, (x, y) => {
        if (y < dTop(x) || y > base(x)) return
        const v = clamp(((y - dTop(x)) / (Rd * 0.52)) * 0.8 + 0.2 + (P.r() - 0.5) * 0.3, 0, 0.999)
        mark(P, "chalk", x, y, (6 + P.r() * 6) * U, (3 + P.r() * 2) * U, Math.PI / 2 + (P.r() - 0.5) * 0.3, jit(pick(P0.warm.slice(1), v), P.r, 5), 0.95)
      })
      commit(B.front, "chalk")
      chain(P, "pencil", [[d0, base(d0)], [d0, dTop(d0)], [d1, dTop(d1)], [d1, base(d1)]], 7 * U, 1.6 * U, P0.near[1], 0.8)
      for (let i = 0; i < 50; i++) {
        const f = P.r()
        const x = (d0 + d1) / 2 + gauss(P.r) * Rd * (0.15 + 0.35 * f)
        const y = base(x) + (2 + f * 14) * U
        mark(P, "chalk", x, y, (8 + P.r() * 12) * U, (2.5 + P.r() * 2) * U, (P.r() - 0.5) * 0.25, jit(P0.warm[f < 0.3 ? 2 : 1], P.r, 5), 0.3 * (1 - f) + 0.08)
      }
      // lamplight from the slit, door and window reflected on the plinth and the ground in front
      for (let i = 0; i < 140 * RS; i++) {
        const f = P.r()
        const x = cx + Rd * 0.3 + gauss(P.r) * Rd * 1.1
        const y = by + (1 + f * f * 0.32 * Rd / U) * U
        const wm = Math.exp(-(((x - (cx - Rd * 0.2)) / (Rd * 1.3)) ** 2)) + 0.6 * Math.exp(-(((x - (cx + Rd * 1.46)) / (Rd * 0.4)) ** 2))
        if (P.r() > wm) continue
        mark(P, P.r() < 0.6 ? "chalk" : "pencil", x, y, (6 + P.r() * 12) * U, (P.r() < 0.6 ? 2.6 : 1.4) * U, (P.r() - 0.5) * 0.2, jit(P.r() < 0.4 ? P0.warm[2] : P.r() < 0.6 ? P0.warm[1] : P0.rimWarm, P.r, 5), (0.28 + P.r() * 0.25) * (1 - f * 0.7))
      }
      commit(B.front, "chalk")
    }
    {
      const pl: [number, number][] = []
      for (let x = cx - Rd; x <= cx + Rd + 0.1; x += 4 * U) pl.push([x, base(x)])
      const broken = (a: number, sd: number) => (f: number) => (n1(f * 14, s + sd) > 0.32 ? a : 0)
      chain(P, "pencil", pl, 10 * U, 1.8 * U, P0.near[1], broken(0.7, 401), 0.2)
      chain(P, "pencil", [[cx + Rd + 0.5 * U, top(cx + Rd) - 4 * U], [cx + Rd + 1.4 * U, base(cx + Rd) + 3 * U]], 9 * U, 1.8 * U, P0.near[1], broken(0.75, 402), 0.25)
      chain(P, "pencil", [[cx - Rd - 0.5 * U, top(cx - Rd) - 3 * U], [cx - Rd - 1.2 * U, base(cx - Rd) + 4 * U]], 9 * U, 1.5 * U, P0.dome[3], broken(0.45, 403), 0.25)
      commit(B.front, "pastel")
    }
    yield

    // dome: chalk along the meridians, shaded by a light from the upper left
    fork(330)
    const inDome = (x: number, y: number) => {
      const dx = x - cx
      const dy = y - yc
      const rr = RR + (n1(Math.atan2(dy, dx) * 9, s + 333) - 0.4) * 4 * U
      return dx * dx + dy * dy < rr * rr && y < top(clamp(x, cx - Rd, cx + Rd)) + 1 * U
    }
    const merid = (x: number, y: number) => {
      const dy = Math.min(-0.001, y - yc)
      const rr = Math.sqrt(Math.max(1e-6, RR * RR - dy * dy))
      return clamp((x - cx) / rr, -1, 1)
    }
    const meridAng = (x: number, y: number) => {
      const m = merid(x, y)
      const dy = Math.min(-0.001, y - yc)
      const rr = Math.sqrt(Math.max(1e-6, RR * RR - dy * dy))
      return Math.atan2(1, (m * -dy) / rr)
    }
    const domeI = (x: number, y: number) => {
      const nx = (x - cx) / RR
      const ny = (y - yc) / RR
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
      return Math.max(0, nx * LX + ny * LY + nz * LZ)
    }
    const ms = -0.2
    const sw = 0.12
    const inSlit = (x: number, y: number) => Math.abs(merid(x, y) - ms) < sw && y > yc - RR * 0.985
    // a solid underlayer first, so no paper shows through the metal
    scatter(P, cx - RR, yc - RR, cx + RR, by, 1000 * RS, (x, y) => {
      if (!inDome(x, y)) return
      const v = clamp(domeI(x, y) * 0.85 + (P.r() - 0.5) * 0.2, 0, 0.999)
      mark(P, "chalk", x, y, (14 + P.r() * 14) * U, (6 + P.r() * 4) * U, meridAng(x, y) + (P.r() - 0.5) * 0.15, jit(inSlit(x, y) ? P0.warm[0] : pick(P0.dome.slice(0, 3), v), P.r, 4), 1)
    })
    commit(B.front, "pastel")
    scatter(P, cx - RR, yc - RR, cx + RR, by, 1700 * RS, (x, y) => {
      if (!inDome(x, y) || inSlit(x, y)) return
      const I = domeI(x, y)
      const v = clamp(I * 1.15 + (P.r() - 0.5) * 0.26, 0, 0.999)
      mark(P, "chalk", x, y, (10 + P.r() * 14) * U, (3 + P.r() * 3) * U, meridAng(x, y) + (P.r() - 0.5) * 0.12, jit(pick(P0.dome, v), P.r, 5), 0.7 + P.r() * 0.3)
    })
    commit(B.front, "chalk")
    // shadow hatching along the latitudes, and the warm bounce from the valley on the lower left
    scatter(P, cx - RR, yc - RR, cx + RR, by, 1000 * RS, (x, y) => {
      if (!inDome(x, y) || inSlit(x, y)) return
      const I = domeI(x, y)
      const nx = (x - cx) / RR
      const ny = (y - yc) / RR
      const warm = Math.max(0, -nx * 0.8 + ny * 0.6 + 0.1)
      if (I < 0.45 && P.r() < 0.85 - I) {
        mark(P, "pencil", x, y, (8 + P.r() * 10) * U, 1.4 * U, -nx * 0.3 + (P.r() - 0.5) * 0.15, jit(P0.dome[0], P.r, 5), 0.5 + P.r() * 0.25)
      } else if (warm > 0.45 && P.r() < warm - 0.25) {
        mark(P, "pencil", x, y, (7 + P.r() * 8) * U, 1.4 * U, meridAng(x, y) + (P.r() - 0.5) * 0.2, jit(P0.rimWarm, P.r, 5), 0.35 + P.r() * 0.25)
      } else if (I > 0.72 && P.r() < 0.35) {
        mark(P, "pencil", x, y, (6 + P.r() * 8) * U, 1.4 * U, meridAng(x, y) + (P.r() - 0.5) * 0.15, P0.dome[4], 0.55)
      }
    })
    commit(B.front, "pastel")
    const meridPts = (m: number, from = 0.02, to = 1): [number, number][] => {
      const pts: [number, number][] = []
      for (let i = 0; i <= 28; i++) {
        const f = from + (to - from) * (i / 28)
        const a = -Math.PI / 2 + f * (Math.PI / 2)
        const dy = Math.sin(a) * RR
        const rr = Math.cos(a) * RR
        const x = cx + m * rr
        pts.push([x, Math.min(top(clamp(x, cx - Rd, cx + Rd)), yc + dy)])
      }
      return pts
    }
    for (const m of [-0.82, -0.55, 0.12, 0.42, 0.7, 0.9]) chain(P, "pencil", meridPts(m), 9 * U, 1.4 * U, m < 0 ? P0.dome[1] : P0.dome[0], 0.5)
    commit(B.front, "pastel")
    yield

    // the open slit: warm lamplight inside, the telescope crossing it
    fork(340)
    const slitPoly: [number, number][] = [...meridPts(ms - sw, 0.015), ...meridPts(ms + sw, 0.015).reverse()]
    scatter(P, cx + (ms - sw) * RR - 4 * U, yc - RR, cx + (ms + sw) * RR + 4 * U, yc + 2 * U, 420 * RS, (x, y) => {
      if (!inDome(x, y) || !inSlit(x, y)) return
      const m = merid(x, y)
      const centre = 1 - Math.abs(m - ms) / sw
      const depth = clamp((y - (yc - RR)) / RR, 0, 1)
      const v = clamp(0.3 + centre * 0.4 + depth * 0.4 + (P.r() - 0.5) * 0.25, 0, 0.999)
      mark(P, "chalk", x, y, (6 + P.r() * 9) * U, (3 + P.r() * 2.5) * U, meridAng(x, y) + (P.r() - 0.5) * 0.25, jit(pick(P0.warm.slice(1), v), P.r, 5), 1)
    })
    commit(B.front, "chalk")
    {
      const px = cx + ms * RR * 0.75
      const py = yc - RR * 0.08
      const ux = L.head[0] < px ? -0.5 : 0.5
      const uy = -0.866
      const ang = Math.atan2(uy, ux)
      sc.save()
      sc.setTransform(k, 0, 0, k, 0, 0)
      sc.beginPath()
      slitPoly.forEach(([x, y], i) => (i ? sc.lineTo(x, y) : sc.moveTo(x, y)))
      sc.closePath()
      sc.clip()
      const tl = RR * 0.95
      const tw = RR * 0.17
      for (let i = 0; i < 90 * RS; i++) {
        const f = P.r()
        const o = (P.r() - 0.5) * tw * (0.75 + 0.25 * f)
        mark(P, "charcoal", px + ux * f * tl - uy * o, py + uy * f * tl + ux * o, (10 + P.r() * 10) * U, (3 + P.r() * 3) * U, ang + (P.r() - 0.5) * 0.1, jit(P0.near[1], P.r, 3), 0.95)
      }
      const edge = (o: number, col: RGB, a: number) => chain(P, "pencil", [[px - uy * o, py + ux * o], [px + ux * tl - uy * o, py + uy * tl + ux * o]], 9 * U, 1.4 * U, col, a)
      edge(-tw * 0.42, P0.rimCool, 0.7)
      edge(tw * 0.45, P0.warm[1], 0.55)
      mark(P, "charcoal", px - ux * 6 * U, py - uy * 6 * U, tw * 1.3, tw * 1.1, ang, P0.near[0], 1)
      mark(P, "charcoal", px, py + RR * 0.25, RR * 0.4, tw * 0.6, Math.PI / 2, P0.near[0], 1)
      commit(B.front, "charcoal")
      sc.restore()
    }
    chain(P, "pencil", meridPts(ms - sw, 0.015), 8 * U, 1.8 * U, P0.near[1], 0.8)
    chain(P, "pencil", meridPts(ms + sw, 0.015), 8 * U, 1.8 * U, P0.near[1], 0.8)
    chain(P, "pencil", meridPts(ms + sw + 0.07, 0.03), 8 * U, 1.4 * U, P0.dome[3], 0.6)
    commit(B.front, "pastel")
    {
      const pts: [number, number][] = []
      for (let a = Math.PI * 1.02; a <= TAU * 0.995; a += Math.PI / 60) pts.push([cx + Math.cos(a) * RR, yc + Math.sin(a) * RR])
      chain(P, "pencil", pts, 10 * U, 1.8 * U, (_i, f) => (f < 0.45 ? P0.dome[4] : P0.near[1]), (f) => (n1(f * 16, s + 404) > 0.3 ? (f < 0.45 ? 0.55 : 0.7) : 0), 0.25)
      chain(P, "pencil", [[cx - RR * 1.01, top(cx - Rd) + 1 * U], [cx + RR * 1.01, top(cx + Rd) + 1 * U]], 10 * U, 1.5 * U, P0.near[2], 0.5)
      chain(P, "pencil", [[cx + 2 * U, yc - RR + 1 * U], [cx + 3 * U, yc - RR - Rd * 0.36]], 6 * U, 1.5 * U, P0.dome[2], 0.8)
      chain(P, "pencil", [[cx - 3 * U, yc - RR - Rd * 0.25], [cx + 8 * U, yc - RR - Rd * 0.27]], 5 * U, 1.2 * U, P0.dome[2], 0.6)
      commit(B.front, "pastel")
    }
    {
      const x0 = cx - Rd * 1.08
      for (let i = 0; i < 6; i++) {
        const x = x0 - i * Rd * 0.16
        chain(P, "pencil", [[x, by + 1 * U], [x + 0.3 * U, by - Rd * 0.22]], 5 * U, 1.3 * U, P0.dome[2], 0.6)
      }
      chain(P, "pencil", [[x0 + 2 * U, by - Rd * 0.21], [x0 - 5 * Rd * 0.16 - 2 * U, by - Rd * 0.2]], 8 * U, 1.3 * U, P0.dome[2], 0.55)
      chain(P, "pencil", [[x0 + 2 * U, by - Rd * 0.11], [x0 - 5 * Rd * 0.16 - 2 * U, by - Rd * 0.1]], 8 * U, 1.1 * U, P0.dome[1], 0.5)
      commit(B.front, "pastel")
    }
  }
  paper.width = 0
  paper.height = 0
  yield

  /* ---------- arrivals: valley lamps that come on one by one (live layer) ---------- */
  if (R.lights > 0) {
    const r = rng(s * 17 + 9)
    const nA = 9
    for (let i = 0; i < nA; i++) {
      let p: [number, number] | null = null
      for (let tries = 0; tries < 30 && !p; tries++) p = lightAt(r)
      if (!p) continue
      const dz = depthAt(p[0], p[1])
      const d = (2.6 + 3 * dz) * U
      const S = d * 7
      const cs = Math.max(4, Math.ceil(S * k))
      const spr = mk(cs, cs)
      const sp = ctx2(spr)
      const PP: Painter = { c: sp, k, r: rng(s * 5 + i), bb: [0, 0, 0, 0], q: 1, dens: 1 }
      lampMark(PP, S / 2, S / 2, d, P0.lights[i % 3 === 2 ? 2 : 1], true)
      B.arrivals.push({ x: p[0], y: p[1], s: S, t0: 2.5 + i * 3.4 + r() * 1.2, spr })
    }
  }
}

const CACHE = new Map<string, Bake>()
function getBake(w: number, h: number, k: number, R: Resolved) {
  const kk = Math.min(k, 4096 / Math.max(w, h))
  const key = [Math.round(w), Math.round(h), kk.toFixed(3), R.seed, R.palette, R.density, R.tooth, R.stars, R.comet, R.lights].join("|")
  let b = CACHE.get(key)
  if (!b) {
    b = makeBake(w, h, kk, R)
    CACHE.set(key, b)
    if (CACHE.size > 3) {
      for (const [kq, v] of CACHE) {
        if (v !== b) { CACHE.delete(kq); break }
      }
    }
  } else {
    CACHE.delete(key)
    CACHE.set(key, b)
  }
  return b
}

/* -------------------------------------------------------------------------- */
/*                                  A frame                                   */
/* -------------------------------------------------------------------------- */

const easeIn = (x: number) => x * x * (3 - 2 * x)

function paintFrame(c: Ctx, B: Bake, t: number) {
  const { w, h } = B
  const U = Math.min(w, h) / 1080
  const tt = ((t % LOOP) + LOOP) % LOOP
  c.save()
  c.globalAlpha = 1
  c.globalCompositeOperation = "source-over"
  c.drawImage(B.back, 0, 0, w, h)
  // lamps arriving in the valley, one by one; all go out together just before the loop repeats
  const out = 1 - easeIn(clamp((tt - 36.5) / 3, 0, 1))
  for (const a of B.arrivals) {
    const on = easeIn(clamp((tt - a.t0) / 1.4, 0, 1)) * out
    if (on <= 0.01) continue
    c.globalAlpha = on
    c.drawImage(a.spr, a.x - a.s / 2, a.y - a.s / 2, a.s, a.s)
  }
  c.globalAlpha = 1
  // the cloud bank drifts a few pixels and back over the loop (at most ~1.3 px/s)
  const dx = Math.sin((tt / LOOP) * TAU) * 8 * U
  const pw = B.pad / B.k
  c.drawImage(B.clouds, -pw + dx, 0, w + pw * 2, h)
  c.drawImage(B.front, 0, 0, w, h)
  if (B.done) {
    c.globalCompositeOperation = "multiply"
    c.drawImage(B.shade, 0, 0, w, h)
  }
  c.restore()
}

/**
 * Paint one frame at exactly `t` seconds (0 to 40, then it repeats) into a w by h artboard.
 * Pure: the same arguments always give the same picture. Bakes the drawing at the context's scale on first use.
 */
export function draw(ctx: Ctx, w: number, h: number, t: number, values: Values = {}) {
  const R = resolve(values)
  const m = ctx.getTransform()
  const k = Math.max(0.05, Math.hypot(m.a, m.b) || 1)
  const B = getBake(w, h, k, R)
  while (!B.done) B.step()
  paintFrame(ctx, B, t)
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

export function ChalkObservatory(props: ChalkObservatoryProps) {
  const {
    speed = 1, paused = false, values, seed, size, time, canvasRef,
    palette, density, tooth, stars, comet, lights,
    label = "A mountain observatory with its dome open under a crowded night sky, a comet overhead and a valley of small lights below, drawn in chalk and pastel on dark paper",
    className,
  } = props
  const R = React.useMemo(
    () => resolve(values, { palette, density, tooth, stars, comet, lights, seed }),
    [values, palette, density, tooth, stars, comet, lights, seed],
  )
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const cv = React.useRef<HTMLCanvasElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const clock = React.useRef(8)
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
    let visible = true
    let rt = 0
    let lastBake: Bake | null = null

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

    const frameTime = () => {
      const lv = live.current
      if (lv.time != null) return lv.time
      if (lv.reduced) return STILL_T
      return clock.current
    }

    // Bake in slices across frames so the block-in shows at once and the detail arrives after.
    const work = () => {
      fit()
      const B = getBake(canvas.width, canvas.height, 1, live.current.R)
      lastBake = B
      const t0 = performance.now()
      while (!B.done && performance.now() - t0 < 24) B.step()
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.clearRect(0, 0, canvas.width, canvas.height)
      paintFrame(c, B, frameTime())
      return B.done
    }

    const animating = () => visible && !document.hidden && !live.current.paused && !live.current.reduced && live.current.time == null
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      if (animating() && lastBake?.done) clock.current = (clock.current + dt * live.current.speed) % LOOP
      const done = work()
      if (!done || animating()) raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (raf) return
      if (!visible || document.hidden) return
      last = 0
      raf = requestAnimationFrame(tick)
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
      rt = window.setTimeout(kick, 160)
    })
    ro.observe(box)
    // first paint right away, even before any animation frame
    work()
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
    <div className={["co", className].filter(Boolean).join(" ")}>
      <style href="chalk-observatory" precedence="default">{CSS}</style>
      <div
        ref={stage}
        className="co-stage"
        role="img"
        aria-label={label}
        style={size ? { aspectRatio: `${size.w} / ${size.h}` } : undefined}
      >
        <canvas ref={setRefs} className="co-cv" aria-hidden="true" />
      </div>
    </div>
  )
}

export default ChalkObservatory
