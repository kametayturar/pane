"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ReadoutDelta = {
  /** Signed change. Positive draws ▲, negative ▼, zero a flat dash. */
  value: number
  /** Written after the number. Default "%". */
  unit?: string
  /** When a drop is the good direction (latency, cost, errors), ▼ reads as ok and ▲ as bad. */
  lowerIsBetter?: boolean
}

export type ReadoutItem = {
  /** Mono uppercase label, e.g. "p95 latency". */
  label: string
  /** The reading. A number counts to its value when it changes; a string is shown as is. */
  value: number | string
  /** Small t3 unit after the number, e.g. "ms" or "req/s". */
  unit?: string
  /** Change against the previous period. A bare number is shorthand for `{ value }`. */
  delta?: number | ReadoutDelta
  /** Formats the number (also used for every frame of the count). Default: grouped, with the decimals of `value`. */
  format?: (n: number) => string
  /** Recent history, oldest first. Drawn as a tiny line that traces in. */
  spark?: number[]
  /** Uncertainty, in the same unit as `value`. Shown as "± 12". */
  tolerance?: number
}

export type ReadoutBarProps = {
  /** The readings, left to right. */
  items?: ReadoutItem[]
  /** Adds the pulse dot and a ticking "LIVE · 14:02:11" head row. */
  live?: boolean
  /** Overrides the ticking clock text in the live row (e.g. "14:02:11 UTC"). */
  timestamp?: string
  /** Specimen caption under the strip, shown as written: "FIG. 1 — Serving, last 60 s". */
  caption?: string
  /** Narrowest a column may get before the strip wraps into rows (px). Default 148. */
  minItemWidth?: number
  /** Count values to their target on mount and when they change. Default true. */
  animate?: boolean
  /** Accessible name for the group. Defaults to the caption, or "Key readings". */
  "aria-label"?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.irb {
  --irb-paper: #fafafa;
  --irb-sheet: #ffffff;
  --irb-ink: #0a0a0a;
  --irb-signal: #0060e2;
  --irb-accent: var(--irb-signal);
  --irb-surface: var(--irb-sheet);
  --irb-signal-soft: color-mix(in oklab, var(--irb-signal) 12%, transparent);
  --irb-t1: color-mix(in oklab, var(--irb-ink) 92%, transparent);
  --irb-t2: color-mix(in oklab, var(--irb-ink) 64%, transparent);
  --irb-t3: color-mix(in oklab, var(--irb-ink) 44%, transparent);
  --irb-t4: color-mix(in oklab, var(--irb-ink) 22%, transparent);
  --irb-rule: color-mix(in oklab, var(--irb-ink) 14%, transparent);
  --irb-rule-2: color-mix(in oklab, var(--irb-ink) 7%, transparent);
  --irb-ok: #1f8a4c;
  --irb-warn: #b7791f;
  --irb-bad: #c4321a;
  --irb-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --irb-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --irb-font: var(--irb-sans);
  --irb-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --irb-ease: cubic-bezier(.2, .8, .2, 1);
  --irb-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --irb-cols: 2;
  display: block;
  width: 100%;
  padding: 8px;
  font: 13px/20px var(--irb-font);
  color: var(--irb-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .irb {
  --irb-paper: #0c0c0d;
  --irb-sheet: #1c1c1e;
  --irb-ink: #f5f5f5;
  --irb-signal: #4d8dff;
  --irb-ok: #4cc27f;
  --irb-warn: #e0a64a;
  --irb-bad: #ff7a5c;
}
.irb *, .irb *::before, .irb *::after { box-sizing: border-box }
.irb :focus-visible { outline: 2px solid color-mix(in oklab, var(--irb-accent) 60%, transparent); outline-offset: 1px }

.irb-frame { position: relative }
.irb-crop { position: absolute; width: 8px; height: 8px; border: 0 solid var(--irb-t4); pointer-events: none }
.irb-crop[data-c="tl"] { left: -5px; top: -5px; border-width: 1px 0 0 1px }
.irb-crop[data-c="tr"] { right: -5px; top: -5px; border-width: 1px 1px 0 0 }
.irb-crop[data-c="bl"] { left: -5px; bottom: -5px; border-width: 0 0 1px 1px }
.irb-crop[data-c="br"] { right: -5px; bottom: -5px; border-width: 0 1px 1px 0 }

.irb-strip {
  container: irb / inline-size;
  display: grid;
  grid-template-columns: repeat(var(--irb-cols), minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  background: var(--irb-rule);
  box-shadow: 0 0 0 1px var(--irb-rule);
}
.irb-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 4px 16px;
  background: var(--irb-surface);
  font: 500 10.5px/16px var(--irb-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--irb-t3);
  font-variant-numeric: tabular-nums;
}
.irb-head b { font-weight: 500; color: var(--irb-t2) }
.irb-dot { position: relative; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--irb-accent) }
.irb-dot::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%;
  box-shadow: 0 0 0 1px var(--irb-accent);
  animation: irb-pulse 1.6s var(--irb-ease) infinite;
}
@keyframes irb-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }

.irb-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px 12px;
  background: var(--irb-surface);
  animation: irb-in 520ms var(--irb-ease) backwards;
  animation-delay: calc(var(--i, 0) * 45ms);
}
@keyframes irb-in { from { opacity: 0; transform: translateY(3px) } }
.irb-label {
  margin: 0;
  font: 500 10.5px/16px var(--irb-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--irb-t3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.irb-read { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 5px; min-width: 0 }
.irb-num {
  font: 500 28px/32px var(--irb-mono);
  letter-spacing: -.02em;
  font-variant-numeric: tabular-nums;
  color: var(--irb-t1);
  white-space: nowrap;
}
.irb-unit { font: 400 12px/16px var(--irb-mono); color: var(--irb-t3); white-space: nowrap }
.irb-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.irb-meta {
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0 10px;
  font: 400 11px/16px var(--irb-mono); font-variant-numeric: tabular-nums; color: var(--irb-t3);
}
.irb-meta:empty { display: none }
.irb-delta[data-tone="ok"] { color: var(--irb-ok) }
.irb-delta[data-tone="bad"] { color: var(--irb-bad) }
.irb-delta[data-tone="flat"] { color: var(--irb-t3) }
.irb-delta { animation: irb-in 520ms var(--irb-ease) backwards; animation-delay: calc(var(--i, 0) * 45ms + 220ms) }
.irb-tol { color: var(--irb-t3) }
.irb-spark { position: relative; height: 24px; margin-top: 2px }
.irb-spark svg { display: block; width: 100%; height: 100%; overflow: visible }
.irb-spark path {
  fill: none; stroke: var(--irb-t2); stroke-width: 1.25;
  stroke-linejoin: round; stroke-linecap: round;
  stroke-dasharray: 1; stroke-dashoffset: 0;
  animation: irb-trace 800ms var(--irb-ease-trace) backwards;
  animation-delay: calc(var(--i, 0) * 45ms + 150ms);
}
@keyframes irb-trace { from { stroke-dashoffset: 1 } }
.irb-spark-end {
  position: absolute; right: 0; width: 5px; height: 5px; margin: -2.5px 0 0 0;
  border-radius: 50%; background: var(--irb-t1);
  animation: irb-in 300ms var(--irb-ease) backwards; animation-delay: calc(var(--i, 0) * 45ms + 800ms);
}
.irb-cap {
  margin: 10px 0 0;
  font: 500 10.5px/16px var(--irb-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--irb-t3);
}

@container irb (max-width: 520px) { .irb-num { font-size: 24px; line-height: 28px } .irb-cell { padding: 12px 14px 10px } .irb-head { padding-inline: 14px } }

@media (prefers-reduced-motion: reduce) {
  .irb *, .irb *::before, .irb *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function decimalsOf(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0
  const s = String(n)
  if (s.includes("e")) return 2
  return Math.min(3, (s.split(".")[1] ?? "").length)
}

function groupFormat(decimals: number) {
  return (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function onScreen(el: Element) {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < window.innerHeight && !document.hidden
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/** Fraction of the way from `from` to `to` at time t (0..1): counts up past the target by a sliver, then returns. */
function settleCurve(t: number, overshoot: number) {
  const peak = 0.62
  if (t >= 1) return 1
  if (t < peak) return easeOutCubic(t / peak) * (1 + overshoot)
  return 1 + overshoot - overshoot * easeInOut((t - peak) / (1 - peak))
}

/**
 * Writes the number straight into a span: counts to `target` with one overshoot-and-return (≤2% of the value).
 * The final text is set first and re-asserted by a timer, so it is never stuck mid-count if rAF is throttled.
 */
function useSettle(
  ref: React.RefObject<HTMLSpanElement | null>,
  target: number | string,
  format: (n: number) => string,
  animate: boolean,
  delay: number,
) {
  const shown = React.useRef<number | null>(null)
  const fmt = React.useRef(format)
  React.useLayoutEffect(() => {
    fmt.current = format
  })

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof target !== "number") {
      el.textContent = target
      shown.current = null
      return
    }
    const from = shown.current ?? 0
    const final = fmt.current(target)
    const change = target - from
    if (!animate || prefersReducedMotion() || change === 0 || !onScreen(el)) {
      el.textContent = final
      shown.current = target
      return
    }
    const overshoot = Math.min(0.06, (0.02 * Math.abs(target)) / Math.abs(change))
    const dur = 760
    el.textContent = fmt.current(from)
    shown.current = from
    let raf = 0
    let t0 = -1
    const frame = (now: number) => {
      if (t0 < 0) t0 = now + delay
      const t = (now - t0) / dur
      if (t < 0) {
        raf = requestAnimationFrame(frame)
        return
      }
      const v = from + change * settleCurve(Math.min(1, t), overshoot)
      shown.current = t >= 1 ? target : v
      el.textContent = t >= 1 ? final : fmt.current(v)
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const fallback = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      el.textContent = final
      shown.current = target
    }, dur + delay + 500)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [ref, target, animate, delay])
}

/** How many columns fit: a single row when every item has room, else a balanced grid of ≥ 2 columns. */
function pickColumns(width: number, n: number, minItem: number) {
  if (n <= 1) return 1
  if (width <= 0) return Math.min(n, 2)
  const fit = Math.max(2, Math.floor(width / minItem))
  if (n <= fit) return n
  const rows = Math.ceil(n / fit)
  return Math.ceil(n / rows)
}

function formatClock(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour12: false })
}

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

function Spark({ data }: { data: number[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = 24
  const pad = 3
  let d = ""
  let endY = H / 2
  if (w > 0 && data.length > 1) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const ys = data.map((v) => (max === min ? H / 2 : H - pad - ((v - min) / span) * (H - pad * 2)))
    endY = ys[ys.length - 1]
    d = ys.map((y, i) => `${i === 0 ? "M" : "L"}${((i / (data.length - 1)) * (w - 1)).toFixed(1)} ${y.toFixed(1)}`).join(" ")
  }
  return (
    <div className="irb-spark" ref={ref} aria-hidden="true">
      {d ? (
        <>
          <svg viewBox={`0 0 ${w} ${H}`} width={w} height={H}>
            <path d={d} pathLength={1} />
          </svg>
          <span className="irb-spark-end" style={{ top: endY }} />
        </>
      ) : null}
    </div>
  )
}

function Cell({
  item,
  index,
  animate,
  span,
}: {
  item: ReadoutItem
  index: number
  animate: boolean
  span: number
}) {
  const numRef = React.useRef<HTMLSpanElement>(null)
  const format = React.useMemo(
    () => item.format ?? groupFormat(typeof item.value === "number" ? decimalsOf(item.value) : 0),
    [item.format, item.value],
  )
  useSettle(numRef, item.value, format, animate, index * 45 + 80)

  const delta = typeof item.delta === "number" ? { value: item.delta } : item.delta
  let deltaTone: "ok" | "bad" | "flat" = "flat"
  let deltaText = ""
  let deltaWords = ""
  if (delta) {
    const up = delta.value > 0
    const good = delta.lowerIsBetter ? !up : up
    deltaTone = delta.value === 0 ? "flat" : good ? "ok" : "bad"
    const unit = delta.unit ?? "%"
    const amount = Math.abs(delta.value).toLocaleString("en-US", { maximumFractionDigits: Math.max(1, decimalsOf(delta.value)), minimumFractionDigits: delta.value === 0 ? 0 : Math.max(1, decimalsOf(delta.value)) })
    deltaText = `${delta.value === 0 ? "–" : up ? "▲" : "▼"} ${amount}${unit}`
    deltaWords = delta.value === 0 ? "unchanged" : `${up ? "up" : "down"} ${amount}${unit === "%" ? " percent" : ` ${unit}`}`
  }
  const tolText = item.tolerance != null ? `± ${format(item.tolerance)}` : ""
  const spoken =
    `${item.label}: ${typeof item.value === "number" ? format(item.value) : item.value}${item.unit ? ` ${item.unit}` : ""}` +
    (deltaWords ? `, ${deltaWords}` : "") +
    (tolText ? `, plus or minus ${format(item.tolerance as number)}` : "")

  return (
    <div
      className="irb-cell"
      role="group"
      aria-label={spoken}
      style={{ "--i": index, ...(span > 1 ? { gridColumn: `span ${span}` } : null) } as React.CSSProperties}
    >
      <p className="irb-label" aria-hidden="true">
        {item.label}
      </p>
      <p className="irb-read" aria-hidden="true">
        <span className="irb-num" ref={numRef} />
        {item.unit ? <span className="irb-unit">{item.unit}</span> : null}
      </p>
      <div className="irb-meta" aria-hidden="true">
        {delta ? (
          <span className="irb-delta" data-tone={deltaTone}>
            {deltaText}
          </span>
        ) : null}
        {tolText ? <span className="irb-tol">{tolText}</span> : null}
      </div>
      {item.spark && item.spark.length > 1 ? <Spark data={item.spark} /> : null}
    </div>
  )
}

function LiveHead({ timestamp }: { timestamp?: string }) {
  const [clock, setClock] = React.useState(() => formatClock(new Date()))
  React.useEffect(() => {
    if (timestamp) return
    const id = window.setInterval(() => {
      if (!document.hidden) setClock(formatClock(new Date()))
    }, 1000)
    return () => window.clearInterval(id)
  }, [timestamp])
  return (
    <div className="irb-head">
      <span className="irb-dot" aria-hidden="true" />
      <span>
        <b>Live</b> · {timestamp ?? clock}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const DEMO_ITEMS: ReadoutItem[] = [
  { label: "Requests", value: 1284, unit: "req/s", delta: 4.2, spark: [1100, 1150, 1130, 1190, 1220, 1210, 1260, 1284] },
  { label: "p95 latency", value: 412, unit: "ms", delta: { value: -3.1, lowerIsBetter: true }, tolerance: 18, spark: [450, 440, 438, 430, 436, 421, 418, 412] },
  { label: "Tokens out", value: 41.2, unit: "k/min", delta: 1.8, spark: [36, 37, 39, 38, 40, 40.5, 41, 41.2] },
  { label: "Cost", value: 0.0041, unit: "$/req", delta: { value: 0.6, lowerIsBetter: true }, format: (n) => n.toFixed(4) },
]

/**
 * A strip of key metrics separated by hairlines: mono label, big tabular number, delta, sparkline, tolerance.
 * Numbers settle when they change; `live` adds the pulse dot and a ticking timestamp. Wraps to a 2-column grid when narrow.
 */
export function ReadoutBar({
  items = DEMO_ITEMS,
  live = false,
  timestamp,
  caption,
  minItemWidth = 148,
  animate = true,
  className,
  "aria-label": ariaLabel,
}: ReadoutBarProps) {
  const stripRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const n = items.length

  React.useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cols = pickColumns(width, n, minItemWidth)
  const rem = n % cols
  const lastSpan = rem === 0 ? 1 : cols - rem + 1

  return (
    <figure className={cn("irb", className)} style={{ margin: 0 }}>
      <style href="readout-bar" precedence="default">
        {CSS}
      </style>
      <div className="irb-frame">
        <span className="irb-crop" data-c="tl" aria-hidden="true" />
        <span className="irb-crop" data-c="tr" aria-hidden="true" />
        <span className="irb-crop" data-c="bl" aria-hidden="true" />
        <span className="irb-crop" data-c="br" aria-hidden="true" />
        <div
          ref={stripRef}
          className="irb-strip"
          role="group"
          aria-label={ariaLabel ?? caption ?? "Key readings"}
          style={{ "--irb-cols": cols } as React.CSSProperties}
        >
          {live ? <LiveHead timestamp={timestamp} /> : null}
          {items.map((item, i) => (
            <Cell key={item.label} item={item} index={i} animate={animate} span={i === n - 1 ? lastSpan : 1} />
          ))}
        </div>
      </div>
      {caption ? <figcaption className="irb-cap">{caption}</figcaption> : null}
    </figure>
  )
}
