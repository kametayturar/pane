import type { StudioSpec } from "../schema"
import { LightForm, LIGHT_FORM_LOOP, draw } from "@/components/illustrations/light-form"

export const studio: StudioSpec = {
  id: "light-form",
  name: "Light Form",
  kind: "glow-card",
  background: "own",
  controls: [
    {
      key: "form", label: "Form", type: "segmented", group: "Shape", default: "moth",
      options: [{ id: "moth", label: "Moth" }, { id: "orchid", label: "Orchid" }, { id: "fern", label: "Fern" }],
    },
    { key: "strands", label: "Strands", type: "range", group: "Shape", min: 120, max: 700, step: 10, default: 460 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 7 },
    {
      key: "palette", label: "Palette", type: "select", group: "Colour", default: "pearl",
      options: [{ id: "pearl", label: "Pearl" }, { id: "ember", label: "Ember" }, { id: "glacier", label: "Glacier" }, { id: "mono", label: "Mono" }, { id: "custom", label: "Custom" }],
    },
    { key: "tint", label: "Outer fringe", type: "color", group: "Colour", default: "#ff5c7c", swatches: ["#ff5c7c", "#ff8034", "#58ecda", "#a78bfa"], when: (v) => v.palette === "custom" },
    { key: "fringe", label: "Fringe", type: "range", group: "Colour", min: 0, max: 2, step: 0.05, default: 1 },
    { key: "breath", label: "Breath", type: "range", group: "Motion", min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: "ripple", label: "Ripple of light", type: "toggle", group: "Motion", default: true },
    { key: "glow", label: "Glow", type: "range", group: "Grain & finish", min: 0, max: 1.5, step: 0.05, default: 0.5 },
    { key: "grain", label: "Grain", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.05, default: 0.35 },
  ],
  presets: [
    { id: "pearl-moth", name: "Pearl moth", size: "1:1", values: { form: "moth", palette: "pearl", seed: 7, strands: 460 } },
    { id: "ember-orchid", name: "Ember orchid", size: "4:5", values: { form: "orchid", palette: "ember", seed: 12, strands: 520, glow: 0.6 } },
    { id: "glacier-fern", name: "Glacier fern", size: "16:9", values: { form: "fern", palette: "glacier", seed: 3, strands: 480 } },
    { id: "mono-moth", name: "Mono moth", size: "1:1", values: { form: "moth", palette: "mono", seed: 21, strands: 360, glow: 0.3, grain: 0.5 } },
    { id: "violet-orchid", name: "Violet orchid", size: "9:16", values: { form: "orchid", palette: "custom", tint: "#a78bfa", seed: 5, strands: 440 } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og"],
  export: { png: "canvas", webm: true, gif: true, notes: "Stills and loops are drawn from the same function as the preview; the loop is seamless." },
  duration: LIGHT_FORM_LOOP,
  draw,
  component: LightForm,
}
