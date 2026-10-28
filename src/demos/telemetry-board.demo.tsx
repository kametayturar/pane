import { TelemetryBoard } from "@/components/illustrations/telemetry-board"
import type { StudioProps } from "@/components/motion/backdrop"

export const notes = [
  "The artwork is three subjects drawn as one inline SVG (a fern whose leaflet length and angle follow the stem, a dragonfly, and a recursive branching tree). It is rasterised once, shrunk to one pixel per dot cell, and compared with an 8×8 Bayer matrix – tone above the threshold lights a square dot.",
  "All dots live on a single canvas stacked above the panels and below the labels, so they can bleed past a panel's edge while the text stays crisp DOM. Dots are drawn in alpha buckets (one fill per bucket) and the reveal gives each dot a delay that grows from left to right.",
  "The stage is a fixed 720×540 design that a ResizeObserver scales with transform: scale(), and the canvas backing store is sized to scale × devicePixelRatio, so dots stay one crisp device pixel grid at any width.",
  "Everything that ticks – the metric, the T+ clock, the typed note, the age walking along the ruler – is a pure function of one coarse clock (about 12 updates a second) that stops when the board is paused, offscreen or the tab is hidden.",
  "The logo is five SVG ellipses on a ring rotated by a CSS animation whose duration is 28s ÷ speed; the glass card is a translucent gradient with backdrop-filter, so the dots behind it blur through.",
]

export default function Demo({ speed, paused, accent }: StudioProps) {
  // The studio's default blue is for UI accents; the board has its own palette (slate dots, blue vitals) unless the visitor picks one.
  const tint = accent && accent !== "#0060e2" ? accent : undefined
  return (
    <div className="w-full px-3 py-6">
      <TelemetryBoard className="mx-auto" speed={speed} paused={paused} accent={tint} />
    </div>
  )
}
