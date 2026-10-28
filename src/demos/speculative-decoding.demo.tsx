import { SpeculativeDecoding } from "@/components/illustrations/speculative-decoding"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <SpeculativeDecoding {...props} />
    </div>
  )
}

export const notes = [
  "The run is simulated, not scripted: each draft position is right with probability `ease`, drawn from a small seeded PRNG (mulberry32), and the first wrong guess ends the accepted prefix. The same seed always replays the same run, and the speed-up is the modelled N / (passes + drafted × draftCost).",
  "The timeline is built once as a list of rounds with absolute times (draft chips every 170 ms, one target pass, then the tokens fly). One rAF clock advances virtual time; React only re-renders when the snapshot of 'which chips are visible' changes.",
  "Accepted and target tokens fly into the answer without it reflowing: the answer is real inline text with each word visibility: hidden until it lands, and the flight target is read from each span's offsetLeft/offsetTop, so a word lands exactly where its glyphs will appear.",
  "The sweep is one absolutely positioned gradient that is moved with transform: translate3d() each frame; the verdict cells appear as it crosses their column. The 'target only' line advances at 1 / speedup of the real pace so the race stays honest.",
  "Speed and pause scale or stop the virtual clock; CSS animations pause with animation-play-state. Under reduced motion the finished run is drawn as a still frame.",
]
