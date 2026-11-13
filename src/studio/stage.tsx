// The artboard (laid out at the true export size, fit-scaled), the clock, and the transport.
import * as React from "react"
import { Pause, Play, Repeat, SkipBack } from "lucide-react"

import { cn } from "@/lib/utils"
import { svgMarkup } from "./export"
import { posterTime } from "./registry"
import type { StudioSpec, Values } from "./schema"
import { IconButton } from "./ui"

export type StageHandle = { dom: () => HTMLElement | null; time: () => number }

const reducedQuery = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(reducedQuery)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
export const useReducedMotion = () => React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false)

class Guard extends React.Component<{ children: React.ReactNode; resetKey: string }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : "This piece could not be drawn." }
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    return this.state.error ? <div className="grid size-full place-items-center p-8 text-center text-[14px] text-neutral-500">{this.state.error}</div> : this.props.children
  }
}

/* ------------------------------ surfaces ------------------------------ */

function DrawSurface({ spec, values, w, h, t, scale }: { spec: StudioSpec; values: Values; w: number; h: number; t: number; scale: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1)
  const k = Math.max(0.05, Math.min(scale * dpr, 4096 / Math.max(w, h)))
  const bw = Math.max(1, Math.round(w * k))
  const bh = Math.max(1, Math.round(h * k))
  const [err, setErr] = React.useState<string | null>(null)
  React.useLayoutEffect(() => {
    const c = ref.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    try {
      ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0)
      ctx.clearRect(0, 0, w, h)
      spec.draw!(ctx, w, h, t, values)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not draw this frame.")
    }
  }, [spec, values, w, h, t, bw, bh])
  return (
    <>
      <canvas ref={ref} width={bw} height={bh} className="absolute inset-0 block" style={{ width: w, height: h }} />
      {err && <div className="absolute inset-0 grid place-items-center p-8 text-center text-[14px] text-red-600 dark:text-red-400">{err}</div>}
    </>
  )
}

function SvgSurface({ spec, values, w, h, t }: { spec: StudioSpec; values: Values; w: number; h: number; t: number }) {
  const html = React.useMemo(() => svgMarkup({ spec, values, w, h, t }, t), [spec, values, w, h, t])
  return <div className="absolute inset-0" style={{ width: w, height: h }} dangerouslySetInnerHTML={{ __html: html }} />
}

const FIT_WIDTH = 1040

/**
 * Page-built pieces are laid out at their own natural width, then centred and scaled to fill the artboard.
 * The PNG is captured from this same wrapper, so the preview and the export share one layout.
 */
function DomSurface({ spec, values, w, h, accent, paused, t }: { spec: StudioSpec; values: Values; w: number; h: number; accent?: string; paused: boolean; t: number }) {
  const C = spec.component
  const inner = React.useRef<HTMLDivElement>(null)
  // Portrait and square artboards get a narrower layout, so the piece grows taller instead of floating small.
  const lw = Math.round(FIT_WIDTH * Math.min(1, Math.max(0.85, w / h / (16 / 9))))
  const [fit, setFit] = React.useState({ s: 1, ih: 0 })
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => {
      const ih = el.offsetHeight
      if (!ih) return
      const s = Math.min((w * 0.88) / lw, (h * 0.86) / ih)
      setFit((p) => (Math.abs(p.s - s) < 0.001 && p.ih === ih ? p : { s, ih }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h, lw, values])
  if (!C) return <div className="grid size-full place-items-center text-[14px] text-neutral-400">No preview for this piece.</div>
  const seed = typeof values.seed === "number" ? values.seed : undefined
  const speed = typeof values.speed === "number" ? values.speed : undefined
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ width: w, height: h }}>
      <div
        ref={inner}
        className="absolute left-0 top-0 origin-center"
        style={{ width: lw, left: (w - lw) / 2, top: (h - fit.ih) / 2, transform: `scale(${fit.s})`, visibility: fit.ih ? "visible" : "hidden" }}
      >
        <C values={values} seed={seed} speed={speed} paused={paused} accent={accent} size={{ w: lw, h: fit.ih || h }} time={spec.duration ? t : undefined} />
      </div>
    </div>
  )
}

/* -------------------------------- clock -------------------------------- */

function useClock(spec: StudioSpec, loop: boolean, reduced: boolean) {
  const duration = spec.duration ?? 0
  const [t, setT] = React.useState(() => posterTime(spec))
  const [playing, setPlaying] = React.useState(!reduced)
  const key = spec.id
  // Switching pieces starts again at the poster moment.
  const [seen, setSeen] = React.useState(key)
  if (seen !== key) {
    setSeen(key)
    setT(posterTime(spec))
  }
  React.useEffect(() => {
    if (!playing || !duration) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      setT((p) => {
        const n = p + dt
        if (n < duration) return n
        if (loop) return n % duration
        setPlaying(false)
        return duration
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration, loop])
  return { t, setT, playing, setPlaying, duration }
}

const fmt = (s: number) => `${s.toFixed(1)}s`

/* -------------------------------- stage -------------------------------- */

export function Stage({
  spec,
  values,
  w,
  h,
  accent,
  handleRef,
  status,
  compact,
}: {
  spec: StudioSpec
  values: Values
  w: number
  h: number
  accent?: string
  handleRef: React.RefObject<StageHandle | null>
  status?: React.ReactNode
  compact?: boolean
}) {
  const reduced = useReducedMotion()
  const [loop, setLoop] = React.useState(true)
  const clock = useClock(spec, loop, reduced)
  const { t, playing, duration, setPlaying } = clock
  const areaRef = React.useRef<HTMLDivElement>(null)
  const artRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })

  React.useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const tRef = React.useRef(t)
  tRef.current = t
  React.useEffect(() => {
    handleRef.current = { dom: () => artRef.current, time: () => tRef.current }
    return () => {
      handleRef.current = null
    }
  }, [handleRef])

  const pad = compact ? 24 : 56
  const scale = box.w ? Math.max(0.02, Math.min((box.w - pad) / w, (box.h - pad) / h, 1)) : 0.3

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return
      const el = e.target as HTMLElement | null
      if (el && (el.closest("input, textarea, select, button, [role=slider], [role=menu], [role=dialog]") || el.isContentEditable)) return
      e.preventDefault()
      setPlaying((p) => !p)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setPlaying])

  const surface = spec.draw ? (
    <DrawSurface spec={spec} values={values} w={w} h={h} t={t} scale={scale} />
  ) : spec.svg ? (
    <SvgSurface spec={spec} values={values} w={w} h={h} t={t} />
  ) : (
    <DomSurface spec={spec} values={values} w={w} h={h} accent={accent} paused={!playing} t={t} />
  )

  const label = `${spec.name}, ${w} by ${h} pixels`
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={areaRef} className="demo-stage relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 grid place-items-center">
          <div key={spec.id} className="st-enter relative" style={{ width: w * scale, height: h * scale }}>
            <div
              ref={artRef}
              role="img"
              aria-label={label}
              className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_24px_60px_-24px_rgb(0_0_0/0.35)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_24px_60px_-24px_rgb(0_0_0/0.7)]"
              style={{ width: w, height: h, transform: `scale(${scale})` }}
            >
              <Guard resetKey={spec.id}>{surface}</Guard>
            </div>
          </div>
        </div>
      </div>
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/[0.06] px-3 py-1.5 dark:border-white/[0.08]">
        <div className="flex items-center gap-0.5">
          <IconButton label={playing ? "Pause" : "Play"} onClick={() => clock.setPlaying(!playing)}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconButton>
          {duration > 0 && (
            <IconButton
              label="Back to start"
              onClick={() => {
                clock.setT(0)
              }}
            >
              <SkipBack className="size-4" />
            </IconButton>
          )}
        </div>
        {duration > 0 ? (
          <>
            <span className="w-[5.5rem] shrink-0 text-[12px] tabular-nums text-neutral-500">
              {fmt(t)} / {fmt(duration)}
            </span>
            <input
              aria-label="Scrub"
              type="range"
              className="st-range min-w-24 flex-1 text-neutral-900 dark:text-neutral-100"
              style={{ "--p": `${(t / duration) * 100}%` } as React.CSSProperties}
              min={0}
              max={duration}
              step={0.01}
              value={Math.min(t, duration)}
              onChange={(e) => {
                clock.setPlaying(false)
                clock.setT(Number(e.target.value))
              }}
            />
            <IconButton label={loop ? "Loop on" : "Loop off"} aria-pressed={loop} onClick={() => setLoop(!loop)} className={cn(loop && "bg-black/[0.05] text-neutral-900 dark:bg-white/[0.1] dark:text-white")}>
              <Repeat className="size-4" />
            </IconButton>
          </>
        ) : (
          <span className="flex-1 text-[12px] text-neutral-400">Plays on its own</span>
        )}
        <div className="ml-auto flex min-w-0 items-center gap-3 text-[12px] text-neutral-500" aria-live="polite">
          {status}
          <span className="shrink-0 tabular-nums text-neutral-400">
            {w} × {h}
          </span>
        </div>
      </div>
    </div>
  )
}
