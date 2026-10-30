"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SamePageLabels = {
  /** Status before the handoff. Default "<from> finished the research". */
  ready: string
  /** Quiet line in the empty memo before the handoff. Default "<to> will write from this finding". */
  waiting: string
  /** Status while the finding is moving over. Default "<to> picked up". */
  picked: string
  /** Status once the second author is writing. Default "<to> is drafting". */
  drafting: string
  /** Button before the handoff. Default "Hand to <to>". */
  hand: string
  /** Button after the handoff. Default "Take back". */
  takeBack: string
}

export type SamePageProps = {
  /** The agent whose notes these are. Default "Atlas". */
  from?: string
  /** The agent who writes the memo. Default "Quill". */
  to?: string
  /** Small label next to the first agent's name. Default "Research notes". */
  sourceLabel?: string
  /** The first agent's notes, one finding per line. The first line holds the finding that moves over. */
  notes?: string[]
  /** The opening words of `notes[0]` that lift into the memo. Must be the start of that line, otherwise the whole line moves. Default: "Churn rose to 4.2% in Q3," for the built-in notes, otherwise the first clause of `notes[0]` (up to the first comma, or the whole line if it has none). */
  finding?: string
  /** What the second agent writes on from the finding. Default "and the cause is support, not the product." */
  continuation?: string
  /** Controlled: true once the work is with the second agent. Setting it turns the built-in loop off. */
  handed?: boolean
  /** Uncontrolled starting state. Setting it turns the built-in loop off. */
  defaultHanded?: boolean
  /** Called when the person hands the page over or takes it back. */
  onHandedChange?: (handed: boolean) => void
  /** Play the built-in handoff on a loop until the person touches the piece. Default: on when nothing else drives it. */
  autoPlay?: boolean
  /** Replaces any of the status and button texts. */
  labels?: Partial<SamePageLabels>
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.spg {
  --spg-ink: #000;
  --spg-surface: #fff;
  --spg-accent: #0060e2;
  --spg-t1: color-mix(in oklab, var(--spg-ink) 88%, transparent);
  --spg-t2: color-mix(in oklab, var(--spg-ink) 61%, transparent);
  --spg-t3: color-mix(in oklab, var(--spg-ink) 45%, transparent);
  --spg-t4: color-mix(in oklab, var(--spg-ink) 27%, transparent);
  --spg-fill: color-mix(in oklab, var(--spg-ink) 5%, transparent);
  --spg-line: color-mix(in oklab, var(--spg-ink) 8%, transparent);
  --spg-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 24px 48px -24px rgb(0 0 0 / .14);
  --spg-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 420px;
  font: 13px/20px var(--spg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--spg-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .spg {
  --spg-ink: #fff;
  --spg-surface: #1c1c1e;
  --spg-accent: #4d8dff;
  --spg-t1: color-mix(in oklab, var(--spg-ink) 90%, transparent);
  --spg-t2: color-mix(in oklab, var(--spg-ink) 62%, transparent);
  --spg-t3: color-mix(in oklab, var(--spg-ink) 46%, transparent);
  --spg-t4: color-mix(in oklab, var(--spg-ink) 28%, transparent);
  --spg-fill: color-mix(in oklab, var(--spg-ink) 8%, transparent);
  --spg-line: color-mix(in oklab, var(--spg-ink) 11%, transparent);
  --spg-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 24px 48px -24px rgb(0 0 0 / .5);
}
html[data-style="mono"] .spg {
  --spg-ink: #000; --spg-surface: #fff; --spg-accent: #111; --spg-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --spg-ease: cubic-bezier(.2, .9, .1, 1); --spg-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace; --spg-ls: 0;
}
html[data-style="mono"].dark .spg { --spg-ink: #fff; --spg-surface: #0a0a0a; --spg-accent: #f2f2f2; --spg-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .spg {
  --spg-ink: var(--pane-ink); --spg-surface: var(--pane-solid); --spg-accent: var(--pane-accent); --spg-shadow: var(--pane-shadow);
  --spg-ease: var(--pane-ease); --spg-font: var(--pane-font);
  --spg-t1: var(--pane-t1); --spg-t2: var(--pane-t2); --spg-t3: var(--pane-t3); --spg-t4: var(--pane-t4);
}
html[data-style="glass"] [data-s="run"] .spg-list li, html[data-style="glass"] [data-s="done"] .spg-list li { opacity: .65 }
html[data-style="glass"] [data-s="run"] .spg-list li:nth-child(n+2), html[data-style="glass"] [data-s="done"] .spg-list li:nth-child(n+2) { opacity: .45 }
html[data-style="glass"] .spg-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .spg-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .spg-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .spg-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .spg-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .spg-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}
.spg *, .spg *::before, .spg *::after { box-sizing: border-box }
:where(.spg) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.spg) p, :where(.spg) ul, :where(.spg) li { margin: 0; padding: 0 }
.spg button:focus-visible { outline: 2px solid var(--spg-accent); outline-offset: 2px }

/* Card */
.spg-card {
  --spg-pad: 26px; --spg-body: 15px; --spg-draft: 22px;
  background: var(--spg-surface); border-radius: 28px; box-shadow: var(--spg-shadow); padding: 26px var(--spg-pad) 22px;
}
html[data-style="mono"] .spg-card { --spg-body: 14px; --spg-draft: 17px; border-radius: 8px }
@container (max-width: 380px) {
  .spg-card { --spg-pad: 20px; --spg-draft: 20px; padding-top: 22px; padding-bottom: 20px }
  html[data-style="mono"] .spg-card { --spg-draft: 16px }
}

/* The first agent's notes */
.spg-lab { display: flex; align-items: baseline; gap: 8px; color: var(--spg-t2) }
.spg-lab b { font-weight: 600; color: var(--spg-t1) }
.spg-list { list-style: none; margin-top: 10px; display: grid; gap: 6px }
.spg-list li { font-size: var(--spg-body); line-height: 1.4; color: var(--spg-t1); transition: opacity .5s var(--spg-ease) }
.spg-s { display: inline-block }
[data-s="run"] .spg-list li, [data-s="done"] .spg-list li { opacity: .5; transition: opacity .6s var(--spg-ease) .7s }
[data-s="run"] .spg-list li:nth-child(n+2), [data-s="done"] .spg-list li:nth-child(n+2) { opacity: .3; transition: opacity .35s var(--spg-ease) .3s }

/* The seam: a hairline, drawn left to right, with the second author's name where it starts */
.spg-seam { position: relative; height: 34px; margin: 20px 0 16px; display: flex; align-items: center }
.spg-base, .spg-rule { position: absolute; left: 0; right: 0; top: 50%; height: 1px }
.spg-base { background: var(--spg-line) }
.spg-rule { background: color-mix(in oklab, var(--spg-accent) 38%, transparent); transform: scaleX(0); transform-origin: left; transition: transform .3s var(--spg-ease) }
.spg-tag {
  position: relative; display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 16px 0 5px; border-radius: 999px; background: var(--spg-surface);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--spg-accent) 30%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--spg-accent) 25%, transparent);
  font-size: var(--spg-body); font-weight: 600; color: var(--spg-accent);
  opacity: 0; filter: blur(4px); transform: translateX(-10px) scale(.92);
  transition: opacity .25s var(--spg-ease), filter .25s var(--spg-ease), transform .25s var(--spg-ease);
}
.spg-tag i { width: 24px; height: 24px; border-radius: 50%; background: var(--spg-accent); color: var(--spg-surface); font-style: normal; font-size: 13px; font-weight: 600; display: grid; place-items: center }
html[data-style="mono"] .spg-tag { border-radius: 4px }
html[data-style="mono"] .spg-tag i { border-radius: 3px }
[data-s="run"] .spg-rule, [data-s="done"] .spg-rule { transform: scaleX(1); transition: transform .5s var(--spg-ease) .3s }
[data-s="run"] .spg-tag, [data-s="done"] .spg-tag { opacity: 1; filter: none; transform: none; transition: opacity .4s var(--spg-ease), filter .4s var(--spg-ease), transform .5s var(--spg-ease) }

/* The memo. It is always laid out, so the card never changes height; words only fade in. */
.spg-draft { position: relative; font-weight: 500; font-size: var(--spg-draft); line-height: 1.3; letter-spacing: var(--spg-ls, -.022em); color: var(--spg-t1) }
.spg-w {
  display: inline-block; opacity: 0; filter: blur(6px); transform: translateY(5px);
  transition: opacity .2s var(--spg-ease), filter .2s var(--spg-ease), transform .2s var(--spg-ease);
}
[data-s="run"] .spg-w, [data-s="done"] .spg-w {
  opacity: 1; filter: none; transform: none;
  transition: opacity .5s var(--spg-ease) calc(.75s + (var(--k) - var(--spg-n)) * 70ms), filter .5s var(--spg-ease) calc(.75s + (var(--k) - var(--spg-n)) * 70ms), transform .56s var(--spg-ease) calc(.75s + (var(--k) - var(--spg-n)) * 70ms);
}
/* The lifted words are visible at once; the motion comes from the lift itself. */
.spg-wait {
  position: absolute; left: 0; right: 0; top: 0; font-size: 13px; line-height: 20px; letter-spacing: 0; font-weight: 400; color: var(--spg-t3);
  transition: opacity .3s var(--spg-ease), filter .3s var(--spg-ease);
}
[data-s="run"] .spg-wait, [data-s="done"] .spg-wait { opacity: 0; filter: blur(4px) }
.spg-w.spg-f, [data-s="run"] .spg-w.spg-f, [data-s="done"] .spg-w.spg-f { transition: none }
[data-s="run"] .spg-w.spg-f, [data-s="done"] .spg-w.spg-f { opacity: 1; filter: none; transform: none }
.spg-caret { display: inline-block; width: 2px; height: 1em; margin-left: 3px; vertical-align: -.14em; border-radius: 1px; background: var(--spg-accent); opacity: 0 }
[data-s="done"] .spg-caret { animation: spg-caret 2.2s steps(1) forwards }
@keyframes spg-caret { 0% { opacity: 1 } 25% { opacity: 0 } 50% { opacity: 1 } 75% { opacity: 0 } 100% { opacity: 0 } }

/* Status and the one button */
.spg-foot { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px }
.spg-status { flex: 1; min-width: 0; color: var(--spg-t2) }
.spg-in { display: inline-block; animation: spg-in .56s var(--spg-ease) backwards }
@keyframes spg-in { from { opacity: 0; filter: blur(4px); transform: translateY(4px) } }
.spg-go {
  flex: none; display: inline-grid; place-items: center; height: 40px; padding: 0 20px; border-radius: 999px; font-size: var(--spg-body); font-weight: 500; line-height: 1;
  color: var(--spg-surface); background: var(--spg-accent);
  box-shadow: 0 1px 2px color-mix(in oklab, var(--spg-accent) 30%, transparent), inset 0 0 0 .5px color-mix(in oklab, var(--spg-surface) 25%, transparent);
  transition: transform .16s var(--spg-ease), background-color .25s var(--spg-ease), color .25s var(--spg-ease), box-shadow .25s var(--spg-ease);
}
html[data-style="mono"] .spg-go { border-radius: 4px }
.spg-go > span { grid-area: 1 / 1; white-space: nowrap; transition: opacity .25s var(--spg-ease), filter .25s var(--spg-ease), transform .25s var(--spg-ease) }
.spg-go > span[data-off] { opacity: 0; filter: blur(4px); transform: translateY(4px) }
.spg-go:hover { background: color-mix(in oklab, var(--spg-accent) 90%, var(--spg-ink)) }
.spg-go:active { transform: scale(.96) }
[data-s="run"] .spg-go, [data-s="done"] .spg-go { color: var(--spg-t2); background: var(--spg-fill); box-shadow: none }
[data-s="run"] .spg-go:hover, [data-s="done"] .spg-go:hover { background: color-mix(in oklab, var(--spg-ink) 9%, transparent) }
@media (pointer: coarse) { .spg-go { height: 44px } }
@media (prefers-reduced-motion: reduce) {
  .spg *, .spg *::before, .spg *::after { animation: none !important; transition: none !important }
  .spg-caret { opacity: 0 !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  SamePage                                  */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22, 1, .36, 1)"
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean)
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

const DEFAULT_NOTES = ["Churn rose to 4.2% in Q3, up from 3.1%.", "Enterprise held at 1.1%. The loss is in Starter.", "EMEA support replies took 31 hours."]

export function SamePage(props: SamePageProps) {
  const {
    from = "Atlas",
    to = "Quill",
    sourceLabel = "Research notes",
    notes: notesProp,
    finding,
    continuation = "and the cause is support, not the product.",
    onHandedChange,
    className,
  } = props
  const notes = notesProp && notesProp.length > 0 ? notesProp : DEFAULT_NOTES
  const labels: SamePageLabels = {
    ready: `${from} finished the research`,
    waiting: `${to} will write from this finding`,
    picked: `${to} picked up`,
    drafting: `${to} is drafting`,
    hand: `Hand to ${to}`,
    takeBack: "Take back",
    ...props.labels,
  }

  // The finding is the start of the first note; if it is not, the whole first note moves.
  const first = notes[0] ?? ""
  const clause = first.indexOf(",")
  const wanted = finding ?? (notesProp ? (clause >= 0 ? first.slice(0, clause + 1) : first) : "Churn rose to 4.2% in Q3,")
  const head = first.startsWith(wanted) && wanted.trim() !== "" ? wanted : first
  const rest = first.slice(head.length)
  const lifted = words(head)
  const written = words(continuation)

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const controlled = props.handed !== undefined
  const autoPlay = props.autoPlay ?? (!controlled && props.defaultHanded === undefined)
  const [inner, setInner] = React.useState(props.defaultHanded ?? false)
  const handed = controlled ? !!props.handed : inner
  const [settled, setSettled] = React.useState(false)
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const wasHanded = React.useRef(false)
  const firstWait = React.useRef(true)

  const looping = autoPlay && auto && !controlled && !reduce
  const stage = !handed ? "ready" : settled || reduce ? "done" : "run"

  // Reduced motion has no loop, so the built-in card rests on the decisive frame (set before first paint).
  React.useLayoutEffect(() => {
    if (autoPlay && !controlled && prefersReduced()) setInner(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!looping) return
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [looping])

  // The built-in moment: hand over, hold on the memo, take it back, again.
  React.useEffect(() => {
    if (!looping || !active) return
    const wait = handed ? 6300 : firstWait.current ? 800 : 1200
    const t = window.setTimeout(() => {
      firstWait.current = false
      setInner((h) => !h)
    }, wait)
    return () => window.clearTimeout(t)
  }, [looping, active, handed])

  // "Picked up" gives way to "drafting" once the words have landed.
  React.useEffect(() => {
    if (!handed) {
      setSettled(false)
      return
    }
    const t = window.setTimeout(() => setSettled(true), 2000)
    return () => window.clearTimeout(t)
  }, [handed])

  // The lift: every word of the finding in the memo starts on top of the same word in the notes and glides home.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!handed) {
      wasHanded.current = false
      return
    }
    if (wasHanded.current) return
    wasHanded.current = true
    if (reduce) return
    const src = root.querySelectorAll<HTMLElement>("[data-src]")
    const dst = root.querySelectorAll<HTMLElement>("[data-dst]")
    dst.forEach((d, i) => {
      const s = src[i]
      if (!s) return
      const a = s.getBoundingClientRect()
      const b = d.getBoundingClientRect()
      if (b.width === 0 || a.width === 0) return
      const sc = parseFloat(getComputedStyle(s).fontSize) / parseFloat(getComputedStyle(d).fontSize)
      const dx = a.left + a.width / 2 - (b.left + b.width / 2)
      const dy = a.top + a.height / 2 - (b.top + b.height / 2)
      d.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sc})`, opacity: 0.5 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 640, delay: 380 + i * 30, easing: EASE, fill: "backwards" },
      )
    })
  }, [handed, reduce])

  // If frames never arrive (throttled tab, screenshot) the final page is the same: finish whatever is left.
  React.useEffect(() => {
    if (!handed) return
    const t = window.setTimeout(() => {
      rootRef.current?.getAnimations({ subtree: true }).forEach((a) => {
        try {
          a.finish()
        } catch {
          /* infinite animation: nothing to finish */
        }
      })
    }, 4600)
    return () => window.clearTimeout(t)
  }, [handed])

  const toggle = () => {
    setAuto(false)
    const next = !handed
    if (!controlled) setInner(next)
    onHandedChange?.(next)
  }

  const status = stage === "ready" ? labels.ready : stage === "run" ? labels.picked : labels.drafting
  const wl = { "--spg-n": lifted.length } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={cn("spg", className)}
      onPointerDownCapture={() => setAuto(false)}
      onKeyDownCapture={() => setAuto(false)}
      onFocusCapture={() => setAuto(false)}
    >
      <style href="same-page" precedence="default">
        {CSS}
      </style>
      <div className="spg-card" role="group" aria-label={`${from} and ${to}, one document`} data-s={stage}>
        <section>
          <p className="spg-lab">
            <b>{from}</b>
            <span>{sourceLabel}</span>
          </p>
          <ul className="spg-list">
            {notes.map((n, i) =>
              i === 0 ? (
                <li key={i}>
                  {lifted.map((w, k) => (
                    <React.Fragment key={k}>
                      {k > 0 && " "}
                      <span className="spg-s" data-src>
                        {w}
                      </span>
                    </React.Fragment>
                  ))}
                  {rest}
                </li>
              ) : (
                <li key={i}>{n}</li>
              ),
            )}
          </ul>
        </section>
        <div className="spg-seam" aria-hidden>
          <i className="spg-base" />
          <i className="spg-rule" />
          <span className="spg-tag">
            <i>{to.charAt(0).toUpperCase()}</i>
            {to}
          </span>
        </div>
        <p className="spg-draft" style={wl} aria-hidden={stage === "ready"}>
          <span className="spg-wait" aria-hidden>
            {labels.waiting}
          </span>
          {lifted.map((w, k) => (
            <React.Fragment key={`l${k}`}>
              {k > 0 && " "}
              <span className="spg-w spg-f" data-dst style={{ "--k": k } as React.CSSProperties}>
                {w}
              </span>
            </React.Fragment>
          ))}
          {written.map((w, k) => (
            <React.Fragment key={`w${k}`}>
              {" "}
              <span className="spg-w" style={{ "--k": lifted.length + k } as React.CSSProperties}>
                {w}
              </span>
            </React.Fragment>
          ))}
          <i className="spg-caret" aria-hidden />
        </p>
        <div className="spg-foot">
          <p className="spg-status" role="status" aria-live={looping ? "off" : "polite"}>
            <span key={status} className="spg-in">
              {status}
            </span>
          </p>
          <button type="button" className="spg-go" onClick={toggle}>
            <span data-off={handed || undefined} aria-hidden={handed}>
              {labels.hand}
            </span>
            <span data-off={!handed || undefined} aria-hidden={!handed}>
              {labels.takeBack}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
