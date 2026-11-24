import * as React from "react"

import { RangeBar, resolveRangeBar, type RangeBarFacet, type RangeBarResolved, type RangeBarValue } from "@/components/ui/range-bar"

const MODELS: RangeBarFacet = {
  id: "model",
  name: "Models",
  all: "all models",
  options: [
    { id: "nova-2-pro", label: "Nova 2 Pro" },
    { id: "nova-2-flash", label: "Nova 2 Flash" },
    { id: "sage-mini", label: "Sage Mini" },
    { id: "sage-3", label: "Sage 3" },
    { id: "quill-code", label: "Quill Code" },
  ],
}

const AGENTS: RangeBarFacet = {
  id: "agent",
  name: "Agents",
  lead: "by",
  all: "every agent",
  options: [
    { id: "atlas", label: "Atlas" },
    { id: "quill", label: "Quill" },
    { id: "sage", label: "Sage" },
  ],
}

/* Invented traffic: a weekly rhythm, slow growth and some noise per model, the same for the same day every time. */
const BASE: Record<string, number> = { "nova-2-pro": 820, "nova-2-flash": 640, "sage-mini": 310, "sage-3": 170, "quill-code": 90 }
const SHARE: Record<string, number> = { atlas: 0.46, quill: 0.31, sage: 0.23 }
const dayNo = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5)
const noise = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function calls(from: Date, to: Date, models: string[], agents: string[] = []) {
  const ms = models.length ? models : Object.keys(BASE)
  const share = agents.length ? agents.reduce((s, a) => s + SHARE[a], 0) : 1
  let sum = 0
  for (let d = dayNo(from); d <= dayNo(to); d++) {
    const wd = (((d + 4) % 7) + 7) % 7
    const week = wd === 0 || wd === 6 ? 0.58 : 1
    const trend = 1 + (d - 20000) * 0.0009
    ms.forEach((m, k) => (sum += BASE[m] * week * trend * (0.8 + 0.4 * noise(d * 7 + k))))
  }
  return Math.round(sum * share)
}

function Readout({ r, noun }: { r: RangeBarResolved; noun: string }) {
  const now = calls(r.from, r.to, r.filters.model ?? [], r.filters.agent)
  const before = r.compare ? calls(r.compare.from, r.compare.to, r.filters.model ?? [], r.filters.agent) : null
  const pct = before ? Math.round(((now - before) / before) * 100) : null
  const change = pct == null ? "" : pct === 0 ? ", level" : `, ${Math.abs(pct)}% ${pct > 0 ? "up" : "down"}`
  const text = `${now.toLocaleString("en-US")} ${noun}${change}`
  return (
    <p key={text} aria-live="polite">
      <b>{now.toLocaleString("en-US")}</b> {noun}
      {change}
    </p>
  )
}

export default function Demo() {
  // 1 · Controlled: the parent owns the value and the readout follows the resolved days.
  const [value, setValue] = React.useState<RangeBarValue>({ range: { preset: "7d" }, compare: "previous", filters: {} })
  const r = React.useMemo(() => resolveRangeBar(value, { facets: [MODELS] }), [value])

  // 2 · Uncontrolled, two filters, weeks from Sunday, nothing before March.
  const start: RangeBarValue = { range: { preset: "30d" }, compare: "year" }
  const [r2, setR2] = React.useState(() => resolveRangeBar(start, { facets: [MODELS, AGENTS] }))
  const min = React.useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear() - 1, 2, 1)
  }, [])

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 720 }}>
      <div className="flex flex-col gap-3">
        <RangeBar value={value} onChange={(v) => setValue(v)} facets={[MODELS]}>
          <Readout r={r} noun="calls" />
        </RangeBar>
        <p className="px-1 font-mono text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
          from {r.fromISO} to {r.toISO}
          {r.compare ? ` · against ${r.compare.fromISO} to ${r.compare.toISO}` : ""}
        </p>
      </div>

      <RangeBar
        context="Northwind · Agent runs"
        label="Runs range"
        facets={[MODELS, AGENTS]}
        defaultValue={start}
        weekStartsOn={0}
        min={min}
        onChange={(_, res) => setR2(res)}
      >
        <Readout r={r2} noun="runs" />
      </RangeBar>
    </div>
  )
}

export const notes = [
  "The sentence is a row of inline-block words, so it wraps like text but every word can move. On a change the bar reads where each word is drawn, React renders the new sentence, and each word that stayed is animated from its old spot to its new one (FLIP). A phrase whose words changed leaves a copy behind that blurs out while the new words blur in, words that leave do the same, and the box eases between its two measured heights.",
  "The comparison is part of the grammar: choosing Nothing removes 'compared with …' and the sentence closes up to 'Last 7 days, for all models'; the line under it then offers Add a comparison. 'The 7 before' drops the noun only when the range already said 'days'.",
  "Dates are whole-day integers (days since 1970, Hinnant's civil-date formulas), so there is no date library and daylight saving never shifts a range. Month lengths and leap years come from the Gregorian rule, the previous period is the same number of days just before, and the same days last year clamp Feb 29 to Feb 28. `min`, `max` (today by default) and `weekStartsOn` shape the calendar.",
  "Each popover is a real listbox (focus moves in, arrows, Home/End, type to jump, Enter or Space) or, for Custom…, a dialog whose list turns into a two-month calendar in place: the surface measures its content and glides between sizes. Arrow keys move by day and week, Page Up/Down by month, the band previews the range under the pointer, and Escape or a press outside closes it with focus back on the phrase. Below 600px it shows one month.",
]
