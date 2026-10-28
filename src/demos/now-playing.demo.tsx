import * as React from "react"

import { NowPlaying, NowPlayingLevels, nowPlayingSampleTracks } from "@/components/ui/now-playing"

export const notes = [
  "The mini bar and the full player are one element, not two. The artwork, the play button and the next button are absolutely positioned and their `left`, `top`, `width`, `height` and `border-radius` are CSS transitions between two sets of values, so each piece physically travels instead of cross-fading. Positions use `calc(100% - 50px)` and `calc(50% + 54px)`, which interpolate fine, so it works at any width.",
  "The spring is a CSS `linear()` easing. At module load a tiny simulation (stiffness 190, damping 23, 240 steps per second) is sampled into 40 points and written into `--nwp-spring: linear(0, ...)`, so the browser animates with real overshoot and zero JavaScript per frame. `@supports` falls back to a plain cubic-bezier.",
  "Artwork is generated, not loaded: three radial gradients and a linear one in `oklch()` from three hues, plus a `repeating-radial-gradient` of faint rings blended with `soft-light`. The hues come from a hash of the track id, so every track gets its own stable cover.",
  "Playback is a clock in a ref, painted straight to the DOM by one rAF loop that only runs while playing: a `scaleX` on the mini progress line, a `clip-path: inset()` that reveals a second, darker copy of the 54 waveform bars, and the time labels when the whole second changes. Pass `time` to hand the clock to a real audio element.",
  "Pulling the artwork down is a pointer-capture drag that writes `translateY` and a small `scale` to the shell. Downward movement is damped, an upward pull follows `-42 * (1 - e^(dy/70))` so it rubber-bands, and a release past 70px or with a fast flick closes the player; otherwise the transform is cleared and the CSS transition springs it back.",
]

export default function Demo() {
  const [playing, setPlaying] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  const t = nowPlayingSampleTracks[index]
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-6">
      <div
        className="flex w-full items-center justify-center rounded-3xl px-4 py-8"
        style={{ minHeight: 480, background: "linear-gradient(160deg, color-mix(in oklab, #ffb48a 20%, transparent), color-mix(in oklab, #c79bff 18%, transparent) 55%, color-mix(in oklab, #7aa7ff 22%, transparent))" }}
      >
        <NowPlaying
          index={index}
          onIndexChange={setIndex}
          playing={playing}
          onPlayingChange={setPlaying}
          expanded={expanded}
          onExpandedChange={setExpanded}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-neutral-600 dark:text-neutral-300">
        <span className="inline-flex items-center gap-2">
          <NowPlayingLevels playing={playing} className="text-neutral-800 dark:text-neutral-200" />
          {playing ? "Playing" : "Paused"}: {t.title}
        </span>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-neutral-900 dark:accent-white" checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
          Full player
        </label>
      </div>
      <p className="text-center text-[13px] text-neutral-500 dark:text-neutral-400">Tap the bar to expand. In the full player, pull the artwork down to close, scrub the waveform, or use the arrow keys on it.</p>
    </div>
  )
}
