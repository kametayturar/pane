import type { StudioProps } from "@/components/motion/backdrop"
import { PencilGreenhouse } from "@/components/illustrations/pencil-greenhouse"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1000px] px-1 py-4">
      <PencilGreenhouse {...props} />
    </div>
  )
}

export const notes = [
  "The room is first laid out in four hidden maps at half size: colour, hatch direction, highlights and depth. A one-point perspective down the aisle gives the glazing bars, benches, tiles and the shafts of light their positions; puddles are the colour map mirrored about the floor line of the back wall.",
  "Nothing in those maps is shown. Every visible pixel is a mark that reads them: patches of three to seven parallel pencil strokes, each a thin-thick-thin lens, laid in passes – a cool shadow layer cross-hatched, the local colour, then warm lights – with each object hatched along its own direction (leaves along their veins, tiles one way or the other).",
  "Colours come from a box of pencils, not a mixer: each patch takes one of the two nearest pencils, chosen by weight, so greens are made of separate olive, viridian and teal strokes that mix in the eye.",
  "Each tool erodes differently: the soft pastel block-in, conté contours and chalk highlights lose most of their pigment in the paper's valleys, the pencil only some, so the same tooth shows through every layer.",
  "The heavy drawing is baked once per size and setting, in chunks across frames so the block-in appears first. Only a small layer moves: dust drifting in the light, a drop sliding down the glass and glints on the puddles, all at a few pixels a second and periodic over 30 seconds.",
]
