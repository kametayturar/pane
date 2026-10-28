"""Writes README.md from the gallery catalog (src/App.tsx), so the piece list is never out of date.

Pieces listed in scripts/private.json, or whose files are missing, are left out.
Run: python3 scripts/build-readme.py
"""
import json
import re
from pathlib import Path

SITE = "https://pane.vercel.app"
GITHUB = "https://github.com/kametayturar/pane"

app = Path("src/App.tsx").read_text()
private = set(json.loads(Path("scripts/private.json").read_text())) if Path("scripts/private.json").exists() else set()
tags = json.loads(Path("src/data/tags.json").read_text())["entries"]

FOLDERS = {"ui": "ui", "ill": "illustrations", "mo": "motion", "bl": "blocks"}
groups: list[tuple[str, list[tuple[str, str, str, str]]]] = []
for g in re.finditer(r'label: "([^"]+)",\s*entries: \[(.*?)\n    \],', app, re.S):
    rows = []
    for m in re.finditer(r'(?:(ui|ill|mo|bl)\(\{|\{) slug: "([^"]+)",[^\n]*?name: "([^"]+)",[^\n]*?description: "((?:[^"\\]|\\.)*)"', g.group(2)):
        helper, slug, name, desc = m.groups()
        folder = FOLDERS.get(helper or "", "screens")
        path = f"src/components/{folder}/{slug}.tsx"
        if slug in private or not Path(path).exists():
            continue
        if folder != "screens" and not Path(f"src/demos/{slug}.demo.tsx").exists():
            continue
        rows.append((slug, name, path, desc.replace("Instrument · ", "")))
    if rows:
        groups.append((g.group(1), rows))

count = sum(len(r) for _, r in groups)
catalog = []
for label, rows in groups:
    catalog.append(f"### {label}\n\n| Piece | What it does | Tags |\n| --- | --- | --- |")
    for slug, name, path, desc in rows:
        t = " ".join(f"`{x}`" for x in tags.get(slug, {}).get("tags", [])[:4])
        catalog.append(f"| [**{name}**]({SITE}/#/{slug}) · [source]({path}) | {desc} | {t} |")
    catalog.append("")

readme = f"""# Pane

**{count} pieces of UI for AI products, made with taste.** Components, full screens, illustrations and motion – streamed
answers with sources, agents you can approve and steer, tactile controls, real glass, and animated scenes for your
landing page. One file each, calm motion, dark mode built in. Open source (MIT).

**Live library:** {SITE} · **Catalog for agents:** {SITE}/llms.txt · **Skill:** [`skills/pane`](skills/pane/SKILL.md)

## Use it

**Let your agent do it.** Open Claude Code, Cursor or Codex in your project and paste the prompt from the
[overview]({SITE}/#/browse) – it reads the catalog, picks the pieces that fit your site and builds them in with your content.

**Install a piece yourself** (any React + Tailwind v4 project, no setup needed):

```bash
curl -sO {SITE}/add.mjs && node add.mjs ai-answer seal patchbay
```

or with the shadcn CLI:

```bash
npx shadcn@latest add {SITE}/r/ai-answer.json
```

**Install the skill** so your agent always builds in this style and knows every piece:

```bash
mkdir -p ~/.claude/skills && cp -r skills/pane ~/.claude/skills/
```

Each piece is a single `.tsx` file with its own CSS, tokens and motion. Read it, change it, it is yours.

## Three looks

Every piece restyles from its tokens: **Classic** (white, one blue accent), **Mono** (black and white, crisp) and
**Glass** – real Liquid Glass with refraction at the edges in Chromium and frosted glass everywhere else. Switch them in the
sidebar of the [live library]({SITE}/#/browse).

## Find anything

Press <kbd>⌘K</kbd> on the site: search runs across names, tags, synonyms ("modal" finds dialogs, "spinner" finds loaders)
and descriptions, tolerates typos, and every piece page links its tags and related pieces from other groups.

## Catalog

{chr(10).join(catalog)}
## Learn from it

Every demo file exports `notes` – a few sentences on the technique behind the piece (which CSS or JS trick makes it move).
The [skills page]({SITE}/#/skills) shows 60+ agent skills with real before/after output.

## Develop

```bash
npm install
npm run dev
```

Checks: `npx tsc --noEmit -p tsconfig.app.json`, `npx oxlint src`, `npm run build`. After adding a piece:
`python3 scripts/sync-registry.py && npx shadcn@latest build && python3 scripts/build-llms.py && python3 scripts/build-readme.py`.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Pane learned a lot from the public work of [affectUI](https://www.affectui.com) by Flo Hoeller and
[Arc UI](https://uiarc.dev) by Elia Kuratli – go look at theirs. All code here is written from scratch; see
[CREDITS.md](CREDITS.md) for techniques and references.

## Licence

MIT © Turar Kametay
"""
Path("README.md").write_text(readme)
print(f"wrote README.md ({count} pieces in {len(groups)} groups)")
