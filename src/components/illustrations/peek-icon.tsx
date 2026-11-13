"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { rng } from "@/studio/schema"
import type { StudioPieceProps, Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PeekCharacter = "atlas" | "quill" | "sage"
export type PeekBackground = "clock" | "mail" | "bolt" | "search" | "none"
/** Where the character climbs in: an edge or a corner of the icon. */
export type PeekEdge = "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br"

export type PeekIconSpec = {
  id?: string
  /** Shown under the icon. Default: the character's name. */
  name?: string
  /** Small line under the name. */
  note?: string
  character: PeekCharacter
  /** What the app does, drawn as flat geometry behind the character. */
  background?: PeekBackground
  /** Tile colour. Default: the character's own. */
  tile?: string
  /** Head colour. */
  body?: string
  /** Colour of the background geometry. */
  glyph?: string
  /** Second colour: ears, plume, leaves. Default: a shade of `body`. */
  detail?: string
  /** Edge or corner it peeks from. Default "br". */
  peek?: PeekEdge
}

export type PeekIconProps = StudioPieceProps & {
  /** The icons to show. Default: Atlas (schedules), Quill (drafts) and Sage (finds answers). */
  icons?: PeekIconSpec[]
  /** Outline and shadow colour. Default a warm near-black. */
  ink?: string
  /** Extra head tilt in degrees. Default 10. */
  tilt?: number
  /** Outline weight in a 200-unit icon. Default 3.4. */
  outline?: number
  /** Strength of the hard shadow under the character, 0 to 1. Default 1. */
  shadow?: number
  /** Squircle exponent: 4 is soft, 8 is nearly a square. Default 5. */
  roundness?: number
  /** Show the name and note under each icon. Default true. */
  labels?: boolean
  /** Called when an icon is pressed. The character ducks and pops back. */
  onPick?: (icon: PeekIconSpec, index: number) => void
  /** Accessible name of the group. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

export const PEEK_LOOP = 6.4
const STILL_T = 2.8
const INK = "#1d1a1a"

export const PEEK_ICONS: PeekIconSpec[] = [
  { id: "atlas", name: "Atlas", note: "Schedules", character: "atlas", background: "clock", tile: "#2f5bea", body: "#ff8a3d", glyph: "#e8edff", peek: "br" },
  { id: "quill", name: "Quill", note: "Drafts", character: "quill", background: "mail", tile: "#f4b942", body: "#fff6e3", glyph: "#ffffff", detail: "#2f5bea", peek: "bl" },
  { id: "sage", name: "Sage", note: "Finds answers", character: "sage", background: "search", tile: "#1f6b52", body: "#ffd6c2", glyph: "#c6eed7", detail: "#6bc994", peek: "b" },
]

/** Colours go into SVG attributes, so only plain hex values pass. */
const col = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : d)
const f2 = (n: number) => String(Math.round(n * 100) / 100)

/* ----------------------------- colour helpers ------------------------------ */

function hex(c: string): [number, number, number] {
  const s = c.replace("#", "")
  const h = s.length === 3 ? s.split("").map((x) => x + x).join("") : s.padEnd(6, "0")
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]
}
function mix(a: string, b: string, k: number): string {
  const A = hex(a)
  const B = hex(b)
  const o = A.map((v, i) => Math.round(v + (B[i] - v) * k))
  return "#" + o.map((v) => v.toString(16).padStart(2, "0")).join("")
}

/* -------------------------------------------------------------------------- */
/*                                   Geometry                                 */
/* -------------------------------------------------------------------------- */

const DIRS: Record<PeekEdge, [number, number]> = {
  b: [0, 1], t: [0, -1], r: [1, 0], l: [-1, 0],
  br: [0.7071, 0.7071], bl: [-0.7071, 0.7071], tr: [0.7071, -0.7071], tl: [-0.7071, -0.7071],
}
const isCorner = (e: PeekEdge) => e.length === 2

const sqCache = new Map<number, string>()
/** A superellipse, the continuous-corner shape of an app icon, in a 200-unit box. */
export function squircle(n: number): string {
  const key = Math.round(n * 10)
  const hit = sqCache.get(key)
  if (hit) return hit
  const pts: string[] = []
  const N = 180
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const x = 100 + 100 * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = 100 + 100 * Math.sign(s) * Math.abs(s) ** (2 / n)
    pts.push(`${i ? "L" : "M"}${f2(x)} ${f2(y)}`)
  }
  const d = pts.join("") + "Z"
  sqCache.set(key, d)
  return d
}

/* -------------------------------------------------------------------------- */
/*                                  Characters                                */
/* -------------------------------------------------------------------------- */

type Roles = { fur: string; shade: string; light: string; detail: string; ink: string; beak: string }
type Piece = { d?: string; tag?: "path" | "ellipse" | "circle"; attrs?: string; role: keyof Roles; line?: number; full?: boolean }

/** Head shapes in local coordinates: centre at 0,0 and the top of the head towards -y. j holds small seeded jitters. */
function pieces(kind: PeekCharacter, j: number[]): { parts: Piece[]; eyes: { es: number; ey: number }; eye: (ink: string) => string } {
  if (kind === "atlas") {
    const h = 66 + j[0] * 3
    return {
      parts: [
        { d: `M-44 -14L-41 ${-h}L-10 -38Z`, role: "fur" },
        { d: `M44 -14L41 ${-h}L10 -38Z`, role: "fur" },
        { d: "M-44 4L-61 16L-40 25Z", role: "fur" },
        { d: "M44 4L61 16L40 25Z", role: "fur" },
        { d: "M-46 -4C-46 -34 -26 -44 0 -44C26 -44 46 -34 46 -4C46 22 30 40 0 40C-30 40 -46 22 -46 -4Z", role: "fur" },
        { d: `M-37 -28L-36.5 ${-h + 13}L-21 -38Z`, role: "shade", full: true },
        { d: `M37 -28L36.5 ${-h + 13}L21 -38Z`, role: "shade", full: true },
        { d: "M-36 6Q0 -12 36 6Q28 36 0 38Q-28 36 -36 6Z", role: "light", full: true },
        { d: "M-5.5 9Q0 5.5 5.5 9Q0 17 -5.5 9Z", role: "ink", full: true },
      ],
      eyes: { es: 17 + j[1] * 1.4, ey: -8 },
      eye: (ink) => `<ellipse rx="5.4" ry="7.4" fill="${ink}"/><circle cx="1.7" cy="-2.7" r="2" fill="#fff"/>`,
    }
  }
  if (kind === "quill") {
    return {
      parts: [
        { d: "M-6 -34C-16 -66 6 -94 38 -98C38 -70 24 -44 10 -33Z", role: "detail" },
        { tag: "ellipse", attrs: 'cx="0" cy="0" rx="44" ry="40"', role: "fur" },
        { d: "M-6 9L6 9L0 19Z", role: "beak" },
        { tag: "circle", attrs: 'cx="-30" cy="11" r="6.5"', role: "shade", full: true },
        { tag: "circle", attrs: 'cx="30" cy="11" r="6.5"', role: "shade", full: true },
        { d: "M2 -36Q16 -64 34 -92", role: "ink", line: 2.2, full: true },
      ],
      eyes: { es: 17 + j[1] * 1.4, ey: -4 },
      eye: (ink) => `<circle r="6" fill="${ink}"/><circle cx="1.8" cy="-2.2" r="2" fill="#fff"/>`,
    }
  }
  return {
    parts: [
      { d: "M0 -40L2 -58", role: "detail", line: 4.2 },
      { d: "M2 -58C-14 -64 -28 -56 -30 -46C-14 -42 -2 -46 2 -58Z", role: "detail" },
      { d: "M2 -58C18 -68 34 -62 36 -50C20 -46 6 -48 2 -58Z", role: "detail" },
      { tag: "circle", attrs: 'cx="0" cy="0" r="44"', role: "fur" },
      { tag: "circle", attrs: 'cx="-30" cy="10" r="7"', role: "shade", full: true },
      { tag: "circle", attrs: 'cx="30" cy="10" r="7"', role: "shade", full: true },
      { d: "M-6 17Q0 22 6 17", role: "ink", line: 2.4, full: true },
    ],
    eyes: { es: 18 + j[1] * 1.4, ey: -4 },
    eye: (ink) => `<path d="M-8 -4H8A8 7.4 0 0 1 -8 -4Z" fill="${ink}" transform="translate(0 -1)"/>`,
  }
}

/** One pass of the head: the expanded outline, the flat shadow, or the coloured body. */
function headPass(kind: PeekCharacter, j: number[], mode: "outline" | "body" | "flat", roles: Roles, o: number): string {
  const { parts } = pieces(kind, j)
  let s = ""
  for (const p of parts) {
    if (mode !== "body" && p.full) continue
    const tag = p.tag ?? "path"
    const geo = p.d ? `d="${p.d}"` : p.attrs
    const col = mode === "body" ? roles[p.role] : roles.ink
    let at: string
    if (p.line) {
      at =
        mode === "body"
          ? `fill="none" stroke="${col}" stroke-width="${p.line}" stroke-linecap="round" stroke-linejoin="round"`
          : `fill="none" stroke="${col}" stroke-width="${f2(p.line + (mode === "outline" ? 2 * o : 0))}" stroke-linecap="round" stroke-linejoin="round"`
    } else if (mode === "outline") {
      at = `fill="${col}" stroke="${col}" stroke-width="${f2(2 * o + 3)}" stroke-linejoin="round"`
    } else {
      at = `fill="${col}" stroke="${col}" stroke-width="3" stroke-linejoin="round"`
    }
    s += `<${tag} ${geo} ${at}/>`
  }
  return s
}

/* -------------------------------------------------------------------------- */
/*                               Background geometry                          */
/* -------------------------------------------------------------------------- */

function glyphShapes(bg: PeekBackground, glyph: string, ink: string): string {
  const dark = mix(glyph, ink, 0.7)
  switch (bg) {
    case "clock": {
      let t = ""
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const r1 = i % 3 === 0 ? 43 : 48
        t += `<line x1="${f2(Math.sin(a) * r1)}" y1="${f2(-Math.cos(a) * r1)}" x2="${f2(Math.sin(a) * 53)}" y2="${f2(-Math.cos(a) * 53)}" stroke="${dark}" stroke-opacity=".5" stroke-width="${i % 3 === 0 ? 4 : 2.4}" stroke-linecap="round"/>`
      }
      return `<circle r="62" fill="${glyph}"/>${t}<path d="M0 0L-19 -23M0 0L27 -9" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><circle r="5" fill="${dark}"/>`
    }
    case "mail":
      return `<rect x="-66" y="-44" width="132" height="88" rx="12" fill="${glyph}"/><path d="M-62 -36L0 10L62 -36" fill="none" stroke="${dark}" stroke-opacity=".55" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
    case "bolt":
      return `<path d="M12 -70L-36 8L-6 8L-16 70L40 -10L8 -10Z" fill="${glyph}" stroke="${glyph}" stroke-width="6" stroke-linejoin="round"/>`
    case "search":
      return `<circle cx="-10" cy="-10" r="40" fill="${glyph}" fill-opacity=".22" stroke="${glyph}" stroke-width="15"/><path d="M20 20L58 58" stroke="${glyph}" stroke-width="18" stroke-linecap="round"/>`
    default: {
      let l = ""
      for (let k = -200; k <= 200; k += 15) l += `<line x1="${k - 100}" y1="100" x2="${k + 100}" y2="-100" />`
      return `<g stroke="${glyph}" stroke-opacity=".5" stroke-width="3" transform="translate(0 0)">${l}</g>`
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Pose                                    */
/* -------------------------------------------------------------------------- */

export type Pose = { r: number; rot: number; lx: number; ly: number; blink: number; lean: number }

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}
const ease = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/** Step response of a damped spring: 0 before the start, settles on 1 with a little overshoot. */
function spring(tau: number, w = 15, z = 0.56) {
  if (tau <= 0) return 0
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau))
}
const tri = (x: number, w: number) => Math.max(0, 1 - Math.abs(x) / w)

const BLINKS = [1.9, 3.85, 4.1]

/** The scripted moment: duck out of sight, climb in with a swing, look at the app, at you, aside, then duck again. */
export function demoPose(tIn: number, edge: PeekEdge): Pose {
  const tl = ((tIn % PEEK_LOOP) + PEEK_LOOP) % PEEK_LOOP
  const u = DIRS[edge]
  const sx = u[0] >= 0 ? 1 : -1
  const g: [number, number] = [-u[0] * 0.9, -u[1] * 0.9]
  const keys: [number, number, number][] = [
    [0, g[0], g[1]], [1.4, g[0], g[1]], [2.3, 0, 0.1], [3.5, 0, 0.1], [4.2, -sx * 0.8, -0.2], [5.0, -sx * 0.8, -0.2], [5.7, g[0] * 0.6, g[1] * 0.6], [PEEK_LOOP, g[0], g[1]],
  ]
  let lx = g[0]
  let ly = g[1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (tl >= a[0] && tl <= b[0]) {
      const k = smooth((tl - a[0]) / (b[0] - a[0]))
      lx = a[1] + (b[1] - a[1]) * k
      ly = a[2] + (b[2] - a[2]) * k
      break
    }
  }
  const sp = spring(tl - 0.5)
  const duck = ease((tl - 5.5) / 0.8)
  const blink = Math.max(...BLINKS.map((b) => tri(tl - b, 0.1)))
  const lx2 = (tl - 3.0) / 1.4
  const lean = lx2 > 0 && lx2 < 1 ? Math.sin(Math.PI * lx2) ** 2 : 0
  return { r: sp * (1 - duck), rot: -sx * 14 * (1 - sp) * (1 - duck), lx, ly, blink, lean }
}

export const STILL_POSE = (edge: PeekEdge): Pose => demoPose(STILL_T, edge)

/* -------------------------------------------------------------------------- */
/*                               Tile renderer (SVG)                          */
/* -------------------------------------------------------------------------- */

export type TileStyle = { ink: string; tilt: number; outline: number; shadow: number; n: number; seed: number }
type Resolved = Required<Pick<PeekIconSpec, "character" | "background" | "tile" | "body" | "glyph" | "detail" | "peek">> & { id: string; name: string; note: string }

function resolveIcon(s: PeekIconSpec, i: number): Resolved {
  const base = PEEK_ICONS.find((x) => x.character === s.character) ?? PEEK_ICONS[0]
  const body = col(s.body, base.body!)
  return {
    id: s.id ?? s.character + i,
    name: s.name ?? base.name!,
    note: s.note ?? "",
    character: s.character,
    background: s.background ?? base.background!,
    tile: col(s.tile, base.tile!),
    body,
    glyph: col(s.glyph, base.glyph!),
    detail: col(s.detail, base.detail ?? mix(body, "#000000", 0.38)),
    peek: s.peek ?? "br",
  }
}

/** The inner markup of one icon in a 200-unit box (no outer svg), with ids prefixed by uid. */
export function tileInner(c: Resolved, p: Pose, st: TileStyle, uid: string, index = 0): string {
  const u = DIRS[c.peek]
  const corner = isCorner(c.peek)
  const base = ((Math.atan2(u[1], u[0]) * 180) / Math.PI + 270 + 540) % 360 - 180
  const rnd = rng(st.seed + index * 97)
  const j = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]
  const tiltAdj = corner ? -Math.sign(base) * st.tilt : st.tilt
  const lean = p.lean
  const theta = base + tiltAdj + p.rot + lean * 3 * (corner ? -Math.sign(base) : 1)
  const rest = corner ? 96 : 78
  const dist = rest - lean * 7 + (1 - p.r) * 86
  const cx = 100 + u[0] * dist
  const cy = 100 + u[1] * dist
  const ink = col(st.ink, INK)
  const furShade = mix(c.body, ink, 0.2)
  const roles: Roles = { fur: c.body, shade: furShade, light: mix(c.body, "#ffffff", 0.78), detail: c.character === "atlas" ? mix(c.body, ink, 0.42) : c.detail, ink, beak: "#f28a1e" }
  const th = (theta * Math.PI) / 180
  const eyeG = pieces(c.character, j)
  const lxL = p.lx * Math.cos(th) + p.ly * Math.sin(th)
  const lyL = -p.lx * Math.sin(th) + p.ly * Math.cos(th)
  const ex = Math.max(-1, Math.min(1, lxL)) * 3.8
  const ey = Math.max(-1, Math.min(1, lyL)) * 3.2
  const sy = Math.max(0.08, 1 - 0.92 * p.blink)
  const eyes =
    `<g transform="translate(${f2(ex)} ${f2(ey)})">` +
    [-1, 1].map((s) => `<g transform="translate(${f2(s * eyeG.eyes.es)} ${eyeG.eyes.ey}) scale(1 ${f2(sy)})">${eyeG.eye(ink)}</g>`).join("") +
    "</g>"
  const T = `translate(${f2(cx)} ${f2(cy)}) rotate(${f2(theta)}) scale(1.22)`
  // The glyph sits on the far side of the icon from the character.
  const gx = 100 - u[0] * 22
  const gy = 100 - u[1] * 26
  const o = st.outline
  const sh = st.shadow
  return (
    `<defs><clipPath id="${uid}c"><path d="${squircle(st.n)}"/></clipPath></defs>` +
    `<g clip-path="url(#${uid}c)">` +
    `<rect width="200" height="200" fill="${c.tile}"/>` +
    `<g transform="translate(${f2(gx)} ${f2(gy)})">${glyphShapes(c.background, c.glyph, ink)}</g>` +
    (sh > 0 ? `<g transform="translate(5 8) ${T}" opacity="${f2(0.3 * sh)}">${headPass(c.character, j, "outline", roles, o)}</g>` : "") +
    `<g transform="${T}">${headPass(c.character, j, "outline", roles, o)}${headPass(c.character, j, "body", roles, o)}${eyes}</g>` +
    `<path d="${squircle(st.n)}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2" transform="translate(100 100) scale(.99) translate(-100 -100)"/>` +
    `</g>`
  )
}

export function tileSvg(c: Resolved, p: Pose, st: TileStyle, uid: string, index = 0): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true" focusable="false">${tileInner(c, p, st, uid, index)}</svg>`
}

/* -------------------------------------------------------------------------- */
/*                             Artboard (studio, export)                      */
/* -------------------------------------------------------------------------- */

const asNum = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d)
const PEEKS = ["t", "b", "l", "r", "tl", "tr", "bl", "br"]
const CHARS = ["atlas", "quill", "sage"]
const BGS = ["clock", "mail", "bolt", "search", "none"]
const pick = <T extends string>(v: unknown, ok: string[], d: T): T => (typeof v === "string" && ok.includes(v) ? (v as T) : d)

type Board = { icons: Resolved[]; style: TileStyle; paper: string; layout: "one" | "set"; still: boolean }

function boardFromValues(values: Values, seed: number): Board {
  const layout = values.layout === "set" ? "set" : "one"
  const ch = pick<PeekCharacter>(values.character, CHARS, "atlas")
  const peek = pick<PeekEdge>(values.peek, PEEKS, "br")
  const style: TileStyle = {
    ink: col(values.ink, INK),
    tilt: asNum(values.tilt, 10),
    outline: asNum(values.outline, 3.4),
    shadow: asNum(values.shadow, 1),
    n: asNum(values.roundness, 5),
    seed: asNum(values.seed, seed),
  }
  let icons: Resolved[]
  if (layout === "set") {
    const peeks: PeekEdge[] = [peek, peek === "br" ? "bl" : "br", peek === "b" ? "br" : "b"]
    icons = PEEK_ICONS.map((s, i) => resolveIcon({ ...s, peek: peeks[i] }, i))
  } else {
    icons = [
      resolveIcon(
        {
          character: ch,
          background: pick<PeekBackground>(values.background, BGS, "clock"),
          tile: col(values.tile, "#2f5bea"),
          body: col(values.body, "#ff8a3d"),
          glyph: col(values.glyph, "#e8edff"),
          detail: col(values.detail, ""),
          peek,
        },
        0,
      ),
    ]
  }
  return { icons, style, paper: col(values.paper, "#f4f1ea"), layout, still: values.motion === "still" }
}

/** One frame of the whole artboard as resolved SVG markup, for export and the Studio preview. */
export function peekSvg(w: number, h: number, t: number, values: Values, seedIn = 7): string {
  const b = boardFromValues(values, seedIn)
  const n = b.icons.length
  const s = n === 1 ? Math.min(w, h) * 0.5 : Math.min(w * 0.26, h * 0.5)
  const gap = s * 0.2
  const total = n * s + (n - 1) * gap
  const x0 = (w - total) / 2
  const y0 = (h - s) / 2
  const sq = squircle(b.style.n)
  const tt = b.still ? STILL_T : t
  let tiles = ""
  let shadows = ""
  b.icons.forEach((c, i) => {
    const x = x0 + i * (s + gap)
    const p = demoPose(tt - i * 0.42, c.peek)
    const k = s / 200
    shadows += `<path d="${sq}" transform="translate(${f2(x)} ${f2(y0 + s * 0.05)}) scale(${f2(k)})" fill="#000" fill-opacity=".2" filter="url(#pkblur)"/>`
    tiles += `<svg x="${f2(x)}" y="${f2(y0)}" width="${f2(s)}" height="${f2(s)}" viewBox="0 0 200 200" overflow="hidden">${tileInner(c, p, b.style, "pk" + i, i)}</svg>`
  })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><filter id="pkblur" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="${f2(9 )}"/></filter></defs>` +
    `<rect width="${w}" height="${h}" fill="${b.paper}"/>${shadows}${tiles}</svg>`
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pki {
  --pki-ink: #000;
  --pki-surface: #fff;
  --pki-accent: #0060e2;
  --pki-t1: color-mix(in oklab, var(--pki-ink) 88%, transparent);
  --pki-t2: color-mix(in oklab, var(--pki-ink) 61%, transparent);
  --pki-t3: color-mix(in oklab, var(--pki-ink) 45%, transparent);
  --pki-drop: drop-shadow(0 .5px 0 rgb(0 0 0 / .1)) drop-shadow(0 10px 14px rgb(0 0 0 / .16));
  --pki-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 640px;
  font: 13px/20px var(--pki-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--pki-t1); -webkit-font-smoothing: antialiased; text-align: center;
}
:is(.dark, [data-theme="dark"]) .pki {
  --pki-ink: #fff; --pki-surface: #1c1c1e; --pki-accent: #4d8dff;
  --pki-t1: color-mix(in oklab, var(--pki-ink) 90%, transparent);
  --pki-t2: color-mix(in oklab, var(--pki-ink) 62%, transparent);
  --pki-t3: color-mix(in oklab, var(--pki-ink) 46%, transparent);
  --pki-drop: drop-shadow(0 .5px 0 rgb(255 255 255 / .12)) drop-shadow(0 12px 16px rgb(0 0 0 / .5));
}
html[data-style="mono"] .pki { --pki-accent: #111; --pki-ease: cubic-bezier(.2, .9, .1, 1); --pki-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace; --pki-drop: drop-shadow(0 0 0 #0000) }
html[data-style="mono"].dark .pki { --pki-accent: #f2f2f2 }
html[data-style="mono"] .pki-art { filter: grayscale(1) contrast(1.08) }
html[data-style="glass"] .pki {
  --pki-ink: var(--pane-ink); --pki-accent: var(--pane-accent); --pki-ease: var(--pane-ease); --pki-font: var(--pane-font);
  --pki-t1: var(--pane-t1); --pki-t2: var(--pane-t2); --pki-t3: var(--pane-t3);
}
html[data-style="glass"] .pki-art::after { content: ""; position: absolute; inset: 0; border-radius: 22.5%; pointer-events: none; box-shadow: inset 0 1.5px 0 rgb(255 255 255 / .55), inset 0 0 0 .5px rgb(255 255 255 / .4), inset 0 -2px 3px rgb(0 0 0 / .08) }
.pki *, .pki *::before, .pki *::after { box-sizing: border-box }
:where(.pki) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.pki) p { margin: 0 }
.pki-row { display: grid; grid-template-columns: repeat(var(--pki-n, 3), minmax(0, 1fr)); justify-items: center; gap: clamp(12px, 5cqw, 44px) }
.pki-item { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 184px; gap: 14px; -webkit-tap-highlight-color: transparent; border-radius: 16px }
.pki-item:focus-visible { outline: none }
.pki-art {
  position: relative; display: block; width: 100%; aspect-ratio: 1; border-radius: 22.5%;
  filter: var(--pki-drop); transition: transform .18s var(--pki-ease);
}
.pki-art svg { display: block; border-radius: 22.5% }
.pki-item:active .pki-art { transform: scale(.965) }
.pki-item:focus-visible .pki-art { outline: 2px solid var(--pki-accent); outline-offset: 5px }
.pki-cap { display: flex; flex-direction: column; align-items: center; min-width: 0; max-width: 100% }
.pki-name { font-size: 14px; line-height: 20px; font-weight: 600; letter-spacing: -.005em; color: var(--pki-t1) }
.pki-note { font-size: 13px; line-height: 18px; color: var(--pki-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.pki-board { position: relative; width: 100%; height: 100%; overflow: hidden }
.pki-board > svg { display: block; width: 100%; height: 100% }
@container (max-width: 420px) {
  .pki-row { gap: 10px }
  .pki-item { gap: 10px }
}
@media (pointer: coarse) { .pki-item { min-height: 44px } }
@media (prefers-reduced-motion: reduce) {
  .pki *, .pki *::before, .pki *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

function useReduced() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

type Tile = {
  r: number; vr: number
  look: [number, number]; lookT: [number, number]
  lean: number; leanT: number
  blinkAt: number; popAt: number
  key: string
}

export function PeekIcon(props: PeekIconProps) {
  if (props.size || props.time !== undefined) return <Artboard {...props} />
  return <Interactive {...props} />
}

/** Studio and export path: the whole artboard as one SVG, driven by a clock or by `time`. */
function Artboard({ size, time, speed = 1, paused = false, values, seed = 7, icons, ink, tilt, outline, shadow, roundness, className }: PeekIconProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const w = size?.w ?? 1080
  const h = size?.h ?? 1080
  const v = React.useMemo<Values>(() => ({ ink, tilt, outline, shadow, roundness, ...(values ?? {}) }), [ink, tilt, outline, shadow, roundness, values])
  const html0 = React.useMemo(() => peekSvg(w, h, time ?? STILL_T, v, seed), [w, h, time, v, seed])
  const reduce = useReduced()
  const live = time === undefined && !paused && !reduce
  React.useEffect(() => {
    const el = ref.current
    if (!el || !live) return
    let raf = 0
    let t = 0
    let last = performance.now()
    let on = true
    const tick = (now: number) => {
      t += Math.min(0.05, (now - last) / 1000) * speed
      last = now
      el.innerHTML = peekSvg(w, h, t, v, seed)
      raf = requestAnimationFrame(tick)
    }
    const run = () => {
      const should = on && document.visibilityState === "visible"
      if (should && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!should && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const io = new IntersectionObserver((en) => {
      on = en.some((x) => x.isIntersecting)
      run()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", run)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", run)
      cancelAnimationFrame(raf)
    }
  }, [live, speed, w, h, v, seed])
  void icons
  return (
    <div className={cn("pki", className)} style={{ maxWidth: "none", aspectRatio: `${w} / ${h}` }}>
      <style href="peek-icon" precedence="default">{CSS}</style>
      <div ref={ref} className="pki-board" role="img" aria-label="Icons with a character peeking in over the edge" dangerouslySetInnerHTML={{ __html: html0 }} />
    </div>
  )
}

function Interactive({
  icons, ink = INK, tilt = 10, outline = 3.4, shadow = 1, roundness = 5, labels = true, onPick, label = "Apps", speed = 1, paused = false, seed = 7, className,
}: PeekIconProps) {
  const src = icons ?? PEEK_ICONS
  const list = React.useMemo(() => src.map(resolveIcon), [src])
  const style = React.useMemo<TileStyle>(() => ({ ink, tilt, outline, shadow, n: roundness, seed }), [ink, tilt, outline, shadow, roundness, seed])
  const reduce = useReduced()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const arts = React.useRef<(HTMLElement | null)[]>([])
  const onPickRef = React.useRef(onPick)
  const pausedRef = React.useRef(paused)
  const speedRef = React.useRef(speed)
  React.useEffect(() => {
    onPickRef.current = onPick
    pausedRef.current = paused
    speedRef.current = speed
  })
  const eng = React.useRef({
    auto: true, clock: 2.2, t: 0, onScreen: true, tiles: [] as Tile[],
    live: () => {}, set: (_i: number, _p: "rest" | "look" | "pop") => {}, paint: () => {},
  })

  const first = React.useMemo(() => list.map((c, i) => tileSvg(c, STILL_POSE(c.peek), style, `pki${i}`, i)), [list, style])

  React.useEffect(() => {
    const e = eng.current
    const rest = (c: Resolved): [number, number] => [-DIRS[c.peek][0] * 0.9, -DIRS[c.peek][1] * 0.9]
    e.tiles = list.map((c) => ({ r: 1, vr: 0, look: rest(c), lookT: rest(c), lean: 0, leanT: 0, blinkAt: -9, popAt: -9, key: "" }))
    const write = (i: number, p: Pose) => {
      const tl = e.tiles[i]
      const key = [p.r, p.rot, p.lx, p.ly, p.blink, p.lean].map((x) => x.toFixed(2)).join()
      const el = arts.current[i]
      if (!el || key === tl.key) return
      tl.key = key
      el.innerHTML = tileSvg(list[i], p, style, `pki${i}`, i)
    }
    const livePose = (i: number): Pose => {
      const tl = e.tiles[i]
      const rs = DIRS[list[i].peek][0] >= 0 ? -1 : 1
      return { r: tl.r, rot: rs * 14 * (1 - tl.r), lx: tl.look[0], ly: tl.look[1], blink: tri(e.t - tl.blinkAt - 0.05, 0.1), lean: tl.lean }
    }
    const paintAll = () => {
      list.forEach((_, i) => write(i, e.auto ? demoPose(e.clock - i * 0.42, list[i].peek) : livePose(i)))
    }
    e.paint = paintAll

    if (reduce) {
      e.auto = false
      list.forEach((c, i) => write(i, STILL_POSE(c.peek)))
    } else if (e.auto) paintAll()

    e.live = () => {
      if (!e.auto) return
      e.auto = false
      list.forEach((c, i) => {
        const now = demoPose(e.clock - i * 0.42, c.peek)
        const prev = demoPose(e.clock - i * 0.42 - 0.016, c.peek)
        const tl = e.tiles[i]
        tl.r = now.r
        tl.vr = (now.r - prev.r) / 0.016
        tl.look = [now.lx, now.ly]
        tl.lookT = [now.lx, now.ly]
        tl.lean = now.lean
        tl.leanT = 0
      })
    }
    e.set = (i, what) => {
      e.live()
      const tl = e.tiles[i]
      if (!tl) return
      if (what === "pop") {
        tl.popAt = e.t
        tl.blinkAt = e.t + 0.3
      } else if (what === "look") {
        tl.blinkAt = e.t
      }
    }

    if (reduce) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      e.t += dt
      if (e.auto) {
        if (!pausedRef.current) e.clock += dt * speedRef.current
      } else {
        const h = dt / 4
        for (const tl of e.tiles) {
          const ducking = e.t - tl.popAt < 0.17
          const w = ducking ? 28 : 15
          const z = ducking ? 1 : 0.56
          for (let k = 0; k < 4; k++) {
            tl.vr += (-w * w * (tl.r - (ducking ? 0 : 1)) - 2 * z * w * tl.vr) * h
            tl.r += tl.vr * h
          }
          const a = 1 - Math.exp(-dt * 14)
          tl.look = [tl.look[0] + (tl.lookT[0] - tl.look[0]) * a, tl.look[1] + (tl.lookT[1] - tl.look[1]) * a]
          tl.lean += (tl.leanT - tl.lean) * (1 - Math.exp(-dt * 12))
        }
      }
      paintAll()
      raf = requestAnimationFrame(tick)
    }
    const run = () => {
      const should = e.onScreen && document.visibilityState === "visible"
      if (should && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!should && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const io = new IntersectionObserver((en) => {
      e.onScreen = en.some((x) => x.isIntersecting)
      run()
    })
    if (rootRef.current) io.observe(rootRef.current)
    document.addEventListener("visibilitychange", run)
    run()
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", run)
      cancelAnimationFrame(raf)
    }
  }, [list, style, reduce])

  const setTargets = (px: number | null, py: number | null) => {
    const e = eng.current
    list.forEach((c, i) => {
      const tl = e.tiles[i]
      const el = arts.current[i]
      if (!tl || !el) return
      if (px === null || py === null) {
        tl.lookT = [-DIRS[c.peek][0] * 0.9, -DIRS[c.peek][1] * 0.9]
        tl.leanT = 0
        return
      }
      const r = el.getBoundingClientRect()
      const dx = (px - (r.left + r.width / 2)) / (r.width * 1.1)
      const dy = (py - (r.top + r.height / 2)) / (r.height * 1.1)
      const m = Math.hypot(dx, dy)
      const k = m > 1 ? 1 / m : 1
      tl.lookT = [dx * k, dy * k]
      tl.leanT = px >= r.left && px <= r.right && py >= r.top && py <= r.bottom ? 1 : 0
    })
    if (reduce) {
      list.forEach((c, i) => {
        const tl = e.tiles[i]
        if (!tl) return
        tl.look = tl.lookT
        const el = arts.current[i]
        if (el) el.innerHTML = tileSvg(c, { ...STILL_POSE(c.peek), lx: tl.look[0], ly: tl.look[1], lean: 0 }, style, `pki${i}`, i)
      })
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("pki", className)}
      role="group"
      aria-label={label}
      onPointerDown={() => eng.current.live()}
      onPointerMove={(ev) => {
        if (ev.pointerType === "touch") return
        eng.current.live()
        setTargets(ev.clientX, ev.clientY)
      }}
      onPointerLeave={() => setTargets(null, null)}
      onKeyDown={() => eng.current.live()}
    >
      <style href="peek-icon" precedence="default">{CSS}</style>
      <div className="pki-row" style={{ ["--pki-n" as string]: list.length }}>
        {list.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="pki-item"
            aria-label={c.note ? `${c.name}, ${c.note}` : c.name}
            onPointerEnter={(ev) => {
              if (ev.pointerType !== "touch") eng.current.set(i, "look")
            }}
            onFocus={() => {
              const tl = eng.current.tiles[i]
              eng.current.set(i, "look")
              if (tl) {
                tl.lookT = [0, 0.1]
                tl.leanT = 1
              }
            }}
            onBlur={() => setTargets(null, null)}
            onClick={() => {
              eng.current.set(i, "pop")
              onPickRef.current?.(src[i], i)
            }}
          >
            <span className="pki-art" ref={(el) => { arts.current[i] = el }} dangerouslySetInnerHTML={{ __html: first[i] }} />
            {labels && (
              <span className="pki-cap">
                <span className="pki-name">{c.name}</span>
                {c.note && <span className="pki-note">{c.note}</span>}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PeekIcon
