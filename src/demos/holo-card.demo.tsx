import * as React from "react"

import { HoloCard } from "@/components/ui/holo-card"

export const notes: string[] = [
  "Tilt, light and flip are springs integrated in one requestAnimationFrame loop that writes `transform` and CSS custom properties straight to the DOM – React never re-renders per frame, and the loop stops itself once every spring is at rest.",
  "The 3D lean is `perspective(900px) rotateX() rotateY()` computed from the pointer's position over the card; the light spring is softer than the tilt spring, so the sheen trails the lean a little and feels physical.",
  "The foil is a `repeating-linear-gradient` of pastel hues with `mix-blend-mode: color-dodge`, sized 300% so `background-position` can slide it with the angle; the glare is a `radial-gradient` at the pointer with `overlay`.",
  "Glitter is a tiled SVG data URI drifting against the tilt and revealed only near the glare with a `mask-image: radial-gradient(...)` centred on the light.",
  "Flipping adds half a turn per press toward the side you pressed (`rotateY` target ±180) on an under-damped spring so it overshoots a touch; both faces use `backface-visibility: hidden`, and the hidden face is `aria-hidden`.",
]

/** Tiny deterministic pseudo-QR so the back looks like a real code without encoding anything. */
function qrCells(n: number) {
  let s = 90210
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  const cells: boolean[] = []
  const finder = (x: number, y: number) => {
    const inF = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      if (inF(fx, fy)) {
        const dx = x - fx, dy = y - fy
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return edge || core
      }
      if (x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7) return false
    }
    return null
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) cells.push(finder(x, y) ?? rnd() > 0.52)
  return cells
}

function Front() {
  return (
    <div style={{ position: "absolute", inset: 0, fontSize: "calc(100cqw / 30)" }}>
      <svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <defs>
          <radialGradient id="hcd-a" cx=".25" cy=".2" r=".75">
            <stop offset="0" stopColor="#6d5cff" stopOpacity=".95" />
            <stop offset="1" stopColor="#6d5cff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hcd-b" cx=".85" cy=".35" r=".6">
            <stop offset="0" stopColor="#17d3b8" stopOpacity=".7" />
            <stop offset="1" stopColor="#17d3b8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hcd-c" cx=".5" cy=".75" r=".6">
            <stop offset="0" stopColor="#ff8a5c" stopOpacity=".55" />
            <stop offset="1" stopColor="#ff8a5c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hcd-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset=".4" stopColor="#090a12" stopOpacity="0" />
            <stop offset=".7" stopColor="#090a12" stopOpacity=".9" />
            <stop offset="1" stopColor="#090a12" />
          </linearGradient>
        </defs>
        <rect width="300" height="420" fill="#0b0c16" />
        <rect width="300" height="420" fill="url(#hcd-a)" />
        <rect width="300" height="420" fill="url(#hcd-b)" />
        <rect width="300" height="420" fill="url(#hcd-c)" />
        <g fill="none" stroke="#fff" strokeOpacity=".16">
          {[44, 72, 100, 128, 156].map((r) => (
            <circle key={r} cx="150" cy="168" r={r} />
          ))}
        </g>
        <g fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5">
          <circle cx="150" cy="168" r="30" />
          <path d="M150 138v60M120 168h60" strokeOpacity=".25" />
        </g>
        <circle cx="150" cy="168" r="9" fill="#fff" />
        <circle cx="236" cy="96" r="3" fill="#fff" fillOpacity=".8" />
        <circle cx="68" cy="236" r="2.4" fill="#fff" fillOpacity=".7" />
        <rect width="300" height="420" fill="url(#hcd-fade)" />
      </svg>
      <span style={{ position: "absolute", top: "1.7em", left: "1.7em", width: "2.2em", height: "2.2em", borderRadius: "0.7em", background: "rgb(255 255 255 / .16)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
        <svg width="62%" height="62%" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 17V9a7 7 0 0 1 14 0v8M9 17v-6a3 3 0 0 1 6 0v6" />
        </svg>
      </span>
      <span style={{ position: "absolute", top: "1.7em", right: "1.7em", padding: "0.35em 1em", borderRadius: 999, background: "#fff", color: "#111", fontSize: "1em", fontWeight: 600, letterSpacing: ".02em" }}>
        Pro
      </span>
      <div style={{ position: "absolute", left: "2em", right: "2em", bottom: "2em", color: "#fff" }}>
        <div style={{ fontSize: "2.25em", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.05 }}>Jasmine Brooks</div>
        <div style={{ fontSize: "1.15em", color: "rgb(255 255 255 / .62)", marginTop: ".5em" }}>Design lead</div>
        <div style={{ height: 1, background: "rgb(255 255 255 / .18)", margin: "1.3em 0 1.1em" }} />
        <div style={{ display: "flex", gap: "2.6em" }}>
          {[["Member since", "2023"], ["Shipped", "148"]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: ".92em", color: "rgb(255 255 255 / .55)" }}>{k}</div>
              <div style={{ fontSize: "1.3em", fontWeight: 600, marginTop: ".25em", fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Back() {
  const n = 21
  const cells = React.useMemo(() => qrCells(n), [])
  return (
    <div style={{ position: "absolute", inset: 0, fontSize: "calc(100cqw / 30)", background: "linear-gradient(160deg,#1d1b2b,#0b0b10 70%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.8em", color: "#fff", textAlign: "center" }}>
      <div style={{ padding: "1.1em", borderRadius: "1.4em", background: "#fff", boxShadow: "0 0 0 1px rgb(255 255 255 / .2)" }}>
        <svg viewBox={`0 0 ${n} ${n}`} width="13.5em" height="13.5em" shapeRendering="crispEdges" role="img" aria-label="Sample code">
          {cells.map((on, i) => (on ? <rect key={i} x={i % n} y={Math.floor(i / n)} width="1" height="1" fill="#111" /> : null))}
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "1.7em", fontWeight: 500, letterSpacing: "-.01em" }}>Harbor Pro</div>
        <div style={{ fontSize: "1.1em", color: "rgb(255 255 255 / .6)", marginTop: ".4em" }}>Founding member, March 2023</div>
      </div>
      <div style={{ fontSize: "1em", color: "rgb(255 255 255 / .45)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>harbor.example/jasmine</div>
    </div>
  )
}

export default function Demo() {
  const [intensity, setIntensity] = React.useState(1)
  const [flipped, setFlipped] = React.useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-8 py-4">
      <HoloCard
        front={<Front />}
        back={<Back />}
        label="Jasmine Brooks, Harbor Pro member card"
        intensity={intensity}
        flipped={flipped}
        onFlippedChange={setFlipped}
      />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-neutral-500">
        <label className="flex items-center gap-2">
          Foil intensity
          <input type="range" min={0} max={1} step={0.05} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-32" />
        </label>
        <span>{flipped ? "Showing the back" : "Move over the card, click to flip"}</span>
      </div>
    </div>
  )
}
