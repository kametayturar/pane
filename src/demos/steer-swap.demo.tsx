import * as React from "react"

import { SteerSwap, type SteerSwapRegion } from "@/components/ui/steer-swap"

const START: SteerSwapRegion[] = [
  { id: "nordics", name: "Nordics", done: 212, total: 540 },
  { id: "benelux", name: "Benelux", done: 0, total: 318 },
  { id: "iberia", name: "Iberia", done: 96, total: 270 },
  { id: "dach", name: "DACH", done: 0, total: 455 },
]

/** Your own data: the page owns the numbers and the active region; the card only reports what was tapped. */
function Driven() {
  const [active, setActive] = React.useState("nordics")
  const [regions, setRegions] = React.useState(START)
  const [log, setLog] = React.useState("Tap a row. The region you leave keeps its count.")

  // The agent finishes a few more items in whichever region is active.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setRegions((rs) => rs.map((r) => (r.id === active && r.done < r.total ? { ...r, done: Math.min(r.total, r.done + 6) } : r)))
    }, 1200)
    return () => window.clearInterval(id)
  }, [active])

  return (
    <div className="flex flex-col gap-3">
      <SteerSwap
        regions={regions}
        active={active}
        onSwitch={(id, from) => {
          setActive(id)
          setLog(`onSwitch("${id}", "${from}")`)
        }}
      />
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {log}
      </p>
    </div>
  )
}

const LONG: SteerSwapRegion[] = [
  { id: "apac", name: "Asia-Pacific and Oceania", done: 1204, total: 5400 },
  { id: "latam", name: "Latin America and the Caribbean", done: 0, total: 3180 },
  { id: "mena", name: "Middle East and North Africa", done: 96, total: 2700 },
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <SteerSwap />
      <div className="w-full max-w-[448px]">
        <Driven />
      </div>
      <SteerSwap regions={LONG} lead="Atlas is reconciling invoices for" />
    </div>
  )
}

export const notes = [
  "The three words are absolutely positioned spans, each laid out once at headline size. A word's place is only a transform: the headline sits at scale 1 and a row word is scaled to 15px (`15 / headline size`) and translated into its row. Swapping means changing two transforms, so the same text node travels between sizes and the type stays sharp.",
  "On a swap, the two words that traded places play a Web Animations keyframe from their old pose to the new one through a blurred, half-faded midpoint. The word that rises overshoots a little (a spring-like curve) and the one that sinks eases in 60ms later. The count line, the parked-row captions and the headline dot each blur out and back in on their own delay, so no text sits under a moving word, and the line \"kept at 184 of 380\" appears once they have landed.",
  "The headline size is fitted to the card: each name's width is measured in em, and the headline is the largest size where the widest name plus the dot still fits, so it works from 360px up and in Mono's wider letters. The stage has a fixed height (headline, count, note, then one 52px row per other region), so nothing moves vertically during the swap.",
  "With no props the card plays the EMEA to North America switch on a chain of timeouts that pauses off screen and in hidden tabs and stops for good at the first press, key or focus on the card itself (clicks elsewhere on the page do not stop it). Pass `regions`, `active` and `onSwitch` to drive it with real data. Reduced motion shows the finished frame, and every text is written straight to the DOM, so the final state is readable even if animation frames never run.",
]
