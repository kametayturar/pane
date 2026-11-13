"use client"

import * as React from "react"

import type { StudioPieceProps, Values } from "@/studio/schema"
import { rng } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export const GRAIN_SHAPES = ["orb", "ring", "band", "wave"] as const
export type GrainShape = (typeof GRAIN_SHAPES)[number]

export const GRAIN_PALETTES = {
  ember: { label: "Ember", colors: ["#0d0b0a", "#4f1c10", "#c8501f", "#f4b06a", "#fff0d4"] },
  tide: { label: "Tide", colors: ["#050f15", "#0a3342", "#1b7380", "#8fcfc2", "#eef7ee"] },
  moss: { label: "Moss", colors: ["#0a0e09", "#23331d", "#66793a", "#c7c27a", "#f5efd0"] },
  cobalt: { label: "Cobalt", colors: ["#04060f", "#0b2570", "#2a60d0", "#9bbdff", "#f3f7ff"] },
  bone: { label: "Bone", colors: ["#09090a", "#38383a", "#8a8a8c", "#d8d8d6", "#fafaf8"] },
} as const
export type GrainPalette = keyof typeof GRAIN_PALETTES
const PALETTE_IDS = Object.keys(GRAIN_PALETTES) as GrainPalette[]

export type GrainGradientProps = StudioPieceProps & {
  /** Which field is shown. Setting it makes the piece controlled and turns the built-in tour off. */
  shape?: GrainShape
  /** The shape to start on when uncontrolled. Default "orb". */
  defaultShape?: GrainShape
  /** Called when the person picks another shape. */
  onShapeChange?: (shape: GrainShape) => void
  /** Named colour set. Default "ember" ("bone" in the Mono style). */
  palette?: GrainPalette
  /** Called when the person picks another colour set. */
  onPaletteChange?: (palette: GrainPalette) => void
  /** Your own 3 to 5 stops, darkest first. Overrides `palette`. */
  colors?: string[]
  /** Direction the light comes from, in degrees (0 = right, 90 = down). Setting it turns the tour off. */
  angle?: number
  /** Called while the person turns the light by dragging or with the arrow keys. */
  onAngleChange?: (angle: number) => void
  /** Amount of grain, 0–1. Default 0.5. */
  grain?: number
  /** Size of one grain, 0.5–3 (1 is about one pixel at 1000px wide). Default 1. */
  grainSize?: number
  /** How far the field is bent by the slow noise, 0–1. Default 0.5. */
  warp?: number
  /** Called with the saved PNG blob (2160 × 2160) when the person presses Save image. */
  onExport?: (blob: Blob, shape: GrainShape) => void
  /** Replace the title and the line under it, per shape. */
  captions?: Partial<Record<GrainShape, Partial<{ title: string; note: string }>>>
  /** Accessible name of the shape buttons group. */
  groupLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gnr {
  --gnr-ink: #000;
  --gnr-surface: #fff;
  --gnr-accent: #0060e2;
  --gnr-t1: color-mix(in oklab, var(--gnr-ink) 88%, transparent);
  --gnr-t2: color-mix(in oklab, var(--gnr-ink) 61%, transparent);
  --gnr-t3: color-mix(in oklab, var(--gnr-ink) 45%, transparent);
  --gnr-fill: color-mix(in oklab, var(--gnr-ink) 6%, transparent);
  --gnr-line: color-mix(in oklab, var(--gnr-ink) 7%, transparent);
  --gnr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --gnr-ease: cubic-bezier(.22, 1, .36, 1);
  --gnr-mono: 0;
  position: relative; container-type: inline-size; width: 100%; max-width: 480px;
  font: 13px/20px var(--gnr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--gnr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gnr {
  --gnr-ink: #fff;
  --gnr-surface: #1c1c1e;
  --gnr-accent: #4d8dff;
  --gnr-t1: color-mix(in oklab, var(--gnr-ink) 90%, transparent);
  --gnr-t2: color-mix(in oklab, var(--gnr-ink) 62%, transparent);
  --gnr-t3: color-mix(in oklab, var(--gnr-ink) 46%, transparent);
  --gnr-fill: color-mix(in oklab, var(--gnr-ink) 8%, transparent);
  --gnr-line: color-mix(in oklab, var(--gnr-ink) 9%, transparent);
  --gnr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .gnr {
  --gnr-ink: #000; --gnr-surface: #fff; --gnr-accent: #111; --gnr-shadow: 0 0 0 1px rgb(0 0 0 / .14); --gnr-mono: 1;
  --gnr-ease: cubic-bezier(.2, .9, .1, 1); --gnr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .gnr { --gnr-ink: #fff; --gnr-surface: #0a0a0a; --gnr-accent: #f2f2f2; --gnr-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .gnr {
  --gnr-ink: var(--pane-ink); --gnr-surface: var(--pane-solid); --gnr-accent: var(--pane-accent); --gnr-shadow: var(--pane-shadow);
  --gnr-ease: var(--pane-ease); --gnr-font: var(--pane-font);
  --gnr-t1: var(--pane-t1); --gnr-t2: var(--pane-t2); --gnr-t3: var(--pane-t3);
}
html[data-style="glass"] .gnr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .gnr-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .gnr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .gnr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.gnr *, .gnr *::before, .gnr *::after { box-sizing: border-box }
:where(.gnr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.gnr) p, :where(.gnr) h3 { margin: 0; font-weight: inherit }
.gnr button:focus-visible { outline: 2px solid var(--gnr-accent); outline-offset: 2px }
.gnr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.gnr-card { border-radius: 24px; background: var(--gnr-surface); box-shadow: var(--gnr-shadow); padding: 8px 8px 0; overflow: hidden }
html[data-style="mono"] .gnr-card { border-radius: 6px }

/* The stage is a slider for the light: drag or use the arrow keys. */
.gnr-stage { position: relative; display: block; width: 100%; aspect-ratio: 1 / 1; border-radius: 17px; overflow: hidden; background: #0c0c0d; cursor: grab; touch-action: none; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none }
.gnr-stage[data-drag] { cursor: grabbing }
html[data-style="mono"] .gnr-stage { border-radius: 2px }
.gnr-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; animation: gnr-in .9s var(--gnr-ease) backwards }
.gnr-stage:focus-visible { outline: 2px solid var(--gnr-accent); outline-offset: 2px }
.gnr-hint { position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 12px; line-height: 16px; letter-spacing: .01em; color: rgb(255 255 255 / .9); pointer-events: none; transition: opacity .5s var(--gnr-ease); text-shadow: 0 0 2px rgb(0 0 0 / .5), 0 0 14px rgb(0 0 0 / .45) }
.gnr[data-touched] .gnr-hint { opacity: 0 }
@container (min-width: 640px) { .gnr-stage { aspect-ratio: 16 / 10 } }
@keyframes gnr-in { from { opacity: 0 } to { opacity: 1 } }

.gnr-cap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 16px 12px 14px }
@container (min-width: 420px) { .gnr-cap { grid-template-columns: minmax(0, 1fr) auto; align-items: end; padding: 16px 14px 14px } }
.gnr-title { font-size: 17px; line-height: 22px; font-weight: 500; letter-spacing: -.01em; color: var(--gnr-t1) }
.gnr-note { margin-top: 2px; color: var(--gnr-t2); text-wrap: pretty; max-width: 34ch }

.gnr-seg { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: 3px; border-radius: 11px; background: var(--gnr-fill); width: 100%; min-width: 0 }
@container (min-width: 420px) { .gnr-seg { width: 248px } }
html[data-style="mono"] .gnr-seg { border-radius: 4px }
.gnr-thumb { position: absolute; left: 3px; top: 3px; bottom: 3px; width: calc((100% - 6px) / 4); border-radius: 8px; background: var(--gnr-surface); box-shadow: 0 0 0 .5px var(--gnr-line), 0 1px 2px rgb(0 0 0 / .1); transform: translateX(calc(var(--gnr-i, 0) * 100%)); transition: transform .42s var(--gnr-ease) }
html[data-style="mono"] .gnr-thumb { border-radius: 2px }
.gnr-opt { position: relative; z-index: 1; height: 32px; border-radius: 8px; font-weight: 500; color: var(--gnr-t3); transition: color .2s var(--gnr-ease), transform .16s var(--gnr-ease) }
.gnr-opt:active { transform: scale(.97) }
.gnr-opt[aria-checked="true"] { color: var(--gnr-t1) }
@media (hover: hover) { .gnr-opt:hover { color: var(--gnr-t1) } }

.gnr-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 14px 14px }
.gnr-pal { display: flex; gap: 8px }
.gnr-sw { position: relative; width: 22px; height: 22px; border-radius: 999px; box-shadow: 0 0 0 .5px var(--gnr-line); transition: transform .2s var(--gnr-ease), box-shadow .2s var(--gnr-ease) }
.gnr-sw::after { content: ""; position: absolute; inset: -5px; border-radius: 999px }
.gnr-sw:active { transform: scale(.92) }
.gnr-sw[aria-checked="true"] { box-shadow: 0 0 0 2px var(--gnr-surface), 0 0 0 3.5px var(--gnr-t2) }
html[data-style="mono"] .gnr-sw { border-radius: 2px }
.gnr-save { height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 500; color: var(--gnr-t2); background: var(--gnr-fill); transition: color .2s var(--gnr-ease), transform .16s var(--gnr-ease) }
.gnr-save:active { transform: scale(.97) }
html[data-style="mono"] .gnr-save { border-radius: 4px }
@media (hover: hover) { .gnr-save:hover { color: var(--gnr-t1) } }

@media (prefers-reduced-motion: reduce) {
  .gnr *, .gnr *::before, .gnr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Seconds in one seamless loop: the slow noise and the optional light orbit are periodic in t / LOOP. */
export const GRAIN_GRADIENT_LOOP = 12
const TAU = Math.PI * 2

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const GRAIN_GRADIENT_DEFAULTS: Values = {
  shape: "orb",
  colors: [...GRAIN_PALETTES.ember.colors],
  angle: 215,
  scale: 1,
  warp: 0.5,
  drift: 0.6,
  orbit: false,
  grain: 0.5,
  grainSize: 1,
  seed: 11,
}

/* ------------------------------- colour ------------------------------------ */

type RGB = [number, number, number]
const hexRgb = (h: string): RGB => {
  let s = h.trim().replace("#", "")
  if (s.length === 3) s = s.replace(/./g, (c) => c + c)
  const n = parseInt(s.slice(0, 6), 16)
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128]
}
const toLin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toSrgb = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
const toLab = ([r, g, b]: RGB): RGB => {
  const R = toLin(r), G = toLin(g), B = toLin(b)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
const fromLab = ([L, a, b]: RGB): RGB => {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

const lutCache = new Map<string, Uint8ClampedArray>()
/** 256 colours across the stops, blended in OKLab so mid-tones stay clean instead of going muddy. */
function lut(colors: string[]): Uint8ClampedArray {
  const key = colors.join("|")
  const hit = lutCache.get(key)
  if (hit) return hit
  const stops = colors.slice(0, 5).map((c) => toLab(hexRgb(c)))
  if (stops.length < 2) stops.push(stops[0] ?? [0.5, 0, 0])
  const out = new Uint8ClampedArray(256 * 3)
  const n = stops.length - 1
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * n
    const k = Math.min(n - 1, Math.floor(x))
    const f = x - k
    const e = f * f * (3 - 2 * f) * 0.35 + f * 0.65
    const A = stops[k], B = stops[k + 1]
    const c = fromLab([A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e, A[2] + (B[2] - A[2]) * e])
    out[i * 3] = c[0]
    out[i * 3 + 1] = c[1]
    out[i * 3 + 2] = c[2]
  }
  if (lutCache.size > 24) lutCache.clear()
  lutCache.set(key, out)
  return out
}

/* -------------------------------- noise ------------------------------------ */

const hash = (x: number, y: number, s: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** Smooth value noise in [0, 1]. */
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/* ------------------------------- the grain --------------------------------- */

const TILE = 256
type Tiles = { signed: HTMLCanvasElement; lift: HTMLCanvasElement }
const tileCache = new Map<number, Tiles>()
/**
 * A seeded 256² tile of fine grain, high-passed so it has no blotches: one copy centred on mid-grey (for overlay),
 * one holding only its positive half (added to the shadows, where overlay does almost nothing).
 */
function grainTiles(seed: number): Tiles | null {
  if (typeof document === "undefined") return null
  const hit = tileCache.get(seed)
  if (hit) return hit
  const r = rng(seed * 7919 + 13)
  const n = new Float32Array(TILE * TILE)
  for (let i = 0; i < n.length; i++) n[i] = r() + r() + r() - 1.5
  const mk = () => {
    const c = document.createElement("canvas")
    c.width = c.height = TILE
    return c
  }
  const a = mk(), b = mk()
  const ca = a.getContext("2d"), cb = b.getContext("2d")
  if (!ca || !cb) return null
  const ia = ca.createImageData(TILE, TILE), ib = cb.createImageData(TILE, TILE)
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x
      const avg = (n[i] * 4 + n[y * TILE + ((x + 1) & 255)] + n[y * TILE + ((x + 255) & 255)] + n[((y + 1) & 255) * TILE + x] + n[((y + 255) & 255) * TILE + x]) / 8
      const g = n[i] - avg * 1.15 // subtract a little blur: removes slow variation
      const sv = clamp(128 + g * 118, 0, 255)
      const lv = clamp(g * 150, 0, 255)
      ia.data[i * 4] = ia.data[i * 4 + 1] = ia.data[i * 4 + 2] = sv
      ia.data[i * 4 + 3] = 255
      ib.data[i * 4] = ib.data[i * 4 + 1] = ib.data[i * 4 + 2] = lv
      ib.data[i * 4 + 3] = 255
    }
  ca.putImageData(ia, 0, 0)
  cb.putImageData(ib, 0, 0)
  if (tileCache.size > 8) tileCache.clear()
  const t = { signed: a, lift: b }
  tileCache.set(seed, t)
  return t
}

/* ------------------------------- the field --------------------------------- */

const scratch: HTMLCanvasElement[] = []
function scratchCanvas(i: number, w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null
  const c = scratch[i] ?? (scratch[i] = document.createElement("canvas"))
  if (c.width !== w || c.height !== h) {
    c.width = w
    c.height = h
  }
  return c
}

/** The picture without grain: one scalar per cell (0 = ground, 1 = core), mapped through the colour stops. */
function paintField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, v: Values, shape: GrainShape, alpha: number, slot: number) {
  const scale = ctx.getTransform().a || 1
  const long = clamp(Math.round(Math.max(w, h) * scale * 0.34), 150, 520)
  const fw = Math.max(2, Math.round((long * w) / Math.max(w, h)))
  const fh = Math.max(2, Math.round((long * h) / Math.max(w, h)))
  const cv = scratchCanvas(slot, fw, fh)
  const fctx = cv?.getContext("2d")
  if (!cv || !fctx) return
  const img = fctx.createImageData(fw, fh)
  const px = img.data

  const colors = Array.isArray(v.colors) ? (v.colors as string[]) : (GRAIN_GRADIENT_DEFAULTS.colors as string[])
  const L = lut(colors)
  const seed = Math.round(num(v.seed, 11))
  const r = rng(seed * 31 + 5)
  const ox = r() * 40, oy = r() * 40, jx = (r() - 0.5) * 0.16, jy = (r() - 0.5) * 0.12
  const warp = clamp(num(v.warp, 0.5), 0, 1.5)
  const drift = clamp(num(v.drift, 0.6), 0, 1)
  const size = clamp(num(v.scale, 1), 0.4, 2)
  let ang = num(v.angle, 215)
  if (v.orbit) ang += (360 * t) / GRAIN_GRADIENT_LOOP
  const a = (ang * Math.PI) / 180
  const lx = Math.cos(a), ly = Math.sin(a)
  const ph = (TAU * t) / GRAIN_GRADIENT_LOOP
  const wr = 0.55 * drift
  const cp = Math.cos(ph) * wr, sp = Math.sin(ph) * wr
  const ar = w / h
  const sx = ar > 1 ? ar : 1, sy = ar < 1 ? 1 / ar : 1
  const ph2 = ph * 2

  for (let j = 0; j < fh; j++) {
    const Y0 = ((j + 0.5) / fh - 0.5) * sy
    for (let i = 0; i < fw; i++) {
      const X0 = ((i + 0.5) / fw - 0.5) * sx
      // Domain warp: two slow noises bend the plane, so no edge or contour is ever a perfect curve.
      const wx = vnoise(X0 * 1.5 + ox + cp, Y0 * 1.5 + oy + sp, seed) - 0.5 + 0.18 * Math.sin(Y0 * 4.1 + ph2 + ox)
      const wy = vnoise(X0 * 1.5 + oy - sp, Y0 * 1.5 + ox + cp, seed + 7) - 0.5 + 0.18 * Math.sin(X0 * 3.7 - ph2 + oy)
      const X = X0 + wx * warp * 0.55 - jx
      const Y = Y0 + wy * warp * 0.55 - jy
      let s: number
      if (shape === "orb") {
        // A sphere of light whose hot core leans toward the light.
        const R = 0.4 * size
        const dx = X - lx * R * 0.3, dy = Y - ly * R * 0.3
        const d = Math.sqrt(dx * dx + dy * dy) / (R * 1.28)
        const base = d >= 1 ? 0 : Math.pow(1 - d, 1.55)
        const rim = Math.sqrt(X * X + Y * Y) / R
        s = base * (0.88 + 0.12 * smooth(1.2, 0.2, rim))
      } else if (shape === "ring") {
        const R = 0.27 * size
        const rad = Math.sqrt(X * X + Y * Y)
        const e = (rad - R) / (0.1 * size + 0.02)
        const lit = 0.5 + 0.5 * ((X * lx + Y * ly) / (rad + 0.06))
        s = Math.exp(-e * e) * (0.3 + 0.7 * lit * lit) + 0.22 * Math.exp(-(rad * rad) / (R * R * 0.5)) * lit
      } else if (shape === "band") {
        // A soft sash across the frame; the light decides which way it runs.
        const q = X * -ly + Y * lx
        const along = X * lx + Y * ly
        const e = (q + 0.06 * Math.sin(along * 3.2 + ph)) / (0.2 * size)
        s = Math.exp(-e * e) * (0.62 + 0.38 * smooth(-0.6, 0.6, along))
      } else {
        // Silk: the gradient axis is the light, and the folds ride across it.
        const q = X * lx + Y * ly
        const p = -X * ly + Y * lx
        const f = q + (0.11 * Math.sin(p * 3.4 / size + ph) + 0.06 * Math.sin(p * 7.1 / size - ph2 + 1.3)) * (0.5 + warp)
        s = smooth(-0.8 * size, 0.95 * size, f)
        s = s * s * (3 - 2 * s) * 0.5 + s * 0.5
      }
      const k = (clamp(s) * 255 + 0.5) | 0
      const o = (j * fw + i) * 4
      px[o] = L[k * 3]
      px[o + 1] = L[k * 3 + 1]
      px[o + 2] = L[k * 3 + 2]
      px[o + 3] = 255
    }
  }
  fctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.globalAlpha = alpha
  ctx.drawImage(cv, 0, 0, w, h)
  ctx.globalAlpha = 1
}

/**
 * The whole picture, a pure function of (t, values) – the Studio exports from this, and so does the piece.
 * Values the live piece adds: `_prev` / `_prevA` (the shape being faded out).
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Values) {
  const v: Values = { ...GRAIN_GRADIENT_DEFAULTS, ...values }
  const shape: GrainShape = (GRAIN_SHAPES as readonly string[]).includes(v.shape as string) ? (v.shape as GrainShape) : "orb"
  ctx.save()
  ctx.globalCompositeOperation = "source-over"
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, w, h)
  const prevA = num(v._prevA, 0)
  if (prevA > 0 && typeof v._prev === "string" && (GRAIN_SHAPES as readonly string[]).includes(v._prev)) {
    paintField(ctx, w, h, t, v, v._prev as GrainShape, 1, 1)
    paintField(ctx, w, h, t, v, shape, 1 - prevA, 0)
  } else paintField(ctx, w, h, t, v, shape, 1, 0)

  // Grain lives in the picture, not on top of it: overlay for the mid-tones and highlights,
  // a faint additive pass so the near-black shadows are dithered too (they band first).
  const grain = clamp(num(v.grain, 0.5), 0, 1)
  if (grain > 0.005) {
    const tiles = grainTiles(Math.round(num(v.seed, 11)))
    if (tiles) {
      const dev = ctx.getTransform().a || 1
      const px = Math.max((clamp(num(v.grainSize, 1), 0.4, 4) * Math.max(w, h)) / 1000, 1 / dev)
      const m = new DOMMatrix().scale(px)
      const p1 = ctx.createPattern(tiles.signed, "repeat")
      const p2 = ctx.createPattern(tiles.lift, "repeat")
      ctx.imageSmoothingEnabled = false
      if (p1) {
        p1.setTransform(m)
        ctx.globalCompositeOperation = "overlay"
        ctx.globalAlpha = Math.min(1, grain * 0.95)
        ctx.fillStyle = p1
        ctx.fillRect(0, 0, w, h)
      }
      if (p2) {
        p2.setTransform(m)
        ctx.globalCompositeOperation = "lighter"
        ctx.globalAlpha = grain * 0.2
        ctx.fillStyle = p2
        ctx.fillRect(0, 0, w, h)
      }
    }
  }
  ctx.restore()
}

/** A PNG of the picture at 1080 × 1080, drawn at 2× (2160 px). */
export function renderGrainPng(values: Values, t = 0.4): Promise<Blob | null> {
  const cv = document.createElement("canvas")
  cv.width = cv.height = 2160
  const ctx = cv.getContext("2d")
  if (!ctx) return Promise.resolve(null)
  ctx.scale(2, 2)
  draw(ctx, 1080, 1080, t, values)
  return new Promise((res) => cv.toBlob((b) => res(b), "image/png"))
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

const DEFAULT_CAPTIONS: Record<GrainShape, { title: string; note: string }> = {
  orb: { title: "Orb", note: "One sphere of light, its hot core leaning toward the lamp." },
  ring: { title: "Ring", note: "A halo that brightens on the side the light comes from." },
  band: { title: "Band", note: "A soft sash across the frame, turned by the light." },
  wave: { title: "Wave", note: "Folds of silk laid across the direction of the light." },
}
const SHAPE_LABEL: Record<GrainShape, string> = { orb: "Orb", ring: "Ring", band: "Band", wave: "Wave" }

/** The one-time tour: the light turns across the orb, then the ring takes over and the light comes back round. */
const SWEEP1 = { at: 1.1, dur: 4.4, from: 215, to: 35 }
const SWITCH_AT = 8.6
const SWEEP2 = { at: 9.6, dur: 4.4, from: 20, to: 200 }
const ease = (x: number) => {
  const t = clamp(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
function tourAngle(t: number) {
  if (t >= SWEEP2.at) return SWEEP2.from + (SWEEP2.to - SWEEP2.from) * ease((t - SWEEP2.at) / SWEEP2.dur)
  if (t >= SWEEP1.at) return SWEEP1.from + (SWEEP1.to - SWEEP1.from) * ease((t - SWEEP1.at) / SWEEP1.dur)
  return SWEEP1.from
}
const wrap360 = (a: number) => ((a % 360) + 360) % 360

/**
 * GrainGradient – a smooth field of colour (orb, ring, band or wave) with fine grain worked into it, so it
 * never bands and prints like a poster. Drag to turn the light; the grain stays where it is. Save image
 * writes a 2160px PNG.
 *
 *   <GrainGradient />
 */
function assignRef(ref: React.Ref<HTMLCanvasElement> | undefined, el: HTMLCanvasElement | null) {
  if (typeof ref === "function") ref(el)
  else if (ref) (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el
}

export function GrainGradient(props: GrainGradientProps) {
  const {
    shape: shapeProp, defaultShape = "orb", onShapeChange, palette: paletteProp, onPaletteChange, colors, angle: angleProp, onAngleChange,
    grain, grainSize, warp, onExport, captions, groupLabel = "Shape", className,
    speed = 1, paused, values, seed, size, time, canvasRef,
  } = props
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const controlled = shapeProp !== undefined
  const [shapeState, setShapeState] = React.useState<GrainShape>(defaultShape)
  const shape = shapeProp ?? shapeState
  const [palState, setPalState] = React.useState<GrainPalette | null>(null)
  const [said, setSaid] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const [drag, setDrag] = React.useState(false)
  const [angleText, setAngleText] = React.useState(SWEEP1.from)
  const [monoStyle, setMonoStyle] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const setCv = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      assignRef(canvasRef, el)
    },
    [canvasRef],
  )

  // Everything the loop reads lives in refs, so changing a prop never restarts it.
  const live = React.useRef({ shape, values, colors, palette: paletteProp ?? palState, grain, grainSize, warp, angle: angleProp, seed, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled, mono: false })
  const eng = React.useRef({ t: 0, cur: shape as GrainShape, prev: null as GrainShape | null, formAt: -99, demo: true, angle: SWEEP1.from, target: SWEEP1.from, switched: false, vals: {} as Values })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    const m = live.current.mono
    live.current = { shape, values, colors, palette: paletteProp ?? palState, grain, grainSize, warp, angle: angleProp, seed, speed: Math.max(0.05, speed), paused: !!paused, reduced, time, controlled, mono: m }
    ctl.current?.update()
  }, [shape, values, colors, paletteProp, palState, grain, grainSize, warp, angleProp, seed, speed, paused, reduced, time, controlled])

  const pick = React.useCallback(
    (s: GrainShape, byPerson: boolean) => {
      if (byPerson) setSaid(captions?.[s]?.title ?? DEFAULT_CAPTIONS[s].title)
      if (!live.current.controlled) setShapeState(s)
      onShapeChange?.(s)
    },
    [captions, onShapeChange],
  )
  const pickRef = React.useRef(pick)
  React.useEffect(() => {
    pickRef.current = pick
  }, [pick])

  const stopTour = React.useCallback(() => {
    eng.current.demo = false
    setTouched(true)
  }, [])

  const setAngle = React.useCallback(
    (a: number, snap = false) => {
      const E = eng.current
      E.target = wrap360(a)
      if (snap) E.angle = E.target
      setAngleText(Math.round(E.target))
      onAngleChange?.(Math.round(E.target))
      ctl.current?.update()
    },
    [onAngleChange],
  )

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
    let frame = 0

    const merged = (): Values => {
      const L = live.current
      const v: Values = { ...GRAIN_GRADIENT_DEFAULTS, ...(L.values ?? {}) }
      if (L.grain !== undefined) v.grain = L.grain
      if (L.grainSize !== undefined) v.grainSize = L.grainSize
      if (L.warp !== undefined) v.warp = L.warp
      if (L.seed !== undefined) v.seed = L.seed
      const pal = L.palette ?? (L.values && Array.isArray(L.values.colors) ? null : L.mono ? "bone" : "ember")
      if (pal) v.colors = [...GRAIN_PALETTES[pal].colors]
      if (L.colors && L.colors.length >= 2) v.colors = [...L.colors]
      v.shape = L.shape
      return v
    }
    const render = () => {
      if (!W || !H) return
      const L = live.current
      const v = merged()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (L.time !== undefined) {
        draw(ctx, W, H, L.time, v)
        return
      }
      let t = E.t
      if (L.reduced) {
        // One meaningful still: the light caught half-way across the field.
        t = 0.4
        v.angle = L.angle ?? num(L.values?.angle, 120)
        draw(ctx, W, H, t, v)
        E.vals = v
        return
      }
      if (E.cur !== L.shape) {
        E.prev = E.cur
        E.cur = L.shape
        E.formAt = t
      }
      const since = t - E.formAt
      if (E.prev) {
        const pa = 1 - clamp(since / 0.9)
        if (pa <= 0) E.prev = null
        else {
          v._prev = E.prev
          v._prevA = ease(pa)
        }
      }
      v.angle = L.angle ?? E.angle
      E.vals = v
      draw(ctx, W, H, t, v)
    }
    const needsClock = () => {
      const L = live.current
      return L.time === undefined && !L.reduced
    }
    const shouldRun = () => visible && !live.current.paused && needsClock() && !document.hidden
    const readMono = () => {
      const m = getComputedStyle(root).getPropertyValue("--gnr-mono").trim() === "1"
      if (m !== live.current.mono) {
        live.current.mono = m
        setMonoStyle(m)
        return true
      }
      return false
    }
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      E.t += dt * live.current.speed
      if (frame++ % 90 === 0) readMono()
      if (E.demo && !live.current.controlled && live.current.angle === undefined) {
        E.angle = E.target = wrap360(tourAngle(E.t))
        if (!E.switched && E.t >= SWITCH_AT) {
          E.switched = true
          pickRef.current("ring", false)
        }
      } else if (live.current.angle === undefined) {
        // Ease toward where the person turned the light, the short way round.
        let d = ((E.target - E.angle + 540) % 360) - 180
        d *= 1 - Math.exp(-dt * 12)
        E.angle = wrap360(E.angle + d)
      }
      if (now - lastDraw >= 30) {
        lastDraw = now
        render()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      const mono = readMono()
      void mono
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
      if (!E.demo || live.current.angle !== undefined) E.angle = E.target
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

  const cap = { ...DEFAULT_CAPTIONS[shape], ...(captions?.[shape] ?? {}) }
  const idx = GRAIN_SHAPES.indexOf(shape)
  const activePal: GrainPalette | null = paletteProp ?? palState ?? (monoStyle ? "bone" : "ember")

  // Studio artboard: only the picture, filling the size it was given.
  if (size) {
    return (
      <div ref={rootRef} className={`gnr ${className ?? ""}`} style={{ width: size.w, height: size.h, maxWidth: "none" }}>
        <canvas ref={setCv} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "none" }} />
        <style href="grain-gradient" precedence="default">{CSS}</style>
      </div>
    )
  }

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key
    if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "ArrowDown" && k !== "ArrowUp" && k !== "Home" && k !== "End") return
    e.preventDefault()
    const n = GRAIN_SHAPES.length
    const to = k === "Home" ? 0 : k === "End" ? n - 1 : (idx + (k === "ArrowRight" || k === "ArrowDown" ? 1 : n - 1)) % n
    pick(GRAIN_SHAPES[to], true)
    rootRef.current?.querySelectorAll<HTMLButtonElement>(".gnr-opt")[to]?.focus()
  }

  const angleFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
  }
  const onStageKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 30 : 10
    const k = e.key
    if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "ArrowUp" && k !== "ArrowDown") return
    e.preventDefault()
    const E = eng.current
    setAngle((angleProp ?? E.target) + (k === "ArrowRight" || k === "ArrowDown" ? step : -step))
  }
  const save = async () => {
    const v = { ...(eng.current.vals ?? {}) }
    delete v._prev
    delete v._prevA
    const blob = await renderGrainPng(v, 0.4)
    if (!blob) return
    onExport?.(blob, shape)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `grain-gradient-${shape}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    setSaid("Image saved")
  }

  return (
    <div
      ref={rootRef}
      className={`gnr ${className ?? ""}`}
      data-touched={touched ? "" : undefined}
      onPointerDownCapture={stopTour}
      onKeyDownCapture={stopTour}
      onFocusCapture={(e) => {
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) stopTour()
      }}
    >
      <div className="gnr-card">
        <div
          className="gnr-stage"
          role="slider"
          tabIndex={0}
          aria-label="Light direction"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={angleProp !== undefined ? Math.round(wrap360(angleProp)) : angleText}
          aria-valuetext={`${angleProp !== undefined ? Math.round(wrap360(angleProp)) : angleText} degrees`}
          data-drag={drag ? "" : undefined}
          onKeyDown={onStageKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setDrag(true)
            setAngle(angleFromPointer(e))
          }}
          onPointerMove={(e) => {
            if (drag) setAngle(angleFromPointer(e))
          }}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
        >
          <canvas ref={setCv} aria-hidden="true" />
          <span className="gnr-hint" aria-hidden="true">Drag to turn the light</span>
        </div>
        <div className="gnr-cap">
          <div>
            <h3 className="gnr-title">{cap.title}</h3>
            <p className="gnr-note">{cap.note}</p>
          </div>
          <div className="gnr-seg" role="radiogroup" aria-label={groupLabel} onKeyDown={onKey} style={{ "--gnr-i": idx } as React.CSSProperties}>
            <span className="gnr-thumb" aria-hidden="true" />
            {GRAIN_SHAPES.map((s) => (
              <button key={s} type="button" role="radio" className="gnr-opt" aria-checked={s === shape} tabIndex={s === shape ? 0 : -1} onClick={() => pick(s, true)}>
                {captions?.[s]?.title ?? SHAPE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="gnr-foot">
          <div className="gnr-pal" role="radiogroup" aria-label="Colours">
            {PALETTE_IDS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                className="gnr-sw"
                aria-checked={activePal === p}
                aria-label={GRAIN_PALETTES[p].label}
                title={GRAIN_PALETTES[p].label}
                style={{ background: `linear-gradient(135deg, ${GRAIN_PALETTES[p].colors[3]}, ${GRAIN_PALETTES[p].colors[2]} 55%, ${GRAIN_PALETTES[p].colors[1]})` }}
                onClick={() => {
                  setPalState(p)
                  setSaid(GRAIN_PALETTES[p].label)
                  onPaletteChange?.(p)
                }}
              />
            ))}
          </div>
          <button type="button" className="gnr-save" onClick={save}>Save image</button>
        </div>
      </div>
      <span className="gnr-sr" role="status" aria-live="polite">{said}</span>
      <style href="grain-gradient" precedence="default">{CSS}</style>
    </div>
  )
}
