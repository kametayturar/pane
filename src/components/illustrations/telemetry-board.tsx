"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TelemetryStat = { label: string; value: number; unit?: string }

export type TelemetryBoardProps = {
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Colour of the dots, the logo and the vitals numbers (any CSS colour). Defaults to slate dots with a blue vitals card. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  /** Name of the metric ticking in the top-left of the tall panel. */
  metricLabel?: string
  /** Where that metric hovers, in percent. Default 14.2. */
  metric?: number
  /** Two small mono lines at the top right. */
  eyebrow?: [string, string] | string[]
  /** Mono line at the bottom right of the top-right panel. */
  tagline?: string
  /** Notes typed out, held and erased in turn at the bottom of the tall panel. */
  reports?: string[]
  /** Glass card: small label, title and date chip. */
  vitalsLabel?: string
  vitalsTitle?: string
  vitalsDate?: string
  /** Values the glass card's number walks through. */
  ages?: number[]
  /** Real age, for the "N years younger" caption. Default 38. */
  chronologicalAge?: number
  /** The two stats at the bottom of the glass card. */
  stats?: TelemetryStat[]
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const W = 720
const H = 540

const CSS = `
.tb {
  --tb-ink: #000;
  --tb-surface: #fff;
  --tb-dot: #6b7aa1;
  --tb-accent: #2f66e8;
  --tb-ease: cubic-bezier(.22, 1, .36, 1);
  --tb-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  --tb-t1: color-mix(in oklab, var(--tb-ink) 78%, transparent);
  --tb-t2: color-mix(in oklab, var(--tb-ink) 55%, transparent);
  --tb-t3: color-mix(in oklab, var(--tb-ink) 38%, transparent);
  --tb-line: color-mix(in oklab, var(--tb-ink) 16%, transparent);
  --tb-speed: 1; --tb-scale: 1;
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--tb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 18px; color: var(--tb-t1); -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .tb { --tb-ink: #fff; --tb-surface: #19191d; --tb-dot: #a3b2dc; --tb-accent: #6f9bff; }
.tb *, .tb *::before, .tb *::after { box-sizing: border-box }
.tb-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--tb-scale)) }
.tb-art { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; display: block; pointer-events: none; color: var(--tb-art, var(--tb-dot)) }

/* Editorial panels: flat white sheets with a hairline shadow. */
.tb-panel { position: absolute; background: var(--tb-surface); border-radius: 2px;
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--tb-ink) 9%, transparent), 0 1px 2px rgb(0 0 0 / .05), 0 16px 32px -20px rgb(0 0 0 / .22);
  animation: tb-rise .9s var(--tb-ease) backwards; animation-delay: calc(var(--i, 0) * .14s / var(--tb-speed)) }
:is(.dark, [data-theme="dark"]) .tb-panel { box-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 16px 32px -20px rgb(0 0 0 / .7) }
.tb-guide { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--tb-line); opacity: .5 }
.tb-mark { position: absolute; width: 7px; height: 7px; color: var(--tb-t3) }
.tb-mono { font-family: var(--tb-mono); font-size: 9.5px; line-height: 13px; letter-spacing: .02em; color: var(--tb-t2); white-space: nowrap }
.tb-up { text-transform: uppercase; letter-spacing: .1em; font-size: 8px; line-height: 12px; color: var(--tb-t3) }
.tb-report { position: absolute; font-family: var(--tb-mono); font-size: 9px; line-height: 13.5px; color: var(--tb-t3); width: 214px; height: 58px; overflow: hidden }
.tb-caret { display: inline-block; width: 4px; height: 9px; margin-left: 1px; vertical-align: -1px; background: var(--tb-t2); animation: tb-blink calc(1.05s / var(--tb-speed)) steps(1) infinite }
.tb-fade { animation: tb-fade .7s var(--tb-ease) backwards; animation-delay: calc(var(--i, 0) * .14s / var(--tb-speed) + .35s) }

/* The logo: five dots on a ring inside a design-tool style bounding box with handles. */
.tb-ring { transform-origin: 50% 50%; animation: tb-spin calc(28s / var(--tb-speed)) linear infinite }
.tb-handle { position: absolute; border: 1px solid color-mix(in oklab, var(--tb-dot) 60%, transparent); background: var(--tb-surface);
  animation: tb-fade .8s var(--tb-ease) backwards; animation-delay: calc(.9s / var(--tb-speed)) }
.tb-handle > i { position: absolute; width: 5px; height: 5px; background: var(--tb-surface); border: 1px solid var(--tb-dot) }
.tb-handle > i:nth-child(1) { left: -3.5px; top: -3.5px } .tb-handle > i:nth-child(2) { right: -3.5px; top: -3.5px }
.tb-handle > i:nth-child(3) { left: -3.5px; bottom: -3.5px } .tb-handle > i:nth-child(4) { right: -3.5px; bottom: -3.5px }

/* Glass vitals card. */
.tb-vc { position: absolute; padding: 12px 14px 13px; border-radius: 18px;
  background: linear-gradient(160deg, rgb(255 255 255 / .58), rgb(255 255 255 / .34));
  -webkit-backdrop-filter: blur(12px) saturate(1.6); backdrop-filter: blur(12px) saturate(1.6);
  box-shadow: 0 0 0 .5px rgb(20 30 70 / .1), inset 0 1px 0 rgb(255 255 255 / .85), 0 18px 36px -14px rgb(30 45 100 / .38);
  animation: tb-card 1s var(--tb-ease) backwards; animation-delay: calc(1.1s / var(--tb-speed)) }
:is(.dark, [data-theme="dark"]) .tb-vc { background: linear-gradient(160deg, rgb(48 50 60 / .6), rgb(28 29 36 / .42));
  box-shadow: 0 0 0 .5px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .1), 0 18px 36px -14px rgb(0 0 0 / .7) }
.tb-vc-head { display: flex; justify-content: space-between; align-items: flex-start }
.tb-vc-title { font-size: 12.5px; line-height: 16px; color: var(--tb-accent); font-weight: 450 }
.tb-chip { margin-top: 1px; padding: 0 6px; border-radius: 9px; font-family: var(--tb-mono); font-size: 8px; line-height: 15px; color: var(--tb-accent);
  background: color-mix(in oklab, var(--tb-accent) 10%, transparent); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--tb-accent) 28%, transparent) }
.tb-num { display: flex; justify-content: center; margin-top: 8px; color: var(--tb-accent) }
.tb-dg-row { display: inline-flex; gap: 7px }
.tb-dg { display: grid; grid-template-rows: repeat(7, 4px); grid-auto-flow: column; grid-template-columns: repeat(5, 4px); gap: 2px }
.tb-dg i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: .13; transform: scale(.6);
  transition: opacity .5s var(--tb-ease) var(--d, 0ms), transform .5s var(--tb-ease) var(--d, 0ms) }
.tb-dg i[data-on] { opacity: 1; transform: scale(1) }
.tb-cap { margin-top: 8px; text-align: center; font-size: 9.5px; line-height: 13px; font-weight: 500; color: var(--tb-accent) }
.tb-ruler { position: relative; height: 28px; margin: 8px 2px 0 }
.tb-tick { position: absolute; bottom: 10px; width: 1px; margin-left: -.5px; height: var(--h, 5px); border-radius: 1px; background: var(--tb-line); transition: height .5s var(--tb-ease) }
.tb-tick[data-major] { background: color-mix(in oklab, var(--tb-ink) 30%, transparent) }
.tb-needle { position: absolute; bottom: 10px; width: 2px; margin-left: -1px; height: 20px; border-radius: 2px; background: var(--tb-accent); left: var(--p, 0%); transition: left .6s var(--tb-ease) }
.tb-needle::before { content: ""; position: absolute; left: 50%; top: -3px; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: var(--tb-accent); box-shadow: 0 0 0 2.5px color-mix(in oklab, var(--tb-accent) 20%, transparent) }
.tb-lab { position: absolute; bottom: -2px; transform: translateX(-50%); font-family: var(--tb-mono); font-size: 7px; line-height: 9px; color: var(--tb-t3) }
.tb-stats { display: flex; justify-content: space-between; margin-top: 9px; padding-top: 8px; border-top: .5px solid var(--tb-line) }
.tb-stat-v { font-size: 18px; line-height: 21px; font-weight: 300; color: var(--tb-accent); font-variant-numeric: tabular-nums }
.tb-stat-v small { margin-left: 2px; font-size: 8px; color: var(--tb-t2); font-family: var(--tb-mono) }

@keyframes tb-rise { from { opacity: 0; transform: translateY(10px) } }
@keyframes tb-fade { from { opacity: 0 } }
@keyframes tb-card { from { opacity: 0; transform: translateY(12px) scale(.97); filter: blur(4px) } }
@keyframes tb-spin { to { transform: rotate(360deg) } }
@keyframes tb-blink { 50% { opacity: 0 } }
.tb[data-paused] .tb-panel, .tb[data-paused] .tb-fade, .tb[data-paused] .tb-handle, .tb[data-paused] .tb-vc { animation: none }
.tb[data-paused] *, .tb[data-paused] *::before, .tb[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .tb *, .tb *::before, .tb *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                         The drawn subjects (own SVG)                       */
/* -------------------------------------------------------------------------- */

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f1 = (v: number) => v.toFixed(1)

/** A fern frond: a curved stem with leaflet pairs whose length and angle change along it. */
function fern(r: () => number, pts: number[], scale: number, ink: number): string {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = pts
  const at = (s: number) => {
    const u = 1 - s
    return [u * u * u * x0 + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3, u * u * u * y0 + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3]
  }
  const ang = (s: number) => {
    const u = 1 - s
    const dx = 3 * u * u * (x1 - x0) + 6 * u * s * (x2 - x1) + 3 * s * s * (x3 - x2)
    const dy = 3 * u * u * (y1 - y0) + 6 * u * s * (y2 - y1) + 3 * s * s * (y3 - y2)
    return Math.atan2(dy, dx)
  }
  const out: string[] = []
  const stem: string[] = []
  for (let i = 0; i <= 40; i++) {
    const [x, y] = at(i / 40)
    stem.push(`${f1(x)},${f1(y)}`)
  }
  out.push(`<polyline points="${stem.join(" ")}" fill="none" stroke="#000" stroke-opacity="${ink}" stroke-width="${f1(5 * scale)}" stroke-linecap="round"/>`)
  const N = 36
  for (let i = 0; i < N; i++) {
    const s = 0.05 + (i / (N - 1)) * 0.93
    const [bx, by] = at(s)
    const a0 = ang(s)
    const len = 132 * scale * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.85) + 4
    for (const side of [-1, 1]) {
      const a = a0 + side * ((80 - 34 * s) * Math.PI) / 180 + (r() - 0.5) * 0.12
      const l = len * (0.92 + r() * 0.16)
      const tx = bx + Math.cos(a) * l
      const ty = by + Math.sin(a) * l
      const nx = -Math.sin(a)
      const ny = Math.cos(a)
      const w = l * 0.15
      const mx = bx + (tx - bx) * 0.45
      const my = by + (ty - by) * 0.45
      const cur = side * l * 0.07 // leaflets curl a little towards the tip of the frond
      const c1x = mx + nx * (w + cur)
      const c1y = my + ny * (w + cur)
      const c2x = mx - nx * (w * 0.8 - cur)
      const c2y = my - ny * (w * 0.8 - cur)
      out.push(
        `<path d="M${f1(bx)},${f1(by)}Q${f1(c1x)},${f1(c1y)} ${f1(tx)},${f1(ty)}Q${f1(c2x)},${f1(c2y)} ${f1(bx)},${f1(by)}Z" fill="#000" fill-opacity="${f1(ink * (0.62 + r() * 0.2))}"/>` +
          `<path d="M${f1(bx)},${f1(by)}L${f1(tx)},${f1(ty)}" stroke="#000" stroke-opacity="${f1(ink * 0.95)}" stroke-width="1.5" fill="none"/>`,
      )
    }
  }
  return out.join("")
}

/** A branching tree (like a bronchial tree or a neuron): each branch splits into two or three thinner ones. */
function tree(rnd: () => number, x: number, y: number, ang: number, len: number, w: number, depth: number, out: string[]) {
  const x2 = x + Math.cos(ang) * len
  const y2 = y + Math.sin(ang) * len
  const cx = (x + x2) / 2 + (rnd() - 0.5) * len * 0.4
  const cy = (y + y2) / 2 + (rnd() - 0.5) * len * 0.4
  out.push(`<path d="M${f1(x)},${f1(y)}Q${f1(cx)},${f1(cy)} ${f1(x2)},${f1(y2)}" stroke-width="${f1(Math.max(1.8, w))}"/>`)
  if (depth <= 0) {
    out.push(`<circle cx="${f1(x2)}" cy="${f1(y2)}" r="${f1(1.2 + rnd() * 1.6)}" fill="#000" stroke="none"/>`)
    return
  }
  const k = depth < 5 && rnd() < 0.3 ? 3 : 2
  for (let i = 0; i < k; i++) {
    const spread = k === 2 ? (i ? 1 : -1) * (0.32 + rnd() * 0.36) : (i - 1) * (0.5 + rnd() * 0.2)
    tree(rnd, x2, y2, ang + spread + (rnd() - 0.5) * 0.15, len * (0.7 + rnd() * 0.12), w * 0.72, depth - 1, out)
  }
}

/** A compact dragonfly seen from above (simplified from the one in DitherImage). */
function dragonfly(rnd: () => number): string {
  const out: string[] = []
  const wing = (rx: number, ry: number, angle: number, mirror: boolean, L: number, wLE: number, wTE: number, hind: boolean) => {
    const prof = (s: number) => Math.pow(Math.sin(Math.PI * Math.min(1, 0.012 + 0.988 * s)), 0.58)
    const bend = (s: number) => 0.07 * L * s * s
    const le = (s: number) => -wLE * prof(s) + bend(s)
    const te = (s: number) => wTE * prof(s) * (1 + (hind ? 0.6 : 0.12) * Math.exp(-(((s - 0.2) / 0.19) ** 2))) + bend(s)
    const at = (s: number, q: number) => le(s) + q * (te(s) - le(s))
    const g: string[] = []
    const top: string[] = []
    const bot: string[] = []
    for (let i = 0; i <= 40; i++) {
      const s = i / 40
      top.push(`${f1(L * s)},${f1(le(s))}`)
      bot.push(`${f1(L * s)},${f1(te(s))}`)
    }
    g.push(`<path d="M${top.join("L")}L${bot.reverse().join("L")}Z" fill="url(#tbm)" stroke="#000" stroke-opacity=".6" stroke-width="1"/>`)
    for (let j = 0; j <= 6; j++) {
      const pts: string[] = []
      for (let i = 2; i <= 38; i++) pts.push(`${f1((L * i) / 40)},${f1(at(i / 40, j / 6))}`)
      if (j > 1) g.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="4.4"/>`)
      g.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="#000" stroke-opacity="${j === 0 ? 0.95 : 0.78}" stroke-width="${j === 0 ? 3.4 : 1.6}"/>`)
    }
    const rungs: string[] = []
    for (let j = 0; j < 6; j++) for (let s = 0.05; s < 0.95; s += 0.04 + rnd() * 0.02) rungs.push(`M${f1(L * s)},${f1(at(s, j / 6))}L${f1(L * s)},${f1(at(s, (j + 1) / 6))}`)
    g.push(`<path d="${rungs.join("")}" stroke="#000" stroke-opacity=".6" stroke-width="1.2" fill="none"/>`)
    g.push(`<path d="M${f1(L * 0.84)},${f1(le(0.84))}L${f1(L * 0.915)},${f1(le(0.915))}L${f1(L * 0.91)},${f1(at(0.91, 0.1))}L${f1(L * 0.835)},${f1(at(0.835, 0.1))}Z" fill="#000" fill-opacity=".85"/>`)
    out.push(`<g transform="translate(${rx} ${ry}) rotate(${angle})${mirror ? " scale(1,-1)" : ""}">${g.join("")}</g>`)
  }
  wing(10, -7, -81, true, 246, 17, 31, false)
  wing(10, 7, 81, false, 246, 17, 31, false)
  wing(-10, -7, -100, true, 236, 19, 46, true)
  wing(-10, 7, 100, false, 236, 19, 46, true)
  const x0 = -26
  const x1 = -318
  const curve = (x: number) => 0.00017 * (x - x0) * (x - x0)
  for (let i = 0; i < 11; i++) {
    const a = x0 + ((x1 - x0) * i) / 11
    const b = x0 + ((x1 - x0) * (i + 1)) / 11
    const m = (a + b) / 2
    const slope = (Math.atan2(curve(b) - curve(a), b - a) * 180) / Math.PI
    out.push(`<ellipse cx="${f1(m)}" cy="${f1(curve(m))}" rx="${f1(Math.abs(b - a) / 2 - 0.7)}" ry="${f1(11 - 5.6 * (i / 10))}" transform="rotate(${f1(slope)} ${f1(m)} ${f1(curve(m))})" fill="#000" fill-opacity="${i % 2 ? 0.74 : 0.94}"/>`)
  }
  out.push(
    `<ellipse cx="2" cy="0" rx="36" ry="21" fill="#000" fill-opacity=".92"/><ellipse cx="46" cy="0" rx="14" ry="18" fill="#000" fill-opacity=".85"/><ellipse cx="55" cy="-10" rx="13" ry="12" fill="#000"/><ellipse cx="55" cy="10" rx="13" ry="12" fill="#000"/>`,
  )
  return out.join("")
}

let ART: string | null = null
function boardArt(): string {
  if (ART) return ART
  const rnd = seeded(23)
  const parts: string[] = []
  // Left panel: two fern fronds, one faint behind the other, leaning in from the bottom-left corner.
  parts.push(`<g>${fern(rnd, [-70, 500, 10, 360, 70, 220, 236, 96], 0.86, 0.8)}</g>`)
  parts.push(`<g>${fern(rnd, [-30, 520, 110, 400, 150, 290, 272, 190], 0.5, 0.3)}</g>`)
  // Top right panel: a dragonfly, nearly the size of the panel.
  parts.push(`<g transform="translate(510 146) rotate(-9) scale(.44)">${dragonfly(rnd)}</g>`)
  // Bottom right panel: branching tree growing in from the right edge.
  const t: string[] = []
  tree(rnd, 790, 540, (-168 * Math.PI) / 180, 98, 13, 7, t)
  tree(rnd, 800, 452, (-178 * Math.PI) / 180, 84, 9, 6, t)
  tree(rnd, 740, 580, (-114 * Math.PI) / 180, 82, 8, 6, t)
  parts.push(`<g fill="none" stroke="#000" stroke-opacity=".82" stroke-linecap="round">${t.join("")}</g>`)
  return (ART =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><linearGradient id="tbm" x1="0" x2="1" y1="0" y2=".25"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".5" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>` +
    parts.join("") +
    // A white wash fading the lower-left art out, so the typed note stays readable (white erases ink).
    `<defs><linearGradient id="tbw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>` +
    `<rect x="0" y="392" width="316" height="34" fill="url(#tbw)"/><rect x="0" y="426" width="316" height="114" fill="#fff"/>` +
    `</svg>`)
}

/* -------------------------------------------------------------------------- */
/*                             Ordered-dither engine                          */
/* -------------------------------------------------------------------------- */

function bayerMatrix(n: number): Float32Array {
  let m = [0]
  let size = 1
  while (size < n) {
    const next = new Array<number>(size * size * 4)
    const s2 = size * 2
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = m[y * size + x] * 4
        next[y * s2 + x] = v
        next[y * s2 + x + size] = v + 2
        next[(y + size) * s2 + x] = v + 3
        next[(y + size) * s2 + x + size] = v + 1
      }
    }
    m = next
    size = s2
  }
  return Float32Array.from(m, (v) => (v + 0.5) / (n * n))
}
const BAYER8 = bayerMatrix(8)
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const hash = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return v - Math.floor(v)
}

type Field = {
  n: number
  gx: Uint16Array
  gy: Uint16Array
  lvl: Float32Array
  thr: Float32Array
  dly: Float32Array
  X: Float32Array
  Y: Float32Array
  B: Uint8Array
}

function buildField(img: HTMLImageElement, cols: number, rows: number): Field | null {
  try {
    let cur: CanvasImageSource = img
    let cw = W
    let ch = H
    while (cw > cols * 2.2) {
      const nw = Math.max(cols, Math.ceil(cw / 2))
      const nh = Math.max(rows, Math.ceil(ch / 2))
      const c = document.createElement("canvas")
      c.width = nw
      c.height = nh
      const cx = c.getContext("2d")
      if (!cx) return null
      cx.imageSmoothingQuality = "high"
      cx.drawImage(cur, 0, 0, nw, nh)
      cur = c
      cw = nw
      ch = nh
    }
    const c = document.createElement("canvas")
    c.width = cols
    c.height = rows
    const cx = c.getContext("2d", { willReadFrequently: true })
    if (!cx) return null
    cx.imageSmoothingQuality = "high"
    cx.drawImage(cur, 0, 0, cols, rows)
    const px = cx.getImageData(0, 0, cols, rows).data
    const total = cols * rows
    const gx = new Uint16Array(total)
    const gy = new Uint16Array(total)
    const lvl = new Float32Array(total)
    const thr = new Float32Array(total)
    const dly = new Float32Array(total)
    let k = 0
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const a = px[i + 3] / 255
        if (a < 0.03) continue
        const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
        const level = clamp01(((1 - lum) * a - 0.5) * 1.3 + 0.5)
        const t = BAYER8[(y % 8) * 8 + (x % 8)]
        if (level + 0.12 <= t) continue
        gx[k] = x
        gy[k] = y
        lvl[k] = level
        thr[k] = t
        dly[k] = (x / cols) * 0.68 + (y / rows) * 0.1 + hash(k, 1) * 0.16
        k++
      }
    }
    return { n: k, gx: gx.slice(0, k), gy: gy.slice(0, k), lvl: lvl.slice(0, k), thr: thr.slice(0, k), dly: dly.slice(0, k), X: new Float32Array(k), Y: new Float32Array(k), B: new Uint8Array(k) }
  } catch {
    return null
  }
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

const NB = 8
const REV_SPREAD = 0.9
const REV_DUR = 0.8
const REV_TOTAL = REV_SPREAD + REV_DUR + 0.05

type Live = { speed: number; paused: boolean; reduced: boolean }

/** Paints the whole stage's artwork as dots on one canvas, and replays a left-to-right reveal the first time it is seen. */
function useDitherStage(rootRef: React.RefObject<HTMLDivElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>, live: React.RefObject<Live>) {
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return
    let img: HTMLImageElement | null = null
    let field: Field | null = null
    let dead = false
    let raf = 0
    let last = 0
    let visible = false
    let started = false
    let rt = 0
    let t = 0
    let k = 1
    let dpr = 1
    let pitch = 3
    let color = "#6b7aa1"
    let frame = 0

    const L = () => live.current
    const revealing = () => !L().reduced && rt < REV_TOTAL
    const animated = () => !L().reduced
    const shouldRun = () => visible && !L().paused && !L().reduced && !document.hidden && !!field && animated()

    const paint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const f = field
      if (!f || !f.n) return
      const rev = revealing()
      if (rev && !started) return
      const moving = !L().reduced
      const dot = pitch <= 2 ? 1 : Math.max(1, Math.round(pitch * 0.72))
      const off = (pitch - dot) / 2
      const base = moving ? off : Math.floor(off)
      const amp = moving ? pitch * 0.5 : 0
      const shim = moving ? 0.06 : 0
      let n = 0
      for (let i = 0; i < f.n; i++) {
        const gx = f.gx[i]
        const gy = f.gy[i]
        let l = f.lvl[i]
        if (shim) l += shim * Math.sin(gx * 0.04 - gy * 0.03 + t * 0.8)
        if (l <= f.thr[i]) continue
        let x = gx * pitch + base
        let y = gy * pitch + base
        let a = 0.58 + 0.42 * (l > 1 ? 1 : l)
        if (rev) {
          const q = clamp01((rt - f.dly[i] * REV_SPREAD) / REV_DUR)
          if (q <= 0) continue
          const e = 1 - (1 - q) * (1 - q) * (1 - q)
          x -= (1 - e) * pitch * (3 + hash(i, 2) * 8)
          y += (1 - e) * pitch * (hash(i, 3) - 0.5) * 4
          a *= clamp01(q * 2.4)
        }
        if (amp) {
          x += amp * Math.sin(gx * 0.034 + gy * 0.021 - t * 0.7)
          y += amp * 0.8 * Math.cos(gx * 0.019 - gy * 0.038 + t * 0.55)
        }
        f.X[n] = x
        f.Y[n] = y
        f.B[n] = Math.min(NB - 1, Math.floor(a * NB))
        n++
      }
      ctx.fillStyle = color
      for (let b = 0; b < NB; b++) {
        ctx.globalAlpha = (b + 1) / NB
        ctx.beginPath()
        let any = false
        for (let j = 0; j < n; j++) {
          if (f.B[j] === b) {
            ctx.rect(f.X[j], f.Y[j], dot, dot)
            any = true
          }
        }
        if (any) ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    const readColor = () => {
      color = getComputedStyle(canvas).color || color
    }
    const update = () => {
      readColor()
      if (!started && visible && (L().paused || L().reduced)) rt = REV_TOTAL
      // A hidden tab can't animate (rAF is suspended): show the settled art instead of waiting for a reveal that never advances.
      if (document.hidden && !started) rt = REV_TOTAL
      if ((visible || document.hidden) && !started && field) started = true
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
      paint()
    }
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const s = dt * L().speed
      t += s
      if (started && rt < REV_TOTAL) rt += s
      if (frame++ % 40 === 0) readColor()
      paint()
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const rebuild = () => {
      if (!img) return
      const rect = root.getBoundingClientRect()
      if (!rect.width) return
      k = rect.width / W
      dpr = Math.min(window.devicePixelRatio || 1, 3)
      canvas.width = Math.max(1, Math.round(W * k * dpr))
      canvas.height = Math.max(1, Math.round(H * k * dpr))
      pitch = Math.max(2, Math.round(3.1 * k * dpr))
      field = buildField(img, Math.ceil(canvas.width / pitch), Math.ceil(canvas.height / pitch))
      if (L().reduced) rt = REV_TOTAL
      update()
    }
    ctl.current = { update }

    const im = new Image()
    im.onload = () => {
      if (dead) return
      img = im
      rebuild()
    }
    im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(boardArt())}`
    const ro = new ResizeObserver(rebuild)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      dead = true
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [rootRef, canvasRef, live])
  return ctl
}

/* -------------------------------------------------------------------------- */
/*                                   Clock                                    */
/* -------------------------------------------------------------------------- */

/** A coarse clock (about 12 updates a second) that only runs while the board is visible and not paused. */
function useClock(rootRef: React.RefObject<HTMLDivElement | null>, live: React.RefObject<Live>, reduced: boolean) {
  const [t, setT] = React.useState(0)
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let last = 0
    let acc = 0
    let shown = 0
    let visible = false
    const run = () => visible && !live.current.paused && !live.current.reduced && !document.hidden
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      acc += dt * live.current.speed
      if (acc - shown >= 0.08) {
        shown = acc
        setT(acc)
      }
      if (run()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      if (run()) {
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
      } else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    ctl.current = { update }
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [rootRef, live])
  return { t: reduced ? 12 : t, ctl }
}

function typedAt(t: number, msgs: string[]): string {
  const start = 1.7
  if (t < start || !msgs.length) return ""
  const TYPE = 36
  const ERASE = 120
  const HOLD = 5
  const GAP = 0.7
  const total = msgs.reduce((s, m) => s + m.length / TYPE + HOLD + m.length / ERASE + GAP, 0)
  let cur = (t - start) % total
  for (const m of msgs) {
    const tin = m.length / TYPE
    if (cur < tin) return m.slice(0, Math.floor(cur * TYPE))
    cur -= tin
    if (cur < HOLD) return m
    cur -= HOLD
    const tout = m.length / ERASE
    if (cur < tout) return m.slice(0, m.length - Math.floor(cur * ERASE))
    cur -= tout + GAP
    if (cur < 0) return ""
  }
  return ""
}

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

const DIGITS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
}

const Digit = React.memo(function Digit({ ch }: { ch: string }) {
  const rows = DIGITS[ch] ?? DIGITS["0"]
  const dots: React.ReactNode[] = []
  for (let c = 0; c < 5; c++)
    for (let r = 0; r < 7; r++) dots.push(<i key={`${c}-${r}`} data-on={rows[r][c] === "1" || undefined} style={{ "--d": `${c * 24 + r * 10}ms` } as React.CSSProperties} />)
  return <span className="tb-dg">{dots}</span>
})

/** The dot-ring mark: five dots of falling size on a ring that is open on one side. */
function RingMark({ size, spin }: { size: number; spin?: boolean }) {
  const dots = [4.6, 4.2, 3.6, 2.9, 2.2].map((r, i) => {
    const a = ((196 + i * 60) * Math.PI) / 180
    return { x: 20 + Math.cos(a) * 11.5, y: 20 + Math.sin(a) * 11.5, r, rot: (a * 180) / Math.PI + 90 }
  })
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden style={{ display: "block", color: "var(--tb-art, var(--tb-dot))" }}>
      <g className={spin ? "tb-ring" : undefined}>
        {dots.map((d, i) => (
          <ellipse key={i} cx={d.x} cy={d.y} rx={d.r * 1.25} ry={d.r * 0.9} transform={`rotate(${d.rot} ${d.x} ${d.y})`} fill="currentColor" opacity={0.95} />
        ))}
      </g>
    </svg>
  )
}

const Ruler = React.memo(function Ruler({ value, min, max }: { value: number; min: number; max: number }) {
  const span = max - min
  const pct = (n: number) => `${((n - min) / span) * 100}%`
  const ticks: React.ReactNode[] = []
  for (let n = min; n <= max; n++) {
    const d = n - value
    const h = (n % 5 === 0 ? 8 : 5) + 13 * Math.exp(-(d * d) / 5)
    ticks.push(<i key={n} className="tb-tick" data-major={n % 5 === 0 || undefined} style={{ left: pct(n), "--h": `${h.toFixed(1)}px` } as React.CSSProperties} />)
  }
  const labels: React.ReactNode[] = []
  for (let n = Math.ceil(min / 10) * 10; n <= max; n += 10)
    labels.push(
      <span key={n} className="tb-lab" style={{ left: pct(n) }}>
        {n}
      </span>,
    )
  return (
    <div className="tb-ruler" aria-hidden>
      {ticks}
      {labels}
      <span className="tb-needle" style={{ "--p": pct(value) } as React.CSSProperties} />
    </div>
  )
})

const DEFAULT_REPORTS = [
  "Thermal load and recovery thresholds reached. Repair pathways are active, clearing worn cells and restoring baseline function.",
  "Sleep debt cleared overnight. Heart-rate variability is trending up across the last seven readings.",
]
const DEFAULT_STATS: TelemetryStat[] = [
  { label: "Recovery", value: 86, unit: "%" },
  { label: "Resting HR", value: 52, unit: "bpm" },
]
const DEFAULT_AGES = [25, 25, 24, 23, 24, 25, 26, 25]

const pad2 = (n: number) => String(n).padStart(2, "0")

/**
 * TelemetryBoard – an editorial composition: a tall panel and two smaller ones, ordered-dither subjects (a fern, a
 * dragonfly, a branching tree) bleeding past their edges, mono telemetry that ticks and types, a slowly turning
 * dot-ring logo in a bounding box, and a frosted vitals card with a dot-matrix number.
 *
 *   <TelemetryBoard accent="#6b7aa1" />
 */
export function TelemetryBoard({
  speed = 1,
  paused,
  accent,
  label = "Editorial board with dithered botanical and insect art and a live vitals card",
  metricLabel = "Cell renewal index",
  metric = 14.2,
  eyebrow = ["Clinical telemetry", "Live ingestion"],
  tagline = "Measured, not guessed.",
  reports = DEFAULT_REPORTS,
  vitalsLabel = "Longevity",
  vitalsTitle = "Biological age",
  vitalsDate = "Oct 2026",
  ages = DEFAULT_AGES,
  chronologicalAge = 38,
  stats = DEFAULT_STATS,
  className,
}: TelemetryBoardProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)

  const live = React.useRef<Live>({ speed: 1, paused: false, reduced })
  const art = useDitherStage(rootRef, canvasRef, live)
  const { t, ctl: clock } = useClock(rootRef, live, reduced)
  React.useEffect(() => {
    live.current = { speed: Math.max(0.05, speed), paused: !!paused, reduced }
    art.current?.update()
    clock.current?.update()
  }, [speed, paused, reduced, accent, art, clock])

  // Scale the fixed stage to the container width.
  const [scale, setScale] = React.useState(1)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => setScale(root.clientWidth / W))
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // Everything that ticks is a pure function of the clock.
  const step = Math.floor(t / 0.7)
  const metricNow = metric + 0.7 * Math.sin(step * 1.3) + 0.3 * Math.sin(step * 2.9 + 1)
  const sec = 72 + Math.floor(t)
  const age = ages[Math.floor(t / 2.6) % ages.length] ?? 25
  const wobble = Math.round(Math.sin(Math.floor(t / 1.1) * 1.7) * 1.1)
  const report = reduced ? (reports[0] ?? "") : typedAt(t, reports)
  const diff = chronologicalAge - age
  const caption = diff === 0 ? "Right on your age" : `${Math.abs(diff)} year${Math.abs(diff) === 1 ? "" : "s"} ${diff > 0 ? "younger" : "older"}`
  const digits = String(age).padStart(2, "0").split("")

  const style = {
    "--tb-speed": Math.max(0.05, speed),
    "--tb-scale": scale,
    ...(accent ? { "--tb-art": accent, "--tb-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={className ? `tb ${className}` : "tb"} data-paused={paused || undefined} style={style} role="img" aria-label={label}>
      <style href="pane-telemetry-board" precedence="default">
        {CSS}
      </style>
      <div className="tb-stage" aria-hidden>
        <span className="tb-guide" style={{ left: 308 }} />
        <span className="tb-guide" style={{ left: 686 }} />

        {/* Panels */}
        <div className="tb-panel" style={{ left: 40, top: 30, width: 262, height: 480, "--i": 0 } as React.CSSProperties} />
        <div className="tb-panel" style={{ left: 314, top: 30, width: 366, height: 236, "--i": 1 } as React.CSSProperties} />
        <div className="tb-panel" style={{ left: 314, top: 274, width: 366, height: 236, "--i": 2 } as React.CSSProperties} />

        {/* The dithered art sits on top of the panels and spills past their edges. */}
        <canvas ref={canvasRef} className="tb-art" />

        {/* Tall panel */}
        <div className="tb-mono tb-fade" style={{ position: "absolute", left: 62, top: 56, "--i": 0 } as React.CSSProperties}>
          {metricLabel}: {metricNow >= 0 ? "+" : "-"}
          {Math.abs(metricNow).toFixed(1)}%
        </div>
        <div className="tb-handle" style={{ left: 132, top: 292, width: 84, height: 84 }}>
          <i />
          <i />
          <i />
          <i />
          <div style={{ position: "absolute", inset: 14 }}>
            <RingMark size={54} spin />
          </div>
        </div>
        <div className="tb-mono tb-fade" style={{ position: "absolute", left: 132, top: 384, fontSize: 7.5, color: "var(--tb-t3)", "--i": 1 } as React.CSSProperties}>
          84 × 84
        </div>
        <div className="tb-report" style={{ left: 62, top: 440 }}>
          {report}
          {!reduced && <span className="tb-caret" />}
        </div>

        {/* Top right panel */}
        <div style={{ position: "absolute", left: 334, top: 48 }}>
          <RingMark size={26} />
        </div>
        <div className="tb-mono tb-up tb-fade" style={{ position: "absolute", right: 58, top: 50, textAlign: "right", "--i": 1 } as React.CSSProperties}>
          {eyebrow[0]}
          <br />
          {eyebrow[1]}
          <br />
          <span style={{ letterSpacing: ".06em" }}>
            T+ {pad2(Math.floor(sec / 3600))}:{pad2(Math.floor(sec / 60) % 60)}:{pad2(sec % 60)}
          </span>
        </div>
        <div className="tb-mono tb-fade" style={{ position: "absolute", left: 334, bottom: 252, fontSize: 8.5, color: "var(--tb-t3)", "--i": 1 } as React.CSSProperties}>
          {tagline}
        </div>

        {/* Vitals card over the bottom right panel */}
        <div className="tb-vc" style={{ left: 392, top: 292, width: 232 }}>
          <div className="tb-vc-head">
            <div>
              <div className="tb-mono tb-up">{vitalsLabel}</div>
              <div className="tb-vc-title">{vitalsTitle}</div>
            </div>
            <span className="tb-chip">{vitalsDate} ⌄</span>
          </div>
          <div className="tb-num">
            <span className="tb-dg-row">
              {digits.map((d, i) => (
                <Digit key={digits.length - i} ch={d} />
              ))}
            </span>
          </div>
          <div className="tb-cap">{caption}</div>
          <Ruler value={age} min={18} max={80} />
          <div className="tb-stats">
            {stats.slice(0, 2).map((s, i) => (
              <div key={s.label}>
                <div className="tb-mono tb-up">{s.label}</div>
                <div className="tb-stat-v">
                  {s.value + (i === 1 && !reduced ? wobble : 0)}
                  {s.unit && <small>{s.unit}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
