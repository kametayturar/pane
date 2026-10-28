"use client"

import * as React from "react"
import { Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RunTrack = "think" | "tool" | "write"

export type RunStepDetail = {
  /** Name of the tool that was called, e.g. `run_sql`. */
  tool?: string
  /** What the agent sent to the tool. Types in over the first quarter of the step. */
  input?: string
  /** What came back. Types in over the last 40% of the step. */
  output?: string
  /** What the agent wrote to its scratchpad during this step. Types in as the step plays. */
  scratch?: string
}

export type RunStep = {
  id: string
  track: RunTrack
  /** Seconds from the start of the run. */
  start: number
  /** Seconds from the start of the run. */
  end: number
  title: string
  detail?: RunStepDetail
  /** Tokens spent in this step. Spread evenly across the step to draw the density strip and the running total. */
  tokens?: number
}

export type RunScrubberProps = {
  /** The run. Leave it out to scrub a built-in 40 s demo run (`SAGE_RUN`). */
  steps?: RunStep[]
  /** Length of the run in seconds. Defaults to the end of the last step. */
  duration?: number
  /** Playhead position in seconds (controlled). */
  time?: number
  defaultTime?: number
  onTimeChange?: (time: number, step: RunStep | null) => void
  /** Start playing on mount. Ignored when the user asks for reduced motion. */
  autoPlay?: boolean
  /** Playback speed (controlled). */
  rate?: 1 | 2 | 4
  defaultRate?: 1 | 2 | 4
  onRateChange?: (rate: 1 | 2 | 4) => void
  onPlayingChange?: (playing: boolean) => void
  /** Serif heading. Defaults to the demo title when `steps` is omitted. */
  title?: React.ReactNode
  /** Mono label above the title, e.g. `RUN 0412 · SAGE`. */
  runLabel?: string
  /** USD per 1,000 tokens, for the COST readout. Default 0.004. */
  costPer1kTokens?: number
  /** Arrow-key step in seconds. Shift moves ten times as far. Default 1. */
  keyStep?: number
  /** Dragging and clicking snap to step boundaries that are a few pixels away. Hold Alt to bypass. Default true. */
  snap?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Sample run                                */
/* -------------------------------------------------------------------------- */

export const SAGE_DURATION = 40

/** A 40 s run: Sage, an agent at Harbor & Finch, researches and writes the weekly support report. */
export const SAGE_RUN: RunStep[] = [
  {
    id: "plan",
    track: "think",
    start: 0,
    end: 3.2,
    title: "Plan the report",
    tokens: 420,
    detail: {
      scratch:
        "Goal: the weekly support report for Harbor & Finch. Needs ticket volume, reply times, refund rate and the top three themes. Plan: pull the numbers, read the feedback, draft, then check every figure.",
    },
  },
  {
    id: "metrics",
    track: "tool",
    start: 3.2,
    end: 7,
    title: "Query ticket metrics",
    tokens: 310,
    detail: {
      tool: "run_sql",
      input: "SELECT COUNT(*) AS tickets, p50(first_reply_s), refunds / COUNT(*)\nFROM tickets WHERE week = '2026-W42'",
      output: '{ "tickets": 1842, "p50_first_reply": "6m 12s",\n  "refund_rate": 0.031 }',
      scratch: "1,842 tickets, up 8% on last week. Median first reply is 6m 12s, inside the 8 minute target. Refunds at 3.1%.",
    },
  },
  {
    id: "compare",
    track: "think",
    start: 7,
    end: 9.6,
    title: "Compare with last week",
    tokens: 380,
    detail: {
      scratch:
        "Volume is up but replies got faster, so the new triage rules are working. Refund rate is flat. The story is in the feedback, not the numbers.",
    },
  },
  {
    id: "feedback",
    track: "tool",
    start: 9.6,
    end: 16.4,
    title: "Search customer feedback",
    tokens: 2950,
    detail: {
      tool: "search_feedback",
      input: '{ "query": "slow, late, wrong size, refund",\n  "since": "2026-10-12", "limit": 24 }',
      output: "24 snippets. 9 mention delivery dates,\n6 mention sizing, 4 praise the new chat reply.",
      scratch: "Delivery dates come up nine times, mostly the Northern depot. Sizing is the second theme. Four customers praised the chat replies by name.",
    },
  },
  {
    id: "cluster",
    track: "think",
    start: 16.4,
    end: 19.8,
    title: "Cluster the themes",
    tokens: 720,
    detail: {
      scratch:
        "Three themes: 1. Delivery dates slip at the Northern depot. 2. Sizing guidance is unclear on two product pages. 3. Chat replies are landing well. Each needs one number and one quote.",
    },
  },
  {
    id: "policy",
    track: "tool",
    start: 19.8,
    end: 24,
    title: "Read the refund policy",
    tokens: 640,
    detail: {
      tool: "read_doc",
      input: '{ "doc": "policies/refunds.md", "section": "delays" }',
      output: "Refunds for late delivery apply after 5 days.\nShipping is refunded at 10 days.",
      scratch: "Policy says late delivery earns a refund after five days. Worth flagging that eleven orders are already past that line.",
    },
  },
  {
    id: "draft",
    track: "write",
    start: 24,
    end: 33,
    title: "Draft the report",
    tokens: 1900,
    detail: {
      scratch:
        "Writing: Support handled 1,842 tickets this week, 8% more than last, while the median first reply fell to 6m 12s. Three themes stood out. Delivery dates slipped at the Northern depot, and eleven orders are past the five day refund line. Sizing guidance needs work on two pages. Customers are praising the chat replies.",
    },
  },
  {
    id: "verify",
    track: "tool",
    start: 28.4,
    end: 31.6,
    title: "Verify the figures",
    tokens: 520,
    detail: {
      tool: "run_sql",
      input: "SELECT COUNT(*) FROM orders\nWHERE delivered_at IS NULL AND shipped_at < now() - interval '5 days'",
      output: '{ "count": 11 }  -- matches the draft',
      scratch: "Eleven overdue orders, matches the draft.",
    },
  },
  {
    id: "finalize",
    track: "write",
    start: 33.4,
    end: 39.2,
    title: "Add summary and send",
    tokens: 900,
    detail: {
      scratch:
        "Added a three line summary at the top and a short list of next steps for ops. Sent to the support leads at 09:00 with the metrics sheet attached.",
    },
  },
]

const SAGE_TITLE = (
  <>
    Weekly report, <em>assembled</em>
  </>
)

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.irs {
  --irs-paper: #fafafa;
  --irs-sheet: #ffffff;
  --irs-ink: #0a0a0a;
  --irs-signal: #0060e2;
  --irs-accent: var(--irs-signal);
  --irs-surface: var(--irs-sheet);
  --irs-signal-soft: color-mix(in oklab, var(--irs-accent) 12%, transparent);
  --irs-t1: color-mix(in oklab, var(--irs-ink) 92%, transparent);
  --irs-t2: color-mix(in oklab, var(--irs-ink) 64%, transparent);
  --irs-t3: color-mix(in oklab, var(--irs-ink) 44%, transparent);
  --irs-t4: color-mix(in oklab, var(--irs-ink) 22%, transparent);
  --irs-rule: color-mix(in oklab, var(--irs-ink) 14%, transparent);
  --irs-rule-2: color-mix(in oklab, var(--irs-ink) 7%, transparent);
  --irs-ok: #1f8a4c; --irs-warn: #b7791f; --irs-bad: #c4321a;
  --irs-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --irs-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --irs-font: var(--irs-sans);
  --irs-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --irs-ease: cubic-bezier(.2, .8, .2, 1);
  --irs-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; width: 100%; max-width: 880px; padding: 12px; container: irs / inline-size;
  font: 13px/20px var(--irs-font); color: var(--irs-t1); text-align: left; -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .irs {
  --irs-paper: #0c0c0d; --irs-sheet: #1c1c1e; --irs-ink: #f5f5f5; --irs-signal: #4d8dff;
  --irs-ok: #4cc27d; --irs-warn: #e0a64a; --irs-bad: #ff7a5c;
}
.irs *, .irs *::before, .irs *::after { box-sizing: border-box }
:where(.irs) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.irs :focus-visible { outline: 2px solid color-mix(in oklab, var(--irs-accent) 60%, transparent); outline-offset: 1px }
.irs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.irs-card { position: relative; background: var(--irs-surface); border-radius: 4px; box-shadow: 0 0 0 1px var(--irs-rule) }
.irs-crop { position: absolute; width: 8px; height: 8px; border: 0 solid var(--irs-t4); pointer-events: none }
.irs-crop[data-c="tl"] { top: -7px; left: -7px; border-top-width: 1px; border-left-width: 1px }
.irs-crop[data-c="tr"] { top: -7px; right: -7px; border-top-width: 1px; border-right-width: 1px }
.irs-crop[data-c="bl"] { bottom: -7px; left: -7px; border-bottom-width: 1px; border-left-width: 1px }
.irs-crop[data-c="br"] { bottom: -7px; right: -7px; border-bottom-width: 1px; border-right-width: 1px }

.irs-lab { font: 500 10.5px/16px var(--irs-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--irs-t3); white-space: nowrap }

/* Head */
.irs-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 16px 20px 14px; border-bottom: 1px solid var(--irs-rule) }
.irs-title { margin: 2px 0 0; font: 400 30px/34px var(--irs-serif); letter-spacing: -.01em; color: var(--irs-ink) }
.irs-title em { font-style: italic }
.irs-status { display: inline-flex; align-items: center; gap: 8px; flex: none; padding-bottom: 4px }
.irs-dot { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--irs-t4) }
.irs-dot[data-on] { background: var(--irs-accent) }
.irs-dot[data-on]::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--irs-accent); animation: irs-pulse 1.6s var(--irs-ease) infinite }

/* State at the playhead */
.irs-state { display: grid; grid-template-columns: minmax(0, 1fr); border-bottom: 1px solid var(--irs-rule) }
.irs-col { min-width: 0; padding: 14px 20px 16px }
.irs-col + .irs-col { border-top: 1px solid var(--irs-rule) }
.irs-col-h { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.irs-chip { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 2px; box-shadow: 0 0 0 1px var(--irs-rule); font: 500 10px/16px var(--irs-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--irs-t2) }
.irs-chip[data-idle] { color: var(--irs-t3); box-shadow: 0 0 0 1px var(--irs-rule-2) }
.irs-step { margin: 6px 0 0; height: 30px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 25px/30px var(--irs-serif); letter-spacing: -.01em; color: var(--irs-ink) }
.irs-step[data-idle] { color: var(--irs-t3) }
.irs-swap { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: top; animation: irs-swap .26s var(--irs-ease) backwards }
.irs-meta { margin: 2px 0 0; font: 400 11px/16px var(--irs-mono); color: var(--irs-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.irs-io { display: grid; gap: 8px; margin-top: 12px }
.irs-io-k { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px }
.irs-pre {
  margin: 0; height: 62px; overflow: hidden; padding: 7px 9px; border-radius: 2px; background: var(--irs-paper); box-shadow: inset 0 0 0 1px var(--irs-rule-2);
  font: 400 11px/16px var(--irs-mono); color: var(--irs-t1); white-space: pre-wrap; overflow-wrap: anywhere;
}
.irs-pre[data-empty] { color: var(--irs-t3) }
.irs-pad-body {
  position: relative; height: 188px; margin-top: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 34px); mask-image: linear-gradient(to bottom, transparent, #000 34px);
}
.irs-pad-body p { margin: 0 0 9px; font: italic 400 17px/22px var(--irs-serif); color: var(--irs-t2) }
.irs-pad-body p:last-child { margin-bottom: 0; color: var(--irs-t1) }
.irs-pad-body p[data-empty] { font: 400 11px/16px var(--irs-mono); font-style: normal; color: var(--irs-t3) }
.irs-caret { display: inline-block; width: .5em; height: 1em; margin-left: 2px; vertical-align: -.14em; background: var(--irs-ink); animation: irs-blink 1s steps(2, start) infinite }
.irs-pre .irs-caret { width: .55em; height: 1.05em; vertical-align: -.2em }

/* Readout row */
.irs-readout { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; border-bottom: 1px solid var(--irs-rule) }
.irs-ro { min-width: 0; padding: 9px 20px 10px }
.irs-ro + .irs-ro { border-left: 1px solid var(--irs-rule) }
.irs-ro dt { font: 500 10px/14px var(--irs-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--irs-t3) }
.irs-ro dd { margin: 0; font: 500 16px/22px var(--irs-mono); color: var(--irs-ink); font-variant-numeric: tabular-nums; white-space: nowrap }
.irs-ro dd small { font-size: 11px; color: var(--irs-t3); font-weight: 400 }

/* Transport */
.irs-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px 6px }
.irs-play { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 2px; box-shadow: 0 0 0 1px var(--irs-ink); transition: background-color .16s, color .16s, box-shadow .16s }
.irs-play:hover { box-shadow: 0 0 0 1px var(--irs-accent); color: var(--irs-accent) }
.irs-play[data-on] { background: var(--irs-ink); color: var(--irs-surface) }
.irs-play[data-on]:hover { color: var(--irs-surface); box-shadow: 0 0 0 1px var(--irs-ink) }
.irs-play svg { width: 14px; height: 14px; stroke-width: 1.5 }
.irs-rates { display: inline-flex; border-radius: 2px; box-shadow: 0 0 0 1px var(--irs-rule); overflow: hidden }
.irs-rates button { height: 28px; padding: 0 10px; font: 500 11px/28px var(--irs-mono); letter-spacing: .04em; color: var(--irs-t2); transition: background-color .16s, color .16s }
.irs-rates button + button { box-shadow: -1px 0 0 var(--irs-rule) }
.irs-rates button:hover { color: var(--irs-ink) }
.irs-rates button[aria-pressed="true"] { background: var(--irs-ink); color: var(--irs-surface) }
.irs-keys { margin-left: auto; display: flex; gap: 14px }

/* Plot: minimap, ruler, tracks */
.irs-plotwrap { padding: 2px 20px 6px 64px }
.irs-plot { position: relative; cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none; border-radius: 2px }
.irs-plot[data-drag] { cursor: grabbing }
.irs-gl { position: absolute; right: calc(100% + 10px); width: 44px; text-align: right; font: 500 9.5px/16px var(--irs-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--irs-t3); pointer-events: none }
.irs-mini { position: relative; height: 22px }
.irs-dens, .irs-dens-on { position: absolute; inset: 0; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; animation: irs-draw .7s linear backwards }
.irs-dens { background: var(--irs-t4) }
.irs-dens-on { background: var(--irs-t2); clip-path: inset(0 calc(100% - var(--irs-pct) * 1%) 0 0); animation: none }
.irs-ruler { position: relative; height: 28px; margin-top: 4px; border-bottom: 1px solid var(--irs-t3) }
.irs-tick { position: absolute; bottom: 0; width: 1px; height: 5px; background: var(--irs-t4) }
.irs-tick[data-major] { height: 10px; background: var(--irs-t3) }
.irs-tick span { position: absolute; bottom: 13px; left: 0; transform: translateX(-50%); font: 400 10px/14px var(--irs-mono); color: var(--irs-t3); white-space: nowrap; font-variant-numeric: tabular-nums }
.irs-tick[data-first] span { transform: none }
.irs-tick[data-last] span { transform: translateX(-100%) }
.irs-tracks { position: relative; padding-bottom: 4px }
.irs-gridline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--irs-rule-2); pointer-events: none }
.irs-track { position: relative; height: 28px; margin-top: 4px }
.irs-track::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--irs-rule-2) }
.irs-seg {
  position: absolute; top: 2px; height: 24px; min-width: 3px; overflow: hidden; padding: 0 6px; border-radius: 2px; pointer-events: none;
  left: calc(var(--s) * 1%); width: calc(var(--w) * 1%);
  font: 400 10px/22px var(--irs-mono); letter-spacing: .02em; color: var(--irs-t3); white-space: nowrap; text-overflow: ellipsis;
  background-color: var(--irs-surface); box-shadow: inset 0 0 0 1px var(--irs-t4);
  transition: box-shadow .16s, color .16s, background-color .16s;
  animation: irs-draw .5s linear backwards; animation-delay: calc(var(--s) * 7ms);
}
.irs-seg[data-track="think"] { background-image: radial-gradient(circle at 1.5px 1.5px, var(--irs-t4) .7px, transparent 1px); background-size: 4px 4px }
.irs-seg[data-track="tool"] { background-color: color-mix(in oklab, var(--irs-ink) 7%, var(--irs-surface)) }
.irs-seg[data-track="write"] { box-shadow: inset 0 0 0 1px var(--irs-t4), inset 3px 0 0 var(--irs-t4) }
.irs-seg[data-state="past"] { box-shadow: inset 0 0 0 1px var(--irs-t2); color: var(--irs-t2) }
.irs-seg[data-track="write"][data-state="past"] { box-shadow: inset 0 0 0 1px var(--irs-t2), inset 3px 0 0 var(--irs-t2) }
.irs-seg[data-state="active"] { box-shadow: inset 0 0 0 1px var(--irs-accent); color: var(--irs-ink); background-color: color-mix(in oklab, var(--irs-accent) 10%, var(--irs-surface)) }
.irs-seg[data-track="write"][data-state="active"] { box-shadow: inset 0 0 0 1px var(--irs-accent), inset 3px 0 0 var(--irs-accent) }
.irs-seg[data-track="think"][data-state="active"] { background-image: radial-gradient(circle at 1.5px 1.5px, color-mix(in oklab, var(--irs-accent) 55%, transparent) .7px, transparent 1px) }
.irs-seg i { position: absolute; left: 0; bottom: 0; height: 2px; width: calc(var(--p) * 100%); background: var(--irs-accent); font-style: normal }

.irs-ghost { position: absolute; top: 0; bottom: 0; left: calc(var(--irs-hover, 0) * 1%); width: 1px; background: var(--irs-t4); opacity: 0; pointer-events: none; transition: opacity .12s }
.irs-plot:hover .irs-ghost { opacity: 1 }
.irs-plot[data-drag] .irs-ghost { opacity: 0 }
.irs-playhead { position: absolute; top: 0; bottom: 0; left: calc(var(--irs-pct) * 1%); width: 0; pointer-events: none }
.irs-playhead::before { content: ""; position: absolute; top: 0; bottom: 0; left: -.5px; width: 1px; background: var(--irs-accent) }
.irs-grip { position: absolute; top: 41px; left: -6px; width: 12px; height: 14px; background: var(--irs-accent); clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%) }
.irs-playhead[data-snapped] .irs-grip { background: var(--irs-ink) }
.irs-scan { position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--irs-accent); opacity: 0; pointer-events: none; animation: irs-scan .7s linear backwards }

.irs-fig { display: flex; justify-content: space-between; gap: 16px; padding: 8px 20px 14px; border-top: 1px solid var(--irs-rule-2) }
.irs-fig .irs-lab { white-space: normal }

@container irs (min-width: 660px) {
  .irs-state { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr) }
  .irs-col + .irs-col { border-top: 0; border-left: 1px solid var(--irs-rule) }
}
@container irs (max-width: 560px) {
  .irs-head { padding: 14px 16px 12px }
  .irs-title { font-size: 26px; line-height: 30px }
  .irs-col { padding: 12px 16px 14px }
  .irs-readout { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .irs-ro { padding: 8px 16px 9px }
  .irs-ro:nth-child(odd) { border-left: 0 }
  .irs-ro:nth-child(n + 3) { border-top: 1px solid var(--irs-rule) }
  .irs-bar { padding: 12px 16px 6px }
  .irs-keys { display: none }
  .irs-plotwrap { padding: 2px 16px 6px 56px }
  .irs-gl { width: 38px; right: calc(100% + 8px); font-size: 9px }
  .irs-fig { padding: 8px 16px 12px }
  .irs-step { font-size: 22px }
  .irs-pad-body { height: 168px }
  .irs-pre { height: 82px }
}
@container irs (max-width: 400px) {
  .irs-status .irs-lab { display: none }
  .irs-seg { padding: 0 3px; font-size: 9.5px }
}

@keyframes irs-pulse { from { transform: scale(1); opacity: .7 } to { transform: scale(3.4); opacity: 0 } }
@keyframes irs-blink { 50% { opacity: 0 } }
@keyframes irs-swap { from { opacity: 0; transform: translateY(3px) } }
@keyframes irs-draw { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes irs-scan { from { left: 0; opacity: 1 } 88% { opacity: 1 } to { left: 100%; opacity: 0 } }

@media (prefers-reduced-motion: reduce) {
  .irs *, .irs *::before, .irs *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const TRACKS: { id: RunTrack; label: string }[] = [
  { id: "think", label: "Think" },
  { id: "tool", label: "Tool" },
  { id: "write", label: "Write" },
]
const RATES = [1, 2, 4] as const
const MINOR_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]
const MAJOR_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 1200, 3600]
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const pad2 = (n: number) => String(n).padStart(2, "0")

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

/** `T+00:14.2` – minutes, seconds and tenths, truncated so the clock never runs ahead of the playhead. */
function formatClock(t: number) {
  const tenths = Math.floor(Math.max(0, t) * 10 + 1e-6)
  const m = Math.floor(tenths / 600)
  const s = Math.floor((tenths % 600) / 10)
  return `${pad2(m)}:${pad2(s)}.${tenths % 10}`
}

function formatTokens(n: number) {
  return n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`
}

function formatCost(usd: number) {
  return usd < 0.1 ? usd.toFixed(3) : usd.toFixed(2)
}

const reveal = (text: string, f: number) => text.slice(0, Math.floor(text.length * clamp(f, 0, 1) + 1e-9))

function pickTicks(duration: number, width: number) {
  const perSec = width / Math.max(duration, 0.001)
  const minor = MINOR_STEPS.find((s) => s * perSec >= 9) ?? MINOR_STEPS[MINOR_STEPS.length - 1]
  const major = MAJOR_STEPS.find((s) => s * perSec >= 58 && Math.abs(s / minor - Math.round(s / minor)) < 1e-6) ?? MAJOR_STEPS[MAJOR_STEPS.length - 1]
  const ticks: { t: number; major: boolean }[] = []
  const n = Math.floor(duration / minor + 1e-6)
  for (let i = 0; i <= n; i++) {
    const t = i * minor
    const q = t / major
    ticks.push({ t, major: Math.abs(q - Math.round(q)) < 1e-6 })
  }
  return ticks
}

function formatTick(t: number) {
  return `${Number.isInteger(t) ? t : t.toFixed(1)}s`
}

/** Tokens per second along the run, in `cols` bins, scaled so the busiest bin is 1. */
function densityBins(steps: RunStep[], duration: number, cols: number) {
  const out = new Array<number>(cols).fill(0)
  const bin = duration / cols
  for (const s of steps) {
    const len = s.end - s.start
    if (!s.tokens || len <= 0) continue
    const rate = s.tokens / len
    const a = Math.max(0, Math.floor(s.start / bin))
    const b = Math.min(cols - 1, Math.floor((s.end - 1e-9) / bin))
    for (let i = a; i <= b; i++) {
      const overlap = Math.min(s.end, (i + 1) * bin) - Math.max(s.start, i * bin)
      if (overlap > 0) out[i] += (rate * overlap) / bin
    }
  }
  const peak = Math.max(...out, 1e-9)
  return out.map((v) => Math.pow(v / peak, 0.75))
}

/** Draws the throughput as an ordered-dither area, returned as an alpha mask (ink dots on nothing). */
function drawDensityMask(bins: number[], cols: number) {
  const rows = 7
  const pitch = 6 // 3 css px at 2x
  const dot = 4
  const canvas = document.createElement("canvas")
  canvas.width = cols * pitch
  canvas.height = rows * pitch
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.fillStyle = "#000"
  for (let x = 0; x < cols; x++) {
    const v = bins[x] ?? 0
    const h = v * rows
    for (let yb = 0; yb < rows; yb++) {
      if (v <= 0 || yb > h) continue
      const i = 1 - 0.78 * (yb / Math.max(1, h))
      const threshold = (BAYER[(yb % 4) * 4 + (x % 4)] + 0.5) / 16
      if (i > threshold) ctx.fillRect(x * pitch, (rows - 1 - yb) * pitch + 1, dot, dot)
    }
  }
  return canvas.toDataURL("image/png")
}

type Call = { step: RunStep; stale: boolean; input: string; output: string; running: boolean }

/** Everything the "state at playhead" panel shows, as a pure function of the time. */
function stateAt(steps: RunStep[], t: number, duration: number) {
  let activeIdx = -1
  let started = 0
  steps.forEach((s, i) => {
    if (s.start <= t) {
      started = i + 1
      if (t < s.end && t < duration) activeIdx = i
    }
  })
  const active = activeIdx >= 0 ? steps[activeIdx] : null
  const shownIdx = activeIdx >= 0 ? activeIdx : started - 1
  const shown = shownIdx >= 0 ? steps[shownIdx] : null

  let tokens = 0
  for (const s of steps) {
    if (!s.tokens) continue
    tokens += s.tokens * clamp((t - s.start) / Math.max(1e-6, s.end - s.start), 0, 1)
  }

  const scratch: string[] = []
  let typing = false
  for (const s of steps) {
    const text = s.detail?.scratch
    if (!text || s.start > t) continue
    const f = (t - s.start) / Math.max(1e-6, (s.end - s.start) * 0.85)
    if (f < 1 && t < duration) typing = true
    const shownText = reveal(text, f)
    if (shownText) scratch.push(shownText)
  }

  let call: Call | null = null
  for (let i = started - 1; i >= 0; i--) {
    const d = steps[i].detail
    if (!d || (!d.input && !d.output && !d.tool)) continue
    const s = steps[i]
    const live = i === activeIdx
    const p = live ? clamp((t - s.start) / Math.max(1e-6, s.end - s.start), 0, 1) : 1
    call = {
      step: s,
      stale: !live,
      input: reveal(d.input ?? "", p / 0.25),
      output: reveal(d.output ?? "", (p - 0.6) / 0.4),
      running: live && p < 1,
    }
    break
  }

  return { active, shown, shownIdx, started, tokens, scratch, typing, call }
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

/**
 * A tape-style scrubber for an agent run. Drag the signal playhead (or use the keyboard) and the panel above shows the state
 * of the run at that moment: the step, the tool call, the scratchpad so far and the running token and cost totals.
 *
 * Keyboard (on the timeline): Left/Right step, Shift for ten times as far, Home/End, PageUp/PageDown jump between steps,
 * Space plays or pauses.
 */
export function RunScrubber({
  steps: stepsProp,
  duration: durationProp,
  time: timeProp,
  defaultTime = 0,
  onTimeChange,
  autoPlay = false,
  rate: rateProp,
  defaultRate = 1,
  onRateChange,
  onPlayingChange,
  title,
  runLabel,
  costPer1kTokens = 0.004,
  keyStep = 1,
  snap = true,
  className,
}: RunScrubberProps) {
  const isDemo = stepsProp === undefined
  const sorted = React.useMemo(() => [...(stepsProp ?? SAGE_RUN)].sort((a, b) => a.start - b.start), [stepsProp])
  const duration = React.useMemo(() => {
    if (durationProp !== undefined) return Math.max(0.1, durationProp)
    if (isDemo) return SAGE_DURATION
    return Math.max(0.1, ...sorted.map((s) => s.end))
  }, [durationProp, isDemo, sorted])

  /* time: controlled or not */
  const [innerTime, setInnerTime] = React.useState(defaultTime)
  const t = clamp(timeProp ?? innerTime, 0, duration)
  const timeRef = React.useRef(t)
  const stateRef = React.useRef({ sorted, duration, timeProp, onTimeChange })
  React.useEffect(() => {
    timeRef.current = t
    stateRef.current = { sorted, duration, timeProp, onTimeChange }
  })

  const setTime = React.useCallback((next: number) => {
    const { sorted: list, duration: dur, timeProp: controlled, onTimeChange: cb } = stateRef.current
    const v = clamp(next, 0, dur)
    timeRef.current = v
    if (controlled === undefined) setInnerTime(v)
    if (cb) {
      const hit = [...list].reverse().find((s) => s.start <= v && v < s.end) ?? null
      cb(v, hit)
    }
  }, [])

  /* rate and playing */
  const [innerRate, setInnerRate] = React.useState<1 | 2 | 4>(defaultRate)
  const rate = rateProp ?? innerRate
  const [playing, setPlayingState] = React.useState(() => autoPlay && !prefersReducedMotion())
  const playingRef = React.useRef(playing)
  const cbRef = React.useRef({ onPlayingChange, onRateChange })
  React.useEffect(() => {
    playingRef.current = playing
    cbRef.current = { onPlayingChange, onRateChange }
  })
  const setPlaying = React.useCallback((next: boolean) => {
    if (playingRef.current === next) return
    playingRef.current = next
    setPlayingState(next)
    cbRef.current.onPlayingChange?.(next)
  }, [])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const visibleRef = React.useRef(true)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* the tape runs on rAF, paused offscreen and in hidden tabs */
  React.useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (visibleRef.current && !document.hidden) {
        if (last) {
          const next = timeRef.current + Math.min(0.1, (now - last) / 1000) * rate
          if (next >= duration) {
            setTime(duration)
            setPlaying(false)
            return
          }
          setTime(next)
        }
        last = now
      } else last = 0
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, duration, setTime, setPlaying])

  const togglePlay = () => {
    if (playing) return setPlaying(false)
    if (timeRef.current >= duration - 0.05) setTime(0)
    setPlaying(true)
  }
  const pickRate = (r: 1 | 2 | 4) => {
    if (rateProp === undefined) setInnerRate(r)
    cbRef.current.onRateChange?.(r)
  }

  /* geometry */
  const plotRef = React.useRef<HTMLDivElement>(null)
  const [plotW, setPlotW] = React.useState(560)
  React.useEffect(() => {
    const el = plotRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setPlotW(Math.max(40, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const ticks = React.useMemo(() => pickTicks(duration, plotW), [duration, plotW])

  /* the dither strip: one canvas pass → an alpha mask for two stacked layers */
  const densRef = React.useRef<HTMLDivElement>(null)
  const densOnRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const cols = Math.max(12, Math.round(plotW / 3))
    const url = drawDensityMask(densityBins(sorted, duration, cols), cols)
    for (const el of [densRef.current, densOnRef.current]) {
      if (!el) continue
      el.style.setProperty("-webkit-mask-image", url ? `url(${url})` : "none")
      el.style.setProperty("mask-image", url ? `url(${url})` : "none")
    }
  }, [sorted, duration, plotW])

  /* pointer: drag the playhead, boundaries snap gently */
  const [dragging, setDragging] = React.useState(false)
  const dragRef = React.useRef({ active: false, wasPlaying: false })
  const boundaries = React.useMemo(() => {
    const set = new Set<number>([0, duration])
    for (const s of sorted) {
      set.add(s.start)
      set.add(Math.min(s.end, duration))
    }
    return [...set].sort((a, b) => a - b)
  }, [sorted, duration])

  const timeFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const raw = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1) * duration
    if (!snap || e.altKey) return raw
    const within = (6 / Math.max(1, rect.width)) * duration
    let best = raw
    let bestD = within
    for (const b of boundaries) {
      const d = Math.abs(b - raw)
      if (d <= bestD) {
        best = b
        bestD = d
      }
    }
    return best
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { active: true, wasPlaying: playingRef.current }
    setPlaying(false)
    setDragging(true)
    setTime(timeFromPointer(e))
    e.currentTarget.focus({ preventScroll: true })
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--irs-hover", String(clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1) * 100))
    if (dragRef.current.active) setTime(timeFromPointer(e))
  }
  const endDrag = () => {
    if (!dragRef.current.active) return
    const resume = dragRef.current.wasPlaying && timeRef.current < duration
    dragRef.current.active = false
    setDragging(false)
    if (resume) setPlaying(true)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = (e.shiftKey ? 10 : 1) * keyStep
    const now = timeRef.current
    let next: number | null = null
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = now + step
        break
      case "ArrowLeft":
      case "ArrowDown":
        next = now - step
        break
      case "Home":
        next = 0
        break
      case "End":
        next = duration
        break
      case "PageDown":
        next = sorted.find((s) => s.start > now + 1e-6)?.start ?? duration
        break
      case "PageUp":
        next = [...sorted].reverse().find((s) => s.start < now - 1e-6)?.start ?? 0
        break
      case " ":
        e.preventDefault()
        togglePlay()
        return
      default:
        return
    }
    e.preventDefault()
    setPlaying(false)
    setTime(next)
  }

  /* derived state at the playhead */
  const st = stateAt(sorted, t, duration)
  const stepNo = st.active ? st.shownIdx + 1 : st.started
  const pct = (t / duration) * 100
  const snapped = boundaries.some((b) => Math.abs(b - t) < 1e-6)
  const cost = (st.tokens / 1000) * costPer1kTokens
  const heading = title ?? (isDemo ? SAGE_TITLE : undefined)
  const label = runLabel ?? (isDemo ? "RUN 0412 · SAGE" : "RUN")
  const stepProgress = st.active ? clamp((t - st.active.start) / (st.active.end - st.active.start), 0, 1) : 0
  const valueText = `T+${formatClock(t)}, ${st.active ? `step ${stepNo} of ${sorted.length}: ${st.active.title}` : "between steps"}`

  return (
    <div ref={rootRef} className={cn("irs", className)}>
      <style href="run-scrubber" precedence="default">
        {CSS}
      </style>
      <div className="irs-card">
        <i className="irs-crop" data-c="tl" aria-hidden />
        <i className="irs-crop" data-c="tr" aria-hidden />
        <i className="irs-crop" data-c="bl" aria-hidden />
        <i className="irs-crop" data-c="br" aria-hidden />

        <header className="irs-head">
          <div>
            <div className="irs-lab">
              {label} · {duration.toFixed(1)} S · {sorted.length} STEPS
            </div>
            {heading ? <h3 className="irs-title">{heading}</h3> : null}
          </div>
          <div className="irs-status">
            <span className="irs-lab">{playing ? `PLAYING ${rate}×` : t >= duration ? "END OF RUN" : "PAUSED"}</span>
            <span className="irs-dot" data-on={playing ? "" : undefined} aria-hidden />
          </div>
        </header>

        <section className="irs-state" aria-label="State at playhead">
          <div className="irs-col">
            <div className="irs-col-h">
              <span className="irs-lab">State at playhead</span>
              {st.shown ? (
                <span className="irs-chip" data-idle={st.active ? undefined : ""}>
                  {st.active ? st.shown.track : `after · ${st.shown.track}`}
                </span>
              ) : null}
            </div>
            <p className="irs-step" data-idle={st.active ? undefined : ""}>
              <span key={st.shown?.id ?? "none"} className="irs-swap">
                {st.shown ? st.shown.title : "Before the first step"}
              </span>
            </p>
            <p className="irs-meta">
              {st.shown
                ? `${st.active ? "" : "ended "}${st.shown.start.toFixed(1)}–${st.shown.end.toFixed(1)} s · ${(st.shown.end - st.shown.start).toFixed(1)} s${st.shown.tokens ? ` · ${formatTokens(st.shown.tokens)} tokens` : ""}`
                : "Drag the playhead or press play"}
            </p>
            <div className="irs-io">
              <div>
                <div className="irs-io-k">
                  <span className="irs-lab">{st.call ? (st.call.stale ? "Last call" : "Tool call") : "Tool call"}</span>
                  <span className="irs-lab">{st.call?.step.detail?.tool ?? "—"}</span>
                </div>
                <pre className="irs-pre" data-empty={st.call?.input ? undefined : ""}>
                  {st.call?.input || (st.call ? " " : "No tool called yet")}
                </pre>
              </div>
              <div>
                <div className="irs-io-k">
                  <span className="irs-lab">Output</span>
                  <span className="irs-lab">{st.call?.running ? "waiting" : st.call ? "returned" : ""}</span>
                </div>
                <pre className="irs-pre" data-empty={st.call?.output ? undefined : ""}>
                  {st.call?.output || (st.call?.running ? "" : st.call ? "" : "—")}
                  {st.call?.running ? <span className="irs-caret" aria-hidden /> : null}
                </pre>
              </div>
            </div>
          </div>
          <div className="irs-col">
            <div className="irs-col-h">
              <span className="irs-lab">Scratchpad</span>
              <span className="irs-lab">{st.typing && playing ? "writing" : "so far"}</span>
            </div>
            <div className="irs-pad-body" aria-live="off">
              {st.scratch.length ? (
                st.scratch.map((p, i) => (
                  <p key={i}>
                    {p}
                    {i === st.scratch.length - 1 && (playing || st.typing) ? <span className="irs-caret" aria-hidden /> : null}
                  </p>
                ))
              ) : (
                <p data-empty>Nothing written yet</p>
              )}
            </div>
          </div>
        </section>

        <dl className="irs-readout" aria-label="Readout at playhead">
          <div className="irs-ro">
            <dt>T+</dt>
            <dd>{formatClock(t)}</dd>
          </div>
          <div className="irs-ro">
            <dt>Tokens</dt>
            <dd>{formatTokens(st.tokens)}</dd>
          </div>
          <div className="irs-ro">
            <dt>Cost</dt>
            <dd>
              <small>$</small>
              {formatCost(cost)}
            </dd>
          </div>
          <div className="irs-ro">
            <dt>Step</dt>
            <dd>
              {stepNo}
              <small>/{sorted.length}</small>
            </dd>
          </div>
        </dl>

        <div className="irs-bar">
          <button type="button" className="irs-play" data-on={playing ? "" : undefined} aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
          </button>
          <div className="irs-rates" role="group" aria-label="Playback speed">
            {RATES.map((r) => (
              <button key={r} type="button" aria-pressed={rate === r} onClick={() => pickRate(r)}>
                {r}×
              </button>
            ))}
          </div>
          <div className="irs-keys" aria-hidden>
            <span className="irs-lab">← → step</span>
            <span className="irs-lab">⇧ ×10</span>
            <span className="irs-lab">Space play</span>
          </div>
        </div>

        <div className="irs-plotwrap">
          <div
            ref={plotRef}
            className="irs-plot"
            style={{ "--irs-pct": pct } as React.CSSProperties}
            data-drag={dragging ? "" : undefined}
            role="slider"
            tabIndex={0}
            aria-label="Run time"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={Math.round(t * 10) / 10}
            aria-valuetext={valueText}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown}
          >
            <div className="irs-mini" aria-hidden>
              <span className="irs-gl">Tok/s</span>
              <div ref={densRef} className="irs-dens" />
              <div ref={densOnRef} className="irs-dens-on" />
            </div>
            <div className="irs-ruler" aria-hidden>
              <span className="irs-gl" style={{ bottom: 0 }}>
                Sec
              </span>
              {ticks.map((k, i) => (
                <span key={k.t} className="irs-tick" data-major={k.major ? "" : undefined} data-first={i === 0 ? "" : undefined} style={{ left: `${(k.t / duration) * 100}%` }}>
                  {k.major ? <span>{formatTick(k.t)}</span> : null}
                </span>
              ))}
            </div>
            <div className="irs-tracks" aria-hidden>
              {ticks.map((k) =>
                k.major && k.t > 0 && k.t < duration ? <i key={k.t} className="irs-gridline" style={{ left: `${(k.t / duration) * 100}%` }} /> : null,
              )}
              {TRACKS.map((tr) => (
                <div key={tr.id} className="irs-track">
                  <span className="irs-gl">{tr.label}</span>
                  {sorted.map((s) =>
                    s.track === tr.id ? (
                      <div
                        key={s.id}
                        className="irs-seg"
                        data-track={s.track}
                        data-state={st.active?.id === s.id ? "active" : s.end <= t ? "past" : "future"}
                        style={
                          {
                            "--s": (s.start / duration) * 100,
                            "--w": ((Math.min(s.end, duration) - s.start) / duration) * 100,
                            "--p": st.active?.id === s.id ? stepProgress : 0,
                          } as React.CSSProperties
                        }
                      >
                        {s.title}
                        {st.active?.id === s.id ? <i /> : null}
                      </div>
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <div className="irs-ghost" aria-hidden />
            <div className="irs-playhead" data-snapped={snapped && dragging ? "" : undefined} aria-hidden>
              <span className="irs-grip" />
            </div>
            <div className="irs-scan" aria-hidden />
          </div>
        </div>

        <footer className="irs-fig">
          <span className="irs-lab">
            FIG. 3 — {label.replace(/^RUN\s*/, "Run ").replace(/ · .*/, "")}, {duration.toFixed(0)} s, {sorted.length} steps on 3 tracks
          </span>
        </footer>
        <div className="irs-sr" aria-live="polite">
          {st.active ? `Step ${stepNo} of ${sorted.length}: ${st.active.title}` : ""}
        </div>
      </div>
    </div>
  )
}

export default RunScrubber
