import * as React from "react"

import { PromptStudio } from "@/components/blocks/prompt-studio"

const WIDTHS = [
  { label: "Full", value: "100%" },
  { label: "480", value: "480px" },
  { label: "340", value: "340px" },
] as const

export default function Demo() {
  const [width, setWidth] = React.useState<(typeof WIDTHS)[number]["value"]>("100%")
  const [log, setLog] = React.useState("Open the version menu and promote an older version.")

  return (
    <div className="flex w-full flex-col items-center gap-5 py-6">
      <div className="w-full transition-[max-width] duration-300" style={{ maxWidth: width }}>
        <PromptStudio onPromote={(id, prev) => setLog(`onPromote("${id}", ${prev ? `"${prev}"` : "null"})`)} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
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
      <p className="text-center text-[12px] text-neutral-400" aria-live="polite">{log}</p>
      <p className="max-w-md text-center text-[12px] text-neutral-400">
        Type "{"{{"}" in the editor to add a variable, edit a value to flash its chips, press Cmd Enter to run, and compare any version from the version menu. The first run of Past window fails once to show Retry.
      </p>
    </div>
  )
}

export const notes = [
  "The editor is a plain `contenteditable` where the string is the source of truth. A `beforeinput` handler cancels every native edit, applies it to the string (insert, delete, paste, cut, undo) and a layout effect rebuilds the DOM from it. Variable chips are `contenteditable=false` spans, so they can never be split, and Backspace removes one whole.",
  "Because the DOM is rebuilt, the caret is stored as a string offset. Two small functions map between a DOM position and that offset (text nodes count their length, a chip counts `{{name}}`), so the caret survives each rebuild.",
  "Each variable gets a colour slot (`data-t`) that selects one of four CSS variables; chips, field labels and dots derive their fill, ring and text from `color-mix()` on that one colour, which keeps light and dark themes consistent.",
  "Compare mode runs a word-level diff (trim shared start and end, then LCS) between the chosen version and the draft, rendered with real `<ins>` and `<del>` elements plus a visible + or minus sign so it never relies on colour alone.",
  "Promoting a version animates the Production marker with FLIP: read the old marker's rectangle, change state, read the new rectangle in a layout effect, then play `element.animate()` from the difference back to zero. The output panel height follows its content through a ResizeObserver and a CSS height transition.",
]
