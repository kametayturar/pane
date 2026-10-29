"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OdometerPhase = "working" | "needs" | "done"
export type OdometerDecision = "pay" | "hold"

export type OdometerCheck = {
  /** The figure that needs a human, e.g. 4860. The count rolls to it while the agent waits. */
  amount: number
  /** What it should have been, e.g. 4680 – shown as "PO says $4,680 · $180 over". */
  expected: number
  /** The question under the number. */
  question?: string
  /** Label of the main button. Defaults to "Pay $4,860". */
  payLabel?: string
  /** Label of the quiet button. Defaults to "Hold". */
  holdLabel?: string
  /** Replaces the line under the number while waiting. */
  note?: string
}

export type OdometerProps = {
  /** Who is working. Default "Atlas". */
  agent?: string
  /** Progress so far. Setting `count` or `phase` turns the built-in simulation off and lets you drive it. */
  count?: number
  /** What the count is out of. Default 1240. */
  total?: number
  /** Plural noun for the thing counted. Default "invoices". */
  unit?: string
  /** "working" ticks along, "needs" rolls to `check.amount` and asks, "done" settles on the total. */
  phase?: OdometerPhase
  /** The decision the agent needs. Without it a `needs` phase is shown as `working`. */
  check?: OdometerCheck
  /** Currency symbol that appears in front of the number while it shows an amount. Default "$". */
  currency?: string
  /** Replaces the "About 4 min left" line. */
  eta?: string
  /** Done state: the run finished with something held back. */
  held?: boolean
  /** Replaces the headline of the done state. */
  doneTitle?: string
  /** Replaces the line under the done headline. */
  doneNote?: string
  /** Called when the person answers. In the built-in simulation it also moves it on. */
  onResolve?: (decision: OdometerDecision) => void
  /** Called on "Run again". */
  onRestart?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.odm {
  --odm-ink: #000;
  --odm-surface: #fff;
  --odm-accent: #0060e2;
  --odm-t1: color-mix(in oklab, var(--odm-ink) 88%, transparent);
  --odm-t2: color-mix(in oklab, var(--odm-ink) 61%, transparent);
  --odm-t3: color-mix(in oklab, var(--odm-ink) 45%, transparent);
  --odm-t4: color-mix(in oklab, var(--odm-ink) 27%, transparent);
  --odm-fill: color-mix(in oklab, var(--odm-ink) 6%, transparent);
  --odm-line: color-mix(in oklab, var(--odm-ink) 6%, transparent);
  --odm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --odm-ease: cubic-bezier(.22, 1, .36, 1);
  --odm-pad: 24px;
  position: relative; container-type: inline-size; width: 100%; max-width: 360px;
  font: 13px/20px var(--odm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--odm-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .odm {
  --odm-ink: #fff;
  --odm-surface: #1c1c1e;
  --odm-accent: #4d8dff;
  --odm-t1: color-mix(in oklab, var(--odm-ink) 90%, transparent);
  --odm-t2: color-mix(in oklab, var(--odm-ink) 62%, transparent);
  --odm-t3: color-mix(in oklab, var(--odm-ink) 46%, transparent);
  --odm-t4: color-mix(in oklab, var(--odm-ink) 28%, transparent);
  --odm-fill: color-mix(in oklab, var(--odm-ink) 8%, transparent);
  --odm-line: color-mix(in oklab, var(--odm-ink) 9%, transparent);
  --odm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .odm {
  --odm-ink: #000; --odm-surface: #fff; --odm-accent: #111; --odm-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --odm-ease: cubic-bezier(.2, .9, .1, 1); --odm-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .odm { --odm-ink: #fff; --odm-surface: #0a0a0a; --odm-accent: #f2f2f2; --odm-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .odm {
  --odm-ink: var(--pane-ink); --odm-surface: var(--pane-solid); --odm-accent: var(--pane-accent); --odm-shadow: var(--pane-shadow);
  --odm-ease: var(--pane-ease); --odm-font: var(--pane-font);
  --odm-t1: var(--pane-t1); --odm-t2: var(--pane-t2); --odm-t3: var(--pane-t3); --odm-t4: var(--pane-t4);
}
html[data-style="glass"] .odm-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .odm-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .odm-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .odm-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.odm *, .odm *::before, .odm *::after { box-sizing: border-box }
:where(.odm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.odm) p { margin: 0 }
.odm button:focus-visible { outline: 2px solid var(--odm-accent); outline-offset: 2px }
.odm-card:focus { outline: none }
.odm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.odm-card { border-radius: 24px; background: var(--odm-surface); box-shadow: var(--odm-shadow); padding: 20px var(--odm-pad) 0; overflow: hidden }

/* Header */
.odm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 20px; font-weight: 500; color: var(--odm-t2) }
.odm-who { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--odm-t1) }
.odm-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--odm-accent); transition: opacity .3s var(--odm-ease) }
.odm-card[data-phase="working"] .odm-dot { animation: odm-breathe 1.8s ease-in-out infinite }
.odm-card[data-phase="done"] .odm-dot { opacity: .3 }
.odm-status, .odm-of, .odm-zone { display: grid }
.odm-status { justify-items: end }
.odm-status > span, .odm-of > span, .odm-layer { grid-area: 1 / 1 }
.odm-status > span, .odm-of > span {
  white-space: nowrap; opacity: 0; filter: blur(4px);
  transition: opacity .14s var(--odm-ease), transform .14s var(--odm-ease), filter .14s var(--odm-ease);
}
.odm-status > span { transform: translateY(8px) }
.odm-status .odm-s-needs { color: var(--odm-accent); font-weight: 600 }
.odm-card[data-phase="working"] .odm-s-work, .odm-card[data-phase="needs"] .odm-s-needs, .odm-card[data-phase="done"] .odm-s-done,
.odm-card[data-phase="working"] .odm-o-work, .odm-card[data-phase="needs"] .odm-o-needs, .odm-card[data-phase="done"] .odm-o-done {
  opacity: 1; filter: none; transform: none;
  transition: opacity .32s var(--odm-ease) .1s, transform .42s var(--odm-ease) .1s, filter .32s var(--odm-ease) .1s;
}

/* The wheels. Everything inside is sized in em, so the whole number scales with the container. */
.odm-num {
  position: relative; height: 1em; margin-top: 18px; font-weight: 500; line-height: 1; transform-origin: 0 60%;
  font-size: max(44px, min(88px, calc((100cqw - 2 * var(--odm-pad)) / var(--odm-em))));
  color: var(--odm-t1); transition: color .3s var(--odm-ease);
}
.odm-card[data-phase="needs"] .odm-num { color: var(--odm-accent) }
.odm-card[data-phase="done"] .odm-num { animation: odm-pop .48s var(--odm-ease) }
.odm-num[data-snap] * { transition: none !important }
.odm-slot, .odm-cur { position: absolute; left: 0; text-align: center; transition: transform .52s var(--odm-ease), opacity .32s var(--odm-ease) }
.odm-slot[data-hide] { opacity: 0 }
.odm-col {
  top: -.15em; width: .62em; height: 1.3em; overflow: hidden; font-variant-numeric: tabular-nums; letter-spacing: -.02em;
  -webkit-mask-image: linear-gradient(#0000, #000 8%, #000 92%, #0000); mask-image: linear-gradient(#0000, #000 8%, #000 92%, #0000);
}
.odm-col i { display: block; height: 1.3em; font-style: normal; line-height: 1.3em; text-align: center }
.odm-comma { top: 0; width: .3em; height: 1em; line-height: 1em; display: flex; justify-content: center }
.odm-cur { top: 0; width: .55em; height: 1em; line-height: 1em; letter-spacing: -.02em; opacity: 0 }
.odm-cur[data-on] { opacity: 1 }

.odm-of { margin-top: 24px; color: var(--odm-t2) }

/* Bottom zone: three layers share one cell, so it is as tall as the tallest */
.odm-zone { min-height: 96px; margin: 20px calc(-1 * var(--odm-pad)) 0; border-top: 1px solid var(--odm-line) }
.odm-layer {
  display: flex; flex-direction: column; justify-content: center; padding: 14px var(--odm-pad); opacity: 0; filter: blur(6px); pointer-events: none;
  transition: opacity .14s var(--odm-ease), filter .14s var(--odm-ease);
}
.odm-card[data-phase="working"] .odm-l-work, .odm-card[data-phase="needs"] .odm-l-ask, .odm-card[data-phase="done"] .odm-l-done {
  opacity: 1; filter: none; pointer-events: auto; transition: opacity .34s var(--odm-ease) .14s, filter .34s var(--odm-ease) .14s;
}
.odm-l-ask { justify-content: flex-start }
.odm-l-ask > * { opacity: 0; transform: translateY(8px); filter: blur(4px); transition: opacity .12s, transform .12s, filter .12s }
.odm-card[data-phase="needs"] .odm-l-ask > * {
  opacity: 1; transform: none; filter: none;
  transition: opacity .38s var(--odm-ease) calc(.16s + var(--i) * .05s), transform .46s var(--odm-ease) calc(.16s + var(--i) * .05s), filter .38s var(--odm-ease) calc(.16s + var(--i) * .05s);
}
.odm-q { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--odm-t1) }
.odm-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px }
.odm-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 16px; border-radius: 10px; white-space: nowrap;
  font-size: 15px; font-weight: 500; transition: transform .16s var(--odm-ease), background-color .16s var(--odm-ease);
}
.odm-btn:active, .odm-btn[data-pressed] { transform: scale(.96) }
.odm-pay { background: var(--odm-accent); color: var(--odm-surface); box-shadow: inset 0 1px 0 rgb(255 255 255 / .16), 0 0 0 .5px color-mix(in oklab, var(--odm-accent) 60%, #000), 0 1px 2px color-mix(in oklab, var(--odm-accent) 28%, transparent) }
.odm-pay:hover { background: color-mix(in oklab, var(--odm-accent) 88%, #000) }
.odm-hold { color: var(--odm-t1) }
.odm-hold:hover, .odm-again:hover { background: var(--odm-fill) }

.odm-l-done { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px 12px }
.odm-done-text { display: flex; flex-direction: column; min-width: 0 }
.odm-done-title { font-size: 15px; line-height: 22px; font-weight: 600; color: var(--odm-t1) }
.odm-done-note { color: var(--odm-t2) }
.odm-again { flex: none; height: 36px; margin-right: -10px; padding: 0 10px; border-radius: 10px; font-weight: 500; color: var(--odm-t2); transition: background-color .16s var(--odm-ease) }
.odm-again:active { transform: scale(.96) }

@keyframes odm-breathe { 50% { opacity: .35; transform: scale(.8) } }
@keyframes odm-pop { 35% { transform: scale(1.05); color: var(--odm-accent) } }

@container (max-width: 340px) {
  .odm-card { --odm-pad: 20px }
  .odm-l-done { flex-wrap: wrap }
  .odm-again { margin-left: -10px }
}
@media (pointer: coarse) { .odm-btn, .odm-again { height: 44px } }
@media (prefers-reduced-motion: reduce) {
  .odm *, .odm *::before, .odm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Wheels                                   */
/* -------------------------------------------------------------------------- */

const DIGIT_W = 0.62
const COMMA_W = 0.3
const CUR_W = 0.6

type Slot = { k: number; comma: boolean; el: HTMLElement; strip: HTMLElement | null; items: HTMLElement[] }
type Engine = {
  nv: number
  vel: number
  dir: number
  n: number
  raf: number
  last: number
  timer: number
  sig: string
  money: boolean
  key: number
  slots: Slot[]
  cur: HTMLElement | null
  root: HTMLElement | null
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const fmt = (n: number) => n.toLocaleString("en-US")

/** Shows or hides leading digits and slides every slot to its place (in em, so it scales with the font). */
function layout(e: Engine, x: number) {
  const vis = e.slots.map((s) => s.k === 0 || x >= 10 ** s.k - 0.5)
  const sig = vis.map(Number).join("") + (e.money ? "m" : "")
  if (sig === e.sig) return
  e.sig = sig
  e.cur?.toggleAttribute("data-on", e.money)
  let pos = e.money ? CUR_W : 0
  e.slots.forEach((s, i) => {
    s.el.style.transform = `translateX(${pos}em)`
    s.el.toggleAttribute("data-hide", !vis[i])
    if (vis[i]) pos += s.comma ? COMMA_W : DIGIT_W
  })
}

/** Writes each wheel's strip offset, per-digit opacity and motion blur for the value x. */
function draw(e: Engine, xRaw: number, v: number) {
  const x = Math.max(0, xRaw)
  layout(e, x)
  for (const s of e.slots) {
    if (s.comma || !s.strip) continue
    const pw = 10 ** s.k
    let p: number
    let blur: number
    if (s.k === 0) {
      p = x % 10
      blur = Math.min(2, Math.abs(v) / 90)
    } else {
      const f = (x % pw) / pw
      const roll = smooth(Math.min(1, Math.max(0, (f - 0.9) / 0.1)))
      p = (Math.floor(x / pw + 1e-9) % 10) + roll
      blur = roll > 0 && roll < 1 ? Math.min(2, Math.abs(v) / pw / 8) : 0
    }
    for (let j = 0; j < s.items.length; j++) {
      const o = Math.max(0, 1 - Math.abs(p - j) * 2.1)
      s.items[j].style.opacity = o > 0.995 ? "1" : o.toFixed(3)
    }
    s.strip.style.transform = `translateY(${-(p * 1.3)}em)`
    s.el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "none"
  }
}

/** Jumps straight to v with transitions switched off for that one style recalculation. */
function snap(e: Engine, v: number) {
  const r = e.root
  r?.setAttribute("data-snap", "")
  e.nv = v
  e.vel = 0
  e.dir = 0
  e.sig = ""
  draw(e, v, 0)
  if (r) {
    void r.offsetWidth
    r.removeAttribute("data-snap")
  }
}

const Wheels = React.memo(function Wheels({
  value,
  digits,
  currency,
  money,
  em,
  snapKey,
  reduce,
  label,
}: {
  value: number
  digits: number
  currency: string
  money: boolean
  em: number
  snapKey: number
  reduce: boolean
  label: string
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const eng = React.useRef<Engine>({
    nv: value, vel: 0, dir: 0, n: value, raf: 0, last: 0, timer: 0, sig: "", money, key: snapKey, slots: [], cur: null, root: null,
  })

  // Structure: read the slots from the DOM and paint the current value without any transition.
  React.useLayoutEffect(() => {
    const e = eng.current
    const root = rootRef.current
    if (!root) return
    e.root = root
    e.cur = root.querySelector<HTMLElement>("[data-cur]")
    e.slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]")).map((el) => {
      const strip = el.firstElementChild as HTMLElement | null
      const comma = el.dataset.comma === "1"
      return { k: Number(el.dataset.k), comma, el, strip: comma ? null : strip, items: comma || !strip ? [] : (Array.from(strip.children) as HTMLElement[]) }
    })
    snap(e, e.n)
    return () => {
      cancelAnimationFrame(e.raf)
      clearTimeout(e.timer)
      e.raf = 0
    }
  }, [digits, currency])

  // Target: chase the value with a spring, or jump when asked to (reset, reduced motion).
  React.useLayoutEffect(() => {
    const e = eng.current
    e.dir = Math.sign(value - e.nv)
    e.n = value
    e.money = money
    if (reduce || snapKey !== e.key) {
      e.key = snapKey
      cancelAnimationFrame(e.raf)
      e.raf = 0
      clearTimeout(e.timer)
      snap(e, value)
      return
    }
    layout(e, e.nv)
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - e.last) / 1000)
      e.last = now
      for (let i = 0; i < 4; i++) {
        const h = dt / 4
        e.vel += (-420 * (e.nv - e.n) - 41 * e.vel) * h
        e.nv += e.vel * h
      }
      // A money figure never reads past the real amount: stop at the target instead of overshooting it.
      if ((e.dir > 0 && e.nv > e.n) || (e.dir < 0 && e.nv < e.n)) {
        e.nv = e.n
        e.vel = 0
      }
      const live = Math.abs(e.nv - e.n) > 0.02 || Math.abs(e.vel) > 0.5
      if (!live) {
        e.nv = e.n
        e.vel = 0
        clearTimeout(e.timer)
      }
      draw(e, e.nv, e.vel)
      e.raf = live ? requestAnimationFrame(frame) : 0
    }
    if (!e.raf) {
      e.last = performance.now()
      e.raf = requestAnimationFrame(frame)
    }
    // If frames never arrive (throttled tab, screenshot), land on the answer anyway.
    clearTimeout(e.timer)
    e.timer = window.setTimeout(() => {
      cancelAnimationFrame(e.raf)
      e.raf = 0
      e.nv = e.n
      e.vel = 0
      draw(e, e.n, 0)
    }, 1800)
  }, [value, money, snapKey, reduce])

  const slots: React.ReactNode[] = []
  for (let k = digits - 1; k >= 0; k--) {
    slots.push(
      <div key={`d${k}`} className="odm-slot odm-col" data-slot data-k={k} aria-hidden>
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <i key={i}>{i % 10}</i>
          ))}
        </div>
      </div>,
    )
    if (k > 0 && k % 3 === 0) {
      slots.push(
        <div key={`c${k}`} className="odm-slot odm-comma" data-slot data-comma="1" data-k={k} aria-hidden>
          ,
        </div>,
      )
    }
  }
  return (
    <div ref={rootRef} className="odm-num" role="img" aria-label={label} style={{ "--odm-em": em } as React.CSSProperties}>
      <div className="odm-cur" data-cur aria-hidden>
        {currency}
      </div>
      {slots}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  Odometer                                  */
/* -------------------------------------------------------------------------- */

type Sim = { phase: OdometerPhase; count: number; held: boolean; passed: boolean }

const DEMO_CHECK: OdometerCheck = {
  amount: 4860,
  expected: 4680,
  question: "Pay Northwind $4,860 on Friday?",
  payLabel: "Pay $4,860",
  holdLabel: "Hold",
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function Odometer(props: OdometerProps) {
  const {
    agent = "Atlas",
    total = 1240,
    unit = "invoices",
    currency = "$",
    eta,
    held: heldProp,
    doneTitle,
    doneNote = "Report sent to Finance at 09:41",
    onResolve,
    onRestart,
    className,
  } = props
  const bare = props.phase === undefined && props.count === undefined
  const check = props.check ?? (bare ? DEMO_CHECK : undefined)

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  /* ---- built-in simulation (only when nothing is driving the piece) ---- */
  const start = Math.round(total * 0.252)
  const hold = Math.floor(total * 0.62)
  const [sim, setSim] = React.useState<Sim>(() =>
    prefersReduced() ? { phase: "needs", count: hold, held: false, passed: false } : { phase: "working", count: start, held: false, passed: false },
  )
  const [epoch, setEpoch] = React.useState(0)
  const [auto, setAuto] = React.useState(true)
  const [press, setPress] = React.useState(false)
  const [active, setActive] = React.useState(false)
  const [choice, setChoice] = React.useState<OdometerDecision | null>(null)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const payRef = React.useRef<HTMLButtonElement>(null)
  const againRef = React.useRef<HTMLButtonElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const kbd = React.useRef(false)

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!bare) return
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
  }, [bare])

  const simResolve = React.useCallback(
    (d: OdometerDecision) => {
      setSim((s) => (s.phase !== "needs" ? s : reduce ? { phase: "done", count: d === "hold" ? total - 1 : total, held: d === "hold", passed: true } : { phase: "working", count: hold, held: d === "hold", passed: true }))
    },
    [hold, total, reduce],
  )
  const simRestart = React.useCallback(() => {
    setChoice(null)
    setEpoch((n) => n + 1)
    setSim(reduce ? { phase: "needs", count: hold, held: false, passed: false } : { phase: "working", count: start, held: false, passed: false })
  }, [hold, start, reduce])

  React.useEffect(() => {
    if (!bare || !active || reduce) return
    let t1 = 0
    let t2 = 0
    if (sim.phase === "working") {
      const limit = sim.passed ? (sim.held ? total - 1 : total) : hold
      if (sim.count < limit) {
        const wait = sim.count === start ? 700 : sim.passed && sim.count === hold ? 560 : sim.passed ? 130 : 230
        t1 = window.setTimeout(
          () => setSim((s) => ({ ...s, count: Math.min(limit, s.count + (s.passed ? 118 : 91) + (s.count % 3)) })),
          wait,
        )
      } else {
        t1 = window.setTimeout(() => setSim((s) => ({ ...s, phase: s.passed ? "done" : "needs" })), 320)
      }
    } else if (sim.phase === "needs" && auto) {
      t1 = window.setTimeout(() => {
        setPress(true)
        t2 = window.setTimeout(() => {
          setPress(false)
          setChoice("pay")
          simResolve("pay")
        }, 190)
      }, 1300)
    } else if (sim.phase === "done" && auto) {
      t1 = window.setTimeout(simRestart, 3200)
    }
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [bare, active, reduce, sim, auto, total, hold, start, simResolve, simRestart])

  const stopAuto = React.useCallback(() => {
    setAuto(false)
    setPress(false)
  }, [])

  // Any touch or key anywhere on the page ends the demo loop, and tells focus-follow which input is in use.
  React.useEffect(() => {
    const onPointer = () => {
      kbd.current = false
      stopAuto()
    }
    const onKey = () => {
      kbd.current = true
      stopAuto()
    }
    window.addEventListener("pointerdown", onPointer, true)
    window.addEventListener("keydown", onKey, true)
    return () => {
      window.removeEventListener("pointerdown", onPointer, true)
      window.removeEventListener("keydown", onKey, true)
    }
  }, [stopAuto])

  /* ---- what is shown ---- */
  const rawPhase: OdometerPhase = bare ? sim.phase : (props.phase ?? "working")
  const phase: OdometerPhase = rawPhase === "needs" && !check ? "working" : rawPhase
  const held = bare ? sim.held : !!heldProp
  const count = bare ? sim.count : (props.count ?? (phase === "done" ? total : 0))
  const needs = phase === "needs" && !!check
  const value = needs && check ? check.amount : count
  const digits = String(Math.max(total, count, check?.amount ?? 0, 1)).length
  const em = digits * DIGIT_W + Math.floor((digits - 1) / 3) * COMMA_W + CUR_W + 0.1

  const diff = check ? check.amount - check.expected : 0
  const question = check?.question ?? `Resolve ${currency}${fmt(check?.amount ?? 0)}?`
  const label = needs && check
    ? `Amount to check, ${currency}${fmt(check.amount)}. Expected ${currency}${fmt(check.expected)}.`
    : `${fmt(value)} of ${fmt(total)} ${unit} reconciled`
  const minutes = Math.max(1, Math.ceil((total - count) / 260))
  const live = needs
    ? `${agent} needs one decision. ${question}`
    : phase === "done"
      ? held
        ? `${agent} finished. ${fmt(total - 1)} ${unit} reconciled, 1 held.`
        : `${agent} finished. ${fmt(total)} ${unit} reconciled.`
      : choice
        ? `Decision sent: ${choice === "pay" ? "paid" : "held"}. ${agent} is finishing the rest.`
        : `${agent} is reconciling ${fmt(total)} ${unit}.`

  // Keyboard users keep their place: focus follows the question, then the "Run again" button.
  React.useEffect(() => {
    if (!kbd.current) return
    if (phase === "needs") payRef.current?.focus({ preventScroll: true })
    if (phase === "done") againRef.current?.focus({ preventScroll: true })
    // The button that had focus just went inert: park focus on the card so the next Tab starts from here.
    if (phase === "working") cardRef.current?.focus({ preventScroll: true })
  }, [phase])


  const decide = (d: OdometerDecision) => {
    setChoice(d)
    onResolve?.(d)
    if (bare) simResolve(d)
  }
  const restart = () => {
    stopAuto()
    setChoice(null)
    onRestart?.()
    if (bare) simRestart()
  }

  return (
    <div
      ref={rootRef}
      className={cn("odm", className)}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) kbd.current = true
        stopAuto()
      }}
    >
      <style href="odometer" precedence="default">
        {CSS}
      </style>
      <p className="odm-sr" role="status" aria-live="polite">
        {live}
      </p>
      <div ref={cardRef} tabIndex={-1} className="odm-card" role="group" aria-label={`${agent}, ${unit}`} data-phase={phase}>
        <div className="odm-head">
          <span className="odm-who">
            <i className="odm-dot" aria-hidden />
            {agent}
          </span>
          <span className="odm-status">
            <span className="odm-s-work" aria-hidden={phase !== "working"}>Reconciling</span>
            <span className="odm-s-needs" aria-hidden={phase !== "needs"}>Needs you</span>
            <span className="odm-s-done" aria-hidden={phase !== "done"}>Done</span>
          </span>
        </div>

        <Wheels value={value} digits={digits} currency={currency} money={needs} em={em} snapKey={epoch} reduce={reduce} label={label} />

        <p className="odm-of">
          <span className="odm-o-work" aria-hidden={phase !== "working"}>of {fmt(total)} {unit}</span>
          <span className="odm-o-needs" aria-hidden={phase !== "needs"}>
            {check?.note ?? (check ? `PO says ${currency}${fmt(check.expected)} · ${currency}${fmt(Math.abs(diff))} ${diff >= 0 ? "over" : "under"}` : "")}
          </span>
          <span className="odm-o-done" aria-hidden={phase !== "done"}>{unit} reconciled</span>
        </p>

        <div className="odm-zone">
          <div className="odm-layer odm-l-work" inert={phase !== "working"}>
            <p>{eta ?? `About ${minutes} min left`}</p>
          </div>
          <div className="odm-layer odm-l-ask" inert={!needs}>
            <p className="odm-q" style={{ "--i": 0 } as React.CSSProperties}>
              {question}
            </p>
            <div className="odm-btns" style={{ "--i": 1 } as React.CSSProperties}>
              <button ref={payRef} type="button" className="odm-btn odm-pay" data-pressed={press || undefined} onClick={() => decide("pay")}>
                {check?.payLabel ?? `Pay ${currency}${fmt(check?.amount ?? 0)}`}
              </button>
              <button type="button" className="odm-btn odm-hold" onClick={() => decide("hold")}>
                {check?.holdLabel ?? "Hold"}
              </button>
            </div>
          </div>
          <div className="odm-layer odm-l-done" inert={phase !== "done"}>
            <div className="odm-done-text">
              <p className="odm-done-title">{doneTitle ?? (held ? `${fmt(total - 1)} matched, 1 held for review.` : "Every invoice matched.")}</p>
              <p className="odm-done-note">{doneNote}</p>
            </div>
            <button ref={againRef} type="button" className="odm-btn odm-again" onClick={restart}>
              Run again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
