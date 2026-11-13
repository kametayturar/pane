import type { StudioSpec, Values } from "../schema"
import { draw as drawCube, ColumnCube, LOOP, STILL_T } from "@/components/illustrations/column-cube"

const ACCENT = ["#0060e2", "#e0572b", "#2f8f6b", "#9b6bff", "#f2c14e"]

const base: Values = {
  ink: "#14161c", accent: "#0060e2", bg: "#f6f5f1",
  grid: 9, cut: 5, variance: 0.7, layerHeight: 0.7, found: 6, seed: 4821,
}

export const studio: StudioSpec = {
  id: "column-cube",
  name: "Column Cube",
  kind: "scene",
  background: "own",
  component: ColumnCube,
  controls: [
    { key: "ink", type: "color", label: "Ink", group: "Colour", default: base.ink as string, swatches: ["#14161c", "#0b3d2e", "#3a2a1f", "#f2efe6"] },
    { key: "accent", type: "color", label: "Layer", group: "Colour", default: base.accent as string, swatches: ACCENT },
    { key: "bg", type: "color", label: "Paper", group: "Colour", default: base.bg as string, swatches: ["#f6f5f1", "#ffffff", "#0c0d10", "#141b17"] },
    { key: "grid", type: "range", label: "Columns per side", group: "Shape", min: 5, max: 14, step: 1, default: 9 },
    { key: "variance", type: "range", label: "Height variance", group: "Shape", min: 0, max: 1, step: 0.05, default: 0.7 },
    { key: "cut", type: "range", label: "Cut size", group: "Shape", min: 2, max: 7, step: 1, default: 5 },
    { key: "layerHeight", type: "range", label: "Layer thickness", group: "Shape", min: 0.45, max: 1.1, step: 0.05, default: 0.7 },
    { key: "found", type: "range", label: "Cells found", group: "Content", min: 1, max: 20, step: 1, default: 6 },
    { key: "seed", type: "seed", label: "Seed", default: 4821 },
  ],
  presets: [
    { id: "survey", name: "Survey", values: { ...base } },
    { id: "night", name: "Night scan", values: { ...base, ink: "#f2efe6", accent: "#6aa4ff", bg: "#0c0d10", seed: 77, found: 5 } },
    { id: "deep", name: "Deep cut", values: { ...base, grid: 12, cut: 6, variance: 0.9, layerHeight: 0.9, found: 10, seed: 311, accent: "#e0572b" } },
    { id: "slab", name: "Low slab", values: { ...base, grid: 7, cut: 3, variance: 0.25, layerHeight: 0.6, found: 4, seed: 9, accent: "#2f8f6b", ink: "#0b3d2e", bg: "#f1f3ee" } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og", "banner"],
  export: { png: "canvas", webm: true, gif: true, notes: "The scan, the lift and the return all finish before the loop ends, so videos are seamless. Still images show the moment just after the scan." },
  duration: LOOP,
  draw(ctx, w, h, t, values) {
    const v = values as Values
    drawCube(ctx, w, h, t, {
      grid: Number(v.grid), cut: Number(v.cut), variance: Number(v.variance), layerHeight: Number(v.layerHeight),
      found: Number(v.found), seed: Number(v.seed), ink: String(v.ink), accent: String(v.accent), bg: String(v.bg), fill: true,
    })
  },
}

export { STILL_T }
