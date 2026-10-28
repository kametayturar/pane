"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Loader2, Maximize2, Minus, Pause, Play, Plus, X, ZoomIn, ZoomOut } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Range = "1D" | "5D" | "1M" | "6M" | "1Y"
export type AverageId = "ma20" | "ma50"

export type Candle = {
  /** Open time in ms. Daily candles are read as UTC dates. */
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

/** Plug in real market data. Return `null` (or throw) for a symbol/range you cannot serve and the terminal falls back to its generated candles. */
export type CandleSource = (
  symbol: string,
  range: Range,
) => Promise<{ candles: Candle[]; name?: string; exchange?: string } | null>

export type MarketSymbol = {
  ticker: string
  name: string
  exchange: string
  /** Last price. */
  price: number
  /** Previous close – the day's change is measured from it. */
  prevClose: number
  /** Daily volatility as a fraction, e.g. `0.02`. Shapes the generated candles and the ticks. */
  volatility: number
  /** Average daily volume in shares. */
  avgVolume: number
}

export type Holding = { ticker: string; shares: number }
export type OrderSide = "buy" | "sell"
export type OrderType = "market" | "limit"
export type OrderStatus = "filled" | "working" | "canceled"

export type OrderRequest = {
  side: OrderSide
  type: OrderType
  ticker: string
  shares: number
  /** Market price at submit for market orders, the limit price for limit orders. */
  price: number
}

export type OrderRecord = OrderRequest & {
  id: string
  status: OrderStatus
  /** Display time, e.g. `"11:18"`. */
  time: string
}

export type MarketTerminalProps = {
  /** Watchlist symbols, in order. Candles are generated from them, deterministically per ticker and range. */
  symbols?: MarketSymbol[]
  /** Shares held per ticker. The ticket blocks selling more than is held. Memoize it: a new array resets the ticket's positions. */
  holdings?: Holding[]
  /** Cash available for buys. Fills update it. */
  buyingPower?: number
  /** Orders in the ticket's list, newest first. */
  orders?: OrderRecord[]
  /** Ticker charted on first render. Defaults to the first symbol. */
  defaultTicker?: string
  /** Time range on first render. 1D and 5D use 5 and 30 minute candles. */
  defaultRange?: Range
  /** Moving averages drawn on first render. Viewers toggle them in the toolbar. */
  defaultAverages?: AverageId[]
  /** Real candles for the charted symbol and range (debounced, cached per symbol and range). Falls back to generated candles. */
  source?: CandleSource
  /** Streams simulated ticks. Viewers can still pause and resume them with the Live button. */
  live?: boolean
  /** Milliseconds between simulated ticks. */
  tickInterval?: number
  /** Called when an order is submitted. Return a promise to keep the button pending; a rejection leaves the order unplaced. */
  onPlaceOrder?: (order: OrderRequest) => void | Promise<void>
  /** Called when a working order is canceled from the list. */
  onCancelOrder?: (order: OrderRecord) => void | Promise<void>
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                Sample data                                 */
/* -------------------------------------------------------------------------- */

export const SYMBOLS: MarketSymbol[] = [
  { ticker: "NVDA", name: "NVIDIA", exchange: "Nasdaq, USD", price: 185.58, prevClose: 182.97, volatility: 0.021, avgVolume: 142_000_000 },
  { ticker: "AAPL", name: "Apple", exchange: "Nasdaq, USD", price: 238.29, prevClose: 239.04, volatility: 0.013, avgVolume: 52_000_000 },
  { ticker: "MSFT", name: "Microsoft", exchange: "Nasdaq, USD", price: 514.55, prevClose: 509.8, volatility: 0.011, avgVolume: 21_000_000 },
  { ticker: "AMZN", name: "Amazon", exchange: "Nasdaq, USD", price: 226.59, prevClose: 228.1, volatility: 0.016, avgVolume: 38_000_000 },
  { ticker: "GOOGL", name: "Alphabet", exchange: "Nasdaq, USD", price: 251.73, prevClose: 248.68, volatility: 0.015, avgVolume: 28_000_000 },
  { ticker: "META", name: "Meta Platforms", exchange: "Nasdaq, USD", price: 767.67, prevClose: 772.45, volatility: 0.018, avgVolume: 12_500_000 },
  { ticker: "TSLA", name: "Tesla", exchange: "Nasdaq, USD", price: 412.35, prevClose: 401.3, volatility: 0.032, avgVolume: 88_000_000 },
  { ticker: "JPM", name: "JPMorgan Chase", exchange: "NYSE, USD", price: 301.23, prevClose: 299.64, volatility: 0.012, avgVolume: 9_200_000 },
]

export const HOLDINGS: Holding[] = [
  { ticker: "NVDA", shares: 120 },
  { ticker: "AAPL", shares: 50 },
  { ticker: "MSFT", shares: 30 },
]

export const ORDERS: OrderRecord[] = [
  { id: "o-2", side: "sell", type: "limit", ticker: "MSFT", shares: 4, price: 516, status: "working", time: "11:18" },
  { id: "o-1", side: "buy", type: "market", ticker: "NVDA", shares: 20, price: 183.64, status: "filled", time: "10:42" },
]

const RANGES: Range[] = ["1D", "5D", "1M", "6M", "1Y"]
const DAILY_BARS: Record<Range, number> = { "1D": 1, "5D": 5, "1M": 22, "6M": 126, "1Y": 252 }
const WARMUP = 50
/** The "today" of the generated data: a fixed Thursday, so the sample never changes between renders. */
const END_DAY = Date.UTC(2026, 9, 22)

/* -------------------------------------------------------------------------- */
/*                         Deterministic series generator                     */
/* -------------------------------------------------------------------------- */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rnd: () => number) {
  return () => {
    const u = Math.max(1e-9, rnd())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

function businessDays(end: number, n: number) {
  const out: number[] = []
  let t = end
  while (out.length < n) {
    const d = new Date(t).getUTCDay()
    if (d !== 0 && d !== 6) out.push(t)
    t -= 86_400_000
  }
  return out.reverse()
}

const dailyCache = new Map<string, Candle[]>()

/** Daily candles ending on END_DAY: a seeded random walk with a slow wave, pinned so the last close is `price` and the one before it is `prevClose`. */
function genDaily(sym: MarketSymbol): Candle[] {
  const n = DAILY_BARS["1Y"] + WARMUP
  const key = `${sym.ticker}|${sym.price}|${sym.prevClose}|${sym.volatility}|${sym.avgVolume}`
  const hit = dailyCache.get(key)
  if (hit) return hit
  const rnd = mulberry32(hash(`${sym.ticker}:daily`))
  const g = gaussian(rnd)
  const sg = sym.volatility
  const ph1 = rnd() * 6.28
  const ph2 = rnd() * 6.28
  const cum: number[] = []
  let x = 0
  for (let i = 0; i < n; i++) {
    x += sg * 0.2 * (Math.sin(i / 23 + ph1) + 0.6 * Math.sin(i / 9 + ph2)) + sg * g()
    cum.push(x)
  }
  const closes = cum.map((v) => sym.price * Math.exp(v - cum[n - 1]!))
  closes[n - 2] = sym.prevClose
  const days = businessDays(END_DAY, n)
  const out: Candle[] = []
  for (let i = 0; i < n; i++) {
    const c = round2(closes[i]!)
    const prev = i === 0 ? c * (1 - sg * 0.3) : closes[i - 1]!
    const o = round2(prev * (1 + g() * sg * 0.28))
    const h = round2(Math.max(o, c) * (1 + Math.abs(g()) * sg * 0.42 * (0.4 + rnd())))
    const l = round2(Math.min(o, c) * (1 - Math.abs(g()) * sg * 0.42 * (0.4 + rnd())))
    const ret = Math.abs(c - prev) / prev / sg
    const v = Math.round(sym.avgVolume * Math.exp(g() * 0.28) * (0.82 + ret * 0.32))
    out.push({ t: days[i]!, o, h, l, c, v })
  }
  const last = out[n - 1]!
  last.o = round2(sym.prevClose * (1 + 0.004 * Math.sign(g())))
  last.h = Math.max(last.h, last.o, last.c)
  last.l = Math.min(last.l, last.o, last.c)
  dailyCache.set(key, out)
  return out
}

/** Folds one daily candle into intraday bars: a Brownian bridge from open to close that touches the day's high and low. */
function intradayBars(day: Candle, steps: number, stepMin: number, seed: string): Candle[] {
  const rnd = mulberry32(hash(seed))
  const g = gaussian(rnd)
  const range = Math.max(day.h - day.l, day.o * 0.002)
  const W: number[] = [0]
  for (let k = 1; k <= steps; k++) W.push(W[k - 1]! + g())
  const path: number[] = []
  for (let k = 0; k <= steps; k++) {
    const bridge = W[k]! - (k / steps) * W[steps]!
    const p = day.o + (day.c - day.o) * (k / steps) + bridge * (range * 0.85) / Math.sqrt(steps)
    path.push(Math.min(day.h, Math.max(day.l, p)))
  }
  path[0] = day.o
  path[steps] = day.c
  const bars: Candle[] = []
  const profile: number[] = []
  let sum = 0
  for (let k = 0; k < steps; k++) {
    const p = 1 + 2.4 * Math.exp(-k / (steps * 0.08)) + 1.7 * Math.exp(-(steps - 1 - k) / (steps * 0.08))
    profile.push(p)
    sum += p
  }
  const open = day.t + (9 * 60 + 30) * 60_000
  for (let k = 0; k < steps; k++) {
    const o = path[k]!
    const c = path[k + 1]!
    const wick = (range / Math.sqrt(steps)) * 0.45
    const h = Math.min(day.h, Math.max(o, c) + Math.abs(g()) * wick * 0.7)
    const l = Math.max(day.l, Math.min(o, c) - Math.abs(g()) * wick * 0.7)
    bars.push({
      t: open + k * stepMin * 60_000,
      o: round2(o),
      h: round2(h),
      l: round2(l),
      c: round2(c),
      v: Math.round((day.v * (profile[k]! / sum)) * Math.exp(g() * 0.25)),
    })
  }
  let hi = 0
  let lo = 0
  bars.forEach((b, i) => {
    if (b.h > bars[hi]!.h) hi = i
    if (b.l < bars[lo]!.l) lo = i
  })
  bars[hi]!.h = day.h
  bars[lo]!.l = day.l
  bars[0]!.o = day.o
  bars[steps - 1]!.c = day.c
  bars.forEach((b) => {
    b.h = Math.max(b.h, b.o, b.c)
    b.l = Math.min(b.l, b.o, b.c)
  })
  return bars
}

function sma(candles: Candle[], period: number) {
  const out: number[] = new Array(candles.length).fill(Number.NaN)
  let sum = 0
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i]!.c
    if (i >= period) sum -= candles[i - period]!.c
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

type Series = {
  key: string
  candles: Candle[]
  ma20: number[]
  ma50: number[]
  intraday: boolean
  /** Bar length in minutes (daily = 1440). */
  stepMin: number
  remote: boolean
  range: Range
}

function makeSeries(key: string, range: Range, candles: Candle[], keep: number, remote: boolean, intraday: boolean, stepMin: number): Series {
  const m20 = sma(candles, 20)
  const m50 = sma(candles, 50)
  const from = Math.max(0, candles.length - keep)
  return {
    key,
    range,
    candles: candles.slice(from).map((c) => ({ ...c })),
    ma20: m20.slice(from),
    ma50: m50.slice(from),
    intraday,
    stepMin,
    remote,
  }
}

const genCache = new Map<string, Series>()

function generate(sym: MarketSymbol, range: Range): Series {
  const key = `${sym.ticker}|${range}|${sym.price}|${sym.prevClose}|${sym.volatility}`
  const hit = genCache.get(key)
  const base =
    hit ??
    (() => {
      const daily = genDaily(sym)
      let s: Series
      if (range === "1D" || range === "5D") {
        const days = range === "1D" ? 2 : 8
        const steps = range === "1D" ? 78 : 13
        const stepMin = range === "1D" ? 5 : 30
        const bars: Candle[] = []
        daily.slice(-days).forEach((d, i) => bars.push(...intradayBars(d, steps, stepMin, `${sym.ticker}:${range}:${i}`)))
        s = makeSeries(key, range, bars, steps * (range === "1D" ? 1 : 5), false, true, stepMin)
      } else {
        s = makeSeries(key, range, daily, DAILY_BARS[range], false, false, 1440)
      }
      genCache.set(key, s)
      return s
    })()
  return { ...base, candles: base.candles.map((c) => ({ ...c })) }
}

/* -------------------------------------------------------------------------- */
/*                         Live price engine (no React)                       */
/* -------------------------------------------------------------------------- */

type Quote = {
  ticker: string
  price: number
  prev: number
  open: number
  high: number
  low: number
  volume: number
  /** Direction of the last move, for the flash. */
  dir: 1 | -1 | 0
  seq: number
}

type Rebase = { price: number; prev: number; open: number; high: number; low: number; volume: number }

/** Holds every ticker's quote outside React. Rows and the header subscribe to one ticker, so a tick re-renders only what shows it. */
class Engine {
  private quotes = new Map<string, Quote>()
  private subs = new Map<string, Set<() => void>>()
  private tickSubs = new Set<() => void>()
  private fallback: Quote = { ticker: "", price: 0, prev: 0, open: 0, high: 0, low: 0, volume: 0, dir: 0, seq: 0 }
  readonly symbols: MarketSymbol[]

  constructor(symbols: MarketSymbol[]) {
    this.symbols = symbols
    for (const s of symbols) {
      const d = genDaily(s)
      const last = d[d.length - 1]!
      this.quotes.set(s.ticker, {
        ticker: s.ticker,
        price: s.price,
        prev: s.prevClose,
        open: last.o,
        high: Math.max(last.h, s.price),
        low: Math.min(last.l, s.price),
        volume: last.v,
        dir: 0,
        seq: 0,
      })
    }
  }

  get = (ticker: string) => this.quotes.get(ticker) ?? this.fallback

  subscribe = (ticker: string, fn: () => void) => {
    let set = this.subs.get(ticker)
    if (!set) this.subs.set(ticker, (set = new Set()))
    set.add(fn)
    return () => void set.delete(fn)
  }

  onTick = (fn: () => void) => {
    this.tickSubs.add(fn)
    return () => void this.tickSubs.delete(fn)
  }

  private put(q: Quote) {
    this.quotes.set(q.ticker, q)
    this.subs.get(q.ticker)?.forEach((f) => f())
  }

  /** Replace a ticker's quote, e.g. when real candles arrive. */
  rebase(ticker: string, r: Rebase) {
    const q = this.get(ticker)
    this.put({ ...q, ...r, ticker, dir: 0, seq: q.seq + 1 })
  }

  tick() {
    for (const s of this.symbols) {
      if (Math.random() > 0.55) continue
      const q = this.get(s.ticker)
      const pull = ((s.price - q.price) / s.price) * 0.03
      const z = (Math.random() + Math.random() + Math.random() - 1.5) * 1.6
      let next = round2(q.price * (1 + s.volatility * 0.055 * z + pull))
      if (next === q.price) next = round2(q.price + (Math.random() < 0.5 ? -0.01 : 0.01))
      this.put({
        ...q,
        price: next,
        high: Math.max(q.high, next),
        low: Math.min(q.low, next),
        volume: q.volume + Math.round(s.avgVolume * 0.00012 * (0.4 + Math.random())),
        dir: next > q.price ? 1 : -1,
        seq: q.seq + 1,
      })
    }
    this.tickSubs.forEach((f) => f())
  }
}

function useQuote(engine: Engine, ticker: string): Quote {
  const subscribe = React.useCallback((fn: () => void) => engine.subscribe(ticker, fn), [engine, ticker])
  const get = React.useCallback(() => engine.get(ticker), [engine, ticker])
  return React.useSyncExternalStore(subscribe, get, get)
}

/* -------------------------------------------------------------------------- */
/*                                 Formatting                                 */
/* -------------------------------------------------------------------------- */

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const pad2 = (n: number) => String(n).padStart(2, "0")

const fmtPrice = (v: number) =>
  Number.isFinite(v) ? v.toLocaleString("en-US", { minimumFractionDigits: v >= 1 ? 2 : 4, maximumFractionDigits: v >= 1 ? 2 : 4 }) : "–"
const fmtMoney = (v: number) => `$${fmtPrice(v)}`
const MINUS = "−"
const signed = (v: number, digits = 2) => `${v < 0 ? MINUS : "+"}${Math.abs(v).toFixed(digits)}`
const fmtVol = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${Math.round(v / 1e6)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(Math.round(v))

function fmtDate(t: number, intraday: boolean) {
  const d = new Date(t)
  const base = `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`
  return intraday ? `${base}, ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}` : `${base}, ${d.getUTCFullYear()}`
}

const nowLabel = () => {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/* -------------------------------------------------------------------------- */
/*                                Chart engine                                */
/* -------------------------------------------------------------------------- */

type View = { start: number; count: number }
type Palette = Record<"up" | "dn" | "ma1" | "ma2" | "grid" | "axis" | "text" | "cross" | "tag" | "tagInk" | "font", string>

const RIGHT_PAD = 3
const MIN_BARS = 12
const MIN_SPACING = 3

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function clampView(v: View, n: number): View {
  const maxC = n + RIGHT_PAD
  const count = clamp(v.count, Math.min(MIN_BARS, maxC), maxC)
  const hi = n + RIGHT_PAD - count
  const lo = Math.min(-count * 0.25, hi)
  return { start: clamp(v.start, lo, hi), count }
}

function defaultView(n: number, plotW: number): View {
  const count = Math.min(n, Math.max(MIN_BARS, Math.floor(plotW / (plotW < 520 ? 4.2 : MIN_SPACING))))
  return clampView({ start: n + RIGHT_PAD - count, count }, n)
}

function niceStep(range: number, target: number) {
  const rough = range / target
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 3.5 ? 2.5 : norm < 7 ? 5 : 10) * mag
}

export type ChartApi = { zoom: (factor: number) => void; reset: () => void }

type ChartState = {
  w: number
  h: number
  dpr: number
  cur: View
  tgt: View
  y: { min: number; max: number; vmax: number }
  ySnap: boolean
  dispC: number
  target: number
  vel: number
  cross: number | null
  pinned: boolean
  pointerY: number | null
  pal: Palette | null
  raf: number
  last: number
  needsReset: boolean
  seriesKey: string
  reduced: boolean
  yMoving: boolean
  pointers: Map<number, { x: number; y: number }>
  drag: { x0: number; start0: number; moved: boolean; t0: number; lastX: number; lastT: number; v: number } | null
  pinch: { d0: number; count0: number } | null
  ro: Record<string, HTMLElement | null>
  roText: Record<string, string>
}

function initState(): ChartState {
  return {
    w: 0,
    h: 0,
    dpr: 1,
    cur: { start: 0, count: 1 },
    tgt: { start: 0, count: 1 },
    y: { min: 0, max: 1, vmax: 1 },
    ySnap: true,
    dispC: 0,
    target: 0,
    vel: 0,
    cross: null,
    pinned: false,
    pointerY: null,
    pal: null,
    raf: 0,
    last: 0,
    needsReset: true,
    seriesKey: "",
    reduced: false,
    yMoving: false,
    pointers: new Map(),
    drag: null,
    pinch: null,
    ro: {},
    roText: {},
  }
}

type ChartProps = {
  engine: Engine
  ticker: string
  series: Series
  averages: AverageId[]
  loading: boolean
  ref?: React.Ref<ChartApi>
}

const Chart = React.memo(function Chart({ engine, ticker, series, averages, loading, ref }: ChartProps) {
  const [S] = React.useState(initState)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const roRef = React.useRef<HTMLDivElement>(null)
  const liveRef = React.useRef<HTMLSpanElement>(null)
  const P = React.useRef({ series, averages, ticker })
  const drawRef = React.useRef<() => void>(() => {})
  const hintId = React.useId()
  const n = series.candles.length

  /* ---- scheduling ---------------------------------------------------- */
  const schedule = React.useCallback(() => {
    if (S.raf) return
    S.raf = requestAnimationFrame((ts) => {
      S.raf = 0
      const dt = S.last ? Math.min(64, ts - S.last) : 16
      S.last = ts
      const moving = step(dt)
      drawRef.current()
      if (moving) schedule()
      else S.last = 0
    })

    function step(dt: number) {
      const { series: sr } = P.current
      const total = sr.candles.length
      const k = (tau: number) => (S.reduced ? 1 : 1 - Math.exp(-dt / tau))
      let moving = false
      if (S.vel !== 0 && !S.drag) {
        S.tgt = clampView({ start: S.tgt.start + S.vel * dt, count: S.tgt.count }, total)
        S.cur = { start: S.tgt.start, count: S.cur.count }
        S.vel *= Math.exp(-dt / 320)
        if (Math.abs(S.vel) < 0.0004 || S.tgt.start <= -S.tgt.count * 0.25) S.vel = 0
        moving = true
      }
      const kv = k(70)
      const ds = S.tgt.start - S.cur.start
      const dc = S.tgt.count - S.cur.count
      if (Math.abs(ds) > 0.002 || Math.abs(dc) > 0.002) {
        S.cur = { start: S.cur.start + ds * kv, count: S.cur.count + dc * kv }
        moving = true
      } else if (ds !== 0 || dc !== 0) {
        S.cur = { ...S.tgt }
      }
      const dp = S.target - S.dispC
      if (Math.abs(dp) > 0.0005) {
        S.dispC += dp * k(110)
        moving = true
      } else S.dispC = S.target
      if (S.yMoving) moving = true
      return moving
    }
  }, [S])

  /* ---- imperative API for the toolbar -------------------------------- */
  const zoomAt = React.useCallback(
    (factor: number, frac: number) => {
      const total = P.current.series.candles.length
      const t = S.tgt
      const anchor = t.start + frac * t.count
      const count = t.count / factor
      S.tgt = clampView({ start: anchor - frac * count, count }, total)
      schedule()
    },
    [S, schedule],
  )

  const resetView = React.useCallback(() => {
    const total = P.current.series.candles.length
    S.tgt = defaultView(total, plotWidth(S.w))
    S.vel = 0
    schedule()
  }, [S, schedule])

  React.useImperativeHandle(
    ref,
    () => ({
      zoom: (f) => {
        const total = P.current.series.candles.length
        const frac =
          S.cross !== null && total ? clamp((S.cross + 0.5 - S.tgt.start) / S.tgt.count, 0.05, 0.95) : 0.5
        zoomAt(f, frac)
      },
      reset: resetView,
    }),
    [S, zoomAt, resetView],
  )

  /* ---- draw ----------------------------------------------------------- */
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const { series: sr, averages: avg } = P.current
    const total = sr.candles.length
    if (!canvas || !ctx || !S.w || !total) return
    if (S.needsReset) {
      S.cur = S.tgt = defaultView(total, plotWidth(S.w))
      S.needsReset = false
    }
    if (!S.pal) S.pal = readPalette(canvas)
    const pal = S.pal
    const { w, h, dpr } = S
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const axisW = axisWidth(w)
    const plotR = w - axisW
    const TOP = 10
    const LABEL_H = 26
    const VOL_H = clamp(Math.round(h * 0.2), 52, 92)
    const volB = h - LABEL_H
    const volT = volB - VOL_H
    const priceB = volT - 14
    const spacing = plotR / S.cur.count
    const xOf = (i: number) => (i - S.cur.start + 0.5) * spacing
    const i0 = Math.max(0, Math.floor(S.cur.start) - 1)
    const i1 = Math.min(total - 1, Math.ceil(S.cur.start + S.cur.count))
    const cs = sr.candles
    const live = S.dispC || cs[total - 1]!.c

    const maVal = (id: AverageId, i: number) => {
      if (i !== total - 1) return (id === "ma20" ? sr.ma20 : sr.ma50)[i]!
      const p = id === "ma20" ? 20 : 50
      if (total < p) return Number.NaN
      let sum = live
      for (let j = total - p; j < total - 1; j++) sum += cs[j]!.c
      return sum / p
    }
    const hiOf = (i: number) => (i === total - 1 ? Math.max(cs[i]!.h, live) : cs[i]!.h)
    const loOf = (i: number) => (i === total - 1 ? Math.min(cs[i]!.l, live) : cs[i]!.l)

    /* scale */
    let lo = Infinity
    let hi = -Infinity
    let vmax = 0
    for (let i = i0; i <= i1; i++) {
      const x = xOf(i)
      if (x < -spacing || x > plotR + spacing) continue
      lo = Math.min(lo, loOf(i))
      hi = Math.max(hi, hiOf(i))
      vmax = Math.max(vmax, cs[i]!.v)
      for (const id of avg) {
        const m = maVal(id, i)
        if (Number.isFinite(m)) {
          lo = Math.min(lo, m)
          hi = Math.max(hi, m)
        }
      }
    }
    if (!Number.isFinite(lo)) {
      lo = live * 0.99
      hi = live * 1.01
    }
    const span = hi - lo || hi * 0.01
    const tMin = lo - span * 0.07
    const tMax = hi + span * 0.07
    const tV = vmax * 1.04 || 1
    if (S.ySnap) {
      S.y = { min: tMin, max: tMax, vmax: tV }
      S.ySnap = false
      S.yMoving = false
    } else {
      const k = S.reduced ? 1 : 0.2
      S.y = {
        min: S.y.min + (tMin - S.y.min) * k,
        max: S.y.max + (tMax - S.y.max) * k,
        vmax: S.y.vmax + (tV - S.y.vmax) * k,
      }
      S.yMoving = Math.abs(tMax - S.y.max) / span > 0.0015 || Math.abs(tMin - S.y.min) / span > 0.0015 || Math.abs(tV - S.y.vmax) / tV > 0.003
    }
    const yr = S.y.max - S.y.min || 1
    const yOf = (p: number) => TOP + ((S.y.max - p) / yr) * (priceB - TOP)
    const pOf = (y: number) => S.y.max - ((y - TOP) / (priceB - TOP)) * yr

    ctx.font = `11.5px ${pal.font}`
    ctx.textBaseline = "middle"

    /* time ticks */
    const ticks = timeTicks(sr, i0, i1, S.cur.count, spacing)

    /* grid */
    ctx.lineWidth = 1
    ctx.strokeStyle = pal.grid
    ctx.beginPath()
    const step = niceStep(yr, Math.max(3, Math.round((priceB - TOP) / 78)))
    const priceTicks: number[] = []
    for (let v = Math.ceil(S.y.min / step) * step; v <= S.y.max; v += step) priceTicks.push(v)
    for (const v of priceTicks) {
      const y = Math.round(yOf(v)) + 0.5
      ctx.moveTo(0, y)
      ctx.lineTo(plotR, y)
    }
    for (const t of ticks) {
      const x = Math.round(xOf(t.i)) + 0.5
      if (x < 0 || x > plotR) continue
      ctx.moveTo(x, TOP)
      ctx.lineTo(x, volB)
    }
    ctx.stroke()
    ctx.strokeStyle = pal.axis
    ctx.beginPath()
    ctx.moveTo(Math.round(plotR) + 0.5, TOP)
    ctx.lineTo(Math.round(plotR) + 0.5, volB)
    ctx.stroke()

    /* clip to plot */
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, plotR, h)
    ctx.clip()

    const bw0 = Math.max(1, Math.floor(spacing * 0.62))
    const bw = bw0 % 2 === 0 ? Math.max(1, bw0 - 1) : bw0

    /* volume */
    ctx.globalAlpha = 0.34
    for (let i = i0; i <= i1; i++) {
      const c = cs[i]!
      const cl = i === total - 1 ? live : c.c
      ctx.fillStyle = cl >= c.o ? pal.up : pal.dn
      const bh = Math.max(1, (c.v / S.y.vmax) * (VOL_H - 2))
      const cx = Math.floor(xOf(i)) + 0.5
      ctx.fillRect(cx - bw / 2, volB - bh, bw, bh)
    }
    ctx.globalAlpha = 1

    /* moving averages */
    ctx.lineWidth = 1.5
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    for (const id of avg) {
      ctx.strokeStyle = id === "ma20" ? pal.ma1 : pal.ma2
      ctx.beginPath()
      let pen = false
      for (let i = Math.max(0, i0 - 1); i <= Math.min(total - 1, i1 + 1); i++) {
        const m = maVal(id, i)
        if (!Number.isFinite(m)) {
          pen = false
          continue
        }
        const x = xOf(i)
        const y = yOf(m)
        if (pen) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
        pen = true
      }
      ctx.stroke()
    }

    /* candles */
    for (let i = i0; i <= i1; i++) {
      const c = cs[i]!
      const cl = i === total - 1 ? live : c.c
      const up = cl >= c.o
      const cx = Math.floor(xOf(i)) + 0.5
      const yH = yOf(hiOf(i))
      const yL = yOf(loOf(i))
      const yO = yOf(c.o)
      const yC = yOf(cl)
      ctx.fillStyle = up ? pal.up : pal.dn
      ctx.fillRect(Math.floor(cx), Math.round(yH), 1, Math.max(1, Math.round(yL) - Math.round(yH)))
      const top = Math.round(Math.min(yO, yC))
      const bh = Math.max(1, Math.round(Math.max(yO, yC)) - top)
      ctx.fillRect(cx - bw / 2, top, bw, bh)
    }
    ctx.restore()

    /* current price: dotted line + tag */
    const prevClose = engine.get(P.current.ticker).prev
    const priceUp = live >= prevClose
    const tagCol = priceUp ? pal.up : pal.dn
    const yLive = yOf(live)
    if (yLive > TOP && yLive < priceB) {
      ctx.save()
      ctx.strokeStyle = tagCol
      ctx.globalAlpha = 0.85
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(0, Math.round(yLive) + 0.5)
      ctx.lineTo(plotR, Math.round(yLive) + 0.5)
      ctx.stroke()
      ctx.restore()
    }

    /* price axis labels */
    ctx.fillStyle = pal.text
    ctx.textAlign = "left"
    const tagY = clamp(yLive, TOP + 10, priceB - 2)
    for (const v of priceTicks) {
      const y = yOf(v)
      if (Math.abs(y - tagY) < 17 || y < TOP + 4 || y > priceB) continue
      ctx.fillText(fmtPrice(v), plotR + 12, y)
    }
    tag(ctx, plotR + 6, tagY, axisW - 10, fmtPrice(live), tagCol, "#fff", pal.font)

    /* time labels */
    ctx.fillStyle = pal.text
    ctx.textAlign = "center"
    let lastEnd = -Infinity
    for (const t of ticks) {
      const x = xOf(t.i)
      const tw = ctx.measureText(t.label).width
      const cx = clamp(x + (sr.intraday ? 0 : 16), tw / 2 + 2, plotR - tw / 2 - 2)
      if (x < -4 || x > plotR + 4 || cx - tw / 2 < lastEnd + 12) continue
      ctx.fillText(t.label, cx, h - 11)
      lastEnd = cx + tw / 2
    }

    /* crosshair */
    if (S.cross !== null && S.cross >= 0 && S.cross < total) {
      const i = S.cross
      const x = xOf(i)
      if (x >= 0 && x <= plotR) {
        const c = cs[i]!
        const yy = S.pointerY ?? yOf(i === total - 1 ? live : c.c)
        ctx.save()
        ctx.strokeStyle = pal.cross
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(Math.floor(x) + 0.5, TOP)
        ctx.lineTo(Math.floor(x) + 0.5, volB)
        if (yy >= TOP && yy <= priceB) {
          ctx.moveTo(0, Math.round(yy) + 0.5)
          ctx.lineTo(plotR, Math.round(yy) + 0.5)
        }
        ctx.stroke()
        ctx.restore()
        if (yy >= TOP && yy <= priceB) tag(ctx, plotR + 6, yy, axisW - 10, fmtPrice(pOf(yy)), pal.tag, pal.tagInk, pal.font)
        const label = sr.intraday ? fmtDate(c.t, true).replace(", ", " ") : fmtDate(c.t, false)
        const tw = ctx.measureText(label).width + 16
        const lx = clamp(x, tw / 2, plotR - tw / 2)
        tag(ctx, lx - tw / 2, h - 12, tw, label, pal.tag, pal.tagInk, pal.font, true)
      }
    }

    updateReadout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, engine])

  /* ---- readout (text nodes written directly, only when they change) --- */
  const updateReadout = () => {
    const { series: sr, averages: avg } = P.current
    const total = sr.candles.length
    if (!total) return
    const i = S.cross !== null && S.cross < total ? S.cross : total - 1
    const c = sr.candles[i]!
    const isLast = i === total - 1
    const cl = isLast ? S.dispC || c.c : c.c
    const hi = isLast ? Math.max(c.h, cl) : c.h
    const lo = isLast ? Math.min(c.l, cl) : c.l
    const prev = i > 0 ? sr.candles[i - 1]!.c : c.o
    const pct = ((cl - prev) / prev) * 100
    const ma = (id: AverageId) => {
      if (!avg.includes(id)) return "–"
      if (!isLast) return fmtPrice((id === "ma20" ? sr.ma20 : sr.ma50)[i]!)
      const p = id === "ma20" ? 20 : 50
      if (total < p) return "–"
      let sum = cl
      for (let j = total - p; j < total - 1; j++) sum += sr.candles[j]!.c
      return fmtPrice(sum / p)
    }
    const vals: Record<string, string> = {
      date: fmtDate(c.t, sr.intraday),
      o: fmtPrice(c.o),
      h: fmtPrice(hi),
      l: fmtPrice(lo),
      c: fmtPrice(cl),
      pct: `${pct < 0 ? MINUS : "+"}${Math.abs(pct).toFixed(2)}%`,
      vol: fmtVol(c.v),
      ma20: ma("ma20"),
      ma50: ma("ma50"),
    }
    const root = roRef.current
    if (!root) return
    for (const k in vals) {
      const el = (S.ro[k] ??= root.querySelector<HTMLElement>(`[data-f="${k}"]`))
      if (el && S.roText[k] !== vals[k]) {
        el.textContent = vals[k]!
        S.roText[k] = vals[k]!
      }
    }
    const pctEl = S.ro.pct
    if (pctEl) pctEl.dataset.dir = pct < 0 ? "dn" : "up"
    root.dataset.ma20 = String(avg.includes("ma20"))
    root.dataset.ma50 = String(avg.includes("ma50"))
  }

  const announce = (i: number) => {
    const { series: sr } = P.current
    const c = sr.candles[i]
    const el = liveRef.current
    if (!c || !el) return
    const prev = i > 0 ? sr.candles[i - 1]!.c : c.o
    const cl = i === sr.candles.length - 1 ? S.dispC || c.c : c.c
    const pct = ((cl - prev) / prev) * 100
    el.textContent = `${fmtDate(c.t, sr.intraday)}. Open ${fmtPrice(c.o)}, high ${fmtPrice(c.h)}, low ${fmtPrice(c.l)}, close ${fmtPrice(cl)}, ${pct < 0 ? "down" : "up"} ${Math.abs(pct).toFixed(2)} percent, volume ${fmtVol(c.v)}.`
  }

  /* ---- props → mutable state ------------------------------------------ */
  React.useLayoutEffect(() => {
    P.current = { series, averages, ticker }
    if (S.seriesKey !== series.key || S.seriesKey === "") {
      S.seriesKey = series.key
      S.needsReset = true
      S.ySnap = true
      S.cross = null
      S.pinned = false
      S.vel = 0
      const last = series.candles[series.candles.length - 1]
      if (last) {
        if (!series.remote) {
          const p = engine.get(ticker).price
          last.c = p
          last.h = Math.max(last.h, p)
          last.l = Math.min(last.l, p)
        }
        S.target = S.dispC = last.c
      }
    }
    schedule()
  }, [S, series, averages, ticker, engine, schedule])

  React.useLayoutEffect(() => {
    drawRef.current = draw
  }, [draw])

  /* ---- live ticks glide the last candle ------------------------------- */
  React.useEffect(() => {
    return engine.subscribe(ticker, () => {
      const sr = P.current.series
      const last = sr.candles[sr.candles.length - 1]
      if (!last) return
      const p = engine.get(ticker).price
      last.c = p
      last.h = Math.max(last.h, p)
      last.l = Math.min(last.l, p)
      last.v += Math.round(last.v * 0.0006)
      S.target = p
      schedule()
    })
  }, [S, engine, ticker, schedule])

  /* ---- size, theme, wheel --------------------------------------------- */
  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    S.reduced = mq.matches
    const onMq = () => (S.reduced = mq.matches)
    mq.addEventListener("change", onMq)

    const measure = () => {
      const r = wrap.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      S.w = Math.round(r.width)
      S.h = Math.round(r.height)
      S.dpr = dpr
      canvas.width = Math.max(1, Math.round(S.w * dpr))
      canvas.height = Math.max(1, Math.round(S.h * dpr))
      S.pal = null
      schedule()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)

    const invalidate = () => {
      S.pal = null
      schedule()
    }
    const mo = new MutationObserver(invalidate)
    for (const el of [document.documentElement, document.body]) mo.observe(el, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const total = P.current.series.candles.length
      const scale = e.deltaMode === 1 ? 16 : 1
      const dx = e.deltaX * scale
      const dy = e.deltaY * scale
      const rect = wrap.getBoundingClientRect()
      const plotR = rect.width - axisWidth(rect.width)
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) {
        const sp = plotR / S.tgt.count
        S.tgt = clampView({ start: S.tgt.start + dx / sp, count: S.tgt.count }, total)
      } else {
        const frac = clamp((e.clientX - rect.left) / plotR, 0, 1)
        zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.012 : 0.0016)), frac)
      }
      schedule()
    }
    wrap.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      wrap.removeEventListener("wheel", onWheel)
      mq.removeEventListener("change", onMq)
      ro.disconnect()
      mo.disconnect()
      if (S.raf) cancelAnimationFrame(S.raf)
      S.raf = 0
    }
  }, [S, schedule, zoomAt])

  /* ---- pointer -------------------------------------------------------- */
  const idxAt = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    const plotR = rect.width - axisWidth(rect.width)
    const x = clientX - rect.left
    if (x < 0 || x > plotR) return null
    const i = Math.floor(S.cur.start + (x / plotR) * S.cur.count)
    const total = P.current.series.candles.length
    return i >= 0 && i < total ? i : null
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    S.vel = 0
    if (S.pointers.size === 1) {
      S.drag = { x0: e.clientX, start0: S.cur.start, moved: false, t0: e.timeStamp, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
      S.pinch = null
    } else if (S.pointers.size === 2) {
      const [a, b] = [...S.pointers.values()]
      S.pinch = { d0: Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1, count0: S.cur.count }
      S.drag = null
    }
    el.dataset.drag = "1"
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const total = P.current.series.candles.length
    const plotR = rect.width - axisWidth(rect.width)
    if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (S.pinch && S.pointers.size >= 2) {
      const [a, b] = [...S.pointers.values()]
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1
      const mid = (a!.x + b!.x) / 2 - rect.left
      const frac = clamp(mid / plotR, 0, 1)
      const anchor = S.cur.start + frac * S.cur.count
      const count = S.pinch.count0 * (S.pinch.d0 / d)
      const v = clampView({ start: anchor - frac * count, count }, total)
      S.cur = S.tgt = v
      schedule()
      return
    }
    if (S.drag) {
      const dx = e.clientX - S.drag.x0
      if (Math.abs(dx) > 3) S.drag.moved = true
      if (S.drag.moved) {
        const sp = plotR / S.cur.count
        const v = clampView({ start: S.drag.start0 - dx / sp, count: S.cur.count }, total)
        const dt = e.timeStamp - S.drag.lastT
        if (dt > 0) S.drag.v = (-(e.clientX - S.drag.lastX) / sp / dt) * 0.8 + S.drag.v * 0.2
        S.drag.lastX = e.clientX
        S.drag.lastT = e.timeStamp
        S.cur = S.tgt = v
        schedule()
        return
      }
    }
    if (e.pointerType === "mouse" && !S.pinned) {
      const i = idxAt(e.clientX)
      S.cross = i
      S.pointerY = e.clientY - rect.top
      schedule()
    }
  }

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = S.drag
    S.pointers.delete(e.pointerId)
    if (S.pointers.size < 2) S.pinch = null
    if (S.pointers.size === 0) {
      delete e.currentTarget.dataset.drag
      if (d && d.moved && !S.reduced && e.type === "pointerup" && e.timeStamp - d.lastT < 80) {
        S.vel = clamp(d.v, -0.06, 0.06)
        schedule()
      } else if (d && !d.moved && e.pointerType !== "mouse" && e.type === "pointerup" && e.timeStamp - d.t0 < 450) {
        if (S.cross !== null) {
          S.cross = null
          S.pinned = false
        } else {
          S.cross = idxAt(e.clientX)
          S.pinned = S.cross !== null
          S.pointerY = null
        }
        schedule()
      }
      S.drag = null
    }
  }

  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && !S.pinned && !S.drag) {
      S.cross = null
      S.pointerY = null
      schedule()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const total = P.current.series.candles.length
    if (!total) return
    const cur = S.cross ?? total - 1
    const move = (i: number) => {
      const idx = clamp(i, 0, total - 1)
      S.cross = idx
      S.pinned = true
      S.pointerY = null
      const t = S.tgt
      if (idx < t.start + 1) S.tgt = clampView({ start: idx - 1, count: t.count }, total)
      else if (idx > t.start + t.count - 2) S.tgt = clampView({ start: idx - t.count + 3, count: t.count }, total)
      announce(idx)
      schedule()
    }
    switch (e.key) {
      case "ArrowLeft":
        move(cur - (e.shiftKey ? 10 : 1))
        break
      case "ArrowRight":
        move(cur + (e.shiftKey ? 10 : 1))
        break
      case "Home":
        move(0)
        break
      case "End":
        move(total - 1)
        break
      case "+":
      case "=":
        zoomAt(1.3, S.cross !== null ? clamp((S.cross + 0.5 - S.tgt.start) / S.tgt.count, 0.05, 0.95) : 0.5)
        break
      case "-":
      case "_":
        zoomAt(1 / 1.3, S.cross !== null ? clamp((S.cross + 0.5 - S.tgt.start) / S.tgt.count, 0.05, 0.95) : 0.5)
        break
      case "0":
        resetView()
        break
      case "Escape":
        S.cross = null
        S.pinned = false
        schedule()
        break
      default:
        return
    }
    e.preventDefault()
  }

  return (
    <div className="mt__chart">
      <div className="mt__readout" ref={roRef} aria-hidden="true" data-ma20="true" data-ma50="true">
        <b className="mt__ro-date" data-f="date" />
        <span className="mt__ro-i">
          <i>O</i> <b data-f="o" />
        </span>
        <span className="mt__ro-i">
          <i>H</i> <b data-f="h" />
        </span>
        <span className="mt__ro-i">
          <i>L</i> <b data-f="l" />
        </span>
        <span className="mt__ro-i">
          <i>C</i> <b data-f="c" />
        </span>
        <b className="mt__ro-pct" data-f="pct" data-dir="up" />
        <span className="mt__ro-i">
          <i>Vol</i> <b data-f="vol" />
        </span>
        <span className="mt__ro-i mt__ro-ma1">
          <i>MA 20</i> <b data-f="ma20" />
        </span>
        <span className="mt__ro-i mt__ro-ma2">
          <i>MA 50</i> <b data-f="ma50" />
        </span>
      </div>
      <div
        ref={wrapRef}
        className="mt__surface"
        tabIndex={0}
        role="img"
        aria-roledescription="candlestick chart"
        aria-label={`${ticker} candlestick chart, ${series.range}, ${series.intraday ? `${series.stepMin} minute` : "daily"} candles, ${n} candles`}
        aria-describedby={hintId}
        data-loading={loading || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (S.pinned && S.cross !== null && S.pointers.size === 0 && !S.drag) return
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      <span id={hintId} className="mt__sr">
        Use left and right arrows to inspect candles, shift to move ten, plus and minus to zoom, and 0 to reset the view.
      </span>
      <span className="mt__sr" role="status" aria-live="polite" ref={liveRef} />
    </div>
  )
})

const axisWidth = (w: number) => (w < 420 ? 54 : 68)
const plotWidth = (w: number) => w - axisWidth(w)

function readPalette(el: HTMLElement): Palette {
  const root = el.closest<HTMLElement>(".mt") ?? el
  const cs = getComputedStyle(root)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  return {
    up: v("--mt-up"),
    dn: v("--mt-dn"),
    ma1: v("--mt-ma1"),
    ma2: v("--mt-ma2"),
    grid: v("--mt-grid"),
    axis: v("--mt-axis"),
    text: v("--mt-axis-text"),
    cross: v("--mt-cross"),
    tag: v("--mt-tag"),
    tagInk: v("--mt-tag-ink"),
    font: cs.fontFamily,
  }
}

function tag(ctx: CanvasRenderingContext2D, x: number, yc: number, w: number, text: string, bg: string, ink: string, font: string, center = false) {
  const h = 22
  ctx.save()
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(x, yc - h / 2, w, h, 6)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.font = `600 11.5px ${font}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x + w / 2, yc + (center ? 0.5 : 0.5))
  ctx.restore()
}

type TimeTick = { i: number; label: string }

function timeTicks(sr: Series, i0: number, i1: number, count: number, spacing: number): TimeTick[] {
  const cs = sr.candles
  const out: TimeTick[] = []
  if (!sr.intraday) {
    if (count > 52) {
      for (let i = Math.max(1, i0); i <= i1; i++) {
        const m = new Date(cs[i]!.t).getUTCMonth()
        const pm = new Date(cs[i - 1]!.t).getUTCMonth()
        if (m !== pm) out.push({ i, label: m === 0 ? `${MON[m]} ${new Date(cs[i]!.t).getUTCFullYear()}` : MON[m]! })
      }
    } else {
      const stepBars = Math.max(1, Math.ceil(84 / spacing))
      for (let i = i0; i <= i1; i++) {
        if (i % stepBars !== 0) continue
        const d = new Date(cs[i]!.t)
        out.push({ i, label: `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` })
      }
    }
    return out
  }
  const hourly = sr.stepMin <= 5 || count <= 26
  for (let i = Math.max(0, i0); i <= i1; i++) {
    const d = new Date(cs[i]!.t)
    if (hourly) {
      if (d.getUTCMinutes() === 0) out.push({ i, label: `${pad2(d.getUTCHours())}:00` })
    } else if (i === 0 || new Date(cs[i - 1]!.t).getUTCDate() !== d.getUTCDate()) {
      out.push({ i, label: `${DOW[d.getUTCDay()]} ${d.getUTCDate()}` })
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                               Small widgets                                */
/* -------------------------------------------------------------------------- */

/** Measures the active child and slides a pill (or a row fill) to it. Writes CSS variables, never state. */
function useIndicator(track: React.RefObject<HTMLElement | null>, dep: unknown) {
  React.useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const place = () => {
      const a = el.querySelector<HTMLElement>('[data-active="true"]')
      if (!a) return
      el.style.setProperty("--ix", `${a.offsetLeft}px`)
      el.style.setProperty("--iy", `${a.offsetTop}px`)
      el.style.setProperty("--iw", `${a.offsetWidth}px`)
      el.style.setProperty("--ih", `${a.offsetHeight}px`)
      el.dataset.m = "1"
      if (!el.dataset.ready) requestAnimationFrame(() => (el.dataset.ready = "1"))
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [track, dep])
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  fill,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  label: string
  fill?: boolean
}) {
  const track = React.useRef<HTMLDivElement>(null)
  useIndicator(track, value)
  return (
    <div className="mt__seg" role="group" aria-label={label} data-fill={fill || undefined}>
      <div className="mt__seg-in" ref={track}>
        <span className="mt__seg-ind" aria-hidden="true" />
        {options.map((o) => (
          <button key={o} type="button" className="mt__seg-b" aria-pressed={o === value} data-active={o === value} onClick={() => onChange(o)}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

function Digit({ d }: { d: number }) {
  return (
    <span className="mt__dg">
      <span className="mt__dg-w">0</span>
      <span className="mt__dg-s" style={{ "--d": d } as React.CSSProperties}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => (
          <i key={x}>{x}</i>
        ))}
      </span>
    </span>
  )
}

/** Odometer: each digit is a 0-9 strip that slides to its value. */
function Rolling({ text }: { text: string }) {
  const chars = [...text]
  return (
    <>
      <span className="mt__sr">{text}</span>
      <span className="mt__roll" aria-hidden="true">
        {chars.map((ch, i) => {
          const key = chars.length - i
          return /\d/.test(ch) ? <Digit key={key} d={Number(ch)} /> : <span key={key}>{ch}</span>
        })}
      </span>
    </>
  )
}

function Sparkline({ values, base, up }: { values: number[]; base: number; up: boolean }) {
  const w = 64
  const h = 28
  const lo = Math.min(...values, base)
  const hi = Math.max(...values, base)
  const r = hi - lo || 1
  const y = (v: number) => 3 + (1 - (v - lo) / r) * (h - 6)
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * w).toFixed(1)} ${y(v).toFixed(1)}`).join("")
  return (
    <svg className="mt__spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" data-dir={up ? "up" : "dn"}>
      <line x1="0" x2={w} y1={y(base)} y2={y(base)} className="mt__spark-base" />
      <path d={d} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Sections                                  */
/* -------------------------------------------------------------------------- */

function Quote({ engine, ticker }: { engine: Engine; ticker: string }) {
  const q = useQuote(engine, ticker)
  const delta = q.price - q.prev
  const pct = q.prev ? (delta / q.prev) * 100 : 0
  const up = delta >= 0
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <div className="mt__row2">
      <div className="mt__quote">
        <div className="mt__price">
          <Rolling text={fmtMoney(q.price)} />
        </div>
        <div className="mt__delta" data-dir={up ? "up" : "dn"}>
          <Arrow size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>
            {signed(delta)} ({signed(pct)}%)
          </span>
          <em>today</em>
        </div>
      </div>
      <dl className="mt__stats">
        {(
          [
            ["Open", fmtPrice(q.open)],
            ["High", fmtPrice(q.high)],
            ["Low", fmtPrice(q.low)],
            ["Volume", fmtVol(q.volume)],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const WatchRow = React.memo(function WatchRow({
  engine,
  sym,
  spark,
  selected,
  tabbable,
  onSelect,
}: {
  engine: Engine
  sym: MarketSymbol
  spark: number[]
  selected: boolean
  tabbable: boolean
  onSelect: (t: string) => void
}) {
  const q = useQuote(engine, sym.ticker)
  const flash = React.useRef<HTMLElement>(null)
  const seen = React.useRef(q.seq)
  React.useEffect(() => {
    if (seen.current === q.seq) return
    seen.current = q.seq
    const el = flash.current
    if (!el || q.dir === 0) return
    el.dataset.dir = q.dir > 0 ? "up" : "dn"
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.animate(reduced ? [{ opacity: 0.7 }, { opacity: 0.7, offset: 0.7 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], {
      duration: reduced ? 450 : 900,
      easing: "cubic-bezier(.22, 1, .36, 1)",
    })
  }, [q.seq, q.dir])
  const pct = q.prev ? ((q.price - q.prev) / q.prev) * 100 : 0
  const up = pct >= 0
  const values = [...spark.slice(0, -1), q.price]
  return (
    <li className="mt__li" data-active={selected}>
      <button
        type="button"
        className="mt__row"
        aria-current={selected || undefined}
        tabIndex={tabbable ? 0 : -1}
        data-sym={sym.ticker}
        aria-label={`${sym.ticker}, ${sym.name}, ${fmtPrice(q.price)}, ${up ? "up" : "down"} ${Math.abs(pct).toFixed(2)} percent today`}
        onClick={() => onSelect(sym.ticker)}
      >
        <span className="mt__row-id">
          <b>{sym.ticker}</b>
          <small>{sym.name}</small>
        </span>
        <Sparkline values={values} base={q.prev} up={up} />
        <span className="mt__row-px">
          <b className="mt__px">
            <i ref={flash} className="mt__flash" data-dir="up" />
            <span>{fmtPrice(q.price)}</span>
          </b>
          <small data-dir={up ? "up" : "dn"}>
            {pct < 0 ? MINUS : "+"}
            {Math.abs(pct).toFixed(2)}%
          </small>
        </span>
      </button>
    </li>
  )
})

function Watchlist({ engine, symbols, sparks, ticker, onSelect }: { engine: Engine; symbols: MarketSymbol[]; sparks: Map<string, number[]>; ticker: string; onSelect: (t: string) => void }) {
  const list = React.useRef<HTMLUListElement>(null)
  useIndicator(list, ticker)
  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowUp", "ArrowDown", "Home", "End"]
    if (!keys.includes(e.key)) return
    const rows = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button.mt__row")]
    const at = rows.indexOf(document.activeElement as HTMLButtonElement)
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : clamp(at + (e.key === "ArrowDown" ? 1 : -1), 0, rows.length - 1)
    rows[next]?.focus()
    e.preventDefault()
  }
  return (
    <section className="mt__card mt__watch" aria-label="Watchlist">
      <div className="mt__panel-head">
        <h3>Watchlist</h3>
        <span>{symbols.length} symbols</span>
      </div>
      <ul className="mt__list" ref={list} onKeyDown={onKeyDown}>
        <span className="mt__list-ind" aria-hidden="true" />
        {symbols.map((s) => (
          <WatchRow key={s.ticker} engine={engine} sym={s} spark={sparks.get(s.ticker) ?? []} selected={s.ticker === ticker} tabbable={s.ticker === ticker} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  )
}

function sparkFor(sym: MarketSymbol) {
  const d = genDaily(sym)
  const bars = intradayBars(d[d.length - 1]!, 78, 5, `${sym.ticker}:spark`)
  const pts: number[] = []
  for (let i = 0; i < bars.length; i += 3) pts.push(bars[i]!.c)
  pts.push(sym.price)
  return pts
}

/* ---- Ticket ------------------------------------------------------------ */

function digitsOnly(s: string, max: number) {
  return s.replace(/\D/g, "").slice(0, max)
}

function TicketBody({
  engine,
  ticker,
  held,
  buyingPower,
  place,
}: {
  engine: Engine
  ticker: string
  held: number
  buyingPower: number
  place: (o: OrderRequest) => Promise<string | null>
}) {
  const q = useQuote(engine, ticker)
  const [side, setSide] = React.useState<OrderSide>("buy")
  const [type, setType] = React.useState<OrderType>("market")
  const [sharesStr, setSharesStr] = React.useState("10")
  const [limitStr, setLimitStr] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const sharesId = React.useId()
  const limitId = React.useId()

  const shares = Number(sharesStr) || 0
  const limit = Number.parseFloat(limitStr)
  const price = type === "limit" ? (Number.isFinite(limit) ? limit : 0) : q.price
  const cost = shares * price

  let problem: string | null = null
  if (shares < 1) problem = "Enter at least 1 share."
  else if (type === "limit" && !(limit > 0)) problem = "Enter a limit price."
  else if (side === "sell" && shares > held) problem = held ? `You hold ${held} share${held === 1 ? "" : "s"} of ${ticker}.` : `You don't hold any ${ticker} to sell.`
  else if (side === "buy" && cost > buyingPower) problem = "Not enough buying power for this order."

  const nudge = (d: number) => setSharesStr(String(Math.max(0, shares + d) || (d > 0 ? 1 : 0)))
  const pickType = (t: OrderType) => {
    setType(t)
    if (t === "limit" && !limitStr) setLimitStr(q.price.toFixed(2))
  }

  const submit = async () => {
    if (problem || pending) return
    setPending(true)
    setErr(null)
    const failed = await place({ side, type, ticker, shares, price: round2(price) })
    setPending(false)
    if (failed) setErr(failed)
  }

  return (
    <div className="mt__ticket">
      <div className="mt__t-top">
        <Segmented options={["buy", "sell"] as const} value={side} onChange={setSide} label="Side" />
        <Segmented options={["market", "limit"] as const} value={type} onChange={pickType} label="Order type" />
      </div>
      <div className="mt__field">
        <div className="mt__field-l">
          <label htmlFor={sharesId}>Shares</label>
        </div>
        <div className="mt__stepper">
          <button type="button" aria-label="Decrease shares" onClick={() => nudge(-1)} disabled={shares <= 1}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            id={sharesId}
            inputMode="numeric"
            autoComplete="off"
            value={sharesStr}
            aria-invalid={shares < 1 || undefined}
            onChange={(e) => setSharesStr(digitsOnly(e.target.value, 6))}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault()
                nudge((e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1))
              }
            }}
          />
          <button type="button" aria-label="Increase shares" onClick={() => nudge(1)}>
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt__limit" data-open={type === "limit"} inert={type !== "limit"}>
        <div className="mt__limit-in">
          <div className="mt__field">
            <div className="mt__field-l">
              <label htmlFor={limitId}>Limit price</label>
            </div>
            <div className="mt__stepper mt__money">
              <span aria-hidden="true">$</span>
              <input
                id={limitId}
                inputMode="decimal"
                autoComplete="off"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 10))}
              />
            </div>
          </div>
        </div>
      </div>
      <dl className="mt__sum">
        <div>
          <dt>{type === "limit" ? "Market price" : "Market price"}</dt>
          <dd>{fmtMoney(q.price)}</dd>
        </div>
        <div>
          <dt>Estimated cost</dt>
          <dd>{fmtMoney(cost)}</dd>
        </div>
        <div>
          <dt>Buying power</dt>
          <dd>{fmtMoney(buyingPower)}</dd>
        </div>
      </dl>
      <p className="mt__status" role="status" aria-live="polite">
        {err ?? problem ?? ""}
      </p>
      <button type="button" className="mt__go" disabled={!!problem || pending} onClick={submit}>
        {pending ? <Loader2 size={16} className="mt__spin" aria-hidden="true" /> : null}
        {pending ? "Placing order" : `${side === "buy" ? "Buy" : "Sell"} ${shares || 0} ${ticker}`}
      </button>
      <p className="mt__note">Paper trading. Prices and orders are simulated.</p>
    </div>
  )
}

type OrderRow = OrderRecord & { fresh?: boolean }

function Orders({ orders, onCancel, busy }: { orders: OrderRow[]; onCancel: (o: OrderRecord) => void; busy: Set<string> }) {
  return (
    <div className="mt__orders">
      <h3>Orders</h3>
      {orders.length === 0 ? (
        <p className="mt__empty">No orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id} className="mt__ord" data-new={o.fresh || undefined}>
              <div className="mt__ord-in">
                <div className="mt__ord-row">
                  <span className="mt__ord-t">
                    <b>
                      {o.side === "buy" ? "Buy" : "Sell"} {o.shares} {o.ticker}
                    </b>
                    <small>
                      {o.type === "limit" ? "Limit" : "Market"} at {fmtMoney(o.price)}, {o.time}
                    </small>
                  </span>
                  <span className="mt__pill" data-status={o.status}>
                    {o.status === "filled" ? "Filled" : o.status === "working" ? "Working" : "Canceled"}
                  </span>
                  {o.status === "working" ? (
                    <button type="button" className="mt__icon" aria-label={`Cancel ${o.side} ${o.shares} ${o.ticker} order`} disabled={busy.has(o.id)} onClick={() => onCancel(o)}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="mt__icon-gap" aria-hidden="true" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const NO_CACHE: Record<string, SourceResult> = {}
type SourceResult = { candles: Candle[]; name?: string; exchange?: string } | null

function sanitize(res: unknown): SourceResult {
  if (!res || typeof res !== "object") return null
  const r = res as { candles?: unknown; name?: unknown; exchange?: unknown }
  if (!Array.isArray(r.candles)) return null
  const ok = (r.candles as Candle[])
    .filter((c) => c && [c.t, c.o, c.h, c.l, c.c].every((v) => typeof v === "number" && Number.isFinite(v)))
    .map((c) => ({ ...c, v: Number.isFinite(c.v) ? c.v : 0 }))
    .sort((a, b) => a.t - b.t)
  if (ok.length < 2) return null
  return { candles: ok, name: typeof r.name === "string" ? r.name : undefined, exchange: typeof r.exchange === "string" ? r.exchange : undefined }
}

export function MarketTerminal({
  symbols = SYMBOLS,
  holdings = HOLDINGS,
  buyingPower = 24860.35,
  orders = ORDERS,
  defaultTicker,
  defaultRange = "6M",
  defaultAverages = ["ma20", "ma50"],
  source,
  live = true,
  tickInterval = 1200,
  onPlaceOrder,
  onCancelOrder,
  className,
}: MarketTerminalProps) {
  const engine = React.useMemo(() => new Engine(symbols), [symbols])
  const sparks = React.useMemo(() => new Map(symbols.map((s) => [s.ticker, sparkFor(s)] as const)), [symbols])
  const [ticker, setTicker] = React.useState(() => (defaultTicker && symbols.some((s) => s.ticker === defaultTicker) ? defaultTicker : symbols[0]!.ticker))
  const [range, setRange] = React.useState<Range>(defaultRange)
  const [averages, setAverages] = React.useState<AverageId[]>(defaultAverages)
  const [paused, setPaused] = React.useState(!live)

  /* props seed the state; a new array / number from the parent replaces it */
  const [orderList, setOrderList] = React.useState<OrderRow[]>(orders)
  const [seenOrders, setSeenOrders] = React.useState(orders)
  if (seenOrders !== orders) {
    setSeenOrders(orders)
    setOrderList(orders)
  }
  const [held, setHeld] = React.useState(holdings)
  const [seenHoldings, setSeenHoldings] = React.useState(holdings)
  if (seenHoldings !== holdings) {
    setSeenHoldings(holdings)
    setHeld(holdings)
  }
  const [bp, setBp] = React.useState(buyingPower)
  const [seenBp, setSeenBp] = React.useState(buyingPower)
  if (seenBp !== buyingPower) {
    setSeenBp(buyingPower)
    setBp(buyingPower)
  }
  const [busy, setBusy] = React.useState<Set<string>>(() => new Set())

  const ordersRef = React.useRef(orderList)
  const bpRef = React.useRef(bp)
  const heldRef = React.useRef(held)
  React.useLayoutEffect(() => {
    ordersRef.current = orderList
    bpRef.current = bp
    heldRef.current = held
  })
  const counter = React.useRef(0)
  const chartApi = React.useRef<ChartApi>(null)

  const sym = symbols.find((s) => s.ticker === ticker) ?? symbols[0]!

  /* ---- optional real candles ---- */
  const key = `${ticker}|${range}`
  const [cache, setCache] = React.useState<{ src: CandleSource | undefined; map: Record<string, SourceResult> }>({ src: source, map: {} })
  if (cache.src !== source) setCache({ src: source, map: {} })
  const inflight = React.useRef(new Set<string>())
  const map = cache.src === source ? cache.map : NO_CACHE
  React.useEffect(() => {
    if (!source || key in map || inflight.current.has(key)) return
    const timer = window.setTimeout(async () => {
      inflight.current.add(key)
      let res: SourceResult = null
      try {
        res = sanitize(await source(ticker, range))
      } catch {
        res = null
      }
      inflight.current.delete(key)
      setCache((c) => (c.src !== source || key in c.map ? c : { src: source, map: { ...c.map, [key]: res } }))
    }, 280)
    return () => window.clearTimeout(timer)
  }, [source, key, map, ticker, range])

  const remote = source ? (map[key] ?? null) : null
  const loading = !!source && !(key in map)

  const series = React.useMemo(() => {
    if (remote) {
      const intraday = range === "1D" || range === "5D"
      const gap = remote.candles.length > 1 ? remote.candles[1]!.t - remote.candles[0]!.t : 86_400_000
      return makeSeries(`${key}|remote`, range, remote.candles, remote.candles.length, true, intraday, Math.round(gap / 60_000))
    }
    return generate(sym, range)
  }, [remote, sym, range, key])

  /* real candles also rebase the quote, so header, watchlist and ticket agree with the chart */
  React.useEffect(() => {
    if (!remote || series.intraday) return
    const cs = series.candles
    const last = cs[cs.length - 1]!
    engine.rebase(ticker, {
      price: last.c,
      prev: cs.length > 1 ? cs[cs.length - 2]!.c : last.o,
      open: last.o,
      high: last.h,
      low: last.l,
      volume: last.v,
    })
  }, [remote, series, engine, ticker])

  /* ---- ticks ---- */
  React.useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      if (!document.hidden) engine.tick()
    }, Math.max(200, tickInterval))
    return () => window.clearInterval(id)
  }, [engine, paused, tickInterval])

  /* working limit orders fill when the live price crosses them */
  React.useEffect(
    () =>
      engine.onTick(() => {
        const fills: [OrderRow, number][] = []
        for (const o of ordersRef.current) {
          if (o.status !== "working") continue
          const fp = fillPrice(o, engine.get(o.ticker).price)
          if (fp === null) continue
          if (o.side === "buy" && o.shares * fp > bpRef.current) continue
          fills.push([o, fp])
        }
        if (!fills.length) return
        const ids = new Map(fills.map(([o, p]) => [o.id, p] as const))
        const next = ordersRef.current.map((o) => (ids.has(o.id) ? { ...o, status: "filled" as const, price: o.type === "market" ? ids.get(o.id)! : o.price } : o))
        ordersRef.current = next
        setOrderList(next)
        for (const [o, p] of fills) applyFill(o.side, o.ticker, o.shares, p)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine],
  )

  function applyFill(side: OrderSide, t: string, shares: number, price: number) {
    const delta = side === "buy" ? shares : -shares
    bpRef.current -= delta * price
    setBp((v) => v - delta * price)
    setHeld((h) => {
      const has = h.some((x) => x.ticker === t)
      const next = has ? h.map((x) => (x.ticker === t ? { ...x, shares: Math.max(0, x.shares + delta) } : x)) : [...h, { ticker: t, shares: Math.max(0, delta) }]
      heldRef.current = next
      return next
    })
  }

  /** Returns an error message, or null once the order is in. */
  const place = async (req: OrderRequest): Promise<string | null> => {
    try {
      await onPlaceOrder?.(req)
    } catch (e) {
      return e instanceof Error && e.message ? `Order not placed: ${e.message}` : "Order not placed. Try again."
    }
    const cur = engine.get(req.ticker).price
    const fp = fillPrice({ ...req, status: "working" }, cur)
    const rec: OrderRow = {
      ...req,
      id: `o-${Date.now().toString(36)}-${counter.current++}`,
      status: fp === null ? "working" : "filled",
      price: req.type === "market" ? cur : req.price,
      time: nowLabel(),
      fresh: true,
    }
    if (fp !== null) applyFill(req.side, req.ticker, req.shares, fp)
    const next = [rec, ...ordersRef.current.map((o) => (o.fresh ? { ...o, fresh: false } : o))]
    ordersRef.current = next
    setOrderList(next)
    return null
  }

  const cancel = async (o: OrderRecord) => {
    setBusy((b) => new Set(b).add(o.id))
    try {
      await onCancelOrder?.(o)
      const next = ordersRef.current.map((x) => (x.id === o.id ? { ...x, status: "canceled" as const } : x))
      ordersRef.current = next
      setOrderList(next)
    } catch {
      /* the order stays working */
    }
    setBusy((b) => {
      const n = new Set(b)
      n.delete(o.id)
      return n
    })
  }

  const toggleAvg = (id: AverageId) => setAverages((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  const heldShares = held.find((h) => h.ticker === ticker)?.shares ?? 0
  const name = remote?.name ?? sym.name
  const exchange = remote?.exchange ?? sym.exchange

  return (
    <div className={["mt", className].filter(Boolean).join(" ")}>
      <style href="market-terminal" precedence="default">
        {CSS}
      </style>

      <section className="mt__card mt__main" aria-label={`${ticker} chart`}>
        <header className="mt__head">
          <div className="mt__id">
            <div className="mt__id-1">
              <h2>{ticker}</h2>
              <span>{name}</span>
            </div>
            <div className="mt__id-2">
              <span>{exchange}</span>
              {remote ? <span className="mt__badge">Live data</span> : null}
            </div>
          </div>
          <button
            type="button"
            className="mt__live"
            data-on={!paused}
            aria-label={paused ? "Resume live prices" : "Pause live prices"}
            onClick={() => setPaused((p) => !p)}
          >
            <span className="mt__dot" aria-hidden="true" />
            <span className="mt__live-t">{paused ? "Paused" : "Live"}</span>
            {paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} fill="currentColor" aria-hidden="true" />}
          </button>
          <Quote engine={engine} ticker={ticker} />
        </header>

        <div className="mt__toolbar">
          <Segmented options={RANGES} value={range} onChange={setRange} label="Time range" />
          <div className="mt__tools">
            <div className="mt__group" role="group" aria-label="Moving averages">
              {(
                [
                  ["ma20", "MA 20"],
                  ["ma50", "MA 50"],
                ] as const
              ).map(([id, text]) => (
                <button key={id} type="button" className="mt__avg" data-id={id} aria-pressed={averages.includes(id)} onClick={() => toggleAvg(id)}>
                  <i aria-hidden="true" />
                  {text}
                </button>
              ))}
            </div>
            <div className="mt__group" role="group" aria-label="Zoom">
              <button type="button" className="mt__icon" aria-label="Zoom in" onClick={() => chartApi.current?.zoom(1.4)}>
                <ZoomIn size={16} aria-hidden="true" />
              </button>
              <button type="button" className="mt__icon" aria-label="Zoom out" onClick={() => chartApi.current?.zoom(1 / 1.4)}>
                <ZoomOut size={16} aria-hidden="true" />
              </button>
              <button type="button" className="mt__icon" aria-label="Reset view" onClick={() => chartApi.current?.reset()}>
                <Maximize2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <Chart ref={chartApi} engine={engine} ticker={ticker} series={series} averages={averages} loading={loading} />
      </section>

      <div className="mt__side">
        <Watchlist engine={engine} symbols={symbols} sparks={sparks} ticker={ticker} onSelect={setTicker} />
        <section className="mt__card mt__trade" aria-label={`Trade ${ticker}`}>
          <div className="mt__panel-head">
            <h3>Trade {ticker}</h3>
            <span>
              {heldShares} share{heldShares === 1 ? "" : "s"} held
            </span>
          </div>
          <TicketBody key={ticker} engine={engine} ticker={ticker} held={heldShares} buyingPower={bp} place={place} />
          <Orders orders={orderList} onCancel={cancel} busy={busy} />
        </section>
      </div>
    </div>
  )
}

function fillPrice(o: Pick<OrderRecord, "side" | "type" | "price" | "status">, price: number): number | null {
  if (o.type === "market") return price
  if (o.side === "buy") return price <= o.price ? Math.min(o.price, price) : null
  return price >= o.price ? Math.max(o.price, price) : null
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mt {
  --mt-ink: #000;
  --mt-surface: #fff;
  --mt-accent: #0060e2;
  --mt-t1: color-mix(in oklab, var(--mt-ink) 90%, transparent);
  --mt-t2: color-mix(in oklab, var(--mt-ink) 60%, transparent);
  --mt-t3: color-mix(in oklab, var(--mt-ink) 46%, transparent);
  --mt-t4: color-mix(in oklab, var(--mt-ink) 27%, transparent);
  --mt-fill: color-mix(in oklab, var(--mt-ink) 3%, transparent);
  --mt-fill2: color-mix(in oklab, var(--mt-ink) 6%, transparent);
  --mt-line: color-mix(in oklab, var(--mt-ink) 8%, transparent);
  --mt-up: #007b12;
  --mt-dn: #cd1526;
  --mt-ma1: #1f7dcf;
  --mt-ma2: #e58f00;
  --mt-grid: rgba(0, 0, 0, .055);
  --mt-axis: rgba(0, 0, 0, .1);
  --mt-axis-text: #7d7d7d;
  --mt-cross: rgba(0, 0, 0, .42);
  --mt-tag: #1c1c1e;
  --mt-tag-ink: #fff;
  --mt-strong: #111;
  --mt-on-strong: #fff;
  --mt-seg-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .09), 0 1px 1px -1px rgb(0 0 0 / .08);
  --mt-ease: cubic-bezier(.22, 1, .36, 1);
  container-type: inline-size;
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 1080px;
  color: var(--mt-t1);
  font-family: var(--mt-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -.01em;
  font-feature-settings: "cv11", "ss03";
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .mt {
  --mt-ink: #fff;
  --mt-surface: #1c1c1e;
  --mt-accent: #4d8dff;
  --mt-t1: color-mix(in oklab, var(--mt-ink) 92%, transparent);
  --mt-t2: color-mix(in oklab, var(--mt-ink) 64%, transparent);
  --mt-t3: color-mix(in oklab, var(--mt-ink) 46%, transparent);
  --mt-t4: color-mix(in oklab, var(--mt-ink) 28%, transparent);
  --mt-fill: color-mix(in oklab, var(--mt-ink) 5%, transparent);
  --mt-fill2: color-mix(in oklab, var(--mt-ink) 9%, transparent);
  --mt-line: color-mix(in oklab, var(--mt-ink) 10%, transparent);
  --mt-up: #34c759;
  --mt-dn: #ff6369;
  --mt-ma1: #5aa9ff;
  --mt-ma2: #ffb340;
  --mt-grid: rgba(255, 255, 255, .06);
  --mt-axis: rgba(255, 255, 255, .11);
  --mt-axis-text: #8e8e93;
  --mt-cross: rgba(255, 255, 255, .45);
  --mt-tag: #48484a;
  --mt-tag-ink: #fff;
  --mt-strong: #f5f5f7;
  --mt-on-strong: #111;
  --mt-seg-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px rgb(0 0 0 / .4);
}
.mt *, .mt *::before, .mt *::after { box-sizing: border-box }
:where(.mt) :where(h2, h3, p, dl, dd, ul) { margin: 0; padding: 0 }
:where(.mt) :where(ul) { list-style: none }
:where(.mt) :where(button) { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.mt) :where(button:disabled) { cursor: default }
:where(.mt) :where(input) { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; outline: 0; min-width: 0 }
.mt :focus-visible { outline: 2px solid color-mix(in oklab, var(--mt-accent) 60%, transparent); outline-offset: 1px }
.mt :focus:not(:focus-visible) { outline: none }
.mt [data-dir="up"] { --mt-dc: var(--mt-up) }
.mt [data-dir="dn"] { --mt-dc: var(--mt-dn) }
.mt__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.mt__card { background: var(--mt-surface); border: 1px solid var(--mt-line); border-radius: 26px; min-width: 0 }

/* ---- header ---- */
.mt__main { padding: 20px; display: grid; gap: 16px; overflow: hidden }
.mt__head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; align-items: start }
.mt__id-1 { display: flex; align-items: baseline; gap: 8px; min-width: 0 }
.mt__id-1 h2 { font-size: 18px; line-height: 20px; font-weight: 500; letter-spacing: -.03em; color: var(--mt-t1) }
.mt__id-1 span { color: var(--mt-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.mt__id-2 { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 17px; color: var(--mt-t3); margin-top: 1px }
.mt__badge { display: inline-flex; align-items: center; gap: 5px; height: 18px; padding: 0 7px; border-radius: 9px; font-size: 11px; font-weight: 500; color: var(--mt-up); background: color-mix(in oklab, var(--mt-up) 11%, transparent) }
.mt__live { grid-column: 2; grid-row: 1; display: inline-flex; align-items: center; gap: 8px; height: 36px; min-width: 110px; padding: 0 10px 0 12px; border-radius: 999px; border: 1px solid var(--mt-line); background: var(--mt-surface); color: var(--mt-t2); font-weight: 500; transition: background-color .2s var(--mt-ease) }
.mt__live:hover { background: var(--mt-fill) }
.mt__live-t { flex: 1; text-align: left }
.mt__dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--mt-t4); flex: none }
.mt__live[data-on="true"] .mt__dot { background: var(--mt-up) }
.mt__live[data-on="true"] .mt__dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--mt-up); animation: mt-pulse 2s var(--mt-ease) infinite }
@keyframes mt-pulse { from { transform: scale(1); opacity: .5 } to { transform: scale(3); opacity: 0 } }

.mt__row2 { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px; margin-top: 2px }
.mt__quote { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; min-width: 0 }
.mt__price { font-size: 36px; line-height: 40px; font-weight: 500; letter-spacing: -.03em; color: var(--mt-t1); font-variant-numeric: tabular-nums; white-space: nowrap }
.mt__roll { display: inline-flex }
.mt__dg { position: relative; display: inline-block; overflow: hidden; height: 1.1em; vertical-align: top }
.mt__dg-w { visibility: hidden; display: block; line-height: 1.1em }
.mt__dg-s { position: absolute; left: 0; top: 0; transform: translateY(calc(var(--d) * -1.1em)); transition: transform .62s var(--mt-ease) }
.mt__dg-s i { display: block; height: 1.1em; line-height: 1.1em; font-style: normal }
.mt__delta { display: inline-flex; align-items: center; gap: 4px; font-size: 16px; line-height: 22px; font-weight: 500; color: var(--mt-dc); font-variant-numeric: tabular-nums; letter-spacing: -.015em; white-space: nowrap }
.mt__delta em { font-style: normal; font-weight: 400; color: var(--mt-t3); margin-left: 2px }
.mt__stats { display: flex; gap: 24px; text-align: right }
.mt__stats dt { font-size: 12px; line-height: 17px; color: var(--mt-t3) }
.mt__stats dd { font-variant-numeric: tabular-nums; color: var(--mt-t1) }

/* ---- toolbar ---- */
.mt__toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 12px }
.mt__tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
.mt__group { display: flex; align-items: center; gap: 4px }
.mt__seg { display: inline-flex; padding: 0; border-radius: 18px; background: var(--mt-fill); border: 1px solid var(--mt-line) }
.mt__seg-in { position: relative; display: flex; gap: 2px; padding: 3px; width: 100% }
.mt__seg-ind { position: absolute; left: 0; top: 3px; height: 36px; width: var(--iw, 0); transform: translateX(var(--ix, 0)); border-radius: 14px; background: var(--mt-surface); box-shadow: var(--mt-seg-shadow); opacity: 0; pointer-events: none }
.mt__seg-in[data-m] .mt__seg-ind { opacity: 1 }
.mt__seg-in[data-ready] .mt__seg-ind { transition: transform .34s var(--mt-ease), width .34s var(--mt-ease) }
.mt__seg-b { position: relative; z-index: 1; height: 36px; padding: 0 12px; min-width: 40px; border-radius: 14px; font-weight: 500; color: var(--mt-t3); transition: color .2s var(--mt-ease) }
.mt__seg-b[aria-pressed="true"] { color: var(--mt-t1) }
.mt__seg-b:not([aria-pressed="true"]):hover { color: var(--mt-t2) }
.mt__avg { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 999px; color: var(--mt-t1); transition: background-color .2s var(--mt-ease), opacity .2s var(--mt-ease) }
.mt__avg i { width: 12px; height: 2px; border-radius: 1px; background: var(--mt-ma1) }
.mt__avg[data-id="ma50"] i { background: var(--mt-ma2) }
.mt__avg[aria-pressed="false"] { color: var(--mt-t3) }
.mt__avg[aria-pressed="false"] i { opacity: .35 }
.mt__avg:hover { background: var(--mt-fill) }
.mt__icon { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 999px; color: var(--mt-t2); transition: background-color .2s var(--mt-ease), color .2s var(--mt-ease), transform .2s var(--mt-ease) }
.mt__icon:hover:not(:disabled) { background: var(--mt-fill2); color: var(--mt-t1) }
.mt__icon:active:not(:disabled) { transform: scale(.92) }
.mt__icon:disabled { opacity: .4 }
.mt__icon-gap { width: 0 }

/* ---- chart ---- */
.mt__chart { position: relative; margin: 0 -4px }
.mt__readout { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 14px; min-height: 40px; padding: 0 4px 6px; font-size: 12px; line-height: 17px; color: var(--mt-t2); font-variant-numeric: tabular-nums; letter-spacing: 0 }
.mt__readout b { font-weight: 500; color: var(--mt-t1) }
.mt__readout i { font-style: normal; color: var(--mt-t3) }
.mt__ro-date { margin-right: 2px }
.mt__readout .mt__ro-pct { color: var(--mt-dc) }
.mt__ro-ma1 i { color: var(--mt-ma1) }
.mt__ro-ma2 i { color: var(--mt-ma2) }
.mt__readout[data-ma20="false"] .mt__ro-ma1, .mt__readout[data-ma50="false"] .mt__ro-ma2 { display: none }
.mt__surface { position: relative; height: 420px; border-radius: 12px; cursor: crosshair; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.mt__surface[data-drag] { cursor: grabbing }
.mt__surface canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; transition: opacity .3s var(--mt-ease) }
.mt__surface[data-loading] canvas { opacity: .55 }

/* ---- side ---- */
.mt__side { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start }
.mt__panel-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 18px 20px 8px }
.mt__panel-head h3 { font-size: 16px; line-height: 18px; font-weight: 500; letter-spacing: -.03em; color: var(--mt-t1) }
.mt__panel-head span { font-size: 13px; color: var(--mt-t3) }

.mt__watch { padding-bottom: 8px }
.mt__list { position: relative; padding: 0 8px }
.mt__list-ind { position: absolute; left: 8px; right: 8px; top: 0; height: var(--ih, 0); transform: translateY(var(--iy, 0)); border-radius: 18px; background: var(--mt-fill); opacity: 0; pointer-events: none }
.mt__list[data-m] .mt__list-ind { opacity: 1 }
.mt__list[data-ready] .mt__list-ind { transition: transform .34s var(--mt-ease), height .34s var(--mt-ease) }
.mt__li { position: relative }
.mt__row { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 64px 84px; align-items: center; gap: 12px; width: 100%; padding: 8px 12px; border-radius: 18px; text-align: left; transition: background-color .2s var(--mt-ease) }
.mt__row:hover { background: var(--mt-fill) }
.mt__row-id { display: grid; min-width: 0 }
.mt__row-id b, .mt__px { font-weight: 500 }
.mt__row-id small, .mt__row-px small { font-size: 12px; line-height: 17px }
.mt__row-id small { color: var(--mt-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.mt__spark path { stroke: var(--mt-dc) }
.mt__spark-base { stroke: var(--mt-t4); stroke-width: 1; stroke-dasharray: 2 3; opacity: .7 }
.mt__row-px { display: grid; justify-items: end; font-variant-numeric: tabular-nums }
.mt__row-px small { color: var(--mt-dc) }
.mt__px { position: relative; display: inline-block; padding: 0 0; isolation: isolate }
.mt__flash { position: absolute; inset: 0 -6px; border-radius: 6px; background: color-mix(in oklab, var(--mt-dc) 16%, transparent); opacity: 0; z-index: -1; pointer-events: none }

/* ---- ticket ---- */
.mt__trade { padding-bottom: 4px }
.mt__ticket { display: grid; gap: 16px; padding: 8px 20px 20px }
.mt__t-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px }
.mt__field { display: grid; gap: 6px }
.mt__field-l label { font-weight: 500 }
.mt__stepper { display: flex; align-items: center; gap: 2px; width: 196px; max-width: 100%; height: 44px; padding: 3px; border-radius: 18px; border: 1px solid var(--mt-line); background: var(--mt-surface); transition: border-color .2s var(--mt-ease) }
.mt__stepper:focus-within { border-color: color-mix(in oklab, var(--mt-accent) 55%, transparent) }
.mt__stepper button { display: grid; place-items: center; width: 34px; height: 34px; flex: none; border-radius: 14px; color: var(--mt-t2); transition: background-color .2s var(--mt-ease), transform .2s var(--mt-ease) }
.mt__stepper button:hover:not(:disabled) { background: var(--mt-fill2); color: var(--mt-t1) }
.mt__stepper button:active:not(:disabled) { transform: scale(.92) }
.mt__stepper button:disabled { opacity: .4 }
.mt__stepper input { flex: 1; width: 100%; text-align: center; font-variant-numeric: tabular-nums; font-size: 16px; font-weight: 500 }
.mt__money { padding-left: 14px }
.mt__money span { color: var(--mt-t3); font-size: 16px }
.mt__money input { text-align: left; padding-left: 2px }
.mt__limit { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -16px; transition: grid-template-rows .36s var(--mt-ease), opacity .3s var(--mt-ease), margin-top .36s var(--mt-ease) }
.mt__limit[data-open="true"] { grid-template-rows: 1fr; opacity: 1; margin-top: 0 }
.mt__limit-in { min-height: 0; overflow: hidden; padding: 2px; margin: -2px }
.mt__sum { display: grid; gap: 6px; padding-top: 12px; border-top: 1px solid var(--mt-line) }
.mt__sum div { display: flex; justify-content: space-between; gap: 12px }
.mt__sum dt { color: var(--mt-t2) }
.mt__sum dd { font-weight: 500; font-variant-numeric: tabular-nums }
.mt__status { min-height: 17px; margin: -4px 0; font-size: 12px; line-height: 17px; color: var(--mt-dn) }
.mt__go { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; padding: 0 20px; border-radius: 18px; background: var(--mt-strong); color: var(--mt-on-strong); font-weight: 500; font-variant-numeric: tabular-nums; transition: opacity .2s var(--mt-ease), transform .2s var(--mt-ease), filter .2s var(--mt-ease) }
.mt__go:hover:not(:disabled) { filter: brightness(1.18) }
:is(.dark, [data-theme="dark"]) .mt__go:hover:not(:disabled) { filter: brightness(.9) }
.mt__go:active:not(:disabled) { transform: scale(.985) }
.mt__go:disabled { opacity: .35 }
.mt__spin { animation: mt-spin .8s linear infinite }
@keyframes mt-spin { to { transform: rotate(360deg) } }
.mt__note { font-size: 12px; line-height: 17px; color: var(--mt-t3); text-align: center; margin-top: -4px }

.mt__orders { padding: 8px 20px 16px }
.mt__orders h3 { font-size: 14px; line-height: 20px; font-weight: 500; padding: 8px 0 4px; border-top: 1px solid var(--mt-line) }
.mt__empty { font-size: 12px; color: var(--mt-t3); padding: 6px 0 }
.mt__orders ul { max-height: 260px; overflow-y: auto; margin: 0 -8px; padding: 0 8px }
.mt__ord { display: grid; grid-template-rows: 1fr }
.mt__ord[data-new] { animation: mt-grow .5s var(--mt-ease) backwards }
@keyframes mt-grow { from { grid-template-rows: 0fr; opacity: 0 } }
.mt__ord-in { min-height: 0; overflow: hidden }
.mt__ord-row { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 4px 0 }
.mt__ord-t { display: grid; flex: 1; min-width: 0 }
.mt__ord-t b { font-weight: 500 }
.mt__ord-t small { font-size: 12px; line-height: 17px; color: var(--mt-t3); font-variant-numeric: tabular-nums }
.mt__pill { padding: 2px 8px; border-radius: 999px; font-size: 12px; line-height: 17px; font-weight: 500; color: var(--mt-t1); background: var(--mt-fill2); flex: none }
.mt__pill[data-status="filled"] { color: var(--mt-up); background: color-mix(in oklab, var(--mt-up) 12%, transparent) }
.mt__pill[data-status="canceled"] { color: var(--mt-t3) }

/* ---- responsive (container) ---- */
@container (min-width: 720px) {
  .mt__side { grid-template-columns: repeat(2, minmax(0, 1fr)) }
}
@container (max-width: 640px) {
  .mt__main { padding: 16px }
  .mt__id-1 h2 { font-size: 17px }
  .mt__price { font-size: 32px; line-height: 36px }
  .mt__stats { display: grid; grid-template-columns: repeat(4, 1fr); width: 100%; text-align: left; gap: 8px }
  .mt__row2 { align-items: stretch }
  .mt__toolbar { gap: 10px }
  .mt__seg { width: 100% }
  .mt__seg-b { flex: 1; height: 44px }
  .mt__seg-ind { height: 44px }
  .mt__tools { width: 100%; justify-content: space-between; flex-wrap: nowrap }
  .mt__icon, .mt__avg { height: 44px }
  .mt__icon { width: 44px }
  .mt__surface { height: 340px }
  .mt__panel-head, .mt__ticket, .mt__orders { padding-left: 16px; padding-right: 16px }
  .mt__ticket { padding-top: 8px }
  .mt__readout { min-height: 56px }
}
@container (max-width: 400px) {
  .mt__main { padding: 14px }
  .mt__row { grid-template-columns: minmax(0, 1fr) 52px 76px; gap: 8px }
  .mt__spark { width: 52px }
  .mt__stepper { width: 100% }
  .mt__t-top { flex-direction: column; align-items: stretch }
  .mt__t-top .mt__seg-b { flex: 1 }
  .mt__avg { padding: 0 8px; gap: 6px }
  .mt__icon { width: 40px }
  .mt__group { gap: 2px }
}

@media (prefers-reduced-motion: reduce) {
  .mt *, .mt *::before, .mt *::after { animation: none !important; transition: none !important }
}
`

export default MarketTerminal
