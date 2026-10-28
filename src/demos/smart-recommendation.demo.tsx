import * as React from "react"

import { SmartRecommendation, type Recommendation } from "@/components/ui/smart-recommendation"

const OPTIONS: Recommendation[] = [
  {
    id: "fast",
    label: "Fast model",
    signal: 3,
    reason: (
      <>
        Your last 12 prompts were short lookups – the <strong>Fast model</strong> answers these about 3x quicker at a
        fraction of the cost.
      </>
    ),
  },
  {
    id: "balanced",
    label: "Balanced model",
    signal: 2,
    reason: (
      <>
        The <strong>Balanced model</strong> keeps most of the depth for longer questions and is still twice as fast as
        the large one.
      </>
    ),
  },
  {
    id: "large",
    label: "Keep large model",
    signal: 0,
    acceptLabel: "Keep current model",
    reason: (
      <>
        Staying on the <strong>large model</strong> is the most thorough option, but each answer takes noticeably longer.
      </>
    ),
  },
]

export default function Demo() {
  const [log, setLog] = React.useState("Nothing accepted yet")
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-3 pt-24">
      <SmartRecommendation
        options={OPTIONS}
        onAccept={(o) => setLog(`Accepted: ${o.label}`)}
        onUndo={(o) => setLog(`Undid: ${o.label}`)}
      />
      <p className="text-center text-[12px] text-neutral-500">{log}</p>
    </div>
  )
}

export const notes = [
  "The card folds by animating `grid-template-rows` from `1fr` to `0fr` on a wrapper whose child has `min-height: 0; overflow: hidden`. CSS can't transition `height: auto`, but it can transition grid track sizes, so no JavaScript measuring is needed.",
  "The confidence bars are three spans whose heights (5/8/11px) never change; only `data-on` and a `data-level` attribute on the parent change, and CSS picks the colour (amber, blue, green) from that level. The word next to the bars is real text, so the signal never depends on colour alone.",
  "The alternatives menu is a `role=\"menu\"` of `menuitemradio` buttons. Opening it moves focus to the current option, arrow keys/Home/End move between items, Escape closes it and hands focus back to the trigger, and an outside `pointerdown` listener (added only while open) dismisses it.",
  "When another option is picked, the paragraph gets a new React `key`. A new key remounts the element, which restarts its CSS `@keyframes` – that is how the reason 'swaps softly' without any animation library.",
  "A container query (`container-type: inline-size` on the card) tightens paddings and resizes the menu when the card itself is narrow – the layout reacts to the card's width, not the viewport's.",
]
