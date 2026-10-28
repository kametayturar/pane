import * as React from "react"

import { ScrollEdge } from "@/components/ui/scroll-edge"
import { Scene } from "./_glass-scenes"

export const notes = [
  "The edge is four stacked layers per side, each a `backdrop-filter: blur()` of 0.7, 2, 5 and 10px, and each masked to its own band of the strip with `mask-image: linear-gradient()`. The bands overlap by half, so the blur grows smoothly towards the bar instead of stopping at a line. The strongest layer holds across the bar and the quick replies, so no readable text sits behind them. Switch to 'Hard edge' to see one flat blur for comparison.",
  "The large title is one element that becomes the small one. A single number, `--ise-p` (0 at the top, 1 once collapsed), feeds `calc()` in its `left`, `top`, `transform-origin`, `translateX` and `scale`, so it glides into the centre of the bar and shrinks, while the glass behind it fades in. The number is registered with `@property` so the browser can animate it.",
  "`--ise-p` is driven by the scroll position itself. The scroller declares `scroll-timeline: --ise-tl`, the frame declares `timeline-scope: --ise-tl`, and the header and the two edges each run a keyframe animation on that timeline, so no JavaScript runs while you scroll and style recalculation stops before it reaches the messages. Where scroll-driven animations are missing, a passive scroll listener writes the same variable on the same three elements. Browser support is decided with `useSyncExternalStore` (false on the server), so server rendering hydrates cleanly.",
  "The glass follows the same recipe everywhere: a backdrop-only layer (so text stays sharp), a tint layer, and a rim made from a gradient ring cut out with `mask-composite: exclude`. There is no `mix-blend-mode` or `isolation` near it, because either one blanks the backdrop. Reduced transparency and browsers without `backdrop-filter` get solid surfaces. The frosted tier is on wherever `backdrop-filter` exists and only `prefers-reduced-transparency: reduce` turns it off, instead of waiting for `no-preference`, because Safari lacks that query and would otherwise show opaque bars.",
  "Auto-scroll holds on the large title for a beat, crosses the fold slowly, then picks up speed. It holds still while the pointer or focus is inside, and stops for good at the first wheel, touch or key, or once you type or send a message. The quick replies change after each exchange, and the built-in Atlas answers each one with something that follows from it.",
  "In Chromium the two bars also refract: a canvas paints a displacement map (neutral grey inside, inward vectors along the rim), an SVG `feDisplacementMap` filter reads it, and `backdrop-filter: url(#id)` bends what is behind the bar. The check looks for the Chromium brand instead of using `@supports`, which says yes in Safari and Firefox too.",
]

export default function Demo() {
  const [edge, setEdge] = React.useState<"progressive" | "uniform">("progressive")
  const [auto, setAuto] = React.useState(true)

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-[36px] p-3 sm:p-10">
        <Scene tone="harbor" seed={11} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <div className="relative mx-auto w-full max-w-[420px]">
          <ScrollEdge
            height="min(680px, 78dvh)"
            edge={edge}
            autoScroll={auto}
            style={{ boxShadow: "0 30px 70px -24px rgba(20,10,60,.55), 0 0 0 .5px rgba(255,255,255,.4)" }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-[13px]">
        <div role="group" aria-label="Edge style" className="inline-flex rounded-full bg-black/5 p-0.5 dark:bg-white/10">
          {(
            [
              ["progressive", "Soft edge"],
              ["uniform", "Hard edge"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={edge === v}
              onClick={() => setEdge(v)}
              className="rounded-full px-3.5 py-1.5 font-medium text-neutral-500 transition-colors aria-pressed:bg-white aria-pressed:text-neutral-900 aria-pressed:shadow-sm dark:text-neutral-400 dark:aria-pressed:bg-neutral-700 dark:aria-pressed:text-white"
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={auto}
          onClick={() => setAuto((a) => !a)}
          className="rounded-full bg-black/5 px-3.5 py-2 font-medium text-neutral-600 aria-checked:bg-[#0060e2] aria-checked:text-white dark:bg-white/10 dark:text-neutral-300"
        >
          Auto-scroll
        </button>
      </div>
      <p className="text-center text-[12px] text-neutral-500 dark:text-neutral-400">
        Scroll: the title folds into glass and messages slide under a soft blur.
      </p>
    </div>
  )
}
