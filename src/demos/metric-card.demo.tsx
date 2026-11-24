import * as React from "react"

import { MetricCard, MetricGrid, type MetricCardProps } from "@/components/ui/metric-card"
import { SegmentedControl } from "@/components/ui/segmented-control"

type Period = "today" | "week" | "month"

const WORDS: Record<Period, { period: string; previousPeriod: string }> = {
  today: { period: "today", previousPeriod: "yesterday" },
  week: { period: "this week", previousPeriod: "last week" },
  month: { period: "this month", previousPeriod: "last month" },
}

/** A smooth, deterministic shape from `a` to `b` with a little texture, so each period has its own line. */
function shape(a: number, b: number, n: number, seed: number, wobble: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const base = a + (b - a) * (t * t * (3 - 2 * t))
    const w = Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.9 + seed * 2.3) * 0.4
    return base + w * wobble * (i === n - 1 ? 0 : 1)
  })
}

type Card = Omit<MetricCardProps, "period" | "previousPeriod">

const DATA: Record<Period, Card[]> = {
  today: [
    {
      label: "Model calls",
      value: 7940,
      previous: 7310,
      reason: "mostly Atlas's morning invoice run",
      drivers: [
        { label: "Atlas invoice run", value: 520, note: "1,240 Northwind invoices at 08:00" },
        { label: "Sage support replies", value: 170 },
        { label: "Quill drafts", value: -60 },
      ],
      spark: shape(180, 420, 12, 1, 40),
      sparkPrevious: shape(170, 380, 12, 4, 30),
    },
    {
      label: "Cost",
      format: "currency",
      value: 166.2,
      previous: 168.1,
      goodWhen: "down",
      reason: "mostly Sage Mini routing",
      drivers: [
        { label: "Triage on Sage Mini", value: -3.1 },
        { label: "Nova 2 Pro long contexts", value: 1.6 },
        { label: "Embeddings", value: -0.4 },
      ],
      spark: shape(4, 11, 12, 2, 1.2),
      sparkPrevious: shape(4.4, 11.4, 12, 6, 1),
    },
    {
      label: "Median latency",
      format: "duration",
      value: 905,
      previous: 790,
      goodWhen: "down",
      reason: "mostly a slow Nova 2 Pro region",
      drivers: [
        { label: "Nova 2 Pro, east region", value: 88, note: "Queueing since 10:20" },
        { label: "Quill retrieval step", value: 31 },
        { label: "Sage Mini", value: -4 },
      ],
      spark: shape(780, 930, 12, 3, 30),
      sparkPrevious: shape(800, 780, 12, 1, 18),
    },
    {
      label: "Eval pass rate",
      format: "percent",
      value: 93.8,
      previous: 93.8,
      goodWhen: "up",
      spark: shape(93.5, 93.8, 12, 5, 0.3),
      sparkPrevious: shape(93.9, 93.8, 12, 2, 0.25),
    },
  ],
  week: [
    {
      label: "Model calls",
      value: 48210,
      previous: 43050,
      reason: "mostly Sage Mini calls",
      drivers: [
        { label: "Sage Mini", value: 4120, note: "Atlas moved invoice triage here on Tuesday" },
        { label: "Nova 2 Pro", value: 1480, note: "Longer support threads from Northwind" },
        { label: "Quill drafts", value: -440 },
      ],
      spark: shape(6100, 7300, 7, 2, 260),
      sparkPrevious: shape(5900, 6200, 7, 5, 160),
    },
    {
      label: "Cost",
      format: "currency",
      value: 1108,
      previous: 1192,
      goodWhen: "down",
      reason: "mostly triage moved to Sage Mini",
      drivers: [
        { label: "Invoice triage", value: -112, note: "Now on Sage Mini instead of Nova 2 Pro" },
        { label: "Nova 2 Pro long contexts", value: 41 },
        { label: "Embeddings", value: -13 },
      ],
      spark: shape(176, 150, 7, 1, 8),
      sparkPrevious: shape(168, 172, 7, 3, 7),
    },
    {
      label: "Median latency",
      format: "duration",
      value: 840,
      previous: 712,
      goodWhen: "down",
      defaultOpen: true,
      reason: "mostly long Nova 2 Pro contexts",
      drivers: [
        { label: "Nova 2 Pro long contexts", value: 96, note: "Harbor & Finch contracts, 60k tokens each" },
        { label: "Quill retrieval step", value: 41 },
        { label: "Sage Mini", value: -9 },
      ],
      spark: shape(700, 870, 7, 4, 26),
      sparkPrevious: shape(720, 705, 7, 2, 14),
    },
    {
      label: "Eval pass rate",
      format: "percent",
      value: 94.2,
      previous: 93.1,
      goodWhen: "up",
      reason: "mostly fewer refund-policy misses",
      drivers: [
        { label: "Refund policy suite", value: 0.8 },
        { label: "Invoice extraction", value: 0.5 },
        { label: "Tone checks", value: -0.2 },
      ],
      spark: shape(93.2, 94.4, 7, 3, 0.25),
      sparkPrevious: shape(93.3, 93, 7, 1, 0.2),
    },
  ],
  month: [
    {
      label: "Model calls",
      value: 196400,
      previous: 171900,
      reason: "mostly Sage Mini calls",
      drivers: [
        { label: "Sage Mini", value: 18300 },
        { label: "Nova 2 Pro", value: 7900 },
        { label: "Quill drafts", value: -1700 },
      ],
      spark: shape(5400, 7400, 15, 2, 380),
      sparkPrevious: shape(5300, 6100, 15, 6, 300),
    },
    {
      label: "Cost",
      format: "currency",
      value: 4862,
      previous: 5310,
      goodWhen: "down",
      reason: "mostly triage moved to Sage Mini",
      drivers: [
        { label: "Invoice triage", value: -512 },
        { label: "Nova 2 Pro long contexts", value: 96 },
        { label: "Embeddings", value: -32 },
      ],
      spark: shape(182, 150, 15, 4, 9),
      sparkPrevious: shape(170, 180, 15, 1, 8),
    },
    {
      label: "Median latency",
      format: "duration",
      value: 768,
      previous: 801,
      goodWhen: "down",
      reason: "mostly cached Northwind prompts",
      drivers: [
        { label: "Prompt cache", value: -41, note: "Northwind's system prompt, cached since the 9th" },
        { label: "Nova 2 Pro long contexts", value: 12 },
        { label: "Sage Mini", value: -4 },
      ],
      spark: shape(805, 760, 15, 3, 18),
      sparkPrevious: shape(790, 812, 15, 5, 16),
    },
    {
      label: "Eval pass rate",
      format: "percent",
      value: 92.6,
      previous: 94,
      goodWhen: "up",
      reason: "mostly the new refund-policy suite",
      drivers: [
        { label: "Refund policy suite", value: -1.6, note: "Added on the 14th, 40 harder cases" },
        { label: "Invoice extraction", value: 0.4 },
        { label: "Tone checks", value: -0.2 },
      ],
      spark: shape(94.1, 92.5, 15, 2, 0.3),
      sparkPrevious: shape(93.6, 94, 15, 4, 0.25),
    },
  ],
}

export default function Demo() {
  const [period, setPeriod] = React.useState<Period>("week")
  const [loading, setLoading] = React.useState(false)
  const words = WORDS[period]

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 1120 }}>
      {/* 1 · Four AI-product metrics on one surface. Switch the period and every figure rolls to its new value. */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <h3 className="m-0 text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Harbor &amp; Finch · AI usage</h3>
          <SegmentedControl
            aria-label="Period"
            size="sm"
            variant="tray"
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
            ]}
          />
        </div>
        <MetricGrid label={`AI usage, ${words.period}`}>
          {DATA[period].map((c) => (
            <MetricCard key={c.label} {...c} {...words} />
          ))}
        </MetricGrid>
      </section>

      {/* 2 · One card alone, plus the loading and no-data states */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Tokens per answer"
          value={1840}
          previous={1610}
          loading={loading}
          reason="mostly Sage's longer citations"
          drivers={[
            { label: "Sage citations", value: 190, note: "Quotes now include the clause number" },
            { label: "Quill summaries", value: 60 },
            { label: "Atlas tool results", value: -20 },
          ]}
          spark={shape(1580, 1860, 7, 3, 40)}
          sparkPrevious={shape(1600, 1620, 7, 1, 30)}
          sparkPlacement="under"
        />
        <MetricCard label="Escalations to a person" value={null} period="this week" emptyText="No escalations this week" />
        <div className="flex flex-col items-start gap-2">
          <MetricCard label="Tool errors" loading />
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1100)
            }}
            className="rounded-md px-2 py-1 text-[12px] text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white"
          >
            Reload tokens per answer
          </button>
        </div>
      </section>
    </div>
  )
}

export const notes = [
  "The change is written, not drawn: the card works out the move from `value` and `previous` and writes it as the start of a sentence (\"Up 12% on last week\", \"Down 1.4 points on last month\", \"Level with yesterday\"), and `reason` finishes it. With `drivers` the reason is a real button with `aria-expanded`; it opens a ranked list in place by moving `grid-template-rows` from 0fr to 1fr, and each line lands with a short blur-in. The largest three drivers are ranked by how hard they push the way the figure moved; whatever they do not explain is listed as \"Everything else\". Escape closes it and returns focus to the reason.",
  "Each digit of the big number is a clipped column holding 0 to 9. Characters are keyed from the right, so when the period changes a digit keeps its column and its strip slides once from the old digit to the new one with a CSS transform transition (a 34ms stagger left to right). On first show the figure starts at the previous period's value and settles on this one. Because it is a transition, the final number is in the DOM at once even if no frame runs.",
  "Colour is reserved for a bad move. `goodWhen` says which way is good; a move the other way writes the change in the destructive tone and tints the spark line, while every other move stays neutral text. Moves under `flatWithin` (0.5%, or 0.1 points for rates) read as level.",
  "The spark line is one SVG path per period with `vector-effect: non-scaling-stroke`, the previous period dashed and fainter on the same scale. Its `d` is also set as a CSS property, so in Chromium the line redraws from the old shape to the new one when the period changes. `MetricGrid` lays cards out with `auto-fit` columns; each cell draws a hairline on its left and top with a box-shadow, and the grid clips the outer ones, so the cards share lines instead of sitting in separate boxes.",
]
