"use client"

import * as React from "react"
import { Check, ChevronDown, Copy, Diamond, FileText, Globe, Hexagon, PenLine, Play, RotateCw, Search, Sparkles, Square, TriangleAlert, Zap, Circle as CircleIcon, Triangle } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OrchestratorSubtask = {
  id: string
  /** Heads the lane. */
  title: string
  /** The line the lead writes in its plan; also shown on the lane until it starts. */
  instruction?: string
  /** Lands on the worker with this id; otherwise on the next free worker. */
  workerId?: string
}

export type OrchestratorWorker = { id: string; name: string; mark?: React.ReactNode }

export type OrchestratorLead = { name: string; mark?: React.ReactNode }

/** Everything a run hook can yield. `usage` is an increment; leave `subtaskId` out for the lead's own tokens. */
export type OrchestratorEvent =
  | { type: "plan"; subtask: OrchestratorSubtask }
  | { type: "dispatch"; subtaskId: string }
  | { type: "tool"; subtaskId: string; tool: string; target?: string }
  | { type: "toolResult"; subtaskId: string; detail?: string }
  | { type: "output"; subtaskId: string; delta: string; newLine?: boolean }
  | { type: "usage"; subtaskId?: string; tokens: number; cost: number }
  | { type: "error"; subtaskId: string; message: string; retryInMs?: number }
  | { type: "retry"; subtaskId: string }
  | { type: "result"; subtaskId: string; text: string }
  | { type: "fail"; subtaskId: string; message: string }
  | { type: "summary"; delta: string }
  | { type: "done" }

export type OrchestratorRunContext = {
  goal: string
  plan: OrchestratorSubtask[]
  workers: OrchestratorWorker[]
  /** Live concurrency limit. Read it before every dispatch: raising it mid run releases queued lanes. */
  concurrency: () => number
  /** Aborts on Stop, on Run again and on unmount. */
  signal: AbortSignal
}

export type OrchestratorRun = (context: OrchestratorRunContext) => AsyncIterable<OrchestratorEvent>

export type OrchestratorLaneResult = {
  id: string
  subtask: string
  worker: string
  status: "returned" | "failed" | "stopped" | "pending"
  text: string
  tokens: number
  cost: number
  ms: number
}

export type OrchestratorResult = {
  summary: string
  tokens: number
  cost: number
  wallMs: number
  sequentialMs: number
  speedup: number
  lanes: OrchestratorLaneResult[]
}

export type AgentOrchestratorProps = {
  /** What the lead agent is asked to do. Shown as the card heading and passed to the run hook. */
  goal?: string
  /** Subtasks handed to the run hook. The built-in simulation writes this plan; your hook may yield its own. */
  plan?: OrchestratorSubtask[]
  /** The worker lanes in order. Up to four sit side by side; more always stack. */
  workers?: OrchestratorWorker[]
  /** The lead agent, shown at the top of the flow and again on the summary. */
  lead?: OrchestratorLead
  /** The run hook, usually an async generator. Without it the block plays a local simulation and says so. */
  run?: OrchestratorRun
  /** Controlled concurrency limit from 1 to 4. */
  concurrency?: number
  /** Starting limit when uncontrolled. Defaults to the number of workers, at most 4. */
  defaultConcurrency?: number
  onConcurrencyChange?: (value: number) => void
  /** Start the first run when the block scrolls into view. Never starts on its own with reduced motion. */
  autoStart?: boolean
  /** Called once per finished run, after the summary has landed. */
  onComplete?: (result: OrchestratorResult) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const MARKS = [Hexagon, Triangle, CircleIcon, Diamond]

function WorkerMark({ index }: { index: number }) {
  const Icon = MARKS[index % MARKS.length]
  return <Icon size={13} strokeWidth={1.8} aria-hidden />
}

const DEFAULT_LEAD: OrchestratorLead = { name: "Nova Large", mark: <Sparkles size={15} strokeWidth={1.8} aria-hidden /> }

const DEFAULT_WORKERS: OrchestratorWorker[] = [
  { id: "atlas", name: "Atlas 2" },
  { id: "sage", name: "Sage Mini" },
  { id: "orbit", name: "Orbit Flash" },
  { id: "nova", name: "Nova Mini" },
]

export const samplePlan: OrchestratorSubtask[] = [
  { id: "setup", title: "Orbit setup guide", instruction: "Walk Orbit's setup guide and note every step that needs a second tool", workerId: "atlas" },
  { id: "api", title: "Fathom API reference", instruction: "Check how Fathom documents errors, pagination and rate limits", workerId: "sage" },
  { id: "price", title: "Tandem pricing FAQ", instruction: "Read Tandem's pricing FAQ and list the questions ours leaves open", workerId: "orbit" },
  { id: "move", title: "Halo migration guides", instruction: "Compare Halo's migration guides with our import docs", workerId: "nova" },
]

type Script = { steps: { tool: string; target: string; note: string; tokens: number }[]; result: string; fail?: number }

const SCRIPTS: Record<string, Script> = {
  setup: {
    steps: [
      { tool: "Search web", target: "orbit docs setup guide", note: "Eight steps, two of them need the CLI", tokens: 4200 },
      { tool: "Fetch page", target: "orbit.example/docs/setup", note: "The guide lists prerequisites at the very end", tokens: 9800 },
      { tool: "Read file", target: "docs/getting-started.md", note: "Ours splits setup across three pages", tokens: 8600 },
      { tool: "Write findings", target: "", note: "Orbit puts prerequisites first and ours buries them", tokens: 5400 },
    ],
    result: "Orbit lists prerequisites before step one and shows a working result after every step. Ours hides them on page three.",
  },
  api: {
    steps: [
      { tool: "Search web", target: "fathom api errors pagination", note: "Errors share one documented shape", tokens: 3900 },
      { tool: "Fetch page", target: "fathom.example/api/errors", note: "Each error links to a fix", tokens: 7600 },
      { tool: "Read file", target: "docs/api/errors.md", note: "We document codes but not what to do next", tokens: 7200 },
      { tool: "Write findings", target: "", note: "Fathom pairs every error with a remedy line", tokens: 4800 },
    ],
    result: "Fathom pairs every error code with one line on how to fix it. Our reference lists the codes and stops there.",
  },
  price: {
    steps: [
      { tool: "Search web", target: "tandem pricing faq", note: "Fourteen questions, grouped by plan", tokens: 5100 },
      { tool: "Fetch page", target: "tandem.example/pricing/faq", note: "Seat limits and overage are answered up front", tokens: 11200 },
      { tool: "Read file", target: "docs/pricing-faq.md", note: "Ours has six questions and no overage answer", tokens: 8400 },
      { tool: "Write findings", target: "", note: "Overage and seat limits are the gap", tokens: 6100 },
    ],
    fail: 1,
    result: "Tandem answers seat limits and overage in the first two questions. We never explain what happens past the limit.",
  },
  move: {
    steps: [
      { tool: "Search web", target: "halo migration guide import", note: "One guide per source product", tokens: 3600 },
      { tool: "Fetch page", target: "halo.example/migrate", note: "Each guide ends with a verification checklist", tokens: 9100 },
      { tool: "Read file", target: "docs/import.md", note: "We have one generic import page", tokens: 7900 },
      { tool: "Write findings", target: "", note: "Per source guides and a checklist, nothing more", tokens: 5000 },
    ],
    result: "Halo writes one guide per source product and ends each with a checklist. We have one generic page.",
  },
}

const SUMMARY_TEXT =
  "Our docs bury the basics that all four peers put first. Three changes would close most of the gap:\n- Move prerequisites to the top of every setup page.\n- Add a fix line to each error in the API reference.\n- Answer overage and seat limits in the pricing FAQ, then write one import guide per source product."

const RATES = [18, 3.2, 4.4, 2.6] // dollars per million tokens, illustrative

function abortable(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"))
    const id = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(id)
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

/** The default run hook: plans, dispatches up to the live concurrency limit, runs scripted tool calls, retries one failed fetch, then streams a summary. */
export async function* simulateOrchestration(context: OrchestratorRunContext): AsyncGenerator<OrchestratorEvent> {
  const { plan, signal, workers } = context
  const queue: OrchestratorEvent[] = []
  let wake = null as (() => void) | null
  const push = (e: OrchestratorEvent) => {
    queue.push(e)
    wake?.()
    wake = null
  }
  const wait = (ms: number) => abortable(ms, signal)

  yield { type: "usage", tokens: 2400, cost: 0.036 }
  for (const subtask of plan) {
    await wait(620)
    yield { type: "plan", subtask }
  }
  await wait(450)

  let active = 0
  let finished = 0
  let failure: unknown = null
  const total = plan.length

  const runLane = async (subtask: OrchestratorSubtask, index: number) => {
    const script = SCRIPTS[subtask.id] ?? {
      steps: [
        { tool: "Search web", target: subtask.title.toLowerCase(), note: "Found the relevant pages", tokens: 4000 },
        { tool: "Fetch page", target: "example.com", note: "Read the page", tokens: 8000 },
        { tool: "Read file", target: "docs/notes.md", note: "Compared with our notes", tokens: 7000 },
        { tool: "Write findings", target: "", note: "Wrote up the difference", tokens: 5000 },
      ],
      result: `Finished ${subtask.title.toLowerCase()}.`,
    }
    const workerIndex = Math.max(0, workers.findIndex((w) => w.id === subtask.workerId))
    const rate = RATES[(workerIndex >= 0 ? workerIndex : index) % RATES.length] / 1_000_000
    push({ type: "dispatch", subtaskId: subtask.id })
    await wait(620 + index * 40) // let the packet land before the lane starts
    for (let s = 0; s < script.steps.length; s++) {
      const step = script.steps[s]
      push({ type: "tool", subtaskId: subtask.id, tool: step.tool, target: step.target || undefined })
      if (script.fail === s) {
        await wait(900)
        push({ type: "error", subtaskId: subtask.id, message: "503 from the server", retryInMs: 2000 })
        await wait(2000)
        push({ type: "retry", subtaskId: subtask.id })
        push({ type: "tool", subtaskId: subtask.id, tool: step.tool, target: step.target || undefined })
      }
      const words = step.note.split(" ")
      for (let w = 0; w < words.length; w++) {
        await wait(150 + ((index * 37 + w * 53) % 90))
        push({ type: "output", subtaskId: subtask.id, delta: (w ? " " : "") + words[w], newLine: w === 0 })
      }
      await wait(260 + index * 70)
      push({ type: "usage", subtaskId: subtask.id, tokens: step.tokens, cost: step.tokens * rate })
      push({ type: "toolResult", subtaskId: subtask.id })
    }
    push({ type: "result", subtaskId: subtask.id, text: script.result })
  }

  const launcher = (async () => {
    try {
      const jobs: Promise<void>[] = []
      for (let i = 0; i < plan.length; i++) {
        while (active >= Math.max(1, context.concurrency())) await wait(120)
        active++
        const job = runLane(plan[i], i)
          .catch((e) => {
            if (!(e instanceof DOMException && e.name === "AbortError")) failure = e
          })
          .finally(() => {
            active--
            finished++
            wake?.()
            wake = null
          })
        jobs.push(job)
        await wait(180)
      }
      await Promise.all(jobs)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) failure = e
    } finally {
      finished = total
      wake?.()
      wake = null
    }
  })()

  while (!signal.aborted) {
    while (queue.length) yield queue.shift() as OrchestratorEvent
    if (finished >= total && !queue.length) break
    await new Promise<void>((r) => {
      wake = r
    })
  }
  await launcher
  if (failure) throw failure
  if (signal.aborted) return

  yield { type: "usage", tokens: 3100, cost: 0.047 }
  const words = SUMMARY_TEXT.split(/(?<=\s)/)
  for (let i = 0; i < words.length; i += 3) {
    await wait(70)
    yield { type: "summary", delta: words.slice(i, i + 3).join("") }
  }
  await wait(250)
  yield { type: "done" }
}

/* -------------------------------------------------------------------------- */
/*                                    State                                   */
/* -------------------------------------------------------------------------- */

type LaneStatus = "planned" | "starting" | "running" | "error" | "returned" | "failed" | "stopped"
type LogRow = { kind: "tool" | "error" | "retry" | "result" | "fail"; title: string; target?: string; detail?: string; done?: boolean }

type Lane = {
  id: string
  title: string
  instruction?: string
  worker: number
  status: LaneStatus
  tool?: string
  target?: string
  toolCalls: number
  attempt: number
  retrying: boolean
  output: string
  tokens: number
  cost: number
  startedAt: number | null
  endedAt: number | null
  elapsed: number
  retryAt: number | null
  message?: string
  text?: string
  log: LogRow[]
}

type Phase = "idle" | "planning" | "running" | "merging" | "done" | "stopped"

type State = {
  phase: Phase
  lanes: Lane[]
  leadTokens: number
  leadCost: number
  summary: string[]
  startedAt: number
  endedAt: number
  now: number
  firstDispatch: number | null
  lastReturn: number | null
  runId: number
  note: string
}

const INITIAL: State = { phase: "idle", lanes: [], leadTokens: 0, leadCost: 0, summary: [], startedAt: 0, endedAt: 0, now: 0, firstDispatch: null, lastReturn: null, runId: 0, note: "" }

type Action =
  | { type: "begin"; at: number }
  | { type: "event"; ev: OrchestratorEvent; at: number; workerIds: string[]; workerNames: string[] }
  | { type: "tick"; at: number }
  | { type: "stop"; at: number; error?: string }

const isActive = (s: LaneStatus) => s === "starting" || s === "running" || s === "error"
const isTerminal = (s: LaneStatus) => s === "returned" || s === "failed" || s === "stopped"

function patchLane(lanes: Lane[], id: string, fn: (l: Lane) => Lane): Lane[] {
  return lanes.map((l) => (l.id === id ? fn(l) : l))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "begin":
      return { ...INITIAL, phase: "planning", startedAt: action.at, now: action.at, runId: state.runId + 1, note: "The lead is writing a plan." }
    case "tick": {
      const lanes = state.lanes.map((l) => (isActive(l.status) && l.startedAt !== null ? { ...l, elapsed: action.at - l.startedAt } : l))
      return { ...state, now: action.at, lanes }
    }
    case "stop": {
      const lanes = state.lanes.map((l) => (isTerminal(l.status) ? l : { ...l, status: "stopped" as const, endedAt: action.at, retryAt: null }))
      return { ...state, phase: "stopped", lanes, endedAt: action.at, now: action.at, note: action.error ? `The run stopped: ${action.error}` : "Run stopped." }
    }
    case "event": {
      if (state.phase === "idle" || state.phase === "stopped") return state
      const { ev, at } = action
      switch (ev.type) {
        case "plan": {
          const used = new Set(state.lanes.map((l) => l.worker))
          let w = ev.subtask.workerId ? action.workerIds.indexOf(ev.subtask.workerId) : -1
          if (w < 0 || used.has(w)) {
            w = action.workerIds.findIndex((_, i) => !used.has(i))
            if (w < 0) w = state.lanes.length % Math.max(1, action.workerIds.length)
          }
          const lane: Lane = { id: ev.subtask.id, title: ev.subtask.title, instruction: ev.subtask.instruction, worker: w, status: "planned", toolCalls: 0, attempt: 1, retrying: false, output: "", tokens: 0, cost: 0, startedAt: null, endedAt: null, elapsed: 0, retryAt: null, log: [] }
          return { ...state, lanes: [...state.lanes, lane], note: `Planned: ${ev.subtask.title}.` }
        }
        case "dispatch": {
          const lane = state.lanes.find((l) => l.id === ev.subtaskId)
          if (!lane) return state
          const name = action.workerNames[lane.worker] ?? "a worker"
          return {
            ...state,
            phase: "running",
            firstDispatch: state.firstDispatch ?? at,
            lanes: patchLane(state.lanes, lane.id, (l) => ({ ...l, status: "starting", startedAt: at, elapsed: 0, output: l.instruction ?? "" })),
            note: `Dispatched ${lane.title} to ${name}.`,
          }
        }
        case "tool":
          return {
            ...state,
            lanes: patchLane(state.lanes, ev.subtaskId, (l) => {
              const title = l.retrying ? `${ev.tool}, attempt ${l.attempt}` : ev.tool
              return {
                ...l,
                status: "running",
                tool: title,
                target: ev.target,
                toolCalls: l.retrying ? l.toolCalls : l.toolCalls + 1,
                retrying: false,
                retryAt: null,
                message: undefined,
                log: [...l.log, { kind: "tool", title, target: ev.target }],
              }
            }),
          }
        case "toolResult":
          return {
            ...state,
            lanes: patchLane(state.lanes, ev.subtaskId, (l) => {
              const log = [...l.log]
              for (let i = log.length - 1; i >= 0; i--)
                if (log[i].kind === "tool" && !log[i].done) {
                  log[i] = { ...log[i], done: true, detail: ev.detail ?? l.output }
                  break
                }
              return { ...l, log }
            }),
          }
        case "output":
          return { ...state, lanes: patchLane(state.lanes, ev.subtaskId, (l) => ({ ...l, output: ev.newLine ? ev.delta : l.output + ev.delta })) }
        case "usage": {
          if (!ev.subtaskId) return { ...state, leadTokens: state.leadTokens + ev.tokens, leadCost: state.leadCost + ev.cost }
          return { ...state, lanes: patchLane(state.lanes, ev.subtaskId, (l) => ({ ...l, tokens: l.tokens + ev.tokens, cost: l.cost + ev.cost })) }
        }
        case "error":
          return {
            ...state,
            lanes: patchLane(state.lanes, ev.subtaskId, (l) => ({
              ...l,
              status: "error",
              message: ev.message,
              retryAt: ev.retryInMs ? at + ev.retryInMs : null,
              log: [...l.log, { kind: "error", title: ev.message }],
            })),
            note: `${state.lanes.find((l) => l.id === ev.subtaskId)?.title ?? "A lane"} failed: ${ev.message}.${ev.retryInMs ? ` Retrying in ${Math.round(ev.retryInMs / 1000)} seconds.` : ""}`,
          }
        case "retry":
          return {
            ...state,
            lanes: patchLane(state.lanes, ev.subtaskId, (l) => ({ ...l, attempt: l.attempt + 1, retrying: true, status: "running", retryAt: null, log: [...l.log, { kind: "retry", title: `Retry ${l.attempt}` }] })),
          }
        case "result":
        case "fail": {
          const failed = ev.type === "fail"
          const lanes = patchLane(state.lanes, ev.subtaskId, (l) => ({
            ...l,
            status: failed ? ("failed" as const) : ("returned" as const),
            endedAt: at,
            elapsed: l.startedAt === null ? 0 : at - l.startedAt,
            text: failed ? undefined : ev.text,
            message: failed ? ev.message : undefined,
            retryAt: null,
            log: [...l.log, { kind: failed ? "fail" : "result", title: failed ? "Gave up" : "Returned", detail: failed ? ev.message : ev.text }],
          }))
          const lane = lanes.find((l) => l.id === ev.subtaskId)
          const all = lanes.length > 0 && lanes.every((l) => isTerminal(l.status))
          return {
            ...state,
            lanes,
            lastReturn: at,
            phase: all ? "merging" : state.phase,
            note: `${lane?.title ?? "A lane"} ${failed ? "gave up" : "returned"}.${all ? " The lead is merging the results." : ""}`,
          }
        }
        case "summary":
          return { ...state, phase: "merging", summary: [...state.summary, ev.delta], note: state.summary.length ? state.note : "The lead is writing the summary." }
        case "done": {
          const t = state.lanes.reduce((n, l) => n + l.tokens, state.leadTokens)
          const c = state.lanes.reduce((n, l) => n + l.cost, state.leadCost)
          return { ...state, phase: "done", endedAt: at, now: at, note: `Done in ${((at - state.startedAt) / 1000).toFixed(1)} seconds. ${formatTokens(t)} tokens, ${formatCost(c)}.` }
        }
      }
      return state
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const formatTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)))
const formatCost = (n: number) => `$${n.toFixed(3)}`
const formatTime = (ms: number) => `${(Math.max(0, ms) / 1000).toFixed(1)}s`

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

function toolIcon(tool: string | undefined) {
  const t = (tool ?? "").toLowerCase()
  if (t.startsWith("search")) return <Search size={13} strokeWidth={1.7} aria-hidden />
  if (t.startsWith("fetch")) return <Globe size={13} strokeWidth={1.7} aria-hidden />
  if (t.startsWith("read")) return <FileText size={13} strokeWidth={1.7} aria-hidden />
  return <PenLine size={13} strokeWidth={1.7} aria-hidden />
}

function Spinner() {
  return (
    <svg className="aor-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.5" />
      <path d="M7 1.75a5.25 5.25 0 0 1 5.25 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function Ring({ kind }: { kind: "idle" | "done" | "error" | "stop" | "dot" }) {
  if (kind === "done")
    return (
      <svg className="aor-ok" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="6" fill="currentColor" />
        <path d="m4.4 7.2 1.9 1.9 3.3-3.8" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (kind === "error") return <TriangleAlert className="aor-err" size={14} strokeWidth={1.8} aria-hidden />
  if (kind === "stop")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" />
        <rect x="4.9" y="4.9" width="4.2" height="4.2" rx="1" fill="currentColor" />
      </svg>
    )
  if (kind === "dot")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.2 2" />
        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
      </svg>
    )
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** Text that changes in place: the old one fades out, the new one fades in from 2px below. */
function Swap({ text, shimmer, className }: { text: string; shimmer?: boolean; className?: string }) {
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
    <span className={"aor-swap" + (className ? " " + className : "")}>
      {leaving !== null && (
        <span key={`o-${leaving}`} className="aor-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`i-${shown}`} className={"aor-swap-in" + (shimmer ? " aor-shimmer" : "")} data-text={shown} data-fresh={leaving !== null || undefined}>
        {shown}
      </span>
    </span>
  )
}

/** A number that counts to each new value; the text is written straight to the DOM, so a busy run does not re-render lanes per tick. */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(value)
  const reduced = useReducedMotion()
  const [initial] = React.useState(() => format(value))
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    if (from === value) return
    if (reduced) {
      shown.current = value
      el.textContent = format(value)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 420)
      const v = from + (value - from) * (1 - Math.pow(1 - p, 3))
      shown.current = v
      el.textContent = format(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, format, reduced])
  return (
    <span ref={ref} className="aor-num">
      {initial}
    </span>
  )
}

/** Words that arrive in chunks of a few words, each chunk only fading in. */
function StreamText({ text, stream }: { text: string; stream: boolean }) {
  const words = React.useMemo(() => text.split(/(?<=\s)/), [text])
  const [count, setCount] = React.useState(stream ? 0 : Math.ceil(words.length / 3))
  const total = Math.ceil(words.length / 3)
  React.useEffect(() => {
    if (!stream || count >= total) return
    const id = window.setTimeout(() => setCount((c) => c + 1), 55)
    return () => window.clearTimeout(id)
  }, [stream, count, total])
  const chunks: string[] = []
  for (let i = 0; i < Math.min(count, total); i++) chunks.push(words.slice(i * 3, i * 3 + 3).join(""))
  return (
    <>
      {chunks.map((c, i) => (
        <span key={i} className={stream ? "aor-chunk" : undefined}>
          {c}
        </span>
      ))}
    </>
  )
}

/** One line of output. While it streams it glides left under a soft edge so the newest words stay in view; settled lines rest at the start. */
function Ticker({ text, live }: { text: string; live: boolean }) {
  const box = React.useRef<HTMLSpanElement>(null)
  const inner = React.useRef<HTMLSpanElement>(null)
  const place = React.useCallback(() => {
    const b = box.current
    const i = inner.current
    if (!b || !i) return
    const over = live ? Math.max(0, i.scrollWidth - b.clientWidth) : 0
    i.style.transform = over ? `translateX(${-over}px)` : ""
    b.dataset.over = over ? "1" : ""
  }, [live])
  React.useLayoutEffect(() => {
    place()
    const b = box.current
    if (!b) return
    const ro = new ResizeObserver(place)
    ro.observe(b)
    return () => ro.disconnect()
  }, [place, text])
  return (
    <span ref={box} className="aor-ticker" data-live={live || undefined}>
      <span ref={inner} className="aor-ticker-in">
        {text}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.aor {
  --aor-ink: oklch(.15 0 0);
  --aor-surface: #fff;
  --aor-accent: #0060e2;
  --aor-t1: oklch(.15 0 0);
  --aor-t2: oklch(.46 0 0);
  --aor-t3: oklch(.59 0 0);
  --aor-line: oklch(.935 0 0);
  --aor-wire: oklch(.82 0 0);
  --aor-fill: oklch(.978 0 0);
  --aor-ok: oklch(.49 .19 150);
  --aor-bad: oklch(.54 .21 25);
  --aor-btn: oklch(.33 0 0);
  --aor-btn-fg: #fff;
  --aor-s1: oklch(.58 .15 250);
  --aor-s2: oklch(.5 .19 307);
  --aor-s3: oklch(.72 .18 74);
  --aor-s4: oklch(.58 .17 175);
  --aor-glint: 255 255 255;
  --aor-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; container-name: aor; width: 100%; max-width: 1080px; margin-inline: auto;
  background: var(--aor-surface); border: 1px solid var(--aor-line); border-radius: 26px; color: var(--aor-t1);
  font-family: var(--aor-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 20px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .aor {
  --aor-ink: oklch(.96 0 0);
  --aor-surface: oklch(.2 0 0);
  --aor-accent: #4d8dff;
  --aor-t1: oklch(.96 0 0);
  --aor-t2: oklch(.76 0 0);
  --aor-t3: oklch(.62 0 0);
  --aor-line: oklch(1 0 0 / .1);
  --aor-wire: oklch(1 0 0 / .22);
  --aor-fill: oklch(1 0 0 / .045);
  --aor-ok: oklch(.78 .17 150);
  --aor-bad: oklch(.72 .19 25);
  --aor-btn: oklch(.95 0 0);
  --aor-btn-fg: oklch(.2 0 0);
  --aor-s1: oklch(.72 .14 250);
  --aor-s2: oklch(.72 .17 307);
  --aor-s3: oklch(.82 .16 80);
  --aor-s4: oklch(.76 .15 175);
  --aor-glint: 255 255 255;
}
.aor *, .aor *::before, .aor *::after { box-sizing: border-box }
:where(.aor) :is(h3, p, ol, ul, dl, dd) { margin: 0; padding: 0 }
:where(.aor) :is(ol, ul) { list-style: none }
:where(.aor) button { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.aor :focus-visible { outline: 2px solid color-mix(in oklab, var(--aor-accent) 60%, transparent); outline-offset: 1px }
.aor button:focus:not(:focus-visible) { outline: none }
.aor-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.aor-num { font-variant-numeric: tabular-nums }

/* header */
.aor-header { display: grid; gap: 14px; padding: 18px 20px 16px; border-bottom: 1px solid var(--aor-line) }
.aor-goal { font-size: 16px; font-weight: 500; line-height: 1.1; letter-spacing: -.01em; text-wrap: balance }
.aor-toolbar { display: flex; align-items: center; gap: 12px }
.aor-limit { display: flex; align-items: center; gap: 10px; min-width: 0 }
.aor-limit-label { color: var(--aor-t2); white-space: nowrap }
.aor-seg { flex: none; border: 1px solid var(--aor-line); border-radius: 18px; background: var(--aor-fill) }
.aor-seg-track { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px; padding: 3px }
.aor-seg-thumb {
  position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px - (var(--n) - 1) * 2px) / var(--n));
  border-radius: 14px; background: var(--aor-surface); border: 1px solid var(--aor-line); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .035);
  transform: translateX(calc(var(--i) * (100% + 2px))); transition: transform .34s var(--aor-ease);
}
.aor-seg button { position: relative; min-width: 34px; height: 36px; padding: 0 12px; border-radius: 14px; font-weight: 500; text-align: center; color: var(--aor-t3); transition: color .16s var(--aor-ease) }
.aor-seg button[aria-checked="true"] { color: var(--aor-t1) }
.aor-seg button:focus-visible { outline-offset: -2px }
.aor-run {
  margin-left: auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 18px; border-radius: 18px;
  background: var(--aor-btn); color: var(--aor-btn-fg); font-weight: 500; white-space: nowrap; transition: transform .16s var(--aor-ease), opacity .16s var(--aor-ease);
}
.aor-run:active { transform: scale(.97) }
.aor-run svg { flex: none }

/* flow */
.aor-flow { position: relative; display: grid; gap: 16px; padding: 20px 20px 22px }
.aor-wires { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible }
.aor-trunk { fill: none; stroke: var(--aor-wire); stroke-width: 1 }
.aor-branch { fill: none; stroke: var(--wire, var(--aor-wire)); stroke-width: 1; stroke-dasharray: 3 3; opacity: .55; transition: opacity .3s var(--aor-ease) }
.aor-branch[data-on] { stroke-dasharray: none; opacity: 1 }
.aor-port { fill: var(--aor-surface); stroke: var(--aor-wire); stroke-width: 1.5; transition: fill .3s var(--aor-ease), stroke .3s var(--aor-ease) }
.aor-port[data-on] { fill: var(--wire); stroke: var(--wire) }
.aor-pulse { fill: none; stroke: var(--wire); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: .12 1; stroke-dashoffset: .12 }

.aor-node { display: grid; gap: 6px }
.aor-node-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 12px }
.aor-node-mark { display: grid; place-items: center; width: 20px; height: 20px; color: var(--aor-ink) }
.aor-node-name { min-width: 0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aor-node-role { margin-left: 6px; font-weight: 400; color: var(--aor-t3); font-size: 13px }
.aor-node-status { display: flex; align-items: center; gap: 10px; font-size: 12px; line-height: 18px; color: var(--aor-t2); white-space: nowrap }
.aor-st { display: inline-flex; align-items: center; gap: 6px }
.aor-st svg { flex: none }
.aor-elapsed { color: var(--aor-t3); font-variant-numeric: tabular-nums }
.aor-node-body { padding-left: 32px; min-width: 0 }
.aor-sub { color: var(--aor-t3) }
.aor-plan { display: grid }
.aor-plan-item { display: grid; grid-template-rows: 1fr; animation: aor-grow .4s var(--aor-ease) backwards }
.aor-plan-in { min-height: 0; overflow: hidden; display: grid; grid-template-columns: 6px minmax(0, 1fr); gap: 10px; padding: 2px 0; color: var(--aor-t2) }
.aor-dot { width: 6px; height: 6px; margin-top: 9px; border-radius: 50%; background: var(--lane) }
.aor-chunk { animation: aor-chunk .15s var(--aor-ease) backwards }
@keyframes aor-chunk { from { opacity: 0 } }
@keyframes aor-grow { from { grid-template-rows: 0fr; opacity: 0 } }

/* lanes */
.aor-lanes { display: grid; gap: 10px; padding-left: 32px }
.aor-lane { position: relative; border: 1px solid var(--aor-line); border-radius: 16px; background: var(--aor-surface); transition: border-color .16s var(--aor-ease); min-width: 0 }
.aor-lane[data-phase="running"], .aor-lane[data-phase="starting"] { border-color: color-mix(in oklab, var(--lane) 32%, var(--aor-line)) }
.aor-lane[data-phase="error"] { border-color: color-mix(in oklab, var(--aor-bad) 38%, var(--aor-line)) }
.aor-lane-btn { display: grid; width: 100%; gap: 3px; padding: 11px 14px 10px; border-radius: 15px; transition: background-color .16s var(--aor-ease) }
.aor-lane-btn:hover { background: var(--aor-fill) }
.aor-lane-btn:focus-visible { outline-offset: -2px }
.aor-head { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: var(--aor-t2); min-width: 0 }
.aor-lane-mark { display: grid; place-items: center; flex: none; width: 14px; height: 14px; color: var(--aor-t2) }
.aor-model { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aor-time { flex: none; color: var(--aor-t3); font-variant-numeric: tabular-nums }
.aor-title { font-weight: 500; line-height: 20px; overflow-wrap: anywhere }
.aor-lane[data-phase="empty"] .aor-title { color: var(--aor-t2) }
.aor-act { display: flex; align-items: center; gap: 6px; min-height: 18px; font-size: 12px; line-height: 18px; color: var(--aor-t2); min-width: 0 }
.aor-act > svg, .aor-act > span:first-child { flex: none }
.aor-act-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aor-lane[data-phase="error"] .aor-act { color: var(--aor-bad) }
.aor-lane[data-phase="returned"] .aor-act { color: var(--aor-t2) }
.aor-out { display: block; min-height: 18px; font-size: 12px; line-height: 18px; color: var(--aor-t2); min-width: 0 }
.aor-ticker { display: block; overflow: hidden; white-space: nowrap; min-width: 0 }
.aor-ticker[data-over="1"] { -webkit-mask-image: linear-gradient(90deg, transparent, #000 18px); mask-image: linear-gradient(90deg, transparent, #000 18px) }
.aor-ticker-in { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis }
.aor-ticker[data-live] .aor-ticker-in { display: inline-block; max-width: none; overflow: visible; transition: transform .22s linear }
.aor-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; line-height: 18px; color: var(--aor-t3) }
.aor-metrics { display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums }
.aor-sep { width: 2px; height: 2px; border-radius: 50%; background: currentColor }
.aor-chev { flex: none; transition: transform .34s var(--aor-ease) }
.aor-lane[data-open] .aor-chev { transform: rotate(180deg) }

.aor-collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .36s var(--aor-ease) }
.aor-collapse[data-open] { grid-template-rows: 1fr }
.aor-collapse-in { min-height: 0; overflow: hidden; opacity: 0; transition: opacity .2s var(--aor-ease) }
.aor-collapse[data-open] > .aor-collapse-in { opacity: 1; transition-delay: .06s }
.aor-transcript { margin: 0 14px; padding: 10px 0 12px; border-top: 1px solid var(--aor-line) }
.aor-log { display: grid; gap: 8px }
.aor-log-row { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; font-size: 12px; line-height: 18px }
.aor-log-icon { display: grid; place-items: start center; padding-top: 2px; color: var(--aor-t2) }
.aor-log-main { display: grid; min-width: 0 }
.aor-log-title { color: var(--aor-t1) }
.aor-log-target { margin-left: 6px; color: var(--aor-t3); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px }
.aor-log-detail { color: var(--aor-t2); overflow-wrap: anywhere }
.aor-log-empty { font-size: 12px; line-height: 18px; color: var(--aor-t3) }

/* summary */
.aor-summary-text { display: grid; gap: 6px; color: var(--aor-t1) }
.aor-summary-text ul { display: grid; gap: 4px; padding-left: 18px; list-style: disc }
.aor-summary-text li::marker { color: var(--aor-t3) }
.aor-totals-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s var(--aor-ease) }
.aor-totals-wrap[data-open] { grid-template-rows: 1fr }
.aor-totals-clip { min-height: 0; overflow: hidden }
.aor-totals { display: grid; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--aor-line) }
.aor-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px }
.aor-stats dt { font-size: 12px; line-height: 16px; color: var(--aor-t3) }
.aor-stats dd { font-weight: 500; font-variant-numeric: tabular-nums }
.aor-speed-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px }
.aor-speed { display: inline-flex; align-items: center; gap: 6px; color: var(--aor-ok) }
.aor-speed span { color: var(--aor-t1) }
.aor-ghost { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border: 1px solid transparent; border-radius: 18px; font-weight: 500; color: var(--aor-t2); transition: background-color .16s var(--aor-ease), color .16s var(--aor-ease) }
.aor-ghost:hover { background: var(--aor-fill); color: var(--aor-t1) }

/* in place text swaps and shimmer */
.aor-swap { display: inline-grid; min-width: 0; max-width: 100% }
.aor-swap > * { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aor-swap-out { animation: aor-out .1s var(--aor-ease) forwards; pointer-events: none }
.aor-swap-in[data-fresh] { animation: aor-in .16s var(--aor-ease) backwards }
@keyframes aor-out { to { opacity: 0 } }
@keyframes aor-in { from { opacity: 0; transform: translateY(2px) } }
.aor-shimmer { position: relative }
.aor-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; overflow: hidden; text-overflow: ellipsis; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(var(--aor-glint) / .82) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: aor-sweep 1.6s linear infinite;
}
@keyframes aor-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
.aor-spin { animation: aor-rot .8s linear infinite }
@keyframes aor-rot { to { transform: rotate(360deg) } }
.aor-ok { color: var(--aor-ok) }
.aor-err { color: var(--aor-bad) }

/* side by side on wide cards */
@container aor (min-width: 720px) {
  .aor-lanes { grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 12px; padding-left: 0; margin: 30px 0 }
}
@container aor (max-width: 439px) {
  .aor-header { padding-inline: 16px }
  .aor-flow { padding-inline: 16px }
  .aor-limit-label, .aor-lead-elapsed { display: none }
  .aor-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) }
}

@media (prefers-reduced-motion: reduce) {
  .aor *, .aor *::before, .aor *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

type Geo = {
  w: number
  h: number
  trunks: string[]
  lanes: Record<string, { branch: string[]; port: { x: number; y: number }; down: string; up: string }>
}

const seriesVar = (i: number) => `var(--aor-s${(i % 4) + 1})`

function LaneCard({
  lane,
  index,
  workerName,
  workerMark,
  queuedPlace,
  open,
  onToggle,
  laneRef,
  now,
}: {
  lane: Lane | null
  index: number
  workerName: string
  workerMark: React.ReactNode
  queuedPlace: number
  open: boolean
  onToggle: () => void
  laneRef: (el: HTMLDivElement | null) => void
  now: number
}) {
  const uid = React.useId()
  const phase: string = lane ? (lane.status === "planned" && queuedPlace > 0 ? "queued" : lane.status) : "empty"
  let label = "Waiting for the plan"
  let icon: React.ReactNode = <Ring kind="idle" />
  if (lane) {
    switch (lane.status) {
      case "planned":
        label = queuedPlace > 0 ? `Queued, number ${queuedPlace} in line` : "Planned"
        icon = <Ring kind={queuedPlace > 0 ? "idle" : "dot"} />
        break
      case "starting":
        label = "Starting"
        icon = <Spinner />
        break
      case "running":
        label = lane.tool ?? "Working"
        icon = toolIcon(lane.tool)
        break
      case "error":
        label = lane.retryAt ? `${lane.message ?? "Failed"}, retrying in ${Math.max(0, Math.ceil((lane.retryAt - now) / 1000))}s` : (lane.message ?? "Failed")
        icon = <Ring kind="error" />
        break
      case "returned":
        label = `Returned after ${lane.toolCalls} tool call${lane.toolCalls === 1 ? "" : "s"}`
        icon = <Ring kind="done" />
        break
      case "failed":
        label = `Gave up: ${lane.message ?? "failed"}`
        icon = <Ring kind="error" />
        break
      case "stopped":
        label = "Stopped"
        icon = <Ring kind="stop" />
        break
    }
  }
  const working = lane && (lane.status === "running" || lane.status === "starting")
  const outText = lane ? (lane.status === "returned" ? (lane.text ?? lane.output) : lane.output) : ""
  const aria = lane ? `${lane.title}, ${workerName}, ${label}` : `${workerName}, unassigned`
  return (
    <div className="aor-lane" ref={laneRef} data-phase={phase} data-open={open || undefined} style={{ "--lane": seriesVar(index) } as React.CSSProperties}>
      <button type="button" className="aor-lane-btn" aria-expanded={open} aria-controls={`${uid}-t`} aria-label={aria} onClick={onToggle}>
        <span className="aor-head" aria-hidden>
          <span className="aor-lane-mark">{workerMark}</span>
          <span className="aor-model">{workerName}</span>
          <span className="aor-time">{lane && lane.startedAt !== null ? formatTime(lane.elapsed) : "0.0s"}</span>
        </span>
        <span className="aor-title" aria-hidden>
          {lane ? lane.title : "Unassigned"}
        </span>
        <span className="aor-act" aria-hidden>
          {icon}
          <Swap text={label} shimmer={!!working} className="aor-act-label" />
        </span>
        <span className="aor-out" aria-hidden>
          <Ticker text={outText} live={!!working || lane?.status === "error"} />
        </span>
        <span className="aor-foot" aria-hidden>
          <span className="aor-metrics">
            <span>
              <Count value={lane?.tokens ?? 0} format={formatTokens} /> tokens
            </span>
            <span className="aor-sep" />
            <Count value={lane?.cost ?? 0} format={formatCost} />
          </span>
          <ChevronDown className="aor-chev" size={14} strokeWidth={1.8} />
        </span>
      </button>
      <div className="aor-collapse" data-open={open || undefined}>
        <div className="aor-collapse-in" inert={!open}>
          <div className="aor-transcript" id={`${uid}-t`}>
            {lane && lane.log.length ? (
              <ol className="aor-log" aria-label={`${lane.title} transcript`}>
                {lane.log.map((row, i) => (
                  <li className="aor-log-row" key={i}>
                    <span className="aor-log-icon" aria-hidden>
                      {row.kind === "tool" ? (row.done ? <Check size={13} strokeWidth={2} /> : toolIcon(row.title)) : row.kind === "result" ? <Ring kind="done" /> : row.kind === "retry" ? <RotateCw size={12} strokeWidth={1.8} /> : <Ring kind="error" />}
                    </span>
                    <span className="aor-log-main">
                      <span className="aor-log-title">
                        {row.title}
                        {row.target ? <span className="aor-log-target">{row.target}</span> : null}
                      </span>
                      {row.detail ? <span className="aor-log-detail">{row.detail}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="aor-log-empty">{lane ? "Nothing to show yet." : "This lane has no subtask yet."}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PulsePath({ d, lane, onDone }: { d: string; lane: number; onDone: () => void }) {
  const ref = React.useRef<SVGPathElement>(null)
  const done = React.useRef(onDone)
  React.useEffect(() => {
    done.current = onDone
  })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const a = el.animate([{ strokeDashoffset: 0.12 }, { strokeDashoffset: -1 }], { duration: 560, easing: "cubic-bezier(.4,0,.2,1)", fill: "none" })
    a.onfinish = () => done.current()
    return () => a.cancel()
  }, [])
  return <path ref={ref} d={d} className="aor-pulse" pathLength={1} style={{ "--wire": seriesVar(lane) } as React.CSSProperties} />
}

/**
 * A lead agent splits a goal into a plan, fans the subtasks out to parallel worker lanes and merges what comes back.
 * With no props it plays a simulated run (and says so to assistive technology).
 */
export function AgentOrchestrator({
  goal = "Audit our docs against four competitors and list what to fix first",
  plan = samplePlan,
  workers = DEFAULT_WORKERS,
  lead = DEFAULT_LEAD,
  run,
  concurrency: controlled,
  defaultConcurrency,
  onConcurrencyChange,
  autoStart = true,
  onComplete,
  className,
}: AgentOrchestratorProps) {
  const reduced = useReducedMotion()
  const [state, dispatch] = React.useReducer(reducer, INITIAL)
  const [inner, setInner] = React.useState(() => Math.min(4, Math.max(1, defaultConcurrency ?? workers.length)))
  const limit = Math.min(4, Math.max(1, controlled ?? inner))
  const limitRef = React.useRef(limit)
  React.useEffect(() => {
    limitRef.current = limit
  })
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [pulses, setPulses] = React.useState<{ id: number; lane: string; dir: "down" | "up" }[]>([])
  const [geo, setGeo] = React.useState<Geo | null>(null)
  const [copied, setCopied] = React.useState(false)
  const pulseSeq = React.useRef(0)
  const abort = React.useRef<AbortController | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const flowRef = React.useRef<HTMLDivElement>(null)
  const leadMark = React.useRef<HTMLSpanElement>(null)
  const sumMark = React.useRef<HTMLSpanElement>(null)
  const laneEls = React.useRef(new Map<string, HTMLDivElement>())
  const started = React.useRef(false)
  const reportedRun = React.useRef(0)
  const latest = React.useRef({ state, onComplete, plan, workers, goal, run })
  React.useEffect(() => {
    latest.current = { state, onComplete, plan, workers, goal, run }
  })

  const lanes = state.lanes
  const slotCount = Math.max(lanes.length, workers.length)
  const running = state.phase === "planning" || state.phase === "running" || state.phase === "merging"

  /* One 100ms clock, only while a run is live */
  React.useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => dispatch({ type: "tick", at: performance.now() }), 100)
    return () => window.clearInterval(id)
  }, [running])

  const stop = React.useCallback(() => {
    abort.current?.abort()
    abort.current = null
    dispatch({ type: "stop", at: performance.now() })
  }, [])

  const start = React.useCallback(() => {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setOpenId(null)
    setPulses([])
    dispatch({ type: "begin", at: performance.now() })
    const { plan: p, workers: w, goal: g, run: r } = latest.current
    const workerIds = w.map((x) => x.id)
    const workerNames = w.map((x) => x.name)
    const hook = r ?? simulateOrchestration
    void (async () => {
      try {
        const iter = hook({ goal: g, plan: p, workers: w, concurrency: () => limitRef.current, signal: ctl.signal })
        for await (const ev of iter) {
          if (ctl.signal.aborted) break
          dispatch({ type: "event", ev, at: performance.now(), workerIds, workerNames })
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && (ev.type === "dispatch" || ev.type === "result")) {
            const id = ++pulseSeq.current
            setPulses((list) => [...list, { id, lane: ev.subtaskId, dir: ev.type === "dispatch" ? "down" : "up" }])
          }
        }
      } catch (e) {
        if (ctl.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return
        dispatch({ type: "stop", at: performance.now(), error: e instanceof Error ? e.message : "the run hook failed" })
      }
    })()
  }, [])

  React.useEffect(
    () => () => {
      abort.current?.abort()
    },
    [],
  )

  /* Start the first run when the block scrolls into view */
  React.useEffect(() => {
    if (!autoStart || reduced || started.current) return
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true
          io.disconnect()
          start()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [autoStart, reduced, start])

  /* onComplete once per finished run */
  React.useEffect(() => {
    if (state.phase !== "done" || reportedRun.current === state.runId) return
    reportedRun.current = state.runId
    const cb = latest.current.onComplete
    if (!cb) return
    const s = latest.current.state
    const names = latest.current.workers.map((w) => w.name)
    const laneMs = s.lanes.reduce((n, l) => n + l.elapsed, 0)
    const parallel = s.firstDispatch !== null && s.lastReturn !== null ? s.lastReturn - s.firstDispatch : 0
    const wallMs = s.endedAt - s.startedAt
    const sequentialMs = Math.max(wallMs - parallel + laneMs, wallMs)
    cb({
      summary: s.summary.join(""),
      tokens: s.lanes.reduce((n, l) => n + l.tokens, s.leadTokens),
      cost: s.lanes.reduce((n, l) => n + l.cost, s.leadCost),
      wallMs,
      sequentialMs,
      speedup: wallMs ? sequentialMs / wallMs : 1,
      lanes: s.lanes.map((l) => ({ id: l.id, subtask: l.title, worker: names[l.worker] ?? "", status: l.status === "returned" || l.status === "failed" || l.status === "stopped" ? l.status : "pending", text: l.text ?? "", tokens: l.tokens, cost: l.cost, ms: l.elapsed })),
    })
  }, [state.phase, state.runId])

  const setLimit = (v: number) => {
    const next = Math.min(4, Math.max(1, v))
    if (controlled === undefined) setInner(next)
    onConcurrencyChange?.(next)
  }

  /* Connectors: measured from the real layout, so they follow either arrangement */
  const slotsKey = slotCount + ":" + lanes.map((l) => l.id).join(",")
  React.useLayoutEffect(() => {
    const flow = flowRef.current
    const lm = leadMark.current
    const sm = sumMark.current
    if (!flow || !lm || !sm) return
    const measure = () => {
      const fr = flow.getBoundingClientRect()
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect()
        return { l: r.left - fr.left, r: r.right - fr.left, t: r.top - fr.top, b: r.bottom - fr.top }
      }
      const L = rel(lm)
      const S = rel(sm)
      const tx = Math.round((L.l + L.r) / 2) + 0.5
      const y0 = L.b + 6
      const y1 = S.t - 6
      const wide = fr.width >= 720 && laneEls.current.size > 1
      const entries = [...laneEls.current.entries()].map(([id, el]) => ({ id, box: rel(el), head: el.querySelector(".aor-head") ? rel(el.querySelector(".aor-head") as Element) : null })).filter((e) => e.box.b > e.box.t)
      const out: Geo = { w: fr.width, h: fr.height, trunks: [], lanes: {} }
      if (!entries.length) {
        out.trunks.push(`M${tx} ${y0}V${y1}`)
      } else if (!wide) {
        out.trunks.push(`M${tx} ${y0}V${y1}`)
        for (const e of entries) {
          const y = Math.round(e.head ? (e.head.t + e.head.b) / 2 : e.box.t + 21) + 0.5
          out.lanes[e.id] = { branch: [`M${tx} ${y}H${e.box.l}`], port: { x: e.box.l + 0.5, y }, down: `M${tx} ${y0}V${y}H${e.box.l}`, up: `M${e.box.l} ${y}H${tx}V${y1}` }
        }
      } else {
        const busY = Math.round(Math.min(...entries.map((e) => e.box.t)) - 15) + 0.5
        const bus2Y = Math.round(Math.max(...entries.map((e) => e.box.b)) + 15) + 0.5
        const lastX = Math.max(...entries.map((e) => (e.box.l + e.box.r) / 2))
        out.trunks.push(`M${tx} ${y0}V${busY}H${Math.round(lastX) + 0.5}`, `M${tx} ${y1}V${bus2Y}H${Math.round(lastX) + 0.5}`)
        for (const e of entries) {
          const cx = Math.round((e.box.l + e.box.r) / 2) + 0.5
          out.lanes[e.id] = {
            branch: [`M${cx} ${busY}V${e.box.t}`, `M${cx} ${e.box.b}V${bus2Y}`],
            port: { x: cx, y: e.box.t },
            down: `M${tx} ${y0}V${busY}H${cx}V${e.box.t}`,
            up: `M${cx} ${e.box.b}V${bus2Y}H${tx}V${y1}`,
          }
        }
      }
      setGeo((prev) => (prev && JSON.stringify(prev) === JSON.stringify(out) ? prev : out))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(flow)
    ro.observe(lm)
    ro.observe(sm)
    laneEls.current.forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [slotsKey])

  /* Derived lane facts */
  const activeCount = lanes.filter((l) => isActive(l.status)).length
  const plannedIds = lanes.filter((l) => l.status === "planned").map((l) => l.id)
  const holdQueue = state.phase === "running" && activeCount >= limit
  const returned = lanes.filter((l) => l.status === "returned" || l.status === "failed").length
  const working = activeCount
  const totalTokens = lanes.reduce((n, l) => n + l.tokens, state.leadTokens)
  const totalCost = lanes.reduce((n, l) => n + l.cost, state.leadCost)
  const wallMs = (state.phase === "done" || state.phase === "stopped" ? state.endedAt : state.now) - state.startedAt
  const parallel = state.firstDispatch !== null && state.lastReturn !== null ? state.lastReturn - state.firstDispatch : 0
  const sequentialMs = Math.max(wallMs - parallel + lanes.reduce((n, l) => n + l.elapsed, 0), wallMs)
  const speedup = wallMs > 0 ? sequentialMs / wallMs : 1
  const summaryLines = React.useMemo(() => {
    const lines: { key: string; text: string }[][] = [[]]
    state.summary.forEach((chunk, ci) => {
      chunk.split("\n").forEach((part, pi) => {
        if (pi > 0) lines.push([])
        if (part) lines[lines.length - 1].push({ key: `${ci}-${pi}`, text: part })
      })
    })
    return lines.filter((l) => l.length)
  }, [state.summary])
  const planned = lanes.length

  let leadStatus: React.ReactNode
  switch (state.phase) {
    case "idle":
      leadStatus = (
        <span className="aor-st">
          <Ring kind="idle" />
          <Swap text="Ready" />
        </span>
      )
      break
    case "planning":
      leadStatus = (
        <span className="aor-st">
          <Spinner />
          <Swap text="Planning" shimmer />
        </span>
      )
      break
    case "running":
      leadStatus = (
        <span className="aor-st">
          <Spinner />
          <Swap text={working ? `${working} working` : "Dispatching"} shimmer />
        </span>
      )
      break
    case "merging":
      leadStatus = (
        <span className="aor-st">
          <Spinner />
          <Swap text="Merging results" shimmer />
        </span>
      )
      break
    case "done":
      leadStatus = (
        <span className="aor-st">
          <Ring kind="done" />
          <Swap text="Done" />
        </span>
      )
      break
    default:
      leadStatus = (
        <span className="aor-st">
          <Ring kind="stop" />
          <Swap text="Stopped" />
        </span>
      )
  }

  const expected = plan.length || workers.length
  const sumLabel =
    state.phase === "done"
      ? `Merged ${returned} result${returned === 1 ? "" : "s"}`
      : state.phase === "merging"
        ? "Writing the summary"
        : state.phase === "stopped"
          ? "Stopped"
          : planned
            ? `${returned} of ${planned} returned`
            : `Waits for ${expected} results`
  const runLabel = running ? "Stop" : state.phase === "idle" ? "Run" : "Run again"

  const copySummary = () => {
    const text = state.summary.join("")
    void navigator.clipboard?.writeText(text).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const slots: { lane: Lane | null; worker: number }[] = []
  for (let i = 0; i < slotCount; i++) {
    const lane = lanes[i] ?? null
    slots.push({ lane, worker: lane ? lane.worker : i })
  }

  const cols = Math.min(4, Math.max(1, slotCount))
  const nameOf = (i: number) => workers[i % Math.max(1, workers.length)]?.name ?? `Worker ${i + 1}`
  const markOf = (i: number) => workers[i % Math.max(1, workers.length)]?.mark ?? <WorkerMark index={i} />

  return (
    <div ref={rootRef} className={"aor" + (className ? " " + className : "")}>
      <style href="agent-orchestrator" precedence="default">
        {CSS}
      </style>
      <header className="aor-header">
        <h3 className="aor-goal">{goal}</h3>
        <div className="aor-toolbar">
          <div className="aor-limit">
            <span className="aor-limit-label" id="aor-limit-label">
              Concurrency
            </span>
            <Segmented value={limit} onChange={setLimit} />
          </div>
          <button type="button" className="aor-run" onClick={running ? stop : start}>
            {running ? <Square size={13} strokeWidth={2} fill="currentColor" aria-hidden /> : state.phase === "idle" ? <Play size={13} strokeWidth={2} fill="currentColor" aria-hidden /> : <RotateCw size={14} strokeWidth={2} aria-hidden />}
            <Swap text={runLabel} />
          </button>
        </div>
      </header>

      <div className="aor-flow" ref={flowRef}>
        {geo && (
          <svg className="aor-wires" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden>
            {geo.trunks.map((d, i) => (
              <path key={i} d={d} className="aor-trunk" />
            ))}
            {slots.map(({ lane }, i) => {
              if (!lane) return null
              const g = geo.lanes[lane.id]
              if (!g) return null
              const on = lane.status !== "planned" || false
              const queued = lane.status === "planned" && holdQueue
              return (
                <g key={lane.id} style={{ "--wire": seriesVar(i) } as React.CSSProperties}>
                  {g.branch.map((d, bi) => (
                    <path key={bi} d={d} className="aor-branch" data-on={on && !queued && (bi === 0 || lane.status === "returned" || lane.status === "failed") ? "" : undefined} />
                  ))}
                  <circle cx={g.port.x} cy={g.port.y} r="3.5" className="aor-port" data-on={on ? "" : undefined} />
                </g>
              )
            })}
            {pulses.map((p) => {
              const g = geo.lanes[p.lane]
              if (!g) return null
              const idx = lanes.findIndex((l) => l.id === p.lane)
              return <PulsePath key={p.id} d={p.dir === "down" ? g.down : g.up} lane={Math.max(0, idx)} onDone={() => setPulses((list) => list.filter((x) => x.id !== p.id))} />
            })}
          </svg>
        )}

        <section className="aor-node" aria-label="Lead">
          <div className="aor-node-row">
            <span className="aor-node-mark" ref={leadMark} aria-hidden>
              {lead.mark ?? DEFAULT_LEAD.mark}
            </span>
            <span className="aor-node-name">
              {lead.name}
              <span className="aor-node-role">Lead</span>
            </span>
            <span className="aor-node-status">
              {leadStatus}
              {state.phase === "done" || state.phase === "stopped" ? <span className="aor-elapsed aor-lead-elapsed">{formatTime(wallMs)}</span> : running ? <span className="aor-elapsed aor-lead-elapsed">{formatTime(wallMs)}</span> : null}
            </span>
          </div>
          <div className="aor-node-body">
            {planned === 0 ? (
              <p className="aor-sub">{`Writes a plan, then splits it across ${expected} subagent${expected === 1 ? "" : "s"}.`}</p>
            ) : (
              <ol className="aor-plan" aria-label="Plan">
                {lanes.map((l, i) => (
                  <li className="aor-plan-item" key={l.id} style={{ "--lane": seriesVar(i) } as React.CSSProperties}>
                    <span className="aor-plan-in">
                      <span className="aor-dot" aria-hidden />
                      <span>
                        <StreamText text={l.instruction ?? l.title} stream={!reduced} />
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <div className="aor-lanes" style={{ "--cols": cols } as React.CSSProperties} role="group" aria-label="Workers">
          {slots.map(({ lane, worker }, i) => {
            const place = lane && lane.status === "planned" && holdQueue ? plannedIds.indexOf(lane.id) + 1 : 0
            const key = lane ? lane.id : `empty-${i}`
            return (
              <LaneCard
                key={key}
                lane={lane}
                index={i}
                workerName={nameOf(worker)}
                workerMark={markOf(worker)}
                queuedPlace={place}
                open={openId === key}
                onToggle={() => setOpenId((cur) => (cur === key ? null : key))}
                laneRef={(el) => {
                  if (!lane) return
                  if (el) laneEls.current.set(lane.id, el)
                  else laneEls.current.delete(lane.id)
                }}
                now={state.now}
              />
            )
          })}
        </div>

        <section className="aor-node" aria-label="Summary">
          <div className="aor-node-row">
            <span className="aor-node-mark" ref={sumMark} aria-hidden>
              {lead.mark ?? DEFAULT_LEAD.mark}
            </span>
            <span className="aor-node-name">Summary</span>
            <span className="aor-node-status">
              <span className="aor-st">
                {state.phase === "done" ? <Ring kind="done" /> : state.phase === "merging" ? <Spinner /> : state.phase === "stopped" ? <Ring kind="stop" /> : <Ring kind="idle" />}
                <Swap text={sumLabel} shimmer={state.phase === "merging"} />
              </span>
            </span>
          </div>
          <div className="aor-node-body">
            {summaryLines.length ? (
              <div className="aor-summary-text">
                {renderSummary(summaryLines)}
              </div>
            ) : (
              <p className="aor-sub">{state.phase === "stopped" ? "The run was stopped before the lead could merge." : "The lead merges what the subagents return here."}</p>
            )}
            <div className="aor-totals-wrap" data-open={state.phase === "done" || undefined}>
              <div className="aor-totals-clip" inert={state.phase !== "done"}>
                <div className="aor-totals">
                  <dl className="aor-stats">
                    <div>
                      <dt>Tokens</dt>
                      <dd>
                        <Count value={totalTokens} format={formatTokens} />
                      </dd>
                    </div>
                    <div>
                      <dt>Cost</dt>
                      <dd>
                        <Count value={totalCost} format={formatCost} />
                      </dd>
                    </div>
                    <div>
                      <dt>Wall time</dt>
                      <dd>{formatTime(wallMs)}</dd>
                    </div>
                    <div>
                      <dt>In sequence</dt>
                      <dd>{formatTime(sequentialMs)}</dd>
                    </div>
                  </dl>
                  <div className="aor-speed-row">
                    <p className="aor-speed">
                      <Zap size={14} strokeWidth={1.8} aria-hidden />
                      <span>{speedup >= 1.05 ? `${speedup.toFixed(1)}x faster than running in sequence` : "About the same as running in sequence"}</span>
                    </p>
                    <button type="button" className="aor-ghost" onClick={copySummary}>
                      {copied ? <Check size={14} strokeWidth={2} aria-hidden /> : <Copy size={14} strokeWidth={1.8} aria-hidden />}
                      <Swap text={copied ? "Copied" : "Copy summary"} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <p className="aor-sr" role="status" aria-live="polite">
        {state.note}
        {!run && state.phase !== "idle" ? " This is a simulated run." : ""}
      </p>
    </div>
  )
}

function renderSummary(lines: { key: string; text: string }[][]) {
  const out: React.ReactNode[] = []
  let bullets: React.ReactNode[] = []
  const flush = (k: string) => {
    if (bullets.length) out.push(<ul key={`ul-${k}`}>{bullets}</ul>)
    bullets = []
  }
  lines.forEach((chunks, li) => {
    const first = chunks[0].text
    const isBullet = first.startsWith("- ")
    const nodes = chunks.map((c, ci) => (
      <span key={c.key} className="aor-chunk">
        {isBullet && ci === 0 ? c.text.slice(2) : c.text}
      </span>
    ))
    if (isBullet) bullets.push(<li key={li}>{nodes}</li>)
    else {
      flush(String(li))
      out.push(<p key={li}>{nodes}</p>)
    }
  })
  flush("end")
  return out
}

function Segmented({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const values = [1, 2, 3, 4]
  const move = (v: number) => {
    onChange(v)
    refs.current[v - 1]?.focus()
  }
  return (
    <div className="aor-seg" role="radiogroup" aria-label="Concurrency">
      <div className="aor-seg-track" style={{ "--n": values.length, "--i": value - 1 } as React.CSSProperties}>
        <span className="aor-seg-thumb" aria-hidden />
        {values.map((v) => (
          <button
            key={v}
            ref={(el) => {
              refs.current[v - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={v === value}
            tabIndex={v === value ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                move(Math.min(4, value + 1))
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                move(Math.max(1, value - 1))
              } else if (e.key === "Home") {
                e.preventDefault()
                move(1)
              } else if (e.key === "End") {
                e.preventDefault()
                move(4)
              }
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AgentOrchestrator
