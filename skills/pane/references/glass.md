# Glass – how Pane does Liquid Glass

Glass in Pane is three tiers on the same element. Every tier must look finished alone, because browsers and users
decide which one they get.

| Tier | Who gets it | What it is |
| --- | --- | --- |
| 0 · Solid | Reduced transparency, more contrast, forced colours, no `backdrop-filter` | Near-opaque tint (`.95`), normal shadow. |
| 1 · Frost | Every browser with `backdrop-filter` | Translucent tint + blur + saturate, a specular rim, a soft shadow. |
| 2 · Refraction | Chromium only, gated by `html[data-refract]` | Tier 1 plus an SVG displacement filter that bends the backdrop at the rim. |

## Tier 1 – frost and rim

- **Tint**: Tier 1 is the floor for browsers without refraction: light `rgb(255 255 255 / .40)` (floating `.38`), dark
  `rgb(20 20 28 / .48)` (floating `.46`). With refraction on (`html[data-refract]`) the tint thins to the 6-22% recipe plus a
  contrast margin: light `.24` (floating `.22`), dark `rgb(20 20 24 / .32)` (floating `.30`). The filter itself blurs the core only
  2-3px, so the tint and the stronger text floors carry contrast. Measure with `node docs/review/glass-contrast.mjs --glass-only`.
- **Blur**: Tier 1 `blur(16px) saturate(1.8)` (floating `blur(18px)`), dark saturate 1.7. Tier 2 tail: light `saturate(1.8)
  brightness(1.06)`, dark `saturate(1.6) brightness(.8)`. Write the literal value on
  both `backdrop-filter` and `-webkit-backdrop-filter` (Safari ignores a variable there).
- **Rim**: inset shadows, not borders – a 1px all-round line, a crisp 1.5–2px highlight top-left, a dimmer one
  bottom-right, a short inner streak about 3px in, and a faint inset glow (kept low, or it adds haze). This lit edge is what makes it read as a thick, curved slab.
- **Shadow**: a hairline plus a soft drop, slightly blue-tinted in light mode.
- **Secondary text gets stronger** on glass (light: 96/84/72/58% ink, dark: 96/80/68/54%) because the backdrop moves under it.
  Check 4.5:1 against the real pixels behind the text, not the token.

## Tier 2 – refraction

`src/glass-defs.tsx` renders one hidden `<svg>` with filters `#pane-glass-<size>-<l|d>` for four size classes (tip, pill,
menu, card). Surfaces use `backdrop-filter: url(#pane-glass-menu-l) saturate(…)`.

- The **displacement map** is painted on a canvas from the rounded rectangle's signed distance: R/G hold the vector,
  B holds a rim mask. The bend is strongest at the rim and fades to zero at the inner edge of the bezel, so the
  centre stays flat and readable.
- **Vectors point inward.** An outward map samples outside the box and leaves a bright seam.
- **Lens profile** is `(1 - t)^1.5` across the bezel; bezel 44 (card), 40 (menu), 34 (pill), 14 (tip).
- **Dispersion** is explicit: red bends `scale x 1.08`, green `x 1`, blue `x .92` (`DISPERSION` in glass-defs.tsx).
- **Do not fold the backdrop**: keep the peak shift of the red channel (scale × 1.08 / 2) at or under about 0.65 × bezel, or text behind the rim garbles.
- **Rim and core are split**: the rim is the displaced image (with a ±8% red/green/blue spread (15% and even 12% showed a dashed pink/cyan fringe over dot grids) for a prismatic fringe
  and a tone shift per scheme); the centre is a plain blur. A filter cannot read CSS variables, so light and dark each
  get their own filter.
- **Gate in JS**, not `@supports`: `@supports (backdrop-filter: url(#x))` passes in Safari and Firefox, which then show
  nothing. Set `data-refract` only when `navigator.userAgentData.brands` includes Chromium and no reduced-transparency,
  more-contrast or forced-colours preference is on.

## Rules that break glass if you ignore them

1. **No glass on glass.** A glass surface inside another keeps a tint but drops its own `backdrop-filter`; a nested
   floating panel (a tooltip in a card) goes near-opaque.
2. **Backdrop roots.** `opacity < 1`, `filter`, `mask`, `mix-blend-mode`, `will-change: opacity` or
   `isolation: isolate` combined with a blended descendant on an ancestor makes it a backdrop root, and the glass inside sees
   only that ancestor. Animate the glass element itself, not a wrapper.
3. **Give it something to bend.** Glass over a flat colour looks like grey plastic. Put colour, shapes, photos or text
   behind it; the gallery uses a mesh with a dot grid and soft rays.
4. **Keep the surface tokens solid.** A piece's `--surface` is also used as text on accent buttons; paint the translucent
   tint only on the glass elements themselves.
5. **Verify with a diff**: screenshot a surface with `data-refract` on and off. The rim band should change clearly; the
   centre should barely change.

## Not built yet

- **Backdrop-aware tone** (sample the backdrop, flip light/dark and tint per surface) needs a JS sampler; it is left out until it can be small and safe.
- **Blend-mode text** (multiply or plus-lighter on headlines): a blended descendant under a `backdrop-filter` blanks it in Chrome, so it is not shipped.
