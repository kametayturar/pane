// Landing Builder: the live preview. The page renders into a same-origin iframe through a React portal, so the light /
// dark switch, the three looks (html[data-style]) and the accent apply to the preview only, and every section's sticky
// nav, scroll listener and media query sees the frame (an inner scroller) rather than the builder.
import * as React from "react"
import { createPortal } from "react-dom"

import { contrast, darkAccent, isHex, mix, onAccent } from "./color"
import { resolveProps, type LandingDoc, type Registry } from "./doc"

export type Look = "classic" | "mono" | "glass"
export type Scheme = "light" | "dark"

const SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"></body></html>`

/** Mirror the builder's stylesheets (Tailwind, site CSS, fonts and the sections' hoisted <style> tags) into the frame. */
function useMirroredStyles(target: Document | null) {
  React.useEffect(() => {
    if (!target) return
    const clones = new Map<Element, Element>()
    const sync = () => {
      const live = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      const keep = new Set(live)
      for (const [src, c] of clones) if (!keep.has(src)) (c.remove(), clones.delete(src))
      for (const src of live) {
        let c = clones.get(src)
        if (!c) {
          c = src.cloneNode(true) as Element
          clones.set(src, c)
        } else if (src.tagName === "STYLE" && c.textContent !== src.textContent) c.textContent = src.textContent
        target.head.appendChild(c) // keeps the frame's order the same as the builder's
      }
    }
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => {
      mo.disconnect()
      for (const c of clones.values()) c.remove()
    }
  }, [target])
}

/** CSS for the frame: the accent's on-colour on the sections that fill buttons with it (validated hex only). */
function accentCss(reg: Registry, accent: string, scheme: Scheme): string {
  const a = isHex(accent) ? accent : "#0060e2"
  const value = scheme === "dark" ? darkAccent(a) : a
  const on = onAccent(value)
  const rules: string[] = []
  const vars = new Set<string>()
  for (const def of reg.values()) for (const v of def.onAccent ?? []) vars.add(v)
  for (const v of vars) {
    if (!/^--[a-z0-9-]+$/.test(v)) continue
    rules.push(`html:not([data-style="mono"]) .${v.slice(2).split("-")[0]} { ${v}: ${on} }`)
  }
  // The closing band draws white text on a darkened accent; flip it when the accent is too light for white.
  const band = mix(value, "#000000", 0.16)
  if (contrast(band, "#ffffff") < 3) {
    rules.push(
      `html:not([data-style="mono"]) .lcta:not([data-tone="soft"]):not([data-tone="ink"]) { --lcta-p1: #0a0a0a; --lcta-p2: rgb(10 10 10 / .86); --lcta-p3: rgb(10 10 10 / .74); --lcta-btn-bg: #0a0a0a; --lcta-btn-fg: #fff; --lcta-out: rgb(10 10 10 / .4); --lcta-focus: #0a0a0a; --lcta-dot: rgb(10 10 10 / .16) }`,
    )
  }
  // html:root ties with the Glass look's html[data-style] rule and wins by coming later in the frame.
  return `html:root { --pane-accent: ${value}; --pane-on-accent: ${on} }\n${rules.join("\n")}\nhtml, body { height: 100% }`
}

class SectionBoundary extends React.Component<{ name: string; children: React.ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    if (this.state.error)
      return <div style={{ padding: 24, font: "13px/20px Inter, system-ui, sans-serif", color: "rgb(0 0 0 / .5)" }}>{this.props.name} could not render with this content.</div>
    return this.props.children
  }
}

type Ring = { top: number; height: number } | null

function FrameContent({
  doc,
  reg,
  selectedId,
  onSelect,
  scrollTo,
  scale,
  scheme,
  frameDoc,
}: {
  doc: LandingDoc
  reg: Registry
  selectedId: string | null
  onSelect: (id: string) => void
  scrollTo: { id: string; n: number } | null
  scale: number
  scheme: Scheme
  frameDoc: Document
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  const [hover, setHover] = React.useState<string | null>(null)
  const [rings, setRings] = React.useState<{ sel: Ring; hov: Ring }>({ sel: null, hov: null })
  const shown = doc.sections.filter((s) => !s.hidden && reg.has(s.slug))

  const rectOf = React.useCallback((id: string | null): Ring => {
    if (!id || !inner.current) return null
    const slot = inner.current.querySelector<HTMLElement>(`[data-sid="${CSS.escape(id)}"]`)
    const el = slot ? Array.from(slot.children).find((c) => c.tagName !== "STYLE" && c.tagName !== "LINK") as HTMLElement | undefined : undefined
    if (!el) return null
    return { top: el.offsetTop, height: el.offsetHeight }
  }, [])

  const measure = React.useCallback(() => {
    const next = { sel: rectOf(selectedId), hov: hover && hover !== selectedId ? rectOf(hover) : null }
    const same = (a: Ring, b: Ring) => a === b || (!!a && !!b && a.top === b.top && a.height === b.height)
    setRings((r) => (same(r.sel, next.sel) && same(r.hov, next.hov) ? r : next))
  }, [rectOf, selectedId, hover])

  React.useLayoutEffect(() => {
    measure()
  })

  React.useEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  // Scroll the frame to a section picked in the outline.
  React.useEffect(() => {
    if (!scrollTo) return
    const r = rectOf(scrollTo.id)
    if (!r || !scroller.current) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    scroller.current.scrollTo({ top: Math.max(0, r.top - 8), behavior: reduce ? "auto" : "smooth" })
  }, [scrollTo, rectOf])

  const w = Math.max(1.5, 2 / scale)
  const ringColor = scheme === "dark" ? "rgb(255 255 255 / .9)" : "rgb(10 10 10 / .85)"
  const hoverColor = scheme === "dark" ? "rgb(255 255 255 / .35)" : "rgb(10 10 10 / .25)"
  const tag = 12 / scale

  return (
    <div ref={scroller} style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }} data-lb-scroller="">
      <div ref={inner} style={{ position: "relative" }} onPointerLeave={() => setHover(null)}>
        {shown.map((s) => {
          const def = reg.get(s.slug)!
          const props = resolveProps(def, s.content, doc.brand)
          return (
            <div
              key={s.id}
              data-sid={s.id}
              style={{ display: "contents" }}
              onPointerOver={() => hover !== s.id && setHover(s.id)}
              onClickCapture={(e) => {
                // Links in the preview select their section instead of navigating the frame.
                if ((e.target as Element).closest?.("a")) e.preventDefault()
                onSelect(s.id)
              }}
              onSubmitCapture={(e) => e.preventDefault()}
            >
              <SectionBoundary name={def.name}>
                <React.Suspense fallback={<div style={{ height: 240 }} />}>
                  <def.Component {...props} />
                </React.Suspense>
              </SectionBoundary>
            </div>
          )
        })}
        {!shown.length && (
          <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", font: `${14}px/22px Inter, system-ui, sans-serif`, color: scheme === "dark" ? "rgb(255 255 255 / .5)" : "rgb(0 0 0 / .45)" }}>
            Add a section to start the page.
          </div>
        )}
        {rings.hov && <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: rings.hov.top, height: rings.hov.height, boxShadow: `inset 0 0 0 ${w}px ${hoverColor}`, pointerEvents: "none", zIndex: 60 }} />}
        {rings.sel && (
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: rings.sel.top, height: rings.sel.height, boxShadow: `inset 0 0 0 ${w}px ${ringColor}`, pointerEvents: "none", zIndex: 61 }}>
            <span
              style={{
                position: "absolute",
                top: w,
                left: w,
                padding: `${2 / scale}px ${7 / scale}px`,
                font: `500 ${tag}px/${tag * 1.5}px Inter, system-ui, sans-serif`,
                background: ringColor,
                color: scheme === "dark" ? "#0a0a0a" : "#fff",
                borderBottomRightRadius: 6 / scale,
              }}
            >
              {reg.get(doc.sections.find((s) => s.id === selectedId)?.slug ?? "")?.name}
            </span>
          </div>
        )}
      </div>
      <style>{accentCss(reg, doc.brand.accent, scheme)}</style>
      {/* keep the frame document's language and title tidy for assistive tech */}
      <FrameMeta frameDoc={frameDoc} title={`${doc.brand.name || "Landing page"} preview`} />
    </div>
  )
}

function FrameMeta({ frameDoc, title }: { frameDoc: Document; title: string }) {
  React.useEffect(() => {
    frameDoc.title = title
    frameDoc.documentElement.lang = "en"
  }, [frameDoc, title])
  return null
}

export const WIDTHS = { desktop: 1280, tablet: 820, phone: 390 } as const
export type WidthKey = keyof typeof WIDTHS

export function PreviewFrame({
  doc,
  reg,
  width,
  scheme,
  look,
  selectedId,
  onSelect,
  scrollTo,
  onScale,
}: {
  doc: LandingDoc
  reg: Registry
  width: WidthKey
  scheme: Scheme
  look: Look
  selectedId: string | null
  onSelect: (id: string) => void
  scrollTo: { id: string; n: number } | null
  onScale?: (s: number) => void
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [frameDoc, setFrameDoc] = React.useState<Document | null>(null)
  const frame = React.useRef<HTMLIFrameElement>(null)
  useMirroredStyles(frameDoc)

  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The frame's own theme and look.
  React.useEffect(() => {
    if (!frameDoc) return
    const html = frameDoc.documentElement
    html.classList.toggle("dark", scheme === "dark")
    html.style.colorScheme = scheme
    if (look === "classic") delete html.dataset.style
    else html.dataset.style = look
  }, [frameDoc, scheme, look])

  const W = WIDTHS[width]
  const gutter = 32
  const scale = size.w ? Math.min(1, (size.w - gutter) / W) : 0
  const frameH = scale ? (size.h - gutter) / scale : 0

  React.useEffect(() => {
    if (scale) onScale?.(scale)
  }, [scale, onScale])

  const onLoad = () => {
    const d = frame.current?.contentDocument
    if (d) setFrameDoc(d)
  }

  return (
    <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="absolute left-1/2 top-4 overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_12px_40px_-16px_rgb(0_0_0/0.25)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_12px_40px_-16px_rgb(0_0_0/0.8)]"
        style={{ width: W * scale, height: size.h - gutter, transform: "translateX(-50%)", visibility: scale ? "visible" : "hidden" }}
      >
        <iframe
          ref={frame}
          title="Landing page preview"
          srcDoc={SRC_DOC}
          onLoad={onLoad}
          style={{ width: W, height: frameH, border: 0, display: "block", transform: `scale(${scale})`, transformOrigin: "0 0", background: "transparent" }}
        />
      </div>
      {frameDoc &&
        createPortal(
          <FrameContent doc={doc} reg={reg} selectedId={selectedId} onSelect={onSelect} scrollTo={scrollTo} scale={scale || 1} scheme={scheme} frameDoc={frameDoc} />,
          frameDoc.body,
        )}
    </div>
  )
}
