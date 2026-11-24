"use client"

import * as React from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** A ready-made range in the first list. `days` counts back from today; `period` means "this month / quarter / year so far". */
export type RangeBarPreset = {
  /** Stable id used by `value.range.preset`, e.g. "7d". */
  id: string
  /** The words the sentence starts with, e.g. "Last 7 days". */
  label: string
  /** Number of days, ending today (or `offset` days before today). Default 7. Ignored when `period` is set. */
  days?: number
  /** End this many days before today, e.g. 1 for "Yesterday". Default 0. */
  offset?: number
  /** This month, quarter or year so far. Comparing with the previous period then means the same days one period back. */
  period?: "month" | "quarter" | "year"
}

export type RangeBarFacetOption = { id: string; label: string }

/** One filter at the end of the sentence, e.g. "for all models". */
export type RangeBarFacet = {
  /** Key in `value.filters`, e.g. "model". */
  id: string
  /** What the filter is called, for screen readers and the list, e.g. "Models". */
  name: string
  /** Word in front of the phrase. Default "for". */
  lead?: string
  /** Phrase when nothing is picked, e.g. "all models". */
  all: string
  options: RangeBarFacetOption[]
}

/** A date is a `Date` (its local day is used) or an ISO day, "2026-11-03". */
export type RangeBarDate = Date | string
export type RangeBarRange = { preset: string } | { from: RangeBarDate; to: RangeBarDate }
export type RangeBarCompare = "previous" | "year" | "none"

export type RangeBarValue = {
  range: RangeBarRange
  compare: RangeBarCompare
  /** Picked option ids per facet. Missing or empty means all. */
  filters?: Record<string, string[]>
}

/** What a value means in days. Dates are local midnight; `to` is the last day included. */
export type RangeBarResolved = {
  from: Date
  to: Date
  fromISO: string
  toISO: string
  days: number
  compare: { from: Date; to: Date; fromISO: string; toISO: string } | null
  filters: Record<string, string[]>
  /** The sentence as it reads, e.g. "Last 7 days compared with the 7 before, for all models". */
  sentence: string
}

export type RangeBarProps = {
  /** Controlled value. */
  value?: RangeBarValue
  /** Starting value when uncontrolled. Default: last 7 days, compared with the 7 before, no filters. */
  defaultValue?: RangeBarValue
  /** Called on every change with the new value and the dates it resolves to. */
  onChange?: (value: RangeBarValue, resolved: RangeBarResolved) => void
  /** The ready-made ranges. Default: Today, Last 7, 30 and 90 days, This month, This year. */
  presets?: RangeBarPreset[]
  /** The filters at the end of the sentence (one or two read best). Default: models. Pass [] for none. */
  facets?: RangeBarFacet[]
  /** Which day is today. Default: the visitor's today. */
  today?: RangeBarDate
  /** First day of the week in the calendar, 0 = Sunday. Default 1 (Monday). */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Earliest day that can be shown. Default: none. */
  min?: RangeBarDate
  /** Latest day that can be shown. Default: today. */
  max?: RangeBarDate
  /** Locale for month and weekday names. Default "en-US". */
  locale?: string
  /** Small line above the sentence. Pass "" to hide it. Default "Harbor & Finch · API usage". */
  context?: string
  /** Name of the group for screen readers. Default "Dashboard range". */
  label?: string
  /** A readout under the sentence, e.g. the headline number it filters. A `<b>` inside is set as the big figure. Re-key it to cross-blur on change. */
  children?: React.ReactNode
  /** Stable name an agent uses for this piece (see docs/agent-operable.md). Default: "range-bar-<n>" in mount order. */
  agentId?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rbar {
  --rbar-ink: #000;
  --rbar-surface: #fff;
  --rbar-raise: #fff;
  --rbar-accent: #0060e2;
  --rbar-on: #fff;
  --rbar-t1: color-mix(in oklab, var(--rbar-ink) 88%, transparent);
  --rbar-t2: color-mix(in oklab, var(--rbar-ink) 61%, transparent);
  --rbar-t3: color-mix(in oklab, var(--rbar-ink) 45%, transparent);
  --rbar-t4: color-mix(in oklab, var(--rbar-ink) 27%, transparent);
  --rbar-fill: color-mix(in oklab, var(--rbar-ink) 6%, transparent);
  --rbar-hover: color-mix(in oklab, var(--rbar-ink) 7%, transparent);
  --rbar-line: color-mix(in oklab, var(--rbar-ink) 8%, transparent);
  --rbar-band: color-mix(in oklab, var(--rbar-accent) 11%, transparent);
  --rbar-pre: color-mix(in oklab, var(--rbar-accent) 7%, transparent);
  --rbar-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 40px -16px rgb(0 0 0 / .1);
  --rbar-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .08), 0 18px 40px -12px rgb(0 0 0 / .22);
  --rbar-ease: cubic-bezier(.22, 1, .36, 1);
  --rbar-r: 24px; --rbar-pr: 14px; --rbar-dr: 10px;
  --rbar-fs: calc(clamp(22px, 4.4cqw + 6px, 34px) * var(--rbar-scale, 1));
  position: relative; container-type: inline-size; width: 100%; max-width: 760px;
  font: 13px/20px var(--rbar-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--rbar-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .rbar {
  --rbar-ink: #fff;
  --rbar-surface: #1c1c1e;
  --rbar-raise: #27272b;
  --rbar-accent: #4d8dff;
  --rbar-t1: color-mix(in oklab, var(--rbar-ink) 90%, transparent);
  --rbar-t2: color-mix(in oklab, var(--rbar-ink) 62%, transparent);
  --rbar-t3: color-mix(in oklab, var(--rbar-ink) 46%, transparent);
  --rbar-t4: color-mix(in oklab, var(--rbar-ink) 28%, transparent);
  --rbar-fill: color-mix(in oklab, var(--rbar-ink) 8%, transparent);
  --rbar-hover: color-mix(in oklab, var(--rbar-ink) 9%, transparent);
  --rbar-line: color-mix(in oklab, var(--rbar-ink) 10%, transparent);
  --rbar-band: color-mix(in oklab, var(--rbar-accent) 22%, transparent);
  --rbar-pre: color-mix(in oklab, var(--rbar-accent) 14%, transparent);
  --rbar-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 40px -16px rgb(0 0 0 / .5);
  --rbar-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 6px -2px rgb(0 0 0 / .4), 0 20px 44px -12px rgb(0 0 0 / .7);
}

/* Mono: ink on paper, hairlines, Geist Mono; the open phrase is underlined in ink because the accent is ink */
html[data-style="mono"] .rbar {
  --rbar-ink: #000; --rbar-surface: #fff; --rbar-raise: #fff; --rbar-accent: #111; --rbar-on: #fff;
  --rbar-band: color-mix(in oklab, #000 7%, transparent); --rbar-pre: color-mix(in oklab, #000 4%, transparent);
  --rbar-shadow: 0 0 0 1px rgb(0 0 0 / .14); --rbar-pop: 0 0 0 1px rgb(0 0 0 / .16), 0 12px 28px -14px rgb(0 0 0 / .18);
  --rbar-ease: cubic-bezier(.2, .9, .1, 1); --rbar-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --rbar-r: 8px; --rbar-pr: 6px; --rbar-dr: 4px; --rbar-ls: -.02em; --rbar-scale: .8;
}
html[data-style="mono"].dark .rbar {
  --rbar-ink: #fff; --rbar-surface: #0a0a0a; --rbar-raise: #111; --rbar-accent: #f2f2f2; --rbar-on: #000;
  --rbar-band: color-mix(in oklab, #fff 11%, transparent); --rbar-pre: color-mix(in oklab, #fff 6%, transparent);
  --rbar-shadow: 0 0 0 1px rgb(255 255 255 / .16); --rbar-pop: 0 0 0 1px rgb(255 255 255 / .18), 0 16px 36px -14px rgb(0 0 0 / .8);
}

/* Glass: the card carries the frost; the open list floats over it near-opaque, as a nested panel should */
html[data-style="glass"] .rbar {
  --rbar-ink: var(--pane-ink); --rbar-surface: var(--pane-solid); --rbar-raise: var(--pane-solid); --rbar-accent: var(--pane-accent);
  --rbar-shadow: var(--pane-shadow); --rbar-ease: var(--pane-ease); --rbar-font: var(--pane-font);
  --rbar-t1: var(--pane-t1); --rbar-t2: var(--pane-t2); --rbar-t3: var(--pane-t3); --rbar-t4: var(--pane-t4);
}
html[data-style="glass"] .rbar-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .rbar-pop { background-color: var(--pane-tint-over, var(--pane-solid)); box-shadow: var(--pane-pop) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .rbar-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .rbar-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .rbar-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .rbar-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
  html[data-style="glass"] .rbar-pop { -webkit-backdrop-filter: blur(26px) saturate(2.1); backdrop-filter: blur(26px) saturate(2.1) }
  html[data-style="glass"].dark .rbar-pop { -webkit-backdrop-filter: blur(26px) saturate(1.9); backdrop-filter: blur(26px) saturate(1.9) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] :is(.rbar-card, .rbar-pop) { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.rbar *, .rbar *::before, .rbar *::after { box-sizing: border-box }
:where(.rbar) button { font: inherit; color: inherit; letter-spacing: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.rbar) p { margin: 0 }
.rbar-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.rbar-card { --rbar-px: 30px; padding: 24px var(--rbar-px); border-radius: var(--rbar-r); background: var(--rbar-surface); box-shadow: var(--rbar-shadow) }
.rbar-ctx { margin-bottom: 10px; font-size: 13px; line-height: 18px; font-weight: 500; color: var(--rbar-t2) }

/* The sentence. Every word is an inline-block unit so it can glide (FLIP) when the sentence reflows; glue words are muted, the phrases you can change are ink and underlined. */
.rbar-sent {
  position: relative; font-size: var(--rbar-fs); line-height: 1.24; font-weight: 500; letter-spacing: var(--rbar-ls, -.025em);
  color: var(--rbar-t3); text-wrap: pretty;
}
.rbar-u { display: inline-block; white-space: nowrap }
.rbar-c {
  color: var(--rbar-t1); border-radius: 6px;
  text-decoration-line: underline; text-decoration-thickness: max(1.5px, .05em); text-underline-offset: .17em; text-decoration-color: var(--rbar-t4);
  transition: text-decoration-color .2s var(--rbar-ease), opacity .16s var(--rbar-ease);
}
@media (hover: hover) { .rbar-c:hover { text-decoration-color: var(--rbar-t2) } }
.rbar-c[aria-expanded="true"] { text-decoration-color: var(--rbar-accent) }
.rbar-c:active { opacity: .64 }
.rbar-c:focus-visible { outline: 2px solid var(--rbar-accent); outline-offset: 3px }
.rbar-gh { position: absolute; inset: 0; pointer-events: none }
.rbar-ghost { position: absolute; margin: 0 }

/* What the sentence resolves to, in days */
.rbar-dates { margin-top: 14px; font-size: 13px; line-height: 20px; color: var(--rbar-t3); font-variant-numeric: tabular-nums }
.rbar-dates b { font-weight: 500; color: var(--rbar-t2) }
.rbar-tick { display: inline-block; animation: rbar-tick .42s var(--rbar-ease) backwards }
@keyframes rbar-tick { from { opacity: 0; filter: blur(4px); transform: translateY(3px) } }
.rbar-add { color: var(--rbar-t2); border-radius: 4px; text-decoration: underline; text-decoration-color: var(--rbar-t4); text-underline-offset: 3px; transition: color .16s var(--rbar-ease) }
@media (hover: hover) { .rbar-add:hover { color: var(--rbar-t1) } }
.rbar-add:focus-visible { outline: 2px solid var(--rbar-accent); outline-offset: 2px }

/* Readout slot */
.rbar-foot { margin-top: 18px; padding-top: 16px; border-top: .5px solid var(--rbar-line); font-size: 15px; line-height: 26px; color: var(--rbar-t2); font-variant-numeric: tabular-nums }
.rbar-foot :where(b, strong) { margin-right: .12em; font-size: 24px; font-weight: 600; letter-spacing: -.025em; color: var(--rbar-t1) }
.rbar-foot > * { animation: rbar-tick .42s var(--rbar-ease) backwards }

/* Popover: one surface that measures its content and glides between sizes, so the list can become a calendar in place */
.rbar-pop {
  position: absolute; z-index: 40; overflow: hidden; border-radius: var(--rbar-pr);
  background: var(--rbar-raise); box-shadow: var(--rbar-pop); transform-origin: 24px 0;
  animation: rbar-pop .22s var(--rbar-ease) backwards;
}
@keyframes rbar-pop { from { opacity: 0; transform: translateY(-4px) scale(.985) } }
.rbar-pop[data-glide] { transition: left .5s var(--rbar-ease), top .5s var(--rbar-ease), width .42s var(--rbar-ease), height .42s var(--rbar-ease) }
.rbar-pi { position: absolute; left: 0; top: 0; width: max-content; min-width: 248px; padding: 6px }
.rbar-pc { animation: rbar-in .32s var(--rbar-ease) backwards }
@keyframes rbar-in { from { opacity: 0; filter: blur(4px) } }

/* Lists */
.rbar-lb { display: grid; gap: 1px; outline: none }
.rbar-opt {
  position: relative; display: flex; align-items: center; gap: 20px; min-height: 36px; padding: 0 10px 0 12px;
  border-radius: max(4px, calc(var(--rbar-pr) - 6px)); font-size: 14px; line-height: 20px; color: var(--rbar-t1);
  cursor: pointer; user-select: none; white-space: nowrap;
}
.rbar-opt[data-active] { background: var(--rbar-hover) }
.rbar-lb:focus-visible .rbar-opt[data-active] { box-shadow: inset 0 0 0 1.5px var(--rbar-accent) }
.rbar-opt[data-sep] { margin-top: 9px }
.rbar-opt[data-sep]::before { content: ""; position: absolute; left: 12px; right: 10px; top: -5px; border-top: .5px solid var(--rbar-line) }
.rbar-ol { flex: 1 }
.rbar-od { font-size: 13px; color: var(--rbar-t3); font-variant-numeric: tabular-nums }
.rbar-ok { flex: none; width: 16px; height: 16px; margin-right: -2px; color: var(--rbar-t1); visibility: hidden }
.rbar-opt[aria-selected="true"] .rbar-ok { visibility: visible }

/* Calendar */
.rbar-cal { position: relative; padding: 2px 4px 0 }
.rbar-mos { display: flex; gap: 22px }
.rbar-mt { height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; letter-spacing: -.01em; color: var(--rbar-t1) }
.rbar-nav {
  position: absolute; top: 2px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--rbar-dr); color: var(--rbar-t2);
  transition: background-color .16s var(--rbar-ease), color .16s var(--rbar-ease);
}
.rbar-nav[data-side="l"] { left: 4px }
.rbar-nav[data-side="r"] { right: 4px }
@media (hover: hover) { .rbar-nav:hover:not(:disabled) { background: var(--rbar-fill); color: var(--rbar-t1) } }
.rbar-nav:disabled { color: var(--rbar-t4); cursor: default }
.rbar-grid { display: grid; row-gap: 2px }
.rbar-row { display: grid; grid-template-columns: repeat(7, 36px) }
.rbar-wd { height: 28px; display: grid; place-items: center; font-size: 13px; color: var(--rbar-t3) }
.rbar-cell { position: relative; height: 36px }
.rbar-cell[data-band] { background: var(--rbar-band) }
.rbar-cell[data-pre] { background: var(--rbar-pre) }
.rbar-cell[data-l] { border-radius: var(--rbar-dr) 0 0 var(--rbar-dr) }
.rbar-cell[data-r] { border-radius: 0 var(--rbar-dr) var(--rbar-dr) 0 }
.rbar-cell[data-l][data-r] { border-radius: var(--rbar-dr) }
.rbar-day {
  width: 36px; height: 36px; border-radius: var(--rbar-dr); font-size: 14px; font-variant-numeric: tabular-nums; color: var(--rbar-t1);
  transition: background-color .14s var(--rbar-ease), color .14s var(--rbar-ease);
}
@media (hover: hover) { .rbar-day:hover:not([aria-disabled]):not([data-end]) { background: var(--rbar-hover) } }
.rbar-day[data-today] { font-weight: 700; text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 4px }
.rbar-day[data-end] { background: var(--rbar-accent); color: var(--rbar-on); font-weight: 600 }
.rbar-day[data-tip] { box-shadow: inset 0 0 0 1.5px var(--rbar-accent) }
.rbar-day[aria-disabled] { color: var(--rbar-t4); cursor: default }
.rbar-day:focus-visible, .rbar-nav:focus-visible, .rbar-back:focus-visible { outline: 2px solid var(--rbar-accent); outline-offset: 1px; position: relative; z-index: 1 }
.rbar-cf { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px -10px -6px; padding: 10px 14px 12px; border-top: .5px solid var(--rbar-line) }
.rbar-hint { min-width: 0; font-size: 13px; color: var(--rbar-t2); font-variant-numeric: tabular-nums }
.rbar-back { display: inline-flex; align-items: center; gap: 2px; padding: 2px 4px 2px 2px; border-radius: 6px; font-size: 13px; color: var(--rbar-t3); white-space: nowrap; transition: color .16s var(--rbar-ease) }
@media (hover: hover) { .rbar-back:hover { color: var(--rbar-t1) } }

@container (max-width: 520px) {
  .rbar-card { --rbar-px: 20px; padding-top: 20px; padding-bottom: 20px; border-radius: max(8px, calc(var(--rbar-r) - 4px)) }
  .rbar-foot :where(b, strong) { font-size: 22px }
}
@media (prefers-reduced-motion: reduce) {
  .rbar *, .rbar *::before, .rbar *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                     Date maths: whole days, no library                     */
/* -------------------------------------------------------------------------- */

// A day is an integer: days since 1970-01-01 in the proleptic Gregorian calendar. Adding days is adding integers, so
// daylight-saving changes and time zones never shift a range. Months are 0-11 throughout.

const pad = (n: number) => String(n).padStart(2, "0")
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const daysInMonth = (y: number, m: number) => (m === 1 && isLeap(y) ? 29 : LENGTHS[m])

/** Day number of a calendar date (Howard Hinnant's days_from_civil). */
function dayOf(y: number, m: number, d: number) {
  const mm = m + 1
  const yy = mm <= 2 ? y - 1 : y
  const era = Math.floor(yy / 400)
  const yoe = yy - era * 400
  const doy = Math.floor((153 * ((mm + 9) % 12) + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** Calendar date of a day number: [year, month 0-11, day 1-31]. */
function civil(dn: number): [number, number, number] {
  const z = dn + 719468
  const era = Math.floor(z / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1
  const m = mp < 10 ? mp + 2 : mp - 10
  return [yoe + era * 400 + (m <= 1 ? 1 : 0), m, d]
}

/** 0 = Sunday. 1970-01-01 was a Thursday. */
const weekday = (dn: number) => (((dn + 4) % 7) + 7) % 7

/** Same day k months away; a day the target month lacks becomes its last day (Mar 31 - 1 month = Feb 28 or 29). */
function addMonths(dn: number, k: number) {
  const [y, m, d] = civil(dn)
  const t = y * 12 + m + k
  const ny = Math.floor(t / 12)
  const nm = t - ny * 12
  return dayOf(ny, nm, Math.min(d, daysInMonth(ny, nm)))
}

const monthStart = (dn: number) => {
  const [y, m] = civil(dn)
  return dayOf(y, m, 1)
}

function parseDay(v: RangeBarDate | null | undefined): number | null {
  if (v == null) return null
  if (v instanceof Date) return Number.isNaN(+v) ? null : dayOf(v.getFullYear(), v.getMonth(), v.getDate())
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2] - 1
  const d = +m[3]
  if (mo < 0 || mo > 11 || d < 1 || d > daysInMonth(y, mo)) return null
  return dayOf(y, mo, d)
}

const isoOf = (dn: number) => {
  const [y, m, d] = civil(dn)
  return `${String(y).padStart(4, "0")}-${pad(m + 1)}-${pad(d)}`
}

const dateOf = (dn: number) => {
  const [y, m, d] = civil(dn)
  return new Date(y, m, d)
}

/* -------------------------------------------------------------------------- */
/*                                  Wording                                   */
/* -------------------------------------------------------------------------- */

type Fmt = { month: (dn: number) => string; monthYear: (dn: number) => string; full: (dn: number) => string; wd: (i: number) => [string, string] }

function makeFmt(locale: string): Fmt {
  const utc = (dn: number) => {
    const [y, m, d] = civil(dn)
    return new Date(Date.UTC(y, m, d))
  }
  const mo = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const my = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" })
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
  const ws = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
  const wl = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" })
  const SUNDAY = dayOf(2023, 0, 1)
  return {
    month: (dn) => mo.format(utc(dn)),
    monthYear: (dn) => my.format(utc(dn)),
    full: (dn) => full.format(utc(dn)),
    wd: (i) => [ws.format(utc(SUNDAY + i)).slice(0, 2), wl.format(utc(SUNDAY + i))],
  }
}

const NB = " "

function fmtDay(f: Fmt, dn: number, year: number) {
  const [y, , d] = civil(dn)
  return `${f.month(dn)}${NB}${d}${y !== year ? `, ${y}` : ""}`
}

/** "Nov 3 – 16", "Oct 28 – Nov 16", "Dec 28, 2025 – Jan 4, 2026"; the year only when it is not this year. */
function fmtRange(f: Fmt, a: number, b: number, year: number) {
  if (a === b) return fmtDay(f, a, year)
  const [ya, ma, da] = civil(a)
  const [yb, mb, db] = civil(b)
  if (ya !== yb) return `${f.month(a)}${NB}${da}, ${ya} – ${f.month(b)}${NB}${db}, ${yb}`
  const tail = ya !== year ? `, ${ya}` : ""
  if (ma === mb) return `${f.month(a)}${NB}${da} – ${db}${tail}`
  return `${f.month(a)}${NB}${da} – ${f.month(b)}${NB}${db}${tail}`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* -------------------------------------------------------------------------- */
/*                                 Resolving                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PRESETS: RangeBarPreset[] = [
  { id: "today", label: "Today", days: 1 },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "month", label: "This month", period: "month" },
  { id: "year", label: "This year", period: "year" },
]

const DEFAULT_FACETS: RangeBarFacet[] = [
  {
    id: "model",
    name: "Models",
    all: "all models",
    options: [
      { id: "nova-2-pro", label: "Nova 2 Pro" },
      { id: "nova-2-flash", label: "Nova 2 Flash" },
      { id: "sage-mini", label: "Sage Mini" },
      { id: "sage-3", label: "Sage 3" },
      { id: "quill-code", label: "Quill Code" },
    ],
  },
]

const DEFAULT_VALUE: RangeBarValue = { range: { preset: "7d" }, compare: "previous", filters: {} }
const COMPARES: RangeBarCompare[] = ["previous", "year", "none"]
const PERIOD_MONTHS = { month: 1, quarter: 3, year: 12 } as const

type Ctx = { presets: RangeBarPreset[]; facets: RangeBarFacet[]; today: number; min: number | null; max: number | null; fmt: Fmt; year: number }

type Resolved = {
  from: number
  to: number
  n: number
  preset: RangeBarPreset | null
  cmp: [number, number] | null
  rangePhrase: string
  comparePhrase: string
  facetPhrases: string[]
  filters: Record<string, string[]>
  sentence: string
}

function clampSpan(a: number, b: number, c: Ctx): [number, number] {
  let from = Math.min(a, b)
  let to = Math.max(a, b)
  if (c.max != null) {
    to = Math.min(to, c.max)
    from = Math.min(from, to)
  }
  if (c.min != null) {
    from = Math.max(from, c.min)
    to = Math.max(to, from)
  }
  return [from, to]
}

function presetSpan(p: RangeBarPreset, c: Ctx): [number, number] {
  if (p.period) {
    const [y, m] = civil(c.today)
    const start = p.period === "month" ? dayOf(y, m, 1) : p.period === "quarter" ? dayOf(y, m - (m % 3), 1) : dayOf(y, 0, 1)
    return clampSpan(start, c.today, c)
  }
  const to = c.today - Math.max(0, p.offset ?? 0)
  return clampSpan(to - Math.max(1, Math.round(p.days ?? 7)) + 1, to, c)
}

function compareSpan(kind: RangeBarCompare, from: number, to: number, preset: RangeBarPreset | null): [number, number] | null {
  if (kind === "none") return null
  const months = kind === "year" ? 12 : preset?.period ? PERIOD_MONTHS[preset.period] : 0
  if (months) return [addMonths(from, -months), addMonths(to, -months)]
  const n = to - from + 1
  return [from - n, from - 1]
}

/** The words for a comparison, as the sentence says them ("the 7 before") or as the list offers them ("The 7 days before"). */
function compareWords(kind: RangeBarCompare, n: number, preset: RangeBarPreset | null, inList: boolean) {
  if (kind === "none") return inList ? "Nothing" : ""
  let s: string
  if (kind === "year") s = n === 1 ? "the same day last year" : "the same days last year"
  else if (preset?.period) s = `the same days last ${preset.period}`
  else if (n === 1) s = "the day before"
  // "Last 7 days compared with the 7 before": the noun was just said, so the sentence drops it.
  else s = !inList && preset && /\bdays$/i.test(preset.label) ? `the ${n} before` : `the ${n} days before`
  return inList ? cap(s) : s
}

function pickedOf(f: RangeBarFacet, filters: Record<string, string[]> | undefined) {
  const ids = (filters?.[f.id] ?? []).filter((id, i, all) => all.indexOf(id) === i && f.options.some((o) => o.id === id))
  return ids.length >= f.options.length ? [] : ids
}

function facetWords(f: RangeBarFacet, ids: string[]) {
  const picked = f.options.filter((o) => ids.includes(o.id))
  if (picked.length === 0) return f.all
  if (picked.length === 1) return picked[0].label
  if (picked.length === 2) return `${picked[0].label} and ${picked[1].label}`
  return `${picked[0].label} and ${picked.length - 1} others`
}

function compute(v: RangeBarValue, c: Ctx): Resolved {
  let preset: RangeBarPreset | null = null
  let span: [number, number]
  if ("preset" in v.range) {
    const id = v.range.preset
    preset = c.presets.find((p) => p.id === id) ?? c.presets[0]
    span = presetSpan(preset, c)
  } else {
    const a = parseDay(v.range.from) ?? c.today
    span = clampSpan(a, parseDay(v.range.to) ?? a, c)
  }
  const [from, to] = span
  const n = to - from + 1
  const compare = COMPARES.includes(v.compare) ? v.compare : "previous"
  const cmp = compareSpan(compare, from, to, preset)
  const rangePhrase = preset ? preset.label : fmtRange(c.fmt, from, to, c.year)
  const comparePhrase = compareWords(compare, n, preset, false)
  const filters: Record<string, string[]> = {}
  const facetPhrases = c.facets.map((f) => {
    const ids = pickedOf(f, v.filters)
    filters[f.id] = ids
    return facetWords(f, ids)
  })
  const sentence =
    rangePhrase +
    (cmp ? ` compared with ${comparePhrase}` : "") +
    c.facets.map((f, i) => `${i === 0 ? "," : ""} ${f.lead ?? "for"} ${facetPhrases[i]}`).join("")
  return { from, to, n, preset, cmp, rangePhrase, comparePhrase, facetPhrases, filters, sentence }
}

function toPublic(r: Resolved): RangeBarResolved {
  return {
    from: dateOf(r.from),
    to: dateOf(r.to),
    fromISO: isoOf(r.from),
    toISO: isoOf(r.to),
    days: r.n,
    compare: r.cmp ? { from: dateOf(r.cmp[0]), to: dateOf(r.cmp[1]), fromISO: isoOf(r.cmp[0]), toISO: isoOf(r.cmp[1]) } : null,
    filters: r.filters,
    sentence: r.sentence,
  }
}

function makeCtx(o: { presets?: RangeBarPreset[]; facets?: RangeBarFacet[]; today?: RangeBarDate; min?: RangeBarDate; max?: RangeBarDate; locale?: string }, fmt?: Fmt): Ctx {
  const today = parseDay(o.today ?? new Date()) ?? parseDay(new Date())!
  return {
    presets: o.presets && o.presets.length > 0 ? o.presets : DEFAULT_PRESETS,
    facets: o.facets ?? DEFAULT_FACETS,
    today,
    min: parseDay(o.min),
    max: o.max === undefined ? today : parseDay(o.max),
    fmt: fmt ?? makeFmt(o.locale ?? "en-US"),
    year: civil(today)[0],
  }
}

/** Resolves a value to dates and its sentence without rendering, e.g. to fetch the first page of data. Pass the same options as the RangeBar. */
export function resolveRangeBar(
  value: RangeBarValue,
  options: { presets?: RangeBarPreset[]; facets?: RangeBarFacet[]; today?: RangeBarDate; min?: RangeBarDate; max?: RangeBarDate; locale?: string } = {},
): RangeBarResolved {
  return toPublic(compute(value, makeCtx(options)))
}

/* -------------------------------------------------------------------------- */
/*                         Reflow: the sentence glides                        */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22, 1, .36, 1)"

type Unit = { key: string; text: string; ctl?: string; trail: string }
type Spot = { x: number; y: number; sig: string; clone: HTMLElement }
type Snap = { at: number; pos: Map<string, Spot>; h: number }

function unitsOf(r: Resolved, facets: RangeBarFacet[]): Unit[] {
  const u: Unit[] = [{ key: "c:range", text: r.rangePhrase, ctl: "range", trail: "" }]
  if (r.cmp) {
    u.push({ key: "w:compared", text: "compared", trail: "" }, { key: "w:with", text: "with", trail: "" }, { key: "c:compare", text: r.comparePhrase, ctl: "compare", trail: "" })
  }
  facets.forEach((f, i) => {
    if (i === 0) u[u.length - 1].trail = ","
    u.push({ key: `w:lead:${f.id}`, text: f.lead ?? "for", trail: "" }, { key: `c:f:${f.id}`, text: r.facetPhrases[i], ctl: `f:${f.id}`, trail: "" })
  })
  return u
}

function unitEls(sent: HTMLElement) {
  const m = new Map<string, HTMLElement>()
  sent.querySelectorAll<HTMLElement>(":scope > [data-k]").forEach((el) => m.set(el.dataset.k ?? "", el))
  return m
}

/** Where every word is now (its box as drawn, so a word caught mid-glide is read where it is seen), plus a copy to leave behind as a ghost. */
function readSpots(sent: HTMLElement): Snap {
  const box = sent.getBoundingClientRect()
  const pos = new Map<string, Spot>()
  unitEls(sent).forEach((el, k) => {
    const b = el.getBoundingClientRect()
    const clone = el.cloneNode(true) as HTMLElement
    clone.removeAttribute("data-k")
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"))
    pos.set(k, { x: b.left - box.left, y: b.top - box.top, sig: el.dataset.s ?? "", clone })
  })
  return { at: performance.now(), pos, h: box.height }
}

/**
 * When the sentence changes, words that stay glide from where they were (FLIP: read, change, read, animate the difference),
 * a phrase whose words changed cross-blurs (the old words blur out as a ghost while the new ones blur in), new words blur in
 * after the gap opens, removed words leave a ghost that blurs out, and the box eases to its new height.
 */
function useReflow(sentRef: React.RefObject<HTMLDivElement | null>, layerRef: React.RefObject<HTMLDivElement | null>, sig: string, reduce: boolean) {
  const stored = React.useRef<Snap | null>(null)
  const pending = React.useRef<Snap | null>(null)
  const last = React.useRef("")
  const busy = React.useRef(0)
  const timer = React.useRef(0)

  React.useLayoutEffect(() => {
    const sent = sentRef.current
    const layer = layerRef.current
    if (!sent || !layer || sig === last.current) return
    const first = last.current === ""
    last.current = sig
    const fresh = pending.current && performance.now() - pending.current.at < 600 ? pending.current : null
    const old = fresh ?? stored.current
    pending.current = null

    const els = unitEls(sent)
    sent.getAnimations().forEach((a) => a.cancel())
    els.forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
    layer.replaceChildren()
    const now = readSpots(sent)
    stored.current = now
    if (first || reduce || !old) return

    let end = 0
    const ghost = (s: Spot, changed: boolean) => {
      const g = s.clone
      g.classList.add("rbar-ghost")
      g.style.left = `${s.x}px`
      g.style.top = `${s.y}px`
      layer.appendChild(g)
      const dur = changed ? 300 : 240
      g.animate(
        [
          { opacity: 1, filter: "blur(0px)", transform: "none" },
          { opacity: 0, filter: "blur(6px)", transform: `translateY(${changed ? -7 : -4}px)` },
        ],
        { duration: dur, easing: EASE, fill: "forwards" },
      ).onfinish = () => g.remove()
      end = Math.max(end, dur)
    }

    if (Math.abs(old.h - now.h) > 1) {
      sent.animate([{ height: `${old.h}px` }, { height: `${now.h}px` }], { duration: 560, easing: EASE })
      end = Math.max(end, 560)
    }
    let k = 0
    now.pos.forEach((p, key) => {
      const el = els.get(key)
      if (!el) return
      const o = old.pos.get(key)
      if (!o) {
        const delay = 140 + k++ * 45
        el.animate(
          [
            { opacity: 0, filter: "blur(6px)", transform: "translateY(7px)" },
            { opacity: 1, filter: "blur(0px)", transform: "none" },
          ],
          { duration: 480, delay, easing: EASE, fill: "backwards" },
        )
        end = Math.max(end, delay + 480)
        return
      }
      const dx = o.x - p.x
      const dy = o.y - p.y
      const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
      if (o.sig !== p.sig) {
        ghost(o, true)
        el.animate(
          [
            { opacity: 0, filter: "blur(6px)", transform: `translate(${dx}px, ${dy}px) translateY(7px)` },
            { opacity: 1, filter: "blur(0px)", transform: "none" },
          ],
          { duration: 520, delay: 50, easing: EASE, fill: "backwards" },
        )
        end = Math.max(end, 570)
      } else if (moved) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 560, easing: EASE })
        end = Math.max(end, 560)
      }
    })
    old.pos.forEach((o, key) => {
      if (!now.pos.has(key)) ghost(o, false)
    })

    busy.current = performance.now() + end + 60
    // If frames never arrive (a throttled tab, a screenshot) the final sentence is already laid out: drop what is left of the motion.
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      sent.getAnimations().forEach((a) => a.cancel())
      unitEls(sent).forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
      layer.replaceChildren()
    }, end + 300)
  }, [sig, reduce, sentRef, layerRef])

  // A new width (or a late web font) moves words without a change of value; keep the stored spots honest.
  React.useEffect(() => {
    const sent = sentRef.current
    if (!sent || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      if (performance.now() > busy.current) stored.current = readSpots(sent)
    })
    ro.observe(sent)
    return () => {
      ro.disconnect()
      window.clearTimeout(timer.current)
    }
  }, [sentRef])

  /** Call right before a change: records where every word is drawn now. */
  return React.useCallback(() => {
    if (sentRef.current) pending.current = readSpots(sentRef.current)
  }, [sentRef])
}

/* -------------------------------------------------------------------------- */
/*                                   Listbox                                  */
/* -------------------------------------------------------------------------- */

type Opt = { id: string; label: string; detail?: string; selected: boolean; sep?: boolean }

function List({ id, label, opts, multi, onPick }: { id: string; label: string; opts: Opt[]; multi?: boolean; onPick: (i: number) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [act, setAct] = React.useState(() => Math.max(0, opts.findIndex((o) => o.selected)))
  const n = opts.length

  React.useLayoutEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    let to = -1
    if (e.key === "ArrowDown") to = (act + 1) % n
    else if (e.key === "ArrowUp") to = (act - 1 + n) % n
    else if (e.key === "Home" || e.key === "PageUp") to = 0
    else if (e.key === "End" || e.key === "PageDown") to = n - 1
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onPick(act)
      return
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      const ch = e.key.toLowerCase()
      for (let s = 1; s <= n; s++) {
        const i = (act + s) % n
        if (opts[i].label.toLowerCase().startsWith(ch)) {
          to = i
          break
        }
      }
    }
    if (to < 0) return
    e.preventDefault()
    setAct(to)
  }

  return (
    <div
      ref={ref}
      id={id}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-multiselectable={multi || undefined}
      aria-activedescendant={`${id}-${act}`}
      className="rbar-lb"
      onKeyDown={onKeyDown}
    >
      {opts.map((o, i) => (
        <div
          key={o.id}
          id={`${id}-${i}`}
          role="option"
          aria-selected={o.selected}
          className="rbar-opt"
          data-active={i === act || undefined}
          data-sep={o.sep || undefined}
          // Keep focus on the listbox, so the keys keep working after a click.
          onMouseDown={(e) => e.preventDefault()}
          onPointerMove={() => i !== act && setAct(i)}
          onClick={() => {
            setAct(i)
            onPick(i)
          }}
        >
          <span className="rbar-ol">{o.label}</span>
          {o.detail ? <span className="rbar-od">{o.detail}</span> : null}
          <Check className="rbar-ok" aria-hidden strokeWidth={2} />
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Calendar                                  */
/* -------------------------------------------------------------------------- */

type CalProps = {
  id: string
  range: [number, number]
  today: number
  min: number | null
  max: number | null
  weekStart: number
  wide: boolean
  fmt: Fmt
  year: number
  onPick: (from: number, to: number) => void
  onBack: () => void
}

function Calendar({ id, range, today, min, max, weekStart, wide, fmt, year, onPick, onBack }: CalProps) {
  const count = wide ? 2 : 1
  const [anchor, setAnchor] = React.useState<number | null>(null)
  const [hover, setHover] = React.useState<number | null>(null)
  const [active, setActive] = React.useState(range[1])
  const [view, setView] = React.useState(() => addMonths(monthStart(range[1]), 1 - count))
  const focusNext = React.useRef(true)
  const boxRef = React.useRef<HTMLDivElement>(null)

  const first = view
  const last = addMonths(view, count) - 1
  const ok = (d: number) => (min == null || d >= min) && (max == null || d <= max)

  // The day that should hold focus: on open, and after every arrow key.
  React.useLayoutEffect(() => {
    if (!focusNext.current) return
    focusNext.current = false
    boxRef.current?.querySelector<HTMLElement>(`[data-dn="${active}"]`)?.focus({ preventScroll: true })
  })

  const go = (to: number) => {
    let d = to
    if (min != null && d < min) d = min
    if (max != null && d > max) d = max
    setActive(d)
    if (d < first) setView(monthStart(d))
    else if (d > last) setView(addMonths(monthStart(d), 1 - count))
    if (anchor != null) setHover(d)
    focusNext.current = true
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.target as HTMLElement).dataset.dn) return
    const d = active
    const wd = (weekday(d) - weekStart + 7) % 7
    const map: Record<string, number> = {
      ArrowLeft: d - 1,
      ArrowRight: d + 1,
      ArrowUp: d - 7,
      ArrowDown: d + 7,
      Home: d - wd,
      End: d + 6 - wd,
      PageUp: addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: addMonths(d, e.shiftKey ? 12 : 1),
    }
    const to = map[e.key]
    if (to === undefined) return
    e.preventDefault()
    go(to)
  }

  const pick = (d: number) => {
    if (!ok(d)) return
    setActive(d)
    if (anchor == null) {
      setAnchor(d)
      setHover(d)
    } else onPick(Math.min(anchor, d), Math.max(anchor, d))
  }

  const end = anchor != null ? (hover ?? anchor) : null
  const lo = anchor != null ? Math.min(anchor, end!) : range[0]
  const hi = anchor != null ? Math.max(anchor, end!) : range[1]
  const hint =
    anchor == null ? "Pick the first day" : lo === hi ? `${fmtDay(fmt, anchor, year)} – pick the last day` : `${fmtRange(fmt, lo, hi, year)} · ${hi - lo + 1} days`
  const tab = active >= first && active <= last ? active : Math.max(first, min ?? first)
  const canPrev = min == null || view - 1 >= min
  const canNext = max == null || last + 1 <= max
  const weekdays = Array.from({ length: 7 }, (_, i) => fmt.wd((weekStart + i) % 7))

  return (
    <div className="rbar-cal">
      <button type="button" className="rbar-nav" data-side="l" aria-label="Previous month" disabled={!canPrev} onClick={() => setView(addMonths(view, -1))}>
        <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
      </button>
      <button type="button" className="rbar-nav" data-side="r" aria-label="Next month" disabled={!canNext} onClick={() => setView(addMonths(view, 1))}>
        <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
      </button>
      <div ref={boxRef} className="rbar-mos" onKeyDown={onKeyDown}>
        {Array.from({ length: count }, (_, mi) => {
          const m = addMonths(view, mi)
          const [y, mo] = civil(m)
          const len = daysInMonth(y, mo)
          const lead = (weekday(m) - weekStart + 7) % 7
          // Always six rows, so the popover keeps its height from month to month.
          const rows = Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => r * 7 + c - lead).map((i) => (i >= 0 && i < len ? m + i : null)))
          return (
            <div key={m}>
              <p className="rbar-mt" id={`${id}-m${mi}`} aria-live="polite">
                {fmt.monthYear(m)}
              </p>
              <div role="grid" className="rbar-grid" aria-labelledby={`${id}-m${mi}`}>
                <div role="row" className="rbar-row">
                  {weekdays.map(([s, l]) => (
                    <span key={l} role="columnheader" aria-label={l} className="rbar-wd">
                      {s}
                    </span>
                  ))}
                </div>
                {rows.map((row, ri) => (
                  <div key={ri} role="row" className="rbar-row">
                    {row.map((d, ci) => {
                      if (d == null) return <span key={ci} role="gridcell" className="rbar-cell" />
                      const inb = d >= lo && d <= hi
                      const isEnd = anchor != null ? d === anchor : d === lo || d === hi
                      return (
                        <span
                          key={ci}
                          role="gridcell"
                          className="rbar-cell"
                          aria-selected={inb}
                          data-band={(inb && anchor == null) || undefined}
                          data-pre={(inb && anchor != null) || undefined}
                          data-l={(inb && (d === lo || ci === 0 || d === m)) || undefined}
                          data-r={(inb && (d === hi || ci === 6 || d === m + len - 1)) || undefined}
                        >
                          <button
                            type="button"
                            className="rbar-day"
                            data-dn={d}
                            tabIndex={d === tab ? 0 : -1}
                            aria-label={`${fmt.full(d)}${d === today ? ", today" : ""}`}
                            aria-current={d === today ? "date" : undefined}
                            aria-disabled={!ok(d) || undefined}
                            data-end={(inb && isEnd) || undefined}
                            data-tip={(anchor != null && d === end && d !== anchor) || undefined}
                            data-today={d === today || undefined}
                            onClick={() => pick(d)}
                            onPointerEnter={() => anchor != null && ok(d) && setHover(d)}
                            onFocus={() => setActive(d)}
                          >
                            {civil(d)[2]}
                          </button>
                        </span>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="rbar-cf">
        <p className="rbar-hint" aria-live="polite">
          {hint}
        </p>
        <button type="button" className="rbar-back" onClick={onBack}>
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
          Presets
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Agent bridge (inline stub)                        */
/* -------------------------------------------------------------------------- */

// Describes this piece to an agent: what it is, its state and the actions an agent may call.
// No import: the entry sits in a registry on globalThis that nothing reads until the app adds
// src/lib/agent-bridge.ts, so the piece works the same copied on its own. See docs/agent-operable.md.
type AgentArg = { name: string; type: "string" | "number" | "boolean"; enum?: readonly (string | number)[]; optional?: boolean; description?: string }
type AgentAction = {
  /** Goes through the piece's own handlers. May return a promise that resolves once the action has finished. */
  run: (args: Record<string, unknown>) => unknown
  args?: AgentArg[]
  description?: string
  /** Needs a person's approval. A string says what it does, for the person who is asked. */
  destructive?: boolean | string | ((args: Record<string, unknown>) => boolean | string)
  disabled?: boolean
}
type AgentNode = { id?: string; kind: string; label: string; value?: unknown; actions: Record<string, AgentAction> }
type AgentHost = { v: 1; nodes: Map<object, { el: () => Element | null; node: () => AgentNode }>; listeners: Set<(key: object) => void> }

function agentHost(): AgentHost {
  const g = globalThis as unknown as Record<symbol, AgentHost | undefined>
  return (g[Symbol.for("pane.agent")] ??= { v: 1, nodes: new Map(), listeners: new Set() })
}

function useAgentNode(el: React.RefObject<Element | null>, node: AgentNode) {
  const latest = React.useRef(node)
  const key = React.useRef<object | null>(null)
  React.useLayoutEffect(() => {
    latest.current = node
  })
  React.useEffect(() => {
    const host = agentHost()
    const k = (key.current = {})
    host.nodes.set(k, { el: () => el.current, node: () => latest.current })
    host.listeners.forEach((f) => f(k))
    return () => {
      host.nodes.delete(k)
      host.listeners.forEach((f) => f(k))
    }
  }, [el])
  // a change of state is reported, so the bridge can tag it as the agent's or the page's
  const sig = JSON.stringify(node.value)
  React.useEffect(() => {
    if (key.current) agentHost().listeners.forEach((f) => f(key.current!))
  }, [sig])
}

/* ------------------------------ end of stub ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                  RangeBar                                  */
/* -------------------------------------------------------------------------- */

type Pop = { kind: string; via: "sent" | "add"; mode: "list" | "cal" }
type Geo = { x: number; y: number; w: number; h: number }

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Sum of the offsets up to `root`: where an element is laid out, ignoring any transform it is gliding with. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y }
}

const plainRange = (r: RangeBarRange): RangeBarRange =>
  "preset" in r ? { preset: r.preset } : { from: r.from instanceof Date ? isoOf(parseDay(r.from) ?? 0) : r.from, to: r.to instanceof Date ? isoOf(parseDay(r.to) ?? 0) : r.to }

/**
 * Range Bar – the control above a dashboard, written as one editable sentence:
 * "Last 7 days compared with the 7 before, for all models". Every underlined phrase opens its own list. The range offers
 * presets and Custom…, which turns the same popover into a two-month calendar for picking a start and an end day. The
 * comparison switches between the previous period, the same days last year and nothing (the sentence rewrites itself to
 * stay grammatical), and each facet is a multi-select. When a phrase changes, its words cross-blur and the rest of the
 * sentence glides to its new place.
 *
 * ```tsx
 * <RangeBar onChange={(value, r) => load(r.fromISO, r.toISO, r.compare, r.filters)}>
 *   <p><b>14,208</b> calls, 9% up</p>
 * </RangeBar>
 * ```
 *
 * Controlled with `value` + `onChange`, or uncontrolled with `defaultValue`. Dates are worked out in whole days with no
 * date library: month lengths and leap years, `weekStartsOn`, and `min` / `max` (max defaults to today). `resolveRangeBar`
 * gives the same dates without rendering.
 */
export function RangeBar(props: RangeBarProps) {
  const {
    value,
    defaultValue,
    onChange,
    presets: presetsProp,
    facets: facetsProp,
    today: todayProp,
    weekStartsOn = 1,
    min: minProp,
    max: maxProp,
    locale = "en-US",
    context = "Harbor & Finch · API usage",
    label = "Dashboard range",
    children,
    agentId,
    className,
  } = props

  const uid = React.useId().replace(/:/g, "")
  const fmt = React.useMemo(() => makeFmt(locale), [locale])
  const ctx = makeCtx({ presets: presetsProp, facets: facetsProp, today: todayProp, min: minProp, max: maxProp }, fmt)
  const { presets, facets } = ctx

  const controlled = value !== undefined
  const [inner, setInner] = React.useState<RangeBarValue>(() => defaultValue ?? DEFAULT_VALUE)
  const cur = controlled ? value : inner
  const r = compute(cur, ctx)
  const units = unitsOf(r, facets)
  const sig = units.map((u) => `${u.key}=${u.text}${u.trail}`).join("|")

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const rootRef = React.useRef<HTMLDivElement>(null)
  const sentRef = React.useRef<HTMLDivElement>(null)
  const layerRef = React.useRef<HTMLDivElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const focusAfter = React.useRef<string | null>(null)
  const snap = useReflow(sentRef, layerRef, sig, reduce)

  const [pop, setPop] = React.useState<Pop | null>(null)
  const popNow = React.useRef(pop)
  popNow.current = pop
  const [geo, setGeo] = React.useState<Geo | null>(null)
  const [glide, setGlide] = React.useState(false)
  const [rootW, setRootW] = React.useState(0)
  const [, setTick] = React.useState(0)
  const [note, setNote] = React.useState("")

  const wide = rootW >= 600

  // The root's width decides one month or two.
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const m = () => setRootW(el.clientWidth)
    m()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Finding the controls */
  const ctlEl = React.useCallback((kind: string) => {
    const root = rootRef.current
    if (!root) return null
    const inSentence = sentRef.current?.querySelector<HTMLElement>(`:scope > [data-k] [data-ctl="${kind}"]`) ?? null
    if (kind === "compare") return inSentence ?? root.querySelector<HTMLElement>('[data-ctl="compare-add"]')
    return inSentence
  }, [])
  const anchorEl = React.useCallback(() => {
    const p = popNow.current
    if (!p) return null
    return p.via === "add" ? (rootRef.current?.querySelector<HTMLElement>('[data-ctl="compare-add"]') ?? ctlEl(p.kind)) : ctlEl(p.kind)
  }, [ctlEl])

  /* Changing the value */
  const commit = (next: RangeBarValue) => {
    snap()
    if (!controlled) setInner(next)
    onChange?.(next, toPublic(compute(next, ctx)))
  }
  const close = (refocus: boolean) => {
    const p = popNow.current
    if (!p) return
    if (refocus) focusAfter.current = p.kind
    setPop(null)
    setGlide(false)
    setGeo(null)
  }
  const toggle = (kind: string, via: Pop["via"]) => {
    if (pop && pop.kind === kind && pop.via === via) close(false)
    else {
      setGeo(null)
      setGlide(false)
      setPop({ kind, via, mode: "list" })
    }
  }

  const setFacet = (f: RangeBarFacet, ids: string[]) => commit({ ...cur, filters: { ...r.filters, [f.id]: ids.length >= f.options.length ? [] : ids } })

  // Focus goes back to the phrase that opened the popover (or to where that phrase went when the sentence rewrote itself).
  React.useLayoutEffect(() => {
    const k = focusAfter.current
    if (!k) return
    focusAfter.current = null
    ctlEl(k)?.focus({ preventScroll: true })
  })

  // Every new sentence is announced once, whoever changed it.
  const said = React.useRef(r.sentence)
  React.useEffect(() => {
    if (said.current === r.sentence) return
    said.current = r.sentence
    setNote(`Showing ${r.sentence}.`)
  }, [r.sentence])

  /* Placing the popover under its phrase. It reads laid-out offsets, not drawn boxes, so it heads straight for where a gliding phrase will land. */
  React.useLayoutEffect(() => {
    if (!pop) return
    const root = rootRef.current
    const box = innerRef.current
    const a = anchorEl()
    if (!root || !box || !a) return
    const rw = root.clientWidth
    const w = Math.min(box.offsetWidth, rw)
    const h = box.offsetHeight
    const o = offsetIn(a, root)
    const x = Math.round(Math.max(0, Math.min(o.x - 8, rw - w)))
    const y = Math.round(o.y + a.offsetHeight + 8)
    setGeo((g) => (g && g.x === x && g.y === y && g.w === w && g.h === h ? g : { x, y, w, h }))
  })
  React.useEffect(() => {
    if (!pop) return
    const box = innerRef.current
    const ro = typeof ResizeObserver !== "undefined" && box ? new ResizeObserver(() => setTick((t) => t + 1)) : null
    if (ro && box) ro.observe(box)
    // Glide only after the first placement, so the popover opens where it belongs.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)))
    return () => {
      ro?.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [pop])

  // A press outside closes it; focus stays wherever the press put it.
  React.useEffect(() => {
    if (!pop) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || anchorEl()?.contains(t)) return
      close(false)
    }
    document.addEventListener("pointerdown", down, true)
    return () => document.removeEventListener("pointerdown", down, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop, anchorEl])

  const onPopKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return
    e.preventDefault()
    e.stopPropagation()
    close(true)
  }
  const onPopBlur = (e: React.FocusEvent) => {
    const t = e.relatedTarget as Node | null
    if (t && !popRef.current?.contains(t) && !anchorEl()?.contains(t)) close(false)
  }

  /* What each popover offers */
  let content: React.ReactNode = null
  let popLabel = ""
  let popRole: "dialog" | undefined
  if (pop) {
    const lb = `${uid}-lb`
    if (pop.kind === "range") {
      popRole = "dialog"
      popLabel = pop.mode === "cal" ? "Pick a start and an end day" : "Choose the date range"
      const custom = !r.preset
      content =
        pop.mode === "cal" ? (
          <Calendar
            id={`${uid}-cal`}
            range={[r.from, r.to]}
            today={ctx.today}
            min={ctx.min}
            max={ctx.max}
            weekStart={weekStartsOn}
            wide={wide}
            fmt={fmt}
            year={ctx.year}
            onPick={(a, b) => {
              commit({ ...cur, range: { from: isoOf(a), to: isoOf(b) } })
              close(true)
            }}
            onBack={() => {
              setGlide(true)
              setPop((p) => p && { ...p, mode: "list" })
            }}
          />
        ) : (
          <List
            id={lb}
            label="Date range"
            opts={[
              ...presets.map((p) => {
                const [a, b] = presetSpan(p, ctx)
                return { id: p.id, label: p.label, detail: fmtRange(fmt, a, b, ctx.year), selected: r.preset?.id === p.id }
              }),
              { id: "\u0000custom", label: "Custom…", detail: custom ? fmtRange(fmt, r.from, r.to, ctx.year) : "", selected: custom, sep: true },
            ]}
            onPick={(i) => {
              if (i < presets.length) {
                commit({ ...cur, range: { preset: presets[i].id } })
                close(true)
              } else setPop((p) => p && { ...p, mode: "cal" })
            }}
          />
        )
    } else if (pop.kind === "compare") {
      popLabel = "Compare with"
      content = (
        <List
          id={lb}
          label="Compare with"
          opts={COMPARES.map((k) => {
            const s = compareSpan(k, r.from, r.to, r.preset)
            return { id: k, label: compareWords(k, r.n, r.preset, true), detail: s ? fmtRange(fmt, s[0], s[1], ctx.year) : "", selected: cur.compare === k, sep: k === "none" }
          })}
          onPick={(i) => {
            commit({ ...cur, compare: COMPARES[i] })
            close(true)
          }}
        />
      )
    } else {
      const f = facets.find((x) => `f:${x.id}` === pop.kind)
      if (f) {
        const ids = r.filters[f.id] ?? []
        popLabel = f.name
        content = (
          <List
            id={lb}
            label={f.name}
            multi
            opts={[
              { id: "\u0000all", label: cap(f.all), selected: ids.length === 0 },
              ...f.options.map((o, i) => ({ id: o.id, label: o.label, selected: ids.includes(o.id), sep: i === 0 })),
            ]}
            onPick={(i) => {
              if (i === 0) return setFacet(f, [])
              const id = f.options[i - 1].id
              setFacet(f, ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
            }}
          />
        )
      }
    }
  }
  const popId = pop ? (pop.kind === "range" ? `${uid}-pop` : `${uid}-lb`) : undefined

  /* Agent: the same changes a person makes, through the same handlers (see docs/agent-operable.md) */
  const agentWaits = React.useRef<(() => void)[]>([])
  const agentRendered = () =>
    new Promise<void>((resolve) => {
      agentWaits.current.push(resolve)
      window.setTimeout(resolve, 200)
    })
  useAgentNode(rootRef, {
    id: agentId,
    kind: "range-bar",
    label,
    value: {
      range: plainRange(cur.range),
      compare: cur.compare,
      filters: r.filters,
      from: isoOf(r.from),
      to: isoOf(r.to),
      compareFrom: r.cmp ? isoOf(r.cmp[0]) : null,
      compareTo: r.cmp ? isoOf(r.cmp[1]) : null,
      sentence: r.sentence,
    },
    actions: {
      setPreset: {
        description: "Show one of the ready-made ranges, as picking it from the first list does.",
        args: [{ name: "id", type: "string", enum: presets.map((p) => p.id) }],
        run: (a) => {
          const p = presets.find((x) => x.id === a.id)
          if (p) commit({ ...cur, range: { preset: p.id } })
          return agentRendered()
        },
      },
      setDates: {
        description: "Show a custom range of days, as picking a start and an end in the calendar does. Days are ISO dates, 2026-11-03.",
        args: [
          { name: "from", type: "string", description: "First day, YYYY-MM-DD" },
          { name: "to", type: "string", description: "Last day, YYYY-MM-DD" },
        ],
        run: (a) => {
          const f = parseDay(String(a.from))
          const t = parseDay(String(a.to))
          if (f == null || t == null) return
          const [x, y] = clampSpan(f, t, ctx)
          commit({ ...cur, range: { from: isoOf(x), to: isoOf(y) } })
          return agentRendered()
        },
      },
      setCompare: {
        description: "Choose what the range is compared with.",
        args: [{ name: "compare", type: "string", enum: COMPARES }],
        run: (a) => {
          if (!COMPARES.includes(a.compare as RangeBarCompare)) return
          commit({ ...cur, compare: a.compare as RangeBarCompare })
          return agentRendered()
        },
      },
      ...(facets.length > 0
        ? {
            setFilter: {
              description: "Narrow one facet to some of its options, or back to all of them with no ids.",
              args: [
                { name: "facet", type: "string", enum: facets.map((f) => f.id) },
                { name: "ids", type: "string", optional: true, description: `Comma-separated option ids. ${facets.map((f) => `${f.id}: ${f.options.map((o) => o.id).join(", ")}`).join("; ")}` },
              ],
              run: (a: Record<string, unknown>) => {
                const f = facets.find((x) => x.id === a.facet)
                if (!f) return
                const ids = String(a.ids ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => f.options.some((o) => o.id === s))
                setFacet(f, ids)
                return agentRendered()
              },
            } satisfies AgentAction,
          }
        : {}),
    },
  })
  React.useLayoutEffect(() => {
    agentWaits.current.splice(0).forEach((f) => f())
  })

  const hints: Record<string, string> = { range: "Change the date range", compare: "Change what it is compared with" }
  facets.forEach((f) => (hints[`f:${f.id}`] = `Choose ${f.name.toLowerCase()}`))
  const hintId = (ctl: string) => `${uid}-h${Object.keys(hints).indexOf(ctl)}`

  return (
    <div ref={rootRef} className={cn("rbar", className)}>
      <style href="range-bar" precedence="default">
        {CSS}
      </style>
      <p className="rbar-sr" role="status" aria-live="polite">
        {note}
      </p>
      <div className="rbar-sr" hidden>
        {Object.keys(hints).map((k) => (
          <span key={k} id={hintId(k)}>
            {hints[k]}
          </span>
        ))}
      </div>
      <div className="rbar-card" role="group" aria-label={`${label}: ${r.sentence}`}>
        {context !== "" && <p className="rbar-ctx">{context}</p>}
        <div ref={sentRef} className="rbar-sent">
          {units.map((u) => (
            <React.Fragment key={u.key}>
              <span className="rbar-u" data-k={u.key} data-s={u.text + u.trail}>
                {u.ctl ? (
                  <button
                    type="button"
                    className="rbar-c"
                    data-ctl={u.ctl}
                    aria-haspopup={u.ctl === "range" ? "dialog" : "listbox"}
                    aria-expanded={pop?.kind === u.ctl && pop.via === "sent"}
                    aria-controls={pop?.kind === u.ctl && pop.via === "sent" ? popId : undefined}
                    aria-describedby={hintId(u.ctl)}
                    onClick={() => toggle(u.ctl!, "sent")}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" && !(pop?.kind === u.ctl)) {
                        e.preventDefault()
                        toggle(u.ctl!, "sent")
                      }
                    }}
                  >
                    {u.text}
                  </button>
                ) : (
                  u.text
                )}
                {u.trail}
              </span>{" "}
            </React.Fragment>
          ))}
          <div ref={layerRef} className="rbar-gh" aria-hidden inert />
        </div>
        <p className="rbar-dates">
          <span key={`${r.from}-${r.to}`} className="rbar-tick">
            <b>{fmtRange(fmt, r.from, r.to, ctx.year)}</b>
          </span>{" "}
          {r.cmp ? (
            <span key={`${r.cmp[0]}-${r.cmp[1]}`} className="rbar-tick">
              against {fmtRange(fmt, r.cmp[0], r.cmp[1], ctx.year)}
            </span>
          ) : (
            <>
              <span aria-hidden>· </span>
              <button
                type="button"
                className="rbar-add"
                data-ctl="compare-add"
                aria-haspopup="listbox"
                aria-expanded={pop?.kind === "compare" && pop.via === "add"}
                aria-controls={pop?.kind === "compare" && pop.via === "add" ? popId : undefined}
                onClick={() => toggle("compare", "add")}
              >
                Add a comparison
              </button>
            </>
          )}
        </p>
        {children != null && children !== false && <div className="rbar-foot">{children}</div>}
      </div>
      {pop && content && (
        <div
          ref={popRef}
          id={popRole ? popId : undefined}
          className="rbar-pop"
          role={popRole}
          aria-label={popRole ? popLabel : undefined}
          data-glide={glide && geo ? "" : undefined}
          style={geo ? { left: geo.x, top: geo.y, width: geo.w, height: geo.h } : { left: 0, top: 0, opacity: 0 }}
          onKeyDown={onPopKey}
          onBlur={onPopBlur}
        >
          <div ref={innerRef} className="rbar-pi" style={rootW ? { maxWidth: rootW } : undefined}>
            <div key={`${pop.kind}-${pop.mode}`} className="rbar-pc">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
