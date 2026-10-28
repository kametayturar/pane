"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UsageItem = {
  id: string
  label: string
  used: number
  limit: number
  /** Shown after the numbers, e.g. "tokens". */
  unit?: string
  /** Extra line under the bar, e.g. "Resets daily". Replaces the "N left" text. */
  hint?: string
  /** Custom number formatting (defaults to compact: 1.2K, 3.4M). */
  format?: (value: number) => string
}

export type UsageMeterProps = {
  items?: UsageItem[]
  title?: string
  /** Plan chip next to the title, e.g. "Pro". */
  plan?: string
  /** Billing period text on the right, e.g. "Resets in 12 days". */
  period?: string
  /** `bar` is a continuous track, `segments` a row of 20 blocks. */
  variant?: "bar" | "segments"
  /** Fraction (0–1) at which a meter turns to the warning colour. */
  warnAt?: number
  /** Fraction (0–1) at which a meter turns to the critical colour. */
  criticalAt?: number
  /** Simulate usage climbing, so the thresholds can be seen. */
  autoPlay?: boolean
  /** Shows an upgrade button; it becomes the main action once a limit is hit. */
  onUpgrade?: () => void
  upgradeLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const SEGMENTS = 20

const CSS = `
.um {
  --um-ink: #000;
  --um-surface: #fff;
  --um-accent: #0060e2;
  --um-warn: #d98100;
  --um-err: #e5484d;
  --um-t1: color-mix(in oklab, var(--um-ink) 88%, transparent);
  --um-t2: color-mix(in oklab, var(--um-ink) 61%, transparent);
  --um-t3: color-mix(in oklab, var(--um-ink) 45%, transparent);
  --um-t4: color-mix(in oklab, var(--um-ink) 27%, transparent);
  --um-fill: color-mix(in oklab, var(--um-ink) 6%, transparent);
  --um-line: color-mix(in oklab, var(--um-ink) 6%, transparent);
  --um-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --um-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  background: var(--um-surface);
  box-shadow: var(--um-shadow);
  color: var(--um-t1);
  font-family: var(--um-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .um {
  --um-ink: #fff;
  --um-surface: #1c1c1e;
  --um-accent: #4d8dff;
  --um-warn: #f5a524;
  --um-err: #ff6369;
  --um-t1: color-mix(in oklab, var(--um-ink) 90%, transparent);
  --um-t2: color-mix(in oklab, var(--um-ink) 62%, transparent);
  --um-t3: color-mix(in oklab, var(--um-ink) 46%, transparent);
  --um-t4: color-mix(in oklab, var(--um-ink) 28%, transparent);
  --um-fill: color-mix(in oklab, var(--um-ink) 8%, transparent);
  --um-line: color-mix(in oklab, var(--um-ink) 8%, transparent);
  --um-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.um *, .um *::before, .um *::after { box-sizing: border-box }
.um button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.um :focus-visible { outline: 2px solid color-mix(in oklab, var(--um-accent) 60%, transparent); outline-offset: 1px }

.um-head { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-bottom: .5px solid var(--um-line) }
.um-title { font-weight: 500; color: var(--um-t1) }
.um-plan { height: 18px; padding: 0 6px; border-radius: 9px; background: var(--um-fill); font-size: 11px; line-height: 18px; font-weight: 500; color: var(--um-t2) }
.um-period { margin-left: auto; font-size: 12px; color: var(--um-t3); font-variant-numeric: tabular-nums }
.um .um-up {
  height: 26px; padding: 0 10px; border-radius: 6px; background: var(--um-fill); font-size: 12px; line-height: 16px; font-weight: 500;
  color: var(--um-t1); transition: background-color .16s, color .16s;
}
.um .um-up:hover { background: color-mix(in oklab, var(--um-ink) 10%, transparent) }
.um[data-full] .um-up { background: var(--um-ink); color: var(--um-surface) }
.um[data-full] .um-up:hover { background: color-mix(in oklab, var(--um-ink) 82%, transparent) }
.um-head .um-up { margin-left: auto; margin-right: -4px }
.um-head .um-period + .um-up { margin-left: 4px }

.um-list { margin: 0; padding: 4px 16px 6px; list-style: none }
.um-row { padding: 12px 0; animation: um-in .5s var(--um-ease) backwards }
.um-row + .um-row { border-top: .5px solid var(--um-line) }
.um-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px }
.um-label { font-weight: 500; color: var(--um-t1) }
.um-num { font-variant-numeric: tabular-nums; color: var(--um-t2); white-space: nowrap }
.um-num b { font-weight: 500; color: var(--um-t1) }
.um-row[data-level="warn"] .um-num b { color: var(--um-warn) }
.um-row[data-level="critical"] .um-num b { color: var(--um-err) }

.um-track { position: relative; height: 6px; margin: 8px 0 6px; border-radius: 3px; background: var(--um-fill); overflow: hidden }
.um-fillbar {
  display: block; width: 100%; height: 100%; border-radius: 3px; background: var(--um-c, var(--um-accent));
  transform-origin: left; transform: scaleX(var(--um-p, 0));
  transition: transform .9s var(--um-ease), background-color .4s;
  animation: um-grow 1.1s var(--um-ease) backwards;
}
.um-seg { display: grid; grid-template-columns: repeat(${SEGMENTS}, 1fr); gap: 2px; height: 10px; margin: 8px 0 6px }
.um-seg i {
  border-radius: 1.5px; background: var(--um-fill);
  transition: background-color .3s calc(var(--n) * 14ms), transform .4s calc(var(--n) * 14ms) var(--um-ease);
}
.um-seg i[data-on] { background: var(--um-c, var(--um-accent)) }
.um-row[data-level="warn"] { --um-c: var(--um-warn) }
.um-row[data-level="critical"] { --um-c: var(--um-err) }

.um-foot { display: flex; align-items: center; gap: 8px; min-height: 16px; font-size: 12px; line-height: 16px; color: var(--um-t3) }
.um-badge { margin-left: auto; font-weight: 500; color: var(--um-c, var(--um-t2)); animation: um-in .4s var(--um-ease) backwards }

.um-alert {
  display: flex; align-items: center; gap: 10px; margin: 0 8px 8px; padding: 10px 10px 10px 12px; border-radius: 8px;
  background: color-mix(in oklab, var(--um-err) 8%, transparent); color: var(--um-t1); animation: um-in .5s var(--um-ease) backwards;
}
.um-alert svg { flex: none; width: 16px; height: 16px; color: var(--um-err) }
.um-alert span { flex: 1; min-width: 0 }

@keyframes um-in { from { opacity: 0; filter: blur(3px); transform: translateY(5px) } }
@keyframes um-grow { from { transform: scaleX(0) } }

@media (prefers-reduced-motion: reduce) {
  .um *, .um *::before, .um *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const defaultFormat = (n: number) => compact.format(n)

const DEFAULT_ITEMS: UsageItem[] = [
  { id: "tokens", label: "Model tokens", used: 3_480_000, limit: 5_000_000, unit: "tokens", hint: "Resets with your billing period" },
  { id: "agents", label: "Agent runs", used: 1_184, limit: 2_000, unit: "runs" },
  { id: "storage", label: "Knowledge storage", used: 2.1, limit: 10, unit: "GB", format: (n) => n.toFixed(1) },
  { id: "seats", label: "Team seats", used: 6, limit: 10, unit: "seats", format: (n) => String(Math.round(n)) },
]

const level = (p: number, warnAt: number, criticalAt: number) => (p >= criticalAt ? "critical" : p >= warnAt ? "warn" : "ok")

/** Counts a number up (or down) to its target instead of jumping. */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = React.useState(0)
  const from = React.useRef(0)
  React.useEffect(() => {
    const start = from.current
    if (start === value) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reduce ? 0 : 900
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const k = duration === 0 ? 1 : Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - k, 4)
      const v = start + (value - start) * eased
      from.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(shown)}</>
}

/* -------------------------------------------------------------------------- */
/*                                 UsageMeter                                 */
/* -------------------------------------------------------------------------- */

export function UsageMeter({
  items = DEFAULT_ITEMS,
  title = "Usage",
  plan,
  period,
  variant = "bar",
  warnAt = 0.8,
  criticalAt = 0.95,
  autoPlay = false,
  onUpgrade,
  upgradeLabel = "Upgrade plan",
  className,
}: UsageMeterProps) {
  // Simulation: the first item climbs a step per tick, holds at its limit for a moment, then starts over.
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    if (!autoPlay) return
    const id = window.setInterval(() => setTick((t) => t + 1), 800)
    return () => window.clearInterval(id)
  }, [autoPlay])

  const first = items[0]
  const stepsToFull = first ? Math.ceil((first.limit - first.used) / (first.limit * 0.035)) : 0
  const cycle = stepsToFull + 5
  const phase = autoPlay ? tick % Math.max(1, cycle) : 0

  const rows = items.map((item, i) => {
    let used = item.used
    if (autoPlay && i === 0) used = Math.min(item.limit, item.used + phase * item.limit * 0.035)
    else if (autoPlay && i === 1) used = Math.min(item.limit, item.used + phase * item.limit * 0.012)
    return { item, used, p: item.limit > 0 ? Math.min(1, used / item.limit) : 0 }
  })
  const full = rows.find((r) => r.p >= 1)

  return (
    <section className={cn("um", className)} data-full={full ? "" : undefined} aria-label={title}>
      <style href="usage-meter" precedence="default">
        {CSS}
      </style>

      <div className="um-head">
        <span className="um-title">{title}</span>
        {plan && <span className="um-plan">{plan}</span>}
        {period && <span className="um-period">{period}</span>}
        {onUpgrade && !full && (
          <button type="button" className="um-up" onClick={onUpgrade}>
            {upgradeLabel}
          </button>
        )}
      </div>

      <ul className="um-list">
        {rows.map(({ item, used, p }, i) => {
          const lvl = level(p, warnAt, criticalAt)
          const fmt = item.format ?? defaultFormat
          const left = Math.max(0, item.limit - used)
          const pct = Math.round(p * 100)
          const lit = Math.round(p * SEGMENTS)
          return (
            <li key={item.id} className="um-row" data-level={lvl} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="um-top">
                <span className="um-label" id={`um-${item.id}`}>
                  {item.label}
                </span>
                <span className="um-num">
                  <b>
                    <Count value={used} format={fmt} />
                  </b>{" "}
                  / {fmt(item.limit)}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              </div>

              <div
                role="meter"
                aria-labelledby={`um-${item.id}`}
                aria-valuemin={0}
                aria-valuemax={item.limit}
                aria-valuenow={Math.round(used)}
                aria-valuetext={`${fmt(used)} of ${fmt(item.limit)}${item.unit ? ` ${item.unit}` : ""}, ${pct}%`}
                style={{ "--um-p": p } as React.CSSProperties}
                className={variant === "segments" ? "um-seg" : "um-track"}
              >
                {variant === "segments" ? (
                  Array.from({ length: SEGMENTS }, (_, n) => <i key={n} data-on={n < lit || undefined} style={{ "--n": n } as React.CSSProperties} />)
                ) : (
                  <span className="um-fillbar" />
                )}
              </div>

              <div className="um-foot" aria-live="polite">
                <span>{item.hint ?? `${fmt(left)} left`}</span>
                {lvl !== "ok" && (
                  <span className="um-badge" key={lvl}>
                    {p >= 1 ? "Limit reached" : lvl === "critical" ? "Almost out" : "Running low"}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {full && (
        <div className="um-alert" role="alert">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 2.8 14 13H2L8 2.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M8 6.6v2.8M8 11.3v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span>
            You&apos;ve used all of your {full.item.label.toLowerCase()}. New requests are paused until the plan resets.
          </span>
          {onUpgrade && (
            <button type="button" className="um-up" onClick={onUpgrade}>
              {upgradeLabel}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
