"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SankeyNode = {
  id: string
  label: string
  /** Column index. Defaults to the node's longest distance from a source. */
  column?: number
}
export type SankeyLink = { source: string; target: string; value: number }

export type SankeyFlowProps = {
  /** Nodes in the order they stack within each column. */
  nodes: SankeyNode[]
  /** Flows between node ids. A node's value is the larger of what flows in and out. */
  links: SankeyLink[]
  /** Names the chart for assistive technology. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header, e.g. a period switch. */
  actions?: React.ReactNode
  /** Stage names printed above each column. Hidden when a name would not fit, and in the upright layout. */
  columns?: string[]
  /** Unit after values in the tooltip and table, such as "people". */
  unit?: string
  /** What the first column adds up to, used in shares such as "21% of signups". */
  totalLabel?: string
  /** Formats node values, the tooltip and the table. */
  formatValue?: (value: number) => string
  /** Plot height in pixels. The upright layout below 420px wide uses at least 480. */
  height?: number
  /** Controlled particles along the ribbons. */
  particles?: boolean
  /** Initial particles state when uncontrolled. */
  defaultParticles?: boolean
  onParticlesChange?: (on: boolean) => void
  /** Shows the Flow toggle under the plot. */
  particleToggle?: boolean
  /** Shown when there are no positive links. */
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.sky {
  --sky-ink: #000;
  --sky-surface: #fff;
  --sky-accent: #0060e2;
  --sky-h0: oklch(.6 .15 255);
  --sky-h1: oklch(.5 .18 305);
  --sky-h2: oklch(.74 .16 75);
  --sky-h3: oklch(.62 .13 185);
  --sky-h4: oklch(.66 0 0);
  --sky-h5: oklch(.62 .17 12);
  --sky-node: rgb(0 0 0 / .72);
  --sky-t1: color-mix(in oklab, var(--sky-ink) 88%, transparent);
  --sky-t2: color-mix(in oklab, var(--sky-ink) 61%, transparent);
  --sky-t3: color-mix(in oklab, var(--sky-ink) 45%, transparent);
  --sky-t4: color-mix(in oklab, var(--sky-ink) 27%, transparent);
  --sky-fill: color-mix(in oklab, var(--sky-ink) 6%, transparent);
  --sky-line: color-mix(in oklab, var(--sky-ink) 6%, transparent);
  --sky-rib: color-mix(in oklab, var(--sky-ink) 8%, transparent);
  --sky-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --sky-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --sky-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0;
  padding: 18px 20px 14px;
  border-radius: 16px;
  background: var(--sky-surface);
  box-shadow: var(--sky-shadow);
  color: var(--sky-t1);
  font-family: var(--sky-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .sky {
  --sky-ink: #fff;
  --sky-surface: #1c1c1e;
  --sky-accent: #4d8dff;
  --sky-h0: oklch(.7 .14 255);
  --sky-h1: oklch(.66 .16 305);
  --sky-h2: oklch(.78 .15 75);
  --sky-h3: oklch(.72 .12 185);
  --sky-h4: oklch(.68 0 0);
  --sky-h5: oklch(.72 .15 12);
  --sky-node: rgb(255 255 255 / .62);
  --sky-t1: color-mix(in oklab, var(--sky-ink) 90%, transparent);
  --sky-t2: color-mix(in oklab, var(--sky-ink) 62%, transparent);
  --sky-t3: color-mix(in oklab, var(--sky-ink) 46%, transparent);
  --sky-t4: color-mix(in oklab, var(--sky-ink) 28%, transparent);
  --sky-fill: color-mix(in oklab, var(--sky-ink) 8%, transparent);
  --sky-line: color-mix(in oklab, var(--sky-ink) 8%, transparent);
  --sky-rib: color-mix(in oklab, var(--sky-ink) 11%, transparent);
  --sky-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --sky-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.sky) *, :where(.sky) *::before, :where(.sky) *::after { box-sizing: border-box }
:where(.sky) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.sky :focus-visible { outline: 2px solid color-mix(in oklab, var(--sky-accent) 60%, transparent); outline-offset: 1px }

.sky-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px }
.sky-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--sky-t1) }
.sky-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--sky-t3) }
.sky-actions { flex: none }

.sky-stage { position: relative; width: 100%; border-radius: 10px; outline-offset: 4px; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.sky-stage svg { display: block; position: absolute; inset: 0; width: 100%; height: 100% }
.sky-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none }

.sky-rb { fill: var(--sky-rib); cursor: default }
.sky-rb[data-src] { fill: color-mix(in oklab, var(--c) 24%, transparent) }
.sky-pour { fill: color-mix(in oklab, var(--tc, var(--c)) 62%, transparent); pointer-events: none }
.sky-nd { fill: var(--sky-node); cursor: default }
.sky-nd[data-src] { fill: var(--c) }
.sky-nd[data-hot] { fill: var(--sky-t1) }
.sky-nd[data-src][data-hot] { filter: brightness(.9) }
.sky-hd { font-size: 11px; line-height: 14px; fill: var(--sky-t3); pointer-events: none }
.sky-lb { pointer-events: none; paint-order: stroke; stroke: color-mix(in oklab, var(--sky-surface) 55%, transparent); stroke-width: 3px; stroke-linejoin: round }
.sky-lb .n { font-size: 11px; fill: var(--sky-t2) }
.sky-lb .v { font-size: 13px; font-weight: 500; fill: var(--sky-t1); font-variant-numeric: tabular-nums }
.sky-lb[data-one] .n { font-size: 11px }
.sky-lb[data-one] .v { font-size: 11px }

.sky-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 140px; max-width: 220px; padding: 8px 10px; border-radius: 10px;
  background: var(--sky-surface); box-shadow: var(--sky-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
  font-size: 12px; line-height: 16px;
}
.sky-tip[data-on] { opacity: 1 }
.sky-tip-n { color: var(--sky-t3); font-size: 11px; line-height: 14px }
.sky-tip-v { font-size: 15px; line-height: 20px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--sky-t1) }
.sky-tip-s { color: var(--sky-t3) }
.sky-tip-r { display: flex; justify-content: space-between; gap: 12px; margin-top: 2px; color: var(--sky-t2) }
.sky-tip-r span:last-child { font-variant-numeric: tabular-nums; color: var(--sky-t1) }
.sky-tip-d { margin: 6px 0 4px; height: .5px; background: var(--sky-line) }

.sky-foot { display: flex; justify-content: flex-end; min-height: 28px; margin-top: 6px }
.sky-flow {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 14px;
  font-size: 12px; line-height: 16px; font-weight: 500; color: var(--sky-t2); box-shadow: var(--sky-shadow);
  transition: background-color .16s, color .16s;
}
.sky-flow:hover { background: var(--sky-fill); color: var(--sky-t1) }
.sky-flow svg { width: 14px; height: 14px }
.sky-flow[aria-checked="false"] { color: var(--sky-t3) }
.sky-empty { display: grid; place-items: center; min-height: 160px; color: var(--sky-t3) }

.sky-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@media (max-width: 420px) { .sky { padding: 14px 12px 10px } }
@media (prefers-reduced-motion: reduce) {
  .sky *, .sky *::before, .sky *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

const NODE_W = 8
const PAD = 14
const HUES = ["var(--sky-h0)", "var(--sky-h1)", "var(--sky-h2)", "var(--sky-h3)", "var(--sky-h4)", "var(--sky-h5)"]

type LNode = {
  id: string
  label: string
  col: number
  idx: number
  value: number
  in: number
  out: number
  v: number
  h: number
  /** Index of the source node that supplies most of this node. */
  dom: number
  outs: LLink[]
  ins: LLink[]
}
type LLink = { id: string; s: LNode; t: LNode; value: number; v0: number; v1: number; w: number; dom: number }
type Layout = {
  cols: number
  nodes: LNode[]
  links: LLink[]
  byId: Map<string, LNode>
  byCol: LNode[][]
  total: number
  /** u-position (along the columns) of each column's left edge. */
  colU: number[]
}

function computeLayout(nodesIn: SankeyNode[], linksIn: SankeyLink[], U: number, V: number): Layout {
  const byId = new Map<string, LNode>()
  const nodes: LNode[] = nodesIn.map((n) => {
    const ln: LNode = { id: n.id, label: n.label, col: n.column ?? 0, idx: 0, value: 0, in: 0, out: 0, v: 0, h: 0, dom: 0, outs: [], ins: [] }
    byId.set(n.id, ln)
    return ln
  })
  const links: LLink[] = []
  for (const l of linksIn) {
    const s = byId.get(l.source)
    const t = byId.get(l.target)
    if (!s || !t || !(l.value > 0) || s === t) continue
    const ll: LLink = { id: `${s.id}>${t.id}`, s, t, value: l.value, v0: 0, v1: 0, w: 0, dom: 0 }
    links.push(ll)
    s.outs.push(ll)
    t.ins.push(ll)
    s.out += l.value
    t.in += l.value
  }
  for (const n of nodes) n.value = Math.max(n.in, n.out)

  // Columns: explicit, or the longest path from a source.
  const auto = new Map<string, number>()
  for (const n of nodes) auto.set(n.id, 0)
  for (let i = 0; i < nodes.length; i++) {
    let changed = false
    for (const l of links) {
      const c = (auto.get(l.s.id) ?? 0) + 1
      if (c > (auto.get(l.t.id) ?? 0) && c <= nodes.length) {
        auto.set(l.t.id, c)
        changed = true
      }
    }
    if (!changed) break
  }
  nodesIn.forEach((n, i) => {
    nodes[i]!.col = n.column ?? auto.get(n.id) ?? 0
  })
  const cols = nodes.reduce((m, n) => Math.max(m, n.col), 0) + 1
  const byCol: LNode[][] = Array.from({ length: cols }, () => [])
  for (const n of nodes) byCol[n.col]!.push(n)
  byCol.forEach((c) => c.forEach((n, i) => (n.idx = i)))

  const total = (byCol[0] ?? []).reduce((a, n) => a + n.value, 0) || nodes.reduce((m, n) => Math.max(m, n.value), 0)

  // One scale for every column so equal flows have equal thickness.
  let ky = Infinity
  for (const c of byCol) {
    if (!c.length) continue
    const sum = c.reduce((a, n) => a + n.value, 0)
    if (sum > 0) ky = Math.min(ky, (V - PAD * (c.length - 1)) / sum)
  }
  if (!isFinite(ky) || ky <= 0) ky = 1
  for (const n of nodes) n.h = Math.max(2, n.value * ky)

  // Initial stack, then relax each node toward the centre of what it connects to.
  for (const c of byCol) {
    let y = 0
    for (const n of c) {
      n.v = y
      y += n.h + PAD
    }
  }
  const settle = (c: LNode[], desire: (n: LNode) => number | null) => {
    const want = c.map((n) => {
      const d = desire(n)
      return d == null ? n.v : d - n.h / 2
    })
    let prev = 0
    c.forEach((n, i) => {
      n.v = Math.max(want[i]!, prev)
      prev = n.v + n.h + PAD
    })
    let next = V
    for (let i = c.length - 1; i >= 0; i--) {
      const n = c[i]!
      n.v = Math.min(n.v, next - n.h)
      next = n.v - PAD
    }
    prev = 0
    for (const n of c) {
      n.v = Math.max(n.v, prev)
      prev = n.v + n.h + PAD
    }
  }
  const center = (ls: LLink[], pick: (l: LLink) => LNode): number | null => {
    let s = 0
    let w = 0
    for (const l of ls) {
      const o = pick(l)
      s += (o.v + o.h / 2) * l.value
      w += l.value
    }
    return w > 0 ? s / w : null
  }
  for (let it = 0; it < 8; it++) {
    for (let c = 1; c < cols; c++) settle(byCol[c]!, (n) => center(n.ins, (l) => l.s))
    for (let c = cols - 2; c >= 0; c--) settle(byCol[c]!, (n) => center(n.outs, (l) => l.t))
  }
  for (let c = 1; c < cols; c++) settle(byCol[c]!, (n) => center(n.ins, (l) => l.s))

  // Link slots inside each node, ordered by where they go / come from.
  for (const n of nodes) {
    n.outs.sort((a, b) => a.t.col - b.t.col || a.t.v - b.t.v)
    n.ins.sort((a, b) => a.s.col - b.s.col || a.s.v - b.s.v)
    let y = n.v
    for (const l of n.outs) {
      l.w = l.value * ky
      l.v0 = y
      y += l.w
    }
    y = n.v
    for (const l of n.ins) {
      l.w = l.value * ky
      l.v1 = y
      y += l.w
    }
  }

  // Which source supplies most of each node (drives ribbon hue).
  const srcs = byCol[0] ?? []
  const mix = new Map<string, number[]>()
  for (const n of nodes) mix.set(n.id, new Array(Math.max(1, srcs.length)).fill(0))
  srcs.forEach((n, i) => (mix.get(n.id)![i] = 1))
  for (const c of byCol) {
    for (const n of c) {
      if (n.col > 0) {
        const m = mix.get(n.id)!
        for (const l of n.ins) {
          const sm = mix.get(l.s.id)!
          sm.forEach((x, i) => (m[i]! += x * l.value))
        }
      }
      const m = mix.get(n.id)!
      let best = 0
      m.forEach((x, i) => {
        if (x > m[best]!) best = i
      })
      n.dom = best
    }
  }
  for (const l of links) l.dom = l.s.dom

  const span = Math.max(1, U - NODE_W)
  const colU = Array.from({ length: cols }, (_, c) => (cols > 1 ? (c * span) / (cols - 1) : 0))
  return { cols, nodes, links, byId, byCol, total, colU }
}

/** How much of every ribbon and node belongs to the traced flow. */
type Sel = { kind: "node" | "link"; id: string }
function traceOf(L: Layout, sel: Sel | null): { lf: Map<string, number>; nf: Map<string, number> } {
  const lf = new Map<string, number>()
  const nf = new Map<string, number>()
  if (!sel) return { lf, nf }
  const order = [...L.nodes].sort((a, b) => a.col - b.col)
  let startNode: LNode | undefined
  let link: LLink | undefined
  if (sel.kind === "node") startNode = L.byId.get(sel.id)
  else {
    link = L.links.find((l) => l.id === sel.id)
    startNode = link?.t
  }
  if (!startNode) return { lf, nf }

  // Downstream: whatever share of a node is traced reaches each of its outgoing ribbons in the same proportion.
  const tv = new Map<string, number>()
  tv.set(startNode.id, link ? link.value : startNode.value)
  if (link) {
    lf.set(link.id, 1)
    nf.set(link.t.id, Math.min(1, link.value / Math.max(1e-9, link.t.value)))
  } else nf.set(startNode.id, 1)
  for (const n of order) {
    if (n.col < startNode.col) continue
    const t = tv.get(n.id) ?? 0
    if (t <= 0) continue
    const frac = Math.min(1, t / Math.max(1e-9, n.value))
    if (n !== startNode || !link) nf.set(n.id, Math.max(nf.get(n.id) ?? 0, frac))
    for (const l of n.outs) {
      lf.set(l.id, Math.max(lf.get(l.id) ?? 0, frac))
      tv.set(l.t.id, (tv.get(l.t.id) ?? 0) + frac * l.value)
    }
  }
  // Upstream: the share of each earlier node that ends up in the traced flow.
  const reach = new Map<string, number>()
  const from = link ? link.s : startNode
  if (!link) reach.set(startNode.id, 1)
  for (let i = order.length - 1; i >= 0; i--) {
    const n = order[i]!
    if (n.col > from.col || (!link && n === startNode)) continue
    let r = 0
    for (const l of n.outs) {
      const part = link && l === link ? 1 : reach.get(l.t.id) ?? 0
      if (part > 0) {
        lf.set(l.id, Math.max(lf.get(l.id) ?? 0, part))
        r += l.value * part
      }
    }
    if (r > 0) {
      const share = Math.min(1, r / Math.max(1e-9, n.value))
      reach.set(n.id, share)
      nf.set(n.id, Math.max(nf.get(n.id) ?? 0, share))
    }
  }
  return { lf, nf }
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const nf0 = new Intl.NumberFormat("en")
const defaultFormat = (n: number) => nf0.format(Math.round(n))
const pct = (n: number) => `${Math.round(n * 100)}%`
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

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

type Geo = { upright: boolean; ox: number; oy: number }
const pt = (g: Geo, u: number, v: number) => (g.upright ? `${(g.ox + v).toFixed(1)} ${(g.oy + u).toFixed(1)}` : `${(g.ox + u).toFixed(1)} ${(g.oy + v).toFixed(1)}`)

function ribbonPath(g: Geo, u0: number, u1: number, v0: number, v1: number, w: number, f0: number, f1: number): string {
  const a = w * f0
  const b = w * f1
  if (b - a < 0.15) return ""
  const um = (u0 + u1) / 2
  return `M${pt(g, u0, v0 + a)}C${pt(g, um, v0 + a)} ${pt(g, um, v1 + a)} ${pt(g, u1, v1 + a)}L${pt(g, u1, v1 + b)}C${pt(g, um, v1 + b)} ${pt(g, um, v0 + b)} ${pt(g, u0, v0 + b)}Z`
}

/** Per-item animated numbers: each chases its target with an exponential ease (interruptible, no keyframes). */
type Anim = { c: number[]; t: number[]; wake: number; delay: number }
const TAU_GEO = 0.13
const TAU_FADE = 0.12
const TAU_POUR = 0.1

const FlowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="3" cy="8" r="1.3" fill="currentColor" />
    <circle cx="8" cy="8" r="1.3" fill="currentColor" opacity=".7" />
    <circle cx="13" cy="8" r="1.3" fill="currentColor" opacity=".4" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                 SankeyFlow                                 */
/* -------------------------------------------------------------------------- */

export function SankeyFlow({
  nodes,
  links,
  label,
  title,
  subtitle,
  actions,
  columns,
  unit = "",
  totalLabel = "the total",
  formatValue = defaultFormat,
  height = 340,
  particles: particlesProp,
  defaultParticles = true,
  onParticlesChange,
  particleToggle = true,
  emptyLabel = "No flows yet",
  className,
}: SankeyFlowProps) {
  const reduced = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(640)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [pInner, setPInner] = React.useState(defaultParticles)
  const particlesOn = (particlesProp ?? pInner) && !reduced
  const upright = width < 420

  // Geometry of the plot area.
  const hasHeads = !!columns?.length && !upright
  const topPad = hasHeads ? 24 : 4
  // Layout is computed in (u = along the columns, v = across them) and mapped to x / y at paint time.
  const layoutKey = `${width}|${height}|${upright}`
  const L = React.useMemo(() => {
    const V = upright ? Math.max(0, width - 8) : Math.max(120, height)
    // The widest label in the last column decides the right-hand gutter.
    const probe = computeLayout(nodes, links, 1000, V)
    const lastNodes = probe.byCol[probe.cols - 1] ?? []
    const widest = lastNodes.reduce((m, n) => Math.max(m, n.label.length * 6.2, formatValue(n.value).length * 7.4), 0)
    const gutter = upright ? 0 : probe.cols > 1 ? clamp(widest + 14, 56, 160) : 0
    const U = upright ? Math.max(480, height) - 44 : Math.max(120, width - gutter - 8)
    return computeLayout(nodes, links, U, V)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, layoutKey, formatValue])
  const totalH = upright ? Math.max(480, height) : topPad + height + 6
  const G: Geo = React.useMemo(() => ({ upright, ox: upright ? 4 : 4, oy: upright ? 4 : topPad }), [upright, topPad])
  const empty = L.links.length === 0

  /* ----------------------------- Interaction ------------------------------- */
  const [hover, setHover] = React.useState<Sel | null>(null)
  const [pinned, setPinned] = React.useState<Sel | null>(null)
  const [kbd, setKbd] = React.useState<string | null>(null)
  const [kbdOn, setKbdOn] = React.useState(false)
  const sel = React.useMemo<Sel | null>(() => hover ?? pinned ?? (kbdOn && kbd ? { kind: "node", id: kbd } : null), [hover, pinned, kbd, kbdOn])
  const selKey = sel ? `${sel.kind}:${sel.id}` : ""
  const tr = React.useMemo(() => traceOf(L, sel), [L, sel])
  const selNode = sel?.kind === "node" ? L.byId.get(sel.id) : undefined
  const selLink = sel?.kind === "link" ? L.links.find((l) => l.id === sel.id) : undefined

  /* ------------------------------ Animation -------------------------------- */
  const nodeEls = React.useRef(new Map<string, { rect?: SVGRectElement | null; label?: SVGTextElement | null }>())
  const linkEls = React.useRef(new Map<string, { base?: SVGPathElement | null; pour?: SVGPathElement | null }>())
  const nodeAnim = React.useRef(new Map<string, Anim>())
  const linkAnim = React.useRef(new Map<string, Anim>())
  const raf = React.useRef(0)
  const lastT = React.useRef(0)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const visible = React.useRef(false)
  const live = React.useRef({ L, G, particlesOn, width, totalH, reduced })
  const parts = React.useRef<{ l: LLink; t: number; off: number; sp: number }[]>([])
  const ink = React.useRef("#000")

  const paint = React.useCallback(() => {
    const { L: cl, G: cg } = live.current
    for (const n of cl.nodes) {
      const a = nodeAnim.current.get(n.id)
      const e = nodeEls.current.get(n.id)
      if (!a || !e) continue
      const u = cl.colU[n.col]!
      const [v, h, o] = a.c as [number, number, number]
      if (e.rect) {
        if (cg.upright) {
          e.rect.setAttribute("x", (cg.ox + v).toFixed(2))
          e.rect.setAttribute("y", (cg.oy + u).toFixed(2))
          e.rect.setAttribute("width", Math.max(0, h).toFixed(2))
          e.rect.setAttribute("height", String(NODE_W))
        } else {
          e.rect.setAttribute("x", (cg.ox + u).toFixed(2))
          e.rect.setAttribute("y", (cg.oy + v).toFixed(2))
          e.rect.setAttribute("width", String(NODE_W))
          e.rect.setAttribute("height", Math.max(0, h).toFixed(2))
        }
        e.rect.style.opacity = String(o)
      }
      if (e.label) {
        if (cg.upright) e.label.setAttribute("transform", `translate(${(cg.ox + v + h / 2).toFixed(1)} ${(cg.oy + u + NODE_W + 14).toFixed(1)})`)
        else e.label.setAttribute("transform", `translate(${(cg.ox + u + NODE_W + 8).toFixed(1)} ${(cg.oy + v + h / 2).toFixed(1)})`)
        e.label.style.opacity = String(o * clamp(h / 12, 0, 1))
      }
    }
    for (const l of cl.links) {
      const a = linkAnim.current.get(l.id)
      const e = linkEls.current.get(l.id)
      if (!a || !e) continue
      const [v0, v1, w, f, o] = a.c as [number, number, number, number, number]
      const u0 = cl.colU[l.s.col]! + NODE_W
      const u1 = cl.colU[l.t.col]!
      e.base?.setAttribute("d", ribbonPath(cg, u0, u1, v0, v1, w, 0, 1))
      if (e.base) e.base.style.opacity = String(o)
      e.pour?.setAttribute("d", f > 0.004 ? ribbonPath(cg, u0, u1, v0, v1, w, 0, f) : "")
    }
  }, [])

  const drawParticles = React.useCallback((dt: number) => {
    const cv = canvasRef.current
    const { L: cl, G: cg, width: w, totalH: h, particlesOn: on } = live.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (!on) return
    ctx.fillStyle = ink.current
    for (const p of parts.current) {
      const a = linkAnim.current.get(p.l.id)
      if (!a) continue
      const [v0, v1, lw, , o] = a.c as [number, number, number, number, number]
      if (lw < 0.5 || o < 0.05) continue
      const u0 = cl.colU[p.l.s.col]! + NODE_W
      const u1 = cl.colU[p.l.t.col]!
      p.t += (p.sp * dt) / Math.max(40, u1 - u0)
      if (p.t >= 1) p.t -= 1
      const k = p.t
      const s = k * k * (3 - 2 * k) // the same S-curve the ribbon takes between its end values
      const v = lerpV(v0, v1, s) + lw * p.off
      const u = u0 + (u1 - u0) * k
      const x = cg.upright ? cg.ox + v : cg.ox + u
      const y = cg.upright ? cg.oy + u : cg.oy + v
      const edge = Math.min(1, k * 8, (1 - k) * 8)
      ctx.globalAlpha = 0.5 * o * edge
      ctx.fillRect(x - 0.6, y - 0.6, 1.3, 1.3)
    }
    ctx.globalAlpha = 1
  }, [])

  const tick = React.useCallback(
    function tick(now: number) {
      const dt = Math.min(0.05, Math.max(0.001, (now - (lastT.current || now - 16)) / 1000))
      lastT.current = now
      let moving = false
      const step = (a: Anim, taus: number[]) => {
        if (now < a.wake) {
          moving = true
          return
        }
        for (let i = 0; i < a.c.length; i++) {
          const d = a.t[i]! - a.c[i]!
          if (Math.abs(d) > 0.002) {
            a.c[i] = a.c[i]! + d * (1 - Math.exp(-dt / taus[i]!))
            moving = true
          } else a.c[i] = a.t[i]!
        }
      }
      for (const a of nodeAnim.current.values()) step(a, [TAU_GEO, TAU_GEO, TAU_FADE])
      for (const a of linkAnim.current.values()) step(a, [TAU_GEO, TAU_GEO, TAU_GEO, TAU_POUR, TAU_FADE])
      paint()
      const { particlesOn: on } = live.current
      if (on && visible.current) drawParticles(dt)
      else if (!on) drawParticles(0)
      raf.current = moving || (on && visible.current && !document.hidden) ? requestAnimationFrame(tick) : 0
    },
    [paint, drawParticles],
  )
  const wake = React.useCallback(() => {
    if (!raf.current) {
      lastT.current = 0
      raf.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Push the layout and the current trace into the animation targets.
  const lastDims = React.useRef("")
  const started = React.useRef(false)
  React.useEffect(() => {
    live.current = { L, G, particlesOn, width, totalH, reduced }
    const snap = reduced || lastDims.current !== layoutKey
    lastDims.current = layoutKey
    const tracing = !!selKey
    const alive = new Set<string>()
    for (const n of L.nodes) {
      alive.add(n.id)
      const touched = (tr.nf.get(n.id) ?? 0) > 0
      const t = [n.v, n.h, tracing && !touched ? 0.3 : 1]
      let a = nodeAnim.current.get(n.id)
      if (!a) {
        a = { c: [n.v + n.h / 2, 0, 0], t, wake: started.current ? 0 : Infinity, delay: n.col * 90 }
        nodeAnim.current.set(n.id, a)
      }
      a.t = t
      if (snap && started.current) a.c = [...t]
    }
    for (const l of L.links) {
      const touched = (tr.lf.get(l.id) ?? 0) > 0
      const t = [l.v0, l.v1, l.w, tr.lf.get(l.id) ?? 0, tracing && !touched ? 0.28 : 1]
      let a = linkAnim.current.get(l.id)
      if (!a) {
        a = { c: [l.v0 + l.w / 2, l.v1 + l.w / 2, 0, 0, 1], t, wake: started.current ? 0 : Infinity, delay: l.s.col * 90 + 120 }
        linkAnim.current.set(l.id, a)
      }
      a.t = t
      if (snap && started.current) a.c = [...t]
      if (reduced) a.c = [...t]
    }
    for (const k of [...nodeAnim.current.keys()]) if (!alive.has(k)) nodeAnim.current.delete(k)
    const lk = new Set(L.links.map((l) => l.id))
    for (const k of [...linkAnim.current.keys()]) if (!lk.has(k)) linkAnim.current.delete(k)
    if (reduced) for (const a of nodeAnim.current.values()) a.c = [...a.t]
    if (started.current) wake()
  }, [L, G, selKey, tr, particlesOn, width, totalH, reduced, layoutKey, wake])

  // Rebuild the particle pool when the ribbons change.
  React.useEffect(() => {
    const out: typeof parts.current = []
    for (const l of L.links) {
      const n = Math.min(34, Math.max(2, Math.round(l.w / 2.4)))
      for (let i = 0; i < n; i++) out.push({ l, t: Math.random(), off: Math.random(), sp: 34 + Math.random() * 8 })
    }
    parts.current = out
  }, [L])

  // Start (and pause) when the chart is on screen; refresh the particle colour with the theme.
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const readInk = () => {
      ink.current = getComputedStyle(el).getPropertyValue("--sky-ink").trim() || "#000"
    }
    readInk()
    const themer = window.setInterval(readInk, 1000)
    const begin = () => {
      if (started.current) return
      started.current = true
      const now = performance.now()
      for (const a of [...nodeAnim.current.values(), ...linkAnim.current.values()]) a.wake = reduced ? 0 : now + a.delay
      if (reduced) for (const a of [...nodeAnim.current.values(), ...linkAnim.current.values()]) a.c = [...a.t]
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = !!e?.isIntersecting
        if (visible.current) {
          begin()
          wake()
        }
      },
      { threshold: 0.15 },
    )
    // Background tabs may never report intersection; do not leave the chart blank.
    const fallback = window.setTimeout(() => {
      visible.current = true
      begin()
      wake()
    }, 1500)
    io.observe(el)
    const vis = () => !document.hidden && wake()
    document.addEventListener("visibilitychange", vis)
    return () => {
      window.clearInterval(themer)
      window.clearTimeout(fallback)
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [wake, reduced])

  /* ------------------------------ Tooltip ---------------------------------- */
  const placeTip = React.useCallback((x: number, y: number) => {
    const tip = tipRef.current
    const stage = stageRef.current
    if (!tip || !stage) return
    const w = tip.offsetWidth
    const h = tip.offsetHeight
    let tx = x + 14
    if (tx + w > stage.clientWidth) tx = x - w - 14
    tx = clamp(tx, 0, Math.max(0, stage.clientWidth - w))
    const ty = clamp(y - h / 2, 0, Math.max(0, stage.clientHeight - h))
    tip.style.transform = `translate(${tx}px, ${ty}px)`
  }, [])
  const onMove = (ev: React.PointerEvent) => {
    const stage = stageRef.current
    if (!stage || ev.pointerType === "touch") return
    const b = stage.getBoundingClientRect()
    placeTip(ev.clientX - b.left, ev.clientY - b.top)
  }
  React.useEffect(() => {
    if (hover || !kbdOn || !kbd) return
    const n = L.byId.get(kbd)
    if (!n) return
    const u = L.colU[n.col]!
    placeTip(G.upright ? G.ox + n.v + n.h / 2 : G.ox + u + NODE_W, G.upright ? G.oy + u + NODE_W : G.oy + n.v + n.h / 2)
  }, [kbd, kbdOn, hover, L, G, placeTip])

  /* ------------------------------ Keyboard --------------------------------- */
  const onKeyDown = (ev: React.KeyboardEvent) => {
    const cur = kbd ? L.byId.get(kbd) : undefined
    const go = (n?: LNode) => {
      if (!n) return
      setKbd(n.id)
      setKbdOn(true)
    }
    const across = (dir: 1 | -1) => {
      if (!cur) return go(L.byCol[0]?.[0])
      const col = L.byCol[cur.col] ?? []
      go(col[clamp(cur.idx + dir, 0, col.length - 1)])
    }
    const along = (dir: 1 | -1) => {
      if (!cur) return go(L.byCol[0]?.[0])
      let c = cur.col + dir
      while (c >= 0 && c < L.cols && !(L.byCol[c]?.length)) c += dir
      const col = L.byCol[c]
      if (!col?.length) return
      const mid = cur.v + cur.h / 2
      go(col.reduce((b, n) => (Math.abs(n.v + n.h / 2 - mid) < Math.abs(b.v + b.h / 2 - mid) ? n : b), col[0]!))
    }
    const k = ev.key
    const up = G.upright
    if (k === "ArrowUp" || k === "ArrowDown") {
      ev.preventDefault()
      if (up) along(k === "ArrowDown" ? 1 : -1)
      else across(k === "ArrowDown" ? 1 : -1)
    } else if (k === "ArrowLeft" || k === "ArrowRight") {
      ev.preventDefault()
      if (up) across(k === "ArrowRight" ? 1 : -1)
      else along(k === "ArrowRight" ? 1 : -1)
    } else if (k === "Home" || k === "End") {
      ev.preventDefault()
      const col = L.byCol[k === "Home" ? 0 : L.cols - 1]
      go(col?.[0])
    } else if (k === "Escape") {
      setKbdOn(false)
      setPinned(null)
      setHover(null)
    }
  }

  /* ------------------------------ Render ----------------------------------- */
  const announce = (() => {
    const n = selNode
    if (n && kbdOn) {
      const outs = n.outs.map((l) => `${l.t.label} ${pct(l.value / Math.max(1, n.out))}`)
      return `${n.label}, ${formatValue(n.value)} ${unit}, ${pct(n.value / Math.max(1, L.total))} of ${totalLabel}${outs.length ? `. Flows to ${outs.join(", ")}` : ". End of the flow"}`
    }
    return ""
  })()
  const fire = (s: Sel) => {
    if (pinned && pinned.kind === s.kind && pinned.id === s.id) setPinned(null)
    else setPinned(s)
  }

  const tipNode = selNode
  const tipLink = selLink
  const showTip = !!(tipNode || tipLink) && (!!hover || !!pinned || kbdOn)
  const tc = tipNode || tipLink ? HUES[((tipNode ?? tipLink)!.dom) % HUES.length] : undefined
  const headX = (c: number) => G.ox + L.colU[c]!
  const headFits = (c: number) => {
    const next = c < L.cols - 1 ? L.colU[c + 1]! : L.colU[c]! + 120
    return (columns?.[c]?.length ?? 0) * 6.4 < next - L.colU[c]! - 10
  }

  return (
    <figure className={cn("sky", className)} aria-label={label}>
      <style href="sankey-flow" precedence="default">
        {CSS}
      </style>

      {(title || subtitle || actions) && (
        <div className="sky-head">
          <div>
            {title && <p className="sky-title">{title}</p>}
            {subtitle && <p className="sky-sub">{subtitle}</p>}
          </div>
          {actions && <div className="sky-actions">{actions}</div>}
        </div>
      )}

      <div ref={rootRef}>
        {empty ? (
          <div className="sky-empty">{emptyLabel}</div>
        ) : (
          <div
            ref={stageRef}
            className="sky-stage"
            style={{ height: totalH }}
            role="group"
            tabIndex={0}
            aria-roledescription="sankey diagram"
            aria-label={`${label}. Arrow keys move between nodes, Escape clears.`}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              if (!e.currentTarget.matches(":focus-visible")) return
              setKbdOn(true)
              setKbd((k) => k ?? L.byCol[0]?.[0]?.id ?? null)
            }}
            onBlur={() => setKbdOn(false)}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onClick={(e) => {
              if (e.target === e.currentTarget || (e.target as Element).tagName === "svg") setPinned(null)
            }}
          >
            <svg viewBox={`0 0 ${width} ${totalH}`} aria-hidden style={tc ? { ["--tc" as string]: tc } : undefined}>
              {hasHeads &&
                L.byCol.map((_, c) =>
                  columns?.[c] && headFits(c) ? (
                    <text key={c} className="sky-hd" x={headX(c)} y={12}>
                      {columns[c]}
                    </text>
                  ) : null,
                )}
              {L.links.map((l) => (
                <g key={l.id} style={{ ["--c" as string]: HUES[l.dom % HUES.length] }}>
                  <path
                    ref={(el) => {
                      const e = linkEls.current.get(l.id) ?? {}
                      e.base = el
                      linkEls.current.set(l.id, e)
                    }}
                    className="sky-rb"
                    data-src={l.s.col === 0 || undefined}
                    onPointerEnter={(ev) => ev.pointerType !== "touch" && setHover({ kind: "link", id: l.id })}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => fire({ kind: "link", id: l.id })}
                  />
                  <path
                    ref={(el) => {
                      const e = linkEls.current.get(l.id) ?? {}
                      e.pour = el
                      linkEls.current.set(l.id, e)
                    }}
                    className="sky-pour"
                  />
                </g>
              ))}
              {L.nodes.map((n) => (
                <g key={n.id} style={{ ["--c" as string]: HUES[n.dom % HUES.length] }}>
                  <rect
                    ref={(el) => {
                      const e = nodeEls.current.get(n.id) ?? {}
                      e.rect = el
                      nodeEls.current.set(n.id, e)
                    }}
                    className="sky-nd"
                    rx={1.5}
                    data-src={n.col === 0 || undefined}
                    data-hot={selNode?.id === n.id || undefined}
                    onPointerEnter={(ev) => ev.pointerType !== "touch" && setHover({ kind: "node", id: n.id })}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => fire({ kind: "node", id: n.id })}
                  />
                </g>
              ))}
              {L.nodes.map((n) => {
                const one = n.h < 34 && !upright
                return (
                  <text
                    key={n.id}
                    ref={(el) => {
                      const e = nodeEls.current.get(n.id) ?? {}
                      e.label = el
                      nodeEls.current.set(n.id, e)
                    }}
                    className="sky-lb"
                    data-one={one || undefined}
                    textAnchor={upright ? "middle" : "start"}
                  >
                    {upright || !one ? (
                      <>
                        <tspan className="n" x={0} dy={upright ? 0 : "-0.15em"}>
                          {n.label}
                        </tspan>
                        <tspan className="v" x={0} dy="1.25em">
                          {formatValue(n.value)}
                        </tspan>
                      </>
                    ) : (
                      <>
                        <tspan className="n" x={0} dy="0.35em">
                          {n.label}{" "}
                        </tspan>
                        <tspan className="v">{formatValue(n.value)}</tspan>
                      </>
                    )}
                  </text>
                )
              })}
            </svg>
            <canvas ref={canvasRef} aria-hidden />
            <div ref={tipRef} className="sky-tip" data-on={showTip || undefined} aria-hidden>
              {tipNode && (
                <>
                  <div className="sky-tip-n">{tipNode.label}</div>
                  <div className="sky-tip-v">
                    {formatValue(tipNode.value)} {unit}
                  </div>
                  <div className="sky-tip-s">
                    {pct(tipNode.value / Math.max(1, L.total))} of {totalLabel}
                  </div>
                  {(tipNode.outs.length > 0 || tipNode.ins.length > 0) && <div className="sky-tip-d" />}
                  {(tipNode.outs.length ? tipNode.outs : tipNode.ins).slice(0, 5).map((l) => {
                    const other = tipNode.outs.length ? l.t : l.s
                    const base = tipNode.outs.length ? tipNode.out : tipNode.in
                    return (
                      <div className="sky-tip-r" key={l.id}>
                        <span>
                          {tipNode.outs.length ? "to" : "from"} {other.label}
                        </span>
                        <span>{pct(l.value / Math.max(1, base))}</span>
                      </div>
                    )
                  })}
                </>
              )}
              {tipLink && (
                <>
                  <div className="sky-tip-n">
                    {tipLink.s.label} to {tipLink.t.label}
                  </div>
                  <div className="sky-tip-v">
                    {formatValue(tipLink.value)} {unit}
                  </div>
                  <div className="sky-tip-s">
                    {pct(tipLink.value / Math.max(1, tipLink.s.out))} of {tipLink.s.label}
                  </div>
                  <div className="sky-tip-s">
                    {pct(tipLink.value / Math.max(1, L.total))} of {totalLabel}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!empty && particleToggle && !reduced && (
        <div className="sky-foot">
          <button
            type="button"
            className="sky-flow"
            role="switch"
            aria-checked={particlesOn}
            onClick={() => {
              const next = !(particlesProp ?? pInner)
              setPInner(next)
              onParticlesChange?.(next)
            }}
          >
            <FlowIcon />
            Flow
          </button>
        </div>
      )}

      <div className="sky-sr" role="status" aria-live="polite">
        {announce}
      </div>
      <table className="sky-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Value</th>
            <th>Share of source</th>
          </tr>
        </thead>
        <tbody>
          {L.links.map((l) => (
            <tr key={l.id}>
              <td>{l.s.label}</td>
              <td>{l.t.label}</td>
              <td>
                {formatValue(l.value)} {unit}
              </td>
              <td>{pct(l.value / Math.max(1, l.s.out))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

const lerpV = (a: number, b: number, t: number) => a + (b - a) * t