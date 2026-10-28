"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** The nine links of the journey, as "from>to". The steps are fixed: visit, sign up or bounce, set up or drop, activate or stall, pay or stay free. */
export type JourneyLinkKey =
  | "visit>signup"
  | "visit>bounce"
  | "signup>onboard"
  | "signup>drop"
  | "onboard>active"
  | "onboard>stall"
  | "active>paid"
  | "active>free"
  | "stall>free"

export type JourneySegment = {
  id: string
  /** Label on the segment switch, for example "Organic". */
  label: string
  /** Users on each link. A step's count is the sum of the links going into it, so the numbers must add up. */
  links: Record<JourneyLinkKey, number>
}

export type JourneyFlowProps = {
  /** One option per channel on the switch. Leave it out for four sample segments (the first is the total). */
  segments?: JourneySegment[]
  /** Heading of the card. */
  title?: string
  /** Text after the visit count in the line under the heading. */
  period?: string
  /** Called when a step is pinned or cleared (null). */
  onSelectStep?: (stepId: string | null) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

type Rates = { visits: number; signup: number; onboard: number; activate: number; pay: number }

function build(r: Rates): Record<JourneyLinkKey, number> {
  const signup = Math.round(r.visits * r.signup)
  const onboard = Math.round(signup * r.onboard)
  const active = Math.round(onboard * r.activate)
  const paid = Math.round(active * r.pay)
  return {
    "visit>signup": signup,
    "visit>bounce": r.visits - signup,
    "signup>onboard": onboard,
    "signup>drop": signup - onboard,
    "onboard>active": active,
    "onboard>stall": onboard - active,
    "active>paid": paid,
    "active>free": active - paid,
    "stall>free": onboard - active,
  }
}

function sum(a: Record<JourneyLinkKey, number>, b: Record<JourneyLinkKey, number>) {
  const out = { ...a }
  for (const k of Object.keys(a) as JourneyLinkKey[]) out[k] = a[k] + b[k]
  return out
}

const ORGANIC = build({ visits: 7400, signup: 0.36, onboard: 0.79, activate: 0.67, pay: 0.36 })
const PAID_ADS = build({ visits: 6200, signup: 0.24, onboard: 0.68, activate: 0.58, pay: 0.28 })
const REFERRAL = build({ visits: 2300, signup: 0.5, onboard: 0.84, activate: 0.72, pay: 0.44 })

const DEFAULT_SEGMENTS: JourneySegment[] = [
  { id: "all", label: "All users", links: sum(sum(ORGANIC, PAID_ADS), REFERRAL) },
  { id: "organic", label: "Organic", links: ORGANIC },
  { id: "paid", label: "Paid ads", links: PAID_ADS },
  { id: "referral", label: "Referral", links: REFERRAL },
]

/* -------------------------------------------------------------------------- */
/*                                   Graph                                    */
/* -------------------------------------------------------------------------- */

const NODES = [
  { id: "visit", label: "Visited", stage: 0, outcome: "Visited" },
  { id: "signup", label: "Signed up", stage: 1, outcome: "Signed up" },
  { id: "bounce", label: "Bounced", stage: 1, outcome: "Bounced after visiting" },
  { id: "onboard", label: "Set up", stage: 2, outcome: "Finished setup" },
  { id: "drop", label: "Dropped", stage: 2, outcome: "Dropped during setup" },
  { id: "active", label: "Activated", stage: 3, outcome: "Activated" },
  { id: "stall", label: "Stalled", stage: 3, outcome: "Stalled in week one" },
  { id: "paid", label: "Paid", stage: 4, outcome: "Paid" },
  { id: "free", label: "Free", stage: 4, outcome: "Stayed free" },
] as const
type NodeId = (typeof NODES)[number]["id"]
const STAGES = ["Visit", "Account", "Setup", "First week", "Plan"]
const LINK_KEYS: JourneyLinkKey[] = ["visit>signup", "visit>bounce", "signup>onboard", "signup>drop", "onboard>active", "onboard>stall", "active>paid", "active>free", "stall>free"]
const NI = Object.fromEntries(NODES.map((n, i) => [n.id, i])) as Record<NodeId, number>
const LINKS = LINK_KEYS.map((k) => {
  const [a, b] = k.split(">") as [NodeId, NodeId]
  return { key: k, from: NI[a], to: NI[b] }
})
/** Every route from the first visit to an end point, as a list of link indexes. */
const PATHS: number[][] = (() => {
  const out: number[][] = []
  const walk = (node: number, acc: number[]) => {
    const next = LINKS.map((l, i) => [l, i] as const).filter(([l]) => l.from === node)
    if (!next.length) out.push(acc)
    for (const [l, i] of next) walk(l.to, [...acc, i])
  }
  walk(0, [])
  return out
})()

const NW = 10
const GAP = 44
const LBL = 40

type Geom = {
  nodes: { x: number; y: number; h: number; value: number }[]
  links: { d: string; thick: number; x0: number; y0: number; x1: number; y1: number; scale: number }[]
  scale: number
}

function nodeValues(v: ArrayLike<number>) {
  const out = new Float64Array(NODES.length)
  LINKS.forEach((l, i) => {
    out[l.to] += v[i]
  })
  let first = 0
  LINKS.forEach((l, i) => {
    if (l.from === 0) first += v[i]
  })
  out[0] = first
  return out
}

function ribbon(x0: number, y0: number, x1: number, y1: number, t: number) {
  const xm = (x0 + x1) / 2
  return `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}L${x1},${y1 + t}C${xm},${y1 + t} ${xm},${y0 + t} ${x0},${y0 + t}Z`
}

function layout(v: ArrayLike<number>, W: number, CH: number): Geom {
  const nv = nodeValues(v)
  const padX = 2
  const colW = (W - padX * 2 - NW) / 4
  const scale = nv[0] > 0 ? (CH - LBL - GAP - 6) / nv[0] : 0
  const stageTop = [LBL, LBL, LBL, LBL, LBL]
  const nodes = NODES.map((n, i) => {
    const h = nv[i] * scale
    const y = stageTop[n.stage]
    stageTop[n.stage] += h + GAP
    return { x: padX + n.stage * colW, y, h, value: nv[i] }
  })
  const outC = new Float64Array(NODES.length)
  const inC = new Float64Array(NODES.length)
  const links = LINKS.map((l, i) => {
    const t = v[i] * scale
    const a = nodes[l.from], b = nodes[l.to]
    const x0 = a.x + NW, y0 = a.y + outC[l.from]
    const x1 = b.x, y1 = b.y + inC[l.to]
    outC[l.from] += t
    inC[l.to] += t
    return { d: ribbon(x0, y0, x1, y1, t), thick: t, x0, y0, x1, y1, scale }
  })
  return { nodes, links, scale }
}

/** Value carried by every route, splitting each step's users in proportion to the links that leave it. */
function pathValues(v: ArrayLike<number>) {
  const outSum = new Float64Array(NODES.length)
  LINKS.forEach((l, i) => {
    outSum[l.from] += v[i]
  })
  const total = nodeValues(v)[0]
  return PATHS.map((p) => p.reduce((acc, li) => acc * (outSum[LINKS[li].from] ? v[li] / outSum[LINKS[li].from] : 0), total))
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.jfl {
  --jfl-rgb: 0 0 0;
  --jfl-surface-rgb: 255 255 255;
  --jfl-accent-rgb: 0 96 226;
  --jfl-ink: rgb(var(--jfl-rgb));
  --jfl-surface: rgb(var(--jfl-surface-rgb));
  --jfl-accent: rgb(var(--jfl-accent-rgb));
  --jfl-good: #2f9a4f;
  --jfl-t1: color-mix(in oklab, var(--jfl-ink) 88%, transparent);
  --jfl-t2: color-mix(in oklab, var(--jfl-ink) 61%, transparent);
  --jfl-t3: color-mix(in oklab, var(--jfl-ink) 45%, transparent);
  --jfl-t4: color-mix(in oklab, var(--jfl-ink) 27%, transparent);
  --jfl-fill: color-mix(in oklab, var(--jfl-ink) 5.5%, transparent);
  --jfl-line: color-mix(in oklab, var(--jfl-ink) 7%, transparent);
  --jfl-band: color-mix(in oklab, var(--jfl-ink) 8%, transparent);
  --jfl-node: color-mix(in oklab, var(--jfl-ink) 84%, transparent);
  --jfl-node-end: color-mix(in oklab, var(--jfl-ink) 42%, transparent);
  --jfl-ring: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --jfl-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .12), 0 2px 6px rgb(0 0 0 / .06);
  --jfl-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 900px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--jfl-surface);
  color: var(--jfl-t1);
  border: 1px solid color-mix(in oklab, var(--jfl-ink) 7.5%, transparent);
  border-radius: 16px;
  font-family: var(--jfl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  overflow: clip;
}
:is(.dark, [data-theme="dark"]) .jfl {
  --jfl-rgb: 255 255 255;
  --jfl-surface-rgb: 28 28 30;
  --jfl-accent-rgb: 77 141 255;
  --jfl-good: #4cc36e;
  --jfl-t1: color-mix(in oklab, var(--jfl-ink) 90%, transparent);
  --jfl-t2: color-mix(in oklab, var(--jfl-ink) 62%, transparent);
  --jfl-t3: color-mix(in oklab, var(--jfl-ink) 46%, transparent);
  --jfl-t4: color-mix(in oklab, var(--jfl-ink) 28%, transparent);
  --jfl-fill: color-mix(in oklab, var(--jfl-ink) 8%, transparent);
  --jfl-line: color-mix(in oklab, var(--jfl-ink) 9%, transparent);
  --jfl-band: color-mix(in oklab, var(--jfl-ink) 11%, transparent);
  --jfl-node: color-mix(in oklab, var(--jfl-ink) 80%, transparent);
  --jfl-node-end: color-mix(in oklab, var(--jfl-ink) 38%, transparent);
  --jfl-ring: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4);
  --jfl-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px rgb(0 0 0 / .5);
}
.jfl *, .jfl *::before, .jfl *::after { box-sizing: border-box }
:where(.jfl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.jfl) :is(h2, h3, p, dl, dd, dt, ul, li, table) { margin: 0; padding: 0 }
:where(.jfl) ul { list-style: none }
.jfl :focus-visible { outline: 2px solid color-mix(in oklab, var(--jfl-accent) 60%, transparent); outline-offset: 1px }
.jfl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.jfl-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.jfl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; padding: 16px 20px 12px }
.jfl-title { font-size: 16px; line-height: 20px; font-weight: 500 }
.jfl-sub { color: var(--jfl-t3); margin-top: 1px; font-size: 13px; max-width: 34ch; text-wrap: pretty }
.jfl-seg { position: relative; display: inline-flex; padding: 3px; gap: 2px; border-radius: 12px; background: var(--jfl-fill) }
.jfl-thumb { position: absolute; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 9px; background: var(--jfl-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .38s var(--jfl-ease), width .38s var(--jfl-ease); pointer-events: none }
:is(.dark, [data-theme="dark"]) .jfl-thumb { background: color-mix(in oklab, var(--jfl-surface) 78%, #fff) }
.jfl-opt { position: relative; height: 30px; padding: 0 11px; border-radius: 9px; font-weight: 500; font-size: 13px; color: var(--jfl-t3); white-space: nowrap; transition: color .2s var(--jfl-ease) }
.jfl-opt[aria-checked="true"] { color: var(--jfl-t1) }

/* ---- chart ---- */
.jfl-chart { position: relative; margin: 0 20px; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.jfl-svg { display: block; width: 100%; overflow: visible }
.jfl-band { fill: var(--jfl-band); cursor: pointer }
.jfl-band[data-good] { fill: color-mix(in oklab, var(--jfl-good) 26%, transparent) }
.jfl-trace { fill: color-mix(in oklab, var(--jfl-accent) 52%, transparent); pointer-events: none }
.jfl-trace[data-good] { fill: color-mix(in oklab, var(--jfl-good) 62%, transparent) }
.jfl-node { fill: var(--jfl-node); cursor: pointer }
.jfl-node[data-end] { fill: var(--jfl-node-end) }
.jfl-node[data-good] { fill: var(--jfl-good) }
.jfl-labels { position: absolute; inset: 0; pointer-events: none }
.jfl-step { position: absolute; left: 0; top: 0; display: block; text-align: left; border-radius: 6px; pointer-events: auto; padding: 0 2px; margin: 0 -2px; white-space: nowrap; will-change: transform }
.jfl-step[data-right] { text-align: right }
.jfl-stepname { display: block; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--jfl-t1) }
.jfl-stepsub { display: block; font-size: 12px; line-height: 16px; color: var(--jfl-t3) }
.jfl-step[aria-pressed="true"] .jfl-stepname { color: var(--jfl-accent) }
.jfl-stages { position: relative; height: 24px; font-size: 12px; line-height: 16px; color: var(--jfl-t3); margin: 6px 20px 0 }
.jfl-stages span { position: absolute; top: 4px }
.jfl-tip { position: absolute; left: 0; top: 0; z-index: 3; width: max-content; max-width: 240px; padding: 8px 10px; border-radius: 12px; background: var(--jfl-surface); box-shadow: var(--jfl-pop); pointer-events: none; opacity: 0; transition: opacity .15s var(--jfl-ease) }
.jfl-tip[data-on] { opacity: 1 }
.jfl-tiphead { font-weight: 500; font-size: 13px; line-height: 18px }
.jfl-tipval { font-size: 16px; line-height: 22px; font-weight: 500; font-variant-numeric: tabular-nums }
.jfl-tipfoot { font-size: 12px; line-height: 16.8px; color: var(--jfl-t3); font-variant-numeric: tabular-nums }

/* ---- detail ---- */
.jfl-detail { border-top: 1px solid var(--jfl-line); padding: 18px 20px 16px; display: grid; gap: 18px 28px; grid-template-columns: minmax(0, 1fr) }
@container (min-width: 860px) { .jfl-detail { grid-template-columns: 280px minmax(0, 1fr) } .jfl-lists { grid-column: 2 } }
.jfl-who { display: flex; flex-direction: column; gap: 3px; min-width: 0 }
.jfl-kicker { font-size: 13px; line-height: 18px; font-weight: 500; animation: jfl-rise .4s var(--jfl-ease) backwards }
.jfl-hint { font-size: 12px; line-height: 16px; color: var(--jfl-t3); margin-bottom: 10px; animation: jfl-rise .4s var(--jfl-ease) .04s backwards }
.jfl-big { font-size: 30px; line-height: 36px; font-weight: 500; letter-spacing: -.02em; display: block }
.jfl-bigsub { font-size: 13px; color: var(--jfl-t2) }
@keyframes jfl-rise { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }
.jfl-lists { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 28px }
.jfl-list h3 { font-size: 12px; line-height: 16px; font-weight: 400; color: var(--jfl-t3); margin-bottom: 4px }
.jfl-li { display: block; padding: 6px 0 7px; animation: jfl-rise .4s var(--jfl-ease) backwards }
.jfl-liTop { display: flex; align-items: baseline; gap: 8px; font-size: 13px; line-height: 18px }
.jfl-liTop b { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.jfl-liTop span { margin-left: auto; font-variant-numeric: tabular-nums; white-space: nowrap }
.jfl-liTop em { font-style: normal; color: var(--jfl-t3); width: 48px; text-align: right; font-variant-numeric: tabular-nums }
.jfl-meter { display: block; height: 2px; border-radius: 9999px; background: var(--jfl-fill); margin-top: 5px; overflow: hidden }
.jfl-meter i { display: block; height: 100%; background: var(--jfl-t1); border-radius: 9999px; transform-origin: left; transition: transform .5s var(--jfl-ease) }
.jfl-empty { font-size: 13px; color: var(--jfl-t3); padding: 6px 0 }
.jfl-foot { border-top: 1px solid var(--jfl-line); padding: 10px 20px 14px }
.jfl-toggle { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px 0 12px; border-radius: 9999px; box-shadow: inset 0 0 0 1px var(--jfl-line); font-size: 13px; font-weight: 500; color: var(--jfl-t2); transition: background-color .2s var(--jfl-ease) }
.jfl-toggle svg { transition: transform .25s var(--jfl-ease) }
.jfl-toggle[aria-expanded="true"] svg { transform: rotate(180deg) }
@media (hover: hover) { .jfl-toggle:hover { background: var(--jfl-fill) } }
.jfl-tablewrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s var(--jfl-ease) }
.jfl-tablewrap[data-open] { grid-template-rows: 1fr }
.jfl-tablewrap > div { overflow: hidden; min-height: 0 }
.jfl-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums }
.jfl-table th { text-align: left; font-weight: 400; color: var(--jfl-t3); padding: 4px 8px 6px 0 }
.jfl-table td { padding: 5px 8px 5px 0; border-top: 1px solid var(--jfl-line) }
.jfl-table th:nth-child(n+3), .jfl-table td:nth-child(n+3) { text-align: right; padding-right: 0 }

@container (max-width: 560px) {
  .jfl-head { padding: 14px 16px 10px }
  .jfl-chart, .jfl-stages { margin-inline: 14px }
  .jfl-seg { width: 100% }
  .jfl-opt { flex: 1; padding: 0 4px }
  .jfl-detail { padding: 16px }
  .jfl-foot { padding: 10px 16px 14px }
  .jfl-lists { grid-template-columns: minmax(0, 1fr) }
  .jfl-big { font-size: 26px; line-height: 32px }
}
@container (max-width: 480px) {
  .jfl-stepname, .jfl-stepsub, .jfl-stages { font-size: 10.5px; line-height: 13px }
  .jfl-pct { display: none }
}

@media (prefers-reduced-motion: reduce) {
  .jfl *, .jfl *::before, .jfl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches
const getReducedServer = () => false

/** A number that eases to its value (never overshooting) and writes its text straight to the DOM. */
function CountTo({ value, format, delay = 90 }: { value: number; format: (n: number) => string; delay?: number }) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const ref = React.useRef<HTMLSpanElement>(null)
  const cur = React.useRef(value)
  const fmt = React.useRef(format)
  React.useEffect(() => {
    fmt.current = format
  })
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt.current(cur.current)
  }, [])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      cur.current = value
      el.textContent = fmt.current(value)
      return
    }
    let raf = 0
    const t0 = performance.now()
    let last = t0
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (now - t0 < delay) {
        raf = requestAnimationFrame(tick)
        return
      }
      const diff = value - cur.current
      if (Math.abs(diff) < 0.0006 * Math.max(1, Math.abs(value))) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 130))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced, delay])
  return (
    <>
      <span ref={ref} className="jfl-num" aria-hidden />
      <span className="jfl-sr">{format(value)}</span>
    </>
  )
}

const int = (n: number) => Math.round(n).toLocaleString("en-US")
const p0 = (n: number) => `${Math.round(n)}%`
const p1 = (n: number) => `${n.toFixed(1)}%`

type Trace = { kind: "node" | "link"; i: number } | null

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function JourneyFlow({
  segments = DEFAULT_SEGMENTS,
  title = "Journeys to a paid plan",
  period = "visits in August, followed from first session to plan",
  onSelectStep,
  className,
}: JourneyFlowProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const [segIdx, setSegIdx] = React.useState(0)
  const seg = segments[Math.min(segIdx, segments.length - 1)]
  const [W, setW] = React.useState(0)
  const [sel, setSel] = React.useState<number | null>(null)
  const [hover, setHover] = React.useState<Trace>(null)
  const [focusNode, setFocusNode] = React.useState(0)
  const [openTable, setOpenTable] = React.useState(false)
  const [note, setNote] = React.useState("")

  const chartRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const segRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLSpanElement>(null)
  const bandRefs = React.useRef<(SVGPathElement | null)[]>([])
  const traceRefs = React.useRef<(SVGPathElement | null)[]>([])
  const nodeRefs = React.useRef<(SVGRectElement | null)[]>([])
  const stepRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const CH = W && W < 520 ? 270 : 330
  const targets = React.useMemo(() => LINK_KEYS.map((k) => seg.links[k] ?? 0), [seg])
  const nodeVal = React.useMemo(() => nodeValues(targets), [targets])
  const visits = nodeVal[0]
  const paid = nodeVal[NI.paid]

  /* animation bag: link values, traced amounts and the dim level, all on springs */
  const A = React.useRef({
    v: Float64Array.from(targets),
    vv: new Float64Array(9),
    vt: Float64Array.from(targets),
    tr: new Float64Array(9),
    trv: new Float64Array(9),
    trt: new Float64Array(9),
    dim: 0,
    dimv: 0,
    dimt: 0,
    W: 0,
    CH: 330,
    reduced,
    raf: 0,
    last: 0,
    wake: (() => {}) as () => void,
    pointer: { x: 0, y: 0, in: false },
    tipX: 0,
    tipY: 0,
    tipInit: false,
  })

  const trace: Trace = hover ?? (sel !== null ? { kind: "node", i: sel } : null)

  /* trace targets from the routes that pass through the hovered or pinned step or link */
  React.useEffect(() => {
    const a = A.current
    a.reduced = reduced
    a.vt = Float64Array.from(targets)
    if (trace) {
      const pv = pathValues(targets)
      a.trt.fill(0)
      PATHS.forEach((p, pi) => {
        const through = trace.kind === "node" ? p.some((li) => LINKS[li].from === trace.i || LINKS[li].to === trace.i) : p.includes(trace.i)
        if (!through) return
        for (const li of p) a.trt[li] += pv[pi]
      })
      a.dimt = 1
    } else {
      a.trt.fill(0)
      a.dimt = 0
    }
    a.wake()
  }, [targets, trace?.kind, trace?.i, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  /* paint all geometry straight to the DOM */
  const paint = React.useCallback(() => {
    const a = A.current
    if (!a.W) return
    const g = layout(a.v, a.W, a.CH)
    const nodeIn = new Float64Array(NODES.length)
    const nodeOut = new Float64Array(NODES.length)
    LINKS.forEach((l, i) => {
      nodeIn[l.to] += a.tr[i]
      nodeOut[l.from] += a.tr[i]
    })
    g.links.forEach((l, i) => {
      const b = bandRefs.current[i]
      if (b) {
        b.setAttribute("d", l.d)
        b.style.opacity = String(1 - 0.72 * a.dim)
      }
      const t = traceRefs.current[i]
      if (t) {
        const th = Math.min(l.thick, a.tr[i] * g.scale)
        t.setAttribute("d", th > 0.05 ? ribbon(l.x0, l.y0, l.x1, l.y1, th) : "")
      }
    })
    g.nodes.forEach((n, i) => {
      const r = nodeRefs.current[i]
      if (r) {
        r.setAttribute("x", String(n.x))
        r.setAttribute("y", String(n.y))
        r.setAttribute("width", String(NW))
        r.setAttribute("height", String(Math.max(2, n.h)))
        const inCohort = Math.max(nodeIn[i], nodeOut[i]) > 0.5
        r.style.opacity = String(inCohort ? 1 : 1 - 0.7 * a.dim)
      }
      const s = stepRefs.current[i]
      if (s) {
        const right = NODES[i].stage === 4
        const x = right ? n.x + NW : n.x
        s.style.transform = `translate(${x}px, ${n.y - 36}px)${right ? " translateX(-100%)" : ""}`
      }
    })
  }, [])

  /* the spring loop: runs only while something is still moving */
  React.useEffect(() => {
    const a = A.current
    const step = (now: number) => {
      a.raf = 0
      const dt = Math.min(0.033, Math.max(0.001, (now - (a.last || now - 16)) / 1000))
      a.last = now
      let moving = false
      const K = 120, C = 2 * Math.sqrt(K) * 1.02
      const tick = (x: Float64Array, v: Float64Array, t: Float64Array, tol: number) => {
        for (let i = 0; i < x.length; i++) {
          if (a.reduced) { x[i] = t[i]; v[i] = 0; continue }
          const f = K * (t[i] - x[i]) - C * v[i]
          v[i] += f * dt
          x[i] += v[i] * dt
          if (Math.abs(t[i] - x[i]) < tol && Math.abs(v[i]) < tol * 4) { x[i] = t[i]; v[i] = 0 } else moving = true
        }
      }
      const scaleTol = Math.max(0.01, nodeValues(a.vt)[0] / 20000)
      tick(a.v, a.vv, a.vt, scaleTol)
      tick(a.tr, a.trv, a.trt, scaleTol)
      const f = 150 * (a.dimt - a.dim) - 2 * Math.sqrt(150) * a.dimv
      if (a.reduced) { a.dim = a.dimt; a.dimv = 0 } else {
        a.dimv += f * dt
        a.dim += a.dimv * dt
        if (Math.abs(a.dimt - a.dim) < 0.003 && Math.abs(a.dimv) < 0.01) { a.dim = a.dimt; a.dimv = 0 } else moving = true
      }
      paint()
      // tooltip follows the pointer on a light spring
      const tip = tipRef.current
      if (tip && tip.dataset.on !== undefined) {
        const w = tip.offsetWidth, h = tip.offsetHeight
        let tx = a.pointer.x + 14, ty = a.pointer.y + 16
        if (tx + w > a.W + 20) tx = a.pointer.x - w - 14
        if (ty + h > a.CH + 10) ty = a.pointer.y - h - 12
        if (!a.tipInit) { a.tipX = tx; a.tipY = ty; a.tipInit = true }
        const k = a.reduced ? 1 : 1 - Math.exp(-dt * 18)
        a.tipX += (tx - a.tipX) * k
        a.tipY += (ty - a.tipY) * k
        tip.style.transform = `translate3d(${a.tipX.toFixed(1)}px, ${a.tipY.toFixed(1)}px, 0)`
        if (Math.abs(tx - a.tipX) > 0.3 || Math.abs(ty - a.tipY) > 0.3) moving = true
      }
      if (moving) a.raf = requestAnimationFrame(step)
      else a.last = 0
    }
    a.wake = () => {
      if (!a.raf) a.raf = requestAnimationFrame(step)
    }
    return () => {
      cancelAnimationFrame(a.raf)
      a.raf = 0
      a.wake = () => {}
    }
  }, [paint])

  /* measure the chart; every width change re-lays the ribbons out rather than scaling them */
  React.useLayoutEffect(() => {
    const el = chartRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useLayoutEffect(() => {
    const a = A.current
    a.W = W
    a.CH = CH
    if (svgRef.current && W) {
      svgRef.current.setAttribute("viewBox", `0 0 ${W} ${CH}`)
      svgRef.current.setAttribute("height", String(CH))
    }
    paint()
  }, [W, CH, paint])

  /* the segment switch pill */
  React.useLayoutEffect(() => {
    const box = segRef.current, thumb = thumbRef.current
    if (!box || !thumb) return
    const place = () => {
      const t = box.querySelector<HTMLElement>('[aria-checked="true"]')
      if (!t) return
      thumb.style.width = `${t.offsetWidth}px`
      thumb.style.transform = `translateX(${t.offsetLeft}px)`
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(box)
    return () => ro.disconnect()
  }, [segIdx])

  const pickSeg = (i: number) => {
    setSegIdx(i)
    const s = segments[i]
    const v = nodeValues(LINK_KEYS.map((k) => s.links[k] ?? 0))
    setNote(`${s.label}: ${int(v[0])} visits and ${int(v[NI.paid])} paid plans`)
  }
  const onSegKey = (e: React.KeyboardEvent) => {
    const n = segments.length
    let i = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") i = (segIdx + 1) % n
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = (segIdx - 1 + n) % n
    else if (e.key === "Home") i = 0
    else if (e.key === "End") i = n - 1
    if (i < 0) return
    e.preventDefault()
    pickSeg(i)
    requestAnimationFrame(() => segRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
  }

  const choose = (i: number | null) => {
    setSel(i)
    onSelectStep?.(i === null ? null : NODES[i].id)
    if (i !== null) setNote(`${NODES[i].label}: ${int(nodeVal[i])} users, ${p0((nodeVal[i] / Math.max(1, visits)) * 100)} of visitors`)
  }

  /* toolbar keys: up and down inside a stage, left and right to the nearest step in the next stage */
  const onStepKey = (e: React.KeyboardEvent, i: number) => {
    const n = NODES[i]
    const inStage = NODES.map((x, k) => [x, k] as const).filter(([x]) => x.stage === n.stage).map(([, k]) => k)
    const near = (stage: number) => {
      const cands = NODES.map((x, k) => [x, k] as const).filter(([x]) => x.stage === stage).map(([, k]) => k)
      if (!cands.length) return i
      const g = layout(A.current.v, A.current.W || 600, A.current.CH)
      const cy = g.nodes[i].y + g.nodes[i].h / 2
      return cands.reduce((best, k) => (Math.abs(g.nodes[k].y + g.nodes[k].h / 2 - cy) < Math.abs(g.nodes[best].y + g.nodes[best].h / 2 - cy) ? k : best), cands[0])
    }
    let to = -1
    if (e.key === "ArrowDown") to = inStage[Math.min(inStage.length - 1, inStage.indexOf(i) + 1)]
    else if (e.key === "ArrowUp") to = inStage[Math.max(0, inStage.indexOf(i) - 1)]
    else if (e.key === "ArrowRight") to = n.stage < 4 ? near(n.stage + 1) : i
    else if (e.key === "ArrowLeft") to = n.stage > 0 ? near(n.stage - 1) : i
    else if (e.key === "Home") to = 0
    else if (e.key === "End") to = NODES.length - 1
    else if (e.key === "Escape") {
      if (sel !== null) { e.preventDefault(); choose(null) }
      return
    }
    if (to < 0) return
    e.preventDefault()
    setFocusNode(to)
    stepRefs.current[to]?.focus()
  }

  /* hover on bands and bars */
  const setTrace = (t: Trace, ev?: React.PointerEvent) => {
    if (ev) {
      const r = chartRef.current?.getBoundingClientRect()
      if (r) A.current.pointer = { x: ev.clientX - r.left, y: ev.clientY - r.top, in: true }
    }
    if (ev?.pointerType === "touch") return
    setHover(t)
    const tip = tipRef.current
    if (tip) {
      if (t) tip.dataset.on = ""
      else { delete tip.dataset.on; A.current.tipInit = false }
    }
    A.current.wake()
  }
  const onChartMove = (ev: React.PointerEvent) => {
    const r = chartRef.current?.getBoundingClientRect()
    if (!r) return
    A.current.pointer = { x: ev.clientX - r.left, y: ev.clientY - r.top, in: true }
    if (tipRef.current?.dataset.on !== undefined) A.current.wake()
  }

  /* ------------------------------ detail panel ------------------------------ */
  const pv = (i: number) => (nodeVal[i] / Math.max(1, visits)) * 100
  const inLinks = sel === null ? [] : LINKS.map((l, i) => ({ l, i })).filter(({ l }) => l.to === sel)
  const outLinks = sel === null ? [] : LINKS.map((l, i) => ({ l, i })).filter(({ l }) => l.from === sel)
  const drops = [
    { label: "Bounced after visiting", n: targets[1], base: nodeVal[NI.visit] },
    { label: "Dropped during setup", n: targets[3], base: nodeVal[NI.signup] },
    { label: "Stalled in week one", n: targets[5], base: nodeVal[NI.onboard] },
  ]
  const lastStage = [
    { label: "Paid", n: targets[6], base: nodeVal[NI.onboard] },
    { label: "Free", n: targets[7] + targets[8], base: nodeVal[NI.onboard] },
  ]
  const tipText = (() => {
    if (!hover) return null
    if (hover.kind === "node") {
      const n = NODES[hover.i]
      return { head: n.label, val: int(nodeVal[hover.i]), foot: `${p1(pv(hover.i))} of visitors` }
    }
    const l = LINKS[hover.i]
    const from = NODES[l.from], to = NODES[l.to]
    const out = LINKS.filter((x) => x.from === l.from).reduce((s, x) => s + targets[LINKS.indexOf(x)], 0)
    return { head: `${from.label} to ${to.label}`, val: int(targets[hover.i]), foot: `${p1((targets[hover.i] / Math.max(1, out)) * 100)} of ${from.label.toLowerCase()} · ${p1((targets[hover.i] / Math.max(1, visits)) * 100)} of visitors` }
  })()

  const stageX = (c: number) => 2 + c * ((W - 4 - NW) / 4)

  return (
    <section className={["jfl", className].filter(Boolean).join(" ")} aria-label={title} onKeyDown={(e) => e.key === "Escape" && sel !== null && choose(null)}>
      <style href="jfl" precedence="default">{CSS}</style>
      <header className="jfl-head">
        <div>
          <h2 className="jfl-title">{title}</h2>
          <p className="jfl-sub">
            <CountTo value={visits} format={int} /> {period}
          </p>
        </div>
        <div ref={segRef} className="jfl-seg" role="radiogroup" aria-label="Channel" onKeyDown={onSegKey}>
          <span ref={thumbRef} className="jfl-thumb" aria-hidden />
          {segments.map((s, i) => (
            <button key={s.id} type="button" role="radio" aria-checked={segIdx === i} tabIndex={segIdx === i ? 0 : -1} className="jfl-opt" onClick={() => pickSeg(i)}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <div
        ref={chartRef}
        className="jfl-chart"
        role="img"
        aria-label={`${seg.label}: ${int(visits)} visits and ${int(paid)} paid plans.`}
        onPointerMove={onChartMove}
        onPointerLeave={() => setTrace(null)}
      >
        <svg ref={svgRef} className="jfl-svg" aria-hidden>
          <g>
            {LINKS.map((l, i) => (
              <path
                key={l.key}
                ref={(el) => { bandRefs.current[i] = el }}
                className="jfl-band"
                data-good={NODES[l.to].id === "paid" ? "" : undefined}
                onPointerEnter={(e) => setTrace({ kind: "link", i }, e)}
              />
            ))}
          </g>
          <g>
            {LINKS.map((l, i) => (
              <path key={l.key} ref={(el) => { traceRefs.current[i] = el }} className="jfl-trace" data-good={NODES[l.to].id === "paid" ? "" : undefined} />
            ))}
          </g>
          <g>
            {NODES.map((n, i) => (
              <rect
                key={n.id}
                ref={(el) => { nodeRefs.current[i] = el }}
                className="jfl-node"
                rx={2}
                data-end={n.id === "bounce" || n.id === "drop" || n.id === "stall" || n.id === "free" ? "" : undefined}
                data-good={n.id === "paid" ? "" : undefined}
                onPointerEnter={(e) => setTrace({ kind: "node", i }, e)}
                onClick={() => choose(sel === i ? null : i)}
              />
            ))}
          </g>
        </svg>
        <div className="jfl-labels" role="toolbar" aria-label="Steps" aria-orientation="horizontal">
          {NODES.map((n, i) => (
            <button
              key={n.id}
              ref={(el) => { stepRefs.current[i] = el }}
              type="button"
              className="jfl-step"
              data-right={n.stage === 4 ? "" : undefined}
              tabIndex={focusNode === i ? 0 : -1}
              aria-pressed={sel === i}
              aria-label={`${n.label}, ${int(nodeVal[i])} users, ${p0(pv(i))} of visitors`}
              onClick={() => choose(sel === i ? null : i)}
              onFocus={() => { setFocusNode(i); setTrace({ kind: "node", i }) }}
              onBlur={() => setTrace(null)}
              onPointerEnter={(e) => setTrace({ kind: "node", i }, e)}
              onKeyDown={(e) => onStepKey(e, i)}
            >
              <span className="jfl-stepname">{n.label}</span>
              <span className="jfl-stepsub">
                <CountTo value={nodeVal[i]} format={int} />
                {i > 0 && (
                  <span className="jfl-pct">
                    {" · "}
                    <CountTo value={pv(i)} format={p0} />
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div ref={tipRef} className="jfl-tip" aria-hidden>
          {tipText && (
            <>
              <div className="jfl-tiphead">{tipText.head}</div>
              <div className="jfl-tipval">{tipText.val}</div>
              <div className="jfl-tipfoot">{tipText.foot}</div>
            </>
          )}
        </div>
      </div>
      <div className="jfl-stages" aria-hidden>
        {STAGES.map((s, c) => (
          <span key={s} style={c === 4 ? { right: 0 } : { left: c === 0 ? 0 : stageX(c) }}>
            {s}
          </span>
        ))}
      </div>

      <div className="jfl-detail" aria-live="off">
        <aside className="jfl-who" aria-label="Step detail" key={sel ?? "all"}>
          <span className="jfl-kicker">{sel === null ? seg.label : NODES[sel].label}</span>
          <span className="jfl-hint">
            {sel === null ? "Select a step to see where its users came from and went next" : `${NODES[sel].outcome}`}
          </span>
          <strong className="jfl-big" style={{ fontWeight: 500 }}>
            <CountTo value={sel === null ? paid : nodeVal[sel]} format={int} />
          </strong>
          <span className="jfl-bigsub">
            {sel === null ? (
              <>
                <CountTo value={(paid / Math.max(1, visits)) * 100} format={p1} /> of visitors started a paid plan
              </>
            ) : (
              <>
                <CountTo value={pv(sel)} format={p1} /> of visitors
              </>
            )}
          </span>
        </aside>
        <div className="jfl-lists">
          {sel === null ? (
            <>
              <div className="jfl-list">
                <h3>Largest drop-offs</h3>
                {drops.map((d, i) => (
                  <Row key={d.label} label={d.label} n={d.n} share={(d.n / Math.max(1, d.base)) * 100} delay={i * 40} />
                ))}
              </div>
              <div className="jfl-list">
                <h3>Plan after setup</h3>
                {lastStage.map((d, i) => (
                  <Row key={d.label} label={d.label} n={d.n} share={(d.n / Math.max(1, d.base)) * 100} delay={i * 40} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="jfl-list">
                <h3>Came from</h3>
                {inLinks.length ? (
                  inLinks.map(({ l, i }, k) => (
                    <Row key={l.key} label={NODES[l.from].label} n={targets[i]} share={(targets[i] / Math.max(1, nodeVal[sel!])) * 100} delay={k * 40} />
                  ))
                ) : (
                  <p className="jfl-empty">First visit, nothing earlier</p>
                )}
              </div>
              <div className="jfl-list">
                <h3>Went next</h3>
                {outLinks.length ? (
                  outLinks.map(({ l, i }, k) => (
                    <Row key={l.key} label={NODES[l.to].label} n={targets[i]} share={(targets[i] / Math.max(1, nodeVal[sel!])) * 100} delay={k * 40} />
                  ))
                ) : (
                  <p className="jfl-empty">This is where the journey ends</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="jfl-foot">
        <button type="button" className="jfl-toggle" aria-expanded={openTable} aria-controls="jfl-table" onClick={() => setOpenTable((o) => !o)}>
          Flow table
          <ChevronDown size={15} strokeWidth={1.75} aria-hidden />
        </button>
        <div id="jfl-table" className="jfl-tablewrap" data-open={openTable ? "" : undefined}>
          <div>
            <table className="jfl-table" aria-label={`${seg.label} flows`}>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Users</th>
                  <th>Of step</th>
                </tr>
              </thead>
              <tbody>
                {LINKS.map((l, i) => {
                  const out = LINKS.filter((x) => x.from === l.from).reduce((s, x) => s + targets[LINKS.indexOf(x)], 0)
                  return (
                    <tr key={l.key}>
                      <td>{NODES[l.from].label}</td>
                      <td>{NODES[l.to].label}</td>
                      <td>{int(targets[i])}</td>
                      <td>{p1((targets[i] / Math.max(1, out)) * 100)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="jfl-sr" role="status" aria-live="polite">
        {note}
      </div>
    </section>
  )
}

function Row({ label, n, share, delay }: { label: string; n: number; share: number; delay: number }) {
  return (
    <span className="jfl-li" style={{ animationDelay: `${delay}ms` }}>
      <span className="jfl-liTop">
        <b>{label}</b>
        <span>
          <CountTo value={n} format={int} />
        </span>
        <em>
          <CountTo value={share} format={p1} />
        </em>
      </span>
      <span className="jfl-meter" aria-hidden>
        <i style={{ transform: `scaleX(${Math.max(0.005, Math.min(1, share / 100))})` }} />
      </span>
    </span>
  )
}

export default JourneyFlow
