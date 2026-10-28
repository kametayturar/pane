"use client"

import * as React from "react"
import { Check, ChevronDown, Clock3, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type BeadStep = {
  id: string
  /** What the step does, in a few words. */
  label: string
  /** Shown beside a finished step ("Atlas, 09:02"). Defaults to "Done". */
  meta?: string
  /** Set when a person has to act first. These are the words shown next to the amber bead: "Needs your signature". */
  blocked?: string
  /** Label of the button that clears a blocked step and slides its bead across. */
  unblock?: string
}

export type BeadStepState = "done" | "active" | "blocked" | "pending"

export type BeadStepperProps = {
  /** The steps, in order. Beads slide across the rod one after another. Up to 8 steps fit a 360px phone. */
  steps?: BeadStep[]
  /** Heading of the card. */
  title?: string
  /** Line under the heading (the company or project). */
  subtitle?: string
  /** Who works through the steps. Used in "Atlas is working". */
  agent?: string
  /** Number of finished steps (controlled). */
  completed?: number
  /** Number of finished steps at the start (uncontrolled). */
  defaultCompleted?: number
  /** Open the full step list under the rod at the start. It is folded away by default. */
  defaultOpen?: boolean
  /** Called with the new number of finished steps after every slide. */
  onCompletedChange?: (completed: number) => void
  /** Called when a person clears a blocked step with its button. */
  onResolve?: (step: BeadStep) => void
  /** The agent finishes one open step every `interval` ms and waits at a blocked one. */
  autoPlay?: boolean
  /** Pause between two automatic steps, in ms. */
  interval?: number
  /** What happens when the run is done, in plain words ("Sends the welcome pack to 14 vendors at 09:00"). */
  consequence?: string
  /** Same line once every step is done. */
  doneConsequence?: string
  className?: string
}

export const DEFAULT_STEPS: BeadStep[] = [
  { id: "record", label: "Create the vendor record", meta: "Atlas, 09:02" },
  { id: "tax", label: "Check the tax forms", meta: "Sage, 09:04" },
  { id: "sanctions", label: "Run the sanctions screen", meta: "Atlas, 09:05" },
  { id: "sign", label: "Countersign the master agreement", blocked: "Needs your signature", unblock: "Sign agreement", meta: "You, 09:11" },
  { id: "terms", label: "Set up net-30 payment terms", meta: "Atlas, 09:12" },
  { id: "welcome", label: "Send the welcome pack", meta: "Quill, 09:13" },
]

const BEAD_GAP = 6

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ibs {
  --ibs-ink: #000;
  --ibs-surface: #fff;
  --ibs-accent: #0060e2;
  --ibs-amber: #f5a524;
  --ibs-amber-ink: #8a5300;
  --ibs-green: #178a4a;
  --ibs-on: #fff;
  --ibs-on-green: #fff;
  --ibs-t1: color-mix(in oklab, var(--ibs-ink) 88%, transparent);
  --ibs-t2: color-mix(in oklab, var(--ibs-ink) 61%, transparent);
  --ibs-t3: color-mix(in oklab, var(--ibs-ink) 45%, transparent);
  --ibs-t4: color-mix(in oklab, var(--ibs-ink) 27%, transparent);
  --ibs-fill: color-mix(in oklab, var(--ibs-ink) 6%, transparent);
  --ibs-line: color-mix(in oklab, var(--ibs-ink) 7%, transparent);
  --ibs-ring: color-mix(in oklab, var(--ibs-ink) 22%, transparent);
  --ibs-wash: color-mix(in oklab, var(--ibs-ink) 4%, transparent);
  --ibs-hi: rgb(255 255 255 / .95);
  --ibs-hl: .5;
  --ibs-pend: var(--ibs-surface);
  --ibs-cast: rgb(0 0 0 / .3);
  --ibs-glint: rgb(255 255 255 / .82);
  --ibs-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ibs-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ibs-ease: cubic-bezier(.22, 1, .36, 1);
  --ibs-slide: cubic-bezier(.3, .62, .1, 1);
  container: ibs / inline-size;
  position: relative;
  display: flex; flex-direction: column;
  width: 100%;
  max-width: 540px;
  padding: 20px;
  border-radius: 20px;
  background: var(--ibs-surface);
  box-shadow: var(--ibs-shadow);
  color: var(--ibs-t1);
  font-family: var(--ibs-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  animation: ibs-in .52s var(--ibs-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .ibs {
  --ibs-ink: #fff;
  --ibs-surface: #1c1c1e;
  --ibs-accent: #4d8dff;
  --ibs-amber: #ffb340;
  --ibs-amber-ink: #ffc266;
  --ibs-green: #3ecf8e;
  --ibs-on: #101012;
  --ibs-on-green: #101012;
  --ibs-t1: color-mix(in oklab, var(--ibs-ink) 90%, transparent);
  --ibs-t2: color-mix(in oklab, var(--ibs-ink) 62%, transparent);
  --ibs-t3: color-mix(in oklab, var(--ibs-ink) 46%, transparent);
  --ibs-t4: color-mix(in oklab, var(--ibs-ink) 28%, transparent);
  --ibs-fill: color-mix(in oklab, var(--ibs-ink) 8%, transparent);
  --ibs-line: color-mix(in oklab, var(--ibs-ink) 9%, transparent);
  --ibs-ring: color-mix(in oklab, var(--ibs-ink) 26%, transparent);
  --ibs-wash: color-mix(in oklab, var(--ibs-ink) 6%, transparent);
  --ibs-hi: rgb(255 255 255 / .1);
  --ibs-hl: .38;
  --ibs-pend: color-mix(in oklab, var(--ibs-ink) 15%, var(--ibs-surface));
  --ibs-cast: rgb(0 0 0 / .6);
  --ibs-glint: rgb(255 255 255 / .55);
  --ibs-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ibs-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
/* Text on the accent follows the accent's own lightness, so Classic, Mono and Glass all stay readable. */
@supports (color: oklch(from red l c h)) {
  .ibs, :is(.dark, [data-theme="dark"]) .ibs {
    --ibs-on: oklch(from var(--ibs-accent) calc((0.64 - l) * 1000) 0 0);
    --ibs-on-green: oklch(from var(--ibs-green) calc((0.64 - l) * 1000) 0 0);
  }
}
.ibs *, .ibs *::before, .ibs *::after { box-sizing: border-box }
:where(.ibs) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.ibs) h3, :where(.ibs) p, :where(.ibs) ol { margin: 0; padding: 0 }
.ibs :focus-visible { outline: 2px solid color-mix(in oklab, var(--ibs-accent) 60%, transparent); outline-offset: 2px }
.ibs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Header: who, what, and the running count */
.ibs-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px }
.ibs-tile {
  display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 11px;
  background: var(--ibs-fill); color: var(--ibs-t1);
}
.ibs-tile svg { width: 21px; height: 21px; display: block }
.ibs-titles { min-width: 0; flex: 1 }
.ibs-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 17px; font-weight: 600; line-height: 22px; letter-spacing: -.01em; color: var(--ibs-ink) }
.ibs-subtitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; line-height: 18px; color: var(--ibs-t2) }
.ibs-count { flex: none; display: flex; align-items: baseline; gap: 5px; font-variant-numeric: tabular-nums }
.ibs-count-n { display: block; overflow: hidden; font-size: 32px; font-weight: 600; line-height: 36px; letter-spacing: -.02em; color: var(--ibs-ink) }
.ibs-digit { display: inline-block; animation: ibs-roll .5s var(--ibs-ease) backwards }
.ibs[data-all] .ibs-digit { color: var(--ibs-green); animation: ibs-roll .5s var(--ibs-ease) backwards, ibs-pop .6s var(--ibs-ease) .5s backwards }
.ibs-count-of { font-size: 13px; line-height: 20px; color: var(--ibs-t2); white-space: nowrap }

/* The abacus. Every position is calc() on the rod's own width, so nothing is measured in JS. */
.ibs-frame {
  --ibs-pitch: clamp(34px, calc((100cqw - 48px) / (var(--ibs-n) + .5)), 62px);
  --ibs-bead: calc(var(--ibs-pitch) - ${BEAD_GAP}px);
  --ibs-top: 36px;
  --ibs-cy: calc(var(--ibs-top) + 28px);
  position: relative; display: flex; align-items: stretch; gap: 10px;
  padding: 10px 10px; border-radius: 16px;
  background: var(--ibs-fill);
  box-shadow: inset 0 0 0 .5px var(--ibs-line), inset 0 1px 3px rgb(0 0 0 / .05);
}
.ibs-post {
  flex: none; width: 8px; border-radius: 4px;
  background: linear-gradient(90deg, color-mix(in oklab, var(--ibs-ink) 22%, transparent), color-mix(in oklab, var(--ibs-ink) 12%, transparent));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .35), inset 0 -1px 0 rgb(0 0 0 / .08);
}
.ibs-rod { position: relative; flex: 1; min-width: 0; height: calc(var(--ibs-top) + 56px + 20px) }
.ibs-wire {
  position: absolute; left: 0; right: 0; top: var(--ibs-cy); height: 6px; margin-top: -3px; border-radius: 3px;
  background: color-mix(in oklab, var(--ibs-ink) 12%, transparent);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / .22), 0 1px 0 var(--ibs-hi);
}
.ibs-wire-fill {
  position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--ibs-accent);
  width: max(0px, calc(var(--ibs-d) * var(--ibs-pitch) - var(--ibs-pitch) + var(--ibs-bead) / 2));
  transition: width .56s var(--ibs-slide), background-color .4s var(--ibs-ease);
}
.ibs[data-all] .ibs-wire-fill { width: 100%; background: var(--ibs-green); transition-delay: .1s, .5s }
.ibs[data-reset] .ibs-wire-fill { transition-delay: .3s }
.ibs-ticks { position: absolute; left: 0; right: 0; bottom: 0; height: 9px; pointer-events: none }
.ibs-ticks::before, .ibs-ticks::after {
  content: ""; position: absolute; top: 0; bottom: 0; background-repeat: repeat-x;
  background-image: linear-gradient(90deg, var(--ibs-t4) 0 1.5px, transparent 1.5px);
  background-size: var(--ibs-pitch) 100%;
}
.ibs-ticks::before { left: 0; width: calc(var(--ibs-nl) * var(--ibs-pitch)); background-position: calc(var(--ibs-bead) / 2 - .75px) 0 }
.ibs-ticks::after { right: 0; width: calc(var(--ibs-nr) * var(--ibs-pitch)); background-image: linear-gradient(90deg, transparent calc(100% - 1.5px), var(--ibs-t4) 0); background-position: right calc(var(--ibs-bead) / 2 - .75px) top }
.ibs-ghost {
  position: absolute; top: var(--ibs-cy); left: calc(var(--ibs-d) * var(--ibs-pitch));
  width: var(--ibs-bead); height: var(--ibs-bead); margin-top: calc(var(--ibs-bead) / -2);
  border-radius: 50%; border: 1.5px dashed var(--ibs-t3);
  transition: left .56s var(--ibs-slide), opacity .3s var(--ibs-ease), border-color .3s var(--ibs-ease), background-color .3s var(--ibs-ease);
}
.ibs[data-blocked] .ibs-ghost { border-color: var(--ibs-amber); background: color-mix(in oklab, var(--ibs-amber) 14%, transparent) }
.ibs[data-all] .ibs-ghost { opacity: 0 }
.ibs[data-reset] .ibs-ghost { transition-delay: .3s }

/* A bead: .ibs-pos slides along the rod, the button inside holds the look */
.ibs-pos {
  position: absolute; top: var(--ibs-cy); z-index: 1;
  width: var(--ibs-bead); height: var(--ibs-bead); margin-top: calc(var(--ibs-bead) / -2);
  transform: translateX(var(--dx, 0px));
  transition: left .56s var(--ibs-slide), transform .56s var(--ibs-slide);
  animation: ibs-bead-in .56s var(--ibs-ease) calc(var(--k) * 40ms + 140ms) backwards;
}
.ibs-pos::after {
  content: ""; position: absolute; z-index: -1; left: 8%; right: 8%; bottom: -4px; height: 9px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, var(--ibs-cast), transparent); filter: blur(1.5px);
}
.ibs-pos[data-s="done"] { left: calc(var(--i) * var(--ibs-pitch)); z-index: 2 }
.ibs[data-all] .ibs-pos[data-s="done"] { left: calc(var(--i) * var(--ibs-pitch) + (100% - var(--ibs-n) * var(--ibs-pitch) + ${BEAD_GAP}px) / 2) }
.ibs-pos[data-s="active"], .ibs-pos[data-s="pending"] { left: calc(100% - var(--ibs-bead) - var(--k) * var(--ibs-pitch)) }
.ibs-pos[data-s="blocked"] {
  left: calc(var(--i) * var(--ibs-pitch) + (100% - var(--ibs-bead) - (var(--k) + var(--i)) * var(--ibs-pitch)) * .5);
  z-index: 3;
}
.ibs-pos[data-drag] { transition: left .56s var(--ibs-slide); z-index: 4 }
.ibs[data-reset] .ibs-pos { transition-delay: calc(var(--k) * 45ms) }

.ibs-bead {
  position: relative; display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%;
  font-size: clamp(12px, calc(var(--ibs-bead) * .32), 18px); font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: 0;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
  color: var(--ibs-t2);
  background-color: var(--ibs-pend);
  background-image:
    radial-gradient(ellipse 58% 34% at 38% 19%, rgb(255 255 255 / var(--ibs-hl)), transparent),
    radial-gradient(circle at 50% 118%, rgb(0 0 0 / .16), transparent 62%);
  box-shadow: 0 0 0 1px var(--ibs-ring), inset 0 -2px 3px rgb(0 0 0 / .06), 0 2px 3px rgb(0 0 0 / .12);
  transition: background-color .3s var(--ibs-ease), box-shadow .3s var(--ibs-ease), color .3s var(--ibs-ease), transform .2s var(--ibs-ease);
}
.ibs-ring { position: absolute; inset: -2px; border-radius: 50%; border: 2px solid color-mix(in oklab, var(--ibs-accent) 70%, transparent); opacity: 0; pointer-events: none }
.ibs-gl {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0;
  background: linear-gradient(100deg, transparent 36%, var(--ibs-glint) 50%, transparent 64%) 100% 0 / 300% 100% no-repeat;
}
/* A 44px target around small active beads */
.ibs-pos[data-s="active"] .ibs-bead::before { content: ""; position: absolute; inset: min(0px, calc((var(--ibs-bead) - 44px) / 2)); border-radius: 50% }
.ibs-bead[data-hot="true"] { transform: translateY(-1.5px) }
.ibs-pos[data-drag] .ibs-bead { cursor: grabbing; transform: scale(1.06) }
.ibs-pos[data-s="active"] .ibs-bead { cursor: grab }

.ibs-pos[data-s="done"] .ibs-bead {
  color: var(--ibs-on);
  background-color: var(--ibs-accent);
  box-shadow: inset 0 -3px 4px rgb(0 0 0 / .24), inset 0 1px 1px rgb(255 255 255 / .5), 0 2px 3px rgb(0 0 0 / .28);
}
.ibs[data-all] .ibs-pos[data-s="done"] .ibs-bead {
  color: var(--ibs-on-green); background-color: var(--ibs-green);
  transition-delay: calc(var(--i) * 60ms + .5s);
}
.ibs-pos[data-s="active"] .ibs-bead {
  color: var(--ibs-t1);
  background-color: color-mix(in oklab, var(--ibs-accent) 14%, var(--ibs-surface));
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ibs-accent) 78%, transparent), 0 0 0 6px color-mix(in oklab, var(--ibs-accent) 14%, transparent), 0 2px 3px rgb(0 0 0 / .12);
}
.ibs-pos[data-s="blocked"] .ibs-bead {
  color: #4a2c00;
  background-color: var(--ibs-amber);
  box-shadow: 0 0 0 6px color-mix(in oklab, var(--ibs-amber) 24%, transparent), inset 0 -3px 4px rgb(0 0 0 / .18), inset 0 1px 1px rgb(255 255 255 / .55), 0 2px 3px rgb(0 0 0 / .26);
}
.ibs-pos[data-s="active"][data-run] .ibs-gl { opacity: 1; animation: ibs-sweep 1.6s linear infinite }
.ibs-pos[data-s="done"][data-knock] .ibs-bead { animation: ibs-knock .36s var(--ibs-ease) .38s backwards }
.ibs-pos[data-s="done"][data-knock] .ibs-ring { animation: ibs-tick .62s var(--ibs-ease) .38s backwards }
.ibs-pos[data-s="blocked"][data-jam="a"] .ibs-bead { animation: ibs-jam-a .42s var(--ibs-ease) }
.ibs-pos[data-s="blocked"][data-jam="b"] .ibs-bead { animation: ibs-jam-b .42s var(--ibs-ease) }
.ibs[data-all] .ibs-pos[data-s="done"] .ibs-gl { animation: ibs-glint .9s ease-out calc(var(--i) * 80ms + .75s) backwards }

/* Words on the rod: why the amber bead stopped */
.ibs-pill {
  position: absolute; left: 50%; bottom: calc(100% + 12px); z-index: 1; pointer-events: none;
  display: block; max-width: 220px; height: 24px; padding: 0 10px; border-radius: 999px;
  overflow: visible; white-space: nowrap; font-size: 12px; font-weight: 600; line-height: 24px; color: var(--ibs-amber-ink);
  background: color-mix(in oklab, var(--ibs-amber) 20%, var(--ibs-surface));
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ibs-amber) 60%, transparent), 0 2px 6px -2px rgb(0 0 0 / .18);
  translate: -50% 0;
  animation: ibs-pill .42s var(--ibs-ease) .3s backwards;
  transition: box-shadow .2s var(--ibs-ease), background-color .2s var(--ibs-ease);
}
.ibs-pill::after {
  content: ""; position: absolute; left: 50%; top: 100%; width: 8px; height: 8px; margin: -4px 0 0 -4px; rotate: 45deg;
  background: color-mix(in oklab, var(--ibs-amber) 20%, var(--ibs-surface));
  box-shadow: 1px 1px 0 color-mix(in oklab, var(--ibs-amber) 60%, transparent);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}
.ibs[data-nudge] .ibs-pill::after { background: color-mix(in oklab, var(--ibs-amber) 42%, var(--ibs-surface)) }
.ibs[data-nudge] .ibs-pill { background: color-mix(in oklab, var(--ibs-amber) 42%, var(--ibs-surface)); box-shadow: inset 0 0 0 2px var(--ibs-amber), 0 2px 6px -2px rgb(0 0 0 / .18) }

/* Status line and action */
.ibs-status { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; margin-top: 16px }
.ibs-words { min-width: 0 }
.ibs-state { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; line-height: 22px; color: var(--ibs-ink) }
.ibs-state-text { position: relative; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: ibs-swap .24s var(--ibs-ease) backwards }
.ibs-state[data-tone="blocked"] .ibs-state-text { color: var(--ibs-amber-ink) }
.ibs-state[data-tone="done"] .ibs-state-text { color: var(--ibs-green) }
.ibs-state[data-tone="run"] .ibs-state-text::after {
  content: attr(data-text) / ""; position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--ibs-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: ibs-sweep 1.6s linear infinite;
}
.ibs-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--ibs-t4) }
.ibs-state[data-tone="run"] .ibs-dot { background: var(--ibs-accent); animation: ibs-pulse 1.6s var(--ibs-ease) infinite }
.ibs-state[data-tone="blocked"] .ibs-dot { background: var(--ibs-amber) }
.ibs-state[data-tone="done"] .ibs-dot { background: var(--ibs-green) }

.ibs-act {
  flex: none; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border-radius: 10px;
  font-size: 13.5px; font-weight: 600; white-space: nowrap;
  transition: transform .16s var(--ibs-ease), background-color .2s var(--ibs-ease), box-shadow .2s var(--ibs-ease);
  animation: ibs-fade .24s var(--ibs-ease) backwards;
}
.ibs-act:active { transform: scale(.97) }
.ibs-act[data-kind="primary"] { background: var(--ibs-accent); color: var(--ibs-on); box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), 0 1px 2px rgb(0 0 0 / .18) }
.ibs-act[data-kind="primary"]:hover { background: color-mix(in oklab, var(--ibs-accent) 90%, #000) }
.ibs-act[data-kind="quiet"] { background: var(--ibs-fill); color: var(--ibs-t1) }
.ibs-act[data-kind="quiet"]:hover { background: color-mix(in oklab, var(--ibs-ink) 10%, transparent) }
.ibs[data-nudge] .ibs-act { box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), 0 0 0 3px color-mix(in oklab, var(--ibs-accent) 35%, transparent) }
.ibs-act svg { width: 14px; height: 14px; display: block }

/* Now and next: the compact version of the list */
.ibs-flow { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 12px; margin: 12px 0; padding-top: 12px; border-top: .5px solid var(--ibs-ring) }
.ibs-lines { display: grid; align-content: start; gap: 3px; min-width: 0; min-height: 43px; flex: 1 }
.ibs-line { display: flex; align-items: center; gap: 10px; min-width: 0; font-size: 13px; line-height: 20px; color: var(--ibs-t1); animation: ibs-fade .24s var(--ibs-ease) backwards }
.ibs-line[data-dim] { color: var(--ibs-t2) }
.ibs-tag { flex: none; min-width: 36px; font-size: 12px; font-weight: 500; color: var(--ibs-t2) }
.ibs-line-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ibs-more {
  flex: none; display: inline-flex; align-items: center; gap: 4px; height: 28px; margin-right: -6px; padding: 0 8px; border-radius: 8px;
  font-size: 12.5px; font-weight: 500; color: var(--ibs-t2); transition: background-color .15s ease-out, color .15s ease-out;
}
.ibs-more:hover { background: var(--ibs-fill); color: var(--ibs-t1) }
.ibs-more svg { width: 14px; height: 14px; display: block; transition: rotate .3s var(--ibs-ease) }
.ibs-more[aria-expanded="true"] svg { rotate: 180deg }

/* Ledger: the plain list, folded away until asked for */
.ibs-fold { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .4s var(--ibs-ease), visibility 0s .4s }
.ibs-fold[data-open] { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s }
.ibs-fold > div { min-height: 0; overflow: hidden }
.ibs-ledger { list-style: none; display: grid; gap: 1px; margin-top: 8px; padding-top: 8px; border-top: .5px solid var(--ibs-ring) }
.ibs-row {
  display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 10px;
  padding: 5px 8px; border-radius: 8px; transition: background-color .15s ease-out;
}
.ibs-row[data-hot="true"] { background: var(--ibs-wash) }
.ibs-row[data-s="blocked"] { background: color-mix(in oklab, var(--ibs-amber) 12%, transparent) }
.ibs-mark {
  display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
  font-size: 10.5px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums;
  color: var(--ibs-t2); box-shadow: inset 0 0 0 1px var(--ibs-ring);
  transition: background-color .3s var(--ibs-ease), color .3s var(--ibs-ease), box-shadow .3s var(--ibs-ease);
}
.ibs-mark svg { width: 12px; height: 12px; display: block }
.ibs-row[data-s="done"] .ibs-mark { background: var(--ibs-accent); color: var(--ibs-on); box-shadow: none }
.ibs[data-all] .ibs-row[data-s="done"] .ibs-mark { background: var(--ibs-green); color: var(--ibs-on-green) }
.ibs-row[data-s="active"] .ibs-mark { color: var(--ibs-t1); background: color-mix(in oklab, var(--ibs-accent) 13%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ibs-accent) 75%, transparent) }
.ibs-row[data-s="blocked"] .ibs-mark { background: var(--ibs-amber); color: #4a2c00; box-shadow: none }
.ibs-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ibs-t1); transition: color .3s var(--ibs-ease) }
.ibs-row[data-s="done"] .ibs-label { color: color-mix(in oklab, var(--ibs-ink) 70%, transparent) }
.ibs-row[data-s="pending"] .ibs-label { color: color-mix(in oklab, var(--ibs-ink) 52%, transparent) }
.ibs-note { font-size: 12px; line-height: 16px; white-space: nowrap; color: var(--ibs-t2) }
.ibs-row[data-s="blocked"] .ibs-note { color: var(--ibs-amber-ink); font-weight: 600 }

/* Consequence line */
.ibs-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 16px; margin-top: auto; padding: 12px 2px 0; border-top: .5px solid var(--ibs-ring) }
.ibs-conseq { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 13px; line-height: 18px; color: var(--ibs-t1) }
.ibs-conseq svg { flex: none; width: 15px; height: 15px; color: var(--ibs-t3) }
.ibs[data-all] .ibs-conseq svg { color: var(--ibs-green) }
.ibs-conseq span { animation: ibs-fade .3s var(--ibs-ease) backwards }
.ibs-keys { display: flex; align-items: center; gap: 10px; font-size: 11.5px; line-height: 16px; color: var(--ibs-t2); white-space: nowrap }
.ibs-keys kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin-right: 4px; padding: 0 4px; border-radius: 5px;
  font: inherit; font-size: 11px; color: var(--ibs-t2); background: var(--ibs-fill); box-shadow: inset 0 -1px 0 var(--ibs-line);
}

@container ibs (max-width: 460px) {
  .ibs-frame { gap: 6px; padding: 8px }
  .ibs-keys { display: none }
  .ibs-row[data-s="done"] .ibs-note { display: none }
  .ibs-row[data-s="blocked"] { grid-template-columns: 20px minmax(0, 1fr) }
  .ibs-row[data-s="blocked"] .ibs-note { grid-column: 2; margin-top: -2px }
  .ibs-pill { max-width: 190px }
}
@container ibs (max-width: 380px) {
  .ibs-status { flex-wrap: wrap }
  .ibs-act { width: 100%; justify-content: center }
  .ibs-more span { display: none }
}

@keyframes ibs-in { from { opacity: 0; transform: translateY(8px); filter: blur(3px) } }
@keyframes ibs-bead-in { from { opacity: 0; filter: blur(3px) } }
@keyframes ibs-swap { from { opacity: 0; transform: translateY(3px); filter: blur(2px) } }
@keyframes ibs-fade { from { opacity: 0 } }
@keyframes ibs-pill { from { opacity: 0; transform: translateY(4px) } }
@keyframes ibs-roll { from { opacity: 0; transform: translateY(70%) } }
@keyframes ibs-pop { 0% { scale: 1 } 40% { scale: 1.22 } 100% { scale: 1 } }
@keyframes ibs-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes ibs-glint { 0% { opacity: 1; background-position: 100% 0 } 100% { opacity: 1; background-position: 0 0 } }
@keyframes ibs-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--ibs-accent) 35%, transparent) } 60% { box-shadow: 0 0 0 5px transparent } }
@keyframes ibs-knock { 0% { scale: 1 } 35% { scale: .9 1.05 } 70% { scale: 1.04 .98 } 100% { scale: 1 } }
@keyframes ibs-tick { 0% { opacity: 0; scale: .9 } 20% { opacity: 1 } 100% { opacity: 0; scale: 1.8 } }
@keyframes ibs-jam-a { 0%, 100% { translate: 0 } 20% { translate: -4px } 45% { translate: 3px } 70% { translate: -2px } }
@keyframes ibs-jam-b { 0%, 100% { translate: 0 } 20% { translate: -4px } 45% { translate: 3px } 70% { translate: -2px } }

@media (prefers-reduced-motion: reduce) {
  .ibs, .ibs *, .ibs *::before, .ibs *::after { animation: none !important; transition: none !important }
}
@media (forced-colors: active) {
  .ibs-bead { border: 1px solid ButtonText; background: ButtonFace; color: ButtonText; box-shadow: none }
  .ibs-pos[data-s="done"] .ibs-bead { background: Highlight; color: HighlightText; border-color: Highlight }
  .ibs-pos[data-s="active"] .ibs-bead { outline: 2px solid Highlight; outline-offset: 2px }
  .ibs-pos[data-s="blocked"] .ibs-bead { outline: 3px dashed ButtonText; outline-offset: 2px }
  .ibs-wire { background: ButtonText; box-shadow: none }
  .ibs-wire-fill { background: Highlight }
  .ibs-ghost { border-color: ButtonText }
  .ibs-pill { border: 1px solid ButtonText; box-shadow: none; background: Canvas; color: CanvasText }
  .ibs-pill::after { display: none }
  .ibs-post { background: ButtonText; box-shadow: none }
  .ibs-pos::after { display: none }
  .ibs-act { border: 1px solid ButtonText }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function subscribeReduced(cb: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)")
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const reducedSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
function useReducedMotion() {
  return React.useSyncExternalStore(subscribeReduced, reducedSnapshot, () => false)
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}
const visibleSnapshot = () => document.visibilityState !== "hidden"
function useTabVisible() {
  return React.useSyncExternalStore(subscribeVisibility, visibleSnapshot, () => true)
}

function stateWords(step: BeadStep, state: BeadStepState, running: boolean) {
  switch (state) {
    case "done":
      return step.meta ?? "Done"
    case "blocked":
      return step.blocked ?? "Needs you"
    case "active":
      return running ? "In progress" : "Up next"
    default:
      return "Queued"
  }
}

/* -------------------------------------------------------------------------- */
/*                                BeadStepper                                 */
/* -------------------------------------------------------------------------- */

export function BeadStepper({
  steps = DEFAULT_STEPS,
  title = "Vendor onboarding",
  subtitle = "Harbor & Finch",
  agent = "Atlas",
  completed,
  defaultCompleted,
  defaultOpen = false,
  onCompletedChange,
  onResolve,
  autoPlay = true,
  interval = 1500,
  consequence = "Sends the welcome pack to 14 vendors at 09:00",
  doneConsequence = "Welcome pack queued for 14 vendors, goes out at 09:00",
  className,
}: BeadStepperProps) {
  const n = steps.length
  const reduced = useReducedMotion()
  const tabVisible = useTabVisible()
  const hintId = React.useId()
  const foldId = React.useId()

  // Nothing is stored until a person or the agent moves a bead. Until then the start frame is derived,
  // so a reduced-motion reader gets the still frame (stopped at the first blocked step) even after hydration.
  const [inner, setInner] = React.useState<number | undefined>(defaultCompleted)
  const [cleared, setCleared] = React.useState<string[]>([])
  const [landed, setLanded] = React.useState<number | null>(null)
  const [jam, setJam] = React.useState<{ n: number; i: number }>({ n: 0, i: -1 })
  const [hot, setHot] = React.useState<number | null>(null)
  const [rove, setRove] = React.useState<number | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [inView, setInView] = React.useState(true)
  const [open, setOpen] = React.useState(defaultOpen)

  const firstBlocked = steps.findIndex((s) => s.blocked)
  const start = reduced ? (firstBlocked >= 0 ? firstBlocked : n) : Math.min(1, n)
  const done = clamp(completed ?? inner ?? start, 0, n)
  const finished = n > 0 && done >= n
  const cur = steps[Math.min(done, n - 1)]
  const blockedNow = !finished && !!cur?.blocked && !cleared.includes(cur.id)
  const nudge = blockedNow && jam.n > 0 && jam.i === done

  const rootRef = React.useRef<HTMLDivElement>(null)
  const rodRef = React.useRef<HTMLDivElement>(null)
  const beadRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const dragRef = React.useRef<{ x: number; max: number; moved: boolean; dx: number } | null>(null)
  const clickGuard = React.useRef(false)

  const running = autoPlay && !reduced && inView && tabVisible && !finished && !blockedNow && !dragging && n > 0

  const setDone = (v: number) => {
    if (completed === undefined) setInner(v)
    onCompletedChange?.(v)
  }
  const clearJam = () => setJam({ n: 0, i: -1 })
  const focusBead = (j: number) => beadRefs.current[clamp(j, 0, Math.max(n - 1, 0))]?.focus()

  // The timer reads the newest closure through a ref, so it never restarts because a callback changed.
  const slideRef = React.useRef<() => void>(() => {})
  React.useEffect(() => {
    slideRef.current = () => {
      setLanded(done)
      setDone(done + 1)
    }
  })

  const push = () => {
    if (finished || n === 0) return
    if (blockedNow) {
      setJam((j) => ({ n: j.n + 1, i: done }))
      return
    }
    clearJam()
    setLanded(done)
    setDone(done + 1)
    focusBead(done + 1)
  }
  const back = () => {
    if (done <= 0) return
    clearJam()
    setLanded(null)
    setDone(done - 1)
  }
  const resolve = () => {
    if (!cur) return
    clearJam()
    setCleared((c) => [...c, cur.id])
    onResolve?.(cur)
    setLanded(done)
    setDone(done + 1)
    focusBead(done + 1)
  }
  const restart = () => {
    clearJam()
    setCleared([])
    setLanded(null)
    setResetting(true)
    setDone(0)
    focusBead(0)
  }

  // The agent finishes one step per interval and waits at a blocked one.
  React.useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => slideRef.current(), interval)
    return () => window.clearTimeout(t)
  }, [running, done, interval])

  React.useEffect(() => {
    if (!resetting) return
    const t = window.setTimeout(() => setResetting(false), 1000)
    return () => window.clearTimeout(t)
  }, [resetting])

  // Pause the agent while the card is off screen.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ---- pointer: drag the active bead across the rod ---- */
  const onDown = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    clickGuard.current = false
    if (i !== done || blockedNow || e.button !== 0 || !rodRef.current) return
    const pos = e.currentTarget.parentElement as HTMLElement
    const bead = pos.offsetWidth
    const max = rodRef.current.clientWidth - bead - (n - 1) * (bead + BEAD_GAP)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, max: Math.max(0, max), moved: false, dx: 0 }
    pos.dataset.drag = "1"
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    const dx = clamp(e.clientX - d.x, -d.max, 0)
    if (Math.abs(dx) > 4) d.moved = true
    d.dx = dx
    ;(e.currentTarget.parentElement as HTMLElement).style.setProperty("--dx", `${dx}px`)
  }
  const onUp = (e: React.PointerEvent<HTMLButtonElement>, i: number, cancelled: boolean) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    const pos = e.currentTarget.parentElement as HTMLElement
    delete pos.dataset.drag
    pos.style.removeProperty("--dx")
    setDragging(false)
    // A cancelled pointer sends no click, so only a finished drag needs to swallow the click that follows it.
    if (cancelled || !d.moved) return
    clickGuard.current = true
    if (-d.dx > d.max * 0.4) {
      clearJam()
      setLanded(i)
      setDone(i + 1)
    }
  }

  /* ---- keyboard: arrows walk the beads, Enter pushes, Backspace slides the last one back ---- */
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const go = (j: number) => {
      e.preventDefault()
      focusBead(j)
    }
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        return go(i - 1)
      case "ArrowRight":
      case "ArrowDown":
        return go(i + 1)
      case "Home":
        return go(0)
      case "End":
        return go(n - 1)
      case "Backspace":
      case "Delete":
        if (i === done - 1) {
          e.preventDefault()
          back()
        }
    }
  }

  const stateOf = (i: number): BeadStepState => (i < done ? "done" : i === done ? (blockedNow ? "blocked" : "active") : "pending")
  const tabStop = rove ?? Math.min(done, Math.max(n - 1, 0))

  // Status line
  let tone: "run" | "blocked" | "done" | "idle" = "idle"
  let headline = autoPlay && !reduced ? `${agent} is paused` : `Ready for step ${done + 1}`
  if (finished) {
    tone = "done"
    headline = `All ${n} steps done`
  } else if (blockedNow) {
    tone = "blocked"
    headline = cur?.blocked ?? "Needs you"
  } else if (running) {
    tone = "run"
    headline = `${agent} is working`
  }
  const next = steps[done + 1]
  const announce = finished
    ? `All ${n} steps done`
    : nudge
      ? `${cur?.blocked}. Choose "${cur?.unblock ?? "Resolve"}" to continue.${jam.n % 2 ? "​" : ""}`
      : blockedNow
        ? `Step ${done + 1} of ${n}, ${cur?.label}. ${cur?.blocked}`
        : `${done} of ${n} steps done`

  if (n === 0) return null

  const action = finished
    ? { kind: "primary", label: "Replay", icon: true }
    : blockedNow
      ? { kind: "primary", label: cur?.unblock ?? "Resolve", icon: false }
      : !running
        ? { kind: "quiet", label: "Mark step done", icon: false }
        : null
  const onAction = () => (finished ? restart() : blockedNow ? resolve() : push())

  return (
    <div
      ref={rootRef}
      className={cn("ibs", className)}
      data-all={finished ? "true" : undefined}
      data-blocked={blockedNow ? "true" : undefined}
      data-nudge={nudge ? "true" : undefined}
      data-reset={resetting ? "true" : undefined}
      style={{ "--ibs-n": n, "--ibs-nl": Math.ceil(n / 2), "--ibs-nr": Math.floor(n / 2) } as React.CSSProperties}
    >
      <style href="bead-stepper" precedence="default">
        {CSS}
      </style>

      <header className="ibs-head">
        <span className="ibs-tile" aria-hidden>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="2.5" y="3" width="15" height="14" rx="3.5" />
            <path d="M5.5 7.5h9M5.5 12.5h9" opacity=".45" />
            <circle cx="7.4" cy="7.5" r="1.7" fill="currentColor" stroke="none" />
            <circle cx="12.6" cy="12.5" r="1.7" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="ibs-titles">
          <h3 className="ibs-title">{title}</h3>
          <p className="ibs-subtitle">{subtitle}</p>
        </div>
        <div className="ibs-count" aria-hidden>
          <span className="ibs-count-n">
            <span className="ibs-digit" key={done}>
              {done}
            </span>
          </span>
          <span className="ibs-count-of">of {n}</span>
        </div>
      </header>

      <div
        className="ibs-frame"
        role="group"
        aria-label={`${title}: ${done} of ${n} steps done`}
        style={{ "--ibs-d": done } as React.CSSProperties}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRove(null)
        }}
      >
        <span className="ibs-post" aria-hidden />
        <div className="ibs-rod" ref={rodRef}>
          <span className="ibs-wire" aria-hidden>
            <span className="ibs-wire-fill" />
          </span>
          <span className="ibs-ticks" aria-hidden />
          <span className="ibs-ghost" aria-hidden />
          {steps.map((s, i) => {
            const st = stateOf(i)
            return (
              <span
                key={s.id}
                className="ibs-pos"
                data-s={st}
                data-run={running && st === "active" ? "true" : undefined}
                data-knock={landed === i ? "true" : undefined}
                data-jam={jam.i === i && jam.n > 0 ? (jam.n % 2 ? "a" : "b") : undefined}
                style={{ "--i": i, "--k": n - 1 - i } as React.CSSProperties}
              >
                <button
                  type="button"
                  ref={(el) => {
                    beadRefs.current[i] = el
                  }}
                  className="ibs-bead"
                  data-hot={hot === i ? "true" : undefined}
                  tabIndex={i === tabStop ? 0 : -1}
                  aria-label={`Step ${i + 1} of ${n}: ${s.label}. ${stateWords(s, st, running)}`}
                  aria-current={st === "active" || st === "blocked" ? "step" : undefined}
                  aria-describedby={hintId}
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot(null)}
                  onFocus={() => {
                    setHot(i)
                    setRove(i)
                  }}
                  onBlur={() => setHot(null)}
                  onPointerDown={(e) => onDown(e, i)}
                  onPointerMove={onMove}
                  onPointerUp={(e) => onUp(e, i, false)}
                  onPointerCancel={(e) => onUp(e, i, true)}
                  onKeyDown={(e) => onKey(e, i)}
                  onClick={() => {
                    if (clickGuard.current) {
                      clickGuard.current = false
                      return
                    }
                    if (i === done) push()
                  }}
                >
                  <span className="ibs-gl" aria-hidden />
                  <span className="ibs-ring" aria-hidden />
                  {i + 1}
                </button>
                {st === "blocked" && s.blocked ? (
                  <span className="ibs-pill" aria-hidden>
                    {s.blocked}
                  </span>
                ) : null}
              </span>
            )
          })}
        </div>
        <span className="ibs-post" aria-hidden />
      </div>

      <div className="ibs-status">
        <div className="ibs-words">
          <div className="ibs-state" data-tone={tone}>
            <span className="ibs-dot" aria-hidden />
            <span className="ibs-state-text" key={headline} data-text={headline}>
              {headline}
            </span>
          </div>
        </div>
        {action ? (
          <button type="button" className="ibs-act" data-kind={action.kind} onClick={onAction}>
            {action.icon ? <RotateCcw aria-hidden strokeWidth={2} /> : null}
            {action.label}
          </button>
        ) : null}
      </div>

      <div className="ibs-flow">
        <div className="ibs-lines">
          {finished ? (
            <p className="ibs-line">
              <span className="ibs-tag">Now</span>
              <span className="ibs-line-text">Nothing left for you to do</span>
            </p>
          ) : (
            <>
              <p className="ibs-line" key={`now-${done}`}>
                <span className="ibs-tag">Now</span>
                <span className="ibs-line-text">{cur?.label}</span>
              </p>
              {next ? (
                <p className="ibs-line" data-dim key={`next-${done}`}>
                  <span className="ibs-tag">Next</span>
                  <span className="ibs-line-text">{next.label}</span>
                </p>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          className="ibs-more"
          aria-expanded={open}
          aria-controls={foldId}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{open ? "Hide steps" : "All steps"}</span>
          <ChevronDown aria-hidden strokeWidth={2} />
        </button>
      </div>

      <div className="ibs-fold" id={foldId} data-open={open ? "true" : undefined}>
        <div>
          <ol className="ibs-ledger" aria-label="Steps">
            {steps.map((s, i) => {
              const st = stateOf(i)
              return (
                <li
                  key={s.id}
                  className="ibs-row"
                  data-s={st}
                  data-hot={hot === i ? "true" : undefined}
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot(null)}
                >
                  <span className="ibs-mark" aria-hidden>
                    {st === "done" ? <Check strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="ibs-label">{s.label}</span>
                  <span className="ibs-note">
                    <span className="ibs-sr">{st === "done" ? "Done. " : ""}</span>
                    {stateWords(s, st, running)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <div className="ibs-foot">
        <p className="ibs-conseq">
          {finished ? <Check aria-hidden strokeWidth={2.4} /> : <Clock3 aria-hidden strokeWidth={2} />}
          <span key={finished ? "done" : "open"}>{finished ? doneConsequence : consequence}</span>
        </p>
        <p className="ibs-keys" id={hintId}>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd>step through
          </span>
          <span>
            <kbd>↵</kbd>push bead
          </span>
          <span>
            <kbd>⌫</kbd>undo
          </span>
        </p>
      </div>

      <div className="ibs-sr" role="status" aria-live="polite">
        {announce}
      </div>
    </div>
  )
}
