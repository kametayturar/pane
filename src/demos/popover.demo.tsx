import { Popover } from "@/components/ui/popover"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <Popover />
    </div>
  )
}

export const notes = [
  "One panel serves the whole row of triggers. Its x, y, width and height are four springs (stiffness 320, damping ratio 0.84) integrated in a single `requestAnimationFrame` loop that reads the active trigger's rect every frame, so a scroll, a resize or a content change just moves the target and the panel keeps its velocity. It is written straight to `transform`, `width` and `height`, with no React render per frame.",
  "Placement is about thirty lines: prefer the chosen side, flip when the other side has more room and the panel does not fit, then shift along the axis to stay inside the collision padding. The arrow is positioned from the trigger's centre minus the panel's current x, so it stays under the trigger while the panel is still catching up. The open and close scale grows out of the arrow tip (`transform-origin` follows it).",
  "The decisive moment is switching triggers: instead of closing and reopening, the target changes. The surface glides to the new anchor and resizes to the new content's measured size (a ResizeObserver reads the visible layer), while the old content leaves and the new one arrives through a 5px blur, sliding in the direction of travel. Closing is quicker than opening (120ms against 340ms) and can be interrupted by reopening mid-exit.",
  "Light dismiss, Escape (focus returns to the trigger), arrow keys move along the triggers and glide an open panel with them, and the trigger row is one tab stop (roving `tabIndex`). Down opens and moves focus into the panel, Tab from an open trigger enters the portalled panel, and Tab out of either end closes it: backwards to the trigger, forwards to whatever follows the row. A closing panel is `inert` while it animates out. `trigger=\"hover\"` adds an open delay that is skipped once a panel is already open.",
  "With no props the card plays its own loop (open Status, glide to Sort, glide to Share, close) and stops for good at the first touch, key press or focus; it also pauses off screen and in hidden tabs. Pass `items`, `value` and `onValueChange` to drive it. Reduced motion shows Sort already open, anchored, and every switch is a straight jump.",
]
