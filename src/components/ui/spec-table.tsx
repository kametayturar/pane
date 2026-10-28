"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SpecTone = "ok" | "warn" | "bad" | "idle"
export type SpecColumnType = "text" | "number" | "dither" | "status" | "mono"

export type SpecColumn<T = Record<string, unknown>> = {
  /** Property read from each row. */
  key: string
  /** Header text (mono uppercase). */
  label: string
  /** Default: right for numbers, left for everything else. */
  align?: "left" | "right" | "center"
  /** Pixels, or any CSS width. Columns without a width share the remaining space. */
  width?: number | string
  /** How the cell is drawn. `dither` expects 0..1 and draws a Bayer-dithered bar of that density. Default "text". */
  type?: SpecColumnType
  /** Turns the value into the cell text. Default: grouped number, 2 decimals for dither, the string itself otherwise. */
  format?: (value: unknown, row: T) => React.ReactNode
  /** Small t3 unit after a number, e.g. "ms". */
  unit?: string
  /** Header becomes a sort button. */
  sortable?: boolean
  /** Status columns: the tick colour for a value. Default reads words like pass / review / fail. */
  tone?: (value: unknown, row: T) => SpecTone
}

export type SpecSort = { key: string; dir: "asc" | "desc" }

export type SpecSummary = {
  /** Column to total up in the footer. */
  key: string
  /** Footer label prefix. Default: the column label. */
  label?: string
  /** Which readouts to show. Default both. */
  show?: ("sum" | "avg")[]
  /** Formats sums and averages. Default: grouped, up to 2 decimals. */
  format?: (n: number) => string
  /** Unit after the readout. */
  unit?: string
}

export type SpecTableProps<T extends object = Record<string, unknown>> = {
  columns: SpecColumn<T>[]
  rows: T[]
  /** Property name, or a function, giving each row a stable id. Default: "id", else the index. */
  rowKey?: string | ((row: T, index: number) => string)
  /** Sort (controlled). `null` = original order. */
  sort?: SpecSort | null
  defaultSort?: SpecSort | null
  onSortChange?: (sort: SpecSort | null) => void
  /** Selected row id (controlled). `null` = none. Click or Enter toggles it. */
  selected?: string | null
  defaultSelected?: string | null
  onSelect?: (id: string | null, row: T | null) => void
  /** Dither skeleton instead of rows. */
  loading?: boolean
  /** How many skeleton rows to draw while loading. Default 6. */
  loadingRows?: number
  /** Shown when there are no rows. Default "No rows to show". */
  empty?: React.ReactNode
  /** Footer readout row: rows, selected, and the sum / average of `summary.key`. Default true. */
  footer?: boolean
  /** Which column the footer totals. Default: the first number or dither column. */
  summary?: SpecSummary
  /** Specimen caption under the table, shown as written: "FIG. 3 — Eval run 0412". */
  caption?: string
  /** Body scrolls vertically past this height, under the sticky header. */
  maxHeight?: number | string
  "aria-label"?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ist {
  --ist-paper: #fafafa;
  --ist-sheet: #ffffff;
  --ist-ink: #0a0a0a;
  --ist-signal: #0060e2;
  --ist-accent: var(--ist-signal);
  --ist-surface: var(--ist-sheet);
  --ist-signal-soft: color-mix(in oklab, var(--ist-signal) 12%, transparent);
  --ist-t1: color-mix(in oklab, var(--ist-ink) 92%, transparent);
  --ist-t2: color-mix(in oklab, var(--ist-ink) 64%, transparent);
  --ist-t3: color-mix(in oklab, var(--ist-ink) 44%, transparent);
  --ist-t4: color-mix(in oklab, var(--ist-ink) 22%, transparent);
  --ist-rule: color-mix(in oklab, var(--ist-ink) 14%, transparent);
  --ist-rule-2: color-mix(in oklab, var(--ist-ink) 7%, transparent);
  --ist-ok: #1f8a4c;
  --ist-warn: #b7791f;
  --ist-bad: #c4321a;
  --ist-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ist-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ist-font: var(--ist-sans);
  --ist-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ist-ease: cubic-bezier(.2, .8, .2, 1);
  --ist-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --ist-head: 33px;
  container: ist / inline-size;
  display: block;
  width: 100%;
  padding: 8px;
  font: 13px/20px var(--ist-font);
  color: var(--ist-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ist {
  --ist-paper: #0c0c0d;
  --ist-sheet: #1c1c1e;
  --ist-ink: #f5f5f5;
  --ist-signal: #4d8dff;
  --ist-ok: #4cc27f;
  --ist-warn: #e0a64a;
  --ist-bad: #ff7a5c;
}
.ist *, .ist *::before, .ist *::after { box-sizing: border-box }
:where(.ist) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ist :focus-visible { outline: 2px solid color-mix(in oklab, var(--ist-accent) 60%, transparent); outline-offset: 1px }

.ist-frame { position: relative; background: var(--ist-surface); box-shadow: 0 0 0 1px var(--ist-rule) }
.ist-crop { position: absolute; width: 8px; height: 8px; border: 0 solid var(--ist-t4); pointer-events: none; z-index: 5 }
.ist-crop[data-c="tl"] { left: -5px; top: -5px; border-width: 1px 0 0 1px }
.ist-crop[data-c="tr"] { right: -5px; top: -5px; border-width: 1px 1px 0 0 }
.ist-crop[data-c="bl"] { left: -5px; bottom: -5px; border-width: 0 0 1px 1px }
.ist-crop[data-c="br"] { right: -5px; bottom: -5px; border-width: 0 1px 1px 0 }

.ist-scroll { overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--ist-t4) transparent }
.ist-sheet { position: relative; min-width: var(--ist-min, 0) }
.ist-table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums }

.ist-th {
  position: sticky; top: 0; z-index: 3;
  height: var(--ist-head);
  padding: 0 14px;
  background: var(--ist-surface);
  border-bottom: 1px solid var(--ist-t4);
  font: 500 10.5px/16px var(--ist-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ist-t3);
  text-align: left;
  white-space: nowrap;
}
.ist-th[data-align="right"] { text-align: right }
.ist-th[data-align="center"] { text-align: center }
.ist-sort { display: inline-flex; align-items: center; gap: 6px; height: 100%; max-width: 100%; letter-spacing: inherit; text-transform: inherit; transition: color 160ms var(--ist-ease) }
.ist-sort:hover, .ist-th[aria-sort="ascending"] .ist-sort, .ist-th[aria-sort="descending"] .ist-sort { color: var(--ist-t1) }
.ist-tick { flex: none; width: 8px; height: 10px; overflow: visible }
.ist-tick path { fill: none; stroke: var(--ist-t4); stroke-width: 1.25; stroke-linecap: square; transition: stroke 160ms var(--ist-ease) }
.ist-th[aria-sort="ascending"] .ist-tick .up, .ist-th[aria-sort="descending"] .ist-tick .dn { stroke: var(--ist-t1) }
.ist-sort:hover .ist-tick path { stroke: var(--ist-t3) }
.ist-th[aria-sort="ascending"] .ist-sort:hover .ist-tick .up, .ist-th[aria-sort="descending"] .ist-sort:hover .ist-tick .dn { stroke: var(--ist-t1) }

.ist-td {
  height: 36px;
  padding: 0 14px;
  background: var(--ist-surface);
  border-bottom: 1px solid var(--ist-rule-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-align: left;
  vertical-align: middle;
  transition: background-color 160ms var(--ist-ease), box-shadow 160ms var(--ist-ease);
}
.ist-td[data-align="right"] { text-align: right }
.ist-td[data-align="center"] { text-align: center }
.ist-td[data-type="mono"] { font: 400 12px/20px var(--ist-mono); color: var(--ist-t2) }
.ist-td[data-type="number"] { font: 400 12.5px/20px var(--ist-mono); color: var(--ist-t1) }
.ist-td[data-type="text"][data-first="1"] { font-weight: 500 }
.ist-unit { margin-left: 3px; font: 400 11px/16px var(--ist-mono); color: var(--ist-t3) }

/* sticky first column (matters when the table scrolls sideways) */
.ist-th:first-child, .ist-td:first-child { position: sticky; left: 0 }
.ist-th:first-child { z-index: 4 }
.ist-td:first-child { z-index: 1; position: sticky; padding-left: 18px; box-shadow: 1px 0 0 var(--ist-rule-2) }

.ist-row { outline: none; cursor: pointer; scroll-margin-top: var(--ist-head) }
.ist-row:hover .ist-td { background: color-mix(in oklab, var(--ist-surface), var(--ist-ink) 3%); box-shadow: inset 0 1px 0 var(--ist-t4), inset 0 -1px 0 var(--ist-t4) }
.ist-row:hover .ist-td:first-child { box-shadow: inset 0 1px 0 var(--ist-t4), inset 0 -1px 0 var(--ist-t4), 1px 0 0 var(--ist-rule-2) }
.ist-row:focus-visible .ist-td { background: color-mix(in oklab, var(--ist-surface), var(--ist-ink) 3%) }
.ist-row:focus-visible .ist-td:first-child { box-shadow: inset 2px 0 0 var(--ist-t3) }
.ist-row[aria-selected="true"] .ist-td { background: color-mix(in oklab, var(--ist-surface), var(--ist-signal) 6%) }
.ist-td:first-child::before {
  content: ""; position: absolute; left: 0; top: 7px; bottom: 7px; width: 2px;
  background: var(--ist-accent); transform: scaleY(0); transform-origin: 50% 50%;
  transition: transform 260ms var(--ist-ease);
}
.ist-row[aria-selected="true"] .ist-td:first-child::before { transform: scaleY(1) }

.ist-status { display: inline-flex; align-items: center; gap: 8px; font: 500 10.5px/16px var(--ist-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ist-t2) }
.ist-status i { display: block; width: 2px; height: 10px; background: var(--ist-t4) }
.ist-status[data-tone="ok"] i { background: var(--ist-ok) }
.ist-status[data-tone="warn"] i { background: var(--ist-warn) }
.ist-status[data-tone="bad"] i { background: var(--ist-bad) }
.ist-status[data-tone="bad"] { color: var(--ist-bad) }

.ist-dither { display: inline-flex; align-items: center; gap: 10px; vertical-align: middle }
.ist-dither-val { font: 400 12.5px/20px var(--ist-mono); color: var(--ist-t1); min-width: 3ch }
.ist-bar { position: relative; display: block; padding-bottom: 3px; color: var(--ist-t1); border-bottom: 1px solid var(--ist-t4) }
.ist-bar::before, .ist-bar::after { content: ""; position: absolute; bottom: -1px; width: 1px; height: 4px; background: var(--ist-t4) }
.ist-bar::before { left: 0 }
.ist-bar::after { right: 0 }
.ist-bar svg { display: block; shape-rendering: crispEdges }
.ist-bar path { fill: currentColor }
.ist-row[aria-selected="true"] .ist-bar { color: var(--ist-accent) }

/* scan-in: a 1px signal line reveals the body top to bottom */
.ist-body { animation: ist-reveal 640ms var(--ist-ease-trace) backwards }
@keyframes ist-reveal { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
.ist-scan {
  position: absolute; left: 0; right: 0; top: 100%; height: 1px; z-index: 2; pointer-events: none;
  background: var(--ist-accent);
  animation: ist-scan 640ms var(--ist-ease-trace) backwards, ist-scan-fade 160ms linear 640ms forwards;
}
@keyframes ist-scan { from { top: var(--ist-head) } to { top: 100% } }
@keyframes ist-scan-fade { to { opacity: 0 } }

/* loading skeleton + empty */
.ist-skel { display: block; color: var(--ist-t3); animation: ist-breathe 1.8s ease-in-out infinite }
.ist-skel svg { display: block; shape-rendering: crispEdges }
.ist-skel path { fill: currentColor }
@keyframes ist-breathe { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
.ist-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 36px 16px 40px; text-align: center; color: var(--ist-t2) }
.ist-empty .ist-skel { animation: none; color: var(--ist-t3) }
.ist-empty b { display: block; font: 500 10.5px/16px var(--ist-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ist-t3) }

/* footer readout row */
.ist-foot { display: flex; flex-wrap: wrap; overflow: hidden; border-top: 1px solid var(--ist-t4) }
.ist-foot > div {
  flex: 1 1 128px; min-width: 0; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: baseline; gap: 8px; padding: 8px 14px;
  box-shadow: 1px 0 0 var(--ist-rule), 0 1px 0 var(--ist-rule);
  font: 400 12px/16px var(--ist-mono); font-variant-numeric: tabular-nums; color: var(--ist-t1); white-space: nowrap;
}
.ist-foot span { font: 500 10.5px/16px var(--ist-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ist-t3) }
.ist-foot em { font-style: normal; color: var(--ist-t3) }
.ist-cap { margin: 10px 0 0; font: 500 10.5px/16px var(--ist-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ist-t3) }
.ist-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* narrow: keep the sticky first column from taking the whole screen */
@container ist (max-width: 560px) {
  .ist-table col:first-child { width: 160px !important }
  .ist-th, .ist-td { padding-inline: 12px }
  .ist-td:first-child { padding-left: 16px }
}

@media (prefers-reduced-motion: reduce) {
  .ist *, .ist *::before, .ist *::after { animation: none !important; transition: none !important }
  .ist-scan { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Dither                                   */
/* -------------------------------------------------------------------------- */

const DOT = 2 // CSS px per dither dot: whole device pixels at 1x and 2x, vector so it stays crisp at any DPR

/** 8x8 ordered (Bayer) threshold matrix, 0..63. */
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

const pathCache = new Map<string, string>()

/** SVG path of the "on" dots for a cols x rows block. `density` is 0..1, or a function of the column for a ramp. */
function ditherPath(cols: number, rows: number, density: number | ((x: number) => number), cacheKey?: string) {
  const key = cacheKey ?? (typeof density === "number" ? `${cols}x${rows}:${Math.round(density * 64)}` : undefined)
  const hit = key ? pathCache.get(key) : undefined
  if (hit !== undefined) return hit
  let d = ""
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dens = typeof density === "number" ? density : density(x)
      if ((BAYER[y % 8][x % 8] + 0.5) / 64 < dens) d += `M${x} ${y}h1v1h-1z`
    }
  }
  if (key) pathCache.set(key, d)
  return d
}

function DitherBlock({
  cols,
  rows,
  density,
  cacheKey,
}: {
  cols: number
  rows: number
  density: number | ((x: number) => number)
  cacheKey?: string
}) {
  const d = React.useMemo(() => ditherPath(cols, rows, density, cacheKey), [cols, rows, density, cacheKey])
  return (
    <svg width={cols * DOT} height={rows * DOT} viewBox={`0 0 ${cols} ${rows}`} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const BAR_COLS = 44
const BAR_ROWS = 8

function defaultTone(v: unknown): SpecTone {
  const s = String(v).toLowerCase()
  if (/(^|\W)(ok|pass|passed|done|healthy|ready|success|complete|completed)(\W|$)/.test(s)) return "ok"
  if (/(warn|review|flaky|slow|degraded|pending|queued|retry)/.test(s)) return "warn"
  if (/(fail|error|bad|blocked|timeout|down|refused)/.test(s)) return "bad"
  return "idle"
}

function defaultText(col: SpecColumn<never>, v: unknown): string {
  if (v == null || v === "") return "–"
  if (typeof v === "number") {
    return col.type === "dither"
      ? v.toFixed(2)
      : v.toLocaleString("en-US", { maximumFractionDigits: 3 })
  }
  return String(v)
}

function compareValues(a: unknown, b: unknown): number {
  const an = a == null || a === ""
  const bn = b == null || b === ""
  if (an || bn) return an === bn ? 0 : an ? 1 : -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
}

function useControllable<V>(controlled: V | undefined, initial: V) {
  const [inner, setInner] = React.useState<V>(initial)
  return [controlled !== undefined ? controlled : inner, setInner] as const
}

function fmtAgg(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

function SortTick() {
  return (
    <svg className="ist-tick" viewBox="0 0 8 10" aria-hidden="true">
      <path className="up" d="M1 4 L4 1 L7 4" />
      <path className="dn" d="M1 6 L4 9 L7 6" />
    </svg>
  )
}

/* Deterministic widths so the skeleton looks like data, not a grid of equal bars. */
function skelCols(col: SpecColumn<never>, row: number, colIdx: number) {
  const wobble = (row * 7 + colIdx * 5) % 5
  switch (col.type) {
    case "number":
      return 7 + (wobble % 3) * 2
    case "dither":
      return BAR_COLS
    case "status":
      return 10 + (wobble % 2) * 3
    case "mono":
      return 18 + wobble * 3
    default:
      return colIdx === 0 ? 30 + wobble * 6 : 20 + wobble * 5
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * A data table in Instrument style: mono tabular numbers, dither bars as data, status ticks, sortable headers,
 * click-to-select rows with a signal tick, keyboard navigation, a sticky header and a footer readout row.
 */
export function SpecTable<T extends object = Record<string, unknown>>({
  columns,
  rows,
  rowKey = "id",
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  loading = false,
  loadingRows = 6,
  empty = "No rows to show",
  footer = true,
  summary,
  caption,
  maxHeight,
  "aria-label": ariaLabel,
  className,
}: SpecTableProps<T>) {
  const [sort, setSort] = useControllable<SpecSort | null>(sortProp, defaultSort)
  const [selected, setSelected] = useControllable<string | null>(selectedProp, defaultSelected)
  const [focusKey, setFocusKey] = React.useState<string | null>(null)

  const read = (row: T, key: string): unknown => (row as Record<string, unknown>)[key]

  const sorted = React.useMemo(() => {
    const list = rows.map((row, i) => ({ row, id: typeof rowKey === "function" ? rowKey(row, i) : String((row as Record<string, unknown>)[rowKey] ?? i) }))
    if (!sort) return list
    const dir = sort.dir === "asc" ? 1 : -1
    return list
      .map((entry, i) => ({ entry, i }))
      .sort((a, b) => {
        const av = (a.entry.row as Record<string, unknown>)[sort.key]
        const bv = (b.entry.row as Record<string, unknown>)[sort.key]
        const missing = (v: unknown) => v == null || v === ""
        if (missing(av) || missing(bv)) return compareValues(av, bv) || a.i - b.i // missing values stay last in both directions
        return compareValues(av, bv) * dir || a.i - b.i
      })
      .map((x) => x.entry)
  }, [rows, rowKey, sort])

  const ids = sorted.map((s) => s.id)
  const selectedRow = selected != null ? sorted.find((s) => s.id === selected) : undefined
  const tabStop = focusKey != null && ids.includes(focusKey) ? focusKey : selectedRow ? selectedRow.id : ids[0]

  function changeSort(key: string) {
    const next: SpecSort | null =
      sort?.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null
    setSort(next)
    onSortChange?.(next)
  }

  function choose(id: string, row: T) {
    const next = selected === id ? null : id
    setSelected(next)
    onSelect?.(next, next === null ? null : row)
  }

  function onRowKey(e: React.KeyboardEvent<HTMLTableRowElement>, id: string, row: T) {
    const tr = e.currentTarget
    let target: Element | null = null
    if (e.key === "ArrowDown") target = tr.nextElementSibling
    else if (e.key === "ArrowUp") target = tr.previousElementSibling
    else if (e.key === "Home") target = tr.parentElement?.firstElementChild ?? null
    else if (e.key === "End") target = tr.parentElement?.lastElementChild ?? null
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      choose(id, row)
      return
    } else if (e.key === "Escape" && selected != null) {
      setSelected(null)
      onSelect?.(null, null)
      return
    } else return
    e.preventDefault()
    if (target instanceof HTMLElement) target.focus()
  }

  /* footer numbers */
  const sumCol = summary
    ? columns.find((c) => c.key === summary.key)
    : columns.find((c) => c.type === "number" || c.type === "dither")
  const nums = sumCol
    ? rows.map((r) => read(r, sumCol.key)).filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    : []
  const total = nums.reduce((a, b) => a + b, 0)
  const show = summary?.show ?? ["sum", "avg"]
  const aggFormat = summary?.format ?? fmtAgg
  const aggUnit = summary?.unit ?? sumCol?.unit
  const aggLabel = summary?.label ?? sumCol?.label

  const minWidth = columns.reduce((a, c) => a + (typeof c.width === "number" ? c.width : 120), 0)
  const scanKey = `${sort ? `${sort.key}-${sort.dir}` : "none"}:${loading ? "l" : rows.length ? "r" : "e"}`

  return (
    <figure className={cn("ist", className)} style={{ margin: 0 }}>
      <style href="spec-table" precedence="default">
        {CSS}
      </style>
      <div className="ist-frame">
        <span className="ist-crop" data-c="tl" aria-hidden="true" />
        <span className="ist-crop" data-c="tr" aria-hidden="true" />
        <span className="ist-crop" data-c="bl" aria-hidden="true" />
        <span className="ist-crop" data-c="br" aria-hidden="true" />

        <div className="ist-scroll" style={{ maxHeight }}>
          <div className="ist-sheet" style={{ "--ist-min": `${minWidth}px` } as React.CSSProperties}>
            <table
              className="ist-table"
              role="grid"
              aria-label={ariaLabel ?? caption ?? "Table"}
              aria-busy={loading || undefined}
              aria-rowcount={loading ? undefined : sorted.length + 1}
            >
              <colgroup>
                {columns.map((c) => (
                  <col key={c.key} style={c.width != null ? { width: c.width } : undefined} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((c) => {
                    const align = c.align ?? (c.type === "number" ? "right" : "left")
                    const active = sort?.key === c.key ? sort.dir : null
                    return (
                      <th
                        key={c.key}
                        className="ist-th"
                        scope="col"
                        data-align={align}
                        aria-sort={c.sortable ? (active === "asc" ? "ascending" : active === "desc" ? "descending" : "none") : undefined}
                      >
                        {c.sortable ? (
                          <button type="button" className="ist-sort" onClick={() => changeSort(c.key)}>
                            {align === "right" ? <SortTick /> : null}
                            <span>{c.label}</span>
                            {align !== "right" ? <SortTick /> : null}
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="ist-body" key={scanKey}>
                {loading
                  ? Array.from({ length: loadingRows }, (_, r) => (
                      <tr key={r} aria-hidden="true">
                        {columns.map((c, ci) => {
                          const align = c.align ?? (c.type === "number" ? "right" : "left")
                          const cols = skelCols(c as SpecColumn<never>, r, ci)
                          return (
                            <td key={c.key} className="ist-td" data-align={align} data-first={ci === 0 ? "1" : undefined}>
                              <span className="ist-skel" style={{ display: "inline-block", animationDelay: `${(r * 90 + ci * 40) % 600}ms` }}>
                                <DitherBlock cols={cols} rows={5} density={0.16 + ((r + ci) % 3) * 0.04} />
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  : sorted.map(({ row, id }, ri) => (
                      <tr
                        key={id}
                        className="ist-row"
                        data-key={id}
                        tabIndex={id === tabStop ? 0 : -1}
                        aria-selected={selected === id}
                        aria-rowindex={ri + 2}
                        onClick={() => choose(id, row)}
                        onFocus={() => setFocusKey(id)}
                        onKeyDown={(e) => onRowKey(e, id, row)}
                      >
                        {columns.map((c, ci) => {
                          const v = read(row, c.key)
                          const type = c.type ?? "text"
                          const align = c.align ?? (type === "number" ? "right" : "left")
                          const text =
                            c.format ? c.format(v, row) : defaultText(c as SpecColumn<never>, v)
                          let content: React.ReactNode
                          if (type === "dither") {
                            const n = typeof v === "number" ? Math.min(1, Math.max(0, v)) : 0
                            content = (
                              <span className="ist-dither">
                                <span className="ist-bar" aria-hidden="true">
                                  <DitherBlock cols={BAR_COLS} rows={BAR_ROWS} density={n} />
                                </span>
                                <span className="ist-dither-val">{text}</span>
                              </span>
                            )
                          } else if (type === "status") {
                            const tone = c.tone ? c.tone(v, row) : defaultTone(v)
                            content = (
                              <span className="ist-status" data-tone={tone}>
                                <i aria-hidden="true" />
                                {text}
                              </span>
                            )
                          } else if (type === "number") {
                            content = (
                              <>
                                {text}
                                {c.unit && v != null ? <span className="ist-unit">{c.unit}</span> : null}
                              </>
                            )
                          } else {
                            content = text
                          }
                          return (
                            <td
                              key={c.key}
                              className="ist-td"
                              data-type={type}
                              data-align={align}
                              data-first={ci === 0 ? "1" : undefined}
                              role="gridcell"
                            >
                              {content}
                              {ci === 0 && selected === id ? <span className="ist-sr"> (selected)</span> : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
              </tbody>
            </table>
            <span className="ist-scan" key={`scan-${scanKey}`} aria-hidden="true" />
          </div>
          {!loading && sorted.length === 0 ? (
            <div className="ist-empty" role="status">
              <span className="ist-skel" aria-hidden="true">
                <DitherBlock
                  cols={56}
                  rows={6}
                  density={(x) => (x / 56) * 0.3}
                  cacheKey="empty-ramp"
                />
              </span>
              <div>
                <b>No rows</b>
                <span>{empty}</span>
              </div>
            </div>
          ) : null}
        </div>

        {footer ? (
          <div className="ist-foot" aria-live="polite">
            <div>
              <span>Rows</span>
              {loading ? "–" : sorted.length}
            </div>
            <div>
              <span>Selected</span>
              {selectedRow ? <>1 <em>· {selectedRow.id}</em></> : "–"}
            </div>
            {sumCol && nums.length > 0 && !loading
              ? show.map((kind) => (
                  <div key={kind}>
                    <span>
                      {kind === "sum" ? "Sum" : "Avg"} {aggLabel}
                    </span>
                    {aggFormat(kind === "sum" ? total : total / nums.length)}
                    {aggUnit ? <em>{aggUnit}</em> : null}
                  </div>
                ))
              : null}
          </div>
        ) : null}
      </div>
      {caption ? <figcaption className="ist-cap">{caption}</figcaption> : null}
    </figure>
  )
}
