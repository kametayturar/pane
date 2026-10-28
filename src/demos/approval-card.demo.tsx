import * as React from "react"

import { ApprovalCard, type ApprovalStatus } from "@/components/ui/approval-card"

const ARCHIVE_ICON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 4h11v2.5h-11V4ZM3.5 6.5V12a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V6.5M6.5 9h3" />
  </svg>
)
const CARD_ICON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3.5" width="12" height="9" rx="2" />
    <path d="M2 6.5h12M4.5 10h2" />
  </svg>
)

const reset = (set: (s: ApprovalStatus) => void) => (
  <button
    type="button"
    onClick={() => set("pending")}
    className="self-start rounded-md px-2 py-1 text-[12px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-white"
  >
    Ask again
  </button>
)

export default function Demo() {
  const [a, setA] = React.useState<ApprovalStatus>("pending")
  const [b, setB] = React.useState<ApprovalStatus>("pending")
  const [log, setLog] = React.useState("Waiting for a decision")

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-8">
      {/* 1 · Buttons in the card, async approve keeps the card locked until the work has started */}
      <div className="flex flex-col gap-2">
        <ApprovalCard
          title="Archive 214 stale tickets"
          description="Support desk · untouched for 90+ days"
          risk="medium"
          icon={ARCHIVE_ICON}
          status={a}
          details={[
            { label: "Workspace", value: "Acme Support" },
            { label: "Filter", value: "status = solved, updated < 90 days ago" },
            { label: "Undo", value: "Restorable for 30 days" },
          ]}
          onApprove={({ always }) => {
            setLog(`Approving${always ? " (always)" : ""}…`)
            return new Promise<void>((resolve) =>
              window.setTimeout(() => {
                setA("approved")
                setLog("Approved – tickets queued for archiving")
                resolve()
              }, 900),
            )
          }}
          onDeny={({ reason }) => {
            setA("denied")
            setLog(`Denied (${reason})`)
          }}
        />
        {a !== "pending" && reset(setA)}
        <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log} · ⌘/Ctrl+Enter approves, Esc denies
        </p>
      </div>

      {/* 2 · Gray tray, label, custom preview, Edit and a countdown that pauses on hover */}
      <div className="flex flex-col gap-2">
        <ApprovalCard
          label="Step 3 · billing.refund"
          actions="tray"
          title="Refund €1,200 to Globex Ltd"
          description="Duplicate charge on invoice INV-2207"
          risk="high"
          status={b}
          allowAlways={false}
          expiresIn={30}
          onEdit={() => setLog("Edit pressed")}
          onApprove={() => setB("approved")}
          onDeny={() => setB("denied")}
          preview={
            <div className="flex items-center gap-2 text-[12px] leading-4">
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-red-600 dark:text-red-400">−€1,200.00</span>
              <span className="text-neutral-500 dark:text-neutral-400">from Globex Ltd · card ending 4417</span>
            </div>
          }
          details={[
            { label: "Charged", value: "Oct 14 and Oct 14 (two times)" },
            { label: "Refund to", value: "Original payment method" },
          ]}
        />
        {b !== "pending" && reset(setB)}
      </div>

      {/* 3 · Pure defaults */}
      <ApprovalCard icon={CARD_ICON} />
    </div>
  )
}

export const notes = [
  "The card morphs into the resolved row in two beats: the pending layer fades and blurs out (opacity + `filter: blur`), then a state flip swaps in the compact row while a `ResizeObserver` measures the new content height and CSS transitions `height` from one pixel value to the other.",
  "The countdown is a chain of one-second `setTimeout`s that re-arms itself from state, so pausing on hover or focus is just 'don't schedule the next tick' – no interval bookkeeping.",
  "`onApprove` may return a promise. The card awaits it, sets `aria-busy` and `aria-disabled` (not `disabled`, which would drop keyboard focus) and only resolves when the promise does; a rejection simply unlocks the card again.",
  "Responsive layout uses CSS container queries (`container-type: inline-size` and `@container (max-width: 400px)`), so the buttons reflow based on the card's own width, not the viewport – it works inside a narrow sidebar.",
  "The ⌘↵ hint is chosen with `useSyncExternalStore`: the server snapshot says 'Mac', the client reads `navigator.platform`, so there is no hydration mismatch and no setState in an effect.",
]
