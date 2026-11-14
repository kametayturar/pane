import * as React from "react"
import { ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaneMark } from "@/pane-mark"
import { LivePreview, type DemoComponent } from "@/live-preview"
import { SKILLS } from "@/skills-page"

/*
 * Direction C – "The stage".
 * Pane presented like a product shot: a near-black set where real pieces sit as lit tiles and one cursor
 * walks from tile to tile. The light is Pane's own code-drawn art (Light Form, Grain Gradient), not CSS gradients.
 * In light mode the page is paper and every stage stays dark, like photographs hung on a wall.
 */

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

/* Pieces on the stage, loaded after the first paint ------------------------ */

const Odometer = React.lazy(() => import("@/components/ui/odometer").then((m) => ({ default: m.Odometer })))
const ScopeWords = React.lazy(() => import("@/components/ui/scope-words").then((m) => ({ default: m.ScopeWords })))
const ControlBento = React.lazy(() => import("@/components/blocks/control-bento").then((m) => ({ default: m.ControlBento })))
const DeviceFrames = React.lazy(() => import("@/components/ui/device-frames").then((m) => ({ default: m.DeviceFrames })))
const ActionDrum = React.lazy(() => import("@/components/ui/action-drum").then((m) => ({ default: m.ActionDrum })))

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Record<string, unknown>) => void
const ART: Record<"form" | "grain", () => Promise<DrawFn>> = {
  form: () => import("@/components/illustrations/light-form").then((m) => m.draw as DrawFn),
  grain: () => import("@/components/motion/grain-gradient").then((m) => m.draw as DrawFn),
}

/* Styles Tailwind can't say -------------------------------------------------- */

const CSS = `
.cst { --cst-ease: ${EASE}; background: #f5f5f2; color: #0b0b0c; }
.dark .cst { background: #070708; color: #f4f4f5; }
.cst ::selection { background: rgb(0 96 226 / .22) }

/* A dark set that stays dark on a light page. Pane's own tokens are pinned to their dark values inside it. */
.cst-dk {
  color: rgb(255 255 255 / .94);
  --pane-ink: #fff; --pane-accent: #4d8dff; --pane-solid: #222227; --pane-tint: rgb(26 26 32 / .6); --pane-sheen: none;
  --pane-t1: rgb(255 255 255 / .96); --pane-t2: rgb(255 255 255 / .8); --pane-t3: rgb(255 255 255 / .68); --pane-t4: rgb(255 255 255 / .54);
  --pane-shadow: inset 0 0 0 .5px rgb(255 255 255 / .16), 0 0 0 .5px rgb(0 0 0 / .5), 0 1px 3px rgb(0 0 0 / .4);
}
html[data-style="mono"] .cst-dk :is(.odm, .scw, .udc, .adr) {
  --odm-ink: #fff; --odm-surface: #0a0a0a; --odm-accent: #f2f2f2;
  --scw-ink: #fff; --scw-surface: #0a0a0a; --scw-accent: #f2f2f2;
  --udc-ink: #fff; --udc-surface: #0a0a0a; --udc-accent: #f2f2f2;
  --adr-ink: #fff; --adr-surface: #0a0a0a; --adr-accent: #f2f2f2;
}

/* The set */
.cst-set { position: relative; isolation: isolate; overflow: hidden; background: #09090b;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .07), inset 0 1px 0 rgb(255 255 255 / .06), 0 50px 100px -50px rgb(0 0 0 / .55), 0 0 0 1px rgb(0 0 0 / .06); }
.dark .cst-set { box-shadow: inset 0 0 0 1px rgb(255 255 255 / .08), inset 0 1px 0 rgb(255 255 255 / .07), 0 60px 120px -60px rgb(0 0 0 / .9); }

/* A tile is lit glass over the key light: translucent, a hairline rim, a brighter top edge. */
.cst-tile { position: relative; overflow: hidden; border-radius: 20px; background: rgb(20 20 23 / .66);
  -webkit-backdrop-filter: blur(24px) saturate(1.3); backdrop-filter: blur(24px) saturate(1.3);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .075), inset 0 1px 0 rgb(255 255 255 / .09), 0 24px 48px -28px rgb(0 0 0 / .8);
  transition: transform .5s var(--cst-ease), box-shadow .5s var(--cst-ease), background-color .5s var(--cst-ease); }
.cst-tile[data-focus] { transform: translateY(-4px); background: rgb(26 26 30 / .7);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .16), inset 0 1px 0 rgb(255 255 255 / .2), 0 36px 60px -30px rgb(0 0 0 / .95); }
.cst-tile-in { position: absolute; inset: 0; display: grid; place-items: center; padding: 8px; }

/* The pieces bring their own card; on the set, the tile is the card. */
.cst-tile :is(.odm-card, .scw-card, .udc-card) { background: transparent !important; background-image: none !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
.cst-tile :is(.odm, .scw) { max-width: none; }
.cst-tile .cbn { width: 100%; }
.cst-tile .cbn-grid { grid-template-columns: minmax(0, 1fr) !important; }
.cst-tile .cbn-t-range { grid-column: auto; background: transparent !important; box-shadow: none !important; transform: none !important; }
.cst-tile .cbn-cur { display: none; }

/* The cursor */
.cst-cur { position: absolute; left: 0; top: 0; z-index: 20; pointer-events: none; opacity: 0; transition: opacity .4s var(--cst-ease); will-change: transform; }
.cst-cur[data-on] { opacity: 1; }
.cst-cur svg { display: block; transform-origin: 2px 2px; transition: transform .14s var(--cst-ease); filter: drop-shadow(0 2px 4px rgb(0 0 0 / .45)); }
.cst-cur[data-press] svg { transform: scale(.86); }
.cst-ring { position: absolute; left: -14px; top: -14px; width: 28px; height: 28px; border-radius: 50%; box-shadow: 0 0 0 1.5px rgb(255 255 255 / .7); opacity: 0; }

/* Cards and grid */
.cst-card { position: relative; isolation: isolate; overflow: hidden; border-radius: 22px; background: #09090b;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .07), inset 0 1px 0 rgb(255 255 255 / .06), 0 30px 60px -36px rgb(0 0 0 / .5);
  transition: box-shadow .5s var(--cst-ease), transform .5s var(--cst-ease); }
.cst-card:hover { box-shadow: inset 0 0 0 1px rgb(255 255 255 / .13), inset 0 1px 0 rgb(255 255 255 / .12), 0 36px 70px -36px rgb(0 0 0 / .65); }
.cst-card-art { position: absolute; z-index: -1; pointer-events: none; transition: opacity .8s var(--cst-ease), filter .8s var(--cst-ease); opacity: .78; filter: saturate(.9); }
.cst-card:hover .cst-card-art, .cst-card:focus-within .cst-card-art { opacity: 1; filter: var(--cst-f, none); }
/* Edges of a drawing fade into the card, so only the card's own edge crops it. */
.cst-soft { --cst-f: contrast(1.3) brightness(.92); filter: var(--cst-f) saturate(.9); -webkit-mask-image: radial-gradient(closest-side, #000 58%, transparent); mask-image: radial-gradient(closest-side, #000 58%, transparent); }
.cst-fade-top { -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 46%); mask-image: linear-gradient(180deg, transparent 0, #000 46%); }

.cst-grid { --line: rgb(0 0 0 / .08); --cross: rgb(0 0 0 / .32); }
.dark .cst-grid { --line: rgb(255 255 255 / .08); --cross: rgb(255 255 255 / .34); }
.cst-cell { position: relative; box-shadow: inset -1px 0 0 var(--line), inset 0 -1px 0 var(--line); }

.cst-reveal { opacity: 0; transform: translateY(12px); filter: blur(4px); transition: opacity .9s var(--cst-ease), transform .9s var(--cst-ease), filter .9s var(--cst-ease); transition-delay: var(--d, 0ms); }
.cst-reveal[data-in] { opacity: 1; transform: none; filter: none; }
.cst-rise { animation: cst-rise 1s var(--cst-ease) backwards; animation-delay: var(--d, 0ms); }
@keyframes cst-rise { from { opacity: 0; transform: translateY(10px); filter: blur(6px); } }
.cst-fade { animation: cst-fade .5s var(--cst-ease) backwards; }
@keyframes cst-fade { from { opacity: 0; transform: translateY(6px); filter: blur(3px); } }

.cst :focus-visible { outline: 2px solid #4d8dff; outline-offset: 2px; }
/* While the cursor runs the set, focus moved by a piece is not a keyboard user's focus (any key ends the run). */
[data-auto] :focus-visible { outline: none !important; }

@media (prefers-reduced-motion: reduce) {
  .cst-reveal, .cst-reveal[data-in] { opacity: 1; transform: none; filter: none; transition: none; }
  .cst-rise, .cst-fade { animation: none; }
  .cst-tile, .cst-card { transition: none; }
  .cst-tile[data-focus] { transform: none; }
}
`

/* Small helpers ------------------------------------------------------------ */

const wrap = "mx-auto w-full max-w-[1280px] px-4 sm:px-6"
const muted = "text-neutral-500 dark:text-neutral-400"
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

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

/** True once the element has scrolled near the viewport; stays true. */
function useSeen<T extends HTMLElement>(margin = "0px 0px -8% 0px") {
  const ref = React.useRef<T>(null)
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return [ref, seen] as const
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>()
  return (
    <div ref={ref} className={cn("cst-reveal", className)} data-in={seen ? "" : undefined} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
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

/**
 * A canvas that paints one of Pane's code-drawn pieces (Light Form, Grain Gradient) through its own pure `draw`.
 * The module loads when the canvas nears the viewport. `live` loops it (capped fps); otherwise it holds one frame.
 * `ripple` is a counter: each change sends a ripple through a Light Form.
 */
function LightArt({ lib, values, live = false, at = 2.4, fps = 30, ripple = 0, className, style }: {
  lib: "form" | "grain"
  values: Record<string, unknown>
  live?: boolean
  at?: number
  fps?: number
  ripple?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const valuesRef = React.useRef(values)
  valuesRef.current = values
  const rippleAt = React.useRef(-1)
  const clock = React.useRef(at)
  const kick = React.useRef<() => void>(() => {})
  React.useEffect(() => {
    if (!ripple) return
    rippleAt.current = performance.now()
    kick.current()
  }, [ripple])
  React.useEffect(() => {
    const cv = ref.current
    if (!cv) return
    let draw: DrawFn | null = null
    let alive = true
    let visible = false
    let raf = 0
    let last = 0
    let dims = { w: 0, h: 0, d: 1 }
    const still = !live || reduced()
    const t0 = performance.now() - clock.current * 1000
    const size = () => {
      const r = cv.getBoundingClientRect()
      const d = Math.min(window.devicePixelRatio || 1, 1.5)
      cv.width = Math.max(1, Math.round(r.width * d))
      cv.height = Math.max(1, Math.round(r.height * d))
      dims = { w: r.width, h: r.height, d }
    }
    const paint = (now: number) => {
      const ctx = cv.getContext("2d")
      if (!draw || !dims.w || !ctx) return
      ctx.setTransform(dims.d, 0, 0, dims.d, 0, 0)
      const v: Record<string, unknown> = { ...valuesRef.current }
      let rippling = false
      if (lib === "form") {
        const rp = rippleAt.current < 0 ? -1 : (now - rippleAt.current) / 2800
        rippling = rp >= 0 && rp <= 1
        v._rp = rippling ? rp : -1
      }
      if (!still) clock.current = (now - t0) / 1000
      draw(ctx, dims.w, dims.h, clock.current, v)
      return rippling
    }
    const loop = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      if (now - last >= 1000 / fps - 2) {
        last = now
        const rippling = paint(now)
        if (still && !rippling) return
      }
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && draw && visible) raf = requestAnimationFrame(loop)
    }
    kick.current = start
    let loading = false
    const load = () => {
      if (loading) return
      loading = true
      ART[lib]().then((fn) => {
        if (!alive) return
        draw = fn
        size()
        paint(performance.now())
        if (!still) start()
      })
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible) {
          load()
          if (!still) start()
        }
      },
      { rootMargin: "240px" },
    )
    const ro = new ResizeObserver(() => {
      size()
      paint(performance.now())
    })
    const onVis = () => !document.hidden && !still && start()
    io.observe(cv)
    ro.observe(cv)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [lib, live, at, fps])
  return <canvas ref={ref} className={cn("block", className)} style={style} aria-hidden />
}

/* Buttons ------------------------------------------------------------------ */

function PrimaryLink({ href, children, className, onDark }: { href: string; children: React.ReactNode; className?: string; onDark?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-medium transition-[background-color,transform] duration-200 active:scale-[.98]",
        onDark
          ? "bg-white text-neutral-950 hover:bg-neutral-200"
          : "bg-neutral-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.2)] hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:shadow-none dark:hover:bg-neutral-200",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </a>
  )
}

function InstallCommand({ slugs, className, large, onDark }: { slugs: string[]; className?: string; large?: boolean; onDark?: boolean }) {
  const [copied, copy] = useCopied()
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (slugs.length < 2 || reduced()) return
    const id = window.setInterval(() => setI((n) => (n + 1) % slugs.length), 2800)
    return () => window.clearInterval(id)
  }, [slugs.length])
  const name = slugs[i % slugs.length]
  const prefix = "npx shadcn@latest add"
  const base = `${SITE}/r/`
  const cmd = `${prefix} ${base}${name}.json`
  return (
    <button
      type="button"
      onClick={() => copy(cmd)}
      aria-label={`Copy install command for ${name}`}
      className={cn(
        "group flex max-w-full min-w-0 items-center gap-3 rounded-xl py-2.5 pr-2 pl-4 text-left font-mono leading-5 transition-[background-color,box-shadow] duration-200 md:py-0",
        large ? "text-[13px] md:h-14 md:text-[14px]" : "text-[12.5px] md:h-11",
        onDark
          ? "bg-white/[0.06] text-neutral-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] hover:bg-white/[0.09]"
          : "bg-white text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.04)] hover:shadow-[0_0_0_1px_rgb(0_0_0/0.14),0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/[0.05] dark:text-neutral-400 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09)] dark:hover:bg-white/[0.08]",
        className,
      )}
    >
      <span className="self-start text-neutral-400 select-none md:self-auto dark:text-neutral-600">$</span>
      <span className="min-w-0 flex-1 break-all md:truncate md:break-normal">
        <span className="block md:inline">{prefix} </span>
        <span className="block md:inline">{base}</span>
        <span className="block md:inline">
          <span key={name} className={cn("cst-fade inline-block font-medium", onDark ? "text-white" : "text-neutral-950 dark:text-white")}>
            {name}
          </span>
          .json
        </span>
      </span>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", onDark ? "text-neutral-400 group-hover:bg-white/10 group-hover:text-white" : "text-neutral-400 group-hover:bg-black/[0.05] group-hover:text-neutral-900 dark:group-hover:bg-white/10 dark:group-hover:text-white")}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </span>
      <span className="sr-only" role="status">
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
  const link = "rounded-lg px-3 py-1.5 text-[14px] text-neutral-500 transition-colors hover:bg-black/[0.04] hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
  return (
    <nav
      aria-label="Main"
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-[#f5f5f2]/80 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-xl dark:bg-[#070708]/75 dark:shadow-[0_1px_0_rgb(255_255_255/0.07)]" : "bg-transparent",
      )}
    >
      <div className={cn(wrap, "flex h-14 items-center gap-2")}>
        <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
          <PaneMark className="size-7" />
          Pane
        </a>
        <div className="mx-auto hidden items-center gap-0.5 lg:flex">
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
          <button type="button" onClick={toggleDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="grid size-9 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-black/[0.04] hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a href="#/browse" className="ml-1 hidden h-9 items-center rounded-lg bg-neutral-950 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800 sm:inline-flex dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">
            Library
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-black/[0.04] lg:hidden dark:text-neutral-400 dark:hover:bg-white/[0.06]"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-black/[0.06] bg-[#f5f5f2]/95 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-white/[0.08] dark:bg-[#070708]/95">
          <div className="mx-auto flex max-w-[1280px] flex-col">
            {[...NAV, ["Library", "#/browse"] as const].map(([label, href]) => (
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

/* The stage ------------------------------------------------------------------ */

type TileId = "light" | "scope" | "odo" | "bento" | "phone"
type Pt = { x: number; y: number }
type OdoState = { phase: "working" | "needs" | "done"; count: number; passed: boolean }

const ODO_TOTAL = 1240
const ODO_START = 312
const ODO_HOLD = 768
const ODO_CHECK = { amount: 4860, expected: 4680, question: "Pay Northwind $4,860 on Friday?", payLabel: "Pay $4,860", holdLabel: "Hold" }

const ON_STAGE: { id: TileId; slug: string; name: string }[] = [
  { id: "scope", slug: "scope-words", name: "Scope Words" },
  { id: "bento", slug: "control-bento", name: "Control Bento" },
  { id: "odo", slug: "odometer", name: "Odometer" },
  { id: "phone", slug: "device-frames", name: "Device Frames" },
  { id: "light", slug: "light-form", name: "Light Form" },
]

/** cubic-bezier(.22, 1, .36, 1) as a function of progress, solved by Newton steps. */
function easeOut(x: number) {
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1]
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3
  let t = x
  for (let i = 0; i < 6; i++) {
    const d = (bx(t + 1e-4) - bx(t)) / 1e-4
    if (Math.abs(d) < 1e-6) break
    t = Math.min(1, Math.max(0, t - (bx(t) - x) / d))
  }
  return by(t)
}

function Tile({ id, focus, className, children }: { id: TileId; focus: TileId | null; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("cst-tile", className)} data-tile={id} data-focus={focus === id ? "" : undefined}>
      {children}
    </div>
  )
}

function Stage() {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const curRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLSpanElement>(null)
  const pos = React.useRef<Pt>({ x: 0, y: 0 })
  const odoRef = React.useRef<OdoState | null>(null)
  const [focus, setFocus] = React.useState<TileId | null>(null)
  const [press, setPress] = React.useState(false)
  const [cursorOn, setCursorOn] = React.useState(false)
  const [auto, setAuto] = React.useState(() => !reduced())
  const [ripple, setRipple] = React.useState(0)
  const [odo, setOdo] = React.useState<OdoState>(() => (reduced() ? { phase: "needs", count: ODO_HOLD, passed: false } : { phase: "working", count: ODO_START, passed: false }))
  const [paid, setPaid] = React.useState(false)
  const [notif, setNotif] = React.useState(false)
  odoRef.current = odo

  // The odometer is a background agent: it counts on its own and stops on the amount it needs checked.
  React.useEffect(() => {
    if (odo.phase !== "working") return
    const limit = odo.passed ? ODO_TOTAL : ODO_HOLD
    const t =
      odo.count < limit
        ? window.setTimeout(() => setOdo((o) => ({ ...o, count: Math.min(limit, o.count + (o.passed ? 118 : 91) + (o.count % 3)) })), odo.count === ODO_START ? 900 : odo.passed ? 130 : 260)
        : window.setTimeout(() => setOdo((o) => ({ ...o, phase: o.passed ? "done" : "needs" })), 320)
    return () => window.clearTimeout(t)
  }, [odo])

  // The phone hears about the payment a beat after it is made.
  React.useEffect(() => {
    if (!paid) {
      setNotif(false)
      return
    }
    const t = window.setTimeout(() => setNotif(true), reduced() ? 0 : 620)
    return () => window.clearTimeout(t)
  }, [paid])

  const onResolve = (d: "pay" | "hold") => {
    setOdo({ phase: "working", count: ODO_HOLD, passed: true })
    setPaid(d === "pay")
  }
  const onRestart = () => {
    setOdo({ phase: "working", count: ODO_START, passed: false })
    setPaid(false)
  }

  // Any real touch, key or focus on the set hands it over: the cursor leaves and the pieces stay working.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || !auto) return
    const stop = (e: Event) => {
      if (!e.isTrusted) return
      setAuto(false)
    }
    // Focus is not a trigger: the pieces move focus themselves (programmatic focus is trusted too); a Tab arrives as a keydown.
    el.addEventListener("pointerdown", stop, true)
    el.addEventListener("keydown", stop, true)
    return () => {
      el.removeEventListener("pointerdown", stop, true)
      el.removeEventListener("keydown", stop, true)
    }
  }, [auto])

  // The script: one cursor, one tile at a time. Targets are measured each time, so it survives any layout.
  React.useEffect(() => {
    if (!auto) {
      setCursorOn(false)
      setFocus(null)
      setPress(false)
      return
    }
    const root = rootRef.current
    if (!root) return
    let alive = true
    let onScreen = false
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting))
    io.observe(root)
    class Stop extends Error {}
    const check = () => {
      if (!alive) throw new Stop()
    }
    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        window.setTimeout(res, ms)
      }).then(check)
    const whenActive = async () => {
      while (!onScreen || document.hidden) await sleep(300)
    }
    const until = async (fn: () => boolean, max: number) => {
      const t0 = performance.now()
      while (!fn() && performance.now() - t0 < max) await sleep(120)
    }
    const visible = (el: Element | null | undefined): el is HTMLElement => !!el && (el as HTMLElement).offsetParent !== null && el.getBoundingClientRect().width > 0
    const q = (sel: string, text?: string) => {
      const all = Array.from(root.querySelectorAll<HTMLElement>(sel))
      return all.find((e) => visible(e) && (!text || e.textContent?.trim().startsWith(text))) ?? null
    }
    const aim = (el: HTMLElement, ax = 0.5, ay = 0.6): Pt => {
      const s = root.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      return { x: r.left - s.left + r.width * ax, y: r.top - s.top + r.height * ay }
    }
    const place = (p: Pt) => {
      pos.current = p
      if (curRef.current) curRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    }
    let side = 1
    const move = (to: Pt) =>
      new Promise<void>((res) => {
        const a = pos.current
        const d = Math.hypot(to.x - a.x, to.y - a.y)
        if (d < 3) return res()
        const dur = Math.min(1150, Math.max(460, 380 + d * 1.0))
        side = -side
        const bend = Math.min(64, d * 0.16) * side
        const c = { x: (a.x + to.x) / 2 + (-(to.y - a.y) / d) * bend, y: (a.y + to.y) / 2 + ((to.x - a.x) / d) * bend }
        const t0 = performance.now()
        const step = (now: number) => {
          if (!alive) return res()
          const p = Math.min(1, (now - t0) / dur)
          const e = easeOut(p)
          const u = 1 - e
          place({ x: u * u * a.x + 2 * u * e * c.x + e * e * to.x, y: u * u * a.y + 2 * u * e * c.y + e * e * to.y })
          if (p < 1) requestAnimationFrame(step)
          else res()
        }
        requestAnimationFrame(step)
      }).then(check)
    const tap = async (el: HTMLElement | null, tile: TileId, ax?: number, ay?: number, act?: () => void) => {
      if (!el) return false
      setFocus(tile)
      await move(aim(el, ax, ay))
      setPress(true)
      ringRef.current?.animate([{ opacity: 0.55, transform: "scale(.3)" }, { opacity: 0, transform: "scale(1.2)" }], { duration: 560, easing: EASE })
      await sleep(110)
      if (act) act()
      else el.click()
      await sleep(150)
      setPress(false)
      return true
    }
    const ranges = ["Month", "Day", "Week"]
    let loop = 0
    const run = async () => {
      // Enter from the lower right, outside the tiles.
      await until(() => !!q(".scw-opt"), 8000)
      const s = root.getBoundingClientRect()
      place({ x: s.width * 0.72, y: s.height + 30 })
      await sleep(600)
      setCursorOn(true)
      for (;;) {
        await whenActive()
        // 1. Grant scope: the chosen word rises into the headline.
        if (await tap(q(".scw-opt", loop % 2 ? "Always" : "This task"), "scope", 0.22, 0.42)) await sleep(1700)
        // 2. Change the period: the number and the chart tween together.
        if (await tap(q(".cbn-seg button", ranges[loop % 3]), "bento")) await sleep(1700)
        // 3. The agent needs a decision: pay, and the phone hears about it.
        await until(() => odoRef.current?.phase === "needs", 7000)
        if (await tap(q(".odm-btn", "Pay"), "odo", 0.4, 0.55)) {
          const phone = q("[data-tile=phone]")
          if (phone) {
            await sleep(500)
            setFocus("phone")
            await move(aim(phone, 0.16, 0.86))
            await sleep(1900)
          } else await sleep(1200)
        }
        // 4. Press the light: a ripple runs through the moth.
        const light = q("[data-tile=light]")
        if (light && (await tap(light, "light", 0.56, 0.5, () => setRipple((r) => r + 1)))) await sleep(2600)
        // 5. Take it back, then start the agent again – each reset has a cause you can see.
        if (await tap(q(".scw-take"), "scope", 0.3, 0.55)) await sleep(1000)
        await until(() => odoRef.current?.phase === "done", 6000)
        if (await tap(q(".odm-again"), "odo", 0.4, 0.55)) await sleep(900)
        setFocus(null)
        loop++
        await sleep(1200)
      }
    }
    run().catch((e) => {
      if (!(e instanceof Stop)) throw e
    })
    return () => {
      alive = false
      io.disconnect()
    }
  }, [auto])

  const still = reduced()
  return (
    <div ref={rootRef} className="cst-dk dark relative" data-theme="dark" data-auto={auto ? "" : undefined}>
      {/* The key light: a Grain Gradient orb, warm white, off the top right of the set. */}
      <LightArt
        lib="grain"
        values={{ shape: "orb", colors: ["#09090b", "#16130f", "#4a3d2f", "#b9a68e", "#f6eee2"], angle: 200, warp: 0.45, drift: 0.5, grain: 0.4, seed: 11 }}
        at={3}
        className="pointer-events-none absolute -top-[30%] -right-[18%] h-[120%] w-[78%] opacity-90"
      />
      <div className="relative grid gap-2.5 p-2.5 sm:gap-3 sm:p-3 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[364px_288px]">
        <Tile id="light" focus={focus} className="hidden bg-[#060608] lg:col-span-5 lg:row-span-2 lg:block">
          <LightArt lib="form" values={{ form: "moth", palette: "pearl", strands: 420, ripple: false, breath: 0.6, glow: 0.55, grain: 0.3, seed: 7 }} live={!still} fps={30} ripple={ripple} at={2.2} className="absolute -top-[2%] -left-[22%] h-[112%] w-[144%]" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
            <div>
              <div className="text-[14px] font-medium text-white/90">Light Form</div>
              <div className="mt-0.5 text-[12.5px] text-white/45">Hundreds of strands, drawn with code</div>
            </div>
            <span className="font-mono text-[11px] text-white/40">001</span>
          </div>
        </Tile>
        <Tile id="scope" focus={focus} className="h-[364px] lg:col-span-4 lg:h-auto">
          <div className="cst-tile-in">
            <React.Suspense fallback={null}>
              <div className="w-full max-w-[380px]">
                <ScopeWords agent="Quill" autoPlay={false} defaultValue={still ? "task" : undefined} />
              </div>
            </React.Suspense>
          </div>
        </Tile>
        <Tile id="odo" focus={focus} className="h-[340px] lg:col-span-3 lg:h-auto">
          <div className="cst-tile-in">
            <React.Suspense fallback={null}>
              <Odometer phase={odo.phase} count={odo.count} total={ODO_TOTAL} check={ODO_CHECK} held={!paid && odo.passed} onResolve={onResolve} onRestart={onRestart} />
            </React.Suspense>
          </div>
        </Tile>
        <Tile id="bento" focus={focus} className="hidden md:block lg:col-span-4">
          <div className="cst-tile-in px-1 pt-1 pb-0">
            <React.Suspense fallback={null}>
              <ControlBento tiles={["range"]} autoplay={false} theme="dark" density="compact" />
            </React.Suspense>
          </div>
        </Tile>
        <Tile id="phone" focus={focus} className="hidden md:block lg:col-span-3">
          <div className="absolute -inset-x-[72%] top-0 bottom-0">
            <React.Suspense fallback={null}>
              <DeviceFrames
                kind="phone"
                theme="dark"
                crop="bottom"
                bleed={0.42}
                approved={false}
                compact={false}
                screen={
                  <div className="dfr-lock">
                    <p className="dfr-day">Friday 14 November</p>
                    <p className="dfr-clock">9:41</p>
                    <div className="dfr-note" data-on={notif ? "" : undefined} role="status" aria-live="polite" aria-hidden={!notif}>
                      <span className="dfr-app" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3.5 9.5 7.3 13 14.5 5" />
                        </svg>
                      </span>
                      <span className="dfr-nt">
                        <b>
                          <span className="dfr-nt-t">Paid by Atlas</span>
                          <em>now</em>
                        </b>
                        <span>Northwind · $4,860</span>
                      </span>
                    </div>
                  </div>
                }
              />
            </React.Suspense>
          </div>
        </Tile>
      </div>
      <div ref={curRef} className="cst-cur" data-on={cursorOn ? "" : undefined} data-press={press ? "" : undefined} aria-hidden>
        <span ref={ringRef} className="cst-ring" />
        <svg width="20" height="24" viewBox="-1.5 -1.5 15 21">
          <path d="M0 0 L0 15.5 L4.2 11.8 L6.9 17.8 L9.3 16.7 L6.6 10.9 L12 10.9 Z" fill="#0b0b0c" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <StageCaption focus={focus} />
    </div>
  )
}

/** The pieces on the set, named under it. The one being shown is lit. */
function StageCaption({ focus }: { focus: TileId | null }) {
  return (
    <div className="relative flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-white/[0.07] px-4 py-3 text-[12.5px] sm:px-5">
      <span className="mr-2 text-white/40">On stage</span>
      {ON_STAGE.map((p) => (
        <a
          key={p.id}
          href={`#/${p.slug}`}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[12px] transition-colors duration-300 hover:text-white",
            focus === p.id ? "text-white" : "text-white/45",
            (p.id === "light" && "hidden lg:inline") || ((p.id === "bento" || p.id === "phone") && "hidden md:inline"),
          )}
        >
          {p.slug}
        </a>
      ))}
      <a href="#/browse/Stage" className="group ml-auto hidden items-center gap-1 text-white/55 transition-colors hover:text-white sm:flex">
        Build your own stage
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </a>
    </div>
  )
}

/* Hero --------------------------------------------------------------------- */

function Hero({ total, slugs }: { total: number; slugs: string[] }) {
  return (
    <header className="pt-10 sm:pt-14 lg:pt-16">
      <div className={wrap}>
        <div className="cst-rise">
          <p className={cn("flex items-center gap-2 text-[13.5px]", muted)}>
            <span className="font-mono text-[12.5px] text-neutral-950 tabular-nums dark:text-white">{total}</span> open-source pieces
            <span aria-hidden className="text-neutral-300 dark:text-neutral-700">/</span> MIT
          </p>
          <h1 className="mt-5 text-[46px] leading-[0.95] font-medium tracking-[-0.05em] sm:text-[76px] lg:text-[104px]">
            Interfaces for AI,
            <br />
            <span className="text-neutral-400 dark:text-neutral-500">one file at a time.</span>
          </h1>
        </div>
        <div className="cst-rise mt-7 flex flex-col gap-7 lg:mt-9 lg:flex-row lg:items-end lg:justify-between" style={{ "--d": "120ms" } as React.CSSProperties}>
          <p className="max-w-[540px] text-[16px] leading-7 text-neutral-600 sm:text-[17px] dark:text-neutral-400">
            React and Tailwind pieces for chat, agents and approvals, plus motion and art drawn in code. Each is a single file you add with one command and then own.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryLink href="#/browse">Browse the library</PrimaryLink>
            <a href="#/studio" className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-medium text-neutral-700 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] transition-[background-color,transform] duration-200 hover:bg-black/[0.03] active:scale-[.98] dark:text-neutral-200 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:bg-white/[0.05]">
              Open Studio
            </a>
          </div>
        </div>
      </div>
      <div className={cn(wrap, "mt-10 lg:mt-12")}>
        <div className="cst-rise cst-set rounded-[24px] sm:rounded-[28px]" style={{ "--d": "240ms" } as React.CSSProperties}>
          <Stage />
        </div>
        <div className="cst-rise mt-5 flex justify-center" style={{ "--d": "320ms" } as React.CSSProperties}>
          <InstallCommand slugs={slugs} className="w-full md:w-auto" />
        </div>
      </div>
    </header>
  )
}

/* Feature cards: what Pane is ---------------------------------------------- */

function FeatureCard({ n, title, sub, className, children, foot, href, art }: { n: string; title: string; sub: string; className?: string; children?: React.ReactNode; foot?: React.ReactNode; href?: string; art?: (lit: boolean) => React.ReactNode }) {
  // The art holds a still frame and breathes only while the card is under the pointer or holds focus.
  const [lit, setLit] = React.useState(false)
  return (
    <article
      className={cn("cst-card cst-dk dark group flex flex-col", className)}
      data-theme="dark"
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
    >
      {art?.(lit)}
      <div className="flex items-start justify-between gap-6 p-6 sm:p-7">
        <div>
          <h3 className="text-[19px] leading-[1.2] font-medium tracking-[-0.02em] text-white">
            {href ? (
              <a href={href} className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none">
                {title}
              </a>
            ) : (
              title
            )}
          </h3>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-[1.55] text-white/55">{sub}</p>
        </div>
        <span className="font-mono text-[12px] text-white/40 tabular-nums">{n}</span>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {foot && <div className="relative z-10 flex items-center justify-between gap-4 px-6 pb-6 text-[12.5px] sm:px-7">{foot}</div>}
    </article>
  )
}

function StyleSwitch({ style, setStyle, styles }: Pick<LandingProps, "style" | "setStyle" | "styles">) {
  return (
    <div className="relative z-10 inline-flex rounded-xl bg-white/[0.06] p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" role="radiogroup" aria-label="Style">
      {styles.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={style === o.id}
          onClick={() => setStyle(o.id)}
          className={cn("h-8 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors duration-200", style === o.id ? "bg-white text-neutral-950" : "text-white/55 hover:text-white")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Features({ style, setStyle, styles }: Pick<LandingProps, "style" | "setStyle" | "styles">) {
  const skillNames = React.useMemo(() => [...SKILLS].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0)).slice(0, 16).map((s) => s.name), [])
  const categories = React.useMemo(() => new Set(SKILLS.map((s) => s.category)).size, [])
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")} aria-labelledby="cst-what">
      <Reveal className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
        <h2 id="cst-what" className="text-[36px] leading-[1] font-medium tracking-[-0.045em] text-balance sm:text-[56px]">
          Copy it, restyle it,
          <br />
          <span className="text-neutral-400 dark:text-neutral-500">hand it to your agent.</span>
        </h2>
        <p className={cn("max-w-[440px] text-[16px] leading-7", muted)}>No package and no account. Pieces are plain source you read and change, and your coding agent can find and install them for you.</p>
      </Reveal>

      <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <FeatureCard
            n="001"
            title="One file each"
            sub="One command writes one component into your project. No dependency to upgrade, nothing hidden."
            className="h-[460px] sm:h-[520px]"
            foot={<span className="font-mono text-white/45">src/components/ui/odometer.tsx</span>}
            art={(lit) => <LightArt lib="form" values={{ form: "fern", palette: "pearl", strands: 380, ripple: false, breath: 0.5, glow: 0.5, grain: 0.3, seed: 5 }} at={3.1} live={lit} className="cst-card-art cst-soft -right-[48%] -bottom-[8%] h-[92%] w-[118%]" />}
          />
        </Reveal>

        <Reveal className="lg:col-span-4" delay={80}>
          <FeatureCard
            n="002"
            title="Three looks, one switch"
            sub="Classic, Mono and Glass restyle every piece from its tokens. Switch it here, the whole site follows."
            className="h-[460px] sm:h-[520px]"
            foot={<StyleSwitch style={style} setStyle={setStyle} styles={styles} />}
            art={(lit) => <LightArt lib="grain" values={{ shape: "ring", colors: ["#0b0b0d", "#151a22", "#2f4058", "#8aa3c4", "#eef3fb"], angle: 230, warp: 0.4, grain: 0.4, seed: 4 }} at={2} live={lit} className="cst-card-art cst-fade-top inset-0 h-full w-full" />}
          >
            <div className="absolute inset-x-5 top-2 bottom-0 flex justify-center overflow-hidden [mask-image:linear-gradient(180deg,#000_70%,transparent)]">
              <div className="w-full max-w-[340px] origin-top scale-[.92]">
                <React.Suspense fallback={null}>
                  <ActionDrum />
                </React.Suspense>
              </div>
            </div>
          </FeatureCard>
        </Reveal>

        <Reveal className="md:col-span-2 lg:col-span-4" delay={160}>
          <FeatureCard
            n="003"
            title="Make art in Studio"
            sub="Tune any illustration or motion piece, then export it for your own page."
            href="#/studio"
            className="h-[460px] sm:h-[520px]"
            foot={
              <>
                <span className="font-mono text-white/55">PNG · SVG · WebM · GIF</span>
                <span className="flex items-center gap-1 text-white/70 transition-colors group-hover:text-white">
                  Open Studio <ArrowUpRight className="size-3.5" />
                </span>
              </>
            }
            art={(lit) => <LightArt lib="grain" values={{ shape: "band", colors: ["#0b0b0d", "#2a1209", "#9a3d16", "#efa05f", "#fff1dc"], angle: 205, warp: 0.6, grain: 0.5, seed: 9 }} at={4} live={lit} className="cst-card-art cst-fade-top inset-0 h-full w-full" />}
          />
        </Reveal>

        <Reveal className="md:col-span-2 lg:col-span-7">
          <FeatureCard
            n="004"
            title="Pane for your agent"
            sub="Connect the MCP server and Claude Code, Cursor or Codex can search the library and install pieces for you."
            href="#/mcp"
            className="h-[440px]"
            art={(lit) => <LightArt lib="form" values={{ form: "orchid", palette: "pearl", strands: 360, ripple: false, breath: 0.5, glow: 0.45, grain: 0.3, seed: 3 }} at={1.6} live={lit} className="cst-card-art cst-soft -right-[14%] -bottom-[40%] h-[130%] w-[60%]" />}
          >
            <div className="absolute top-1 right-0 bottom-0 left-6 overflow-hidden rounded-tl-[14px] bg-[#101013]/70 font-mono text-[12.5px] leading-[1.85] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-md sm:left-7">
              <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] px-4" aria-hidden>
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-3 text-[11px] text-white/35">~/checkout</span>
              </div>
              <div className="px-4 py-3 whitespace-pre text-white/45">
                <div>
                  <span className="text-white/30">$ </span>
                  <span className="text-white/85">{MCP_CMD}</span>
                </div>
                <div className="text-white/45">Added HTTP MCP server pane</div>
                <div className="mt-3">
                  <span className="text-white/30">› </span>
                  <span className="text-white/85">add an approval step before the agent sends invoices</span>
                </div>
                <div className="mt-2 text-white/60">
                  pane.search <span className="text-white/35">(“approval”)</span>
                </div>
                <div className="pl-4">approval-card · hold-to-confirm · agent-approvals</div>
                <div className="mt-1 text-white/60">
                  pane.get_install <span className="text-white/35">(“approval-card”)</span>
                </div>
                <div className="pl-4">
                  wrote <span className="text-white/85">src/components/ui/approval-card.tsx</span>
                </div>
              </div>
            </div>
          </FeatureCard>
        </Reveal>

        <Reveal className="md:col-span-2 lg:col-span-5" delay={80}>
          <FeatureCard
            n="005"
            title="Skills that carry the taste"
            sub={`Open-source agent skills for design, motion, accessibility and copy, in ${categories} categories, each with its install line.`}
            href="#/skills"
            className="h-[440px]"
            foot={
              <span className="ml-auto flex items-center gap-1 text-white/70 transition-colors group-hover:text-white">
                Browse skills <ArrowUpRight className="size-3.5" />
              </span>
            }
          >
            <div className="absolute inset-0 flex items-end overflow-hidden px-6 pb-4 sm:px-7">
              <div className="relative w-full">
                <div className="text-[132px] leading-[0.8] font-medium tracking-[-0.07em] text-white tabular-nums sm:text-[168px]">{SKILLS.length}</div>
                <ul className="pointer-events-none absolute top-0 right-0 bottom-0 hidden w-[52%] flex-col justify-end gap-1 overflow-hidden font-mono text-[11.5px] text-white/35 [mask-image:linear-gradient(180deg,transparent,#000_45%)] sm:flex" aria-hidden>
                  {skillNames.slice(0, 9).map((s) => (
                    <li key={s} className="truncate">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FeatureCard>
        </Reveal>
      </div>
    </section>
  )
}

/* Library: a ruled grid by category ------------------------------------------ */

const LIB_CELLS: { group: string; slug: string; blurb: string }[] = [
  { group: "Originals", slug: "odometer", blurb: "New patterns for agent work" },
  { group: "Chat", slug: "ai-answer", blurb: "Answers, sources, tools" },
  { group: "Agents", slug: "agent-plan", blurb: "Plans, runs, approvals" },
  { group: "Overlays", slug: "drawer", blurb: "Sheets, dialogs, swipes" },
  { group: "Stage", slug: "device-frames", blurb: "Product shots for your page" },
  { group: "AI blocks", slug: "model-arena", blurb: "Whole working surfaces" },
  { group: "Showpieces", slug: "dock", blurb: "Physics and depth" },
  { group: "Charts", slug: "sankey-flow", blurb: "Data that follows the pointer" },
  { group: "Illustrations", slug: "golden-hills", blurb: "Painted and drawn with code" },
  { group: "Motion", slug: "grain-gradient", blurb: "Backgrounds and text effects" },
]

function LibCell({ group, entry, count, blurb, className }: { group: string; entry?: LandingEntry; count: number; blurb: string; className?: string }) {
  const art = entry && (entry.kind === "illustrations" || entry.kind === "motion")
  const [hovered, setHovered] = React.useState(false)
  return (
    <div className={cn("cst-cell group flex min-h-[260px] flex-col overflow-hidden p-5 pb-0", className)} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <div className="flex items-baseline justify-between gap-3">
        <a href={`#/browse/${encodeURIComponent(group)}`} className="text-[15px] font-medium tracking-[-0.01em] after:absolute after:inset-0 after:content-['']">
          {group}
        </a>
        <span className="font-mono text-[12px] text-neutral-400 tabular-nums dark:text-neutral-500">{String(count).padStart(2, "0")}</span>
      </div>
      <p className={cn("mt-0.5 text-[13px]", muted)}>{blurb}</p>
      <div className={cn("relative mt-4 -mr-5 min-h-[150px] flex-1 overflow-hidden rounded-tl-xl", art ? "bg-neutral-950" : "bg-white shadow-[inset_1px_1px_0_rgb(0_0_0/0.06)] dark:bg-white/[0.03] dark:shadow-[inset_1px_1px_0_rgb(255_255_255/0.07)]")}>
        {entry?.demo && <LivePreview Demo={entry.demo} width={art ? 520 : 460} align={art ? "center" : "top"} variant="plain" bare={!art} hovered={hovered} replay={art ? undefined : 14000} className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]" />}
      </div>
    </div>
  )
}

function Cross({ x, y }: { x: string; y: string }) {
  return (
    <svg className="pointer-events-none absolute z-10 hidden size-[11px] -translate-x-1/2 -translate-y-1/2 lg:block" style={{ left: x, top: y, color: "var(--cross)" }} viewBox="0 0 11 11" aria-hidden>
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function Library({ groups, total }: { groups: LandingGroup[]; total: number }) {
  const cells = LIB_CELLS.flatMap((c) => {
    const g = groups.find((x) => x.label === c.group)
    if (!g) return []
    const entry = g.entries.find((e) => e.slug === c.slug && e.demo) ?? g.entries.find((e) => e.demo)
    return [{ ...c, entry, count: g.entries.length }]
  })
  const top = cells.slice(0, 4)
  const mid = cells.slice(4, 6)
  const rest = cells.slice(6)
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")} aria-labelledby="cst-lib">
      <Reveal>
        <div className="cst-grid relative shadow-[inset_1px_0_0_var(--line),inset_0_1px_0_var(--line)]">
          {[25, 50, 75].flatMap((x) => [33.333, 66.666].map((y) => <Cross key={`${x}-${y}`} x={`${x}%`} y={`${y}%`} />))}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(3,272px)]">
            {top.map((c) => (
              <LibCell key={c.group} {...c} />
            ))}
            {mid[0] && <LibCell {...mid[0]} className="lg:col-start-1 lg:row-start-2" />}
            <div className="cst-cell order-first flex flex-col justify-between gap-8 p-6 sm:col-span-2 sm:p-8 lg:order-none lg:col-span-2 lg:col-start-2 lg:row-start-2">
              <h2 id="cst-lib" className="text-[40px] leading-[0.98] font-medium tracking-[-0.05em] text-balance sm:text-[52px]">
                Made of <span className="tabular-nums">{total}</span>
                <br />
                <span className="text-neutral-400 dark:text-neutral-500">open-source pieces.</span>
              </h2>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className={cn("max-w-[36ch] text-[14px] leading-6", muted)}>Every tile is the real piece, running. Open one for its source, notes and install line.</p>
                <a href="#/browse" className="group flex items-center gap-1 text-[14px] font-medium">
                  Open the library <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
            {mid[1] && <LibCell {...mid[1]} className="lg:col-start-4 lg:row-start-2" />}
            {rest.map((c) => (
              <LibCell key={c.group} {...c} />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* Install ------------------------------------------------------------------ */

function Install({ slugs }: { slugs: string[] }) {
  const steps = [
    ["01", "Run one command", "The shadcn CLI fetches a single file from the registry. No package, no account."],
    ["02", "Read the file", "Tokens, motion and the notes on how it works sit together in one place."],
    ["03", "Make it yours", "Change anything. There is no version to keep up with and nothing to break later."],
  ] as const
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")} aria-labelledby="cst-install">
      <Reveal className="mx-auto max-w-[920px] text-center">
        <h2 id="cst-install" className="text-[40px] leading-[1] font-medium tracking-[-0.05em] text-balance sm:text-[64px]">
          One command. One file.
        </h2>
        <div className="mt-9 flex justify-center">
          <InstallCommand slugs={slugs} large className="w-full md:w-auto" />
        </div>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-[1080px] gap-x-10 gap-y-8 border-t border-black/[0.08] pt-8 sm:grid-cols-3 dark:border-white/[0.08]">
        {steps.map(([n, t, d], i) => (
          <Reveal key={n} delay={i * 80}>
            <div className="font-mono text-[12px] text-neutral-400 dark:text-neutral-500">{n}</div>
            <h3 className="mt-3 text-[17px] font-medium tracking-[-0.015em]">{t}</h3>
            <p className={cn("mt-1.5 text-[14.5px] leading-6", muted)}>{d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* Closing stage + footer ----------------------------------------------------- */

function Closing({ slugs }: { slugs: string[] }) {
  return (
    <section className={cn(wrap, "mt-28 sm:mt-40")}>
      <Reveal>
        <div className="cst-set cst-dk dark relative overflow-hidden rounded-[24px] sm:rounded-[28px]" data-theme="dark">
          <LightArt lib="form" values={{ form: "orchid", palette: "pearl", strands: 460, ripple: false, breath: 0.6, glow: 0.55, grain: 0.3, seed: 7 }} at={2.6} className="pointer-events-none absolute right-[-30%] bottom-[-14%] h-[52%] w-[130%] opacity-90 sm:top-[-6%] sm:right-[-14%] sm:bottom-auto sm:h-[118%] sm:w-[62%]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#09090b_0%,#09090b_55%,transparent_80%)] sm:bg-[linear-gradient(90deg,#09090b_0%,#09090b_34%,transparent_70%)]" />
          <div className="relative px-6 pt-16 pb-64 sm:px-12 sm:py-24 lg:px-16 lg:py-28">
            <h2 className="max-w-[12ch] text-[44px] leading-[0.96] font-medium tracking-[-0.05em] text-white sm:text-[72px]">Start with one piece.</h2>
            <p className="mt-5 max-w-[40ch] text-[16px] leading-7 text-white/55">Pick what your product needs, run one command, own the file. Free, MIT licensed, nothing to sign up for.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PrimaryLink href="#/browse" onDark>
                Browse the library
              </PrimaryLink>
              <InstallCommand slugs={slugs} onDark className="w-full sm:w-auto lg:max-w-[520px]" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const link = "text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
  const under = "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-200"
  return (
    <footer className={cn(wrap, "mt-24 pb-12 sm:mt-32")}>
      <div className="grid gap-10 border-t border-black/[0.08] pt-10 sm:grid-cols-[1.4fr_1fr_1fr] dark:border-white/[0.08]">
        <div>
          <a href="#/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em]">
            <PaneMark className="size-7" />
            Pane
          </a>
          <p className={cn("mt-3 max-w-[32ch] text-[13.5px] leading-6", muted)}>Open-source interface pieces for AI products and agents.</p>
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[13px] text-neutral-400 dark:text-neutral-500">Library</div>
          {NAV.map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="mb-1 text-[13px] text-neutral-400 dark:text-neutral-500">Project</div>
          <a href={GITHUB} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>
          <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className={link}>
            Issues
          </a>
          <span className={muted}>MIT licence</span>
        </div>
      </div>
      <p className="mt-10 text-[12.5px] leading-5 text-neutral-400 dark:text-neutral-500">
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

export default function LandingStage({ groups, dark, toggleDark, style, setStyle, styles }: LandingProps) {
  const all = React.useMemo(() => groups.flatMap((g) => g.entries).filter((e) => e.kind !== "screen"), [groups])
  const has = React.useCallback((slug: string) => all.some((e) => e.slug === slug), [all])
  const slugs = React.useMemo(() => {
    const s = ["odometer", "scope-words", "ai-answer", "agent-plan", "light-form", "control-bento", "approval-card"].filter(has)
    return s.length ? s : ["ai-answer"]
  }, [has])

  React.useEffect(() => {
    const prev = document.title
    document.title = "Pane – interface pieces for AI products"
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="cst min-h-dvh overflow-x-clip">
      <style href="landing-c" precedence="default">
        {CSS}
      </style>
      <Nav dark={dark} toggleDark={toggleDark} />
      <main>
        <Hero total={all.length} slugs={slugs} />
        <Features style={style} setStyle={setStyle} styles={styles} />
        <Library groups={groups} total={all.length} />
        <Install slugs={slugs} />
        <Closing slugs={slugs} />
      </main>
      <Footer />
    </div>
  )
}
