import * as React from "react"

import { ScopeWords, type ScopeWordsOption } from "@/components/ui/scope-words"

const OPTIONS: ScopeWordsOption[] = [
  { id: "today", word: "Today", consequence: "Until midnight, then it stops", receipt: "Moves meetings until 00:00, then stops" },
  { id: "week", word: "This week", consequence: "Until Friday evening", receipt: "Moves meetings until Friday 18:00" },
  { id: "always", word: "Always", consequence: "Any time, until you take it back", receipt: "Moves meetings until you take it back" },
]

export default function Demo() {
  const [log, setLog] = React.useState("Nothing granted yet")
  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 420 }}>
      {/* 1 · Built in: plays the decisive moment and loops until you touch the card. */}
      <ScopeWords />

      {/* 2 · Your own words, reporting each grant and each take back */}
      <div className="flex flex-col items-start gap-3">
        <ScopeWords
          agent="Atlas"
          action="move your meetings"
          options={OPTIONS}
          label="How long can Atlas move your meetings?"
          onGrant={(o, i) => setLog(`Granted "${o.word}" (option ${i + 1} of ${OPTIONS.length})`)}
          onRevoke={(o) => setLog(`Took back "${o.word}"`)}
        />
        <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes = [
  "The three words are real buttons in normal flow, so a longer word or a wrapped consequence just makes a taller row. On a choice the card measures each row (offsetTop and height, read once and again by a ResizeObserver) and writes the numbers as CSS variables. The chosen row's transform is translateY(-its top), so it rises into the headline slot; the options box animates between the full list height and word + gap + Take back, so the card collapses around it.",
  "The other two rows get a transform of 56px away from the chosen word, opacity 0 and an 8px blur, with a transition-delay of 40ms per step of distance, so they travel and blur out in a stagger. Their visibility switches after the fade, so they leave the tab order and the accessibility tree; on Take back they return with no delay. Each consequence line holds the promise and its receipt in one grid cell and the two crossfade, so the row height never changes with the text.",
  "With no props the card glides over Once, lands on This task, grants it, holds the receipt and takes it back, on a chain of timeouts that pauses off screen and in hidden tabs. Only a press, key, focus or mouse landing on the card ends the loop; the rest of the page can be clicked freely. While it loops the root reserves the full-card height so nothing below it moves. Reduced motion shows the granted card.",
  "Pass `options`, `value` (an id, or null) and `onGrant` / `onRevoke` to drive it with real data. Headings and the announced status come from `agent` and `action` unless you set them. Mono swaps in Geist Mono and underlines the chosen word, Glass puts the frost on the card with the Pane refraction filters and a solid fallback.",
]
