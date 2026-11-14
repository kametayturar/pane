import * as React from "react"
import { ArrowRight, ArrowUpRight, Check, Copy, Download, Menu, Moon, Sun, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaneMark } from "@/pane-mark"
import { LivePreview, type DemoComponent } from "@/live-preview"
import { SKILLS } from "@/skills-page"

/* Direction B – "The gallery". The page is set like a printed design annual: warm paper, a serif display face,
   numbered plates with catalogue captions. Pane's own code-drawn art carries the page, and the product sits on it. */

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
const MCP_CMD = `claude mcp add --transport http pane ${SITE}/api/mcp`

/* Art and live pieces, loaded on demand ------------------------------------------ */

type ArtProps = { palette?: string; canvasRef?: React.Ref<HTMLCanvasElement>; controls?: boolean; className?: string; seed?: number }

const PastelHarbor = React.lazy(() => import("@/components/illustrations/pastel-harbor").then((m) => ({ default: m.PastelHarbor as React.ComponentType<ArtProps> })))
const PencilGreenhouse = React.lazy(() => import("@/components/illustrations/pencil-greenhouse").then((m) => ({ default: m.PencilGreenhouse as React.ComponentType<ArtProps> })))
const GouacheLake = React.lazy(() => import("@/components/illustrations/gouache-lake").then((m) => ({ default: m.GouacheLake as React.ComponentType<ArtProps> })))
const ChalkObservatory = React.lazy(() => import("@/components/illustrations/chalk-observatory").then((m) => ({ default: m.ChalkObservatory as React.ComponentType<ArtProps> })))
const Odometer = React.lazy(() => import("@/components/ui/odometer").then((m) => ({ default: m.Odometer as React.ComponentType<Record<string, never>> })))
type Piece = React.LazyExoticComponent<React.ComponentType<Record<string, never>>>
const piece = <M,>(load: () => Promise<M>, pick: (m: M) => unknown): Piece => React.lazy(() => load().then((m) => ({ default: pick(m) as React.ComponentType<Record<string, never>> })))
const PIECES: Record<string, Piece> = {
  "scope-words": piece(() => import("@/components/ui/scope-words"), (m) => m.ScopeWords),
  "tool-headline": piece(() => import("@/components/ui/tool-headline"), (m) => m.ToolHeadline),
  "undo-countdown": piece(() => import("@/components/ui/undo-countdown"), (m) => m.UndoCountdown),
  "merge-range": piece(() => import("@/components/ui/merge-range"), (m) => m.MergeRange),
  "effort-sentence": piece(() => import("@/components/ui/effort-sentence"), (m) => m.EffortSentence),
}

/* Styles ------------------------------------------------------------------- */

const CSS = `
.lb {
  --ease: ${EASE};
  --paper: #f4f0e6; --paper-2: #ebe5d7; --card: #fbf9f3;
  --ink: #1d1b16; --ink-2: rgb(29 27 22 / .66); --ink-3: rgb(29 27 22 / .46);
  --rule: rgb(29 27 22 / .12); --rule-2: rgb(29 27 22 / .2);
  --lift: 0 0 0 1px rgb(29 27 22 / .07), 0 1px 2px rgb(29 27 22 / .05), 0 24px 48px -28px rgb(60 40 30 / .35);
  --serif: "Instrument Serif", ui-serif, Georgia, serif;
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--paper); color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dark .lb {
  --paper: #12110f; --paper-2: #1a1916; --card: #1d1c19;
  --ink: #efe9dc; --ink-2: rgb(239 233 220 / .64); --ink-3: rgb(239 233 220 / .42);
  --rule: rgb(239 233 220 / .1); --rule-2: rgb(239 233 220 / .18);
  --lift: 0 0 0 1px rgb(239 233 220 / .08), 0 24px 48px -28px rgb(0 0 0 / .8);
}
.lb ::selection { background: rgb(29 27 22 / .14) }
.dark .lb ::selection { background: rgb(239 233 220 / .2) }
.lb-serif { font-family: var(--serif); font-weight: 400; letter-spacing: -0.012em }
.lb-mono { font-family: var(--mono) }
.lb a:focus-visible, .lb button:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px }

/* Art fills whatever box it is put in, without its own card styling. */
.lb-fill { position: absolute; inset: 0 }
.lb-fill :is(.ph, .pgh, .gq, .co) { max-width: none; height: 100% }
.lb-fill :is(.ph-stage, .pgh-stage, .gq-stage, .co-stage) { aspect-ratio: auto !important; height: 100%; border-radius: 0; box-shadow: none }

.lb-in { animation: lb-in .9s var(--ease) both; animation-delay: var(--d, 0ms) }
@keyframes lb-in { from { opacity: 0; transform: translateY(10px); filter: blur(4px) } }
.lb-rise { opacity: 0; transform: translateY(12px); transition: opacity .8s var(--ease), transform .8s var(--ease); transition-delay: var(--d, 0ms) }
.lb-rise[data-in] { opacity: 1; transform: none }

.lb-press { transition: background-color .2s var(--ease), color .2s var(--ease), transform .16s var(--ease), box-shadow .2s var(--ease) }
.lb-press:active { transform: scale(.98) }
.lb-arrow { transition: transform .25s var(--ease) }
.group:hover .lb-arrow { transform: translateX(2px) }
.lb-exhibit .lb-frame { transition: box-shadow .35s var(--ease) }
.lb-exhibit:hover .lb-frame { box-shadow: 0 0 0 1px var(--rule-2), 0 30px 60px -36px rgb(60 40 30 / .45) }

@media (prefers-reduced-motion: reduce) {
  .lb-in { animation: none }
  .lb-rise { opacity: 1; transform: none; transition: none }
  .lb-press:active { transform: none }
}
`

/* Small helpers ------------------------------------------------------------ */

const wrap = "mx-auto w-full max-w-[1320px] px-4 sm:px-8"

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

/** Mounts its children the first time the box comes near the viewport, and keeps them mounted after. */
function WhenVisible({ children, className, margin = "300px" }: { children: React.ReactNode; className?: string; margin?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return (
    <div ref={ref} className={className}>
      {on && <React.Suspense fallback={null}>{children}</React.Suspense>}
    </div>
  )
}

/** Fades and lifts once, the first time it scrolls into view. */
function Rise({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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
      { rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={cn("lb-rise", className)} data-in={shown ? "" : undefined} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  )
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/** The catalogue line under a plate: number, title, medium, and an optional link on the right. */
function Caption({ n, title, medium, href, link, className }: { n: string; title: string; medium: string; href?: string; link?: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-3", className)}>
      <span className="lb-mono text-[11.5px] text-[var(--ink-3)] tabular-nums">Plate {n}</span>
      <span className="lb-serif text-[19px] leading-none">{title}</span>
      <span className="text-[13px] text-[var(--ink-2)]">{medium}</span>
      {href && (
        <a href={href} className="group ml-auto flex items-center gap-1 text-[13px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]">
          {link}
          <ArrowUpRight className="lb-arrow size-3.5" />
        </a>
      )}
    </div>
  )
}

function SolidLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "lb-press group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[14px] font-medium text-[var(--paper)] hover:opacity-90",
        className,
      )}
    >
      {children}
      <ArrowRight className="lb-arrow size-4" />
    </a>
  )
}

function QuietLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "lb-press group inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--rule-2)] hover:bg-[var(--paper-2)]",
        className,
      )}
    >
      {children}
    </a>
  )
}

/** A copyable command. On narrow screens it wraps instead of clipping, so the whole line stays readable. */
function Command({ text, label, className, big }: { text: string; label: string; className?: string; big?: boolean }) {
  // Break a long URL after its host and path on a phone, never in the middle of a word.
  const parts = text.split(/(?<= )(?=https?:)|(?<=\/r\/)/)
  const [copied, copy] = useCopied()
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={label}
      className={cn(
        "lb-press group flex w-full min-w-0 items-start gap-3 rounded-2xl bg-[var(--card)] text-left shadow-[0_0_0_1px_var(--rule)] hover:shadow-[0_0_0_1px_var(--rule-2)]",
        big ? "px-5 py-4 sm:px-6 sm:py-5" : "px-4 py-3",
        className,
      )}
    >
      <span className={cn("lb-mono text-[var(--ink-3)] select-none", big ? "text-[14px] leading-6 sm:text-[15px]" : "text-[12.5px] leading-5")}>$</span>
      <span className={cn("lb-mono min-w-0 flex-1 [overflow-wrap:anywhere] text-[var(--ink)]", big ? "text-[14px] leading-6 sm:text-[15px]" : "text-[12.5px] leading-5")}>
        {parts.map((p, i) => (
          <span key={i} className="max-md:block">
            {p}
          </span>
        ))}
      </span>
      <span className="grid size-6 shrink-0 place-items-center text-[var(--ink-3)] transition-colors group-hover:text-[var(--ink)]">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
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
  const link = "rounded-full px-3 py-1.5 text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
  return (
    <nav
      aria-label="Main"
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-[color-mix(in_srgb,var(--paper)_86%,transparent)] shadow-[0_1px_0_var(--rule)] backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className={cn(wrap, "flex h-16 items-center gap-2")}>
        <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
          <PaneMark className="size-7" />
          Pane
        </a>
        <div className="mx-auto hidden items-center lg:flex">
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <a href={GITHUB} target="_blank" rel="noreferrer" className={cn(link, "flex items-center gap-1.5")}>
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid size-9 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a
            href="#/browse"
            className="lb-press ml-1 hidden h-9 items-center rounded-full bg-[var(--ink)] px-4 text-[13.5px] font-medium text-[var(--paper)] hover:opacity-90 sm:inline-flex"
          >
            Library
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-[var(--ink-2)] lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--rule)] bg-[var(--paper)] px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1320px] flex-col">
            {[...NAV, ["Library", "#/browse"] as const].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] text-[var(--ink)] hover:bg-[var(--paper-2)]">
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

function Hero({ total, slug }: { total: number; slug: string }) {
  // The harbour starts drawing one frame after the words have painted.
  const [art, setArt] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setArt(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <header className={cn(wrap, "pt-10 sm:pt-14")}>
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="lb-in lb-mono text-[12px] text-[var(--ink-3)]">
            Pane · {total} open-source pieces · MIT
          </p>
          <h1 className="lb-in lb-serif mt-5 text-[52px] leading-[0.95] text-balance sm:text-[84px] xl:text-[100px]" style={{ "--d": "60ms" } as React.CSSProperties}>
            Interface pieces for AI products, drawn in code.
          </h1>
        </div>
        <div className="lb-in lg:col-span-4 lg:pb-3" style={{ "--d": "140ms" } as React.CSSProperties}>
          <p className="max-w-[40ch] text-[16px] leading-7 text-[var(--ink-2)]">
            Chat, agents, overlays, illustrations and motion as one-file React components. Copy one into your project yourself, or let your coding agent fetch it.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <SolidLink href="#/browse">Browse the library</SolidLink>
            <QuietLink href="#/studio">Open Studio</QuietLink>
          </div>
        </div>
      </div>

      <figure className="mt-10 sm:mt-14">
        <div className="relative h-[520px] overflow-hidden rounded-[6px] bg-[#f4e6c8] shadow-[var(--lift)] sm:h-[560px] lg:h-[620px]">
          {art && (
            <div className="lb-fill">
              <React.Suspense fallback={null}>
                <PastelHarbor />
              </React.Suspense>
            </div>
          )}
          <div className="lb-in absolute top-8 right-8 hidden w-[340px] md:block lg:top-10 lg:right-10 lg:w-[360px]" style={{ "--d": "900ms" } as React.CSSProperties}>
            <React.Suspense fallback={null}>
              <Odometer />
            </React.Suspense>
          </div>
        </div>
        {/* On a phone the card sits under the plate, overlapping its lower edge, so the drawing stays visible. */}
        <div className="lb-in relative z-10 mx-auto -mt-24 w-[calc(100%-32px)] max-w-[360px] md:hidden" style={{ "--d": "900ms" } as React.CSSProperties}>
          <React.Suspense fallback={null}>
            <Odometer />
          </React.Suspense>
        </div>
        <figcaption>
          <Caption
            className="mt-4"
            n="01"
            title="Pastel Harbor"
            medium="Oil pastel, crayon and chalk, drawn stroke by stroke with JavaScript. On it: Odometer, live."
            href={`#/${slug}`}
            link="View the piece"
          />
        </figcaption>
      </figure>
    </header>
  )
}

/* Contents: the counts, set like a catalogue index ------------------------------- */

function Contents({ stats }: { stats: [number, string, string][] }) {
  return (
    <section aria-label="What is in the library" className={cn(wrap, "mt-20 sm:mt-28")}>
      <div className="grid grid-cols-2 border-b border-[var(--rule)] sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([n, label, href], i) => (
          <a
            key={label}
            href={href}
            className={cn(
              "group flex flex-col gap-2 border-t border-[var(--rule)] py-6 pr-4 transition-colors sm:py-8",
              i === 0 && "col-span-2 sm:col-span-1",
              i > 0 && "lg:border-l lg:pl-6",
              i % 2 === 0 && i > 0 && "max-sm:border-l max-sm:pl-4",
            )}
          >
            <span className="lb-serif text-[56px] leading-none tabular-nums sm:text-[72px]">{n}</span>
            <span className="flex items-center gap-1 text-[13.5px] text-[var(--ink-2)] group-hover:text-[var(--ink)]">
              {label}
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

/* Section heading ------------------------------------------------------------ */

function Head({ kicker, title, children, className }: { kicker: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-7">
        <p className="lb-mono text-[12px] text-[var(--ink-3)]">{kicker}</p>
        <h2 className="lb-serif mt-4 text-[44px] leading-[0.98] text-balance sm:text-[64px]">{title}</h2>
      </div>
      {children && <div className="text-[16px] leading-7 text-[var(--ink-2)] lg:col-span-4 lg:col-start-9 lg:pb-2">{children}</div>}
    </div>
  )
}

/* The Originals as exhibits ------------------------------------------------------ */

const ORIGINALS: { slug: string; line: string; width: number }[] = [
  { slug: "scope-words", line: "Grant access with three big words; the one you pick rises into the headline.", width: 420 },
  { slug: "tool-headline", line: "The tool an agent is using, as a headline that turns into a receipt.", width: 520 },
  { slug: "undo-countdown", line: "A big countdown to undo what an agent just did.", width: 400 },
  { slug: "merge-range", line: "Sub-agents report at different times; their answers glide into one range.", width: 440 },
  { slug: "effort-sentence", line: "How hard the model thinks, said as one sentence with its time and price.", width: 480 },
]

/** Lays a piece out at its own width and scales it down only when the frame is smaller, so it is never cropped. */
function Fit({ width, children }: { width: number; children: React.ReactNode }) {
  const box = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  const [k, setK] = React.useState(1)
  React.useEffect(() => {
    const b = box.current
    const i = inner.current
    if (!b || !i) return
    const measure = () => {
      const pad = b.clientWidth < 500 ? 32 : 64
      const kw = (b.clientWidth - pad) / width
      const kh = (b.clientHeight - pad) / Math.max(1, i.offsetHeight)
      setK(Math.min(1, kw, kh))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(b)
    ro.observe(i)
    measure()
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={box} className="absolute inset-0">
      <div ref={inner} style={{ width, transform: `translate(-50%, -50%) scale(${k})` }} className="absolute top-1/2 left-1/2 origin-center">
        {children}
      </div>
    </div>
  )
}

function Exhibit({ entry, n, line, width, className, frameClass }: { entry: LandingEntry; n: string; line: string; width: number; className?: string; frameClass: string }) {
  const Live = PIECES[entry.slug]
  return (
    <div className={cn("lb-exhibit group", className)}>
      <WhenVisible margin="200px" className={cn("lb-frame relative overflow-hidden rounded-[6px] bg-[var(--paper-2)] shadow-[0_0_0_1px_var(--rule)]", frameClass)}>
        {Live ? (
          <Fit width={width}>
            <Live />
          </Fit>
        ) : (
          entry.demo && <LivePreview Demo={entry.demo} width={width} align="center" bare replay={14000} className="absolute inset-0" />
        )}
      </WhenVisible>
      <a href={`#/${entry.slug}`} className="mt-4 flex items-baseline gap-3">
        <span className="lb-mono text-[11.5px] text-[var(--ink-3)] tabular-nums">No. {n}</span>
        <span className="lb-serif text-[22px] leading-none">{entry.name}</span>
        <ArrowUpRight className="lb-arrow ml-auto size-4 text-[var(--ink-3)] transition-colors group-hover:text-[var(--ink)]" />
      </a>
      <p className="mt-2 max-w-[46ch] text-[14px] leading-6 text-[var(--ink-2)]">{line}</p>
    </div>
  )
}

function Originals({ find, count }: { find: (s: string) => LandingEntry | undefined; count: number }) {
  const items = ORIGINALS.flatMap((o) => {
    const e = find(o.slug)
    return e ? [{ ...o, entry: e }] : []
  })
  const layout = [
    { className: "lg:col-span-7", frameClass: "h-[440px] sm:h-[520px]" },
    { className: "lg:col-span-5", frameClass: "h-[440px] sm:h-[520px]" },
    { className: "lg:col-span-4", frameClass: "h-[400px] sm:h-[440px]" },
    { className: "lg:col-span-4", frameClass: "h-[400px] sm:h-[440px]" },
    { className: "lg:col-span-4", frameClass: "h-[400px] sm:h-[440px]" },
  ]
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <Rise>
        <Head kicker="The Originals" title={<>{count} pieces for moments only agents create.</>}>
          A run that needs one number checked, a grant with a clear limit, a plan you can steer while it works. Each exhibit below is the real component, playing.
        </Head>
      </Rise>
      <div className="mt-12 grid gap-x-6 gap-y-12 sm:mt-16 sm:grid-cols-2 lg:grid-cols-12">
        {items.map((it, i) => (
          <Rise key={it.slug} delay={(i % 3) * 80} className={cn(layout[i]?.className, i === 0 && "sm:col-span-2 lg:col-span-7")}>
            <Exhibit entry={it.entry} n={String(i + 2).padStart(2, "0")} line={it.line} width={it.width} frameClass={layout[i]?.frameClass ?? "h-[360px]"} />
          </Rise>
        ))}
      </div>
      <Rise className="mt-12">
        <a href="#/browse/Originals" className="group inline-flex items-center gap-1.5 text-[14px] font-medium">
          All {count} Originals <ArrowRight className="lb-arrow size-4" />
        </a>
      </Rise>
    </section>
  )
}

/* A full-bleed art band ----------------------------------------------------------- */

function ArtBand({ illustrations }: { illustrations: number }) {
  return (
    <section className="mt-28 sm:mt-40">
      <div className={wrap}>
        <Rise>
          <Head kicker="Illustrations" title="Drawn mark by mark, in the browser.">
            {illustrations} illustrations in oil pastel, coloured pencil, gouache and chalk. Each one paints itself on load, moves a little, and stops when it leaves the screen.
          </Head>
        </Rise>
      </div>
      <figure className="mt-12 sm:mt-16">
        <WhenVisible className="relative h-[420px] overflow-hidden bg-[#f4efe3] sm:h-[560px] lg:h-[680px]">
          <div className="lb-fill">
            <PencilGreenhouse />
          </div>
        </WhenVisible>
        <figcaption className={wrap}>
          <Caption className="mt-4" n="07" title="Pencil Greenhouse" medium="Coloured pencil and chalk on toothed paper, after rain." href="#/pencil-greenhouse" link="View the piece" />
        </figcaption>
      </figure>
    </section>
  )
}

/* Studio: make your own plate ------------------------------------------------------- */

const LAKE_PALETTES = [
  { id: "dusk", label: "Dusk" },
  { id: "alpine", label: "Alpine" },
  { id: "spring", label: "Spring" },
] as const

function Studio() {
  const [palette, setPalette] = React.useState<(typeof LAKE_PALETTES)[number]["id"]>("dusk")
  const [seed, setSeed] = React.useState(7)
  const canvas = React.useRef<HTMLCanvasElement | null>(null)
  const [saved, setSaved] = React.useState(false)
  React.useEffect(() => {
    if (!saved) return
    const id = window.setTimeout(() => setSaved(false), 1600)
    return () => window.clearTimeout(id)
  }, [saved])
  const exportPng = () => {
    const c = canvas.current
    if (!c) return
    const a = document.createElement("a")
    a.download = `gouache-lake-${palette}-${seed}.png`
    a.href = c.toDataURL("image/png")
    a.click()
    setSaved(true)
  }
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <Rise>
        <Head kicker="Studio" title="Make your own plate.">
          Every illustration and motion piece opens in the Studio. Pick the light, the seed and the size, then export a PNG, SVG, WebM or GIF for your own page.
        </Head>
      </Rise>
      <Rise className="mt-12 sm:mt-16">
        <div className="overflow-hidden rounded-[10px] bg-[var(--card)] shadow-[var(--lift)]">
          <div className="flex h-11 items-center gap-3 border-b border-[var(--rule)] px-4">
            <span className="lb-mono text-[12px] text-[var(--ink-3)]">Studio</span>
            <span className="text-[13px] text-[var(--ink-2)]">Gouache Lake</span>
            <span className="lb-mono ml-auto hidden text-[12px] text-[var(--ink-3)] sm:inline">16 : 10</span>
          </div>
          <div className="grid lg:grid-cols-[1fr_320px]">
            <WhenVisible className="relative aspect-[16/10] overflow-hidden bg-[#dfe5de]">
              <div className="lb-fill">
                <GouacheLake key={`${palette}-${seed}`} palette={palette} seed={seed} canvasRef={canvas} />
              </div>
            </WhenVisible>
            <div className="flex flex-col gap-7 border-t border-[var(--rule)] p-5 sm:p-6 lg:border-t-0 lg:border-l">
              <div>
                <div className="text-[13px] font-medium">Palette</div>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-[var(--paper-2)] p-1" role="radiogroup" aria-label="Palette">
                  {LAKE_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={palette === p.id}
                      onClick={() => setPalette(p.id)}
                      className={cn(
                        "lb-press h-8 rounded-full text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)]",
                        palette === p.id && "bg-[var(--card)] text-[var(--ink)] shadow-[0_0_0_1px_var(--rule),0_1px_2px_rgb(0_0_0/0.06)]",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium">Hillside</span>
                  <span className="lb-mono text-[12px] text-[var(--ink-3)] tabular-nums">seed {seed}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSeed((n) => (n * 7919 + 13) % 997)}
                  className="lb-press mt-3 h-9 w-full rounded-full text-[13px] text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--rule-2)] hover:bg-[var(--paper-2)]"
                >
                  Draw a new hillside
                </button>
                <p className="mt-3 text-[13px] leading-5 text-[var(--ink-3)]">Each change repaints the lake from the first dab.</p>
              </div>
              <dl className="grid grid-cols-2 gap-y-3 text-[13px]">
                <dt className="text-[var(--ink-3)]">Medium</dt>
                <dd>Gouache, Canvas 2D</dd>
                <dt className="text-[var(--ink-3)]">Loop</dt>
                <dd>The boat crosses; tap the water to steer it</dd>
                <dt className="text-[var(--ink-3)]">Formats</dt>
                <dd className="lb-mono text-[12.5px]">PNG SVG WebM GIF</dd>
              </dl>
              <div className="mt-auto flex flex-col gap-2">
                <button
                  type="button"
                  onClick={exportPng}
                  className="lb-press group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[14px] font-medium text-[var(--paper)] hover:opacity-90"
                >
                  {saved ? <Check className="size-4" /> : <Download className="size-4" />}
                  {saved ? "Saved" : "Export this frame as PNG"}
                </button>
                <QuietLink href="#/studio/gouache-lake">Open in Studio</QuietLink>
              </div>
            </div>
          </div>
        </div>
      </Rise>
      <Rise className="mt-4">
        <Caption n="08" title="Gouache Lake" medium="Brush dabs and a small boat, exported from the page you are reading." />
      </Rise>
    </section>
  )
}

/* Install ------------------------------------------------------------------------ */

function Install({ slug }: { slug: string }) {
  const cmd = `npx shadcn@latest add ${SITE}/r/${slug}.json`
  const notes = [
    ["One file", "The CLI writes a single .tsx into your project. No package to keep up to date."],
    ["Plain React and Tailwind", "Its tokens, motion and dark mode live in that file, where you can read and change them."],
    ["Notes for agents", "Each piece explains the technique behind it, so a coding agent can extend it in the same style."],
  ]
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <Rise>
        <Head kicker="Install" title="One command, one file, yours to change." />
      </Rise>
      <Rise className="mt-10 sm:mt-12">
        <Command big text={cmd} label={`Copy the install command for ${slug}`} />
      </Rise>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {notes.map(([t, d], i) => (
          <Rise key={t} delay={i * 80} className="border-t border-[var(--rule)] pt-4">
            <div className="lb-mono text-[11.5px] text-[var(--ink-3)]">{String(i + 1).padStart(2, "0")}</div>
            <h3 className="mt-3 text-[16px] font-medium">{t}</h3>
            <p className="mt-1.5 max-w-[36ch] text-[14px] leading-6 text-[var(--ink-2)]">{d}</p>
          </Rise>
        ))}
      </div>
    </section>
  )
}

/* MCP ---------------------------------------------------------------------------- */

const MCP_TOOLS = [
  ["search_pieces", "Find pieces by job, interaction or look."],
  ["get_piece", "One piece in full, with its source and install line."],
  ["list_pieces", "Every piece, grouped as the site groups them."],
  ["get_guide", "The house style: tokens, type, motion, canvas art."],
  ["search_skills", "Agent skills for UI work, with install lines."],
]

function Mcp() {
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <div className="grid gap-10 lg:grid-cols-12">
        <Rise className="lg:col-span-5">
          <p className="lb-mono text-[12px] text-[var(--ink-3)]">MCP server</p>
          <h2 className="lb-serif mt-4 text-[44px] leading-[0.98] text-balance sm:text-[64px]">Your agent can read the catalogue.</h2>
          <p className="mt-6 max-w-[42ch] text-[16px] leading-7 text-[var(--ink-2)]">
            Add the server once. Then ask Claude Code, Cursor or Codex for “an approval card for a refund” and it searches Pane, reads the source and installs the file.
          </p>
          <a href="#/mcp" className="group mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
            Setup for every client <ArrowRight className="lb-arrow size-4" />
          </a>
        </Rise>
        <Rise className="lg:col-span-6 lg:col-start-7" delay={80}>
          <Command text={MCP_CMD} label="Copy the MCP setup command" />
          <dl className="mt-8">
            {MCP_TOOLS.map(([name, does]) => (
              <div key={name} className="grid grid-cols-[140px_1fr] gap-4 border-t border-[var(--rule)] py-3.5 sm:grid-cols-[170px_1fr]">
                <dt className="lb-mono text-[12.5px] leading-6">{name}</dt>
                <dd className="text-[14px] leading-6 text-[var(--ink-2)]">{does}</dd>
              </div>
            ))}
          </dl>
        </Rise>
      </div>
    </section>
  )
}

/* Skills ------------------------------------------------------------------------- */

function Skills() {
  const top = React.useMemo(() => {
    const seen = new Set<string>()
    return [...SKILLS]
      .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
      .filter((s) => !seen.has(s.category) && !!seen.add(s.category))
      .slice(0, 5)
  }, [])
  if (!SKILLS.length) return null
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <div className="grid gap-10 lg:grid-cols-12">
        <Rise className="lg:col-span-5">
          <p className="lb-mono text-[12px] text-[var(--ink-3)]">Skills</p>
          <div className="lb-serif mt-2 text-[120px] leading-none tabular-nums sm:text-[168px]">{SKILLS.length}</div>
          <h2 className="mt-2 max-w-[22ch] text-[22px] leading-8 font-medium tracking-[-0.01em]">agent skills that teach your coding agent design, motion and accessibility.</h2>
          <a href="#/skills" className="group mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
            Browse all {SKILLS.length} <ArrowRight className="lb-arrow size-4" />
          </a>
        </Rise>
        <Rise className="lg:col-span-6 lg:col-start-7 lg:pt-8" delay={80}>
          <ul>
            {top.map((s) => (
              <li key={s.id}>
                <a href="#/skills" className="group grid gap-1 border-t border-[var(--rule)] py-4 transition-colors sm:grid-cols-[200px_1fr] sm:gap-4">
                  <span className="lb-mono truncate text-[13px] leading-6 group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] text-[var(--ink-3)]">{s.category}</span>
                    <span className="mt-0.5 line-clamp-2 text-[14px] leading-6 text-[var(--ink-2)]">{s.does ?? s.description}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Rise>
      </div>
    </section>
  )
}

/* Closing: the last plate ---------------------------------------------------------- */

function Closing({ slug }: { slug: string }) {
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <Rise className="lg:col-span-5">
          <h2 className="lb-serif text-[56px] leading-[0.95] text-balance sm:text-[88px]">Start with one piece.</h2>
          <p className="mt-6 max-w-[40ch] text-[16px] leading-7 text-[var(--ink-2)]">Pick what you need, run one command, own the file. No account, no tiers, nothing to pay.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <SolidLink href="#/browse">Browse the library</SolidLink>
            <QuietLink href={GITHUB}>
              <GithubMark className="size-4" /> GitHub
            </QuietLink>
          </div>
          <Command className="mt-6" text={`npx shadcn@latest add ${SITE}/r/${slug}.json`} label={`Copy the install command for ${slug}`} />
        </Rise>
        <Rise className="lg:col-span-7" delay={80}>
          <figure>
            <WhenVisible className="relative h-[360px] overflow-hidden rounded-[6px] bg-[#1e2250] shadow-[var(--lift)] sm:h-[480px]">
              <div className="lb-fill">
                <ChalkObservatory />
              </div>
            </WhenVisible>
            <figcaption>
              <Caption className="mt-4" n="09" title="Chalk Observatory" medium="Chalk and pastel on dark paper. The last plate." href="#/chalk-observatory" link="View the piece" />
            </figcaption>
          </figure>
        </Rise>
      </div>
    </section>
  )
}

/* Footer: the colophon ------------------------------------------------------------- */

function Footer() {
  const link = "text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
  const under = "underline decoration-[var(--rule-2)] underline-offset-2 hover:text-[var(--ink)]"
  return (
    <footer className={cn(wrap, "mt-28 pb-12 sm:mt-40")}>
      <div className="grid gap-10 border-t border-[var(--rule)] pt-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
            <PaneMark className="size-7" />
            Pane
          </a>
          <p className="mt-3 max-w-[36ch] text-[13.5px] leading-6 text-[var(--ink-2)]">
            An open-source library for AI interfaces. Set in Instrument Serif and Inter; every plate drawn with Canvas 2D.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[13px] text-[var(--ink-3)]">Library</div>
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[13px] text-[var(--ink-3)]">Project</div>
          <a href={GITHUB} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>
          <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className={link}>
            Issues
          </a>
          <span className="text-[var(--ink-2)]">MIT licence</span>
        </div>
      </div>
      <p className="mt-10 text-[12.5px] leading-5 text-[var(--ink-3)]">
        MIT © Turar Kametay. Inspired by{" "}
        <a href="https://www.affectui.com" target="_blank" rel="noreferrer" className={under}>
          affectUI
        </a>
        ,{" "}
        <a href="https://uiarc.dev" target="_blank" rel="noreferrer" className={under}>
          Arc UI
        </a>{" "}
        and others. All code written from scratch. Skills by Emil Kowalski, Benji Taylor (Stageshow) and Damir Sokolovsky (Unslop,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className={under}>
          CC BY 4.0
        </a>
        ).
      </p>
    </footer>
  )
}

/* Page --------------------------------------------------------------------- */

export default function LandingGallery({ groups, dark, toggleDark }: LandingProps) {
  const all = React.useMemo(() => groups.flatMap((g) => g.entries).filter((e) => e.kind !== "screen"), [groups])
  const find = React.useCallback((slug: string) => all.find((e) => e.slug === slug && e.demo), [all])
  const count = (k: string) => all.filter((e) => e.kind === k).length
  const originals = groups.find((g) => g.label === "Originals")?.entries.length ?? 0
  const stats = (
    [
      [all.length, "pieces in the library", "#/browse"],
      [count("ui") + count("blocks"), "components and blocks", "#/browse"],
      [count("illustrations"), "illustrations", "#/browse/Illustrations"],
      [count("motion"), "motion effects", "#/browse/Motion"],
      [SKILLS.length, "agent skills", "#/skills"],
    ] as [number, string, string][]
  ).filter(([n]) => n)
  const slug = find("odometer") ? "odometer" : "ai-answer"

  React.useEffect(() => {
    const prev = document.title
    document.title = "Pane: interface pieces for AI products"
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="lb min-h-dvh overflow-x-clip">
      <style href="landing-b" precedence="default">
        {CSS}
      </style>
      <Nav dark={dark} toggleDark={toggleDark} />
      <Hero total={all.length} slug="pastel-harbor" />
      <Contents stats={stats} />
      <Originals find={find} count={originals} />
      <ArtBand illustrations={count("illustrations")} />
      <Studio />
      <Install slug={slug} />
      <Mcp />
      <Skills />
      <Closing slug={slug} />
      <Footer />
    </div>
  )
}
