"""Adds a registry.json item for every component file that doesn't have one yet.

Titles and descriptions come from the gallery catalog in src/App.tsx, so there is one source of truth.
Existing items are left untouched. Run: python3 scripts/sync-registry.py && npx shadcn@latest build
"""
import json
import re
from pathlib import Path

KINDS = {"ui": "registry:ui", "blocks": "registry:block", "illustrations": "registry:ui", "motion": "registry:ui", "screens": "registry:block"}
TARGETS = {"ui": "components/ui/{}.tsx", "illustrations": "components/illustrations/{}.tsx", "motion": "components/motion/{}.tsx", "blocks": "components/blocks/{}.tsx", "screens": "components/screens/{}.tsx"}

app = Path("src/App.tsx").read_text()
catalog = {
    m.group(1): (m.group(2), m.group(3))
    for m in re.finditer(r'slug: "([^"]+)", name: "([^"]+)",[^\n]*?description: "((?:[^"\\]|\\.)*)"', app)
}

reg_path = Path("registry.json")
reg = json.loads(reg_path.read_text())
have = {item["name"] for item in reg["items"]}
added = []

for kind, rtype in KINDS.items():
    for f in sorted(Path(f"src/components/{kind}").glob("*.tsx")):
        slug = f.stem
        if slug in have:
            continue
        src = f.read_text()
        title, desc = catalog.get(slug, (slug.replace("-", " ").title(), ""))
        if slug == "backdrop":
            title, desc = "Backdrop", "The stage an illustration sits on: plain, dots, halftone, grid, drift, floor or aurora, with accent, speed and pause."
        file = {"path": str(f), "type": rtype}
        if kind in TARGETS:
            file["target"] = TARGETS[kind].format(slug)
        item = {
            "name": slug,
            "type": rtype,
            "title": title,
            "description": desc,
            "dependencies": ["lucide-react"] if "lucide-react" in src else [],
            "registryDependencies": ["utils"] if "@/lib/utils" in src else [],
            "files": [file],
        }
        reg["items"].append(item)
        added.append(slug)

reg_path.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + "\n")
print(f"{len(added)} added: {' '.join(added)}" if added else "registry already in sync")
