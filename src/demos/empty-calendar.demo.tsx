import type { StudioProps } from "@/components/motion/backdrop"
import { EmptyCalendar } from "@/components/illustrations/empty-calendar"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[460px]">
      <EmptyCalendar {...props} />
    </div>
  )
}

export const notes = [
  "The whole scene is one inline <svg> with a viewBox, so it scales to any width without a resize observer – the browser maps the 320 × 240 drawing units to the container.",
  "The fan-out is plain CSS transitions on the SVG <g> groups (translate + rotate). `transform-box: fill-box` makes `transform-origin: center` mean each card's own centre instead of the whole canvas.",
  "A tiny React hook flips one boolean on a setTimeout loop while nobody hovers; hover forces the same boolean on. CSS only ever reads `data-fan`, so the idle loop and the hover share one code path.",
  "The soft glow is a blurred <ellipse> (feGaussianBlur) filled with a gradient built from `color-mix()` on the accent colour; the grey placeholder bars pulse with a keyframe on `fill`.",
  "Speed is a CSS variable used inside `calc(2.4s / var(--ec-speed))`; pausing sets `animation-play-state: paused` on every descendant, and prefers-reduced-motion switches all animation and transition off.",
]
