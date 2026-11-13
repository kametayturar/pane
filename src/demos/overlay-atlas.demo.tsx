import { OverlayAtlas } from "@/components/blocks/overlay-atlas"

export default function Demo() {
  return (
    <div className="w-full">
      <OverlayAtlas />
    </div>
  )
}

export const notes = [
  "One faux window (Harbor & Finch: three tiles and a list, cropped at the foot) is drawn six times, and each copy carries one overlay that is closed until the last step. The whole cell is a single `data-step` attribute (0 reset, 1 pointer travelling, 2 press, 3 open), so every look is plain CSS that transitions between two states and nothing re-renders while it plays.",
  "The pointer lands on the real trigger: a `ResizeObserver` reads each trigger's rect and writes its centre to CSS variables, so the pointer travels there with one `transform` transition and the layout can change without the script being edited. The modal reads the same rect to set its `transform-origin`, so it grows out of the Delete button instead of out of the middle.",
  "Each overlay is what its name promises. The modal dims the page and settles from 0.96 with a 4px blur resolving; the popover and tooltip hang from their trigger (the tooltip waits a beat after the pointer arrives); the toast needs no trigger focus; the sheet rises over the page; the drawer slides in and nudges the page aside. Closing is quicker than opening.",
  "With no props the six cells play one after another, rest open, hold, then go again. The first touch, key press or hover ends that for good, and from then on a cell replays when you hover, focus or click it. The loop also pauses off screen and in hidden tabs. If frames never arrive the cells are already in their open state, which is also the still frame reduced motion shows.",
]
