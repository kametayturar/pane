import * as React from "react"
import { Bookmark, Compass, House, Search, UserRound } from "lucide-react"

import { GlassTabBar } from "@/components/ui/glass-tabbar"
import { FeedCard } from "./_glass-scenes"

export const notes = [
  "The bar is three layers: a glass material (`backdrop-filter: blur(18px) saturate(1.8) brightness(1.04)` plus stacked inset box-shadows for the rim light), a lens that moves, and the tab buttons on top. The lens is a sibling of the material, not a child, because a child of a backdrop-filter element can only see what is inside it.",
  "In Chromium the lens and bar rim also get real refraction: a canvas paints a displacement map (neutral grey in the middle, an outward vector along the rim), an SVG filter feeds it to `feDisplacementMap` three times at slightly different scales (one per colour channel, so the edge disperses), and `backdrop-filter: url(#filter)` bends the feed behind it. Safari and Firefox fall back to blur + saturate.",
  "One requestAnimationFrame loop owns three springs: the lens position (in tab units), the compact progress and the lens 'lift'. The lift is driven by the lens speed, so a quick move stretches and brightens the lens into clear glass; every frame writes CSS custom properties (--p, --lift, --gtb-c) that the icons, labels and bar size read through `calc()`, so React never re-renders during motion.",
  "Each tab gets `--p`, how close the lens is to it (0 to 1). The label colour is `color-mix()` between the accent and the ink by that amount and the icon scales with it, so the accent glides with the lens instead of switching at the end.",
  "Compacting listens to the scroll container with a passive listener and an accumulator that resets when the direction changes, so it shrinks after a deliberate scroll down and grows back on a short scroll up. Dragging uses pointer capture; on release the nearest tab is chosen.",
]

const TITLES: Record<string, string> = { home: "Today", explore: "Explore", saved: "Saved", profile: "Profile", search: "Search" }
const POSTS = [
  ["Night market, a short guide", "Lila Okafor · 6 min"],
  ["Six tram rides worth the queue", "Marco Reis · 4 min"],
  ["A cove for the low tide", "Ines Duarte · 9 min"],
  ["Rooftops before sunset", "Tomas Aalto · 3 min"],
  ["Slow crossings by bridge", "Yara Haddad · 7 min"],
  ["The quiet end of the coast", "Pia Lindqvist · 5 min"],
  ["Harbor lights in winter", "Owen Marsh · 8 min"],
]

export default function Demo() {
  const [tab, setTab] = React.useState("home")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const pausedUntil = React.useRef(0)

  // The feed scrolls by itself so the glass always has something moving under it; touching it takes over for a while.
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let dir = 1
    let pos = el.scrollTop
    let last = performance.now()
    let hold = 3200 // rest at the top first so the bar shows its labels
    const tick = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const reach = Math.min(el.scrollHeight - el.clientHeight, 520)
      if (now < pausedUntil.current) {
        pos = el.scrollTop
        hold = 1200
      } else if (hold > 0) hold -= dt
      else {
        pos += dir * dt * 0.1
        if (pos >= reach) { pos = reach; dir = -1; hold = 1400 }
        else if (pos <= 0) { pos = 0; dir = 1; hold = 3200 }
        el.scrollTop = pos
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const stop = () => (pausedUntil.current = performance.now() + 5000)
    el.addEventListener("wheel", stop, { passive: true })
    el.addEventListener("pointerdown", stop, { passive: true })
    el.addEventListener("touchmove", stop, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("wheel", stop)
      el.removeEventListener("pointerdown", stop)
      el.removeEventListener("touchmove", stop)
    }
  }, [])

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative h-[620px] w-full max-w-[390px] overflow-hidden rounded-[40px] bg-neutral-100 shadow-[0_20px_48px_rgb(0_0_0/.14),0_0_0_1px_rgb(0_0_0/.06)] dark:bg-neutral-950">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-[120px] pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-4 px-1">
            <div className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">Thursday</div>
            <div className="text-[28px] font-semibold leading-9 tracking-tight text-neutral-900 dark:text-neutral-50">{TITLES[tab]}</div>
          </div>
          <div className="flex flex-col gap-4">
            {POSTS.map(([title, meta], i) => (
              <FeedCard key={title} i={i + (tab === "explore" ? 2 : tab === "saved" ? 4 : 0)} title={title} meta={meta} />
            ))}
          </div>
        </div>
        <GlassTabBar
          value={tab}
          onValueChange={setTab}
          scrollRef={scrollRef}
          items={[
            { value: "home", label: "Home", icon: <House /> },
            { value: "explore", label: "Explore", icon: <Compass /> },
            { value: "saved", label: "Saved", icon: <Bookmark />, badge: 3 },
            { value: "profile", label: "Profile", icon: <UserRound /> },
          ]}
          action={{ value: "search", label: "Search", icon: <Search /> }}
        />
      </div>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">The feed scrolls itself. Scroll it to compact the bar; press and drag the lens.</p>
    </div>
  )
}
