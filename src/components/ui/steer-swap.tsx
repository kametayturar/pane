"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SteerSwapRegion = {
  /** Stable id, e.g. "na". */
  id: string
  /** What the agent is working on, e.g. "North America". It is set as the headline when active. */
  name: string
  /** Items finished so far, e.g. 184. */
  done: number
  /** Items in total, e.g. 380. */
  total: number
}

export type SteerSwapProps = {
  /** Who is working. Default "Atlas". */
  agent?: string
  /** Replaces the line above the headline. Default "Atlas is reconciling invoices for". */
  lead?: string
  /** Plural noun for the thing counted. Default "invoices". */
  unit?: string
  /** Label above the rows. Default "Switch to". */
  switchLabel?: string
  /** The options. The first one is the headline, the others are the rows. Without it the card plays its own EMEA / North America / APAC story. */
  regions?: SteerSwapRegion[]
  /** Controlled: the id of the headline region. Update it from `onSwitch`. */
  active?: string
  /** Starting headline when uncontrolled. Default: the first region. */
  defaultActive?: string
  /** Called when the person taps a row: the id to move to and the id it replaces. */
  onSwitch?: (id: string, from: string) => void
  /** Play the built-in story until the first interaction. Default: on when no `regions` or `active` is passed. */
  autoPlay?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.swp {
  --swp-ink: #000;
  --swp-surface: #fff;
  --swp-accent: #0060e2;
  --swp-t1: color-mix(in oklab, var(--swp-ink) 88%, transparent);
  --swp-t2: color-mix(in oklab, var(--swp-ink) 61%, transparent);
  --swp-t3: color-mix(in oklab, var(--swp-ink) 45%, transparent);
  --swp-t4: color-mix(in oklab, var(--swp-ink) 27%, transparent);
  --swp-fill: color-mix(in oklab, var(--swp-ink) 6%, transparent);
  --swp-line: color-mix(in oklab, var(--swp-ink) 6%, transparent);
  --swp-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 24px 48px -24px rgb(0 0 0 / .14);
  --swp-ease: cubic-bezier(.22, 1, .36, 1);
  --swp-hw: 600; --swp-hls: -.03em; --swp-radius: 28px; --swp-hit-radius: 16px;
  position: relative; container-type: inline-size; width: 100%; max-width: 448px;
  font: 13px/20px var(--swp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--swp-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .swp {
  --swp-ink: #fff;
  --swp-surface: #1c1c1e;
  --swp-accent: #4d8dff;
  --swp-t1: color-mix(in oklab, var(--swp-ink) 90%, transparent);
  --swp-t2: color-mix(in oklab, var(--swp-ink) 62%, transparent);
  --swp-t3: color-mix(in oklab, var(--swp-ink) 46%, transparent);
  --swp-t4: color-mix(in oklab, var(--swp-ink) 28%, transparent);
  --swp-fill: color-mix(in oklab, var(--swp-ink) 8%, transparent);
  --swp-line: color-mix(in oklab, var(--swp-ink) 9%, transparent);
  --swp-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 24px 48px -24px rgb(0 0 0 / .5);
}
html[data-style="mono"] .swp {
  --swp-ink: #000; --swp-surface: #fff; --swp-accent: #111; --swp-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --swp-ease: cubic-bezier(.2, .9, .1, 1); --swp-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --swp-hw: 500; --swp-hls: -.04em; --swp-radius: 8px; --swp-hit-radius: 4px;
}
html[data-style="mono"].dark .swp { --swp-ink: #fff; --swp-surface: #0a0a0a; --swp-accent: #f2f2f2; --swp-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .swp {
  --swp-ink: var(--pane-ink); --swp-surface: var(--pane-solid); --swp-accent: var(--pane-accent); --swp-shadow: var(--pane-shadow);
  --swp-ease: var(--pane-ease); --swp-font: var(--pane-font);
  --swp-t1: var(--pane-t1); --swp-t2: var(--pane-t2); --swp-t3: var(--pane-t3); --swp-t4: var(--pane-t4);
}
html[data-style="glass"] .swp-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .swp-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .swp-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .swp-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .swp-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .swp-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}
.swp *, .swp *::before, .swp *::after { box-sizing: border-box }
:where(.swp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.swp) p { margin: 0 }
.swp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.swp-card { background: var(--swp-surface); border-radius: var(--swp-radius); box-shadow: var(--swp-shadow); padding: 24px }

/* Lead */
.swp-lead { display: flex; align-items: flex-start; gap: 8px; min-height: 20px; font-size: 13px; font-weight: 500; color: var(--swp-t2) }
.swp-lead i { flex: none; margin-top: 6.5px; width: 7px; height: 7px; border-radius: 50%; background: var(--swp-accent); animation: swp-pulse 1.6s ease-in-out infinite }

/* Stage: one fixed-height box, so nothing moves while the words trade places. */
.swp-stage { --swp-hero: 56px; position: relative; height: calc(156px + 52px * var(--swp-rows) - 4px); margin-top: 10px }
.swp-w {
  position: absolute; left: 0; top: 0; font-size: var(--swp-hero); font-weight: var(--swp-hw); line-height: 60px; letter-spacing: var(--swp-hls);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: var(--swp-maxw, none); transform-origin: 0 0; pointer-events: none; color: var(--swp-t2);
}
.swp-w[data-hero] { color: var(--swp-t1) }
.swp-run { position: absolute; top: 26px; left: 0; width: 8px; height: 8px; pointer-events: none }
.swp-run i { display: block; width: 100%; height: 100%; border-radius: 50%; background: var(--swp-accent); animation: swp-pulse 1.6s ease-in-out infinite }
.swp-prog { position: absolute; left: 0; top: 66px; font-size: 15px; line-height: 22px; color: var(--swp-t2); font-variant-numeric: tabular-nums }
.swp-roll { display: grid }
.swp-roll > span { grid-area: 1 / 1; white-space: nowrap; opacity: 0 }
.swp-note {
  position: absolute; left: 0; right: 0; top: 94px; font-size: 13px; line-height: 18px; color: var(--swp-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: 0; filter: blur(4px); transform: translateY(4px); pointer-events: none;
  transition: opacity .4s var(--swp-ease), filter .4s var(--swp-ease), transform .4s var(--swp-ease);
}
.swp-note[data-on] { opacity: 1; filter: none; transform: none }
.swp-lbl { position: absolute; left: 0; top: 132px; font-size: 13px; line-height: 18px; color: var(--swp-t3) }
.swp-mt {
  position: absolute; right: 0; top: 0; justify-items: end; font-size: 13px; line-height: 18px; color: var(--swp-t3); font-variant-numeric: tabular-nums;
  transition: color .16s var(--swp-ease);
}
.swp-mt[data-hot] { color: var(--swp-accent) }
.swp-hit {
  position: absolute; left: -12px; right: -12px; height: 52px; border-radius: var(--swp-hit-radius); background: transparent;
  transition: background-color .16s var(--swp-ease), transform .16s var(--swp-ease);
}
.swp-hit:hover { background: color-mix(in oklab, var(--swp-ink) 3.5%, transparent) }
.swp-hit:active, .swp-hit[data-press] { background: color-mix(in oklab, var(--swp-ink) 6.5%, transparent); transform: scale(.985) }
.swp-hit:focus-visible { outline: 2px solid var(--swp-accent); outline-offset: 0 }

/* Narrow cards: the note keeps to one line (the status line still says "Resume any time"). */
@container (max-width: 420px) {
  .swp-res { display: none }
}

@keyframes swp-pulse { 50% { opacity: .3 } }

@media (prefers-reduced-motion: reduce) {
  .swp *, .swp *::before, .swp *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22, 1, .36, 1)"
const SPRING = "cubic-bezier(.2, 1.1, .3, 1)"
const ROW0 = 156
const ROW_H = 52
const LINE = 60
const SMALL = 15
const HERO_MAX = 56
const HERO_MIN = 24
const DOT_GAP = 14
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)"

const fmt = (n: number) => n.toLocaleString("en-US")
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia(REDUCE_QUERY).matches

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

type Pose = { y: number; s: number }
const pose = (i: number, s: number): Pose => (i === 0 ? { y: 0, s: 1 } : { y: ROW0 + (i - 1) * ROW_H + (ROW_H - LINE * s) / 2, s })
const tf = ({ y, s, x = 0 }: Pose & { x?: number }) => `translate(${x}px, ${y}px) scale(${s})`

const swapAt = (order: string[], k: number) => {
  const next = order.slice()
  ;[next[0], next[k]] = [next[k], next[0]]
  return next
}
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i])
/** Brings `first` to the front by swapping it with whoever is there (not a rotation). */
const promote = (order: string[], first: string | undefined) => {
  const k = first === undefined ? -1 : order.indexOf(first)
  return k > 0 ? swapAt(order, k) : order
}

/* Built-in story */
const DEMO: SteerSwapRegion[] = [
  { id: "emea", name: "EMEA", done: 184, total: 380 },
  { id: "na", name: "North America", done: 0, total: 612 },
  { id: "apac", name: "APAC", done: 0, total: 204 },
]
const DEMO_IDS = DEMO.map((r) => r.id)
const DEMO_BASE: Record<string, number> = { emea: 184, na: 0, apac: 0 }
const DEMO_STILL: Record<string, number> = { emea: 184, na: 24, apac: 0 }
const DEMO_TOTAL: Record<string, number> = { emea: 380, na: 612, apac: 204 }

/* -------------------------------------------------------------------------- */
/*                                    Roll                                    */
/* -------------------------------------------------------------------------- */

/** Text that changes in place: the old line blurs out while the new one blurs in. Both live in one grid cell. */
const Roll = React.memo(function Roll({
  text,
  group,
  epoch,
  delay,
  className,
  style,
  ...rest
}: {
  text: string
  /** When this changes the new text waits `delay` ms (the words are still travelling). */
  group: string
  /** When this changes the text is swapped without any motion (a reset). */
  epoch: number
  delay: number
  className?: string
  style?: React.CSSProperties
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "style" | "className">) {
  const a = React.useRef<HTMLSpanElement>(null)
  const b = React.useRef<HTMLSpanElement>(null)
  const st = React.useRef({ i: 0, text: "", group, epoch, ready: false, timer: 0 })

  React.useLayoutEffect(() => {
    const s = st.current
    const els = [a.current, b.current]
    if (!els[0] || !els[1]) return
    const cur = els[s.i] as HTMLSpanElement
    const nxt = els[1 - s.i] as HTMLSpanElement
    const instant = !s.ready || epoch !== s.epoch || prefersReduced()
    const moved = group !== s.group
    s.group = group
    s.epoch = epoch
    if (instant) {
      window.clearTimeout(s.timer)
      for (const e of els) {
        e?.getAnimations().forEach((x) => x.cancel())
        if (e) e.style.opacity = "0"
      }
      cur.textContent = text
      cur.style.opacity = "1"
      s.text = text
      s.ready = true
      return
    }
    if (s.text === text) return
    window.clearTimeout(s.timer)
    s.text = text
    nxt.getAnimations().forEach((x) => x.cancel())
    nxt.textContent = text
    nxt.style.opacity = "1"
    // The final styles are set on the elements at once; the animations only decorate the way there.
    cur.style.opacity = "0"
    const wait = moved ? delay : 0
    nxt.animate(
      [
        { opacity: 0, filter: "blur(4px)", transform: "translateY(5px)" },
        { opacity: 1, filter: "blur(0)", transform: "none" },
      ],
      { duration: 200, delay: wait, easing: EASE, fill: "backwards" },
    )
    cur.animate(
      [
        { opacity: 1, filter: "blur(0)", transform: "none" },
        { opacity: 0, filter: "blur(4px)", transform: "translateY(-5px)" },
      ],
      { duration: 200, easing: EASE },
    )
    // Safety net for throttled or frozen timelines: drop the animations so the final text shows.
    s.timer = window.setTimeout(() => els.forEach((e) => e?.getAnimations().forEach((x) => x.cancel())), wait + 400)
    s.i = 1 - s.i
  }, [text, group, epoch, delay])
  React.useEffect(() => {
    const s = st.current
    return () => window.clearTimeout(s.timer)
  }, [])

  return (
    <span className={cn("swp-roll", className)} style={style} {...rest}>
      <span ref={a} />
      <span ref={b} />
    </span>
  )
})

/* -------------------------------------------------------------------------- */
/*                                 SteerSwap                                  */
/* -------------------------------------------------------------------------- */

export function SteerSwap(props: SteerSwapProps) {
  const {
    agent = "Atlas",
    unit = "invoices",
    switchLabel = "Switch to",
    lead = `${agent} is reconciling ${unit} for`,
    regions: regionsProp,
    active: activeProp,
    defaultActive,
    onSwitch,
    autoPlay,
    className,
  } = props

  const reduce = React.useSyncExternalStore(subscribeReduced, prefersReduced, () => false)
  const demo = regionsProp === undefined
  const looping = demo && activeProp === undefined && (autoPlay ?? true)

  /* ---- data ---- */
  const [sim, setSim] = React.useState<Record<string, number>>(() => (looping && prefersReduced() ? DEMO_STILL : DEMO_BASE))
  const regions = React.useMemo<SteerSwapRegion[]>(() => regionsProp ?? DEMO.map((r) => ({ ...r, done: sim[r.id] ?? r.done })), [regionsProp, sim])
  const byId = React.useMemo(() => Object.fromEntries(regions.map((r) => [r.id, r])) as Record<string, SteerSwapRegion>, [regions])
  const ids = React.useMemo(() => regions.map((r) => r.id), [regions])

  const [order, setOrder] = React.useState<string[]>(() => {
    const base = (regionsProp ?? DEMO).map((r) => r.id)
    if (looping && prefersReduced()) return promote(base, "na")
    return promote(base, activeProp ?? defaultActive)
  })
  // Keep `order` a permutation of the region ids, and follow `active` when it is controlled.
  let view = order
  if (!(order.length === ids.length && ids.every((id) => order.includes(id)))) view = promote(ids, activeProp ?? defaultActive)
  else if (activeProp !== undefined) view = promote(order, activeProp)
  if (view !== order) setOrder(view)

  const heroId = view[0]
  const hero = byId[heroId]
  const rows = Math.max(0, view.length - 1)

  /* ---- fit the headline to the card ---- */
  const [fit, setFit] = React.useState<{ hero: number; avail: number; ratios: Record<string, number> }>({ hero: HERO_MAX, avail: 0, ratios: {} })
  const stageRef = React.useRef<HTMLDivElement>(null)
  const wordRefs = React.useRef<Record<string, HTMLSpanElement | null>>({})
  const nameKey = regions.map((r) => r.id + r.name).join("|")

  React.useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const avail = stage.clientWidth - (DOT_GAP + 10)
      const ratios: Record<string, number> = {}
      let widest = 0
      for (const [id, el] of Object.entries(wordRefs.current)) {
        if (!el) continue
        const px = parseFloat(getComputedStyle(el).fontSize) || HERO_MAX
        ratios[id] = el.scrollWidth / px
        widest = Math.max(widest, ratios[id])
      }
      const next = widest > 0 ? Math.max(HERO_MIN, Math.min(HERO_MAX, Math.floor((avail / widest) * 2) / 2)) : HERO_MAX
      setFit((f) => {
        const close =
          Math.abs(f.hero - next) < 0.5 && Math.abs(f.avail - avail) < 0.5 && Object.keys(ratios).every((id) => Math.abs((f.ratios[id] ?? 0) - ratios[id]) < 0.03)
        return close ? f : { hero: Math.abs(f.hero - next) < 0.5 ? f.hero : next, avail, ratios }
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    void document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [nameKey])

  const S = SMALL / fit.hero
  const dotLeft = Math.min((fit.ratios[heroId] ?? 6) * fit.hero, fit.avail || Infinity) + DOT_GAP

  /* ---- state shown ---- */
  const [epoch, setEpoch] = React.useState(0)
  const [noteId, setNoteId] = React.useState<string | null>(() => (looping && prefersReduced() ? "emea" : null))
  const [noteOn, setNoteOn] = React.useState(() => looping && prefersReduced())
  const [live, setLive] = React.useState(() => (looping && prefersReduced() ? "Atlas switched to North America. EMEA paused at 184 of 380. Resume any time." : ""))
  const [hot, setHot] = React.useState<number | null>(null)
  const [press, setPress] = React.useState<number | null>(null)
  const [hold, setHold] = React.useState(looping && !prefersReduced())
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const runRef = React.useRef<HTMLSpanElement>(null)
  const orderRef = React.useRef(view)
  const prevOrder = React.useRef<string[] | null>(null)
  const prevHero = React.useRef<string | null>(null)
  const poses = React.useRef<Record<string, Pose>>({})
  const skip = React.useRef(false)
  const busy = React.useRef(false)
  const timers = React.useRef<number[]>([])
  const dotTimers = React.useRef<number[]>([])
  const wordTimers = React.useRef<Record<string, number>>({})
  const simRef = React.useRef(sim)
  const dataRef = React.useRef(byId)
  const switchRef = React.useRef<(k: number) => void>(() => {})
  const resetRef = React.useRef<() => void>(() => {})

  // The running dot sits beside whichever word is the headline: it blinks out, moves and comes back.
  React.useLayoutEffect(() => {
    const el = runRef.current
    if (!el) return
    const changed = prevHero.current !== null && prevHero.current !== heroId
    prevHero.current = heroId
    dotTimers.current.forEach((id) => window.clearTimeout(id))
    dotTimers.current = []
    if (!changed || reduce || skip.current) {
      el.getAnimations().forEach((a) => a.cancel())
      el.style.left = `${dotLeft}px`
      return
    }
    el.getAnimations().forEach((a) => a.cancel())
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" })
    // Timers rather than onfinish, so the dot ends up in place even if animation frames never run.
    dotTimers.current.push(
      window.setTimeout(() => {
        el.getAnimations().forEach((a) => a.cancel())
        el.style.left = `${dotLeft}px`
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 160, easing: EASE, fill: "backwards" })
      }, 120),
      window.setTimeout(() => el.getAnimations().forEach((a) => a.cancel()), 700),
    )
  }, [heroId, dotLeft, reduce])
  React.useEffect(() => {
    const t = dotTimers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  // The decisive moment: the two words that traded places travel to each other's pose.
  React.useLayoutEffect(() => {
    dataRef.current = byId
    orderRef.current = view
    simRef.current = sim
    const prev = prevOrder.current
    prevOrder.current = view
    const skipped = skip.current
    skip.current = false
    const changed = prev !== null && prev.some((id, i) => id !== view[i])
    const moved = changed && !skipped && !reduce ? view.filter((id, i) => prev[i] !== id) : []
    for (const id of moved) {
      const el = wordRefs.current[id]
      if (!el) continue
      const i = view.indexOf(id)
      const to = pose(i, S)
      const from = poses.current[id] ?? to
      const rising = i === 0
      const mid = { y: (from.y + to.y) / 2, s: (from.s + to.s) / 2, x: rising ? 12 : -12 }
      el.getAnimations().forEach((a) => a.cancel())
      el.animate(
        [
          { transform: tf(from), color: rising ? "var(--swp-t2)" : "var(--swp-t1)", opacity: 1, filter: "blur(0)" },
          { transform: tf(mid), opacity: 0.4, filter: "blur(2px)", offset: 0.5 },
          { transform: tf(to), color: rising ? "var(--swp-t1)" : "var(--swp-t2)", opacity: 1, filter: "blur(0)" },
        ],
        { duration: rising ? 560 : 520, delay: rising ? 0 : 60, easing: rising ? SPRING : EASE, fill: "backwards" },
      )
      // Safety net for a frozen timeline: the element's own transform is already the final pose.
      window.clearTimeout(wordTimers.current[id])
      wordTimers.current[id] = window.setTimeout(() => el.getAnimations().forEach((a) => a.cancel()), 800)
    }
    view.forEach((id, i) => {
      poses.current[id] = pose(i, S)
    })
    if (changed && !skipped && prev) {
      const from = prev[0]
      const r = dataRef.current[view[0]]
      const p = dataRef.current[from]
      if (r && p) {
        setLive(`${agent} switched to ${r.name}. ${p.name} paused at ${fmt(p.done)} of ${fmt(p.total)}. Resume any time.`)
        // The old note fades away at once; the new text is written while it is hidden, then it fades in.
        window.clearTimeout(timers.current[0])
        setNoteOn(false)
        timers.current[0] = window.setTimeout(
          () => {
            setNoteId(from)
            setNoteOn(true)
          },
          reduce ? 0 : 560,
        )
      }
    }
  }, [view, S, reduce, agent, byId, sim])
  React.useEffect(() => {
    const t = timers.current
    const w = wordTimers.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      Object.values(w).forEach((id) => window.clearTimeout(id))
    }
  }, [])

  /* ---- switching ---- */
  const doSwitch = (k: number) => {
    if (k < 1 || k >= view.length) return
    busy.current = true
    window.clearTimeout(timers.current[1])
    timers.current[1] = window.setTimeout(() => (busy.current = false), reduce ? 0 : 560)
    setHot(null)
    setHold(false)
    onSwitch?.(view[k], view[0])
    if (activeProp === undefined) setOrder(swapAt(view, k))
  }
  React.useLayoutEffect(() => {
    switchRef.current = doSwitch
  })

  /* ---- the built-in story ---- */
  React.useEffect(() => {
    resetRef.current = () => {
      const atStart = sameOrder(orderRef.current, DEMO_IDS) && DEMO_IDS.every((id) => simRef.current[id] === DEMO_BASE[id])
      if (!sameOrder(orderRef.current, DEMO_IDS)) skip.current = true
      setOrder((o) => (sameOrder(o, DEMO_IDS) ? o : DEMO_IDS))
      setSim(DEMO_BASE)
      setNoteOn(false)
      setHold(true)
      setPress(null)
      setEpoch((n) => n + 1)
      busy.current = false
      if (!atStart && !prefersReduced()) {
        stageRef.current?.animate(
          [
            { opacity: 0, filter: "blur(4px)", transform: "translateY(4px)" },
            { opacity: 1, filter: "blur(0)", transform: "none" },
          ],
          { duration: 560, easing: EASE },
        )
      }
    }
  }, [])

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = typeof IntersectionObserver === "undefined"
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    if (typeof IntersectionObserver === "undefined") return () => document.removeEventListener("visibilitychange", update)
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  React.useEffect(() => {
    if (!looping || !auto || reduce || !active) return
    let dead = false
    const ts: number[] = []
    const sleep = (ms: number) => new Promise<void>((res) => ts.push(window.setTimeout(res, ms)))
    void (async () => {
      let first = true
      while (!dead) {
        resetRef.current()
        await sleep(first ? 750 : 500)
        first = false
        if (dead) return
        const k = orderRef.current.indexOf("na")
        setPress(k)
        await sleep(220)
        if (dead) return
        setPress(null)
        switchRef.current(k)
        await sleep(5800)
      }
    })()
    return () => {
      dead = true
      ts.forEach((id) => window.clearTimeout(id))
      setPress(null)
    }
  }, [looping, auto, reduce, active])

  // The agent keeps working on the headline region, one batch a second.
  React.useEffect(() => {
    if (!demo || hold || !active || reduce) return
    const id = window.setInterval(() => {
      if (busy.current) return
      const h = orderRef.current[0]
      setSim((s) => (s[h] < DEMO_TOTAL[h] - 8 ? { ...s, [h]: s[h] + 8 } : s))
    }, 1000)
    return () => window.clearInterval(id)
  }, [demo, hold, active, reduce])

  const stop = (e: { nativeEvent: Event }) => {
    if (!looping || !e.nativeEvent.isTrusted) return
    setAuto(false)
    setHold(false)
  }

  /* ---- what is shown ---- */
  const progText = hero ? `${fmt(hero.done)} of ${fmt(hero.total)} ${unit}` : ""
  const note = noteId ? byId[noteId] : undefined
  const metaText = (r: SteerSwapRegion) => (r.done > 0 ? `Paused at ${fmt(r.done)} of ${fmt(r.total)}` : "Switch")

  if (!hero) return null

  return (
    <div
      ref={rootRef}
      className={cn("swp", className)}
      onPointerDownCapture={stop}
      onKeyDownCapture={stop}
      onFocusCapture={stop}
    >
      <style href="steer-swap" precedence="default">
        {CSS}
      </style>
      <p className="swp-sr" role="status" aria-live="polite">
        {live}
      </p>
      <div className="swp-card" role="group" aria-label={`${agent}, ${unit}`}>
        <p className="swp-lead">
          <i aria-hidden />
          {lead}
        </p>
        <p className="swp-sr">{`${hero.name}, ${progText}.`}</p>
        <div ref={stageRef} className="swp-stage" style={{ "--swp-rows": rows, "--swp-hero": `${fit.hero}px`, "--swp-maxw": fit.avail ? `${fit.avail}px` : undefined } as React.CSSProperties}>
          {regions.map((r) => (
            <span
              key={r.id}
              ref={(el) => {
                wordRefs.current[r.id] = el
              }}
              className="swp-w"
              data-hero={r.id === heroId || undefined}
              aria-hidden
              style={{ transform: tf(pose(Math.max(0, view.indexOf(r.id)), S)) }}
            >
              {r.name}
            </span>
          ))}
          <span ref={runRef} className="swp-run" aria-hidden>
            <i />
          </span>
          <p className="swp-prog" aria-hidden>
            <Roll text={progText} group={heroId} epoch={epoch} delay={320} />
          </p>
          <p className="swp-note" data-on={noteOn || undefined} aria-hidden>
            {note && (
              <>
                {`${note.name} kept at ${fmt(note.done)} of ${fmt(note.total)}.`}
                <span className="swp-res"> Resume any time.</span>
              </>
            )}
          </p>
          {rows > 0 && (
            <p className="swp-lbl" aria-hidden>
              {switchLabel}
            </p>
          )}
          {view.slice(1).map((id, j) => {
            const r = byId[id]
            const k = j + 1
            return (
              <React.Fragment key={k}>
                <Roll
                  className="swp-mt"
                  data-hot={hot === k || undefined}
                  aria-hidden
                  text={metaText(r)}
                  group={id}
                  epoch={epoch}
                  delay={300}
                  style={{ transform: `translateY(${ROW0 + j * ROW_H + 17}px)` }}
                />
                <button
                  type="button"
                  className="swp-hit"
                  data-press={press === k || undefined}
                  style={{ top: ROW0 + j * ROW_H }}
                  aria-label={`${r.done > 0 ? "Resume" : `Switch ${agent} to`} ${r.name}. ${hero.name} will pause at ${fmt(hero.done)} of ${fmt(hero.total)}.`}
                  onClick={() => doSwitch(k)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHot(k)}
                  onPointerLeave={() => setHot((h) => (h === k ? null : h))}
                  onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHot(k)}
                  onBlur={() => setHot((h) => (h === k ? null : h))}
                />
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
