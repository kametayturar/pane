import * as React from "react"

import { UndoCountdown } from "@/components/ui/undo-countdown"

export const notes = [
  "The big number is real text in a row of fixed-width slots (0.66em each, so it scales with the card). The middle slot holds the countdown and the two outer slots hold the other digits of the count, invisible but taking their space, so the 1 sits dead centre the whole time. Each new second is a new glyph: the old one swells and blurs out while the next settles in, both with CSS keyframes.",
  "The decisive moment is only a class change. When the window closes, the card flips `data-phase` to done: the number turns from accent to ink, and the outer digits, whose animation had been waiting, fall in from above on a springy curve (a cubic-bezier with overshoot) and land beside the 1. Undo flips it with a different outcome, which swaps one custom property (`--y: 72px`) so the same keyframes rise from below instead.",
  "The word undo is a real button inside the label. At the end the label and the closing line (`newsletters are in Archive.`) share one grid cell and crossfade through a small blur, so the card never changes height. The window is a plain 80ms interval on `performance.now()`, not a frame loop, so it still finishes where animation frames never arrive; it holds while the pointer or focus is on the card.",
  "With no props the card plays its own loop (archive, then undo at the last second, repeat) and stops at the first press, key, hover or focus on the card, extending the open window to a real nine seconds. It pauses off screen and in hidden tabs. A real window starts counting when the card first scrolls into view and holds while the tab is hidden. Pass `seconds`, `onUndo` or `onCommit` to use it for real; reduced motion shows the window mid-count and undo still works.",
]

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [real, setReal] = React.useState(0)
  const [log, setLog] = React.useState("Undo window: 8 seconds")

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 400 }}>
      {/* 1 · Built in: plays the moment and loops until you touch it */}
      <div className="flex flex-col items-start gap-3">
        <UndoCountdown key={run} />
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white"
        >
          Replay
        </button>
      </div>

      {/* 2 · Your own data and callbacks: an eight-second window, one decision */}
      <div className="flex flex-col items-start gap-3">
        <UndoCountdown
          key={real}
          agent="Sage"
          action="filed"
          count={314}
          noun="receipts"
          destination="Expenses"
          origin="Inbox"
          seconds={8}
          onCommit={() => setLog("Committed: 314 receipts are in Expenses")}
          onUndo={() => setLog("Undone: 314 receipts are back in your Inbox")}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          <span aria-live="polite">{log}</span>
          <button
            type="button"
            onClick={() => {
              setReal((n) => n + 1)
              setLog("Undo window: 8 seconds")
            }}
            className="rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-950 hover:underline dark:hover:text-white"
          >
            Run again
          </button>
        </div>
      </div>
    </div>
  )
}
