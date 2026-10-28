import * as React from "react"

import { AgentPebble, type PebbleDock, type PebbleEdge, type PebbleState } from "@/components/ui/agent-pebble"

export const notes = [
  "One glass element is every state. Its width, height and border-radius are CSS variables written from a single layout function, and CSS transitions them on one easing curve; the content inside has a fixed width and is clipped by the growing glass, so text is revealed rather than scaled.",
  "True refraction is `backdrop-filter: url(#id)` pointing at an inline SVG filter: an feImage holds a displacement map and feDisplacementMap bends the pixels behind the glass. The map is drawn on a canvas from a rounded-rectangle distance field, with vectors pointing inward and strongest at the rim, so the middle stays flat and readable.",
  "The map has to match the glass size, so it is rebuilt when a state changes the pebble's size. The displacement `scale` fades to zero, the new map loads, and `scale` eases back up, so the lens never jumps. Only Chromium gets this; Safari and Firefox get blur, saturation and a rim light, and reduced-transparency users get an opaque pebble.",
  "Dragging writes `--ipb-x` and `--ipb-y` to the element's style on every pointermove, so no React render happens mid-drag. On release the nearest edge wins and the same CSS transition that morphs the size slides it home. Arrow keys call the same dock function, so the keyboard does exactly what the pointer does.",
  "The built-in loop is a chain of timeouts keyed on the current state, so it pauses itself while the pebble is off screen, in a hidden tab, hovered or focused while open. Under reduced motion it stops on the 'needs you' card, the one frame that shows the consequence line and both buttons; approving there still carries on to 'done', because only the loop's own restarts are switched off.",
  "The 7 second approval timeout is demo-only: a real agent waits for the person. The loop answers for them so a recording can reach the 'done' frame. In your product, leave `state` controlled and drive it from the run.",
  "Buttons that close the panel hand focus back to the pebble's head first, so a keyboard user never lands on the page body. Needs-you is announced once, with the question and its consequence; step changes are not read out.",
]

const MODES = ["Auto", "Idle", "Working", "Needs you", "Paused", "Done"] as const
type Mode = (typeof MODES)[number]
const STATE_OF: Record<Exclude<Mode, "Auto">, PebbleState> = { Idle: "idle", Working: "working", "Needs you": "needs-you", Paused: "paused", Done: "done" }
const EDGES: PebbleEdge[] = ["left", "top", "right", "bottom"]
const SAY: Record<PebbleState, string> = {
  idle: "Sage is idle",
  working: "Sage is drafting the Q3 summary",
  "needs-you": "Sage is waiting for your approval",
  paused: "Sage is paused. Nothing sends until you resume",
  done: "Summary queued for 09:00 tomorrow",
}

export default function Demo() {
  const [mode, setMode] = React.useState<Mode>("Auto")
  const [state, setState] = React.useState<PebbleState>("working")
  // On a narrow stage the pebble rests low, over the chart, so it never covers the headline.
  const [dock, setDock] = React.useState<PebbleDock>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? { edge: "bottom", at: 0.5 } : { edge: "right", at: 0.08 },
  )
  const [refraction, setRefraction] = React.useState(true)
  const [log, setLog] = React.useState(SAY.idle)

  const manual = mode !== "Auto"
  const stepOf = (s: PebbleState) => (s === "working" || s === "paused" ? 2 : 4)
  const go = (m: Mode, s: PebbleState, say = SAY[s]) => {
    setMode(m)
    setState(s)
    setLog(say)
  }
  const pick = (m: Mode) => {
    if (m === "Auto") {
      setMode(m)
      setLog("Auto: Sage runs its own loop")
    } else go(m, STATE_OF[m])
  }

  return (
    <div className="flex w-full max-w-[1100px] flex-col gap-3">
      <AgentPebble
        height={598}
        refraction={refraction}
        dock={dock}
        onDockChange={setDock}
        {...(manual
          ? {
              state,
              step: stepOf(state),
              onApprove: () => go("Done", "done", "Approved. Sends to 14 investors at 09:00 tomorrow"),
              onPause: () => go("Paused", "paused", `Paused at step ${stepOf(state) + 1} of 5`),
              onResume: () => go("Working", "working", "Resumed"),
              onStart: () => go("Working", "working", "Sage started a new run"),
              onDismiss: () => go("Idle", "idle"),
            }
          : {
              onApprove: () => setLog("Approved. Sends to 14 investors at 09:00 tomorrow"),
              onPause: () => setLog("Paused. Nothing sends until you resume"),
              onStateChange: (s: PebbleState) => setLog(SAY[s]),
            })}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-neutral-600 dark:text-neutral-400">
        <div role="group" aria-label="Pebble state" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => pick(m)}
              className={`h-7 shrink-0 whitespace-nowrap rounded-full px-3 font-medium transition-colors ${mode === m ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Dock to an edge" className="flex items-center gap-1">
          <span className="mr-1">Dock</span>
          {EDGES.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={dock.edge === e}
              onClick={() => setDock({ edge: e, at: e === "right" ? 0.08 : e === "bottom" ? 0.5 : 0.2 })}
              className={`h-7 rounded-full px-3 capitalize transition-colors ${dock.edge === e ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800"}`}
            >
              {e}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={refraction} onChange={(e) => setRefraction(e.target.checked)} />
          Refraction
        </label>
        <span aria-live="polite" className="w-full text-neutral-500 sm:ml-auto sm:w-auto">
          {log}
        </span>
      </div>
    </div>
  )
}
