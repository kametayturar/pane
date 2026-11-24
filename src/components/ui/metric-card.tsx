"use client"

/**
 * Metric Card – a dashboard KPI written as a sentence.
 *
 * One big number, and under it how it moved against the previous period in words:
 * "Up 12% on last week, mostly Sage Mini calls". The underlined reason is a button that opens, in place,
 * the two or three drivers behind the move as a short ranked list with their own numbers. When the value
 * changes the digits roll once and settle; an optional hairline spark line draws the period with the
 * previous one fainter behind it. Moves are neutral text unless `goodWhen` says this one is bad – then the
 * change is written in the destructive tone.
 *
 * ```tsx
 * <MetricGrid label="Harbor & Finch AI usage, this week">
 *   <MetricCard label="Model calls" value={48210} previous={43050} reason="mostly Sage Mini calls"
 *     drivers={[{ label: "Sage Mini", value: 4120 }, { label: "Nova 2 Pro", value: 1480 }]} spark={[...]} />
 *   <MetricCard label="Median latency" format="duration" value={840} previous={712} goodWhen="down" />
 * </MetricGrid>
 * ```
 *
 * `<MetricCard />` with no props shows a filled-in example. `MetricGrid` lays several cards out with shared
 * hairlines instead of separate boxes and wraps from four columns down to one at 360px.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MetricFormat = "number" | "currency" | "percent" | "duration"

export type MetricDriver = {
  /** What moved, e.g. "Sage Mini". */
  label: string
  /** Its part of the move, signed, in the metric's own unit: +4120 calls, -112 dollars, +96 ms, +0.8 points. */
  value: number
  /** One short line under the label, e.g. "Invoice triage moved here on Tuesday". */
  note?: string
}

export type MetricCardProps = {
  /** What is measured, e.g. "Model calls". */
  label?: string
  /** This period's figure. `null` shows the no-data state. */
  value?: number | null
  /** The previous period's figure. The change is worked out from it. */
  previous?: number | null
  /** How numbers are written. `percent` takes 94.2 for 94.2% and writes moves in points; `duration` takes milliseconds. Default "number". */
  format?: MetricFormat
  /** ISO currency code for `format="currency"`. Default "USD". */
  currency?: string
  /** Fixed decimals. Default: chosen from the size of the figures. */
  decimals?: number
  /** Your own formatter for the big number and the figures in the list. */
  formatValue?: (n: number) => string
  /** The current period, used in the list ("to 48,210 this week") and the empty line. Default "this week". */
  period?: string
  /** The period compared against, as words: "Up 12% on last week". Default "last week". */
  previousPeriod?: string
  /** Which way is good. A move the other way is written in the destructive tone. Leave it out for neutral metrics. */
  goodWhen?: "up" | "down"
  /** Moves smaller than this read as level: a percentage, or points for `format="percent"`. Default 0.5 (0.1 points). */
  flatWithin?: number
  /** Why it moved, as the end of the sentence: "mostly Sage Mini calls". With `drivers` it becomes the button. */
  reason?: string
  /** What is behind the move. The largest three are listed, ranked; the rest is summed as "Everything else". */
  drivers?: MetricDriver[]
  /** This period's points, oldest first. Drawn as a hairline beside the number. */
  spark?: number[]
  /** The previous period's points, drawn fainter behind. */
  sparkPrevious?: number[]
  /** Beside the number (default) or under the sentence. Narrow cards always put it under. */
  sparkPlacement?: "beside" | "under"
  /** Shows a quiet placeholder while the figure loads. */
  loading?: boolean
  /** Line shown when `value` is null. Default "No data for this week" (built from `period`). */
  emptyText?: string
  /** Controlled: whether the drivers are open. */
  open?: boolean
  /** Uncontrolled: start with the drivers open. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** On first show, roll from the previous figure to this one. Default true. */
  rollOnMount?: boolean
  className?: string
}

export type MetricGridProps = {
  children: React.ReactNode
  /** Names the group for screen readers, e.g. "AI usage, this week". */
  label?: string
  /** Narrowest a column may get before the grid wraps (px). Default 220. */
  minColumnWidth?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
:is(.mtc, .mtc-grid) {
  --mtc-ink: #000;
  --mtc-surface: #fff;
  --mtc-accent: #0060e2;
  --mtc-bad: #d92d20;
  --mtc-t1: color-mix(in oklab, var(--mtc-ink) 88%, transparent);
  --mtc-t2: color-mix(in oklab, var(--mtc-ink) 61%, transparent);
  --mtc-t3: color-mix(in oklab, var(--mtc-ink) 45%, transparent);
  --mtc-t4: color-mix(in oklab, var(--mtc-ink) 27%, transparent);
  --mtc-fill: color-mix(in oklab, var(--mtc-ink) 6%, transparent);
  --mtc-line: color-mix(in oklab, var(--mtc-ink) 7%, transparent);
  --mtc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --mtc-ease: cubic-bezier(.22, 1, .36, 1);
  --mtc-radius: 16px;
  --mtc-num: clamp(28px, 12.5cqw, 40px);
  --mtc-ls: -.025em;
  font: 13px/20px var(--mtc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--mtc-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) :is(.mtc, .mtc-grid) {
  --mtc-ink: #fff;
  --mtc-surface: #1c1c1e;
  --mtc-accent: #4d8dff;
  --mtc-bad: #ff6b60;
  --mtc-t1: color-mix(in oklab, var(--mtc-ink) 90%, transparent);
  --mtc-t2: color-mix(in oklab, var(--mtc-ink) 62%, transparent);
  --mtc-t3: color-mix(in oklab, var(--mtc-ink) 46%, transparent);
  --mtc-t4: color-mix(in oklab, var(--mtc-ink) 28%, transparent);
  --mtc-fill: color-mix(in oklab, var(--mtc-ink) 8%, transparent);
  --mtc-line: color-mix(in oklab, var(--mtc-ink) 10%, transparent);
  --mtc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}

/* Mono: ink on paper, a 1px hairline, square corners and a monospaced face (a size smaller, it runs wider) */
html[data-style="mono"] :is(.mtc, .mtc-grid) {
  --mtc-ink: #000; --mtc-surface: #fff; --mtc-accent: #111; --mtc-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --mtc-line: color-mix(in oklab, var(--mtc-ink) 12%, transparent);
  --mtc-ease: cubic-bezier(.2, .9, .1, 1); --mtc-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --mtc-radius: 6px; --mtc-num: clamp(24px, 10.5cqw, 34px); --mtc-ls: -.04em;
}
html[data-style="mono"].dark :is(.mtc, .mtc-grid) { --mtc-ink: #fff; --mtc-surface: #0a0a0a; --mtc-accent: #f2f2f2; --mtc-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .mtc-label { font-size: 12px; letter-spacing: 0 }
html[data-style="mono"] .mtc-line { font-size: 12.5px }
html[data-style="mono"] .mtc-why { text-decoration-style: solid; text-decoration-thickness: 1px }

/* Glass: the frost sits on the outer surface (a lone card, or the grid); cards inside a grid stay clear */
html[data-style="glass"] :is(.mtc, .mtc-grid) {
  --mtc-ink: var(--pane-ink); --mtc-surface: var(--pane-solid); --mtc-accent: var(--pane-accent); --mtc-shadow: var(--pane-shadow);
  --mtc-ease: var(--pane-ease); --mtc-font: var(--pane-font);
  --mtc-t1: var(--pane-t1); --mtc-t2: var(--pane-t2); --mtc-t3: var(--pane-t3); --mtc-t4: var(--pane-t4);
  --mtc-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --mtc-radius: 22px;
}
html[data-style="glass"].dark :is(.mtc, .mtc-grid) { --mtc-line: color-mix(in oklab, var(--pane-ink) 14%, transparent) }
html[data-style="glass"] :is(.mtc-card[data-solo], .mtc-grid) { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] :is(.mtc-card[data-solo], .mtc-grid) { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark :is(.mtc-card[data-solo], .mtc-grid) { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] :is(.mtc-card[data-solo], .mtc-grid) { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] :is(.mtc-card[data-solo], .mtc-grid) { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] :is(.mtc-card[data-solo], .mtc-grid) { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.mtc *, .mtc *::before, .mtc *::after { box-sizing: border-box }
:where(.mtc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.mtc) p, :where(.mtc) ol, :where(.mtc) li { margin: 0; padding: 0 }
.mtc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card. A lone card is a raised surface; inside a grid it is a flat cell. */
.mtc { position: relative; container-type: inline-size; width: 100%; min-width: 0 }
.mtc-card { height: 100%; padding: 18px 20px 18px }
.mtc-card[data-solo] { border-radius: var(--mtc-radius); background: var(--mtc-surface); box-shadow: var(--mtc-shadow) }

.mtc-label { font-weight: 500; color: var(--mtc-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

/* The number and the spark line share a row; on narrow cards (or when asked) the line drops under the sentence */
.mtc-row { display: flex; align-items: flex-end; gap: 16px; margin-top: 6px; min-width: 0 }
.mtc-num {
  display: block; flex: none; height: 1.2em; line-height: 1.2em; font-size: var(--mtc-num); font-weight: 500; letter-spacing: var(--mtc-ls);
  font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--mtc-t1);
}
.mtc-num[data-empty] { color: var(--mtc-t4) }
/* A digit is a clipped column holding 0–9; the strip slides to the new digit once, so the figure settles from old to new */
.mtc-d { position: relative; display: inline-block; vertical-align: top; height: 1.2em; overflow: hidden;
  -webkit-mask-image: linear-gradient(#0000, #000 16%, #000 84%, #0000); mask-image: linear-gradient(#0000, #000 16%, #000 84%, #0000) }
.mtc-d-size { visibility: hidden }
.mtc-strip { position: absolute; inset: 0 0 auto; display: flex; flex-direction: column; align-items: center;
  transform: translateY(calc(var(--n) * -1.2em)); transition: transform .82s var(--mtc-ease) calc(var(--i) * 34ms) }
.mtc-strip > span { display: block; height: 1.2em }
.mtc-c { display: inline-block; white-space: pre; animation: mtc-in .42s var(--mtc-ease) backwards }
/* Units ("ms", "s", "%") sit smaller on the same baseline, so the figure leads */
.mtc-c[data-unit] { font-size: .52em; letter-spacing: 0; color: var(--mtc-t2) }
.mtc-c[data-unit="word"] { margin-left: .22em }
.mtc-c[data-unit="pct"] { font-size: .66em; margin-left: .04em }
.mtc-num[data-still] .mtc-c { animation: none }

.mtc-spark { position: relative; flex: 0 1 96px; min-width: 56px; height: 34px; margin: 0 0 .32em auto }
.mtc-spark svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.mtc-spark path { fill: none; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; transition: d .6s var(--mtc-ease) }
.mtc-sp-prev { stroke: var(--mtc-t4); stroke-width: 1px; stroke-dasharray: 2 2.5 }
.mtc-sp-cur { stroke: var(--mtc-t2); stroke-width: 1.5px; animation: mtc-draw .9s var(--mtc-ease) .15s backwards }
.mtc-card[data-bad] .mtc-sp-cur { stroke: var(--mtc-bad) }
.mtc-sp-end { position: absolute; inset: 0; pointer-events: none; transform: translate(calc(var(--x) * 1%), calc(var(--y) * 1%)); transition: transform .6s var(--mtc-ease) }
.mtc-sp-end i { position: absolute; left: -2.5px; top: -2.5px; width: 5px; height: 5px; border-radius: 50%; background: var(--mtc-t1); animation: mtc-in .4s var(--mtc-ease) .9s backwards }
.mtc-card[data-bad] .mtc-sp-end i { background: var(--mtc-bad) }
.mtc-spark[data-under] { flex: none; width: 100%; height: 30px; margin: 14px 0 0 }

/* The sentence: the move in words, then the reason */
.mtc-line { margin-top: 4px; font-size: 13.5px; line-height: 20px; color: var(--mtc-t2); text-wrap: pretty }
.mtc-move { color: var(--mtc-t1) }
.mtc-card[data-bad] .mtc-move { color: var(--mtc-bad); font-weight: 500 }
.mtc-card[data-flat] .mtc-move, .mtc-move[data-none] { color: var(--mtc-t2) }
.mtc-why {
  cursor: pointer; border-radius: 3px; -webkit-tap-highlight-color: transparent; -webkit-box-decoration-break: clone; box-decoration-break: clone; color: var(--mtc-t2); text-decoration: underline; text-decoration-color: var(--mtc-t4); text-decoration-thickness: 1px;
  text-underline-offset: .24em; transition: color .16s var(--mtc-ease), text-decoration-color .16s var(--mtc-ease);
}
@media (hover: hover) { .mtc-why:hover { color: var(--mtc-t1); text-decoration-color: var(--mtc-t2) } }
.mtc-why[aria-expanded="true"] { color: var(--mtc-t1); text-decoration-color: var(--mtc-t1) }
.mtc-why:focus { outline: none }
.mtc-why:focus-visible { outline: 2px solid var(--mtc-accent); outline-offset: 2px }

/* The drivers open in place: the row's height runs from 0fr to 1fr, and each line lands in turn */
.mtc-more { display: grid; grid-template-rows: 0fr; visibility: hidden;
  transition: grid-template-rows .44s var(--mtc-ease), visibility 0s linear .44s }
.mtc-more[data-open] { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows .5s var(--mtc-ease), visibility 0s }
.mtc-more-in { min-height: 0; overflow: hidden }
.mtc-more-in > div { padding-top: 14px }
.mtc-from { font-size: 12.5px; line-height: 18px; color: var(--mtc-t3); font-variant-numeric: tabular-nums }
.mtc-list { list-style: none; margin-top: 8px; display: grid; gap: 8px }
.mtc-dr { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; column-gap: 8px; align-items: baseline }
.mtc-more[data-open] :is(.mtc-from, .mtc-dr) { animation: mtc-land .5s var(--mtc-ease) backwards; animation-delay: calc(.1s + var(--i) * 55ms) }
.mtc-rank { font-size: 12px; color: var(--mtc-t3); font-variant-numeric: tabular-nums }
.mtc-dl { min-width: 0; color: var(--mtc-t1); overflow-wrap: anywhere }
.mtc-dn { display: block; font-size: 12.5px; line-height: 18px; color: var(--mtc-t3) }
.mtc-dv { font-variant-numeric: tabular-nums; color: var(--mtc-t1); white-space: nowrap }
.mtc-dr[data-rest] :is(.mtc-dl, .mtc-dv), .mtc-dr[data-against] .mtc-dv { color: var(--mtc-t2) }

/* Loading: quiet blocks in the shape of the figure and the sentence, with one slow glint */
.mtc-sk { position: relative; display: block; border-radius: 6px; background: var(--mtc-fill); overflow: hidden }
.mtc-sk::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, #0000, color-mix(in oklab, var(--mtc-surface) 60%, transparent), #0000); animation: mtc-glint 1.6s var(--mtc-ease) infinite }
.mtc-sk-num { width: 58%; max-width: 150px; height: calc(var(--mtc-num) * .78); margin: calc(var(--mtc-num) * .21) 0 }
.mtc-sk-line { width: 86%; height: 12px; margin-top: 8px }

@keyframes mtc-in { from { opacity: 0; filter: blur(3px); transform: translateY(.12em) } }
@keyframes mtc-land { from { opacity: 0; filter: blur(3px); transform: translateY(4px) } }
@keyframes mtc-draw { from { stroke-dasharray: 1 1; stroke-dashoffset: 1 } to { stroke-dasharray: 1 1; stroke-dashoffset: 0 } }
@keyframes mtc-glint { to { transform: translateX(100%) } }

/* The grid: cells share hairlines (each cell draws one on its left and top; the outer edge clips them away) */
.mtc-grid {
  container-type: inline-size; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--mtc-min, 220px)), 1fr));
  width: 100%; overflow: hidden; border-radius: var(--mtc-radius); background: var(--mtc-surface); box-shadow: var(--mtc-shadow);
}
.mtc-grid > .mtc > .mtc-card { box-shadow: -1px 0 0 0 var(--mtc-line), 0 -1px 0 0 var(--mtc-line) }

@container (max-width: 250px) {
  .mtc-card { padding: 16px 16px 16px }
  .mtc-row { flex-wrap: wrap }
  .mtc-row .mtc-spark { flex: none; width: 100%; height: 30px; margin: 10px 0 0 }
}
@media (pointer: coarse) { .mtc-why { padding: 6px 0 } }
@media (prefers-reduced-motion: reduce) {
  .mtc *, .mtc *::before, .mtc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const MINUS = "−"
const InGrid = React.createContext(false)

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )
}

type Fmt = { value: (n: number) => string; delta: (n: number) => string; unitWord: string }

/** One formatter for the big figure and one for signed parts of a move, sharing decimals so they read alike. */
function makeFormat(format: MetricFormat, currency: string, decimals: number | undefined, scale: number, custom?: (n: number) => string): Fmt {
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? MINUS : "")
  const abs = Math.abs(scale)
  if (format === "currency") {
    const d = decimals ?? (abs >= 1000 ? 0 : 2)
    const nf = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: d })
    const v = custom ?? ((n: number) => (n < 0 ? MINUS + nf.format(-n) : nf.format(n)))
    return { value: v, delta: (n) => sign(n) + nf.format(Math.abs(n)), unitWord: "" }
  }
  if (format === "percent") {
    const d = decimals ?? 1
    const v = custom ?? ((n: number) => `${n < 0 ? MINUS : ""}${Math.abs(n).toFixed(d)}%`)
    return { value: v, delta: (n) => `${sign(n)}${Math.abs(n).toFixed(d)} pts`, unitWord: "points" }
  }
  if (format === "duration") {
    const secs = abs >= 1000
    const d = decimals ?? (secs ? 2 : 0)
    const ms = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
    const v = custom ?? ((n: number) => (secs ? `${(n / 1000).toFixed(d)} s` : `${ms.format(Math.round(n))} ms`))
    return { value: v, delta: (n) => `${sign(n)}${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(2)} s` : `${ms.format(Math.round(Math.abs(n)))} ms`}`, unitWord: "" }
  }
  const d = decimals ?? (abs < 10 ? 1 : 0)
  const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals ?? 0, maximumFractionDigits: d })
  const v = custom ?? ((n: number) => (n < 0 ? MINUS + nf.format(-n) : nf.format(n)))
  return { value: v, delta: (n) => sign(n) + nf.format(Math.abs(n)), unitWord: "" }
}

const pctWords = (p: number) => {
  const a = Math.abs(p)
  if (a >= 10) return `${Math.round(a)}%`
  const r = Math.round(a * 10) / 10
  return `${Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)}%`
}

/* -------------------------------------------------------------------------- */
/*                               Rolling figure                               */
/* -------------------------------------------------------------------------- */

/**
 * The big number. Characters are aligned from the right, so a digit keeps its column when the figure changes
 * and its strip slides from the old digit to the new one (a CSS transition, so the final value is in the DOM
 * at once). Signs, separators and units sit still; a new one blurs in.
 */
function Figure({ text, from, label, reduce }: { text: string; from?: string; label: string; reduce: boolean }) {
  const [armed, setArmed] = React.useState(() => reduce || from === undefined || from === text)
  React.useEffect(() => {
    if (armed) return
    const t = window.setTimeout(() => setArmed(true), 140)
    return () => window.clearTimeout(t)
  }, [armed])
  const shown = armed || reduce ? text : (from ?? text)
  const chars = Array.from(shown)
  const n = chars.length
  return (
    <p className="mtc-num" role="img" aria-label={label} data-still={!armed || undefined}>
      {chars.map((ch, i) => {
        const pos = n - 1 - i
        if (ch >= "0" && ch <= "9") {
          return (
            <span key={`d${pos}`} className="mtc-d" aria-hidden style={{ "--n": Number(ch), "--i": i } as React.CSSProperties}>
              <span className="mtc-d-size">{ch}</span>
              <span className="mtc-strip">
                {"0123456789".split("").map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          )
        }
        // A space before a unit word becomes the unit's margin; the unit itself is set smaller.
        if (ch === " " && /[a-z]/i.test(chars[i + 1] ?? "")) return null
        const unit = /[a-z]/i.test(ch) ? (/[a-z]/i.test(chars[i - 1] ?? "") ? "rest" : "word") : ch === "%" ? "pct" : undefined
        return (
          <span key={`c${pos}${ch}`} className="mtc-c" data-unit={unit} aria-hidden>
            {ch}
          </span>
        )
      })}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Spark line                                 */
/* -------------------------------------------------------------------------- */

function Spark({ cur, prev, under }: { cur: number[]; prev?: number[]; under: boolean }) {
  const all = prev?.length ? [...cur, ...prev] : cur
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const W = 100
  const H = 100
  const pad = 8
  const pts = (s: number[]) => s.map((v, i) => [s.length === 1 ? W : (i / (s.length - 1)) * W, pad + (1 - (v - lo) / span) * (H - 2 * pad)] as const)
  const path = (s: number[]) =>
    pts(s)
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ")
  const dc = path(cur)
  const dp = prev && prev.length > 1 ? path(prev) : null
  const end = pts(cur)[cur.length - 1]
  return (
    <div className="mtc-spark" data-under={under || undefined} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {dp && <path className="mtc-sp-prev" d={dp} style={{ d: `path("${dp}")` } as React.CSSProperties} />}
        <path className="mtc-sp-cur" d={dc} pathLength={1} style={{ d: `path("${dc}")` } as React.CSSProperties} />
      </svg>
      <span className="mtc-sp-end" style={{ "--x": end[0], "--y": end[1] } as React.CSSProperties}>
        <i />
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 MetricCard                                 */
/* -------------------------------------------------------------------------- */

const EXAMPLE: MetricCardProps = {
  label: "Model calls",
  value: 48210,
  previous: 43050,
  reason: "mostly Sage Mini calls",
  drivers: [
    { label: "Sage Mini", value: 4120, note: "Atlas moved invoice triage here on Tuesday" },
    { label: "Nova 2 Pro", value: 1480, note: "Longer support threads from Northwind" },
    { label: "Quill drafts", value: -440, note: "Paused for the holiday on Friday" },
  ],
  spark: [6420, 6610, 7230, 7410, 7180, 6940, 6420],
  sparkPrevious: [5980, 6210, 6330, 6280, 6150, 6040, 6060],
}

export function MetricCard(props: MetricCardProps) {
  const bare = props.label === undefined && props.value === undefined
  const p = bare ? { ...EXAMPLE, ...props } : props
  const {
    label = "Metric",
    value = null,
    previous = null,
    format = "number",
    currency = "USD",
    decimals,
    formatValue,
    period = "this week",
    previousPeriod = "last week",
    goodWhen,
    reason,
    drivers,
    spark,
    sparkPrevious,
    sparkPlacement = "beside",
    loading = false,
    emptyText,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    rollOnMount = true,
    className,
  } = p
  const flatWithin = p.flatWithin ?? (format === "percent" ? 0.1 : 0.5)

  const solo = !React.useContext(InGrid)
  const reduce = useReducedMotion()
  const uid = React.useId()
  const labelId = `${uid}-l`
  const panelId = `${uid}-p`
  const whyRef = React.useRef<HTMLSpanElement>(null)

  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = openProp ?? openInner
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }

  const has = value !== null && value !== undefined && Number.isFinite(value)
  const hasPrev = previous !== null && previous !== undefined && Number.isFinite(previous)
  const f = makeFormat(format, currency, decimals, Math.max(Math.abs(has ? value : 0), Math.abs(hasPrev ? previous : 0)), formatValue)

  /* ---- the move ---- */
  const change = has && hasPrev ? value - previous : 0
  const rel = hasPrev && previous !== 0 ? (change / Math.abs(previous)) * 100 : 0
  const size = format === "percent" ? Math.abs(change) : Math.abs(rel)
  const dir = !has || !hasPrev ? 0 : previous === 0 ? Math.sign(change) : size < flatWithin ? 0 : Math.sign(change)
  const bad = !!goodWhen && dir !== 0 && (goodWhen === "up" ? dir < 0 : dir > 0)

  let move: string
  if (!has) move = emptyText ?? `No data for ${period}`
  else if (!hasPrev) move = `Nothing to compare with ${previousPeriod}`
  else if (dir === 0) move = `Level with ${previousPeriod}`
  else if (previous === 0) move = `${dir > 0 ? "Up" : "Down"} from zero ${previousPeriod}`
  else {
    const amount = format === "percent" ? `${Math.abs(change).toFixed(decimals ?? 1)} ${f.unitWord}` : pctWords(rel)
    move = `${dir > 0 ? "Up" : "Down"} ${amount} on ${previousPeriod}`
  }

  /* ---- the drivers: ranked by how hard they push the way it moved; the rest is summed ---- */
  const rows = React.useMemo(() => {
    if (!drivers?.length) return []
    const d = dir || Math.sign(change) || 1
    const ranked = [...drivers].sort((a, b) => b.value * d - a.value * d || Math.abs(b.value) - Math.abs(a.value))
    const top = ranked.slice(0, 3).map((x) => ({ ...x, rest: false }))
    if (has && hasPrev) {
      const rest = change - top.reduce((s, x) => s + x.value, 0)
      if (Math.abs(rest) > Math.max(Math.abs(change) * 0.005, 1e-9)) top.push({ label: "Everything else", value: rest, rest: true })
    } else if (ranked.length > 3) {
      top.push({ label: "Everything else", value: ranked.slice(3).reduce((s, x) => s + x.value, 0), rest: true })
    }
    return top
  }, [drivers, dir, change, has, hasPrev])
  const canOpen = has && !loading && rows.length > 0 && !!reason

  // Remount the figure when it comes back from loading or empty, so it rolls in from the previous figure again.
  const figKey = `${loading ? "l" : has ? "v" : "e"}`
  const valueText = has ? f.value(value) : "—"
  const fromText = rollOnMount && has && hasPrev ? f.value(previous) : undefined

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open && canOpen) {
      e.stopPropagation()
      setOpen(false)
      whyRef.current?.focus()
    }
  }

  const dirWord = dir > 0 ? "up" : dir < 0 ? "down" : "level"
  const lineState = bad ? "bad" : dir === 0 ? "flat" : dirWord

  return (
    <div className={cn("mtc", className)} role="group" aria-labelledby={labelId} aria-busy={loading || undefined} onKeyDown={onKeyDown}>
      <style href="metric-card" precedence="default">
        {CSS}
      </style>
      <div className="mtc-card" data-solo={solo || undefined} data-bad={(bad && !loading) || undefined} data-flat={(dir === 0) || undefined} data-move={lineState}>
        <p className="mtc-label" id={labelId}>
          {label}
        </p>

        {loading ? (
          <>
            <span className="mtc-sk mtc-sk-num" aria-hidden />
            <span className="mtc-sk mtc-sk-line" aria-hidden />
            <span className="mtc-sr">Loading</span>
          </>
        ) : (
          <>
            <div className="mtc-row">
              {has ? (
                <Figure key={figKey} text={valueText} from={fromText} label={valueText} reduce={reduce} />
              ) : (
                <p className="mtc-num" data-empty aria-hidden>
                  —
                </p>
              )}
              {has && spark && spark.length > 1 && sparkPlacement === "beside" && <Spark cur={spark} prev={sparkPrevious} under={false} />}
            </div>

            <p className="mtc-line">
              <span className="mtc-move" data-none={!has || !hasPrev || undefined}>
                {move}
              </span>
              {has && reason && (
                <>
                  {", "}
                  {canOpen ? (
                    // A span with the button role, so the reason wraps like the words around it (a <button> breaks as a block).
                    <span
                      ref={whyRef}
                      role="button"
                      tabIndex={0}
                      className="mtc-why"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpen(!open)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          if (!e.repeat) setOpen(!open)
                        }
                      }}
                    >
                      {reason}
                    </span>
                  ) : (
                    reason
                  )}
                </>
              )}
              {bad && <span className="mtc-sr"> (worse than {previousPeriod})</span>}
            </p>

            {has && spark && spark.length > 1 && sparkPlacement === "under" && <Spark cur={spark} prev={sparkPrevious} under />}

            {canOpen && (
              <div className="mtc-more" id={panelId} data-open={open || undefined} inert={!open} role="region" aria-label={`What moved ${label}`}>
                <div className="mtc-more-in">
                  <div>
                    {hasPrev && (
                      <p className="mtc-from" style={{ "--i": 0 } as React.CSSProperties}>
                        From {f.value(previous)} {previousPeriod}, {f.delta(change)}
                      </p>
                    )}
                    <ol className="mtc-list">
                      {rows.map((r, i) => (
                        <li
                          key={r.label}
                          className="mtc-dr"
                          data-rest={r.rest || undefined}
                          data-against={(!r.rest && dir !== 0 && Math.sign(r.value) === -dir) || undefined}
                          style={{ "--i": i + 1 } as React.CSSProperties}
                        >
                          <span className="mtc-rank" aria-hidden>
                            {r.rest ? "" : i + 1}
                          </span>
                          <span className="mtc-dl">
                            {r.label}
                            {"note" in r && r.note ? <span className="mtc-dn">{r.note}</span> : null}
                          </span>
                          <span className="mtc-dv">{f.delta(r.value)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 MetricGrid                                 */
/* -------------------------------------------------------------------------- */

/** Lays several MetricCards out as one surface with shared hairlines, wrapping from four columns to one. */
export function MetricGrid({ children, label, minColumnWidth = 220, className }: MetricGridProps) {
  return (
    <InGrid.Provider value>
      <div className={cn("mtc-grid", className)} role="group" aria-label={label} style={{ "--mtc-min": `${minColumnWidth}px` } as React.CSSProperties}>
        <style href="metric-card" precedence="default">
          {CSS}
        </style>
        {children}
      </div>
    </InGrid.Provider>
  )
}
