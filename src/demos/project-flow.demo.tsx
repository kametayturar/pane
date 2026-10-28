import { ProjectFlow } from "@/components/illustrations/project-flow"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[680px]">
      <ProjectFlow {...props} />
    </div>
  )
}

export const notes = [
  "Each elbow line is an SVG `<path>` with `pathLength=\"1\"`. Setting `stroke-dasharray: 1` and animating `stroke-dashoffset` from 1 to 0 draws it from start to end, whatever its real length.",
  "The elbow geometry is generated: horizontal run, a quadratic-curve corner (`Q`), a vertical run, another corner and a horizontal run into the card – so any number of subtasks fans out from the root with rounded turns.",
  "The staging is one CSS variable per element, `--d`, used as `animation-delay: calc(var(--d) * 1s / var(--pf-speed))`. Speed and replay come from one number instead of per-element timing code.",
  "The glowing pulse that travels along each branch is a plain `div` using CSS `offset-path: path(...)` with an animated `offset-distance`, so it follows the same curves as the lines.",
  "The scene replays by changing a React `key` on its container: React throws the old DOM away and mounts a new one, which restarts every CSS animation. A timer tracks the time left so pausing resumes where it stopped.",
]
