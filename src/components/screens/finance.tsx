"use client"

import * as React from "react"
import { BookOpenText, ChevronDown, Download, FlaskConical, Landmark, LayoutDashboard, ListChecks, Menu, PenLine, Radar, Search, Wallet, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FinanceProps = {
  /** Called with the nav label when any item in the left rail is clicked. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user row. */
  sideTools?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
/** Chart index 0..24 -> calendar month. Index 12 is today (Oct 2026). */
const monthOf = (i: number) => {
  const n = 9 + (i - 12)
  return { m: ((n % 12) + 12) % 12, y: 2026 + Math.floor(n / 12) }
}
const monLabel = (i: number) => {
  const { m, y } = monthOf(Math.round(i))
  return `${MON[m]} ${y}`
}
const sep = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
/** £k number -> "£126k" */
const fk = (v: number) => `${v < 0 ? "−" : ""}£${sep(Math.abs(v))}k`
const fm = (v: number) => `${v < 0 ? "−" : ""}£${(Math.abs(v) / 1000).toFixed(2)}M`
const gbp = (n: number) => `£${sep(Math.floor(n))}.${String(Math.round((n % 1) * 100)).padStart(2, "0")}`

function useMatch(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function useWidth(initial = 720) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(initial)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((es) => setW(Math.max(200, Math.round(es[0].contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Ease out with a ~1% overshoot and return: the "settle". */
const settle = (p: number) => {
  const c1 = 0.55
  const t = p - 1
  return 1 + (c1 + 1) * t * t * t + c1 * t * t
}

/** Tween a vector of numbers toward `target` whenever it changes. Starts at the final value, so nothing depends on rAF to be visible. */
function useTween(target: number[], opts: { dur?: number; fromZero?: boolean } = {}) {
  const { dur = 650, fromZero = false } = opts
  const reduced = useMatch("(prefers-reduced-motion: reduce)")
  const [val, setVal] = React.useState(target)
  const cur = React.useRef(fromZero ? target.map(() => 0) : target)
  const key = target.join("|")
  React.useEffect(() => {
    const to = target
    const from = cur.current
    if (reduced) {
      cur.current = to
      return
    }
    if (from.length === to.length && from.every((f, i) => f === to[i])) return
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = clamp((now - t0) / dur, 0, 1)
      const e = settle(p)
      const nx = from.map((f, i) => f + (to[i] - f) * e)
      cur.current = nx
      setVal(nx)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const fb = setTimeout(() => {
      cur.current = to
      setVal(to)
    }, dur + 150)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fb)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced, dur])
  return reduced ? target : val
}

/** Agent-written text: steady pace with a block caret. Remount with `key` to retype. */
function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const reduced = useMatch("(prefers-reduced-motion: reduce)")
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setN((c) => (c >= text.length ? c : c + 1)), speed)
    const fb = setTimeout(() => setN(text.length), text.length * speed + 500)
    return () => {
      clearInterval(id)
      clearTimeout(fb)
    }
  }, [text, reduced, speed])
  const shown = reduced ? text.length : n
  return (
    <span className="ifi-tw">
      <span className="ifi-tw-ghost" aria-hidden="true">
        {text}
      </span>
      <span className="ifi-tw-live" aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length ? <i className="ifi-caret" /> : null}
      </span>
      <span className="ifi-sr">{text}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Data + model                                */
/* -------------------------------------------------------------------------- */

const CASH_NOW = 1840 // £k
const FLOOR = 500 // £k minimum cash
const HORIZON = 36
const LEVEL = 988 // de-seasonalised monthly inflow, £k
const OPEX0 = 547.4
const DRIFT = 0.00195
const HIRE_COST = 7.0
const SEAS = [0.88, 0.86, 0.92, 0.94, 0.96, 0.97, 0.95, 0.94, 0.99, 1.03, 1.08, 1.22]
/** Actual months 1..12 (Nov 2025 .. Oct 2026), £k. */
const HIST_IN = [1004, 1182, 862, 836, 902, 921, 946, 958, 941, 936, 981, 1018]
const HIST_OUT = [1111, 1204, 1021, 962, 1016, 1043, 1052, 1085, 1063, 1081, 1096, 1146]
const HIST_CASH = (() => {
  const c = new Array<number>(13).fill(0)
  c[12] = CASH_NOW
  for (let i = 12; i >= 1; i--) c[i - 1] = c[i] - (HIST_IN[i - 1] - HIST_OUT[i - 1])
  return c
})()

type PresetKey = "base" | "hire" | "down"
const PRESETS: Record<PresetKey, { label: string; hires: number; growth: number; gm: number }> = {
  base: { label: "Base", hires: 0, growth: 6, gm: 0 },
  hire: { label: "Hire plan", hires: 2, growth: 10, gm: 0 },
  down: { label: "Downturn", hires: 0, growth: -8, gm: -0.016 },
}

type Model = {
  inflow: number[]
  outflow: number[]
  cash: number[]
  hw: number[]
  runway: number | null
  floorAt: number | null
  burn: number
  gm: number
}

function project(preset: PresetKey, hires: number, growth: number): Model {
  const gmShift = PRESETS[preset].gm + 0.0004 * (growth - 6)
  const g = growth / 100
  const inflow: number[] = []
  const outflow: number[] = []
  const cash = [CASH_NOW]
  for (let n = 1; n <= HORIZON; n++) {
    const mo = (9 + n) % 12
    const i = LEVEL * SEAS[mo] * Math.pow(1 + g, n / 12)
    const o = i * (1 - (0.412 + gmShift)) + OPEX0 * Math.pow(1 + DRIFT, n / 12) + hires * Math.min(n, 6) * HIRE_COST
    inflow.push(i)
    outflow.push(o)
    cash.push(cash[n - 1] + i - o)
  }
  const cross = (lvl: number) => {
    for (let n = 1; n <= HORIZON; n++) if (cash[n] <= lvl) return n - 1 + (cash[n - 1] - lvl) / (cash[n - 1] - cash[n])
    return null
  }
  const runway = cross(0)
  const floorAt = cross(FLOOR)
  const burn = runway != null ? CASH_NOW / runway : (CASH_NOW - cash[12]) / 12
  const mult = 1 + 0.04 * hires + 0.025 * Math.max(0, 6 - growth)
  const hw = Array.from({ length: 12 }, (_, i) => 20 * (i + 1) * mult)
  return { inflow, outflow, cash, hw, runway, floorAt, burn, gm: (0.412 + gmShift) * 100 }
}

const BASE_MODEL = project("base", 0, 6)

/** Pack the animated parts of a model into one vector for useTween. */
const pack = (m: Model) => [
  ...m.cash.slice(1, 13),
  ...m.hw,
  ...m.inflow.slice(0, 12),
  ...m.outflow.slice(0, 12),
  m.runway ?? HORIZON,
  m.floorAt ?? HORIZON,
  m.burn,
  m.gm,
]
const unpack = (v: number[]) => ({
  cash: v.slice(0, 12),
  hw: v.slice(12, 24),
  inflow: v.slice(24, 36),
  outflow: v.slice(36, 48),
  runway: v[48],
  floorAt: v[49],
  burn: v[50],
  gm: v[51],
})

/** Departments, £k, month to date at day 28 of 31. */
const MONTH_FRAC = 28 / 31
const DEPTS = [
  { name: "Operations", owner: "Noor Haddad", budget: 78, actual: 66.4 },
  { name: "Marketing", owner: "Ines Varga", budget: 52, actual: 56.8 },
  { name: "Product", owner: "Tomasz Lindqvist", budget: 44, actual: 39.6 },
  { name: "People", owner: "Priya Raman", budget: 46, actual: 33.0 },
  { name: "G&A", owner: "Ada Okafor", budget: 20, actual: 16.2 },
]
const SPEND_BUDGET = DEPTS.reduce((s, d) => s + d.budget, 0)
const SPEND_ACTUAL = Math.round(DEPTS.reduce((s, d) => s + d.actual, 0) * 10) / 10

type Rcpt = "matched" | "missing" | "pending"
type Flag = { kind: "dup" | "vendor"; title: string; note: string; conf: number; why: string[] }
type Tx = { id: string; date: string; merchant: string; cat: string; owner: string; amt: number; rcpt: Rcpt; flag?: Flag }

const TXS: Tx[] = [
  { id: "t1", date: "28 OCT", merchant: "Dunmore Freight Ltd", cat: "Logistics", owner: "Noor Haddad", amt: 4820, rcpt: "matched" },
  {
    id: "t2",
    date: "28 OCT",
    merchant: "Dunmore Freight Ltd",
    cat: "Logistics",
    owner: "Noor Haddad",
    amt: 4820,
    rcpt: "pending",
    flag: {
      kind: "dup",
      title: "Duplicate charge",
      note: "Same amount and reference (DF-20418) as the charge four minutes earlier. Looks like a double capture.",
      conf: 94,
      why: ["Identical amount, £4,820.00, and reference DF-20418", "Posted 4 minutes apart on the same card", "Dunmore has billed once per shipment for 14 months"],
    },
  },
  {
    id: "t3",
    date: "27 OCT",
    merchant: "Northlight Print & Pack",
    cat: "Print",
    owner: "Ines Varga",
    amt: 6950,
    rcpt: "missing",
    flag: {
      kind: "vendor",
      title: "Unusual vendor",
      note: "First payment to this vendor, and 3.1× Marketing's median card spend. It accounts for the budget overrun.",
      conf: 81,
      why: ["No payments to Northlight in 14 months of history", "£6,950 against a £2,240 median Marketing card payment", "No receipt or purchase order on file"],
    },
  },
  { id: "t4", date: "27 OCT", merchant: "Tarn Cloud Hosting", cat: "Software", owner: "Tomasz Lindqvist", amt: 1284.6, rcpt: "matched" },
  { id: "t5", date: "26 OCT", merchant: "Quillon Staffing", cat: "Recruitment", owner: "Priya Raman", amt: 3600, rcpt: "matched" },
  { id: "t6", date: "26 OCT", merchant: "Brackwater Coffee Roasters", cat: "Office", owner: "Priya Raman", amt: 186.4, rcpt: "matched" },
  { id: "t7", date: "25 OCT", merchant: "Halden Couriers", cat: "Logistics", owner: "Noor Haddad", amt: 912.35, rcpt: "missing" },
  { id: "t8", date: "24 OCT", merchant: "Pinbook CRM", cat: "Software", owner: "Ada Okafor", amt: 1350, rcpt: "matched" },
  { id: "t9", date: "23 OCT", merchant: "Fernhill Insurance Brokers", cat: "Insurance", owner: "Ada Okafor", amt: 2140, rcpt: "matched" },
  { id: "t10", date: "22 OCT", merchant: "Marlowe Studios", cat: "Content", owner: "Ines Varga", amt: 2400, rcpt: "pending" },
]

type Ymd = [number, number, number]
type Sub = { id: string; name: string; what: string; seats?: number; used?: number; per?: number; flat?: number; next: Ymd; cadence: "monthly" | "annual" | "usage" }
const SUBS: Sub[] = [
  { id: "s1", name: "Loomwright", what: "Design review", seats: 24, used: 15, per: 16, next: [2026, 10, 2], cadence: "monthly" },
  { id: "s2", name: "Parcelmate", what: "Shipping labels", flat: 420, next: [2026, 10, 12], cadence: "monthly" },
  { id: "s3", name: "Kestrel Helpdesk", what: "Support inbox", seats: 26, used: 19, per: 38, next: [2026, 10, 18], cadence: "monthly" },
  { id: "s4", name: "Quayside Docs", what: "Shared documents", seats: 30, used: 25, per: 25, next: [2026, 10, 21], cadence: "monthly" },
  { id: "s5", name: "Pinbook CRM", what: "Customer records", seats: 30, used: 21, per: 45, next: [2026, 10, 24], cadence: "monthly" },
  { id: "s6", name: "Tarn Cloud Hosting", what: "Storefront hosting", flat: 1285, next: [2026, 10, 27], cadence: "usage" },
  { id: "s7", name: "Ledgerline Payroll", what: "Payroll runs", flat: 680, next: [2026, 10, 30], cadence: "monthly" },
  { id: "s8", name: "Harrow Analytics", what: "Sales reporting", seats: 14, used: 9, per: 60, next: [2026, 11, 9], cadence: "annual" },
]
const subCost = (s: Sub) => (s.seats ? s.seats * (s.per ?? 0) : (s.flat ?? 0))
const subUnused = (s: Sub) => (s.seats ? (s.seats - (s.used ?? 0)) * (s.per ?? 0) : 0)
const SUBS_TOTAL = SUBS.reduce((s, x) => s + subCost(x), 0)
const SUBS_UNUSED = SUBS.reduce((s, x) => s + subUnused(x), 0)
const TODAY_UTC = Date.UTC(2026, 9, 28)
const dayOffset = ([y, m, d]: Ymd) => Math.round((Date.UTC(y, m, d) - TODAY_UTC) / 864e5)
const dayLabel = ([, m, d]: Ymd) => `${d} ${MON[m]}`
const addMonth = ([y, m, d]: Ymd): Ymd => (m === 11 ? [y + 1, 0, d] : [y, m + 1, d])
const WINDOW = 66

/* -------------------------------------------------------------------------- */
/*                                    CSS                                     */
/* -------------------------------------------------------------------------- */

const CSS = `
.ifi {
  --ifi-paper: #fafafa;
  --ifi-sheet: #ffffff;
  --ifi-ink: #0a0a0a;
  --ifi-signal: #0060e2;
  --ifi-accent: var(--ifi-signal);
  --ifi-surface: var(--ifi-sheet);
  --ifi-signal-soft: color-mix(in oklab, var(--ifi-signal) 12%, transparent);
  --ifi-t1: color-mix(in oklab, var(--ifi-ink) 92%, transparent);
  --ifi-t2: color-mix(in oklab, var(--ifi-ink) 64%, transparent);
  --ifi-t3: color-mix(in oklab, var(--ifi-ink) 44%, transparent);
  --ifi-t4: color-mix(in oklab, var(--ifi-ink) 22%, transparent);
  --ifi-rule: color-mix(in oklab, var(--ifi-ink) 14%, transparent);
  --ifi-rule-2: color-mix(in oklab, var(--ifi-ink) 7%, transparent);
  --ifi-ok: #1f8a4c; --ifi-warn: #b7791f; --ifi-bad: #c4321a;
  --ifi-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ifi-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ifi-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ifi-font: var(--ifi-sans);
  --ifi-ease: cubic-bezier(.2, .8, .2, 1);
  --ifi-ease-trace: cubic-bezier(.65, 0, .35, 1);
  font: 13px/20px var(--ifi-font); color: var(--ifi-t1);
  position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden;
  background: var(--ifi-paper);
}
:is(.dark, [data-theme="dark"]) .ifi {
  --ifi-paper: #0c0c0d; --ifi-sheet: #1c1c1e; --ifi-ink: #f5f5f5; --ifi-signal: #4d8dff;
  --ifi-ok: #4cc07f; --ifi-warn: #e0a83c; --ifi-bad: #f0674c;
}
.ifi *, .ifi *::before, .ifi *::after { box-sizing: border-box }
:where(.ifi) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.ifi :focus-visible { outline: 2px solid color-mix(in oklab, var(--ifi-accent) 70%, transparent); outline-offset: 1px }
.ifi-mono { font-family: var(--ifi-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--ifi-t3) }
.ifi-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.ifi-num { font-family: var(--ifi-mono); font-variant-numeric: tabular-nums }

/* ---- rail ---- */
.ifi-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--ifi-sheet); border-right: 1px solid var(--ifi-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.ifi-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--ifi-serif); letter-spacing: -.01em; color: var(--ifi-ink) }
.ifi-brand svg { flex: none }
.ifi-group { padding: 0 12px; margin-top: 12px }
.ifi-group > .ifi-mono { padding: 0 6px; margin-bottom: 6px; display: block }
.ifi-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); background: var(--ifi-paper); color: var(--ifi-t1); transition: box-shadow .2s var(--ifi-ease) }
.ifi-ws:hover { box-shadow: 0 0 0 1px var(--ifi-t4) }
.ifi-ws svg { color: var(--ifi-t3) }
.ifi-nav { position: relative; margin: 0 0 0 8px; padding: 0 }
.ifi-nav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--ifi-rule) }
.ifi-item { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--ifi-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--ifi-ease), background-color .2s var(--ifi-ease) }
.ifi-item:hover { color: var(--ifi-t1); background: var(--ifi-rule-2) }
.ifi-item svg { flex: none; stroke-width: 1.5 }
.ifi-item.is-active { color: var(--ifi-ink) }
.ifi-item.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--ifi-accent); transform-origin: top; animation: ifi-tick .5s var(--ifi-ease) backwards }
.ifi-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--ifi-t4); position: relative }
.ifi-dot.ok { background: var(--ifi-ok) }
.ifi-dot.live { background: var(--ifi-accent) }
.ifi-dot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--ifi-accent); animation: ifi-pulse 1.6s var(--ifi-ease) infinite }
.ifi-agent .ifi-mono { margin-left: auto; font-size: 9.5px }
.ifi-spacer { flex: 1; min-height: 12px }
.ifi-user { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--ifi-rule) }
.ifi-av { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--ifi-ink); color: var(--ifi-paper); font: 600 10px/1 var(--ifi-mono); letter-spacing: .04em }
.ifi-user b { font-weight: 500; color: var(--ifi-t1); display: block; line-height: 16px }
.ifi-user div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--ifi-t3) }
.ifi-sidetools { padding: 8px 12px }
.ifi-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--ifi-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--ifi-ease) }

/* ---- main + top bar ---- */
.ifi-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column }
.ifi-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--ifi-rule); background: var(--ifi-paper); z-index: 10 }
.ifi-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); background: var(--ifi-sheet) }
.ifi-title { min-width: 0 }
.ifi-title .ifi-mono { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.ifi-title h1 { margin: 0; font: 400 22px/24px var(--ifi-serif); letter-spacing: -.01em; color: var(--ifi-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ifi-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.ifi-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); background: var(--ifi-sheet); color: var(--ifi-t3); transition: box-shadow .2s var(--ifi-ease) }
.ifi-search:hover { box-shadow: 0 0 0 1px var(--ifi-t4) }
.ifi-search span { flex: 1 }
.ifi-search kbd { font: 500 10px/14px var(--ifi-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); color: var(--ifi-t3) }
.ifi-btn { display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); background: var(--ifi-sheet); color: var(--ifi-t1); font-weight: 500; white-space: nowrap; transition: box-shadow .2s var(--ifi-ease), background-color .2s, opacity .2s }
.ifi-btn:hover { box-shadow: 0 0 0 1px var(--ifi-t3) }
.ifi-btn.sm { height: 26px; padding: 0 10px; font-size: 12px }
.ifi-btn.ghost { box-shadow: none; background: none; color: var(--ifi-t2) }
.ifi-btn.ghost:hover { color: var(--ifi-ink); background: var(--ifi-rule-2) }
.ifi-btn.sig { box-shadow: 0 0 0 1px var(--ifi-accent) }
.ifi-btn.sig:hover { background: var(--ifi-signal-soft); box-shadow: 0 0 0 1px var(--ifi-accent) }
.ifi-btn:active { transform: translateY(.5px) }
.ifi-btn svg { color: var(--ifi-t2) }
.ifi-period { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ifi-rule); font: 500 11px/14px var(--ifi-mono); letter-spacing: .06em; color: var(--ifi-t2); white-space: nowrap }

/* ---- body ---- */
.ifi-body { flex: 1; min-height: 0; overflow-y: auto; container: ifib / inline-size; scrollbar-width: thin; scrollbar-color: var(--ifi-t4) transparent }
.ifi-page { display: grid; gap: 22px; padding: 22px 22px 56px; max-width: 1560px; margin: 0 auto }
.ifi-page > * { min-width: 0 }

/* readout row */
.ifi-read { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background: var(--ifi-rule); box-shadow: 0 0 0 1px var(--ifi-rule) }
.ifi-rd { background: var(--ifi-surface); padding: 13px 16px 12px; min-width: 0; display: flex; flex-direction: column; gap: 2px }
.ifi-rd .v { font: 500 25px/32px var(--ifi-mono); font-variant-numeric: tabular-nums; letter-spacing: -.025em; color: var(--ifi-ink); white-space: nowrap; animation: ifi-fade .35s backwards }
.ifi-rd .v small { font: 500 11px/16px var(--ifi-mono); letter-spacing: .04em; color: var(--ifi-t3); margin-left: 4px }
.ifi-rd .s { font: 500 10px/14px var(--ifi-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--ifi-t3) }
.ifi-rd .s b { font-weight: 500; color: var(--ifi-t2) }
.ifi-rd .s .w { color: var(--ifi-warn) }

/* cards */
.ifi-card { position: relative; background: var(--ifi-surface); box-shadow: 0 0 0 1px var(--ifi-rule); min-width: 0 }
.ifi-crop { position: absolute; width: 8px; height: 8px; pointer-events: none; border: 0 solid var(--ifi-t4) }
.ifi-crop.tl { left: -8px; top: -8px; border-right-width: 1px; border-bottom-width: 1px }
.ifi-crop.tr { right: -8px; top: -8px; border-left-width: 1px; border-bottom-width: 1px }
.ifi-crop.bl { left: -8px; bottom: -8px; border-right-width: 1px; border-top-width: 1px }
.ifi-crop.br { right: -8px; bottom: -8px; border-left-width: 1px; border-top-width: 1px }
.ifi-ch { padding: 18px 20px 14px; display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 20px; flex-wrap: wrap }
.ifi-ch h2 { margin: 3px 0 0; font: 400 26px/30px var(--ifi-serif); letter-spacing: -.01em; color: var(--ifi-ink) }
.ifi-ch h2 em { font-style: italic }
.ifi-ch p { margin: 2px 0 0; color: var(--ifi-t2); max-width: 54ch }
.ifi-aside { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; color: var(--ifi-t2) }
.ifi-fig { padding: 8px 20px 14px; border-top: 1px solid var(--ifi-rule-2) }

/* legend */
.ifi-leg { display: flex; flex-wrap: wrap; gap: 4px 16px }
.ifi-leg span { display: inline-flex; align-items: center; gap: 7px; font: 500 10px/14px var(--ifi-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifi-t3) }
.ifi-leg i { display: block; width: 18px; height: 0; border-top: 1.5px solid var(--ifi-ink) }
.ifi-leg i.dash { border-top-style: dashed }
.ifi-leg i.band { height: 8px; border: 0; background: radial-gradient(circle, var(--ifi-t2) .6px, transparent .8px) 0 0 / 3px 3px }
.ifi-leg i.warn { border-top-color: var(--ifi-warn); border-top-width: 1px }
.ifi-leg i.bar { width: 8px; height: 9px; border: 0; background: var(--ifi-ink) }
.ifi-leg i.bar2 { width: 8px; height: 9px; border: 0; background: var(--ifi-t3) }
.ifi-leg i.hatch { width: 8px; height: 9px; border: 1px solid var(--ifi-t2); background: radial-gradient(circle, var(--ifi-t2) .6px, transparent .8px) 0 0 / 3px 3px }

/* hero */
.ifi-hero-body { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--ifi-rule) }
.ifi-chartcol { min-width: 0 }
.ifi-chart { position: relative; padding: 4px 8px 0; outline-offset: -2px; touch-action: pan-y; user-select: none }
.ifi-chart svg { display: block; overflow: visible }
.ifi-wipe { animation: ifi-wipe 1.1s var(--ifi-ease-trace) backwards }
.ifi-fcg { animation: ifi-wipe .9s .9s var(--ifi-ease-trace) backwards }
.ifi-trace { stroke-dasharray: 1; animation: ifi-draw 1.1s var(--ifi-ease-trace) backwards }
.ifi-scan { position: absolute; top: 22px; width: 1px; background: var(--ifi-accent); pointer-events: none; animation: ifi-scanx 1.9s var(--ifi-ease-trace) backwards; opacity: 0 }
.ifi-scan.b { animation: ifi-scanx .8s var(--ifi-ease-trace) backwards }
.ifi-tx { font: 500 10px/12px var(--ifi-mono); letter-spacing: .06em; fill: var(--ifi-t3) }
.ifi-tx.i { fill: var(--ifi-t1) }
.ifi-tx.w { fill: var(--ifi-warn) }
.ifi-tx.b { fill: var(--ifi-bad) }
.ifi-tx.s { fill: var(--ifi-ink) }
.ifi-tip { position: absolute; z-index: 6; width: 172px; padding: 9px 11px 10px; background: var(--ifi-surface); border-radius: 2px; pointer-events: none;
  box-shadow: 0 0 0 1px var(--ifi-rule), 0 1px 0 var(--ifi-rule), 0 12px 24px -16px rgb(0 0 0 / .25); animation: ifi-fade .15s backwards }
.ifi-tip .big { font: 500 20px/26px var(--ifi-mono); letter-spacing: -.02em; color: var(--ifi-ink); font-variant-numeric: tabular-nums }
.ifi-tip dl { margin: 6px 0 0; display: grid; grid-template-columns: auto auto; gap: 1px 12px }
.ifi-tip dt { font: 500 10px/16px var(--ifi-mono); letter-spacing: .08em; color: var(--ifi-t3) }
.ifi-tip dd { margin: 0; text-align: right; font: 500 11px/16px var(--ifi-mono); font-variant-numeric: tabular-nums; color: var(--ifi-t1) }

/* scenario controls */
.ifi-ctl { padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 18px; border-top: 1px solid var(--ifi-rule) }
.ifi-ctl-row { display: grid; gap: 18px }
.ifi-field > .ifi-mono { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 8px }
.ifi-adj { display: flex; align-items: center; gap: 8px; min-height: 18px; margin-top: -8px }
.ifi-adj button { font: 500 10px/14px var(--ifi-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifi-t2); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--ifi-t4) }
.ifi-adj button:hover { color: var(--ifi-ink) }
.ifi-sg { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; border-radius: 2px; background: var(--ifi-paper); box-shadow: 0 0 0 1px var(--ifi-rule) }
.ifi-sg.sm .ifi-sg-opt { min-height: 26px; padding: 0 10px; font-size: 12px }
.ifi-sg-ind { position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% / var(--n)); pointer-events: none; transform: translateX(calc(var(--i) * 100%)); background: var(--ifi-rule-2); transition: transform .3s var(--ifi-ease) }
.ifi-sg-ind::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--ifi-accent) }
.ifi-sg-opt { position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 32px; padding: 0 8px; white-space: nowrap; text-align: center; color: var(--ifi-t2); transition: color .2s var(--ifi-ease) }
.ifi-sg-opt + .ifi-sg-opt::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 1px; background: var(--ifi-rule) }
.ifi-sg-opt:hover { color: var(--ifi-t1) }
.ifi-sg-opt[aria-checked="true"] { color: var(--ifi-ink); font-weight: 500 }
.ifi-sg-opt i { font: normal 500 10px/14px var(--ifi-mono); color: var(--ifi-t3) }
.ifi-rs-read { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px }
.ifi-rs-val { font: 500 22px/28px var(--ifi-mono); font-variant-numeric: tabular-nums; letter-spacing: -.02em; color: var(--ifi-ink) }
.ifi-rs-hint { margin-left: auto; font-size: 12px; color: var(--ifi-t3) }
.ifi-rs { position: relative; height: 38px; margin: 0 9px; cursor: pointer; touch-action: pan-y; user-select: none }
.ifi-rs-base { position: absolute; left: 0; right: 0; top: 10px; height: 1px; background: var(--ifi-rule) }
.ifi-rs-fill { position: absolute; left: 0; top: 10px; height: 1px; background: var(--ifi-t2); transition: width .16s var(--ifi-ease) }
.ifi-rs-t { position: absolute; top: 10px; width: 1px; height: 5px; margin-left: -.5px; background: var(--ifi-t4) }
.ifi-rs-t[data-major] { height: 10px; background: var(--ifi-t3) }
.ifi-rs-t b { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); font: 500 10px/14px var(--ifi-mono); letter-spacing: .02em; color: var(--ifi-t3); white-space: nowrap }
.ifi-rs-thumb { position: absolute; top: 0; width: 14px; height: 22px; margin-left: -7px; cursor: grab; transition: left .16s var(--ifi-ease) }
.ifi-rs-thumb::before { content: ""; position: absolute; left: 6px; top: 0; width: 2px; height: 22px; background: var(--ifi-accent) }
.ifi-rs-thumb::after { content: ""; position: absolute; left: 3px; top: 0; width: 8px; height: 2px; background: var(--ifi-accent) }
.ifi-rs[data-drag] .ifi-rs-thumb, .ifi-rs[data-drag] .ifi-rs-fill { transition: none; cursor: grabbing }
.ifi-kv { margin: 0; display: grid; border-top: 1px solid var(--ifi-rule) }
.ifi-kv div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--ifi-rule-2) }
.ifi-kv dt { font: 500 10.5px/14px var(--ifi-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifi-t3) }
.ifi-kv dd { margin: 0; font: 500 12px/16px var(--ifi-mono); font-variant-numeric: tabular-nums; color: var(--ifi-ink); text-align: right }
.ifi-kv dd.w { color: var(--ifi-warn) }
.ifi-kv dd.b { color: var(--ifi-bad) }
.ifi-note { position: relative; padding-left: 14px; font: italic 400 15px/20px var(--ifi-serif); color: var(--ifi-t1) }
.ifi-note::before { content: ""; position: absolute; left: 0; top: 3px; bottom: 3px; width: 1px; background: var(--ifi-t3) }
.ifi-note .ifi-mono { display: flex; align-items: center; gap: 7px; margin-bottom: 3px; font-style: normal }
.ifi-tw { display: grid }
.ifi-tw > * { grid-area: 1 / 1 }
.ifi-tw-ghost { visibility: hidden }
.ifi-caret { display: inline-block; width: 6px; height: 12px; margin-left: 2px; vertical-align: -1px; background: var(--ifi-ink); animation: ifi-blink 1s steps(2) infinite }

/* two-up rows */
.ifi-pair { display: grid; gap: 22px }
.ifi-flow { padding: 0 8px; position: relative }
.ifi-flow svg { display: block; overflow: visible }
.ifi-flowread { display: flex; flex-wrap: wrap; gap: 4px 18px; padding: 0 20px 10px; min-height: 26px }
.ifi-flowread span { font: 500 11px/16px var(--ifi-mono); letter-spacing: .02em; color: var(--ifi-t1); font-variant-numeric: tabular-nums }
.ifi-flowread span b { font-weight: 500; font-size: 10px; letter-spacing: .08em; color: var(--ifi-t3); margin-right: 6px }
.ifi-flowread span.n b { color: var(--ifi-t3) }

/* budget */
.ifi-bud { padding: 0 20px 6px }
.ifi-bud-scale { position: relative; height: 22px; margin-left: 132px; margin-right: 76px }
.ifi-bud-scale i { position: absolute; bottom: 0; width: 1px; height: 6px; background: var(--ifi-t3) }
.ifi-bud-scale i.m { height: 3px; background: var(--ifi-t4) }
.ifi-bud-scale b { position: absolute; bottom: 8px; transform: translateX(-50%); font: 500 10px/12px var(--ifi-mono); color: var(--ifi-t3) }
.ifi-bud-row { display: grid; grid-template-columns: 132px minmax(0, 1fr) 76px; align-items: center; min-height: 44px; border-top: 1px solid var(--ifi-rule-2) }
.ifi-bud-row.tot { border-top: 1px solid var(--ifi-rule); margin-top: 2px }
.ifi-bud-n { min-width: 0 }
.ifi-bud-n b { display: block; font-weight: 500; color: var(--ifi-t1); line-height: 18px }
.ifi-bud-n span { display: block; font: 500 10px/14px var(--ifi-mono); letter-spacing: .03em; color: var(--ifi-t3); white-space: nowrap }
.ifi-bud-t { position: relative; height: 28px; background: linear-gradient(90deg, var(--ifi-rule-2) 1px, transparent 1px) 0 0 / calc(100% * 20 / 85) 100% }
.ifi-bud-t .bar { position: absolute; left: 0; top: 10px; height: 8px; background: var(--ifi-t1); transform-origin: left; animation: ifi-grow .8s var(--ifi-ease) backwards }
.ifi-bud-t .proj { position: absolute; top: 10px; height: 8px; box-shadow: inset 0 0 0 1px var(--ifi-t3); background: radial-gradient(circle, var(--ifi-t2) .6px, transparent .8px) 0 0 / 3px 3px; transform-origin: left; animation: ifi-grow .8s .25s var(--ifi-ease) backwards }
.ifi-bud-t .bud { position: absolute; top: 4px; width: 1px; height: 20px; background: var(--ifi-ink); margin-left: -.5px; animation: ifi-fade .4s .5s backwards }
.ifi-bud-t .bud::before, .ifi-bud-t .bud::after { content: ""; position: absolute; left: -2px; width: 5px; height: 1px; background: var(--ifi-ink) }
.ifi-bud-t .bud::before { top: 0 }
.ifi-bud-t .bud::after { bottom: 0 }
.ifi-bud-t .bud.over { width: 2px; margin-left: -1px; background: var(--ifi-accent); animation: ifi-slide .6s .6s var(--ifi-ease) backwards }
.ifi-bud-t .bud.over::before, .ifi-bud-t .bud.over::after { background: var(--ifi-accent); left: -2px; width: 6px }
.ifi-bud-v { text-align: right; font: 500 12px/16px var(--ifi-mono); font-variant-numeric: tabular-nums; color: var(--ifi-t2) }
.ifi-bud-v.over { color: var(--ifi-bad) }
.ifi-bud-v small { display: block; font: 500 10px/12px var(--ifi-mono); color: var(--ifi-t3); letter-spacing: .04em }
.ifi-bud-foot { padding: 12px 20px 18px }

/* spend table */
.ifi-spend { container: ifis / inline-size }
.ifi-tbl { padding: 0 20px 6px }
.ifi-th, .ifi-tr { display: grid; grid-template-columns: 52px minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1.1fr) 96px 92px; column-gap: 14px; align-items: center }
.ifi-th { padding: 0 0 8px; border-bottom: 1px solid var(--ifi-rule) }
.ifi-th span:nth-child(5) { text-align: right }
.ifi-trw { position: relative; border-bottom: 1px solid var(--ifi-rule-2); animation: ifi-row .45s var(--ifi-ease) backwards; animation-delay: calc(var(--d, 0) * 40ms + .2s) }
.ifi-trw[data-flag]::before { content: ""; position: absolute; left: -20px; top: 8px; bottom: 8px; width: 2px; background: var(--ifi-warn) }
.ifi-trw[data-res]::before { background: var(--ifi-ok) }
.ifi-tr { min-height: 40px; padding: 4px 0 }
.ifi-tr .m { min-width: 0; font-weight: 500; color: var(--ifi-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ifi-tr .c, .ifi-tr .o { min-width: 0; color: var(--ifi-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ifi-tr .d { font: 500 10.5px/14px var(--ifi-mono); letter-spacing: .06em; color: var(--ifi-t3) }
.ifi-tr .a { text-align: right; font: 500 12.5px/16px var(--ifi-mono); font-variant-numeric: tabular-nums; color: var(--ifi-ink) }
.ifi-tr .r { display: flex; align-items: center; gap: 7px; font: 500 10px/14px var(--ifi-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifi-t2) }
.ifi-tr .r i { width: 6px; height: 6px; border-radius: 50%; background: var(--ifi-t4) }
.ifi-tr .r.matched i { background: var(--ifi-ok) }
.ifi-tr .r.missing { color: var(--ifi-warn) }
.ifi-tr .r.missing i { background: var(--ifi-warn) }
.ifi-tr .mm { display: none }
.ifi-chip { display: inline-block; margin-left: 8px; padding: 0 5px; border-radius: 2px; font: 500 9.5px/15px var(--ifi-mono); letter-spacing: .08em; text-transform: uppercase; vertical-align: 1px; color: var(--ifi-warn); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ifi-warn) 55%, transparent) }
.ifi-chip.ok { color: var(--ifi-ok); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ifi-ok) 55%, transparent) }
.ifi-flagrow { display: flex; align-items: flex-start; gap: 14px; padding: 0 0 12px 66px; position: relative }
.ifi-flagrow::before { content: ""; position: absolute; left: 18px; top: -6px; height: 16px; width: 30px; border-left: 1px solid var(--ifi-t3); border-bottom: 1px solid var(--ifi-t3) }
.ifi-flagrow .ifi-note { flex: 1; min-width: 0; padding-left: 0; font-size: 15.5px }
.ifi-flagrow .ifi-note::before { display: none }
.ifi-flagrow .ifi-mono { display: inline-flex; align-items: center; gap: 6px; margin: 0 8px 0 0; font-style: normal; vertical-align: 1px }
.ifi-pop { position: absolute; z-index: 8; width: 360px; max-width: calc(100% - 24px); right: 12px; background: var(--ifi-surface); border-radius: 4px; padding: 14px 16px 14px;
  box-shadow: 0 0 0 1px var(--ifi-rule), 0 1px 0 var(--ifi-rule), 0 12px 24px -16px rgb(0 0 0 / .25); animation: ifi-pop .32s var(--ifi-ease) backwards; clip-path: inset(-30px -30px -30px -30px) }
.ifi-pop::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--ifi-accent); opacity: 0; animation: ifi-scanl .6s var(--ifi-ease-trace) }
.ifi-pop-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px }
.ifi-pop h3 { margin: 2px 0 0; font: 400 21px/24px var(--ifi-serif); color: var(--ifi-ink); letter-spacing: -.01em }
.ifi-x { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 2px; color: var(--ifi-t3); margin: -4px -6px 0 0 }
.ifi-x:hover { color: var(--ifi-ink); background: var(--ifi-rule-2) }
.ifi-pop ul { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 5px }
.ifi-pop li { position: relative; padding-left: 14px; color: var(--ifi-t2) }
.ifi-pop li::before { content: ""; position: absolute; left: 0; top: 9px; width: 7px; height: 1px; background: var(--ifi-t3) }
.ifi-conf { display: flex; align-items: center; gap: 10px; margin: 12px 0 0 }
.ifi-conf .meter { flex: 1; height: 8px; position: relative; background: radial-gradient(circle, var(--ifi-t3) .5px, transparent .8px) 0 0 / 3px 3px; box-shadow: inset 0 0 0 1px var(--ifi-rule) }
.ifi-conf .meter i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--ifi-t1); transform-origin: left; animation: ifi-grow .7s .15s var(--ifi-ease) backwards }
.ifi-conf b { font: 500 12px/16px var(--ifi-mono); color: var(--ifi-ink) }
.ifi-pop-a { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px }

/* subscriptions */
.ifi-subs { container: ifiu / inline-size }
.ifi-insight { margin: 0 20px 14px; padding: 12px 14px; background: var(--ifi-paper); box-shadow: inset 0 0 0 1px var(--ifi-rule); border-radius: 2px }
.ifi-insight p { margin: 4px 0 0; font: 400 19px/24px var(--ifi-serif); color: var(--ifi-ink); letter-spacing: -.005em }
.ifi-insight p em { font-style: italic }
.ifi-insight .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; flex-wrap: wrap }
.ifi-insight .ifi-note { margin-top: 10px; font-size: 14.5px }
.ifi-tl { padding: 0 20px 4px; position: relative }
.ifi-tl svg { display: block; overflow: visible }
.ifi-tlread { padding: 4px 20px 10px; min-height: 28px; font: 500 11px/16px var(--ifi-mono); letter-spacing: .03em; color: var(--ifi-t2) }
.ifi-tlread b { color: var(--ifi-ink); font-weight: 500 }
.ifi-sl { padding: 0 20px 8px }
.ifi-sr-row { display: grid; grid-template-columns: minmax(0, 1fr) 76px 64px 52px; column-gap: 12px; align-items: center; min-height: 44px; border-top: 1px solid var(--ifi-rule-2); transition: background-color .2s var(--ifi-ease); animation: ifi-row .45s var(--ifi-ease) backwards; animation-delay: calc(var(--d, 0) * 40ms + .3s) }
.ifi-sr-row:hover, .ifi-sr-row[data-on] { background: var(--ifi-rule-2) }
.ifi-sr-row .n { min-width: 0 }
.ifi-sr-row .n b { display: block; font-weight: 500; color: var(--ifi-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 18px }
.ifi-sr-row .n span { display: block; font-size: 11.5px; line-height: 14px; color: var(--ifi-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ifi-seat { display: block }
.ifi-seat .bar { display: flex; height: 8px; box-shadow: inset 0 0 0 1px var(--ifi-rule) }
.ifi-seat .bar i { display: block; background: var(--ifi-t1); transform-origin: left; animation: ifi-grow .7s .4s var(--ifi-ease) backwards }
.ifi-seat .bar b { display: block; flex: 1; background: radial-gradient(circle, var(--ifi-t2) .6px, transparent .8px) 0 0 / 3px 3px }
.ifi-seat small { display: block; margin-top: 2px; font: 500 9.5px/12px var(--ifi-mono); letter-spacing: .04em; color: var(--ifi-t3) }
.ifi-seat small.w { color: var(--ifi-warn) }
.ifi-sr-row .p { text-align: right; font: 500 12px/16px var(--ifi-mono); font-variant-numeric: tabular-nums; color: var(--ifi-ink) }
.ifi-sr-row .p small { display: block; font: 500 9.5px/12px var(--ifi-mono); color: var(--ifi-t3); letter-spacing: .05em }
.ifi-sr-row .dt { text-align: right; font: 500 10.5px/14px var(--ifi-mono); letter-spacing: .05em; color: var(--ifi-t2) }
.ifi-sr-row .dt small { display: block; font-size: 9.5px; color: var(--ifi-t3) }
.ifi-subs-foot { display: flex; justify-content: space-between; gap: 10px; padding: 10px 20px 16px; border-top: 1px solid var(--ifi-rule) }
.ifi-subs-foot b { font: 500 12px/16px var(--ifi-mono); color: var(--ifi-ink); font-variant-numeric: tabular-nums }

/* ---- motion ---- */
@keyframes ifi-tick { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes ifi-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes ifi-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ifi-blink { 0% { opacity: 1 } 50% { opacity: 0 } }
@keyframes ifi-wipe { from { clip-path: inset(-6px 100% -6px -6px) } to { clip-path: inset(-6px -6px -6px -6px) } }
@keyframes ifi-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ifi-scanx { 0% { transform: translateX(0); opacity: 1 } 90% { opacity: 1 } 100% { transform: translateX(var(--pw)); opacity: 0 } }
@keyframes ifi-scanl { 0% { left: 0; opacity: 1 } 80% { opacity: 1 } 100% { left: calc(100% - 1px); opacity: 0 } }
@keyframes ifi-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes ifi-slide { from { transform: translateX(-24px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes ifi-row { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes ifi-pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes ifi-bar { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* ---- responsive: by main-area width ---- */
@container ifib (min-width: 880px) {
  .ifi-hero-body { grid-template-columns: minmax(0, 1fr) 312px }
  .ifi-ctl { border-top: 0; border-left: 1px solid var(--ifi-rule) }
}
@container ifib (min-width: 560px) and (max-width: 879px) {
  .ifi-ctl-row { grid-template-columns: 1fr 1fr }
}
@container ifib (min-width: 960px) {
  .ifi-pair.a { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr) }
}
@container ifib (min-width: 1100px) {
  .ifi-pair.b { grid-template-columns: minmax(0, 8fr) minmax(0, 4.3fr) }
}
@container ifib (max-width: 779px) {
  .ifi-read { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .ifi-rd:last-child { grid-column: 1 / -1 }
}
@container ifib (max-width: 559px) {
  .ifi-page { padding: 16px 16px 40px; gap: 18px }
  .ifi-rd { padding: 12px 14px 10px }
  .ifi-rd .v { font-size: 22px }
  .ifi-ch { padding: 16px 16px 12px }
  .ifi-ch h2 { font-size: 24px }
  .ifi-fig, .ifi-flowread { padding-left: 16px; padding-right: 16px }
  .ifi-ctl { padding: 16px }
  .ifi-chart { padding: 4px 0 0 }
  .ifi-flow { padding: 0 }
  .ifi-bud { padding: 0 16px 4px }
  .ifi-bud-scale { margin-left: 92px; margin-right: 62px }
  .ifi-bud-row { grid-template-columns: 92px minmax(0, 1fr) 62px }
  .ifi-bud-foot { padding: 12px 16px 16px }
  .ifi-tbl { padding: 0 16px 4px }
  .ifi-trw[data-flag]::before { left: -16px }
  .ifi-tl, .ifi-sl, .ifi-subs-foot, .ifi-tlread { padding-left: 16px; padding-right: 16px }
  .ifi-insight { margin-left: 16px; margin-right: 16px }
}
@container ifis (max-width: 679px) {
  .ifi-th { display: none }
  .ifi-tr { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "m a" "d r"; row-gap: 1px; padding: 8px 0 }
  .ifi-tr .m { grid-area: m }
  .ifi-tr .a { grid-area: a }
  .ifi-tr .r { grid-area: r; justify-self: end }
  .ifi-tr .d { grid-area: d; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
  .ifi-tr .c, .ifi-tr .o, .ifi-tr .dd { display: none }
  .ifi-tr .mm { display: inline }
  .ifi-flagrow { padding-left: 14px; flex-direction: column; gap: 8px }
  .ifi-flagrow::before { display: none }
  .ifi-pop { left: 12px; width: auto }
}
@container ifiu (max-width: 430px) {
  .ifi-sr-row { grid-template-columns: minmax(0, 1fr) 64px 52px }
  .ifi-seat { display: none }
}

@media (max-width: 1023px) {
  .ifi-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--ifi-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--ifi-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .ifi.is-open .ifi-rail { transform: none; visibility: visible; transition: transform .32s var(--ifi-ease), visibility 0s }
  .ifi.is-open .ifi-scrim { opacity: 1; pointer-events: auto }
  .ifi-menu { display: grid }
}
@media (max-width: 1099px) { .ifi-search { display: none } }
@media (max-width: 767px) {
  .ifi { height: auto; min-height: 100%; overflow: visible }
  /* the page scrolls on phones, so the drawer and its scrim stay pinned to the viewport */
  .ifi-rail { position: fixed; height: 100dvh }
  .ifi-scrim { position: fixed }
  .ifi-main { min-height: 100dvh }
  .ifi-top { position: sticky; top: 0; padding: 0 12px; gap: 10px }
  .ifi-title .ifi-mono { display: none }
  .ifi-title h1 { font-size: 21px }
  .ifi-period, .ifi-btn .t { display: none }
  .ifi-btn { padding: 0 9px }
  .ifi-body { overflow: visible }
}
@media (prefers-reduced-motion: reduce) {
  .ifi *, .ifi *::before, .ifi *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Primitives                                */
/* -------------------------------------------------------------------------- */

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--ifi-accent)" strokeWidth="1.5" />
    </svg>
  )
}

function Card({
  id,
  label,
  title,
  sub,
  aside,
  className,
  children,
}: {
  id: string
  label: string
  title: React.ReactNode
  sub: string
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`ifi-card${className ? ` ${className}` : ""}`} aria-labelledby={id}>
      <i className="ifi-crop tl" />
      <i className="ifi-crop tr" />
      <i className="ifi-crop bl" />
      <i className="ifi-crop br" />
      <header className="ifi-ch">
        <div>
          <span className="ifi-mono">{label}</span>
          <h2 id={id}>{title}</h2>
          <p>{sub}</p>
        </div>
        {aside ? <div className="ifi-aside">{aside}</div> : null}
      </header>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  small,
}: {
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  small?: boolean
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className={`ifi-sg${small ? " sm" : ""}`} role="radiogroup" aria-label={label} style={{ "--n": options.length, "--i": idx } as React.CSSProperties}>
      <i className="ifi-sg-ind" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          className="ifi-sg-opt"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
            if (!d) return
            e.preventDefault()
            const ni = (i + d + options.length) % options.length
            onChange(options[ni].value)
            ;(e.currentTarget.parentElement?.querySelectorAll("button")[ni] as HTMLElement | undefined)?.focus()
          }}
        >
          {o.label}
          {o.hint ? <i>{o.hint}</i> : null}
        </button>
      ))}
    </div>
  )
}

/** A slider drawn as a ruler: ticks with mono labels, a signal tick as the thumb. */
function Ruler({
  label,
  value,
  min,
  max,
  major,
  onChange,
  onCommit,
  fmt,
  unit,
  hint,
  tickFmt,
}: {
  label: string
  value: number
  min: number
  max: number
  major: number
  onChange: (v: number) => void
  onCommit: (v: number) => void
  fmt: (v: number) => string
  unit: string
  hint: string
  tickFmt: (v: number) => string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)
  const [drag, setDrag] = React.useState(false)
  const id = React.useId()
  const range = max - min
  const pct = ((value - min) / range) * 100
  const fromX = (x: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !r.width) return value
    return clamp(Math.round(min + clamp((x - r.left) / r.width, 0, 1) * range), min, max)
  }
  const ticks = []
  for (let v = min; v <= max; v++) ticks.push(v)
  return (
    <div className="ifi-field">
      <span className="ifi-mono" id={id}>
        {label}
      </span>
      <div className="ifi-rs-read" aria-hidden="true">
        <span className="ifi-rs-val">{fmt(value)}</span>
        <span className="ifi-mono">{unit}</span>
        <span className="ifi-rs-hint">{hint}</span>
      </div>
      <div
        ref={ref}
        className="ifi-rs"
        data-drag={drag || undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          dragging.current = true
          setDrag(true)
          ;(e.currentTarget.querySelector("[role=slider]") as HTMLElement | null)?.focus()
          onChange(fromX(e.clientX))
        }}
        onPointerMove={(e) => {
          if (dragging.current) onChange(fromX(e.clientX))
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return
          dragging.current = false
          setDrag(false)
          onCommit(fromX(e.clientX))
        }}
        onPointerCancel={() => {
          dragging.current = false
          setDrag(false)
        }}
      >
        <i className="ifi-rs-base" />
        <i className="ifi-rs-fill" style={{ width: `${pct}%` }} />
        {ticks.map((v) => {
          const isMajor = (v - min) % major === 0
          return (
            <i key={v} className="ifi-rs-t" data-major={isMajor || undefined} style={{ left: `${((v - min) / range) * 100}%` }}>
              {isMajor ? <b>{tickFmt(v)}</b> : null}
            </i>
          )
        })}
        <div
          role="slider"
          tabIndex={0}
          aria-labelledby={id}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${fmt(value)} ${unit}`}
          className="ifi-rs-thumb"
          style={{ left: `${pct}%` }}
          onKeyDown={(e) => {
            let n: number | null = null
            if (e.key === "ArrowRight" || e.key === "ArrowUp") n = value + 1
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") n = value - 1
            else if (e.key === "PageUp") n = value + major
            else if (e.key === "PageDown") n = value - major
            else if (e.key === "Home") n = min
            else if (e.key === "End") n = max
            if (n === null) return
            e.preventDefault()
            n = clamp(n, min, max)
            onChange(n)
            onCommit(n)
          }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Chart bits                                */
/* -------------------------------------------------------------------------- */

/** Nested Bayer thresholds: each level adds dots to the one below, so density = value. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
function DitherPattern({ id, level, dot = "var(--ifi-ink)", opacity = 0.6 }: { id: string; level: number; dot?: string; opacity?: number }) {
  const cells: React.ReactNode[] = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (BAYER[r][c] < level) cells.push(<rect key={`${r}${c}`} x={c} y={r} width="1" height="1" />)
  return (
    <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
      <g fill={dot} opacity={opacity}>
        {cells}
      </g>
    </pattern>
  )
}

function MonthRuler({ X, y, narrow }: { X: (i: number) => number; y: number; narrow: boolean }) {
  const out: React.ReactNode[] = []
  for (let i = 0; i <= 24; i++) {
    const { m, y: yr } = monthOf(i)
    const major = m % 3 === 0
    const label = narrow ? m % 6 === 0 : major
    out.push(
      <g key={i}>
        <line x1={X(i)} x2={X(i)} y1={y} y2={y + (major ? 7 : 3.5)} stroke="var(--ifi-t3)" strokeWidth="1" opacity={major ? 1 : 0.7} />
        {label ? (
          <text className={`ifi-tx${i === 12 ? " s" : ""}`} x={X(i)} y={y + 20} textAnchor="middle">
            {MON[m]}
          </text>
        ) : null}
        {label && (m === 0 || i === 0) ? (
          <text className="ifi-tx" x={X(i)} y={y + 32} textAnchor="middle" opacity=".75">
            {yr}
          </text>
        ) : null}
      </g>,
    )
  }
  return <>{out}</>
}

type Tw = ReturnType<typeof unpack>

/* ----------------------------- Cash forecast ----------------------------- */

function CashChart({ tw, hover, setHover, rev }: { tw: Tw; hover: number | null; setHover: (n: number | null) => void; rev: number }) {
  const [wrapRef, w] = useWidth(760)
  const uid = React.useId().replace(/:/g, "")
  const narrow = w < 520
  const H = narrow ? 280 : 420
  const ml = narrow ? 40 : 46
  const mr = narrow ? 14 : 20
  const mt = 30
  const mb = 44
  const pw = w - 16 - ml - mr
  const ph = H - mt - mb
  const YMIN = -300
  const YMAX = 3400
  const X = (i: number) => ml + (i / 24) * pw
  const Y = (v: number) => mt + ((YMAX - v) / (YMAX - YMIN)) * ph
  const fc = [CASH_NOW, ...tw.cash]
  const hw = [0, ...tw.hw]
  const valueAt = (i: number) => (i <= 12 ? HIST_CASH[i] : fc[i - 12])
  const pathOf = (pts: [number, number][]) => pts.map(([x, y], j) => `${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")
  const actual = pathOf(HIST_CASH.map((v, i) => [X(i), Y(v)]))
  const forecast = pathOf(fc.map((v, k) => [X(12 + k), Y(v)]))
  const band = (f: number) => {
    const up = fc.map((v, k) => [X(12 + k), Y(v + f * hw[k])] as [number, number])
    const dn = fc.map((v, k) => [X(12 + k), Y(v - f * hw[k])] as [number, number]).reverse()
    return `${pathOf(up)}${dn.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join("")}Z`
  }
  const yTicks = [0, 1000, 2000, 3000]
  const re = tw.runway
  const reX = X(Math.min(12 + re, 24))
  const reBeyond = re > 12
  const lineOp = clamp((12.6 - re) / 0.6, 0, 1)
  const floorX = X(12 + tw.floorAt)
  const floorIn = tw.floorAt <= 12
  const endText = re >= 35.9 ? "NO RUNWAY END IN 36 MO" : `RUNWAY END · ${re.toFixed(1)} MO`
  const rootRef = React.useRef<SVGSVGElement>(null)

  const hv = hover
  const hx = hv != null ? X(hv) : 0
  const hvVal = hv != null ? valueAt(hv) : 0
  const tipW = 172
  const tipLeft = hv != null ? (hx + 14 + tipW > w - 8 ? hx - 14 - tipW + 8 : hx + 14 + 8) : 0

  const idxFrom = (clientX: number) => {
    const r = rootRef.current?.getBoundingClientRect()
    if (!r) return null
    return clamp(Math.round(((clientX - r.left - ml) / pw) * 24), 0, 24)
  }
  const forecastTip = hv != null && hv > 12
  const tipFlow = hv != null && hv >= 1 ? { i: hv <= 12 ? HIST_IN[hv - 1] : tw.inflow[hv - 13], o: hv <= 12 ? HIST_OUT[hv - 1] : tw.outflow[hv - 13] } : null
  const summary =
    hv != null
      ? `${monLabel(hv)}, ${hv <= 12 ? "actual" : "forecast"} cash ${fm(hvVal)}${tipFlow ? `, net ${fk(tipFlow.i - tipFlow.o)}` : ""}`
      : ""

  return (
    <div
      ref={wrapRef}
      className="ifi-chart"
      tabIndex={0}
      role="group"
      aria-roledescription="interactive chart"
      aria-label="Cash forecast, 12 months actual and 12 months forecast. Use left and right arrow keys to read each month."
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault()
          setHover(hv == null ? 12 : Math.min(24, hv + 1))
        } else if (e.key === "ArrowLeft") {
          e.preventDefault()
          setHover(hv == null ? 12 : Math.max(0, hv - 1))
        } else if (e.key === "Escape") setHover(null)
      }}
      onBlur={() => setHover(null)}
    >
      <span className="ifi-sr" aria-live="polite">
        {summary}
      </span>
      <svg ref={rootRef} width={w - 16} height={H} viewBox={`0 0 ${w - 16} ${H}`} aria-hidden="true">
        <defs>
          <clipPath id={`${uid}c`}>
            <rect x={ml - 1} y={mt - 2} width={pw + 2} height={ph + 4} />
          </clipPath>
          <DitherPattern id={`${uid}d1`} level={2} />
          <DitherPattern id={`${uid}d2`} level={4} />
          <DitherPattern id={`${uid}d3`} level={6} />
          <pattern id={`${uid}h`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ifi-ink)" strokeWidth="1" opacity=".1" />
          </pattern>
        </defs>

        <g className="ifi-wipe">
          {/* registration grid */}
          {Array.from({ length: 8 }, (_, j) => j * 500).map((v) => (
            <line key={v} x1={ml} x2={ml + pw} y1={Y(v)} y2={Y(v)} stroke="var(--ifi-ink)" strokeOpacity={v % 1000 === 0 ? 0.1 : 0.05} />
          ))}
          {Array.from({ length: 9 }, (_, j) => j * 3).map((i) => (
            <line key={i} x1={X(i)} x2={X(i)} y1={mt} y2={mt + ph} stroke="var(--ifi-ink)" strokeOpacity=".05" />
          ))}
          <rect x={X(12)} y={mt} width={X(24) - X(12)} height={ph} fill="var(--ifi-ink)" opacity=".03" />
          <rect x={ml} y={Y(0)} width={pw} height={mt + ph - Y(0)} fill={`url(#${uid}h)`} />
          <text className="ifi-tx" x={ml + 6} y={mt + ph - 6} opacity=".7">
            OVERDRAWN
          </text>
          {yTicks.map((v) => (
            <text key={v} className="ifi-tx" x={ml - 8} y={Y(v) + 3.5} textAnchor="end">
              {v === 0 ? "£0" : `£${v / 1000}M`}
            </text>
          ))}
          <line x1={ml} x2={ml + pw} y1={Y(0)} y2={Y(0)} stroke="var(--ifi-t3)" strokeWidth="1" />

          {/* minimum cash */}
          <line x1={ml} x2={ml + pw} y1={Y(FLOOR)} y2={Y(FLOOR)} stroke="var(--ifi-warn)" strokeWidth="1" />
          <text className="ifi-tx w" x={ml + 6} y={Y(FLOOR) - 6}>
            MIN CASH {fk(FLOOR)}
          </text>

          <MonthRuler X={X} y={mt + ph + 8} narrow={narrow} />
          <line x1={ml} x2={ml + pw} y1={mt + ph + 8} y2={mt + ph + 8} stroke="var(--ifi-t3)" />
        </g>

        <g clipPath={`url(#${uid}c)`}>
          <g className="ifi-fcg" key={`fc${rev}`}>
            <path d={band(1)} fill={`url(#${uid}d1)`} />
            <path d={band(0.66)} fill={`url(#${uid}d2)`} />
            <path d={band(0.33)} fill={`url(#${uid}d3)`} />
            <path d={forecast} fill="none" stroke="var(--ifi-ink)" strokeWidth="1.6" strokeDasharray="5 4" strokeLinejoin="round" />
          </g>
          <path className="ifi-trace" d={actual} pathLength={1} fill="none" stroke="var(--ifi-ink)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </g>
        {HIST_CASH.map((v, i) => (
          <circle key={i} cx={X(i)} cy={Y(v)} r="2" fill="var(--ifi-surface)" stroke="var(--ifi-ink)" strokeWidth="1" />
        ))}

        {/* floor breach + runway end */}
        {floorIn ? <circle cx={floorX} cy={Y(FLOOR)} r="3.5" fill="var(--ifi-surface)" stroke="var(--ifi-warn)" strokeWidth="1.5" /> : null}
        <g>
          <line x1={reX} x2={reX} y1={mt + 6} y2={Y(0)} stroke="var(--ifi-bad)" strokeWidth="1" strokeDasharray="2 3" opacity={lineOp} />
          {reBeyond ? (
            <path d={`M${reX - 5} ${Y(0) - 5}L${reX} ${Y(0)}L${reX - 5} ${Y(0) + 5}`} fill="none" stroke="var(--ifi-bad)" strokeWidth="1.5" />
          ) : (
            <path d={`M${reX - 4} ${Y(0) - 4}L${reX + 4} ${Y(0) + 4}M${reX + 4} ${Y(0) - 4}L${reX - 4} ${Y(0) + 4}`} stroke="var(--ifi-bad)" strokeWidth="1.5" />
          )}
          <text className="ifi-tx b" x={reBeyond ? reX - 10 : reX > ml + pw - 150 ? reX - 8 : reX + 8} y={reBeyond ? Y(0) + 20 : mt + 16} textAnchor={reBeyond || reX > ml + pw - 150 ? "end" : "start"}>
            {endText}
          </text>
        </g>

        {/* today */}
        <g className="ifi-wipe">
          <line x1={X(12)} x2={X(12)} y1={mt - 12} y2={mt + ph + 8} stroke="var(--ifi-accent)" strokeWidth="1" />
          <rect x={X(12) - 4} y={mt - 14} width="8" height="2" fill="var(--ifi-accent)" />
          {!narrow ? (
            <>
              <text className="ifi-tx" x={X(12) - 8} y={mt - 10} textAnchor="end">
                ← ACTUAL
              </text>
              <text className="ifi-tx" x={X(12) + 8} y={mt - 10}>
                FORECAST →
              </text>
            </>
          ) : null}
        </g>

        {/* crosshair */}
        {hv != null ? (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={mt - 4} y2={mt + ph + 8} stroke="var(--ifi-ink)" strokeOpacity=".5" strokeWidth="1" />
            <circle cx={hx} cy={Y(hvVal)} r="4" fill="var(--ifi-surface)" stroke="var(--ifi-ink)" strokeWidth="1.6" />
          </g>
        ) : null}

        <rect
          x={ml - 8}
          y={mt - 8}
          width={pw + 16}
          height={ph + 24}
          fill="transparent"
          onPointerMove={(e) => setHover(idxFrom(e.clientX))}
          onPointerDown={(e) => setHover(idxFrom(e.clientX))}
          onPointerLeave={(e) => {
            if (e.pointerType !== "touch") setHover(null)
          }}
        />
      </svg>

      <div className="ifi-scan" style={{ left: ml + 8, height: ph + mt - 12, ["--pw" as string]: `${pw}px` }} aria-hidden="true" />
      {rev > 0 ? <div className="ifi-scan b" key={`s${rev}`} style={{ left: X(12) + 8, height: ph + mt - 12, ["--pw" as string]: `${X(24) - X(12)}px` }} aria-hidden="true" /> : null}

      {hv != null ? (
        <div className="ifi-tip" style={{ left: tipLeft, top: mt + 2 }} aria-hidden="true">
          <span className="ifi-mono">
            {monLabel(hv)} · {hv <= 12 ? "actual" : "forecast"}
          </span>
          <div className="big">{fm(hvVal)}</div>
          <dl>
            {forecastTip ? (
              <>
                <dt>RANGE</dt>
                <dd>
                  {fm(hvVal - hw[hv - 12])}–{fm(hvVal + hw[hv - 12]).slice(1)}
                </dd>
              </>
            ) : null}
            {tipFlow ? (
              <>
                <dt>IN</dt>
                <dd>{fk(tipFlow.i)}</dd>
                <dt>OUT</dt>
                <dd>{fk(tipFlow.o)}</dd>
                <dt>NET</dt>
                <dd>{fk(tipFlow.i - tipFlow.o)}</dd>
              </>
            ) : (
              <>
                <dt>OPENING</dt>
                <dd>12 mo ago</dd>
              </>
            )}
          </dl>
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------- Inflow vs outflow --------------------------- */

function FlowChart({ tw, hover, setHover }: { tw: Tw; hover: number | null; setHover: (n: number | null) => void }) {
  const [ref, w] = useWidth(600)
  const uid = React.useId().replace(/:/g, "")
  const narrow = w < 520
  const H = narrow ? 230 : 318
  const ml = narrow ? 40 : 46
  const mr = 10
  const mt = 14
  const mb = 40
  const pw = w - 16 - ml - mr
  const ph = H - mt - mb
  const D = 1400
  const Y = (v: number) => mt + ((D - v) / (2 * D)) * ph
  const pitch = pw / 24
  const cx = (i: number) => ml + (i - 1 + 0.5) * pitch
  const bw = Math.max(4, Math.min(14, pitch * 0.58))
  const ins = [...HIST_IN, ...tw.inflow]
  const outs = [...HIST_OUT, ...tw.outflow]
  const lab: React.ReactNode[] = []
  for (let i = 1; i <= 24; i++) {
    const { m, y } = monthOf(i)
    const show = narrow ? m % 6 === 0 : m % 3 === 0
    lab.push(
      <g key={i}>
        <line x1={cx(i)} x2={cx(i)} y1={mt + ph + 8} y2={mt + ph + (m % 3 === 0 ? 14 : 11)} stroke="var(--ifi-t3)" />
        {show ? (
          <text className="ifi-tx" x={cx(i)} y={mt + ph + 27} textAnchor="middle">
            {MON[m]}
          </text>
        ) : null}
        {show && (m === 0 || i === 1) ? (
          <text className="ifi-tx" x={cx(i)} y={mt + ph + 38} textAnchor="middle" opacity=".75">
            {y}
          </text>
        ) : null}
      </g>,
    )
  }
  const idxFrom = (clientX: number) => {
    const r = (ref.current?.querySelector("svg") as SVGSVGElement | null)?.getBoundingClientRect()
    if (!r) return null
    return clamp(Math.floor((clientX - r.left - ml) / pitch) + 1, 1, 24)
  }
  const sel = hover != null && hover >= 1 ? hover : null
  const fwdIn = tw.inflow.reduce((s, v) => s + v, 0)
  const fwdOut = tw.outflow.reduce((s, v) => s + v, 0)
  const read =
    sel != null ? (
      <>
        <span>
          <b>{monLabel(12 + (sel - 12))}</b>
          {sel <= 12 ? "ACTUAL" : "FORECAST"}
        </span>
        <span>
          <b>IN</b>
          {fk(ins[sel - 1])}
        </span>
        <span>
          <b>OUT</b>
          {fk(outs[sel - 1])}
        </span>
        <span className="n">
          <b>NET</b>
          {fk(ins[sel - 1] - outs[sel - 1])}
        </span>
      </>
    ) : (
      <>
        <span>
          <b>NEXT 12 MO · IN</b>
          {fm(fwdIn)}
        </span>
        <span>
          <b>OUT</b>
          {fm(fwdOut)}
        </span>
        <span className="n">
          <b>NET</b>
          {fm(fwdIn - fwdOut)}
        </span>
      </>
    )
  return (
    <>
      <div className="ifi-flowread" aria-live="polite">
        {read}
      </div>
      <div className="ifi-flow" ref={ref}>
        <svg width={w - 16} height={H} viewBox={`0 0 ${w - 16} ${H}`} role="img" aria-label="Monthly inflows above the axis and outflows below it for 12 months of actuals and 12 of forecast, with net marked by a tick.">
          <defs>
            <DitherPattern id={`${uid}a`} level={7} />
            <DitherPattern id={`${uid}b`} level={4} dot="var(--ifi-ink)" opacity={0.55} />
          </defs>
          {[-1000, -500, 500, 1000].map((v) => (
            <line key={v} x1={ml} x2={ml + pw} y1={Y(v)} y2={Y(v)} stroke="var(--ifi-ink)" strokeOpacity=".06" />
          ))}
          {[-1000, 0, 1000].map((v) => (
            <text key={v} className="ifi-tx" x={ml - 8} y={Y(v) + 3.5} textAnchor="end">
              {v === 0 ? "£0" : `${v > 0 ? "+" : "−"}£1M`}
            </text>
          ))}
          {sel != null ? <rect x={ml + (sel - 1) * pitch} y={mt} width={pitch} height={ph} fill="var(--ifi-ink)" opacity=".06" /> : null}
          <rect x={ml + 12 * pitch} y={mt} width={12 * pitch} height={ph} fill="var(--ifi-ink)" opacity=".025" />
          {ins.map((v, j) => {
            const i = j + 1
            const f = i > 12
            const up = Y(0) - Y(v)
            const dn = Y(-outs[j]) - Y(0)
            const delay = `${0.15 + j * 0.025}s`
            return (
              <g key={i}>
                <rect
                  x={cx(i) - bw / 2}
                  y={Y(v)}
                  width={bw}
                  height={Math.max(0, up)}
                  fill={f ? `url(#${uid}a)` : "var(--ifi-ink)"}
                  fillOpacity={f ? 1 : 0.9}
                  stroke={f ? "var(--ifi-ink)" : "none"}
                  strokeOpacity=".7"
                  strokeWidth=".75"
                  style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `ifi-bar .6s ${delay} var(--ifi-ease) backwards` }}
                />
                <rect
                  x={cx(i) - bw / 2}
                  y={Y(0)}
                  width={bw}
                  height={Math.max(0, dn)}
                  fill={f ? `url(#${uid}b)` : "var(--ifi-t3)"}
                  stroke={f ? "var(--ifi-t2)" : "none"}
                  strokeWidth=".75"
                  style={{ transformBox: "fill-box", transformOrigin: "top", animation: `ifi-bar .6s ${delay} var(--ifi-ease) backwards` }}
                />
                <path d={`M${cx(i) - bw / 2 - 3} ${Y(v - outs[j])}H${cx(i) + bw / 2 + 3}`} stroke="var(--ifi-surface)" strokeWidth="4.5" />
                <path d={`M${cx(i) - bw / 2 - 3} ${Y(v - outs[j])}H${cx(i) + bw / 2 + 3}`} stroke="var(--ifi-ink)" strokeWidth="2" style={{ animation: `ifi-fade .4s ${0.6 + j * 0.02}s backwards` }} />
              </g>
            )
          })}
          <line x1={ml} x2={ml + pw} y1={Y(0)} y2={Y(0)} stroke="var(--ifi-t2)" strokeWidth="1" />
          <line x1={ml} x2={ml + pw} y1={mt + ph + 8} y2={mt + ph + 8} stroke="var(--ifi-t3)" />
          {lab}
          <line x1={ml + 12 * pitch} x2={ml + 12 * pitch} y1={mt - 6} y2={mt + ph + 8} stroke="var(--ifi-accent)" />
          <rect x={ml + 12 * pitch - 4} y={mt - 8} width="8" height="2" fill="var(--ifi-accent)" />
          <text className="ifi-tx" x={ml + 12 * pitch - 6} y={mt + 8} textAnchor="end">
            ← ACTUAL
          </text>
          <text className="ifi-tx" x={ml + 12 * pitch + 6} y={mt + 8}>
            FORECAST →
          </text>
          <rect
            x={ml}
            y={mt}
            width={pw}
            height={ph + 8}
            fill="transparent"
            onPointerMove={(e) => setHover(idxFrom(e.clientX))}
            onPointerDown={(e) => setHover(idxFrom(e.clientX))}
            onPointerLeave={(e) => {
              if (e.pointerType !== "touch") setHover(null)
            }}
          />
        </svg>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Budget vs actual                               */
/* -------------------------------------------------------------------------- */

const BudgetBody = React.memo(function BudgetBody() {
  const SC = 85
  const pc = (v: number) => `${(v / SC) * 100}%`
  const ticks = []
  for (let v = 0; v <= 80; v += 10) ticks.push(v)
  return (
    <>
      <div className="ifi-bud">
        <div className="ifi-bud-scale" aria-hidden="true">
          {ticks.map((v) => (
            <React.Fragment key={v}>
              <i className={v % 20 ? "m" : ""} style={{ left: pc(v) }} />
              {v % 20 === 0 ? <b style={{ left: pc(v) }}>{v === 0 ? "£0" : `${v}k`}</b> : null}
            </React.Fragment>
          ))}
        </div>
        {DEPTS.map((d, i) => {
          const over = d.actual > d.budget
          const proj = d.actual / MONTH_FRAC
          const v = d.actual - d.budget
          return (
            <div className="ifi-bud-row" key={d.name} style={{ ["--d" as string]: i }}>
              <div className="ifi-bud-n">
                <b>{d.name}</b>
                <span>
                  £{d.actual.toFixed(1)}k / £{d.budget}k
                </span>
              </div>
              <div className="ifi-bud-t" role="img" aria-label={`${d.name}: £${d.actual}k spent of a £${d.budget}k budget, projected £${proj.toFixed(1)}k at month end${over ? ", over budget" : ""}`}>
                <i className="bar" style={{ width: pc(d.actual), animationDelay: `${0.1 + i * 0.07}s` }} />
                <i className="proj" style={{ left: pc(d.actual), width: pc(proj - d.actual), animationDelay: `${0.35 + i * 0.07}s` }} />
                <i className={`bud${over ? " over" : ""}`} style={{ left: pc(d.budget) }} />
              </div>
              <div className={`ifi-bud-v${over ? " over" : ""}`}>
                {v > 0 ? "+" : "−"}£{Math.abs(v).toFixed(1)}k
                <small>{over ? "OVER" : "UNDER"}</small>
              </div>
            </div>
          )
        })}
        <div className="ifi-bud-row tot">
          <div className="ifi-bud-n">
            <b>Total</b>
            <span>
              £{SPEND_ACTUAL.toFixed(1)}k / £{SPEND_BUDGET}k
            </span>
          </div>
          <div className="ifi-bud-t" style={{ background: "none" }}>
            <span className="ifi-mono" style={{ position: "absolute", left: 0, top: 6 }}>
              {Math.round((SPEND_ACTUAL / SPEND_BUDGET) * 100)}% spent
            </span>
          </div>
          <div className="ifi-bud-v">
            −£{(SPEND_BUDGET - SPEND_ACTUAL).toFixed(1)}k<small>UNDER</small>
          </div>
        </div>
      </div>
      <div className="ifi-bud-foot">
        <div className="ifi-note">
          <span className="ifi-mono">
            <i className="ifi-dot ok" aria-hidden="true" /> Atlas
          </span>
          Marketing is £4.8k over with three days left. One invoice, Northlight Print &amp; Pack at £6,950, explains it.
        </div>
      </div>
      <div className="ifi-fig">
        <span className="ifi-mono">FIG. 3 — Month to date against budget, £k. Dotted: projected to month end at the current pace.</span>
      </div>
    </>
  )
})

/* -------------------------------------------------------------------------- */
/*                                Spend table                                 */
/* -------------------------------------------------------------------------- */

type Res = "action" | "cleared"

const SpendCard = React.memo(function SpendCard() {
  const [filter, setFilter] = React.useState<"all" | "flagged" | "missing">("all")
  const [open, setOpen] = React.useState<{ id: string; top: number } | null>(null)
  const [res, setRes] = React.useState<Record<string, Res>>({})
  const cardRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const lastBtn = React.useRef<HTMLElement | null>(null)

  const flagged = TXS.filter((t) => t.flag && !res[t.id]).length
  const missing = TXS.filter((t) => t.rcpt === "missing").length
  const rows = TXS.filter((t) => (filter === "flagged" ? t.flag : filter === "missing" ? t.rcpt === "missing" : true))
  const tx = open ? TXS.find((t) => t.id === open.id) : undefined

  const openPanel = (id: string, el: HTMLElement) => {
    const card = cardRef.current
    if (!card) return
    const c = card.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    lastBtn.current = el
    const top = clamp(r.bottom - c.top + 8, 70, Math.max(70, c.height - 330))
    setOpen({ id, top })
    requestAnimationFrame(() => closeRef.current?.focus())
  }
  const close = () => {
    setOpen(null)
    lastBtn.current?.focus()
  }

  const resolve = (id: string, r: Res) => {
    setRes((p) => ({ ...p, [id]: r }))
    setOpen(null)
  }

  const resolutionText = (t: Tx, r: Res) =>
    r === "cleared"
      ? "Marked as expected by Ada. Atlas will not flag this one again."
      : t.flag?.kind === "dup"
        ? "Dispute sent to Dunmore Freight. Atlas will chase in five days if no credit note arrives."
        : "Receipt and purchase order requested from Ines. The payment stays on hold in the ledger until both arrive."

  return (
    <Card
      id="ifi-spend-h"
      className="ifi-spend"
      label="Cards & bills"
      title={
        <>
          Spend, <em>read</em> line by line
        </>
      }
      sub="The last ten transactions across four cards and the bills inbox. Atlas checks each against vendor history."
      aside={
        <Segmented
          small
          label="Filter transactions"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "flagged", label: "Flagged", hint: String(flagged) },
            { value: "missing", label: "No receipt", hint: String(missing) },
          ]}
        />
      }
    >
      <div className="ifi-tbl" ref={cardRef} style={{ position: "relative" }}>
        <div className="ifi-th ifi-mono" aria-hidden="true">
          <span>Date</span>
          <span>Merchant</span>
          <span>Category</span>
          <span>Owner</span>
          <span>Amount</span>
          <span>Receipt</span>
        </div>
        <div role="table" aria-label="Recent transactions" style={{ display: "contents" }}>
          {rows.length === 0 ? <p style={{ margin: 0, padding: "24px 0", color: "var(--ifi-t3)" }}>Nothing matches this filter.</p> : null}
          {rows.map((t, i) => {
            const r = res[t.id]
            const live = t.flag && !r
            return (
              <div className="ifi-trw" key={t.id} data-flag={live || undefined} data-res={r || undefined} style={{ ["--d" as string]: i }}>
                <div className="ifi-tr" role="row">
                  <span className="d" role="cell">
                    {t.date}
                    <span className="mm">
                      {" "}
                      · {t.cat} · {t.owner.split(" ")[0]}
                    </span>
                  </span>
                  <span className="m" role="cell">
                    {t.merchant}
                  </span>
                  <span className="c" role="cell">
                    {t.cat}
                  </span>
                  <span className="o dd" role="cell">
                    {t.owner}
                  </span>
                  <span className="a" role="cell">
                    {gbp(t.amt)}
                  </span>
                  <span className={`r ${t.rcpt}`} role="cell">
                    <i aria-hidden="true" />
                    {t.rcpt}
                  </span>
                </div>
                {t.flag ? (
                  <div className="ifi-flagrow">
                    <div className="ifi-note">
                      <span className="ifi-mono">
                        <i className="ifi-dot ok" aria-hidden="true" /> Atlas
                      </span>
                      <span className={`ifi-chip${r ? " ok" : ""}`} style={{ marginLeft: 0, marginRight: 8 }}>
                        {r ? (r === "cleared" ? "Cleared" : t.flag.kind === "dup" ? "Dispute sent" : "Receipt requested") : t.flag.title}
                      </span>
                      <Typewriter key={r ?? "o"} text={r ? resolutionText(t, r) : t.flag.note} speed={r ? 12 : 10} />
                    </div>
                    {!r ? (
                      <button type="button" className="ifi-btn sm sig" aria-haspopup="dialog" aria-expanded={open?.id === t.id} onClick={(e) => openPanel(t.id, e.currentTarget)}>
                        Review
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {tx?.flag && open ? (
          <div className="ifi-pop" style={{ top: open.top }} role="dialog" aria-label={`Review: ${tx.flag.title}`} onKeyDown={(e) => e.key === "Escape" && close()}>
            <div className="ifi-pop-h">
              <div>
                <span className="ifi-mono">Review · {tx.flag.title}</span>
                <h3>
                  {tx.merchant}, {gbp(tx.amt)}
                </h3>
              </div>
              <button ref={closeRef} type="button" className="ifi-x" aria-label="Close review" onClick={close}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <ul>
              {tx.flag.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <div className="ifi-conf">
              <span className="ifi-mono">Confidence</span>
              <div className="meter" role="img" aria-label={`${tx.flag.conf}% confidence`}>
                <i style={{ width: `${tx.flag.conf}%` }} />
              </div>
              <b>{tx.flag.conf}%</b>
            </div>
            <div className="ifi-pop-a">
              <button type="button" className="ifi-btn sm sig" onClick={() => resolve(tx.id, "action")}>
                {tx.flag.kind === "dup" ? "Dispute with Dunmore" : "Request receipt and PO"}
              </button>
              <button type="button" className="ifi-btn sm" onClick={() => resolve(tx.id, "cleared")}>
                Mark as expected
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="ifi-fig">
        <span className="ifi-mono">FIG. 4 — Card and bill transactions, 22–28 Oct 2026. Warn tick: Atlas flagged.</span>
      </div>
    </Card>
  )
})

/* -------------------------------------------------------------------------- */
/*                               Subscriptions                                */
/* -------------------------------------------------------------------------- */

const SubsCard = React.memo(function SubsCard() {
  const [wrapRef, w] = useWidth(380)
  const [hov, setHov] = React.useState<string | null>(null)
  const [queued, setQueued] = React.useState(false)
  const H = 92
  const ml = 6
  const pw = Math.max(120, w - 40 - ml * 2)
  const X = (d: number) => ml + (d / WINDOW) * pw
  const base = H - 24
  const occ: { id: string; d: number; amt: number; label: string; annual: boolean }[] = []
  for (const s of SUBS) {
    let n: Ymd = s.next
    for (let k = 0; k < 2; k++) {
      const d = dayOffset(n)
      if (d >= 0 && d <= WINDOW) occ.push({ id: s.id, d, amt: subCost(s), label: dayLabel(n), annual: s.cadence === "annual" })
      if (s.cadence === "annual") break
      n = addMonth(n)
    }
  }
  const focus = occ.find((o) => o.id === hov)
  const focusSub = SUBS.find((s) => s.id === hov)
  const next = [...SUBS].sort((a, b) => dayOffset(a.next) - dayOffset(b.next))[0]
  const sorted = [...SUBS].sort((a, b) => dayOffset(a.next) - dayOffset(b.next))
  const seatSubs = SUBS.filter((s) => subUnused(s) > 0)
  const mk = [
    { d: 4, t: "NOV" },
    { d: 34, t: "DEC" },
    { d: 65, t: "JAN" },
  ]
  const days = Array.from({ length: Math.floor(WINDOW / 7) + 1 }, (_, i) => i * 7)

  return (
    <Card
      id="ifi-subs-h"
      className="ifi-subs"
      label="Recurring costs"
      title={
        <>
          Subscriptions, <em>renewing</em>
        </>
      }
      sub={`${SUBS.length} tools at £${sep(SUBS_TOTAL)} a month. The next ${WINDOW} days of renewals are on the rule.`}
    >
      <div className="ifi-insight">
        <span className="ifi-mono">
          <i className="ifi-dot ok" aria-hidden="true" style={{ display: "inline-block", marginRight: 7 }} />
          Atlas · unused seats
        </span>
        <p>
          Found <em>£{sep(SUBS_UNUSED)}/mo</em> in seats nobody opened, across {seatSubs.length} tools. That is £{sep(SUBS_UNUSED * 12)} a year.
        </p>
        <div className="row">
          <span className="ifi-mono">{seatSubs.reduce((s, x) => s + ((x.seats ?? 0) - (x.used ?? 0)), 0)} seats · 60+ days idle</span>
          <button type="button" className={`ifi-btn sm${queued ? "" : " sig"}`} aria-pressed={queued} onClick={() => setQueued((q) => !q)}>
            {queued ? "Queued with Atlas" : "Draft seat changes"}
          </button>
        </div>
        {queued ? (
          <div className="ifi-note">
            <Typewriter text="Drafting seat reductions for Kestrel, Quayside and Harrow before their renewals. Nothing is sent without your sign-off." speed={12} />
          </div>
        ) : null}
      </div>

      <div className="ifi-tl" ref={wrapRef}>
        <svg width={w - 40} height={H} viewBox={`0 0 ${w - 40} ${H}`} role="img" aria-label="Timeline of subscription renewals over the next 66 days">
          <g className="ifi-wipe">
            {days.map((d) => (
              <line key={d} x1={X(d)} x2={X(d)} y1={base} y2={base + (d % 14 === 0 ? 6 : 3)} stroke="var(--ifi-t3)" opacity={d % 14 === 0 ? 1 : 0.6} />
            ))}
            <line x1={ml} x2={ml + pw} y1={base} y2={base} stroke="var(--ifi-t3)" />
            {mk.map((m) => (
              <g key={m.t}>
                <line x1={X(m.d)} x2={X(m.d)} y1={8} y2={base} stroke="var(--ifi-ink)" strokeOpacity=".08" />
                <text className="ifi-tx" x={X(m.d) + 4} y={base + 18}>
                  {m.t}
                </text>
              </g>
            ))}
          </g>
          {occ.map((o, i) => {
            const h = 10 + (o.amt / 1350) * 34
            const on = hov === o.id
            return (
              <g key={`${o.id}${o.d}`} style={{ cursor: "pointer" }} onPointerEnter={() => setHov(o.id)} onPointerLeave={() => setHov(null)}>
                <rect x={X(o.d) - 6} y={base - h - 6} width="12" height={h + 6} fill="transparent" />
                <line
                  x1={X(o.d)}
                  x2={X(o.d)}
                  y1={base}
                  y2={base - h}
                  stroke={o.annual ? "var(--ifi-accent)" : "var(--ifi-ink)"}
                  strokeWidth={on || o.annual ? 2 : 1.25}
                  style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `ifi-bar .55s ${0.3 + i * 0.04}s var(--ifi-ease) backwards` }}
                />
                <circle cx={X(o.d)} cy={base - h} r={on ? 3.5 : 2.4} fill={o.annual ? "var(--ifi-accent)" : "var(--ifi-ink)"} style={{ animation: `ifi-fade .3s ${0.7 + i * 0.04}s backwards` }} />
              </g>
            )
          })}
          <line x1={X(0)} x2={X(0)} y1={6} y2={base + 8} stroke="var(--ifi-accent)" />
          <rect x={X(0) - 4} y={4} width="8" height="2" fill="var(--ifi-accent)" />
          <text className="ifi-tx" x={X(0) + 6} y={16}>
            TODAY
          </text>
        </svg>
      </div>
      <div className="ifi-tlread" aria-live="polite">
        {focus && focusSub ? (
          <>
            <b>{focus.label}</b> · {focusSub.name} · £{sep(focus.amt)}
            {focus.annual ? " · annual renewal" : ""}
          </>
        ) : (
          <>
            NEXT · <b>{dayLabel(next.next)}</b> · {next.name} · £{sep(subCost(next))}
          </>
        )}
      </div>

      <div className="ifi-sl" role="list" aria-label="Subscriptions by next renewal">
        {sorted.map((s, i) => {
          const un = s.seats ? s.seats - (s.used ?? 0) : 0
          return (
            <div className="ifi-sr-row" role="listitem" key={s.id} data-on={hov === s.id || undefined} style={{ ["--d" as string]: i }} onPointerEnter={() => setHov(s.id)} onPointerLeave={() => setHov(null)}>
              <div className="n">
                <b>{s.name}</b>
                <span>{s.what}</span>
              </div>
              <div className="ifi-seat">
                {s.seats ? (
                  <>
                    <div className="bar" aria-hidden="true">
                      <i style={{ width: `${((s.used ?? 0) / s.seats) * 100}%` }} />
                      <b />
                    </div>
                    <small className={un > 4 ? "w" : ""}>
                      {s.used}/{s.seats} · {un} idle
                    </small>
                  </>
                ) : (
                  <small>{s.cadence === "usage" ? "USAGE-BASED" : "FLAT FEE"}</small>
                )}
              </div>
              <div className="p">
                £{sep(subCost(s))}
                <small>{s.cadence === "annual" ? "ANNUAL" : "/MO"}</small>
              </div>
              <div className="dt">
                {dayLabel(s.next)}
                <small>+{dayOffset(s.next)}D</small>
              </div>
            </div>
          )
        })}
      </div>
      <div className="ifi-subs-foot">
        <span className="ifi-mono">Recurring total</span>
        <b>£{sep(SUBS_TOTAL)}/mo</b>
      </div>
      <div className="ifi-fig">
        <span className="ifi-mono">FIG. 5 — Renewals, next {WINDOW} days. Stem height is monthly cost; the signal stem is an annual contract. Dotted bar: idle seats.</span>
      </div>
    </Card>
  )
})

/* -------------------------------------------------------------------------- */
/*                                    Shell                                   */
/* -------------------------------------------------------------------------- */

const NAV = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]
const OPS = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]
const AGENTS: { name: string; state: "live" | "ok" | "off"; note: string }[] = [
  { name: "Atlas", state: "live", note: "Flagging" },
  { name: "Sage", state: "ok", note: "Idle" },
  { name: "Quill", state: "off", note: "Paused" },
]

function Shell({
  actions,
  onNavigate,
  sideTools,
  children,
}: {
  actions: React.ReactNode
  onNavigate?: (label: string) => void
  sideTools?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const narrow = useMatch("(max-width: 1023px)")
  const hidden = narrow && !open
  const go = (label: string) => {
    setOpen(false)
    onNavigate?.(label)
  }
  return (
    <div
      className={`ifi${open ? " is-open" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) setOpen(false)
      }}
    >
      <style href="finance" precedence="default">
        {CSS}
      </style>
      <div className="ifi-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="ifi-rail" aria-label="Meridian navigation" inert={hidden}>
        <div className="ifi-brand">
          <Glyph />
          Meridian
        </div>
        <div className="ifi-group" style={{ marginTop: 4 }}>
          <span className="ifi-mono">Workspace</span>
          <button type="button" className="ifi-ws" aria-label="Switch workspace">
            Harbor &amp; Finch
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="ifi-group" aria-label="Console">
          <span className="ifi-mono">Console</span>
          <div className="ifi-nav">
            {NAV.map(({ label, icon: Icon }) => (
              <button key={label} type="button" className="ifi-item" onClick={() => go(label)}>
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="ifi-group" aria-label="Operations">
          <span className="ifi-mono">Operations</span>
          <div className="ifi-nav">
            {OPS.map(({ label, icon: Icon }) => (
              <button key={label} type="button" className={`ifi-item${label === "Finance" ? " is-active" : ""}`} aria-current={label === "Finance" ? "page" : undefined} onClick={() => go(label)}>
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="ifi-group" aria-label="Agents">
          <span className="ifi-mono">Agents</span>
          <div className="ifi-nav">
            {AGENTS.map((a) => (
              <button key={a.name} type="button" className="ifi-item ifi-agent" onClick={() => go(a.name)}>
                <span className={`ifi-dot ${a.state}`} aria-hidden="true" />
                {a.name}
                <span className="ifi-mono">{a.note}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="ifi-spacer" />
        {sideTools ? <div className="ifi-sidetools">{sideTools}</div> : null}
        <div className="ifi-user">
          <span className="ifi-av" aria-hidden="true">
            AO
          </span>
          <div>
            <b>Ada Okafor</b>
            <span>Product lead</span>
          </div>
        </div>
      </aside>
      <div className="ifi-main">
        <header className="ifi-top">
          <button type="button" className="ifi-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
          <div className="ifi-title">
            <span className="ifi-mono">Operations / Finance</span>
            <h1>Finance</h1>
          </div>
          <div className="ifi-actions">
            <button type="button" className="ifi-search" aria-label="Search, command K">
              <Search size={14} strokeWidth={1.5} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            {actions}
          </div>
        </header>
        <div className="ifi-body">{children}</div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Finance                                  */
/* -------------------------------------------------------------------------- */

export function Finance({ onNavigate, sideTools }: FinanceProps) {
  const [preset, setPreset] = React.useState<PresetKey>("base")
  const [hires, setHires] = React.useState(0)
  const [growth, setGrowth] = React.useState(6)
  const [settled, setSettled] = React.useState({ preset: "base" as PresetKey, hires: 0, growth: 6 })
  const [rev, setRev] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)

  const model = React.useMemo(() => project(preset, hires, growth), [preset, hires, growth])
  const noteModel = React.useMemo(() => project(settled.preset, settled.hires, settled.growth), [settled])
  const packed = React.useMemo(() => pack(model), [model])
  const tw = unpack(useTween(packed))
  const intro = useTween([1], { dur: 1100, fromZero: true })[0]
  const adjusted = hires !== PRESETS[preset].hires || growth !== PRESETS[preset].growth

  const pick = (p: PresetKey) => {
    const s = PRESETS[p]
    setPreset(p)
    setHires(s.hires)
    setGrowth(s.growth)
    setSettled({ preset: p, hires: s.hires, growth: s.growth })
    setRev((r) => r + 1)
  }
  const commit = (h: number, g: number) => {
    setSettled({ preset, hires: h, growth: g })
    setRev((r) => r + 1)
  }

  const runwayEnd = (m: Model) => (m.runway != null ? monLabel(Math.ceil(12 + m.runway)) : null)
  const floorLabel = (m: Model) => (m.floorAt != null ? monLabel(Math.ceil(12 + m.floorAt)) : null)
  const diff = (noteModel.runway ?? HORIZON) - (BASE_MODEL.runway ?? HORIZON)
  const noteText = (() => {
    const m = noteModel
    const cmp = Math.abs(diff) < 0.05 ? "This is the plan of record." : `That is ${Math.abs(diff).toFixed(1)} months ${diff < 0 ? "sooner" : "later"} than Base.`
    if (m.runway == null) return `Cash stays above zero for the full ${HORIZON} months in this scenario. ${cmp}`
    const fl = floorLabel(m)
    return `${fl ? `Cash slips under the ${fk(FLOOR)} floor in ${fl} and` : "Cash"} runs out in ${runwayEnd(m)}. ${cmp}`
  })()

  const exportCsv = () => {
    const rows = ["month,inflow_k,outflow_k,net_k,cash_k"]
    for (let k = 1; k <= 12; k++) rows.push(`${monLabel(12 + k)},${model.inflow[k - 1].toFixed(0)},${model.outflow[k - 1].toFixed(0)},${(model.inflow[k - 1] - model.outflow[k - 1]).toFixed(0)},${model.cash[k].toFixed(0)}`)
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `harbor-finch-cash-forecast-${PRESETS[preset].label.toLowerCase().replace(/\s+/g, "-")}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const runwayShown = tw.runway >= 35.95 ? "36+" : (tw.runway * intro).toFixed(1)
  const burnNeg = model.runway == null && model.burn < 0
  const gmDelta = tw.gm - 41.2
  const rwDiff = (model.runway ?? HORIZON) - (BASE_MODEL.runway ?? HORIZON)
  const lowest = tw.cash.reduce((a, b) => Math.min(a, b), Infinity)

  return (
    <Shell
      onNavigate={onNavigate}
      sideTools={sideTools}
      actions={
        <>
          <span className="ifi-period" aria-label="Period: October 2026">
            OCT 2026
          </span>
          <button type="button" className="ifi-btn" onClick={exportCsv}>
            <Download size={14} strokeWidth={1.5} />
            <span className="t">Export forecast</span>
          </button>
        </>
      }
    >
      <div className="ifi-page">
        <div className="ifi-read" role="group" aria-label="Key figures">
          <div className="ifi-rd">
            <span className="ifi-mono">Cash</span>
            <span className="v">{fm(CASH_NOW * intro)}</span>
            <span className="s">
              <b>−£128k</b> since 1 Oct
            </span>
          </div>
          <div className="ifi-rd">
            <span className="ifi-mono">Net burn</span>
            <span className="v">
              {burnNeg ? "+" : ""}
              {fk(Math.abs(tw.burn) * intro).replace("−", "")}
              <small>/mo</small>
            </span>
            <span className="s">
              Trailing 3 mo <b>£129k</b>
            </span>
          </div>
          <div className="ifi-rd">
            <span className="ifi-mono">Runway</span>
            <span className="v">
              {runwayShown}
              <small>mo</small>
            </span>
            <span className={`s`}>
              {model.runway == null ? "Beyond 36 months" : `Ends ${runwayEnd(model)}`}
              {Math.abs(rwDiff) >= 0.05 ? <b className={rwDiff < 0 ? "w" : ""}> · {rwDiff > 0 ? "+" : "−"}{Math.abs(rwDiff).toFixed(1)}</b> : null}
            </span>
          </div>
          <div className="ifi-rd">
            <span className="ifi-mono">Gross margin</span>
            <span className="v">
              {(tw.gm * intro).toFixed(1)}
              <small>%</small>
            </span>
            <span className="s">{Math.abs(gmDelta) < 0.05 ? <>+0.6 pts <b>vs last year</b></> : <>{gmDelta > 0 ? "+" : "−"}{Math.abs(gmDelta).toFixed(1)} pts <b>vs base</b></>}</span>
          </div>
          <div className="ifi-rd">
            <span className="ifi-mono">Spend MTD</span>
            <span className="v">
              {fk(SPEND_ACTUAL * intro)}
              <small>/ {fk(SPEND_BUDGET)}</small>
            </span>
            <span className="s">
              {Math.round((SPEND_ACTUAL / SPEND_BUDGET) * 100)}% of budget · <b>day 28/31</b>
            </span>
          </div>
        </div>

        <Card
          id="ifi-cash-h"
          label="Cash-flow forecast"
          title={
            <>
              Where the cash <em>goes</em>
            </>
          }
          sub="Twelve months of actuals, twelve of forecast. Change the scenario and the line, the band and the runway move together."
          aside={
            <div className="ifi-leg">
              <span>
                <i /> Actual
              </span>
              <span>
                <i className="dash" /> Forecast
              </span>
              <span>
                <i className="band" /> Uncertainty
              </span>
              <span>
                <i className="warn" /> Min cash
              </span>
            </div>
          }
        >
          <div className="ifi-hero-body">
            <div className="ifi-chartcol">
              <CashChart tw={tw} hover={hover} setHover={setHover} rev={rev} />
              <div className="ifi-fig">
                <span className="ifi-mono">FIG. 1 — Cash balance, Oct 2025 to Oct 2027, £. Dither density in the band is confidence; it thins as the horizon grows.</span>
              </div>
            </div>
            <div className="ifi-ctl">
              <div className="ifi-field">
                <span className="ifi-mono">Scenario</span>
                <Segmented
                  label="Scenario"
                  value={preset}
                  onChange={pick}
                  options={(Object.keys(PRESETS) as PresetKey[]).map((k) => ({ value: k, label: PRESETS[k].label }))}
                />
              </div>
              <div className="ifi-adj" aria-live="polite">
                {adjusted ? (
                  <>
                    <span className="ifi-mono">Adjusted from {PRESETS[preset].label}</span>
                    <button type="button" onClick={() => pick(preset)}>
                      Reset
                    </button>
                  </>
                ) : (
                  <span className="ifi-mono">Preset values</span>
                )}
              </div>
              <div className="ifi-ctl-row">
                <Ruler
                  label="New hires per month"
                  value={hires}
                  min={0}
                  max={6}
                  major={1}
                  fmt={(v) => String(v)}
                  unit="hires"
                  hint={`first 6 mo · £${HIRE_COST}k each`}
                  tickFmt={(v) => String(v)}
                  onChange={setHires}
                  onCommit={(v) => commit(v, growth)}
                />
                <Ruler
                  label="Revenue growth, yearly"
                  value={growth}
                  min={-10}
                  max={20}
                  major={5}
                  fmt={(v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}`}
                  unit="%"
                  hint="applies to inflows"
                  tickFmt={(v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0")}
                  onChange={setGrowth}
                  onCommit={(v) => commit(hires, v)}
                />
              </div>
              <dl className="ifi-kv">
                <div>
                  <dt>Runway end</dt>
                  <dd className={model.runway != null && model.runway < 12 ? "b" : ""}>{model.runway == null ? "36+ mo" : `${runwayEnd(model)}`}</dd>
                </div>
                <div>
                  <dt>Below {fk(FLOOR)} floor</dt>
                  <dd className={model.floorAt != null ? "w" : ""}>{model.floorAt == null ? "Not in 36 mo" : floorLabel(model)}</dd>
                </div>
                <div>
                  <dt>Cash in 12 mo</dt>
                  <dd className={tw.cash[11] < FLOOR ? "w" : ""}>{fm(tw.cash[11])}</dd>
                </div>
                <div>
                  <dt>Lowest in 12 mo</dt>
                  <dd>{fm(lowest)}</dd>
                </div>
              </dl>
              <div className="ifi-note">
                <span className="ifi-mono">
                  <i className="ifi-dot ok" aria-hidden="true" /> Atlas
                </span>
                <Typewriter key={noteText} text={noteText} />
              </div>
            </div>
          </div>
        </Card>

        <div className="ifi-pair a">
          <Card
            id="ifi-flow-h"
            label="Inflow and outflow"
            title={
              <>
                What comes in, what <em>leaves</em>
              </>
            }
            sub="Receipts above the axis, payments below, net as a tick. Hover a month to read it; the cash chart follows."
            aside={
              <div className="ifi-leg">
                <span>
                  <i className="bar" /> In
                </span>
                <span>
                  <i className="bar2" /> Out
                </span>
                <span>
                  <i className="hatch" /> Forecast
                </span>
              </div>
            }
          >
            <FlowChart tw={tw} hover={hover} setHover={setHover} />
            <div className="ifi-fig">
              <span className="ifi-mono">FIG. 2 — Monthly inflow and outflow, £k, Nov 2025 to Oct 2027. Stippled bars follow the scenario.</span>
            </div>
          </Card>
          <Card
            id="ifi-bud-h"
            label="Budget vs actual"
            title={
              <>
                Five teams, <em>one</em> month
              </>
            }
            sub={`£${SPEND_ACTUAL.toFixed(0)}k spent of £${SPEND_BUDGET}k. One team is over, and it is the one with a flagged invoice.`}
          >
            <BudgetBody />
          </Card>
        </div>

        <div className="ifi-pair b">
          <SpendCard />
          <SubsCard />
        </div>
      </div>
    </Shell>
  )
}
