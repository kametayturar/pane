import type { StudioProps } from "@/components/motion/backdrop"
import { DashRibbon } from "@/components/illustrations/dash-ribbon"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[960px] px-1 py-4">
      <DashRibbon {...props} />
    </div>
  )
}

export const notes = [
  "Every dash is a short rounded line placed along a row. The layout (where each dash starts, how long it is, its alpha and a seeded jitter) is generated once per seed from a seeded random generator and a value-noise field, then cached; length variance comes from that noise, and each row has its own habit (busy and short, or long and calm), so the rows never read as one barcode.",
  "The wave is a function evaluated when drawing, not stored: each dash is sampled at a few points along x through a sheet of two sine waves whose crest slants across the rows, so the rows bunch and open like folded cloth. The phase drifts at under 3px a second, so the picture is a pure function of time and the Studio can draw any frame at any size.",
  "The decisive moment is one number per row group: a head position p. Dashes behind the head blend from ink to the accent with an exponential tail and keep part of that light once it has passed, the dash at the head is a little thicker, and the rows within two of the traced one rise a pixel or two under the head with a Gaussian bump, so the run reads as something travelling through the system.",
  "With no props the piece plays its own loop (a beat of calm, the run, the light holding, a fade, then another row) and stops for good at the first click, tap, key press or button press. Click a row, use the arrow keys and Enter, or the buttons under the picture to trace it. It pauses off screen and in hidden tabs, and reduced motion shows one frame mid-run.",
  "It is one canvas, redrawn by a single rAF loop that keeps its state in a ref, with the colours read from CSS custom properties so light, dark, Mono and Glass need no extra drawing code. The size follows a container query: wider than 520px it is 1.8:1, narrower it turns taller.",
]
