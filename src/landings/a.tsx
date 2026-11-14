import * as React from "react"
import { ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X } from "lucide-react"

import type { Landing } from "@/landing"
import { cn } from "@/lib/utils"
import { LivePreview } from "@/live-preview"
import { PaneMark } from "@/pane-mark"
import { SKILLS } from "@/skills-page"

/*
 * Direction A – "The wall".
 * The catalogue is the hero: a ruled grid of live pieces with crosshairs at the intersections and the
 * headline in the centre cell. The same column ruling runs down the whole page, so every section sits
 * on one specimen sheet. Column width is one CSS variable (--cw); the hero grid and the sheet share it.
 */

type Props = React.ComponentProps<typeof Landing>
type Entry = Props["groups"][number]["entries"][number]

const SITE = "https://paneui.vercel.app"
const GITHUB = "https://github.com/kametayturar/pane"
const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS = `
.wl { --ease: ${EASE};
  --paper: #fbfbfa; --raise: #ffffff; --line: #e8e7e3; --cross: #a3a29d;
  --ink: #0c0c0d; --ink2: #575652; --ink3: #8e8d88; --accent: #0060e2;
  --cw: clamp(144px, round(down, calc((100vw - 48px) / 5), 1px), 232px);
  --u: round(calc(var(--cw) * .38), 1px);
  --fill: 40px;
  background: var(--paper); color: var(--ink); }
.dark .wl { --paper: #0c0c0d; --raise: #161618; --line: #222225; --cross: #56565b;
  --ink: #f3f3f2; --ink2: #a6a6a2; --ink3: #6f6f6c; --accent: #5b9dff; }
@media (max-width: 767px) { .wl { --cw: 176px; --u: 84px; --fill: 32px; } }

.wl-sheet { width: calc(5 * var(--cw) + 6px); margin-inline: auto; }
@media (max-width: 767px) { .wl-sheet { width: calc(100% - 32px); } }

.wl-cross { position: absolute; width: 11px; height: 11px; pointer-events: none; z-index: 2; }
.wl-cross::before, .wl-cross::after { content: ""; position: absolute; background: var(--cross); }
.wl-cross::before { left: 0; top: 5px; width: 11px; height: 1px; }
.wl-cross::after { left: 5px; top: 0; width: 1px; height: 11px; }

.wl-cell { transition: transform .6s var(--ease), box-shadow .6s var(--ease), background-color .3s var(--ease); }
.wl-cell[data-front] { z-index: 3; transform: scale(1.045); background: var(--raise);
  box-shadow: 0 0 0 1px var(--line), 0 24px 48px -20px rgb(20 20 30 / .22), 0 2px 6px -2px rgb(20 20 30 / .06); }
.dark .wl-cell[data-front] { box-shadow: 0 0 0 1px #2e2e32, 0 24px 48px -20px rgb(0 0 0 / .8); }

.wl-in { animation: wl-in .9s var(--ease) backwards; animation-delay: var(--d, 0ms); }
@keyframes wl-in { from { opacity: 0; } }
.wl-rise { animation: wl-rise 1s var(--ease) backwards; animation-delay: var(--d, 0ms); }
@keyframes wl-rise { from { opacity: 0; transform: translateY(10px); filter: blur(6px); } }
.wl-swap { animation: wl-swap .5s var(--ease) backwards; }
@keyframes wl-swap { from { opacity: 0; transform: translateY(4px); } }

.wl-dots { background-image: radial-gradient(circle at center, var(--ink) .9px, transparent 1.3px); background-size: 7px 7px; opacity: .14;
  -webkit-mask-image: radial-gradient(120% 100% at 100% 100%, #000 0%, transparent 62%); mask-image: radial-gradient(120% 100% at 100% 100%, #000 0%, transparent 62%); }

.wl a:focus-visible, .wl button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.wl .wl-cell:focus-visible { outline-offset: -2px; }

@media (prefers-reduced-motion: reduce) {
  .wl-in, .wl-rise, .wl-swap { animation: none; }
  .wl-cell { transition: none; }
  .wl-cell[data-front] { transform: none; }
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

function useMedia(query: string) {
  const [match, setMatch] = React.useState(() => window.matchMedia(query).matches)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return match
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0")

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/** A label row in the cell's top-left corner: a short rule, the name, and a small index on the right. */
function Label({ children, index, front, className }: { children: React.ReactNode; index?: React.ReactNode; front?: boolean; className?: string }) {
  return (
    <div className={cn("flex h-10 shrink-0 items-center gap-2.5 px-4 md:px-5", className)}>
      <span className={cn("h-px w-2.5 shrink-0 transition-colors duration-300", front ? "bg-[var(--accent)]" : "bg-[var(--ink3)]")} aria-hidden />
      <span className="min-w-0 truncate text-[12.5px] font-medium tracking-[-0.005em]">{children}</span>
      {index != null && <span className="ml-auto shrink-0 font-mono text-[10.5px] text-[var(--ink3)] tabular-nums">{index}</span>}
    </div>
  )
}

/** The 11px crosshair that marks a grid intersection. `x`/`y` are the centre of the hairlines. */
function Cross({ style, className }: { style: React.CSSProperties; className?: string }) {
  return <span className={cn("wl-cross", className)} style={style} aria-hidden />
}

/** Crosshairs where a section's top rule meets the six vertical rules of the sheet. */
function SheetCrosses() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Cross key={k} className={k > 0 && k < 5 ? "max-md:hidden" : undefined} style={k === 5 ? { right: -6, top: -6 } : { left: `calc(${k} * (var(--cw) + 1px) - 6px)`, top: -6 }} />
      ))}
    </>
  )
}

const cellLink = "transition-colors duration-200 hover:bg-[var(--raise)]"

/* Install command ---------------------------------------------------------- */

function InstallCommand({ slugs, className, short }: { slugs: string[]; className?: string; short?: boolean }) {
  const [copied, copy] = useCopied()
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (slugs.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % slugs.length), 2800)
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
        "group flex w-full min-w-0 items-start gap-3 bg-[var(--raise)] px-4 py-3 text-left font-mono text-[11.5px] leading-[20px] text-[var(--ink2)] shadow-[0_0_0_1px_var(--line)] sm:text-[12.5px] transition-shadow hover:shadow-[0_0_0_1px_var(--cross)]",
        className,
      )}
    >
      <span className="text-[var(--ink3)] select-none">$</span>
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span className="block">npx shadcn@latest add</span>
        <span className="block">
          {short ? SITE.replace("https://", "") : SITE}/r/
          <span key={name} className="wl-swap inline-block font-medium text-[var(--ink)]">
            {name}
          </span>
          .json
        </span>
      </span>
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center text-[var(--ink3)] transition-colors group-hover:text-[var(--ink)]">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  )
}

function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex h-10 items-center gap-2 bg-[var(--ink)] px-4 text-[13.5px] font-medium text-[var(--paper)] transition-[opacity,transform] duration-200 hover:opacity-85 active:scale-[0.98]",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} />
    </a>
  )
}

function TextLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="group inline-flex items-center gap-1 text-[13.5px] font-medium text-[var(--ink)]">
      <span className="underline decoration-[var(--line)] underline-offset-4 transition-colors group-hover:decoration-[var(--ink)]">{children}</span>
      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} />
    </a>
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

function Nav({ dark, toggleDark }: Pick<Props, "dark" | "toggleDark">) {
  const [open, setOpen] = React.useState(false)
  const link = "px-2.5 py-1.5 text-[13.5px] text-[var(--ink2)] transition-colors hover:text-[var(--ink)]"
  return (
    <nav aria-label="Main" className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_86%,transparent)] backdrop-blur-xl">
      <div className="wl-sheet flex h-14 items-center gap-2 md:px-5">
        <a href="#/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em]">
          <PaneMark className="size-6" />
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
          <button type="button" onClick={toggleDark} aria-label="Toggle dark mode" className="grid size-9 place-items-center text-[var(--ink2)] transition-colors hover:text-[var(--ink)]">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a href="#/browse" className="ml-1 hidden h-8 items-center bg-[var(--ink)] px-3 text-[13px] font-medium text-[var(--paper)] transition-opacity hover:opacity-85 sm:inline-flex">
            Library
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center text-[var(--ink2)] lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--line)] lg:hidden">
          <div className="wl-sheet grid grid-cols-2 gap-px bg-[var(--line)] md:grid-cols-3">
            {NAV.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="bg-[var(--paper)] px-4 py-3 text-[14.5px]">
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

/* The wall ------------------------------------------------------------------ */

/** A cell on the wall, in grid units: column, row, column span, row span. */
type Cell = { c: number; r: number; cs?: number; rs: number; slug?: string; w?: number; role?: "head" | "install" }

// Desktop: 11 columns × 9 rows, centred on the viewport. The headline takes the middle three columns.
const WALL: Cell[] = [
  { c: 0, r: 0, rs: 4, slug: "ai-answer" },
  { c: 0, r: 4, rs: 5, slug: "agent-plan" },
  { c: 1, r: 0, rs: 2, slug: "thinking-loader" },
  { c: 1, r: 2, rs: 3, slug: "popover" },
  { c: 1, r: 5, rs: 4, slug: "golden-hills" },
  { c: 2, r: 0, rs: 4, slug: "thought-stack" },
  { c: 2, r: 4, rs: 2, slug: "swipe-row" },
  { c: 2, r: 6, rs: 3, slug: "scope-words" },
  { c: 3, r: 0, rs: 3, slug: "action-drum" },
  { c: 3, r: 3, rs: 4, slug: "model-picker" },
  { c: 3, r: 7, rs: 2, slug: "undo-countdown" },
  { c: 4, r: 0, rs: 2, slug: "tool-headline" },
  { c: 5, r: 0, rs: 2, slug: "effort-sentence" },
  { c: 6, r: 0, rs: 2, slug: "merge-range" },
  { c: 4, r: 2, cs: 3, rs: 5, role: "head" },
  { c: 4, r: 7, cs: 2, rs: 2, role: "install" },
  { c: 6, r: 7, rs: 2, slug: "hold-to-confirm" },
  { c: 7, r: 0, rs: 2, slug: "pulled-focus" },
  { c: 7, r: 2, rs: 4, slug: "plan-words" },
  { c: 7, r: 6, rs: 3, slug: "odometer" },
  { c: 8, r: 0, rs: 4, slug: "dash-burst" },
  { c: 8, r: 4, rs: 3, slug: "steer-swap" },
  { c: 8, r: 7, rs: 2, slug: "fill-in" },
  { c: 9, r: 0, rs: 3, slug: "tooltip" },
  { c: 9, r: 3, rs: 2, slug: "message-actions" },
  { c: 9, r: 5, rs: 4, slug: "light-form" },
  { c: 10, r: 0, rs: 5, slug: "same-page" },
  { c: 10, r: 5, rs: 4, slug: "tool-call-card" },
]

// Phone: the headline sits above, the wall is a strip of 5 columns × 5 rows that bleeds both edges.
const WALL_PHONE: Cell[] = [
  { c: 0, r: 0, rs: 3, slug: "thought-stack" },
  { c: 0, r: 3, rs: 2, slug: "swipe-row" },
  { c: 1, r: 0, rs: 2, slug: "tool-headline" },
  { c: 1, r: 2, rs: 3, slug: "model-picker" },
  { c: 2, r: 0, rs: 3, slug: "odometer" },
  { c: 2, r: 3, rs: 2, slug: "hold-to-confirm" },
  { c: 3, r: 0, rs: 2, slug: "effort-sentence" },
  { c: 3, r: 2, rs: 3, slug: "plan-words" },
  { c: 4, r: 0, rs: 3, slug: "action-drum" },
  { c: 4, r: 3, rs: 2, slug: "fill-in" },
]

const keyOf = (cell: Cell) => `${cell.c}:${cell.r}`

function WallCell({ cell, entry, index, front, onEnter, onLeave, delay, narrow }: { cell: Cell; entry?: Entry; index?: number; front: boolean; onEnter: () => void; onLeave: () => void; delay: number; narrow: boolean }) {
  const place: React.CSSProperties = { gridColumn: `${cell.c + 1} / span ${cell.cs ?? 1}`, gridRow: `${cell.r + 2} / span ${cell.rs}`, "--d": `${delay}ms` } as React.CSSProperties
  if (!entry?.demo) return <div className="bg-[var(--paper)]" style={place} aria-hidden />
  const art = entry.kind === "illustrations" || entry.kind === "motion"
  const width = cell.w ?? (art ? 560 : narrow ? 360 : cell.rs >= 4 ? 440 : 400)
  return (
    <a
      href={`#/${entry.slug}`}
      data-wall={keyOf(cell)}
      data-front={front ? "" : undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="wl-cell wl-in relative flex min-w-0 flex-col overflow-hidden bg-[var(--paper)]"
      style={place}
    >
      <Label index={index != null ? pad(index + 1, 3) : undefined} front={front}>
        {entry.name}
      </Label>
      <div className="relative min-h-0 flex-1">
        <LivePreview Demo={entry.demo} width={width} align={art ? "center" : "top"} variant="plain" bare={!art} replay={art ? undefined : 14000} hovered={front} className="absolute inset-0" />
      </div>
    </a>
  )
}

function HeadCell({ cell, total, phone }: { cell?: Cell; total: number; phone?: boolean }) {
  const place = cell ? ({ gridColumn: `${cell.c + 1} / span ${cell.cs ?? 1}`, gridRow: `${cell.r + 2} / span ${cell.rs}` } as React.CSSProperties) : undefined
  return (
    <div className={cn("relative flex flex-1 flex-col overflow-hidden bg-[var(--paper)]", !phone && "z-[1]")} style={place}>
      <div className="wl-dots pointer-events-none absolute inset-0" aria-hidden />
      <Label index="MIT">Pane</Label>
      <div className={cn("relative flex flex-1 flex-col justify-center", phone ? "px-4 pt-6 pb-8" : "px-[calc(var(--cw)*.17)] pb-6")}>
        <h1 className="wl-rise font-medium tracking-[-0.045em]" style={{ "--d": "80ms", fontSize: phone ? 38 : "calc(var(--cw) * .25)", lineHeight: 1.04 } as React.CSSProperties}>
          <span className="block font-normal text-[var(--ink3)]">
            Made of <span className="tabular-nums">{total}</span>
          </span>
          <span className={phone ? "" : "block"}>open-source pieces </span>
          <span className={phone ? "" : "block"}>for AI products.</span>
        </h1>
        <p className={cn("wl-rise mt-5 max-w-[44ch] text-[var(--ink2)]", phone ? "text-[15px] leading-6" : "text-[15px] leading-[24px]")} style={{ "--d": "180ms" } as React.CSSProperties}>
          Chat, agents, approvals, overlays and art drawn in code. Each piece is one React file you copy into your project and own.
        </p>
      </div>
    </div>
  )
}

function InstallCell({ cell, slugs, phone }: { cell?: Cell; slugs: string[]; phone?: boolean }) {
  const place = cell ? ({ gridColumn: `${cell.c + 1} / span ${cell.cs ?? 1}`, gridRow: `${cell.r + 2} / span ${cell.rs}` } as React.CSSProperties) : undefined
  return (
    <div className={cn("relative flex flex-1 flex-col bg-[var(--paper)]", !phone && "wl-rise z-[1]")} style={{ ...place, "--d": "260ms" } as React.CSSProperties}>
      <Label index="shadcn">Install one piece</Label>
      <div className={cn("flex flex-1 flex-col justify-between gap-3", phone ? "px-4 pb-5" : "px-5 pb-5")}>
        <InstallCommand slugs={slugs} short={!phone} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PrimaryLink href="#/browse">Browse the library</PrimaryLink>
          <TextLink href="#/mcp">Or connect your agent</TextLink>
        </div>
      </div>
    </div>
  )
}

function Wall({ cells, cols, rows, find, order, head, install, narrow }: { cells: Cell[]; cols: number; rows: number; find: (slug: string) => Entry | undefined; order: Map<string, number>; head?: React.ReactNode; install?: React.ReactNode; narrow: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [front, setFront] = React.useState<string | null>(null)
  const hovering = React.useRef(false)
  const reduced = useMedia("(prefers-reduced-motion: reduce)")

  // One cell at a time comes forward. Only cells fully on screen take part, in a fixed shuffled order.
  React.useEffect(() => {
    if (reduced) return
    const seq = cells.filter((c) => c.slug && find(c.slug)).map(keyOf)
    for (let i = seq.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1)
      ;[seq[i], seq[j]] = [seq[j], seq[i]]
    }
    let n = 0
    const tick = () => {
      if (hovering.current || document.hidden) return
      const root = ref.current?.parentElement?.getBoundingClientRect()
      if (!root) return
      for (let k = 0; k < seq.length; k++) {
        const key = seq[(n + k) % seq.length]
        const el = ref.current?.querySelector<HTMLElement>(`[data-wall="${key}"]`)
        const r = el?.getBoundingClientRect()
        if (r && r.left >= 0 && r.right <= window.innerWidth && r.top >= root.top - 1 && r.bottom <= root.bottom + 1) {
          n = (n + k + 1) % seq.length
          setFront(key)
          return
        }
      }
    }
    const first = window.setTimeout(tick, 1600)
    const id = window.setInterval(tick, 3400)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [cells, find, reduced])

  // Crosshairs at every cell corner that falls inside the grid.
  const corners = React.useMemo(() => {
    const seen = new Map<string, [number, number]>()
    for (const cell of cells) {
      const cs = cell.cs ?? 1
      for (const x of [cell.c, cell.c + cs]) for (const y of [cell.r, cell.r + cell.rs]) if (x > 0 && x < cols) seen.set(`${x}:${y}`, [x, y])
    }
    return [...seen.values()]
  }, [cells, cols])

  const centre = { c: (cols - 1) / 2, r: (rows - 1) / 2 }
  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 gap-px bg-[var(--line)]"
      style={{ gridTemplateColumns: `repeat(${cols}, var(--cw))`, gridTemplateRows: `var(--fill) repeat(${rows}, var(--u)) var(--fill)` }}
    >
      {Array.from({ length: cols }, (_, c) => (
        <React.Fragment key={c}>
          <div className="bg-[var(--paper)]" style={{ gridColumn: c + 1, gridRow: 1 }} />
          <div className="bg-[var(--paper)]" style={{ gridColumn: c + 1, gridRow: rows + 2 }} />
        </React.Fragment>
      ))}
      {cells.map((cell) => {
        if (cell.role === "head") return <HeadCellSlot key="head" cell={cell}>{head}</HeadCellSlot>
        if (cell.role === "install") return <HeadCellSlot key="install" cell={cell}>{install}</HeadCellSlot>
        const entry = cell.slug ? find(cell.slug) : undefined
        const key = keyOf(cell)
        const dist = Math.hypot(cell.c + (cell.cs ?? 1) / 2 - 0.5 - centre.c, (cell.r + cell.rs / 2 - 0.5 - centre.r) * 0.5)
        return (
          <WallCell
            key={key}
            cell={cell}
            entry={entry}
            index={entry ? order.get(entry.slug) : undefined}
            front={front === key}
            delay={Math.round(240 + dist * 90)}
            narrow={narrow}
            onEnter={() => {
              hovering.current = true
              setFront(key)
            }}
            onLeave={() => {
              hovering.current = false
            }}
          />
        )
      })}
      {corners.map(([x, y]) => (
        <Cross key={`${x}:${y}`} style={{ left: `calc(${x} * (var(--cw) + 1px) - 6px)`, top: `calc(var(--fill) + ${y} * (var(--u) + 1px) - 5px)` }} />
      ))}
    </div>
  )
}

/** Places a hero child (headline or install) on the grid; the child renders its own surface. */
function HeadCellSlot({ cell, children }: { cell: Cell; children: React.ReactNode }) {
  return (
    <div className="relative z-[1] flex flex-col" style={{ gridColumn: `${cell.c + 1} / span ${cell.cs ?? 1}`, gridRow: `${cell.r + 2} / span ${cell.rs}` }}>
      {children}
    </div>
  )
}

function Hero({ find, order, total, slugs }: { find: (slug: string) => Entry | undefined; order: Map<string, number>; total: number; slugs: string[] }) {
  const phone = useMedia("(max-width: 767px)")
  if (phone)
    return (
      <header>
        <div className="wl-sheet border-x border-[var(--line)]">
          <HeadCell total={total} phone />
        </div>
        <div className="relative overflow-hidden border-y border-[var(--line)]" style={{ height: "calc(5 * var(--u) + 6px + 2 * var(--fill) - 32px)" }}>
          <Wall cells={WALL_PHONE} cols={5} rows={5} find={find} order={order} narrow />
        </div>
        <div className="wl-sheet border-x border-[var(--line)]">
          <InstallCell slugs={slugs} phone />
        </div>
      </header>
    )
  return (
    <header className="relative overflow-hidden border-b border-[var(--line)]" style={{ height: "calc(9 * var(--u) + 10px + 2 * var(--fill) - 32px)" }}>
      <Wall
        cells={WALL}
        cols={11}
        rows={9}
        find={find}
        order={order}
        narrow={false}
        head={<HeadCell total={total} />}
        install={<InstallCell slugs={slugs} />}
      />
    </header>
  )
}

/* Sheet sections ------------------------------------------------------------ */

/** An empty ruled band between sections: the column rules keep running through it. */
function Band({ tall }: { tall?: boolean }) {
  return (
    <div className="relative grid grid-cols-1 gap-px bg-[var(--line)] md:grid-cols-5" aria-hidden>
      {[0, 1, 2, 3, 4].map((k) => (
        <div key={k} className={cn("bg-[var(--paper)]", tall ? "h-12 md:h-24" : "h-8 md:h-16", k > 0 && "max-md:hidden")} />
      ))}
    </div>
  )
}

function Section({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cn("relative grid grid-cols-1 gap-px bg-[var(--line)] md:grid-cols-5", className)}>
      <SheetCrosses />
      {children}
    </section>
  )
}

function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-[30px] leading-[1.06] font-medium tracking-[-0.04em] text-balance md:text-[clamp(30px,calc(var(--cw)*.185),42px)]", className)}>{children}</h2>
}

function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-4 max-w-[46ch] text-[15px] leading-[25px] text-[var(--ink2)]", className)}>{children}</p>
}

function Stats({ stats }: { stats: { n: number; label: string; href: string }[] }) {
  return (
    <Section label="Library in numbers" className="grid-cols-2">
      {stats.map((s, i) => (
        <a key={s.label} href={s.href} className={cn("group flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 md:p-5", cellLink, i === stats.length - 1 && stats.length % 2 && "max-md:col-span-2")}>
          <span className="flex items-center justify-between font-mono text-[10.5px] text-[var(--ink3)]">
            {pad(i + 1)}
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span>
            <span className="block text-[44px] leading-none font-medium tracking-[-0.05em] tabular-nums md:text-[clamp(40px,calc(var(--cw)*.26),60px)]">{s.n}</span>
            <span className="mt-2 block text-[13px] text-[var(--ink2)]">{s.label}</span>
          </span>
        </a>
      ))}
    </Section>
  )
}

function InstallSection({ slugs, dark, toggleDark, style, setStyle, styles }: { slugs: string[] } & Omit<Props, "groups">) {
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (slugs.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % slugs.length), 2800)
    return () => window.clearInterval(id)
  }, [slugs.length])
  const name = slugs[i % slugs.length]
  return (
    <Section label="Install" className="grid-cols-2">
      <div className="col-span-2 flex flex-col bg-[var(--paper)] md:col-span-2">
        <Label index="01">Install</Label>
        <div className="px-4 pt-6 pb-8 md:px-5 md:pt-10">
          <H2>One command. One file. Yours to change.</H2>
          <Lead>No package to upgrade and no wrapper to fight. The shadcn CLI writes a single component file into your project, with its own tokens and motion inside.</Lead>
        </div>
      </div>
      <div className="col-span-2 flex flex-col bg-[var(--paper)] md:col-span-3">
        <Label index="terminal">What runs</Label>
        <div className="flex flex-1 flex-col justify-center gap-px px-4 pb-6 md:px-8 md:pb-8">
          <InstallCommand slugs={slugs} />
          <div className="bg-[var(--raise)] px-4 py-3 font-mono text-[12.5px] leading-[22px] text-[var(--ink3)] shadow-[0_0_0_1px_var(--line)]">
            <div>
              <span className="text-[var(--ink)]">+</span> src/components/ui/
              <span key={name} className="wl-swap inline-block text-[var(--ink)]">
                {name}
              </span>
              .tsx
            </div>
            <div>  1 file written · 0 runtime dependencies added</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 md:p-5">
        <span className="font-mono text-[10.5px] text-[var(--ink3)]">MIT</span>
        <div>
          <div className="text-[15px] font-medium tracking-[-0.01em]">Free to use</div>
          <p className="mt-1 text-[13px] leading-5 text-[var(--ink2)]">No account, no tiers. Use it in client work.</p>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 md:p-5">
        <span className="font-mono text-[10.5px] text-[var(--ink3)]">.tsx</span>
        <div>
          <div className="text-[15px] font-medium tracking-[-0.01em]">Readable source</div>
          <p className="mt-1 text-[13px] leading-5 text-[var(--ink2)]">Each file ships notes on the technique behind it.</p>
        </div>
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 md:col-span-2 md:p-5">
        <span className="font-mono text-[10.5px] text-[var(--ink3)]">style</span>
        <div>
          <div className="text-[15px] font-medium tracking-[-0.01em]">Three looks from the same tokens</div>
          <div className="mt-3 flex gap-px bg-[var(--line)] p-px" role="radiogroup" aria-label="Style">
            {styles.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={style === o.id}
                onClick={() => setStyle(o.id)}
                className={cn("flex flex-1 items-center justify-center gap-2 py-2 text-[12.5px] font-medium transition-colors", style === o.id ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--paper)] text-[var(--ink2)] hover:bg-[var(--raise)] hover:text-[var(--ink)]")}
              >
                <span className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: o.swatch }} aria-hidden />
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button type="button" onClick={toggleDark} aria-label="Toggle dark mode" className={cn("col-span-2 flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 text-left md:col-span-1 md:p-5", cellLink)}>
        <span className="font-mono text-[10.5px] text-[var(--ink3)]">--ink: {dark ? "#fff" : "#000"}</span>
        <div className="w-full">
          <div className="flex items-center justify-between text-[15px] font-medium tracking-[-0.01em]">
            Dark mode
            <span className="relative h-5 w-9 shrink-0 bg-[var(--line)]">
              <span className={cn("absolute top-0.5 left-0.5 size-4 bg-[var(--ink)] transition-transform duration-300", dark && "translate-x-4")} style={{ transitionTimingFunction: EASE }} />
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[var(--ink2)]">One ink token flips every piece.</p>
        </div>
      </button>
    </Section>
  )
}

function Originals({ entries, order }: { entries: Entry[]; order: Map<string, number> }) {
  const [active, setActive] = React.useState(0)
  const current = entries[active]
  if (!current?.demo) return null
  return (
    <Section label="Originals">
      <div className="flex flex-col bg-[var(--paper)] md:col-span-2">
        <Label index="02">Originals</Label>
        <div className="px-4 pt-6 md:px-5 md:pt-10">
          <H2>{entries.length} new ways to show what an agent is doing.</H2>
          <Lead>Each one turns an agent moment into words you act on: a plan where the last word is the control, a countdown where undo is the number.</Lead>
        </div>
        <ol className="mt-8 flex flex-col border-t border-[var(--line)] md:mt-10">
          {entries.map((e, i) => (
            <li key={e.slug} className="border-b border-[var(--line)] last:border-b-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                onPointerEnter={() => setActive(i)}
                aria-pressed={i === active}
                className={cn("flex h-10 w-full items-center gap-3 px-4 text-left text-[14px] transition-colors md:px-5", i === active ? "bg-[var(--raise)] text-[var(--ink)]" : "text-[var(--ink2)] hover:text-[var(--ink)]")}
              >
                <span className={cn("h-px w-2.5 shrink-0 transition-colors", i === active ? "bg-[var(--accent)]" : "bg-[var(--line)]")} aria-hidden />
                {e.name}
                <span className="ml-auto font-mono text-[10.5px] text-[var(--ink3)] tabular-nums">{pad((order.get(e.slug) ?? i) + 1, 3)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex min-h-[440px] flex-col bg-[var(--paper)] md:col-span-3">
        <Label index={`${pad(active + 1)} / ${pad(entries.length)}`}>{current.name}</Label>
        <div className="relative min-h-[360px] flex-1">
          <LivePreview key={current.slug} Demo={current.demo} width={620} align="center" bare replay={12000} className="absolute inset-0" />
        </div>
        <div key={current.slug} className="wl-swap flex flex-col gap-3 border-t border-[var(--line)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="max-w-[56ch] text-[13.5px] leading-[21px] text-[var(--ink2)]">{current.description}</p>
          <TextLink href={`#/${current.slug}`}>Open</TextLink>
        </div>
      </div>
    </Section>
  )
}

const FORMATS = [
  ["PNG", "Still image"],
  ["SVG", "Vector"],
  ["WebM", "Video loop"],
  ["GIF", "Animated loop"],
] as const

function Studio({ art, order }: { art?: Entry; order: Map<string, number> }) {
  return (
    <Section label="Studio">
      <div className="flex flex-col bg-[var(--paper)] md:col-span-2">
        <Label index="03">Studio</Label>
        <div className="px-4 pt-6 md:px-5 md:pt-10">
          <H2>Tune the art, then export the file.</H2>
          <Lead>Every illustration and motion piece opens in Studio. Change its colours, speed and framing, and take it to your own page as an image or a clip.</Lead>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-px border-y border-[var(--line)] bg-[var(--line)] md:mt-auto md:border-b-0">
          {FORMATS.map(([f, what]) => (
            <div key={f} className="bg-[var(--paper)] px-4 py-4 md:px-5">
              <div className="font-mono text-[20px] tracking-[-0.02em]">{f}</div>
              <div className="mt-1 text-[12.5px] text-[var(--ink3)]">{what}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--line)] px-4 py-4 md:px-5">
          <TextLink href="#/studio">Open Studio</TextLink>
        </div>
      </div>
      <a href={art ? `#/${art.slug}` : "#/studio"} className="group flex flex-col bg-[var(--paper)] md:col-span-3">
        <Label index={art ? pad((order.get(art.slug) ?? 0) + 1, 3) : undefined}>{art?.name ?? "Studio"}</Label>
        <div className="relative min-h-[300px] flex-1 overflow-hidden md:min-h-[480px]">
          {art?.demo && <LivePreview Demo={art.demo} width={1100} align="center" variant="plain" className="absolute inset-0" />}
        </div>
      </a>
    </Section>
  )
}

const TOOLS = [
  ["search_pieces", "Find pieces by job, interaction or look"],
  ["get_piece", "One piece in full, with its source"],
  ["list_pieces", "Every piece, grouped like the site"],
  ["list_tags", "The tag vocabulary"],
  ["get_guide", "Pane's tokens, type and motion rules"],
  ["search_skills", "Agent skills for UI work"],
] as const

function Mcp() {
  const [copied, copy] = useCopied()
  const cmd = `claude mcp add --transport http pane ${SITE}/api/mcp`
  return (
    <Section label="MCP server">
      <div className="flex flex-col bg-[var(--paper)] md:col-span-2">
        <Label index="04">MCP server</Label>
        <div className="px-4 pt-6 pb-8 md:px-5 md:pt-10">
          <H2>Your coding agent can use the library too.</H2>
          <Lead>Connect the MCP server and Claude Code, Cursor or Codex can search Pane, read a piece's source and write it into your project.</Lead>
          <button
            type="button"
            onClick={() => copy(cmd)}
            aria-label="Copy the MCP install command"
            className="group mt-8 flex w-full items-start gap-3 bg-[var(--raise)] px-4 py-3 text-left font-mono text-[11.5px] leading-[20px] text-[var(--ink2)] shadow-[0_0_0_1px_var(--line)] sm:text-[12.5px] transition-shadow hover:shadow-[0_0_0_1px_var(--cross)]"
          >
            <span className="text-[var(--ink3)] select-none">$</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[var(--ink)]">
                <span className="inline-block">claude mcp add</span> <span className="inline-block">--transport http pane</span>
              </span>
              <span className="block [overflow-wrap:anywhere]">{SITE}/api/mcp</span>
            </span>
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center text-[var(--ink3)] group-hover:text-[var(--ink)]">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</span>
          </button>
          <div className="mt-5">
            <TextLink href="#/mcp">Setup for other clients</TextLink>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-[var(--paper)] md:col-span-3">
        <Label index="session">In your editor</Label>
        <div className="flex flex-1 flex-col justify-center px-4 py-6 font-mono text-[12.5px] leading-[22px] md:px-8">
          <div className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-1.5 text-[var(--ink2)]">
            <span className="text-[var(--ink3)]">you</span>
            <span className="font-sans text-[14px] text-[var(--ink)]">Ask before the agent sends anything on my behalf.</span>
            <span className="text-[var(--ink3)]">agent</span>
            <span>
              search_pieces(<span className="text-[var(--ink)]">"permission"</span>)
            </span>
            <span />
            <span className="text-[var(--ink3)]">→ scope-words, hold-to-confirm, approval-card</span>
            <span />
            <span>
              get_piece(<span className="text-[var(--ink)]">"scope-words"</span>)
            </span>
            <span />
            <span>
              <span className="text-[var(--ink)]">+</span> src/components/ui/scope-words.tsx
            </span>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-px border-t border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          {TOOLS.map(([name, does]) => (
            <li key={name} className="bg-[var(--paper)] px-4 py-3 md:px-5">
              <div className="font-mono text-[12.5px] text-[var(--ink)]">{name}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ink3)]">{does}</div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function Skills() {
  const cats = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const s of SKILLS) m.set(s.category, (m.get(s.category) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [])
  if (!SKILLS.length) return null
  const max = cats[0]?.[1] ?? 1
  return (
    <Section label="Agent skills">
      <div className="flex flex-col bg-[var(--paper)] md:col-span-2">
        <Label index="05">Skills</Label>
        <div className="flex flex-1 flex-col px-4 pt-6 pb-8 md:px-5 md:pt-10">
          <div className="text-[88px] leading-[0.9] font-medium tracking-[-0.06em] tabular-nums md:text-[clamp(80px,calc(var(--cw)*.5),116px)]">{SKILLS.length}</div>
          <H2 className="mt-3">agent skills, each with its install line.</H2>
          <Lead>Components give your product its look. Skills give your coding agent the judgement behind it: design, motion, accessibility and copy.</Lead>
          <div className="mt-8 md:mt-auto md:pt-8">
            <TextLink href="#/skills">Browse the skills</TextLink>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-[var(--paper)] md:col-span-3">
        <Label index="by category">What they cover</Label>
        <ul className="flex flex-1 flex-col justify-center px-4 py-4 md:px-8 md:py-6">
          {cats.map(([cat, n]) => (
            <li key={cat}>
              <a href="#/skills" className="group grid grid-cols-[minmax(0,1fr)_32px] items-center gap-4 border-b border-[var(--line)] py-3 sm:grid-cols-[180px_minmax(0,1fr)_32px]">
                <span className="truncate text-[14px] text-[var(--ink2)] transition-colors group-hover:text-[var(--ink)]">{cat}</span>
                <span className="hidden h-px bg-[var(--line)] sm:block" aria-hidden>
                  <span className="block h-px bg-[var(--ink)] transition-[width] duration-500" style={{ width: `${(n / max) * 100}%`, transitionTimingFunction: EASE }} />
                </span>
                <span className="text-right font-mono text-[12.5px] text-[var(--ink)] tabular-nums">{n}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function Library({ groups, total }: { groups: Props["groups"]; total: number }) {
  const rows = groups.filter((g) => g.entries.length)
  const rest = (5 - (rows.length % 5)) % 5
  return (
    <Section label="Library by category" className="grid-cols-2">
      <div className="col-span-2 flex flex-col bg-[var(--paper)] md:col-span-5">
        <Label index="06">Library</Label>
        <div className="flex flex-col gap-5 px-4 pt-6 pb-8 md:flex-row md:items-end md:justify-between md:px-5 md:pt-10">
          <H2>Every piece, filed by what it's for.</H2>
          <TextLink href="#/browse">Browse all {total}</TextLink>
        </div>
      </div>
      {rows.map((g, i) => (
        <a key={g.label} href={`#/browse/${encodeURIComponent(g.label)}`} className={cn("group flex min-h-[148px] flex-col bg-[var(--paper)] p-4 md:min-h-[172px] md:p-5", cellLink)}>
          <span className="flex items-center justify-between font-mono text-[10.5px] text-[var(--ink3)]">
            {pad(i + 1)}
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="mt-4 flex items-baseline justify-between gap-3">
            <span className="text-[16px] font-medium tracking-[-0.015em]">{g.label}</span>
            <span className="font-mono text-[12.5px] text-[var(--ink2)] tabular-nums">{g.entries.length}</span>
          </span>
          <span className="mt-auto pt-5 text-[12.5px] leading-[19px] text-[var(--ink3)]">
            {g.entries
              .slice(0, 3)
              .map((e) => e.name)
              .join(", ")}
            {g.entries.length > 3 ? ", …" : ""}
          </span>
        </a>
      ))}
      {rest > 0 && (
        <a href="#/browse" className={cn("group hidden flex-col justify-between bg-[var(--paper)] p-5 md:flex", cellLink)} style={{ gridColumn: `span ${rest}` }}>
          <span className="font-mono text-[10.5px] text-[var(--ink3)]">all</span>
          <span className="flex items-end justify-between gap-6">
            <span className="text-[clamp(40px,calc(var(--cw)*.26),60px)] leading-none font-medium tracking-[-0.05em] tabular-nums">{total}</span>
            <span className="flex items-center gap-1.5 pb-1 text-[14px] font-medium">
              Browse the whole library
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} />
            </span>
          </span>
        </a>
      )}
    </Section>
  )
}

function Closing({ slugs }: { slugs: string[] }) {
  return (
    <Section label="Get started">
      <div className="flex flex-col bg-[var(--paper)] md:col-span-3">
        <Label index="07">Start</Label>
        <div className="px-4 pt-8 pb-10 md:px-5 md:pt-16 md:pb-16">
          <h2 className="text-[48px] leading-[0.98] font-medium tracking-[-0.05em] text-balance md:text-[clamp(48px,calc(var(--cw)*.36),84px)]">Start with one piece.</h2>
          <Lead>Pick what your product needs, run one command, and the file is yours. Nothing to sign up for and nothing to pay.</Lead>
        </div>
      </div>
      <div className="flex flex-col justify-end gap-4 bg-[var(--paper)] px-4 pt-4 pb-6 md:col-span-2 md:p-5">
        <InstallCommand slugs={slugs} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PrimaryLink href="#/browse">Browse the library</PrimaryLink>
          <TextLink href={GITHUB} external>
            Star on GitHub
          </TextLink>
        </div>
      </div>
    </Section>
  )
}

function Footer() {
  const link = "text-[13.5px] text-[var(--ink2)] transition-colors hover:text-[var(--ink)]"
  const credit = "underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink)]"
  return (
    <footer>
      <Section label="Footer" className="grid-cols-2">
        <div className="col-span-2 flex flex-col justify-between gap-6 bg-[var(--paper)] p-4 md:col-span-2 md:p-5">
          <a href="#/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em]">
            <PaneMark className="size-6" />
            Pane
          </a>
          <p className="max-w-[34ch] text-[13px] leading-5 text-[var(--ink3)]">An open-source library of interface pieces for AI products and agents.</p>
        </div>
        <div className="flex flex-col gap-2 bg-[var(--paper)] p-4 md:p-5">
          <span className="mb-1 font-mono text-[10.5px] text-[var(--ink3)]">Library</span>
          {NAV.slice(0, 3).map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 bg-[var(--paper)] p-4 md:p-5">
          <span className="mb-1 font-mono text-[10.5px] text-[var(--ink3)]">Tools</span>
          {NAV.slice(3).map(([label, href]) => (
            <a key={label} href={href} className={link}>
              {label}
            </a>
          ))}
        </div>
        <div className="col-span-2 flex flex-col gap-2 bg-[var(--paper)] p-4 md:col-span-1 md:p-5">
          <span className="mb-1 font-mono text-[10.5px] text-[var(--ink3)]">Project</span>
          <a href={GITHUB} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>
          <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className={link}>
            Issues
          </a>
          <span className="text-[13.5px] text-[var(--ink2)]">MIT licence</span>
        </div>
        <p className="col-span-2 bg-[var(--paper)] p-4 text-[12.5px] leading-5 text-[var(--ink3)] md:col-span-5 md:p-5">
          MIT © Turar Kametay. Inspired by{" "}
          <a href="https://www.affectui.com" target="_blank" rel="noreferrer" className={credit}>
            affectUI
          </a>
          ,{" "}
          <a href="https://uiarc.dev" target="_blank" rel="noreferrer" className={credit}>
            Arc UI
          </a>{" "}
          and others. All code written from scratch. Skills by Emil Kowalski, Benji Taylor (Stageshow) and Damir Sokolovsky (Unslop,{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className={credit}>
            CC BY 4.0
          </a>
          ).
        </p>
      </Section>
    </footer>
  )
}

/* Page --------------------------------------------------------------------- */

export default function LandingWall({ groups, dark, toggleDark, style, setStyle, styles }: Props) {
  const all = React.useMemo(() => groups.flatMap((g) => g.entries).filter((e) => e.kind !== "screen"), [groups])
  const find = React.useCallback((slug: string) => all.find((e) => e.slug === slug && e.demo), [all])
  // The catalogue number printed in each cell: the piece's position in the library.
  const order = React.useMemo(() => new Map(all.map((e, i) => [e.slug, i])), [all])
  const count = (...kinds: string[]) => all.filter((e) => kinds.includes(e.kind)).length
  const stats = [
    { n: all.length, label: "pieces in the library", href: "#/browse" },
    { n: count("ui", "blocks"), label: "components and blocks", href: "#/browse" },
    { n: count("illustrations"), label: "illustrations", href: "#/browse/Illustrations" },
    { n: count("motion"), label: "motion effects", href: "#/browse/Motion" },
    { n: SKILLS.length, label: "agent skills", href: "#/skills" },
  ].filter((s) => s.n)
  const originals = React.useMemo(() => (groups.find((g) => g.label === "Originals")?.entries ?? []).filter((e) => e.demo), [groups])
  const slugs = ["odometer", "plan-words", "scope-words", "thought-stack", "tool-headline", "undo-countdown"].filter((s) => find(s))
  const install = slugs.length ? slugs : ["ai-answer"]
  const art = find("gouache-lake") ?? find("golden-hills")

  React.useEffect(() => {
    const prev = document.title
    document.title = "Pane: open-source pieces for AI products"
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="wl min-h-dvh overflow-x-clip">
      <style href="landing-wall" precedence="default">
        {CSS}
      </style>
      <Nav dark={dark} toggleDark={toggleDark} />
      <Hero find={find} order={order} total={all.length} slugs={install} />
      <main className="wl-sheet flex flex-col gap-px border-x border-[var(--line)] bg-[var(--line)]">
        <Stats stats={stats} />
        <Band tall />
        <InstallSection slugs={install} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} styles={styles} />
        <Band />
        {originals.length > 0 && <Originals entries={originals} order={order} />}
        <Band />
        <Studio art={art} order={order} />
        <Band />
        <Mcp />
        <Band />
        <Skills />
        <Band />
        <Library groups={groups} total={all.length} />
        <Band tall />
        <Closing slugs={install} />
        <Band />
        <Footer />
      </main>
    </div>
  )
}
