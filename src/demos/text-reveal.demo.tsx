import * as React from "react"

import { TextReveal } from "@/components/motion/text-reveal"
import type { StudioProps } from "@/components/motion/backdrop"

const btn =
  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors shadow-[0_0_0_.5px_rgb(0_0_0/.15)] hover:bg-black/5 " +
  "dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)] dark:hover:bg-white/10"

export default function Demo(props: StudioProps) {
  const [run, setRun] = React.useState(0)
  const [by, setBy] = React.useState<"word" | "letter">("word")

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-5 px-6 py-10 text-black/90 dark:text-white/90">
      <p className="text-xs font-medium uppercase tracking-widest text-black/45 dark:text-white/46">Support desk · Release 2.8</p>
      <TextReveal
        {...props}
        as="h2"
        by={by}
        replayKey={`${run}-${by}`}
        className="text-4xl font-semibold leading-[1.08] tracking-tight"
        stagger={by === "letter" ? 24 : 70}
      >
        Every ticket answered before the customer asks twice.
      </TextReveal>
      <TextReveal
        {...props}
        by="word"
        replayKey={`${run}-${by}`}
        delay={500}
        stagger={22}
        className="max-w-md text-[15px] leading-6 text-black/60 dark:text-white/62"
      >
        Nova reads the thread, checks the order history and drafts a reply in your voice. You review it, tweak a line, and send.
      </TextReveal>
      <div className="mt-2 flex gap-2">
        <button type="button" className={btn} onClick={() => setRun((n) => n + 1)}>
          Replay
        </button>
        <button type="button" className={btn} aria-pressed={by === "letter"} onClick={() => setBy((b) => (b === "word" ? "letter" : "word"))}>
          By {by === "word" ? "word" : "letter"}
        </button>
      </div>
    </div>
  )
}

export const notes = [
  "The text is split into word spans (and optionally per-letter spans inside each word). Each unit gets its index in a CSS variable `--i`, and the animation delay is `calc(var(--i) * stagger)`, so one keyframe animation produces the whole cascade.",
  "Each unit animates `opacity`, `filter: blur(8px)` and `translateY(.42em)` from hidden to rest; `animation-fill-mode: backwards` keeps it hidden during its delay without leaving a filled stacking context behind.",
  "An IntersectionObserver flips a `data-in` attribute on the root when 30% of it is visible. Before that, `.tr:not([data-in]) .tr-u { opacity: 0 }` holds the text back; with `once={false}` leaving the viewport resets it so it replays.",
  "Screen readers get one visually-hidden copy of the sentence while the animated spans are `aria-hidden`, so the split letters never get read out one at a time.",
  "Changing the `key` on the wrapper (`replayKey`) remounts the spans, which restarts the CSS animation without any timers.",
]
