import * as React from "react"

import { AgentApprovals, sampleRequests, type ApprovalDecision, type ApprovalRequest } from "@/components/blocks/agent-approvals"

/* Controlled example: the first call fails once, so you can see the retry path. */
const MIN = 60_000
const T0 = Date.now()
const QUEUE: ApprovalRequest[] = [
  {
    ...sampleRequests[1],
    id: "ctl-1",
    summary: "Email Hana Ito about the contract",
    title: "Send an email with Mail",
    reason: "The contract she asked about was signed this morning.",
    args: [
      { key: "to", label: "To", value: "hana@kestrel.example", mono: true },
      { key: "subject", label: "Subject", value: "Your signed contract" },
    ],
    requestedAt: new Date(T0 - 3 * MIN).toISOString(),
  },
  {
    ...sampleRequests[3],
    id: "ctl-2",
    summary: "Close 4 duplicates of WEB-510",
    title: "Close 4 duplicates of WEB-510",
    requestedAt: new Date(T0 - 8 * MIN).toISOString(),
  },
]

export default function Demo() {
  const [last, setLast] = React.useState<ApprovalDecision | null>(null)
  const failedOnce = React.useRef(false)
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <AgentApprovals />
      <div className="flex w-full max-w-[640px] flex-col gap-3">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Controlled: onDecision rejects once, then succeeds</span>
        <AgentApprovals
          title="Your approvals"
          requests={QUEUE}
          rules={[]}
          resolved={[]}
          reviewer="Jonas Weber"
          workspace="Kestrel"
          onDecision={async (d) => {
            await new Promise((r) => setTimeout(r, 700))
            if (!failedOnce.current) {
              failedOnce.current = true
              throw new Error("The agent did not get your decision. Nothing ran.")
            }
            setLast(d)
          }}
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {last ? `onDecision: ${last.outcome} ${last.requestId}${last.edited ? " (edited)" : ""}${last.ruleId ? ` via rule` : ""}` : "Press Approve once to see the error, then Retry."}
        </p>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "Focus follows the pending list, not the DOM: the card renders only the request in focus and every other request is a one-line row. Switching is a keyed remount, so the new request plays a 14px rise while an AutoHeight wrapper (a ResizeObserver writing `style.height`, with a CSS height transition) follows the new content.",
  "Keyboard shortcuts live in one `onKeyDown` on the root and bail out when the event target is inside an input, a textarea or a menu, so typing `a` while editing an argument never approves anything. Enter only approves when the card region itself has focus.",
  "Always allow creates a rule, then measures the trigger and the Rules button with getBoundingClientRect and flies a chip between them with the Web Animations API; the Rules count only rolls when the animation's `onfinish` fires.",
  "A request that a rule covers is detected by matching tool id (and agent for agent scoped rules). Those rows flip to Allowed by rule, then collapse using `grid-template-rows: 1fr` to `0fr` in a keyframe animation, so the list closes the gap without measuring heights.",
  "onDecision may return a promise: while it is pending the request stays in a sending state (the Approve label shimmers via a clipped gradient pseudo element), and a rejection shows the Error message with Retry and Deny.",
]
