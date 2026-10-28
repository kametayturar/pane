import { PromptCache } from "@/components/illustrations/prompt-cache"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <PromptCache {...props} />
    </div>
  )
}

export const notes = [
  "The prices are real arithmetic, not typed-in numbers: a request costs cached × read price + written × write price + new message × input price (per million tokens), and the first-token time is 0.42 s + processed ÷ 40,000 + cached ÷ 500,000. The summary compares that with the same prompt uncached, so the first request honestly shows a higher cost because of the cache write.",
  "Prefix matching is a loop over segment versions: the cache stores the version of each segment it holds, a request is compared left to right, and the first segment that differs ends the match. The 'Change the system prompt' toggle simply bumps one segment's version for the next request, which gives a partial hit with a break marker where matching stopped.",
  "Bar widths use a square-root scale (width ∝ √tokens) so a 150-token message stays visible beside a 36K-token document. Each segment is a flex item with flex: <width> 0 0, and the sweep is a clip-path: inset(0 100% 0 0) → inset(0) animation whose animation-delay and duration are computed from the segment's offset and width, so one steady linear pass crosses all the segments.",
  "A write 'flies' from the row into the cache panel with one absolutely positioned element animating transform and width between two measured rectangles (CSS custom properties --fx, --fy, --tx, --ty, --fw, --tw feed the keyframes). A story clock in a requestAnimationFrame loop decides when the next request is sent; React re-renders only on those events, while the ring, the countdown and the rolling numbers are written straight to the DOM.",
  "Time is simulated: each request has a gap in seconds, and when requests stop the clock runs about 55× faster until the time-to-live ring drains and the cache expires. Pausing sets animation-play-state: paused on every descendant and stops the clock together, so animations and numbers never drift apart.",
]
