import type { StudioSpec } from "../schema"
import { DashBurst, DASH_BURST_LOOP, dashBurstSvg } from "@/components/illustrations/dash-burst"

export const studio: StudioSpec = {
  id: "dash-burst",
  name: "Dash Burst",
  kind: "line-art",
  background: "own",
  duration: DASH_BURST_LOOP,
  sizes: ["1:1", "4:5", "16:9", "9:16", "og", "banner"],
  export: { png: "svg", svg: true, webm: true, gif: true, notes: "Text in the centre uses Inter if installed, otherwise the system sans." },
  component: DashBurst,
  svg: (w, h, t, values) => dashBurstSvg(w, h, t, values),
  controls: [
    { key: "tone", type: "segmented", label: "Surface", group: "Colour", default: "paper", options: [{ id: "paper", label: "Paper" }, { id: "ink", label: "Ink" }, { id: "clear", label: "Clear" }] },
    { key: "accent", type: "color", label: "Burst colour", group: "Colour", default: "#0060e2", swatches: ["#0060e2", "#e5484d", "#2f9e5b", "#d97706", "#111111"] },
    { key: "count", type: "range", label: "Dashes", group: "Shape", min: 24, max: 120, step: 1, default: 60 },
    { key: "inner", type: "range", label: "Centre hole", group: "Shape", min: 0.3, max: 0.62, step: 0.01, default: 0.46 },
    { key: "width", type: "range", label: "Dash weight", group: "Shape", min: 1.2, max: 6, step: 0.1, default: 2.6 },
    { key: "taper", type: "range", label: "Weight follows value", group: "Shape", min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: "rhythm", type: "range", label: "Roughness", group: "Shape", min: 0, max: 1, step: 0.05, default: 0.35 },
    { key: "burst", type: "range", label: "Burst strength", group: "Motion", min: 0, max: 1.5, step: 0.05, default: 1 },
    { key: "fromPeak", type: "toggle", label: "Burst from the peak", group: "Motion", default: true },
    { key: "sector", type: "angle", label: "Burst direction", group: "Motion", default: 40, when: (v) => v.fromPeak === false },
    { key: "showNumber", type: "toggle", label: "Centre number", group: "Content", default: true },
    { key: "unit", type: "text", label: "Unit", group: "Content", default: "tokens / min", max: 24, when: (v) => v.showNumber !== false },
    { key: "caption", type: "text", label: "Caption", group: "Content", default: "Last 60 minutes", max: 32, when: (v) => v.showNumber !== false },
    { key: "seed", type: "seed", label: "Seed", default: 4821 },
  ],
  presets: [
    { id: "tokens", name: "Tokens per minute", values: { tone: "paper", count: 60, inner: 0.46, taper: 0.5, rhythm: 0.35, burst: 1, seed: 4821 } },
    { id: "latency", name: "Latency by region", values: { tone: "paper", count: 48, inner: 0.5, taper: 0.9, rhythm: 0.2, burst: 0.8, width: 3.4, unit: "ms p95", caption: "Last 48 regions", seed: 17 } },
    { id: "quiet", name: "Quiet hours", values: { tone: "paper", count: 96, inner: 0.4, taper: 0.2, rhythm: 0.6, burst: 0.5, width: 1.8, accent: "#111111", seed: 903 } },
    { id: "spike", name: "Spike", values: { tone: "ink", count: 72, inner: 0.44, taper: 0.6, rhythm: 0.45, burst: 1.4, width: 2.8, accent: "#e5484d", seed: 2207 }, size: "16:9" },
  ],
}
