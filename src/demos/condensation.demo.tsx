import * as React from "react"
import { RotateCcw } from "lucide-react"

import { Condensation, type CondensationHandle } from "@/components/ui/condensation"
import { Scene } from "./_glass-scenes"

export const notes: string[] = [
  "Why fog and not a blur-on-hover: a blurred secret is still in the DOM, so Ctrl+F, an extension or the inspector reads it. Here a row holds a same-shape stand-in (every letter swapped for one of similar width) until a wipe or a peek gets close to it, and only then does the real value mount. The row never reflows when it does.",
  "The fog is one element with `backdrop-filter: blur(14px) saturate(150%)`, a haze tinted from the surface and accent tokens, a vignette that thickens toward the edges, a cloud texture for uneven density and a few resting droplets. A CSS `mask-image` cuts holes in it: where the mask is transparent there is no blur, so you see the text underneath. Mask and backdrop-filter sit on the same element on purpose, because a mask on a parent would turn it into a backdrop root and the blur would stop seeing the scene.",
  "The mask is drawn on a small off-screen canvas (about 0.5x the size). It starts opaque black; every pointer move adds soft round stamps with `destination-out`, interpolated every 0.3 of the brush radius and smoothed through quadratic midpoints so a quick turn leaves a round corner. The brush is about 0.85 of a row high, so one pass clears a whole line. The canvas is encoded with `toBlob` (off the main thread), decoded off-screen with `Image.decode()` and only then assigned to `mask-image`, so the fog never flickers between frames.",
  "Fog returns because each stamp has its own age. After a hold it fades along a smoothstep curve and shrinks to 60% of its radius, so the trail narrows toward its centre line like real condensation. Each stamp's alpha is corrected for how many neighbours overlap it (`1 - (1 - s)^(1/n)`), otherwise the overlap would keep the middle clear until the very end.",
  "The wet edge is not drawn per stamp. The fog silhouette is copied, nudged a few pixels up-left and down-right and the fog itself is subtracted, which leaves a lit lip on one side of each clear patch and a shadow on the other. It is derived from the same mask, so it follows every turn and merge and is swapped in together with the mask. Water beads sit on the band edge on a second canvas; some on the lower edge roll down under gravity and wipe a thin streak.",
  "Stage layout: pass `stage` for film and screenshots. It drops the outer card, runs one column and sizes everything in `em` from about 2.1% of the container width, so a 1080px square capture gets 22px type. `data-demo-phase` on the root (idle, wiping, clear, fogging, fogged) lets a recorder sync to the scripted wipe, and `demoDelayMs` / `demoSpeed` retime it.",
  "Every pointer action has a keyboard twin: Tab to an eye button and press Enter to clear one item for 5 seconds, Esc to fog back. Screen readers get one debounced announcement of what is readable (label and value), not one per stamp. A hidden tab fogs everything at once. Scripted strokes never call `onReveal`.",
]

function useInitialStage() {
  const [stage, setStage] = React.useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("stage") === "1"
    } catch {
      return false
    }
  })
  return [stage, setStage] as const
}

export default function Demo() {
  const ref = React.useRef<CondensationHandle>(null)
  const [stage, setStage] = useInitialStage()
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className={
          stage
            ? "relative mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-[28px] bg-[#3b3f8f]"
            : "relative w-full overflow-hidden rounded-[28px] bg-[#3b3f8f]"
        }
      >
        <div className="absolute inset-0 dark:brightness-[.7]">
          <Scene tone="harbor" seed={21} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#ff6fa5]/60 blur-3xl" />
          <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#35d0c4]/45 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-72 w-96 rounded-full bg-[#ffb347]/55 blur-3xl" />
        </div>
        {stage ? (
          <div className="absolute inset-0 grid place-items-center px-[7%] py-[6%]">
            <Condensation ref={ref} stage />
          </div>
        ) : (
          <div className="relative px-4 py-10 sm:px-10 sm:py-14">
            <Condensation ref={ref} />
          </div>
        )}
      </div>
      <div className="flex w-full max-w-[780px] flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100">Drag to wipe. It fogs back on its own.</p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">Keyboard: Tab to an eye, Enter to peek, Esc to fog.</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Layout" className="inline-flex rounded-lg bg-neutral-100 p-0.5 text-[12.5px] font-medium dark:bg-neutral-800">
            {[
              { k: false, t: "Card" },
              { k: true, t: "Stage 1:1" },
            ].map((o) => (
              <button
                key={o.t}
                type="button"
                aria-pressed={stage === o.k}
                onClick={() => setStage(o.k)}
                className={`h-7 rounded-md px-2.5 transition-colors ${stage === o.k ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"}`}
              >
                {o.t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.replay()}
            aria-label="Replay the wipe"
            title="Replay the wipe"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  )
}
