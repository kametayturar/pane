"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ActionMorphComposer = {
  /** Heading of the composer. */
  title: string
  placeholder: string
  /** A textarea instead of a single-line field (submit with Cmd/Ctrl + Enter). */
  multiline?: boolean
  /** A row of options under the field, e.g. a due date. */
  choices?: { label: string; options: string[] }
  submitLabel: string
  /** Announced and shown on the button after a successful submit. */
  successLabel: string
  /** Shown when the field is empty on submit. */
  emptyHint?: string
}

export type ActionMorphAction = {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  /** Single letter that opens this action while the menu is open. */
  shortcut?: string
  composer: ActionMorphComposer
}

export type ActionMorphSubmission = {
  action: ActionMorphAction
  text: string
  choice?: string
}

export type ActionMorphProps = {
  actions: ActionMorphAction[]
  /** Accessible name of the button and the title of the menu. */
  label?: string
  /** Return a promise to hold the sending state. A rejection keeps the composer open with the draft and an error. */
  onSubmit?: (submission: ActionMorphSubmission) => void | Promise<unknown>
  /** Which bottom corner the button sits in. The surface grows away from it. */
  corner?: "end" | "start"
  /** Milliseconds the check stays before the button returns to its plus. */
  resetAfter?: number
  /** Extra class on the root, for example to position it fixed. */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.am {
  --am-ink: #000; --am-surface: #fff; --am-accent: #0060e2; --am-ok: #1f9d55;
  --am-t1: color-mix(in oklab, var(--am-ink) 88%, transparent);
  --am-t2: color-mix(in oklab, var(--am-ink) 61%, transparent);
  --am-t3: color-mix(in oklab, var(--am-ink) 45%, transparent);
  --am-t4: color-mix(in oklab, var(--am-ink) 27%, transparent);
  --am-fill: color-mix(in oklab, var(--am-ink) 5%, transparent);
  --am-line: color-mix(in oklab, var(--am-ink) 7%, transparent);
  --am-btn: oklch(.15 0 0); --am-btn-fg: #fff;
  --am-shadow: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045), 0 0 0 .5px rgb(0 0 0 / .05);
  --am-ease: cubic-bezier(.22, 1, .36, 1);
  width: 56px; height: 56px; flex: none;
  font-family: var(--am-font, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif); font-size: 14px; line-height: 20px; color: var(--am-t1);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .am {
  --am-ink: #fff; --am-surface: #1c1c1e; --am-accent: #4d8dff; --am-ok: #34c26e;
  --am-t1: color-mix(in oklab, var(--am-ink) 90%, transparent);
  --am-t2: color-mix(in oklab, var(--am-ink) 62%, transparent);
  --am-t3: color-mix(in oklab, var(--am-ink) 46%, transparent);
  --am-t4: color-mix(in oklab, var(--am-ink) 28%, transparent);
  --am-fill: color-mix(in oklab, var(--am-ink) 8%, transparent);
  --am-line: color-mix(in oklab, var(--am-ink) 8%, transparent);
  --am-btn: #f2f2f4; --am-btn-fg: #111;
  --am-shadow: 0 20px 48px 0 rgb(0 0 0 / .5), 0 3px 10px 0 rgb(0 0 0 / .3), 0 0 0 .5px rgb(255 255 255 / .1);
}
@layer base { .am { position: relative; display: block } }
.am *, .am *::before, .am *::after { box-sizing: border-box }
:where(.am) :is(button, input, textarea) { font: inherit; color: inherit; margin: 0 }
:where(.am) button { background: none; border: 0; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation }
.am :focus-visible { outline: 2px solid color-mix(in oklab, var(--am-accent) 60%, transparent); outline-offset: 1px }
.am-shape {
  position: absolute; bottom: 0; right: 0; overflow: hidden; contain: layout paint; z-index: 2;
  box-shadow: var(--am-shadow); transition: transform .2s var(--am-ease); transform-origin: 100% 100%;
}
.am[data-corner="start"] .am-shape { right: auto; left: 0; transform-origin: 0 100% }
.am-bg { position: absolute; inset: 0; background: var(--am-btn); transition: background-color .35s var(--am-ease); border-radius: inherit }
.am-surf { position: absolute; inset: 0; background: var(--am-surface); opacity: var(--am-open, 0); border-radius: inherit }
.am[data-success="true"] .am-bg { background: var(--am-ok) }
.am-shape:has(.am-btn:active) { transform: scale(.94) }
.am-btn {
  position: absolute; bottom: 0; right: 0; width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center;
  color: var(--am-btn-fg); transition: opacity .2s var(--am-ease), filter .2s var(--am-ease);
}
.am[data-corner="start"] .am-btn { right: auto; left: 0 }
.am[data-view="menu"] .am-btn, .am[data-view="compose"] .am-btn { opacity: 0; filter: blur(3px); pointer-events: none }
.am-ico { position: absolute; width: 24px; height: 24px; transition: transform .45s var(--am-ease), opacity .25s var(--am-ease), filter .25s var(--am-ease) }
.am[data-success="true"] .am-plus { opacity: 0; transform: rotate(90deg) scale(.6); filter: blur(2px) }
.am-check { opacity: 0; transform: scale(.7) }
.am[data-success="true"] .am-check { opacity: 1; transform: none }
.am-check path { stroke-dasharray: 24; stroke-dashoffset: 24 }
.am[data-success="true"] .am-check path { animation: am-draw .42s .12s var(--am-ease) forwards }
@keyframes am-draw { to { stroke-dashoffset: 0 } }
@media (hover: hover) and (pointer: fine) { .am[data-view="button"]:not([data-success="true"]) .am-btn:hover .am-plus { transform: rotate(90deg) } }
.am-face { position: absolute; top: 0; left: 0; display: block; padding: 6px; animation-fill-mode: backwards }
.am-face[data-kind="pop"] { animation: am-pop .34s var(--am-ease) }
.am-face[data-kind="r"] { animation: am-in-r .4s var(--am-ease) }
.am-face[data-kind="l"] { animation: am-in-l .4s var(--am-ease) }
.am-face[data-leaving="l"] { animation: am-out-l .24s var(--am-ease) forwards; pointer-events: none }
.am-face[data-leaving="r"] { animation: am-out-r .24s var(--am-ease) forwards; pointer-events: none }
.am-face[data-leaving="fold"] { animation: am-fold .18s ease-out forwards; pointer-events: none }
@keyframes am-pop { from { opacity: 0; transform: scale(.96); filter: blur(3px) } }
@keyframes am-in-r { from { opacity: 0; transform: translateX(28px); filter: blur(3px) } }
@keyframes am-in-l { from { opacity: 0; transform: translateX(-28px); filter: blur(3px) } }
@keyframes am-out-l { to { opacity: 0; transform: translateX(-28px); filter: blur(3px) } }
@keyframes am-out-r { to { opacity: 0; transform: translateX(28px); filter: blur(3px) } }
@keyframes am-fold { to { opacity: 0; filter: blur(3px) } }
.am-menu { width: min(16rem, calc(100vw - 2rem)) }
.am-compose { width: min(20rem, calc(100vw - 2rem)) }
.am-head { display: flex; align-items: center; gap: 4px; height: 36px }
.am-title { flex: 1; min-width: 0; margin: 0; padding-left: 10px; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--am-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.am-compose .am-title { padding-left: 2px }
.am-iconbtn { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--am-t2); flex: none; transition: background-color .15s, color .15s }
.am-iconbtn svg { width: 16px; height: 16px }
@media (hover: hover) and (pointer: fine) { .am-iconbtn:hover { background: var(--am-fill); color: var(--am-t1) } }
.am-list { position: relative; display: flex; flex-direction: column; gap: 2px; margin-top: 2px }
.am-hl { position: absolute; left: 0; right: 0; top: 0; height: 0; border-radius: 16px; background: var(--am-fill); opacity: 0; pointer-events: none; transition: transform .28s var(--am-ease), height .28s var(--am-ease), opacity .18s }
.am-item { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border-radius: 16px; text-align: left; animation: am-row .36s var(--am-ease) backwards; animation-delay: calc(60ms + var(--i, 0) * 36ms) }
@keyframes am-row { from { opacity: 0; transform: translateY(6px); filter: blur(2px) } }
.am-tile { width: 32px; height: 32px; flex: none; border-radius: 10px; display: grid; place-items: center; color: var(--am-t1); background: var(--am-fill) }
.am-tile svg { width: 16px; height: 16px }
.am-lines { flex: 1; min-width: 0; display: flex; flex-direction: column }
.am-lab { font-size: 14px; font-weight: 500; line-height: 18px; color: var(--am-t1) }
.am-desc { font-size: 12px; line-height: 16px; color: var(--am-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.am-kbd { flex: none; width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--am-t3); box-shadow: inset 0 0 0 1px var(--am-line) }
.am-form { display: flex; flex-direction: column; gap: 12px; margin: 0 }
.am-form[data-shake="0"] .am-field { animation: am-sh0 .4s var(--am-ease) }
.am-form[data-shake="1"] .am-field { animation: am-sh1 .4s var(--am-ease) }
@keyframes am-sh0 { 0%, 100% { transform: none } 20% { transform: translateX(-6px) } 45% { transform: translateX(5px) } 70% { transform: translateX(-3px) } 88% { transform: translateX(2px) } }
@keyframes am-sh1 { 0%, 100% { transform: none } 20% { transform: translateX(-6px) } 45% { transform: translateX(5px) } 70% { transform: translateX(-3px) } 88% { transform: translateX(2px) } }
.am-field { display: block; width: 100%; border: 0; outline: 0; resize: none; background: var(--am-fill); border-radius: 16px; padding: 10px 14px; font-size: 14px; line-height: 22px; color: var(--am-t1); box-shadow: inset 0 0 0 1px transparent; transition: box-shadow .2s, background-color .2s }
textarea.am-field { min-height: 96px }
.am-field::placeholder { color: var(--am-t3) }
.am-field:focus-visible { outline: 0; box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--am-accent) 55%, transparent); background: color-mix(in oklab, var(--am-surface) 70%, var(--am-fill)) }
.am-field[aria-invalid="true"] { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, #e5484d 60%, transparent) }
.am-msg { margin: -6px 0 -2px; padding: 0 6px; font-size: 12px; line-height: 16px; color: #d93036 }
:is(.dark, [data-theme="dark"]) .am-msg { color: #ff6b6f }
.am-choices { display: flex; flex-direction: column; gap: 6px; padding: 0 2px }
.am-clabel { font-size: 12px; line-height: 16px; color: var(--am-t3); padding-left: 2px }
.am-seg { display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--am-fill) }
.am-seg button { flex: 1; height: 28px; border-radius: 999px; font-size: 13px; line-height: 20px; color: var(--am-t2); white-space: nowrap; transition: background-color .2s var(--am-ease), color .2s, box-shadow .2s }
.am-seg button[aria-checked="true"] { background: var(--am-surface); color: var(--am-t1); font-weight: 500; box-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .1) }
:is(.dark, [data-theme="dark"]) .am-seg button[aria-checked="true"] { background: color-mix(in oklab, var(--am-surface) 70%, #fff); box-shadow: 0 0 0 .5px rgb(255 255 255 / .1) }
.am-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-left: 4px }
.am-hint { flex: 1; min-width: 0; font-size: 12px; color: var(--am-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.am-submit { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 999px; background: var(--am-btn); color: var(--am-btn-fg); font-size: 14px; font-weight: 500; transition: transform .15s var(--am-ease), opacity .2s }
.am-submit:active { transform: scale(.96) }
.am-submit[aria-disabled="true"] { opacity: .7 }
.am-submit svg { width: 14px; height: 14px; opacity: .7 }
.am-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid color-mix(in oklab, var(--am-btn-fg) 30%, transparent); border-top-color: var(--am-btn-fg); animation: am-rot .7s linear infinite }
@keyframes am-rot { to { transform: rotate(360deg) } }
.am-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
@media (prefers-reduced-motion: reduce) {
  .am *, .am *::before, .am *::after { animation-duration: .01ms !important; animation-delay: 0s !important; transition-duration: .01ms !important }
  .am-shape:has(.am-btn:active) { transform: none }
  .am-spin { animation: am-rot 1.6s linear infinite !important; animation-duration: 1.6s !important }
  .am-face[data-kind], .am-item { animation: am-fade .15s linear backwards !important; animation-duration: .15s !important }
  .am-face[data-leaving] { animation: am-fade-out .12s linear forwards !important; animation-duration: .12s !important }
}
@keyframes am-fade { from { opacity: 0 } }
@keyframes am-fade-out { to { opacity: 0 } }
`

/* -------------------------------------------------------------------------- */
/*                                   Springs                                  */
/* -------------------------------------------------------------------------- */

type Spr = { x: number; v: number; to: number; k: number; c: number }
const mk = (x: number): Spr => ({ x, v: 0, to: x, k: 300, c: 30 })
function tune(s: Spr, k: number, zeta: number) {
  s.k = k
  s.c = 2 * zeta * Math.sqrt(k)
}
function step(s: Spr, dt: number) {
  let t = dt
  while (t > 0) {
    const h = Math.min(t, 1 / 240)
    s.v += (s.k * (s.to - s.x) - s.c * s.v) * h
    s.x += s.v * h
    t -= h
  }
}
const at = (s: Spr, e = 0.05) => Math.abs(s.to - s.x) < e && Math.abs(s.v) < e * 6

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const I = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
)
const PlusIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
)
const CloseIcon = () => (
  <I>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
)
const BackIcon = () => (
  <I>
    <path d="m15 18-6-6 6-6" />
  </I>
)
const ReturnIcon = () => (
  <I>
    <path d="M20 4v7a4 4 0 0 1-4 4H4M9 10l-5 5 5 5" />
  </I>
)

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type View = "button" | "menu" | "compose"
type FaceEntry = { key: number; view: "menu" | "compose"; id: string | null; kind: "pop" | "r" | "l"; leaving?: "l" | "r" | "fold" }
type Draft = { text: string; choice?: string }

export function ActionMorph({ actions, label = "Create", onSubmit, corner = "end", resetAfter = 1600, className }: ActionMorphProps) {
  const uid = React.useId()
  const [view, setView] = React.useState<View>("button")
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<"idle" | "sending" | "success">("idle")
  const [successLabel, setSuccessLabel] = React.useState("")
  const [announce, setAnnounce] = React.useState("")
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({})
  const [errors, setErrors] = React.useState<{ id: string; msg: string; invalid: boolean; n: number } | null>(null)
  const [faces, setFaces] = React.useState<FaceEntry[]>([])
  const keyRef = React.useRef(0)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const shapeRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const reduced = React.useRef(false)
  const sim = React.useRef({ w: mk(56), h: mk(56), r: mk(28), open: mk(0), raf: 0, last: 0 })
  const viewRef = React.useRef<View>("button")
  const timers = React.useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }

  /* ---- spring loop writing straight to the shape ---- */
  const paint = React.useCallback(() => {
    const s = sim.current
    const el = shapeRef.current
    if (!el) return
    el.style.width = `${s.w.x.toFixed(2)}px`
    el.style.height = `${s.h.x.toFixed(2)}px`
    el.style.borderRadius = `${Math.max(0, s.r.x).toFixed(2)}px`
    el.style.setProperty("--am-open", Math.min(1, Math.max(0, s.open.x)).toFixed(3))
  }, [])
  const tick = React.useCallback(
    (now: number) => {
      const s = sim.current
      const dt = Math.min(0.05, Math.max(0.001, (now - s.last) / 1000 || 0.016))
      s.last = now
      for (const k of [s.w, s.h, s.r, s.open]) step(k, dt)
      paint()
      if ([s.w, s.h, s.r].every((k) => at(k)) && at(s.open, 0.004)) {
        s.raf = 0
        return
      }
      s.raf = requestAnimationFrame(tick)
    },
    [paint],
  )
  const retarget = React.useCallback(
    (w: number, h: number, r: number, open: number, growing: boolean) => {
      const s = sim.current
      // Growing carries a little bounce, folding settles without overshoot.
      for (const k of [s.w, s.h, s.r]) {
        if (growing) tune(k, 330, 0.72)
        else tune(k, 420, 1)
      }
      tune(s.open, 260, 1)
      s.w.to = w
      s.h.to = h
      s.r.to = r
      s.open.to = open
      if (reduced.current) {
        s.w.x = w; s.h.x = h; s.r.x = r; s.open.x = open
        s.w.v = s.h.v = s.r.v = s.open.v = 0
        paint()
        return
      }
      if (!s.raf) {
        s.last = performance.now()
        s.raf = requestAnimationFrame(tick)
      }
    },
    [paint, tick],
  )

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => (reduced.current = mq.matches)
    on()
    mq.addEventListener("change", on)
    const sm = sim.current
    paint()
    const ts = timers.current
    return () => {
      mq.removeEventListener("change", on)
      cancelAnimationFrame(sm.raf)
      sm.raf = 0
      ts.forEach(clearTimeout)
    }
  }, [paint])

  /* ---- navigation between faces ---- */
  const go = React.useCallback(
    (next: View, id: string | null = null) => {
      const prev = viewRef.current
      viewRef.current = next
      setView(next)
      setActiveId(next === "compose" ? id : null)
      setFaces((cur) => {
        const alive = cur.filter((f) => !f.leaving)
        const leavingDir: "l" | "r" | "fold" = next === "button" ? "fold" : prev === "menu" && next === "compose" ? "l" : "r"
        const out = alive.map((f) => ({ ...f, leaving: leavingDir }))
        if (next === "button") return [...cur.filter((f) => f.leaving), ...out]
        const kind: FaceEntry["kind"] = prev === "button" ? "pop" : next === "compose" ? "r" : "l"
        return [...cur.filter((f) => f.leaving), ...out, { key: ++keyRef.current, view: next, id, kind }]
      })
      later(() => setFaces((cur) => cur.filter((f) => !f.leaving)), 340)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const close = React.useCallback(
    (focusButton = true) => {
      if (viewRef.current === "button") return
      go("button")
      retarget(56, 56, 28, 0, false)
      if (focusButton) requestAnimationFrame(() => btnRef.current?.focus({ preventScroll: true }))
    },
    [go, retarget],
  )

  // Press outside closes the surface without stealing focus.
  React.useEffect(() => {
    if (view === "button") return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [view, close])

  const onSize = React.useCallback(
    (w: number, h: number) => {
      if (viewRef.current === "button") return
      retarget(w, h, 24, 1, true)
    },
    [retarget],
  )

  const openMenu = () => {
    if (status === "sending") return
    setStatus((s) => (s === "success" ? "idle" : s))
    go("menu")
  }
  const openComposer = (id: string) => go("compose", id)

  const submit = async (action: ActionMorphAction, draft: Draft) => {
    const c = action.composer
    const text = draft.text.trim()
    if (!text) {
      setErrors({ id: action.id, msg: c.emptyHint ?? "Add a few words first.", invalid: true, n: (errors?.n ?? 0) + 1 })
      return
    }
    setErrors(null)
    setStatus("sending")
    try {
      await onSubmit?.({ action, text, choice: draft.choice })
    } catch {
      setStatus("idle")
      setErrors({ id: action.id, msg: "Couldn't save. Your draft is kept – try again.", invalid: false, n: (errors?.n ?? 0) + 1 })
      return
    }
    setDrafts((d) => ({ ...d, [action.id]: { text: "", choice: draft.choice } }))
    setSuccessLabel(c.successLabel)
    setAnnounce(c.successLabel)
    setStatus("success")
    close(false)
    later(() => setStatus("idle"), resetAfter)
    later(() => setAnnounce(""), resetAfter + 1500)
  }

  /* ---- keyboard on the whole component ---- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && viewRef.current !== "button") {
      e.preventDefault()
      e.stopPropagation()
      if (viewRef.current === "compose" && status !== "sending") {
        go("menu")
      } else if (viewRef.current === "menu") close(true)
      return
    }
    if (viewRef.current === "menu" && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
      const a = actions.find((x) => x.shortcut?.toLowerCase() === e.key.toLowerCase())
      if (a) {
        e.preventDefault()
        openComposer(a.id)
      }
    }
  }

  const activeAction = actions.find((a) => a.id === activeId)

  return (
    <div
      ref={rootRef}
      className={cn("am", className)}
      data-view={view}
      data-corner={corner}
      data-success={status === "success"}
      onKeyDown={onKeyDown}
    >
      <style href="action-morph" precedence="default">{CSS}</style>
      <div className="am-shape" ref={shapeRef} style={{ width: 56, height: 56, borderRadius: 28 }}>
        <span className="am-bg" aria-hidden="true" />
        <span className="am-surf" aria-hidden="true" />
        <button
          ref={btnRef}
          type="button"
          className="am-btn"
          aria-haspopup="menu"
          aria-expanded={view !== "button"}
          aria-label={status === "success" && successLabel ? `${label}. ${successLabel}` : label}
          tabIndex={view === "button" ? 0 : -1}
          aria-hidden={view === "button" ? undefined : true}
          onClick={openMenu}
        >
          <PlusIcon className="am-ico am-plus" />
          <I className="am-ico am-check">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </I>
        </button>
        {faces.map((f) => (
          <Face
            key={f.key}
            entry={f}
            current={!f.leaving}
            onSize={onSize}
            idBase={uid}
            label={label}
            actions={actions}
            action={f.view === "compose" ? actions.find((a) => a.id === f.id) ?? activeAction : undefined}
            draft={f.id ? drafts[f.id] : undefined}
            onDraft={(id, d) => setDrafts((cur) => ({ ...cur, [id]: d }))}
            sending={status === "sending"}
            error={errors && errors.id === f.id ? errors : null}
            onClearError={() => setErrors(null)}
            onOpen={openComposer}
            onBack={() => go("menu")}
            onClose={() => close(true)}
            onSubmit={submit}
          />
        ))}
      </div>
      <span className="am-sr" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Faces                                   */
/* -------------------------------------------------------------------------- */

type FaceProps = {
  entry: FaceEntry
  current: boolean
  onSize: (w: number, h: number) => void
  idBase: string
  label: string
  actions: ActionMorphAction[]
  action?: ActionMorphAction
  draft?: Draft
  onDraft: (id: string, d: Draft) => void
  sending: boolean
  error: { msg: string; invalid: boolean; n: number } | null
  onClearError: () => void
  onOpen: (id: string) => void
  onBack: () => void
  onClose: () => void
  onSubmit: (a: ActionMorphAction, d: Draft) => void
}

function Face(p: FaceProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { onSize, current } = p

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !current) return
    const measure = () => onSize(el.offsetWidth, el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [current, onSize])

  // Move focus into each new face.
  React.useEffect(() => {
    if (!current) return
    const el = ref.current
    const t = requestAnimationFrame(() => {
      const target = el?.querySelector<HTMLElement>(p.entry.view === "menu" ? '[role="menuitem"]' : "input, textarea")
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={cn("am-face", p.entry.view === "menu" ? "am-menu" : "am-compose")}
      data-kind={p.entry.leaving ? undefined : p.entry.kind}
      data-leaving={p.entry.leaving}
      aria-hidden={p.entry.leaving ? true : undefined}
    >
      {p.entry.view === "menu" ? <MenuBody {...p} /> : p.action ? <ComposerBody {...p} action={p.action} /> : null}
    </div>
  )
}

function MenuBody({ actions, label, idBase, onOpen, onClose }: FaceProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const hlRef = React.useRef<HTMLSpanElement>(null)
  const moveHl = (el: HTMLElement | null) => {
    const hl = hlRef.current
    if (!hl) return
    if (!el) {
      hl.style.opacity = "0"
      return
    }
    hl.style.height = `${el.offsetHeight}px`
    hl.style.transform = `translateY(${el.offsetTop}px)`
    hl.style.opacity = "1"
  }
  const onKey = (e: React.KeyboardEvent) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      items[(n + items.length) % items.length]?.focus()
    }
    if (e.key === "ArrowDown") go(i + 1)
    else if (e.key === "ArrowUp") go(i - 1)
    else if (e.key === "Home") go(0)
    else if (e.key === "End") go(items.length - 1)
  }
  return (
    <div role="menu" aria-labelledby={`${idBase}-menu`} onKeyDown={onKey}>
      <div className="am-head">
        <h2 className="am-title" id={`${idBase}-menu`}>{label}</h2>
        <button type="button" className="am-iconbtn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="am-list" ref={listRef} onPointerLeave={() => moveHl(null)}>
        <span className="am-hl" ref={hlRef} aria-hidden="true" />
        {actions.map((a, i) => (
          <button
            key={a.id}
            type="button"
            role="menuitem"
            className="am-item"
            style={{ ["--i" as string]: i }}
            aria-keyshortcuts={a.shortcut}
            onClick={() => onOpen(a.id)}
            onPointerEnter={(e) => e.pointerType !== "touch" && moveHl(e.currentTarget)}
            onFocus={(e) => moveHl(e.currentTarget)}
            onBlur={() => moveHl(null)}
          >
            <span className="am-tile" aria-hidden="true">{a.icon}</span>
            <span className="am-lines">
              <span className="am-lab">{a.label}</span>
              {a.description && <span className="am-desc">{a.description}</span>}
            </span>
            {a.shortcut && <kbd className="am-kbd" aria-hidden="true">{a.shortcut}</kbd>}
          </button>
        ))}
      </div>
    </div>
  )
}

function ComposerBody({ action, draft, idBase, onBack, onClose, onDraft, onSubmit, sending, error, onClearError }: FaceProps & { action: ActionMorphAction }) {
  const c = action.composer
  const text = draft?.text ?? ""
  const choice = draft?.choice ?? c.choices?.options[0]
  const fieldId = `${idBase}-f-${action.id}`
  const msgId = `${idBase}-m-${action.id}`
  const set = (d: Partial<Draft>) => {
    onDraft(action.id, { text, choice, ...d })
    if (error) onClearError()
  }
  const doSubmit = () => {
    if (sending) return
    onSubmit(action, { text, choice })
  }
  const fieldProps = {
    id: fieldId,
    className: "am-field",
    value: text,
    placeholder: c.placeholder,
    "aria-label": c.title,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? msgId : undefined,
    readOnly: sending,
  }
  const radios = React.useRef<(HTMLButtonElement | null)[]>([])
  const onRadioKey = (e: React.KeyboardEvent, i: number) => {
    const n = c.choices?.options.length ?? 0
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!dir || !c.choices) return
    e.preventDefault()
    const j = (i + dir + n) % n
    set({ choice: c.choices.options[j] })
    radios.current[j]?.focus()
  }
  return (
    <form
      className="am-form"
      aria-busy={sending || undefined}
      data-shake={error ? error.n % 2 : undefined}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        doSubmit()
      }}
    >
      <div className="am-head">
        <button type="button" className="am-iconbtn" aria-label="Back to menu" onClick={onBack}>
          <BackIcon />
        </button>
        <h2 className="am-title">{c.title}</h2>
        <button type="button" className="am-iconbtn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {c.multiline ? (
        <textarea
          {...fieldProps}
          rows={3}
          onChange={(e) => set({ text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              doSubmit()
            }
          }}
        />
      ) : (
        <input {...fieldProps} type="text" autoComplete="off" onChange={(e) => set({ text: e.target.value })} />
      )}
      {error && (
        <p className="am-msg" id={msgId} role="alert">
          {error.msg}
        </p>
      )}
      {c.choices && (
        <div className="am-choices">
          <span className="am-clabel" id={`${fieldId}-c`}>{c.choices.label}</span>
          <div className="am-seg" role="radiogroup" aria-labelledby={`${fieldId}-c`}>
            {c.choices.options.map((o, i) => (
              <button
                key={o}
                ref={(el) => {
                  radios.current[i] = el
                }}
                type="button"
                role="radio"
                aria-checked={o === choice}
                tabIndex={o === choice ? 0 : -1}
                onClick={() => set({ choice: o })}
                onKeyDown={(e) => onRadioKey(e, i)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="am-foot">
        <span className="am-hint">{c.multiline ? "Cmd + Enter to save" : ""}</span>
        <button type="submit" className="am-submit" aria-disabled={sending || undefined}>
          {sending ? <span className="am-spin" aria-hidden="true" /> : null}
          <span>{c.submitLabel}</span>
          {!sending && <ReturnIcon />}
        </button>
      </div>
    </form>
  )
}
