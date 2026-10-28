"""Writes public/llms.txt (the catalog an AI coding agent reads) and publishes the Pane skill under public/skills/.

The catalog comes from the gallery's RAW_GROUPS in src/App.tsx, so it never drifts from the site.
Run: python3 scripts/build-llms.py   (also runs before every deploy – see README)
"""
import json
import re
import shutil
from pathlib import Path

SITE = "https://pane.vercel.app"
app = Path("src/App.tsx").read_text()
block = app[app.index("const RAW_GROUPS") : app.index("const GROUPS =")]
FOLDER = {"ui": "components/ui", "ill": "components/illustrations", "mo": "components/motion", "bl": "components/blocks"}
KIND = {"ui": "component", "ill": "illustration", "mo": "motion effect", "bl": "block"}
PRIVATE = set(json.loads(Path("scripts/private.json").read_text())) if Path("scripts/private.json").exists() else set()
TAGS = json.loads(Path("src/data/tags.json").read_text())["entries"]

groups = []
for g in re.finditer(r'label: "([^"]+)",\s*entries: \[(.*?)\n    \],', block, re.S):
    label, body = g.group(1), g.group(2)
    rows = re.findall(r'(ui|ill|mo|bl)\(\{ slug: "([^"]+)",[^\n]*?name: "([^"]+)",[^\n]*?description: "((?:[^"\\]|\\.)*)"', body)
    # Public catalog: skip private pieces and anything whose files aren't here.
    rows = [r for r in rows if r[1] not in PRIVATE and Path(f"src/{FOLDER[r[0]]}/{r[1]}.tsx").exists() and Path(f"src/demos/{r[1]}.demo.tsx").exists()]
    if rows:
        groups.append((label, rows))

registry = {i["name"] for i in json.loads(Path("registry.json").read_text())["items"]}
count = 0
lines = [
    "# Pane",
    "",
    "> Open-source (MIT) React + Tailwind UI for AI products and agents: components, blocks, animated illustrations and",
    "> motion effects. Each piece is ONE self-contained .tsx file (its own CSS and tokens, light + dark, reduced motion,",
    "> keyboard and screen reader support) with a built-in demo state so it works with no props, plus typed props for real data.",
    "",
    "## How to use this catalog (for AI coding agents)",
    "",
    "### Install",
    "",
    f"- Easiest, works in any React project (no shadcn needed): `curl -sO {SITE}/add.mjs && node add.mjs <slug> [<slug>…]`.",
    "  It writes each piece to `src/components/...` (or `components/...`), creates `lib/utils.ts` if a piece needs it,",
    "  checks the `@/` alias and prints the npm packages to install (usually `lucide-react`).",
    f"- In a project that already has shadcn set up (a `components.json`): `npx shadcn@latest add {SITE}/r/<slug>.json`.",
    "  Without `components.json` the shadcn CLI stops at an interactive prompt – use add.mjs instead.",
    f"- By hand: fetch `{SITE}/r/<slug>.json` and write `files[0].content` to `<src>/` + `files[0].target`.",
    "",
    "### Project prerequisites",
    "",
    "- React 19 + react-dom. Many pieces use `lucide-react`. About half import `cn` from `@/lib/utils`.",
    "- The `@/` import alias must resolve to your source folder in BOTH the bundler and TypeScript:",
    "  tsconfig `\"paths\": { \"@/*\": [\"./src/*\"] }` and (Vite) `resolve: { alias: { \"@\": path.resolve(__dirname, \"src\") } }`.",
    "- Pieces ship their own CSS (a `<style>` tag inside the file) – Tailwind is NOT required, and you don't need the demos.",
    "",
    "### Theming",
    "",
    "- Dark mode: pieces switch when an ancestor has the class `dark` or `data-theme=\"dark\"`. To follow the OS, add to your entry file:",
    "  `const mq = matchMedia('(prefers-color-scheme: dark)'); const sync = () => document.documentElement.classList.toggle('dark', mq.matches); sync(); mq.addEventListener('change', sync)`.",
    "- Brand colour: illustrations, motion pieces and many blocks take an `accent` prop – pass a CSS colour or a variable (`accent=\"var(--brand)\"`).",
    "  Every piece also exposes tokens on its root (`--<prefix>-accent`, `-ink`, `-surface`, `-font`, `-ease`). Override them with a selector",
    "  at least as specific as the piece's own dark rule, e.g. `html .aia, html.dark .aia { --aia-accent: #4f46e5; }` – a plain `.aia {}` loses in dark mode.",
    "  The prefix is the root class of the piece (open the file – it's the first selector in its CSS).",
    "- Tailwind v4: pieces' CSS is unlayered, so it beats Tailwind utilities (which live in `@layer`). Put layout classes on a wrapper",
    "  element around the piece instead of on the piece itself.",
    "",
    "### Behaviour",
    "",
    "- Every piece works with no props (built-in demo content/simulation). Pass your real content through props – read the file's exported types.",
    "- Some pieces start their animation when they mount (e.g. `ai-answer`, `thinking-state`). Below the fold, mount them when they scroll",
    "  into view (an IntersectionObserver gate) so people see the motion. Illustrations and motion pieces already wait until visible.",
    f"- Live preview of every piece: {SITE}/#/<slug>",
    f"- Skill (house style, build method, glass recipe – follow it when you compose pages): {SITE}/skills/pane.md",
    "",
    "## Recipes (which pieces fit which page)",
    "",
    "- **A whole product:** start from a Meridian screen that matches the job – `mission-control` (multi-agent ops),",
    "  `research-desk` (reports with sources), `agent-workbench` (co-editing with an agent), `eval-lab` (model evals), `task-tracker` (board/list/timeline),",
    "  `ops-dashboard` (business KPIs), `accounting` (reconcile, invoices, ledger, P&L), `finance` (cash runway, budgets, spend). Each is one file:",
    "  keep its rail and top bar, replace the content with your data. Kit: `instrument-shell`, `instrument-form`, `spec-table`, `readout-bar`,",
    "  `instrument-hero`, `instrument-pricing`, `provenance-trail`, `confidence-dither`, `run-scrubber`, `token-scope`.",
    "- **Landing page:** hero = `dither-field` or `gradient-floor` or `grid-background` behind `text-reveal`; or an illustration like `neural-panels`, `data-flow`, `condensation` (stage mode).",
    "  How it works = `pipeline-steps` or `step-cards`. Integrations = `integration-beam`, `logo-cluster` or `patchbay`. Product demo = an AI block",
    "  (`ai-answer`, `ai-chat`, `agent-orchestrator`). Social proof = `logo-marquee`, `testimonial-wall`. Pricing numbers = `number-ticker`. Buttons = `button`.",
    "- **AI chat app:** `ai-chat` (full block) or compose `chat-composer` / `ai-composer` + `ai-answer` + `thinking-state` + `tool-call-card` + `message-actions`;",
    "  side assistant = `ai-side-panel`; model choice = `model-picker`; usage = `usage-meter`, `run-receipt`; model settings = `faderbank`; cited answers = `marker-pass`.",
    "- **Agent product:** `agent-orchestrator`, `agent-tasks`, `agent-approvals`, `agent-routines`, `agent-plan`, `approval-card`, `seal` (approve), `bead-stepper` (run progress), `agent-pebble` (background status), `assembler` (generative UI).",
    "- **Analytics / data:** KPI numbers with `number-ticker`, charts `sunburst`, `sankey-flow`, `streamgraph`, `treemap`, `race-bar-chart`, `realtime-stream`,",
    "  tables `data-grid`; blocks `cohort-retention`, `mrr-waterfall`, `usage-forecast`, `journey-flow`.",
    "- **App chrome & polish:** `command-menu`, `dock`, `morph-nav`, `toaster`, `notification-stack`, `segmented-control`, `glass-*`, empty states (`empty-calendar`, `ghosted-chat`).",
    "- **Originals (new interaction ideas):** compare plans with `folio`, review edits with `tracing-paper`, select by drawing with `loop-select`,",
    "  search with `resonance-search`, wrap long threads in `scroll-edge`, hide secrets in `condensation`.",
    "",
]
for label, rows in groups:
    lines += [f"## {label}", ""]
    for kind, slug, name, desc in rows:
        desc = desc.replace("\\'", "'")
        install = f"node add.mjs {slug}" if slug in registry else "(not in the registry yet)"
        tags = ", ".join(TAGS.get(slug, {}).get("tags", []))
        lines.append(f"- **{name}** (`{slug}`, {KIND[kind]}) – {desc} Tags: {tags}. File: `{FOLDER[kind]}/{slug}.tsx`. Install: `{install}`")
        count += 1
    lines.append("")
lines += [
    "## Screens",
    "",
    "- **Agent Run** (`agent-run`) and **Agent Chat** (`agent-chat`) – full app screens built from the pieces above; "
    f"see {SITE}/#/agent-run and {SITE}/#/agent-chat.",
    "",
    "## Backdrop",
    "",
    f"- **Backdrop** (`backdrop`) – the stage illustrations sit on: plain, dots, halftone, grid, drift, floor, aurora, dither. File: `components/motion/backdrop.tsx`. Install: `npx shadcn@latest add {SITE}/r/backdrop.json`",
    "",
]
Path("public/llms.txt").write_text("\n".join(lines))
Path("public/skills").mkdir(parents=True, exist_ok=True)
# The Pane skill: a catalog snapshot inside it, and the whole skill published on the site for agents to read.
Path("skills/pane/references/catalog.md").write_text("\n".join(lines))
shutil.copy("skills/pane/SKILL.md", "public/skills/pane.md")
Path("public/skills/pane").mkdir(parents=True, exist_ok=True)
for ref in Path("skills/pane/references").glob("*.md"):
    shutil.copy(ref, f"public/skills/pane/{ref.name}")
print(f"wrote public/llms.txt ({count} pieces), skills/pane/references/catalog.md and public/skills/pane*")
