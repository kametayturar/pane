---
name: pane
description: Pane, the open-source React UI library for AI products (https://pane.vercel.app). Use when adding UI from Pane to a project – components, full screens, illustrations, motion, glass – or when designing or building a new piece in Pane's style ("make it feel like Pane", calm, premium, less generic).
---

# Pane

Pane is a library of **pieces**: each is one self-contained React + Tailwind v4 `.tsx` file with its own CSS string,
tokens, light and dark mode, reduced motion and keyboard support. The catalog lives at https://pane.vercel.app/llms.txt
(names, what each does, tags, install command); a snapshot is in [references/catalog.md](references/catalog.md).

Two jobs use this skill. Pick the one in front of you.

## A. Put Pane into a project

1. **Study the project**: framework, styling setup (Tailwind v4 is required), routes, brand colours and fonts, what the
   product does. Done when you can name the pages to change and the brand tokens.
2. **Choose pieces** from the catalog: search it by job, tag and synonym (a "modal" is tagged `dialog`, a "spinner" is
   `loading`). For a whole app, start from the closest screen (`ops-dashboard`, `task-tracker`, `accounting`, `finance`,
   `mission-control`, `research-desk`, `agent-workbench`, `eval-lab`) and keep its rail and top bar. Open
   `https://pane.vercel.app/#/<slug>` to check a piece looks right. Done when every section you change has a piece or a
   reason to stay as it is.
3. **Install** in the project root: `curl -sO https://pane.vercel.app/add.mjs && node add.mjs <slug> <slug>…` (writes files to
   `src/components/…`, adds `lib/utils.ts` when needed, prints any npm packages; shadcn users can run
   `npx shadcn@latest add https://pane.vercel.app/r/<slug>.json`). The `@/` import alias must point at `src/`.
4. **Wire real content**: pass the project's data and copy through each piece's exported props (read its types); set the
   brand on each piece's tokens (`--<prefix>-accent`, `--<prefix>-font`; override with `html .<prefix> {…}` because Tailwind
   v4 styles are unlayered). Pieces follow a `.dark` class or `data-theme="dark"` on an ancestor. Done when no demo names or
   numbers remain.
5. **Verify like a designer**: run the app, screenshot every changed page on desktop and 390px, light and dark, compare with
   the piece's page on the site, and fix what differs. Done when you would put the screenshots in a launch post.

## B. Build a new piece in Pane's style

Read [references/look.md](references/look.md) (tokens, type, motion, art) and [references/build.md](references/build.md)
(method and the done-checklist) first. For glass, read [references/glass.md](references/glass.md). The piece is done when
every checklist line in build.md holds and the screenshots look finished in Classic, Mono and Glass.
