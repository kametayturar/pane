import * as React from "react"

import { SlotText } from "@/components/ui/slot-text"

export const notes = [
  "Every character is its own reel: a clipped window (overflow: hidden plus a short vertical mask-image) around a strip of cells that one `transform: translate3d(0, Ny, 0)` slides. The strip is built in em units, so the effect scales with the font size of whatever text it sits in.",
  "On a change the old character and the new one are joined by a path of cells: digits count through the wheel in the direction the number moved (down when it falls), letters walk the alphabet, anything else is a two-cell roll. `spins` adds a full extra turn before the landing.",
  "Each reel runs its own requestAnimationFrame loop with an ease-out-quart curve (fast start, long soft landing that never passes the target), and reel k lasts duration + k × stagger, so they stop left to right. Blur follows the current speed – the derivative of the curve – so fast spins smear and landings are sharp.",
  "Reels are matched by position, not by content: leading symbols like $ or + keep their own reel and the rest is matched from the end, so 999 → 1,000 only spins digits. Reel widths follow the new character on a critically damped spring, and added or removed reels grow in or collapse.",
  "If the value changes mid-spin the reel restarts from the cell that is on screen and keeps its fractional offset, so nothing jumps. The strip's cells are written straight to the DOM, so React only re-renders when the value changes.",
]

const PERIODS = {
  Today: { revenue: 4812, delta: 3.2, runs: 128, who: "Support triage" },
  Week: { revenue: 31904, delta: 12.4, runs: 912, who: "Research digest" },
  Month: { revenue: 128450, delta: -2.7, runs: 3860, who: "Billing reconciler" },
  Year: { revenue: 1604290, delta: 41.8, runs: 47210, who: "Onboarding concierge" },
} as const

type Period = keyof typeof PERIODS

const seg =
  "relative h-9 rounded-[14px] px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/30 dark:focus-visible:ring-white/40"

export default function Demo() {
  const [period, setPeriod] = React.useState<Period>("Week")
  const [live, setLive] = React.useState(true)
  const [seats, setSeats] = React.useState(12)
  const p = PERIODS[period]
  const price = seats * 18

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5 px-4 py-6">
      <div className="grid gap-5 rounded-[28px] border border-black/[.07] bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/.04)] dark:border-white/10 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-neutral-700 dark:bg-neutral-300" />
            Agent revenue
          </span>
          <SlotText
            value={p.delta}
            format={(v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`}
            className={`font-medium ${p.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
          />
        </div>
        <div className="text-[52px] font-normal leading-none tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
          <SlotText value={p.revenue} format={(v) => `$${v.toLocaleString("en-US")}`} announce />
        </div>
        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>
            <SlotText value={p.runs} /> runs
          </span>
          <span className="text-neutral-900 dark:text-neutral-100">
            <SlotText value={p.who} duration={0.8} stagger={0.03} />
          </span>
        </div>
        <div
          role="group"
          aria-label="Period"
          className="flex gap-0.5 rounded-[18px] border border-black/[.07] bg-neutral-50 p-[3px] dark:border-white/10 dark:bg-white/5"
        >
          {(Object.keys(PERIODS) as Period[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={period === k}
              onClick={() => setPeriod(k)}
              className={`${seg} flex-1 ${
                period === k
                  ? "bg-white text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/.07),0_1px_2px_rgb(0_0_0/.04)] dark:bg-neutral-800 dark:text-white dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)]"
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[28px] border border-black/[.07] bg-white px-6 py-5 dark:border-white/10 dark:bg-neutral-900">
        <div className="text-[28px] font-medium leading-none tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
          <SlotText value={live ? "Live now" : "Soon"} spins={2} />
        </div>
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          className="h-9 rounded-full border border-black/10 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/[.04] active:scale-[.98] dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10"
        >
          Flip status
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[28px] border border-black/[.07] bg-white px-6 py-5 dark:border-white/10 dark:bg-neutral-900">
        <div>
          <div className="text-[13px] text-neutral-500 dark:text-neutral-400">{seats} seats on Team</div>
          <div className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
            <SlotText value={price} format={(v) => `$${v.toLocaleString("en-US")}`} spins={0} duration={0.6} />
            <span className="ml-1 text-sm font-normal text-neutral-400">/mo</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Fewer seats" onClick={() => setSeats((n) => Math.max(1, n - 11))} className="grid size-9 place-items-center rounded-full border border-black/10 text-lg text-neutral-700 hover:bg-black/[.04] active:scale-95 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10">
            −
          </button>
          <button type="button" aria-label="More seats" onClick={() => setSeats((n) => n + 23)} className="grid size-9 place-items-center rounded-full border border-black/10 text-lg text-neutral-700 hover:bg-black/[.04] active:scale-95 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10">
            +
          </button>
        </div>
      </div>
    </div>
  )
}
