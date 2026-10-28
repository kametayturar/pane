import type { StudioProps } from "@/components/motion/backdrop"
import { GhostedChat } from "@/components/illustrations/ghosted-chat"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[460px]">
      <GhostedChat {...props} />
    </div>
  )
}

export const notes = [
  "The scene is designed on a fixed 360 × 240 stage and scaled with `transform: scale(var(--gh-scale))`; a ResizeObserver writes the scale straight onto the element as a CSS variable, so resizing never re-renders React.",
  "The intro is a staggered CSS animation: every bubble gets its own `--gh-delay` custom property, and `animation-fill-mode: backwards` keeps it invisible during the delay without leaving a finished animation holding the element.",
  "The last message uses `background-clip: text` over a 300%-wide gradient; animating `background-position` slides a red highlight through the letters.",
  "The glow under that bubble is a ::after pseudo-element with `filter: blur(12px)`, placed behind the bubble with `isolation: isolate` and negative z-indexes.",
  "Hover and the idle loop both set one `data-hot` attribute; a timer in a small hook toggles it, and CSS transitions (with a springy cubic-bezier overshoot) do the lifting and pop-in.",
]
