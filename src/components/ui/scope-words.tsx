"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ScopeWordsOption = {
  /** Stable id used by `value` / `defaultValue`, e.g. "task". */
  id: string
  /** The huge word, kept short: "Once", "This task", "Always". */
  word: string
  /** What the grant means, in one line, shown under the word while the person is choosing. */
  consequence: string
  /** The same promise, made specific, shown under the word once it is chosen (the receipt). Defaults to `consequence`. */
  receipt?: string
  /** Announced to screen readers when this word is chosen. Defaults to the heading plus the word and its receipt. */
  announce?: string
}

export type ScopeWordsProps = {
  /** Who is asking. Only used by the built-in headings and options. Default "Quill". */
  agent?: string
  /** What it wants to do, finishing the sentence "<agent> can ... ". Default "send email as you". */
  action?: string
  /** Headline while nothing is granted. Default "<agent> can’t <action> yet." */
  heading?: string
  /** Headline once a word is chosen. Default "<agent> can now <action>". */
  grantedHeading?: string
  /** The words, from the narrowest grant to the widest. Default: Once, This task, Always. */
  options?: ScopeWordsOption[]
  /** Controlled choice: the id of the granted option, or `null` while nothing is granted. The built-in loop is off while this is set. */
  value?: string | null
  /** Starting choice when uncontrolled (an id, or `null` for none). */
  defaultValue?: string | null
  /** Called when the person chooses a word. */
  onGrant?: (option: ScopeWordsOption, index: number) => void
  /** Called when the person takes the grant back. Receives the option that was granted. */
  onRevoke?: (option: ScopeWordsOption, index: number) => void
  /** Name announced for the group. Default "How long can <agent> <action>?" */
  label?: string
  /** Label of the button that takes the grant back. Default "Take back". */
  takeBackLabel?: string
  /** Announced when the grant is taken back. Default "Access taken back." */
  revokedAnnounce?: string
  /** Play the built-in loop (glide over the words, grant one, take it back) until the first interaction with the card. Default: on when no `options`, `value`, `defaultValue` or callbacks are passed. */
  autoPlay?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.scw {
  --scw-ink: #000;
  --scw-surface: #fff;
  --scw-accent: #0060e2;
  --scw-t1: color-mix(in oklab, var(--scw-ink) 88%, transparent);
  --scw-t2: color-mix(in oklab, var(--scw-ink) 61%, transparent);
  --scw-t3: color-mix(in oklab, var(--scw-ink) 45%, transparent);
  --scw-t4: color-mix(in oklab, var(--scw-ink) 27%, transparent);
  --scw-fill: color-mix(in oklab, var(--scw-ink) 6%, transparent);
  --scw-line: color-mix(in oklab, var(--scw-ink) 6%, transparent);
  --scw-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --scw-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --scw-ease: cubic-bezier(.22, 1, .36, 1);
  --scw-ls: -.04em; --scw-ww: 600; --scw-wfs: clamp(38px, 12cqw, 46px); --scw-r: 28px; --scw-rr: 12px;
  position: relative; container-type: inline-size; width: 100%; max-width: 420px;
  display: grid; grid-template-columns: minmax(0, 1fr); align-content: center;
  min-height: var(--scw-hold, 0px); transition: min-height .4s var(--scw-ease);
  font: 13px/20px var(--scw-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--scw-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .scw {
  --scw-ink: #fff;
  --scw-surface: #1c1c1e;
  --scw-accent: #4d8dff;
  --scw-t1: color-mix(in oklab, var(--scw-ink) 90%, transparent);
  --scw-t2: color-mix(in oklab, var(--scw-ink) 62%, transparent);
  --scw-t3: color-mix(in oklab, var(--scw-ink) 46%, transparent);
  --scw-t4: color-mix(in oklab, var(--scw-ink) 28%, transparent);
  --scw-fill: color-mix(in oklab, var(--scw-ink) 8%, transparent);
  --scw-line: color-mix(in oklab, var(--scw-ink) 9%, transparent);
  --scw-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --scw-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, a hairline, Geist Mono; the chosen word is underlined because the accent is ink */
html[data-style="mono"] .scw {
  --scw-ink: #000; --scw-surface: #fff; --scw-accent: #111;
  --scw-shadow: 0 0 0 1px rgb(0 0 0 / .14); --scw-drop: 0 0 0 0 transparent;
  --scw-ease: cubic-bezier(.2, .9, .1, 1); --scw-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --scw-ls: -.02em; --scw-ww: 500; --scw-wfs: clamp(30px, 9.5cqw, 38px); --scw-r: 8px; --scw-rr: 4px;
}
html[data-style="mono"].dark .scw { --scw-ink: #fff; --scw-surface: #0a0a0a; --scw-accent: #f2f2f2; --scw-shadow: 0 0 0 1px rgb(255 255 255 / .16) }

/* Glass: the card carries the frost, the words sit on it in the Pane glass inks */
html[data-style="glass"] .scw {
  --scw-ink: var(--pane-ink); --scw-surface: var(--pane-solid); --scw-accent: var(--pane-accent); --scw-shadow: var(--pane-shadow);
  --scw-drop: 0 0 0 0 transparent; --scw-ease: var(--pane-ease); --scw-font: var(--pane-font);
  --scw-t1: var(--pane-t1); --scw-t2: var(--pane-t2); --scw-t3: var(--pane-t3); --scw-t4: var(--pane-t4);
}
html[data-style="glass"] .scw-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .scw-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .scw-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .scw-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .scw-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .scw-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.scw *, .scw *::before, .scw *::after { box-sizing: border-box }
:where(.scw) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.scw) p { margin: 0 }
.scw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.scw-card {
  --scw-px: 32px;
  min-width: 0; overflow: hidden; padding: 30px var(--scw-px) 26px; border-radius: var(--scw-r);
  background: var(--scw-surface); box-shadow: var(--scw-shadow), var(--scw-drop);
}
@container (max-width: 419px) {
  .scw-card { --scw-px: 24px; padding-top: 26px; padding-bottom: 22px }
}

/* Headline: both sentences share one grid cell, so a longer one never changes the height */
.scw-head { display: grid; margin-bottom: 14px; font-size: 15px; line-height: 20px; font-weight: 500; color: var(--scw-t2) }
.scw-head > span { grid-area: 1 / 1; min-width: 0 }
.scw-hm { visibility: hidden }
.scw-tick { animation: scw-tick .5s var(--scw-ease) backwards }
.scw[data-settled] .scw-tick { animation: none }
@keyframes scw-tick { from { opacity: 0; filter: blur(6px); transform: translateY(4px) } }

/* The words. The list is in normal flow; the options box is measured and animates between two pixel heights. */
.scw-opts { position: relative; height: var(--scw-oh, auto); transition: height .4s var(--scw-ease) }
.scw-list { position: relative; display: grid; row-gap: 10px; padding-bottom: 10px }
.scw-opt {
  display: block; width: 100%; min-width: 0; border-radius: var(--scw-rr); text-align: left; color: inherit;
  transition: transform .56s var(--scw-ease), opacity .4s var(--scw-ease), filter .4s var(--scw-ease), visibility 0s linear;
}
.scw-opt:focus-visible { outline: 2px solid var(--scw-accent); outline-offset: 4px }
.scw-w {
  display: block; font-size: var(--scw-wfs); line-height: 1.13; font-weight: var(--scw-ww); letter-spacing: var(--scw-ls);
  color: var(--scw-t1); overflow-wrap: anywhere; transition: color .25s var(--scw-ease);
  text-decoration: underline 2px transparent; text-underline-offset: .12em;
}
.scw-opt[data-on] .scw-w, .scw-opt:focus-visible .scw-w { color: var(--scw-accent) }
@media (hover: hover) { .scw[data-phase="ask"] .scw-opt:hover .scw-w { color: var(--scw-accent) } }
html[data-style="mono"] .scw-opt[data-on] .scw-w, html[data-style="mono"] .scw-opt:focus-visible .scw-w { text-decoration-color: var(--scw-accent) }
@media (hover: hover) { html[data-style="mono"] .scw[data-phase="ask"] .scw-opt:hover .scw-w { text-decoration-color: var(--scw-accent) } }
html[data-style="mono"] .scw[data-phase="granted"] .scw-opt[data-side="sel"] .scw-w { text-decoration-color: var(--scw-accent) }

/* The consequence line. The promise and its receipt share one cell, but only the visible one is in flow, so the row is as tall
   as what is on show and a long hidden receipt never opens a gap while the person is choosing. */
.scw-c { position: relative; display: grid; margin-top: 2px; font-size: 13px; line-height: 18px; color: var(--scw-t2) }
.scw-c > span { grid-area: 1 / 1; min-width: 0; transition: opacity .35s var(--scw-ease), filter .35s var(--scw-ease), transform .35s var(--scw-ease), visibility 0s linear .35s }
.scw-c > span[data-hide] { position: absolute; inset: 0 auto auto 0; width: 100%; opacity: 0; visibility: hidden; filter: blur(6px); transform: translateY(4px) }
.scw-c > span:not([data-hide]) { transition-delay: .12s, .12s, .12s, 0s }

/* Granted: the other two travel away and blur out in a stagger, the chosen word rises into the headline slot, the box collapses */
.scw[data-phase="granted"] .scw-opt { pointer-events: none }
.scw[data-phase="granted"] .scw-opt:not([data-side="sel"]) {
  opacity: 0; filter: blur(8px); visibility: hidden;
  transition: transform .56s var(--scw-ease) calc(var(--scw-n) * 40ms), opacity .4s var(--scw-ease) calc(var(--scw-n) * 40ms),
    filter .4s var(--scw-ease) calc(var(--scw-n) * 40ms), visibility 0s linear calc(.6s + var(--scw-n) * 40ms);
}
.scw[data-phase="granted"] .scw-opt[data-side="up"] { transform: translateY(-56px) }
.scw[data-phase="granted"] .scw-opt[data-side="down"] { transform: translateY(56px) }
.scw[data-phase="granted"] .scw-opt[data-side="sel"] { transform: translateY(var(--scw-y, 0px)) }
.scw[data-phase="granted"] .scw-opt[data-side="sel"] .scw-w { color: var(--scw-accent) }

/* Take back */
.scw-take {
  position: absolute; left: 0; bottom: 0; height: 28px; border-radius: var(--scw-rr); font-size: 15px; line-height: 28px; font-weight: 500; color: var(--scw-accent);
  opacity: 0; visibility: hidden; transform: translateY(4px);
  transition: opacity .3s var(--scw-ease), transform .3s var(--scw-ease), visibility 0s linear .3s;
}
.scw-take:focus-visible { outline: 2px solid var(--scw-accent); outline-offset: 3px }
@media (hover: hover) { .scw-take:hover { text-decoration: underline; text-underline-offset: 4px } }
html[data-style="mono"] .scw-take { text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--scw-t3) }
.scw[data-phase="granted"] .scw-take { opacity: 1; visibility: visible; transform: none; transition: opacity .4s var(--scw-ease) .3s, transform .4s var(--scw-ease) .3s, visibility 0s linear }

/* Once the motion has had its time the final state is set without it, so a tab whose frames never arrive still shows it */
.scw[data-settled] .scw-opts, .scw[data-settled] .scw-opt, .scw[data-settled] .scw-c > span, .scw[data-settled] .scw-take { transition-duration: 0s !important; transition-delay: 0s !important }

@media (prefers-reduced-motion: reduce) {
  .scw, .scw *, .scw *::before, .scw *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Built-ins                                 */
/* -------------------------------------------------------------------------- */

const defaults = (agent: string): ScopeWordsOption[] => [
  { id: "once", word: "Once", consequence: "Sends this email, then stops", receipt: "Sends to 14 investors at 09:00, then stops", announce: `${agent} can send one email as you.` },
  { id: "task", word: "This task", consequence: "Until the Q3 board pack is done", receipt: "Sends at 09:00, on until the pack is done", announce: `${agent} can send email as you for this task.` },
  { id: "always", word: "Always", consequence: "Any time, until you take it back", receipt: "Sends at 09:00, on until you take it back", announce: `${agent} can always send email as you.` },
]

/** Pause before each step of the built-in loop: rest, glide to the first word, glide to the second, hold the receipt. */
const HOLD = [800, 500, 600, 2900]
const REST_AGAIN = 3200

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** tops: where each row starts; ask / done: each row's height with its promise / its receipt on show; list: the choosing list; full: the tallest the card gets. */
type Measure = { tops: number[]; ask: number[]; done: number[]; list: number; full: number }
const NO_MEASURE: Measure = { tops: [], ask: [], done: [], list: 0, full: 0 }
const same = (a: Measure, b: Measure) =>
  a.list === b.list && a.full === b.full && a.tops.length === b.tops.length && a.tops.every((t, i) => t === b.tops[i] && a.ask[i] === b.ask[i] && a.done[i] === b.done[i])

/* -------------------------------------------------------------------------- */
/*                                 ScopeWords                                 */
/* -------------------------------------------------------------------------- */

export function ScopeWords(props: ScopeWordsProps) {
  const {
    agent = "Quill",
    action = "send email as you",
    options: optionsProp,
    value,
    defaultValue,
    onGrant,
    onRevoke,
    takeBackLabel = "Take back",
    revokedAnnounce = "Access taken back.",
    className,
  } = props
  const demo = value === undefined && defaultValue === undefined && optionsProp === undefined && !onGrant && !onRevoke
  const controlled = value !== undefined
  const options = React.useMemo(() => (optionsProp && optionsProp.length > 0 ? optionsProp : defaults(agent)), [optionsProp, agent])
  const n = options.length
  const heading = props.heading ?? `${agent} can’t ${action} yet.`
  const grantedHeading = props.grantedHeading ?? `${agent} can now ${action}`
  const label = props.label ?? `How long can ${agent} ${action}?`

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const find = (id: string | null | undefined) => (id == null ? -1 : options.findIndex((o) => o.id === id))
  const [inner, setInner] = React.useState(() => find(defaultValue))
  const [auto, setAuto] = React.useState(props.autoPlay ?? demo)
  const [held, setHeld] = React.useState(props.autoPlay ?? demo)
  const [engaged, setEngaged] = React.useState(false)
  const [active, setActive] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [hi, setHi] = React.useState(-1)
  const [note, setNote] = React.useState("")
  const [m, setM] = React.useState<Measure>(NO_MEASURE)
  const [settled, setSettled] = React.useState(true)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const optsRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const rowRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const takeRef = React.useRef<HTMLButtonElement>(null)
  const focusNext = React.useRef<"take" | number | null>(null)
  const prevSel = React.useRef(-1)
  const firstRest = React.useRef(true)

  const sel = Math.min(controlled ? find(value) : inner, n - 1)
  const granted = sel >= 0
  const looping = auto && !controlled && !reduce

  const said = (i: number) => options[i].announce ?? `${grantedHeading}. ${options[i].word}: ${options[i].receipt ?? options[i].consequence}`

  // Reduced motion has no loop, so the built-in card rests on its second word, granted (set before first paint).
  React.useLayoutEffect(() => {
    if (demo && prefersReduced()) {
      const i = Math.min(1, n - 1)
      setInner(i)
      setNote(said(i))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A change of choice re-enables the motion in the same commit that changes it, then switches it off again once it has had its time.
  const [seen, setSeen] = React.useState(sel)
  if (seen !== sel) {
    setSeen(sel)
    setSettled(false)
  }
  React.useEffect(() => {
    if (settled) return
    const t = window.setTimeout(() => setSettled(true), 1100)
    return () => window.clearTimeout(t)
  }, [settled, sel])

  // Measure the rows once and whenever their size changes: the box animates between these pixel values.
  React.useLayoutEffect(() => {
    const card = cardRef.current
    const opts = optsRef.current
    const list = listRef.current
    if (!card || !opts || !list) return
    const measure = () => {
      const rows = rowRefs.current.slice(0, n)
      // Each row is word + the line on show. Read the promise and the receipt apart, so the height is known for both states.
      const base = rows.map((r) => (r ? r.offsetHeight - (r.querySelector<HTMLElement>(".scw-c")?.offsetHeight ?? 0) : 0))
      const ask = rows.map((r, k) => base[k] + (r?.querySelector<HTMLElement>(".scw-cc")?.offsetHeight ?? 0))
      const done = rows.map((r, k) => base[k] + (r?.querySelector<HTMLElement>(".scw-cr")?.offsetHeight ?? 0))
      const choosing = rows.reduce((sum, r, k) => sum + ask[k] - (r?.offsetHeight ?? 0), list.offsetHeight)
      const next: Measure = {
        tops: rows.map((r) => r?.offsetTop ?? 0),
        ask,
        done,
        list: choosing,
        full: card.offsetHeight - opts.offsetHeight + Math.max(choosing, ...done.map((h) => h + 36)),
      }
      setM((p) => (same(p, next) ? p : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    ro.observe(card)
    list.querySelectorAll(".scw-cr").forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [n, options])

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!looping) return
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    if (typeof IntersectionObserver === "undefined") {
      onScreen = true
      update()
      document.addEventListener("visibilitychange", update)
      return () => document.removeEventListener("visibilitychange", update)
    }
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
  }, [looping])

  // The built-in moment: glide over the first word, land on the second, grant it, hold the receipt, take it back.
  React.useEffect(() => {
    if (!looping || !active) return
    const second = Math.min(1, n - 1)
    const t = window.setTimeout(
      () => {
        if (step === 0) {
          firstRest.current = false
          setHi(0)
        } else if (step === 1) setHi(second)
        else if (step === 2) {
          setHi(-1)
          setInner(second)
          setNote(said(second))
        } else {
          setInner(-1)
          setNote(revokedAnnounce)
        }
        setStep((step + 1) % 4)
      },
      step === 0 && !firstRest.current ? REST_AGAIN : HOLD[step],
    )
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looping, active, step, n])

  // The person has taken over: the loop ends for good and stays wherever it is.
  // Hovering only ends the loop (the reserved height stays); a press, key or focus also releases the reserved height once the card is asking again.
  const handOver = (engage: boolean) => {
    setAuto(false)
    setHi(-1)
    if (engage) setEngaged(true)
  }

  // In controlled mode the parent may ignore a request, so a pending focus move lapses if `value` does not follow.
  const wantFocus = (f: "take" | number) => {
    focusNext.current = f
    if (controlled) window.setTimeout(() => (focusNext.current = null), 400)
  }

  const grant = (i: number) => {
    if (granted) return
    handOver(true)
    setHeld(false)
    wantFocus("take")
    if (!controlled) {
      setInner(i)
      setNote(said(i))
    }
    onGrant?.(options[i], i)
  }
  const revoke = () => {
    if (!granted) return
    handOver(true)
    wantFocus(sel)
    const was = sel
    if (!controlled) {
      setInner(-1)
      setNote(revokedAnnounce)
    }
    onRevoke?.(options[was], was)
  }

  // After a change of choice: keep a keyboard user's place (granting lands on Take back, taking back on the word that was granted),
  // and announce a change the parent made on its own, which no click here explains.
  React.useEffect(() => {
    const changed = prevSel.current !== sel
    prevSel.current = sel
    const f = focusNext.current
    focusNext.current = null
    if (f !== null) {
      const el = f === "take" ? takeRef.current : rowRefs.current[f]
      el?.focus({ preventScroll: true })
    }
    if (controlled && changed) setNote(sel >= 0 ? said(sel) : revokedAnnounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (granted) return
    const k = rowRefs.current.findIndex((r) => r === document.activeElement)
    if (k < 0) return
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? (k + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (k + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    rowRefs.current[to]?.focus()
  }

  // Box height: natural while choosing (measured), word + gap + button once granted.
  const rise = granted ? (m.done[sel] ?? 0) + 8 + 28 : m.list
  const ready = m.list > 0
  const holding = held && !reduce && !controlled && !(engaged && !granted)
  const style = {
    ...(holding && m.full > 0 ? { "--scw-hold": `${m.full}px` } : null),
  } as React.CSSProperties
  const optsStyle = (ready ? { "--scw-oh": `${rise}px` } : undefined) as React.CSSProperties | undefined

  return (
    <div
      ref={rootRef}
      className={cn("scw", className)}
      style={style}
      data-phase={granted ? "granted" : "ask"}
      data-settled={settled ? "" : undefined}
      // Only a press, key, focus or mouse landing on the card ends the built-in loop; the rest of the page can be clicked freely.
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver(true)
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver(true)
      }}
      onFocusCapture={() => handOver(true)}
      // A real mouse moving over the card (not the pointer resting there while the page loads) takes over without letting go of the height.
      onPointerMove={(e) => {
        if (e.nativeEvent.isTrusted && e.pointerType === "mouse" && (e.movementX !== 0 || e.movementY !== 0)) handOver(false)
      }}
    >
      <style href="scope-words" precedence="default">
        {CSS}
      </style>
      <p className="scw-sr" role="status" aria-live={looping ? "off" : "polite"}>
        {note}
      </p>
      <div ref={cardRef} className="scw-card" role="group" aria-label={label}>
        <p className="scw-head">
          <span key={granted ? "g" : "a"} className="scw-tick">
            {granted ? grantedHeading : heading}
          </span>
          <span className="scw-hm" aria-hidden>
            {granted ? heading : grantedHeading}
          </span>
        </p>
        <div ref={optsRef} className="scw-opts" style={optsStyle} onKeyDown={onKeyDown}>
          <div ref={listRef} className="scw-list">
            {options.map((o, k) => {
              const side = !granted ? undefined : k === sel ? "sel" : k < sel ? "up" : "down"
              const chosen = granted && k === sel
              return (
                <button
                  key={o.id}
                  ref={(el) => {
                    rowRefs.current[k] = el
                  }}
                  type="button"
                  className="scw-opt"
                  data-side={side}
                  data-on={!granted && hi === k ? "" : undefined}
                  aria-pressed={granted ? chosen : undefined}
                  aria-disabled={granted || undefined}
                  tabIndex={granted ? -1 : 0}
                  onClick={() => grant(k)}
                  style={{ "--scw-n": Math.max(0, Math.abs(k - sel) - 1), "--scw-y": `${-(m.tops[k] ?? 0)}px` } as React.CSSProperties}
                >
                  <span className="scw-w">{o.word}</span>
                  <span className="scw-c">
                    <span className="scw-cc" data-hide={chosen ? "" : undefined}>
                      {o.consequence}
                    </span>
                    <span className="scw-cr" data-hide={chosen ? undefined : ""} aria-hidden={!chosen}>
                      {o.receipt ?? o.consequence}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <button ref={takeRef} type="button" className="scw-take" tabIndex={granted ? 0 : -1} onClick={revoke}>
            {takeBackLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
