"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ConfidenceDitherMode = "bar" | "distribution" | "field"

export type DitherOption = {
  /** Name of the option, e.g. "Billing". */
  label: string
  /** Probability 0–1. The options do not have to add up to 1. */
  p: number
}

export type DitherAlternative = {
  text: string
  /** Probability 0–1 of this word at this position. */
  p: number
}

export type DitherToken = {
  /** The word as generated. */
  text: string
  /** Probability 0–1 the model gave the word it chose. */
  confidence: number
  /** Other words it considered. The panel shows the top 3 including the chosen one. */
  alternatives?: DitherAlternative[]
}

export type ConfidenceDitherProps = {
  /** `bar`: one confidence with a tolerance band. `distribution`: probability over options. `field`: per-token confidence. */
  mode?: ConfidenceDitherMode
  /** bar: confidence 0–1. */
  value?: number
  /** bar: half-width of the tolerance band, 0–0.5 (drawn as ±). */
  tolerance?: number
  /** distribution: 4–6 options and their probabilities. */
  options?: DitherOption[]
  /** distribution: label of the chosen option. Defaults to the most likely one. */
  selected?: string
  /** field: the generated words with a confidence each. */
  tokens?: DitherToken[]
  /** Mono label above the piece. */
  label?: React.ReactNode
  /** Figure caption under the piece, e.g. "FIG. 1 — Ticket triage". */
  caption?: React.ReactNode
  /** Bayer matrix size. 8 has 64 grey levels, 4 has 16 and looks coarser. */
  matrix?: 4 | 8
  /** Dot pitch in CSS px. */
  cell?: number
  /** Scan the dots in on mount and when the values change. Reduced motion always shows the settled frame. */
  animate?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Example content                              */
/* -------------------------------------------------------------------------- */

export const EXAMPLE_OPTIONS: DitherOption[] = [
  { label: "Billing", p: 0.58 },
  { label: "Account access", p: 0.21 },
  { label: "Bug report", p: 0.11 },
  { label: "Feature request", p: 0.07 },
  { label: "Other", p: 0.03 },
]

export const EXAMPLE_TOKENS: DitherToken[] = [
  { text: "Your", confidence: 0.99, alternatives: [{ text: "Our", p: 0.006 }, { text: "The", p: 0.003 }] },
  { text: "refund", confidence: 0.97, alternatives: [{ text: "credit", p: 0.02 }, { text: "payment", p: 0.01 }] },
  { text: "was", confidence: 0.93, alternatives: [{ text: "has", p: 0.05 }, { text: "will", p: 0.02 }] },
  { text: "sent", confidence: 0.62, alternatives: [{ text: "issued", p: 0.27 }, { text: "returned", p: 0.08 }] },
  { text: "to", confidence: 0.96, alternatives: [{ text: "back", p: 0.03 }, { text: "onto", p: 0.01 }] },
  { text: "the", confidence: 0.99, alternatives: [{ text: "your", p: 0.01 }] },
  { text: "original", confidence: 0.88, alternatives: [{ text: "same", p: 0.08 }, { text: "card", p: 0.02 }] },
  { text: "card", confidence: 0.91, alternatives: [{ text: "payment", p: 0.06 }, { text: "account", p: 0.02 }] },
  { text: "and", confidence: 0.72, alternatives: [{ text: "so", p: 0.16 }, { text: "which", p: 0.09 }] },
  { text: "should", confidence: 0.54, alternatives: [{ text: "will", p: 0.31 }, { text: "may", p: 0.12 }] },
  { text: "arrive", confidence: 0.83, alternatives: [{ text: "appear", p: 0.09 }, { text: "land", p: 0.05 }] },
  { text: "within", confidence: 0.67, alternatives: [{ text: "in", p: 0.22 }, { text: "by", p: 0.08 }] },
  { text: "five", confidence: 0.31, alternatives: [{ text: "three", p: 0.27 }, { text: "seven", p: 0.22 }] },
  { text: "business", confidence: 0.85, alternatives: [{ text: "working", p: 0.11 }, { text: "calendar", p: 0.03 }] },
  { text: "days.", confidence: 0.78, alternatives: [{ text: "weeks.", p: 0.12 }, { text: "hours.", p: 0.07 }] },
  { text: "A", confidence: 0.74, alternatives: [{ text: "We", p: 0.18 }, { text: "Your", p: 0.06 }] },
  { text: "receipt", confidence: 0.9, alternatives: [{ text: "confirmation", p: 0.07 }, { text: "summary", p: 0.02 }] },
  { text: "is", confidence: 0.81, alternatives: [{ text: "has", p: 0.12 }, { text: "will", p: 0.06 }] },
  { text: "on", confidence: 0.58, alternatives: [{ text: "in", p: 0.2 }, { text: "being", p: 0.13 }] },
  { text: "its", confidence: 0.69, alternatives: [{ text: "the", p: 0.21 }, { text: "their", p: 0.08 }] },
  { text: "way.", confidence: 0.95, alternatives: [{ text: "way,", p: 0.03 }, { text: "way!", p: 0.01 }] },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.icd {
  --icd-paper: #fafafa;
  --icd-sheet: #ffffff;
  --icd-ink: #0a0a0a;
  --icd-signal: #0060e2;
  --icd-accent: var(--icd-signal);
  --icd-signal-soft: color-mix(in oklab, var(--icd-accent) 12%, transparent);
  --icd-surface: var(--icd-sheet);
  --icd-t1: color-mix(in oklab, var(--icd-ink) 92%, transparent);
  --icd-t2: color-mix(in oklab, var(--icd-ink) 64%, transparent);
  --icd-t3: color-mix(in oklab, var(--icd-ink) 44%, transparent);
  --icd-t4: color-mix(in oklab, var(--icd-ink) 22%, transparent);
  --icd-rule: color-mix(in oklab, var(--icd-ink) 14%, transparent);
  --icd-rule-2: color-mix(in oklab, var(--icd-ink) 7%, transparent);
  --icd-ok: #1f8a4c; --icd-warn: #b7791f; --icd-bad: #c4321a;
  --icd-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --icd-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --icd-font: var(--icd-sans);
  --icd-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --icd-ease: cubic-bezier(.2, .8, .2, 1);
  --icd-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; width: 100%; max-width: 720px; padding: 16px 18px 14px;
  background: var(--icd-surface); border-radius: 4px; box-shadow: 0 0 0 1px var(--icd-rule);
  font: 13px/20px var(--icd-font); color: var(--icd-t1); text-align: left; -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .icd {
  --icd-paper: #0c0c0d; --icd-sheet: #1c1c1e; --icd-ink: #f5f5f5; --icd-signal: #4d8dff;
}
.icd *, .icd *::before, .icd *::after { box-sizing: border-box }
:where(.icd) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: default; text-align: inherit }
.icd :focus-visible { outline: 1px solid var(--icd-accent); outline-offset: 2px }

/* crop marks: eight 1px strokes, just outside the corners */
.icd-crop {
  position: absolute; inset: -5px; pointer-events: none; --c: var(--icd-t4);
  background:
    linear-gradient(var(--c), var(--c)) 0 0 / 8px 1px, linear-gradient(var(--c), var(--c)) 0 0 / 1px 8px,
    linear-gradient(var(--c), var(--c)) 100% 0 / 8px 1px, linear-gradient(var(--c), var(--c)) 100% 0 / 1px 8px,
    linear-gradient(var(--c), var(--c)) 0 100% / 8px 1px, linear-gradient(var(--c), var(--c)) 0 100% / 1px 8px,
    linear-gradient(var(--c), var(--c)) 100% 100% / 8px 1px, linear-gradient(var(--c), var(--c)) 100% 100% / 1px 8px;
  background-repeat: no-repeat;
}

.icd-label, .icd-k, .icd-cap, .icd-tick-l, .icd-pop-h {
  font: 500 10.5px/16px var(--icd-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--icd-t3);
}
.icd-label { margin: 0; display: flex; align-items: center; gap: 8px }
.icd-label::before { content: ""; width: 8px; height: 1px; background: var(--icd-t3) }

/* readout row */
.icd-strip { display: flex; flex-wrap: wrap; margin: 10px 0 16px; border-block: 1px solid var(--icd-rule) }
.icd-kv { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 7px 18px 7px 0; margin-right: 18px; border-right: 1px solid var(--icd-rule) }
.icd-kv:last-child { margin-right: 0; padding-right: 0; border-right: 0 }
.icd-v { font: 400 15px/22px var(--icd-mono); font-variant-numeric: tabular-nums; color: var(--icd-t1); white-space: nowrap }
.icd-v small { font-size: 11px; color: var(--icd-t3); margin-left: 3px }
.icd-v em { font-style: normal; color: var(--icd-t2) }
.icd-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.icd-cap { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 16px; margin: 14px 0 0 }
.icd-cap-l { min-width: 0 }
.icd-legend { display: inline-flex; align-items: center; gap: 8px }
.icd-legend .icd-cv { width: 72px; height: 9px }

.icd-cv { position: relative; display: block; width: 100%; overflow: hidden }
.icd-cv canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
.icd-fill { position: absolute; inset: 0; width: auto }

/* bar */
.icd-ruler { position: relative; height: 30px; border-top: 1px solid var(--icd-rule) }
.icd-minor { position: absolute; left: 0; right: 0; top: 0; height: 4px; background: repeating-linear-gradient(90deg, var(--icd-t4) 0 1px, transparent 1px 5%) }
.icd-minor::after { content: ""; position: absolute; right: 0; top: 0; width: 1px; height: 4px; background: var(--icd-t4) }
.icd-maj { position: absolute; top: 0; width: 1px; height: 8px; background: var(--icd-t3) }
.icd-maj span { position: absolute; top: 11px; left: 0; transform: translateX(-50%); font: 500 10px/14px var(--icd-mono); color: var(--icd-t3); letter-spacing: .04em }
.icd-maj[data-edge="start"] span { transform: none }
.icd-maj[data-edge="end"] span { transform: translateX(-100%) }
.icd-band {
  position: absolute; top: -2px; height: 3px; background: var(--icd-t2);
  left: calc((var(--v) - var(--tol)) * 100%); width: calc(var(--tol) * 200%);
  transition: left .56s var(--icd-ease), width .56s var(--icd-ease);
}
.icd-band::before, .icd-band::after { content: ""; position: absolute; top: -3px; width: 1px; height: 9px; background: var(--icd-t2) }
.icd-band::before { left: 0 } .icd-band::after { right: 0 }
.icd-mark {
  position: absolute; top: -8px; width: 2px; height: 17px; margin-left: -1px; background: var(--icd-accent);
  left: calc(var(--v) * 100%); transition: left .56s var(--icd-ease);
}

/* distribution */
.icd-dist { display: grid; grid-template-columns: 34px minmax(0, 1fr); column-gap: 8px }
.icd-yaxis { position: relative }
.icd-yaxis span { position: absolute; right: 0; transform: translateY(50%); font: 500 10px/14px var(--icd-mono); color: var(--icd-t3); letter-spacing: .04em }
.icd-plot {
  position: relative; border-bottom: 1px solid var(--icd-t3);
  background: repeating-linear-gradient(0deg, var(--icd-rule-2) 0 1px, transparent 1px 25%);
}
.icd-opts { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)) }
.icd-opt { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 12px 2px 0; text-align: center }
.icd-opt::before { content: ""; position: absolute; top: 0; left: 50%; width: 1px; height: 6px; background: var(--icd-t3) }
.icd-opt-t { font: 400 12px/16px var(--icd-sans); color: var(--icd-t2); text-wrap: balance; overflow-wrap: anywhere }
.icd-opt-p { font: 400 11.5px/16px var(--icd-mono); font-variant-numeric: tabular-nums; color: var(--icd-t3) }
.icd-opt[data-chosen] .icd-opt-t { color: var(--icd-t1); font-weight: 500 }
.icd-opt[data-chosen] .icd-opt-p { color: var(--icd-t1) }
.icd-opt[data-chosen]::before { width: 2px; height: 9px; margin-left: -1px; background: var(--icd-accent) }

/* field */
.icd-field { position: relative; padding: 2px 0 }
.icd-words { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 6px 4px; margin: 0; padding: 4px 0 }
.icd-tok {
  position: relative; display: block; height: 48px; padding: 0 8px 18px; border-radius: 2px;
  font: 450 16px/30px var(--icd-sans); color: var(--icd-t1);
}
.icd-tok[data-low] { text-decoration: underline dashed var(--icd-warn); text-decoration-thickness: 1px; text-underline-offset: 5px }
.icd-tok:hover, .icd-tok[data-open] { box-shadow: 0 0 0 1px var(--icd-accent) }
.icd-pop {
  position: absolute; z-index: 5; width: 232px; padding: 10px 12px 8px; border-radius: 4px; background: var(--icd-surface);
  box-shadow: 0 0 0 1px var(--icd-rule), 0 1px 0 var(--icd-rule), 0 12px 24px -16px rgb(0 0 0 / .25);
  animation: icd-pop .16s var(--icd-ease) backwards;
}
.icd-pop-h { display: flex; justify-content: space-between; gap: 8px; padding-bottom: 6px; margin-bottom: 4px; border-bottom: 1px solid var(--icd-rule) }
.icd-alt { display: grid; grid-template-columns: minmax(0, 1fr) 64px 34px; align-items: center; gap: 8px; padding: 3px 0 }
.icd-alt-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--icd-t2); font-size: 13px }
.icd-alt[data-chosen] .icd-alt-t { color: var(--icd-t1); font-weight: 500 }
.icd-alt[data-chosen] .icd-alt-t::before { content: ""; display: inline-block; width: 5px; height: 5px; margin-right: 6px; vertical-align: 1px; background: var(--icd-accent) }
.icd-alt-p { font: 400 11.5px/16px var(--icd-mono); font-variant-numeric: tabular-nums; text-align: right; color: var(--icd-t2) }
@keyframes icd-pop { from { opacity: 0; transform: translateY(-3px) } }

@media (max-width: 480px) {
  .icd { padding: 14px 14px 12px }
  .icd-opt-t { font-size: 11px; line-height: 14px }
  .icd-kv { padding-right: 12px; margin-right: 12px }
}
@media (prefers-reduced-motion: reduce) {
  .icd *, .icd *::before, .icd *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               Dither engine                                */
/* -------------------------------------------------------------------------- */

/** Bayer threshold matrix, values in (0,1). */
function bayer(n: number): Float32Array {
  let m: number[][] = [[0]]
  let size = 1
  while (size < n) {
    const next: number[][] = Array.from({ length: size * 2 }, () => new Array<number>(size * 2).fill(0))
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + size] = v + 2
        next[y + size][x] = v + 3
        next[y + size][x + size] = v + 1
      }
    }
    m = next
    size *= 2
  }
  return Float32Array.from(m.flat().map((v) => (v + 0.5) / (n * n)))
}
const BAYER: Record<4 | 8, Float32Array> = { 4: bayer(4), 8: bayer(8) }

/** Tones: 0 ink, 1 signal, 2 soft ink (behind words), 3 faint ink (empty track). */
const TONE_ALPHA = [0.92, 1, 0.5, 0.14]

type Scene = { cols: number; rows: number; dens: Float32Array; tone: Uint8Array }
const makeScene = (cols: number, rows: number): Scene => ({
  cols,
  rows,
  dens: new Float32Array(cols * rows),
  tone: new Uint8Array(cols * rows),
})

type CanvasState = {
  w: number
  h: number
  scene: Scene | null
  prev: Scene | null
  p: number
  raf: number
  t0: number
  colors: { ink: string; accent: string } | null
  visible: boolean
  key: string
}

type DitherHandle = { relayout: () => void }

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function paintScene(canvas: HTMLCanvasElement, wrap: HTMLElement, s: CanvasState, cell: number, matrix: 4 | 8) {
  const dpr = window.devicePixelRatio || 1
  const cw = Math.max(1, Math.round(s.w * dpr))
  const ch = Math.max(1, Math.round(s.h * dpr))
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw
    canvas.height = ch
  }
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, cw, ch)
  const scene = s.scene
  if (!scene) return
  if (!s.colors) {
    const cs = getComputedStyle(wrap)
    s.colors = {
      ink: cs.getPropertyValue("--icd-ink").trim() || "#0a0a0a",
      accent: cs.getPropertyValue("--icd-accent").trim() || "#0060e2",
    }
  }
  const px = cell * dpr
  const dot = Math.max(1, Math.round(px * 0.7))
  const off = Math.floor((px - dot) / 2)
  const th = BAYER[matrix]
  const mask = matrix - 1
  const live = s.p < 1
  const bound = live ? s.p * scene.rows : scene.rows
  const prev = s.prev && s.prev.cols === scene.cols && s.prev.rows === scene.rows ? s.prev : null
  for (let tone = 0; tone < 4; tone++) {
    ctx.globalAlpha = TONE_ALPHA[tone]
    ctx.fillStyle = tone === 1 ? s.colors.accent : s.colors.ink
    for (let r = 0; r < scene.rows; r++) {
      const src = r < bound ? scene : prev
      if (!src) continue
      const y = Math.round(r * px + off)
      for (let c = 0; c < scene.cols; c++) {
        const i = r * scene.cols + c
        if (src.tone[i] !== tone) continue
        if (src.dens[i] <= th[(r & mask) * matrix + (c & mask)]) continue
        ctx.fillRect(Math.round(c * px + off), y, dot, dot)
      }
    }
  }
  if (live && s.p > 0) {
    ctx.globalAlpha = 0.9 * Math.pow(1 - s.p, 0.6)
    ctx.fillStyle = s.colors.accent
    ctx.fillRect(0, Math.min(ch - 1, Math.round(bound * px)), cw, Math.max(1, Math.round(dpr)))
  }
  ctx.globalAlpha = 1
}

type DitherCanvasProps = {
  /** Builds the dot densities for a grid of cols × rows cells (and the CSS size). */
  build: (cols: number, rows: number, w: number, h: number) => Scene
  /** Changes when the data changes. A new key scans the new dots in over the old ones. */
  dataKey: string
  cell: number
  matrix: 4 | 8
  animate: boolean
  /** Fixed CSS height. Leave out to fill the parent. */
  height?: number
  className?: string
  handle?: React.Ref<DitherHandle>
}

function DitherCanvas({ build, dataKey, cell, matrix, animate, height, className, handle }: DitherCanvasProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const buildRef = React.useRef(build)
  const opt = React.useRef({ cell, matrix, animate })
  const st = React.useRef<CanvasState>({ w: 0, h: 0, scene: null, prev: null, p: 1, raf: 0, t0: 0, colors: null, visible: false, key: dataKey })
  const api = React.useRef({ scan: (_prev: Scene | null) => {}, rebuild: () => {}, paint: () => {} })

  React.useLayoutEffect(() => {
    buildRef.current = build
    opt.current = { cell, matrix, animate }
  })

  React.useImperativeHandle(handle, () => ({ relayout: () => api.current.rebuild() }), [])

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const s = st.current
    const measure = () => {
      s.w = wrap.clientWidth
      s.h = wrap.clientHeight
    }
    const paint = () => paintScene(canvas, wrap, s, opt.current.cell, opt.current.matrix)
    const rebuild = () => {
      measure()
      const cols = Math.max(1, Math.floor(s.w / opt.current.cell))
      const rows = Math.max(1, Math.floor(s.h / opt.current.cell))
      s.scene = buildRef.current(cols, rows, s.w, s.h)
      if (s.p >= 1) s.prev = null
      paint()
    }
    const stop = () => {
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
    const scan = (prev: Scene | null) => {
      stop()
      if (!opt.current.animate || prefersReduced() || !s.scene) {
        s.prev = null
        s.p = 1
        paint()
        return
      }
      s.prev = prev
      s.p = 0
      s.t0 = 0
      const dur = clamp(520 + s.scene.rows * 5, 560, 880)
      const tick = (now: number) => {
        if (!s.t0) s.t0 = now
        const t = (now - s.t0) / dur
        if (t >= 1) {
          s.p = 1
          s.prev = null
          s.raf = 0
          paint()
          return
        }
        s.p = 1 - Math.pow(1 - Math.max(0, t), 2.4)
        paint()
        s.raf = requestAnimationFrame(tick)
      }
      s.raf = requestAnimationFrame(tick)
    }
    api.current = { scan, rebuild, paint }

    // First frame is the settled state; the entrance scan starts once the piece is on screen.
    s.p = 1
    rebuild()

    const ro = new ResizeObserver(() => {
      if (wrap.clientWidth !== s.w || wrap.clientHeight !== s.h) rebuild()
    })
    ro.observe(wrap)
    let entered = false
    const io = new IntersectionObserver((entries) => {
      s.visible = entries.some((e) => e.isIntersecting)
      if (s.visible && !entered) {
        entered = true
        scan(null)
      } else if (!s.visible && s.raf) {
        stop()
        s.p = 1
        s.prev = null
        paint()
      }
    })
    io.observe(wrap)
    const mo = new MutationObserver(() => {
      s.colors = null
      paint()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
    }
  }, [cell, matrix])

  React.useLayoutEffect(() => {
    const s = st.current
    if (s.key === dataKey) return
    s.key = dataKey
    const prev = s.scene
    api.current.rebuild()
    if (s.visible) api.current.scan(prev)
  }, [dataKey])

  return (
    <div ref={wrapRef} className={cn("icd-cv", className)} style={height ? { height } : undefined} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Settling numbers                             */
/* -------------------------------------------------------------------------- */

/** Counts to its value, with one tiny overshoot that returns (≤2%). Text is written to the DOM directly. */
function SettleNumber({ value, decimals = 2, prefix = "", suffix = "", animate = true }: { value: number; decimals?: number; prefix?: string; suffix?: string; animate?: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(0)
  const text = `${prefix}${value.toFixed(decimals)}${suffix}`
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`
    const from = shown.current
    const to = value
    el.textContent = fmt(to)
    shown.current = to
    if (!animate || prefersReduced() || from === to) return
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / 620)
      const e = 1 - Math.pow(1 - t, 3) + 0.02 * Math.sin(Math.PI * t) * t
      el.textContent = fmt(from + (to - from) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
      else el.textContent = fmt(to)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, decimals, prefix, suffix, animate])
  return (
    <>
      <span ref={ref} aria-hidden="true" />
      <span className="icd-sr">{text}</span>
    </>
  )
}

function Kv({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="icd-kv">
      <span className="icd-k">{k}</span>
      <span className="icd-v">{children}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Modes                                   */
/* -------------------------------------------------------------------------- */

type ModeProps = { cell: number; matrix: 4 | 8; animate: boolean }

function BarMode({ value, tolerance, cell, matrix, animate }: ModeProps & { value: number; tolerance: number }) {
  const v = clamp(value, 0, 1)
  const tol = clamp(tolerance, 0, 0.5)
  const rows = 8
  const build = React.useCallback(
    (cols: number, r: number) => {
      const s = makeScene(cols, r)
      const plateau = 0.04 + 0.96 * Math.pow(v, 1.25)
      for (let c = 0; c < cols; c++) {
        const fx = (c + 0.5) / cols
        let d = 0
        if (fx <= v - tol) d = plateau
        else if (fx < v + tol) d = plateau * (1 - (fx - (v - tol)) / (2 * tol || 1))
        for (let y = 0; y < r; y++) {
          const i = y * cols + c
          if (d > 0.12) {
            s.dens[i] = d
            s.tone[i] = 0
          } else {
            s.dens[i] = 0.12
            s.tone[i] = 3
          }
        }
      }
      return s
    },
    [v, tol],
  )
  return (
    <>
      <div className="icd-strip">
        <Kv k="Confidence">
          <SettleNumber value={v} animate={animate} />
        </Kv>
        <Kv k="Tolerance">
          <em>±</em>
          <SettleNumber value={tol} animate={animate} />
        </Kv>
        <Kv k="Range">
          <SettleNumber value={Math.max(0, v - tol)} animate={animate} />
          <small>–</small>
          <SettleNumber value={Math.min(1, v + tol)} animate={animate} />
        </Kv>
      </div>
      <div role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={v} aria-valuetext={`${v.toFixed(2)} plus or minus ${tol.toFixed(2)}`} aria-label="Confidence">
        <DitherCanvas build={build} dataKey={`${v}|${tol}`} cell={cell} matrix={matrix} animate={animate} height={rows * cell} />
        <div className="icd-ruler" style={{ "--v": v, "--tol": tol } as React.CSSProperties}>
          <div className="icd-minor" />
          {[0, 25, 50, 75, 100].map((t) => (
            <div key={t} className="icd-maj" style={{ left: `${t}%` }} data-edge={t === 0 ? "start" : t === 100 ? "end" : undefined}>
              <span>{t}</span>
            </div>
          ))}
          <div className="icd-band" />
          <div className="icd-mark" />
        </div>
      </div>
    </>
  )
}

function DistributionMode({ options, selected, label, cell, matrix, animate }: ModeProps & { options: DitherOption[]; selected?: string; label: string }) {
  const opts = options.map((o) => ({ label: o.label, p: clamp(o.p, 0, 1) }))
  const n = Math.max(1, opts.length)
  let chosen = opts.findIndex((o) => o.label === selected)
  if (chosen < 0) chosen = opts.reduce((best, o, i) => (o.p > opts[best].p ? i : best), 0)
  const sig = opts.map((o) => `${o.label}:${o.p}`).join("|") + `#${chosen}`
  const rows = 32
  const build = (cols: number, r: number) => {
      const s = makeScene(cols, r)
      for (let c = 0; c < cols; c++) {
        const fx = (c + 0.5) / cols
        let h = 0
        let own = 0
        for (let i = 0; i < opts.length; i++) {
          const dx = (fx - (i + 0.5) / n) * n
          const v = opts[i].p * Math.exp(-(dx * dx) / (2 * 0.22 * 0.22))
          if (v > h) {
            h = v
            own = i
          }
        }
        for (let y = 0; y < r; y++) {
          const height = (r - y - 0.5) / r
          if (height <= h) {
            s.dens[y * cols + c] = 0.97 - 0.6 * height
            s.tone[y * cols + c] = own === chosen ? 1 : 0
          }
        }
      }
      return s
  }
  const sorted = [...opts].sort((a, b) => b.p - a.p)
  const total = opts.reduce((a, o) => a + o.p, 0) || 1
  const entropy = -opts.reduce((a, o) => (o.p > 0 ? a + (o.p / total) * Math.log2(o.p / total) : a), 0)
  const margin = (sorted[0]?.p ?? 0) - (sorted[1]?.p ?? 0)
  const summary = opts.map((o) => `${o.label} ${Math.round(o.p * 100)}%`).join(", ")
  return (
    <>
      <div className="icd-strip">
        <Kv k="Top-1">
          <SettleNumber value={(sorted[0]?.p ?? 0) * 100} decimals={0} suffix="%" animate={animate} />
        </Kv>
        <Kv k="Margin">
          <SettleNumber value={margin * 100} decimals={0} prefix="+" animate={animate} />
          <small>pts</small>
        </Kv>
        <Kv k="Entropy">
          <SettleNumber value={entropy} animate={animate} />
          <small>bits</small>
        </Kv>
      </div>
      <div role="img" aria-label={`${label}: ${summary}. Chosen: ${opts[chosen]?.label}.`}>
        <div className="icd-dist">
          <div className="icd-yaxis" aria-hidden="true">
            {[0, 25, 50, 75, 100].map((t) => (
              <span key={t} style={{ bottom: `${t}%` }}>
                {t}
              </span>
            ))}
          </div>
          <div className="icd-plot">
            <DitherCanvas build={build} dataKey={sig} cell={cell} matrix={matrix} animate={animate} height={rows * cell} />
          </div>
          <div />
          <div className="icd-opts" style={{ "--n": n } as React.CSSProperties}>
            {opts.map((o, i) => (
              <div key={o.label} className="icd-opt" data-chosen={i === chosen ? "" : undefined}>
                <span className="icd-opt-t">{o.label}</span>
                <span className="icd-opt-p">{Math.round(o.p * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function MiniBar({ p, chosen, animate }: { p: number; chosen: boolean; animate: boolean }) {
  const build = React.useCallback(
    (cols: number, rows: number) => {
      const s = makeScene(cols, rows)
      for (let c = 0; c < cols; c++) {
        const on = (c + 0.5) / cols < p
        for (let y = 0; y < rows; y++) {
          s.dens[y * cols + c] = on ? 0.9 : 0.14
          s.tone[y * cols + c] = on ? (chosen ? 1 : 0) : 3
        }
      }
      return s
    },
    [p, chosen],
  )
  return <DitherCanvas build={build} dataKey={`${p}|${chosen}`} cell={3} matrix={4} animate={animate} height={9} />
}

function FieldMode({ tokens, cell, matrix, animate }: ModeProps & { tokens: DitherToken[] }) {
  const fieldRef = React.useRef<HTMLDivElement>(null)
  const els = React.useRef<(HTMLButtonElement | null)[]>([])
  const canvas = React.useRef<DitherHandle>(null)
  const popId = React.useId()
  const [open, setOpen] = React.useState<{ i: number; left: number; top: number } | null>(null)

  const build = (cols: number, rows: number) => {
    const s = makeScene(cols, rows)
    tokens.forEach((t, i) => {
      const el = els.current[i]
      if (!el) return
      const x0 = el.offsetLeft
      const y0 = el.offsetTop
      const w = el.offsetWidth
      const h = el.offsetHeight
      const base = 0.06 + 0.92 * Math.pow(clamp(t.confidence, 0, 1), 1.15)
      const stripe = y0 + h * 0.64 // words sit on top; their confidence is the dither strip under them
      for (let r = Math.floor(stripe / cell); r <= Math.ceil((y0 + h) / cell); r++) {
        const cy = (r + 0.5) * cell
        if (r < 0 || r >= rows || cy < stripe || cy >= y0 + h) continue
        for (let c = Math.floor(x0 / cell); c <= Math.ceil((x0 + w) / cell); c++) {
          const cx = (c + 0.5) * cell
          if (c < 0 || c >= cols || cx < x0 || cx >= x0 + w) continue
          s.dens[r * cols + c] = base > 0.12 ? base : 0.12
          s.tone[r * cols + c] = base > 0.12 ? 0 : 3
        }
      }
    })
    return s
  }
  const dataKey = tokens.map((t) => `${t.text}:${t.confidence}`).join("|")

  // Word boxes move when fonts load or the line breaks change; re-measure then.
  React.useEffect(() => {
    const ro = new ResizeObserver(() => canvas.current?.relayout())
    els.current.forEach((el) => el && ro.observe(el))
    if (fieldRef.current) ro.observe(fieldRef.current)
    return () => ro.disconnect()
  }, [dataKey])

  const show = (i: number) => {
    const el = els.current[i]
    const field = fieldRef.current
    if (!el || !field) return
    const left = clamp(el.offsetLeft, 0, Math.max(0, field.clientWidth - 232))
    setOpen({ i, left, top: el.offsetTop + el.offsetHeight + 6 })
  }

  const mean = tokens.reduce((a, t) => a + t.confidence, 0) / Math.max(1, tokens.length)
  const lowest = tokens.reduce((lo, t) => (t.confidence < lo.confidence ? t : lo), tokens[0] ?? { text: "", confidence: 0 })
  const flagged = tokens.filter((t) => t.confidence < 0.5).length

  const tok = open ? tokens[open.i] : null
  const list = tok
    ? [{ text: tok.text, p: tok.confidence, chosen: true }, ...(tok.alternatives ?? []).map((a) => ({ ...a, chosen: false }))]
        .sort((a, b) => b.p - a.p)
        .slice(0, 3)
    : []

  return (
    <>
      <div className="icd-strip">
        <Kv k="Tokens">{tokens.length}</Kv>
        <Kv k="Mean">
          <SettleNumber value={mean} animate={animate} />
        </Kv>
        <Kv k="Lowest">
          <SettleNumber value={lowest.confidence} animate={animate} />
          <small>“{lowest.text}”</small>
        </Kv>
        <Kv k="Below 0.5">{flagged}</Kv>
      </div>
      <div className="icd-field" ref={fieldRef} onMouseLeave={() => setOpen(null)} onKeyDown={(e) => e.key === "Escape" && setOpen(null)}>
        <p className="icd-words">
          {tokens.map((t, i) => (
            <button
              key={`${i}-${t.text}`}
              type="button"
              ref={(el) => {
                els.current[i] = el
              }}
              className="icd-tok"
              data-low={t.confidence < 0.5 ? "" : undefined}
              data-open={open?.i === i ? "" : undefined}
              aria-describedby={open?.i === i ? popId : undefined}
              onPointerEnter={() => show(i)}
              onFocus={() => show(i)}
              onBlur={() => setOpen(null)}
            >
              {t.text}
              <span className="icd-sr"> confidence {t.confidence.toFixed(2)}</span>
            </button>
          ))}
        </p>
        <DitherCanvas className="icd-fill" build={build} dataKey={dataKey} cell={cell} matrix={matrix} animate={animate} handle={canvas} />
        {open && tok ? (
          <div key={open.i} id={popId} role="tooltip" className="icd-pop" style={{ left: open.left, top: open.top }}>
            <div className="icd-pop-h">
              <span>Token {String(open.i + 1).padStart(2, "0")}</span>
              <span>Top {list.length}</span>
            </div>
            {list.map((a) => (
              <div key={a.text} className="icd-alt" data-chosen={a.chosen ? "" : undefined}>
                <span className="icd-alt-t">{a.text}</span>
                <MiniBar p={a.p} chosen={a.chosen} animate={animate} />
                <span className="icd-alt-p">{Math.round(a.p * 100)}%</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}

function Legend({ cell, matrix }: { cell: number; matrix: 4 | 8 }) {
  const build = React.useCallback((cols: number, rows: number) => {
    const s = makeScene(cols, rows)
    for (let c = 0; c < cols; c++) for (let y = 0; y < rows; y++) s.dens[y * cols + c] = (c + 0.5) / cols
    return s
  }, [])
  return (
    <span className="icd-legend" aria-hidden="true">
      <span>0</span>
      <DitherCanvas build={build} dataKey="legend" cell={Math.max(2, cell - 1)} matrix={matrix} animate={false} height={9} />
      <span>1</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_LABEL: Record<ConfidenceDitherMode, string> = {
  bar: "Answer confidence",
  distribution: "Which category is this ticket?",
  field: "Generated reply · token confidence",
}

export function ConfidenceDither({
  mode = "bar",
  value = 0.86,
  tolerance = 0.06,
  options = EXAMPLE_OPTIONS,
  selected,
  tokens = EXAMPLE_TOKENS,
  label,
  caption,
  matrix = 8,
  cell = 4,
  animate = true,
  className,
}: ConfidenceDitherProps) {
  const text = label ?? DEFAULT_LABEL[mode]
  const common = { cell, matrix, animate }
  return (
    <div className={cn("icd", className)} data-mode={mode}>
      <style href="confidence-dither" precedence="default">
        {CSS}
      </style>
      <span className="icd-crop" aria-hidden="true" />
      <p className="icd-label">{text}</p>
      {mode === "bar" ? <BarMode {...common} value={value} tolerance={tolerance} /> : null}
      {mode === "distribution" ? <DistributionMode {...common} options={options} selected={selected} label={typeof text === "string" ? text : "Distribution"} /> : null}
      {mode === "field" ? <FieldMode {...common} tokens={tokens} /> : null}
      {caption || mode === "field" ? (
        <div className="icd-cap">
          <span className="icd-cap-l">{caption}</span>
          {mode === "field" ? <Legend cell={cell} matrix={matrix} /> : null}
        </div>
      ) : null}
    </div>
  )
}
