import * as React from "react"

import { SamePage } from "@/components/ui/same-page"

export default function Demo() {
  const [log, setLog] = React.useState("Nothing handed over yet")
  return (
    <div className="mx-auto flex w-full flex-col items-center gap-10" style={{ maxWidth: 420 }}>
      {/* 1 · Built in: plays the handoff and loops until you touch it. */}
      <SamePage />

      {/* 2 · Your own notes and agents, reporting each handoff */}
      <div className="flex w-full flex-col items-start gap-3">
        <SamePage
          from="Sage"
          to="Juno"
          sourceLabel="Funnel notes"
          notes={["Signups fell 12% in October, down from 9,400.", "Paid plans held steady.", "Mobile checkout failed on one in five tries."]}
          finding="Signups fell 12% in October,"
          continuation="and the cause is checkout, not demand."
          defaultHanded={false}
          onHandedChange={(h) => setLog(h ? "Sage handed the page to Juno" : "Sage took the page back")}
        />
        <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes = [
  "The memo is laid out from the start, so the card never changes height; only its words are hidden. When the work is handed over, the first words of the memo are measured against the same words in the notes (centre to centre, with a scale from the two font sizes), and each memo word plays a Web Animations transform from that spot to its own, 30ms after the one before. The notes stay put and dim behind it, so the finding reads as lifted, not copied.",
  "Everything after the lift is CSS on one `data-s` attribute (ready, run, done): the hairline seam draws left to right, the second agent's tag blurs in on it, and the continuation words fade in on a 70ms stagger starting where the lifted words land. The caret blinks twice at the end of the memo.",
  "With no props the card plays the handoff, holds, takes it back and repeats, on timeouts that pause off screen and in hidden tabs and stop for good at the first pointer, key or focus inside the card. If frames never arrive, a timeout finishes every leftover animation so the memo is complete. Reduced motion shows the finished memo with no motion. Pass `notes`, `finding` and `continuation`, and drive it with `handed` and `onHandedChange`.",
]
