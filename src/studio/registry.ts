// Discovery of Studio specs, shared tables, and the state <-> URL hash mapping.
import { defaults, SIZES, type Control, type SizeId, type StudioSpec, type Values } from "./schema"

type SpecModule = { studio?: StudioSpec }
const FILES = import.meta.glob<SpecModule>("./pieces/*.studio.ts*")

export async function loadSpecs(): Promise<StudioSpec[]> {
  const mods = await Promise.all(
    Object.entries(FILES).map(async ([path, load]) => {
      try {
        return (await load()).studio
      } catch (e) {
        console.error(`Studio: could not load ${path}`, e)
        return undefined
      }
    }),
  )
  return mods.filter((s): s is StudioSpec => !!s).sort((a, b) => a.name.localeCompare(b.name))
}

export const KIND_ORDER: { id: StudioSpec["kind"]; label: string }[] = [
  { id: "gradient", label: "Gradients" },
  { id: "glow-card", label: "Light-painted" },
  { id: "line-art", label: "Line art" },
  { id: "scene", label: "Scenes" },
  { id: "icon", label: "Icons" },
  { id: "faux-ui", label: "Faux UI" },
  { id: "image-3d", label: "3D from image" },
]

export type SizeKey = SizeId | "custom"
export const SIZE_ORDER: { id: SizeKey; label: string }[] = [
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "og", label: "Link card" },
  { id: "banner", label: "Banner" },
  { id: "custom", label: "Custom" },
]

export const MIN_SIDE = 64
export const MAX_SIDE = 4096
export const clampSide = (n: number) => Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(Number.isFinite(n) ? n : 1080)))

export type StudioState = { id: string; values: Values; size: SizeKey; cw: number; ch: number }

export function dims(s: Pick<StudioState, "size" | "cw" | "ch">): { w: number; h: number } {
  return s.size === "custom" ? { w: clampSide(s.cw), h: clampSide(s.ch) } : SIZES[s.size]
}

export function allowedSizes(spec: StudioSpec): SizeId[] {
  return spec.sizes?.length ? spec.sizes : (Object.keys(SIZES) as SizeId[])
}

export function initialValues(spec: StudioSpec, preset?: Values): Values {
  return { ...defaults(spec), ...(preset ?? {}) }
}

/** The moment a still shows first (and what thumbnails and reduced-motion show). */
export function posterTime(spec: StudioSpec) {
  return spec.duration ? Math.round(spec.duration * 0.35 * 100) / 100 : 0
}

/** Controls currently visible for these values. */
export function visibleControls(spec: StudioSpec, v: Values): Control[] {
  return spec.controls.filter((c) => {
    try {
      return c.when ? c.when(v) : true
    } catch {
      return true
    }
  })
}

/** Only what differs from the defaults, and nothing that lives only on this device (images). */
export function changedValues(spec: StudioSpec, v: Values): Values {
  const base = defaults(spec)
  const out: Values = {}
  for (const c of spec.controls) {
    if (c.type === "image") continue
    if (JSON.stringify(v[c.key]) !== JSON.stringify(base[c.key]) && c.key in v) out[c.key] = v[c.key]
  }
  return out
}

export function samePreset(spec: StudioSpec, v: Values, preset: Values) {
  const want = initialValues(spec, preset)
  return spec.controls.every((c) => c.type === "image" || JSON.stringify(v[c.key]) === JSON.stringify(want[c.key]))
}

/* ------------------------------ URL hash ------------------------------ */

const b64 = {
  enc: (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s: string) => {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"))
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  },
}

export function buildHash(spec: StudioSpec, st: StudioState): string {
  const q = new URLSearchParams()
  const diff = changedValues(spec, st.values)
  if (Object.keys(diff).length) q.set("v", b64.enc(JSON.stringify(diff)))
  q.set("size", st.size)
  if (st.size === "custom") {
    q.set("w", String(clampSide(st.cw)))
    q.set("h", String(clampSide(st.ch)))
  }
  const qs = q.toString()
  return `#/studio/${st.id}${qs ? `?${qs}` : ""}`
}

export type ParsedHash = { id?: string; v?: Values; size?: SizeKey; w?: number; h?: number }

export function parseHash(hash: string): ParsedHash | null {
  const m = hash.replace(/^#\/?/, "")
  if (!/^studio(\/|\?|$)/.test(m)) return null
  const [path, query = ""] = m.split("?")
  const id = path.split("/")[1] ? decodeURIComponent(path.split("/")[1]) : undefined
  const q = new URLSearchParams(query)
  let v: Values | undefined
  const raw = q.get("v")
  if (raw) {
    try {
      const j = JSON.parse(b64.dec(raw))
      if (j && typeof j === "object" && !Array.isArray(j)) v = j as Values
    } catch {
      /* a broken link opens the defaults */
    }
  }
  const size = q.get("size") as SizeKey | null
  const valid = size === "custom" || (size && size in SIZES)
  return { id, v, size: valid ? size : undefined, w: Number(q.get("w")) || undefined, h: Number(q.get("h")) || undefined }
}

/* ------------------------------ Snippets ------------------------------ */

const COMPONENT_PATHS = Object.keys(import.meta.glob("../components/*/*.tsx")).map((p) => p.replace("../components/", ""))

const pascal = (id: string) => id.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase())

function lit(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(lit).join(", ")}]`
  if (x && typeof x === "object") return `{ ${Object.entries(x).map(([k, val]) => `${k}: ${lit(val)}`).join(", ")} }`
  return JSON.stringify(x)
}

export function componentSnippet(spec: StudioSpec, v: Values): string {
  const name = pascal(spec.id)
  const found = COMPONENT_PATHS.find((p) => p.endsWith(`/${spec.id}.tsx`))
  const path = found ? `@/components/${found.replace(/\.tsx$/, "")}` : `@/components/${spec.kind}/${spec.id}`
  const diff = changedValues(spec, v)
  const body = Object.keys(diff).length ? ` values={{ ${Object.entries(diff).map(([k, val]) => `${k}: ${lit(val)}`).join(", ")} }}` : ""
  return [`import { ${name} } from "${path}"`, ``, `export function Hero() {`, `  return <${name}${body} />`, `}`].join("\n")
}

export const PALETTES: { id: string; stops: string[] }[] = [
  { id: "ember", stops: ["#0d0b0a", "#4f1c10", "#c8501f", "#f4b06a", "#fff0d4"] },
  { id: "tide", stops: ["#050f15", "#0a3342", "#1b7380", "#8fcfc2", "#eef7ee"] },
  { id: "moss", stops: ["#0a0e09", "#23331d", "#66793a", "#c7c27a", "#f5efd0"] },
  { id: "cobalt", stops: ["#04060f", "#0b2570", "#2a60d0", "#9bbdff", "#f3f7ff"] },
  { id: "bone", stops: ["#09090a", "#38383a", "#8a8a8c", "#d8d8d6", "#fafaf8"] },
  { id: "clay", stops: ["#1a0f0c", "#6b3a2a", "#c98a62", "#f0cfa8", "#fbf4ea"] },
  { id: "lagoon", stops: ["#04161a", "#0b4f55", "#2fa39a", "#bfe9d5", "#f6fbf3"] },
  { id: "dusk", stops: ["#0c0a14", "#2a2350", "#7a4d8c", "#e59a7c", "#fde9cf"] },
]
