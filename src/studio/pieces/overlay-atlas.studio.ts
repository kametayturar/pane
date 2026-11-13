import * as React from "react"

import type { StudioSpec, StudioPieceProps } from "../schema"
import { OverlayAtlas, type OverlayKind } from "@/components/blocks/overlay-atlas"

const KINDS = ["modal", "popover", "tooltip", "toast", "sheet", "drawer"]

function Piece({ speed, paused, values }: StudioPieceProps) {
  const v = values ?? {}
  const h = String(v.highlight ?? "all")
  return React.createElement(OverlayAtlas, {
    speed,
    paused,
    compact: v.compact === true,
    highlight: KINDS.includes(h) ? (h as OverlayKind) : undefined,
  })
}

export const studio: StudioSpec = {
  id: "overlay-atlas",
  name: "Overlay Atlas",
  kind: "faux-ui",
  background: "own",
  sizes: ["16:9", "1:1", "4:5"],
  export: { png: "dom", notes: "Stills only. Glass blur is not captured in PNG." },
  component: Piece,
  controls: [
    {
      key: "highlight",
      type: "select",
      label: "Focus on",
      group: "Content",
      default: "all",
      options: [{ id: "all", label: "All six" }, ...KINDS.map((k) => ({ id: k, label: k[0].toUpperCase() + k.slice(1) }))],
    },
    { key: "compact", type: "toggle", label: "Names only", group: "Content", default: false },
    { key: "speed", type: "range", label: "Speed", group: "Motion", min: 0.5, max: 2, step: 0.1, default: 1 },
  ],
  presets: [
    { id: "all", name: "All six", values: {}, size: "16:9" },
    { id: "modal", name: "Modal in focus", values: { highlight: "modal" }, size: "16:9" },
    { id: "toast", name: "Toast in focus", values: { highlight: "toast" }, size: "16:9" },
    { id: "names", name: "Names only", values: { compact: true }, size: "16:9" },
  ],
}
