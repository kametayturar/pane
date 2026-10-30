import * as React from "react"

import { MergeRange, type MergeRangeAgent, type MergeRangeResult } from "@/components/ui/merge-range"

const PENDING: MergeRangeAgent[] = [
  { name: "Sage", time: "12s" },
  { name: "Juno", time: "31s" },
  { name: "Atlas", time: "22s" },
]
const ANSWERS = [128.5, 94, 149]

export const notes = [
  "Each price is real text in an absolutely placed token, drawn once at the final size (the size that makes `$19–$31` fit the card, measured from the real glyphs) and scaled down into its column. Reading the widths and writing positions happens in one pass and lands as custom properties (`--h` home, `--f` final, `--nx` for the names), so after that the whole piece is CSS: no animation frames run.",
  "The decisive moment is one attribute. When the third agent reports, the card gets `data-merged`: the cheapest and the priciest token transition from their columns to the two ends of the range and grow from column size to full size on one curve, the middle token slides to the dash, shrinks and blurs out, and an en dash blurs in between the ends. Kestrel and Tandem slide under their prices and Brightline fades with its figure.",
  "The three prices arrive at their own times (9s, 21s and 34s in the story, 0, 1 and 2 seconds on screen) and each lands with a blur-up, the dash breathing in its column until then. The built-in run is a small timer ladder: a state number moves through the beats, so the built-in run pauses off screen and in hidden tabs (with your own agents the last beats are plain timers and CSS transitions), and a throttled tab still reaches the final frame.",
  "With no props the card plays its own run and loops, until a press, key, focus or mouse movement lands on the piece itself. Pass `agents` and each price that arrives fills its column; when all three are in, it merges. The lowest and the highest become the ends whatever their column, and if all three match one price remains. Reduced motion shows the finished range.",
]

function Driven() {
  const [agents, setAgents] = React.useState<MergeRangeAgent[]>(PENDING)
  const [log, setLog] = React.useState("Waiting for three agents")
  const [run, setRun] = React.useState(0)

  // The prices arrive from outside, one at a time, like results from three running agents.
  React.useEffect(() => {
    const timers = [1, 0, 2].map((i, n) =>
      window.setTimeout(() => {
        setAgents((cur) => cur.map((a, j) => (j === i ? { ...a, price: ANSWERS[i] } : a)))
        setLog(`${PENDING[i].name} reported (${n + 1} of 3)`)
      }, 900 + n * 1300),
    )
    return () => timers.forEach(clearTimeout)
  }, [run])

  // Reset in place: the same instance stays mounted, so the focused button keeps its place.
  const restart = () => {
    setAgents(PENDING)
    setLog("Waiting for three agents")
    setRun((n) => n + 1)
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <MergeRange
        title="What the agencies quote"
        currency="€"
        unit="per month"
        agents={agents}
        onRestart={restart}
        onMerge={(r: MergeRangeResult) => setLog(`Merged: €${r.low}–€${r.high}, ${r.lowAgent} lowest, ${r.highAgent} highest`)}
      />
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {log}
      </p>
    </div>
  )
}

export default function Demo() {
  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 440 }}>
      {/* 1 · Built in: plays the decisive moment and loops until you touch it. */}
      <MergeRange />

      {/* 2 · Your own agents, prices and callbacks: the prices arrive from outside */}
      <Driven />
    </div>
  )
}
