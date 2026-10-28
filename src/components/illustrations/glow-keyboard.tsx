"use client"

import * as React from "react"

/**
 * GlowKeyboard – an AI chat input that types itself over a glass keyboard. Every key press
 * lights its key and sends a wave up the gradient floor behind the keyboard.
 *
 *   <GlowKeyboard prompts={["Summarise this contract", "Draft a reply"]} accent="#7c3aed" />
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlowKeyboardProps = {
  /** Prompts typed one after the other, then sent. Cycles forever. Default: three prompts. */
  prompts?: string[]
  /** Placeholder shown in the empty input. */
  placeholder?: string
  /** Called each time a prompt has been "sent". */
  onSend?: (prompt: string) => void
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame (typing stops where it is). */
  paused?: boolean
  /** Accent colour (any CSS colour) used for key glow and the floor. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const DEFAULT_PROMPTS = [
  "Summarise the renewal terms in this contract, and flag anything unusual.",
  "Draft a friendly reply to Dana about the delayed shipment.",
  "Which customers asked for dark mode this quarter?",
]

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm,.?"]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const STAGE_W = 680
const STAGE_H = 420

const CSS = `
.gk {
  --gk-ink: #000;
  --gk-surface: #fff;
  --gk-accent: #0060e2;
  --gk-speed: 1;
  --gk-scale: 1;
  --gk-t1: color-mix(in oklab, var(--gk-ink) 88%, transparent);
  --gk-t2: color-mix(in oklab, var(--gk-ink) 61%, transparent);
  --gk-t3: color-mix(in oklab, var(--gk-ink) 45%, transparent);
  --gk-t4: color-mix(in oklab, var(--gk-ink) 27%, transparent);
  --gk-glass: color-mix(in oklab, var(--gk-surface) 58%, transparent);
  --gk-rim: rgb(255 255 255 / .7);
  --gk-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --gk-key-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 3px -1px rgb(0 0 0 / .14), 0 7px 10px -7px rgb(0 0 0 / .22);
  --gk-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${STAGE_W}px; aspect-ratio: ${STAGE_W} / ${STAGE_H}; overflow: hidden;
  color: var(--gk-t1); font-family: var(--gk-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gk {
  --gk-ink: #fff; --gk-surface: #1c1c1e; --gk-accent: #4d8dff;
  --gk-t1: color-mix(in oklab, var(--gk-ink) 90%, transparent);
  --gk-t2: color-mix(in oklab, var(--gk-ink) 62%, transparent);
  --gk-t3: color-mix(in oklab, var(--gk-ink) 46%, transparent);
  --gk-t4: color-mix(in oklab, var(--gk-ink) 28%, transparent);
  --gk-glass: color-mix(in oklab, var(--gk-surface) 55%, transparent);
  --gk-rim: rgb(255 255 255 / .16);
  --gk-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --gk-key-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 3px -1px rgb(0 0 0 / .5), 0 7px 10px -7px rgb(0 0 0 / .7);
}
.gk *, .gk *::before, .gk *::after { box-sizing: border-box }
.gk-stage { position: absolute; left: 0; top: 0; width: ${STAGE_W}px; height: ${STAGE_H}px; transform-origin: 0 0; transform: scale(var(--gk-scale)) }

/* Floor: a tilted gradient plane; each key press launches a band that travels up it */
.gk-floor {
  position: absolute; left: 0; right: 0; bottom: 0; height: 270px; perspective: 520px; perspective-origin: 50% 0; overflow: hidden; pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 38%); mask-image: linear-gradient(to bottom, transparent, #000 38%);
}
.gk-plane {
  position: absolute; left: -68px; width: ${STAGE_W + 136}px; top: 24px; height: 360px; transform-origin: 50% 0; transform: rotateX(62deg);
  background:
    radial-gradient(64% 86% at 50% 100%, color-mix(in oklab, var(--gk-accent) 62%, transparent), transparent 72%),
    radial-gradient(34% 54% at 18% 100%, rgb(236 72 153 / .34), transparent 72%),
    radial-gradient(34% 54% at 84% 100%, rgb(139 92 246 / .34), transparent 72%),
    repeating-linear-gradient(90deg, color-mix(in oklab, var(--gk-accent) 26%, transparent) 0 1px, transparent 1px 34px),
    repeating-linear-gradient(0deg, color-mix(in oklab, var(--gk-accent) 22%, transparent) 0 1px, transparent 1px 34px);
  -webkit-mask-image: radial-gradient(ellipse 62% 100% at 50% 100%, #000 45%, transparent 100%);
  mask-image: radial-gradient(ellipse 62% 100% at 50% 100%, #000 45%, transparent 100%);
  animation: gk-breathe calc(5s / var(--gk-speed, 1)) ease-in-out infinite alternate;
}
.gk-wave {
  position: absolute; bottom: 14px; width: 260px; height: 80px; margin-left: 0; border-radius: 50%;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--gk-accent) 72%, white), color-mix(in oklab, var(--gk-accent) 55%, transparent) 45%, transparent);
  filter: blur(5px); opacity: 0;
  animation: gk-wave calc(1.5s / var(--gk-speed, 1)) cubic-bezier(.2, .7, .3, 1) backwards;
}
:is(.dark, [data-theme="dark"]) .gk-wave { mix-blend-mode: screen }

/* Chat input */
.gk-input {
  position: absolute; left: 110px; top: 92px; width: 460px; height: 58px; display: flex; align-items: center; gap: 12px; padding: 0 10px 0 16px;
  border-radius: 16px; background: var(--gk-glass); -webkit-backdrop-filter: blur(16px) saturate(1.5); backdrop-filter: blur(16px) saturate(1.5);
  box-shadow: inset 0 1px 0 var(--gk-rim), var(--gk-shadow), 0 16px 32px -16px rgb(0 0 0 / .22);
}
.gk-spark { flex: none; width: 18px; height: 18px; color: var(--gk-accent) }
.gk-text { flex: 1; min-width: 0; font-size: 14px; line-height: 20px; color: var(--gk-t1); white-space: nowrap; overflow: hidden; display: flex; justify-content: flex-end }
.gk-text > span { flex: none; max-width: none }
.gk-ph { color: var(--gk-t4) }
.gk-caret { display: inline-block; width: 1.5px; height: 17px; margin: 0 0 -3px 1px; border-radius: 1px; background: var(--gk-accent); animation: gk-blink calc(1.1s / var(--gk-speed, 1)) steps(1) infinite }
.gk-send {
  flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; color: #fff;
  background: color-mix(in oklab, var(--gk-accent) 90%, #000 0%); box-shadow: inset 0 1px 0 rgb(255 255 255 / .3), 0 4px 10px -4px var(--gk-accent);
  opacity: .35; transition: opacity .3s var(--gk-ease), transform .3s var(--gk-ease);
}
.gk-send svg { width: 16px; height: 16px }
.gk[data-ready] .gk-send { opacity: 1 }
.gk[data-sending] .gk-send { animation: gk-send calc(.42s / var(--gk-speed, 1)) var(--gk-ease) }
.gk-sent {
  position: absolute; right: 110px; top: 40px; max-width: 360px; padding: 6px 12px; border-radius: 14px 14px 4px 14px; font-size: 12px; line-height: 16px; color: #fff;
  background: color-mix(in oklab, var(--gk-accent) 92%, transparent); box-shadow: 0 6px 16px -8px var(--gk-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: 0; animation: gk-sent calc(2s / var(--gk-speed, 1)) var(--gk-ease) backwards;
}

/* Keyboard */
.gk-kb {
  position: absolute; left: 80px; top: 196px; width: 520px; padding: 11px; display: flex; flex-direction: column; align-items: center; gap: 6px; border-radius: 20px;
  background: color-mix(in oklab, var(--gk-surface) 30%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 var(--gk-rim), var(--gk-shadow), 0 24px 40px -22px rgb(0 0 0 / .35);
  transform: perspective(1100px) rotateX(16deg); transform-origin: 50% 100%;
}
.gk-row { display: flex; gap: 6px }
.gk-key {
  position: relative; display: grid; place-items: center; width: 44px; height: 38px; border-radius: 9px; background: var(--gk-glass);
  box-shadow: inset 0 1px 0 var(--gk-rim), var(--gk-key-shadow); font-size: 12px; font-weight: 500; line-height: 16px; color: var(--gk-t3); text-transform: uppercase;
  -webkit-backdrop-filter: blur(8px) saturate(1.4); backdrop-filter: blur(8px) saturate(1.4);
}
.gk-key[data-k=" "] { width: 252px }
.gk-flash {
  position: absolute; inset: 0; z-index: 1; display: grid; place-items: center; border-radius: inherit; pointer-events: none; color: #fff; text-transform: uppercase;
  background: linear-gradient(180deg, color-mix(in oklab, var(--gk-accent) 78%, white), var(--gk-accent));
  box-shadow: 0 0 18px 2px color-mix(in oklab, var(--gk-accent) 70%, transparent), inset 0 1px 0 rgb(255 255 255 / .5);
  opacity: 0; animation: gk-flash calc(.8s / var(--gk-speed, 1)) ease-out backwards;
}

@keyframes gk-breathe { from { opacity: .82 } to { opacity: 1 } }
@keyframes gk-wave {
  from { transform: translateY(0) scale(.5, .7); opacity: 0 }
  14% { opacity: .95 }
  to { transform: translateY(-250px) scale(1.5, 1.4); opacity: 0 }
}
@keyframes gk-flash {
  0% { opacity: 1; transform: translateY(1.5px) scale(.96) }
  22% { opacity: 1; transform: translateY(1px) scale(.97) }
  100% { opacity: 0; transform: translateY(0) scale(1) }
}
@keyframes gk-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
@keyframes gk-send { 40% { transform: scale(.88) } 100% { transform: scale(1) } }
@keyframes gk-sent {
  0% { opacity: 0; transform: translateY(26px) scale(.95); filter: blur(3px) }
  18% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0) }
  72% { opacity: 1; transform: translateY(-8px) }
  100% { opacity: 0; transform: translateY(-24px) }
}

.gk[data-paused] *, .gk[data-paused] *::before, .gk[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .gk *, .gk *::before, .gk *::after { animation: none !important; transition: none !important }
  .gk-wave { transform: translateY(-120px) scale(1.2, 1.1); opacity: .7 }
  .gk-flash { opacity: 1 }
  .gk-caret { opacity: 1 }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(REDUCED_QUERY)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

type Hit = { id: number; k: string }
type Wave = { id: number; x: number }

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function GlowKeyboard({
  prompts = DEFAULT_PROMPTS,
  placeholder = "Ask anything…",
  onSend,
  speed = 1,
  paused,
  accent,
  label = "A chat input typing a message by itself on a glowing glass keyboard",
  className,
}: GlowKeyboardProps) {
  const reduced = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const kbRef = React.useRef<HTMLDivElement>(null)
  const keyEls = React.useRef<Record<string, HTMLElement | null>>({})
  const ids = React.useRef(0)
  const live = React.useRef({ speed, prompts, onSend })
  React.useEffect(() => {
    live.current = { speed, prompts, onSend }
  })
  // Where the typist is: prompt number, characters typed, and what comes next.
  const machine = React.useRef({ p: 0, c: 0, phase: "type" as "type" | "hold" | "send" | "gap" })

  const [text, setText] = React.useState(() => (reduced ? (prompts[0] ?? "") : ""))
  const [hits, setHits] = React.useState<Hit[]>(() => (reduced ? [{ id: -1, k: "t" }] : []))
  const [waves, setWaves] = React.useState<Wave[]>(() => (reduced ? [{ id: -1, x: STAGE_W / 2 }] : []))
  const [sent, setSent] = React.useState<{ id: number; text: string } | null>(null)
  const [sending, setSending] = React.useState(false)

  // Fit the fixed stage to the container width.
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const fit = () => el.style.setProperty("--gk-scale", String(el.clientWidth / STAGE_W))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The typist: one timer at a time, stopped while paused, picking up where it left off.
  React.useEffect(() => {
    if (paused || reduced) return
    const m = machine.current
    let timer = 0

    const press = (ch: string) => {
      const k = ch.toLowerCase()
      const el = keyEls.current[k]
      const kb = kbRef.current
      if (!el || !kb) return
      const id = ++ids.current
      setHits((h) => [...h.slice(-7), { id, k }])
      setWaves((w) => [...w.slice(-11), { id, x: kb.offsetLeft + el.offsetLeft + el.offsetWidth / 2 }])
    }

    const step = () => {
      const { prompts: list, speed: sp } = live.current
      const rate = Math.max(0.1, sp)
      const prompt = list.length ? list[m.p % list.length] : ""
      let wait = 0
      if (m.phase === "type") {
        if (m.c < prompt.length) {
          const ch = prompt[m.c++]
          press(ch)
          setText(prompt.slice(0, m.c))
          wait = ch === " " ? 60 + Math.random() * 40 : 55 + Math.random() * 75
        } else {
          m.phase = "hold"
          wait = 650
        }
      } else if (m.phase === "hold") {
        setSending(true)
        m.phase = "send"
        wait = 420
      } else if (m.phase === "send") {
        setSending(false)
        setSent({ id: ++ids.current, text: prompt })
        setText("")
        live.current.onSend?.(prompt)
        m.phase = "gap"
        wait = 1100
      } else {
        m.p = (m.p + 1) % Math.max(1, list.length)
        m.c = 0
        m.phase = "type"
        wait = 250
      }
      timer = window.setTimeout(step, wait / rate)
    }

    timer = window.setTimeout(step, 400 / Math.max(0.1, live.current.speed))
    return () => window.clearTimeout(timer)
  }, [paused, reduced])

  const style = {
    "--gk-speed": Math.max(0.05, speed),
    ...(accent ? { "--gk-accent": accent } : null),
  } as React.CSSProperties

  const keyNode = (k: string) => (
    <div
      key={k}
      className="gk-key"
      data-k={k}
      ref={(el) => {
        keyEls.current[k] = el
      }}
    >
      {k === " " ? "" : k}
      {hits.map((h) =>
        h.k === k ? (
          <span key={h.id} className="gk-flash">
            {k === " " ? "" : k}
          </span>
        ) : null,
      )}
    </div>
  )

  return (
    <div
      ref={rootRef}
      className={className ? `gk ${className}` : "gk"}
      style={style}
      data-paused={paused || undefined}
      data-ready={text.length > 0 || undefined}
      data-sending={sending || undefined}
      role="img"
      aria-label={label}
    >
      <style href="pane-glow-keyboard" precedence="default">
        {CSS}
      </style>
      <div className="gk-stage" aria-hidden>
        <div className="gk-floor">
          <div className="gk-plane">
            {waves.map((w) => (
              <span
                key={w.id}
                className="gk-wave"
                style={{ left: w.x + 68 - 130 }}
                onAnimationEnd={() => setWaves((all) => all.filter((x) => x.id !== w.id))}
              />
            ))}
          </div>
        </div>

        {sent && (
          <div className="gk-sent" key={sent.id}>
            {sent.text}
          </div>
        )}
        <div className="gk-input">
          <svg className="gk-spark" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5c.4 4.6 2.4 7.1 7 7.5-4.6.4-6.6 2.9-7 7.5-.4-4.6-2.4-7.1-7-7.5 4.6-.4 6.6-2.9 7-7.5Z" />
            <path d="M19 15.5c.2 2 1 3 3 3.2-2 .2-2.8 1.2-3 3.2-.2-2-1-3-3-3.2 2-.2 2.8-1.2 3-3.2Z" opacity=".7" />
          </svg>
          <div className="gk-text">
            <span>
              {text ? text : <span className="gk-ph">{placeholder}</span>}
              {text && <i className="gk-caret" />}
            </span>
          </div>
          <div className="gk-send">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </svg>
          </div>
        </div>

        <div className="gk-kb" ref={kbRef}>
          {ROWS.map((row) => (
            <div className="gk-row" key={row}>
              {[...row].map(keyNode)}
            </div>
          ))}
          <div className="gk-row">{keyNode(" ")}</div>
        </div>
      </div>
    </div>
  )
}
