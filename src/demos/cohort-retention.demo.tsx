import { CohortRetention } from "@/components/blocks/cohort-retention"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[820px] flex-col gap-4 py-4">
      <CohortRetention />
      <p className="text-center text-[12px] text-neutral-400">
        Hover or arrow through the cells, flip to Curves to watch the triangle turn into lines, and switch the segment to rewash it.
      </p>
    </div>
  )
}

export const notes = [
  "The triangle is 78 SVG rects, one per measured cell (12 cohorts by up to 12 months, plus an average row). The colour is the ink colour at an alpha that follows the retention value, set with CSS color-mix, so light and dark themes need no second palette and the number inside flips between dark and light text at the midpoint.",
  "Heatmap to curves is one number, p, moved by a spring from 0 to 1. Each cell's own progress is p scaled and offset by its distance from the top left, so the cells peel off in a diagonal wave; its position slides from the grid slot to the point (month, retention) on its cohort's curve, its size shrinks from the full cell to a 7px dot, and its alpha slides between the heat value and the curve's. The lines fade in at the end of the same p.",
  "Switching segment rewashes every cell: the displayed values are interpolated from the old ones to the new ones with a per-cell delay of column * 22ms + row * 12ms and a cubic ease, so numbers roll and colours change in a ripple. Everything is written to the SVG from one requestAnimationFrame loop through refs, and the loop stops when the morph, the wash and the tooltip have all settled.",
  "The sample data comes from a seeded simulation: each cohort follows a decaying exponential from month 1 to month 12 with a floor, improving a little with every newer cohort. Rates, averages (weighted by cohort size, over the cohorts that already have that month), the headline figures and the 'latest 3 vs first 3 cohorts' deltas are all derived from just sizes and retained counts.",
  "The chart is one focusable role=group with a roving cursor: arrow keys move between measured cells, Home and End jump along a cohort, Escape clears it, and a polite live region reads the cohort, month and rate. The same cursor drives the hover tooltip, the ring in the heatmap and the guide line in the curves view; a visually hidden table carries every value.",
]
