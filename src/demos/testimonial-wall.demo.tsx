import * as React from "react"

import { TestimonialWall } from "@/components/blocks/testimonial-wall"

const btn =
  "rounded-lg px-3 py-1.5 shadow-[0_0_0_1px_rgb(0_0_0/.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)]"

export default function Demo() {
  const [columns, setColumns] = React.useState<1 | 2 | 3>(3)
  const [paused, setPaused] = React.useState(false)
  const [speed, setSpeed] = React.useState(28)

  return (
    <div className="flex w-full max-w-[900px] flex-col gap-6 py-4">
      <div className="text-center">
        <p className="text-[13px] text-neutral-500">Testimonials</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Teams that ship agents
        </h2>
      </div>

      <TestimonialWall columns={columns} speed={speed} paused={paused} height={560} />

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[13px] text-neutral-600 dark:text-neutral-300">
        <span className="flex items-center gap-1.5">
          Columns
          {([1, 2, 3] as const).map((c) => (
            <button key={c} type="button" aria-pressed={columns === c} onClick={() => setColumns(c)} className={`${btn} ${columns === c ? "font-medium text-neutral-900 dark:text-white" : ""}`}>
              {c}
            </button>
          ))}
        </span>
        <label className="flex items-center gap-2">
          Speed
          <input type="range" min={0} max={90} step={2} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-28" aria-label="Speed in pixels per second" />
          <span className="w-14 tabular-nums">{speed} px/s</span>
        </label>
        <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className={btn}>
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  )
}

export const notes = [
  "Each column is a flat track holding the same list of cards two or more times; its `translateY` is wrapped with a modulo by exactly one list's measured height (cards carry a trailing `margin-bottom`, so the gap is inside the measurement). That is what makes the loop seamless.",
  "A single `requestAnimationFrame` loop drives every column with its own velocity: each is eased toward a target of `direction × speed × multiplier` (columns alternate up/down and run about 15% slower or faster) using `vel += (target - vel) * (1 - exp(-dt / tau))`. Hover sets the target to 0, so it glides to a stop.",
  "The 'rest of the wall dims while one card lifts' effect is pure CSS: `.tm:has(.tm__card:hover) .tm__card:not(:hover) { opacity: .5 }`. The `:has()` selector lets a parent react to a child's hover state.",
  "The column count follows the wall's own width, not the viewport: a `ResizeObserver` on the wall picks 3, 2 or 1, so it also works in a narrow sidebar. Copies of the list are added until they cover the wall's height.",
  "Edges fade with a vertical `mask-image: linear-gradient(...)`. Touch uses `touch-action: pan-y` (the page still scrolls) and press-and-hold pauses a column; `prefers-reduced-motion` swaps the loop for a static CSS `columns` masonry.",
]
