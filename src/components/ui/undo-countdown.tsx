"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UndoCountdownOutcome = "committed" | "undone"

export type UndoCountdownProps = {
  /** Who acted. Default "Atlas". */
  agent?: string
  /** What it did, past tense. Default "archived". */
  action?: string
  /** How many things moved. The big number lands on it. Default 212; it reads best with three digits and a 1 in the middle. */
  count?: number
  /** Plural noun for the things moved. Default "newsletters". */
  noun?: string
  /** Where they are once the window closes. Default "Archive". */
  destination?: string
  /** Where they come back to when undone. Default "Inbox". */
  origin?: string
  /** Length of the undo window in seconds. Default 9. Passing it (or a callback) turns the built-in loop off. A real window starts counting when the card is first on screen and holds while the tab is hidden. */
  seconds?: number
  /** Play the built-in loop (archive once, undo once, repeat) until the first interaction. Default: on when no `seconds`, `onUndo` or `onCommit` is passed. */
  autoPlay?: boolean
  /** Hold the clock while the pointer or focus is on the card, so nobody loses the window by reading. Default true. */
  pauseOnHover?: boolean
  /** Also undo with Cmd/Ctrl+Z while the window is open (ignored in text fields). Default true. */
  shortcut?: boolean
  /** Called when the person undoes. Not called by the built-in loop. */
  onUndo?: () => void
  /** Called when the window closes and the action stands. Not called by the built-in loop. */
  onCommit?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.udc {
  --udc-ink: #000;
  --udc-surface: #fff;
  --udc-accent: #0060e2;
  --udc-t1: color-mix(in oklab, var(--udc-ink) 88%, transparent);
  --udc-t2: color-mix(in oklab, var(--udc-ink) 61%, transparent);
  --udc-t3: color-mix(in oklab, var(--udc-ink) 45%, transparent);
  --udc-t4: color-mix(in oklab, var(--udc-ink) 27%, transparent);
  --udc-fill: color-mix(in oklab, var(--udc-ink) 6%, transparent);
  --udc-line: color-mix(in oklab, var(--udc-ink) 6%, transparent);
  --udc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --udc-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --udc-ease: cubic-bezier(.22, 1, .36, 1);
  --udc-land: cubic-bezier(.3, 1.5, .5, 1);
  --udc-w: .66; --udc-ls: -.04em; --udc-hw: 600;
  position: relative; container-type: inline-size; width: 100%; max-width: 400px;
  font: 13px/20px var(--udc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--udc-t1); -webkit-font-smoothing: antialiased; text-align: center;
}
:is(.dark, [data-theme="dark"]) .udc {
  --udc-ink: #fff;
  --udc-surface: #1c1c1e;
  --udc-accent: #4d8dff;
  --udc-t1: color-mix(in oklab, var(--udc-ink) 90%, transparent);
  --udc-t2: color-mix(in oklab, var(--udc-ink) 62%, transparent);
  --udc-t3: color-mix(in oklab, var(--udc-ink) 46%, transparent);
  --udc-t4: color-mix(in oklab, var(--udc-ink) 28%, transparent);
  --udc-fill: color-mix(in oklab, var(--udc-ink) 8%, transparent);
  --udc-line: color-mix(in oklab, var(--udc-ink) 9%, transparent);
  --udc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --udc-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, a hairline, no soft shadow, a monospaced face (a digit is .6em wide there) */
html[data-style="mono"] .udc {
  --udc-ink: #000; --udc-surface: #fff; --udc-accent: #111;
  --udc-shadow: 0 0 0 1px rgb(0 0 0 / .14); --udc-drop: 0 0 0 0 transparent;
  --udc-ease: cubic-bezier(.2, .9, .1, 1); --udc-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --udc-w: .6; --udc-ls: 0; --udc-hw: 500;
}
html[data-style="mono"].dark .udc { --udc-ink: #fff; --udc-surface: #0a0a0a; --udc-accent: #f2f2f2; --udc-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .udc-card { border-radius: 8px }
html[data-style="mono"] .udc-un { border-radius: 4px }
html[data-style="mono"] .udc-lab { font-size: 15px }

/* Glass: the card carries the frost, the number and words sit on it in the Pane glass inks */
html[data-style="glass"] .udc {
  --udc-ink: var(--pane-ink); --udc-surface: var(--pane-solid); --udc-accent: var(--pane-accent); --udc-shadow: var(--pane-shadow);
  --udc-drop: 0 0 0 0 transparent; --udc-ease: var(--pane-ease); --udc-font: var(--pane-font);
  --udc-t1: var(--pane-t1); --udc-t2: var(--pane-t2); --udc-t3: var(--pane-t3); --udc-t4: var(--pane-t4);
}
html[data-style="glass"] .udc-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .udc-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .udc-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .udc-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .udc-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .udc-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.udc *, .udc *::before, .udc *::after { box-sizing: border-box }
:where(.udc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.udc) p { margin: 0 }
.udc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.udc-card {
  --udc-pad: 32px;
  padding: 28px var(--udc-pad) 30px; border-radius: 28px; background: var(--udc-surface); box-shadow: var(--udc-shadow), var(--udc-drop);
}
.udc-card:focus { outline: none }
.udc-cap { font-size: 15px; line-height: 20px; color: var(--udc-t2) }

/* The number. Sized in em so it scales with the card; clipped top and bottom so the 2s fall in from behind its edge. */
.udc-hero {
  font-size: min(clamp(88px, 33cqw, 132px), calc((100cqw - 2 * var(--udc-pad)) / (var(--udc-n, 3) * var(--udc-w) + .08)));
  height: 1.02em; margin-top: 14px; display: flex; justify-content: center; line-height: 1;
  font-weight: var(--udc-hw); letter-spacing: var(--udc-ls); font-feature-settings: "tnum" 1, "cv11" 1;
  color: var(--udc-accent); clip-path: inset(0 -40px 0 -40px); transition: color .5s var(--udc-ease);
}
.udc-card[data-phase="done"] .udc-hero { color: var(--udc-t1) }
.udc-slot { position: relative; display: grid; place-items: center; width: calc(var(--udc-w) * 1em) }
.udc-g { grid-area: 1 / 1 }
.udc-in { animation: udc-in .55s var(--udc-land) backwards }
.udc-out { animation: udc-out .3s var(--udc-ease) forwards }

/* The other digits: hidden while the window is open, then they arrive and stay */
.udc-o .udc-g { opacity: 0; transition: opacity .3s var(--udc-ease) }
.udc-card[data-phase="done"] .udc-o .udc-g { opacity: 1; animation: udc-fall .8s var(--udc-land) var(--d, 0ms) backwards }
.udc-card[data-outcome="undone"] .udc-o .udc-g { --y: 72px }
.udc-card[data-outcome="committed"] .udc-l { --d: calc(var(--k) * 70ms) }
.udc-card[data-outcome="committed"] .udc-r { --d: calc(90ms + var(--k) * 70ms) }
.udc-card[data-outcome="undone"] .udc-l { --d: calc(120ms + var(--k) * 70ms) }
.udc-card[data-outcome="undone"] .udc-r { --d: calc(var(--k) * 70ms) }

/* Label: the words under the number and both closing lines share one cell, so the cell is always as tall as the longest of them and the card never changes height */
.udc-lab { display: grid; margin-top: 10px; min-height: 28px; font-size: 17px; line-height: 24px }
.udc-lab > * {
  grid-area: 1 / 1; display: flex; align-items: center; justify-content: center; min-height: 28px;
  transition: opacity .35s var(--udc-ease), filter .35s var(--udc-ease), transform .45s var(--udc-ease), visibility 0s linear .45s;
}
.udc-win { gap: .3em; white-space: nowrap; color: var(--udc-t2) }
.udc-end { text-wrap: balance; color: var(--udc-t2); opacity: 0; visibility: hidden; filter: blur(6px); transform: translateY(8px); pointer-events: none }
.udc-card[data-phase="done"] .udc-win { opacity: 0; filter: blur(6px); transform: translateY(-8px); pointer-events: none }
.udc-card[data-phase="done"][data-outcome="committed"] .udc-end-c,
.udc-card[data-phase="done"][data-outcome="undone"] .udc-end-u { opacity: 1; visibility: visible; filter: none; transform: none; transition-delay: .2s, .2s, .2s, 0s }

.udc-un {
  position: relative; margin: -8px -6px; padding: 8px 6px; border-radius: 8px; color: var(--udc-accent); font-weight: 500; line-height: 1;
  text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 5px; transition: transform .16s var(--udc-ease);
}
.udc-un:hover { text-decoration-thickness: 2.5px }
.udc-un:active, .udc-un[data-pressed] { transform: scale(.95) }
.udc-un:focus-visible { outline: 2px solid var(--udc-accent); outline-offset: 2px }

@keyframes udc-in { from { opacity: 0; filter: blur(12px); transform: scale(.8) } }
@keyframes udc-out { to { opacity: 0; filter: blur(12px); transform: scale(1.2) } }
@keyframes udc-fall { from { opacity: 0; filter: blur(10px); transform: translateY(var(--y, -72px)) } 30% { opacity: 1 } to { opacity: 1; transform: none } }

@container (max-width: 388px) {
  .udc-card { --udc-pad: 20px; padding: 24px var(--udc-pad) 26px }
}
@media (pointer: coarse) { .udc-un::before { content: ""; position: absolute; inset: -6px -8px } }
@media (prefers-reduced-motion: reduce) {
  .udc *, .udc *::before, .udc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const SIM_MS = 3000 // the built-in loop uses a short window so the moment comes round quickly
const SCRIPT_MS = 2300 // where the built-in loop presses undo, in its second round
const REST_MS = 3000 // how long the built-in loop rests on the result
const TICK_MS = 80

type Phase = "open" | "done"
type Mid = { cur: string; prev: string | null; n: number }

const fmt = (n: number) => n.toLocaleString("en-US")
const digitFor = (leftMs: number) => Math.max(1, Math.ceil(leftMs / 1000))
const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

/** The digit of the count that the last second turns into: the 1 nearest the middle, or the middle digit if there is none. */
function anchorOf(ds: string[]) {
  const mid = (ds.length - 1) / 2
  let best = -1
  ds.forEach((d, i) => {
    if (d === "1" && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
  })
  return best >= 0 ? best : Math.floor(mid)
}

const isEditable = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

/* -------------------------------------------------------------------------- */
/*                               UndoCountdown                                */
/* -------------------------------------------------------------------------- */

export function UndoCountdown(props: UndoCountdownProps) {
  const {
    agent = "Atlas",
    action = "archived",
    count = 212,
    noun = "newsletters",
    destination = "Archive",
    origin = "Inbox",
    seconds = 9,
    pauseOnHover = true,
    shortcut = true,
    onUndo,
    onCommit,
    className,
  } = props
  const autoPlay = props.autoPlay ?? (onUndo === undefined && onCommit === undefined && props.seconds === undefined)

  const ds = String(Math.max(0, Math.floor(count))).split("")
  const anchor = anchorOf(ds)
  const manualMs = Math.max(1000, Math.round(seconds * 1000))

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  // Reduced motion with the built-in loop: one still frame (the window, mid-count); undo still works, nothing ticks.
  // (Derived from the live `auto` state below, so once a person takes over the clock runs for real.)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)

  // Clock and loop state live in a ref: it changes every tick and must not re-render the tree.
  const S = React.useRef({
    phase: "open" as Phase,
    el: autoPlay && reduce ? SIM_MS * 0.4 : 0,
    D: autoPlay ? SIM_MS : manualMs,
    scripted: null as number | null,
    cycle: 0,
    auto: autoPlay,
  })

  const [phase, setPhase] = React.useState<Phase>("open")
  const [outcome, setOutcome] = React.useState<UndoCountdownOutcome>("committed")
  const [auto, setAuto] = React.useState(autoPlay)
  const frozen = reduce && auto
  const [mid, setMid] = React.useState<Mid>(() => ({ cur: String(digitFor(S.current.D - S.current.el)), prev: null, n: 0 }))
  const [pressed, setPressed] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [onScreen, setOnScreen] = React.useState(true)
  const [visible, setVisible] = React.useState(true)
  const [seen, setSeen] = React.useState(false)
  const [secs, setSecs] = React.useState(() => digitFor(S.current.D - S.current.el))
  const cap = React.useId()
  const [announce, setAnnounce] = React.useState("")

  const reduceRef = React.useRef(reduce)
  reduceRef.current = reduce

  /** Swaps the number in the middle: the old digit swells and blurs out, the new one settles in. */
  const showMid = React.useCallback((d: string) => {
    setMid((m) => (m.cur === d ? m : { cur: d, prev: reduceRef.current ? null : m.cur, n: m.n + 1 }))
  }, [])
  /** The seconds left: the big digit and the words under it (kept apart, so the label does not change while the number fades out). */
  const setLeft = React.useCallback(
    (n: number) => {
      setSecs(n)
      showMid(String(n))
    },
    [showMid],
  )

  const fns = React.useRef<{ finish: (k: UndoCountdownOutcome, user: boolean) => void; restart: () => void; handOver: () => void }>({
    finish: () => {},
    restart: () => {},
    handOver: () => {},
  })

  // The person has taken over: the loop ends for good and the window becomes a real one.
  const handOver = () => {
    const s = S.current
    if (!s.auto) return
    s.auto = false
    s.scripted = null
    if (s.phase === "open") {
      s.el = s.el * (manualMs / s.D)
      s.D = manualMs
      setLeft(digitFor(s.D - s.el))
    }
    setAuto(false)
    setPressed(false)
  }

  const finish = (kind: UndoCountdownOutcome, user: boolean) => {
    const s = S.current
    if (s.phase !== "open") return
    if (user) handOver()
    s.phase = "done"
    // The button is about to go inert: keep a keyboard user's place on the card.
    if (document.activeElement && document.activeElement === btnRef.current) cardRef.current?.focus({ preventScroll: true })
    showMid(ds[anchor]) // the last second always lands on the digit the count is built around
    setOutcome(kind)
    setPhase("done")
    setPressed(false)
    if (!s.auto) {
      setAnnounce(kind === "undone" ? `${fmt(count)} ${noun} restored to your ${origin}.` : `${fmt(count)} ${noun} moved to ${destination}.`)
      if (kind === "undone") onUndo?.()
      else onCommit?.()
    }
  }

  const restart = () => {
    const s = S.current
    s.cycle += 1
    s.phase = "open"
    s.el = 0
    s.D = s.auto ? SIM_MS : manualMs
    s.scripted = s.auto && s.cycle % 2 === 1 ? SCRIPT_MS : null
    setPhase("open")
    setPressed(false)
    setLeft(digitFor(s.D))
  }

  React.useLayoutEffect(() => {
    fns.current = { finish, restart, handOver }
  })

  // Announce a real window once, when its clock starts; the loop stays quiet until someone takes over.
  React.useEffect(() => {
    if (!autoPlay && seen) setAnnounce(`${agent} ${action} ${fmt(count)} ${noun}. ${Math.ceil(manualMs / 1000)} seconds to undo.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen])

  // The old digit leaves the DOM once its exit has played.
  React.useEffect(() => {
    if (mid.prev === null) return
    const n = mid.n
    const id = window.setTimeout(() => setMid((m) => (m.n === n ? { ...m, prev: null } : m)), 340)
    return () => window.clearTimeout(id)
  }, [mid.n, mid.prev])

  // The built-in loop runs only while on screen and in a visible tab. A real window waits until it has first been on screen, then holds while the tab is hidden.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setVisible(document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return () => document.removeEventListener("visibilitychange", update)
    }
    const io = new IntersectionObserver((entries) => {
      const on = entries.some((x) => x.isIntersecting)
      setOnScreen(on)
      if (on) setSeen(true)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  const active = onScreen && visible

  // Cmd/Ctrl+Z undoes while the window is open.
  React.useEffect(() => {
    if (!shortcut || phase !== "open" || (!auto && !seen)) return
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && !isEditable(e.target)) {
        e.preventDefault()
        fns.current.finish("undone", e.isTrusted)
      }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [shortcut, phase, auto, seen])

  // The clock: a plain interval, so the result lands even where animation frames never come.
  const paused = hover && !auto && pauseOnHover
  const running = !frozen && !paused && (auto ? active : seen && visible)
  React.useEffect(() => {
    if (phase !== "open" || !running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const s = S.current
      s.el += Math.min(500, now - last)
      last = now
      setLeft(digitFor(s.D - s.el))
      if (s.auto && s.scripted !== null) {
        if (s.el >= s.scripted - 190) setPressed(true)
        if (s.el >= s.scripted) fns.current.finish("undone", false)
      } else if (s.el >= s.D) fns.current.finish("committed", false)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [phase, running, setLeft])

  // Built-in loop: rest on the result, then go again.
  React.useEffect(() => {
    if (phase !== "done" || !auto || !active || frozen) return
    const id = window.setTimeout(() => fns.current.restart(), REST_MS)
    return () => window.clearTimeout(id)
  }, [phase, auto, active, frozen])

  /* ---- what is shown ---- */
  const flank = (i: number) => (i < anchor ? { side: "udc-l", k: anchor - 1 - i } : { side: "udc-r", k: i - anchor - 1 })

  return (
    <div
      ref={rootRef}
      className={cn("udc", className)}
      style={{ "--udc-n": ds.length } as React.CSSProperties}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return
        fns.current.handOver()
        setHover(true)
      }}
      onPointerLeave={() => setHover(false)}
      // Only a press or key that lands on the piece ends the built-in loop; the rest of the page can be clicked freely.
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) fns.current.handOver()
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) fns.current.handOver()
      }}
      onFocusCapture={() => {
        fns.current.handOver()
        setHover(true)
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false)
      }}
    >
      <style href="undo-countdown" precedence="default">
        {CSS}
      </style>
      <p className="udc-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <div ref={cardRef} tabIndex={-1} className="udc-card" role="group" aria-labelledby={cap} data-phase={phase} data-outcome={outcome}>
        <p id={cap} className="udc-cap">
          {agent} {action} {fmt(count)} {noun}
        </p>

        <div className="udc-hero" aria-hidden>
          {ds.map((d, i) =>
            i === anchor ? (
              <span key="mid" className="udc-slot">
                {mid.prev !== null && (
                  <span key={`o${mid.n}`} className="udc-g udc-out">
                    {mid.prev}
                  </span>
                )}
                <span key={`i${mid.n}`} className={cn("udc-g", mid.n > 0 && "udc-in")}>
                  {mid.cur}
                </span>
              </span>
            ) : (
              <span key={`f${i}`} className={cn("udc-slot udc-o", flank(i).side)} style={{ "--k": flank(i).k } as React.CSSProperties}>
                <span className="udc-g">{d}</span>
              </span>
            ),
          )}
        </div>

        <div className="udc-lab">
          <p className="udc-win" inert={phase !== "open"}>
            <span>{secs === 1 ? "second to" : "seconds to"}</span>
            <button
              ref={btnRef}
              type="button"
              className="udc-un"
              data-pressed={pressed || undefined}
              aria-label={`Undo, ${secs} ${secs === 1 ? "second" : "seconds"} left. Puts ${fmt(count)} ${noun} back in your ${origin}.`}
              title={shortcut ? "Undo (Cmd or Ctrl Z)" : undefined}
              onClick={() => fns.current.finish("undone", true)}
            >
              undo
            </button>
          </p>
          <p className="udc-end udc-end-c" aria-hidden={!(phase === "done" && outcome === "committed")}>
            {noun} are in {destination}.
          </p>
          <p className="udc-end udc-end-u" aria-hidden={!(phase === "done" && outcome === "undone")}>
            {noun} are back in your {origin}.
          </p>
        </div>
      </div>
    </div>
  )
}
