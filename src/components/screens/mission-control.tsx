"use client"

import * as React from "react"
import {
  BookOpenText,
  ChevronDown,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Menu,
  PenLine,
  Radar,
  Search,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MissionControlProps = {
  /** Called with the label of any rail item that is clicked. */
  onNavigate?: (label: string) => void
  /** Extra controls rendered at the bottom of the rail, above the user. */
  sideTools?: React.ReactNode
}

type AgentId = "atlas" | "sage" | "quill" | "nova" | "ledger"
type LaneStatus = "live" | "waiting" | "failed" | "idle" | "held"
type LineKind = "tool" | "llm" | "ok" | "err" | "sys"
type Seg = [start: number, end: number, ok: boolean]

type Lane = {
  id: AgentId
  status: LaneStatus
  step: number
  runs: number
  fail: number
  cost: number
  load: number
  runNo: number
  segs: Seg[]
}

type LogLine = { id: number; t: number; agent: AgentId; kind: LineKind; msg: string; fresh: boolean }

type Sim = {
  clock: number
  lanes: Lane[]
  cap: number
  latency: number
  lines: LogLine[]
  lineId: number
  rate: number
}

type AttnAction = { id: string; label: string; primary?: boolean }
type Attn = {
  id: string
  kind: "approval" | "budget" | "failed"
  agent: AgentId
  age: string
  title: string
  body: string
  note?: string
  actions: AttnAction[]
  phase: "idle" | "out" | "gone"
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.imc {
  --imc-paper: #fafafa;
  --imc-sheet: #ffffff;
  --imc-ink: #0a0a0a;
  --imc-signal: #0060e2;
  --imc-accent: var(--imc-signal);
  --imc-surface: var(--imc-sheet);
  --imc-signal-soft: color-mix(in oklab, var(--imc-signal) 12%, transparent);
  --imc-t1: color-mix(in oklab, var(--imc-ink) 92%, transparent);
  --imc-t2: color-mix(in oklab, var(--imc-ink) 64%, transparent);
  --imc-t3: color-mix(in oklab, var(--imc-ink) 44%, transparent);
  --imc-t4: color-mix(in oklab, var(--imc-ink) 22%, transparent);
  --imc-rule: color-mix(in oklab, var(--imc-ink) 14%, transparent);
  --imc-rule-2: color-mix(in oklab, var(--imc-ink) 7%, transparent);
  --imc-ok: #1f8a4c; --imc-warn: #b7791f; --imc-bad: #c4321a;
  --imc-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --imc-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --imc-font: var(--imc-sans);
  --imc-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --imc-ease: cubic-bezier(.2, .8, .2, 1);
  --imc-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; display: flex; width: 100%; height: 100%; min-height: 0; overflow: hidden;
  background: var(--imc-paper); color: var(--imc-t1);
  font: 13px/20px var(--imc-font); -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .imc {
  --imc-paper: #0c0c0d; --imc-sheet: #1c1c1e; --imc-ink: #f5f5f5; --imc-signal: #4d8dff;
  --imc-ok: #4fbf7f; --imc-warn: #d9a040; --imc-bad: #ef6a52;
}
.imc *, .imc *::before, .imc *::after { box-sizing: border-box }
:where(.imc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
:where(.imc) :is(h1, h2, p, ul, li) { margin: 0; padding: 0; list-style: none }
.imc :focus-visible { outline: 2px solid var(--imc-accent); outline-offset: 2px }
.imc input:focus-visible { outline: none }
.imc-lab { font: 500 10.5px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3) }
.imc-mono { font-family: var(--imc-mono); font-variant-numeric: tabular-nums }
.imc-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* ---- rail ---- */
.imc-rlab { font-family: var(--imc-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3) }
.imc-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--imc-sheet); border-right: 1px solid var(--imc-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.imc-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--imc-serif); letter-spacing: -.01em; color: var(--imc-ink) }
.imc-brand svg { flex: none }
.imc-rgroup { padding: 0 12px; margin-top: 12px }
.imc-rgroup > .imc-rlab { padding: 0 6px; margin-bottom: 6px; display: block }
.imc-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--imc-rule); background: var(--imc-paper); color: var(--imc-t1); transition: box-shadow .2s var(--imc-ease) }
.imc-ws:hover { box-shadow: 0 0 0 1px var(--imc-t4) }
.imc-ws svg { color: var(--imc-t3) }
.imc-rnav { position: relative; margin: 0 0 0 8px; padding: 0 }
.imc-rnav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--imc-rule) }
.imc-ritem { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--imc-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--imc-ease), background-color .2s var(--imc-ease) }
.imc-ritem:hover { color: var(--imc-t1); background: var(--imc-rule-2) }
.imc-ritem svg { flex: none; stroke-width: 1.5 }
.imc-ritem.is-active { color: var(--imc-ink) }
.imc-ritem.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--imc-accent); transform-origin: top; animation: imc-rtick .5s var(--imc-ease) backwards }
.imc-ragent { padding-left: 16px }
.imc-rdot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--imc-t4); position: relative }
.imc-rdot.ok { background: var(--imc-ok) }
.imc-rdot.live { background: var(--imc-accent) }
.imc-rdot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--imc-accent); animation: imc-rpulse 1.6s var(--imc-ease) infinite }
.imc-ragent .imc-rlab { margin-left: auto; font-size: 9.5px }
.imc-rspacer { flex: 1; min-height: 12px }
.imc-ruser { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--imc-rule) }
.imc-rav { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--imc-ink); color: var(--imc-paper); font: 600 10px/1 var(--imc-mono); letter-spacing: .04em }
.imc-ruser b { font-weight: 500; color: var(--imc-t1); display: block; line-height: 16px }
.imc-ruser div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--imc-t3) }
.imc-sidetools { padding: 8px 12px }
.imc-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--imc-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--imc-ease) }

/* ---- main + top bar ---- */
.imc-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--imc-rule); background: var(--imc-paper) }
.imc-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--imc-rule); background: var(--imc-sheet) }
.imc-ttl { min-width: 0 }
.imc-ttl .imc-crumb { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.imc-ttl h1 { margin: 0; font: 400 22px/24px var(--imc-serif); letter-spacing: -.01em; color: var(--imc-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.imc-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.imc-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--imc-rule); background: var(--imc-sheet); color: var(--imc-t3); transition: box-shadow .2s var(--imc-ease) }
.imc-search:hover { box-shadow: 0 0 0 1px var(--imc-t4) }
.imc-search span { flex: 1 }
.imc-search kbd { font: 500 10px/14px var(--imc-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--imc-rule); color: var(--imc-t3) }
.imc-tbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--imc-rule); background: var(--imc-sheet); color: var(--imc-t1); font-weight: 500; transition: box-shadow .2s var(--imc-ease), opacity .2s }
.imc-tbtn svg { flex: none }
.imc-tbtn:hover { box-shadow: 0 0 0 1px var(--imc-t3) }
.imc-tbtn.ink { background: var(--imc-ink); color: var(--imc-paper); box-shadow: none }
.imc-tbtn.ink:hover { opacity: .88 }
.imc-search input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; outline: 0; background: none; color: var(--imc-t1); font: inherit; -webkit-appearance: none; appearance: none }
.imc-search input::placeholder { color: var(--imc-t3); opacity: 1 }
.imc-search input::-webkit-search-cancel-button { display: none }
.imc-search:focus-within { box-shadow: 0 0 0 1px var(--imc-t3) }
@keyframes imc-rpulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes imc-rtick { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* ---- rail + top bar: responsive (shared by all Meridian screens) ---- */
@media (max-width: 1023px) {
  .imc-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--imc-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--imc-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .imc.is-open .imc-rail { transform: none; visibility: visible; transition: transform .32s var(--imc-ease), visibility 0s }
  .imc.is-open .imc-scrim { opacity: 1; pointer-events: auto }
  .imc-menu { display: grid }
}
@media (max-width: 1099px) { .imc-search { display: none } }
@media (max-width: 767px) {
  .imc-top { padding: 0 12px; gap: 10px }
  .imc-ttl .imc-crumb { display: none }
  .imc-ttl h1 { font-size: 21px }
}

/* extra rail dot states for lane statuses */
.imc-rdot.warn { background: var(--imc-warn) }
.imc-rdot.bad { background: var(--imc-bad) }

/* lane status dots (used by the Lanes panel) */
.imc-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; margin: 0 4px; background: var(--imc-t3) }
.imc-dot.s-live { background: var(--imc-ink) }
.imc-dot.s-waiting { background: var(--imc-warn) }
.imc-dot.s-failed { background: var(--imc-bad) }
.imc-dot.s-idle, .imc-dot.s-held { background: transparent; box-shadow: inset 0 0 0 1px var(--imc-t3) }

.imc-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0 }
/* pressed = feed frozen */
.imc-tbtn[aria-pressed="true"] { background: var(--imc-ink); color: var(--imc-paper); box-shadow: none }
@media (max-width: 767px) { .imc-tbtn.ink { display: none } }

/* ---- grid & panels ---- */
.imc-scroll { flex: 1; min-height: 0; overflow: auto; container: imc / inline-size; overscroll-behavior: contain }
.imc-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 20px; padding: 24px 28px 40px; max-width: 1680px; margin: 0 auto }
.imc-c12 { grid-column: span 12 } .imc-c8 { grid-column: span 8 } .imc-c4 { grid-column: span 4 } .imc-c5 { grid-column: span 5 } .imc-c7 { grid-column: span 7 }
.imc-panel { position: relative; display: flex; flex-direction: column; min-width: 0; background: var(--imc-sheet); border: 1px solid var(--imc-rule); border-radius: 4px; animation: imc-panel-in .7s var(--imc-ease-trace) var(--d, 0ms) backwards }
.imc-panel > .imc-scanline { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--imc-accent); pointer-events: none; z-index: 3; animation: imc-panel-line .7s var(--imc-ease-trace) var(--d, 0ms) backwards }
@keyframes imc-panel-in { from { clip-path: inset(-8px -8px 100% -8px) } to { clip-path: inset(-8px -8px -8px -8px) } }
@keyframes imc-panel-line { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
.imc-crop i { position: absolute; width: 8px; height: 8px; border: 0 solid var(--imc-t4); pointer-events: none }
.imc-crop i:nth-child(1) { top: -5px; left: -5px; border-top-width: 1px; border-left-width: 1px }
.imc-crop i:nth-child(2) { top: -5px; right: -5px; border-top-width: 1px; border-right-width: 1px }
.imc-crop i:nth-child(3) { bottom: -5px; left: -5px; border-bottom-width: 1px; border-left-width: 1px }
.imc-crop i:nth-child(4) { bottom: -5px; right: -5px; border-bottom-width: 1px; border-right-width: 1px }
.imc-head { flex: none; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 18px 12px }
.imc-head h2 { font: 400 20px/24px var(--imc-serif); letter-spacing: -.01em; margin-top: 2px }
.imc-head p { margin-top: 2px; color: var(--imc-t2); font-size: 12.5px; line-height: 18px; max-width: 52ch }
.imc-head-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end }
.imc-fig { flex: none; padding: 10px 18px 14px; font: 500 10.5px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3) }
.imc-fig b { font-weight: 500; color: var(--imc-t2) }

@container imc (max-width: 999px) {
  .imc-c8, .imc-c4, .imc-c5, .imc-c7 { grid-column: span 12 }
}
@container imc (max-width: 639px) {
  .imc-grid { padding: 16px 16px 32px; gap: 16px }
  .imc-head { padding: 14px 14px 10px; flex-direction: column; gap: 8px }
  .imc-head-r { justify-content: flex-start }
  .imc-fig { padding: 8px 14px 12px }
}

/* ---- readouts ---- */
.imc-ro { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background: var(--imc-rule); border-radius: 3px; overflow: hidden }
.imc-rc { background: var(--imc-sheet); padding: 14px 18px 14px; min-width: 0 }
.imc-rv { display: flex; align-items: baseline; gap: 5px; margin-top: 4px; font: 500 24px/28px var(--imc-mono); font-variant-numeric: tabular-nums; letter-spacing: -.02em; color: var(--imc-ink); white-space: nowrap }
.imc-rv small { font: 400 12px/16px var(--imc-mono); letter-spacing: 0; color: var(--imc-t3) }
.imc-rcap { margin-top: 2px; font: 500 10px/14px var(--imc-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--imc-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.imc-meter { position: relative; height: 12px; margin-top: 8px }
.imc-meter .trk { position: absolute; left: 0; right: 0; top: 6px; height: 1px; background: var(--imc-rule) }
.imc-meter .trk::after { content: ""; position: absolute; inset: -3px 0 auto 0; height: 7px; background: repeating-linear-gradient(90deg, var(--imc-t4) 0 1px, transparent 1px 10%); opacity: .6 }
.imc-meter .fill { position: absolute; left: 0; top: 5px; height: 3px; background: var(--imc-ink); transition: width .7s var(--imc-ease) }
.imc-meter .mk { position: absolute; top: 1px; width: 2px; height: 11px; margin-left: -1px; background: var(--imc-ink); transition: left .7s var(--imc-ease) }
.imc-meter .tg { position: absolute; top: 2px; width: 1px; height: 9px; background: var(--imc-t3) }
.imc-ticks { display: flex; gap: 3px; height: 12px; margin-top: 8px; align-items: flex-end }
.imc-ticks i { flex: 1; height: 100%; max-width: 28px; border-bottom: 2px solid var(--imc-t4); transition: border-color .4s var(--imc-ease), height .4s var(--imc-ease) }
.imc-ticks i.on { border-color: var(--imc-ink) }
.imc-bars { display: flex; gap: 2px; height: 12px; margin-top: 8px; align-items: flex-end }
.imc-bars i { flex: 1; background: var(--imc-t4); min-height: 1px; transition: height .5s var(--imc-ease) }
.imc-bars i:last-child { background: var(--imc-ink) }
@container imc (max-width: 899px) {
  .imc-ro { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .imc-rc:last-child { grid-column: 1 / -1 }
}

/* ---- scope ---- */
.imc-stage { position: relative; flex: 1; min-height: 220px; margin: 0 18px }
.imc-dotgrid { position: absolute; inset: 0; background-image: radial-gradient(circle, var(--imc-t4) 0.7px, transparent 1px); background-size: 8px 8px; opacity: .55; -webkit-mask-image: radial-gradient(ellipse 75% 80% at 50% 50%, #000 35%, transparent 100%); mask-image: radial-gradient(ellipse 75% 80% at 50% 50%, #000 35%, transparent 100%) }
.imc-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: pan-y }
.imc-livechip { display: inline-flex; align-items: center; gap: 8px; font: 500 10.5px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t2) }
.imc-pulse { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--imc-accent) }
.imc-pulse::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--imc-accent); animation: imc-pulse 1.6s var(--imc-ease) infinite }
.imc-pulse.is-off { background: transparent; box-shadow: inset 0 0 0 1px var(--imc-t3) }
.imc-pulse.is-off::after { display: none }
@keyframes imc-pulse { from { transform: scale(1); opacity: .8 } to { transform: scale(3); opacity: 0 } }
.imc-kv { display: flex; align-items: baseline; gap: 6px; font: 500 10.5px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3); padding-left: 10px; border-left: 1px solid var(--imc-rule) }
.imc-kv b { font-weight: 500; font-size: 12px; letter-spacing: 0; color: var(--imc-ink); font-variant-numeric: tabular-nums }

/* ---- attention queue ---- */
.imc-q { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); column-gap: 12px; padding: 0 18px 8px; align-content: start }
.imc-qw { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .32s var(--imc-ease) }
.imc-qw.is-gone { grid-template-rows: 0fr }
.imc-qwi { min-height: 0; overflow: hidden }
.imc-qpad { padding-bottom: 12px }
.imc-qi { position: relative; padding: 12px 14px 12px 16px; border: 1px solid var(--imc-rule); border-radius: 4px; background: var(--imc-paper); animation: imc-q-in .6s var(--imc-ease-trace) backwards }
.imc-qi::before { content: ""; position: absolute; left: -1px; top: 10px; bottom: 10px; width: 2px; background: var(--imc-accent) }
.imc-qi::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--imc-accent); opacity: 0; pointer-events: none }
.imc-qi.is-out { animation: imc-q-out .56s var(--imc-ease-trace) forwards }
.imc-qi.is-out::after { animation: imc-q-line-out .56s var(--imc-ease-trace) forwards }
.imc-qi:not(.is-out)::after { animation: imc-q-line-in .6s var(--imc-ease-trace) backwards }
@keyframes imc-q-in { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes imc-q-out { from { clip-path: inset(0 0 0 0) } to { clip-path: inset(100% 0 0 0) } }
@keyframes imc-q-line-in { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: calc(100% - 1px); opacity: 0 } }
@keyframes imc-q-line-out { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: calc(100% - 1px); opacity: 0 } }
.imc-qk { display: flex; justify-content: space-between; gap: 8px }
.imc-qt { margin-top: 4px; font-size: 13.5px; line-height: 19px; font-weight: 500; color: var(--imc-ink); text-wrap: pretty }
.imc-qb { margin-top: 3px; color: var(--imc-t2); font-size: 12.5px; line-height: 18px; text-wrap: pretty }
.imc-note { position: relative; margin: 8px 0 0 10px; padding-left: 12px; border-left: 1px solid var(--imc-t4); font: italic 400 14.5px/18px var(--imc-serif); color: var(--imc-t2) }
.imc-note::before { content: ""; position: absolute; left: -10px; top: 9px; width: 10px; height: 1px; background: var(--imc-t4) }
.imc-qa { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px }
.imc-qbtn { height: 28px; padding: 0 12px; border: 1px solid var(--imc-rule); border-radius: 2px; font-size: 12.5px; font-weight: 500; color: var(--imc-t1); transition: background-color .2s var(--imc-ease), border-color .2s var(--imc-ease), color .2s var(--imc-ease) }
.imc-qbtn:hover { border-color: var(--imc-t3) }
.imc-qbtn.is-primary { border-color: var(--imc-accent); color: var(--imc-ink) }
.imc-qbtn.is-primary:hover { background: var(--imc-accent); color: var(--imc-paper) }
.imc-clear { margin: 0 18px 18px; padding: 22px 16px; border: 1px dashed var(--imc-rule); border-radius: 4px; text-align: center; animation: imc-q-in .6s var(--imc-ease-trace) backwards }
.imc-clear p { font: italic 400 17px/22px var(--imc-serif); color: var(--imc-t2); margin-top: 4px }

/* ---- lanes ---- */
.imc-lanes { container: imcl / inline-size }
.imc-lrow { display: grid; grid-template-columns: 196px minmax(180px, 1.1fr) minmax(220px, 1.5fr) 84px 92px; column-gap: 20px; align-items: center; padding: 11px 18px; border-top: 1px solid var(--imc-rule-2); transition: background-color .2s var(--imc-ease) }
.imc-lrow.is-head { padding-top: 8px; padding-bottom: 8px; border-top: 1px solid var(--imc-rule) }
.imc-lrow.is-sel { background: var(--imc-rule-2) }
.imc-lname { display: flex; align-items: center; gap: 10px; min-width: 0; width: 100%; padding: 4px 0 }
.imc-lname:hover b { text-decoration: underline; text-decoration-color: var(--imc-t4); text-underline-offset: 3px }
.imc-lname b { display: block; font-weight: 500; font-size: 13.5px; line-height: 18px; color: var(--imc-ink) }
.imc-lname span.r { display: block; font: 500 10px/14px var(--imc-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--imc-t3); white-space: nowrap }
.imc-lname .tx { flex: 1; min-width: 0 }
.imc-lname .n { display: flex; align-items: baseline; justify-content: space-between; gap: 8px }
.imc-lname span.r { overflow: hidden; text-overflow: ellipsis }
.imc-lstat { font: 500 9.5px/12px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3) }
.imc-lstat.s-waiting { color: var(--imc-warn) } .imc-lstat.s-failed { color: var(--imc-bad) } .imc-lstat.s-live { color: var(--imc-t1) }
.imc-lstep { min-width: 0 }
.imc-lstep .k { font: 500 10px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t3); white-space: nowrap }
.imc-lstep .v { font-size: 12.5px; line-height: 18px; color: var(--imc-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.imc-lstep .v.bad { color: var(--imc-bad) }
.imc-caret { display: inline-block; width: 6px; height: 12px; margin-left: 2px; vertical-align: -1px; background: var(--imc-ink); animation: imc-blink 1.1s steps(1) infinite }
@keyframes imc-blink { 50% { opacity: 0 } }
.imc-tlwrap { position: relative; min-width: 0 }
.imc-tl { display: block; width: 100%; height: 24px; overflow: visible; animation: imc-trace-x .95s var(--imc-ease-trace) var(--d, 0ms) backwards }
@keyframes imc-trace-x { from { clip-path: inset(-2px 100% -2px 0) } to { clip-path: inset(-2px 0 -2px 0) } }
.imc-hrs { position: relative; height: 14px }
.imc-hrs span { position: absolute; top: 0; transform: translateX(-50%); font: 500 10px/14px var(--imc-mono); letter-spacing: .06em; color: var(--imc-t3) }
.imc-hrs span:first-child { transform: none } .imc-hrs span:last-child { transform: translateX(-100%) }
.imc-lcost { text-align: right; font: 500 13px/18px var(--imc-mono); font-variant-numeric: tabular-nums; color: var(--imc-ink) }
.imc-lcost small { display: block; font: 400 10.5px/14px var(--imc-mono); color: var(--imc-t3) }
.imc-lload { display: flex; align-items: center; gap: 8px; justify-content: flex-end }
.imc-lload canvas { display: block; width: 44px; height: 16px }
.imc-lload span { width: 28px; text-align: right; font: 400 11px/14px var(--imc-mono); font-variant-numeric: tabular-nums; color: var(--imc-t2) }
.imc-lh-r { text-align: right }
@container imcl (max-width: 819px) {
  .imc-lrow.is-head { display: none }
  .imc-lrow { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name cost" "step step" "line load"; row-gap: 8px; column-gap: 16px; padding: 12px 14px }
  .imc-lrow > .a-name { grid-area: name } .imc-lrow > .a-step { grid-area: step } .imc-lrow > .a-line { grid-area: line } .imc-lrow > .a-cost { grid-area: cost } .imc-lrow > .a-load { grid-area: load }
}

/* ---- heatmap ---- */
.imc-heat { position: relative; margin: 0 18px; user-select: none }
.imc-heat canvas { display: block; width: 100%; outline-offset: 4px; cursor: crosshair }
.imc-tip { position: absolute; z-index: 4; pointer-events: none; padding: 3px 7px; border: 1px solid var(--imc-rule); border-radius: 2px; background: var(--imc-sheet); font: 500 10.5px/14px var(--imc-mono); letter-spacing: .04em; white-space: nowrap; color: var(--imc-ink); transform: translate(-50%, -100%); box-shadow: 0 1px 0 var(--imc-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
.imc-tip i { font-style: normal; color: var(--imc-t3) }
.imc-hstats { display: flex; flex-wrap: wrap; gap: 8px 12px; margin: 18px 18px 0 }
.imc-legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap }
.imc-legend canvas { width: 16px; height: 12px; display: block }

/* ---- log ---- */
.imc-chips { display: flex; gap: 6px; flex-wrap: wrap }
.imc-chip { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px; border: 1px solid var(--imc-rule); border-radius: 2px; font: 500 10.5px/14px var(--imc-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--imc-t2); transition: background-color .2s var(--imc-ease), color .2s var(--imc-ease), border-color .2s var(--imc-ease) }
.imc-chip:hover { border-color: var(--imc-t3) }
.imc-chip[aria-pressed="true"] { background: var(--imc-ink); border-color: var(--imc-ink); color: var(--imc-paper) }
.imc-chip em { font-style: normal; opacity: .6; font-variant-numeric: tabular-nums }
.imc-logbox { position: relative; flex: 1; min-height: 280px; margin: 0 0 6px; border-top: 1px solid var(--imc-rule-2) }
.imc-log { position: absolute; inset: 0; overflow: auto; padding: 4px 0; font: 400 11.5px/18px var(--imc-mono); font-variant-numeric: tabular-nums }
.imc-ll { position: relative; display: grid; grid-template-columns: 62px 88px 36px minmax(0, 1fr); gap: 0 10px; padding: 1px 18px; color: var(--imc-t1); animation: imc-ll-in .5s var(--imc-ease-trace) backwards }
.imc-ll.is-old { animation: none }
.imc-ll .t { color: var(--imc-t3) }
.imc-ll .a { color: var(--imc-ink); letter-spacing: .02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.imc-ll .g { color: var(--imc-t3); font-size: 10px; letter-spacing: .08em }
.imc-ll .g.k-err { color: var(--imc-bad) } .imc-ll .g.k-ok { color: var(--imc-ok) }
.imc-ll .m { color: var(--imc-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.imc-ll.k-err .m { color: var(--imc-bad) }
.imc-ll::after { content: ""; position: absolute; top: 1px; bottom: 1px; left: 0; width: 1px; background: var(--imc-accent); opacity: 0; pointer-events: none }
.imc-ll:not(.is-old)::after { animation: imc-ll-line .5s var(--imc-ease-trace) backwards }
@keyframes imc-ll-in { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes imc-ll-line { 0% { left: 0; opacity: 1 } 80% { opacity: 1 } 100% { left: 100%; opacity: 0 } }
.imc-empty { padding: 28px 18px; text-align: center; font: italic 400 16px/22px var(--imc-serif); color: var(--imc-t3) }
@container imc (max-width: 639px) {
  .imc-ll { grid-template-columns: 56px 1fr 34px; row-gap: 0 }
  .imc-ll .m { grid-column: 1 / -1; white-space: normal; padding-left: 0; margin-bottom: 3px }
  .imc-ll .a { grid-column: 2; grid-row: 1 } .imc-ll .g { grid-column: 3; grid-row: 1 }
  .imc-lrow .a-load { justify-content: flex-end }
}

@media (prefers-reduced-motion: reduce) {
  .imc *, .imc *::before, .imc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Data & helpers                              */
/* -------------------------------------------------------------------------- */

const AGENTS: { id: AgentId; name: string; role: string; model: string; dur: [number, number] }[] = [
  { id: "atlas", name: "Atlas", role: "Customer outreach", model: "Atlas-3", dur: [1.8, 4.6] },
  { id: "sage", name: "Sage", role: "Research and retrieval", model: "Sage-2", dur: [1.2, 3.8] },
  { id: "quill", name: "Quill", role: "Drafting", model: "Quill-2", dur: [1.6, 4.2] },
  { id: "nova", name: "Nova-intake", role: "Ticket triage", model: "Nova-1", dur: [0.5, 1.4] },
  { id: "ledger", name: "Ledger", role: "Invoice reconciliation", model: "Nova-1", dur: [2.5, 6] },
]
const NAME: Record<AgentId, string> = { atlas: "Atlas", sage: "Sage", quill: "Quill", nova: "Nova-intake", ledger: "Ledger" }

const STEPS: Record<AgentId, string[]> = {
  atlas: [
    "Sending batch 1 of 5 · 43 recipients",
    "Checking bounce rate on batch 1",
    "Sending batch 2 of 5 · 43 recipients",
    "Updating 86 CRM records with send status",
    "Sending batch 3 of 5 · 43 recipients",
    "Waiting 90 s between batches to stay under rate limit",
  ],
  sage: [
    "Searching 14 sources for “EU data residency changes”",
    "Reading filing 2026-Q3, page 14 of 62",
    "Reranking 38 passages against the question",
    "Drafting findings with citations [1–6]",
    "Cross-checking figure in source 4 against source 2",
  ],
  quill: [
    "Drafting release notes for v4.2, section 3 of 5",
    "Checking tone against the style guide",
    "Tightening the intro, 42 words shorter",
    "Writing the migration note for API consumers",
  ],
  nova: [
    "Classifying ticket HF-8841, billing question",
    "Matching 3 help articles to HF-8842",
    "Routing HF-8843 to Ledger",
    "Summarising thread of 11 messages for handoff",
    "Scoring urgency on 6 queued tickets",
  ],
  ledger: [
    "Reconciling 128 invoices, batch 1 of 4",
    "Matching bank lines to invoices, batch 2 of 4",
    "Flagging 3 duplicate payments for review",
    "Writing ledger entries, batch 4 of 4",
  ],
}

const TOOLS: Record<AgentId, ((r: (a: number, b: number) => number) => string)[]> = {
  atlas: [
    (r) => `crm.lookup · account HF-${r(2100, 2399)} · ${r(80, 260)} ms`,
    (r) => `email.send · batch ${r(1, 5)} of 5 · ${r(180, 420)} ms`,
    (r) => `segment.query · renewals ≤ 14 d · ${r(210, 540)} ms`,
  ],
  sage: [
    (r) => `web.search · “data residency 2026” · ${r(420, 980)} ms`,
    (r) => `doc.fetch · filing 2026-Q3 p.${r(2, 62)} · ${r(120, 380)} ms`,
    (r) => `kb.rerank · ${r(20, 60)} passages · ${r(300, 900)} ms`,
  ],
  quill: [
    (r) => `style.check · ${r(1, 6)} flags · ${r(90, 220)} ms`,
    (r) => `doc.write · section ${r(1, 5)} · ${r(60, 190)} ms`,
    (r) => `glossary.lookup · ${r(2, 9)} terms · ${r(30, 90)} ms`,
  ],
  nova: [
    (r) => `ticket.classify · HF-${r(8800, 8899)} · ${r(120, 320)} ms`,
    (r) => `kb.match · ${r(1, 4)} articles · ${r(60, 140)} ms`,
    (r) => `route.assign · HF-${r(8800, 8899)} · ${r(40, 110)} ms`,
  ],
  ledger: [
    (r) => `ledger.fetch · ${r(40, 128)} invoices · ${r(300, 900)} ms`,
    (r) => `invoice.match · ${r(30, 120)} pairs · ${r(180, 540)} ms`,
    (r) => `bank.reconcile · batch ${r(1, 4)} of 4 · ${r(900, 2400)} ms`,
  ],
}
const ERRS: Record<AgentId, string> = {
  atlas: "email.send 429 rate limited · retry in 8 s",
  sage: "web.fetch timeout after 12 s · source skipped",
  quill: "style.check schema mismatch · retrying",
  nova: "ticket.classify confidence 0.41 · escalated",
  ledger: "bank.reconcile timeout after 30 s",
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const pad = (n: number, w = 2) => String(n).padStart(w, "0")
const fmtTime = (s: number) => `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}`
const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1))
const money = (v: number) => `$${v.toFixed(2)}`

const T0 = 14 * 3600 + 2 * 60 + 11 // 14:02:11

function genSegs(id: AgentId, runs: number, fail: number, seed: number): Seg[] {
  const rng = mulberry32(seed)
  const a = AGENTS.find((x) => x.id === id)!
  const out: Seg[] = []
  for (let k = 0; k < runs; k++) {
    let t: number
    const u = rng()
    if (id === "atlas") t = u < 0.7 ? 540 + rng() * 150 : 360 + rng() * 480
    else if (id === "quill") t = u < 0.5 ? 600 + rng() * 180 : 360 + rng() * 480
    else if (id === "ledger") t = u < 0.5 ? 480 + rng() * 14 : 720 + rng() * 14
    else t = 360 + Math.pow(rng(), 0.9) * 480
    const d = a.dur[0] + rng() * (a.dur[1] - a.dur[0])
    out.push([t, Math.min(t + d, 841), true])
  }
  out.sort((x, y) => x[0] - y[0])
  for (let f = 0; f < fail; f++) {
    const i = Math.floor(rng() * (out.length - 1))
    out[i] = [out[i][0], out[i][1], false]
  }
  if (id === "ledger") out[out.length - 1] = [835, 841.5, false]
  return out
}

function initSim(): Sim {
  const mk = (id: AgentId, o: Partial<Lane>): Lane => ({ id, status: "live", step: 0, runs: 0, fail: 0, cost: 0, load: 0.5, runNo: 413, segs: [], ...o })
  const raw: [AgentId, Partial<Lane>][] = [
    ["atlas", { status: "waiting", runs: 74, fail: 2, cost: 11.4, load: 0.08, step: 1, runNo: 413 }],
    ["sage", { status: "live", runs: 118, fail: 3, cost: 9.85, load: 0.62, step: 1, runNo: 414 }],
    ["quill", { status: "live", runs: 63, fail: 1, cost: 12.3, load: 0.48, step: 0, runNo: 415 }],
    ["nova", { status: "live", runs: 141, fail: 2, cost: 3.1, load: 0.71, step: 2, runNo: 416 }],
    ["ledger", { status: "failed", runs: 16, fail: 4, cost: 1.55, load: 0, step: 2, runNo: 398 }],
  ]
  const lanes = raw.map(([id, o], i) => {
    const l = mk(id, o)
    l.segs = genSegs(id, l.runs, l.fail, 101 + i * 17)
    return l
  })
  const L = (t: string, agent: AgentId, kind: LineKind, msg: string, id: number): LogLine => {
    const [h, m, s] = t.split(":").map(Number)
    return { id, t: h * 3600 + m * 60 + s, agent, kind, msg, fresh: false }
  }
  const lines = [
    L("13:59:48", "sage", "tool", "web.search · “EU data residency 2026” · 640 ms", 1),
    L("13:59:52", "nova", "tool", "ticket.classify · HF-8838 → billing · 212 ms", 2),
    L("14:00:03", "quill", "llm", "draft.section · 1.8k tok · 2.4 s", 3),
    L("14:00:09", "atlas", "tool", "segment.query · renewals ≤ 14 d → 214 rows · 380 ms", 4),
    L("14:00:14", "atlas", "tool", "email.preview · template renewal-v3 · 96 ms", 5),
    L("14:00:20", "atlas", "sys", "policy: 214 recipients exceeds 100 · approval required", 6),
    L("14:00:41", "nova", "ok", "run 0409 done · 3.1 s · $0.008", 7),
    L("14:00:58", "sage", "llm", "rerank 38 passages · 4.2k tok · 1.1 s", 8),
    L("14:01:12", "ledger", "tool", "bank.reconcile · batch 3 of 4 · 128 invoices", 9),
    L("14:01:44", "ledger", "err", "bank.reconcile timeout after 30 s · run 0398 failed", 10),
    L("14:01:46", "ledger", "sys", "run 0398 halted · no data written", 11),
    L("14:01:55", "quill", "tool", "style.check · 3 flags · 140 ms", 12),
    L("14:02:02", "sage", "ok", "run 0411 done · 6.8 s · $0.041", 13),
    L("14:02:06", "nova", "tool", "kb.match · 3 articles · 88 ms", 14),
    L("14:02:11", "nova", "ok", "run 0412 done · 1.2 s · $0.006", 15),
  ]
  return { clock: T0, lanes, cap: 60, latency: 1.8, lines, lineId: 16, rate: 1.7 }
}

const totalRuns = (s: Sim) => s.lanes.reduce((a, l) => a + l.runs, 0)
const totalFail = (s: Sim) => s.lanes.reduce((a, l) => a + l.fail, 0)
const totalCost = (s: Sim) => s.lanes.reduce((a, l) => a + l.cost, 0)

function addLines(s: Sim, add: Omit<LogLine, "id" | "fresh">[]): Pick<Sim, "lines" | "lineId"> {
  let id = s.lineId
  const next = add.map((a) => ({ ...a, id: id++, fresh: true }))
  const keep = s.lines.slice(-79).map((l) => (l.fresh ? { ...l, fresh: false } : l))
  return { lines: [...keep, ...next], lineId: id }
}

function tickSim(s: Sim): Sim {
  const clock = s.clock + rnd(2, 5)
  const nowMin = clock / 60
  const emit: Omit<LogLine, "id" | "fresh">[] = []
  const lanes = s.lanes.map((l) => {
    if (l.status !== "live") {
      const target = l.status === "waiting" ? 0.08 : 0.02
      return { ...l, load: l.load + (target - l.load) * 0.25 }
    }
    const agent = AGENTS.find((a) => a.id === l.id)!
    let n: Lane = { ...l, load: clamp(l.load + (Math.random() - 0.5) * 0.14, 0.18, 0.94), cost: l.cost + Math.random() * 0.012 }
    if (Math.random() < 0.14) n.step = (l.step + 1) % STEPS[l.id].length
    if (Math.random() < 0.55) {
      const p = Math.random()
      const tools = TOOLS[l.id]
      if (p < 0.55) emit.push({ t: clock, agent: l.id, kind: "tool", msg: tools[rnd(0, tools.length - 1)](rnd) })
      else if (p < 0.72) emit.push({ t: clock, agent: l.id, kind: "llm", msg: `complete · ${(rnd(8, 42) / 10).toFixed(1)}k tok · ${(rnd(6, 38) / 10).toFixed(1)} s` })
      else if (p < 0.95) {
        const d = agent.dur[0] + Math.random() * (agent.dur[1] - agent.dur[0])
        const runNo = totalRuns(s) + emit.filter((e) => e.kind === "ok" || e.kind === "err").length + 1
        const c = 0.004 + Math.random() * 0.04
        emit.push({ t: clock, agent: l.id, kind: "ok", msg: `run ${pad(runNo, 4)} done · ${(d * 2.2).toFixed(1)} s · $${c.toFixed(3)}` })
        n = { ...n, runs: n.runs + 1, cost: n.cost + c, segs: [...n.segs.slice(-300), [nowMin - d, nowMin, true]], runNo: runNo + 4 }
      } else {
        const runNo = totalRuns(s) + 1
        emit.push({ t: clock, agent: l.id, kind: "err", msg: ERRS[l.id] })
        n = { ...n, runs: n.runs + 1, fail: n.fail + 1, segs: [...n.segs.slice(-300), [nowMin - 1.4, nowMin, false]], runNo: runNo + 4 }
      }
    }
    return n
  })
  return {
    ...s, clock, lanes,
    latency: clamp(s.latency + (Math.random() - 0.5) * 0.08, 1.62, 2.08),
    ...(emit.length ? addLines(s, emit) : {}),
  }
}

const POOL: Omit<Attn, "phase">[] = [
  {
    id: "p1", kind: "approval", agent: "sage", age: "just now",
    title: "Sage wants to publish 3 research briefs to the shared drive – approve?",
    body: "Briefs cite 14 external sources and will be visible to all 38 members of Harbor & Finch.",
    note: "Two citations are paywalled; I quoted only the abstracts. – Sage",
    actions: [{ id: "approve", label: "Approve", primary: true }, { id: "hold", label: "Hold" }],
  },
  {
    id: "p2", kind: "budget", agent: "nova", age: "just now",
    title: "Nova-intake has used 80% of its token quota",
    body: "1.6M of 2.0M tokens used. Ticket volume is 18% above the Wednesday average.",
    actions: [{ id: "raise", label: "Raise quota +$5", primary: true }, { id: "dismiss", label: "Dismiss" }],
  },
]

const INITIAL_ATTN: Attn[] = [
  {
    id: "a1", kind: "approval", agent: "atlas", age: "2 min ago", phase: "idle",
    title: "Atlas wants to email 214 customers – approve?",
    body: "Renewal-window notice for accounts renewing 3–17 Nov. Sends in 5 batches; estimated cost $2.10.",
    note: "214 is above the 100-recipient limit, so I stopped before batch 1. – Atlas",
    actions: [{ id: "approve", label: "Approve", primary: true }, { id: "hold", label: "Hold" }],
  },
  {
    id: "a2", kind: "budget", agent: "quill", age: "6 min ago", phase: "idle",
    title: "Quill has used 82% of its daily budget",
    body: "$12.30 of $15.00 spent. At this pace it reaches the cap near 16:40 and will start to throttle.",
    actions: [{ id: "raise", label: "Raise budget +$5", primary: true }, { id: "dismiss", label: "Dismiss" }],
  },
  {
    id: "a3", kind: "failed", agent: "ledger", age: "1 min ago", phase: "idle",
    title: "Ledger run 0398 failed",
    body: "reconcile-invoices timed out after 30 s on batch 3 of 4 (128 invoices). No data was written.",
    actions: [{ id: "retry", label: "Retry run", primary: true }, { id: "dismiss", label: "Dismiss" }],
  },
]

/* ---- dither ---- */
const BAYER8: number[][] = (() => {
  let m = [[0, 2], [3, 1]]
  let n = 2
  while (n < 8) {
    const next: number[][] = Array.from({ length: n * 2 }, () => Array<number>(n * 2).fill(0))
    for (let y = 0; y < n * 2; y++)
      for (let x = 0; x < n * 2; x++)
        next[y][x] = 4 * m[y % n][x % n] + [[0, 2], [3, 1]][Math.floor(y / n)][Math.floor(x / n)]
    m = next
    n *= 2
  }
  return m.map((r) => r.map((v) => (v + 0.5) / 64))
})()

function ditherRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, d: number, px: number) {
  if (d <= 0) return
  ctx.beginPath()
  for (let yy = 0, j = 0; yy < h; yy += px, j++)
    for (let xx = 0, i = 0; xx < w; xx += px, i++)
      if (d > BAYER8[j & 7][i & 7]) ctx.rect(x + xx, y + yy, Math.min(px, w - xx), Math.min(px, h - yy))
  ctx.fill()
}

type RGB = [number, number, number]
type Palette = { ink: RGB; signal: RGB; bad: RGB; sheet: RGB }
let normCtx: CanvasRenderingContext2D | null = null
function parseColor(c: string, fallback: RGB): RGB {
  normCtx ??= document.createElement("canvas").getContext("2d")
  if (!normCtx) return fallback
  normCtx.fillStyle = "#000"
  normCtx.fillStyle = c
  const v = normCtx.fillStyle
  if (v.startsWith("#") && v.length === 7) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]
  const m = /rgba?\(([^)]+)\)/.exec(v)
  if (m) {
    const p = m[1].split(",").map((s) => parseFloat(s))
    return [p[0], p[1], p[2]]
  }
  return fallback
}
function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el)
  const g = (n: string) => cs.getPropertyValue(n).trim()
  return {
    ink: parseColor(g("--imc-ink"), [20, 20, 19]),
    signal: parseColor(g("--imc-signal"), [255, 77, 0]),
    bad: parseColor(g("--imc-bad"), [196, 50, 26]),
    sheet: parseColor(g("--imc-sheet"), [251, 250, 246]),
  }
}
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

/* ---- hooks ---- */
const ThemeCtx = React.createContext(0)

function useMedia(q: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(q)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(q).matches,
    () => false,
  )
}

function useLive(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setIn] = React.useState(true)
  const [vis, setVis] = React.useState(() => typeof document === "undefined" || !document.hidden)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setIn(e.isIntersecting))
    io.observe(el)
    const onv = () => setVis(!document.hidden)
    document.addEventListener("visibilitychange", onv)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onv)
    }
  }, [ref])
  return inView && vis
}

function useThemeKey(ref: React.RefObject<HTMLElement | null>) {
  const [key, setKey] = React.useState(0)
  React.useEffect(() => {
    const root = ref.current
    if (!root) return
    let last = getComputedStyle(root).getPropertyValue("--imc-ink")
    const check = () => {
      const v = getComputedStyle(root).getPropertyValue("--imc-ink")
      if (v !== last) {
        last = v
        setKey((k) => k + 1)
      }
    }
    const mo = new MutationObserver(check)
    for (let n: HTMLElement | null = root; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => mo.disconnect()
  }, [ref])
  return key
}

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: React.DependencyList) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const drawRef = React.useRef(draw)
  const [size, setSize] = React.useState<[number, number]>([0, 0])
  React.useEffect(() => {
    drawRef.current = draw
  })
  React.useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ro = new ResizeObserver(() => setSize([cv.clientWidth, cv.clientHeight]))
    ro.observe(cv)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => {
    const cv = ref.current
    if (!cv || !size[0]) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.round(size[0] * dpr)
    cv.height = Math.round(size[1] * dpr)
    const ctx = cv.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawRef.current(ctx, size[0], size[1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, ...deps])
  return ref
}

/* -------------------------------------------------------------------------- */
/*                                 Small parts                                */
/* -------------------------------------------------------------------------- */

function Crop() {
  return (
    <span className="imc-crop" aria-hidden>
      <i /><i /><i /><i />
    </span>
  )
}

function Panel({ d = 0, className = "", children, label }: { d?: number; className?: string; children: React.ReactNode; label: string }) {
  return (
    <section className={`imc-panel ${className}`} style={{ "--d": `${d}ms` } as React.CSSProperties} aria-label={label}>
      <Crop />
      <span className="imc-scanline" aria-hidden />
      {children}
    </section>
  )
}

function Head({ lab, title, line, right }: { lab: string; title: string; line: string; right?: React.ReactNode }) {
  return (
    <header className="imc-head">
      <div>
        <span className="imc-lab">{lab}</span>
        <h2>{title}</h2>
        <p>{line}</p>
      </div>
      {right ? <div className="imc-head-r">{right}</div> : null}
    </header>
  )
}

/** A number that counts to its value, overshoots by about 1% and settles. Text is written imperatively. */
function Num({ value, decimals = 0, prefix = "", reduced }: { value: number; decimals?: number; prefix?: string; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(value)
  const started = React.useRef(false)
  const fmt = React.useCallback(
    (v: number) => prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [decimals, prefix],
  )
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt(shown.current)
  }, [fmt])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const to = value
    if (reduced) {
      shown.current = to
      el.textContent = fmt(to)
      return
    }
    const from = started.current ? shown.current : 0
    started.current = true
    if (from === to) return
    let raf = 0
    let t0 = 0
    const dur = 760
    const frame = (now: number) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / dur)
      const f = t < 0.78 ? (1 - Math.pow(1 - t / 0.78, 3)) * 1.012 : 1.012 - 0.012 * ((t - 0.78) / 0.22)
      const v = from + (to - from) * f
      shown.current = t >= 1 ? to : v
      el.textContent = fmt(shown.current)
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced, fmt])
  return <span ref={ref} />
}

function Typed({ text, live, reduced }: { text: string; live: boolean; reduced: boolean }) {
  const [n, setN] = React.useState(0)
  const done = n >= text.length
  React.useEffect(() => {
    if (!live || reduced || done) return
    const id = setInterval(() => setN((v) => v + 1), 34)
    return () => clearInterval(id)
  }, [live, reduced, done])
  const shown = reduced || !live ? text.length : n
  return (
    <>
      {text.slice(0, shown)}
      {live && !reduced ? <span className="imc-caret" aria-hidden /> : null}
    </>
  )
}

function DitherCell({ value, w = 44, h = 16, px = 2, signal = false }: { value: number; w?: number; h?: number; px?: number; signal?: boolean }) {
  const theme = React.useContext(ThemeCtx)
  const ref = useCanvas(
    (ctx, cw, ch) => {
      const pal = readPalette(ctx.canvas)
      ctx.clearRect(0, 0, cw, ch)
      ctx.fillStyle = rgba(signal ? pal.signal : pal.ink, 0.85)
      ditherRect(ctx, 1, 1, cw - 2, ch - 2, value, px)
      ctx.strokeStyle = rgba(pal.ink, 0.18)
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1)
    },
    [value, theme, px, signal],
  )
  return <canvas ref={ref} style={{ width: w, height: h }} aria-hidden />
}

/* -------------------------------------------------------------------------- */
/*                                   Scope                                    */
/* -------------------------------------------------------------------------- */

const SN = 90
const SAMPLE_S = 10
type Incident = { abs: number; code: string; label: string }
type Series = { vals: number[]; base: number; incidents: Incident[]; nextInc: number }

function rateAt(i: number) {
  const h = mulberry32(i * 7919 + 13)()
  const bump = Math.exp(-((i - 42) ** 2) / 5) * 1.1 - Math.exp(-((i - 76) ** 2) / 4) * 0.95
  const live = i > SN ? (i % 53 === 0 ? -0.9 : 0) : 0
  return clamp(1.45 + 0.65 * Math.sin(i / 8.5) + 0.32 * Math.sin(i / 2.9 + 1.3) + (h - 0.5) * 0.3 + bump + live, 0.2, 2.9)
}
function makeSeries(): Series {
  const vals = Array.from({ length: SN + 1 }, (_, j) => rateAt(j))
  return {
    vals, base: 0, nextInc: 33,
    incidents: [
      { abs: 42, code: "INC-31", label: "429 burst" },
      { abs: 76, code: "INC-32", label: "timeout" },
    ],
  }
}
const INC_LABELS = ["tool timeout", "429 burst", "queue stall"]
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

function Scope({ run, reduced, frozen }: { run: boolean; reduced: boolean; frozen: boolean }) {
  const theme = React.useContext(ThemeCtx)
  const [ser] = React.useState(makeSeries)
  const cvRef = React.useRef<HTMLCanvasElement>(null)
  const sizeRef = React.useRef({ w: 0, h: 0 })
  const hover = React.useRef<number | null>(null)
  const frac = React.useRef(0)
  const reveal = React.useRef(1)
  const palRef = React.useRef<{ p: Palette; t: number } | null>(null)
  const [stats, setStats] = React.useState(() => ({ now: ser.vals[SN], peak: Math.max(...ser.vals), avg: ser.vals.reduce((a, b) => a + b, 0) / ser.vals.length }))

  const draw = React.useCallback(() => {
    const cv = cvRef.current
    const { w: W, h: H } = sizeRef.current
    if (!cv || !W) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const t = performance.now()
    if (!palRef.current || t - palRef.current.t > 400) palRef.current = { p: readPalette(cv), t }
    const pal = palRef.current.p
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const L = 30, R = 10, T = 26, B = 22
    const pw = W - L - R
    const ph = H - T - B
    const dx = pw / (SN - 1)
    const off = frac.current * dx
    const Y = (v: number) => T + (1 - v / 3) * ph
    const X = (j: number) => L + (j - 1) * dx + off
    const mono = (s: number) => `500 ${s}px "Geist Mono", ui-monospace, monospace`

    // graticule
    ctx.lineWidth = 1
    for (let lv = 0; lv <= 3; lv++) {
      const y = Math.round(Y(lv)) + 0.5
      ctx.strokeStyle = rgba(pal.ink, lv === 0 ? 0.28 : 0.1)
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke()
      ctx.fillStyle = rgba(pal.ink, 0.5); ctx.font = mono(10); ctx.textAlign = "right"; ctx.textBaseline = "middle"
      ctx.fillText(String(lv), L - 8, y)
    }
    ctx.fillStyle = rgba(pal.ink, 0.4); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"
    ctx.fillText("RUNS/MIN", 4, 11)
    const labels = ["−15m", "−12m", "−9m", "−6m", "−3m", "NOW"]
    for (let k = 0; k <= 15; k++) {
      const x = Math.round(L + (k * pw) / 15) + 0.5
      const major = k % 3 === 0
      ctx.strokeStyle = rgba(pal.ink, major ? 0.13 : 0.055)
      ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph + (major ? 5 : 3)); ctx.stroke()
      if (major) {
        const lab = labels[k / 3]
        ctx.fillStyle = lab === "NOW" ? rgba(pal.signal, 1) : rgba(pal.ink, 0.5)
        ctx.font = mono(10); ctx.textAlign = k === 0 ? "left" : k === 15 ? "right" : "center"; ctx.textBaseline = "alphabetic"
        ctx.fillText(lab, k === 15 ? x + 4 : x, H - 5)
      }
    }

    // trace
    const vals = ser.vals
    const val = (x: number) => {
      const f = (x - L - off) / dx + 1
      const j = clamp(Math.floor(f), 0, SN - 1)
      const a = vals[j], b = vals[j + 1]
      return a + (b - a) * clamp(f - j, 0, 1)
    }
    ctx.save()
    ctx.beginPath(); ctx.rect(L, 0, pw * reveal.current + 1, H); ctx.clip()
    ctx.beginPath()
    for (let x = L + 1; x <= W - R; x += 4) {
      const v = val(x)
      ctx.moveTo(x + 0.5, T + ph); ctx.lineTo(x + 0.5, Y(v))
    }
    ctx.strokeStyle = rgba(pal.ink, 0.1); ctx.lineWidth = 1; ctx.stroke()
    ctx.beginPath()
    ctx.rect(L, T - 3, pw + 1, ph + 6); ctx.clip()
    ctx.beginPath()
    for (let j = 0; j <= SN; j++) {
      if (j) ctx.lineTo(X(j), Y(vals[j]))
      else ctx.moveTo(X(j), Y(vals[j]))
    }
    ctx.lineJoin = "round"; ctx.lineWidth = 1.4; ctx.strokeStyle = rgba(pal.ink, 0.92); ctx.stroke()
    ctx.restore()
    ctx.save()
    ctx.beginPath(); ctx.rect(L, 0, pw * reveal.current + 1, H); ctx.clip()
    // incidents
    let labelEnd = -Infinity
    for (const inc of ser.incidents) {
      const j = inc.abs - ser.base
      if (j < 0 || j > SN) continue
      const x = Math.round(X(j)) + 0.5
      if (x < L || x > W - R) continue
      ctx.setLineDash([2, 3]); ctx.strokeStyle = rgba(pal.ink, 0.45); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, T - 2); ctx.lineTo(x, Y(vals[j])); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = rgba(pal.ink, 0.9)
      ctx.beginPath(); ctx.moveTo(x - 4, T - 9); ctx.lineTo(x + 4, T - 9); ctx.lineTo(x, T - 3); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.arc(x, Y(vals[j]), 2.5, 0, 7); ctx.fillStyle = rgba(pal.sheet, 1); ctx.fill()
      ctx.strokeStyle = rgba(pal.ink, 0.9); ctx.stroke()
      ctx.font = mono(10); ctx.fillStyle = rgba(pal.ink, 0.75); ctx.textBaseline = "alphabetic"
      const txt = `${inc.code} ${inc.label}`
      const tw = ctx.measureText(txt).width
      const right = x + 8 + tw > W - R
      const x0 = right ? x - 8 - tw : x + 8
      if (x0 > labelEnd + 6 && x0 >= L) {
        ctx.textAlign = "left"; ctx.fillText(txt, x0, T - 9)
        labelEnd = x0 + tw
      }
    }
    ctx.restore()

    // now tick
    const hx = Math.round(W - R) + 0.5
    ctx.strokeStyle = rgba(pal.signal, 1); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(hx, T - 8); ctx.lineTo(hx, T + ph); ctx.stroke()
    ctx.fillStyle = rgba(pal.signal, 1); ctx.fillRect(hx - 2.5, T - 10, 5, 3)
    if (reveal.current >= 1) {
      ctx.beginPath(); ctx.arc(Math.min(X(SN), W - R), Y(vals[SN]), 3, 0, 7); ctx.fill()
    }

    // hover crosshair
    const hv = hover.current
    if (hv !== null) {
      const j = clamp(Math.round((hv - L - off) / dx + 1), 0, SN)
      const x = Math.round(X(j)) + 0.5
      if (x >= L && x <= W - R) {
        ctx.strokeStyle = rgba(pal.ink, 0.4); ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph); ctx.stroke()
        ctx.beginPath(); ctx.arc(x, Y(vals[j]), 3, 0, 7); ctx.fillStyle = rgba(pal.sheet, 1); ctx.fill(); ctx.strokeStyle = rgba(pal.ink, 1); ctx.stroke()
        const age = (SN - j) * SAMPLE_S
        const txt = `${age ? "−" : ""}${Math.floor(age / 60)}:${pad(age % 60)}  ${vals[j].toFixed(1)}/min`
        ctx.font = mono(10.5); const tw = ctx.measureText(txt).width + 12
        const bx = clamp(x - tw / 2, L, W - R - tw), by = T + 4
        ctx.fillStyle = rgba(pal.sheet, 1); ctx.fillRect(bx, by, tw, 18)
        ctx.strokeStyle = rgba(pal.ink, 0.2); ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, 17)
        ctx.fillStyle = rgba(pal.ink, 1); ctx.textAlign = "left"; ctx.textBaseline = "middle"
        ctx.fillText(txt, bx + 6, by + 9.5)
      }
    }
  }, [ser])

  // size + theme
  React.useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = cv.clientWidth, h = cv.clientHeight
      sizeRef.current = { w, h }
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      draw()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    fit()
    void document.fonts?.ready.then(() => draw())
    return () => ro.disconnect()
  }, [draw])
  React.useEffect(() => {
    palRef.current = null
    draw()
  }, [theme, draw])

  // trace-in on mount
  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    let t0 = 0
    const f = (now: number) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / 950)
      reveal.current = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      if (t >= 1) reveal.current = 1
      draw()
      if (t < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => { cancelAnimationFrame(raf); reveal.current = 1; draw() }
  }, [reduced, draw])

  // live pushes
  React.useEffect(() => {
    if (!run) return
    let raf = 0
    let settle = 0
    const animate = () => {
      cancelAnimationFrame(raf); clearTimeout(settle)
      const t0 = performance.now()
      const step = (now: number) => {
        const t = clamp((now - t0) / 700, 0, 1)
        frac.current = 1 - easeOutQuart(t)
        draw()
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      settle = window.setTimeout(() => { frac.current = 0; draw() }, 780)
    }
    const id = setInterval(() => {
      const newest = ser.base + SN + 1
      ser.vals.shift(); ser.vals.push(rateAt(newest)); ser.base++
      if (newest === ser.nextInc * 3 + 7 || (newest > SN && newest % 53 === 0)) {
        const k = ser.incidents.length
        ser.incidents.push({ abs: newest, code: `INC-${31 + k}`, label: INC_LABELS[k % INC_LABELS.length] })
      }
      ser.incidents = ser.incidents.filter((i) => i.abs >= ser.base - 1)
      frac.current = 1
      setStats({ now: ser.vals[SN], peak: Math.max(...ser.vals), avg: ser.vals.reduce((a, b) => a + b, 0) / ser.vals.length })
      animate()
    }, 2000)
    return () => { clearInterval(id); cancelAnimationFrame(raf); clearTimeout(settle); frac.current = 0 }
  }, [run, ser, draw])

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    hover.current = e.clientX - e.currentTarget.getBoundingClientRect().left
    draw()
  }
  const onLeave = () => { hover.current = null; draw() }

  return (
    <Panel d={80} className="imc-c8" label="Throughput">
      <Head
        lab="01 · Throughput"
        title="Runs per minute"
        line="A 15-minute window across all five agents, one sample every ten seconds."
        right={
          <>
            <span className="imc-livechip">
              <span className={`imc-pulse${run ? "" : " is-off"}`} aria-hidden />
              {frozen ? "Frozen" : "Live"}
            </span>
            <span className="imc-kv">NOW <b>{stats.now.toFixed(1)}</b></span>
            <span className="imc-kv">AVG <b>{stats.avg.toFixed(1)}</b></span>
            <span className="imc-kv">PEAK <b>{stats.peak.toFixed(1)}</b></span>
          </>
        }
      />
      <div className="imc-stage">
        <div className="imc-dotgrid" aria-hidden />
        <canvas ref={cvRef} onPointerMove={onMove} onPointerLeave={onLeave} role="img" aria-label={`Line trace of runs per minute over the last 15 minutes. Now ${stats.now.toFixed(1)}, peak ${stats.peak.toFixed(1)}. Two incident markers.`} />
      </div>
      <p className="imc-fig"><b>FIG. 1</b> — Runs per minute, last 15 min · ▼ incident · <span style={{ color: "var(--imc-accent)" }}>▮</span> now</p>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Heatmap                                   */
/* -------------------------------------------------------------------------- */

const DAYS = ["FRI 16", "SAT 17", "SUN 18", "MON 19", "TUE 20", "WED 21", "THU 22"]
const HW = [0.08, 0.06, 0.2, 0.06, 0.05, 0.1, 0.25, 0.5, 0.9, 1.4, 1.8, 1.9, 1.3, 1.5, 1.9, 2.0, 1.7, 1.0, 0.5, 0.3, 0.25, 0.2, 0.12, 0.1]
const HOUR_NOW = 14

function buildHeat(today: number): number[][] {
  const rows: number[][] = []
  const dayF = [1.1, 0.34, 0.28, 1.2, 1.15, 1.25]
  dayF.forEach((f, di) => {
    const rng = mulberry32(900 + di)
    rows.push(HW.map((w) => Math.round(w * 37.7 * f * (0.82 + rng() * 0.36))))
  })
  // today: completed hours sum to (today - current-hour runs)
  const cur = 31 + (today - 412)
  const target = 381
  const rng = mulberry32(77)
  const raw = HW.slice(0, HOUR_NOW).map((w) => w * (0.85 + rng() * 0.3))
  const sum = raw.reduce((a, b) => a + b, 0)
  const row = raw.map((v) => Math.round((v / sum) * target))
  row[HOUR_NOW - 1] += target - row.reduce((a, b) => a + b, 0)
  row.push(cur)
  while (row.length < 24) row.push(-1)
  rows.push(row)
  return rows
}

function Heatmap({ today }: { today: number }) {
  const theme = React.useContext(ThemeCtx)
  const data = React.useMemo(() => buildHeat(today), [today])
  const max = React.useMemo(() => Math.max(...data.flat()), [data])
  const [cell, setCell] = React.useState<[number, number] | null>(null)
  const geo = (w: number) => {
    const lw = 46, top = 18, gap = 2, ch = 24
    const cw = (w - lw) / 24
    return { lw, top, gap, ch, cw }
  }
  const ref = useCanvas(
    (ctx, w, h) => {
      const pal = readPalette(ctx.canvas)
      const { lw, top, gap, ch, cw } = geo(w)
      ctx.clearRect(0, 0, w, h)
      const mono = `500 10px "Geist Mono", ui-monospace, monospace`
      ctx.font = mono; ctx.textBaseline = "middle"
      // ruler
      ctx.textAlign = "left"
      for (let hr = 0; hr <= 24; hr += 6) {
        const x = lw + hr * cw
        ctx.fillStyle = rgba(pal.ink, 0.5)
        ctx.textAlign = hr === 24 ? "right" : "left"
        ctx.fillText(pad(hr), x, 6)
        ctx.fillStyle = rgba(pal.ink, 0.25); ctx.fillRect(Math.round(x), 12, 1, 5)
      }
      for (let hr = 0; hr < 24; hr++) { ctx.fillStyle = rgba(pal.ink, 0.15); ctx.fillRect(Math.round(lw + hr * cw + cw / 2), 14, 1, 3) }
      // now tick
      ctx.fillStyle = rgba(pal.signal, 1); ctx.fillRect(Math.round(lw + HOUR_NOW * cw + cw / 2) - 1, 11, 2, 7)
      data.forEach((row, d) => {
        const y = top + d * ch
        ctx.fillStyle = d === 6 ? rgba(pal.ink, 0.95) : rgba(pal.ink, 0.5)
        ctx.textAlign = "left"; ctx.font = mono
        ctx.fillText(DAYS[d], 0, y + ch / 2 - 1)
        row.forEach((v, hr) => {
          const x = lw + hr * cw + gap / 2
          const bw = cw - gap, bh = ch - gap
          const isHover = cell && cell[0] === d && cell[1] === hr
          if (v < 0) {
            ctx.strokeStyle = rgba(pal.ink, 0.1); ctx.lineWidth = 1
            ctx.strokeRect(Math.round(x) + 0.5, y + gap / 2 + 0.5, bw - 1, bh - 1)
            return
          }
          const dens = Math.pow(v / max, 0.85)
          const live = d === 6 && hr === HOUR_NOW
          ctx.fillStyle = rgba(isHover || live ? pal.signal : pal.ink, isHover || live ? 1 : 0.8)
          ditherRect(ctx, x, y + gap / 2, bw, bh, Math.max(dens, v > 0 ? 0.04 : 0), 2)
          ctx.strokeStyle = rgba(pal.ink, isHover ? 0.9 : 0.07); ctx.lineWidth = 1
          ctx.strokeRect(Math.round(x) + 0.5, y + gap / 2 + 0.5, bw - 1, bh - 1)
        })
      })
    },
    [data, max, cell, theme],
  )
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ro = new ResizeObserver(() => setW(cv.clientWidth))
    ro.observe(cv)
    return () => ro.disconnect()
  }, [ref])
  const g = geo(w || 400)
  const H = g.top + 7 * g.ch + 2

  const locate = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left - g.lw, y = e.clientY - r.top - g.top
    const hr = Math.floor(x / g.cw), d = Math.floor(y / g.ch)
    if (hr < 0 || hr > 23 || d < 0 || d > 6) return setCell(null)
    setCell([d, hr])
  }
  const onKey = (e: React.KeyboardEvent) => {
    const c = cell ?? [6, HOUR_NOW]
    const m: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }
    const dlt = m[e.key]
    if (!dlt) return
    e.preventDefault()
    setCell([clamp(c[0] + dlt[0], 0, 6), clamp(c[1] + dlt[1], 0, 23)])
  }
  const v = cell ? data[cell[0]][cell[1]] : null
  const tipLeft = cell ? clamp(g.lw + cell[1] * g.cw + g.cw / 2, 70, Math.max(70, w - 70)) : 0
  const tipTop = cell ? g.top + cell[0] * g.ch - 2 : 0
  const best = data.reduce<[number, number]>((b, r, d) => r.reduce((bb, v, hr) => (v > data[bb[0]][bb[1]] ? [d, hr] : bb), b), [0, 0])
  const total = data.reduce((a, r) => a + r.filter((x) => x > 0).reduce((s, x) => s + x, 0), 0)

  return (
    <Panel d={240} className="imc-c5" label="Runs by hour">
      <Head lab="04 · Density" title="Runs by hour" line="Seven days, one cell per hour. Denser dots mean more runs; the signal cell is the hour in progress." />
      <div className="imc-heat">
        <canvas
          ref={ref}
          style={{ height: H }}
          tabIndex={0}
          role="img"
          aria-label={`Heatmap of runs per hour for the last 7 days. ${total.toLocaleString("en-US")} runs in total, busiest hour has ${max}. Use arrow keys to inspect cells.`}
          onPointerMove={locate}
          onPointerLeave={() => setCell(null)}
          onKeyDown={onKey}
          onBlur={() => setCell(null)}
        />
        {cell && v !== null ? (
          <div className="imc-tip" style={{ left: tipLeft, top: tipTop }}>
            {DAYS[cell[0]]} <i>·</i> {pad(cell[1])}:00 <i>·</i> {v < 0 ? "not yet" : `${v} runs`}
          </div>
        ) : null}
      </div>
      <div className="imc-hstats">
        <span className="imc-kv" style={{ borderLeft: 0, paddingLeft: 0 }}>BUSIEST <b>{DAYS[best[0]].slice(0, 3)} {pad(best[1])}:00 · {max}</b></span>
        <span className="imc-kv">TODAY <b>{today}</b></span>
        <span className="imc-kv">7 DAYS <b>{total.toLocaleString("en-US")}</b></span>
      </div>
      <div className="imc-fig" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", paddingTop: 12, marginTop: "auto" }}>
        <span><b>FIG. 3</b> — Runs per hour · max {max}</span>
        <span className="imc-legend" aria-hidden>
          FEW {[0.1, 0.3, 0.5, 0.7, 0.95].map((d) => <DitherCell key={d} value={d} w={16} h={12} />)} MANY
        </span>
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Lanes                                    */
/* -------------------------------------------------------------------------- */

const TL_FROM = 360
const TL_SPAN = 720

const Timeline = React.memo(function Timeline({ segs, now, id }: { segs: Seg[]; now: number; id: string }) {
  const nowX = clamp(now - TL_FROM, 0, TL_SPAN)
  return (
    <svg className="imc-tl" viewBox={`0 0 ${TL_SPAN} 24`} preserveAspectRatio="none" aria-hidden data-id={id}>
      {[0, 180, 360, 540, 720].map((x) => (
        <line key={x} x1={x} x2={x} y1="2" y2="22" stroke="var(--imc-ink)" strokeOpacity=".08" vectorEffect="non-scaling-stroke" />
      ))}
      <line x1="0" x2={nowX} y1="22.5" y2="22.5" stroke="var(--imc-ink)" strokeOpacity=".22" vectorEffect="non-scaling-stroke" />
      <line x1={nowX} x2={TL_SPAN} y1="22.5" y2="22.5" stroke="var(--imc-ink)" strokeOpacity=".22" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
      {segs.map((s, i) => {
        if (s[1] < TL_FROM) return null
        const x = s[0] - TL_FROM
        const w = Math.max(s[1] - s[0], s[2] ? 1.3 : 2.6)
        return s[2] ? (
          <rect key={i} x={x} y="5" width={w} height="14" fill="var(--imc-ink)" fillOpacity=".7" />
        ) : (
          <rect key={i} x={x} y="1" width={w} height="21" fill="var(--imc-bad)" />
        )
      })}
      <line x1={nowX} x2={nowX} y1="0" y2="24" stroke="var(--imc-ink)" strokeOpacity=".7" vectorEffect="non-scaling-stroke" />
    </svg>
  )
})

const STATUS_WORD: Record<LaneStatus, string> = { live: "Live", waiting: "Waiting", failed: "Failed", idle: "Idle", held: "Held" }

function Lanes({ sim, run, reduced, sel, onSel }: { sim: Sim; run: boolean; reduced: boolean; sel: AgentId | null; onSel: (id: AgentId) => void }) {
  const nowMin = Math.round(sim.clock / 60)
  return (
    <Panel d={160} className="imc-c12 imc-lanes" label="Agent lanes">
      <Head lab="03 · Lanes" title="Five agents, today" line="Current step, every run as a segment, spend and load. Select an agent to filter the run log." />
      <div className="imc-lrow is-head" aria-hidden>
        <span className="imc-lab">Agent</span>
        <span className="imc-lab">Current step</span>
        <div className="imc-hrs">
          {["06", "09", "12", "15", "18"].map((h, i) => (
            <span key={h} style={{ left: `${i * 25}%` }}>{h}</span>
          ))}
        </div>
        <span className="imc-lab imc-lh-r">Cost</span>
        <span className="imc-lab imc-lh-r">Load</span>
      </div>
      <ul>
        {sim.lanes.map((l, i) => {
          const a = AGENTS[i]
          const steps = STEPS[l.id]
          let step: React.ReactNode
          let key: string
          let bad = false
          if (l.status === "live") {
            key = `RUN ${pad(l.runNo, 4)} · STEP ${l.step + 1}/${steps.length}`
            step = <Typed key={`${l.id}-${l.step}`} text={steps[l.step]} live={run} reduced={reduced} />
          } else if (l.status === "waiting") {
            key = `RUN ${pad(l.runNo, 4)} · PAUSED AT STEP ${l.step + 1}/${steps.length}`
            step = "Waiting for approval to email 214 customers"
          } else if (l.status === "failed") {
            key = `RUN ${pad(l.runNo, 4)} · STOPPED AT STEP 3/4`
            step = "reconcile-invoices timed out after 30 s"
            bad = true
          } else if (l.status === "held") {
            key = `RUN ${pad(l.runNo, 4)} · HELD`
            step = "Held by Ada Okafor · batch not sent"
          } else {
            key = "NEXT RUN 15:00"
            step = "Idle · waiting for the next schedule"
          }
          return (
            <li key={l.id} className={`imc-lrow${sel === l.id ? " is-sel" : ""}`}>
              <div className="a-name">
                <button type="button" className="imc-lname" aria-pressed={sel === l.id} aria-label={`${a.name}, ${STATUS_WORD[l.status]}. Filter run log to ${a.name}`} onClick={() => onSel(l.id)}>
                  <span className={`imc-dot s-${l.status}`} aria-hidden />
                  <span className="tx">
                    <span className="n">
                      <b>{a.name}</b>
                      <span className={`imc-lstat s-${l.status}`}>{STATUS_WORD[l.status]}</span>
                    </span>
                    <span className="r">{a.role}</span>
                  </span>
                </button>
              </div>
              <div className="imc-lstep a-step" aria-live="off">
                <div className="k">{key}</div>
                <div className={`v${bad ? " bad" : ""}`}>{step}</div>
              </div>
              <div className="imc-tlwrap a-line" style={{ "--d": `${420 + i * 90}ms` } as React.CSSProperties}>
                <Timeline segs={l.segs} now={nowMin} id={l.id} />
              </div>
              <div className="imc-lcost a-cost">
                {money(l.cost)}
                <small>{l.runs} runs</small>
              </div>
              <div className="imc-lload a-load">
                <DitherCell value={l.load} w={44} h={16} />
                <span>{Math.round(l.load * 100)}%</span>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="imc-fig"><b>FIG. 2</b> — Runs today, 06:00–18:00 · red segments are failed runs · dither density is current load</p>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Run log                                   */
/* -------------------------------------------------------------------------- */

type Filter = "all" | "err" | "tool"
const TAG: Record<LineKind, string> = { tool: "TOOL", llm: "LLM", ok: "OK", err: "ERR", sys: "SYS" }

function RunLog({ lines, sel, onClearSel }: { lines: LogLine[]; sel: AgentId | null; onClearSel: () => void }) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const boxRef = React.useRef<HTMLDivElement>(null)
  const pinned = React.useRef(true)
  const scoped = sel ? lines.filter((l) => l.agent === sel) : lines
  const shown = scoped.filter((l) => (filter === "all" ? true : filter === "err" ? l.kind === "err" : l.kind === "tool"))
  const counts = { all: scoped.length, err: scoped.filter((l) => l.kind === "err").length, tool: scoped.filter((l) => l.kind === "tool").length }
  React.useLayoutEffect(() => {
    const el = boxRef.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [shown.length, filter, sel])
  const chips: [Filter, string][] = [["all", "All"], ["err", "Errors"], ["tool", "Tools"]]
  return (
    <Panel d={320} className="imc-c7" label="Run log">
      <Head
        lab="05 · Run log"
        title="Live stream"
        line={sel ? `Showing ${NAME[sel]} only.` : "Every tool call, model call and run result, newest at the bottom."}
        right={
          <div className="imc-chips" role="group" aria-label="Filter run log">
            {sel ? (
              <button type="button" className="imc-chip" onClick={onClearSel} aria-label={`Clear agent filter ${NAME[sel]}`}>
                {NAME[sel]} <X size={11} strokeWidth={1.5} aria-hidden />
              </button>
            ) : null}
            {chips.map(([id, lab]) => (
              <button key={id} type="button" className="imc-chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {lab} <em>{counts[id]}</em>
              </button>
            ))}
          </div>
        }
      />
      <div className="imc-logbox">
        <div
          ref={boxRef}
          className="imc-log"
          role="log"
          aria-label="Run log"
          aria-live="off"
          tabIndex={0}
          onScroll={(e) => {
            const el = e.currentTarget
            pinned.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
          }}
        >
          {shown.length === 0 ? <p className="imc-empty">No lines match this filter yet.</p> : null}
          {shown.map((l) => (
            <div key={l.id} className={`imc-ll k-${l.kind}${l.fresh ? "" : " is-old"}`}>
              <span className="t">{fmtTime(l.t)}</span>
              <span className="a">{NAME[l.agent].toUpperCase()}</span>
              <span className={`g k-${l.kind}`}>{TAG[l.kind]}</span>
              <span className="m" title={l.msg}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="imc-fig"><b>FIG. 4</b> — Last {Math.min(lines.length, 80)} events · showing {shown.length}</p>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Attention queue                              */
/* -------------------------------------------------------------------------- */

function AttentionQueue({ items, onAct }: { items: Attn[]; onAct: (item: Attn, action: string) => void }) {
  const open = items.filter((i) => i.phase === "idle").length
  return (
    <Panel d={160} className="imc-c4" label="Attention queue">
      <Head
        lab="02 · Attention"
        title="Needs a human"
        line={open ? `${open} ${open === 1 ? "item is" : "items are"} holding agents back.` : "Nothing is holding agents back."}
      />
      <div className="imc-q" aria-live="polite">
        {items.map((it) => (
          <div key={it.id} className={`imc-qw${it.phase === "gone" ? " is-gone" : ""}`}>
            <div className="imc-qwi">
              <div className="imc-qpad">
                <article className={`imc-qi${it.phase === "out" || it.phase === "gone" ? " is-out" : ""}`} aria-label={it.title}>
                  <div className="imc-qk">
                    <span className="imc-lab" style={{ color: "var(--imc-t2)" }}>{it.kind === "approval" ? "Approval" : it.kind === "budget" ? "Budget" : "Failed run"} · {NAME[it.agent]}</span>
                    <span className="imc-lab">{it.age}</span>
                  </div>
                  <p className="imc-qt">{it.title}</p>
                  <p className="imc-qb">{it.body}</p>
                  {it.note ? <p className="imc-note">{it.note}</p> : null}
                  <div className="imc-qa">
                    {it.actions.map((a) => (
                      <button key={a.id} type="button" className={`imc-qbtn${a.primary ? " is-primary" : ""}`} disabled={it.phase !== "idle"} onClick={() => onAct(it, a.id)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="imc-clear">
          <span className="imc-lab">Queue clear</span>
          <p>Nothing is waiting on you.</p>
        </div>
      ) : null}
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Readout row                                */
/* -------------------------------------------------------------------------- */

function Readouts({ sim, reduced, hourly }: { sim: Sim; reduced: boolean; hourly: number[] }) {
  const live = sim.lanes.filter((l) => l.status === "live").length
  const runs = totalRuns(sim)
  const spend = totalCost(sim)
  const success = (1 - totalFail(sim) / runs) * 100
  const bm = Math.max(...hourly, 1)
  return (
    <Panel d={0} className="imc-c12" label="Readouts">
      <div className="imc-ro" role="group" aria-label="Key readouts">
        <div className="imc-rc">
          <span className="imc-lab">Agents live</span>
          <div className="imc-rv"><Num value={live} reduced={reduced} />/<span>5</span></div>
          <div className="imc-ticks" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < live ? "on" : ""} />)}</div>
          <div className="imc-rcap">{sim.lanes.filter((l) => l.status === "waiting" || l.status === "held").length} waiting · {sim.lanes.filter((l) => l.status === "failed").length} failed</div>
        </div>
        <div className="imc-rc">
          <span className="imc-lab">Runs today</span>
          <div className="imc-rv"><Num value={runs} reduced={reduced} /></div>
          <div className="imc-bars" aria-hidden>
            {hourly.map((v, i) => <i key={i} style={{ height: `${Math.max(8, (v / bm) * 100)}%` }} />)}
          </div>
          <div className="imc-rcap">+6.1% vs Wed, same hour</div>
        </div>
        <div className="imc-rc">
          <span className="imc-lab">Spend</span>
          <div className="imc-rv"><Num value={spend} decimals={2} prefix="$" reduced={reduced} /><small>/ ${sim.cap}</small></div>
          <div className="imc-meter" aria-hidden>
            <span className="trk" /><span className="fill" style={{ width: `${(spend / sim.cap) * 100}%` }} />
          </div>
          <div className="imc-rcap">{Math.round((spend / sim.cap) * 100)}% of daily cap</div>
        </div>
        <div className="imc-rc">
          <span className="imc-lab">P95 latency</span>
          <div className="imc-rv"><Num value={sim.latency} decimals={1} reduced={reduced} /><small>s</small></div>
          <div className="imc-meter" aria-hidden>
            <span className="trk" /><span className="tg" style={{ left: "62.5%" }} /><span className="mk" style={{ left: `${((sim.latency - 1) / 3) * 100}%` }} />
          </div>
          <div className="imc-rcap">Target ≤ 2.5 s</div>
        </div>
        <div className="imc-rc">
          <span className="imc-lab">Success</span>
          <div className="imc-rv"><Num value={success} decimals={1} reduced={reduced} /><small>%</small></div>
          <div className="imc-meter" aria-hidden>
            <span className="trk" /><span className="tg" style={{ left: "60%" }} /><span className="mk" style={{ left: `${((success - 90) / 10) * 100}%` }} />
          </div>
          <div className="imc-rcap">Target ≥ 96% · {totalFail(sim)} failed</div>
        </div>
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Rail                                    */
/* -------------------------------------------------------------------------- */

const CONSOLE_NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]
const OPS_NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]
const LANE_DOT: Record<LaneStatus, RailAgent["state"]> = { live: "live", waiting: "warn", failed: "bad", idle: "off", held: "off" }

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--imc-accent)" strokeWidth="1.5" />
    </svg>
  )
}

type RailAgent = { name: string; state: "ok" | "live" | "off" | "warn" | "bad"; note: string }

function Rail({
  hidden,
  active,
  agents,
  userRole,
  onGo,
  sideTools,
}: {
  hidden: boolean
  active: string
  agents: RailAgent[]
  userRole: string
  onGo: (label: string) => void
  sideTools?: React.ReactNode
}) {
  const group = (name: string, items: { label: string; icon: LucideIcon }[]) => (
    <nav className="imc-rgroup" aria-label={name}>
      <span className="imc-rlab">{name}</span>
      <div className="imc-rnav">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`imc-ritem${label === active ? " is-active" : ""}`}
            aria-current={label === active ? "page" : undefined}
            onClick={() => onGo(label)}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
  return (
    <aside className="imc-rail" aria-label="Meridian navigation" inert={hidden}>
      <div className="imc-brand">
        <Glyph />
        Meridian
      </div>
      <div className="imc-rgroup" style={{ marginTop: 4 }}>
        <span className="imc-rlab">Workspace</span>
        <button type="button" className="imc-ws" aria-label="Switch workspace">
          Harbor &amp; Finch
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>
      {group("Console", CONSOLE_NAV)}
      {group("Operations", OPS_NAV)}
      <nav className="imc-rgroup" aria-label="Agents">
        <span className="imc-rlab">Agents</span>
        <div className="imc-rnav">
          {agents.map((a) => (
            <button key={a.name} type="button" className="imc-ritem imc-ragent" onClick={() => onGo(a.name)}>
              <span className={`imc-rdot ${a.state}`} aria-hidden="true" />
              {a.name}
              <span className="imc-rlab">{a.note}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="imc-rspacer" />
      {sideTools ? <div className="imc-sidetools">{sideTools}</div> : null}
      <div className="imc-ruser">
        <span className="imc-rav" aria-hidden="true">
          AO
        </span>
        <div>
          <b>Ada Okafor</b>
          <span>{userRole}</span>
        </div>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

export function MissionControl({ onNavigate, sideTools }: MissionControlProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const reduced = useMedia("(prefers-reduced-motion: reduce)")
  const inView = useLive(rootRef)
  const theme = useThemeKey(rootRef)
  const [frozen, setFrozen] = React.useState(false)
  const run = inView && !reduced && !frozen
  const [sim, setSim] = React.useState(initSim)
  const [attn, setAttn] = React.useState<Attn[]>(INITIAL_ATTN)
  const [sel, setSel] = React.useState<AgentId | null>(null)
  const [drawer, setDrawer] = React.useState(false)
  const poolIdx = React.useRef(0)
  const timers = React.useRef<number[]>([])

  React.useEffect(() => {
    if (!run) return
    const id = setInterval(() => setSim(tickSim), 1000)
    return () => clearInterval(id)
  }, [run])

  // new attention item every ~18 s while the queue is short
  React.useEffect(() => {
    if (!run) return
    const id = setInterval(() => {
      setAttn((cur) => {
        if (cur.filter((c) => c.phase === "idle").length >= 2 || poolIdx.current >= POOL.length) return cur
        const next = POOL[poolIdx.current++]
        return [...cur, { ...next, phase: "idle" }]
      })
    }, 18000)
    return () => clearInterval(id)
  }, [run])

  React.useEffect(() => {
    const ts = timers.current
    return () => ts.forEach((t) => clearTimeout(t))
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && rootRef.current && rootRef.current.getClientRects().length) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape") setDrawer(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const wide = useMedia("(min-width: 1024px)")
  const nav = (label: string) => {
    setDrawer(false)
    onNavigate?.(label)
  }

  const act = (item: Attn, action: string) => {
    const mod = (id: AgentId, f: (l: Lane) => Lane, line?: Omit<LogLine, "id" | "fresh">, extra?: Partial<Sim>) =>
      setSim((s) => ({ ...s, ...extra, lanes: s.lanes.map((l) => (l.id === id ? f(l) : l)), ...(line ? addLines(s, [line]) : {}) }))
    const clock = sim.clock
    if (item.kind === "approval" && item.agent === "atlas") {
      if (action === "approve") mod("atlas", (l) => ({ ...l, status: "live", step: 0, cost: l.cost + 2.1, load: 0.55 }), { t: clock, agent: "atlas", kind: "sys", msg: "approved by Ada Okafor · sending 214 emails in 5 batches" })
      else mod("atlas", (l) => ({ ...l, status: "held" }), { t: clock, agent: "atlas", kind: "sys", msg: "held by Ada Okafor · batch not sent" })
    } else if (item.kind === "approval") {
      if (action === "approve") mod(item.agent, (l) => ({ ...l, cost: l.cost + 0.4 }), { t: clock, agent: item.agent, kind: "sys", msg: "approved by Ada Okafor · publishing 3 briefs" })
      else mod(item.agent, (l) => l, { t: clock, agent: item.agent, kind: "sys", msg: "held by Ada Okafor" })
    } else if (item.kind === "budget") {
      if (action === "raise") setSim((s) => ({ ...s, cap: s.cap + 5, ...addLines(s, [{ t: clock, agent: item.agent, kind: "sys", msg: "budget raised by $5 · workspace cap now $" + (s.cap + 5) }]) }))
    } else if (item.kind === "failed") {
      if (action === "retry") mod("ledger", (l) => ({ ...l, status: "live", step: 0, runs: l.runs + 1, load: 0.4, runNo: l.runNo + 1 }), { t: clock, agent: "ledger", kind: "sys", msg: "retrying run 0398 · batch 1 of 4" })
      else mod("ledger", (l) => ({ ...l, status: "idle" }))
    }
    if (reduced) {
      setAttn((cur) => cur.filter((c) => c.id !== item.id))
      return
    }
    setAttn((cur) => cur.map((c) => (c.id === item.id ? { ...c, phase: "out" } : c)))
    timers.current.push(
      window.setTimeout(() => setAttn((cur) => cur.map((c) => (c.id === item.id ? { ...c, phase: "gone" } : c))), 520),
      window.setTimeout(() => setAttn((cur) => cur.filter((c) => c.id !== item.id)), 860),
    )
  }

  // hourly runs for the little bars in the readout
  const todayRuns = totalRuns(sim)
  const hourly = React.useMemo(() => buildHeat(todayRuns)[6].slice(6, HOUR_NOW + 1), [todayRuns])

  return (
    <ThemeCtx.Provider value={theme}>
      <div ref={rootRef} className={`imc${drawer ? " is-open" : ""}`}>
        <style href="imc-mission-control" precedence="default">{CSS}</style>
        <div className="imc-scrim" onClick={() => setDrawer(false)} aria-hidden />
        <Rail
          hidden={!wide && !drawer}
          active="Mission control"
          agents={sim.lanes.slice(0, 3).map((l) => ({ name: NAME[l.id], state: LANE_DOT[l.status], note: STATUS_WORD[l.status] }))}
          userRole="Product lead"
          onGo={nav}
          sideTools={sideTools}
        />
        <div className="imc-main">
          <header className="imc-top">
            <button type="button" className="imc-menu" aria-label="Open navigation" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <Menu size={16} strokeWidth={1.5} />
            </button>
            <div className="imc-ttl">
              <span className="imc-rlab imc-crumb">Console / Mission control</span>
              <h1>Mission control</h1>
            </div>
            <div className="imc-actions">
              <label className="imc-search">
                <Search size={14} strokeWidth={1.5} />
                <input ref={searchRef} type="search" placeholder="Search" aria-label="Search" />
                <kbd>⌘K</kbd>
              </label>
              <button type="button" className="imc-tbtn" aria-pressed={frozen} onClick={() => setFrozen((f) => !f)}>
                {frozen ? "Resume feed" : "Freeze feed"}
              </button>
              <button type="button" className="imc-tbtn ink">New run</button>
            </div>
          </header>
          <div className="imc-scroll">
            <div className="imc-grid">
              <Readouts sim={sim} reduced={reduced} hourly={hourly} />
              <Scope run={run} reduced={reduced} frozen={frozen} />
              <AttentionQueue items={attn} onAct={act} />
              <Lanes sim={sim} run={run} reduced={reduced} sel={sel} onSel={(id) => setSel((c) => (c === id ? null : id))} />
              <Heatmap today={todayRuns} />
              <RunLog lines={sim.lines} sel={sel} onClearSel={() => setSel(null)} />
            </div>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  )
}
