import type { StudioProps } from "@/components/motion/backdrop"
import { HatchedSkies } from "@/components/illustrations/hatched-skies"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1000px] px-1 py-4">
      <HatchedSkies {...props} />
    </div>
  )
}

export const notes = [
  "Each cloud is a row of overlapping circles whose lower halves are cut by a flat base. The top edge is the lowest point of any circle at that x, so the silhouette is a union of arcs without any path boolean maths.",
  "The fill is only ticks: one slightly bowed stroke per column, hanging from the top edge down to the base. Column positions live in the cloud's own space and every length comes from an integer hash, so the ticks travel with the cloud and never reshuffle between frames.",
  "Where a cloud lies behind a nearer one, each tick samples three points to see how much of it is covered. Covered ticks fade and every second one drops out, while the nearer cloud adds half-step ticks inside the overlap. That is the density swap.",
  "Everything is one pure function, draw(ctx, w, h, t, values). The slide is two eased windows inside a 24 second loop and the sway is a sine of the loop phase, so the loop is seamless and any frame can be exported.",
  "The demo plays on its own and stops for good on the first pointer, key or button press. After that the single button slides the back cloud under once and back on the next press. Loops stop off screen and in hidden tabs, and reduced motion shows the frame where the clouds overlap.",
]
