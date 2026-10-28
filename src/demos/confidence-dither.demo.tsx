import * as React from "react"

import { ConfidenceDither, EXAMPLE_OPTIONS, EXAMPLE_TOKENS, type DitherOption, type DitherToken } from "@/components/ui/confidence-dither"

/* Small seeded random so "Resample" is repeatable and render stays pure. */
function rng(seed: number) {
  let a = seed * 2654435761 + 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sample(seed: number): { value: number; tolerance: number; options: DitherOption[]; tokens: DitherToken[] } {
  if (seed === 0) return { value: 0.86, tolerance: 0.06, options: EXAMPLE_OPTIONS, tokens: EXAMPLE_TOKENS }
  const r = rng(seed)
  const weights = EXAMPLE_OPTIONS.map(() => 0.05 + Math.pow(r(), 2.2))
  const sum = weights.reduce((a, b) => a + b, 0)
  return {
    value: 0.22 + r() * 0.75,
    tolerance: 0.03 + r() * 0.12,
    options: EXAMPLE_OPTIONS.map((o, i) => ({ label: o.label, p: weights[i] / sum })),
    tokens: EXAMPLE_TOKENS.map((t) => {
      const confidence = Math.min(0.99, Math.max(0.18, t.confidence + (r() - 0.5) * 0.55))
      const rest = 1 - confidence
      return { ...t, confidence, alternatives: (t.alternatives ?? []).map((a, i) => ({ ...a, p: rest * (i === 0 ? 0.6 : 0.3) })) }
    }),
  }
}

function Section({ n, title, children, note }: { n: string; title: React.ReactNode; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <header className="max-w-[720px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.08em] text-neutral-950/45 dark:text-white/45">{n}</p>
        <h2 className="mt-1 font-['Instrument_Serif',Georgia,serif] text-[34px] leading-[38px] tracking-[-.01em] text-neutral-950 dark:text-white">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-neutral-950/64 dark:text-white/64">{note}</p>
      </header>
      {children}
    </section>
  )
}

export default function Demo() {
  const [seed, setSeed] = React.useState(0)
  const d = React.useMemo(() => sample(seed), [seed])

  return (
    <div className="-m-6 min-h-dvh p-6 sm:-m-10 sm:p-10">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.08em] text-neutral-950/45 dark:text-white/45">Instrument · Uncertainty</p>
            <h1 className="mt-1 font-['Instrument_Serif',Georgia,serif] text-[48px] leading-[50px] tracking-[-.01em] text-neutral-950 dark:text-white">
              Confidence <em>dither</em>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="h-8 shrink-0 rounded-[2px] px-3 font-mono text-[11px] font-medium uppercase tracking-[.08em] text-neutral-950 dark:text-white shadow-[0_0_0_1px_var(--inst-signal)] outline-offset-2 hover:bg-[color-mix(in_oklab,var(--inst-signal)_10%,transparent)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--inst-signal)]"
          >
            Resample
          </button>
        </div>

        <Section n="01 · Bar" title={<>One number, <em>with its error bar</em></>} note="Dense ink is confident, sparse is unsure. The edge dissolves across the tolerance band.">
          <ConfidenceDither mode="bar" value={d.value} tolerance={d.tolerance} label="Answer confidence · Nova" caption="FIG. 1 — Self-rated confidence, ±tolerance from 12 samples" />
        </Section>

        <Section n="02 · Distribution" title={<>Which <em>category</em>, and how sure</>} note="A dither-filled probability curve over the options. The chosen one is drawn in signal dots.">
          <ConfidenceDither mode="distribution" options={d.options} label="Which category is this ticket?" caption="FIG. 2 — Ticket #4821, Harbor & Finch support desk" />
        </Section>

        <Section n="03 · Field" title={<>Every word <em>carries its odds</em></>} note="Background density is the model's confidence in that token. Hover or focus a word for its top-3 alternatives.">
          <ConfidenceDither mode="field" tokens={d.tokens} label="Generated reply · token confidence" caption="FIG. 3 — Draft reply, Sage 2" />
        </Section>
      </div>
    </div>
  )
}

export const notes: string[] = [
  "The dots are an ordered (Bayer) dither: a 4×4 or 8×8 threshold matrix tiled over the canvas. A cell gets a dot when its density value is greater than the matrix threshold at that position, so one density number becomes a stable, flicker-free pattern.",
  "Each mode only builds a 'scene' — a grid of density and tone per cell. One shared painter draws it with fillRect at device-pixel coordinates, so the dots stay crisp at any devicePixelRatio.",
  "The 'settle' scan keeps the previous scene and draws rows above a moving boundary from the new one and rows below it from the old one. A 1px signal line rides the boundary. It runs on requestAnimationFrame only while a scan is in progress, and only while the piece is on screen (IntersectionObserver).",
  "In field mode the words are real buttons laid out by flexbox. The canvas behind them reads each word's offsetLeft/offsetTop/size, maps it to grid cells and fills them with that token's confidence. A ResizeObserver re-measures when fonts load or lines re-wrap.",
  "Numbers count to their value by writing textContent from rAF (no React state per frame), with a ≤2% overshoot that returns — and a visually hidden copy carries the final value for screen readers. Reduced motion shows the settled frame.",
]
