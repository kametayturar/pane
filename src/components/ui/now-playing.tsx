"use client"

import * as React from "react"
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type NowPlayingTrack = {
  id: string
  title: string
  artist: string
  /** Length in seconds. */
  duration: number
  /** Image URL. Leave it out and a gradient cover is generated from the track. */
  artwork?: string
  /** Alt text for the artwork. The artwork is decorative unless this is set. */
  artworkAlt?: string
  /** Three hues (0-360) for the generated cover. Default: derived from the id. */
  hues?: [number, number, number]
}

export type NowPlayingProps = {
  /** The queue. */
  tracks?: NowPlayingTrack[]
  /** Controlled position in the queue. */
  index?: number
  /** Initial position when uncontrolled. */
  defaultIndex?: number
  /** Called when the track changes by skip or when a track ends. The queue wraps at both ends. */
  onIndexChange?: (index: number) => void
  /** Controlled playback state. */
  playing?: boolean
  /** Initial playback state when uncontrolled. */
  defaultPlaying?: boolean
  /** Called on play and pause. */
  onPlayingChange?: (playing: boolean) => void
  /** Controlled expanded state. */
  expanded?: boolean
  /** Starts as the full player. */
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Controlled playhead in seconds. Pass it to drive the player from a real audio element; the internal clock then stays off. */
  time?: number
  /** Called when the person seeks (waveform, keyboard, restart) and about once a second while the internal clock runs. */
  onTimeChange?: (seconds: number) => void
  /** Accessible name of the player section. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

export const nowPlayingSampleTracks: NowPlayingTrack[] = [
  { id: "glasshouse", title: "Glasshouse", artist: "Mira Vale", duration: 214, hues: [38, 18, 262] },
  { id: "low-orbit", title: "Low Orbit", artist: "Cassio", duration: 187, hues: [215, 285, 335] },
  { id: "paper-lanterns", title: "Paper Lanterns", artist: "Ines Okafor", duration: 241, hues: [150, 95, 215] },
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number): () => number {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic waveform: a slow envelope with a little jitter, 0..1. */
function peaks(seed: string, n: number): number[] {
  const r = rng(hash(seed))
  const a = r() * 6.28
  const b = r() * 6.28
  const out: number[] = []
  let prev = 0.5
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1)
    const env = 0.55 + 0.25 * Math.sin(x * 7 + a) + 0.15 * Math.sin(x * 17 + b) - 0.35 * Math.pow(Math.abs(x - 0.5) * 2, 4)
    prev = prev * 0.45 + (env + (r() - 0.5) * 0.45) * 0.55
    out.push(Math.max(0.12, Math.min(1, prev)))
  }
  return out
}

function fmt(s: number): string {
  const v = Math.max(0, Math.floor(s))
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`
}

/** A damped spring as a CSS `linear()` easing: a trace of overshoot, settled in `ms`. */
function springEasing(stiffness: number, damping: number): { css: string; ms: number } {
  const dt = 1 / 240
  const xs: number[] = []
  let x = 0
  let v = 0
  let settled = 0
  for (let i = 0; i < 4 * 240; i++) {
    const a = -stiffness * (x - 1) - damping * v
    v += a * dt
    x += v * dt
    xs.push(x)
    if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.01) {
      if (++settled > 6) break
    } else settled = 0
  }
  const n = 40
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const idx = Math.min(xs.length - 1, Math.round((k / n) * (xs.length - 1)))
    return k === n ? 1 : Math.round(xs[idx] * 10000) / 10000
  })
  return { css: `linear(0, ${pts.join(", ")})`, ms: Math.round((xs.length / 240) * 1000) }
}

const SPRING = springEasing(190, 23)

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.nwp {
  --nwp-ink: oklch(.15 0 0);
  --nwp-surface: oklch(1 0 0);
  --nwp-accent: #0060e2;
  --nwp-t2: oklch(.46 0 0);
  --nwp-t3: oklch(.59 0 0);
  --nwp-line: oklch(.935 0 0);
  --nwp-fill: oklch(.978 0 0);
  --nwp-wave: oklch(.15 0 0 / .16);
  --nwp-shadow: 0 20px 48px 0 oklch(0 0 0 / .105), 0 3px 10px 0 oklch(0 0 0 / .045);
  --nwp-ease: cubic-bezier(.22, 1, .36, 1);
  --nwp-spring: cubic-bezier(.22, 1, .36, 1);
  --nwp-ms: .7s;
  --nwp-geo: left var(--nwp-ms) var(--nwp-spring), top var(--nwp-ms) var(--nwp-spring), width var(--nwp-ms) var(--nwp-spring), height var(--nwp-ms) var(--nwp-spring);
  position: relative;
  display: block;
  width: 100%;
  container-type: inline-size;
  color: var(--nwp-ink);
  font-family: var(--nwp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  text-align: start;
}
@supports (transition-timing-function: linear(0, 1)) { .nwp { --nwp-spring: ${SPRING.css}; --nwp-ms: ${SPRING.ms}ms } }
:is(.dark, [data-theme="dark"]) .nwp {
  --nwp-ink: oklch(.96 0 0);
  --nwp-surface: oklch(.215 0 0);
  --nwp-accent: #4d8dff;
  --nwp-t2: oklch(.74 0 0);
  --nwp-t3: oklch(.58 0 0);
  --nwp-line: oklch(1 0 0 / .1);
  --nwp-fill: oklch(1 0 0 / .06);
  --nwp-wave: oklch(1 0 0 / .2);
  --nwp-shadow: 0 20px 48px 0 oklch(0 0 0 / .55), 0 3px 10px 0 oklch(0 0 0 / .35);
}
.nwp *, .nwp *::before, .nwp *::after { box-sizing: border-box }
:where(.nwp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.nwp :focus { outline: none }
.nwp :focus-visible { outline: 2px solid color-mix(in oklab, var(--nwp-accent) 60%, transparent); outline-offset: 2px }
.nwp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* The shell: one surface whose height, radius and every child's box spring between mini and full. */
.nwp-shell {
  --travel: 10px;
  position: relative; width: min(100%, 21rem); height: 64px; margin: 0 auto; overflow: hidden; border-radius: 22px;
  background: var(--nwp-surface); border: 1px solid var(--nwp-line); box-shadow: var(--nwp-shadow);
  transition: height var(--nwp-ms) var(--nwp-spring), border-radius var(--nwp-ms) var(--nwp-spring), transform .5s var(--nwp-ease);
}
.nwp-shell[data-expanded] { --travel: 36px; height: 411px; border-radius: 30px }
.nwp-shell[data-drag] { transition: height var(--nwp-ms) var(--nwp-spring), border-radius var(--nwp-ms) var(--nwp-spring) }

.nwp-art {
  position: absolute; left: 10px; top: 10px; width: 44px; height: 44px; border-radius: 12px; overflow: hidden; background: var(--nwp-fill);
  transition: left var(--nwp-ms) var(--nwp-spring), top var(--nwp-ms) var(--nwp-spring), width var(--nwp-ms) var(--nwp-spring), height var(--nwp-ms) var(--nwp-spring), border-radius var(--nwp-ms) var(--nwp-spring);
  pointer-events: none;
}
.nwp-shell[data-expanded] .nwp-art { left: 12px; top: 12px; width: calc(100% - 24px); height: 192px; border-radius: 20px; pointer-events: auto; cursor: grab; touch-action: none }
.nwp-shell[data-drag] .nwp-art { cursor: grabbing }

/* Generated cover: layered radial gradients plus soft rings, no images. */
.nwp-cover { position: absolute; inset: 0; display: block; overflow: hidden; background-color: oklch(.5 .1 var(--h3)) }
.nwp-cover[data-fx="in"] { animation: nwp-cover-in .6s var(--nwp-ease) backwards }
.nwp-cover[data-fx="out"] { animation: nwp-cover-out .5s var(--nwp-ease) forwards; pointer-events: none }
.nwp-gen {
  position: absolute; inset: 0;
  background:
    radial-gradient(120% 95% at 16% 10%, oklch(.88 .12 var(--h1)) 0, transparent 58%),
    radial-gradient(85% 80% at 92% 18%, oklch(.74 .17 var(--h2)) 0, transparent 62%),
    radial-gradient(120% 100% at 28% 105%, oklch(.5 .16 var(--h3)) 0, transparent 64%),
    linear-gradient(140deg, oklch(.42 .12 var(--h3)), oklch(.66 .15 var(--h1)));
}
.nwp-gen::before {
  content: ""; position: absolute; inset: 0; opacity: .55; mix-blend-mode: soft-light;
  background: repeating-radial-gradient(circle at var(--cx) var(--cy), oklch(1 0 0 / .55) 0 1.5px, transparent 1.5px 13px);
}
.nwp-gen::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, oklch(1 0 0 / .14), transparent 38%, oklch(0 0 0 / .14));
}
.nwp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; -webkit-user-drag: none; user-select: none }
@keyframes nwp-cover-in { from { opacity: 0; filter: blur(6px); transform: translateX(calc(var(--dir) * var(--travel))) } }
@keyframes nwp-cover-out { to { opacity: 0; filter: blur(6px); transform: translateX(calc(var(--dir) * var(--travel) * -1)) } }

/* Mini layer */
.nwp-mini { position: absolute; inset: 0; transition: opacity .22s var(--nwp-ease), filter .22s var(--nwp-ease), visibility 0s .22s }
.nwp-shell[data-expanded] .nwp-mini { opacity: 0; filter: blur(4px); visibility: hidden; pointer-events: none }
.nwp-shell:not([data-expanded]) .nwp-mini { transition-delay: .18s, .18s, 0s }
.nwp-mini-main { position: absolute; left: 0; top: 0; bottom: 0; right: 137px; display: flex; flex-direction: column; justify-content: center; padding: 0 2px 0 64px; text-align: left; min-width: 0; border-radius: 22px }
.nwp-mini-text { display: grid; min-width: 0 }
.nwp-mini-title { font-size: 14px; line-height: 19.6px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.nwp-mini-artist { font-size: 12px; line-height: 16.8px; color: var(--nwp-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.nwp-swap[data-fx] { animation: nwp-swap .45s var(--nwp-ease) backwards }
@keyframes nwp-swap { from { opacity: 0; filter: blur(4px); transform: translateY(3px) } }
.nwp-levels-area { position: absolute; left: calc(100% - 127px); top: 24px; width: 13px; height: 14px }
.nwp-mini-progress { position: absolute; left: 18px; right: 18px; bottom: 0; height: 2px }
.nwp-mini-progress i { display: block; height: 100%; border-radius: 1px; background: var(--nwp-ink); transform: scaleX(0); transform-origin: 0 50% }

/* Level bars */
.nwp-levels { display: flex; align-items: flex-end; gap: 2px; width: 13px; height: 14px }
.nwp-levels i { display: block; flex: 1; height: 100%; border-radius: 2px; background: currentColor; transform: scaleY(.3); transform-origin: 50% 100%; animation: nwp-bar var(--d, 1s) ease-in-out infinite alternate; animation-play-state: paused }
.nwp-levels[data-playing] i { animation-play-state: running }
.nwp-levels i:nth-child(1) { --d: .9s; animation-delay: -.2s }
.nwp-levels i:nth-child(2) { --d: .7s; animation-delay: -.5s }
.nwp-levels i:nth-child(3) { --d: 1.1s; animation-delay: -.8s }
@keyframes nwp-bar { 0% { transform: scaleY(.25) } 100% { transform: scaleY(1) } }

/* Full layer */
.nwp-full > * { position: absolute; opacity: 0; filter: blur(4px); visibility: hidden; transition: opacity .2s var(--nwp-ease), filter .2s var(--nwp-ease), visibility 0s .2s }
.nwp-shell[data-expanded] .nwp-full > * { opacity: 1; filter: none; visibility: visible; transition: opacity .35s var(--nwp-ease) .16s, filter .35s var(--nwp-ease) .16s, visibility 0s }
.nwp-collapse { right: 22px; top: 22px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: oklch(.98 0 0); background: oklch(.15 0 0 / .42); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px) }
.nwp-collapse svg { width: 18px; height: 18px; stroke-width: 1.75 }
.nwp-info { left: 12px; right: 12px; top: 216px; padding: 0 4px }
.nwp-title { margin: 0; font-size: 18px; line-height: 23px; font-weight: 500; letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.nwp-artist { margin: 0; font-size: 14px; line-height: 23px; color: var(--nwp-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.nwp-wave { left: 16px; right: 16px; top: 274px; height: 36px; touch-action: pan-y; cursor: pointer; border-radius: 6px; user-select: none; -webkit-user-select: none }
.nwp-bars { position: absolute; inset: 0; display: flex; align-items: center; gap: 2px; transition: transform .3s var(--nwp-ease) }
.nwp-bars i { display: block; flex: 1; min-width: 0; border-radius: 2px; background: var(--nwp-wave) }
.nwp-bars[data-played] i { background: var(--nwp-ink) }
.nwp-wave[data-scrub] .nwp-bars { transform: scaleY(1.2) }
.nwp-times { left: 16px; right: 16px; top: 316px; display: flex; justify-content: space-between; font-size: 12px; line-height: 17px; color: var(--nwp-t3); font-variant-numeric: tabular-nums }

/* Transport: the same three buttons move between the mini row and the full controls. */
.nwp-btn {
  position: absolute; display: grid; place-items: center; border-radius: 50%; color: var(--nwp-ink);
  transition: var(--nwp-geo),
    background-color .24s var(--nwp-ease), color .24s var(--nwp-ease), opacity .2s var(--nwp-ease), scale .2s var(--nwp-ease), visibility 0s;
}
.nwp-btn:hover { background: color-mix(in oklab, var(--nwp-ink) 7%, transparent) }
.nwp-btn:active { scale: .92 }
.nwp-btn svg { width: 18px; height: 18px; fill: currentColor; transition: width var(--nwp-ms) var(--nwp-spring), height var(--nwp-ms) var(--nwp-spring) }
.nwp-play { left: calc(100% - 102px); top: 11px; width: 40px; height: 40px; background: var(--nwp-ink); color: var(--nwp-surface) }
.nwp-play:hover { background: var(--nwp-ink); scale: 1.05 }
.nwp-play:active { scale: .94 }
.nwp-next { left: calc(100% - 52px); top: 11px; width: 40px; height: 40px }
.nwp-prev { left: calc(50% - 98px); top: 348px; width: 44px; height: 44px; opacity: 0; visibility: hidden; transition: var(--nwp-geo), background-color .24s var(--nwp-ease), color .24s var(--nwp-ease), scale .2s var(--nwp-ease), opacity .2s var(--nwp-ease), visibility 0s .2s }
.nwp-shell[data-expanded] .nwp-prev { opacity: 1; visibility: visible; transition: var(--nwp-geo), background-color .24s var(--nwp-ease), color .24s var(--nwp-ease), scale .2s var(--nwp-ease), opacity .3s var(--nwp-ease) .16s, visibility 0s }
.nwp-shell[data-expanded] .nwp-play { left: calc(50% - 26px); top: 345px; width: 52px; height: 52px }
.nwp-shell[data-expanded] .nwp-next { left: calc(50% + 54px); top: 348px; width: 44px; height: 44px }
.nwp-shell[data-expanded] .nwp-play svg { width: 24px; height: 24px }
.nwp-shell[data-expanded] .nwp-next svg, .nwp-shell[data-expanded] .nwp-prev svg { width: 20px; height: 20px }
.nwp-phase { grid-area: 1 / 1; display: grid; place-items: center; transition: opacity .2s var(--nwp-ease), filter .2s var(--nwp-ease), scale .3s var(--nwp-ease) }
.nwp-phase[data-hide] { opacity: 0; filter: blur(3px); scale: .6 }
.nwp-play .nwp-phase[data-icon="play"] svg { margin-left: 2px }
@container (max-width: 359px) {
  .nwp-shell:not([data-expanded]) .nwp-next { opacity: 0; visibility: hidden; pointer-events: none }
  .nwp-shell:not([data-expanded]) .nwp-play { left: calc(100% - 50px) }
  .nwp-shell:not([data-expanded]) .nwp-levels-area { left: calc(100% - 77px) }
  .nwp-shell:not([data-expanded]) .nwp-mini-main { right: 87px }
}

@media (prefers-reduced-motion: reduce) {
  .nwp-shell, .nwp-art, .nwp-btn, .nwp-btn svg { transition-duration: .01s !important; transition-delay: 0s !important }
  .nwp-cover[data-fx], .nwp-swap[data-fx] { animation: nwp-fade .14s linear backwards !important }
  .nwp-cover[data-fx="out"] { animation: nwp-fade-out .14s linear forwards !important }
  .nwp-levels i { animation: none !important }
  .nwp-bars { transition: none !important }
  .nwp-full > *, .nwp-mini { filter: none !important; transition-duration: .14s !important; transition-delay: 0s !important }
  @keyframes nwp-fade { from { opacity: 0 } }
  @keyframes nwp-fade-out { to { opacity: 0 } }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Components                                */
/* -------------------------------------------------------------------------- */

/** Three small level bars that dance while a track plays and rest while paused. */
export function NowPlayingLevels({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn("nwp-levels", className)} data-playing={playing ? "" : undefined} aria-hidden="true">
      <style href="nwp" precedence="default">{CSS}</style>
      <i />
      <i />
      <i />
    </span>
  )
}

function Cover({ track, fx, dir }: { track: NowPlayingTrack; fx?: "in" | "out"; dir: number }) {
  const h = hash(track.id)
  const hues = track.hues ?? [h % 360, (h >>> 8) % 360, (h >>> 16) % 360]
  const style = {
    "--dir": dir,
    "--h1": hues[0],
    "--h2": hues[1],
    "--h3": hues[2],
    "--cx": `${70 + (h % 30)}%`,
    "--cy": `${95 + ((h >>> 5) % 25)}%`,
  } as React.CSSProperties
  return (
    <span className="nwp-cover" data-fx={fx} style={style} aria-hidden={track.artworkAlt ? undefined : true}>
      {track.artwork ? (
        <img className="nwp-img" src={track.artwork} alt={track.artworkAlt ?? ""} draggable={false} decoding="async" />
      ) : (
        <span className="nwp-gen" role={track.artworkAlt ? "img" : undefined} aria-label={track.artworkAlt} />
      )}
    </span>
  )
}

const Bars = React.memo(function Bars({ id, played }: { id: string; played?: boolean }) {
  const heights = React.useMemo(() => peaks(id, 54), [id])
  return (
    <span className="nwp-bars" data-played={played ? "" : undefined} aria-hidden="true">
      {heights.map((p, i) => (
        <i key={i} style={{ height: `${p * 100}%` }} />
      ))}
    </span>
  )
})

/**
 * A compact player that grows from a mini bar into a full player in one continuous morph, with a waveform scrubber and
 * artwork that slides in the direction you skip. Playback runs on an internal clock, so it works without audio; pass
 * `time`, `onPlayingChange` and `onIndexChange` to drive a real audio element.
 */
export function NowPlaying({
  tracks = nowPlayingSampleTracks,
  index,
  defaultIndex = 0,
  onIndexChange,
  playing,
  defaultPlaying = false,
  onPlayingChange,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  time,
  onTimeChange,
  label = "Now playing",
  className,
}: NowPlayingProps) {
  const [innerIndex, setInnerIndex] = React.useState(defaultIndex)
  const [innerPlaying, setInnerPlaying] = React.useState(defaultPlaying)
  const [innerExpanded, setInnerExpanded] = React.useState(defaultExpanded)
  const n = tracks.length
  const cur = ((index ?? innerIndex) % n + n) % n
  const isPlaying = playing ?? innerPlaying
  const isExpanded = expanded ?? innerExpanded
  const track = tracks[cur]
  const statusId = React.useId()

  /* Cover transition: the new cover slides in from the skip direction, the old one slides out the other way. */
  const [shown, setShown] = React.useState({ i: cur, prev: -1, dir: 1, key: 0 })
  if (shown.i !== cur) {
    const fwd = (cur - shown.i + n) % n
    const back = (shown.i - cur + n) % n
    setShown({ i: cur, prev: shown.i, dir: fwd <= back ? 1 : -1, key: shown.key + 1 })
  }
  React.useEffect(() => {
    if (shown.prev < 0) return
    const id = window.setTimeout(() => setShown((s) => ({ ...s, prev: -1 })), 560)
    return () => window.clearTimeout(id)
  }, [shown.key, shown.prev])

  /* The playhead lives in a ref and is painted straight to the DOM; React renders only on real state changes. */
  const pos = React.useRef(0)
  const scrubbing = React.useRef(false)
  const shellRef = React.useRef<HTMLDivElement>(null)
  const miniRef = React.useRef<HTMLButtonElement>(null)
  const collapseRef = React.useRef<HTMLButtonElement>(null)
  const waveRef = React.useRef<HTMLDivElement>(null)
  const playedRef = React.useRef<HTMLSpanElement>(null)
  const progRef = React.useRef<HTMLElement>(null)
  const elapsedRef = React.useRef<HTMLSpanElement>(null)
  const remainRef = React.useRef<HTMLSpanElement>(null)
  const lastSec = React.useRef(-1)
  const latest = React.useRef({ track, n, cur, onIndexChange, onTimeChange, time, index, isPlaying })

  React.useLayoutEffect(() => {
    latest.current = { track, n, cur, onIndexChange, onTimeChange, time, index, isPlaying }
  })

  const paint = React.useCallback(() => {
    const L = latest.current
    const dur = Math.max(1, L.track.duration)
    const p = Math.max(0, Math.min(1, pos.current / dur))
    if (progRef.current) progRef.current.style.transform = `scaleX(${p})`
    if (playedRef.current) playedRef.current.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`
    const sec = Math.floor(pos.current)
    if (sec !== lastSec.current) {
      lastSec.current = sec
      if (elapsedRef.current) elapsedRef.current.textContent = fmt(sec)
      if (remainRef.current) remainRef.current.textContent = `−${fmt(dur - sec)}`
      const w = waveRef.current
      if (w) {
        w.setAttribute("aria-valuenow", String(sec))
        w.setAttribute("aria-valuetext", `${fmt(sec)} of ${fmt(dur)}`)
      }
    }
  }, [])

  const setPlaying = (next: boolean) => {
    if (playing === undefined) setInnerPlaying(next)
    onPlayingChange?.(next)
  }
  const goTo = React.useCallback((i: number) => {
    const L = latest.current
    const next = ((i % L.n) + L.n) % L.n
    pos.current = 0
    lastSec.current = -1
    if (L.index === undefined) setInnerIndex(next)
    L.onIndexChange?.(next)
    L.onTimeChange?.(0)
  }, [])
  const seek = (to: number) => {
    const dur = latest.current.track.duration
    pos.current = Math.max(0, Math.min(dur, to))
    paint()
    onTimeChange?.(pos.current)
  }

  /* External time follows the playhead; a track change restarts it. */
  React.useLayoutEffect(() => {
    if (time !== undefined) pos.current = time
    lastSec.current = -1
    paint()
  }, [time, paint])
  React.useLayoutEffect(() => {
    if (time === undefined) pos.current = 0
    lastSec.current = -1
    paint()
    // restart only when the track changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, track.duration, paint])

  /* Internal clock: one rAF loop that only runs while playing. */
  React.useEffect(() => {
    if (!isPlaying || time !== undefined) return
    let raf = 0
    let last = 0
    let tickSec = -1
    const tick = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const L = latest.current
      if (!scrubbing.current) pos.current += dt
      if (pos.current >= L.track.duration) {
        goTo(L.cur + 1)
        last = 0
      }
      paint()
      const s = Math.floor(pos.current)
      if (s !== tickSec) {
        tickSec = s
        L.onTimeChange?.(pos.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }, [isPlaying, time, goTo, paint])

  const setExpanded = (next: boolean, focus = true) => {
    if (expanded === undefined) setInnerExpanded(next)
    onExpandedChange?.(next)
    if (focus) pendingFocus.current = next ? "collapse" : "mini"
  }
  const pendingFocus = React.useRef<"collapse" | "mini" | null>(null)
  React.useEffect(() => {
    const f = pendingFocus.current
    pendingFocus.current = null
    if (f === "collapse") collapseRef.current?.focus({ preventScroll: true })
    else if (f === "mini") miniRef.current?.focus({ preventScroll: true })
  }, [isExpanded])

  const prev = () => {
    if (pos.current > 3) {
      seek(0)
    } else goTo(cur - 1)
  }

  /* Waveform: tap or drag to seek, keys step 5s / 30s. */
  const seekFromX = (x: number) => {
    const r = waveRef.current?.getBoundingClientRect()
    if (!r) return
    seek(((x - r.left) / r.width) * track.duration)
  }
  const onWaveKey = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageUp: 30, PageDown: -30 }
    if (e.key in step) {
      e.preventDefault()
      seek(pos.current + step[e.key])
    } else if (e.key === "Home") {
      e.preventDefault()
      seek(0)
    } else if (e.key === "End") {
      e.preventDefault()
      seek(track.duration)
    }
  }

  /* Pull the artwork down to close; an upward pull rubber-bands. */
  const drag = React.useRef<{ y: number; t: number; vy: number; lastY: number; lastT: number } | null>(null)
  const onArtDown = (e: React.PointerEvent) => {
    if (!isExpanded || e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, t: e.timeStamp, vy: 0, lastY: e.clientY, lastT: e.timeStamp }
  }
  const onArtMove = (e: React.PointerEvent) => {
    const d = drag.current
    const shell = shellRef.current
    if (!d || !shell) return
    const dy = e.clientY - d.y
    if (e.timeStamp - d.lastT > 0) d.vy = (e.clientY - d.lastY) / (e.timeStamp - d.lastT)
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    if (Math.abs(dy) < 3 && !shell.hasAttribute("data-drag")) return
    shell.setAttribute("data-drag", "")
    const shownDy = dy >= 0 ? dy * 0.92 : -42 * (1 - Math.exp(dy / 70))
    shell.style.transform = `translateY(${shownDy}px) scale(${1 - Math.min(Math.max(dy, 0), 260) / 2600})`
  }
  const onArtUp = (e: React.PointerEvent) => {
    const d = drag.current
    const shell = shellRef.current
    drag.current = null
    if (!d || !shell) return
    const dy = e.clientY - d.y
    shell.removeAttribute("data-drag")
    shell.style.transform = ""
    if (dy > 70 || d.vy > 0.7) setExpanded(false)
  }

  const onRootKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isExpanded) {
      e.stopPropagation()
      setExpanded(false)
    }
  }

  const coverTrack = tracks[shown.i] ?? track
  const leaving = shown.prev >= 0 && shown.prev < n ? tracks[shown.prev] : null
  const fx = shown.key > 0

  return (
    <section className={cn("nwp", className)} aria-label={label} aria-describedby={statusId} onKeyDown={onRootKey}>
      <style href="nwp" precedence="default">{CSS}</style>
      <p id={statusId} className="nwp-sr" aria-live="polite">{`${track.title} by ${track.artist}, ${isPlaying ? "playing" : "paused"}`}</p>
      <div ref={shellRef} className="nwp-shell" data-expanded={isExpanded ? "" : undefined}>
        <div className="nwp-art" onPointerDown={onArtDown} onPointerMove={onArtMove} onPointerUp={onArtUp} onPointerCancel={onArtUp}>
          {leaving ? <Cover key={`out-${shown.key}`} track={leaving} fx="out" dir={shown.dir} /> : null}
          <Cover key={`in-${shown.key}`} track={coverTrack} fx={fx ? "in" : undefined} dir={shown.dir} />
        </div>

        <div className="nwp-mini">
          <button
            ref={miniRef}
            type="button"
            className="nwp-mini-main"
            aria-expanded={isExpanded}
            aria-label={`Expand player, ${track.title} by ${track.artist}`}
            tabIndex={isExpanded ? -1 : 0}
            onClick={() => setExpanded(true)}
          >
            <span key={track.id} className="nwp-mini-text nwp-swap" data-fx={fx ? "" : undefined}>
              <span className="nwp-mini-title">{track.title}</span>
              <span className="nwp-mini-artist">{track.artist}</span>
            </span>
          </button>
          <span className="nwp-levels-area"><NowPlayingLevels playing={isPlaying} /></span>
          <span className="nwp-mini-progress" aria-hidden="true"><i ref={progRef} /></span>
        </div>

        <div className="nwp-full">
          <button ref={collapseRef} type="button" className="nwp-collapse" aria-label="Collapse player" aria-expanded={isExpanded} onClick={() => setExpanded(false)}>
            <ChevronDown aria-hidden />
          </button>
          <div className="nwp-info">
            <div key={track.id} className="nwp-swap" data-fx={fx ? "" : undefined}>
              <h3 className="nwp-title">{track.title}</h3>
              <p className="nwp-artist">{track.artist}</p>
            </div>
          </div>
          <div
            ref={waveRef}
            className="nwp-wave"
            role="slider"
            tabIndex={0}
            aria-label="Position"
            aria-valuemin={0}
            aria-valuemax={track.duration}
            onKeyDown={onWaveKey}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.currentTarget.setPointerCapture(e.pointerId)
              scrubbing.current = true
              e.currentTarget.setAttribute("data-scrub", "")
              seekFromX(e.clientX)
            }}
            onPointerMove={(e) => scrubbing.current && seekFromX(e.clientX)}
            onPointerUp={(e) => {
              scrubbing.current = false
              e.currentTarget.removeAttribute("data-scrub")
            }}
            onPointerCancel={(e) => {
              scrubbing.current = false
              e.currentTarget.removeAttribute("data-scrub")
            }}
          >
            <Bars id={track.id} />
            <span ref={playedRef} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
              <Bars id={track.id} played />
            </span>
          </div>
          <div className="nwp-times" aria-hidden="true">
            <span ref={elapsedRef} />
            <span ref={remainRef} />
          </div>
        </div>

        <button type="button" className="nwp-btn nwp-prev" aria-label="Previous track" tabIndex={isExpanded ? 0 : -1} onClick={prev}>
          <SkipBack aria-hidden />
        </button>
        <button type="button" className="nwp-btn nwp-play" aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`} onClick={() => setPlaying(!isPlaying)}>
          <span className="nwp-phase" data-icon="play" data-hide={isPlaying ? "" : undefined}><Play aria-hidden /></span>
          <span className="nwp-phase" data-icon="pause" data-hide={isPlaying ? undefined : ""}><Pause aria-hidden /></span>
        </button>
        <button type="button" className="nwp-btn nwp-next" aria-label="Next track" onClick={() => goTo(cur + 1)}>
          <SkipForward aria-hidden />
        </button>
      </div>
    </section>
  )
}
