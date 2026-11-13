import type { StudioSpec, Values } from "../schema"
import { PeekIcon, PEEK_LOOP, peekSvg } from "@/components/illustrations/peek-icon"

const base: Values = {
  layout: "one", character: "atlas", background: "clock", tile: "#2f5bea", body: "#ff8a3d", glyph: "#e8edff",
  ink: "#1d1a1a", paper: "#f4f1ea", peek: "br", tilt: 10, outline: 3.4, shadow: 1, roundness: 5, motion: "play", seed: 7,
}

const PEEKS = [
  { id: "br", label: "Bottom right" }, { id: "bl", label: "Bottom left" }, { id: "tr", label: "Top right" }, { id: "tl", label: "Top left" },
  { id: "b", label: "Bottom" }, { id: "t", label: "Top" }, { id: "l", label: "Left" }, { id: "r", label: "Right" },
]

export const studio: StudioSpec = {
  id: "peek-icon",
  name: "Peek Icon",
  kind: "icon",
  background: "own",
  component: PeekIcon,
  duration: PEEK_LOOP,
  sizes: ["1:1", "16:9", "4:5", "og", "banner", "9:16"],
  export: { png: "svg", svg: true, webm: true, gif: true, notes: "Pure vector, no text. The character ducks out of sight at the end of the loop, so loops are seamless." },
  svg: (w, h, t, values) => peekSvg(w, h, t, values, Number(values.seed) || 7),
  controls: [
    { key: "layout", type: "segmented", label: "Layout", group: "Content", default: "one", options: [{ id: "one", label: "One icon" }, { id: "set", label: "The set" }] },
    { key: "character", type: "segmented", label: "Character", group: "Content", default: "atlas", when: (v) => v.layout !== "set", options: [{ id: "atlas", label: "Atlas" }, { id: "quill", label: "Quill" }, { id: "sage", label: "Sage" }] },
    { key: "background", type: "select", label: "What the app does", group: "Content", default: "clock", when: (v) => v.layout !== "set", options: [{ id: "clock", label: "Clock" }, { id: "mail", label: "Mail" }, { id: "bolt", label: "Bolt" }, { id: "search", label: "Search" }, { id: "none", label: "Nothing" }] },
    { key: "tile", type: "color", label: "Tile", group: "Colour", default: "#2f5bea", when: (v) => v.layout !== "set", swatches: ["#2f5bea", "#f4b942", "#1f6b52", "#6a4cff", "#e5484d", "#1d1a1a"] },
    { key: "body", type: "color", label: "Character", group: "Colour", default: "#ff8a3d", when: (v) => v.layout !== "set", swatches: ["#ff8a3d", "#fff6e3", "#ffd6c2", "#c9b8ff", "#9fe0bd"] },
    { key: "glyph", type: "color", label: "Background shape", group: "Colour", default: "#e8edff", when: (v) => v.layout !== "set", swatches: ["#e8edff", "#ffffff", "#c6eed7", "#ffe9a8", "#1d1a1a"] },
    { key: "ink", type: "color", label: "Outline", group: "Colour", default: "#1d1a1a", swatches: ["#1d1a1a", "#0b1230", "#2a1608", "#000000"] },
    { key: "paper", type: "color", label: "Artboard", group: "Colour", default: "#f4f1ea", swatches: ["#f4f1ea", "#ffffff", "#e7ebf5", "#14151a", "#0c0d10"] },
    { key: "peek", type: "select", label: "Peeks from", group: "Shape", default: "br", options: PEEKS },
    { key: "tilt", type: "range", label: "Head tilt", group: "Shape", min: -10, max: 40, step: 1, default: 10, unit: "°" },
    { key: "outline", type: "range", label: "Outline weight", group: "Shape", min: 1.5, max: 6.5, step: 0.1, default: 3.4 },
    { key: "shadow", type: "range", label: "Shadow", group: "Shape", min: 0, max: 1, step: 0.05, default: 1 },
    { key: "roundness", type: "range", label: "Corner shape", group: "Shape", min: 3.5, max: 8, step: 0.1, default: 5 },
    { key: "motion", type: "segmented", label: "Motion", group: "Motion", default: "play", options: [{ id: "play", label: "Peek in" }, { id: "still", label: "Still" }] },
    { key: "seed", type: "seed", label: "Seed", default: 7 },
  ],
  presets: [
    { id: "atlas", name: "Atlas, clock", values: { ...base } },
    { id: "quill", name: "Quill, mail", values: { ...base, character: "quill", background: "mail", tile: "#f4b942", body: "#fff6e3", glyph: "#ffffff", peek: "bl", seed: 21 } },
    { id: "sage", name: "Sage, search", values: { ...base, character: "sage", background: "search", tile: "#1f6b52", body: "#ffd6c2", glyph: "#c6eed7", peek: "b", seed: 5 } },
    { id: "spark", name: "Spark at night", values: { ...base, character: "atlas", background: "bolt", tile: "#6a4cff", body: "#ffb35c", glyph: "#ffe27a", paper: "#14151a", peek: "tr", tilt: 16, seed: 33 } },
    { id: "set", name: "The set", values: { ...base, layout: "set", seed: 7 }, size: "16:9" },
  ],
}
