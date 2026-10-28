import { MarketTerminal } from "@/components/blocks/market-terminal"

export default function Demo() {
  return (
    <div className="w-full max-w-[1080px] py-4">
      <MarketTerminal />
    </div>
  )
}

export const notes: string[] = [
  "The chart is one <canvas> sized by a ResizeObserver and scaled by devicePixelRatio (capped at 2): the backing store is css size × dpr and the context gets setTransform(dpr, 0, 0, dpr, 0, 0), so every coordinate in the draw code is plain CSS pixels. It redraws inside a requestAnimationFrame loop that only keeps running while the view, the price scale or the live price is still easing – React never re-renders per frame.",
  "Zoom, pan and the price scale ease with an exponential approach (value += (target − value) × (1 − e^(−dt/τ))) instead of a fixed tween, so a gesture can be reversed mid-way and never overshoots. A drag flick keeps a velocity that decays with the same exponential, and wheel/pinch zoom keeps the candle under the cursor fixed by solving for the new start index.",
  "Ticks live outside React in a tiny external store: a class holding every quote with per-ticker subscribers, read through useSyncExternalStore. Only the header price, one watchlist row and the ticket subscribe to their ticker, so a tick re-renders a few small components; the chart gets the same event and just moves its last candle.",
  "The header price is an odometer: each digit is a column of 0–9 inside an overflow: hidden box, and a CSS transition on translateY(calc(var(--d) * -1.1em)) slides it to its value. Row flashes are a single element animated with the Web Animations API (el.animate opacity 1 → 0), so a tick never triggers a React state change.",
  "Real data is optional: pass `source(symbol, range)` returning candles and the component debounces the call, caches by symbol|range, and falls back to the seeded generator (mulberry32 random walk per ticker) when it returns null or throws. Canvas colors come from CSS custom properties read with getComputedStyle, so light/dark themes recolor the chart without rebuilding it.",
]
