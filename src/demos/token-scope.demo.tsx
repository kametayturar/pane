import * as React from "react"

import { TokenScope, type ScopeChannel, type ScopeEvent, type ScopeSample, type ScopeTimeBase } from "@/components/ui/token-scope"

export const notes = [
  "The screen is one <canvas> sized by a ResizeObserver: the backing store is css size × devicePixelRatio and ctx.setTransform(dpr…) lets every coordinate stay in CSS pixels. One requestAnimationFrame loop advances the stream, redraws and updates the readouts – and is cancelled by an IntersectionObserver when the card scrolls offscreen and by visibilitychange when the tab is hidden.",
  "The 'phosphor' trail is not a glow: each trace is one path stroked with a createLinearGradient from 20% ink at the oldest sample to 92% at the head, so age is just horizontal position. The grid is stationary (labels stay readable) and only the trace scrolls; axis ranges glide toward 'nice' maxima (a step list like 80/100/120/160…) instead of snapping.",
  "The stream is a seeded simulation (mulberry32) stepped at a fixed 20 Hz with an accumulator, so frame rate never changes the data: a smoothed target rate, bursts, a stall every ~12 s and a tool-call wait every ~5.6 s that resets the time-to-first-token. Pass data and events instead and the same screen draws your samples; the right edge is the newest sample time plus a short interpolation.",
  "Holding freezes the head time and stops redrawing except when something changes (a signature string of base, channels, size and cursor is compared each frame). The crosshair maps pointer x back to a time, binary-searches the sorted samples for the nearest one and draws its values – arrow keys move it for keyboard users.",
  "Colours come from CSS custom properties: the canvas normalises any CSS colour by assigning it to fillStyle and reading it back, so dark mode and the global style switcher recolour the canvas without the component knowing the palette. The readouts are numbers that tween to their target with an ease-out-back curve (about 1% overshoot) – skipped when reduced motion is on.",
]

const BTN =
  "rounded-[2px] px-2 py-1 shadow-[0_0_0_1px_rgb(0_0_0/.14)] hover:text-black dark:shadow-[0_0_0_1px_rgb(255_255_255/.2)] dark:hover:text-white"
const LABEL = "font-mono text-[11px] uppercase tracking-[.08em] text-black/45 dark:text-white/45"

/** The consumer side of `data` and `events`: something that pushes samples as a real stream would. */
function useOwnStream(active: boolean) {
  const [state, setState] = React.useState<{ samples: ScopeSample[]; events: ScopeEvent[] }>({ samples: [], events: [] })
  React.useEffect(() => {
    if (!active) return
    let t = 0
    let cost = 0
    const id = window.setInterval(() => {
      t += 0.1
      const waiting = t % 4 < 0.5
      const tps = waiting ? 1 : 80 + 30 * Math.sin(t * 1.3) + 14 * Math.sin(t * 4.1) + (t % 9 < 1 ? 60 : 0)
      cost += tps * 0.1 * 0.000006
      setState((s) => ({
        samples: [...s.samples.slice(-700), { t, tps, latency: 320 + 90 * Math.sin(Math.floor(t / 4)), cost }],
        events: t % 4 < 0.1 ? [...s.events.slice(-20), { t, kind: "tool" as const, label: "your_tool" }] : s.events,
      }))
    }, 100)
    return () => window.clearInterval(id)
  }, [active])
  return state
}

export default function Demo() {
  const [source, setSource] = React.useState<"sim" | "own">("sim")
  const [timeBase, setTimeBase] = React.useState<ScopeTimeBase>(15)
  const [channels, setChannels] = React.useState<ScopeChannel[]>(["tps", "lat"])
  const [paused, setPaused] = React.useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  const own = useOwnStream(source === "own")

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4">
      <TokenScope
        key={source}
        {...(source === "own" ? { data: own.samples, events: own.events, label: "SCOPE 02 · YOUR SAMPLES" } : {})}
        timeBase={timeBase}
        onTimeBaseChange={setTimeBase}
        channels={channels}
        onChannelsChange={setChannels}
        paused={paused}
        onPausedChange={setPaused}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3">
        <span className={LABEL}>
          Controlled · timeBase={timeBase} · channels=[{channels.join(",")}] · paused={String(paused)}
        </span>
        <button type="button" className={`${BTN} ${LABEL}`} onClick={() => setSource((s) => (s === "sim" ? "own" : "sim"))}>
          Source: {source === "sim" ? "simulate" : "data + events"}
        </button>
      </div>
    </div>
  )
}
