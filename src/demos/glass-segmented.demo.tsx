import * as React from "react"
import { Clock, Map as MapIcon, Sun } from "lucide-react"

import { GlassSegmented } from "@/components/ui/glass-segmented"
import { Scene, type SceneTone } from "./_glass-scenes"

export const notes = [
  "The drop is an SVG <rect> (fill, a thin gloss and a rim stroke) that sits above the control's glass. Its x/width/y/height attributes are written straight from a requestAnimationFrame loop, so a stretch is paint only: no React render and no layout per frame.",
  "Each edge of the drop is its own damped spring. The edge facing the direction of travel gets a stiff spring and the trailing edge a soft one, so the drop stretches and then settles. The height shrinks as the width grows, which reads as liquid keeping its volume.",
  "Dragging uses pointer capture on the group. The drop follows the pointer through the same two springs, the pointer's velocity is smoothed on every move, and on release `centre + velocity * 0.12` is projected and snapped to the nearest segment, so a fling can carry past the next one.",
  "The glass itself is `backdrop-filter: blur(24px) saturate(1.7)` over a translucent fill, an inset highlight, and a ::before ring painted with a diagonal gradient and `mask-composite: exclude`, which is how a 1px specular rim is cut out of the border box.",
  "Segment positions are measured with offsetLeft/offsetWidth and re-measured by a ResizeObserver; the group is a radiogroup with a roving tabindex, and reduced motion makes the drop jump instead of spring.",
]

const SCENES: { value: SceneTone; label: string; title: string; detail: string }[] = [
  { value: "harbor", label: "Harbor", title: "Harbor at dusk", detail: "Pier 9, east quay" },
  { value: "tram", label: "Tram", title: "Line 28 at golden hour", detail: "Old town climb" },
  { value: "bridge", label: "Bridge", title: "Blue hour crossing", detail: "Suspension span, north tower" },
  { value: "coast", label: "Coast", title: "Low tide cove", detail: "Cliff path, mile 4" },
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
            <Scene tone={s.value} seed={s.value.length * 5} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>
        ))}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute left-5 top-5 text-white">
          <div className="text-[22px] font-medium leading-[30px] [text-shadow:0_1px_12px_rgb(0_0_0/.25)]">{scene.title}</div>
          <div className="text-[14px] opacity-85">{scene.detail}</div>
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
            <span className="hidden rounded-full bg-black/25 px-3 py-1 text-[12px] text-white backdrop-blur-md sm:block">Drag the drop, or fling it</span>
          </div>
        </div>
      </div>
    </div>
  )
}
