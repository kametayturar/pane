import * as React from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Menu,
  Moon,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react"

import type { BackdropVariant } from "@/components/motion/backdrop"
import { cn } from "@/lib/utils"
import { PaneMark } from "@/pane-mark"
import { LivePreview, type DemoComponent } from "@/live-preview"
import { SKILLS } from "@/skills-page"

/* Types -------------------------------------------------------------------- */

type LandingEntry = { slug: string; name: string; description: string; icon: LucideIcon; kind: string; demo?: DemoComponent }
type LandingGroup = { label: string; entries: LandingEntry[] }
type StyleOption = { id: string; label: string; swatch: string }

type LandingProps = {
  groups: LandingGroup[]
  dark: boolean
  toggleDark: () => void
  style: string
  setStyle: (id: string) => void
  styles: readonly StyleOption[]
}

const SITE = "https://paneui.vercel.app"
const GITHUB = "https://github.com/kametayturar/pane"
const EASE = "cubic-bezier(.22,1,.36,1)"

/* Styles for the things Tailwind can't say ----------------------------------- */

const CSS = `
.lp { --lp-ease: ${EASE}; }
.lp-fade { animation: lp-fade .3s var(--lp-ease) backwards; animation-delay: var(--d, 0ms); }
@keyframes lp-fade { from { opacity: 0; transform: translateY(8px); } }
.lp-press { transition: background-color .15s var(--lp-ease), transform .15s var(--lp-ease), color .15s var(--lp-ease), box-shadow .15s var(--lp-ease); }
.lp-press:active { transform: scale(.97); }
.lp h1, .lp h2 { letter-spacing: -0.035em; font-kerning: normal; }
.lp h1 { letter-spacing: -0.03em !important; }
@media (prefers-reduced-motion: reduce) {
  .lp-fade { animation: none; }
  .lp-press:active { transform: none; }
}
`

/* Small helpers ------------------------------------------------------------ */

function useCopied() {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  return [
    copied,
    (text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {})
      setCopied(true)
    },
  ] as const
}

/** True on phone-sized screens, where previews are laid out narrower so their text stays readable. */
function useNarrow() {
  const [narrow, setNarrow] = React.useState(() => window.innerWidth < 640)
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const on = () => setNarrow(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return narrow
}

const ring = "shadow-[0_0_0_1px_rgb(0_0_0/0.07)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]"
const ringHover = "transition-shadow duration-150 hover:shadow-[0_0_0_1px_rgb(0_0_0/0.16)] dark:hover:shadow-[0_0_0_1px_rgb(255_255_255/0.18)]"
const wrap = "mx-auto w-full max-w-[1240px] px-4 sm:px-6"
/** One rhythm for every section. */
const section = "pt-24 sm:pt-32"
const h2Cls = "text-[36px] leading-[1.08] font-medium text-balance sm:text-[44px]"
const bodyMuted = "text-[16px] leading-6 text-neutral-500 dark:text-neutral-400"

function Mark({ className }: { className?: string }) {
  return <PaneMark className={cn("size-7", className)} />
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/** The install command, shown and copied from one string. Two short lines on phones, one line from sm up. */
function InstallChip({ slug, className }: { slug: string; className?: string }) {
  const [copied, copy] = useCopied()
  const prefix = "npx shadcn@latest add"
  const url = `${SITE}/r/${slug}.json`
  const cmd = `${prefix} ${url}`
  return (
    <button
      type="button"
      onClick={() => copy(cmd)}
      aria-label={`Copy install command for ${slug}`}
      className={cn(
        "lp-press group flex min-h-11 max-w-full min-w-0 items-center gap-3 rounded-xl bg-neutral-100 py-1.5 pr-2 pl-3.5 text-left font-mono text-[12px] leading-5 text-neutral-600 hover:bg-neutral-200/70 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/10",
        className,
      )}
    >
      <span className="text-neutral-400 select-none">$</span>
      <span className="min-w-0 flex-1">
        <span className="block sm:inline">{prefix}</span>
        <span className="block truncate sm:inline">
          <span className="hidden sm:inline"> </span>
          {url.replace(SITE, "…")}
        </span>
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  )
}

function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={cn("lp-press group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-[14px] font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200", className)}>
      {children}
      <ArrowRight className="size-4" />
    </a>
  )
}

function SectionHead({ title, sub, children }: { title: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
      <h2 className={cn(h2Cls, "lg:col-span-6")}>{title}</h2>
      {(sub || children) && (
        <div className="lg:col-span-5 lg:col-start-8">
          {sub && <p className={bodyMuted}>{sub}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/* Nav ---------------------------------------------------------------------- */

const NAV = [
  ["Components", "#/browse"],
  ["Illustrations", "#/browse/Illustrations"],
  ["Motion", "#/browse/Motion"],
  ["Studio", "#/studio"],
  ["Skills", "#/skills"],
  ["MCP", "#/mcp"],
] as const

function Nav({ dark, toggleDark }: Pick<LandingProps, "dark" | "toggleDark">) {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  const linkCls = "lp-press rounded-lg px-3 py-1.5 text-[14px] text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
  return (
    <nav aria-label="Main" className={cn("sticky top-0 z-50 transition-[background-color,box-shadow] duration-300", scrolled ? "bg-white/90 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-xl dark:bg-neutral-950/85 dark:shadow-[0_1px_0_rgb(255_255_255/0.08)]" : "bg-transparent")}>
      <div className={cn(wrap, "flex h-14 items-center gap-2")}>
        <a href="#/" className="flex items-center gap-2.5 text-[16px] font-medium tracking-[-0.01em]">
          <Mark />
          Pane
        </a>
        <div className="mx-auto hidden items-center gap-0.5 md:flex">
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={linkCls}>
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <a href={GITHUB} target="_blank" rel="noreferrer" className={cn(linkCls, "flex items-center gap-1.5")}>
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button type="button" onClick={toggleDark} aria-label="Toggle dark mode" className="lp-press grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a href="#/browse" className="lp-press ml-1 hidden h-9 items-center rounded-lg bg-neutral-900 px-3.5 text-[13px] font-medium text-white hover:bg-neutral-700 sm:inline-flex dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Library
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lp-press grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-black/[0.04] md:hidden dark:text-neutral-400 dark:hover:bg-white/[0.06]"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-black/[0.06] bg-white px-4 py-3 md:hidden dark:border-white/[0.08] dark:bg-neutral-950">
          <div className="mx-auto flex max-w-[1240px] flex-col">
            {NAV.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] text-neutral-700 hover:bg-black/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.06]">
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

/* Hero --------------------------------------------------------------------- */

function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex h-9 items-center gap-1.5 border-b border-black/[0.06] px-3.5 dark:border-white/[0.07]" aria-hidden>
      <span className="size-2.5 rounded-full bg-black/10 dark:bg-white/15" />
      <span className="size-2.5 rounded-full bg-black/10 dark:bg-white/15" />
      <span className="size-2.5 rounded-full bg-black/10 dark:bg-white/15" />
      <span className="mx-auto font-mono text-[11px] text-neutral-500">{title}</span>
      <span className="w-[42px]" />
    </div>
  )
}

function Hero({ find, total, skills, slug }: { find: (slug: string) => LandingEntry | undefined; total: number; skills: number; slug: string }) {
  const orchestrator = find("agent-orchestrator") ?? find("neural-panels")
  const narrow = useNarrow()
  return (
    <header className={cn(wrap, "pt-12 sm:pt-20")}>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lp-fade">
          <h1 className="text-[40px] leading-[1.04] font-medium text-balance sm:text-[56px]">The screens AI products need, as files you own.</h1>
          <p className="mt-6 max-w-[44ch] text-[16px] leading-6 text-neutral-600 sm:text-[18px] sm:leading-7 dark:text-neutral-400">
            Chat, agents, tool calls, approvals. Real React and Tailwind, one file each. Copy a piece in with one command.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:max-w-[520px]">
            <PrimaryLink href="#/browse" className="self-start max-sm:w-full">
              Browse the library
            </PrimaryLink>
            <InstallChip slug={slug} />
          </div>
          <p className="mt-6 font-mono text-[13px] text-neutral-500 tabular-nums">
            {total} pieces · {skills} agent skills · MIT
          </p>
        </div>

        {orchestrator?.demo && (
          <div className="lp-fade min-w-0" style={{ "--d": "120ms" } as React.CSSProperties}>
            <div className={cn("overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_48px_-28px_rgb(0_0_0/0.28)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]")}>
              <WindowBar title={`${orchestrator.slug}.tsx`} />
              <LivePreview Demo={orchestrator.demo} width={narrow ? 600 : 940} align="top" bare replay={undefined} className="h-[340px] sm:h-[400px] lg:h-[420px]" />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/* Tabbed gallery ------------------------------------------------------------ */

type TilePick = { slug: string; width: number; align?: "top" | "center"; variant?: BackdropVariant; accent?: string }
type Category = { group: string; label: string; blurb: string; picks?: TilePick[] }

const CATEGORIES: Category[] = [
  {
    group: "Chat",
    label: "Chat",
    blurb: "Answers that stream at a steady pace, sources you can open, tools that show their work.",
    picks: [
      { slug: "ai-answer", width: 720, align: "top" },
      { slug: "thinking-state", width: 480, align: "top" },
      { slug: "tool-call-card", width: 440, align: "top" },
      { slug: "chat-composer", width: 480, align: "top" },
      { slug: "approval-card", width: 480, align: "top" },
      { slug: "model-picker", width: 460, align: "top" },
    ],
  },
  {
    group: "Agents",
    label: "Agents",
    blurb: "Plan, run and approve: agents that show their steps and ask before anything leaves the building.",
    picks: [
      { slug: "agent-orchestrator", width: 900, align: "top" },
      { slug: "agent-plan", width: 480, align: "top" },
      { slug: "approval-card", width: 480, align: "top" },
      { slug: "agent-tasks", width: 760, align: "top" },
      { slug: "agent-approvals", width: 720, align: "top" },
      { slug: "agent-routines", width: 620, align: "top" },
    ],
  },
  {
    group: "AI blocks",
    label: "AI blocks",
    blurb: "Whole working surfaces: orchestrators, composers, arenas, eval suites.",
    picks: [
      { slug: "agent-orchestrator", width: 980, align: "top" },
      { slug: "model-arena", width: 720, align: "top" },
      { slug: "ai-composer", width: 540, align: "top" },
      { slug: "eval-suite", width: 720, align: "top" },
      { slug: "knowledge-base", width: 780, align: "top" },
      { slug: "prompt-studio", width: 780, align: "top" },
    ],
  },
  {
    group: "Overlays",
    label: "Overlays",
    blurb: "Sheets, dialogs and swipe actions that open, settle and dismiss the way a finger expects.",
    picks: [
      { slug: "drawer", width: 760, align: "top" },
      { slug: "modal", width: 760, align: "top" },
      { slug: "swipe-row", width: 560, align: "top" },
      { slug: "hold-to-confirm", width: 560, align: "top" },
    ],
  },
  {
    group: "Stage",
    label: "Stage",
    blurb: "Frames, bentos and walkthroughs for showing a product on a landing page.",
    picks: [
      { slug: "overlay-atlas", width: 900, align: "top" },
      { slug: "control-bento", width: 760, align: "top" },
      { slug: "device-frames", width: 640 },
      { slug: "cursor-walkthrough", width: 640 },
      { slug: "light-cards", width: 640 },
    ],
  },
  { group: "Showpieces", label: "Showpieces", blurb: "Motion-heavy interface pieces with real physics and depth." },
  { group: "Charts", label: "Charts", blurb: "Data that moves with your pointer and settles when you stop." },
  { group: "AI concepts", label: "AI concepts", blurb: "Animated explainers of how models and agents actually work." },
  {
    group: "Illustrations",
    label: "Illustrations",
    blurb: "Painted, lit and drawn-by-code art for hero and feature sections, on backgrounds you pick.",
    picks: [
      { slug: "gouache-lake", width: 900, variant: "plain" },
      { slug: "golden-hills", width: 640, variant: "plain" },
      { slug: "light-form", width: 560, variant: "plain" },
      { slug: "peek-icon", width: 560, variant: "plain" },
      { slug: "dash-burst", width: 560, variant: "plain" },
      { slug: "column-cube", width: 560, variant: "plain" },
    ],
  },
]

const TILE_SPANS: Record<number, string[]> = {
  1: ["lg:col-span-6 lg:row-span-2"],
  2: ["lg:col-span-3 lg:row-span-2", "lg:col-span-3 lg:row-span-2"],
  3: ["lg:col-span-4 lg:row-span-2", "lg:col-span-2", "lg:col-span-2"],
  4: ["lg:col-span-3", "lg:col-span-3", "lg:col-span-3", "lg:col-span-3"],
  5: ["lg:col-span-4 lg:row-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"],
}
const SIX = ["lg:col-span-4 lg:row-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2"]

function Tile({ entry, pick, className }: { entry: LandingEntry; pick: TilePick; className?: string }) {
  const studio = entry.kind === "illustrations" || entry.kind === "motion"
  const [hovered, setHovered] = React.useState(false)
  const narrow = useNarrow()
  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn("group relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-neutral-900", ring, ringHover, className)}
    >
      <div className="relative min-h-0 flex-1">
        {entry.demo && (
          <LivePreview
            Demo={entry.demo}
            width={narrow ? Math.min(pick.width, 460) : pick.width}
            align={pick.align ?? (studio ? "center" : "top")}
            variant={pick.variant ?? "dots"}
            accent={pick.accent}
            bare={!studio}
            replay={undefined}
            hovered={hovered}
            className="absolute inset-0"
          />
        )}
      </div>
      <div className="flex items-start gap-3 border-t border-black/[0.06] px-5 py-4 dark:border-white/[0.07]">
        <div className="min-w-0">
          <a href={`#/${entry.slug}`} className="text-[16px] leading-6 font-medium after:absolute after:inset-0 after:content-['']">
            {entry.name}
          </a>
          <p className="mt-0.5 line-clamp-2 text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">{entry.description}</p>
        </div>
        <ArrowUpRight className="mt-1.5 ml-auto size-4 shrink-0 text-neutral-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />
      </div>
    </div>
  )
}

function Gallery({ groups }: { groups: LandingGroup[] }) {
  const tabs = CATEGORIES.flatMap((c) => {
    const g = groups.find((x) => x.label === c.group)
    if (!g) return []
    const bySlug = new Map(g.entries.map((e) => [e.slug, e]))
    const curated = (c.picks ?? []).flatMap((p) => {
      const entry = bySlug.get(p.slug)
      return entry?.demo ? [{ entry, pick: p }] : []
    })
    // Groups without a hand-picked list show their first pieces.
    const auto = g.entries.filter((e) => e.demo).slice(0, 6).map((entry) => ({ entry, pick: { slug: entry.slug, width: entry.kind === "illustrations" || entry.kind === "motion" ? 760 : 640, align: "center" as const } }))
    const items = (curated.length ? curated : auto).slice(0, 6)
    return items.length ? [{ ...c, items, total: g.entries.length }] : []
  })
  const [active, setActive] = React.useState(tabs[0]?.group)
  const current = tabs.find((t) => t.group === active) ?? tabs[0]
  if (!current) return null
  const spans = current.items.length >= 6 ? SIX : (TILE_SPANS[current.items.length] ?? SIX)
  return (
    <section id="library" className={cn(wrap, section, "scroll-mt-12")}>
      <SectionHead title="Everything an AI product puts on screen." sub="Real, running pieces, not screenshots. Each one plays on its own and opens into a page with the source." />
      <div className="mt-12">
        <div role="tablist" aria-label="Browse by use" className="-mx-4 flex gap-6 overflow-x-auto border-b border-black/[0.08] px-4 sm:mx-0 sm:px-0 dark:border-white/[0.1] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.group}
              type="button"
              role="tab"
              aria-selected={current.group === t.group}
              onClick={() => setActive(t.group)}
              className={cn(
                "lp-press -mb-px h-11 shrink-0 border-b-2 text-[14px] font-medium",
                current.group === t.group ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white" : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">{current.blurb}</p>
          <a href={`#/browse/${encodeURIComponent(current.group)}`} className="group flex items-center gap-1 text-[14px] font-medium">
            See all {current.total} <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
      <div key={current.group} role="tabpanel" className="mt-6 grid auto-rows-[300px] gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {current.items.map(({ entry, pick }, i) => (
          <Tile key={entry.slug} entry={entry} pick={pick} className={cn(i === 0 && "sm:col-span-2", spans[i])} />
        ))}
      </div>
    </section>
  )
}

/* How it's built ------------------------------------------------------------ */

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 dark:bg-neutral-900", ring, className)}>{children}</div>
}

function CardTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 className="text-[20px] leading-7 font-medium tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">{children}</p>
    </>
  )
}

function HowBuilt({ find, style, setStyle, styles }: { find: (s: string) => LandingEntry | undefined } & Pick<LandingProps, "style" | "setStyle" | "styles">) {
  const piece = find("ai-answer") ?? find("thinking-state")
  return (
    <section className={cn(wrap, section)}>
      <SectionHead title="Small files you own, not a framework you rent." sub="Each piece is one file with its own tokens and its own motion. Copy it in, read it, change it." />
      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <Card className="flex flex-col lg:min-h-[490px] lg:col-span-7 lg:row-span-2">
          <CardTitle title="Three looks, one switch">Classic, Mono and Glass restyle every piece from its tokens. Switch here and the page follows.</CardTitle>
          <div className="mt-5 flex w-full max-w-[420px] gap-1 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="radiogroup" aria-label="Style">
            {styles.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={style === o.id}
                onClick={() => setStyle(o.id)}
                className={cn(
                  "lp-press flex flex-1 items-center justify-center rounded-[9px] px-2 py-1.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                  style === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="relative mt-5 h-[210px] shrink-0 lg:h-auto lg:flex-1 lg:shrink overflow-hidden rounded-xl bg-neutral-50 shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-white/[0.03] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.07)]">
            {piece?.demo && <LivePreview Demo={piece.demo} width={720} align="top" bare className="absolute inset-0" />}
          </div>
        </Card>

        <Card className="self-start lg:col-span-5">
          <CardTitle title="One file each">No package to upgrade. The CLI drops one component file into your project, and it is yours.</CardTitle>
          <div className="mt-5 rounded-xl bg-neutral-950 p-4 font-mono text-[12px] leading-5 text-neutral-400 dark:bg-black/40">
            <div className="truncate">
              <span className="text-neutral-600">$</span> npx shadcn@latest add …/r/ai-answer.json
            </div>
            <div className="mt-2 truncate text-neutral-200">
              <span className="text-neutral-500">+ </span>src/components/ui/ai-answer.tsx
            </div>
          </div>
        </Card>

        <Card className="self-start lg:col-span-5">
          <CardTitle title="Made for your AI tool, too">Every piece ships notes on the technique behind it, so an agent can read it, extend it and keep the taste.</CardTitle>
          <p className="mt-5 text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">Works with shadcn CLI, Claude Code, Cursor and Codex.</p>
        </Card>
      </div>
    </section>
  )
}

/* Skills ------------------------------------------------------------------- */

const SKILL_ROWS: [string, string][] = [
  ["emil-design-eng", "Easing, duration and the small details that make UI feel right."],
  ["animate", "Responsive timing, interruption and reduced motion for web animation."],
  ["choreograph", "Order, overlap and stagger when several things move together."],
  ["gestures", "Drag, swipe and sheet interactions that track the finger."],
  ["stageshow", "Faux product UI stills and animations for landing pages."],
  ["unslop", "A checklist of the tells that make an interface look machine-made."],
]

function MakeRows() {
  const rows: [string, string, string, string][] = [
    ["Studio", "Make your own: tune any piece and export PNG, SVG, video or GIF.", "#/studio", "Open Studio"],
    ["MCP", "Connect Pane to your coding agent and let it pull pieces for you.", "#/mcp", "Set up MCP"],
  ]
  return (
    <section className={cn(wrap, "pt-14 pb-6 sm:pt-20 sm:pb-10")}>
      <ul className="border-t border-black/[0.08] dark:border-white/[0.1]">
        {rows.map(([name, desc, href, cta]) => (
          <li key={name} className="border-b border-black/[0.08] dark:border-white/[0.1]">
            <a href={href} className="lp-press grid items-baseline gap-1 py-5 hover:bg-black/[0.02] sm:grid-cols-[120px_1fr_auto] sm:gap-6 dark:hover:bg-white/[0.03]">
              <span className="text-[16px] font-medium leading-6">{name}</span>
              <span className="text-[15px] leading-6 text-neutral-500 dark:text-neutral-400">{desc}</span>
              <span className="text-[14px] text-neutral-900 dark:text-white">{cta} →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SkillsTeaser() {
  if (!SKILLS.length) return null
  return (
    <section className={cn(wrap, section)}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className={h2Cls}>Skills for your coding agent.</h2>
          <p className={cn(bodyMuted, "mt-5 max-w-[44ch]")}>Install Emil Kowalski's animation and design skills, Stageshow and Unslop with one line, or add your own.</p>
          <PrimaryLink href="#/skills" className="mt-8">
            Browse skills
          </PrimaryLink>
        </div>
        <ul className="border-t border-black/[0.08] lg:col-span-6 lg:col-start-7 dark:border-white/[0.1]">
          {SKILL_ROWS.map(([name, desc]) => (
            <li key={name} className="border-b border-black/[0.08] dark:border-white/[0.1]">
              <a href="#/skills" className="lp-press grid gap-1 py-4 hover:bg-black/[0.02] sm:grid-cols-[170px_1fr] sm:gap-6 dark:hover:bg-white/[0.03]">
                <span className="font-mono text-[14px] leading-5">{name}</span>
                <span className="text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">{desc}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* Closing + footer ---------------------------------------------------------- */

function Closing({ slug }: { slug: string }) {
  return (
    <section className={cn(wrap, section)}>
      <div className="rounded-3xl bg-neutral-50 px-6 py-14 text-center shadow-[0_0_0_1px_rgb(0_0_0/0.06)] sm:py-16 dark:bg-white/[0.03] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
        <h2 className={cn(h2Cls, "mx-auto max-w-[16ch]")}>Start with one piece.</h2>
        <p className={cn(bodyMuted, "mx-auto mt-5 max-w-[44ch]")}>Pick one, run one command, own the file. No account, no tiers, nothing to pay.</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <InstallChip slug={slug} className="w-full sm:w-auto sm:min-w-[520px]" />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const link = "lp-press text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
  const credit = "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 dark:decoration-neutral-600 dark:hover:text-white"
  const colTitle = "mb-1 text-[13px] font-medium text-neutral-900 dark:text-white"
  return (
    <footer className={cn(wrap, "mt-24 pb-16 sm:mt-32")}>
      <div className="grid grid-cols-2 gap-10 border-t border-black/[0.08] pt-10 sm:grid-cols-[2fr_1fr_1fr] dark:border-white/[0.1]">
        <div className="col-span-2 sm:col-span-1">
          <a href="#/" className="flex items-center gap-2.5 text-[16px] font-medium tracking-[-0.01em]">
            <Mark />
            Pane
          </a>
          <p className="mt-3 max-w-[32ch] text-[14px] leading-5 text-neutral-500 dark:text-neutral-400">One-file React pieces for AI products and agents.</p>
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className={colTitle}>Library</div>
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className={colTitle}>Project</div>
          <a href={GITHUB} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>
          <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className={link}>
            Issues
          </a>
          <span className="text-neutral-500 dark:text-neutral-400">MIT licence</span>
        </div>
      </div>
      <p className="mt-10 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
        MIT © Turar Kametay. Inspired by{" "}
        <a href="https://www.affectui.com" target="_blank" rel="noreferrer" className={credit}>
          affectUI
        </a>{" "}
        and{" "}
        <a href="https://uiarc.dev" target="_blank" rel="noreferrer" className={credit}>
          Arc UI
        </a>
        ; all code written from scratch. Skills by Emil Kowalski, Benji Taylor (Stageshow) and Damir Sokolovsky (Unslop,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className={credit}>
          CC BY 4.0
        </a>
        ).
      </p>
    </footer>
  )
}

/* Page --------------------------------------------------------------------- */

export function Landing({ groups, dark, toggleDark, style, setStyle, styles }: LandingProps) {
  const all = React.useMemo(() => groups.flatMap((g) => g.entries).filter((e) => e.kind !== "screen"), [groups])
  const find = React.useCallback((slug: string) => all.find((e) => e.slug === slug && e.demo), [all])
  const slug = ["model-arena", "ai-answer", "agent-orchestrator"].find((s) => find(s)) ?? "ai-answer"

  React.useEffect(() => {
    const prev = document.title
    document.title = "Pane: the screens AI products need"
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="lp min-h-dvh overflow-x-clip">
      <style href="landing" precedence="default">
        {CSS}
      </style>
      <Nav dark={dark} toggleDark={toggleDark} />
      <Hero find={find} total={all.length} skills={SKILLS.length} slug={slug} />
      <Gallery groups={groups} />
      <HowBuilt find={find} style={style} setStyle={setStyle} styles={styles} />
      <MakeRows />
      <SkillsTeaser />
      <Closing slug={slug} />
      <Footer />
    </div>
  )
}
