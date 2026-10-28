import * as React from "react"
import { Star } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import { Scene } from "./_glass-scenes"

export const notes = [
  "Tilt and the rim light are springs, not CSS transitions. One requestAnimationFrame loop steps a small array of damped springs (rotateX, rotateY, light x/y, light opacity, panel height) and writes the results with `style.transform` and CSS variables, so pointer movement never re-renders React.",
  "The rim highlight is a `radial-gradient(160px circle at var(--hx) var(--hy), white, transparent)` painted on a span with 1px padding and `mask-composite: exclude`, which cuts the gradient down to a 1px ring. Moving `--hx/--hy` slides the light around the edge.",
  "Tilt is `rotateX/rotateY` on the card inside a `perspective: 1000px` wrapper, with the photo counter-shifted by `translate` so it reads as depth. Touch pointers skip it, and `tilt={0}` or reduced motion turns it off.",
  "Expanding is not a layout animation: the panel is pinned to the bottom and only its height is a spring (target = header + measured detail height, capped to the card), while the detail content mounts, fades up with `blur(3px)` and is removed from the DOM after it collapses so hidden buttons are never focusable.",
  "The panel is `backdrop-filter: blur(22px) saturate(1.7)` over a translucent fill with an inset highlight; `prefers-reduced-transparency` swaps it for a solid surface.",
]

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-black/[.05] px-3 py-2 dark:bg-white/10">
      <div className="text-[15px] font-medium leading-5">{v}</div>
      <div className="text-[12px] opacity-60">{k}</div>
    </div>
  )
}

export default function Demo() {
  const [booked, setBooked] = React.useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <GlassCard
        className="max-w-[360px]"
        media={<Scene tone="cliff" seed={12} style={{ width: "100%", height: "100%" }} />}
        title="Casa do Vento"
        subtitle="Cliffside stay, Madeira"
        aside={
          <>
            <Star size={14} fill="currentColor" strokeWidth={0} />
            4.9
          </>
        }
      >
        <p className="text-[14px] leading-5 opacity-80">Two bedrooms above the Atlantic, a plunge pool cut into the rock and a kitchen that opens onto the terrace.</p>
        <div className="mt-3 flex gap-2">
          <Stat k="Guests" v="4" />
          <Stat k="Nights min" v="3" />
          <Stat k="From" v="€210" />
        </div>
        <button
          type="button"
          onClick={() => setBooked((b) => !b)}
          className="mt-3 h-10 w-full rounded-full bg-[#0060e2] text-[14px] font-medium text-white transition-transform active:scale-[.98]"
        >
          {booked ? "Held for 24 hours" : "Reserve"}
        </button>
      </GlassCard>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">Move the pointer over the card, tap it to open.</p>
    </div>
  )
}
