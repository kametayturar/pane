"use client"

import * as React from "react"
import { Archive, Ban, Check, ChevronDown, CornerDownLeft, Diamond, FileText, GitBranch, GitMerge, GitPullRequest, Hexagon, RotateCw, Sparkles, Square, X, FolderGit2 } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AgentTaskStatus = "queued" | "setting-up" | "running" | "ready" | "merged" | "failed" | "cancelled"

export type AgentTaskStep = {
  text: string
  state: "done" | "active" | "pending"
  /** Seconds the step took, once it is done. */
  seconds?: number
  /** A monospace line under the step, e.g. a command or an error. */
  detail?: string
}

export type AgentTaskFile = { path: string; added: number; removed: number }
export type AgentTaskCheck = { name: string; state: "passed" | "failed" | "pending" }
export type PullRequest = { number: number; url?: string; state?: "open" | "merged" | "closed" }

export type AgentTask = {
  id: string
  title: string
  repo: string
  branch: string
  baseBranch?: string
  /** An id from `models`. */
  model: string
  status: AgentTaskStatus
  /** Epoch milliseconds. */
  startedAt: number
  finishedAt?: number
  /** The live line while the task runs, such as "Reading src/billing/invoice.ts". */
  step?: string
  steps?: AgentTaskStep[]
  /** The diff stat and file count are summed from this list. */
  files?: AgentTaskFile[]
  checks?: AgentTaskCheck[]
  pullRequest?: PullRequest
  /** Why a failed task failed. */
  error?: string
}

export type Repository = { name: string; branches: string[]; defaultBranch: string }
/** `provider` picks the glyph: a different neutral mark for each family. */
export type AgentModel = { id: string; name: string; short: string; provider: "nova" | "atlas" | "sage" }
export type StartRequest = { prompt: string; repo: string; branch: string; model: string }
export type TaskFilter = "all" | "running" | "review" | "merged"

export type AgentTasksProps = {
  /** The tasks to show, newest first. Passing it makes the list controlled: nothing is simulated, every action calls back and you update the tasks. Leave it out for the demo. */
  tasks?: AgentTask[]
  /** Repositories for the composer. Picking one resets the branch to its default. */
  repositories?: Repository[]
  /** Models for the composer chip. The first one is the default. */
  models?: AgentModel[]
  /** Called on Start or Command/Ctrl+Enter. Reject to keep the prompt and show an inline error. */
  onStart?: (request: StartRequest) => void | Promise<void>
  /** Opens a pull request for a ready task and returns its number. Throw to show "Try again". Without it the preview simulates PR #482 onwards. */
  onCreatePullRequest?: (task: AgentTask) => PullRequest | Promise<PullRequest>
  /** Called when someone cancels a queued, setting up or running task. */
  onCancel?: (task: AgentTask) => void
  /** Called when someone retries a failed or cancelled task. */
  onRetry?: (task: AgentTask) => void
  /** Called when someone archives a finished task. The card leaves right away; Undo stays for six seconds and only restores it locally. */
  onArchive?: (task: AgentTask) => void
  /** The filter tab shown first. */
  defaultFilter?: TaskFilter
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

export const sampleRepositories: Repository[] = [
  { name: "northwind/web", branches: ["main", "develop", "release/2.4"], defaultBranch: "main" },
  { name: "northwind/api", branches: ["main", "staging"], defaultBranch: "main" },
  { name: "northwind/billing", branches: ["main", "hotfix/invoices"], defaultBranch: "main" },
]

export const sampleModels: AgentModel[] = [
  { id: "nova-large", name: "Nova Large", short: "Nova L", provider: "nova" },
  { id: "nova-mini", name: "Nova Mini", short: "Nova", provider: "nova" },
  { id: "atlas-2", name: "Atlas 2", short: "Atlas 2", provider: "atlas" },
  { id: "sage-mini", name: "Sage Mini", short: "Sage", provider: "sage" },
]

const T0 = Date.now()
const clock = () => Date.now()
const MIN = 60_000

const FILE_POOL: AgentTaskFile[] = [
  { path: "src/lib/retry.ts", added: 64, removed: 9 },
  { path: "src/lib/retry.test.ts", added: 88, removed: 0 },
  { path: "src/jobs/send-invoice-email.ts", added: 31, removed: 14 },
  { path: "src/config/queues.ts", added: 12, removed: 3 },
  { path: "docs/runbooks/invoice-emails.md", added: 22, removed: 2 },
  { path: "src/components/settings/page.tsx", added: 46, removed: 38 },
  { path: "src/routes/settings/index.tsx", added: 18, removed: 4 },
]

const sampleTasks = (): AgentTask[] => [
  {
    id: "t5",
    title: "Retry failed invoice emails with backoff",
    repo: "northwind/billing",
    branch: "feat/invoice-email-retry",
    baseBranch: "main",
    model: "nova-large",
    status: "running",
    startedAt: T0 - 2 * MIN - 14_000,
    step: "Reading src/jobs/send-invoice-email.ts",
    steps: [
      { text: "Cloned northwind/billing", state: "done", seconds: 9 },
      { text: "Installed dependencies with pnpm", state: "done", seconds: 38 },
      { text: "Reading src/jobs/send-invoice-email.ts", state: "active" },
    ],
  },
  {
    id: "t4",
    title: "Add rate limiting to the public search endpoint",
    repo: "northwind/api",
    branch: "feat/search-rate-limit",
    baseBranch: "main",
    model: "atlas-2",
    status: "ready",
    startedAt: T0 - 9 * MIN,
    finishedAt: T0 - 3 * MIN,
    steps: [
      { text: "Cloned northwind/api", state: "done", seconds: 7 },
      { text: "Installed dependencies with pnpm", state: "done", seconds: 31 },
      { text: "Added a token bucket in src/lib/limit.ts", state: "done", seconds: 96 },
      { text: "Ran the test suite", state: "done", seconds: 122, detail: "pnpm test  148 passed" },
    ],
    files: [
      { path: "src/lib/limit.ts", added: 72, removed: 0 },
      { path: "src/lib/limit.test.ts", added: 94, removed: 0 },
      { path: "src/routes/search.ts", added: 11, removed: 4 },
      { path: "src/config/limits.ts", added: 8, removed: 1 },
    ],
    checks: [
      { name: "Unit tests", state: "passed" },
      { name: "Lint", state: "passed" },
    ],
  },
  {
    id: "t3",
    title: "Upgrade date-fns to v4 and fix the imports",
    repo: "northwind/web",
    branch: "chore/date-fns-4",
    baseBranch: "main",
    model: "nova-mini",
    status: "ready",
    startedAt: T0 - 22 * MIN,
    finishedAt: T0 - 8 * MIN,
    pullRequest: { number: 479, state: "open" },
    steps: [
      { text: "Cloned northwind/web", state: "done", seconds: 8 },
      { text: "Updated 31 imports to named exports", state: "done", seconds: 240 },
      { text: "Ran the type check", state: "done", seconds: 64 },
    ],
    files: [
      { path: "package.json", added: 2, removed: 2 },
      { path: "src/lib/format-date.ts", added: 24, removed: 20 },
      { path: "src/components/activity-feed.tsx", added: 12, removed: 12 },
      { path: "src/components/invoice-table.tsx", added: 9, removed: 9 },
    ],
    checks: [
      { name: "Type check", state: "passed" },
      { name: "Unit tests", state: "passed" },
    ],
  },
  {
    id: "t2",
    title: "Split the settings page into route chunks",
    repo: "northwind/web",
    branch: "perf/settings-chunks",
    baseBranch: "develop",
    model: "sage-mini",
    status: "failed",
    startedAt: T0 - 31 * MIN,
    finishedAt: T0 - 26 * MIN,
    error: "2 of 148 tests failed in settings/",
    steps: [
      { text: "Cloned northwind/web", state: "done", seconds: 8 },
      { text: "Moved four panels into lazy routes", state: "done", seconds: 180 },
      { text: "Ran the test suite", state: "active", detail: "FAIL settings/billing-panel.test.tsx" },
    ],
  },
  {
    id: "t1",
    title: "Remove unused feature flags from checkout",
    repo: "northwind/web",
    branch: "chore/flag-cleanup",
    baseBranch: "main",
    model: "nova-large",
    status: "merged",
    startedAt: T0 - 3 * 60 * MIN,
    finishedAt: T0 - 170 * MIN,
    pullRequest: { number: 471, state: "merged" },
    files: [
      { path: "src/flags.ts", added: 0, removed: 54 },
      { path: "src/checkout/summary.tsx", added: 4, removed: 36 },
    ],
    checks: [{ name: "Unit tests", state: "passed" }],
  },
]

const PROCESS_STEPS = [
  "Installed dependencies with pnpm",
  "Reading src/lib/retry.ts",
  "Editing src/jobs/send-invoice-email.ts",
  "Writing tests",
  "Running tests",
]

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const TABS: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "review", label: "Ready for review" },
  { id: "merged", label: "Merged" },
]

const isRunning = (s: AgentTaskStatus) => s === "queued" || s === "setting-up" || s === "running"
const isFinished = (s: AgentTaskStatus) => s === "ready" || s === "merged" || s === "failed" || s === "cancelled"

function compact(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`
}
function spoken(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const parts: string[] = []
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`)
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`)
  if (r || !parts.length) parts.push(`${r} second${r === 1 ? "" : "s"}`)
  return parts.join(" ")
}

function ProviderMark({ provider, size = 14 }: { provider: AgentModel["provider"]; size?: number }) {
  const p = { size, strokeWidth: 1.7, "aria-hidden": true } as const
  if (provider === "atlas") return <Hexagon {...p} />
  if (provider === "sage") return <Diamond {...p} />
  return <Sparkles {...p} />
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg className="atk-spin" width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.5" />
      <path d="M7 1.75a5.25 5.25 0 0 1 5.25 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StatusGlyph({ status }: { status: AgentTaskStatus }) {
  if (status === "running" || status === "setting-up") return <Spinner />
  if (status === "queued")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.2 2" />
      </svg>
    )
  if (status === "ready")
    return (
      <svg className="atk-ok" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="6" fill="currentColor" />
        <path d="m4.4 7.2 1.9 1.9 3.3-3.8" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (status === "merged") return <GitMerge className="atk-merged" size={14} strokeWidth={1.8} aria-hidden />
  if (status === "failed")
    return (
      <svg className="atk-bad" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="6" fill="currentColor" />
        <path d="m4.9 4.9 4.2 4.2M9.1 4.9 4.9 9.1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  return <Ban size={14} strokeWidth={1.6} aria-hidden />
}

const STATUS_WORD: Record<AgentTaskStatus, string> = {
  queued: "Queued",
  "setting-up": "Setting up environment",
  running: "Running",
  ready: "Ready for review",
  merged: "Merged",
  failed: "Failed",
  cancelled: "Cancelled",
}

/** Text that changes in place: the old one fades out, the new one fades in from 3px below. */
function Swap({ text, shimmer }: { text: string; shimmer?: boolean }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 220)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="atk-swap">
      {leaving !== null && (
        <span key={`o-${leaving}`} className="atk-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`i-${shown}`} className={"atk-swap-in" + (shimmer ? " atk-shimmer" : "")} data-text={shown} data-fresh={leaving !== null || undefined}>
        {shown}
      </span>
    </span>
  )
}

/** A count that rolls up or down when it changes (and stays still on first paint). */
function Roll({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value)
  const [dir, setDir] = React.useState<"up" | "down" | null>(null)
  if (value !== shown) {
    setDir(value > shown ? "up" : "down")
    setShown(value)
  }
  return (
    <span className="atk-count" aria-hidden>
      <span key={shown} className="atk-roll" data-dir={dir ?? undefined} data-fresh={dir ? "" : undefined}>
        {shown}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.atk {
  --atk-ink: oklch(.15 0 0);
  --atk-surface: #fff;
  --atk-accent: #0060e2;
  --atk-t1: oklch(.15 0 0);
  --atk-t2: oklch(.46 0 0);
  --atk-t3: oklch(.59 0 0);
  --atk-line: oklch(.935 0 0);
  --atk-hair: oklch(.965 0 0);
  --atk-fill: oklch(.978 0 0);
  --atk-ok: oklch(.49 .19 150);
  --atk-bad: oklch(.54 .21 25);
  --atk-merge: oklch(.5 .2 300);
  --atk-btn: oklch(.33 0 0);
  --atk-btn-fg: #fff;
  --atk-glint: 255 255 255;
  --atk-pop: 0 0 0 1px oklch(0 0 0 / .06), 0 8px 24px -6px oklch(0 0 0 / .18), 0 2px 6px oklch(0 0 0 / .05);
  --atk-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; container-name: atk; width: 100%; max-width: 760px; margin-inline: auto;
  font-family: var(--atk-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 20px; letter-spacing: -.01em; color: var(--atk-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .atk {
  --atk-ink: oklch(.96 0 0);
  --atk-surface: oklch(.2 0 0);
  --atk-accent: #4d8dff;
  --atk-t1: oklch(.96 0 0);
  --atk-t2: oklch(.76 0 0);
  --atk-t3: oklch(.62 0 0);
  --atk-line: oklch(1 0 0 / .1);
  --atk-hair: oklch(1 0 0 / .06);
  --atk-fill: oklch(1 0 0 / .045);
  --atk-ok: oklch(.78 .17 150);
  --atk-bad: oklch(.72 .19 25);
  --atk-merge: oklch(.76 .15 300);
  --atk-btn: oklch(.95 0 0);
  --atk-btn-fg: oklch(.2 0 0);
  --atk-pop: 0 0 0 1px oklch(1 0 0 / .1), 0 12px 28px -6px oklch(0 0 0 / .6);
}
.atk *, .atk *::before, .atk *::after { box-sizing: border-box }
:where(.atk) :is(p, ol, ul, li, h3, dl, dd, form) { margin: 0; padding: 0 }
:where(.atk) :is(ol, ul) { list-style: none }
:where(.atk) button { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.atk :focus-visible { outline: 2px solid color-mix(in oklab, var(--atk-accent) 60%, transparent); outline-offset: 1px }
.atk button:focus:not(:focus-visible), .atk textarea:focus { outline: none }
.atk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.atk-num { font-variant-numeric: tabular-nums }

.atk-panel { background: var(--atk-surface); border: 1px solid var(--atk-line); border-radius: 24px; padding-bottom: 0 }

/* composer */
.atk-composer { padding: 8px 8px 0 }
.atk-field { display: grid; border: 1px solid var(--atk-line); border-radius: 17px; background: var(--atk-surface); transition: border-color .2s var(--atk-ease), box-shadow .2s var(--atk-ease) }
.atk-field:focus-within { border-color: color-mix(in oklab, var(--atk-accent) 38%, var(--atk-line)); box-shadow: 0 0 0 3px color-mix(in oklab, var(--atk-accent) 11%, transparent) }
.atk-textarea { display: block; width: 100%; min-height: 63px; max-height: 200px; resize: none; border: 0; background: transparent; color: var(--atk-t1); font: inherit; font-size: 16px; line-height: 24px; letter-spacing: -.01em; padding: 13px 16px 2px; overflow-y: auto }
.atk-textarea::placeholder { color: var(--atk-t3) }
.atk-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px 8px }
.atk-pickers { display: flex; flex-wrap: wrap; gap: 2px; min-width: 0 }
.atk-chipwrap { position: relative }
.atk-chip { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 6px 0 8px; border-radius: 10px; color: var(--atk-t2); line-height: 14px; max-width: 100%; transition: background-color .16s var(--atk-ease), color .16s var(--atk-ease) }
.atk-chip:hover, .atk-chip[aria-expanded="true"] { background: var(--atk-fill); color: var(--atk-t1) }
.atk-chip-value { display: inline-flex; align-items: center; gap: 6px; min-width: 0 }
.atk-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.atk-chip svg { flex: none }
.atk-chip > svg:last-child { color: var(--atk-t3) }
.atk-menu {
  position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; min-width: 200px; max-width: min(320px, 86vw); padding: 4px; border-radius: 14px;
  background: var(--atk-surface); box-shadow: var(--atk-pop); animation: atk-pop .16s var(--atk-ease) backwards; transform-origin: top left;
}
.atk-menu[data-align="end"] { left: auto; right: 0; transform-origin: top right }
.atk-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 34px; padding: 0 10px; border-radius: 10px; color: var(--atk-t1) }
.atk-menu-item:hover, .atk-menu-item:focus-visible { background: var(--atk-fill); outline: none }
.atk-menu-item[aria-checked="true"] { font-weight: 500 }
.atk-menu-item .atk-menu-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.atk-menu-item svg { flex: none; color: var(--atk-t2) }
@keyframes atk-pop { from { opacity: 0; transform: translateY(-4px) scale(.98) } }
.atk-submit { display: flex; align-items: center; gap: 10px; flex: none }
.atk-kbd { display: inline-flex; gap: 2px; color: var(--atk-t3); font-size: 11px; line-height: 11px; font-weight: 500 }
.atk-key { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 4px; border-radius: 5px; background: var(--atk-surface); color: var(--atk-t2); box-shadow: inset 0 0 0 1px var(--atk-line), 0 1px 0 var(--atk-line) }
.atk-start { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 14px; border-radius: 10px; background: var(--atk-btn); color: var(--atk-btn-fg); font-weight: 500; transition: opacity .2s var(--atk-ease), transform .16s var(--atk-ease) }
.atk-start:disabled { opacity: .3; cursor: default }
.atk-start:not(:disabled):active { transform: scale(.97) }
.atk-error { padding: 6px 16px 0; color: var(--atk-bad); font-size: 12px; line-height: 18px }

/* filters */
.atk-toolbar { display: flex; padding: 12px 12px 6px; min-width: 0 }
.atk-tabs { position: relative; max-width: 100%; border: 1px solid var(--atk-line); border-radius: 18px; background: var(--atk-fill); overflow: hidden }
.atk-tabs-scroll { display: flex; gap: 2px; padding: 3px; overflow-x: auto; scrollbar-width: none; position: relative }
.atk-tabs-scroll::-webkit-scrollbar { display: none }
.atk-tab-thumb { position: absolute; top: 3px; left: 0; height: 36px; width: 0; border-radius: 14px; background: var(--atk-surface); border: 1px solid var(--atk-line); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .035); transition: transform .34s var(--atk-ease), width .34s var(--atk-ease); pointer-events: none }
.atk-tab { position: relative; flex: none; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 14px; font-weight: 500; color: var(--atk-t3); white-space: nowrap; transition: color .16s var(--atk-ease) }
.atk-tab[aria-selected="true"] { color: var(--atk-t1) }
.atk-tab:focus-visible { outline-offset: -2px }
.atk-count { display: inline-flex; overflow: hidden; color: var(--atk-t3); font-weight: 400; font-variant-numeric: tabular-nums; height: 20px }
.atk-roll[data-fresh] { animation: atk-roll-up .3s var(--atk-ease) backwards }
.atk-roll[data-dir="down"][data-fresh] { animation-name: atk-roll-down }
@keyframes atk-roll-up { from { transform: translateY(70%); opacity: 0 } }
@keyframes atk-roll-down { from { transform: translateY(-70%); opacity: 0 } }

/* list */
.atk-list { display: grid; padding: 0 8px 8px }
.atk-empty { padding: 28px 16px 32px; text-align: center; color: var(--atk-t3) }
.atk-card { border-radius: 16px; position: relative; transition: background-color .2s var(--atk-ease) }
.atk-card + .atk-card::before { content: ""; position: absolute; left: 14px; right: 14px; top: 0; height: 1px; background: var(--atk-hair); transition: opacity .2s var(--atk-ease) }
.atk-card:hover, .atk-card[data-open] { background: var(--atk-fill) }
.atk-card:hover::before, .atk-card[data-open]::before, .atk-card:hover + .atk-card::before, .atk-card[data-open] + .atk-card::before { opacity: 0 }
.atk-card[data-new] { animation: atk-card-in .46s var(--atk-ease) backwards, atk-flash 1.4s var(--atk-ease) .1s backwards }
@keyframes atk-card-in { from { opacity: 0; transform: translateY(-8px) scale(.985) } }
@keyframes atk-flash { 0% { background-color: color-mix(in oklab, var(--atk-accent) 11%, transparent) } 100% { background-color: transparent } }
.atk-summary { padding: 14px 14px 12px }
.atk-toggle { display: grid; width: 100%; gap: 4px; border-radius: 8px }
.atk-toggle:focus-visible { outline-offset: 2px }
.atk-title-row { display: flex; align-items: flex-start; gap: 10px }
.atk-title { flex: 1; min-width: 0; font-weight: 500; text-wrap: pretty }
.atk-time { flex: none; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; line-height: 20px; color: var(--atk-t3); font-variant-numeric: tabular-nums }
.atk-chev { transition: transform .34s var(--atk-ease) }
.atk-card[data-open] .atk-chev { transform: rotate(180deg) }
.atk-meta { display: flex; align-items: center; gap: 12px; min-width: 0; font-size: 12px; line-height: 18px; color: var(--atk-t3) }
.atk-meta-item { display: inline-flex; align-items: center; gap: 5px; min-width: 0 }
.atk-meta-item svg { flex: none }
.atk-meta-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0 }
.atk-meta-item { flex: 0 1 auto }
.atk-meta-item[data-shrink] { flex: 1 1 0; max-width: max-content }
.atk-meta-item[data-first] { max-width: 55% }
.atk-meta-item:not([data-shrink]):not([data-first]) { flex: none }
.atk-state-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; margin-top: 10px; min-height: 30px }
.atk-state { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px }
.atk-status { display: inline-flex; align-items: center; gap: 6px; color: var(--atk-t2); min-width: 0 }
.atk-status svg { flex: none }
.atk-status-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.atk-diff { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: var(--atk-t2); font-variant-numeric: tabular-nums }
.atk-diff-n { display: inline-flex; gap: 6px }
.atk-add { color: var(--atk-ok) }
.atk-del { color: var(--atk-bad) }
.atk-bar-diff { display: inline-flex; width: 32px; height: 4px; gap: 1px; border-radius: 9999px; overflow: hidden }
.atk-bar-add { background: var(--atk-ok) }
.atk-bar-del { background: var(--atk-bad) }
.atk-files-n { color: var(--atk-t3) }
.atk-fact { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; line-height: 18px; color: var(--atk-t2) }
.atk-fact svg { flex: none }
.atk-reason { font-size: 12px; line-height: 18px; color: var(--atk-t2); min-width: 0 }
.atk-actions { display: inline-flex; align-items: center; gap: 4px; margin-left: auto }
.atk-pill { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 12px 0 10px; border-radius: 9999px; border: 1px solid var(--atk-line); background: var(--atk-surface); color: var(--atk-t2); font-size: 13px; line-height: 14px; font-weight: 500; white-space: nowrap; transition: background-color .16s var(--atk-ease), color .16s var(--atk-ease), transform .16s var(--atk-ease) }
.atk-pill:hover { background: var(--atk-fill); color: var(--atk-t1) }
.atk-pill:active { transform: scale(.97) }
.atk-pill[data-primary] { background: var(--atk-btn); border-color: var(--atk-btn); color: var(--atk-btn-fg) }
.atk-pill[data-primary]:hover { background: var(--atk-btn); opacity: .9 }
.atk-pill[disabled] { cursor: default; opacity: .85 }
.atk-pr { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px 0 8px; border-radius: 9999px; color: var(--atk-t1); font-size: 13px; line-height: 14px; font-weight: 500; text-decoration: none; white-space: nowrap }
a.atk-pr:hover { background: var(--atk-fill) }
.atk-icon-btn { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 9999px; border: 1px solid transparent; color: var(--atk-t3); transition: background-color .16s var(--atk-ease), color .16s var(--atk-ease) }
.atk-icon-btn:hover { background: var(--atk-fill); color: var(--atk-t1) }

.atk-details-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .38s var(--atk-ease) }
.atk-card[data-open] .atk-details-wrap { grid-template-rows: 1fr }
.atk-details-clip { min-height: 0; overflow: hidden }
.atk-details { margin: 0 14px; padding: 12px 0 14px; border-top: 1px solid var(--atk-line); display: grid; gap: 20px 28px; opacity: 0; transition: opacity .2s var(--atk-ease) }
.atk-card[data-open] .atk-details { opacity: 1; transition-delay: .06s }
.atk-section { display: grid; align-content: start; gap: 4px; min-width: 0 }
.atk-section-title { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; line-height: 18px; font-weight: 500; color: var(--atk-t2) }
.atk-section-count { font-weight: 400; color: var(--atk-t3); font-variant-numeric: tabular-nums }
.atk-steps, .atk-files { display: grid }
.atk-step { padding: 3px 0; animation: atk-step-in .4s var(--atk-ease) backwards }
@keyframes atk-step-in { from { opacity: 0; transform: translateY(3px) } }
.atk-step-row { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; align-items: start; gap: 8px; font-size: 12px; line-height: 18px; color: var(--atk-t2) }
.atk-step-icon { display: grid; place-items: center; height: 18px; color: var(--atk-t3) }
.atk-step-time { color: var(--atk-t3); font-variant-numeric: tabular-nums }
.atk-step-detail { grid-column: 2 / 4; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; line-height: 17px; color: var(--atk-t2); overflow-wrap: anywhere }
.atk-file { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; line-height: 18px }
.atk-file-icon { display: grid; place-items: center; color: var(--atk-t3) }
.atk-path { display: flex; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; line-height: 18px }
.atk-dir { color: var(--atk-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 0 1 auto }
.atk-base { color: var(--atk-t1); white-space: nowrap; flex: none }
.atk-file-stat { display: flex; gap: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; font-variant-numeric: tabular-nums }

.atk-undo { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 8px 8px; padding: 8px 14px; border-radius: 12px; background: var(--atk-fill); color: var(--atk-t2); font-size: 13px; animation: atk-pop .24s var(--atk-ease) backwards }
.atk-undo button { font-weight: 500; color: var(--atk-t1); border-radius: 6px; padding: 0 4px }
.atk-undo-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

/* in place text swaps and shimmer */
.atk-swap { display: inline-grid; min-width: 0; max-width: 100% }
.atk-swap > * { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.atk-swap-out { animation: atk-out .1s var(--atk-ease) forwards; pointer-events: none }
.atk-swap-in[data-fresh] { animation: atk-in .16s var(--atk-ease) backwards }
@keyframes atk-out { to { opacity: 0 } }
@keyframes atk-in { from { opacity: 0; transform: translateY(3px) } }
.atk-shimmer { position: relative }
.atk-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; overflow: hidden; text-overflow: ellipsis; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(var(--atk-glint) / .82) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: atk-sweep 1.6s linear infinite;
}
@keyframes atk-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
.atk-spin { animation: atk-rot .8s linear infinite }
@keyframes atk-rot { to { transform: rotate(360deg) } }
.atk-ok { color: var(--atk-ok) }
.atk-bad { color: var(--atk-bad) }
.atk-merged { color: var(--atk-merge) }

@container atk (min-width: 600px) {
  .atk-details[data-two] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) }
}
@container atk (max-width: 519px) {
  .atk-kbd { display: none }
  .atk-actions { margin-left: 0 }
}
@container atk (max-width: 439px) {
  .atk-title-row { gap: 6px }
}

@media (prefers-reduced-motion: reduce) {
  .atk *, .atk *::before, .atk *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

type MenuOption = { id: string; label: string; mark?: React.ReactNode }

function ChipMenu({ label, value, options, onChange, icon, align }: { label: string; value: string; options: MenuOption[]; onChange: (id: string) => void; icon: React.ReactNode; align?: "end" }) {
  const [open, setOpen] = React.useState(false)
  const wrap = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const items = React.useRef<(HTMLButtonElement | null)[]>([])
  const current = options.find((o) => o.id === value) ?? options[0]

  React.useEffect(() => {
    if (!open) return
    const checked = Math.max(0, options.findIndex((o) => o.id === value))
    items.current[checked]?.focus()
    const down = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [open, options, value])

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }
  const move = (i: number, d: number) => {
    const n = options.length
    items.current[(i + d + n) % n]?.focus()
  }

  return (
    <div className="atk-chipwrap" ref={wrap}>
      <button ref={trigger} type="button" className="atk-chip" aria-haspopup="menu" aria-expanded={open} aria-label={`${label}: ${current?.label}`} onClick={() => setOpen((o) => !o)}>
        <span className="atk-chip-value">
          {current?.mark ?? icon}
          <span className="atk-chip-text">{current?.label}</span>
        </span>
        <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
      </button>
      {open && (
        <div
          className="atk-menu"
          role="menu"
          aria-label={label}
          data-align={align}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              close(true)
            } else if (e.key === "Tab") setOpen(false)
          }}
        >
          {options.map((o, i) => (
            <button
              key={o.id}
              ref={(el) => {
                items.current[i] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={o.id === value}
              className="atk-menu-item"
              onClick={() => {
                onChange(o.id)
                close(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  move(i, 1)
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  move(i, -1)
                } else if (e.key === "Home") {
                  e.preventDefault()
                  move(-1, 1)
                } else if (e.key === "End") {
                  e.preventDefault()
                  move(options.length, -1)
                }
              }}
            >
              {o.mark}
              <span className="atk-menu-label">{o.label}</span>
              {o.id === value ? <Check size={14} strokeWidth={2} aria-hidden /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function splitPath(path: string) {
  const i = path.lastIndexOf("/")
  return i < 0 ? { dir: "", base: path } : { dir: path.slice(0, i + 1), base: path.slice(i + 1) }
}

function TaskCard({
  task,
  now,
  open,
  isNew,
  model,
  pr,
  prBusy,
  prError,
  onToggle,
  onCancel,
  onRetry,
  onArchive,
  onCreatePr,
}: {
  task: AgentTask
  now: number
  open: boolean
  isNew: boolean
  model: AgentModel | undefined
  pr: PullRequest | undefined
  prBusy: boolean
  prError: boolean
  onToggle: () => void
  onCancel: () => void
  onRetry: () => void
  onArchive: () => void
  onCreatePr: () => void
}) {
  const uid = React.useId()
  const elapsed = (isFinished(task.status) ? (task.finishedAt ?? task.startedAt) : now) - task.startedAt
  const files = task.files ?? []
  const added = files.reduce((n, f) => n + f.added, 0)
  const removed = files.reduce((n, f) => n + f.removed, 0)
  const checks = task.checks ?? []
  const failedChecks = checks.filter((c) => c.state === "failed").length
  const pendingChecks = checks.filter((c) => c.state === "pending").length
  const addShare = added + removed ? Math.max(1, Math.round((added / (added + removed)) * 5)) : 0
  const steps = task.steps ?? []
  const live = task.status === "running"
  const word = live ? (task.step ?? "Running") : STATUS_WORD[task.status]
  const prInfo = task.pullRequest ?? pr
  const showDiff = (task.status === "ready" || task.status === "merged") && files.length > 0
  const hasDetails = steps.length > 0 || files.length > 0

  return (
    <li className="atk-card" data-open={open || undefined} data-new={isNew || undefined} data-task={task.id}>
      <div className="atk-summary">
        <button type="button" className="atk-toggle" aria-expanded={open} aria-controls={`${uid}-d`} onClick={onToggle}>
          <span className="atk-title-row">
            <span className="atk-title">{task.title}</span>
            <span className="atk-time">
              <span aria-hidden>{compact(elapsed)}</span>
              <span className="atk-sr">{isFinished(task.status) ? `Took ${spoken(elapsed)}` : `Running for ${spoken(elapsed)}`}</span>
              <ChevronDown className="atk-chev" size={14} strokeWidth={1.8} aria-hidden />
            </span>
          </span>
          <span className="atk-meta">
            <span className="atk-meta-item" data-first>
              <FolderGit2 size={13} strokeWidth={1.6} aria-hidden />
              <span className="atk-meta-text">{task.repo}</span>
            </span>
            <span className="atk-meta-item" data-shrink>
              <GitBranch size={13} strokeWidth={1.6} aria-hidden />
              <span className="atk-meta-text">{task.branch}</span>
            </span>
            {model && (
              <span className="atk-meta-item">
                <ProviderMark provider={model.provider} size={13} />
                <span className="atk-meta-text">{model.short}</span>
              </span>
            )}
          </span>
        </button>

        <div className="atk-state-row">
          <div className="atk-state">
            <span className="atk-status" role="status">
              <StatusGlyph status={task.status} />
              <span className="atk-status-text">
                <Swap text={word} shimmer={live} />
              </span>
            </span>
            {task.status === "failed" && task.error ? <span className="atk-reason">{task.error}</span> : null}
            {showDiff && (
              <span className="atk-diff">
                <span className="atk-sr">{`${added} lines added, ${removed} removed in ${files.length} file${files.length === 1 ? "" : "s"}`}</span>
                <span className="atk-diff-n" aria-hidden>
                  <span className="atk-add">+{added}</span>
                  <span className="atk-del">−{removed}</span>
                </span>
                <span className="atk-bar-diff" aria-hidden>
                  <span className="atk-bar-add" style={{ flex: addShare }} />
                  <span className="atk-bar-del" style={{ flex: 5 - addShare }} />
                </span>
                <span className="atk-files-n" aria-hidden>
                  {files.length} file{files.length === 1 ? "" : "s"}
                </span>
              </span>
            )}
            {showDiff && checks.length > 0 && (
              <span className="atk-fact">
                {failedChecks ? <X className="atk-bad" size={13} strokeWidth={2} aria-hidden /> : pendingChecks ? <Spinner size={13} /> : <Check className="atk-ok" size={13} strokeWidth={2} aria-hidden />}
                {failedChecks ? `${failedChecks} check${failedChecks === 1 ? "" : "s"} failed` : pendingChecks ? "Checks running" : "Checks passed"}
              </span>
            )}
          </div>
          <span className="atk-actions">
            {isRunning(task.status) && (
              <button type="button" className="atk-pill" data-primary-slot onClick={onCancel}>
                <Square size={11} strokeWidth={2} aria-hidden />
                Cancel
              </button>
            )}
            {task.status === "ready" && !prInfo && (
              <button type="button" className="atk-pill" data-primary={prError ? undefined : ""} data-primary-slot onClick={onCreatePr} disabled={prBusy}>
                {prBusy ? <Spinner size={13} /> : <GitPullRequest size={14} strokeWidth={1.8} aria-hidden />}
                <Swap text={prBusy ? "Opening pull request" : prError ? "Try again" : "Create pull request"} />
              </button>
            )}
            {(task.status === "ready" || task.status === "merged") && prInfo && (
              prInfo.url ? (
                <a className="atk-pr" href={prInfo.url} target="_blank" rel="noreferrer" data-primary-slot>
                  <GitPullRequest size={14} strokeWidth={1.8} aria-hidden />
                  {`PR #${prInfo.number} ${prInfo.state ?? "open"}`}
                </a>
              ) : (
                <span className="atk-pr" tabIndex={-1} data-primary-slot>
                  <GitPullRequest size={14} strokeWidth={1.8} aria-hidden />
                  {`PR #${prInfo.number} ${prInfo.state ?? "open"}`}
                </span>
              )
            )}
            {(task.status === "failed" || task.status === "cancelled") && (
              <button type="button" className="atk-pill" data-primary-slot onClick={onRetry}>
                <RotateCw size={13} strokeWidth={1.8} aria-hidden />
                Retry
              </button>
            )}
            {isFinished(task.status) && (
              <button type="button" className="atk-icon-btn" aria-label={`Archive ${task.title}`} title="Archive" onClick={onArchive}>
                <Archive size={15} strokeWidth={1.7} aria-hidden />
              </button>
            )}
          </span>
        </div>
      </div>
      <div className="atk-details-wrap">
        <div className="atk-details-clip" inert={!open}>
          <div className="atk-details" id={`${uid}-d`} data-two={steps.length > 0 && files.length > 0 ? "" : undefined}>
            {steps.length > 0 && (
              <section className="atk-section" aria-label="Steps">
                <h3 className="atk-section-title">
                  Steps<span className="atk-section-count">{steps.length}</span>
                </h3>
                <ol className="atk-steps">
                  {steps.map((s, i) => (
                    <li className="atk-step" key={i}>
                      <span className="atk-step-row">
                        <span className="atk-step-icon" aria-hidden>
                          {s.state === "done" ? <Check size={13} strokeWidth={2} /> : s.state === "active" ? (task.status === "failed" ? <X className="atk-bad" size={13} strokeWidth={2} /> : <Spinner size={13} />) : <span style={{ width: 5, height: 5, borderRadius: 9, background: "currentColor", opacity: 0.45 }} />}
                        </span>
                        <span>
                          <span className="atk-sr">{s.state === "done" ? "Done: " : s.state === "active" ? (task.status === "failed" ? "Failed: " : "In progress: ") : "Pending: "}</span>
                          {s.text}
                        </span>
                        <span className="atk-step-time">{s.seconds !== undefined ? compact(s.seconds * 1000) : ""}</span>
                        {s.detail ? <span className="atk-step-detail">{s.detail}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {files.length > 0 && (
              <section className="atk-section" aria-label="Changed files">
                <h3 className="atk-section-title">
                  Changed files<span className="atk-section-count">{files.length}</span>
                </h3>
                <ul className="atk-files">
                  {files.map((f) => {
                    const { dir, base } = splitPath(f.path)
                    return (
                      <li className="atk-file" key={f.path}>
                        <span className="atk-file-icon" aria-hidden>
                          <FileText size={13} strokeWidth={1.6} />
                        </span>
                        <span className="atk-path">
                          <span className="atk-sr">Changed: </span>
                          {dir ? <span className="atk-dir">{dir}</span> : null}
                          <span className="atk-base">{base}</span>
                        </span>
                        <span className="atk-file-stat">
                          <span className="atk-add">+{f.added}</span>
                          <span className="atk-del">−{f.removed}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
            {!hasDetails && <p className="atk-reason">No steps yet. The log appears as soon as the agent starts.</p>}
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * A home for background coding agents: start a task on a repository and branch, watch each card move from queued to
 * running to ready for review, and open a pull request. Without `tasks` it runs a simulated demo.
 */
export function AgentTasks({
  tasks: controlled,
  repositories = sampleRepositories,
  models = sampleModels,
  onStart,
  onCreatePullRequest,
  onCancel,
  onRetry,
  onArchive,
  defaultFilter = "all",
  className,
}: AgentTasksProps) {
  const isControlled = controlled !== undefined
  const [demo, setDemo] = React.useState<AgentTask[]>(sampleTasks)
  const [prs, setPrs] = React.useState<Record<string, PullRequest>>({})
  const [prBusy, setPrBusy] = React.useState<Record<string, boolean>>({})
  const [prFailed, setPrFailed] = React.useState<Record<string, boolean>>({})
  const [hidden, setHidden] = React.useState<Set<string>>(new Set())
  const [undo, setUndo] = React.useState<{ task: AgentTask; index: number } | null>(null)
  const [filter, setFilter] = React.useState<TaskFilter>(defaultFilter)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const [now, setNow] = React.useState(T0)
  const [note, setNote] = React.useState("")

  const [prompt, setPrompt] = React.useState("")
  const [repoName, setRepoName] = React.useState(repositories[0]?.name ?? "")
  const repo = repositories.find((r) => r.name === repoName) ?? repositories[0]
  const [branch, setBranch] = React.useState(repo?.defaultBranch ?? "main")
  const [modelId, setModelId] = React.useState(models[0]?.id ?? "")
  const [startError, setStartError] = React.useState("")
  const [starting, setStarting] = React.useState(false)

  const timers = React.useRef(new Map<string, number>())
  const prSeq = React.useRef(482)
  const undoTimer = React.useRef<number | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const area = React.useRef<HTMLTextAreaElement>(null)
  const seq = React.useRef(6)

  const list = React.useMemo(() => (isControlled ? controlled : demo).filter((t) => !hidden.has(t.id)), [isControlled, controlled, demo, hidden])
  const modelOf = (id: string) => models.find((m) => m.id === id)

  /* One shared clock, ticking only while something runs */
  const anyRunning = list.some((t) => isRunning(t.status))
  React.useEffect(() => {
    if (!anyRunning) return
    const id = window.setInterval(() => setNow(clock()), 1000)
    return () => window.clearInterval(id)
  }, [anyRunning])

  React.useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      t.clear()
      if (undoTimer.current) window.clearTimeout(undoTimer.current)
    }
  }, [])

  const patch = React.useCallback((id: string, fn: (t: AgentTask) => AgentTask) => setDemo((l) => l.map((t) => (t.id === id ? fn(t) : t))), [])

  /* The simulated run: one chained timer per task, cleared on cancel, retry and unmount */
  const schedule = React.useCallback((id: string, ms: number, fn: () => void) => {
    const prev = timers.current.get(id)
    if (prev) window.clearTimeout(prev)
    timers.current.set(
      id,
      window.setTimeout(() => {
        timers.current.delete(id)
        fn()
      }, ms),
    )
  }, [])

  const simulate = React.useCallback(
    (id: string) => {
      const finish = () => {
        const pool = FILE_POOL.slice((seq.current * 2) % 4, ((seq.current * 2) % 4) + 4)
        patch(id, (t) => ({
          ...t,
          status: "ready",
          finishedAt: clock(),
          step: undefined,
          steps: (t.steps ?? []).map((s) => ({ ...s, state: "done" as const, seconds: s.seconds ?? 20 })),
          files: pool,
          checks: [
            { name: "Unit tests", state: "passed" },
            { name: "Lint", state: "passed" },
          ],
        }))
        setNote("A task is ready for review.")
      }
      const stepAt = (i: number) => {
        if (i >= PROCESS_STEPS.length) return finish()
        const text = PROCESS_STEPS[i]
        patch(id, (t) => ({
          ...t,
          status: "running",
          step: text,
          steps: [...(t.steps ?? []).map((s) => (s.state === "active" ? { ...s, state: "done" as const, seconds: 6 + ((i * 7) % 19) } : s)), { text, state: "active" as const }],
        }))
        schedule(id, 2300, () => stepAt(i + 1))
      }
      schedule(id, 1300, () => {
        patch(id, (t) => ({ ...t, status: "setting-up", steps: [{ text: `Cloned ${t.repo}`, state: "active" }] }))
        schedule(id, 1900, () => stepAt(0))
      })
    },
    [patch, schedule],
  )

  const start = async () => {
    const text = prompt.trim()
    if (!text || starting || !repo) return
    setStartError("")
    const request: StartRequest = { prompt: text, repo: repo.name, branch, model: modelId }
    setStarting(true)
    try {
      await onStart?.(request)
    } catch (e) {
      setStarting(false)
      setStartError(e instanceof Error && e.message ? e.message : "The task could not be started. Your prompt is still here.")
      return
    }
    setStarting(false)
    setPrompt("")
    if (area.current) area.current.style.height = ""
    if (isControlled) return
    const id = `t${++seq.current}`
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28)
    const task: AgentTask = {
      id,
      title: text.length > 90 ? `${text.slice(0, 87)}…` : text,
      repo: repo.name,
      branch: `agent/${slug || "task"}`,
      baseBranch: branch,
      model: modelId,
      status: "queued",
      startedAt: clock(),
    }
    setNow(clock())
    setDemo((l) => [task, ...l])
    setFreshId(id)
    setFilter((f) => (f === "review" || f === "merged" ? "all" : f))
    setNote("Task started. This preview simulates the run.")
    simulate(id)
  }

  /* Actions */
  const focusPrimary = (id: string) =>
    requestAnimationFrame(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(`[data-task="${id}"] [data-primary-slot]`)
      if (el && "focus" in el) el.focus()
      else rootRef.current?.querySelector<HTMLElement>(`[data-task="${id}"] .atk-toggle`)?.focus()
    })

  const cancel = (task: AgentTask) => {
    onCancel?.(task)
    if (!isControlled) {
      const id = timers.current.get(task.id)
      if (id) window.clearTimeout(id)
      timers.current.delete(task.id)
      patch(task.id, (t) => ({ ...t, status: "cancelled", finishedAt: clock(), step: undefined }))
    }
    setNote(`Cancelled: ${task.title}.${isControlled ? "" : " This preview simulates the run."}`)
    focusPrimary(task.id)
  }
  const retry = (task: AgentTask) => {
    onRetry?.(task)
    if (!isControlled) {
      setNow(clock())
      patch(task.id, (t) => ({ ...t, status: "queued", startedAt: clock(), finishedAt: undefined, error: undefined, step: undefined, steps: [], files: undefined, checks: undefined }))
      simulate(task.id)
    }
    setNote(`Retrying: ${task.title}.`)
    focusPrimary(task.id)
  }
  const archive = (task: AgentTask) => {
    const index = list.findIndex((t) => t.id === task.id)
    const neighbour = list[index + 1] ?? list[index - 1]
    onArchive?.(task)
    setHidden((h) => new Set(h).add(task.id))
    if (openId === task.id) setOpenId(null)
    setUndo({ task, index })
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 6000)
    setNote(`Archived: ${task.title}. Undo is available for six seconds.`)
    if (neighbour) requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-task="${neighbour.id}"] .atk-toggle`)?.focus())
  }
  const undoArchive = () => {
    if (!undo) return
    setHidden((h) => {
      const n = new Set(h)
      n.delete(undo.task.id)
      return n
    })
    setNote(`Restored: ${undo.task.title}.`)
    setUndo(null)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
  }
  const createPr = async (task: AgentTask) => {
    setPrBusy((b) => ({ ...b, [task.id]: true }))
    setPrFailed((f) => ({ ...f, [task.id]: false }))
    setNote("Opening a pull request.")
    try {
      let result: PullRequest
      if (onCreatePullRequest) result = await onCreatePullRequest(task)
      else {
        await new Promise((r) => setTimeout(r, 1300))
        result = { number: prSeq.current++, state: "open" }
        setNote(`Pull request ${result.number} opened. This preview simulates it.`)
      }
      setPrs((p) => ({ ...p, [task.id]: result }))
      if (onCreatePullRequest) setNote(`Pull request ${result.number} opened.`)
    } catch {
      setPrFailed((f) => ({ ...f, [task.id]: true }))
      setNote("The pull request could not be opened. Try again.")
    }
    setPrBusy((b) => ({ ...b, [task.id]: false }))
    focusPrimary(task.id)
  }

  /* Filters */
  const counts = {
    all: list.length,
    running: list.filter((t) => isRunning(t.status)).length,
    review: list.filter((t) => t.status === "ready").length,
    merged: list.filter((t) => t.status === "merged").length,
  }
  const visible = list.filter((t) => (filter === "all" ? true : filter === "running" ? isRunning(t.status) : filter === "review" ? t.status === "ready" : t.status === "merged"))
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const thumb = React.useRef<HTMLSpanElement>(null)
  const scroller = React.useRef<HTMLDivElement>(null)
  const place = React.useCallback(() => {
    const idx = TABS.findIndex((t) => t.id === filter)
    const el = tabRefs.current[idx]
    const th = thumb.current
    if (!el || !th) return
    th.style.width = `${el.offsetWidth}px`
    th.style.transform = `translateX(${el.offsetLeft}px)`
  }, [filter])
  React.useLayoutEffect(() => {
    place()
    const sc = scroller.current
    if (!sc) return
    const ro = new ResizeObserver(place)
    ro.observe(sc)
    tabRefs.current.forEach((t) => t && ro.observe(t))
    return () => ro.disconnect()
  }, [place, counts.all, counts.running, counts.review, counts.merged])
  React.useEffect(() => {
    // Bring the active tab into view inside the tab strip only – scrollIntoView would also scroll the page.
    const idx = TABS.findIndex((t) => t.id === filter)
    const tab = tabRefs.current[idx]
    const sc = scroller.current
    if (!tab || !sc) return
    const t = tab.getBoundingClientRect()
    const s = sc.getBoundingClientRect()
    if (t.left < s.left) sc.scrollLeft -= s.left - t.left
    else if (t.right > s.right) sc.scrollLeft += t.right - s.right
  }, [filter])

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = TABS.length - 1
    if (n < 0) return
    e.preventDefault()
    setFilter(TABS[n].id)
    tabRefs.current[n]?.focus()
  }

  const repoOptions: MenuOption[] = repositories.map((r) => ({ id: r.name, label: r.name }))
  const branchOptions: MenuOption[] = (repo?.branches ?? []).map((b) => ({ id: b, label: b }))
  const modelOptions: MenuOption[] = models.map((m) => ({ id: m.id, label: m.name, mark: <ProviderMark provider={m.provider} /> }))
  const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"

  return (
    <div ref={rootRef} className={"atk" + (className ? " " + className : "")}>
      <style href="agent-tasks" precedence="default">
        {CSS}
      </style>
      <div className="atk-panel">
        <form
          className="atk-composer"
          onSubmit={(e) => {
            e.preventDefault()
            void start()
          }}
        >
          <div className="atk-field">
            <label className="atk-sr" htmlFor="atk-prompt">
              Describe a task
            </label>
            <textarea
              id="atk-prompt"
              ref={area}
              className="atk-textarea"
              rows={2}
              placeholder="Describe a task"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                setStartError("")
                e.target.style.height = "auto"
                e.target.style.height = `${Math.min(200, e.target.scrollHeight)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void start()
                }
              }}
            />
            <div className="atk-bar">
              <div className="atk-pickers">
                <ChipMenu
                  label="Repository"
                  value={repo?.name ?? ""}
                  options={repoOptions}
                  icon={<FolderGit2 size={14} strokeWidth={1.6} aria-hidden />}
                  onChange={(id) => {
                    setRepoName(id)
                    setBranch(repositories.find((r) => r.name === id)?.defaultBranch ?? "main")
                  }}
                />
                <ChipMenu label="Branch" value={branch} options={branchOptions} icon={<GitBranch size={14} strokeWidth={1.6} aria-hidden />} onChange={setBranch} />
                <ChipMenu label="Model" value={modelId} options={modelOptions} icon={<Sparkles size={14} strokeWidth={1.6} aria-hidden />} onChange={setModelId} />
              </div>
              <div className="atk-submit">
                <span className="atk-kbd" aria-hidden>
                  <span className="atk-key">{mod}</span>
                  <span className="atk-key">
                    <CornerDownLeft size={10} strokeWidth={2} />
                  </span>
                </span>
                <button type="submit" className="atk-start" disabled={!prompt.trim() || starting}>
                  <Swap text={starting ? "Starting" : "Start"} />
                </button>
              </div>
            </div>
          </div>
          {startError ? (
            <p className="atk-error" role="alert">
              {startError}
            </p>
          ) : null}
        </form>

        <div className="atk-toolbar">
          <div className="atk-tabs">
            <div className="atk-tabs-scroll" role="tablist" aria-label="Filter tasks" ref={scroller}>
              <span className="atk-tab-thumb" ref={thumb} aria-hidden />
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  aria-selected={filter === t.id}
                  tabIndex={filter === t.id ? 0 : -1}
                  className="atk-tab"
                  onClick={() => setFilter(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {t.label}
                  <Roll value={counts[t.id]} />
                  <span className="atk-sr">{`, ${counts[t.id]}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className="atk-list" aria-label="Tasks">
          {visible.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              now={now}
              open={openId === t.id}
              isNew={freshId === t.id}
              model={modelOf(t.model)}
              pr={prs[t.id]}
              prBusy={!!prBusy[t.id]}
              prError={!!prFailed[t.id]}
              onToggle={() => setOpenId((c) => (c === t.id ? null : t.id))}
              onCancel={() => cancel(t)}
              onRetry={() => retry(t)}
              onArchive={() => archive(t)}
              onCreatePr={() => void createPr(t)}
            />
          ))}
          {visible.length === 0 && <li className="atk-empty">{list.length === 0 ? "No tasks yet. Describe one above and press Start." : "Nothing in this view yet."}</li>}
        </ul>
        {undo && (
          <div className="atk-undo" role="status">
            <span className="atk-undo-text">Archived “{undo.task.title}”</span>
            <button type="button" onClick={undoArchive}>
              Undo
            </button>
          </div>
        )}
      </div>
      <p className="atk-sr" role="status" aria-live="polite">
        {note}
      </p>
    </div>
  )
}

export default AgentTasks
