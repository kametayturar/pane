"use client"

import * as React from "react"

import type { StudioPieceProps, Values } from "@/studio/schema"
import { rng } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export const LIGHT_FORMS = ["moth", "orchid", "fern"] as const
export type LightFormKind = (typeof LIGHT_FORMS)[number]
export type LightFormPalette = "pearl" | "ember" | "glacier" | "mono" | "custom"

export type LightFormCaption = { title: string; note: string }

export type LightFormProps = StudioPieceProps & {
  /** Which form is shown. Setting it makes the piece controlled and turns the built-in tour off. */
  form?: LightFormKind
  /** The form to start on when uncontrolled. Default "moth". */
  defaultForm?: LightFormKind
  /** Called when the person picks another form. */
  onFormChange?: (form: LightFormKind) => void
  /** Called when a ripple of light is sent through the form (by the person, not by the built-in tour). */
  onRipple?: (form: LightFormKind) => void
  /** Roughly how many strands the form is drawn from, 120–700. Default 460. */
  strands?: number
  /** Strength of the red and blue fringe on the outer edge, 0–2. Default 1. */
  fringe?: number
  /** Colour set. `accent` turns it into "custom" with the accent as the outer fringe. Default "pearl". */
  palette?: LightFormPalette
  /** Replace the title and the line under it, per form. */
  captions?: Partial<Record<LightFormKind, Partial<LightFormCaption>>>
  /** Accessible name of the form buttons group. */
  groupLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lfm {
  --lfm-ink: #000;
  --lfm-surface: #fff;
  --lfm-accent: #0060e2;
  --lfm-t1: color-mix(in oklab, var(--lfm-ink) 88%, transparent);
  --lfm-t2: color-mix(in oklab, var(--lfm-ink) 61%, transparent);
  --lfm-t3: color-mix(in oklab, var(--lfm-ink) 45%, transparent);
  --lfm-fill: color-mix(in oklab, var(--lfm-ink) 6%, transparent);
  --lfm-line: color-mix(in oklab, var(--lfm-ink) 7%, transparent);
  --lfm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --lfm-ease: cubic-bezier(.22, 1, .36, 1);
  --lfm-mono: 0;
  position: relative; container-type: inline-size; width: 100%; max-width: 480px;
  font: 13px/20px var(--lfm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lfm-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .lfm {
  --lfm-ink: #fff;
  --lfm-surface: #1c1c1e;
  --lfm-accent: #4d8dff;
  --lfm-t1: color-mix(in oklab, var(--lfm-ink) 90%, transparent);
  --lfm-t2: color-mix(in oklab, var(--lfm-ink) 62%, transparent);
  --lfm-t3: color-mix(in oklab, var(--lfm-ink) 46%, transparent);
  --lfm-fill: color-mix(in oklab, var(--lfm-ink) 8%, transparent);
  --lfm-line: color-mix(in oklab, var(--lfm-ink) 9%, transparent);
  --lfm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .lfm {
  --lfm-ink: #000; --lfm-surface: #fff; --lfm-accent: #111; --lfm-shadow: 0 0 0 1px rgb(0 0 0 / .14); --lfm-mono: 1;
  --lfm-ease: cubic-bezier(.2, .9, .1, 1); --lfm-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .lfm { --lfm-ink: #fff; --lfm-surface: #0a0a0a; --lfm-accent: #f2f2f2; --lfm-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .lfm {
  --lfm-ink: var(--pane-ink); --lfm-surface: var(--pane-solid); --lfm-accent: var(--pane-accent); --lfm-shadow: var(--pane-shadow);
  --lfm-ease: var(--pane-ease); --lfm-font: var(--pane-font);
  --lfm-t1: var(--pane-t1); --lfm-t2: var(--pane-t2); --lfm-t3: var(--pane-t3);
}
html[data-style="glass"] .lfm-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .lfm-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .lfm-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .lfm-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.lfm *, .lfm *::before, .lfm *::after { box-sizing: border-box }
:where(.lfm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.lfm) p, :where(.lfm) h3 { margin: 0; font-weight: inherit }
.lfm button:focus-visible { outline: 2px solid var(--lfm-accent); outline-offset: 2px }
.lfm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.lfm-card { border-radius: 24px; background: var(--lfm-surface); box-shadow: var(--lfm-shadow); padding: 8px 8px 0; overflow: hidden }
html[data-style="mono"] .lfm-card { border-radius: 6px }

/* The stage is one button: pressing the form sends a ripple through it. The ground is always near-black. */
.lfm-stage { position: relative; display: block; width: 100%; aspect-ratio: 1 / 1.08; border-radius: 17px; overflow: hidden; background: #050507; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
html[data-style="mono"] .lfm-stage { border-radius: 2px }
.lfm-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; animation: lfm-in .9s var(--lfm-ease) both }
.lfm-stage:focus-visible { outline: 2px solid var(--lfm-accent); outline-offset: 2px }
.lfm-idx { position: absolute; left: 16px; top: 14px; font: 500 12px/16px var(--lfm-mono-font, ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace); letter-spacing: .04em; color: rgb(255 255 255 / .46); pointer-events: none }
.lfm-hint { position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 12px; line-height: 16px; letter-spacing: .01em; color: rgb(255 255 255 / .46); pointer-events: none; transition: opacity .5s var(--lfm-ease) }
.lfm[data-touched] .lfm-hint { opacity: 0 }
@container (min-width: 640px) { .lfm-stage { aspect-ratio: 16 / 10 } }
@keyframes lfm-in { from { opacity: 0 } to { opacity: 1 } }

/* Caption: title and note on the left, three form buttons on the right (stacked under 420px). */
.lfm-cap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 16px 12px 16px }
@container (min-width: 420px) { .lfm-cap { grid-template-columns: minmax(0, 1fr) auto; align-items: end; padding: 16px 14px 16px } }
.lfm-title { font-size: 17px; line-height: 22px; font-weight: 500; letter-spacing: -.01em; color: var(--lfm-t1) }
.lfm-note { margin-top: 2px; color: var(--lfm-t2); text-wrap: pretty; max-width: 34ch }

.lfm-seg { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); padding: 3px; border-radius: 11px; background: var(--lfm-fill); width: 100%; min-width: 0 }
@container (min-width: 420px) { .lfm-seg { width: 216px } }
html[data-style="mono"] .lfm-seg { border-radius: 4px }
.lfm-thumb { position: absolute; left: 3px; top: 3px; bottom: 3px; width: calc((100% - 6px) / 3); border-radius: 8px; background: var(--lfm-surface); box-shadow: 0 0 0 .5px var(--lfm-line), 0 1px 2px rgb(0 0 0 / .1); transform: translateX(calc(var(--lfm-i, 0) * 100%)); transition: transform .42s var(--lfm-ease) }
html[data-style="mono"] .lfm-thumb { border-radius: 2px }
.lfm-opt { position: relative; z-index: 1; height: 32px; border-radius: 8px; font-weight: 500; color: var(--lfm-t3); transition: color .2s var(--lfm-ease), transform .16s var(--lfm-ease) }
.lfm-opt:active { transform: scale(.97) }
.lfm-opt[aria-checked="true"] { color: var(--lfm-t1) }
@media (hover: hover) { .lfm-opt:hover { color: var(--lfm-t1) } }

@media (prefers-reduced-motion: reduce) {
  .lfm *, .lfm *::before, .lfm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Geometry                                 */
/* -------------------------------------------------------------------------- */

type Pt = [number, number]
type Strand = { o: number; n: number; rc0: number; rc1: number; w: number; wm: number; dir: number; ph: number; k: number; an: number }
type Built = { pts: Float32Array; strands: Strand[]; maxN: number }

/** Seconds in one seamless loop: every moving part is periodic in t / LOOP. */
export const LIGHT_FORM_LOOP = 8
const TAU = Math.PI * 2
const CHUNKS = 4

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

/** Catmull-Rom through hand-placed points: the silhouette of a wing or a petal as one smooth curve. */
function spline(P: Pt[], k: number): Pt {
  const n = P.length - 1
  const f = clamp(k, 0, 0.99999) * n
  const i = Math.floor(f)
  const u = f - i
  const p0 = P[Math.max(i - 1, 0)]
  const p1 = P[i]
  const p2 = P[i + 1]
  const p3 = P[Math.min(i + 2, n)]
  const u2 = u * u
  const u3 = u2 * u
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u2 + (-a + 3 * b - 3 * c2 + d) * u3)
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]
}

class Builder {
  pts: number[] = []
  strands: Strand[] = []
  /** Add a strand as a polyline. `wm` says how much the breathing moves it, `dir` which way it leans open. */
  add(poly: Pt[], R: () => number, wm: number, dir: number, w = 1, an = 0) {
    const o = this.pts.length / 2
    let sx = 0
    for (const p of poly) {
      this.pts.push(p[0], p[1])
    }
    const a = poly[0]
    const b = poly[poly.length - 1]
    sx = Math.hypot(a[0], a[1])
    this.strands.push({ o, n: poly.length, rc0: sx, rc1: Math.hypot(b[0], b[1]), w, wm, dir, ph: R() * TAU, k: 1 + Math.floor(R() * 3), an })
  }
  /** Mirror everything added since `from` across the vertical axis. */
  mirror(from: number, R: () => number) {
    const end = this.strands.length
    for (let i = from; i < end; i++) {
      const s = this.strands[i]
      const poly: Pt[] = []
      for (let j = 0; j < s.n; j++) poly.push([-this.pts[(s.o + j) * 2], this.pts[(s.o + j) * 2 + 1]])
      this.add(poly, R, s.wm, -s.dir, s.w, s.an)
      const m = this.strands[this.strands.length - 1]
      m.rc0 = s.rc0
      m.rc1 = s.rc1
    }
  }
}

function bez(a: Pt, b: Pt, c: Pt, d: Pt, n: number): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    const v = 1 - u
    const w0 = v * v * v
    const w1 = 3 * v * v * u
    const w2 = 3 * v * u * u
    const w3 = u * u * u
    out.push([w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1]])
  }
  return out
}

/** A fan of silk threads from one root to a silhouette, plus partial contour arcs inside it. */
function fan(
  B: Builder, R: () => number, root: Pt, outline: (k: number) => Pt, veins: number, arcs: number,
  opts: { wm: number; dir: number; bow?: number; n?: number; kMin?: number; kMax?: number; rootJ?: number },
) {
  const n = opts.n ?? 24
  const bowAmt = opts.bow ?? 0.34
  const k0 = opts.kMin ?? 0
  const k1 = opts.kMax ?? 1
  const rj = opts.rootJ ?? 0.04
  for (let j = 0; j < veins; j++) {
    const k = k0 + ((j + R() * 0.85) / veins) * (k1 - k0)
    const o = outline(k)
    const p0: Pt = [root[0] + (R() - 0.5) * rj, root[1] + (R() - 0.5) * rj]
    const dx = o[0] - p0[0]
    const dy = o[1] - p0[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const bow = ((R() - 0.5) * bowAmt + 0.1 * (k - 0.5)) * len
    const p1: Pt = [p0[0] + dx * 0.32 + nx * bow, p0[1] + dy * 0.32 + ny * bow]
    const p2: Pt = [p0[0] + dx * 0.7 + nx * bow * 0.55, p0[1] + dy * 0.7 + ny * bow * 0.55]
    B.add(bez(p0, p1, p2, o, n), R, opts.wm, opts.dir, 0.7 + R() * 0.4)
  }
  for (let j = 0; j < arcs; j++) {
    const sc = 0.3 + 0.7 * Math.sqrt(R())
    const ka = k0 + R() * (k1 - k0) * 0.6
    const kb = Math.min(k1, ka + (k1 - k0) * (0.28 + 0.34 * R()))
    const poly: Pt[] = []
    const m = 30
    for (let i = 0; i < m; i++) {
      const o = outline(ka + ((kb - ka) * i) / (m - 1))
      poly.push([root[0] + (o[0] - root[0]) * sc, root[1] + (o[1] - root[1]) * sc])
    }
    B.add(poly, R, opts.wm, opts.dir, 0.55 + R() * 0.45)
  }
}

/** A teardrop outline in a petal's own frame: base at 0, tip at k = .5, going round and back. */
function petal(base: Pt, ang: number, L: number, W: number, lead = 0.5, frill = 0, ph = 0) {
  const ax: Pt = [Math.sin(ang), -Math.cos(ang)]
  const rt: Pt = [Math.cos(ang), Math.sin(ang)]
  return (k: number): Pt => {
    const t = k * TAU
    let ly = Math.pow(Math.max(0, 0.5 - 0.5 * Math.cos(t)), lead + 0.3)
    let lx = Math.sin(t) * Math.pow(Math.max(0, Math.sin(t / 2)), 0.72) * 0.78
    if (frill) lx *= 1 + frill * Math.sin(k * TAU * 7 + ph) * smoothstep(0.1, 0.4, Math.min(k, 1 - k))
    ly *= L
    lx *= W * 2
    return [base[0] + rt[0] * lx + ax[0] * ly, base[1] + rt[1] * lx + ax[1] * ly]
  }
}

function buildMoth(S: number, R: () => number): Builder {
  const B = new Builder()
  const side = Math.max(40, Math.round((S - 70) / 2))
  const start = B.strands.length
  // Forewing: a broad delta held back like a tent: leading edge to a sharp apex, a long slanting outer margin, a short inner margin.
  const fore: Pt[] = [[0.08, -0.24], [0.4, -0.25], [0.7, -0.17], [0.97, -0.04], [0.92, 0.2], [0.74, 0.44], [0.48, 0.66], [0.22, 0.8], [0.08, 0.72]]
  // Hindwing: only a narrow fringe showing past the rear of the forewing.
  const hind: Pt[] = [[0.06, 0.3], [0.3, 0.46], [0.5, 0.72], [0.4, 0.9], [0.2, 0.94], [0.07, 0.8]]
  fan(B, R, [0.06, -0.14], (k) => spline(fore, k), Math.round(side * 0.5), Math.round(side * 0.26), { wm: 1, dir: 1, bow: 0.2 })
  fan(B, R, [0.06, 0.2], (k) => spline(hind, k), Math.round(side * 0.1), Math.round(side * 0.06), { wm: 1, dir: 1, bow: 0.3 })
  // Feathered antenna: a short curved stem with barbs on both sides, like a comb.
  const stem = bez([0.03, -0.44], [0.06, -0.55], [0.14, -0.64], [0.24, -0.7], 12)
  B.add(stem, R, 0.2, 1, 1)
  for (let i = 2; i < 12; i += 1) {
    const [px, py] = stem[i]
    const [qx, qy] = stem[i + 1] ?? stem[i]
    const tl = Math.hypot(qx - px, qy - py) || 1
    const tx = (qx - px) / tl
    const ty = (qy - py) / tl
    const bl = 0.075 * (1 - Math.abs(i - 6) / 8)
    for (const sd of [-1, 1]) {
      const ex = px + (-ty * sd * 0.8 + tx * 0.6) * bl
      const ey = py + (tx * sd * 0.8 + ty * 0.6) * bl
      B.add([[px, py], [(px + ex) / 2, (py + ey) / 2 - 0.004], [ex, ey]], R, 0.2, 1, 0.55)
    }
  }
  B.mirror(start, R)
  // Body: a fat furred lens of long threads, then a few short tufts across the thorax.
  for (let i = 0; i < 34; i++) {
    const a = (i / 33 - 0.5) * 2
    const wd = 0.085 * a + (R() - 0.5) * 0.008
    const l = 0.014 * (R() - 0.5)
    B.add(bez([l, -0.42 + R() * 0.02], [wd * 1.7, -0.2], [wd * 1.5, 0.3], [l, 0.68 + R() * 0.04], 16), R, 0, 0, 0.9 + R() * 0.3)
  }
  for (let i = 0; i < 14; i++) {
    const y = -0.34 + R() * 0.3
    const sd = R() < 0.5 ? -1 : 1
    const x0 = sd * (0.01 + R() * 0.03)
    B.add([[x0, y], [x0 + sd * 0.05, y - 0.012], [x0 + sd * 0.1, y - 0.004 + R() * 0.02]], R, 0, 0, 0.6)
  }
  return B
}

function buildOrchid(S: number, R: () => number): Builder {
  const B = new Builder()
  const total = S - 20
  const c: Pt = [0, 0.06]
  // Each petal: base angle, length, width, share of the strands.
  const side = (start: number) => {
    // Lateral petals (broad), lateral sepals, in that order of weight.
    const per = (share: number) => Math.max(8, Math.round((total * share) / 2))
    fan(B, R, c, petal(c, (80 * Math.PI) / 180, 0.64, 0.3, 0.25), per(0.34) * 0.62 | 0, per(0.34) * 0.38 | 0, { wm: 1, dir: 1, bow: 0.3, rootJ: 0.03 })
    fan(B, R, c, petal(c, (150 * Math.PI) / 180, 0.62, 0.14, 0.5), per(0.16) * 0.7 | 0, per(0.16) * 0.3 | 0, { wm: 1, dir: 1, bow: 0.24, rootJ: 0.03 })
    B.mirror(start, R)
  }
  const s0 = B.strands.length
  side(s0)
  // Dorsal sepal and the lip sit on the axis, so they are drawn whole.
  const mid = (share: number) => Math.max(8, Math.round(total * share))
  fan(B, R, c, petal(c, 0, 0.62, 0.15, 0.5), mid(0.12) * 0.7 | 0, mid(0.12) * 0.3 | 0, { wm: 1, dir: 0, bow: 0.24, rootJ: 0.03 })
  fan(B, R, c, petal(c, Math.PI, 0.4, 0.19, 0.6, 0.12, 1.3), mid(0.1) * 0.7 | 0, mid(0.1) * 0.3 | 0, { wm: 1, dir: 0, bow: 0.3, rootJ: 0.03 })
  // Column: a tight knot of short threads at the heart.
  for (let i = 0; i < 16; i++) {
    const a = R() * TAU
    const l = 0.05 + R() * 0.06
    B.add(bez(c, [c[0] + Math.cos(a) * l * 0.4, c[1] + Math.sin(a) * l * 0.4 - 0.01], [c[0] + Math.cos(a + 0.5) * l * 0.8, c[1] + Math.sin(a + 0.5) * l * 0.8], [c[0] + Math.cos(a + 0.8) * l, c[1] + Math.sin(a + 0.8) * l - 0.02], 8), R, 0.2, 0, 1.1)
  }
  return B
}

function buildFern(S: number, R: () => number): Builder {
  const B = new Builder()
  // Rachis: an arc that ends in a curl.
  const a: Pt = [-0.32, 0.98]
  const b: Pt = [-0.36, 0.42]
  const c: Pt = [-0.2, -0.22]
  const d: Pt = [0.1, -0.6]
  const N = 150
  const arc = bez(a, b, c, d, 100)
  const tipT: Pt = [arc[99][0] - arc[96][0], arc[99][1] - arc[96][1]]
  const tl = Math.hypot(tipT[0], tipT[1])
  const T0: Pt = [tipT[0] / tl, tipT[1] / tl]
  const r0 = 0.15
  const ctr: Pt = [d[0] - T0[1] * r0, d[1] + T0[0] * r0]
  const phi0 = Math.atan2(d[1] - ctr[1], d[0] - ctr[0])
  let dirSp = 1
  if (-Math.sin(phi0) * T0[0] + Math.cos(phi0) * T0[1] < 0) dirSp = -1
  const rach: Pt[] = arc.slice()
  for (let i = 1; i <= 50; i++) {
    const u = i / 50
    const r = r0 * Math.pow(1 - u, 0.85) + 0.008
    const ang = phi0 + dirSp * u * TAU * 1.22
    rach.push([ctr[0] + Math.cos(ang) * r, ctr[1] + Math.sin(ang) * r])
  }
  const M = rach.length - 1
  const at = (s: number): [Pt, Pt] => {
    const f = clamp(s, 0, 1) * M
    const i = Math.min(Math.floor(f), M - 1)
    const u = f - i
    const p: Pt = [rach[i][0] + (rach[i + 1][0] - rach[i][0]) * u, rach[i][1] + (rach[i + 1][1] - rach[i][1]) * u]
    const tx = rach[i + 1][0] - rach[i][0]
    const ty = rach[i + 1][1] - rach[i][1]
    const l = Math.hypot(tx, ty) || 1
    return [p, [tx / l, ty / l]]
  }
  const addAnchored = (poly: Pt[], s: number, w: number, wm: number, dir: number) => {
    B.add(poly, R, wm, dir, w, s)
    const st = B.strands[B.strands.length - 1]
    st.rc0 = s
    st.rc1 = s + 0.06
  }
  // Rachis: a handful of near-parallel threads.
  for (let i = 0; i < 7; i++) {
    const off = (i - 3) * 0.0042
    const poly: Pt[] = []
    for (let j = 0; j <= N - 1; j += 1) {
      const idx = Math.min(M, Math.round((j / (N - 1)) * M))
      const [p, t] = at(idx / M)
      const wob = off * (1 - 0.7 * (idx / M))
      poly.push([p[0] - t[1] * wob, p[1] + t[0] * wob])
    }
    const s = poly.length
    B.add(poly.slice(0, s), R, 1, 0, 1.15, 0)
    const st = B.strands[B.strands.length - 1]
    st.rc0 = 0
    st.rc1 = 1
    st.an = 0
  }
  const per = Math.max(8, Math.round((S - 30) / 19))
  for (let i = 0; i < per; i++) {
    const s = 0.05 + (i / per) * 0.88 + R() * 0.004
    const [p, t] = at(s)
    const len = 0.46 * Math.pow(1 - s, 0.62) * smoothstep(0, 0.1, s) + 0.02
    for (const sd of [-1, 1] as const) {
      const nrm: Pt = [-t[1] * sd, t[0] * sd]
      const al = 0.2 + 0.28 * s + (R() - 0.5) * 0.08
      const dv: Pt = [nrm[0] * Math.cos(al) + t[0] * Math.sin(al), nrm[1] * Math.cos(al) + t[1] * Math.sin(al)]
      const l = len * (0.94 + R() * 0.12)
      const lf = (k: number): Pt => {
        const q = k * TAU
        const ly = Math.pow(Math.max(0, 0.5 - 0.5 * Math.cos(q)), 0.8) * l
        const lx = Math.sin(q) * Math.pow(Math.max(0, Math.sin(q / 2)), 0.7) * 0.78 * l * 0.24
        const bend = 0.16 * (ly / l) * (ly / l) * l
        // The leaflet curls a little toward the tip of the frond.
        return [p[0] + dv[0] * ly + -dv[1] * lx + t[0] * bend, p[1] + dv[1] * ly + dv[0] * lx + t[1] * bend]
      }
      const cont: Pt[] = []
      for (let q = 0; q <= 24; q++) cont.push(lf(q / 24))
      addAnchored(cont, s, 0.95, 1, sd)
      for (let v = 0; v < 6; v++) {
        const k = 0.1 + (v / 5) * 0.8 + (R() - 0.5) * 0.04
        const o = lf(sd > 0 ? k : 1 - k)
        const mx: Pt = [(p[0] + o[0]) / 2 + (R() - 0.5) * 0.012, (p[1] + o[1]) / 2 + (R() - 0.5) * 0.012]
        addAnchored(bez(p, [p[0] + (mx[0] - p[0]) * 0.8, p[1] + (mx[1] - p[1]) * 0.8], mx, o, 9), s, 0.7 + R() * 0.4, 1, sd)
      }
      addAnchored(bez(p, [p[0] + dv[0] * l * 0.35, p[1] + dv[1] * l * 0.35], [p[0] + dv[0] * l * 0.7 + t[0] * l * 0.05, p[1] + dv[1] * l * 0.7 + t[1] * l * 0.05], lf(0.5), 9), s, 1.05, 1, sd)
    }
  }
  return B
}

const CACHE = new Map<string, Built>()

/** Build once per (form, seed, strands): hundreds of polylines in one typed array, centred and fitted to ±1. */
function build(form: LightFormKind, seed: number, strands: number): Built {
  const key = `${form}|${seed}|${strands}`
  const hit = CACHE.get(key)
  if (hit) return hit
  const R = rng(seed * 7919 + (form === "moth" ? 1 : form === "orchid" ? 2 : 3))
  const S = clamp(Math.round(strands), 80, 900)
  const B = form === "moth" ? buildMoth(S, R) : form === "orchid" ? buildOrchid(S, R) : buildFern(S, R)
  const src = B.pts
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (let i = 0; i < src.length; i += 2) {
    x0 = Math.min(x0, src[i])
    x1 = Math.max(x1, src[i])
    y0 = Math.min(y0, src[i + 1])
    y1 = Math.max(y1, src[i + 1])
  }
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const sc = 1 / Math.max((x1 - x0) / 2, (y1 - y0) / 2)
  const pts = new Float32Array(src.length)
  for (let i = 0; i < src.length; i += 2) {
    pts[i] = (src[i] - cx) * sc
    pts[i + 1] = (src[i + 1] - cy) * sc
  }
  let maxRc = 0
  let maxN = 0
  if (form === "fern") {
    for (const s of B.strands) maxRc = Math.max(maxRc, s.rc1)
  } else {
    for (const s of B.strands) {
      // Radius from the centre, in fitted coordinates.
      s.rc0 = Math.hypot(pts[s.o * 2], pts[s.o * 2 + 1])
      s.rc1 = Math.hypot(pts[(s.o + s.n - 1) * 2], pts[(s.o + s.n - 1) * 2 + 1])
      maxRc = Math.max(maxRc, s.rc0, s.rc1)
    }
  }
  for (const s of B.strands) {
    s.rc0 /= maxRc
    s.rc1 /= maxRc
    maxN = Math.max(maxN, s.n)
  }
  const out = { pts, strands: B.strands, maxN }
  if (CACHE.size > 9) CACHE.clear()
  CACHE.set(key, out)
  return out
}

/** How many strands a form is drawn from. */
export function lightFormStrandCount(form: LightFormKind, seed = 7, strands = 460) {
  return build(form, seed, strands).strands.length
}

/* -------------------------------------------------------------------------- */
/*                                   Palettes                                 */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number]
type Ink = { outer: RGB; core: RGB; inner: RGB; fringe: number }

const PALETTES: Record<Exclude<LightFormPalette, "custom">, Ink> = {
  pearl: { outer: [255, 92, 124], core: [246, 246, 255], inner: [86, 132, 255], fringe: 1 },
  ember: { outer: [255, 128, 52], core: [255, 236, 206], inner: [236, 62, 120], fringe: 1 },
  glacier: { outer: [88, 236, 218], core: [232, 244, 255], inner: [128, 104, 255], fringe: 1 },
  mono: { outer: [226, 226, 230], core: [255, 255, 255], inner: [150, 150, 158], fringe: 0.5 },
}

function parseColor(c: string): RGB | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (m) {
    let h = m[1]
    if (h.length === 3) h = h.replace(/./g, "$&$&")
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  try {
    const cv = document.createElement("canvas")
    cv.width = cv.height = 1
    const x = cv.getContext("2d")
    if (!x) return null
    x.fillStyle = "#000"
    x.fillStyle = c
    x.fillRect(0, 0, 1, 1)
    const d = x.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  } catch {
    return null
  }
}

function hueTurn([r, g, b]: RGB, deg: number): RGB {
  const a = (deg * Math.PI) / 180
  const cs = Math.cos(a)
  const sn = Math.sin(a)
  const m = [
    0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928,
    0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.14, 0.072 - cs * 0.072 - sn * 0.283,
    0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072,
  ]
  const f = (v: number) => Math.round(clamp(v, 0, 255))
  return [f(m[0] * r + m[1] * g + m[2] * b), f(m[3] * r + m[4] * g + m[5] * b), f(m[6] * r + m[7] * g + m[8] * b)]
}

function resolveInk(v: Values): Ink {
  const pal = String(v.palette ?? "pearl")
  if (pal === "custom") {
    const o = parseColor(String(v.tint ?? "#ff5c7c")) ?? PALETTES.pearl.outer
    return { outer: o, core: [246, 246, 255], inner: hueTurn(o, 200), fringe: 1 }
  }
  return PALETTES[(pal in PALETTES ? pal : "pearl") as keyof typeof PALETTES]
}

/* -------------------------------------------------------------------------- */
/*                                   Drawing                                  */
/* -------------------------------------------------------------------------- */

export const LIGHT_FORM_DEFAULTS = { form: "moth", palette: "pearl", tint: "#ff5c7c", strands: 460, fringe: 1, glow: 0.5, breath: 0.6, ripple: true, grain: 0.35, seed: 7 }

const num = (x: unknown, d: number) => (typeof x === "number" && isFinite(x) ? x : d)

// Scratch memory shared by every frame so drawing allocates nothing.
let SCR = new Float32Array(0)
let ALP = new Float32Array(0)

/** Paint one form onto what is already on the canvas, additively. `_grow` and `_rp` are the live piece's own clock. */
function paintForm(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, v: Values, form: LightFormKind, mul: number, grow: number, rp: number) {
  const seed = Math.round(num(v.seed, 7))
  const B = build(form, seed, num(v.strands, 460))
  const { pts, strands } = B
  const ink = resolveInk(v)
  const fringe = num(v.fringe, 1) * ink.fringe * 0.034
  const glow = clamp(num(v.glow, 0.5), 0, 1.5)
  const breath = clamp(num(v.breath, 0.6), 0, 1)
  const R = Math.min(w, h) * 0.435
  const cx = w / 2
  const cy = h / 2 + (form === "orchid" ? 0 : 0)
  const lw = Math.max(0.55, Math.min(w, h) / 1080 * 1.05 + 0.25)
  const loop = LIGHT_FORM_LOOP
  // a: how far the form has folded in, 0 = fully open at t = 0 and t = loop.
  const a = breath * (0.5 - 0.5 * Math.cos((TAU * t) / loop))
  const dens = Math.pow(460 / Math.max(120, strands.length), 0.55)
  const baseA = 0.3 * dens * mul

  if (SCR.length < pts.length) SCR = new Float32Array(pts.length)
  if (ALP.length < strands.length * CHUNKS) ALP = new Float32Array(strands.length * CHUNKS)
  const front = -0.18 + 1.36 * rp
  const rippleOn = rp >= 0 && rp <= 1
  const rampFade = rippleOn ? Math.sin(Math.PI * rp) ** 0.6 : 0
  const sway = 0.0055

  for (let si = 0; si < strands.length; si++) {
    const s = strands[si]
    const wf = 1 / (s.n - 1)
    // Draw-on: strands near the centre start first and reach out.
    const gs = grow >= 1 ? 1 : clamp((grow - 0.5 * ((s.rc0 + s.rc1) / 2)) / 0.5)
    const om = TAU * s.k * t / loop + s.ph
    const swx = Math.cos(s.ph * 3.1) * sway * Math.sin(om)
    const swy = Math.sin(s.ph * 2.3) * sway * Math.sin(om + 1.3)
    for (let j = 0; j < s.n; j++) {
      let x = pts[(s.o + j) * 2]
      let y = pts[(s.o + j) * 2 + 1]
      const u = j * wf
      if (form === "moth") {
        const k = 1 - 0.34 * a * s.wm
        y -= 0.2 * a * s.wm * Math.abs(x) * (0.4 + 0.6 * (1 - Math.abs(y)))
        x *= k
      } else if (form === "orchid") {
        const sc = 1 - 0.075 * a * s.wm
        const th = 0.1 * a * s.wm * s.dir
        const cs = Math.cos(th)
        const sn = Math.sin(th)
        const rx = x * cs - y * sn
        const ry = x * sn + y * cs
        x = rx * sc
        y = ry * sc
      } else {
        const th = 0.34 * (a - 0.5 * breath) * Math.pow(s.an, 1.25) * s.wm
        const bx = -0.45
        const by = 1
        const dx = x - bx
        const dy = y - by
        const cs = Math.cos(th)
        const sn = Math.sin(th)
        x = bx + dx * cs - dy * sn
        y = by + dx * sn + dy * cs
      }
      SCR[(s.o + j) * 2] = x + swx * (0.4 + u)
      SCR[(s.o + j) * 2 + 1] = y + swy * (0.4 + u)
    }
    for (let c = 0; c < CHUNKS; c++) {
      const u0 = c / CHUNKS
      const um = (c + 0.5) / CHUNKS
      if (u0 >= gs) {
        ALP[si * CHUNKS + c] = 0
        continue
      }
      const env = smoothstep(0, 0.14, um) * (1 - 0.62 * smoothstep(0.5, 1, um))
      const rcAt = s.rc0 + (s.rc1 - s.rc0) * um
      let boost = 1
      if (rippleOn) {
        const d = rcAt - front
        const q = d < 0 ? d / 0.2 : d / 0.06
        boost += 2.6 * Math.exp(-q * q) * rampFade
      }
      ALP[si * CHUNKS + c] = baseA * s.w * env * boost * (0.94 + 0.06 * Math.sin(om))
    }
  }

  const passes: { col: RGB; sc: number; lw: number; am: number }[] = [
    { col: ink.inner, sc: 1 - fringe, lw: 1, am: 1 },
    { col: ink.core, sc: 1, lw: 1, am: 1 },
    { col: ink.outer, sc: 1 + fringe, lw: 1, am: 1 },
  ]
  if (glow > 0.01) passes.push({ col: ink.core, sc: 1, lw: 4.6, am: glow * 0.2 })
  ctx.globalCompositeOperation = "lighter"
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  for (const ps of passes) {
    ctx.strokeStyle = `rgb(${ps.col[0]} ${ps.col[1]} ${ps.col[2]})`
    ctx.lineWidth = lw * ps.lw
    for (let si = 0; si < strands.length; si++) {
      const s = strands[si]
      const gs = grow >= 1 ? 1 : clamp((grow - 0.5 * ((s.rc0 + s.rc1) / 2)) / 0.5)
      const segs = s.n - 1
      for (let c = 0; c < CHUNKS; c++) {
        const al = ALP[si * CHUNKS + c] * ps.am
        if (al < 0.004) continue
        const j0 = Math.floor((c * segs) / CHUNKS)
        let j1 = Math.ceil(((c + 1) * segs) / CHUNKS)
        if (gs < 1) j1 = Math.min(j1, Math.max(j0 + 1, Math.floor(gs * segs)))
        ctx.globalAlpha = Math.min(1, al)
        ctx.beginPath()
        for (let j = j0; j <= j1; j++) {
          const px = cx + SCR[(s.o + j) * 2] * ps.sc * R
          const py = cy + SCR[(s.o + j) * 2 + 1] * ps.sc * R
          if (j === j0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"
}

let GRAIN: HTMLCanvasElement | OffscreenCanvas | null = null
let GRAIN_SEED = -1
function grainTile(seed: number) {
  if (GRAIN && GRAIN_SEED === seed) return GRAIN
  const S = 192
  const cv: HTMLCanvasElement | OffscreenCanvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(S, S) : Object.assign(document.createElement("canvas"), { width: S, height: S })
  const x = cv.getContext("2d") as CanvasRenderingContext2D | null
  if (!x) return null
  const img = x.createImageData(S, S)
  const R = rng(seed + 991)
  for (let i = 0; i < S * S; i++) {
    const g = R()
    const v = g > 0.5 ? 255 : 0
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = Math.abs(g - 0.5) * 2 > 0.1 ? 26 : 0
  }
  x.putImageData(img, 0, 0)
  GRAIN = cv
  GRAIN_SEED = seed
  return cv
}

/** The ground: near-black with a faint lift behind the form, and a vignette. */
function paintGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = "source-over"
  ctx.globalAlpha = 1
  ctx.fillStyle = "#050507"
  ctx.fillRect(0, 0, w, h)
  const r = Math.max(w, h) * 0.62
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r)
  g.addColorStop(0, "rgb(20 20 28)")
  g.addColorStop(0.55, "rgb(8 8 12)")
  g.addColorStop(1, "rgb(3 3 5)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/**
 * One frame of Light Form as a pure function of time and values, so the Studio can export any frame at any size.
 * `values`: form, palette, tint, strands, fringe, glow, breath, ripple, grain, seed. With no live clock the ripple
 * loops once per LIGHT_FORM_LOOP seconds and the picture is seamless.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Values = {}) {
  const v: Values = { ...LIGHT_FORM_DEFAULTS, ...values }
  const form: LightFormKind = (LIGHT_FORMS as readonly string[]).includes(String(v.form)) ? (v.form as LightFormKind) : "moth"
  paintGround(ctx, w, h)
  let rp = -1
  if (typeof v._rp === "number") rp = v._rp
  else if (v.ripple !== false) {
    const ph = (((t / LIGHT_FORM_LOOP) % 1) + 1) % 1
    const q = (ph - 0.14) / 0.62
    rp = q >= 0 && q <= 1 ? q : -1
  }
  if (typeof v._prev === "string" && (LIGHT_FORMS as readonly string[]).includes(v._prev)) {
    paintForm(ctx, w, h, t, v, v._prev as LightFormKind, clamp(num(v._prevA, 0)), 1, rp)
  }
  paintForm(ctx, w, h, t, v, form, 1, typeof v._grow === "number" ? clamp(v._grow) : 1, rp)
  const grain = clamp(num(v.grain, 0.35), 0, 1)
  if (grain > 0.01) {
    const tile = grainTile(Math.round(num(v.seed, 7)))
    const pat = tile ? ctx.createPattern(tile as CanvasImageSource, "repeat") : null
    if (pat) {
      ctx.globalCompositeOperation = "lighter"
      ctx.globalAlpha = grain * 0.5
      ctx.fillStyle = pat
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

const DEFAULT_CAPTIONS: Record<LightFormKind, LightFormCaption> = {
  moth: { title: "Moth", note: "Two tented wings and feathered antennae, spun from single threads of light." },
  orchid: { title: "Orchid", note: "Five petals and a lip, each one a fan of hairlines." },
  fern: { title: "Fern", note: "One frond unrolling, a leaflet at a time." },
}

/** Seconds into the tour at which each beat happens. The tour plays once and never returns after a touch. */
const TOUR: { at: number; do: "ripple" | LightFormKind }[] = [
  { at: 4.2, do: "ripple" },
  { at: 10.4, do: "orchid" },
  { at: 14.4, do: "ripple" },
  { at: 20.6, do: "fern" },
  { at: 24.6, do: "ripple" },
]
const RIPPLE_SECONDS = 3.4
const GROW_SECONDS = 2.3

/**
 * LightForm – a moth, an orchid or a fern drawn from a few hundred hairline strands, added together as light.
 * Where strands overlap the form is white; at its edges the red and blue channels part, which is the fringe.
 * It breathes on an eight-second loop. Press the form to send a ripple through it.
 *
 *   <LightForm />
 */
export function LightForm(props: LightFormProps) {
  const {
    form: formProp, defaultForm = "moth", onFormChange, onRipple, strands, fringe, palette, captions, groupLabel = "Form", className,
    speed = 1, paused, accent, values, seed, size, time, canvasRef,
  } = props
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const controlled = formProp !== undefined
  const [formState, setFormState] = React.useState<LightFormKind>(defaultForm)
  const form = formProp ?? formState
  const [said, setSaid] = React.useState("")
  const [touched, setTouched] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const setCv = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) Reflect.set(canvasRef, "current", el)
    },
    [canvasRef],
  )

  // Everything the loop reads lives in refs, so changing a prop never restarts it.
  const live = React.useRef({ form, values, strands, fringe, palette, accent, seed, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled })
  const eng = React.useRef({ t: 0, formAt: -99, cur: form as LightFormKind, prev: null as LightFormKind | null, rpStart: -1, demo: true, step: 0 })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { form, values, strands, fringe, palette, accent, seed, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled }
    ctl.current?.update()
  }, [form, values, strands, fringe, palette, accent, seed, speed, paused, reduced, time, controlled])

  const pick = React.useCallback(
    (f: LightFormKind, byPerson: boolean) => {
      if (byPerson) setSaid(`${(captions?.[f]?.title ?? DEFAULT_CAPTIONS[f].title)}`)
      if (!live.current.controlled) setFormState(f)
      onFormChange?.(f)
    },
    [captions, onFormChange],
  )
  const pickRef = React.useRef(pick)
  React.useEffect(() => {
    pickRef.current = pick
  }, [pick])

  const ripple = React.useCallback(
    (byPerson: boolean) => {
      const E = eng.current
      if (!live.current.reduced) E.rpStart = E.t
      if (byPerson) onRipple?.(live.current.form)
      ctl.current?.update()
    },
    [onRipple],
  )

  const stopTour = React.useCallback(() => {
    eng.current.demo = false
    setTouched(true)
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    const cv = cvRef.current
    const ctx = cv?.getContext("2d")
    if (!root || !cv || !ctx) return
    const E = eng.current
    let raf = 0
    let last = 0
    let lastDraw = 0
    let visible = true
    let dpr = 1
    let W = 0
    let H = 0
    let mono = false
    let frame = 0

    const merged = (): Values => {
      const L = live.current
      const v: Values = { ...LIGHT_FORM_DEFAULTS, ...(L.values ?? {}) }
      if (L.strands !== undefined) v.strands = L.strands
      if (L.fringe !== undefined) v.fringe = L.fringe
      if (L.seed !== undefined) v.seed = L.seed
      if (L.palette !== undefined) v.palette = L.palette
      if (L.accent) {
        v.palette = "custom"
        v.tint = L.accent
      }
      if (mono && L.palette === undefined && !L.accent && !(L.values && L.values.palette)) v.palette = "mono"
      return v
    }
    const render = () => {
      if (!W || !H) return
      const L = live.current
      const v = merged()
      v.form = L.form
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (L.time !== undefined) {
        draw(ctx, W, H, L.time, v)
        return
      }
      let t = E.t
      if (L.reduced) {
        // One meaningful still: fully open, with the ripple caught half-way along the strands.
        t = 0.4
        v._rp = 0.5
        draw(ctx, W, H, t, v)
        return
      }
      if (E.cur !== L.form) {
        E.prev = E.cur
        E.cur = L.form
        E.formAt = t
      }
      const since = t - E.formAt
      v._grow = since >= GROW_SECONDS ? 1 : 1 - Math.pow(1 - clamp(since / GROW_SECONDS), 3)
      if (E.prev) {
        const pa = 1 - clamp(since / 0.55)
        if (pa <= 0) E.prev = null
        else {
          v._prev = E.prev
          v._prevA = pa * pa
        }
      }
      let rp = -1
      if (E.rpStart >= 0) {
        rp = (t - E.rpStart) / RIPPLE_SECONDS
        if (rp > 1) {
          E.rpStart = -1
          rp = -1
        }
      }
      v._rp = rp
      draw(ctx, W, H, t, v)
    }
    const needsClock = () => {
      const L = live.current
      return L.time === undefined && !L.reduced
    }
    const shouldRun = () => visible && !live.current.paused && needsClock() && !document.hidden
    const readMono = () => {
      const m = getComputedStyle(root).getPropertyValue("--lfm-mono").trim() === "1"
      if (m !== mono) {
        mono = m
        return true
      }
      return false
    }
    const tour = () => {
      if (!E.demo) return
      while (E.step < TOUR.length && E.t >= TOUR[E.step].at) {
        const b = TOUR[E.step++]
        if (b.do === "ripple") E.rpStart = E.t
        else if (!live.current.controlled) pickRef.current(b.do, false)
      }
    }
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      E.t += dt * live.current.speed
      if (frame++ % 90 === 0) readMono()
      tour()
      if (now - lastDraw >= 22) {
        lastDraw = now
        render()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      readMono()
      if (shouldRun()) {
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
        return
      }
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      render()
    }
    ctl.current = { update }

    const ro = new ResizeObserver(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = Math.max(1, Math.round(W * dpr))
      cv.height = Math.max(1, Math.round(H * dpr))
      update()
    })
    ro.observe(cv)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(() => {
      readMono()
      update()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-style"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const cap = { ...DEFAULT_CAPTIONS[form], ...(captions?.[form] ?? {}) }
  const idx = LIGHT_FORMS.indexOf(form)
  const count = lightFormStrandCount(form, seed ?? 7, strands ?? 460)

  // Studio artboard: only the picture, filling the size it was given.
  if (size) {
    return (
      <div ref={rootRef} className={`lfm ${className ?? ""}`} style={{ width: size.w, height: size.h, maxWidth: "none" }}>
        <canvas ref={setCv} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "none" }} />
        <style href="light-form" precedence="default">{CSS}</style>
      </div>
    )
  }

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key
    if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "ArrowDown" && k !== "ArrowUp" && k !== "Home" && k !== "End") return
    e.preventDefault()
    const n = LIGHT_FORMS.length
    const to = k === "Home" ? 0 : k === "End" ? n - 1 : (idx + (k === "ArrowRight" || k === "ArrowDown" ? 1 : n - 1)) % n
    pick(LIGHT_FORMS[to], true)
    rootRef.current?.querySelectorAll<HTMLButtonElement>(".lfm-opt")[to]?.focus()
  }

  return (
    <div
      ref={rootRef}
      className={`lfm ${className ?? ""}`}
      data-touched={touched ? "" : undefined}
      onPointerDownCapture={stopTour}
      onKeyDownCapture={stopTour}
      onFocusCapture={(e) => {
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) stopTour()
      }}
    >
      <div className="lfm-card">
        <button
          type="button"
          className="lfm-stage"
          aria-label={`${cap.title}, drawn from ${count} strands of light. Send a ripple through it`}
          onClick={() => ripple(true)}
        >
          <canvas ref={setCv} aria-hidden="true" />
          <span className="lfm-idx" aria-hidden="true">{String(idx + 1).padStart(3, "0")}</span>
          <span className="lfm-hint" aria-hidden="true">Press to send a ripple</span>
        </button>
        <div className="lfm-cap">
          <div>
            <h3 className="lfm-title">{cap.title}</h3>
            <p className="lfm-note">{cap.note}</p>
          </div>
          <div className="lfm-seg" role="radiogroup" aria-label={groupLabel} onKeyDown={onKey} style={{ "--lfm-i": idx } as React.CSSProperties}>
            <span className="lfm-thumb" aria-hidden="true" />
            {LIGHT_FORMS.map((f) => (
              <button key={f} type="button" role="radio" className="lfm-opt" aria-checked={f === form} tabIndex={f === form ? 0 : -1} onClick={() => pick(f, true)}>
                {captions?.[f]?.title ?? DEFAULT_CAPTIONS[f].title}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="lfm-sr" role="status" aria-live="polite">{said}</span>
      <style href="light-form" precedence="default">{CSS}</style>
    </div>
  )
}
