// Small still previews drawn from a spec's own draw() or svg(), only while on screen.
import * as React from "react"
import { LayoutPanelTop } from "lucide-react"

import { cn } from "@/lib/utils"
import { svgMarkup } from "./export"
import { posterTime } from "./registry"
import { SIZES, type SizeId, type StudioSpec, type Values } from "./schema"

export function Thumb({ spec, values, size = "1:1", edge = 168, className }: { spec: StudioSpec; values: Values; size?: SizeId; edge?: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const cv = React.useRef<HTMLCanvasElement>(null)
  const [seen, setSeen] = React.useState(false)
  const [svg, setSvg] = React.useState("")
  const [failed, setFailed] = React.useState(false)
  const dims = SIZES[size]
  const k = edge / Math.max(dims.w, dims.h)
  const tw = Math.round(dims.w * k)
  const th = Math.round(dims.h * k)
  const key = JSON.stringify(values)
  // Text inside a drawn thumbnail must not reach the button's accessible name or the tab order.
  React.useEffect(() => ref.current?.setAttribute("inert", ""), [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (setSeen(true), io.disconnect()), { rootMargin: "120px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    if (!seen) return
    const id = window.setTimeout(() => {
      try {
        const t = posterTime(spec)
        if (spec.draw && cv.current) {
          const ctx = cv.current.getContext("2d")!
          ctx.setTransform(tw / dims.w, 0, 0, th / dims.h, 0, 0)
          ctx.clearRect(0, 0, dims.w, dims.h)
          spec.draw(ctx, dims.w, dims.h, t, values)
        } else if (spec.svg) {
          setSvg(svgMarkup({ spec, values, w: dims.w, h: dims.h, t }, t))
        }
        setFailed(false)
      } catch {
        setFailed(true)
      }
    }, 16)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, spec, key, size])

  const drawn = !!spec.draw
  const vector = !drawn && !!spec.svg
  return (
    <div ref={ref} aria-hidden="true" className={cn("relative overflow-hidden bg-black/[0.04] dark:bg-white/[0.06]", className)}>
      {drawn && !failed && <canvas ref={cv} width={tw} height={th} className="absolute inset-0 size-full object-cover" />}
      {vector && !failed && <div className="absolute inset-0 [&>svg]:size-full [&>svg]:object-cover" dangerouslySetInnerHTML={{ __html: svg }} />}
      {(failed || (!drawn && !vector)) && (
        <div className="absolute inset-0 grid place-items-center text-neutral-400">
          <LayoutPanelTop className="size-[38%] stroke-[1.25]" />
        </div>
      )}
    </div>
  )
}
