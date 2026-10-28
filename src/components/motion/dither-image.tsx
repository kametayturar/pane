"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DitherPattern = "bayer4" | "bayer8"

export type DitherImageProps = {
  /** Image URL (same-origin, data: or blob: – the canvas must stay readable). Leave out to dither `children` or the built-in dragonfly. */
  src?: string
  /** An inline `<svg>` to dither instead of an image file. Use literal colours (not `currentColor` or CSS classes) – it is rasterised on its own. */
  children?: React.ReactNode
  /** Size of one dot cell in CSS px. Default 3. */
  cellSize?: number
  /** Ordered-dither matrix: `bayer4` is coarser and graphic, `bayer8` has finer tone steps. Default `bayer8`. */
  pattern?: DitherPattern
  /** 0–1. Higher means fewer dots overall. Default 0.5. */
  threshold?: number
  /** Tone contrast before dithering, 1 is untouched. Default 1.3. */
  contrast?: number
  /** Swap light and dark – dots appear where the picture is light (for pale subjects on dark photos). */
  invert?: boolean
  /** Dot colour (any CSS colour). Defaults to a calm slate blue, lighter in dark mode. */
  accent?: string
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** How the dots arrive the first time the image scrolls into view: `scatter` (dots fly in and settle), `sweep` (a wipe from the left) or `none`. Default `scatter`. */
  reveal?: "scatter" | "sweep" | "none" | boolean
  /** 0–1. Gentle wave that nudges dots and lets the density ripple over time. 0 keeps the picture still. Default 0.6. */
  drift?: number
  /** Accessible description of the picture. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dimg { --dimg-dot: #6b7aa1; position: relative; display: block; width: 100%; aspect-ratio: var(--dimg-ar, 4 / 3); }
:is(.dark, [data-theme="dark"]) .dimg { --dimg-dot: #a3b2dc; }
.dimg *, .dimg *::before, .dimg *::after { box-sizing: border-box }
.dimg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--dimg-accent, var(--dimg-dot)); pointer-events: none }
.dimg-src { display: none }
`

/* -------------------------------------------------------------------------- */
/*                        The drawn subject: a dragonfly                       */
/* -------------------------------------------------------------------------- */

const ART_W = 640
const ART_H = 480

/** Small seeded random generator so the drawing is identical on every load. */
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

/**
 * A dragonfly seen from above, drawn from maths: each wing is an outline between a leading and a trailing
 * edge, filled with a soft membrane gradient and crossed by longitudinal veins and tiny cross-veins.
 * Everything is plain black at varying opacity – the dither turns tone into dots.
 */
function dragonflySvg(): string {
  const rnd = seeded(11)
  const n = (v: number) => v.toFixed(1)
  const out: string[] = []

  const wing = (rx: number, ry: number, angle: number, mirror: boolean, L: number, wLE: number, wTE: number, hind: boolean) => {
    const prof = (s: number) => Math.pow(Math.sin(Math.PI * Math.min(1, 0.012 + 0.988 * s)), 0.58)
    const bend = (s: number) => 0.07 * L * s * s
    const le = (s: number) => -wLE * prof(s) + bend(s)
    const bulge = (s: number) => 1 + (hind ? 0.6 : 0.12) * Math.exp(-(((s - 0.2) / 0.19) ** 2))
    const te = (s: number) => wTE * prof(s) * bulge(s) + bend(s)
    const at = (s: number, q: number) => le(s) + q * (te(s) - le(s))
    const g: string[] = []
    // Outline / membrane.
    const top: string[] = []
    const bot: string[] = []
    const STEPS = 56
    for (let i = 0; i <= STEPS; i++) {
      const s = i / STEPS
      top.push(`${n(L * s)},${n(le(s))}`)
      bot.push(`${n(L * s)},${n(te(s))}`)
    }
    g.push(`<path d="M${top.join("L")}L${bot.reverse().join("L")}Z" fill="url(#mem)" stroke="#000" stroke-opacity=".55" stroke-width=".9"/>`)
    // Longitudinal veins.
    const NL = 6
    for (let j = 0; j <= NL; j++) {
      const q = j / NL
      const pts: string[] = []
      for (let i = 2; i <= 54; i++) {
        const s = i / STEPS
        pts.push(`${n(L * s)},${n(at(s, q))}`)
      }
      const w = j === 0 ? 3.2 : j === 1 ? 2 : 1.45
      if (j > 1) g.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="4.2" stroke-linecap="round"/>`)
      g.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="#000" stroke-opacity="${j === 0 ? 0.95 : 0.8}" stroke-width="${w}" stroke-linecap="round"/>`)
    }
    // Cross-veins: short ladder rungs between neighbouring veins.
    const rungs: string[] = []
    for (let j = 0; j < NL; j++) {
      for (let s = 0.04 + rnd() * 0.02; s < 0.965; s += 0.026 + rnd() * 0.016) {
        const s2 = s + (rnd() - 0.5) * 0.012
        rungs.push(`M${n(L * s)},${n(at(s, j / NL))}L${n(L * s2)},${n(at(Math.min(0.97, s2), (j + 1) / NL))}`)
      }
    }
    g.push(`<path d="${rungs.join("")}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="1.15"/>`)
    // Pterostigma: the dark cell near the tip of the leading edge.
    g.push(
      `<path d="M${n(L * 0.84)},${n(le(0.84))}L${n(L * 0.915)},${n(le(0.915))}L${n(L * 0.91)},${n(at(0.91, 0.1))}L${n(L * 0.835)},${n(at(0.835, 0.1))}Z" fill="#000" fill-opacity=".85"/>`,
    )
    const flip = mirror ? " scale(1,-1)" : ""
    out.push(`<g transform="translate(${rx} ${ry}) rotate(${angle})${flip}">${g.join("")}</g>`)
  }

  // Wings first (so the body sits on top). Local frame: head points to +x, thorax at the origin.
  wing(10, -7, -90 + 9, true, 246, 17, 31, false)
  wing(10, 7, 90 - 9, false, 246, 17, 31, false)
  wing(-10, -7, -90 - 10, true, 236, 19, 46, true)
  wing(-10, 7, 90 + 10, false, 236, 19, 46, true)

  // Abdomen: ten segments along a gentle curve, narrowing towards the tail.
  const body: string[] = []
  const SEG = 11
  const x0 = -26
  const x1 = -318
  const curve = (x: number) => 0.00017 * (x - x0) * (x - x0)
  for (let i = 0; i < SEG; i++) {
    const a = x0 + ((x1 - x0) * i) / SEG
    const b = x0 + ((x1 - x0) * (i + 1)) / SEG
    const mid = (a + b) / 2
    const t = i / (SEG - 1)
    const hw = 10.5 - 5.4 * t + (i === 2 ? 0.8 : 0) // slightly swollen third segment
    const slope = (Math.atan2(curve(b) - curve(a), b - a) * 180) / Math.PI
    const op = i % 2 ? 0.74 : 0.94
    body.push(
      `<ellipse cx="${n(mid)}" cy="${n(curve(mid))}" rx="${n(Math.abs(b - a) / 2 - 0.7)}" ry="${n(hw)}" transform="rotate(${n(slope)} ${n(mid)} ${n(curve(mid))})" fill="#000" fill-opacity="${op}"/>`,
    )
    // A pale spot on every other segment.
    if (i % 2 === 0) body.push(`<ellipse cx="${n(mid - 2)}" cy="${n(curve(mid))}" rx="${n(Math.abs(b - a) / 4)}" ry="${n(hw * 0.38)}" fill="#fff" fill-opacity=".5"/>`)
  }
  const tail = `<path d="M${n(x1 - 2)},${n(curve(x1) - 2)}l-16,-7M${n(x1 - 2)},${n(curve(x1) + 2)}l-16,7" stroke="#000" stroke-width="1.6" stroke-linecap="round" fill="none" stroke-opacity=".85"/>`
  // Legs (three pairs, tucked under the thorax).
  const legs: string[] = []
  for (const sgn of [-1, 1]) {
    legs.push(
      `<path d="M16,${sgn * 9}q12,${sgn * 14} 30,${sgn * 18}l9,${sgn * 11}M6,${sgn * 10}q4,${sgn * 20} 20,${sgn * 30}l6,${sgn * 12}M-6,${sgn * 10}q-2,${sgn * 22} 8,${sgn * 36}l2,${sgn * 12}" stroke="#000" stroke-opacity=".8" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
  }
  const thorax = `<ellipse cx="2" cy="0" rx="36" ry="21" fill="#000" fill-opacity=".92"/>
    <path d="M-14,-17q10,14 4,34M6,-19q10,17 4,38" stroke="#fff" stroke-opacity=".42" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
  const head = `<ellipse cx="46" cy="0" rx="14" ry="18" fill="#000" fill-opacity=".85"/>
    <ellipse cx="55" cy="-10" rx="13" ry="12" fill="#000" fill-opacity=".95"/><ellipse cx="55" cy="10" rx="13" ry="12" fill="#000" fill-opacity=".95"/>
    <ellipse cx="51" cy="-13" rx="4.2" ry="3" fill="#fff" fill-opacity=".55"/><ellipse cx="51" cy="13" rx="4.2" ry="3" fill="#fff" fill-opacity=".55"/>
    <path d="M62,-3q6,3 0,6" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none"/>`
  out.push(`<g>${legs.join("")}${body.join("")}${tail}${thorax}${head}</g>`)

  // A trail of specks drifting away from the wing tips and tail – they dissolve into single dots.
  const specks: string[] = []
  const tips: [number, number, number][] = [
    [8, -7, -78],
    [8, 7, 78],
    [-10, -7, -99],
    [-10, 7, 99],
    [-318, 0, 180],
  ]
  for (const [ox, oy, deg] of tips) {
    const th = (deg * Math.PI) / 180
    for (let i = 0; i < 34; i++) {
      const d = (deg === 180 ? 8 : 238) + Math.pow(rnd(), 1.6) * (deg === 180 ? 90 : 70)
      const j = (rnd() - 0.5) * (deg === 180 ? 26 : 90)
      const px = ox + Math.cos(th) * d - Math.sin(th) * j * 0.55
      const py = oy + Math.sin(th) * d + Math.cos(th) * j * 0.55
      const fade = 1 - (d - 238) / 80
      specks.push(`<circle cx="${n(px)}" cy="${n(py)}" r="${n(0.5 + rnd() * 1.5)}" fill-opacity="${n(0.2 + rnd() * 0.45 * Math.max(0.15, fade))}"/>`)
    }
  }
  out.push(`<g fill="#000">${specks.join("")}</g>`)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_W}" height="${ART_H}" viewBox="0 0 ${ART_W} ${ART_H}">` +
    `<defs><linearGradient id="mem" x1="0" x2="1" y1="0" y2="0.25"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".5" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>` +
    `<g transform="translate(352 240) rotate(-18) scale(0.98)">${out.join("")}</g></svg>`
  )
}

let ART_CACHE: string | null = null
const defaultArt = () => (ART_CACHE ??= dragonflySvg())

/* -------------------------------------------------------------------------- */
/*                             Ordered dither maths                           */
/* -------------------------------------------------------------------------- */

/** Bayer matrix of size n (power of two), values normalised to (0, 1). */
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
const BAYER: Record<DitherPattern, { n: number; m: Float32Array }> = {
  bayer4: { n: 4, m: bayerMatrix(4) },
  bayer8: { n: 8, m: bayerMatrix(8) },
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const hash = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return v - Math.floor(v)
}

type Source = { key: number; img: CanvasImageSource; w: number; h: number }

type Field = {
  n: number
  cols: number
  rows: number
  gx: Uint16Array
  gy: Uint16Array
  lvl: Float32Array
  thr: Float32Array
  /** Per-dot reveal: delay 0–1, and the offset (in cells) the dot starts from. */
  dly: Float32Array
  sx: Float32Array
  sy: Float32Array
  X: Float32Array
  Y: Float32Array
  B: Uint8Array
}

type BuildOptions = {
  pattern: DitherPattern
  threshold: number
  contrast: number
  invert: boolean
  reveal: "scatter" | "sweep" | "none"
}

/** Shrink the source to the dot grid (halving first for big photos so thin lines keep their tone) and read its tones. */
function buildField(source: Source, cols: number, rows: number, o: BuildOptions): Field | null {
  let cur: CanvasImageSource = source.img
  let cw = source.w
  let ch = source.h
  try {
    while (cw > cols * 2.2 && ch > rows * 2.2) {
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

    const { n: bn, m } = BAYER[o.pattern]
    const shift = o.threshold - 0.5
    const total = cols * rows
    const gx = new Uint16Array(total)
    const gy = new Uint16Array(total)
    const lvl = new Float32Array(total)
    const thr = new Float32Array(total)
    const dly = new Float32Array(total)
    const sx = new Float32Array(total)
    const sy = new Float32Array(total)
    const SHIM = 0.12
    let k = 0
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const a = px[i + 3] / 255
        if (a < 0.02) continue
        const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
        const d = (o.invert ? lum : 1 - lum) * a
        const level = clamp01((d - 0.5) * o.contrast + 0.5)
        const t = m[(y % bn) * bn + (x % bn)] + shift
        if (level + SHIM <= t) continue
        gx[k] = x
        gy[k] = y
        lvl[k] = level
        thr[k] = t
        const h1 = hash(k, 1)
        const h2 = hash(k, 2)
        const h3 = hash(k, 3)
        if (o.reveal === "sweep") {
          dly[k] = (x / cols) * 0.66 + (y / rows) * 0.12 + h1 * 0.14
          sx[k] = -(3 + h2 * 7)
          sy[k] = (h3 - 0.5) * 3
        } else {
          dly[k] = h1 * 0.78 + (Math.abs(x / cols - 0.5) + Math.abs(y / rows - 0.5)) * 0.1
          const ang = h2 * Math.PI * 2
          const rad = 5 + h3 * h3 * 34
          sx[k] = Math.cos(ang) * rad
          sy[k] = Math.sin(ang) * rad
        }
        k++
      }
    }
    return {
      n: k,
      cols,
      rows,
      gx: gx.slice(0, k),
      gy: gy.slice(0, k),
      lvl: lvl.slice(0, k),
      thr: thr.slice(0, k),
      dly: dly.slice(0, k),
      sx: sx.slice(0, k),
      sy: sy.slice(0, k),
      X: new Float32Array(k),
      Y: new Float32Array(k),
      B: new Uint8Array(k),
    }
  } catch {
    // A cross-origin image taints the canvas and cannot be read.
    return null
  }
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

const NB = 8 // alpha buckets: dots of one tone are filled in a single path
const REV_SPREAD = 0.8 // seconds over which the reveal delays are spread
const REV_DUR = 0.7 // seconds one dot takes to settle
const REV_TOTAL = REV_SPREAD + REV_DUR + 0.05

function serialiseSvg(svg: SVGElement): string {
  const clone = svg.cloneNode(true) as SVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  const vb = clone.getAttribute("viewBox")?.split(/[\s,]+/).map(Number)
  if (!clone.getAttribute("width")) clone.setAttribute("width", String(vb?.[2] || 300))
  if (!clone.getAttribute("height")) clone.setAttribute("height", String(vb?.[3] || 150))
  return new XMLSerializer().serializeToString(clone)
}

/**
 * DitherImage – any picture redrawn as a field of fine square dots with an ordered (Bayer) dither.
 * The dots assemble when it scrolls into view and drift in a slow wave afterwards.
 *
 *   <DitherImage src="/photo.jpg" cellSize={3} accent="#6b7aa1" />
 *   <DitherImage><svg viewBox="0 0 100 100">…</svg></DitherImage>
 *   <DitherImage />   // the built-in dragonfly
 */
export function DitherImage({
  src,
  children,
  cellSize = 3,
  pattern = "bayer8",
  threshold = 0.5,
  contrast = 1.3,
  invert = false,
  accent,
  speed = 1,
  paused,
  reveal = "scatter",
  drift = 0.6,
  label = "Dithered artwork",
  className,
}: DitherImageProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const [source, setSource] = React.useState<Source | null>(null)
  const keyRef = React.useRef(0)
  const lastMarkup = React.useRef<string | null>(null)

  /* ---------------------------- Load the source ---------------------------- */

  const loadImage = React.useCallback((url: string, cors: boolean, vectorSize?: [number, number]) => {
    let dead = false
    const img = new Image()
    if (cors) img.crossOrigin = "anonymous"
    img.onload = () => {
      if (dead) return
      const w = img.naturalWidth || vectorSize?.[0] || 300
      const h = img.naturalHeight || vectorSize?.[1] || 150
      setSource({ key: ++keyRef.current, img, w, h })
    }
    img.onerror = () => {
      if (!dead) setSource(null)
    }
    img.src = url
    return () => {
      dead = true
    }
  }, [])

  React.useEffect(() => {
    if (!src) return
    lastMarkup.current = null
    return loadImage(src, !/^(data|blob):/.test(src))
  }, [src, loadImage])

  // Inline SVG children and the built-in art: rasterised through an SVG image. Runs every render but only reloads when the markup changed.
  const cancelMarkup = React.useRef<(() => void) | null>(null)
  React.useEffect(() => {
    if (src) return
    let markup: string
    if (children != null) {
      const svg = hostRef.current?.querySelector("svg")
      if (!svg) return
      markup = serialiseSvg(svg)
    } else {
      markup = defaultArt()
    }
    if (markup === lastMarkup.current) return
    lastMarkup.current = markup
    cancelMarkup.current?.()
    cancelMarkup.current = loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`, false)
  })
  React.useEffect(
    () => () => {
      cancelMarkup.current?.()
      lastMarkup.current = null
    },
    [],
  )

  /* ------------------------------- The engine ------------------------------ */

  const revealMode: "scatter" | "sweep" | "none" = reveal === false || reveal === "none" ? "none" : reveal === "sweep" ? "sweep" : "scatter"
  const live = React.useRef({ speed: 1, paused: false, reduced: false, drift: 0, cellSize: 3, pattern, threshold, contrast, invert, reveal: revealMode })
  const ctl = React.useRef<{ update: () => void; rebuild: (restart: boolean) => void } | null>(null)
  const lastKey = React.useRef(-1)
  const sourceRef = React.useRef<Source | null>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    let field: Field | null = null
    let src: Source | null = null
    let raf = 0
    let last = 0
    let visible = false
    let started = false // the reveal starts the first time the picture is on screen
    let rt = 0 // reveal clock (s)
    let t = 0 // drift clock (s)
    let w = 0
    let h = 0
    let dpr = 1
    let pitch = 3
    let color = "#6b7aa1"
    let frame = 0

    const revealing = () => live.current.reveal !== "none" && !live.current.reduced && rt < REV_TOTAL
    const animated = () => revealing() || (live.current.drift > 0 && !live.current.reduced)
    const shouldRun = () => visible && !live.current.paused && !live.current.reduced && !document.hidden && !!field && animated()

    const readColor = () => {
      color = getComputedStyle(canvas).color || color
    }

    const rebuild = (restart: boolean) => {
      if (!src || !w || !h) return
      const p = live.current
      pitch = Math.max(2, Math.round(p.cellSize * dpr))
      const cols = Math.max(2, Math.ceil(canvas.width / pitch))
      const rows = Math.max(2, Math.ceil(canvas.height / pitch))
      field = buildField(src, cols, rows, { pattern: p.pattern, threshold: p.threshold, contrast: p.contrast, invert: p.invert, reveal: p.reveal })
      if (restart) {
        rt = p.reveal === "none" || p.reduced ? REV_TOTAL : 0
        started = false
      }
      update()
    }

    const paint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const f = field
      if (!f || !f.n) return
      const p = live.current
      const rev = revealing()
      if (rev && !started) return // waiting for first view
      const dot = pitch <= 2 ? 1 : Math.max(1, Math.round(pitch * 0.72))
      const off = (pitch - dot) / 2
      const moving = rev || (p.drift > 0 && !p.reduced)
      const base = moving ? off : Math.floor(off)
      const amp = p.reduced ? 0 : p.drift * pitch * 0.85
      const shim = p.reduced ? 0 : p.drift * 0.1
      let n = 0
      for (let k = 0; k < f.n; k++) {
        const gx = f.gx[k]
        const gy = f.gy[k]
        let l = f.lvl[k]
        if (shim) l += shim * Math.sin(gx * 0.042 - gy * 0.03 + t * 0.8)
        if (l <= f.thr[k]) continue
        let x = gx * pitch + base
        let y = gy * pitch + base
        let a = 0.58 + 0.42 * (l > 1 ? 1 : l)
        if (rev) {
          const q = clamp01((rt - f.dly[k] * REV_SPREAD) / REV_DUR)
          if (q <= 0) continue
          const e = 1 - (1 - q) * (1 - q) * (1 - q)
          x += f.sx[k] * pitch * (1 - e)
          y += f.sy[k] * pitch * (1 - e)
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

    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const s = dt * live.current.speed
      t += s
      if (started && rt < REV_TOTAL) rt += s
      if (frame++ % 40 === 0) readColor()
      paint()
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      readColor()
      // Paused (or reduced motion) before the reveal ever played: show the finished picture rather than nothing.
      if (!started && visible && (live.current.paused || live.current.reduced) && live.current.reveal !== "none") {
        rt = REV_TOTAL
      }
      // A hidden tab can't animate (rAF is suspended): show the settled picture instead of waiting for a reveal that never advances.
      if (document.hidden && !started && live.current.reveal !== "none") rt = REV_TOTAL
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

    const resize = () => {
      const rect = root.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 3)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      rebuild(false)
    }

    ctl.current = {
      update,
      rebuild: (restart) => {
        src = sourceRef.current
        rebuild(restart)
      },
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(update) // dark-mode switches repaint even while paused
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    resize()

    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  // Latest props for the loop. Visual changes rebuild the dot field; a new picture also replays the reveal.
  React.useEffect(() => {
    sourceRef.current = source
    live.current = { speed: Math.max(0.05, speed), paused: !!paused, reduced, drift: clamp01(drift), cellSize: Math.max(1, cellSize), pattern, threshold, contrast, invert, reveal: revealMode }
    const restart = !!source && source.key !== lastKey.current
    if (source) lastKey.current = source.key
    ctl.current?.rebuild(restart)
  }, [source, cellSize, pattern, threshold, contrast, invert, revealMode, reduced, speed, paused, drift, accent])

  const aspect = source ? source.w / source.h : !src && children == null ? ART_W / ART_H : 4 / 3
  const style = {
    "--dimg-ar": aspect,
    ...(accent ? { "--dimg-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={className ? `dimg ${className}` : "dimg"} style={style} role="img" aria-label={label}>
      <style href="pane-dither-image" precedence="default">
        {CSS}
      </style>
      <canvas ref={canvasRef} className="dimg-canvas" aria-hidden />
      {children != null && !src && (
        <div ref={hostRef} className="dimg-src" aria-hidden>
          {children}
        </div>
      )}
    </div>
  )
}
