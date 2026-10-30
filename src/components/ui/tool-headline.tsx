"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ToolHeadlineStep = {
  /** Short name of the tool, shown on its receipt, e.g. "Help center". */
  name: string
  /** The part of the verb that never changes, e.g. "Search". */
  stem: string
  /** Ending while the tool runs, e.g. "ing" (Searching). */
  ing: string
  /** Ending once it is done, e.g. "ed" (Searched). Use "" when the past tense is the stem, as in Read. */
  ed: string
  /**
   * The second line of the headline, e.g. "the Help center". Keep it to about 15 characters: a longer line steps its
   * headline down to 60% of the size to fit, and is cut with an ellipsis beyond that.
   */
  object: string
  /** What the tool found. Shown under the headline when the tool finishes, then on its receipt. */
  result: string
}

export type ToolHeadlineAnswer = {
  /** The one-line result the receipts settle under, e.g. "Refund $49.00". About 15 characters fit at full size; longer steps down to 60%, then is cut. */
  title: string
  /** The line under it, e.g. "To Visa ····4242". */
  result?: string
}

export type ToolHeadlineProps = {
  /** Who is working. Default "Sage". */
  agent?: string
  /** Small line next to the agent. Default "Dana's refund". Pass "" to hide it. */
  context?: string
  /** The tools in the order they run. Default: Help center, Billing, refund-policy.pdf. */
  steps?: ToolHeadlineStep[]
  /** What the run ends on. Default "Refund $49.00" over "To Visa ····4242". */
  answer?: ToolHeadlineAnswer
  /** Quiet line at the bottom. Default "Nothing is sent to Dana until you approve". Pass "" to hide it. */
  note?: string
  /** Status at the top right while tools run. Default "Working". */
  workingLabel?: string
  /** Status at the top right once the answer is there. Default "Answer ready". */
  readyLabel?: string
  /** With `current={-1}`: the quiet headline shown before the first tool starts, split at its first space. Default "Waiting for a tool". */
  waitingLabel?: string
  /**
   * Drive it with real data: the index of the tool in use now. -1 is "nothing yet"; `steps.length` shows the answer.
   * Setting it turns the built-in simulation off.
   */
  current?: number
  /** With `current`: is that tool still "running" or "done"? Default "running". */
  status?: "running" | "done"
  /** Play the built-in loop until the first interaction. Default: on when `current` is not set. */
  autoPlay?: boolean
  /** Called when the person presses Replay. Without `current` the built-in run plays once more by itself. */
  onReplay?: () => void
  /** Name announced for the whole card. Default "<agent> is answering". */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

/** A damped spring as a CSS `linear()` easing: the headline settles into its receipt with a small overshoot. */
const spring = (z = 0.8, w = 13, n = 56) => {
  const wd = w * Math.sqrt(1 - z * z)
  const out: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const v = 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
    out.push(i === n ? 1 : +v.toFixed(4))
  }
  return `linear(${out.join(",")})`
}
const SPRING = spring()

const CSS = `
.tlh {
  --tlh-ink: #000;
  --tlh-surface: #fff;
  --tlh-accent: #0060e2;
  --tlh-t1: color-mix(in oklab, var(--tlh-ink) 88%, transparent);
  --tlh-t2: color-mix(in oklab, var(--tlh-ink) 61%, transparent);
  --tlh-t3: color-mix(in oklab, var(--tlh-ink) 45%, transparent);
  --tlh-t4: color-mix(in oklab, var(--tlh-ink) 27%, transparent);
  --tlh-fill: color-mix(in oklab, var(--tlh-ink) 6%, transparent);
  --tlh-line: color-mix(in oklab, var(--tlh-ink) 6%, transparent);
  --tlh-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --tlh-drop: 0 24px 48px -24px rgb(0 0 0 / .12);
  --tlh-ease: cubic-bezier(.22, 1, .36, 1);
  --tlh-sp: ${SPRING};
  --tlh-hw: 600; --tlh-ls: -.034em; --tlh-div: 8.15; --tlh-hmin: 36px; --tlh-hmax: 56px;
  position: relative; container-type: inline-size; width: 100%; max-width: 520px;
  font: 13px/18px var(--tlh-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tlh-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
@supports not (transition-timing-function: linear(0, 1)) { .tlh { --tlh-sp: var(--tlh-ease) } }
:is(.dark, [data-theme="dark"]) .tlh {
  --tlh-ink: #fff;
  --tlh-surface: #1c1c1e;
  --tlh-accent: #4d8dff;
  --tlh-t1: color-mix(in oklab, var(--tlh-ink) 90%, transparent);
  --tlh-t2: color-mix(in oklab, var(--tlh-ink) 62%, transparent);
  --tlh-t3: color-mix(in oklab, var(--tlh-ink) 46%, transparent);
  --tlh-t4: color-mix(in oklab, var(--tlh-ink) 28%, transparent);
  --tlh-fill: color-mix(in oklab, var(--tlh-ink) 8%, transparent);
  --tlh-line: color-mix(in oklab, var(--tlh-ink) 9%, transparent);
  --tlh-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --tlh-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, a hairline, a monospaced face (wider, so the headline is set smaller), a plain ease instead of the spring */
html[data-style="mono"] .tlh {
  --tlh-ink: #000; --tlh-surface: #fff; --tlh-accent: #111;
  --tlh-shadow: 0 0 0 1px rgb(0 0 0 / .14); --tlh-drop: 0 0 0 0 transparent;
  --tlh-ease: cubic-bezier(.2, .9, .1, 1); --tlh-sp: var(--tlh-ease);
  --tlh-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --tlh-hw: 500; --tlh-ls: -.02em; --tlh-div: 9.6; --tlh-hmin: 30px; --tlh-hmax: 46px;
}
html[data-style="mono"].dark .tlh { --tlh-ink: #fff; --tlh-surface: #0a0a0a; --tlh-accent: #f2f2f2; --tlh-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .tlh-card { border-radius: 8px }
html[data-style="mono"] .tlh-re { border-radius: 4px }

/* Glass: the card carries the frost; the headline and receipts sit on it in the Pane glass inks */
html[data-style="glass"] .tlh {
  --tlh-ink: var(--pane-ink); --tlh-surface: var(--pane-solid); --tlh-accent: var(--pane-accent); --tlh-shadow: var(--pane-shadow);
  --tlh-drop: 0 0 0 0 transparent; --tlh-ease: var(--pane-ease); --tlh-font: var(--pane-font);
  --tlh-t1: var(--pane-t1); --tlh-t2: var(--pane-t2); --tlh-t3: var(--pane-t3); --tlh-t4: var(--pane-t4);
}
html[data-style="glass"] .tlh-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .tlh-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .tlh-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .tlh-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .tlh-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .tlh-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.tlh *, .tlh *::before, .tlh *::after { box-sizing: border-box }
:where(.tlh) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.tlh) p { margin: 0 }
.tlh-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.tlh-card { --tlh-pad: 32px; padding: 26px var(--tlh-pad) 22px; border-radius: 24px; background: var(--tlh-surface); box-shadow: var(--tlh-shadow), var(--tlh-drop) }

/* Header: who is working, and the status that swaps in place */
.tlh-meta { display: flex; justify-content: space-between; gap: 12px; font-weight: 500; line-height: 18px; color: var(--tlh-t3) }
.tlh-who { display: flex; gap: 8px; min-width: 0; white-space: nowrap }
.tlh-who b { font-weight: 600; color: var(--tlh-t2) }
.tlh-st { display: grid; justify-items: end }
.tlh-st > span {
  grid-area: 1 / 1; white-space: nowrap; opacity: 0; filter: blur(5px); transform: translateY(-4px);
  transition: opacity .2s var(--tlh-ease), filter .2s var(--tlh-ease), transform .2s var(--tlh-ease);
}
.tlh-st > .tlh-ready { color: var(--tlh-accent); transform: translateY(5px) }
.tlh-st > span[data-on] {
  opacity: 1; filter: none; transform: none;
  transition: opacity .42s var(--tlh-ease) .08s, filter .42s var(--tlh-ease) .08s, transform .42s var(--tlh-ease) .08s;
}
/* "Answer ready" lands with the answer, not before it */
.tlh-st > .tlh-ready[data-on] {
  transition: opacity .42s var(--tlh-ease) .3s, filter .42s var(--tlh-ease) .3s, transform .42s var(--tlh-ease) .3s;
}

/*
 * The stage. Its height is worked out from the headline size and the number of tools, so it is the same from the first
 * frame to the last: tall enough for the running headline above the receipts, and for the answer above all of them.
 */
.tlh-stage {
  --tlh-h: clamp(var(--tlh-hmin), calc((100cqw - 2 * var(--tlh-pad)) / var(--tlh-div)), var(--tlh-hmax));
  --tlh-lh: calc(var(--tlh-h) * 1.0357);
  --tlh-row: 26px;
  --tlh-rec0: calc(var(--tlh-lh) * 2 + 28px + 14px);
  --tlh-ans0: calc(var(--tlh-lh) + 28px + 16px);
  --tlh-base: var(--tlh-rec0);
  position: relative; margin-top: 24px;
  height: max(calc(var(--tlh-rec0) + (var(--tlh-n) - 1) * var(--tlh-row)), calc(var(--tlh-ans0) + var(--tlh-n) * var(--tlh-row)));
  transition: opacity .24s var(--tlh-ease), filter .24s var(--tlh-ease);
}
.tlh-stage[data-ans] { --tlh-base: var(--tlh-ans0) }
.tlh-stage[data-out] { opacity: 0; filter: blur(6px) }
.tlh-stage[data-nt] *, .tlh-stage[data-nt] *::before { transition: none !important }

/* One headline block per tool. It shrinks and slides to its slot (--tlh-ty), where its receipt waits. */
.tlh-blk {
  --tlh-ty: calc(var(--tlh-base) + var(--tlh-i) * var(--tlh-row));
  position: absolute; left: 0; right: 0; top: 0; transform-origin: 0 0;
  transition: transform .52s var(--tlh-sp), opacity .34s var(--tlh-ease), filter .34s var(--tlh-ease);
}
.tlh-blk[data-s="hid"] { opacity: 0; filter: blur(8px); transform: translateY(18px); pointer-events: none }
.tlh-blk[data-s="trail"] {
  opacity: 0; transform: translateY(var(--tlh-ty)) scale(.5); pointer-events: none;
  transition: transform .52s var(--tlh-sp), opacity .1s var(--tlh-ease), filter .34s var(--tlh-ease);
}
/* the next headline blurs in a beat after the old one has gone, so the two never overlap */
.tlh-blk[data-s="run"] { transition: transform .52s var(--tlh-sp), opacity .34s var(--tlh-ease) .08s, filter .34s var(--tlh-ease) .08s }
.tlh-blk[data-s="wait"] { pointer-events: none }
.tlh-vb, .tlh-obj {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-bottom: .14em; margin-bottom: -.14em;
  font-size: calc(var(--tlh-h) * var(--tlh-fit, 1)); line-height: var(--tlh-lh); font-weight: var(--tlh-hw); letter-spacing: var(--tlh-ls);
}
/* The text itself, measured to step a long headline down so it fits (--tlh-fit is set per block) */
.tlh-w { display: inline-block; white-space: nowrap }
.tlh-blk[data-s="wait"] .tlh-vb, .tlh-blk[data-s="wait"] .tlh-obj { color: var(--tlh-t4) }
.tlh-vb { color: var(--tlh-t3); transition: color .42s var(--tlh-ease) }
.tlh-obj { color: var(--tlh-t1); transition: color .42s var(--tlh-ease) }
.tlh-blk[data-s="run"] .tlh-obj { color: var(--tlh-accent) }
.tlh-blk[data-s="done"] .tlh-vb, .tlh-blk[data-s="trail"] .tlh-vb { color: var(--tlh-t1) }
.tlh-blk[data-s="done"] .tlh-obj, .tlh-blk[data-s="trail"] .tlh-obj { color: var(--tlh-t3) }
.tlh-blk[data-s="done"] .tlh-ans { color: var(--tlh-accent) }

/* The verb's ending: both endings share one spot, the old one blurs up and out while the new one settles in */
.tlh-in { display: inline-grid; vertical-align: top }
.tlh-ing, .tlh-ed { grid-area: 1 / 1; transition: opacity .22s var(--tlh-ease), filter .22s var(--tlh-ease), transform .22s var(--tlh-ease) }
.tlh-ed { opacity: 0; filter: blur(4px); transform: translateY(6px) }
.tlh-blk[data-s="done"] .tlh-ing, .tlh-blk[data-s="trail"] .tlh-ing { opacity: 0; filter: blur(4px); transform: translateY(-5px) }
.tlh-blk[data-s="done"] .tlh-ed, .tlh-blk[data-s="trail"] .tlh-ed {
  opacity: 1; filter: none; transform: none;
  transition: opacity .42s var(--tlh-ease) .06s, filter .42s var(--tlh-ease) .06s, transform .42s var(--tlh-ease) .06s;
}

/* What the tool found, under the headline once it is done */
.tlh-res {
  margin-top: 6px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 15px; line-height: 22px; font-weight: 500; letter-spacing: -.008em; color: var(--tlh-t2);
  opacity: 0; filter: blur(5px); transform: translateY(6px);
  transition: opacity .1s var(--tlh-ease), filter .1s var(--tlh-ease), transform .1s var(--tlh-ease);
}
.tlh-blk[data-s="done"] .tlh-res {
  opacity: 1; filter: none; transform: none;
  transition: opacity .5s var(--tlh-ease) .1s, filter .5s var(--tlh-ease) .1s, transform .5s var(--tlh-ease) .1s;
}

/* Receipts: one line each, fading in where the shrinking headline lands */
.tlh-rec {
  --tlh-ty: calc(var(--tlh-base) + var(--tlh-i) * var(--tlh-row));
  position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 8px; max-width: 100%; height: 26px;
  font-size: 15px; line-height: 26px; font-weight: 500; letter-spacing: -.008em; color: var(--tlh-t3); white-space: nowrap;
  opacity: 0; pointer-events: none;
  transform: translateY(calc(var(--tlh-lh) * 2 + 34px));
  transition: transform .52s var(--tlh-sp), opacity .2s var(--tlh-ease);
}
.tlh-rec[data-on] { opacity: 1; transform: translateY(var(--tlh-ty)); transition: transform .52s var(--tlh-sp), opacity .34s var(--tlh-ease) .2s }
.tlh-ck { flex: none; color: var(--tlh-accent) }
.tlh-nm { flex: 0 100 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--tlh-t1) }
.tlh-rs { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--tlh-t2) }

/* Footer */
.tlh-foot { margin-top: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 18px; color: var(--tlh-t3) }
/* Out of the tab and accessibility trees until there is something to replay; the 30px target grows outward, so nothing moves */
.tlh-re {
  flex: none; margin: -6px -8px; padding: 6px 8px; border-radius: 8px; font-weight: 500; color: var(--tlh-accent);
  visibility: hidden; opacity: 0; transition: opacity .3s var(--tlh-ease), background-color .16s var(--tlh-ease), visibility 0s linear .3s;
}
.tlh-re[data-on] { visibility: visible; opacity: 1; transition: opacity .3s var(--tlh-ease), background-color .16s var(--tlh-ease), visibility 0s }
.tlh-re:focus-visible { outline: 2px solid var(--tlh-accent); outline-offset: 2px }
@media (hover: hover) { .tlh-re[data-on]:hover { background: var(--tlh-fill) } }

@container (max-width: 350px) { .tlh-foot { min-height: 36px; align-items: flex-start } }
@container (max-width: 440px) {
  .tlh-card { --tlh-pad: 20px; padding: 22px var(--tlh-pad) 18px; border-radius: 22px }
  .tlh-stage { margin-top: 20px }
}
@media (prefers-reduced-motion: reduce) {
  .tlh *, .tlh *::before, .tlh *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_STEPS: ToolHeadlineStep[] = [
  { name: "Help center", stem: "Search", ing: "ing", ed: "ed", object: "the Help center", result: "3 articles on refunds" },
  { name: "Billing", stem: "Quer", ing: "ying", ed: "ied", object: "Billing", result: "2 charges of $49.00" },
  { name: "Policy PDF", stem: "Read", ing: "ing", ed: "", object: "the policy PDF", result: "Page 2: duplicates refunded" },
]
const DEFAULT_ANSWER: ToolHeadlineAnswer = { title: "Refund $49.00", result: "To Visa ····4242" }

const RUN_MS = 900 // how long the built-in loop lets a tool run
const DONE_MS = 600 // how long a finished headline stays before the next tool takes over
const REST_MS = 3600 // how long it rests on the answer
const FADE_MS = 260
const GAP_MS = 70

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

/**
 * Where the run is, as one number: 0 nothing yet, 2i+1 tool i running, 2i+2 tool i done, 2n+1 the answer.
 * Every block, receipt and status is derived from it, so the picture can never disagree with itself.
 */
const posOf = (current: number, status: "running" | "done", n: number) =>
  current < 0 ? 0 : current >= n ? 2 * n + 1 : 2 * current + (status === "done" ? 2 : 1)

const MIN_FIT = 0.6 // a long headline steps down to this share of its size, then gets an ellipsis
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

const Check = () => (
  <svg className="tlh-ck" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M2.8 7.4l2.8 2.8 5.6-5.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                ToolHeadline                                */
/* -------------------------------------------------------------------------- */

type Stage = "play" | "out" | "reset"

export function ToolHeadline(props: ToolHeadlineProps) {
  const {
    agent = "Sage",
    context = "Dana's refund",
    steps: stepsProp,
    answer: answerProp,
    note = "Nothing is sent to Dana until you approve",
    workingLabel = "Working",
    readyLabel = "Answer ready",
    waitingLabel = "Waiting for a tool",
    current,
    status = "running",
    onReplay,
    label,
    className,
  } = props
  const steps = stepsProp && stepsProp.length > 0 ? stepsProp : DEFAULT_STEPS
  const answer = answerProp ?? DEFAULT_ANSWER
  const n = steps.length
  const END = 2 * n + 1
  const controlled = current !== undefined
  const autoPlay = props.autoPlay ?? !controlled

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)

  // The built-in run: one position, a stage for the fade between rounds, and whether the loop is still ours.
  const [p, setP] = React.useState(() => (controlled || !autoPlay ? END : 1))
  const [stage, setStage] = React.useState<Stage>("play")
  const [auto, setAuto] = React.useState(autoPlay)
  const [once, setOnce] = React.useState(false)
  const [onScreen, setOnScreen] = React.useState(true)
  const [visible, setVisible] = React.useState(true)
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Step a headline that is too long for the card down until it fits (never below MIN_FIT). Measured at full size, then set per block.
  const fitKey = steps.map((t) => t.stem + t.ing + t.ed + t.object).join("|") + "|" + answer.title + "|" + waitingLabel
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const fit = () => {
      root.querySelectorAll<HTMLElement>(".tlh-blk").forEach((b) => {
        b.style.setProperty("--tlh-fit", "1")
        let k = 1
        b.querySelectorAll<HTMLElement>(".tlh-w").forEach((w) => {
          const room = w.parentElement?.clientWidth ?? 0
          if (room > 0 && w.offsetWidth > room) k = Math.min(k, (room - 1) / w.offsetWidth)
        })
        b.style.setProperty("--tlh-fit", String(Math.max(MIN_FIT, Math.floor(k * 100) / 100)))
      })
    }
    fit()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    root.querySelectorAll(".tlh-w").forEach((w) => ro.observe(w))
    return () => ro.disconnect()
  }, [fitKey])

  const sim = !controlled
  const pos = controlled ? posOf(current, status, n) : reduce ? END : Math.min(p, END)
  const looping = sim && !reduce && auto

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!sim || reduce) return
    const el = rootRef.current
    if (!el) return
    const update = () => setVisible(document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    if (typeof IntersectionObserver === "undefined") return () => document.removeEventListener("visibilitychange", update)
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((x) => x.isIntersecting)))
    io.observe(el)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [sim, reduce])
  const active = onScreen && visible

  // The clock: plain timeouts, so every step lands even where animation frames never come. It carries on from where it paused.
  React.useEffect(() => {
    if (!sim || reduce || !active) return
    let id = 0
    if (stage === "play") {
      if (p < END) id = window.setTimeout(() => setP(p + 1), p % 2 === 1 ? RUN_MS : DONE_MS)
      else if (auto) id = window.setTimeout(() => setStage("out"), REST_MS)
    } else if (stage === "out") {
      // Someone took over while the card was fading out: bring the result back instead of starting another round.
      const again = auto || once
      id = window.setTimeout(
        () => {
          setStage(again ? "reset" : "play")
          if (again) setP(0)
        },
        again ? FADE_MS : 0,
      )
    } else {
      id = window.setTimeout(() => {
        setStage("play")
        setP(1)
        setOnce(false)
      }, GAP_MS)
    }
    return () => window.clearTimeout(id)
  }, [sim, reduce, active, stage, p, END, auto, once])

  const replay = () => {
    if (controlled) {
      onReplay?.()
      return
    }
    if (p !== END || stage !== "play") return
    setOnce(true)
    setStage("out")
    onReplay?.()
  }

  const stateOf = (i: number) => (pos < 2 * i + 1 ? "hid" : pos === 2 * i + 1 ? "run" : pos === 2 * i + 2 ? "done" : "trail")
  const ready = pos === END
  const canReplay = controlled ? ready && !!onReplay : !reduce && !auto && p === END && stage === "play"
  const waiting = controlled && pos === 0
  const wait = waitingLabel.indexOf(" ")
  const waitVerb = wait < 0 ? waitingLabel : waitingLabel.slice(0, wait)
  const waitObj = wait < 0 ? "" : waitingLabel.slice(wait + 1)
  const i = Math.min(n - 1, Math.max(0, (pos - 1) >> 1))
  const s = steps[i]
  const said =
    pos === 0
      ? waiting
        ? `${waitingLabel}.`
        : ""
      : ready
        ? `${answer.title}. ${answer.result ? answer.result + ". " : ""}${steps.map((t) => `${t.name}: ${t.result}.`).join(" ")} ${readyLabel}.`
        : pos % 2 === 1
          ? `${agent} is ${s.stem.toLowerCase()}${s.ing} ${s.object}.`
          : `${s.name}: ${s.result}.`

  return (
    <div
      ref={rootRef}
      className={cn("tlh", className)}
      // Only a press, key or focus that lands on the piece ends the built-in loop; the rest of the page can be clicked freely.
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) setAuto(false)
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) setAuto(false)
      }}
      onFocusCapture={() => setAuto(false)}
    >
      <style href="tool-headline" precedence="default">
        {CSS}
      </style>
      <p className="tlh-sr" role="status" aria-live={looping ? "off" : "polite"}>
        {said}
      </p>
      <div className="tlh-card" role="group" aria-label={label ?? `${agent} is answering`}>
        <div className="tlh-meta" aria-hidden>
          <div className="tlh-who">
            <b>{agent}</b>
            {context !== "" && <span>{context}</span>}
          </div>
          <div className="tlh-st">
            <span data-on={(pos > 0 && !ready) || undefined}>{workingLabel}</span>
            <span className="tlh-ready" data-on={ready || undefined}>
              {readyLabel}
            </span>
          </div>
        </div>

        <div
          className="tlh-stage"
          aria-hidden
          data-ans={ready || undefined}
          data-out={stage !== "play" || undefined}
          data-nt={stage === "reset" || undefined}
          style={{ "--tlh-n": n } as React.CSSProperties}
        >
          {steps.map((t, k) => (
            <React.Fragment key={k}>
              <div className="tlh-blk" data-s={stateOf(k)} style={{ "--tlh-i": k } as React.CSSProperties}>
                <div className="tlh-vb">
                  <span className="tlh-w">
                    {t.stem}
                    <span className="tlh-in">
                      <span className="tlh-ing">{t.ing}</span>
                      <span className="tlh-ed">{t.ed}</span>
                    </span>
                  </span>
                </div>
                <div className="tlh-obj">
                  <span className="tlh-w">{t.object}</span>
                </div>
                <div className="tlh-res">{t.result}</div>
              </div>
              <div className="tlh-rec" data-on={pos > 2 * k + 2 || undefined} style={{ "--tlh-i": k } as React.CSSProperties}>
                <Check />
                <span className="tlh-nm">{t.name}</span>
                <span className="tlh-rs">{t.result}</span>
              </div>
            </React.Fragment>
          ))}
          <div className="tlh-blk" data-s={waiting ? "wait" : "hid"} style={{ "--tlh-i": 0 } as React.CSSProperties}>
            <div className="tlh-vb">
              <span className="tlh-w">{waitVerb}</span>
            </div>
            <div className="tlh-obj">
              <span className="tlh-w">{waitObj}</span>
            </div>
          </div>
          <div className="tlh-blk" data-s={ready ? "done" : "hid"} style={{ "--tlh-i": 0 } as React.CSSProperties}>
            <div className="tlh-obj tlh-ans">
              <span className="tlh-w">{answer.title}</span>
            </div>
            {answer.result && <div className="tlh-res">{answer.result}</div>}
          </div>
        </div>

        <div className="tlh-foot">
          <span>{note}</span>
          <button type="button" className="tlh-re" data-on={canReplay || undefined} onClick={() => canReplay && replay()}>
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}
