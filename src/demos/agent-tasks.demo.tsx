import * as React from "react"

import { AgentTasks, sampleModels, sampleRepositories, type AgentTask } from "@/components/blocks/agent-tasks"

const MIN = 60_000
const T0 = Date.now()

/* Controlled example: your store owns the tasks, every action is a callback. */
const SEED: AgentTask[] = [
  {
    id: "c2",
    title: "Replace moment with date-fns in the reports module",
    repo: "northwind/web",
    branch: "chore/reports-date-fns",
    baseBranch: "main",
    model: "nova-mini",
    status: "ready",
    startedAt: T0 - 14 * MIN,
    finishedAt: T0 - 6 * MIN,
    steps: [
      { text: "Cloned northwind/web", state: "done", seconds: 8 },
      { text: "Rewrote 12 call sites", state: "done", seconds: 310 },
      { text: "Ran the type check", state: "done", seconds: 58 },
    ],
    files: [
      { path: "src/reports/range.ts", added: 18, removed: 21 },
      { path: "src/reports/table.tsx", added: 7, removed: 9 },
    ],
    checks: [{ name: "Type check", state: "passed" }],
  },
  {
    id: "c1",
    title: "Backfill missing invoice currencies",
    repo: "northwind/billing",
    branch: "fix/invoice-currency",
    model: "atlas-2",
    status: "failed",
    startedAt: T0 - 40 * MIN,
    finishedAt: T0 - 33 * MIN,
    error: "The migration timed out after 300 seconds",
  },
]

export default function Demo() {
  const [tasks, setTasks] = React.useState<AgentTask[]>(SEED)
  const [log, setLog] = React.useState("Press Create pull request, Retry or Archive and read the callback here.")
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <AgentTasks />
      <div className="flex w-full max-w-[760px] flex-col gap-3">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Controlled: you pass tasks, it calls back</span>
        <AgentTasks
          tasks={tasks}
          repositories={sampleRepositories}
          models={sampleModels}
          defaultFilter="all"
          onStart={({ prompt, repo, branch }) => {
            setLog(`onStart: "${prompt}" on ${repo}@${branch}`)
            setTasks((t) => [{ id: `c${Date.now()}`, title: prompt, repo, branch: "agent/new", model: "nova-large", status: "queued", startedAt: Date.now() }, ...t])
          }}
          onCreatePullRequest={async (task) => {
            setLog(`onCreatePullRequest: ${task.id}`)
            await new Promise((r) => setTimeout(r, 900))
            return { number: 512, url: "https://example.com/pull/512", state: "open" }
          }}
          onRetry={(task) => {
            setLog(`onRetry: ${task.id}`)
            setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "running", error: undefined, startedAt: Date.now(), step: "Retrying the migration" } : x)))
          }}
          onCancel={(task) => {
            setLog(`onCancel: ${task.id}`)
            setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "cancelled", finishedAt: Date.now() } : x)))
          }}
          onArchive={(task) => setLog(`onArchive: ${task.id}`)}
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "The demo is a state machine on one chained timer per task: queued, then setting up, then one step at a time until ready. Cancel and retry clear that timer and start a new chain, and a cleanup effect clears every timer on unmount.",
  "Cards expand with `grid-template-rows: 0fr` to `1fr`: CSS can't animate to `height: auto`, but it can animate a grid track, and the closed content is `inert` so it drops out of the tab order and the reading order.",
  "The filter tabs' sliding thumb is one absolutely positioned span; a ResizeObserver reads each active tab's offsetLeft and offsetWidth and writes `transform` and `width` straight to the DOM, so the thumb follows labels of different widths without re-rendering.",
  "Menus for repository, branch and model are small hand-rolled `role=menu` popovers with `menuitemradio` items: arrow keys move focus, Escape returns it to the trigger, and a `pointerdown` listener on the document closes it, all attached only while the menu is open.",
  "Text that changes in place (the live step, Create pull request becoming Opening pull request) is a blur-free crossfade built from two stacked spans in one grid cell: the old one fades out in 100ms while the new one fades in over 160ms from 3px below.",
]
