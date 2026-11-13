// Everything that turns the artboard into a file. The heavy parts (modern-screenshot, the WebM
// muxer, the GIF worker) are imported only when an export of that kind runs.
import type { StudioSpec, Values } from "./schema"

export type Job = {
  spec: StudioSpec
  values: Values
  w: number
  h: number
  /** The moment shown on the artboard, in seconds. */
  t: number
  /** The artboard node, for pieces that can only be captured from the DOM. */
  dom?: HTMLElement | null
  signal?: AbortSignal
  onProgress?: (done: number, total: number, label?: string) => void
}

export class Cancelled extends Error {
  constructor() {
    super("Cancelled")
  }
}

const MAX_SIDE = 8192
const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
function check(signal?: AbortSignal) {
  if (signal?.aborted) throw new Cancelled()
}

/* ------------------------------ capability ------------------------------ */

export type Cap = { ok: boolean; reason?: string }

const hasFrames = (s: StudioSpec) => !!(s.draw || s.svg)

export function capabilities(spec: StudioSpec): { png: Cap; svg: Cap; webm: Cap; gif: Cap } {
  const png: Cap = spec.export.png === false ? { ok: false, reason: "This piece has no still export." } : { ok: true }
  const svg: Cap = spec.export.svg && spec.svg ? { ok: true } : { ok: false, reason: "SVG is available for Dash Burst and Peek Icon. This piece is drawn on a canvas." }
  const motion = (flag: boolean | undefined): Cap => {
    if (!spec.duration) return { ok: false, reason: "Stills only." }
    if (!flag || !hasFrames(spec)) return { ok: false, reason: "Stills only; this piece is captured from the page." }
    return { ok: true }
  }
  const webm = motion(spec.export.webm)
  if (webm.ok && typeof VideoEncoder === "undefined" && typeof MediaRecorder === "undefined") return { png, svg, webm: { ok: false, reason: "This browser cannot record video." }, gif: motion(spec.export.gif) }
  return { png, svg, webm, gif: motion(spec.export.gif) }
}

/** The pixel size of a video or GIF: 1x, with the long edge capped. */
export function motionSize(w: number, h: number, hd: boolean, kind: "webm" | "gif") {
  const cap = hd ? 1920 : kind === "gif" ? 720 : 1080
  const k = Math.min(1, cap / Math.max(w, h))
  const even = (n: number) => Math.max(2, Math.round((n * k) / 2) * 2)
  return { w: even(w), h: even(h), k: (even(w) / w + even(h) / h) / 2 }
}

export function motionPlan(spec: StudioSpec, kind: "webm" | "gif", hd: boolean, w: number, h: number) {
  const dur = spec.duration ?? 0
  const size = motionSize(w, h, hd, kind)
  const fps = kind === "webm" ? 30 : Math.round(Math.min(15, Math.max(6, 120 / Math.max(1, dur))))
  const frames = Math.max(2, Math.round(dur * fps))
  const estimate = kind === "gif" ? size.w * size.h * frames * 0.22 : size.w * size.h * fps * dur * 0.1 / 8
  return { ...size, fps, frames, estimate }
}

export function formatBytes(n: number) {
  return n > 1e6 ? `${(n / 1e6).toFixed(n > 1e7 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`
}

/* -------------------------------- frames -------------------------------- */

export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

export function freeCanvas(c: HTMLCanvasElement) {
  c.width = 0
  c.height = 0
}

function drawInto(c: HTMLCanvasElement, job: Job, scale: number, t: number) {
  const ctx = c.getContext("2d", { willReadFrequently: false }) as CanvasRenderingContext2D
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, job.w, job.h)
  job.spec.draw!(ctx, job.w, job.h, t, job.values)
}

/** The piece's SVG with explicit width and height, so it rasterises at the size we ask for. */
export function svgMarkup(job: Job, t: number) {
  let s = job.spec.svg!(job.w, job.h, t, job.values).trim()
  s = s.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    let a = attrs
    if (!/\sxmlns=/.test(a)) a += ' xmlns="http://www.w3.org/2000/svg"'
    if (!/\sviewBox=/.test(a)) a += ` viewBox="0 0 ${job.w} ${job.h}"`
    a = a.replace(/\s(width|height)="[^"]*"/g, "")
    return `<svg${a} width="${job.w}" height="${job.h}">`
  })
  return s
}

async function rasterSvg(markup: string, target: HTMLCanvasElement) {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const ctx = target.getContext("2d")!
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, target.width, target.height)
    ctx.drawImage(img, 0, 0, target.width, target.height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(c: HTMLCanvasElement, type = "image/png") {
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("The browser could not encode the image."))), type))
}

/** A function that returns a canvas holding the frame at time t, reusing one canvas. */
function frameRenderer(job: Job, W: number, H: number) {
  const canvas = makeCanvas(W, H)
  const k = W / job.w
  const render = async (t: number) => {
    if (job.spec.draw) drawInto(canvas, job, k, t)
    else await rasterSvg(svgMarkup(job, t), canvas)
    return canvas
  }
  return { canvas, render }
}

/* --------------------------------- stills -------------------------------- */

export function stillSize(job: Pick<Job, "w" | "h">, scale: number) {
  return { w: Math.round(job.w * scale), h: Math.round(job.h * scale) }
}

export function stillTooLarge(job: Pick<Job, "w" | "h">, scale: number) {
  const s = stillSize(job, scale)
  return Math.max(s.w, s.h) > MAX_SIDE || s.w * s.h > 100e6
}

export async function exportPng(job: Job, scale: number): Promise<Blob> {
  await job.spec.prepare?.(job.values)
  const { w: W, h: H } = stillSize(job, scale)
  if (stillTooLarge(job, scale)) throw new Error(`${W} × ${H} is more than the browser can draw. Pick a lower scale.`)
  const mode = job.spec.export.png
  if (mode === "canvas" && job.spec.draw) {
    const c = makeCanvas(W, H)
    try {
      drawInto(c, job, scale, job.t)
      return await toBlob(c)
    } finally {
      freeCanvas(c)
    }
  }
  if ((mode === "svg" || (mode === "canvas" && !job.spec.draw)) && job.spec.svg) {
    const c = makeCanvas(W, H)
    try {
      await rasterSvg(svgMarkup(job, job.t), c)
      return await toBlob(c)
    } finally {
      freeCanvas(c)
    }
  }
  if (!job.dom) throw new Error("The artboard is not on screen.")
  const { domToBlob } = await import("modern-screenshot")
  const blob = await domToBlob(job.dom, { scale, width: job.w, height: job.h, type: "image/png", style: { transform: "none", margin: "0" } })
  if (!blob) throw new Error("The page capture came back empty.")
  return blob
}

export function exportSvg(job: Job): Blob {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup(job, job.t)}`], { type: "image/svg+xml" })
}

/* --------------------------------- video --------------------------------- */

export async function exportWebm(job: Job, hd: boolean): Promise<Blob> {
  await job.spec.prepare?.(job.values)
  const plan = motionPlan(job.spec, "webm", hd, job.w, job.h)
  const { canvas, render } = frameRenderer(job, plan.w, plan.h)
  try {
    const viaCodecs = await encodeWebCodecs(job, render, plan)
    if (viaCodecs) return viaCodecs
    return await recordRealtime(job, render, canvas, plan)
  } finally {
    freeCanvas(canvas)
  }
}

type Plan = ReturnType<typeof motionPlan>

async function encodeWebCodecs(job: Job, render: (t: number) => Promise<HTMLCanvasElement>, plan: Plan): Promise<Blob | null> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null
  const bitrate = Math.round(plan.w * plan.h * plan.fps * 0.12)
  const options = [
    { codec: "vp09.00.10.08", mux: "V_VP9" as const },
    { codec: "vp8", mux: "V_VP8" as const },
  ]
  for (const o of options) {
    const cfg: VideoEncoderConfig = { codec: o.codec, width: plan.w, height: plan.h, bitrate, framerate: plan.fps }
    let ok = false
    try {
      ok = !!(await VideoEncoder.isConfigSupported(cfg)).supported
    } catch {
      ok = false
    }
    if (!ok) continue
    const { Muxer, ArrayBufferTarget } = await import("webm-muxer")
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: o.mux, width: plan.w, height: plan.h, frameRate: plan.fps } })
    let failure: unknown = null
    const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) })
    enc.configure(cfg)
    try {
      for (let i = 0; i < plan.frames; i++) {
        check(job.signal)
        if (failure) throw failure
        const cv = await render(i / plan.fps)
        const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / plan.fps), duration: Math.round(1e6 / plan.fps) })
        enc.encode(frame, { keyFrame: i % (plan.fps * 2) === 0 })
        frame.close()
        job.onProgress?.(i + 1, plan.frames)
        while (enc.encodeQueueSize > 6) await sleep(4)
        if (i % 4 === 3) await tick()
      }
      await enc.flush()
      if (failure) throw failure
      muxer.finalize()
      return new Blob([muxer.target.buffer], { type: "video/webm" })
    } catch (e) {
      if (e instanceof Cancelled) throw e
      if (o === options[options.length - 1]) return null
    } finally {
      if (enc.state !== "closed") enc.close()
    }
  }
  return null
}

/** Records one loop in real time. Used where WebCodecs cannot encode VP8 or VP9 (older Safari). */
async function recordRealtime(job: Job, render: (t: number) => Promise<HTMLCanvasElement>, canvas: HTMLCanvasElement, plan: Plan): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot record video.")
  const type = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t))
  if (!type) throw new Error("This browser cannot record WebM. Try GIF or PNG.")
  const stream = canvas.captureStream(plan.fps)
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: Math.round(plan.w * plan.h * plan.fps * 0.12) })
  const parts: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()))
  const dur = job.spec.duration ?? 1
  rec.start(250)
  const t0 = performance.now()
  try {
    for (;;) {
      check(job.signal)
      const t = (performance.now() - t0) / 1000
      if (t >= dur) break
      await render(t)
      job.onProgress?.(Math.min(plan.frames, Math.round(t * plan.fps)), plan.frames, "Recording in real time")
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
  } finally {
    if (rec.state !== "inactive") rec.stop()
    stream.getTracks().forEach((tr) => tr.stop())
  }
  await stopped
  return new Blob(parts, { type: "video/webm" })
}

/* ---------------------------------- gif ---------------------------------- */

export async function exportGif(job: Job, hd: boolean): Promise<Blob> {
  await job.spec.prepare?.(job.values)
  const plan = motionPlan(job.spec, "gif", hd, job.w, job.h)
  const { canvas, render } = frameRenderer(job, plan.w, plan.h)
  const worker = new Worker(new URL("./gif.worker.ts", import.meta.url), { type: "module" })
  let acked = 0
  let failure: unknown = null
  const result = new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<{ type: string; buffer?: ArrayBuffer }>) => {
      if (e.data.type === "progress") acked++
      if (e.data.type === "gif") resolve(new Blob([e.data.buffer!], { type: "image/gif" }))
    }
    worker.onerror = (e) => {
      failure = new Error(e.message || "The GIF encoder failed.")
      reject(failure)
    }
  })
  result.catch(() => {})
  try {
    worker.postMessage({ type: "init", w: plan.w, h: plan.h, delay: Math.round(1000 / plan.fps) })
    const probe = canvas.getContext("2d")!
    for (let i = 0; i < plan.frames; i++) {
      check(job.signal)
      if (failure) throw failure
      await render(i / plan.fps)
      const data = probe.getImageData(0, 0, plan.w, plan.h).data
      worker.postMessage({ type: "frame", data: data.buffer }, [data.buffer])
      job.onProgress?.(i + 1, plan.frames)
      while (i + 1 - acked > 4) {
        check(job.signal)
        await sleep(8)
      }
    }
    while (acked < plan.frames) {
      check(job.signal)
      if (failure) throw failure
      job.onProgress?.(acked, plan.frames, "Encoding")
      await sleep(16)
    }
    worker.postMessage({ type: "finish" })
    return await result
  } finally {
    worker.terminate()
    freeCanvas(canvas)
  }
}

/* --------------------------------- output -------------------------------- */

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Copies a PNG. Returns false when the browser has no image clipboard (the caller saves a file instead). */
export async function copyImage(blob: Promise<Blob>): Promise<boolean> {
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") return false
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    return true
  } catch (e) {
    if (e instanceof Cancelled) throw e
    return false
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  }
}
