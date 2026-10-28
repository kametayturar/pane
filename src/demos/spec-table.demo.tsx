import * as React from "react"

import { SpecTable, type SpecColumn } from "@/components/ui/spec-table"

type Run = {
  id: string
  prompt: string
  model: string
  score: number
  latency: number
  cost: number
  status: string
}

const RUNS: Run[] = [
  { id: "r-0412-01", prompt: "Summarise a clinic intake form", model: "Atlas 2", score: 0.92, latency: 412, cost: 0.0041, status: "pass" },
  { id: "r-0412-02", prompt: "Extract line items from an invoice", model: "Nova Large", score: 0.88, latency: 538, cost: 0.0092, status: "pass" },
  { id: "r-0412-03", prompt: "Draft a refund reply, polite tone", model: "Sage", score: 0.74, latency: 266, cost: 0.0018, status: "review" },
  { id: "r-0412-04", prompt: "Translate a shipping notice to German", model: "Quill", score: 0.95, latency: 181, cost: 0.0009, status: "pass" },
  { id: "r-0412-05", prompt: "Classify 40 support tickets by intent", model: "Nova Mini", score: 0.81, latency: 903, cost: 0.0124, status: "pass" },
  { id: "r-0412-06", prompt: "Explain a lab result in plain words", model: "Atlas 2", score: 0.58, latency: 477, cost: 0.0047, status: "fail" },
  { id: "r-0412-07", prompt: "Write SQL for monthly active users", model: "Nova Large", score: 0.9, latency: 624, cost: 0.011, status: "pass" },
  { id: "r-0412-08", prompt: "Find the contract's renewal clause", model: "Sage", score: 0.67, latency: 1186, cost: 0.0203, status: "review" },
  { id: "r-0412-09", prompt: "Rewrite release notes for customers", model: "Quill", score: 0.86, latency: 244, cost: 0.0012, status: "pass" },
  { id: "r-0412-10", prompt: "Plan a three-step onboarding email", model: "Nova Mini", score: 0.42, latency: 351, cost: 0.0035, status: "fail" },
  { id: "r-0412-11", prompt: "Answer from the Harbor & Finch handbook", model: "Atlas 2", score: 0.79, latency: 702, cost: 0.0086, status: "pass" },
  { id: "r-0412-12", prompt: "Reconcile two budget spreadsheets", model: "Nova Large", score: 0.71, latency: 1342, cost: 0.0261, status: "review" },
]

const COLUMNS: SpecColumn<Run>[] = [
  { key: "prompt", label: "Prompt", type: "text", width: 270, sortable: true },
  { key: "model", label: "Model", type: "mono", width: 110, sortable: true },
  { key: "score", label: "Score", type: "dither", width: 170, sortable: true },
  { key: "latency", label: "Latency", type: "number", unit: "ms", width: 110, sortable: true },
  { key: "cost", label: "Cost", type: "number", width: 110, sortable: true, format: (v) => `$${(v as number).toFixed(4)}` },
  { key: "status", label: "Status", type: "status", width: 120, sortable: true },
]

type View = "data" | "loading" | "empty"

const VIEWS: { id: View; label: string }[] = [
  { id: "data", label: "Rows" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
]

export const notes: string[] = [
  "The dither bar is a single SVG path of 1x1 'on' cells whose count comes from an 8x8 Bayer threshold matrix: a cell is drawn when its threshold is below the value. Being vector with crisp edges, it stays sharp at any device pixel ratio and inherits colour from `currentColor`.",
  "Rows scan in by animating `clip-path: inset()` on the `<tbody>` while one absolutely positioned 1px line animates `top` over the same duration and easing, so the line always sits on the edge of the reveal. Changing the tbody's `key` on sort replays it.",
  "Sorting and selection are 'controllable' state: the component uses the prop when given and its own `useState` otherwise, and always calls `onSortChange` / `onSelect`.",
  "Keyboard support uses a roving tabindex on rows (one row is `tabIndex=0`, the rest -1); arrow keys call `focus()` on sibling `<tr>` elements, and `scroll-margin-top` keeps the focused row clear of the sticky header.",
  "The sticky header is `position: sticky; top: 0` inside the scroll container, and the first column is `position: sticky; left: 0` with an opaque background, so on a phone only the other columns slide sideways.",
]

const BUTTON =
  "rounded-[2px] px-3 py-1.5 font-mono text-[11px] tracking-[.08em] uppercase shadow-[0_0_0_1px_rgb(0_0_0/.14)] hover:bg-black/5 aria-pressed:bg-black/90 aria-pressed:text-white dark:shadow-[0_0_0_1px_rgb(255_255_255/.18)] dark:hover:bg-white/10 dark:aria-pressed:bg-white/90 dark:aria-pressed:text-black"

export default function Demo() {
  const [view, setView] = React.useState<View>("data")
  const [picked, setPicked] = React.useState<string | null>("r-0412-03")

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10.5px] tracking-[.08em] text-black/45 uppercase dark:text-white/45">
          Eval run 0412 · {picked ? `selected ${picked}` : "nothing selected"}
        </p>
        <div className="flex gap-2" role="group" aria-label="Table state">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className={BUTTON} aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <SpecTable<Run>
        columns={COLUMNS}
        rows={view === "empty" ? [] : RUNS}
        loading={view === "loading"}
        defaultSort={{ key: "score", dir: "desc" }}
        selected={picked}
        onSelect={(id) => setPicked(id)}
        maxHeight={420}
        summary={{ key: "cost", label: "Cost", format: (n) => `$${n.toFixed(4)}` }}
        empty="No prompts in this run yet."
        caption="FIG. 4 — Eval run 0412, twelve prompts across Atlas, Nova, Sage and Quill"
      />
    </div>
  )
}
