"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TreemapNode = {
  /** Stable id. Keep it the same across datasets so switching a measure morphs tiles instead of rebuilding them. */
  id: string
  label: string
  /** Size of a leaf. A branch's value is the sum of its children. */
  value?: number
  /** Shading measure of a leaf, such as growth. A branch takes the value-weighted mean of its leaves. */
  color?: number
  children?: TreemapNode[]
}

export type TreemapProps = {
  /** The root: { id, label, value?, color?, children? }. */
  data: TreemapNode
  /** What the whole is. Names the chart for assistive technology. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header, e.g. measure switches. */
  actions?: React.ReactNode
  /** Formats sizes on tiles, the total and the tooltip. */
  formatValue?: (value: number) => string
  /** Names the shading measure, such as "Growth". Tiles take the hue of their top-level branch and deepen with the measure. */
  colorLabel?: string
  formatColor?: (value: number) => string
  /** Range of the shading measure. Defaults to the range of the leaves. */
  colorDomain?: [number, number]
  /** Controlled id of the node that fills the view. */
  focus?: string
  /** Initial focus when uncontrolled. Defaults to the root. */
  defaultFocus?: string
  /** Called when people drill in or out. */
  onFocusChange?: (id: string) => void
  /** Height of the tiles in pixels. */
  height?: number
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.trm {
  --trm-ink: #000;
  --trm-surface: #fff;
  --trm-accent: #0060e2;
  --trm-t1: color-mix(in oklab, var(--trm-ink) 88%, transparent);
  --trm-t2: color-mix(in oklab, var(--trm-ink) 61%, transparent);
  --trm-t3: color-mix(in oklab, var(--trm-ink) 45%, transparent);
  --trm-t4: color-mix(in oklab, var(--trm-ink) 27%, transparent);
  --trm-fill: color-mix(in oklab, var(--trm-ink) 6%, transparent);
  --trm-line: color-mix(in oklab, var(--trm-ink) 6%, transparent);
  --trm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --trm-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --trm-l0: .915; --trm-ld: .165; --trm-c0: .034; --trm-cd: .07; --trm-bl: .968; --trm-bc: .011;
  --trm-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0;
  padding: 18px 20px 14px;
  border-radius: 16px;
  background: var(--trm-surface);
  box-shadow: var(--trm-shadow);
  color: var(--trm-t1);
  font-family: var(--trm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .trm {
  --trm-ink: #fff;
  --trm-surface: #1c1c1e;
  --trm-accent: #4d8dff;
  --trm-t1: color-mix(in oklab, var(--trm-ink) 90%, transparent);
  --trm-t2: color-mix(in oklab, var(--trm-ink) 62%, transparent);
  --trm-t3: color-mix(in oklab, var(--trm-ink) 46%, transparent);
  --trm-t4: color-mix(in oklab, var(--trm-ink) 28%, transparent);
  --trm-fill: color-mix(in oklab, var(--trm-ink) 8%, transparent);
  --trm-line: color-mix(in oklab, var(--trm-ink) 8%, transparent);
  --trm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --trm-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
  --trm-l0: .34; --trm-ld: -.2; --trm-c0: .04; --trm-cd: .08; --trm-bl: .27; --trm-bc: .024;
}
:where(.trm) *, :where(.trm) *::before, :where(.trm) *::after { box-sizing: border-box }
:where(.trm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.trm :focus-visible { outline: 2px solid color-mix(in oklab, var(--trm-accent) 60%, transparent); outline-offset: 1px }

.trm-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap }
.trm-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--trm-t1) }
.trm-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--trm-t3) }
.trm-actions { display: flex; flex-wrap: wrap; gap: 8px; flex: none }

.trm-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 28px; margin-bottom: 4px }
.trm-crumbs { min-width: 0 }
.trm-crumbs ol { display: flex; align-items: center; margin: 0; padding: 0; list-style: none; min-width: 0 }
.trm-crumbs li { display: flex; align-items: center; min-width: 0; animation: trm-slide .42s var(--trm-ease) backwards }
.trm-crumbs li + li::before { content: ""; flex: none; width: 5px; height: 5px; margin: 0 8px 0 6px; border-top: 1.5px solid var(--trm-t4); border-right: 1.5px solid var(--trm-t4); transform: rotate(45deg) scale(.8) }
.trm-crumb { max-width: 150px; padding: 0 4px; margin: 0 -4px; border-radius: 6px; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--trm-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .15s, background-color .15s }
.trm-crumb:hover { color: var(--trm-t1); background: var(--trm-fill) }
.trm-cur { max-width: 220px; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--trm-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.trm-total { margin: 0; flex: none; font-size: 14px; line-height: 20px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--trm-t1) }

.trm-stage {
  position: relative; width: 100%; overflow: hidden; border-radius: 12px; outline-offset: 3px;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
}
.trm-t {
  position: absolute; left: 0; top: 0; display: flex; flex-direction: column; overflow: hidden; padding: 5px 7px; border-radius: 6px;
  background: oklch(calc(var(--trm-l0) - var(--m, .4) * var(--trm-ld)) calc(var(--trm-c0) + var(--m, .4) * var(--trm-cd)) var(--h));
  color: var(--trm-t1); cursor: pointer; will-change: transform;
  transition: background-color .55s var(--trm-ease), box-shadow .16s;
}
.trm-t[data-role="branch"] { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 3px 8px; border-radius: 8px; background: oklch(var(--trm-bl) var(--trm-bc) var(--h)) }
.trm-t[data-active], .trm-t[data-kb] { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--trm-ink) 60%, transparent) }
.trm-t[data-leaf] { cursor: default }
.trm-l { min-width: 0; font-size: 12px; line-height: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.trm-v { flex: none; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--trm-t2) }
.trm-t[data-role="branch"] .trm-v { color: var(--trm-t3) }

.trm-tip {
  position: absolute; left: 0; top: 0; z-index: 4; width: max-content; min-width: 150px; max-width: 240px; padding: 8px 10px; border-radius: 10px;
  background: var(--trm-surface); box-shadow: var(--trm-tip); pointer-events: none; opacity: 0; transition: opacity .14s; font-size: 12px; line-height: 16px;
}
.trm-tip[data-on] { opacity: 1 }
.trm-tip-p { margin: 0 0 2px; color: var(--trm-t3); font-size: 11px; line-height: 14px }
.trm-tip-n { margin: 0 0 4px; font-size: 13px; line-height: 18px; font-weight: 500; color: var(--trm-t1) }
.trm-tip-r { display: flex; justify-content: space-between; gap: 16px; color: var(--trm-t2) }
.trm-tip-r b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--trm-t1) }

.trm-legend { display: flex; align-items: center; gap: 8px; margin-top: 10px; min-height: 16px; font-size: 11px; line-height: 16px; color: var(--trm-t3); font-variant-numeric: tabular-nums }
.trm-ramp { display: flex; gap: 2px }
.trm-ramp i { width: 14px; height: 6px; border-radius: 2px; background: color-mix(in oklab, var(--trm-ink) var(--p), transparent) }
.trm-empty { display: grid; place-items: center; min-height: 160px; color: var(--trm-t3) }
.trm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@keyframes trm-slide { from { opacity: 0; transform: translateX(-6px); filter: blur(3px) } }
@media (max-width: 420px) { .trm { padding: 14px 12px 10px } }
@media (prefers-reduced-motion: reduce) {
  .trm *, .trm *::before, .trm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Maths                                   */
/* -------------------------------------------------------------------------- */

type Rect = { x: number; y: number; w: number; h: number }
type Cell = Rect & { role: "branch" | "tile" }
type Rec = Rect & { a: number }
type TNode = {
  id: string
  label: string
  parent: TNode | null
  kids: TNode[]
  value: number
  color: number | undefined
  /** Index of the top-level branch the node sits in (drives the hue). */
  top: number
  path: string
}

const HUES = [250, 305, 70, 185]
const GAP = 1
const HEAD = 22
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nfCompact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const nfPct = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Bruls, Huizing and van Wijk's squarified treemap: fill rows along the shorter side while the worst aspect ratio improves. */
function squarify(vals: number[], x: number, y: number, w: number, h: number): Rect[] {
  const out: Rect[] = []
  const n = vals.length
  if (!n) return out
  const total = vals.reduce((a, b) => a + b, 0)
  if (total <= 0 || w <= 0 || h <= 0) return vals.map(() => ({ x, y, w: 0, h: 0 }))
  const scale = (w * h) / total
  const areas = vals.map((v) => v * scale)
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0)
    let mx = -Infinity
    let mn = Infinity
    for (const a of row) {
      if (a > mx) mx = a
      if (a < mn) mn = a
    }
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn))
  }
  let rx = x
  let ry = y
  let rw = w
  let rh = h
  let i = 0
  while (i < n) {
    const side = Math.min(rw, rh)
    let row = [areas[i]!]
    let j = i + 1
    let cur = worst(row, side)
    while (j < n) {
      const next = [...row, areas[j]!]
      const wn = worst(next, side)
      if (wn <= cur) {
        row = next
        cur = wn
        j++
      } else break
    }
    const sum = row.reduce((a, b) => a + b, 0)
    if (rw >= rh) {
      const cw = sum / rh
      let cy = ry
      for (const a of row) {
        const ch = a / cw
        out.push({ x: rx, y: cy, w: cw, h: ch })
        cy += ch
      }
      rx += cw
      rw -= cw
    } else {
      const ch = sum / rw
      let cx = rx
      for (const a of row) {
        const cw = a / ch
        out.push({ x: cx, y: ry, w: cw, h: ch })
        cx += cw
      }
      ry += ch
      rh -= ch
    }
    i = j
  }
  return out
}

const inset = (r: Rect, g: number): Rect => ({ x: r.x + g, y: r.y + g, w: Math.max(0, r.w - 2 * g), h: Math.max(0, r.h - 2 * g) })

function buildTree(root: TreemapNode) {
  const byId = new Map<string, TNode>()
  const order: TNode[] = []
  const walk = (n: TreemapNode, parent: TNode | null, top: number): TNode => {
    const node: TNode = { id: n.id, label: n.label, parent, kids: [], value: 0, color: n.color, top, path: parent ? (parent.parent ? `${parent.path} / ${n.label}` : n.label) : "" }
    byId.set(n.id, node)
    order.push(node)
    if (n.children?.length) {
      node.kids = n.children.map((c, i) => walk(c, node, parent ? top : i))
      node.value = node.kids.reduce((a, c) => a + c.value, 0)
      let cw = 0
      let cs = 0
      for (const c of node.kids) {
        if (c.color !== undefined && c.value > 0) {
          cw += c.value
          cs += c.color * c.value
        }
      }
      node.color = cw > 0 ? cs / cw : undefined
      node.kids.sort((a, b) => b.value - a.value)
    } else node.value = Math.max(0, n.value ?? 0)
    return node
  }
  const rootNode = walk(root, null, 0)
  return { root: rootNode, byId, order }
}

/** What is on screen when `focus` fills the view: its children, and one more level inside each branch. */
function layoutFocus(focus: TNode, W: number, H: number) {
  const out = new Map<string, Cell>()
  const kids = focus.kids.filter((k) => k.value > 0)
  const rects = squarify(
    kids.map((k) => k.value),
    0,
    0,
    W,
    H,
  )
  kids.forEach((k, i) => {
    const r = inset(rects[i]!, GAP)
    const inner = { x: r.x + 4, y: r.y + HEAD, w: r.w - 8, h: r.h - HEAD - 4 }
    const gk = k.kids.filter((g) => g.value > 0)
    const hasInner = gk.length > 0 && r.w >= 64 && r.h >= 52 && inner.w > 8 && inner.h > 8
    out.set(k.id, { ...r, role: hasInner ? "branch" : "tile" })
    if (hasInner) {
      const gr = squarify(
        gk.map((g) => g.value),
        inner.x,
        inner.y,
        inner.w,
        inner.h,
      )
      gk.forEach((g, j) => out.set(g.id, { ...inset(gr[j]!, GAP), role: "tile" }))
    }
  })
  return out
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

/** A number that counts to its new value. Written straight to the DOM, so no React render per frame. */
function CountUp({ value, format, reduced }: { value: number; format: (v: number) => string; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(value)
  const fmt = React.useRef(format)
  React.useLayoutEffect(() => {
    fmt.current = format
  })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    if (reduced || from === value) {
      shown.current = value
      el.textContent = fmt.current(value)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = clamp((now - start) / 650, 0, 1)
      const e = 1 - (1 - t) ** 4
      shown.current = from + (value - from) * e
      el.textContent = fmt.current(shown.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return <span ref={ref}>{format(value)}</span>
}

type Anim = {
  from: Map<string, Rec>
  to: Map<string, Rec>
  delay: Map<string, number>
  t0: number
  dur: number
  total: number
  running: boolean
  entrance: boolean
}

/* -------------------------------------------------------------------------- */
/*                                   Treemap                                  */
/* -------------------------------------------------------------------------- */

export function Treemap({
  data,
  label,
  title,
  subtitle,
  actions,
  formatValue,
  colorLabel,
  formatColor,
  colorDomain,
  focus: focusProp,
  defaultFocus,
  onFocusChange,
  height = 420,
  emptyLabel = "No data yet",
  className,
}: TreemapProps) {
  const reduced = usePrefersReducedMotion()
  const fmtV = React.useCallback((v: number) => (formatValue ? formatValue(v) : nfCompact.format(v)), [formatValue])
  const fmtC = React.useCallback((v: number) => (formatColor ? formatColor(v) : nfPct.format(v)), [formatColor])
  const tree = React.useMemo(() => buildTree(data), [data])
  const [focusInner, setFocusInner] = React.useState(defaultFocus ?? data.id)
  const wanted = focusProp ?? focusInner
  const focusNode = tree.byId.get(wanted) ?? tree.root
  const focusId = focusNode.id

  const stageRef = React.useRef<HTMLDivElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(0, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = height

  const cells = React.useMemo(() => (width > 0 ? layoutFocus(focusNode, width, H) : new Map<string, Cell>()), [focusNode, width, H])

  // Shading measure: lightness and chroma deepen with the measure inside the hue of the top-level branch.
  const domain = React.useMemo<[number, number]>(() => {
    if (colorDomain) return colorDomain
    let lo = Infinity
    let hi = -Infinity
    for (const n of tree.order) {
      if (n.kids.length === 0 && n.color !== undefined && n.value > 0) {
        lo = Math.min(lo, n.color)
        hi = Math.max(hi, n.color)
      }
    }
    return isFinite(lo) ? [lo, hi] : [0, 1]
  }, [colorDomain, tree])
  const measureOf = (n: TNode) => (colorLabel && n.color !== undefined ? clamp((n.color - domain[0]) / Math.max(1e-9, domain[1] - domain[0]), 0, 1) : 0.4)

  /* ------------------------------- Selection ------------------------------- */
  const [hoverId, setHoverId] = React.useState<string | null>(null)
  const [kbId, setKbId] = React.useState<string | null>(null)
  const [kbOn, setKbOn] = React.useState(false)
  const activeId = hoverId ?? (kbOn ? kbId : null)
  const active = activeId ? tree.byId.get(activeId) : null
  const setFocus = (id: string, from?: string) => {
    if (id === focusId) return
    setFocusInner(id)
    onFocusChange?.(id)
    setHoverId(null)
    setKbId(from ?? tree.byId.get(id)?.kids[0]?.id ?? null)
  }
  const drill = (id: string) => {
    const n = tree.byId.get(id)
    if (n && n.kids.length) setFocus(id)
  }
  const up = () => {
    const p = focusNode.parent
    if (p) setFocus(p.id, focusId)
  }

  /* ------------------------------ Tile motion ------------------------------ */
  const els = React.useRef(new Map<string, HTMLDivElement>())
  const widths = React.useRef(new Map<string, [number, number]>())
  const cur = React.useRef(new Map<string, Rec>())
  const anim = React.useRef<Anim>({ from: new Map(), to: new Map(), delay: new Map(), t0: 0, dur: 0, total: 0, running: false, entrance: false })
  const raf = React.useRef(0)
  const lastGeo = React.useRef({ w: 0, h: 0, focus: "", entered: false })

  const applyOne = React.useCallback((id: string, r: Rec, role: "branch" | "tile" | undefined) => {
    const el = els.current.get(id)
    if (!el) return
    el.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`
    el.style.width = `${Math.max(0, r.w)}px`
    el.style.height = `${Math.max(0, r.h)}px`
    el.style.opacity = r.a >= 0.995 ? "" : String(Math.max(0, r.a))
    const vis = r.a > 0.02 && r.w > 1 && r.h > 1
    el.style.visibility = vis ? "" : "hidden"
    el.style.pointerEvents = r.a > 0.6 ? "" : "none"
    // Text never scales: labels appear only where they fit, and fade as a tile narrows.
    const l = el.firstElementChild as HTMLElement | null
    const v = el.lastElementChild as HTMLElement | null
    if (l && v) {
      let w2 = widths.current.get(id)
      if (!w2 && vis) {
        w2 = [l.scrollWidth, v.scrollWidth]
        if (w2[0] > 0) widths.current.set(id, w2)
      }
      if (role === "branch") {
        l.style.opacity = String(clamp((r.w - 36) / 16, 0, 1) * clamp((r.h - 14) / 8, 0, 1))
        const need = (w2?.[0] ?? 60) + (w2?.[1] ?? 40) + 34
        v.style.opacity = String(clamp((r.w - need + 10) / 12, 0, 1))
        v.style.display = ""
      } else {
        l.style.opacity = String(clamp((r.w - 30) / 14, 0, 1) * clamp((r.h - 16) / 8, 0, 1))
        const vv = clamp((r.w - 30) / 14, 0, 1) * clamp((r.h - 36) / 10, 0, 1)
        v.style.opacity = String(vv)
        v.style.display = vv <= 0.01 ? "none" : ""
      }
    }
  }, [])

  const roleOf = (id: string) => cells.get(id)?.role

  React.useLayoutEffect(() => {
    if (width <= 0) return
    const geo = lastGeo.current
    const A = anim.current
    const nodes = tree.order
    const to = new Map<string, Rec>()
    // 1. what is on screen
    for (const n of nodes) {
      const c = cells.get(n.id)
      if (c) to.set(n.id, { x: c.x, y: c.y, w: c.w, h: c.h, a: 1 })
    }
    // 2. what is not: tucked inside its on-screen ancestor, or (outside the focus) carried along by the zoom
    const prev = cur.current
    const fromF = prev.get(focusId)
    const zoomIn = fromF && geo.focus && geo.focus !== focusId && isInside(tree.byId.get(focusId), geo.focus)
    for (const n of nodes) {
      if (to.has(n.id)) continue
      let anc: TNode | null = n.parent
      let host: Rec | undefined
      while (anc && !host) {
        host = to.get(anc.id)
        anc = anc.parent
      }
      const own = prev.get(n.id)
      if (host) to.set(n.id, { ...host, a: 0 })
      else if (own && zoomIn && fromF && fromF.w > 1 && fromF.h > 1) {
        const sx = width / fromF.w
        const sy = H / fromF.h
        to.set(n.id, { x: (own.x - fromF.x) * sx, y: (own.y - fromF.y) * sy, w: own.w * sx, h: own.h * sy, a: 0 })
      } else to.set(n.id, own ? { ...own, a: 0 } : { x: 0, y: 0, w: width, h: H, a: 0 })
    }
    const sizeChanged = geo.w !== width || geo.h !== H
    const first = !geo.entered
    const sameFocus = geo.focus === focusId
    geo.w = width
    geo.h = H
    geo.focus = focusId
    geo.entered = true
    cancelAnimationFrame(raf.current)
    raf.current = 0
    A.running = false
    const setNow = () => {
      for (const n of nodes) {
        const r = to.get(n.id)!
        cur.current.set(n.id, { ...r })
        applyOne(n.id, r, roleOf(n.id))
      }
    }
    // Text widths are measured once per label, not per frame.
    widths.current.clear()
    if (!first && sizeChanged && sameFocus) {
      setNow()
      return
    }
    if (reduced) {
      setNow()
      return
    }
    // 3. tween from where every tile is right now
    const from = new Map<string, Rec>()
    const delay = new Map<string, number>()
    let rank = 0
    for (const n of nodes) {
      const t = to.get(n.id)!
      const c = prev.get(n.id)
      if (first) {
        from.set(n.id, { x: t.x + 6, y: t.y + 8, w: Math.max(0, t.w - 12), h: Math.max(0, t.h - 12), a: 0 })
        if (t.a > 0) delay.set(n.id, 40 + rank++ * 16 + (cells.get(n.id)?.role === "tile" ? 90 : 0))
      } else from.set(n.id, c ? { ...c } : { ...t, a: 0 })
    }
    A.from = from
    A.to = to
    A.delay = delay
    A.t0 = performance.now()
    A.dur = first ? 560 : sameFocus ? 560 : 760
    A.total = A.dur + Math.max(0, ...delay.values())
    A.running = true
    A.entrance = first
    const tick = (now: number) => {
      raf.current = 0
      const el = now - A.t0
      let done = true
      for (const n of nodes) {
        const f = A.from.get(n.id)!
        const t = A.to.get(n.id)!
        const p = clamp((el - (A.delay.get(n.id) ?? 0)) / A.dur, 0, 1)
        if (p < 1) done = false
        const e = easeInOut(p)
        // fading out happens early, fading in late, so tiles trade places instead of overlapping
        const ap = t.a < f.a ? clamp(p / 0.4, 0, 1) : clamp((p - 0.35) / 0.65, 0, 1)
        const r: Rec = { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e, w: f.w + (t.w - f.w) * e, h: f.h + (t.h - f.h) * e, a: f.a + (t.a - f.a) * ap }
        cur.current.set(n.id, r)
        applyOne(n.id, r, roleOf(n.id))
      }
      if (done || el >= A.total) {
        A.running = false
        for (const n of nodes) {
          const t = A.to.get(n.id)!
          cur.current.set(n.id, { ...t })
          applyOne(n.id, t, roleOf(n.id))
        }
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    // Draw frame 0 now so a tile never flashes at its final place before the tween starts.
    for (const n of nodes) {
      const f = from.get(n.id)!
      cur.current.set(n.id, { ...f })
      applyOne(n.id, f, roleOf(n.id))
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0 // reset so a StrictMode remount can start the tween again
      if (A.running && A.entrance) geo.entered = false
    }
  }, [cells, tree, reduced])

  /* ------------------------------ Interactions ----------------------------- */
  const tileFrom = (e: React.SyntheticEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-tid]")
    return t?.dataset.tid ?? null
  }
  const placeTip = (clientX: number, clientY: number) => {
    const tip = tipRef.current
    const stage = stageRef.current
    if (!tip || !stage) return
    const r = stage.getBoundingClientRect()
    const x = clamp(clientX - r.left + 14, 0, r.width - tip.offsetWidth)
    const y = clientY - r.top + 18 + tip.offsetHeight > r.height ? clientY - r.top - tip.offsetHeight - 12 : clientY - r.top + 18
    tip.style.transform = `translate(${x}px, ${Math.max(0, y)}px)`
  }
  const kbMove = (dir: "left" | "right" | "up" | "down") => {
    const ids = focusNode.kids.filter((k) => cells.has(k.id)).map((k) => k.id)
    if (!ids.length) return
    const from = kbId && ids.includes(kbId) ? kbId : ids[0]!
    const c0 = cells.get(from)!
    const cx = c0.x + c0.w / 2
    const cy = c0.y + c0.h / 2
    let best: string | null = null
    let bestScore = Infinity
    for (const id of ids) {
      if (id === from) continue
      const c = cells.get(id)!
      const dx = c.x + c.w / 2 - cx
      const dy = c.y + c.h / 2 - cy
      const along = dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy
      if (along <= 1) continue
      const across = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx)
      const score = along + across * 1.6
      if (score < bestScore) {
        bestScore = score
        best = id
      }
    }
    if (best) setKbId(best)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const ids = focusNode.kids.filter((k) => cells.has(k.id)).map((k) => k.id)
    const cur0 = kbId && ids.includes(kbId) ? kbId : ids[0]
    switch (e.key) {
      case "ArrowLeft":
        kbMove("left")
        break
      case "ArrowRight":
        kbMove("right")
        break
      case "ArrowUp":
        kbMove("up")
        break
      case "ArrowDown":
        kbMove("down")
        break
      case "Home":
        setKbId(ids[0] ?? null)
        break
      case "End":
        setKbId(ids[ids.length - 1] ?? null)
        break
      case "Enter":
      case " ":
        if (cur0) drill(cur0)
        break
      case "Escape":
      case "Backspace":
        up()
        break
      default:
        return
    }
    e.preventDefault()
    setKbOn(true)
    if (!kbId && cur0) setKbId(cur0)
  }

  /* -------------------------------- Output --------------------------------- */
  const crumbs: TNode[] = []
  for (let n: TNode | null = focusNode; n; n = n.parent) crumbs.unshift(n)
  const total = focusNode.value
  const hasData = tree.root.value > 0
  const share = (n: TNode) => (n.parent && n.parent.value > 0 ? (n.value / n.parent.value) * 100 : 100)
  const describe = (n: TNode) => `${n.path || n.label}, ${fmtV(n.value)}, ${nfPct.format(share(n))}% of ${n.parent?.label ?? "total"}${colorLabel && n.color !== undefined ? `, ${colorLabel} ${fmtC(n.color)}` : ""}`
  const hueOf = (n: TNode) => HUES[n.top % HUES.length]!
  const ramp = [0, 1, 2, 3, 4]

  return (
    <figure className={cn("trm", className)} aria-label={label}>
      <style href="treemap" precedence="default">
        {CSS}
      </style>
      {(title || subtitle || actions) && (
        <div className="trm-head">
          <div>
            {title && <p className="trm-title">{title}</p>}
            {subtitle && <p className="trm-sub">{subtitle}</p>}
          </div>
          {actions && <div className="trm-actions">{actions}</div>}
        </div>
      )}
      <div className="trm-bar">
        <nav className="trm-crumbs" aria-label="Zoom level">
          <ol>
            {crumbs.map((c, i) => (
              <li key={c.id}>
                {i === crumbs.length - 1 ? (
                  <span className="trm-cur" aria-current="location">
                    {c.label}
                  </span>
                ) : (
                  <button type="button" className="trm-crumb" onClick={() => setFocus(c.id, crumbs[i + 1]!.id)}>
                    {c.label}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="trm-total">
          <span className="trm-sr">{`${focusNode.label}, `}</span>
          <CountUp value={total} format={fmtV} reduced={reduced} />
        </p>
      </div>

      <div
        ref={stageRef}
        className="trm-stage"
        style={{ height: H }}
        role="group"
        tabIndex={hasData ? 0 : -1}
        aria-roledescription="treemap"
        aria-label={`${label}, ${focusNode.label}`}
        aria-describedby="trm-keys"
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (!e.currentTarget.matches(":focus-visible")) return
          setKbOn(true)
          if (!kbId) setKbId(focusNode.kids[0]?.id ?? null)
        }}
        onBlur={() => setKbOn(false)}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return
          const id = tileFrom(e)
          setHoverId(id)
          if (id) placeTip(e.clientX, e.clientY)
        }}
        onPointerLeave={() => setHoverId(null)}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return
          const id = tileFrom(e)
          setHoverId(id)
          if (id) placeTip(e.clientX, e.clientY)
        }}
        onClick={(e) => {
          const id = tileFrom(e)
          if (!id) return
          drill(id)
        }}
      >
        {!hasData && <div className="trm-empty">{emptyLabel}</div>}
        {hasData &&
          tree.order.map((n) => {
            if (!n.parent) return null
            const role = roleOf(n.id)
            return (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) els.current.set(n.id, el)
                  else els.current.delete(n.id)
                }}
                className="trm-t"
                data-tid={n.id}
                data-role={role ?? "tile"}
                data-leaf={n.kids.length === 0 ? "" : undefined}
                data-active={hoverId === n.id ? "" : undefined}
                data-kb={kbOn && !hoverId && kbId === n.id ? "" : undefined}
                style={{ "--h": hueOf(n), "--m": measureOf(n).toFixed(3), visibility: "hidden" } as React.CSSProperties}
              >
                <span className="trm-l">{n.label}</span>
                <span className="trm-v">{fmtV(n.value)}</span>
              </div>
            )
          })}
        <div ref={tipRef} className="trm-tip" data-on={active && hoverId ? "" : undefined} aria-hidden="true">
          {active && (
            <>
              {active.parent && active.parent.parent && <p className="trm-tip-p">{active.parent.path}</p>}
              <p className="trm-tip-n">{active.label}</p>
              <div className="trm-tip-r">
                <span>Value</span>
                <b>{fmtV(active.value)}</b>
              </div>
              <div className="trm-tip-r">
                <span>Share of {active.parent?.label ?? "total"}</span>
                <b>{nfPct.format(share(active))}%</b>
              </div>
              {colorLabel && active.color !== undefined && (
                <div className="trm-tip-r">
                  <span>{colorLabel}</span>
                  <b>{fmtC(active.color)}</b>
                </div>
              )}
              {active.kids.length > 0 && <p className="trm-tip-p" style={{ margin: "4px 0 0" }}>Click to zoom in</p>}
            </>
          )}
        </div>
      </div>

      {colorLabel && hasData && (
        <div className="trm-legend" aria-hidden="true">
          <span>{colorLabel}</span>
          <span>{fmtC(domain[0])}</span>
          <span className="trm-ramp">
            {ramp.map((i) => (
              <i key={i} style={{ "--p": `${10 + i * 12}%` } as React.CSSProperties} />
            ))}
          </span>
          <span>{fmtC(domain[1])}</span>
        </div>
      )}

      <p id="trm-keys" className="trm-sr">
        Arrow keys move between tiles, Enter zooms in, Escape zooms out.
      </p>
      <p className="trm-sr" role="status" aria-live="polite">
        {kbOn && kbId && tree.byId.get(kbId) ? describe(tree.byId.get(kbId)!) : ""}
      </p>
      <div className="trm-sr">
        <table>
          <caption>{`${label}, every node`}</caption>
          <thead>
            <tr>
              <th>Path</th>
              <th>Value</th>
              <th>Share of parent</th>
              {colorLabel && <th>{colorLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {tree.order.map((n) => (
              <tr key={n.id}>
                <th scope="row">{n.path || n.label}</th>
                <td>{fmtV(n.value)}</td>
                <td>{`${nfPct.format(share(n))}%`}</td>
                {colorLabel && <td>{n.color !== undefined ? fmtC(n.color) : ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

/** True when `node` is `ancestorId` itself or sits below it. */
function isInside(node: TNode | undefined, ancestorId: string) {
  for (let n = node ?? null; n; n = n.parent) if (n.id === ancestorId) return true
  return false
}
