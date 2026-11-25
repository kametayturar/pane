"use client"

/**
 * Landing Audience – the "who it is for" section of a landing page.
 *
 * A two-line heading (the second line muted) with an optional side note, then one card per audience, side by
 * side: a small label ("For support agents"), an optional one-line promise, up to four ticked points and a
 * link. The cards are quiet surfaces inside one shared hairline frame, divided by a single rule rather than
 * floating apart, and they stack on narrow containers (two cards from 640px, three from 900px of the
 * section's own width). `highlight` gives one card the accent hairline and nothing more. The heading, note
 * and frame rise in once when the section scrolls into view, then each card's contents follow.
 *
 * ```tsx
 * <LandingAudience
 *   title="One queue,"
 *   titleMuted="two ways to work in it."
 *   audiences={[
 *     { label: "For support agents", points: ["Every ticket opens with a draft."], link: { label: "Start free", href: "/start" } },
 *     { label: "For support leads", points: ["The whole queue at a glance."], link: { label: "See the team plan", href: "/team" } },
 *   ]}
 *   highlight={0}
 * />
 * ```
 *
 * Content is plain data (`DEFAULT_LANDING_AUDIENCE`), so a page builder can edit and save it as JSON.
 */

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingAudienceLink = {
  label: string
  href: string
}

export type LandingAudienceCard = {
  /** Who it is for: "For business owners". */
  label: string
  /** One line on what they get. Optional; without it the label becomes the card's title. */
  promise?: string
  /** Up to four short points. More are cut to four. */
  points?: string[]
  /** The card's one link. `null` hides it. */
  link?: LandingAudienceLink | null
}

export type LandingAudienceProps = {
  /** First line of the heading. */
  title?: string
  /** Second line of the heading, drawn muted. Empty hides it. */
  titleMuted?: string
  /** A short line beside the heading (under it on narrow widths). Empty hides it. */
  note?: string
  /** Two or three audiences. More are cut to three. */
  audiences?: LandingAudienceCard[]
  /** Index of the card that gets the accent hairline. */
  highlight?: number | null
  /** Level of the heading; card labels are one level below. Default 2. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Id on the `<section>`, for in-page links. */
  id?: string
  /** Max content width in px. Default 1200. */
  width?: number
  /** Heading and cards rise in once when the section scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_AUDIENCE = {
  title: "One queue,",
  titleMuted: "two ways to work in it.",
  note: "Agents answer from it, leads steer it. The same tickets underneath.",
  audiences: [
    {
      label: "For support agents",
      promise: "Start every ticket with a draft.",
      points: [
        "Open a ticket and Atlas's reply is already there.",
        "Check the sources, edit a line, press send.",
        "Hand a thread to a colleague with its history.",
      ],
      link: { label: "Start free", href: "#start" },
    },
    {
      label: "For support leads",
      promise: "See the whole queue at a glance.",
      points: [
        "Choose what Atlas may answer and what waits for you.",
        "Read every approved reply and who sent it.",
        "Give contractors only the queues they work on.",
      ],
      link: { label: "See the team plan", href: "#team" },
    },
  ],
  highlight: null,
} satisfies Required<Pick<LandingAudienceProps, "title" | "titleMuted" | "note" | "audiences">> & { highlight: null }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lau {
  --lau-ink: #000;
  --lau-surface: #fff;
  --lau-accent: var(--pane-accent, #0060e2);
  --lau-t1: color-mix(in oklab, var(--lau-ink) 88%, transparent);
  --lau-t2: color-mix(in oklab, var(--lau-ink) 61%, transparent);
  --lau-t3: color-mix(in oklab, var(--lau-ink) 45%, transparent);
  --lau-line: color-mix(in oklab, var(--lau-ink) 9%, transparent);
  --lau-drop: 0 1px 2px rgb(0 0 0 / .03);
  --lau-ease: cubic-bezier(.22, 1, .36, 1);
  --lau-radius: 16px;
  --lau-head-ls: -.035em;
  display: block;
  width: 100%;
  container: lau / inline-size;
  font-size: 14px; line-height: 22px;
  font-family: var(--lau-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lau-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lau {
  --lau-ink: #fff;
  --lau-surface: #161618;
  --lau-accent: var(--pane-accent, #4d8dff);
  --lau-t1: color-mix(in oklab, var(--lau-ink) 92%, transparent);
  --lau-t2: color-mix(in oklab, var(--lau-ink) 62%, transparent);
  --lau-t3: color-mix(in oklab, var(--lau-ink) 46%, transparent);
  --lau-line: color-mix(in oklab, var(--lau-ink) 11%, transparent);
  --lau-drop: 0 1px 2px rgb(0 0 0 / .3);
}

/* Mono: ink on paper, a firmer rule, small radius and a monospaced face; the highlight is an ink line */
html[data-style="mono"] .lau {
  --lau-accent: #111;
  --lau-line: color-mix(in oklab, var(--lau-ink) 14%, transparent);
  --lau-drop: 0 0 #0000;
  --lau-ease: cubic-bezier(.2, .9, .1, 1);
  --lau-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lau-radius: 6px;
  --lau-head-ls: -.05em;
}
html[data-style="mono"].dark .lau { --lau-accent: #f2f2f2; --lau-surface: #0a0a0a; --lau-line: color-mix(in oklab, var(--lau-ink) 18%, transparent) }
html[data-style="mono"] .lau-h { font-size: clamp(26px, 2.6cqi + 14px, 44px) }
html[data-style="mono"] .lau-promise { max-width: 34ch; font-size: 18px; line-height: 26px; letter-spacing: -.03em }
html[data-style="mono"] :is(.lau-points, .lau-note) { font-size: 13px }
html[data-style="mono"] .lau-link { font-size: 13px }

/* Glass: the frame is one frosted slab with Pane's rim; cards inside stay clear */
html[data-style="glass"] .lau {
  --lau-ink: var(--pane-ink); --lau-surface: var(--pane-solid); --lau-accent: var(--pane-accent);
  --lau-ease: var(--pane-ease); --lau-font: var(--pane-font);
  --lau-t1: var(--pane-t1); --lau-t2: var(--pane-t2); --lau-t3: var(--pane-t3);
  --lau-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lau-radius: 24px;
}
html[data-style="glass"].dark .lau { --lau-line: color-mix(in oklab, var(--pane-ink) 15%, transparent) }
html[data-style="glass"] .lau-frame { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lau-frame { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .lau-frame { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .lau-frame { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .lau-frame { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lau-frame { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lau *, .lau *::before, .lau *::after { box-sizing: border-box }
:where(.lau) :is(h1, h2, h3, h4, h5, p, ul, li) { margin: 0; padding: 0 }
:where(.lau) ul { list-style: none }
:where(.lau) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
.lau svg { display: block; flex: none }

.lau-in {
  max-width: calc(var(--lau-width, 1200px) + 48px); margin: 0 auto;
  padding: clamp(64px, 7cqi, 104px) 24px;
}

/* heading row: title left, note beside it on wide containers */
.lau-head { display: grid; gap: 16px }
@container lau (width >= 760px) {
  .lau-head { grid-template-columns: minmax(0, 1fr) minmax(0, 34ch); align-items: end; column-gap: 48px }
  .lau-note { padding-bottom: 6px }
}
.lau-h {
  font-weight: 500; font-size: clamp(30px, 3.2cqi + 16px, 52px); line-height: 1.06;
  letter-spacing: var(--lau-head-ls); color: var(--lau-ink); text-wrap: balance;
}
.lau-h > span { display: block }
.lau-h > span + span { color: var(--lau-t3) }
.lau-note { max-width: 40ch; font-size: 15px; line-height: 24px; color: var(--lau-t2); text-wrap: pretty }

/* the shared frame: one surface, one hairline, a rule between cards */
.lau-frame {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 40px;
  border-radius: var(--lau-radius); background: var(--lau-surface);
  box-shadow: 0 0 0 1px var(--lau-line), var(--lau-drop);
}
@container lau (width >= 720px) { .lau-frame { margin-top: 56px } }
.lau-card {
  --tl: 0px; --tr: 0px; --br: 0px; --bl: 0px;
  position: relative; display: flex; min-width: 0;
}
.lau-card + .lau-card { box-shadow: inset 0 1px 0 var(--lau-line) }
.lau-card:first-child { --tl: var(--lau-r1); --tr: var(--lau-r1) }
.lau-card:last-child { --bl: var(--lau-r1); --br: var(--lau-r1) }
.lau-frame { --lau-r1: calc(var(--lau-radius) + 1px) }

/* highlight: an accent hairline laid exactly over the frame and the rule around this card */
.lau-card[data-highlight]::after {
  content: ""; position: absolute; inset: -1px; z-index: 1; pointer-events: none;
  border: 1px solid var(--lau-accent); border-radius: var(--tl) var(--tr) var(--br) var(--bl);
}

/* side by side: two cards from 640px, three from 900px */
@container lau (width >= 640px) {
  .lau-frame[data-count="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .lau-frame[data-count="2"] .lau-card + .lau-card { box-shadow: inset 1px 0 0 var(--lau-line) }
  .lau-frame[data-count="2"] .lau-card:first-child { --tr: 0px; --bl: var(--lau-r1) }
  .lau-frame[data-count="2"] .lau-card:last-child { --bl: 0px; --tr: var(--lau-r1) }
}
@container lau (width >= 900px) {
  .lau-frame[data-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)) }
  .lau-frame[data-count="3"] .lau-card + .lau-card { box-shadow: inset 1px 0 0 var(--lau-line) }
  .lau-frame[data-count="3"] .lau-card:first-child { --tr: 0px; --bl: var(--lau-r1) }
  .lau-frame[data-count="3"] .lau-card:last-child { --bl: 0px; --tr: var(--lau-r1) }
}
/* the highlighted card's own rule would sit beside the accent line, so the accent replaces it */
.lau .lau-frame .lau-card[data-highlight] { box-shadow: none }

.lau-body { display: flex; flex-direction: column; flex: 1; min-width: 0; padding: 28px 24px 26px }
@container lau (width >= 560px) { .lau-body { padding: 32px 32px 30px } }
.lau-label { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lau-t2) }
.lau-card:not([data-promise]) .lau-label { font-size: 18px; line-height: 26px; letter-spacing: -.015em; color: var(--lau-t1) }
.lau-promise {
  margin-top: 8px; max-width: 26ch;
  font-size: 21px; line-height: 28px; font-weight: 500; letter-spacing: -.022em; color: var(--lau-ink); text-wrap: balance;
}
.lau-points { display: grid; gap: 10px; margin-top: 24px; color: var(--lau-t2) }
.lau-points li { display: grid; grid-template-columns: 16px minmax(0, 1fr); column-gap: 12px }
.lau-points svg { width: 15px; height: 15px; margin-top: 3.5px; color: var(--lau-t3) }
.lau-foot { margin-top: auto; padding-top: 28px }
.lau-link {
  display: inline-flex; align-items: center; gap: 4px; border-radius: 4px;
  font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lau-accent);
}
.lau-link svg { width: 14px; height: 14px; transition: transform 220ms var(--lau-ease) }
.lau-link:focus-visible { outline: 2px solid var(--lau-accent); outline-offset: 3px }
@media (hover: hover) { .lau-link:hover svg { transform: translateX(2px) } }
.lau-link:active svg { transform: translateX(3px) }

/* arrival: heading, note and frame rise once; each card's contents follow */
.lau[data-reveal="wait"] .lau-r { opacity: 0 }
.lau[data-reveal="in"] .lau-r {
  animation: lau-rise 680ms var(--lau-ease) backwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
.lau[data-reveal="in"] .lau-body.lau-r { animation-name: lau-settle; animation-duration: 560ms }
@keyframes lau-rise { from { opacity: 0; transform: translateY(14px); filter: blur(3px) } }
@keyframes lau-settle { from { opacity: 0; transform: translateY(8px) } }

@media (prefers-reduced-motion: reduce) {
  .lau[data-reveal] .lau-r { opacity: 1; animation: none }
  .lau *, .lau *::before, .lau *::after { transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Arrival                                   */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/** Hides the parts before first paint, then lets them rise once when the section enters the viewport. */
function useArrival(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || !enabled || typeof IntersectionObserver === "undefined" || window.matchMedia(REDUCED).matches) return
    el.dataset.reveal = "wait"
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        el.dataset.reveal = "in"
        io.disconnect()
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      delete el.dataset.reveal
    }
  }, [ref, enabled])
}

/* -------------------------------------------------------------------------- */
/*                                   Section                                  */
/* -------------------------------------------------------------------------- */

type Heading = "h1" | "h2" | "h3" | "h4" | "h5"

const step = (i: number) => ({ "--i": i }) as React.CSSProperties

export function LandingAudience({
  title = DEFAULT_LANDING_AUDIENCE.title,
  titleMuted = DEFAULT_LANDING_AUDIENCE.titleMuted,
  note = DEFAULT_LANDING_AUDIENCE.note,
  audiences = DEFAULT_LANDING_AUDIENCE.audiences,
  highlight = DEFAULT_LANDING_AUDIENCE.highlight,
  headingLevel = 2,
  id,
  width = 1200,
  reveal = true,
  className,
}: LandingAudienceProps) {
  const ref = React.useRef<HTMLElement>(null)
  const headingId = React.useId()
  useArrival(ref, reveal)

  const level = Math.min(4, Math.max(1, headingLevel))
  const H = `h${level}` as Heading
  const Sub = `h${level + 1}` as Heading
  const cards = audiences.slice(0, 3)
  const lead = (titleMuted ? 2 : 1) + (note ? 1 : 0)

  return (
    <section
      ref={ref}
      id={id}
      className={cn("lau", className)}
      aria-labelledby={headingId}
      style={{ "--lau-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-audience" precedence="default">
        {CSS}
      </style>
      <div className="lau-in">
        <header className="lau-head">
          <H className="lau-h" id={headingId}>
            <span className="lau-r" style={step(0)}>
              {title}
            </span>{" "}
            {titleMuted && (
              <span className="lau-r" style={step(1)}>
                {titleMuted}
              </span>
            )}
          </H>
          {note && (
            <p className="lau-note lau-r" style={step(titleMuted ? 2 : 1)}>
              {note}
            </p>
          )}
        </header>
        {cards.length > 0 && (
          <div className="lau-frame lau-r" data-count={cards.length} style={step(lead)}>
            {cards.map((a, i) => (
              <article
                key={`${a.label}-${i}`}
                className="lau-card"
                data-promise={a.promise ? "" : undefined}
                data-highlight={highlight === i ? "" : undefined}
              >
                <div className="lau-body lau-r" style={step(lead + 2 + i)}>
                  <Sub className="lau-label">{a.label}</Sub>
                  {a.promise && <p className="lau-promise">{a.promise}</p>}
                  {a.points && a.points.length > 0 && (
                    <ul className="lau-points" role="list">
                      {a.points.slice(0, 4).map((p, j) => (
                        <li key={j}>
                          <Check strokeWidth={1.75} aria-hidden />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {a.link && (
                    <p className="lau-foot">
                      <a className="lau-link" href={a.link.href}>
                        {a.link.label}
                        <ChevronRight strokeWidth={1.75} aria-hidden />
                      </a>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
