import { GradientFloor } from "@/components/motion/gradient-floor"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo({ speed, paused, accent }: StudioProps) {
  return (
    <GradientFloor
      speed={speed}
      paused={paused}
      accent={accent}
      className="h-[380px] w-full max-w-[760px] rounded-[20px] [--gfl-bg:#fafafa] dark:[--gfl-bg:#111113] shadow-[inset_0_0_0_1px_rgb(0_0_0/.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/.1)]"
    >
      <section className="mx-auto flex max-w-[420px] flex-col items-center gap-3 px-6 pt-14 text-center">
        <h3 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-900 dark:text-white">
          Start with a question
        </h3>
        <p className="text-[15px] leading-[22px] text-neutral-500 dark:text-neutral-400">
          Ask anything about your data and get an answer with sources in seconds.
        </p>
      </section>
    </GradientFloor>
  )
}

export const notes = [
  "The glow is two SVG paths with `preserveAspectRatio=\"none\"`: a closed shape under a smooth curve, filled with a vertical `linearGradient` (crest colour at the top, other colours below).",
  "The shape morphs because one `requestAnimationFrame` loop recomputes the path's `d` attribute every frame from a few control points that each follow a sum of sines at slightly different periods, so it never visibly repeats.",
  "`filter: blur()` turns the hard edge into a glow; the second, white layer uses `mix-blend-mode: plus-lighter` so it adds light on top of the colour instead of covering it.",
  "An `IntersectionObserver` stops the loop when the floor leaves the screen, and pause/resume keeps the animation clock in a ref so the shape continues where it stopped.",
  "`prefers-reduced-motion` skips the loop entirely; the first frame is drawn by React from the same function, so there is still a finished picture.",
]
