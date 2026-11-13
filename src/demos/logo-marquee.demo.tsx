import { LogoMarquee } from "@/components/blocks/logo-marquee"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[900px] flex-col gap-6 py-6">
      <p className="text-center text-[13px] font-medium text-neutral-500">Trusted by teams at</p>
      <div className="flex flex-col gap-5">
        <LogoMarquee speed={40} />
        <LogoMarquee speed={28} direction="right" />
      </div>
      <p className="text-center text-[12px] text-neutral-400">Hover to ease it to a stop, drag to scrub and fling.</p>
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
