import * as React from "react"

import { Ridgeline, type RidgelineSeries } from "@/components/ui/ridgeline"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "Each ridge is a kernel density estimate of the raw observations: a Gaussian bump at every value, summed, with Silverman's rule choosing the smoothing (0.9 x min(sd, IQR/1.34) x n^-1/5) unless you pass a bandwidth. Every ridge is evaluated on the same 96-point grid and divided by the tallest density, so heights are comparable across rows.",
  "Because every curve sits on one normalised grid, any dataset can morph into any other: one requestAnimationFrame loop eases each of the 96 values toward its target with `1 - exp(-dt / tau)` and writes the path `d` strings directly. React renders only when the lifted ridge or the reading changes.",
  "Rows are painted top to bottom with opaque fills (a `color-mix()` of the accent into the surface), so lower ridges really cover the ones behind. Median tint comes from one custom property, `--m`, quantised into five steps that the legend below the axis repeats.",
  "The lifted ridge is a copy drawn last. It rises 6px with a CSS spring (`cubic-bezier(.34, 1.56, .64, 1)` overshoots once), the middle half is a polygon under the curve between the quartiles, and the other ridges drop to 32% opacity with a transition.",
  "Pointer hit-testing picks the front-most ridge whose filled area contains the cursor, reading the live curve heights, and the tooltip's 'at or below' figure is the empirical CDF of the raw values at the cursor's x.",
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
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())

const REGIONS = { eu: { name: "Frankfurt", k: 1, seed: 11 }, us: { name: "Virginia", k: 0.82, seed: 29 }, ap: { name: "Singapore", k: 1.3, seed: 43 } } as const
type Region = keyof typeof REGIONS

/**
 * Response times in the ten weeks after a cache launch: every request is either a fast cache hit or a slow miss,
 * and the share of hits grows week by week, so one hump slides into another through a two-humped middle.
 */
function build(region: Region): RidgelineSeries[] {
  const { k, seed } = REGIONS[region]
  return Array.from({ length: 10 }, (_, w) => {
    const r = rng(seed * 100 + w)
    const hits = Math.min(0.94, Math.max(0.02, (w - 1.2) / 7.5))
    const values = Array.from({ length: 120 }, () => {
      const hit = r() < hits
      const v = hit ? 125 + normal(r) * 20 : 320 + normal(r) * 52
      return Math.min(590, Math.max(20, v * k))
    })
    return { id: `w${w + 1}`, label: `Week ${w + 1}`, values }
  })
}

export default function Demo() {
  const [region, setRegion] = React.useState<Region>("eu")
  const series = React.useMemo(() => build(region), [region])
  return (
    <div className="w-full max-w-[640px]">
      <Ridgeline
        series={series}
        label={`Response time by week after the cache launch, ${REGIONS[region].name}`}
        title="Response time"
        subtitle={`After the cache launch, ${REGIONS[region].name}`}
        unit=" ms"
        domain={[0, 600]}
        actions={
          <SegmentedControl
            variant="tray"
            size="sm"
            aria-label="Region"
            value={region}
            onChange={(v) => setRegion(v as Region)}
            options={[
              { value: "eu", label: "Frankfurt" },
              { value: "us", label: "Virginia" },
              { value: "ap", label: "Singapore" },
            ]}
          />
        }
      />
    </div>
  )
}
