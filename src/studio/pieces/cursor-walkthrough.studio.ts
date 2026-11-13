import type { StudioSpec } from "../schema"
import { CursorWalkthrough, WALKTHROUGH_SECONDS, draw } from "@/components/motion/cursor-walkthrough"

const GUESTS = [
  { id: "19:00", label: "19:00" },
  { id: "19:30", label: "19:30" },
  { id: "20:00", label: "20:00" },
]

export const studio: StudioSpec = {
  id: "cursor-walkthrough",
  name: "Cursor Walkthrough",
  kind: "faux-ui",
  background: "own",
  duration: WALKTHROUGH_SECONDS,
  sizes: ["1:1", "16:9", "4:5", "og"],
  controls: [
    { key: "mode", label: "Theme", type: "segmented", group: "Colour", default: "light", options: [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }] },
    { key: "accent", label: "Accent", type: "color", group: "Colour", default: "#0060e2", swatches: ["#0060e2", "#111111", "#6d5bd0", "#0f7a5c", "#c2410c"] },
    { key: "cursor", label: "Pointer", type: "segmented", group: "Shape", default: "arrow", options: [{ id: "arrow", label: "Arrow" }, { id: "large", label: "Large" }, { id: "touch", label: "Touch" }] },
    { key: "label", label: "Name tag", type: "text", group: "Content", default: "", max: 14 },
    { key: "venue", label: "Venue", type: "text", group: "Content", default: "Harbor & Finch", max: 22 },
    { key: "guest", label: "Guest", type: "text", group: "Content", default: "Ines Marlow", max: 22 },
    { key: "at", label: "Time", type: "select", group: "Content", default: "19:30", options: GUESTS },
    { key: "seed", label: "Path", type: "seed", group: "Motion", default: 7 },
  ],
  presets: [
    { id: "booking", name: "Booking", values: {} },
    { id: "night", name: "Night", values: { mode: "dark", accent: "#4d8dff", at: "20:00", guest: "Theo Brandt" }, size: "16:9" },
    { id: "named", name: "Named cursor", values: { label: "Ines", cursor: "large", accent: "#111111" }, size: "1:1" },
    { id: "touch", name: "Touch", values: { cursor: "touch", accent: "#0f7a5c", venue: "Salt & Ember", guest: "Mara Voss", at: "19:00" }, size: "4:5" },
    { id: "mono", name: "Ink", values: { accent: "#111111", seed: 21, venue: "Quiet Table", guest: "Noor Aziz" }, size: "og" },
  ],
  export: { png: "canvas", webm: true, gif: true, notes: "Drawn on a canvas from the same timeline the page plays. Glass and Mono styles are page-only." },
  draw,
  component: CursorWalkthrough,
}
