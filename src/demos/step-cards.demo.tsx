import type { StudioProps } from "@/components/motion/backdrop"
import { StepCards } from "@/components/illustrations/step-cards"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1080px] px-6 py-10">
      <StepCards {...props} />
    </div>
  )
}

export const notes = [
  "Every column is a plain DOM card, not an image. The three scenes share one 10-second CSS loop: a small helper turns a table of start/end seconds into @keyframes percentages, so each element is hidden → shown → held → faded out on the same clock and they stay in order.",
  "Because it is pure CSS keyframes, speed is just animation-duration: calc(10s / var(--sk-speed)) and pause is animation-play-state: paused – no JavaScript timers at all.",
  "The dashed connector 'draws' with a mask: a solid line with stroke-dasharray: 1 and pathLength=1 animates stroke-dashoffset from 1 to 0 inside an SVG <mask>, revealing the dashed line beneath it (dashes themselves can't be drawn with dashoffset).",
  "The checkmarks are SVG paths drawn the same way (stroke-dashoffset), and the badge flips from 'For review' to 'Approved' by stacking both labels in one grid cell and crossfading opacity + filter: blur(3px).",
  "The tile's halftone is a radial-gradient dot every 7px, cut by a radial mask-image so the dots gather at the edges and leave the centre clean. Columns switch from 1 to 3 with a container query at 760px.",
]
