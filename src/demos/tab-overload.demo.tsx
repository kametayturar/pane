import type { StudioProps } from "@/components/motion/backdrop"
import { TabOverload } from "@/components/illustrations/tab-overload"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[460px]">
      <TabOverload {...props} />
    </div>
  )
}

export const notes = [
  "Each browser window is a <g> in one SVG; the later ones are drawn on top of the earlier ones (painter's order), which is what makes them overlap – z-index is not needed.",
  "Which window is highlighted is a single number in React state: the hovered window, or the idle counter that a setTimeout advances every ~1.8 s. CSS then only fades `opacity` on elements flagged `data-on`.",
  "Hit-testing is done by the SVG itself: `pointerover` on a window's group only fires where that window is actually visible, so the covered part of a window never steals the hover.",
  "The right and bottom edges fade out with two `mask-image` gradients combined using `mask-composite: intersect`, so the windows seem to run off the card.",
  "The coloured glow is a blurred ellipse (feGaussianBlur) and the outline is a stroked <path> using a gradient `stroke`; both take their tint from the accent via `color-mix()` / a CSS variable.",
]
