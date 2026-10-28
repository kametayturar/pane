import { MixtureOfExperts } from "@/components/illustrations/mixture-of-experts"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <MixtureOfExperts {...props} />
    </div>
  )
}

export const notes = [
  "Routing is real, just tiny: every token has gate weights, the top-k are picked, and an expert that is already at capacity skips the token (the 'full' row with the dashed border). The output weights are the chosen gate weights renormalised to sum to 1.",
  "One requestAnimationFrame clock drives the sequence in virtual milliseconds, so speed, pause and scrolling offscreen just change how fast it advances. Click a token to pin it: the clock holds on that token's finished route until you click again.",
  "React only re-renders when the token or the phase changes (score, pick, travel, work, merge). The moving packets and the growing score bars are written straight to the DOM each frame with transform: translate3d() and scaleX(), so 60fps never touches the React tree.",
  "Packets follow cubic Bézier curves evaluated in JS (a point at progress u), with the same easing everywhere; the dissolving packet that is turned away by a full expert shares the curve but stops at 80% of the way.",
  "The fixed 640 × 420 stage is scaled with transform: scale() from a ResizeObserver, and reduced motion renders the finished route as a still.",
]
