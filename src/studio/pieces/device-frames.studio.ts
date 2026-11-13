import * as React from "react"

import { DeviceFrames, type DeviceCrop, type DeviceKind, type DeviceTheme } from "@/components/ui/device-frames"
import type { StudioPieceProps, StudioSpec } from "../schema"

function Piece({ values = {}, paused }: StudioPieceProps) {
  const v = values as Record<string, unknown>
  return React.createElement(
    "div",
    { style: { width: "100%", maxWidth: 980, margin: "0 auto" } },
    React.createElement(DeviceFrames, {
      kind: (v.kind as DeviceKind) ?? "pair",
      crop: (v.crop as DeviceCrop) ?? "bottom",
      bleed: typeof v.bleed === "number" ? v.bleed : 0.2,
      theme: (v.theme as DeviceTheme) ?? "auto",
      url: typeof v.url === "string" && v.url ? v.url : undefined,
      scale: typeof v.zoom === "number" ? v.zoom : 1,
      approved: paused || v.still ? true : undefined,
    }),
  )
}

export const studio: StudioSpec = {
  id: "device-frames",
  name: "Device Frames",
  kind: "faux-ui",
  background: "own",
  controls: [
    { key: "kind", label: "Devices", type: "segmented", group: "Shape", options: [{ id: "pair", label: "Pair" }, { id: "browser", label: "Browser" }, { id: "phone", label: "Phone" }], default: "pair" },
    { key: "crop", label: "Crop", type: "select", group: "Shape", options: [{ id: "bottom", label: "Off the bottom" }, { id: "right", label: "Off the right" }, { id: "fade", label: "Fade out the foot" }, { id: "none", label: "Whole" }], default: "bottom", when: (v) => v.kind !== "pair" },
    { key: "bleed", label: "Bleed", type: "range", group: "Shape", min: 0, max: 0.45, step: 0.01, default: 0.2, when: (v) => v.kind !== "pair" },
    { key: "zoom", label: "Zoom", type: "range", group: "Shape", min: 0.8, max: 1.3, step: 0.01, default: 1 },
    { key: "theme", label: "Theme", type: "segmented", group: "Colour", options: [{ id: "auto", label: "Auto" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }], default: "auto" },
    { key: "url", label: "Address", type: "text", group: "Content", default: "northwind.co/payouts", max: 32 },
    { key: "still", label: "Hold the approved frame", type: "toggle", group: "Motion", default: false },
  ],
  presets: [
    { id: "pair", name: "Browser and phone", values: { kind: "pair", crop: "bottom", bleed: 0.2, zoom: 1, theme: "auto", url: "northwind.co/payouts", still: true }, size: "og" },
    { id: "hero", name: "Browser off the right", values: { kind: "browser", crop: "right", bleed: 0.22, zoom: 1, theme: "auto", url: "northwind.co/payouts", still: true }, size: "16:9" },
    { id: "foot", name: "Faded foot", values: { kind: "browser", crop: "fade", bleed: 0, zoom: 1, theme: "auto", url: "northwind.co/payouts", still: true }, size: "16:9" },
    { id: "phone", name: "Lone phone", values: { kind: "phone", crop: "bottom", bleed: 0.18, zoom: 1, theme: "auto", url: "", still: true }, size: "4:5" },
    { id: "dark", name: "Dark pair", values: { kind: "pair", crop: "bottom", bleed: 0.2, zoom: 1, theme: "dark", url: "northwind.co/payouts", still: true }, size: "og" },
  ],
  sizes: ["og", "16:9", "4:5", "1:1"],
  export: { png: "dom", notes: "Capture is of the page DOM; the approved frame is used when held." },
  component: Piece,
}
