import * as React from "react"

import { PROVENANCE_EXAMPLE, ProvenanceTrail, type ProvenanceSource } from "@/components/ui/provenance-trail"

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [opened, setOpened] = React.useState<ProvenanceSource | null>(null)

  return (
    <div className="-m-6 min-h-dvh p-6 sm:-m-10 sm:p-10">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.08em] text-neutral-950/45 dark:text-white/45">Instrument · Evidence</p>
            <h1 className="mt-1 font-['Instrument_Serif',Georgia,serif] text-[48px] leading-[50px] tracking-[-.01em] text-neutral-950 dark:text-white">
              Provenance <em>trail</em>
            </h1>
            <p className="mt-2 max-w-[560px] text-[13px] leading-5 text-neutral-950/64 dark:text-white/64">
              Every claim is underlined and numbered. Hover or focus one to trace a hairline to the source card and the phrase it rests on. The dashed claim has nothing behind it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="h-8 shrink-0 rounded-[2px] px-3 font-mono text-[11px] font-medium uppercase tracking-[.08em] text-neutral-950 dark:text-white shadow-[0_0_0_1px_var(--inst-signal)] outline-offset-2 hover:bg-[color-mix(in_oklab,var(--inst-signal)_10%,transparent)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--inst-signal)]"
          >
            Replay
          </button>
        </div>

        <ProvenanceTrail
          key={run}
          {...PROVENANCE_EXAMPLE}
          label="Answer · Nova 2 · 7 steps"
          confidence={0.86}
          autoPlay
          caption="FIG. 1 — Answer with 9 claims traced to 6 sources. 1 claim has no source."
          onSourceOpen={(source) => setOpened(source)}
        />

        <p className="font-mono text-[11px] uppercase tracking-[.08em] text-neutral-950/45 dark:text-white/45" aria-live="polite">
          {opened ? `Opened: ${opened.title} — ${opened.domain}` : "onSourceOpen: click a card title or press Enter on a claim"}
        </p>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "The answer is a list of segments; claim segments carry a sourceId. Paragraph blocks are a two-column CSS grid (text | margin) that collapses to one column with a container query, so the cards sit under their paragraph on narrow widths without any JavaScript layout.",
  "The connector is an SVG path built on hover: it reads the claim's last line box with getClientRects() and the card's getBoundingClientRect(), then draws a hairline with rounded elbows. It traces in by animating stroke-dashoffset on a path normalised with pathLength=1; a mask does the tracing so the same line can be dashed for unsupported claims.",
  "The typewriter keeps a character counter in state. Each segment shows text.slice(0, visibleChars), a block caret follows the segment being typed, and a card is revealed (clip-path inset scan plus a 1px signal line) when its claim is fully typed. It only advances while an IntersectionObserver says the answer is on screen.",
  "Retrieval score is a 16×3 canvas ordered dither: a 4×4 Bayer threshold table decides which cells get a dot, with length and density both following the score. The readout row recomputes sources, claims, supported and mean confidence from the claims revealed so far.",
]
