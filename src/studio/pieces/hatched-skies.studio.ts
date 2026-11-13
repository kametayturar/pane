import { draw, HatchedSkies, LOOP } from "@/components/illustrations/hatched-skies"
import type { StudioSpec } from "@/studio/schema"

export const studio: StudioSpec = {
  id: "hatched-skies",
  name: "Hatched Skies",
  kind: "line-art",
  background: "own",
  duration: LOOP,
  sizes: ["1:1", "4:5", "16:9", "og", "banner"],
  controls: [
    { key: "ink", label: "Ink", type: "color", group: "Colour", default: "#1b1d22", swatches: ["#1b1d22", "#2b3a67", "#f2efe6", "#5b3a29"] },
    { key: "accent", label: "Front cloud", type: "color", group: "Colour", default: "#0060e2", swatches: ["#0060e2", "#e5484d", "#d9a441", "#2f9e5b"] },
    { key: "paper", label: "Paper", type: "color", group: "Colour", default: "#fbfaf7", swatches: ["#fbfaf7", "#eef1f6", "#14161b", "#f1e8d8"] },
    { key: "clouds", label: "Clouds", type: "range", group: "Shape", min: 3, max: 7, step: 1, default: 5 },
    { key: "spacing", label: "Tick gap", type: "range", group: "Shape", min: 2.4, max: 8, step: 0.1, default: 3.4, unit: "px" },
    { key: "weight", label: "Line weight", type: "range", group: "Shape", min: 0.6, max: 2.2, step: 0.05, default: 0.95, unit: "px" },
    { key: "swap", label: "Density swap", type: "range", group: "Motion", min: 0, max: 1, step: 0.05, default: 1 },
    { key: "drift", label: "Sway", type: "range", group: "Motion", min: 0, max: 3, step: 0.1, default: 1.6, unit: "px/s" },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 7 },
  ],
  presets: [
    { id: "paper", name: "Paper", values: { ink: "#1b1d22", accent: "#0060e2", paper: "#fbfaf7", seed: 7 } },
    { id: "blueprint", name: "Blueprint", values: { ink: "#dfe8ff", accent: "#ffffff", paper: "#1c2f6b", spacing: 3, weight: 0.9, seed: 21 } },
    { id: "dusk", name: "Dusk", values: { ink: "#f2efe6", accent: "#e5784d", paper: "#14161b", clouds: 6, seed: 3 } },
    { id: "fine", name: "Fine", values: { ink: "#2b2b2b", accent: "#2f9e5b", paper: "#f1e8d8", spacing: 2.6, weight: 0.7, clouds: 7, seed: 12 }, size: "16:9" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "The headline is page text and is not part of the export." },
  draw,
  component: HatchedSkies,
}
