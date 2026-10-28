import * as React from "react"

import {
  AgentOrchestrator,
  type OrchestratorEvent,
  type OrchestratorResult,
  type OrchestratorRun,
  type OrchestratorSubtask,
} from "@/components/blocks/agent-orchestrator"

/* Your own run hook: an async generator that yields events. The block handles timing, pulses, queues and totals. */
const PLAN: OrchestratorSubtask[] = [
  { id: "a", title: "Churn by plan", instruction: "Pull churn by plan for the last two quarters" },
  { id: "b", title: "Exit survey themes", instruction: "Group the exit survey answers into themes" },
  { id: "c", title: "Support load", instruction: "Count tickets raised by accounts that churned" },
]

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = window.setTimeout(resolve, ms)
    signal.addEventListener("abort", () => {
      window.clearTimeout(id)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

const run: OrchestratorRun = async function* ({ plan, signal }): AsyncGenerator<OrchestratorEvent> {
  for (const subtask of plan) {
    await sleep(380, signal)
    yield { type: "plan", subtask }
  }
  const results: string[] = []
  for (const t of plan) {
    yield { type: "dispatch", subtaskId: t.id }
    await sleep(600, signal)
    yield { type: "tool", subtaskId: t.id, tool: "Read file", target: `reports/${t.id}.csv` }
    for (const w of "Found the pattern in the second half of the quarter".split(" ")) {
      await sleep(90, signal)
      yield { type: "output", subtaskId: t.id, delta: w + " ", newLine: w === "Found" }
    }
    yield { type: "usage", subtaskId: t.id, tokens: 6400, cost: 0.019 }
    await sleep(300, signal)
    yield { type: "result", subtaskId: t.id, text: `${t.title}: the pattern holds in both quarters.` }
    results.push(t.title)
  }
  for (const w of `Checked ${results.length} angles. Churn clusters on the Team plan after month three.`.split(" ")) {
    await sleep(60, signal)
    yield { type: "summary", delta: w + " " }
  }
  yield { type: "done" }
}

export default function Demo() {
  const [result, setResult] = React.useState<OrchestratorResult | null>(null)
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <div className="w-full max-w-[1000px]">
        <AgentOrchestrator />
      </div>
      <div className="flex w-full max-w-[680px] flex-col gap-3">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Your own run hook: three workers, lanes handed out one after another</span>
        <AgentOrchestrator
          goal="Find why Team plan accounts churn"
          plan={PLAN}
          workers={[
            { id: "w1", name: "Atlas 2" },
            { id: "w2", name: "Sage Mini" },
            { id: "w3", name: "Orbit Flash" },
          ]}
          lead={{ name: "Nova Large" }}
          run={run}
          autoStart={false}
          onComplete={setResult}
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {result ? `onComplete: ${result.lanes.length} lanes, ${(result.wallMs / 1000).toFixed(1)}s wall time, ${result.speedup.toFixed(1)}x vs sequence.` : "Press Run, then watch onComplete fire."}
        </p>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "A run is an async generator: the block does `for await (const event of run(context))` and folds every event through one reducer, so the hook never touches the DOM. The same event stream could come from a real model, a websocket or a recorded trace.",
  "Connectors are measured, not hard-coded: a ResizeObserver reads the lead mark, each lane and the summary mark with getBoundingClientRect, and rebuilds the SVG paths whenever any of them changes size. The same code draws a trunk with side branches on narrow cards and a bus with drops on wide ones.",
  "The pulse that travels along a connector is a single SVG path with pathLength=1 and a short stroke-dasharray; the Web Animations API moves its stroke-dashoffset from end to end, then the node is removed on `onfinish`.",
  "Wide versus narrow is a CSS container query (`@container aor (min-width: 720px)`), so the block reacts to its own width rather than the viewport. The queue is derived at render: a planned lane shows as queued only while every concurrency slot is busy.",
  "Collapsing transcripts and the totals row animate `grid-template-rows` from 0fr to 1fr, which lets CSS animate to an automatic height with no measuring, and the closed content gets `inert` so it leaves the tab order.",
]
