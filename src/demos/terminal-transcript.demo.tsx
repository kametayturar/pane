import * as React from "react"

import { TerminalTranscript } from "@/components/ui/terminal-transcript"

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [log, setLog] = React.useState("Hover a command to copy it or run it again")

  return (
    <div className="mx-auto flex w-full flex-col gap-3" style={{ maxWidth: 600 }}>
      {/* Atlas's session plays as if live: install, a failing test run, the fix, the passing rerun */}
      <TerminalTranscript
        key={run}
        streaming
        maxHeight={420}
        onCopy={(b, text) => setLog(`Copied ${b.command} and ${text.split("\n").length - 1} lines of output`)}
        onRerun={(b) => setLog(`Running ${b.command} again`)}
      />
      <div className="flex items-center gap-3 px-1 text-[13px] text-neutral-600 dark:text-neutral-400">
        <button
          type="button"
          onClick={() => {
            setRun((n) => n + 1)
            setLog("Hover a command to copy it or run it again")
          }}
          className="rounded-md px-2 py-1 text-neutral-800 underline-offset-2 hover:text-neutral-950 hover:underline dark:text-neutral-200 dark:hover:text-white"
        >
          Replay
        </button>
        <span aria-live="polite" className="min-w-0 truncate">
          {log}
        </span>
      </div>
    </div>
  )
}

export const notes = [
  "Each command is an `<article>` in a `role=\"feed\"`, not characters typed into a fake window. Its ending is written as words in the same row (done in 8.4 s, failed, exit 1, running 1.2 s); a running clock starts from the data's elapsed time and keeps counting locally until the data moves it on. A failure is the only colour: its ending and a short rule down the block's edge.",
  "Standard error is set apart in type rather than tinted red: stronger ink and a hairline rule down its left edge, so a run of stderr lines reads as one quoted passage. Warnings are underlined in faint ink and errors set in medium weight. Only the output scrolls sideways (`white-space: pre` inside an `overflow-x: auto` box), so the page never does at 360px.",
  "A finished command with more lines than `foldAt` folds into one counted sentence, 48 lines, 2 warnings, and its warning and error lines stay on screen while folded because they keep their keys and never unmount. The fold glides between the two measured heights with one Web Animations call; reduced motion swaps instantly.",
  "The transcript follows the bottom while the reader is there. A scroll handler keeps a stick flag; after each render a layout effect either pins `scrollTop` to the end or adds the new lines to a quiet 3 new lines button, which scrolls back and starts following again.",
  "Keyboard: one command is in the Tab order (roving tabindex); arrows, Page Up/Down, Home and End move between commands; Enter folds, C copies, R runs again, Escape goes back from an action to its command. Starts and endings are announced in a polite live region. The `streaming` mode plays any `blocks` over time on one interval that pauses off screen; reduced motion shows the finished session.",
]
