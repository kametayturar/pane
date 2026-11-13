import type { StudioSpec } from "../schema"
import { draw, getImageMotionDuration, ImageMotion, IMAGE_MOTION_MOTIONS, IMAGE_MOTION_SOURCES, prepareImageMotion } from "../image-motion"

const warm = ["#ece7de", "#d5dde0", "#a9bcc6"]

export const studio: StudioSpec = {
  id: "image-motion",
  name: "Image Motion",
  kind: "image-3d",
  background: "own",
  controls: [
    { key: "image", label: "Your image", type: "image", accept: "image/*", group: "Content" },
    { key: "source", label: "Or a built-in picture", type: "select", group: "Content", default: "lake", options: IMAGE_MOTION_SOURCES.map((s) => ({ id: s.id, label: s.label })), when: (v) => !v.image },
    { key: "motion", label: "Motion", type: "segmented", group: "Motion", default: "orbit", options: IMAGE_MOTION_MOTIONS.map((m) => ({ id: m.id, label: m.label })) },
    { key: "intensity", label: "Intensity", type: "range", group: "Motion", min: 0, max: 1.6, step: 0.05, default: 1 },
    {
      key: "duration", label: "Loop length", type: "segmented", group: "Motion", default: "6",
      options: [{ id: "3", label: "3 s" }, { id: "6", label: "6 s" }, { id: "12", label: "12 s" }],
    },
    { key: "frame", label: "Frame", type: "segmented", group: "Shape", default: "none", options: [{ id: "none", label: "None" }, { id: "phone", label: "Phone" }, { id: "browser", label: "Browser" }] },
    { key: "darkFrame", label: "Dark frame", type: "toggle", group: "Shape", default: true, when: (v) => v.frame === "phone" || v.frame === "browser" },
    { key: "perspective", label: "Perspective", type: "range", group: "Shape", min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: "radius", label: "Corner radius", type: "range", group: "Shape", min: 0, max: 1, step: 0.01, default: 0.28 },
    { key: "size", label: "Size", type: "range", group: "Shape", min: 0.6, max: 1.4, step: 0.01, default: 1 },
    { key: "bg", label: "Background", type: "palette", group: "Colour", min: 2, max: 4, default: [...warm] },
    { key: "angle", label: "Gradient direction", type: "angle", group: "Colour", default: 62 },
    { key: "shadow", label: "Shadow", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: "sheen", label: "Glass sheen", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: "grain", label: "Grain", type: "range", group: "Grain & finish", min: 0, max: 1, step: 0.01, default: 0.35 },
  ],
  presets: [
    { id: "lake-orbit", name: "Lake orbit", size: "16:9", values: { source: "lake", motion: "orbit", frame: "none", intensity: 1, bg: ["#ece7de", "#d5dde0", "#a9bcc6"], angle: 62, shadow: 0.55, grain: 0.35 } },
    { id: "phone-tilt", name: "Phone tilt", size: "4:5", values: { source: "ember", motion: "tilt", frame: "phone", darkFrame: true, intensity: 1, perspective: 0.55, bg: ["#15120f", "#2a1d17", "#5a3a28"], angle: 120, shadow: 0.7, grain: 0.4 } },
    { id: "hills-float", name: "Hills float", size: "1:1", values: { source: "hills", motion: "float", frame: "none", intensity: 1, bg: ["#f3e9d6", "#e6c9a0", "#c9d6e0"], angle: 80, shadow: 0.5, grain: 0.4 } },
    { id: "ledger-push", name: "Ledger push in", size: "16:9", values: { source: "ledger", motion: "push", frame: "browser", darkFrame: false, intensity: 0.9, perspective: 0.45, bg: ["#e8e9ec", "#c9ced6", "#9aa4b4"], angle: 50, shadow: 0.6, grain: 0.3 } },
    { id: "depth-parallax", name: "Depth parallax", size: "16:9", values: { source: "hills", motion: "parallax", frame: "none", intensity: 1, bg: ["#0f1417", "#1b2a30", "#34505a"], angle: 100, shadow: 0.6, grain: 0.4 } },
    { id: "tide-phone", name: "Tide phone", size: "9:16", values: { source: "tide", motion: "float", frame: "phone", darkFrame: false, intensity: 1, bg: ["#dfe8e6", "#b9cfcc", "#86a8a6"], angle: 70, shadow: 0.55, grain: 0.35 } },
  ],
  sizes: ["1:1", "4:5", "16:9", "9:16", "og", "banner"],
  export: {
    png: "canvas",
    webm: true,
    gif: true,
    notes: "Rendered with WebGL2 and copied to the export canvas. Your image stays in the browser. Without WebGL2 a reduced 2D version is drawn. GIFs lose smooth shadows and gradients; prefer WebM.",
  },
  // Video and GIF read this at export time: it follows the Loop length control (3, 6 or 12 seconds).
  get duration() {
    return getImageMotionDuration()
  },
  draw,
  prepare: prepareImageMotion,
  component: ImageMotion,
}
