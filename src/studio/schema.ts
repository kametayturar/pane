// Pane Studio – the contract between a piece and the Studio page.
//
// A piece keeps its own React props. A sibling file `src/studio/pieces/<slug>.studio.ts` exports
// `studio: StudioSpec`, which the Studio reads to draw its controls, presets and export options.
// Pieces without a spec still appear in the Studio with the generic controls (speed, paused, accent).
import type * as React from "react"

export type Values = Record<string, unknown>

export type SizeId = "1:1" | "4:5" | "16:9" | "9:16" | "og" | "banner"

export const SIZES: Record<SizeId, { w: number; h: number; label: string }> = {
  "1:1": { w: 1080, h: 1080, label: "Square" },
  "4:5": { w: 1080, h: 1350, label: "Portrait" },
  "16:9": { w: 1920, h: 1080, label: "Wide" },
  "9:16": { w: 1080, h: 1920, label: "Story" },
  og: { w: 1200, h: 630, label: "Link card" },
  banner: { w: 1500, h: 500, label: "Banner" },
}

type Base = {
  key: string
  label: string
  group?: "Colour" | "Shape" | "Motion" | "Grain & finish" | "Content"
  /** Show the control only when this returns true. */
  when?: (v: Values) => boolean
}

export type Control = Base &
  (
    | { type: "range"; min: number; max: number; step?: number; default: number; unit?: string }
    | { type: "color"; default: string; swatches?: string[] }
    | { type: "palette"; default: string[]; min?: number; max?: number }
    | { type: "select" | "segmented"; options: { id: string; label: string }[]; default: string }
    | { type: "toggle"; default: boolean }
    | { type: "text"; default: string; max?: number }
    | { type: "seed"; default: number }
    | { type: "angle"; default: number }
    | { type: "image"; accept: "image/*" }
  )

export type Preset = { id: string; name: string; values: Values; size?: SizeId }

export type ExportCaps = {
  /** How a still is made: from the piece's own canvas, from its SVG, or by capturing the DOM. */
  png: "canvas" | "svg" | "dom" | false
  svg?: boolean
  webm?: boolean
  gif?: boolean
  /** Plain-language limits, shown as one muted line (e.g. "Glass blur is not captured in PNG"). */
  notes?: string
}

export type StudioSpec = {
  /** The registry slug. */
  id: string
  name: string
  kind: "gradient" | "glow-card" | "line-art" | "scene" | "faux-ui" | "image-3d" | "icon"
  controls: Control[]
  presets: Preset[]
  sizes?: SizeId[]
  export: ExportCaps
  /** Seconds in one seamless loop, for video and GIF. Leave out for stills only. */
  duration?: number
  /** "own": the piece paints the whole artboard. "backdrop": it sits on the Pane Backdrop. */
  background?: "own" | "backdrop"
  /**
   * Canvas pieces: a pure drawing function, so the exporter can render any frame at any size
   * without the DOM. t is in seconds; values hold every control's value.
   */
  draw?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Values) => void
  /** SVG pieces: return the full <svg> markup for a frame, colours resolved (no CSS variables). */
  svg?: (w: number, h: number, t: number, values: Values) => string
  /** Awaited before an export, e.g. to finish decoding an uploaded image. */
  prepare?: (values: Values) => Promise<void>
  /** The React piece the Studio renders live. Receives StudioPieceProps. */
  component?: React.ComponentType<StudioPieceProps>
}

/** Props the Studio passes a piece. Everything is optional, so the piece still works on its own. */
export type StudioPieceProps = {
  speed?: number
  paused?: boolean
  accent?: string
  values?: Values
  seed?: number
  /** Artboard size in px, set by the Studio. */
  size?: { w: number; h: number }
  /** Seconds. When set, the piece renders that exact frame and runs no clock of its own. */
  time?: number
  canvasRef?: React.Ref<HTMLCanvasElement>
}

/** Defaults of a spec as a Values object. */
export function defaults(spec: StudioSpec): Values {
  const v: Values = {}
  for (const c of spec.controls) if ("default" in c) v[c.key] = c.default
  return v
}

/** A small deterministic PRNG (mulberry32), so a seed always draws the same picture. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
