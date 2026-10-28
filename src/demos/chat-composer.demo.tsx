import * as React from "react"

import { ChatComposer, type ChatModel } from "@/components/ui/chat-composer"

type LogItem = { id: number; text: string }

const MODELS: ChatModel[] = [
  { id: "auto", name: "Auto", description: "Picks the right model for each request" },
  { id: "deep", name: "Deep", description: "Slower, thorough answers for hard problems" },
  { id: "quick", name: "Quick", description: "Short replies in under a second" },
]

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [log, setLog] = React.useState<LogItem[]>([])
  const nextId = React.useRef(0)

  const push = (text: string) =>
    setLog((items) => [{ id: nextId.current++, text }, ...items].slice(0, 5))

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 py-6">
      <ChatComposer
        key={run}
        placeholder="Ask the support desk assistant..."
        models={MODELS}
        dictation="Summarize this week's support tickets and flag anything that mentions a refund."
        onSend={(message, { model }) => push(`Sent to ${model.name}: "${message}"`)}
        onModelChange={(model) => push(`Model changed to ${model.name}`)}
        onAttach={() => push("Attach clicked")}
        onConnectApps={() => push("Connecting apps")}
        onRequestApproval={() => push("Approval requested")}
        onSelectProject={() => push("Project picker opened")}
        onRecordingChange={(recording) => push(recording ? "Recording started" : "Recording stopped")}
      />

      <div className="flex items-start justify-between gap-4 text-[12px] leading-4 text-neutral-500 dark:text-neutral-400">
        <ul className="min-h-20 space-y-1.5" aria-label="Event log">
          {log.length === 0 ? (
            <li>Try the mic, the model picker, Connect apps or Request approval.</li>
          ) : (
            log.map((item) => <li key={item.id}>{item.text}</li>)
          )}
        </ul>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-[12px] font-medium text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          onClick={() => {
            setRun((n) => n + 1)
            setLog([])
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
