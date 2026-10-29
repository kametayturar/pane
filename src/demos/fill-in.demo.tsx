import * as React from "react"

import { FillIn, type FillInOption } from "@/components/ui/fill-in"

export const notes = [
  "The slot is a real inline-block inside the paragraph, sized to the widest answer, and the answers are real buttons set in the sentence's own size and weight, positioned one line under it. The widths are measured once the fonts are in and re-measured when the card is resized, so nothing reflows when you choose.",
  "The answer you tap is never copied. Its final translate onto the slot is computed from two bounding rects and written first; then a Web Animations call plays it from zero to there on a spring (a damped spring sampled into a CSS linear() ramp, so it overshoots a little and settles), while a pulse on its ::after layer raises and lowers a large soft shadow and a small scale bump lifts it.",
  "As the answer lands, the slot's width animates to the answer's width, the other answers blur away, and the tail of the sentence is revealed word by word with a CSS stagger. The zone's height then transitions from the options' height to the sentence's height, so the card closes up around the finished text.",
  "The status and footer lines crossfade in place through a small blur: the old string stays one extra beat as an aria-hidden layer while the new one animates in. A separate visually hidden status region announces what happened, and it is turned off while the built-in loop is playing.",
  "The loop is a chain of timeouts keyed to the current stage. It stops on the first pointer or key event, pauses while the card is off screen or the tab is hidden (IntersectionObserver and visibilitychange), and with reduced motion the card rests on the open slot with the answers showing.",
]

const SHIPPING: FillInOption[] = [
  { id: "air", label: "by air on Thursday", note: "Adds €18.00 to the order" },
  { id: "road", label: "by road on Monday", note: "No extra charge" },
  { id: "pickup", label: "for pickup at the depot", note: "Ready from 09:00 tomorrow" },
]

/* Tallest height of the looping card per width, so the card below never moves while the loop plays. */
const HOLD = `
.fid-wrap { container-type: inline-size }
.fid-hold { min-height: 264px }
@container (max-width: 440px) { .fid-hold { min-height: 318px } html[data-style="mono"] .fid-hold { min-height: 338px } }
`

export default function Demo() {
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState("Waiting for an answer")
  const [loop, setLoop] = React.useState(0)

  return (
    <div className="mx-auto flex w-full flex-col gap-8" style={{ maxWidth: 520 }}>
      {/* 1 · Built in: plays the decisive moment and loops until you touch it. The height is held for the tallest state so the card below never moves. */}
      <style href="fill-in-demo" precedence="default">{HOLD}</style>
      <div className="fid-wrap flex flex-col items-start gap-3">
        <div className="fid-hold w-full">
          <FillIn key={loop} />
        </div>
        <button
          type="button"
          onClick={() => setLoop((n) => n + 1)}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-white"
        >
          Replay
        </button>
      </div>

      {/* 2 · Your own sentence, three answers, controlled */}
      <div className="flex flex-col items-start gap-3">
        <FillIn
          agent="Sage"
          context="Order #3318 update"
          before="Your order is packed. We can send it"
          after="and you will get a tracking link as soon as it leaves."
          question="How should the order ship?"
          options={SHIPPING}
          value={value}
          onPick={(o) => {
            setValue(o.id ?? o.label)
            setLog(`Picked: ${o.label}`)
          }}
          foot={{ asking: "Pick one; Sage fills in the rest", writing: "Checking carrier options", done: "Nothing sends until you approve it" }}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          <span aria-live="polite">{log}</span>
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue(null)
                setLog("Waiting for an answer")
              }}
              className="rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-900 hover:underline dark:hover:text-white"
            >
              Ask again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
