import { GridBackground } from "@/components/motion/grid-background"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo({ speed, paused, accent }: StudioProps) {
  return (
    <GridBackground size={48} direction="diagonal" speed={speed} paused={paused} accent={accent} className="min-h-[360px] w-full">
      <section className="mx-auto flex min-h-[360px] max-w-[460px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="inline-flex h-6 items-center rounded-full bg-white px-[11px] text-xs font-medium text-neutral-900 shadow-[inset_0_0_0_1px_rgb(229_229_229),0_1px_2px_rgb(0_0_0/.04)] dark:bg-[#1c1c1e] dark:text-white dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/.12)]">
          New
        </span>
        <h3 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-900 dark:text-white">
          Ship answers your team can trust
        </h3>
        <p className="max-w-[340px] text-[15px] leading-[22px] text-neutral-500 dark:text-neutral-400">
          Every reply is grounded in your docs, so support stays fast and accurate as you grow.
        </p>
      </section>
    </GridBackground>
  )
}

export const notes = [
  "The grid is not an image: two `linear-gradient`s (one per axis) with `background-size` equal to the cell size draw 1px lines that tile forever.",
  "The drift animates only `transform`. The line layer is one cell larger on every side and moves by exactly one cell per loop, so the end frame looks identical to the start and the loop is seamless.",
  "The edge fade is a `mask-image: radial-gradient(...)` on a wrapper; a second mask on an inner wrapper grows a circle from the centre once, driven by an animated `@property` custom property (`--gb-r`).",
  "Lit cells are separate squares that ride the grid: each gets a negative `animation-delay` equal to the lines' current phase (read from `getAnimations()`), so it stays glued to its square.",
  "An `IntersectionObserver` starts the reveal only when 20% of the section is visible; `prefers-reduced-motion` removes the drift, the cells and the reveal.",
]
