import * as React from "react"

import { Patchbay } from "@/components/ui/patchbay"

export const notes = [
  "Every cable is a Verlet rope: 20 points, each remembering where it was a step ago, so velocity is just 'current minus previous'. Gravity pulls them down, then 16 passes of a distance constraint keep neighbours one segment apart. Pin both ends and the slack hangs as a catenary-like sag with no curve maths.",
  "The simulation runs outside React on a fixed 120 Hz step and writes the SVG path 'd' attribute directly each frame. React only renders when the wiring changes, never per frame, and the loop goes to sleep once every cable's kinetic energy is near zero or the board is offscreen or the tab is hidden.",
  "The plug is stiff and the rope is not: the first two points next to each plug are nudged toward a straight stub, so the cable leaves the socket straight before it bends. The free end follows the pointer through an exponential ease, which gives it weight, and a smoothstep magnet pulls it into a socket within about 80px.",
  "The intro lifts each cable's free end above the board and lowers it into its port one after another, so the rope swings and settles by itself. Seating swaps the dragged rope for a seated one without losing its state: the end eases onto the socket, a velocity kick makes the cable bounce, and a 220ms CSS animation presses the plug in.",
  "Keyboard parity: Enter on a jack picks up a cable and arrow keys move the free end between free ports, Enter plugs in, Escape puts it back. Tab to a label: Enter cycles its permission, M lifts its plug to move it (the permission is kept), Delete unplugs. A pointer drag follows only the pointer that started it. With reduced motion the rope skips the physics and is laid out as a still parabola.",
]

const HEAD = "Harbor & Finch workspace, 5 tools, 3 agents"

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const [empty, setEmpty] = React.useState(false)
  return (
    <div className="flex w-full max-w-[900px] flex-col gap-4">
      <Patchbay
        key={run}
        subtitle={HEAD}
        defaultLinks={empty ? [] : undefined}
        actions={
          <>
            <button type="button" onClick={() => { setEmpty(false); setRun((r) => r + 1) }}>
              Reset
            </button>
            <button type="button" onClick={() => { setEmpty(true); setRun((r) => r + 1) }}>
              Unplug all
            </button>
          </>
        }
      />
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400">
        Start on the narrowest permission and widen only when a task needs it.
      </p>
    </div>
  )
}
