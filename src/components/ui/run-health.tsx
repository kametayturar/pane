"use client"

/**
 * Run Health – how a recurring thing has been doing, as quiet squares and a sentence.
 *
 * One small square per run or per day. Periods that went fine stay neutral ink; only a failed period takes the
 * destructive tone, and a degraded one is a half-filled neutral square, so the row also reads in Mono. Above the
 * row, large type states the result ("176 of 179 runs passed") and a second line names the last problem. Moving
 * along the squares by pointer or arrow keys swaps that line for the period under the cursor; Enter or a click
 * selects it and calls `onSelect`, so a product can open that run. When a new run arrives, its square lands at the
 * right end and the row shifts by one.
 *
 * ```tsx
 * <RunHealth />                                     // three agents' nightly runs, built in
 * <RunHealth runs={uptime} unit="days" verb="healthy" title="Billing API" span="90 days" />
 * <RunHealth rows={[{ id: "atlas", name: "Atlas", runs }, …]} limit={60} onSelect={(run, row) => open(run.id)} />
 * ```
 *
 * Rows align from the right: the last run of every row sits in the last column and shares its date, so give the
 * rows the same periods (status "none" marks a period with no run). Keyboard: one Tab stop for all squares,
 * ←/→ move along a row, ↑/↓ move between rows in the same column, Home/End jump, Enter or Space selects, Escape clears.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RunHealthStatus = "ok" | "degraded" | "failed" | "none"

export type RunHealthRun = {
  /** Stable id. Used as the React key, so a run that stays keeps its square while the row shifts. */
  id: string
  /** When the run happened (Date, ms or an ISO string). Drives the date in the readout and "3 days ago". */
  at: Date | number | string
  status: RunHealthStatus
  /** Replaces the date in the readout, e.g. "Run 412" or "Mon 24 Nov, 14:32". */
  label?: string
  /** What happened, e.g. "timeout calling Billing". Shown after the status. */
  detail?: string
  /** How long the run took. "failed after 41 s", "passed in 2 min 14 s". */
  durationMs?: number
}

export type RunHealthRow = {
  /** Stable id, used in `selected` and callbacks. */
  id: string
  /** The thing that runs, e.g. "Atlas". */
  name: string
  /** Oldest first. The last run sits at the right end. */
  runs: RunHealthRun[]
}

export type RunHealthSelection = { rowId: string; runId: string }

export type RunHealthAction = {
  /** Button text, e.g. "Run now". */
  label: string
  onClick: () => void
  /** While true the button is disabled and reads `pendingLabel`. */
  pending?: boolean
  /** Default "Running". */
  pendingLabel?: string
}

export type RunHealthProps = {
  /** Several named rows in one card, with aligned columns and shared dates. Default: Atlas, Quill and Sage over 60 nights. */
  rows?: RunHealthRow[]
  /** One row on its own (instead of `rows`). */
  runs?: RunHealthRun[]
  /** Name of the single row from `runs`. Default: `title`. */
  name?: string
  /** What is being watched. Default "Nightly runs". */
  title?: string
  /** Words the period after "last", e.g. "60 days" → "Nightly runs, last 60 days". Default "<columns> <unit>". */
  span?: string
  /** Plural noun counted in the sentence. Default "runs" ("58 of 60 runs passed"). */
  unit?: string
  /** What an ok or degraded period counts as. Default "passed"; "healthy" suits uptime. */
  verb?: string
  /** Show only the last N columns. Default: every column. With a limit, a new run shifts the row by one. */
  limit?: number
  /** "Now" for "3 days ago" and "Today". Default: the time of render. */
  now?: Date | number | string
  /** Controlled selection. `null` selects nothing. */
  selected?: RunHealthSelection | null
  /** Starting selection when uncontrolled. */
  defaultSelected?: RunHealthSelection | null
  /** Called when a period is clicked or Enter/Space is pressed on it. A product would open that run. */
  onSelect?: (run: RunHealthRun, row: RunHealthRow) => void
  /** Called when Escape clears the selection. */
  onClear?: () => void
  /** One quiet button at the top right, e.g. Run now. */
  action?: RunHealthAction
  /** Formats a period's date in the readout. Default "Tue 14 Oct". */
  formatDate?: (d: Date) => string
  /** Stable name an agent uses for this piece (see docs/agent-operable.md). Default: "run-health-<n>" in mount order. */
  agentId?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rnh {
  --rnh-ink: #000;
  --rnh-surface: #fff;
  --rnh-accent: #0060e2;
  --rnh-bad: #d92d20;
  --rnh-t1: color-mix(in oklab, var(--rnh-ink) 88%, transparent);
  --rnh-t2: color-mix(in oklab, var(--rnh-ink) 61%, transparent);
  --rnh-t3: color-mix(in oklab, var(--rnh-ink) 45%, transparent);
  --rnh-t4: color-mix(in oklab, var(--rnh-ink) 27%, transparent);
  --rnh-fill: color-mix(in oklab, var(--rnh-ink) 6%, transparent);
  --rnh-hov: color-mix(in oklab, var(--rnh-ink) 9%, transparent);
  --rnh-line: color-mix(in oklab, var(--rnh-ink) 6%, transparent);
  --rnh-ok: color-mix(in oklab, var(--rnh-ink) 15%, transparent);
  --rnh-deg: color-mix(in oklab, var(--rnh-ink) 50%, transparent);
  --rnh-none: color-mix(in oklab, var(--rnh-ink) 13%, transparent);
  --rnh-lift: 0 2px 4px -1px rgb(0 0 0 / .22);
  --rnh-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --rnh-ease: cubic-bezier(.22, 1, .36, 1);
  --rnh-pad: 28px;
  position: relative; container-type: inline-size; width: 100%; max-width: 720px;
  font: 13px/20px var(--rnh-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--rnh-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .rnh {
  --rnh-ink: #fff;
  --rnh-surface: #1c1c1e;
  --rnh-accent: #4d8dff;
  --rnh-bad: #ff6b60;
  --rnh-t1: color-mix(in oklab, var(--rnh-ink) 90%, transparent);
  --rnh-t2: color-mix(in oklab, var(--rnh-ink) 62%, transparent);
  --rnh-t3: color-mix(in oklab, var(--rnh-ink) 46%, transparent);
  --rnh-t4: color-mix(in oklab, var(--rnh-ink) 28%, transparent);
  --rnh-fill: color-mix(in oklab, var(--rnh-ink) 8%, transparent);
  --rnh-hov: color-mix(in oklab, var(--rnh-ink) 12%, transparent);
  --rnh-line: color-mix(in oklab, var(--rnh-ink) 9%, transparent);
  --rnh-ok: color-mix(in oklab, var(--rnh-ink) 20%, transparent);
  --rnh-deg: color-mix(in oklab, var(--rnh-ink) 58%, transparent);
  --rnh-none: color-mix(in oklab, var(--rnh-ink) 17%, transparent);
  --rnh-lift: 0 2px 5px -1px rgb(0 0 0 / .6);
  --rnh-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}

/* Mono: ink on paper. A failure is solid ink, a degraded period half ink, so the row reads without colour. */
html[data-style="mono"] .rnh {
  --rnh-ink: #000; --rnh-surface: #fff; --rnh-accent: #111; --rnh-bad: color-mix(in oklab, var(--rnh-ink) 88%, transparent);
  --rnh-ok: color-mix(in oklab, var(--rnh-ink) 14%, transparent); --rnh-deg: color-mix(in oklab, var(--rnh-ink) 88%, transparent);
  --rnh-shadow: 0 0 0 1px rgb(0 0 0 / .14); --rnh-lift: none;
  --rnh-ease: cubic-bezier(.2, .9, .1, 1); --rnh-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .rnh {
  --rnh-ink: #fff; --rnh-surface: #0a0a0a; --rnh-accent: #f2f2f2; --rnh-shadow: 0 0 0 1px rgb(255 255 255 / .16);
  --rnh-ok: color-mix(in oklab, var(--rnh-ink) 20%, transparent);
}
html[data-style="mono"] .rnh-card { border-radius: 8px }
html[data-style="mono"] .rnh-m { border-radius: 1px }
html[data-style="mono"] .rnh-act { border-radius: 4px; box-shadow: inset 0 0 0 1px var(--rnh-t4); background: none }
html[data-style="mono"] .rnh-head { font-size: clamp(20px, 5.2cqw, 26px); letter-spacing: -.01em }
html[data-style="mono"] .rnh-sq[data-sel] .rnh-m { outline-offset: 1px }

/* Glass: the card carries the frost; squares stay ink alphas so the backdrop never tints the data */
html[data-style="glass"] .rnh {
  --rnh-ink: var(--pane-ink); --rnh-surface: var(--pane-solid); --rnh-accent: var(--pane-accent); --rnh-shadow: var(--pane-shadow);
  --rnh-ease: var(--pane-ease); --rnh-font: var(--pane-font);
  --rnh-t1: var(--pane-t1); --rnh-t2: var(--pane-t2); --rnh-t3: var(--pane-t3); --rnh-t4: var(--pane-t4);
  --rnh-ok: color-mix(in oklab, var(--pane-ink) 19%, transparent); --rnh-none: color-mix(in oklab, var(--pane-ink) 22%, transparent);
  --rnh-line: color-mix(in oklab, var(--pane-ink) 12%, transparent); --rnh-fill: color-mix(in oklab, var(--pane-ink) 8%, transparent);
}
html[data-style="glass"].dark .rnh { --rnh-ok: color-mix(in oklab, var(--pane-ink) 24%, transparent) }
html[data-style="glass"] .rnh-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .rnh-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .rnh-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .rnh-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .rnh-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .rnh-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.rnh *, .rnh *::before, .rnh *::after { box-sizing: border-box }
:where(.rnh) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.rnh) p { margin: 0 }
.rnh-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.rnh-card { padding: 24px var(--rnh-pad) 22px; border-radius: 24px; background: var(--rnh-surface); box-shadow: var(--rnh-shadow) }

/* Caption and the one action */
.rnh-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; margin: -4px 0 0 }
.rnh-cap { min-width: 0; font-size: 14px; line-height: 20px; color: var(--rnh-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.rnh-act {
  flex: none; display: inline-grid; align-items: center; height: 32px; margin-right: -6px; padding: 0 12px; border-radius: 9px;
  font-size: 13px; font-weight: 500; color: var(--rnh-t1); background: var(--rnh-fill);
  transition: background-color .16s var(--rnh-ease), transform .16s var(--rnh-ease), color .2s var(--rnh-ease);
}
@media (hover: hover) { .rnh-act:not(:disabled):hover { background: var(--rnh-hov) } }
.rnh-act:not(:disabled):active { transform: scale(.96) }
.rnh-act:disabled { cursor: default; color: var(--rnh-t3) }
.rnh-act:focus-visible { outline: 2px solid var(--rnh-accent); outline-offset: 2px }

/* The sentence. The number rolls in place when it changes. */
.rnh-head {
  margin-top: 10px; font-size: clamp(24px, 6.2cqw, 34px); line-height: 1.15; font-weight: 500; letter-spacing: -.025em;
  font-variant-numeric: tabular-nums; color: var(--rnh-t1); text-wrap: balance;
}
.rnh-line {
  margin-top: 8px; height: 22px; font-size: 15px; line-height: 22px; color: var(--rnh-t2);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums;
}
.rnh-line b { font-weight: 500; color: var(--rnh-t1) }

.rnh-g { display: inline-grid; vertical-align: top }
.rnh-v { grid-area: 1 / 1; white-space: nowrap }
.rnh-in { animation: rnh-in .42s var(--rnh-ease) backwards }
.rnh-out { animation: rnh-out .3s var(--rnh-ease) forwards }
@keyframes rnh-in { from { opacity: 0; filter: blur(6px); transform: translateY(.3em) } }
@keyframes rnh-out { to { opacity: 0; filter: blur(6px); transform: translateY(-.3em) } }

/* Rows of squares */
.rnh-rows { margin-top: 22px }
.rnh-row + .rnh-row { margin-top: 12px }
.rnh-rh { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 4px; font-size: 13px; line-height: 20px }
.rnh-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--rnh-t1) }
.rnh-num { flex: none; color: var(--rnh-t3); font-variant-numeric: tabular-nums }
.rnh-row[data-cur] .rnh-num { color: var(--rnh-t2) }

/* Each square is a full-height column cell, so the pointer never falls in a gap and the readout never flickers. */
.rnh-strip {
  display: grid; grid-template-columns: repeat(var(--rnh-per), minmax(0, 1fr)); max-width: calc(var(--rnh-per) * 22px);
  margin: 0 calc(var(--rnh-gap) / -2); touch-action: manipulation;
}
.rnh-card { --rnh-gap: 3px }
@container (max-width: 560px) { .rnh-card { --rnh-gap: 2.5px } }
.rnh-sq { display: flex; padding: 3px calc(var(--rnh-gap) / 2); border-radius: 3px }
.rnh-sq:focus { outline: none }
.rnh-m {
  flex: 1; aspect-ratio: 1; border-radius: 2px; background: var(--rnh-ok);
  transition: transform .2s var(--rnh-ease), box-shadow .2s var(--rnh-ease), background-color .3s var(--rnh-ease);
}
.rnh-sq[data-s="failed"] .rnh-m { background: var(--rnh-bad) }
.rnh-sq[data-s="degraded"] .rnh-m { background: linear-gradient(to top, var(--rnh-deg) 50%, var(--rnh-ok) 50%) }
.rnh-sq[data-s="none"] .rnh-m { background: none; box-shadow: inset 0 0 0 1px var(--rnh-none) }
.rnh-sq[data-cur] .rnh-m { transform: translateY(-2px) scale(1.18); box-shadow: var(--rnh-lift) }
.rnh-sq[data-s="none"][data-cur] .rnh-m { box-shadow: inset 0 0 0 1px var(--rnh-t3) }
.rnh-sq[data-sel] .rnh-m { outline: 1.5px solid var(--rnh-t1); outline-offset: 1.5px }
.rnh-sq:focus-visible .rnh-m { outline: 2px solid var(--rnh-accent); outline-offset: 2px }

.rnh-axis { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; font-size: 12.5px; line-height: 18px; color: var(--rnh-t3); font-variant-numeric: tabular-nums }

/* Phones: the sentence may take two lines, so its height is reserved for two and nothing below moves. */
@container (max-width: 480px) {
  .rnh-card { --rnh-pad: 22px; padding-top: 20px; border-radius: 20px }
  .rnh-top { align-items: flex-start }
  .rnh-cap { padding-top: 6px; white-space: normal; text-wrap: pretty }
  .rnh-line { height: 44px; white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2 }
  .rnh-rows { margin-top: 18px }
  html[data-style="mono"] .rnh-cap { font-size: 13px }
  html[data-style="mono"] .rnh-line { font-size: 13.5px }
}
@media (prefers-reduced-motion: reduce) {
  .rnh *, .rnh *::before, .rnh *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DAY = 86_400_000
const EASE = "cubic-bezier(.22, 1, .36, 1)"
const MIN_PITCH = 8 // smallest column (square + gap) before the row wraps to a second line
const ROLL_MS = 320

const toDate = (v: Date | number | string) => (v instanceof Date ? v : new Date(v))
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const daysBetween = (a: Date, b: Date) => Math.round((dayStart(b) - dayStart(a)) / DAY)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
/** "Tue 14 Oct" */
const defaultFormat = (d: Date) => `${WEEKDAYS[d.getDay()]} ${shortDate(d)}`

function duration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`
}

function ago(days: number) {
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

/** "failed after 41 s, timeout calling Billing" */
function phrase(run: RunHealthRun | null, verb = "passed") {
  if (!run || run.status === "none") return run?.detail ?? "no run"
  const d = run.durationMs != null ? duration(run.durationMs) : ""
  const base = run.status === "failed" ? `failed${d ? ` after ${d}` : ""}` : run.status === "degraded" ? `degraded${d ? ` in ${d}` : ""}` : `${verb}${d ? ` in ${d}` : ""}`
  return run.detail ? `${base}, ${run.detail}` : base
}

/** Deterministic noise for the built-in data. */
function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Event = { i: number; status: RunHealthStatus; detail?: string; ms?: number }
const BUILT_IN: { id: string; name: string; seed: number; at: number; events: Event[] }[] = [
  {
    id: "atlas", name: "Atlas", seed: 7, at: 2,
    events: [
      { i: 31, status: "failed", detail: "Ledger API returned 503", ms: 64_000 },
      { i: 48, status: "degraded", detail: "3 retries calling Search", ms: 412_000 },
    ],
  },
  {
    id: "quill", name: "Quill", seed: 19, at: 3,
    events: [
      { i: 17, status: "failed", detail: "context limit hit on the Q3 export", ms: 188_000 },
      { i: 40, status: "degraded", detail: "slow responses from Ledger", ms: 530_000 },
      { i: 56, status: "failed", detail: "timeout calling Billing", ms: 41_000 },
    ],
  },
  {
    id: "sage", name: "Sage", seed: 31, at: 4,
    events: [
      { i: 9, status: "degraded", detail: "2 retries calling Billing", ms: 365_000 },
      { i: 22, status: "none", detail: "no run, paused for the holiday freeze" },
    ],
  },
]

function builtInRows(now: Date): RunHealthRow[] {
  const today = dayStart(now)
  return BUILT_IN.map((a) => {
    const r = rand(a.seed)
    const runs = Array.from({ length: 60 }, (_, i): RunHealthRun => {
      const at = today - (59 - i) * DAY + a.at * 3_600_000
      const e = a.events.find((x) => x.i === i)
      const ms = e?.ms ?? Math.round(95_000 + r() * 140_000)
      return { id: `${a.id}-${i}`, at, status: e?.status ?? "ok", detail: e?.detail, durationMs: e?.status === "none" ? undefined : ms }
    })
    return { id: a.id, name: a.name, runs }
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

/** A word or number that rolls in place when its text changes. `still` swaps it without motion. */
function Roll({ text, still }: { text: string; still: boolean }) {
  const [st, setSt] = React.useState<RollState>({ cur: text, prev: null, n: 0, anim: false })
  if (st.cur !== text) setSt({ cur: text, prev: still ? null : st.cur, n: st.n + 1, anim: !still })

  React.useEffect(() => {
    if (st.prev === null) return
    const n = st.n
    const id = window.setTimeout(() => setSt((s) => (s.n === n ? { ...s, prev: null } : s)), ROLL_MS)
    return () => window.clearTimeout(id)
  }, [st.n, st.prev])

  return (
    <span className="rnh-g">
      {st.prev !== null && (
        <span key={`o${st.n}`} className="rnh-v rnh-out" aria-hidden>
          {st.prev}
        </span>
      )}
      <span key={`i${st.n}`} className={cn("rnh-v", st.anim && "rnh-in")}>
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
/*                                  RunHealth                                 */
/* -------------------------------------------------------------------------- */

type Cell = { key: string; run: RunHealthRun | null }
type Pos = { r: number; c: number }
const cellKey = (rowId: string, k: string) => `${rowId}\u0001${k}`

export function RunHealth(props: RunHealthProps) {
  const {
    rows: rowsProp,
    runs: runsProp,
    title = "Nightly runs",
    unit = "runs",
    verb = "passed",
    limit,
    selected: selectedProp,
    defaultSelected = null,
    onSelect,
    onClear,
    action,
    formatDate = defaultFormat,
    agentId,
    className,
  } = props

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  const [renderNow] = React.useState(() => new Date())
  const now = props.now != null ? toDate(props.now) : renderNow

  const builtIn = React.useMemo(() => builtInRows(renderNow), [renderNow])
  const rows: RunHealthRow[] = rowsProp ?? (runsProp ? [{ id: "runs", name: props.name ?? title, runs: runsProp }] : builtIn)
  const multi = rows.length > 1

  /* ---- columns: every row aligned from the right ---- */
  const longest = rows.reduce((m, r) => Math.max(m, r.runs.length), 0)
  const n = Math.max(0, Math.min(limit ?? longest, longest))
  const grid: Cell[][] = rows.map((row) => {
    const tail = row.runs.slice(Math.max(0, row.runs.length - n))
    const pad = n - tail.length
    return [...Array.from({ length: pad }, (_, i): Cell => ({ key: `pad-${i}`, run: null })), ...tail.map((run): Cell => ({ key: run.id, run }))]
  })
  const colDate = (c: number) => {
    for (const r of grid) if (r[c]?.run) return toDate(r[c].run!.at)
    return null
  }
  const span = props.span ?? `${n} ${unit}`

  /* ---- what it adds up to ---- */
  const tally = grid.map((cells) => {
    let total = 0
    let passed = 0
    for (const { run } of cells) {
      if (!run || run.status === "none") continue
      total++
      if (run.status !== "failed") passed++
    }
    return { total, passed, failed: total - passed }
  })
  const total = tally.reduce((a, t) => a + t.total, 0)
  const passed = tally.reduce((a, t) => a + t.passed, 0)

  const lastOf = (status: RunHealthStatus) => {
    let best: { run: RunHealthRun; r: number; t: number } | null = null
    grid.forEach((cells, r) =>
      cells.forEach(({ run }) => {
        if (run?.status !== status) return
        const t = toDate(run.at).getTime()
        if (!best || t >= best.t) best = { run, r, t }
      }),
    )
    return best as { run: RunHealthRun; r: number; t: number } | null
  }

  const who = (r: number) => (multi ? rows[r].name : "")
  const restLine = (() => {
    if (!total) return "Nothing has run yet"
    const f = lastOf("failed")
    const d = f ?? lastOf("degraded")
    if (!d) return `No failures in the last ${span}`
    const when = ago(daysBetween(toDate(d.run.at), now))
    const what = [who(d.r), d.run.detail].filter(Boolean).join(", ")
    const lead = f ? `Last failure ${when}` : `No failures. Last degraded run ${when}`
    return what ? `${lead}: ${what}` : lead
  })()

  const periodName = (r: number, c: number) => {
    const run = grid[r]?.[c]?.run
    if (run?.label) return run.label
    const d = run ? toDate(run.at) : colDate(c)
    return d ? formatDate(d) : "Earlier"
  }
  const periodLine = (r: number, c: number) => {
    const run = grid[r]?.[c]?.run ?? null
    const name = periodName(r, c)
    const lead = multi ? (run?.label ? `${rows[r].name}, ${name}` : `${rows[r].name} on ${name}`) : name
    return `${lead}: ${phrase(run, verb)}`
  }

  const allPassed = total > 0 && passed === total
  const headWords = total ? (allPassed ? ["All", String(total), `${unit} ${verb}`] : [String(passed), `of ${total}`, `${unit} ${verb}`]) : ["No", "", `${unit} yet`]

  /* ---- cursor, roving focus and selection, all held by key so they survive a shift ---- */
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [activeKey, setActiveKey] = React.useState<string | null>(null)
  const [innerSel, setInnerSel] = React.useState<RunHealthSelection | null>(defaultSelected)
  const sel = selectedProp !== undefined ? selectedProp : innerSel
  const [announce, setAnnounce] = React.useState("")
  const live = React.useRef(0)
  const say = (t: string) => {
    live.current += 1
    setAnnounce(t + (live.current % 2 ? "" : "​"))
  }

  const find = (k: string | null): Pos | null => {
    if (!k) return null
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].findIndex((x) => cellKey(rows[r].id, x.key) === k)
      if (c >= 0) return { r, c }
    }
    return null
  }
  const keyAt = (p: Pos) => cellKey(rows[p.r].id, grid[p.r][p.c].key)
  const cur = find(cursor)
  const active = find(activeKey) ?? (n ? { r: 0, c: n - 1 } : null)
  const selPos = sel ? find(cellKey(sel.rowId, sel.runId)) : null

  const line = cur ? periodLine(cur.r, cur.c) : selPos ? periodLine(selPos.r, selPos.c) : restLine

  const rootRef = React.useRef<HTMLDivElement>(null)
  const rowsRef = React.useRef<HTMLDivElement>(null)
  const focusedKey = React.useRef<string | null>(null)
  const headId = React.useId()
  const sumId = React.useId()
  const hintId = React.useId()

  const select = (p: Pos) => {
    const run = grid[p.r][p.c].run
    if (!run) return
    const next = { rowId: rows[p.r].id, runId: run.id }
    if (selectedProp === undefined) setInnerSel(next)
    onSelect?.(run, rows[p.r])
    say(`Selected ${periodLine(p.r, p.c)}`)
  }
  const clear = () => {
    if (!sel) return
    if (selectedProp === undefined) setInnerSel(null)
    onClear?.()
    say("Selection cleared")
  }

  const focusAt = (p: Pos) => {
    const k = keyAt(p)
    setActiveKey(k)
    setCursor(k)
    const el = Array.from(rowsRef.current?.querySelectorAll<HTMLElement>(".rnh-sq") ?? []).find((b) => b.dataset.k === k)
    el?.focus({ preventScroll: true })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const p = find(focusedKey.current)
    if (!p) return
    let next: Pos | null = null
    switch (e.key) {
      case "ArrowRight":
        next = { r: p.r, c: Math.min(n - 1, p.c + 1) }
        break
      case "ArrowLeft":
        next = { r: p.r, c: Math.max(0, p.c - 1) }
        break
      case "ArrowDown":
        next = { r: Math.min(rows.length - 1, p.r + 1), c: p.c }
        break
      case "ArrowUp":
        next = { r: Math.max(0, p.r - 1), c: p.c }
        break
      case "Home":
        next = { r: e.ctrlKey || e.metaKey ? 0 : p.r, c: 0 }
        break
      case "End":
        next = { r: e.ctrlKey || e.metaKey ? rows.length - 1 : p.r, c: n - 1 }
        break
      case "Escape":
        if (sel) {
          e.preventDefault()
          clear()
        }
        return
      default:
        return
    }
    e.preventDefault()
    focusAt(next)
  }

  /* ---- how many squares fit on one line; below MIN_PITCH a column, the row wraps evenly ---- */
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rowsRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const lines = width && n ? Math.max(1, Math.ceil((n * MIN_PITCH) / width)) : 1
  const per = Math.max(1, Math.ceil(n / lines))

  /* ---- a new run: squares that stay glide to their new column (FLIP), the new one lands at the right end ---- */
  const sig = grid.map((cells, r) => rows[r].id + ":" + cells.map((x) => x.key).join(",")).join("|")
  const prevIndex = React.useRef<Map<string, number> | null>(null)
  const prevLast = React.useRef<Set<string> | null>(null)
  React.useLayoutEffect(() => {
    const host = rowsRef.current
    if (!host) return
    const strips = Array.from(host.querySelectorAll<HTMLElement>(".rnh-strip"))
    const before = prevIndex.current
    if (before && !reduce) {
      strips.forEach((strip, r) => {
        const btns = Array.from(strip.children) as HTMLElement[]
        const rects = btns.map((b) => b.getBoundingClientRect())
        btns.forEach((b, i) => {
          const k = b.dataset.k!
          if (k.includes("\u0001pad-")) return
          const old = before.get(k)
          if (old === undefined) {
            b.firstElementChild?.animate(
              [
                { opacity: 0, transform: "translateY(-10px) scale(.4)", filter: "blur(2px)" },
                { opacity: 1, transform: "none", filter: "none" },
              ],
              { duration: 560, delay: 160 + r * 70, easing: EASE, fill: "backwards" },
            )
            return
          }
          if (old === i || old >= rects.length) return
          const dx = rects[old].left - rects[i].left
          const dy = rects[old].top - rects[i].top
          b.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 520, delay: r * 40, easing: EASE, fill: "backwards" })
        })
      })
    }
    const map = new Map<string, number>()
    grid.forEach((cells, r) => cells.forEach((x, i) => map.set(cellKey(rows[r].id, x.key), i)))
    prevIndex.current = map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  // Tell a screen reader when a new period lands.
  const lastSig = grid.map((cells, r) => cellKey(rows[r].id, cells[n - 1]?.key ?? "")).join("|")
  React.useEffect(() => {
    const keys = new Set(lastSig.split("|"))
    const was = prevLast.current
    prevLast.current = keys
    if (!was) return
    const fresh = grid.map((cells, r) => ({ r, cell: cells[n - 1] })).filter(({ r, cell }) => cell?.run && !was.has(cellKey(rows[r].id, cell.key)))
    if (!fresh.length) return
    const what = fresh.map(({ r, cell }) => `${multi ? rows[r].name + " " : ""}${phrase(cell.run, verb)}`).join("; ")
    say(`New run: ${what}. ${headWords.filter(Boolean).join(" ")}.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSig])

  /* ---- the text summary for screen readers ---- */
  const summary = [
    `${title}, last ${span}.`,
    ...rows.map((row, r) => {
      const t = tally[r]
      const bad = grid[r].filter((x) => x.run?.status === "failed" || x.run?.status === "degraded")
      const list = bad.map((x) => `${x.run!.status} ${x.run!.label ?? formatDate(toDate(x.run!.at))}${x.run!.detail ? ` (${x.run!.detail})` : ""}`).join(", ")
      return `${multi ? row.name + ": " : ""}${t.passed} of ${t.total} ${verb}${list ? `; ${list}` : ""}.`
    }),
  ].join(" ")

  /* Agent: the same selection a person makes, through the same handler (see docs/agent-operable.md) */
  useAgentNode(rootRef, {
    id: agentId,
    kind: "run-health",
    label: `${title}, last ${span}`,
    value: {
      passed,
      total,
      rows: rows.map((row, r) => ({ id: row.id, name: row.name, passed: tally[r].passed, total: tally[r].total, failed: tally[r].failed })),
      selected: sel,
      lastProblem: restLine,
    },
    actions: {
      select: {
        description: "Select one period, as a click on its square does (a product opens that run). Pass the run id, or \"latest\" for the newest.",
        args: [
          { name: "row", type: "string", enum: rows.map((r) => r.id) },
          { name: "run", type: "string", description: "Run id or \"latest\"" },
        ],
        run: (a) => {
          const r = rows.findIndex((x) => x.id === a.row)
          if (r < 0) return
          const c = a.run === "latest" ? n - 1 : grid[r].findIndex((x) => x.run?.id === a.run)
          if (c >= 0) select({ r, c })
        },
      },
      clear: { description: "Clear the selection, as Escape does.", disabled: !sel, run: () => clear() },
    },
  })

  const still = reduce
  const first = colDate(0)
  const last = n ? colDate(n - 1) : null
  const axisLabel = (d: Date | null) => (!d ? "" : daysBetween(d, now) === 0 ? "Today" : shortDate(d))

  return (
    <div ref={rootRef} className={cn("rnh", className)}>
      <style href="run-health" precedence="default">
        {CSS}
      </style>
      <p className="rnh-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <section className="rnh-card" aria-labelledby={headId} aria-describedby={sumId}>
        <div className="rnh-top">
          <p className="rnh-cap">
            {title}, last {span}
          </p>
          {action && (
            <button type="button" className="rnh-act" disabled={action.pending} aria-busy={action.pending || undefined} onClick={action.onClick}>
              <Roll text={action.pending ? (action.pendingLabel ?? "Running") : action.label} still={still} />
            </button>
          )}
        </div>
        <p id={headId} className="rnh-head">
          {headWords[0] && <Roll text={headWords[0]} still={still} />}
          {headWords[1] && (
            <>
              {" "}
              <Roll text={headWords[1]} still={still} />
            </>
          )}{" "}
          {headWords[2]}
        </p>
        <p className="rnh-line" aria-hidden title={line}>
          {line}
        </p>
        <p id={sumId} className="rnh-sr">
          {summary}
        </p>
        <p id={hintId} className="rnh-sr">
          Arrow keys move between periods{multi ? " and rows" : ""}, Enter opens one, Escape clears.
        </p>

        {n > 0 && (
          <div
            ref={rowsRef}
            className="rnh-rows"
            onKeyDown={onKeyDown}
            onPointerLeave={() => setCursor(focusedKey.current)}
            onBlur={(e) => {
              if (rowsRef.current?.contains(e.relatedTarget as Node | null)) return
              focusedKey.current = null
              setCursor(null)
            }}
          >
            {rows.map((row, r) => (
              <div key={row.id} className="rnh-row" role="group" aria-label={`${row.name}: ${tally[r].passed} of ${tally[r].total} ${verb}`} data-cur={cur?.r === r || undefined}>
                {multi && (
                  <div className="rnh-rh" aria-hidden>
                    <span className="rnh-name">{row.name}</span>
                    <span className="rnh-num">
                      <Roll text={String(tally[r].passed)} still={still} /> of {tally[r].total}
                    </span>
                  </div>
                )}
                <div className="rnh-strip" style={{ "--rnh-per": per } as React.CSSProperties}>
                  {grid[r].map((cell, c) => {
                    const k = cellKey(row.id, cell.key)
                    const isActive = active?.r === r && active.c === c
                    const isSel = selPos?.r === r && selPos.c === c
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        className="rnh-sq"
                        data-k={k}
                        data-s={cell.run?.status ?? "none"}
                        data-cur={(cur?.r === r && cur.c === c) || undefined}
                        data-sel={isSel || undefined}
                        tabIndex={isActive ? 0 : -1}
                        aria-pressed={cell.run ? isSel : undefined}
                        aria-disabled={!cell.run || undefined}
                        aria-label={periodLine(r, c)}
                        aria-describedby={isActive ? hintId : undefined}
                        onPointerEnter={() => setCursor(k)}
                        onFocus={() => {
                          focusedKey.current = k
                          setActiveKey(k)
                          setCursor(k)
                        }}
                        onClick={() => {
                          setActiveKey(k)
                          select({ r, c })
                        }}
                      >
                        <span className="rnh-m" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="rnh-axis" aria-hidden style={{ maxWidth: `calc(${per} * 22px - var(--rnh-gap))` }}>
              <span>{axisLabel(first)}</span>
              <span>{axisLabel(last)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
