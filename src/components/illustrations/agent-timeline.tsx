"use client"

import * as React from "react"
import { Brain, GanttChart, Hourglass, TriangleAlert, Wrench } from "lucide-react"

/**
 * AgentTimeline – one orchestrated agent run on a shared time axis. Agents get a row, spans show
 * thinking, tool calls and waiting, handoff connectors link the rows, and a playhead replays the run
 * while the header counts time, tokens and cost. Hover a span for details, click to pin it and trace its handoff.
 * Sample data; nothing is measured.
 *
 *   <AgentTimeline />
 */

export type AgentTimelineAgent = {
  id: string
  name: string
  /** Model name shown under the agent, e.g. "Nova". */
  model?: string
  /** What it does. Shown in the span card. */
  role?: string
  /** Price in USD per million tokens, for the cost counter. */
  price?: number
}

export type AgentTimelineSpan = {
  id?: string
  /** The agent id this span belongs to. */
  agent: string
  kind: "thinking" | "tool" | "waiting"
  /** Short name, e.g. "search_orders". */
  label: string
  /** Seconds from the start of the run. */
  start: number
  end: number
  /** A failed span is drawn with an error mark. Default "ok". */
  status?: "ok" | "failed"
  /** Tokens used by the span (thinking and tool spans). */
  tokens?: number
  /** One line for the span card. */
  detail?: string
}

export type AgentTimelineHandoff = {
  from: string
  to: string
  /** Seconds. */
  at: number
  label?: string
}

export type AgentTimelineRun = {
  title: string
  agents: AgentTimelineAgent[]
  spans: AgentTimelineSpan[]
  handoffs: AgentTimelineHandoff[]
  /** Seconds. Defaults to the end of the last span. */
  duration?: number
}

export type AgentTimelineProps = {
  /** The run to replay. Defaults to a sample five-agent investigation. */
  run?: AgentTimelineRun
  /** Heading. Defaults to the run title. */
  title?: string
  /** Pinned span changed (null when unpinned). */
  onSpanSelect?: (span: AgentTimelineSpan | null) => void
  /** Called each time the replay finishes. */
  onComplete?: () => void
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for thinking spans, the playhead and pinned handoffs. */
  accent?: string
  /** Accessible name. */
  label?: string
  className?: string
}

const S = (agent: string, kind: AgentTimelineSpan["kind"], label: string, start: number, end: number, tokens?: number, extra?: Partial<AgentTimelineSpan>): AgentTimelineSpan => ({
  agent,
  kind,
  label,
  start,
  end,
  tokens,
  ...extra,
})

export const SAMPLE_RUN: AgentTimelineRun = {
  title: "Why did refunds spike on Oct 14?",
  duration: 26.4,
  agents: [
    { id: "lead", name: "Orchestrator", model: "Nova", role: "Plans the work and hands it out", price: 8 },
    { id: "check", name: "Checker", model: "Nova Mini", role: "Checks refund records", price: 0.8 },
    { id: "research", name: "Researcher", model: "Atlas", role: "Reads support tickets", price: 3 },
    { id: "analyst", name: "Analyst", model: "Sage", role: "Runs the numbers", price: 1.2 },
    { id: "writer", name: "Writer", model: "Quill", role: "Writes the summary", price: 0.6 },
  ],
  spans: [
    S("lead", "thinking", "Plan", 0, 2.4, 2600, { detail: "Splits the question into a records check and a ticket review." }),
    S("lead", "waiting", "Waiting", 2.4, 9, 0, { detail: "Waiting for the checker and the researcher." }),
    S("lead", "thinking", "Merge findings", 9, 11.2, 3100, { detail: "Combines both reports into one picture." }),
    S("lead", "waiting", "Waiting", 11.2, 19, 0, { detail: "Waiting for the analyst." }),
    S("lead", "thinking", "Review", 19, 20.6, 2100, { detail: "Checks the numbers against the tickets." }),
    S("lead", "waiting", "Waiting", 20.6, 25.4, 0, { detail: "Waiting for the writer." }),
    S("lead", "thinking", "Answer", 25.4, 26.4, 1400, { detail: "Sends the final answer." }),

    S("check", "thinking", "Read policy", 2.8, 4, 1800),
    S("check", "tool", "query_refunds", 4, 6.2, 1200, { detail: "Pulls refund events for Oct 12 to 15." }),
    S("check", "thinking", "Compare", 6.2, 7, 900),
    S("check", "tool", "fetch_status", 7, 7.8, 300, { status: "failed", detail: "Timed out after 800 ms." }),
    S("check", "tool", "fetch_status", 8, 8.9, 400, { detail: "Retry succeeded." }),

    S("research", "thinking", "Skim tickets", 2.8, 4.4, 2200),
    S("research", "tool", "search_tickets", 4.4, 8.2, 3400, { detail: "Finds 212 tickets that mention a double charge." }),
    S("research", "thinking", "Summarise", 8.2, 8.9, 1700),

    S("analyst", "thinking", "Frame query", 11.6, 13, 2000),
    S("analyst", "tool", "run_cohort_sql", 13, 16.4, 4200, { detail: "Groups refunds by checkout version." }),
    S("analyst", "thinking", "Explain", 16.4, 18.6, 3300),

    S("writer", "thinking", "Draft", 21, 23.2, 2900),
    S("writer", "tool", "post_to_channel", 23.2, 24.2, 600, { detail: "Posts the draft to #support-leads." }),
    S("writer", "thinking", "Polish", 24.2, 25.2, 1100),
  ],
  handoffs: [
    { from: "lead", to: "check", at: 2.4, label: "Check refunds" },
    { from: "lead", to: "research", at: 2.4, label: "Read tickets" },
    { from: "lead", to: "analyst", at: 11.2, label: "Run the numbers" },
    { from: "lead", to: "writer", at: 20.6, label: "Write it up" },
  ],
}

/* -------------------------------------------------------------------------- */
/*                                   Geometry                                 */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 420
const PLOT_X = 152
const PLOT_W = 456
const ROW_TOP = 112
const ROW_PITCH = 44
const SPAN_H = 22
const STORY_RATE = 2.4 // story seconds per real second at speed 1
const HOLD = 4.2 // real seconds on the finished frame

const fmtTime = (s: number) => `${s.toFixed(1)}s`
const KIND_NAME = { thinking: "Thinking", tool: "Tool call", waiting: "Waiting" } as const

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.atl {
  --atl-ink: #000;
  --atl-surface: #fff;
  --atl-accent: #0060e2;
  --atl-green: #1fa85a;
  --atl-red: #e5484d;
  --atl-speed: 1;
  --atl-scale: 1;
  --atl-now: 0;
  --atl-t1: color-mix(in oklab, var(--atl-ink) 88%, transparent);
  --atl-t2: color-mix(in oklab, var(--atl-ink) 61%, transparent);
  --atl-t3: color-mix(in oklab, var(--atl-ink) 45%, transparent);
  --atl-t4: color-mix(in oklab, var(--atl-ink) 27%, transparent);
  --atl-fill: color-mix(in oklab, var(--atl-ink) 4.5%, transparent);
  --atl-line: color-mix(in oklab, var(--atl-ink) 7%, transparent);
  --atl-rail: color-mix(in oklab, var(--atl-ink) 14%, transparent);
  --atl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --atl-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 32px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --atl-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--atl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left; color: var(--atl-t1);
}
:is(.dark, [data-theme="dark"]) .atl {
  --atl-ink: #fff; --atl-surface: #1c1c1e; --atl-accent: #4d8dff; --atl-green: #34d27b; --atl-red: #ff6369;
  --atl-t1: color-mix(in oklab, var(--atl-ink) 90%, transparent);
  --atl-t2: color-mix(in oklab, var(--atl-ink) 62%, transparent);
  --atl-t3: color-mix(in oklab, var(--atl-ink) 46%, transparent);
  --atl-t4: color-mix(in oklab, var(--atl-ink) 28%, transparent);
  --atl-fill: color-mix(in oklab, var(--atl-ink) 6%, transparent);
  --atl-line: color-mix(in oklab, var(--atl-ink) 9%, transparent);
  --atl-rail: color-mix(in oklab, var(--atl-ink) 18%, transparent);
  --atl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --atl-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 32px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.atl *, .atl *::before, .atl *::after { box-sizing: border-box }
.atl button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.atl :focus-visible { outline: 2px solid color-mix(in oklab, var(--atl-accent) 60%, transparent); outline-offset: 2px }
.atl-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--atl-scale));
  border-radius: 18px; background: var(--atl-surface); box-shadow: var(--atl-float); overflow: hidden }
.atl-body { position: absolute; inset: 0; transition: opacity calc(.45s / var(--atl-speed)) ease }
.atl[data-reset] .atl-body { opacity: 0 }

/* Header */
.atl-head { position: absolute; left: 24px; right: 24px; top: 20px; display: flex; align-items: center; gap: 10px; height: 24px }
.atl-mark { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--atl-accent); background: color-mix(in oklab, var(--atl-accent) 12%, transparent) }
.atl-mark svg { width: 13px; height: 13px; stroke-width: 2.2 }
.atl-title { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; letter-spacing: -.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.atl-status { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 10px 0 8px; border-radius: 11px; font-size: 11.5px; line-height: 22px; font-weight: 500; color: var(--atl-t2); background: var(--atl-fill) }
.atl-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--atl-t4) }
.atl-status[data-s="run"] i { background: var(--atl-accent); animation: atl-pulse calc(1s / var(--atl-speed)) ease-in-out infinite alternate }
.atl-status[data-s="done"] i { background: var(--atl-green) }
.atl-stats { position: absolute; left: 24px; right: 24px; top: 48px; height: 20px; font-size: 12.5px; color: var(--atl-t3); white-space: nowrap; overflow: hidden }
.atl-stats > span { display: flex; gap: 8px; animation: atl-text calc(.45s / var(--atl-speed)) var(--atl-ease) backwards }
.atl-stats b { font-weight: 500; color: var(--atl-t2); font-variant-numeric: tabular-nums }
.atl-stats .atl-n { display: inline-block; min-width: 3.4em }
.atl-stats .atl-sep { color: var(--atl-t4) }
.atl-rule { position: absolute; left: 0; right: 0; top: 80px; height: 1px; background: var(--atl-line) }

/* Axis and rows */
.atl-tick { position: absolute; top: 90px; width: 0; font-size: 10.5px; line-height: 14px; font-variant-numeric: tabular-nums; color: var(--atl-t4) }
.atl-tick span { position: absolute; left: 0; transform: translateX(-50%); white-space: nowrap }
.atl-grid { position: absolute; top: 108px; width: 1px; background: var(--atl-line) }
.atl-row { position: absolute; left: 12px; right: 12px; height: ${ROW_PITCH - 6}px; border-radius: 10px }
.atl-row[data-lead] { background: var(--atl-fill) }
.atl-lab { position: absolute; left: 24px; width: 120px; display: flex; flex-direction: column; justify-content: center; height: ${ROW_PITCH - 6}px; min-width: 0 }
.atl-lab b { font-size: 12.5px; line-height: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.atl-lab em { font-style: normal; font-size: 11px; line-height: 14px; color: var(--atl-t3); white-space: nowrap }

/* Spans: the width is derived from --atl-now in CSS, so the clock never re-renders React */
.atl-span { position: absolute; height: ${SPAN_H}px; left: calc(${PLOT_X}px + var(--s) * var(--pps)); width: clamp(0px, calc((var(--atl-now) - var(--s)) * var(--pps)), calc(var(--d) * var(--pps)));
  opacity: clamp(0, calc((var(--atl-now) - var(--s)) * 40), 1); border-radius: 7px; overflow: hidden; display: flex; align-items: center; gap: 5px; padding: 0 6px; font-size: 11px; line-height: 16px; font-weight: 500; white-space: nowrap;
  transition: box-shadow .25s, filter .25s }
.atl-span > * { flex: none }
.atl-span svg { width: 11px; height: 11px; stroke-width: 2.2 }
.atl-span[data-k="thinking"] { color: #fff; background: linear-gradient(180deg, color-mix(in oklab, var(--atl-accent) 88%, #fff), var(--atl-accent)); box-shadow: inset 0 1px 0 rgb(255 255 255 / .25) }
.atl-span[data-k="tool"] { color: var(--atl-accent); background: color-mix(in oklab, var(--atl-accent) 10%, var(--atl-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--atl-accent) 50%, transparent) inset }
.atl-span[data-k="waiting"] { color: var(--atl-t3); background: repeating-linear-gradient(135deg, transparent 0 4px, var(--atl-line) 4px 5px); box-shadow: 0 0 0 1px var(--atl-rail) inset; border-radius: 7px }
.atl-span[data-st="failed"] { color: var(--atl-red); background: color-mix(in oklab, var(--atl-red) 10%, var(--atl-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--atl-red) 55%, transparent) inset }
.atl-span:hover, .atl-span[data-hover] { filter: brightness(1.06); box-shadow: 0 0 0 2px color-mix(in oklab, var(--atl-accent) 35%, transparent) }
.atl-span[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--atl-surface), 0 0 0 3.5px var(--atl-accent) }
.atl-span[data-run]::after { content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: linear-gradient(100deg, transparent 35%, rgb(255 255 255 / .3) 50%, transparent 65%) 0 0 / 260% 100%; animation: atl-shine calc(1.6s / var(--atl-speed)) ease-in-out infinite }
.atl-span[data-run]::before { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 2px; background: rgb(255 255 255 / .75); z-index: 1 }
.atl-span[data-k="tool"][data-run]::before, .atl-span[data-k="waiting"][data-run]::before { background: var(--atl-accent) }
.atl-span[data-dim] { opacity: .28 !important }

/* Handoffs */
.atl-links { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; overflow: visible; pointer-events: none }
.atl-links path { fill: none; stroke-linecap: round }
.atl-h { stroke: var(--atl-rail); stroke-width: 1.5; stroke-dasharray: 1 1; animation: atl-draw calc(.36s / var(--atl-speed)) var(--atl-ease) backwards; transition: stroke .3s, opacity .3s }
.atl-h[data-on] { stroke: var(--atl-accent); stroke-width: 2 }
.atl-h[data-dim] { opacity: .25 }
.atl-port { fill: var(--atl-surface); stroke: var(--atl-rail); stroke-width: 1.5; transform-box: fill-box; transform-origin: center; animation: atl-pop calc(.3s / var(--atl-speed)) var(--atl-ease) backwards; transition: stroke .3s }
.atl-port[data-on] { stroke: var(--atl-accent) }

/* Playhead */
.atl-ph { position: absolute; left: ${PLOT_X}px; top: 104px; height: ${ROW_TOP - 104 + 5 * ROW_PITCH - 4}px; width: 0; transform: translateX(calc(var(--atl-now) * var(--pps))); will-change: transform; opacity: 1; transition: opacity .5s }
.atl-ph::before { content: ""; position: absolute; left: -.5px; top: 0; bottom: 0; width: 1px; background: color-mix(in oklab, var(--atl-accent) 70%, transparent) }
.atl-ph::after { content: ""; position: absolute; left: -3px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--atl-accent) }
.atl[data-done] .atl-ph { opacity: 0 }

/* Legend and card */
.atl-legend { position: absolute; left: 24px; right: 24px; top: 338px; height: 16px; display: flex; gap: 14px; align-items: center; font-size: 11px; color: var(--atl-t3) }
.atl-legend span { display: inline-flex; align-items: center; gap: 5px }
.atl-legend i { display: inline-block; width: 14px; height: 8px; border-radius: 3px }
.atl-lg-think { background: var(--atl-accent) }
.atl-lg-tool { background: color-mix(in oklab, var(--atl-accent) 10%, var(--atl-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--atl-accent) 50%, transparent) inset }
.atl-lg-wait { background: repeating-linear-gradient(135deg, transparent 0 2px, var(--atl-rail) 2px 3px); box-shadow: 0 0 0 1px var(--atl-rail) inset }
.atl-lg-fail { background: color-mix(in oklab, var(--atl-red) 14%, var(--atl-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--atl-red) 55%, transparent) inset }
.atl-lg-hand { width: 8px !important; height: 8px !important; border-radius: 50% !important; box-shadow: 0 0 0 1.5px var(--atl-rail) inset }
.atl-card { position: absolute; left: 24px; right: 24px; top: 362px; height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 14px 0 10px; border-radius: 12px; background: var(--atl-fill) }
.atl-card-ic { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; color: var(--atl-accent); background: color-mix(in oklab, var(--atl-accent) 12%, transparent) }
.atl-card-ic svg { width: 14px; height: 14px; stroke-width: 2 }
.atl-card-ic[data-st="failed"] { color: var(--atl-red); background: color-mix(in oklab, var(--atl-red) 12%, transparent) }
.atl-card-ic[data-k="waiting"] { color: var(--atl-t3); background: var(--atl-fill) }
.atl-card-t { flex: 1; min-width: 0; animation: atl-text calc(.35s / var(--atl-speed)) var(--atl-ease) backwards }
.atl-card-t b { display: block; font-size: 12.5px; line-height: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.atl-card-t span { display: block; font-size: 11.5px; line-height: 16px; color: var(--atl-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.atl-card-m { flex: none; text-align: right; font-size: 11.5px; line-height: 16px; color: var(--atl-t3); font-variant-numeric: tabular-nums; animation: atl-text calc(.35s / var(--atl-speed)) var(--atl-ease) backwards }
.atl-card-m b { display: block; font-weight: 500; color: var(--atl-t2) }

@keyframes atl-draw { from { stroke-dashoffset: 1 } }
@keyframes atl-pop { from { opacity: 0; transform: scale(.4) } }
@keyframes atl-text { from { opacity: 0; transform: translateY(3px); filter: blur(2px) } }
@keyframes atl-shine { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes atl-pulse { from { opacity: .35; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }

.atl[data-paused] *, .atl[data-paused] *::before, .atl[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .atl *, .atl *::before, .atl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}

type Snap = { running: string; handoffs: number; done: boolean; latest: string; reset: boolean }

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function AgentTimeline({
  run = SAMPLE_RUN,
  title,
  onSpanSelect,
  onComplete,
  speed = 1,
  paused = false,
  accent,
  label = "Timeline of an orchestrated agent run: agents share a time axis with handoffs between them",
  className,
}: AgentTimelineProps) {
  const reduced = useReducedMotion()
  const spans = React.useMemo(() => run.spans.map((s, i) => ({ ...s, id: s.id ?? `${s.agent}-${i}` })), [run.spans])
  const agents = run.agents
  const duration = run.duration ?? Math.max(1, ...spans.map((s) => s.end))
  const pps = PLOT_W / duration
  const rowOf = React.useMemo(() => new Map(agents.map((a, i) => [a.id, i])), [agents])
  const priceOf = React.useMemo(() => new Map(agents.map((a) => [a.id, a.price ?? 0])), [agents])
  const handoffs = React.useMemo(() => run.handoffs.slice().sort((a, b) => a.at - b.at), [run.handoffs])

  const totals = React.useMemo(() => {
    const busy = spans.filter((s) => s.kind !== "waiting").reduce((a, s) => a + (s.end - s.start), 0)
    const tokens = spans.reduce((a, s) => a + (s.tokens ?? 0), 0)
    const cost = spans.reduce((a, s) => a + ((s.tokens ?? 0) * (priceOf.get(s.agent) ?? 0)) / 1e6, 0)
    return { tokens, cost, faster: busy / duration }
  }, [spans, priceOf, duration])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const timeRef = React.useRef<HTMLElement>(null)
  const tokRef = React.useRef<HTMLElement>(null)
  const costRef = React.useRef<HTMLElement>(null)
  const spanRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const [snap, setSnap] = React.useState<Snap>({ running: "", handoffs: 0, done: false, latest: "", reset: false })
  const [hover, setHover] = React.useState<string | null>(null)
  const [pinned, setPinned] = React.useState<string | null>(null)
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const live = React.useRef({ speed, paused, key: "", wasDone: false, onComplete })
  React.useEffect(() => {
    live.current.speed = speed
    live.current.paused = paused
    live.current.onComplete = onComplete
  })

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--atl-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One clock in story seconds. It writes --atl-now (spans and the playhead follow in CSS) and the three counters;
  // React hears only when a span starts or ends, a handoff is reached, or the run finishes.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    io.observe(root)
    live.current.key = ""
    live.current.wasDone = false
    const draw = (now: number) => {
      root.style.setProperty("--atl-now", now.toFixed(3))
      let tokens = 0
      let cost = 0
      let running = ""
      let latest = ""
      let latestStart = -1
      for (const s of spans) {
        if (now <= s.start) continue
        const frac = Math.min(1, (now - s.start) / Math.max(0.001, s.end - s.start))
        const tk = (s.tokens ?? 0) * frac
        tokens += tk
        cost += (tk * (priceOf.get(s.agent) ?? 0)) / 1e6
        if (now < s.end) running += `${s.id},`
        if (s.kind !== "waiting" && s.start > latestStart) {
          latestStart = s.start
          latest = s.id
        }
      }
      let reached = 0
      for (const h of handoffs) if (now >= h.at) reached++
      const done = now >= duration
      const reset = now >= duration + HOLD * STORY_RATE - 0.5
      const next: Snap = { running, handoffs: reached, done, latest, reset }
      const key = `${running}|${reached}|${done ? 1 : 0}|${latest}|${reset ? 1 : 0}`
      if (key !== live.current.key) {
        live.current.key = key
        setSnap(next)
        if (done && !live.current.wasDone) live.current.onComplete?.()
        live.current.wasDone = done
      }
      if (timeRef.current) timeRef.current.textContent = fmtTime(Math.min(now, duration))
      if (tokRef.current) tokRef.current.textContent = `${Math.round(tokens).toLocaleString("en-US")} tokens`
      if (costRef.current) costRef.current.textContent = `$${cost.toFixed(2)}`
    }
    if (reduced) {
      draw(duration + 0.01)
      return () => io.disconnect()
    }
    let raf = 0
    let last = 0
    let now = 0
    const total = duration + HOLD * STORY_RATE
    draw(0)
    const frame = (ts: number) => {
      const dt = last ? Math.min(ts - last, 64) : 0
      last = ts
      if (!live.current.paused && visible && dt > 0) {
        now += (dt / 1000) * STORY_RATE * Math.max(0.05, live.current.speed)
        if (now >= total) now -= total
        draw(now)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [spans, handoffs, priceOf, duration, reduced])

  const done = reduced || snap.done
  const runningSet = new Set(snap.running.split(",").filter(Boolean))
  const spanById = new Map(spans.map((s) => [s.id, s]))
  const shown = hover ?? pinned ?? (done ? null : snap.latest || null)
  const card = shown ? spanById.get(shown) : null
  const pinnedSpan = pinned ? spanById.get(pinned) : null
  const traceTo = pinnedSpan && pinnedSpan.agent !== agents[0]?.id ? pinnedSpan.agent : null

  const select = (id: string) => {
    const next = pinned === id ? null : id
    setPinned(next)
    onSpanSelect?.(next ? (spanById.get(next) ?? null) : null)
  }

  const order = React.useMemo(
    () => agents.map((a) => spans.filter((s) => s.agent === a.id).sort((x, y) => x.start - y.start)),
    [agents, spans],
  )
  const tabId = focusId && spanById.has(focusId) ? focusId : (spans.find((s) => s.kind !== "waiting")?.id ?? spans[0]?.id)
  const onKeyDown = (e: React.KeyboardEvent, id: string) => {
    const s = spanById.get(id)
    if (!s) return
    const r = rowOf.get(s.agent) ?? 0
    const row = order[r]
    const at = row.findIndex((x) => x.id === id)
    let target: AgentTimelineSpan | undefined
    if (e.key === "ArrowRight") target = row[Math.min(row.length - 1, at + 1)]
    else if (e.key === "ArrowLeft") target = row[Math.max(0, at - 1)]
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const nr = Math.min(order.length - 1, Math.max(0, r + (e.key === "ArrowDown" ? 1 : -1)))
      const cand = order[nr]
      target = cand.slice().sort((a, b) => Math.abs(a.start - s.start) - Math.abs(b.start - s.start))[0]
    } else if (e.key === "Home") target = row[0]
    else if (e.key === "End") target = row[row.length - 1]
    else return
    e.preventDefault()
    if (target?.id) {
      setFocusId(target.id)
      spanRefs.current[target.id]?.focus()
    }
  }

  const x = (sec: number) => PLOT_X + sec * pps
  const step = duration > 40 ? 10 : 5
  const ticks: number[] = []
  for (let s = 0; s <= duration; s += step) ticks.push(s)
  const rowY = (i: number) => ROW_TOP + i * ROW_PITCH
  const spanTop = (i: number) => rowY(i) + (ROW_PITCH - 6 - SPAN_H) / 2

  const vars = {
    ...(accent ? { "--atl-accent": accent } : null),
    "--atl-speed": Math.max(0.05, speed),
    "--pps": `${pps}px`,
  } as React.CSSProperties
  const status = done ? "done" : snap.running ? "run" : "idle"

  return (
    <div
      ref={rootRef}
      className={className ? `atl ${className}` : "atl"}
      role="group"
      aria-label={label}
      data-paused={paused || undefined}
      data-done={done || undefined}
      data-reset={snap.reset && !reduced ? "" : undefined}
      style={vars}
    >
      <style href="pane-agent-timeline" precedence="default">
        {CSS}
      </style>
      <div className="atl-stage">
        <div className="atl-head">
          <span className="atl-mark" aria-hidden>
            <GanttChart />
          </span>
          <span className="atl-title">{title ?? run.title}</span>
          <span className="atl-status" data-s={status} aria-live="polite">
            <i />
            {done ? "Finished" : snap.running ? "Running" : "Ready"}
          </span>
        </div>
        <div className="atl-stats">
          {done ? (
            <span key="done" aria-live="polite">
              <b>Finished</b>
              <span className="atl-sep">·</span>
              <span>{agents.length} agents</span>
              <span className="atl-sep">·</span>
              <span>{fmtTime(duration)}</span>
              <span className="atl-sep">·</span>
              <span>{totals.faster.toFixed(1)}× faster than sequential</span>
              <span className="atl-sep">·</span>
              <b>${totals.cost.toFixed(2)}</b>
            </span>
          ) : (
            <span key="run">
              <b className="atl-n" ref={timeRef}>
                0.0s
              </b>
              <span className="atl-sep">·</span>
              <b ref={tokRef}>0 tokens</b>
              <span className="atl-sep">·</span>
              <b ref={costRef}>$0.00</b>
            </span>
          )}
        </div>
        <div className="atl-rule" />

        <div className="atl-body">
          {ticks.map((s) => (
            <React.Fragment key={s}>
              <div className="atl-tick" style={{ left: x(s) }} aria-hidden>
                <span>{s}s</span>
              </div>
              <div className="atl-grid" style={{ left: x(s), height: agents.length * ROW_PITCH - 2 + 4 }} aria-hidden />
            </React.Fragment>
          ))}

          {agents.map((a, i) => (
            <React.Fragment key={a.id}>
              <div className="atl-row" style={{ top: rowY(i) }} data-lead={i === 0 || undefined} aria-hidden />
              <div className="atl-lab" style={{ top: rowY(i) }} role="group" aria-label={`${a.name}${a.model ? `, ${a.model}` : ""}`}>
                <b>{a.name}</b>
                {a.model && <em>{a.model}</em>}
              </div>
            </React.Fragment>
          ))}

          <svg className="atl-links" viewBox={`0 0 ${W} ${H}`} aria-hidden>
            {handoffs.slice(0, snap.handoffs || (reduced ? handoffs.length : 0)).map((h, i) => {
              const r0 = rowOf.get(h.from) ?? 0
              const r1 = rowOf.get(h.to) ?? 0
              const hx = x(h.at)
              const y0 = spanTop(r0) + SPAN_H / 2
              const y1 = spanTop(r1) + SPAN_H / 2
              const firstSpan = spans.filter((s) => s.agent === h.to && s.start >= h.at).sort((a, b) => a.start - b.start)[0]
              const ex = firstSpan ? x(firstSpan.start) : hx + 16
              const dir = y1 > y0 ? 1 : -1
              const d = `M${hx} ${y0} V${y1 - dir * 8} Q${hx} ${y1} ${hx + 8} ${y1} H${ex}`
              const on = traceTo === h.to
              const dim = traceTo != null && !on
              return (
                <React.Fragment key={i}>
                  <path className="atl-h" d={d} pathLength={1} data-on={on || undefined} data-dim={dim || undefined} />
                  <circle className="atl-port" cx={hx} cy={y0} r={3} data-on={on || undefined} />
                  <circle className="atl-port" cx={ex} cy={y1} r={3} data-on={on || undefined} style={{ animationDelay: "0.2s" }} />
                </React.Fragment>
              )
            })}
          </svg>

          {spans.map((s) => {
            const r = rowOf.get(s.agent) ?? 0
            const wide = (s.end - s.start) * pps
            const Icon = s.kind === "tool" ? Wrench : s.kind === "waiting" ? Hourglass : Brain
            const failed = s.status === "failed"
            const dim = traceTo != null && s.agent !== traceTo && s.agent !== agents[0]?.id
            return (
              <button
                key={s.id}
                ref={(el) => {
                  spanRefs.current[s.id!] = el
                }}
                type="button"
                className="atl-span"
                style={{ top: spanTop(r), "--s": s.start, "--d": s.end - s.start } as React.CSSProperties}
                data-k={s.kind}
                data-st={failed ? "failed" : undefined}
                data-run={runningSet.has(s.id!) || undefined}
                data-dim={dim || undefined}
                data-hover={hover === s.id || undefined}
                aria-pressed={pinned === s.id}
                tabIndex={tabId === s.id ? 0 : -1}
                aria-label={`${agents[r]?.name}, ${KIND_NAME[s.kind]}${failed ? " failed" : ""}: ${s.label}, ${fmtTime(s.start)} to ${fmtTime(s.end)}${s.tokens ? `, ${s.tokens.toLocaleString("en-US")} tokens` : ""}`}
                onClick={() => select(s.id!)}
                onMouseEnter={() => setHover(s.id!)}
                onMouseLeave={() => setHover((c) => (c === s.id ? null : c))}
                onFocus={() => {
                  setFocusId(s.id!)
                  setHover(s.id!)
                }}
                onBlur={() => setHover((c) => (c === s.id ? null : c))}
                onKeyDown={(e) => onKeyDown(e, s.id!)}
              >
                {failed ? <TriangleAlert aria-hidden /> : wide > 30 && <Icon aria-hidden />}
                {wide > 72 && <span>{s.label}</span>}
              </button>
            )
          })}

          <div className="atl-ph" aria-hidden />
        </div>

        <div className="atl-legend" aria-hidden>
          <span>
            <i className="atl-lg-think" />
            Thinking
          </span>
          <span>
            <i className="atl-lg-tool" />
            Tool call
          </span>
          <span>
            <i className="atl-lg-wait" />
            Waiting
          </span>
          <span>
            <i className="atl-lg-hand" />
            Handoff
          </span>
          <span>
            <i className="atl-lg-fail" />
            Failed
          </span>
        </div>

        <div className="atl-card">
          {card ? (
            <>
              <span className="atl-card-ic" data-k={card.kind} data-st={card.status === "failed" ? "failed" : undefined} aria-hidden>
                {card.status === "failed" ? <TriangleAlert /> : card.kind === "tool" ? <Wrench /> : card.kind === "waiting" ? <Hourglass /> : <Brain />}
              </span>
              <span className="atl-card-t" key={card.id}>
                <b>
                  {agents[rowOf.get(card.agent) ?? 0]?.name} · {card.label}
                </b>
                <span>{card.detail ?? `${KIND_NAME[card.kind]}${card.status === "failed" ? " failed" : ""}`}</span>
              </span>
              <span className="atl-card-m" key={`m${card.id}`}>
                <b>
                  {fmtTime(card.start)} to {fmtTime(card.end)}
                </b>
                {card.tokens ? `${card.tokens.toLocaleString("en-US")} tokens` : KIND_NAME[card.kind]}
              </span>
            </>
          ) : (
            <span className="atl-card-t">
              <b>{done ? "Run finished" : "Starting the run"}</b>
              <span>Hover a span for details, click to pin it and trace its handoff.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
