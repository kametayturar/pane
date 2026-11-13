"use client"

import * as React from "react"

import { rng, type StudioPieceProps } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GoldenHillsLight = "morning" | "golden" | "dusk"

export type GoldenHillsProps = StudioPieceProps & {
  /** Position of the sun, 0 (early, from the left) to 1 (dusk, from the right). Setting it turns the intro off. */
  light?: number
  /** Where the light starts when you do not control it. Default 0.3, golden hour. */
  defaultLight?: number
  /** Called when the person moves the sun: drag the scene, use the arrow keys or press a button. */
  onLightChange?: (light: number, name: GoldenHillsLight | "custom") => void
  /** The lone tree on the middle ridge. Default true. */
  tree?: boolean
  /** The tiny walker. Default true. */
  walker?: boolean
  /** Grass density, 0–1. Default 0.7. */
  grass?: number
  /** How much shade the drifting clouds throw, 0–1. Default 1. */
  shadows?: number
  /** Film grain, 0–1. Default 0.5. */
  grain?: number
  /** Valley haze, 0–1. Default 0.5. */
  haze?: number
  /** Show the light buttons under the scene. Default true. */
  controls?: boolean
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ghl {
  --ghl-ink: #000;
  --ghl-surface: #fff;
  --ghl-accent: #0060e2;
  --ghl-t1: color-mix(in oklab, var(--ghl-ink) 88%, transparent);
  --ghl-t2: color-mix(in oklab, var(--ghl-ink) 61%, transparent);
  --ghl-t3: color-mix(in oklab, var(--ghl-ink) 45%, transparent);
  --ghl-fill: color-mix(in oklab, var(--ghl-ink) 6%, transparent);
  --ghl-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 18px 40px -10px rgb(60 40 10 / .18);
  --ghl-ease: cubic-bezier(.22, 1, .36, 1);
  --ghl-radius: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 960px;
  font: 13px/20px var(--ghl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--ghl-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ghl {
  --ghl-ink: #fff;
  --ghl-surface: #1c1c1e;
  --ghl-accent: #4d8dff;
  --ghl-t1: color-mix(in oklab, var(--ghl-ink) 90%, transparent);
  --ghl-t2: color-mix(in oklab, var(--ghl-ink) 62%, transparent);
  --ghl-t3: color-mix(in oklab, var(--ghl-ink) 46%, transparent);
  --ghl-fill: color-mix(in oklab, var(--ghl-ink) 8%, transparent);
  --ghl-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4), 0 18px 40px -10px rgb(0 0 0 / .55);
}
html[data-style="mono"] .ghl {
  --ghl-accent: #111; --ghl-shadow: 0 0 0 1px rgb(0 0 0 / .16); --ghl-radius: 6px;
  --ghl-ease: cubic-bezier(.2, .9, .1, 1); --ghl-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .ghl { --ghl-accent: #f2f2f2; --ghl-shadow: 0 0 0 1px rgb(255 255 255 / .18) }
html[data-style="glass"] .ghl {
  --ghl-ink: var(--pane-ink); --ghl-accent: var(--pane-accent); --ghl-shadow: var(--pane-shadow); --ghl-ease: var(--pane-ease);
  --ghl-font: var(--pane-font); --ghl-t1: var(--pane-t1); --ghl-t2: var(--pane-t2); --ghl-t3: var(--pane-t3);
}
.ghl *, .ghl *::before, .ghl *::after { box-sizing: border-box }
:where(.ghl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.ghl) p { margin: 0 }
.ghl button:focus-visible, .ghl-card:focus-visible { outline: 2px solid var(--ghl-accent); outline-offset: 3px }

.ghl-card {
  position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--ghl-radius);
  background: #d8c9a6; box-shadow: var(--ghl-shadow); touch-action: pan-y; cursor: ew-resize; user-select: none; -webkit-user-select: none;
  isolation: isolate;
}
.ghl-card[data-drag] { cursor: grabbing }
.ghl-cv { position: absolute; inset: 0; display: block; width: 100%; height: 100% }
@container (max-width: 520px) { .ghl-card { aspect-ratio: 4 / 5 } }

.ghl[data-studio] { max-width: none; height: 100% }
.ghl[data-studio] .ghl-card { height: 100%; aspect-ratio: auto; border-radius: 0; box-shadow: none; cursor: default }

.ghl-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 16px; margin-top: 12px }
.ghl-seg { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); width: min(100%, 312px) }
.ghl-btn {
  height: 36px; padding: 0 8px; font-weight: 500; color: var(--ghl-t3); white-space: nowrap; border-radius: 8px;
  transition: color .2s var(--ghl-ease), background-color .2s var(--ghl-ease), transform .16s var(--ghl-ease);
}
.ghl-btn:hover { color: var(--ghl-t2); background: var(--ghl-fill) }
.ghl-btn:active { transform: scale(.97) }
.ghl-btn[aria-pressed="true"] { color: var(--ghl-t1) }
.ghl-ink { position: absolute; left: 0; bottom: 3px; width: calc(100% / 3); height: 2px; pointer-events: none; transform: translateX(calc(var(--ghl-i, 1) * 100%)) }
.ghl-ink::after { content: ""; display: block; width: 18px; height: 2px; margin: 0 auto; border-radius: 1px; background: var(--ghl-t1) }
.ghl-hint { color: var(--ghl-t3) }
@container (max-width: 520px) { .ghl-hint { display: none } }
@media (pointer: coarse) { .ghl-btn { height: 44px } }
@media (prefers-reduced-motion: reduce) {
  .ghl *, .ghl *::before, .ghl *::after { transition: none !important; animation: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Colour kit                                */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number]
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type Cnv = HTMLCanvasElement | OffscreenCanvas

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const frac = (x: number) => x - Math.floor(x)
const mixC = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`

function parseColor(s: string | undefined): RGB | null {
  if (!s) return null
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Light keyframes at light = 0 (early), 0.3 (golden hour), 1 (dusk). */
const KEY_AT = [0, 0.3, 1]
const KEYS: Record<"top" | "hor" | "sun" | "lit" | "shade" | "shadow" | "cloud", RGB[]> = {
  top: [[122, 160, 206], [78, 130, 202], [52, 72, 126]],
  hor: [[238, 228, 204], [247, 220, 166], [238, 164, 122]],
  sun: [[255, 244, 216], [255, 228, 164], [255, 178, 122]],
  lit: [[190, 176, 98], [222, 168, 62], [201, 120, 62]],
  shade: [[88, 108, 70], [98, 100, 46], [72, 56, 68]],
  shadow: [[120, 142, 196], [104, 128, 196], [96, 84, 150]],
  cloud: [[255, 251, 244], [255, 245, 224], [255, 216, 192]],
}
type Palette = { [K in keyof typeof KEYS]: RGB }

function palette(light: number, grass: RGB | null): Palette {
  const L = clamp(light)
  const i = L < KEY_AT[1] ? 0 : 1
  const t = (L - KEY_AT[i]) / (KEY_AT[i + 1] - KEY_AT[i])
  const out = {} as Palette
  for (const k of Object.keys(KEYS) as (keyof typeof KEYS)[]) out[k] = mixC(KEYS[k][i], KEYS[k][i + 1], t)
  if (grass) out.lit = mixC(out.lit, grass, 0.7)
  return out
}

/** Sun position and elevation (fraction of height above the horizon) for a light value. */
const sunX = (L: number) => 0.12 + 0.62 * L
const sunElev = (L: number) => (L < 0.3 ? lerp(0.13, 0.075, L / 0.3) : lerp(0.075, 0.022, (L - 0.3) / 0.7))
/** Which way the ground faces the sun: +1 sun on the left, -1 on the right. */
const sunSide = (L: number) => (0.5 - sunX(L)) * 2.2

/* -------------------------------------------------------------------------- */
/*                               Values and noise                             */
/* -------------------------------------------------------------------------- */

export const GOLDEN_HILLS_DURATION = 60
const U0 = 0.37 // the loop starts a few seconds before the cloud shadow reaches the walker
const MOMENT = 0.5 // loop position of that moment
const WALK_FROM = 0.1
const WALK_TO = 0.62
const TREE_X = 0.76

type V = {
  light: number
  tree: boolean
  walker: boolean
  grass: number
  shadows: number
  grain: number
  haze: number
  seed: number
  tint: RGB | null
}

function normalize(v: Record<string, unknown> | undefined, over: Partial<V> = {}): V {
  const num = (k: string, d: number) => (typeof v?.[k] === "number" && Number.isFinite(v[k]) ? (v[k] as number) : d)
  const bool = (k: string, d: boolean) => (typeof v?.[k] === "boolean" ? (v[k] as boolean) : d)
  const base: V = {
    light: clamp(num("light", 0.3)),
    tree: bool("tree", true),
    walker: bool("walker", true),
    grass: clamp(num("grass", 0.7)),
    shadows: clamp(num("shadows", 1)),
    grain: clamp(num("grain", 0.5)),
    haze: clamp(num("haze", 0.38)),
    seed: Math.round(num("seed", 7)),
    tint: parseColor(typeof v?.tint === "string" ? (v.tint as string) : undefined),
  }
  return { ...base, ...over }
}

const lattices = new Map<number, Float32Array>()
function lattice(seed: number) {
  let t = lattices.get(seed)
  if (!t) {
    const r = rng(seed * 2654435761)
    t = new Float32Array(256)
    for (let i = 0; i < 256; i++) t[i] = r()
    lattices.set(seed, t)
    if (lattices.size > 64) lattices.delete(lattices.keys().next().value as number)
  }
  return t
}
const quint = (f: number) => f * f * f * (f * (f * 6 - 15) + 10)
function n1(tab: Float32Array, x: number) {
  const i = Math.floor(x)
  const a = tab[i & 255]
  const b = tab[(i + 1) & 255]
  return a + (b - a) * quint(x - i)
}
function n2(tab: Float32Array, x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = quint(x - ix)
  const fy = quint(y - iy)
  const h = (a: number, b: number) => tab[(((tab[a & 255] * 255) | 0) + b * 37) & 255]
  const top = lerp(h(ix, iy), h(ix + 1, iy), fx)
  const bot = lerp(h(ix, iy + 1), h(ix + 1, iy + 1), fx)
  return lerp(top, bot, fy)
}

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

const BASE = [0.5, 0.572, 0.652, 0.772, 0.93]
const AMP = [0.04, 0.05, 0.058, 0.085, 0.105]
const FREQ = [1.0, 0.86, 0.78, 0.7, 0.58]
const HAZE_K = [0.62, 0.4, 0.2, 0.07, 0]

/** Ridge heights as a fraction of the canvas height. Wavelengths are fixed relative to the height, so tall artboards just see fewer hills. */
function makeRidges(seed: number, asp: number) {
  return BASE.map((base, k) => {
    const tab = lattice(seed * 31 + k * 977 + 5)
    const knoll = (TREE_X * asp) / 1.6
    return (xn: number) => {
      const xs = (xn * asp) / 1.6
      const f = FREQ[k]
      const v = n1(tab, xs * f * 3 + k * 5.3) * 0.62 + n1(tab, xs * f * 7.3 + 17.7) * 0.26 + n1(tab, xs * f * 17 + 3.1) * 0.12
      let y = base - AMP[k] * (v - 0.5) * 2.1
      if (k === 2) y -= 0.02 * Math.exp(-((xs - knoll) ** 2) / (2 * 0.1 ** 2))
      return y
    }
  })
}

type Lump = { dx: number; dy: number; s: number }
type Cloud = { cy: number; rx: number; ry: number; phi: number; sky: number; lumps: Lump[] }

function makeClouds(seed: number, ridge2: (x: number) => number): Cloud[] {
  const r = rng(seed * 13 + 91)
  const spec = [
    { cy: ridge2(WALK_FROM + (WALK_TO - WALK_FROM) * MOMENT) + 0.008, rx: 0.2, ry: 0.07, sky: 0.19, at: WALK_FROM + (WALK_TO - WALK_FROM) * MOMENT },
    { cy: 0.855, rx: 0.3, ry: 0.115, sky: 0.31, at: 0.98 },
    { cy: 0.585, rx: 0.14, ry: 0.04, sky: 0.12, at: 0.2 },
  ]
  return spec.map((c, i) => {
    const m = c.rx * 1.3
    // phi puts the cloud over `at` when the loop is at MOMENT
    const phi = frac((c.at + m) / (1 + 2 * m) - MOMENT)
    const lumps: Lump[] = Array.from({ length: 7 }, () => ({ dx: (r() - 0.5) * 1.9, dy: (r() - 0.5) * 1.1, s: 0.32 + r() * 0.4 }))
    lumps[0] = { dx: 0, dy: 0, s: 0.62 }
    return { cy: c.cy, rx: c.rx, ry: c.ry, phi: i === 0 ? phi : frac(phi + r() * 0.04), sky: c.sky, lumps }
  })
}
const cloudX = (c: Cloud, u: number) => {
  const m = c.rx * 1.3
  return -m + (1 + 2 * m) * frac(u + c.phi)
}

/* -------------------------------------------------------------------------- */
/*                                   The bake                                 */
/* -------------------------------------------------------------------------- */

type Scene = {
  canvas: Cnv
  mask: Cnv
  scratch: Cnv
  ridge: ((x: number) => number)[]
  clouds: Cloud[]
  asp: number
}
type Store = Map<string, Scene>

function makeCanvas(w: number, h: number): Cnv {
  const W = Math.max(1, Math.round(w))
  const H = Math.max(1, Math.round(h))
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(W, H)
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  return c
}
const ctx2 = (c: Cnv) => c.getContext("2d") as Ctx

let grainTile: { seed: number; c: Cnv } | null = null
function getGrain(seed: number): Cnv {
  if (grainTile?.seed === seed) return grainTile.c
  const c = makeCanvas(256, 256)
  const g = ctx2(c)
  const img = g.createImageData(256, 256)
  const r = rng(seed * 7 + 3)
  for (let i = 0; i < 256 * 256; i++) {
    const n = (r() + r() + r() - 1.5) / 1.5 // roughly gaussian
    const v = 128 + n * 70
    img.data[i * 4] = v + (r() - 0.5) * 10
    img.data[i * 4 + 1] = v
    img.data[i * 4 + 2] = v - (r() - 0.5) * 10
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  grainTile = { seed, c }
  return c
}

function bake(w: number, h: number, v: V): Scene {
  const asp = w / h
  const canvas = makeCanvas(w, h)
  const c = ctx2(canvas)
  const pal = palette(v.light, v.tint)
  const L = v.light
  const sdir = sunSide(L)
  const ridge = makeRidges(v.seed, asp)
  const clouds = makeClouds(v.seed, ridge[2])
  const rr = rng(v.seed * 101 + 17)
  const tab = lattice(v.seed + 900)
  const hazeAmt = v.haze * 2

  /* Sky: one vertical gradient, then the sun with a soft falloff (no lens flare). */
  const hy = BASE[0] * h
  const sky = c.createLinearGradient(0, 0, 0, hy + 0.04 * h)
  sky.addColorStop(0, css(pal.top))
  sky.addColorStop(0.5, css(mixC(pal.top, pal.hor, 0.38)))
  sky.addColorStop(1, css(pal.hor))
  c.fillStyle = sky
  c.fillRect(0, 0, w, h)
  const sx = sunX(L) * w
  const sy = (BASE[0] - sunElev(L)) * h
  const gr = c.createRadialGradient(sx, sy, 0, sx, sy, 0.46 * h)
  gr.addColorStop(0, css(pal.sun, 0.7))
  gr.addColorStop(0.12, css(pal.sun, 0.32))
  gr.addColorStop(1, css(pal.sun, 0))
  c.fillStyle = gr
  c.fillRect(0, 0, w, hy + 0.05 * h)
  c.fillStyle = css(mixC(pal.sun, [255, 255, 255], 0.5))
  c.beginPath()
  c.arc(sx, sy, 0.0165 * h, 0, Math.PI * 2)
  c.fill()
  const band = c.createLinearGradient(0, hy - 0.12 * h, 0, hy + 0.02 * h)
  band.addColorStop(0, css(pal.hor, 0))
  band.addColorStop(1, css(pal.hor, 0.55))
  c.fillStyle = band
  c.fillRect(0, hy - 0.12 * h, w, 0.14 * h)

  const colW = Math.max(1, Math.round(w / 700))
  const dn = 2 / w
  const lit = (xn: number, k: number) => {
    const slope = ((ridge[k](xn + dn) - ridge[k](xn - dn)) * h) / (2 * dn * w)
    return clamp(0.5 - slope * sdir * 2.6 + (n1(tab, xn * 6 + k * 3.7) - 0.5) * 0.18)
  }

  /* Hills, far to near. Each layer is clipped to its ridge polygon and painted in vertical strips whose colour comes
     from the slope facing the sun, then grass blades are stamped on top and may poke above the crest. */
  for (let k = 0; k < 5; k++) {
    const hz = clamp(HAZE_K[k] * hazeAmt, 0, 0.92)
    const colorAt = (t: number, depth: number): RGB => {
      let col = mixC(pal.shade, pal.lit, t)
      if (k === 4) col = mixC(col, [28, 26, 18], 0.18)
      return mixC(col, pal.hor, clamp(hz + depth * 0.3 * HAZE_K[k] * hazeAmt))
    }
    const bandPx = (BASE[Math.min(k + 1, 4)] - BASE[k] + (k === 4 ? 0.07 : 0)) * h + AMP[k] * h
    c.save()
    c.beginPath()
    c.moveTo(0, h)
    for (let x = 0; x <= w; x += colW) c.lineTo(x, ridge[k](x / w) * h)
    c.lineTo(w, ridge[k](1) * h)
    c.lineTo(w, h)
    c.closePath()
    c.fillStyle = css(colorAt(0.4, 0.3))
    c.fill()
    c.clip()
    for (let x = 0; x < w; x += colW) {
      const xn = (x + colW / 2) / w
      const yTop = ridge[k](xn) * h
      const t = lit(xn, k)
      const g = c.createLinearGradient(0, yTop, 0, yTop + bandPx)
      g.addColorStop(0, css(mixC(colorAt(t, 0), pal.sun, 0.14 * t)))
      g.addColorStop(0.2, css(colorAt(t, 0.1)))
      g.addColorStop(1, css(colorAt(t * 0.55, 0.9)))
      c.fillStyle = g
      c.fillRect(x, yTop - 1, colW + 0.6, h - yTop + 2)
    }
    c.restore()

    /* Grass blades, binned by colour so each bin is one path and one fill. */
    const len = h * [0.0065, 0.009, 0.0125, 0.02, 0.036][k]
    const bw = Math.max(0.8 * (w / 1000), len * 0.16)
    const areaPx = w * bandPx * 0.8
    const want = (areaPx / ((len * bw) / 2)) * (0.35 + v.grass * 0.75) * 0.55
    const n = Math.round(Math.min(want, k < 3 ? 15000 : 9000))
    const BINS = 12
    const bins: Path2D[] = Array.from({ length: BINS }, () => new Path2D())
    const tips: Path2D[] = Array.from({ length: BINS }, () => new Path2D())
    const used = new Uint8Array(BINS)
    const tipUsed = new Uint8Array(BINS)
    const bnd = BASE[Math.min(k + 1, 4)] - BASE[k]
    for (let i = 0; i < n; i++) {
      const xn = rr()
      const depth = Math.pow(rr(), 0.8)
      const yn = ridge[k](xn) + depth * (bnd + (k === 4 ? 0.07 : 0.02))
      if (k < 4 && yn > ridge[k + 1](xn) + 0.004) continue
      const px = xn * w
      const py = yn * h
      const patch = n2(tab, xn * 9 + k * 11, yn * 14)
      const tt = clamp(lit(xn, k) * 0.62 + patch * 0.34 + (rr() - 0.5) * 0.3 - depth * 0.1)
      const bin = Math.min(BINS - 1, Math.floor(tt * BINS))
      const l = len * (0.6 + rr() * 0.8)
      const lean = 0.28 + (rr() - 0.5) * 0.6
      const tx = px + Math.sin(lean) * l
      const ty = py - Math.cos(lean) * l
      const hw = bw * (0.6 + rr() * 0.6) * 0.5
      const p = bins[bin]
      used[bin] = 1
      p.moveTo(px - hw, py)
      if (k >= 3) {
        p.quadraticCurveTo(px - hw * 0.5 + Math.sin(lean) * l * 0.2, py - l * 0.55, tx, ty)
        p.quadraticCurveTo(px + hw * 0.7 + Math.sin(lean) * l * 0.35, py - l * 0.5, px + hw, py)
      } else {
        p.lineTo(tx, ty)
        p.lineTo(px + hw, py)
      }
      p.closePath()
      if (k >= 3 && tt > 0.4) {
        const q = tips[bin]
        tipUsed[bin] = 1
        const f = 0.45
        const mx = lerp(px, tx, f)
        const my = lerp(py, ty, f)
        q.moveTo(mx - hw * 0.45, my)
        q.lineTo(tx, ty)
        q.lineTo(mx + hw * 0.45, my)
        q.closePath()
      }
    }
    for (let b = 0; b < BINS; b++) {
      const t = (b + 0.5) / BINS
      if (used[b]) {
        c.fillStyle = css(colorAt(t, 0.35))
        c.fill(bins[b])
      }
      if (tipUsed[b]) {
        c.fillStyle = css(mixC(colorAt(clamp(t + 0.16), 0), pal.sun, 0.22))
        c.fill(tips[b])
      }
    }

    if (k === 2 && v.tree) paintTree(c, w, h, ridge[2], pal, sdir, L, tab, rr)
  }

  /* Grain and a faint vignette are baked in, so every export frame carries them. */
  if (v.grain > 0) {
    const pat = c.createPattern(getGrain(v.seed), "repeat")
    if (pat) {
      const sc = Math.max(1, w / 1000)
      pat.setTransform(new DOMMatrix().scale(sc))
      c.save()
      c.globalCompositeOperation = "soft-light"
      c.globalAlpha = 0.1 + v.grain * 0.4
      c.fillStyle = pat
      c.fillRect(0, 0, w, h)
      c.globalCompositeOperation = "overlay"
      c.globalAlpha = 0.03 + v.grain * 0.08
      c.fillRect(0, 0, w, h)
      c.restore()
    }
  }
  const vg = c.createRadialGradient(w / 2, h * 0.52, h * 0.45, w / 2, h * 0.52, Math.max(w, h) * 0.78)
  vg.addColorStop(0, "rgba(40,28,30,0)")
  vg.addColorStop(1, "rgba(40,28,30,.2)")
  c.fillStyle = vg
  c.fillRect(0, 0, w, h)

  /* The hills as a mask (half size): cloud shade is cut to it, so it never lands on the sky. */
  const mw = Math.ceil(w / 2)
  const mh = Math.ceil(h / 2)
  const mask = makeCanvas(mw, mh)
  const m = ctx2(mask)
  m.fillStyle = "#000"
  m.beginPath()
  m.moveTo(0, mh)
  for (let x = 0; x <= mw; x += 2) m.lineTo(x, ridge[0](x / mw) * mh)
  m.lineTo(mw, mh)
  m.closePath()
  m.fill()

  return { canvas, mask, scratch: makeCanvas(mw, mh), ridge, clouds, asp }
}

/** The lone tree: a trunk, a few hundred leaf dots lit from the sun's side, and a long soft shadow on the slope. */
function paintTree(c: Ctx, w: number, h: number, ridge: (x: number) => number, pal: Palette, sdir: number, L: number, tab: Float32Array, rr: () => number) {
  const bx = TREE_X * w
  const by = ridge(TREE_X) * h + 0.004 * h
  const th = 0.14 * h
  const side = sdir >= 0 ? 1 : -1 // +1: the sun is on the left
  /* Shadow first, so the tree stands on it. */
  const len = Math.min(th * (0.9 + (0.14 - sunElev(L)) * 9) * (0.35 + Math.abs(sdir)), 0.3 * w)
  const sc = mixC(pal.shade, [30, 34, 54], 0.55)
  for (let i = 0; i < 4; i++) {
    const f = 1 - i * 0.2
    c.fillStyle = css(sc, 0.12)
    c.beginPath()
    const erx = len * 0.62 * f + th * 0.1
    c.ellipse(bx - side * erx * 0.92, by + th * 0.03, erx, th * 0.06 * f + 1, 0.03 * side, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = css(sc, 0.3)
  c.lineWidth = Math.max(1, th * 0.03)
  c.lineCap = "round"
  c.beginPath()
  c.moveTo(bx, by)
  c.lineTo(bx - side * len * 0.2, by + th * 0.02)
  c.stroke()
  /* Trunk. */
  const trunk = mixC(pal.shade, [34, 24, 18], 0.65)
  const tw = th * 0.04
  c.fillStyle = css(trunk)
  c.beginPath()
  c.moveTo(bx - tw, by)
  c.quadraticCurveTo(bx - tw * 0.55, by - th * 0.3, bx - tw * 0.3, by - th * 0.62)
  c.lineTo(bx + tw * 0.3, by - th * 0.62)
  c.quadraticCurveTo(bx + tw * 0.55, by - th * 0.3, bx + tw, by)
  c.closePath()
  c.fill()
  /* Canopy: dots inside a lumpy ellipse, binned by tone. */
  const cx = bx + (rr() - 0.5) * th * 0.04
  const cy = by - th * 0.76
  const rx = th * 0.36
  const ry = th * 0.27
  const BINS = 8
  const bins: Path2D[] = Array.from({ length: BINS }, () => new Path2D())
  const dark = mixC(pal.shade, [14, 24, 14], 0.55)
  const bright = mixC(mixC(pal.lit, pal.sun, 0.22), [255, 255, 255], 0.04)
  for (let i = 0; i < 520; i++) {
    const a = rr() * Math.PI * 2
    const r = Math.sqrt(rr())
    const wob = 1 + (n1(tab, a * 1.6 + 40) - 0.5) * 0.5
    const x = cx + Math.cos(a) * r * rx * wob
    const y = cy + Math.sin(a) * r * ry * wob * (Math.sin(a) > 0 ? 0.75 : 1)
    const tone = clamp(0.25 + ((cx - x) / rx) * side * 0.34 + (-(y - cy) / ry) * 0.3 + (rr() - 0.5) * 0.5 + (r - 0.5) * 0.12)
    const b = Math.min(BINS - 1, Math.floor(tone * BINS))
    const rad = th * (0.014 + rr() * 0.024)
    bins[b].moveTo(x + rad, y)
    bins[b].arc(x, y, rad, 0, Math.PI * 2)
  }
  for (let b = 0; b < BINS; b++) {
    c.fillStyle = css(mixC(dark, bright, (b + 0.5) / BINS))
    c.fill(bins[b])
  }
  /* Branch stubs under the canopy. */
  c.strokeStyle = css(trunk)
  c.lineWidth = Math.max(1, th * 0.016)
  c.beginPath()
  c.moveTo(bx, by - th * 0.55)
  c.lineTo(bx - th * 0.1, by - th * 0.68)
  c.moveTo(bx, by - th * 0.58)
  c.lineTo(bx + th * 0.12, by - th * 0.7)
  c.stroke()
}

/* -------------------------------------------------------------------------- */
/*                                   The frame                                */
/* -------------------------------------------------------------------------- */

function shadeAt(sc: Scene, V: V, u: number, x: number, y: number) {
  let s = 0
  for (const c of sc.clouds) {
    const cx = cloudX(c, u)
    for (const l of c.lumps) {
      const d = Math.hypot((x - cx - l.dx * c.rx * 0.6) / (c.rx * l.s), (y - c.cy - l.dy * c.ry) / (c.ry * l.s))
      s = Math.max(s, 1 - smooth(0.45, 1, d))
    }
  }
  return s * V.shadows
}

const getStore = (): Store => new Map()
const moduleStore = getStore()

function scene(store: Store, w: number, h: number, v: V, s: number, q: number): Scene {
  const bw = Math.max(2, Math.round(w * s * q))
  const bh = Math.max(2, Math.round(h * s * q))
  const key = [bw, bh, v.seed, Math.round(v.light * 400), v.tree ? 1 : 0, v.grass, v.grain, v.haze, v.tint?.join(",") ?? ""].join("|")
  const hit = store.get(key)
  if (hit) {
    store.delete(key)
    store.set(key, hit)
    return hit
  }
  const sc = bake(bw, bh, v)
  store.set(key, sc)
  while (store.size > 4) store.delete(store.keys().next().value as string)
  return sc
}

function cloudsLayer(c: Ctx, w: number, h: number, sc: Scene, V: V, u: number, pal: Palette) {
  if (V.shadows < 0.02) return
  /* Sky clouds: soft lumps with a flat, slightly cooler underside. */
  for (const cl of sc.clouds) {
    const cx = cloudX(cl, u) * w
    const cy = cl.sky * h
    for (const l of cl.lumps) {
      const lx = cx + l.dx * cl.rx * 0.6 * w
      const ly = cy + l.dy * cl.ry * h * 0.9
      const r = cl.rx * w * l.s * 0.5
      c.save()
      c.translate(lx, ly)
      c.scale(1, 0.5)
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r)
      g.addColorStop(0, css(pal.cloud, 0.8 * V.shadows))
      g.addColorStop(0.55, css(pal.cloud, 0.45 * V.shadows))
      g.addColorStop(1, css(pal.cloud, 0))
      c.fillStyle = g
      c.beginPath()
      c.arc(0, 0, r, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
  }
  /* Cloud shade on the ground, drawn small and soft, cut to the hills, then multiplied on. */
  const sr = sc.scratch
  const s = ctx2(sr)
  const sw = sr.width
  const sh = sr.height
  s.save()
  s.setTransform(1, 0, 0, 1, 0, 0)
  s.globalCompositeOperation = "source-over"
  s.clearRect(0, 0, sw, sh)
  for (const cl of sc.clouds) {
    const cx = cloudX(cl, u) * sw
    for (const l of cl.lumps) {
      const rx = cl.rx * sw * l.s
      const ry = cl.ry * sh * l.s
      s.save()
      s.translate(cx + l.dx * cl.rx * 0.6 * sw, cl.cy * sh + l.dy * cl.ry * sh)
      s.scale(1, ry / rx)
      const g = s.createRadialGradient(0, 0, 0, 0, 0, rx)
      g.addColorStop(0, css(pal.shadow, 0.26 * V.shadows))
      g.addColorStop(0.45, css(pal.shadow, 0.15 * V.shadows))
      g.addColorStop(1, css(pal.shadow, 0))
      s.fillStyle = g
      s.beginPath()
      s.arc(0, 0, rx, 0, Math.PI * 2)
      s.fill()
      s.restore()
    }
  }
  s.globalCompositeOperation = "destination-in"
  s.drawImage(sc.mask as CanvasImageSource, 0, 0)
  s.restore()
  c.save()
  c.globalCompositeOperation = "multiply"
  c.imageSmoothingEnabled = true
  c.drawImage(sr as CanvasImageSource, 0, 0, w, h)
  c.restore()
}

function walkerLayer(c: Ctx, w: number, h: number, sc: Scene, V: V, u: number, pal: Palette) {
  const a = smooth(0, 0.08, u) * (1 - smooth(0.92, 1, u))
  if (a <= 0.01) return
  const xn = lerp(WALK_FROM, WALK_TO, u)
  const x = xn * w
  const y = sc.ridge[2](xn) * h + 0.0045 * h
  const hh = 0.034 * h
  const side = sunSide(V.light) >= 0 ? 1 : -1
  const sh = shadeAt(sc, V, u, xn, sc.ridge[2](xn) - 0.02)
  const sun = 1 - sh
  const phase = (x / (hh * 0.74)) * Math.PI
  const swing = 0.52 * Math.sin(phase)
  const bob = Math.abs(Math.sin(phase)) * hh * 0.014
  const body = mixC([40, 31, 27], [30, 34, 48], sh * 0.7)
  const coat = mixC([176, 82, 52], [120, 70, 70], sh * 0.8)
  const rim = mixC(pal.sun, [255, 255, 255], 0.3)

  c.save()
  c.globalAlpha = a
  c.lineCap = "round"
  c.lineJoin = "round"
  /* Cast shadow: gone while a cloud covers the walker, back as it passes. */
  if (sun > 0.04) {
    const len = hh * (1.1 + (0.14 - sunElev(V.light)) * 12) * (0.4 + Math.abs(sunSide(V.light)))
    c.strokeStyle = css(mixC(pal.shade, [20, 24, 40], 0.6), 0.34 * sun)
    c.lineWidth = hh * 0.1
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x - side * len, y + hh * 0.05)
    c.stroke()
    c.lineWidth = hh * 0.2
    c.globalAlpha = a * 0.35
    c.beginPath()
    c.moveTo(x - side * len * 0.9, y + hh * 0.045)
    c.lineTo(x - side * len, y + hh * 0.05)
    c.stroke()
    c.globalAlpha = a
  }
  const fig = (dx: number, tone: (own: RGB) => RGB) => {
    const hipX = x + dx
    const hipY = y - hh * 0.5 - bob
    const shX = hipX + hh * 0.045
    const shY = y - hh * 0.83 - bob
    c.strokeStyle = css(tone(body))
    c.lineWidth = hh * 0.1
    for (const sgn of [1, -1]) {
      const ang = swing * sgn
      c.beginPath()
      c.moveTo(hipX, hipY)
      c.lineTo(hipX + Math.sin(ang) * hh * 0.5, hipY + Math.cos(ang) * hh * 0.5)
      c.stroke()
    }
    c.strokeStyle = css(tone(coat))
    c.lineWidth = hh * 0.17
    c.beginPath()
    c.moveTo(hipX, hipY)
    c.lineTo(shX, shY)
    c.stroke()
    c.strokeStyle = css(tone(coat))
    c.lineWidth = hh * 0.065
    c.beginPath()
    c.moveTo(shX, shY + hh * 0.02)
    c.lineTo(shX - Math.sin(swing * 0.9) * hh * 0.34, shY + Math.cos(swing * 0.9) * hh * 0.3)
    c.stroke()
    c.fillStyle = css(tone(body))
    c.beginPath()
    c.arc(shX + hh * 0.03, shY - hh * 0.09, hh * 0.075, 0, Math.PI * 2)
    c.fill()
  }
  if (sun > 0.04) {
    c.globalAlpha = a * 0.55 * sun
    fig(side * hh * 0.045, () => rim)
    c.globalAlpha = a
  }
  fig(0, (own) => own)
  c.restore()
}

/** One frame of the scene. `t` is in seconds; the loop is GOLDEN_HILLS_DURATION long. */
function frame(ctx: Ctx, w: number, h: number, t: number, vals: Record<string, unknown> | undefined, store: Store, q: number, over?: Partial<V>) {
  const V = normalize(vals, over)
  const tr = ctx.getTransform()
  const s = Math.max(0.01, Math.hypot(tr.a, tr.b))
  const sc = scene(store, w, h, V, s, q)
  const pal = palette(V.light, V.tint)
  const u = frac(t / GOLDEN_HILLS_DURATION + U0)
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(sc.canvas as CanvasImageSource, 0, 0, w, h)
  cloudsLayer(ctx, w, h, sc, V, u, pal)
  if (V.walker) walkerLayer(ctx, w, h, sc, V, u, pal)
  ctx.restore()
}

/**
 * Pure drawing function for the Studio exporter: paints frame `t` of the scene into `ctx` at w×h.
 * `values`: light, tree, walker, grass, shadows, grain, haze, seed, tint.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Record<string, unknown>) {
  frame(ctx, w, h, t, values, moduleStore, 1)
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

const ANCHORS: { id: GoldenHillsLight; label: string; at: number }[] = [
  { id: "morning", label: "Morning", at: 0.04 },
  { id: "golden", label: "Golden hour", at: 0.3 },
  { id: "dusk", label: "Dusk", at: 0.86 },
]
const nameOf = (L: number): GoldenHillsLight => ANCHORS.reduce((a, b) => (Math.abs(b.at - L) < Math.abs(a.at - L) ? b : a)).id
const anchorIndex = (L: number) => {
  if (L <= ANCHORS[0].at) return 0
  if (L >= ANCHORS[2].at) return 2
  const i = L < ANCHORS[1].at ? 0 : 1
  return i + (L - ANCHORS[i].at) / (ANCHORS[i + 1].at - ANCHORS[i].at)
}
const INTRO_FROM = 0.12
const INTRO_SECONDS = 7

/**
 * GoldenHills – grassy hills under a low sun with a lone tree and a tiny walker. Cloud shadows drift over the
 * slopes; one passes over the walker, who keeps on walking. Drag the scene (or use the arrow keys) to move the sun.
 *
 *   <GoldenHills />
 */
export function GoldenHills({
  speed = 1,
  paused,
  values,
  seed,
  size,
  time,
  canvasRef,
  light: lightProp,
  defaultLight = 0.3,
  onLightChange,
  tree,
  walker,
  grass,
  shadows,
  grain,
  haze,
  controls = true,
  label = "Golden hills at low sun with a lone tree and a tiny walker. Drag or use the arrow keys to move the sun.",
  className,
}: GoldenHillsProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const studio = !!size || time !== undefined
  const controlled = typeof lightProp === "number" || typeof values?.light === "number"
  const controlledLight = typeof lightProp === "number" ? lightProp : (values?.light as number | undefined)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const inkRef = React.useRef<HTMLElement>(null)
  const storeRef = React.useRef<Store>(getStore())

  const introOn = !controlled && !studio && !reduced
  const [lightUi, setLightUi] = React.useState(() => (controlled ? clamp(controlledLight ?? 0.3) : introOn ? INTRO_FROM : clamp(defaultLight)))

  /* Everything the engine needs, kept current without re-running the effect. */
  const live = React.useRef({
    speed, paused: !!paused, reduced, time, light: lightUi, controlled, studio, introOn,
    over: {} as Partial<V>, vals: values as Record<string, unknown> | undefined, onLightChange,
  })
  const over: Partial<V> = {}
  if (typeof seed === "number") over.seed = Math.round(seed)
  if (typeof tree === "boolean") over.tree = tree
  if (typeof walker === "boolean") over.walker = walker
  if (typeof grass === "number") over.grass = clamp(grass)
  if (typeof shadows === "number") over.shadows = clamp(shadows)
  if (typeof grain === "number") over.grain = clamp(grain)
  if (typeof haze === "number") over.haze = clamp(haze)
  live.current.over = over
  live.current.vals = values
  live.current.speed = speed
  live.current.paused = !!paused
  live.current.reduced = reduced
  live.current.time = time
  live.current.studio = studio
  live.current.controlled = controlled
  live.current.onLightChange = onLightChange
  if (controlled) live.current.light = clamp(controlledLight ?? 0.3)

  const ctl = React.useRef<{ update: () => void; set: (L: number, how: "jump" | "ease" | "drag") => void; touch: () => void } | null>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const card = cardRef.current
    const cv = cvRef.current
    if (!root || !card || !cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const L = live.current
    let raf = 0
    let last = 0
    let clock = 0
    let visible = true
    let pw = 0
    let ph = 0
    let q = 1
    let settle = 0
    let demo = L.introOn
    let anim: { from: number; to: number; start: number; dur: number } | null = null
    let uiL = L.light
    let lastFrame = 0

    const syncUi = (force = false) => {
      if (force || Math.abs(L.light - uiL) > 0.01) {
        uiL = L.light
        setLightUi(L.light)
      }
      inkRef.current?.style.setProperty("--ghl-i", anchorIndex(L.light).toFixed(3))
      card.setAttribute("aria-valuenow", String(Math.round(L.light * 100)))
      card.setAttribute("aria-valuetext", ANCHORS.find((a) => a.id === nameOf(L.light))?.label ?? "")
    }
    const paint = () => {
      if (!pw || !ph) return
      const t = L.time !== undefined ? L.time : L.reduced ? (MOMENT - U0) * GOLDEN_HILLS_DURATION : clock
      const vals = { ...(L.vals ?? {}), light: L.light }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, pw, ph)
      frame(ctx, pw, ph, t, vals, storeRef.current, q, L.over)
    }
    const shouldRun = () => visible && !document.hidden && L.time === undefined && ((!L.paused && !L.reduced) || anim !== null)
    const setLight = (v: number, moving: boolean) => {
      L.light = clamp(v)
      if (moving) {
        q = 0.5
        clearTimeout(settle)
        settle = window.setTimeout(() => {
          q = 1
          paint()
        }, 160)
      }
      syncUi()
    }
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (!L.paused && !L.reduced) clock += dt * L.speed
      if (anim) {
        const k = clamp((now - anim.start) / anim.dur)
        setLight(lerp(anim.from, anim.to, 1 - Math.pow(1 - k, 3)), k < 1)
        if (k >= 1) {
          anim = null
          syncUi(true)
        }
      } else if (demo && !L.controlled) {
        const k = clamp(clock / INTRO_SECONDS)
        setLight(lerp(INTRO_FROM, defaultLight, 1 - Math.pow(1 - k, 3)), k < 1)
        if (k >= 1) {
          demo = false
          syncUi(true)
        }
      }
      if (now - lastFrame >= 30) {
        lastFrame = now
        paint()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
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
      if (L.reduced && demo) {
        demo = false
        setLight(defaultLight, false)
        syncUi(true)
      }
      paint()
    }
    ctl.current = {
      update,
      touch: () => {
        demo = false // the scripted intro never comes back
        anim = null
      },
      set: (v, how) => {
        demo = false
        if (how === "ease" && !L.reduced) {
          anim = { from: L.light, to: v, start: performance.now(), dur: 700 }
        } else {
          anim = null
          setLight(v, how === "drag")
          if (how === "jump") {
            q = 1
            syncUi(true)
          }
        }
        update()
        paint()
      },
    }

    const fit = () => {
      const r = cv.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const f = Math.min(dpr, 2200 / Math.max(1, r.width))
      pw = Math.max(1, Math.round(r.width * f))
      ph = Math.max(1, Math.round(r.height * f))
      cv.width = pw
      cv.height = ph
      paint()
    }
    const ro = new ResizeObserver(() => {
      fit()
      update()
    })
    ro.observe(cv)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    syncUi(true)
    update()

    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(settle)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Props changed: repaint (and start or stop the loop). */
  const valuesKey = JSON.stringify(values ?? {}) + JSON.stringify(over) + String(controlledLight)
  React.useEffect(() => {
    ctl.current?.update()
  }, [valuesKey, paused, reduced, time, speed, size?.w, size?.h])

  const setCv = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef && typeof canvasRef === "object") (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  /* Direct manipulation: drag the scene, arrow keys, or a button. */
  const emit = (v: number) => live.current.onLightChange?.(v, ANCHORS.some((a) => Math.abs(a.at - v) < 0.012) ? nameOf(v) : "custom")
  const drag = React.useRef<{ x: number; l: number; id: number } | null>(null)
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (studio || e.button !== 0) return
    ctl.current?.touch()
    drag.current = { x: e.clientX, l: live.current.light, id: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.setAttribute("data-drag", "")
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const v = clamp(d.l + ((e.clientX - d.x) / Math.max(1, e.currentTarget.clientWidth)) * 1.1)
    ctl.current?.set(v, "drag")
    emit(v)
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.removeAttribute("data-drag")
    ctl.current?.set(live.current.light, "jump")
  }
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (studio) return
    const step = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.04 : e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.04 : e.key === "PageUp" ? 0.15 : e.key === "PageDown" ? -0.15 : 0
    let v: number | null = null
    if (step) v = clamp(live.current.light + step)
    else if (e.key === "Home") v = 0
    else if (e.key === "End") v = 1
    if (v === null) return
    e.preventDefault()
    ctl.current?.touch()
    ctl.current?.set(v, "jump")
    emit(v)
  }
  const pick = (a: (typeof ANCHORS)[number]) => {
    ctl.current?.touch()
    ctl.current?.set(a.at, "ease")
    emit(a.at)
  }

  const styleBox = size ? ({ width: size.w, height: size.h } as React.CSSProperties) : undefined
  const active = nameOf(lightUi)

  return (
    <div ref={rootRef} className={["ghl", className].filter(Boolean).join(" ")} data-studio={studio ? "" : undefined} style={styleBox}>
      <style href="golden-hills" precedence="default">
        {CSS}
      </style>
      <div
        ref={cardRef}
        className="ghl-card"
        role="slider"
        tabIndex={studio ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(lightUi * 100)}
        aria-valuetext={ANCHORS.find((a) => a.id === active)?.label}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <canvas ref={setCv} className="ghl-cv" aria-hidden />
      </div>
      {controls && !studio && (
        <div className="ghl-bar">
          <div className="ghl-seg" role="group" aria-label="Time of day">
            {ANCHORS.map((a) => (
              <button key={a.id} type="button" className="ghl-btn" aria-pressed={active === a.id} onClick={() => pick(a)}>
                {a.label}
              </button>
            ))}
            <i ref={inkRef} className="ghl-ink" style={{ "--ghl-i": anchorIndex(lightUi) } as React.CSSProperties} />
          </div>
          <p className="ghl-hint">Drag the scene to move the sun</p>
        </div>
      )}
    </div>
  )
}
