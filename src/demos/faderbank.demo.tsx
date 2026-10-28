import * as React from "react"

import { Faderbank, faderbankInitialSnapshot, type FaderbankSnapshot } from "@/components/ui/faderbank"

export const notes = [
  "Each fader is a div with role=\"slider\" and one CSS variable, --p (0 to 1). The thumb sits at bottom: calc(var(--p) * (track - thumb)), so React only changes a number and the browser does the movement: a 420ms transition on bottom, switched off with a data-drag attribute while a pointer (or the tour) holds the cap.",
  "Dragging uses pointer capture on a 42px-wide track strip, so the move events keep arriving outside the element, and touch-action: none only on that strip so a finger on the rest of the desk still scrolls the page. The pointer's Y is mapped back to a value, a magnet within 7px of a detent snaps to it (hold Alt to bypass), and on release anything within 14px is eased onto the stop. A plain click on the cap changes nothing. Max tokens (64 to 4,096) uses a log track, position = ln(value / min) / ln(max / min), so every doubling gets the same distance.",
  "The level meter is 16 plain elements lit by an index comparison, coloured green, amber or red by their index. Lighting a segment waits calc(var(--i) * 8ms); switching one off waits the reverse, so the column fills from the bottom and empties from the top. The one-time power-on sweep is a separate ::after overlay on each LED, animated with a staggered animation-delay while a data-boot attribute is set, and removed again by a timer so it never replays.",
  "The autoplay tour is one requestAnimationFrame loop with a clock. Each parameter has a keyframe track in travel space (0 to 1) that is eased and converted to a value every frame, so the thumb, meter, headline, replies and cost all follow the same state. The clock pauses off screen (IntersectionObserver) and in a hidden tab, and the first pointer or key press ends the tour.",
  "Mute and solo don't change a fader, they change which value counts: a muted channel sends the provider default instead and its thumb glides there and turns into a dashed outline. The five replies are a pure function of temperature and top-p (how many distinct replies to pick from), a hot temperature swaps in replies with the drifting words highlighted, and tokens below a normal reply length cut the text at a word, leaving the rest as ghost ink.",
]

const MODEL_ID: Record<string, string> = { s: "meridian-s", l: "meridian-l" }
const KEYS = ["temperature", "top_p", "max_tokens"] as const

export default function Demo() {
  const [snap, setSnap] = React.useState<FaderbankSnapshot>(() => faderbankInitialSnapshot())
  const [changed, setChanged] = React.useState<string>("")
  const prev = React.useRef(snap)

  const onChange = React.useCallback((s: FaderbankSnapshot) => {
    const p = prev.current
    prev.current = s
    if (s.model !== p.model) setChanged("model")
    for (const k of KEYS) if (s.params[k] !== p.params[k]) setChanged(k)
    setSnap(s)
  }, [])

  const p = snap.params
  const fields: [string, string][] = [
    ["model", `"${MODEL_ID[snap.model] ?? snap.model}"`],
    ["temperature", (p.temperature ?? 1).toFixed(2)],
    ["top_p", (p.top_p ?? 1).toFixed(2)],
    ["max_tokens", String(Math.round(p.max_tokens ?? 1024))],
  ]

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-3">
      <Faderbank autoplay onChange={onChange} />
      <figure className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-black/[.04] px-4 py-3 font-mono text-[11.5px] leading-5 text-neutral-600 dark:bg-white/[.06] dark:text-neutral-400">
        <figcaption className="font-sans text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400">Request body</figcaption>
        <code className="flex flex-wrap gap-x-3">
          {fields.map(([k, v]) => (
            <span key={k} className={`transition-colors duration-500 ${changed === k ? "text-[#0060e2] dark:text-[#6da4ff]" : ""}`}>
              {k}: {v}
            </span>
          ))}
        </code>
      </figure>
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400">Drag Temperature to 2.0, then Max tokens to 64. Arrow keys step through the named stops.</p>
    </div>
  )
}
