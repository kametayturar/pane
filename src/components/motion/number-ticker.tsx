"use client"

import * as React from "react"

/**
 * NumberTicker – odometer-style numbers. Every digit is a vertical strip 0–9 that rolls to its new
 * value; digits that appear or disappear glide in width. Formatting is Intl.NumberFormat.
 *
 *   <NumberTicker value={48240} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
 */

export type NumberTickerProps = {
  /** The number to show. Change it and the digits roll. */
  value?: number
  /** Intl.NumberFormat options – currency, compact notation, decimals, percent, signDisplay… */
  format?: Intl.NumberFormatOptions
  /** BCP 47 locale for separators and symbols. Default: the browser's. */
  locale?: string
  /** Text rendered before the number. */
  prefix?: string
  /** Text rendered after the number. */
  suffix?: string
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze motion: digits jump instead of rolling, running animations hold. */
  paused?: boolean
  /** Accent colour (any CSS colour) – used for the focus ring only. */
  accent?: string
  /** Announce changes to screen readers (aria-live="polite"). Default true. */
  live?: boolean
  className?: string
  style?: React.CSSProperties
}

type Item = {
  key: string
  kind: "digit" | "sym"
  char: string
  /** Distance from the least significant integer digit – staggers the roll. */
  place: number
  born: boolean
  exiting: boolean
  /** Natural width in ch. */
  w: number
}

const CSS = `
.nt {
  --nt-accent: #0060e2;
  --nt-ease: cubic-bezier(.22, 1, .36, 1);
  --nt-speed: 1;
  display: inline-flex; align-items: center; position: relative; white-space: pre;
  line-height: 1.1; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;
}
:is(.dark, [data-theme="dark"]) .nt { --nt-accent: #4d8dff }
.nt *, .nt *::before, .nt *::after { box-sizing: border-box }
.nt :focus-visible { outline: 2px solid color-mix(in oklab, var(--nt-accent) 60%, transparent); outline-offset: 1px }
.nt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }

/* Every character sits in a clipped box whose max-width animates 0 <-> its natural width. */
.nt-i { display: flex; flex: none; height: 1.1em; max-width: var(--w, 1ch); overflow-x: clip }
.nt-i[data-born] { animation: nt-in calc(.6s / var(--nt-speed)) var(--nt-ease) backwards }
.nt-i[data-exiting] { animation: nt-out calc(.5s / var(--nt-speed)) var(--nt-ease) forwards; pointer-events: none }
@keyframes nt-in { from { max-width: 0; opacity: 0; filter: blur(4px) } }
@keyframes nt-out { to { max-width: 0; opacity: 0; filter: blur(4px) } }

.nt-sym { display: block; height: 1.1em; line-height: 1.1em; white-space: pre }

/* A digit: a window one glyph tall onto a 0-9 strip. The window is taller than the glyph so the
   fade mask sits outside the figure itself. */
.nt-d { position: relative; display: block; width: 1ch; height: 1.5em; margin: -.2em 0; overflow: clip;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 .2em, #000 1.3em, transparent 1.5em);
  mask-image: linear-gradient(to bottom, transparent 0, #000 .2em, #000 1.3em, transparent 1.5em) }
.nt-strip { position: absolute; left: 0; top: .2em; width: 100%;
  transform: translateY(calc(var(--d) * -1.1em));
  transition: transform calc(.8s / var(--nt-speed)) var(--nt-ease);
  transition-delay: calc(min(var(--k), 6) * 30ms / var(--nt-speed)) }
.nt-strip > span { display: block; height: 1.1em; line-height: 1.1em; text-align: center }

.nt[data-paused], .nt[data-paused] * { animation-play-state: paused !important }
.nt[data-paused] .nt-strip { transition-duration: 0s; transition-delay: 0s }

@media (prefers-reduced-motion: reduce) {
  .nt, .nt *, .nt *::before, .nt *::after { animation: none !important; transition: none !important }
}
`

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

const DIGIT = /^[0-9]$/

/** Format and split into items with identities that stay put while the value changes. */
function toItems(formatted: Intl.NumberFormatPart[], prefix: string, suffix: string): Item[] {
  const items: Item[] = []
  const seen = new Map<string, number>()
  const nth = (t: string) => {
    const n = seen.get(t) ?? 0
    seen.set(t, n + 1)
    return n
  }
  const sym = (key: string, char: string, place = 0): Item => ({
    key,
    kind: "sym",
    char,
    place,
    born: false,
    exiting: false,
    w: /^[\s.,'\u2019\u066c\u066b]+$/.test(char) ? char.length * 0.6 : char.length * 1.4,
  })

  const intDigits = formatted.filter((p) => p.type === "integer").reduce((n, p) => n + p.value.length, 0)
  let consumed = 0
  let frac = 0

  if (prefix) items.push(sym("prefix", prefix))
  for (const part of formatted) {
    if (part.type === "integer") {
      for (const ch of part.value) {
        const place = intDigits - 1 - consumed++
        items.push(DIGIT.test(ch) ? { key: `i${place}`, kind: "digit", char: ch, place, born: false, exiting: false, w: 1 } : sym(`i${place}`, ch, place))
      }
    } else if (part.type === "fraction") {
      for (const ch of part.value) {
        const k = frac++
        items.push(DIGIT.test(ch) ? { key: `f${k}`, kind: "digit", char: ch, place: 0, born: false, exiting: false, w: 1 } : sym(`f${k}`, ch))
      }
    } else if (part.type === "group") {
      items.push(sym(`g${intDigits - consumed}`, part.value))
    } else if (part.type === "compact") {
      items.push(sym(`compact:${part.value}`, part.value))
    } else {
      items.push(sym(`${part.type}:${nth(part.type)}`, part.value))
    }
  }
  if (suffix) items.push(sym("suffix", suffix))
  return items
}

/** Keep removed items around (exiting) at the spot they used to be, so they can glide out. */
function merge(old: Item[], next: Item[], animate: boolean): Item[] {
  const oldByKey = new Map(old.map((o) => [o.key, o]))
  const out = next.map((n) => {
    const o = oldByKey.get(n.key)
    return { ...n, born: o ? o.born : animate && old.length > 0, exiting: false }
  })
  if (!animate) return out
  let anchor = -1
  for (const o of old) {
    const idx = out.findIndex((p) => p.key === o.key && !p.exiting)
    if (idx >= 0) {
      anchor = idx
      continue
    }
    out.splice(anchor + 1, 0, { ...o, exiting: true })
    anchor++
  }
  return out
}

export function NumberTicker({
  value = 12480,
  format,
  locale,
  prefix = "",
  suffix = "",
  speed = 1,
  paused,
  accent,
  live = true,
  className,
  style,
}: NumberTickerProps) {
  const reduced = usePrefersReducedMotion()
  const formatKey = JSON.stringify(format ?? null)
  const { next, text } = React.useMemo(() => {
    const nf = new Intl.NumberFormat(locale, format ?? { maximumFractionDigits: 0 })
    return { next: toItems(nf.formatToParts(value), prefix, suffix), text: prefix + nf.format(value) + suffix }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale, formatKey, prefix, suffix])

  const sig = next.map((n) => n.key + n.char).join("|")
  const [state, setState] = React.useState(() => ({ sig, items: next }))
  if (state.sig !== sig) {
    setState({ sig, items: merge(state.items, next, !reduced) })
  }

  const rootStyle = { ...style, "--nt-speed": speed, ...(accent ? { "--nt-accent": accent } : null) } as React.CSSProperties

  return (
    <span className={["nt", className].filter(Boolean).join(" ")} style={rootStyle} data-paused={paused || undefined}>
      <style href="number-ticker" precedence="default">
        {CSS}
      </style>
      <span className="nt-sr" aria-live={live ? "polite" : undefined} aria-atomic>
        {text}
      </span>
      <span style={{ display: "contents" }} aria-hidden>
        {state.items.map((it) => (
          <span
            key={it.key}
            className="nt-i"
            style={{ "--w": `${it.w}ch` } as React.CSSProperties}
            data-born={it.born || undefined}
            data-exiting={it.exiting || undefined}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && it.exiting) {
                setState((s) => ({ ...s, items: s.items.filter((x) => !(x.key === it.key && x.exiting)) }))
              }
            }}
          >
            {it.kind === "digit" ? (
              <span className="nt-d" style={{ "--k": it.place } as React.CSSProperties}>
                <span className="nt-strip" style={{ "--d": Number(it.char), "--k": it.place } as React.CSSProperties}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </span>
            ) : (
              <span className="nt-sym">{it.char}</span>
            )}
          </span>
        ))}
      </span>
    </span>
  )
}

export default NumberTicker
