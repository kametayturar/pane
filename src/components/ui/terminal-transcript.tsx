"use client"

/**
 * Terminal Transcript – an agent's shell session as blocks with real semantics, not a typing animation.
 *
 * Each command is one block: the command line in mono, its output under it with standard error set apart in type
 * (stronger ink and a hairline rule, never a red wall), and how it ended written as words on the right
 * ("done in 2.1 s", "failed, exit 1", "running 3.2 s"). Long finished output folds itself into one sentence that
 * counts what is inside ("48 lines, 2 warnings") and keeps the warnings and errors visible while folded. A failed
 * command is the only thing that takes colour. Copy and Re-run are plain text actions that appear on hover and focus.
 * While a command runs, lines land at the bottom and the view follows, unless the reader has scrolled up: then a
 * quiet "3 new lines" button appears instead.
 *
 * Usage:
 *   <TerminalTranscript />                                  // plays the built-in Atlas session
 *   <TerminalTranscript blocks={blocks} onRerun={...} />    // your data, rendered as it is (update it as lines arrive)
 *   <TerminalTranscript blocks={script} streaming />        // plays your blocks over time, as if live
 *
 * Keyboard: Tab reaches the current command; Up/Down (and Page Up/Down, Home/End) move between commands;
 * Enter or Space folds and opens long output; C copies the command and its output; R runs it again; Escape
 * goes from an action back to its command, or folds open output.
 */

import * as React from "react"
import { ArrowDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TerminalTranscriptLine = {
  /** Standard output or standard error. */
  stream: "out" | "err"
  /** The line, without a trailing newline. An empty string is a blank line. */
  text: string
  /** Mark the line yourself. By default a line containing "warn" or "warning" is a warning, and a standard error line starting with FAIL, error or SomethingError is an error. */
  kind?: "warning" | "error" | "plain"
}

export type TerminalTranscriptBlock = {
  /** Stable id. */
  id: string
  /** The command as typed, without the prompt. */
  command: string
  /** Working directory. Shown above the command when it differs from the previous one. */
  cwd?: string
  status: "running" | "done" | "failed"
  /** Exit code of a failed command. Default 1. */
  exitCode?: number
  /** How long it took (done, failed) or has been running so far (running; the piece keeps counting from there). */
  durationMs?: number
  lines: TerminalTranscriptLine[]
}

export type TerminalTranscriptProps = {
  /** The session, in order. Default: Atlas installs, runs the tests (one failure), applies a fix and runs them again. */
  blocks?: TerminalTranscriptBlock[]
  /** Play `blocks` (or the built-in session) over time: each command runs, its lines arrive, then it ends as in the data. Default: on when no `blocks` are passed. */
  streaming?: boolean
  /** Milliseconds between lines while streaming. A command's lines always arrive within about 2.6 s. Default 36. */
  lineInterval?: number
  /** Who is running the commands; used in the headline. Default "Atlas". */
  agent?: string
  /** Fixed headline. Default: "Atlas is running <command>" while a command runs, otherwise "Atlas ran 4 commands". */
  title?: string
  /** A finished command with more output lines than this folds into one counted sentence. Default 12. */
  foldAt?: number
  /** Height of the scrolling transcript in px. Default 440. */
  maxHeight?: number
  /** Called when the person presses Re-run (or R). While streaming, the command also plays again at the end. Without this, Re-run only shows while streaming. */
  onRerun?: (block: TerminalTranscriptBlock) => void
  /** Called after Copy (or C) with the plain text that went to the clipboard: "$ command" and its output. */
  onCopy?: (block: TerminalTranscriptBlock, text: string) => void
  /** Accessible name of the transcript. Default "<agent>'s shell session". */
  label?: string
  /** Stable name an agent uses for this piece (see docs/agent-operable.md). Default: "terminal-transcript-<n>" in mount order. */
  agentId?: string
  className?: string
}

type Block = TerminalTranscriptBlock
type Line = TerminalTranscriptLine

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.trx {
  --trx-ink: #000;
  --trx-surface: #fff;
  --trx-accent: #0060e2;
  --trx-bad: #d42a1e;
  --trx-t1: color-mix(in oklab, var(--trx-ink) 88%, transparent);
  --trx-t2: color-mix(in oklab, var(--trx-ink) 61%, transparent);
  --trx-t3: color-mix(in oklab, var(--trx-ink) 45%, transparent);
  --trx-t4: color-mix(in oklab, var(--trx-ink) 27%, transparent);
  --trx-rule: color-mix(in oklab, var(--trx-ink) 22%, transparent);
  --trx-fill: color-mix(in oklab, var(--trx-ink) 6%, transparent);
  --trx-hov: color-mix(in oklab, var(--trx-ink) 2.5%, transparent);
  --trx-line: color-mix(in oklab, var(--trx-ink) 6%, transparent);
  --trx-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --trx-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --trx-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 6px 16px -6px rgb(0 0 0 / .18);
  --trx-ease: cubic-bezier(.22, 1, .36, 1);
  --trx-mono: "Geist Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --trx-r: 20px; --trx-rb: 12px; --trx-px: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 640px;
  font: 13px/20px var(--trx-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--trx-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .trx {
  --trx-ink: #fff;
  --trx-surface: #1c1c1e;
  --trx-accent: #4d8dff;
  --trx-bad: #ff6a5f;
  --trx-t1: color-mix(in oklab, var(--trx-ink) 90%, transparent);
  --trx-t2: color-mix(in oklab, var(--trx-ink) 62%, transparent);
  --trx-t3: color-mix(in oklab, var(--trx-ink) 46%, transparent);
  --trx-t4: color-mix(in oklab, var(--trx-ink) 28%, transparent);
  --trx-rule: color-mix(in oklab, var(--trx-ink) 26%, transparent);
  --trx-fill: color-mix(in oklab, var(--trx-ink) 8%, transparent);
  --trx-hov: color-mix(in oklab, var(--trx-ink) 3.5%, transparent);
  --trx-line: color-mix(in oklab, var(--trx-ink) 9%, transparent);
  --trx-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --trx-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
  --trx-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 18px -6px rgb(0 0 0 / .6);
}

/* Mono: ink on paper, a hairline, everything in the monospaced face, square corners; a failure keeps its red */
html[data-style="mono"] .trx {
  --trx-ink: #000; --trx-surface: #fff; --trx-accent: #111; --trx-bad: #c8231a;
  --trx-shadow: 0 0 0 1px rgb(0 0 0 / .14); --trx-drop: 0 0 0 0 transparent; --trx-float: 0 0 0 1px rgb(0 0 0 / .2);
  --trx-ease: cubic-bezier(.2, .9, .1, 1); --trx-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --trx-r: 8px; --trx-rb: 4px;
}
html[data-style="mono"].dark .trx { --trx-ink: #fff; --trx-surface: #0a0a0a; --trx-accent: #f2f2f2; --trx-bad: #ff6a5f; --trx-shadow: 0 0 0 1px rgb(255 255 255 / .16); --trx-float: 0 0 0 1px rgb(255 255 255 / .24) }
html[data-style="mono"] .trx-title { font-size: 14px }
html[data-style="mono"] .trx-sum { text-decoration: underline; text-decoration-color: var(--trx-t4); text-underline-offset: .25em }

/* Glass: the card carries the frost, the transcript sits on it in the Pane glass inks */
html[data-style="glass"] .trx {
  --trx-ink: var(--pane-ink); --trx-surface: var(--pane-solid); --trx-accent: var(--pane-accent); --trx-shadow: var(--pane-shadow);
  --trx-drop: 0 0 0 0 transparent; --trx-ease: var(--pane-ease); --trx-font: var(--pane-font);
  --trx-t1: var(--pane-t1); --trx-t2: var(--pane-t2); --trx-t3: var(--pane-t3); --trx-t4: var(--pane-t4);
  --trx-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --trx-hov: color-mix(in oklab, var(--pane-ink) 4%, transparent);
  --trx-rule: color-mix(in oklab, var(--pane-ink) 30%, transparent);
}
html[data-style="glass"] .trx-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .trx-new { background: var(--pane-tint-over, var(--pane-solid)) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .trx-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .trx-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .trx-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .trx-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .trx-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.trx *, .trx *::before, .trx *::after { box-sizing: border-box }
:where(.trx) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.trx) p, :where(.trx) code { margin: 0; padding: 0; font: inherit }
.trx-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card and headline */
.trx-card { position: relative; overflow: hidden; border-radius: var(--trx-r); background: var(--trx-surface); box-shadow: var(--trx-shadow), var(--trx-drop) }
.trx-head { display: flex; align-items: baseline; gap: 12px; padding: 18px var(--trx-px) 14px; border-bottom: 1px solid var(--trx-line) }
.trx-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; line-height: 22px; font-weight: 500; color: var(--trx-t1) }
.trx-title code { font-family: var(--trx-mono); font-size: 14px; letter-spacing: -.01em }
.trx-title-in { display: inline-block; animation: trx-swap .36s var(--trx-ease) backwards }
.trx-meta { flex: none; color: var(--trx-t3); font-variant-numeric: tabular-nums }

/* The scrolling transcript */
.trx-scroll {
  max-height: var(--trx-max, 440px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
  scrollbar-width: thin; scrollbar-color: var(--trx-t4) transparent; outline: none;
}
.trx-feed { padding: 6px 8px 8px }
.trx-empty { padding: 18px 12px; color: var(--trx-t3) }

/* One command */
.trx-b {
  position: relative; padding: 12px 12px 13px; border-radius: var(--trx-rb); outline: none;
  transition: background-color .2s var(--trx-ease); animation: trx-in .42s var(--trx-ease) backwards;
}
.trx-b + .trx-b::after { content: ""; position: absolute; left: 12px; right: 12px; top: 0; height: 1px; background: var(--trx-line) }
@media (hover: hover) { .trx-b:hover { background: var(--trx-hov) } }
.trx-b:focus-visible { box-shadow: inset 0 0 0 2px var(--trx-accent) }
/* a failure is the one thing with colour: its ending, and a short rule down its edge */
.trx-b[data-s="failed"]::before { content: ""; position: absolute; left: 3px; top: var(--trx-tick, 12px); height: 20px; width: 2px; border-radius: 2px; background: var(--trx-bad); transform-origin: top; animation: trx-rule .5s var(--trx-ease) backwards }

.trx-b[data-cwd] { --trx-tick: 32px }
.trx-cwd { margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 12.5px/18px var(--trx-mono); color: var(--trx-t3) }
.trx-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; column-gap: 12px }
.trx-cmd { grid-area: 1 / 1; min-width: 0; overflow-wrap: anywhere; font: 500 13.5px/20px var(--trx-mono); color: var(--trx-t1) }
.trx-cmd::before { content: "$\\00a0"; color: var(--trx-t4); font-weight: 400 }
/* The ending and the actions share one cell: pointing at the command line (or tabbing to an action) swaps the words for Copy and Re-run */
.trx-acts, .trx-end { grid-area: 1 / 2; justify-self: end; transition: opacity .18s var(--trx-ease), filter .18s var(--trx-ease) }
.trx-acts { display: flex; gap: 2px; margin: -2px -6px -2px 0; opacity: 0; filter: blur(2px); pointer-events: none }
@media (hover: hover) {
  .trx-row:hover .trx-acts { opacity: 1; filter: none; pointer-events: auto }
  .trx-row:hover .trx-end { opacity: 0; filter: blur(2px) }
}
.trx-acts:focus-within, .trx-b[data-copied] .trx-acts { opacity: 1; filter: none; pointer-events: auto }
.trx-b:has(.trx-acts:focus-within) .trx-end, .trx-b[data-copied] .trx-end { opacity: 0; filter: blur(2px) }
/* touch: no hover, so the actions sit on their own line under the command, always there */
@media (hover: none) {
  .trx-acts { grid-area: 2 / 1 / 3 / 3; justify-self: start; margin: 2px 0 -2px -6px; opacity: 1; filter: none; pointer-events: auto }
  .trx-b .trx-end { opacity: 1; filter: none }
}
.trx-act { display: inline-grid; padding: 2px 6px; border-radius: 6px; color: var(--trx-t2); line-height: 20px; white-space: nowrap; transition: color .16s var(--trx-ease), background-color .16s var(--trx-ease), transform .16s var(--trx-ease) }
@media (hover: hover) { .trx-act:not(:disabled):hover { color: var(--trx-t1); background: var(--trx-fill) } }
.trx-act:not(:disabled):active { transform: scale(.96) }
.trx-act:focus-visible { outline: 2px solid var(--trx-accent); outline-offset: 0 }
.trx-act:disabled { color: var(--trx-t4); cursor: default }
.trx-act > span { grid-area: 1 / 1 }
.trx-act-ghost { visibility: hidden }
.trx-act-on { animation: trx-swap .3s var(--trx-ease) backwards }
.trx-end { white-space: nowrap; text-align: right; color: var(--trx-t3); font-variant-numeric: tabular-nums }
.trx-b[data-s="running"] .trx-end { color: var(--trx-t2) }
.trx-b[data-s="failed"] .trx-end { color: var(--trx-bad); font-weight: 500 }
.trx-end-in { display: inline-block; animation: trx-swap .36s var(--trx-ease) backwards }

/* Output */
.trx-out { margin-top: 6px }
.trx-sum {
  display: inline-flex; align-items: center; gap: 4px; margin: 0 0 2px -4px; padding: 1px 8px 1px 2px; border-radius: 6px;
  color: var(--trx-t2); font-variant-numeric: tabular-nums; transition: color .16s var(--trx-ease), background-color .16s var(--trx-ease);
}
@media (hover: hover) { .trx-sum:hover { color: var(--trx-t1); background: var(--trx-fill) } }
.trx-sum:focus-visible { outline: 2px solid var(--trx-accent); outline-offset: 0 }
.trx-chev { width: 16px; height: 16px; flex: none; color: var(--trx-t3); transition: transform .28s var(--trx-ease) }
.trx-sum[aria-expanded="true"] .trx-chev { transform: rotate(90deg) }
.trx-pre { overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: var(--trx-t4) transparent; outline: none }
.trx-pre:focus-visible { box-shadow: inset 0 0 0 2px var(--trx-accent); border-radius: 4px }
.trx-pre-in { width: max-content; min-width: 100% }
.trx-ln { padding: 0 4px 0 12px; white-space: pre; font: 12.5px/19px var(--trx-mono); color: var(--trx-t2); animation: trx-ln .28s var(--trx-ease) backwards }
.trx-ln:empty::before { content: "\\00a0" }
/* standard error: stronger ink and a hairline rule down the left, never a red wall */
.trx-ln[data-err] { color: var(--trx-t1); box-shadow: inset 1.5px 0 0 var(--trx-rule) }
.trx-ln[data-k] { font-weight: 500; color: var(--trx-t1) }

/* "3 new lines" while the reader is scrolled up */
.trx-new {
  position: absolute; left: 50%; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px 0 10px;
  border-radius: 8px; background: var(--trx-surface); box-shadow: var(--trx-float); color: var(--trx-t2); font-variant-numeric: tabular-nums;
  transform: translateX(-50%); animation: trx-up .32s var(--trx-ease) backwards; transition: color .16s var(--trx-ease);
}
.trx-new svg { width: 14px; height: 14px }
@media (hover: hover) { .trx-new:hover { color: var(--trx-t1) } }
.trx-new:active { transform: translateX(-50%) scale(.97) }
.trx-new:focus-visible { outline: 2px solid var(--trx-accent); outline-offset: 2px }

@keyframes trx-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes trx-ln { from { opacity: 0; transform: translateY(3px) } }
@keyframes trx-swap { from { opacity: 0; filter: blur(4px); transform: translateY(3px) } }
@keyframes trx-up { from { opacity: 0; transform: translateX(-50%) translateY(6px); filter: blur(3px) } }
@keyframes trx-rule { from { transform: scaleY(0) } }

@container (max-width: 440px) {
  .trx { --trx-px: 16px }
  .trx-feed { padding: 4px 4px 6px }
  .trx-b { padding: 11px 12px 12px }
  .trx-head { padding-top: 16px; padding-bottom: 12px }
}
@media (prefers-reduced-motion: reduce) {
  .trx *, .trx *::before, .trx *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Built-in session                            */
/* -------------------------------------------------------------------------- */

const o = (text: string): Line => ({ stream: "out", text })
const e = (text: string): Line => ({ stream: "err", text })
const CWD = "~/northwind/storefront"

const INSTALL: Line[] = [
  o("Lockfile is up to date, resolution step is skipped"),
  o("Packages: +812"),
  ...Array.from({ length: 12 }, (_, k) => o(`Progress: resolved 812, reused ${Math.min(806, 120 + k * 62)}, downloaded ${Math.min(6, k >> 1)}, added ${Math.min(812, 70 * (k + 1))}`)),
  e("WARN  deprecated inflight@1.0.6: no longer maintained, leaks memory"),
  o("Progress: resolved 812, reused 806, downloaded 6, added 812, done"),
  e("WARN  1 peer dependency issue: @northwind/charts 2.0.3 wants tiny-router@^3"),
  o(""),
  o("dependencies:"),
  ...["@northwind/ui 4.2.0", "@northwind/money 1.8.1", "@northwind/charts 2.0.3", "@northwind/forms 1.4.0", "harbor-intl 3.6.2", "tiny-router 2.1.1", "ledger-math 0.9.4", "fetch-cache 1.12.0", "slug-kit 0.4.2"].map((d) => o(`+ ${d}`)),
  o(""),
  o("devDependencies:"),
  ...["@northwind/test-kit 2.3.0", "lint-sweep 4.0.1", "snap-diff 1.1.0", "type-guardian 5.6.3"].map((d) => o(`+ ${d}`)),
  o(""),
  o("postinstall: building @northwind/ui icons (212 files)"),
  o("Done in 8.4s"),
]

const TEST_FAIL: Line[] = [
  o(` RUN  ${CWD}`),
  o(""),
  o(" ✓ src/cart/total.test.ts          (12 tests)   41 ms"),
  o(" ✓ src/cart/discount.test.ts       (9 tests)    33 ms"),
  o(" ✓ src/checkout/address.test.ts    (7 tests)    58 ms"),
  o(" ✓ src/checkout/shipping.test.ts   (6 tests)    29 ms"),
  o(" × src/cart/tax.test.ts            (8 tests | 1 failed)   47 ms"),
  o("   × applies regional VAT to the basket"),
  o(" ✓ src/receipt/render.test.ts      (6 tests)    64 ms"),
  e("warning: 1 obsolete snapshot in src/receipt/__snapshots__/render.snap"),
  o(""),
  e(" FAIL  src/cart/tax.test.ts > applies regional VAT to the basket"),
  e("AssertionError: expected 21.1 to be 21.06"),
  e(""),
  e("  - Expected   21.06"),
  e("  + Received   21.1"),
  e(""),
  e(" > src/cart/tax.ts:18:24"),
  e("     16|   const rate = regionRate(order.region)"),
  e("     17|   const raw = order.subtotal * rate"),
  e("     18|   return Math.round(raw * 10) / 10"),
  e("       |                        ^"),
  o(""),
  o(" Test Files  1 failed | 5 passed (6)"),
  o("      Tests  1 failed | 47 passed (48)"),
  o("   Duration  3.38 s"),
]

const TEST_PASS: Line[] = [
  o(` RUN  ${CWD}`),
  o(""),
  o(" ✓ src/cart/total.test.ts          (12 tests)   39 ms"),
  o(" ✓ src/cart/discount.test.ts       (9 tests)    31 ms"),
  o(" ✓ src/checkout/address.test.ts    (7 tests)    55 ms"),
  o(" ✓ src/checkout/shipping.test.ts   (6 tests)    30 ms"),
  o(" ✓ src/cart/tax.test.ts            (8 tests)    44 ms"),
  o("   ✓ applies regional VAT to the basket"),
  o("   ✓ rounds half-cent totals up"),
  o("   ✓ exempts gift cards"),
  o("   ✓ uses the shipping region, not billing"),
  o(" ✓ src/receipt/render.test.ts      (6 tests)    61 ms"),
  e("warning: 1 obsolete snapshot in src/receipt/__snapshots__/render.snap"),
  o(""),
  o(" Test Files  6 passed (6)"),
  o("      Tests  48 passed (48)"),
  o("   Duration  3.12 s"),
]

const DEFAULT_BLOCKS: Block[] = [
  { id: "install", command: "pnpm install", cwd: CWD, status: "done", durationMs: 8400, lines: INSTALL },
  { id: "test", command: "pnpm test", cwd: CWD, status: "failed", exitCode: 1, durationMs: 3380, lines: TEST_FAIL },
  {
    id: "fix",
    command: "git apply -v atlas/vat-rounding.patch",
    cwd: CWD,
    status: "done",
    durationMs: 120,
    lines: [o("Checking patch src/cart/tax.ts..."), o("Applied patch src/cart/tax.ts cleanly.")],
  },
  { id: "retest", command: "pnpm test", cwd: CWD, status: "done", durationMs: 3120, lines: TEST_PASS },
]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const isWarning = (l: Line) => (l.kind ? l.kind === "warning" : /\bwarn(ing)?\b/i.test(l.text))
const isError = (l: Line) => (l.kind ? l.kind === "error" : l.stream === "err" && /^\s*(FAIL\b|error\b|[A-Za-z]*Error\b)/i.test(l.text))
const kindOf = (l: Line) => (isWarning(l) ? "warning" : isError(l) ? "error" : undefined)

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`

const fmtDone = (ms: number) =>
  ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`
const fmtRun = (ms: number) => (ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)} min ${Math.floor((ms % 60000) / 1000)} s`)

const ending = (b: Block) =>
  b.status === "failed" ? `failed, exit ${b.exitCode ?? 1}` : b.status === "done" ? (b.durationMs != null ? `done in ${fmtDone(b.durationMs)}` : "done") : "running"

const summaryOf = (lines: Line[]) => {
  let w = 0
  let er = 0
  for (const l of lines) {
    const k = kindOf(l)
    if (k === "warning") w++
    else if (k === "error") er++
  }
  return [plural(lines.length, "line"), w && plural(w, "warning"), er && plural(er, "error")].filter(Boolean).join(", ")
}

const plainText = (b: Block) => [`$ ${b.command}`, ...b.lines.map((l) => l.text)].join("\n")

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

/* ---- the streaming simulation: a queue of finished blocks played one by one ---- */

type Sim = { queue: Block[]; i: number; j: number; t: number; phase: "gap" | "run" | "hold"; wait: number }
const GAP_FIRST = 260
const GAP = 650
const HOLD = 240
const playMs = (b: Block, lineMs: number) => Math.min(2600, Math.max(450, b.lines.length * lineMs))

function simStep(s: Sim, dt: number, lineMs: number): Sim {
  if (s.i >= s.queue.length) return s
  const b = s.queue[s.i]
  if (s.phase === "gap") {
    const wait = s.wait - dt
    return wait > 0 ? { ...s, wait } : { ...s, phase: "run", t: 0, j: 0, wait: 0 }
  }
  if (s.phase === "run") {
    const p = playMs(b, lineMs)
    const t = s.t + dt
    if (t >= p) return { ...s, t: p, j: b.lines.length, phase: "hold", wait: HOLD }
    return { ...s, t, j: Math.min(b.lines.length, Math.floor((t / p) * b.lines.length) + 1) }
  }
  const wait = s.wait - dt
  return wait > 0 ? { ...s, wait } : { ...s, i: s.i + 1, j: 0, t: 0, phase: "gap", wait: GAP }
}

function simBlocks(s: Sim, lineMs: number): Block[] {
  const out = s.queue.slice(0, s.i)
  if (s.i < s.queue.length && s.phase !== "gap") {
    const b = s.queue[s.i]
    const p = playMs(b, lineMs)
    const full = b.durationMs ?? p
    out.push({ ...b, status: "running", exitCode: undefined, durationMs: Math.min(full, (s.t / p) * full), lines: b.lines.slice(0, s.j) })
  }
  return out
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
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

/** Elapsed time of a running command: starts from `ms` and keeps counting locally until `ms` changes again. */
function RunningClock({ ms }: { ms: number }) {
  const [base, setBase] = React.useState(() => ({ ms, t: performance.now() }))
  if (base.ms !== ms) setBase({ ms, t: performance.now() })
  const [now, setNow] = React.useState(() => performance.now())
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [])
  return <>running {fmtRun(base.ms + Math.max(0, now - base.t))}</>
}

type Api = {
  reg: (id: string, el: HTMLElement | null) => void
  activate: (id: string) => void
  toggle: (id: string) => void
  copy: (id: string) => void
  rerun: (id: string) => void
  key: (e: React.KeyboardEvent<HTMLElement>, id: string) => void
}

type BlockViewProps = {
  b: Block
  index: number
  count: number
  showCwd: boolean
  open: boolean
  foldable: boolean
  active: boolean
  copied: boolean
  canRerun: boolean
  still: boolean
  api: React.RefObject<Api>
}

const BlockView = React.memo(function BlockView({ b, index, count, showCwd, open, foldable, active, copied, canRerun, still, api }: BlockViewProps) {
  const uid = React.useId()
  const outRef = React.useRef<HTMLDivElement>(null)
  const lastH = React.useRef(0)
  const prevOpen = React.useRef(open)
  const reg = React.useCallback((el: HTMLElement | null) => api.current.reg(b.id, el), [api, b.id])

  // Folding glides between the two measured heights instead of jumping.
  React.useLayoutEffect(() => {
    const el = outRef.current
    if (!el) return
    const h = el.offsetHeight
    if (prevOpen.current !== open && !still && lastH.current > 0 && Math.abs(lastH.current - h) > 1 && typeof el.animate === "function") {
      el.style.overflow = "hidden"
      const a = el.animate([{ height: `${lastH.current}px` }, { height: `${h}px` }], { duration: 340, easing: "cubic-bezier(.22, 1, .36, 1)" })
      const done = () => {
        el.style.overflow = ""
      }
      a.onfinish = done
      a.oncancel = done
    }
    prevOpen.current = open
    lastH.current = h
  })

  const tab = active ? 0 : -1
  const end = ending(b)
  const kept = React.useMemo(() => b.lines.map((l, i) => [l, i] as const).filter(([l]) => kindOf(l)), [b.lines])
  const shown = open || !foldable ? b.lines.map((l, i) => [l, i] as const) : kept
  const summary = foldable ? summaryOf(b.lines) : ""

  return (
    <article
      ref={reg}
      className="trx-b"
      data-s={b.status}
      data-cwd={(showCwd && !!b.cwd) || undefined}
      data-copied={copied || undefined}
      tabIndex={tab}
      aria-posinset={index + 1}
      aria-setsize={count}
      aria-labelledby={`${uid}c`}
      aria-describedby={`${uid}e`}
      aria-busy={b.status === "running" || undefined}
      onFocus={() => api.current.activate(b.id)}
      onKeyDown={(ev) => api.current.key(ev, b.id)}
    >
      {showCwd && b.cwd && (
        <p className="trx-cwd" aria-hidden>
          {b.cwd}
        </p>
      )}
      <div className="trx-row">
        <code id={`${uid}c`} className="trx-cmd">
          {b.command}
        </code>
        <div className="trx-acts">
          <button type="button" className="trx-act" tabIndex={tab} aria-label={copied ? "Copied" : `Copy ${b.command} and its output`} onClick={() => api.current.copy(b.id)}>
            <span className="trx-act-ghost" aria-hidden>
              Copied
            </span>
            <span key={copied ? "y" : "n"} className={copied ? "trx-act-on" : undefined}>
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
          {canRerun && (
            <button type="button" className="trx-act" tabIndex={tab} disabled={b.status === "running"} aria-label={`Run ${b.command} again`} onClick={() => api.current.rerun(b.id)}>
              Re-run
            </button>
          )}
        </div>
        <span id={`${uid}e`} className="trx-end" title={b.status === "failed" && b.durationMs != null ? `after ${fmtDone(b.durationMs)}` : undefined}>
          <span key={b.status} className={b.status === "running" ? undefined : "trx-end-in"}>
            {b.status === "running" ? <RunningClock ms={b.durationMs ?? 0} /> : end}
          </span>
        </span>
      </div>
      {b.lines.length > 0 && (
        <div ref={outRef} className="trx-out">
          {foldable && (
            <button type="button" className="trx-sum" tabIndex={tab} aria-expanded={open} aria-controls={`${uid}o`} onClick={() => api.current.toggle(b.id)}>
              <ChevronRight className="trx-chev" strokeWidth={1.75} aria-hidden />
              <span>{summary}</span>
              <span className="trx-sr">{open ? ", shown" : ", folded"}</span>
            </button>
          )}
          {shown.length > 0 && (
            <div id={`${uid}o`} className="trx-pre" tabIndex={tab} role="group" aria-label={`Output of ${b.command}`}>
              <div className="trx-pre-in">
                {shown.map(([l, i]) => {
                  const k = kindOf(l)
                  return (
                    <div key={i} className="trx-ln" data-err={l.stream === "err" || undefined} data-k={k}>
                      {l.stream === "err" && <span className="trx-sr">{k ?? "stderr"}: </span>}
                      {l.text}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
})

/* -------------------------------------------------------------------------- */
/*                             TerminalTranscript                             */
/* -------------------------------------------------------------------------- */

export function TerminalTranscript(props: TerminalTranscriptProps) {
  const { blocks, lineInterval = 36, agent = "Atlas", title, foldAt = 12, maxHeight = 440, onRerun, onCopy, agentId, className } = props
  const streaming = props.streaming ?? blocks === undefined
  const label = props.label ?? `${agent}'s shell session`
  const script = blocks ?? DEFAULT_BLOCKS

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const els = React.useRef(new Map<string, HTMLElement>())
  const [sim, setSim] = React.useState<Sim>(() => ({ queue: script, i: 0, j: 0, t: 0, phase: "gap", wait: GAP_FIRST }))
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [fresh, setFresh] = React.useState(0)
  const [announce, setAnnounce] = React.useState("")
  const [onScreen, setOnScreen] = React.useState(true)
  const [visible, setVisible] = React.useState(true)
  const stick = React.useRef(true)
  const jumping = React.useRef(false)
  const copyTimer = React.useRef(0)
  const reruns = React.useRef(0)
  const hintId = React.useId()

  // Reduced motion: no playback, the session is shown as it ends.
  const simDone = sim.i >= sim.queue.length
  React.useLayoutEffect(() => {
    if (streaming && reduce && !simDone) setSim((s) => ({ ...s, i: s.queue.length, j: 0, t: 0, phase: "gap", wait: 0 }))
  }, [streaming, reduce, simDone])

  const shown = React.useMemo(() => (streaming ? simBlocks(sim, lineInterval) : script), [streaming, sim, lineInterval, script])
  const running = shown.find((b) => b.status === "running")
  const failed = shown.filter((b) => b.status === "failed").length

  // The playback runs only on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setVisible(document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    if (typeof IntersectionObserver === "undefined") return () => document.removeEventListener("visibilitychange", update)
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((x) => x.isIntersecting)))
    io.observe(el)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  const live = onScreen && visible

  React.useEffect(() => {
    if (!streaming || reduce || simDone || !live) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = Math.min(200, now - last)
      last = now
      setSim((s) => simStep(s, dt, lineInterval))
    }, 32)
    return () => window.clearInterval(id)
  }, [streaming, reduce, simDone, live, lineInterval])

  /* ---- follow the bottom unless the reader scrolled up ---- */
  const total = shown.reduce((a, b) => a + b.lines.length + 1, 0)
  const prevTotal = React.useRef(total)
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    const diff = total - prevTotal.current
    prevTotal.current = total
    if (!el) return
    if (stick.current) el.scrollTop = el.scrollHeight
    else if (diff > 0) setFresh((n) => n + diff)
  }, [total, shown])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    if (atBottom) {
      stick.current = true
      jumping.current = false
      setFresh(0)
    } else if (!jumping.current) stick.current = false
  }
  const jumpToEnd = () => {
    const el = scrollRef.current
    if (!el) return
    stick.current = true
    jumping.current = true
    setFresh(0)
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" })
  }

  /* ---- announcements: a command starts, a command ends ---- */
  const seen = React.useRef<Map<string, Block["status"]> | null>(null)
  React.useEffect(() => {
    const prev = seen.current
    const next = new Map(shown.map((b) => [b.id, b.status] as const))
    seen.current = next
    if (!prev) return
    for (const b of shown) {
      const was = prev.get(b.id)
      if (was === b.status) continue
      if (b.status === "running") setAnnounce(`${agent} is running ${b.command}`)
      else if (was === "running" || was === undefined) setAnnounce(`${b.command}: ${ending(b)}${b.status === "failed" && b.durationMs != null ? ` after ${fmtDone(b.durationMs)}` : ""}`)
    }
  }, [shown, agent])

  /* ---- actions ---- */
  const isOpen = (b: Block) => openMap[b.id] ?? !(b.status === "done" && b.lines.length > foldAt)
  const isFoldable = (b: Block) => b.status !== "running" && b.lines.length > foldAt
  const byId = (id: string) => shown.find((b) => b.id === id)
  const canRerun = streaming || !!onRerun

  const toggle = (id: string, want?: boolean) => {
    const b = byId(id)
    if (!b || !isFoldable(b)) return
    const open = want ?? !isOpen(b)
    setOpenMap((m) => ({ ...m, [id]: open }))
  }

  const copy = (id: string) => {
    const b = byId(id)
    if (!b) return
    const text = plainText(b)
    try {
      void navigator.clipboard?.writeText(text).catch(() => {})
    } catch {
      /* clipboard blocked: the callback still gets the text */
    }
    onCopy?.(b, text)
    setCopiedId(id)
    setAnnounce(`Copied ${b.command} and its output`)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopiedId(null), 1600)
  }

  const rerun = (id: string) => {
    const b = byId(id)
    if (!b || b.status === "running") return
    onRerun?.(b)
    if (!streaming) return
    const src = sim.queue.find((x) => x.id === id) ?? b
    reruns.current += 1
    const copyOf: Block = { ...src, id: `${src.id.split("~")[0]}~${reruns.current}` }
    stick.current = true
    setFresh(0)
    setSim((s) => {
      const queue = [...s.queue, copyOf]
      if (reduce) return { ...s, queue, i: queue.length }
      return s.i >= s.queue.length ? { ...s, queue, phase: "gap", wait: 120 } : { ...s, queue }
    })
  }

  const focusBlock = (id: string | undefined) => {
    if (!id) return
    const el = els.current.get(id)
    if (!el) return
    setActiveId(id)
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" })
  }

  const key = (ev: React.KeyboardEvent<HTMLElement>, id: string) => {
    const self = ev.target === ev.currentTarget
    const i = shown.findIndex((b) => b.id === id)
    const b = shown[i]
    if (!b || ev.altKey || ev.ctrlKey || ev.metaKey) return
    const go = (n: number) => {
      ev.preventDefault()
      focusBlock(shown[Math.max(0, Math.min(shown.length - 1, n))]?.id)
    }
    switch (ev.key) {
      case "ArrowDown":
        return go(i + 1)
      case "ArrowUp":
        return go(i - 1)
      case "PageDown":
        return go(i + 3)
      case "PageUp":
        return go(i - 3)
      case "Home":
        return go(0)
      case "End":
        return go(shown.length - 1)
      case "Enter":
      case " ":
        if (self && isFoldable(b)) {
          ev.preventDefault()
          toggle(id)
        }
        return
      case "c":
      case "C":
        if (self) {
          ev.preventDefault()
          copy(id)
        }
        return
      case "r":
      case "R":
        if (self && canRerun) {
          ev.preventDefault()
          rerun(id)
        }
        return
      case "Escape":
        if (!self) {
          ev.preventDefault()
          focusBlock(id)
        } else if (isFoldable(b) && isOpen(b)) {
          ev.preventDefault()
          toggle(id, false)
        }
        return
    }
  }

  const api = React.useRef<Api>({ reg: () => {}, activate: () => {}, toggle: () => {}, copy: () => {}, rerun: () => {}, key: () => {} })
  React.useLayoutEffect(() => {
    api.current = {
      reg: (id, el) => {
        if (el) els.current.set(id, el)
        else els.current.delete(id)
      },
      activate: (id) => setActiveId(id),
      toggle: (id) => toggle(id),
      copy,
      rerun,
      key,
    }
  })

  React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  // The one command in the Tab order: the one last focused, else the newest.
  const current = activeId && shown.some((b) => b.id === activeId) ? activeId : shown[shown.length - 1]?.id

  /* ---- agent ---- */
  useAgentNode(rootRef, {
    id: agentId,
    kind: "terminal-transcript",
    label,
    value: shown.map((b) => ({ id: b.id, command: b.command, status: b.status, exitCode: b.status === "failed" ? (b.exitCode ?? 1) : undefined, lines: b.lines.length, open: isOpen(b) })),
    actions: {
      copy: {
        description: "Copy a command and its output as plain text.",
        args: [{ name: "block", type: "string", enum: shown.map((b) => b.id) }],
        run: (a) => copy(String(a.block)),
      },
      rerun: {
        description: "Run a command again.",
        args: [{ name: "block", type: "string", enum: shown.filter((b) => b.status !== "running").map((b) => b.id) }],
        disabled: !canRerun,
        destructive: (a) => `Runs ${byId(String(a.block))?.command ?? "the command"} again.`,
        run: (a) => rerun(String(a.block)),
      },
      fold: {
        description: "Fold or open a command's long output.",
        args: [
          { name: "block", type: "string", enum: shown.filter(isFoldable).map((b) => b.id) },
          { name: "open", type: "boolean" },
        ],
        run: (a) => toggle(String(a.block), Boolean(a.open)),
      },
    },
  })

  const headline = title ?? (running ? null : shown.length ? `${agent} ran ${plural(shown.length, "command")}` : `${agent} hasn't run anything yet`)

  return (
    <div ref={rootRef} className={cn("trx", className)} style={{ "--trx-max": `${maxHeight}px` } as React.CSSProperties}>
      <style href="terminal-transcript" precedence="default">
        {CSS}
      </style>
      <p className="trx-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <p id={hintId} className="trx-sr">
        Up and down arrows move between commands. Enter folds or opens long output. C copies a command and its output.{canRerun ? " R runs it again." : ""}
      </p>
      <div className="trx-card">
        <div className="trx-head">
          <p className="trx-title">
            <span key={headline ?? running?.id} className="trx-title-in">
              {headline ?? (
                <>
                  {agent} is running <code>{running?.command}</code>
                </>
              )}
            </span>
          </p>
          {failed > 0 && <p className="trx-meta">{failed} failed</p>}
        </div>
        <div ref={scrollRef} className="trx-scroll" tabIndex={-1} onScroll={onScroll}>
          <div className="trx-feed" role="feed" aria-label={label} aria-describedby={hintId} aria-busy={!!running}>
            {shown.length === 0 && <p className="trx-empty">No commands yet</p>}
            {shown.map((b, i) => (
              <BlockView
                key={b.id}
                b={b}
                index={i}
                count={shown.length}
                showCwd={!!b.cwd && b.cwd !== shown[i - 1]?.cwd}
                open={isOpen(b) || !isFoldable(b)}
                foldable={isFoldable(b)}
                active={b.id === current}
                copied={copiedId === b.id}
                canRerun={canRerun}
                still={reduce}
                api={api}
              />
            ))}
          </div>
        </div>
        {fresh > 0 && (
          <button type="button" className="trx-new" onClick={jumpToEnd}>
            <ArrowDown strokeWidth={1.75} aria-hidden />
            {plural(fresh, "new line")}
          </button>
        )}
      </div>
    </div>
  )
}
