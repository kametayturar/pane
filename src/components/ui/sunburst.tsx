"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SunburstNode = {
  /** Stable, unique id. Keep it the same across datasets so switching data morphs the arcs. */
  id: string
  label: string
  /** Leaf value. A branch's value is the sum of its children. */
  value?: number
  children?: SunburstNode[]
}

export type SunburstProps = {
  /** The root of the hierarchy. */
  data: SunburstNode
  /** Names the chart for assistive technology. */
  label: string
  /** Title in the card header. */
  title?: string
  /** Muted line under the title. */
  subtitle?: string
  /** Slot at the right of the header, e.g. a dataset switch. */
  actions?: React.ReactNode
  /** Formats the centre value, legend, tooltip and table. */
  formatValue?: (value: number) => string
  /** Rings shown around the centre at once. Fewer levels below a zoomed node fill the full radius. */
  depth?: number
  /** Largest diameter in pixels. The chart scales down to fit its container. */
  size?: number
  /** Controlled id of the node in the centre. */
  focus?: string
  /** Initial centre when uncontrolled. Defaults to the root. */
  defaultFocus?: string
  /** Called when a segment, breadcrumb, legend row or the centre zooms. */
  onFocusChange?: (id: string) => void
  /** Lists the children of the centre with values and shares, synced with the arcs. */
  legend?: boolean
  /** Shown in the centre when the total is zero. */
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.sbu {
  --sbu-ink: #000;
  --sbu-surface: #fff;
  --sbu-accent: #0060e2;
  --sbu-h0: oklch(.6 .15 255);
  --sbu-h1: oklch(.48 .19 305);
  --sbu-h2: oklch(.72 .16 75);
  --sbu-h3: oklch(.6 .13 185);
  --sbu-h4: oklch(.66 0 0);
  --sbu-h5: oklch(.62 .17 12);
  --sbu-lab: rgb(0 0 0 / .8);
  --sbu-t1: color-mix(in oklab, var(--sbu-ink) 88%, transparent);
  --sbu-t2: color-mix(in oklab, var(--sbu-ink) 61%, transparent);
  --sbu-t3: color-mix(in oklab, var(--sbu-ink) 45%, transparent);
  --sbu-t4: color-mix(in oklab, var(--sbu-ink) 27%, transparent);
  --sbu-fill: color-mix(in oklab, var(--sbu-ink) 6%, transparent);
  --sbu-line: color-mix(in oklab, var(--sbu-ink) 6%, transparent);
  --sbu-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --sbu-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --sbu-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0;
  padding: 18px 20px 20px;
  border-radius: 16px;
  background: var(--sbu-surface);
  box-shadow: var(--sbu-shadow);
  color: var(--sbu-t1);
  font-family: var(--sbu-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .sbu {
  --sbu-ink: #fff;
  --sbu-surface: #1c1c1e;
  --sbu-accent: #4d8dff;
  --sbu-h0: oklch(.7 .14 255);
  --sbu-h1: oklch(.66 .16 305);
  --sbu-h2: oklch(.78 .15 75);
  --sbu-h3: oklch(.72 .12 185);
  --sbu-h4: oklch(.68 0 0);
  --sbu-h5: oklch(.72 .15 12);
  --sbu-lab: rgb(255 255 255 / .92);
  --sbu-t1: color-mix(in oklab, var(--sbu-ink) 90%, transparent);
  --sbu-t2: color-mix(in oklab, var(--sbu-ink) 62%, transparent);
  --sbu-t3: color-mix(in oklab, var(--sbu-ink) 46%, transparent);
  --sbu-t4: color-mix(in oklab, var(--sbu-ink) 28%, transparent);
  --sbu-fill: color-mix(in oklab, var(--sbu-ink) 8%, transparent);
  --sbu-line: color-mix(in oklab, var(--sbu-ink) 8%, transparent);
  --sbu-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --sbu-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.sbu) *, :where(.sbu) *::before, :where(.sbu) *::after { box-sizing: border-box }
:where(.sbu) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.sbu :focus-visible { outline: 2px solid color-mix(in oklab, var(--sbu-accent) 60%, transparent); outline-offset: 1px }

.sbu-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px }
.sbu-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--sbu-t1) }
.sbu-actions { flex: none }
.sbu-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--sbu-t3) }

.sbu-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; min-height: 24px; margin: 0 0 6px -6px }
.sbu-crumbs button {
  height: 24px; padding: 0 6px; border-radius: 6px; font-size: 12px; line-height: 24px; font-weight: 500;
  color: var(--sbu-t3); transition: background-color .16s, color .16s; animation: sbu-in .45s var(--sbu-ease) backwards;
}
.sbu-crumbs button:hover:not([aria-current]) { background: var(--sbu-fill); color: var(--sbu-t1) }
.sbu-crumbs button[aria-current] { color: var(--sbu-t1); cursor: default }
.sbu-crumbs svg { width: 12px; height: 12px; color: var(--sbu-t4); animation: sbu-in .45s var(--sbu-ease) backwards }

.sbu-body { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 24px }
.sbu-stage {
  position: relative; flex: 0 1 var(--sbu-size, 340px); width: 100%; max-width: var(--sbu-size, 340px); min-width: 0;
  aspect-ratio: 1; border-radius: 12px; outline-offset: 4px; touch-action: manipulation;
}
.sbu-stage svg { display: block; width: 100%; height: 100%; overflow: visible }
.sbu-n { cursor: default }
.sbu-n[data-zoom] { cursor: pointer }
.sbu-n[data-off] { pointer-events: none }
.sbu-arc {
  fill: color-mix(in oklab, var(--c, var(--sbu-h4)) var(--m, 100%), var(--sbu-surface));
  stroke: var(--sbu-surface); stroke-width: 1.5px; stroke-linejoin: round;
  transition: opacity .3s var(--sbu-ease), filter .2s; fill-rule: evenodd;
}
.sbu-n[data-dim] .sbu-arc { opacity: .32 }
.sbu-n[data-hot] .sbu-arc { filter: brightness(1.07) saturate(1.1) }
:is(.dark, [data-theme="dark"]) .sbu .sbu-arc { fill: color-mix(in oklab, var(--c, var(--sbu-h4)) var(--md, 100%), var(--sbu-surface)) }
.sbu-n[data-root] .sbu-arc { fill: var(--sbu-t4); stroke: none }
.sbu-n[data-focus] .sbu-arc { fill: var(--c); stroke: none }
.sbu-lab { fill: var(--sbu-lab); font-size: 11px; font-weight: 500; pointer-events: none; transition: opacity .3s }
.sbu-n[data-d="1"] .sbu-lab { fill: #fff }
:is(.dark, [data-theme="dark"]) .sbu .sbu-n[data-d="1"] .sbu-lab { fill: rgb(0 0 0 / .78) }
.sbu-n[data-dim] .sbu-lab { opacity: .5 !important }

.sbu-hub {
  position: absolute; left: 50%; top: 50%; width: 35%; aspect-ratio: 1; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; text-align: center; gap: 0;
}
button.sbu-hub { transition: background-color .2s }
button.sbu-hub:hover { background: var(--sbu-fill) }
.sbu-hub-l { max-width: 86%; font-size: 11px; line-height: 14px; color: var(--sbu-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: sbu-in .45s var(--sbu-ease) backwards }
.sbu-hub-v { font-size: 20px; line-height: 26px; font-weight: 600; letter-spacing: -.01em; font-variant-numeric: tabular-nums; color: var(--sbu-t1) }
.sbu-hub-s { max-width: 86%; font-size: 11px; line-height: 14px; color: var(--sbu-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: sbu-in .45s var(--sbu-ease) .04s backwards }

.sbu-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; max-width: 230px; padding: 8px 10px; border-radius: 10px;
  background: var(--sbu-surface); box-shadow: var(--sbu-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
  font-size: 12px; line-height: 16px;
}
.sbu-tip[data-on] { opacity: 1 }
.sbu-tip-p { color: var(--sbu-t3); font-size: 11px; line-height: 14px; overflow-wrap: anywhere }
.sbu-tip-r { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-top: 2px }
.sbu-tip-r b { font-weight: 500; color: var(--sbu-t1) }
.sbu-tip-r span { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--sbu-t1) }
.sbu-tip-m { margin-top: 2px; color: var(--sbu-t3); font-variant-numeric: tabular-nums }

.sbu-legend { flex: 1 1 190px; min-width: 190px; max-width: 260px; margin: 0; padding: 0; list-style: none }
.sbu-legend button {
  display: flex; align-items: center; gap: 8px; width: calc(100% + 16px); min-height: 32px; padding: 0 8px; margin: 0 -8px; border-radius: 8px;
  transition: background-color .16s;
}
.sbu-legend li { animation: sbu-in .5s var(--sbu-ease) backwards; animation-delay: calc(var(--i) * 30ms) }
.sbu-legend button:hover, .sbu-legend [data-hot] { background: var(--sbu-fill) }
.sbu-legend button:not([data-zoom]) { cursor: default }
.sbu-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--c, var(--sbu-h4)) }
.sbu-row-l { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--sbu-t1) }
.sbu-row-v { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--sbu-t1) }
.sbu-row-p { width: 44px; text-align: right; font-variant-numeric: tabular-nums; color: var(--sbu-t3) }
.sbu-none { margin: 0; color: var(--sbu-t3); font-size: 12px }

.sbu-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@keyframes sbu-in { from { opacity: 0; filter: blur(3px); transform: translateY(4px) } }

@media (max-width: 420px) {
  .sbu { padding: 14px 14px 16px }
  .sbu-legend { max-width: none }
}
@media (prefers-reduced-motion: reduce) {
  .sbu *, .sbu *::before, .sbu *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               Tree + layout                                */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2
const VB = 340
const CX = VB / 2
const R = 167
const HOLE = 59.5
const DUR = 820

type TNode = {
  id: string
  label: string
  value: number
  depth: number
  /** Index of the top-level branch this node belongs to (-1 for the root). */
  branch: number
  parent: TNode | null
  kids: TNode[]
  /** Levels below this node. */
  height: number
  /** Pre-order index, used for unique ids. */
  order: number
}
type Tree = { root: TNode; list: TNode[]; byId: Map<string, TNode> }

function buildTree(src: SunburstNode): Tree {
  const list: TNode[] = []
  const byId = new Map<string, TNode>()
  const walk = (s: SunburstNode, parent: TNode | null, branch: number): TNode => {
    const n: TNode = { id: s.id, label: s.label, value: 0, depth: parent ? parent.depth + 1 : 0, branch, parent, kids: [], height: 0, order: list.length }
    list.push(n)
    byId.set(n.id, n)
    n.kids = (s.children ?? []).map((c, i) => walk(c, n, parent ? branch : i))
    if (n.kids.length) {
      n.value = n.kids.reduce((a, k) => a + k.value, 0)
      n.height = 1 + Math.max(...n.kids.map((k) => k.height))
    } else n.value = Math.max(0, s.value ?? 0)
    return n
  }
  const root = walk(src, null, -1)
  return { root, list, byId }
}

type Pose = { a0: number; a1: number; r0: number; r1: number; o: number; k: number }

/** The target pose of every visible node when `focus` is in the centre. */
function layout(focus: TNode, depth: number): Map<string, Pose> {
  const out = new Map<string, Pose>()
  const D = Math.min(depth, focus.height)
  out.set(focus.id, { a0: 0, a1: TAU, r0: HOLE - 4, r1: HOLE, o: 1, k: 0 })
  if (D < 1 || focus.value <= 0) return out
  const thick = (R - HOLE) / D
  const visit = (n: TNode, a0: number, a1: number, k: number) => {
    if (k > D || n.value <= 0) return
    let a = a0
    for (const c of n.kids) {
      if (c.value <= 0) continue
      const span = ((a1 - a0) * c.value) / n.value
      out.set(c.id, { a0: a, a1: a + span, r0: HOLE + (k - 1) * thick, r1: HOLE + k * thick, o: 1, k })
      if (k < D) visit(c, a, a + span, k + 1)
      a += span
    }
  }
  visit(focus, 0, TAU, 1)
  return out
}

const px = (r: number, a: number) => `${(CX + r * Math.sin(a)).toFixed(2)} ${(CX - r * Math.cos(a)).toFixed(2)}`

function sectorPath(r0: number, r1: number, a0: number, a1: number): string {
  const d = a1 - a0
  if (d < 0.0004 || r1 - r0 < 0.2) return ""
  if (d >= TAU - 0.0004) {
    const ring = (r: number, sweep: number) =>
      `M${CX} ${(CX - r).toFixed(2)}A${r} ${r} 0 1 ${sweep} ${CX} ${(CX + r).toFixed(2)}A${r} ${r} 0 1 ${sweep} ${CX} ${(CX - r).toFixed(2)}Z`
    return ring(r1, 1) + (r0 > 0.5 ? ring(r0, 0) : "")
  }
  const large = d > Math.PI ? 1 : 0
  return `M${px(r1, a0)}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${large} 1 ${px(r1, a1)}L${px(r0, a1)}${
    r0 > 0.5 ? `A${r0.toFixed(2)} ${r0.toFixed(2)} 0 ${large} 0 ${px(r0, a0)}` : ""
  }Z`
}

/** Baseline for an arc label: runs the way that keeps the text upright. */
function labelPath(r0: number, r1: number, a0: number, a1: number): string {
  const d = a1 - a0
  if (d < 0.0004 || d >= TAU - 0.0004) return ""
  const rm = (r0 + r1) / 2
  const large = d > Math.PI ? 1 : 0
  const bottom = Math.cos((a0 + a1) / 2) < 0
  if (!bottom) {
    const r = rm - 3.8
    return `M${px(r, a0)}A${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ${px(r, a1)}`
  }
  const r = rm + 3.8
  return `M${px(r, a1)}A${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 0 ${px(r, a0)}`
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 4)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type NodeState = { cur: Pose; from: Pose; to: Pose; t0: number }
type NodeEls = { g?: SVGGElement | null; arc?: SVGPathElement | null; lp?: SVGPathElement | null; text?: SVGTextElement | null }

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const defaultFormat = (n: number) => compact.format(n)
const pct = (n: number) => `${(Math.round(n * 1000) / 10).toString()}%`
const HUES = ["var(--sbu-h0)", "var(--sbu-h1)", "var(--sbu-h2)", "var(--sbu-h3)", "var(--sbu-h4)", "var(--sbu-h5)"]
const hueOf = (n: TNode) => (n.branch < 0 ? "var(--sbu-t4)" : HUES[n.branch] ?? "var(--sbu-h4)")
const mixOf = (depth: number, dark = false) => (dark ? [100, 100, 80, 64, 52] : [100, 100, 76, 56, 42])[Math.min(depth, 4)] ?? 100
const pathOf = (n: TNode) => {
  const names: string[] = []
  for (let p: TNode | null = n; p && p.parent; p = p.parent) names.unshift(p.label)
  return names.length ? names.join(" / ") : n.label
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** A number that counts to its new value instead of jumping. Writes the text node directly. */
function Rolling({ value, format, reduced }: { value: number; format: (n: number) => string; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(value)
  const [first] = React.useState(value)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    if (from === value) return
    if (reduced) {
      shown.current = value
      el.textContent = format(value)
      return
    }
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const k = Math.min(1, (now - t0) / 800)
      const v = lerp(from, value, easeOut(k))
      shown.current = v
      el.textContent = format(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, format, reduced])
  return <span ref={ref}>{format(first)}</span>
}

/* -------------------------------------------------------------------------- */
/*                                  Sunburst                                  */
/* -------------------------------------------------------------------------- */

export function Sunburst({
  data,
  label,
  title,
  subtitle,
  actions,
  formatValue = defaultFormat,
  depth = 3,
  size = 340,
  focus: focusProp,
  defaultFocus,
  onFocusChange,
  legend = true,
  emptyLabel = "No data yet",
  className,
}: SunburstProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const reduced = usePrefersReducedMotion()
  const tree = React.useMemo(() => buildTree(data), [data])

  const [innerFocus, setInnerFocus] = React.useState(defaultFocus ?? data.id)
  const focusId = focusProp ?? innerFocus
  const focus = tree.byId.get(focusId) ?? tree.root
  const D = Math.max(1, Math.min(depth, 6))
  const targets = React.useMemo(() => layout(focus, D), [focus, D])
  const empty = tree.root.value <= 0

  const [hover, setHoverId] = React.useState<string | null>(null)
  /** Where the highlight came from: a pointer over an arc follows the pointer, a legend row anchors on the arc. */
  const [from, setFrom] = React.useState<"arc" | "legend">("arc")
  const setHover = (v: string | null | ((h: string | null) => string | null), src: "arc" | "legend" = "arc") => {
    setFrom(src)
    setHoverId(v)
  }
  const [kbd, setKbd] = React.useState<string | null>(null)
  const [kbdActive, setKbdActive] = React.useState(false)
  const active = hover ?? (kbdActive ? kbd : null)
  const activeNode = active ? tree.byId.get(active) ?? null : null

  const goto = React.useCallback(
    (id: string) => {
      setInnerFocus(id)
      onFocusChange?.(id)
    },
    [onFocusChange],
  )
  const zoomable = (n: TNode) => n.kids.some((k) => k.value > 0)

  /* ------------------------------ Animation -------------------------------- */
  const els = React.useRef(new Map<string, NodeEls>())
  const states = React.useRef(new Map<string, NodeState>())
  const raf = React.useRef(0)
  const started = React.useRef(false)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)

  const refFor = (id: string, key: keyof NodeEls) => (el: SVGElement | null) => {
    let e = els.current.get(id)
    if (!e) els.current.set(id, (e = {}))
    ;(e as Record<string, unknown>)[key] = el
  }

  const paint = React.useCallback(() => {
    for (const n of tree.list) {
      const s = states.current.get(n.id)
      const e = els.current.get(n.id)
      if (!s || !e) continue
      const { a0, a1, r0, r1, o } = s.cur
      e.arc?.setAttribute("d", o > 0.003 ? sectorPath(r0, r1, a0, a1) : "")
      if (e.g) e.g.style.opacity = String(o)
      if (e.lp && e.text) {
        const arcLen = (a1 - a0) * ((r0 + r1) / 2)
        const need = n.label.length * 6.1 + 8
        const fit = Math.max(0, Math.min(1, (arcLen - need) / 14)) * (r1 - r0 >= 18 ? 1 : 0)
        e.lp.setAttribute("d", fit > 0.01 && o > 0.003 ? labelPath(r0, r1, a0, a1) : "")
        e.text.style.opacity = String(fit * o)
      }
    }
  }, [tree])

  const frame = React.useCallback(
    function tick(now: number) {
      let live = false
      for (const s of states.current.values()) {
        const k = Math.max(0, Math.min(1, (now - s.t0) / DUR))
        if (k < 1) live = true
        const e = easeOut(k)
        const eo = easeOut(Math.min(1, k * 1.6))
        s.cur = {
          a0: lerp(s.from.a0, s.to.a0, e),
          a1: lerp(s.from.a1, s.to.a1, e),
          r0: lerp(s.from.r0, s.to.r0, e),
          r1: lerp(s.from.r1, s.to.r1, e),
          o: lerp(s.from.o, s.to.o, eo),
          k: s.to.k,
        }
      }
      paint()
      raf.current = live ? requestAnimationFrame(tick) : 0
    },
    [paint],
  )

  const retarget = React.useCallback(() => {
    const now = performance.now()
    for (const n of tree.list) {
      const to = targets.get(n.id)
      let s = states.current.get(n.id)
      if (!s) {
        const hidden: Pose = { a0: 0, a1: 0, r0: HOLE, r1: HOLE, o: 0, k: 0 }
        states.current.set(n.id, (s = { cur: hidden, from: hidden, to: hidden, t0: 0 }))
      }
      if (to) {
        const entering = s.cur.o < 0.02
        const from: Pose = entering ? { ...to, a1: to.a0, o: 0 } : { ...s.cur }
        s.cur = from
        s.from = from
        s.to = to
        s.t0 = now + (reduced ? -DUR : to.k * 55)
        const e = els.current.get(n.id)
        if (e?.g) e.g.style.pointerEvents = ""
      } else {
        s.from = { ...s.cur }
        s.to = { ...s.cur, o: 0 }
        s.t0 = reduced ? now - DUR : now
        const e = els.current.get(n.id)
        if (e?.g) e.g.style.pointerEvents = "none"
      }
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(frame)
  }, [tree, targets, reduced, frame])

  // First view: wait until the chart is on screen so the swing-in is seen. Later changes retarget at once.
  React.useEffect(() => {
    if (started.current) {
      retarget()
      return
    }
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      started.current = true
      retarget()
      return
    }
    const go = () => {
      if (started.current) return
      started.current = true
      io.disconnect()
      retarget()
    }
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && go(), { threshold: 0.2 })
    io.observe(el)
    // Background tabs may never report intersection; do not leave the chart blank.
    const fallback = window.setTimeout(go, 1500)
    return () => {
      io.disconnect()
      window.clearTimeout(fallback)
    }
  }, [retarget])
  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  /* ------------------------------ Tooltip ---------------------------------- */
  const placeTip = React.useCallback((x: number, y: number) => {
    const tip = tipRef.current
    const stage = stageRef.current
    if (!tip || !stage) return
    const w = tip.offsetWidth
    const h = tip.offsetHeight
    const W = stage.clientWidth
    let tx = x + 14
    if (tx + w > W + 40) tx = x - w - 14
    tx = Math.max(-40, tx)
    const ty = Math.max(-8, Math.min(stage.clientHeight - h + 8, y - h / 2))
    tip.style.transform = `translate(${tx}px, ${ty}px)`
  }, [])
  const onMove = (ev: React.PointerEvent) => {
    const stage = stageRef.current
    if (!stage || ev.pointerType === "touch") return
    const b = stage.getBoundingClientRect()
    placeTip(ev.clientX - b.left, ev.clientY - b.top)
  }
  // Keyboard: anchor the tooltip on the highlighted arc.
  React.useEffect(() => {
    const id = hover && from === "legend" ? hover : !hover && kbdActive ? kbd : null
    if (!id) return
    const to = targets.get(id)
    const stage = stageRef.current
    if (!to || !stage) return
    const sc = stage.clientWidth / VB
    const rm = (to.r0 + to.r1) / 2
    const am = (to.a0 + to.a1) / 2
    placeTip((CX + rm * Math.sin(am)) * sc, (CX - rm * Math.cos(am)) * sc)
  }, [kbd, kbdActive, hover, from, targets, placeTip])

  /* ------------------------------ Keyboard --------------------------------- */
  const visibleKids = (n: TNode) => n.kids.filter((k) => targets.has(k.id) && k.id !== focus.id)
  const firstChild = (n: TNode) => visibleKids(n)[0] ?? null
  const onKeyDown = (ev: React.KeyboardEvent) => {
    const cur = kbd && targets.has(kbd) && kbd !== focus.id ? tree.byId.get(kbd) ?? null : null
    const set = (n: TNode | null) => {
      if (!n) return
      setKbd(n.id)
      setKbdActive(true)
    }
    switch (ev.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        ev.preventDefault()
        if (!cur) return set(firstChild(focus))
        const sibs = visibleKids(cur.parent ?? focus)
        const i = sibs.indexOf(cur)
        set(sibs[(i + (ev.key === "ArrowRight" ? 1 : -1) + sibs.length) % sibs.length] ?? null)
        break
      }
      case "ArrowDown":
        ev.preventDefault()
        set(cur ? firstChild(cur) ?? cur : firstChild(focus))
        break
      case "ArrowUp":
        ev.preventDefault()
        if (cur && cur.parent && cur.parent.id !== focus.id) set(cur.parent)
        break
      case "Enter":
      case " ":
        ev.preventDefault()
        if (cur && zoomable(cur)) {
          goto(cur.id)
          setKbd(null)
          setKbdActive(true)
        }
        break
      case "Escape":
      case "Backspace":
        if (focus.parent) {
          ev.preventDefault()
          const from = focus.id
          goto(focus.parent.id)
          setKbd(from)
        }
        break
    }
  }

  /* ------------------------------ Render ----------------------------------- */
  const crumbs: TNode[] = []
  for (let p: TNode | null = focus; p; p = p.parent) crumbs.unshift(p)
  const kids = focus.kids.filter((k) => k.value > 0)
  const hot = (n: TNode) => {
    if (!activeNode) return false
    return n.id === activeNode.id
  }
  const related = (n: TNode) => {
    if (!activeNode) return true
    for (let p: TNode | null = activeNode; p; p = p.parent) if (p.id === n.id) return true
    for (let p: TNode | null = n; p; p = p.parent) if (p.id === activeNode.id) return true
    return false
  }

  const share = (n: TNode) => (n.parent && n.parent.value > 0 ? n.value / n.parent.value : 1)
  const announce = activeNode && kbdActive && !hover
    ? `${pathOf(activeNode)}, ${formatValue(activeNode.value)}, ${pct(share(activeNode))} of ${activeNode.parent?.label ?? "total"}${zoomable(activeNode) ? ". Press Enter to zoom in." : ""}`
    : ""
  const hubSub = focus.parent
    ? `${pct(focus.value / Math.max(1, focus.parent.value))} of ${focus.parent.label}`
    : `${kids.length} ${kids.length === 1 ? "group" : "groups"}`

  return (
    <figure className={cn("sbu", className)} style={{ ["--sbu-size" as string]: `${size}px` }} aria-label={label}>
      <style href="sunburst" precedence="default">
        {CSS}
      </style>

      {(title || subtitle || actions) && (
        <div className="sbu-head">
          <div>
            {title && <p className="sbu-title">{title}</p>}
            {subtitle && <p className="sbu-sub">{subtitle}</p>}
          </div>
          {actions && <div className="sbu-actions">{actions}</div>}
        </div>
      )}

      <nav className="sbu-crumbs" aria-label="Zoom path">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <React.Fragment key={c.id}>
              {i > 0 && <ChevronRight aria-hidden />}
              <button type="button" aria-current={last ? "location" : undefined} onClick={() => !last && goto(c.id)}>
                {c.label}
              </button>
            </React.Fragment>
          )
        })}
      </nav>

      <div className="sbu-body">
        <div
          ref={stageRef}
          className="sbu-stage"
          role="group"
          tabIndex={0}
          aria-roledescription="sunburst chart"
          aria-label={`${label}. Arrow keys move between segments, Enter zooms in, Escape zooms out.`}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            if (!e.currentTarget.matches(":focus-visible")) return
            setKbdActive(true)
            setKbd((k) => (k && targets.has(k) ? k : firstChild(focus)?.id ?? null))
          }}
          onBlur={() => setKbdActive(false)}
          onPointerMove={onMove}
        >
          <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden>
            {tree.list.map((n) => {
              const isFocus = n.id === focus.id
              const zoom = !isFocus && zoomable(n)
              return (
                <g
                  key={n.id}
                  ref={refFor(n.id, "g")}
                  className="sbu-n"
                  data-d={n.depth}
                  data-zoom={zoom || undefined}
                  data-root={n.depth === 0 || undefined}
                  data-focus={isFocus && n.depth > 0 ? "" : undefined}
                  data-hot={hot(n) || undefined}
                  data-dim={activeNode && !related(n) ? "" : undefined}
                  style={{ ["--c" as string]: hueOf(n), ["--m" as string]: `${mixOf(n.depth)}%`, ["--md" as string]: `${mixOf(n.depth, true)}%`, opacity: 0 }}
                  onPointerEnter={(ev) => {
                    if (ev.pointerType !== "touch") setHover(n.id)
                  }}
                  onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                  onClick={() => {
                    if (zoom) goto(n.id)
                  }}
                >
                  <path ref={refFor(n.id, "arc")} className="sbu-arc" />
                  <path ref={refFor(n.id, "lp")} id={`${uid}-${n.order}`} fill="none" stroke="none" />
                  <text ref={refFor(n.id, "text")} className="sbu-lab" textAnchor="middle">
                    <textPath href={`#${uid}-${n.order}`} startOffset="50%">
                      {n.label}
                    </textPath>
                  </text>
                </g>
              )
            })}
          </svg>

          {empty ? (
            <div className="sbu-hub">
              <span className="sbu-hub-s">{emptyLabel}</span>
            </div>
          ) : focus.parent ? (
            <button
              type="button"
              className="sbu-hub"
              aria-label={`Zoom out to ${focus.parent.label}`}
              onClick={() => goto(focus.parent!.id)}
              onPointerEnter={() => setHover(focus.id)}
              onPointerLeave={() => setHover((h) => (h === focus.id ? null : h))}
            >
              <span className="sbu-hub-l" key={`l-${focus.id}`}>{focus.label}</span>
              <span className="sbu-hub-v">
                <Rolling value={focus.value} format={formatValue} reduced={reduced} />
              </span>
              <span className="sbu-hub-s" key={`s-${focus.id}`}>{hubSub}</span>
            </button>
          ) : (
            <div className="sbu-hub">
              <span className="sbu-hub-l" key={`l-${focus.id}`}>{focus.label}</span>
              <span className="sbu-hub-v">
                <Rolling value={focus.value} format={formatValue} reduced={reduced} />
              </span>
              <span className="sbu-hub-s" key={`s-${focus.id}`}>{hubSub}</span>
            </div>
          )}

          <div ref={tipRef} className="sbu-tip" data-on={activeNode && activeNode.id !== focus.id ? "" : undefined} aria-hidden>
            {activeNode && (
              <>
                <div className="sbu-tip-p">{activeNode.parent ? pathOf(activeNode.parent) : ""}</div>
                <div className="sbu-tip-r">
                  <b>{activeNode.label}</b>
                  <span>{formatValue(activeNode.value)}</span>
                </div>
                <div className="sbu-tip-m">
                  {pct(share(activeNode))} of {activeNode.parent?.label ?? "total"}
                  {activeNode.parent && activeNode.parent.parent ? ` · ${pct(activeNode.value / Math.max(1, tree.root.value))} of all` : ""}
                </div>
              </>
            )}
          </div>
        </div>

        {legend && (
          <ul className="sbu-legend" aria-label={`${focus.label} breakdown`}>
            {kids.length === 0 && <li className="sbu-none" style={{ ["--i" as string]: 0 }}>No further breakdown.</li>}
            {kids.map((k, i) => {
              const z = zoomable(k)
              return (
                <li key={k.id} style={{ ["--i" as string]: i, ["--c" as string]: hueOf(k) }}>
                  <button
                    type="button"
                    data-zoom={z || undefined}
                    data-hot={active === k.id || undefined}
                    aria-label={`${k.label}, ${formatValue(k.value)}, ${pct(k.value / focus.value)}${z ? ", zooms in" : ""}`}
                    onClick={() => z && goto(k.id)}
                    onPointerEnter={() => setHover(k.id, "legend")}
                    onPointerLeave={() => setHover((h) => (h === k.id ? null : h), "legend")}
                    onFocus={() => setHover(k.id, "legend")}
                    onBlur={() => setHover((h) => (h === k.id ? null : h), "legend")}
                  >
                    <i className="sbu-dot" />
                    <span className="sbu-row-l">{k.label}</span>
                    <span className="sbu-row-v">{formatValue(k.value)}</span>
                    <span className="sbu-row-p">{pct(k.value / focus.value)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="sbu-sr" role="status" aria-live="polite">
        {announce || `${focus.label}, ${formatValue(focus.value)}`}
      </div>
      <table className="sbu-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Path</th>
            <th>Value</th>
            <th>Share of parent</th>
          </tr>
        </thead>
        <tbody>
          {tree.list
            .filter((n) => n.parent)
            .map((n) => (
              <tr key={n.id}>
                <td>{pathOf(n)}</td>
                <td>{formatValue(n.value)}</td>
                <td>{pct(share(n))}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  )
}
