"use client"

import * as React from "react"

/**
 * GlowCloud – a small cloud mascot with two eyes. It floats, glances left and right, blinks,
 * follows the pointer and bounces with a wink when clicked.
 *
 *   <GlowCloud variant="glow" accent="#7c5cff" />
 *   <GlowCloud variant="frost" />
 */

export type GlowCloudProps = {
  /** "glow" is a translucent cloud lit from inside; "frost" is a frosted white cloud with the eyes cut out. Default "glow". */
  variant?: "glow" | "frost"
  /** Paint a soft accent-tinted sky behind the cloud. Default: on for "frost", off for "glow". */
  sky?: boolean
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame (the cloud also stops following the pointer). */
  paused?: boolean
  /** Accent colour (any CSS colour) for the glow, the tint of the cloud and the sky. */
  accent?: string
  /** Accessible name of the scene. */
  label?: string
  /** Accessible name of the clickable cloud. */
  buttonLabel?: string
  /** Called when the cloud is clicked or activated with the keyboard. */
  onPoke?: () => void
  className?: string
}

const W = 480
const H = 360

const CLOUD = "M62 148 C30 148 12 128 18 104 C22 86 38 77 56 79 C58 50 84 28 113 30 C136 31 152 43 160 59 C188 52 216 72 214 100 C232 104 238 134 218 145 C212 148 206 148 198 148 Z"

const CSS = `
.gc {
  --gc-ink: #000;
  --gc-accent: #5b7cff;
  --gc-speed: 1;
  --gc-scale: 1;
  --gc-lx: 0;
  --gc-ly: 0;
  --gc-ease: cubic-bezier(.22, 1, .36, 1);
  --gc-sky-top: color-mix(in oklab, var(--gc-accent) 52%, #fff);
  --gc-sky-bottom: color-mix(in oklab, var(--gc-accent) 16%, #fff);
  --gc-eye: color-mix(in oklab, var(--gc-accent) 22%, #0b1030);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--gc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gc {
  --gc-ink: #fff;
  --gc-accent: #7c9cff;
  --gc-sky-top: color-mix(in oklab, var(--gc-accent) 34%, #0a0c16);
  --gc-sky-bottom: color-mix(in oklab, var(--gc-accent) 10%, #0a0c16);
}
.gc *, .gc *::before, .gc *::after { box-sizing: border-box }
.gc button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.gc :focus-visible { outline: 2px solid color-mix(in oklab, var(--gc-accent) 60%, transparent); outline-offset: 1px }

.gc-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--gc-scale)) }

/* Sky */
.gc-sky { position: absolute; inset: 0; border-radius: 28px; overflow: hidden;
  background: linear-gradient(180deg, var(--gc-sky-top), var(--gc-sky-bottom));
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--gc-ink) 8%, transparent) }
.gc-sky::before, .gc-sky::after { content: ""; position: absolute; border-radius: 50%; filter: blur(26px); background: rgb(255 255 255 / .5) }
.gc-sky::before { width: 220px; height: 90px; left: -50px; bottom: 26px; animation: gc-drift calc(18s / var(--gc-speed)) ease-in-out infinite alternate }
.gc-sky::after { width: 190px; height: 70px; right: -40px; top: 34px; opacity: .7; animation: gc-drift calc(23s / var(--gc-speed)) ease-in-out infinite alternate-reverse }
:is(.dark, [data-theme="dark"]) .gc-sky::before, :is(.dark, [data-theme="dark"]) .gc-sky::after { background: color-mix(in oklab, var(--gc-accent) 40%, transparent) }
@keyframes gc-drift { from { transform: translateX(-14px) } to { transform: translateX(26px) } }

/* Halo and ground shadow (outside the floating body so they stay put) */
.gc-halo { position: absolute; left: 50px; top: 40px; width: 380px; height: 280px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--gc-accent) 52%, transparent), transparent);
  filter: blur(14px); animation: gc-breathe calc(4.4s / var(--gc-speed)) ease-in-out infinite alternate }
.gc[data-variant="frost"] .gc-halo { background: radial-gradient(closest-side, rgb(255 255 255 / .55), transparent); opacity: .7 }
@keyframes gc-breathe { from { opacity: .55; transform: scale(.94) } to { opacity: 1; transform: scale(1.04) } }
.gc-ground { position: absolute; left: 140px; top: 306px; width: 200px; height: 18px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--gc-ink) 22%, transparent), transparent);
  animation: gc-ground calc(4.8s / var(--gc-speed)) ease-in-out infinite alternate }
.gc[data-variant="glow"] .gc-ground { background: radial-gradient(closest-side, color-mix(in oklab, var(--gc-accent) 38%, transparent), transparent) }
@keyframes gc-ground { from { transform: scaleX(1); opacity: .9 } to { transform: scaleX(.78); opacity: .5 } }

/* The click target is the cloud itself */
.gc-hit { position: absolute; left: 90px; top: 62px; width: 300px; height: 212px; border-radius: 40% 40% 36% 36% / 46% 46% 30% 30%; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.gc-float { width: 100%; height: 100%; animation: gc-float calc(4.8s / var(--gc-speed)) ease-in-out infinite alternate }
@keyframes gc-float { 0% { transform: translateY(8px) rotate(-1.2deg) } 100% { transform: translateY(-10px) rotate(1.2deg) } }
.gc-pop { width: 100%; height: 100%; transform-origin: 50% 90% }
.gc-pop[data-go] { animation: gc-bounce calc(.95s / var(--gc-speed)) var(--gc-ease) }
@keyframes gc-bounce {
  0% { transform: scale(1, 1) }
  14% { transform: scale(1.1, .84) translateY(6px) }
  42% { transform: scale(.93, 1.1) translateY(-34px) }
  68% { transform: scale(1.05, .95) translateY(2px) }
  84% { transform: scale(.99, 1.02) }
  100% { transform: scale(1, 1) }
}
.gc-lean { width: 100%; height: 100%; transform-origin: 50% 80%; transform: rotate(calc(var(--gc-lx) * .3deg)) translateX(calc(var(--gc-lx) * .5px)); transition: transform .5s var(--gc-ease) }
.gc-svg { display: block; width: 100%; height: 100%; overflow: visible }
.gc[data-variant="glow"] .gc-svg { filter: drop-shadow(0 0 16px color-mix(in oklab, var(--gc-accent) 60%, transparent)) }
.gc[data-variant="frost"] .gc-svg { filter: drop-shadow(0 16px 16px color-mix(in oklab, var(--gc-accent) 34%, transparent)) }
.gc[data-variant="frost"]:not([data-sky]) .gc-svg { filter: drop-shadow(0 0 .5px color-mix(in oklab, var(--gc-ink) 30%, transparent)) drop-shadow(0 12px 14px color-mix(in oklab, var(--gc-accent) 30%, transparent)) }

/* Face: eyes + cheeks move together to look around or follow the pointer */
.gc-track { transition: transform .38s var(--gc-ease); transform: translate(calc(var(--gc-lx) * 1px), calc(var(--gc-ly) * 1px)) }
.gc-look { animation: gc-look calc(9s / var(--gc-speed)) ease-in-out infinite }
.gc[data-follow] .gc-look { animation: none }
@keyframes gc-look {
  0%, 22% { transform: translate(0, 0) }
  30%, 42% { transform: translate(-11px, -2px) }
  52%, 62% { transform: translate(0, 0) }
  72%, 86% { transform: translate(11px, 2px) }
  100% { transform: translate(0, 0) }
}
.gc-eye, .gc-eye-cut { transform-box: fill-box; transform-origin: 50% 50%; animation: gc-blink calc(5.2s / var(--gc-speed)) ease-in-out infinite }
.gc-eye-r { animation-delay: .04s }
@keyframes gc-blink { 0%, 90%, 100% { transform: scaleY(1) } 94% { transform: scaleY(.08) } }
.gc-pop[data-go] .gc-eye-r, .gc-pop[data-go] .gc-eye-cut-r { animation: gc-wink calc(.95s / var(--gc-speed)) var(--gc-ease) }
.gc-pop[data-go] .gc-eye-l, .gc-pop[data-go] .gc-eye-cut-l { animation: gc-happy calc(.95s / var(--gc-speed)) var(--gc-ease) }
@keyframes gc-wink { 0% { transform: scale(1, 1) } 14%, 78% { transform: scale(1.25, .12) } 100% { transform: scale(1, 1) } }
@keyframes gc-happy { 0% { transform: scale(1, 1) } 14%, 78% { transform: scale(1.06, 1.16) } 100% { transform: scale(1, 1) } }
.gc-cheek { fill: color-mix(in oklab, var(--gc-accent) 30%, #ff9ec0); opacity: .55; transition: opacity .3s }
.gc-pop[data-go] .gc-cheek { opacity: .95 }

/* Little stars that pop out when poked */
.gc-spark { position: absolute; left: 50%; top: 40%; width: 14px; height: 14px; margin: -7px 0 0 -7px; opacity: 0; pointer-events: none; color: #fff }
.gc-spark svg { display: block; width: 100%; height: 100%; fill: currentColor; filter: drop-shadow(0 0 4px color-mix(in oklab, var(--gc-accent) 70%, transparent)) }
@keyframes gc-spark { 0% { opacity: 0; transform: translate(0, 0) scale(.3) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1) } }
.gc-twinkle { position: absolute; width: 12px; height: 12px; color: #fff; opacity: .8; animation: gc-twinkle calc(3.2s / var(--gc-speed)) ease-in-out infinite alternate }
.gc-twinkle svg { display: block; width: 100%; height: 100%; fill: currentColor }
@keyframes gc-twinkle { from { opacity: .15; transform: scale(.6) } to { opacity: .95; transform: scale(1.1) } }

.gc[data-paused] *, .gc[data-paused] *::before, .gc[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .gc *, .gc *::before, .gc *::after { animation: none !important; transition: none !important }
}
`

const STAR = "M7 0 C7.5 4.4 9.6 6.5 14 7 C9.6 7.5 7.5 9.6 7 14 C6.5 9.6 4.4 7.5 0 7 C4.4 6.5 6.5 4.4 7 0 Z"

function Star({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={style} aria-hidden>
      <svg viewBox="0 0 14 14">
        <path d={STAR} />
      </svg>
    </span>
  )
}

const SPARKS: Array<[number, number]> = [
  [-120, -64],
  [96, -80],
  [132, -6],
]

export function GlowCloud({ variant = "glow", sky, speed = 1, paused, accent, label = "A friendly cloud mascot", buttonLabel = "Poke the cloud", onPoke, className }: GlowCloudProps) {
  const showSky = sky ?? variant === "frost"
  const uid = React.useId().replace(/:/g, "")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const hitRef = React.useRef<HTMLButtonElement>(null)
  const [pokes, setPokes] = React.useState(0)
  const pausedRef = React.useRef(paused)
  React.useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Scale the fixed stage to the container width.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--gc-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Eyes follow the pointer anywhere on the page; they go back to idle glancing after a pause.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    let idle: ReturnType<typeof setTimeout> | undefined
    const release = () => {
      root.removeAttribute("data-follow")
      root.style.setProperty("--gc-lx", "0")
      root.style.setProperty("--gc-ly", "0")
    }
    const move = (e: PointerEvent) => {
      if (pausedRef.current || reduce.matches || !hitRef.current) return
      const r = hitRef.current.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / Math.max(160, r.width)
      const dy = (e.clientY - (r.top + r.height / 2)) / Math.max(120, r.height)
      const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
      root.setAttribute("data-follow", "")
      root.style.setProperty("--gc-lx", String(clamp(dx * 16, 12).toFixed(2)))
      root.style.setProperty("--gc-ly", String(clamp(dy * 12, 8).toFixed(2)))
      clearTimeout(idle)
      idle = setTimeout(release, 2600)
    }
    const leave = () => {
      clearTimeout(idle)
      release()
    }
    window.addEventListener("pointermove", move, { passive: true })
    document.documentElement.addEventListener("pointerleave", leave)
    return () => {
      clearTimeout(idle)
      window.removeEventListener("pointermove", move)
      document.documentElement.removeEventListener("pointerleave", leave)
    }
  }, [])

  const vars = { ...(accent ? { "--gc-accent": accent } : null), "--gc-speed": Math.max(0.05, speed) } as React.CSSProperties
  const gid = `gc-${uid}`

  const eyes = (cut: boolean) => (
    <g className="gc-look">
      <g className="gc-track">
        {cut ? (
          <>
            <ellipse className="gc-eye-cut gc-eye-cut-l" cx="92" cy="98" rx="8.5" ry="12" fill="#000" />
            <ellipse className="gc-eye-cut gc-eye-cut-r" cx="148" cy="98" rx="8.5" ry="12" fill="#000" />
          </>
        ) : (
          <>
            <ellipse className="gc-cheek" cx="72" cy="122" rx="11" ry="6.5" />
            <ellipse className="gc-cheek" cx="168" cy="122" rx="11" ry="6.5" />
            <g className="gc-eye gc-eye-l">
              <ellipse cx="92" cy="98" rx="8" ry="11.5" fill="var(--gc-eye)" />
              <circle cx="94.4" cy="93.4" r="2.6" fill="#fff" opacity=".9" />
            </g>
            <g className="gc-eye gc-eye-r">
              <ellipse cx="148" cy="98" rx="8" ry="11.5" fill="var(--gc-eye)" />
              <circle cx="150.4" cy="93.4" r="2.6" fill="#fff" opacity=".9" />
            </g>
          </>
        )}
      </g>
    </g>
  )

  return (
    <div
      ref={rootRef}
      className={className ? `gc ${className}` : "gc"}
      role="group"
      aria-label={label}
      data-variant={variant}
      data-sky={showSky || undefined}
      data-paused={paused || undefined}
      style={vars}
    >
      <style href="pane-glow-cloud" precedence="default">
        {CSS}
      </style>
      <div className="gc-stage">
        {showSky && (
          <div className="gc-sky" aria-hidden>
            <Star className="gc-twinkle" style={{ left: 64, top: 70 }} />
            <Star className="gc-twinkle" style={{ right: 78, top: 126, animationDelay: "-1.4s" }} />
            <Star className="gc-twinkle" style={{ left: 120, bottom: 58, animationDelay: "-2.2s" }} />
          </div>
        )}
        <div className="gc-halo" aria-hidden />
        <div className="gc-ground" aria-hidden />
        <button
          ref={hitRef}
          type="button"
          className="gc-hit"
          aria-label={buttonLabel}
          onClick={() => {
            setPokes((n) => n + 1)
            onPoke?.()
          }}
        >
          <div className="gc-float" aria-hidden>
            {/* Keyed by poke count so each click restarts the bounce from the beginning. */}
            <div key={pokes} className="gc-pop" data-go={pokes > 0 ? "" : undefined}>
              <div className="gc-lean">
                <svg className="gc-svg" viewBox="0 0 240 170" focusable="false">
                  <defs>
                    <linearGradient id={`${gid}-fill`} gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="150">
                      {variant === "glow" ? (
                        <>
                          <stop offset="0" style={{ stopColor: "color-mix(in oklab, var(--gc-accent) 38%, #fff)" }} />
                          <stop offset="1" style={{ stopColor: "color-mix(in oklab, var(--gc-accent) 82%, #fff)" }} />
                        </>
                      ) : (
                        <>
                          <stop offset="0" stopColor="#fff" />
                          <stop offset="1" style={{ stopColor: "color-mix(in oklab, var(--gc-accent) 14%, #fff)" }} />
                        </>
                      )}
                    </linearGradient>
                    <linearGradient id={`${gid}-rim`} gradientUnits="userSpaceOnUse" x1="40" y1="30" x2="200" y2="150">
                      <stop offset="0" stopColor="#fff" stopOpacity=".95" />
                      <stop offset=".55" stopColor="#fff" stopOpacity=".1" />
                      <stop offset="1" stopColor="#fff" stopOpacity=".4" />
                    </linearGradient>
                    <radialGradient id={`${gid}-sheen`} cx=".3" cy=".25" r=".7">
                      <stop offset="0" stopColor="#fff" stopOpacity=".75" />
                      <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                    {variant === "frost" && (
                      <mask id={`${gid}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="170">
                        <rect width="240" height="170" fill="#fff" />
                        {eyes(true)}
                      </mask>
                    )}
                    <clipPath id={`${gid}-clip`}>
                      <path d={CLOUD} />
                    </clipPath>
                  </defs>

                  {variant === "glow" ? (
                    <>
                      <g opacity=".86">
                        <path d={CLOUD} fill={`url(#${gid}-fill)`} />
                      </g>
                      <g clipPath={`url(#${gid}-clip)`}>
                        <ellipse cx="86" cy="62" rx="70" ry="44" fill={`url(#${gid}-sheen)`} />
                        <ellipse cx="120" cy="170" rx="120" ry="34" fill="var(--gc-accent)" opacity=".28" />
                      </g>
                      <path d={CLOUD} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth="2" />
                      {eyes(false)}
                    </>
                  ) : (
                    <g mask={`url(#${gid}-cut)`}>
                      <path d={CLOUD} fill={`url(#${gid}-fill)`} fillOpacity=".96" />
                      <g clipPath={`url(#${gid}-clip)`}>
                        <ellipse cx="84" cy="60" rx="70" ry="40" fill={`url(#${gid}-sheen)`} />
                        <ellipse cx="130" cy="168" rx="120" ry="30" fill="var(--gc-accent)" opacity=".16" />
                      </g>
                      <path d={CLOUD} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth="1.5" />
                    </g>
                  )}
                  {variant === "frost" && (
                    <g className="gc-look">
                      <g className="gc-track">
                        <ellipse className="gc-cheek" cx="70" cy="124" rx="11" ry="6.5" style={{ opacity: 0.4 }} />
                        <ellipse className="gc-cheek" cx="170" cy="124" rx="11" ry="6.5" style={{ opacity: 0.4 }} />
                      </g>
                    </g>
                  )}
                </svg>
              </div>
            </div>
            {SPARKS.map(([dx, dy], i) => (
              <Star key={`${i}-${pokes}`} className="gc-spark" style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 0.05}s`, animationName: pokes > 0 ? "gc-spark" : "none", animationDuration: `calc(.9s / ${Math.max(0.05, speed)})`, animationTimingFunction: "var(--gc-ease)" } as React.CSSProperties} />
            ))}
          </div>
        </button>
      </div>
    </div>
  )
}
