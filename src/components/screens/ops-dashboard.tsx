"use client"

import * as React from "react"
import {
  BookOpenText,
  ChevronDown,
  Download,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Menu,
  PenLine,
  Pin,
  Radar,
  Search,
  Share2,
  Wallet,
  type LucideIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type OpsDashboardProps = {
  /** Called with the nav label ("Tasks", "Research desk" …) when a rail item or an "Investigate" link is used. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user row. */
  sideTools?: React.ReactNode
}

type RangeKey = "7D" | "30D" | "QTD" | "YTD"
type MetricKey = "revenue" | "orders" | "aov" | "conv" | "returns"

type Bucket = { t0: number; t1: number; rev: number; orders: number; visits: number; returns: number }
type RangeCfg = {
  key: RangeKey
  /** Days per bucket (0.25 = 6 hours). */
  step: number
  n: number
  fc: number
  /** Days the window looks back to find the comparison period. */
  shift: number
  name: string
  prevName: string
  fcName: string
}
type Unit = { pre: string; suf: string; scale: number; dp: number }
type MetricDef = {
  key: MetricKey
  label: string
  v: (b: Bucket) => number
  unit: (v: number) => Unit
  axis: (v: number) => string
  better: "up" | "down"
  pts: boolean
  bandK: number
}
type Series = { cfg: RangeCfg; hist: Bucket[]; prev: Bucket[]; fc: Bucket[] }

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const DAY = 864e5
const EPOCH = Date.UTC(2026, 0, 1)
/** Day index of "today" (22 Oct 2026) counted from 1 Jan 2026. */
const LAST = 294
const dayMs = (d: number) => EPOCH + d * DAY

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const fDay = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`
}
const fDowDay = (ms: number) => {
  const d = new Date(ms)
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`
}
const fHour = (ms: number) => String(new Date(ms).getUTCHours()).padStart(2, "0") + ":00"
const fNum = (x: number, dp: number) => x.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })

/** Deterministic hash noise, -1..1. */
function h32(a: number, b: number) {
  let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263)
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}
const nz = (d: number, s: number) => h32(d, s) * 2 - 1
const jit = (seed: number, i: number, amp: number) => 1 + amp * nz(seed * 31 + i, 77)

const WEEK = [1.07, 1.05, 0.98, 0.96, 0.97, 0.93, 0.96] // Sun..Sat
const inWin = (d: number, a: number, b: number) => d >= a && d <= b
const dowOf = (d: number) => (((4 + d) % 7) + 7) % 7 // 1 Jan 2026 is a Thursday

type DayRow = { visits: number; orders: number; rev: number; returns: number; aov: number; retRate: number }

/** One day of the Harbor & Finch shop. `expected` drops the noise: that is the forecast. */
function dayModel(d: number, expected: boolean): DayRow {
  const n = (s: number) => (expected ? 0 : nz(d, s))
  const wk = WEEK[dowOf(d)]
  const trend = 1 + 0.0005 * d
  const season = 1 + 0.17 * Math.sin((2 * Math.PI * (d - 235)) / 365)
  let vf = 1
  let cAdd = 0
  let aovF = 1
  if (inWin(d, 70, 73)) { vf *= 1.16; cAdd += 0.0025 } // spring range
  if (inWin(d, 176, 183)) { vf *= 1.24; cAdd += 0.004; aovF *= 0.95 } // summer sale
  if (inWin(d, 280, 284)) { vf *= 1.36; cAdd += 0.006; aovF *= 0.94 } // autumn sale
  if (inWin(d, 301, 303)) vf *= 1.12 // winter edit email (forecast)
  if (d === 292) { vf *= 0.97; cAdd -= 0.0042 } // checkout outage, 42 min
  const visits = 17800 * trend * season * wk * vf * (1 + 0.05 * n(1))
  const conv = 0.0306 + (wk - 1) * 0.012 + cAdd + 0.0013 * n(2)
  const aov = 63 * (1 + 0.0003 * d) * aovF * (1 + 0.035 * n(3))
  const retRate = 0.07 + 0.0035 * n(4) + (inWin(d, 285, 296) ? 0.007 : 0)
  const orders = visits * conv
  return { visits, orders, rev: orders * aov, returns: orders * retRate, aov, retRate }
}

const RANGES: Record<RangeKey, RangeCfg> = {
  "7D": { key: "7D", step: 0.25, n: 28, fc: 12, shift: 7, name: "7 days", prevName: "prior 7D", fcName: "+3D" },
  "30D": { key: "30D", step: 1, n: 30, fc: 14, shift: 30, name: "30 days", prevName: "prior 30D", fcName: "+14D" },
  QTD: { key: "QTD", step: 7, n: 12, fc: 2, shift: 84, name: "quarter to date", prevName: "prior quarter", fcName: "+14D" },
  YTD: { key: "YTD", step: 7, n: 42, fc: 4, shift: 365, name: "year to date", prevName: "last year", fcName: "+28D" },
}
const RANGE_KEYS: RangeKey[] = ["7D", "30D", "QTD", "YTD"]
const SEED: Record<RangeKey, number> = { "7D": 11, "30D": 23, QTD: 37, YTD: 53 }

function mkBucket(startD: number, i: number, cfg: RangeCfg, expected: boolean): Bucket {
  if (cfg.step < 1) {
    const day = startD + Math.floor(i / 4)
    const k = i % 4
    const m = dayModel(day, expected)
    const jv = [0.1, 0.26, 0.31, 0.33].map((w, q) => w * (expected ? 1 : 1 + 0.06 * nz(day * 4 + q, 11)))
    const jo = [0.08, 0.26, 0.32, 0.34].map(
      (w, q) => w * (expected ? 1 : 1 + 0.07 * nz(day * 4 + q, 12)) * (day === 292 && q === 2 ? 0.45 : 1),
    )
    const sv = jv.reduce((a, b) => a + b, 0)
    const so = jo.reduce((a, b) => a + b, 0)
    const orders = (m.orders * jo[k]) / so
    const quarter = DAY / 4
    return {
      t0: dayMs(startD) + i * quarter,
      t1: dayMs(startD) + (i + 1) * quarter,
      visits: (m.visits * jv[k]) / sv,
      orders,
      rev: orders * m.aov * (expected ? 1 : 1 + 0.02 * nz(day * 4 + k, 13)),
      returns: orders * m.retRate,
    }
  }
  const b: Bucket = { t0: dayMs(startD + i * cfg.step), t1: dayMs(startD + (i + 1) * cfg.step), rev: 0, orders: 0, visits: 0, returns: 0 }
  for (let j = 0; j < cfg.step; j++) {
    const m = dayModel(startD + i * cfg.step + j, expected)
    b.rev += m.rev
    b.orders += m.orders
    b.visits += m.visits
    b.returns += m.returns
  }
  return b
}

const seriesCache = new Map<RangeKey, Series>()
function getSeries(key: RangeKey): Series {
  const hit = seriesCache.get(key)
  if (hit) return hit
  const cfg = RANGES[key]
  const days = cfg.n * cfg.step
  const startD = LAST - days + 1
  const hist = Array.from({ length: cfg.n }, (_, i) => mkBucket(startD, i, cfg, false))
  const prev = Array.from({ length: cfg.n }, (_, i) => mkBucket(startD - cfg.shift, i, cfg, false))
  const fc = Array.from({ length: cfg.fc }, (_, i) => mkBucket(LAST + 1, i, cfg, true))
  const s = { cfg, hist, prev, fc }
  seriesCache.set(key, s)
  return s
}

const sumB = (bs: Bucket[]): Bucket =>
  bs.reduce(
    (a, b) => ({ t0: a.t0, t1: b.t1, rev: a.rev + b.rev, orders: a.orders + b.orders, visits: a.visits + b.visits, returns: a.returns + b.returns }),
    { t0: bs[0].t0, t1: bs[0].t1, rev: 0, orders: 0, visits: 0, returns: 0 },
  )

/* ------------------------------- Metrics --------------------------------- */

const money = (v: number, big = true): string => {
  if (big && v >= 1e6) return `£${(v / 1e6).toFixed(2)}m`
  if (big && v >= 1e3) return `£${(v / 1e3).toFixed(1)}k`
  return `£${fNum(v, 0)}`
}

const METRICS: Record<MetricKey, MetricDef> = {
  revenue: {
    key: "revenue",
    label: "Revenue",
    v: (b) => b.rev,
    unit: (v) => (v >= 1e6 ? { pre: "£", suf: "m", scale: 1e6, dp: 2 } : v >= 1e3 ? { pre: "£", suf: "k", scale: 1e3, dp: 1 } : { pre: "£", suf: "", scale: 1, dp: 0 }),
    axis: (v) => (v >= 1e6 ? `£${+(v / 1e6).toFixed(2)}m` : v >= 1e3 ? `£${+(v / 1e3).toFixed(1)}k` : `£${Math.round(v)}`),
    better: "up",
    pts: false,
    bandK: 1,
  },
  orders: {
    key: "orders",
    label: "Orders",
    v: (b) => b.orders,
    unit: () => ({ pre: "", suf: "", scale: 1, dp: 0 }),
    axis: (v) => (v >= 1e4 ? `${+(v / 1e3).toFixed(1)}k` : fNum(v, 0)),
    better: "up",
    pts: false,
    bandK: 1,
  },
  aov: {
    key: "aov",
    label: "Average order",
    v: (b) => b.rev / b.orders,
    unit: () => ({ pre: "£", suf: "", scale: 1, dp: 2 }),
    axis: (v) => `£${Math.round(v)}`,
    better: "up",
    pts: false,
    bandK: 0.45,
  },
  conv: {
    key: "conv",
    label: "Conversion",
    v: (b) => b.orders / b.visits,
    unit: () => ({ pre: "", suf: "%", scale: 0.01, dp: 2 }),
    axis: (v) => `${(v * 100).toFixed(1)}%`,
    better: "up",
    pts: true,
    bandK: 0.5,
  },
  returns: {
    key: "returns",
    label: "Returns rate",
    v: (b) => b.returns / b.orders,
    unit: () => ({ pre: "", suf: "%", scale: 0.01, dp: 1 }),
    axis: (v) => `${(v * 100).toFixed(1)}%`,
    better: "down",
    pts: true,
    bandK: 0.45,
  },
}
const METRIC_KEYS: MetricKey[] = ["revenue", "orders", "aov", "conv", "returns"]

const fmtFull = (m: MetricDef, v: number) => {
  const u = m.unit(v)
  return `${u.pre}${fNum(v / u.scale, u.dp)}${u.suf}`
}

type Delta = { text: string; tone: "ok" | "bad" | "flat"; pct: number }
function deltaOf(m: MetricDef, cur: number, prev: number): Delta {
  const raw = m.pts ? (cur - prev) * 100 : prev ? (cur / prev - 1) * 100 : 0
  const mag = Math.abs(raw)
  if (mag < (m.pts ? 0.005 : 0.05)) return { text: "– 0.0%", tone: "flat", pct: 0 }
  const up = raw > 0
  const good = m.better === "up" ? up : !up
  return {
    text: `${up ? "▲" : "▼"} ${mag.toFixed(m.pts ? 2 : 1)}${m.pts ? " pt" : "%"}`,
    tone: good ? "ok" : "bad",
    pct: raw,
  }
}

function niceTicks(lo: number, hi: number, count = 4) {
  const raw = (hi - lo) / count || 1
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
  const a = Math.floor(lo / step + 1e-9) * step
  const b = Math.ceil(hi / step - 1e-9) * step
  const out: number[] = []
  for (let v = a; v <= b + step / 2; v += step) out.push(+v.toPrecision(12))
  return out
}

/* --------------------------- Other breakdown data ------------------------- */

const CHANNELS = [
  { name: "Organic search", w: 0.31 },
  { name: "Paid search", w: 0.22 },
  { name: "Email & SMS", w: 0.17 },
  { name: "Direct", w: 0.14 },
  { name: "Social", w: 0.09 },
  { name: "Affiliates", w: 0.07 },
]

function channelsFor(total: number, seed: number, emailBoost: number) {
  const raw = CHANNELS.map((c, i) => c.w * jit(seed, i, 0.07) * (i === 2 ? emailBoost : 1))
  const s = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => (r / s) * total)
}

const REGIONS = [
  { code: "SCT", name: "Scotland", w: 0.065, c: 2, r: 0 },
  { code: "NIR", name: "Northern Ireland", w: 0.02, c: 0, r: 1 },
  { code: "NW", name: "North West", w: 0.095, c: 2, r: 1 },
  { code: "NE", name: "North East", w: 0.035, c: 3, r: 1 },
  { code: "WAL", name: "Wales", w: 0.04, c: 1, r: 2 },
  { code: "WM", name: "West Midlands", w: 0.075, c: 2, r: 2 },
  { code: "YH", name: "Yorkshire & Humber", w: 0.075, c: 3, r: 2 },
  { code: "EM", name: "East Midlands", w: 0.055, c: 2, r: 3 },
  { code: "EoE", name: "East of England", w: 0.08, c: 3, r: 3 },
  { code: "SW", name: "South West", w: 0.085, c: 1, r: 4 },
  { code: "SE", name: "South East", w: 0.16, c: 2, r: 4 },
  { code: "LON", name: "London", w: 0.215, c: 3, r: 4 },
]

function regionsFor(total: number, seed: number) {
  const raw = REGIONS.map((g, i) => g.w * jit(seed, i + 20, 0.06))
  const s = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => (r / s) * total)
}

const PRODUCTS = [
  { name: "Linen duvet set", variant: "Oat · King", price: 89, w: 0.045 },
  { name: "Stoneware mug set", variant: "Chalk · Set of 4", price: 34, w: 0.075 },
  { name: "Brass arc table lamp", variant: "Warm brass", price: 112, w: 0.028 },
  { name: "Oak serving board", variant: "Large · Oiled", price: 42, w: 0.05 },
  { name: "Wool throw", variant: "Heather · 130 × 180", price: 68, w: 0.04 },
  { name: "Ceramic planter", variant: "Large · Sand", price: 38, w: 0.05 },
  { name: "Beeswax candle trio", variant: "Unscented", price: 24, w: 0.065 },
  { name: "Cotton bath towels", variant: "Fog · Set of 6", price: 58, w: 0.04 },
]

function productsFor(orders: number, prevOrders: number, seed: number) {
  const rows = PRODUCTS.map((p, i) => {
    const units = orders * 1.8 * p.w * jit(seed, i + 50, 0.12)
    const pu = prevOrders * 1.8 * p.w * jit(seed + 1000, i + 50, 0.12)
    const slope = nz(seed * 7 + i, 5) * 0.55
    const spark = Array.from({ length: 10 }, (_, t) => 1 + slope * (t / 9 - 0.5) + 0.1 * nz(seed * 100 + i * 13 + t, 6))
    return { ...p, units, revenue: units * p.price * 0.96, delta: units / pu - 1, spark }
  })
  return rows.sort((a, b) => b.revenue - a.revenue).slice(0, 8)
}

const FUNNEL = ["Visits", "Product view", "Cart", "Checkout", "Paid"]

/* -------------------------------------------------------------------------- */
/*                               Dither + motion                              */
/* -------------------------------------------------------------------------- */

const BAYER: number[][] = (() => {
  let m = [[0]]
  while (m.length < 8) {
    const n = m.length
    const next: number[][] = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0))
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + n] = v + 2
        next[y + n][x] = v + 3
        next[y + n][x + n] = v + 1
      }
    }
    m = next
  }
  return m
})()

const tileCache = new Map<number, string>()
/** CSS `url()` of an 8x8 Bayer tile (2px dots) at the given density; used as a mask so the colour stays themeable. */
function tile(density: number) {
  const level = clamp(Math.round(density * 64), 1, 63)
  const hit = tileCache.get(level)
  if (hit) return hit
  let d = ""
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (BAYER[y][x] < level) d += `M${x} ${y}h1v1h-1z`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 8 8" shape-rendering="crispEdges"><path d="${d}"/></svg>`
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  tileCache.set(level, url)
  return url
}

const prefersReduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** A number that counts to its value, overshoots by under 2%, and settles. Text is written straight to the DOM. */
function Num({ value, dp = 0, dur = 950 }: { value: number; dp?: number; dur?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const last = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const text = (x: number) => fNum(x, dp)
    const from = last.current ?? 0
    last.current = value
    if (from === value || prefersReduced()) {
      el.textContent = text(value)
      return
    }
    const over = (value - from) * 0.015
    const start = performance.now()
    el.textContent = text(from)
    let raf = 0
    const tick = (now: number) => {
      const p = clamp((now - start) / dur, 0, 1)
      let x: number
      if (p < 0.78) {
        const q = p / 0.78
        x = from + (value - from + over) * (1 - Math.pow(1 - q, 3))
      } else {
        const q = (p - 0.78) / 0.22
        x = value + over * (1 - (q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2))
      }
      el.textContent = text(x)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const fallback = window.setTimeout(() => {
      el.textContent = text(value)
    }, dur + 200)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
      el.textContent = text(value)
    }
  }, [value, dp, dur])
  return <span ref={ref}>{fNum(value, dp)}</span>
}

/** Agent text: steady typewriter with a block caret. Layout is reserved up front so nothing jumps. */
function Typed({ text, delay = 0, cps = 80 }: { text: string; delay?: number; cps?: number }) {
  const [n, setN] = React.useState(() => (prefersReduced() ? text.length : 0))
  React.useEffect(() => {
    if (n >= text.length) return
    const t0 = Date.now() + delay
    const id = window.setInterval(() => {
      const k = clamp(Math.floor(((Date.now() - t0) / 1000) * cps), 0, text.length)
      setN(k)
      if (k >= text.length) window.clearInterval(id)
    }, 32)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, cps])
  const typing = n < text.length
  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, n)}
        {typing && n > 0 && <span className="idb-caret" />}
        <span className="idb-rest">{text.slice(n)}</span>
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.idb {
  --idb-paper: #fafafa;
  --idb-sheet: #ffffff;
  --idb-ink: #0a0a0a;
  --idb-signal: #0060e2;
  --idb-accent: var(--idb-signal);
  --idb-surface: var(--idb-sheet);
  --idb-signal-soft: color-mix(in oklab, var(--idb-accent) 12%, transparent);
  --idb-t1: color-mix(in oklab, var(--idb-ink) 92%, transparent);
  --idb-t2: color-mix(in oklab, var(--idb-ink) 64%, transparent);
  --idb-t3: color-mix(in oklab, var(--idb-ink) 44%, transparent);
  --idb-t4: color-mix(in oklab, var(--idb-ink) 22%, transparent);
  --idb-rule: color-mix(in oklab, var(--idb-ink) 14%, transparent);
  --idb-rule-2: color-mix(in oklab, var(--idb-ink) 7%, transparent);
  --idb-ok: #1f8a4c; --idb-warn: #b7791f; --idb-bad: #c4321a;
  --idb-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --idb-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --idb-font: var(--idb-sans);
  --idb-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --idb-ease: cubic-bezier(.2, .8, .2, 1);
  --idb-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; display: flex;
  height: 100%; min-height: 0; overflow: hidden;
  background: var(--idb-paper); font: 13px/20px var(--idb-font); color: var(--idb-t1);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .idb {
  --idb-paper: #0c0c0d; --idb-sheet: #1c1c1e; --idb-ink: #f5f5f5; --idb-signal: #4d8dff;
  --idb-ok: #4cc27f; --idb-warn: #e0a64a; --idb-bad: #ff7a62;
}
.idb *, .idb *::before, .idb *::after { box-sizing: border-box }
:where(.idb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.idb) input { font: inherit; color: inherit; margin: 0 }
:where(.idb) :is(ul, ol) { list-style: none; margin: 0; padding: 0 }
:where(.idb) :is(h1, h2, p) { margin: 0; font-weight: 400 }
.idb svg { flex: none }
.idb :focus-visible { outline: 2px solid color-mix(in oklab, var(--idb-accent) 60%, transparent); outline-offset: 1px }
.idb .sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Shared type */
.idb-lab { font: 500 10.5px/16px var(--idb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--idb-t3) }
.idb-num { font-family: var(--idb-mono); font-variant-numeric: tabular-nums }
.idb-ok { color: var(--idb-ok) } .idb-bad { color: var(--idb-bad) } .idb-flat { color: var(--idb-t3) }
.idb-dith { background: var(--idb-ink); -webkit-mask-image: var(--m); mask-image: var(--m); -webkit-mask-size: 16px 16px; mask-size: 16px 16px }

/* ----------------------------------- Rail + top bar ---------------------------------- */
.idb-rlab { font-family: var(--idb-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--idb-t3) }
.idb-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--idb-sheet); border-right: 1px solid var(--idb-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.idb-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--idb-serif); letter-spacing: -.01em; color: var(--idb-ink) }
.idb-brand svg { flex: none }
.idb-rgroup { padding: 0 12px; margin-top: 12px }
.idb-rgroup > .idb-rlab { padding: 0 6px; margin-bottom: 6px; display: block }
.idb-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--idb-rule); background: var(--idb-paper); color: var(--idb-t1); transition: box-shadow .2s var(--idb-ease) }
.idb-ws:hover { box-shadow: 0 0 0 1px var(--idb-t4) }
.idb-ws svg { color: var(--idb-t3) }
.idb-rnav { position: relative; margin: 0 0 0 8px; padding: 0 }
.idb-rnav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--idb-rule) }
.idb-ritem { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--idb-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--idb-ease), background-color .2s var(--idb-ease) }
.idb-ritem:hover { color: var(--idb-t1); background: var(--idb-rule-2) }
.idb-ritem svg { flex: none; stroke-width: 1.5 }
.idb-ritem.is-active { color: var(--idb-ink) }
.idb-ritem.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--idb-accent); transform-origin: top; animation: idb-rtick .5s var(--idb-ease) backwards }
.idb-ragent { padding-left: 16px }
.idb-rdot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--idb-t4); position: relative }
.idb-rdot.ok { background: var(--idb-ok) }
.idb-rdot.live { background: var(--idb-accent) }
.idb-rdot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--idb-accent); animation: idb-rpulse 1.6s var(--idb-ease) infinite }
.idb-ragent .idb-rlab { margin-left: auto; font-size: 9.5px }
.idb-rspacer { flex: 1; min-height: 12px }
.idb-ruser { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--idb-rule) }
.idb-rav { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--idb-ink); color: var(--idb-paper); font: 600 10px/1 var(--idb-mono); letter-spacing: .04em }
.idb-ruser b { font-weight: 500; color: var(--idb-t1); display: block; line-height: 16px }
.idb-ruser div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--idb-t3) }
.idb-sidetools { padding: 8px 12px }
.idb-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--idb-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--idb-ease) }

/* ---- main + top bar ---- */
.idb-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--idb-rule); background: var(--idb-paper) }
.idb-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--idb-rule); background: var(--idb-sheet) }
.idb-ttl { min-width: 0 }
.idb-ttl .idb-crumb { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.idb-ttl h1 { margin: 0; font: 400 22px/24px var(--idb-serif); letter-spacing: -.01em; color: var(--idb-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.idb-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.idb-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--idb-rule); background: var(--idb-sheet); color: var(--idb-t3); transition: box-shadow .2s var(--idb-ease) }
.idb-search:hover { box-shadow: 0 0 0 1px var(--idb-t4) }
.idb-search span { flex: 1 }
.idb-search kbd { font: 500 10px/14px var(--idb-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--idb-rule); color: var(--idb-t3) }
.idb-tbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--idb-rule); background: var(--idb-sheet); color: var(--idb-t1); font-weight: 500; transition: box-shadow .2s var(--idb-ease), opacity .2s }
.idb-tbtn svg { flex: none }
.idb-tbtn:hover { box-shadow: 0 0 0 1px var(--idb-t3) }
.idb-tbtn.ink { background: var(--idb-ink); color: var(--idb-paper); box-shadow: none }
.idb-tbtn.ink:hover { opacity: .88 }
.idb-search input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; outline: 0; background: none; color: var(--idb-t1); font: inherit; -webkit-appearance: none; appearance: none }
.idb-search input::placeholder { color: var(--idb-t3); opacity: 1 }
.idb-search input::-webkit-search-cancel-button { display: none }
.idb-search:focus-within { box-shadow: 0 0 0 1px var(--idb-t3) }
@keyframes idb-rpulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes idb-rtick { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* ---- rail + top bar: responsive (shared by all Meridian screens) ---- */
@media (max-width: 1023px) {
  .idb-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--idb-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--idb-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .idb.is-open .idb-rail { transform: none; visibility: visible; transition: transform .32s var(--idb-ease), visibility 0s }
  .idb.is-open .idb-scrim { opacity: 1; pointer-events: auto }
  .idb-menu { display: grid }
}
@media (max-width: 1099px) { .idb-search { display: none } }
@media (max-width: 767px) {
  .idb-top { padding: 0 12px; gap: 10px }
  .idb-ttl .idb-crumb { display: none }
  .idb-ttl h1 { font-size: 21px }
}

/* status dots used by the agent notes in the body */
.idb-dot { position: relative; flex: none; width: 6px; height: 6px; border-radius: 50% }
.idb-dot[data-s="live"] { background: var(--idb-accent) }
.idb-dot[data-s="live"]::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--idb-accent); animation: idb-pulse 1.6s var(--idb-ease) infinite }
.idb-dot[data-s="busy"] { background: var(--idb-ink) }
.idb-dot[data-s="idle"] { box-shadow: inset 0 0 0 1px var(--idb-t3) }
@keyframes idb-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }

/* --------------------------------- Top bar --------------------------------- */
.idb-col { flex: 1; display: grid; grid-template-rows: 52px minmax(0, 1fr); min-width: 0; min-height: 0 }
.idb-tbtn span { display: none }
@media (max-width: 599px) { .idb-tbtn { padding: 0; width: 30px } }
@media (min-width: 600px) { .idb-tbtn span { display: inline } }
.idb-toast { position: absolute; z-index: 60; top: 60px; right: 16px; padding: 6px 10px; border-radius: 2px; background: var(--idb-ink); color: var(--idb-paper); font: 500 10.5px/16px var(--idb-mono); letter-spacing: .08em; text-transform: uppercase; animation: idb-rise .3s var(--idb-ease) backwards }
@media (min-width: 1024px) { .idb-toast { right: 28px } }

/* --------------------------------- Body ---------------------------------- */
.idb-body { overflow-y: auto; overflow-x: hidden; min-height: 0; scrollbar-width: thin; container: idb / inline-size }
.idb-pad { max-width: 1480px; margin: 0 auto; padding: 18px 16px 56px }
@media (min-width: 768px) { .idb-pad { padding: 22px 28px 64px } }
.idb-tb { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 22px; margin-bottom: 22px }
.idb-tb-date { font: 500 10.5px/16px var(--idb-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--idb-t3) }
.idb-tb-date b { font-weight: 500; color: var(--idb-t2) }
.idb-tb-live { margin-left: auto; font: 500 10.5px/16px var(--idb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--idb-t3) }
@media (max-width: 767px) { .idb-tb-live { display: none } }

.idb-seg { position: relative; display: inline-grid; grid-template-columns: repeat(4, 50px); height: 30px; border-radius: 2px; background: var(--idb-sheet); box-shadow: 0 0 0 1px var(--idb-rule) }
.idb-seg-thumb { position: absolute; left: 0; top: 0; bottom: 0; width: 25%; border-radius: 2px; background: var(--idb-ink); transform: translateX(calc(var(--i) * 100%)); transition: transform .3s var(--idb-ease) }
.idb-seg button { position: relative; z-index: 1; display: grid; place-items: center; font: 500 11.5px/1 var(--idb-mono); letter-spacing: .06em; color: var(--idb-t2); transition: color .2s var(--idb-ease) }
.idb-seg button:hover { color: var(--idb-ink) }
.idb-seg button[aria-checked="true"] { color: var(--idb-paper) }
.idb-sw { display: inline-flex; align-items: center; gap: 9px; height: 30px; color: var(--idb-t2) }
.idb-sw-track { position: relative; width: 28px; height: 14px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--idb-t4); transition: background-color .2s var(--idb-ease), box-shadow .2s var(--idb-ease) }
.idb-sw-track::after { content: ""; position: absolute; left: 3px; top: 3px; width: 8px; height: 8px; border-radius: 1px; background: var(--idb-t3); transition: transform .26s var(--idb-ease), background-color .2s }
.idb-sw[aria-checked="true"] { color: var(--idb-ink) }
.idb-sw[aria-checked="true"] .idb-sw-track { background: var(--idb-ink); box-shadow: none }
.idb-sw[aria-checked="true"] .idb-sw-track::after { transform: translateX(14px); background: var(--idb-paper) }
.idb-sw-key { display: inline-block; width: 14px; height: 0; border-top: 1.5px dashed var(--idb-t3) }

/* Layout rows: content | margin notes */
.idb-row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; margin-bottom: 30px }
.idb-main { display: grid; gap: 20px; min-width: 0; align-content: start }
@container idb (min-width: 1000px) {
  .idb-row { grid-template-columns: minmax(0, 1fr) 264px; column-gap: 34px }
}
.idb-pair { display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr) }
@container idb (min-width: 760px) and (max-width: 999px) { .idb-pair { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr) } }
@container idb (min-width: 1120px) { .idb-pair { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr) } }

/* Cards */
.idb-card { position: relative; min-width: 0; padding: 18px 20px 14px; border-radius: 2px; background: var(--idb-surface); box-shadow: 0 0 0 1px var(--idb-rule); animation: idb-rise .55s var(--idb-ease) backwards; animation-delay: var(--dl, 0s) }
@keyframes idb-rise { from { opacity: 0; transform: translateY(6px) } }
.idb-crop { position: absolute; width: 8px; height: 8px; border: 0 solid var(--idb-t4); pointer-events: none }
.idb-crop[data-c="tl"] { left: -5px; top: -5px; border-width: 1px 0 0 1px }
.idb-crop[data-c="tr"] { right: -5px; top: -5px; border-width: 1px 1px 0 0 }
.idb-crop[data-c="bl"] { left: -5px; bottom: -5px; border-width: 0 0 1px 1px }
.idb-crop[data-c="br"] { right: -5px; bottom: -5px; border-width: 0 1px 1px 0 }
.idb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px }
.idb-h { margin-top: 1px; font: 400 24px/28px var(--idb-serif); letter-spacing: -.01em }
.idb-h em { font-style: italic }
.idb-h[data-s="sm"] { font-size: 21px; line-height: 25px }
.idb-sub { margin-top: 2px; color: var(--idb-t2); font-size: 12.5px; line-height: 18px; max-width: 56ch }
.idb-fig { margin-top: 12px; padding-top: 9px; border-top: 1px solid var(--idb-rule-2); font: 500 10.5px/16px var(--idb-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--idb-t3) }
.idb-readout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 14px; box-shadow: 0 -1px 0 var(--idb-rule-2) }
.idb-readout > div { min-width: 0; padding: 8px 12px 8px 0; box-shadow: 0 1px 0 var(--idb-rule-2) }
.idb-readout > div:nth-child(even) { padding-left: 12px; box-shadow: -1px 0 0 var(--idb-rule-2), 0 1px 0 var(--idb-rule-2) }
.idb-readout b { display: block; margin-top: 1px; font: 400 14px/20px var(--idb-mono); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.idb-readout small { font: 500 10.5px/16px var(--idb-mono); letter-spacing: .04em; color: var(--idb-t3); margin-left: 6px }
.idb-readout[data-n="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)) }
.idb-readout[data-n="3"] > div:nth-child(even) { padding-left: 0; box-shadow: 0 1px 0 var(--idb-rule-2) }
.idb-readout[data-n="3"] > div + div { padding-left: 12px; box-shadow: -1px 0 0 var(--idb-rule-2), 0 1px 0 var(--idb-rule-2) }
@container idb (min-width: 560px) {
  .idb-readout[data-n="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)) }
  .idb-readout[data-n="4"] > div:nth-child(even) { padding-left: 12px }
  .idb-readout[data-n="4"] > div + div { padding-left: 12px; box-shadow: -1px 0 0 var(--idb-rule-2), 0 1px 0 var(--idb-rule-2) }
}

/* ----------------------------------- KPIs ---------------------------------- */
.idb-kpis { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-radius: 2px; background: var(--idb-surface); box-shadow: 0 0 0 1px var(--idb-rule); animation: idb-rise .55s var(--idb-ease) backwards }
.idb-kpi { position: relative; display: flex; flex-direction: column; min-width: 0; padding: 14px 16px 12px; border-left: 1px solid var(--idb-rule); text-align: left; transition: background-color .2s var(--idb-ease) }
.idb-kpi:first-of-type { border-left: 0 }
.idb-kpi:hover { background: var(--idb-rule-2) }
.idb-kpi::before { content: ""; position: absolute; left: 0; top: 12px; bottom: 12px; width: 2px; background: var(--idb-accent); transform: scaleY(0); transform-origin: top; transition: transform .3s var(--idb-ease) }
.idb-kpi[aria-pressed="true"]::before { transform: scaleY(1) }
.idb-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px }
.idb-kpi-top svg { width: 12px; height: 12px; color: var(--idb-t4); transition: color .2s, transform .3s var(--idb-ease) }
.idb-kpi:hover .idb-kpi-top svg { color: var(--idb-t3) }
.idb-kpi[aria-pressed="true"] .idb-kpi-top svg { color: var(--idb-ink); transform: rotate(-18deg) }
.idb-kpi-big { margin-top: 6px; font: 400 26px/32px var(--idb-mono); font-variant-numeric: tabular-nums; letter-spacing: -.03em; white-space: nowrap; color: var(--idb-ink) }
.idb-kpi-big small { font-size: 15px; color: var(--idb-t3); letter-spacing: 0 }
.idb-kpi-big small:first-child { margin-right: 1px }
.idb-kpi-d { display: flex; flex-wrap: wrap; gap: 0 8px; align-items: baseline; margin-top: 2px; font: 500 11.5px/18px var(--idb-mono); letter-spacing: .01em; white-space: nowrap }
.idb-kpi-d i { font-style: normal; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--idb-t3) }
.idb-spark { position: relative; height: 30px; margin: 10px 4px 0 0 }
.idb-spark svg { display: block; width: 100%; height: 100% }
.idb-spark-dot { position: absolute; width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; border-radius: 50%; background: var(--idb-ink); animation: idb-pop .3s var(--idb-ease) .85s backwards }
@keyframes idb-pop { from { opacity: 0; transform: scale(.4) } }
@container idb (max-width: 719px) {
  .idb-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .idb-kpi { border-left: 0; border-top: 1px solid var(--idb-rule) }
  .idb-kpi:nth-of-type(even) { border-left: 1px solid var(--idb-rule) }
  .idb-kpi:nth-of-type(-n+2) { border-top: 0 }
  .idb-kpi:last-of-type { grid-column: 1 / -1; border-left: 0 }
}

/* ----------------------------- Trace + scan motion -------------------------- */
.idb-trace { stroke-dasharray: 1; stroke-dashoffset: 0; animation: idb-trace var(--d, .9s) var(--idb-ease-trace) var(--dl, 0s) backwards }
@keyframes idb-trace { from { stroke-dashoffset: 1 } }
.idb-reveal { animation: idb-reveal var(--d, .9s) var(--idb-ease-trace) var(--dl, 0s) backwards }
@keyframes idb-reveal { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
.idb-scan { position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--idb-accent); opacity: 0; pointer-events: none; animation: idb-scan .9s var(--idb-ease-trace) backwards }
@keyframes idb-scan { 0% { transform: translateX(0); opacity: 1 } 88% { opacity: 1 } 100% { transform: translateX(var(--pw)); opacity: 0 } }
.idb-fade { animation: idb-fade .5s var(--idb-ease) var(--dl, .7s) backwards }
@keyframes idb-fade { from { opacity: 0 } }

/* ----------------------------------- Chart --------------------------------- */
.idb-chart { position: relative; width: 100%; outline: none; touch-action: pan-y }
.idb-chart:focus-visible { outline: 2px solid color-mix(in oklab, var(--idb-accent) 60%, transparent); outline-offset: 2px }
.idb-lyr { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible }
.idb-chart text { font-family: var(--idb-mono); font-size: 10px; letter-spacing: .04em; fill: var(--idb-t3) }
.idb-chart .t-up { text-transform: uppercase; letter-spacing: .08em }
.idb-hit { position: absolute; cursor: crosshair }
.idb-grid { position: absolute; pointer-events: none; background-image: radial-gradient(circle, var(--idb-t4) .6px, transparent .8px); background-size: 8px 8px; opacity: .55; -webkit-mask-image: radial-gradient(ellipse at center, #000 40%, transparent 100%); mask-image: radial-gradient(ellipse at center, #000 40%, transparent 100%) }
.idb-tip { position: absolute; z-index: 5; pointer-events: none; min-width: 148px; padding: 9px 11px 10px; border-radius: 4px; background: var(--idb-surface); box-shadow: 0 0 0 1px var(--idb-rule), 0 1px 0 var(--idb-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
.idb-tip-v { display: block; margin-top: 2px; font: 400 18px/22px var(--idb-mono); letter-spacing: -.02em; color: var(--idb-ink) }
.idb-tip-r { display: flex; justify-content: space-between; gap: 14px; margin-top: 4px; font: 500 11px/16px var(--idb-mono); color: var(--idb-t2) }
.idb-tip-r span:first-child { color: var(--idb-t3); text-transform: uppercase; letter-spacing: .06em; font-size: 10px }
.idb-key { display: inline-flex; align-items: center; gap: 8px; font: 500 10.5px/16px var(--idb-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--idb-t3); white-space: nowrap }
.idb-key i { display: inline-block; width: 14px; height: 0; border-top: 1.5px solid var(--idb-ink) }
.idb-key i[data-k="prev"] { border-top: 1.5px dashed var(--idb-t3) }
.idb-key i[data-k="band"] { width: 14px; height: 8px; border: 0; background: var(--idb-ink); -webkit-mask-image: var(--m); mask-image: var(--m); -webkit-mask-size: 16px 16px; mask-size: 16px 16px }
.idb-keys { display: flex; flex-wrap: wrap; gap: 4px 16px; justify-content: flex-end }

/* -------------------------------- Margin notes ------------------------------ */
.idb-note { position: relative; margin-left: 10px; padding: 14px 0 4px 16px; border-left: 1px solid var(--idb-rule) }
.idb-note-q { font: italic 400 19px/25px var(--idb-serif); letter-spacing: -.005em; color: var(--idb-t1) }
.idb-caret { display: inline-block; width: .5em; height: 1em; margin-left: 1px; vertical-align: -.14em; background: var(--idb-ink); animation: idb-blink 1s steps(1) infinite }
@keyframes idb-blink { 50% { opacity: 0 } }
.idb-rest { visibility: hidden }
.idb-note-by { display: flex; align-items: center; gap: 8px; margin-bottom: 8px }
.idb-note-ev { display: flex; align-items: center; gap: 10px; margin-top: 12px; font: 500 10px/16px var(--idb-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--idb-t3) }
.idb-conf { display: inline-block; width: 36px; height: 8px; vertical-align: -1px }
.idb-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; font: 500 11px/18px var(--idb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--idb-ink); border-bottom: 1px solid var(--idb-t4); transition: border-color .2s var(--idb-ease) }
.idb-link:hover { border-color: var(--idb-ink) }
.idb-mhead { display: none }
.idb-join { visibility: hidden; position: absolute; right: 100%; top: 10px; width: 34px; height: 1px; background: var(--idb-t3); transform-origin: right; animation: idb-join .6s var(--idb-ease-trace) .9s backwards }
.idb-join::before { content: ""; position: absolute; left: -3px; top: -3px; width: 7px; height: 7px; border-radius: 50%; background: var(--idb-paper); box-shadow: inset 0 0 0 1px var(--idb-t2) }
@container idb (min-width: 1000px) {
  .idb-note { margin-left: 0; padding-top: 0; border-left: 0; padding-left: 0; align-self: start; position: relative; top: 16px }
  .idb-join { visibility: visible }
  .idb-mhead { display: block; padding-top: 2px }
}
@keyframes idb-join { from { transform: scaleX(0) } }

/* ----------------------------------- Bars ---------------------------------- */
.idb-ch { display: grid; gap: 0 }
.idb-ch li { display: grid; grid-template-columns: minmax(0, 1fr) auto 44px; align-items: baseline; column-gap: 12px; padding: 9px 0 10px; border-top: 1px solid var(--idb-rule-2) }
.idb-ch li:first-child { border-top: 0; padding-top: 2px }
.idb-ch .idb-bar { grid-column: 1 / -1; margin-top: 7px }
.idb-ch-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--idb-t1) }
.idb-bar { position: relative; height: 14px }
.idb-bar > span { position: absolute; left: 0; top: 0; bottom: 0; animation: idb-reveal .8s var(--idb-ease-trace) var(--dl, 0s) backwards }
.idb-bar::after { content: ""; position: absolute; top: -1px; bottom: -1px; left: var(--w); width: 1px; background: var(--idb-ink); animation: idb-fade .4s ease var(--dl, 0s) backwards }
.idb-ch-v { text-align: right; font: 400 12.5px/20px var(--idb-mono); font-variant-numeric: tabular-nums }
.idb-ch-d { text-align: right; font: 500 10.5px/16px var(--idb-mono); letter-spacing: .01em }

/* --------------------------------- Products -------------------------------- */
.idb-pt { width: 100% }
.idb-pt-h, .idb-pt-r { display: grid; grid-template-columns: 22px minmax(0, 1fr) 52px 78px 64px; align-items: center; gap: 12px }
.idb-pt-h { padding-bottom: 6px; box-shadow: 0 1px 0 var(--idb-rule) }
.idb-pt-h span:nth-child(n+3) { text-align: right }
.idb-pt-r { min-height: 40px; margin: 0 -8px; padding: 0 8px; border-top: 1px solid var(--idb-rule-2); border-radius: 2px; transition: background-color .16s var(--idb-ease); animation: idb-rise .5s var(--idb-ease) var(--dl, 0s) backwards }
.idb-pt-r:first-child { border-top: 0 }
.idb-pt-r:hover { background: var(--idb-rule-2) }
.idb-pt-rk { font: 500 11px/16px var(--idb-mono); color: var(--idb-t3) }
.idb-pt-n { min-width: 0 }
.idb-pt-n b { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 17px }
.idb-pt-n span { display: block; font-size: 11.5px; line-height: 15px; color: var(--idb-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.idb-pt-v { text-align: right; font: 400 12.5px/20px var(--idb-mono); font-variant-numeric: tabular-nums; white-space: nowrap }
.idb-pt-sp { height: 18px; width: 64px; justify-self: end }
.idb-pt-sp svg { display: block; width: 100%; height: 100% }
@container idb (max-width: 520px) { .idb-pt-h, .idb-pt-r { grid-template-columns: 18px minmax(0, 1fr) 44px 70px; gap: 8px } .idb-pt-sp { position: absolute; visibility: hidden } .idb-pt-h span:last-child { display: none } }

/* ---------------------------------- Geography ------------------------------- */
.idb-map { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-auto-rows: auto; gap: 4px; max-width: 340px; margin: 4px auto 0; padding: 4px }
.idb-tile { position: relative; grid-column: calc(var(--c) + 1); grid-row: calc(var(--r) + 1); aspect-ratio: 1; border-radius: 2px; background: var(--idb-surface); box-shadow: 0 0 0 1px var(--idb-rule); overflow: hidden; animation: idb-rise .5s var(--idb-ease) var(--dl, 0s) backwards; transition: box-shadow .16s var(--idb-ease) }
.idb-tile:hover { box-shadow: 0 0 0 1px var(--idb-t2) }
.idb-tile[aria-pressed="true"] { box-shadow: 0 0 0 1.5px var(--idb-ink) }
.idb-tile-fill { position: absolute; inset: 0; animation: idb-reveal .7s var(--idb-ease-trace) var(--dl, 0s) backwards }
.idb-tile-c { position: absolute; left: 3px; top: 3px; padding: 0 3px; border-radius: 1px; background: var(--idb-surface); font: 600 9.5px/13px var(--idb-mono); letter-spacing: .04em; color: var(--idb-t1) }
.idb-map-ph { grid-column: 1; grid-row: 1; pointer-events: none }
.idb-ramp { display: flex; align-items: center; gap: 8px; margin: 12px 0 0 }
.idb-ramp-cells { display: flex; gap: 2px }
.idb-ramp-cells i { display: block; width: 14px; height: 8px }

/* ----------------------------------- Funnel -------------------------------- */
.idb-fn li { display: grid; grid-template-columns: 92px minmax(0, 1fr) 60px 50px; align-items: center; gap: 10px; min-height: 40px; border-top: 1px solid var(--idb-rule-2) }
.idb-fn li:first-child { border-top: 0 }
.idb-fn-bar { position: relative; height: 18px }
.idb-fn-bar > span { position: absolute; top: 0; bottom: 0 }
.idb-fn-solid { left: 0; min-width: 2px; background: var(--idb-ink); animation: idb-reveal .8s var(--idb-ease-trace) var(--dl, 0s) backwards }
.idb-fn-lost { animation: idb-reveal .8s var(--idb-ease-trace) calc(var(--dl, 0s) + .15s) backwards; opacity: .55 }
.idb-fn-c { text-align: right; font: 400 12.5px/16px var(--idb-mono); font-variant-numeric: tabular-nums }
.idb-fn-c small { display: block; font: 500 10px/14px var(--idb-mono); color: var(--idb-t3) }
.idb-fn-d { text-align: right; font: 500 11px/16px var(--idb-mono) }
.idb-fn-d[data-worst] { color: var(--idb-bad) }
.idb-fn-d { color: var(--idb-t2) }
@container idb (max-width: 520px) { .idb-fn li { grid-template-columns: 70px minmax(0, 1fr) 52px 44px; gap: 8px } }

@media (prefers-reduced-motion: reduce) {
  .idb *, .idb *::before, .idb *::after { animation: none !important; transition: none !important }
  .idb-scan { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                               Small components                             */
/* -------------------------------------------------------------------------- */

function Crops() {
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <span key={c} className="idb-crop" data-c={c} aria-hidden="true" />
      ))}
    </>
  )
}

function Head({ lab, title, sub, right, small }: { lab: string; title: React.ReactNode; sub: string; right?: React.ReactNode; small?: boolean }) {
  return (
    <header className="idb-head">
      <div style={{ minWidth: 0 }}>
        <span className="idb-lab">{lab}</span>
        <h2 className="idb-h" data-s={small ? "sm" : undefined}>{title}</h2>
        <p className="idb-sub">{sub}</p>
      </div>
      {right}
    </header>
  )
}

function Segmented({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  const i = RANGE_KEYS.indexOf(value)
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = RANGE_KEYS[(i + d + RANGE_KEYS.length) % RANGE_KEYS.length]
    onChange(next)
    const btns = (e.currentTarget as HTMLElement).querySelectorAll("button")
    ;(btns[RANGE_KEYS.indexOf(next)] as HTMLElement | undefined)?.focus()
  }
  return (
    <div className="idb-seg" role="radiogroup" aria-label="Date range" onKeyDown={onKey}>
      <span className="idb-seg-thumb" style={{ "--i": i } as React.CSSProperties} aria-hidden="true" />
      {RANGE_KEYS.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={k === value} tabIndex={k === value ? 0 : -1} onClick={() => onChange(k)}>
          {k}
        </button>
      ))}
    </div>
  )
}

function Spark({ values, w = 160, h = 30, pad = 3, dot = false, delay = 0 }: { values: number[]; w?: number; h?: number; pad?: number; dot?: boolean; delay?: number }) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const y = (v: number) => pad + (h - pad * 2) * (1 - (v - lo) / (hi - lo || 1))
  const x = (i: number) => (i / (values.length - 1)) * w
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("")
  const ly = y(values[values.length - 1])
  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} pathLength={1} className="idb-trace" style={{ "--dl": `${delay}s`, "--d": ".8s" } as React.CSSProperties} fill="none" stroke="var(--idb-ink)" strokeWidth={1.25} strokeLinejoin="round" />
      </svg>
      {dot && <span className="idb-spark-dot" style={{ left: "100%", top: `${(ly / h) * 100}%`, animationDelay: `${delay + 0.75}s` }} />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Trend chart                                */
/* -------------------------------------------------------------------------- */

const ML = 48
const MR = 14
const MT = 36
const MB = 30

type Ann = { d: number; label: string }
const ANNOTATIONS: Ann[] = [
  { d: 70, label: "Spring range" },
  { d: 176, label: "Summer sale" },
  { d: 243, label: "Free-delivery trial" },
  { d: 280, label: "Autumn sale" },
  { d: 286, label: "Carrier switch" },
  { d: 292, label: "Site outage 42m" },
  { d: 301, label: "Winter edit email" },
]

function TrendChart({
  series,
  metric,
  compare,
  extDay,
}: {
  series: Series
  metric: MetricKey
  compare: boolean
  /** A day index to show the readout for when the pointer is not on the chart (set by hovering a margin note). */
  extDay: number | null
}) {
  const { cfg, hist, prev, fc } = series
  const m = METRICS[metric]
  const wrap = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(760)
  const [hov, setHov] = React.useState<number | null>(null)
  React.useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = w < 520 ? 250 : 312

  const g = React.useMemo(() => {
    const pw = w - ML - MR
    const ph = H - MT - MB
    const vals = hist.map(m.v)
    const pv = prev.map(m.v)
    const fv = fc.map(m.v)
    const N = vals.length
    const F = fv.length
    const T = N + F
    const hw = fv.map((v, j) => v * (0.03 + 0.022 * Math.sqrt((j + 1) * cfg.step)) * m.bandK)
    let lo = Infinity
    let hi = -Infinity
    const see = (v: number) => {
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
    vals.forEach(see)
    if (compare) pv.forEach(see)
    fv.forEach((v, j) => {
      see(v - hw[j])
      see(v + hw[j])
    })
    const pad = (hi - lo) * 0.06
    const ticks = niceTicks(lo - pad, hi + pad, 4)
    const dlo = ticks[0]
    const dhi = ticks[ticks.length - 1]
    const pitch = pw / (T - 1)
    const x = (i: number) => i * pitch
    const y = (v: number) => ph * (1 - (v - dlo) / (dhi - dlo))
    const path = (arr: number[], from = 0) => arr.map((v, i) => `${i ? "L" : "M"}${x(i + from).toFixed(1)} ${y(v).toFixed(1)}`).join("")
    const line = path(vals)
    const prevLine = path(pv)
    const fcLine = `M${x(N - 1).toFixed(1)} ${y(vals[N - 1]).toFixed(1)}` + fv.map((v, j) => `L${x(N + j).toFixed(1)} ${y(v).toFixed(1)}`).join("")

    // Forecast band: ordered dither whose density fades with distance from "now".
    const bx = [x(N - 1), ...fv.map((_, j) => x(N + j))]
    const btop = [y(vals[N - 1]), ...fv.map((v, j) => y(v + hw[j]))]
    const bbot = [y(vals[N - 1]), ...fv.map((v, j) => y(v - hw[j]))]
    const at = (arr: number[], px: number) => {
      for (let i = 1; i < bx.length; i++) if (px <= bx[i]) return arr[i - 1] + ((arr[i] - arr[i - 1]) * (px - bx[i - 1])) / (bx[i] - bx[i - 1] || 1)
      return arr[arr.length - 1]
    }
    const x0 = bx[0]
    const x1 = bx[bx.length - 1]
    let dots = ""
    for (let c = Math.ceil(x0 / 2); c * 2 + 1 <= x1; c++) {
      const px = c * 2 + 1
      const t = (px - x0) / (x1 - x0 || 1)
      const dens = 0.06 + 0.52 * Math.pow(1 - t, 1.4)
      const yt = at(btop, px)
      const yb = at(bbot, px)
      for (let r = Math.floor(yt / 2); r * 2 + 1 <= yb; r++) {
        if (r * 2 + 1 < yt) continue
        if ((BAYER[r & 7][c & 7] + 0.5) / 64 < dens) dots += `M${c * 2} ${r * 2}h2v2h-2z`
      }
    }
    const edge = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${bx[i].toFixed(1)} ${v.toFixed(1)}`).join("")

    // X labels: every nth bucket, at day boundaries for the six-hour view.
    const unit = cfg.step < 1 ? 4 : 1
    const every = Math.max(1, Math.ceil(78 / pitch / unit)) * unit
    const times = [...hist, ...fc].map((b) => b.t0)
    const labels: { i: number; text: string }[] = []
    for (let i = 0; i < T; i += every) {
      if (T - 1 - i < every * 0.5 && i !== 0) continue
      labels.push({ i, text: cfg.step < 1 ? fDowDay(times[i]).replace(/ [A-Z][a-z]{2}$/, "") : fDay(times[i]) })
    }

    // Annotation flags in two lanes so labels never overlap.
    const flags: { i: number; x: number; fx: number; width: number; lane: number; label: string; flip: boolean; d: number }[] = []
    const laneEnd = [-99, -99]
    ANNOTATIONS.forEach((a) => {
      const ms = dayMs(a.d) + DAY / 2
      const i = [...hist, ...fc].findIndex((b) => ms >= b.t0 && ms < b.t1)
      if (i < 0) return
      const width = a.label.length * 6.3 + 14
      const flip = x(i) + width > pw
      const left = flip ? x(i) - width : x(i)
      const lane = laneEnd[0] + 6 < left ? 0 : laneEnd[1] + 6 < left ? 1 : -1
      if (lane < 0) return
      laneEnd[lane] = left + width
      flags.push({ i, x: x(i), fx: left, width, lane, label: a.label, flip, d: a.d })
    })

    return { pw, ph, vals, pv, fv, hw, N, F, T, ticks, dlo, dhi, pitch, x, y, line, prevLine, fcLine, dots, edgeTop: edge(btop), edgeBot: edge(bbot), labels, flags, times, unit }
  }, [w, H, hist, prev, fc, cfg, m, compare])

  let ext: number | null = null
  if (extDay != null) {
    const ms = dayMs(extDay) + DAY / 2
    const i = hist.findIndex((b) => ms >= b.t0 && ms < b.t1)
    ext = i >= 0 ? i : null
  }
  const idx = hov ?? ext
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHov(clamp(Math.round((e.clientX - r.left) / g.pitch), 0, g.T - 1))
  }
  const onKey = (e: React.KeyboardEvent) => {
    const cur = hov ?? g.N - 1
    const nx = e.key === "ArrowRight" ? cur + 1 : e.key === "ArrowLeft" ? cur - 1 : e.key === "Home" ? 0 : e.key === "End" ? g.T - 1 : e.key === "Escape" ? -1 : null
    if (nx == null) return
    e.preventDefault()
    setHov(nx < 0 ? null : clamp(nx, 0, g.T - 1))
  }

  // Readout for the active index.
  let tip: React.ReactNode = null
  let live = ""
  if (idx != null) {
    const isFc = idx >= g.N
    const b = isFc ? fc[idx - g.N] : hist[idx]
    const v = isFc ? g.fv[idx - g.N] : g.vals[idx]
    const when =
      cfg.step < 1
        ? `${fDowDay(b.t0)} · ${fHour(b.t0)}–${fHour(b.t1)}`
        : cfg.step === 1
          ? `${fDowDay(b.t0)} ${new Date(b.t0).getUTCFullYear()}`
          : `${fDay(b.t0)} – ${fDay(b.t1 - 1)}`
    const px = ML + g.x(idx)
    const left = px > w * 0.58
    let rows: React.ReactNode = null
    if (isFc) {
      const hwv = g.hw[idx - g.N]
      rows = (
        <div className="idb-tip-r">
          <span>80% band</span>
          <span>
            {fmtFull(m, v - hwv)} – {fmtFull(m, v + hwv)}
          </span>
        </div>
      )
      live = `${when}, forecast ${fmtFull(m, v)}`
    } else if (compare) {
      const dl = deltaOf(m, v, g.pv[idx])
      rows = (
        <>
          <div className="idb-tip-r">
            <span>vs prev</span>
            <span className={`idb-${dl.tone}`}>{dl.text}</span>
          </div>
          <div className="idb-tip-r">
            <span>prev</span>
            <span>{fmtFull(m, g.pv[idx])}</span>
          </div>
        </>
      )
      live = `${when}, ${fmtFull(m, v)}, ${dl.text} versus previous`
    } else live = `${when}, ${fmtFull(m, v)}`
    tip = (
      <div className="idb-tip" style={{ top: MT + 6, left: left ? undefined : px + 14, right: left ? w - px + 14 : undefined }}>
        <span className="idb-lab">
          {when}
          {isFc ? " · forecast" : ""}
        </span>
        <span className="idb-tip-v">{fmtFull(m, v)}</span>
        {rows}
      </div>
    )
  }

  const range = `${cfg.key}-${metric}`
  const total = m.v(sumB(hist))
  const prevTotal = m.v(sumB(prev))
  const dTotal = deltaOf(m, total, prevTotal)

  return (
    <div
      ref={wrap}
      className="idb-chart"
      style={{ height: H }}
      tabIndex={0}
      role="group"
      aria-label={`${m.label} over ${cfg.name}, ${fmtFull(m, total)}, ${dTotal.text} versus ${cfg.prevName}. Arrow keys move through points.`}
      onKeyDown={onKey}
      onBlur={() => setHov(null)}
    >
      <div className="sr-only" aria-live="polite">{live}</div>
      {/* axes + grid (static) */}
      <svg className="idb-lyr" width={w} height={H} aria-hidden="true">
        <g transform={`translate(${ML} ${MT})`}>
          {g.ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={g.pw} y1={g.y(t)} y2={g.y(t)} stroke="var(--idb-rule-2)" />
              <text x={-10} y={g.y(t) + 3.5} textAnchor="end">{m.axis(t)}</text>
            </g>
          ))}
          <line x1={0} x2={g.pw} y1={g.ph + 0.5} y2={g.ph + 0.5} stroke="var(--idb-t4)" />
          {Array.from({ length: g.T }, (_, i) => {
            const major = i % g.unit === 0
            return <line key={i} x1={g.x(i)} x2={g.x(i)} y1={g.ph + 1} y2={g.ph + (g.labels.some((l) => l.i === i) ? 7 : major ? 4 : 2.5)} stroke="var(--idb-t4)" />
          })}
          {g.labels.map((l) => (
            <text key={l.i} x={g.x(l.i)} y={g.ph + 21} textAnchor={l.i === 0 ? "start" : "middle"}>{l.text}</text>
          ))}
          {/* now */}
          <line x1={g.x(g.N - 1)} x2={g.x(g.N - 1)} y1={-2} y2={g.ph} stroke="var(--idb-t3)" strokeDasharray="1 3" />
          <text x={g.x(g.N - 1) - 6} y={g.ph - 6} textAnchor="end" className="t-up">now</text>
          <text x={g.x(g.N - 1) + 6} y={g.ph - 6} className="t-up">forecast {cfg.fcName}</text>
          <rect x={g.x(g.N - 1) - 1} y={g.ph - 1} width={2} height={8} fill="var(--idb-ink)" />
        </g>
      </svg>

      <div key={range}>
        <div className="idb-grid" style={{ left: ML, top: MT, width: g.pw, height: g.ph }} aria-hidden="true" />
        {compare && (
          <svg className="idb-lyr idb-reveal" width={w} height={H} aria-hidden="true">
            <g transform={`translate(${ML} ${MT})`}>
              <path d={g.prevLine} fill="none" stroke="var(--idb-t3)" strokeWidth={1.25} strokeDasharray="3 3" strokeLinejoin="round" />
            </g>
          </svg>
        )}
        <svg className="idb-lyr idb-reveal" width={w} height={H} aria-hidden="true">
          <g transform={`translate(${ML} ${MT})`}>
            <path d={g.dots} fill="var(--idb-ink)" opacity={0.8} />
            <path d={g.edgeTop} fill="none" stroke="var(--idb-t4)" strokeWidth={0.75} strokeDasharray="1 2" />
            <path d={g.edgeBot} fill="none" stroke="var(--idb-t4)" strokeWidth={0.75} strokeDasharray="1 2" />
            <path d={g.fcLine} fill="none" stroke="var(--idb-t1)" strokeWidth={1.25} strokeDasharray="1.5 3" strokeLinecap="round" />
          </g>
        </svg>
        <svg className="idb-lyr" width={w} height={H} aria-hidden="true">
          <g transform={`translate(${ML} ${MT})`}>
            <path d={g.line} pathLength={1} className="idb-trace" fill="none" stroke="var(--idb-ink)" strokeWidth={1.6} strokeLinejoin="round" />
            <circle className="idb-fade" style={{ "--dl": ".85s" } as React.CSSProperties} cx={g.x(g.N - 1)} cy={g.y(g.vals[g.N - 1])} r={3.2} fill="var(--idb-ink)" />
          </g>
        </svg>
        <svg className="idb-lyr idb-fade" style={{ "--dl": ".5s" } as React.CSSProperties} width={w} height={H} aria-hidden="true">
          <g transform={`translate(${ML} ${MT})`}>
            {g.flags.map((f) => {
              const on = ext != null && ext === f.i && f.d === extDay
              return (
                <g key={f.d}>
                  <line x1={f.x} x2={f.x} y1={f.lane * 15 + 14 - MT} y2={g.ph} stroke={on ? "var(--idb-ink)" : "var(--idb-t4)"} strokeDasharray="1 3" />
                  <rect x={f.fx} y={f.lane * 15 - MT + 2} width={f.width} height={13} fill="var(--idb-surface)" stroke={on ? "var(--idb-ink)" : "var(--idb-rule)"} />
                  <text x={f.fx + 7} y={f.lane * 15 - MT + 11.5} className="t-up" style={{ fontSize: 9.5, fill: on ? "var(--idb-ink)" : "var(--idb-t2)" }}>{f.label}</text>
                  <rect x={f.x - 1} y={f.lane * 15 + 14 - MT} width={2} height={5} fill="var(--idb-ink)" />
                </g>
              )
            })}
          </g>
        </svg>
        <div className="idb-scan" style={{ left: ML, top: MT, height: g.ph, "--pw": `${g.pw}px` } as React.CSSProperties} aria-hidden="true" />
      </div>

      {/* crosshair */}
      {idx != null && (
        <svg className="idb-lyr" width={w} height={H} aria-hidden="true">
          <g transform={`translate(${ML} ${MT})`}>
            <line x1={g.x(idx)} x2={g.x(idx)} y1={-4} y2={g.ph} stroke="var(--idb-ink)" strokeWidth={1} opacity={0.7} />
            <rect x={g.x(idx) - 1} y={g.ph - 1} width={2} height={8} fill="var(--idb-ink)" />
            {compare && idx < g.N && <circle cx={g.x(idx)} cy={g.y(g.pv[idx])} r={3} fill="var(--idb-surface)" stroke="var(--idb-t2)" strokeWidth={1.25} />}
            <circle cx={g.x(idx)} cy={g.y(idx < g.N ? g.vals[idx] : g.fv[idx - g.N])} r={3.6} fill="var(--idb-ink)" stroke="var(--idb-surface)" strokeWidth={1.5} />
          </g>
        </svg>
      )}
      <div
        className="idb-hit"
        style={{ left: ML - 6, top: MT - 6, width: g.pw + 12, height: g.ph + 12 }}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHov(null)}
        aria-hidden="true"
      />
      {tip}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Screen                                  */
/* -------------------------------------------------------------------------- */

const NAV_CONSOLE: { label: string; icon: LucideIcon }[] = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]
const NAV_OPS: { label: string; icon: LucideIcon }[] = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]
const AGENTS: RailAgent[] = [
  { name: "Atlas", state: "live", note: "Running" },
  { name: "Sage", state: "ok", note: "Writing" },
  { name: "Quill", state: "off", note: "Idle" },
]

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

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--idb-accent)" strokeWidth="1.5" />
    </svg>
  )
}

type RailAgent = { name: string; state: "ok" | "live" | "off" | "warn" | "bad"; note: string }

function Rail({
  hidden,
  active,
  agents,
  userRole,
  onGo,
  sideTools,
}: {
  hidden: boolean
  active: string
  agents: RailAgent[]
  userRole: string
  onGo: (label: string) => void
  sideTools?: React.ReactNode
}) {
  const group = (name: string, items: { label: string; icon: LucideIcon }[]) => (
    <nav className="idb-rgroup" aria-label={name}>
      <span className="idb-rlab">{name}</span>
      <div className="idb-rnav">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`idb-ritem${label === active ? " is-active" : ""}`}
            aria-current={label === active ? "page" : undefined}
            onClick={() => onGo(label)}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
  return (
    <aside className="idb-rail" aria-label="Meridian navigation" inert={hidden}>
      <div className="idb-brand">
        <Glyph />
        Meridian
      </div>
      <div className="idb-rgroup" style={{ marginTop: 4 }}>
        <span className="idb-rlab">Workspace</span>
        <button type="button" className="idb-ws" aria-label="Switch workspace">
          Harbor &amp; Finch
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>
      {group("Console", NAV_CONSOLE)}
      {group("Operations", NAV_OPS)}
      <nav className="idb-rgroup" aria-label="Agents">
        <span className="idb-rlab">Agents</span>
        <div className="idb-rnav">
          {agents.map((a) => (
            <button key={a.name} type="button" className="idb-ritem idb-ragent" onClick={() => onGo(a.name)}>
              <span className={`idb-rdot ${a.state}`} aria-hidden="true" />
              {a.name}
              <span className="idb-rlab">{a.note}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="idb-rspacer" />
      {sideTools ? <div className="idb-sidetools">{sideTools}</div> : null}
      <div className="idb-ruser">
        <span className="idb-rav" aria-hidden="true">
          AO
        </span>
        <div>
          <b>Ada Okafor</b>
          <span>{userRole}</span>
        </div>
      </div>
    </aside>
  )
}

function Delta({ d }: { d: Delta }) {
  return <span className={`idb-${d.tone}`}>{d.text}</span>
}

/** Build the three margin notes from the same data the charts draw. */
function noteTexts(args: { dip: string; mover: { name: string; delta: number; value: number }; worstStep: string; worstDrop: number }) {
  const { dip, mover, worstStep, worstDrop } = args
  const tails: Record<string, string> = {
    "Email & SMS": "The send cost per order is about a third of paid search, so the Winter edit goes out on the same cadence.",
    "Organic search": "Linen and lighting pages gained rank after the Autumn sale landing pages were indexed.",
    "Paid search": "Spend is flat, so the lift is better match on the new bedding ad groups.",
    Direct: "Mostly returning customers after the sale emails; no change to spend needed.",
    Social: "Two short videos drove it. Neither will repeat without new stock photography.",
    Affiliates: "One home-styling publisher accounts for most of it; the rate card is up for review.",
  }
  return [
    `Conversion dipped ${dip} pt on Tuesday – the 42-minute checkout outage explains ~70% of it. The rest is the usual post-sale lull.`,
    `${mover.name} is the mover: ${money(mover.value)}, ${mover.delta >= 0 ? "up" : "down"} ${Math.abs(mover.delta * 100).toFixed(0)}% on the prior period. ${tails[mover.name]}`,
    `${worstStep} is the widest leak at −${worstDrop.toFixed(0)}%, and Scotland and Northern Ireland lose the most, where delivery quotes run £2.40 higher. A free-delivery threshold test is drafted.`,
  ]
}

export function OpsDashboard({ onNavigate, sideTools }: OpsDashboardProps) {
  const [range, setRange] = React.useState<RangeKey>("30D")
  const [compare, setCompare] = React.useState(true)
  const [focus, setFocus] = React.useState<MetricKey>("revenue")
  const [drawer, setDrawer] = React.useState(false)
  const narrow = useMatch("(max-width: 1023px)")
  const [toast, setToast] = React.useState<string | null>(null)
  const [extDay, setExtDay] = React.useState<number | null>(null)
  const [region, setRegion] = React.useState("LON")
  const toastTimer = React.useRef(0)
  const nav = (l: string) => {
    setDrawer(false)
    onNavigate?.(l)
  }
  React.useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  const say = (t: string) => {
    setToast(t)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  const series = getSeries(range)
  const { cfg, hist, prev } = series
  const cur = sumB(hist)
  const pre = sumB(prev)
  const seed = SEED[range]

  // Breakdowns, all derived from the same totals as the KPI row.
  const bd = (() => {
    const emailBoost = range === "7D" ? 0.96 : range === "30D" ? 1.18 : range === "QTD" ? 1.1 : 1.04
    const ch = channelsFor(cur.rev, seed, emailBoost)
    const chPrev = channelsFor(pre.rev, seed + 1000, 1)
    const channels = CHANNELS.map((c, i) => ({ name: c.name, value: ch[i], delta: ch[i] / chPrev[i] - 1 }))
    const reg = regionsFor(cur.rev, seed)
    const regPrev = regionsFor(pre.rev, seed + 1000)
    const regions = REGIONS.map((g, i) => ({ ...g, value: reg[i], delta: reg[i] / regPrev[i] - 1 }))
    const products = productsFor(cur.orders, pre.orders, seed)
    const V = cur.visits
    const steps = [V, V * (0.58 + 0.03 * nz(seed, 91)), V * (0.105 + 0.006 * nz(seed, 92)), V * (0.061 + 0.003 * nz(seed, 93)), cur.orders]
    const drops = steps.map((s, i) => (i === 0 ? 0 : (1 - s / steps[i - 1]) * 100))
    let worst = 1
    drops.forEach((d, i) => {
      if (i >= 2 && d > drops[worst] - 0.0001) worst = i
    })
    const paidRev = ch[1] + ch[4]
    const spend = paidRev * (0.22 + 0.01 * nz(seed, 94))
    const mover = channels.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a))
    return { channels, regions, products, steps, drops, worst, roas: paidRev / spend, spend, mover }
  })()

  const dip = React.useMemo(() => {
    let base = 0
    for (let d = 285; d < 292; d++) {
      const r = dayModel(d, false)
      base += r.orders / r.visits
    }
    base /= 7
    const r = dayModel(292, false)
    return ((base - r.orders / r.visits) * 100).toFixed(1)
  }, [])
  const notes = noteTexts({ dip, mover: bd.mover, worstStep: `${FUNNEL[bd.worst - 1]} → ${FUNNEL[bd.worst]}`, worstDrop: bd.drops[bd.worst] })

  const fm = METRICS[focus]
  const chartTotal = fm.v(cur)
  const vals = hist.map(fm.v)
  const fcTotal = sumB(series.fc)
  const fcVal = fm.v(fcTotal)
  const fcPct = (0.03 + 0.022 * Math.sqrt(series.fc.length * cfg.step * 0.6)) * fm.bandK * 100
  const peakI = vals.indexOf(Math.max(...vals))
  const lowI = vals.indexOf(Math.min(...vals))
  const bucketLabel = (b: Bucket) => (cfg.step < 1 ? `${fDowDay(b.t0)} ${fHour(b.t0)}` : fDay(b.t0))

  const periodLabel = `${fDay(hist[0].t0)} – ${fDay(hist[hist.length - 1].t1 - 1)} ${new Date(hist[hist.length - 1].t0).getUTCFullYear()}`
  const prevLabel = `${fDay(prev[0].t0)} – ${fDay(prev[prev.length - 1].t1 - 1)}${cfg.shift === 365 ? ` ${new Date(prev[0].t0).getUTCFullYear()}` : ""}`

  const doExport = () => {
    try {
      const rows = ["bucket_start,bucket_end,value,previous"]
      hist.forEach((b, i) => rows.push([new Date(b.t0).toISOString(), new Date(b.t1).toISOString(), fm.v(b).toFixed(4), fm.v(prev[i]).toFixed(4)].join(",")))
      series.fc.forEach((b) => rows.push([new Date(b.t0).toISOString(), new Date(b.t1).toISOString(), fm.v(b).toFixed(4) + " (forecast)", ""].join(",")))
      const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `harbor-finch-${focus}-${range.toLowerCase()}.csv`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      say(`Exported ${focus}-${range.toLowerCase()}.csv`)
    } catch {
      say("Export unavailable")
    }
  }
  const doShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      say("Link copied")
    } catch {
      say("Copy the address bar link")
    }
  }

  const kpiDelay = (i: number) => ({ animationDelay: `${i * 0.06}s` })
  const worstDrop = bd.drops[bd.worst]
  const maxCh = Math.max(...bd.channels.map((c) => c.value))
  const maxReg = Math.max(...bd.regions.map((r) => r.value))
  const sel = bd.regions.find((r) => r.code === region) ?? bd.regions[0]
  const fnMax = bd.steps[0]

  return (
    <div
      className={`idb${drawer ? " is-open" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") setDrawer(false)
      }}
    >
      <style href="ops-dashboard" precedence="default">{CSS}</style>
      <div className="idb-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />
      <Rail
        hidden={narrow && !drawer}
        active="Dashboard"
        agents={AGENTS}
        userRole="Product lead"
        onGo={nav}
        sideTools={sideTools}
      />

      <div className="idb-col">
        <header className="idb-top">
          <button type="button" className="idb-menu" aria-label="Open navigation" aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
          <div className="idb-ttl">
            <span className="idb-rlab idb-crumb">Operations / Dashboard</span>
            <h1>Dashboard</h1>
          </div>
          <div className="idb-actions">
            <label className="idb-search">
              <Search size={14} strokeWidth={1.5} />
              <input type="search" placeholder="Search" aria-label="Search Meridian" />
              <kbd>⌘K</kbd>
            </label>
            <button type="button" className="idb-tbtn" onClick={doExport} aria-label="Export CSV">
              <Download size={14} strokeWidth={1.5} />
              <span>Export</span>
            </button>
            <button type="button" className="idb-tbtn ink" onClick={doShare} aria-label="Share dashboard">
              <Share2 size={14} strokeWidth={1.5} />
              <span>Share</span>
            </button>
          </div>
        </header>
        {toast && (
          <div className="idb-toast" role="status">
            {toast}
          </div>
        )}

        <div className="idb-body">
          <div className="idb-pad">
            {/* Toolbar */}
            <div className="idb-tb">
              <Segmented value={range} onChange={setRange} />
              <button type="button" className="idb-sw" role="switch" aria-checked={compare} onClick={() => setCompare((c) => !c)}>
                <span className="idb-sw-track" aria-hidden="true" />
                Compare to {cfg.prevName}
              </button>
              <span className="idb-tb-date">
                <b>{periodLabel}</b>
                {compare && <> · vs {prevLabel}</>}
              </span>
              <span className="idb-tb-live">Data through 22 Oct · 09:41 UTC</span>
            </div>

            {/* Row 1: KPIs */}
            <div className="idb-row">
              <div className="idb-main">
                <section className="idb-kpis" aria-label="Key figures" key={`k-${range}`}>
                  <Crops />
                  {METRIC_KEYS.map((k, i) => {
                    const m = METRICS[k]
                    const v = m.v(cur)
                    const u = m.unit(v)
                    const dl = deltaOf(m, v, m.v(pre))
                    const sp = hist.map(m.v)
                    return (
                      <button key={k} type="button" className="idb-kpi" aria-pressed={focus === k} onClick={() => setFocus(k)} style={kpiDelay(i)}>
                        <span className="idb-kpi-top">
                          <span className="idb-lab">{m.label}</span>
                          <Pin aria-hidden="true" strokeWidth={1.5} />
                        </span>
                        <span className="idb-kpi-big">
                          {u.pre && <small>{u.pre}</small>}
                          <Num value={v / u.scale} dp={u.dp} />
                          {u.suf && <small>{u.suf}</small>}
                        </span>
                        <span className="idb-kpi-d">
                          {compare ? <Delta d={dl} /> : <span className="idb-flat">–</span>}
                          <i>{compare ? "vs prev" : "compare off"}</i>
                        </span>
                        <span className="idb-spark">
                          <Spark values={sp} dot delay={0.15 + i * 0.06} />
                        </span>
                        <span className="sr-only">{focus === k ? "Pinned as chart focus" : "Pin as chart focus"}</span>
                      </button>
                    )
                  })}
                </section>
              </div>
              <div className="idb-mhead">
                <span className="idb-lab">Agent insights</span>
                <h2 className="idb-h" data-s="sm">
                  Margin <em>notes</em>
                </h2>
                <p className="idb-sub">Sage reads the numbers each morning and writes down what moved.</p>
              </div>
            </div>

            {/* Row 2: trend + note 1 */}
            <div className="idb-row">
              <div className="idb-main">
                <section className="idb-card" style={{ "--dl": ".15s" } as React.CSSProperties}>
                  <Crops />
                  <Head
                    lab="Trend"
                    title={
                      <>
                        <em>{fm.label}</em> over time
                      </>
                    }
                    sub={`${cfg.key === "7D" ? "Six-hour" : cfg.step === 7 ? "Weekly" : "Daily"} ${fm.label.toLowerCase()} for ${cfg.name}, with a ${cfg.fcName.replace("+", "")} forecast.`}
                    right={
                      <div className="idb-keys">
                        <span className="idb-key"><i /> This period</span>
                        {compare && <span className="idb-key"><i data-k="prev" /> {cfg.prevName}</span>}
                        <span className="idb-key"><i data-k="band" style={{ "--m": tile(0.4) } as React.CSSProperties} /> Forecast band</span>
                      </div>
                    }
                  />
                  <TrendChart series={series} metric={focus} compare={compare} extDay={extDay} />
                  <div className="idb-readout" data-n="4">
                    <div>
                      <span className="idb-lab">Period</span>
                      <b>{fmtFull(fm, chartTotal)}</b>
                    </div>
                    <div>
                      <span className="idb-lab">Peak</span>
                      <b>
                        {fmtFull(fm, vals[peakI])}
                        <small>{bucketLabel(hist[peakI])}</small>
                      </b>
                    </div>
                    <div>
                      <span className="idb-lab">Low</span>
                      <b>
                        {fmtFull(fm, vals[lowI])}
                        <small>{bucketLabel(hist[lowI])}</small>
                      </b>
                    </div>
                    <div>
                      <span className="idb-lab">Forecast {cfg.fcName}</span>
                      <b>
                        {fmtFull(fm, fcVal)}
                        <small>±{fcPct.toFixed(0)}%</small>
                      </b>
                    </div>
                  </div>
                  <p className="idb-fig">
                    FIG. 1 — {fm.label}, {cfg.name} to 22 Oct 2026; forecast is Sage’s 80% band
                  </p>
                </section>
              </div>
              <aside className="idb-note" aria-label="Sage note on the trend chart" onMouseEnter={() => setExtDay(292)} onMouseLeave={() => setExtDay(null)} onFocus={() => setExtDay(292)} onBlur={() => setExtDay(null)}>
                <span className="idb-join" aria-hidden="true" />
                <div className="idb-note-by">
                  <span className="idb-dot" data-s="busy" aria-hidden="true" />
                  <span className="idb-lab">Sage · re FIG. 1 · 20 Oct</span>
                </div>
                <p className="idb-note-q"><Typed key={`n1-${range}-${dip}`} text={notes[0]} delay={500} /></p>
                <div className="idb-note-ev">
                  <span>Conf 0.82</span>
                  <span className="idb-conf idb-dith" style={{ "--m": tile(0.82) } as React.CSSProperties} aria-hidden="true" />
                  <span>3 sources</span>
                </div>
                <button type="button" className="idb-link" onClick={() => nav("Research desk")}>Investigate →</button>
              </aside>
            </div>

            {/* Row 3: channels + products + note 2 */}
            <div className="idb-row">
              <div className="idb-main">
                <div className="idb-pair">
                  <section className="idb-card" style={{ "--dl": ".25s" } as React.CSSProperties} key={`ch-${range}`}>
                    <Crops />
                    <Head small lab="Channels" title={<>Revenue by <em>channel</em></>} sub="Where the money came from, dither length to scale." />
                    <ul className="idb-ch">
                      {bd.channels.map((c, i) => {
                        const dl = deltaOf(METRICS.revenue, c.value, c.value / (1 + c.delta))
                        return (
                          <li key={c.name}>
                            <span className="idb-ch-name">{c.name}</span>
                            <span className="idb-ch-v">
                              £<Num value={c.value / 1000} dp={1} />k
                            </span>
                            <span className="idb-ch-d">{compare ? <Delta d={{ ...dl, text: `${c.delta >= 0 ? "▲" : "▼"}${Math.abs(c.delta * 100).toFixed(0)}%` }} /> : <span className="idb-flat">–</span>}</span>
                            <span className="idb-bar" style={{ "--w": `${(c.value / maxCh) * 100}%`, "--dl": `${0.3 + i * 0.07}s` } as React.CSSProperties}>
                              <span className="idb-dith" style={{ width: `${(c.value / maxCh) * 100}%`, "--m": tile(0.58) } as React.CSSProperties} />
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="idb-readout" data-n="3">
                      <div>
                        <span className="idb-lab">Paid spend</span>
                        <b>{money(bd.spend)}</b>
                      </div>
                      <div>
                        <span className="idb-lab">ROAS</span>
                        <b>{bd.roas.toFixed(1)}×</b>
                      </div>
                      <div>
                        <span className="idb-lab">Mover</span>
                        <b>{bd.mover.name.split(" ")[0]}</b>
                      </div>
                    </div>
                    <p className="idb-fig">FIG. 2 — Revenue by channel, {cfg.name}</p>
                  </section>

                  <section className="idb-card" style={{ "--dl": ".3s" } as React.CSSProperties} key={`pr-${range}`}>
                    <Crops />
                    <Head small lab="Products" title={<>Top <em>products</em></>} sub="Ranked by revenue. Trend is units across the window." />
                    <div className="idb-pt" role="table" aria-label="Top products">
                      <div className="idb-pt-h idb-lab" role="row">
                        <span role="columnheader">#</span>
                        <span role="columnheader">Product</span>
                        <span role="columnheader">Units</span>
                        <span role="columnheader">Revenue</span>
                        <span role="columnheader">Trend</span>
                      </div>
                      {bd.products.map((p, i) => (
                        <div className="idb-pt-r" role="row" key={p.name} style={{ "--dl": `${0.35 + i * 0.05}s` } as React.CSSProperties}>
                          <span className="idb-pt-rk" role="cell">{String(i + 1).padStart(2, "0")}</span>
                          <span className="idb-pt-n" role="cell">
                            <b>{p.name}</b>
                            <span>{p.variant}</span>
                          </span>
                          <span className="idb-pt-v" role="cell"><Num value={p.units} dp={0} /></span>
                          <span className="idb-pt-v" role="cell">£<Num value={p.revenue} dp={0} /></span>
                          <span className="idb-pt-sp" role="cell">
                            <svg className="idb-reveal" style={{ "--dl": `${0.4 + i * 0.05}s`, "--d": ".7s" } as React.CSSProperties} viewBox="0 0 64 18" preserveAspectRatio="none" role="img" aria-label={`${p.delta >= 0 ? "Rising" : "Falling"} ${Math.abs(p.delta * 100).toFixed(0)}%`}>
                              <path
                                d={(() => {
                                  const lo = Math.min(...p.spark)
                                  const hi = Math.max(...p.spark)
                                  return p.spark.map((v, t) => `${t ? "L" : "M"}${((t / 9) * 64).toFixed(1)} ${(2 + 14 * (1 - (v - lo) / (hi - lo || 1))).toFixed(1)}`).join("")
                                })()}
                                fill="none"
                                stroke={p.delta >= 0 ? "var(--idb-ink)" : "var(--idb-t3)"}
                                strokeWidth={1.25}
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="idb-fig">FIG. 3 — Top 8 of 412 active SKUs</p>
                  </section>
                </div>
              </div>
              <aside className="idb-note" aria-label="Sage note on channels and products">
                <span className="idb-join" aria-hidden="true" />
                <div className="idb-note-by">
                  <span className="idb-dot" data-s="busy" aria-hidden="true" />
                  <span className="idb-lab">Sage · re FIG. 2</span>
                </div>
                <p className="idb-note-q"><Typed key={`n2-${range}`} text={notes[1]} delay={1300} /></p>
                <div className="idb-note-ev">
                  <span>Conf 0.74</span>
                  <span className="idb-conf idb-dith" style={{ "--m": tile(0.74) } as React.CSSProperties} aria-hidden="true" />
                  <span>5 sources</span>
                </div>
                <button type="button" className="idb-link" onClick={() => nav("Research desk")}>Investigate →</button>
              </aside>
            </div>

            {/* Row 4: geography + funnel + note 3 */}
            <div className="idb-row">
              <div className="idb-main">
                <div className="idb-pair">
                  <section className="idb-card" style={{ "--dl": ".35s" } as React.CSSProperties} key={`geo-${range}`}>
                    <Crops />
                    <Head small lab="Geography" title={<>UK <em>regions</em></>} sub="One tile per region; denser dither means more revenue." />
                    <div className="idb-map" role="group" aria-label="Revenue by UK region">
                      {bd.regions.map((r, i) => {
                        const dens = 0.1 + 0.72 * Math.sqrt(r.value / maxReg)
                        return (
                          <button
                            key={r.code}
                            type="button"
                            className="idb-tile"
                            style={{ "--c": r.c, "--r": r.r, "--dl": `${0.4 + i * 0.04}s` } as React.CSSProperties}
                            aria-pressed={region === r.code}
                            aria-label={`${r.name}, ${money(r.value)}`}
                            onClick={() => setRegion(r.code)}
                            onMouseEnter={() => setRegion(r.code)}
                          >
                            <span className="idb-tile-fill idb-dith" style={{ "--m": tile(dens), "--dl": `${0.4 + i * 0.04}s` } as React.CSSProperties} />
                            <span className="idb-tile-c">{r.code}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="idb-ramp">
                      <span className="idb-lab">Low</span>
                      <span className="idb-ramp-cells" aria-hidden="true">
                        {[0.12, 0.24, 0.38, 0.52, 0.66, 0.8].map((d) => (
                          <i key={d} className="idb-dith" style={{ "--m": tile(d) } as React.CSSProperties} />
                        ))}
                      </span>
                      <span className="idb-lab">High</span>
                    </div>
                    <div className="idb-readout" data-n="3">
                      <div>
                        <span className="idb-lab">Region</span>
                        <b>{sel.name}</b>
                      </div>
                      <div>
                        <span className="idb-lab">Revenue</span>
                        <b>{money(sel.value)}</b>
                      </div>
                      <div>
                        <span className="idb-lab">Share</span>
                        <b>
                          {((sel.value / cur.rev) * 100).toFixed(1)}%
                          {compare && <small className={sel.delta >= 0 ? "idb-ok" : "idb-bad"}>{sel.delta >= 0 ? "▲" : "▼"}{Math.abs(sel.delta * 100).toFixed(0)}%</small>}
                        </b>
                      </div>
                    </div>
                    <p className="idb-fig">FIG. 4 — Revenue by ITL1 region, tile map</p>
                  </section>

                  <section className="idb-card" style={{ "--dl": ".4s" } as React.CSSProperties} key={`fn-${range}`}>
                    <Crops />
                    <Head small lab="Funnel" title={<>Visit to <em>paid</em></>} sub="Solid is who stayed; dither is who left at each step." />
                    <ol className="idb-fn">
                      {FUNNEL.map((name, i) => {
                        const wPct = (bd.steps[i] / fnMax) * 100
                        const prevPct = i ? (bd.steps[i - 1] / fnMax) * 100 : wPct
                        return (
                          <li key={name} style={{ "--dl": `${0.45 + i * 0.1}s` } as React.CSSProperties}>
                            <span className="idb-lab">{name}</span>
                            <span className="idb-fn-bar">
                              {i > 0 && <span className="idb-fn-lost idb-dith" style={{ left: `${wPct}%`, width: `${prevPct - wPct}%`, "--m": tile(0.3) } as React.CSSProperties} />}
                              <span className="idb-fn-solid" style={{ width: `${wPct}%` }} />
                            </span>
                            <span className="idb-fn-c">
                              <Num value={bd.steps[i]} dp={0} />
                              <small>{wPct >= 10 ? wPct.toFixed(0) : wPct.toFixed(1)}%</small>
                            </span>
                            <span className="idb-fn-d" data-worst={i === bd.worst ? "" : undefined}>{i ? `−${bd.drops[i].toFixed(0)}%` : "–"}</span>
                          </li>
                        )
                      })}
                    </ol>
                    <div className="idb-readout" data-n="3">
                      <div>
                        <span className="idb-lab">Visit → paid</span>
                        <b>{((cur.orders / cur.visits) * 100).toFixed(2)}%</b>
                      </div>
                      <div>
                        <span className="idb-lab">Widest leak</span>
                        <b>{FUNNEL[bd.worst]}</b>
                      </div>
                      <div>
                        <span className="idb-lab">Lost</span>
                        <b>−{worstDrop.toFixed(0)}%</b>
                      </div>
                    </div>
                    <p className="idb-fig">FIG. 5 — Sessions by step, drop-off vs previous step</p>
                  </section>
                </div>
              </div>
              <aside className="idb-note" aria-label="Sage note on geography and funnel">
                <span className="idb-join" aria-hidden="true" />
                <div className="idb-note-by">
                  <span className="idb-dot" data-s="busy" aria-hidden="true" />
                  <span className="idb-lab">Sage · re FIG. 4–5</span>
                </div>
                <p className="idb-note-q"><Typed key={`n3-${range}`} text={notes[2]} delay={2200} /></p>
                <div className="idb-note-ev">
                  <span>Conf 0.66</span>
                  <span className="idb-conf idb-dith" style={{ "--m": tile(0.66) } as React.CSSProperties} aria-hidden="true" />
                  <span>2 sources</span>
                </div>
                <button type="button" className="idb-link" onClick={() => nav("Workbench")}>Investigate →</button>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
