"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type HoldToConfirmProps = {
  /** How long the button has to be held, in milliseconds. The fill is linear, so the bar is an honest clock. Default 1200. */
  duration?: number
  /** Headline above the button. Default "Delete Harbor & Finch?". */
  title?: string
  /** The consequence, in plain words, under the headline. */
  detail?: string
  /** Button label at rest. Default "Hold to delete workspace". */
  label?: string
  /** Button label while it is held. Default "Keep holding". */
  holdLabel?: string
  /** Button label once it went through. Default "Workspace deleted". */
  doneLabel?: string
  /** Line under the button at rest. Defaults to "Hold for 1.2 seconds. Letting go cancels." */
  hint?: string
  /** Line under the button once it went through. */
  doneHint?: string
  /** Label of the quiet button that takes it back. Default "Restore". Pass an empty string to hide it. */
  resetLabel?: string
  /** Puts the idle label in the destructive colour. Colour is only for real risk; leave it off for neutral confirms. */
  destructive?: boolean
  disabled?: boolean
  /** Called once, when the fill reaches the end. In the built-in demo it also plays the done state. */
  onConfirm?: () => void
  /** Called when the hold is let go early, with how far it got (0–1). */
  onCancel?: (progress: number) => void
  /** Called when the person takes it back with the quiet button. */
  onReset?: () => void
  className?: string
}

type Phase = "idle" | "hold" | "cancel" | "done"
type Mode = "idle" | "hold" | "back" | "done"
type Source = "user" | "sim"

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.hcn {
  --hcn-ink: #000;
  --hcn-surface: #fff;
  --hcn-accent: #0060e2;
  --hcn-danger: #cf2a1f;
  --hcn-t1: color-mix(in oklab, var(--hcn-ink) 88%, transparent);
  --hcn-t2: color-mix(in oklab, var(--hcn-ink) 61%, transparent);
  --hcn-t3: color-mix(in oklab, var(--hcn-ink) 55%, transparent);
  --hcn-fill: color-mix(in oklab, var(--hcn-ink) 6%, transparent);
  --hcn-fill-hi: color-mix(in oklab, var(--hcn-ink) 9%, transparent);
  --hcn-line: color-mix(in oklab, var(--hcn-ink) 6%, transparent);
  --hcn-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --hcn-ease: cubic-bezier(.22, 1, .36, 1);
  --hcn-pad: 24px;
  --hcn-p: 0;
  position: relative; container-type: inline-size; width: 100%; max-width: 380px;
  font: 13px/20px var(--hcn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--hcn-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .hcn {
  --hcn-ink: #fff;
  --hcn-surface: #1c1c1e;
  --hcn-accent: #4d8dff;
  --hcn-danger: #ff6f64;
  --hcn-t1: color-mix(in oklab, var(--hcn-ink) 90%, transparent);
  --hcn-t2: color-mix(in oklab, var(--hcn-ink) 62%, transparent);
  --hcn-t3: color-mix(in oklab, var(--hcn-ink) 50%, transparent);
  --hcn-fill: color-mix(in oklab, var(--hcn-ink) 8%, transparent);
  --hcn-fill-hi: color-mix(in oklab, var(--hcn-ink) 12%, transparent);
  --hcn-line: color-mix(in oklab, var(--hcn-ink) 9%, transparent);
  --hcn-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .hcn {
  --hcn-ink: #000; --hcn-surface: #fff; --hcn-accent: #111; --hcn-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --hcn-ease: cubic-bezier(.2, .9, .1, 1); --hcn-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .hcn { --hcn-ink: #fff; --hcn-surface: #0a0a0a; --hcn-accent: #f2f2f2; --hcn-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .hcn {
  --hcn-ink: var(--pane-ink); --hcn-surface: var(--pane-solid); --hcn-accent: var(--pane-accent); --hcn-shadow: var(--pane-shadow);
  --hcn-ease: var(--pane-ease); --hcn-font: var(--pane-font);
  --hcn-t1: var(--pane-t1); --hcn-t2: var(--pane-t2); --hcn-t3: var(--pane-t3);
}
html[data-style="glass"] .hcn-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .hcn-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .hcn-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .hcn-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.hcn *, .hcn *::before, .hcn *::after { box-sizing: border-box }
:where(.hcn) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.hcn) p { margin: 0 }
.hcn button:focus-visible { outline: 2px solid var(--hcn-accent); outline-offset: 2px }
.hcn-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.hcn-card { border-radius: 24px; background: var(--hcn-surface); box-shadow: var(--hcn-shadow); padding: 22px var(--hcn-pad) 18px }
.hcn-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--hcn-t1) }
.hcn-detail { margin-top: 2px; color: var(--hcn-t2); text-wrap: pretty }

/* The button: a quiet well, and above it a solid ink layer that is clipped to the progress. */
.hcn-btn {
  position: relative; display: block; width: 100%; height: 52px; margin-top: 18px; border-radius: 14px; overflow: hidden;
  background: var(--hcn-fill); box-shadow: inset 0 0 0 .5px var(--hcn-line);
  font-size: 15px; font-weight: 500; letter-spacing: -.005em; text-align: center;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  transition: transform .24s var(--hcn-ease), background-color .16s var(--hcn-ease);
}
.hcn-btn:hover { background: var(--hcn-fill-hi) }
.hcn-btn[data-down] { transform: scale(calc(.992 - .012 * var(--hcn-p))); transition: transform .18s var(--hcn-ease), background-color .16s var(--hcn-ease) }
.hcn-btn[disabled] { opacity: .45; cursor: not-allowed }
.hcn-btn[disabled]:hover { background: var(--hcn-fill) }
.hcn-face { position: absolute; inset: 0; display: grid; place-items: center }
.hcn-face-fg { background: var(--hcn-ink); color: var(--hcn-surface); clip-path: inset(0 calc((1 - var(--hcn-p)) * 100%) 0 0); pointer-events: none; will-change: clip-path }
.hcn-face-bg { color: var(--hcn-t1) }
.hcn[data-destructive] .hcn-face-bg .hcn-l-idle { color: var(--hcn-danger) }
.hcn-l { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; opacity: 0; filter: blur(4px); transform: translateY(6px); transition: opacity .14s var(--hcn-ease), transform .14s var(--hcn-ease), filter .14s var(--hcn-ease) }
.hcn[data-phase="idle"] .hcn-l-idle, .hcn[data-phase="cancel"] .hcn-l-idle, .hcn[data-phase="hold"] .hcn-l-hold, .hcn[data-phase="done"] .hcn-l-done {
  opacity: 1; filter: none; transform: none; transition: opacity .3s var(--hcn-ease) .06s, transform .38s var(--hcn-ease) .06s, filter .3s var(--hcn-ease) .06s;
}
.hcn[data-phase="hold"] .hcn-l-idle, .hcn[data-phase="done"] .hcn-l-hold { transform: translateY(-6px) }
.hcn[data-phase="done"] .hcn-btn { animation: hcn-settle .56s var(--hcn-ease) }
.hcn-check { width: 16px; height: 16px; flex: none }
.hcn-check path { stroke-dasharray: 18; stroke-dashoffset: 18; transition: stroke-dashoffset .1s }
.hcn[data-phase="done"] .hcn-check path { stroke-dashoffset: 0; transition: stroke-dashoffset .42s var(--hcn-ease) .16s }

/* Under the button: four lines share one cell, so the card never changes height. */
.hcn-foot { display: grid; margin-top: 12px; min-height: 36px; align-items: center }
.hcn-hint { grid-area: 1 / 1; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; color: var(--hcn-t3); opacity: 0; filter: blur(4px); transform: translateY(4px); pointer-events: none; transition: opacity .14s var(--hcn-ease), transform .14s var(--hcn-ease), filter .14s var(--hcn-ease) }
.hcn[data-phase="idle"] .hcn-h-idle, .hcn[data-phase="hold"] .hcn-h-hold, .hcn[data-phase="cancel"] .hcn-h-cancel, .hcn[data-phase="done"] .hcn-h-done {
  opacity: 1; filter: none; transform: none; pointer-events: auto; transition: opacity .32s var(--hcn-ease) .08s, transform .4s var(--hcn-ease) .08s, filter .32s var(--hcn-ease) .08s;
}
.hcn[data-phase="hold"] .hcn-h-hold { color: var(--hcn-t2) }
.hcn[data-phase="cancel"] .hcn-h-cancel { color: var(--hcn-t2) }
.hcn-undo { flex: none; height: 36px; margin-right: -10px; padding: 0 10px; border-radius: 10px; font-weight: 500; color: var(--hcn-t1); transition: transform .16s var(--hcn-ease), background-color .16s var(--hcn-ease) }
.hcn-undo:hover { background: var(--hcn-fill) }
.hcn-undo:active { transform: scale(.96) }

@keyframes hcn-settle { 0% { transform: scale(.984) } 38% { transform: scale(1.018) } 100% { transform: scale(1) } }

@container (max-width: 340px) {
  .hcn-card { --hcn-pad: 20px }
}
@media (prefers-reduced-motion: reduce) {
  .hcn *, .hcn *::before, .hcn *::after { animation: none !important; transition-duration: .01ms !important; transition-delay: 0s !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Engine                                   */
/* -------------------------------------------------------------------------- */

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const easeOut = (k: number) => 1 - (1 - k) ** 4

type Engine = { dur: number; p: number; mode: Mode; last: number; t0: number; from: number; span: number; raf: number; dog: number; src: Source }

export function HoldToConfirm(props: HoldToConfirmProps) {
  const {
    duration = 1200,
    title = "Delete Harbor & Finch?",
    detail = "14 members, 212 runs and 3 agents are removed for good.",
    label = "Hold to delete workspace",
    holdLabel = "Keep holding",
    doneLabel = "Workspace deleted",
    hint,
    doneHint = "Removed. You have 30 days to restore it.",
    resetLabel = "Restore",
    destructive = false,
    disabled = false,
    onConfirm,
    onCancel,
    onReset,
    className,
  } = props
  const bare = props.onConfirm === undefined && props.onCancel === undefined && props.onReset === undefined

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const detailId = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const kbd = React.useRef(false)
  const eng = React.useRef<Engine>({ dur: 0, p: 0, mode: "idle", last: 0, t0: 0, from: 0, span: 0, raf: 0, dog: 0, src: "user" })
  const cancelTimer = React.useRef(0)
  const cb = React.useRef({ onConfirm, onCancel, onReset, duration, reduce, bare })
  React.useLayoutEffect(() => {
    cb.current = { onConfirm, onCancel, onReset, duration, reduce, bare }
  })
  const holdInfoId = React.useId()
  const inputOn = React.useRef(false)
  const inputTimer = React.useRef(0)
  const keyHeld = React.useRef(false)
  const doneAt = React.useRef(0)

  const [phase, setPhase] = React.useState<Phase>(() => (bare && prefersReduced() ? "hold" : "idle"))
  const [down, setDown] = React.useState(false)
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const [live, setLive] = React.useState("")
  const autoRef = React.useRef(true)

  const paint = React.useCallback(() => {
    const v = eng.current.p
    rootRef.current?.style.setProperty("--hcn-p", v < 0.003 ? "0" : v.toFixed(4))
  }, [])

  const stopLoop = React.useCallback(() => {
    const e = eng.current
    cancelAnimationFrame(e.raf)
    window.clearTimeout(e.dog)
    e.raf = 0
    e.dog = 0
  }, [])

  const complete = React.useCallback(() => {
    const e = eng.current
    e.p = 1
    e.mode = "done"
    stopLoop()
    paint()
    setDown(false)
    doneAt.current = performance.now()
    setPhase("done")
    // Only real input is announced: the built-in demo must never report a destructive action nobody took.
    if (e.src === "user") setLive("Confirmed. " + doneLabel + ".")
    cb.current.onConfirm?.()
  }, [doneLabel, paint, stopLoop])

  // One loop. It reads the clock, not a frame count, so a slow or throttled frame cannot stretch the hold.
  const tick = React.useCallback(function loop() {
    const e = eng.current
    const now = performance.now()
    if (e.mode === "hold") {
      e.p = Math.min(1, e.p + (now - e.last) / Math.max(200, e.dur || cb.current.duration))
      e.last = now
      paint()
      if (e.p >= 1) return complete()
    } else if (e.mode === "back") {
      const k = Math.min(1, (now - e.t0) / e.span)
      e.p = e.from * (1 - easeOut(k))
      paint()
      if (k >= 1) {
        e.p = 0
        e.mode = "idle"
        paint()
        return stopLoop()
      }
    } else return stopLoop()
    e.raf = requestAnimationFrame(loop)
    window.clearTimeout(e.dog)
    e.dog = window.setTimeout(loop, 120)
  }, [complete, paint, stopLoop])

  const press = React.useCallback(
    (src: Source, dur = 0) => {
      const e = eng.current
      if (e.mode === "done" || e.mode === "hold") return
      window.clearTimeout(cancelTimer.current)
      e.src = src
      e.dur = dur
      e.mode = "hold"
      e.last = performance.now()
      setDown(true)
      setPhase("hold")
      if (src === "user") setLive("Holding. Keep holding to confirm.")
      stopLoop()
      tick()
    },
    [stopLoop, tick],
  )

  // Letting go: the fill returns fast, and faster per pixel the further it had got, so cancelling always feels instant.
  const release = React.useCallback(
    (silent?: boolean) => {
      const e = eng.current
      if (e.mode !== "hold") return
      const reached = e.p
      setDown(false)
      if (cb.current.reduce || reached < 0.01) {
        e.p = 0
        e.mode = "idle"
        stopLoop()
        paint()
      } else {
        e.mode = "back"
        e.t0 = performance.now()
        e.from = reached
        e.span = 130 + 170 * reached
        stopLoop()
        tick()
      }
      if (silent) {
        setPhase("idle")
        return
      }
      setPhase("cancel")
      if (e.src === "user") setLive("Cancelled. Nothing was changed.")
      if (reached > 0.05) cb.current.onCancel?.(reached)
      window.clearTimeout(cancelTimer.current)
      cancelTimer.current = window.setTimeout(() => setPhase((p) => (p === "cancel" ? "idle" : p)), 1800)
    },
    [paint, stopLoop, tick],
  )

  // Back to rest. Drains quickly from wherever it is.
  const reset = React.useCallback(
    (instant?: boolean) => {
      const e = eng.current
      window.clearTimeout(cancelTimer.current)
      stopLoop()
      setDown(false)
      setPhase("idle")
      if (instant || cb.current.reduce || e.p < 0.01) {
        e.p = 0
        e.mode = "idle"
        paint()
        return
      }
      e.mode = "back"
      e.t0 = performance.now()
      e.from = e.p
      e.span = 360
      tick()
    },
    [paint, stopLoop, tick],
  )

  React.useLayoutEffect(() => {
    if (bare && prefersReduced() && eng.current.mode === "idle" && eng.current.p === 0) {
      // Reduced motion: one still frame, mid-hold, so the idea reads without any movement.
      eng.current.p = 0.58
      paint()
    }
  }, [bare, paint])

  React.useEffect(() => {
    const e = eng.current
    return () => {
      stopLoop()
      window.clearTimeout(cancelTimer.current)
      e.mode = "idle"
    }
  }, [stopLoop])

  /* ---- built-in demo: an early release, then the real hold, until someone touches it ---- */
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

  React.useEffect(() => {
    if (!bare || !auto || !active || reduce || disabled) return
    let dead = false
    const timers: number[] = []
    const wait = (ms: number) => new Promise<void>((res) => timers.push(window.setTimeout(res, ms)))
    ;(async () => {
      if (eng.current.mode === "done") reset(true)
      await wait(900)
      while (!dead) {
        press("sim")
        await wait(duration * 0.56)
        if (dead) break
        release()
        await wait(1500)
        if (dead) break
        press("sim")
        await wait(duration + 160)
        if (dead) break
        await wait(3000)
        if (dead) break
        reset()
        await wait(1100)
      }
    })()
    const e0 = eng.current
    return () => {
      dead = true
      timers.forEach((t) => window.clearTimeout(t))
      if (e0.src === "sim" && e0.mode !== "idle") {
        window.clearTimeout(cancelTimer.current)
        reset(true)
      }
    }
  }, [bare, auto, active, reduce, disabled, duration, press, release, reset])

  const stopAuto = React.useCallback(() => {
    if (!autoRef.current) return
    autoRef.current = false
    setAuto(false)
    const e = eng.current
    if (e.src === "sim" || (cb.current.reduce && e.mode === "idle")) {
      e.src = "user"
      reset(true)
    }
  }, [reset])

  // After an answer, keyboard users land on the quiet button; after a restore they land back on the main one.
  const prev = React.useRef<Phase>(phase)
  React.useEffect(() => {
    if (prev.current !== phase && kbd.current) {
      if (phase === "done" && resetLabel) {
        // The key that finished the hold may still be down: focus Restore only after it is let go, or key repeat would press it.
        const go = () => undoRef.current?.focus({ preventScroll: true })
        if (keyHeld.current) {
          const up = () => {
            window.removeEventListener("keyup", up, true)
            window.setTimeout(go, 60)
          }
          window.addEventListener("keyup", up, true)
        } else go()
      }
      if (prev.current === "done" && phase === "idle") btnRef.current?.focus({ preventScroll: true })
    }
    prev.current = phase
  }, [phase, resetLabel])

  /* ---- input ---- */
  const startUser = () => {
    if (disabled) return
    stopAuto()
    press("user")
  }
  const onPointerDown = (ev: React.PointerEvent<HTMLButtonElement>) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return
    kbd.current = false
    markInput()
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId)
    } catch {
      /* some synthetic events cannot be captured */
    }
    startUser()
  }
  const onPointerMove = (ev: React.PointerEvent<HTMLButtonElement>) => {
    if (eng.current.mode !== "hold") return
    const r = ev.currentTarget.getBoundingClientRect()
    const slack = 36
    if (ev.clientX < r.left - slack || ev.clientX > r.right + slack || ev.clientY < r.top - slack || ev.clientY > r.bottom + slack) release()
  }
  const onKeyDown = (ev: React.KeyboardEvent<HTMLButtonElement>) => {
    if (ev.key === "Escape") {
      if (eng.current.mode === "hold") {
        ev.preventDefault()
        release()
      }
      return
    }
    if (ev.key === " " || ev.key === "Enter") {
      ev.preventDefault()
      if (ev.repeat) return
      kbd.current = true
      keyHeld.current = true
      markInput()
      startUser()
    }
  }
  const onKeyUp = (ev: React.KeyboardEvent<HTMLButtonElement>) => {
    if (ev.key === " " || ev.key === "Enter") {
      keyHeld.current = false
      endInput()
      release()
    }
  }
  // A click with no pointer or key press before it comes from assistive tech (screen reader, switch, voice): one quick scripted fill, then confirm.
  const markInput = () => {
    window.clearTimeout(inputTimer.current)
    inputOn.current = true
  }
  const endInput = () => {
    window.clearTimeout(inputTimer.current)
    inputTimer.current = window.setTimeout(() => (inputOn.current = false), 120)
  }
  const onClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault()
    if (inputOn.current || disabled) return
    kbd.current = true
    stopAuto()
    press("user", 400)
  }

  const takeBack = () => {
    if (performance.now() - doneAt.current < 500) return
    stopAuto()
    onReset?.()
    setLive("Restored.")
    reset()
  }

  const seconds = (duration / 1000).toFixed(1).replace(/\.0$/, "")
  const isDone = phase === "done"
  // Reduced motion paints the untouched demo as one still mid-hold frame. It is a picture, not a hold in progress,
  // so assistive tech keeps reading the resting label and hint until someone interacts.
  const still = bare && auto && reduce && phase === "hold"

  return (
    <div
      ref={rootRef}
      className={cn("hcn", className)}
      data-phase={phase}
      data-destructive={destructive || undefined}
      onPointerDownCapture={() => {
        if (bare) stopAuto()
      }}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) kbd.current = true
        if (bare) stopAuto()
      }}
      onKeyDownCapture={() => {
        kbd.current = true
        if (bare) stopAuto()
      }}
    >
      <style href="hold-to-confirm" precedence="default">
        {CSS}
      </style>
      <p className="hcn-sr" role="status" aria-live="polite">
        {live}
      </p>
      <p className="hcn-sr" id={holdInfoId}>
        {`Press and hold for ${seconds} ${seconds === "1" ? "second" : "seconds"} to confirm, or activate once for a short automatic fill. Letting go early cancels.`}
      </p>
      <div className="hcn-card" role="group" aria-label={title}>
        <p className="hcn-title">{title}</p>
        <p className="hcn-detail" id={detailId}>
          {detail}
        </p>

        <button
          ref={btnRef}
          type="button"
          className="hcn-btn"
          data-down={down || undefined}
          disabled={disabled}
          aria-disabled={isDone || disabled || undefined}
          aria-describedby={`${detailId} ${holdInfoId}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            endInput()
            release()
          }}
          onPointerCancel={() => {
            endInput()
            release()
          }}
          onLostPointerCapture={() => release()}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={() => release()}
          onClick={onClick}
        >
          <span className="hcn-face hcn-face-bg">
            {/* Only the label on show names the button; the others are faded out with opacity only. */}
            <span className="hcn-l hcn-l-idle" aria-hidden={(phase === "hold" && !still) || isDone || undefined}>
              {label}
            </span>
            <span className="hcn-l hcn-l-hold" aria-hidden={phase !== "hold" || still || undefined}>
              {holdLabel}
            </span>
            <span className="hcn-l hcn-l-done" aria-hidden={!isDone || undefined}>
              <Check />
              {doneLabel}
            </span>
          </span>
          <span className="hcn-face hcn-face-fg" aria-hidden>
            <span className="hcn-l hcn-l-idle">{label}</span>
            <span className="hcn-l hcn-l-hold">{holdLabel}</span>
            <span className="hcn-l hcn-l-done">
              <Check />
              {doneLabel}
            </span>
          </span>
        </button>

        <div className="hcn-foot">
          <p className="hcn-hint hcn-h-idle" aria-hidden={phase !== "idle" && !still}>
            {hint ?? `Hold for ${seconds} ${seconds === "1" ? "second" : "seconds"}. Letting go cancels.`}
          </p>
          <p className="hcn-hint hcn-h-hold" aria-hidden={phase !== "hold" || still}>
            Release to cancel.
          </p>
          <p className="hcn-hint hcn-h-cancel" aria-hidden={phase !== "cancel"}>
            Cancelled. Nothing was changed.
          </p>
          <div className="hcn-hint hcn-h-done" aria-hidden={!isDone} inert={!isDone}>
            <span>{doneHint}</span>
            {resetLabel ? (
              <button ref={undoRef} type="button" className="hcn-undo" onClick={takeBack} tabIndex={isDone ? 0 : -1}>
                {resetLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Check() {
  return (
    <svg className="hcn-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 8.4 6.7 11.5 12.5 4.8" />
    </svg>
  )
}
