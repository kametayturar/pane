import type { StudioProps } from "@/components/motion/backdrop"
import { IntegrationGrid } from "@/components/illustrations/integration-grid"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <IntegrationGrid {...props} />
    </div>
  )
}

export const notes = [
  "The honeycomb is plain arithmetic: rows alternate between 8 and 9 tiles on the same 64px pitch, so each row is automatically offset by half a tile. Positions are computed once at module load.",
  "The ripple is one keyframe animation shared by every tile; the only thing that differs is `animation-delay`, set to the tile's normalised distance from the centre × part of the cycle. A wave appears without a single line of JS running per frame.",
  "The distance is stretched vertically (dy × 1.25) so the wave front looks round on a grid whose rows are closer together than its columns.",
  "A radial-gradient `mask-image` on the wall fades the outer tiles to nothing, so the grid has no hard edge on any backdrop.",
  "Tinted tiles set a --tint variable and mix it with color-mix(): the wash, the glyph colour and the ring all derive from that one value.",
]
