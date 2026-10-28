import * as React from "react"
import { BellRing, Check, FileText, ListChecks, StickyNote } from "lucide-react"

import { ActionMorph, type ActionMorphAction, type ActionMorphSubmission } from "@/components/ui/action-morph"

export const notes: string[] = [
  "One shape does all the work: a rounded rectangle whose `width`, `height` and `border-radius` are driven by three springs in a single requestAnimationFrame loop. Opening uses a bouncy spring (damping ratio 0.72), folding a critically damped one (1.0) so it settles without overshoot.",
  "Each face (menu, composer) is measured with a `ResizeObserver` while it is current, and the shape's spring targets are that natural size – so a longer error message or a different composer simply retargets the same springs.",
  "Going deeper slides the new face in from the right while the old one leaves to the left; the leaving face stays mounted for the length of its exit animation, then a timer drops it. Both use `opacity` + `translateX` + a short `blur()`.",
  "The highlight behind menu rows is one absolutely positioned element that `transform: translateY()` glides between items on hover and focus – it is moved from event handlers, not through React state.",
  "On success the shape folds back to the 56px circle, the background cross-fades to green with a CSS transition, and the check draws itself by animating `stroke-dashoffset` on a path with `stroke-dasharray` equal to its length.",
]

const ACTIONS: ActionMorphAction[] = [
  {
    id: "task",
    label: "New task",
    description: "Add to your list",
    icon: <ListChecks strokeWidth={1.75} />,
    shortcut: "t",
    composer: {
      title: "New task",
      placeholder: "What needs doing?",
      choices: { label: "Due", options: ["Today", "Tomorrow", "Next week"] },
      submitLabel: "Add task",
      successLabel: "Task added",
    },
  },
  {
    id: "note",
    label: "New note",
    description: "Private to you",
    icon: <StickyNote strokeWidth={1.75} />,
    shortcut: "n",
    composer: { title: "New note", placeholder: "Write a note", multiline: true, submitLabel: "Save note", successLabel: "Note saved" },
  },
  {
    id: "reminder",
    label: "Reminder",
    description: "Nudge me at a set time",
    icon: <BellRing strokeWidth={1.75} />,
    shortcut: "r",
    composer: {
      title: "Reminder",
      placeholder: "Remind me to…",
      choices: { label: "When", options: ["In 1 hour", "This evening", "Tomorrow"] },
      submitLabel: "Set reminder",
      successLabel: "Reminder set",
    },
  },
]

type Row = { id: string; text: string; when: string; done?: boolean; kind: "task" | "note" | "reminder" }

const START: Row[] = [
  { id: "r1", text: "Review the onboarding checklist", when: "Today", kind: "task" },
  { id: "r2", text: "Call Priya about the Q3 budget", when: "4:30 PM", kind: "reminder" },
  { id: "r3", text: "Send release notes to the team", when: "Tomorrow", kind: "task", done: true },
  { id: "r4", text: "Pricing page: lead with the free tier", when: "", kind: "note" },
]

export default function Demo() {
  const [rows, setRows] = React.useState<Row[]>(START)
  const [fails, setFails] = React.useState(false)
  const failsRef = React.useRef(fails)
  failsRef.current = fails

  const onSubmit = (s: ActionMorphSubmission) =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (failsRef.current) return reject(new Error("offline"))
        setRows((r) => [{ id: `n${Date.now()}`, text: s.text, when: s.choice ?? "", kind: s.action.id as Row["kind"] }, ...r])
        resolve()
      }, 750)
    })

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
      <div className="relative h-[460px] w-full overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_1px_rgb(255_255_255/.1)]">
        <div className="flex items-baseline justify-between px-6 pt-6">
          <h3 className="text-[24px] font-medium tracking-tight text-neutral-900 dark:text-white">Today</h3>
          <span className="text-[13px] text-neutral-400">{rows.filter((r) => !r.done).length} open</span>
        </div>
        <ul className="mt-3 px-3">
          {rows.slice(0, 6).map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px]">
              <span
                className={
                  "grid size-5 flex-none place-items-center rounded-full " +
                  (r.done ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "border border-neutral-300 text-neutral-400 dark:border-neutral-600")
                }
              >
                {r.done ? <Check className="size-3" strokeWidth={3} /> : r.kind === "note" ? <FileText className="size-3" /> : r.kind === "reminder" ? <BellRing className="size-3" /> : null}
              </span>
              <span className={"flex-1 truncate " + (r.done ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-neutral-100")}>{r.text}</span>
              <span className="text-[12px] text-neutral-400">{r.when}</span>
            </li>
          ))}
        </ul>
        <ActionMorph actions={ACTIONS} onSubmit={onSubmit} className="absolute bottom-5 right-5" />
      </div>
      <div className="inline-flex rounded-full bg-neutral-100 p-1 text-[13px] dark:bg-neutral-800" role="radiogroup" aria-label="Simulated result">
        {[
          ["Saving works", false],
          ["Saving fails", true],
        ].map(([label, v]) => (
          <button
            key={String(label)}
            type="button"
            role="radio"
            aria-checked={fails === v}
            onClick={() => setFails(v as boolean)}
            className={"rounded-full px-3 py-1 " + (fails === v ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-500")}
          >
            {label as string}
          </button>
        ))}
      </div>
    </div>
  )
}
