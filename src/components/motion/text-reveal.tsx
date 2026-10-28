"use client"

import * as React from "react"

/**
 * TextReveal – text that arrives word by word (or letter by letter), each unit
 * fading out of a soft blur and rising into place. Plays when it scrolls into view.
 *
 *   <TextReveal as="h2" by="word">Ask once, ship the answer.</TextReveal>
 */

export type TextRevealProps = {
  /** The text to reveal. `children` (a string) works too. */
  text?: string
  children?: string
  /** Element to render. Default "p". */
  as?: React.ElementType
  /** Reveal unit. Default "word". */
  by?: "word" | "letter"
  /** Gap between two units, in ms. Default 60 for words, 22 for letters. */
  stagger?: number
  /** Wait before the first unit starts, in ms. Default 0. */
  delay?: number
  /** Play only the first time it enters the viewport. Default true; false replays on every entry. */
  once?: boolean
  /** Change this value to replay the reveal. */
  replayKey?: React.Key
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) – used for the focus ring only. */
  accent?: string
  className?: string
  style?: React.CSSProperties
}

const CSS = `
.tr {
  --tr-accent: #0060e2;
  --tr-ease: cubic-bezier(.22, 1, .36, 1);
  --tr-speed: 1;
  --tr-stagger: 60ms;
  --tr-delay: 0ms;
  position: relative;
}
:where(.tr) { margin: 0 }
:is(.dark, [data-theme="dark"]) .tr { --tr-accent: #4d8dff }
.tr *, .tr *::before, .tr *::after { box-sizing: border-box }
.tr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }

/* Words never break in the middle; letters sit inside their word. */
.tr-w { display: inline-block; white-space: nowrap }
.tr-u { display: inline-block; will-change: opacity, filter, transform }
.tr:not([data-in]) .tr-u { opacity: 0 }
.tr[data-in] .tr-u {
  animation: tr-in calc(.9s / var(--tr-speed)) var(--tr-ease) backwards;
  animation-delay: calc((var(--i) * var(--tr-stagger) + var(--tr-delay)) / var(--tr-speed));
}
@keyframes tr-in { from { opacity: 0; filter: blur(8px); transform: translateY(.42em) } }

.tr[data-paused] .tr-u { animation-play-state: paused !important }

@media (prefers-reduced-motion: reduce) {
  .tr .tr-u { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important }
}
`

export function TextReveal({
  text,
  children,
  as: As = "p",
  by = "word",
  stagger,
  delay = 0,
  once = true,
  replayKey,
  speed = 1,
  paused,
  accent,
  className,
  style,
}: TextRevealProps) {
  const content = text ?? children ?? ""
  const ref = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(() => typeof IntersectionObserver === "undefined")

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -6% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  const words = React.useMemo(() => content.split(/\s+/).filter(Boolean), [content])
  const step = stagger ?? (by === "letter" ? 22 : 60)

  let n = 0
  const units = words.map((word, wi) => (
    <React.Fragment key={wi}>
      {wi > 0 && " "}
      {by === "letter" ? (
        <span className="tr-w">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="tr-u" style={{ "--i": n++ } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </span>
      ) : (
        <span className="tr-w tr-u" style={{ "--i": n++ } as React.CSSProperties}>
          {word}
        </span>
      )}
    </React.Fragment>
  ))

  const rootStyle = {
    ...style,
    "--tr-speed": speed,
    "--tr-stagger": `${step}ms`,
    "--tr-delay": `${delay}ms`,
    ...(accent ? { "--tr-accent": accent } : null),
  } as React.CSSProperties

  return (
    <As
      ref={ref}
      className={["tr", className].filter(Boolean).join(" ")}
      style={rootStyle}
      data-in={inView ? "" : undefined}
      data-paused={paused || undefined}
    >
      <style href="text-reveal" precedence="default">
        {CSS}
      </style>
      <span className="tr-sr">{content}</span>
      <span key={replayKey} aria-hidden>
        {units}
      </span>
    </As>
  )
}

export default TextReveal
