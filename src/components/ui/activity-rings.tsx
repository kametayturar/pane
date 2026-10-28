"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ActivityMetric = {
  /** Stable id; used as the key in every day's `values`. */
  id: string
  label: string
  /** Unit shown after the numbers, e.g. "min". */
  unit: string
  /** The daily goal. A value at the goal fills the ring; more traces a second lap. */
  goal: number
  /** Any CSS colour. Falls back to indigo, amber, sage, rose. */
  color?: string
}

export type ActivityDay = {
  id: string
  /** Full date, read by assistive technology. */
  label: string
  /** Short text shown under the day, e.g. "Mon". */
  short: string
  /** Value per metric id. */
  values: Record<string, number>
}

export type ActivityRingsProps = {
  /** One ring per metric, from the outside in (up to four read well). */
  metrics: ActivityMetric[]
  days: ActivityDay[]
  /** Controlled selected day id. */
  day?: string
  /** Initial day when uncontrolled. Defaults to the last day. */
  defaultDay?: string
  onDayChange?: (day: string) => void
  /** Controlled isolated metric id. */
  focused?: string | null
  defaultFocused?: string | null
  onFocusedChange?: (metric: string | null) => void
  /** Called when a value on the same day crosses its goal. */
  onRingClose?: (metric: string, day: string) => void
  /** Accessible name of the section. Default "Activity". */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.arg {
  --arg-ink: oklch(.15 0 0); --arg-surface: #fff; --arg-ease: cubic-bezier(.22, 1, .36, 1);
  --arg-t1: var(--arg-ink); --arg-t2: color-mix(in oklab, var(--arg-ink) 62%, transparent); --arg-t3: color-mix(in oklab, var(--arg-ink) 42%, transparent);
  --arg-tick: color-mix(in oklab, var(--arg-ink) 11%, transparent);
  --arg-fill: color-mix(in oklab, var(--arg-ink) 4.5%, transparent); --arg-line: color-mix(in oklab, var(--arg-ink) 9%, transparent);
  container-type: inline-size; display: grid; gap: 20px; width: 100%; max-width: 38rem; margin-inline: auto; color: var(--arg-t1);
  font-family: var(--arg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); font-size: 14px; line-height: 1.4; letter-spacing: -.01em;
  -webkit-font-smoothing: antialiased }
:is(.dark, [data-theme="dark"]) .arg { --arg-ink: oklch(.97 0 0); --arg-surface: #171717; --arg-tick: color-mix(in oklab, var(--arg-ink) 14%, transparent); --arg-fill: color-mix(in oklab, var(--arg-ink) 7%, transparent); --arg-line: color-mix(in oklab, var(--arg-ink) 12%, transparent) }
.arg *, .arg *::before, .arg *::after { box-sizing: border-box }
.arg button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
.arg :focus-visible { outline: 2px solid color-mix(in oklab, var(--arg-ink) 55%, transparent); outline-offset: 1px }

.arg-main { display: grid; gap: 16px; justify-items: stretch; align-items: center }
.arg-dial { position: relative; width: 184px; height: 184px; justify-self: center; flex: none }
.arg-svg { display: block; width: 100%; height: 100%; overflow: visible }
.arg-ring { transition: opacity .35s var(--arg-ease) }
.arg-ring[data-dim] { opacity: .2 }
.arg-base line { stroke: var(--arg-tick); stroke-width: 2.2; stroke-linecap: round }
.arg-fill line { stroke: var(--rc); stroke-width: 2.6; stroke-linecap: round }
.arg-lap { fill: none; stroke: var(--rc); stroke-width: 1.5; stroke-linecap: round; opacity: 0 }
.arg-mark-halo { stroke: var(--arg-surface); stroke-width: 8; stroke-linecap: round }
.arg-mark { stroke: var(--arg-ink); stroke-width: 4; stroke-linecap: round }
.arg-ring[data-pop] { animation: arg-pop .8s var(--arg-ease) }
@keyframes arg-pop { 0% { opacity: 1 } 25% { opacity: .35 } 55% { opacity: 1 } 70% { opacity: .55 } 100% { opacity: 1 } }

.arg-center { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none }
.arg-ci { display: grid; justify-items: center; gap: 2px; width: 88px }
.arg-cv { display: flex; align-items: baseline; gap: 1px; font-size: 28px; line-height: 28px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; font-weight: 400 }
.arg-cu { font-size: 16px; line-height: 16px; color: var(--arg-t2); letter-spacing: -.03em }
.arg-cl { max-width: 88px; font-size: 12px; line-height: 15px; color: var(--arg-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; animation: arg-in .45s var(--arg-ease) backwards }
@keyframes arg-in { from { opacity: 0; filter: blur(3px); transform: translateY(3px) } }

.arg-legend { display: grid; gap: 2px; min-width: 0 }
.arg-row { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 12px; border-radius: 18px; transition: opacity .3s var(--arg-ease), background-color .25s var(--arg-ease) }
.arg-row:hover { background: var(--arg-fill) }
.arg-row[aria-pressed="true"] { background: var(--arg-fill) }
.arg-row[data-dim] { opacity: .38 }
.arg-sw { flex: none; width: 3px; align-self: stretch; margin-block: 3px; border-radius: 2px; background: var(--rc) }
.arg-lt { flex: 1; min-width: 0; display: grid }
.arg-ll { font-size: 14px; line-height: 19.6px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.arg-lv { font-size: 12px; line-height: 16.8px; color: var(--arg-t2); font-variant-numeric: tabular-nums; white-space: nowrap }
.arg-lp { flex: none; font-size: 14px; line-height: 19.6px; color: var(--arg-t2); font-variant-numeric: tabular-nums }

.arg-week { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px }
.arg-hl { position: absolute; left: 0; top: 0; bottom: 0; width: calc((100% - (var(--n) - 1) * 2px) / var(--n)); border-radius: 18px; background: var(--arg-fill);
  transform: translateX(calc(var(--i) * (100% + 2px))); transition: transform .5s var(--arg-ease) }
.arg-day { position: relative; display: grid; justify-items: center; gap: 4px; padding: 8px 0 6px; border-radius: 18px; font-size: 12px; line-height: 16.8px; color: var(--arg-t2); transition: color .25s var(--arg-ease) }
.arg-day:hover { color: var(--arg-t1) }
.arg-day[aria-checked="true"] { color: var(--arg-t1) }
.arg-mini { width: 30px; height: 30px; display: block }
.arg-mini circle { fill: none; stroke-width: 3; transform: rotate(-90deg); transform-origin: 15px 15px }
.arg-mt { stroke: var(--arg-line) }
.arg-ma { stroke: var(--rc); stroke-linecap: round; transition: stroke-dasharray .8s var(--arg-ease) }

@container (min-width: 30rem) {
  .arg-main { grid-template-columns: auto minmax(0, 1fr); gap: 24px }
  .arg-dial { justify-self: start }
}
@container (max-width: 22rem) { .arg-row { padding-inline: 8px; gap: 10px } .arg-day { font-size: 11px } }

@media (prefers-reduced-motion: reduce) {
  .arg *, .arg *::before, .arg *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const COLORS = ["oklch(60% .17 275)", "oklch(75% .15 68)", "oklch(66% .09 160)", "oklch(65% .15 10)"]

/** Geometry of ring k (outermost = 0): tick radii, tick count and the lap radius, in the 220-unit viewBox. */
function ringGeometry(k: number) {
  const outer = 105 - 20 * k
  const inner = outer - 11
  const mid = (outer + inner) / 2
  const n = Math.max(12, 4 * Math.round((2 * Math.PI * mid) / 11.4 / 4))
  return { outer, inner, mid, n, lap: inner - 5 }
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const cur = controlled ? value : inner
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange],
  )
  return [cur, set]
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

type Tween = { cur: number; from: number; to: number; t0: number; dur: number }

/* -------------------------------------------------------------------------- */
/*                                    Rings                                   */
/* -------------------------------------------------------------------------- */

type RingTicksProps = { k: number; color: string; maskId: string; dim: boolean; index: number }

const RingTicks = React.memo(function RingTicks({ k, color, maskId, dim, index }: RingTicksProps) {
  const g = ringGeometry(k)
  const lines = React.useMemo(
    () =>
      Array.from({ length: g.n }, (_, i) => {
        const a = (i / g.n) * Math.PI * 2 - Math.PI / 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        return [110 + c * g.inner, 110 + s * g.inner, 110 + c * g.outer, 110 + s * g.outer] as const
      }),
    [g.n, g.inner, g.outer],
  )
  return (
    <g className="arg-ring" data-ring={index} data-dim={dim || undefined} style={{ "--rc": color } as React.CSSProperties}>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
        <g transform="rotate(-90 110 110)">
          <circle data-arc cx="110" cy="110" r={g.mid} fill="none" stroke="white" strokeWidth="17" pathLength={1} strokeDasharray="0 1" />
        </g>
      </mask>
      <g className="arg-base">
        {lines.map((l, i) => (
          <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
        ))}
      </g>
      <g className="arg-fill" mask={`url(#${maskId})`}>
        {lines.map((l, i) => (
          <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
        ))}
      </g>
      <g transform="rotate(-90 110 110)">
        <circle data-lap className="arg-lap" cx="110" cy="110" r={g.lap} pathLength={1} strokeDasharray="0 1" />
      </g>
      <g data-mark opacity="0">
        <line className="arg-mark-halo" x1={110 + g.inner - 2} y1="110" x2={110 + g.outer + 2} y2="110" />
        <line className="arg-mark" x1={110 + g.inner - 2} y1="110" x2={110 + g.outer + 2} y2="110" />
      </g>
    </g>
  )
})

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/** Daily goals drawn as concentric tick rings. Arcs sweep to each day's value, a second lap traces the inside edge past 100%, and the numbers count to their new amounts. */
export function ActivityRings({
  metrics,
  days,
  day: dayProp,
  defaultDay,
  onDayChange,
  focused: focusedProp,
  defaultFocused = null,
  onFocusedChange,
  onRingClose,
  label = "Activity",
  className,
}: ActivityRingsProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [day, setDay] = useControllable<string>(dayProp, defaultDay ?? days[days.length - 1]?.id ?? "", onDayChange)
  const [focused, setFocused] = useControllable<string | null>(focusedProp, defaultFocused, onFocusedChange)
  const [hot, setHot] = React.useState<string | null>(null)

  const dayIndex = Math.max(0, days.findIndex((d) => d.id === day))
  const current = days[dayIndex]
  const ratios = metrics.map((m) => (m.goal > 0 ? (current?.values[m.id] ?? 0) / m.goal : 0))
  const spot = focused ?? hot
  const colors = metrics.map((m, i) => m.color ?? COLORS[i % COLORS.length])

  // Targets of the sweep: one ratio per ring plus the centre percentage.
  const centerTarget = focused
    ? (ratios[metrics.findIndex((m) => m.id === focused)] ?? 0) * 100
    : metrics.length
      ? (ratios.reduce((a, r) => a + Math.min(1, r), 0) / metrics.length) * 100
      : 0

  const rootRef = React.useRef<HTMLElement>(null)
  const tweens = React.useRef<{ rings: Tween[]; center: Tween; raf: number }>({ rings: [], center: { cur: 0, from: 0, to: 0, t0: 0, dur: 1 }, raf: 0 })
  const latest = React.useRef({ metrics, ratios, centerTarget })
  React.useLayoutEffect(() => {
    latest.current = { metrics, ratios, centerTarget }
  })

  /** Writes the current tween values straight into the SVG and text nodes. */
  const paint = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const { metrics: ms } = latest.current
    const tw = tweens.current
    ms.forEach((m, i) => {
      const f = tw.rings[i]?.cur ?? 0
      const ring = root.querySelector<SVGGElement>(`[data-ring="${i}"]`)
      if (ring) {
        const a = Math.min(1, Math.max(0, f))
        const l = Math.min(1, Math.max(0, f - 1))
        ring.querySelector("[data-arc]")?.setAttribute("stroke-dasharray", `${a} 1`)
        const lap = ring.querySelector<SVGCircleElement>("[data-lap]")
        if (lap) {
          lap.setAttribute("stroke-dasharray", `${l} 1`)
          lap.style.opacity = l > 0.001 ? "1" : "0"
        }
        const mark = ring.querySelector<SVGGElement>("[data-mark]")
        if (mark) {
          const head = f > 1 ? l : a
          mark.setAttribute("transform", `rotate(${head * 360 - 90} 110 110)`)
          mark.setAttribute("opacity", f > 0.004 ? "1" : "0")
        }
      }
      const val = root.querySelector(`[data-lv="${i}"]`)
      if (val) val.textContent = `${Math.round(f * m.goal).toLocaleString("en-US")} / ${m.goal.toLocaleString("en-US")} ${m.unit}`
      const pct = root.querySelector(`[data-lp="${i}"]`)
      if (pct) pct.textContent = `${Math.round(f * 100)}%`
    })
    const cv = root.querySelector("[data-cv]")
    if (cv) cv.textContent = String(Math.round(tw.center.cur))
  }, [])

  const run = React.useCallback(() => {
    const tw = tweens.current
    cancelAnimationFrame(tw.raf)
    const step = (now: number) => {
      let live = false
      const adv = (t: Tween) => {
        const u = Math.min(1, Math.max(0, (now - t.t0) / t.dur))
        t.cur = t.from + (t.to - t.from) * easeOut(u)
        if (u < 1) live = true
      }
      tw.rings.forEach(adv)
      adv(tw.center)
      paint()
      if (live) tw.raf = requestAnimationFrame(step)
    }
    tw.raf = requestAnimationFrame(step)
  }, [paint])

  // Retarget the sweep whenever the ratios change: every ring starts from what is on screen, so a second change redirects mid-flight.
  const ratioKey = ratios.map((r) => r.toFixed(4)).join(",") + "|" + centerTarget.toFixed(3) + "|" + metrics.length
  const first = React.useRef(true)
  React.useLayoutEffect(() => {
    const tw = tweens.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const now = performance.now()
    const { ratios: rs, centerTarget: ct } = latest.current
    if (first.current) {
      first.current = false
      tw.rings = rs.map(() => ({ cur: 0, from: 0, to: 0, t0: now, dur: 1 }))
      tw.center = { cur: 0, from: 0, to: 0, t0: now, dur: 1 }
    }
    while (tw.rings.length < rs.length) tw.rings.push({ cur: 0, from: 0, to: 0, t0: now, dur: 1 })
    tw.rings.length = rs.length
    rs.forEach((r, i) => {
      const t = tw.rings[i]
      t.from = t.cur
      t.to = r
      t.t0 = now + (reduce ? 0 : i * 70)
      t.dur = reduce ? 1 : 700 + 550 * Math.min(1, Math.abs(r - t.cur))
    })
    tw.center.from = tw.center.cur
    tw.center.to = ct
    tw.center.t0 = now
    tw.center.dur = reduce ? 1 : 900
    paint()
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratioKey, run, paint])
  React.useEffect(() => () => cancelAnimationFrame(tweens.current.raf), [])

  // Announce goals that were just reached (a value on the same day crossing its goal).
  const prev = React.useRef<{ day: string; r: Record<string, number> } | null>(null)
  React.useEffect(() => {
    const now = Object.fromEntries(metrics.map((m, i) => [m.id, ratios[i]]))
    const p = prev.current
    if (p && p.day === day) {
      metrics.forEach((m) => {
        if ((p.r[m.id] ?? 0) < 1 && now[m.id] >= 1) {
          onRingClose?.(m.id, day)
          const ring = rootRef.current?.querySelector<SVGGElement>(`[data-ring="${metrics.indexOf(m)}"]`)
          if (ring) {
            ring.removeAttribute("data-pop")
            void ring.getBoundingClientRect()
            ring.setAttribute("data-pop", "")
          }
        }
      })
    }
    prev.current = { day, r: now }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratioKey, day])

  const pick = (id: string) => setFocused(focused === id ? null : id)

  const onWeekKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = -1
    if (e.key in keys) next = Math.min(days.length - 1, Math.max(0, dayIndex + keys[e.key]))
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = days.length - 1
    if (next < 0) return
    e.preventDefault()
    setDay(days[next].id)
    ;(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus()
  }

  const summary = `${current?.label ?? ""}: ${metrics.map((m, i) => `${m.label} ${Math.round(ratios[i] * 100)}%`).join(", ")}`
  const focusedMetric = metrics.find((m) => m.id === focused)

  return (
    <section ref={rootRef} className={cn("arg", className)} aria-label={label}>
      <style href="arg" precedence="default">
        {CSS}
      </style>
      <div className="arg-main">
        <div className="arg-dial">
          <svg className="arg-svg" viewBox="0 0 220 220" role="img" aria-label={summary}>
            {metrics.map((m, i) => (
              <RingTicks key={m.id} k={i} index={i} color={colors[i]} maskId={`arg-${uid}-${i}`} dim={spot !== null && spot !== m.id} />
            ))}
          </svg>
          <div className="arg-center" aria-hidden="true">
            <div className="arg-ci">
              <span className="arg-cv">
                <span data-cv>0</span>
                <span className="arg-cu">%</span>
              </span>
              <span className="arg-cl" key={focusedMetric?.id ?? "all"}>
                {focusedMetric ? focusedMetric.label : "of goals"}
              </span>
            </div>
          </div>
        </div>

        <div className="arg-legend" role="group" aria-label="Goals" onPointerLeave={() => setHot(null)}>
          {metrics.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className="arg-row"
              aria-pressed={focused === m.id}
              aria-label={`${m.label}, ${Math.round(ratios[i] * m.goal).toLocaleString("en-US")} of ${m.goal.toLocaleString("en-US")} ${m.unit}, ${Math.round(ratios[i] * 100)} percent`}
              data-dim={spot !== null && spot !== m.id ? "" : undefined}
              style={{ "--rc": colors[i] } as React.CSSProperties}
              onClick={() => pick(m.id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHot(m.id)}
            >
              <span className="arg-sw" />
              <span className="arg-lt" aria-hidden="true">
                <span className="arg-ll">{m.label}</span>
                <span className="arg-lv" data-lv={i} />
              </span>
              <span className="arg-lp" aria-hidden="true" data-lp={i} />
            </button>
          ))}
        </div>
      </div>

      <div className="arg-week" role="radiogroup" aria-label="Day" onKeyDown={onWeekKey} style={{ "--n": days.length, "--i": dayIndex } as React.CSSProperties}>
        <span className="arg-hl" aria-hidden="true" />
        {days.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            className="arg-day"
            aria-checked={d.id === day}
            aria-label={d.label}
            tabIndex={d.id === day ? 0 : -1}
            onClick={() => setDay(d.id)}
          >
            <svg className="arg-mini" viewBox="0 0 30 30" aria-hidden="true">
              {metrics.slice(0, 4).map((m, i) => {
                const r = 13 - i * 3.6
                const f = m.goal > 0 ? Math.min(1, (d.values[m.id] ?? 0) / m.goal) : 0
                return (
                  <g key={m.id} style={{ "--rc": colors[i] } as React.CSSProperties}>
                    <circle className="arg-mt" cx="15" cy="15" r={r} style={{ strokeWidth: 2.4 }} />
                    <circle className="arg-ma" cx="15" cy="15" r={r} pathLength={1} strokeDasharray={`${f} 1`} style={{ strokeWidth: 2.4, opacity: f > 0 ? 1 : 0 }} />
                  </g>
                )
              })}
            </svg>
            <span>{d.short}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
