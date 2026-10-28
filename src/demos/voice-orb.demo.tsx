import * as React from "react"

import type { StudioProps } from "@/components/motion/backdrop"
import { VoiceOrb, type VoiceOrbState } from "@/components/illustrations/voice-orb"

const OPTIONS: { id: VoiceOrbState | "auto"; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "idle", label: "Idle" },
  { id: "listening", label: "Listening" },
  { id: "thinking", label: "Thinking" },
  { id: "speaking", label: "Speaking" },
]

export default function Demo(props: StudioProps) {
  const [mode, setMode] = React.useState<VoiceOrbState | "auto">("auto")

  return (
    <div className="flex w-full flex-col items-center gap-4 py-4">
      <VoiceOrb {...props} state={mode === "auto" ? undefined : mode} />
      <div role="group" aria-label="Orb state" className="flex flex-wrap justify-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={mode === o.id}
            onClick={() => setMode(o.id)}
            className="rounded-md px-2.5 py-1 text-xs font-medium opacity-60 transition aria-pressed:bg-white aria-pressed:opacity-100 aria-pressed:shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_rgb(0_0_0/.08)] dark:aria-pressed:bg-white/15"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export const notes = [
  "The sphere is 1,000 points spread with a Fibonacci lattice (each point turns by the golden angle), which covers a sphere evenly with no clumps at the poles.",
  "Every frame the 3D points are rotated, nudged along their own direction (breathing, sound, ripples) and projected to 2D with a simple perspective divide: scale = camera / (camera - z). Dots further back are smaller and fainter.",
  "Thinking morphs each dot between two target positions – its place on the sphere and its place on a ring – with a per-dot stagger on the blend, so the sphere peels into the ring instead of snapping.",
  "The canvas is sized to devicePixelRatio for crisp dots, reads its colour from CSS (getComputedStyle) so dark mode and the accent prop just work, and its requestAnimationFrame loop stops when paused, offscreen (IntersectionObserver) or in a hidden tab.",
  "Animation time is a clock you advance by dt × speed, so pausing keeps the frame, resuming continues from it, and the auto cycle (idle → listening → thinking → speaking) is just a function of that clock.",
]
