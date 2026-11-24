import * as React from "react"

import { Tooltip, TooltipProvider } from "@/components/ui/tooltip"

const BTN =
  "inline-flex h-9 items-center rounded-[10px] px-3 text-[13px] font-medium text-neutral-800 shadow-[0_0_0_.5px_rgba(0,0,0,.12)] outline-offset-2 transition-transform active:scale-[.96] focus-visible:outline-2 focus-visible:outline-[#0060e2] dark:text-neutral-100 dark:shadow-[0_0_0_.5px_rgba(255,255,255,.16)]"

export default function Demo() {
  const [log, setLog] = React.useState("Nothing pressed yet")
  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 420 }}>
      {/* 1 · Built in: a cursor slides along the toolbar until you touch it. Then it is yours. */}
      <Tooltip onSelect={(it) => setLog(`Pressed "${it.label}"`)} />

      {/* 2 · Wrapping your own controls: one provider makes them a group, so sliding between them skips the delay. */}
      <div className="flex flex-col items-start gap-3">
        <TooltipProvider delay={500} skipDelay={250}>
          <div className="flex flex-wrap gap-2">
            <Tooltip content="Send to 14 investors" shortcut="⌘ ↵" side="bottom">
              <button type="button" className={BTN} onClick={() => setLog("Pressed Send")}>
                Send
              </button>
            </Tooltip>
            <Tooltip content="Saved to Drafts at 09:41" shortcut="⌘ S" side="bottom">
              <button type="button" className={BTN} onClick={() => setLog("Pressed Save")}>
                Save draft
              </button>
            </Tooltip>
            <Tooltip content="Unavailable until the run ends" disabled>
              <button type="button" className={BTN} disabled style={{ opacity: 0.4 }}>
                Export
              </button>
            </Tooltip>
          </div>
        </TooltipProvider>
        <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes = [
  "A group of tooltips shares one small store with a single timer. The first tip waits for hover intent (400ms), and a pointer still sweeping across the control (faster than about 0.9px per millisecond) restarts that wait, so a pass-through never flashes. Any tip that opens while another is open, or within 300ms of one closing, skips the wait and shows with no animation at all.",
  "The decisive moment is the toolbar: the cursor glides to the first icon, the readout counts 400 ms, then each neighbour opens at 0 ms. The cursor drives the real tooltips through the same store as a real pointer, and the number shown is the wait that was measured, not a script.",
  "The bubble is portalled to the body with fixed positioning. Placement prefers a side, flips when there is no room, clamps to the viewport and aims its scale origin at the anchor, so it grows out of the control instead of the middle of itself. Exits are quick (100ms) and a tip that is replaced by a neighbour is removed immediately.",
  "Keyboard: focus-visible opens the tip at once; Escape, Enter and Space close it without moving focus, and the Escape is marked handled so a dialog around the control stays open. The toolbar uses arrow keys, Home and End with a roving tab stop. The pointer can cross onto an open tip and it stays (a 120ms grace after leaving the control). The control gets aria-describedby while its tip is open; the shortcut chips are display only, so there is no aria-keyshortcuts until your own code binds the keys. When its aria-label already says the tip text, that text is hidden from the description, so a screen reader hears the name once and then only the shortcut. Touch never opens a tip. The built-in demo stops for good at the first real hover, touch or key press, and pauses off screen and in hidden tabs. Reduced motion shows the Branch tip already open and no animation.",
]
