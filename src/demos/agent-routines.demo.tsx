import * as React from "react"

import { AgentRoutines, type Routine, type RoutineRunResult } from "@/components/blocks/agent-routines"

/* Controlled example: a fixed clock, your own routines, and an onRun that answers from a pretend backend. */
const NOW = new Date(2026, 9, 21, 8, 20, 0).getTime()
const day = 86_400_000

const MINE: Routine[] = [
  {
    id: "backlog-sweep",
    name: "Backlog sweep",
    instruction: "Find issues untouched for 60 days, group them by owner and post a list asking each owner to close or revive theirs.",
    schedule: { frequency: "weekly", time: "10:00", day: 1 },
    sources: ["issues"],
    destination: "#eng",
    model: "sage-mini",
    enabled: true,
    accent: 2,
    steps: ["Reading issues", "Grouping by owner", "Posting to #eng"],
    history: [
      { id: "b1", status: "success", at: NOW - 15 * day, durationMs: 33_000, summary: "Found 14 stale issues" },
      { id: "b2", status: "skipped", at: NOW - 8 * day, durationMs: 12_000, summary: "Nothing stale this week" },
      { id: "b3", status: "success", at: NOW - 1 * day, durationMs: 36_000, summary: "Found 9 stale issues" },
    ],
    report: "Stale issues, week 43\n- ENG-1980 Export fails for empty workspaces. 74 days, owner Lena.\n- ENG-1922 Dark mode flashes on reload. 91 days, owner Omar.\n9 issues untouched for 60 days across 4 owners.",
  },
  {
    id: "release-notes",
    name: "Release notes draft",
    instruction: "Turn the merged pull requests since the last tag into a changelog draft and send it to me.",
    schedule: { frequency: "daily", time: "17:30" },
    sources: ["code", "notes"],
    destination: "Direct message",
    model: "nova-large",
    enabled: false,
    history: [],
  },
]

export default function Demo() {
  const [log, setLog] = React.useState("Open a row and press Run now to call onRun.")
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <AgentRoutines />
      <div className="flex w-full max-w-[680px] flex-col gap-3">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Your own routines, a fixed clock and a pretend backend</span>
        <AgentRoutines
          title="Team routines"
          routines={MINE}
          now={NOW}
          defaultOpenId="backlog-sweep"
          onRun={async (routine): Promise<RoutineRunResult> => {
            setLog(`onRun: ${routine.name}`)
            await new Promise((r) => setTimeout(r, 4200))
            return {
              run: { id: `run-${Date.now()}`, status: "success", at: NOW, durationMs: 41_000, summary: "Found 11 stale issues" },
              report: "Stale issues, week 44\n- ENG-2001 Webhook retries stop after one failure. 62 days, owner Priya.\n11 issues untouched for 60 days across 5 owners.",
            }
          }}
          onToggle={(id, enabled) => setLog(`onToggle: ${id} -> ${enabled}`)}
          onSave={(routine, meta) => setLog(`onSave: ${routine.name}${meta.created ? " (created)" : ""}`)}
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "Schedules are four plain shapes (hourly, daily, weekdays, weekly) and everything else is derived: the sentence, the next run (a small loop that walks forward day by day until the weekday rule matches) and the countdown, all from one `now` value ticked by a single one second setInterval.",
  "A row opens with `grid-template-rows: 0fr` to `1fr`, which lets CSS animate to an automatic height; the details only stay mounted while open or closing, and `inert` takes closed content out of the tab order.",
  "The 14 run ticks are one tab stop: only the current tick has `tabindex=0` (a roving tabindex) and the arrow keys move focus between them, so a list of routines does not add 14 stops per row. Each tick has a full text label and a small tooltip tied with `aria-describedby`.",
  "Run now fills a 2px line under the row by transitioning `width` from step to step; the Running label and the active step reuse one clipped-gradient shimmer. A run is cancellable: an AbortController and the step timer are cleared when you press Stop or unmount.",
  "New routine reads a typed sentence with a few regular expressions into editable chips (schedule, sources, destination). It is a local stand-in for a model call: in production you would send the sentence to a model and keep the chips as the confirmation step before saving.",
]
