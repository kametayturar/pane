"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TracingChange = {
  /** Matches the `data-tp` attribute you put on the changed element in the previous and/or the new version. */
  id: string
  /** Short name of the thing that changed, e.g. "Headline". */
  label: string
  /** One or two words shown next to the colour, e.g. "Rewritten". Defaults to Changed, Added or Removed. */
  note?: string
  /** What it said before (shown struck through when the change is selected). */
  was?: string
  /** What it says now. */
  now?: string
}

export type TracingPaperProps = {
  /** The previous version, as real markup. Mark each changed element with `data-tp="<change id>"`. Keep it non-interactive (it is inert). Default: a Harbor & Finch homepage. */
  before?: React.ReactNode
  /** The version the agent wrote. Same `data-tp` ids. */
  after?: React.ReactNode
  /** The change list. Order sets the numbers drawn on the page. */
  changes?: TracingChange[]
  /** Heading of the review, e.g. "Homepage rewrite". */
  title?: string
  /** Name of the agent that made the edit. Its initial fills the tile. */
  agentName?: string
  /** Line under the title. Default: change count. */
  subtitle?: string
  /** Label on the new sheet. Default: "<agent>'s edit". */
  newLabel?: string
  /** Label on the page underneath. Default: "Previous". */
  oldLabel?: string
  /** What accepting does, in plain words: "Sends to 14 investors at 09:00". */
  consequence?: string
  /** How much of the page the new sheet covers, 0 to 100 (controlled). */
  value?: number
  /** Start position when uncontrolled. Default 56, or 100 on a phone so the clean new page shows first. */
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Dim everything that did not change (controlled). */
  onlyChanges?: boolean
  defaultOnlyChanges?: boolean
  onOnlyChangesChange?: (on: boolean) => void
  /** Called when the person accepts the edit. */
  onAccept?: () => void
  /** Called when the person keeps the previous version. */
  onKeep?: () => void
  /** Text of the accept button. Default: "Accept N changes". */
  acceptLabel?: string
  /** Text of the keep button. Default: "Keep previous". */
  keepLabel?: string
  /** Message after accepting. */
  acceptedText?: string
  /** Message after keeping the old version. */
  keptText?: string
  /** Hide the Keep / Accept footer, to use the sheet on its own. */
  hideActions?: boolean
  /** Lay the sheet down once when it first scrolls into view. Default true. */
  intro?: boolean
  className?: string
}

type Box = { id: string; x: number; y: number; w: number; h: number; r: number }
type Geo = { w: number; old: Box[]; next: Box[] }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
@property --itp-pos { syntax: "<number>"; inherits: true; initial-value: 0.56 }

.itp {
  --itp-ink: #000;
  --itp-surface: #fff;
  --itp-accent: #0060e2;
  --itp-t1: color-mix(in oklab, var(--itp-ink) 88%, transparent);
  --itp-t2: color-mix(in oklab, var(--itp-ink) 61%, transparent);
  --itp-t3: color-mix(in oklab, var(--itp-ink) 45%, transparent);
  --itp-t4: color-mix(in oklab, var(--itp-ink) 27%, transparent);
  --itp-fill: color-mix(in oklab, var(--itp-ink) 6%, transparent);
  --itp-line: color-mix(in oklab, var(--itp-ink) 6%, transparent);
  --itp-add: #17874a;
  --itp-del: #d23a2e;
  --itp-wash: 6%;
  --itp-edge: 58%;
  --itp-desk: color-mix(in oklab, var(--itp-ink) 4%, var(--itp-surface));
  --itp-paper-c: color-mix(in oklab, var(--itp-surface) 96%, var(--itp-accent));
  --itp-btn: var(--itp-accent);
  --itp-on: #fff;
  --itp-shade: rgb(20 30 60 / .1);
  --itp-cast: rgb(10 20 40 / .26);
  --itp-glint: rgb(255 255 255 / .9);
  --itp-grain: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .1  0 0 0 0 .15  0 0 0 0 .3  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  --itp-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --itp-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 2px rgb(0 0 0 / .08), 0 8px 18px -6px rgb(0 0 0 / .22);
  --itp-ease: cubic-bezier(.22, 1, .36, 1);
  --itp-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --itp-bleed: 20px;
  --itp-t: 12px;
  --itp-pos: 0.56;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 880px;
  padding: 14px;
  border-radius: 18px;
  background: var(--itp-surface);
  box-shadow: var(--itp-shadow);
  color: var(--itp-t1);
  font: 13px/20px var(--itp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  text-align: left;
  transition: --itp-pos .55s var(--itp-ease);
}
:is(.dark, [data-theme="dark"]) .itp {
  --itp-ink: #fff;
  --itp-surface: #1c1c1e;
  --itp-accent: #4d8dff;
  --itp-t1: color-mix(in oklab, var(--itp-ink) 90%, transparent);
  --itp-t2: color-mix(in oklab, var(--itp-ink) 66%, transparent);
  --itp-t3: color-mix(in oklab, var(--itp-ink) 50%, transparent);
  --itp-t4: color-mix(in oklab, var(--itp-ink) 30%, transparent);
  --itp-fill: color-mix(in oklab, var(--itp-ink) 8%, transparent);
  --itp-line: color-mix(in oklab, var(--itp-ink) 8%, transparent);
  --itp-add: #5ad68c;
  --itp-del: #ff6b5e;
  --itp-wash: 12%;
  --itp-edge: 78%;
  --itp-desk: color-mix(in oklab, var(--itp-ink) 3%, var(--itp-surface));
  --itp-paper-c: color-mix(in oklab, var(--itp-surface) 93%, var(--itp-accent));
  --itp-btn: color-mix(in oklab, var(--itp-accent) 78%, #000);
  --itp-shade: rgb(0 0 0 / .34);
  --itp-cast: rgb(0 0 0 / .62);
  --itp-glint: rgb(255 255 255 / .2);
  --itp-grain: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  --itp-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --itp-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 18px -6px rgb(0 0 0 / .6);
}
/* text on the accent button picks black or white from the button's own lightness, so Classic, Mono and Glass all stay readable */
@supports (color: oklch(from red l c h)) {
  .itp { --itp-on: oklch(from var(--itp-btn) calc((l - .66) * -1000) 0 0) }
}
:where(.itp) *, :where(.itp) *::before, :where(.itp) *::after { box-sizing: border-box }
:where(.itp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.itp) :focus-visible { outline: 2px solid color-mix(in oklab, var(--itp-accent) 60%, transparent); outline-offset: 2px }
.itp[data-drag] { transition: none }
.itp[data-intro="play"], .itp[data-intro="wait"] { animation: itp-lift 2.4s cubic-bezier(.45, 0, .2, 1) .3s backwards }
.itp[data-intro="wait"] { animation-play-state: paused }
@keyframes itp-lift { from { --itp-pos: 0 } }
.itp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* header */
.itp-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; min-width: 0; padding: 2px 2px 0 }
.itp-agent { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: var(--itp-fill); color: var(--itp-t1); font: 400 20px/1 var(--itp-serif); }
.itp-titles { flex: 1 1 180px; min-width: 0 }
.itp-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; line-height: 20px; font-weight: 500; color: var(--itp-t1) }
.itp-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--itp-t3) }
.itp-switch { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px 0 8px; margin-left: auto; border-radius: 8px; font-size: 12.5px; color: var(--itp-t2); transition: background .2s var(--itp-ease), color .2s var(--itp-ease) }
.itp-switch:hover { background: var(--itp-fill) }
.itp-track { position: relative; flex: none; width: 26px; height: 16px; border-radius: 8px; background: color-mix(in oklab, var(--itp-ink) 16%, transparent); transition: background .25s var(--itp-ease) }
.itp-track::after { content: ""; position: absolute; left: 2px; top: 2px; width: 12px; height: 12px; border-radius: 6px; background: var(--itp-surface); box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .3s var(--itp-ease) }
.itp-switch[aria-checked="true"] { color: var(--itp-t1) }
.itp-switch[aria-checked="true"] .itp-track { background: var(--itp-btn) }
.itp-switch[aria-checked="true"] .itp-track::after { transform: translateX(10px) }

/* stage */
.itp-wrap { position: relative; margin-top: 6px }
.itp-tag { position: absolute; top: -10px; z-index: 6; display: inline-flex; align-items: center; gap: 6px; height: 20px; padding: 0 9px 0 8px; border-radius: 10px; background: var(--itp-surface); box-shadow: var(--itp-shadow); color: var(--itp-t1); font-size: 12px; font-weight: 500; line-height: 20px; white-space: nowrap; pointer-events: none }
.itp-tag::before { content: ""; width: 6px; height: 6px; border-radius: 3px; background: var(--c) }
.itp-tag[data-s="new"] { left: 14px; --c: var(--itp-add); opacity: clamp(0, calc((var(--itp-pos) - .1) * 12), 1) }
.itp-tag[data-s="old"] { right: 14px; --c: var(--itp-del); opacity: clamp(0, calc((.9 - var(--itp-pos)) * 12), 1) }
.itp-stage {
  position: relative;
  display: grid;
  overflow: hidden;
  border-radius: 12px;
  background: var(--itp-desk);
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--itp-ink) 10%, transparent);
  container: itps / inline-size;
  isolation: isolate;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}
.itp-stage[data-drag] { cursor: grabbing }
.itp-old { grid-area: 1 / 1; position: relative; min-width: 0; pointer-events: none }
.itp-content { position: relative }
.itp-marks { position: absolute; inset: 0; pointer-events: none; transition: opacity .5s var(--itp-ease) }
.itp[data-decision] .itp-marks { opacity: 0 }
.itp-mark {
  position: absolute;
  border-radius: 6px;
  outline: 1.5px solid color-mix(in oklab, var(--c) var(--itp-edge), transparent);
  background: color-mix(in oklab, var(--c) var(--itp-wash), transparent);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--c) calc(var(--itp-wash) * 1.5), transparent);
  transition: outline-color .25s var(--itp-ease), box-shadow .3s var(--itp-ease), background .3s var(--itp-ease);
}
.itp-mark[data-s="old"] { --c: var(--itp-del); outline-style: dashed }
.itp-mark[data-s="new"] { --c: var(--itp-add) }
.itp-mark[data-hot] { outline-color: var(--c); background: color-mix(in oklab, var(--c) calc(var(--itp-wash) * 2), transparent); box-shadow: 0 0 0 7px color-mix(in oklab, var(--c) calc(var(--itp-wash) * 2.4), transparent) }
.itp-mark > i { position: absolute; left: 6px; top: -9px; display: grid; place-items: center; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: var(--itp-surface); box-shadow: 0 0 0 1px color-mix(in oklab, var(--c) 70%, transparent); color: var(--c); font: 600 10.5px/1 inherit; font-style: normal; font-variant-numeric: tabular-nums }

/* the sheet: skewed wrapper holds paper + mask, the inner element skews back so the content stays square */
.itp-sheet, .itp-fold {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--itp-bleed));
  right: calc(-1 * var(--itp-bleed));
  transform: skewX(var(--itp-skew, -1.2deg));
  pointer-events: none;
  --itp-e: calc(var(--itp-bleed) - var(--itp-t) + var(--itp-pos) * (100% - 2 * var(--itp-bleed) + 2 * var(--itp-t)));
}
.itp-sheet {
  z-index: 2;
  --itp-flat: clamp(0, calc((var(--itp-pos) - .94) * 16), 1);
  background-color: color-mix(in oklab, var(--itp-paper-c) calc(97% + var(--itp-flat) * 3%), transparent);
  --itp-b: calc(9px * min(1, (1 - var(--itp-pos)) * 8));
  -webkit-mask-image: linear-gradient(90deg, #000 calc(var(--itp-e) - var(--itp-b)), transparent var(--itp-e));
  mask-image: linear-gradient(90deg, #000 calc(var(--itp-e) - var(--itp-b)), transparent var(--itp-e));
}
.itp-sheet::before { content: ""; position: absolute; inset: 0; opacity: .08; background-image: var(--itp-grain); pointer-events: none }
.itp-sheet-in { position: absolute; top: 0; bottom: 0; left: var(--itp-bleed); right: var(--itp-bleed); transform: skewX(calc(-1 * var(--itp-skew, -1.2deg))) }
.itp-reg { position: absolute; width: 9px; height: 9px; background: linear-gradient(currentColor, currentColor) center / 1px 100% no-repeat, linear-gradient(currentColor, currentColor) center / 100% 1px no-repeat; pointer-events: none }
.itp-reg[data-p="a"] { left: 7px; bottom: 7px }
.itp-reg[data-p="b"] { right: 7px; bottom: 7px }
.itp-old .itp-reg { color: var(--itp-t4) }
.itp-sheet-in .itp-reg { color: color-mix(in oklab, var(--itp-accent) 60%, transparent) }

/* fold: shaded bend, lit lip, crease, cast shadow */
.itp-fold { z-index: 4; --itp-lift: clamp(0, min(var(--itp-pos), 1 - var(--itp-pos)) * 10, 1) }
.itp-fold > * { position: absolute; top: 0; bottom: 0; opacity: var(--itp-lift) }
.itp-curl { left: calc(var(--itp-e) - 26px); width: 26px; background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--itp-shade) 45%, transparent) 55%, var(--itp-shade)) }
.itp-lip { left: calc(var(--itp-e) - 3px); width: 2px; background: var(--itp-glint) }
.itp-crease { left: calc(var(--itp-e) - .5px); width: 1px; background: color-mix(in oklab, var(--itp-ink) 24%, transparent) }
.itp-cast { left: var(--itp-e); width: 72px; background: linear-gradient(90deg, var(--itp-cast), color-mix(in oklab, var(--itp-cast) 42%, transparent) 20%, color-mix(in oklab, var(--itp-cast) 12%, transparent) 52%, transparent) }

/* spotlight veil */
.itp-veil { position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; opacity: 0; pointer-events: none; transition: opacity .4s var(--itp-ease) }
.itp-veil[data-v="only"] { opacity: .92 }
.itp-veil[data-v="spot"] { opacity: .88 }
.itp-veil-fill { fill: var(--itp-surface) }

/* selected change: was and now float over the page, so nothing below moves */
.itp-capwrap { position: absolute; left: 0; right: 0; bottom: 12px; z-index: 7; display: flex; justify-content: center; padding: 0 12px; pointer-events: none }
.itp-cap { display: grid; gap: 3px; width: min(100%, 520px); padding: 10px 14px 11px; border-radius: 12px; background: var(--itp-surface); box-shadow: var(--itp-float); font-size: 12.5px; line-height: 18px; color: var(--itp-t2); animation: itp-in .4s var(--itp-ease) backwards }
.itp-cap b { margin-bottom: 1px; font-size: 12px; font-weight: 500; color: var(--itp-t3) }
.itp-cap p { display: grid; grid-template-columns: 34px minmax(0, 1fr); margin: 0 }
.itp-cap span { font-size: 11.5px; font-weight: 500 }
.itp-cap p[data-w] span { color: var(--itp-del) }
.itp-cap p[data-w] em { text-decoration: line-through; text-decoration-color: color-mix(in oklab, var(--itp-del) 55%, transparent); font-style: normal; color: var(--itp-t3) }
.itp-cap p[data-n] span { color: var(--itp-add) }
.itp-cap p[data-n] em { font-style: normal; color: var(--itp-t1) }

/* grabber */
.itp-handle {
  position: absolute; z-index: 5; top: 50%;
  left: clamp(22px, calc(var(--itp-pos) * (100% + 2 * var(--itp-t)) - var(--itp-t)), calc(100% - 22px));
  display: grid; place-items: center; width: 32px; height: 60px; margin: -30px 0 0 -16px; border-radius: 16px;
  background: var(--itp-surface); box-shadow: var(--itp-float); color: var(--itp-t2); cursor: grab; touch-action: none;
  transition: transform .25s var(--itp-ease), color .2s var(--itp-ease);
}
.itp-handle:hover { color: var(--itp-t1) }
.itp[data-drag] .itp-handle { transform: scale(.94); cursor: grabbing; color: var(--itp-accent) }
.itp-handle svg { display: block }

/* ruler */
.itp-ruler { display: grid; gap: 6px; padding: 0 2px }
.itp-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 2px 12px; font-size: 12px; line-height: 16px; color: var(--itp-t3) }
.itp-readout b { font-size: 13px; font-weight: 500; color: var(--itp-t1); font-variant-numeric: tabular-nums }
.itp-hint { display: grid; justify-items: end; margin-left: auto }
.itp-hint > span { grid-area: 1 / 1; transition: opacity .25s var(--itp-ease) }
.itp-hint > span[data-k] { opacity: 0 }
.itp:has(.itp-handle:focus-visible) .itp-hint > span[data-k] { opacity: 1 }
.itp:has(.itp-handle:focus-visible) .itp-hint > span[data-m] { opacity: 0 }
.itp-scale { position: relative; height: 22px; cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.itp-tick { position: absolute; bottom: 7px; width: 1px; height: 5px; margin-left: -.5px; background: var(--itp-t4); opacity: .6 }
.itp-tick[data-m] { height: 9px; opacity: 1 }
.itp-scale::after { content: ""; position: absolute; left: 0; right: 0; bottom: 6px; height: 1px; background: color-mix(in oklab, var(--itp-ink) 12%, transparent) }
.itp-pin { position: absolute; bottom: 0; left: calc(var(--itp-pos) * 100%); width: 18px; height: 18px; margin-left: -9px; border-radius: 9px; background: var(--itp-btn); box-shadow: 0 0 0 2.5px var(--itp-surface), 0 0 0 3.5px color-mix(in oklab, var(--itp-ink) 10%, transparent), 0 2px 6px rgb(0 0 0 / .22); pointer-events: none }
.itp-ends { display: flex; justify-content: space-between; font-size: 11px; line-height: 14px; color: var(--itp-t3) }

/* changes */
.itp-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 2px 8px; margin: 0; padding: 0; list-style: none }
.itp-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 8px; width: 100%; min-height: 32px; padding: 4px 8px; border-radius: 8px; transition: background .2s var(--itp-ease) }
.itp-row:hover, .itp-row[aria-pressed="true"] { background: var(--itp-fill) }
.itp-n { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 9px; box-shadow: inset 0 0 0 1px var(--itp-t4); color: var(--itp-t2); font-size: 10.5px; font-weight: 600; font-variant-numeric: tabular-nums }
.itp-lab { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--itp-t1) }
.itp-kind { font-size: 12px; color: var(--itp-t3) }
.itp-kind[data-k="added"] { color: var(--itp-add) }
.itp-kind[data-k="removed"] { color: var(--itp-del) }

/* footer */
.itp-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; padding: 12px 2px 0; border-top: 1px solid var(--itp-line) }
.itp-msg { flex: 1 1 240px; min-width: 0; font-size: 12.5px; line-height: 18px; color: var(--itp-t2) }
.itp-msg > div { display: flex; align-items: flex-start; gap: 8px; animation: itp-in .45s var(--itp-ease) backwards }
.itp-msg svg { flex: none; margin-top: 2px }
.itp-msg-ok svg { color: var(--itp-add) }
.itp-msg-ok path { stroke-dasharray: 16; animation: itp-draw .55s var(--itp-ease) .1s backwards }
.itp-undo { margin-left: 6px; color: var(--itp-accent); font-weight: 500 }
.itp-undo:hover { text-decoration: underline }
.itp-btns { display: flex; gap: 8px; margin-left: auto }
.itp-btn { height: 34px; padding: 0 15px; border-radius: 9px; font-weight: 500; font-size: 13px; transition: transform .2s var(--itp-ease), background .2s var(--itp-ease) }
.itp-btn:active { transform: scale(.97) }
.itp-btn[data-v="ghost"] { background: var(--itp-fill); color: var(--itp-t1) }
.itp-btn[data-v="ghost"]:hover { background: color-mix(in oklab, var(--itp-ink) 10%, transparent) }
.itp-btn[data-v="solid"], .itp-hf-btn[data-p], .itp-primary { background: var(--itp-btn); color: var(--itp-on) }
.itp-btn[data-v="solid"]:hover { background: color-mix(in oklab, var(--itp-btn) 88%, var(--itp-ink)) }
@keyframes itp-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes itp-draw { from { stroke-dashoffset: 16 } }

/* ---- default scene: a Harbor & Finch homepage, before and after ---- */
.itp-hf { display: flex; flex-direction: column; gap: 34px; padding: 22px 36px 44px; color: var(--itp-t1); font-size: 13px; line-height: 20px }
.itp-hf-nav { display: flex; align-items: center; gap: 16px; white-space: nowrap }
.itp-hf-logo { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; letter-spacing: -.01em }
.itp-hf-logo i { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: var(--itp-ink); color: var(--itp-surface); font: 400 15px/1 var(--itp-serif); font-style: normal }
.itp-hf-links { display: flex; gap: 18px; margin-left: 8px; color: var(--itp-t3); font-size: 13px }
.itp-hf-in { margin-left: auto; color: var(--itp-t2); font-size: 13px }
.itp-hf-main { display: grid; gap: 26px; grid-template-columns: minmax(0, 1fr) }
.itp-hf-hero { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; padding-top: 6px }
.itp-hf-h { margin: 0; font-family: var(--itp-serif); font-weight: 400; font-size: clamp(32px, 6.6cqi, 56px); line-height: 1; letter-spacing: -.02em; color: var(--itp-t1) }
.itp-hf-sub { margin: 0; max-width: 36ch; font-size: 15px; line-height: 23px; color: var(--itp-t2) }
.itp-hf-cta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px }
.itp-hf-btn { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 10px; background: var(--itp-fill); color: var(--itp-t1); font-weight: 500; font-size: 13.5px; white-space: nowrap }
.itp-hf-proof { display: flex; align-items: center; gap: 10px; padding: 3px 6px; margin-left: -6px; color: var(--itp-t2); font-size: 13px }
.itp-hf-faces { display: flex }
.itp-hf-faces i { width: 22px; height: 22px; margin-left: -7px; border-radius: 11px; box-shadow: 0 0 0 2px var(--itp-surface) }
.itp-hf-faces i:first-child { margin-left: 0 }
.itp-hf-faces i:nth-child(1) { background: color-mix(in oklab, var(--itp-accent) 55%, var(--itp-surface)) }
.itp-hf-faces i:nth-child(2) { background: color-mix(in oklab, var(--itp-add) 55%, var(--itp-surface)) }
.itp-hf-faces i:nth-child(3) { background: color-mix(in oklab, var(--itp-del) 45%, var(--itp-surface)) }
.itp-hf-plan { display: flex; flex-direction: column; gap: 14px; padding: 20px; border-radius: 16px; background: var(--itp-surface); box-shadow: var(--itp-shadow), 0 14px 30px -16px rgb(0 0 0 / .22) }
.itp-hf-plan-top { display: flex; align-items: center; justify-content: space-between; font-weight: 500; font-size: 15px }
.itp-hf-chip { padding: 1px 9px; border-radius: 10px; background: var(--itp-fill); color: var(--itp-t2); font-size: 12px; font-weight: 400 }
.itp-hf-price { display: flex; flex-direction: column; gap: 2px; width: fit-content }
.itp-hf-price b { font-size: 40px; line-height: 44px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums }
.itp-hf-price span { color: var(--itp-t3); font-size: 12.5px; line-height: 16px }
.itp-hf-list { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none }
.itp-hf-list li { display: flex; align-items: center; gap: 8px; width: fit-content; color: var(--itp-t2) }
.itp-hf-list svg { flex: none; color: var(--itp-accent) }
.itp-hf-fee { width: fit-content; color: var(--itp-t3); font-size: 12.5px }
.itp-hf-plan .itp-hf-btn { justify-content: center; margin-top: 2px }
@container itps (min-width: 640px) { .itp-hf-main { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 40px; align-items: start } }
@container itps (max-width: 560px) {
  .itp-hf { gap: 22px; padding: 16px 18px 28px }
  .itp-hf-links { display: none }
  .itp-hf-main { gap: 20px }
  .itp-hf-plan { padding: 16px; gap: 12px }
  .itp-hf-list li:not([data-tp]) { display: none }
}

@media (forced-colors: active) {
  .itp-handle, .itp-btn, .itp-switch, .itp-row, .itp-cap { border: 1px solid ButtonText }
  .itp-track { border: 1px solid ButtonText }
  .itp-track::after { background: ButtonText }
  .itp-switch[aria-checked="true"] .itp-track { background: Highlight }
  .itp-switch[aria-checked="true"] .itp-track::after { background: HighlightText }
  .itp-pin { forced-color-adjust: none; background: Highlight; box-shadow: none }
  .itp-crease { background: ButtonText }
}
@media (prefers-reduced-motion: reduce) {
  .itp, .itp *, .itp *::before, .itp *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                         Default scene (real markup)                        */
/* -------------------------------------------------------------------------- */

const Tick = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M3 6.8 5.4 9 10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const HfNav = () => (
  <div className="itp-hf-nav">
    <span className="itp-hf-logo">
      <i>H</i>Harbor &amp; Finch
    </span>
    <span className="itp-hf-links">
      <span>Product</span>
      <span>Pricing</span>
      <span>Customers</span>
    </span>
    <span className="itp-hf-in">Sign in</span>
  </div>
)

function HfOld() {
  return (
    <div className="itp-hf">
      <HfNav />
      <div className="itp-hf-main">
        <div className="itp-hf-hero">
          <h2 className="itp-hf-h" data-tp="headline">
            Powerful scheduling for modern teams
          </h2>
          <p className="itp-hf-sub" data-tp="sub">
            Harbor &amp; Finch helps teams manage bookings, clients and payments in one platform.
          </p>
          <div className="itp-hf-cta">
            <span className="itp-hf-btn" data-p="" data-tp="cta">
              Get started
            </span>
            <span className="itp-hf-btn">See how it works</span>
          </div>
        </div>
        <div className="itp-hf-plan">
          <div className="itp-hf-plan-top">
            Team <span className="itp-hf-chip">Most popular</span>
          </div>
          <div className="itp-hf-price" data-tp="price">
            <b>$29</b>
            <span>per seat, billed annually</span>
          </div>
          <ul className="itp-hf-list">
            <li data-tp="seats">
              <Tick />
              Up to 10 seats
            </li>
            <li>
              <Tick />
              Email reminders
            </li>
            <li>
              <Tick />
              Shared calendar
            </li>
          </ul>
          <span className="itp-hf-fee" data-tp="fee">
            One-time setup fee: $99
          </span>
          <span className="itp-hf-btn" data-p="">
            Choose plan
          </span>
        </div>
      </div>
    </div>
  )
}

function HfNew() {
  return (
    <div className="itp-hf">
      <HfNav />
      <div className="itp-hf-main">
        <div className="itp-hf-hero">
          <h2 className="itp-hf-h" data-tp="headline">
            Fill every slot before the week starts
          </h2>
          <p className="itp-hf-sub" data-tp="sub">
            Clients pick a time, we send the reminder, and no-shows stop eating your day.
          </p>
          <div className="itp-hf-cta">
            <span className="itp-hf-btn" data-p="" data-tp="cta">
              Start 14-day trial
            </span>
            <span className="itp-hf-btn">See how it works</span>
          </div>
          <div className="itp-hf-proof" data-tp="proof">
            <span className="itp-hf-faces" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            1,200 studios book with Harbor &amp; Finch
          </div>
        </div>
        <div className="itp-hf-plan">
          <div className="itp-hf-plan-top">
            Team <span className="itp-hf-chip">Most popular</span>
          </div>
          <div className="itp-hf-price" data-tp="price">
            <b>$24</b>
            <span>per seat, billed monthly</span>
          </div>
          <ul className="itp-hf-list">
            <li data-tp="seats">
              <Tick />
              Up to 25 seats
            </li>
            <li>
              <Tick />
              Email reminders
            </li>
            <li>
              <Tick />
              Shared calendar
            </li>
          </ul>
          <span className="itp-hf-btn" data-p="">
            Choose plan
          </span>
        </div>
      </div>
    </div>
  )
}

const NONE: TracingChange[] = []
const HF_OLD = <HfOld />
const HF_NEW = <HfNew />

const HF_CHANGES: TracingChange[] = [
  { id: "headline", label: "Headline", note: "Rewritten", was: "Powerful scheduling for modern teams", now: "Fill every slot before the week starts" },
  { id: "sub", label: "Subhead", note: "Plainer", was: "Harbor & Finch helps teams manage bookings, clients and payments in one platform.", now: "Clients pick a time, we send the reminder, and no-shows stop eating your day." },
  { id: "cta", label: "Main button", note: "Clearer", was: "Get started", now: "Start 14-day trial" },
  { id: "proof", label: "Social proof", note: "Added", now: "1,200 studios book with Harbor & Finch" },
  { id: "price", label: "Team price", note: "$5 lower", was: "$29 per seat, billed annually", now: "$24 per seat, billed monthly" },
  { id: "seats", label: "Seat limit", note: "10 to 25", was: "Up to 10 seats", now: "Up to 25 seats" },
  { id: "fee", label: "Setup fee", note: "Dropped", was: "One-time setup fee: $99" },
]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const half = (n: number) => Math.round(n * 2) / 2
/** The drawn edge overshoots the stage by T on both sides so the fold can leave the page completely. */
const T = 12
const posOf = (x: number, w: number) => clamp(((x + T) / (w + 2 * T)) * 100, 0, 100)
const edgeX = (value: number, w: number) => -T + (value / 100) * (w + 2 * T)

const NARROW = "(max-width: 520px)"
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia?.(NARROW)
  mq?.addEventListener("change", cb)
  return () => mq?.removeEventListener("change", cb)
}
const getNarrow = () => window.matchMedia?.(NARROW).matches ?? false
const getNarrowServer = () => false

function readBoxes(content: HTMLElement): Box[] {
  const base = content.getBoundingClientRect()
  return Array.from(content.querySelectorAll<HTMLElement>("[data-tp]")).map((el) => {
    const r = el.getBoundingClientRect()
    return {
      id: el.dataset.tp ?? "",
      x: half(r.left - base.left),
      y: half(r.top - base.top),
      w: half(r.width),
      h: half(r.height),
      r: half(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0),
    }
  })
}

const sameBoxes = (a: Box[], b: Box[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i].id && x.x === b[i].x && x.y === b[i].y && x.w === b[i].w && x.h === b[i].h && x.r === b[i].r)

const Layer = React.memo(function Layer({ children }: { children: React.ReactNode }) {
  return <>{children}</>
})

function Marks({ boxes, side, order, hot }: { boxes: Box[]; side: "old" | "new"; order: string[]; hot: string | null }) {
  return (
    <div className="itp-marks" aria-hidden="true">
      {boxes.map((b, i) => {
        const at = order.indexOf(b.id)
        return (
          <span
            key={b.id + i}
            className="itp-mark"
            data-s={side}
            data-hot={hot === b.id ? "" : undefined}
            style={{ left: b.x - 3, top: b.y - 3, width: b.w + 6, height: b.h + 6, borderRadius: b.r + 3 || 6 }}
          >
            <i>{at >= 0 ? at + 1 : i + 1}</i>
          </span>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

type Decision = null | "accepted" | "kept"
type Drag = { id: number; left: number; w: number; offset: number; x0: number; y0: number; moved: boolean; defer: boolean }

export function TracingPaper({
  before,
  after,
  changes,
  title,
  agentName,
  subtitle,
  newLabel,
  oldLabel = "Previous",
  consequence,
  value: valueProp,
  defaultValue,
  onValueChange,
  onlyChanges: onlyProp,
  defaultOnlyChanges = false,
  onOnlyChangesChange,
  onAccept,
  onKeep,
  acceptLabel,
  keepLabel = "Keep previous",
  acceptedText,
  keptText,
  hideActions = false,
  intro: introProp = true,
  className,
}: TracingPaperProps) {
  const demo = before === undefined && after === undefined
  const oldNode = before ?? (demo ? HF_OLD : null)
  const newNode = after ?? (demo ? HF_NEW : null)
  const list = changes ?? (demo ? HF_CHANGES : NONE)
  const agent = agentName ?? (demo ? "Quill" : "Agent")
  const heading = title ?? (demo ? "Homepage rewrite" : "Review the edit")
  const newTag = newLabel ?? `${agent}'s edit`
  const note =
    consequence ??
    (demo ? "Publishing updates harborfinch.example at 09:00 tomorrow. The old version stays in history for 30 days." : undefined)
  const order = React.useMemo(() => list.map((c) => c.id), [list])

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const narrow = React.useSyncExternalStore(subscribeNarrow, getNarrow, getNarrowServer)
  const [innerState, setInner] = React.useState<number | null>(null)
  const inner = innerState ?? clamp(defaultValue ?? (narrow ? 100 : 56), 0, 100)
  const value = clamp(valueProp ?? inner, 0, 100)
  const [onlyInner, setOnlyInner] = React.useState(defaultOnlyChanges)
  const only = onlyProp ?? onlyInner
  const [decision, setDecision] = React.useState<Decision>(null)
  const [hot, setHot] = React.useState<string | null>(null)
  const [locked, setLocked] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [geo, setGeo] = React.useState<Geo>({ w: 0, old: [], next: [] })
  const [introState, setIntroState] = React.useState<"off" | "wait" | "play">(introProp ? "wait" : "off")

  const rootRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const oldRef = React.useRef<HTMLDivElement>(null)
  const newRef = React.useRef<HTMLDivElement>(null)
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const acceptRef = React.useRef<HTMLButtonElement>(null)
  const returning = React.useRef(false)
  const drag = React.useRef<Drag | null>(null)
  const latest = React.useRef({ onValueChange, onOnlyChangesChange })
  const before0 = React.useRef(value)
  React.useEffect(() => {
    latest.current = { onValueChange, onOnlyChangesChange }
  })

  const commit = React.useCallback(
    (v: number) => {
      const n = Math.round(clamp(v, 0, 100) * 10) / 10
      if (valueProp === undefined) setInner(n)
      latest.current.onValueChange?.(n)
    },
    [valueProp],
  )

  /* the stage is as tall as the taller version, and the sheet leans so its edge is 16px off vertical; both are written straight to the DOM before paint */
  const fit = React.useCallback(() => {
    const stage = stageRef.current
    const o = oldRef.current
    const n = newRef.current
    if (!stage || !o || !n) return
    stage.style.minHeight = ""
    const h = Math.ceil(Math.max(o.offsetHeight, n.offsetHeight))
    stage.style.minHeight = `${h}px`
    const sh = stage.clientHeight || h
    if (sh > 0) stage.style.setProperty("--itp-skew", `${(-Math.atan(16 / sh) * 180) / Math.PI}deg`)
  }, [])

  React.useLayoutEffect(() => {
    fit()
  }, [fit, oldNode, newNode])

  /* measure the changed boxes of both versions; re-measure when the size, the content or a web font changes */
  React.useEffect(() => {
    const stage = stageRef.current
    const o = oldRef.current
    const n = newRef.current
    if (!stage || !o || !n) return
    const run = () => {
      fit()
      const next: Geo = { w: stage.clientWidth, old: readBoxes(o), next: readBoxes(n) }
      setGeo((prev) => (prev.w === next.w && sameBoxes(prev.old, next.old) && sameBoxes(prev.next, next.next) ? prev : next))
    }
    const ro = new ResizeObserver(run)
    ro.observe(stage)
    ro.observe(o)
    ro.observe(n)
    const mo = new MutationObserver(run)
    const opts = { subtree: true, childList: true, characterData: true, attributes: true }
    mo.observe(o, opts)
    mo.observe(n, opts)
    const fonts = document.fonts
    fonts?.addEventListener?.("loadingdone", run)
    return () => {
      ro.disconnect()
      mo.disconnect()
      fonts?.removeEventListener?.("loadingdone", run)
    }
  }, [fit])

  /* the first-time lift waits for the display font and for the card to be on screen, so the fold never sweeps through text that is still re-wrapping */
  React.useEffect(() => {
    if (introState !== "wait") return
    const el = rootRef.current
    let alive = true
    let seen = false
    let ready = false
    const go = () => {
      if (alive && seen && ready) setIntroState((s) => (s === "wait" ? "play" : s))
    }
    const fonts = document.fonts
    const loading = fonts?.load ? fonts.load('44px "Instrument Serif"').catch(() => undefined) : Promise.resolve()
    void Promise.resolve(loading)
      .then(() => fonts?.ready)
      .then(() => {
        ready = true
        go()
      })
    const cap = window.setTimeout(() => {
      ready = true
      go()
    }, 2500)
    let io: IntersectionObserver | undefined
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([en]) => {
          if (en?.isIntersecting) {
            seen = true
            io?.disconnect()
            go()
          }
        },
        { threshold: 0.15 },
      )
      io.observe(el)
    } else seen = true
    return () => {
      alive = false
      window.clearTimeout(cap)
      io?.disconnect()
    }
  }, [introState])

  /* after Accept or Keep the buttons are gone: focus moves to Undo, and back to Accept when it is pressed */
  React.useEffect(() => {
    if (decision) undoRef.current?.focus({ preventScroll: true })
    else if (returning.current) {
      returning.current = false
      acceptRef.current?.focus({ preventScroll: true })
    }
  }, [decision])

  /* ---- pointer: the stage and the ruler both drag the fold ---- */
  const focusHandle = () => rootRef.current?.querySelector<HTMLElement>(".itp-handle")?.focus({ preventScroll: true })
  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    const el = e.currentTarget
    const r = (stageRef.current ?? el).getBoundingClientRect()
    const x = e.clientX - r.left
    const cur = edgeX(value, r.width)
    const near = Math.abs(x - cur) < 30
    /* a finger that starts on the page may be scrolling it: wait for sideways movement before taking the fold */
    const defer = e.pointerType === "touch" && !near && !el.classList.contains("itp-handle")
    drag.current = { id: e.pointerId, left: r.left, w: r.width, offset: near ? cur - x : 0, x0: e.clientX, y0: e.clientY, moved: false, defer }
    el.setPointerCapture(e.pointerId)
    if (defer) return
    setIntroState("off")
    if (!near) commit(posOf(x, r.width))
    focusHandle()
    e.preventDefault()
  }
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      const dx = Math.abs(e.clientX - d.x0)
      const dy = Math.abs(e.clientY - d.y0)
      if (d.defer ? dx < 6 || dx < dy : dx < 3) return
      d.moved = true
      if (d.defer) d.offset = 0
      setDragging(true)
      setIntroState("off")
    }
    commit(posOf(e.clientX - d.left + d.offset, d.w))
  }
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (d?.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    if (d.defer && !d.moved) {
      setIntroState("off")
      commit(posOf(e.clientX - d.left, d.w))
      focusHandle()
    }
  }
  const onCancel = (e: React.PointerEvent<HTMLElement>) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    let next: number | null = null
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = e.shiftKey ? value + 1 : Math.floor(value / 5 + 1e-6) * 5 + 5
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = e.shiftKey ? value - 1 : Math.ceil(value / 5 - 1e-6) * 5 - 5
    else if (e.key === "PageUp") next = value + 20
    else if (e.key === "PageDown") next = value - 20
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = 100
    if (next === null) return
    e.preventDefault()
    setIntroState("off")
    commit(next)
  }

  const setOnly = (on: boolean) => {
    if (onlyProp === undefined) setOnlyInner(on)
    latest.current.onOnlyChangesChange?.(on)
  }

  /* park the fold just past the new value, so the whole of it reads clean; a removed element gets the fold just before it */
  const foldFor = (id: string) => {
    const nb = geo.next.find((x) => x.id === id)
    const ob = geo.old.find((x) => x.id === id)
    if (!geo.w) return null
    if (nb) return posOf(nb.x + nb.w + 14, geo.w)
    if (ob) return posOf(ob.x - 14, geo.w)
    return null
  }
  const pick = (id: string) => {
    setIntroState("off")
    if (locked === id) {
      setLocked(null)
      return
    }
    setLocked(id)
    const c = foldFor(id)
    if (c !== null) commit(c)
  }

  const accept = () => {
    before0.current = value
    setDecision("accepted")
    setLocked(null)
    setIntroState("off")
    commit(100)
    onAccept?.()
  }
  const keep = () => {
    before0.current = value
    setDecision("kept")
    setLocked(null)
    setIntroState("off")
    commit(0)
    onKeep?.()
  }
  const undo = () => {
    returning.current = true
    setDecision(null)
    commit(before0.current)
  }

  const has = (id: string) => ({ o: geo.old.some((b) => b.id === id), n: geo.next.some((b) => b.id === id) })
  const kindOf = (id: string) => {
    const h = has(id)
    return h.n && !h.o ? "added" : h.o && !h.n ? "removed" : "changed"
  }
  const kindWord = { added: "Added", removed: "Removed", changed: "Changed" } as const

  const focus = hot ?? locked
  const spot = locked ?? null
  const holes = (spot ? [...geo.old, ...geo.next].filter((b) => b.id === spot) : [...geo.old, ...geo.next]).map((b) => ({ ...b, k: b.id }))
  const veil = only ? "only" : spot ? "spot" : undefined
  const pct = Math.round(value)
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5)
  const n = list.length
  const acceptText = acceptLabel ?? (n === 1 ? "Accept change" : n > 1 ? `Accept ${n} changes` : "Accept edit")
  const sel = locked ? list.find((c) => c.id === locked) : undefined

  return (
    <section
      ref={rootRef}
      className={["itp", className].filter(Boolean).join(" ")}
      data-intro={introState === "off" ? undefined : introState}
      data-drag={dragging ? "" : undefined}
      data-decision={decision ?? undefined}
      style={{ "--itp-pos": value / 100 } as React.CSSProperties}
      role="group"
      aria-label={heading}
      onKeyDown={(e) => {
        if (e.key === "Escape" && locked) setLocked(null)
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === "itp-lift") setIntroState("off")
      }}
    >
      <style href="tracing-paper" precedence="default">
        {CSS}
      </style>

      <header className="itp-head">
        <span className="itp-agent" aria-hidden="true">
          {agent.slice(0, 1)}
        </span>
        <div className="itp-titles">
          <div className="itp-title">{heading}</div>
          <div className="itp-meta">{subtitle ?? `${agent} · ${n} ${n === 1 ? "change" : "changes"}${demo ? " · harborfinch.example" : ""}`}</div>
        </div>
        <button type="button" role="switch" aria-checked={only} className="itp-switch" onClick={() => setOnly(!only)}>
          <span className="itp-track" aria-hidden="true" />
          Show only changes
        </button>
      </header>

      <div className="itp-wrap">
        <span className="itp-tag" data-s="new" aria-hidden="true">
          {newTag}
        </span>
        <span className="itp-tag" data-s="old" aria-hidden="true">
          {oldLabel}
        </span>
        <div
          ref={stageRef}
          className="itp-stage"
          data-drag={dragging ? "" : undefined}
          aria-hidden="true"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        >
          <div className="itp-old" inert>
            <div ref={oldRef} className="itp-content">
              <Layer>{oldNode}</Layer>
              <span className="itp-reg" data-p="a" />
              <span className="itp-reg" data-p="b" />
            </div>
            <Marks boxes={geo.old} side="old" order={order} hot={focus} />
          </div>

          <div className="itp-sheet" inert>
            <div className="itp-sheet-in">
              <div ref={newRef} className="itp-content">
                <Layer>{newNode}</Layer>
                <span className="itp-reg" data-p="a" />
                <span className="itp-reg" data-p="b" />
              </div>
              <Marks boxes={geo.next} side="new" order={order} hot={focus} />
            </div>
          </div>

          <svg className="itp-veil" data-v={veil}>
            <defs>
              <mask id={`itp-m-${uid}`}>
                <rect width="100%" height="100%" fill="#fff" />
                {holes.map((b, i) => (
                  <rect key={b.k + i} x={b.x - 9} y={b.y - 9} width={b.w + 18} height={b.h + 18} rx={b.r + 9} fill="#000" />
                ))}
              </mask>
            </defs>
            <rect className="itp-veil-fill" width="100%" height="100%" mask={`url(#itp-m-${uid})`} />
          </svg>

          <div className="itp-fold">
            <i className="itp-curl" />
            <i className="itp-lip" />
            <i className="itp-crease" />
            <i className="itp-cast" />
          </div>
        </div>

        <div className="itp-capwrap" aria-live="polite">
          {sel && (sel.was || sel.now) && (
            <div key={sel.id} className="itp-cap">
              <b>
                {list.indexOf(sel) + 1} · {sel.label}
              </b>
              {sel.was && (
                <p data-w="">
                  <span>Was</span>
                  <em>{sel.was}</em>
                </p>
              )}
              {sel.now && (
                <p data-n="">
                  <span>Now</span>
                  <em>{sel.now}</em>
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className="itp-handle"
          role="slider"
          tabIndex={0}
          aria-label={`Fold line between ${oldLabel.toLowerCase()} and ${newTag}`}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% of the page shows the new version`}
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        >
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
            <path d="M4.5 6 1.5 11l3 5M9.5 6l3 5-3 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="itp-ruler">
        <div className="itp-readout">
          <span>
            <b>{pct}%</b> shows {newTag}
          </span>
          <span className="itp-hint">
            <span data-m="">Drag to compare</span>
            <span data-k="">Arrow keys step 5%, Shift 1%</span>
          </span>
        </div>
        <div className="itp-scale" aria-hidden="true" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
          {ticks.map((t) => (
            <i key={t} className="itp-tick" data-m={t % 25 === 0 ? "" : undefined} style={{ left: `${t}%` }} />
          ))}
          <i className="itp-pin" />
        </div>
        <div className="itp-ends" aria-hidden="true">
          <span>{oldLabel} only</span>
          <span>New only</span>
        </div>
      </div>

      {list.length > 0 && (
        <ul className="itp-list" aria-label="Changes">
          {list.map((c, i) => {
            const k = kindOf(c.id)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="itp-row"
                  aria-pressed={locked === c.id}
                  onClick={() => pick(c.id)}
                  onPointerEnter={() => setHot(c.id)}
                  onPointerLeave={() => setHot((h) => (h === c.id ? null : h))}
                  onFocus={() => setHot(c.id)}
                  onBlur={() => setHot((h) => (h === c.id ? null : h))}
                >
                  <span className="itp-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="itp-lab">{c.label}</span>
                  <span className="itp-kind" data-k={k}>
                    {c.note ?? kindWord[k]}
                  </span>
                  {(c.was || c.now) && (
                    <span className="itp-sr">
                      {c.was ? `. Was: ${c.was}` : ""}
                      {c.now ? `. Now: ${c.now}` : ""}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {(!hideActions || note) && (
        <footer className="itp-foot">
          <div className="itp-msg" aria-live="polite">
            {decision === "accepted" ? (
              <div key="a" className="itp-msg-ok">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity=".35" />
                  <path d="m4.8 8.2 2.2 2.2 4.2-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  {acceptedText ?? (demo ? "Accepted. Goes live on harborfinch.example at 09:00 tomorrow." : "Accepted.")}
                  <button type="button" ref={undoRef} className="itp-undo" onClick={undo}>
                    Undo
                  </button>
                </span>
              </div>
            ) : decision === "kept" ? (
              <div key="k">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity=".35" />
                  <path d="M5 8h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span>
                  {keptText ?? `Kept the previous version. ${agent}'s edit stays in history.`}
                  <button type="button" ref={undoRef} className="itp-undo" onClick={undo}>
                    Undo
                  </button>
                </span>
              </div>
            ) : (
              <div key="n">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity=".35" />
                  <path d="M8 4.6V8l2.2 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{note ?? "Nothing changes until you accept."}</span>
              </div>
            )}
          </div>
          {!hideActions && !decision && (
            <div className="itp-btns">
              <button type="button" className="itp-btn" data-v="ghost" onClick={keep}>
                {keepLabel}
              </button>
              <button type="button" ref={acceptRef} className="itp-btn" data-v="solid" onClick={accept}>
                {acceptText}
              </button>
            </div>
          )}
        </footer>
      )}
    </section>
  )
}

export default TracingPaper
