import type { StudioSpec } from "@/studio/schema"
import { ChalkObservatory, draw } from "@/components/illustrations/chalk-observatory"

export const studio: StudioSpec = {
  id: "chalk-observatory",
  name: "Chalk Observatory",
  kind: "scene",
  background: "own",
  duration: 40,
  sizes: ["16:9", "1:1", "4:5", "9:16", "og"],
  controls: [
    {
      key: "palette", label: "Hour", type: "segmented", group: "Colour", default: "midnight",
      options: [{ id: "midnight", label: "Midnight" }, { id: "bluehour", label: "Blue hour" }, { id: "smallhours", label: "Small hours" }],
    },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 4 },
    { key: "density", label: "Stroke density", type: "range", group: "Shape", min: 0.6, max: 1.5, step: 0.05, default: 1 },
    { key: "stars", label: "Stars", type: "range", group: "Content", min: 0.3, max: 1.8, step: 0.05, default: 1 },
    { key: "comet", label: "Comet tail", type: "range", group: "Content", min: 0, max: 1.4, step: 0.05, default: 1 },
    { key: "lights", label: "Valley lights", type: "range", group: "Content", min: 0, max: 1.6, step: 0.05, default: 1 },
    { key: "tooth", label: "Paper tooth", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.6 },
  ],
  presets: [
    { id: "midnight", name: "Midnight", values: { palette: "midnight", seed: 4, density: 1, stars: 1, comet: 1, lights: 1, tooth: 0.6 }, size: "16:9" },
    { id: "blue-hour", name: "Blue hour", values: { palette: "bluehour", seed: 11, density: 1, stars: 0.8, comet: 0.8, lights: 1.3, tooth: 0.55 }, size: "16:9" },
    { id: "small-hours", name: "Small hours", values: { palette: "smallhours", seed: 23, density: 1.1, stars: 1.4, comet: 1.2, lights: 0.7, tooth: 0.7 }, size: "16:9" },
    { id: "square-sky", name: "Square sky", values: { palette: "midnight", seed: 8, density: 1, stars: 1.2, comet: 1, lights: 1, tooth: 0.6 }, size: "1:1" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "The drawing bakes once per size (a second or two); video and GIF loop over 40 seconds as valley lamps come on one by one." },
  draw,
  component: ChalkObservatory,
}
