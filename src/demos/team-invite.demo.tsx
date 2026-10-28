import { TeamInvite } from "@/components/illustrations/team-invite"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <TeamInvite {...props} invitee={{ name: "Priya Nair", hue: 205 }} workspace="Studio" />
    </div>
  )
}

export const notes = [
  "The whole loop is one CSS timeline: every moving part (chip, cursor, seat, line, status dot) has its own @keyframes but the same duration, so they stay in sync. Speed is just calc(10s / var(--ti-speed)) and pause is animation-play-state: paused on the root.",
  "The dashed line turning solid is SVG stroke-dasharray with pathLength=1: the line is normalised to length 1, so the dashed layer fades out while a solid layer with dasharray '1 1' draws in by animating stroke-dashoffset from 1 to 0.",
  "The dragged chip and the cursor share the same keyframe times and easings, with the cursor offset by a fixed 24px/14px from the chip, so they look attached without any JavaScript tracking the pointer.",
  "Avatars are gradients, not photos: oklch() colours driven by a per-person --h hue variable, with a radial-gradient highlight and an inset ring for depth.",
  "The final 6% of the loop fades everything back to the starting frame, so the jump from the end to the beginning is invisible; prefers-reduced-motion shows the finished frame instead.",
]
