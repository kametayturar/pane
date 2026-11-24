"use client"

/**
 * Breakdown List – how a total splits into parts, and which parts are biggest.
 *
 * One share bar and one ranked list that are the same thing seen twice. The total sits on top in large type with its
 * unit ("$1,108 this week"); under it one thin bar split into segments by share, in steps of ink (no rainbow), with an
 * optional marker for a limit; under that the ranked rows (name, a hairline bar against the largest row, value and
 * share). Pointing at or focusing a row gives it and its segment the accent, dims the rest and rewrites the line under
 * the total as a sentence ("Nova 2 Pro: $612, 55% of the total"); pointing at a segment does the same to its row.
 * Rows past `max` fold into "5 more · $54", which opens in place. When the data changes, rows glide to their new rank and
 * bars and numbers settle to their new values once.
 *
 * ```tsx
 * <BreakdownList title="Cost by model" unit="this week" format="currency"
 *   items={[{ id: "nova", label: "Nova 2 Pro", value: 612 }, { id: "sage", label: "Sage Mini", value: 198 }]}
 *   limit={{ value: 1500, label: "budget" }} />
 *
 * // A context window: `total` is the window, so the unused space is an empty remainder.
 * <BreakdownList title="Context window" format="tokens" total={200_000} unit="of 200k tokens" shareOf="the window"
 *   limit={{ value: 160_000, label: "compaction point" }} items={parts} />
 * ```
 *
 * Keyboard: the list is one Tab stop; arrow keys move between rows (and the fold), Home and End jump, Enter or Space
 * opens the fold or calls `onSelect`, Escape clears the highlight or closes the fold.
 */

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type BreakdownItem = {
  /** Stable id, used to glide the row when the ranking changes. */
  id: string
  /** The part, e.g. "Nova 2 Pro" or "Tool results". */
  label: string
  /** Its value, in the unit `format` describes. Negative values count as zero. */
  value: number
  /** A short muted note after the label, e.g. "long contexts". */
  note?: string
}

/**
 * How values are written. `currency` uses `currency` (whole units once the total reaches 100), `tokens` writes
 * 820, 8.4k, 142k, 1.2M, `percent` treats values as percentage points (42 → "42%"). Or pass your own function.
 */
export type BreakdownFormat = "number" | "currency" | "percent" | "tokens" | ((value: number) => string)

export type BreakdownLimit = {
  /** Where the marker sits, in the same unit as the values. */
  value: number
  /** A noun for it, used on the marker ("Budget $1,500") and in the sentence ("$392 under the $1,500 budget"). Default "limit". */
  label?: string
}

export type BreakdownListProps = {
  /** The parts. Default: Harbor & Finch's model costs this week. */
  items?: BreakdownItem[]
  /** Default "number" (the built-in data uses "currency"). */
  format?: BreakdownFormat
  /** ISO currency code for `format="currency"`. Default "USD". */
  currency?: string
  /** Line above the total, e.g. "Cost by model". */
  title?: string
  /** Words after the total, e.g. "this week" or "of 200k tokens". */
  unit?: string
  /** What the parts are a share of. Default: their sum. Set it higher (a context window) to leave the rest empty. */
  total?: number
  /** How a share is named in sentences. Default "the total"; "the window" reads better with `total`. */
  shareOf?: string
  /** A marker on the bar. Past it, only the overrun turns the destructive tone. */
  limit?: BreakdownLimit
  /** Row order. Default "desc" (largest first); "none" keeps the order given. */
  sort?: "desc" | "asc" | "none"
  /** Rows shown before the rest fold into "n more". Default 5. Folding needs at least two hidden rows. */
  max?: number
  /** Makes each row a button. Called with the row's item on click, Enter or Space. */
  onSelect?: (item: BreakdownItem) => void
  /** Replaces the sentence under the total while nothing is pointed at. */
  summary?: React.ReactNode
  /** Slot at the right of the title row: a period switch, a menu. */
  actions?: React.ReactNode
  /** Shown when there are no items. Default "Nothing to break down yet". */
  emptyText?: string
  /** Accessible name of the piece. Default: `title`. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.bkl {
  --bkl-ink: #000;
  --bkl-surface: #fff;
  --bkl-accent: #0060e2;
  --bkl-bad: #d92d20;
  --bkl-t1: color-mix(in oklab, var(--bkl-ink) 88%, transparent);
  --bkl-t2: color-mix(in oklab, var(--bkl-ink) 61%, transparent);
  --bkl-t3: color-mix(in oklab, var(--bkl-ink) 45%, transparent);
  --bkl-t4: color-mix(in oklab, var(--bkl-ink) 27%, transparent);
  --bkl-fill: color-mix(in oklab, var(--bkl-ink) 6%, transparent);
  --bkl-hov: color-mix(in oklab, var(--bkl-ink) 3.5%, transparent);
  --bkl-line: color-mix(in oklab, var(--bkl-ink) 6%, transparent);
  --bkl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --bkl-ease: cubic-bezier(.22, 1, .36, 1);
  --bkl-r: 22px;
  position: relative; container-type: inline-size; width: 100%; max-width: 480px;
  font: 13px/20px var(--bkl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--bkl-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .bkl {
  --bkl-ink: #fff;
  --bkl-surface: #1c1c1e;
  --bkl-accent: #4d8dff;
  --bkl-bad: #ff6a5f;
  --bkl-t1: color-mix(in oklab, var(--bkl-ink) 90%, transparent);
  --bkl-t2: color-mix(in oklab, var(--bkl-ink) 62%, transparent);
  --bkl-t3: color-mix(in oklab, var(--bkl-ink) 46%, transparent);
  --bkl-t4: color-mix(in oklab, var(--bkl-ink) 28%, transparent);
  --bkl-fill: color-mix(in oklab, var(--bkl-ink) 8%, transparent);
  --bkl-hov: color-mix(in oklab, var(--bkl-ink) 5%, transparent);
  --bkl-line: color-mix(in oklab, var(--bkl-ink) 9%, transparent);
  --bkl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}

/* Mono: ink on paper, square corners, a monospaced face, and the overrun drawn as hatching instead of a colour */
html[data-style="mono"] .bkl {
  --bkl-ink: #000; --bkl-surface: #fff; --bkl-accent: #111; --bkl-bad: #000; --bkl-r: 8px;
  --bkl-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --bkl-ease: cubic-bezier(.2, .9, .1, 1); --bkl-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .bkl { --bkl-ink: #fff; --bkl-surface: #0a0a0a; --bkl-accent: #f2f2f2; --bkl-bad: #fff; --bkl-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .bkl-big { font-size: clamp(28px, 9cqw, 36px); letter-spacing: -.02em; font-weight: 500 }
html[data-style="mono"] .bkl-unit { font-size: 13px }
html[data-style="mono"] .bkl-bar, html[data-style="mono"] .bkl-seg, html[data-style="mono"] .bkl-track { --bkl-rr: 0px }
html[data-style="mono"] .bkl-row { border-radius: 4px }
html[data-style="mono"] .bkl-label { font-size: 13px }
html[data-style="mono"] .bkl-over .bkl-seg {
  background: repeating-linear-gradient(-45deg, var(--bkl-ink) 0 1.5px, transparent 1.5px 4px);
}
html[data-style="mono"] .bkl-bad-t { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .22em }

/* Glass: the card carries the frost, the bar and rows sit on it in the Pane glass inks */
html[data-style="glass"] .bkl {
  --bkl-ink: var(--pane-ink); --bkl-surface: var(--pane-solid); --bkl-accent: var(--pane-accent); --bkl-shadow: var(--pane-shadow);
  --bkl-ease: var(--pane-ease); --bkl-font: var(--pane-font);
  --bkl-t1: var(--pane-t1); --bkl-t2: var(--pane-t2); --bkl-t3: var(--pane-t3); --bkl-t4: var(--pane-t4);
  --bkl-fill: color-mix(in oklab, var(--pane-ink) 10%, transparent);
  --bkl-line: color-mix(in oklab, var(--pane-ink) 10%, transparent);
  --bkl-hov: color-mix(in oklab, var(--pane-ink) 5%, transparent);
  --bkl-r: 26px;
}
html[data-style="glass"] .bkl-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .bkl-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .bkl-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .bkl-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .bkl-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .bkl-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.bkl *, .bkl *::before, .bkl *::after { box-sizing: border-box }
:where(.bkl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.bkl) p, :where(.bkl) h3, :where(.bkl) ol, :where(.bkl) li { margin: 0; padding: 0 }
.bkl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.bkl-card { --bkl-pad: 24px; padding: 20px var(--bkl-pad) 12px; border-radius: var(--bkl-r); background: var(--bkl-surface); box-shadow: var(--bkl-shadow) }

/* Title row and the total */
.bkl-head { display: flex; align-items: center; justify-content: space-between; gap: 8px 12px; flex-wrap: wrap; min-height: 28px }
.bkl-title { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--bkl-t2) }
.bkl-total { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: 9px; margin-top: 8px }
.bkl-big {
  font-size: clamp(34px, 11cqw, 44px); line-height: 1.08; font-weight: 500; letter-spacing: -.03em;
  font-variant-numeric: tabular-nums; color: var(--bkl-t1);
}
.bkl-unit { font-size: 15px; line-height: 20px; color: var(--bkl-t3) }

/* The sentence under the total. Every sentence it can say is laid out invisibly in the same cell, so it is as tall as the longest and nothing below moves. */
.bkl-say { display: grid; margin-top: 6px; font-size: 14px; line-height: 20px; color: var(--bkl-t2); text-wrap: pretty }
.bkl-say > * { grid-area: 1 / 1 }
.bkl-ghost { visibility: hidden; pointer-events: none; user-select: none }
.bkl-say b { font-weight: 500; color: var(--bkl-t1) }
.bkl-in { animation: bkl-say .34s var(--bkl-ease) backwards }
@keyframes bkl-say { from { opacity: 0; filter: blur(4px); transform: translateY(2px) } }
.bkl-bad-t { color: var(--bkl-bad); font-weight: 500 }
.bkl-num { font-variant-numeric: tabular-nums }

/* The share bar: segments are full-width layers cut to their span with clip-path, so a new share is a transition, not a relayout */
.bkl-meter { position: relative; margin-top: 18px; padding-bottom: 6px; overflow: clip }
.bkl-meter[data-lim] { padding-top: 24px }
.bkl-bar { --bkl-rr: 2px; position: relative; height: 8px }
.bkl-track, .bkl-seg, .bkl-over { position: absolute; inset: 0 }
.bkl-track { background: var(--bkl-fill); clip-path: inset(0 0 0 calc(var(--u) * 100% + 2px) round var(--bkl-rr)); transition: clip-path .7s var(--bkl-ease) }
.bkl-seg {
  background-color: color-mix(in oklab, var(--bkl-ink) calc(var(--a) * 100%), transparent);
  clip-path: inset(0 calc((1 - var(--e)) * 100% + var(--gr)) 0 calc(var(--s) * 100% + var(--gl)) round var(--bkl-rr));
  transition: clip-path .7s var(--bkl-ease), background-color .2s var(--bkl-ease), opacity .2s var(--bkl-ease);
  animation: bkl-grow .9s var(--bkl-ease) backwards;
}
@keyframes bkl-grow { from { clip-path: inset(0 100% 0 0 round var(--bkl-rr)) } }
.bkl-over { clip-path: inset(-2px 0 -2px calc(var(--l) * 100%)); transition: clip-path .7s var(--bkl-ease); pointer-events: none }
.bkl-over .bkl-seg { background-color: var(--bkl-bad) }
.bkl-card[data-hot] .bkl-seg:not([data-on]) { opacity: .32 }
.bkl-card[data-hot] .bkl-base .bkl-seg[data-on] { background-color: var(--bkl-accent) }
/* the limit: a hairline tick through the bar with its label to one side */
.bkl-mark { position: absolute; left: 0; right: 0; top: 0; bottom: 0; transform: translateX(calc(var(--l) * 100%)); transition: transform .7s var(--bkl-ease); pointer-events: none }
.bkl-mark::before { content: ""; position: absolute; left: -1.5px; top: 4px; bottom: 0; width: 1.5px; border-radius: 1px; background: var(--bkl-t1) }
.bkl-mark span {
  position: absolute; top: 0; left: 0; padding: 0 8px; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--bkl-t2);
  font-variant-numeric: tabular-nums;
}
.bkl-mark[data-side="l"] span { transform: translateX(-100%) }
.bkl-hit { position: absolute; top: -8px; bottom: -6px }
.bkl-hit[data-go] { cursor: pointer }

/* The ranked rows */
.bkl-list { position: relative; list-style: none; margin: 14px -12px 0 }
.bkl-li { position: relative }
.bkl-row {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto 3.4em; align-items: baseline; column-gap: 14px; row-gap: 7px;
  width: 100%; padding: 9px 12px 11px; border-radius: 12px; outline: none; touch-action: manipulation;
  transition: background-color .2s var(--bkl-ease), opacity .2s var(--bkl-ease);
}
@media (hover: hover) { .bkl-row:hover { background: var(--bkl-hov) } }
.bkl-row:focus-visible { outline: 2px solid var(--bkl-accent); outline-offset: -2px }
.bkl-card[data-hot] .bkl-li:not([data-on]) .bkl-row { opacity: .42 }
.bkl-name { display: flex; align-items: baseline; gap: 8px; min-width: 0; white-space: nowrap }
.bkl-label { flex: none; max-width: 100%; overflow: hidden; text-overflow: ellipsis; font-size: 14px; font-weight: 500; color: var(--bkl-t1) }
.bkl-note { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 12.5px; color: var(--bkl-t3) }
.bkl-val { font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; color: var(--bkl-t1) }
.bkl-pct { font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; color: var(--bkl-t3) }
.bkl-rbar { grid-column: 1 / -1; position: relative; height: 2px; border-radius: 1px }
.bkl-rbar::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background-color: color-mix(in oklab, var(--bkl-ink) calc(var(--a) * 100%), transparent);
  transform: scaleX(var(--w)); transform-origin: left; transition: transform .7s var(--bkl-ease), background-color .2s var(--bkl-ease);
  animation: bkl-bar .9s var(--bkl-ease) backwards;
}
@keyframes bkl-bar { from { transform: scaleX(0) } }
.bkl-li[data-on] .bkl-rbar::before { background-color: var(--bkl-accent) }

/* The fold: "5 more" with its sum, or "Show fewer" once open */
.bkl-fold .bkl-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 400; color: var(--bkl-t2) }
.bkl-fold .bkl-val { font-weight: 400; color: var(--bkl-t2) }
.bkl-chev { flex: none; color: var(--bkl-t3); transition: transform .3s var(--bkl-ease) }
.bkl-fold[aria-expanded="true"] .bkl-chev { transform: rotate(180deg) }
.bkl-fold[aria-expanded="true"] .bkl-label { color: var(--bkl-t3) }
.bkl-fold[aria-expanded="true"] { padding-bottom: 9px }

.bkl-empty { padding: 18px 0 14px; color: var(--bkl-t3) }

@container (max-width: 400px) {
  .bkl-card { --bkl-pad: 20px; padding-top: 18px }
  .bkl-row { column-gap: 10px; grid-template-columns: minmax(0, 1fr) auto 3em }
  .bkl-note { display: none }
}
@media (prefers-reduced-motion: reduce) {
  .bkl *, .bkl *::before, .bkl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_ITEMS: BreakdownItem[] = [
  { id: "nova-pro", label: "Nova 2 Pro", value: 612, note: "long contexts" },
  { id: "sage-mini", label: "Sage Mini", value: 198, note: "triage" },
  { id: "nova-flash", label: "Nova 2 Flash", value: 121 },
  { id: "lumen", label: "Lumen Code", value: 83, note: "Atlas refactors" },
  { id: "embed", label: "Atlas Embed", value: 40 },
  { id: "orca", label: "Orca Vision", value: 22 },
  { id: "rerank", label: "Sage Rerank", value: 14 },
  { id: "audio", label: "Nova Audio", value: 9 },
  { id: "tern", label: "Tern Tiny", value: 6 },
  { id: "quill", label: "Quill Draft", value: 3 },
]

/** Ink alpha per rank: the largest part is darkest, the tail fades. */
const TONES = [0.8, 0.58, 0.42, 0.31, 0.23, 0.17, 0.13]
const tone = (rank: number) => TONES[Math.min(rank, TONES.length - 1)]
const MORE = "__more"
const SETTLE_MS = 640
const EASE = "cubic-bezier(.22, 1, .36, 1)"
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

const trim = (s: string) => s.replace(/\.0$/, "")

function makeFormat(format: BreakdownFormat, currency: string, scale: number): (n: number) => string {
  if (typeof format === "function") return format
  if (format === "tokens") {
    return (n) => {
      const a = Math.abs(n)
      if (a < 1000) return String(Math.round(n))
      if (a < 10_000) return `${trim((n / 1000).toFixed(1))}k`
      if (a < 999_500) return `${Math.round(n / 1000)}k`
      return `${trim((n / 1e6).toFixed(1))}M`
    }
  }
  if (format === "percent") {
    return (n) => `${trim(n.toFixed(Math.abs(n) < 10 ? 1 : 0))}%`
  }
  if (format === "currency") {
    const d = scale >= 100 ? 0 : 2
    const nf = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: d })
    return (n) => nf.format(n)
  }
  const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: scale >= 100 ? 0 : 1 })
  return (n) => nf.format(n)
}

const pct = (share: number) => (share > 0 && share < 0.005 ? "<1%" : `${Math.round(share * 100)}%`)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Part = { key: string; label: string; value: number; note?: string; rank: number; item?: BreakdownItem }
type Seg = Part & { s: number; e: number }

/* -------------------------------------------------------------------------- */
/*                                BreakdownList                               */
/* -------------------------------------------------------------------------- */

export function BreakdownList(props: BreakdownListProps) {
  const bare = props.items === undefined
  const {
    items = DEFAULT_ITEMS,
    format = bare ? "currency" : "number",
    currency = "USD",
    title = bare ? "Cost by model" : undefined,
    unit = bare ? "this week" : undefined,
    total,
    shareOf = "the total",
    limit = bare ? { value: 1500, label: "budget" } : undefined,
    sort = "desc",
    max = 5,
    onSelect,
    summary,
    actions,
    emptyText = "Nothing to break down yet",
    label,
    className,
  } = props

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  const rootRef = React.useRef<HTMLElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const [hoverKey, setHoverKey] = React.useState<string | null>(null)
  const [focusKey, setFocusKey] = React.useState<string | null>(null)
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const focusAfter = React.useRef<string | null>(null)

  /* ---- the numbers ---- */
  const clean = items.map((it) => ({ ...it, value: Math.max(0, Number.isFinite(it.value) ? it.value : 0) }))
  const byValue = [...clean].sort((a, b) => b.value - a.value)
  const rankOf = new Map(byValue.map((it, i) => [it.id, i]))
  const ordered = sort === "none" ? clean : sort === "asc" ? [...byValue].reverse() : byValue
  const used = clean.reduce((s, it) => s + it.value, 0)
  const base = total !== undefined && total > 0 ? total : used
  const scale = Math.max(used, total ?? 0, limit?.value ?? 0) || 1
  const fmt = makeFormat(format, currency, Math.max(used, total ?? 0))
  const share = (v: number) => (base > 0 ? v / base : 0)
  const largest = byValue[0]?.value || 1
  const limitNoun = limit?.label ?? "limit"
  const over = limit && used > limit.value ? used - limit.value : 0

  const foldable = ordered.length - max >= 2
  const visible = foldable && !open ? ordered.slice(0, max) : ordered
  const folded = foldable ? ordered.slice(max) : []
  const foldValue = folded.reduce((s, it) => s + it.value, 0)
  const foldRank = folded.length ? Math.min(...folded.map((it) => rankOf.get(it.id) ?? 0)) : 0

  const toPart = (it: BreakdownItem): Part => ({ key: it.id, label: it.label, value: it.value, note: it.note, rank: rankOf.get(it.id) ?? 0, item: it })
  const morePart: Part | null = foldable ? { key: MORE, label: `${folded.length} more`, value: foldValue, rank: foldRank } : null
  const parts: Part[] = [...visible.map(toPart), ...(morePart && !open ? [morePart] : [])]

  let acc = 0
  const segs: Seg[] = parts.map((p) => {
    const s = acc / scale
    acc += p.value
    return { ...p, s, e: acc / scale }
  })
  const u = used / scale
  const l = limit ? limit.value / scale : 1

  /* ---- what is pointed at ---- */
  const keys = new Set(parts.map((p) => p.key))
  const activeRaw = hoverKey ?? focusKey
  const active = activeRaw && keys.has(activeRaw) ? activeRaw : null
  const activePart = active ? parts.find((p) => p.key === active) : undefined

  /* ---- sentences ---- */
  const leader = byValue[0]
  const say = (p: Part) => (
    <>
      <b>{p.label}</b>: <span className="bkl-num">{fmt(p.value)}</span>, {pct(share(p.value))} of {shareOf}
    </>
  )
  const sayText = (p: Part) => `${p.label}: ${fmt(p.value)}, ${pct(share(p.value))} of ${shareOf}`
  const leadNode = leader ? (
    <>
      {leader.label} leads at {pct(share(leader.value))}.
    </>
  ) : null
  const limitNode = limit ? (
    over > 0 ? (
      <>
        <span className="bkl-bad-t bkl-num">{fmt(over)} over</span> the {fmt(limit.value)} {limitNoun}.
      </>
    ) : (
      <>
        <span className="bkl-num">{fmt(limit.value - used)}</span> under the {fmt(limit.value)} {limitNoun}.
      </>
    )
  ) : total !== undefined && total > used ? (
    <>
      <span className="bkl-num">{fmt(total - used)}</span> unused.
    </>
  ) : null
  const defaultSay =
    summary ??
    (clean.length === 0 ? (
      emptyText
    ) : over > 0 ? (
      <>
        {limitNode} {leadNode}
      </>
    ) : (
      <>
        {leadNode} {limitNode}
      </>
    ))

  const barText = [
    `${title ? `${title}: ` : ""}${fmt(used)}${unit ? ` ${unit}` : ""}.`,
    parts.map((p) => `${p.label} ${pct(share(p.value))}`).join(", ") + ".",
    limit ? `${cap(limitNoun)} ${fmt(limit.value)}${over > 0 ? `, ${fmt(over)} over` : `, ${fmt(limit.value - used)} under`}.` : "",
    total !== undefined && total > used ? `${fmt(total - used)} unused.` : "",
  ]
    .filter(Boolean)
    .join(" ")

  /* ---- numbers settle: one rAF loop writes text nodes; React always renders the final value ---- */
  const shown = React.useRef(new Map<string, number>())
  const first = React.useRef(true)
  const fmtRef = React.useRef(fmt)
  React.useLayoutEffect(() => {
    fmtRef.current = fmt
  })
  const tweenSig = JSON.stringify([used, parts.map((p) => [p.key, p.value]), base])
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const jobs: { node: HTMLElement; key: string; from: number; to: number; kind: string }[] = []
    root.querySelectorAll<HTMLElement>("[data-tw]").forEach((node) => {
      const key = node.dataset.tw!
      const to = Number(node.dataset.to)
      const from = shown.current.get(key) ?? (first.current ? 0 : to)
      if (!reduce && from !== to) jobs.push({ node, key, from, to, kind: node.dataset.k ?? "v" })
      else shown.current.set(key, to)
    })
    first.current = false
    if (!jobs.length) return
    const write = (p: number) => {
      for (const j of jobs) {
        const v = j.from + (j.to - j.from) * p
        shown.current.set(j.key, v)
        j.node.textContent = j.kind === "p" ? pct(v) : fmtRef.current(v)
      }
    }
    write(0)
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / SETTLE_MS)
      write(easeOut(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // if frames never arrive (a throttled tab, a screenshot) the final numbers land anyway
    const fallback = window.setTimeout(() => write(1), SETTLE_MS + 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [tweenSig, reduce])

  /* ---- rows glide to their new rank (FLIP), the list height glides when the fold opens ---- */
  const orderSig = parts.map((p) => p.key).join("|") + (open ? "+" : "-")
  const tops = React.useRef(new Map<string, number>())
  const listH = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-row]"))
    const next = new Map<string, number>()
    rows.forEach((el) => next.set(el.dataset.row!, el.offsetTop))
    const h = list.offsetHeight
    const had = tops.current.size > 0
    if (!reduce && had) {
      let fresh = 0
      rows.forEach((el) => {
        const id = el.dataset.row!
        const before = tops.current.get(id)
        const after = next.get(id)!
        el.getAnimations().forEach((a) => a.cancel())
        if (before === undefined) {
          el.animate(
            [{ opacity: 0, transform: "translateY(4px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
            { duration: 420, delay: 40 * fresh++, easing: EASE, fill: "backwards" },
          )
        } else if (before !== after) {
          el.animate([{ transform: `translateY(${before - after}px)` }, { transform: "none" }], { duration: 560, easing: EASE })
        }
      })
      if (listH.current !== null && listH.current !== h) {
        list.style.overflow = "hidden"
        const a = list.animate([{ height: `${listH.current}px` }, { height: `${h}px` }], { duration: 420, easing: EASE })
        a.onfinish = a.oncancel = () => {
          list.style.overflow = ""
        }
      }
    }
    tops.current = next
    listH.current = h
    if (focusAfter.current) {
      list.querySelector<HTMLElement>(`[data-key="${cssEscape(focusAfter.current)}"]`)?.focus()
      focusAfter.current = null
    }
  }, [orderSig, reduce])

  /* ---- keyboard: one Tab stop, arrows move ---- */
  const navKeys = [...visible.map((it) => it.id), ...(foldable ? [MORE] : [])]
  const stop = cursor && navKeys.includes(cursor) ? cursor : navKeys[0]

  const onKeyDown = (e: React.KeyboardEvent<HTMLOListElement>) => {
    const list = listRef.current
    if (!list) return
    const nav = Array.from(list.querySelectorAll<HTMLElement>("[data-key]"))
    const i = nav.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    let j = -1
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = Math.min(nav.length - 1, i + 1)
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = Math.max(0, i - 1)
    else if (e.key === "Home") j = 0
    else if (e.key === "End") j = nav.length - 1
    else if (e.key === "Escape") {
      const inFold = open && folded.some((it) => it.id === nav[i].dataset.key)
      if (open && (inFold || nav[i].dataset.key === MORE)) {
        e.preventDefault()
        focusAfter.current = MORE
        setOpen(false)
      } else if (focusKey) {
        e.preventDefault()
        setFocusKey(null)
      }
      return
    }
    if (j >= 0) {
      e.preventDefault()
      nav[j].focus()
    }
  }

  const pointTo = (key: string) => (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") setHoverKey(key)
  }
  const unpoint = () => setHoverKey(null)
  const focusRow = (key: string) => () => {
    setFocusKey(key)
    setCursor(key)
  }
  const blurRow = (e: React.FocusEvent) => {
    if (!listRef.current?.contains(e.relatedTarget as Node | null)) setFocusKey(null)
  }

  const toggleFold = (e: React.MouseEvent) => {
    const opening = !open
    // keyboard activation (detail 0) moves focus to the first revealed row; a click leaves it where it is
    if (opening && e.detail === 0 && folded[0]) focusAfter.current = folded[0].id
    setOpen(opening)
  }

  const sentenceKey = active ?? "default"

  return (
    <section ref={rootRef} className={cn("bkl", className)} aria-label={label ?? title ?? "Breakdown"}>
      <style href="breakdown-list" precedence="default">
        {CSS}
      </style>
      <div className="bkl-card" data-hot={active ? "" : undefined}>
        {(title || actions) && (
          <div className="bkl-head">
            {title ? <h3 className="bkl-title">{title}</h3> : <span />}
            {actions}
          </div>
        )}

        <p className="bkl-total">
          <span className="bkl-big" data-tw="total" data-to={used}>
            {fmt(used)}
          </span>
          {unit && <span className="bkl-unit">{unit}</span>}
        </p>

        <div className="bkl-say">
          <span className="bkl-ghost" aria-hidden="true">
            {defaultSay}
          </span>
          {parts.map((p) => (
            <span key={p.key} className="bkl-ghost" aria-hidden="true">
              {say(p)}
            </span>
          ))}
          <p aria-live="polite">
            <span key={sentenceKey} className="bkl-in" style={{ display: "block" }}>
              {activePart ? say(activePart) : defaultSay}
            </span>
          </p>
        </div>

        {clean.length > 0 && (
          <div className="bkl-meter" data-lim={limit ? "" : undefined}>
            <div
              className="bkl-bar"
              role="img"
              aria-label={barText}
              style={{ "--u": u, "--l": l } as React.CSSProperties}
              onPointerLeave={unpoint}
            >
              <i className="bkl-track" />
              <div className="bkl-base">
                {segs.map((sg, i) => (
                  <i
                    key={sg.key}
                    className="bkl-seg"
                    data-on={active === sg.key ? "" : undefined}
                    style={
                      {
                        "--s": sg.s,
                        "--e": sg.e,
                        "--a": tone(sg.rank),
                        "--gl": i === 0 ? "0px" : "1px",
                        "--gr": i === segs.length - 1 && sg.e >= 0.999 ? "0px" : "1px",
                        animationDelay: `${i * 30}ms`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              {limit && (
                <div className="bkl-over">
                  {segs.map((sg, i) => (
                    <i
                      key={sg.key}
                      className="bkl-seg"
                      data-on={active === sg.key ? "" : undefined}
                      style={
                        {
                          "--s": sg.s,
                          "--e": sg.e,
                          "--a": 1,
                          "--gl": i === 0 ? "0px" : "1px",
                          "--gr": i === segs.length - 1 && sg.e >= 0.999 ? "0px" : "1px",
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
              {segs.map((sg) => (
                <div
                  key={sg.key}
                  className="bkl-hit"
                  data-go=""
                  style={{ left: `${sg.s * 100}%`, width: `${(sg.e - sg.s) * 100}%` }}
                  onPointerEnter={pointTo(sg.key)}
                  onClick={() => listRef.current?.querySelector<HTMLElement>(`[data-key="${cssEscape(sg.key)}"]`)?.focus()}
                />
              ))}
            </div>
            {limit && (
              <div className="bkl-mark" data-side={l > 0.5 ? "l" : "r"} style={{ "--l": l } as React.CSSProperties} aria-hidden="true">
                <span>
                  {cap(limitNoun)} {fmt(limit.value)}
                </span>
              </div>
            )}
          </div>
        )}

        {clean.length === 0 ? (
          <p className="bkl-empty">{emptyText}</p>
        ) : (
          <ol ref={listRef} className="bkl-list" aria-label={title ? `${title}, ranked` : "Ranked parts"} onKeyDown={onKeyDown}>
            {visible.map((it) => {
              const p = toPart(it)
              const on = active === p.key
              const inner = (
                <>
                  <span className="bkl-name" aria-hidden="true">
                    <span className="bkl-label">{p.label}</span>
                    {p.note && <span className="bkl-note">{p.note}</span>}
                  </span>
                  <span className="bkl-val" aria-hidden="true" data-tw={`v:${p.key}`} data-to={p.value}>
                    {fmt(p.value)}
                  </span>
                  <span className="bkl-pct" aria-hidden="true" data-tw={`p:${p.key}`} data-to={share(p.value)} data-k="p">
                    {pct(share(p.value))}
                  </span>
                  <span className="bkl-rbar" aria-hidden="true" style={{ "--w": p.value / largest, "--a": Math.max(0.2, tone(p.rank)) } as React.CSSProperties} />
                  <span className="bkl-sr">
                    {sayText(p)}
                    {p.note ? `. ${p.note}` : ""}
                  </span>
                </>
              )
              const common = {
                className: "bkl-row",
                "data-key": p.key,
                tabIndex: stop === p.key ? 0 : -1,
                onPointerEnter: pointTo(p.key),
                onPointerLeave: unpoint,
                onFocus: focusRow(p.key),
                onBlur: blurRow,
              }
              return (
                <li key={p.key} className="bkl-li" data-row={p.key} data-on={on ? "" : undefined}>
                  {onSelect ? (
                    <button type="button" {...common} onClick={() => onSelect(it)}>
                      {inner}
                    </button>
                  ) : (
                    <div {...common}>{inner}</div>
                  )}
                </li>
              )
            })}
            {morePart && (
              <li key={MORE} className="bkl-li" data-row={MORE} data-on={active === MORE ? "" : undefined}>
                <button
                  type="button"
                  className="bkl-row bkl-fold"
                  data-key={MORE}
                  tabIndex={stop === MORE ? 0 : -1}
                  aria-expanded={open}
                  aria-label={open ? `Show fewer, hide ${folded.length} rows` : `Show ${folded.length} more, ${fmt(foldValue)} together`}
                  onClick={toggleFold}
                  onPointerEnter={open ? undefined : pointTo(MORE)}
                  onPointerLeave={unpoint}
                  onFocus={() => {
                    setCursor(MORE)
                    setFocusKey(open ? null : MORE)
                  }}
                  onBlur={blurRow}
                >
                  <span className="bkl-name" aria-hidden="true">
                    <span className="bkl-label">
                      {open ? "Show fewer" : morePart.label}
                      <ChevronDown className="bkl-chev" size={14} strokeWidth={1.75} />
                    </span>
                  </span>
                  {!open && (
                    <>
                      <span className="bkl-val" aria-hidden="true" data-tw={`v:${MORE}`} data-to={foldValue}>
                        {fmt(foldValue)}
                      </span>
                      <span className="bkl-pct" aria-hidden="true" data-tw={`p:${MORE}`} data-to={share(foldValue)} data-k="p">
                        {pct(share(foldValue))}
                      </span>
                      <span className="bkl-rbar" aria-hidden="true" style={{ "--w": foldValue / largest, "--a": Math.max(0.2, tone(foldRank)) } as React.CSSProperties} />
                    </>
                  )}
                </button>
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  )
}

function cssEscape(s: string) {
  return typeof globalThis.CSS?.escape === "function" ? globalThis.CSS.escape(s) : s.replace(/["\\]/g, "\\$&")
}
