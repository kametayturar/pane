"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SharePerson = {
  id: string
  name: string
  /** Small, pre-sized image. Without it the avatar is a soft gradient with initials. */
  avatar?: string
}

export type ShareAccessOption = {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

export type ShareChannel = {
  id: string
  label: string
  icon: React.ReactNode
  /** Shown once `onChannel` resolves. Keep it about as long as `label`. */
  doneLabel?: string
}

export type ShareSubmission = {
  people: SharePerson[]
  access: string
}

export type ShareSheetProps = {
  /** Name of the thing being shared. Shown as Share "title". */
  title: string
  /** The URL shown in the link row and written to the clipboard by Copy. */
  link: string
  /** Recent people. Picking one flies its avatar up into the Send to row. */
  people: SharePerson[]
  /** Access levels, shown in a listbox under the link. */
  access: ShareAccessOption[]
  channels?: ShareChannel[]
  /** Starting access value. Defaults to the first entry in `access`. */
  defaultAccess?: string
  /** Receives who it was sent to. A returned promise holds the sending state; a rejection keeps the panel open with an error. */
  onSend?: (submission: ShareSubmission) => void | Promise<unknown>
  /** Called with the channel id. A promise holds that button's pending state; a rejection shows Failed on it. */
  onChannel?: (channel: string) => void | Promise<unknown>
  /** Called after the link is copied, with the access level it was copied under. */
  onCopy?: (access: string) => void
  /** Trigger button text. */
  label?: string
  /** Which edge of the button stays put while the panel grows. */
  align?: "start" | "end" | "center"
  /** Up to 520px wide the panel opens as a bottom sheet over a dimmed backdrop. */
  sheetOnPhones?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ss {
  --ss-ink: #000; --ss-surface: #fff; --ss-accent: #0060e2; --ss-ok: #1f9d55;
  --ss-t1: color-mix(in oklab, var(--ss-ink) 88%, transparent);
  --ss-t2: color-mix(in oklab, var(--ss-ink) 61%, transparent);
  --ss-t3: color-mix(in oklab, var(--ss-ink) 45%, transparent);
  --ss-t4: color-mix(in oklab, var(--ss-ink) 27%, transparent);
  --ss-fill: color-mix(in oklab, var(--ss-ink) 5%, transparent);
  --ss-line: color-mix(in oklab, var(--ss-ink) 7%, transparent);
  --ss-btn: oklch(.15 0 0); --ss-btn-fg: #fff;
  --ss-shadow: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045), 0 0 0 .5px rgb(0 0 0 / .05);
  --ss-ease: cubic-bezier(.22, 1, .36, 1);
  font-family: var(--ss-font, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif); font-size: 14px; line-height: 20px; color: var(--ss-t1);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ss {
  --ss-ink: #fff; --ss-surface: #1c1c1e; --ss-accent: #4d8dff; --ss-ok: #34c26e;
  --ss-t1: color-mix(in oklab, var(--ss-ink) 90%, transparent);
  --ss-t2: color-mix(in oklab, var(--ss-ink) 62%, transparent);
  --ss-t3: color-mix(in oklab, var(--ss-ink) 46%, transparent);
  --ss-t4: color-mix(in oklab, var(--ss-ink) 28%, transparent);
  --ss-fill: color-mix(in oklab, var(--ss-ink) 8%, transparent);
  --ss-line: color-mix(in oklab, var(--ss-ink) 9%, transparent);
  --ss-btn: #f2f2f4; --ss-btn-fg: #111;
  --ss-shadow: 0 20px 48px 0 rgb(0 0 0 / .5), 0 3px 10px 0 rgb(0 0 0 / .3), 0 0 0 .5px rgb(255 255 255 / .1);
}
@layer base { .ss { position: relative; display: inline-block; vertical-align: top } }
.ss *, .ss *::before, .ss *::after { box-sizing: border-box }
:where(.ss) :is(button, input) { font: inherit; color: inherit; margin: 0 }
:where(.ss) button { background: none; border: 0; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation }
.ss :focus-visible { outline: 2px solid color-mix(in oklab, var(--ss-accent) 60%, transparent); outline-offset: 1px }
.ss[data-open="true"] { z-index: 60 }
.ss-ghost { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 12px; font-weight: 500; visibility: hidden; white-space: nowrap }
.ss-ghost svg { width: 16px; height: 16px }
.ss-shape {
  position: absolute; top: 0; right: 0; overflow: hidden; contain: layout paint; border-radius: 18px;
  box-shadow: var(--ss-shadow); transition: transform .2s var(--ss-ease); transform-origin: 100% 0;
}
.ss[data-align="start"] .ss-shape { right: auto; left: 0; transform-origin: 0 0 }
.ss[data-align="center"] .ss-shape { right: auto; left: 50%; translate: -50% 0; transform-origin: 50% 0 }
.ss-bg { position: absolute; inset: 0; background: var(--ss-btn); border-radius: inherit }
.ss-surf { position: absolute; inset: 0; background: var(--ss-surface); opacity: var(--ss-open, 0); border-radius: inherit }
.ss-shape:has(.ss-trigger:active) { transform: scale(.96) }
.ss-trigger {
  position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 14px 0 12px;
  color: var(--ss-btn-fg); font-weight: 500; white-space: nowrap; border-radius: inherit; transition: opacity .2s var(--ss-ease), filter .2s var(--ss-ease);
}
.ss-trigger svg { width: 16px; height: 16px }
.ss[data-float="true"][data-view="panel"] .ss-trigger, .ss[data-float="true"][data-view="sent"] .ss-trigger { opacity: 0; filter: blur(3px); pointer-events: none }
.ss-face { position: absolute; top: 0; left: 0; padding: 8px; animation-fill-mode: backwards }
.ss-face[data-kind="pop"] { animation: ss-pop .34s var(--ss-ease) }
.ss-face[data-kind="r"] { animation: ss-in-r .4s var(--ss-ease) }
.ss-face[data-kind="l"] { animation: ss-in-l .4s var(--ss-ease) }
.ss-face[data-leaving="l"] { animation: ss-out-l .24s var(--ss-ease) forwards; pointer-events: none }
.ss-face[data-leaving="r"] { animation: ss-out-r .24s var(--ss-ease) forwards; pointer-events: none }
.ss-face[data-leaving="fold"] { animation: ss-fold .18s ease-out forwards; pointer-events: none }
@keyframes ss-pop { from { opacity: 0; transform: scale(.97); filter: blur(3px) } }
@keyframes ss-in-r { from { opacity: 0; transform: translateX(28px) scale(.98); filter: blur(3px) } }
@keyframes ss-in-l { from { opacity: 0; transform: translateX(-28px) scale(.98); filter: blur(3px) } }
@keyframes ss-out-l { to { opacity: 0; transform: translateX(-28px) scale(.98); filter: blur(3px) } }
@keyframes ss-out-r { to { opacity: 0; transform: translateX(28px) scale(.98); filter: blur(3px) } }
@keyframes ss-fold { to { opacity: 0; filter: blur(3px) } }
.ss-panel { width: min(var(--share-sheet-width, 24rem), calc(100vw - 2rem)) }
.ss-sentface { width: min(19rem, calc(100vw - 2rem)) }
.ss-body { position: relative; display: flex; flex-direction: column; gap: 12px }
.ss-flyers { position: absolute; inset: 0; pointer-events: none; z-index: 4 }
.ss-flyer { position: absolute; border-radius: 50%; overflow: hidden; will-change: transform; box-shadow: 0 6px 16px rgb(0 0 0 / .25) }
.ss-head { display: flex; align-items: center; gap: 8px; height: 36px; padding-left: 8px }
.ss-title { flex: 1; min-width: 0; margin: 0; font-size: 16px; font-weight: 500; line-height: 22px; color: var(--ss-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ss-iconbtn { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--ss-t2); flex: none; transition: background-color .15s, color .15s }
.ss-iconbtn svg { width: 16px; height: 16px }
@media (hover: hover) and (pointer: fine) { .ss-iconbtn:hover { background: var(--ss-fill); color: var(--ss-t1) } }
.ss-group { border-radius: 20px; background: color-mix(in oklab, var(--ss-fill) 70%, transparent); box-shadow: inset 0 0 0 1px var(--ss-line); overflow: hidden }
.ss-linkrow { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 6px 0 14px }
.ss-linkrow > svg { width: 16px; height: 16px; flex: none; color: var(--ss-t3) }
.ss-link { flex: 1; min-width: 0; color: var(--ss-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ss-copy { position: relative; display: grid; place-items: center; height: 34px; padding: 0 12px; border-radius: 999px; background: var(--ss-surface); font-weight: 500; box-shadow: 0 1px 2px rgb(0 0 0 / .035), inset 0 0 0 1px var(--ss-line); transition: transform .15s var(--ss-ease) }
.ss-copy:active { transform: scale(.96) }
.ss-swap { display: grid; grid-area: 1 / 1; align-items: center; justify-content: center; gap: 6px; grid-auto-flow: column; white-space: nowrap }
.ss-swap[data-on="false"] { opacity: 0; filter: blur(3px); transform: scale(.9); pointer-events: none }
.ss-swap { transition: opacity .22s var(--ss-ease), filter .22s var(--ss-ease), transform .3s var(--ss-ease) }
.ss-swap svg { width: 14px; height: 14px }
.ss-swap[data-tone="ok"] { color: var(--ss-ok) }
.ss-swap[data-tone="bad"] { color: #d93036 }
.ss-trig { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 52px; padding: 6px 14px; text-align: left; border-top: 1px solid var(--ss-line) }
.ss-trig > svg:first-child { width: 16px; height: 16px; flex: none; color: var(--ss-t2) }
.ss-lines { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px }
.ss-l1 { font-weight: 500; line-height: 20px; color: var(--ss-t1) }
.ss-l2 { font-size: 12px; line-height: 16px; color: var(--ss-t3) }
.ss-chev { width: 16px; height: 16px; flex: none; color: var(--ss-t3); transition: transform .3s var(--ss-ease) }
.ss-trig[aria-expanded="true"] .ss-chev { transform: rotate(180deg) }
.ss-list { display: flex; flex-direction: column; padding: 4px; border-top: 1px solid var(--ss-line); animation: ss-list .3s var(--ss-ease) backwards }
@keyframes ss-list { from { opacity: 0; transform: translateY(-4px); filter: blur(2px) } }
.ss-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 16px; text-align: left; transition: background-color .15s }
.ss-opt > svg:first-child { width: 16px; height: 16px; flex: none; color: var(--ss-t2) }
.ss-opt .ss-tick { width: 16px; height: 16px; flex: none; color: var(--ss-t1); opacity: 0 }
.ss-opt[aria-selected="true"] .ss-tick { opacity: 1 }
@media (hover: hover) and (pointer: fine) { .ss-opt:hover { background: var(--ss-fill) } }
.ss-channels { display: flex; gap: 6px }
.ss-chan { position: relative; flex: 1 1 0; min-width: 0; display: grid; place-items: center; height: 40px; padding: 0 8px; border-radius: 999px; font-weight: 500; box-shadow: inset 0 0 0 1px var(--ss-line); transition: background-color .15s, transform .15s var(--ss-ease) }
.ss-chan:active { transform: scale(.97) }
.ss-chan[aria-busy="true"] { pointer-events: none }
.ss-chan .ss-swap svg, .ss-chan .ss-swap .ss-ci { width: 16px; height: 16px; display: inline-grid; place-items: center; flex: none }
.ss-chan .ss-swap svg { width: 16px; height: 16px }
@media (hover: hover) and (pointer: fine) { .ss-chan:hover { background: var(--ss-fill) } }
.ss-divider { height: 1px; margin: 0 6px; background: var(--ss-line) }
.ss-to { display: flex; flex-direction: column; gap: 6px }
.ss-sec { padding-left: 8px; font-size: 12px; line-height: 17px; color: var(--ss-t3) }
.ss-torow { position: relative; height: 36px; display: flex; align-items: center }
.ss-ph { padding-left: 8px; color: var(--ss-t3); animation: ss-fadein .25s var(--ss-ease) backwards }
@keyframes ss-fadein { from { opacity: 0 } }
.ss-chips { display: flex; align-items: center; gap: 6px; list-style: none; margin: 0; padding: 0 4px; width: 100%; overflow-x: auto; scrollbar-width: none }
.ss-chips::-webkit-scrollbar { display: none }
.ss-chip { position: relative; flex: none; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 4px; animation: ss-chip .34s var(--ss-ease) backwards }
.ss-chip[data-leaving="true"] { animation: ss-chip-out .16s ease-in forwards; pointer-events: none }
@keyframes ss-chip { from { opacity: 0; transform: scale(.86) } }
@keyframes ss-chip-out { to { opacity: 0; transform: scale(.86) } }
.ss-chipfill { position: absolute; inset: 0; border-radius: 999px; background: var(--ss-fill) }
.ss-chip > :not(.ss-chipfill) { position: relative }
.ss-chipname { font-weight: 500; font-size: 13px }
.ss-chip .ss-av { width: 24px; height: 24px; font-size: 10px }
.ss-chip[data-flying="true"] .ss-av { opacity: 0 }
.ss-chipx { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; color: var(--ss-t3) }
.ss-chipx svg { width: 12px; height: 12px }
@media (hover: hover) and (pointer: fine) { .ss-chipx:hover { color: var(--ss-t1); background: var(--ss-fill) } }
.ss-recents { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; margin: 0 -2px; padding: 4px 2px 2px }
.ss-recents::-webkit-scrollbar { display: none }
.ss-person { position: relative; flex: 1 0 64px; min-width: 64px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 2px 6px; border-radius: 18px; font-size: 12px; line-height: 17px; color: var(--ss-t2); transition: background-color .2s, color .2s }
.ss-person[aria-pressed="true"] { color: var(--ss-t1); background: color-mix(in oklab, var(--ss-ink) 5%, transparent) }
@media (hover: hover) and (pointer: fine) { .ss-person:hover { background: var(--ss-fill) } }
.ss-avwrap { position: relative; width: 40px; height: 40px; border-radius: 50%; transition: box-shadow .25s var(--ss-ease) }
.ss-person[aria-pressed="true"] .ss-avwrap { box-shadow: 0 0 0 2px var(--ss-surface), 0 0 0 4px var(--ss-btn) }
.ss-av { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; font-size: 14px; font-weight: 600; color: #fff; letter-spacing: .01em; user-select: none; flex: none }
.ss-av img { width: 100%; height: 100%; object-fit: cover; display: block }
.ss-badge { position: absolute; right: -4px; bottom: -4px; width: 6px; height: 6px; border-radius: 50%; background: var(--ss-btn); color: var(--ss-btn-fg); box-shadow: 0 0 0 2px var(--ss-surface); display: grid; place-items: center; opacity: 0; transform: scale(.4); transition: opacity .2s, transform .35s var(--ss-ease), width .3s var(--ss-ease), height .3s var(--ss-ease) }
.ss-badge svg { width: 10px; height: 10px; stroke-width: 3 }
.ss-person[aria-pressed="true"] .ss-badge { opacity: 1; transform: none; width: 16px; height: 16px }
.ss-send { position: relative; display: grid; place-items: center; width: 100%; height: 44px; border-radius: 999px; background: var(--ss-btn); color: var(--ss-btn-fg); font-weight: 500; transition: background-color .25s var(--ss-ease), color .25s, transform .15s var(--ss-ease) }
.ss-send:active { transform: scale(.985) }
.ss-send[aria-disabled="true"] { background: var(--ss-fill); color: var(--ss-t3) }
.ss-send[aria-busy="true"] { pointer-events: none }
.ss-sendin { display: inline-flex; align-items: center; gap: 8px }
.ss-roll { position: relative; display: inline-block; overflow: hidden; height: 20px; vertical-align: top; font-variant-numeric: tabular-nums }
.ss-roll span { display: block; animation: ss-roll-up .32s var(--ss-ease) backwards }
.ss-roll[data-dir="-1"] span { animation-name: ss-roll-dn }
@keyframes ss-roll-up { from { opacity: 0; transform: translateY(70%); filter: blur(2px) } }
@keyframes ss-roll-dn { from { opacity: 0; transform: translateY(-70%); filter: blur(2px) } }
.ss-err { margin: -4px 0 0; padding: 0 8px; font-size: 12px; line-height: 16px; color: #d93036; animation: ss-fadein .25s backwards }
:is(.dark, [data-theme="dark"]) .ss-err, :is(.dark, [data-theme="dark"]) .ss-swap[data-tone="bad"] { color: #ff6b6f }
.ss-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid color-mix(in oklab, currentColor 28%, transparent); border-top-color: currentColor; animation: ss-rot .7s linear infinite }
@keyframes ss-rot { to { transform: rotate(360deg) } }
.ss-sent { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px 4px; text-align: center }
.ss-stack { position: relative; display: flex; margin-bottom: 8px; animation: ss-pop .5s var(--ss-ease) .05s backwards }
.ss-stack .ss-av { width: 36px; height: 36px; font-size: 13px; box-shadow: 0 0 0 2px var(--ss-surface) }
.ss-stack .ss-av + .ss-av { margin-left: -10px }
.ss-okbadge { position: absolute; right: -8px; bottom: -4px; width: 18px; height: 18px; border-radius: 50%; background: var(--ss-ok); color: #fff; display: grid; place-items: center; box-shadow: 0 0 0 2px var(--ss-surface) }
.ss-okbadge svg { width: 11px; height: 11px }
.ss-okbadge path { stroke-dasharray: 20; stroke-dashoffset: 20; animation: ss-draw .4s .25s var(--ss-ease) forwards }
@keyframes ss-draw { to { stroke-dashoffset: 0 } }
.ss-stitle { font-weight: 500; color: var(--ss-t1); max-width: 100% }
.ss-ssub { font-size: 12px; line-height: 16px; color: var(--ss-t3); max-width: 100% }
.ss-sbtns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; width: 100% }
.ss-sbtns button { height: 40px; border-radius: 999px; font-weight: 500; transition: background-color .15s, transform .15s var(--ss-ease) }
.ss-sbtns button:active { transform: scale(.97) }
.ss-undo { box-shadow: inset 0 0 0 1px var(--ss-line) }
@media (hover: hover) and (pointer: fine) { .ss-undo:hover { background: var(--ss-fill) } }
.ss-done { background: var(--ss-btn); color: var(--ss-btn-fg) }
.ss-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* bottom sheet on phones */
.ss-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgb(0 0 0 / .35); animation: ss-fadein .3s ease backwards }
.ss-backdrop[data-closing="true"] { animation: ss-fadeout .26s ease forwards }
.ss-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1001; max-height: calc(100dvh - 24px); overflow: auto; border-radius: 28px 28px 0 0; background: var(--ss-surface); box-shadow: 0 -10px 40px rgb(0 0 0 / .18); padding: 0 8px max(8px, env(safe-area-inset-bottom)); animation: ss-sheet-in .46s var(--ss-ease) backwards; will-change: transform; overscroll-behavior: contain }
.ss-sheet[data-closing="true"] { animation: ss-sheet-out .28s var(--ss-ease) forwards }
.ss-sheet[data-settle="true"] { transition: transform .35s var(--ss-ease) }
.ss-sheet .ss-panel, .ss-sheet .ss-sentface { width: auto }
.ss-grab { display: grid; place-items: center; height: 22px; margin: 0 -8px; cursor: grab; touch-action: none }
.ss-grab::before { content: ""; width: 36px; height: 5px; border-radius: 999px; background: var(--ss-t4) }
@keyframes ss-sheet-in { from { transform: translateY(100%) } }
@keyframes ss-sheet-out { to { transform: translateY(100%) } }
@keyframes ss-fadeout { to { opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  .ss *, .ss *::before, .ss *::after { animation-duration: .01ms !important; animation-delay: 0s !important; transition-duration: .01ms !important }
  .ss-shape:has(.ss-trigger:active) { transform: none }
  .ss-spin { animation: ss-rot 1.6s linear infinite !important; animation-duration: 1.6s !important }
  .ss-face[data-kind], .ss-sheet, .ss-backdrop { animation: ss-fadein .15s linear backwards !important; animation-duration: .15s !important }
  .ss-face[data-leaving], .ss-sheet[data-closing], .ss-backdrop[data-closing] { animation: ss-fadeout .12s linear forwards !important; animation-duration: .12s !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Springs                                  */
/* -------------------------------------------------------------------------- */

type Spr = { x: number; v: number; to: number; k: number; c: number }
const mk = (x: number): Spr => ({ x, v: 0, to: x, k: 300, c: 30 })
function tune(s: Spr, k: number, zeta: number) {
  s.k = k
  s.c = 2 * zeta * Math.sqrt(k)
}
function step(s: Spr, dt: number) {
  let t = dt
  while (t > 0) {
    const h = Math.min(t, 1 / 240)
    s.v += (s.k * (s.to - s.x) - s.c * s.v) * h
    s.x += s.v * h
    t -= h
  }
}
const at = (s: Spr, e = 0.05) => Math.abs(s.to - s.x) < e && Math.abs(s.v) < e * 6

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const I = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
)
const ShareIcon = () => (
  <I>
    <path d="M12 3v12M8 7l4-4 4 4M5 12v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6" />
  </I>
)
const CloseIcon = () => (
  <I>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
)
const LinkIcon = () => (
  <I>
    <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
  </I>
)
const ChevronDown = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="m6 9 6 6 6-6" />
  </I>
)
const CheckIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </I>
)
const CopyIcon = () => (
  <I>
    <rect x="9" y="9" width="11" height="11" rx="3" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </I>
)

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function hue(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 360
}
function Avatar({ person, className }: { person: SharePerson; className?: string }) {
  const h = hue(person.id + person.name)
  const initials = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <span
      className={cn("ss-av", className)}
      aria-hidden="true"
      style={person.avatar ? undefined : { background: `linear-gradient(145deg, oklch(.72 .13 ${h}), oklch(.55 .16 ${(h + 40) % 360}))` }}
    >
      {person.avatar ? <img src={person.avatar} alt="" width={40} height={40} /> : initials}
    </span>
  )
}
function namesOf(list: SharePerson[]) {
  const n = list.map((p) => p.name.split(" ")[0])
  if (n.length <= 1) return n[0] ?? ""
  if (n.length === 2) return `${n[0]} and ${n[1]}`
  if (n.length === 3) return `${n[0]}, ${n[1]} and ${n[2]}`
  return `${n[0]}, ${n[1]} and ${n.length - 2} others`
}
function Roll({ value }: { value: number }) {
  const [prev, setPrev] = React.useState(value)
  const [dir, setDir] = React.useState<1 | -1>(1)
  if (prev !== value) {
    setDir(value > prev ? 1 : -1)
    setPrev(value)
  }
  return (
    <span className="ss-roll" data-dir={dir}>
      <span key={value}>{value}</span>
    </span>
  )
}

type View = "button" | "panel" | "sent"
type FaceEntry = { key: number; view: "panel" | "sent"; kind: "pop" | "r" | "l"; leaving?: "l" | "r" | "fold" }
type ChanState = "idle" | "pending" | "done" | "failed"

const PHONE = "(max-width: 520px)"
const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function ShareSheet({
  title,
  link,
  people,
  access,
  channels = [],
  defaultAccess,
  onSend,
  onChannel,
  onCopy,
  label = "Share",
  align = "end",
  sheetOnPhones = true,
  className,
}: ShareSheetProps) {
  const uid = React.useId()
  const phoneNow = React.useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false)
  const phone = sheetOnPhones && phoneNow
  const [view, setView] = React.useState<View>("button")
  const [closing, setClosing] = React.useState(false)
  const [accessValue, setAccessValue] = React.useState(defaultAccess ?? access[0]?.value ?? "")
  const [accessOpen, setAccessOpen] = React.useState(false)
  const [picked, setPicked] = React.useState<string[]>([])
  const [leavingChips, setLeavingChips] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState(false)
  const [chan, setChan] = React.useState<Record<string, ChanState>>({})
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sentTo, setSentTo] = React.useState<SharePerson[]>([])
  const [announce, setAnnounce] = React.useState("")
  const [faces, setFaces] = React.useState<FaceEntry[]>([])
  const keyRef = React.useRef(0)
  const viewRef = React.useRef<View>("button")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const shapeRef = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLSpanElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const reduced = React.useRef(false)
  const timers = React.useRef<number[]>([])
  const closedSize = React.useRef({ w: 92, h: 36 })
  const sim = React.useRef({ w: mk(92), h: mk(36), r: mk(18), open: mk(0), raf: 0, last: 0 })
  const flights = React.useRef<Record<string, DOMRect>>({})

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }

  const current = access.find((a) => a.value === accessValue) ?? access[0]
  const pickedPeople = picked.map((id) => people.find((p) => p.id === id)).filter(Boolean) as SharePerson[]

  /* ---- spring loop ---- */
  const paint = React.useCallback(() => {
    const s = sim.current
    const el = shapeRef.current
    if (!el) return
    el.style.width = `${s.w.x.toFixed(2)}px`
    el.style.height = `${s.h.x.toFixed(2)}px`
    el.style.borderRadius = `${Math.max(0, s.r.x).toFixed(2)}px`
    el.style.setProperty("--ss-open", Math.min(1, Math.max(0, s.open.x)).toFixed(3))
  }, [])
  const tick = React.useCallback(
    (now: number) => {
      const s = sim.current
      const dt = Math.min(0.05, Math.max(0.001, (now - s.last) / 1000 || 0.016))
      s.last = now
      for (const k of [s.w, s.h, s.r, s.open]) step(k, dt)
      paint()
      if ([s.w, s.h, s.r].every((k) => at(k)) && at(s.open, 0.004)) {
        s.raf = 0
        return
      }
      s.raf = requestAnimationFrame(tick)
    },
    [paint],
  )
  const retarget = React.useCallback(
    (w: number, h: number, r: number, open: number, growing: boolean) => {
      const s = sim.current
      for (const k of [s.w, s.h, s.r]) {
        if (growing) tune(k, 320, 0.74)
        else tune(k, 400, 1)
      }
      tune(s.open, 260, 1)
      s.w.to = w
      s.h.to = h
      s.r.to = r
      s.open.to = open
      if (reduced.current) {
        s.w.x = w; s.h.x = h; s.r.x = r; s.open.x = open
        s.w.v = s.h.v = s.r.v = s.open.v = 0
        paint()
        return
      }
      if (!s.raf) {
        s.last = performance.now()
        s.raf = requestAnimationFrame(tick)
      }
    },
    [paint, tick],
  )

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => (reduced.current = mq.matches)
    on()
    mq.addEventListener("change", on)
    const sm = sim.current
    const ts = timers.current
    return () => {
      mq.removeEventListener("change", on)
      cancelAnimationFrame(sm.raf)
      sm.raf = 0
      ts.forEach(clearTimeout)
    }
  }, [])

  // The closed shape follows the (invisible) ghost button, which also reserves the layout space.
  React.useLayoutEffect(() => {
    const el = ghostRef.current
    if (!el) return
    const m = () => {
      closedSize.current = { w: el.offsetWidth, h: el.offsetHeight }
      if (viewRef.current === "button") {
        const s = sim.current
        s.w.x = s.w.to = el.offsetWidth
        s.h.x = s.h.to = el.offsetHeight
        s.r.x = s.r.to = el.offsetHeight / 2
        paint()
      }
    }
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [label, paint])

  /* ---- face navigation ---- */
  const go = React.useCallback((next: View) => {
    const prev = viewRef.current
    viewRef.current = next
    setView(next)
    setFaces((cur) => {
      const alive = cur.filter((f) => !f.leaving)
      const dir: "l" | "r" | "fold" = next === "button" ? "fold" : next === "sent" ? "l" : "r"
      const out = alive.map((f) => ({ ...f, leaving: dir }))
      if (next === "button") return [...cur.filter((f) => f.leaving), ...out]
      const kind: FaceEntry["kind"] = prev === "button" ? "pop" : next === "sent" ? "r" : "l"
      return [...cur.filter((f) => f.leaving), ...out, { key: ++keyRef.current, view: next, kind }]
    })
    later(() => setFaces((cur) => cur.filter((f) => !f.leaving)), 340)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeAll = React.useCallback(
    (focus = true) => {
      if (viewRef.current === "button") return
      setAccessOpen(false)
      const done = () => {
        go("button")
        setClosing(false)
        retarget(closedSize.current.w, closedSize.current.h, closedSize.current.h / 2, 0, false)
        if (focus) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }))
      }
      if (phone) {
        setClosing(true)
        later(done, reduced.current ? 100 : 280)
      } else done()
    },
    [go, retarget, phone],
  )

  const open = () => {
    setError(null)
    if (phone) {
      viewRef.current = "panel"
      setView("panel")
      return
    }
    go("panel")
  }

  const onSize = React.useCallback(
    (w: number, h: number) => {
      if (viewRef.current === "button") return
      retarget(w, h, 28, 1, true)
    },
    [retarget],
  )

  // Press outside closes the floating panel without stealing focus.
  React.useEffect(() => {
    if (view === "button" || phone) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeAll(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [view, phone, closeAll])

  /* ---- actions ---- */
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(link)
    } catch {
      /* the visual confirmation still runs – clipboard can be blocked in iframes */
    }
    onCopy?.(accessValue)
    setCopied(true)
    setAnnounce(`Link copied, ${current?.label ?? ""}`)
    later(() => setCopied(false), 1600)
  }

  const togglePerson = (id: string, avatarEl: HTMLElement | null) => {
    if (picked.includes(id)) {
      removePerson(id)
      return
    }
    if (avatarEl && !reduced.current) flights.current[id] = avatarEl.getBoundingClientRect()
    setPicked((p) => [...p, id])
    setError(null)
    setAnnounce(`${people.find((p) => p.id === id)?.name} added`)
  }
  const removePerson = (id: string) => {
    setLeavingChips((l) => [...l, id])
    setAnnounce(`${people.find((p) => p.id === id)?.name} removed`)
    later(
      () => {
        setPicked((p) => p.filter((x) => x !== id))
        setLeavingChips((l) => l.filter((x) => x !== id))
      },
      reduced.current ? 0 : 150,
    )
  }

  const runChannel = async (c: ShareChannel) => {
    setChan((s) => ({ ...s, [c.id]: "pending" }))
    try {
      await onChannel?.(c.id)
      setChan((s) => ({ ...s, [c.id]: "done" }))
      setAnnounce(`${c.label}: ${c.doneLabel ?? "Done"}`)
    } catch {
      setChan((s) => ({ ...s, [c.id]: "failed" }))
      setAnnounce(`${c.label}: failed`)
    }
    later(() => setChan((s) => ({ ...s, [c.id]: "idle" })), 2000)
  }

  const [shakeKey, setShakeKey] = React.useState(0)
  const send = async () => {
    if (sending) return
    if (!picked.length) {
      setShakeKey((k) => k + 1)
      setAnnounce("Pick at least one person to send to")
      return
    }
    setSending(true)
    setError(null)
    const who = pickedPeople
    try {
      await onSend?.({ people: who, access: accessValue })
    } catch {
      setSending(false)
      setError("Couldn't send. Check your connection and try again.")
      return
    }
    setSending(false)
    setSentTo(who)
    setAnnounce(`Sent to ${namesOf(who)}`)
    setAccessOpen(false)
    if (phone) {
      viewRef.current = "sent"
      setView("sent")
    } else go("sent")
  }
  const undo = () => {
    setPicked(sentTo.map((p) => p.id))
    if (phone) {
      viewRef.current = "panel"
      setView("panel")
    } else go("panel")
  }
  const finish = () => {
    setPicked([])
    setSentTo([])
    closeAll(true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || viewRef.current === "button") return
    e.preventDefault()
    e.stopPropagation()
    if (accessOpen) setAccessOpen(false)
    else closeAll(true)
  }

  const content = (v: "panel" | "sent") => (
    <>
      {v === "panel" ? (
        <PanelBody
          idBase={uid}
          title={title}
          link={link}
          people={people}
          access={access}
          current={current}
          accessOpen={accessOpen}
          setAccessOpen={setAccessOpen}
          setAccess={(val) => {
            setAccessValue(val)
            setAccessOpen(false)
          }}
          channels={channels}
          chan={chan}
          runChannel={runChannel}
          copied={copied}
          copy={copy}
          picked={pickedPeople}
          leavingChips={leavingChips}
          togglePerson={togglePerson}
          removePerson={removePerson}
          flights={flights}
          sending={sending}
          error={error}
          send={send}
          shakeKey={shakeKey}
          onClose={() => closeAll(true)}
        />
      ) : (
        <SentBody people={sentTo} access={current} onUndo={undo} onDone={finish} />
      )}
    </>
  )

  return (
    <div
      ref={rootRef}
      className={cn("ss", className)}
      data-view={view}
      data-open={view !== "button"}
      data-align={align}
      data-float={!phone}
      onKeyDown={onKeyDown}
    >
      <style href="share-sheet" precedence="default">{CSS}</style>
      <span className="ss-ghost" ref={ghostRef} aria-hidden="true">
        <ShareIcon />
        {label}
      </span>
      <div className="ss-shape" ref={shapeRef} style={{ width: 92, height: 36, borderRadius: 18 }}>
        <span className="ss-bg" aria-hidden="true" />
        <span className="ss-surf" aria-hidden="true" />
        <button
          ref={triggerRef}
          type="button"
          className="ss-trigger"
          aria-haspopup="dialog"
          aria-expanded={view !== "button"}
          tabIndex={view === "button" || phone ? 0 : -1}
          onClick={open}
        >
          <ShareIcon />
          {label}
        </button>
        {!phone &&
          faces.map((f) => (
            <FaceShell key={f.key} entry={f} onSize={onSize} labelId={`${uid}-title`}>
              {content(f.view)}
            </FaceShell>
          ))}
      </div>
      {phone &&
        view !== "button" &&
        createPortal(
          <div className="ss" data-phone="true">
            <div className="ss-backdrop" data-closing={closing || undefined} onPointerDown={() => closeAll(true)} />
            <PhoneSheet sheetRef={sheetRef} closing={closing} labelId={`${uid}-title`} onClose={() => closeAll(true)} onKeyDown={onKeyDown} view={view}>
              {content(view === "sent" ? "sent" : "panel")}
            </PhoneSheet>
          </div>,
          document.body,
        )}
      <span className="ss-sr" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Face wrappers                               */
/* -------------------------------------------------------------------------- */

function FaceShell({ entry, onSize, children, labelId }: { entry: FaceEntry; onSize: (w: number, h: number) => void; children: React.ReactNode; labelId: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const current = !entry.leaving
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !current) return
    const m = () => onSize(el.offsetWidth, el.offsetHeight)
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [current, onSize])
  // Move focus into each new face: Copy on the panel, Done on the confirmation.
  React.useEffect(() => {
    if (!current) return
    const el = ref.current
    const t = requestAnimationFrame(() => el?.querySelector<HTMLElement>(entry.view === "panel" ? "[data-autofocus]" : "[data-done]")?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      ref={ref}
      className={cn("ss-face", entry.view === "panel" ? "ss-panel" : "ss-sentface")}
      role={current ? "dialog" : undefined}
      aria-labelledby={current && entry.view === "panel" ? labelId : undefined}
      aria-label={current && entry.view === "sent" ? "Sent" : undefined}
      data-kind={entry.leaving ? undefined : entry.kind}
      data-leaving={entry.leaving}
      aria-hidden={entry.leaving ? true : undefined}
    >
      {children}
    </div>
  )
}

function PhoneSheet({
  children, sheetRef, closing, labelId, onClose, onKeyDown, view,
}: {
  children: React.ReactNode
  sheetRef: React.RefObject<HTMLDivElement | null>
  closing: boolean
  labelId: string
  onClose: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  view: View
}) {
  const drag = React.useRef<{ y: number; t: number; dy: number } | null>(null)
  const onDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    sheetRef.current?.removeAttribute("data-settle")
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !sheetRef.current) return
    const dy = e.clientY - drag.current.y
    // Rubber band when pulled up.
    drag.current.dy = dy
    sheetRef.current.style.transform = `translateY(${dy < 0 ? dy / 6 : dy}px)`
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    const el = sheetRef.current
    if (!d || !el) return
    const v = d.dy / Math.max(1, performance.now() - d.t)
    void e
    if (d.dy > 110 || v > 0.6) onClose()
    else {
      el.setAttribute("data-settle", "true")
      el.style.transform = ""
    }
  }
  // Trap Tab inside the sheet.
  const trap = (e: React.KeyboardEvent) => {
    onKeyDown(e)
    if (e.key !== "Tab" || !sheetRef.current) return
    const f = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([aria-hidden="true"]), [tabindex="0"]')].filter((x) => x.offsetParent !== null)
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  React.useEffect(() => {
    const el = sheetRef.current
    const t = requestAnimationFrame(() => el?.querySelector<HTMLElement>(view === "sent" ? "[data-done]" : "[data-autofocus]")?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])
  return (
    <div
      ref={sheetRef}
      className="ss-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={view === "panel" ? labelId : undefined}
      aria-label={view === "sent" ? "Sent" : undefined}
      data-closing={closing || undefined}
      onKeyDown={trap}
    >
      <div className="ss-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden="true" />
      <div className={view === "sent" ? "ss-sentface" : "ss-panel"}>{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Panel body                                 */
/* -------------------------------------------------------------------------- */

type PanelProps = {
  idBase: string
  title: string
  link: string
  people: SharePerson[]
  access: ShareAccessOption[]
  current?: ShareAccessOption
  accessOpen: boolean
  setAccessOpen: (v: boolean) => void
  setAccess: (v: string) => void
  channels: ShareChannel[]
  chan: Record<string, ChanState>
  runChannel: (c: ShareChannel) => void
  copied: boolean
  copy: () => void
  picked: SharePerson[]
  leavingChips: string[]
  togglePerson: (id: string, el: HTMLElement | null) => void
  removePerson: (id: string) => void
  flights: React.RefObject<Record<string, DOMRect>>
  sending: boolean
  error: string | null
  send: () => void
  shakeKey: number
  onClose: () => void
}

function Swap({ on, tone, children }: { on: boolean; tone?: "ok" | "bad"; children: React.ReactNode }) {
  return (
    <span className="ss-swap" data-on={on} data-tone={tone} aria-hidden={on ? undefined : true}>
      {children}
    </span>
  )
}

function PanelBody(p: PanelProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const flyersRef = React.useRef<HTMLDivElement>(null)
  const torowRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [flying, setFlying] = React.useState<string[]>([])
  const [seen, setSeen] = React.useState<string[]>([])
  const pickedKey = p.picked.map((x) => x.id).join(",")

  // New chips: hide their avatar until a copy of the recent avatar has flown over.
  if (pickedKey !== seen.join(",")) {
    const added = p.picked.map((x) => x.id).filter((id) => !seen.includes(id) && p.flights.current[id])
    setSeen(p.picked.map((x) => x.id))
    if (added.length) setFlying((f) => [...f, ...added])
  }

  React.useLayoutEffect(() => {
    if (!flying.length) return
    const layer = flyersRef.current
    const body = bodyRef.current
    if (!layer || !body) return
    const base = layer.getBoundingClientRect()
    for (const id of flying) {
      const from = p.flights.current[id]
      const chip = body.querySelector<HTMLElement>(`[data-chip="${CSS_ESC(id)}"]`)
      const av = chip?.querySelector<HTMLElement>(".ss-av")
      if (!from || !chip || !av) continue
      delete p.flights.current[id]
      const to = av.getBoundingClientRect()
      const src = body.querySelector<HTMLElement>(`[data-person="${CSS_ESC(id)}"] .ss-av`)
      const fly = document.createElement("span")
      fly.className = "ss-flyer"
      fly.style.cssText = `left:${from.left - base.left}px;top:${from.top - base.top}px;width:${from.width}px;height:${from.height}px`
      if (src) fly.appendChild(src.cloneNode(true))
      layer.appendChild(fly)
      const dx = to.left - from.left, dy = to.top - from.top, sc = to.width / from.width
      const a = fly.animate(
        [
          { transform: "translate(0,0) scale(1)" },
          { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 14}px) scale(${(1 + sc) / 2 + 0.1})`, offset: 0.55 },
          { transform: `translate(${dx}px,${dy}px) scale(${sc})` },
        ],
        { duration: 420, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
      )
      const end = () => {
        fly.remove()
        setFlying((f) => f.filter((x) => x !== id))
      }
      a.onfinish = end
      a.oncancel = end
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flying.join(",")])

  // The empty Send click shakes the row.
  React.useEffect(() => {
    if (!p.shakeKey) return
    torowRef.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" },
    )
  }, [p.shakeKey])

  const onListKey = (e: React.KeyboardEvent) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    items[(i + d + items.length) % items.length]?.focus()
  }

  // Move focus into the options when the list opens.
  const wasOpen = React.useRef(false)
  React.useEffect(() => {
    if (p.accessOpen && !wasOpen.current) {
      requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
    }
    wasOpen.current = p.accessOpen
  }, [p.accessOpen])

  const n = p.picked.length
  const pickedIds = new Set(p.picked.map((x) => x.id))

  return (
    <div className="ss-body" ref={bodyRef} aria-busy={p.sending || undefined}>
      <div className="ss-flyers" ref={flyersRef} aria-hidden="true" />
      <div className="ss-head">
        <p className="ss-title" id={`${p.idBase}-title`}>Share “{p.title}”</p>
        <button type="button" className="ss-iconbtn" aria-label="Close" onClick={p.onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="ss-group">
        <div className="ss-linkrow">
          <LinkIcon />
          <span className="ss-link">{p.link.replace(/^https?:\/\//, "")}</span>
          <button type="button" className="ss-copy" data-autofocus onClick={p.copy} aria-label={p.copied ? "Link copied" : "Copy link"}>
            <Swap on={!p.copied}>
              <CopyIcon />
              Copy
            </Swap>
            <Swap on={p.copied} tone="ok">
              <CheckIcon />
              Copied
            </Swap>
          </button>
        </div>
        {p.current && (
          <button type="button" className="ss-trig" aria-haspopup="listbox" aria-expanded={p.accessOpen} aria-controls={`${p.idBase}-acc`} onClick={() => p.setAccessOpen(!p.accessOpen)}>
            {p.current.icon}
            <span className="ss-lines">
              <span className="ss-l1">{p.current.label}</span>
              <span className="ss-l2">{p.current.description}</span>
            </span>
            <ChevronDown className="ss-chev" />
          </button>
        )}
        {p.accessOpen && (
          <div className="ss-list" id={`${p.idBase}-acc`} role="listbox" aria-label="Who can access" ref={listRef} onKeyDown={onListKey}>
            {p.access.map((a) => (
              <button
                key={a.value}
                type="button"
                role="option"
                className="ss-opt"
                aria-selected={a.value === p.current?.value}
                tabIndex={a.value === p.current?.value ? 0 : -1}
                onClick={() => p.setAccess(a.value)}
              >
                {a.icon}
                <span className="ss-lines">
                  <span className="ss-l1">{a.label}</span>
                  <span className="ss-l2">{a.description}</span>
                </span>
                <CheckIcon className="ss-tick" />
              </button>
            ))}
          </div>
        )}
      </div>
      {p.channels.length > 0 && (
        <div className="ss-channels">
          {p.channels.map((c) => {
            const st = p.chan[c.id] ?? "idle"
            return (
              <button key={c.id} type="button" className="ss-chan" aria-busy={st === "pending" || undefined} onClick={() => p.runChannel(c)} aria-label={st === "idle" ? c.label : `${c.label}: ${st === "pending" ? "sending" : st === "done" ? c.doneLabel ?? "done" : "failed"}`}>
                <Swap on={st === "idle"}>
                  <span className="ss-ci" aria-hidden="true">{c.icon}</span>
                  {c.label}
                </Swap>
                <Swap on={st === "pending"}>
                  <span className="ss-spin" aria-hidden="true" />
                  {c.label}
                </Swap>
                <Swap on={st === "done"} tone="ok">
                  <CheckIcon />
                  {c.doneLabel ?? "Done"}
                </Swap>
                <Swap on={st === "failed"} tone="bad">
                  <CloseIcon />
                  Failed
                </Swap>
              </button>
            )
          })}
        </div>
      )}
      {p.channels.length > 0 && <div className="ss-divider" />}
      <div className="ss-to">
        <span className="ss-sec">Send to</span>
        <div className="ss-torow" ref={torowRef}>
          {p.picked.length === 0 && <span className="ss-ph">Pick people below</span>}
          {p.picked.length > 0 && (
          <ul className="ss-chips" aria-label="Selected people">
            {p.picked.map((x) => (
              <li key={x.id} className="ss-chip" data-chip={x.id} data-leaving={p.leavingChips.includes(x.id) || undefined} data-flying={flying.includes(x.id) || undefined}>
                <span className="ss-chipfill" aria-hidden="true" />
                <Avatar person={x} />
                <span className="ss-chipname">{x.name.split(" ")[0]}</span>
                <button type="button" className="ss-chipx" aria-label={`Remove ${x.name}`} onClick={() => p.removePerson(x.id)}>
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>
      <div className="ss-recents" role="group" aria-label="Recent people">
        {p.people.map((x) => {
          const on = pickedIds.has(x.id)
          return (
            <button key={x.id} type="button" className="ss-person" data-person={x.id} aria-pressed={on} aria-label={x.name} onClick={(e) => p.togglePerson(x.id, e.currentTarget.querySelector(".ss-av"))}>
              <span className="ss-avwrap">
                <Avatar person={x} />
                <span className="ss-badge" aria-hidden="true">
                  <CheckIcon />
                </span>
              </span>
              <span aria-hidden="true">{x.name.split(" ")[0]}</span>
            </button>
          )
        })}
      </div>
      <button type="button" className="ss-send" aria-disabled={n === 0 || undefined} aria-busy={p.sending || undefined} onClick={p.send}>
        {p.sending ? (
          <span className="ss-sendin">
            <span className="ss-spin" aria-hidden="true" />
            Sending
          </span>
        ) : n === 0 ? (
          "Send"
        ) : (
          <span>
            Send to <Roll value={n} /> {n === 1 ? "person" : "people"}
          </span>
        )}
      </button>
      {p.error && (
        <p className="ss-err" role="alert">
          {p.error}
        </p>
      )}
    </div>
  )
}

const CSS_ESC = (s: string) => (globalThis.CSS?.escape ? globalThis.CSS.escape(s) : s.replace(/"/g, '\\"'))

function SentBody({ people, access, onUndo, onDone }: { people: SharePerson[]; access?: ShareAccessOption; onUndo: () => void; onDone: () => void }) {
  const shown = people.slice(0, 3)
  const sub = access ? `${access.label} · ${access.description.charAt(0).toLowerCase()}${access.description.slice(1)}` : ""
  return (
    <div className="ss-sent">
      <div className="ss-stack" aria-hidden="true">
        {shown.map((x) => (
          <Avatar key={x.id} person={x} />
        ))}
        <span className="ss-okbadge">
          <CheckIcon />
        </span>
      </div>
      <p className="ss-stitle" style={{ margin: 0 }}>Sent to {namesOf(people)}</p>
      <p className="ss-ssub" style={{ margin: 0 }}>{sub}</p>
      <div className="ss-sbtns">
        <button type="button" className="ss-undo" onClick={onUndo}>Undo</button>
        <button type="button" className="ss-done" data-done onClick={onDone}>Done</button>
      </div>
    </div>
  )
}
