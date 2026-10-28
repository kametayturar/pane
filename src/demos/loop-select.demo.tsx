import * as React from "react"
import { RotateCcw } from "lucide-react"

import { LoopSelect, type LoopItem } from "@/components/ui/loop-select"

export const notes: string[] = [
  "The stroke is an SVG path whose `d` attribute is written straight from the pointer handler (no React render per move). Points closer than about 2px are dropped, the list is thinned once it passes 500 points, and the path is drawn with midpoint quadratic curves so a mouse polyline reads as a smooth pencil line. A small `feTurbulence` plus `feDisplacementMap` filter roughens the edge while drawing, which is what makes it look like grease pencil; the filter is removed when the pen lifts.",
  "Selection is plain geometry: on every move the centre of each tile is tested against the stroke with a ray-casting point-in-polygon check (the polygon closes itself, so a loose C still works). On release the test runs against the trimmed loop you can actually see, so a tail that overshoots the start never selects a tile that looks outside. Tiles inside get a dashed ring while you draw and a solid ring and check when you let go, and an older selection dims while a new loop is in progress.",
  "On release the raw points are resampled to 72 points evenly by arc length, then smoothed with Taubin smoothing: one pass that pulls each point toward its neighbours' average, then a slightly stronger pass pushing back out. Together they round the corners without shrinking the loop. A requestAnimationFrame loop interpolates point by point from the raw loop to the smooth one over 240ms and rebuilds a closed Catmull-Rom path each frame; the final path is already written before the first frame, so it still lands if frames never run.",
  "The chip never covers a file. It lives in a dock, a row under the grid that grows from nothing when a selection exists and is `position: sticky` so on a long phone grid it stays in reach. One rounded surface holds three faces (count and action, composer, answer) stacked in the same corner; a ResizeObserver measures the active face and writes its pixel size to the chip and the dock, so CSS transitions the pill into the composer and the composer into the answer card. The first time it opens it glides down from under the loop (a Web Animations `translate`, clamped), and the answer streams in word by word from CSS delays, so there are no timers to clean up.",
  "The demo plays its own story once when scrolled into view: a pen dot draws a hand-wobbled loop across three columns, the chip drops in, the composer types a question, and Atlas answers from exactly the circled files. Any key or pointer press stops it where it is; reduced motion jumps to the finished answer. The keyboard route is a roving tabindex on a `listbox` (arrows, Shift+arrow, Space, Cmd or Ctrl+A, Esc), and touch drawing needs `touch-action: none`, so the Draw button switches it on and it starts off for coarse pointers. File-kind colours are hue turns of the accent through relative colour syntax, so Mono and Glass restyle them for free.",
]

const LAUNCH: LoopItem[] = [
  { id: "hero", name: "hero-shot-final.png", sizeKb: 1840, modified: "Tue" },
  { id: "teaser", name: "teaser-cut-b.mp4", sizeKb: 38400, modified: "Tue" },
  { id: "copy", name: "launch-copy-v3.md", sizeKb: 18, modified: "Mon" },
  { id: "faq", name: "customer-faq.docx", sizeKb: 74, modified: "Mon" },
  { id: "deck", name: "press-deck.pdf", sizeKb: 3100, modified: "Fri" },
  { id: "list", name: "press-list.csv", sizeKb: 29, modified: "Thu" },
  { id: "pricing", name: "pricing-table.xlsx", sizeKb: 210, modified: "Thu" },
  { id: "tokens", name: "design-tokens.json", sizeKb: 9, modified: "Wed" },
  { id: "frames", name: "launch-frames.fig", sizeKb: 7200, modified: "Wed" },
]

type Dataset = "close" | "launch"

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [data, setData] = React.useState<Dataset>("close")
  const [asked, setAsked] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-[760px] flex-col items-center gap-5">
      <div className="w-full rounded-3xl bg-neutral-100 px-2 py-5 sm:px-6 sm:py-8 dark:bg-white/[.04]">
        {data === "close" ? (
          <LoopSelect key={`close-${run}`} onAsk={(a) => setAsked(`${a.items.map((i) => i.name).join(", ")}: ${a.prompt}`)} />
        ) : (
          <LoopSelect
            key={`launch-${run}`}
            items={LAUNCH}
            title="Launch week"
            subtitle="Northwind Clinics · 9 files"
            agent="Sage"
            autoPlay
            autoPrompt="Which of these still show last year's price?"
            reply={(a) =>
              a.ids.includes("pricing")
                ? "Only pricing-table.xlsx: it still lists Team at $39. launch-copy-v3.md and press-deck.pdf already say $49, so fix the sheet before the 09:00 send."
                : "None of these mention a price. Circle pricing-table.xlsx to check it."
            }
            onAsk={(a) => setAsked(`${a.items.map((i) => i.name).join(", ")}: ${a.prompt}`)}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-neutral-600 dark:text-neutral-400">
        <div role="group" aria-label="Project" className="flex rounded-lg bg-neutral-200/60 p-0.5 dark:bg-white/10">
          {(["close", "launch"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={data === d}
              onClick={() => {
                setData(d)
                setAsked(null)
              }}
              className={`rounded-md px-2.5 py-1 transition-colors ${data === d ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white" : ""}`}
            >
              {d === "close" ? "Q3 close" : "Launch week"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setRun((r) => r + 1)
            setAsked(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 hover:bg-neutral-200/70 dark:hover:bg-white/10"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Replay
        </button>
      </div>
      <p className="min-h-5 max-w-[640px] text-center text-[12.5px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {asked ? `onAsk received: ${asked}` : "Circle a few files, then press Ask about these."}
      </p>
    </div>
  )
}
