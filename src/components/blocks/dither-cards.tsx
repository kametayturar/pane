"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, MapPin, Maximize2 } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DitherCardTone = "ok" | "warn" | "bad"

export type DitherCardTask = {
  /** Row label, e.g. "Capacity". */
  label: string
  /** Segments filled. */
  done: number
  /** Segments in total (7 looks best). */
  total: number
  /** Colour of the filled segments. Default "ok" (green). */
  tone?: DitherCardTone
}

export type DitherCardItem = {
  /** Serif headline. */
  title: string
  /** Two-line muted description. */
  description: string
  /** Place shown next to the pin. */
  location: string
  /** The progress rows in the top-left corner (up to 4 look right). */
  tasks: DitherCardTask[]
  /** Change today in percent. Positive is green, negative is red. */
  delta: number
  /** How many more people are watching – shown as "+N more are engaged". */
  watchers: number
  /** Word after "are" in the watchers line. Default "engaged". */
  watching?: string
  /** Initials for the avatar stack. Default: derived from the title. */
  avatars?: string[]
}

export type DitherCardsProps = {
  /** The cards. Leave it out to see five invented AI regions. */
  items?: DitherCardItem[]
  /** Glide to the next card by itself. Default true. */
  autoPlay?: boolean
  /** Milliseconds between automatic moves. Default 5200. */
  interval?: number
  /** Called when a card's Expand button is pressed. */
  onExpand?: (item: DitherCardItem, index: number) => void
  /** Accent colour of the art band (any CSS colour). Default indigo #5b5bd6. */
  accent?: string
  /** Art style: dithered dots or ASCII glyphs. Default "dither". */
  art?: "dither" | "ascii"
  /** Freeze autoplay and the art's motion. */
  paused?: boolean
  /** Accessible name of the carousel. */
  label?: string
  className?: string
}

const DEFAULT_ITEMS: DitherCardItem[] = [
  {
    title: "Nordic Inference Hub",
    description:
      "A hydro-powered cluster that serves low-latency traffic across northern Europe, running the Atlas models at a fraction of the energy per token.",
    location: "Reykjavik, Iceland",
    tasks: [
      { label: "Capacity", done: 3, total: 7 },
      { label: "Latency", done: 5, total: 7 },
      { label: "Failover", done: 2, total: 7, tone: "bad" },
      { label: "Cooling", done: 6, total: 7 },
    ],
    delta: 8.3,
    watchers: 25,
  },
  {
    title: "Atlas Training Cluster",
    description: "Where the next Atlas checkpoints are trained. Jobs queue by priority and spill to idle nodes overnight.",
    location: "Montreal, Canada",
    tasks: [
      { label: "Queue", done: 1, total: 7 },
      { label: "Throughput", done: 4, total: 7 },
      { label: "Checkpoints", done: 2, total: 7, tone: "bad" },
      { label: "Storage", done: 7, total: 7 },
    ],
    delta: -5.5,
    watchers: 40,
    watching: "observing",
  },
  {
    title: "Sage Research Lab",
    description: "Evaluation and red-team runs for Sage releases, with every transcript stored for later review and replay.",
    location: "Zurich, Switzerland",
    tasks: [
      { label: "Evals", done: 6, total: 7 },
      { label: "Red team", done: 3, total: 7, tone: "warn" },
      { label: "Review", done: 5, total: 7 },
      { label: "Replay", done: 7, total: 7 },
    ],
    delta: 2.1,
    watchers: 12,
  },
  {
    title: "Orbit Edge Region",
    description: "Small models close to the user. Orbit Mini answers from here in under 80 milliseconds across South-East Asia.",
    location: "Singapore",
    tasks: [
      { label: "Routing", done: 7, total: 7 },
      { label: "Cache", done: 4, total: 7 },
      { label: "Warm pools", done: 2, total: 7, tone: "bad" },
      { label: "Health", done: 6, total: 7 },
    ],
    delta: 11.9,
    watchers: 31,
    watching: "observing",
  },
  {
    title: "Quill Batch Region",
    description: "Overnight document jobs for Quill: long summaries, translations and bulk extraction at the lowest cost per page.",
    location: "Sao Paulo, Brazil",
    tasks: [
      { label: "Batches", done: 5, total: 7 },
      { label: "Retries", done: 3, total: 7, tone: "warn" },
      { label: "Cost", done: 6, total: 7 },
      { label: "Delivery", done: 4, total: 7 },
    ],
    delta: -1.8,
    watchers: 9,
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dc {
  --dc-ink: #000;
  --dc-card: #fff;
  --dc-accent: #5b5bd6;
  --dc-art: var(--dc-accent);
  --dc-t1: color-mix(in oklab, var(--dc-ink) 88%, transparent);
  --dc-t2: color-mix(in oklab, var(--dc-ink) 61%, transparent);
  --dc-t3: color-mix(in oklab, var(--dc-ink) 45%, transparent);
  --dc-t4: color-mix(in oklab, var(--dc-ink) 27%, transparent);
  --dc-fill: color-mix(in oklab, var(--dc-ink) 4%, transparent);
  --dc-off: color-mix(in oklab, var(--dc-ink) 9%, transparent);
  --dc-hair: color-mix(in oklab, var(--dc-ink) 8%, transparent);
  --dc-ok: #2fa463; --dc-warn: #d79a14; --dc-bad: #e5484d;
  --dc-btn: #0b0b0c; --dc-btn-ink: #fff;
  --dc-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 10px 30px -18px rgb(40 40 90 / .22);
  --dc-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --dc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  container-type: inline-size;
  width: 100%;
  color: var(--dc-t2);
  font-family: var(--dc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 12px;
  line-height: 18px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .dc {
  --dc-ink: #fff;
  --dc-card: #1c1c1f;
  --dc-art: color-mix(in oklab, var(--dc-accent) 58%, #fff);
  --dc-t1: color-mix(in oklab, var(--dc-ink) 90%, transparent);
  --dc-t2: color-mix(in oklab, var(--dc-ink) 62%, transparent);
  --dc-t3: color-mix(in oklab, var(--dc-ink) 46%, transparent);
  --dc-t4: color-mix(in oklab, var(--dc-ink) 28%, transparent);
  --dc-fill: color-mix(in oklab, var(--dc-ink) 6%, transparent);
  --dc-off: color-mix(in oklab, var(--dc-ink) 12%, transparent);
  --dc-hair: color-mix(in oklab, var(--dc-ink) 10%, transparent);
  --dc-ok: #4cc38a; --dc-warn: #f0b429; --dc-bad: #ff7a7e;
  --dc-btn: #f4f4f5; --dc-btn-ink: #0b0b0c;
  --dc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 10px 30px -18px rgb(0 0 0 / .7);
}
.dc *, .dc *::before, .dc *::after { box-sizing: border-box }
.dc :where(button) { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.dc :focus-visible { outline: 2px solid color-mix(in oklab, var(--dc-accent) 65%, transparent); outline-offset: 2px }

.dc-scroller { position: relative; display: flex; gap: 14px; padding: 6px 20px 14px; overflow-x: auto; overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory; scroll-padding-inline: 20px; scrollbar-width: none; cursor: grab; touch-action: pan-x pan-y;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent) }
.dc-scroller::-webkit-scrollbar { display: none }
.dc-scroller[data-drag] { scroll-snap-type: none; cursor: grabbing; user-select: none }
.dc-scroller:focus-visible { outline-offset: -2px; border-radius: 14px }

.dc-card { position: relative; flex: 0 0 min(520px, calc(100cqw - 56px)); min-height: 306px; display: flex; flex-direction: column; padding: 18px 20px 18px;
  scroll-snap-align: start; overflow: hidden; border-radius: 12px; background: var(--dc-card); box-shadow: var(--dc-shadow); container-type: inline-size }
.dc-art { position: absolute; top: 0; right: 0; width: 64%; height: 54%; display: block; pointer-events: none; color: var(--dc-art) }

.dc-top { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px }
.dc-tasks { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none }
.dc-task { display: grid; grid-template-columns: max-content 26px max-content; justify-content: start; align-items: center; gap: 9px; font-size: 10.5px; line-height: 14px }
.dc-segs { display: flex; gap: 2px }
.dc-seg { position: relative; width: 5px; height: 13px; border-radius: 2px; background: var(--dc-off); overflow: hidden }
.dc-seg[data-on]::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--dc-tone, var(--dc-ok)); transform: scaleY(0); transform-origin: 50% 100%;
  transition: transform .5s var(--dc-ease) calc(var(--i) * 70ms + var(--r) * 110ms + 160ms) }
.dc-card[data-in] .dc-seg[data-on]::after { transform: scaleY(1) }
.dc-count { color: var(--dc-t4); font-variant-numeric: tabular-nums }
.dc-label { color: var(--dc-t3); white-space: nowrap }
.dc-label::before { content: "•"; margin-right: 5px; color: var(--dc-t4) }

.dc-copy { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px; font-size: 10.5px; font-weight: 500; color: var(--dc-t2);
  border-radius: 7px; background: var(--dc-card); box-shadow: 0 0 0 1px var(--dc-hair), 0 1px 1px rgb(0 0 0 / .04);
  transition: color .2s, background-color .2s, transform .2s var(--dc-ease) }
.dc-copy:hover { color: var(--dc-t1) }
.dc-copy:active { transform: scale(.97) }
.dc-copy[data-done] { color: var(--dc-ok) }
.dc-copy svg { width: 12px; height: 12px; flex: none }

.dc-row { position: relative; display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 6px 14px; margin-top: auto; padding-top: 22px }
.dc-title { margin: 0; font: 400 25px/1.08 var(--dc-serif); letter-spacing: -.01em; color: var(--dc-t1); text-wrap: balance }
.dc-today { display: inline-flex; align-items: center; gap: 8px; font-size: 10.5px; color: var(--dc-t3) }
.dc-delta { display: inline-flex; align-items: center; gap: 2px; height: 20px; padding: 0 7px 0 5px; border-radius: 6px; font-size: 10.5px; font-weight: 500; font-variant-numeric: tabular-nums;
  color: var(--dc-tone); background: color-mix(in oklab, var(--dc-tone) 13%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--dc-tone) 22%, transparent) }
.dc-delta svg { width: 12px; height: 12px }
.dc-desc { margin: 8px 0 0; max-width: 46ch; font-size: 11.5px; line-height: 17px; color: var(--dc-t3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden }

.dc-foot { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 14px }
.dc-meta { display: grid; gap: 8px; min-width: 0 }
.dc-loc { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--dc-t3) }
.dc-loc svg { width: 12px; height: 12px; flex: none; color: var(--dc-t4) }
.dc-who { display: flex; align-items: center; gap: 8px; font-size: 10.5px; color: var(--dc-t4); min-width: 0 }
.dc-stack { display: flex; flex: none }
.dc-av { width: 20px; height: 20px; margin-left: -6px; display: grid; place-items: center; border-radius: 50%; font-size: 9px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, hsl(var(--h) 72% 70%), hsl(calc(var(--h) + 42) 62% 52%)); box-shadow: 0 0 0 2px var(--dc-card) }
.dc-av:first-child { margin-left: 0 }
.dc-expand { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border-radius: 8px; font-size: 11px; font-weight: 500;
  color: var(--dc-btn-ink); background: var(--dc-btn); box-shadow: 0 1px 2px rgb(0 0 0 / .2); transition: transform .2s var(--dc-ease), opacity .2s }
.dc-expand:hover { opacity: .86 }
.dc-expand:active { transform: scale(.97) }
.dc-expand svg { width: 11px; height: 11px }

.dc-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px }
.dc-dots { display: flex; align-items: center; gap: 2px }
.dc-dot { display: grid; place-items: center; height: 20px; padding: 0 3px }
.dc-dot i { display: block; width: 6px; height: 6px; border-radius: 3px; background: var(--dc-t4); transition: width .35s var(--dc-ease), background-color .25s }
.dc-dot[aria-current="true"] i { width: 18px; background: var(--dc-t1) }
.dc-nav { display: flex; gap: 6px }
.dc-nav button { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: var(--dc-t2); box-shadow: 0 0 0 1px var(--dc-hair); transition: color .2s, opacity .2s, background-color .2s }
.dc-nav button:hover:not([aria-disabled="true"]) { color: var(--dc-t1); background: var(--dc-fill) }
.dc-nav button[aria-disabled="true"] { opacity: .35; cursor: default }
.dc-nav svg { width: 14px; height: 14px }

/* Narrow cards: smaller serif, the Today row drops under the title. */
@container (max-width: 400px) {
  .dc-title { font-size: 21px }
  .dc-row { padding-top: 18px }
  .dc-card { padding: 16px 16px 16px }
  .dc-art { width: 50%; height: 50% }
}
@media (prefers-reduced-motion: reduce) {
  .dc *, .dc *::before, .dc *::after { transition: none !important; animation: none !important }
  .dc-seg[data-on]::after { transform: scaleY(1) !important }
}
`

/* -------------------------------------------------------------------------- */
/*                   Dither / ASCII art band (own noise + Bayer)              */
/* -------------------------------------------------------------------------- */

const BAYER8 = (() => {
  const a = new Float32Array(64)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let v = 0
      for (let i = 0; i < 3; i++) v = (v << 2) | ((((x >> i) & 1) ^ ((y >> i) & 1)) << 1) | ((y >> i) & 1)
      a[y * 8 + x] = (v + 0.5) / 64
    }
  }
  return a
})()

function hash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, octaves: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(x, y)
    norm += amp
    const nx = x * 1.6 - y * 1.2 + 11.3
    y = x * 1.2 + y * 1.6 + 3.7
    x = nx
    amp *= 0.5
  }
  return sum / norm
}
const smooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v
  return c * c * (3 - 2 * c)
}

const RAMP = ".:-=+*#%@"

/**
 * One frame of the art: a diagonal band of value noise running into the top-right corner, thinned out
 * toward the left and the bottom so it dissolves into the card. `seed` shifts the pattern per card.
 */
function paintArt(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, t: number, seed: number, color: string, mode: "dither" | "ascii") {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const ascii = mode === "ascii"
  const cw = ascii ? 6 : 3
  const ch = ascii ? 9 : 3
  const cols = Math.ceil(w / cw)
  const rows = Math.ceil(h / ch)
  const soft = new Path2D()
  const deep = new Path2D()
  ctx.fillStyle = color
  if (ascii) {
    ctx.font = `500 ${ch + 0.5}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`
    ctx.textBaseline = "top"
  }
  const sx = seed * 7.31
  for (let gy = 0; gy < rows; gy++) {
    const v = (gy + 0.5) / rows
    const fadeY = 1 - smooth((v - 0.5) / 0.5)
    if (fadeY <= 0.01) break
    for (let gx = 0; gx < cols; gx++) {
      const u = (gx + 0.5) / cols
      const fadeX = smooth((u - 0.05) / 0.55)
      if (fadeX <= 0.01) continue
      // Distance to a diagonal centre line, wobbled by slow noise so the band flows.
      const wob = (fbm(u * 2.4 + sx + t * 0.05, v * 2.4 - t * 0.04, 2) - 0.5) * 0.55
      const dist = (u - 0.62) * 0.85 - v * 0.45 + wob
      const band = Math.exp(-(dist * dist) / (2 * 0.17 * 0.17))
      const tex = fbm(u * 7 + sx - t * 0.07, v * 4.5 + t * 0.05 + 2.1, 3)
      const val = band * (0.2 + 1.5 * tex) * fadeX * fadeY * 1.15
      if (val <= 0.02) continue
      const th = BAYER8[(gy & 7) * 8 + (gx & 7)]
      if (ascii) {
        const idx = Math.min(RAMP.length - 1, Math.floor((val + (th - 0.5) * 0.25) * RAMP.length))
        if (idx < 1) continue
        ctx.globalAlpha = 0.45 + 0.55 * (idx / (RAMP.length - 1))
        ctx.fillText(RAMP[idx], gx * cw, gy * ch)
      } else if (val > th) {
        ;(val > 0.9 ? deep : soft).rect(gx * cw, gy * ch, cw - 1, ch - 1)
      }
    }
  }
  if (!ascii) {
    ctx.globalAlpha = 0.72
    ctx.fill(soft)
    ctx.globalAlpha = 1
    ctx.fill(deep)
  }
  ctx.globalAlpha = 1
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

const TONE_VAR: Record<DitherCardTone, string> = { ok: "var(--dc-ok)", warn: "var(--dc-warn)", bad: "var(--dc-bad)" }

function hue(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}
function initialsOf(title: string) {
  const w = title.split(/\s+/).filter(Boolean)
  return [w[0]?.[0], w[1]?.[0], w[2]?.[0] ?? w[0]?.[1]].map((c) => (c ?? "A").toUpperCase())
}
const formatDelta = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}%`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * DitherCards – a row of wide editorial cards that glides sideways. Each card has task bars,
 * a dithered art band, a serif title, a live delta and an Expand action. Scroll, drag, press ← / →,
 * use the arrows, or let it advance by itself (it waits while you hover or focus it).
 *
 *   <DitherCards onExpand={(item) => open(item)} />
 */
export function DitherCards({
  items = DEFAULT_ITEMS,
  autoPlay = true,
  interval = 5200,
  onExpand,
  accent,
  art = "dither",
  paused,
  label = "Regions",
  className,
}: DitherCardsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const n = items.length

  const [active, setActive] = React.useState(0)
  const [hover, setHover] = React.useState(false)
  const [focusIn, setFocusIn] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [inView, setInView] = React.useState(true)
  const [copied, setCopied] = React.useState(-1)

  const live = React.useRef({ reduced, paused: !!paused, art })
  const artCtl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { reduced, paused: !!paused, art }
    artCtl.current?.update()
  }, [reduced, paused, art, accent])

  /** Scroll offsets that put each card at the start edge (the last ones clamp to the maximum scroll). */
  const targets = React.useCallback(() => {
    const sc = scrollerRef.current
    if (!sc) return []
    const pad = parseFloat(getComputedStyle(sc).scrollPaddingLeft) || 0
    const max = sc.scrollWidth - sc.clientWidth
    return Array.from(sc.querySelectorAll<HTMLElement>(".dc-card")).map((c) => Math.max(0, Math.min(c.offsetLeft - pad, max)))
  }, [])

  const goTo = React.useCallback(
    (i: number) => {
      const sc = scrollerRef.current
      const ts = targets()
      if (!sc || !ts.length) return
      const k = Math.max(0, Math.min(ts.length - 1, i))
      setActive(k)
      sc.scrollTo({ left: ts[k], behavior: live.current.reduced ? "auto" : "smooth" })
    },
    [targets],
  )

  // Which card is at the start edge: follow the scroll position (ties go to the later card, so the end of the row counts as the last card).
  const onScroll = React.useCallback(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const ts = targets()
    let best = 0
    let bd = Infinity
    ts.forEach((t, i) => {
      const d = Math.abs(t - sc.scrollLeft)
      if (d <= bd) {
        bd = d
        best = i
      }
    })
    setActive(best)
  }, [targets])

  // Autoplay: one timer per resting state. It waits while hovered, focused, dragged, offscreen or paused.
  React.useEffect(() => {
    if (!autoPlay || reduced || paused || hover || focusIn || dragging || !inView || n < 2) return
    const id = window.setTimeout(() => {
      if (!document.hidden) goTo(active >= n - 1 ? 0 : active + 1)
    }, Math.max(1200, interval))
    return () => window.clearTimeout(id)
  }, [autoPlay, reduced, paused, hover, focusIn, dragging, inView, interval, active, n, goTo])

  // Card entrance (fill the task bars) and offscreen detection.
  React.useEffect(() => {
    const root = rootRef.current
    const sc = scrollerRef.current
    if (!root || !sc) return
    const cards = Array.from(sc.querySelectorAll<HTMLElement>(".dc-card"))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.35) e.target.setAttribute("data-in", "")
          else if (e.intersectionRatio < 0.08) e.target.removeAttribute("data-in")
        }
      },
      { threshold: [0, 0.08, 0.35, 0.6] },
    )
    cards.forEach((c) => io.observe(c))
    const vio = new IntersectionObserver((e) => setInView(e[e.length - 1].isIntersecting))
    vio.observe(root)
    return () => {
      io.disconnect()
      vio.disconnect()
    }
  }, [n])

  // Art loop: one requestAnimationFrame for every visible card's canvas.
  React.useEffect(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const canvases = Array.from(sc.querySelectorAll<HTMLCanvasElement>(".dc-art"))
    const info = new Map<HTMLCanvasElement, { w: number; h: number; vis: boolean; seed: number }>()
    const ctxs = new Map<HTMLCanvasElement, CanvasRenderingContext2D | null>()
    canvases.forEach((c, i) => {
      info.set(c, { w: 0, h: 0, vis: false, seed: i + 1 })
      ctxs.set(c, c.getContext("2d"))
    })
    let dpr = 1
    let raf = 0
    let last = 0
    let lastDraw = 0
    let t = 11
    let pageVisible = true
    let frame = 0
    let color = "#5b5bd6"

    const drawAll = () => {
      if (frame++ % 40 === 0 && canvases[0]) color = getComputedStyle(canvases[0]).color || color
      for (const c of canvases) {
        const s = info.get(c)
        const ctx = ctxs.get(c)
        if (s && ctx && s.vis && s.w && s.h) paintArt(ctx, s.w, s.h, dpr, t, s.seed, color, live.current.art)
      }
    }
    const shouldRun = () => pageVisible && !live.current.paused && !live.current.reduced && !document.hidden && [...info.values()].some((s) => s.vis)
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      t += dt
      if (now - lastDraw >= 50) {
        lastDraw = now
        drawAll()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      if (shouldRun()) {
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
        return
      }
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      drawAll()
    }
    const ro = new ResizeObserver((entries) => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const e of entries) {
        const c = e.target as HTMLCanvasElement
        const s = info.get(c)
        if (!s) continue
        s.w = e.contentRect.width
        s.h = e.contentRect.height
        c.width = Math.max(1, Math.round(s.w * dpr))
        c.height = Math.max(1, Math.round(s.h * dpr))
      }
      update()
    })
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const s = info.get(e.target as HTMLCanvasElement)
        if (s) s.vis = e.isIntersecting
      }
      update()
    })
    canvases.forEach((c) => {
      ro.observe(c)
      io.observe(c)
    })
    const mo = new MutationObserver(update) // dark-mode switches repaint while idle
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const mq = window.matchMedia(REDUCED_QUERY)
    mq.addEventListener("change", update)
    const onVis = () => {
      pageVisible = !document.hidden
      update()
    }
    document.addEventListener("visibilitychange", onVis)
    artCtl.current = { update }
    return () => {
      artCtl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      mq.removeEventListener("change", update)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [n])

  // Mouse drag to scroll (touch scrolls natively).
  const drag = React.useRef({ x: 0, left: 0, moved: false, id: -1 })
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    const sc = scrollerRef.current
    if (!sc) return
    drag.current = { x: e.clientX, left: sc.scrollLeft, moved: false, id: e.pointerId }
    sc.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const sc = scrollerRef.current
    if (!sc || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true
      setDragging(true)
    }
    if (d.moved) sc.scrollLeft = d.left - dx
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    d.id = -1
    scrollerRef.current?.releasePointerCapture(e.pointerId)
    if (d.moved) {
      setDragging(false)
      // Release into the nearest card.
      const sc = scrollerRef.current
      if (sc) {
        const ts = targets()
        let best = 0
        let bd = Infinity
        ts.forEach((t, i) => {
          const dist = Math.abs(t - sc.scrollLeft)
          if (dist < bd) {
            bd = dist
            best = i
          }
        })
        goTo(best)
      }
    }
  }
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation()
      e.preventDefault()
      drag.current.moved = false
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === "ArrowRight") {
      e.preventDefault()
      goTo(active + 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      goTo(active - 1)
    } else if (e.key === "Home") {
      e.preventDefault()
      goTo(0)
    } else if (e.key === "End") {
      e.preventDefault()
      goTo(n - 1)
    }
  }

  const copyTimer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])
  const copy = (i: number, title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    try {
      void navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#${slug}`)?.catch(() => {})
    } catch {
      /* clipboard may be blocked – the confirmation still shows */
    }
    setCopied(i)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(-1), 1600)
  }

  const style = accent ? ({ "--dc-accent": accent } as React.CSSProperties) : undefined

  return (
    <div ref={rootRef} className={className ? `dc ${className}` : "dc"} style={style} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}
      onFocus={() => setFocusIn(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false) }}>
      <style href="pane-dither-cards" precedence="default">
        {CSS}
      </style>
      <div
        ref={scrollerRef}
        className="dc-scroller"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        data-drag={dragging || undefined}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {items.map((item, i) => {
          const delta = item.delta
          const initials = item.avatars ?? initialsOf(item.title)
          return (
            <article key={item.title + i} className="dc-card" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${item.title}`}>
              <canvas className="dc-art" aria-hidden />
              <div className="dc-top">
                <ul className="dc-tasks" aria-label="Progress">
                  {item.tasks.slice(0, 4).map((task, r) => (
                    <li key={task.label} className="dc-task" style={{ "--dc-tone": TONE_VAR[task.tone ?? "ok"], "--r": r } as React.CSSProperties}>
                      <span className="dc-segs" role="img" aria-label={`${task.done} of ${task.total}`}>
                        {Array.from({ length: task.total }, (_, s) => (
                          <span key={s} className="dc-seg" data-on={s < task.done || undefined} style={{ "--i": s } as React.CSSProperties} />
                        ))}
                      </span>
                      <span className="dc-count" aria-hidden>
                        {task.done}/{task.total}
                      </span>
                      <span className="dc-label">{task.label}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="dc-copy" data-done={copied === i || undefined} onClick={() => copy(i, item.title)} aria-live="polite">
                  {copied === i ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied === i ? "Copied" : "Copy link"}
                </button>
              </div>
              <div className="dc-row">
                <h3 className="dc-title">{item.title}</h3>
                <span className="dc-today">
                  Today
                  <span className="dc-delta" style={{ "--dc-tone": delta >= 0 ? "var(--dc-ok)" : "var(--dc-bad)" } as React.CSSProperties}>
                    {delta >= 0 ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
                    {formatDelta(delta)}
                  </span>
                </span>
              </div>
              <p className="dc-desc">{item.description}</p>
              <div className="dc-foot">
                <div className="dc-meta">
                  <span className="dc-loc">
                    <MapPin aria-hidden />
                    {item.location}
                  </span>
                  <span className="dc-who">
                    <span className="dc-stack" aria-hidden>
                      {initials.slice(0, 3).map((c, k) => (
                        <span key={k} className="dc-av" style={{ "--h": hue(item.title + k) } as React.CSSProperties}>
                          {c}
                        </span>
                      ))}
                    </span>
                    +{item.watchers} more are {item.watching ?? "engaged"}
                  </span>
                </div>
                <button type="button" className="dc-expand" onClick={() => onExpand?.(item, i)}>
                  <Maximize2 aria-hidden />
                  Expand
                </button>
              </div>
            </article>
          )
        })}
      </div>
      {n > 1 && (
        <div className="dc-bar">
          <div className="dc-dots">
            {items.map((item, i) => (
              <button key={item.title + i} type="button" className="dc-dot" aria-label={`Show ${item.title}`} aria-current={i === active} onClick={() => goTo(i)}>
                <i />
              </button>
            ))}
          </div>
          <div className="dc-nav">
            <button type="button" aria-label="Previous card" aria-disabled={active <= 0} onClick={() => active > 0 && goTo(active - 1)}>
              <ChevronLeft aria-hidden />
            </button>
            <button type="button" aria-label="Next card" aria-disabled={active >= n - 1} onClick={() => active < n - 1 && goTo(active + 1)}>
              <ChevronRight aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
