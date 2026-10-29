# Build method

1. **Start from one everyday job and its one decisive moment** – confirm, wait, choose, read. One idea per piece, one
   focal point, everything else quiet. The delight comes from precise motion and type, not from a material or a
   metaphor (wax, fog, paper, cables) laid over a crowded dashboard: if the piece needs its metaphor explained, cut it.
   It should read in one second at card size, with no text under 13px.
2. **Write the scene before the code**: a real product moment with specific copy and a consequence line ("Sends to 14
   investors at 09:00"), what moves and why (motion explains cause and effect), and the keyboard path. Learning from a
   reference is fine – measure its public page with `getComputedStyle` and `document.getAnimations()` – but write your own
   code; paid or gated source stays out.
3. **Build one self-contained file**: `"use client"`, a `CSS` string rendered as `<style href="name" precedence="default">`,
   the token block above, a built-in simulation so `<Piece />` alone is alive, typed props to drive it with real data,
   real buttons/ARIA/keyboard, container queries so it works from 360px to 1200px.
4. **Keep it smooth**: one rAF loop per piece; write positions to CSS variables or refs; no per-frame React renders of big
   trees; read layout once, write once.
5. **Verify with real screenshots** in headless Chrome (puppeteer with `--disable-renderer-backgrounding
   --disable-background-timer-throttling`, or background tabs freeze animations): light, dark, 390px, mid-animation and
   final state. Put yours next to the reference and fix every difference you can name.
6. **Write down how it's made** – 3–5 plain sentences naming the technique (e.g. "height animates because a ResizeObserver
   measures the content and CSS transitions between two pixel values").

## Checklist before calling a piece done
- [ ] Light and dark both look finished; colours are ink alphas / tokens.
- [ ] One easing curve; enters settle in; nothing jumps.
- [ ] Reduced motion shows a still, meaningful frame.
- [ ] Keyboard and screen reader work (roles, labels, `aria-live` for status).
- [ ] 360px and 1200px both look right.
- [ ] Animations stop off screen and when paused; no layout thrash.
- [ ] Original content: invented names, no brand logos, no copied text.
- [ ] Element resets use `:where(.xx) button { … }` so they never outrank the piece's own classes.
- [ ] Content is visible in its final state even if rAF never runs (throttled tabs, screenshots); motion only enhances.
- [ ] Elements a container query shows or hides switch with `visibility` (animations on them stay reliable).
