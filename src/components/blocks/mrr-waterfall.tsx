"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MrrMovementId = "new" | "expansion" | "reactivation" | "contraction" | "churn"

export type MrrAccountMove = {
  name: string
  /** Dollars of MRR this account added (or removed, for contraction and churn). Always positive. */
  amount: number
  /** Small line under the name, for example "Sep · Enterprise, annual". */
  note: string
}

export type MrrMovement = {
  /** Total dollars of MRR for the movement. Always positive; contraction and churn are subtracted. */
  amount: number
  /** Number of accounts behind it. */
  accounts: number
  /** The biggest accounts. What is left over is shown as "Other accounts". */
  top: MrrAccountMove[]
}

export type MrrPeriod = {
  id: string
  /** Label on the period switch, for example "Q3". */
  label: string
  /** Shown under the title, for example "Jul 1 – Sep 30, 2026". */
  range: string
  /** First day of the range, for the "since" line, for example "Jul 1". */
  since: string
  /** Last day of the range, for the "Ending MRR on" line, for example "Sep 30". */
  until: string
  /** MRR at the start of the range, in dollars. */
  start: number
  /** Accounts at the start of the range. */
  startAccounts: number
  moves: Record<MrrMovementId, MrrMovement>
}

export type MrrWaterfallProps = {
  /** One tab per period. Leave it out for three sample months and their quarter. */
  periods?: MrrPeriod[]
  /** Which period starts selected. Defaults to the last one. */
  defaultPeriod?: string
  /** Heading of the card. */
  title?: string
  /** Prefix of the line under the heading. Defaults to "All plans". */
  scope?: string
  /** Called when a bar is selected. */
  onSelectBar?: (bar: string) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

type Row = [string, number, string]
const mv = (amount: number, accounts: number, top: Row[]): MrrMovement => ({
  amount,
  accounts,
  top: top.map(([name, a, note]) => ({ name, amount: a, note })),
})

const JUL: MrrPeriod = {
  id: "jul", label: "Jul", range: "Jul 1 – Jul 31, 2026", since: "Jul 1", until: "Jul 31", start: 384200, startAccounts: 1102,
  moves: {
    new: mv(17900, 61, [["Cobalt Freight", 4900, "Jul · Enterprise, annual"], ["Juniper Health", 3800, "Jul · Enterprise, annual"], ["Larkspur Capital", 2600, "Jul · Scale, 90 seats"], ["Brightwater Labs", 1700, "Jul · Scale, 55 seats"]]),
    expansion: mv(9800, 44, [["Meridian Logistics", 2400, "Jul · Seats 120 to 190"], ["Alder Analytics", 1600, "Jul · Added agent runs"], ["Kiln Studio", 1100, "Jul · Plan upgrade"]]),
    reactivation: mv(1900, 9, [["Foxglove Media", 700, "Jul · Back after 4 months"], ["Thistle Co", 450, "Jul · Back after 2 months"]]),
    contraction: mv(4100, 21, [["Hollis Retail", 1100, "Jul · Seats 80 to 55"], ["Pinnacle Works", 800, "Jul · Downgrade"]]),
    churn: mv(8300, 38, [["Ironbark Supply", 2200, "Jul · Cancelled, budget"], ["Umber Learning", 1500, "Jul · Cancelled, switched"], ["Willow Pay", 1100, "Jul · Cancelled, paused"]]),
  },
}
const AUG: MrrPeriod = {
  id: "aug", label: "Aug", range: "Aug 1 – Aug 31, 2026", since: "Aug 1", until: "Aug 31", start: 401400, startAccounts: 1134,
  moves: {
    new: mv(21300, 72, [["Granite Cloud", 5600, "Aug · Enterprise, annual"], ["Orchard Care", 4300, "Aug · Enterprise, annual"], ["Yarrow Fintech", 3100, "Aug · Scale, 120 seats"], ["Zephyr Freight", 2000, "Aug · Scale, 70 seats"]]),
    expansion: mv(11200, 47, [["Northwind Data", 2900, "Aug · Seats 150 to 240"], ["Basalt Systems", 1800, "Aug · Plan upgrade"], ["Clover Media", 1200, "Aug · Added agent runs"]]),
    reactivation: mv(2400, 10, [["Dunmore Goods", 900, "Aug · Back after 5 months"], ["Arbor Labs", 600, "Aug · Back after 3 months"]]),
    contraction: mv(4900, 22, [["Verdant Foods", 1300, "Aug · Seats 100 to 70"], ["Quarry Co", 900, "Aug · Downgrade"]]),
    churn: mv(9100, 41, [["Gable Studio", 2500, "Aug · Cancelled, switched"], ["Sable Capital", 1800, "Aug · Cancelled, budget"], ["Nimbus Health", 1200, "Aug · Cancelled, paused"]]),
  },
}
const SEP: MrrPeriod = {
  id: "sep", label: "Sep", range: "Sep 1 – Sep 30, 2026", since: "Sep 1", until: "Sep 30", start: 422300, startAccounts: 1175,
  moves: {
    new: mv(19400, 66, [["Prism Analytics", 5200, "Sep · Enterprise, annual"], ["Redwood Logistics", 3900, "Sep · Enterprise, annual"], ["Mosaic Health", 2700, "Sep · Scale, 100 seats"], ["Evergreen Learning", 1900, "Sep · Scale, 60 seats"]]),
    expansion: mv(12600, 50, [["Halcyon Freight", 3300, "Sep · Seats 200 to 320"], ["Kestrel Pay", 2100, "Sep · Plan upgrade"], ["Aster Studio", 1400, "Sep · Added agent runs"]]),
    reactivation: mv(3100, 13, [["Tidewater Co", 1200, "Sep · Back after 6 months"], ["Fable Games", 700, "Sep · Back after 2 months"]]),
    contraction: mv(5300, 24, [["Harbor Supply", 1500, "Sep · Seats 140 to 100"], ["Cinder Labs", 1000, "Sep · Downgrade"]]),
    churn: mv(9800, 44, [["Quill Media", 2600, "Sep · Cancelled, switched"], ["Summit Retail", 1900, "Sep · Cancelled, budget"], ["Marlow Care", 1300, "Sep · Cancelled, paused"]]),
  },
}

const MOVE_IDS: MrrMovementId[] = ["new", "expansion", "reactivation", "contraction", "churn"]

/** Adds months together into one range. The first period supplies the start; the last the end. */
function quarterOf(id: string, label: string, ps: MrrPeriod[]): MrrPeriod {
  const moves = {} as Record<MrrMovementId, MrrMovement>
  for (const k of MOVE_IDS) {
    const top = ps.flatMap((p) => p.moves[k].top).sort((a, b) => b.amount - a.amount).slice(0, 5)
    moves[k] = {
      amount: ps.reduce((s, p) => s + p.moves[k].amount, 0),
      accounts: ps.reduce((s, p) => s + p.moves[k].accounts, 0),
      top,
    }
  }
  return {
    id, label,
    range: `${ps[0].since} – ${ps[ps.length - 1].until}, 2026`,
    since: ps[0].since,
    until: ps[ps.length - 1].until,
    start: ps[0].start,
    startAccounts: ps[0].startAccounts,
    moves,
  }
}

const DEFAULT_PERIODS: MrrPeriod[] = [JUL, AUG, SEP, quarterOf("q3", "Q3", [JUL, AUG, SEP])]

/* -------------------------------------------------------------------------- */
/*                                   Maths                                    */
/* -------------------------------------------------------------------------- */

const BARS = [
  { id: "start", label: "Start", short: "Start", name: "Starting MRR" },
  { id: "new", label: "New", short: "New", name: "New business" },
  { id: "expansion", label: "Expansion", short: "Expand", name: "Expansion" },
  { id: "reactivation", label: "Reactivation", short: "React.", name: "Reactivation" },
  { id: "contraction", label: "Contraction", short: "Contr.", name: "Contraction" },
  { id: "churn", label: "Churn", short: "Churn", name: "Churn" },
  { id: "end", label: "End", short: "End", name: "Ending MRR" },
] as const

function endOf(p: MrrPeriod) {
  const m = p.moves
  return p.start + m.new.amount + m.expansion.amount + m.reactivation.amount - m.contraction.amount - m.churn.amount
}

/** Bottom and top of every bar, in dollars. */
function levels(p: MrrPeriod): { lo: number[]; hi: number[]; run: number[] } {
  const m = p.moves
  const lo: number[] = [], hi: number[] = [], run: number[] = []
  let cur = p.start
  lo.push(0); hi.push(cur); run.push(cur)
  for (const k of ["new", "expansion", "reactivation"] as const) {
    lo.push(cur); cur += m[k].amount; hi.push(cur); run.push(cur)
  }
  for (const k of ["contraction", "churn"] as const) {
    hi.push(cur); cur -= m[k].amount; lo.push(cur); run.push(cur)
  }
  lo.push(0); hi.push(cur); run.push(cur)
  return { lo, hi, run }
}

function niceStep(raw: number) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw) return m * mag
  return 10 * mag
}

/** Axis range that leaves the start and end bars truncated (the axis does not begin at zero) with a nice step. */
function domain(p: MrrPeriod, pct: boolean) {
  const { lo, hi } = levels(p)
  const real = lo.slice(1, 6).concat(hi.slice(0, 7))
  const mn = Math.min(...real.filter((v) => v > 0)), mx = Math.max(...real)
  const k = pct ? 100 / p.start : 1
  const a = mn * k, b = mx * k
  const span = Math.max(1e-9, b - a)
  const step = niceStep(span / 5.5)
  const d0 = Math.floor((a - span * 0.5) / step) * step
  const d1 = Math.ceil((b + span * 0.14) / step) * step
  return { lo: d0 / k, hi: d1 / k, step: step / k }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mwf {
  --mwf-rgb: 0 0 0;
  --mwf-surface-rgb: 255 255 255;
  --mwf-accent-rgb: 0 96 226;
  --mwf-ink: rgb(var(--mwf-rgb));
  --mwf-surface: rgb(var(--mwf-surface-rgb));
  --mwf-accent: rgb(var(--mwf-accent-rgb));
  --mwf-up: #1f8f44;
  --mwf-down: #c8322b;
  --mwf-total: color-mix(in oklab, var(--mwf-ink) 84%, transparent);
  --mwf-t1: color-mix(in oklab, var(--mwf-ink) 88%, transparent);
  --mwf-t2: color-mix(in oklab, var(--mwf-ink) 61%, transparent);
  --mwf-t3: color-mix(in oklab, var(--mwf-ink) 45%, transparent);
  --mwf-t4: color-mix(in oklab, var(--mwf-ink) 27%, transparent);
  --mwf-fill: color-mix(in oklab, var(--mwf-ink) 5.5%, transparent);
  --mwf-line: color-mix(in oklab, var(--mwf-ink) 7%, transparent);
  --mwf-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .12), 0 2px 6px rgb(0 0 0 / .06);
  --mwf-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 980px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--mwf-surface);
  color: var(--mwf-t1);
  border: 1px solid color-mix(in oklab, var(--mwf-ink) 7.5%, transparent);
  border-radius: 16px;
  font-family: var(--mwf-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  overflow: clip;
}
:is(.dark, [data-theme="dark"]) .mwf {
  --mwf-rgb: 255 255 255;
  --mwf-surface-rgb: 28 28 30;
  --mwf-accent-rgb: 77 141 255;
  --mwf-up: #3fb866;
  --mwf-down: #f0645a;
  --mwf-total: color-mix(in oklab, var(--mwf-ink) 78%, transparent);
  --mwf-t1: color-mix(in oklab, var(--mwf-ink) 90%, transparent);
  --mwf-t2: color-mix(in oklab, var(--mwf-ink) 62%, transparent);
  --mwf-t3: color-mix(in oklab, var(--mwf-ink) 46%, transparent);
  --mwf-t4: color-mix(in oklab, var(--mwf-ink) 28%, transparent);
  --mwf-fill: color-mix(in oklab, var(--mwf-ink) 8%, transparent);
  --mwf-line: color-mix(in oklab, var(--mwf-ink) 9%, transparent);
  --mwf-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px rgb(0 0 0 / .5);
}
.mwf *, .mwf *::before, .mwf *::after { box-sizing: border-box }
:where(.mwf) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.mwf) :is(h2, h3, p, dl, dd, dt, ul, li, table) { margin: 0; padding: 0 }
:where(.mwf) ul { list-style: none }
.mwf :focus-visible { outline: 2px solid color-mix(in oklab, var(--mwf-accent) 60%, transparent); outline-offset: 1px }
.mwf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.mwf-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.mwf-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; padding: 16px 20px 0 }
.mwf-title { font-size: 16px; line-height: 20px; font-weight: 500 }
.mwf-sub { color: var(--mwf-t3); margin-top: 1px; font-size: 13px }
.mwf-rise { animation: mwf-rise .45s var(--mwf-ease) backwards }
@keyframes mwf-rise { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }
.mwf-segs { display: flex; gap: 8px; flex-wrap: wrap }
.mwf-seg { position: relative; display: inline-flex; padding: 3px; gap: 2px; border-radius: 12px; background: var(--mwf-fill) }
.mwf-thumb { position: absolute; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 9px; background: var(--mwf-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .38s var(--mwf-ease), width .38s var(--mwf-ease); pointer-events: none }
:is(.dark, [data-theme="dark"]) .mwf-thumb { background: color-mix(in oklab, var(--mwf-surface) 78%, #fff) }
.mwf-opt { position: relative; height: 30px; padding: 0 11px; border-radius: 9px; font-weight: 500; font-size: 13px; color: var(--mwf-t3); white-space: nowrap; transition: color .2s var(--mwf-ease) }
.mwf-opt[aria-checked="true"] { color: var(--mwf-t1) }

/* ---- summary ---- */
.mwf-sum { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px 28px; flex-wrap: wrap; padding: 18px 20px 4px }
.mwf-label { font-size: 12px; line-height: 16px; color: var(--mwf-t3) }
.mwf-big { display: block; font-size: 30px; line-height: 36px; font-weight: 500; letter-spacing: -.02em }
.mwf-delta { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; line-height: 16px; color: var(--mwf-t3) }
.mwf-delta b { font-weight: 500; color: var(--mwf-up) }
.mwf-delta[data-down] b { color: var(--mwf-down) }
.mwf-kpis { display: flex }
.mwf-kpi { padding: 0 20px; border-left: 1px solid var(--mwf-line) }
.mwf-kpi:first-child { padding-left: 0; border-left: 0 }
.mwf-kpi:last-child { padding-right: 0 }
.mwf-kv { display: block; font-size: 16px; line-height: 22px; font-weight: 500; margin-top: 1px }

/* ---- body ---- */
.mwf-body { display: grid; grid-template-columns: minmax(0, 1fr) }
@container (min-width: 800px) { .mwf-body { grid-template-columns: minmax(0, 1fr) 300px } .mwf-body .mwf-panel { border-top: 0; border-left: 1px solid var(--mwf-line); margin-top: 18px } }
.mwf-chartbox { padding: 6px 20px 8px; min-width: 0 }
.mwf-chart { position: relative; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.mwf-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.mwf-grid { stroke: var(--mwf-line); stroke-width: 1 }
.mwf-base { stroke: var(--mwf-t4); stroke-width: 1 }
.mwf-conn { stroke: var(--mwf-t4); stroke-width: 1; stroke-dasharray: 2 3 }
.mwf-bar { transition: opacity .25s var(--mwf-ease) }
.mwf-bar[data-kind="total"] { fill: var(--mwf-total) }
.mwf-bar[data-kind="up"] { fill: var(--mwf-up) }
.mwf-bar[data-kind="down"] { fill: var(--mwf-down) }
.mwf-break { fill: var(--mwf-surface) }
.mwf-hl { fill: var(--mwf-fill); transition: opacity .2s var(--mwf-ease) }
.mwf-vlabel { font-size: 12px; font-weight: 500; fill: var(--mwf-t1); font-variant-numeric: tabular-nums; text-anchor: middle }
.mwf-vlabel[data-kind="down"] { fill: var(--mwf-t1) }
.mwf-yl { position: absolute; left: 0; font-size: 12px; line-height: 12px; color: var(--mwf-t3); transform: translateY(-50%); font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; width: 40px; text-align: right }
.mwf-slots { position: absolute; display: flex }
.mwf-slot { position: relative; flex: 1 1 0; min-width: 0; height: 100%; border-radius: 6px }
.mwf-cats { position: absolute; display: flex; pointer-events: none }
.mwf-cat { flex: 1 1 0; min-width: 0; text-align: center; font-size: 11.5px; letter-spacing: -.005em; line-height: 16px; color: var(--mwf-t3); white-space: nowrap; overflow: hidden; text-overflow: clip; transition: color .2s var(--mwf-ease) }
.mwf-cat-short { display: none }
.mwf-cat[data-on] { color: var(--mwf-t1); font-weight: 500 }
.mwf-tip { position: absolute; left: 0; top: 0; z-index: 3; width: max-content; max-width: 220px; padding: 8px 10px; border-radius: 12px; background: var(--mwf-surface); box-shadow: var(--mwf-pop); pointer-events: none; opacity: 0; transition: opacity .15s var(--mwf-ease) }
.mwf-tip[data-on] { opacity: 1 }
.mwf-tiphead { font-weight: 500; font-size: 13px; line-height: 18px }
.mwf-tipval { font-size: 16px; line-height: 22px; font-weight: 500; font-variant-numeric: tabular-nums }
.mwf-tipfoot { font-size: 12px; line-height: 16.8px; color: var(--mwf-t3); font-variant-numeric: tabular-nums }

/* ---- panel ---- */
.mwf-panel { border-top: 1px solid var(--mwf-line); padding: 14px 20px 18px; min-width: 0 }
.mwf-phead { display: flex; align-items: baseline; gap: 8px }
.mwf-pdot { width: 8px; height: 8px; border-radius: 2px; background: var(--c); flex: none; align-self: center }
.mwf-pname { font-size: 13px; line-height: 20px; font-weight: 500 }
.mwf-pamt { margin-left: auto; font-size: 13px; line-height: 20px; font-weight: 500; font-variant-numeric: tabular-nums }
.mwf-psub { font-size: 12px; line-height: 16px; color: var(--mwf-t3); margin: 1px 0 6px 16px }
.mwf-list { display: flex; flex-direction: column }
.mwf-acct { display: block; padding: 7px 0 8px; border-top: 1px solid var(--mwf-line); animation: mwf-rise .4s var(--mwf-ease) backwards }
.mwf-atop { display: flex; align-items: baseline; gap: 8px }
.mwf-aname { font-size: 13px; line-height: 18px; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mwf-aamt { margin-left: auto; font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; white-space: nowrap }
.mwf-anote { display: block; font-size: 12px; line-height: 16px; color: var(--mwf-t3) }
.mwf-meter { display: block; height: 2px; border-radius: 9999px; background: var(--mwf-fill); margin-top: 6px; overflow: hidden }
.mwf-meter i { display: block; height: 100%; width: 100%; transform-origin: left; background: var(--c); border-radius: 9999px; animation: mwf-grow .6s var(--mwf-ease) backwards }
@keyframes mwf-grow { from { transform: scaleX(0) } }
.mwf-hint { font-size: 12px; color: var(--mwf-t3); margin-top: 10px }

@container (max-width: 560px) {
  .mwf-head { padding: 14px 16px 0 }
  .mwf-sum { padding: 16px 16px 2px }
  .mwf-chartbox { padding: 6px 12px 8px }
  .mwf-panel { padding: 12px 16px 16px }
  .mwf-segs { width: 100%; flex-wrap: nowrap }
  .mwf-segs > .mwf-seg:first-child { flex: 1 }
  .mwf-segs > .mwf-seg:first-child .mwf-opt { flex: 1 }
  .mwf-opt { padding: 0 8px }
  .mwf-vlabel { font-size: 10.5px }
  .mwf-cat-full { display: none }
  .mwf-cat-short { display: inline !important }
  .mwf-kpis { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr) }
  .mwf-kpi { padding: 0 10px }
  .mwf-kpi:first-child { padding-left: 0 }
  .mwf-kv { font-size: 14px }
  .mwf-big { font-size: 26px; line-height: 32px }
  .mwf-cat { font-size: 10px; letter-spacing: -.01em }
}

@media (prefers-reduced-motion: reduce) {
  .mwf *, .mwf *::before, .mwf *::after { animation: none !important; transition: none !important }
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

/** A number that eases to its value and writes its text straight to the DOM (no React render per frame). */
function CountTo({ value, format }: { value: number; format: (n: number) => string }) {
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
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const diff = value - cur.current
      if (Math.abs(diff) < 0.0004 * Math.max(1, Math.abs(value))) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 120))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return (
    <>
      <span ref={ref} className="mwf-num" aria-hidden />
      <span className="mwf-sr">{format(value)}</span>
    </>
  )
}

function Seg<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const box = React.useRef<HTMLDivElement>(null)
  const thumb = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const b = box.current, t = thumb.current
    if (!b || !t) return
    const place = () => {
      const on = b.querySelector<HTMLElement>('[aria-checked="true"]')
      if (!on) return
      t.style.width = `${on.offsetWidth}px`
      t.style.transform = `translateX(${on.offsetLeft}px)`
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(b)
    return () => ro.disconnect()
  }, [value])
  const onKey = (e: React.KeyboardEvent) => {
    const i = options.findIndex((o) => o.id === value)
    let n = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % options.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + options.length) % options.length
    if (n < 0) return
    e.preventDefault()
    onChange(options[n].id)
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
  }
  return (
    <div ref={box} className="mwf-seg" role="radiogroup" aria-label={label} onKeyDown={onKey}>
      <span ref={thumb} className="mwf-thumb" aria-hidden />
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} tabIndex={value === o.id ? 0 : -1} className="mwf-opt" onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`
const signed = (n: number, sign: 1 | -1) => `${sign > 0 ? "+" : "−"}${usd(n)}`
const kfmt = (n: number, compact = false) => `$${(n / 1000).toFixed(compact && n >= 10000 ? 0 : 1)}k`
const axisK = (n: number) => `$${+(n / 1000).toFixed(1)}k`
const pctFmt = (n: number, d = 1) => `${n.toFixed(d)}%`

const M = { top: 26, bottom: 28, left: 44, right: 4 }
const NB = BARS.length
const NTICK = 10

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function MrrWaterfall({
  periods = DEFAULT_PERIODS,
  defaultPeriod,
  title = "MRR movement",
  scope = "All plans",
  onSelectBar,
  className,
}: MrrWaterfallProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const [pid, setPid] = React.useState(defaultPeriod ?? periods[periods.length - 1].id)
  const [unit, setUnit] = React.useState<"usd" | "pct">("usd")
  const [sel, setSel] = React.useState(1)
  const [hover, setHover] = React.useState<number | null>(null)
  const [W, setW] = React.useState(0)
  const [note, setNote] = React.useState("")

  const period = periods.find((p) => p.id === pid) ?? periods[periods.length - 1]
  const pct = unit === "pct"
  const lv = React.useMemo(() => levels(period), [period])
  const dom = React.useMemo(() => domain(period, pct), [period, pct])
  const end = endOf(period)
  const m = period.moves

  const chartRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const barRefs = React.useRef<(SVGRectElement | null)[]>([])
  const hlRefs = React.useRef<(SVGRectElement | null)[]>([])
  const labelRefs = React.useRef<(SVGTextElement | null)[]>([])
  const breakRefs = React.useRef<(SVGPathElement | null)[]>([])
  const connRefs = React.useRef<(SVGLineElement | null)[]>([])
  const gridRefs = React.useRef<(SVGLineElement | null)[]>([])
  const yRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const slotRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const CH = W && W < 520 ? 250 : 320

  /* targets: [lo, hi, step, ...bottoms(7), ...tops(7)] */
  const target = React.useMemo(() => {
    const t = new Float64Array(3 + NB * 2)
    t[0] = dom.lo; t[1] = dom.hi; t[2] = dom.step
    for (let i = 0; i < NB; i++) { t[3 + i] = i === 0 || i === NB - 1 ? dom.lo : lv.lo[i]; t[3 + NB + i] = lv.hi[i] }
    return t
  }, [dom, lv])

  /* on first mount the bars grow out of the starting level */
  const initX = new Float64Array(target)
  for (let i = 1; i < NB - 1; i++) { initX[3 + i] = period.start; initX[3 + NB + i] = period.start }
  const A = React.useRef({
    x: initX,
    v: new Float64Array(3 + NB * 2),
    t: target,
    W: 0,
    CH: 300,
    pct,
    start: period.start,
    sel: 1,
    reduced,
    raf: 0,
    last: 0,
    init: false,
    wake: (() => {}) as () => void,
    pointer: { x: 0, y: 0 },
    tipX: 0,
    tipY: 0,
    tipInit: false,
    run: lv.run,
  })

  React.useEffect(() => {
    const a = A.current
    a.t = target
    a.pct = pct
    a.start = period.start
    a.sel = sel
    a.reduced = reduced
    a.run = lv.run
    a.wake()
  }, [target, pct, period.start, sel, reduced, lv])

  const paint = React.useCallback(() => {
    const a = A.current
    if (!a.W) return
    const x = a.x
    const lo = x[0], hi = x[1], step = x[2]
    const plotW = a.W - M.left - M.right
    const ph = a.CH - M.top - M.bottom
    const yOf = (v: number) => M.top + ((hi - v) / (hi - lo || 1)) * ph
    const slot = plotW / NB
    const bw = Math.min(46, slot * 0.6)
    const cx = (i: number) => M.left + slot * (i + 0.5)
    const k = a.pct ? 100 / a.start : 1
    // ticks
    const count = (a.t[1] - a.t[0]) / (a.t[2] || 1) + 1
    for (let i = 0; i < NTICK; i++) {
      const v = lo + i * step
      const y = yOf(v)
      const o = Math.max(0, Math.min(1, count - i + 0.0001)) * (v <= hi + step * 0.01 ? 1 : 0)
      const g = gridRefs.current[i]
      if (g) {
        g.setAttribute("y1", String(y)); g.setAttribute("y2", String(y))
        g.style.opacity = String(o)
        g.setAttribute("class", i === 0 ? "mwf-base" : "mwf-grid")
      }
      const l = yRefs.current[i]
      if (l) {
        l.style.top = `${y}px`
        l.style.opacity = String(o)
        const txt = a.pct ? pctFmt(v * k, step * k < 2 ? 1 : 0) : axisK(v)
        if (l.textContent !== txt) l.textContent = txt
      }
    }
    // bars
    for (let i = 0; i < NB; i++) {
      const b0 = x[3 + i], b1 = x[3 + NB + i]
      const yTop = yOf(Math.max(b0, b1)), yBot = yOf(Math.min(b0, b1))
      const r = barRefs.current[i]
      if (r) {
        r.setAttribute("x", String(cx(i) - bw / 2))
        r.setAttribute("width", String(bw))
        r.setAttribute("y", String(yTop))
        r.setAttribute("height", String(Math.max(1.5, yBot - yTop)))
      }
      const h = hlRefs.current[i]
      if (h) {
        h.setAttribute("x", String(M.left + slot * i + 3))
        h.setAttribute("width", String(slot - 6))
        h.setAttribute("y", String(M.top - 14))
        h.setAttribute("height", String(ph + 14))
      }
      const t = labelRefs.current[i]
      if (t) {
        t.setAttribute("x", String(cx(i)))
        t.setAttribute("y", String(yTop - 7))
        const delta = b1 - b0
        const first = i === 0 || i === NB - 1
        const sign = i >= 4 && i <= 5 ? -1 : 1
        const txt = first ? (a.pct ? pctFmt((b1 * k), 1) : kfmt(b1, a.W < 440)) : a.pct ? `${sign > 0 ? "+" : "−"}${pctFmt(Math.abs(delta) * k, 1)}` : `${sign > 0 ? "+" : "−"}${kfmt(Math.abs(delta), a.W < 440)}`
        if (t.textContent !== txt) t.textContent = txt
      }
      if (i === 0 || i === NB - 1) {
        const p = breakRefs.current[i === 0 ? 0 : 1]
        if (p) {
          const by = yOf(lo) - 12
          const x0 = cx(i) - bw / 2 - 3, x1 = cx(i) + bw / 2 + 3
          p.setAttribute("d", `M${x0},${by + 3} L${x1},${by - 3} L${x1},${by + 1} L${x0},${by + 7} Z`)
          p.style.opacity = by > yTop + 6 ? "1" : "0"
        }
      }
    }
    // connectors from each bar's running level to the next bar
    for (let i = 0; i < NB - 1; i++) {
      const lvl = i === 0 ? x[3 + NB + 0] : i >= 4 ? x[3 + i] : x[3 + NB + i]
      const c = connRefs.current[i]
      if (c) {
        const yy = yOf(lvl)
        c.setAttribute("x1", String(cx(i) + bw / 2))
        c.setAttribute("x2", String(cx(i + 1) - bw / 2))
        c.setAttribute("y1", String(yy))
        c.setAttribute("y2", String(yy))
      }
    }
  }, [])

  React.useEffect(() => {
    const a = A.current
    const step = (now: number) => {
      a.raf = 0
      const dt = Math.min(0.033, Math.max(0.001, (now - (a.last || now - 16)) / 1000))
      a.last = now
      let moving = false
      const K = 150, C = 2 * Math.sqrt(K) * 0.92
      for (let i = 0; i < a.x.length; i++) {
        if (a.reduced) { a.x[i] = a.t[i]; a.v[i] = 0; continue }
        const f = K * (a.t[i] - a.x[i]) - C * a.v[i]
        a.v[i] += f * dt
        a.x[i] += a.v[i] * dt
        const tol = Math.max(0.0005 * Math.abs(a.t[1] - a.t[0]), 0.01)
        if (Math.abs(a.t[i] - a.x[i]) < tol && Math.abs(a.v[i]) < tol * 8) { a.x[i] = a.t[i]; a.v[i] = 0 } else moving = true
      }
      paint()
      const tip = tipRef.current
      if (tip && tip.dataset.on !== undefined) {
        const w = tip.offsetWidth, h = tip.offsetHeight
        let tx = a.pointer.x + 14, ty = a.pointer.y + 14
        if (tx + w > a.W) tx = a.pointer.x - w - 14
        if (ty + h > a.CH) ty = a.pointer.y - h - 12
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
    a.wake()
    return () => {
      cancelAnimationFrame(a.raf)
      a.raf = 0
      a.wake = () => {}
    }
  }, [paint])

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
    paint()
    a.wake()
  }, [W, CH, paint])

  /* --------------------------------- actions -------------------------------- */
  const choose = (i: number, fromKey = false) => {
    setSel(i)
    onSelectBar?.(BARS[i].id)
    const amt = barAmount(i)
    setNote(`${BARS[i].name}, ${amt}`)
    if (fromKey) slotRefs.current[i]?.focus()
  }
  const barAmount = (i: number) => {
    if (i === 0) return usd(period.start)
    if (i === NB - 1) return usd(end)
    const id = MOVE_IDS[i - 1]
    return signed(m[id].amount, i >= 4 ? -1 : 1)
  }
  const onSlotKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % NB
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + NB) % NB
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = NB - 1
    if (n < 0) return
    e.preventDefault()
    choose(n, true)
  }
  const onMove = (e: React.PointerEvent) => {
    const r = chartRef.current?.getBoundingClientRect()
    if (!r) return
    A.current.pointer = { x: e.clientX - r.left, y: e.clientY - r.top }
    if (hover !== null) A.current.wake()
  }
  const setHov = (i: number | null, e?: React.PointerEvent) => {
    if (e && e.pointerType !== "mouse") return
    setHover(i)
    const tip = tipRef.current
    if (tip) {
      if (i !== null) tip.dataset.on = ""
      else { delete tip.dataset.on; A.current.tipInit = false }
    }
    A.current.wake()
  }

  /* --------------------------------- derived -------------------------------- */
  const nrr = ((period.start + m.expansion.amount - m.contraction.amount - m.churn.amount) / period.start) * 100
  const quick = (m.new.amount + m.expansion.amount + m.reactivation.amount) / Math.max(1, m.contraction.amount + m.churn.amount)
  const logo = (m.churn.accounts / Math.max(1, period.startAccounts)) * 100
  const net = end - period.start
  const netPct = (net / period.start) * 100
  const bar = BARS[sel]
  const isMove = sel > 0 && sel < NB - 1
  const mid = isMove ? m[MOVE_IDS[sel - 1]] : null
  const negative = sel === 4 || sel === 5
  const color = sel === 0 || sel === NB - 1 ? "var(--mwf-total)" : negative ? "var(--mwf-down)" : "var(--mwf-up)"
  const listed = mid ? mid.top.reduce((s, a) => s + a.amount, 0) : 0
  const listedN = mid ? mid.top.length : 0
  const accountsWord = (id: MrrMovementId, n: number) =>
    id === "new" ? `${n.toLocaleString("en-US")} new accounts` : id === "churn" ? `${n.toLocaleString("en-US")} churned accounts` : id === "reactivation" ? `${n.toLocaleString("en-US")} returning accounts` : `${n.toLocaleString("en-US")} accounts`
  const hoverTip = hover !== null ? { name: BARS[hover].name, amt: barAmount(hover), share: hover === 0 ? 100 : hover === NB - 1 ? (end / period.start) * 100 : (m[MOVE_IDS[hover - 1]].amount / period.start) * 100, n: hover === 0 ? period.startAccounts : hover === NB - 1 ? period.startAccounts + m.new.accounts + m.reactivation.accounts - m.churn.accounts : m[MOVE_IDS[hover - 1]].accounts } : null

  return (
    <section className={["mwf", className].filter(Boolean).join(" ")} aria-label={title}>
      <style href="mwf" precedence="default">{CSS}</style>
      <header className="mwf-head">
        <div>
          <h2 className="mwf-title">{title}</h2>
          <p className="mwf-sub mwf-rise" key={period.id}>
            {scope} · {period.range}
          </p>
        </div>
        <div className="mwf-segs">
          <Seg options={periods.map((p) => ({ id: p.id, label: p.label }))} value={period.id} onChange={(v) => { setPid(v); setNote(`Showing ${periods.find((p) => p.id === v)?.range}`) }} label="Period" />
          <Seg options={[{ id: "usd" as const, label: "USD" }, { id: "pct" as const, label: "% of start" }]} value={unit} onChange={setUnit} label="Unit" />
        </div>
      </header>

      <div className="mwf-sum">
        <div>
          <span className="mwf-label mwf-rise" key={period.until}>
            Ending MRR on {period.until}
          </span>
          <strong className="mwf-big" style={{ fontWeight: 500 }}>
            <CountTo value={end} format={usd} />
          </strong>
          <span className="mwf-delta" data-down={net < 0 ? "" : undefined}>
            {net >= 0 ? <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden /> : <ArrowDownRight size={13} strokeWidth={1.75} aria-hidden />}
            <b>
              <CountTo value={net} format={(n) => `${n >= 0 ? "+" : "−"}${usd(Math.abs(n))}`} />
            </b>
            <b>
              <CountTo value={netPct} format={(n) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`} />
            </b>
            since {period.since}
          </span>
        </div>
        <dl className="mwf-kpis">
          <div className="mwf-kpi">
            <dt className="mwf-label">Net revenue retention</dt>
            <dd className="mwf-kv">
              <CountTo value={nrr} format={(n) => `${n.toFixed(1)}%`} />
            </dd>
          </div>
          <div className="mwf-kpi">
            <dt className="mwf-label">Quick ratio</dt>
            <dd className="mwf-kv">
              <CountTo value={quick} format={(n) => n.toFixed(2)} />
            </dd>
          </div>
          <div className="mwf-kpi">
            <dt className="mwf-label">Logo churn</dt>
            <dd className="mwf-kv">
              <CountTo value={logo} format={(n) => `${n.toFixed(1)}%`} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mwf-body">
        <div className="mwf-chartbox">
          <div
            ref={chartRef}
            className="mwf-chart"
            style={{ height: CH }}
            onPointerMove={onMove}
            onPointerLeave={() => setHov(null)}
          >
            <svg ref={svgRef} className="mwf-svg" role="img" aria-label={`MRR bridge, ${period.range}: starts at ${usd(period.start)}, ends at ${usd(end)}.`}>
              {Array.from({ length: NTICK }, (_, i) => (
                <line key={i} ref={(el) => { gridRefs.current[i] = el }} x1={M.left} x2={Math.max(M.left, W - M.right)} className="mwf-grid" />
              ))}
              {BARS.map((b, i) => (
                <rect key={b.id} ref={(el) => { hlRefs.current[i] = el }} className="mwf-hl" rx={8} style={{ opacity: sel === i ? 1 : 0 }} />
              ))}
              {Array.from({ length: NB - 1 }, (_, i) => (
                <line key={i} ref={(el) => { connRefs.current[i] = el }} className="mwf-conn" />
              ))}
              {BARS.map((b, i) => (
                <rect
                  key={b.id}
                  ref={(el) => { barRefs.current[i] = el }}
                  className="mwf-bar"
                  rx={4}
                  data-kind={i === 0 || i === NB - 1 ? "total" : i >= 4 ? "down" : "up"}
                  style={{ opacity: hover !== null && hover !== i ? 0.5 : 1 }}
                />
              ))}
              {[0, 1].map((i) => (
                <path key={i} ref={(el) => { breakRefs.current[i] = el }} className="mwf-break" />
              ))}
              {BARS.map((b, i) => (
                <text key={b.id} ref={(el) => { labelRefs.current[i] = el }} className="mwf-vlabel" />
              ))}
            </svg>
            {Array.from({ length: NTICK }, (_, i) => (
              <span key={i} ref={(el) => { yRefs.current[i] = el }} className="mwf-yl" aria-hidden />
            ))}
            <div className="mwf-cats" style={{ left: M.left, right: M.right, bottom: 4, top: CH - M.bottom + 6 }} aria-hidden>
              {BARS.map((b, i) => (
                <span key={b.id} className="mwf-cat" data-on={sel === i ? "" : undefined}>
                  <span className="mwf-cat-full">{b.label}</span>
                  <span className="mwf-cat-short">{b.short}</span>
                </span>
              ))}
            </div>
            <div className="mwf-slots" role="radiogroup" aria-label="MRR movements" style={{ left: M.left, right: M.right, top: 0, bottom: 0 }}>
              {BARS.map((b, i) => (
                <button
                  key={b.id}
                  ref={(el) => { slotRefs.current[i] = el }}
                  type="button"
                  role="radio"
                  className="mwf-slot"
                  aria-checked={sel === i}
                  tabIndex={sel === i ? 0 : -1}
                  aria-label={`${b.name}, ${barAmount(i)}${i > 0 && i < NB - 1 ? `, ${m[MOVE_IDS[i - 1]].accounts} accounts` : ""}`}
                  onClick={() => choose(i)}
                  onKeyDown={(e) => onSlotKey(e, i)}
                  onPointerEnter={(e) => setHov(i, e)}
                />
              ))}
            </div>
            <div ref={tipRef} className="mwf-tip" aria-hidden style={{ left: 0 }}>
              {hoverTip && (
                <>
                  <div className="mwf-tiphead">{hoverTip.name}</div>
                  <div className="mwf-tipval">{hoverTip.amt}</div>
                  <div className="mwf-tipfoot">
                    {hoverTip.share.toFixed(1)}% of starting MRR · {hoverTip.n.toLocaleString("en-US")} accounts
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="mwf-panel" aria-label={bar.name}>
          <div key={`${period.id}-${bar.id}`}>
            <div className="mwf-phead">
              <span className="mwf-pdot" style={{ "--c": color } as React.CSSProperties} />
              <span className="mwf-pname">{bar.name}</span>
              <span className="mwf-pamt">
                <CountTo
                  value={sel === 0 ? period.start : sel === NB - 1 ? end : mid!.amount}
                  format={(n) => (isMove ? `${negative ? "−" : "+"}${usd(n)}` : usd(n))}
                />
              </span>
            </div>
            <p className="mwf-psub">
              {isMove
                ? accountsWord(MOVE_IDS[sel - 1], mid!.accounts)
                : sel === 0
                  ? `${period.startAccounts.toLocaleString("en-US")} accounts on ${period.since}`
                  : `Net ${net >= 0 ? "+" : "−"}${usd(Math.abs(net))} over the range`}
            </p>
            <ul className="mwf-list">
              {isMove ? (
                <>
                  {mid!.top.map((a, i) => (
                    <li key={a.name} className="mwf-acct" style={{ animationDelay: `${i * 35}ms` }}>
                      <span className="mwf-atop">
                        <span className="mwf-aname">{a.name}</span>
                        <span className="mwf-aamt">{signed(a.amount, negative ? -1 : 1)}</span>
                      </span>
                      <span className="mwf-anote">{a.note}</span>
                      <span className="mwf-meter" aria-hidden>
                        <i style={{ "--c": color, transform: `scaleX(${Math.min(1, a.amount / Math.max(1, mid!.top[0].amount))})`, animationDelay: `${i * 35}ms` } as React.CSSProperties} />
                      </span>
                    </li>
                  ))}
                  {mid!.accounts > listedN && (
                    <li className="mwf-acct" style={{ animationDelay: `${listedN * 35}ms` }}>
                      <span className="mwf-atop">
                        <span className="mwf-aname">Other accounts</span>
                        <span className="mwf-aamt">{signed(Math.max(0, mid!.amount - listed), negative ? -1 : 1)}</span>
                      </span>
                      <span className="mwf-anote">{(mid!.accounts - listedN).toLocaleString("en-US")} accounts</span>
                    </li>
                  )}
                </>
              ) : (
                MOVE_IDS.map((id, i) => (
                  <li key={id} className="mwf-acct" style={{ animationDelay: `${i * 35}ms` }}>
                    <span className="mwf-atop">
                      <span className="mwf-aname">{BARS[i + 1].name}</span>
                      <span className="mwf-aamt">{signed(m[id].amount, i >= 3 ? -1 : 1)}</span>
                    </span>
                    <span className="mwf-anote">{((m[id].amount / period.start) * 100).toFixed(1)}% of starting MRR</span>
                    <span className="mwf-meter" aria-hidden>
                      <i style={{ "--c": i >= 3 ? "var(--mwf-down)" : "var(--mwf-up)", transform: `scaleX(${Math.min(1, m[id].amount / Math.max(...MOVE_IDS.map((k) => m[k].amount)))})`, animationDelay: `${i * 35}ms` } as React.CSSProperties} />
                    </span>
                  </li>
                ))
              )}
            </ul>
            <p className="mwf-hint">Select a bar or use the arrow keys to see its accounts</p>
          </div>
        </aside>
      </div>

      <div className="mwf-sr" role="status" aria-live="polite">
        {note}
      </div>
      <table className="mwf-sr">
        <caption>
          MRR movement, {period.range}
        </caption>
        <thead>
          <tr>
            <th>Movement</th>
            <th>Amount</th>
            <th>Share of starting MRR</th>
            <th>Accounts</th>
          </tr>
        </thead>
        <tbody>
          {BARS.map((b, i) => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{barAmount(i)}</td>
              <td>{(((i === 0 ? period.start : i === NB - 1 ? end : m[MOVE_IDS[i - 1]].amount) / period.start) * 100).toFixed(1)}%</td>
              <td>{i === 0 ? period.startAccounts : i === NB - 1 ? "" : m[MOVE_IDS[i - 1]].accounts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default MrrWaterfall
