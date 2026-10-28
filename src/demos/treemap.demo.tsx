import * as React from "react"

import { Treemap, type TreemapNode } from "@/components/ui/treemap"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "The layout is the squarified algorithm: children are sorted by value, then rows are filled along the shorter side of the free rectangle for as long as the worst aspect ratio in the row keeps improving. It runs once per focus, in pixels, so gaps and header heights never scale.",
  "Zooming is a tween between two layouts of the same ids. A tile that is not on screen in the target is tucked inside its on-screen ancestor (that is how children 'open inside' a tile) and tiles outside the focus are mapped through the affine transform that stretches the old tile to the stage (that is how siblings fly outward). Zooming out runs the same maps in reverse.",
  "Every frame the loop interpolates rects and writes `transform`, `width` and `height` straight to the tile elements, so React renders nothing during a zoom. Labels are never scaled: their opacity follows the tile's size, so text appears only where it fits.",
  "Colour is `oklch()` computed in CSS from two custom properties per tile: the hue of its top-level branch (`--h`) and the measure from 0 to 1 (`--m`), so lightness and chroma deepen with the measure and a `background-color` transition morphs every tile when the measure changes.",
  "Same ids across datasets is what makes the measure switch morph: the new layout is tweened from wherever each tile is right now, including in the middle of another zoom. Keyboard moves pick the nearest top-level tile in a direction by comparing centre offsets.",
]

type Row = { region: string; country: string; arr: number; seats: number; growth: number; retention: number }

const ROWS: Row[] = [
  { region: "Americas", country: "United States", arr: 11800, seats: 5400, growth: 24, retention: 96 },
  { region: "Americas", country: "Canada", arr: 2100, seats: 900, growth: 18, retention: 97 },
  { region: "Americas", country: "Brazil", arr: 1500, seats: 1300, growth: 49, retention: 91 },
  { region: "Americas", country: "Mexico", arr: 700, seats: 720, growth: 41, retention: 90 },
  { region: "Europe", country: "Germany", arr: 3900, seats: 2000, growth: 27, retention: 98 },
  { region: "Europe", country: "United Kingdom", arr: 3500, seats: 1700, growth: 15, retention: 95 },
  { region: "Europe", country: "France", arr: 2200, seats: 1100, growth: 22, retention: 96 },
  { region: "Europe", country: "Netherlands", arr: 1300, seats: 560, growth: 31, retention: 97 },
  { region: "Europe", country: "Spain", arr: 900, seats: 640, growth: 36, retention: 93 },
  { region: "Asia Pacific", country: "Japan", arr: 2700, seats: 1500, growth: 33, retention: 99 },
  { region: "Asia Pacific", country: "Australia", arr: 1700, seats: 700, growth: 21, retention: 96 },
  { region: "Asia Pacific", country: "India", arr: 1000, seats: 2300, growth: 58, retention: 88 },
  { region: "Asia Pacific", country: "Singapore", arr: 800, seats: 380, growth: 29, retention: 97 },
  { region: "Middle East & Africa", country: "UAE", arr: 600, seats: 300, growth: 52, retention: 92 },
  { region: "Middle East & Africa", country: "South Africa", arr: 450, seats: 380, growth: 38, retention: 91 },
  { region: "Middle East & Africa", country: "Kenya", arr: 220, seats: 260, growth: 61, retention: 87 },
]

const PLANS = [
  { id: "starter", label: "Starter", share: 0.2, dg: -4, dr: -3 },
  { id: "team", label: "Team", share: 0.38, dg: 1, dr: 0 },
  { id: "enterprise", label: "Enterprise", share: 0.42, dg: 5, dr: 2 },
]
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-")

type Size = "arr" | "seats"
type Shade = "growth" | "retention"

function build(size: Size, shade: Shade): TreemapNode {
  const regions = [...new Set(ROWS.map((r) => r.region))]
  return {
    id: "all",
    label: "All regions",
    children: regions.map((region) => ({
      id: slug(region),
      label: region,
      children: ROWS.filter((r) => r.region === region).map((r) => ({
        id: `${slug(region)}.${slug(r.country)}`,
        label: r.country,
        children: PLANS.map((p) => ({
          id: `${slug(region)}.${slug(r.country)}.${p.id}`,
          label: p.label,
          value: Math.round(r[size] * p.share),
          color: shade === "growth" ? r.growth + p.dg : Math.min(100, r.retention + p.dr),
        })),
      })),
    })),
  }
}

const money = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}M` : `$${Math.round(v)}K`)
const seats = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v)))

export default function Demo() {
  const [size, setSize] = React.useState<Size>("arr")
  const [shade, setShade] = React.useState<Shade>("growth")
  const data = React.useMemo(() => build(size, shade), [size, shade])
  return (
    <div className="w-full max-w-[720px]">
      <Treemap
        data={data}
        label="Revenue by region, country and plan"
        title="Book of business"
        subtitle="By region, country and plan"
        formatValue={size === "arr" ? money : seats}
        colorLabel={shade === "growth" ? "Growth" : "Retention"}
        formatColor={(v) => (shade === "growth" ? `+${Math.round(v)}%` : `${Math.round(v)}%`)}
        actions={
          <>
            <SegmentedControl
              variant="tray"
              size="sm"
              aria-label="Size by"
              value={size}
              onChange={(v) => setSize(v as Size)}
              options={[
                { value: "arr", label: "ARR" },
                { value: "seats", label: "Seats" },
              ]}
            />
            <SegmentedControl
              variant="tray"
              size="sm"
              aria-label="Shade by"
              value={shade}
              onChange={(v) => setShade(v as Shade)}
              options={[
                { value: "growth", label: "Growth" },
                { value: "retention", label: "Retention" },
              ]}
            />
          </>
        }
      />
    </div>
  )
}
