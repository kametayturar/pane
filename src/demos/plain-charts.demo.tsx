import * as React from "react"

import {
  AreaChart,
  BarChart,
  ComboChart,
  DonutChart,
  LineChart,
  type ChartDatum,
  type ChartSeries,
} from "@/components/ui/plain-charts"
import { SegmentedControl } from "@/components/ui/segmented-control"

/* Invented usage of an AI product: 30 days to Tue 24 Nov 2026, three models, weekends quieter. */
const MODELS: ChartSeries[] = [
  { key: "nova", label: "Nova 2 Pro" },
  { key: "sage", label: "Sage Mini" },
  { key: "flash", label: "Nova 2 Flash" },
]
const COMBO: ChartSeries[] = [
  { key: "calls", label: "Calls", noun: "calls" },
  { key: "p95", label: "p95 latency", noun: "p95 latency", format: "duration" },
]

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Day = { x: string; calls: Record<string, number>; tokens: Record<string, number>; cost: Record<string, number>; p95: number }
const DAYS: Day[] = (() => {
  const r = rng(14)
  const end = Date.UTC(2026, 10, 24)
  const base = { nova: 9800, sage: 8200, flash: 5200 }
  const perCall = { nova: 2150, sage: 1500, flash: 1000 }
  const price = { nova: 3, sage: 1.8, flash: 2.2 } // dollars per million tokens
  const out: Day[] = []
  for (let i = 29; i >= 0; i--) {
    const ms = end - i * 86400000
    const wd = new Date(ms).getUTCDay()
    const weekend = wd === 0 || wd === 6 ? 0.58 : wd === 1 ? 0.94 : 1
    const trend = 1 + (29 - i) * 0.011
    const calls: Record<string, number> = {}
    const tokens: Record<string, number> = {}
    const cost: Record<string, number> = {}
    for (const k of ["nova", "sage", "flash"] as const) {
      // Sage Mini takes off in the last ten days, after a price cut.
      const lift = k === "sage" && i < 10 ? 1 + (10 - i) * 0.06 : 1
      const c = Math.round(base[k] * weekend * trend * lift * (0.9 + r() * 0.2))
      calls[k] = c
      tokens[k] = Math.round(c * perCall[k] * (0.92 + r() * 0.16))
      cost[k] = Math.round((tokens[k] / 1e6) * price[k] * 100) / 100
    }
    const load = calls.nova! + calls.sage! + calls.flash!
    out.push({ x: new Date(ms).toISOString().slice(0, 10), calls, tokens, cost, p95: Math.round(560 + load / 62 + r() * 120) })
  }
  return out
})()

const rowsFor = (days: Day[], pick: (d: Day) => Record<string, number>): ChartDatum[] => days.map((d) => ({ x: d.x, ...pick(d) }))

const TYPES = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "bar", label: "Bar" },
  { value: "combo", label: "Combo" },
  { value: "donut", label: "Donut" },
]
const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
]
const STACKS = [
  { value: "grouped", label: "Grouped" },
  { value: "stacked", label: "Stacked" },
]

export default function Demo() {
  const [type, setType] = React.useState("line")
  const [range, setRange] = React.useState("7")
  const [stack, setStack] = React.useState("grouped")

  const days = React.useMemo(() => DAYS.slice(-Number(range)), [range])
  const data = React.useMemo(
    () => ({
      calls: rowsFor(days, (d) => d.calls),
      tokens: rowsFor(days, (d) => d.tokens),
      cost: rowsFor(days, (d) => d.cost),
      combo: days.map((d) => ({ x: d.x, calls: d.calls.nova! + d.calls.sage! + d.calls.flash!, p95: d.p95 })),
    }),
    [days],
  )

  const rangeSwitch = <SegmentedControl size="sm" aria-label="Range" options={RANGES} value={range} onChange={setRange} />

  return (
    <div className="mx-auto flex w-full flex-col gap-4" style={{ maxWidth: 680 }}>
      <SegmentedControl aria-label="Chart" kind="tabs" size="sm" options={TYPES} value={type} onChange={setType} />

      {type === "line" && (
        <LineChart title="Calls by model" unit="calls" data={data.calls} series={MODELS} actions={rangeSwitch} />
      )}
      {type === "area" && (
        <AreaChart stacked title="Tokens by model" unit="tokens" data={data.tokens} series={MODELS} actions={rangeSwitch} />
      )}
      {type === "bar" && (
        <BarChart
          stacked={stack === "stacked"}
          title="Cost by model"
          unit="cost"
          format="currency"
          data={data.cost}
          series={MODELS}
          actions={
            <>
              <SegmentedControl size="sm" aria-label="Bars" options={STACKS} value={stack} onChange={setStack} />
              {rangeSwitch}
            </>
          }
        />
      )}
      {type === "combo" && (
        <ComboChart title="Calls and p95 latency" lineKey="p95" data={data.combo} series={COMBO} actions={rangeSwitch} />
      )}
      {type === "donut" && (
        <DonutChart
          title="Cost by model"
          unit="cost"
          format="currency"
          period={`over ${range} days`}
          data={data.cost}
          series={MODELS}
          actions={rangeSwitch}
        />
      )}
    </div>
  )
}

export const notes = [
  "One file holds five charts that share a data shape (rows of `{ x, ...series }`), one axis style and one readout. Line, area, bar and combo are one internal component: it turns the rows into tracks (for every series and point an x, a width, a bottom and a top in pixels), and each chart only decides how a track is drawn – a polyline, a flat-filled area, or bars.",
  "The readout is a sentence above the plot, not a floating box. Hovering or arrow-keying sets one active index; a hairline (or a faint band for bars) marks it and the sentence is rebuilt from that row: the day, the value large in tabular figures, the series, and the change on the previous day ('8% up on Monday'). Only the series the sentence is about takes the accent; the others are ink at stepped alphas.",
  "When the data or range changes, a single requestAnimationFrame loop tweens the tracks from the painted frame to the new one with the one easing curve, writing `d` attributes directly (no React render per frame). Different lengths are resampled first – linearly for lines, so a 7-point line redraws into a 30-point one point to point, and to the nearest bar for bars, so bars split, grow and shrink. A timeout lands the final frame if frames never come.",
  "A ResizeObserver gives the plot its width; ticks are round steps (1, 2, 2.5, 5 × 10ⁿ) and day labels fall on whole weeks for long ranges. The legend words are toggle buttons with aria-pressed, the plot is a focusable group with an aria-live sentence for keyboard moves, and a visually hidden table carries every value.",
]
