import * as React from "react"

import { DiffReview, DIFF_REVIEW_SAMPLE, type DiffReviewDecisions } from "@/components/ui/diff-review"

const tally = (d: DiffReviewDecisions) => {
  const a = Object.values(d).filter((x) => x === "accept").length
  const r = Object.values(d).filter((x) => x === "reject").length
  return `${a} accepted, ${r} rejected, ${DIFF_REVIEW_SAMPLE.length - a - r} to go`
}

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [log, setLog] = React.useState("Waiting for your review")

  return (
    <div className="mx-auto flex w-full flex-col items-start gap-3" style={{ maxWidth: 640 }}>
      {/* Atlas's change to the user API and its hook. The first hunk is accepted by itself once, then it is yours: A, R, J/K, U. */}
      <DiffReview
        key={run}
        agent="Atlas"
        hunks={DIFF_REVIEW_SAMPLE}
        intro
        onDecide={(id, decision, all) => setLog(`${id}: ${decision ?? "undecided"} · ${tally(all)}`)}
        onApply={(accepted) => setLog(`Applied ${accepted.map((h) => h.id).join(", ") || "nothing"}`)}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
        <span aria-live="off">{log}</span>
        <button
          type="button"
          onClick={() => {
            setRun((n) => n + 1)
            setLog("Waiting for your review")
          }}
          className="whitespace-nowrap rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-950 hover:underline dark:hover:text-white"
        >
          Start over
        </button>
      </div>
    </div>
  )
}

export const notes = [
  "The piece takes hunks as data and numbers each line itself from the hunk header when a line carries no numbers. Hunks are grouped by file in order of first appearance, and that grouped order is the review order. One index says which hunk is open; every decision moves it to the next undecided hunk, wrapping round, and when none are left it goes to -1 and the header changes phase.",
  "Folding is grid rows, not measured heights: each hunk's body is a one-row grid whose track transitions between 0fr and 1fr, with the code inside an overflow-hidden clip, so the open hunk grows to its real height and the decided one shrinks to its one-line summary in the same 420ms on one curve. The collapsed body is `inert`, so its buttons and code leave the tab order and the accessibility tree.",
  "The header is three layers in one grid cell (count, verdict, applied), cross-fading through a light blur, so it never changes height. Inside the count only the number rolls: the old digit leaves upward through a blur and the new one lands from below in the same cell.",
  "Keys are handled once on the card: A and R decide the open hunk (pressing the decision it already has takes it back), J/K and the arrows move, U pops a history stack of (hunk, previous decision). After each one, keyboard focus follows to the open hunk's row or, at the end, to Apply, and a polite live region says what happened and how many are left. Additions are marked by a leading +, weight 500 and a faint accent tint; removals by a − and a strike, so Mono reads the same without any tint.",
]
