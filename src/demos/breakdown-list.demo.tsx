import * as React from "react"

import { BreakdownList, type BreakdownItem } from "@/components/ui/breakdown-list"
import { SegmentedControl } from "@/components/ui/segmented-control"

/* 1 · Harbor & Finch's model costs. The period switch re-ranks the rows: Lumen Code leads today, Nova 2 Pro the week, and the month runs over budget. */
type Period = "today" | "week" | "month"

const MODELS: Record<string, { label: string; note?: string }> = {
  "nova-pro": { label: "Nova 2 Pro", note: "long contexts" },
  "sage-mini": { label: "Sage Mini", note: "triage" },
  "nova-flash": { label: "Nova 2 Flash" },
  lumen: { label: "Lumen Code", note: "Atlas refactors" },
  embed: { label: "Atlas Embed" },
  orca: { label: "Orca Vision", note: "receipt scans" },
  rerank: { label: "Sage Rerank" },
  audio: { label: "Nova Audio" },
  tern: { label: "Tern Tiny" },
  quill: { label: "Quill Draft" },
}

const COST: Record<Period, { unit: string; budget: number; values: Record<string, number> }> = {
  today: {
    unit: "today",
    budget: 215,
    values: { lumen: 64, "nova-pro": 58, "sage-mini": 31, "nova-flash": 19, orca: 11, embed: 6, rerank: 3, audio: 2, tern: 1, quill: 1 },
  },
  week: {
    unit: "this week",
    budget: 1500,
    values: { "nova-pro": 612, "sage-mini": 198, "nova-flash": 121, lumen: 83, embed: 40, orca: 22, rerank: 14, audio: 9, tern: 6, quill: 3 },
  },
  month: {
    unit: "this month",
    budget: 5000,
    values: { "nova-pro": 2940, "sage-mini": 1020, lumen: 610, "nova-flash": 480, orca: 260, embed: 170, rerank: 64, audio: 41, tern: 22, quill: 13 },
  },
}

const costItems = (p: Period): BreakdownItem[] =>
  Object.entries(COST[p].values).map(([id, value]) => ({ id, value, ...MODELS[id] }))

/* 2 · Atlas fills a 200k context window turn by turn; the test output pushes it past the compaction point, then it compacts. */
type Turn = { what: string; system: number; tools: number; files: number; history: number; results: number }
const TURNS: Turn[] = [
  { what: "Started the billing refactor", system: 6200, tools: 14100, files: 0, history: 1200, results: 0 },
  { what: "Read 6 files", system: 6200, tools: 14100, files: 41000, history: 4300, results: 8200 },
  { what: "Planned the change", system: 6200, tools: 14100, files: 52000, history: 12400, results: 15600 },
  { what: "Edited billing.ts", system: 6200, tools: 14100, files: 64000, history: 26100, results: 24300 },
  { what: "Ran the test suite", system: 6200, tools: 14100, files: 64000, history: 31800, results: 72600 },
  { what: "Compacted the history", system: 6200, tools: 14100, files: 30500, history: 9200, results: 6800 },
]
const contextItems = (t: Turn): BreakdownItem[] => [
  { id: "system", label: "System prompt", value: t.system },
  { id: "tools", label: "Tools", value: t.tools, note: "14 definitions" },
  { id: "files", label: "Files", value: t.files },
  { id: "history", label: "History", value: t.history },
  { id: "results", label: "Tool results", value: t.results },
]

const quiet =
  "rounded-md px-2 py-1 text-[12px] text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white"

export default function Demo() {
  const [use, setUse] = React.useState<"cost" | "context">("cost")
  const [period, setPeriod] = React.useState<Period>("week")
  const [turn, setTurn] = React.useState(3)
  const [picked, setPicked] = React.useState("Point at a row or a segment. Click a row to open it.")
  const t = TURNS[turn]

  return (
    <div className="mx-auto flex w-full flex-col items-start gap-5" style={{ maxWidth: 480 }}>
      <SegmentedControl
        aria-label="Example"
        size="sm"
        variant="tray"
        value={use}
        onChange={(v) => setUse(v as "cost" | "context")}
        options={[
          { value: "cost", label: "Cost by model" },
          { value: "context", label: "Context window" },
        ]}
      />

      {use === "cost" ? (
        <>
          <BreakdownList
            key="cost"
            title="Harbor & Finch · cost by model"
            unit={COST[period].unit}
            format="currency"
            items={costItems(period)}
            limit={{ value: COST[period].budget, label: "budget" }}
            onSelect={(it) => setPicked(`Opened ${it.label}: ${fmtUsd(it.value)} ${COST[period].unit}`)}
            actions={
              <SegmentedControl
                aria-label="Period"
                size="sm"
                variant="buttons"
                value={period}
                onChange={(v) => setPeriod(v as Period)}
                options={[
                  { value: "today", label: "Today" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
              />
            }
          />
          <p className="px-1 text-[12px] text-neutral-600 dark:text-neutral-400" aria-live="polite">
            {picked}
          </p>
        </>
      ) : (
        <>
          <BreakdownList
            key="context"
            title="Atlas · context window"
            unit="of 200k tokens"
            format="tokens"
            total={200_000}
            shareOf="the window"
            limit={{ value: 160_000, label: "compaction point" }}
            items={contextItems(t)}
          />
          <div className="flex w-full flex-wrap items-center justify-between gap-2 px-1 text-[12px] text-neutral-600 dark:text-neutral-400">
            <span aria-live="polite">
              Turn {turn + 1} of {TURNS.length} · {t.what}
            </span>
            <span className="flex items-center gap-1">
              <button type="button" className={quiet} onClick={() => setTurn(0)} disabled={turn === 0}>
                Restart
              </button>
              <button
                type="button"
                className="rounded-md bg-neutral-900 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={() => setTurn((n) => Math.min(TURNS.length - 1, n + 1))}
                disabled={turn === TURNS.length - 1}
              >
                Next turn
              </button>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const fmtUsd = (n: number) => usd.format(n)

export const notes = [
  "The share bar and the list are drawn from the same ranked parts. Each segment is a full-width layer cut to its span with `clip-path: inset(...)` from two custom properties (start and end as fractions), so a new share is a clip-path transition rather than a relayout, and the gaps between segments are a 1px inset on each side. Tones are steps of ink alpha by rank, so the largest part is darkest whatever the order.",
  "A limit is a second copy of the segments in the destructive tone, clipped to start at the limit. Below the limit it shows nothing; once the parts run past it, only the overrun turns red. The marker is a full-width layer moved with `translateX` (a percentage of its own width is a percentage of the bar), so it glides with the scale.",
  "Pointing at a row or a segment sets one active key on the card. CSS gives that row's hairline and that segment the accent and dims the rest, and the line under the total swaps to the row's sentence. Every sentence it can say is laid out invisibly in the same grid cell, so the cell is as tall as the longest and nothing below moves.",
  "When the data changes, rows glide to their new rank with FLIP (offsetTop before and after, then a Web Animations translate back to zero), bars settle with a transform transition, and one requestAnimationFrame loop writes the in-between numbers into the text nodes. React always renders the final number, and a timeout lands it if frames never arrive.",
  "The list is one Tab stop: arrow keys move between rows and the fold, Home and End jump, Escape clears the highlight or closes the fold. Rows are buttons only when `onSelect` is passed. Reduced motion swaps every value instantly.",
]
