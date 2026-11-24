"use client"

/**
 * Diff Review – review the code changes a coding agent proposes, one hunk at a time.
 *
 * Built for deciding, not for displaying a diff. The header carries a big count ("5 changes left") that goes down as
 * you work. One hunk is open at a time: A accepts it, R rejects it, J/K or the arrows move, U undoes the last
 * decision. A decided hunk folds to one line ("Accepted: rename fetchUser to loadUser, 2 lines"; a rejected one is
 * struck) and the next undecided hunk opens. When none are left the header becomes a sentence ("4 accepted,
 * 1 rejected") with one Apply button. Additions and removals are marked in type (a leading + or −, weight, strike)
 * and only quietly tinted, so the piece reads the same in Mono.
 *
 * ```tsx
 * <DiffReview />                                   // Atlas's built-in change, opens with one hunk accepted
 * <DiffReview
 *   agent="Atlas"
 *   hunks={hunks}                                  // { id?, file, header, summary, lines: { kind, text, oldNo?, newNo? }[] }[]
 *   onDecide={(id, decision, all) => save(all)}    // decision is "accept" | "reject" | null (undecided again)
 *   onApply={(accepted, all) => write(accepted)}
 * />
 * ```
 *
 * Decisions are uncontrolled by default (`defaultDecisions`); pass `decisions` to control them. Line numbers are
 * taken from each line, or counted from the hunk header (`@@ -12,7 +12,9 @@`) when a line has none.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DiffReviewLineKind = "add" | "del" | "ctx"

export type DiffReviewLine = {
  /** "add" for a new line, "del" for a removed one, "ctx" for unchanged context. */
  kind: DiffReviewLineKind
  /** The code, without the leading + or −. */
  text: string
  /** Line number in the old file. Counted from the hunk header when missing. */
  oldNo?: number
  /** Line number in the new file. Counted from the hunk header when missing. */
  newNo?: number
}

export type DiffReviewHunk = {
  /** Stable id, used as the key in `decisions` and in callbacks. Default "<file>#<index in hunks>". */
  id?: string
  /** File path, shown as a quiet heading. Hunks are grouped by it, in order of first appearance. */
  file: string
  /** The hunk header, e.g. "@@ -12,7 +12,9 @@ export async function loadUser". */
  header: string
  /** What the change does, as a short sentence: "Rename fetchUser to loadUser". */
  summary: string
  lines: DiffReviewLine[]
}

export type DiffReviewDecision = "accept" | "reject"

/** The decision per hunk id. A hunk that is missing is still undecided. */
export type DiffReviewDecisions = Record<string, DiffReviewDecision>

export type DiffReviewProps = {
  /** Who proposes the change. Default "Atlas". */
  agent?: string
  /** The hunks to review. Default: Atlas's change to the user API and its hook (5 hunks in 2 files). */
  hunks?: DiffReviewHunk[]
  /** Line above the count. Default "Atlas proposes 5 changes to 2 files". */
  caption?: string
  /** Controlled decisions. */
  decisions?: DiffReviewDecisions
  /** Starting decisions when uncontrolled. */
  defaultDecisions?: DiffReviewDecisions
  /** Called on every decision, undo included. `decision` is null when a hunk becomes undecided again. */
  onDecide?: (id: string, decision: DiffReviewDecision | null, decisions: DiffReviewDecisions, hunk: DiffReviewHunk) => void
  /** Called when the person presses Apply, with the accepted hunks in review order and every decision. */
  onApply?: (accepted: DiffReviewHunk[], decisions: DiffReviewDecisions) => void
  /** Text of the apply button. Default "Apply". */
  applyLabel?: string
  /** Accept the first hunk by itself shortly after the piece comes on screen, once, to show the idea. Stops at the first touch. Default: on when no hunks, decisions or callbacks are passed. */
  intro?: boolean
  /** Stable name an agent uses for this piece (see docs/agent-operable.md). */
  agentId?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.drv {
  --drv-ink: #000;
  --drv-surface: #fff;
  --drv-accent: #0060e2;
  --drv-t1: color-mix(in oklab, var(--drv-ink) 88%, transparent);
  --drv-t2: color-mix(in oklab, var(--drv-ink) 61%, transparent);
  --drv-t3: color-mix(in oklab, var(--drv-ink) 45%, transparent);
  --drv-t4: color-mix(in oklab, var(--drv-ink) 27%, transparent);
  --drv-fill: color-mix(in oklab, var(--drv-ink) 6%, transparent);
  --drv-hov: color-mix(in oklab, var(--drv-ink) 3.5%, transparent);
  --drv-prs: color-mix(in oklab, var(--drv-ink) 6.5%, transparent);
  --drv-line: color-mix(in oklab, var(--drv-ink) 7%, transparent);
  --drv-well: color-mix(in oklab, var(--drv-ink) 2.5%, transparent);
  --drv-add: color-mix(in oklab, var(--drv-accent) 7%, transparent);
  --drv-del: color-mix(in oklab, var(--drv-ink) 4%, transparent);
  --drv-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --drv-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --drv-ease: cubic-bezier(.22, 1, .36, 1);
  --drv-mono: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  position: relative; container-type: inline-size; width: 100%; max-width: 640px;
  font: 14px/22px var(--drv-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--drv-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .drv {
  --drv-ink: #fff;
  --drv-surface: #1c1c1e;
  --drv-accent: #4d8dff;
  --drv-t1: color-mix(in oklab, var(--drv-ink) 90%, transparent);
  --drv-t2: color-mix(in oklab, var(--drv-ink) 62%, transparent);
  --drv-t3: color-mix(in oklab, var(--drv-ink) 46%, transparent);
  --drv-t4: color-mix(in oklab, var(--drv-ink) 28%, transparent);
  --drv-fill: color-mix(in oklab, var(--drv-ink) 8%, transparent);
  --drv-hov: color-mix(in oklab, var(--drv-ink) 5%, transparent);
  --drv-prs: color-mix(in oklab, var(--drv-ink) 9%, transparent);
  --drv-line: color-mix(in oklab, var(--drv-ink) 9%, transparent);
  --drv-well: color-mix(in oklab, var(--drv-ink) 3%, transparent);
  --drv-add: color-mix(in oklab, var(--drv-accent) 12%, transparent);
  --drv-del: color-mix(in oklab, var(--drv-ink) 5%, transparent);
  --drv-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --drv-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, one face for everything; additions and removals are told apart by sign, weight and strike alone */
html[data-style="mono"] .drv {
  --drv-ink: #000; --drv-surface: #fff; --drv-accent: #111;
  --drv-add: color-mix(in oklab, var(--drv-ink) 6%, transparent); --drv-del: transparent; --drv-well: transparent;
  --drv-shadow: 0 0 0 1px rgb(0 0 0 / .14); --drv-drop: 0 0 0 0 transparent;
  --drv-ease: cubic-bezier(.2, .9, .1, 1); --drv-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .drv { --drv-ink: #fff; --drv-surface: #0a0a0a; --drv-accent: #f2f2f2; --drv-add: color-mix(in oklab, var(--drv-ink) 9%, transparent); --drv-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .drv-card { border-radius: 8px; font-size: 13px }
html[data-style="mono"] .drv-big { letter-spacing: -.01em }
html[data-style="mono"] .drv-code { border-radius: 0; box-shadow: inset 0 1px 0 var(--drv-line), inset 0 -1px 0 var(--drv-line) }
html[data-style="mono"] .drv-row, html[data-style="mono"] .drv-btn { border-radius: 4px }
html[data-style="mono"] .drv-btn[data-k="a"], html[data-style="mono"] .drv-apply { box-shadow: none }
html[data-style="mono"] .drv-row[data-cur]::before { border-radius: 0 }

/* Glass: the card carries the frost; the code well and rows sit on it in the Pane glass inks */
html[data-style="glass"] .drv {
  --drv-ink: var(--pane-ink); --drv-surface: var(--pane-solid); --drv-accent: var(--pane-accent); --drv-shadow: var(--pane-shadow);
  --drv-drop: 0 0 0 0 transparent; --drv-ease: var(--pane-ease); --drv-font: var(--pane-font);
  --drv-t1: var(--pane-t1); --drv-t2: var(--pane-t2); --drv-t3: var(--pane-t3); --drv-t4: var(--pane-t4);
  --drv-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --drv-well: color-mix(in oklab, var(--pane-ink) 4%, transparent);
  --drv-hov: color-mix(in oklab, var(--pane-ink) 6%, transparent);
  --drv-fill: color-mix(in oklab, var(--pane-ink) 9%, transparent);
}
html[data-style="glass"] .drv-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .drv-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .drv-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .drv-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .drv-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .drv-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.drv *, .drv *::before, .drv *::after { box-sizing: border-box }
:where(.drv) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.drv) p, :where(.drv) ol, :where(.drv) li, :where(.drv) h3, :where(.drv) h4 { margin: 0; padding: 0; font: inherit }
:where(.drv) kbd { font: inherit }
.drv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.drv button:focus-visible { outline: 2px solid var(--drv-accent); outline-offset: 2px }

/* Card */
.drv-card { --drv-pad: 28px; padding: 24px var(--drv-pad) 20px; border-radius: 24px; background: var(--drv-surface); box-shadow: var(--drv-shadow), var(--drv-drop) }

/* A word that changes in place: the old one leaves upward through a blur, the new one lands from below, in one grid cell. */
.drv-g { display: inline-grid; vertical-align: top }
.drv-v { grid-area: 1 / 1; white-space: nowrap }
.drv-in { animation: drv-in .46s var(--drv-ease) backwards }
.drv-out { animation: drv-out .3s var(--drv-ease) forwards }
@keyframes drv-in { from { opacity: 0; filter: blur(6px); transform: translateY(.3em) } }
@keyframes drv-out { to { opacity: 0; filter: blur(6px); transform: translateY(-.3em) } }

/* Header: who proposes, the count, what happens next */
.drv-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 28px }
.drv-cap { min-width: 0; color: var(--drv-t2); font-size: 13px; line-height: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.drv-undo { display: inline-flex; align-items: center; gap: 8px; flex: none; height: 28px; padding: 0 8px; margin-right: -8px; border-radius: 8px; font-size: 13px; color: var(--drv-t2); transition: background-color .2s var(--drv-ease), color .2s var(--drv-ease), opacity .2s var(--drv-ease) }
@media (hover: hover) { .drv-undo:not(:disabled):hover { background: var(--drv-hov); color: var(--drv-t1) } }
.drv-undo:disabled { cursor: default; opacity: .45 }
.drv-undo[hidden] { display: none }
.drv-key { color: var(--drv-t3); font-family: var(--drv-mono); font-size: 12px; font-weight: 400; letter-spacing: 0 }

.drv-big { display: grid; margin-top: 6px; font-size: clamp(26px, 6.4cqw, 36px); line-height: 1.15; font-weight: 500; letter-spacing: -.025em; font-variant-numeric: tabular-nums; color: var(--drv-t1) }
.drv-big > span, .drv-sub > .drv-layer {
  grid-area: 1 / 1; align-self: center; opacity: 0; visibility: hidden; filter: blur(6px); transform: translateY(8px);
  transition: opacity .3s var(--drv-ease), filter .3s var(--drv-ease), transform .42s var(--drv-ease), visibility 0s linear .42s;
}
.drv-card[data-phase="review"] .drv-l-review, .drv-card[data-phase="done"] .drv-l-done, .drv-card[data-phase="applied"] .drv-l-applied {
  opacity: 1; visibility: visible; filter: none; transform: none; transition-delay: .08s, .08s, .08s, 0s;
}
.drv-sub { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 16px; min-height: 40px; margin-top: 4px; color: var(--drv-t2); font-size: 14px; line-height: 20px }
.drv-sub > .drv-layer { grid-column: 1; text-wrap: pretty }
.drv-apply {
  grid-area: 1 / 2; display: inline-flex; align-items: center; height: 36px; padding: 0 18px; border-radius: 18px;
  font-size: 14px; font-weight: 600; color: var(--drv-surface); background: var(--drv-accent);
  box-shadow: 0 1px 2px color-mix(in oklab, #000 35%, var(--drv-accent)), 0 8px 16px -8px color-mix(in oklab, var(--drv-accent) 55%, transparent);
  opacity: 0; visibility: hidden; transform: translateY(6px) scale(.97);
  transition: opacity .3s var(--drv-ease), transform .3s var(--drv-ease), visibility 0s linear .3s;
}
.drv-card[data-phase="done"] .drv-apply { opacity: 1; visibility: visible; transform: none; transition-delay: .12s, .12s, 0s }
.drv-card[data-phase="done"] .drv-apply:active { transform: scale(.96); transition-duration: .12s; transition-delay: 0s }
.drv-apply:focus-visible { outline-offset: 3px }

/* Files and hunks */
.drv-files { margin-top: 14px; border-top: 1px solid var(--drv-line) }
.drv-file { margin-top: 16px }
.drv-fh { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 0 6px; font-size: 12px; line-height: 18px; color: var(--drv-t3) }
.drv-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--drv-mono); color: var(--drv-t2) }
.drv-fn { flex: none; font-variant-numeric: tabular-nums }
.drv-list { list-style: none; margin: 0 -10px }

.drv-row {
  position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 40px; padding: 9px 10px; border-radius: 10px;
  touch-action: manipulation; transition: background-color .2s var(--drv-ease);
}
@media (hover: hover) { .drv-row:hover { background: var(--drv-hov) } }
.drv-row:active { background: var(--drv-prs) }
.drv .drv-row:focus-visible { outline-offset: -2px }
/* the tick that marks the hunk in focus */
.drv-row::before {
  content: ""; position: absolute; left: 0; top: 50%; width: 3px; height: 20px; margin-top: -10px; border-radius: 2px;
  background: var(--drv-accent); transform: scaleY(0); transition: transform .42s var(--drv-ease);
}
.drv-row[data-cur]::before { transform: scaleY(1) }
.drv-rt { display: grid; flex: 1; min-width: 0 }
.drv-rt > span { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.drv-rt .drv-in { animation-duration: .4s }
.drv-sum { color: var(--drv-t1) }
.drv-row[data-cur] .drv-sum { font-weight: 500; white-space: normal; text-wrap: pretty }
.drv-was { color: var(--drv-t3) }
.drv-was b { font-weight: 500; color: var(--drv-t2) }
.drv-x { text-decoration: line-through; text-decoration-thickness: 1px; text-decoration-color: var(--drv-t3) }
.drv-n { flex: none; font-family: var(--drv-mono); font-size: 12px; line-height: 20px; color: var(--drv-t3); font-variant-numeric: tabular-nums; white-space: nowrap }

/* The open hunk. Its body folds through grid rows; the content rises as it opens. */
.drv-body { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .42s var(--drv-ease), visibility 0s linear .42s }
.drv-hunk[data-cur] .drv-body { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s }
.drv-clip { min-height: 0; overflow: hidden }
.drv-inner { padding: 2px 10px 14px; opacity: 0; transform: translateY(6px); transition: opacity .3s var(--drv-ease), transform .42s var(--drv-ease) }
.drv-hunk[data-cur] .drv-inner { opacity: 1; transform: none; transition-delay: .06s }

.drv-code {
  overflow-x: auto; overscroll-behavior-x: contain; border-radius: 10px; background: var(--drv-well); box-shadow: inset 0 0 0 1px var(--drv-line);
  font: 12.5px/20px var(--drv-mono); font-variant-ligatures: none; tab-size: 2; padding: 6px 0;
  scrollbar-width: thin; scrollbar-color: var(--drv-t4) transparent;
}
.drv .drv-code:focus-visible { outline: 2px solid var(--drv-accent); outline-offset: -2px }
.drv-lines { width: max-content; min-width: 100% }
.drv-hh { padding: 0 16px 4px calc(var(--drv-nw) * 2 + 30px); color: var(--drv-t3); white-space: pre }
.drv-ln { display: grid; grid-template-columns: calc(var(--drv-nw) + 8px) calc(var(--drv-nw) + 8px) 22px auto; column-gap: 0; padding: 0 16px 0 8px; white-space: pre }
.drv-no { padding-right: 8px; text-align: right; color: var(--drv-t4); font-variant-numeric: tabular-nums; user-select: none }
.drv-sg { text-align: center; user-select: none; color: var(--drv-t3) }
.drv-tx { color: var(--drv-t2) }
.drv-ln[data-k="add"] { background: var(--drv-add) }
.drv-ln[data-k="add"] .drv-sg, .drv-ln[data-k="add"] .drv-tx { color: var(--drv-t1); font-weight: 500 }
.drv-ln[data-k="del"] { background: var(--drv-del) }
.drv-ln[data-k="del"] .drv-tx { text-decoration: line-through; text-decoration-thickness: 1px; text-decoration-color: var(--drv-t3) }

/* The decision, with each key written beside its action */
.drv-acts { display: flex; align-items: center; gap: 8px; margin-top: 12px }
.drv-btn {
  display: inline-flex; align-items: center; gap: 10px; height: 34px; padding: 0 14px; border-radius: 10px; font-size: 14px; font-weight: 500;
  color: var(--drv-t1); background: var(--drv-fill); transition: background-color .2s var(--drv-ease), transform .16s var(--drv-ease), color .2s var(--drv-ease);
}
@media (hover: hover) { .drv-btn:hover { background: color-mix(in oklab, var(--drv-ink) 10%, transparent) } }
.drv-btn:active, .drv-btn[data-press] { transform: scale(.96) }
.drv-btn[data-k="a"] { color: var(--drv-surface); background: var(--drv-accent); box-shadow: 0 1px 2px color-mix(in oklab, #000 30%, var(--drv-accent)) }
@media (hover: hover) { .drv-btn[data-k="a"]:hover { background: color-mix(in oklab, var(--drv-accent) 88%, var(--drv-ink)) } }
.drv-btn[data-k="a"] .drv-key { color: color-mix(in oklab, var(--drv-surface) 72%, transparent) }
.drv-btn[aria-pressed="true"]:not([data-k="a"]) { color: var(--drv-t1); background: color-mix(in oklab, var(--drv-ink) 12%, transparent) }
.drv-btn[data-k="a"][aria-pressed="false"][data-other] { color: var(--drv-t1); background: var(--drv-fill); box-shadow: none }
.drv-btn[data-k="a"][aria-pressed="false"][data-other] .drv-key { color: var(--drv-t3) }
.drv-move { margin-left: auto; font-size: 13px; color: var(--drv-t3); white-space: nowrap }
.drv-move .drv-key { margin-right: 8px }
.drv-state { margin-left: 4px; font-size: 13px; color: var(--drv-t3) }

@media (hover: none) and (pointer: coarse) { .drv-key, .drv-move { display: none } }
@container (max-width: 460px) {
  .drv-card { --drv-pad: 18px; padding: 20px var(--drv-pad) 14px; border-radius: 20px }
  .drv-list { margin: 0 -8px }
  .drv-row { padding: 9px 8px }
  .drv-inner { padding: 2px 8px 12px }
  .drv-move { display: none }
  .drv-sub { font-size: 13px }
}
@media (prefers-reduced-motion: reduce) {
  .drv *, .drv *::before, .drv *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Default data                                */
/* -------------------------------------------------------------------------- */

const ctx = (text: string): DiffReviewLine => ({ kind: "ctx", text })
const add = (text: string): DiffReviewLine => ({ kind: "add", text })
const del = (text: string): DiffReviewLine => ({ kind: "del", text })

/** Atlas adds a short-lived cache to the user API and renames fetchUser to loadUser. */
export const DIFF_REVIEW_SAMPLE: DiffReviewHunk[] = [
  {
    id: "cache",
    file: "src/api/users.ts",
    header: "@@ -1,5 +1,7 @@",
    summary: "Add a 60-second user cache",
    lines: [
      ctx('import { http } from "./http"'),
      ctx('import { parseUser, type User, type UserPatch } from "./schema"'),
      add('import { createCache } from "../lib/cache"'),
      ctx(""),
      ctx('const USERS = "/v2/users"'),
      add("const cache = createCache<User>({ ttl: 60_000, max: 500 })"),
      ctx(""),
    ],
  },
  {
    id: "rename",
    file: "src/api/users.ts",
    header: "@@ -6,4 +8,6 @@ const USERS = \"/v2/users\"",
    summary: "Rename fetchUser to loadUser and read from the cache",
    lines: [
      del("export async function fetchUser(id: string): Promise<User> {"),
      add("export async function loadUser(id: string): Promise<User> {"),
      add("  const hit = cache.get(id)"),
      add("  if (hit) return hit"),
      ctx("  const res = await http.get(`${USERS}/${id}`)"),
      ctx("  return parseUser(res.body)"),
      ctx("}"),
    ],
  },
  {
    id: "update",
    file: "src/api/users.ts",
    header: "@@ -11,4 +15,6 @@",
    summary: "Refresh the cache after an update",
    lines: [
      ctx("export async function updateUser(id: string, patch: UserPatch): Promise<User> {"),
      ctx("  const res = await http.patch(`${USERS}/${id}`, patch)"),
      del("  return parseUser(res.body)"),
      add("  const user = parseUser(res.body)"),
      add("  cache.set(id, user)"),
      add("  return user"),
      ctx("}"),
    ],
  },
  {
    id: "hook-import",
    file: "src/hooks/use-user.ts",
    header: "@@ -1,3 +1,3 @@",
    summary: "Import loadUser instead of fetchUser",
    lines: [
      ctx('import { useQuery } from "../lib/query"'),
      del('import { fetchUser } from "../api/users"'),
      add('import { loadUser } from "../api/users"'),
      ctx(""),
    ],
  },
  {
    id: "hook-retry",
    file: "src/hooks/use-user.ts",
    header: "@@ -8,7 +8,6 @@",
    summary: "Call loadUser and drop the two retries",
    lines: [
      ctx("export function useUser(id: string) {"),
      ctx("  return useQuery({"),
      ctx('    key: ["user", id],'),
      del("    fetch: () => fetchUser(id),"),
      del("    retry: 2,"),
      add("    fetch: () => loadUser(id),"),
      ctx("    staleFor: 30_000,"),
      ctx("  })"),
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const MINUS = "−"
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
/** "Rename fetchUser…" → "rename fetchUser…", but leaves "API cache" or "UserPatch…" alone. */
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^[A-Z][a-z]+[A-Z]/.test(s.split(" ")[0]) ? s[0].toLowerCase() + s.slice(1) : s)

type Item = { hunk: DiffReviewHunk; id: string; adds: number; dels: number; rows: { k: DiffReviewLineKind; text: string; o: number | null; n: number | null }[]; nw: number }
type Group = { file: string; items: Item[] }

/** Numbers each line, from the line itself or counted on from the hunk header. */
function numberLines(h: DiffReviewHunk) {
  const m = /^@@\s*-(\d+)(?:,\d+)?\s+\+(\d+)/.exec(h.header)
  let o = m ? Number(m[1]) : null
  let n = m ? Number(m[2]) : null
  return h.lines.map((l) => {
    const oo = l.kind === "add" ? null : (l.oldNo ?? o)
    const nn = l.kind === "del" ? null : (l.newNo ?? n)
    if (l.kind !== "add") o = oo === null ? null : oo + 1
    if (l.kind !== "del") n = nn === null ? null : nn + 1
    return { k: l.kind, text: l.text, o: oo, n: nn }
  })
}

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

type RollState = { cur: string; prev: string | null; n: number; anim: boolean }

/** Text that rolls in place when it changes. `still` swaps it without motion. */
function Roll({ text, still }: { text: string; still: boolean }) {
  const [st, setSt] = React.useState<RollState>({ cur: text, prev: null, n: 0, anim: false })
  if (st.cur !== text) setSt({ cur: text, prev: still ? null : st.cur, n: st.n + 1, anim: !still })

  React.useEffect(() => {
    if (st.prev === null) return
    const n = st.n
    const id = window.setTimeout(() => setSt((s) => (s.n === n ? { ...s, prev: null } : s)), 320)
    return () => window.clearTimeout(id)
  }, [st.n, st.prev])

  return (
    <span className="drv-g">
      {st.prev !== null && (
        <span key={`o${st.n}`} className="drv-v drv-out" aria-hidden>
          {st.prev}
        </span>
      )}
      <span key={`i${st.n}`} className={cn("drv-v", st.anim && "drv-in")}>
        {st.cur}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Agent bridge (inline stub)                        */
/* -------------------------------------------------------------------------- */

// Describes this piece to an agent: what it is, its state and the actions an agent may call.
// No import: the entry sits in a registry on globalThis that nothing reads until the app adds
// src/lib/agent-bridge.ts, so the piece works the same copied on its own. See docs/agent-operable.md.
type AgentArg = { name: string; type: "string" | "number" | "boolean"; enum?: readonly (string | number)[]; optional?: boolean; description?: string }
type AgentAction = {
  /** Goes through the piece's own handlers. May return a promise that resolves once the action has finished. */
  run: (args: Record<string, unknown>) => unknown
  args?: AgentArg[]
  description?: string
  /** Needs a person's approval. A string says what it does, for the person who is asked. */
  destructive?: boolean | string | ((args: Record<string, unknown>) => boolean | string)
  disabled?: boolean
}
type AgentNode = { id?: string; kind: string; label: string; value?: unknown; actions: Record<string, AgentAction> }
type AgentHost = { v: 1; nodes: Map<object, { el: () => Element | null; node: () => AgentNode }>; listeners: Set<(key: object) => void> }

function agentHost(): AgentHost {
  const g = globalThis as unknown as Record<symbol, AgentHost | undefined>
  return (g[Symbol.for("pane.agent")] ??= { v: 1, nodes: new Map(), listeners: new Set() })
}

function useAgentNode(el: React.RefObject<Element | null>, node: AgentNode) {
  const latest = React.useRef(node)
  const key = React.useRef<object | null>(null)
  React.useLayoutEffect(() => {
    latest.current = node
  })
  React.useEffect(() => {
    const host = agentHost()
    const k = (key.current = {})
    host.nodes.set(k, { el: () => el.current, node: () => latest.current })
    host.listeners.forEach((f) => f(k))
    return () => {
      host.nodes.delete(k)
      host.listeners.forEach((f) => f(k))
    }
  }, [el])
  // a change of state is reported, so the bridge can tag it as the agent's or the page's
  const sig = JSON.stringify(node.value)
  React.useEffect(() => {
    if (key.current) agentHost().listeners.forEach((f) => f(key.current!))
  }, [sig])
}

/* ------------------------------ end of stub ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                 DiffReview                                 */
/* -------------------------------------------------------------------------- */

type Step = { id: string; prev: DiffReviewDecision | null }
type Phase = "review" | "done" | "applied"

export function DiffReview(props: DiffReviewProps) {
  const { agent = "Atlas", hunks: hunksProp, decisions: decisionsProp, defaultDecisions, onDecide, onApply, applyLabel = "Apply", agentId, className } = props
  const bare = hunksProp === undefined && decisionsProp === undefined && defaultDecisions === undefined && onDecide === undefined && onApply === undefined
  const hunks = hunksProp && hunksProp.length > 0 ? hunksProp : DIFF_REVIEW_SAMPLE

  /* ---- grouped by file, in order of first appearance; the review order is the grouped order ---- */
  const { groups, items } = React.useMemo(() => {
    const byFile = new Map<string, Item[]>()
    hunks.forEach((h, i) => {
      const rows = numberLines(h)
      const max = rows.reduce((a, r) => Math.max(a, r.o ?? 0, r.n ?? 0), 0)
      const item: Item = {
        hunk: h,
        id: h.id ?? `${h.file}#${i}`,
        adds: h.lines.filter((l) => l.kind === "add").length,
        dels: h.lines.filter((l) => l.kind === "del").length,
        rows,
        nw: Math.max(2, String(max).length),
      }
      const list = byFile.get(h.file)
      if (list) list.push(item)
      else byFile.set(h.file, [item])
    })
    const groups: Group[] = [...byFile].map(([file, items]) => ({ file, items }))
    return { groups, items: groups.flatMap((g) => g.items) }
  }, [hunks])

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  const [inner, setInner] = React.useState<DiffReviewDecisions>(() => defaultDecisions ?? {})
  const decisions = decisionsProp ?? inner
  const decOf = (id: string): DiffReviewDecision | null => decisions[id] ?? null
  const firstOpen = (from: number, d: DiffReviewDecisions) => {
    for (let k = 0; k < items.length; k++) {
      const i = (from + k) % items.length
      if (!d[items[i].id]) return i
    }
    return -1
  }

  const [cur, setCur] = React.useState<number>(() => Math.max(0, firstOpen(0, decisionsProp ?? defaultDecisions ?? {})))
  const [history, setHistory] = React.useState<Step[]>([])
  const [applied, setApplied] = React.useState(false)
  const [press, setPress] = React.useState<string | null>(null)
  const [announce, setAnnounce] = React.useState("")
  const [intro, setIntro] = React.useState(props.intro ?? bare)
  const [onScreen, setOnScreen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const pendingFocus = React.useRef<"row" | "apply" | null>(null)
  const live = React.useRef(0)
  const pressTimer = React.useRef(0)
  const capId = React.useId()
  const keysId = React.useId()

  const accepted = items.filter((it) => decOf(it.id) === "accept")
  const rejected = items.filter((it) => decOf(it.id) === "reject")
  const left = items.length - accepted.length - rejected.length
  const phase: Phase = applied ? "applied" : left === 0 ? "done" : "review"
  const curIdx = cur >= 0 && cur < items.length ? cur : -1
  const acceptedFiles = groups.filter((g) => g.items.some((it) => decOf(it.id) === "accept")).map((g) => g.file)
  const caption = props.caption ?? `${agent} proposes ${plural(items.length, "change", "changes")} to ${plural(groups.length, "file", "files")}`

  const doneLine =
    accepted.length && rejected.length
      ? `${accepted.length} accepted, ${rejected.length} rejected`
      : accepted.length
        ? items.length === 1
          ? "Accepted"
          : `All ${accepted.length} accepted`
        : items.length === 1
          ? "Rejected"
          : `All ${rejected.length} rejected`
  const doneNote = accepted.length
    ? `Writes ${plural(accepted.length, "change", "changes")} to ${plural(acceptedFiles.length, "file", "files")}${rejected.length ? `. ${rejected.length === 1 ? "The rejected one is" : "The rejected ones are"} left out` : ""}`
    : "Nothing will be written"
  const appliedLine = accepted.length ? `Applied ${plural(accepted.length, "change", "changes")}` : "Nothing applied"
  const appliedNote = accepted.length
    ? `${agent} updated ${acceptedFiles.length === 1 ? acceptedFiles[0] : acceptedFiles.length === 2 ? `${acceptedFiles[0]} and ${acceptedFiles[1]}` : plural(acceptedFiles.length, "file", "files")}`
    : `${agent}'s proposal was set aside`

  const say = (t: string) => {
    live.current += 1
    setAnnounce(t + (live.current % 2 ? "" : "​"))
  }
  const flash = (key: string) => {
    setPress(key)
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPress(null), 160)
  }
  React.useEffect(() => () => window.clearTimeout(pressTimer.current), [])

  const countLine = (d: DiffReviewDecisions) => {
    const l = items.filter((it) => !d[it.id]).length
    if (l) return `${plural(l, "change", "changes")} left.`
    const a = items.filter((it) => d[it.id] === "accept").length
    return `All reviewed: ${a} accepted, ${items.length - a} rejected. ${applyLabel} is ready.`
  }

  /** Sets one hunk's decision, reports it, and moves focus on. `focus` says where keyboard focus should land. */
  const setDecision = (i: number, want: DiffReviewDecision | null, opts: { record?: boolean; user?: boolean; via?: "key" | "pointer" } = {}) => {
    if (applied) return
    const it = items[i]
    if (!it) return
    const prev = decOf(it.id)
    if (prev === want) return
    const next = { ...decisions }
    if (want) next[it.id] = want
    else delete next[it.id]
    if (decisionsProp === undefined) setInner(next)
    if (opts.record !== false) setHistory((h) => [...h, { id: it.id, prev }])
    onDecide?.(it.id, want, next, it.hunk)
    if (want) {
      const nxt = firstOpen(i + 1, next)
      setCur(nxt)
      if (nxt < 0) pendingFocus.current = "apply"
      else pendingFocus.current = "row"
    } else {
      setCur(i)
      pendingFocus.current = "row"
    }
    if (opts.via !== "key" && opts.via !== "pointer") pendingFocus.current = null
    if (opts.user !== false) say(`${want === "accept" ? "Accepted" : want === "reject" ? "Rejected" : "Undecided"}: ${it.hunk.summary}. ${countLine(next)}`)
  }

  const decide = (want: DiffReviewDecision, via: "key" | "pointer", i = curIdx) => {
    if (i < 0) return
    const it = items[i]
    flash(`${it.id}:${want}`)
    // Pressing the decision a hunk already has takes it back.
    setDecision(i, decOf(it.id) === want ? null : want, { via })
  }

  const undo = (via: "key" | "pointer") => {
    if (applied || !history.length) return
    const last = history[history.length - 1]
    const i = items.findIndex((it) => it.id === last.id)
    setHistory((h) => h.slice(0, -1))
    if (i < 0) return
    const it = items[i]
    const next = { ...decisions }
    if (last.prev) next[it.id] = last.prev
    else delete next[it.id]
    if (decisionsProp === undefined) setInner(next)
    onDecide?.(it.id, last.prev, next, it.hunk)
    setCur(i)
    pendingFocus.current = via === "key" || document.activeElement?.closest(".drv-undo") ? "row" : null
    flash("undo")
    say(`Undid ${decOf(it.id) === "accept" ? "accept" : "reject"}: ${it.hunk.summary}. ${countLine(next)}`)
  }

  const move = (to: number) => {
    if (!items.length) return
    const i = Math.max(0, Math.min(items.length - 1, to))
    setCur(i)
    pendingFocus.current = "row"
  }

  const apply = () => {
    if (phase !== "done") return
    setApplied(true)
    setCur(-1)
    onApply?.(
      accepted.map((it) => it.hunk),
      decisions,
    )
    say(`${appliedLine}. ${appliedNote}.`)
    // The button is about to go: keep a keyboard user's place on the card.
    if (document.activeElement?.classList.contains("drv-apply")) cardRef.current?.focus({ preventScroll: true })
  }

  // Keyboard focus follows the hunk in focus after a decision, a move or an undo.
  React.useLayoutEffect(() => {
    const want = pendingFocus.current
    if (!want) return
    pendingFocus.current = null
    const card = cardRef.current
    if (!card) return
    const target = want === "apply" ? card.querySelector<HTMLElement>(".drv-apply") : card.querySelector<HTMLElement>(".drv-row[data-cur]")
    if (!target) return
    // Only steal focus when it was already on the card (or dropped to the page because its button folded away).
    const a = document.activeElement
    if (a && a !== document.body && !card.contains(a)) return
    target.focus({ preventScroll: true })
    const li = target.closest(".drv-hunk") ?? target
    window.requestAnimationFrame(() => li.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }))
  })

  /* ---- the intro: one hunk is accepted by itself, once, shortly after the piece comes on screen ---- */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true)
      return
    }
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((x) => x.isIntersecting)))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const introRef = React.useRef(() => {})
  React.useLayoutEffect(() => {
    introRef.current = () => {
      setIntro(false)
      if (curIdx < 0 || decOf(items[curIdx].id)) return
      flash(`${items[curIdx].id}:accept`)
      window.setTimeout(() => setDecision(curIdx, "accept", { record: true, user: false }), 140)
    }
  })
  React.useEffect(() => {
    if (!intro || reduce || !onScreen || document.visibilityState !== "visible") return
    const id = window.setTimeout(() => introRef.current(), 1100)
    return () => window.clearTimeout(id)
  }, [intro, reduce, onScreen])
  const takeOver = () => {
    if (intro) setIntro(false)
  }

  /* ---- keys: work anywhere on the card ---- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
    const t = e.target as HTMLElement
    if (t.closest("input, textarea, select, [contenteditable='true']")) return
    const k = e.key
    const onCode = !!t.closest(".drv-code")
    let handled = true
    if (k === "a" || k === "A") decide("accept", "key")
    else if (k === "r" || k === "R") decide("reject", "key")
    else if (k === "u" || k === "U") undo("key")
    else if (k === "j" || k === "J" || k === "ArrowDown") move(curIdx < 0 ? 0 : curIdx + 1)
    else if (k === "k" || k === "K" || k === "ArrowUp") move(curIdx < 0 ? items.length - 1 : curIdx - 1)
    else if ((k === "Home" || k === "End") && !onCode) move(k === "Home" ? 0 : items.length - 1)
    else handled = false
    if (handled) e.preventDefault()
  }

  /* Agent: the same presses a person makes, through the same handlers (see docs/agent-operable.md) */
  useAgentNode(rootRef, {
    id: agentId,
    kind: "diff-review",
    label: caption,
    value: { decisions: Object.fromEntries(items.map((it) => [it.id, decOf(it.id)])), left, applied, focus: curIdx >= 0 ? items[curIdx].id : null },
    actions: {
      decide: {
        description: "Accept or reject one hunk, or set it back to undecided.",
        args: [
          { name: "hunk", type: "string", enum: items.map((it) => it.id) },
          { name: "decision", type: "string", enum: ["accept", "reject", "undecided"] },
        ],
        disabled: applied,
        run: (a) => {
          takeOver()
          const i = items.findIndex((it) => it.id === a.hunk)
          const want = a.decision === "accept" || a.decision === "reject" ? a.decision : null
          if (i >= 0) setDecision(i, want, { via: undefined })
        },
      },
      undo: {
        description: "Undo the last decision.",
        disabled: applied || !history.length,
        run: () => {
          takeOver()
          undo("pointer")
        },
      },
      apply: {
        description: `Press ${applyLabel}: writes the accepted hunks.`,
        disabled: phase !== "done",
        destructive: `${doneLine}. ${doneNote}.`,
        run: () => {
          takeOver()
          apply()
        },
      },
    },
  })

  let k = 0
  return (
    <div
      ref={rootRef}
      className={cn("drv", className)}
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) takeOver()
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) takeOver()
      }}
      onFocusCapture={takeOver}
    >
      <style href="diff-review" precedence="default">
        {CSS}
      </style>
      <p className="drv-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <p id={keysId} className="drv-sr">
        Keys: A accepts the open change, R rejects it, J and K or the arrow keys move between changes, U undoes the last decision.
      </p>
      <div ref={cardRef} tabIndex={-1} className="drv-card" role="group" aria-labelledby={capId} aria-describedby={keysId} data-phase={phase} onKeyDown={onKeyDown} style={{ outline: "none" }}>
        <div className="drv-top">
          <p id={capId} className="drv-cap">
            {caption}
          </p>
          <button
            type="button"
            className="drv-undo"
            hidden={applied}
            disabled={!history.length}
            aria-keyshortcuts="U"
            data-press={press === "undo" || undefined}
            onClick={() => undo("pointer")}
          >
            Undo <kbd className="drv-key">U</kbd>
          </button>
        </div>

        <h3 className="drv-big">
          <span className="drv-l-review" aria-hidden={phase !== "review"}>
            <Roll text={String(left)} still={reduce} />
            &nbsp;
            <Roll text={left === 1 ? "change left" : "changes left"} still={reduce} />
          </span>
          <span className="drv-l-done" aria-hidden={phase !== "done"}>
            <Roll text={doneLine} still={reduce} />
          </span>
          <span className="drv-l-applied" aria-hidden={phase !== "applied"}>
            {appliedLine}
          </span>
        </h3>
        <div className="drv-sub">
          <p className="drv-layer drv-l-review" aria-hidden={phase !== "review"}>
            Nothing is written until you apply
          </p>
          <p className="drv-layer drv-l-done" aria-hidden={phase !== "done"}>
            {doneNote}
          </p>
          <p className="drv-layer drv-l-applied" aria-hidden={phase !== "applied"}>
            {appliedNote}
          </p>
          <button type="button" className="drv-apply" disabled={phase !== "done"} aria-hidden={phase !== "done"} tabIndex={phase === "done" ? 0 : -1} onClick={apply}>
            {applyLabel}
          </button>
        </div>

        <div className="drv-files">
          {groups.map((g) => {
            const gl = g.items.filter((it) => !decOf(it.id)).length
            return (
              <section key={g.file} className="drv-file" aria-label={g.file}>
                <h4 className="drv-fh">
                  <span className="drv-path">{g.file}</span>
                  <span className="drv-fn">{gl ? `${gl} of ${g.items.length} left` : plural(g.items.length, "change", "changes")}</span>
                </h4>
                <ol className="drv-list" role="list">
                  {g.items.map((it) => {
                    const i = k++
                    const d = decOf(it.id)
                    const isCur = i === curIdx
                    const lines = it.adds + it.dels
                    const bodyId = `${capId}-h${i}`
                    const tab = (curIdx >= 0 ? isCur : i === 0) ? 0 : -1
                    const state = d === "accept" ? "Accepted" : d === "reject" ? "Rejected" : "Undecided"
                    return (
                      <li key={it.id} className="drv-hunk" data-cur={isCur || undefined} data-d={d ?? undefined}>
                        <button
                          type="button"
                          className="drv-row"
                          data-cur={isCur || undefined}
                          tabIndex={tab}
                          aria-expanded={isCur}
                          aria-controls={bodyId}
                          aria-label={`${it.hunk.summary}. ${state}. Change ${i + 1} of ${items.length}, ${it.adds} added, ${it.dels} removed.`}
                          onClick={() => {
                            setCur(i)
                          }}
                        >
                          <span className="drv-rt">
                            {d ? (
                              <span key={d} className={cn("drv-was", !reduce && "drv-in")}>
                                <b>{d === "accept" ? "Accepted:" : "Rejected:"}</b> <span className={d === "reject" ? "drv-x" : undefined}>{lowerFirst(it.hunk.summary)}</span>, {plural(lines, "line", "lines")}
                              </span>
                            ) : (
                              <span key="open" className={cn("drv-sum", !reduce && "drv-in")}>
                                {it.hunk.summary}
                              </span>
                            )}
                          </span>
                          {!d && (
                            <span className="drv-n" aria-hidden>
                              +{it.adds} {MINUS}
                              {it.dels}
                            </span>
                          )}
                        </button>
                        <div className="drv-body" id={bodyId} inert={!isCur}>
                          <div className="drv-clip">
                            <div className="drv-inner">
                              <div className="drv-code" tabIndex={isCur ? 0 : -1} role="region" aria-label={`Code: ${it.hunk.summary}`} style={{ "--drv-nw": `${it.nw}ch` } as React.CSSProperties}>
                                <div className="drv-lines">
                                  <div className="drv-hh">{it.hunk.header}</div>
                                  {it.rows.map((r, j) => (
                                    <div key={j} className="drv-ln" data-k={r.k}>
                                      <span className="drv-no">{r.o ?? ""}</span>
                                      <span className="drv-no">{r.n ?? ""}</span>
                                      <span className="drv-sg">{r.k === "add" ? "+" : r.k === "del" ? MINUS : ""}</span>
                                      <span className="drv-tx">
                                        {r.k === "add" ? <span className="drv-sr">added: </span> : r.k === "del" ? <span className="drv-sr">removed: </span> : null}
                                        {r.text || " "}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {!applied && (
                                <div className="drv-acts">
                                  <button
                                    type="button"
                                    className="drv-btn"
                                    data-k="a"
                                    data-other={d === "reject" || undefined}
                                    aria-pressed={d === "accept"}
                                    aria-keyshortcuts="A"
                                    data-press={press === `${it.id}:accept` || undefined}
                                    onClick={() => decide("accept", "pointer", i)}
                                  >
                                    {d === "accept" ? "Accepted" : "Accept"} <kbd className="drv-key">A</kbd>
                                  </button>
                                  <button
                                    type="button"
                                    className="drv-btn"
                                    data-k="r"
                                    aria-pressed={d === "reject"}
                                    aria-keyshortcuts="R"
                                    data-press={press === `${it.id}:reject` || undefined}
                                    onClick={() => decide("reject", "pointer", i)}
                                  >
                                    {d === "reject" ? "Rejected" : "Reject"} <kbd className="drv-key">R</kbd>
                                  </button>
                                  <span className="drv-move" aria-hidden>
                                    <kbd className="drv-key">J K</kbd>Move
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
