import * as React from "react"

import { MemoryPanel, type Memory } from "@/components/ui/memory-panel"

const SAMPLE: Memory[] = [
  { id: "p1", category: "Preferences", text: "Wants answers in bullet points first, details after", source: "From chat", date: "Oct 2", paused: true },
  { id: "p2", category: "Preferences", text: "Prefers short replies on mobile and longer ones on desktop", source: "You added", date: "Oct 9" },
  { id: "w1", category: "Work", text: "Runs growth at a 20-person fintech startup", source: "From chat", date: "Sep 28" },
  { id: "w2", category: "Work", text: "Reports to the COO and presents a metrics review every Monday", source: "From Notion", date: "Oct 3" },
  { id: "j1", category: "Projects", text: "Migrating the billing service to Postgres before the end of Q4", source: "From chat", date: "Oct 12" },
  { id: "j2", category: "Projects", text: "Drafting a referral program with a two-sided reward", source: "You added", date: "Oct 15" },
  { id: "j3", category: "Projects", text: "Evaluating three vendors for transactional email", source: "From Notion", date: "Oct 18" },
]

export default function Demo() {
  const [memories, setMemories] = React.useState<Memory[]>(SAMPLE)
  const [enabled, setEnabled] = React.useState(true)
  const [log, setLog] = React.useState("Edit, pause or forget a memory to see the callbacks.")

  return (
    <div className="flex flex-col items-center gap-5">
      <MemoryPanel
        memories={memories}
        onChange={setMemories}
        enabled={enabled}
        onEnabledChange={(v) => {
          setEnabled(v)
          setLog(`onEnabledChange(${v})`)
        }}
        categories={["Preferences", "Work", "Projects"]}
        onAdd={(m) => setLog(`onAdd("${m.text}", ${m.category})`)}
        onEdit={(id) => setLog(`onEdit("${id}")`)}
        onPause={(id, paused) => setLog(`onPause("${id}", ${paused})`)}
        onForget={(id) => setLog(`onForget("${id}") – Undo for 5s`)}
        onRestore={(m) => setLog(`onRestore("${m.id}")`)}
        action={{ label: "Export", onClick: () => setLog("action.onClick()") }}
      />

      <p className="max-w-[400px] text-center font-mono text-xs text-neutral-500" aria-live="polite">
        {log}
      </p>

      <button
        type="button"
        className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
        onClick={() => {
          setMemories(SAMPLE)
          setEnabled(true)
          setLog("Reset to the sample memories.")
        }}
      >
        Reset sample
      </button>
    </div>
  )
}
