import type { StudioSpec } from "@/studio/schema"
import { PencilGreenhouse, draw } from "@/components/illustrations/pencil-greenhouse"

export const studio: StudioSpec = {
  id: "pencil-greenhouse",
  name: "Pencil Greenhouse",
  kind: "scene",
  background: "own",
  duration: 30,
  sizes: ["16:9", "1:1", "4:5", "9:16", "og"],
  controls: [
    {
      key: "palette", label: "Light", type: "segmented", group: "Colour", default: "afternoon",
      options: [{ id: "afternoon", label: "Afternoon" }, { id: "morning", label: "Morning" }, { id: "dusk", label: "Dusk" }],
    },
    { key: "shafts", label: "Light through the roof", type: "range", group: "Colour", min: 0, max: 1, step: 0.01, default: 0.7 },
    { key: "wet", label: "Rain and puddles", type: "range", group: "Content", min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: "density", label: "Stroke density", type: "range", group: "Shape", min: 0.5, max: 1.6, step: 0.05, default: 1 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 11 },
    { key: "tooth", label: "Paper tooth", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.55 },
  ],
  presets: [
    { id: "after-rain", name: "After the rain", values: { palette: "afternoon", shafts: 0.7, wet: 0.6, density: 1, seed: 11, tooth: 0.55 }, size: "16:9" },
    { id: "morning-mist", name: "Morning mist", values: { palette: "morning", shafts: 0.5, wet: 0.85, density: 1, seed: 4, tooth: 0.5 }, size: "16:9" },
    { id: "dusk-warm", name: "Dusk, still warm", values: { palette: "dusk", shafts: 0.65, wet: 0.45, density: 1.05, seed: 23, tooth: 0.6 }, size: "16:9" },
    { id: "dry-corner", name: "Dry corner", values: { palette: "afternoon", shafts: 0.85, wet: 0.1, density: 1.15, seed: 7, tooth: 0.65 }, size: "1:1" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "The drawing is baked once per size, so the first frame takes a second or two. Only dust, a drip and glints move, and they repeat every 30 seconds." },
  draw,
  component: PencilGreenhouse,
}
