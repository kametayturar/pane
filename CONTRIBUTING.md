# Contributing

Thanks for wanting to add to Pane. The bar is taste: a piece should be something people screenshot and share, and
still be practical on a real product.

## A good piece

- **One file**, `src/components/<ui|blocks|illustrations|motion|screens>/<name>.tsx`, starting with `"use client"`, with its
  CSS in a string rendered as `<style href="<name>" precedence="default">`.
- **Its own class prefix and tokens** (`--x-ink`, `--x-surface`, `--x-accent`, `--x-shadow`, `--x-ease`, `--x-font` …) for
  light and dark, so the Classic, Mono and Glass styles can restyle it. Resets go in `:where(.x) button {…}`.
- **Original.** Your own idea and your own code. Don't port pieces from paid or gated libraries.
- **Calm, meaningful motion** with a reduced-motion version; loops pause off screen.
- **Keyboard and screen reader** parity, 360px to 1200px, invented demo content (no real brands or logos).
- A demo in `src/demos/<name>.demo.tsx` that exports `notes`: 3–5 sentences on how it's made.

The full house style is in [skills/pane/SKILL.md](skills/pane/SKILL.md).

## Checks

```bash
npx tsc --noEmit -p tsconfig.app.json
npx oxlint src
npm run build
```

Then register it: add a catalog entry in `src/App.tsx`, tags in `src/data/tags.json`, and run
`python3 scripts/sync-registry.py && npx shadcn@latest build && python3 scripts/build-llms.py && python3 scripts/build-readme.py`.
Include screenshots (light, dark, 390px) in the pull request.
