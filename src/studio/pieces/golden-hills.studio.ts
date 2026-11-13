import type { StudioSpec } from "../schema"
import { draw, GOLDEN_HILLS_DURATION, GoldenHills } from "@/components/illustrations/golden-hills"

export const studio: StudioSpec = {
  id: "golden-hills",
  name: "Golden Hills",
  kind: "scene",
  background: "own",
  duration: GOLDEN_HILLS_DURATION,
  sizes: ["16:9", "1:1", "4:5", "9:16", "og", "banner"],
  controls: [
    { key: "light", label: "Sun", type: "range", min: 0, max: 1, step: 0.01, default: 0.3, group: "Colour" },
    { key: "tint", label: "Grass light", type: "color", default: "#dea83e", swatches: ["#dea83e", "#bfb05a", "#c9783a", "#9db36a", "#e0c27a"], group: "Colour" },
    { key: "haze", label: "Haze", type: "range", min: 0, max: 1, step: 0.01, default: 0.38, group: "Colour" },
    { key: "tree", label: "Lone tree", type: "toggle", default: true, group: "Shape" },
    { key: "walker", label: "Walker", type: "toggle", default: true, group: "Shape" },
    { key: "grass", label: "Grass", type: "range", min: 0, max: 1, step: 0.01, default: 0.7, group: "Shape" },
    { key: "shadows", label: "Cloud shade", type: "range", min: 0, max: 1, step: 0.01, default: 1, group: "Motion" },
    { key: "grain", label: "Grain", type: "range", min: 0, max: 1, step: 0.01, default: 0.5, group: "Grain & finish" },
    { key: "seed", label: "Seed", type: "seed", default: 7 },
  ],
  presets: [
    { id: "golden", name: "Golden hour", values: { light: 0.3, tint: "#dea83e", haze: 0.38, tree: true, walker: true, grass: 0.7, shadows: 1, grain: 0.5, seed: 7 } },
    { id: "morning", name: "Low morning", values: { light: 0.04, tint: "#bfb05a", haze: 0.8, tree: true, walker: true, grass: 0.7, shadows: 0.8, grain: 0.45, seed: 12 } },
    { id: "dusk", name: "Dusk", values: { light: 0.86, tint: "#c9783a", haze: 0.55, tree: true, walker: true, grass: 0.7, shadows: 1, grain: 0.55, seed: 7 } },
    { id: "overcast", name: "Windy day", values: { light: 0.2, tint: "#9db36a", haze: 0.3, tree: true, walker: false, grass: 0.9, shadows: 1, grain: 0.6, seed: 31 } },
    { id: "bare", name: "Bare ridge", values: { light: 0.36, tint: "#e0c27a", haze: 0.65, tree: false, walker: false, grass: 0.5, shadows: 0.6, grain: 0.35, seed: 4 }, size: "banner" },
  ],
  export: {
    png: "canvas",
    webm: true,
    gif: true,
    notes: "Grain and vignette are painted into the picture, so they survive export. A GIF of the full 60 second loop is large; use WebM for the whole loop.",
  },
  draw: (ctx, w, h, t, values) => draw(ctx, w, h, t, values),
  component: GoldenHills,
}
