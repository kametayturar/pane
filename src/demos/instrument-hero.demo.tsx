import { InstrumentHero } from "@/components/blocks/instrument-hero"

export const notes = [
  "The headline scans in line by line: each line is a block with `clip-path: inset(... 100% ...)` animating to fully open, and a 1px signal `::after` travels the same distance with the same easing, so it always sits on the edge of the revealed text. `width: fit-content` keeps the line as wide as its words. Delay is `calc(var(--i) * 380ms)`.",
  "The specimen trace is a scope sweep. Two deterministic arrays (activity and confidence, 240 samples each) are generated per sweep from a hashed sine; every frame only `setAttribute('d', ...)` on two paths, so React never re-renders while it draws. The previous sweep stays behind as a 22% ghost and a small gap runs ahead of the write head.",
  "The trace-in is pure CSS (a `clip-path` reveal and the now tick move together with one easing), and requestAnimationFrame only takes over after 1.1s, continuing from where the CSS left off. If frames never arrive, the settled figure is already on screen. An IntersectionObserver stops the loop offscreen, and reduced motion keeps the static frame.",
  "The confidence band is a small canvas with ordered (Bayer 4x4) dithering: a dot is drawn when the column's confidence exceeds that cell's threshold, so density encodes the value. Colours are read from the CSS custom properties, and a MutationObserver repaints when the theme class flips.",
  "The plot SVG uses `preserveAspectRatio='none'` with `vector-effect: non-scaling-stroke`, so one viewBox stretches to any width while every line stays exactly 1px. Layout switches with a container query on the section, so it responds to its own width rather than the viewport.",
  "The readout numbers count up when the row scrolls into view (IntersectionObserver) along `1 - (1-t)^3 + 0.045 * sin(pi t) * t`, which overshoots by about 1% and returns. A timeout lands the real value even if animation frames are throttled.",
]

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
      <InstrumentHero />
    </div>
  )
}
