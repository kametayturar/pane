"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ThoughtStep = {
  /** What was worked out, e.g. "Pro, 40 seats × $18". */
  label: string
  /** The number or short result that settles on the card, e.g. "$720". */
  value: string
  /** Small text after the value, e.g. "a month". */
  unit?: string
}

export type ThoughtAnswer = {
  /** The answer in a few words. Use "\n" to choose where the line breaks. */
  headline: string
  /** One supporting line under the headline. */
  detail?: string
}

export type ThoughtDoneInfo = { steps: number; seconds?: number }

export type ThoughtStackProps = {
  /** The question above the deck. Leave it out (with your own data) to hide it. */
  question?: string
  /** Reasoning steps in order. Add one at a time as the model reasons and each is dealt onto the deck. */
  steps?: ThoughtStep[]
  /** Set it when the answer arrives: the answer card springs forward and the steps tuck underneath. */
  answer?: ThoughtAnswer | null
  /** Seconds the model thought, shown in the footer once answered. */
  thoughtFor?: number
  /** Footer text while thinking. */
  thinkingLabel?: string
  /** Footer text once answered. A string, or a function of the step count and seconds. */
  doneLabel?: string | ((info: ThoughtDoneInfo) => string)
  /** Controlled: the reasoning is fanned open below the answer. */
  fanned?: boolean
  /** Starting state when uncontrolled. */
  defaultFanned?: boolean
  onFannedChange?: (fanned: boolean) => void
  /** Label of the button that fans the steps open. */
  showLabel?: string
  /** Label of the button that tucks them away again. */
  hideLabel?: string
  /** Shows a replay button; called on click. The built-in demo replays itself even without it. */
  onReplay?: () => void
  replayLabel?: string
  /** Heading level of the answer, so it nests under your page's headings. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const DEMO: Required<Pick<ThoughtStackProps, "question" | "steps" | "thoughtFor">> & { answer: ThoughtAnswer } = {
  question: "Which plan is cheaper for Northwind’s 40 seats?",
  steps: [
    { label: "Pro, 40 seats × $18", value: "$720", unit: "a month" },
    { label: "Team, flat rate up to 50 seats", value: "$600", unit: "a month" },
    { label: "The difference", value: "$120", unit: "a month" },
  ],
  answer: { headline: "Team saves $120\na month.", detail: "That is $1,440 a year across 40 seats." },
  thoughtFor: 3,
}
const PLACEHOLDER: ThoughtAnswer = { headline: "The answer\nis on its way.", detail: "One supporting line." }

/** A damped spring sampled into a CSS linear() easing: the answer lands with a small overshoot. */
function springEasing() {
  const k = 170
  const c = 17
  const n = 56
  const pts: number[] = []
  let x = 0
  let v = 0
  let t = 0
  for (let i = 0; i <= n; i++) {
    const target = i / n
    while (t < target) {
      const h = 0.001
      v += (-k * (x - 1) - c * v) * h
      x += v * h
      t += h
    }
    pts.push(i === n ? 1 : +x.toFixed(4))
  }
  return `linear(${pts.join(",")})`
}
const SPRING = springEasing()

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tks {
  --tks-ink: #000;
  --tks-surface: #fff;
  --tks-accent: #0060e2;
  --tks-t1: color-mix(in oklab, var(--tks-ink) 88%, transparent);
  --tks-t2: color-mix(in oklab, var(--tks-ink) 61%, transparent);
  --tks-t3: color-mix(in oklab, var(--tks-ink) 45%, transparent);
  --tks-t4: color-mix(in oklab, var(--tks-ink) 27%, transparent);
  --tks-fill: color-mix(in oklab, var(--tks-ink) 6%, transparent);
  --tks-line: color-mix(in oklab, var(--tks-ink) 6%, transparent);
  --tks-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --tks-lift: 0 14px 28px -14px rgb(0 0 0 / .16);
  --tks-rim: 0 0 0 0 transparent;
  --tks-back: var(--tks-surface);
  --tks-ease: cubic-bezier(.22, 1, .36, 1);
  --tks-sh: 96px;
  position: relative; container-type: inline-size; width: 100%; max-width: 440px;
  font: 13px/20px var(--tks-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tks-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .tks {
  --tks-ink: #fff;
  --tks-surface: #1c1c1e;
  --tks-accent: #4d8dff;
  --tks-t1: color-mix(in oklab, var(--tks-ink) 90%, transparent);
  --tks-t2: color-mix(in oklab, var(--tks-ink) 62%, transparent);
  --tks-t3: color-mix(in oklab, var(--tks-ink) 46%, transparent);
  --tks-t4: color-mix(in oklab, var(--tks-ink) 28%, transparent);
  --tks-fill: color-mix(in oklab, var(--tks-ink) 8%, transparent);
  --tks-line: color-mix(in oklab, var(--tks-ink) 8%, transparent);
  --tks-shadow: 0 0 0 .5px rgb(255 255 255 / .14), 0 1px 2px 0 rgb(0 0 0 / .4);
  --tks-lift: 0 14px 28px -14px rgb(0 0 0 / .55);
  --tks-rim: inset 0 1px 0 rgb(255 255 255 / .06);
  --tks-back: color-mix(in oklab, var(--tks-surface), #fff 4%);
}
.tks *, .tks *::before, .tks *::after { box-sizing: border-box }
:where(.tks) :is(p, h2, h3, h4, h5, h6) { margin: 0 }
:where(.tks) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.tks :focus-visible { outline: 2px solid color-mix(in oklab, var(--tks-accent) 60%, transparent); outline-offset: 1px }
.tks-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Glass: the answer card is the one glass surface; the cards behind it stay near-solid (no glass on glass). */
html[data-style="glass"] .tks {
  --tks-ink: var(--pane-ink); --tks-surface: var(--pane-solid); --tks-accent: var(--pane-accent); --tks-ease: var(--pane-ease); --tks-font: var(--pane-font);
  --tks-t1: var(--pane-t1); --tks-t2: var(--pane-t2); --tks-t3: var(--pane-t3); --tks-t4: var(--pane-t4);
  --tks-back: color-mix(in oklab, var(--pane-solid) 86%, transparent); --tks-rim: 0 0 0 0 transparent;
}
html[data-style="glass"] .tks-c.tks-ans { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .tks-c.tks-ans { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .tks-c.tks-ans { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .tks-c.tks-ans { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .tks-c.tks-ans { background-color: var(--pane-solid); -webkit-backdrop-filter: none; backdrop-filter: none }
}

.tks-q { padding: 0 4px; font-size: 15px; line-height: 22px; font-weight: 500; color: var(--tks-t2); text-wrap: balance }

/* Deck: every card sits in the same grid cell; the answer card sets the height */
.tks-stage {
  display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 16px; padding-bottom: 28px;
  transition: padding-bottom 620ms var(--tks-ease), opacity 240ms var(--tks-ease);
}
.tks-stage[data-instant] { transition: opacity 240ms var(--tks-ease) }
.tks-stage[data-fade] { opacity: 0 }
.tks[data-fan] .tks-stage { padding-bottom: calc(var(--tks-n, 3) * (var(--tks-sh) + 8px) + 4px) }
.tks-c {
  position: relative; grid-area: 1 / 1; align-self: start; height: var(--tks-h, 168px); border-radius: 20px;
  background: var(--tks-back); box-shadow: var(--tks-shadow), var(--tks-lift);
  transform-origin: 50% 100%;
  transition: transform 620ms var(--tks-ease), opacity 200ms var(--tks-ease), filter 320ms var(--tks-ease), height 620ms var(--tks-ease);
}
.tks-stage[data-instant] .tks-c, .tks-stage[data-instant] .tks-c.tks-ans[data-p] { transition: none }
.tks-c[data-mount] { animation: tks-deal 620ms var(--tks-ease) calc(var(--i, 0) * 80ms) backwards }
.tks-c[data-p="in"] { transform: translateY(26px) scale(.95); opacity: 0; filter: blur(6px) }
.tks-c[data-p="f"] { transform: none; opacity: 1; filter: none }
.tks-c[data-p="b1"] { transform: translateY(14px) scale(.95); opacity: 1; filter: none }
.tks-c[data-p="b2"] { transform: translateY(28px) scale(.9); opacity: 1; filter: none }
.tks-c[data-p="b3"] { transform: translateY(40px) scale(.86); opacity: 0; filter: none }
.tks-c[data-p="fan"] {
  transform: translateY(calc(var(--tks-h, 168px) + 12px + var(--i, 0) * (var(--tks-sh) + 8px)));
  opacity: 1; filter: none; height: var(--tks-sh);
}

.tks-step { display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 14px 28px; min-width: 0 }
.tks-step > * { flex: none; min-width: 0 }
.tks-lbl { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--tks-t2); overflow-wrap: anywhere }
.tks-val { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 8px }
.tks-num { font-size: 36px; line-height: 44px; font-weight: 500; letter-spacing: -.025em; color: var(--tks-t1); font-variant-numeric: tabular-nums; overflow-wrap: anywhere }
.tks-unit { font-size: 15px; line-height: 22px; color: var(--tks-t2); overflow-wrap: anywhere }

.tks-ans { z-index: 1; display: flex; flex-direction: column; justify-content: center; height: auto; min-height: 168px; padding: 24px 28px; box-shadow: var(--tks-shadow), var(--tks-lift), var(--tks-rim) }
.tks-ans[data-p="in"] { visibility: hidden }
.tks-h { font-size: 36px; line-height: 1.12; font-weight: 500; letter-spacing: -.025em; color: var(--tks-t1); text-wrap: pretty; overflow-wrap: anywhere }
.tks-w { display: inline-block }
.tks-sub { margin-top: 8px; font-size: 15px; line-height: 22px; color: var(--tks-t2); text-wrap: pretty }
.tks-wave .tks-w { animation: tks-word 460ms var(--tks-ease) calc(120ms + var(--w, 0) * 70ms) backwards }
.tks-wave .tks-sub { animation: tks-word 520ms var(--tks-ease) 520ms backwards }
@supports (transition-timing-function: linear(0, 1)) {
  .tks-ans { --tks-spring: ${SPRING} }
  .tks-ans[data-p="f"] { transition: transform 1000ms var(--tks-spring), opacity 200ms var(--tks-ease), filter 320ms var(--tks-ease) }
}

/* Footer */
.tks-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px; min-height: 28px; margin-top: 16px; padding: 0 4px }
.tks-status { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--tks-t2) }
.tks-pulse { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tks-accent) }
.tks[data-s="think"] .tks-pulse { animation: tks-pulse 700ms ease-in-out infinite alternate }
.tks[data-s="done"] .tks-pulse { background: var(--tks-t3) }
.tks[data-idle] .tks-pulse { animation-play-state: paused }
.tks-acts { display: flex; align-items: center; gap: 4px; margin-left: auto }
.tks-btn {
  display: inline-flex; align-items: center; height: 28px; padding: 0 8px; border-radius: 8px; white-space: nowrap;
  font-weight: 500; color: var(--tks-accent); transition: background-color .16s, transform .16s var(--tks-ease);
}
.tks-btn[data-quiet] { color: var(--tks-t2) }
.tks-btn[data-quiet]:hover { color: var(--tks-t1) }
.tks-btn:hover { background: var(--tks-fill) }
.tks-btn:active { transform: scale(.97) }

@keyframes tks-deal { from { transform: translateY(26px) scale(.95); opacity: 0; filter: blur(6px) } }
@keyframes tks-word { from { opacity: 0; filter: blur(6px); transform: translateY(6px) } }
@keyframes tks-pulse { from { opacity: 1 } to { opacity: .3 } }

@container (max-width: 400px) {
  .tks-step { padding: 14px 20px }
  .tks-ans { padding: 20px }
  .tks-h { font-size: 30px }
}
@container (max-width: 370px) {
  .tks-status { flex-basis: 100% }
  .tks-acts { margin-left: -8px }
}
@media (pointer: coarse) { .tks-btn { height: 40px } }
@media (prefers-reduced-motion: reduce) {
  .tks *, .tks *::before, .tks *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const reduceQuery = "(prefers-reduced-motion: reduce)"
const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia(reduceQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduce = () => window.matchMedia(reduceQuery).matches

const subscribeHidden = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}
const getHidden = () => document.hidden
const subscribeNever = () => () => {}

type Pose = "in" | "f" | "b1" | "b2" | "b3"
/** Pose from the front of the deck backwards: depth 0 is on top, negative has not been dealt yet. */
const poseFor = (depth: number): Pose => (depth < 0 ? "in" : depth === 0 ? "f" : depth === 1 ? "b1" : depth === 2 ? "b2" : "b3")

const defaultDone = ({ steps, seconds }: ThoughtDoneInfo) =>
  `Thought${seconds !== undefined ? ` for ${seconds} s` : ""} · ${steps} ${steps === 1 ? "step" : "steps"}`

type Sim = { n: number; ans: boolean }
const FINAL: Sim = { n: DEMO.steps.length, ans: true }
const EMPTY: Sim = { n: 0, ans: false }

/* -------------------------------------------------------------------------- */
/*                                ThoughtStack                                */
/* -------------------------------------------------------------------------- */

export function ThoughtStack(props: ThoughtStackProps) {
  const {
    steps: stepsProp,
    answer: answerProp,
    thoughtFor: thoughtForProp,
    thinkingLabel = "Thinking",
    doneLabel = defaultDone,
    fanned: fannedProp,
    defaultFanned = false,
    onFannedChange,
    showLabel = "Show steps",
    hideLabel = "Hide steps",
    onReplay,
    replayLabel = "Ask again",
    headingLevel = 3,
    className,
  } = props
  const driven = stepsProp !== undefined || answerProp !== undefined
  const question = props.question ?? (driven ? undefined : DEMO.question)
  const thoughtFor = driven ? thoughtForProp : (thoughtForProp ?? DEMO.thoughtFor)

  const id = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const ansRef = React.useRef<HTMLElement>(null)
  const reduce = React.useSyncExternalStore(subscribeReduce, getReduce, () => false)

  /* ---- built-in simulation: starts as the final still, plays when on screen ---- */
  // null until the simulation has played: server render, reduced motion and hidden tabs show the final answer,
  // a live browser tab shows the empty deck the prototype starts from.
  const [simState, setSimState] = React.useState<Sim | null>(null)
  const simRef = React.useRef<Sim | null>(null)
  const setSim = React.useCallback((next: Sim) => {
    simRef.current = next
    setSimState(next)
  }, [])
  const mounted = React.useSyncExternalStore(subscribeNever, () => true, () => false)
  const tabHidden = React.useSyncExternalStore(subscribeHidden, getHidden, () => false)
  const [instant, setInstant] = React.useState(false)
  const [fade, setFade] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [fanInner, setFanInner] = React.useState(defaultFanned)
  const [engaged, setEngaged] = React.useState(false)
  const autoRef = React.useRef(true)
  const timers = React.useRef<number[]>([])

  const stop = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setInstant(false)
  }, [])

  const start = React.useCallback(
    function run() {
      stop()
      const at = (ms: number, fn: () => void) => {
        timers.current.push(window.setTimeout(fn, ms))
      }
      const deal = () => {
        at(100, () => setSim({ n: 1, ans: false }))
        at(900, () => setSim({ n: 2, ans: false }))
        at(1700, () => setSim({ n: 3, ans: false }))
        at(2700, () => setSim({ n: 3, ans: true }))
        at(7400, () => {
          if (autoRef.current) run()
        })
      }
      const reset = () => {
        setInstant(true)
        setFade(false)
        setFanInner(false)
        setSim(EMPTY)
        at(60, () => setInstant(false))
        deal()
      }
      // An empty deck is dealt straight away; anything else fades out first.
      const cur = simRef.current
      if (!cur || (cur.n === 0 && !cur.ans)) reset()
      else {
        setFade(true)
        at(260, reset)
      }
    },
    [stop, setSim],
  )

  const active = !driven && visible && !tabHidden && !reduce
  React.useEffect(() => {
    if (!active) return
    // The viewer took over: never restart, just leave the deck on the finished answer.
    const t = window.setTimeout(() => {
      if (autoRef.current) start()
      else setSim(FINAL)
    }, 160)
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [active, start, stop, setSim])

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ---- what is on the deck ---- */
  const steps = driven ? (stepsProp ?? []) : DEMO.steps
  const sim = simState ?? (mounted && !reduce && !tabHidden ? EMPTY : FINAL)
  const dealt = driven ? steps.length : sim.n
  const hasAnswer = driven ? !!answerProp : sim.ans
  const liveAnswer = driven ? answerProp : DEMO.answer

  // Keep the last answer on the (hidden) answer card so the deck keeps its height while thinking again.
  const [shown, setShown] = React.useState<ThoughtAnswer | null>(liveAnswer ?? null)
  if (liveAnswer && liveAnswer !== shown) setShown(liveAnswer)
  const answer = liveAnswer ?? shown ?? PLACEHOLDER

  // A new wave of word animations every time the answer arrives (never on first paint).
  const [prevHas, setPrevHas] = React.useState(hasAnswer)
  const [wave, setWave] = React.useState(0)
  if (hasAnswer !== prevHas) {
    setPrevHas(hasAnswer)
    if (hasAnswer) setWave((w) => w + 1)
  }

  const canFan = hasAnswer && dealt > 0
  const fanned = (fannedProp ?? fanInner) && canFan
  const toggleFan = () => {
    const next = !fanned
    if (fannedProp === undefined) setFanInner(next)
    onFannedChange?.(next)
  }

  const canReplay = !driven || !!onReplay
  const engage = () => {
    autoRef.current = false
    setEngaged(true)
  }
  const replay = () => {
    engage()
    if (!driven) start()
    onReplay?.()
  }

  // Cards are as tall as the answer card, and a fanned step is as tall as the tallest step's content:
  // measure both and let CSS do the rest.
  const sig = steps.map((s) => `${s.label}|${s.value}|${s.unit ?? ""}`).join("\n")
  React.useLayoutEffect(() => {
    const a = ansRef.current
    const s = stageRef.current
    if (!a || !s) return
    const set = (name: string, px: number) => {
      const v = `${Math.ceil(px)}px`
      if (s.style.getPropertyValue(name) !== v) s.style.setProperty(name, v)
    }
    const write = () => {
      set("--tks-h", a.offsetHeight)
      let need = 96
      s.querySelectorAll<HTMLElement>(".tks-step").forEach((el) => {
        let h = 28 + (el.children.length - 1) * 2
        for (const k of Array.from(el.children) as HTMLElement[]) h += k.offsetHeight
        need = Math.max(need, h)
      })
      set("--tks-sh", need)
    }
    write()
    const ro = new ResizeObserver(write)
    ro.observe(a)
    ro.observe(s)
    s.querySelectorAll(".tks-step > *").forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [sig])

  const seconds = thoughtFor
  const status = hasAnswer
    ? typeof doneLabel === "function"
      ? doneLabel({ steps: dealt, seconds })
      : doneLabel
    : thinkingLabel
  // The looping demo stays silent until the viewer takes over; real data is always announced.
  const announce =
    !driven && !engaged ? "" : hasAnswer ? `${answer.headline.replace(/\n/g, " ")} ${answer.detail ?? ""} ${status}`.trim() : status
  const Heading = `h${headingLevel}` as "h3"

  const lines = answer.headline.split("\n")
  let w = 0

  return (
    <div
      ref={rootRef}
      className={cn("tks", className)}
      role="group"
      aria-labelledby={question ? `${id}-q` : undefined}
      aria-label={question ? undefined : "Reasoning and answer"}
      data-s={hasAnswer ? "done" : "think"}
      data-fan={fanned || undefined}
      data-idle={!visible || tabHidden || undefined}
      onPointerDownCapture={engage}
      onKeyDownCapture={engage}
    >
      <style href="thought-stack" precedence="default">
        {CSS}
      </style>

      {question && (
        <p className="tks-q" id={`${id}-q`}>
          {question}
        </p>
      )}

      <div
        ref={stageRef}
        id={`${id}-stage`}
        className="tks-stage"
        data-instant={instant || undefined}
        data-fade={fade || undefined}
        style={{ "--tks-n": steps.length } as React.CSSProperties}
      >
        <section
          ref={ansRef}
          className={cn("tks-c tks-ans", wave > 0 && "tks-wave")}
          data-p={hasAnswer ? "f" : "in"}
          data-mount={driven || undefined}
          aria-label="Answer"
          style={{ "--i": steps.length } as React.CSSProperties}
        >
          <Heading className="tks-h" key={`h${wave}`}>
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                {line.split(" ").map((word, wi) => (
                  <React.Fragment key={wi}>
                    {wi > 0 && " "}
                    <span className="tks-w" style={{ "--w": w++ } as React.CSSProperties}>
                      {word}
                    </span>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </Heading>
          {answer.detail && (
            <p className="tks-sub" key={`p${wave}`}>
              {answer.detail}
            </p>
          )}
        </section>

        {steps.map((s, i) => {
          const pose = fanned ? "fan" : poseFor(dealt - 1 - i + (hasAnswer ? 1 : 0))
          return (
            <div
              key={i}
              className="tks-c tks-step"
              data-p={pose}
              data-mount={driven || undefined}
              style={{ "--i": i } as React.CSSProperties}
              aria-hidden={!fanned}
            >
              <span className="tks-lbl">{s.label}</span>
              <span className="tks-val">
                <span className="tks-num">{s.value}</span>
                {s.unit && <span className="tks-unit">{s.unit}</span>}
              </span>
            </div>
          )
        })}
      </div>

      <div className="tks-foot">
        <span className="tks-status">
          <i className="tks-pulse" aria-hidden />
          {status}
        </span>
        <span className="tks-acts">
          {canFan && (
            <button type="button" className="tks-btn" data-quiet aria-expanded={fanned} aria-controls={`${id}-stage`} onClick={toggleFan}>
              {fanned ? hideLabel : showLabel}
            </button>
          )}
          {canReplay && (
            <button type="button" className="tks-btn" onClick={replay}>
              {replayLabel}
            </button>
          )}
        </span>
      </div>

      <p className="tks-sr" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
