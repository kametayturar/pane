"use client"

import * as React from "react"

import type { StudioPieceProps, Values } from "@/studio/schema"
import { rng } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LightCardForm = "bloom" | "swell" | "orbit" | "ribbon"
export type LightCardsPalette = "pearl" | "ember" | "glacier" | "mono" | "custom"

export type LightCard = {
  /** Stable id passed to `onSelect` and used for `value`. Defaults to the index. */
  id?: string
  title: string
  note: string
  /** Which light-painted form the card carries. Defaults to bloom, swell, orbit, ribbon in turn. */
  form?: LightCardForm
}

export type LightCardsProps = StudioPieceProps & {
  /** The cards, 1–6. Default: four invented agent features. */
  cards?: LightCard[]
  /** Id of the selected card. Setting it makes the piece controlled; the built-in tour stops. */
  value?: string
  /** Id to start on when uncontrolled. Nothing is selected by default. */
  defaultValue?: string
  /** Called when the person picks a card (click, Enter or Space). */
  onSelect?: (id: string, index: number) => void
  /** Strands per card, 60–400. Default 220. */
  strands?: number
  /** Strength of the soft light behind the strands, 0–1.5. Default 0.6. */
  glow?: number
  /** Film grain on the lit areas, 0–1. Default 0.3. */
  grain?: number
  /** Colour set. Default "pearl". */
  palette?: LightCardsPalette
  /** Accessible name of the group of cards. */
  groupLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lcd {
  --lcd-ink: #000;
  --lcd-accent: #0060e2;
  --lcd-ease: cubic-bezier(.22, 1, .36, 1);
  --lcd-card: #0b0b0d;
  --lcd-w1: rgb(255 255 255 / .94);
  --lcd-w2: rgb(255 255 255 / .62);
  --lcd-w3: rgb(255 255 255 / .46);
  --lcd-ring: rgb(255 255 255 / .09);
  --lcd-ring-on: rgb(255 255 255 / .24);
  --lcd-shadow: 0 1px 2px rgb(0 0 0 / .18), 0 18px 40px -14px rgb(0 0 0 / .32);
  --lcd-radius: 22px;
  position: relative; container-type: inline-size; width: 100%; max-width: 1200px;
  font: 13px/20px var(--lcd-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lcd-w1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .lcd {
  --lcd-ink: #fff; --lcd-accent: #4d8dff; --lcd-card: #0e0e11;
  --lcd-shadow: 0 1px 2px rgb(0 0 0 / .4), 0 18px 40px -14px rgb(0 0 0 / .6);
}
html[data-style="mono"] .lcd {
  --lcd-accent: #111; --lcd-card: #000; --lcd-ring: rgb(255 255 255 / .22); --lcd-ring-on: rgb(255 255 255 / .6);
  --lcd-ease: cubic-bezier(.2, .9, .1, 1); --lcd-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lcd-radius: 6px; --lcd-shadow: none;
}
html[data-style="mono"].dark .lcd { --lcd-accent: #f2f2f2 }
html[data-style="mono"] .lcd-art { filter: grayscale(1) contrast(1.08) }
html[data-style="glass"] .lcd {
  --lcd-ease: var(--pane-ease, cubic-bezier(.22, 1, .36, 1)); --lcd-font: var(--pane-font);
  --lcd-radius: 26px; --lcd-ring: rgb(255 255 255 / .16); --lcd-ring-on: rgb(255 255 255 / .34);
}
html[data-style="glass"] .lcd-card {
  --lcd-w2: rgb(255 255 255 / .76); --lcd-w3: rgb(255 255 255 / .6);
  background-color: rgb(8 8 12 / .62);
  background-image: linear-gradient(160deg, rgb(255 255 255 / .09), rgb(255 255 255 / 0) 46%);
  -webkit-backdrop-filter: blur(22px) saturate(1.7); backdrop-filter: blur(22px) saturate(1.7);
}
.lcd *, .lcd *::before, .lcd *::after { box-sizing: border-box }
:where(.lcd) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.lcd) p { margin: 0 }

.lcd-grid { display: grid; gap: 12px; grid-template-columns: 1fr }
@container (min-width: 520px) { .lcd-grid { grid-template-columns: repeat(2, 1fr); gap: 14px } }
@container (min-width: 900px) { .lcd-grid { grid-template-columns: repeat(var(--lcd-cols, 4), 1fr); gap: 16px } }

.lcd-card {
  position: relative; display: block; width: 100%; overflow: hidden; isolation: isolate;
  display: flex; align-items: flex-start; aspect-ratio: 5 / 3.7; border-radius: var(--lcd-radius); background: var(--lcd-card);
  box-shadow: inset 0 0 0 1px var(--lcd-ring), var(--lcd-shadow);
  transition: box-shadow .45s var(--lcd-ease), transform .45s var(--lcd-ease);
  -webkit-tap-highlight-color: transparent;
}
@container (min-width: 520px) { .lcd-card { aspect-ratio: 1 / 1.02 } }
@container (min-width: 900px) { .lcd-card { aspect-ratio: 5 / 6.4 } }
.lcd-card[data-lit], .lcd-card[aria-pressed="true"] { box-shadow: inset 0 0 0 1px var(--lcd-ring-on), var(--lcd-shadow) }
.lcd-card:focus { outline: none }
.lcd-card:focus-visible { outline: 2px solid var(--lcd-accent); outline-offset: 3px }
@media (hover: hover) { .lcd-card:active { transform: scale(.992) } }
.lcd-art { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none }
.lcd-card::after { content: ""; position: absolute; inset: 0 0 auto 0; height: 58%; z-index: 0; pointer-events: none; background: linear-gradient(to bottom, color-mix(in srgb, var(--lcd-card) 88%, transparent), color-mix(in srgb, var(--lcd-card) 55%, transparent) 55%, transparent) }
.lcd-copy { width: 100%; position: relative; z-index: 1; display: block; padding: 18px 22px 0; pointer-events: none }
.lcd-top { display: flex; flex-direction: column; gap: 2px; min-height: 62px }
.lcd-title { font-size: 15px; line-height: 20px; font-weight: 500; letter-spacing: -.005em; color: var(--lcd-w1); text-wrap: balance }
.lcd-num { order: -1; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; letter-spacing: .04em; color: var(--lcd-w3); transition: color .45s var(--lcd-ease) }
.lcd-card[data-lit] .lcd-num, .lcd-card[aria-pressed="true"] .lcd-num { color: var(--lcd-w1) }
.lcd-note { display: block; margin-top: 4px; min-height: 40px; max-width: 26ch; color: var(--lcd-w2); text-wrap: pretty }
@media (prefers-reduced-motion: reduce) {
  .lcd-card, .lcd-num { transition: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Painting                                  */
/* -------------------------------------------------------------------------- */

/** Seconds for the built-in tour of four cards to come round once (and for the Studio loop). */
export const LIGHT_CARDS_LOOP = 8
const SLOT = 2
const TAU = Math.PI * 2
const FORMS: LightCardForm[] = ["bloom", "swell", "orbit", "ribbon"]

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const smoothstep = (a: number, b: number, v: number) => {
  const k = clamp((v - a) / (b - a))
  return k * k * (3 - 2 * k)
}
const easeOut = (k: number) => 1 - Math.pow(1 - k, 4)
const num = (x: unknown, d: number) => (typeof x === "number" && isFinite(x) ? x : d)

type RGB = [number, number, number]
type Ink = { core: RGB; a: RGB; b: RGB }

const PALETTES: Record<Exclude<LightCardsPalette, "custom">, Ink> = {
  pearl: { core: [255, 240, 230], a: [112, 176, 255], b: [255, 118, 168] },
  ember: { core: [255, 236, 212], a: [255, 118, 52], b: [255, 196, 96] },
  glacier: { core: [232, 251, 255], a: [58, 208, 232], b: [118, 140, 255] },
  mono: { core: [250, 250, 250], a: [190, 190, 190], b: [190, 190, 190] },
}

function parseColor(c: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split("").map((x) => x + x).join("")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function resolveInk(palette: string, tint: string | undefined): Ink {
  if (palette === "custom") {
    const c = parseColor(tint ?? "") ?? [255, 92, 124]
    const shift = (k: number): RGB => [clamp(c[0] * k + (1 - k) * c[2], 0, 255), clamp(c[1] * 0.9 + 20 * k, 0, 255), clamp(c[2] * k + (1 - k) * c[0], 0, 255)]
    return { core: [255, 244, 238], a: c, b: shift(0.45) }
  }
  return PALETTES[(palette as keyof typeof PALETTES) in PALETTES ? (palette as keyof typeof PALETTES) : "pearl"]
}

type Strand = { pts: Float32Array; side: number; weight: number }
type Built = { strands: Strand[]; cx: number; cy: number }

type Pt = [number, number]
function bez(a: Pt, b: Pt, c: Pt, d: Pt, s: number): Pt {
  const u = 1 - s
  const w0 = u * u * u, w1 = 3 * u * u * s, w2 = 3 * u * s * s, w3 = s * s * s
  return [w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1]]
}

/** Every form lives in a unit space, roughly 1 across, with its root at (0, 0) and "up" being negative y. */
function buildBloom(n: number, R: () => number): Built {
  const P = 7
  const per = Math.max(3, Math.round(n / P))
  const out: Strand[] = []
  for (let i = 0; i < P; i++) {
    const k = i / (P - 1) - 0.5
    const a = -Math.PI / 2 + k * 2.9 + (R() - 0.5) * 0.06
    const L = 0.98 * (1 - 0.34 * Math.abs(k) * 2) * (0.94 + R() * 0.12)
    const W = 0.2 * (0.8 + R() * 0.4)
    const bend = (R() - 0.5) * 0.3 + k * 0.28
    const dx = Math.cos(a), dy = Math.sin(a)
    const nx = -dy, ny = dx
    for (let j = 0; j < per; j++) {
      const v = clamp((j / (per - 1)) * 2 - 1 + (R() - 0.5) * (1.7 / per), -1, 1)
      const m = 40
      const pts = new Float32Array(m * 2)
      for (let s = 0; s < m; s++) {
        const q = s / (m - 1)
        const prof = Math.sin(Math.PI * Math.pow(q, 0.72)) * (1 - 0.18 * q)
        const along = L * q
        const off = W * v * prof + bend * L * q * q
        pts[s * 2] = dx * along + nx * off
        pts[s * 2 + 1] = dy * along + ny * off
      }
      out.push({ pts, side: clamp(k * 1.5 + v * 0.55, -1, 1), weight: 0.7 + 0.3 * (1 - Math.abs(v)) })
    }
  }
  return { strands: out, cx: 0, cy: -0.4 }
}

function buildSwell(n: number, R: () => number): Built {
  const out: Strand[] = []
  const ph = R() * TAU
  const bot = (s: number) => bez([0, 0], [0.42, 0.06], [0.82, 0.02], [1.06, -0.12], s)
  const top = (s: number) => bez([0, 0], [0.12, -0.52], [0.56, -0.96], [1.0, -0.9], s)
  for (let j = 0; j < n; j++) {
    const v = clamp(j / (n - 1) + (R() - 0.5) * (0.8 / n), 0, 1)
    const m = 52
    const pts = new Float32Array(m * 2)
    for (let s = 0; s < m; s++) {
      const q = s / (m - 1)
      const B = bot(q), T = top(q)
      const w = clamp(0.03 + 0.94 * v + 0.07 * Math.sin(q * Math.PI * 2.2 + v * 7 + ph) * Math.sin(Math.PI * q), 0.01, 0.99)
      pts[s * 2] = lerp(B[0], T[0], w)
      pts[s * 2 + 1] = lerp(B[1], T[1], w)
    }
    out.push({ pts, side: v * 2 - 1, weight: 0.2 + 0.8 * Math.pow(Math.sin(v * Math.PI), 0.7) })
  }
  return { strands: out, cx: 0.45, cy: -0.42 }
}

function buildOrbit(n: number, R: () => number): Built {
  const out: Strand[] = []
  const ph = R() * TAU
  for (let k = 0; k < n; k++) {
    const f = clamp(k / (n - 1) + (R() - 0.5) * (0.8 / n), 0, 1)
    const psi = f * Math.PI + 0.3 * Math.sin(f * 5 + ph)
    const a = 1
    const b = 0.14 + 0.78 * Math.pow(f, 0.85)
    const cs = Math.cos(psi), sn = Math.sin(psi)
    const m = 72
    const pts = new Float32Array(m * 2)
    const ox = 0.05 * Math.sin(k * 0.41 + ph)
    for (let s = 0; s < m; s++) {
      const th = (s / (m - 1)) * TAU
      const x = a * Math.cos(th), y = b * Math.sin(th)
      pts[s * 2] = x * cs - y * sn + ox
      pts[s * 2 + 1] = x * sn + y * cs
    }
    out.push({ pts, side: f * 2 - 1, weight: 0.72 + 0.28 * (1 - f) })
  }
  return { strands: out, cx: 0, cy: 0 }
}

function buildRibbon(n: number, R: () => number): Built {
  const out: Strand[] = []
  const bands = 2
  const per = Math.max(3, Math.round(n / bands))
  const ph0 = R() * TAU
  for (let r = 0; r < bands; r++) {
    const ph = ph0 + r * 1.9
    const W = r === 0 ? 0.3 : 0.2
    for (let j = 0; j < per; j++) {
      const v = clamp((j / (per - 1)) * 2 - 1 + (R() - 0.5) * (1.7 / per), -1, 1)
      const m = 64
      const pts = new Float32Array(m * 2)
      for (let s = 0; s < m; s++) {
        const x = (s / (m - 1)) * 2 - 1
        const mid = 0.13 * Math.sin(1.35 * x + ph) + (r === 0 ? 0 : -0.16)
        pts[s * 2] = x
        pts[s * 2 + 1] = mid + v * W * (0.42 + 0.58 * Math.abs(Math.cos(2.5 * x + ph * 1.3)))
      }
      out.push({ pts, side: clamp(v * 0.9 + (r === 0 ? -0.1 : 0.1), -1, 1), weight: 0.7 + 0.3 * (1 - Math.abs(v)) })
    }
  }
  return { strands: out, cx: 0, cy: 0 }
}

const BUILDERS: Record<LightCardForm, (n: number, R: () => number) => Built> = {
  bloom: buildBloom, swell: buildSwell, orbit: buildOrbit, ribbon: buildRibbon,
}
const CACHE = new Map<string, Built>()
function build(form: LightCardForm, seed: number, n: number): Built {
  const key = `${form}:${seed}:${n}`
  let b = CACHE.get(key)
  if (!b) {
    if (CACHE.size > 48) CACHE.clear()
    b = BUILDERS[form](n, rng(seed))
    CACHE.set(key, b)
  }
  return b
}

/** Where the form's root sits in the card (fractions of its width and height), its size and tilt. */
const PLACE: Record<LightCardForm, { x: number; y: number; s: number; rot: number; dens: number; amp: number }> = {
  bloom: { x: 0.78, y: 1.1, s: 1.22, rot: 0.1, dens: 1, amp: 1.2 },
  swell: { x: -0.14, y: 1.04, s: 1.34, rot: 0, dens: 0.55, amp: 0.7 },
  orbit: { x: 0.98, y: 0.97, s: 0.72, rot: -0.28, dens: 0.8, amp: 0.9 },
  ribbon: { x: 0.5, y: 0.93, s: 1.45, rot: -0.1, dens: 0.9, amp: 0.9 },
}

let TILE: HTMLCanvasElement | null = null
function grainTile(): CanvasImageSource | null {
  if (typeof document === "undefined") return null
  if (TILE) return TILE
  const c = document.createElement("canvas")
  c.width = c.height = 128
  const g = c.getContext("2d")
  if (!g) return null
  const img = g.createImageData(128, 128)
  const R = rng(4242)
  for (let i = 0; i < img.data.length; i += 4) {
    const dark = R() < 0.5
    img.data[i] = img.data[i + 1] = img.data[i + 2] = dark ? 0 : 255
    img.data[i + 3] = Math.floor(R() * 130)
  }
  g.putImageData(img, 0, 0)
  TILE = c
  return c
}

type PaintOpts = { seed: number; strands: number; glow: number; grain: number; ink: Ink }

/** Share of full brightness a card shows at rest. Hover and focus lift it to 1, so every card always has its art. */
const REST = 0.56

/**
 * One card's art, painted additively on whatever is already there (transparent in the component, black in the Studio).
 * `lit` runs 0 to 1: the strands brighten, extend toward their tips and sway.
 */
function paintArt(ctx: CanvasRenderingContext2D, w: number, h: number, i: number, form: LightCardForm, t: number, lit: number, o: PaintOpts, reveal = 1) {
  const pl = PLACE[form]
  const built = build(form, o.seed * 17 + i * 101 + 3, Math.round(o.strands * pl.dens))
  const S = Math.min(w, h * 0.8) * pl.s
  const { core, a, b } = o.ink
  const breathe = 1 + 0.018 * Math.sin(t * 0.7 + i) * lit
  const rot = pl.rot + 0.035 * Math.sin(t * 0.55 + i * 1.7) * lit
  const e = REST + (1 - REST) * lit
  const alpha = lerp(0.06, 0.38, e * e * (3 - 2 * e)) * pl.amp * smoothstep(0, 0.35, reveal)
  const open = lerp(0.62, 1, e) * (0.12 + 0.88 * reveal)

  ctx.save()
  ctx.globalCompositeOperation = "lighter"
  ctx.translate(w * pl.x, h * pl.y)
  ctx.rotate(rot)
  ctx.scale(S * breathe, S * breathe)

  if (o.glow > 0.01) {
    const gl = (rad: number, ga: number, mid: RGB) => {
      const g = ctx.createRadialGradient(built.cx, built.cy, 0, built.cx, built.cy, rad)
      g.addColorStop(0, `rgba(${core[0]},${core[1]},${core[2]},${ga})`)
      g.addColorStop(0.35, `rgba(${mid[0]},${mid[1]},${mid[2]},${ga * 0.5})`)
      g.addColorStop(0.7, `rgba(${mid[0]},${mid[1]},${mid[2]},${ga * 0.12})`)
      g.addColorStop(1, `rgba(${mid[0]},${mid[1]},${mid[2]},0)`)
      ctx.fillStyle = g
      ctx.fillRect(built.cx - rad, built.cy - rad, rad * 2, rad * 2)
    }
    gl(1.5, o.glow * lerp(0.03, 0.2, e * e), b)
    gl(0.7, o.glow * lerp(0.03, 0.3, e * e), a)
  }

  ctx.lineWidth = Math.max(0.8, S * 0.0034) / S
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const closed = form === "orbit"
  for (const st of built.strands) {
    const side = st.side
    const k = Math.abs(side)
    const tint = side < 0 ? a : b
    const mix = Math.pow(k, 1.4) * lerp(1, 0.8, lit)
    const r = Math.round(lerp(core[0], tint[0], mix))
    const gC = Math.round(lerp(core[1], tint[1], mix))
    const bl = Math.round(lerp(core[2], tint[2], mix))
    const p = st.pts
    const m = p.length / 2
    // Open forms taper: a gradient along the strand fades it in from the root and out toward a tip that grows with `open`.
    const x0 = p[0], y0 = p[1], x1 = p[(m - 1) * 2], y1 = p[(m - 1) * 2 + 1]
    const col = (e: number) => `rgba(${r},${gC},${bl},${(alpha * st.weight * e).toFixed(3)})`
    if (closed) ctx.strokeStyle = col(1)
    else {
      const g = ctx.createLinearGradient(x0, y0, x1, y1)
      g.addColorStop(0, col(0))
      g.addColorStop(0.22, col(1))
      g.addColorStop(open * 0.45, col(1))
      g.addColorStop(open, col(0))
      ctx.strokeStyle = g
    }
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let s = 1; s < m; s++) ctx.lineTo(p[s * 2], p[s * 2 + 1])
    ctx.stroke()
  }
  ctx.restore()

  if (o.grain > 0.01) {
    const tile = grainTile()
    const pat = tile ? ctx.createPattern(tile, "repeat") : null
    if (pat) {
      ctx.save()
      ctx.globalCompositeOperation = "source-atop"
      ctx.globalAlpha = o.grain * 0.7 * e + o.grain * 0.25
      ctx.fillStyle = pat
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  }
}

/** Which cards are lit at time t during the tour: one at a time, each for a slot, then round again. Periodic in n slots. */
export function tourLit(t: number, n: number, slot = SLOT): number[] {
  const out: number[] = []
  const p = t / slot
  for (let i = 0; i < n; i++) {
    let d = (((p - i) % n) + n) % n
    if (d > n / 2) d -= n
    out.push(1 - smoothstep(0.3, 0.8, Math.abs(d)))
  }
  return out
}

export const LIGHT_CARDS_DEFAULTS = {
  palette: "pearl", tint: "#ff5c7c", strands: 220, glow: 0.6, grain: 0.3, seed: 7, lit: "tour",
  t1: "Trace every run", t2: "Review before it ships", t3: "Budgets that hold", t4: "One memory, many agents",
  n1: "Replay any step with the exact inputs it saw.", n2: "Atlas drafts, Sage checks, you approve.", n3: "Spend stops at the limit you set per team.", n4: "What Quill learns on Monday, Atlas knows by lunch.",
}

const DEFAULT_CARDS: LightCard[] = [
  { id: "trace", title: "Trace every run", note: "Replay any step with the exact inputs it saw." },
  { id: "review", title: "Review before it ships", note: "Atlas drafts, Sage checks, you approve." },
  { id: "budget", title: "Budgets that hold", note: "Spend stops at the limit you set per team." },
  { id: "memory", title: "One memory, many agents", note: "What Quill learns on Monday, Atlas knows by lunch." },
]

function litFromValues(v: Values, t: number, n: number): number[] {
  const mode = String(v.lit ?? "tour")
  if (mode === "all") return Array.from({ length: n }, () => 1)
  if (/^[1-9]$/.test(mode)) return Array.from({ length: n }, (_, i) => (i === Number(mode) - 1 ? 1 : 0))
  return tourLit(t, n)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const wd of words) {
    const tryL = cur ? cur + " " + wd : wd
    if (cur && ctx.measureText(tryL).width > maxW) {
      lines.push(cur)
      cur = wd
    } else cur = tryL
  }
  if (cur) lines.push(cur)
  return lines
}

/**
 * The whole composition as a pure function of time and values, so the Studio can export any frame at any size.
 * `values`: palette, tint, strands, glow, grain, seed, lit ("tour", "all" or "1"–"4"), t1–t4 (titles), n1–n4 (notes).
 * The tour repeats every LIGHT_CARDS_LOOP seconds, so loops are seamless.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Values = {}) {
  const v: Values = { ...LIGHT_CARDS_DEFAULTS, ...values }
  const ink = resolveInk(String(v.palette), typeof v.tint === "string" ? v.tint : undefined)
  const o: PaintOpts = {
    seed: Math.round(num(v.seed, 7)), strands: clamp(num(v.strands, 220), 60, 400), glow: clamp(num(v.glow, 0.6), 0, 1.5),
    grain: clamp(num(v.grain, 0.3)), ink,
  }
  const titles = [v.t1, v.t2, v.t3, v.t4].map((x, i) => (typeof x === "string" && x ? x : DEFAULT_CARDS[i].title))
  const notes = [v.n1, v.n2, v.n3, v.n4].map((x, i) => (typeof x === "string" && x ? x : DEFAULT_CARDS[i].note))
  const n = 4
  const lit = litFromValues(v, t, n)

  ctx.save()
  ctx.fillStyle = "#050507"
  ctx.fillRect(0, 0, w, h)
  const cols = w / h >= 1.5 ? 4 : 2
  const rows = Math.ceil(n / cols)
  const m = Math.min(w, h) * 0.06
  const g = Math.min(w, h) * 0.022
  const cw = (w - 2 * m - (cols - 1) * g) / cols
  let ch = (h - 2 * m - (rows - 1) * g) / rows
  ch = Math.min(ch, cw * 1.36)
  const gy = (h - (rows * ch + (rows - 1) * g)) / 2
  const k = cw / 290
  for (let i = 0; i < n; i++) {
    const x = m + (i % cols) * (cw + g)
    const y = gy + Math.floor(i / cols) * (ch + g)
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.roundRect(0, 0, cw, ch, 22 * k)
    ctx.clip()
    ctx.fillStyle = "#0c0c0f"
    ctx.fillRect(0, 0, cw, ch)
    paintArt(ctx, cw, ch, i, FORMS[i], t, lit[i], o)
    ctx.restore()
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.roundRect(0.5, 0.5, cw - 1, ch - 1, 22 * k)
    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.09, 0.24, lit[i]).toFixed(3)})`
    ctx.lineWidth = 1
    ctx.stroke()
    const px = 22 * k
    const font = `-apple-system, "SF Pro Text", Inter, system-ui, sans-serif`
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = "rgba(255,255,255,.94)"
    ctx.font = `500 ${15 * k}px ${font}`
    ctx.textAlign = "left"
    const tl = wrapText(ctx, titles[i], cw - 2 * px - 44 * k).slice(0, 3)
    tl.forEach((ln, j) => ctx.fillText(ln, px, 20 * k + 15 * k + j * 20 * k))
    ctx.textAlign = "right"
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.46, 0.94, lit[i]).toFixed(3)})`
    ctx.font = `400 ${12 * k}px ${font}`
    ctx.fillText(String(i + 1).padStart(3, "0"), cw - px, 20 * k + 15 * k)
    ctx.textAlign = "left"
    ctx.fillStyle = "rgba(255,255,255,.58)"
    ctx.font = `400 ${13 * k}px ${font}`
    wrapText(ctx, notes[i], Math.min(26 * 7.4 * k, cw - 2 * px)).slice(0, 3).forEach((ln, j) =>
      ctx.fillText(ln, px, 20 * k + 15 * k + (tl.length - 1) * 20 * k + 24 * k + j * 20 * k),
    )
    ctx.restore()
  }
  ctx.restore()
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

export function LightCards(props: LightCardsProps) {
  const {
    cards = DEFAULT_CARDS, value, defaultValue, onSelect, strands, glow, grain, palette, groupLabel = "Features", className,
    speed = 1, paused, accent, values, seed, time,
  } = props
  const n = Math.max(1, Math.min(6, cards.length))
  const list = cards.slice(0, n)
  const ids = list.map((c, i) => c.id ?? String(i))

  const controlled = value !== undefined
  const [inner, setInner] = React.useState<string | undefined>(defaultValue)
  const selectedId = controlled ? value : inner
  const selIdx = selectedId === undefined ? -1 : ids.indexOf(selectedId)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cvs = React.useRef<(HTMLCanvasElement | null)[]>([])
  const btns = React.useRef<(HTMLButtonElement | null)[]>([])
  const [litSet, setLitSet] = React.useState<number>(-1)

  const merged: Values = { ...LIGHT_CARDS_DEFAULTS, ...(palette ? { palette } : null), ...(strands ? { strands } : null), ...(glow !== undefined ? { glow } : null), ...(grain !== undefined ? { grain } : null), ...(seed !== undefined ? { seed } : null), ...values }
  const live = React.useRef({ merged, accent, n, forms: list.map((c, i) => c.form ?? FORMS[i % 4]), selIdx, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled })
  const ctl = React.useRef<{ kick: () => void } | null>(null)
  const evRef = React.useRef<{ enter: (i: number, t: boolean) => void; leave: (i: number) => void; focus: (i: number) => void; blur: (i: number) => void; press: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { merged, accent, n, forms: list.map((c, i) => c.form ?? FORMS[i % 4]), selIdx, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled }
    ctl.current?.kick()
  })

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const S = {
      lit: Array.from({ length: 6 }, () => 0),
      drawn: Array.from({ length: 6 }, () => -1),
      reveal: Array.from({ length: 6 }, () => 1),
      born: 0,
      hover: -1,
      focus: -1,
      interacted: false,
      clock: 0,
      raf: 0,
      last: 0,
      visible: true,
      dirty: true,
      dpr: 1,
    }
    const stop = () => {
      S.interacted = true
    }

    const targets = (): { lit: number[]; snap: boolean; moving: boolean } => {
      const L = live.current
      const out: number[] = []
      if (L.time !== undefined) return { lit: litFromValues(L.merged, L.time, L.n), snap: true, moving: false }
      const tourOn = !S.interacted && !L.controlled && L.selIdx < 0
      if (tourOn && !L.reduced) {
        const lit = litFromValues(L.merged, S.clock, L.n)
        return { lit, snap: true, moving: true }
      }
      for (let i = 0; i < L.n; i++) {
        let on = false
        if (S.hover >= 0) on = i === S.hover
        else if (S.focus >= 0) on = i === S.focus
        else if (L.selIdx >= 0) on = i === L.selIdx
        else if (tourOn && L.reduced) on = i === 0
        out.push(on ? 1 : 0)
      }
      return { lit: out, snap: L.reduced, moving: false }
    }

    const paintAll = () => {
      const L = live.current
      const ink = resolveInk(String(L.merged.palette), typeof L.merged.tint === "string" ? L.merged.tint : L.accent)
      const o: PaintOpts = {
        seed: Math.round(num(L.merged.seed, 7)), strands: clamp(num(L.merged.strands, 220), 60, 400),
        glow: clamp(num(L.merged.glow, 0.6), 0, 1.5), grain: clamp(num(L.merged.grain, 0.3)), ink,
      }
      const t = L.reduced || L.time !== undefined ? (L.time ?? 0) : S.clock
      let drifting = false
      for (let i = 0; i < L.n; i++) {
        const cv = cvs.current[i]
        if (!cv) continue
        const lit = S.lit[i]
        const wantsDrift = lit > 0.02 && !L.reduced && L.time === undefined
        const revealing = S.reveal[i] < 1
        if (!S.dirty && Math.abs(lit - S.drawn[i]) < 0.002 && !wantsDrift && !revealing) continue
        if (revealing) drifting = true
        if (wantsDrift && !L.paused) drifting = true
        const w = cv.clientWidth, h = cv.clientHeight
        if (!w || !h) continue
        const ctx = cv.getContext("2d")
        if (!ctx) continue
        ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        paintArt(ctx, w, h, i, L.forms[i], t, lit, o, S.reveal[i])
        S.drawn[i] = lit
      }
      S.dirty = false
      return drifting
    }

    const frame = (now: number) => {
      S.raf = 0
      const L = live.current
      const dt = Math.min(0.05, S.last ? (now - S.last) / 1000 : 0.016)
      S.last = now
      const T = targets()
      if (T.moving && !L.paused) S.clock += dt * L.speed
      const tt = T.moving ? targets() : T
      if (S.born) {
        const el = (now - S.born) / 1000
        for (let i = 0; i < 6; i++) S.reveal[i] = easeOut(clamp((el - i * 0.09) / 0.7))
      }
      let settled = true
      for (let i = 0; i < L.n; i++) {
        const goal = tt.lit[i] ?? 0
        if (tt.snap) S.lit[i] = goal
        else {
          S.lit[i] += (goal - S.lit[i]) * (1 - Math.exp(-dt * 7))
          if (Math.abs(goal - S.lit[i]) < 0.003) S.lit[i] = goal
          else settled = false
        }
      }
      const drifting = paintAll()
      const idx = S.lit.slice(0, L.n).findIndex((x) => x > 0.6)
      setLitSet((p) => (p === idx ? p : idx))
      if ((T.moving || drifting || !settled) && S.visible && !document.hidden && L.time === undefined) S.raf = requestAnimationFrame(frame)
      else S.last = 0
    }
    const kick = () => {
      S.dirty = true
      if (S.raf) return
      const L = live.current
      if (L.time !== undefined || !S.visible || document.hidden) {
        // Static frame: lit values land straight on their targets.
        const T = targets()
        for (let i = 0; i < L.n; i++) S.lit[i] = T.lit[i] ?? 0
        paintAll()
        const idx = S.lit.slice(0, L.n).findIndex((x) => x > 0.6)
        setLitSet((p) => (p === idx ? p : idx))
        return
      }
      S.raf = requestAnimationFrame(frame)
    }
    ctl.current = { kick }

    // Draw-in: each card's strands extend from the root in turn, quickly. Skipped for reduced motion and exported frames.
    if (!live.current.reduced && live.current.time === undefined) {
      for (let i = 0; i < 6; i++) S.reveal[i] = 0
      S.born = performance.now()
    }

    // First paint is synchronous so the first frame is never empty, even if rAF never runs.
    const first = targets()
    for (let i = 0; i < 6; i++) S.lit[i] = first.lit[i] ?? 0

    const size = () => {
      S.dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const cv of cvs.current) {
        if (!cv) continue
        const w = Math.max(1, Math.round(cv.clientWidth * S.dpr)), h = Math.max(1, Math.round(cv.clientHeight * S.dpr))
        if (cv.width !== w || cv.height !== h) {
          cv.width = w
          cv.height = h
        }
      }
      S.dirty = true
      paintAll()
      kick()
    }
    const ro = new ResizeObserver(size)
    ro.observe(root)
    size()

    const io = new IntersectionObserver((e) => {
      S.visible = e[e.length - 1].isIntersecting
      kick()
    })
    io.observe(root)
    const onVis = () => kick()
    document.addEventListener("visibilitychange", onVis)

    const ev = {
      enter: (i: number, touch: boolean) => {
        if (touch) return
        stop()
        S.hover = i
        kick()
      },
      leave: (i: number) => {
        if (S.hover === i) S.hover = -1
        kick()
      },
      focus: (i: number) => {
        stop()
        S.focus = i
        kick()
      },
      blur: (i: number) => {
        if (S.focus === i) S.focus = -1
        kick()
      },
      press: () => {
        stop()
        kick()
      },
    }
    evRef.current = ev
    const mo = new MutationObserver(() => kick())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-style"] })

    return () => {
      ctl.current = null
      if (S.raf) cancelAnimationFrame(S.raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const ev = () => evRef.current

  const select = (i: number) => {
    ev()?.press()
    if (!controlled) setInner(ids[i])
    onSelect?.(ids[i], i)
  }
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let to = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % n
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i - 1 + n) % n
    else if (e.key === "Home") to = 0
    else if (e.key === "End") to = n - 1
    if (to >= 0) {
      e.preventDefault()
      btns.current[to]?.focus()
    }
  }

  return (
    <div ref={rootRef} className={["lcd", className].filter(Boolean).join(" ")} style={{ ["--lcd-cols" as string]: Math.min(4, n) }}>
      <style href="light-cards" precedence="default">
        {CSS}
      </style>
      <div className="lcd-grid" role="group" aria-label={groupLabel}>
        {list.map((c, i) => (
          <button
            key={ids[i]}
            ref={(el) => {
              btns.current[i] = el
            }}
            type="button"
            className="lcd-card"
            aria-pressed={i === selIdx}
            data-lit={litSet === i ? "" : undefined}
            onPointerEnter={(e) => ev()?.enter(i, e.pointerType === "touch")}
            onPointerLeave={() => ev()?.leave(i)}
            onPointerDown={() => ev()?.press()}
            onFocus={() => ev()?.focus(i)}
            onBlur={() => ev()?.blur(i)}
            onClick={() => select(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <canvas
              ref={(el) => {
                cvs.current[i] = el
              }}
              className="lcd-art"
              aria-hidden="true"
            />
            <span className="lcd-copy">
              <span className="lcd-top">
                <span className="lcd-title">{c.title}</span>
                <span className="lcd-num" aria-hidden="true">{String(i + 1).padStart(3, "0")}</span>
              </span>
              <span className="lcd-note">{c.note}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
