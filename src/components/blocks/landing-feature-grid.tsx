"use client"

/**
 * Landing Feature Grid – the "everything else it does" section of a landing page.
 *
 * A two-line heading (the second line muted), then a grid of features ruled by hairlines only: no card
 * boxes, no shadows. Each cell is a small line icon, a title and two lines of text. `columns` sets 2, 3 or 4
 * at full width; the grid drops to two and then one column as its own container narrows, and the rules are
 * worked out per column count so no line is ever doubled or missing, including a short last row. An optional
 * `wide` feature closes the grid as a full-width row with its text beside the icon. Cells rise in once, in
 * reading order, when the section scrolls into view. A cell with an `href` is one link: hovering or focusing
 * it darkens the title and shows a small arrow; cells without a link stay still.
 *
 * ```tsx
 * <LandingFeatureGrid
 *   title="The rest of the job, covered."
 *   titleMuted="Without another tab to watch."
 *   columns={3}
 *   features={[{ icon: "inbox", title: "One queue for every channel.", text: "Email, chat and forms land in one place." }]}
 *   wide={{ icon: "file", title: "A help centre that keeps up.", text: "Articles drafted from solved tickets." }}
 * />
 * ```
 *
 * Content is plain data (`DEFAULT_LANDING_FEATURE_GRID`), so a page builder can edit and save it as JSON.
 * Icons are names from a built-in map (`LANDING_FEATURE_ICONS`); an unknown name draws a neutral circle.
 */

import * as React from "react"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartColumn,
  Circle,
  Clock,
  Cloud,
  Code,
  Database,
  FileText,
  Globe,
  Inbox,
  KeyRound,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  Plug,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingFeature = {
  /** A name from `LANDING_FEATURE_ICONS` ("inbox", "users", "chart" …). Unknown names draw a neutral circle. */
  icon?: string
  /** Short and concrete: "One inbox for every request." */
  title: string
  /** About two lines. */
  text: string
  /** Makes the whole cell one link. */
  href?: string
}

export type LandingFeatureGridProps = {
  /** First line of the heading. */
  title?: string
  /** Second line of the heading, drawn muted. Empty hides it. */
  titleMuted?: string
  /** The features, in reading order. */
  features?: LandingFeature[]
  /** One feature that closes the grid as a full-width row, text beside the icon. `null` hides it. */
  wide?: LandingFeature | null
  /** Columns at full width. The grid drops to two, then one, as its container narrows. Default 3. */
  columns?: 2 | 3 | 4
  /** Level of the heading; feature titles are one level below. Default 2. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Id on the `<section>`, for in-page links. */
  id?: string
  /** Max content width in px. Default 1200. */
  width?: number
  /** Heading and cells rise in once when the section scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_FEATURE_GRID = {
  title: "The rest of the job, covered.",
  titleMuted: "Without another tab to watch.",
  columns: 3,
  features: [
    {
      icon: "inbox",
      title: "One queue for every channel.",
      text: "Email, chat and web forms land in one place. Sage sorts each request by who should answer it.",
      href: "#queue",
    },
    {
      icon: "users",
      title: "Roles that match your team.",
      text: "Leads set the rules, agents approve replies, and contractors only see the queues they work on.",
      href: "#roles",
    },
    {
      icon: "plug",
      title: "Works with your help desk.",
      text: "Connect your help desk, your store and your shipping carrier in a few clicks, or build on the API.",
      href: "#integrations",
    },
    {
      icon: "shield",
      title: "A person approves.",
      text: "Atlas drafts, someone on your team approves. No reply reaches a customer without a name next to it.",
      href: "#approval",
    },
    {
      icon: "chart",
      title: "Numbers you can open.",
      text: "Every chart links to the tickets behind it, so a question about a busy Tuesday takes one click.",
      href: "#insights",
    },
    {
      icon: "globe",
      title: "Replies in their language.",
      text: "Atlas answers in the language the customer wrote in and keeps your product names as they are.",
      href: "#languages",
    },
  ],
  wide: {
    icon: "file",
    title: "A help centre that keeps up.",
    text: "Quill turns resolved tickets into draft articles. Each one links to the conversations it came from, waits for a person to review it and keeps a history of every edit.",
    href: "#articles",
  },
} satisfies Required<Pick<LandingFeatureGridProps, "title" | "titleMuted" | "columns" | "features">> & {
  wide: LandingFeature
}

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  users: Users,
  plug: Plug,
  shield: ShieldCheck,
  chart: ChartColumn,
  globe: Globe,
  receipt: Receipt,
  chat: MessageCircle,
  file: FileText,
  lock: Lock,
  bolt: Zap,
  clock: Clock,
  calendar: CalendarDays,
  bell: Bell,
  search: Search,
  layers: Layers,
  workflow: Workflow,
  code: Code,
  database: Database,
  cloud: Cloud,
  key: KeyRound,
  mail: Mail,
  wallet: Wallet,
  settings: Settings,
}

const ALIASES: Record<string, string> = {
  zap: "bolt",
  message: "chat",
  "message-circle": "chat",
  document: "file",
  "file-text": "file",
  team: "users",
  security: "shield",
  "bar-chart": "chart",
  money: "wallet",
  email: "mail",
  integration: "plug",
}

/** Every icon name the grid knows, for a picker. */
export const LANDING_FEATURE_ICONS = Object.keys(ICONS)

function iconFor(name?: string): LucideIcon {
  const key = (name ?? "").trim().toLowerCase()
  return ICONS[key] ?? ICONS[ALIASES[key] ?? ""] ?? Circle
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

/**
 * Rules for one column count. Every cell draws its own bottom rule and, when it is not in the first column,
 * a rule on its left; the last cell of a short row also closes itself on the right, drawn
 * 1px outside its edge so it lines up with the column rule above. When a wide row follows
 * (or Glass frames the grid), the last row drops its bottom rule because the wide row's top rule, or the
 * frame's edge, takes its place. Each line is drawn by exactly one cell, so none can double.
 */
const rulesFor = (n: number, s: string) => `
${s} .lfg-grid { grid-template-columns: repeat(${n}, minmax(0, 1fr)) }
${s} .lfg-cell:not(:nth-child(${n}n+1)) { --l: 1; --pl: var(--lfg-pad) }
${s} .lfg-cell:not(:nth-child(${n}n)) { --pr: var(--lfg-pad) }
${s} .lfg-cell:last-child:not(:nth-child(${n}n)) { --r: 1 }
:is(${s}[data-wide], html[data-style="glass"] ${s}) .lfg-cell:nth-child(${n}n+1):nth-last-child(-n+${n}),
:is(${s}[data-wide], html[data-style="glass"] ${s}) .lfg-cell:nth-child(${n}n+1):nth-last-child(-n+${n}) ~ .lfg-cell { --b: 0 }
`

const CSS = `
.lfg {
  --lfg-ink: #000;
  --lfg-accent: var(--pane-accent, #0060e2);
  --lfg-t1: color-mix(in oklab, var(--lfg-ink) 88%, transparent);
  --lfg-t2: color-mix(in oklab, var(--lfg-ink) 61%, transparent);
  --lfg-t3: color-mix(in oklab, var(--lfg-ink) 45%, transparent);
  --lfg-line: color-mix(in oklab, var(--lfg-ink) 9%, transparent);
  --lfg-ease: cubic-bezier(.22, 1, .36, 1);
  --lfg-pad: 32px;
  --lfg-head-ls: -.035em;
  display: block;
  width: 100%;
  container: lfg / inline-size;
  font-size: 14px; line-height: 22px;
  font-family: var(--lfg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lfg-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lfg {
  --lfg-ink: #fff;
  --lfg-accent: var(--pane-accent, #4d8dff);
  --lfg-t1: color-mix(in oklab, var(--lfg-ink) 92%, transparent);
  --lfg-t2: color-mix(in oklab, var(--lfg-ink) 62%, transparent);
  --lfg-t3: color-mix(in oklab, var(--lfg-ink) 46%, transparent);
  --lfg-line: color-mix(in oklab, var(--lfg-ink) 11%, transparent);
}

/* Mono: ink on paper, firmer rules, a monospaced face a size smaller */
html[data-style="mono"] .lfg {
  --lfg-accent: #111;
  --lfg-line: color-mix(in oklab, var(--lfg-ink) 14%, transparent);
  --lfg-ease: cubic-bezier(.2, .9, .1, 1);
  --lfg-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lfg-head-ls: -.05em;
}
html[data-style="mono"].dark .lfg { --lfg-accent: #f2f2f2; --lfg-line: color-mix(in oklab, var(--lfg-ink) 18%, transparent) }
html[data-style="mono"] .lfg-title { font-size: 14px; letter-spacing: -.01em }
html[data-style="mono"] .lfg-text { font-size: 13px }
html[data-style="mono"] .lfg-h { font-size: clamp(26px, 2.6cqi + 14px, 44px) }

/* Glass: one frosted slab holds the grid; its edge replaces the outer rules */
html[data-style="glass"] .lfg {
  --lfg-ink: var(--pane-ink); --lfg-accent: var(--pane-accent); --lfg-ease: var(--pane-ease); --lfg-font: var(--pane-font);
  --lfg-t1: var(--pane-t1); --lfg-t2: var(--pane-t2); --lfg-t3: var(--pane-t3);
  --lfg-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
}
html[data-style="glass"].dark .lfg { --lfg-line: color-mix(in oklab, var(--pane-ink) 15%, transparent) }
html[data-style="glass"] .lfg-board {
  padding: 0 28px; border-radius: 24px;
  background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card);
}
html[data-style="glass"] .lfg-grid { border-top-color: transparent }
html[data-style="glass"] .lfg-wide { --b: 0 }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lfg-board { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .lfg-board { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .lfg-board { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .lfg-board { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lfg-board { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lfg *, .lfg *::before, .lfg *::after { box-sizing: border-box }
:where(.lfg) :is(h1, h2, h3, h4, h5, p, ul, li) { margin: 0; padding: 0 }
:where(.lfg) ul { list-style: none }
:where(.lfg) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
.lfg svg { display: block; flex: none }

.lfg-in {
  max-width: calc(var(--lfg-width, 1200px) + 48px); margin: 0 auto;
  padding: clamp(64px, 7cqi, 104px) 24px;
}

/* heading */
.lfg-h {
  font-weight: 500; font-size: clamp(30px, 3.2cqi + 16px, 52px); line-height: 1.06;
  letter-spacing: var(--lfg-head-ls); color: var(--lfg-ink); text-wrap: balance;
}
.lfg-h > span { display: block }
.lfg-h > span + span { color: var(--lfg-t3) }
.lfg-board { margin-top: 40px }
@container lfg (width >= 720px) { .lfg-board { margin-top: 56px } }

/* grid: one column first, then the per-count rules below */
.lfg-grid { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--lfg-line) }
.lfg-cell, .lfg-wide {
  --l: 0; --r: 0; --b: 1; --pl: 0px; --pr: 0px;
  position: relative; min-width: 0;
  box-shadow:
    inset calc(var(--l) * 1px) 0 0 var(--lfg-line),
    calc(var(--r) * 1px) 0 0 0 var(--lfg-line),
    inset 0 calc(var(--b) * -1px) 0 var(--lfg-line);
}
.lfg-cell { padding: 28px var(--pr) 28px var(--pl) }
@container lfg (width >= 560px) { .lfg-cell { padding-block: 32px 34px } }
:is(.lfg[data-wide], html[data-style="glass"] .lfg) .lfg-cell:last-child { --b: 0 }

.lfg-icon { width: 20px; height: 20px; color: var(--lfg-t2) }
.lfg-title {
  display: block; margin-top: 18px;
  font-weight: 500; font-size: 15px; line-height: 22px; letter-spacing: -.011em; color: var(--lfg-t1);
  transition: color 200ms var(--lfg-ease);
}
.lfg-text { margin-top: 6px; max-width: 42ch; color: var(--lfg-t2); text-wrap: pretty }

/* the wide row: icon left, title and text beside it */
.lfg-wide {
  display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 20px;
  padding: 28px 0 30px; box-shadow:
    inset 0 1px 0 var(--lfg-line),
    inset 0 calc(var(--b) * -1px) 0 var(--lfg-line);
}
.lfg-wide .lfg-icon { margin-top: 1px }
.lfg-wide .lfg-title { margin-top: 0 }
.lfg-wide .lfg-text { max-width: 68ch }
@container lfg (width >= 560px) { .lfg-wide { padding-block: 32px 34px } }

/* a cell with a link is one link: the title's ::before covers the cell, ::after draws the focus ring */
.lfg-link { outline: none }
.lfg-link::before { content: ""; position: absolute; inset: 0; z-index: 1 }
.lfg-arrow {
  display: inline-block; vertical-align: -2px; margin-left: 6px; color: var(--lfg-accent);
  opacity: 0; transform: translateX(-4px);
  transition: opacity 200ms var(--lfg-ease), transform 240ms var(--lfg-ease);
}
.lfg-arrow svg { width: 14px; height: 14px }
.lfg-link:focus-visible::after {
  content: ""; position: absolute; pointer-events: none; border-radius: 10px;
  inset: 16px calc(var(--pr) - 12px) 16px calc(var(--pl) - 12px);
  box-shadow: 0 0 0 2px var(--lfg-accent);
}
.lfg-wide .lfg-link:focus-visible::after { inset: 16px -12px }
.lfg-cell[data-link]:has(.lfg-link:focus-visible) .lfg-title,
.lfg-wide[data-link]:has(.lfg-link:focus-visible) .lfg-title { color: var(--lfg-ink) }
.lfg-link:focus-visible .lfg-arrow { opacity: 1; transform: none }
@media (hover: hover) {
  :is(.lfg-cell, .lfg-wide)[data-link]:hover .lfg-title { color: var(--lfg-ink) }
  :is(.lfg-cell, .lfg-wide)[data-link]:hover .lfg-arrow { opacity: 1; transform: none }
}

/* column counts: two from 560px, then the full count once there is room */
@container lfg (width >= 560px) {${rulesFor(2, '.lfg[data-cols="2"]')}}
@container lfg (560px <= width < 860px) {${rulesFor(2, '.lfg[data-cols="3"]')}}
@container lfg (width >= 860px) {${rulesFor(3, '.lfg[data-cols="3"]')}}
@container lfg (560px <= width < 1000px) {${rulesFor(2, '.lfg[data-cols="4"]')}}
@container lfg (width >= 1000px) {${rulesFor(4, '.lfg[data-cols="4"]')}}
@container lfg (width >= 1000px) { .lfg[data-cols="4"] { --lfg-pad: 28px } }

/* arrival: parts rise and fade once, in reading order */
.lfg[data-reveal="wait"] .lfg-r { opacity: 0 }
.lfg[data-reveal="in"] .lfg-r {
  animation: lfg-rise 680ms var(--lfg-ease) backwards;
  animation-delay: calc(min(var(--i, 0), 12) * 70ms);
}
@keyframes lfg-rise { from { opacity: 0; transform: translateY(14px); filter: blur(3px) } }

@media (prefers-reduced-motion: reduce) {
  .lfg[data-reveal] .lfg-r { opacity: 1; animation: none }
  .lfg *, .lfg *::before, .lfg *::after { transition: none !important }
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
/*                                    Parts                                   */
/* -------------------------------------------------------------------------- */

type Heading = "h1" | "h2" | "h3" | "h4" | "h5"

function FeatureTitle({ feature, as: Tag }: { feature: LandingFeature; as: Heading }) {
  return (
    <Tag className="lfg-title">
      {feature.href ? (
        <a className="lfg-link" href={feature.href}>
          {feature.title}
          <span className="lfg-arrow" aria-hidden>
            <ArrowRight strokeWidth={1.75} />
          </span>
        </a>
      ) : (
        feature.title
      )}
    </Tag>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Section                                  */
/* -------------------------------------------------------------------------- */

export function LandingFeatureGrid({
  title = DEFAULT_LANDING_FEATURE_GRID.title,
  titleMuted = DEFAULT_LANDING_FEATURE_GRID.titleMuted,
  features = DEFAULT_LANDING_FEATURE_GRID.features,
  wide = DEFAULT_LANDING_FEATURE_GRID.wide,
  columns = DEFAULT_LANDING_FEATURE_GRID.columns,
  headingLevel = 2,
  id,
  width = 1200,
  reveal = true,
  className,
}: LandingFeatureGridProps) {
  const ref = React.useRef<HTMLElement>(null)
  const headingId = React.useId()
  useArrival(ref, reveal)

  const level = Math.min(4, Math.max(1, headingLevel))
  const H = `h${level}` as Heading
  const sub = `h${level + 1}` as Heading
  const cols = columns === 2 || columns === 4 ? columns : 3
  const lead = titleMuted ? 2 : 1
  const WideIcon = wide ? iconFor(wide.icon) : null

  return (
    <section
      ref={ref}
      id={id}
      className={cn("lfg", className)}
      aria-labelledby={headingId}
      data-cols={cols}
      data-wide={wide ? "" : undefined}
      style={{ "--lfg-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-feature-grid" precedence="default">
        {CSS}
      </style>
      <div className="lfg-in">
        <H className="lfg-h" id={headingId}>
          <span className="lfg-r" style={{ "--i": 0 } as React.CSSProperties}>
            {title}
          </span>{" "}
          {titleMuted && (
            <span className="lfg-r" style={{ "--i": 1 } as React.CSSProperties}>
              {titleMuted}
            </span>
          )}
        </H>
        <div className="lfg-board">
          {features.length > 0 && (
            <ul className="lfg-grid" role="list">
              {features.map((f, i) => {
                const Icon = iconFor(f.icon)
                return (
                  <li
                    key={`${f.title}-${i}`}
                    className="lfg-cell lfg-r"
                    data-link={f.href ? "" : undefined}
                    style={{ "--i": lead + i } as React.CSSProperties}
                  >
                    <Icon className="lfg-icon" strokeWidth={1.5} aria-hidden />
                    <FeatureTitle feature={f} as={sub} />
                    <p className="lfg-text">{f.text}</p>
                  </li>
                )
              })}
            </ul>
          )}
          {wide && WideIcon && (
            <div
              className="lfg-wide lfg-r"
              data-link={wide.href ? "" : undefined}
              style={{ "--i": lead + features.length } as React.CSSProperties}
            >
              <WideIcon className="lfg-icon" strokeWidth={1.5} aria-hidden />
              <div>
                <FeatureTitle feature={wide} as={sub} />
                <p className="lfg-text">{wide.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
