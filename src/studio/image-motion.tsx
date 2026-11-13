"use client"

// Image Motion – turns one picture into a looping 3D product shot, in the browser.
//
// One WebGL2 fragment shader draws everything: the image as a rounded plane that a ray-plane intersection puts in
// perspective, a soft shadow cast in the plane's own space, an optional phone or browser frame built from
// rounded-rectangle distance fields, a 2–4 stop gradient background and film grain. The camera motion presets are
// plain functions of the loop phase, built only from whole-number harmonics, so every one repeats without a jump.
//
// `draw(ctx, w, h, t, values)` is a pure function of its arguments (plus the image cache). It renders into a hidden
// WebGL canvas and copies the result onto `ctx`, which is what the Studio exporter and the live piece both use.
// Without WebGL2 it falls back to an affine Canvas2D approximation.
import * as React from "react"
import type { StudioPieceProps, Values } from "./schema"
import { draw as drawGouache } from "@/components/illustrations/gouache-lake"
import { draw as drawHills } from "@/components/illustrations/golden-hills"
import { draw as drawGrain, GRAIN_PALETTES } from "@/components/motion/grain-gradient"

const TAU = Math.PI * 2
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const num = (v: unknown, d: number) => {
  const n = typeof v === "string" ? parseFloat(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : d
}

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

export const IMAGE_MOTION_MOTIONS = [
  { id: "orbit", label: "Orbit" },
  { id: "tilt", label: "Tilt" },
  { id: "float", label: "Float" },
  { id: "push", label: "Push in" },
  { id: "parallax", label: "Parallax" },
] as const
type MotionId = (typeof IMAGE_MOTION_MOTIONS)[number]["id"]

export const IMAGE_MOTION_SOURCES = [
  { id: "lake", label: "Alpine lake" },
  { id: "hills", label: "Golden hills" },
  { id: "ember", label: "Ember orb" },
  { id: "tide", label: "Tide ring" },
  { id: "moss", label: "Moss band" },
  { id: "ledger", label: "Ledger dashboard" },
] as const

export const IMAGE_MOTION_DEFAULTS: Values = {
  source: "lake",
  image: "",
  motion: "orbit",
  intensity: 1,
  duration: "6",
  perspective: 0.5,
  radius: 0.28,
  size: 1,
  frame: "none",
  darkFrame: true,
  bg: ["#ece7de", "#d5dde0", "#a9bcc6"],
  angle: 62,
  shadow: 0.55,
  grain: 0.35,
  sheen: 0.5,
}

/* -------------------------------------------------------------------------- */
/*                                Camera motion                               */
/* -------------------------------------------------------------------------- */

type Pose = {
  yaw: number
  pitch: number
  roll: number
  tx: number
  ty: number
  tz: number
  lift: number
  zoom: number
  par: [number, number]
  parAmt: number
  imgZoom: number
}

/** Plane pose for a preset at loop phase phi (radians, 0 to 2π) and intensity I. Every term is sin/cos of k·phi, k an integer. */
export function pose(motion: MotionId, phi: number, I: number): Pose {
  const s = Math.sin(phi)
  const c = Math.cos(phi)
  const base: Pose = { yaw: 0, pitch: 0, roll: 0, tx: 0, ty: 0, tz: 0, lift: 0.3, zoom: 1, par: [0, 0], parAmt: 0, imgZoom: 1 }
  switch (motion) {
    case "orbit":
      return { ...base, yaw: 0.52 * I * s, pitch: 0.2 * I * c + 0.04 * I, roll: -0.03 * I * s, ty: 0.01 * I * Math.sin(2 * phi), lift: 0.35 + 0.15 * c }
    case "tilt":
      return { ...base, yaw: -0.46 * I + 0.07 * I * s, pitch: 0.24 * I + 0.04 * I * Math.sin(phi + 1.3), roll: 0.05 * I + 0.012 * I * c, tz: 0.12 * I * s, lift: 0.4 + 0.1 * s }
    case "float": {
      const lift = 0.5 + 0.5 * s
      return { ...base, yaw: -0.2 * I + 0.1 * I * c, pitch: 0.08 * I + 0.07 * I * s, roll: 0.035 * I * Math.sin(2 * phi + 0.6), ty: 0.04 * I * s, lift: 0.25 + 0.75 * lift }
    }
    case "push": {
      const e = 0.5 - 0.5 * c
      return { ...base, yaw: -0.14 * I * (1 - e * 0.6) + 0.04 * I * s, pitch: 0.07 * I * (1 - e), roll: 0, tz: 0.5 * I * e, zoom: 1 + 0.2 * I * e, lift: 0.3 + 0.4 * e }
    }
    case "parallax":
      return { ...base, yaw: 0.16 * I * s, pitch: 0.08 * I * c, par: [s * 0.9, c * 0.6], parAmt: 0.09 * I, imgZoom: 1 + 0.12 * I, lift: 0.35 }
  }
}

/* -------------------------------------------------------------------------- */
/*                                Built-in images                             */
/* -------------------------------------------------------------------------- */

type Frame = "none" | "phone" | "browser"
const PHONE_ASPECT = 0.485
const BROWSER_ASPECT = 1.6
const BAR = 0.085

/** Pixel size a built-in image is generated at for a frame, so the crop is the one the frame shows. */
function builtinSize(frame: Frame): [number, number] {
  if (frame === "phone") return [900, 1856]
  if (frame === "browser") return [1600, 915]
  return [1560, 1200]
}

function drawLedger(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const u = w / 1600
  const font = (wt: number, px: number) => `${wt} ${px * u}px ui-sans-serif, system-ui, -apple-system, "Inter", "Helvetica Neue", sans-serif`
  const rr = (x: number, y: number, ww: number, hh: number, r: number) => {
    ctx.beginPath()
    ctx.roundRect(x * u, y * u, ww * u, hh * u, r * u)
  }
  const portrait = h / w > 1.2
  ctx.fillStyle = "#f6f5f2"
  ctx.fillRect(0, 0, w, h)
  const pad = 44
  if (portrait) {
    // Narrow layout: one column
    const W = w / u
    ctx.fillStyle = "#16150f"
    ctx.font = font(600, 34)
    ctx.textBaseline = "alphabetic"
    ctx.fillText("Harbor & Finch", 56 * u, 130 * u)
    ctx.fillStyle = "rgba(22,21,15,0.5)"
    ctx.font = font(500, 28)
    ctx.fillText("Revenue, last 30 days", 56 * u, 330 * u)
    ctx.fillStyle = "#16150f"
    ctx.font = font(600, 128)
    ctx.fillText("$48,210", 52 * u, 460 * u)
    ctx.fillStyle = "rgba(22,21,15,0.5)"
    ctx.font = font(500, 30)
    ctx.fillText("Up 12.4% on the month before", 56 * u, 520 * u)
    bars(56, 600, W - 112, 420, 14)
    rows(56, 1130, W - 112, 5, 128, 30)
    return
  }
  // Sidebar
  ctx.fillStyle = "#efede8"
  ctx.fillRect(0, 0, 280 * u, h)
  ctx.fillStyle = "rgba(22,21,15,0.08)"
  ctx.fillRect(280 * u, 0, 2 * u, h)
  ctx.fillStyle = "#16150f"
  ctx.font = font(600, 26)
  ctx.fillText("Harbor & Finch", 36 * u, 80 * u)
  const nav = ["Overview", "Orders", "Customers", "Products", "Reports", "Settings"]
  nav.forEach((n, i) => {
    const y = 150 + i * 62
    if (i === 0) {
      ctx.fillStyle = "rgba(22,21,15,0.07)"
      rr(20, y - 36, 240, 52, 12)
      ctx.fill()
    }
    ctx.fillStyle = i === 0 ? "#16150f" : "rgba(22,21,15,0.55)"
    ctx.font = font(i === 0 ? 600 : 500, 24)
    ctx.fillText(n, 44 * u, (y) * u)
  })
  const x0 = 280 + pad + 20
  ctx.fillStyle = "rgba(22,21,15,0.5)"
  ctx.font = font(500, 24)
  ctx.fillText("Revenue, last 30 days", x0 * u, 110 * u)
  ctx.fillStyle = "#16150f"
  ctx.font = font(600, 104)
  ctx.fillText("$48,210", (x0 - 3) * u, 210 * u)
  ctx.fillStyle = "rgba(22,21,15,0.5)"
  ctx.font = font(500, 24)
  ctx.fillText("Up 12.4% on the month before", (x0 + 2) * u, 256 * u)
  bars(x0, 300, 800 - 40, 330, 18)
  // Side card
  const cx = x0 + 800 - 10
  const cw = 1600 - cx - pad
  ctx.fillStyle = "#ffffff"
  rr(cx, 90, cw, 540, 20)
  ctx.fill()
  ctx.strokeStyle = "rgba(22,21,15,0.08)"
  ctx.lineWidth = 2 * u
  ctx.stroke()
  ctx.fillStyle = "#16150f"
  ctx.font = font(600, 24)
  ctx.fillText("Top products", (cx + 28) * u, 140 * u)
  const items: [string, string][] = [["Finch linen throw", "$12,480"], ["Harbor ceramic set", "$9,110"], ["Tern canvas tote", "$7,640"], ["Gull brass lamp", "$5,925"], ["Reed wool socks", "$4,120"]]
  items.forEach(([n, v], i) => {
    const y = 214 + i * 78
    ctx.fillStyle = "rgba(22,21,15,0.06)"
    ctx.fillRect((cx + 28) * u, (y - 42) * u, (cw - 56) * u, 2 * u)
    ctx.fillStyle = "#16150f"
    ctx.font = font(500, 23)
    ctx.textAlign = "left"
    ctx.fillText(n, (cx + 28) * u, y * u)
    ctx.textAlign = "right"
    ctx.fillStyle = "rgba(22,21,15,0.6)"
    ctx.fillText(v, (cx + cw - 28) * u, y * u)
    ctx.textAlign = "left"
  })
  rows(x0, 690, 1600 - x0 - pad, 3, 78, 24)

  function bars(x: number, y: number, ww: number, hh: number, n: number) {
    const data = [0.42, 0.5, 0.46, 0.58, 0.54, 0.64, 0.6, 0.52, 0.7, 0.66, 0.78, 0.74, 0.86, 0.95]
    const gap = ww / n / 3.2
    const bw = (ww - gap * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      const v = data[i % data.length] * (i >= data.length ? 0.9 : 1)
      const bh = hh * v
      ctx.fillStyle = i === n - 1 ? "#16150f" : "rgba(22,21,15,0.14)"
      rr(x + i * (bw + gap), y + hh - bh, bw, bh, Math.min(10, bw / 3))
      ctx.fill()
    }
  }
  function rows(x: number, y: number, ww: number, n: number, rh: number, px: number) {
    const names = ["Northwind Traders", "Fable & Co", "Quay Street Goods", "Larkspur Home", "Mooring Supply"]
    const amt = ["$2,480", "$1,915", "$1,640", "$1,205", "$980"]
    for (let i = 0; i < n; i++) {
      const yy = y + i * rh
      ctx.fillStyle = "rgba(22,21,15,0.07)"
      ctx.fillRect(x * u, yy * u, ww * u, 2 * u)
      ctx.fillStyle = "#16150f"
      ctx.font = font(500, px)
      ctx.textAlign = "left"
      ctx.fillText(names[i], x * u, (yy + rh * 0.62) * u)
      ctx.fillStyle = "rgba(22,21,15,0.6)"
      ctx.textAlign = "right"
      ctx.fillText(amt[i], (x + ww) * u, (yy + rh * 0.62) * u)
      ctx.textAlign = "left"
    }
  }
}

function renderBuiltin(id: string, frame: Frame): HTMLCanvasElement {
  const [w, h] = builtinSize(frame)
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = h
  const ctx = cv.getContext("2d")!
  const P = GRAIN_PALETTES
  switch (id) {
    case "hills":
      drawHills(ctx, w, h, 7, { light: 0.3, haze: 0.38, tree: true, walker: true, grain: 0.3, seed: 7 })
      break
    case "ember":
      drawGrain(ctx, w, h, 2, { shape: "orb", colors: [...P.ember.colors], angle: 215, seed: 11, grain: 0.4, scale: 1.1 })
      break
    case "tide":
      drawGrain(ctx, w, h, 2, { shape: "ring", colors: [...P.tide.colors], angle: 300, seed: 4, grain: 0.4, scale: 1.1 })
      break
    case "moss":
      drawGrain(ctx, w, h, 2, { shape: "band", colors: [...P.moss.colors], angle: 35, seed: 9, grain: 0.45, warp: 0.6 })
      break
    case "ledger":
      drawLedger(ctx, w, h)
      break
    case "lake":
    default:
      drawGouache(ctx, w, h, 9, { palette: "alpine", tod: 0.28, calm: 0.55, seed: 7, boat: true, grain: 0.3 })
  }
  return cv
}

/* -------------------------------------------------------------------------- */
/*                         Image sources and the cache                         */
/* -------------------------------------------------------------------------- */

type Src = { img: TexImageSource; w: number; h: number; key: string }

const builtinCache = new Map<string, HTMLCanvasElement>()
function builtinSrc(id: string, frame: Frame): Src {
  const key = `b:${id}:${frame}`
  let cv = builtinCache.get(key)
  if (cv) {
    builtinCache.delete(key)
    builtinCache.set(key, cv)
  } else {
    cv = renderBuiltin(id, frame)
    builtinCache.set(key, cv)
    while (builtinCache.size > 4) builtinCache.delete(builtinCache.keys().next().value as string)
  }
  return { img: cv, w: cv.width, h: cv.height, key }
}

type UserEntry = { state: "loading" | "ready" | "error"; cv?: HTMLCanvasElement; promise: Promise<void> }
const userCache = new Map<string, UserEntry>()
const readyListeners = new Set<() => void>()

/** Subscribe to "an uploaded image finished loading" so a live piece can redraw. Returns the unsubscribe. */
export function onImageMotionReady(cb: () => void) {
  readyListeners.add(cb)
  return () => void readyListeners.delete(cb)
}

function loadUser(url: string): UserEntry {
  let e = userCache.get(url)
  if (e) return e
  const entry: UserEntry = { state: "loading", promise: Promise.resolve() }
  entry.promise = new Promise<void>((resolve) => {
    const im = new Image()
    im.decoding = "async"
    im.onload = () => {
      const long = Math.max(im.naturalWidth, im.naturalHeight)
      const k = Math.min(1, 2560 / long)
      const cv = document.createElement("canvas")
      cv.width = Math.max(1, Math.round(im.naturalWidth * k))
      cv.height = Math.max(1, Math.round(im.naturalHeight * k))
      cv.getContext("2d")!.drawImage(im, 0, 0, cv.width, cv.height)
      entry.cv = cv
      entry.state = "ready"
      readyListeners.forEach((f) => f())
      resolve()
    }
    im.onerror = () => {
      entry.state = "error"
      resolve()
    }
    im.src = url
  })
  userCache.set(url, entry)
  e = entry
  return e
}

/** Await this before exporting a still or a video, so an uploaded image is decoded when the first frame is drawn. */
export function prepareImageMotion(values: Values): Promise<void> {
  const url = typeof values.image === "string" ? values.image : ""
  return url ? loadUser(url).promise : Promise.resolve()
}

function resolveSource(v: Values, frame: Frame): Src {
  const url = typeof v.image === "string" ? v.image : ""
  if (url) {
    const e = loadUser(url)
    if (e.state === "ready" && e.cv) return { img: e.cv, w: e.cv.width, h: e.cv.height, key: `u:${url}` }
  }
  const id = IMAGE_MOTION_SOURCES.some((s) => s.id === v.source) ? (v.source as string) : "lake"
  return builtinSrc(id, frame)
}

function planeAspect(frame: Frame, src: Src) {
  if (frame === "phone") return PHONE_ASPECT
  if (frame === "browser") return BROWSER_ASPECT
  return clamp(src.w / src.h, 0.45, 2.3)
}

/* -------------------------------------------------------------------------- */
/*                                   Colour                                   */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number]
let colorCtx: CanvasRenderingContext2D | null = null
const colorCache = new Map<string, RGB>()
function parseColor(input: unknown, fallback: RGB = [0.5, 0.5, 0.5]): RGB {
  if (typeof input !== "string") return fallback
  const hit = colorCache.get(input)
  if (hit) return hit
  let out: RGB = fallback
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim())
  if (m) {
    const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
    out = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
  } else if (typeof document !== "undefined") {
    colorCtx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (colorCtx) {
      colorCtx.clearRect(0, 0, 1, 1)
      colorCtx.fillStyle = "#000"
      colorCtx.fillStyle = input
      colorCtx.fillRect(0, 0, 1, 1)
      const d = colorCtx.getImageData(0, 0, 1, 1).data
      out = [d[0] / 255, d[1] / 255, d[2] / 255]
    }
  }
  colorCache.set(input, out)
  return out
}

function stopsOf(v: Values): RGB[] {
  const raw = Array.isArray(v.bg) ? (v.bg as unknown[]) : (IMAGE_MOTION_DEFAULTS.bg as string[])
  const list = raw.map((c) => parseColor(c)).slice(0, 4)
  while (list.length < 2) list.push(list[0] ?? [0.5, 0.5, 0.5])
  return list
}

/* -------------------------------------------------------------------------- */
/*                                  WebGL2                                    */
/* -------------------------------------------------------------------------- */

const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform float uK;        // visible half-height at the plane's distance
uniform float uD;        // camera distance
uniform mat3 uR;         // plane to world
uniform vec3 uC;         // plane centre in world
uniform vec2 uHs;        // plane half size (height is 1)
uniform int uFrame;      // 0 none, 1 phone, 2 browser
uniform float uDark;
uniform float uRad;      // outer corner radius
uniform float uShadow;
uniform float uLift;
uniform vec2 uShOff;
uniform vec3 uStops[4];
uniform int uN;
uniform float uAng;
uniform vec2 uPh;        // sin, cos of the loop phase
uniform float uGrain;
uniform float uSeed;
uniform float uCell;
uniform vec2 uPar;
uniform float uParAmt;
uniform float uImgZoom;
uniform float uSheen;
uniform float uSheenAmt;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sdRoundBox(vec2 p, vec2 b, float r){
  r = min(r, min(b.x, b.y));
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec3 gradient(float s){
  float x = clamp(s, 0.0, 1.0) * float(uN - 1);
  int i = int(min(floor(x), float(uN - 2)));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  return mix(uStops[i], uStops[i + 1], f);
}

vec3 background(vec2 frag){
  vec2 q = (frag - 0.5 * uRes) / uRes.y;
  vec2 d = vec2(cos(uAng), sin(uAng));
  vec2 n = vec2(-d.y, d.x);
  float extent = 0.5 * (abs(d.x) * uRes.x / uRes.y + abs(d.y));
  float s = dot(q, d) / (2.0 * extent) + 0.5;
  s += 0.055 * sin(3.1 * dot(q, n) + atan(uPh.x, uPh.y)) + 0.03 * sin(4.7 * dot(q, d) - atan(uPh.x, uPh.y) + 1.7);
  vec3 c = gradient(s);
  // a soft key light behind the object
  vec2 lq = q - vec2(-0.18, 0.2);
  c += 0.07 * exp(-dot(lq, lq) * 3.2);
  c *= 1.0 - 0.2 * smoothstep(0.35, 1.25, length(q));
  return c;
}

vec3 screenCol(vec2 p, vec2 c, vec2 h){
  vec2 uv = (p - c) / h * 0.5 + 0.5;
  float ra = h.x / h.y;
  float ia = uImg.x / uImg.y;
  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  uv = (uv - 0.5) * s + 0.5;
  uv = (uv - 0.5) / uImgZoom + 0.5;
  if (uParAmt > 0.0) {
    float lum = dot(textureLod(uTex, uv, 3.0).rgb, vec3(0.299, 0.587, 0.114));
    uv += uPar * (lum - 0.5) * uParAmt;
  }
  vec3 col = texture(uTex, uv).rgb;
  float sp = dot(p - c, normalize(vec2(0.7, 0.7)));
  float band = exp(-pow((sp - uSheen) * 3.4, 2.0));
  col += band * 0.07 * uSheenAmt;
  col *= 1.0 + 0.05 * uSheenAmt * (sp - uSheen);
  return col;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 ndc = (frag - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 ro = vec3(0.0, 0.0, uD);
  vec3 rd = normalize(vec3(ndc * uK, -uD));
  mat3 Rt = transpose(uR);
  vec3 ol = Rt * (ro - uC);
  vec3 dl = Rt * rd;
  float dz = abs(dl.z) < 1e-5 ? 1e-5 : dl.z;
  float tt = -ol.z / dz;
  float valid = tt > 0.0 ? 1.0 : 0.0;
  vec2 p = clamp((ol + tt * dl).xy, vec2(-6.0), vec2(6.0));

  vec3 col = background(frag);
  float H = 2.0 * uHs.y;

  // shadow, cast in the plane's own space so it tilts and stretches with the card
  vec2 off = uShOff * H;
  float blur = (0.05 + 0.1 * uLift) * H * (0.55 + 0.9 * uShadow);
  float sd1 = sdRoundBox(p - off, uHs, uRad);
  float s1 = 1.0 - smoothstep(-blur * 0.5, blur * 1.5, sd1);
  s1 *= s1;
  float sd2 = sdRoundBox(p - off * 0.22, uHs, uRad);
  float s2 = 1.0 - smoothstep(-0.004 * H, 0.022 * H, sd2);
  float sh = clamp(uShadow * (0.36 * s1 + 0.2 * s2), 0.0, 0.8) * valid;
  col = mix(col, col * vec3(0.12, 0.125, 0.15), sh);

  float sdO = sdRoundBox(p, uHs, uRad);
  float aa = max(length(vec2(dFdx(sdO), dFdy(sdO))), 1e-5);
  float aO = clamp(0.5 - sdO / aa, 0.0, 1.0) * valid;
  float inner = -sdO;

  vec3 oc;
  if (uFrame == 0) {
    oc = screenCol(p, vec2(0.0), uHs);
    float rim = 1.0 - smoothstep(0.0, aa * 1.6, inner);
    oc = mix(oc, vec3(1.0), rim * 0.16);
  } else if (uFrame == 1) {
    float b = 0.021;
    float sdS = sdRoundBox(p, uHs - b, max(uRad - b, 0.004));
    float aS = clamp(0.5 - sdS / aa, 0.0, 1.0);
    vec3 img = screenCol(p, vec2(0.0), uHs - b);
    float lf = clamp(0.5 + 0.5 * dot(normalize(p + 1e-4), normalize(vec2(-0.6, 0.8))), 0.0, 1.0);
    vec3 metalD = mix(vec3(0.2, 0.2, 0.22), vec3(0.58, 0.58, 0.62), lf);
    vec3 metalL = mix(vec3(0.78, 0.78, 0.8), vec3(0.97, 0.97, 0.98), lf);
    vec3 metal = mix(metalL, metalD, uDark);
    float ring = 1.0 - smoothstep(0.0, 0.0065, inner - 0.0005);
    vec3 glass = vec3(0.012, 0.012, 0.016);
    vec3 body = mix(glass, metal, ring);
    vec2 ic = vec2(0.0, uHs.y - b - 0.036);
    float aI = clamp(0.5 - sdRoundBox(p - ic, vec2(0.064, 0.0155), 0.0155) / aa, 0.0, 1.0);
    oc = mix(body, img, aS);
    oc = mix(oc, vec3(0.0), aI * aS);
  } else {
    float barTop = uHs.y - ${BAR.toFixed(3)};
    vec2 cc = vec2(0.0, -${(BAR / 2).toFixed(4)});
    vec2 ch = vec2(uHs.x, uHs.y - ${(BAR / 2).toFixed(4)});
    vec3 img = screenCol(p, cc, ch);
    float inBar = clamp(0.5 + (p.y - barTop) / aa, 0.0, 1.0);
    vec3 barC = mix(vec3(0.949, 0.949, 0.957), vec3(0.1, 0.1, 0.11), uDark);
    float hl = 1.0 - smoothstep(0.0, aa * 1.5, abs(p.y - barTop));
    barC = mix(barC, mix(vec3(0.0), vec3(1.0), uDark), hl * 0.12);
    float cy = uHs.y - ${(BAR / 2).toFixed(4)};
    for (int i = 0; i < 3; i++) {
      vec2 dc = vec2(-uHs.x + 0.036 + float(i) * 0.0245, cy);
      float a = clamp(0.5 - (length(p - dc) - 0.0072) / aa, 0.0, 1.0);
      barC = mix(barC, mix(vec3(0.8, 0.8, 0.82), vec3(0.3, 0.3, 0.33), uDark), a);
    }
    float aU = clamp(0.5 - sdRoundBox(p - vec2(0.0, cy), vec2(0.2, 0.0175), 0.0175) / aa, 0.0, 1.0);
    barC = mix(barC, mix(vec3(0.9, 0.9, 0.915), vec3(0.17, 0.17, 0.185), uDark), aU);
    oc = mix(img, barC, inBar);
    float rim = 1.0 - smoothstep(0.0, aa * 1.6, inner);
    oc = mix(oc, mix(vec3(0.0), vec3(1.0), uDark), rim * mix(0.16, 0.2, uDark));
  }
  col = mix(col, oc, aO);

  // grain: triangular noise, strongest in the mid-tones, a little lighter on the picture
  vec2 gp = floor(frag / uCell);
  float n = hash12(gp + uSeed * 17.0) + hash12(gp * 1.37 + uSeed * 3.1 + 11.0) - 1.0;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float amp = uGrain * 0.1 * (0.5 + 0.9 * (1.0 - abs(2.0 * lum - 1.0))) * mix(1.0, 0.6, aO);
  col += n * amp;
  col += (hash12(frag + uSeed * 7.0) - 0.5) / 255.0;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

type Renderer = {
  canvas: HTMLCanvasElement | OffscreenCanvas
  gl: WebGL2RenderingContext
  loc: (name: string) => WebGLUniformLocation | null
  tex: WebGLTexture
  texKey: string
  lost: boolean
}

let renderer: Renderer | null = null
let rendererFailed = false

function makeRenderer(): Renderer | null {
  try {
    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(2, 2)
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null
    if (!gl) return null
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader")
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link")
    gl.useProgram(prog)
    gl.bindVertexArray(gl.createVertexArray())
    const tex = gl.createTexture()!
    const cache = new Map<string, WebGLUniformLocation | null>()
    const r: Renderer = {
      canvas,
      gl,
      tex,
      texKey: "",
      lost: false,
      loc: (name) => {
        if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name))
        return cache.get(name) ?? null
      },
    }
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault()
      r.lost = true
      if (renderer === r) renderer = null
    })
    return r
  } catch (err) {
    if (typeof console !== "undefined") console.warn("[image-motion] WebGL2 unavailable, using the 2D fallback.", err)
    return null
  }
}

function getRenderer(): Renderer | null {
  if (renderer && !renderer.lost) return renderer
  if (rendererFailed) return null
  renderer = makeRenderer()
  if (!renderer) rendererFailed = true
  return renderer
}

/** "webgl2" when the shader path is available, otherwise "canvas2d" (the reduced-quality fallback). */
export function imageMotionRenderer(): "webgl2" | "canvas2d" {
  return getRenderer() ? "webgl2" : "canvas2d"
}

function upload(r: Renderer, src: Src) {
  if (r.texKey === src.key) return
  const { gl } = r
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, r.tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src.img)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const ext = gl.getExtension("EXT_texture_filter_anisotropic")
  if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)))
  r.texKey = src.key
}

/* -------------------------------------------------------------------------- */
/*                         Everything a frame needs, once                       */
/* -------------------------------------------------------------------------- */

type Scene = {
  v: Values
  frame: Frame
  motion: MotionId
  dur: number
  phi: number
  P: Pose
  src: Src
  aspect: number
  radius: number
  stops: RGB[]
}

function buildScene(t: number, values: Values): Scene {
  const v: Values = { ...IMAGE_MOTION_DEFAULTS, ...values }
  const dur = clamp(num(v.duration, 6), 0.5, 60)
  currentDuration = dur
  const phase = ((t % dur) + dur) % dur
  const phi = (TAU * phase) / dur
  const frame: Frame = v.frame === "phone" || v.frame === "browser" ? v.frame : "none"
  const motion: MotionId = IMAGE_MOTION_MOTIONS.some((m) => m.id === v.motion) ? (v.motion as MotionId) : "orbit"
  const P = pose(motion, phi, clamp(num(v.intensity, 1), 0, 2))
  const src = resolveSource(v, frame)
  const aspect = planeAspect(frame, src)
  const cr = clamp(num(v.radius, 0.28), 0, 1)
  let radius: number
  if (frame === "phone") radius = aspect * (0.07 + 0.28 * cr)
  else if (frame === "browser") radius = 0.004 + 0.09 * cr
  else radius = cr * 0.5 * Math.min(aspect, 1) * 0.9
  return { v, frame, motion, dur, phi, P, src, aspect, radius, stops: stopsOf(v) }
}

/** Matrix columns of R = Ry(yaw) · Rx(pitch) · Rz(roll), column-major for WebGL. */
function rotation(yaw: number, pitch: number, roll: number): Float32Array {
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cx = Math.cos(pitch), sx = Math.sin(pitch)
  const cz = Math.cos(roll), sz = Math.sin(roll)
  // rows
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy]
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx]
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1]
  const mul = (a: number[], b: number[]) => {
    const o = new Array(9).fill(0)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]
    return o
  }
  const m = mul(Ry, mul(Rx, Rz))
  return new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]])
}

/** Visible half-height at the plane, so the plane fills a calm share of the artboard whatever its shape. */
function visibleK(aspect: number, w: number, h: number, size: number) {
  const ca = w / h
  const forH = 0.5 / 0.72
  const forW = (aspect * 0.5) / 0.66 / ca
  return Math.max(forH, forW) / size
}

function glRender(r: Renderer, S: Scene, pw: number, ph: number, t: number) {
  const { gl } = r
  const v = S.v
  const c = r.canvas
  if (c.width !== pw || c.height !== ph) {
    c.width = pw
    c.height = ph
  }
  gl.viewport(0, 0, pw, ph)
  upload(r, S.src)
  const u = r.loc
  const P = S.P
  const persp = clamp(num(v.perspective, 0.5), 0, 1)
  const D = 24 * Math.pow(3 / 24, persp)
  const k = visibleK(S.aspect, pw, ph, clamp(num(v.size, 1), 0.3, 2)) / P.zoom
  const lift = P.lift
  gl.uniform2f(u("uRes"), pw, ph)
  gl.uniform1i(u("uTex"), 0)
  gl.uniform2f(u("uImg"), S.src.w, S.src.h)
  gl.uniform1f(u("uK"), k)
  gl.uniform1f(u("uD"), D)
  gl.uniformMatrix3fv(u("uR"), false, rotation(P.yaw, P.pitch, P.roll))
  gl.uniform3f(u("uC"), P.tx, P.ty, Math.min(P.tz, D - 1))
  gl.uniform2f(u("uHs"), S.aspect / 2, 0.5)
  gl.uniform1i(u("uFrame"), S.frame === "phone" ? 1 : S.frame === "browser" ? 2 : 0)
  gl.uniform1f(u("uDark"), v.darkFrame === false ? 0 : 1)
  gl.uniform1f(u("uRad"), S.radius)
  gl.uniform1f(u("uShadow"), clamp(num(v.shadow, 0.55), 0, 1))
  gl.uniform1f(u("uLift"), lift)
  gl.uniform2f(u("uShOff"), 0.018 + P.yaw * 0.07, -(0.035 + 0.05 * lift) - P.pitch * 0.06)
  const flat = new Float32Array(12)
  S.stops.forEach((s, i) => flat.set(s, i * 3))
  gl.uniform3fv(u("uStops[0]"), flat)
  gl.uniform1i(u("uN"), S.stops.length)
  gl.uniform1f(u("uAng"), (num(v.angle, 62) * Math.PI) / 180)
  gl.uniform2f(u("uPh"), Math.sin(S.phi), Math.cos(S.phi))
  gl.uniform1f(u("uGrain"), clamp(num(v.grain, 0.35), 0, 1))
  gl.uniform1f(u("uSeed"), 1 + Math.floor(((t % S.dur) + S.dur) % S.dur * 12) % 997)
  gl.uniform1f(u("uCell"), Math.max(1, Math.round(Math.max(pw, ph) / 1100)))
  gl.uniform2f(u("uPar"), P.par[0], P.par[1])
  gl.uniform1f(u("uParAmt"), P.parAmt)
  gl.uniform1f(u("uImgZoom"), P.imgZoom)
  gl.uniform1f(u("uSheen"), clamp(-P.yaw * 1.1 + P.pitch * 0.6, -0.8, 0.8))
  gl.uniform1f(u("uSheenAmt"), clamp(num(v.sheen, 0.5), 0, 1))
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

/* -------------------------------------------------------------------------- */
/*                         Canvas2D fallback (reduced)                         */
/* -------------------------------------------------------------------------- */

let noiseTile: HTMLCanvasElement | null = null
function grainTile() {
  if (noiseTile || typeof document === "undefined") return noiseTile
  const c = document.createElement("canvas")
  c.width = c.height = 128
  const x = c.getContext("2d")!
  const id = x.createImageData(128, 128)
  for (let i = 0; i < id.data.length; i += 4) {
    const n = Math.random() * 255
    id.data[i] = id.data[i + 1] = id.data[i + 2] = n
    id.data[i + 3] = 255
  }
  x.putImageData(id, 0, 0)
  return (noiseTile = c)
}

function drawFallback(ctx: CanvasRenderingContext2D, w: number, h: number, S: Scene) {
  const v = S.v
  const P = S.P
  ctx.save()
  // background
  const a = (num(v.angle, 62) * Math.PI) / 180
  const L = Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h
  const cx = w / 2, cy = h / 2
  const g = ctx.createLinearGradient(cx - (Math.cos(a) * L) / 2, cy + (Math.sin(a) * L) / 2, cx + (Math.cos(a) * L) / 2, cy - (Math.sin(a) * L) / 2)
  S.stops.forEach((s, i) => g.addColorStop(i / (S.stops.length - 1), `rgb(${s.map((x) => Math.round(x * 255)).join(",")})`))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // plane, scaled so its height is 64% of the artboard (or its width 60%)
  const k = visibleK(S.aspect, w, h, clamp(num(v.size, 1), 0.3, 2)) / P.zoom
  const unit = h / (2 * k)
  const pw = S.aspect * unit
  const ph = unit
  const radius = S.radius * unit
  const persp = 0.06 + 0.1 * clamp(num(v.perspective, 0.5), 0, 1)
  const cyaw = Math.cos(P.yaw), cp = Math.cos(P.pitch)
  ctx.translate(cx + P.tx * unit, cy - P.ty * unit)
  ctx.transform(cyaw * Math.cos(P.roll), cyaw * Math.sin(P.roll) - Math.sin(P.yaw) * persp, -cp * Math.sin(P.roll) + Math.sin(P.pitch) * persp, cp * Math.cos(P.roll), 0, 0)
  const rr = () => {
    ctx.beginPath()
    ctx.roundRect(-pw / 2, -ph / 2, pw, ph, radius)
  }
  const shadow = clamp(num(v.shadow, 0.55), 0, 1)
  ctx.shadowColor = `rgba(10,12,18,${0.45 * shadow})`
  ctx.shadowBlur = unit * (0.08 + 0.1 * P.lift)
  ctx.shadowOffsetY = unit * (0.04 + 0.05 * P.lift)
  ctx.fillStyle = S.frame === "browser" ? (v.darkFrame === false ? "#f2f2f4" : "#1a1a1c") : S.frame === "phone" ? (v.darkFrame === false ? "#d8d8dc" : "#101012") : "#000"
  rr()
  ctx.fill()
  ctx.shadowColor = "transparent"
  ctx.save()
  rr()
  ctx.clip()
  // screen rect
  let sx = -pw / 2, sy = -ph / 2, sw = pw, sh = ph
  if (S.frame === "phone") {
    const b = 0.021 * unit
    ctx.fillStyle = "#050507"
    ctx.fillRect(sx, sy, sw, sh)
    sx += b; sy += b; sw -= 2 * b; sh -= 2 * b
  } else if (S.frame === "browser") {
    const bar = BAR * unit
    sy += bar; sh -= bar
  }
  const ia = S.src.w / S.src.h
  const ra = sw / sh
  let srcW = S.src.w, srcH = S.src.h, srcX = 0, srcY = 0
  if (ra > ia) { srcH = S.src.w / ra; srcY = (S.src.h - srcH) / 2 } else { srcW = S.src.h * ra; srcX = (S.src.w - srcW) / 2 }
  ctx.save()
  if (S.frame === "phone") {
    ctx.beginPath()
    ctx.roundRect(sx, sy, sw, sh, Math.max(radius - 0.021 * unit, 2))
    ctx.clip()
  }
  const zoom = P.imgZoom
  ctx.drawImage(S.src.img as CanvasImageSource, srcX + (srcW * (1 - 1 / zoom)) / 2, srcY + (srcH * (1 - 1 / zoom)) / 2, srcW / zoom, srcH / zoom, sx, sy, sw, sh)
  ctx.restore()
  ctx.restore()
  ctx.restore()
  // grain
  const gr = clamp(num(v.grain, 0.35), 0, 1)
  const tile = grainTile()
  if (tile && gr > 0.01) {
    ctx.save()
    ctx.globalCompositeOperation = "overlay"
    ctx.globalAlpha = gr * 0.35
    ctx.fillStyle = ctx.createPattern(tile, "repeat")!
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
}

/* -------------------------------------------------------------------------- */
/*                                  The draw                                   */
/* -------------------------------------------------------------------------- */

let currentDuration = 6
/** The loop length the last frame was drawn with (the Studio reads this for video and GIF). */
export const getImageMotionDuration = () => currentDuration

const MAX_SIDE = 4096

/**
 * Paint the frame at `t` seconds into `ctx`, w by h in the context's own units. Pure apart from the image cache:
 * the same arguments give the same picture. Uploaded images should be awaited with prepareImageMotion first.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: Values = {}) {
  const S = buildScene(t, values)
  const r = getRenderer()
  if (!r) {
    drawFallback(ctx, w, h, S)
    return
  }
  const dev = Math.max(ctx.getTransform().a || 1, 0.25)
  const k = Math.min(1, MAX_SIDE / Math.max(w * dev, h * dev))
  const pw = Math.max(2, Math.round(w * dev * k))
  const ph = Math.max(2, Math.round(h * dev * k))
  glRender(r, S, pw, ph, t)
  // Copy in the same task as the draw call, before the browser can clear the drawing buffer.
  ctx.drawImage(r.canvas as CanvasImageSource, 0, 0, w, h)
}

/* -------------------------------------------------------------------------- */
/*                                 The piece                                   */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED_QUERY)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

export function ImageMotion({ values, speed = 1, paused = false, size, time, canvasRef }: StudioPieceProps) {
  const wrap = React.useRef<HTMLDivElement>(null)
  const cv = React.useRef<HTMLCanvasElement | null>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)
  const [tick, setTick] = React.useState(0)
  const vals = React.useRef<Values>({})
  const clockRef = React.useRef(0)
  vals.current = values ?? {}

  React.useEffect(() => onImageMotionReady(() => setTick((n) => n + 1)), [])

  React.useEffect(() => {
    if (size) return
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [size])

  const aw = size?.w ?? box?.w ?? 0
  const ah = size?.h ?? box?.h ?? 0
  const cap = Math.min(1, 1400 / Math.max(aw, ah, 1))
  const bw = Math.max(2, Math.round(aw * cap))
  const bh = Math.max(2, Math.round(ah * cap))

  const setRef = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cv.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  const still = time !== undefined || reduced
  React.useEffect(() => {
    const el = cv.current
    if (!el || !aw || !ah) return
    const ctx = el.getContext("2d")
    if (!ctx) return
    const paint = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.scale(el.width / bw, el.height / bh)
      draw(ctx, bw, bh, t, vals.current)
    }
    const dur = clamp(num(vals.current.duration, 6), 0.5, 60)
    if (still) {
      paint(time ?? dur * 0.12)
      return
    }
    let raf = 0
    let last = performance.now()
    let visible = true
    const io = new IntersectionObserver((es) => void (visible = es[es.length - 1]?.isIntersecting ?? true))
    io.observe(el)
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!paused && visible) clockRef.current += dt * speed
      if (visible) paint(clockRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [aw, ah, bw, bh, still, time, paused, speed, tick, values])

  return (
    <div ref={wrap} className="absolute inset-0 h-full w-full overflow-hidden" data-image-motion>
      <canvas ref={setRef} width={bw} height={bh} className="block h-full w-full" aria-label="Image in 3D motion" role="img" />
    </div>
  )
}

export default ImageMotion
