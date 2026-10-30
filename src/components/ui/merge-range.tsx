"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MergeRangeAgent = {
  /** Who is reading, e.g. "Kestrel". Shown under its price and in the summary line. */
  name: string
  /** The finding. Leave it out (or pass null) while the agent is still reading; the column then shows a breathing dash. */
  price?: number | null
  /** How long it took, shown under the name once it reports, e.g. "34s". Defaults to "done". */
  time?: string
  /** Built-in simulation only: when this agent reports, in ms after the run starts. Defaults to 2000, 0 and 1000 for the three columns. */
  delay?: number
}

export type MergeRangeResult = {
  /** The lowest price, the left end of the range. */
  low: number
  /** The highest price, the right end of the range. */
  high: number
  lowAgent: string
  highAgent: string
}

export type MergeRangeProps = {
  /**
   * The three sub-agents, one column each (the first three are used; with fewer, the missing columns are called "Agent N" and never report, so the piece waits and never merges). Passing this drives the piece from real data: a price that
   * arrives fills its column, and when all three are in, the two outer prices merge into a range. Without it the built-in
   * simulation plays Kestrel, Brightline and Tandem.
   */
  agents?: MergeRangeAgent[]
  /** Small line above the numbers. Default "What competitors charge". */
  title?: string
  /** What the price is per, used in the summary line. Default "per seat". Pass "" to leave it out. */
  unit?: string
  /** Currency symbol in front of every price. Default "$". */
  currency?: string
  /**
   * Play the built-in loop until the first interaction. Default: on when no `agents` are passed. Turning it on together with your own
   * `agents` plays your names with the demo prices 19, 24 and 31 wherever an agent has no `price`.
   */
  autoPlay?: boolean
  /** Label of the button under the range. Default "Run again". */
  restartLabel?: string
  /** Called once when the three findings have become one range. */
  onMerge?: (result: MergeRangeResult) => void
  /** Called on "Run again". With your own `agents`, reset their prices from here; the button only shows when this is set. */
  onRestart?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mrg {
  --mrg-ink: #000;
  --mrg-surface: #fff;
  --mrg-accent: #0060e2;
  --mrg-t1: color-mix(in oklab, var(--mrg-ink) 88%, transparent);
  --mrg-t2: color-mix(in oklab, var(--mrg-ink) 61%, transparent);
  --mrg-t3: color-mix(in oklab, var(--mrg-ink) 45%, transparent);
  --mrg-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 24px 48px -24px rgb(0 0 0 / .14);
  --mrg-ease: cubic-bezier(.22, 1, .36, 1);
  --mrg-pre: var(--mrg-accent);
  --mrg-hole: color-mix(in oklab, var(--mrg-ink) 18%, transparent);
  --mrg-fw: 600;
  --mrg-ls: -.045em;
  --mrg-fs: 84px; --mrg-ph: 86px; --mrg-d: 48px; --mrg-s: .57;
  position: relative; container-type: inline-size; width: 100%; max-width: 440px;
  /* Three text sizes: 15px copy, the fitted price size (--mrg-fs, with the dash and placeholder at --mrg-d). */
  font-family: var(--mrg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  line-height: 20px; color: var(--mrg-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .mrg {
  --mrg-ink: #fff;
  --mrg-surface: #1c1c1e;
  --mrg-accent: #4d8dff;
  --mrg-t1: color-mix(in oklab, var(--mrg-ink) 90%, transparent);
  --mrg-t2: color-mix(in oklab, var(--mrg-ink) 62%, transparent);
  --mrg-t3: color-mix(in oklab, var(--mrg-ink) 46%, transparent);
  --mrg-hole: color-mix(in oklab, var(--mrg-ink) 20%, transparent);
  --mrg-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 24px 48px -24px rgb(0 0 0 / .5);
}
html[data-style="mono"] .mrg {
  --mrg-ink: #000; --mrg-surface: #fff; --mrg-accent: #111; --mrg-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --mrg-ease: cubic-bezier(.2, .9, .1, 1); --mrg-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --mrg-pre: var(--mrg-t3); --mrg-fw: 500; --mrg-ls: -.02em;
}
html[data-style="mono"].dark .mrg { --mrg-ink: #fff; --mrg-surface: #0a0a0a; --mrg-accent: #f2f2f2; --mrg-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .mrg {
  --mrg-ink: var(--pane-ink); --mrg-surface: var(--pane-solid); --mrg-accent: var(--pane-accent); --mrg-shadow: var(--pane-shadow);
  --mrg-ease: var(--pane-ease); --mrg-font: var(--pane-font);
  --mrg-t1: var(--pane-t1); --mrg-t2: var(--pane-t2); --mrg-t3: var(--pane-t3);
  --mrg-hole: color-mix(in oklab, var(--pane-ink) 30%, transparent);
}
html[data-style="glass"] .mrg-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .mrg-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .mrg-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .mrg-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .mrg-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .mrg-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}
.mrg *, .mrg *::before, .mrg *::after { box-sizing: border-box }
:where(.mrg) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.mrg) p { margin: 0 }
.mrg-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.mrg-card { min-width: 0; padding: 28px 32px 24px; border-radius: 28px; background: var(--mrg-surface); box-shadow: var(--mrg-shadow); text-align: center; font-size: 15px; line-height: 1.3 }
html[data-style="mono"] .mrg-card { border-radius: 8px }
.mrg-card:focus { outline: none }
.mrg-stage { transition: opacity .3s var(--mrg-ease), filter .3s var(--mrg-ease) }
.mrg-card[data-fading] .mrg-stage { opacity: 0; filter: blur(6px) }
.mrg-cap { color: var(--mrg-t2) }

/* Plane: three columns hold the findings; the outer two end up side by side. Positions are written once as custom properties and only CSS moves. */
.mrg-plane { position: relative; height: var(--mrg-ph); margin-top: 30px }
.mrg-ph {
  position: absolute; top: 0; left: calc(100% * (2 * var(--i) + 1) / 6); width: 80px; height: var(--mrg-ph); margin-left: -40px; display: flex; align-items: center; justify-content: center;
  font-size: var(--mrg-d); font-weight: var(--mrg-fw); color: var(--mrg-hole);
  animation: mrg-breathe 1.8s ease-in-out infinite; transition: opacity .3s var(--mrg-ease), filter .3s var(--mrg-ease);
}
.mrg-ph[data-gone] { opacity: 0; filter: blur(6px); animation: none }
.mrg-tk {
  position: absolute; left: 0; top: 0; white-space: nowrap; opacity: 0; will-change: transform;
  font-size: var(--mrg-fs); line-height: var(--mrg-ph); font-weight: var(--mrg-fw); letter-spacing: var(--mrg-ls); font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;
  color: var(--mrg-pre); transform: translateX(var(--h, 0px)) scale(var(--mrg-s));
  transition: transform .7s var(--mrg-ease), color .6s var(--mrg-ease);
}
.mrg-tk[data-on] { opacity: 1 }
.mrg-ti { display: block }
.mrg-tk[data-on] .mrg-ti { animation: mrg-land .48s var(--mrg-ease) backwards }
.mrg-card[data-merged] .mrg-tk[data-role="lo"], .mrg-card[data-merged] .mrg-tk[data-role="hi"], .mrg-card[data-merged] .mrg-tk[data-role="solo"] { color: var(--mrg-t1); transform: translateX(var(--f, 0px)) scale(1) }
.mrg-card[data-merged] .mrg-tk[data-role="mid"] {
  opacity: 0; filter: blur(12px); transform: translateX(var(--f, 0px)) scale(calc(var(--mrg-s) * .6));
  transition: transform .7s var(--mrg-ease), opacity .45s var(--mrg-ease), filter .45s var(--mrg-ease);
}
.mrg-card[data-merged] .mrg-tk[data-role="mid"] .mrg-ti { animation: none }
.mrg-dash {
  position: absolute; left: 0; top: 0; padding: 0 .06em; opacity: 0; filter: blur(8px); white-space: nowrap; transform: translateX(var(--dx, 0px));
  font-size: var(--mrg-fs); line-height: var(--mrg-ph); font-weight: var(--mrg-fw); letter-spacing: -.01em; color: var(--mrg-t1);
  transition: opacity .45s var(--mrg-ease) .2s, filter .45s var(--mrg-ease) .2s;
}
.mrg-card[data-merged]:not([data-solo]) .mrg-dash { opacity: 1; filter: none }

/* Names glide under the two ends, the middle one is absorbed */
.mrg-names { position: relative; height: 41px; margin-top: 8px }
.mrg-nm {
  position: absolute; top: 0; left: calc(100% * (2 * var(--i) + 1) / 6); width: 120px; margin-left: -60px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  transition: transform .7s var(--mrg-ease), opacity .4s var(--mrg-ease), filter .4s var(--mrg-ease); will-change: transform;
}
.mrg-nm b { font-weight: 500; color: var(--mrg-t1) }
.mrg-nm span { position: relative; display: grid; color: var(--mrg-t3) }
.mrg-rd, .mrg-tm { grid-area: 1 / 1 }
.mrg-rd { animation: mrg-breathe 1.8s ease-in-out infinite; transition: opacity .3s var(--mrg-ease) }
.mrg-tm { opacity: 0; transition: opacity .4s var(--mrg-ease) }
.mrg-nm[data-got] .mrg-rd { opacity: 0; animation: none }
.mrg-nm[data-got] .mrg-tm { opacity: 1 }
.mrg-card[data-merged] .mrg-nm[data-role="lo"], .mrg-card[data-merged] .mrg-nm[data-role="hi"], .mrg-card[data-merged] .mrg-nm[data-role="solo"] { transform: translateX(var(--nx, 0px)) }
.mrg-card[data-merged] .mrg-nm[data-role="mid"] { opacity: 0; filter: blur(8px); pointer-events: none }

.mrg-sum {
  margin-top: 12px; color: var(--mrg-t2); text-wrap: balance; opacity: 0; filter: blur(6px); transform: translateY(6px);
  transition: opacity .45s var(--mrg-ease) .35s, filter .45s var(--mrg-ease) .35s, transform .45s var(--mrg-ease) .35s;
}
.mrg-sum b { font-weight: 500; color: var(--mrg-t1) }
.mrg-card[data-merged] .mrg-sum { opacity: 1; filter: none; transform: none }

.mrg-foot {
  display: flex; justify-content: center; margin-top: 18px; opacity: 0; filter: blur(4px); transform: translateY(4px); pointer-events: none; visibility: hidden;
  transition: opacity .3s var(--mrg-ease), filter .3s var(--mrg-ease), transform .3s var(--mrg-ease), visibility 0s .3s;
}
.mrg-foot[data-show] { opacity: 1; filter: none; transform: none; pointer-events: auto; visibility: visible; transition-delay: 0s }
.mrg-again {
  margin: -10px -8px; padding: 10px 8px; border-radius: 8px; font: 500 15px/1 var(--mrg-font, Inter, InterVariable, ui-sans-serif, system-ui, sans-serif); color: var(--mrg-accent);
  transition: transform .16s var(--mrg-ease);
}
html[data-style="glass"] .mrg-again { color: color-mix(in oklab, var(--mrg-accent) 78%, var(--mrg-ink)) }
.mrg-again:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1.5px }
.mrg-again:active { transform: scale(.95) }
.mrg button:focus-visible { outline: 2px solid var(--mrg-accent); outline-offset: 2px }

@keyframes mrg-breathe { 50% { opacity: .45 } }
@keyframes mrg-land { from { opacity: 0; filter: blur(6px); transform: translateY(14px) } }

/* Off screen or in a hidden tab the breathing stops too */
.mrg:not([data-live]) .mrg-ph, .mrg:not([data-live]) .mrg-rd, .mrg:not([data-live]) .mrg-ti { animation-play-state: paused }
/* A jump (restart, resize) skips every transition for one style recalculation; the stage's own fade is kept */
.mrg[data-snap] .mrg-stage * { transition: none !important }

@container (max-width: 420px) {
  .mrg-card { padding: 24px 22px 20px }
}
@media (pointer: coarse) { .mrg-again { margin: -14px -10px; padding: 14px 10px } }
@media (prefers-reduced-motion: reduce) {
  .mrg *, .mrg *::before, .mrg *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Role = "lo" | "hi" | "mid" | "solo"
type Agent = { name: string; price: number | null; time: string; delay: number }

const DEFAULTS: MergeRangeAgent[] = [
  { name: "Kestrel", price: 19, time: "34s", delay: 2000 },
  { name: "Brightline", price: 24, time: "9s", delay: 0 },
  { name: "Tandem", price: 31, time: "21s", delay: 1000 },
]
const DEFAULT_DELAY = [2000, 0, 1000]

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Lowest left, highest right, everything else is absorbed. All equal: one price remains. */
function rolesOf(prices: (number | null)[]): Role[] | null {
  if (prices.some((p) => p === null)) return null
  const v = prices as number[]
  const min = Math.min(...v)
  const max = Math.max(...v)
  if (min === max) return v.map((_, i) => (i === 0 ? "solo" : "mid"))
  const lo = v.indexOf(min)
  const hi = v.lastIndexOf(max)
  return v.map((_, i) => (i === lo ? "lo" : i === hi ? "hi" : "mid"))
}

/* -------------------------------------------------------------------------- */
/*                                 Merge Range                                */
/* -------------------------------------------------------------------------- */

export function MergeRange(props: MergeRangeProps) {
  const { title = "What competitors charge", unit = "per seat", currency = "$", restartLabel = "Run again", onMerge, onRestart, className } = props
  const playing = props.autoPlay ?? props.agents === undefined

  const money = (n: number) => `${currency}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`

  // Exactly three columns. A missing agent is a column that never reports.
  const agents: Agent[] = Array.from({ length: 3 }, (_, i) => {
    const a = props.agents?.[i] ?? (props.agents ? undefined : DEFAULTS[i])
    const price = a?.price ?? (playing ? (DEFAULTS[i].price as number) : null)
    return { name: a?.name ?? `Agent ${i + 1}`, price, time: a?.time ?? (playing && !props.agents ? DEFAULTS[i].time! : "done"), delay: a?.delay ?? DEFAULT_DELAY[i] }
  })
  const sig = agents.map((a) => `${a.name}|${a.price}|${a.time}`).join("~") + `~${currency}`
  const delays = agents.map((a) => a.delay)
  const order = agents.map((_, i) => i).sort((x, y) => delays[x] - delays[y] || x - y)
  const rank = agents.map((_, i) => order.indexOf(i))
  const sortedDelay = order.map((i) => delays[i])
  const dlSig = sortedDelay.join(",")

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  /* step: 0 reading · 1–3 that many agents in (built-in run) · 3 all in · 4 merged · 5 range shown with the button · 6 fading out for the next run */
  const [step, setStep] = React.useState(() => (!playing && agents.every((a) => a.price !== null) ? 5 : 0))
  const [auto, setAuto] = React.useState(playing)
  const [active, setActive] = React.useState(false)
  const [announce, setAnnounce] = React.useState("")

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const planeRef = React.useRef<HTMLDivElement>(null)
  const dashRef = React.useRef<HTMLSpanElement>(null)
  const tkRef = React.useRef<(HTMLSpanElement | null)[]>([])
  const nmRef = React.useRef<(HTMLDivElement | null)[]>([])
  const againRef = React.useRef<HTMLButtonElement>(null)
  const first = React.useRef(true)
  const kbd = React.useRef(false)
  const layoutRef = React.useRef<() => void>(() => {})
  const mergeRef = React.useRef(onMerge)
  mergeRef.current = onMerge

  const arrived = agents.map((a, i) => (playing ? rank[i] < Math.min(step, 3) : a.price !== null))
  const nArr = arrived.filter(Boolean).length
  const stepNow = !playing && nArr < 3 ? 0 : step
  const roles = nArr === 3 ? rolesOf(agents.map((a) => a.price)) : null
  const merged = stepNow >= 4 && roles !== null
  const solo = roles?.includes("solo") ?? false
  const footOn = stepNow === 5 && (playing || !!onRestart)
  const rolesSig = roles?.join("") ?? ""

  // Reduced motion: one still frame, the finished range. Applied before paint so the server and first client render agree.
  React.useLayoutEffect(() => {
    if (playing && reduce) setStep((s) => (s < 5 ? 5 : s))
  }, [playing, reduce])

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  // The beats. The built-in run walks through all of them; with real data the agents' prices are the first beats and these are the last ones.
  React.useEffect(() => {
    if (!playing) {
      if (nArr < 3) {
        if (step !== 0) setStep(0)
        return
      }
      if (step < 3) {
        setStep(3)
        return
      }
    } else if (!active) return
    const k = reduce ? 0 : 1
    let wait: number | null = null
    let next = step + 1
    if (step < 3) wait = (reduce ? 0.17 : 1) * ((step === 0 ? (first.current ? 800 : 120) + sortedDelay[0] : sortedDelay[step] - sortedDelay[step - 1]) || 0)
    else if (step === 3) wait = 600 * k
    else if (step === 4) wait = 1000 * k
    else if (step === 5) wait = playing && auto && !reduce ? 3400 : null
    else if (step === 6) {
      wait = 340 * k
      next = 0
    }
    if (wait === null) return
    const t = window.setTimeout(() => {
      first.current = false
      setStep(next)
    }, wait)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, active, auto, step, reduce, nArr, dlSig])

  React.useEffect(() => {
    if (merged && roles) {
      const lo = roles.indexOf(solo ? "solo" : "lo")
      const hi = solo ? lo : roles.indexOf("hi")
      mergeRef.current?.({ low: agents[lo].price as number, high: agents[hi].price as number, lowAgent: agents[lo].name, highAgent: agents[hi].name })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged])

  // What a screen reader hears: each report as it lands, then the range.
  const seen = React.useRef<boolean[]>([false, false, false])
  React.useEffect(() => {
    if (merged && roles) {
      const lo = roles.indexOf(solo ? "solo" : "lo")
      const hi = solo ? lo : roles.indexOf("hi")
      const per = unit ? ` ${unit}` : ""
      setAnnounce(
        solo
          ? `All three charge ${money(agents[lo].price as number)}${per}.`
          : `Between ${money(agents[lo].price as number)} and ${money(agents[hi].price as number)}${per}. ${agents[lo].name} is lowest, ${agents[hi].name} highest.`,
      )
    } else if (nArr === 0) {
      setAnnounce(`${title}. Three agents are reading.`)
    } else {
      const fresh = agents.filter((_, i) => arrived[i] && !seen.current[i])
      if (fresh.length) setAnnounce(fresh.map((a) => `${a.name} reports ${money(a.price as number)}${unit ? ` ${unit}` : ""} after ${a.time}.`).join(" ") + ` ${nArr} of 3 agents done.`)
    }
    seen.current = arrived
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged, nArr, sig, title, unit])

  /* ---- geometry: measure the real glyphs, write positions as custom properties ---- */
  const run = () => {
    const root = rootRef.current
    const plane = planeRef.current
    const dash = dashRef.current
    if (!root || !plane || !dash) return
    const W = plane.clientWidth
    if (!W) return
    const tks = tkRef.current
    const set = (el: HTMLElement | null, k: string, v: number) => el?.style.setProperty(k, `${v}px`)
    root.setAttribute("data-snap", "")

    // Tokens are drawn at the final size and scaled down into their columns. Pick the size that fits the final range, from the two widest tokens.
    const F0 = Math.min(84, Math.floor(W / 4.5))
    root.style.setProperty("--mrg-fs", `${F0}px`)
    const w0 = tks.map((t) => t?.offsetWidth ?? 0)
    const wd0 = dash.offsetWidth
    const known = w0.filter((w) => w > 0).sort((a, b) => b - a)
    const est = known.length ? (known.length > 1 ? known[0] + known[1] : known[0] * 2) : 3.8 * F0
    const F = Math.max(24, Math.floor(F0 * Math.min(1, (W * 0.98) / (est + wd0))))
    const D = W < 340 ? 40 : 48
    root.style.setProperty("--mrg-fs", `${F}px`)
    root.style.setProperty("--mrg-ph", `${Math.round(F * 1.02)}px`)
    root.style.setProperty("--mrg-d", `${D}px`)

    const w = tks.map((t) => t?.offsetWidth ?? 0)
    // A long price ("€128.5") must still fit its own column, so the column scale also shrinks to the widest token.
    root.style.setProperty("--mrg-s", String(Math.min(1, D / F, (0.9 * W) / 3 / Math.max(1, ...w))))
    const wd = dash.offsetWidth
    const col = (i: number) => (W * (2 * i + 1)) / 6
    tks.forEach((t, i) => set(t, "--h", col(i) - w[i] / 2))
    set(dash, "--dx", 0)
    if (roles) {
      const lo = roles.indexOf(roles.includes("solo") ? "solo" : "lo")
      const hi = roles.indexOf("hi")
      const single = hi < 0
      const total = single ? w[lo] : w[lo] + wd + w[hi]
      const x0 = W / 2 - total / 2
      const centre = (i: number) => (roles[i] === "lo" || roles[i] === "solo" ? x0 + w[i] / 2 : roles[i] === "hi" ? x0 + w[lo] + wd + w[i] / 2 : single ? W / 2 : x0 + w[lo] + wd / 2)
      tks.forEach((t, i) => set(t, "--f", centre(i) - w[i] / 2))
      nmRef.current.forEach((n, i) => set(n, "--nx", centre(i) - col(i)))
      set(dash, "--dx", x0 + w[lo])
    }
    void root.offsetWidth
    root.removeAttribute("data-snap")
  }

  React.useLayoutEffect(() => {
    layoutRef.current = run
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, rolesSig])

  React.useEffect(() => {
    const plane = planeRef.current
    if (!plane) return
    let w = plane.clientWidth
    const again = () => layoutRef.current()
    const ro = new ResizeObserver(() => {
      if (plane.clientWidth !== w) {
        w = plane.clientWidth
        again()
      }
    })
    ro.observe(plane)
    const fonts = document.fonts
    fonts?.ready.then(again)
    fonts?.addEventListener?.("loadingdone", again)
    return () => {
      ro.disconnect()
      fonts?.removeEventListener?.("loadingdone", again)
    }
  }, [])

  // A new run starts from the home positions with no glide back.
  const atStart = stepNow === 0
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !atStart) return
    root.setAttribute("data-snap", "")
    void root.offsetWidth
    root.removeAttribute("data-snap")
  }, [atStart])

  // Keyboard users keep their place: the button comes back focused, and focus waits on the card while it is away.
  React.useEffect(() => {
    if (stepNow === 5 && kbd.current) againRef.current?.focus({ preventScroll: true })
    else if (stepNow !== 5 && document.activeElement === againRef.current) cardRef.current?.focus({ preventScroll: true })
  }, [stepNow])

  const stopAuto = () => setAuto(false)
  const restart = () => {
    setAuto(false)
    onRestart?.()
    if (playing) setStep(6)
  }

  const names = agents.map((a) => a.name)
  const summary = (
    <>
      {unit ? `${unit}, across ` : "Across "}
      {names.map((n, i) => (
        <React.Fragment key={i}>
          <b>{n}</b>
          {i < names.length - 2 ? ", " : i === names.length - 2 ? " and " : ""}
        </React.Fragment>
      ))}
    </>
  )

  return (
    <div
      ref={rootRef}
      className={cn("mrg", className)}
      data-live={active || undefined}
      // Only a press, key, focus or real mouse movement on the piece ends the built-in loop; the rest of the page can be used freely.
      onPointerDownCapture={(e) => {
        kbd.current = false
        if (e.nativeEvent.isTrusted) stopAuto()
      }}
      onKeyDownCapture={(e) => {
        kbd.current = true
        if (e.nativeEvent.isTrusted) stopAuto()
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" && e.nativeEvent.isTrusted && (e.movementX || e.movementY)) stopAuto()
      }}
      onFocusCapture={stopAuto}
    >
      <style href="merge-range" precedence="default">
        {CSS}
      </style>
      <p className="mrg-sr" role="status" aria-live={playing && auto ? "off" : "polite"}>
        {announce}
      </p>
      <div
        ref={cardRef}
        tabIndex={-1}
        className="mrg-card"
        role="group"
        aria-label={title}
        data-merged={merged || undefined}
        data-solo={solo || undefined}
        data-fading={stepNow === 6 || undefined}
      >
        <div className="mrg-stage">
          <p className="mrg-cap">{title}</p>
          <div ref={planeRef} className="mrg-plane" aria-hidden>
            {agents.map((_, i) => (
              <span key={`p${i}`} className="mrg-ph" style={{ "--i": i } as React.CSSProperties} data-gone={arrived[i] || undefined}>
                –
              </span>
            ))}
            {agents.map((a, i) => (
              <span key={`t${i}`} ref={(el) => void (tkRef.current[i] = el)} className="mrg-tk" data-on={arrived[i] || undefined} data-role={roles?.[i]}>
                <span className="mrg-ti">{a.price === null ? "" : money(a.price)}</span>
              </span>
            ))}
            <span ref={dashRef} className="mrg-dash">
              –
            </span>
          </div>
          <div className="mrg-names" aria-hidden>
            {agents.map((a, i) => (
              <div key={i} ref={(el) => void (nmRef.current[i] = el)} className="mrg-nm" style={{ "--i": i } as React.CSSProperties} data-got={arrived[i] || undefined} data-role={roles?.[i]}>
                <b>{a.name}</b>
                <span>
                  <i className="mrg-rd" style={{ fontStyle: "normal" }}>
                    reading
                  </i>
                  <i className="mrg-tm" style={{ fontStyle: "normal" }}>
                    {a.time}
                  </i>
                </span>
              </div>
            ))}
          </div>
          <p className="mrg-sum" aria-hidden>
            {summary}
          </p>
          <div className="mrg-foot" data-show={footOn || undefined} inert={!footOn}>
            <button ref={againRef} type="button" className="mrg-again" onClick={restart}>
              {restartLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
