import * as React from "react"

import { KnowledgeBase, type RetrievalSettings } from "@/components/blocks/knowledge-base"

export default function Demo() {
  const [last, setLast] = React.useState<RetrievalSettings | null>(null)
  return (
    <div className="flex w-full max-w-[720px] flex-col gap-4 py-4">
      <KnowledgeBase onSettingsChange={setLast} />
      <p aria-live="polite" className="min-h-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {last ? `Settings: ${last.chunkSize} / ${last.overlap} tokens, top ${last.topK}, ${last.hybrid ? "hybrid" : "vector only"}, rerank ${last.rerank ? "on" : "off"}` : "Open the sliders icon, or run a search in Test retrieval"}
      </p>
    </div>
  )
}

export const notes = [
  "Each source's pipeline is four segments driven by one `step` and one 0-to-1 `progress`: earlier segments are full, the current one is a `scaleX` fill with a CSS transition, later ones are empty. The shimmering segment is a gradient sweep, so no extra state is needed.",
  "Without a `sources` prop the block runs its own ingestion simulation: an interval advances every processing source through parse, chunk, embed and index, then swaps in chunk counts computed as tokens / (chunk size - overlap), so changing the settings changes the totals.",
  "The retrieval test runs a small stand-in retriever (keyword overlap plus a deterministic similarity) and a second scoring function for the reranker. Switching Rerank reorders the same candidates, and the rows slide to their new places with the Web Animations API (a FLIP: measure `offsetTop` before and after, then `element.animate` from the difference).",
  "Matched words are wrapped in real `<mark>` elements by splitting the text on a regular expression built from the stemmed query terms, so screen readers and copy-paste see normal text.",
  "Opening a result animates `grid-template-rows` from `0fr` to `1fr`, which lets CSS transition an element's height without measuring it.",
]
