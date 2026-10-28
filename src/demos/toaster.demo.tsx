import * as React from "react"

import { toast, Toaster, type ToastPosition } from "@/components/ui/toaster"

export const notes: string[] = [
  "The toast store lives at module level (an array plus a Set of listeners), so `toast()` works from anywhere – no provider. The Toaster subscribes with React's `useSyncExternalStore`.",
  "Every toast is absolutely positioned at the same edge. The stack look comes from per-toast CSS variables (`--tst-ty`, `--tst-s`): collapsed, older toasts peek 14px apart and scale down; on hover they translate by the measured heights of the toasts in front. CSS transitions on `transform` do the motion.",
  "Heights come from a ResizeObserver on each toast's content, so the list can transition `height` between pixel values (CSS can't animate to `auto`).",
  "The entrance animates the separate `translate` property while the stack uses `transform`, so a new toast can slide in without fighting the stacking transform. Swipe-to-dismiss uses pointer capture and a distance/velocity check.",
  "Auto-close timers pause while the stack is hovered or focused and resume with the time that was left. `toast.promise` creates a loading toast and then updates the same id when the promise settles.",
]

const POSITIONS: ToastPosition[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]
const TOASTER = "cadence-demo"

const btn =
  "h-8 rounded-lg bg-black/5 px-3 text-[13px] font-medium text-neutral-800 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/15"

export default function Demo() {
  const [position, setPosition] = React.useState<ToastPosition>("bottom-right")
  const [expand, setExpand] = React.useState(false)

  // Seed a few toasts so the stack is visible on first load.
  React.useEffect(() => {
    const ids: number[] = []
    const o = { toasterId: TOASTER, duration: 60000 }
    ids.push(window.setTimeout(() => toast.success("Evaluation finished", { ...o, description: "212 of 220 test cases passed" }), 500))
    ids.push(window.setTimeout(() => toast("Draft saved to workspace", { ...o, description: "Support triage agent, v14" }), 900))
    ids.push(window.setTimeout(() => toast.info("New model available", { ...o, description: "Switch the agent to the faster tier." }), 1300))
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      toast.dismiss()
    }
  }, [])

  const run = (kind: string) => {
    const o = { toasterId: TOASTER }
    switch (kind) {
      case "default":
        toast("Draft saved to workspace", { ...o, description: "Support triage agent, v14" })
        break
      case "success":
        toast.success("Evaluation finished", { ...o, description: "212 of 220 test cases passed" })
        break
      case "error":
        toast.error("Tool call failed", { ...o, description: "search_docs timed out after 30s" })
        break
      case "action":
        toast.warning("Agent paused for review", {
          ...o,
          description: "It wants to email 48 customers.",
          duration: 8000,
          action: { label: "Review", onClick: () => toast.success("Opened the approval queue", { ...o, duration: 2500 }) },
        })
        break
      case "promise": {
        const job = new Promise<number>((resolve, reject) => {
          window.setTimeout(() => (Math.random() > 0.25 ? resolve(1840) : reject(new Error("quota"))), 2400)
        })
        toast.promise(
          job,
          {
            loading: "Indexing knowledge base",
            success: (n) => `Indexed ${n.toLocaleString()} documents`,
            error: "Indexing failed – rate limited",
          },
          { toasterId: TOASTER },
        )
        break
      }
      case "loading": {
        const id = toast.loading("Fine-tuning started", { ...o, description: "Queued behind 2 other jobs" })
        window.setTimeout(() => toast.update(id, { title: "Fine-tuning is running", description: "Estimated 6 minutes left" }), 2200)
        window.setTimeout(() => toast.update(id, { type: "success", title: "Fine-tune complete", description: "Model support-v3 is ready", duration: 4000 }), 4800)
        break
      }
    }
  }

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => run("default")}>
          Default
        </button>
        <button type="button" className={btn} onClick={() => run("success")}>
          Success
        </button>
        <button type="button" className={btn} onClick={() => run("error")}>
          Error
        </button>
        <button type="button" className={btn} onClick={() => run("action")}>
          With action
        </button>
        <button type="button" className={btn} onClick={() => run("promise")}>
          Promise
        </button>
        <button type="button" className={btn} onClick={() => run("loading")}>
          Loading
        </button>
        <button type="button" className={btn} onClick={() => toast.dismiss()}>
          Clear
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
        <select
          aria-label="Position"
          className="h-8 rounded-lg bg-black/5 px-2 text-[13px] dark:bg-white/10"
          value={position}
          onChange={(e) => setPosition(e.target.value as ToastPosition)}
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={expand} onChange={(e) => setExpand(e.target.checked)} />
          Always expanded
        </label>
        <span className="text-neutral-400">Hover the stack to expand it, drag a toast sideways to dismiss.</span>
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-xl bg-black/[.03] ring-1 ring-black/5 dark:bg-white/[.03] dark:ring-white/10">
        <Toaster id={TOASTER} inline position={position} expand={expand} closeButton />
      </div>
    </div>
  )
}
