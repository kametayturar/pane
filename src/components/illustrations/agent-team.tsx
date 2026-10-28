"use client"

import * as React from "react"
import { CalendarCheck, PenLine, Search, Sparkles, Target } from "lucide-react"

/**
 * AgentTeam – a prompt types itself, then branches out into a team of agent cards that get to work.
 * Loops.
 *
 *   <AgentTeam prompt="Build a team to work my inbound pipeline" />
 */

export type AgentTeamAgent = {
  /** Short role name, e.g. "Scout". */
  name: string
  /** One line about the job (two lines fit). */
  description: string
  /** 16px icon shown on the card. */
  icon?: React.ReactNode
}

export type AgentTeamProps = {
  /** The text that types itself. Keep it to one line (about 45 characters fit). */
  prompt?: string
  /** The agents the prompt branches into (up to five fit). */
  agents?: AgentTeamAgent[]
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the send button, branches and progress. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const W = 640
const H = 430
const PROMPT = { x: 320, bottom: 78 }
const CARD_TOP = 214

const DEFAULT_AGENTS: AgentTeamAgent[] = [
  { name: "Scout", description: "Finds new leads in the inbox", icon: <Search /> },
  { name: "Qualifier", description: "Scores fit and intent for each lead", icon: <Target /> },
  { name: "Writer", description: "Drafts a personal first reply", icon: <PenLine /> },
  { name: "Scheduler", description: "Books the intro call on the calendar", icon: <CalendarCheck /> },
]

const CSS = `
.at {
  --at-ink: #000;
  --at-surface: #fff;
  --at-accent: #0060e2;
  --at-speed: 1;
  --at-scale: 1;
  --at-n: 40;
  --at-t1: color-mix(in oklab, var(--at-ink) 88%, transparent);
  --at-t2: color-mix(in oklab, var(--at-ink) 61%, transparent);
  --at-t3: color-mix(in oklab, var(--at-ink) 45%, transparent);
  --at-t4: color-mix(in oklab, var(--at-ink) 27%, transparent);
  --at-fill: color-mix(in oklab, var(--at-ink) 6%, transparent);
  --at-line: color-mix(in oklab, var(--at-ink) 16%, transparent);
  --at-green: #1fa85a;
  --at-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --at-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .2), 0 1px 2px 0 rgb(0 0 0 / .05);
  --at-ease: cubic-bezier(.22, 1, .36, 1);
  --at-T: calc(12s / var(--at-speed));
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--at-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .at {
  --at-ink: #fff; --at-surface: #1c1c1e; --at-accent: #4d8dff;
  --at-t1: color-mix(in oklab, var(--at-ink) 90%, transparent);
  --at-t2: color-mix(in oklab, var(--at-ink) 62%, transparent);
  --at-t3: color-mix(in oklab, var(--at-ink) 46%, transparent);
  --at-t4: color-mix(in oklab, var(--at-ink) 28%, transparent);
  --at-fill: color-mix(in oklab, var(--at-ink) 8%, transparent);
  --at-line: color-mix(in oklab, var(--at-ink) 20%, transparent);
  --at-green: #34d27b;
  --at-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --at-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 12px 28px -10px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.at *, .at *::before, .at *::after { box-sizing: border-box }
.at-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--at-scale)) }

/* Prompt box */
.at-prompt { position: absolute; left: ${PROMPT.x - 210}px; top: 26px; width: 420px; height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 16px;
  border-radius: 16px; background: var(--at-surface); box-shadow: var(--at-float); animation: at-prompt var(--at-T) var(--at-ease) infinite }
.at-spark { flex: none; width: 16px; height: 16px; color: var(--at-accent) }
.at-text { flex: 1; min-width: 0; overflow: hidden; font-size: 14px; line-height: 20px; color: var(--at-t1); white-space: nowrap }
.at-type { position: relative; display: inline-block; padding-right: 2px }
.at-ghost { visibility: hidden }
.at-live { position: absolute; left: 0; top: 0; clip-path: inset(0 100% 0 0); animation: at-clip var(--at-T) steps(var(--at-n), end) infinite }
.at-caret-pos { position: absolute; left: 0; top: 0; height: 100%; width: 0; animation: at-caret-pos var(--at-T) steps(var(--at-n), end) infinite }
.at-caret { position: absolute; left: 1px; top: 3px; width: 1.5px; height: 14px; border-radius: 1px; background: var(--at-accent); animation: at-blink calc(1s / var(--at-speed)) steps(1, end) infinite }
.at-send { position: relative; flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: #fff; background: var(--at-accent); animation: at-send var(--at-T) var(--at-ease) infinite }
.at-send svg { width: 14px; height: 14px }
.at-send::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--at-accent); opacity: 0; animation: at-ripple var(--at-T) ease-out infinite }
@keyframes at-prompt {
  0% { opacity: 0; transform: translateY(8px) scale(.98); filter: blur(3px) }
  4% { opacity: 1; transform: none; filter: blur(0) }
  93% { opacity: 1; transform: none; filter: blur(0) }
  98%, 100% { opacity: 0; transform: translateY(-4px) scale(.99); filter: blur(3px) }
}
@keyframes at-clip { 0%, 5% { clip-path: inset(0 100% 0 0) } 28%, 99.9% { clip-path: inset(0 0 0 0) } 100% { clip-path: inset(0 100% 0 0) } }
@keyframes at-caret-pos { 0%, 5% { left: 0; opacity: 1 } 28%, 31% { left: 100%; opacity: 1 } 32%, 99.9% { left: 100%; opacity: 0 } 100% { left: 0; opacity: 1 } }
@keyframes at-blink { 50% { opacity: 0 } }
@keyframes at-send {
  0%, 27% { background: var(--at-fill); color: var(--at-t3); transform: scale(1) }
  29% { background: var(--at-accent); color: #fff }
  30.5% { transform: scale(.84); background: var(--at-accent); color: #fff }
  34%, 99.9% { transform: scale(1); background: var(--at-accent); color: #fff }
  100% { background: var(--at-fill); color: var(--at-t3) }
}
@keyframes at-ripple { 0%, 30% { opacity: 0; transform: scale(1) } 31% { opacity: .55 } 42%, 100% { opacity: 0; transform: scale(2.1) } }

/* Branches */
.at-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.at-lines path { fill: none; stroke-linecap: butt }
.at-b { stroke: var(--at-line); stroke-width: 1.5; stroke-dasharray: 1 1; animation: at-branch var(--at-T) linear infinite; animation-delay: calc(var(--i) * var(--at-step) / var(--at-speed)) }
.at-g { stroke: var(--at-accent); stroke-width: 2; stroke-dasharray: .12 2; opacity: 0; animation: at-glint var(--at-T) linear infinite; animation-delay: calc(var(--i) * var(--at-step) / var(--at-speed)) }
@keyframes at-branch {
  0%, 33% { stroke-dashoffset: 1; opacity: 1; animation-timing-function: cubic-bezier(.5, 0, .2, 1) }
  46%, 88% { stroke-dashoffset: 0; opacity: 1 }
  92%, 100% { stroke-dashoffset: 0; opacity: 0 }
}
@keyframes at-glint {
  0%, 46% { stroke-dashoffset: .12; opacity: 0 }
  47% { opacity: 1 }
  66% { stroke-dashoffset: -1; opacity: 1 }
  66.1% { stroke-dashoffset: .12; opacity: 1 }
  86% { stroke-dashoffset: -1; opacity: 1 }
  88%, 100% { stroke-dashoffset: -1; opacity: 0 }
}
.at-root { position: absolute; left: ${PROMPT.x - 3.5}px; top: ${PROMPT.bottom - 3.5}px; width: 7px; height: 7px; border-radius: 50%; background: var(--at-accent);
  box-shadow: 0 0 0 3px var(--at-surface); animation: at-root var(--at-T) var(--at-ease) infinite }
@keyframes at-root { 0%, 32% { opacity: 0; transform: scale(0) } 36%, 88% { opacity: 1; transform: scale(1) } 92%, 100% { opacity: 0; transform: scale(0) } }

/* Agent cards */
.at-card { position: absolute; top: ${CARD_TOP}px; display: flex; flex-direction: column; padding: 12px; border-radius: 12px; background: var(--at-surface); box-shadow: var(--at-shadow);
  animation: at-card var(--at-T) var(--at-ease) infinite; animation-delay: calc(var(--i) * var(--at-step) / var(--at-speed)) }
@keyframes at-card {
  0%, 38% { opacity: 0; transform: translateY(14px) scale(.96); filter: blur(3px) }
  48% { opacity: 1; transform: none; filter: blur(0) }
  88% { opacity: 1; transform: none; filter: blur(0) }
  92%, 100% { opacity: 0; transform: translateY(-4px) scale(.98); filter: blur(3px) }
}
.at-ic { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--at-accent);
  background: color-mix(in oklab, var(--at-accent) 12%, transparent) }
.at-ic svg { width: 16px; height: 16px; stroke-width: 2 }
.at-title { margin-top: 10px; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--at-t1) }
.at-desc { height: 32px; margin-top: 1px; overflow: hidden; font-size: 11.5px; line-height: 16px; color: var(--at-t3) }
.at-bar { height: 3px; margin-top: 12px; border-radius: 2px; background: var(--at-fill); overflow: hidden }
.at-bar i { display: block; height: 100%; border-radius: 2px; background: var(--at-accent); transform-origin: 0 50%; animation: at-bar var(--at-T) linear infinite; animation-delay: calc(var(--i) * var(--at-step) / var(--at-speed)) }
@keyframes at-bar { 0%, 50% { transform: scaleX(0); background: var(--at-accent) } 77% { transform: scaleX(1); background: var(--at-accent) } 80%, 100% { transform: scaleX(1); background: var(--at-green) } }
.at-status { position: relative; display: grid; height: 16px; margin-top: 8px; font-size: 11px; line-height: 16px; font-weight: 500 }
.at-status span { grid-area: 1 / 1; display: flex; align-items: center; gap: 5px; white-space: nowrap; opacity: 0; animation-duration: var(--at-T); animation-timing-function: linear; animation-iteration-count: infinite;
  animation-delay: calc(var(--i) * var(--at-step) / var(--at-speed)) }
.at-s-q { color: var(--at-t3); animation-name: at-sq }
.at-s-w { color: var(--at-accent); animation-name: at-sw }
.at-s-d { color: var(--at-green); animation-name: at-sd }
.at-s-w::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: at-pulse calc(1s / var(--at-speed)) ease-in-out infinite alternate }
.at-s-d svg { width: 12px; height: 12px }
@keyframes at-sq { 0%, 51% { opacity: 1 } 54%, 100% { opacity: 0 } }
@keyframes at-sw { 0%, 51% { opacity: 0 } 54%, 76% { opacity: 1 } 79%, 100% { opacity: 0 } }
@keyframes at-sd { 0%, 76% { opacity: 0; transform: translateY(3px) } 80%, 100% { opacity: 1; transform: none } }
@keyframes at-pulse { from { opacity: .35; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }

/* Footer pill */
.at-pill { position: absolute; left: 50%; top: 392px; display: flex; align-items: center; gap: 7px; height: 26px; padding: 0 12px; margin-left: -70px; width: 140px; justify-content: center; border-radius: 13px;
  background: var(--at-surface); box-shadow: var(--at-shadow); font-size: 11.5px; font-weight: 500; color: var(--at-t2); white-space: nowrap; animation: at-pill var(--at-T) var(--at-ease) infinite }
.at-pill i { width: 6px; height: 6px; border-radius: 50%; background: var(--at-green) }
@keyframes at-pill { 0%, 56% { opacity: 0; transform: translateY(6px) } 62%, 88% { opacity: 1; transform: none } 92%, 100% { opacity: 0; transform: translateY(6px) } }

.at[data-paused] *, .at[data-paused] *::before, .at[data-paused] *::after { animation-play-state: paused !important }

/* Reduced motion: hold the finished frame – typed, branched, every agent done. */
@media (prefers-reduced-motion: reduce) {
  .at *, .at *::before, .at *::after { animation: none !important; transition: none !important }
  .at-live { clip-path: none }
  .at-caret-pos, .at-s-q, .at-s-w, .at-g { opacity: 0 }
  .at-s-d { opacity: 1 }
  .at-b { stroke-dashoffset: 0 }
  .at-bar i { transform: none; background: var(--at-green) }
}
`

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8.5l3.2 3.2L13 4.8" />
  </svg>
)

export function AgentTeam({
  prompt = "Build a team to work my inbound pipeline",
  agents = DEFAULT_AGENTS,
  speed = 1,
  paused,
  accent,
  label = "A prompt types itself and branches out into a team of agents that each get to work",
  className,
}: AgentTeamProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--at-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const list = agents.slice(0, 5)
  const n = list.length
  const gap = 14
  const cw = Math.min(150, Math.floor((W - 56 - gap * (n - 1)) / Math.max(1, n)))
  const cx = (i: number) => W / 2 + (i - (n - 1) / 2) * (cw + gap)
  const step = n > 1 ? Math.min(0.22, 0.66 / (n - 1)) : 0

  const vars = {
    ...(accent ? { "--at-accent": accent } : null),
    "--at-speed": Math.max(0.05, speed),
    "--at-n": Math.max(1, prompt.length),
    "--at-step": `${step}s`,
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={className ? `at ${className}` : "at"} role="img" aria-label={label} data-paused={paused || undefined} style={vars}>
      <style href="pane-agent-team" precedence="default">
        {CSS}
      </style>
      <div className="at-stage" aria-hidden>
        <svg className="at-lines" viewBox={`0 0 ${W} ${H}`}>
          {list.map((_, i) => {
            const d = `M${PROMPT.x} ${PROMPT.bottom} C${PROMPT.x} ${CARD_TOP - 64}, ${cx(i)} ${CARD_TOP - 64}, ${cx(i)} ${CARD_TOP}`
            return (
              <g key={i} style={{ "--i": i } as React.CSSProperties}>
                <path className="at-b" d={d} pathLength={1} />
                <path className="at-g" d={d} pathLength={1} />
              </g>
            )
          })}
        </svg>

        <div className="at-prompt">
          <Sparkles className="at-spark" />
          <div className="at-text">
            <span className="at-type">
              <span className="at-ghost">{prompt}</span>
              <span className="at-live">{prompt}</span>
              <span className="at-caret-pos">
                <i className="at-caret" />
              </span>
            </span>
          </div>
          <div className="at-send">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
            </svg>
          </div>
        </div>
        <i className="at-root" />

        {list.map((a, i) => (
          <div key={`${a.name}-${i}`} className="at-card" style={{ left: cx(i) - cw / 2, width: cw, "--i": i } as React.CSSProperties}>
            <div className="at-ic">{a.icon ?? <Sparkles />}</div>
            <div className="at-title">{a.name}</div>
            <div className="at-desc">{a.description}</div>
            <div className="at-bar">
              <i />
            </div>
            <div className="at-status">
              <span className="at-s-q">Queued</span>
              <span className="at-s-w">Working</span>
              <span className="at-s-d">
                {CHECK}Done
              </span>
            </div>
          </div>
        ))}

        <div className="at-pill">
          <i />
          {n} {n === 1 ? "agent" : "agents"} on it
        </div>
      </div>
    </div>
  )
}
