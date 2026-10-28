import * as React from "react"

import { TimeDial, type TimeDialCity } from "@/components/ui/time-dial"

export const notes = [
  "The face is one SVG with a 300-unit viewBox. The working-hours band is a single annular-sector <path> built from two arcs (angle = minutes ÷ 1440 × 360° − 180°, so noon is at the top). Every city is placed by the same formula – its local time is the UTC value plus its offset – so spinning one knob moves all the marks by the same angle.",
  "Rotation never goes through React. One requestAnimationFrame loop writes setAttribute('transform') for the arm, the counter-rotated sun/moon glyph and every city mark, toggles data-work when a city enters working hours, and only calls setState when the value crosses a quarter hour – which is when the list and the readout re-render.",
  "Dragging turns the pointer's angle into minutes (atan2, then the change since the last event is normalised into ±180° so the value keeps counting across midnight into adjacent days). A power-curve detent makes the knob linger near each quarter hour; past min/max the overshoot goes through a saturating curve for a rubber band.",
  "A flick solves an exponential glide so it lands exactly on a quarter hour and hands the last stretch to a critically damped spring (an exact exponential step, independent of frame rate). 'Find overlap' scans ±24 h in quarter-hour steps, scores each by how many cities are inside working hours, and springs the dial to the nearest best one.",
  "The odometers are columns whose items are keyed by their absolute index (hour = ⌊local ÷ 60⌋, unbounded). When the index changes, the same DOM nodes simply get a new translateY and CSS transitions slide them past each other. Switching the home city swings the arm from the old mark to the new one by animating an angular offset back to 0.",
]

const CITIES: TimeDialCity[] = [
  { id: "nyc", name: "New York", code: "NYC", offset: -240 },
  { id: "sf", name: "San Francisco", code: "SF", offset: -420 },
  { id: "lon", name: "London", code: "LON", offset: 60 },
  { id: "tyo", name: "Tokyo", code: "TYO", offset: 540 },
]

const CITIES_24: TimeDialCity[] = [
  { id: "ber", name: "Berlin", code: "BER", offset: 120 },
  { id: "dub", name: "Dubai", code: "DXB", offset: 240 },
  { id: "blr", name: "Bengaluru", code: "BLR", offset: 330 },
]

export default function Demo() {
  const [t, setT] = React.useState(21 * 60)
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10 px-4 py-6">
      <div className="rounded-[34px] border border-black/[.07] bg-neutral-50 p-5 dark:border-white/10 dark:bg-white/[.03] sm:p-8">
        <TimeDial cities={CITIES} value={t} onValueChange={setT} weekday={1} label="Call time" />
      </div>
      <div className="mx-auto w-full max-w-[420px] rounded-[34px] border border-black/[.07] bg-neutral-50 p-5 dark:border-white/10 dark:bg-white/[.03]">
        <TimeDial cities={CITIES_24} defaultValue={8 * 60} hourCycle={24} workingHours={[480, 1020]} weekday={3} label="Handover time" />
      </div>
    </div>
  )
}
