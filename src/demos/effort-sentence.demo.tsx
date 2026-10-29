import * as React from "react"

import { EffortSentence, type EffortSentenceLevel } from "@/components/ui/effort-sentence"

const LEVELS: EffortSentenceLevel[] = [
  { id: "skim", label: "Skim", sentence: "Sage reads the first page, then drafts in about {time} for {price}.", time: "5 seconds", price: "$0.004" },
  { id: "read", label: "Read", sentence: "Sage *reads *every *page, then drafts in about {time} for {price}.", time: "30 seconds", price: "$0.03" },
  { id: "study", label: "Study", sentence: "Sage *reads *every *page *twice *and *cites *its *sources, then drafts in about {time} for {price}.", time: "2 minutes", price: "$0.15" },
]

export default function Demo() {
  const [log, setLog] = React.useState("Nothing chosen yet")
  return (
    <div className="mx-auto flex w-full flex-col gap-8" style={{ maxWidth: 480 }}>
      {/* 1 · Built in: plays the decisive moment and loops until you touch it. */}
      <EffortSentence />

      {/* 2 · Your own levels and wording, reporting each choice */}
      <div className="flex flex-col items-start gap-3">
        <EffortSentence
          context="Contract summary · 42 pages"
          levels={LEVELS}
          defaultValue="read"
          moreLabel="Study harder"
          lessLabel="Skim it"
          onChange={(l, i) => setLog(`Chose ${l.label} (level ${i + 1} of ${LEVELS.length}): ${l.time}, ${l.price}`)}
        />
        <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes = [
  "The sentence is a list of word elements, and a level change is a diff. A longest-common-subsequence match between the old and new words decides which words stay; those keep their element and glide to their new place with FLIP (read the old rect, change the DOM, read the new rect, play a Web Animations transform from the difference to none), so old words move apart instead of jumping.",
  "New words are separate elements that blur in (opacity, 6px blur, 8px rise) after a short delay and a 55ms stagger, so the gap opens first. A removed word leaves a cloned ghost at its old spot that blurs out and is deleted. The seconds and the price are single tokens: when one changes, the old figure ghost rolls up while the new one rolls in from below, both on the same spot, so the trade is readable the whole time.",
  "Every level is also laid out invisibly in the same grid cell as the live sentence, so the card is exactly as tall as its longest sentence and the buttons never move, at any width, with no JavaScript measuring. The sentence size follows a container query, not the viewport.",
  "With no props the card plays quick, standard, deep and back on a chain of timeouts that pauses off screen and in hidden tabs, and stops for good at the first pointer, key or focus. If frames never arrive, the final sentence is already in the DOM and a timeout cancels the leftover animations. Reduced motion shows the Standard sentence and swaps instantly. Pass `levels`, `value` and `onChange` to drive it with real data.",
]
