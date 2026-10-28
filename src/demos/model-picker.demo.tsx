import * as React from "react"

import { ModelPicker, type ModelEffort, type PickerModel } from "@/components/ui/model-picker"

const MODELS: PickerModel[] = [
  { id: "nova-large", name: "Nova Large", description: "Hardest problems", icon: "L", speed: 2, quality: 5, cost: 5, latencyMs: 2400, pricePerM: 18 },
  { id: "nova", name: "Nova", description: "Everyday work", icon: "N", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 6 },
  { id: "nova-mini", name: "Nova Mini", description: "Quick and light", icon: "M", speed: 5, quality: 2, cost: 1, latencyMs: 400, pricePerM: 1 },
  {
    id: "auto",
    name: "Auto",
    description: "Picks per message",
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d="M8 1.5c.4 3.3 1.2 4.9 3 5.5-1.8.6-2.6 2.2-3 5.5-.4-3.3-1.2-4.9-3-5.5 1.8-.6 2.6-2.2 3-5.5Z" fill="currentColor" />
      </svg>
    ),
  },
]

export default function Demo() {
  const [model, setModel] = React.useState("nova")
  const [thinking, setThinking] = React.useState(false)
  const [effort, setEffort] = React.useState<ModelEffort>("medium")
  const [search, setSearch] = React.useState(false)
  const [sent, setSent] = React.useState<string | null>(null)

  const name = MODELS.find((m) => m.id === model)?.name

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <div className="min-h-[300px]">
        <div className="rounded-xl bg-white p-3 shadow-[0_0_0_.5px_rgb(0_0_0/.08),0_1px_2px_rgb(0_0_0/.06)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
          <textarea
            rows={2}
            placeholder="Ask about this week's support queue…"
            className="w-full resize-none bg-transparent px-1 text-[13px] leading-5 outline-none placeholder:opacity-45"
          />
          <div className="mt-1 flex items-center justify-between">
            <ModelPicker
              models={MODELS}
              value={model}
              onChange={setModel}
              thinking={thinking}
              onThinkingChange={setThinking}
              effort={effort}
              onEffortChange={setEffort}
              webSearch={search}
              onWebSearchChange={setSearch}
              side="bottom"
            />
            <button
              type="button"
              aria-label="Send"
              onClick={() => setSent(`Sent to ${name}${thinking ? ` with ${effort} effort` : ""}${search ? ", web search on" : ""}.`)}
              className="grid h-7 w-8 place-items-center rounded-md bg-black text-white dark:bg-white dark:text-black"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
                <path d="M8 13V3M8 3 4 7M8 3l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs opacity-60" aria-live="polite">
          {sent ?? "Open the menu, point at a model, then try the switches. Keys: ↑ ↓ Home End Enter Esc."}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium">Opens upward, aligned to the end</h3>
          <p className="text-xs opacity-60">Uncontrolled, side top, align end.</p>
        </div>
        <div className="flex justify-end pt-[260px]">
          <ModelPicker models={MODELS} side="top" align="end" defaultThinking defaultEffort="high" />
        </div>
      </section>
    </div>
  )
}
