# Pane look

**Quiet surfaces, one accent, motion that settles.** Nothing shouts; hierarchy comes from ink alpha, size and space.

### Tokens (per component, light and dark)
Every piece owns a class prefix (`.xx`) and these custom properties on its root:

```css
.xx { --xx-ink: #000; --xx-surface: #fff; --xx-accent: #0060e2;
  --xx-t1: color-mix(in oklab, var(--xx-ink) 88%, transparent);   /* main text   */
  --xx-t2: color-mix(in oklab, var(--xx-ink) 61%, transparent);   /* secondary   */
  --xx-t3: color-mix(in oklab, var(--xx-ink) 45%, transparent);   /* muted, meta */
  --xx-t4: color-mix(in oklab, var(--xx-ink) 27%, transparent);   /* faint       */
  --xx-fill: color-mix(in oklab, var(--xx-ink) 6%, transparent);  /* chips, wells */
  --xx-line: color-mix(in oklab, var(--xx-ink) 6%, transparent);  /* hairlines   */
  --xx-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --xx-ease: cubic-bezier(.22, 1, .36, 1);
  font: 13px/20px var(--xx-font, Inter, ui-sans-serif, system-ui, sans-serif); }
:is(.dark, [data-theme="dark"]) .xx { --xx-ink: #fff; --xx-surface: #1c1c1e; --xx-accent: #4d8dff;
  --xx-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4); }
```
Colour comes from **alpha of ink**, never from a grey palette – so one variable flips the whole piece to dark, and
the three styles (Classic, Mono, Glass) only override tokens.

### Type and space
- 13px/20px body, 12–12.5px meta, 14–15px titles (500), big numbers 19–24px with `tabular-nums`.
- Display serif only for editorial pieces (`"Instrument Serif", Georgia, serif`); monospace only for code, tool names and telemetry.
- Radii: 6–8 for chips and buttons, 10–12 for cards, 16–24 for stages. Cards: surface + `--xx-shadow`, no borders.
- Status colours are tints, not fills: running = accent on 10% accent, done = green on 10% green, failed = red on 10% red, waiting = amber.

### Motion
- **One curve everywhere:** `cubic-bezier(.22, 1, .36, 1)` – starts fast, settles gently. Durations 160–560ms.
- **Enter with blur:** opacity 0 → 1, translateY(4px) → 0, `filter: blur(3px)` → 0. Text that changes in place crossfades through a 10px blur.
- **Glide, don't jump:** heights animate between measured pixel values (ResizeObserver), lists reorder with FLIP, thumbs and pills slide to the new target.
- **Steady streams:** release streamed words at a constant pace (~38/s) instead of in the model's bursts.
- **Working state:** a white glint sweeping across the label (`background-clip: text` on an `::after` copy), a small ray spinner, a live timer.
- `animation-fill-mode: backwards` (not `both`) so finished animations don't leave stacking contexts behind.
- Every loop stops when paused, off screen (IntersectionObserver) or in a hidden tab; `prefers-reduced-motion` shows one meaningful still frame.

### Art: dots, not gradients
The signature visual is **ordered dithering**: compute one value per cell (noise, an image's luminance, an SVG you draw),
compare it with a Bayer 4×4/8×8 threshold, draw a small square where it's above. Tint with the accent, fade with a
radial mask, let it drift slowly. Variants: halftone dots gathering at the edges, a dot-sphere of 1,000+ Fibonacci
points, dither art bleeding past card edges. Draw subjects yourself as SVG – no stock images, no brand logos
(neutral glyph tiles; let users pass real logos as props).

### Illustrations and motion pieces ("studio" pieces)
Transparent background (a separate `Backdrop` provides dots / halftone / grid / drift / floor / aurora / dither) and three
props on every piece: `speed` (multiplier → `calc(1.1s / var(--xx-speed))`), `paused` (`animation-play-state` + JS loops
stop and resume from the same clock), `accent`. Draw on a fixed design stage and scale it to the container width so it
never reflows.
