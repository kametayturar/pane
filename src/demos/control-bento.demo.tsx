import { ControlBento } from "@/components/blocks/control-bento"

export default function Demo() {
  return (
    <div className="w-full py-6">
      <ControlBento />
    </div>
  )
}

export const notes = [
  "Six tiles share one CSS grid with fixed row height (`grid-auto-rows`), four columns wide and two when the container is under 720px, switched by a container query so it follows the space it is given, not the viewport. Every tile is a real control: a radio group that slides its thumb with one `--i` variable, a switch, a stepper whose number rolls with a keyed element, a search that filters as you type, checkboxes whose tick draws with `stroke-dashoffset`, and a player with a native range input.",
  "The decisive moment is focus. A cursor visits one tile at a time and that tile pulls forward with a small lift and a deeper shadow (no colour change) while the rest sit still. The cursor is a positioned element moved with `translate` to each target's measured rectangle, and it presses by calling the control's own `click()`, so the demonstration runs through exactly the code a person would trigger.",
  "In the hero, switching Day to Week tweens the headline number and a 28-point series in one `requestAnimationFrame` loop that writes the SVG path and the highlighted point straight to the DOM. A timeout lands the values if frames never arrive.",
  "With no props the bento plays its own loop and stops for good at the first press, key or keyboard focus. It also pauses off screen and in hidden tabs. Pass `tiles` for a subset, `focus` to hold one tile forward without the cursor, `onChange` to receive every change, and `accent`, `theme` and `density` to restyle it. Reduced motion shows one held frame: Week selected, four guests, reminders on, a search result, two tasks ticked and the track playing.",
]
