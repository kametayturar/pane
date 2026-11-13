import { GradientText } from "@/components/motion/gradient-text"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo({ speed, paused }: StudioProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6 px-6 py-12 text-black/90 dark:text-white/90">
      <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight">
        Write the brief.
        <br />
        <GradientText speed={speed} paused={paused}>
          Let Nova do the rest.
        </GradientText>
      </h2>
      <p className="max-w-md text-[15px] leading-6 text-black/60 dark:text-white/62">
        Your research assistant reads forty sources overnight and hands you a cited summary by breakfast.
      </p>
    </div>
  )
}

export const notes = [
  "The letters are not coloured; the element's background is a gradient and `background-clip: text` (with `-webkit-text-fill-color: transparent`) shows that background only where glyphs are.",
  "The ink ramp ends on its first value, so it tiles seamlessly. The flow is `@keyframes` moving `background-position` by exactly one tile (`background-size: 200%` and a `0% → 200%` shift), which makes an endless loop with no jump.",
  "The ramp is one neutral ink at four opacities, so the sweep reads as light passing over type, not as colour.",
  "The ink follows the theme (black in light, white in dark). Pass `accent` to tint it or `colors` to override the stops; use it on one phrase only.",
  "Accessibility: forced-colors mode drops the gradient for `CanvasText`, and `prefers-reduced-motion` freezes the flow on a still gradient.",
]
