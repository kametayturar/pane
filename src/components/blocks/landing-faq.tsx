"use client"

/**
 * Landing FAQ – the questions section of a landing page.
 *
 * The heading (with an optional muted second line, a short note and a link under it) sits on the left; the
 * questions sit on the right as an accordion separated by hairlines. On narrow containers the two stack.
 * Each question is a real button with `aria-expanded` and `aria-controls` pointing at its answer region; the
 * answer opens with one eased height change (grid rows 0fr → 1fr) while the plus turns into a minus by
 * rotating its vertical stroke, and closed answers are `inert`. Arrow keys move between questions, Home and
 * End jump to the first and last. `multiple` lets several answers stay open; otherwise opening one closes the
 * rest. Answers are plain strings, and a blank line starts a new paragraph.
 *
 * ```tsx
 * <LandingFaq
 *   title="Questions teams ask."
 *   items={[{ question: "Is there a free plan?", answer: "Yes.\n\nIt stays free for one seat." }]}
 *   defaultOpen={[0]}
 * />
 * ```
 *
 * Content is plain data (`DEFAULT_LANDING_FAQ`), so a page builder can edit and save it as JSON.
 */

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingFaqLink = {
  label: string
  href: string
}

export type LandingFaqItem = {
  question: string
  /** Plain text. A blank line starts a new paragraph. */
  answer: string
}

export type LandingFaqProps = {
  /** The heading. */
  title?: string
  /** A second heading line, drawn muted. Empty hides it. */
  titleMuted?: string
  /** One short line under the heading. Empty hides it. */
  note?: string
  /** A plain link under the note. `null` hides it. */
  link?: LandingFaqLink | null
  /** The questions, in order. */
  items?: LandingFaqItem[]
  /** Let several answers stay open. When false, opening one closes the others. Default false. */
  multiple?: boolean
  /** Indexes of the answers open at first (only the first one when `multiple` is false). Default none. */
  defaultOpen?: number[]
  /** Level of the heading; questions are one level below. Default 2. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Id on the `<section>`, for in-page links. */
  id?: string
  /** Max content width in px. Default 1200. */
  width?: number
  /** Heading and rows rise in once when the section scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_FAQ = {
  title: "Questions teams ask.",
  titleMuted: "",
  note: "Not covered here? Write to us and a person replies within a working day.",
  link: { label: "Write to support", href: "#contact" },
  items: [
    {
      question: "Is the Starter plan free for good?",
      answer:
        "Yes. One inbox and one seat stay free for as long as you use them, with 100 answered tickets a month. Past that you pay per ticket, and you see the count before anything is charged.",
    },
    {
      question: "Does Atlas reply to customers on its own?",
      answer:
        "Not unless you allow it. By default every reply Atlas writes waits for a person on your team to approve it.\n\nYou can let it send on its own for chosen topics, such as order status, and each message it sends is listed with the sources it used.",
    },
    {
      question: "Can we bring our help centre and past tickets?",
      answer:
        "Connect your help desk and Atlas reads your articles and the last year of tickets. Quill lists every article it could not match before anything is used in a reply.",
    },
    {
      question: "Who can see our customers' messages?",
      answer:
        "Only the people you invite, at the level you choose. Every reply is logged with who approved it and when, and you can export or delete everything at any time.",
    },
    {
      question: "Can we try it on real tickets first?",
      answer:
        "Connect one queue in shadow mode: Atlas drafts, nobody sends, and you compare its answers with your team's. Or start with a sample inbox filled with Harbor & Finch's requests.",
    },
    {
      question: "How do we get help?",
      answer: "Write to us from inside the app or by email. Someone on the team replies, usually within a few hours on weekdays.",
    },
  ],
  multiple: false,
  defaultOpen: [] as number[],
} satisfies Required<Pick<LandingFaqProps, "title" | "titleMuted" | "note" | "items" | "multiple" | "defaultOpen">> & {
  link: LandingFaqLink
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lfq {
  --lfq-ink: #000;
  --lfq-accent: var(--pane-accent, #0060e2);
  --lfq-t1: color-mix(in oklab, var(--lfq-ink) 88%, transparent);
  --lfq-t2: color-mix(in oklab, var(--lfq-ink) 61%, transparent);
  --lfq-t3: color-mix(in oklab, var(--lfq-ink) 45%, transparent);
  --lfq-line: color-mix(in oklab, var(--lfq-ink) 10%, transparent);
  --lfq-ease: cubic-bezier(.22, 1, .36, 1);
  --lfq-head-ls: -.035em;
  display: block;
  width: 100%;
  container: lfq / inline-size;
  font-size: 15px; line-height: 24px;
  font-family: var(--lfq-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lfq-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lfq {
  --lfq-ink: #fff;
  --lfq-accent: var(--pane-accent, #4d8dff);
  --lfq-t1: color-mix(in oklab, var(--lfq-ink) 92%, transparent);
  --lfq-t2: color-mix(in oklab, var(--lfq-ink) 62%, transparent);
  --lfq-t3: color-mix(in oklab, var(--lfq-ink) 46%, transparent);
  --lfq-line: color-mix(in oklab, var(--lfq-ink) 12%, transparent);
}

/* Mono: ink on paper, a firmer rule and a monospaced face */
html[data-style="mono"] .lfq {
  --lfq-accent: #111;
  --lfq-line: color-mix(in oklab, var(--lfq-ink) 16%, transparent);
  --lfq-ease: cubic-bezier(.2, .9, .1, 1);
  --lfq-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lfq-head-ls: -.05em;
  font-size: 13.5px; line-height: 22px;
}
html[data-style="mono"].dark .lfq { --lfq-accent: #f2f2f2; --lfq-line: color-mix(in oklab, var(--lfq-ink) 20%, transparent) }
html[data-style="mono"] .lfq-h { font-size: clamp(26px, 2.6cqi + 14px, 44px) }
html[data-style="mono"] .lfq-btn { font-size: 14px; letter-spacing: -.02em }
html[data-style="mono"] :is(.lfq-note, .lfq-link) { font-size: 13px }

/* Glass: a clear sheet over the moving backdrop; stronger text floors and rules, no frost */
html[data-style="glass"] .lfq {
  --lfq-ink: var(--pane-ink); --lfq-accent: var(--pane-accent);
  --lfq-t1: var(--pane-t1); --lfq-t2: var(--pane-t2); --lfq-t3: var(--pane-t3);
  --lfq-line: color-mix(in oklab, var(--pane-ink) 14%, transparent);
  --lfq-ease: var(--pane-ease); --lfq-font: var(--pane-font);
}

.lfq *, .lfq *::before, .lfq *::after { box-sizing: border-box }
:where(.lfq) :is(h1, h2, h3, h4, h5, p) { margin: 0; padding: 0; font: inherit }
:where(.lfq) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
:where(.lfq) button { all: unset; box-sizing: border-box; -webkit-tap-highlight-color: transparent }
.lfq svg { display: block; flex: none }

.lfq-in {
  max-width: calc(var(--lfq-width, 1200px) + 48px); margin: 0 auto;
  padding: clamp(64px, 7cqi, 104px) 24px;
}
.lfq-grid { display: grid; gap: 40px }
@container lfq (width >= 860px) {
  .lfq-grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); column-gap: 48px }
}

/* heading block */
.lfq-h {
  font-weight: 500; font-size: clamp(30px, 3.2cqi + 16px, 52px); line-height: 1.06;
  letter-spacing: var(--lfq-head-ls); color: var(--lfq-ink); text-wrap: balance;
}
.lfq-h > span { display: block }
.lfq-h > span + span { color: var(--lfq-t3) }
.lfq-note { margin-top: 16px; max-width: 36ch; color: var(--lfq-t2); text-wrap: pretty }
.lfq-more { margin-top: 20px }
.lfq-link {
  display: inline-flex; align-items: center; gap: 4px; border-radius: 4px;
  font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lfq-accent);
}
.lfq-link svg { width: 14px; height: 14px; transition: transform 220ms var(--lfq-ease) }
@media (hover: hover) { .lfq-link:hover svg { transform: translateX(2px) } }
.lfq-link:active svg { transform: translateX(3px) }
.lfq-link:focus-visible { outline: 2px solid var(--lfq-accent); outline-offset: 3px }

/* the accordion: hairline above the list and under every row */
.lfq-list { border-top: 1px solid var(--lfq-line); min-width: 0 }
.lfq-item { border-bottom: 1px solid var(--lfq-line) }
.lfq-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 24px; width: 100%;
  min-height: 68px; padding: 20px 0; border-radius: 6px; cursor: pointer;
  font-size: 16px; line-height: 24px; font-weight: 500; letter-spacing: -.006em; color: var(--lfq-t1);
  text-align: left; text-wrap: pretty;
}
@container lfq (width >= 560px) { .lfq-btn { font-size: 17px; min-height: 72px } }
.lfq-btn:focus-visible { outline: 2px solid var(--lfq-accent); outline-offset: 2px }
.lfq-icon { width: 16px; height: 16px; color: var(--lfq-t3); transition: color 160ms var(--lfq-ease) }
.lfq-icon path { stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; fill: none }
.lfq-v { transform-box: fill-box; transform-origin: center; transition: transform 360ms var(--lfq-ease) }
.lfq-item[data-open] .lfq-v { transform: rotate(90deg) }
.lfq-item[data-open] .lfq-icon { color: var(--lfq-t1) }
@media (hover: hover) { .lfq-btn:hover .lfq-icon { color: var(--lfq-t1) } }

/* the answer: one eased height change, grid rows 0fr to 1fr */
.lfq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 380ms var(--lfq-ease) }
.lfq-item[data-open] .lfq-a { grid-template-rows: 1fr }
.lfq-clip { min-height: 0; overflow: hidden }
.lfq-body { display: grid; gap: 12px; max-width: 62ch; padding: 0 24px 24px 0; color: var(--lfq-t2); text-wrap: pretty }
@container lfq (width >= 560px) { .lfq-body { padding-right: 40px } }

/* arrival */
.lfq[data-reveal="wait"] .lfq-r { opacity: 0 }
.lfq[data-reveal="in"] .lfq-r {
  animation: lfq-rise 680ms var(--lfq-ease) backwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes lfq-rise { from { opacity: 0; transform: translateY(14px); filter: blur(3px) } }
.lfq[data-reveal="in"] .lfq-item.lfq-r { animation-name: lfq-settle; animation-duration: 560ms }
@keyframes lfq-settle { from { opacity: 0; transform: translateY(12px) } }

@media (prefers-reduced-motion: reduce) {
  .lfq[data-reveal] .lfq-r { opacity: 1; animation: none }
  .lfq *, .lfq *::before, .lfq *::after { transition: none !important }
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
const paragraphs = (text: string) =>
  text
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

export function LandingFaq({
  title = DEFAULT_LANDING_FAQ.title,
  titleMuted = DEFAULT_LANDING_FAQ.titleMuted,
  note = DEFAULT_LANDING_FAQ.note,
  link = DEFAULT_LANDING_FAQ.link,
  items = DEFAULT_LANDING_FAQ.items,
  multiple = DEFAULT_LANDING_FAQ.multiple,
  defaultOpen = DEFAULT_LANDING_FAQ.defaultOpen,
  headingLevel = 2,
  id,
  width = 1200,
  reveal = true,
  className,
}: LandingFaqProps) {
  const ref = React.useRef<HTMLElement>(null)
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
  const uid = React.useId()
  const headingId = `${uid}-h`
  const [open, setOpen] = React.useState<number[]>(() => (multiple ? defaultOpen : defaultOpen.slice(0, 1)))
  useArrival(ref, reveal)

  const level = Math.min(4, Math.max(1, headingLevel))
  const H = `h${level}` as Heading
  const Sub = `h${level + 1}` as Heading
  const shown = multiple ? open : open.slice(-1)
  const lead = 1 + (titleMuted ? 1 : 0) + (note ? 1 : 0) + (link ? 1 : 0)

  const toggle = (i: number) =>
    setOpen((cur) => {
      const was = (multiple ? cur : cur.slice(-1)).includes(i)
      if (was) return cur.filter((x) => x !== i)
      return multiple ? [...cur, i] : [i]
    })

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = items.length
    const to =
      e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    buttons.current[to]?.focus()
  }

  return (
    <section
      ref={ref}
      id={id}
      className={cn("lfq", className)}
      aria-labelledby={headingId}
      style={{ "--lfq-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-faq" precedence="default">
        {CSS}
      </style>
      <div className="lfq-in">
        <div className="lfq-grid">
          <header className="lfq-head">
            <H className="lfq-h" id={headingId}>
              <span className="lfq-r" style={step(0)}>
                {title}
              </span>{" "}
              {titleMuted && (
                <span className="lfq-r" style={step(1)}>
                  {titleMuted}
                </span>
              )}
            </H>
            {note && (
              <p className="lfq-note lfq-r" style={step(titleMuted ? 2 : 1)}>
                {note}
              </p>
            )}
            {link && (
              <p className="lfq-more lfq-r" style={step(lead - 1)}>
                <a className="lfq-link" href={link.href}>
                  {link.label}
                  <ChevronRight strokeWidth={1.75} aria-hidden />
                </a>
              </p>
            )}
          </header>

          {items.length > 0 && (
            <div className="lfq-list">
              {items.map((item, i) => {
                const isOpen = shown.includes(i)
                const qId = `${uid}-q${i}`
                const aId = `${uid}-a${i}`
                return (
                  <div key={i} className="lfq-item lfq-r" data-open={isOpen ? "" : undefined} style={step(lead + i)}>
                    <Sub>
                      <button
                        ref={(el) => {
                          buttons.current[i] = el
                        }}
                        type="button"
                        id={qId}
                        className="lfq-btn"
                        aria-expanded={isOpen}
                        aria-controls={aId}
                        onClick={() => toggle(i)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                      >
                        <span>{item.question}</span>
                        <svg className="lfq-icon" viewBox="0 0 16 16" aria-hidden>
                          <path d="M2.5 8h11" />
                          <path className="lfq-v" d="M8 2.5v11" />
                        </svg>
                      </button>
                    </Sub>
                    <div className="lfq-a" id={aId} role="region" aria-labelledby={qId} inert={!isOpen}>
                      <div className="lfq-clip">
                        <div className="lfq-body">
                          {paragraphs(item.answer).map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
