import * as React from "react"

import { LogoMarquee } from "@/components/blocks/logo-marquee"

export default function Demo() {
  const [speed, setSpeed] = React.useState(40)
  const [direction, setDirection] = React.useState<"left" | "right">("left")
  const [paused, setPaused] = React.useState(false)

  return (
    <div className="flex w-full max-w-[900px] flex-col gap-8 py-6">
      <div className="flex flex-col gap-5">
        <p className="text-center text-[13px] font-medium text-neutral-500">Trusted by teams at</p>
        <LogoMarquee speed={speed} direction={direction} paused={paused} />
        <LogoMarquee speed={speed * 0.7} direction={direction === "left" ? "right" : "left"} paused={paused} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-neutral-600 dark:text-neutral-300">
        <label className="flex items-center gap-2">
          Speed
          <input
            type="range"
            min={0}
            max={140}
            step={5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-32"
            aria-label="Speed in pixels per second"
          />
          <span className="w-14 tabular-nums">{speed} px/s</span>
        </label>
        <button
          type="button"
          onClick={() => setDirection((d) => (d === "left" ? "right" : "left"))}
          className="rounded-lg px-3 py-1.5 shadow-[0_0_0_1px_rgb(0_0_0/.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)]"
        >
          Direction: {direction}
        </button>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="rounded-lg px-3 py-1.5 shadow-[0_0_0_1px_rgb(0_0_0/.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)]"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <p className="text-center text-[12px] text-neutral-400">
        Hover to ease it to a stop, drag to scrub and fling.
      </p>
    </div>
  )
}

export const notes = [
  "The loop is seamless because the track holds the same set of logos several times and its `translateX` is wrapped with a modulo by exactly one set's measured width (`getBoundingClientRect` + a `ResizeObserver`). Each item has its gap as a trailing `margin-right`, so the set width includes it and nothing jumps at the seam.",
  "Nothing is animated with CSS keyframes. One `requestAnimationFrame` loop eases a velocity toward a target: `vel += (target - vel) * (1 - exp(-dt / tau))`. Hover just changes the target to 0, which is why it glides to a stop and winds back up instead of cutting out.",
  "Dragging uses Pointer Events with `setPointerCapture`. The drag speed is a smoothed estimate of dx/dt; on release it becomes the starting velocity, and the same easing pulls it back to cruising speed, which reads as inertia.",
  "The edges fade with a horizontal `mask-image: linear-gradient(...)`, and `touch-action: pan-y` lets the page still scroll vertically on touch.",
  "The loop stops when the strip is off screen (`IntersectionObserver`), writes only `transform` (no React re-renders per frame), and `useSyncExternalStore` on `prefers-reduced-motion` swaps it for a static, wrapping row.",
]
