import * as React from "react"

import { ControlCenter, type ControlCenterState } from "@/components/ui/control-center"
import { Scene } from "./_glass-scenes"

export const notes = [
  "A tile grows into its detail sheet with one spring: the sheet is an absolutely positioned rect whose left/top/width/height are interpolated between the tile's box (measured with getBoundingClientRect relative to the panel) and the panel's inner box, stepped in a requestAnimationFrame loop. The sheet's content is fixed-size and clipped, so it is revealed rather than squished; the grid behind goes `inert` and recedes.",
  "Meters are masked tick patterns: a `repeating-linear-gradient` mask cuts a flat fill into 4px bars and the value is a `scaleX()` on the fill, written directly in pointer events. Dragging keeps the grab offset so the fill follows the pointer 1:1 from where it was grabbed; past either end the track stretches with `1 - 1/(x*0.9 + 1)` rubber-band resistance, and a tap without a drag jumps to that spot.",
  "The duration dial maps 120 minutes to one full turn. Pointer angle comes from `atan2`, and each move adds the normalised angle delta (wrapped to -180..180) to a running total, so it keeps counting across twelve o'clock; past 5 and 120 minutes the knob only gets an elastic nudge, and on release the total snaps to 5 minute steps with a damped spring on the arc's `stroke-dasharray` and the knob.",
  "Meters and the dial are sliders (aria-valuetext, arrow keys, PageUp/PageDown, Home/End); channel toggles are `role=\"switch\"`, the open sheet traps Tab and Escape returns focus to the chevron that opened it. The 'until' time comes from a minute-granular `useSyncExternalStore` clock, so nothing reads the time during render.",
  "The panel is `backdrop-filter: blur(28px) saturate(1.7)` over a translucent fill with an inset highlight and a rim ring (`mask-composite: exclude`); tiles are lighter translucent fills, and status text blur-swaps with a keyed element that replays a CSS animation.",
]

const avatar = (letter: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><text x="32" y="42" font-family="Inter,Arial" font-size="30" font-weight="600" text-anchor="middle" fill="#fff">${letter}</text></svg>`)}`

export default function Demo() {
  const [state, setState] = React.useState<ControlCenterState | null>(null)
  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-3">
      <div className="relative flex h-[560px] w-full items-center justify-center overflow-hidden rounded-[30px] bg-neutral-200 px-4">
        <Scene tone="harbor" seed={21} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <ControlCenter
          onStateChange={setState}
          people={[
            { id: "a", name: "Ana Reis", avatar: avatar("A", "#e0643f") },
            { id: "b", name: "Tom Aalto", avatar: avatar("T", "#3b3f8f") },
          ]}
        />
      </div>
      <p className="max-w-full truncate px-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
        {state ? `volume ${state.volume}% · text ${state.textSize}% · notifications ${state.notifications ? "on" : "off"} · focus ${state.focus ? `until ${state.focus.until}` : "off"}` : "onStateChange fires on every change, including each step of a drag"}
      </p>
    </div>
  )
}
