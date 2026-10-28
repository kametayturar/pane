"use client"

import * as React from "react"
import { AppWindow, Bell, Database, LayoutDashboard, Warehouse, Zap } from "lucide-react"

/**
 * DataFlow – sources on the left, a processing core with a live count in the middle, destinations on the right.
 * Records leave the sources as hollow dots, travel curved paths, turn into solid accent squares inside the core and
 * fan out to every destination that takes them (a destination with `share: 0.34` gets about every third record).
 *
 *   <DataFlow sources={[{ label: "App", meta: "Web and iOS", icon: <AppWindow /> }, …]} destinations={[…]} />
 */

export type DataFlowNode = {
  id?: string
  /** First line of the node. */
  label: string
  /** Second line (a product or a short note). */
  meta?: string
  /** One-line tag shown on hover. */
  detail?: string
  /** Glyph for the node: any ReactNode (a lucide icon, an <img>, an svg). */
  icon?: React.ReactNode
  /** Colour of the glyph (applied as `color`). Muted by default. */
  color?: string
}
export type DataFlowDestination = DataFlowNode & {
  /** 0 to 1 – thins the destination out evenly: 0.34 receives about every third record. Default 1. */
  share?: number
}
export type DataFlowCore = {
  /** Name of the processing step. */
  label?: string
  /** One-line tag shown when the core is hovered. */
  detail?: string
  /** The word after the live count. */
  countLabel?: string
  /** Number the live count starts from. */
  countStart?: number
}
export type DataFlowProps = {
  /** Where records come from (1–4, three read best). */
  sources?: DataFlowNode[]
  /** Where processed records go (1–4). */
  destinations?: DataFlowDestination[]
  /** The processing step in the middle. */
  core?: DataFlowCore
  /** Motion speed multiplier – 1 is the designed pace (a record takes about four seconds end to end). */
  speed?: number
  /** Freeze all motion on the current frame (it eases to rest). */
  paused?: boolean
  /** Accent colour (any CSS colour) for processed records, trails and active paths. */
  accent?: string
  /** Accessible description of the diagram. Built from the labels when left out. */
  label?: string
  /** Optional visible caption under the diagram. */
  caption?: React.ReactNode
  className?: string
}

const ic = { strokeWidth: 1.75, "aria-hidden": true } as const
const DEFAULT_SOURCES: DataFlowNode[] = [
  { label: "App", meta: "Web and iOS", detail: "Clicks and sessions as they happen", icon: <AppWindow {...ic} /> },
  { label: "Database", meta: "Postgres", detail: "Row changes through change data capture", icon: <Database {...ic} />, color: "#2f7ad9" },
  { label: "Events", meta: "Webhooks", detail: "Payments, refunds and disputes", icon: <Zap {...ic} />, color: "#8b5cf6" },
]
const DEFAULT_DESTINATIONS: DataFlowDestination[] = [
  { label: "Warehouse", meta: "Every record", detail: "Stored in full for analysis", icon: <Warehouse {...ic} /> },
  { label: "Dashboard", meta: "Live metrics", detail: "Rolled up into metrics each minute", icon: <LayoutDashboard {...ic} /> },
  { label: "Alerts", meta: "Chat", detail: "Only unusual records reach #data-alerts", icon: <Bell {...ic} />, color: "#e8731a", share: 0.34 },
]

/* -------------------------------------------------------------------------- */
/*                                 Geometry                                   */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 300
const CX = 320
const CY = 138
const CHIP_W = 148
const CHIP_H = 52
const CORE = 84
const SPACING = 86
const PERIOD = 1.1 // seconds between two records
const IN = 1.5
const DWELL = 0.55
const OUT = 1.5
const TAIL = 0.55
const LIFE = IN + DWELL + OUT + TAIL
const POOL = Math.ceil(LIFE / PERIOD) + 1
const TRAIL = 74
const SRC_ORDER = [1, 0, 2, 1, 2, 0]
const START = 4.6

const rowY = (i: number, n: number) => CY + (i - (n - 1) / 2) * SPACING
const inPath = (y: number) => {
  const ye = CY + (y - CY) * 0.155
  return `M${CHIP_W} ${y} C${CHIP_W + 80} ${y} ${CHIP_W + 80} ${ye} ${CX - CORE / 2} ${ye} L${CX} ${CY}`
}
const outPath = (y: number) => {
  const ye = CY + (y - CY) * 0.155
  const x0 = CX + CORE / 2
  const x1 = W - CHIP_W
  const mid = (x0 + x1) / 2
  return `M${CX} ${CY} L${x0} ${ye} C${mid} ${ye} ${mid} ${y} ${x1} ${y}`
}

/** True when the destination takes record `n` (even thinning for share < 1). */
const takes = (share: number, n: number) => share >= 0.999 || Math.floor((n + 1) * share + 1e-9) > Math.floor(n * share + 1e-9)

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const ease = (p: number) => {
  const x = clamp01(p)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
const bump = (p: number) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * Math.min(1, p * 1.6)))

const cache = new WeakMap<Element, Record<string, string>>()
function put(el: Element | null | undefined, kind: "a" | "s", key: string, value: string | number) {
  if (!el) return
  const v = typeof value === "number" ? String(Math.round(value * 100) / 100) : value
  let c = cache.get(el)
  if (!c) cache.set(el, (c = {}))
  const k = kind + key
  if (c[k] === v) return
  c[k] = v
  if (kind === "a") el.setAttribute(key, v)
  else (el as HTMLElement).style.setProperty(key, v)
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const hoverRules = Array.from({ length: 4 }, (_, i) =>
  [
    `.dtf:has(.dtf-chip[data-n="s${i}"]:hover) .dtf-pi-${i} { stroke: var(--dtf-accent); stroke-width: 1.75 }`,
    `.dtf:has(.dtf-chip[data-n="d${i}"]:hover) .dtf-po-${i} { stroke: var(--dtf-accent); stroke-width: 1.75 }`,
  ].join("\n"),
).join("\n")

const CSS = `
.dtf {
  --dtf-ink: #000;
  --dtf-surface: #fff;
  --dtf-accent: #0060e2;
  --dtf-t1: color-mix(in oklab, var(--dtf-ink) 88%, transparent);
  --dtf-t2: color-mix(in oklab, var(--dtf-ink) 61%, transparent);
  --dtf-t3: color-mix(in oklab, var(--dtf-ink) 45%, transparent);
  --dtf-line: color-mix(in oklab, var(--dtf-ink) 17%, transparent);
  --dtf-edge: color-mix(in oklab, var(--dtf-ink) 8%, transparent);
  --dtf-core-edge: color-mix(in oklab, var(--dtf-ink) 22%, transparent);
  --dtf-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 2px 6px -2px rgb(0 0 0 / .06);
  --dtf-scale: 1;
  margin: 0; width: 100%; max-width: ${W}px; text-align: left;
  font-family: var(--dtf-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--dtf-t1);
}
:is(.dark, [data-theme="dark"]) .dtf {
  --dtf-ink: #fff; --dtf-surface: #1c1c1e; --dtf-accent: #4d8dff;
  --dtf-t1: color-mix(in oklab, var(--dtf-ink) 90%, transparent);
  --dtf-t2: color-mix(in oklab, var(--dtf-ink) 62%, transparent);
  --dtf-t3: color-mix(in oklab, var(--dtf-ink) 46%, transparent);
  --dtf-line: color-mix(in oklab, var(--dtf-ink) 20%, transparent);
  --dtf-edge: color-mix(in oklab, var(--dtf-ink) 10%, transparent);
  --dtf-core-edge: color-mix(in oklab, var(--dtf-ink) 26%, transparent);
  --dtf-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 8px -2px rgb(0 0 0 / .5);
}
.dtf *, .dtf *::before, .dtf *::after { box-sizing: border-box }
.dtf-box { position: relative; width: 100%; aspect-ratio: ${W} / ${H}; overflow: visible }
.dtf-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--dtf-scale)) }
.dtf-svg { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: visible; pointer-events: none }
.dtf-p { fill: none; stroke: var(--dtf-line); stroke-width: 1.25; transition: stroke .2s }
${hoverRules}
.dtf:has(.dtf-core:hover) .dtf-p { stroke: var(--dtf-accent); stroke-width: 1.75 }

.dtf-chip { position: absolute; width: ${CHIP_W}px; height: ${CHIP_H}px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border-radius: 16px;
  background: var(--dtf-surface); box-shadow: var(--dtf-shadow); --lit: 0; }
.dtf-chip::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  border: 1px solid color-mix(in oklab, var(--dtf-accent) calc(var(--lit) * 70%), var(--dtf-edge)) }
.dtf-mark { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ic, var(--dtf-t2)) }
.dtf-mark > svg, .dtf-mark > img { display: block; width: 16px; height: 16px; object-fit: contain }
.dtf-text { display: flex; flex-direction: column; min-width: 0 }
.dtf-label { font-size: 14px; line-height: 20px; font-weight: 500; letter-spacing: -.01em; color: var(--dtf-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.dtf-meta { font-size: 12px; line-height: 16px; letter-spacing: -.005em; color: var(--dtf-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.dtf-tag { position: absolute; z-index: 5; top: calc(100% + 6px); padding: 3px 8px; border-radius: 999px; background: var(--dtf-ink); color: var(--dtf-surface);
  font-size: 12px; line-height: 14px; font-weight: 500; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(-3px); transition: opacity .18s, transform .18s }
.dtf-chip[data-side="l"] .dtf-tag { left: 0 }
.dtf-chip[data-side="r"] .dtf-tag { right: 0 }
@media (hover: hover) { .dtf-chip:hover .dtf-tag, .dtf-core:hover .dtf-tag { opacity: 1; transform: none } }

.dtf-core { position: absolute; left: ${CX - CORE / 2}px; top: ${CY - CORE / 2}px; width: ${CORE}px; height: ${CORE}px; border-radius: 28%;
  background: var(--dtf-surface); border: 1px solid var(--dtf-core-edge); box-shadow: var(--dtf-shadow) }
.dtf-core .dtf-tag { top: auto; bottom: calc(100% + 8px); left: 50%; margin-left: 0; translate: -50% 0 }
.dtf-count { position: absolute; left: ${CX - 90}px; width: 180px; top: ${CY + CORE / 2 + 12}px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0 }
.dtf-count .dtf-label { font-size: 14px }
.dtf-count .dtf-meta { color: var(--dtf-t2); font-variant-numeric: tabular-nums }
.dtf-ring { fill: none; stroke: var(--dtf-line); stroke-width: 1.5; stroke-dasharray: 1.5 5; stroke-linecap: round }
.dtf-pulse { fill: none; stroke: var(--dtf-accent); stroke-width: 1.25; opacity: 0 }
.dtf-eye { fill: var(--dtf-accent); opacity: .85 }
.dtf-port { fill: var(--dtf-surface); stroke: var(--dtf-line); stroke-width: 1.25 }
.dtf-hit { fill: var(--dtf-accent); opacity: var(--lit, 0) }
.dtf-trail { fill: none; stroke-width: 2; stroke-linecap: round }
.dtf-trail-in { stroke: color-mix(in oklab, var(--dtf-ink) 38%, transparent) }
.dtf-trail-out { stroke: var(--dtf-accent) }
.dtf-raw { fill: var(--dtf-surface); stroke: color-mix(in oklab, var(--dtf-ink) 55%, transparent); stroke-width: 1.25 }
.dtf-done { fill: var(--dtf-accent) }
.dtf-cap { margin: 12px 0 0; font-size: 13px; line-height: 20px; color: var(--dtf-t2) }
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

type Geo = { inP: SVGPathElement[]; outP: SVGPathElement[]; inLen: number[]; outLen: number[]; inD: string[]; outD: string[] }

export function DataFlow({
  sources = DEFAULT_SOURCES,
  destinations = DEFAULT_DESTINATIONS,
  core,
  speed = 1,
  paused,
  accent,
  label,
  caption,
  className,
}: DataFlowProps) {
  const srcs = sources.slice(0, 4)
  const dsts = destinations.slice(0, 4)
  const ns = srcs.length
  const nd = dsts.length
  const coreLabel = core?.label ?? "Transform"
  const countLabel = core?.countLabel ?? "processed"
  const countStart = core?.countStart ?? 12480
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const geo = React.useRef<Geo | null>(null)
  const nodes = React.useRef<{
    slots: { g: Element; inTrail: Element; raw: Element; done: Element; outTrail: Element[]; outRect: Element[] }[]
    chips: Element[]
    ports: Element[]
    pulse: Element | null
    ring: Element | null
    count: Element | null
  } | null>(null)

  const time = React.useRef(START)
  const rate = React.useRef(paused ? 0 : 1)
  const hover = React.useRef(1)
  const frozen = React.useRef(!!paused)
  const target = React.useRef(Math.max(0.05, speed))
  const kick = React.useRef<() => void>(() => {})

  const fmt = React.useMemo(() => new Intl.NumberFormat("en-US"), [])
  const shares = React.useMemo(() => dsts.map((d) => clamp01(d.share ?? 1)), [dsts])

  /** Writes every moving part for clock time `t` (seconds of designed pace). */
  const draw = (t: number) => {
    const g = geo.current
    const nd_ = nodes.current
    if (!g || !nd_) return
    const nNow = Math.floor(t / PERIOD)
    const used: boolean[] = Array(POOL).fill(false)
    const litS = Array(ns).fill(0)
    const litD = Array(nd).fill(0)
    let pulse = 0
    let spin = 0

    for (let n = Math.max(0, nNow - POOL); n <= nNow; n++) {
      const u = t - n * PERIOD
      if (u < 0 || u > LIFE) continue
      const slot = nd_.slots[n % POOL]
      used[n % POOL] = true
      const src = SRC_ORDER[n % SRC_ORDER.length] % ns
      const dests: number[] = []
      for (let j = 0; j < nd; j++) if (takes(shares[j], n)) dests.push(j)

      const { inTrail, raw, done, outTrail, outRect } = slot
      put(slot.g, "a", "visibility", "visible")
      // Reset the parts that this phase does not use.
      let rawOp = 0
      let doneOp = 0
      let inTrailOp = 0
      let px = CX
      let py = CY
      let sc = 1
      let rx = 4

      if (u < IN) {
        const p = ease(u / IN)
        const s = p * g.inLen[src]
        const pt = g.inP[src].getPointAtLength(s)
        px = pt.x
        py = pt.y
        rawOp = clamp01(u / 0.3)
        const from = Math.max(0, s - TRAIL)
        put(inTrail, "a", "d", g.inD[src])
        put(inTrail, "a", "stroke-dasharray", `${(s - from).toFixed(1)} ${(g.inLen[src] * 2).toFixed(0)}`)
        put(inTrail, "a", "stroke-dashoffset", (-from).toFixed(1))
        inTrailOp = 0.55 * clamp01(u / 0.4)
        litS[src] = Math.max(litS[src], 1 - clamp01(u / 0.9))
      } else if (u < IN + DWELL) {
        const m = ease((u - IN) / DWELL)
        rawOp = 1 - m
        doneOp = m
        sc = 1 + 0.28 * Math.sin(Math.PI * m)
        rx = 4 - 2.5 * m
        const q = (u - IN) / DWELL
        pulse = Math.max(pulse, Math.sin(Math.PI * clamp01(q)))
        spin += 80 * m
        // trail finishes into the core outline
        const fade = clamp01(1 - q * 2.2)
        inTrailOp = 0.55 * fade
        put(inTrail, "a", "stroke-dasharray", `${TRAIL} ${(g.inLen[src] * 2).toFixed(0)}`)
        put(inTrail, "a", "stroke-dashoffset", (-(g.inLen[src] - TRAIL)).toFixed(1))
      } else {
        spin += 80
      }
      if (u >= IN + DWELL) {
        const q = (u - IN - DWELL) / OUT
        const p = ease(q)
        doneOp = 1
        rx = 1.5
        dests.forEach((j, idx) => {
          const L = g.outLen[j]
          const s = p * L
          const pt = g.outP[j].getPointAtLength(s)
          const from = Math.max(0, s - TRAIL)
          const landed = clamp01((u - IN - DWELL - OUT) / TAIL)
          const op = (idx === 0 ? 1 : clamp01(q / 0.32)) * (1 - ease(landed))
          const el = outRect[j]
          put(el, "a", "transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) scale(${(1 - 0.3 * landed).toFixed(3)})`)
          put(el, "a", "opacity", op)
          put(outTrail[j], "a", "stroke-dasharray", `${(s - from).toFixed(1)} ${(L * 2).toFixed(0)}`)
          put(outTrail[j], "a", "stroke-dashoffset", (-from).toFixed(1))
          put(outTrail[j], "a", "opacity", 0.5 * clamp01(q / 0.2) * (1 - clamp01(landed * 2)))
          if (q > 0.86) litD[j] = Math.max(litD[j], bump((u - IN - DWELL - OUT * 0.86) / 0.9))
        })
        // the carrier stays hidden outside the destinations' copies
        doneOp = 0
        rawOp = 0
      }
      // destinations this record does not reach: hide their copies
      for (let j = 0; j < nd; j++) {
        if (u < IN + DWELL || !dests.includes(j)) {
          put(outRect[j], "a", "opacity", 0)
          put(outTrail[j], "a", "opacity", 0)
        }
      }
      put(raw, "a", "transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${sc.toFixed(3)})`)
      put(raw, "a", "opacity", rawOp)
      put(done, "a", "transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${sc.toFixed(3)})`)
      put(done, "a", "opacity", doneOp)
      put(done, "a", "rx", rx)
      put(inTrail, "a", "opacity", inTrailOp)
    }
    for (let i = 0; i < POOL; i++) if (!used[i]) put(nd_.slots[i].g, "a", "visibility", "hidden")

    for (let i = 0; i < ns; i++) {
      put(nd_.chips[i], "s", "--lit", litS[i])
      put(nd_.ports[i], "s", "--lit", litS[i])
    }
    for (let j = 0; j < nd; j++) {
      put(nd_.chips[ns + j], "s", "--lit", litD[j])
      put(nd_.ports[ns + j], "s", "--lit", litD[j])
    }
    // core: outline pulse, ring quickens, live count
    put(nd_.pulse, "a", "transform", `translate(${CX} ${CY}) scale(${(1 + 0.18 * pulse).toFixed(3)})`)
    put(nd_.pulse, "a", "opacity", pulse * 0.55)
    const done = Math.max(0, Math.floor((t - (IN + DWELL * 0.5)) / PERIOD) + 1)
    const completed = Math.max(0, Math.floor((t - (IN + DWELL)) / PERIOD) + 1)
    put(nd_.ring, "a", "transform", `translate(${CX} ${CY}) rotate(${(t * 10 + completed * 80 + spin).toFixed(1)})`)
    if (nd_.count) {
      const text = fmt.format(countStart + done)
      if (cache.get(nd_.count)?.t !== text) {
        nd_.count.textContent = text
        cache.set(nd_.count, { t: text })
      }
    }
  }
  const drawRef = React.useRef(draw)
  React.useEffect(() => {
    drawRef.current = draw
  })

  const drawStill = () => {
    const g = geo.current
    const nd_ = nodes.current
    if (!g || !nd_) return
    nd_.slots.forEach((s, k) => {
      const live = k < Math.max(ns, nd)
      put(s.g, "a", "visibility", live ? "visible" : "hidden")
      if (!live) return
      // a raw record on each in path, a processed record on each out path
      const si = k % ns
      if (k < ns) {
        const pt = g.inP[si].getPointAtLength(g.inLen[si] * 0.42)
        put(s.raw, "a", "transform", `translate(${pt.x} ${pt.y})`)
        put(s.raw, "a", "opacity", 1)
      } else put(s.raw, "a", "opacity", 0)
      put(s.done, "a", "opacity", 0)
      put(s.inTrail, "a", "opacity", 0)
      s.outRect.forEach((el, j) => {
        if (k === 0 && j < nd) {
          const pt = g.outP[j].getPointAtLength(g.outLen[j] * 0.5)
          put(el, "a", "transform", `translate(${pt.x} ${pt.y})`)
          put(el, "a", "opacity", 1)
        } else put(el, "a", "opacity", 0)
      })
      s.outTrail.forEach((el) => put(el, "a", "opacity", 0))
    })
    if (nd_.count) nd_.count.textContent = fmt.format(countStart + 3)
  }

  // Measure the paths and collect the elements once per layout.
  React.useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const q = <T extends Element>(sel: string) => Array.from(box.querySelectorAll<T>(sel))
    const inP = q<SVGPathElement>(".dtf-p[data-in]")
    const outP = q<SVGPathElement>(".dtf-p[data-out]")
    geo.current = {
      inP,
      outP,
      inLen: inP.map((p) => p.getTotalLength()),
      outLen: outP.map((p) => p.getTotalLength()),
      inD: inP.map((p) => p.getAttribute("d") ?? ""),
      outD: outP.map((p) => p.getAttribute("d") ?? ""),
    }
    nodes.current = {
      slots: q<SVGGElement>("[data-slot]").map((g) => ({
        g,
        inTrail: g.querySelector(".dtf-trail-in")!,
        raw: g.querySelector(".dtf-raw")!,
        done: g.querySelector(".dtf-done")!,
        outTrail: Array.from(g.querySelectorAll(".dtf-trail-out")),
        outRect: Array.from(g.querySelectorAll(".dtf-out")),
      })),
      chips: q(".dtf-chip"),
      ports: q(".dtf-slot"),
      pulse: box.querySelector(".dtf-pulse"),
      ring: box.querySelector(".dtf-ring"),
      count: box.querySelector(".dtf-num"),
    }
    if (reduced) drawStill()
    else draw(time.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ns, nd, reduced, shares])

  // Scale the fixed stage to the container.
  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const set = () => box.style.setProperty("--dtf-scale", String(box.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // One rAF clock; eases to rest when paused; only runs on screen.
  React.useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let last = 0
    let visible = false
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0
      last = now
      const goal = frozen.current ? 0 : target.current * hover.current
      rate.current += (goal - rate.current) * (1 - Math.exp(-dt * 9))
      time.current += dt * rate.current
      drawRef.current(time.current)
      if (visible && (goal > 0 || rate.current > 0.003)) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const start = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }
    kick.current = start
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      kick.current = () => {}
    }
  }, [reduced])
  React.useEffect(() => {
    frozen.current = !!paused
    target.current = Math.max(0.05, speed)
    kick.current()
  }, [paused, speed])

  const aria =
    label ??
    `Records from ${srcs.map((s) => s.label).join(", ")} travel into ${coreLabel}, where they are processed, and fan out to ${dsts
      .map((d) => d.label)
      .join(", ")}.`

  const vars = (accent ? { "--dtf-accent": accent } : undefined) as React.CSSProperties | undefined
  const ys = (n: number) => Array.from({ length: n }, (_, i) => rowY(i, n))
  const sy = ys(ns)
  const dy = ys(nd)

  return (
    <figure className={className ? `dtf ${className}` : "dtf"} style={vars} data-paused={paused || undefined} data-still={reduced || undefined}>
      <style href="pane-data-flow" precedence="default">
        {CSS}
      </style>
      <div
        ref={(el) => {
          boxRef.current = el
          rootRef.current = el
        }}
        className="dtf-box"
        role="img"
        aria-label={aria}
        onPointerEnter={() => (hover.current = 0.8)}
        onPointerLeave={() => (hover.current = 1)}
      >
        <div className="dtf-stage">
          <svg className="dtf-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden>
            {sy.map((y, i) => (
              <path key={`i${i}`} className={`dtf-p dtf-pi-${i}`} data-in d={inPath(y)} />
            ))}
            {dy.map((y, j) => (
              <path key={`o${j}`} className={`dtf-p dtf-po-${j}`} data-out d={outPath(y)} />
            ))}
          </svg>

          {srcs.map((s, i) => (
            <Chip key={s.id ?? `s${i}`} node={s} side="l" n={`s${i}`} x={0} y={sy[i] - CHIP_H / 2} />
          ))}
          {dsts.map((d, j) => (
            <Chip key={d.id ?? `d${j}`} node={d} side="r" n={`d${j}`} x={W - CHIP_W} y={dy[j] - CHIP_H / 2} />
          ))}

          <div className="dtf-core">
            {core?.detail ? <span className="dtf-tag">{core.detail}</span> : <span className="dtf-tag">Validates, dedupes and enriches each record</span>}
          </div>
          <div className="dtf-count">
            <span className="dtf-label">{coreLabel}</span>
            <span className="dtf-meta">
              <span className="dtf-num" /> {countLabel}
            </span>
          </div>

          <svg className="dtf-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden>
            <g className="dtf-ring-wrap">
              <g className="dtf-ring" transform={`translate(${CX} ${CY})`}>
                <circle r="20" className="dtf-ring" />
              </g>
            </g>
            <rect className="dtf-pulse" x={-CORE / 2} y={-CORE / 2} width={CORE} height={CORE} rx={CORE * 0.28} transform={`translate(${CX} ${CY})`} />
            <circle className="dtf-eye" cx={CX} cy={CY} r="3.2" />
            {[...sy.map((y, i) => [CHIP_W, y, i] as const), ...dy.map((y, j) => [W - CHIP_W, y, ns + j] as const)].map(([x, y, k]) => (
              <g key={k} className="dtf-slot">
                <circle className="dtf-port" cx={x} cy={y} r="3.25" />
                <circle className="dtf-hit" cx={x} cy={y} r="2.1" />
              </g>
            ))}
            {Array.from({ length: POOL }, (_, k) => (
              <g key={k} data-slot={k} visibility="hidden">
                <path className="dtf-trail dtf-trail-in" d={inPath(sy[0])} opacity="0" />
                {dy.map((_, j) => (
                  <path key={`t${j}`} className="dtf-trail dtf-trail-out" d={outPath(dy[j])} opacity="0" />
                ))}
                <rect className="dtf-raw" x="-4" y="-4" width="8" height="8" rx="4" opacity="0" />
                <rect className="dtf-done" x="-4.5" y="-4.5" width="9" height="9" rx="1.5" opacity="0" />
                {dy.map((_, j) => (
                  <rect key={`r${j}`} className="dtf-done dtf-out" x="-4.5" y="-4.5" width="9" height="9" rx="1.5" opacity="0" />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
      {caption ? <figcaption className="dtf-cap">{caption}</figcaption> : null}
    </figure>
  )
}

function Chip({ node, side, n, x, y }: { node: DataFlowNode; side: "l" | "r"; n: string; x: number; y: number }) {
  return (
    <div className="dtf-chip" data-n={n} data-side={side} style={{ left: x, top: y, ...(node.color ? ({ "--ic": node.color } as React.CSSProperties) : null) }}>
      {node.icon ? <span className="dtf-mark">{node.icon}</span> : null}
      <span className="dtf-text">
        <span className="dtf-label">{node.label}</span>
        {node.meta ? <span className="dtf-meta">{node.meta}</span> : null}
      </span>
      {node.detail ? <span className="dtf-tag">{node.detail}</span> : null}
    </div>
  )
}
