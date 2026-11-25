"use client"

/**
 * Landing Proof – social proof without logos.
 *
 * A short heading (with an optional muted second line), then a row of two to four figures, each a large number
 * with tabular digits over a one-line label, separated by hairlines, with an optional source line under them.
 * Under that, one or two quotes: a short paragraph in larger type in plain quotation marks, and the person's
 * name, role and company in muted text beside a monogram circle drawn from their initials (no photos).
 *
 * ```tsx
 * <LandingProof
 *   title="Customers hear back sooner."
 *   figures={[{ value: 4, suffix: " min", label: "median time to a first reply" }]}
 *   quotes={[{ text: "Atlas has a draft waiting on every ticket.", name: "Maya Lindqvist", role: "Support lead", company: "Harbor & Finch" }]}
 *   show="both" align="left"
 * />
 * ```
 *
 * Each number counts up once from zero when the figures enter the viewport, on the house easing curve, while
 * an invisible copy of the final value holds the width so nothing shifts. Screen readers get the final value
 * straight away. With reduced motion or `reveal={false}` the numbers are simply there. Content is plain data
 * (`DEFAULT_LANDING_PROOF`), so a page builder can edit and save it as JSON.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingProofFigure = {
  /** The number it counts up to, e.g. 3.2. */
  value: number
  /** Digits after the decimal point. Default 0. */
  decimals?: number
  /** Text before the number, e.g. "$". */
  prefix?: string
  /** Text after the number, e.g. "%" or " days" (include the space if you want one). */
  suffix?: string
  /** One line under the number. */
  label: string
}

export type LandingProofQuote = {
  /** The quote itself, without quotation marks (they are added). */
  text: string
  /** The person's name. Their initials draw the monogram. */
  name: string
  /** Their role, e.g. "Support lead". */
  role?: string
  /** Their company, e.g. "Harbor & Finch". */
  company?: string
}

export type LandingProofContent = {
  /** The heading. */
  title?: string
  /** A muted second line of the heading. Empty hides it. */
  titleMuted?: string
  /** Two to four figures. More are cut to four. */
  figures?: LandingProofFigure[]
  /** A small line under the figures saying where the numbers come from. Empty hides it. */
  source?: string
  /** One or two quotes. More are cut to two. */
  quotes?: LandingProofQuote[]
}

export type LandingProofProps = LandingProofContent & {
  /** "both" shows figures and quotes, "figures" or "quotes" only one of them. Default "both". */
  show?: "both" | "figures" | "quotes"
  /** "left" aligns to the start; "center" centres the heading, figures and quotes. Default "left". */
  align?: "left" | "center"
  /** Level of the heading element. Default 2. */
  headingLevel?: 2 | 3
  /** Max content width in px. Default 1200. */
  width?: number
  /** Rise and fade the parts in once and count the numbers up when they enter the viewport. Default true. */
  reveal?: boolean
  /** Id of the section element. */
  id?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LANDING_PROOF = {
  title: "Customers hear back sooner.",
  titleMuted: "And every answer was checked.",
  figures: [
    { value: 4, decimals: 0, prefix: "", suffix: " min", label: "Median time to a first reply, down from 6 hours" },
    { value: 91, decimals: 0, prefix: "", suffix: "%", label: "Of Atlas's drafts approved without an edit" },
    { value: 14, decimals: 0, prefix: "", suffix: " hrs", label: "Given back to each person on the team every week" },
  ],
  source: "Medians across 140 Northwind support teams in their first full quarter, 2026.",
  quotes: [
    {
      text: "Mondays used to start with two hundred unread tickets. Now Atlas has a draft waiting on each one, and I spend the morning approving instead of typing.",
      name: "Maya Lindqvist",
      role: "Support lead",
      company: "Harbor & Finch",
    },
    {
      text: "I read what Atlas wrote, change a word now and then and press send. Our customers noticed the faster replies before we told anyone.",
      name: "Daniel Okafor",
      role: "Founder",
      company: "Larkspur Studio",
    },
  ],
} satisfies Required<LandingProofContent>

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lprf {
  --lprf-ink: #000;
  --lprf-surface: #fff;
  --lprf-accent: var(--pane-accent, #0060e2);
  --lprf-t1: color-mix(in oklab, var(--lprf-ink) 88%, transparent);
  --lprf-t2: color-mix(in oklab, var(--lprf-ink) 62%, transparent);
  --lprf-t3: color-mix(in oklab, var(--lprf-ink) 45%, transparent);
  --lprf-fill: color-mix(in oklab, var(--lprf-ink) 6%, transparent);
  --lprf-line: color-mix(in oklab, var(--lprf-ink) 9%, transparent);
  --lprf-ease: cubic-bezier(.22, 1, .36, 1);
  --lprf-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --lprf-hk: 1;
  --lprf-hls: -.035em;
  --lprf-nls: -.035em;
  display: block;
  width: 100%;
  container: lprf / inline-size;
  font: 15px/24px var(--lprf-font);
  color: var(--lprf-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lprf {
  --lprf-ink: #fff;
  --lprf-surface: #161618;
  --lprf-accent: var(--pane-accent, #4d8dff);
  --lprf-t1: color-mix(in oklab, var(--lprf-ink) 92%, transparent);
  --lprf-t2: color-mix(in oklab, var(--lprf-ink) 64%, transparent);
  --lprf-t3: color-mix(in oklab, var(--lprf-ink) 46%, transparent);
  --lprf-fill: color-mix(in oklab, var(--lprf-ink) 9%, transparent);
  --lprf-line: color-mix(in oklab, var(--lprf-ink) 11%, transparent);
}

/* Mono: ink on paper, a stronger rule, square monograms and a monospaced face (a size smaller, it runs wider) */
html[data-style="mono"] .lprf {
  --lprf-accent: #111;
  --lprf-line: color-mix(in oklab, var(--lprf-ink) 14%, transparent);
  --lprf-ease: cubic-bezier(.2, .9, .1, 1);
  --lprf-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lprf-hk: .8; --lprf-hls: -.05em; --lprf-nls: -.02em;
}
html[data-style="mono"] .lprf-label { font-size: 13px; line-height: 20px }
html[data-style="mono"] .lprf-name { font-size: 13.5px }
html[data-style="mono"] .lprf-role { font-size: 12.5px }
html[data-style="mono"] .lprf-source { font-size: 12px }
html[data-style="mono"] .lprf[data-align="left"] .lprf-oq { margin-left: -1ch }
html[data-style="mono"].dark .lprf { --lprf-accent: #f2f2f2 }
html[data-style="mono"] .lprf-mono { border-radius: 4px; box-shadow: inset 0 0 0 1px var(--lprf-line); background: transparent }
html[data-style="mono"] .lprf-q p { font-size: calc(var(--lprf-qs) * .86) }

/* Glass: Pane's stronger text floors over the moving backdrop; the monogram is a small frosted chip */
html[data-style="glass"] .lprf {
  --lprf-ink: var(--pane-ink); --lprf-surface: var(--pane-solid); --lprf-accent: var(--pane-accent);
  --lprf-t1: var(--pane-t1); --lprf-t2: var(--pane-t2); --lprf-t3: var(--pane-t3);
  --lprf-line: color-mix(in oklab, var(--pane-ink) 14%, transparent);
  --lprf-ease: var(--pane-ease); --lprf-font: var(--pane-font);
}
html[data-style="glass"] .lprf-mono { background-color: var(--pane-tint-nested); box-shadow: var(--pane-shadow) }

.lprf *, .lprf *::before, .lprf *::after { box-sizing: border-box }
:where(.lprf) :is(h2, h3, p, ul, li, dl, dt, dd, figure, blockquote, figcaption) { margin: 0; padding: 0; list-style: none }
.lprf :focus-visible { outline: 2px solid var(--lprf-accent); outline-offset: 2px }

.lprf-in { max-width: calc(var(--lprf-width, 1200px) + 48px); margin: 0 auto; padding: 56px 24px }
@container lprf (min-width: 880px) { .lprf-in { padding: 96px 24px } }
.lprf[data-align="center"] .lprf-in { text-align: center }

/* ---- heading ---- */
.lprf-h {
  max-width: 22em; font-size: clamp(28px * var(--lprf-hk), 3cqi + 16px, 48px * var(--lprf-hk));
  line-height: 1.08; font-weight: 500; letter-spacing: var(--lprf-hls); color: var(--lprf-t1);
}
.lprf-h > span { display: block; text-wrap: balance }
.lprf-h > .lprf-h2 { color: var(--lprf-t3) }
.lprf[data-align="center"] .lprf-h { margin-inline: auto }

/* ---- figures ---- */
.lprf-figs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 24px; margin-top: 48px }
.lprf-fig { position: relative; min-width: 0; padding-top: 20px; border-top: 1px solid var(--lprf-line) }
.lprf[data-n="3"] .lprf-fig:first-child { grid-column: 1 / -1 }
@container lprf (min-width: 720px) {
  .lprf-figs { display: flex; gap: 0; margin-top: 64px }
  .lprf-fig { flex: 1 1 0; padding: 4px 32px 6px; border-top: 0; border-left: 1px solid var(--lprf-line) }
  .lprf-fig:first-child { padding-left: 0; border-left: 0 }
  .lprf-fig:last-child { padding-right: 0 }
  .lprf[data-align="center"] .lprf-figs { justify-content: center }
  .lprf[data-align="center"] .lprf-fig { flex: 0 1 280px; padding-inline: 32px }
  .lprf[data-align="center"] .lprf-fig:first-child { padding-left: 32px }
  .lprf[data-align="center"] .lprf-fig:last-child { padding-right: 32px }
}
.lprf-num {
  display: grid; font-size: clamp(40px * var(--lprf-hk), 4.4cqi + 18px, 64px * var(--lprf-hk)); line-height: 1.05; font-weight: 500;
  letter-spacing: var(--lprf-nls); color: var(--lprf-t1); font-variant-numeric: tabular-nums; white-space: nowrap;
}
.lprf-num > span { grid-area: 1 / 1 }
.lprf-num .lprf-hold { visibility: hidden }
.lprf[data-align="center"] .lprf-num { justify-items: center }
.lprf-label { display: block; margin-top: 12px; max-width: 24em; font-size: 14.5px; line-height: 22px; color: var(--lprf-t2); text-wrap: pretty }
.lprf[data-align="center"] .lprf-label { margin-inline: auto }
.lprf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.lprf-source { margin-top: 28px; font-size: 13px; line-height: 20px; color: var(--lprf-t2) }

/* ---- quotes ---- */
.lprf-quotes { --lprf-qs: clamp(19px, 1.2cqi + 14px, 24px); display: grid; gap: 48px; margin-top: 72px }
.lprf[data-show="quotes"] .lprf-quotes { margin-top: 48px }
.lprf[data-q="1"] .lprf-quotes { --lprf-qs: clamp(21px, 1.6cqi + 14px, 30px) }
@container lprf (min-width: 760px) {
  .lprf[data-q="2"] .lprf-quotes { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 64px }
  .lprf-quotes { margin-top: 96px }
  .lprf[data-show="quotes"] .lprf-quotes { margin-top: 56px }
}
.lprf-q { display: flex; flex-direction: column; justify-content: space-between; gap: 24px; min-width: 0 }
.lprf[data-q="1"] .lprf-q { max-width: 840px }
.lprf[data-align="center"] .lprf-q { align-items: center; margin-inline: auto }
.lprf-q p {
  font-size: var(--lprf-qs); line-height: 1.42; font-weight: 400; letter-spacing: -.012em; color: var(--lprf-t1); text-wrap: pretty;
}
.lprf[data-align="left"] .lprf-oq { margin-left: -.4em }
.lprf-who { display: flex; align-items: center; gap: 12px; text-align: left }
.lprf-mono {
  display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%;
  background: var(--lprf-fill); font-size: 13px; line-height: 1; font-weight: 500; letter-spacing: .02em; color: var(--lprf-t2);
}
.lprf-who-t { display: grid; min-width: 0 }
.lprf-name { font-size: 14.5px; line-height: 22px; font-weight: 500; font-style: normal; color: var(--lprf-t1) }
.lprf-role { font-size: 13.5px; line-height: 20px; color: var(--lprf-t2) }

/* ---- arrival: once, in reading order ---- */
.lprf[data-armed]:not([data-in]) .lprf-r { opacity: 0 }
.lprf[data-armed][data-in] .lprf-r { animation: lprf-rise 680ms var(--lprf-ease) backwards; animation-delay: calc(var(--i) * 70ms) }
@keyframes lprf-rise { from { opacity: 0; transform: translateY(14px) } }

@media (prefers-reduced-motion: reduce) {
  .lprf *, .lprf *::before, .lprf *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

const STAGGER = 70
const COUNT_MS = 1600

/** cubic-bezier(.22, 1, .36, 1) – the same curve the CSS uses – solved for y at a given x. */
function ease(x: number) {
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1]
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  const dx = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t
  let t = x
  for (let i = 0; i < 8; i++) {
    const err = at(x1, x2, t) - x
    const d = dx(t)
    if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break
    t = Math.min(1, Math.max(0, t - err / d))
  }
  return at(y1, y2, t)
}

function format(n: number, decimals: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)
}

/** Initials for the monogram: first and last word, letters only ("Maya Lindqvist" → "ML"). */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return "·"
  const first = Array.from(words[0])[0] ?? ""
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : ""
  return (first + last).toUpperCase()
}

/** A figure's number. React renders the final value; when `start` turns true the text counts up from zero via a ref. */
function CountUp({ figure, start, delay }: { figure: LandingProofFigure; start: boolean; delay: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const { value, decimals = 0, prefix = "", suffix = "" } = figure
  const final = `${prefix}${format(value, decimals)}${suffix}`

  React.useEffect(() => {
    const el = ref.current
    if (!start || !el) return
    let raf = 0
    let t0 = 0
    el.textContent = `${prefix}${format(0, decimals)}${suffix}`
    const tick = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / COUNT_MS)
      el.textContent = `${prefix}${format(value * ease(p), decimals)}${suffix}`
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    const begin = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay)
    // If frames never come (a throttled tab), the final value still lands.
    const settle = window.setTimeout(() => (el.textContent = final), delay + COUNT_MS + 400)
    return () => {
      window.clearTimeout(begin)
      window.clearTimeout(settle)
      cancelAnimationFrame(raf)
      el.textContent = final
    }
  }, [start, delay, value, decimals, prefix, suffix, final])

  return (
    <span className="lprf-num" aria-hidden>
      <span className="lprf-hold">{final}</span>
      <span ref={ref}>{final}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Proof                                   */
/* -------------------------------------------------------------------------- */

/** Social proof without logos: a short heading, two to four figures that count up once, and one or two quotes with monograms. */
export function LandingProof({
  title = DEFAULT_LANDING_PROOF.title,
  titleMuted = DEFAULT_LANDING_PROOF.titleMuted,
  figures = DEFAULT_LANDING_PROOF.figures,
  source = DEFAULT_LANDING_PROOF.source,
  quotes = DEFAULT_LANDING_PROOF.quotes,
  show = "both",
  align = "left",
  headingLevel = 2,
  width = 1200,
  reveal = true,
  id,
  className,
}: LandingProofProps) {
  const reduced = useReducedMotion()
  const headingId = React.useId()
  const rootRef = React.useRef<HTMLElement>(null)
  const figsRef = React.useRef<HTMLUListElement>(null)
  const [armed, setArmed] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const [counting, setCounting] = React.useState(false)

  const animate = reveal && !reduced
  React.useLayoutEffect(() => {
    setArmed(animate && typeof IntersectionObserver !== "undefined")
  }, [animate])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          io.unobserve(e.target)
          if (e.target === root) setSeen(true)
          else setCounting(true)
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    io.observe(root)
    if (figsRef.current) io.observe(figsRef.current)
    return () => io.disconnect()
  }, [show])

  const H = headingLevel === 3 ? "h3" : "h2"
  const figs = show === "quotes" ? [] : figures.slice(0, 4)
  const qs = show === "figures" ? [] : quotes.slice(0, 2)
  let n = 0
  const r = () => n++

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("lprf", className)}
      data-show={show}
      data-align={align}
      data-n={figs.length}
      data-q={qs.length}
      data-armed={armed ? "" : undefined}
      data-in={seen ? "" : undefined}
      aria-labelledby={headingId}
      style={{ "--lprf-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-proof" precedence="default">
        {CSS}
      </style>
      <div className="lprf-in">
        <H id={headingId} className="lprf-r lprf-h" style={{ "--i": r() } as React.CSSProperties}>
          <span>{title}</span>
          {titleMuted && (
            <>
              {" "}
              <span className="lprf-h2">{titleMuted}</span>
            </>
          )}
        </H>

        {figs.length > 0 && (
          <>
            <ul className="lprf-figs" ref={figsRef}>
              {figs.map((f, i) => {
                const i0 = r()
                const final = `${f.prefix ?? ""}${format(f.value, f.decimals ?? 0)}${f.suffix ?? ""}`
                return (
                  <li key={i} className="lprf-r lprf-fig" style={{ "--i": i0 } as React.CSSProperties}>
                    <span className="lprf-sr">{final} </span>
                    <CountUp figure={f} start={armed && counting} delay={i0 * STAGGER + 80} />
                    <span className="lprf-label">{f.label}</span>
                  </li>
                )
              })}
            </ul>
            {source && (
              <p className="lprf-r lprf-source" style={{ "--i": r() } as React.CSSProperties}>
                {source}
              </p>
            )}
          </>
        )}

        {qs.length > 0 && (
          <div className="lprf-quotes">
            {qs.map((q, i) => {
              const meta = [q.role, q.company].filter(Boolean).join(", ")
              return (
                <figure key={i} className="lprf-r lprf-q" style={{ "--i": r() } as React.CSSProperties}>
                  <blockquote>
                    <p>
                      <span className="lprf-oq">“</span>
                      {`${q.text.trim()}”`}
                    </p>
                  </blockquote>
                  <figcaption className="lprf-who">
                    <span className="lprf-mono" aria-hidden>
                      {initials(q.name)}
                    </span>
                    <span className="lprf-who-t">
                      <cite className="lprf-name">{q.name}</cite>
                      {meta && <span className="lprf-role">{meta}</span>}
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
