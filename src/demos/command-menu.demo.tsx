import * as React from "react"

import { CommandMenu } from "@/components/ui/command-menu"

export const notes = [
  "The input has role=combobox and the rows are role=option inside a role=listbox. DOM focus stays in the input the whole time; the highlighted row is exposed with aria-activedescendant, so a screen reader follows the highlight without focus ever moving.",
  "The light-gray highlight is one absolutely positioned span. A layout effect reads the active row's offsetTop and offsetHeight and writes translateY and height onto it; CSS transitions both in 90ms, which is why it slides between rows. Mouse-leave sets a data-out attribute that fades it out.",
  "Tab is intercepted with preventDefault and re-purposed: the list of group ids is de-duplicated in order and the active row jumps to the first item of the next or previous group (Shift reverses it), wrapping around.",
  "Results filter by lower-casing the query and testing label, hint and keywords; groups that end up empty are dropped, and a fallback 'Ask assistant' row is appended whenever something is typed, so a search is never a dead end.",
  "The footer swaps to a 'ran' row with a keyed element, so React remounts it and the CSS entrance plays again on every run; a container query (not a media query) hides shortcut keys when the menu itself is narrow.",
]

export default function Demo() {
  const [last, setLast] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-[600px] flex-col gap-3">
      <CommandMenu onRun={(id, query) => setLast(query ? `${id}: “${query}”` : id)} />
      <p className="text-center text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {last ? (
          <>
            Last command: <span className="font-medium text-neutral-700 dark:text-neutral-200">{last}</span>
          </>
        ) : (
          "Try ↑ ↓, Tab, Enter, or ⌘1–⌘5. Type something no command matches to ask the assistant."
        )}
      </p>
    </div>
  )
}
