// Quantises and encodes GIF frames off the main thread. Frames arrive as transferred RGBA buffers.
import { GIFEncoder, applyPalette, quantize } from "gifenc"

type In = { type: "init"; w: number; h: number; delay: number } | { type: "frame"; data: ArrayBuffer } | { type: "finish" }
type Scope = { onmessage: ((e: MessageEvent<In>) => void) | null; postMessage: (m: unknown, t?: Transferable[]) => void }
const scope = self as unknown as Scope

let enc: ReturnType<typeof GIFEncoder> | null = null
let w = 0
let h = 0
let delay = 66
let done = 0

scope.onmessage = (e) => {
  const m = e.data
  if (m.type === "init") {
    enc = GIFEncoder()
    w = m.w
    h = m.h
    delay = m.delay
    done = 0
  } else if (m.type === "frame" && enc) {
    const data = new Uint8ClampedArray(m.data)
    const palette = quantize(data, 256, { format: "rgb444" })
    const index = applyPalette(data, palette, "rgb444")
    enc.writeFrame(index, w, h, { palette, delay, repeat: 0 })
    done++
    scope.postMessage({ type: "progress", done })
  } else if (m.type === "finish" && enc) {
    enc.finish()
    const bytes = enc.bytes()
    const copy = bytes.slice().buffer
    scope.postMessage({ type: "gif", buffer: copy }, [copy])
    enc = null
  }
}
