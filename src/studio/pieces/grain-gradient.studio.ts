import type { StudioSpec } from "../schema"
import { GrainGradient, GRAIN_GRADIENT_LOOP, GRAIN_PALETTES, draw } from "@/components/motion/grain-gradient"

const P = GRAIN_PALETTES

export const studio: StudioSpec = {
  id: "grain-gradient",
  name: "Grain Gradient",
  kind: "gradient",
  background: "own",
  controls: [
    {
      key: "shape", label: "Shape", type: "segmented", group: "Shape", default: "orb",
      options: [{ id: "orb", label: "Orb" }, { id: "ring", label: "Ring" }, { id: "band", label: "Band" }, { id: "wave", label: "Wave" }],
    },
    { key: "scale", label: "Size", type: "range", group: "Shape", min: 0.5, max: 1.6, step: 0.05, default: 1 },
    { key: "warp", label: "Warp", type: "range", group: "Shape", min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 11 },
    { key: "colors", label: "Colours, dark to light", type: "palette", group: "Colour", min: 3, max: 5, default: [...P.ember.colors] },
    { key: "angle", label: "Light direction", type: "angle", group: "Colour", default: 215 },
    { key: "drift", label: "Drift", type: "range", group: "Motion", min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: "orbit", label: "Light circles once per loop", type: "toggle", group: "Motion", default: false },
    { key: "grain", label: "Grain", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: "grainSize", label: "Grain size", type: "range", group: "Grain & finish", min: 0.5, max: 3, step: 0.1, default: 1 },
  ],
  presets: [
    { id: "ember-orb", name: "Ember orb", size: "1:1", values: { shape: "orb", colors: [...P.ember.colors], angle: 215, seed: 11, grain: 0.5 } },
    { id: "tide-ring", name: "Tide ring", size: "16:9", values: { shape: "ring", colors: [...P.tide.colors], angle: 300, seed: 4, grain: 0.55, scale: 1.1 } },
    { id: "moss-band", name: "Moss band", size: "4:5", values: { shape: "band", colors: [...P.moss.colors], angle: 35, seed: 9, grain: 0.6, warp: 0.6 } },
    { id: "cobalt-wave", name: "Cobalt wave", size: "16:9", values: { shape: "wave", colors: [...P.cobalt.colors], angle: 20, seed: 23, grain: 0.45, warp: 0.7 } },
    { id: "bone-orb", name: "Bone orb", size: "1:1", values: { shape: "orb", colors: [...P.bone.colors], angle: 150, seed: 2, grain: 0.8, grainSize: 1.4, scale: 1.15 } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og", "banner"],
  export: { png: "canvas", webm: true, gif: true, notes: "Grain is drawn into the picture, so it survives export. GIFs of grain are large; prefer WebM." },
  duration: GRAIN_GRADIENT_LOOP,
  draw,
  component: GrainGradient,
}
