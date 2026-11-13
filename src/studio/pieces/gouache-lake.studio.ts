import type { StudioSpec } from "@/studio/schema"
import { GouacheLake, draw as paint } from "@/components/illustrations/gouache-lake"

/**
 * paintFrame() resets the transform to identity, which throws away the Studio's scale for previews and 2x/3x
 * exports. Hand it a context where that reset restores the incoming transform instead.
 */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Parameters<typeof paint>[4]) {
  const base = ctx.getTransform()
  const proxy = new Proxy(ctx, {
    get(target, key) {
      if (key === "setTransform") {
        return (...a: unknown[]) => {
          const isIdentity = a.length === 6 && a[0] === 1 && a[1] === 0 && a[2] === 0 && a[3] === 1 && a[4] === 0 && a[5] === 0
          if (isIdentity) target.setTransform(base)
          else (target.setTransform as (...x: unknown[]) => void)(...a)
        }
      }
      const v = Reflect.get(target, key, target)
      return typeof v === "function" ? v.bind(target) : v
    },
    set(target, key, value) {
      Reflect.set(target, key, value, target)
      return true
    },
  })
  paint(proxy, w, h, t, values)
}

export const studio: StudioSpec = {
  id: "gouache-lake",
  name: "Gouache Lake",
  kind: "scene",
  background: "own",
  duration: 24,
  sizes: ["16:9", "1:1", "4:5", "og", "banner", "9:16"],
  controls: [
    {
      key: "palette", label: "Palette", type: "segmented", group: "Colour", default: "alpine",
      options: [{ id: "alpine", label: "Alpine" }, { id: "dusk", label: "Dusk" }, { id: "spring", label: "Spring" }],
    },
    { key: "tod", label: "Time of day", type: "range", group: "Colour", min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: "coat", label: "Rower's coat", type: "color", group: "Colour", default: "#c4553a", swatches: ["#c4553a", "#e0a43a", "#2f6fb0", "#f2efe6"], when: (v) => v.boat !== false },
    { key: "dab", label: "Brush size", type: "range", group: "Shape", min: 0.6, max: 1.8, step: 0.05, default: 1 },
    { key: "density", label: "Coverage", type: "range", group: "Shape", min: 0.5, max: 1.6, step: 0.05, default: 1 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 7 },
    { key: "boat", label: "Boat and wake", type: "toggle", group: "Content", default: true },
    { key: "calm", label: "Water calm", type: "range", group: "Motion", min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: "grain", label: "Paper grain", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.45 },
  ],
  presets: [
    { id: "alpine-morning", name: "Alpine morning", values: { palette: "alpine", tod: 0.25, calm: 0.55, dab: 1, density: 1, seed: 7, boat: true, grain: 0.45 }, size: "16:9" },
    { id: "dusk-crossing", name: "Dusk crossing", values: { palette: "dusk", tod: 0.8, calm: 0.7, dab: 1, density: 1.05, seed: 21, boat: true, grain: 0.5 }, size: "16:9" },
    { id: "spring-bloom", name: "Spring bloom", values: { palette: "spring", tod: 0.15, calm: 0.5, dab: 1.1, density: 1, seed: 3, boat: true, grain: 0.4 }, size: "1:1" },
    { id: "still-pond", name: "Still pond", values: { palette: "alpine", tod: 0.45, calm: 1, dab: 0.85, density: 1.2, seed: 12, boat: false, grain: 0.55 }, size: "4:5" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "The boat crosses once in 24 seconds and the wake fades before the loop ends, so video and GIF repeat without a jump." },
  draw,
  component: GouacheLake,
}
