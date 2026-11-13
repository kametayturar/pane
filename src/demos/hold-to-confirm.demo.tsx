import * as React from "react"

import { HoldToConfirm } from "@/components/ui/hold-to-confirm"

export const notes = [
  "The fill is not a CSS transition. One loop keeps a number from 0 to 1 and writes it to a custom property (`--hcn-p`) on the card; a solid ink copy of the label sits over the button and is clipped with `clip-path: inset(0 calc((1 - var(--hcn-p)) * 100%) 0 0)`, so the text flips from ink to surface exactly at the edge of the fill. While held, the value rises by elapsed time divided by the duration. It is linear on purpose: the bar is a clock, and any other curve would lie about how long is left.",
  "The decisive moment is letting go. The built-in demo presses, holds a little over half and releases: the fill does not run back at the pace it came, it returns on an ease-out whose length grows only slightly with how far it got (130ms plus 170ms times the progress), so the cancel is nearly instant while the commit took more than a second. Pressing again while it is still returning continues from where the fill is, never from zero or from a jump.",
  "Time comes from `performance.now()`, not from frame counts, so a slow frame does not stretch the hold, and a short watchdog timer keeps it finishing in a throttled tab. Pointer capture keeps the hold alive while the finger slides, and moving more than 36px outside the button counts as letting go. The card never changes height: the four lines under the button share one grid cell and crossfade through a small blur.",
  "Keyboard: hold Space or Enter (key repeat is ignored), release or blur cancels, Escape cancels. A polite live region announces holding, cancelled and confirmed. On completion keyboard focus moves to Restore, and back to the button after it. With no props the card plays its own loop and stops for good at the first press, key or focus; it also pauses off screen and in hidden tabs. Reduced motion shows the fill held at 58% and keeps the real hold working without the easing or scale.",
]

export default function Demo() {
  const [log, setLog] = React.useState("Nothing held yet")
  const [run, setRun] = React.useState(0)

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 400 }}>
      {/* 1 · Built in: plays the early release and the real hold, until you touch it */}
      <HoldToConfirm />

      {/* 2 · Your own copy, a slower hold and callbacks */}
      <div className="flex flex-col items-start gap-3">
        <HoldToConfirm
          key={run}
          duration={1800}
          title="Revoke the Quill token?"
          detail="Quill loses access to 6 repositories. Runs in progress stop at their next step."
          label="Hold to revoke token"
          holdLabel="Keep holding"
          doneLabel="Token revoked"
          doneHint="Quill can no longer sign in."
          resetLabel="Undo"
          destructive
          onConfirm={() => setLog("Confirmed: token revoked")}
          onCancel={(p) => setLog(`Cancelled at ${Math.round(p * 100)}%`)}
          onReset={() => setLog("Undone: token active again")}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          <span aria-live="polite">{log}</span>
          <button
            type="button"
            onClick={() => {
              setRun((n) => n + 1)
              setLog("Nothing held yet")
            }}
            className="rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-950 hover:underline dark:hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
