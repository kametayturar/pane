import { InstrumentPricing } from "@/components/blocks/instrument-pricing"

export const notes = [
  "The usage ruler is a `role=\"slider\"` div, not an input: stops are an array of run counts, the slider value is the index, and `aria-valuetext` reads the real number. Pointer Events with `setPointerCapture` let a drag keep tracking outside the element, `touch-action: pan-y` leaves vertical scrolling to the page, and arrows, Home, End and PageUp/PageDown move between stops.",
  "Ticks are plain absolutely positioned elements at `k / count * 100%`. Ticks at or below the thumb get a `data-on` attribute that darkens them, so the ruler shows what has been measured so far. The thumb only changes `left`, which a CSS transition eases, so it slides between stops instead of jumping.",
  "Every price comes from one pure function, `quotePlan(plan, runs, billing, discount)`: base fee (minus the yearly discount) plus overage per 1,000 runs beyond the included amount, with a hard cap for plans that have no overage. The cheapest available plan gets the LOWEST COST chip, so the answer changes as you drag past roughly 120k runs.",
  "Numbers settle with a small hook: it tweens from the value currently shown to the new target in `requestAnimationFrame` using `1 - (1-t)^3 + 0.045 sin(pi t) t` (about 1% overshoot, then back), and always restarts from what is on screen, so quick drags never jump. A timeout lands the real value if frames are throttled.",
  "The billing switch has no measuring: the indicator is one element sized `calc(100% / n)` and moved with `translateX(calc(var(--i) * 100%))`, and the same component picks the plan on mobile. The comparison renders twice (a real `<table>` and a per-plan list); a container query on the section picks one with `display: none`, so it follows the section width, not the viewport.",
]

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
      <InstrumentPricing />
    </div>
  )
}
