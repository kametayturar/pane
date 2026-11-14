import type { StudioSpec } from "@/studio/schema"
import { PastelHarbor, draw } from "@/components/illustrations/pastel-harbor"

export const studio: StudioSpec = {
  id: "pastel-harbor",
  name: "Pastel Harbor",
  kind: "scene",
  background: "own",
  duration: 20,
  sizes: ["16:9", "1:1", "4:5", "9:16", "og"],
  controls: [
    {
      key: "palette", label: "Time of day", type: "segmented", group: "Colour", default: "first-light",
      options: [{ id: "first-light", label: "First light" }, { id: "blue-hour", label: "Blue hour" }, { id: "sun-up", label: "Sun up" }],
    },
    { key: "lamps", label: "Lamps on", type: "toggle", group: "Content", default: true },
    { key: "clouds", label: "Cloud cover", type: "range", group: "Content", min: 0, max: 1, step: 0.01, default: 0.65 },
    { key: "density", label: "Stroke density", type: "range", group: "Shape", min: 0.5, max: 1.6, step: 0.05, default: 1 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 11 },
    { key: "tooth", label: "Paper tooth", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.6 },
  ],
  presets: [
    { id: "first-light", name: "First light", values: { palette: "first-light", lamps: true, clouds: 0.65, density: 1, seed: 11, tooth: 0.6 }, size: "16:9" },
    { id: "blue-hour", name: "Blue hour", values: { palette: "blue-hour", lamps: true, clouds: 0.5, density: 1, seed: 4, tooth: 0.65 }, size: "16:9" },
    { id: "sun-up", name: "Sun up", values: { palette: "sun-up", lamps: false, clouds: 0.8, density: 1.1, seed: 23, tooth: 0.55 }, size: "4:5" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "The drawing is baked once per size; only lamp reflections, glints and gulls move, on a 20 second loop." },
  draw,
  component: PastelHarbor,
}
