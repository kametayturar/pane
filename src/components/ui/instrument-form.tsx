"use client"

import * as React from "react"
import { ChevronDown, Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState<T>(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? (value as T) : inner
  const set = React.useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
      onChange?.(next)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

function decimalsOf(n: number) {
  if (!Number.isFinite(n)) return 0
  const s = String(n)
  if (s.includes("e-")) return parseInt(s.split("e-")[1], 10)
  const i = s.indexOf(".")
  return i < 0 ? 0 : s.length - i - 1
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Round to a step grid anchored at `min` (or 0), then to the grid's decimals so 0.1 + 0.2 stays 0.3. */
function snapTo(n: number, step: number, min: number, max: number) {
  const base = Number.isFinite(min) ? min : 0
  const dec = Math.max(decimalsOf(step), decimalsOf(base))
  const snapped = Math.round((n - base) / step) * step + base
  return clamp(Number(snapped.toFixed(dec)), min, max)
}

/** 1 · 2 · 5 × 10ⁿ major step for a ruler, with how many minor divisions to draw between majors. */
function niceRuler(range: number) {
  const raw = range / 5
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return { major: n * p, divisions: n === 2 ? 4 : 5 }
}

/* -------------------------------------------------------------------------- */
/*                                Field context                               */
/* -------------------------------------------------------------------------- */

type FieldCtx = { id: string; labelId?: string; descId?: string; invalid: boolean }
const FieldContext = React.createContext<FieldCtx | null>(null)

function useFieldIds(idProp?: string) {
  const ctx = React.useContext(FieldContext)
  const auto = React.useId()
  return {
    id: idProp ?? ctx?.id ?? auto,
    labelId: ctx?.labelId,
    descId: ctx?.descId,
    invalid: ctx?.invalid ?? false,
  }
}

const joinIds = (...ids: (string | undefined)[]) => ids.filter(Boolean).join(" ") || undefined

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ifm {
  --ifm-paper: #fafafa;
  --ifm-sheet: #ffffff;
  --ifm-ink: #0a0a0a;
  --ifm-signal: #0060e2;
  --ifm-accent: var(--ifm-signal);
  --ifm-surface: var(--ifm-sheet);
  --ifm-signal-soft: color-mix(in oklab, var(--ifm-accent) 12%, transparent);
  --ifm-t1: color-mix(in oklab, var(--ifm-ink) 92%, transparent);
  --ifm-t2: color-mix(in oklab, var(--ifm-ink) 64%, transparent);
  --ifm-t3: color-mix(in oklab, var(--ifm-ink) 44%, transparent);
  --ifm-t4: color-mix(in oklab, var(--ifm-ink) 22%, transparent);
  --ifm-rule: color-mix(in oklab, var(--ifm-ink) 14%, transparent);
  --ifm-rule-2: color-mix(in oklab, var(--ifm-ink) 7%, transparent);
  --ifm-ok: #1f8a4c; --ifm-warn: #b7791f; --ifm-bad: #c4321a;
  --ifm-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ifm-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ifm-font: var(--ifm-sans);
  --ifm-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ifm-ease: cubic-bezier(.2, .8, .2, 1);
  --ifm-ease-trace: cubic-bezier(.65, 0, .35, 1);
  font: 13px/20px var(--ifm-font); color: var(--ifm-t1);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ifm {
  --ifm-paper: #0c0c0d; --ifm-sheet: #1c1c1e; --ifm-ink: #f5f5f5; --ifm-signal: #4d8dff;
  --ifm-ok: #4cc27f; --ifm-warn: #e0a64a; --ifm-bad: #ff7a62;
}
.ifm *, .ifm *::before, .ifm *::after { box-sizing: border-box }
:where(.ifm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.ifm) :is(input, textarea) { font: inherit; color: inherit; margin: 0 }
.ifm :focus-visible { outline: 2px solid color-mix(in oklab, var(--ifm-accent) 60%, transparent); outline-offset: 1px }

/* Shared type */
.ifm-lab { font: 500 10.5px/16px var(--ifm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifm-t3) }
.ifm-unit { flex: none; font: 500 10.5px/16px var(--ifm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifm-t3); white-space: nowrap }
.ifm-num { font-family: var(--ifm-mono); font-variant-numeric: tabular-nums }

/* Field */
.ifm-field { display: flex; flex-direction: column; gap: 6px; min-width: 0 }
.ifm-fhead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px }
.ifm-req { margin-left: 4px; color: var(--ifm-accent) }
.ifm-fc { display: flex; align-items: center; gap: 10px; min-width: 0 }
.ifm-fc > :first-child { flex: 1 1 auto; min-width: 0 }
.ifm-fc > .ifm-st { flex: none }
.ifm-msg { margin: 0; font-size: 12px; line-height: 18px; color: var(--ifm-t3) }
.ifm-msg[data-tone="bad"] { display: flex; gap: 8px; color: var(--ifm-bad) }
.ifm-msg[data-tone="bad"] > span { flex: none; font: 600 10.5px/18px var(--ifm-mono); letter-spacing: .08em }

/* Box: the shared hairline surface for inputs, select and stepper */
.ifm-box {
  position: relative; display: flex; align-items: center; min-width: 0; min-height: 34px; width: 100%;
  background: var(--ifm-surface); border-radius: 2px; box-shadow: 0 0 0 1px var(--ifm-rule);
  transition: box-shadow .16s var(--ifm-ease);
}
.ifm-box:hover { box-shadow: 0 0 0 1px var(--ifm-t4) }
.ifm-box:focus-within { box-shadow: 0 0 0 1px var(--ifm-t2); outline: 2px solid color-mix(in oklab, var(--ifm-accent) 60%, transparent); outline-offset: 1px }
.ifm-box[data-invalid] { box-shadow: 0 0 0 1px var(--ifm-bad) }
.ifm-box[data-disabled] { opacity: .5; pointer-events: none }
.ifm-box :focus-visible { outline: none }
.ifm-in {
  flex: 1 1 auto; min-width: 0; height: 34px; padding: 0 10px; background: transparent; border: 0; outline: 0;
  font: 13px/20px var(--ifm-font); color: var(--ifm-t1);
}
.ifm-in::placeholder, .ifm-ta::placeholder { color: var(--ifm-t3) }
.ifm-in:disabled, .ifm-ta:disabled { cursor: not-allowed }
.ifm-aff { flex: none; padding: 0 0 0 10px; font: 500 11px/16px var(--ifm-mono); color: var(--ifm-t3); white-space: nowrap }
.ifm-aff:last-child { padding: 0 10px 0 0 }
.ifm-aff + .ifm-in { padding-left: 8px }
.ifm-in:has(+ .ifm-aff) { padding-right: 8px }

/* TextArea */
.ifm-box-ta { flex-direction: column; align-items: stretch }
.ifm-ta {
  display: block; width: 100%; padding: 8px 10px; background: transparent; border: 0; outline: 0; resize: none;
  font: 13px/20px var(--ifm-font); color: var(--ifm-t1); overflow-y: hidden;
}
.ifm-count { align-self: flex-end; padding: 0 10px 6px; font: 500 10.5px/14px var(--ifm-mono); letter-spacing: .04em; color: var(--ifm-t3); font-variant-numeric: tabular-nums }
.ifm-count[data-over] { color: var(--ifm-bad) }

/* Select */
.ifm-sel { position: relative; display: block; width: 100% }
.ifm-sel-btn { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 34px; padding: 0 10px; text-align: left; border-radius: 2px }
.ifm-sel-btn:focus-visible { outline: none }
.ifm-sel-val { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ifm-sel-val[data-empty] { color: var(--ifm-t3) }
.ifm-sel-meta { flex: none; font: 500 11px/16px var(--ifm-mono); color: var(--ifm-t3) }
.ifm-sel-chev { flex: none; color: var(--ifm-t3); transition: transform .24s var(--ifm-ease) }
.ifm-sel[data-open] .ifm-sel-chev { transform: rotate(180deg) }
.ifm-pop {
  position: absolute; left: 0; min-width: 100%; z-index: 30; margin: 0; padding: 4px; list-style: none;
  max-height: 280px; overflow: auto; background: var(--ifm-surface); border-radius: 4px;
  box-shadow: 0 0 0 1px var(--ifm-rule), 0 1px 0 var(--ifm-rule), 0 12px 24px -16px rgb(0 0 0 / .25);
  animation: ifm-pop-down .24s var(--ifm-ease) backwards;
}
.ifm-pop[data-align="end"] { left: auto; right: 0 }
.ifm-pop[data-place="down"] { top: calc(100% + 4px) }
.ifm-pop[data-place="up"] { bottom: calc(100% + 4px); animation-name: ifm-pop-up }
.ifm-opt {
  position: relative; display: flex; align-items: center; gap: 10px; padding: 7px 10px 7px 16px; border-radius: 2px;
  cursor: pointer; color: var(--ifm-t1); user-select: none;
}
.ifm-opt[data-active] { background: var(--ifm-rule-2) }
.ifm-opt[aria-disabled="true"] { opacity: .4; cursor: not-allowed }
.ifm-opt::before {
  content: ""; position: absolute; left: 5px; top: 50%; width: 2px; height: 12px; margin-top: -6px; background: var(--ifm-accent);
  transform: scaleY(0); transition: transform .2s var(--ifm-ease);
}
.ifm-opt[aria-selected="true"]::before { transform: scaleY(1) }
.ifm-opt-ic { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ifm-t2) }
.ifm-opt-tx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column }
.ifm-opt-tx b { font-weight: 500 }
.ifm-opt-tx i { font-style: normal; font-size: 12px; line-height: 16px; color: var(--ifm-t3) }
.ifm-opt-meta { flex: none; font: 500 11px/16px var(--ifm-mono); color: var(--ifm-t3) }
@keyframes ifm-pop-down { from { clip-path: inset(0 -20px 100% -20px) } to { clip-path: inset(-20px -20px -20px -20px) } }
@keyframes ifm-pop-up { from { clip-path: inset(100% -20px 0 -20px) } to { clip-path: inset(-20px -20px -20px -20px) } }

/* Toggle */
.ifm-tg { display: inline-flex; align-items: flex-start; gap: 10px; cursor: pointer; min-width: 0 }
.ifm-tg[data-row] { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 10px 0 }
.ifm-tg[data-row] + .ifm-tg[data-row] { border-top: 1px solid var(--ifm-rule-2) }
.ifm-tg[data-disabled] { opacity: .5; cursor: not-allowed }
.ifm-tg[data-row] .ifm-tg-btn { order: 2 }
.ifm-tg-tx { display: flex; flex-direction: column; min-width: 0; padding-top: 1px }
.ifm-tg-tx b { font-weight: 500; color: var(--ifm-t1) }
.ifm-tg-tx i { font-style: normal; font-size: 12px; line-height: 18px; color: var(--ifm-t3) }
.ifm-tg-btn {
  position: relative; flex: none; width: 34px; height: 20px; border-radius: 2px; background: var(--ifm-surface);
  box-shadow: 0 0 0 1px var(--ifm-rule); transition: box-shadow .2s var(--ifm-ease), background-color .2s var(--ifm-ease);
}
.ifm-tg-btn::before, .ifm-tg-btn::after { content: ""; position: absolute; top: 5px; width: 1px; height: 10px; background: var(--ifm-rule) }
.ifm-tg-btn::before { left: 8px }
.ifm-tg-btn::after { right: 8px }
.ifm-tg-knob {
  position: absolute; top: 3px; left: 3px; width: 12px; height: 14px; border-radius: 1px; background: var(--ifm-t3);
  transition: transform .22s var(--ifm-ease), background-color .2s var(--ifm-ease);
}
.ifm-tg-btn[aria-checked="true"] { background: var(--ifm-signal-soft); box-shadow: 0 0 0 1px var(--ifm-accent) }
.ifm-tg-btn[aria-checked="true"] .ifm-tg-knob { transform: translateX(16px); background: var(--ifm-accent) }
.ifm-tg-btn[aria-checked="true"]::before, .ifm-tg-btn[aria-checked="true"]::after { background: color-mix(in oklab, var(--ifm-accent) 40%, transparent) }
.ifm-tg-state { margin-left: 8px; font: 500 10.5px/16px var(--ifm-mono); letter-spacing: .08em; color: var(--ifm-t3) }

/* Segmented */
.ifm-sg {
  position: relative; display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; max-width: 100%;
  background: var(--ifm-surface); border-radius: 2px; box-shadow: 0 0 0 1px var(--ifm-rule);
}
.ifm-sg[data-full] { display: grid; width: 100% }
.ifm-sg[data-disabled] { opacity: .5; pointer-events: none }
.ifm-sg-ind {
  position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% / var(--n)); pointer-events: none;
  transform: translateX(calc(var(--i) * 100%)); background: var(--ifm-rule-2);
  transition: transform .3s var(--ifm-ease);
}
.ifm-sg-ind::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--ifm-accent) }
.ifm-sg-opt {
  position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 32px; padding: 0 14px;
  white-space: nowrap; color: var(--ifm-t2); transition: color .2s var(--ifm-ease);
}
.ifm-sg-opt + .ifm-sg-opt::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 1px; background: var(--ifm-rule) }
.ifm-sg-opt:hover { color: var(--ifm-t1) }
.ifm-sg-opt[aria-checked="true"] { color: var(--ifm-ink); font-weight: 500 }
.ifm-sg-opt:disabled { opacity: .4; cursor: not-allowed }
.ifm-sg[data-size="sm"] .ifm-sg-opt { min-height: 26px; padding: 0 10px; font-size: 12px }
@media (max-width: 480px) { .ifm-sg-opt { padding: 0 8px } }

/* Stepper */
.ifm-st { width: auto; display: inline-flex }
.ifm-st-b { flex: none; display: grid; place-items: center; width: 34px; height: 34px; color: var(--ifm-t2); transition: color .16s, background-color .16s }
.ifm-st-b:hover:not(:disabled) { color: var(--ifm-ink); background: var(--ifm-rule-2) }
.ifm-st-b:active:not(:disabled) { background: var(--ifm-rule) }
.ifm-st-b:disabled { opacity: .35; cursor: not-allowed }
.ifm-st-b:first-child { border-radius: 2px 0 0 2px; box-shadow: 1px 0 0 var(--ifm-rule) }
.ifm-st-b:last-child { border-radius: 0 2px 2px 0; box-shadow: -1px 0 0 var(--ifm-rule) }
.ifm-st-in { width: 64px; height: 34px; padding: 0; text-align: center; background: transparent; border: 0; outline: 0; font: 500 13px/20px var(--ifm-mono); font-variant-numeric: tabular-nums; color: var(--ifm-t1) }
.ifm-st-u { flex: none; align-self: center; padding: 0 10px 0 0; margin-left: -8px; font: 500 10.5px/16px var(--ifm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifm-t3) }

/* RulerSlider */
.ifm-rs { display: block; width: 100%; touch-action: pan-y }
.ifm-rs[data-disabled] { opacity: .5; pointer-events: none }
.ifm-rs-read { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px }
.ifm-rs-val { font: 500 20px/28px var(--ifm-mono); font-variant-numeric: tabular-nums; letter-spacing: -.01em; color: var(--ifm-ink) }
.ifm-rs-unit { font: 500 10.5px/16px var(--ifm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifm-t3) }
.ifm-rs-marks { position: relative; height: 22px; margin: 0 14px }
.ifm-rs-mark {
  position: absolute; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center;
  height: 22px; padding: 0 2px; font: italic 12px/14px var(--ifm-serif); color: var(--ifm-t2); white-space: nowrap;
}
.ifm-rs-mark::after { content: ""; flex: 1; width: 1px; margin-top: 1px; background: var(--ifm-t3) }
.ifm-rs-mark:hover { color: var(--ifm-ink) }
.ifm-rs-ruler { position: relative; height: 40px; margin: 0 14px; cursor: pointer; touch-action: pan-y; user-select: none }
.ifm-rs-ticks { position: absolute; inset: 0; animation: ifm-trace .7s var(--ifm-ease-trace) backwards }
.ifm-rs-base { position: absolute; left: 0; right: 0; top: 10px; height: 1px; background: var(--ifm-rule) }
.ifm-rs-fill { position: absolute; left: 0; top: 10px; height: 1px; background: var(--ifm-t2); transition: width .16s var(--ifm-ease) }
.ifm-rs-t { position: absolute; top: 10px; width: 1px; height: 5px; margin-left: -.5px; background: var(--ifm-t4) }
.ifm-rs-t[data-major] { height: 11px; background: var(--ifm-t3) }
.ifm-rs-t b { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); font: 500 10.5px/14px var(--ifm-mono); letter-spacing: .04em; color: var(--ifm-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.ifm-rs-thumb {
  position: absolute; top: 0; width: 14px; height: 24px; margin-left: -7px; cursor: grab; transition: left .16s var(--ifm-ease);
  animation: ifm-fade .4s .35s backwards;
}
.ifm-rs-thumb::before { content: ""; position: absolute; left: 6px; top: 0; width: 2px; height: 24px; background: var(--ifm-accent) }
.ifm-rs-thumb::after { content: ""; position: absolute; left: 3px; top: 0; width: 8px; height: 2px; background: var(--ifm-accent) }
.ifm-rs[data-drag] .ifm-rs-thumb { transition: none; cursor: grabbing }
.ifm-rs[data-drag] .ifm-rs-fill { transition: none }
@keyframes ifm-trace { from { clip-path: inset(-4px 100% -4px -24px) } to { clip-path: inset(-4px -24px -4px -24px) } }
@keyframes ifm-fade { from { opacity: 0 } to { opacity: 1 } }

/* FormSection */
.ifm-fs { position: relative; display: block; container: ifm-fs / inline-size; padding: 28px 0 32px; border-top: 1px solid var(--ifm-rule) }
.ifm-fs::before { content: ""; position: absolute; left: 0; top: -1px; width: 28px; height: 2px; background: var(--ifm-ink) }
.ifm-fs-grid { display: grid; gap: 20px }
.ifm-fs-head { display: flex; flex-direction: column; gap: 6px; min-width: 0 }
.ifm-fs-title { margin: 0; font: 400 26px/30px var(--ifm-serif); letter-spacing: -.01em; color: var(--ifm-ink) }
.ifm-fs-title em { font-style: italic }
.ifm-fs-desc { margin: 0; max-width: 34ch; color: var(--ifm-t2) }
.ifm-fs-body { display: flex; flex-direction: column; gap: 22px; min-width: 0 }
@container ifm-fs (min-width: 640px) {
  .ifm-fs-grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 40px }
}

/* SaveBar */
.ifm-sb {
  position: sticky; bottom: 16px; z-index: 5; display: flex; align-items: center; gap: 14px; margin-top: 24px; padding: 10px 10px 10px 16px;
  background: var(--ifm-surface); border-radius: 4px;
  box-shadow: 0 0 0 1px var(--ifm-rule), 0 1px 0 var(--ifm-rule), 0 12px 24px -16px rgb(0 0 0 / .25);
  visibility: hidden; opacity: 0; transform: translateY(10px); clip-path: inset(-24px 100% -24px -24px);
  transition: opacity .3s var(--ifm-ease), transform .4s var(--ifm-ease), clip-path .5s var(--ifm-ease-trace), visibility 0s .5s;
}
.ifm-sb[data-open] {
  visibility: visible; opacity: 1; transform: none; clip-path: inset(-24px -24px -24px -24px); transition-delay: 0s;
}
.ifm-sb::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--ifm-accent); opacity: 0; pointer-events: none;
}
.ifm-sb[data-open]::after { animation: ifm-scan .65s var(--ifm-ease-trace) }
@keyframes ifm-scan { 0% { left: 0; opacity: 1 } 80% { opacity: 1 } 100% { left: calc(100% - 1px); opacity: 0 } }
.ifm-sb-dot { position: relative; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--ifm-accent) }
.ifm-sb[data-open] .ifm-sb-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 1px solid var(--ifm-accent); animation: ifm-ring 1.6s var(--ifm-ease) infinite }
@keyframes ifm-ring { from { transform: scale(1); opacity: .8 } to { transform: scale(3.2); opacity: 0 } }
.ifm-sb-msg { flex: 1 1 auto; min-width: 0; display: flex; align-items: baseline; gap: 10px; white-space: nowrap; overflow: hidden }
.ifm-sb-n { font: 500 11.5px/16px var(--ifm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ifm-ink) }
.ifm-sb-sub { overflow: hidden; text-overflow: ellipsis; color: var(--ifm-t3) }
.ifm-sb-act { flex: none; display: flex; align-items: center; gap: 4px }
.ifm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 2px; font-weight: 500; font-size: 12.5px; transition: background-color .16s, color .16s, box-shadow .16s }
.ifm-btn[data-kind="ghost"] { color: var(--ifm-t2) }
.ifm-btn[data-kind="ghost"]:hover:not(:disabled) { color: var(--ifm-ink); background: var(--ifm-rule-2) }
.ifm-btn[data-kind="primary"] { color: var(--ifm-ink); box-shadow: 0 0 0 1px var(--ifm-accent) }
.ifm-btn[data-kind="primary"]:hover:not(:disabled) { background: var(--ifm-signal-soft) }
.ifm-btn:active:not(:disabled) { transform: translateY(.5px) }
.ifm-btn:disabled { opacity: .5; cursor: default }
@media (max-width: 520px) { .ifm-sb-sub { display: none } .ifm-sb { gap: 10px; padding-left: 12px } }

@media (prefers-reduced-motion: reduce) {
  .ifm *, .ifm *::before, .ifm *::after { animation: none !important; transition: none !important }
  .ifm.ifm-sb { transition: none !important }
}
`

function Css() {
  return (
    <style href="instrument-form" precedence="default">
      {CSS}
    </style>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Field                                   */
/* -------------------------------------------------------------------------- */

export type FieldProps = {
  /** Mono uppercase label above the control. */
  label?: React.ReactNode
  /** Quiet help text under the control. */
  hint?: React.ReactNode
  /** Error text. Replaces the hint, marks the control invalid and is announced. */
  error?: React.ReactNode
  /** Mono unit after the control, e.g. "tokens". */
  unit?: React.ReactNode
  /** Draws a signal asterisk after the label. */
  required?: boolean
  /** Id of the control. Generated when left out; controls inside pick it up automatically. */
  htmlFor?: string
  /** Right-aligned content on the label row, e.g. a link or a count. */
  labelAside?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Label, control, hint and error as one unit. Controls inside it read their id, label and error state from context. */
export function Field({ label, hint, error, unit, required, htmlFor, labelAside, className, children }: FieldProps) {
  const auto = React.useId()
  const id = htmlFor ?? `${auto}-c`
  const labelId = label ? `${auto}-l` : undefined
  const descId = hint || error ? `${auto}-d` : undefined
  const invalid = Boolean(error)
  const ctx = React.useMemo<FieldCtx>(() => ({ id, labelId, descId, invalid }), [id, labelId, descId, invalid])
  return (
    <div className={cn("ifm ifm-field", className)} data-invalid={invalid || undefined}>
      <Css />
      {label || labelAside ? (
        <div className="ifm-fhead">
          {label ? (
            <label id={labelId} htmlFor={id} className="ifm-lab">
              {label}
              {required ? (
                <span className="ifm-req" aria-hidden="true">
                  *
                </span>
              ) : null}
            </label>
          ) : (
            <span />
          )}
          {labelAside}
        </div>
      ) : null}
      <FieldContext.Provider value={ctx}>
        <div className="ifm-fc">
          {children}
          {unit ? <span className="ifm-unit">{unit}</span> : null}
        </div>
      </FieldContext.Provider>
      {error ? (
        <p id={descId} role="alert" className="ifm-msg" data-tone="bad">
          <span aria-hidden="true">ERR</span>
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="ifm-msg">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  TextInput                                 */
/* -------------------------------------------------------------------------- */

export type TextInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  /** Mono text before the input, e.g. "https://". */
  leading?: React.ReactNode
  /** Mono text after the input, e.g. ".pane.app". */
  trailing?: React.ReactNode
  invalid?: boolean
}

/** Single-line input on the hairline box. Works controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { leading, trailing, invalid, className, id, ...rest },
  ref,
) {
  const f = useFieldIds(id)
  const bad = invalid || f.invalid
  return (
    <div className={cn("ifm ifm-box", className)} data-invalid={bad || undefined} data-disabled={rest.disabled || undefined}>
      <Css />
      {leading ? <span className="ifm-aff">{leading}</span> : null}
      <input
        {...rest}
        ref={ref}
        id={f.id}
        className="ifm-in"
        aria-invalid={bad || undefined}
        aria-describedby={joinIds(f.descId, rest["aria-describedby"])}
      />
      {trailing ? <span className="ifm-aff">{trailing}</span> : null}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  TextArea                                  */
/* -------------------------------------------------------------------------- */

export type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
  /** Rows shown when empty. */
  minRows?: number
  /** Stops growing here and scrolls instead. Unlimited when left out. */
  maxRows?: number
  /** Shows a mono character counter (against `maxLength` when set). */
  showCount?: boolean
  invalid?: boolean
}

/** Multi-line input that grows with its content. */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { minRows = 3, maxRows, showCount, invalid, className, id, onChange, value, defaultValue, ...rest },
  ref,
) {
  const f = useFieldIds(id)
  const bad = invalid || f.invalid
  const innerRef = React.useRef<HTMLTextAreaElement>(null)
  React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)
  const [len, setLen] = React.useState(() => String(value ?? defaultValue ?? "").length)
  const length = value !== undefined ? String(value).length : len

  const fit = React.useCallback(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = "auto"
    const cs = getComputedStyle(el)
    const line = parseFloat(cs.lineHeight) || 20
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
    const min = line * minRows + pad
    const max = maxRows ? line * maxRows + pad : Infinity
    el.style.height = `${Math.min(Math.max(el.scrollHeight, min), max)}px`
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden"
  }, [minRows, maxRows])

  React.useLayoutEffect(() => {
    fit()
  }, [fit, value])

  React.useEffect(() => {
    const el = innerRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    let w = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== w) {
        w = el.clientWidth
        fit()
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  return (
    <div
      className={cn("ifm ifm-box ifm-box-ta", className)}
      data-invalid={bad || undefined}
      data-disabled={rest.disabled || undefined}
    >
      <Css />
      <textarea
        {...rest}
        ref={innerRef}
        id={f.id}
        value={value}
        defaultValue={defaultValue}
        className="ifm-ta"
        rows={minRows}
        aria-invalid={bad || undefined}
        aria-describedby={joinIds(f.descId, rest["aria-describedby"])}
        onChange={(e) => {
          setLen(e.target.value.length)
          fit()
          onChange?.(e)
        }}
      />
      {showCount ? (
        <span className="ifm-count" data-over={rest.maxLength && length >= rest.maxLength ? "" : undefined} aria-hidden="true">
          {length}
          {rest.maxLength ? ` / ${rest.maxLength}` : ""}
        </span>
      ) : null}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                                   Select                                   */
/* -------------------------------------------------------------------------- */

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  /** Second line under the label. */
  description?: string
  /** Mono text on the right, e.g. a context size. */
  meta?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export type SelectProps<T extends string = string> = {
  options: SelectOption<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T, option: SelectOption<T>) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  /** Renders a hidden input so the value posts with a native form. */
  name?: string
  /** Aligns the popover to the trigger's right edge. */
  align?: "start" | "end"
  className?: string
  "aria-label"?: string
}

/** Custom listbox: arrows, Home/End, type-ahead, Enter/Space to pick, Esc to close. Opens upward when there is no room below. */
export function Select<T extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select…",
  disabled,
  invalid,
  id,
  name,
  align = "start",
  className,
  "aria-label": ariaLabel,
}: SelectProps<T>) {
  const f = useFieldIds(id)
  const bad = invalid || f.invalid
  const [current, setCurrent] = useControllable<T | undefined>(value, defaultValue, undefined)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const [place, setPlace] = React.useState<"down" | "up">("down")
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const typed = React.useRef({ buf: "", t: 0 as ReturnType<typeof setTimeout> | 0 })
  const listId = `${f.id}-list`
  const selectedIndex = options.findIndex((o) => o.value === current)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  React.useEffect(() => {
    const ty = typed.current
    return () => {
      if (ty.t) clearTimeout(ty.t)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  const enabledFrom = (start: number, dir: 1 | -1) => {
    for (let i = start; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i
    return -1
  }

  const openList = () => {
    if (disabled || open) return
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      const below = window.innerHeight - r.bottom
      const need = Math.min(options.length * 38 + 10, 280)
      setPlace(below < need && r.top > below ? "up" : "down")
    }
    setActive(selectedIndex >= 0 ? selectedIndex : Math.max(enabledFrom(0, 1), 0))
    setOpen(true)
  }

  const commit = (i: number) => {
    const o = options[i]
    if (!o || o.disabled) return
    setCurrent(o.value)
    onChange?.(o.value, o)
    setOpen(false)
    btnRef.current?.focus()
  }

  const move = (dir: 1 | -1, from = active) => {
    const n = enabledFrom(from + dir, dir)
    if (n >= 0) setActive(n)
  }

  const typeahead = (ch: string) => {
    const ty = typed.current
    ty.buf += ch.toLowerCase()
    if (ty.t) clearTimeout(ty.t)
    ty.t = setTimeout(() => {
      ty.buf = ""
      ty.t = 0
    }, 600)
    const order = [...options.keys()]
    const start = ty.buf.length === 1 ? active + 1 : active
    const rotated = [...order.slice(start % options.length), ...order.slice(0, start % options.length)]
    const hit = rotated.find((i) => !options[i].disabled && options[i].label.toLowerCase().startsWith(ty.buf))
    if (hit !== undefined) {
      if (open) setActive(hit)
      else {
        openList()
        setActive(hit)
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault()
        openList()
      } else if (k.length === 1) typeahead(k)
      return
    }
    if (k === "ArrowDown") {
      e.preventDefault()
      move(1)
    } else if (k === "ArrowUp") {
      e.preventDefault()
      move(-1)
    } else if (k === "Home") {
      e.preventDefault()
      setActive(Math.max(enabledFrom(0, 1), 0))
    } else if (k === "End") {
      e.preventDefault()
      setActive(Math.max(enabledFrom(options.length - 1, -1), 0))
    } else if (k === "Enter" || k === " ") {
      e.preventDefault()
      commit(active)
    } else if (k === "Escape") {
      e.preventDefault()
      setOpen(false)
    } else if (k === "Tab") setOpen(false)
    else if (k.length === 1) typeahead(k)
  }

  return (
    <div className={cn("ifm ifm-sel", className)} data-open={open || undefined}>
      <Css />
      <button
        ref={btnRef}
        type="button"
        id={f.id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-labelledby={ariaLabel ? undefined : f.labelId}
        aria-label={ariaLabel}
        aria-invalid={bad || undefined}
        aria-describedby={f.descId}
        disabled={disabled}
        className="ifm-box ifm-sel-btn"
        data-invalid={bad || undefined}
        data-disabled={disabled || undefined}
        onClick={() => {
          btnRef.current?.focus()
          if (open) setOpen(false)
          else openList()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      >
        {selected?.icon ? <span className="ifm-opt-ic">{selected.icon}</span> : null}
        <span className="ifm-sel-val" data-empty={selected ? undefined : ""}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.meta ? <span className="ifm-sel-meta">{selected.meta}</span> : null}
        <ChevronDown className="ifm-sel-chev" size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={f.labelId}
          className="ifm-pop"
          data-place={place}
          data-align={align}
          onPointerDown={(e) => e.preventDefault()}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              className="ifm-opt"
              onPointerMove={() => !o.disabled && i !== active && setActive(i)}
              onClick={() => commit(i)}
            >
              {o.icon ? <span className="ifm-opt-ic">{o.icon}</span> : null}
              <span className="ifm-opt-tx">
                <b>{o.label}</b>
                {o.description ? <i>{o.description}</i> : null}
              </span>
              {o.meta ? <span className="ifm-opt-meta">{o.meta}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Toggle                                   */
/* -------------------------------------------------------------------------- */

export type ToggleProps = {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  label?: React.ReactNode
  description?: React.ReactNode
  /** "inline" puts the switch before the label. "row" spans the width: label left, switch right, hairline between stacked rows. */
  layout?: "inline" | "row"
  /** Shows ON / OFF in mono after the label. */
  showState?: boolean
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  "aria-label"?: string
}

/** A switch (role="switch"): square-ish track, signal knob when on. Clicking the label toggles it. */
export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  description,
  layout = "inline",
  showState,
  disabled,
  id,
  name,
  className,
  "aria-label": ariaLabel,
}: ToggleProps) {
  const f = useFieldIds(id)
  const [on, setOn] = useControllable(checked, defaultChecked, onChange)
  return (
    <label className={cn("ifm ifm-tg", className)} data-row={layout === "row" || undefined} data-disabled={disabled || undefined}>
      <Css />
      <button
        type="button"
        id={f.id}
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        aria-describedby={f.descId}
        disabled={disabled}
        className="ifm-tg-btn"
        onClick={() => setOn(!on)}
      >
        <span className="ifm-tg-knob" />
      </button>
      {name ? <input type="hidden" name={name} value={on ? "on" : ""} /> : null}
      {label || description || showState ? (
        <span className="ifm-tg-tx">
          <b>
            {label}
            {showState ? <span className="ifm-tg-state">{on ? "ON" : "OFF"}</span> : null}
          </b>
          {description ? <i>{description}</i> : null}
        </span>
      ) : null}
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Segmented                                 */
/* -------------------------------------------------------------------------- */

export type SegmentedOption<T extends string = string> = {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export type SegmentedProps<T extends string = string> = {
  options: SegmentedOption<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  size?: "sm" | "md"
  /** Stretch to the container width; segments stay equal. */
  fullWidth?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}

/** Radiogroup with a sliding signal tick under the chosen segment. Arrow keys move and select, Home/End jump. */
export function Segmented<T extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  size = "md",
  fullWidth,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const f = useFieldIds(id)
  const [current, setCurrent] = useControllable<T | undefined>(value, defaultValue ?? options[0]?.value, undefined)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === current),
  )

  const pick = (i: number) => {
    const o = options[i]
    if (!o || o.disabled) return
    refs.current[i]?.focus()
    setCurrent(o.value)
    onChange?.(o.value)
  }
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i
    return from
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key
    let n = -1
    if (k === "ArrowRight" || k === "ArrowDown") n = step(idx, 1)
    else if (k === "ArrowLeft" || k === "ArrowUp") n = step(idx, -1)
    else if (k === "Home") n = step(-1, 1)
    else if (k === "End") n = step(options.length, -1)
    if (n >= 0) {
      e.preventDefault()
      pick(n)
    }
  }

  return (
    <div
      id={f.id}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : f.labelId}
      aria-describedby={f.descId}
      className={cn("ifm ifm-sg", className)}
      data-size={size}
      data-full={fullWidth || undefined}
      data-disabled={disabled || undefined}
      style={{ "--n": options.length, "--i": idx } as React.CSSProperties}
      onKeyDown={onKeyDown}
    >
      <Css />
      <span className="ifm-sg-ind" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          disabled={o.disabled}
          className="ifm-sg-opt"
          onClick={() => pick(i)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Stepper                                  */
/* -------------------------------------------------------------------------- */

export type StepperProps = {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Mono unit inside the control after the number. */
  unit?: string
  format?: (value: number) => string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}

/** Number input with − and + buttons. Type a value (committed on blur or Enter) or use ↑ ↓ PageUp PageDown Home End. */
export function Stepper({
  value,
  defaultValue = 0,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  format,
  disabled,
  invalid,
  id,
  className,
  "aria-label": ariaLabel,
}: StepperProps) {
  const f = useFieldIds(id)
  const bad = invalid || f.invalid
  const [n, setN] = useControllable(value, defaultValue, onChange)
  const [draft, setDraft] = React.useState<string | null>(null)
  const fmt = format ?? ((v: number) => v.toFixed(decimalsOf(step)))
  const set = (v: number) => setN(snapTo(v, step, min, max))

  const commit = () => {
    if (draft !== null) {
      const parsed = parseFloat(draft.replace(",", ".").replace(/[^\d.+-]/g, ""))
      if (Number.isFinite(parsed)) set(parsed)
      setDraft(null)
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : f.labelId}
      className={cn("ifm ifm-box ifm-st", className)}
      data-invalid={bad || undefined}
      data-disabled={disabled || undefined}
    >
      <Css />
      <button type="button" className="ifm-st-b" aria-label="Decrease" disabled={disabled || n <= min} onClick={() => set(n - step)}>
        <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <input
        id={f.id}
        className="ifm-st-in"
        type="text"
        inputMode={decimalsOf(step) > 0 ? "decimal" : "numeric"}
        role="spinbutton"
        aria-valuenow={n}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        aria-invalid={bad || undefined}
        aria-describedby={f.descId}
        disabled={disabled}
        value={draft ?? fmt(n)}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          const k = e.key
          if (k === "Enter") {
            e.preventDefault()
            commit()
          } else if (k === "Escape") setDraft(null)
          else if (k === "ArrowUp") {
            e.preventDefault()
            set(n + step)
          } else if (k === "ArrowDown") {
            e.preventDefault()
            set(n - step)
          } else if (k === "PageUp") {
            e.preventDefault()
            set(n + step * 10)
          } else if (k === "PageDown") {
            e.preventDefault()
            set(n - step * 10)
          } else if (k === "Home" && Number.isFinite(min)) {
            e.preventDefault()
            set(min)
          } else if (k === "End" && Number.isFinite(max)) {
  e.preventDefault()
  set(max)
}
        }}
      />
      {unit ? <span className="ifm-st-u">{unit}</span> : null}
      <button type="button" className="ifm-st-b" aria-label="Increase" disabled={disabled || n >= max} onClick={() => set(n + step)}>
        <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 RulerSlider                                */
/* -------------------------------------------------------------------------- */

export type RulerMark = { value: number; label: string }

export type RulerSliderProps = {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  /** Fires when a drag ends. */
  onChangeEnd?: (value: number) => void
  min?: number
  max?: number
  /** Smallest change. Values snap to it. */
  step?: number
  /** Change for PageUp / PageDown. Default: a tenth of the range, snapped to `step`. */
  pageStep?: number
  /** Distance between labelled ticks. Default: a round 1 · 2 · 5 step giving about five labels. */
  majorStep?: number
  /** Distance between minor ticks. Default: a fifth (or quarter) of the major step. */
  minorStep?: number
  /** Mono unit after the live readout. */
  unit?: string
  /** Formats the readout and `aria-valuetext`. Default: the number with the step's decimals. */
  format?: (value: number) => string
  /** Formats the labels on the ruler. Default: the plain number. */
  tickLabel?: (value: number) => string
  /** Named positions above the ruler, e.g. `{ value: 0.7, label: "default" }`. Click one to jump there. */
  marks?: RulerMark[]
  /** Hide the big readout when the value is shown elsewhere. */
  showReadout?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}

/** A slider drawn as a ruler: minor and major ticks with mono labels, a signal tick as the thumb and a live readout. */
export function RulerSlider({
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  pageStep,
  majorStep,
  minorStep,
  unit,
  format,
  tickLabel,
  marks,
  showReadout = true,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: RulerSliderProps) {
  const f = useFieldIds(id)
  const [v, setV] = useControllable(value, defaultValue ?? min, onChange)
  const [drag, setDrag] = React.useState(false)
  const rulerRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)
  const latest = React.useRef(v)
  const dec = Math.max(decimalsOf(step), decimalsOf(min))
  const fmt = format ?? ((n: number) => n.toFixed(dec))
  const range = max - min || 1
  const pct = clamp(((v - min) / range) * 100, 0, 100)

  const ticks = React.useMemo(() => {
    const auto = niceRuler(range)
    const major = majorStep ?? auto.major
    let minor = minorStep ?? major / auto.divisions
    if (range / minor > 240) minor = major
    const out: { at: number; major: boolean; value: number }[] = []
    const mdec = Math.max(decimalsOf(minor), decimalsOf(min))
    const count = Math.floor(range / minor + 1e-9)
    for (let i = 0; i <= count; i++) {
      const val = Number((min + i * minor).toFixed(mdec))
      const r = (val - min) / major
      out.push({ at: ((val - min) / range) * 100, major: Math.abs(r - Math.round(r)) < 1e-6, value: val })
    }
    return out
  }, [min, range, majorStep, minorStep])

  const setSnapped = (n: number) => {
    const s = snapTo(n, step, min, max)
    latest.current = s
    if (s !== v) setV(s)
  }
  const fromX = (x: number) => {
    const r = rulerRef.current?.getBoundingClientRect()
    if (!r || !r.width) return v
    return min + clamp((x - r.left) / r.width, 0, 1) * range
  }

  const big = pageStep ?? Math.max(step, snapTo(range / 10, step, 0, Infinity))
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key
    let n: number | null = null
    if (k === "ArrowRight" || k === "ArrowUp") n = v + step
    else if (k === "ArrowLeft" || k === "ArrowDown") n = v - step
    else if (k === "PageUp") n = v + big
    else if (k === "PageDown") n = v - big
    else if (k === "Home") n = min
    else if (k === "End") n = max
    if (n !== null) {
      e.preventDefault()
      setSnapped(n)
    }
  }

  const text = `${fmt(v)}${unit ? ` ${unit}` : ""}`

  return (
    <div className={cn("ifm ifm-rs", className)} data-drag={drag || undefined} data-disabled={disabled || undefined}>
      <Css />
      {showReadout ? (
        <div className="ifm-rs-read" aria-hidden="true">
          <span className="ifm-rs-val">{fmt(v)}</span>
          {unit ? <span className="ifm-rs-unit">{unit}</span> : null}
        </div>
      ) : null}
      {marks?.length ? (
        <div className="ifm-rs-marks">
          {marks.map((m) => (
            <button
              key={`${m.value}-${m.label}`}
              type="button"
              className="ifm-rs-mark"
              style={{ left: `${clamp(((m.value - min) / range) * 100, 0, 100)}%` }}
              aria-label={`Set to ${m.label} (${fmt(m.value)}${unit ? ` ${unit}` : ""})`}
              disabled={disabled}
              onClick={() => (setSnapped(m.value), onChangeEnd?.(snapTo(m.value, step, min, max)))}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
      <div
        ref={rulerRef}
        className="ifm-rs-ruler"
        onPointerDown={(e) => {
          if (disabled || e.button !== 0) return
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          dragging.current = true
          setDrag(true)
          thumbRef.current?.focus()
          setSnapped(fromX(e.clientX))
        }}
        onPointerMove={(e) => {
          if (dragging.current) setSnapped(fromX(e.clientX))
        }}
        onPointerUp={() => {
          if (!dragging.current) return
          dragging.current = false
          setDrag(false)
          onChangeEnd?.(latest.current)
        }}
        onPointerCancel={() => {
          dragging.current = false
          setDrag(false)
        }}
      >
        <div className="ifm-rs-ticks" aria-hidden="true">
          <i className="ifm-rs-base" style={{ display: "block" }} />
          <i className="ifm-rs-fill" style={{ display: "block", width: `${pct}%` }} />
          {ticks.map((t) => (
            <i key={t.value} className="ifm-rs-t" data-major={t.major || undefined} style={{ left: `${t.at}%` }}>
              {t.major ? <b>{tickLabel ? tickLabel(t.value) : String(Number(t.value.toFixed(8)))}</b> : null}
            </i>
          ))}
        </div>
        <div
          ref={thumbRef}
          id={f.id}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-valuetext={text}
          aria-orientation="horizontal"
          aria-disabled={disabled || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : f.labelId}
          aria-describedby={f.descId}
          className="ifm-rs-thumb"
          style={{ left: `${pct}%` }}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 FormSection                                */
/* -------------------------------------------------------------------------- */

export type FormSectionProps = {
  /** Mono label above the title, e.g. "02 · Model". */
  label?: string
  /** Serif title. Wrap one word in <em> for the italic. */
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  id?: string
  children: React.ReactNode
}

/** A titled group of fields behind a hairline rule: label-left / controls-right when wide, stacked when narrow. */
export function FormSection({ label, title, description, className, id, children }: FormSectionProps) {
  const auto = React.useId()
  const titleId = `${auto}-t`
  return (
    <section id={id} className={cn("ifm ifm-fs", className)} aria-labelledby={titleId}>
      <Css />
      <div className="ifm-fs-grid">
        <header className="ifm-fs-head">
          {label ? <span className="ifm-lab">{label}</span> : null}
          <h2 id={titleId} className="ifm-fs-title">
            {title}
          </h2>
          {description ? <p className="ifm-fs-desc">{description}</p> : null}
        </header>
        <div className="ifm-fs-body">{children}</div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   SaveBar                                  */
/* -------------------------------------------------------------------------- */

export type SaveBarProps = {
  /** Number of unsaved changes. The bar is shown while it is above zero. */
  changes?: number
  /** Use instead of `changes` when you do not count: shows "Unsaved changes". */
  dirty?: boolean
  onSave?: () => void
  onDiscard?: () => void
  /** Disables the buttons and shows "Saving…". */
  saving?: boolean
  saveLabel?: string
  discardLabel?: string
  /** Quiet text after the count, e.g. "Applies to new runs only". */
  message?: React.ReactNode
  className?: string
}

/** Sticky bar that scans in at the bottom of the form while there is something to save: "3 changes · Discard · Save". */
export function SaveBar({
  changes,
  dirty,
  onSave,
  onDiscard,
  saving,
  saveLabel = "Save",
  discardLabel = "Discard",
  message,
  className,
}: SaveBarProps) {
  const count = changes ?? (dirty ? 1 : 0)
  const open = count > 0
  const [shown, setShown] = React.useState(count)
  if (count > 0 && count !== shown) setShown(count)
  const label = changes === undefined ? "Unsaved changes" : `${shown} change${shown === 1 ? "" : "s"}`
  return (
    <div className={cn("ifm ifm-sb", className)} role="region" aria-label="Unsaved changes" data-open={open || undefined}>
      <Css />
      <span className="ifm-sb-dot" aria-hidden="true" />
      <div className="ifm-sb-msg" aria-live="polite">
        <span className="ifm-sb-n">{open ? label : ""}</span>
        {message ? <span className="ifm-sb-sub">{message}</span> : null}
      </div>
      <div className="ifm-sb-act">
        <button type="button" className="ifm-btn" data-kind="ghost" disabled={saving} onClick={onDiscard}>
          {discardLabel}
        </button>
        <button type="button" className="ifm-btn" data-kind="primary" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  )
}
