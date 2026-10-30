import * as React from "react"

import { PlanWords, type PlanWordsModes, type PlanWordsStep } from "@/components/ui/plan-words"

const STEPS: PlanWordsStep[] = [
  { id: "export", title: "Export the contacts", minutes: 1 },
  { id: "dedupe", title: "Merge duplicates", minutes: 3 },
  { id: "tag", title: "Tag by region", minutes: 2 },
  { id: "import", title: "Import to the CRM", minutes: 2 },
]

const describe = (modes: PlanWordsModes) =>
  STEPS.map((s) => `${s.title.split(" ")[0]}: ${modes[s.id] ?? "run"}`).join(" · ")

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [real, setReal] = React.useState(0)
  const [log, setLog] = React.useState("Nothing chosen yet")

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 440 }}>
      {/* 1 · Built in: plays the moment and loops until you touch it */}
      <div className="flex flex-col items-start gap-3">
        <PlanWords key={run} />
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white"
        >
          Replay
        </button>
      </div>

      {/* 2 · Your own plan and callbacks: nothing runs by itself, every choice is reported */}
      <div className="flex flex-col items-start gap-3">
        <PlanWords
          key={real}
          agent="Sage"
          caption="Sage's plan to clean up the customer list"
          steps={STEPS}
          hint="Tap Run to ask first or skip a step."
          goLabel="Start"
          onChange={(modes, c) => setLog(`${c.step.title}: ${c.mode}. ${describe(modes)}`)}
          onGo={(modes) => setLog(`Started. ${describe(modes)}`)}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          <span aria-live="polite">{log}</span>
          <button
            type="button"
            onClick={() => {
              setReal((n) => n + 1)
              setLog("Nothing chosen yet")
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

export const notes = [
  "Each word at the right of a step is a real button, and the word is one small component: a grid cell holding the old word and the new one. When the text changes, the old word is re-rendered on top with an exit keyframe (it blurs and lifts), and the new one mounts with a springy entrance (a cubic-bezier with overshoot) from below. Both sit in the same cell and are right-aligned, so the column never shifts while they cross.",
  "The decisive moment is attributes, not scripts. A step's mode is a `data-m` value on its row. Ask first draws a blue tick with a scaleY transition and recolours the word; Skip draws the strike with scaleX, and only after .32s (a transition delay) the title settles 3px lower and dims, so the strike reads before the step steps back. Go flips `data-started` on the card, and the same column turns from control words to status words with the same roll, the first becoming a pulsing Working.",
  "The line under the list says what the choices add up to. Every sentence it can say (one per step, plus the others) is laid out invisibly in the same grid cell, so the cell is as tall as the longest and the footer never moves, at any width. The total below it is two versions sharing one cell that cross-fade through a blur at Go. Sizes follow a container query, not the viewport.",
  "With no props the card plays its own loop (ask first on the second step, ask then skip on the last, Go, rest, fade back) on a chain of timeouts that pauses off screen and in hidden tabs and stops for good at the first press, key, hover or focus on the card itself; clicking elsewhere on the page does nothing. No animation frame is needed, so the final state is always in the DOM. Reduced motion shows one still frame (ask first and skip chosen) and every change swaps instantly. Pass `steps`, `value`, `onChange` and `onGo` to drive it with real data.",
]
