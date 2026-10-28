import * as React from "react"

import { ToolCallCard, ToolCallGroup, type ToolCallStatus } from "@/components/ui/tool-call-card"

type Call = { status: ToolCallStatus; startedAt?: number; duration?: number }

const IDLE: Call[] = [{ status: "success" }, { status: "success" }, { status: "success" }]

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const USER = icon("M8 8a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 8 8ZM3 13.2c.6-2 2.3-3.2 5-3.2s4.4 1.2 5 3.2")
const RECEIPT = icon("M4 2.5h8v11l-1.6-1-1.2 1-1.2-1-1.2 1-1.2-1L4 13.5v-11ZM6 6h4M6 8.5h4")
const MAIL = icon("M2.5 4.5h11v7h-11v-7ZM2.8 4.8 8 8.6l5.2-3.8")

const wait = (ms: number, fn: () => void) => window.setTimeout(fn, ms)

export default function Demo() {
  const [calls, setCalls] = React.useState<Call[]>(IDLE)
  const [failed, setFailed] = React.useState(false)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const set = (i: number, call: Call) => setCalls((c) => c.map((x, j) => (j === i ? call : x)))
  const later = (ms: number, fn: () => void) => void timers.current.push(wait(ms, fn))

  const replay = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setFailed(false)
    setCalls([{ status: "running", startedAt: Date.now() }, { status: "running", startedAt: Date.now() }, { status: "running", startedAt: Date.now() }])
    // The first tool finishes, the second one fails and waits for a retry, the third still runs.
    later(1400, () => set(0, { status: "success", duration: 1400 }))
    later(2300, () => {
      set(1, { status: "error", duration: 2300 })
      setFailed(true)
    })
    later(3100, () => set(2, { status: "success", duration: 3100 }))
  }

  const retry = () => {
    setFailed(false)
    set(1, { status: "running", startedAt: Date.now() })
    later(1700, () => set(1, { status: "success", duration: 1700 }))
  }

  const [a, b, c] = calls

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-5">
      <ToolCallGroup>
        <ToolCallCard
          name="lookup_customer"
          icon={USER}
          status={a.status}
          startedAt={a.startedAt}
          duration={a.duration ?? 1400}
          summary={a.status === "running" ? "Looking up Northwind Trading" : "Found Northwind Trading"}
          args={{ query: "Northwind Trading", fields: ["id", "plan", "billing_email"] }}
          result={a.status === "running" ? undefined : { id: "cus_8421", plan: "Scale", billing_email: "ap@northwind.example" }}
        />
        <ToolCallCard
          name="create_invoice"
          icon={RECEIPT}
          status={b.status}
          startedAt={b.startedAt}
          duration={b.duration ?? 1700}
          summary={b.status === "error" ? "Could not create the October invoice" : b.status === "running" ? "Creating the October invoice" : "Created invoice INV-1042"}
          args={{ customer: "cus_8421", currency: "EUR", lines: [{ description: "October retainer", amount: 4800 }] }}
          result={b.status === "success" ? { id: "INV-1042", total: 4800, status: "draft" } : undefined}
          error="429 – too many requests, the billing API asks to wait 20 seconds"
          onRetry={failed ? retry : undefined}
        />
        <ToolCallCard
          name="send_email"
          icon={MAIL}
          status={c.status}
          startedAt={c.startedAt}
          duration={c.duration ?? 3100}
          summary={c.status === "running" ? "Sending the invoice to ap@northwind.example" : "Sent the invoice to ap@northwind.example"}
          args={{ to: "ap@northwind.example", subject: "Invoice INV-1042 · October retainer", attach: ["INV-1042.pdf"] }}
          result={c.status === "success" ? { message_id: "msg_5f3a", queued: true } : undefined}
        />
      </ToolCallGroup>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={replay}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white transition-transform active:scale-[.97] dark:bg-white dark:text-neutral-900"
        >
          Replay the run
        </button>
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">Open the group, then a card. The failed call has Retry.</span>
      </div>

      <ToolCallCard
        name="search_docs"
        summary="Searched the docs for 'refund policy'"
        status="success"
        duration={1240}
        defaultOpen
        args={{ query: "refund policy for annual plans", max_results: 3 }}
        result={{
          hits: [
            { title: "Refunds and cancellations", url: "https://help.northwind.app/refunds", score: 0.92 },
            { title: "Annual plan billing", url: "https://help.northwind.app/annual", score: 0.81 },
            { title: "Pro-rata credits", url: "https://help.northwind.app/credits", score: 0.77 },
            { title: "Chargebacks", url: "https://help.northwind.app/chargebacks", score: 0.52 },
          ],
          total: 4,
          cached: false,
        }}
      />
    </div>
  )
}

export const notes = [
  "The body folds with `grid-template-rows: 1fr → 0fr`. CSS can't animate `height: auto`, but it can animate between two grid track sizes, so the card opens and closes smoothly at any content height. Closed bodies also get `inert` plus `visibility: hidden`, so nothing inside stays focusable.",
  "The syntax highlighting is one regular expression run with `String.matchAll` over the pretty-printed JSON. Strings followed by a colon are keys, other strings, numbers and true/false/null get their own span. No library needed.",
  "'Show all' works by measuring the code with a `ResizeObserver` and caps it with `max-height`. The fade is a `::after` gradient on the block. Pressing the button transitions `max-height` to the measured height, which again avoids animating to `auto`.",
  "The live timer is a `setInterval` that writes elapsed milliseconds into state, and `Date.now()` is only read inside the timer callback, never during render. React Compiler friendly, and the card still works if `startedAt` comes from the server.",
  "ToolCallGroup builds its header from its children with `React.Children.toArray` and reads each card's `icon`, `status` and `duration` props. That is why cards must be direct children – the group never needs its own list of calls.",
]
