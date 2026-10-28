"use client"

import * as React from "react"
import { Check, ChevronDown, FileText, Pause, Play } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PebbleState = "idle" | "working" | "needs-you" | "paused" | "done"
export type PebbleEdge = "left" | "right" | "top" | "bottom"

/** Where the pebble rests: an edge of the stage and a position along it (0 = start, 1 = end). */
export type PebbleDock = { edge: PebbleEdge; at: number }

export type PebbleStep = {
  /** Name of the step in the list, such as "Draft the Q3 summary". */
  label: string
  /** What the agent is doing while it runs, completing "Sage is …": "drafting the Q3 summary". */
  active: string
}

export type PebbleApproval = {
  /** The question, such as "Send the Q3 summary to investors?". */
  title: string
  /** What approving causes, in plain words: "Sends to 14 investors at 09:00 tomorrow." */
  consequence: string
  /** A small file or object chip under the question. */
  detail?: string
  approveLabel?: string
  pauseLabel?: string
}

export type PebbleResult = {
  /** Shown on the pill when the run is done. */
  title: string
  /** One line under it. */
  detail: string
}

export type AgentPebbleProps = {
  /** Agent name. Its first letter is the avatar. */
  agent?: string
  /** The run, in order. */
  steps?: PebbleStep[]
  /** Controlled state. Leave it out and the pebble plays its own idle, working, needs you and done loop. */
  state?: PebbleState
  /** Index of the running step (0-based). Used with `state` in controlled mode. */
  step?: number
  /** What the agent is asking. Shown when the state is "needs-you". */
  approval?: PebbleApproval
  /** Shown when the state is "done". */
  result?: PebbleResult
  /** Called when the person approves. */
  onApprove?: () => void
  /** Called when the person pauses the run. */
  onPause?: () => void
  /** Called when the person resumes a paused run. */
  onResume?: () => void
  /** Called from the idle panel. */
  onStart?: () => void
  /** Called from the done panel. */
  onDismiss?: () => void
  /** Called whenever the shown state changes, including in the built-in loop. */
  onStateChange?: (state: PebbleState) => void
  /** Controlled dock position. */
  dock?: PebbleDock
  defaultDock?: PebbleDock
  /** Called after a drag or an arrow key docks the pebble. */
  onDockChange?: (dock: PebbleDock) => void
  /** Controlled expanded state. */
  expanded?: boolean
  /** Starts open. In the built-in behaviour the pebble opens by itself when it needs you. */
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Run the built-in loop. Defaults to true when `state` is not given. */
  autoPlay?: boolean
  /** Start the built-in loop over after it finishes. */
  loop?: boolean
  /** Milliseconds per step in the built-in loop. */
  stepMs?: number
  /** True refraction in Chromium. Other browsers and reduced-transparency users get frosted glass either way. */
  refraction?: boolean
  /** Height of the stage in px. */
  height?: number
  /** The page the pebble floats over. Defaults to a busy demo dashboard so the glass has something to bend. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Defaults                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_STEPS: PebbleStep[] = [
  { label: "Read the Q2 update", active: "reading the Q2 update" },
  { label: "Pull the Q3 numbers", active: "pulling Q3 numbers" },
  { label: "Draft the summary", active: "drafting the summary" },
  { label: "Check the figures", active: "checking the figures" },
  { label: "Queue the send", active: "queueing the send" },
]

const DEFAULT_APPROVAL: PebbleApproval = {
  title: "Send the Q3 summary to investors?",
  consequence: "Sends to 14 investors at 09:00 tomorrow. You can recall it until then.",
  detail: "Q3 summary · 2 pages · draft 3",
  approveLabel: "Approve",
  pauseLabel: "Pause",
}

const DEFAULT_RESULT: PebbleResult = { title: "Q3 summary queued", detail: "Goes out at 09:00 tomorrow" }

const DEFAULT_DOCK: PebbleDock = { edge: "right", at: 0.2 }

const M = 14 // gap between the pebble and the stage edge
const HEAD = 56 // height of the collapsed pebble
const FULL = 332 // width of the open pebble
const IDLE = 64 // the resting orb is a little larger, so it can carry the first scene

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ipb {
  --ipb-ink: #000;
  --ipb-surface: #fff;
  --ipb-accent: #0060e2;
  --ipb-btn: var(--ipb-accent);
  --ipb-ok: #12a150;
  --ipb-warn: #d97706;
  --ipb-t1: color-mix(in oklab, var(--ipb-ink) 88%, transparent);
  --ipb-t2: color-mix(in oklab, var(--ipb-ink) 66%, transparent);
  --ipb-t3: color-mix(in oklab, var(--ipb-ink) 62%, transparent);
  --ipb-t4: color-mix(in oklab, var(--ipb-ink) 30%, transparent);
  --ipb-fill: color-mix(in oklab, var(--ipb-ink) 7%, transparent);
  --ipb-line: color-mix(in oklab, var(--ipb-ink) 9%, transparent);
  --ipb-glint: rgb(255 255 255 / .75);
  --ipb-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ipb-float: 0 0 0 .5px rgb(0 0 0 / .1), 0 18px 40px -10px rgb(30 16 80 / .38), 0 3px 8px -2px rgb(0 0 0 / .14);
  --ipb-ease: cubic-bezier(.22, 1, .36, 1);
  --ipb-light: 135deg;
  --ipb-state: var(--ipb-t4);

  --ipb-pg-bg: #f4f1ff;
  --ipb-pg-card: #fff;
  --ipb-pg-ink: #1b1536;
  --ipb-pg-mut: #6f6892;
  --ipb-pg-line: rgb(27 21 54 / .08);
  --ipb-pg-map: #ffe7ef;

  position: relative; display: block; width: 100%; height: var(--ipb-stage-h, 540px); overflow: hidden;
  border-radius: 22px; background: var(--ipb-pg-bg); box-shadow: var(--ipb-shadow); color: var(--ipb-t1);
  font-family: var(--ipb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ipb {
  --ipb-ink: #fff;
  --ipb-surface: #1c1c1e;
  --ipb-accent: #4d8dff;
  --ipb-btn: color-mix(in oklab, var(--ipb-accent) 68%, #000);
  --ipb-ok: #3ecf8e;
  --ipb-warn: #ffb84d;
  --ipb-t1: color-mix(in oklab, var(--ipb-ink) 92%, transparent);
  --ipb-t2: color-mix(in oklab, var(--ipb-ink) 72%, transparent);
  --ipb-t3: color-mix(in oklab, var(--ipb-ink) 62%, transparent);
  --ipb-t4: color-mix(in oklab, var(--ipb-ink) 32%, transparent);
  --ipb-fill: color-mix(in oklab, var(--ipb-ink) 10%, transparent);
  --ipb-line: color-mix(in oklab, var(--ipb-ink) 12%, transparent);
  --ipb-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ipb-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 18px 40px -10px rgb(0 0 0 / .7), 0 3px 8px -2px rgb(0 0 0 / .4);
  --ipb-pg-bg: #110e24;
  --ipb-pg-card: #1d1938;
  --ipb-pg-ink: #f3f0ff;
  --ipb-pg-mut: #a49dcb;
  --ipb-pg-line: rgb(255 255 255 / .08);
  --ipb-pg-map: #150d38;
}
.ipb *, .ipb *::before, .ipb *::after { box-sizing: border-box }
:where(.ipb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.ipb :focus-visible { outline: 2px solid color-mix(in oklab, var(--ipb-accent) 70%, transparent); outline-offset: 1px }
.ipb-defs { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none }
.ipb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
.ipb-scene { position: absolute; inset: 0; container-type: size; overflow: hidden }

/* ---------------------------------------------------------------------------
   The pebble. One glass element: its width, height and radius morph between
   states; position is a translate so a drag costs no layout.
   --------------------------------------------------------------------------- */
.ipb-pebble {
  position: absolute; left: 0; top: 0; z-index: 2;
  width: var(--ipb-w, 56px); height: var(--ipb-h, 56px); border-radius: var(--ipb-r, 28px);
  transform: translate3d(var(--ipb-x, 0px), var(--ipb-y, 0px), 0);
  overflow: hidden; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none;
  color: var(--ipb-t1);
  background: color-mix(in oklab, var(--ipb-surface) 95%, transparent);
  box-shadow: var(--ipb-float), inset 0 0 0 1px color-mix(in oklab, var(--ipb-ink) 14%, transparent);
}
.ipb-pebble[data-state="idle"] { --ipb-state: var(--ipb-ok) }
.ipb-pebble[data-state="working"] { --ipb-state: var(--ipb-accent) }
.ipb-pebble[data-state="needs-you"] { --ipb-state: var(--ipb-warn) }
.ipb-pebble[data-state="paused"] { --ipb-state: var(--ipb-t3) }
.ipb-pebble[data-state="done"] { --ipb-state: var(--ipb-ok) }
.ipb-pebble[data-ready] {
  transition: width .6s var(--ipb-ease), height .6s var(--ipb-ease), border-radius .6s var(--ipb-ease), transform .6s var(--ipb-ease);
}
.ipb-pebble[data-dragging] { transition: none; cursor: grabbing; will-change: transform }

/* Glass layers. Tier 0 is solid; Tier 1 is frost; Tier 2 (true refraction) is set inline by the component. */
.ipb-bd { position: absolute; inset: 0; z-index: 0; border-radius: inherit }
.ipb-tint { position: absolute; inset: 0; z-index: 1; border-radius: inherit; background: var(--ipb-surface); opacity: .94; transition: opacity .5s var(--ipb-ease) }
.ipb-sheen {
  position: absolute; inset: 0; z-index: 2; border-radius: inherit; pointer-events: none;
  background: linear-gradient(var(--ipb-light), rgb(255 255 255 / .32), rgb(255 255 255 / 0) 42%);
  box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .55), inset 0 1px 3px rgb(255 255 255 / .22);
}
.ipb-rim {
  position: absolute; inset: 0; z-index: 3; border-radius: inherit; padding: 1.5px; pointer-events: none;
  background: linear-gradient(var(--ipb-light), rgb(255 255 255 / .9), rgb(255 255 255 / .14) 30%, transparent 50%, rgb(255 255 255 / .14) 70%, rgb(255 255 255 / .65));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
.ipb-sring {
  position: absolute; inset: 0; z-index: 3; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ipb-state) 46%, transparent);
  transition: box-shadow .6s var(--ipb-ease);
}
.ipb-pebble[data-state="idle"] .ipb-sring { box-shadow: inset 0 0 0 1.5px transparent }

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .ipb-pebble { background: transparent; box-shadow: var(--ipb-float) }
  .ipb-bd { backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%) }
  .ipb-tint { opacity: .64 }
  .ipb-pebble[data-open] .ipb-tint { opacity: .8 }
}
/* Opt-outs return to the solid Tier 0 look. They sit after Tier 1 so they win. */
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {
  .ipb-pebble { background: color-mix(in oklab, var(--ipb-surface) 95%, transparent); box-shadow: var(--ipb-float), inset 0 0 0 1px color-mix(in oklab, var(--ipb-ink) 18%, transparent) }
  .ipb-bd { backdrop-filter: none !important; -webkit-backdrop-filter: none !important }
  .ipb-tint, .ipb[data-refract] .ipb-tint, .ipb[data-refract] .ipb-pebble[data-open] .ipb-tint { opacity: .95 }
  .ipb-sheen { display: none }
}
@media (forced-colors: active) {
  .ipb-pebble { background: Canvas; border: 1px solid CanvasText; forced-color-adjust: none; color: CanvasText }
  .ipb-dot, .ipb-arc { forced-color-adjust: none }
  .ipb-btn { border: 1px solid ButtonText }
  .ipb-scrim { display: none }
}
:is(.dark, [data-theme="dark"]) .ipb .ipb-sheen { background: linear-gradient(var(--ipb-light), rgb(255 255 255 / .16), rgb(255 255 255 / 0) 42%) }
.ipb[data-refract="on"] .ipb-tint { opacity: .58 }
.ipb[data-refract="on"] .ipb-pebble[data-open] .ipb-tint { opacity: .8 }

/* Content: fixed-width layout inside, clipped by the growing glass, so text is revealed and never scaled. */
.ipb-content { position: absolute; z-index: 4; left: 0; top: 0; width: var(--ipb-cw, 332px); transition: left .6s var(--ipb-ease), top .6s var(--ipb-ease) }
.ipb-pebble[data-state="idle"]:not([data-open]) .ipb-content { left: 4px; top: 4px }
.ipb-head { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; height: ${HEAD}px; padding: 0 44px 0 8px; border-radius: 28px }
.ipb-head:focus-visible { outline-offset: -4px }
.ipb-av { position: relative; flex: none; width: 40px; height: 40px }
.ipb-ring { position: absolute; inset: 0; width: 40px; height: 40px; transform: rotate(-90deg) }
.ipb-ring circle { fill: none; stroke-width: 2.4; stroke-linecap: round }
.ipb-ring .ipb-trk { stroke: var(--ipb-line) }
.ipb-ring .ipb-arc { stroke: var(--ipb-state); transition: stroke-dashoffset .8s var(--ipb-ease), stroke .5s, opacity .4s }
.ipb-pebble[data-state="idle"] .ipb-arc { opacity: 0 }
.ipb-disc {
  position: absolute; inset: 5px; display: grid; place-items: center; border-radius: 50%;
  font-size: 14px; font-weight: 600; color: var(--ipb-t1);
  background: linear-gradient(145deg, rgb(255 255 255 / .85), rgb(255 255 255 / .3));
  box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .9), 0 1px 2px rgb(0 0 0 / .14);
}
:is(.dark, [data-theme="dark"]) .ipb .ipb-disc { background: linear-gradient(145deg, rgb(255 255 255 / .22), rgb(255 255 255 / .06)); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .3), 0 1px 2px rgb(0 0 0 / .4) }
.ipb-disc > * { animation: ipb-pop .5s var(--ipb-ease) backwards }
.ipb-disc svg { width: 15px; height: 15px; stroke-width: 2.6; color: var(--ipb-ok) }
.ipb-dot {
  position: absolute; right: -2px; bottom: -2px; width: 13px; height: 13px; border-radius: 50%;
  background: var(--ipb-state); box-shadow: 0 0 0 2px #fff, 0 1px 3px rgb(0 0 0 / .3); transition: background-color .5s;
}
.ipb-pebble[data-state="needs-you"] .ipb-dot::after, .ipb-pebble[data-state="working"] .ipb-dot::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--ipb-state); animation: ipb-ping 2s var(--ipb-ease) infinite;
}
.ipb-pebble[data-state="working"] .ipb-dot::after { animation-duration: 2.6s }
.ipb-txt { display: grid; min-width: 0; flex: 1 }
.ipb-ti { position: relative; display: grid; font-size: 13px; line-height: 20px; font-weight: 500; letter-spacing: -.012em; max-width: calc(var(--ipb-cw, 332px) - 102px); white-space: nowrap }
.ipb-me { position: relative; display: grid; font-size: 12px; line-height: 16px; color: var(--ipb-t2); font-variant-numeric: tabular-nums; max-width: calc(var(--ipb-cw, 332px) - 102px); white-space: nowrap }
.ipb-sw { position: relative; display: block; overflow: hidden; text-overflow: ellipsis }
.ipb-sw-cur { grid-area: 1 / 1; display: block; overflow: hidden; text-overflow: ellipsis; animation: ipb-swap .2s var(--ipb-ease) backwards }
.ipb-sw-prev { position: absolute; left: 0; top: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; pointer-events: none; animation: ipb-out .14s var(--ipb-ease) forwards }
.ipb-ti[data-shimmer] .ipb-sw-cur { position: relative }
.ipb-ti[data-shimmer] .ipb-sw-cur::after {
  content: attr(data-text); position: absolute; left: 0; top: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--ipb-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: ipb-sweep 2.1s linear infinite;
}
.ipb-chev { position: absolute; z-index: 4; right: 14px; top: 14px; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--ipb-t2); pointer-events: none; transition: opacity .3s, transform .5s var(--ipb-ease) }
.ipb-chev svg { width: 16px; height: 16px }
.ipb-pebble[data-open] .ipb-chev { transform: rotate(180deg) }
.ipb-pebble[data-state="idle"]:not([data-open]) .ipb-chev { opacity: 0 }

/* Body */
.ipb-body { position: absolute; left: 0; top: ${HEAD}px; width: var(--ipb-cw, 332px); max-height: calc(var(--ipb-h, 56px) - ${HEAD}px); overflow-y: auto; overscroll-behavior: contain; opacity: 0; filter: blur(3px); visibility: hidden; transition: opacity .2s, filter .2s, visibility 0s .2s }
.ipb-pebble[data-open] .ipb-body { opacity: 1; filter: blur(0); visibility: visible; transition: opacity .42s var(--ipb-ease) .12s, filter .42s var(--ipb-ease) .12s, visibility 0s }
.ipb-bodyin { padding: 0 18px 18px }
.ipb-view { animation: ipb-in .5s var(--ipb-ease) backwards }
.ipb-q { margin: 0; font-size: 14.5px; line-height: 20px; font-weight: 500; letter-spacing: -.01em; color: var(--ipb-t1) }
.ipb-cons { margin: 4px 0 0; font-size: 13px; line-height: 19px; color: var(--ipb-t2) }
.ipb-chip { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 3px 10px 3px 8px; border-radius: 999px; background: color-mix(in oklab, var(--ipb-surface) 80%, var(--ipb-ink) 8%); font-size: 12px; line-height: 18px; color: var(--ipb-t2) }
.ipb-chip svg { width: 13px; height: 13px; flex: none }
.ipb-actions { display: flex; gap: 8px; margin-top: 14px }
.ipb-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 16px; border-radius: 17px;
  font-size: 13px; line-height: 20px; font-weight: 500; white-space: nowrap; text-shadow: none;
  transition: transform .18s var(--ipb-ease), background-color .2s, box-shadow .2s;
}
.ipb-btn:active { transform: scale(.96) }
.ipb-btn svg { width: 14px; height: 14px; flex: none }
.ipb-btn[data-kind="primary"] { flex: 1; background: var(--ipb-btn); color: #fff; box-shadow: inset 0 1px 0 rgb(255 255 255 / .28), 0 1px 2px rgb(0 0 0 / .22) }
.ipb-btn[data-kind="primary"]:hover { background: color-mix(in oklab, var(--ipb-btn) 88%, #000) }
.ipb-btn[data-kind="ghost"] { background: color-mix(in oklab, var(--ipb-surface) 86%, var(--ipb-ink) 7%); box-shadow: inset 0 0 0 .5px var(--ipb-line), 0 1px 2px rgb(0 0 0 / .08) }
.ipb-btn[data-kind="ghost"]:hover { background: color-mix(in oklab, var(--ipb-surface) 78%, var(--ipb-ink) 12%) }
.ipb-steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px }
.ipb-step { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: center; gap: 10px; height: 26px; font-size: 13px; color: var(--ipb-t3) }
.ipb-step[data-s="done"] { color: var(--ipb-t2) }
.ipb-step[data-s="run"] { color: var(--ipb-t1); font-weight: 500 }
.ipb-step[data-s="pause"] { color: var(--ipb-t1); font-weight: 500 }
.ipb-step-ic { display: grid; place-items: center; width: 16px; height: 16px }
.ipb-step-ic i { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--ipb-t4) }
.ipb-step[data-s="run"] .ipb-step-ic i { border: 0; background: var(--ipb-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ipb-accent) 22%, transparent) }
.ipb-step[data-s="pause"] .ipb-step-ic i { border: 0; background: var(--ipb-t3) }
.ipb-step-ic svg { width: 14px; height: 14px; stroke-width: 2.6; color: var(--ipb-ok); animation: ipb-pop .5s var(--ipb-ease) backwards }
.ipb-step-w { font-size: 12px; font-weight: 400; color: var(--ipb-t3) }
.ipb-step[data-s="run"] .ipb-step-w { color: var(--ipb-accent); font-weight: 500 }
.ipb-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px }
.ipb-hint { font-size: 11.5px; line-height: 16px; color: var(--ipb-t3); text-align: right }
.ipb-idle-p { margin: 0 0 12px; font-size: 13px; line-height: 19px; color: var(--ipb-t2) }

/* A faint dim behind the open card, so the page does not compete with the question. */
.ipb-scrim { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: rgb(24 16 60 / .06); opacity: 0; transition: opacity .5s var(--ipb-ease) }
.ipb[data-open] .ipb-scrim { opacity: 1 }
:is(.dark, [data-theme="dark"]) .ipb .ipb-scrim { background: rgb(0 0 0 / .22) }
.ipb-pebble[data-state="needs-you"] { box-shadow: var(--ipb-float), 0 0 0 3px color-mix(in oklab, var(--ipb-warn) 20%, transparent), 0 0 28px -2px color-mix(in oklab, var(--ipb-warn) 42%, transparent) }
.ipb-pebble[data-state="idle"]:not([data-open]) .ipb-av { animation: ipb-breathe 3.2s ease-in-out infinite }
.ipb-pebble[data-state="idle"] .ipb-trk { stroke: var(--ipb-t4) }
.ipb-pebble[data-state="done"] .ipb-sheen::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 38%; transform: translateX(-120%) skewX(-18deg);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / .75), transparent); animation: ipb-glide 1.3s .25s var(--ipb-ease) forwards;
}
@keyframes ipb-glide { to { transform: translateX(380%) skewX(-18deg) } }
@keyframes ipb-breathe { 50% { transform: scale(1.05) } }

/* Moments */
.ipb-pebble[data-state="done"] .ipb-sring { animation: ipb-flash 1.6s var(--ipb-ease) backwards }
@keyframes ipb-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes ipb-swap { from { opacity: 0; transform: translateY(3px); filter: blur(2px) } }
@keyframes ipb-out { to { opacity: 0; transform: translateY(-4px); filter: blur(3px) } }
@keyframes ipb-pop { from { opacity: 0; transform: scale(.55); filter: blur(2px) } }
@keyframes ipb-ping { 0% { transform: scale(1); opacity: .55 } 70%, 100% { transform: scale(2.4); opacity: 0 } }
@keyframes ipb-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes ipb-flash { 0% { box-shadow: inset 0 0 0 3px color-mix(in oklab, var(--ipb-ok) 90%, transparent), inset 0 0 22px color-mix(in oklab, var(--ipb-ok) 55%, transparent) } 100% { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ipb-ok) 46%, transparent), inset 0 0 0 transparent } }

@media (prefers-reduced-motion: reduce) {
  .ipb *, .ipb *::before, .ipb *::after { animation: none !important; transition: none !important }
  .ipb-sw-prev { display: none }
}

/* ---------------------------------------------------------------------------
   The demo page behind the glass: loud on purpose, glass only reads over detail.
   --------------------------------------------------------------------------- */
.ipb-pg {
  position: absolute; inset: 0; display: grid; grid-template-columns: minmax(0, 1fr); color: var(--ipb-pg-ink);
  background: radial-gradient(520px 320px at 92% -4%, rgb(255 122 150 / .32), transparent 70%), radial-gradient(460px 380px at 0% 100%, rgb(18 194 164 / .24), transparent 70%), radial-gradient(360px 260px at 55% 60%, rgb(106 76 255 / .14), transparent 70%);
}
.ipb-pg-side { display: none; padding: 16px 12px; background: linear-gradient(180deg, #231654, #150d38); color: #e9e4ff }
.ipb-pg-logo { display: flex; align-items: center; gap: 8px; padding: 2px 8px 14px; font-size: 13px; font-weight: 600; color: #fff }
.ipb-pg-logo i { width: 22px; height: 22px; border-radius: 7px; background: conic-gradient(from 200deg, #ff6a5c, #e63e8f, #6a4cff, #2aa9ff, #12c2a4, #ff6a5c) }
.ipb-pg-nav { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 8px; border-radius: 9px; font-size: 12.5px; color: #bdb4ee }
.ipb-pg-nav i { width: 16px; height: 16px; border-radius: 5px }
.ipb-pg-nav[data-on] { background: rgb(255 255 255 / .12); color: #fff }
.ipb-pg-nav b { margin-left: auto; padding: 0 7px; border-radius: 9px; background: #ff6a5c; font-size: 10.5px; line-height: 17px; font-weight: 600; color: #fff }
.ipb-pg-plan { margin-top: 18px; padding: 12px; border-radius: 12px; background: linear-gradient(135deg, rgb(255 106 92 / .9), rgb(230 62 143 / .9) 55%, rgb(106 76 255 / .95)); color: #fff; font-size: 12px; line-height: 17px }
.ipb-pg-plan strong { display: block; font-size: 13px; margin-bottom: 2px }
.ipb-pg-plan span { display: block; height: 5px; margin-top: 9px; border-radius: 3px; background: rgb(255 255 255 / .3) }
.ipb-pg-plan span::after { content: ""; display: block; width: 72%; height: 100%; border-radius: 3px; background: #fff }
.ipb-pg-main { display: grid; gap: 14px; align-content: start; min-width: 0; padding: 16px; grid-template-columns: minmax(0, 1fr) }
.ipb-pg-top { display: flex; align-items: center; gap: 10px; min-width: 0 }
.ipb-pg-top h3 { margin: 0; flex: 1; min-width: 0; font-size: 15px; line-height: 22px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ipb-pg-search { display: none; width: 150px; height: 30px; padding: 0 12px; border-radius: 15px; background: var(--ipb-pg-card); box-shadow: 0 0 0 .5px var(--ipb-pg-line); font-size: 12px; line-height: 30px; color: var(--ipb-pg-mut) }
.ipb-pg-avs { display: flex }
.ipb-pg-avs i { width: 26px; height: 26px; margin-left: -7px; border-radius: 50%; border: 2px solid var(--ipb-pg-bg) }
.ipb-pg-card { min-width: 0; padding: 14px; border-radius: 16px; background: var(--ipb-pg-card); box-shadow: 0 0 0 .5px var(--ipb-pg-line), 0 6px 18px -10px rgb(60 30 140 / .25) }
.ipb-pg-hero {
  position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 4px; min-height: 150px; padding: 18px; border-radius: 18px; color: #fff;
  background: radial-gradient(260px 200px at 88% 20%, rgb(255 213 106 / .85), transparent 70%), linear-gradient(115deg, #ff7a59, #e8398d 48%, #6a4cff);
}
.ipb-pg-hero h2 { position: relative; margin: 0; max-width: 20ch; font-size: 22px; line-height: 26px; font-weight: 600; letter-spacing: -.02em }
.ipb-pg-hero p { position: relative; margin: 0; max-width: 34ch; font-size: 12.5px; line-height: 18px; color: rgb(255 255 255 / .86) }
.ipb-pg-hero svg { position: absolute; right: 0; bottom: 0; width: 70%; height: 100%; pointer-events: none }
.ipb-pg-tags { position: relative; display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 10px }
.ipb-pg-tags span { padding: 1px 10px; border-radius: 999px; background: rgb(255 255 255 / .22); font-size: 11.5px; line-height: 20px; font-weight: 500 }
.ipb-pg-kpis { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)) }
.ipb-pg-kpi { position: relative; overflow: hidden; padding: 12px; border-radius: 14px; background: var(--ipb-pg-card); box-shadow: 0 0 0 .5px var(--ipb-pg-line) }
.ipb-pg-kpi span { display: block; font-size: 11.5px; line-height: 16px; color: var(--ipb-pg-mut) }
.ipb-pg-kpi b { display: block; font-size: 20px; line-height: 26px; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
.ipb-pg-kpi em { font-style: normal; font-size: 11.5px; font-weight: 600 }
.ipb-pg-kpi svg { display: block; width: 100%; height: 34px; margin-top: 6px }
.ipb-pg-chart { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px }
.ipb-pg-chart header { display: flex; justify-content: space-between; align-items: baseline; font-size: 12.5px; font-weight: 600 }
.ipb-pg-chart header span { font-size: 11.5px; font-weight: 400; color: var(--ipb-pg-mut) }
.ipb-pg-bars { position: relative; display: flex; align-items: flex-end; gap: 6px; height: 130px; padding: 0 2px; background: repeating-linear-gradient(0deg, var(--ipb-pg-line) 0 1px, transparent 1px 32px) }
.ipb-pg-bars i { flex: 1; border-radius: 5px 5px 2px 2px; background: linear-gradient(180deg, #2aa9ff, #12c2a4) }
.ipb-pg-bars i[data-hot] { background: linear-gradient(180deg, #ff6a5c, #e63e8f) }
.ipb-pg-bars i[data-warm] { background: linear-gradient(180deg, #ffc23d, #ff8a3d) }
.ipb-pg-axis { display: flex; gap: 6px; padding: 0 2px; overflow: hidden; font-size: 10px; line-height: 14px; color: var(--ipb-pg-mut) }
.ipb-pg-axis span { flex: 1; min-width: 0; overflow: hidden; text-align: center }
.ipb-pg-feed { display: none; align-content: start; gap: 2px }
.ipb-pg-map { display: block; width: 100%; height: 118px; margin-bottom: 8px; border-radius: 12px }
.ipb-pg-feed h4 { margin: 0 0 6px; font-size: 12.5px; line-height: 18px; font-weight: 600 }
.ipb-pg-ev { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; padding: 8px 0; border-top: .5px solid var(--ipb-pg-line) }
.ipb-pg-ev i { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 11px; font-weight: 700; color: #fff }
.ipb-pg-ev p { margin: 0; font-size: 12px; line-height: 16px }
.ipb-pg-ev small { display: block; font-size: 11px; line-height: 15px; color: var(--ipb-pg-mut) }
.ipb-pg-rows { display: grid; gap: 0 }
.ipb-pg-row { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto auto; align-items: center; gap: 10px; height: 38px; border-top: .5px solid var(--ipb-pg-line); font-size: 12.5px }
.ipb-pg-row i { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 10.5px; font-weight: 700; color: #fff }
.ipb-pg-row span { color: var(--ipb-pg-mut); font-variant-numeric: tabular-nums }
.ipb-pg-row u { text-decoration: none; padding: 0 9px; border-radius: 999px; font-size: 11px; line-height: 19px; font-weight: 600 }
@container (min-width: 520px) { .ipb-pg-search { display: block } .ipb-pg-hero h2 { font-size: 26px; line-height: 30px } }
@container (min-width: 760px) {
  .ipb-pg { grid-template-columns: 188px minmax(0, 1fr) }
  .ipb-pg-side { display: block }
}
@container (min-width: 980px) {
  .ipb-pg-main { grid-template-columns: minmax(0, 1fr) 300px; padding: 18px 18px 18px 20px; gap: 16px }
  .ipb-pg-top { grid-column: 1 / -1 }
  .ipb-pg-feed { display: grid; grid-column: 2; grid-row: 2 / span 4 }
}
`

/* -------------------------------------------------------------------------- */
/*                               Demo page (scene)                            */
/* -------------------------------------------------------------------------- */

const NAV = [
  { l: "Overview", c: "#ffb020", on: true },
  { l: "Investors", c: "#ff6a5c" },
  { l: "Updates", c: "#e63e8f", n: 3 },
  { l: "Cash and runway", c: "#12c2a4" },
  { l: "Hiring", c: "#2aa9ff" },
  { l: "Documents", c: "#8f7bff" },
]
const MAP_DOTS: [number, number, number, number][] = (() => {
  const out: [number, number, number, number][] = []
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 24; x++) {
      const v = Math.sin(x * 0.55) * Math.cos(y * 0.9 + x * 0.12) + Math.sin(x * 0.23 + y * 0.4)
      if (v > -0.1) out.push([12 + x * 11.2, 12 + y * 10.4, 1.2 + Math.min(3.2, (v + 0.2) * 1.5), 0.45 + Math.min(0.55, v * 0.4)])
    }
  return out
})()
const MAP_CITIES: [number, number, string][] = [
  [64, 40, "#ff6a5c"],
  [128, 66, "#ffb020"],
  [186, 34, "#e63e8f"],
  [222, 78, "#12c2a4"],
]
const BARS = [38, 52, 44, 61, 57, 72, 66, 80, 74, 92, 86, 100]
const FEED = [
  { w: "Atlas", i: "A", c: "#12c2a4", t: "Reconciled 212 October invoices", m: "2 min ago" },
  { w: "Northwind Clinics", i: "N", c: "#ffb020", t: "Renewed for 24 months, $48k", m: "18 min ago" },
  { w: "Quill", i: "Q", c: "#6a4cff", t: "Drafted the board note", m: "41 min ago" },
  { w: "Meridian Labs", i: "M", c: "#e63e8f", t: "Opened the Q2 update twice", m: "1 h ago" },
  { w: "Priya Raman", i: "P", c: "#2aa9ff", t: "Asked about gross margin", m: "2 h ago" },
  { w: "Atlas", i: "A", c: "#12c2a4", t: "Flagged 3 unmatched payments", m: "3 h ago" },
  { w: "Tomas Weiss", i: "T", c: "#ff6a5c", t: "Replied to the August update", m: "Yesterday" },
]
const ROWS = [
  { n: "Priya Raman", i: "PR", c: "#2aa9ff", s: "4.2%", t: "Opened", bg: "rgb(18 194 164 / .16)", fg: "#0c8f78" },
  { n: "Tomas Weiss", i: "TW", c: "#ff6a5c", s: "2.8%", t: "Waiting", bg: "rgb(255 176 32 / .2)", fg: "#b26d00" },
  { n: "Ines Duarte", i: "ID", c: "#e63e8f", s: "1.9%", t: "Replied", bg: "rgb(106 76 255 / .14)", fg: "#5a3df0" },
  { n: "Kofi Mensah", i: "KM", c: "#6a4cff", s: "1.4%", t: "Waiting", bg: "rgb(255 176 32 / .2)", fg: "#b26d00" },
]

function spark(points: number[], w = 120, h = 34) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const xs = w / (points.length - 1)
  const ys = (v: number) => h - 3 - ((v - min) / (max - min || 1)) * (h - 8)
  const line = points.map((v, i) => `${i ? "L" : "M"}${(i * xs).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ")
  return { line, area: `${line} L${w} ${h} L0 ${h} Z` }
}

function Kpi({ label, value, delta, color, data, id }: { label: string; value: string; delta: string; color: string; data: number[]; id: string }) {
  const s = spark(data)
  return (
    <div className="ipb-pg-kpi">
      <span>{label}</span>
      <b>
        {value} <em style={{ color }}>{delta}</em>
      </b>
      <svg viewBox="0 0 120 34" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".38" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={s.area} fill={`url(#${id})`} />
        <path d={s.line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

/** The busy product page the demo pebble floats over. Invented content, no logos. */
export function PebbleScene() {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <div className="ipb-pg" aria-hidden="true">
      <aside className="ipb-pg-side">
        <div className="ipb-pg-logo">
          <i /> Harbor &amp; Finch
        </div>
        {NAV.map((n) => (
          <div key={n.l} className="ipb-pg-nav" data-on={n.on ? "" : undefined}>
            <i style={{ background: n.c }} />
            {n.l}
            {n.n ? <b>{n.n}</b> : null}
          </div>
        ))}
        <div className="ipb-pg-plan">
          <strong>Series A runway</strong>
          26 months at the current burn
          <span />
        </div>
      </aside>
      <div className="ipb-pg-main">
        <div className="ipb-pg-top">
          <h3>Q3 investor update</h3>
          <div className="ipb-pg-search">Search investors</div>
          <div className="ipb-pg-avs">
            {["#ff6a5c", "#ffb020", "#12c2a4", "#6a4cff"].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </div>
        </div>
        <section className="ipb-pg-hero">
          <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax slice">
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M0 ${150 - i * 14} C 90 ${110 - i * 12}, 160 ${170 - i * 14}, 400 ${60 - i * 8}`} fill="none" stroke="#fff" strokeOpacity={0.12 + (i % 3) * 0.1} strokeWidth="1.5" />
            ))}
            <circle cx="320" cy="60" r="38" fill="#ffd56a" opacity=".85" />
            <circle cx="320" cy="60" r="62" fill="none" stroke="#fff" strokeOpacity=".35" strokeDasharray="2 6" strokeWidth="2" />
          </svg>
          <h2>Revenue grew 18% this quarter</h2>
          <p>Harbor &amp; Finch closed Q3 at $4.82M, ahead of plan in every region.</p>
          <div className="ipb-pg-tags">
            <span>14 investors</span>
            <span>Draft 3</span>
            <span>Due Friday</span>
          </div>
        </section>
        <div className="ipb-pg-kpis">
          <Kpi id={`${uid}a`} label="Revenue" value="$4.82M" delta="+18%" color="#12c2a4" data={[3, 4, 3.6, 5, 4.8, 6.2, 6, 7.4, 8]} />
          <Kpi id={`${uid}b`} label="Net retention" value="112%" delta="+4" color="#ff8a3d" data={[5, 4.5, 6, 5.5, 7, 6.6, 8, 7.4, 9]} />
          <Kpi id={`${uid}c`} label="Runway" value="26 mo" delta="+3" color="#6a4cff" data={[6, 6.4, 5.8, 6.8, 7.2, 7, 8.2, 8.6, 9.4]} />
        </div>
        <section className="ipb-pg-card ipb-pg-chart">
          <header>
            Weekly revenue <span>Jul to Sep, in $k</span>
          </header>
          <div className="ipb-pg-bars">
            {BARS.map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} data-hot={i > 8 ? "" : undefined} data-warm={i === 5 || i === 6 ? "" : undefined} />
            ))}
          </div>
          <div className="ipb-pg-axis">
            {BARS.map((_, i) => (
              <span key={i}>W{i + 27}</span>
            ))}
          </div>
        </section>
        <section className="ipb-pg-card">
          <div className="ipb-pg-chart">
            <header>
              Investors <span>4 of 14</span>
            </header>
          </div>
          <div className="ipb-pg-rows">
            {ROWS.map((r) => (
              <div key={r.n} className="ipb-pg-row">
                <i style={{ background: r.c }}>{r.i}</i>
                {r.n}
                <span>{r.s}</span>
                <u style={{ background: r.bg, color: r.fg }}>{r.t}</u>
              </div>
            ))}
          </div>
        </section>
        <aside className="ipb-pg-card ipb-pg-feed">
          <svg className="ipb-pg-map" viewBox="0 0 280 118" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#12c2a4" />
                <stop offset=".5" stopColor="#2aa9ff" />
                <stop offset="1" stopColor="#6a4cff" />
              </linearGradient>
            </defs>
            <rect width="280" height="118" rx="12" fill="var(--ipb-pg-map)" />
            {MAP_DOTS.map((d, i) => (
              <circle key={i} cx={d[0]} cy={d[1]} r={d[2]} fill={`url(#${uid}m)`} opacity={d[3]} />
            ))}
            {MAP_CITIES.map((c, i) => (
              <g key={i}>
                <circle cx={c[0]} cy={c[1]} r="9" fill={c[2]} opacity=".28" />
                <circle cx={c[0]} cy={c[1]} r="3.4" fill={c[2]} />
              </g>
            ))}
          </svg>
          <h4>Activity</h4>
          {FEED.map((f, i) => (
            <div key={i} className="ipb-pg-ev">
              <i style={{ background: f.c }}>{f.i}</i>
              <div>
                <p>
                  <strong>{f.w}</strong> {f.t}
                </p>
                <small>{f.m}</small>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Refraction (Chromium, Tier 2)                      */
/* -------------------------------------------------------------------------- */

/**
 * Displacement map for a rounded rectangle. A pixel-space signed distance field gives the
 * distance to the rim; the vector points INWARD (an outward one samples outside the box and
 * leaves a bright seam) and its length is strongest at the rim and zero in the middle, so the
 * centre stays flat and text stays readable. R = x, G = y, neutral = 128.
 */
function mapDataUrl(cw: number, ch: number, w: number, h: number, r: number): string {
  if (typeof document === "undefined") return ""
  const canvas = document.createElement("canvas")
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(cw, ch)
  const d = img.data
  const bezel = Math.min(26, (0.66 * Math.min(w, h)) / 2)
  const hx = w / 2 - r
  const hy = h / 2 - r
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4
      let R = 128
      let G = 128
      if (x < w && y < h) {
        const px = x + 0.5 - w / 2
        const py = y + 0.5 - h / 2
        const qx = Math.abs(px) - hx
        const qy = Math.abs(py) - hy
        const ox = Math.max(qx, 0)
        const oy = Math.max(qy, 0)
        const out = Math.hypot(ox, oy)
        const depth = -(out + Math.min(Math.max(qx, qy), 0) - r)
        if (depth > 0 && depth < bezel) {
          const m = Math.pow(1 - depth / bezel, 2) * Math.min(1, depth / 1.5)
          let gx = 0
          let gy = 0
          if (qx > 0 && qy > 0) {
            gx = (Math.sign(px) * qx) / out
            gy = (Math.sign(py) * qy) / out
          } else if (qx > qy) gx = Math.sign(px)
          else gy = Math.sign(py)
          R = Math.round(128 - gx * m * 127)
          G = Math.round(128 - gy * m * 127)
        }
      }
      d[i] = R
      d[i + 1] = G
      d[i + 2] = 128
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL("image/png")
}

const mapCache = new Map<string, string>()
function cachedMap(cw: number, ch: number, w: number, h: number, r: number) {
  const k = `${cw}x${ch}:${w}x${h}x${r}`
  let v = mapCache.get(k)
  if (v === undefined) {
    v = mapDataUrl(cw, ch, w, h, r)
    mapCache.set(k, v)
    if (mapCache.size > 12) mapCache.delete(mapCache.keys().next().value as string)
  }
  return v
}
/** Maps are built on a 4px grid, so dragging a resize handle does not build one per pixel. */
const snap4 = (n: number) => Math.max(4, Math.round(n / 4) * 4)

function scaleFor(w: number, h: number) {
  if (w <= 64) return 46
  if (h <= 64) return 70
  return 54
}

function subscribeMedia(queries: string[]) {
  return (cb: () => void) => {
    const mqs = queries.map((q) => window.matchMedia(q))
    mqs.forEach((m) => m.addEventListener("change", cb))
    return () => mqs.forEach((m) => m.removeEventListener("change", cb))
  }
}

const REFRACT_QUERIES = ["(prefers-reduced-transparency: reduce)", "(prefers-reduced-motion: reduce)", "(prefers-contrast: more)", "(forced-colors: active)"]
const subscribeRefract = subscribeMedia(REFRACT_QUERIES)
/** Chromium only, and only when no preference asks for less. `@supports` is not used: it false-positives in Safari and Firefox. */
function refractSupported() {
  if (typeof window === "undefined") return false
  const nav = navigator as Navigator & { userAgentData?: { brands: { brand: string }[] }; connection?: { saveData?: boolean } }
  if (!nav.userAgentData?.brands?.some((b) => /chromium/i.test(b.brand))) return false
  if (nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 4) return false
  return !REFRACT_QUERIES.some((q) => window.matchMedia(q).matches)
}

const subscribeMotion = subscribeMedia(["(prefers-reduced-motion: reduce)"])
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/** Text that blur-crossfades when it changes. The old text lingers for one beat in an absolutely placed layer. */
function Swap({ text }: { text: string }) {
  const [cur, setCur] = React.useState(text)
  const [prev, setPrev] = React.useState<{ id: number; text: string } | null>(null)
  const [gen, setGen] = React.useState(0)
  if (text !== cur) {
    setPrev({ id: gen, text: cur })
    setCur(text)
    setGen(gen + 1)
  }
  return (
    <span className="ipb-sw">
      <span key={`c${gen}`} className="ipb-sw-cur" data-text={cur}>
        {cur}
      </span>
      {prev ? (
        <span key={`p${prev.id}`} className="ipb-sw-prev" aria-hidden="true" onAnimationEnd={() => setPrev(null)}>
          {prev.text}
        </span>
      ) : null}
    </span>
  )
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

type Sim = { state: PebbleState; step: number; from?: PebbleState; ok?: boolean }

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function AgentPebble({
  agent = "Sage",
  steps = DEFAULT_STEPS,
  state: stateProp,
  step: stepProp,
  approval = DEFAULT_APPROVAL,
  result = DEFAULT_RESULT,
  onApprove,
  onPause,
  onResume,
  onStart,
  onDismiss,
  onStateChange,
  dock: dockProp,
  defaultDock = DEFAULT_DOCK,
  onDockChange,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  autoPlay,
  loop = true,
  stepMs = 1500,
  refraction = true,
  height,
  children,
  className,
  style,
}: AgentPebbleProps) {
  const total = Math.max(1, steps.length)
  const auto = autoPlay ?? stateProp === undefined
  const reduced = React.useSyncExternalStore(subscribeMotion, reducedMotion, () => false)

  /* The built-in loop: idle, working, needs you, working, done. */
  const [sim, setSim] = React.useState<Sim>({ state: "idle", step: 0 })
  /* Reduced motion starts on the "needs you" card, the one frame that shows the consequence and both buttons, until the person acts. */
  const [touched, setTouched] = React.useState(false)
  const still = reduced && !touched
  const state: PebbleState = stateProp ?? (still ? "needs-you" : sim.state)
  const step = Math.min(total - 1, Math.max(0, stepProp ?? (still ? total - 1 : sim.step)))
  const simulating = stateProp === undefined

  const rootRef = React.useRef<HTMLDivElement>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const bodyInRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const filterRef = React.useRef<SVGFilterElement>(null)
  const imgRef = React.useRef<SVGFEImageElement>(null)
  const dispRef = React.useRef<SVGFEDisplacementMapElement>(null)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const fid = `ipb-f-${uid}`
  const bodyId = `ipb-b-${uid}`

  /* Open or closed. The built-in behaviour opens the pebble when it needs you and closes it otherwise. */
  const [openInt, setOpenInt] = React.useState(() => defaultExpanded ?? state === "needs-you")
  const [seenState, setSeenState] = React.useState(state)
  const [dockMsg, setDockMsg] = React.useState("")
  if (seenState !== state) {
    setSeenState(state)
    setDockMsg("")
    if (expandedProp === undefined) setOpenInt(state === "needs-you")
  }
  const open = expandedProp ?? openInt
  const setOpen = (v: boolean) => {
    if (expandedProp === undefined) setOpenInt(v)
    onExpandedChange?.(v)
  }

  const [dockInt, setDockInt] = React.useState<PebbleDock>(defaultDock)
  const dock = dockProp ?? dockInt
  const commitDock = (d: PebbleDock, immediate = false) => {
    const next = { edge: d.edge, at: clamp01(d.at) }
    if (dockProp === undefined) {
      setDockInt(next)
      if (immediate) layoutRef.current(next)
    } else if (immediate) {
      // Controlled: let the parent decide. If it keeps the old dock, glide back to it on the next frame.
      requestAnimationFrame(() => layoutRef.current())
    }
    setDockMsg(`Docked to the ${next.edge} edge`)
    onDockChange?.(next)
  }

  const refractOn = React.useSyncExternalStore(subscribeRefract, refractSupported, () => false) && refraction

  /* Pause the loop while off screen, in a hidden tab, or while the person is reading the open panel. */
  const [visible, setVisible] = React.useState(true)
  const [tabVisible, setTabVisible] = React.useState(true)
  const [engaged, setEngaged] = React.useState(false)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    const onVis = () => setTabVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  // Hover or focus only holds the loop while the panel is open (the person is reading it); a closed pebble keeps moving.
  const running = auto && simulating && visible && tabVisible && !(engaged && open) && !still
  React.useEffect(() => {
    if (!running) return
    let delay: number | null = null
    let next: Sim | null = null
    // Under reduced motion only the moves that follow a person's action keep going; the loop's own restarts stay off.
    if (sim.state === "idle") {
      if (!reduced) {
        delay = 2300
        next = { state: "working", step: 0 }
      }
    } else if (sim.state === "working") {
      if (sim.step < total - 2) {
        delay = stepMs
        next = { state: "working", step: sim.step + 1, ok: sim.ok }
      } else if (sim.step === total - 2 || (total === 1 && !sim.ok)) {
        delay = stepMs
        next = { state: "needs-you", step: total - 1 }
      } else {
        delay = 1500
        next = { state: "done", step: total }
      }
    } else if (sim.state === "needs-you") {
      // Demo only: a real agent waits for the person. The built-in loop answers for them so the film can reach "done".
      if (!reduced) {
        delay = 7000
        next = { state: "working", step: total - 1, ok: true }
      }
    } else if (sim.state === "paused") {
      if (!reduced) {
        delay = 4200
        next = { state: sim.from ?? "working", step: sim.step, ok: sim.ok }
      }
    } else if (sim.state === "done" && loop) {
      if (!reduced) {
        delay = 3800
        next = { state: "idle", step: 0 }
      }
    }
    if (delay === null || !next) return
    const n = next
    const t = window.setTimeout(() => setSim(n), delay)
    return () => window.clearTimeout(t)
  }, [running, sim, total, stepMs, loop, reduced])

  const lastState = React.useRef(state)
  React.useEffect(() => {
    if (lastState.current !== state) {
      lastState.current = state
      onStateChange?.(state)
    }
  }, [state, onStateChange])

  /* The button the person pressed disappears with the panel, so hand focus to the pebble's head first. */
  const headRef = React.useRef<HTMLButtonElement>(null)
  const keepFocus = () => {
    if (bodyRef.current?.contains(document.activeElement)) headRef.current?.focus()
  }
  const approve = () => {
    keepFocus()
    onApprove?.()
    if (simulating) {
      setTouched(true)
      setSim({ state: "working", step: total - 1, ok: true })
    }
  }
  const pause = () => {
    keepFocus()
    onPause?.()
    if (simulating) {
      setTouched(true)
      setSim({ state: "paused", step, from: state === "paused" ? sim.from : state, ok: sim.ok })
    }
  }
  const resume = () => {
    keepFocus()
    onResume?.()
    if (simulating) {
      setTouched(true)
      setSim({ state: sim.from ?? "working", step, ok: sim.ok })
    }
  }
  const start = () => {
    keepFocus()
    onStart?.()
    if (simulating) {
      setTouched(true)
      setSim({ state: "working", step: 0 })
    }
  }
  const dismiss = () => {
    keepFocus()
    onDismiss?.()
    if (simulating) {
      setTouched(true)
      setSim({ state: "idle", step: 0 })
    }
  }

  /* ----- What to say ----- */
  const copy = (() => {
    const n = `Step ${step + 1} of ${total}`
    switch (state) {
      case "working":
        return { title: `${agent} is ${steps[step]?.active ?? "working"}`, meta: n }
      case "needs-you":
        return { title: `${agent} needs you`, meta: `${n} · approval` }
      case "paused":
        return { title: `${agent} is paused`, meta: `Stopped at step ${step + 1} of ${total}` }
      case "done":
        return { title: result.title, meta: result.detail }
      default:
        return { title: `${agent} is idle`, meta: "Ready when you are" }
    }
  })()
  const progress = state === "done" ? 1 : state === "idle" ? 0 : state === "working" ? (step + 0.5) / total : step / total
  const RING = 2 * Math.PI * 18

  /* ----- Layout: size, radius and position are written as CSS variables, so a state change is one write and CSS does the morph ----- */
  const bodyH = React.useRef(0)
  const latest = React.useRef({ state, open, dock })
  const posRef = React.useRef({ x: 0, y: 0, w: IDLE, h: IDLE, sw: 0, sh: 0 })
  const fx = React.useRef({ key: "", scale: 0, raf: 0, timer: 0, timer2: 0, refract: false })

  const animateScale = React.useCallback((to: number, ms: number, done?: () => void) => {
    const f = fx.current
    const disp = dispRef.current
    if (!disp) return
    cancelAnimationFrame(f.raf)
    window.clearTimeout(f.timer)
    const from = f.scale
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(f.raf)
      f.scale = to
      disp.setAttribute("scale", String(to))
      done?.()
    }
    if (ms <= 0 || from === to) return finish()
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      f.scale = from + (to - from) * (1 - Math.pow(1 - p, 3))
      disp.setAttribute("scale", f.scale.toFixed(2))
      if (p < 1) f.raf = requestAnimationFrame(tick)
      else finish()
    }
    f.raf = requestAnimationFrame(tick)
    f.timer = window.setTimeout(finish, ms + 250)
  }, [])

  /** Rebuild the lens for a new size: fade the refraction out, swap the map once it has loaded, fade it back in. */
  const syncMap = React.useCallback(
    (w: number, h: number, r: number) => {
      const f = fx.current
      const img = imgRef.current
      const filt = filterRef.current
      if (!f.refract || !img || !filt) return
      w = snap4(w)
      h = snap4(h)
      const key = `${w}x${h}x${r}`
      if (f.key === key) return
      const first = f.key === ""
      f.key = key
      const cw = 420
      const ch = Math.max(340, h + 40)
      const url = cachedMap(cw, ch, w, h, r)
      const target = scaleFor(w, h)
      const apply = () => {
        if (f.key !== key) return
        img.setAttribute("href", url)
        img.setAttribute("width", String(cw))
        img.setAttribute("height", String(ch))
        filt.setAttribute("width", String(cw))
        filt.setAttribute("height", String(ch))
        window.clearTimeout(f.timer2)
        f.timer2 = window.setTimeout(() => animateScale(target, 520), 60)
      }
      const load = new Image()
      const go = () => animateScale(0, first ? 0 : 140, () => (load.complete ? apply() : (load.onload = apply)))
      load.src = url
      go()
    },
    [animateScale],
  )

  const layout = React.useCallback(
    (dockOverride?: PebbleDock) => {
      const stage = rootRef.current
      const host = hostRef.current
      if (!stage || !host) return
      const { state: st, open: op, dock: dk0 } = latest.current
      const dk = dockOverride ?? dk0
      const sw = stage.clientWidth
      const sh = stage.clientHeight
      const cw = Math.max(120, Math.min(FULL, sw - 2 * M))
      const pill = st === "idle" ? IDLE : st === "paused" ? 256 : st === "done" ? 300 : FULL
      const w = Math.min(op ? FULL : pill, cw)
      const h = op ? Math.min(HEAD + bodyH.current, Math.max(HEAD, sh - 2 * M)) : st === "idle" ? IDLE : HEAD
      const r = op ? 32 : h / 2
      const along = (extent: number, size: number) => M + clamp01(dk.at) * Math.max(0, extent - size - 2 * M)
      let x: number
      let y: number
      if (dk.edge === "left") {
        x = M
        y = along(sh, h)
      } else if (dk.edge === "right") {
        x = sw - M - w
        y = along(sh, h)
      } else if (dk.edge === "top") {
        y = M
        x = along(sw, w)
      } else {
        y = sh - M - h
        x = along(sw, w)
      }
      posRef.current = { x, y, w, h, sw, sh }
      const s = host.style
      s.setProperty("--ipb-w", `${w}px`)
      s.setProperty("--ipb-h", `${h}px`)
      s.setProperty("--ipb-r", `${r}px`)
      s.setProperty("--ipb-x", `${Math.round(x)}px`)
      s.setProperty("--ipb-y", `${Math.round(y)}px`)
      s.setProperty("--ipb-cw", `${cw}px`)
      syncMap(Math.round(w), Math.round(h), r)
    },
    [syncMap],
  )
  const layoutRef = React.useRef(layout)
  const dockEdge = dock.edge
  const dockAt = dock.at

  const view = state === "needs-you" ? "approve" : state === "idle" ? "idle" : "steps"
  React.useLayoutEffect(() => {
    layoutRef.current = layout
    latest.current = { state, open, dock: { edge: dockEdge, at: dockAt } }
    fx.current.refract = refractOn
    if (!refractOn) fx.current.key = ""
    const body = bodyInRef.current
    if (body) bodyH.current = body.offsetHeight
    layout()
  }, [layout, state, open, dockEdge, dockAt, refractOn, view, step, total])

  React.useEffect(() => {
    const stage = rootRef.current
    const body = bodyInRef.current
    const host = hostRef.current
    if (!stage || !host) return
    const ro = new ResizeObserver(() => {
      if (body) bodyH.current = body.offsetHeight
      layoutRef.current()
    })
    ro.observe(stage)
    if (body) ro.observe(body)
    const ready = window.setTimeout(() => host.setAttribute("data-ready", ""), 80)
    const f = fx.current
    return () => {
      ro.disconnect()
      window.clearTimeout(ready)
      cancelAnimationFrame(f.raf)
      window.clearTimeout(f.timer)
      window.clearTimeout(f.timer2)
    }
  }, [])

  /* ----- Drag to dock ----- */
  const drag = React.useRef<{ id: number; sx: number; sy: number; x0: number; y0: number; moved: boolean } | null>(null)
  const swallow = React.useRef(false)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("[data-nodrag]")) return
    const p = posRef.current
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: p.x, y0: p.y, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const host = hostRef.current
    if (!d || !host || e.pointerId !== d.id) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 6) return
      d.moved = true
      host.setPointerCapture(e.pointerId)
      host.setAttribute("data-dragging", "")
    }
    const p = posRef.current
    const x = Math.min(Math.max(0, d.x0 + dx), Math.max(0, p.sw - p.w))
    const y = Math.min(Math.max(0, d.y0 + dy), Math.max(0, p.sh - p.h))
    host.style.setProperty("--ipb-x", `${Math.round(x)}px`)
    host.style.setProperty("--ipb-y", `${Math.round(y)}px`)
    p.x = x
    p.y = y
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const host = hostRef.current
    drag.current = null
    if (!d || !host || e.pointerId !== d.id || !d.moved) return
    swallow.current = true
    window.setTimeout(() => (swallow.current = false), 0)
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId)
    host.removeAttribute("data-dragging")
    const p = posRef.current
    const dist: [PebbleEdge, number][] = [
      ["left", p.x],
      ["right", p.sw - (p.x + p.w)],
      ["top", p.y],
      ["bottom", p.sh - (p.y + p.h)],
    ]
    const edge = dist.reduce((a, b) => (b[1] < a[1] ? b : a))[0]
    const vertical = edge === "left" || edge === "right"
    const free = vertical ? p.sh - p.h - 2 * M : p.sw - p.w - 2 * M
    const at = free > 0 ? ((vertical ? p.y : p.x) - M) / free : 0.5
    commitDock({ edge, at }, true)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation()
      keepFocus()
      setOpen(false)
      return
    }
    const dir: PebbleEdge | undefined = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "top", ArrowDown: "bottom" } as Record<string, PebbleEdge>)[e.key]
    if (!dir || (e.target as Element).closest("[data-nodrag]")) return
    e.preventDefault()
    const sideways = dock.edge === "left" || dock.edge === "right"
    const dirSideways = dir === "left" || dir === "right"
    if (sideways === dirSideways) commitDock({ edge: dir, at: dock.at })
    else {
      const forward = dir === "right" || dir === "bottom"
      // Already at the end of this edge: keep going and turn the corner onto the next edge.
      if ((forward && dock.at >= 1) || (!forward && dock.at <= 0)) commitDock({ edge: dir, at: dock.edge === "left" || dock.edge === "top" ? 0 : 1 })
      else commitDock({ edge: dock.edge, at: dock.at + (forward ? 0.2 : -0.2) })
    }
  }

  const label = `${copy.title}, ${copy.meta}`
  const alert = state === "needs-you"
  const spoken = alert
    ? `${agent} needs you: ${approval.title} ${approval.consequence}`
    : dockMsg ||
      (state === "working"
        ? `${agent} is working on a run`
        : state === "paused"
          ? `${agent} is paused at step ${step + 1} of ${total}`
          : state === "done"
            ? `${result.title}. ${result.detail}`
            : `${agent} is idle`)

  return (
    <div
      ref={rootRef}
      className={["ipb", className].filter(Boolean).join(" ")}
      data-refract={refractOn ? "on" : "off"}
      data-open={open && state === "needs-you" ? "" : undefined}
      style={{ ...(height ? ({ "--ipb-stage-h": `${height}px` } as React.CSSProperties) : null), ...style }}
    >
      <style href="agent-pebble" precedence="default">
        {CSS}
      </style>

      {/* The refraction filter. Its map is rebuilt in JS when the pebble's size changes. */}
      <svg className="ipb-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter ref={filterRef} id={fid} x="0" y="0" width="420" height="340" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage ref={imgRef} x="0" y="0" width="420" height="340" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="ipb-scene">{children ?? <PebbleScene />}</div>
      <div className="ipb-scrim" aria-hidden="true" />

      <div
        ref={hostRef}
        className="ipb-pebble"
        role="group"
        aria-label={`${agent}, background agent`}
        data-state={state}
        data-open={open ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={() => setEngaged(false)}
        onFocus={(e) => setEngaged((v) => v || e.target.matches(":focus-visible"))}
        onBlur={() => setEngaged(false)}
        onKeyDown={onKeyDown}
      >
        <div
          className="ipb-bd"
          style={refractOn ? { backdropFilter: `url(#${fid}) blur(10px) saturate(1.35) brightness(1.04)` } : undefined}
        />
        <div className="ipb-tint" />
        <div className="ipb-sheen" />
        <div className="ipb-rim" />
        <div className="ipb-sring" />

        <div className="ipb-content">
          <button
            type="button"
            className="ipb-head"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={label}
            aria-describedby={`${bodyId}-hint`}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            ref={headRef}
            onClick={() => {
              if (swallow.current) return
              setOpen(!open)
            }}
          >
            <span className="ipb-av" aria-hidden="true">
              <svg className="ipb-ring" viewBox="0 0 40 40">
                <circle className="ipb-trk" cx="20" cy="20" r="18" />
                <circle className="ipb-arc" cx="20" cy="20" r="18" strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)} />
              </svg>
              <span className="ipb-disc">{state === "done" ? <Check key="ok" /> : <span key="ltr">{agent.slice(0, 1).toUpperCase()}</span>}</span>
              <i className="ipb-dot" />
            </span>
            <span className="ipb-txt" aria-hidden="true">
              <span className="ipb-ti" data-shimmer={state === "working" ? "" : undefined}>
                <Swap text={copy.title} />
              </span>
              <span className="ipb-me">
                <Swap text={copy.meta} />
              </span>
            </span>
          </button>

          <div className="ipb-body" id={bodyId} ref={bodyRef} inert={!open} aria-hidden={!open}>
            <div className="ipb-bodyin" ref={bodyInRef}>
              <div className="ipb-view" key={view}>
                {view === "approve" ? (
                  <>
                    <p className="ipb-q" id={`${bodyId}-q`}>
                      {approval.title}
                    </p>
                    <p className="ipb-cons" id={`${bodyId}-c`}>
                      {approval.consequence}
                    </p>
                    {approval.detail ? (
                      <span className="ipb-chip">
                        <FileText aria-hidden="true" /> {approval.detail}
                      </span>
                    ) : null}
                    <div className="ipb-actions" data-nodrag="">
                      <button type="button" className="ipb-btn" data-kind="primary" onClick={approve} aria-describedby={`${bodyId}-q ${bodyId}-c`}>
                        <Check aria-hidden="true" /> {approval.approveLabel ?? "Approve"}
                      </button>
                      <button type="button" className="ipb-btn" data-kind="ghost" onClick={pause}>
                        <Pause aria-hidden="true" /> {approval.pauseLabel ?? "Pause"}
                      </button>
                    </div>
                  </>
                ) : view === "idle" ? (
                  <>
                    <p className="ipb-idle-p">Nothing is running. {agent} will tell you here when a run starts or needs a decision.</p>
                    <div className="ipb-actions" data-nodrag="">
                      <button type="button" className="ipb-btn" data-kind="primary" onClick={start}>
                        <Play aria-hidden="true" /> Start a run
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ol className="ipb-steps">
                      {steps.map((s, i) => {
                        const st = state === "done" || i < step ? "done" : i === step ? (state === "paused" ? "pause" : "run") : "next"
                        return (
                          <li key={`${i}-${s.label}`} className="ipb-step" data-s={st}>
                            <span className="ipb-step-ic">{st === "done" ? <Check aria-hidden="true" /> : <i />}</span>
                            <span>{s.label}</span>
                            <span className="ipb-step-w">{st === "done" ? "Done" : st === "run" ? "Running" : st === "pause" ? "Paused" : "Queued"}</span>
                          </li>
                        )
                      })}
                    </ol>
                    <div className="ipb-foot">
                      <span data-nodrag="">
                        {state === "paused" ? (
                          <button type="button" className="ipb-btn" data-kind="primary" onClick={resume}>
                            <Play aria-hidden="true" /> Resume
                          </button>
                        ) : state === "done" ? (
                          <button type="button" className="ipb-btn" data-kind="ghost" onClick={dismiss}>
                            Dismiss
                          </button>
                        ) : (
                          <button type="button" className="ipb-btn" data-kind="ghost" onClick={pause}>
                            <Pause aria-hidden="true" /> Pause
                          </button>
                        )}
                      </span>
                      <span className="ipb-hint">Drag or use arrow keys to dock</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <span className="ipb-chev" aria-hidden="true">
          <ChevronDown />
        </span>
      </div>

      <div id={`${bodyId}-hint`} className="ipb-sr">
        Use the arrow keys to move the pebble to another edge.
      </div>
      <div className="ipb-sr" role="status" aria-live="polite">
        {alert ? "" : spoken}
      </div>
      <div className="ipb-sr" role="alert">
        {alert ? spoken : ""}
      </div>
    </div>
  )
}

export default AgentPebble
