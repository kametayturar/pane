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

/* Styles for the things Tailwind can't say (keyframes, gradients) ------------- */

const CSS = `
.lp { --lp-ease: ${EASE}; }
.lp-reveal { opacity: 0; transform: translateY(14px); filter: blur(4px);
  transition: opacity .8s var(--lp-ease), transform .8s var(--lp-ease), filter .8s var(--lp-ease); transition-delay: var(--d, 0ms); }
.lp-reveal[data-in] { opacity: 1; transform: none; filter: none; }
.lp-fade { animation: lp-fade .6s var(--lp-ease) backwards; animation-delay: var(--d, 0ms); }
@keyframes lp-fade { from { opacity: 0; transform: translateY(8px); filter: blur(4px); } }

.lp-hero { position: relative; isolation: isolate;
  background:
    radial-gradient(58% 72% at 94% -8%, #c8d2ff 0%, transparent 62%),
    radial-gradient(48% 62% at 2% 104%, #ffd8d2 0%, transparent 66%),
    radial-gradient(44% 52% at 58% 112%, #fff0c4 0%, transparent 72%),
    #f6f5f1; }
.dark .lp-hero {
  background:
    radial-gradient(58% 72% at 94% -8%, rgb(99 102 241 / .30), transparent 62%),
    radial-gradient(48% 62% at 2% 104%, rgb(244 114 100 / .15), transparent 66%),
    radial-gradient(44% 52% at 58% 112%, rgb(250 204 21 / .09), transparent 72%),
    #131316; }
.lp-hero::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background-image: radial-gradient(circle at center, rgb(20 20 40 / .16) 1px, transparent 1.4px); background-size: 12px 12px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 62%); -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 62%); }
.dark .lp-hero::before { background-image: radial-gradient(circle at center, rgb(255 255 255 / .12) 1px, transparent 1.4px); }

.lp-cta { background:
    radial-gradient(60% 90% at 100% 0%, #c8d2ff 0%, transparent 60%),
    radial-gradient(50% 80% at 0% 100%, #ffd8d2 0%, transparent 64%),
    #f6f5f1; }
.dark .lp-cta { background:
    radial-gradient(60% 90% at 100% 0%, rgb(99 102 241 / .28), transparent 60%),
    radial-gradient(50% 80% at 0% 100%, rgb(244 114 100 / .14), transparent 64%),
    #131316; }

.lp-marq { display: flex; width: max-content; animation: lp-marq 90s linear infinite; }
.lp-marq[data-rev] { animation-direction: reverse; animation-duration: 110s; }
.lp-marq-wrap:hover .lp-marq { animation-play-state: paused; }
@keyframes lp-marq { to { transform: translateX(-50%); } }

.lp-dot-x { animation: lp-dot-x 3.6s linear infinite; }
.lp-dot-y { animation: lp-dot-y 3.6s infinite; }
@keyframes lp-dot-x { 0%, 12% { transform: translateX(0); } 62%, 100% { transform: translateX(196px); } }
@keyframes lp-dot-y { 0%, 12% { transform: translateY(0); animation-timing-function: cubic-bezier(.22, 1, .36, 1); } 62%, 100% { transform: translateY(-92px); } }

@media (prefers-reduced-motion: reduce) {
  .lp-reveal { opacity: 1; transform: none; filter: none; transition: none; }
  .lp-fade { animation: none; }
  .lp-marq, .lp-dot-x, .lp-dot-y { animation: none; }
  .lp-dot-x { transform: translateX(196px); } .lp-dot-y { transform: translateY(-92px); }
  .lp-dot { transform: translateX(var(--lp-run, 160px)); }
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

/** Fades, lifts and un-blurs its children the first time they scroll into view. */
function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [shown, setShown] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref as never} className={cn("lp-reveal", className)} data-in={shown ? "" : undefined} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  )
}

const ring = "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
const ringHover = "transition-shadow hover:shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_22px_44px -24px rgb(30_30_80/0.35)] dark:hover:shadow-[0_0_0_1px_rgb(255_255_255/0.16),0_22px_44px -24px rgb(0_0_0/0.7)]"
const wrap = "mx-auto w-full max-w-[1240px] px-4 sm:px-6"

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

function InstallPill({ slugs, className, size = "md" }: { slugs: string[]; className?: string; size?: "md" | "lg" }) {
  const [copied, copy] = useCopied()
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (slugs.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % slugs.length), 2600)
    return () => window.clearInterval(id)
  }, [slugs.length])
  const name = slugs[i % slugs.length]
  const cmd = `npx shadcn@latest add ${SITE}/r/${name}.json`
  return (
    <button
      type="button"
      onClick={() => copy(cmd)}
      aria-label={`Copy install command for ${name}`}
      className={cn(
        "group flex max-w-full min-w-0 items-center gap-2.5 rounded-xl bg-white/70 pr-2 pl-3.5 text-left font-mono text-neutral-600 shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur transition-colors hover:bg-white dark:bg-white/[0.06] dark:text-neutral-300 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10",
        size === "lg" ? "h-12 text-[13px]" : "h-11 text-[12.5px]",
        className,
      )}
    >
      <span className="text-neutral-400 select-none">$</span>
      <span className="min-w-0 truncate">
        <span className="hidden sm:inline">npx shadcn@latest add {SITE}/r/</span>
        <span className="sm:hidden">npx shadcn add </span>
        <span key={name} className="lp-fade inline-block font-medium text-neutral-900 dark:text-white">
          {name}
        </span>
        .json
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-500 transition-colors group-hover:bg-black/5 group-hover:text-neutral-900 dark:group-hover:bg-white/10 dark:group-hover:text-white">
        {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  )
}

function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-900 px-5 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.2)] transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}

function SectionHead({ eyebrow, title, sub, children }: { eyebrow: string; title: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="text-[12px] font-medium tracking-[0.08em] text-neutral-400 uppercase">{eyebrow}</div>
        <h2 className="mt-3 text-[32px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[46px]">{title}</h2>
        {sub && <p className="mt-4 max-w-xl text-[16px] leading-7 text-neutral-500 dark:text-neutral-400">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

/* Nav ---------------------------------------------------------------------- */

const NAV = [
  ["Components", "#/browse"],
  ["Illustrations", "#/browse/Illustrations"],
  ["Motion", "#/browse/Motion"],
  ["Skills", "#/skills"],
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
  const linkCls = "rounded-lg px-3 py-1.5 text-[14px] text-neutral-500 transition-colors hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
  return (
    <nav aria-label="Main" className={cn("sticky top-0 z-50 transition-[background-color,box-shadow] duration-300", scrolled ? "bg-white/80 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-xl dark:bg-neutral-950/75 dark:shadow-[0_1px_0_rgb(255_255_255/0.08)]" : "bg-transparent")}>
      <div className={cn(wrap, "flex h-14 items-center gap-2")}>
        <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
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
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="grid size-9 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a href="#/browse" className="ml-1 hidden h-9 items-center rounded-lg bg-neutral-900 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800 sm:inline-flex dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Browse library
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-black/[0.04] md:hidden dark:text-neutral-400 dark:hover:bg-white/[0.06]"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden dark:border-white/[0.08] dark:bg-neutral-950/95">
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
      <span className="mx-auto font-mono text-[11px] text-neutral-400">{title}</span>
      <span className="w-[42px]" />
    </div>
  )
}

function Hero({ find, stats, slugs }: { find: (slug: string) => LandingEntry | undefined; stats: [number, string][]; slugs: string[] }) {
  const orchestrator = find("agent-orchestrator") ?? find("neural-panels")
  const approvals = find("agent-approvals") ?? find("approval-card")
  const trace = find("tool-call-card") ?? find("thinking-loader")
  return (
    <header className="px-2 sm:px-4">
      <div className="lp-hero mx-auto max-w-[1400px] overflow-hidden rounded-[28px] sm:rounded-[40px]">
        <div className="mx-auto flex max-w-[980px] flex-col items-center px-5 pt-14 text-center sm:pt-24">
          <Reveal>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 py-1 pr-3 pl-1 text-[12.5px] text-neutral-600 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] backdrop-blur transition-colors hover:bg-white dark:bg-white/[0.07] dark:text-neutral-300 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10"
            >
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-white dark:text-neutral-900">Open source</span>
              MIT licensed, free forever
              <ArrowUpRight className="size-3 opacity-50" />
            </a>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-[44px] leading-[0.98] font-medium tracking-[-0.05em] text-balance sm:text-[72px] lg:text-[88px]">
              Interfaces for AI,
              <br />
              <span className="text-neutral-400 dark:text-neutral-500">made with taste.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-7 text-neutral-600 sm:text-[18px] sm:leading-8 dark:text-neutral-400">
              Open-source components, blocks and animated scenes for chat, agents and everything around them. One file each, calm motion, dark mode built in.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <PrimaryLink href="#/browse" className="w-full justify-center sm:w-auto">
              Browse the library
            </PrimaryLink>
            <InstallPill slugs={slugs} className="w-full sm:w-auto" />
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              {stats.map(([n, label]) => (
                <li key={label} className="flex items-baseline gap-1.5">
                  <span className="font-medium text-neutral-900 tabular-nums dark:text-white">{n}</span>
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {orchestrator?.demo && (
          <Reveal delay={420} className="relative mx-auto mt-12 max-w-[1120px] px-3 sm:mt-16 sm:px-8">
            <div className={cn("overflow-hidden rounded-t-[18px] bg-white dark:bg-neutral-900 sm:rounded-t-[22px]", "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_50px_100px_-40px_rgb(40_40_110/0.45)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_50px_100px_-40px_rgb(0_0_0/0.9)]")}>
              <WindowBar title={`${orchestrator.slug}.tsx`} />
              <LivePreview Demo={orchestrator.demo} width={940} align="top" bare replay={16000} className="h-[330px] sm:h-[480px] lg:h-[560px]" />
            </div>
            {approvals?.demo && (
              <div className={cn("absolute bottom-0 -left-2 hidden w-[330px] overflow-hidden rounded-t-2xl bg-white lg:-left-6 lg:block dark:bg-neutral-900", "shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_30px_60px_-20px_rgb(40_40_110/0.4)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_30px_60px_-20px_rgb(0_0_0/0.8)]")}>
                <LivePreview Demo={approvals.demo} width={520} align="top" bare replay={11000} className="h-[210px]" />
              </div>
            )}
            {trace?.demo && (
              <div className={cn("absolute top-24 -right-2 hidden w-[300px] overflow-hidden rounded-2xl bg-white lg:-right-8 lg:block dark:bg-neutral-900", "shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_30px_60px_-20px_rgb(40_40_110/0.4)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_30px_60px_-20px_rgb(0_0_0/0.8)]")}>
                <LivePreview Demo={trace.demo} width={520} align="top" bare replay={9000} className="h-[170px]" />
              </div>
            )}
          </Reveal>
        )}
      </div>
    </header>
  )
}

/* Ticker ------------------------------------------------------------------- */

function Ticker({ entries }: { entries: LandingEntry[] }) {
  const rows = React.useMemo(() => {
    const a: LandingEntry[] = []
    const b: LandingEntry[] = []
    entries.forEach((e, i) => (i % 2 ? b : a).push(e))
    return [a, b]
  }, [entries])
  return (
    <section aria-label="Pieces in the library" className="mt-20 flex flex-col gap-3 sm:mt-28">
      {rows.map((row, r) => (
        <div
          key={r}
          className="lp-marq-wrap overflow-hidden py-1.5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
        >
          <div className="lp-marq" data-rev={r ? "" : undefined} aria-hidden={r > 0 ? true : undefined}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 gap-3 pr-3" aria-hidden={copy > 0 ? true : undefined}>
                {row.map((e) => (
                  <li key={e.slug}>
                    <a
                      href={`#/${e.slug}`}
                      tabIndex={copy > 0 || r > 0 ? -1 : undefined}
                      className="flex h-10 items-center gap-2 rounded-full bg-white pr-4 pl-3 text-[13.5px] text-neutral-600 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:text-neutral-900 dark:bg-white/[0.05] dark:text-neutral-400 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)] dark:hover:text-white"
                    >
                      <e.icon className="size-4 text-neutral-400" />
                      {e.name}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </section>
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
  { group: "Showpieces", label: "Showpieces", blurb: "Motion-heavy interface pieces with real physics and depth." },
  { group: "Charts", label: "Charts", blurb: "Data that moves with your pointer and settles when you stop." },
  { group: "AI concepts", label: "AI concepts", blurb: "Animated explainers of how models and agents actually work." },
  {
    group: "Illustrations",
    label: "Illustrations",
    blurb: "Dithered scenes for hero and feature sections, on backgrounds you pick.",
    picks: [
      { slug: "neural-panels", width: 1040, variant: "plain", accent: "#5b5bd6" },
      { slug: "voice-orb", width: 500, variant: "aurora" },
      { slug: "data-flow", width: 640, variant: "dots" },
      { slug: "agent-team", width: 640, variant: "grid" },
      { slug: "mixture-of-experts", width: 640, variant: "dots" },
      { slug: "glow-keyboard", width: 640, variant: "aurora" },
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

function Tile({ entry, pick, className, index }: { entry: LandingEntry; pick: TilePick; className?: string; index: number }) {
  const studio = entry.kind === "illustrations" || entry.kind === "motion"
  const [hovered, setHovered] = React.useState(false)
  const narrow = useNarrow()
  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn("lp-fade group relative flex min-h-[240px] flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900", ring, ringHover, className)}
      style={{ "--d": `${index * 60}ms` } as React.CSSProperties}
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
            replay={studio ? undefined : 13000}
            hovered={hovered}
            className="absolute inset-0"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
      </div>
      <div className="flex items-center gap-3 border-t border-black/[0.06] px-5 py-3.5 dark:border-white/[0.07]">
        <div className="min-w-0">
          <a href={`#/${entry.slug}`} className="text-[14.5px] font-semibold tracking-tight after:absolute after:inset-0 after:content-['']">
            {entry.name}
          </a>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-neutral-500 dark:text-neutral-400">{entry.description}</p>
        </div>
        <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-white transition-transform duration-300 group-hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900">
          <ArrowUpRight className="size-4" />
        </span>
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
    <section id="library" className={cn(wrap, "mt-24 scroll-mt-20 sm:mt-36")}>
      <Reveal>
        <SectionHead eyebrow="The library" title="Everything an AI product puts on screen." sub="Real, running pieces, not screenshots. Each one plays on its own and opens into a page with the source." />
      </Reveal>
      <Reveal delay={100} className="mt-10">
        <div role="tablist" aria-label="Browse by use" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.group}
              type="button"
              role="tab"
              aria-selected={current.group === t.group}
              onClick={() => setActive(t.group)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors",
                current.group === t.group
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] hover:text-neutral-900 dark:text-neutral-400 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:text-white",
              )}
            >
              {t.label}
              <span className={cn("text-[11.5px] tabular-nums", current.group === t.group ? "opacity-60" : "text-neutral-400")}>{t.total}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-[14.5px] text-neutral-500 dark:text-neutral-400">{current.blurb}</p>
          <a href={`#/browse/${encodeURIComponent(current.group)}`} className="group flex items-center gap-1 text-[13.5px] font-medium">
            See all {current.total} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </Reveal>
      <div key={current.group} role="tabpanel" className="mt-6 grid auto-rows-[300px] gap-3 sm:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-6">
        {current.items.map(({ entry, pick }, i) => (
          <Tile key={entry.slug} entry={entry} pick={pick} index={i} className={cn(i === 0 && "sm:col-span-2", spans[i])} />
        ))}
      </div>
    </section>
  )
}

/* How it's built ------------------------------------------------------------ */

function Card({ className, children, delay }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className={cn("relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 dark:bg-neutral-900", ring, className)}>
      {children}
    </Reveal>
  )
}

function CardTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 className="text-[18px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-1.5 max-w-[34ch] text-[14px] leading-6 text-neutral-500 dark:text-neutral-400">{children}</p>
    </>
  )
}

function EaseCurve() {
  // cubic-bezier(.22, 1, .36, 1) drawn into a 200x110 box; the dot runs the same curve.
  return (
    <div className="relative mt-6 h-[120px]" style={{ "--lp-run": "min(176px, 60cqw)" } as React.CSSProperties}>
      <svg viewBox="0 0 200 110" className="absolute inset-0 h-full w-full max-w-[220px] overflow-visible" fill="none" aria-hidden>
        <path d="M0 100 H200 M0 100 V0" className="stroke-black/10 dark:stroke-white/15" strokeWidth="1" />
        <path d="M2 100 C45 8 73 8 198 8" className="stroke-neutral-900 dark:stroke-white" strokeWidth="2" strokeLinecap="round" />
        {/* x moves linearly (time), y follows the easing (progress) – so the dot traces the curve */}
        <g className="lp-dot-x">
          <circle cx="2" cy="100" r="5" className="lp-dot-y fill-blue-600 dark:fill-blue-400" />
        </g>
      </svg>
    </div>
  )
}

function HowBuilt({ find, dark, toggleDark, style, setStyle, styles }: { find: (s: string) => LandingEntry | undefined } & Omit<LandingProps, "groups">) {
  const piece = find("ai-answer") ?? find("thinking-state")
  const files = ["ai-answer.tsx", "agent-orchestrator.tsx", "model-arena.tsx"]
  return (
    <section className={cn(wrap, "mt-28 sm:mt-44")}>
      <Reveal>
        <SectionHead eyebrow="How it's built" title="Small files you own, not a framework you rent." sub="Each piece is one file with its own tokens and its own motion. Copy it in, read it, change it." />
      </Reveal>
      <div className="mt-10 grid gap-3 lg:grid-cols-12">
        {/* Styles, live */}
        <Card className="flex min-h-[480px] flex-col lg:col-span-6 lg:row-span-2" delay={0}>
          <CardTitle title="Three looks, one switch">Classic, Mono and real Glass restyle every piece from its tokens. Switch here and watch the page follow.</CardTitle>
          <div className="mt-5 flex w-full max-w-[480px] flex-wrap gap-1 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="radiogroup" aria-label="Style">
            {styles.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={style === o.id}
                onClick={() => setStyle(o.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-2 py-1.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
                  style === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
                )}
              >
                <span className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: o.swatch }} aria-hidden />
                {o.label}
              </button>
            ))}
          </div>
          <div className="relative mt-5 flex-1 overflow-hidden rounded-2xl bg-neutral-50 shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-white/[0.03] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.07)]">
            {piece?.demo && <LivePreview Demo={piece.demo} width={720} align="top" bare replay={12000} className="absolute inset-0" />}
          </div>
        </Card>

        {/* One file */}
        <Card className="lg:col-span-6" delay={80}>
          <CardTitle title="One file each">No package to upgrade. The CLI drops a single component file into your project, and it is yours from then on.</CardTitle>
          <div className="mt-5 rounded-xl bg-neutral-950 p-4 font-mono text-[12px] leading-5 text-neutral-400 dark:bg-black/40">
            <div className="truncate">
              <span className="text-neutral-600">$</span> npx shadcn@latest add …/r/ai-answer.json
            </div>
            {files.map((f, i) => (
              <div key={f} className={cn("flex items-center gap-2", i === 0 ? "mt-2 text-neutral-200" : "text-neutral-500")}>
                <Check className="size-3 shrink-0 text-emerald-400" />
                <span className="truncate">src/components/{i === 0 ? "ui" : i === 1 ? "ui" : "blocks"}/{f}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Motion */}
        <Card className="lg:col-span-3" delay={140}>
          <CardTitle title="Motion that settles">One easing curve everywhere. Quick to start, gentle to stop. Reduced motion shows a still frame.</CardTitle>
          <div className="@container">
            <EaseCurve />
          </div>
          <div className="mt-2 font-mono text-[11px] text-neutral-400">cubic-bezier(.22, 1, .36, 1)</div>
        </Card>

        {/* Dark */}
        <Card className="lg:col-span-3" delay={200}>
          <CardTitle title="Dark mode built in">Colour is the alpha of one ink token, so a single variable flips a whole piece.</CardTitle>
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-neutral-50 p-3 text-left shadow-[0_0_0_1px_rgb(0_0_0/0.05)] transition-colors hover:bg-neutral-100 dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.07)] dark:hover:bg-white/[0.07]"
          >
            <span className="relative h-6 w-10 shrink-0 rounded-full bg-neutral-200 transition-colors dark:bg-blue-500">
              <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300", dark && "translate-x-4")} style={{ transitionTimingFunction: EASE }} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium">{dark ? "Dark" : "Light"}</span>
              <span className="block truncate font-mono text-[11px] text-neutral-400">--ink: {dark ? "#fff" : "#000"}</span>
            </span>
          </button>
          <div className="mt-4 flex items-end gap-1.5" aria-hidden>
            {[88, 61, 45, 27, 6].map((a) => (
              <div key={a} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="h-9 w-full rounded-lg bg-neutral-900 dark:bg-white" style={{ opacity: a / 100 }} />
                <span className="font-mono text-[10.5px] text-neutral-400">{a}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Any tool */}
        <Card className="flex flex-col gap-6 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between" delay={80}>
          <div>
            <CardTitle title="Made to be read by your AI tool, too">Every piece ships notes on the technique behind it, so an agent can read it, extend it and keep the taste.</CardTitle>
          </div>
          <ul className="flex flex-wrap gap-2">
            {["shadcn CLI", "Claude Code", "Cursor", "Codex", "Any agent that reads files"].map((t) => (
              <li key={t} className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-[13px] text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}

/* Skills ------------------------------------------------------------------- */

function SkillsTeaser() {
  // One skill per category, so the stack shows the range rather than one repo four times.
  const top = React.useMemo(() => {
    const seen = new Set<string>()
    return [...SKILLS]
      .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
      .filter((s) => !seen.has(s.category) && !!seen.add(s.category))
      .slice(0, 4)
  }, [])
  if (!SKILLS.length) return null
  return (
    <section className={cn(wrap, "mt-28 sm:mt-44")}>
      <div className={cn("grid gap-10 overflow-hidden rounded-[32px] bg-white p-7 sm:p-12 lg:grid-cols-[1fr_1.1fr] lg:items-center dark:bg-neutral-900", ring)}>
        <Reveal>
          <div className="text-[12px] font-medium tracking-[0.08em] text-neutral-400 uppercase">Skills</div>
          <h2 className="mt-3 text-[32px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[44px]">Teach your agent the taste, too.</h2>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-neutral-500 dark:text-neutral-400">
            Components give your product its look. Skills give your coding agent the judgement behind it. We collect {SKILLS.length} open-source agent skills for design, motion and accessibility, each with its install line.
          </p>
          <a href="#/skills" className="group mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-900 px-5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Browse {SKILLS.length} skills
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>
        <div className="flex flex-col gap-2.5">
          {top.map((s, i) => (
            <Reveal key={s.id} delay={100 + i * 80} className={cn(i % 2 ? "lg:ml-8" : "lg:mr-8")}>
              <a href="#/skills" className="block rounded-2xl bg-neutral-50 p-4 shadow-[0_0_0_1px_rgb(0_0_0/0.05)] transition-colors hover:bg-neutral-100 dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.07)] dark:hover:bg-white/[0.07]">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 truncate font-mono text-[13px] font-medium">{s.name}</span>
                  <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] whitespace-nowrap text-neutral-500 dark:bg-white/10 dark:text-neutral-400">{s.category}</span>
                  <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">{s.description}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Closing + footer ---------------------------------------------------------- */

function Closing({ slugs }: { slugs: string[] }) {
  return (
    <section className={cn(wrap, "mt-28 sm:mt-44")}>
      <Reveal className="lp-cta relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:rounded-[40px] sm:py-24">
        <h2 className="mx-auto max-w-[14ch] text-[40px] leading-[1] font-medium tracking-[-0.045em] text-balance sm:text-[64px]">Start with one piece.</h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-7 text-neutral-600 dark:text-neutral-400">Pick what you need, run one command, and own the file. No account, no tiers, nothing to pay.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryLink href="#/browse">Browse the library</PrimaryLink>
          <InstallPill slugs={slugs} size="lg" />
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const link = "text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
  return (
    <footer className={cn(wrap, "mt-24 pb-12 sm:mt-32")}>
      <div className="grid gap-10 border-t border-black/[0.07] pt-10 sm:grid-cols-[1.4fr_1fr_1fr] dark:border-white/[0.08]">
        <div>
          <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
            <Mark />
            Pane
          </a>
          <p className="mt-3 max-w-[32ch] text-[13.5px] leading-6 text-neutral-500 dark:text-neutral-400">An open-source taste library for AI products and agents.</p>
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[12px] font-medium tracking-[0.08em] text-neutral-400 uppercase">Library</div>
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[12px] font-medium tracking-[0.08em] text-neutral-400 uppercase">Project</div>
          <a href={GITHUB} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>
          <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className={link}>
            Issues
          </a>
          <span className="text-neutral-500 dark:text-neutral-400">MIT licence</span>
        </div>
      </div>
      <p className="mt-10 text-[12.5px] leading-5 text-neutral-400">
        MIT © Turar Kametay. Inspired by{" "}
        <a href="https://www.affectui.com" target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-200">
          affectUI
        </a>
        ,{" "}
        <a href="https://uiarc.dev" target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-200">
          Arc UI
        </a>{" "}
        and others. All code written from scratch.
      </p>
    </footer>
  )
}

/* Page --------------------------------------------------------------------- */

export function Landing({ groups, dark, toggleDark, style, setStyle, styles }: LandingProps) {
  const all = React.useMemo(() => groups.flatMap((g) => g.entries).filter((e) => e.kind !== "screen"), [groups])
  const find = React.useCallback((slug: string) => all.find((e) => e.slug === slug && e.demo), [all])
  const count = (k: string) => all.filter((e) => e.kind === k).length
  const stats = ([
    [all.length, "pieces"],
    [count("ui") + count("blocks"), "components & blocks"],
    [count("illustrations"), "illustrations"],
    [count("motion"), "motion effects"],
    [SKILLS.length, "agent skills"],
  ] as [number, string][]).filter(([n]) => n)
  const slugs = ["ai-answer", "agent-orchestrator", "model-arena", "neural-panels", "tool-call-card", "voice-orb", "eval-suite"].filter((s) => find(s))
  const ticker = React.useMemo(() => all.filter((e) => e.demo), [all])

  React.useEffect(() => {
    const prev = document.title
    document.title = "Pane: interfaces for AI, made with taste"
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
      <Hero find={find} stats={stats} slugs={slugs.length ? slugs : ["ai-answer"]} />
      <Ticker entries={ticker} />
      <Gallery groups={groups} />
      <HowBuilt find={find} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} styles={styles} />
      <SkillsTeaser />
      <Closing slugs={slugs.length ? slugs : ["ai-answer"]} />
      <Footer />
    </div>
  )
}
