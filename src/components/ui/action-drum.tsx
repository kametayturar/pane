"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ActionDrumOption = {
  /** Stable key, also what `value`, `defaultValue` and `confirmed` use. */
  id: string
  /** The verb on the drum, e.g. "Send to 14 investors". */
  label: string
  /** Bold consequence line while this verb sits under the highlight. */
  consequence: string
  /** Quiet second line under the consequence. */
  consequenceDetail?: string
  /** Text inside the highlight once confirmed, e.g. "Sent to 14 investors". */
  doneLabel: string
  /** Bold line below once confirmed, e.g. "Sent at 09:00". */
  doneConsequence: string
  doneDetail?: string
  /** "accent" turns the highlight blue and shows an arrow chip. Use it for the irreversible verb. */
  tone?: "accent" | "neutral"
}

export type ActionDrumProps = {
  /** Who wants to act – first letter becomes the avatar. */
  agent?: string
  /** Completes "Quill wants to …". */
  action?: string
  /** The thing being acted on. */
  title?: string
  subtitle?: React.ReactNode
  /** Two to five verbs, in drum order (top to bottom). Defaults to Discard / Hold / Send. */
  options?: ActionDrumOption[]
  /** Controlled: the id of the verb under the highlight. */
  value?: string
  /** Uncontrolled starting verb. Defaults to the middle one. */
  defaultValue?: string
  /** Called each time a different verb settles under the highlight. */
  onValueChange?: (id: string, option: ActionDrumOption) => void
  /** Controlled: the id of the confirmed verb, or `null` to bring the drum back. */
  confirmed?: string | null
  /** Called when the highlight is pressed. */
  onConfirm?: (option: ActionDrumOption) => void
  /** Play the built-in loop (roll to the accent verb, press it, reset). On by default when nothing is controlled; stops on the first interaction. */
  demo?: boolean
  className?: string
}

const DEFAULT_OPTIONS: ActionDrumOption[] = [
  {
    id: "discard",
    label: "Discard draft",
    consequence: "Deletes this draft.",
    consequenceDetail: "Quill can write a new one.",
    doneLabel: "Draft discarded",
    doneConsequence: "Draft deleted.",
    doneDetail: "Quill is standing by.",
  },
  {
    id: "hold",
    label: "Hold for review",
    consequence: "Nothing leaves yet.",
    consequenceDetail: "Quill waits until you decide.",
    doneLabel: "Held for review",
    doneConsequence: "Held for review.",
    doneDetail: "Quill will wait for you.",
  },
  {
    id: "send",
    label: "Send to 14 investors",
    consequence: "Sends to 14 investors now.",
    consequenceDetail: "This can’t be recalled.",
    doneLabel: "Sent to 14 investors",
    doneConsequence: "Sent at 09:00",
    doneDetail: "Delivered to 14 investors.",
    tone: "accent",
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.adr {
  --adr-ink: #000;
  --adr-surface: #fff;
  --adr-accent: #0060e2;
  --adr-on: #fff;
  --adr-t1: color-mix(in oklab, var(--adr-ink) 88%, transparent);
  --adr-t2: color-mix(in oklab, var(--adr-ink) 61%, transparent);
  --adr-t3: color-mix(in oklab, var(--adr-ink) 45%, transparent);
  --adr-t4: color-mix(in oklab, var(--adr-ink) 27%, transparent);
  --adr-fill: color-mix(in oklab, var(--adr-ink) 6%, transparent);
  --adr-line: color-mix(in oklab, var(--adr-ink) 6%, transparent);
  --adr-soft: color-mix(in oklab, var(--adr-accent) 10%, var(--adr-surface));
  --adr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 24px 48px -24px rgb(0 0 0 / .14);
  --adr-ease: cubic-bezier(.22, 1, .36, 1);
  --adr-s1: 22px;
  --adr-s2: 15px;
  --adr-s3: 13px;
  --adr-pad: 24px;
  --adr-chip-room: 64px;
  position: relative; container-type: inline-size; width: 100%; max-width: 400px;
  font-family: var(--adr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--adr-s3); line-height: 20px; color: var(--adr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .adr {
  --adr-ink: #fff;
  --adr-surface: #1c1c1e;
  --adr-accent: #4d8dff;
  --adr-t1: color-mix(in oklab, var(--adr-ink) 90%, transparent);
  --adr-t2: color-mix(in oklab, var(--adr-ink) 62%, transparent);
  --adr-t3: color-mix(in oklab, var(--adr-ink) 46%, transparent);
  --adr-t4: color-mix(in oklab, var(--adr-ink) 28%, transparent);
  --adr-fill: color-mix(in oklab, var(--adr-ink) 8%, transparent);
  --adr-line: color-mix(in oklab, var(--adr-ink) 8%, transparent);
  --adr-soft: color-mix(in oklab, var(--adr-accent) 16%, var(--adr-surface));
  --adr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 24px 48px -24px rgb(0 0 0 / .5);
}
html[data-style="mono"] .adr {
  --adr-ink: #000; --adr-surface: #fff; --adr-accent: #111; --adr-on: #fff; --adr-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --adr-ease: cubic-bezier(.2, .9, .1, 1); --adr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .adr, html[data-style="mono"] :is(.dark, [data-theme="dark"]) .adr {
  --adr-ink: #fff; --adr-surface: #0a0a0a; --adr-accent: #f2f2f2; --adr-on: #0a0a0a; --adr-shadow: 0 0 0 1px rgb(255 255 255 / .16);
}
html[data-style="mono"] :is(.adr-card) { border-radius: 4px }
html[data-style="mono"] :is(.adr-bar, .adr-go) { border-radius: 4px }
html[data-style="mono"] .adr-q { border-radius: 3px }
html[data-style="mono"] .adr-title, html[data-style="mono"] .adr-row, html[data-style="mono"] .adr-res { letter-spacing: -.04em }
html[data-style="glass"] .adr {
  --adr-ink: var(--pane-ink); --adr-surface: var(--pane-solid); --adr-accent: var(--pane-accent); --adr-shadow: var(--pane-shadow);
  --adr-ease: var(--pane-ease); --adr-font: var(--pane-font);
  --adr-t1: var(--pane-t1); --adr-t2: var(--pane-t2); --adr-t3: var(--pane-t3); --adr-t4: var(--pane-t4);
}
html[data-style="glass"] .adr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .adr-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .adr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .adr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.adr *, .adr *::before, .adr *::after { box-sizing: border-box }
:where(.adr) h3, :where(.adr) p { margin: 0 }
:where(.adr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; appearance: none; -webkit-appearance: none }
.adr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.adr-card { border-radius: 24px; background: var(--adr-surface); box-shadow: var(--adr-shadow); padding: var(--adr-pad); animation: adr-in .5s var(--adr-ease) backwards }

.adr-who { display: flex; align-items: center; gap: 10px; height: 24px; color: var(--adr-t2) }
.adr-who b { font-weight: 500; color: var(--adr-t1) }
.adr-q { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 8px; background: var(--adr-fill); font-weight: 600; color: var(--adr-t1) }
.adr-title { margin-top: 20px; font-size: var(--adr-s1); line-height: 1.2; font-weight: 600; letter-spacing: -.02em; color: var(--adr-ink); text-wrap: balance }
.adr-sub { margin-top: 4px; font-size: var(--adr-s2); line-height: 22px; color: var(--adr-t2) }

/* The drum: verbs on a cylinder, the one under the bar is the choice */
.adr-drum {
  position: relative; height: 180px; margin-top: 16px; user-select: none; -webkit-user-select: none; cursor: grab;
  /* A vertical drag has to reach the drum, so the drum area keeps the page from scrolling under a finger (touch-action: none). */
  touch-action: none;
}
.adr-drum[data-dragging] { cursor: grabbing }
.adr-drum[data-done] { cursor: default }
.adr-bar { position: absolute; left: 0; right: 0; top: 60px; height: 60px; border-radius: 18px; overflow: hidden; background: var(--adr-fill) }
.adr-bar i { position: absolute; inset: 0; opacity: 0; transition: opacity .36s var(--adr-ease) }
.adr-soft { background: var(--adr-soft) }
.adr-full { background: var(--adr-accent) }
.adr-card[data-tone="accent"] .adr-soft { opacity: 1 }
.adr-card[data-tone="accent"][data-state="done"] .adr-soft { opacity: 0 }
.adr-card[data-tone="accent"][data-state="done"] .adr-full { opacity: 1 }

.adr-rows {
  position: absolute; inset: 0; perspective: 640px; pointer-events: none;
  /* The fade lives on the rows only, so the bar, the button and its focus ring are never masked. */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%);
  transition: opacity .36s var(--adr-ease), filter .36s var(--adr-ease) }
.adr-card[data-state="done"] .adr-rows { opacity: 0; filter: blur(4px) }
.adr-row {
  position: absolute; left: 0; right: 0; top: 60px; height: 60px; display: flex; align-items: center; padding: 0 var(--adr-chip-room) 0 20px;
  font-size: var(--adr-s1); font-weight: 600; letter-spacing: -.02em; color: var(--adr-t1); will-change: transform, opacity, filter;
}
.adr-row[data-tone="accent"] { color: var(--adr-accent) }
.adr-row span, .adr-res span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

.adr-chip {
  position: absolute; right: 14px; top: 50%; width: 32px; height: 32px; margin-top: -16px; border-radius: 50%; background: var(--adr-accent); color: var(--adr-on);
  display: grid; place-items: center; opacity: 0; transform: translateX(-6px) scale(.8); filter: blur(4px);
  transition: opacity .3s var(--adr-ease), transform .3s var(--adr-ease), filter .3s var(--adr-ease);
}
.adr-chip svg { width: 16px; height: 16px }
.adr-card[data-tone="accent"] .adr-chip { opacity: 1; transform: none; filter: none; transition-delay: .08s }
.adr-card[data-state="done"] .adr-chip { opacity: 0; transform: scale(.8); filter: blur(4px); transition-delay: 0s }

.adr-go { position: absolute; left: 0; right: 0; top: 60px; height: 60px; border-radius: 18px; z-index: 3; -webkit-tap-highlight-color: transparent }
.adr-go:focus-visible { outline: 2px solid var(--adr-accent); outline-offset: 3px }
.adr-go[aria-disabled="true"] { cursor: default }

.adr-res {
  position: absolute; left: 0; right: 0; top: 60px; height: 60px; display: flex; align-items: center; gap: 10px; padding: 0 20px; z-index: 2;
  font-size: var(--adr-s1); font-weight: 600; letter-spacing: -.02em; color: var(--adr-t1); pointer-events: none;
  opacity: 0; transform: translateY(8px); filter: blur(4px);
  transition: opacity .36s var(--adr-ease), transform .36s var(--adr-ease), filter .36s var(--adr-ease);
}
.adr-res[data-tone="accent"] { color: var(--adr-on) }
.adr-card[data-state="done"] .adr-res { opacity: 1; transform: none; filter: none; transition-delay: .08s }
.adr-res svg { width: 22px; height: 22px; flex: none; clip-path: inset(0 100% 0 0); transition: clip-path .1s var(--adr-ease) }
.adr-card[data-state="done"] .adr-res svg { clip-path: inset(0 0 0 0); transition: clip-path .4s var(--adr-ease) .24s }

/* One consequence per state, stacked in one grid cell and cross-faded */
.adr-conseq { display: grid; margin-top: 8px }
.adr-line {
  grid-area: 1 / 1; font-size: var(--adr-s3); line-height: 20px; color: var(--adr-t2); pointer-events: none;
  opacity: 0; transform: translateY(6px); filter: blur(4px);
  transition: opacity .36s var(--adr-ease), transform .36s var(--adr-ease), filter .36s var(--adr-ease);
}
.adr-line[data-on] { opacity: 1; transform: none; filter: none }
.adr-line b { display: block; font-weight: 500; color: var(--adr-t1) }
.adr-line span { display: block }

@keyframes adr-in { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }

@container (max-width: 380px) {
  .adr-card { --adr-pad: 20px; --adr-s1: 19px; --adr-chip-room: 50px }
  .adr-row { padding-left: 14px }
  .adr-res { padding: 0 14px; gap: 8px }
  .adr-chip { right: 12px; width: 30px; height: 30px; margin-top: -15px }
}
@media (prefers-reduced-motion: reduce) {
  .adr *, .adr *::before, .adr *::after { animation: none !important; transition-duration: 1ms !important; transition-delay: 0s !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const H = 60
const EASE = "cubic-bezier(.22, 1, .36, 1)"
const clamp = (a: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, a))

const RM_QUERY = "(prefers-reduced-motion: reduce)"
const readReduced = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(RM_QUERY).matches
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}
const readTabVisible = () => document.visibilityState !== "hidden"

const CheckIcon = () => (
  <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4.5 11.5l4.5 4.5L17.5 6.5" />
  </svg>
)
const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8h10M8.5 3.5L13 8l-4.5 4.5" />
  </svg>
)

type Actions = {
  moveTo: (i: number, vel?: number) => void
  commit: (force?: number) => void
  reset: () => void
  park: () => void
  stop: (e?: { isTrusted: boolean }) => void
}

/* -------------------------------------------------------------------------- */
/*                                 ActionDrum                                 */
/* -------------------------------------------------------------------------- */

export function ActionDrum(props: ActionDrumProps) {
  const {
    agent = "Quill",
    action = "send",
    title = "Q3 board update",
    subtitle = "Harbor & Finch · 4 pages",
    options: optionsProp,
    value,
    defaultValue,
    onValueChange,
    confirmed,
    onConfirm,
    demo,
    className,
  } = props

  const options = optionsProp && optionsProp.length > 1 ? optionsProp : DEFAULT_OPTIONS
  const n = options.length
  const id = React.useId()
  const idxOf = (key: string | undefined) => Math.max(0, options.findIndex((o) => o.id === key))
  const sim = demo ?? (value === undefined && confirmed === undefined && !onValueChange && !onConfirm)
  const simIdx = (() => {
    const i = options.findIndex((o) => o.tone === "accent")
    return i < 0 ? n - 1 : i
  })()
  const restIdx = defaultValue !== undefined ? idxOf(defaultValue) : Math.floor((n - 1) / 2)
  const rm = React.useSyncExternalStore(subscribeReduced, readReduced, () => false)
  const tabVisible = React.useSyncExternalStore(subscribeVisibility, readTabVisible, () => true)
  // Reduced motion shows one still frame: the accent verb under the highlight, waiting to be pressed.
  const startIdx = value !== undefined ? idxOf(value) : defaultValue !== undefined ? restIdx : sim && readReduced() ? simIdx : restIdx

  const [innerSel, setInnerSel] = React.useState(startIdx)
  const [innerDone, setInnerDone] = React.useState(-1)
  const [stopped, setStopped] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [say, setSay] = React.useState("")

  const selControlled = value !== undefined
  const doneControlled = confirmed !== undefined
  const sel = clamp(selControlled ? idxOf(value) : innerSel, 0, n - 1)
  const doneIdx = doneControlled ? (confirmed === null ? -1 : idxOf(confirmed)) : innerDone
  const isDone = doneIdx >= 0
  const shown = isDone ? doneIdx : sel
  // Remember the confirmed verb so the result text doesn't change while it fades out.
  const [lastDone, setLastDone] = React.useState(Math.max(doneIdx, 0))
  if (isDone && lastDone !== doneIdx) setLastDone(doneIdx)
  const doneOpt = options[Math.min(lastDone, n - 1)]

  const rootRef = React.useRef<HTMLDivElement>(null)
  const drumRef = React.useRef<HTMLDivElement>(null)
  const rowsRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const goRef = React.useRef<HTMLButtonElement>(null)
  const pos = React.useRef(startIdx)
  const vel = React.useRef(0)
  const target = React.useRef(startIdx)
  const raf = React.useRef(0)
  const last = React.useRef(0)
  const wheelAt = React.useRef(0)
  const selRef = React.useRef(sel)
  const doneRef = React.useRef(doneIdx)
  const stoppedRef = React.useRef(false)
  const propSel = React.useRef(-1)
  const recheck = React.useRef(0)
  const simRun = React.useRef(false)
  const drag = React.useRef<{ y: number; p0: number; moved: boolean; lp: number; lt: number; vel: number; onGo: boolean } | null>(null)
  const loopRef = React.useRef<FrameRequestCallback>(() => {})
  const act = React.useRef<Actions | null>(null)

  const paintRows = () => {
    const rows = rowsRef.current
    if (!rows) return
    for (let i = 0; i < rows.children.length; i++) {
      const el = rows.children[i] as HTMLElement
      const d = i - pos.current
      const ad = Math.abs(d)
      const a = clamp(d * 32, -80, 80)
      el.style.transform = `translate3d(0,${(d * H).toFixed(2)}px,0) rotateX(${(-a).toFixed(2)}deg) scale(${(1 - 0.09 * Math.min(ad, 2)).toFixed(3)})`
      el.style.opacity = clamp(1 - 0.46 * ad, 0, 1).toFixed(3)
      el.style.filter = ad > 0.02 ? `blur(${(Math.min(ad, 2) * 1.6).toFixed(2)}px)` : "none"
    }
  }
  // Which verb is under the highlight changes React state only when the drum crosses a row boundary.
  const syncSel = () => {
    if (doneRef.current >= 0) return
    const s = clamp(Math.round(pos.current), 0, n - 1)
    if (s === selRef.current) return
    selRef.current = s
    setInnerSel(s)
    if (!simRun.current) onValueChange?.(options[s].id, options[s])
  }
  const speak = (text: string) => {
    if (!simRun.current) setSay(text)
  }
  const kick = () => {
    if (raf.current) return
    last.current = performance.now()
    raf.current = requestAnimationFrame((t) => loopRef.current(t))
  }
  const loop = (t: number) => {
    raf.current = 0
    const dt = Math.min(0.032, (t - last.current) / 1000 || 0.016)
    last.current = t
    if (rm) {
      pos.current = target.current
      vel.current = 0
    } else {
      const k = 150
      const c = 2 * 0.8 * Math.sqrt(k)
      vel.current += (-k * (pos.current - target.current) - c * vel.current) * dt
      pos.current += vel.current * dt
    }
    paintRows()
    syncSel()
    if (Math.abs(vel.current) < 0.004 && Math.abs(pos.current - target.current) < 0.002) {
      pos.current = target.current
      vel.current = 0
      paintRows()
      syncSel()
      if (doneRef.current < 0) {
        const o = options[selRef.current]
        speak(`${o.label}. ${o.consequence}${o.consequenceDetail ? " " + o.consequenceDetail : ""}`)
        // Controlled: give the parent a moment to accept the new value; if it kept the old one, spring back to it.
        if (propSel.current >= 0 && propSel.current !== selRef.current) {
          window.clearTimeout(recheck.current)
          recheck.current = window.setTimeout(() => {
            const want = propSel.current
            if (want < 0 || want === selRef.current || drag.current || doneRef.current >= 0) return
            selRef.current = want
            act.current?.moveTo(want)
          }, 80)
        }
      }
      return
    }
    raf.current = requestAnimationFrame((tt) => loopRef.current(tt))
  }
  const press = () => {
    if (rm) return
    for (const el of [barRef.current, goRef.current]) {
      el?.animate([{ transform: "scale(1)" }, { transform: "scale(.965)", offset: 0.22 }, { transform: "scale(1)" }], { duration: 460, easing: EASE })
    }
  }
  const moveTo = (i: number, v = 0) => {
    if (doneRef.current >= 0) return
    target.current = clamp(i, 0, n - 1)
    if (v) vel.current = v
    kick()
  }
  const commit = (force?: number) => {
    if (doneRef.current >= 0) return
    const s = force ?? selRef.current
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    pos.current = target.current = s
    vel.current = 0
    if (s !== selRef.current) {
      selRef.current = s
      setInnerSel(s)
      if (!simRun.current) onValueChange?.(options[s].id, options[s])
    }
    paintRows()
    if (!doneControlled) {
      doneRef.current = s
      setInnerDone(s)
    }
    if (!simRun.current) onConfirm?.(options[s])
    speak(`${options[s].doneLabel}.`)
    press()
  }
  const reset = () => {
    if (doneControlled) return
    doneRef.current = -1
    setInnerDone(-1)
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    pos.current = target.current = restIdx
    vel.current = 0
    selRef.current = restIdx
    setInnerSel(restIdx)
    setSay("")
    paintRows()
  }
  const park = () => {
    if (doneRef.current >= 0) reset()
    else if (Math.abs(pos.current - restIdx) > 0.01) {
      pos.current = target.current = restIdx
      vel.current = 0
      selRef.current = restIdx
      setInnerSel(restIdx)
      paintRows()
    }
  }
  const stop = (e?: { isTrusted: boolean }) => {
    if (!sim || stoppedRef.current || (e && !e.isTrusted)) return
    stoppedRef.current = true
    simRun.current = false
    setStopped(true)
    if (doneRef.current >= 0 && !doneControlled) reset()
    else if (selRef.current !== restIdx || Math.abs(pos.current - restIdx) > 0.01) {
      target.current = restIdx
      kick()
    }
  }

  // Latest closures for timers, native listeners and the frame loop.
  React.useLayoutEffect(() => {
    act.current = { moveTo, commit, reset, park, stop }
    loopRef.current = loop
  })
  // Keep rows laid out after every render, with no frame needed: the final state never depends on rAF.
  React.useLayoutEffect(() => {
    paintRows()
    propSel.current = selControlled ? sel : -1
  })
  React.useLayoutEffect(() => {
    selRef.current = sel
    doneRef.current = doneIdx
    if (doneIdx >= 0) {
      if (pos.current !== doneIdx) {
        pos.current = target.current = doneIdx
        vel.current = 0
        paintRows()
      }
    } else if (selControlled && !drag.current && Math.round(pos.current) !== sel) {
      target.current = sel
      kick()
    }
  }, [sel, doneIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      window.clearTimeout(recheck.current)
    },
    [],
  )

  // Loops stop off screen and in hidden tabs.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Built-in simulation: roll to the accent verb, press it, wait, reset, repeat.
  const simOn = sim && !stopped && visible && tabVisible && !rm
  React.useEffect(() => {
    if (!simOn) return
    simRun.current = true
    const timers: number[] = []
    const at = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    const cycle = () => {
      act.current?.moveTo(simIdx, 4)
      at(() => act.current?.commit(simIdx), 1500)
      at(() => act.current?.reset(), 5600)
      at(cycle, 8000)
    }
    at(cycle, 900)
    return () => {
      timers.forEach(window.clearTimeout)
      simRun.current = false
      if (!stoppedRef.current) act.current?.park()
    }
  }, [simOn, simIdx])

  // Wheel rolls the drum one verb at a time; at the ends the page scrolls on.
  React.useEffect(() => {
    const el = drumRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      act.current?.stop(e)
      if (doneRef.current >= 0 || Math.abs(e.deltaY) < 1) return
      const cur = Math.round(target.current)
      const next = clamp(cur + (e.deltaY > 0 ? 1 : -1), 0, n - 1)
      if (next === cur) return
      e.preventDefault()
      const now = performance.now()
      if (now - wheelAt.current < 160) return
      wheelAt.current = now
      act.current?.moveTo(next)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [n])

  /* Pointer: drag the drum, flick to throw it, tap the highlight to confirm, tap a neighbour to roll to it */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || doneRef.current >= 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, p0: pos.current, moved: false, lp: pos.current, lt: performance.now(), vel: 0, onGo: !!(e.target as Element).closest(".adr-go") }
    vel.current = 0
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.y
    if (!d.moved && Math.abs(dy) < 5) return
    if (!d.moved) {
      d.moved = true
      e.currentTarget.setAttribute("data-dragging", "")
    }
    let np = d.p0 - dy / H
    if (np < 0) np *= 0.35
    if (np > n - 1) np = n - 1 + (np - (n - 1)) * 0.35
    const now = performance.now()
    d.vel = d.vel * 0.6 + ((np - d.lp) / Math.max(1, now - d.lt)) * 1000 * 0.4
    d.lp = np
    d.lt = now
    pos.current = np
    paintRows()
    syncSel()
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    e.currentTarget.removeAttribute("data-dragging")
    if (!d.moved) {
      if (d.onGo) {
        pos.current = target.current = selRef.current
        vel.current = 0
        paintRows()
        commit()
      } else if (e.type === "pointerup") {
        const r = e.currentTarget.getBoundingClientRect()
        const off = Math.round((e.clientY - r.top - H * 1.5) / H)
        target.current = clamp(Math.round(pos.current) + off, 0, n - 1)
        kick()
      } else {
        target.current = clamp(Math.round(pos.current), 0, n - 1)
        kick()
      }
      return
    }
    target.current = clamp(Math.round(pos.current + d.vel * 0.16), 0, n - 1)
    vel.current = d.vel
    kick()
  }

  // Keyboard: arrows roll the drum, Enter or Space confirms.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (doneRef.current >= 0) return
    const cur = Math.round(target.current)
    let next: number | null = null
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = cur + 1
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = cur - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = n - 1
    if (next === null) return
    e.preventDefault()
    moveTo(next)
  }

  const activeId = isDone ? `${id}-d${shown}` : `${id}-c${shown}`
  const opt = options[shown]
  const tone = opt.tone === "accent" ? "accent" : "neutral"

  return (
    <div
      ref={rootRef}
      className={cn("adr", className)}
      onPointerDownCapture={(e) => act.current?.stop(e)}
      onKeyDownCapture={(e) => act.current?.stop(e)}
    >
      <style href="action-drum" precedence="default">
        {CSS}
      </style>
      <span className="adr-sr" role="status" aria-live="polite">
        {say}
      </span>

      <div className="adr-card" role="group" aria-labelledby={`${id}-title`} data-state={isDone ? "done" : "idle"} data-tone={tone}>
        <div className="adr-who">
          <span className="adr-q" aria-hidden>
            {agent.charAt(0).toUpperCase()}
          </span>
          <span>
            <b>{agent}</b> wants to {action}
          </span>
        </div>
        <h3 className="adr-title" id={`${id}-title`}>
          {title}
        </h3>
        {subtitle && <p className="adr-sub">{subtitle}</p>}

        <div
          ref={drumRef}
          className="adr-drum"
          data-done={isDone || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div ref={barRef} className="adr-bar" aria-hidden>
            <i className="adr-soft" />
            <i className="adr-full" />
          </div>
          <div ref={rowsRef} className="adr-rows" aria-hidden>
            {options.map((o) => (
              <div key={o.id} className="adr-row" data-tone={o.tone === "accent" ? "accent" : undefined}>
                <span>{o.label}</span>
              </div>
            ))}
          </div>
          <div className="adr-res" aria-hidden data-tone={doneOpt.tone === "accent" ? "accent" : undefined}>
            <CheckIcon />
            <span>{doneOpt.doneLabel}</span>
          </div>
          <button
            ref={goRef}
            type="button"
            className="adr-go"
            aria-label={isDone ? opt.doneLabel : opt.label}
            aria-describedby={`${activeId} ${id}-hint`}
            aria-disabled={isDone || undefined}
            aria-keyshortcuts="ArrowUp ArrowDown Enter"
            onKeyDown={onKeyDown}
            onClick={(e) => {
              // Keyboard / assistive activation confirms the verb the drum is heading for, even mid-roll.
              if (e.detail === 0) act.current?.commit(clamp(Math.round(target.current), 0, n - 1))
            }}
          >
            <span className="adr-chip" aria-hidden>
              <ArrowIcon />
            </span>
          </button>
          <span className="adr-sr" id={`${id}-hint`}>
            {isDone ? "Confirmed." : `Option ${shown + 1} of ${n}. Press the up and down arrow keys to choose, then Enter to confirm.`}
          </span>
        </div>

        <div className="adr-conseq">
          {options.map((o, i) => {
            const onSel = !isDone && shown === i
            const onDone = isDone && shown === i
            return (
              <React.Fragment key={o.id}>
                <p id={`${id}-c${i}`} className="adr-line" data-on={onSel || undefined} aria-hidden={!onSel}>
                  <b>{o.consequence}</b>
                  {o.consequenceDetail && <span>{o.consequenceDetail}</span>}
                </p>
                <p id={`${id}-d${i}`} className="adr-line" data-on={onDone || undefined} aria-hidden={!onDone}>
                  <b>{o.doneConsequence}</b>
                  {o.doneDetail && <span>{o.doneDetail}</span>}
                </p>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
