"use client"

import * as React from "react"
import { Feather, FileText, Lock } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** One fact printed above the slab: what is being approved. */
export type SealDetail = { label: string; value: string }

/** Passed to `onApprove`: the time that was pressed into the wax. */
export type SealApproval = { time: string; at: Date }

/**
 * idle: waiting for the press · stamping: the wax is being pressed (about 1 s) ·
 * sealed: approved, the undo window is open · locked: the window closed ·
 * breaking: the seal is cracking, about to return to idle.
 */
export type SealPhase = "idle" | "stamping" | "sealed" | "locked" | "breaking"

export type SealProps = {
  /** What is being approved, as a sentence. */
  title?: string
  /** Who prepared it. Shown in the header with a neutral glyph tile. */
  from?: { name: string; note?: string }
  /** Up to three facts under the title (document, audience, checks). */
  details?: SealDetail[]
  /** The real-world consequence of approving. Printed on the slab, before and after. */
  consequence?: string
  /** Label on the front of the slab. */
  actionLabel?: string
  /** One to three letters engraved in the wax. The pixel font has A-Z, 0-9 and a colon; other characters are skipped. */
  mark?: string
  /** Who is approving: "Approved by you". */
  approver?: string
  /** Time pressed into the wax, "14:02" (up to 5 characters of A-Z, 0-9 and colon). Defaults to the clock at the moment of the press. */
  time?: string
  /** Diameter of the wax in px. 124 by default; raise it to fill a tall crop, e.g. a launch film. */
  waxSize?: number
  /** Seconds the seal can be broken after it is set. */
  undoSeconds?: number
  /** Start already sealed, with the undo window open. */
  defaultSealed?: boolean
  /** Dims the seal and ignores the press. */
  disabled?: boolean
  /** Play a short synthesised "thock" on press, seal and break. Off by default. */
  sound?: boolean
  /** Vibrate on press, seal and break where the device supports it. Off by default. */
  haptics?: boolean
  /** Fires at the same moments as sound and haptics, so you can plug in your own. */
  onFeedback?: (kind: "press" | "seal" | "break") => void
  /**
   * The press landed. This fires optimistically, at the moment of the press: `onBreak` must take it back.
   * For work that cannot be undone (sending, publishing), wait for `onLock` instead.
   */
  onApprove?: (approval: SealApproval) => void
  /** Break seal was used inside the undo window. */
  onBreak?: () => void
  /** The undo window closed: the approval is final. Do irreversible work here. */
  onLock?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Wax art                                   */
/* -------------------------------------------------------------------------- */

const N = 56
const C = N / 2

/** 3x5 pixel letters and digits for the mark and the time. "|" separates rows. */
const FONT: Record<string, string> = {
  A: ".#.|#.#|###|#.#|#.#", B: "##.|#.#|##.|#.#|##.", C: ".##|#..|#..|#..|.##", D: "##.|#.#|#.#|#.#|##.",
  E: "###|#..|##.|#..|###", F: "###|#..|##.|#..|#..", G: ".##|#..|#.#|#.#|.##", H: "#.#|#.#|###|#.#|#.#",
  I: "###|.#.|.#.|.#.|###", J: "..#|..#|..#|#.#|.#.", K: "#.#|#.#|##.|#.#|#.#", L: "#..|#..|#..|#..|###",
  M: "#.#|###|###|#.#|#.#", N: "##.|#.#|#.#|#.#|#.#", O: ".#.|#.#|#.#|#.#|.#.", P: "##.|#.#|##.|#..|#..",
  Q: ".#.|#.#|#.#|##.|.##", R: "##.|#.#|##.|#.#|#.#", S: ".##|#..|.#.|..#|##.", T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###", V: "#.#|#.#|#.#|#.#|.#.", W: "#.#|#.#|###|###|#.#", X: "#.#|#.#|.#.|#.#|#.#",
  Y: "#.#|#.#|.#.|.#.|.#.", Z: "###|..#|.#.|#..|###",
  "0": "###|#.#|#.#|#.#|###", "1": ".#.|##.|.#.|.#.|###", "2": "##.|..#|.#.|#..|###", "3": "##.|..#|.#.|..#|##.",
  "4": "#.#|#.#|###|..#|..#", "5": "###|#..|##.|..#|##.", "6": ".##|#..|###|#.#|###", "7": "###|..#|.#.|.#.|.#.",
  "8": "###|#.#|###|#.#|###", "9": "###|#.#|###|..#|##.", ":": ".|#|.|#|.",
}

/** Cells of a line of text, centred on x = C with its top row at `top`. */
function textCells(text: string, scale: number, gap: number, top: number): Set<number> {
  const glyphs = [...text.toUpperCase()].map((ch) => FONT[ch]?.split("|")).filter((g): g is string[] => !!g)
  const width = glyphs.reduce((sum, g) => sum + g[0].length * scale, 0) + Math.max(0, glyphs.length - 1) * gap
  const out = new Set<number>()
  let x0 = Math.round(C - width / 2)
  for (const g of glyphs) {
    g.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] !== "#") continue
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) {
            const x = x0 + rx * scale + sx
            if (x >= 0 && x < N) out.add((top + ry * scale + sy) * N + x)
          }
      }
    })
    x0 += g[0].length * scale + gap
  }
  return out
}

/** Ordered-dither thresholds (Bayer 8x8), 0..1. */
const BAYER = (() => {
  let m: number[][] = [[0]]
  while (m.length < 8) {
    const n = m.length
    const next = Array.from({ length: n * 2 }, () => Array<number>(n * 2).fill(0))
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + n] = v + 2
        next[y + n][x] = v + 3
        next[y + n][x + n] = v + 1
      }
    m = next
  }
  return m.map((row) => row.map((v) => (v + 0.5) / 64))
})()

/** Hand-pressed wax never has a perfect edge. */
const edge = (a: number) => 25.6 + 0.9 * Math.sin(3 * a + 0.8) + 0.55 * Math.sin(5 * a + 2.1) + 0.35 * Math.sin(9 * a + 0.3)
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

type Layers = { lite: string; dark: string; hot: string }
type WaxArt = { body: string; raised: Layers; pressed: Layers; timeLite: string; timeDark: string }

const cell = (x: number, y: number) => `M${x} ${y}h1v1h-1z`

/**
 * Builds the wax once per mark and time. `raised` is the seal as a thing you can press (domed rim, raised letters);
 * `pressed` is the impression it leaves (the same rim, light reversed, letters sunk, plus the time).
 * Every cell is one value in -1..1 compared with a Bayer threshold: negative cells become dark dots, positive ones light dots.
 */
function buildWax(mark: string, time: string): WaxArt {
  const markCells = textCells(mark.slice(0, 3), 2, 2, 14)
  const timeCells = textCells(time.slice(0, 5), 1, 1, 33)
  const rule = new Set<number>()
  for (let x = 22; x < 34; x++) rule.add(29 * N + x)

  let body = ""
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2
    const r = edge(a)
    body += `${i ? "L" : "M"}${(C + Math.cos(a) * r).toFixed(2)} ${(C + Math.sin(a) * r).toFixed(2)}`
  }
  body += "Z"

  const make = (variant: "raised" | "pressed") => {
    const sign = variant === "raised" ? 1 : -1
    const lite: string[] = []
    const dark: string[] = []
    const hot: string[] = []
    const tLite: string[] = []
    const tDark: string[] = []
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x + 0.5 - C
        const dy = y + 0.5 - C
        const r = Math.hypot(dx, dy)
        const depth = edge(Math.atan2(dy, dx)) - r
        if (depth < 0.4) continue
        const nx = r ? dx / r : 0
        const ny = r ? dy / r : 0
        const facing = -(nx + ny) * 0.707 // 1 toward the light at the top left
        let f = 0
        if (depth < 4.4) f = sign * facing * (0.3 + 0.8 * (1 - depth / 4.4))
        else f = sign * facing * 0.1 * (r / 26)
        if (depth < 1.4) f = -0.62 + 0.42 * sign * facing
        else if (depth > 8.2 && depth < 9.6) f = variant === "raised" ? -0.7 : -0.85
        else if (depth >= 9.6 && depth < 10.8) f = 0.5
        else if (depth >= 10.8) f += (hash(x, y) - 0.5) * 0.2
        const i = y * N + x
        const onTime = variant === "pressed" && (timeCells.has(i) || (timeCells.has(i - N - 1) && !timeCells.has(i)))
        if (markCells.has(i)) f = variant === "raised" ? 0.95 : -1
        else if (markCells.has(i - N - 1)) f = variant === "raised" ? -0.9 : 0.9
        else if (rule.has(i)) f = variant === "raised" ? 0.75 : -0.8
        else if (onTime) f = timeCells.has(i) ? -1 : 0.75
        const t = BAYER[y & 7][x & 7]
        // the brightest cells on the lit side of the rim become a hot specular line
        const isHot = !onTime && !markCells.has(i) && f > 0.78 && depth > 1.2 && depth < 3.4 && sign * facing > 0.8
        const target = onTime ? (f < 0 ? tDark : tLite) : isHot ? hot : f < 0 ? dark : lite
        if (Math.abs(f) > t) target.push(cell(x, y))
      }
    }
    return { lite: lite.join(""), dark: dark.join(""), hot: hot.join(""), tLite: tLite.join(""), tDark: tDark.join("") }
  }
  const raised = make("raised")
  const pressed = make("pressed")
  return {
    body,
    raised: { lite: raised.lite, dark: raised.dark, hot: raised.hot },
    pressed: { lite: pressed.lite, dark: pressed.dark, hot: pressed.hot },
    timeLite: pressed.tLite,
    timeDark: pressed.tDark,
  }
}

function Wax({ art, glint }: { art: WaxArt; glint?: boolean }) {
  const raw = React.useId().replace(/:/g, "")
  const clip = `isl-clip-${raw}`
  const grad = `isl-grad-${raw}`
  return (
    <svg className="isl-art" viewBox={`0 0 ${N} ${N}`} aria-hidden focusable="false">
      <defs>
        <clipPath id={clip}>
          <path d={art.body} />
        </clipPath>
        <linearGradient id={grad} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" style={{ stopColor: "var(--isl-glint)" }} stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="isl-body" d={art.body} />
      <g clipPath={`url(#${clip})`}>
        <g className="isl-v isl-raised">
          <path className="isl-lite" d={art.raised.lite} />
          <path className="isl-dark" d={art.raised.dark} />
          <path className="isl-hot" d={art.raised.hot} />
        </g>
        <g className="isl-v isl-pressed">
          <path className="isl-lite" d={art.pressed.lite} />
          <path className="isl-dark" d={art.pressed.dark} />
          <path className="isl-hot" d={art.pressed.hot} />
          <g className="isl-time">
            <path className="isl-lite" d={art.timeLite} />
            <path className="isl-dark" d={art.timeDark} />
          </g>
        </g>
        {glint ? (
          <g transform={`rotate(24 ${C} ${C})`}>
            <rect className="isl-sheen" x="-14" y="-8" width="10" height="72" fill={`url(#${grad})`} />
          </g>
        ) : null}
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Sound and haptics                             */
/* -------------------------------------------------------------------------- */

let audio: AudioContext | undefined

/** A tiny synthesised thock: a sine that drops in pitch (press, seal) or a short noise crack (break). */
function playTone(kind: "press" | "seal" | "break") {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    audio ??= new AC()
    if (audio.state === "suspended") void audio.resume()
    const ctx = audio
    const t = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    if (kind === "break") {
      const len = Math.floor(ctx.sampleRate * 0.07)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const src = ctx.createBufferSource()
      const hp = ctx.createBiquadFilter()
      hp.type = "highpass"
      hp.frequency.value = 1800
      src.buffer = buf
      src.connect(hp).connect(gain)
      gain.gain.setValueAtTime(0.22, t)
      src.start(t)
      return
    }
    const osc = ctx.createOscillator()
    osc.type = "sine"
    osc.frequency.setValueAtTime(kind === "seal" ? 190 : 320, t)
    osc.frequency.exponentialRampToValueAtTime(kind === "seal" ? 58 : 190, t + (kind === "seal" ? 0.1 : 0.035))
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(kind === "seal" ? 0.4 : 0.1, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "seal" ? 0.16 : 0.05))
    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.18)
  } catch {
    /* audio is a nicety; never let it break an approval */
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.isl {
  --isl-ink: #000;
  --isl-surface: #fff;
  --isl-accent: #0060e2;
  --isl-ok: #14804a;
  --isl-warn: #a15c00;
  --isl-t1: color-mix(in oklab, var(--isl-ink) 88%, transparent);
  --isl-t2: color-mix(in oklab, var(--isl-ink) 61%, transparent);
  --isl-t3: color-mix(in oklab, var(--isl-ink) 45%, transparent);
  --isl-t4: color-mix(in oklab, var(--isl-ink) 27%, transparent);
  --isl-fill: color-mix(in oklab, var(--isl-ink) 6%, transparent);
  --isl-line: color-mix(in oklab, var(--isl-ink) 6%, transparent);
  --isl-slab: #17161a;
  --isl-s1: rgb(255 255 255 / .94);
  --isl-s2: rgb(255 255 255 / .66);
  --isl-s3: rgb(255 255 255 / .56);
  /* the wax is its own material: the same oxblood in light and dark, so the slab never washes it out */
  --isl-wax: #a3152f;
  --isl-wax-hi: color-mix(in oklab, var(--isl-wax) 46%, #ffc4b4);
  --isl-wax-lo: color-mix(in oklab, var(--isl-wax) 46%, #14000a);
  --isl-wax-hot: color-mix(in oklab, var(--isl-wax) 10%, #fff1e8);
  --isl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --isl-float: 0 0 0 .5px rgb(0 0 0 / .6), 0 2px 3px rgb(0 0 0 / .16), 0 18px 28px -14px rgb(0 0 0 / .45);
  --isl-glint: rgb(255 255 255 / .8);
  --isl-ease: cubic-bezier(.22, 1, .36, 1);
  --isl-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --isl-art: 124px;
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 440px;
  color: var(--isl-t1);
  font-family: var(--isl-font);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .isl {
  --isl-ink: #fff;
  --isl-surface: #1c1c1e;
  --isl-accent: #4d8dff;
  --isl-ok: #4cc38a;
  --isl-warn: #f5b94a;
  --isl-t1: color-mix(in oklab, var(--isl-ink) 90%, transparent);
  --isl-t2: color-mix(in oklab, var(--isl-ink) 62%, transparent);
  --isl-t3: color-mix(in oklab, var(--isl-ink) 46%, transparent);
  --isl-t4: color-mix(in oklab, var(--isl-ink) 28%, transparent);
  --isl-fill: color-mix(in oklab, var(--isl-ink) 8%, transparent);
  --isl-line: color-mix(in oklab, var(--isl-ink) 8%, transparent);
  --isl-slab: #0d0c10;
  --isl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --isl-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 3px rgb(0 0 0 / .3), 0 18px 28px -14px rgb(0 0 0 / .8);
}
/* Mono has no colour: the wax turns to pewter */
html[data-style="mono"] .isl { --isl-wax: #9b9ba2 }
.isl *, .isl *::before, .isl *::after { box-sizing: border-box }
:where(.isl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.isl) h3, :where(.isl) h4, :where(.isl) p, :where(.isl) dl, :where(.isl) dd, :where(.isl) dt { margin: 0 }
.isl :focus-visible { outline: 2px solid color-mix(in oklab, var(--isl-accent) 60%, transparent); outline-offset: 2px }
.isl-face :focus-visible { outline-color: color-mix(in oklab, var(--isl-accent) 45%, #fff) }
.isl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

/* ------------------------------ the request card ------------------------------ */
.isl-card { --isl-a: var(--isl-art); background: var(--isl-surface); border-radius: 16px; box-shadow: var(--isl-shadow); padding: 16px; display: grid; gap: 14px }
.isl-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.isl-av { width: 28px; height: 28px; flex: none; border-radius: 8px; background: var(--isl-fill); color: var(--isl-t2); display: grid; place-items: center }
.isl-from { min-width: 0; flex: 1 1 150px; display: grid }
.isl-from b { font-weight: 500; color: var(--isl-t1); font-size: 13px; line-height: 16px }
.isl-from span { color: var(--isl-t2); font-size: 12px; line-height: 16px; text-wrap: pretty; overflow-wrap: anywhere }
.isl-chip {
  flex: none; display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 9px; border-radius: 7px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
  color: var(--isl-chip, var(--isl-warn)); background: color-mix(in oklab, var(--isl-chip, var(--isl-warn)) 11%, transparent);
  transition: color .4s var(--isl-ease), background-color .4s var(--isl-ease);
}
.isl-chip i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none }
.isl-chip span { animation: isl-in .42s var(--isl-ease) backwards }
.isl[data-phase="sealed"] .isl-chip, .isl[data-phase="locked"] .isl-chip { --isl-chip: var(--isl-ok) }
.isl-title { font-size: 15px; line-height: 21px; font-weight: 500; color: var(--isl-t1); text-wrap: balance; letter-spacing: -.005em; overflow-wrap: anywhere }
.isl-facts { display: grid; margin: -2px 0 0 }
.isl-fact { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 12px; padding: 6px 0; border-top: .5px solid var(--isl-line); align-items: baseline }
.isl-fact dt { color: var(--isl-t2); font-size: 12px }
.isl-fact dd { color: var(--isl-t1); font-variant-numeric: tabular-nums; display: flex; gap: 6px; align-items: center; min-width: 0; padding-right: 4px }
.isl-fact dd svg { flex: none; color: var(--isl-t3) }
.isl-fact dd span { min-width: 0; overflow-wrap: anywhere }

/* --------------------------------- the slab ---------------------------------- */
.isl-stage { perspective: 1800px }
.isl-slab { display: grid; transform-style: preserve-3d; transition: transform .7s var(--isl-ease) }
.isl[data-flip="1"] .isl-slab { transform: rotateX(180deg) }
.isl-face {
  grid-area: 1 / 1; position: relative; overflow: hidden; border-radius: 14px; color: var(--isl-s1);
  background: linear-gradient(180deg, color-mix(in oklab, var(--isl-slab) 90%, #fff), var(--isl-slab) 60%);
  box-shadow: var(--isl-float), inset 0 0 0 .5px rgb(255 255 255 / .1), inset 0 1px 0 rgb(255 255 255 / .12);
  -webkit-backface-visibility: hidden; backface-visibility: hidden;
  display: flex; align-items: center; gap: 18px; padding: 18px; min-height: calc(var(--isl-a) + 36px);
}
.isl-back { transform: rotateX(180deg) }
/* a warm bloom and halftone dots in wax colour gather behind the seal */
.isl-face::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .55;
  background: radial-gradient(var(--isl-wax) .8px, transparent 1.15px) 0 0 / 5px 5px;
  -webkit-mask-image: radial-gradient(ellipse 62% 125% at calc(18px + var(--isl-a) / 2) 50%, #000, transparent 74%);
  mask-image: radial-gradient(ellipse 62% 125% at calc(18px + var(--isl-a) / 2) 50%, #000, transparent 74%);
  transition: opacity .6s var(--isl-ease);
}
.isl-face::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(circle at calc(18px + var(--isl-a) / 2) 50%, color-mix(in oklab, var(--isl-wax) 34%, transparent), transparent calc(var(--isl-a) * .9));
  opacity: .8; transition: opacity .6s var(--isl-ease);
}
.isl[data-phase="sealed"] .isl-back::before, .isl[data-phase="stamping"] .isl-front::before { opacity: .85 }
.isl[data-phase="breaking"] .isl-back::after, .isl[data-phase="breaking"] .isl-back::before { opacity: .2 }
.isl-face > * { position: relative }

.isl-seal, .isl-wax { flex: none; width: var(--isl-a); height: var(--isl-a); position: relative; border-radius: 50% }
.isl-seal { isolation: isolate; transition: transform .16s var(--isl-ease); -webkit-tap-highlight-color: transparent }
.isl-seal:disabled { cursor: not-allowed; opacity: .5 }
.isl-seal::before {
  content: ""; position: absolute; inset: -8px; border-radius: 50%; border: 1px dashed rgb(255 255 255 / .3); pointer-events: none;
  transition: border-color .3s var(--isl-ease);
}
.isl[data-phase="idle"] .isl-seal:not(:disabled)::before { animation: isl-breathe 2.6s ease-in-out infinite }
.isl-seal:focus-visible::before { border-color: var(--isl-wax-hi) }
.isl[data-phase="idle"] .isl-seal[data-pressed="1"] { transform: scale(.94) translateY(1px) }
.isl[data-phase="idle"] .isl-seal[data-pressed="1"]::before { animation: none; opacity: .3 }
.isl[data-phase="stamping"] .isl-seal::before { opacity: 0; border-style: solid; border-color: var(--isl-wax-hi); animation: isl-ring .95s var(--isl-ease) .32s backwards }
.isl-seal:focus-visible { outline-offset: 12px }
@media (hover: hover) {
  .isl[data-phase="idle"] .isl-seal:not(:disabled):hover { transform: translateY(-1px) scale(1.02) }
  .isl[data-phase="idle"] .isl-seal:not(:disabled):hover::before { border-color: var(--isl-wax-hi) }
}

.isl-art { display: block; width: 100%; height: 100%; overflow: visible; shape-rendering: crispEdges }
.isl-body { fill: var(--isl-wax) }
.isl-lite { fill: var(--isl-wax-hi) }
.isl-dark { fill: var(--isl-wax-lo) }
.isl-hot { fill: var(--isl-wax-hot) }
.isl-v { transition: opacity .2s var(--isl-ease) }
.isl-time { animation: isl-in .5s var(--isl-ease) .3s backwards }
.isl-sheen { animation: isl-sheen 4s var(--isl-ease) .9s infinite }

/* raised: before the press. pressed: the impression it leaves */
.isl-front .isl-art { filter: drop-shadow(0 8px 7px rgb(0 0 0 / .6)) drop-shadow(0 1px 1px rgb(0 0 0 / .55)); transition: filter .24s var(--isl-ease) }
.isl-front .isl-pressed { opacity: 0 }
.isl[data-phase="stamping"] .isl-front .isl-raised, .isl-back .isl-raised { opacity: 0 }
.isl[data-phase="stamping"] .isl-front .isl-pressed { opacity: 1 }
.isl-back .isl-pressed { opacity: 1 }
.isl[data-phase="stamping"] .isl-front .isl-art { filter: drop-shadow(0 0 0 rgb(0 0 0 / 0)) drop-shadow(0 0 0 rgb(0 0 0 / 0)); animation: isl-stamp .72s var(--isl-ease) backwards }
.isl[data-phase="stamping"] .isl-front .isl-sheen { animation: isl-sheen-once .9s var(--isl-ease) .42s backwards }
.isl[data-phase="idle"] .isl-front .isl-art { animation: isl-rise .6s var(--isl-ease) backwards }
.isl-back .isl-art { filter: drop-shadow(0 .5px 0 rgb(255 255 255 / .12)) }

.isl-text { min-width: 0; display: grid; gap: 2px; align-content: center; justify-items: start }
.isl-text h4 { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--isl-s1); overflow-wrap: anywhere; animation: isl-in .5s var(--isl-ease) backwards }
.isl-text h4 em { font-style: normal; color: var(--isl-s2); font-variant-numeric: tabular-nums; font-weight: 400; white-space: nowrap }
.isl-text p { font-size: 12.5px; line-height: 18px; color: var(--isl-s2); text-wrap: pretty; overflow-wrap: anywhere; animation: isl-in .5s var(--isl-ease) .06s backwards }
.isl-text .isl-hint { margin-top: 6px; display: flex; align-items: center; column-gap: 10px; row-gap: 0; flex-wrap: wrap; color: var(--isl-s3); font-size: 12px }
.isl-hint span { white-space: nowrap }
.isl-hint kbd { font: inherit; font-size: 11px; line-height: 16px; padding: 0 5px; border-radius: 4px; color: var(--isl-s2); background: rgb(255 255 255 / .09); box-shadow: inset 0 -1px 0 rgb(255 255 255 / .06) }
@media (pointer: coarse) { .isl-keys { display: none } }

.isl-undo { margin-top: 8px; display: flex; align-items: center; gap: 10px; min-height: 26px; animation: isl-in .5s var(--isl-ease) .14s backwards }
.isl-break {
  display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 7px; font-size: 12.5px; font-weight: 500;
  color: var(--isl-s1); background: rgb(255 255 255 / .1); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .18);
  transition: background-color .2s var(--isl-ease), transform .16s var(--isl-ease);
}
@media (hover: hover) { .isl-break:hover { background: rgb(255 255 255 / .16) } }
.isl-break:active { transform: scale(.97) }
.isl-break b { font-weight: 400; color: var(--isl-s2); font-variant-numeric: tabular-nums }
.isl-locked { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--isl-s2); outline-offset: 4px }
.isl-face > .isl-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--isl-wax-hi); transform-origin: 0 50%; animation: isl-drain linear forwards }

/* breaking: the wax cracks along a jagged line, the halves hold, then drift apart and fall; a few crumbs stay behind */
.isl-wax .isl-hw { position: absolute; inset: 0; filter: drop-shadow(0 3px 3px rgb(0 0 0 / .55)) }
.isl-hw .isl-half { position: absolute; inset: 0 }
.isl-hw .isl-art { filter: none }
.isl-hw[data-side="a"] { animation: isl-half-a 1.05s var(--isl-ease) forwards }
.isl-hw[data-side="b"] { animation: isl-half-b 1.05s var(--isl-ease) forwards }
.isl-hw[data-side="a"] .isl-half { clip-path: polygon(0 0, 52% 0, 46% 18%, 55% 36%, 47% 54%, 56% 72%, 49% 100%, 0 100%) }
.isl-hw[data-side="b"] .isl-half { clip-path: polygon(52% 0, 100% 0, 100% 100%, 49% 100%, 56% 72%, 47% 54%, 55% 36%, 46% 18%) }
.isl-crumb { position: absolute; left: calc(50% + var(--x)); top: calc(50% + var(--y)); width: 5px; height: 5px; background: var(--isl-wax); box-shadow: inset 1px 1px 0 var(--isl-wax-hi); animation: isl-crumb .95s var(--isl-ease) var(--d) forwards }

@keyframes isl-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes isl-rise { from { opacity: 0; transform: translateY(6px) scale(.96); filter: blur(4px) drop-shadow(0 8px 7px rgb(0 0 0 / .6)) drop-shadow(0 1px 1px rgb(0 0 0 / .55)) } }
@keyframes isl-breathe { 0%, 100% { opacity: .3; transform: scale(1) } 50% { opacity: .75; transform: scale(1.045) } }
@keyframes isl-ring { 0% { opacity: 0; transform: scale(1) } 14% { opacity: .85 } 100% { opacity: 0; transform: scale(1.55) } }
@keyframes isl-stamp {
  0% { transform: translateY(1px) scale(.94); filter: drop-shadow(0 1px 1px rgb(0 0 0 / .55)) drop-shadow(0 0 0 rgb(0 0 0 / 0)) }
  34% { transform: translateY(2px) scale(.93); filter: drop-shadow(0 .5px .5px rgb(0 0 0 / .6)) drop-shadow(0 0 0 rgb(0 0 0 / 0)) }
  62% { transform: translateY(0) scale(1.05); filter: drop-shadow(0 0 7px color-mix(in oklab, var(--isl-wax) 70%, transparent)) drop-shadow(0 0 0 rgb(0 0 0 / 0)) }
  100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 0 rgb(0 0 0 / 0)) drop-shadow(0 0 0 rgb(0 0 0 / 0)) }
}
@keyframes isl-sheen { 0%, 30% { transform: translateX(0) } 62%, 100% { transform: translateX(96px) } }
@keyframes isl-sheen-once { from { transform: translateX(0) } to { transform: translateX(96px) } }
@keyframes isl-drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@keyframes isl-half-a { 0% { transform: none; opacity: 1 } 14% { transform: translate(-3px, 1px) rotate(-3deg); opacity: 1 } 46% { transform: translate(-6px, 3px) rotate(-5deg); opacity: 1 } 100% { transform: translate(-20px, 16px) rotate(-15deg); opacity: 0 } }
@keyframes isl-half-b { 0% { transform: none; opacity: 1 } 14% { transform: translate(3px, 1px) rotate(3deg); opacity: 1 } 46% { transform: translate(6px, 4px) rotate(5deg); opacity: 1 } 100% { transform: translate(22px, 18px) rotate(13deg); opacity: 0 } }
@keyframes isl-crumb { 0% { opacity: 0; transform: translate(0, 0) } 12% { opacity: 1 } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)) } }

/* the slab pauses its decoration when it is off screen or the tab is hidden; the undo bar is a deadline and keeps running */
.isl[data-live="0"] .isl-sheen, .isl[data-live="0"] .isl-seal::before { animation-play-state: paused }

@container (max-width: 400px) {
  .isl-card { --isl-a: min(var(--isl-art), 92px); padding: 14px }
  .isl-face { gap: 14px; padding: 14px; min-height: calc(var(--isl-a) + 28px) }
  .isl-fact { grid-template-columns: 68px minmax(0, 1fr) }
}
@container (max-width: 340px) {
  .isl-card { --isl-a: min(var(--isl-art), 84px) }
  .isl-face { flex-direction: column; align-items: flex-start; gap: 16px; padding: 18px 14px 14px }
  .isl-text { width: 100% }
}

@media (forced-colors: active) {
  .isl-art { forced-color-adjust: none }
  .isl-face { border: 1px solid CanvasText }
}
@media (prefers-reduced-motion: reduce) {
  .isl *, .isl *::before, .isl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_FROM = { name: "Quill", note: "Drafted 3 min ago for Harbor & Finch" }
const DEFAULT_DETAILS: SealDetail[] = [
  { label: "Document", value: "Q3 board update.pdf · 6 pages" },
  { label: "Audience", value: "14 investors, Fund II" },
  { label: "Checked", value: "41 figures matched to the ledger" },
]

const pad = (n: number) => String(n).padStart(2, "0")
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const reducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** The pieces that fall away when the seal breaks: offset from the crack, travel, spin and delay. */
const CRUMBS = [
  { x: "-3px", y: "-18px", dx: "-14px", dy: "26px", r: "70deg", d: ".06s" },
  { x: "2px", y: "-6px", dx: "9px", dy: "30px", r: "-50deg", d: ".1s" },
  { x: "-5px", y: "6px", dx: "-10px", dy: "34px", r: "40deg", d: ".14s" },
  { x: "4px", y: "16px", dx: "16px", dy: "28px", r: "-80deg", d: ".08s" },
  { x: "-1px", y: "26px", dx: "-4px", dy: "24px", r: "30deg", d: ".18s" },
  { x: "6px", y: "-24px", dx: "12px", dy: "22px", r: "60deg", d: ".12s" },
]

export function Seal({
  title = "Publish the Q3 board update to 14 investors",
  from = DEFAULT_FROM,
  details = DEFAULT_DETAILS,
  consequence = "Sends to 14 investors at 09:00",
  actionLabel = "Press the seal to approve",
  mark = "HF",
  approver = "you",
  time,
  waxSize,
  undoSeconds = 8,
  defaultSealed = false,
  disabled = false,
  sound = false,
  haptics = false,
  onFeedback,
  onApprove,
  onBreak,
  onLock,
  className,
}: SealProps) {
  const [phase, setPhase] = React.useState<SealPhase>(defaultSealed ? "sealed" : "idle")
  const [stamp, setStamp] = React.useState(defaultSealed ? (time ?? "") : "")
  const [left, setLeft] = React.useState(undoSeconds)
  const [pressed, setPressed] = React.useState(false)

  const rootRef = React.useRef<HTMLElement>(null)
  const sealRef = React.useRef<HTMLButtonElement>(null)
  const breakRef = React.useRef<HTMLButtonElement>(null)
  const statusRef = React.useRef<HTMLSpanElement>(null)
  const focusTo = React.useRef<"break" | "seal" | "status" | null>(null)
  const timers = React.useRef<{ flip?: number; tick?: number; lock?: number; brk?: number; clock?: number }>({})
  const latest = React.useRef({ undoSeconds, onLock })
  const breakNow = React.useRef<() => void>(() => {})

  React.useEffect(() => {
    latest.current = { undoSeconds, onLock }
  })

  const art = React.useMemo(() => buildWax(mark, stamp), [mark, stamp])

  const clearTimers = React.useCallback(() => {
    const t = timers.current
    window.clearTimeout(t.flip)
    window.clearInterval(t.tick)
    window.clearTimeout(t.lock)
    window.clearTimeout(t.brk)
    window.clearTimeout(t.clock)
  }, [])

  const insideRoot = () => {
    const active = document.activeElement
    return !!rootRef.current && !!active && rootRef.current.contains(active)
  }

  const feedback = (kind: "press" | "seal" | "break") => {
    try {
      if (sound) playTone(kind)
      if (haptics && !reducedMotion() && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(kind === "seal" ? [14, 36, 8] : kind === "break" ? 10 : 6)
      }
    } finally {
      onFeedback?.(kind)
    }
  }

  /** Starts the undo window's clocks: a one-second tick for the label and one timeout that makes the approval final. */
  const startTimers = React.useCallback(() => {
    const t = timers.current
    window.clearInterval(t.tick)
    window.clearTimeout(t.lock)
    const secs = latest.current.undoSeconds
    t.tick = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    t.lock = window.setTimeout(() => {
      window.clearInterval(t.tick)
      if (insideRoot()) focusTo.current = "status"
      setPhase("locked")
      latest.current.onLock?.()
    }, secs * 1000)
  }, [])

  React.useEffect(() => {
    if (defaultSealed) {
      startTimers()
      // no time given: read the clock in a timer, never during render
      if (!time) timers.current.clock = window.setTimeout(() => setStamp(clock(new Date())), 0)
    }
    return clearTimers
    // runs once: defaultSealed only decides the starting phase
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const want = focusTo.current
    if (phase === "sealed" && want === "break") breakRef.current?.focus({ preventScroll: true })
    else if (phase === "idle" && want === "seal") sealRef.current?.focus({ preventScroll: true })
    else if (phase === "locked" && want === "status") statusRef.current?.focus({ preventScroll: true })
    else return
    focusTo.current = null
  }, [phase])

  // Esc undoes the approval wherever focus is: browsers that do not focus a button on click leave focus on the page
  React.useEffect(() => {
    if (phase !== "sealed") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      e.preventDefault()
      breakNow.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [phase])

  // pause the slab's decoration off screen and in hidden tabs
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    let visible = true
    const apply = () => {
      el.dataset.live = visible && !document.hidden ? "1" : "0"
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      apply()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", apply)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", apply)
    }
  }, [])

  function commit() {
    if (phase !== "idle" || disabled) return
    const now = new Date()
    const stamped = time ?? clock(now)
    focusTo.current = insideRoot() ? "break" : null
    setStamp(stamped)
    setPressed(false)
    setPhase("stamping")
    // schedule the flip first: a consumer callback that throws must not leave the seal stuck mid-press
    timers.current.flip = window.setTimeout(
      () => {
        setPhase("sealed")
        setLeft(latest.current.undoSeconds)
        startTimers()
      },
      reducedMotion() ? 60 : 760,
    )
    try {
      feedback("seal")
    } finally {
      onApprove?.({ time: stamped, at: now })
    }
  }

  function breakSeal() {
    if (phase !== "sealed") return
    clearTimers()
    focusTo.current = insideRoot() ? "seal" : null
    setPhase("breaking")
    // the flip back waits until the halves have fallen away
    timers.current.brk = window.setTimeout(() => setPhase("idle"), reducedMotion() ? 400 : 1000)
    try {
      feedback("break")
    } finally {
      onBreak?.()
    }
  }
  React.useEffect(() => {
    breakNow.current = breakSeal
  })

  const flipped = phase === "sealed" || phase === "locked" || phase === "breaking"
  const broken = phase === "breaking"
  const message =
    phase === "sealed"
      ? `Approved by ${approver} at ${stamp}. ${consequence}. Press Escape or Break seal within ${undoSeconds} seconds to undo.`
      : phase === "locked"
        ? `Sealed at ${stamp}. This approval is final.`
        : broken
          ? "Seal broken. Nothing will be sent."
          : ""
  const chip = phase === "locked" ? "Queued" : phase === "sealed" ? "Approved" : broken ? "Seal broken" : phase === "stamping" ? "Sealing" : "Needs your approval"
  const rootStyle = waxSize ? ({ "--isl-art": `${waxSize}px` } as React.CSSProperties) : undefined

  return (
    <section
      ref={rootRef}
      className={cn("isl", className)}
      style={rootStyle}
      data-phase={phase}
      data-flip={flipped ? "1" : "0"}
      aria-label={`Approval: ${title}`}
    >
      <style href="seal" precedence="default">
        {CSS}
      </style>

      <div className="isl-card">
        <header className="isl-head">
          <span className="isl-av" aria-hidden>
            <Feather size={15} strokeWidth={1.8} />
          </span>
          <div className="isl-from">
            <b>{from.name}</b>
            {from.note ? <span>{from.note}</span> : null}
          </div>
          <span className="isl-chip">
            <i aria-hidden />
            <span key={chip}>{chip}</span>
          </span>
        </header>

        <h3 className="isl-title">{title}</h3>

        {details.length ? (
          <dl className="isl-facts">
            {details.slice(0, 3).map((d, i) => (
              <div className="isl-fact" key={`${d.label}-${i}`}>
                <dt>{d.label}</dt>
                <dd>
                  {i === 0 ? <FileText size={13} strokeWidth={1.8} aria-hidden /> : null}
                  <span>{d.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="isl-stage">
          <div className="isl-slab">
            {/* front: the seal, ready to be pressed */}
            <div className="isl-face isl-front" inert={flipped} aria-hidden={flipped}>
              <button
                ref={sealRef}
                type="button"
                className="isl-seal"
                data-pressed={pressed ? "1" : "0"}
                disabled={disabled}
                aria-label={`${actionLabel}: ${title}`}
                onClick={commit}
                onPointerDown={(e) => {
                  if (e.button !== 0 || phase !== "idle") return
                  setPressed(true)
                  feedback("press")
                }}
                onPointerUp={() => setPressed(false)}
                onPointerLeave={() => setPressed(false)}
                onPointerCancel={() => setPressed(false)}
                onBlur={() => setPressed(false)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !e.repeat && phase === "idle") {
                    setPressed(true)
                    feedback("press")
                  }
                }}
                onKeyUp={() => setPressed(false)}
              >
                <Wax art={art} glint />
              </button>
              <div className="isl-text">
                <h4>{actionLabel}</h4>
                <p>{consequence}.</p>
                <p className="isl-hint">
                  <span className="isl-keys">
                    <kbd>Enter</kbd> or <kbd>Space</kbd>
                  </span>
                  <span>Undo for {undoSeconds}s</span>
                </p>
              </div>
            </div>

            {/* back: the impression, and a short window to break it */}
            <div className="isl-face isl-back" inert={!flipped} aria-hidden={!flipped}>
              <div className="isl-wax" aria-hidden>
                {broken ? (
                  <>
                    {(["a", "b"] as const).map((side) => (
                      <span className="isl-hw" data-side={side} key={side}>
                        <span className="isl-half">
                          <Wax art={art} />
                        </span>
                      </span>
                    ))}
                    {CRUMBS.map((c, i) => (
                      <i
                        className="isl-crumb"
                        key={i}
                        style={{ "--x": c.x, "--y": c.y, "--dx": c.dx, "--dy": c.dy, "--r": c.r, "--d": c.d } as React.CSSProperties}
                      />
                    ))}
                  </>
                ) : (
                  <Wax art={art} />
                )}
              </div>
              <div className="isl-text">
                {broken ? (
                  <>
                    <h4 key="broken">Seal broken</h4>
                    <p key="broken-p">Nothing will be sent.</p>
                  </>
                ) : (
                  <>
                    <h4>
                      Approved by {approver} <em>·&nbsp;{stamp}</em>
                    </h4>
                    <p>{consequence}.</p>
                  </>
                )}
                <div className="isl-undo">
                  {phase === "locked" ? (
                    <span className="isl-locked" ref={statusRef} tabIndex={-1}>
                      <Lock size={12} strokeWidth={2} aria-hidden /> Sealed. This can't be undone.
                    </span>
                  ) : broken ? null : (
                    <button ref={breakRef} type="button" className="isl-break" onClick={breakSeal}>
                      Break seal
                      <b aria-hidden>{left}s</b>
                    </button>
                  )}
                </div>
              </div>
              {phase === "sealed" ? <span className="isl-bar" style={{ animationDuration: `${undoSeconds}s` }} aria-hidden /> : null}
            </div>
          </div>
        </div>
      </div>

      <p className="isl-sr" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  )
}

export default Seal
