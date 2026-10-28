import * as React from "react"

import { DecisionInbox, type Decision } from "@/components/ui/decision-inbox"

const DECISIONS: Decision[] = [
  {
    id: "model",
    title: "Move support replies to the faster model?",
    detail: "Same resolution rate across a 2-week test · 38% lower latency",
    primary: "Switch",
    secondary: "Keep testing",
  },
  {
    id: "budget",
    title: "Raise the monthly eval budget?",
    detail: "$420 of $500 used · 9 days left in the month",
    primary: "Raise to $800",
    secondary: "Keep $500",
    collapsed: true,
  },
  {
    id: "retention",
    title: "Delete chat logs older than 90 days?",
    detail: "14,200 conversations · 6.1 GB · none flagged for review",
    primary: "Delete",
    secondary: "Keep 1 year",
    collapsed: true,
  },
]

export const notes = [
  "Rows fold away with the grid-rows trick: the row is display: grid and its track animates from 1fr to 0fr, which CSS can transition (height: auto it cannot). The inner box has min-height: 0 and overflow: hidden so it can shrink to nothing.",
  "The flow is a small state machine in a few lines of React: answers (id to choice), gone (ids already folded) and opened (which folded rows were opened). Picking an answer shows the green confirmation, and a setTimeout of ~1.2s then marks the row gone and opens the next collapsed one; every timer is cleared on unmount.",
  "Folded and finished rows get the HTML inert attribute, so their buttons cannot be focused or clicked and screen readers skip them while the animation plays.",
  "The heading is aria-live=\"polite\" and its text span uses key={count}, so React remounts it, which both replays the small slide-in animation and makes assistive tech announce the new count.",
]

export default function Demo() {
  const [log, setLog] = React.useState<string[]>([])
  const [run, setRun] = React.useState(0)
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <DecisionInbox
        key={run}
        decisions={DECISIONS}
        onDecide={(d, answer) => setLog((l) => [`${d.title} → ${answer === "primary" ? d.primary : d.secondary}`, ...l].slice(0, 3))}
      />
      <div className="flex items-start justify-between gap-3 text-[12px] text-neutral-500">
        <ul className="min-h-[3.5rem] space-y-0.5">
          {log.length === 0 ? <li>Answer a decision to see onDecide fire.</li> : log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-500/10 dark:text-neutral-300"
          onClick={() => {
            setRun((r) => r + 1)
            setLog([])
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
