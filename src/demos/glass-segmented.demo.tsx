import * as React from "react"
import { Clock, Map as MapIcon, Sun } from "lucide-react"

import { GlassSegmented } from "@/components/ui/glass-segmented"
import { Backdrop } from "@/components/motion/backdrop"

export const notes = [
  "The drop is an SVG <rect> (fill, a thin gloss and a rim stroke) that sits above the control's glass. Its x/width/y/height attributes are written straight from a requestAnimationFrame loop, so a stretch is paint only: no React render and no layout per frame.",
  "Each edge of the drop is its own damped spring. The edge facing the direction of travel gets a stiff spring and the trailing edge a soft one, so the drop stretches and then settles. The height shrinks as the width grows, which reads as liquid keeping its volume.",
  "Dragging uses pointer capture on the group. The drop follows the pointer through the same two springs, the pointer's velocity is smoothed on every move, and on release `centre + velocity * 0.12` is projected and snapped to the nearest segment, so a fling can carry past the next one.",
  "The glass itself is `backdrop-filter: blur(24px) saturate(1.7)` over a translucent fill, an inset highlight, and a ::before ring painted with a diagonal gradient and `mask-composite: exclude`, which is how a 1px specular rim is cut out of the border box.",
  "Segment positions are measured with offsetLeft/offsetWidth and re-measured by a ResizeObserver; the group is a radiogroup with a roving tabindex, and reduced motion makes the drop jump instead of spring.",
]

const SCENES: { value: string; label: string; title: string; detail: string; accent: string }[] = [
  { value: "harbor", label: "Harbor", title: "Harbor at dusk", detail: "Pier 9, east quay", accent: "#6f6bf0" },
  { value: "tram", label: "Tram", title: "Line 28 at golden hour", detail: "Old town climb", accent: "#e08a4f" },
  { value: "bridge", label: "Bridge", title: "Blue hour crossing", detail: "Suspension span, north tower", accent: "#3f8ae0" },
  { value: "coast", label: "Coast", title: "Low tide cove", detail: "Cliff path, mile 4", accent: "#2fa38f" },
]

export default function Demo() {
  const [tone, setTone] = React.useState<string>("harbor")
  const [view, setView] = React.useState("explore")
  const scene = SCENES.find((s) => s.value === tone) ?? SCENES[0]

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-5">
      <div className="relative h-[380px] overflow-hidden rounded-[30px] bg-neutral-200 sm:h-[440px]">
        {SCENES.map((s) => (
          <div key={s.value} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: s.value === tone ? 1 : 0 }}>
            <Backdrop variant="orbs" accent={s.accent} minHeight={0} style={{ height: "100%" }} />
          </div>
        ))}
        <div className="absolute left-5 top-5 text-neutral-900 dark:text-white">
          <div className="text-[22px] font-medium leading-[30px]">{scene.title}</div>
          <div className="text-[14px] opacity-65">{scene.detail}</div>
        </div>
        <div className="absolute inset-x-4 bottom-4 flex flex-col items-stretch gap-3">
          <GlassSegmented
            fullWidth
            label="Scene"
            value={tone}
            onValueChange={setTone}
            options={SCENES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <div className="flex items-center justify-between gap-3">
            <GlassSegmented
              size="sm"
              label="View mode"
              value={view}
              onValueChange={setView}
              options={[
                { value: "explore", label: "Explore", icon: <MapIcon /> },
                { value: "day", label: "Day", icon: <Sun /> },
                { value: "history", label: "History", icon: <Clock />, badge: 3 },
              ]}
            />
            <span className="hidden text-[12px] text-neutral-700 dark:text-white/70 sm:block">Drag the drop, or fling it</span>
          </div>
        </div>
      </div>
    </div>
  )
}
