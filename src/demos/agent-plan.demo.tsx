import * as React from "react"

import { AgentPlan, type PlanStatus, type PlanStep } from "@/components/ui/agent-plan"

const CHURN_PLAN: PlanStep[] = [
  { id: "pull", title: "Pull last week's cancellations", detail: "Plan, tenure and reason codes", tool: "warehouse.query" },
  { id: "notes", title: "Read the exit-survey answers", detail: "Free-text replies from 61 accounts", tool: "survey.fetch" },
  { id: "group", title: "Group churn by cause", detail: "Price, missing feature, support", tool: "analysis.cluster" },
  { id: "chart", title: "Build the churn charts", detail: "Four charts in the review template", tool: "slides.create" },
  { id: "mail", title: "Draft the note to Priya", tool: "mail.draft" },
]

const SUPPORT_PLAN: PlanStep[] = [
  { id: "read", title: "Read the customer's ticket history", detail: "Last 90 days", tool: "desk.history" },
  { id: "policy", title: "Check the refund policy", detail: "Annual plans, pro-rata rules", tool: "kb.search" },
  { id: "refund", title: "Issue the pro-rata refund", detail: "$128.40 to the card on file", tool: "billing.refund" },
  { id: "reply", title: "Write the reply and close the ticket", tool: "desk.reply" },
]

const LABEL = "text-xs font-medium text-neutral-500 dark:text-neutral-400"

/** Controlled mode: the parent owns the steps and status and feeds them from agent events. */
function Controlled() {
  const [steps, setSteps] = React.useState<PlanStep[]>(SUPPORT_PLAN)
  const [status, setStatus] = React.useState<PlanStatus>("draft")
  const timers = React.useRef<number[]>([])
  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  // Pretend these are events arriving from an agent runtime.
  const play = (from: number, list: PlanStep[]) => {
    list.forEach((s, i) => {
      if (i < from) return
      const t0 = (i - from) * 1500
      timers.current.push(
        window.setTimeout(() => setSteps((cur) => cur.map((x) => (x.id === s.id ? { ...x, status: "active" } : x))), t0),
        window.setTimeout(() => {
          if (s.id === "refund" && !list.some((x) => x.error)) {
            timers.current.forEach((t) => window.clearTimeout(t)) // the run stops here
            timers.current = []
            setSteps((cur) => cur.map((x) => (x.id === s.id ? { ...x, status: "failed", error: "Card network declined the refund." } : x)))
            return
          }
          setSteps((cur) => cur.map((x) => (x.id === s.id ? { ...x, status: "done" } : x)))
          if (i === list.length - 1) setStatus("done")
        }, t0 + 1300),
      )
    })
  }

  return (
    <AgentPlan
      title="Refund an annual plan"
      estimate="~1 min"
      steps={steps}
      status={status}
      onChange={setSteps}
      onCancel={() => setSteps(SUPPORT_PLAN)}
      onRun={(final) => {
        setStatus("running")
        const fresh = final.map((s, i) => ({ ...s, status: i === 0 ? ("active" as const) : ("pending" as const), error: undefined }))
        setSteps(fresh)
        play(0, fresh.map((s) => ({ ...s, error: undefined })))
      }}
      onRetry={(id) => {
        const at = steps.findIndex((s) => s.id === id)
        const reset = steps.map((s, i) => (i < at ? s : { ...s, status: i === at ? ("active" as const) : ("pending" as const), error: undefined }))
        setSteps(reset)
        play(at, reset.map((s) => ({ ...s, error: s.id === "refund" ? "seen" : undefined })))
      }}
    />
  )
}

export default function Demo() {
  const [fail, setFail] = React.useState(false)
  const [key, setKey] = React.useState(0)
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full max-w-[440px] flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={LABEL}>Built-in run</span>
          <label className={`${LABEL} flex cursor-pointer items-center gap-1.5`}>
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => {
                setFail(e.target.checked)
                setKey((k) => k + 1)
              }}
            />
            Make step 3 fail once
          </label>
        </div>
        <AgentPlan
          key={key}
          title="Review last week's churn"
          estimate="~2 min"
          defaultSteps={CHURN_PLAN}
          simulateFail={fail ? "group" : undefined}
          onCancel={() => setKey((k) => k + 1)}
        />
      </div>

      <div className="flex w-full max-w-[440px] flex-col gap-3">
        <span className={LABEL}>Driven by your own events (controlled)</span>
        <Controlled />
      </div>
    </div>
  )
}

export const notes: string[] = [
  "Reordering uses FLIP: before the list changes we remember each row's top (getBoundingClientRect), after React re-renders in a layout effect we measure again, and animate the difference with element.animate() from the old offset to none – so rows glide instead of jumping, for drags, Alt+arrow moves and prop changes alike.",
  "The drag is plain pointer events: the grip captures the pointer (setPointerCapture), the dragged row follows with translateY, and the others are shifted by the dragged row's height depending on which midpoint it has crossed. Nothing is reordered until release.",
  "Removing a row animates its height from the measured pixel value to 0 (CSS can't transition to height: auto) and only then drops it from the data, so the gap closes without a jump. Adding fades a new row up.",
  "The progress line is a 1px absolutely positioned rail with a blue ::after that scales from scaleY(0) to 1 when its step is done; the check draws itself with pathLength=1 and stroke-dashoffset, and the ray spinner is eight lines with staggered negative animation-delays.",
  "Per-step timers come from one 100ms interval that records when each step turned active and when it finished, so a controlled plan only has to say which step is active. The 'Add step' row folds away with a grid-template-rows 1fr → 0fr transition.",
]
