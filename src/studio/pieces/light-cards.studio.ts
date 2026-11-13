import type { StudioSpec } from "../schema"
import { LightCards, LIGHT_CARDS_LOOP, draw as paint } from "@/components/blocks/light-cards"

/**
 * On wide artboards the piece's own layout is one row of four, which leaves the cards at under half the height.
 * Lay out a 2 by 2 grid in a centred block of the same height instead, so the cards fill the artboard.
 */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Parameters<typeof paint>[4]) {
  const r = w / h
  if (r < 1.5 || r > 2.2) return paint(ctx, w, h, t, values)
  const vw = Math.round(h * 1.4)
  ctx.save()
  ctx.fillStyle = "#050507"
  ctx.fillRect(0, 0, w, h)
  ctx.translate(Math.round((w - vw) / 2), 0)
  paint(ctx, vw, h, t, values)
  ctx.restore()
}

export const studio: StudioSpec = {
  id: "light-cards",
  name: "Light Cards",
  kind: "glow-card",
  background: "own",
  controls: [
    { key: "t1", label: "Card 1", type: "text", group: "Content", default: "Trace every run", max: 40 },
    { key: "t2", label: "Card 2", type: "text", group: "Content", default: "Review before it ships", max: 40 },
    { key: "t3", label: "Card 3", type: "text", group: "Content", default: "Budgets that hold", max: 40 },
    { key: "t4", label: "Card 4", type: "text", group: "Content", default: "One memory, many agents", max: 40 },
    { key: "n1", label: "Note 1", type: "text", group: "Content", default: "Replay any step with the exact inputs it saw.", max: 70 },
    { key: "n2", label: "Note 2", type: "text", group: "Content", default: "Atlas drafts, Sage checks, you approve.", max: 70 },
    { key: "n3", label: "Note 3", type: "text", group: "Content", default: "Spend stops at the limit you set per team.", max: 70 },
    { key: "n4", label: "Note 4", type: "text", group: "Content", default: "What Quill learns on Monday, Atlas knows by lunch.", max: 70 },
    { key: "strands", label: "Strands", type: "range", group: "Shape", min: 60, max: 400, step: 10, default: 220 },
    { key: "seed", label: "Seed", type: "seed", group: "Shape", default: 7 },
    {
      key: "palette", label: "Palette", type: "select", group: "Colour", default: "pearl",
      options: [{ id: "pearl", label: "Pearl" }, { id: "ember", label: "Ember" }, { id: "glacier", label: "Glacier" }, { id: "mono", label: "Mono" }, { id: "custom", label: "Custom" }],
    },
    { key: "tint", label: "Fringe colour", type: "color", group: "Colour", default: "#ff5c7c", swatches: ["#ff5c7c", "#ff8034", "#58ecda", "#a78bfa"], when: (v) => v.palette === "custom" },
    {
      key: "lit", label: "Lit card", type: "select", group: "Motion", default: "tour",
      options: [{ id: "tour", label: "Tour" }, { id: "1", label: "Card 1" }, { id: "2", label: "Card 2" }, { id: "3", label: "Card 3" }, { id: "4", label: "Card 4" }, { id: "all", label: "All" }],
    },
    { key: "glow", label: "Glow", type: "range", group: "Grain & finish", min: 0, max: 1.5, step: 0.05, default: 0.6 },
    { key: "grain", label: "Grain", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.05, default: 0.3 },
  ],
  presets: [
    { id: "pearl-tour", name: "Pearl tour", size: "16:9", values: { palette: "pearl", seed: 7 } },
    { id: "ember-all", name: "Ember, all lit", size: "1:1", values: { palette: "ember", lit: "all", seed: 12, glow: 0.8 } },
    { id: "glacier-one", name: "Glacier, one lit", size: "4:5", values: { palette: "glacier", lit: "2", seed: 3 } },
    { id: "mono-tour", name: "Mono", size: "16:9", values: { palette: "mono", seed: 21, grain: 0.5, glow: 0.4 } },
    { id: "violet", name: "Violet", size: "1:1", values: { palette: "custom", tint: "#a78bfa", lit: "all", seed: 5, strands: 280 } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og"],
  export: { png: "canvas", webm: true, gif: true, notes: "Stills and loops come from the same function as the preview; the tour loops seamlessly." },
  duration: LIGHT_CARDS_LOOP,
  draw,
  component: LightCards,
}
