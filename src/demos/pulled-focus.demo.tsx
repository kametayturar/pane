import * as React from "react"

import { PulledFocus } from "@/components/ui/pulled-focus"

export const notes = [
  "Every line of the recap is one absolutely positioned paragraph moved only by a CSS transform (`translate` and `scale` from custom properties). When the focus is pulled, the three finished lines scale to 0.5 and slide to measured x offsets, one after another, until they sit in one small row; the fourth line scales up to fill the card width and turns accent. The offsets and the swell factor come from one measuring pass (`offsetWidth` of each noun and of the headline), repeated by a ResizeObserver and when fonts load.",
  "The decisive moment is a single `data-phase` flip on the card. Answering flips it again: the headline scales back to 1, turns to ink and its words cross-fade through a blur into `moved 09:41`, while the small row stays where it is as the record. The stage and the question area each animate between measured pixel heights, and the root reserves the tallest phase, so nothing around the card moves.",
  "Below the headline three panes share one grid cell and cross-fade; the hidden ones are `inert` and `visibility: hidden`, and a press moves keyboard focus to the new pane's main button. The clock is plain timeouts, not animation frames, so the end state lands even where frames never arrive.",
  "The measuring pass also fits long data: if the widest recap line is wider than the card, all lines scale down together (never below 13px) and a noun that still does not fit is cut with an ellipsis; the folded row closes its gaps, then shares the width between the nouns; two buttons that do not fit side by side stack. Counts are formatted for the page locale.",
  "With no props the card plays its own loop (recap, focus pulled, answered, repeat), pretending to press the buttons, and stops for good at the first press, key, hover or focus on the card; it also pauses off screen and in hidden tabs. Pass `results`, `decision` and `onAnswer`, or control it with `phase`, to use it for real. Reduced motion shows the focus-pulled frame and the buttons still work.",
]

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [real, setReal] = React.useState(0)
  const [log, setLog] = React.useState("Waiting for an answer")

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 400 }}>
      {/* 1 · Built in: plays the moment and loops until you touch it */}
      <div className="flex flex-col items-start gap-3">
        <PulledFocus key={run} />
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white"
        >
          Replay
        </button>
      </div>

      {/* 2 · Your own data and callbacks */}
      <div className="flex flex-col items-start gap-3">
        <PulledFocus
          key={real}
          agent="Sage"
          since="05:15"
          at="08:02"
          results={[
            { count: 62, noun: "receipts", verb: "filed" },
            { count: 23, noun: "tickets", verb: "triaged" },
            { count: 9, noun: "quotes", verb: "drafted" },
          ]}
          decision={{
            question: "Refund Delta Freight £480?",
            detail: "It is three times their usual order.",
            primary: { label: "Refund it", outcome: { title: "£480 refunded.", detail: "Sage, 08:02: paid it back and told Delta Freight." } },
            secondary: { label: "Hold it", outcome: { title: "Refund on hold.", detail: "Sage, 08:02: kept the request open and asked finance to look." } },
          }}
          onAnswer={(c) => setLog(c === "primary" ? "Answered: refund it" : "Answered: hold it")}
          onReplay={() => setLog("Waiting for an answer")}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          <span aria-live="polite">{log}</span>
          <button
            type="button"
            onClick={() => {
              setReal((n) => n + 1)
              setLog("Waiting for an answer")
            }}
            className="rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-950 hover:underline dark:hover:text-white"
          >
            Run again
          </button>
        </div>
      </div>

      {/* 3 · Long names and big numbers: the lines scale down to fit, then cut with an ellipsis */}
      <div className="flex flex-col items-start gap-3">
        <PulledFocus
          agent="Kensington-Whitfield"
          results={[
            { count: 1248, noun: "purchase orders", verb: "reconciled" },
            { count: 219, noun: "vendor emails", verb: "categorised" },
            { count: 87, noun: "contract renewals", verb: "drafted" },
            { count: 31, noun: "expense reports", verb: "approved" },
          ]}
          decision={{
            question: "Move the Harbor & Finch quarterly review to Thursday?",
            detail: "It clashes with the Northwind renewal call.",
            primary: { label: "Move it to Thursday", outcome: { title: "Review moved to Thursday.", detail: "Told the 4 attendees and updated the calendar." } },
            secondary: { label: "Hold it for review", outcome: { title: "Review held.", detail: "Kept the slot and asked the 4 attendees." } },
          }}
        />
        <span className="px-1 text-[12px] text-neutral-700 dark:text-neutral-300">Long names and big numbers</span>
      </div>
    </div>
  )
}
