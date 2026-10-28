"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ChangeTone = "good" | "bad" | "neutral"

export type MetricChange = {
  /** Metric name, e.g. "Active users". */
  label: string
  /** What happened, in words: "Up 6.1% to 18.2K". */
  change: string
  /** Colours the arrow: good = green, bad = red, neutral = grey. Defaults to neutral. */
  tone?: ChangeTone
  /** Arrow direction. Defaults to "up". */
  direction?: "up" | "down" | "flat"
}

export type ChangeSummaryProps = {
  /** One row per metric. Keep it to about six. */
  changes?: MetricChange[]
  /** Heading in the first row. */
  title?: string
  /** Small text on the right of the heading. */
  period?: string
  /** Replaces the icon in front of the heading. */
  icon?: React.ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cs {
  --cs-ink: #000;
  --cs-surface: #fff;
  --cs-accent: #0060e2;
  --cs-good: #1a9a52;
  --cs-bad: #e5484d;
  --cs-t1: color-mix(in oklab, var(--cs-ink) 88%, transparent);
  --cs-t2: color-mix(in oklab, var(--cs-ink) 61%, transparent);
  --cs-t3: color-mix(in oklab, var(--cs-ink) 45%, transparent);
  --cs-t4: color-mix(in oklab, var(--cs-ink) 27%, transparent);
  --cs-fill: color-mix(in oklab, var(--cs-ink) 6%, transparent);
  --cs-line: color-mix(in oklab, var(--cs-ink) 6%, transparent);
  --cs-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cs-ease: cubic-bezier(.22, 1, .36, 1);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--cs-surface);
  box-shadow: var(--cs-shadow);
  color: var(--cs-t1);
  font-family: var(--cs-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  animation: cs-card .32s var(--cs-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .cs {
  --cs-ink: #fff;
  --cs-surface: #1c1c1e;
  --cs-accent: #4d8dff;
  --cs-good: #3dd68c;
  --cs-bad: #ff6b70;
  --cs-t1: color-mix(in oklab, var(--cs-ink) 90%, transparent);
  --cs-t2: color-mix(in oklab, var(--cs-ink) 62%, transparent);
  --cs-t3: color-mix(in oklab, var(--cs-ink) 46%, transparent);
  --cs-t4: color-mix(in oklab, var(--cs-ink) 28%, transparent);
  --cs-fill: color-mix(in oklab, var(--cs-ink) 8%, transparent);
  --cs-line: color-mix(in oklab, var(--cs-ink) 8%, transparent);
  --cs-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.cs *, .cs *::before, .cs *::after { box-sizing: border-box }
.cs-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 44px; padding: 0 16px }
.cs-title { display: flex; align-items: center; gap: 8px; min-width: 0; margin: 0; font-size: 13px; font-weight: 500; line-height: 20px; color: var(--cs-ink) }
.cs-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--cs-t3) }
.cs-icon svg { width: 16px; height: 16px }
.cs-period { flex: none; font-size: 12px; line-height: 16px; color: var(--cs-t3) }
.cs-list { margin: 0; padding: 0 }
.cs-row {
  display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: center; gap: 16px;
  min-height: 48px; margin: 0; padding: 0 16px; border-top: .5px solid var(--cs-line);
  animation: cs-in .52s var(--cs-ease) backwards;
}
.cs-label { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--cs-t1) }
.cs-change { display: flex; align-items: center; gap: 8px; min-width: 0; margin: 0; color: var(--cs-t2) }
.cs-trend {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; border-radius: 5px;
  color: var(--cs-t3); background: var(--cs-fill);
}
.cs-trend svg { width: 12px; height: 12px }
.cs-trend[data-tone="good"] { color: var(--cs-good); background: color-mix(in oklab, var(--cs-good) 8%, transparent) }
.cs-trend[data-tone="bad"] { color: var(--cs-bad); background: color-mix(in oklab, var(--cs-bad) 8%, transparent) }
.cs-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
@media (max-width: 360px) {
  .cs-row { grid-template-columns: minmax(0, 1fr); gap: 2px; padding: 8px 16px }
}

@keyframes cs-card { from { opacity: 0; filter: blur(2px) } }
@keyframes cs-in { from { opacity: 0; transform: translateY(4px) } }

@media (prefers-reduced-motion: reduce) {
  .cs, .cs *, .cs *::before, .cs *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

const ARROWS = {
  up: "M6 9.5v-7M3 5.5l3-3 3 3",
  down: "M6 2.5v7M3 6.5l3 3 3-3",
  flat: "M2.5 6h7M6.5 3l3 3-3 3",
} as const

const DEFAULT_CHANGES: MetricChange[] = [
  { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good", direction: "up" },
  { label: "Activation", change: "Climbed to 41%, up 3 pts", tone: "good", direction: "up" },
  { label: "Churn", change: "Down to 2.1% from 2.6%", tone: "good", direction: "down" },
  { label: "Support tickets", change: "Up 14% to 312", tone: "bad", direction: "up" },
]

const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden>
    <path d="M2.5 4h4M2.5 8h8M6.5 12h7M9.5 4h1" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                               ChangeSummary                                */
/* -------------------------------------------------------------------------- */

/** A short recap of what moved since last time: one metric per row, with a coloured trend arrow. */
export function ChangeSummary({
  changes = DEFAULT_CHANGES,
  title = "What's changed",
  period,
  icon,
  className,
}: ChangeSummaryProps) {
  return (
    <section className={cn("cs", className)} aria-label={title}>
      <style href="change-summary" precedence="default">
        {CSS}
      </style>
      <header className="cs-head">
        <h3 className="cs-title">
          <span className="cs-icon" aria-hidden>
            {icon ?? <ListIcon />}
          </span>
          {title}
        </h3>
        {period && <span className="cs-period">{period}</span>}
      </header>
      {/* A description list: screen readers read each change together with its metric. */}
      <dl className="cs-list">
        {changes.map((c, i) => (
          <div key={`${c.label}-${i}`} className="cs-row" style={{ animationDelay: `${120 + i * 70}ms` }}>
            <dt className="cs-label">{c.label}</dt>
            <dd className="cs-change">
              <span className="cs-trend" data-tone={c.tone ?? "neutral"} aria-hidden>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ARROWS[c.direction ?? "up"]} />
                </svg>
              </span>
              <span className="cs-text">{c.change}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
