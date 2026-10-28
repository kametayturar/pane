import { RaceBarChart, type RaceFrame, type RaceGroup, type RaceItem } from "@/components/ui/race-bar-chart"

export const notes: string[] = [
  "Time is continuous. A requested time `req` advances while playing, and the drawn `clock` follows it on a critically damped spring (acceleration = w^2 (req - clock) - 2w v). Values are interpolated between two frames at the clock, so bars grow smoothly and the numbers count instead of jumping, and stepping or scrubbing simply moves `req` and lets the clock glide.",
  "Every frame the items are re-sorted by their interpolated value. Each row owns a spring toward its rank slot (`y = rank x 36px`), so an overtake is a slide rather than a swap; rows below the cut spring to a slot under the plot and fade out, which is also how a row 'rises from below' when it enters the top set.",
  "One requestAnimationFrame loop writes `transform`, `width` and `textContent` straight to the rows. React only renders when the shown period changes, which is also when the big period label re-keys and replays its blur-in. The loop sleeps when nothing is playing or moving, and playback pauses while the chart is off screen (IntersectionObserver).",
  "The value axis scale chases the largest visible bar with `1 - exp(-dt / tau)`. Gridlines come from a small pool of tick elements keyed by value: ticks of the current step fade in, stale ones fade out, so a change of step cross-fades while positions glide with the scale.",
  "The timeline is a real `role=slider` with the period as `aria-valuetext`; dragging it sets the requested time from the pointer's x, and on release it snaps to the nearest period. Below 400px names move inside the bars and each value is placed after the longer of the bar and the name.",
]

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const GROUPS: RaceGroup[] = [
  { id: "retrieval", label: "Retrieval" },
  { id: "execution", label: "Execution" },
  { id: "comms", label: "Comms" },
  { id: "data", label: "Data" },
]

/** Weekly tool calls, in thousands: a steady base plus an adoption curve that starts at a different month for each tool. */
const TOOLS: (RaceItem & { base: number; boost: number; mid: number; width: number })[] = [
  { id: "search", label: "Web search", group: "retrieval", base: 30, boost: 120, mid: 3, width: 2.2 },
  { id: "files", label: "File reader", group: "retrieval", base: 22, boost: 60, mid: 5.5, width: 2.5 },
  { id: "vector", label: "Vector lookup", group: "retrieval", base: 6, boost: 210, mid: 7, width: 1.5 },
  { id: "code", label: "Code runner", group: "execution", base: 10, boost: 260, mid: 8.2, width: 1.4 },
  { id: "browser", label: "Browser", group: "execution", base: 40, boost: 40, mid: 4, width: 2 },
  { id: "email", label: "Email draft", group: "comms", base: 34, boost: 30, mid: 2.5, width: 2.5 },
  { id: "calendar", label: "Calendar", group: "comms", base: 24, boost: 56, mid: 6, width: 2 },
  { id: "chat", label: "Chat post", group: "comms", base: 18, boost: 90, mid: 9, width: 1.8 },
  { id: "sql", label: "SQL query", group: "data", base: 20, boost: 150, mid: 5, width: 1.6 },
  { id: "sheet", label: "Spreadsheet", group: "data", base: 28, boost: 20, mid: 3, width: 3 },
]

const ITEMS: RaceItem[] = TOOLS.map(({ id, label, group }) => ({ id, label, group }))

/** Cumulative calls through each month. */
const FRAMES: RaceFrame[] = (() => {
  const totals: Record<string, number> = {}
  return MONTHS.map((period, m) => {
    const values: Record<string, number> = {}
    for (const t of TOOLS) {
      const weekly = t.base + t.boost / (1 + Math.exp(-(m - t.mid) / (t.width * 0.45)))
      totals[t.id] = (totals[t.id] ?? 0) + weekly * 4.3
      values[t.id] = Math.round(totals[t.id]!)
    }
    return { period, values }
  })
})()

const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}M` : `${Math.round(v)}K`)

export default function Demo() {
  return (
    <div className="w-full max-w-[640px]">
      <RaceBarChart
        items={ITEMS}
        frames={FRAMES}
        groups={GROUPS}
        label="Agent tool calls, cumulative by month"
        title="Tool calls"
        subtitle="Cumulative, year to date"
        formatValue={fmt}
        highlight="code"
        bars={8}
        frameDuration={1500}
      />
    </div>
  )
}
