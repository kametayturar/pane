import * as React from "react"

import { Backdrop, type BackdropVariant, type StudioProps } from "@/components/motion/backdrop"
import { cn } from "@/lib/utils"

export type DemoComponent = React.LazyExoticComponent<React.ComponentType<StudioProps>>

/**
 * A live demo scaled to fit its box: laid out at `width` px, then scaled down by a ResizeObserver,
 * so a big tile shows real detail and a small one a thumbnail. Mounts only while on screen.
 */
export function LivePreview({
  Demo,
  width,
  align,
  variant = "dots",
  accent,
  replay,
  hovered,
  className,
  bare,
}: {
  Demo: DemoComponent
  width: number
  align: "center" | "top"
  variant?: BackdropVariant
  accent?: string
  /** Replay a demo that plays once (most components) every N ms while on screen. */
  replay?: number
  /** Restart right away when the card is hovered. */
  hovered?: boolean
  className?: string
  /** Skip the Backdrop: the demo sits on whatever is behind the preview. */
  bare?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)
  const [visible, setVisible] = React.useState(false)
  const [run, setRun] = React.useState(0)
  const [fading, setFading] = React.useState(false)
  // Fade out, remount the demo so it plays from the start, fade back in.
  const restart = React.useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      setRun((r) => r + 1)
      setFading(false)
    }, 260)
  }, [])
  React.useEffect(() => {
    if (!replay || !visible) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let timer = 0
    const tick = (delay: number) => {
      timer = window.setTimeout(() => {
        if (!document.hidden) restart()
        tick(replay)
      }, delay)
    }
    tick(replay * (1 + Math.random() * 0.4)) // let the first run finish; stagger so cards don't restart together
    return () => window.clearTimeout(timer)
  }, [replay, visible, restart])
  const wasHovered = React.useRef(false)
  React.useEffect(() => {
    if (hovered && !wasHovered.current && replay && visible) restart()
    wasHovered.current = !!hovered
  }, [hovered, replay, visible, restart])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "160px" })
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    io.observe(el)
    ro.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
    }
  }, [])
  // Never narrower than `width`; a roomier box lays the demo out at the box's own width instead of leaving a gap.
  const layoutW = box ? Math.max(width, box.w) : width
  const scale = box ? box.w / layoutW : 0
  const stage = (
    <div className={cn("flex w-full justify-center px-8", align === "top" ? "pt-8" : "py-6")}>
      <React.Suspense fallback={null}>
        <Demo key={run} accent={accent} />
      </React.Suspense>
    </div>
  )
  return (
    <div ref={ref} className={cn("pointer-events-none relative overflow-hidden", className)} aria-hidden inert>
      {visible && box && scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left transition-opacity duration-300 ease-out"
          style={{ width: layoutW, height: box.h / scale, transform: `scale(${scale})`, opacity: fading ? 0 : 1 }}
        >
          {bare ? (
            <div className="grid h-full w-full" style={{ alignItems: align === "top" ? "start" : "center" }}>
              {stage}
            </div>
          ) : (
            <Backdrop variant={variant} accent={accent} minHeight={0} style={{ height: "100%", alignItems: align === "top" ? "start" : "center" }}>
              {stage}
            </Backdrop>
          )}
        </div>
      )}
    </div>
  )
}
