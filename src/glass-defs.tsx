/* Pane Glass: the displacement filters behind true refraction (Tier 2 of the Glass style).
 *
 * Render <GlassDefs /> once, next to the app. It draws a hidden <svg> with eight filters: four size classes (tip, pill, menu,
 * card) x two colour schemes (-l light, -d dark), e.g. #pane-glass-menu-l. The Glass style in src/styles.css points menus,
 * popovers, tooltips, dialogs, dock and tab bars (and top-level cards, with the "card" map) at them:
 *
 *     backdrop-filter: url(#pane-glass-menu-l) saturate(…) brightness(…)
 *
  * Why it looks like glass: the map is a per-pixel vector field – strong along the rim, flat in the middle – so the
 * backdrop bends at the edge (lensing) while the centre stays crisp and text stays readable. Vectors point INWARD
 * (an outward map samples outside the box and leaves a bright seam at the rim).
 *
 * The filter box is the element's own box (objectBoundingBox) and the map is stretched to it, so a handful of
 * size classes cover every surface in the library. Maps are painted on a canvas the first time Glass is on.
 *
 * Gating (set as <html data-refract>): Chromium only – Safari and Firefox keep the frosted + rim look (Tier 1) –
 * and never with reduced transparency, more contrast or forced colours. Do not use @supports for this: it
 * false-positives on Safari and Firefox.
 */
import * as React from "react"

type Spec = { id: string; w: number; h: number; r: number; bezel: number; scale: number; soft: number }

/** Size classes. The displacement must not fold the backdrop over itself (which garbles text behind the rim): the profile is
 *  (1 - t)^2 across the bezel, so its slope stays below 1 while the peak shift (scale / 2) is at most about 0.6 x bezel.
 *  `scale` is the displacement at the rim in px × 2 (feDisplacementMap maps ±.5 of its scale); `soft` is the
 *  blur (px) of the flat centre, which keeps text behind the glass from competing with text on it. Tooltips, dock and tab bars,
 *  menus and dialogs each have one; every card-like surface (cards, panels, sheets) shares "card". */
const GLASS_SPECS: Spec[] = [
  { id: "tip", w: 128, h: 40, r: 12, bezel: 14, scale: 18, soft: 6 },
  { id: "pill", w: 360, h: 64, r: 32, bezel: 30, scale: 40, soft: 8 },
  { id: "menu", w: 300, h: 260, r: 20, bezel: 38, scale: 48, soft: 11 },
  { id: "card", w: 520, h: 340, r: 28, bezel: 46, scale: 58, soft: 13 },
]

/** Paint one map: R/G hold the inward vector (128 = no shift), B holds the rim mask (255 at the rim, 0 in the centre), A is opaque. */
function paintMap({ w, h, r, bezel }: Spec): string {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(w, h)
  const hw = w / 2 - r
  const hh = h / 2 - r
  const field = new Float32Array(w * h * 2)
  const mask = new Float32Array(w * h)
  let max = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2
      const py = y + 0.5 - h / 2
      // Signed distance to the rounded rectangle and its outward gradient, analytically.
      const qx = Math.abs(px) - hw
      const qy = Math.abs(py) - hh
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const out = Math.hypot(ox, oy)
      const d = Math.min(Math.max(qx, qy), 0) + out - r
      const depth = -d
      let m = 0
      const k = Math.min(1, Math.max(0, 1 - depth / (bezel * 1.1)))
      mask[y * w + x] = k * k * (3 - 2 * k)
      if (depth > 0 && depth < bezel) {
        const t = depth / bezel
        // A convex lens: the strongest bend at the rim, easing to nothing at the inner edge of the bezel.
        m = (1 - t) * (1 - t) * Math.min(1, depth / 1.5)
      }
      let gx: number
      let gy: number
      if (out > 0) {
        gx = ox / out
        gy = oy / out
      } else if (qx > qy) {
        gx = 1
        gy = 0
      } else {
        gx = 0
        gy = 1
      }
      gx *= Math.sign(px) || 1
      gy *= Math.sign(py) || 1
      const i = (y * w + x) * 2
      field[i] = -m * gx // inward = minus the outward normal
      field[i + 1] = -m * gy
      max = Math.max(max, Math.abs(field[i]), Math.abs(field[i + 1]))
    }
  }
  max = max || 1
  for (let i = 0; i < w * h; i++) {
    img.data[i * 4] = Math.round(128 + (field[i * 2] / max) * 127)
    img.data[i * 4 + 1] = Math.round(128 + (field[i * 2 + 1] / max) * 127)
    img.data[i * 4 + 2] = Math.round(mask[i] * 255)
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL("image/png")
}

function canRefract(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands
  if (!brands?.some((b) => b.brand === "Chromium")) return false
  const m = (q: string) => window.matchMedia(q).matches
  return !(m("(prefers-reduced-transparency: reduce)") || m("(prefers-contrast: more)") || m("(forced-colors: active)"))
}

export function GlassDefs() {
  const ref = React.useRef<SVGSVGElement>(null)
  React.useEffect(() => {
    const root = document.documentElement
    const svg = ref.current
    if (!svg) return
    let painted = false
    const sync = () => {
      const on = root.dataset.style === "glass" && canRefract()
      if (on && !painted) {
        painted = true
        for (const s of GLASS_SPECS) {
          const href = paintMap(s)
          for (const img of svg.querySelectorAll(`feImage[data-map="${s.id}"]`)) img.setAttribute("href", href)
        }
      }
      if (on) root.dataset.refract = "1"
      else delete root.dataset.refract
    }
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ["data-style"] })
    const queries = ["(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)", "(forced-colors: active)"].map((q) => window.matchMedia(q))
    for (const q of queries) q.addEventListener("change", sync)
    return () => {
      mo.disconnect()
      for (const q of queries) q.removeEventListener("change", sync)
      delete root.dataset.refract
    }
  }, [])

  return (
    <svg ref={ref} aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none" }}>
      <defs>
        {GLASS_SPECS.flatMap((s) => (["l", "d"] as const).map((m) => [s, m] as const)).map(([s, m]) => (
          <filter key={`${s.id}-${m}`} id={`pane-glass-${s.id}-${m}`} filterUnits="objectBoundingBox" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
            <feImage data-map={s.id} preserveAspectRatio="none" result="map" />
            {/* The rim mask lives in the map's blue channel: move it to alpha. */}
            <feColorMatrix in="map" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0" result="mask" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={s.soft} result="soft" />
            {/* Chromatic fringe: red, green and blue bend by slightly different amounts, so the rim splits light like a prism. */}
            <feDisplacementMap in="SourceGraphic" in2="map" scale={s.scale} xChannelSelector="R" yChannelSelector="G" result="dR" />
            <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={s.scale * 0.96} xChannelSelector="R" yChannelSelector="G" result="dG" />
            <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cG" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={s.scale * 0.92} xChannelSelector="R" yChannelSelector="G" result="dB" />
            <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cB" />
            <feComposite in="cR" in2="cG" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="cRG" />
            <feComposite in="cRG" in2="cB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lens" />
            <feGaussianBlur in="lens" stdDeviation="1.5" result="lensSoft" />
            {/* The rim also carries more colour and a different tone than the centre – lighter on dark glass, a touch deeper on light
                glass – so the bevel reads even over a smooth backdrop. One filter per colour scheme (a filter cannot read CSS variables). */}
            <feColorMatrix in="lensSoft" type="saturate" values={m === "l" ? "2.2" : "1.5"} result="lensSat" />
            <feComponentTransfer in="lensSat" result="lensLit">
              <feFuncR type="linear" slope={m === "l" ? 0.8 : 1.1} intercept={m === "l" ? 0 : 0.045} />
              <feFuncG type="linear" slope={m === "l" ? 0.8 : 1.1} intercept={m === "l" ? 0 : 0.045} />
              <feFuncB type="linear" slope={m === "l" ? 0.8 : 1.1} intercept={m === "l" ? 0 : 0.045} />
            </feComponentTransfer>
            <feComposite in="lensLit" in2="mask" operator="in" result="rim" />
            <feComposite in="soft" in2="mask" operator="out" result="core" />
            <feComposite in="rim" in2="core" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        ))}
      </defs>
    </svg>
  )
}
