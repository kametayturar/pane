"use client"

import * as React from "react"

import { rng } from "@/studio/schema"
import type { StudioPieceProps } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ColumnCubeProps = StudioPieceProps & {
  /** Columns along each side of the block. Default 9. */
  grid?: number
  /** 0 = flat top, 1 = very uneven heights. Default 0.7. */
  variance?: number
  /** Side, in columns, of the corner that is cut away to show the layer. Default 5. */
  cut?: number
  /** Thickness of the coloured layer, in column widths. Default 0.7. */
  layerHeight?: number
  /** Cells the scan finds, as [column, row] pairs inside the cut. Leave out for a seeded pick. */
  selected?: [number, number][]
  /** Called when the selection changes by a click or the keyboard. */
  onSelect?: (cells: [number, number][]) => void
  /** Called when a scan starts (click on the block, Scan button, S key). */
  onScan?: () => void
  /** Accessible description of the picture. */
  label?: string
  /** Width / height of the picture. Default 1.5; below 520px wide it turns taller by itself. */
  aspect?: number
  className?: string
}

export type DrawValues = {
  grid?: number
  variance?: number
  cut?: number
  layerHeight?: number
  /** How many cells the seeded pick finds. */
  found?: number
  seed?: number
  ink?: string
  accent?: string
  /** Paper colour. Faces are mixed with it; the artboard is filled with it when `fill` is true. */
  bg?: string
  fill?: boolean
  /** Explicit selection as cell indexes (j * grid + i). */
  selection?: number[]
  /** Per-cell lift 0..1 (index j * grid + i). Without it the lifts follow the looping scan at t. */
  lifts?: ArrayLike<number>
  /** Scan head in column units, or null for none; `sheen` fades the trail 0..1. */
  scan?: { head: number; sheen: number } | null
  /** Keyboard cursor cell. */
  cursor?: [number, number] | null
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number]

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

function hash(n: number) {
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d)
  n = Math.imul(n ^ (n >>> 12), 0x297a2d39)
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const h = (i: number, j: number) => hash((i * 374761393 + j * 668265263 + seed * 2246822519) | 0)
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v)
}

function parseColor(c: unknown, fallback: RGB): RGB {
  if (typeof c !== "string") return fallback
  const s = c.trim()
  let m = /^#([0-9a-f]{3,8})$/i.exec(s)
  if (m) {
    let h = m[1]
    if (h.length < 6) h = h.split("").map((ch) => ch + ch).join("")
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(s)
  if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255]
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s)
  if (m) return [+m[1], +m[2], +m[3]]
  return fallback
}
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
const lum = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

/* -------------------------------------------------------------------------- */
/*                                   Scene                                    */
/* -------------------------------------------------------------------------- */

/** Layer sits between ZB and ZB + layerHeight, measured from the base, in column widths. */
const ZB = 0.55
const INSET = 0.045
const CAP = 0.55
const LIFT = 1.25

export type Cell = { i: number; j: number; top: number; floor: boolean; wallI: boolean; wallJ: boolean }

export type Scene = { n: number; cut: number; zb: number; zt: number; cells: Cell[]; zmax: number; floors: number[] }

const sceneCache = new Map<string, Scene>()
/** The block is built once per (seed, grid, variance, cut, layer) and cached. */
export function buildScene(n: number, variance: number, cut: number, layerH: number, seed: number): Scene {
  const key = `${n}|${variance.toFixed(2)}|${cut}|${layerH.toFixed(2)}|${seed}`
  const hit = sceneCache.get(key)
  if (hit) return hit
  const zt = ZB + layerH
  const cells: Cell[] = []
  let zmax = 0
  const c0 = n - cut
  const floors: number[] = []
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const floor = i >= c0 && j >= c0
      const r = rng(seed * 977 + j * 131 + i * 17 + 3)
      let top: number
      if (floor) {
        const q = Math.round((0.34 + (layerH - 0.34) * r()) * 10) / 10
        top = Math.min(zt, ZB + Math.max(0.3, q))
        floors.push(j * n + i)
      } else {
        const k = vnoise(i * 0.42 + 1.3, j * 0.42 + 4.1, seed) * 0.72 + r() * 0.28
        const slope = 1 + 0.18 * (1 - (i + j) / (2 * n))
        top = (zt + 0.55 + variance * 2.3 * Math.pow(k, 1.25)) * slope
        top = Math.round(top * 4) / 4
      }
      zmax = Math.max(zmax, top)
      cells.push({ i, j, top, floor, wallI: !floor && j >= c0 && i === c0 - 1, wallJ: !floor && i >= c0 && j === c0 - 1 })
    }
  }
  const scene = { n, cut, zb: ZB, zt, cells, zmax, floors }
  if (sceneCache.size > 20) sceneCache.clear()
  sceneCache.set(key, scene)
  return scene
}

/** The seeded pick: some cells of the layer, the same for the same seed. */
export function pickSelection(scene: Scene, count: number, seed: number): number[] {
  const rand = rng(seed * 31 + 11)
  const pool = scene.floors.slice()
  for (let k = pool.length - 1; k > 0; k--) {
    const m = Math.floor(rand() * (k + 1))
    ;[pool[k], pool[m]] = [pool[m], pool[k]]
  }
  return pool.slice(0, Math.min(pool.length, Math.max(0, Math.round(count)))).sort((a, b) => a - b)
}

/** Seconds in one seamless loop. */
export const LOOP = 10
const SWEEP = { a: 0.9, b: 5.0 }
const LOWER = { a: 7.1, b: 8.8 }

/** Where the scan head is at loop time t (column units), and how much trail it still leaves. */
export function scanAt(t: number, n: number): { head: number; sheen: number } | null {
  const u = ((t % LOOP) + LOOP) % LOOP
  if (u < SWEEP.a || u > 6.6) return null
  const q = clamp((u - SWEEP.a) / (SWEEP.b - SWEEP.a))
  const p = 1 - Math.pow(1 - q, 1.8)
  return { head: -1 + (n + 3.4) * p, sheen: 1 - smooth(5.0, 6.6, u) }
}

/** Lift of a cell in the looping demo: up as the head passes, down in a short stagger, back to rest. */
export function liftAt(t: number, n: number, i: number): number {
  const u = ((t % LOOP) + LOOP) % LOOP
  const s = scanAt(u, n)
  const head = u > SWEEP.b ? n + 2.4 : s ? s.head : -9
  const up = easeOut((head - (i + 0.5)) / 1.6)
  const q = clamp((u - LOWER.a) / (LOWER.b - LOWER.a))
  const delay = (1 - i / n) * 0.32
  const down = easeOut((q - delay) / 0.62)
  return up * (1 - down)
}

/** A still that reads as the moment: the scan has just gone through and the cells are up. */
export const STILL_T = 4.55

/* -------------------------------------------------------------------------- */
/*                                  Drawing                                   */
/* -------------------------------------------------------------------------- */

type Layout = { u: number; ox: number; oy: number; vz: number; proj: (i: number, j: number, z: number) => [number, number] }

function layoutFor(w: number, h: number, scene: Scene): Layout {
  const n = scene.n
  const ztot = scene.zmax + LIFT * 0.75 + 0.1
  const u = Math.min((w * 0.9) / (n * 1.732), (h * 0.88) / (n + ztot * 0.96))
  const vz = u * 0.96
  const ox = w / 2
  const oy = h / 2 - (n * u - ztot * vz) / 2 + h * 0.012
  return {
    u, ox, oy, vz,
    proj: (i, j, z) => [ox + (i - j) * u * 0.866, oy + (i + j) * u * 0.5 - z * vz],
  }
}

type Palette = {
  paper: RGB; ink: RGB; accent: RGB; dark: boolean
  grey: [RGB, RGB, RGB]
  hot: [RGB, RGB, RGB]
  layer: [RGB, RGB, RGB]
}

function palette(inkC: RGB, accentC: RGB, paper: RGB): Palette {
  const dark = lum(paper) < 0.5
  const k = dark ? [0.28, 0.16, 0.085] : [0.075, 0.165, 0.275]
  const grey = k.map((x) => mix(paper, inkC, x)) as [RGB, RGB, RGB]
  const white: RGB = [255, 255, 255]
  const black: RGB = [0, 0, 0]
  const hot: [RGB, RGB, RGB] = [mix(accentC, white, dark ? 0.22 : 0.2), accentC, mix(accentC, black, dark ? 0.3 : 0.22)]
  const layer = hot.map((c) => mix(paper, c, dark ? 0.5 : 0.52)) as [RGB, RGB, RGB]
  return { paper, ink: inkC, accent: accentC, dark, grey, hot, layer }
}

/**
 * One pure function draws any frame of the block: columns in painter's order, a corner cut away to show a coloured layer,
 * a scan that lights the columns it crosses and lifts the cells it finds. t is seconds on the LOOP.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: DrawValues = {}) {
  const n = Math.round(clamp(values.grid ?? 9, 4, 16))
  const cut = Math.round(clamp(values.cut ?? 5, 2, n - 2))
  const layerH = clamp(values.layerHeight ?? 0.7, 0.45, 1.1)
  const variance = clamp(values.variance ?? 0.7)
  const seed = (values.seed ?? 4821) | 0
  const scene = buildScene(n, variance, cut, layerH, seed)
  const sel = new Set(values.selection ?? pickSelection(scene, values.found ?? Math.max(3, Math.round(cut * cut * 0.3)), seed))
  const paper = parseColor(values.bg, [255, 255, 255])
  const pal = palette(parseColor(values.ink, [0, 0, 0]), parseColor(values.accent, [0, 96, 226]), paper)
  const L = layoutFor(w, h, scene)
  const { proj, u } = L
  const scan = values.scan !== undefined ? values.scan : scanAt(t, n)

  ctx.save()
  ctx.clearRect(0, 0, w, h)
  if (values.fill) {
    ctx.fillStyle = css(paper)
    ctx.fillRect(0, 0, w, h)
  }
  ctx.lineJoin = "round"

  const poly = (pts: [number, number][], fill: string, stroke?: string) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1])
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = Math.max(0.6, u * 0.012)
      ctx.stroke()
    }
  }

  // Ground: a flat slab under the block, so the hairline gaps between columns read as shadow, not as holes.
  {
    const g = 0.0
    const a = proj(-g, -g, 0), b = proj(n + g, -g, 0), c = proj(n + g, n + g, 0), d = proj(-g, n + g, 0)
    const thick = 0.14
    const b2 = proj(n + g, -g, -thick), c2 = proj(n + g, n + g, -thick), d2 = proj(-g, n + g, -thick)
    poly([d, c, c2, d2], css(mix(paper, pal.ink, pal.dark ? 0.1 : 0.24)))
    poly([c, b, b2, c2], css(mix(paper, pal.ink, pal.dark ? 0.06 : 0.34)))
    poly([a, b, c, d], css(mix(paper, pal.ink, pal.dark ? 0.12 : 0.115)))
    // Soft shadow beyond the slab, to the lower right.
    ctx.fillStyle = css(pal.ink, pal.dark ? 0.18 : 0.045)
    const s = 0.5
    const e1 = proj(n + s, 0.6, -thick), e2 = proj(n + s, n + s, -thick), e3 = proj(0.6, n + s, -thick)
    ctx.beginPath()
    ctx.moveTo(...b2); ctx.lineTo(...e1); ctx.lineTo(...e2); ctx.lineTo(...e3); ctx.lineTo(...d2); ctx.lineTo(...c2); ctx.closePath()
    ctx.fill()
  }

  const hairline = css(pal.paper, 0.55)
  const sheenOf = (i: number) => {
    if (!scan) return 0
    const x = i + 0.5
    const d = scan.head - x
    if (d < -0.9) return 0
    if (Math.abs(d) <= 0.5) return 1 * Math.min(1, 0.4 + scan.sheen)
    if (d < 0) return Math.max(0, 1 - (-d - 0.5) / 0.4) * 0.5
    return Math.exp(-(d - 0.5) / 1.9) * 0.5 * scan.sheen
  }

  const order = scene.cells.slice().sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i)
  for (const c of order) {
    const idx = c.j * n + c.i
    const x0 = c.i + INSET, x1 = c.i + 1 - INSET, y0 = c.j + INSET, y1 = c.j + 1 - INSET
    const picked = c.floor && sel.has(idx)
    const lift = picked ? clamp(values.lifts ? values.lifts[idx] ?? 0 : liftAt(t, n, c.i)) : 0
    const hotK = easeOut(lift * 1.4)
    const sh = sheenOf(c.i)
    const exposedI = c.floor || c.wallI
    const exposedJ = c.floor || c.wallJ
    // A body from the ground up; for a picked cell the top slice (the cap) separates and rises.
    const bodyTop = picked && lift > 0.002 ? c.top - CAP : c.top

    const tone = (kind: "g" | "l", side: 0 | 1 | 2, hot: number) => {
      let col = kind === "g" ? pal.grey[side] : pal.layer[side]
      if (hot > 0) col = mix(col, pal.hot[side], hot)
      if (sh > 0) col = mix(col, pal.hot[side], sh * (side === 0 ? 0.62 : 0.4) * (kind === "g" ? 0.9 : 0.55))
      return css(col)
    }

    const wall = (side: 1 | 2, za: number, zbtm: number, exposed: boolean, hot: number) => {
      // Splits a wall between za and zbtm at the layer planes: grey, layer, grey.
      const cuts = exposed ? [za, Math.max(za, Math.min(zbtm, scene.zb)), Math.max(za, Math.min(zbtm, scene.zt)), zbtm] : [za, zbtm]
      for (let k = 0; k < cuts.length - 1; k++) {
        const lo = cuts[k], hi = cuts[k + 1]
        if (hi - lo < 1e-4) continue
        const kind: "g" | "l" = exposed && k === 1 ? "l" : "g"
        const pts: [number, number][] =
          side === 1
            ? [proj(x1, y0, lo), proj(x1, y1, lo), proj(x1, y1, hi), proj(x1, y0, hi)]
            : [proj(x0, y1, lo), proj(x1, y1, lo), proj(x1, y1, hi), proj(x0, y1, hi)]
        poly(pts, tone(kind, side, hot), hairline)
      }
    }
    const box = (z0: number, z1: number, hot: number, topKind: "g" | "l") => {
      wall(1, z0, z1, exposedI, hot)
      wall(2, z0, z1, exposedJ, hot)
      poly([proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)], tone(topKind, 0, hot), hairline)
    }

    const topKind: "g" | "l" = c.floor ? "l" : "g"
    box(0, bodyTop, 0, topKind)
    if (picked && lift > 0.002) {
      // Shadow of the cap on the cell below it, then the cap itself.
      const k = (1 - lift * 0.5) * lift
      const m = 0.12
      poly(
        [proj(x0 + m, y0 + m, bodyTop), proj(x1 - m, y0 + m, bodyTop), proj(x1 - m, y1 - m, bodyTop), proj(x0 + m, y1 - m, bodyTop)],
        css(pal.ink, (pal.dark ? 0.38 : 0.2) * k),
      )
      const z0 = bodyTop + lift * LIFT
      box(z0, z0 + CAP, Math.max(hotK, 0.0001), "l")
    }
  }

  // Keyboard cursor: an outline on the top of the cell.
  if (values.cursor) {
    const [ci, cj] = values.cursor
    const cell = scene.cells[cj * n + ci]
    if (cell) {
      const lf = sel.has(cj * n + ci) ? clamp(values.lifts ? values.lifts[cj * n + ci] ?? 0 : liftAt(t, n, ci)) : 0
      const z = cell.top + lf * LIFT
      const m = 0.02
      ctx.strokeStyle = css(pal.ink, 0.88)
      ctx.lineWidth = Math.max(1.5, u * 0.035)
      ctx.beginPath()
      const p = [proj(ci + m, cj + m, z), proj(ci + 1 - m, cj + m, z), proj(ci + 1 - m, cj + 1 - m, z), proj(ci + m, cj + 1 - m, z)]
      ctx.moveTo(...p[0]); for (let k = 1; k < 4; k++) ctx.lineTo(...p[k]); ctx.closePath()
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** The cell under a point of the picture (layer cells only), for clicks. Uses the same projection as draw. */
export function pickCell(w: number, h: number, values: DrawValues, x: number, y: number): [number, number] | null {
  const n = Math.round(clamp(values.grid ?? 9, 4, 16))
  const cut = Math.round(clamp(values.cut ?? 5, 2, n - 2))
  const scene = buildScene(n, clamp(values.variance ?? 0.7), cut, clamp(values.layerHeight ?? 0.7, 0.45, 1.1), (values.seed ?? 4821) | 0)
  const { proj } = layoutFor(w, h, scene)
  const inPoly = (pts: [number, number][]) => {
    let inside = false
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      const [xa, ya] = pts[a], [xb, yb] = pts[b]
      if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside
    }
    return inside
  }
  const order = scene.cells.filter((c) => c.floor).sort((a, b) => b.i + b.j - (a.i + a.j))
  for (const c of order) {
    const lf = values.lifts ? clamp(values.lifts[c.j * n + c.i] ?? 0) * LIFT : 0
    const zt = c.top + lf
    const zl = Math.max(0, c.top - 0.9)
    const x0 = c.i, x1 = c.i + 1, y0 = c.j, y1 = c.j + 1
    if (
      inPoly([proj(x0, y0, zt), proj(x1, y0, zt), proj(x1, y1, zt), proj(x0, y1, zt)]) ||
      inPoly([proj(x1, y0, zl), proj(x1, y1, zl), proj(x1, y1, zt), proj(x1, y0, zt)]) ||
      inPoly([proj(x0, y1, zl), proj(x1, y1, zl), proj(x1, y1, zt), proj(x0, y1, zt)])
    )
      return [c.i, c.j]
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ccb {
  --ccb-ink: #000;
  --ccb-surface: #fff;
  --ccb-accent: #0060e2;
  --ccb-t1: color-mix(in oklab, var(--ccb-ink) 88%, transparent);
  --ccb-t2: color-mix(in oklab, var(--ccb-ink) 61%, transparent);
  --ccb-t3: color-mix(in oklab, var(--ccb-ink) 45%, transparent);
  --ccb-fill: color-mix(in oklab, var(--ccb-ink) 6%, transparent);
  --ccb-ease: cubic-bezier(.22, 1, .36, 1);
  --ccb-aspect: 1.5;
  position: relative; container-type: inline-size; width: 100%;
  font: 13px/20px var(--ccb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--ccb-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ccb { --ccb-ink: #fff; --ccb-surface: #1c1c1e; --ccb-accent: #4d8dff; --ccb-fill: color-mix(in oklab, var(--ccb-ink) 8%, transparent) }
html[data-style="mono"] .ccb { --ccb-ink: #000; --ccb-accent: #000; --ccb-ease: cubic-bezier(.2, .9, .1, 1); --ccb-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace }
html[data-style="mono"].dark .ccb { --ccb-ink: #fff; --ccb-accent: #fff }
html[data-style="glass"] .ccb {
  --ccb-ink: var(--pane-ink); --ccb-accent: var(--pane-accent); --ccb-ease: var(--pane-ease); --ccb-font: var(--pane-font);
  --ccb-t1: var(--pane-t1); --ccb-t2: var(--pane-t2); --ccb-t3: var(--pane-t3);
}
.ccb *, .ccb *::before, .ccb *::after { box-sizing: border-box }
:where(.ccb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.ccb) p { margin: 0 }

.ccb-fig { position: relative; aspect-ratio: var(--ccb-aspect); border-radius: 12px; outline: none; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.ccb-fig:focus-visible { outline: 2px solid var(--ccb-accent); outline-offset: 4px }
.ccb-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
@container (max-width: 520px) { .ccb { --ccb-aspect: 1.12 } }
.ccb[data-fixed] .ccb-fig { aspect-ratio: auto; height: 100%; cursor: default }

.ccb-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; margin-top: 8px; padding: 0 2px; color: var(--ccb-t3) }
.ccb-cap { font-variant-numeric: tabular-nums; letter-spacing: -.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ccb-btns { display: flex; align-items: center; gap: 2px; margin-right: -6px }
.ccb-b {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; min-width: 32px; padding: 0 10px 0 8px; border-radius: 8px; font-weight: 500;
  color: var(--ccb-t2); transition: background-color .16s var(--ccb-ease), color .16s var(--ccb-ease), transform .16s var(--ccb-ease);
}
.ccb-b:hover { background: var(--ccb-fill); color: var(--ccb-t1) }
.ccb-b:active { transform: scale(.96) }
.ccb-b:focus-visible { outline: 2px solid var(--ccb-accent); outline-offset: 1px }
.ccb-b:disabled { opacity: .4; cursor: default; pointer-events: none }
.ccb-b svg { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
html[data-style="glass"] .ccb-bar {
  padding: 2px 4px 2px 14px; border-radius: 999px; background-color: var(--pane-tint); box-shadow: var(--pane-card);
  -webkit-backdrop-filter: blur(18px) saturate(1.8); backdrop-filter: blur(18px) saturate(1.8);
}
html[data-style="glass"] .ccb-b:hover { background: color-mix(in oklab, var(--pane-ink) 8%, transparent) }
@container (max-width: 400px) { .ccb-b span { display: none } .ccb-b { padding: 0 8px } }
@media (prefers-reduced-motion: reduce) { .ccb-b { transition: none } }
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const SCAN_SECONDS = SWEEP.b - SWEEP.a

type Ctl = {
  paint: () => void
  scan: (user?: boolean) => void
  toggle: (i: number, j: number) => void
  clear: () => void
  move: (di: number, dj: number) => void
  cursorCell: () => [number, number]
  showCursor: () => void
  wake: () => void
  lifts: Float32Array
}

export function ColumnCube(props: ColumnCubeProps) {
  const {
    speed = 1,
    paused = false,
    accent,
    values,
    seed: seedProp,
    size,
    time,
    canvasRef,
    onSelect,
    onScan,
    label = "An isometric block of grey columns with one corner cut away to show a coloured layer; a scan crosses the block and lifts the cells it finds.",
    className,
  } = props
  const v = { ...values } as DrawValues & Record<string, unknown>
  const n = Math.round(clamp(Number(v.grid ?? props.grid ?? 9), 4, 16))
  const cut = Math.round(clamp(Number(v.cut ?? props.cut ?? 5), 2, n - 2))
  const variance = clamp(Number(v.variance ?? props.variance ?? 0.7))
  const layerH = clamp(Number(v.layerHeight ?? props.layerHeight ?? 0.7), 0.45, 1.1)
  const found = Number(v.found ?? Math.max(3, Math.round(cut * cut * 0.3)))
  const seed = Number(seedProp ?? v.seed ?? 4821)
  const fixed = time !== undefined
  const accentColor = (typeof v.accent === "string" ? v.accent : undefined) ?? accent
  const selKey = props.selected ? props.selected.map((p) => p.join(",")).join(";") : ""
  const speedV = Number(v.speed ?? speed)

  const speedRef = React.useRef(speedV)
  const pausedRef = React.useRef(paused)
  speedRef.current = speedV
  pausedRef.current = paused
  React.useEffect(() => { ctlRef.current?.wake() }, [paused])
  const rootRef = React.useRef<HTMLDivElement>(null)
  const figRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const ctlRef = React.useRef<Ctl | null>(null)
  const [reduce, setReduce] = React.useState(prefersReduced)
  const [status, setStatus] = React.useState("")
  const [live, setLive] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduce(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  const setCanvas = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  const drawKey = `${n}|${cut}|${variance}|${layerH}|${found}|${seed}|${String(v.ink)}|${String(v.bg)}|${accentColor}|${selKey}`
  React.useEffect(() => {
    const root = rootRef.current
    const cv = cvRef.current
    if (!root || !cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    const probe = document.createElement("i")
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0"
    root.appendChild(probe)
    const resolve = (name: string) => {
      probe.style.color = `var(${name})`
      return getComputedStyle(probe).color
    }
    let ink = "#000"
    let acc = "#0060e2"
    let paper = "#fff"
    const readColors = () => {
      ink = typeof v.ink === "string" ? v.ink : resolve("--ccb-ink")
      acc = accentColor ?? resolve("--ccb-accent")
      paper = typeof v.bg === "string" ? v.bg : resolve("--ccb-surface")
    }
    readColors()

    const scene = buildScene(n, variance, cut, layerH, seed)
    const initial = props.selected
      ? props.selected.filter(([i, j]) => scene.cells[j * n + i]?.floor).map(([i, j]) => j * n + i)
      : pickSelection(scene, found, seed)
    const sel = new Set(initial)
    const lifts = new Float32Array(n * n)
    const targets = new Float32Array(n * n)

    const base = (): DrawValues => ({
      grid: n, cut, variance, layerHeight: layerH, seed, ink, accent: acc, bg: paper,
      fill: typeof v.bg === "string", selection: [...sel],
    })

    let dpr = 1
    let cw = 0
    let ch = 0
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = fixed && size ? { width: size.w, height: size.h } : cv.getBoundingClientRect()
      cw = Math.max(1, Math.round(rect.width * dpr))
      ch = Math.max(1, Math.round(rect.height * dpr))
      if (cv.width !== cw || cv.height !== ch) {
        cv.width = cw
        cv.height = ch
      }
    }

    // Demo state. The first frame is the moment itself (cells up), so a still or a throttled tab already shows it.
    const sim = {
      clock: reduce ? STILL_T : 3.3,
      last: 0,
      interacted: false,
      scanning: false,
      scanT: 0,
      cursor: null as [number, number] | null,
      status: "",
    }

    const say = (s: string) => {
      if (s !== sim.status) { sim.status = s; setStatus(s) }
    }
    const statusFor = (head: number | null, count: number, total: number) => {
      if (head !== null) return `Scanning ${n * n} columns`
      return count > 0 ? `${count} of ${total} cells found` : "No cells selected"
    }

    const frameState = () => {
      if (!sim.interacted) {
        const t = sim.clock
        const s = scanAt(t, n)
        for (let k = 0; k < lifts.length; k++) lifts[k] = sel.has(k) ? liftAt(t, n, k % n) : 0
        const u = ((t % LOOP) + LOOP) % LOOP
        say(u > SWEEP.a && u < SWEEP.b ? statusFor(0, 0, 0) : `${sel.size} of ${scene.floors.length} cells found`)
        return { scan: s, t }
      }
      let s: { head: number; sheen: number } | null = null
      if (sim.scanning) {
        const loc = sim.scanT
        s = scanAt(SWEEP.a + loc, n)
        const head = loc >= SCAN_SECONDS ? n + 2.4 : s ? s.head : -9
        if (loc > SCAN_SECONDS + 1.6) { sim.scanning = false; setBusy(false); s = null }
        for (let k = 0; k < targets.length; k++) targets[k] = sel.has(k) && head >= (k % n) + 0.5 ? 1 : 0
        if (s && loc > SCAN_SECONDS) s = { head: s.head, sheen: s.sheen }
        say(loc < SCAN_SECONDS ? statusFor(0, 0, 0) : statusFor(null, sel.size, scene.floors.length))
      } else {
        for (let k = 0; k < targets.length; k++) targets[k] = sel.has(k) ? 1 : 0
        say(statusFor(null, sel.size, scene.floors.length))
      }
      return { scan: s, t: sim.clock }
    }

    const paint = () => {
      fit()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (fixed) {
        draw(ctx, cw, ch, time!, base())
        return
      }
      const f = frameState()
      draw(ctx, cw, ch, f.t, { ...base(), lifts, scan: f.scan, cursor: sim.cursor })
    }

    const interact = () => {
      if (sim.interacted) return
      // The first touch ends the built-in demo for good; the cells stay where they are.
      sim.interacted = true
      setLive(true)
      for (let k = 0; k < targets.length; k++) targets[k] = lifts[k]
    }
    const defaultCursor = (): [number, number] => {
      const m = n - cut + Math.floor(cut / 2)
      return [m, m]
    }
    const emit = () => onSelect?.([...sel].sort((a, b) => a - b).map((k) => [k % n, Math.floor(k / n)] as [number, number]))
    const ctl: Ctl = {
      paint,
      scan: (user = true) => {
        if (user) interact()
        sim.scanning = true
        sim.scanT = 0
        setBusy(true)
        for (let k = 0; k < lifts.length; k++) if (sel.has(k)) targets[k] = 0
        if (reduce) { sim.scanning = false; setBusy(false); for (let k = 0; k < lifts.length; k++) lifts[k] = sel.has(k) ? 1 : 0 }
        if (user) onScan?.()
        wake()
      },
      toggle: (i, j) => {
        interact()
        const k = j * n + i
        if (!scene.cells[k]?.floor) return
        if (sel.has(k)) sel.delete(k)
        else sel.add(k)
        sim.cursor = sim.cursor ? [i, j] : sim.cursor
        emit()
        if (reduce) lifts[k] = sel.has(k) ? 1 : 0
        wake()
      },
      clear: () => {
        interact()
        sel.clear()
        emit()
        if (reduce) lifts.fill(0)
        wake()
      },
      move: (di, dj) => {
        interact()
        const c0 = n - cut
        const cur = sim.cursor ?? defaultCursor()
        sim.cursor = [clamp(cur[0] + di, c0, n - 1), clamp(cur[1] + dj, c0, n - 1)]
        wake()
      },
      cursorCell: () => sim.cursor ?? defaultCursor(),
      showCursor: () => { if (!sim.cursor) { sim.cursor = defaultCursor(); wake() } },
      wake: () => wake(),
      lifts,
    }
    ctlRef.current = ctl

    let raf = 0
    let visible = true
    const settled = () => {
      for (let k = 0; k < lifts.length; k++) if (Math.abs(lifts[k] - targets[k]) > 0.002) return false
      return true
    }
    const moving = () => {
      if (fixed || pausedRef.current || !visible || document.hidden) return false
      if (!sim.interacted) return !reduce
      return sim.scanning || !settled()
    }
    const frame = (now: number) => {
      raf = 0
      const dt = sim.last ? Math.min(0.05, (now - sim.last) / 1000) : 0
      sim.last = now
      if (!sim.interacted) sim.clock += dt * speedRef.current
      else {
        if (sim.scanning) sim.scanT += dt * speedRef.current
        const a = 1 - Math.exp(-dt * 8)
        for (let k = 0; k < lifts.length; k++) lifts[k] += (targets[k] - lifts[k]) * a
      }
      paint()
      if (moving()) raf = requestAnimationFrame(frame)
    }
    function wake() {
      if (raf) return
      sim.last = 0
      if (moving()) raf = requestAnimationFrame(frame)
      else {
        // Reduced motion or paused: snap lifts to targets so one frame says it all.
        if (sim.interacted && (reduce || pausedRef.current)) for (let k = 0; k < lifts.length; k++) lifts[k] = targets[k]
        paint()
      }
    }

    const ro = new ResizeObserver(() => { readColors(); paint() })
    ro.observe(fixed ? cv : figRef.current ?? cv)
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0 }
      wake()
    })
    io.observe(root)
    const onVis = () => { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0 } else wake() }
    document.addEventListener("visibilitychange", onVis)
    const mo = new MutationObserver(() => { readColors(); paint() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-style"] })

    paint()
    wake()

    return () => {
      ctlRef.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      probe.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey, fixed, time, size?.w, size?.h, reduce])

  const onPointerDown = (e: React.PointerEvent) => {
    const cv = cvRef.current
    const ctl = ctlRef.current
    if (!cv || !ctl) return
    const rect = cv.getBoundingClientRect()
    const dpr = cv.width / rect.width
    const cell = pickCell(cv.width, cv.height, { grid: n, cut, variance, layerHeight: layerH, seed, lifts: ctl.lifts }, (e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr)
    if (cell) ctl.toggle(cell[0], cell[1])
    else ctl.scan()
  }

  const onKey = (e: React.KeyboardEvent) => {
    const ctl = ctlRef.current
    if (!ctl) return
    const dir: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
    if (dir[e.key]) { e.preventDefault(); ctl.move(dir[e.key][0], dir[e.key][1]) }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const [i, j] = ctl.cursorCell(); ctl.toggle(i, j) }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); ctl.scan() }
  }

  return (
    <div
      ref={rootRef}
      className={["ccb", className].filter(Boolean).join(" ")}
      data-fixed={fixed ? "" : undefined}
      style={{ ...(accentColor ? ({ "--ccb-accent": accentColor } as React.CSSProperties) : null), ...(props.aspect ? ({ "--ccb-aspect": props.aspect } as React.CSSProperties) : null) }}
    >
      <style href="column-cube" precedence="default">{CSS}</style>
      <div
        ref={figRef}
        className="ccb-fig"
        role="group"
        aria-label={`${label} Arrow keys move over the cut cells, Enter lifts or lowers one, S runs the scan.`}
        tabIndex={fixed ? -1 : 0}
        onKeyDown={fixed ? undefined : onKey}
        onFocus={fixed ? undefined : (e) => { if (e.target === e.currentTarget && e.currentTarget.matches(":focus-visible")) ctlRef.current?.showCursor() }}
        onPointerDown={fixed ? undefined : onPointerDown}
      >
        <canvas ref={setCanvas} className="ccb-cv" role="img" aria-label={label} />
      </div>
      {!fixed && (
        <div className="ccb-bar">
          <p className="ccb-cap" aria-live={live ? "polite" : "off"}>{status}</p>
          <div className="ccb-btns">
            <button type="button" className="ccb-b" aria-label="Clear selection" title="Clear selection" onClick={() => ctlRef.current?.clear()}>
              <svg viewBox="0 0 16 16" aria-hidden><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
              <span>Clear</span>
            </button>
            <button type="button" className="ccb-b" aria-label="Scan" title="Scan" disabled={busy} onClick={() => ctlRef.current?.scan()}>
              <svg viewBox="0 0 16 16" aria-hidden><path d="M2.5 11.5 8 14l5.5-2.5M2.5 8 8 10.5 13.5 8M8 2 2.5 4.5 8 7l5.5-2.5z" /></svg>
              <span>Scan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnCube
