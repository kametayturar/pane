"use client"

import * as React from "react"
import { ThumbsDown } from "lucide-react"

/**
 * GhostedChat – a few unanswered chat bubbles marked "Read". On hover (and on a slow
 * loop when idle) the bubbles lift and a thumbs-down reply pops in.
 *
 *   <GhostedChat messages={["Did the invite reach you?", "Hello?"]} />
 */

export type GhostedChatProps = {
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) used for the reply bubble. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  /** Unanswered messages, oldest first. The last one gets the red shimmer and the glow. */
  messages?: string[]
  /** Line above the bubbles. */
  status?: string
  /** Line under the bubbles. */
  readLabel?: string
  /** What the reply bubble shows. Defaults to a thumbs-down icon. */
  reply?: React.ReactNode
  className?: string
}

const W = 360
const H = 240

const CSS = `
.gh {
  --gh-ink: #202020;
  --gh-accent: #155eef;
  --gh-speed: 1;
  --gh-scale: 1;
  --gh-bubble: #fff;
  --gh-bubble-border: #ededed;
  --gh-bubble-shadow: 0 2px 6px rgb(28 29 31 / .08), 0 1px 2px rgb(28 29 31 / .05);
  --gh-text: #4a4c52;
  --gh-status: #9a9da3;
  --gh-read: #a8abb1;
  --gh-alert: #ff4d47;
  --gh-glow: .6;
  --gh-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: 560px; aspect-ratio: 3 / 2; overflow: hidden;
  font-family: var(--gh-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gh {
  --gh-ink: #ededed;
  --gh-bubble: #232326; --gh-bubble-border: rgb(255 255 255 / .08);
  --gh-bubble-shadow: 0 2px 6px rgb(0 0 0 / .35), 0 1px 2px rgb(0 0 0 / .4);
  --gh-text: #c4c4c4; --gh-status: #8f8f8f; --gh-read: #8f8f8f; --gh-glow: .45;
}
.gh *, .gh *::before, .gh *::after { box-sizing: border-box; margin: 0; }
.gh-stage { position: absolute; left: 0; top: 0; z-index: 1; width: ${W}px; height: ${H}px; padding: 22px 22px 0;
  transform-origin: 0 0; transform: scale(var(--gh-scale)); display: flex; flex-direction: column; align-items: center; gap: 14px; }
.gh-content { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px;
  transform: scale(.86); transform-origin: 50% 45%; }

.gh-status { font-size: 11px; line-height: 1.4; color: var(--gh-status); letter-spacing: .01em;
  transition: color calc(.3s / var(--gh-speed)); animation: gh-fade calc(.5s / var(--gh-speed)) ease-out calc(.1s / var(--gh-speed)) backwards; }
.gh-bubbles { width: 100%; padding-right: 14px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
  transition: transform calc(.4s / var(--gh-speed)) cubic-bezier(.4, 0, .2, 1); }
.gh-bubble { transform-origin: 100% 100%; max-width: min(68%, 26ch); width: fit-content; padding: 7px 12px;
  background: var(--gh-bubble); border: 1px solid var(--gh-bubble-border); border-radius: 14px 14px 4px;
  box-shadow: var(--gh-bubble-shadow); font-size: 12.5px; line-height: 1.3; font-weight: 500; color: var(--gh-text);
  animation: gh-arrive calc(.62s / var(--gh-speed)) var(--gh-ease) backwards; animation-delay: calc(var(--gh-delay, 0ms) / var(--gh-speed)); }
.gh-read { font-size: 10.5px; line-height: 1.4; color: var(--gh-read); margin-top: 2px; align-self: flex-end;
  transition: color calc(.3s / var(--gh-speed)); animation: gh-fade calc(.5s / var(--gh-speed)) ease-out backwards; animation-delay: calc(var(--gh-delay, 0ms) / var(--gh-speed)); }

/* The last bubble: a red shimmer sweeps through its text and a soft rainbow glow sits underneath. */
.gh-alert { display: inline-block;
  background-image: linear-gradient(90deg, var(--gh-ink) 0%, var(--gh-ink) 38%, var(--gh-alert) 50%, var(--gh-ink) 62%, var(--gh-ink) 100%);
  background-size: 300% 100%; background-position: 100% 0; background-repeat: no-repeat; background-clip: text; -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent; animation: gh-shine calc(4.5s / var(--gh-speed)) ease-in-out infinite; }
.gh-last { position: relative; isolation: isolate; padding: 6px 11px; margin-bottom: 6px; background: transparent; border-color: transparent; box-shadow: none; }
.gh-last::before { content: ""; position: absolute; inset: -1px; z-index: -1; background: var(--gh-bubble);
  border: 1px solid var(--gh-bubble-border); border-radius: inherit; box-shadow: var(--gh-bubble-shadow); }
.gh-last::after { content: ""; position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); width: 100%; height: 22px;
  background: linear-gradient(90deg, #ffa0ab 0%, #ffb89e 33%, #c8a8e5 66%, #a8b5ff 100%);
  opacity: var(--gh-glow); filter: blur(12px); border-radius: 50%; pointer-events: none; z-index: -2; }

.gh-reply { position: absolute; left: 64px; bottom: 68px; display: flex; align-items: center; padding: 6px 12px;
  background: var(--gh-accent); border: 1px solid var(--gh-accent); border-radius: 14px 14px 14px 4px; color: #fff;
  font-size: 15px; line-height: 1.1;
  box-shadow: 0 4px 12px color-mix(in oklab, var(--gh-accent) 22%, transparent), 0 1px 2px color-mix(in oklab, var(--gh-accent) 18%, transparent);
  opacity: 0; transform: translateY(14px) scale(.92); transform-origin: left bottom; pointer-events: none;
  transition: opacity calc(.35s / var(--gh-speed)), transform calc(.45s / var(--gh-speed)) cubic-bezier(.34, 1.4, .64, 1); }
:is(.dark, [data-theme="dark"]) .gh-reply { box-shadow: 0 4px 12px rgb(0 0 0 / .4), 0 1px 2px rgb(0 0 0 / .4); }
.gh-reply svg { display: block; width: 15px; height: 15px; }

.gh[data-hot] .gh-status, .gh[data-hot] .gh-read { color: transparent; }
.gh[data-hot] .gh-bubbles { transform: translateY(-12px); }
.gh[data-hot] .gh-reply { opacity: 1; transform: none; }

@keyframes gh-arrive { 0% { opacity: 0; transform: translateY(10px) scale(.92); filter: blur(2px) } 100% { opacity: 1; transform: none; filter: none } }
@keyframes gh-fade { 0% { opacity: 0 } 100% { opacity: 1 } }
@keyframes gh-shine { 0% { background-position: 100% 0 } 35%, 100% { background-position: 0% 0 } }

.gh[data-paused] *, .gh[data-paused] *::before, .gh[data-paused] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .gh *, .gh *::before, .gh *::after { animation: none !important; transition: none !important; }
  .gh-alert { background-position: 0% 0; }
}
`

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** Toggles `open` on a timer: closed for `closedMs`, open for `openMs` (both divided by speed). */
function useIdleToggle(opts: { enabled: boolean; speedRef: React.RefObject<number>; closedMs: number; openMs: number }) {
  const { enabled, speedRef, closedMs, openMs } = opts
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => setOpen((o) => !o), (open ? openMs : closedMs) / Math.max(0.1, speedRef.current))
    return () => window.clearTimeout(t)
  }, [enabled, open, openMs, closedMs, speedRef])
  return open
}

const DEFAULT_MESSAGES = ["Did the invite arrive?", "Happy to walk through the plan whenever suits.", "Hello?"]

export function GhostedChat({
  speed = 1,
  paused,
  accent,
  label = "A chat with unanswered messages marked as read",
  messages = DEFAULT_MESSAGES,
  status = "No new messages",
  readLabel = "Read",
  reply,
  className,
}: GhostedChatProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = React.useState(false)
  const speedRef = React.useRef(speed)
  React.useEffect(() => {
    speedRef.current = speed
  })

  // Scale the fixed 360 × 240 stage to the container width – no React state, just a CSS variable.
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const apply = () => el.style.setProperty("--gh-scale", String(el.clientWidth / W))
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // After the intro has played, nudge the scene on its own now and then: lift the bubbles and show the reply.
  const auto = useIdleToggle({ enabled: !paused && !reduced && !hovered, speedRef, closedMs: 5200, openMs: 2400 })
  const hot = hovered || auto

  const vars = {
    "--gh-speed": Math.max(0.1, speed),
    ...(accent ? { "--gh-accent": accent } : null),
  } as React.CSSProperties

  const last = messages.length - 1
  // Each bubble arrives ~0.9 s after the previous one; the last one waits a beat longer.
  const delays = messages.map((_, i) => 500 + i * 900 + (i === last ? 100 : 0))
  const readDelay = (delays[last] ?? 500) + 900

  return (
    <div
      ref={rootRef}
      className={className ? `gh ${className}` : "gh"}
      role="img"
      aria-label={label}
      data-hot={hot || undefined}
      data-paused={paused || undefined}
      style={vars}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <style href="ghosted-chat" precedence="default">
        {CSS}
      </style>
      <div className="gh-stage" aria-hidden="true">
        <div className="gh-content">
          <span className="gh-status">{status}</span>
          <div className="gh-bubbles">
            {messages.map((m, i) => (
              <div
                key={i}
                className={i === last ? "gh-bubble gh-last" : "gh-bubble"}
                style={{ "--gh-delay": `${delays[i]}ms` } as React.CSSProperties}
              >
                {i === last ? <span className="gh-alert">{m}</span> : <span>{m}</span>}
              </div>
            ))}
            <span className="gh-read" style={{ "--gh-delay": `${readDelay}ms` } as React.CSSProperties}>
              {readLabel}
            </span>
          </div>
          <div className="gh-reply">{reply ?? <ThumbsDown strokeWidth={2.2} />}</div>
        </div>
      </div>
    </div>
  )
}
