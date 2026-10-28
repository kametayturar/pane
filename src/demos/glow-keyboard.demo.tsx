import { GlowKeyboard } from "@/components/illustrations/glow-keyboard"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[680px]">
      <GlowKeyboard {...props} />
    </div>
  )
}

export const notes = [
  "The typing is a small state machine (type → hold → send → gap) driven by one `setTimeout` at a time with a slightly random delay per character; pausing clears the timer and resuming continues from the same character because the position lives in a ref.",
  "Each key press adds a short-lived overlay to the key with a fresh React `key`. A new key remounts the element, which restarts its CSS animation, so the same letter can flash twice in a row.",
  "The floor is a gradient plane tilted with `perspective` + `rotateX(62deg)`. A wave is just a blurred ellipse that translates up the plane and fades – perspective makes it shrink into the distance for free.",
  "A wave starts under the key that was pressed: the key's `offsetLeft` (layout position, unaffected by the keyboard's own tilt) is read when the key is hit and used as the wave's `left`.",
  "The 'glass' is `backdrop-filter: blur() saturate()` over a translucent surface colour, plus an inset 1px highlight on top and soft outer shadows for thickness.",
]
