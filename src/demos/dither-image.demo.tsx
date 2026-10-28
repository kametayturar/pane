import * as React from "react"

import { DitherImage } from "@/components/motion/dither-image"
import type { StudioProps } from "@/components/motion/backdrop"

export const notes = [
  "Ordered dithering compares each cell's tone with a fixed Bayer threshold matrix tiled across the picture: tone above the threshold lights a dot, below leaves it dark. No randomness, so every frame is stable – the grid pattern is the look.",
  "The picture is shrunk to one pixel per dot cell on an offscreen canvas (halving first for big photos, so thin lines keep their tone), then getImageData gives colour and alpha; darkness = (1 − luminance) × alpha, so transparent areas stay empty.",
  "Lit dots are drawn as square rects in a handful of alpha buckets – one ctx.fill() per bucket instead of one per dot – and snapped to whole device pixels so they stay crisp at any devicePixelRatio.",
  "Reveal gives every dot a hashed delay and a scatter vector, then eases it home with a cubic ease-out; drift adds a travelling sine to each dot's position and to its tone, so dots near the threshold blink in and out as the wave passes.",
  "The built-in dragonfly is drawn from maths as an inline SVG (veins are polylines between a leading and a trailing edge curve) and fed through an SVG → <img> → canvas path, the same way any children you pass in are rasterised.",
]

const SLATE = "#6b7aa1"

export default function Demo({ speed, paused, accent }: StudioProps) {
  const [url, setUrl] = React.useState<string | null>(null)
  const [cell, setCell] = React.useState(3)
  const [invert, setInvert] = React.useState(false)
  const [over, setOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // The object URL lives only as long as the picture is shown.
  React.useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  function take(file: File | undefined | null) {
    if (!file || !file.type.startsWith("image/")) return
    setUrl(URL.createObjectURL(file))
  }

  // The studio's default blue is for UI accents; the artwork looks better in its own slate unless the visitor picks something else.
  const dot = accent && accent !== "#0060e2" ? accent : undefined

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-6 text-[13px] text-black/70 dark:text-white/70">
      <DitherImage src={url ?? undefined} cellSize={cell} invert={invert} speed={speed} paused={paused} accent={dot ?? SLATE} label={url ? "Your picture as dither dots" : "A dragonfly drawn in dither dots"} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="flex items-center gap-2.5">
          <span className="text-black/55 dark:text-white/55">Cell size</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={cell}
            onChange={(e) => setCell(Number(e.target.value))}
            className="h-1 w-32 cursor-pointer accent-current"
            aria-label="Cell size"
          />
          <span className="w-8 tabular-nums text-black/45 dark:text-white/45">{cell}px</span>
        </label>
        {url && (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} className="size-3.5 accent-current" />
            <span>Invert</span>
          </label>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer.files[0])
        }}
        data-over={over || undefined}
        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-black/20 px-4 py-3 transition-colors data-[over]:border-black/50 data-[over]:bg-black/[.03] dark:border-white/20 dark:data-[over]:border-white/50 dark:data-[over]:bg-white/[.05]"
      >
        <span>{url ? "Your picture, dithered in your browser – nothing is uploaded." : "Drop an image here to dither your own picture."}</span>
        <span className="flex shrink-0 items-center gap-2">
          {url && (
            <button type="button" onClick={() => setUrl(null)} className="rounded-md px-2 py-1 text-black/55 transition-colors hover:text-black dark:text-white/55 dark:hover:text-white">
              Use artwork
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md px-2.5 py-1 font-medium text-black/85 shadow-[0_0_0_.5px_rgb(0_0_0/.15)] transition-colors hover:bg-black/5 dark:text-white/90 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)] dark:hover:bg-white/10"
          >
            Choose file
          </button>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose an image to dither"
          onChange={(e) => {
            take(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
