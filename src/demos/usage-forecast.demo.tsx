import { UsageForecast } from "@/components/blocks/usage-forecast"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[720px] flex-col gap-4 py-4">
      <UsageForecast />
      <p className="text-center text-[12px] text-neutral-400">
        Drag the budget line (or focus it and use the arrow keys), hover the plot to inspect a day, switch the metric above.
      </p>
    </div>
  )
}

export const notes = [
  "The forecast is plain arithmetic, not a model: the last three weeks of daily increments are split into weekday and weekend averages, and each future day adds the average for its kind. The likely range is a band whose half width is `1.28 * sqrt(summed variance) + days_ahead * a small rate spread`, so the cone fans out the further it looks.",
  "The budget crossing is found by walking the forecast array to the first value at or above the budget and linearly interpolating between the two days. Because it re-runs on every frame of the budget's animation, the marker, the date pill and the alert ticks slide along the curve together.",
  "Everything above the budget turns red with two copies of each path clipped by `<clipPath>` rectangles, one above and one below the budget line's y. Moving the line only moves two rectangles; the paths themselves are never rebuilt.",
  "The line follows the pointer while dragging (Pointer Events with `setPointerCapture`, `touch-action: none`), then settles on a critically damped spring stepped in `requestAnimationFrame` (`a = -2wv - w²x`). The loop stops itself when the distance and velocity fall below a threshold, so nothing runs at rest.",
  "Width comes from a `ResizeObserver` on the chart box and every x position is derived from it, so the SVG is drawn in real pixels (crisp 1px lines and text) instead of being stretched. The plot and the budget handle are `role=\"slider\"` elements, and a visually hidden `<table>` carries the same readings for screen readers.",
]
