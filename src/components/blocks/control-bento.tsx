"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ControlBentoTileId = "range" | "toggle" | "stepper" | "search" | "checklist" | "player"
export type ControlBentoRange = "day" | "week" | "month"

export type ControlBentoChange =
  | { tile: "range"; value: ControlBentoRange }
  | { tile: "toggle"; value: boolean }
  | { tile: "stepper"; value: number }
  | { tile: "search"; value: string }
  | { tile: "checklist"; value: { item: string; done: boolean } }
  | { tile: "player"; value: { playing: boolean; position: number } }

export type ControlBentoProps = {
  /** Which tiles to show and in what order. Default: all six. */
  tiles?: ControlBentoTileId[]
  /** Lifts one tile and turns the demonstration off, so the page decides what is in focus. */
  focus?: ControlBentoTileId
  /** Play the built-in cursor demonstration while the bento is on screen. Default true. */
  autoplay?: boolean
  /** "auto" follows the page (a `.dark` class or `data-theme="dark"`). */
  theme?: "auto" | "light" | "dark"
  /** Colour used for the switch and the highlighted point. Default is the Pane blue. */
  accent?: string
  /** Row height of the grid. Default "comfortable". */
  density?: "comfortable" | "compact"
  /** Called when a person (or the demonstration) changes a control. */
  onChange?: (change: ControlBentoChange) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const N = 28
const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2))
const norm = (a: number[]) => {
  const lo = Math.min(...a)
  const hi = Math.max(...a)
  return a.map((v) => (v - lo) / (hi - lo))
}
const smoothstep = (t: number) => t * t * (3 - 2 * t)

const SERIES: Record<ControlBentoRange, number[]> = {
  day: norm(Array.from({ length: N }, (_, i) => 0.1 + 0.42 * g(i / (N - 1), 0.36, 0.09) + 1 * g(i / (N - 1), 0.76, 0.11))),
  week: norm(
    Array.from({ length: N }, (_, i) => {
      const d = [0.3, 0.38, 0.44, 0.58, 0.86, 1, 0.62]
      const f = (i / (N - 1)) * 6
      const k = Math.min(5, Math.floor(f))
      return d[k] + (d[k + 1] - d[k]) * smoothstep(f - k)
    }),
  ),
  month: norm(Array.from({ length: N }, (_, i) => 0.5 + 0.32 * Math.sin(i * 0.9 + 1) + 0.014 * i * 6 + 0.22 * Math.sin(i * 2.3) * (0.4 + (i % 5) / 10) + (i === 17 ? 0.55 : 0))),
}
const TOTALS: Record<ControlBentoRange, number> = { day: 142, week: 968, month: 4126 }
const SUBS: Record<ControlBentoRange, string> = { day: "Today so far, 6 tables still to seat", week: "Mon to Sun, 6% up on last week", month: "Past 30 days, 3% up on October" }
const PEAKS: Record<ControlBentoRange, string> = { day: "19:30 · 38", week: "Sat · 214", month: "Nov 8 · 231" }
const RANGES: { id: ControlBentoRange; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
]

const GUESTS = [
  { name: "Theo Brandt", meta: "Fri 21:00 · 6" },
  { name: "Ines Marlow", meta: "Fri 19:30 · 4" },
  { name: "Noor Aziz", meta: "Sat 19:00 · 3" },
  { name: "Inés Vidal", meta: "Sat 20:00 · 2" },
]
const ITEMS = ["Oysters from Pier 9", "Polish the glassware", "Brief the floor", "Print tasting menus"]
const DURATION = 228

type State = { range: ControlBentoRange; remind: boolean; party: number; q: string; checks: boolean[]; playing: boolean; pos: number }
const INIT: State = { range: "day", remind: false, party: 2, q: "", checks: [true, false, false, false], playing: false, pos: 42 }
const POSTER: State = { range: "week", remind: true, party: 4, q: "ine", checks: [true, true, true, false], playing: true, pos: 84 }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cbn {
  --cbn-ink: #000;
  --cbn-surface: #fff;
  --cbn-thumb: #fff;
  --cbn-accent: #0060e2;
  --cbn-t1: color-mix(in oklab, var(--cbn-ink) 88%, transparent);
  --cbn-t2: color-mix(in oklab, var(--cbn-ink) 61%, transparent);
  --cbn-t3: color-mix(in oklab, var(--cbn-ink) 56%, transparent);
  --cbn-t4: color-mix(in oklab, var(--cbn-ink) 27%, transparent);
  --cbn-fill: color-mix(in oklab, var(--cbn-ink) 6%, transparent);
  --cbn-line: color-mix(in oklab, var(--cbn-ink) 7%, transparent);
  --cbn-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .06);
  --cbn-lift: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 4px 0 rgb(0 0 0 / .05), 0 28px 56px -14px rgb(0 0 0 / .2);
  --cbn-ease: cubic-bezier(.22, 1, .36, 1);
  --cbn-pad: 20px;
  --cbn-row: 168px;
  --cbn-gap: 12px;
  position: relative; container-type: inline-size; width: 100%;
  font: 13px/20px var(--cbn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--cbn-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
.cbn[data-density="compact"] { --cbn-row: 148px }
:is(.dark, [data-theme="dark"]) .cbn:not([data-mode="light"]), .cbn[data-mode="dark"] {
  --cbn-ink: #fff; --cbn-surface: #1c1c1e; --cbn-thumb: color-mix(in oklab, #fff 17%, #1c1c1e); --cbn-accent: #4d8dff;
  --cbn-t1: color-mix(in oklab, var(--cbn-ink) 90%, transparent);
  --cbn-t2: color-mix(in oklab, var(--cbn-ink) 62%, transparent);
  --cbn-t3: color-mix(in oklab, var(--cbn-ink) 58%, transparent);
  --cbn-t4: color-mix(in oklab, var(--cbn-ink) 28%, transparent);
  --cbn-fill: color-mix(in oklab, var(--cbn-ink) 8%, transparent);
  --cbn-line: color-mix(in oklab, var(--cbn-ink) 10%, transparent);
  --cbn-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .3);
  --cbn-lift: 0 0 0 .5px rgb(255 255 255 / .16), 0 2px 4px 0 rgb(0 0 0 / .4), 0 28px 56px -14px rgb(0 0 0 / .7);
}
html[data-style="mono"] .cbn:not([data-mode]) {
  --cbn-ink: #000; --cbn-surface: #fff; --cbn-thumb: #fff; --cbn-accent: #111; --cbn-shadow: 0 0 0 1px rgb(0 0 0 / .14); --cbn-lift: 0 0 0 1px rgb(0 0 0 / .5);
}
html[data-style="mono"] .cbn[data-mode="dark"] { --cbn-surface: #0a0a0a; --cbn-thumb: #262626; --cbn-accent: #f2f2f2; --cbn-shadow: 0 0 0 1px rgb(255 255 255 / .16); --cbn-lift: 0 0 0 1px rgb(255 255 255 / .55) }
html[data-style="mono"] .cbn[data-mode="light"] { --cbn-ink: #000; --cbn-surface: #fff; --cbn-thumb: #fff; --cbn-accent: #111; --cbn-shadow: 0 0 0 1px rgb(0 0 0 / .14); --cbn-lift: 0 0 0 1px rgb(0 0 0 / .5) }
html[data-style="mono"] .cbn {
  --cbn-ease: cubic-bezier(.2, .9, .1, 1); --cbn-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .cbn:not([data-mode="light"]) { --cbn-ink: #fff; --cbn-surface: #0a0a0a; --cbn-thumb: #262626; --cbn-accent: #f2f2f2; --cbn-shadow: 0 0 0 1px rgb(255 255 255 / .16); --cbn-lift: 0 0 0 1px rgb(255 255 255 / .55) }
html[data-style="glass"] .cbn { --cbn-ease: var(--pane-ease); --cbn-font: var(--pane-font) }
html[data-style="glass"] .cbn:not([data-mode]) {
  --cbn-ink: var(--pane-ink); --cbn-surface: var(--pane-solid); --cbn-accent: var(--pane-accent); --cbn-shadow: var(--pane-shadow);
  --cbn-t1: var(--pane-t1); --cbn-t2: var(--pane-t2); --cbn-t3: var(--pane-t3); --cbn-t4: var(--pane-t4);
}
html[data-style="glass"] .cbn-tile { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .cbn-tile { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .cbn-tile { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .cbn-tile { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
html[data-style="glass"] .cbn-tile[data-focus] { box-shadow: var(--pane-card), 0 28px 56px -14px rgb(0 0 0 / .22) }
.cbn *, .cbn *::before, .cbn *::after { box-sizing: border-box }
:where(.cbn) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.cbn) p, :where(.cbn) ul { margin: 0; padding: 0; list-style: none }
.cbn button:focus-visible, .cbn input:focus-visible { outline: 2px solid var(--cbn-accent); outline-offset: 2px }
.cbn-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Grid: four columns wide, two when narrow. Tiles keep their own geometry. */
.cbn-stage { position: relative }
.cbn-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: minmax(var(--cbn-row), auto); grid-auto-flow: dense; gap: var(--cbn-gap) }
.cbn-tile {
  position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; padding: var(--cbn-pad);
  border-radius: 20px; background: var(--cbn-surface); box-shadow: var(--cbn-shadow);
  transition: transform .55s var(--cbn-ease), box-shadow .55s var(--cbn-ease);
}
.cbn-tile[data-focus] { transform: translateY(-4px) scale(1.012); box-shadow: var(--cbn-lift); z-index: 2 }
.cbn-t-range { grid-column: span 2; grid-row: span 2 }
.cbn-t-search, .cbn-t-checklist, .cbn-t-player { grid-column: span 2 }
.cbn-lab { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; color: var(--cbn-t2); font-weight: 500 }
.cbn-lab small { font-size: 12px; font-weight: 400; color: var(--cbn-t3); font-variant-numeric: tabular-nums }
.cbn-hint { color: var(--cbn-t3) }
.cbn-end { margin-top: auto }

/* Range */
.cbn-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px }
.cbn-seg { position: relative; display: grid; grid-template-columns: repeat(3, 56px); padding: 3px; border-radius: 10px; background: var(--cbn-fill); flex: none }
.cbn-seg-thumb {
  position: absolute; top: 3px; bottom: 3px; left: 3px; width: 56px; border-radius: 7px; background: var(--cbn-thumb);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .1); transform: translateX(calc(var(--i) * 56px)); transition: transform .5s var(--cbn-ease);
}
:is(.dark, [data-theme="dark"]) .cbn:not([data-mode="light"]) .cbn-seg-thumb, .cbn[data-mode="dark"] .cbn-seg-thumb { box-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px rgb(0 0 0 / .4) }
.cbn-seg button { position: relative; height: 26px; border-radius: 7px; font-weight: 500; color: var(--cbn-t2); transition: color .25s var(--cbn-ease), transform .16s var(--cbn-ease) }
.cbn-seg button[aria-checked="true"] { color: var(--cbn-t1) }
.cbn-seg button:active { transform: scale(.96) }
.cbn-big { margin-top: 20px; height: 56px; font-size: 56px; line-height: 56px; font-weight: 500; letter-spacing: -.025em; font-variant-numeric: tabular-nums; color: var(--cbn-t1) }
.cbn-sub { margin-top: 6px; color: var(--cbn-t2) }
.cbn-chart { position: relative; flex: 1; min-height: 88px; margin: 12px calc(-1 * var(--cbn-pad)) calc(-1 * var(--cbn-pad)) }
.cbn-chart svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible }
.cbn-area { fill: color-mix(in oklab, var(--cbn-ink) 6%, transparent) }
.cbn-line { fill: none; stroke: var(--cbn-t1); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke }
.cbn-dot { position: absolute; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: var(--cbn-accent); box-shadow: 0 0 0 3px var(--cbn-surface) }
.cbn-tag { position: absolute; transform: translate(calc(-100% - 14px), -50%); font-size: 12px; line-height: 16px; white-space: nowrap; color: var(--cbn-t2); font-variant-numeric: tabular-nums }

/* Switch */
.cbn-sw { display: flex; align-items: center; gap: 14px; margin-top: auto }
.cbn-switch { position: relative; flex: none; width: 56px; height: 32px; border-radius: 16px; background: color-mix(in oklab, var(--cbn-ink) 14%, transparent); transition: background-color .35s var(--cbn-ease), transform .16s var(--cbn-ease) }
.cbn-switch:active { transform: scale(.96) }
.cbn-switch[aria-checked="true"] { background: var(--cbn-accent) }
.cbn-switch i { position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / .25), 0 0 0 .5px rgb(0 0 0 / .06); transition: transform .45s var(--cbn-ease) }
.cbn-switch[aria-checked="true"] i { transform: translateX(24px) }
.cbn-state { font-size: 15px; line-height: 22px; font-weight: 500 }

/* Stepper */
.cbn-step { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto }
.cbn-rb { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--cbn-fill); color: var(--cbn-t1); transition: background-color .2s var(--cbn-ease), transform .16s var(--cbn-ease), opacity .2s var(--cbn-ease) }
.cbn-rb:hover { background: color-mix(in oklab, var(--cbn-ink) 10%, transparent) }
.cbn-rb:active, .cbn-rb[data-pressed] { transform: scale(.92) }
.cbn-rb:disabled { opacity: .35; cursor: default }
.cbn-roll { display: block; flex: 1; min-width: 0; position: relative; height: 48px; overflow: hidden; font-size: 44px; line-height: 48px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; text-align: center }
.cbn-roll span { display: block; animation: cbn-roll .5s var(--cbn-ease) both }
.cbn-roll span[data-dir="-1"] { --from: -60% }
.cbn-roll span:not([data-dir]), .cbn-roll span[data-dir="0"] { animation: none }

/* Search */
.cbn-field { position: relative; display: flex; align-items: center; gap: 8px; height: 40px; margin-top: 12px; padding: 0 12px; border-radius: 11px; background: var(--cbn-fill); color: var(--cbn-t3); transition: background-color .25s var(--cbn-ease) }
.cbn-field:focus-within { background: color-mix(in oklab, var(--cbn-ink) 9%, transparent) }
.cbn-field svg { flex: none }
.cbn-field input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; outline: none; font: inherit; font-size: 15px; color: var(--cbn-t1); -webkit-appearance: none; appearance: none }
.cbn-field input::placeholder { color: var(--cbn-t3) }
.cbn-field:has(input:focus-visible) { outline: 2px solid var(--cbn-accent); outline-offset: 2px }
.cbn-field input:focus-visible { outline: none }
.cbn-mirror { position: absolute; left: 36px; top: 0; bottom: 0; display: none; align-items: center; font-size: 15px; color: var(--cbn-t1); pointer-events: none; white-space: pre }
.cbn-mirror::after { content: ""; width: 1.5px; height: 18px; margin-left: 1px; background: var(--cbn-accent); animation: cbn-caret 1s steps(1) infinite }
.cbn-field[data-typing] .cbn-mirror { display: flex }
.cbn-field[data-typing] input { color: transparent }
.cbn-res { margin-top: 8px; min-height: 68px }
.cbn-res li { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 34px; padding: 0 12px; margin: 0 -12px; border-radius: 9px; animation: cbn-in .45s var(--cbn-ease) both }
.cbn-res li span:last-child { font-size: 12px; color: var(--cbn-t3); white-space: nowrap; font-variant-numeric: tabular-nums }
.cbn-res li:hover { background: var(--cbn-fill) }
.cbn-none { padding: 7px 0; color: var(--cbn-t3) }

/* Checklist */
.cbn-list { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; margin-top: 8px }
.cbn-chk { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 36px; margin: 0; padding: 2px 0; text-align: left; border-radius: 8px; transition: transform .16s var(--cbn-ease) }
.cbn-chk:active { transform: scale(.98) }
.cbn-box { position: relative; flex: none; width: 20px; height: 20px; border-radius: 7px; box-shadow: inset 0 0 0 1.5px var(--cbn-t4); transition: background-color .3s var(--cbn-ease), box-shadow .3s var(--cbn-ease) }
.cbn-box svg { position: absolute; inset: 0; width: 20px; height: 20px; fill: none; stroke: var(--cbn-surface); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 14; stroke-dashoffset: 14; transition: stroke-dashoffset .4s var(--cbn-ease) .06s }
.cbn-chk[aria-checked="true"] .cbn-box { background: var(--cbn-t1); box-shadow: inset 0 0 0 1.5px var(--cbn-t1) }
.cbn-chk[aria-checked="true"] .cbn-box svg { stroke-dashoffset: 0 }
.cbn-chk span:last-child { min-width: 0; text-wrap: balance; line-height: 18px; transition: color .3s var(--cbn-ease) }
.cbn-chk[aria-checked="true"] span:last-child { color: var(--cbn-t3) }

/* Player */
.cbn-t-player { padding: var(--cbn-pad) }
.cbn-pl { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 18px; height: 100% }
.cbn-art { display: block; width: 104px; height: 104px; border-radius: 12px; box-shadow: 0 0 0 .5px var(--cbn-line); background: var(--cbn-fill); overflow: hidden }
.cbn-art .a { fill: var(--cbn-t1) }
.cbn-art .b { fill: none; stroke: var(--cbn-t3); stroke-width: 1.2 }
.cbn-ttl { font-size: 15px; line-height: 20px; font-weight: 600; letter-spacing: -.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.cbn-art-by { color: var(--cbn-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.cbn-bar-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) 34px; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; color: var(--cbn-t3); font-variant-numeric: tabular-nums }
.cbn-bar-row span:last-child { text-align: right }
.cbn-bar { -webkit-appearance: none; appearance: none; width: 100%; height: 20px; margin: 0; background: none; cursor: pointer; --p: 0% }
.cbn-bar::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, var(--cbn-t1) var(--p), var(--cbn-fill) var(--p)) }
.cbn-bar::-moz-range-track { height: 4px; border-radius: 2px; background: var(--cbn-fill) }
.cbn-bar::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--cbn-t1) }
.cbn-bar::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; margin-top: -4px; border-radius: 50%; border: 0; background: var(--cbn-t1); transform: scale(0); transition: transform .25s var(--cbn-ease) }
.cbn-bar::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; border: 0; background: var(--cbn-t1); transform: scale(0); transition: transform .25s var(--cbn-ease) }
.cbn-bar:hover::-webkit-slider-thumb, .cbn-bar:focus-visible::-webkit-slider-thumb { transform: scale(1) }
.cbn-bar:hover::-moz-range-thumb, .cbn-bar:focus-visible::-moz-range-thumb { transform: scale(1) }
.cbn-ctl { display: flex; align-items: center; gap: 4px; margin-top: 4px; margin-left: -8px }
.cbn-ib { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--cbn-t1); transition: background-color .2s var(--cbn-ease), transform .16s var(--cbn-ease) }
.cbn-ib:hover { background: var(--cbn-fill) }
.cbn-ib:active, .cbn-ib[data-pressed] { transform: scale(.92) }
.cbn-play { background: var(--cbn-t1); color: var(--cbn-surface) }
.cbn-play:hover { background: color-mix(in oklab, var(--cbn-t1) 86%, var(--cbn-surface)) }
.cbn-play svg { display: block }

/* Demonstration cursor */
.cbn-cur { position: absolute; left: 0; top: 0; z-index: 5; width: 0; height: 0; pointer-events: none; opacity: 0; transition: transform .85s var(--cbn-ease), opacity .3s var(--cbn-ease) }
.cbn-cur[data-on] { opacity: 1 }
.cbn-cur[data-snap] { transition: opacity .3s var(--cbn-ease) }
.cbn-cur svg { position: absolute; left: -2px; top: -2px; width: 22px; height: 24px; overflow: visible; filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .3)); transform-origin: 2px 2px; transition: transform .14s var(--cbn-ease) }
.cbn-cur[data-press] svg { transform: scale(.86) }
.cbn-cur path { fill: #111; stroke: #fff; stroke-width: 1.4; stroke-linejoin: round }

@keyframes cbn-roll { from { transform: translateY(var(--from, 60%)); opacity: 0; filter: blur(3px) } }
@keyframes cbn-in { from { transform: translateY(6px); opacity: 0; filter: blur(3px) } }
@keyframes cbn-caret { 50% { opacity: 0 } }

@container (max-width: 719px) {
  .cbn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .cbn-list { grid-template-columns: 1fr }
  .cbn-art { width: 88px; height: 88px }
}
@container (max-width: 479px) {
  .cbn { --cbn-gap: 8px; --cbn-pad: 16px }
  .cbn-big { font-size: 48px; margin-top: 16px }
  .cbn-roll { font-size: 40px }
  .cbn-pl { gap: 14px }
  .cbn-art { width: 72px; height: 72px }
  .cbn-seg { grid-template-columns: repeat(3, 52px) }
  .cbn-seg-thumb { width: 52px; transform: translateX(calc(var(--i) * 52px)) }
}
@media (pointer: coarse) { .cbn-seg button { height: 32px } }
@media (prefers-reduced-motion: reduce) {
  .cbn *, .cbn *::before, .cbn *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const Svg = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)
const IconMinus = () => <Svg size={18}><path d="M5 12h14" /></Svg>
const IconPlus = () => <Svg size={18}><path d="M12 5v14M5 12h14" /></Svg>
const IconSearch = () => <Svg><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Svg>
const IconPlay = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
const IconPause = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
const IconPrev = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 6.5v11M19 6.7v10.6a.7.7 0 0 1-1.1.6L10 12.6a.7.7 0 0 1 0-1.2l7.9-5.3a.7.7 0 0 1 1.1.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const IconNext = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18 6.5v11M5 6.7v10.6a.7.7 0 0 0 1.1.6L14 12.6a.7.7 0 0 0 0-1.2L6.1 6.1A.7.7 0 0 0 5 6.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const W = 400
const H = 120
const px = (i: number) => (i / (N - 1)) * W
const py = (v: number) => 110 - v * 90

function curve(a: number[]) {
  const p = a.map((v, i) => [px(i), py(v)] as const)
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[Math.min(p.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}
const peakIndex = (a: number[]) => a.indexOf(Math.max(...a))
const fmt = (n: number) => Math.round(n).toLocaleString("en-US")
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                                 Range tile                                 */
/* -------------------------------------------------------------------------- */

function RangeTile({ range, reduce, onPick }: { range: ControlBentoRange; reduce: boolean; onPick: (r: ControlBentoRange) => void }) {
  const first = React.useRef(range)
  const lineRef = React.useRef<SVGPathElement>(null)
  const areaRef = React.useRef<SVGPathElement>(null)
  const numRef = React.useRef<HTMLSpanElement>(null)
  const dotRef = React.useRef<HTMLSpanElement>(null)
  const tagRef = React.useRef<HTMLSpanElement>(null)
  const cur = React.useRef<number[]>(SERIES[first.current])
  const shown = React.useRef({ n: TOTALS[first.current], px: px(peakIndex(SERIES[first.current])) })
  const mounted = React.useRef(false)
  const idx = RANGES.findIndex((r) => r.id === range)

  const init = React.useMemo(() => {
    const a = SERIES[first.current]
    const d = curve(a)
    const pi = peakIndex(a)
    return { d, area: `${d}L${W} ${H}L0 ${H}Z`, x: (px(pi) / W) * 100, y: (py(a[pi]) / H) * 100 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const target = SERIES[range]
    const pi = peakIndex(target)
    const write = (a: number[], n: number, x: number, p: number) => {
      const d = curve(a)
      lineRef.current?.setAttribute("d", d)
      areaRef.current?.setAttribute("d", `${d}L${W} ${H}L0 ${H}Z`)
      if (numRef.current) numRef.current.textContent = fmt(n)
      const y = py(a[pi])
      if (dotRef.current) {
        dotRef.current.style.left = `${(x / W) * 100}%`
        dotRef.current.style.top = `${(y / H) * 100}%`
      }
      if (tagRef.current) {
        tagRef.current.style.left = `${(x / W) * 100}%`
        tagRef.current.style.top = `${(y / H) * 100}%`
        if (p >= 0.5) tagRef.current.textContent = PEAKS[range]
      }
    }
    const done = () => {
      cur.current = target
      shown.current = { n: TOTALS[range], px: px(pi) }
      write(target, TOTALS[range], px(pi), 1)
    }
    if (!mounted.current || reduce) {
      mounted.current = true
      done()
      return
    }
    const from = cur.current.slice()
    const f = { ...shown.current }
    const t0 = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / 620)
      const e = 1 - (1 - p) ** 4
      const a = from.map((v, i) => v + (target[i] - v) * e)
      cur.current = a
      write(a, f.n + (TOTALS[range] - f.n) * e, f.px + (px(pi) - f.px) * e, p)
      if (p < 1) raf = requestAnimationFrame(frame)
      else shown.current = { n: TOTALS[range], px: px(pi) }
    }
    raf = requestAnimationFrame(frame)
    // If frames never arrive (a throttled tab, a screenshot), land on the answer anyway.
    const timer = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      done()
    }, 900)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [range, reduce])

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!k) return
    e.preventDefault()
    const next = RANGES[(idx + k + RANGES.length) % RANGES.length].id
    onPick(next)
    requestAnimationFrame(() => (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-id="${next}"]`)?.focus())
  }

  return (
    <>
      <div className="cbn-head">
        <span className="cbn-lab">Covers</span>
        <div className="cbn-seg" role="radiogroup" aria-label="Period" style={{ "--i": idx } as React.CSSProperties}>
          <i className="cbn-seg-thumb" aria-hidden />
          {RANGES.map((r) => (
            <button key={r.id} type="button" role="radio" data-id={r.id} data-t={`seg-${r.id}`} aria-checked={range === r.id} tabIndex={range === r.id ? 0 : -1} onClick={() => onPick(r.id)} onKeyDown={onKey}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="cbn-big" aria-hidden>
        <span ref={numRef}>{fmt(TOTALS[first.current])}</span>
      </p>
      <p className="cbn-sr" role="status">{`${fmt(TOTALS[range])} covers. ${SUBS[range]}.`}</p>
      <p className="cbn-sub" aria-hidden>{SUBS[range]}</p>
      <div className="cbn-chart" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <path ref={areaRef} className="cbn-area" d={init.area} />
          <path ref={lineRef} className="cbn-line" d={init.d} />
        </svg>
        <span ref={dotRef} className="cbn-dot" style={{ left: `${init.x}%`, top: `${init.y}%` }} />
        <span ref={tagRef} className="cbn-tag" style={{ left: `${init.x}%`, top: `${init.y}%` }}>{PEAKS[first.current]}</span>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Control Bento                               */
/* -------------------------------------------------------------------------- */

const ALL: ControlBentoTileId[] = ["range", "toggle", "stepper", "search", "checklist", "player"]
const LABELS: Record<ControlBentoTileId, string> = { range: "Covers", toggle: "Reminders", stepper: "Party size", search: "Guests", checklist: "Friday prep", player: "Now playing" }

export function ControlBento({ tiles = ALL, focus, autoplay = true, theme = "auto", accent, density = "comfortable", onChange, className }: ControlBentoProps) {
  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const [st, setSt] = React.useState<State>(() => (prefersReduced() ? POSTER : INIT))
  const [fk, setFk] = React.useState<ControlBentoTileId | null>(null)
  const [typing, setTyping] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [halted, setHalted] = React.useState(false)
  const [active, setActive] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const curRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLInputElement>(null)
  const timeRef = React.useRef<HTMLSpanElement>(null)
  const posRef = React.useRef(st.pos)
  const dirRef = React.useRef(0)
  const emit = React.useRef(onChange)
  emit.current = onChange

  const demo = autoplay && !focus
  const live = demo && !halted && active && !reduce

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  /* ---- player clock: a rAF loop that writes the bar directly ---- */
  const paint = React.useCallback(() => {
    const p = Math.min(100, (posRef.current / DURATION) * 100)
    if (barRef.current) {
      barRef.current.value = String(posRef.current)
      barRef.current.style.setProperty("--p", `${p}%`)
    }
    if (timeRef.current) timeRef.current.textContent = clock(posRef.current)
  }, [])
  React.useEffect(() => {
    posRef.current = st.pos
    paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.pos, paint])
  React.useEffect(() => {
    if (!st.playing || !active || reduce) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      posRef.current = Math.min(DURATION, posRef.current + (now - last) / 1000)
      last = now
      paint()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      setSt((s) => (s.pos === posRef.current ? s : { ...s, pos: posRef.current }))
    }
  }, [st.playing, active, reduce, paint])

  /* ---- the controls ---- */
  const setRange = (r: ControlBentoRange) => {
    setSt((s) => ({ ...s, range: r }))
    emit.current?.({ tile: "range", value: r })
  }
  const setRemind = () => {
    const v = !st.remind
    setSt((s) => ({ ...s, remind: v }))
    emit.current?.({ tile: "toggle", value: v })
  }
  const bump = (d: number) => {
    const v = Math.min(12, Math.max(1, st.party + d))
    if (v === st.party) return
    dirRef.current = d
    setStep((n) => n + 1)
    setSt((s) => ({ ...s, party: v }))
    emit.current?.({ tile: "stepper", value: v })
  }
  const setQ = (q: string) => {
    setSt((s) => ({ ...s, q }))
    emit.current?.({ tile: "search", value: q })
  }
  const tick = (i: number) => {
    const done = !st.checks[i]
    setSt((s) => ({ ...s, checks: s.checks.map((c, j) => (j === i ? done : c)) }))
    emit.current?.({ tile: "checklist", value: { item: ITEMS[i], done } })
  }
  const togglePlay = () => {
    const playing = !st.playing
    setSt((s) => ({ ...s, playing, pos: posRef.current }))
    emit.current?.({ tile: "player", value: { playing, position: posRef.current } })
  }
  const seek = (v: number) => {
    posRef.current = v
    paint()
    setSt((s) => ({ ...s, pos: v }))
    emit.current?.({ tile: "player", value: { playing: st.playing, position: v } })
  }

  /* ---- the demonstration: one tile at a time, one cursor ---- */
  const halt = React.useCallback(() => {
    setHalted(true)
    setTyping(false)
    setFk(null)
  }, [])

  React.useEffect(() => {
    if (!live) return
    const root = rootRef.current
    const stage = stageRef.current
    const cur = curRef.current
    if (!root || !stage || !cur) return
    let dead = false
    const timers = new Set<number>()
    const sleep = (ms: number) =>
      new Promise<void>((res, rej) => {
        const t = window.setTimeout(() => {
          timers.delete(t)
          if (dead) rej(new Error("stop"))
          else res()
        }, ms)
        timers.add(t)
      })
    const el = (k: string) => root.querySelector<HTMLElement>(`[data-t="${k}"]`)
    const moveTo = async (k: string, fx = 0.5, fy = 0.5) => {
      const e = el(k)
      if (!e) return
      const r = e.getBoundingClientRect()
      const b = stage.getBoundingClientRect()
      cur.style.transform = `translate(${r.left - b.left + r.width * fx}px, ${r.top - b.top + r.height * fy}px)`
      await sleep(900)
    }
    const press = async (k: string) => {
      const e = el(k)
      cur.setAttribute("data-press", "")
      e?.setAttribute("data-pressed", "")
      await sleep(150)
      cur.removeAttribute("data-press")
      e?.removeAttribute("data-pressed")
      e?.click()
    }
    const run = async () => {
      while (!dead) {
        setSt(INIT)
        setTyping(false)
        setFk(null)
        const hero = el("seg-week")
        if (hero) {
          const r = hero.getBoundingClientRect()
          const b = stage.getBoundingClientRect()
          cur.setAttribute("data-snap", "")
          cur.style.transform = `translate(${r.left - b.left + r.width * 0.9}px, ${r.top - b.top + r.height * 5.2}px)`
          void cur.offsetWidth
          cur.removeAttribute("data-snap")
        }
        cur.setAttribute("data-on", "")
        await sleep(1100)
        // 1 · the period
        setFk("range")
        await moveTo("seg-week", 0.5, 0.55)
        await sleep(300)
        await press("seg-week")
        await sleep(2300)
        // 2 · the stepper
        setFk("stepper")
        await moveTo("step-plus")
        await sleep(250)
        await press("step-plus")
        await sleep(520)
        await press("step-plus")
        await sleep(1500)
        // 3 · the switch
        setFk("toggle")
        await moveTo("switch")
        await sleep(250)
        await press("switch")
        await sleep(1700)
        // 4 · the search
        setFk("search")
        await moveTo("field", 0.3)
        await sleep(300)
        setTyping(true)
        for (const q of ["i", "in", "ine"]) {
          setQ(q)
          await sleep(240)
        }
        await sleep(2000)
        setTyping(false)
        // 5 · the checklist
        setFk("checklist")
        await moveTo("chk-1", 0.2)
        await sleep(250)
        await press("chk-1")
        await sleep(600)
        await moveTo("chk-2", 0.2)
        await press("chk-2")
        await sleep(1700)
        // 6 · the player
        setFk("player")
        await moveTo("play")
        await sleep(250)
        await press("play")
        await sleep(3000)
        // rest
        setFk(null)
        cur.removeAttribute("data-on")
        await sleep(2400)
      }
    }
    run().catch(() => {})
    return () => {
      dead = true
      timers.forEach((t) => window.clearTimeout(t))
      cur.removeAttribute("data-on")
      cur.removeAttribute("data-press")
      setFk(null)
      setTyping(false)
    }
  }, [live])

  const results = React.useMemo(() => {
    const q = fold(st.q.trim())
    return q ? GUESTS.filter((x) => fold(x.name).includes(q)).slice(0, 2) : GUESTS.slice(0, 2)
  }, [st.q])
  const done = st.checks.filter(Boolean).length
  const focused = focus ?? fk

  const tile = (id: ControlBentoTileId) => {
    switch (id) {
      case "range":
        return <RangeTile range={st.range} reduce={reduce} onPick={setRange} />
      case "toggle":
        return (
          <>
            <p className="cbn-lab">{LABELS.toggle}</p>
            <p className="cbn-hint">Text 2 h before</p>
            <div className="cbn-sw">
              <button type="button" role="switch" className="cbn-switch" data-t="switch" aria-checked={st.remind} aria-label="Reminders" onClick={setRemind}>
                <i />
              </button>
              <span className="cbn-state" aria-hidden>{st.remind ? "On" : "Off"}</span>
            </div>
          </>
        )
      case "stepper":
        return (
          <>
            <p className="cbn-lab">{LABELS.stepper}</p>
            <p className="cbn-hint">Tonight, Table 7</p>
            <div className="cbn-step">
              <button type="button" className="cbn-rb" aria-label="Fewer guests" disabled={st.party <= 1} onClick={() => bump(-1)}>
                <IconMinus />
              </button>
              <output className="cbn-roll" aria-live="polite" aria-label={`${st.party} guests`}>
                <span key={step} data-dir={dirRef.current}>{st.party}</span>
              </output>
              <button type="button" className="cbn-rb" data-t="step-plus" aria-label="More guests" disabled={st.party >= 12} onClick={() => bump(1)}>
                <IconPlus />
              </button>
            </div>
          </>
        )
      case "search":
        return (
          <>
            <p className="cbn-lab">{LABELS.search}</p>
            <label className="cbn-field" data-t="field" data-typing={typing || undefined}>
              <IconSearch />
              <input type="text" value={st.q} placeholder="Search" aria-label="Search guests" autoComplete="off" spellCheck={false} onChange={(e) => setQ(e.target.value)} />
              <span className="cbn-mirror" aria-hidden>{st.q}</span>
            </label>
            <ul className="cbn-res" aria-label="Results">
              {results.length ? (
                results.map((x) => (
                  <li key={x.name}>
                    <span>{x.name}</span>
                    <span>{x.meta}</span>
                  </li>
                ))
              ) : (
                <li className="cbn-none">No guest called “{st.q}”</li>
              )}
            </ul>
          </>
        )
      case "checklist":
        return (
          <>
            <p className="cbn-lab">
              {LABELS.checklist}
              <small>{done} of {ITEMS.length}</small>
            </p>
            <div className="cbn-list" role="group" aria-label="Friday prep">
              {ITEMS.map((t, i) => (
                <button key={t} type="button" role="checkbox" className="cbn-chk" data-t={`chk-${i}`} aria-checked={st.checks[i]} onClick={() => tick(i)}>
                  <span className="cbn-box" aria-hidden>
                    <svg viewBox="0 0 20 20"><path d="m5.5 10.5 3 3 6-6.5" /></svg>
                  </span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </>
        )
      case "player":
        return (
          <div className="cbn-pl">
            <svg className="cbn-art" viewBox="0 0 100 100" aria-hidden>
              <circle className="a" cx="50" cy="46" r="17" />
              <rect x="0" y="62" width="100" height="38" style={{ fill: "var(--cbn-surface)" }} opacity=".72" />
              <path className="b" d="M0 66h100M0 74h100M0 82h100M0 90h100" />
            </svg>
            <div style={{ minWidth: 0 }}>
              <p className="cbn-ttl">Slow Harbor</p>
              <p className="cbn-art-by">Marit Solheim</p>
              <div className="cbn-bar-row">
                <span ref={timeRef}>{clock(st.pos)}</span>
                <input ref={barRef} className="cbn-bar" type="range" min={0} max={DURATION} step={1} defaultValue={st.pos} aria-label="Position" aria-valuetext={`${clock(st.pos)} of ${clock(DURATION)}`} onChange={(e) => seek(Number(e.target.value))} />
                <span>{clock(DURATION)}</span>
              </div>
              <div className="cbn-ctl">
                <button type="button" className="cbn-ib" aria-label="Previous track" onClick={() => seek(0)}>
                  <IconPrev />
                </button>
                <button type="button" className="cbn-ib cbn-play" data-t="play" aria-label={st.playing ? "Pause" : "Play"} onClick={togglePlay}>
                  {st.playing ? <IconPause /> : <IconPlay />}
                </button>
                <button type="button" className="cbn-ib" aria-label="Next track" onClick={() => seek(DURATION)}>
                  <IconNext />
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("cbn", className)}
      data-mode={theme === "auto" ? undefined : theme}
      data-density={density}
      style={accent ? ({ "--cbn-accent": accent } as React.CSSProperties) : undefined}
      onPointerDownCapture={halt}
      onKeyDownCapture={halt}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) halt()
      }}
    >
      <style href="control-bento" precedence="default">
        {CSS}
      </style>
      <div ref={stageRef} className="cbn-stage">
        <div className="cbn-grid">
          {tiles.map((id) => (
            <section key={id} className={cn("cbn-tile", `cbn-t-${id}`)} data-focus={focused === id ? "" : undefined} aria-label={LABELS[id]}>
              {tile(id)}
            </section>
          ))}
        </div>
        <div ref={curRef} className="cbn-cur" aria-hidden>
          <svg viewBox="0 0 16 22">
            <path d="M2 2v16.2l4.3-3.9 2.8 6.4 2.7-1.2-2.8-6.2 5.8-.3Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default ControlBento
