import * as React from "react"

import { ModelArena, type ArenaVote } from "@/components/blocks/model-arena"

export default function Demo() {
  const [last, setLast] = React.useState<ArenaVote | null>(null)
  return (
    <div className="flex w-full max-w-[800px] flex-col gap-4 py-4">
      <ModelArena onVote={setLast} />
      <p aria-live="polite" className="min-h-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {last
          ? `onVote: round ${last.round}, ${last.choice === "tie" || last.choice === "bad" ? last.choice : `${last.winner?.name} won`} · A was ${last.a.name}, B was ${last.b.name}`
          : "Vote to see the onVote payload here"}
      </p>
    </div>
  )
}

export const notes = [
  "Both answers stream through one controller: an AbortController per round, one async generator per pane (`for await`), and a reducer that ignores actions from an older run id so a stopped round can never write into the next one.",
  "Streaming text is parsed as small markdown on every chunk, but each word is a keyed span with a 160 ms opacity animation that only plays on mount. Already-shown words keep their keys, so only the newly arrived words fade in. A half-streamed `**bold` stays bold because the parser toggles on each marker instead of waiting for a pair.",
  "Blind mode is a data question, not a CSS one: the names, marks and titles are not rendered at all until the vote, so they never reach the DOM or the accessibility tree. The reveal swaps keyed elements, which replays a short fade.",
  "The vote area animates its height with a ResizeObserver that measures the content and a CSS transition between two pixel values, because CSS cannot transition to `height: auto`.",
  "Leaderboard rows are absolutely positioned and moved with `transform: translateY(rank * 30px)`, so a re-sort glides rows to their new place (a hand-rolled FLIP) and win-rate bars are `scaleX` transitions.",
  "The card measures itself with a ResizeObserver and a CSS container query (`container: mar / inline-size`), so the panes become tabs below 560px of the card's own width, not the viewport's.",
]
