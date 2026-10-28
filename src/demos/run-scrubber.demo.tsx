import * as React from "react"

import { RunScrubber, SAGE_RUN, SAGE_DURATION } from "@/components/ui/run-scrubber"

export const notes = [
  "The panel is a pure function of one number. stateAt(steps, t) finds the active step, sums tokens as each step's total × how far through it the playhead is, and reveals each scratchpad with text.slice(0, length × progress). Because nothing is stored, scrubbing backwards 'un-types' the text for free and playing forward is just t increasing.",
  "The playhead is a role='slider' element with pointer capture: pointerdown calls setPointerCapture so the drag keeps tracking outside the box, x becomes seconds via getBoundingClientRect, and any step boundary within 6px wins ('gentle snap'). Alt bypasses it. Dragging pauses playback and resumes on release if it was playing.",
  "Playback is one requestAnimationFrame loop that adds min(0.1, dt) × rate to the time, so a stalled tab can't jump the tape. It does nothing while the card is offscreen (IntersectionObserver) or the tab is hidden, and time/onTimeChange follow the controlled/uncontrolled pattern: if you pass time, the loop just reports the next value.",
  "The density strip is ordered dithering: token throughput per bin is compared with a 4×4 Bayer matrix, and the dots are drawn once on a canvas that becomes a CSS mask-image (a data URL). Two stacked divs use that same mask – one ink-faint, one darker and clipped with clip-path to the playhead – so 'played so far' costs one CSS variable per frame, not a redraw.",
  "Ruler ticks adapt to width: pick the smallest minor step that leaves ≥9px between ticks and the smallest major step (a multiple of it) with ≥58px. A ResizeObserver feeds the width in, so 360px shows every 2 s and 880px every second.",
]

const fmt = (n: number) => n.toFixed(1)

export default function Demo() {
  const [time, setTime] = React.useState(14.2)

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4">
      <RunScrubber
        steps={SAGE_RUN}
        duration={SAGE_DURATION}
        runLabel="RUN 0412 · SAGE"
        title={
          <>
            Weekly report, <em>assembled</em>
          </>
        }
        time={time}
        onTimeChange={setTime}
        autoPlay
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 font-mono text-[11px] uppercase tracking-[.08em] text-black/45 dark:text-white/45">
        <span>Controlled · time={fmt(time)}</span>
        {[
          ["Plan", 0],
          ["Feedback", 9.6],
          ["Draft", 24],
          ["Send", 33.4],
        ].map(([label, at]) => (
          <button
            key={label}
            type="button"
            onClick={() => setTime(at as number)}
            className="rounded-[2px] px-2 py-1 shadow-[0_0_0_1px_rgb(0_0_0/.14)] hover:text-black dark:shadow-[0_0_0_1px_rgb(255_255_255/.2)] dark:hover:text-white"
          >
            Jump to {label}
          </button>
        ))}
      </div>
    </div>
  )
}
