import * as React from "react"

import { ControlBento, type ControlBentoTileId } from "@/components/blocks/control-bento"
import type { StudioPieceProps, StudioSpec } from "../schema"

const ALL: ControlBentoTileId[] = ["range", "toggle", "stepper", "search", "checklist", "player"]

function Piece({ values = {}, accent, paused }: StudioPieceProps) {
  const v = values as Record<string, unknown>
  const tiles = ALL.filter((t) => v[`tile_${t}`] !== false)
  return React.createElement(
    "div",
    { style: { width: "100%", maxWidth: 1040, margin: "0 auto" } },
    React.createElement(ControlBento, {
      tiles,
      theme: (v.theme as "auto" | "light" | "dark") ?? "auto",
      accent: (typeof v.accent === "string" ? v.accent : accent) || undefined,
      density: (v.density as "comfortable" | "compact") ?? "comfortable",
      focus: v.focus && v.focus !== "none" ? (v.focus as ControlBentoTileId) : undefined,
      autoplay: !(paused || v.still),
    }),
  )
}

export const studio: StudioSpec = {
  id: "control-bento",
  name: "Control Bento",
  kind: "faux-ui",
  background: "own",
  sizes: ["16:9", "og", "4:5", "1:1"],
  controls: [
    { key: "theme", label: "Theme", type: "segmented", group: "Colour", default: "auto", options: [{ id: "auto", label: "Auto" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }] },
    { key: "accent", label: "Accent", type: "color", group: "Colour", default: "#0060e2", swatches: ["#0060e2", "#111111", "#6d5bd0", "#0f7a5c", "#c2410c"] },
    { key: "density", label: "Row height", type: "segmented", group: "Shape", default: "comfortable", options: [{ id: "comfortable", label: "Comfortable" }, { id: "compact", label: "Compact" }] },
    { key: "tile_range", label: "Covers chart", type: "toggle", group: "Content", default: true },
    { key: "tile_toggle", label: "Switch", type: "toggle", group: "Content", default: true },
    { key: "tile_stepper", label: "Stepper", type: "toggle", group: "Content", default: true },
    { key: "tile_search", label: "Search", type: "toggle", group: "Content", default: true },
    { key: "tile_checklist", label: "Checklist", type: "toggle", group: "Content", default: true },
    { key: "tile_player", label: "Player", type: "toggle", group: "Content", default: true },
    { key: "focus", label: "Hold a tile forward", type: "select", group: "Motion", default: "none", options: [{ id: "none", label: "None, play the demo" }, { id: "range", label: "Covers" }, { id: "stepper", label: "Stepper" }, { id: "toggle", label: "Switch" }, { id: "search", label: "Search" }, { id: "checklist", label: "Checklist" }, { id: "player", label: "Player" }] },
    { key: "still", label: "Stop the demo", type: "toggle", group: "Motion", default: false },
  ],
  presets: [
    { id: "all", name: "All six", values: { still: true }, size: "16:9" },
    { id: "dark", name: "Dark", values: { theme: "dark", accent: "#4d8dff", still: true }, size: "16:9" },
    { id: "small", name: "Four tiles", values: { tile_search: false, tile_checklist: false, still: true }, size: "og" },
    { id: "ink", name: "Ink", values: { accent: "#111111", density: "compact", focus: "range", still: true }, size: "og" },
  ],
  export: { png: "dom", notes: "Capture is of the page DOM. Hold a tile forward or stop the demo for a clean still." },
  component: Piece,
}
