import type { StudioSpec, Values } from "../schema"
import { draw as drawRibbon, DashRibbon, LOOP } from "@/components/illustrations/dash-ribbon"

const INK = ["#14161c", "#0b3d2e", "#3a2a1f", "#f2efe6"]
const ACCENT = ["#0060e2", "#e0572b", "#2f8f6b", "#9b6bff", "#f2c14e"]

const base: Values = {
  ink: "#14161c", accent: "#0060e2", bg: "#f6f5f1",
  rows: 17, amplitude: 1, variance: 0.6, thickness: 1, accentShare: 3, row: 7, drift: 1, seed: 4821,
}

export const studio: StudioSpec = {
  id: "dash-ribbon",
  name: "Dash Ribbon",
  kind: "line-art",
  background: "own",
  component: DashRibbon,
  controls: [
    { key: "ink", type: "color", label: "Ink", group: "Colour", default: base.ink as string, swatches: INK },
    { key: "accent", type: "color", label: "Accent", group: "Colour", default: base.accent as string, swatches: ACCENT },
    { key: "bg", type: "color", label: "Paper", group: "Colour", default: base.bg as string, swatches: ["#f6f5f1", "#ffffff", "#0c0d10", "#141b17"] },
    { key: "rows", type: "range", label: "Rows", group: "Shape", min: 6, max: 36, step: 1, default: 17 },
    { key: "amplitude", type: "range", label: "Wave height", group: "Shape", min: 0.2, max: 1.8, step: 0.05, default: 1 },
    { key: "variance", type: "range", label: "Dash length variance", group: "Shape", min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: "thickness", type: "range", label: "Dash weight", group: "Shape", min: 0.4, max: 1.8, step: 0.05, default: 1 },
    { key: "accentShare", type: "range", label: "Accent share", group: "Shape", min: 0, max: 8, step: 0.5, default: 3, unit: "%" },
    { key: "row", type: "range", label: "Traced row", group: "Content", min: 0, max: 35, step: 1, default: 7 },
    {
      key: "drift", type: "segmented", label: "Wave", group: "Motion", default: "1",
      options: [{ id: "0", label: "Still" }, { id: "1", label: "Slow" }, { id: "2", label: "Rolling" }],
    },
    { key: "seed", type: "seed", label: "Seed", default: 4821 },
  ],
  presets: [
    { id: "ink", name: "Ink on paper", values: { ...base } },
    { id: "night", name: "Night run", values: { ...base, ink: "#f2efe6", accent: "#6aa4ff", bg: "#0c0d10", accentShare: 2, seed: 77, row: 9 } },
    { id: "fine", name: "Fine rows", values: { ...base, rows: 30, thickness: 0.7, amplitude: 0.7, variance: 0.45, accentShare: 1.5, seed: 311, row: 13, accent: "#e0572b" } },
    { id: "swell", name: "Swell", values: { ...base, rows: 11, thickness: 1.35, amplitude: 1.55, variance: 0.85, seed: 9, row: 4, accent: "#2f8f6b", ink: "#0b3d2e", bg: "#f1f3ee" } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og", "banner"],
  export: { png: "canvas", webm: true, gif: true, notes: "The run, the light settling and the fade all return to the first frame, so loops are seamless." },
  duration: LOOP,
  draw(ctx, w, h, t, values) {
    const v = values as Values
    drawRibbon(ctx, w, h, t, {
      rows: Number(v.rows), amplitude: Number(v.amplitude), variance: Number(v.variance), thickness: Number(v.thickness),
      accentShare: Number(v.accentShare), row: Number(v.row), drift: Number(v.drift), seed: Number(v.seed),
      ink: String(v.ink), accent: String(v.accent), bg: String(v.bg),
    })
  },
}
