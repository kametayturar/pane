import * as React from "react"

import { Seal } from "@/components/ui/seal"

export const notes = [
  "The wax is drawn from data, not an image: a 56 by 56 grid where every cell gets a value from a few formulas (a lit rim, a groove ring, a little grain) and the letters come from a 3 by 5 pixel font. Each value is compared with an 8 by 8 Bayer matrix, and cells that win become 1 by 1 squares in one SVG path.",
  "The seal and its impression are the same shape with the light reversed. The raised version has a domed rim and raised letters; the pressed version flips the rim and sinks the letters. Pressing cross-fades the two layers while one keyframe animation squashes to 0.93, overshoots to 1.05 as the wax spreads, and the drop shadow collapses to nothing.",
  "The time on the wax is typed into the same dither at the moment of the press: the string is run through the same pixel font, so it appears with a short blur-in a beat after the press. A diagonal sheen is a gradient rect clipped to the wax outline and moved with a CSS animation, once.",
  "The slab flip is two faces stacked in one CSS grid cell with backface-visibility: hidden, inside a perspective parent that rotates 180 degrees on X. Because the faces share a grid cell, the slab is always as tall as the taller face, so nothing jumps. The face that is turned away is inert, so Tab never lands on it.",
  "The undo window is one setTimeout for the lock plus a one-second interval for the number; the draining line is a CSS scaleX animation with the same duration. Break seal clips two copies of the wax along a jagged polygon and moves them apart. Sound is a tiny Web Audio sine drop, haptics use navigator.vibrate, and both stay off unless you pass the props.",
]

function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[18px] w-[30px] rounded-full transition-colors duration-200 ${checked ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}
      >
        <span className={`absolute left-[2px] top-[2px] size-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[12px] dark:bg-neutral-900" : ""}`} />
      </button>
      {children}
    </label>
  )
}

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [sealed, setSealed] = React.useState(false)
  const [sound, setSound] = React.useState(false)
  const [haptics, setHaptics] = React.useState(false)

  return (
    <div className="flex w-full max-w-[460px] flex-col items-center gap-6">
      <Seal key={`${run}-${sealed}`} time="14:02" defaultSealed={sealed} sound={sound} haptics={haptics} />
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Switch checked={sound} onChange={setSound}>
          Sound
        </Switch>
        <Switch checked={haptics} onChange={setHaptics}>
          Haptics
        </Switch>
        <button
          type="button"
          onClick={() => {
            setSealed(false)
            setRun((r) => r + 1)
          }}
          className="rounded-md px-2.5 py-1 text-[13px] text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            setSealed(true)
            setRun((r) => r + 1)
          }}
          className="rounded-md px-2.5 py-1 text-[13px] text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-white/10"
        >
          Jump to sealed
        </button>
      </div>
    </div>
  )
}
