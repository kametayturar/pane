import * as React from "react"

import { NumberTicker } from "@/components/motion/number-ticker"
import type { StudioProps } from "@/components/motion/backdrop"

const SERIES = [4180, 12960, 48240, 51890, 97300, 128450, 1204500]
const LAST_MONTH = 42920

const btn =
  "grid size-7 place-items-center rounded-md text-base leading-none transition-colors disabled:pointer-events-none disabled:opacity-40 " +
  "shadow-[0_0_0_.5px_rgb(0_0_0/.15)] hover:bg-black/5 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)] dark:hover:bg-white/10"

export default function Demo(props: StudioProps) {
  const [i, setI] = React.useState(2)
  const [compact, setCompact] = React.useState(false)
  const value = SERIES[i]
  const delta = value / LAST_MONTH - 1
  const up = delta >= 0

  return (
    <div className="mx-auto w-full max-w-xs rounded-xl bg-white p-5 text-black/85 shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_1px_-1px_rgb(0_0_0/.1),0_1px_2px_0_rgb(0_0_0/.05)] dark:bg-[#1c1c1e] dark:text-white/90 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1),0_1px_2px_0_rgb(0_0_0/.4)]">
      <div className="flex items-center justify-between text-[13px] leading-5">
        <span className="text-black/60 dark:text-white/62">Revenue · This month</span>
        <button
          type="button"
          aria-pressed={compact}
          onClick={() => setCompact((c) => !c)}
          className="rounded px-1.5 text-xs text-black/45 hover:text-black/80 aria-pressed:text-black/80 dark:text-white/46 dark:hover:text-white/90 dark:aria-pressed:text-white/90"
        >
          Compact
        </button>
      </div>
      <div className="mt-2 text-4xl font-semibold tracking-tight">
        <NumberTicker
          {...props}
          value={value}
          format={
            compact
              ? { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }
              : { style: "currency", currency: "USD", maximumFractionDigits: 0 }
          }
          locale="en-US"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
            (up ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/12 text-rose-700 dark:text-rose-400")
          }
        >
          <NumberTicker {...props} value={delta} format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }} locale="en-US" />
          <span className="ml-1 font-normal opacity-70">vs last month</span>
        </span>
        <div className="flex gap-1.5">
          <button type="button" className={btn} aria-label="Decrease revenue" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>
            −
          </button>
          <button type="button" className={btn} aria-label="Increase revenue" disabled={i === SERIES.length - 1} onClick={() => setI((n) => Math.min(SERIES.length - 1, n + 1))}>
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export const notes = [
  "The number is formatted with `Intl.NumberFormat(...).formatToParts()`, which returns typed pieces (integer, group, decimal, currency, compact…); that is how currency, compact (`$48K`) and percent formats all work without custom string code.",
  "Each digit is a vertical strip of 0–9 inside a one-glyph-tall window (`overflow: clip`). Showing a value is `transform: translateY(calc(var(--d) * -1.1em))`, and a CSS `transition` on transform rolls the strip, with a tiny per-place delay so lower digits move first.",
  "Digits are keyed by place value (ones, tens, hundreds…) rather than by position in the string, so when `9,999` becomes `10,000` React keeps the existing strips and they roll instead of remounting.",
  "Characters that appear or vanish get `max-width` keyframes (0 to natural width) plus blur and opacity; removed ones are kept in state as 'exiting' until `animationend` so they can glide out before they unmount.",
  "`font-variant-numeric: tabular-nums` makes every digit the same width, so `1ch` is the exact width of a strip and the number never jitters while rolling. A visually hidden `aria-live` copy carries the real text for screen readers.",
]
