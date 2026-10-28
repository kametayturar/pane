import * as React from "react"

import { DataGrid, type DataGridColumn, type DataGridRow } from "@/components/ui/data-grid"

export const notes: string[] = [
  "Rows are virtualised: the body is one element as tall as all rows (`n x rowHeight`), the scroll position decides which index range is rendered (plus six rows of overscan), and every row is placed with `transform: translateY`. React state holds only the first visible index, so scrolling re-renders ~30 rows however many exist.",
  "Columns are one CSS grid. Every row uses `grid-template-columns: var(--gtc)`, and a resize drag writes that single custom property on the scroller (no React render per pointer move), then commits the final widths on release. Pinned columns and the gutter are `position: sticky`, with opaque backgrounds taken from a per-row `--cell-bg` variable so hover and selection tint them too.",
  "Sorting is a stable multi-key comparator over an index array, never the rows themselves. When the order changes, the rows on screen are animated with the Web Animations API using FLIP: remember each row's old `top`, then animate the independent `translate` property from the difference back to 0, so it composes with the row's own transform.",
  "Sparkline cells are an SVG with `preserveAspectRatio='none'` and `vector-effect: non-scaling-stroke`, so the line stretches with the column without re-rendering and keeps a 1.5px stroke. The draw-in uses `pathLength=1` with a `stroke-dashoffset` animation and runs only during the first second, so cells that mount while scrolling do not replay it.",
  "The grid has a single tab stop and uses `aria-activedescendant` to point at the active cell, which keeps working when that cell is virtualised away. Selection is an anchor plus an active cell (range = their bounding box), dragged with pointer capture and extended with Shift + arrows; the status bar sums the numeric cells in the range.",
]

// Small seeded generator so the demo data is the same on every load.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const A = ["Aurora", "Basalt", "Cinder", "Delta", "Ember", "Fjord", "Garnet", "Harbor", "Indigo", "Juniper", "Kestrel", "Lumen", "Marlow", "Nimbus", "Onyx", "Pillar", "Quill", "Ripple", "Sable", "Tidal", "Umber", "Vesper", "Willow", "Xenon", "Yarrow", "Zephyr", "Alder", "Birch", "Cobalt", "Dune", "Ember", "Flint", "Gale", "Heron", "Iris", "Jasper", "Koi", "Lark", "Mica", "Nova"]
const B = ["Bay", "Ridge", "Peak", "Grove", "Field", "Crest", "Gate", "Point", "Shore", "Vale", "Lane", "Works", "Mill", "Forge", "Park", "Hill", "Reach", "Cross", "Run", "Row", "Rock", "Wood", "Falls", "Glen", "Yard"]
const C = ["Labs", "Systems", "Health", "Logistics", "Studio", "Cloud", "Analytics", "Energy", "Retail", "Robotics", "Foods", "Media"]
const OWNERS = ["Priya Raman", "Owen Park", "Marcus Johnson", "Emma Collins", "Noah Bennett", "Hannah Walsh", "Daniel Kim", "Sofia Ortega", "Liam Foster", "Aiko Tanaka"]
const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]
const STAGES = ["Discovery", "Proposal", "Negotiation", "Committed", "Closed won"]

function makeRows(count: number): DataGridRow[] {
  const r = rng(2026)
  const total = A.length * B.length * C.length
  return Array.from({ length: count }, (_, i) => {
    const k = (i * 7919) % total
    const seats = Math.max(3, Math.round(Math.exp(r() * 5.4) * 5))
    const health = Math.round(35 + r() * 62)
    const drift = (health - 62) / 400
    let v = 40 + r() * 40
    const usage = Array.from({ length: 12 }, () => {
      v = Math.max(5, v * (1 + drift + (r() - 0.5) * 0.28))
      return Math.round(v)
    })
    const day = new Date(Date.UTC(2026, 8, 1) + Math.floor(r() * 420) * 86400000)
    return {
      id: `acct-${i + 1}`,
      account: `${A[k % A.length]} ${B[Math.floor(k / A.length) % B.length]} ${C[Math.floor(k / (A.length * B.length)) % C.length]}`,
      owner: OWNERS[Math.floor(r() * OWNERS.length)]!,
      region: REGIONS[Math.floor(r() * REGIONS.length)]!,
      stage: STAGES[Math.floor(r() * STAGES.length)]!,
      seats,
      arr: seats * (r() < 0.5 ? 360 : r() < 0.7 ? 420 : 300),
      health,
      usage,
      renews: day.toISOString().slice(0, 10),
    }
  })
}

const COLUMNS: DataGridColumn[] = [
  { key: "account", label: "Account", width: 190, pinned: true },
  { key: "region", label: "Region", width: 124 },
  { key: "stage", label: "Stage", type: "select", width: 128 },
  { key: "seats", label: "Seats", type: "number", width: 80 },
  { key: "arr", label: "ARR", type: "currency", width: 104 },
  { key: "health", label: "Health", type: "percent", bar: true, width: 118 },
  { key: "usage", label: "Usage, 12 wk", type: "sparkline", width: 140 },
  { key: "renews", label: "Renews", type: "date", width: 120 },
]

export default function Demo() {
  const rows = React.useMemo(() => makeRows(10000), [])
  return (
    <div className="w-full max-w-[1040px]">
      <DataGrid columns={COLUMNS} rows={rows} label="Renewals" title="Renewals" subtitle="10,000 accounts, virtualised" maxHeight={440} defaultSort={[{ key: "arr", dir: "desc" }]} />
    </div>
  )
}
