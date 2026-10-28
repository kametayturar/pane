import { GradientText } from "@/components/motion/gradient-text"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo({ accent, speed, paused }: StudioProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6 px-6 py-10 text-black/90 dark:text-white/90">
      <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight">
        Write the brief.
        <br />
        <GradientText accent={accent} speed={speed} paused={paused}>
          Let Nova do the rest.
        </GradientText>
      </h2>
      <p className="max-w-md text-[15px] leading-6 text-black/60 dark:text-white/62">
        Your research assistant reads <GradientText accent={accent} speed={speed} paused={paused} className="font-medium">forty sources</GradientText>{" "}
        overnight and hands you a cited summary by breakfast.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-2xl font-semibold tracking-tight">
        <GradientText colors={["#ff7a18", "#ff3d77", "#a855f7"]} speed={speed} paused={paused}>
          Sunset
        </GradientText>
        <GradientText colors={["#00c2a8", "#22d3ee", "#3b82f6"]} speed={speed} paused={paused}>
          Lagoon
        </GradientText>
        <GradientText colors={["#f5d90a", "#84cc16", "#10b981"]} speed={speed} paused={paused}>
          Meadow
        </GradientText>
      </div>
    </div>
  )
}

export const notes = [
  "The letters are not coloured; the element's background is a gradient and `background-clip: text` (with `-webkit-text-fill-color: transparent`) shows that background only where glyphs are.",
  "The gradient ends on its first colour, so it tiles seamlessly. The flow is `@keyframes` moving `background-position` by exactly one tile (`background-size: 200%` and a `0% → 200%` shift), which makes an endless loop with no jump.",
  "A second, softer white radial layer scrolls the opposite way at a different tile size; two layers moving at different rates read as a liquid surface rather than a conveyor belt.",
  "Colours derive from one `accent` using CSS relative colour syntax (`oklch(from var(--gt-accent) l c calc(h + 55))`) behind an `@supports` check, with `color-mix()` fallbacks; pass `colors` to override the stops.",
  "Accessibility: forced-colors mode drops the gradient for `CanvasText`, and `prefers-reduced-motion` freezes the flow on a still gradient.",
]
