import * as React from "react"

import { SankeyFlow, type SankeyLink, type SankeyNode } from "@/components/ui/sankey-flow"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "Nodes are placed by a hand-written Sankey layout: columns come from each node's longest path from a source, one shared scale (`ky`) makes equal flows equally thick, and a few passes of relaxation pull every node toward the weighted centre of the nodes it connects to, resolving overlaps in order.",
  "Each ribbon is a filled path between two cubic Béziers that share horizontal control points, so the top and bottom edges ease between their two end positions. The same function draws the traced sub-ribbon by taking only the first `f` of the ribbon's thickness.",
  "Hover traces a flow end to end by assuming every node mixes what reaches it: a traced share of a node reaches each outgoing ribbon in proportion to its value, and the same maths runs backwards for upstream ribbons. The result drives a `pour` path per ribbon.",
  "Layout, traces and dimming are numbers that chase their targets with an exponential ease (`1 - exp(-dt / tau)`) inside one `requestAnimationFrame` loop, so a data switch or a hover reversing mid-motion stays smooth. DOM attributes are written directly; React never re-renders per frame.",
  "The drifting dots live on one `<canvas>`: each particle owns a position along a ribbon and a fixed lane in its thickness, moves at constant speed and is drawn from the animated geometry. The loop pauses when the chart is off screen (`IntersectionObserver`) or the tab is hidden.",
]

const NODES: SankeyNode[] = [
  { id: "chat", label: "Chat" },
  { id: "email", label: "Email" },
  { id: "api", label: "API" },
  { id: "auto", label: "Auto-resolved" },
  { id: "esc", label: "Escalated" },
  { id: "sent", label: "Sent as drafted" },
  { id: "edited", label: "Edited first" },
  { id: "human", label: "Human team" },
  { id: "closed", label: "Stayed closed" },
  { id: "reopen", label: "Reopened" },
]

/** [source, target, week 41, week 42] – each week conserves flow at every node (x100 tickets). */
const TABLE: [string, string, number, number][] = [
  ["chat", "auto", 31, 38],
  ["chat", "esc", 21, 17],
  ["email", "auto", 19, 22],
  ["email", "esc", 20, 18],
  ["api", "auto", 17, 21],
  ["api", "esc", 4, 4],
  ["auto", "sent", 46, 58],
  ["auto", "edited", 21, 23],
  ["esc", "edited", 9, 8],
  ["esc", "human", 36, 31],
  ["sent", "closed", 41, 53],
  ["sent", "reopen", 5, 5],
  ["edited", "closed", 26, 28],
  ["edited", "reopen", 4, 3],
  ["human", "closed", 28, 25],
  ["human", "reopen", 8, 6],
]

const links = (period: "w1" | "w2"): SankeyLink[] =>
  TABLE.map(([source, target, a, b]) => ({ source, target, value: (period === "w1" ? a : b) * 100 }))

export default function Demo() {
  const [period, setPeriod] = React.useState<"w1" | "w2">("w2")
  const data = React.useMemo(() => links(period), [period])
  return (
    <div className="w-full max-w-[720px]">
      <SankeyFlow
        nodes={NODES}
        links={data}
        label="Support ticket routing"
        title="Ticket routing"
        subtitle={period === "w1" ? "Week of Oct 5, 2026" : "Week of Oct 12, 2026"}
        columns={["Channel", "Agent verdict", "Review", "30 days"]}
        unit="tickets"
        totalLabel="tickets"
        actions={
          <SegmentedControl
            variant="tray"
            size="sm"
            aria-label="Week"
            value={period}
            onChange={(v) => setPeriod(v as "w1" | "w2")}
            options={[
              { value: "w1", label: "W41" },
              { value: "w2", label: "W42" },
            ]}
          />
        }
      />
    </div>
  )
}
