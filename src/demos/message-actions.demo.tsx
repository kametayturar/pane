import * as React from "react"

import { MessageActions, MessageText } from "@/components/ui/message-actions"

const POOL = [
  "Failed webhooks are retried up to five times with exponential backoff, starting at 30 seconds and doubling each time, and are then parked in the dead-letter queue for you to replay.",
  "Relay retries a failed delivery five times, waiting 30 s, 1 m, 2 m, 4 m and 8 m, before it moves the event to the dead-letter queue.",
  "Each delivery gets five attempts with growing pauses between them. After that the event waits in the dead-letter queue until someone replays it from the dashboard – nothing is dropped.",
]

export default function Demo() {
  const [versions, setVersions] = React.useState<string[]>([POOL[0]])
  const [version, setVersion] = React.useState(0)
  const [writing, setWriting] = React.useState(false)
  const [log, setLog] = React.useState("No feedback yet")
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const regenerate = () => {
    if (writing) return
    setWriting(true)
    timer.current = window.setTimeout(() => {
      const next = POOL[versions.length % POOL.length]
      setVersions((v) => [...v, next])
      setVersion(versions.length) // jump to the new one
      setWriting(false)
    }, 1300)
  }

  const text = versions[version]

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      {/* data-ui-message lights the quiet bar up while the whole message is hovered */}
      <div
        data-ui-message
        className="overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_1px_-1px_rgb(0_0_0/.1),0_1px_2px_0_rgb(0_0_0/.05)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1),0_1px_2px_0_rgb(0_0_0/.4)]"
      >
        <div className="px-4 pb-3.5 pt-4 text-[13px] leading-5 text-neutral-900 dark:text-neutral-100">
          <p className="ml-auto mb-4 w-fit max-w-[85%] rounded-lg bg-black/[.03] px-2.5 py-1.5 shadow-[inset_0_0_0_.5px_rgb(0_0_0/.06)] dark:bg-white/[.06]">
            How does Relay retry failed webhooks?
          </p>
          <div className="mb-1.5 flex items-center gap-1.5 text-[12px] leading-4 text-neutral-500 dark:text-neutral-400">
            <span className="size-2 rounded-[2px] bg-indigo-500" aria-hidden />
            Orbit 2
          </div>
          <MessageText version={version}>{text}</MessageText>
        </div>
        <div className="p-2">
          <MessageActions
            text={text}
            versions={versions}
            version={version}
            onVersionChange={setVersion}
            regenerating={writing}
            onRegenerate={regenerate}
            onFeedback={(kind, reason) => setLog(kind === null ? "Vote taken back" : reason ? `Down vote – ${reason}` : `Vote: ${kind}`)}
          />
        </div>
      </div>
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        onFeedback → {log}
      </p>
    </div>
  )
}

export const notes = [
  "The version switcher unfolds sideways with `grid-template-columns: 0fr → 1fr`. The clip inside has `overflow: hidden` and `min-width: 0`, so the track really collapses to nothing – no measuring, no JS animation.",
  "Copy, Read aloud and the thumbs all use icon morphs: two SVGs sit in the same grid cell and the inactive one fades to `opacity: 0; scale(.6); blur(2px)`. Flipping a `data-on` attribute is all the code does, CSS runs the transition.",
  "'Quiet' is pure CSS: the bar rests at 60% opacity and a `:where([data-ui-message]:hover) .ma-bar` selector lights it up when any ancestor marked with that attribute is hovered. `:where()` keeps the specificity low so you can override it.",
  "Each version keeps its own vote in a `Record<number, 'up' | 'down'>`. Switching versions simply reads a different key, so the thumbs reset for a new answer without extra effect code.",
  "MessageText keeps a snapshot of the previous children while the version changes, fades that copy out as an absolutely positioned layer, and eases the wrapper height from a `ResizeObserver` measurement – the crossfade never makes the card jump.",
]
