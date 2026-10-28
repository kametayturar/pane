import * as React from "react"

import { AiComposer } from "@/components/blocks/ai-composer"

const WIDTHS = [
  { label: "Full", value: "100%" },
  { label: "560", value: "560px" },
  { label: "360", value: "360px" },
] as const

export default function Demo() {
  const [width, setWidth] = React.useState<(typeof WIDTHS)[number]["value"]>("100%")

  return (
    <div className="flex w-full flex-col items-center gap-5 py-6">
      <div className="w-full transition-[max-width] duration-300" style={{ maxWidth: width }}>
        <AiComposer height={600} />
      </div>
      <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>Container width</span>
        {WIDTHS.map((w) => (
          <button
            key={w.value}
            type="button"
            aria-pressed={width === w.value}
            onClick={() => setWidth(w.value)}
            className="rounded-full px-3 py-1 shadow-[0_0_0_1px_rgb(0_0_0/.08)] aria-pressed:bg-neutral-900 aria-pressed:text-white dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)] dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-900"
          >
            {w.label}
          </button>
        ))}
      </div>
      <p className="max-w-md text-center text-[12px] text-neutral-400">
        Type / or @, open the + and model menus, attach a file, then send. Replies are simulated until you pass onSend.
      </p>
    </div>
  )
}

export const notes = [
  "The text field is a real `<textarea>` with transparent text, laid over a `div` mirror that renders the same string with `<mark>` tokens. Both share font, padding and wrapping, so the tokens line up under the caret while spellcheck, undo and IME keep working.",
  "The mirror sits in normal flow and gives the field its height, so autosizing needs no measuring. The textarea is `position: absolute; inset: 0` and the mirror is nudged with `translateY(-scrollTop)` once the field hits its 8 line cap.",
  "Tokens are atomic by code, not by the DOM: a regex built from the known commands and mentions finds their ranges, and Backspace, Delete and the arrow keys check whether the caret touches one before acting.",
  "The reply is revealed by a `requestAnimationFrame` clock that takes 3 whole words every 34 ms. Each chunk is its own span with a 160 ms opacity fade, older chunks merge into one string, and the send button's ring is moved by writing `stroke-dashoffset` on the SVG circle directly, with no React render per frame.",
  "Layout adapts with container queries (`container-type: inline-size`): tool chips fold into icon buttons below 680px, and the composer glides from centre to bottom with a FLIP animation: measure the dock before the state change, again after, then `element.animate()` the difference.",
]
