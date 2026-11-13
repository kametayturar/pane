"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DeviceKind = "browser" | "phone" | "pair"
export type DeviceTheme = "auto" | "light" | "dark"
/** Which edge the frame runs off. `fade` keeps the frame inside and dissolves its foot. */
export type DeviceCrop = "none" | "bottom" | "right" | "fade"

export type BrowserFrameProps = {
  /** Address shown in the pill. Default "northwind.co/payouts". */
  url?: string
  /** Accessible name of the window, and the single tab's label when `tabs` is empty. */
  title?: string
  /** Two or more labels draw a tab strip next to the window controls. */
  tabs?: string[]
  activeTab?: number
  onTabChange?: (index: number) => void
  theme?: DeviceTheme
  /** Design size in px. The parent scales it; contents never reflow. */
  width?: number
  height?: number
  /** Dissolve the last third of the window into whatever it sits on. */
  fade?: boolean
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}

export type PhoneFrameProps = {
  /** Time in the status bar. Plain and fixed: 9:41. */
  time?: string
  title?: string
  theme?: DeviceTheme
  /** Design width in px, the height follows the real aspect (1 : 2.1). Default 232. */
  width?: number
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}

export type DeviceFramesProps = {
  /** "pair" draws a browser with a phone straddling its edge. Default "pair". */
  kind?: DeviceKind
  url?: string
  title?: string
  /** Tab labels for the browser. The built-in scene uses two. */
  tabs?: string[]
  activeTab?: number
  onTabChange?: (index: number) => void
  theme?: DeviceTheme
  /** Where the frame bleeds off the card. Default "bottom" ("right" for a lone browser pinned left). */
  crop?: DeviceCrop
  /** How much of a single frame is cut by the card edge, 0 to 0.45. Default 0.2. */
  bleed?: number
  /** Extra zoom on top of fitting the card width. Default 1. */
  scale?: number
  /** Force the compact design (358 wide). By default it switches on below 640px. */
  compact?: boolean
  /** Window contents. Leave out to get the built-in payouts scene. */
  children?: React.ReactNode
  /** Phone screen contents (kind "pair" or "phone"). */
  screen?: React.ReactNode
  /** Built-in scene: setting this turns the demo loop off and lets you drive it. */
  approved?: boolean
  /** Built-in scene: Approve was pressed, by the demo cursor or by a person. */
  onApprove?: () => void
  /** Built-in scene: Undo was pressed. */
  onUndo?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dfr {
  --dfr-ink: #000;
  --dfr-surface: #fff;
  --dfr-well: color-mix(in oklab, #000 4.5%, #fff);
  --dfr-accent: #0060e2;
  --dfr-t1: color-mix(in oklab, var(--dfr-ink) 88%, transparent);
  --dfr-t2: color-mix(in oklab, var(--dfr-ink) 61%, transparent);
  --dfr-t3: color-mix(in oklab, var(--dfr-ink) 47%, transparent);
  --dfr-t4: color-mix(in oklab, var(--dfr-ink) 27%, transparent);
  --dfr-fill: color-mix(in oklab, var(--dfr-ink) 6%, transparent);
  --dfr-line: color-mix(in oklab, var(--dfr-ink) 7%, transparent);
  --dfr-card: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --dfr-win: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px rgb(0 0 0 / .04), 0 4px 10px -2px rgb(0 0 0 / .05), 0 22px 44px -12px rgb(0 0 0 / .16);
  --dfr-sat: 0 0 0 .5px rgb(0 0 0 / .14), 0 2px 4px rgb(0 0 0 / .08), 0 18px 34px -10px rgb(0 0 0 / .32);
  --dfr-radius: 12px;
  --dfr-bezel: #0c0c0e;
  --dfr-wall-a: #f7f7f8;
  --dfr-wall: #dedee2;
  --dfr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; box-sizing: border-box;
  font: 13px/20px var(--dfr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--dfr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .dfr:not([data-t="light"]), .dfr[data-t="dark"] {
  --dfr-ink: #fff; --dfr-surface: #1c1c1e; --dfr-well: #121214; --dfr-accent: #4d8dff;
  --dfr-t1: color-mix(in oklab, var(--dfr-ink) 90%, transparent);
  --dfr-t2: color-mix(in oklab, var(--dfr-ink) 62%, transparent);
  --dfr-t3: color-mix(in oklab, var(--dfr-ink) 47%, transparent);
  --dfr-t4: color-mix(in oklab, var(--dfr-ink) 28%, transparent);
  --dfr-fill: color-mix(in oklab, var(--dfr-ink) 8%, transparent);
  --dfr-line: color-mix(in oklab, var(--dfr-ink) 9%, transparent);
  --dfr-card: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --dfr-win: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 1px rgb(0 0 0 / .3), 0 22px 44px -12px rgb(0 0 0 / .6);
  --dfr-sat: 0 0 0 .5px rgb(255 255 255 / .16), 0 2px 4px rgb(0 0 0 / .4), 0 18px 34px -10px rgb(0 0 0 / .7);
  --dfr-bezel: #2a2a2e;
  --dfr-wall-a: #232327;
  --dfr-wall: #0b0b0d;
}
html[data-style="mono"] .dfr {
  --dfr-ink: #000; --dfr-surface: #fff; --dfr-accent: #111; --dfr-radius: 6px;
  --dfr-card: 0 0 0 1px rgb(0 0 0 / .14); --dfr-win: 0 0 0 1px rgb(0 0 0 / .2); --dfr-sat: 0 0 0 1px rgb(0 0 0 / .3);
  --dfr-ease: cubic-bezier(.2, .9, .1, 1); --dfr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .dfr:not([data-t="light"]), html[data-style="mono"] .dfr[data-t="dark"] {
  --dfr-ink: #fff; --dfr-surface: #0a0a0a; --dfr-well: #050505; --dfr-accent: #f2f2f2;
  --dfr-card: 0 0 0 1px rgb(255 255 255 / .16); --dfr-win: 0 0 0 1px rgb(255 255 255 / .22); --dfr-sat: 0 0 0 1px rgb(255 255 255 / .32);
}
html[data-style="glass"] .dfr {
  --dfr-ink: var(--pane-ink); --dfr-accent: var(--pane-accent); --dfr-ease: var(--pane-ease); --dfr-font: var(--pane-font);
  --dfr-t1: var(--pane-t1); --dfr-t2: var(--pane-t2); --dfr-t3: var(--pane-t3); --dfr-t4: var(--pane-t4);
  --dfr-surface: var(--pane-solid);
}
html[data-style="glass"] .dfr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .dfr-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .dfr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .dfr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
html[data-style="glass"] .dfr-card .dfr-win { background: var(--pane-tint-nested) }

.dfr-nt-t, .dfr-nt > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
html[data-style="mono"] .dfr-nt em { display: none }
html[data-style="mono"] .dfr-nt b { font-size: 13px; letter-spacing: -.04em }
html[data-style="mono"] .dfr-nt span { font-size: 13px; letter-spacing: -.05em }
html[data-style="mono"] .dfr-name { font-size: 14px; letter-spacing: -.05em }
html[data-style="mono"] .dfr-meta { letter-spacing: -.04em }
.dfr *, .dfr *::before, .dfr *::after { box-sizing: border-box }
:where(.dfr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.dfr) p, :where(.dfr) h3 { margin: 0 }
.dfr button:focus-visible { outline: 2px solid var(--dfr-accent); outline-offset: 2px }
.dfr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* The card is the crop: everything the stage draws is cut at its edge. */
.dfr-card { position: relative; width: 100%; overflow: hidden; border-radius: 20px; background: var(--dfr-well); box-shadow: var(--dfr-card) }
.dfr-stage { position: absolute; left: 0; top: 0; transform-origin: 0 0 }

/* ---- Browser ---- */
.dfr-win {
  position: absolute; display: flex; flex-direction: column; overflow: hidden;
  border-radius: var(--dfr-radius); background: var(--dfr-surface); box-shadow: var(--dfr-win);
}
.dfr-win[data-fade] { -webkit-mask-image: linear-gradient(#000 58%, transparent 98%); mask-image: linear-gradient(#000 58%, transparent 98%) }
.dfr-bar { flex: none; display: flex; align-items: center; height: 40px; padding: 0 14px; gap: 14px; border-bottom: 1px solid var(--dfr-line) }
.dfr-lights { flex: none; display: flex; gap: 7px }
.dfr-lights i { width: 11px; height: 11px; border-radius: 50%; background: color-mix(in oklab, var(--dfr-ink) 13%, transparent) }
.dfr-url {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 26px; min-width: 0; max-width: 340px; margin: 0 auto; padding: 0 12px;
  border-radius: 9px; background: var(--dfr-fill); color: var(--dfr-t2); font-size: 13px; line-height: 26px; white-space: nowrap;
}
.dfr-url span { overflow: hidden; text-overflow: ellipsis }
.dfr-url svg { flex: none; color: var(--dfr-t3) }
.dfr-lights + .dfr-url { margin-right: 40px }
.dfr-tabs { flex: none; display: flex; align-items: flex-end; height: 38px; gap: 4px; padding: 0 12px 0 14px; border-bottom: 1px solid var(--dfr-line); background: color-mix(in oklab, var(--dfr-ink) 3%, transparent) }
.dfr-tabs .dfr-lights { align-self: center; margin-right: 12px }
.dfr-tab {
  position: relative; display: flex; align-items: center; height: 30px; padding: 0 16px; border-radius: 8px 8px 0 0; font-size: 13px; line-height: 30px; color: var(--dfr-t3);
  transition: color .2s var(--dfr-ease), background-color .2s var(--dfr-ease);
}
.dfr-tab:hover { color: var(--dfr-t2) }
.dfr-tab[aria-selected="true"] { color: var(--dfr-t1); background: var(--dfr-surface); box-shadow: -.5px -.5px 0 var(--dfr-line), .5px -.5px 0 var(--dfr-line) }
.dfr-tab[aria-selected="true"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--dfr-surface) }
.dfr-body { position: relative; flex: 1; min-height: 0; overflow: hidden }

/* ---- Phone ---- */
.dfr-phone { position: absolute; border-radius: var(--dfr-pr); background: var(--dfr-bezel); padding: var(--dfr-pb); box-shadow: var(--dfr-sat) }
.dfr-phone::before { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / .1), inset 0 1px 0 rgb(255 255 255 / .18); pointer-events: none; z-index: 3 }
.dfr-screen { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: calc(var(--dfr-pr) - var(--dfr-pb)); background: linear-gradient(176deg, var(--dfr-wall-a), var(--dfr-wall)); color: var(--dfr-t1) }
.dfr-island { position: absolute; z-index: 2; left: 50%; top: 11px; width: 46px; height: 19px; margin-left: -23px; border-radius: 10px; background: #000 }
.dfr-status { position: absolute; z-index: 2; left: 0; right: 0; top: 0; height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 6px 18px 0 22px; font-size: 13px; font-weight: 600; letter-spacing: -.01em; color: var(--dfr-t1) }
.dfr-status svg { display: block; height: 10px; width: auto }
.dfr-glyphs { display: flex; align-items: center; gap: 4px }
.dfr-phone[data-n] .dfr-glyphs svg:not(:last-child) { display: none }
.dfr-home { position: absolute; z-index: 2; left: 50%; bottom: 8px; width: 88px; height: 4px; margin-left: -44px; border-radius: 2px; background: var(--dfr-t1) }

/* ---- Cursor ---- */
.dfr-cur { position: absolute; z-index: 9; left: 0; top: 0; width: 20px; height: 20px; margin: -2px 0 0 -4px; opacity: 0; pointer-events: none; transition: transform .9s var(--dfr-ease), opacity .3s var(--dfr-ease); filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .3)) }
.dfr-cur[data-on] { opacity: 1 }
.dfr-cur[data-press] svg { transform: scale(.88); transition-duration: .1s }
.dfr-cur svg { display: block; transform-origin: 3px 2px; transition: transform .16s var(--dfr-ease) }

/* ---- Built-in scene: payouts ---- */
.dfr-page { position: absolute; inset: 0; display: flex }
.dfr-main { flex: none; width: var(--dfr-mainw, 412px); padding: 26px 0 0 28px }
.dfr-eyebrow { color: var(--dfr-t3); font-size: 13px; line-height: 18px }
.dfr-total { margin-top: 2px; font-size: 34px; line-height: 40px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--dfr-t1) }
.dfr-wait { position: relative; display: grid; margin-top: 2px; color: var(--dfr-t2); font-size: 14px; line-height: 20px }
.dfr-wait > span { grid-area: 1 / 1; transition: opacity .3s var(--dfr-ease), filter .3s var(--dfr-ease), transform .3s var(--dfr-ease) }
.dfr-wait .dfr-w1 { opacity: 0; filter: blur(4px); transform: translateY(5px) }
.dfr-page[data-ok] .dfr-w0 { opacity: 0; filter: blur(4px); transform: translateY(-5px) }
.dfr-page[data-ok] .dfr-w1 { opacity: 1; filter: none; transform: none }
.dfr-list { margin-top: 18px; border-top: 1px solid var(--dfr-line) }
.dfr-row { display: flex; align-items: center; gap: 12px; height: 60px; border-bottom: 1px solid var(--dfr-line) }
.dfr-tile { flex: none; width: 32px; height: 32px; border-radius: 9px; background: var(--dfr-fill); display: grid; place-items: center; color: var(--dfr-t2); font-size: 13px; font-weight: 600 }
.dfr-who { flex: 1; min-width: 0 }
.dfr-name { font-size: 15px; line-height: 20px; font-weight: 500; color: var(--dfr-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.dfr-meta { font-size: 13px; line-height: 18px; color: var(--dfr-t3); white-space: nowrap }
.dfr-amt { flex: none; width: 76px; text-align: right; font-size: 15px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--dfr-t1) }
.dfr-act { position: relative; flex: none; display: grid; justify-items: end; width: 96px }
.dfr-act > * { grid-area: 1 / 1; transition: opacity .3s var(--dfr-ease), filter .3s var(--dfr-ease), transform .3s var(--dfr-ease) }
.dfr-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 14px; border-radius: 9px; white-space: nowrap; font-size: 14px; font-weight: 500;
  background: var(--dfr-accent); color: var(--dfr-surface);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .16), 0 0 0 .5px color-mix(in oklab, var(--dfr-accent) 60%, #000), 0 1px 2px color-mix(in oklab, var(--dfr-accent) 28%, transparent);
  transition: transform .16s var(--dfr-ease), background-color .16s var(--dfr-ease), opacity .3s var(--dfr-ease), filter .3s var(--dfr-ease);
}
.dfr-btn:hover, .dfr-btn[data-hot] { background: color-mix(in oklab, var(--dfr-accent) 88%, #000) }
.dfr-btn:active, .dfr-btn[data-press] { transform: scale(.96) }
.dfr-page[data-ok] .dfr-btn { opacity: 0; filter: blur(4px); transform: scale(.94); pointer-events: none }
.dfr-set { display: flex; align-items: center; gap: 4px; justify-content: flex-end; white-space: nowrap; font-size: 13px; color: var(--dfr-t2); opacity: 0; filter: blur(4px); transform: translateY(4px); pointer-events: none }
.dfr-page[data-ok] .dfr-set { opacity: 1; filter: none; transform: none; pointer-events: auto }
.dfr-undo { height: 24px; padding: 0 6px; margin-right: -6px; border-radius: 6px; color: var(--dfr-t3); font-size: 13px; transition: background-color .16s var(--dfr-ease), color .16s var(--dfr-ease) }
.dfr-undo:hover { background: var(--dfr-fill); color: var(--dfr-t1) }
.dfr-sched { color: var(--dfr-t3) }
.dfr-bars { display: flex; flex-direction: column; justify-content: center; gap: 7px }
.dfr-bar-i { display: block; height: 8px; border-radius: 4px; background: var(--dfr-fill) }
.dfr-side { flex: 1; min-width: 0; margin-left: 28px; padding: 26px 20px 0 22px; border-left: 1px solid var(--dfr-line); display: flex; flex-direction: column; gap: 12px }
.dfr-side .dfr-bar-i:first-child { height: 10px; background: color-mix(in oklab, var(--dfr-ink) 10%, transparent) }

/* ---- Built-in scene: lock screen ---- */
.dfr-lock { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; padding-top: 62px; color: var(--dfr-t1) }
.dfr-day { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--dfr-t2) }
.dfr-clock { font-size: 58px; line-height: 62px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--dfr-t1) }
.dfr-note {
  position: absolute; left: 11px; right: 11px; top: 168px; display: flex; gap: 10px; padding: 10px 11px; border-radius: 18px; background: var(--dfr-surface);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 6px 16px -4px rgb(0 0 0 / .2);
  opacity: 0; filter: blur(5px); transform: translateY(-22px) scale(.96);
  transition: opacity .2s var(--dfr-ease), filter .2s var(--dfr-ease), transform .3s var(--dfr-ease);
}
.dfr-note[data-on] { opacity: 1; filter: none; transform: none; transition: opacity .42s var(--dfr-ease), filter .42s var(--dfr-ease), transform .7s var(--dfr-ease) }
.dfr-app { flex: none; width: 34px; height: 34px; border-radius: 9px; background: var(--dfr-ink); display: grid; place-items: center; color: var(--dfr-surface) }
.dfr-nt { flex: 1; min-width: 0 }
.dfr-nt b { white-space: nowrap; display: flex; justify-content: space-between; gap: 8px; font-size: 14px; line-height: 18px; font-weight: 600; color: var(--dfr-t1) }
.dfr-nt > span { display: block; margin-top: 1px; font-size: 13px; line-height: 17px; color: var(--dfr-t2) }
.dfr-nt-t { min-width: 0 }
.dfr-nt em { flex: none; font-style: normal; font-weight: 400; font-size: 12px; color: var(--dfr-t3) }

/* Compact: a second design for 360 wide, not a squeeze */
.dfr-page[data-c] .dfr-main { padding: 22px 0 0 22px }
.dfr-page[data-c] .dfr-tile, .dfr-page[data-c] .dfr-side, .dfr-page[data-c] .dfr-row:nth-child(n+2) { display: none }
.dfr-page[data-c] .dfr-amt { width: 62px }
.dfr-page[data-c] .dfr-act { width: 82px }
.dfr-page[data-c] .dfr-row { gap: 10px }
.dfr-lock[data-c] .dfr-day, .dfr-lock[data-c] .dfr-clock { display: none }
.dfr-lock[data-c] .dfr-note { top: 52px; padding: 9px 11px }
.dfr-lock[data-c] .dfr-app, .dfr-lock[data-c] .dfr-nt em { display: none }
@media (prefers-reduced-motion: reduce) {
  .dfr *, .dfr *::before, .dfr *::after { animation: none !important; transition: none !important }
}
@keyframes dfr-rise { from { opacity: 0; filter: blur(6px); translate: 0 26px } }
.dfr[data-enter] .dfr-win { animation: dfr-rise .8s var(--dfr-ease) backwards }
.dfr[data-enter] .dfr-phone { animation: dfr-rise .8s var(--dfr-ease) .14s backwards }
`

/* -------------------------------------------------------------------------- */
/*                                   Glyphs                                   */
/* -------------------------------------------------------------------------- */

const Lock = () => (
  <svg width="11" height="12" viewBox="0 0 11 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="1.5" y="5.2" width="8" height="5.6" rx="1.6" />
    <path d="M3.4 5.2V3.6a2.1 2.1 0 0 1 4.2 0v1.6" />
  </svg>
)

const Signal = () => (
  <svg viewBox="0 0 18 11" fill="currentColor" aria-hidden>
    <rect x="0" y="7" width="3" height="4" rx=".8" />
    <rect x="5" y="4.8" width="3" height="6.2" rx=".8" />
    <rect x="10" y="2.4" width="3" height="8.6" rx=".8" />
    <rect x="15" y="0" width="3" height="11" rx=".8" />
  </svg>
)
const Wifi = () => (
  <svg viewBox="0 0 16 11" fill="currentColor" aria-hidden>
    <path d="M8 2.2c2.1 0 4 .8 5.4 2.2l1.1-1.2A9.5 9.5 0 0 0 8 .5 9.5 9.5 0 0 0 1.5 3.2l1.1 1.2A7.8 7.8 0 0 1 8 2.2Z" />
    <path d="M8 5.6c1.2 0 2.3.5 3.1 1.2l1.1-1.2A6.4 6.4 0 0 0 8 3.9a6.4 6.4 0 0 0-4.2 1.7l1.1 1.2c.8-.7 1.9-1.2 3.100-1.200Z" />
    <circle cx="8" cy="9" r="1.5" />
  </svg>
)
const Battery = () => (
  <svg viewBox="0 0 27 12" fill="none" aria-hidden>
    <rect x=".5" y=".5" width="22" height="11" rx="3.4" stroke="currentColor" opacity=".4" />
    <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
    <path d="M24.500 4v4c.8-.3 1.500-1.100 1.500-2s-.7-1.700-1.500-2Z" fill="currentColor" opacity=".45" />
  </svg>
)
const Cursor = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
    <path d="M4 2.200 4.300 15.600l3.200-3.100 2.300 5 2.300-1-2.300-4.900 4.500-.2L4 2.200Z" fill="#111" stroke="#fff" strokeWidth="1.300" strokeLinejoin="round" />
  </svg>
)
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.200 6.300 4.800 8.900 9.800 3.200" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                   Frames                                   */
/* -------------------------------------------------------------------------- */

/**
 * A browser window drawn by the frame: controls, optional tab strip, centred address pill.
 * Give it a design size and position it inside a scaled stage (or `DeviceFrames`).
 */
export function BrowserFrame({ url = "northwind.co/payouts", title = "Browser window", tabs, activeTab = 0, onTabChange, theme = "auto", width = 560, height = 420, fade, style, className, children }: BrowserFrameProps) {
  const hasTabs = !!tabs && tabs.length > 1
  const tablist = React.useRef<HTMLDivElement>(null)
  const onKey = (e: React.KeyboardEvent) => {
    if (!tabs || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return
    e.preventDefault()
    const n = (activeTab + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
    onTabChange?.(n)
    requestAnimationFrame(() => tablist.current?.querySelectorAll<HTMLElement>("[role=tab]")[n]?.focus())
  }
  return (
    <div className={cn("dfr-win", className)} role="group" aria-label={title} data-fade={fade ? "" : undefined} data-t={theme === "auto" ? undefined : theme} style={{ width, height, ...style }}>
      {hasTabs ? (
        <div className="dfr-tabs" role="tablist" aria-label="Tabs" ref={tablist} onKeyDown={onKey}>
          <span className="dfr-lights" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          {tabs.map((t, i) => (
            <button key={t} type="button" role="tab" className="dfr-tab" aria-selected={i === activeTab} tabIndex={i === activeTab ? 0 : -1} onClick={() => onTabChange?.(i)}>
              {t}
            </button>
          ))}
        </div>
      ) : null}
      <div className="dfr-bar">
        {hasTabs ? null : (
          <span className="dfr-lights" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        )}
        <div className="dfr-url">
          <Lock />
          <span>{url}</span>
        </div>
      </div>
      <div className="dfr-body">{children}</div>
    </div>
  )
}

/**
 * A phone drawn by the frame: bezel, island, status bar with plain glyphs and the home indicator.
 * Nothing under the island: start content below 44px.
 */
export function PhoneFrame({ time = "9:41", title = "Phone", theme = "auto", width = 232, style, className, children }: PhoneFrameProps) {
  const bezel = Math.round(width * 0.034)
  const radius = Math.round(width * 0.19)
  return (
    <div
      className={cn("dfr-phone", className)}
      role="group"
      aria-label={title}
      data-t={theme === "auto" ? undefined : theme}
      data-n={width < 200 ? "" : undefined}
      style={{ width, height: Math.round(width * 2.1), ["--dfr-pr" as string]: `${radius}px`, ["--dfr-pb" as string]: `${bezel}px`, ...style }}
    >
      <div className="dfr-screen">
        <div className="dfr-status" aria-hidden>
          <span>{time}</span>
          <span className="dfr-glyphs">
            <Signal />
            <Wifi />
            <Battery />
          </span>
        </div>
        <div className="dfr-island" aria-hidden />
        {children}
        <div className="dfr-home" aria-hidden />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Layout and scale                            */
/* -------------------------------------------------------------------------- */

type Box = { x: number; y: number; w: number; h: number }
type Layout = { W: number; H: number; win?: Box; ph?: { x: number; y: number; w: number }; fade?: boolean; mainw: number }

function layoutFor(kind: DeviceKind, crop: DeviceCrop, bleed: number, compact: boolean): Layout {
  const b = Math.min(0.45, Math.max(0, bleed))
  if (kind === "pair") {
    return compact
      ? { W: 360, H: 470, mainw: 322, win: { x: 18, y: 26, w: 360, h: 520 }, ph: { x: 150, y: 272, w: 190 } }
      : { W: 760, H: 460, mainw: 400, win: { x: 36, y: 34, w: 560, h: 520 }, ph: { x: 496, y: 88, w: 240 } }
  }
  const W = compact ? 360 : 760
  const H = compact ? 400 : 460
  const g = compact ? 18 : 36
  const mainw = compact ? 336 : 412
  if (kind === "phone") {
    const w = compact ? 210 : 250
    const h = w * 2.1
    const x = crop === "right" ? W - g - w * (1 - b) : (W - w) / 2
    return { W, H: crop === "none" ? Math.round(h + g * 2) : H, mainw, ph: { x, y: g, w }, fade: crop === "fade" }
  }
  // browser
  if (crop === "none") return { W, H: compact ? 330 : 400, mainw, win: { x: g, y: g, w: W - g * 2, h: (compact ? 330 : 400) - g * 2 } }
  if (crop === "fade") return { W, H, mainw, win: { x: g, y: g, w: W - g * 2, h: H - g * 1.4 }, fade: true }
  if (crop === "right") {
    const vis = W - g
    return { W, H, mainw, win: { x: g, y: g, w: Math.round(vis / (1 - b)), h: H - g * 2 } }
  }
  const vis = H - g
  return { W, H, mainw, win: { x: g, y: g, w: W - g * 2, h: Math.round(vis / (1 - b)) } }
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                               Built-in scene                               */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "move" | "hover" | "press" | "done"

const ROWS = [
  { n: "Alder & Co", m: "INV-2288", a: "$1,240", i: "A" },
  { n: "Finch Print", m: "INV-2290", a: "$312", i: "F" },
]

function Payouts({ ok, hot, press, btnRef, onApprove, onUndo, tab, mainw, compact }: {compact?: boolean;  ok: boolean; hot: boolean; press: boolean; btnRef: React.Ref<HTMLButtonElement>; onApprove: () => void; onUndo: () => void; tab: number; mainw: number }) {
  const vendors = tab === 1
  return (
    <div className="dfr-page" data-c={compact ? "" : undefined} data-ok={ok ? "" : undefined} style={{ ["--dfr-mainw" as string]: `${mainw}px` }}>
      <div className="dfr-main">
        <p className="dfr-eyebrow">{vendors ? "Vendors · 38 active" : "Friday run · 14 invoices"}</p>
        <p className="dfr-total">{vendors ? "$212,904" : "$38,420"}</p>
        {vendors ? (
          <p className="dfr-wait">
            <span>Paid year to date</span>
          </p>
        ) : (
          <p className="dfr-wait" aria-live="polite">
            <span className="dfr-w0">1 invoice needs you</span>
            <span className="dfr-w1">Nothing waiting on you</span>
          </p>
        )}
        <div className="dfr-list">
          {vendors ? (
            <>
              {["Northwind Freight", "Alder & Co", "Finch Print", "Harbor Cold Storage"].map((v, i) => (
                <div className="dfr-row" key={v}>
                  <span className="dfr-tile" aria-hidden>
                    {v[0]}
                  </span>
                  <span className="dfr-who">
                    <span className="dfr-name" style={{ display: "block" }}>
                      {v}
                    </span>
                    <span className="dfr-meta">Net 30 · {["12", "7", "4", "9"][i]} invoices</span>
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="dfr-row">
                <span className="dfr-tile" aria-hidden>
                  N
                </span>
                <span className="dfr-who">
                  <span className="dfr-name" style={{ display: "block" }}>
                    Northwind Freight
                  </span>
                  <span className="dfr-meta">$180 over the PO</span>
                </span>
                <span className="dfr-amt">$4,860</span>
                <span className="dfr-act">
                  <button ref={btnRef} type="button" className="dfr-btn" data-hot={hot ? "" : undefined} data-press={press ? "" : undefined} tabIndex={ok ? -1 : 0} onClick={onApprove}>
                    Approve
                  </button>
                  <span className="dfr-set">
                    <Check />
                    <span className="dfr-sched">Fri</span>
                    <button type="button" className="dfr-undo" tabIndex={ok ? 0 : -1} onClick={onUndo}>
                      Undo
                    </button>
                  </span>
                </span>
              </div>
              {ROWS.map((r) => (
                <div className="dfr-row" key={r.n}>
                  <span className="dfr-tile" aria-hidden>
                    {r.i}
                  </span>
                  <span className="dfr-who">
                    <span className="dfr-name" style={{ display: "block" }}>
                      {r.n}
                    </span>
                    <span className="dfr-meta">{r.m}</span>
                  </span>
                  <span className="dfr-amt">{r.a}</span>
                  <span className="dfr-act" style={{ color: "var(--dfr-t3)", fontSize: 13 }}>
                    <span style={{ justifySelf: "end", display: "flex", gap: 4, alignItems: "center" }}>
                      <Check />
                      Fri
                    </span>
                  </span>
                </div>
              ))}
              {[62, 48, 70].map((w, i) => (
                <div className="dfr-row" key={i}>
                  <span className="dfr-tile" aria-hidden />
                  <span className="dfr-who dfr-bars">
                    <i className="dfr-bar-i" style={{ width: `${w}%` }} />
                    <i className="dfr-bar-i" style={{ width: `${w - 24}%`, height: 6 }} />
                  </span>
                  <i className="dfr-bar-i" style={{ width: 52 }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="dfr-side" aria-hidden>
        <i className="dfr-bar-i" style={{ width: "58%" }} />
        <i className="dfr-bar-i" style={{ width: "86%" }} />
        <i className="dfr-bar-i" style={{ width: "70%" }} />
        <i className="dfr-bar-i" style={{ width: "92%" }} />
        <i className="dfr-bar-i" style={{ width: "44%" }} />
      </div>
    </div>
  )
}

function LockScreen({ notif, compact }: { notif: boolean; compact?: boolean }) {
  return (
    <div className="dfr-lock" data-c={compact ? "" : undefined}>
      <p className="dfr-day">Thursday 13 November</p>
      <p className="dfr-clock">9:41</p>
      <div className="dfr-note" data-on={notif ? "" : undefined} role="status" aria-live="polite" aria-hidden={!notif}>
        <span className="dfr-app" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.500 9.500 7.300 13 14.500 5" />
          </svg>
        </span>
        <span className="dfr-nt">
          <b>
            <span className="dfr-nt-t">Approved</span>
            <em>now</em>
          </b>
          <span>Northwind · $4,860</span>
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  The piece                                 */
/* -------------------------------------------------------------------------- */

export function DeviceFrames(props: DeviceFramesProps) {
  const {
    kind = "pair",
    url = "northwind.co/payouts",
    title,
    tabs: tabsProp,
    theme = "auto",
    crop: cropProp,
    bleed = 0.2,
    scale = 1,
    compact: compactProp,
    children,
    screen,
    onApprove,
    onUndo,
    className,
  } = props
  const bare = props.approved === undefined
  const crop = cropProp ?? (kind === "browser" ? "right" : "bottom")
  const builtinWin = children === undefined && kind !== "phone"
  const builtinScreen = screen === undefined && children === undefined && kind !== "browser"

  const tabs = tabsProp ?? (builtinWin ? ["Payouts", "Vendors"] : undefined)
  const [tabState, setTabState] = React.useState(0)
  const tab = props.activeTab ?? tabState

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  /* ---- fit the card ---- */
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [cw, setCw] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    setCw(el.clientWidth)
    const ro = new ResizeObserver(() => setCw(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const compact = compactProp ?? (cw > 0 && cw < 640)
  const L = React.useMemo(() => layoutFor(kind, crop, bleed, compact), [kind, crop, bleed, compact])
  const s = (cw > 0 ? cw / L.W : 1) * scale

  /* ---- scene state ---- */
  const [simOk, setSimOk] = React.useState(() => prefersReduced())
  const [delayed, setDelayed] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>(() => (prefersReduced() ? "done" : "idle"))
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const [enter, setEnter] = React.useState(() => !prefersReduced())
  const ok = bare ? simOk : !!props.approved
  const [cur, setCur] = React.useState({ x: 0, y: 0 })
  const stageRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!enter) return
    const t = window.setTimeout(() => setEnter(false), 1200)
    return () => window.clearTimeout(t)
  }, [enter])

  // The notification follows an approval by a beat, whoever pressed the button.
  React.useEffect(() => {
    if (!ok || reduce) return
    const t = window.setTimeout(() => setDelayed(true), 620)
    return () => {
      window.clearTimeout(t)
      setDelayed(false)
    }
  }, [ok, reduce])
  const notif = ok && (reduce || delayed)

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!bare) return
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
  }, [bare])

  const measure = React.useCallback(() => {
    const st = stageRef.current
    const b = btnRef.current
    if (!st || !b) return
    const a = st.getBoundingClientRect()
    const r = b.getBoundingClientRect()
    const k = a.width / L.W || 1
    setCur({ x: (r.left - a.left + r.width * 0.78) / k, y: (r.top - a.top + r.height * 0.7) / k })
  }, [L.W])

  // The decisive moment: the cursor travels to Approve, presses, the row settles, the phone gets its notification.
  React.useEffect(() => {
    if (!bare || !active || reduce || !auto || tab !== 0) return
    let t = 0
    const go = (ms: number, fn: () => void) => {
      t = window.setTimeout(fn, ms)
    }
    if (phase === "idle") {
      go(simOk ? 600 : 1500, () => {
        setSimOk(false)
        measure()
        setPhase("move")
      })
    } else if (phase === "move") go(1000, () => setPhase("hover"))
    else if (phase === "hover") go(260, () => setPhase("press"))
    else if (phase === "press")
      go(170, () => {
        setSimOk(true)
        onApprove?.()
        setPhase("done")
      })
    else if (phase === "done") go(4800, () => setPhase("idle"))
    return () => window.clearTimeout(t)
  }, [bare, active, reduce, auto, phase, tab, simOk, measure, onApprove])

  // Any touch or key on the page ends the demo for good.
  const stopAuto = React.useCallback(() => {
    setAuto(false)
    setPhase((p) => (p === "done" ? p : "idle"))
  }, [])
  React.useEffect(() => {
    if (!bare) return
    window.addEventListener("pointerdown", stopAuto, true)
    window.addEventListener("keydown", stopAuto, true)
    return () => {
      window.removeEventListener("pointerdown", stopAuto, true)
      window.removeEventListener("keydown", stopAuto, true)
    }
  }, [bare, stopAuto])

  const approve = React.useCallback(() => {
    if (bare) setSimOk(true)
    onApprove?.()
  }, [bare, onApprove])
  const undo = React.useCallback(() => {
    if (bare) setSimOk(false)
    onUndo?.()
  }, [bare, onUndo])

  const home = { x: (L.win?.x ?? 0) + L.mainw - 60, y: (L.win?.y ?? 0) + 300 }
  const cx = phase === "idle" ? home.x : cur.x
  const cy = phase === "idle" ? home.y : cur.y
  const winBody = builtinWin ? (
    <Payouts compact={compact} ok={ok} hot={phase === "hover" || phase === "press"} press={phase === "press"} btnRef={btnRef} onApprove={approve} onUndo={undo} tab={tab} mainw={L.mainw} />
  ) : (
    children
  )
  const phoneBody = builtinScreen ? <LockScreen notif={notif} compact={compact} /> : (screen ?? children)
  const showCursor = bare && builtinWin && (phase === "move" || phase === "hover" || phase === "press") && !reduce
  const label = kind === "pair" ? "Product shot: a browser window with a phone beside it" : kind === "browser" ? "Product shot: a browser window" : "Product shot: a phone"

  return (
    <div ref={rootRef} className={cn("dfr", className)} data-t={theme === "auto" ? undefined : theme} data-enter={enter ? "" : undefined}>
      <div className="dfr-card" style={{ aspectRatio: `${L.W} / ${L.H}` }} role="group" aria-label={label}>
        <div ref={stageRef} className="dfr-stage" style={{ width: L.W, height: L.H, transform: `scale(${s})` }}>
          {L.win ? (
            <BrowserFrame
              url={url}
              title={title ?? "Payouts"}
              tabs={tabs}
              activeTab={tab}
              onTabChange={(i) => {
                setTabState(i)
                props.onTabChange?.(i)
              }}
              theme={theme}
              fade={L.fade}
              width={L.win.w}
              height={L.win.h}
              style={{ left: L.win.x, top: L.win.y }}
            >
              {winBody}
            </BrowserFrame>
          ) : null}
          {L.ph ? <PhoneFrame title={kind === "phone" ? title : undefined} theme={theme} width={L.ph.w} style={{ left: L.ph.x, top: L.ph.y }}>{phoneBody}</PhoneFrame> : null}
          {bare ? (
            <span className="dfr-cur" data-on={showCursor ? "" : undefined} data-press={phase === "press" ? "" : undefined} style={{ transform: `translate(${cx}px, ${cy}px)` }} aria-hidden>
              <Cursor />
            </span>
          ) : null}
        </div>
      </div>
      <style href="device-frames" precedence="default">
        {CSS}
      </style>
    </div>
  )
}
