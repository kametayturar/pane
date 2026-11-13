import type { StudioProps } from "@/components/motion/backdrop"
import { DashBurst } from "@/components/illustrations/dash-burst"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[520px] px-1 py-4">
      <DashBurst {...props} />
    </div>
  )
}

export const notes = [
  "Every dash is a short line in a rotated group: the group's rotation is fixed, so each frame only writes two x coordinates and an opacity per dash. A frame is one pure function of time, so the same code draws the live piece, a paused still and an exported SVG.",
  "The decisive moment is a damped spring (exp(-2t)·sin(5t)) sent through a Gaussian window of neighbouring dashes, delayed a little more for each dash away from the origin. The dashes in that sector push out, overshoot, dip back and settle, and a dotted echo (stroke-dasharray with round caps) trails past the tip while the push is strong.",
  "Length is the data: pass `data` and each dash is one value, resampled to `count` around the ring. The big number is the live average of the dash lengths, so it climbs with the burst and settles back, and pointing at a dash reads that dash's own value.",
  "With no props the ring bursts from its largest value every six seconds and stops for good at the first tap, key press or focus. A tap or Enter sends a burst from the dash under the pointer or the active dash (arrow keys move). The loop also pauses off screen and in hidden tabs; reduced motion shows the peak of one burst as a still.",
]
