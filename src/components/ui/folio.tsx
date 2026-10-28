"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FolioFeature = {
  /** Key that each panel's `values` uses for this row. */
  id: string
  /** Row name shown in the left rail, e.g. "First reply". */
  label: string
  /** Small second line under the label, e.g. "to first word". */
  detail?: string
  /** Which way is better for `amount`. Decides whether a difference is drawn as good or as a warning. */
  better?: "higher" | "lower"
  /** Word after "3.1×" when a panel has a higher amount than the selected one. Default "more". */
  moreWord?: string
  /** Word after "3.1×" when a panel has a lower amount than the selected one. Default "less". */
  lessWord?: string
}

export type FolioValue = {
  /** What the cell says. Always words or numbers, never only a colour. */
  text: string
  /** A 0 to 5 level, drawn as five pips under the text. */
  level?: number
  /** A number to compare. Panels other than the selected one show how it differs ("2.3× faster"). */
  amount?: number
  /** A short second line when there is no difference to show, e.g. "to 50 MB". */
  note?: string
}

export type FolioPanel = {
  id: string
  /** Panel title, e.g. "Atlas". */
  name: string
  /** One short line under the name. */
  tagline?: string
  /** 14px glyph in the tile. Default: a small shape. */
  icon?: React.ReactNode
  /** A tab above the panel, e.g. "Recommended". */
  badge?: string
  /** The big number on the folded cover. */
  hero?: { value: string; label: string }
  /** One value per feature id. */
  values: Record<string, FolioValue | undefined>
  /** What picking this panel means, in plain words. Shown under the folio. */
  consequence?: string
  /** What is shown after the person confirms. */
  confirmation?: string
}

export type FolioProps = {
  /** Two or three panels. Default: three models (Nova, Atlas, Sage) for a support desk. */
  panels?: FolioPanel[]
  /** The shared rows. Required when you pass your own `panels`. */
  features?: FolioFeature[]
  /** Heading above the folio. */
  title?: string
  /** Line under the heading. */
  subtitle?: string
  /** Selected panel id (controlled). */
  value?: string
  /** Starting selection when uncontrolled. Default: the middle panel. */
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Whether the folio is unfolded (controlled). */
  open?: boolean
  /** Starting state when uncontrolled. Default true. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called when the person confirms the selected panel. */
  onChoose?: (panel: FolioPanel) => void
  /** Text of the confirm button. Default "Choose <name>". */
  actionLabel?: (panel: FolioPanel) => string
  /** Text of the confirm button once confirmed. Default "<name> chosen". */
  doneLabel?: (panel: FolioPanel) => string
  /** Unfold once when the piece first scrolls into view. Default true. */
  intro?: boolean
  "aria-label"?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
@property --ifo-k1 { syntax: "<number>"; inherits: true; initial-value: 0 }
@property --ifo-k2 { syntax: "<number>"; inherits: true; initial-value: 0 }

.ifo {
  --ifo-ink: #000;
  --ifo-surface: #fff;
  --ifo-accent: #0060e2;
  --ifo-t1: color-mix(in oklab, var(--ifo-ink) 88%, transparent);
  --ifo-t2: color-mix(in oklab, var(--ifo-ink) 68%, transparent);
  --ifo-t3: color-mix(in oklab, var(--ifo-ink) 58%, transparent);
  --ifo-t4: color-mix(in oklab, var(--ifo-ink) 27%, transparent);
  --ifo-fill: color-mix(in oklab, var(--ifo-ink) 5%, transparent);
  --ifo-line: color-mix(in oklab, var(--ifo-ink) 7%, transparent);
  --ifo-good: #17874a;
  --ifo-warn: #b45f06;
  --ifo-crease: rgb(12 18 40 / .2);
  --ifo-tint: rgb(12 18 40 / .06);
  --ifo-rim: rgb(255 255 255 / .9);
  --ifo-glint: rgb(255 255 255 / .82);
  --ifo-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ifo-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 2px rgb(0 0 0 / .08), 0 10px 22px -8px rgb(0 0 0 / .24);
  --ifo-ease: cubic-bezier(.22, 1, .36, 1);
  --ifo-swing: cubic-bezier(.45, .05, .2, 1);
  --ifo-max: 58deg;
  --ifo-k1: 0;
  --ifo-k2: 0;
  --ifo-f1: calc(var(--ifo-k1) * var(--ifo-max));
  --ifo-f2: calc(var(--ifo-k2) * var(--ifo-max));
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 880px;
  container-type: inline-size;
  color: var(--ifo-t1);
  font: 13px/20px var(--ifo-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  text-align: left;
  transition: --ifo-k1 .85s var(--ifo-swing) 0s, --ifo-k2 .85s var(--ifo-swing) .16s;
}
.ifo[data-open="false"] {
  --ifo-k1: 1;
  --ifo-k2: 1;
  transition: --ifo-k1 .75s var(--ifo-swing) .16s, --ifo-k2 .75s var(--ifo-swing) 0s;
}
.ifo[data-quiet="true"] { transition: none !important }
:is(.dark, [data-theme="dark"]) .ifo {
  --ifo-ink: #fff;
  --ifo-surface: #1c1c1e;
  --ifo-accent: #4d8dff;
  --ifo-t1: color-mix(in oklab, var(--ifo-ink) 90%, transparent);
  --ifo-t2: color-mix(in oklab, var(--ifo-ink) 72%, transparent);
  --ifo-t3: color-mix(in oklab, var(--ifo-ink) 60%, transparent);
  --ifo-t4: color-mix(in oklab, var(--ifo-ink) 28%, transparent);
  --ifo-fill: color-mix(in oklab, var(--ifo-ink) 7%, transparent);
  --ifo-line: color-mix(in oklab, var(--ifo-ink) 9%, transparent);
  --ifo-good: #4cc27f;
  --ifo-warn: #f0b35a;
  --ifo-crease: rgb(0 0 0 / .5);
  --ifo-tint: rgb(0 0 0 / .22);
  --ifo-rim: rgb(255 255 255 / .09);
  --ifo-glint: rgb(255 255 255 / .5);
  --ifo-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ifo-float: 0 0 0 .5px rgb(255 255 255 / .14), 0 1px 2px rgb(0 0 0 / .4), 0 12px 24px -8px rgb(0 0 0 / .6);
}
.ifo *, .ifo *::before, .ifo *::after { box-sizing: border-box }
:where(.ifo) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.ifo) :is(p, dl, dd, dt) { margin: 0 }
.ifo :focus-visible { outline: 2px solid var(--ifo-accent); outline-offset: 2px }
.ifo-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* ---- heading row ---- */
.ifo-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px }
.ifo-title { font-size: 15px; line-height: 22px; font-weight: 500; letter-spacing: -.005em; color: var(--ifo-t1) }
.ifo-sub0 { color: var(--ifo-t3); font-size: 12.5px; line-height: 18px }
.ifo-fold { position: relative; display: inline-flex; flex: none; align-items: center; gap: 6px; height: 28px; padding: 0 10px 0 8px; border-radius: 8px; background: var(--ifo-fill); color: var(--ifo-t2); font-size: 12.5px; font-weight: 500; transition: background .2s var(--ifo-ease), color .2s var(--ifo-ease), transform .15s var(--ifo-ease) }
.ifo-fold:hover { color: var(--ifo-t1); background: color-mix(in oklab, var(--ifo-ink) 9%, transparent) }
.ifo-fold:active { transform: scale(.97) }
.ifo-fold svg { flex: none }
.ifo-fold-l, .ifo-fold-r { transform-box: fill-box; transition: transform .5s var(--ifo-ease) }
.ifo-fold-l { transform-origin: 100% 50% }
.ifo-fold-r { transform-origin: 0 50% }
.ifo-fold[aria-expanded="false"] .ifo-fold-l { transform: skewY(-18deg) scaleX(.7) }
.ifo-fold[aria-expanded="false"] .ifo-fold-r { transform: skewY(18deg) scaleX(.7) }

/* ---- stage: the desk the leaves are hinged on ---- */
.ifo-stage {
  --ifo-pt: 28px;
  --ifo-pl: 164px;
  --ifo-pr: 16px;
  --ifo-rail: 140px;
  --ifo-hh: 88px;
  --ifo-rh: 50px;
  --ifo-gap: 8px;
  --ifo-zoom: .2;
  --ifo-lw: calc((100cqw - var(--ifo-pl) - var(--ifo-pr) - (var(--ifo-n) - 1) * var(--ifo-gap)) / var(--ifo-n));
  --ifo-shift: calc((var(--ifo-pr) - var(--ifo-pl)) / 2);
  /* the rows area shrinks to a cover when folded; one number drives every height */
  --ifo-rowsh: calc(var(--ifo-rh) * var(--ifo-rows));
  --ifo-fh: min(var(--ifo-rowsh), max(176px, calc(var(--ifo-rowsh) * .6)));
  --ifo-bh: calc(var(--ifo-rowsh) - (var(--ifo-rowsh) - var(--ifo-fh)) * var(--ifo-k1));
  --ifo-ph: calc(var(--ifo-hh) + 10px + var(--ifo-bh));
  position: relative;
  padding: var(--ifo-pt) var(--ifo-pr) 16px var(--ifo-pl);
  border-radius: 22px;
  background: var(--ifo-fill);
}
.ifo-lane {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--ifo-n), minmax(0, 1fr));
  column-gap: var(--ifo-gap);
  perspective: 1500px;
  perspective-origin: 50% 35%;
  transform-origin: calc(50% + var(--ifo-shift)) 0;
  transform: scale(calc(1 + var(--ifo-zoom) * var(--ifo-k1)));
  margin-bottom: calc(var(--ifo-ph) * var(--ifo-zoom) * var(--ifo-k1));
}

/* shared rail: row names, drawn once for every panel */
.ifo-rail {
  position: absolute;
  z-index: 3;
  top: calc(var(--ifo-pt) + var(--ifo-hh));
  left: 16px;
  width: var(--ifo-rail);
  pointer-events: none;
  opacity: clamp(0, calc((.55 - var(--ifo-k1)) * 5), 1);
}
.ifo-rail-rows { height: var(--ifo-bh); overflow: hidden }
.ifo-rail-row { display: flex; flex-direction: column; justify-content: center; height: var(--ifo-rh); padding-right: 8px; box-shadow: inset 0 .5px 0 var(--ifo-line) }
.ifo-rail-row:first-child { box-shadow: none }
.ifo-rail-l { color: var(--ifo-t2); font-size: 12.5px; line-height: 18px; font-weight: 500 }
.ifo-rail-d { color: var(--ifo-t3); font-size: 12px; line-height: 15px }
.ifo-rail-cap { position: absolute; left: 0; top: calc(var(--ifo-hh) * -1 + 16px); display: flex; flex-direction: column; gap: 2px }
.ifo-rail-cap span { color: var(--ifo-t3); font-size: 12px; line-height: 16px }
.ifo-rail-cap b { font-size: 15px; line-height: 20px; font-weight: 500; letter-spacing: -.005em; color: var(--ifo-t1) }

/* the single ring that glides to the selected leaf */
.ifo-plate {
  position: absolute;
  z-index: 0;
  top: -1.5px;
  left: -1.5px;
  height: calc(var(--ifo-ph) + 3px);
  width: calc(var(--ifo-lw) + 3px);
  border-radius: 13.5px;
  border: 1.5px solid var(--ifo-accent);
  box-shadow: 0 12px 28px -10px color-mix(in oklab, var(--ifo-accent) 42%, transparent);
  transform: translateX(calc(var(--ifo-sel) * (var(--ifo-lw) + var(--ifo-gap))));
  transition: transform .55s var(--ifo-ease);
  opacity: clamp(0, calc(1 - var(--ifo-k1) * 4), 1);
  pointer-events: none;
}

/* ---- a leaf ---- */
.ifo-panel {
  --k: var(--ifo-k1);
  --c: var(--ifo-accent);
  position: relative;
  z-index: 1;
  display: block;
  min-width: 0;
  height: var(--ifo-ph);
  border-radius: 12px;
  background: var(--ifo-surface);
  box-shadow: var(--ifo-shadow), inset 0 .5px 0 var(--ifo-rim);
  cursor: pointer;
  transition: box-shadow .35s var(--ifo-ease), translate .3s var(--ifo-ease);
  transform: translateX(calc(var(--ifo-k1) * var(--ifo-shift)));
}
.ifo-panel[data-u="2"] { --k: var(--ifo-k2) }
.ifo-panel[data-sel="true"] {
  box-shadow: var(--ifo-float), inset 0 .5px 0 var(--ifo-rim);
  background-image: linear-gradient(to bottom, color-mix(in oklab, var(--ifo-accent) 7%, transparent), transparent 150px);
}
.ifo-panel[data-sel="true"][data-live="true"] { cursor: default }
.ifo-panel:has(.ifo-head:focus-visible) { outline: 2px solid var(--ifo-accent); outline-offset: 3px }
@media (hover: hover) {
  .ifo-panel[data-sel="false"]:hover { translate: 0 -2px }
}
@supports (color: oklch(from red l c h)) {
  .ifo-panel[data-i="0"] { --c: oklch(from var(--ifo-accent) l c calc(h - 40)) }
  .ifo-panel[data-i="2"] { --c: oklch(from var(--ifo-accent) l c calc(h + 50)) }
}

/* hinge poses: r = right of the selected leaf, l = left, 1 and 2 = hinges away from it */
.ifo-panel[data-side="r"][data-u="1"] {
  transform-origin: 0 50%;
  transform: translateX(calc(var(--ifo-k1) * var(--ifo-shift))) rotateY(var(--ifo-f1));
}
.ifo-panel[data-side="l"][data-u="1"] {
  transform-origin: 100% 50%;
  transform: translateX(calc(var(--ifo-k1) * var(--ifo-shift))) rotateY(calc(var(--ifo-f1) * -1));
}
@supports (width: calc(1px * cos(0deg))) {
  .ifo-panel[data-side="r"][data-u="2"] {
    transform-origin: 0 50%;
    transform: translateX(calc(var(--ifo-k1) * var(--ifo-shift)))
      translate3d(calc(var(--ifo-lw) * (cos(var(--ifo-f1)) - 1)), 0, calc(var(--ifo-lw) * sin(var(--ifo-f1)) * -1))
      rotateY(calc(var(--ifo-f1) - var(--ifo-f2)));
  }
  .ifo-panel[data-side="l"][data-u="2"] {
    transform-origin: 100% 50%;
    transform: translateX(calc(var(--ifo-k1) * var(--ifo-shift)))
      translate3d(calc(var(--ifo-lw) * (1 - cos(var(--ifo-f1)))), 0, calc(var(--ifo-lw) * sin(var(--ifo-f1)) * -1))
      rotateY(calc(var(--ifo-f2) - var(--ifo-f1)));
  }
}

/* soft inner shadow in the fold, and the shade of a leaf that turns away */
.ifo-panel::before, .ifo-panel::after { content: ""; position: absolute; inset: 0; z-index: 4; border-radius: inherit; pointer-events: none }
.ifo-panel[data-side="r"]::before { background: linear-gradient(90deg, var(--ifo-crease) 0, color-mix(in oklab, var(--ifo-crease) 30%, transparent) 9%, transparent 40%) }
.ifo-panel[data-side="l"]::before { background: linear-gradient(270deg, var(--ifo-crease) 0, color-mix(in oklab, var(--ifo-crease) 30%, transparent) 9%, transparent 40%) }
.ifo-panel::before { opacity: calc(.2 + .8 * var(--k)) }
.ifo-panel[data-side="r"]::after, .ifo-panel[data-side="l"]::after { background: var(--ifo-tint); opacity: var(--k) }
.ifo-panel[data-side="c"]::before { background: none }

.ifo-badge {
  position: absolute;
  z-index: 5;
  top: -10px;
  left: 14px;
  height: 20px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--ifo-accent);
  color: #fff;
  font-size: 11.5px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgb(0 0 0 / .18);
}

/* header: this is the leaf's button */
.ifo-head {
  position: relative;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  grid-template-areas: "tile name" "state state";
  align-content: start;
  column-gap: 10px;
  width: 100%;
  height: var(--ifo-hh);
  padding: 16px 14px 0;
  border-radius: 12px 12px 0 0;
  box-shadow: inset 0 -.5px 0 var(--ifo-line);
}
.ifo .ifo-head:focus-visible { outline: none }
.ifo-tile { grid-area: tile; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--ifo-fill); color: var(--ifo-t2); transition: background .35s var(--ifo-ease), color .35s var(--ifo-ease) }
.ifo-panel[data-sel="true"] .ifo-tile { background: var(--ifo-accent); color: #fff }
.ifo-name { grid-area: name; display: block; min-width: 0; align-self: center }
.ifo-name b { display: block; font-size: 15px; line-height: 18px; font-weight: 500; letter-spacing: -.005em }
.ifo-tag { display: block; overflow: hidden; color: var(--ifo-t3); font-size: 12px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap }
.ifo-state { grid-area: state; display: flex; align-items: center; gap: 5px; margin-top: 12px; color: var(--ifo-t3); font-size: 12px; line-height: 16px; white-space: nowrap }
.ifo-panel[data-sel="true"] .ifo-state { color: var(--ifo-accent); font-weight: 500 }
.ifo-state svg { flex: none }

/* body: the feature rows, and the cover that replaces them when folded */
.ifo-body { position: absolute; top: var(--ifo-hh); right: 0; bottom: 0; left: 0; overflow: hidden; border-radius: 0 0 12px 12px }
.ifo-rows { --o: clamp(0, calc((.55 - var(--k)) * 5), 1); margin: 0; opacity: var(--o); filter: blur(calc((1 - var(--o)) * 4px)) }
.ifo-row { display: block; height: var(--ifo-rh) }
.ifo-row + .ifo-row { box-shadow: inset 0 .5px 0 var(--ifo-line) }
.ifo-cell { display: flex; flex-direction: column; justify-content: flex-start; height: 100%; padding: 7px 14px 0; min-width: 0 }
.ifo-val { overflow: hidden; color: var(--ifo-t1); font-size: 13.5px; line-height: 20px; font-weight: 500; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap }
.ifo-sub { display: flex; align-items: center; gap: 6px; overflow: hidden; color: var(--ifo-t3); font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap }
.ifo-sub[data-tone="good"], .ifo-lv[data-tone="good"] { color: var(--ifo-good) }
.ifo-sub[data-tone="warn"], .ifo-lv[data-tone="warn"] { color: var(--ifo-warn) }
.ifo-sub svg { flex: none }
.ifo-lv { white-space: nowrap; color: var(--ifo-t3) }
.ifo-pips { display: inline-flex; flex: none; gap: 3px }
.ifo-pips i { width: 12px; height: 4px; border-radius: 2px; background: var(--ifo-ink); opacity: .14 }
.ifo-pips i[data-on="true"] { background: var(--ifo-accent); opacity: 1 }
.ifo-in { animation: ifo-in .42s var(--ifo-ease) backwards }
@keyframes ifo-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }

/* folded cover: the price, a dither wash in the model's own hue, and the way back in */
.ifo-cover {
  --o: clamp(0, calc((var(--k) - .36) * 4), 1);
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 14px 14px;
  opacity: var(--o);
  filter: blur(calc((1 - var(--o)) * 5px));
  pointer-events: none;
}
.ifo-art {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, color-mix(in oklab, var(--c) 82%, transparent) var(--ifo-dot), transparent calc(var(--ifo-dot) + .6px)) 0 0 / 9px 9px;
  -webkit-mask-image: radial-gradient(115% 85% at 100% 100%, #000 0, transparent 76%);
  mask-image: radial-gradient(115% 85% at 100% 100%, #000 0, transparent 76%);
  opacity: .9;
}
.ifo-hero, .ifo-hint { position: relative }
.ifo-hero b { display: block; font-size: 44px; line-height: 46px; font-weight: 500; letter-spacing: -.04em; font-variant-numeric: tabular-nums }
.ifo-hero span { display: block; margin-top: 2px; color: var(--ifo-t2); font-size: 12px; line-height: 16px }
.ifo-hint { display: inline-flex; align-items: center; gap: 5px; width: fit-content; max-width: 100%; height: 26px; padding: 0 9px; border-radius: 7px; background: var(--ifo-surface); box-shadow: var(--ifo-shadow); color: var(--ifo-accent); font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden }
.ifo-hint span { overflow: hidden; text-overflow: ellipsis }

/* ---- footer: the consequence, and the commit ---- */
.ifo-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px }
.ifo-line { flex: 1 1 300px; min-height: 40px; max-width: 58ch; margin: 0; color: var(--ifo-t2); font-size: 13px; line-height: 20px }
.ifo-line b { color: var(--ifo-t1); font-weight: 500 }
.ifo-cta {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border-radius: 9px;
  background: var(--ifo-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  transition: background .25s var(--ifo-ease), color .25s var(--ifo-ease), transform .15s var(--ifo-ease);
}
.ifo-cta:hover { background: color-mix(in oklab, var(--ifo-accent) 88%, var(--ifo-ink)) }
.ifo-cta:active { transform: scale(.97) }
.ifo-cta[data-done="true"] { background: var(--ifo-fill); color: var(--ifo-t1); cursor: default }
.ifo-cta svg path { stroke-dasharray: 14; stroke-dashoffset: 0; animation: ifo-draw .4s var(--ifo-ease) .05s backwards }
@keyframes ifo-draw { from { stroke-dashoffset: 14 } }

/* ---- narrow: names sit above the values, one stage column per leaf ---- */
@container (max-width: 679px) {
  .ifo-stage { --ifo-pt: 26px; --ifo-pl: 10px; --ifo-pr: 10px; --ifo-rail: 0px; --ifo-hh: 92px; --ifo-rh: 72px; --ifo-gap: 6px; --ifo-zoom: .16; border-radius: 18px }
  .ifo-rail { left: 10px; right: 10px; width: auto }
  .ifo-rail-row { justify-content: flex-start; padding: 7px 0 0 }
  .ifo-rail-l { font-size: 11px; line-height: 14px; font-weight: 500; white-space: nowrap }
  .ifo-rail-d, .ifo-rail-cap { display: none }
  .ifo-head { grid-template-columns: minmax(0, 1fr); grid-template-areas: "tile" "name" "state"; row-gap: 6px; padding: 12px 10px 0 }
  .ifo-tile { width: 24px; height: 24px; border-radius: 7px }
  .ifo-name b { font-size: 14px }
  .ifo-state { margin-top: 0; font-size: 11.5px }
  .ifo-cell { padding: 24px 10px 0 }
  .ifo-val { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; font-size: 13px; line-height: 16px; white-space: normal; overflow-wrap: anywhere }
  .ifo-sub { font-size: 11.5px; gap: 4px }
  .ifo-pips { gap: 2px }
  .ifo-pips i { width: 8px }
  .ifo-cover { padding: 12px 10px 10px }
  .ifo-hero b { font-size: 30px; line-height: 32px }
  .ifo-badge { left: 8px; font-size: 11px }
}
@container (max-width: 439px) {
  .ifo-cell { padding-left: 8px; padding-right: 6px }
  .ifo-val { font-size: 12.5px; letter-spacing: -.01em }
  .ifo-tag { display: none }
  .ifo-fold-t { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
  .ifo-fold { padding: 0 8px }
  .ifo-lv-w { display: none }
  .ifo-hint span { display: none }
  .ifo-hint { padding: 0 7px }
}

/* reduced motion: no hinges, no sliding; the folded cover and the rows cross-fade */
@media (prefers-reduced-motion: reduce) {
  .ifo { --ifo-max: 0deg; transition: --ifo-k1 .25s linear 0s, --ifo-k2 .25s linear 0s }
  .ifo[data-open="false"] { transition: --ifo-k1 .25s linear 0s, --ifo-k2 .25s linear 0s }
  .ifo-stage { --ifo-shift: 0px; --ifo-zoom: 0 }
  .ifo *, .ifo *::before, .ifo *::after { animation: none !important }
  .ifo-rail { opacity: clamp(0, calc((.5 - var(--ifo-k1)) * 3), 1) }
  .ifo-rows { --o: clamp(0, calc((.5 - var(--k)) * 3), 1); filter: none }
  .ifo-cover { --o: clamp(0, calc((var(--k) - .3) * 2.5), 1); filter: none }
  .ifo-panel::after { display: none }
  .ifo-panel::before { opacity: .25 }
  .ifo-plate, .ifo-panel, .ifo-fold-l, .ifo-fold-r, .ifo-cta, .ifo-fold { transition: none }
}

@media (forced-colors: active) {
  .ifo-plate { border-color: Highlight }
  .ifo-panel { outline: 1px solid CanvasText }
  .ifo-pips i { background: GrayText; opacity: 1 }
  .ifo-pips i[data-on="true"] { background: CanvasText }
  .ifo-cta { border: 1px solid ButtonText }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

const Star = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1.2l1.8 5 5 1.8-5 1.8L8 14.8l-1.8-5-5-1.8 5-1.8z" />
  </svg>
)
const Ring = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="8" cy="8" r="5.4" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)
const Peak = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 2l6.2 11.2H1.8z" />
  </svg>
)
const GLYPHS = [Star, Ring, Peak]

const DEFAULT_FEATURES: FolioFeature[] = [
  { id: "context", label: "Context window", detail: "per conversation", better: "higher", moreWord: "larger", lessWord: "smaller" },
  { id: "reply", label: "First reply", detail: "to the first word", better: "lower", moreWord: "slower", lessWord: "faster" },
  { id: "reasoning", label: "Reasoning", detail: "on hard questions", better: "higher" },
  { id: "tools", label: "Tool calls", detail: "per ticket", better: "higher", moreWord: "more", lessWord: "fewer" },
  { id: "reads", label: "Reads", detail: "attachments" },
  { id: "handoff", label: "Needs a person", detail: "chats handed over", better: "lower", moreWord: "more", lessWord: "fewer" },
  { id: "cost", label: "Per 1M tokens", detail: "input and output", better: "lower", moreWord: "pricier", lessWord: "cheaper" },
]

const DEFAULT_PANELS: FolioPanel[] = [
  {
    id: "nova",
    name: "Nova",
    tagline: "Quick and thrifty",
    hero: { value: "$24", label: "a month at 40k tickets" },
    values: {
      context: { text: "128k", amount: 128 },
      reply: { text: "0.4 s", amount: 0.4 },
      reasoning: { text: "Light", level: 2 },
      tools: { text: "Up to 8", amount: 8 },
      reads: { text: "Images", note: "to 10 MB" },
      handoff: { text: "16%", amount: 16 },
      cost: { text: "$0.60", amount: 0.6 },
    },
    consequence: "Answers 40,000 tickets a month for about $24. Replies start in 0.4 s, but 1 chat in 6 goes to a person.",
    confirmation: "Nova answers new Harbor & Finch tickets from now on. Open chats finish on their current model.",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Balanced default",
    badge: "Recommended",
    hero: { value: "$120", label: "a month at 40k tickets" },
    values: {
      context: { text: "400k", amount: 400 },
      reply: { text: "0.9 s", amount: 0.9 },
      reasoning: { text: "Balanced", level: 4 },
      tools: { text: "Up to 40", amount: 40 },
      reads: { text: "Images, PDF", note: "to 50 MB" },
      handoff: { text: "5%", amount: 5 },
      cost: { text: "$3.00", amount: 3 },
    },
    consequence: "Answers 40,000 tickets a month for about $120. Replies start in under a second, and only 1 chat in 20 goes to a person.",
    confirmation: "Atlas answers new Harbor & Finch tickets from now on. Open chats finish on their current model.",
  },
  {
    id: "sage",
    name: "Sage",
    tagline: "Slow and thorough",
    hero: { value: "$480", label: "a month at 40k tickets" },
    values: {
      context: { text: "1M", amount: 1000 },
      reply: { text: "1.8 s", amount: 1.8 },
      reasoning: { text: "Deep", level: 5 },
      tools: { text: "Up to 120", amount: 120 },
      reads: { text: "Any media", note: "to 200 MB" },
      handoff: { text: "3%", amount: 3 },
      cost: { text: "$12.00", amount: 12 },
    },
    consequence: "Answers 40,000 tickets a month for about $480. Best for refund disputes and long threads, with replies starting in 1.8 s.",
    confirmation: "Sage answers new Harbor & Finch tickets from now on. Open chats finish on their current model.",
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Diff = { text: string; tone: "good" | "warn" | "none"; word?: string }

const fmt = (x: number) => (x >= 10 ? String(Math.round(x)) : x.toFixed(1).replace(/\.0$/, ""))

function diff(f: FolioFeature, v: FolioValue, base: FolioValue): Diff | null {
  if (v.amount == null || base.amount == null || base.amount === 0) return null
  const r = v.amount / base.amount
  if (r > 0.95 && r < 1.05) return { text: "About the same", tone: "none" }
  const up = r > 1
  const word = up ? (f.moreWord ?? "more") : (f.lessWord ?? "less")
  const good = f.better ? (up ? f.better === "higher" : f.better === "lower") : undefined
  return { text: `${fmt(up ? r : 1 / r)}× ${word}`, tone: good === undefined ? "none" : good ? "good" : "warn" }
}

function levelDiff(f: FolioFeature, v: FolioValue, base: FolioValue): Diff | null {
  if (v.level == null || base.level == null) return null
  const d = v.level - base.level
  if (d === 0) return { text: "Same", word: " level", tone: "none" }
  const good = f.better ? (d > 0 ? f.better === "higher" : f.better === "lower") : undefined
  const n = Math.abs(d)
  return { text: `${d > 0 ? "+" : "\u2212"}${n}`, word: n > 1 ? " levels" : " level", tone: good === undefined ? "none" : good ? "good" : "warn" }
}

function useControlled<T>(value: T | undefined, initial: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(initial)
  const controlled = value !== undefined
  const set = (v: T) => {
    if (!controlled) setInner(v)
    onChange?.(v)
  }
  return [controlled ? value : inner, set] as const
}

const CheckMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.4 6.3 4.9 8.7 9.6 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function Folio({
  panels: panelsProp,
  features: featuresProp,
  title,
  subtitle,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen = true,
  onOpenChange,
  onChoose,
  actionLabel,
  doneLabel,
  intro = true,
  "aria-label": ariaLabel,
  className,
}: FolioProps) {
  const demo = !panelsProp
  const panels = (panelsProp ?? DEFAULT_PANELS).slice(0, 3)
  const features = featuresProp ?? (demo ? DEFAULT_FEATURES : [])
  const n = panels.length
  const heading = title ?? (demo ? "Support desk model" : undefined)
  const sub = subtitle ?? (demo ? "Harbor & Finch · 40,000 tickets a month" : undefined)

  const [selected, setSelected] = useControlled(value, defaultValue ?? panels[Math.min(1, n - 1)]?.id ?? "", onValueChange)
  const [isOpen, setOpen] = useControlled(open, defaultOpen, onOpenChange)
  const [confirmed, setConfirmed] = React.useState<string | null>(null)
  /* "wait": rests folded until first seen; "quiet": reduced motion, open with no transition; "done": normal */
  const [introState, setIntroState] = React.useState<"wait" | "quiet" | "done">(intro ? "wait" : "done")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const heads = React.useRef<(HTMLButtonElement | null)[]>([])
  const uid = React.useId()

  /* unfold once when the piece first scrolls into view */
  React.useEffect(() => {
    if (introState !== "wait") return
    const el = rootRef.current
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let t = 0
    if (still || !el || !("IntersectionObserver" in window)) {
      t = window.setTimeout(() => setIntroState(still ? "quiet" : "done"), 0)
      return () => window.clearTimeout(t)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        t = window.setTimeout(() => setIntroState("done"), 320)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [introState])

  if (n === 0) return null

  const selIdx = Math.max(0, panels.findIndex((p) => p.id === selected))
  const sel = panels[selIdx]
  const shownOpen = isOpen && introState !== "wait"
  const isDone = confirmed === sel.id

  const pick = (id: string) => {
    if (id !== selected) setSelected(id)
    if (!isOpen) setOpen(true)
    if (introState !== "done") setIntroState("done")
  }

  const onHeadKey = (e: React.KeyboardEvent, i: number) => {
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(n - 1, i + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    heads.current[to]?.focus()
  }

  const confirm = () => {
    if (isDone) return
    setConfirmed(sel.id)
    onChoose?.(sel)
  }

  const line = isDone ? (sel.confirmation ?? `${sel.name} chosen.`) : (sel.consequence ?? sel.tagline ?? "")
  const ctaText = isDone ? (doneLabel?.(sel) ?? `${sel.name} chosen`) : (actionLabel?.(sel) ?? `Choose ${sel.name}`)

  return (
    <div
      ref={rootRef}
      className={className ? `ifo ${className}` : "ifo"}
      data-open={shownOpen}
      data-quiet={introState === "quiet"}
      style={{ "--ifo-n": n, "--ifo-sel": selIdx, "--ifo-rows": features.length } as React.CSSProperties}
    >
      <style href="folio" precedence="default">
        {CSS}
      </style>

      <div className="ifo-top">
        <div>
          {heading && (
            <div className="ifo-title" id={`${uid}-t`}>
              {heading}
            </div>
          )}
          {sub && <div className="ifo-sub0">{sub}</div>}
        </div>
        <button type="button" className="ifo-fold" aria-expanded={isOpen} aria-controls={`${uid}-s`} onClick={() => {
            if (introState !== "done") setIntroState("done")
            setOpen(!isOpen)
          }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
            <path className="ifo-fold-l" d="M1.8 3.4 7.6 2.6v10.8l-5.8-.8z" />
            <path className="ifo-fold-r" d="M8.4 2.6 14.2 3.4v9.2l-5.8.8z" />
          </svg>
          <span className="ifo-fold-t">{isOpen ? "Fold up" : "Unfold"}</span>
        </button>
      </div>

      <div className="ifo-stage" id={`${uid}-s`} role="group" aria-label={ariaLabel ?? heading ?? "Compare"} aria-labelledby={ariaLabel || !heading ? undefined : `${uid}-t`}>
        <div className="ifo-rail" aria-hidden="true">
          <div className="ifo-rail-cap">
            <span>Differences from</span>
            <b>{sel.name}</b>
          </div>
          <div className="ifo-rail-rows">
            {features.map((f) => (
              <div className="ifo-rail-row" key={f.id}>
                <span className="ifo-rail-l">{f.label}</span>
                {f.detail && <span className="ifo-rail-d">{f.detail}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="ifo-lane">
          <span className="ifo-plate" aria-hidden="true" />
          {panels.map((p, i) => {
            const u = Math.abs(i - selIdx)
            const side = i < selIdx ? "l" : i > selIdx ? "r" : "c"
            const isSel = i === selIdx
            const base = sel.values
            return (
              <div
                key={p.id}
                role="group"
                className="ifo-panel"
                aria-label={p.name}
                data-i={i}
                data-u={u}
                data-side={side}
                data-sel={isSel}
                data-live={shownOpen}
                onClick={() => pick(p.id)}
              >
                {p.badge && (
                  <span className="ifo-badge" id={`${uid}-b${i}`}>
                    {p.badge}
                  </span>
                )}
                <button
                  type="button"
                  className="ifo-head"
                  aria-pressed={isSel}
                  aria-describedby={p.badge ? `${uid}-b${i}` : undefined}
                  tabIndex={isSel ? 0 : -1}
                  ref={(el) => {
                    heads.current[i] = el
                  }}
                  onKeyDown={(e) => onHeadKey(e, i)}
                >
                  <span className="ifo-tile" aria-hidden="true">
                    {p.icon ?? GLYPHS[i % GLYPHS.length]}
                  </span>
                  <span className="ifo-name">
                    <b>{p.name}</b>
                    {p.tagline && <span className="ifo-tag">{p.tagline}</span>}
                  </span>
                  <span className="ifo-state">
                    {isSel ? CheckMark : null}
                    {isSel ? "Your pick" : `vs ${sel.name}`}
                  </span>
                </button>

                <div className="ifo-body">
                  <dl className="ifo-rows">
                    {features.map((f) => {
                      const v = p.values[f.id]
                      if (!v) {
                        return (
                          <div className="ifo-row" key={f.id}>
                            <dt className="ifo-sr">{f.label}</dt>
                            <dd className="ifo-cell">
                              <span className="ifo-val">Not included</span>
                            </dd>
                          </div>
                        )
                      }
                      const b = base[f.id]
                      const d = !isSel && b ? diff(f, v, b) : null
                      const ld = !isSel && b ? levelDiff(f, v, b) : null
                      let subEl: React.ReactNode = null
                      if (v.level != null) {
                        subEl = (
                          <span className="ifo-sub">
                            <span className="ifo-pips" role="img" aria-label={`${f.label}: level ${v.level} of 5`}>
                              {[0, 1, 2, 3, 4].map((k) => (
                                <i key={k} data-on={k < (v.level ?? 0)} />
                              ))}
                            </span>
                            {ld && (
                              <span key={`${sel.id}:${ld.text}`} className="ifo-lv ifo-in" data-tone={ld.tone}>
                                {ld.text}
                                <span className="ifo-lv-w">{ld.word}</span>
                              </span>
                            )}
                          </span>
                        )
                      } else if (d) {
                        subEl = (
                          <span key={`${sel.id}:${d.text}`} className="ifo-sub ifo-in" data-tone={d.tone}>
                            {d.text}
                          </span>
                        )
                      } else if (v.note) subEl = <span className="ifo-sub">{v.note}</span>
                      return (
                        <div className="ifo-row" key={f.id}>
                          <dt className="ifo-sr">{f.label}</dt>
                          <dd className="ifo-cell">
                            <span className="ifo-val">{v.text}</span>
                            {subEl}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>

                  <div className="ifo-cover" aria-hidden="true">
                    <div className="ifo-art" style={{ "--ifo-dot": `${(1.2 + i * 0.5).toFixed(2)}px` } as React.CSSProperties} />
                    {p.hero && (
                      <div className="ifo-hero">
                        <b>{p.hero.value}</b>
                        <span>{p.hero.label}</span>
                      </div>
                    )}
                    <span className="ifo-hint">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6h7M6.8 3.2 9.6 6 6.8 8.8" />
                      </svg>
                      <span>Compare from {p.name}</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="ifo-foot">
        <p className="ifo-line" aria-live="polite" aria-atomic="true">
          <span key={`${sel.id}:${isDone}`} className="ifo-in" style={{ display: "inline-block" }}>
            {line}
          </span>
        </p>
        <button type="button" className="ifo-cta" data-done={isDone} aria-disabled={isDone} onClick={confirm}>
          {isDone && (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2.8 6.9 5.3 9.3 10.2 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span key={ctaText} className="ifo-in">
            {ctaText}
          </span>
        </button>
      </div>
    </div>
  )
}

export default Folio
