"use client"

import * as React from "react"
import { Check, Database, Globe, Sparkles } from "lucide-react"

/**
 * LeadSourcing – an AI tile wired to two tools. A shine runs from the first tool into the AI,
 * then out to the second tool, while a status pill walks through what the agent is doing.
 * Faint placeholder tiles around the scene suggest more tools that could be plugged in.
 *
 *   <LeadSourcing tools={[{ name: "Web search", icon: <Globe /> }, { name: "CRM", icon: <Database /> }]} />
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LeadSourcingTool = {
  name: string
  /** Glyph for the tool tile (28px area). */
  icon: React.ReactNode
}

export type LeadSourcingProps = {
  /** The tool the agent reads from and the tool it writes to. */
  tools?: [LeadSourcingTool, LeadSourcingTool]
  /** Content of the AI tile. Default: a sparkles glyph. */
  center?: React.ReactNode
  /** Three status lines the pill cycles through (search → qualify → save). */
  steps?: [string, string, string]
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) used for the AI tile, the shine and the glow. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const DEFAULT_TOOLS: [LeadSourcingTool, LeadSourcingTool] = [
  { name: "Web search", icon: <Globe size={28} strokeWidth={1.6} /> },
  { name: "CRM", icon: <Database size={28} strokeWidth={1.6} /> },
]

const DEFAULT_STEPS: [string, string, string] = ["Searching the web", "Scoring fit", "Saved to CRM"]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 380
const AI = { x: 320, y: 190 }
const TOOL_A = { x: 130, y: 120 }
const TOOL_B = { x: 510, y: 260 }
const CYCLE = 5 // seconds

const PATH_A = "M170 120 C 232 120 222 190 270 190"
const PATH_B = "M370 190 C 418 190 410 260 470 260"

const GHOSTS: { x: number; y: number; d: number }[] = [
  { x: 60, y: 250, d: 0 },
  { x: 190, y: 312, d: 1.2 },
  { x: 320, y: 50, d: 2.1 },
  { x: 470, y: 62, d: 0.6 },
  { x: 584, y: 160, d: 1.7 },
  { x: 430, y: 324, d: 2.6 },
]

function useStageScale(designWidth: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / designWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [designWidth])
  return [ref, scale] as const
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lsr {
  --lsr-ink: #000;
  --lsr-surface: #fff;
  --lsr-accent: #0060e2;
  --lsr-speed: 1;
  --lsr-t1: color-mix(in oklab, var(--lsr-ink) 88%, transparent);
  --lsr-t2: color-mix(in oklab, var(--lsr-ink) 61%, transparent);
  --lsr-t3: color-mix(in oklab, var(--lsr-ink) 45%, transparent);
  --lsr-t4: color-mix(in oklab, var(--lsr-ink) 27%, transparent);
  --lsr-fill: color-mix(in oklab, var(--lsr-ink) 6%, transparent);
  --lsr-line: color-mix(in oklab, var(--lsr-ink) 12%, transparent);
  --lsr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --lsr-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 30px -12px rgb(0 0 0 / .22), 0 1px 2px 0 rgb(0 0 0 / .05);
  --lsr-ease: cubic-bezier(.22, 1, .36, 1);
  --lsr-cycle: calc(${CYCLE}s / var(--lsr-speed));
  --lsr-scale: 1;
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--lsr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--lsr-t1);
}
:is(.dark, [data-theme="dark"]) .lsr {
  --lsr-ink: #fff;
  --lsr-surface: #1c1c1e;
  --lsr-accent: #4d8dff;
  --lsr-t1: color-mix(in oklab, var(--lsr-ink) 90%, transparent);
  --lsr-t2: color-mix(in oklab, var(--lsr-ink) 62%, transparent);
  --lsr-t3: color-mix(in oklab, var(--lsr-ink) 46%, transparent);
  --lsr-t4: color-mix(in oklab, var(--lsr-ink) 28%, transparent);
  --lsr-fill: color-mix(in oklab, var(--lsr-ink) 8%, transparent);
  --lsr-line: color-mix(in oklab, var(--lsr-ink) 16%, transparent);
  --lsr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --lsr-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 14px 30px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.lsr *, .lsr *::before, .lsr *::after { box-sizing: border-box }

.lsr-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--lsr-scale)); visibility: hidden }
.lsr[data-ready] .lsr-stage { visibility: visible }
.lsr-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }

/* Connections */
.lsr-base { fill: none; stroke: var(--lsr-line); stroke-width: 1.5; stroke-linecap: round }
.lsr-shine, .lsr-glow {
  fill: none; stroke: var(--lsr-accent); stroke-linecap: round; stroke-dasharray: .14 2;
  animation: lsr-run var(--lsr-cycle) cubic-bezier(.5, 0, .3, 1) infinite backwards; animation-delay: var(--lsr-delay, 0s);
}
.lsr-shine { stroke-width: 2.5 }
.lsr-glow { stroke-width: 9; opacity: .35; filter: blur(4px) }
.lsr-b { --lsr-delay: calc(var(--lsr-cycle) * .38) }
@keyframes lsr-run {
  0% { stroke-dashoffset: .14; opacity: 0 }
  3% { opacity: 1 }
  28% { stroke-dashoffset: -1; opacity: 1 }
  29%, 100% { stroke-dashoffset: -1; opacity: 0 }
}
.lsr-end { fill: var(--lsr-surface); stroke: var(--lsr-line); stroke-width: 1.5 }

/* Tiles */
.lsr-tool { position: absolute; width: 72px; display: flex; flex-direction: column; align-items: center; gap: 8px; translate: -50% -36px }
.lsr-tile {
  position: relative; display: grid; place-items: center; width: 72px; height: 72px; border-radius: 20px;
  background: var(--lsr-surface); box-shadow: var(--lsr-float); color: var(--lsr-t2);
  animation: lsr-in calc(.8s / var(--lsr-speed)) var(--lsr-ease) backwards; animation-delay: calc(var(--lsr-i, 0) * .12s);
}
@keyframes lsr-in { from { opacity: 0; transform: translateY(8px) scale(.94); filter: blur(4px) } }
.lsr-name { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--lsr-t3); white-space: nowrap }
.lsr-ping {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--lsr-accent) 60%, transparent);
  animation: lsr-ping var(--lsr-cycle) ease-out infinite backwards; animation-delay: var(--lsr-delay, 0s);
}
@keyframes lsr-ping { 0% { opacity: 0; transform: scale(1) } 3% { opacity: 1 } 16%, 100% { opacity: 0; transform: scale(1.22) } }
.lsr-ok {
  position: absolute; right: -6px; top: -6px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%;
  background: var(--lsr-accent); color: #fff; box-shadow: 0 0 0 3px var(--lsr-surface);
  animation: lsr-ok var(--lsr-cycle) var(--lsr-ease) infinite backwards;
}
.lsr-ok svg { width: 12px; height: 12px }
@keyframes lsr-ok {
  0%, 60% { opacity: 0; transform: scale(.4) }
  66%, 94% { opacity: 1; transform: scale(1) }
  100% { opacity: 0; transform: scale(.8) }
}

/* AI tile */
.lsr-ai { position: absolute; left: ${AI.x}px; top: ${AI.y}px; width: 92px; height: 92px; translate: -50% -50%;
  animation: lsr-in calc(.9s / var(--lsr-speed)) var(--lsr-ease) backwards; animation-delay: .24s }
.lsr-ai-glow {
  position: absolute; inset: -46px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--lsr-accent) 30%, transparent), transparent);
  animation: lsr-glow var(--lsr-cycle) ease-in-out infinite;
}
@keyframes lsr-glow { 0%, 20% { opacity: .25; transform: scale(.85) } 34% { opacity: 1; transform: scale(1.05) } 70%, 100% { opacity: .25; transform: scale(.85) } }
.lsr-ai-tile {
  position: relative; display: grid; place-items: center; width: 92px; height: 92px; border-radius: 28px; color: #fff;
  background: linear-gradient(160deg, color-mix(in oklab, var(--lsr-accent) 80%, #fff), var(--lsr-accent) 55%, color-mix(in oklab, var(--lsr-accent) 82%, #000));
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--lsr-accent) 70%, #000), inset 0 1px 0 rgb(255 255 255 / .45), 0 16px 32px -12px color-mix(in oklab, var(--lsr-accent) 70%, transparent);
  animation: lsr-bump var(--lsr-cycle) var(--lsr-ease) infinite;
}
.lsr-ai-tile svg { width: 36px; height: 36px }
@keyframes lsr-bump { 0%, 22% { transform: scale(1) } 32% { transform: scale(1.06) } 46%, 100% { transform: scale(1) } }

/* Status pill under the AI tile */
.lsr-pill {
  position: absolute; left: ${AI.x}px; top: ${AI.y + 76}px; width: 142px; height: 26px; translate: -50% 0; border-radius: 13px;
  background: var(--lsr-surface); box-shadow: var(--lsr-shadow); overflow: hidden;
}
.lsr-step {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: var(--lsr-t2);
  opacity: 0; animation: lsr-step var(--lsr-cycle) var(--lsr-ease) infinite; animation-delay: calc(var(--lsr-cycle) * var(--lsr-k) * .3333 - var(--lsr-cycle) * .04);
}
.lsr-step::before { content: ""; width: 5px; height: 5px; margin-right: 7px; border-radius: 50%; background: var(--lsr-accent) }
@keyframes lsr-step {
  0% { opacity: 0; transform: translateY(5px); filter: blur(3px) }
  6%, 28% { opacity: 1; transform: none; filter: none }
  34%, 100% { opacity: 0; transform: translateY(-5px); filter: blur(3px) }
}
.lsr-step[data-k="0"] { --lsr-k: 0 }
.lsr-step[data-k="1"] { --lsr-k: 1 }
.lsr-step[data-k="2"] { --lsr-k: 2 }

/* Placeholder tiles */
.lsr-ghost {
  position: absolute; width: 52px; height: 52px; translate: -50% -50%; border-radius: 15px; display: grid; place-items: center;
  border: 1px dashed var(--lsr-line); background: color-mix(in oklab, var(--lsr-ink) 2.5%, transparent);
  animation: lsr-in calc(.9s / var(--lsr-speed)) var(--lsr-ease) backwards, lsr-breathe calc(6s / var(--lsr-speed)) ease-in-out infinite;
  animation-delay: calc(.4s + var(--lsr-d) * .1s), calc(var(--lsr-d) * -1s);
}
.lsr-ghost i { display: block; width: 18px; height: 6px; border-radius: 3px; background: var(--lsr-fill) }
@keyframes lsr-breathe { 50% { opacity: .45 } }

.lsr[data-paused], .lsr[data-paused] *, .lsr[data-paused] *::before, .lsr[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .lsr *, .lsr *::before, .lsr *::after { animation: none !important; transition: none !important }
  .lsr-step[data-k="2"] { opacity: 1 }
  .lsr-ok { opacity: 1 }
  .lsr-shine { stroke-dasharray: none; opacity: .8 }
  .lsr-glow { opacity: 0 }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function LeadSourcing({
  tools = DEFAULT_TOOLS,
  center,
  steps = DEFAULT_STEPS,
  speed = 1,
  paused = false,
  accent,
  label = "An AI agent connected to a search tool and a CRM, passing a lead from one to the other",
  className,
}: LeadSourcingProps) {
  const [rootRef, scale] = useStageScale(W)

  const style = {
    "--lsr-speed": speed,
    "--lsr-scale": scale || 1,
    ...(accent ? { "--lsr-accent": accent } : null),
  } as React.CSSProperties

  const [a, b] = tools

  return (
    <div
      ref={rootRef}
      className={["lsr", className].filter(Boolean).join(" ")}
      style={style}
      role="img"
      aria-label={label}
      data-paused={paused || undefined}
      data-ready={scale > 0 || undefined}
    >
      <style href="lead-sourcing" precedence="default">
        {CSS}
      </style>
      <div className="lsr-stage" aria-hidden="true">
        {GHOSTS.map((g, i) => (
          <span key={i} className="lsr-ghost" style={{ left: g.x, top: g.y, "--lsr-d": g.d } as React.CSSProperties}>
            <i />
          </span>
        ))}

        <svg className="lsr-svg" viewBox={`0 0 ${W} ${H}`}>
          <path className="lsr-base" d={PATH_A} />
          <path className="lsr-base" d={PATH_B} />
          <circle className="lsr-end" cx={170} cy={120} r={3.5} />
          <circle className="lsr-end" cx={470} cy={260} r={3.5} />
          <path className="lsr-glow" pathLength={1} d={PATH_A} />
          <path className="lsr-shine" pathLength={1} d={PATH_A} />
          <path className="lsr-glow lsr-b" pathLength={1} d={PATH_B} />
          <path className="lsr-shine lsr-b" pathLength={1} d={PATH_B} />
        </svg>

        <div className="lsr-tool" style={{ left: TOOL_A.x, top: TOOL_A.y, "--lsr-i": 1 } as React.CSSProperties}>
          <span className="lsr-tile">
            {a.icon}
            <span className="lsr-ping" />
          </span>
          <span className="lsr-name">{a.name}</span>
        </div>

        <div className="lsr-tool" style={{ left: TOOL_B.x, top: TOOL_B.y, "--lsr-i": 2 } as React.CSSProperties}>
          <span className="lsr-tile">
            {b.icon}
            <span className="lsr-ok">
              <Check strokeWidth={3} />
            </span>
          </span>
          <span className="lsr-name">{b.name}</span>
        </div>

        <div className="lsr-ai">
          <span className="lsr-ai-glow" />
          <span className="lsr-ai-tile">{center ?? <Sparkles strokeWidth={1.6} />}</span>
        </div>
        <div className="lsr-pill">
          {steps.map((s, k) => (
            <span key={k} className="lsr-step" data-k={k}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeadSourcing
