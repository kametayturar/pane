"use client"

import * as React from "react"
import { ArrowUp, Check, Download, Minus, Rows2, Rows3, Rows4, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DataGridValue = string | number | null | number[]
export type DataGridRow = { id: string; [key: string]: DataGridValue | undefined }
export type DataGridColumnType = "text" | "number" | "currency" | "percent" | "select" | "date" | "sparkline"
export type DataGridAggregate = "sum" | "average" | "min" | "max" | "count" | "none"
export type DataGridDensity = "compact" | "standard" | "comfortable"
export type DataGridSort = { key: string; dir: "asc" | "desc" }

export type DataGridColumn = {
  /** Row field this column reads. */
  key: string
  /** Header text. Also used in CSV. */
  label: string
  /** Starting width in px. The last column absorbs spare width on a wide grid. */
  width?: number
  /** Narrowest a resize can reach. */
  minWidth?: number
  /**
   * Number, currency and percent align right and total in the footer. Select shows a tinted chip. Date reads an ISO day
   * ("2026-01-31"). Sparkline draws a row of numbers as an inline line.
   */
  type?: DataGridColumnType
  /** Decimal places for numeric values. */
  decimals?: number
  /** Percent columns: draws a small bar next to the figure. */
  bar?: boolean
  /** Sticks to the left edge while scrolling sideways. Pin columns from the start of the list. */
  pinned?: boolean
  sortable?: boolean
  /** What the totals row shows. Defaults to sum for number and currency, average for percent, none otherwise. */
  aggregate?: DataGridAggregate
}

export type DataGridProps = {
  columns: DataGridColumn[]
  rows: DataGridRow[]
  /** Accessible name for the grid. Also names the exported CSV file. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header. */
  actions?: React.ReactNode
  /** Tallest the scrolling area grows before it scrolls, in px. */
  maxHeight?: number
  /** Controlled sort keys in priority order. */
  sort?: DataGridSort[]
  defaultSort?: DataGridSort[]
  /** Called when a header click, Shift-click or the sort keyboard shortcut changes the sort. */
  onSortChange?: (sort: DataGridSort[]) => void
  /** Controlled checked row ids. */
  selectedRowIds?: string[]
  defaultSelectedRowIds?: string[]
  onSelectedRowIdsChange?: (ids: string[]) => void
  /** Controlled row density: 32, 40 or 48px rows. */
  density?: DataGridDensity
  defaultDensity?: DataGridDensity
  onDensityChange?: (density: DataGridDensity) => void
  /** Shows the row gutter with row numbers and checkboxes. */
  rowSelection?: boolean
  /** Shows the toolbar with search, density and export. */
  toolbar?: boolean
  /** Shows the sticky totals row. It covers every row the search keeps. */
  totals?: boolean
  /** Shows the active cell address and the Count, Sum and Average of the selected cells. */
  selectionStats?: boolean
  /** Shows placeholder rows. */
  loading?: boolean
  emptyMessage?: string
  /** Export file name without the extension. Defaults to a slug of the label. */
  exportFileName?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dgd {
  --dgd-ink: #000;
  --dgd-surface: #fff;
  --dgd-accent: #0060e2;
  --dgd-neg: oklch(.6 .19 27);
  --dgd-t1: color-mix(in oklab, var(--dgd-ink) 88%, transparent);
  --dgd-t2: color-mix(in oklab, var(--dgd-ink) 61%, transparent);
  --dgd-t3: color-mix(in oklab, var(--dgd-ink) 45%, transparent);
  --dgd-t4: color-mix(in oklab, var(--dgd-ink) 27%, transparent);
  --dgd-fill: color-mix(in oklab, var(--dgd-ink) 6%, transparent);
  --dgd-line: color-mix(in oklab, var(--dgd-ink) 6%, transparent);
  --dgd-head: color-mix(in oklab, var(--dgd-ink) 2.2%, var(--dgd-surface));
  --dgd-hover: color-mix(in oklab, var(--dgd-ink) 3%, var(--dgd-surface));
  --dgd-check: color-mix(in oklab, var(--dgd-accent) 7%, var(--dgd-surface));
  --dgd-range: color-mix(in oklab, var(--dgd-accent) 12%, var(--dgd-surface));
  --dgd-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --dgd-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 1040px;
  margin: 0;
  color: var(--dgd-t1);
  font-family: var(--dgd-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .dgd {
  --dgd-ink: #fff;
  --dgd-surface: #1c1c1e;
  --dgd-accent: #4d8dff;
  --dgd-neg: oklch(.72 .17 25);
  --dgd-t1: color-mix(in oklab, var(--dgd-ink) 90%, transparent);
  --dgd-t2: color-mix(in oklab, var(--dgd-ink) 62%, transparent);
  --dgd-t3: color-mix(in oklab, var(--dgd-ink) 46%, transparent);
  --dgd-t4: color-mix(in oklab, var(--dgd-ink) 28%, transparent);
  --dgd-fill: color-mix(in oklab, var(--dgd-ink) 8%, transparent);
  --dgd-line: color-mix(in oklab, var(--dgd-ink) 8%, transparent);
  --dgd-head: color-mix(in oklab, var(--dgd-ink) 3.5%, var(--dgd-surface));
  --dgd-hover: color-mix(in oklab, var(--dgd-ink) 4.5%, var(--dgd-surface));
  --dgd-check: color-mix(in oklab, var(--dgd-accent) 12%, var(--dgd-surface));
  --dgd-range: color-mix(in oklab, var(--dgd-accent) 20%, var(--dgd-surface));
  --dgd-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
:where(.dgd) *, :where(.dgd) *::before, :where(.dgd) *::after { box-sizing: border-box }
:where(.dgd) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.dgd :focus-visible { outline: 2px solid color-mix(in oklab, var(--dgd-accent) 60%, transparent); outline-offset: 1px }

.dgd-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 12px }
.dgd-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--dgd-t1) }
.dgd-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--dgd-t3) }
.dgd-card { overflow: hidden; border-radius: 16px; background: var(--dgd-surface); box-shadow: var(--dgd-shadow) }

.dgd-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 10px; min-height: 52px }
.dgd-search { position: relative; display: flex; align-items: center; flex: 0 1 200px; min-width: 120px }
.dgd-search svg { position: absolute; left: 10px; color: var(--dgd-t3); pointer-events: none }
.dgd-search input {
  width: 100%; height: 32px; padding: 0 28px 0 32px; border: 0; border-radius: 10px; background: var(--dgd-fill); color: var(--dgd-t1);
  font: inherit; font-size: 14px; outline: none; transition: background-color .15s, box-shadow .15s;
}
.dgd-search input::placeholder { color: var(--dgd-t3) }
.dgd-search input:focus-visible { box-shadow: 0 0 0 2px color-mix(in oklab, var(--dgd-accent) 55%, transparent); outline: none }
.dgd-search input::-webkit-search-cancel-button { display: none }
.dgd-clear { position: absolute; right: 4px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 8px; color: var(--dgd-t3) }
.dgd-clear:hover { color: var(--dgd-t1); background: var(--dgd-fill) }
.dgd-count { min-width: 0; font-size: 13px; color: var(--dgd-t3); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.dgd-spacer { flex: 1 }
.dgd-seg { display: inline-flex; padding: 2px; gap: 1px; border-radius: 10px; background: var(--dgd-fill) }
.dgd-seg button { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--dgd-t3); transition: background-color .15s, color .15s, box-shadow .15s }
.dgd-seg button:hover { color: var(--dgd-t1) }
.dgd-seg button[aria-pressed="true"] { color: var(--dgd-t1); background: var(--dgd-surface); box-shadow: var(--dgd-shadow) }
.dgd-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 10px; font-size: 14px; color: var(--dgd-t2); transition: background-color .15s, color .15s }
.dgd-btn:hover { background: var(--dgd-fill); color: var(--dgd-t1) }
.dgd-btn[data-quiet] { padding: 0 8px; font-size: 13px }

.dgd-scroll {
  position: relative; overflow: auto; overscroll-behavior: contain; overflow-anchor: none; outline: none; border-top: 1px solid var(--dgd-line);
  scrollbar-width: thin; scrollbar-color: color-mix(in oklab, var(--dgd-ink) 20%, transparent) transparent;
}
.dgd-scroll:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--dgd-accent) 45%, transparent) }
.dgd-inner { position: relative; width: var(--tw); min-width: 100% }
.dgd-hrow, .dgd-row, .dgd-frow { display: grid; grid-template-columns: var(--gtc); width: var(--tw); min-width: 100% }
.dgd-hrow { position: sticky; top: 0; z-index: 4; height: 40px; background: var(--dgd-head); box-shadow: 0 1px 0 var(--dgd-line) }
.dgd-frow { position: sticky; bottom: 0; z-index: 4; height: 40px; background: var(--dgd-head); box-shadow: 0 -1px 0 var(--dgd-line) }
.dgd-body { position: relative; width: var(--tw); min-width: 100% }
.dgd-row { position: absolute; left: 0; top: 0; will-change: transform; --cell-bg: var(--dgd-surface) }
.dgd-row:hover { --cell-bg: var(--dgd-hover) }
.dgd-row[data-checked] { --cell-bg: var(--dgd-check) }

.dgd-h { position: relative; display: flex; align-items: center; min-width: 0; padding: 0 12px; background: var(--dgd-head); box-shadow: inset -1px 0 0 var(--dgd-line) }
.dgd-h[data-pin] { position: sticky; z-index: 5 }
.dgd-h[data-num] { justify-content: flex-end }
.dgd-hb { display: inline-flex; align-items: center; gap: 4px; min-width: 0; height: 100%; font-weight: 500; font-size: 14px; color: var(--dgd-t2); transition: color .15s }
.dgd-hb:hover, .dgd-h[aria-sort="ascending"] .dgd-hb, .dgd-h[aria-sort="descending"] .dgd-hb { color: var(--dgd-t1) }
.dgd-hb > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.dgd-hb:focus-visible { outline-offset: -2px; border-radius: 4px }
.dgd-arrow { display: inline-flex; align-items: center; gap: 1px; width: 0; opacity: 0; color: var(--dgd-t1); transform: translateY(2px); transition: opacity .2s var(--dgd-ease), transform .25s var(--dgd-ease), width .2s var(--dgd-ease) }
.dgd-h[aria-sort="ascending"] .dgd-arrow, .dgd-h[aria-sort="descending"] .dgd-arrow { width: 14px; opacity: 1; transform: none }
.dgd-arrow sup { font-size: 9px; line-height: 1; font-weight: 600; margin-left: -1px }
.dgd-h[aria-sort="descending"] .dgd-arrow svg { transform: rotate(180deg) }
.dgd-arrow svg { transition: transform .3s var(--dgd-ease) }
.dgd-rz { position: absolute; top: 0; right: -4px; z-index: 6; width: 9px; height: 100%; cursor: col-resize; touch-action: none; outline-offset: -3px }
.dgd-rz::after { content: ""; position: absolute; left: 4px; top: 8px; bottom: 8px; width: 2px; border-radius: 1px; background: var(--dgd-accent); opacity: 0; transition: opacity .15s }
.dgd-rz:hover::after, .dgd-rz[data-on]::after, .dgd-rz:focus-visible::after { opacity: 1 }

.dgd-g { position: sticky; left: 0; z-index: 3; display: flex; align-items: center; justify-content: center; background: var(--cell-bg, var(--dgd-head)); box-shadow: inset -1px 0 0 var(--dgd-line), inset 0 -1px 0 var(--dgd-line) }
.dgd-hrow .dgd-g { z-index: 6; background: var(--dgd-head); box-shadow: inset -1px 0 0 var(--dgd-line) }
.dgd-frow .dgd-g { z-index: 6; background: var(--dgd-head); box-shadow: inset -1px 0 0 var(--dgd-line) }
.dgd-no { font-size: 12px; color: var(--dgd-t3); font-variant-numeric: tabular-nums; cursor: pointer; width: 100%; text-align: center; line-height: 100% ; display: grid; place-items: center; height: 100% }
.dgd-ck { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 5px; background: var(--dgd-surface); box-shadow: 0 0 0 1px color-mix(in oklab, var(--dgd-ink) 22%, transparent); color: transparent; transition: background-color .15s, box-shadow .15s, color .15s, transform .15s var(--dgd-ease) }
.dgd-ck:active { transform: scale(.88) }
.dgd-ck[aria-checked="true"], .dgd-ck[aria-checked="mixed"] { background: var(--dgd-accent); box-shadow: none; color: #fff }
.dgd-row .dgd-g .dgd-ck { display: none }
.dgd-row[data-checked] .dgd-g .dgd-ck, .dgd-row:hover .dgd-g .dgd-ck, .dgd-row .dgd-g:focus-within .dgd-ck { display: grid }
.dgd-row[data-checked] .dgd-no, .dgd-row:hover .dgd-no { display: none }

.dgd-c {
  position: relative; display: flex; align-items: center; min-width: 0; padding: 0 12px; background: var(--cell-bg); color: var(--dgd-t1);
  box-shadow: inset -1px 0 0 var(--dgd-line), inset 0 -1px 0 var(--dgd-line); cursor: default; transition: background-color .12s;
}
.dgd-c[data-pin] { position: sticky; z-index: 2 }
.dgd-c[data-first] { font-weight: 500 }
.dgd-c[data-num] { justify-content: flex-end; font-variant-numeric: tabular-nums }
.dgd-c[data-sel] { background: var(--dgd-range) }
.dgd-c[data-active] { z-index: 3; background: var(--dgd-surface); box-shadow: inset 0 0 0 2px var(--dgd-t1) }
.dgd-c[data-active][data-sel] { background: var(--dgd-range) }
.dgd-tx { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

.dgd-chip { display: inline-flex; align-items: center; max-width: 100%; height: 22px; padding: 0 8px; border-radius: 7px; font-size: 13px; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--dgd-t1); background: color-mix(in oklab, var(--tone) 16%, transparent) }
.dgd-chip::before { content: ""; flex: none; width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: var(--tone) }
.dgd-pbar { flex: none; width: 36px; height: 4px; margin-right: 8px; border-radius: 2px; background: var(--dgd-fill); overflow: hidden }
.dgd-pbar i { display: block; height: 100%; border-radius: 2px; background: var(--b, var(--dgd-accent)) }

.dgd-spark { position: relative; width: 100%; height: 24px }
.dgd-spark svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.dgd-spark .ar { fill: color-mix(in oklab, var(--sc) 12%, transparent); stroke: none }
.dgd-spark .ln { fill: none; stroke: var(--sc); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke }
.dgd-spark .dot { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: var(--sc); box-shadow: 0 0 0 2px var(--cell-bg); pointer-events: none }
.dgd-sv { position: absolute; right: 0; top: -2px; transform: translateY(-100%); padding: 1px 6px; border-radius: 6px; background: var(--dgd-t1); color: var(--dgd-surface); font-size: 11px; line-height: 16px; font-variant-numeric: tabular-nums; pointer-events: none; z-index: 8 }

.dgd[data-intro] .dgd-row { animation: dgd-rise .5s var(--dgd-ease) backwards; animation-delay: calc(var(--i, 0) * 26ms) }
.dgd[data-intro] .dgd-spark .ln { stroke-dasharray: 1; stroke-dashoffset: 1; animation: dgd-draw 1s var(--dgd-ease) .15s forwards }
.dgd[data-intro] .dgd-spark .ar { animation: dgd-fade .8s ease .5s backwards }

.dgd-status { display: flex; align-items: center; gap: 12px; min-height: 36px; padding: 0 12px; border-top: 1px solid var(--dgd-line); font-size: 12px; color: var(--dgd-t3); font-variant-numeric: tabular-nums }
.dgd-addr { min-width: 28px; font-weight: 500; color: var(--dgd-t2) }
.dgd-st b { font-weight: 500; color: var(--dgd-t2) }
.dgd-empty { display: grid; place-items: center; gap: 8px; min-height: 140px; color: var(--dgd-t3); text-align: center }
.dgd-sk { height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--dgd-fill) 30%, color-mix(in oklab, var(--dgd-ink) 12%, transparent) 50%, var(--dgd-fill) 70%) 0 0 / 300% 100%; animation: dgd-sheen 1.4s linear infinite }
.dgd-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@media (max-width: 520px) { .dgd-btn:not([data-quiet]) span { display: none } .dgd-btn:not([data-quiet]) { padding: 0 8px } .dgd-search { flex: 1 1 130px } }
@keyframes dgd-rise { from { opacity: 0; transform: translateY(var(--ty, 0px)) translateY(6px); filter: blur(2px) } }
@keyframes dgd-draw { to { stroke-dashoffset: 0 } }
@keyframes dgd-fade { from { opacity: 0 } }
@keyframes dgd-sheen { from { background-position: 100% 0 } to { background-position: 0 0 } }
@media (prefers-reduced-motion: reduce) {
  .dgd *, .dgd *::before, .dgd *::after { animation: none !important; transition: none !important }
  .dgd-spark .ln { stroke-dasharray: none !important; stroke-dashoffset: 0 !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const GUTTER = 48
const HEAD = 40
const FOOT = 40
const OVER = 6
const HEIGHTS: Record<DataGridDensity, number> = { compact: 32, standard: 40, comfortable: 48 }
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const TONES = ["oklch(.62 .14 255)", "oklch(.58 .17 305)", "oklch(.74 .15 75)", "oklch(.64 .12 185)", "oklch(.62 .17 25)", "oklch(.62 0 0)"]
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

const isNum = (c: DataGridColumn) => c.type === "number" || c.type === "currency" || c.type === "percent"

function formatValue(col: DataGridColumn, v: DataGridValue | undefined): string {
  if (v === null || v === undefined || Array.isArray(v)) return ""
  if (col.type === "number" || col.type === "currency" || col.type === "percent") {
    if (typeof v !== "number") return String(v)
    const d = col.decimals ?? 0
    const s = new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(Math.abs(v))
    const sign = v < 0 ? "−" : ""
    return col.type === "currency" ? `${sign}$${s}` : col.type === "percent" ? `${sign}${s}%` : `${sign}${s}`
  }
  if (col.type === "date") {
    const t = Date.parse(`${v}T00:00:00Z`)
    return Number.isNaN(t) ? String(v) : dateFmt.format(t)
  }
  return String(v)
}

const nfCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
/** Footer figures: compact once they are large, so they fit narrow columns. */
function footFormat(col: DataGridColumn, v: number, kind: DataGridAggregate) {
  if (col.type === "percent" || kind === "average") return formatValue({ ...col, decimals: kind === "average" ? 1 : col.decimals }, v)
  if (Math.abs(v) < 100000) return formatValue(col, v)
  return `${v < 0 ? "\u2212" : ""}${col.type === "currency" ? "$" : ""}${nfCompact.format(Math.abs(v))}`
}

function sortValue(v: DataGridValue | undefined): number | string | null {
  if (v === null || v === undefined) return null
  if (Array.isArray(v)) return v.length ? v[v.length - 1]! - v[0]! : null
  return v
}

function colLetter(i: number) {
  let s = ""
  for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) s = String.fromCharCode(65 + (n % 26)) + s
  return s
}

function aggregateOf(col: DataGridColumn): DataGridAggregate {
  return col.aggregate ?? (col.type === "number" || col.type === "currency" ? "sum" : col.type === "percent" ? "average" : "none")
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

/** A number that counts to its new value, written straight to the DOM. */
function CountText({ value, format, reduced }: { value: number; format: (v: number) => string; reduced: boolean }) {
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
      const t = clamp((now - start) / 520, 0, 1)
      shown.current = from + (value - from) * (1 - (1 - t) ** 4)
      el.textContent = fmt.current(shown.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return <span ref={ref}>{format(value)}</span>
}

/** An inline line chart for a row of numbers. Hover reads one point. */
function Spark({ data, fmt }: { data: number[]; fmt: (v: number) => string }) {
  const [hi, setHi] = React.useState<number | null>(null)
  const n = data.length
  if (n < 2) return null
  let lo = Infinity
  let mx = -Infinity
  for (const v of data) {
    if (v < lo) lo = v
    if (v > mx) mx = v
  }
  const span = mx - lo || 1
  const X = (i: number) => (i / (n - 1)) * 100
  const Y = (v: number) => 22 - ((v - lo) / span) * 20 // 1px of room above and below
  let d = `M0 ${Y(data[0]!).toFixed(2)}`
  for (let i = 1; i < n; i++) d += `L${X(i).toFixed(2)} ${Y(data[i]!).toFixed(2)}`
  const up = data[n - 1]! >= data[0]!
  const at = hi ?? n - 1
  return (
    <div
      className="dgd-spark"
      style={{ "--sc": up ? "var(--dgd-accent)" : "var(--dgd-neg)" } as React.CSSProperties}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setHi(clamp(Math.round(((e.clientX - r.left) / r.width) * (n - 1)), 0, n - 1))
      }}
      onPointerLeave={() => setHi(null)}
    >
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        <path className="ar" d={`${d}L100 24L0 24Z`} />
        <path className="ln" d={d} pathLength={1} />
      </svg>
      <i className="dot" style={{ left: `${X(at)}%`, top: `${(Y(data[at]!) / 24) * 100}%` }} />
      {hi !== null && <span className="dgd-sv">{fmt(data[hi]!)}</span>}
    </div>
  )
}

type Pos = { r: number; c: number }

/* -------------------------------------------------------------------------- */
/*                                  DataGrid                                  */
/* -------------------------------------------------------------------------- */

export function DataGrid({
  columns,
  rows,
  label,
  title,
  subtitle,
  actions,
  maxHeight = 400,
  sort: sortProp,
  defaultSort = [],
  onSortChange,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectedRowIdsChange,
  density: densityProp,
  defaultDensity = "standard",
  onDensityChange,
  rowSelection = true,
  toolbar = true,
  totals = true,
  selectionStats = true,
  loading = false,
  emptyMessage = "No rows yet",
  exportFileName,
  className,
}: DataGridProps) {
  const reduced = usePrefersReducedMotion()
  const uid = React.useId().replace(/:/g, "")
  const nCols = columns.length

  /* --------------------------------- State --------------------------------- */
  const [sortInner, setSortInner] = React.useState<DataGridSort[]>(defaultSort)
  const sort = sortProp ?? sortInner
  const setSort = (next: DataGridSort[]) => {
    setSortInner(next)
    onSortChange?.(next)
  }
  const [densityInner, setDensityInner] = React.useState<DataGridDensity>(defaultDensity)
  const density = densityProp ?? densityInner
  const rowH = HEIGHTS[density]
  const [checkedInner, setCheckedInner] = React.useState<string[]>(defaultSelectedRowIds)
  const checkedIds = selectedRowIds ?? checkedInner
  const checked = React.useMemo(() => new Set(checkedIds), [checkedIds])
  const setChecked = (ids: string[]) => {
    setCheckedInner(ids)
    onSelectedRowIdsChange?.(ids)
  }
  const [query, setQuery] = React.useState("")
  const [widths, setWidths] = React.useState<number[]>(() => columns.map((c) => c.width ?? (c.type === "sparkline" ? 140 : 140)))
  const [start, setStart] = React.useState(0)
  const [viewH, setViewH] = React.useState(maxHeight)
  const [viewW, setViewW] = React.useState(0)
  const [active, setActive] = React.useState<Pos | null>(null)
  const [anchor, setAnchor] = React.useState<Pos | null>(null)
  const [resizing, setResizing] = React.useState<number | null>(null)
  const [intro, setIntro] = React.useState(!reduced)
  const [announce, setAnnounce] = React.useState("")
  const lastCheck = React.useRef<number | null>(null)

  // Columns that came or went after mount get a width.
  const [prevCols, setPrevCols] = React.useState(columns)
  if (prevCols !== columns && prevCols.length !== columns.length) {
    setPrevCols(columns)
    setWidths(columns.map((c, i) => widths[i] ?? c.width ?? 140))
  }

  React.useEffect(() => {
    if (!intro) return
    const id = setTimeout(() => setIntro(false), 1500)
    return () => clearTimeout(id)
  }, [intro])

  /* ------------------------------ Data pipeline ----------------------------- */
  const searchText = React.useMemo(() => {
    const searchable = columns.filter((c) => c.type !== "sparkline")
    return rows.map((r) => searchable.map((c) => formatValue(c, r[c.key])).join("\u0001").toLowerCase())
  }, [rows, columns])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const out: number[] = []
    for (let i = 0; i < rows.length; i++) if (!q || searchText[i]!.includes(q)) out.push(i)
    return out
  }, [rows, searchText, query])

  const order = React.useMemo(() => {
    const keys = sort.map((s) => ({ col: columns.find((c) => c.key === s.key), dir: s.dir === "asc" ? 1 : -1 })).filter((k): k is { col: DataGridColumn; dir: number } => !!k.col)
    if (!keys.length) return filtered
    const idx = filtered.slice()
    idx.sort((a, b) => {
      for (const k of keys) {
        const va = sortValue(rows[a]![k.col.key])
        const vb = sortValue(rows[b]![k.col.key])
        if (va === vb) continue
        if (va === null) return 1
        if (vb === null) return -1
        const c = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb))
        if (c) return c * k.dir
      }
      return a - b
    })
    return idx
  }, [filtered, sort, columns, rows])
  const n = order.length

  const aggregates = React.useMemo(() => {
    return columns.map((c) => {
      const kind = aggregateOf(c)
      if (kind === "none") return null
      let count = 0
      let sum = 0
      let mn = Infinity
      let mx = -Infinity
      for (const i of order) {
        const v = rows[i]![c.key]
        if (v === null || v === undefined || Array.isArray(v)) continue
        if (kind === "count") {
          count++
          continue
        }
        if (typeof v !== "number") continue
        count++
        sum += v
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
      if (kind === "count") return count
      if (!count) return null
      return kind === "sum" ? sum : kind === "average" ? sum / count : kind === "min" ? mn : mx
    })
  }, [columns, order, rows])

  /* -------------------------------- Geometry ------------------------------- */
  const gutter = rowSelection ? GUTTER : 0
  const sumW = widths.reduce((a, b) => a + b, 0)
  const extra = Math.max(0, viewW - gutter - sumW)
  const shownW = widths.map((w, i) => (i === nCols - 1 ? w + extra : w))
  const totalW = gutter + sumW + extra
  const gtc = `${rowSelection ? `${GUTTER}px ` : ""}${shownW.map((w) => `${w}px`).join(" ")}`
  const pinned: number[] = []
  for (let i = 0; i < nCols && columns[i]!.pinned; i++) pinned.push(i)
  const pinLeft = (i: number) => gutter + widths.slice(0, i).reduce((a, b) => a + b, 0)
  const contentH = HEAD + n * rowH + (totals ? FOOT : 0)
  const boxH = n === 0 && !loading ? 180 : Math.min(maxHeight, contentH)
  const viewRows = Math.ceil((viewH - HEAD - (totals ? FOOT : 0)) / rowH) + 1
  const winStart = clamp(start, 0, Math.max(0, n - 1))
  const winEnd = Math.min(n, winStart + viewRows + OVER * 2)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const ensure = React.useRef(false)
  const rowEls = React.useRef(new Map<string, HTMLElement>())
  const prevPos = React.useRef(new Map<string, number>())
  const lastOrder = React.useRef<number[] | null>(null)

  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewH(el.clientHeight)
      setViewW(el.clientWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const s = Math.max(0, Math.floor(el.scrollTop / rowH) - OVER)
    if (s !== start) setStart(s)
  }

  // Rows glide to their new places when the order changes: only the rows on screen are animated (FLIP).
  React.useLayoutEffect(() => {
    const prev = prevPos.current
    const next = new Map<string, number>()
    const changed = lastOrder.current !== null && lastOrder.current !== order
    lastOrder.current = order
    for (let v = winStart; v < winEnd; v++) {
      const id = rows[order[v]!]!.id
      const top = v * rowH
      next.set(id, top)
      const el = rowEls.current.get(id)
      if (!changed || !el || reduced || typeof el.animate !== "function") continue
      const old = prev.get(id)
      if (old !== undefined && old !== top) {
        el.animate([{ translate: `0 ${old - top}px` }, { translate: "0 0" }], { duration: 460, easing: "cubic-bezier(.22, 1, .36, 1)" })
      } else if (old === undefined) {
        el.animate([{ opacity: 0, filter: "blur(2px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 320, easing: "ease-out" })
      }
    }
    prevPos.current = next
  })

  /* ------------------------------ Selection ------------------------------- */
  const lastRow = Math.max(0, n - 1)
  const lastCol = Math.max(0, nCols - 1)
  const range = React.useMemo(() => {
    if (!active) return null
    const a = anchor ?? active
    return { r0: Math.min(a.r, active.r), r1: Math.max(a.r, active.r), c0: Math.min(a.c, active.c), c1: Math.max(a.c, active.c) }
  }, [active, anchor])

  const stats = React.useMemo(() => {
    if (!range) return null
    let count = 0
    let sum = 0
    let numeric = 0
    for (let r = range.r0; r <= Math.min(range.r1, n - 1); r++) {
      const row = rows[order[r]!]!
      for (let c = range.c0; c <= range.c1; c++) {
        const v = row[columns[c]!.key]
        if (v === null || v === undefined) continue
        count++
        if (typeof v === "number") {
          sum += v
          numeric++
        }
      }
    }
    const single = range.c0 === range.c1 ? columns[range.c0]! : null
    return { count, sum, avg: numeric ? sum / numeric : null, numeric, single }
  }, [range, n, rows, order, columns])

  const moveActive = (next: Pos, extend: boolean) => {
    const p = { r: clamp(next.r, 0, lastRow), c: clamp(next.c, 0, lastCol) }
    ensure.current = true
    setActive(p)
    if (!extend) setAnchor(p)
    else if (!anchor) setAnchor(active)
  }

  // Keep the active cell in view after keyboard moves, accounting for the sticky header, totals and pinned columns.
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !active || !ensure.current) return
    ensure.current = false
    const top = active.r * rowH
    const bodyH = el.clientHeight - HEAD - (totals ? FOOT : 0)
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + rowH > el.scrollTop + bodyH) el.scrollTop = top + rowH - bodyH
    const isPinned = active.c < pinned.length
    if (!isPinned) {
      const pinW = pinned.reduce((a, i) => a + shownW[i]!, 0)
      const left = shownW.slice(0, active.c).reduce((a, b) => a + b, 0)
      const w = shownW[active.c]!
      const vis = el.clientWidth - gutter - pinW
      if (left < el.scrollLeft + pinW) el.scrollLeft = left - pinW
      else if (left + w > el.scrollLeft + pinW + vis) el.scrollLeft = left + w - pinW - vis
    }
  })

  const toggleRow = (vIdx: number, shift: boolean) => {
    const id = rows[order[vIdx]!]!.id
    const next = new Set(checked)
    if (shift && lastCheck.current !== null) {
      const [a, b] = [Math.min(lastCheck.current, vIdx), Math.max(lastCheck.current, vIdx)]
      const on = !checked.has(id)
      for (let i = a; i <= b; i++) {
        const rid = rows[order[i]!]!.id
        if (on) next.add(rid)
        else next.delete(rid)
      }
    } else if (next.has(id)) next.delete(id)
    else next.add(id)
    lastCheck.current = vIdx
    setChecked([...next])
  }
  const allChecked = n > 0 && order.every((i) => checked.has(rows[i]!.id))
  const someChecked = !allChecked && order.some((i) => checked.has(rows[i]!.id))
  const toggleAll = () => {
    const next = new Set(checked)
    if (allChecked) for (const i of order) next.delete(rows[i]!.id)
    else for (const i of order) next.add(rows[i]!.id)
    setChecked([...next])
  }

  /* ---------------------------------- Sort ---------------------------------- */
  const sortBy = (key: string, additive: boolean) => {
    const cur = sort.find((s) => s.key === key)
    const nextDir = !cur ? "asc" : cur.dir === "asc" ? "desc" : null
    let next: DataGridSort[]
    if (additive) next = nextDir ? (cur ? sort.map((s) => (s.key === key ? { key, dir: nextDir } : s)) : [...sort, { key, dir: nextDir }]) : sort.filter((s) => s.key !== key)
    else next = nextDir ? [{ key, dir: nextDir }] : []
    setSort(next)
    const col = columns.find((c) => c.key === key)
    setAnnounce(nextDir ? `Sorted by ${col?.label}, ${nextDir === "asc" ? "ascending" : "descending"}` : `Sort cleared for ${col?.label}`)
  }

  /* -------------------------------- Resizing -------------------------------- */
  const setVars = (w: number[]) => {
    const el = scrollRef.current
    if (!el) return
    const sw = w.reduce((a, b) => a + b, 0)
    const ex = Math.max(0, el.clientWidth - gutter - sw)
    el.style.setProperty("--gtc", `${rowSelection ? `${GUTTER}px ` : ""}${w.map((x, i) => `${i === nCols - 1 ? x + ex : x}px`).join(" ")}`)
    el.style.setProperty("--tw", `${gutter + sw + ex}px`)
  }
  const minOf = (i: number) => columns[i]!.minWidth ?? 72
  const startResize = (i: number, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const x0 = e.clientX
    const w0 = widths[i]!
    let latest = widths
    setResizing(i)
    const move = (ev: PointerEvent) => {
      latest = widths.map((w, k) => (k === i ? clamp(w0 + ev.clientX - x0, minOf(i), 560) : w))
      setVars(latest)
    }
    const up = () => {
      target.removeEventListener("pointermove", move)
      target.removeEventListener("pointerup", up)
      target.removeEventListener("pointercancel", up)
      setWidths(latest)
      setResizing(null)
    }
    target.addEventListener("pointermove", move)
    target.addEventListener("pointerup", up)
    target.addEventListener("pointercancel", up)
  }
  const autoFit = (i: number) => {
    const col = columns[i]!
    let longest = col.label.length + 4
    for (let k = 0; k < Math.min(n, 250); k++) longest = Math.max(longest, formatValue(col, rows[order[k]!]![col.key]).length)
    const w = col.type === "sparkline" ? 140 : Math.round(longest * 7.6 + 34)
    setWidths(widths.map((x, k) => (k === i ? clamp(w, minOf(i), 560) : x)))
  }

  /* -------------------------------- Pointer --------------------------------- */
  const cellFromPoint = (clientX: number, clientY: number): Pos | null => {
    const el = scrollRef.current
    if (!el || !n) return null
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top + el.scrollTop - HEAD
    const x = clientX - rect.left + el.scrollLeft - gutter
    let c = 0
    let acc = 0
    for (; c < nCols - 1; c++) {
      if (x < acc + shownW[c]!) break
      acc += shownW[c]!
    }
    return { r: clamp(Math.floor(y / rowH), 0, n - 1), c }
  }
  const dragging = React.useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const t = e.target as HTMLElement
    if (t.closest(".dgd-hrow") || t.closest(".dgd-frow") || t.closest("button")) return
    const cell = t.closest<HTMLElement>("[data-r]")
    if (!cell) return
    const r = Number(cell.dataset.r)
    const gut = cell.dataset.g !== undefined
    const c = gut ? 0 : Number(cell.dataset.c)
    scrollRef.current?.focus({ preventScroll: true })
    if (gut) {
      const a = e.shiftKey && anchor ? anchor : { r, c: 0 }
      setAnchor({ r: a.r, c: 0 })
      setActive({ r, c: lastCol })
      return
    }
    dragging.current = true
    scrollRef.current?.setPointerCapture(e.pointerId)
    if (e.shiftKey && active) setActive({ r, c })
    else {
      setActive({ r, c })
      setAnchor({ r, c })
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const p = cellFromPoint(e.clientX, e.clientY)
    if (p && (p.r !== active?.r || p.c !== active?.c)) setActive(p)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  /* -------------------------------- Keyboard -------------------------------- */
  const copyRange = () => {
    if (!range) return
    const lines: string[] = []
    for (let r = range.r0; r <= Math.min(range.r1, n - 1); r++) {
      const row = rows[order[r]!]!
      const cells: string[] = []
      for (let c = range.c0; c <= range.c1; c++) cells.push(formatValue(columns[c]!, row[columns[c]!.key]))
      lines.push(cells.join("\t"))
    }
    void navigator.clipboard?.writeText(lines.join("\n")).catch(() => {})
    setAnnounce(`Copied ${lines.length} ${lines.length === 1 ? "row" : "rows"}`)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget || !n) return
    if (!active && ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
      // the first key press lands on the first cell
      e.preventDefault()
      moveActive({ r: 0, c: 0 }, false)
      return
    }
    const cur = active ?? { r: 0, c: 0 }
    const mod = e.metaKey || e.ctrlKey
    const page = Math.max(1, viewRows - 2)
    switch (e.key) {
      case "ArrowDown":
        moveActive({ r: mod ? lastRow : cur.r + 1, c: cur.c }, e.shiftKey)
        break
      case "ArrowUp":
        moveActive({ r: mod ? 0 : cur.r - 1, c: cur.c }, e.shiftKey)
        break
      case "ArrowRight":
        moveActive({ r: cur.r, c: mod ? lastCol : cur.c + 1 }, e.shiftKey)
        break
      case "ArrowLeft":
        moveActive({ r: cur.r, c: mod ? 0 : cur.c - 1 }, e.shiftKey)
        break
      case "PageDown":
        moveActive({ r: cur.r + page, c: cur.c }, e.shiftKey)
        break
      case "PageUp":
        moveActive({ r: cur.r - page, c: cur.c }, e.shiftKey)
        break
      case "Home":
        moveActive({ r: mod ? 0 : cur.r, c: 0 }, e.shiftKey)
        break
      case "End":
        moveActive({ r: mod ? lastRow : cur.r, c: lastCol }, e.shiftKey)
        break
      case " ":
        if (rowSelection) toggleRow(cur.r, e.shiftKey)
        break
      case "Escape":
        setAnchor(active)
        break
      case "a":
      case "A":
        if (!mod) return
        setAnchor({ r: 0, c: 0 })
        setActive({ r: lastRow, c: lastCol })
        break
      case "c":
      case "C":
        if (!mod) return
        copyRange()
        break
      default:
        return
    }
    e.preventDefault()
  }

  /* ---------------------------------- Export -------------------------------- */
  const exportCsv = () => {
    const pick = checked.size ? order.filter((i) => checked.has(rows[i]!.id)) : order
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
    const head = columns.map((c) => esc(c.label)).join(",")
    const body = pick.map((i) => columns.map((c) => esc(Array.isArray(rows[i]![c.key]) ? (rows[i]![c.key] as number[]).join(" ") : formatValue(c, rows[i]![c.key]))).join(","))
    const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${exportFileName ?? (label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "grid")}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /* --------------------------------- Output --------------------------------- */
  const nf = new Intl.NumberFormat("en-US")
  const fmtStat = (v: number) => {
    const single = stats?.single
    return single && isNum(single) ? formatValue({ ...single, decimals: single.decimals ?? (Number.isInteger(v) ? 0 : 1) }, v) : nf.format(Math.round(v * 100) / 100)
  }
  const activeId = active && active.r >= winStart && active.r < winEnd ? `${uid}-${active.r}-${active.c}` : undefined
  const addr = active ? `${colLetter(active.c)}${active.r + 1}` : ""
  const sortOf = (key: string) => {
    const i = sort.findIndex((s) => s.key === key)
    return i < 0 ? null : { dir: sort[i]!.dir, rank: i + 1 }
  }
  const rowsOut: React.ReactNode[] = []
  for (let v = winStart; v < winEnd; v++) {
    const row = rows[order[v]!]!
    const isChecked = checked.has(row.id)
    const top = v * rowH
    rowsOut.push(
      <div
        key={row.id}
        ref={(el) => {
          if (el) rowEls.current.set(row.id, el)
          else rowEls.current.delete(row.id)
        }}
        className="dgd-row"
        role="row"
        aria-rowindex={v + 2}
        aria-selected={isChecked}
        data-checked={isChecked ? "" : undefined}
        style={{ height: rowH, transform: `translateY(${top}px)`, "--i": Math.max(0, v - winStart), "--ty": `${top}px` } as React.CSSProperties}
      >
        {rowSelection && (
          <div className="dgd-g" role="rowheader" data-r={v} data-g="">
            <span className="dgd-no">{v + 1}</span>
            <button
              type="button"
              role="checkbox"
              className="dgd-ck"
              aria-checked={isChecked}
              aria-label={`Select row ${v + 1}`}
              onClick={(e) => toggleRow(v, e.shiftKey)}
            >
              <Check size={12} strokeWidth={3} aria-hidden />
            </button>
          </div>
        )}
        {columns.map((col, c) => {
          const val = row[col.key]
          const sel = !!range && v >= range.r0 && v <= range.r1 && c >= range.c0 && c <= range.c1
          const isActive = !!active && active.r === v && active.c === c
          const pin = c < pinned.length
          let body: React.ReactNode
          if (col.type === "sparkline" && Array.isArray(val)) body = <Spark data={val} fmt={(x) => nf.format(Math.round(x * 10) / 10)} />
          else if (col.type === "select" && val !== null && val !== undefined) {
            const text = String(val)
            const tone = TONES[Math.abs([...text].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)) % TONES.length]
            body = (
              <span className="dgd-chip" style={{ "--tone": tone } as React.CSSProperties}>
                {text}
              </span>
            )
          } else if (col.type === "percent" && col.bar && typeof val === "number") {
            body = (
              <>
                <span className="dgd-pbar" aria-hidden="true">
                  <i style={{ width: `${clamp(val, 0, 100)}%`, "--b": val < 50 ? "var(--dgd-neg)" : "var(--dgd-accent)" } as React.CSSProperties} />
                </span>
                <span className="dgd-tx">{formatValue(col, val)}</span>
              </>
            )
          } else body = <span className="dgd-tx">{formatValue(col, val)}</span>
          return (
            <div
              key={col.key}
              id={`${uid}-${v}-${c}`}
              className="dgd-c"
              role="gridcell"
              aria-colindex={c + 1}
              aria-selected={sel || undefined}
              data-r={v}
              data-c={c}
              data-num={isNum(col) ? "" : undefined}
              data-pin={pin ? "" : undefined}
              data-first={c === 0 ? "" : undefined}
              data-sel={sel ? "" : undefined}
              data-active={isActive ? "" : undefined}
              style={pin ? { left: pinLeft(c) } : undefined}
            >
              {body}
            </div>
          )
        })}
      </div>,
    )
  }

  const status = stats ? (
    <>
      <span className="dgd-st">
        Count <b>{nf.format(stats.count)}</b>
      </span>
      {stats.numeric > 0 && (
        <>
          <span className="dgd-st">
            Sum <b>{fmtStat(stats.sum)}</b>
          </span>
          <span className="dgd-st">
            Avg <b>{stats.avg === null ? "" : fmtStat(stats.avg)}</b>
          </span>
        </>
      )}
    </>
  ) : null

  return (
    <figure className={cn("dgd", className)} data-intro={intro ? "" : undefined} aria-label={label}>
      <style href="data-grid" precedence="default">
        {CSS}
      </style>
      {(title || subtitle || actions) && (
        <div className="dgd-top">
          <div>
            {title && <p className="dgd-title">{title}</p>}
            {subtitle && <p className="dgd-sub">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="dgd-card">
        {toolbar && (
          <div className="dgd-bar" role="toolbar" aria-label={`${label} tools`}>
            <label className="dgd-search">
              <Search size={15} aria-hidden />
              <input
                type="search"
                placeholder="Search"
                aria-label={`Search ${label}`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setStart(0)
                  if (scrollRef.current) scrollRef.current.scrollTop = 0
                  setActive(null)
                  setAnchor(null)
                }}
              />
              {query && (
                <button type="button" className="dgd-clear" aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={14} aria-hidden />
                </button>
              )}
            </label>
            <span className="dgd-count" aria-live="polite">
              {checked.size > 0 ? `${nf.format(checked.size)} selected` : query ? `${nf.format(n)} of ${nf.format(rows.length)} rows` : `${nf.format(rows.length)} rows`}
            </span>
            {checked.size > 0 && (
              <button type="button" className="dgd-btn" data-quiet="" onClick={() => setChecked([])}>
                Clear
              </button>
            )}
            <span className="dgd-spacer" />
            <span className="dgd-seg" role="group" aria-label="Row density">
              {(
                [
                  ["compact", Rows4, "Compact rows"],
                  ["standard", Rows3, "Standard rows"],
                  ["comfortable", Rows2, "Comfortable rows"],
                ] as const
              ).map(([d, Icon, name]) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={density === d}
                  aria-label={name}
                  title={name}
                  onClick={() => {
                    setDensityInner(d)
                    onDensityChange?.(d)
                  }}
                >
                  <Icon size={15} aria-hidden />
                </button>
              ))}
            </span>
            <button type="button" className="dgd-btn" onClick={exportCsv}>
              <Download size={15} aria-hidden />
              <span>Export</span>
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="dgd-scroll"
          role="grid"
          tabIndex={0}
          aria-label={label}
          aria-rowcount={n + 1}
          aria-colcount={nCols}
          aria-multiselectable="true"
          aria-busy={loading || undefined}
          aria-activedescendant={activeId}
          style={{ height: boxH, "--gtc": gtc, "--tw": `${totalW}px` } as React.CSSProperties}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="dgd-inner">
            <div className="dgd-hrow" role="row" aria-rowindex={1}>
              {rowSelection && (
                <div className="dgd-g" role="columnheader">
                  <button type="button" role="checkbox" className="dgd-ck" aria-checked={allChecked ? true : someChecked ? "mixed" : false} aria-label="Select all rows" onClick={toggleAll}>
                    {someChecked ? <Minus size={12} strokeWidth={3} aria-hidden /> : <Check size={12} strokeWidth={3} aria-hidden />}
                  </button>
                </div>
              )}
              {columns.map((col, i) => {
                const so = sortOf(col.key)
                const sortable = col.sortable !== false
                return (
                  <div
                    key={col.key}
                    className="dgd-h"
                    role="columnheader"
                    aria-colindex={i + 1}
                    aria-sort={so ? (so.dir === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined}
                    data-num={isNum(col) ? "" : undefined}
                    data-pin={i < pinned.length ? "" : undefined}
                    style={i < pinned.length ? { left: pinLeft(i) } : undefined}
                  >
                    {sortable ? (
                      <button type="button" className="dgd-hb" onClick={(e) => sortBy(col.key, e.shiftKey)} title="Click to sort, Shift-click to add a second key">
                        <span>{col.label}</span>
                        <span className="dgd-arrow" aria-hidden="true">
                          <ArrowUp size={14} />
                          {sort.length > 1 && so && <sup>{so.rank}</sup>}
                        </span>
                      </button>
                    ) : (
                      <span className="dgd-hb">{col.label}</span>
                    )}
                    <span
                      className="dgd-rz"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${col.label} column`}
                      aria-valuenow={widths[i]}
                      aria-valuemin={minOf(i)}
                      aria-valuemax={560}
                      tabIndex={0}
                      data-on={resizing === i ? "" : undefined}
                      onPointerDown={(e) => startResize(i, e)}
                      onDoubleClick={() => autoFit(i)}
                      onKeyDown={(e) => {
                        const step = e.shiftKey ? 40 : 10
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                          e.preventDefault()
                          setWidths(widths.map((w, k) => (k === i ? clamp(w + (e.key === "ArrowLeft" ? -step : step), minOf(i), 560) : w)))
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {loading ? (
              <div className="dgd-body" style={{ height: 6 * rowH }}>
                {Array.from({ length: 6 }, (_, r) => (
                  <div key={r} className="dgd-row" role="row" style={{ height: rowH, transform: `translateY(${r * rowH}px)` }}>
                    {rowSelection && <div className="dgd-g" />}
                    {columns.map((c, k) => (
                      <div key={c.key} className="dgd-c">
                        <span className="dgd-sk" style={{ width: `${40 + ((r * 17 + k * 29) % 45)}%` }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : n === 0 ? (
              <div className="dgd-empty" style={{ width: viewW || undefined, position: "sticky", left: 0 }}>
                <span>{rows.length === 0 ? emptyMessage : "No rows match"}</span>
                {rows.length > 0 && (
                  <button type="button" className="dgd-btn" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="dgd-body" style={{ height: n * rowH }}>
                {rowsOut}
              </div>
            )}

            {totals && n > 0 && !loading && (
              <div className="dgd-frow" role="row" aria-rowindex={n + 2}>
                {rowSelection && <div className="dgd-g" role="rowheader" />}
                {columns.map((col, i) => {
                  const agg = aggregates[i]
                  const kind = aggregateOf(col)
                  return (
                    <div
                      key={col.key}
                      className="dgd-h"
                      role="gridcell"
                      data-num={isNum(col) ? "" : undefined}
                      data-pin={i < pinned.length ? "" : undefined}
                      style={i < pinned.length ? { left: pinLeft(i) } : undefined}
                    >
                      {i === 0 && agg === null ? (
                        <span className="dgd-tx" style={{ color: "var(--dgd-t3)", fontSize: 13 }}>{`${nf.format(n)} rows`}</span>
                      ) : agg === null || agg === undefined ? null : (
                        <span className="dgd-tx" style={{ fontWeight: 500, color: "var(--dgd-t2)" }}>
                          {shownW[i]! >= 124 && <span style={{ marginRight: 6, fontWeight: 400, color: "var(--dgd-t3)", fontSize: 12 }}>{kind === "average" ? "Avg" : kind === "sum" ? "Sum" : kind}</span>}
                          <CountText value={agg} format={(v) => footFormat(col, v, kind)} reduced={reduced} />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {selectionStats && (
          <div className="dgd-status">
            <span className="dgd-addr">{addr}</span>
            {status ?? <span>{active ? "" : "Select a cell, then use the arrow keys. Shift extends the range."}</span>}
          </div>
        )}
      </div>

      <p className="dgd-sr" role="status" aria-live="polite">
        {announce}
      </p>
    </figure>
  )
}
