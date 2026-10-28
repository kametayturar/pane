#!/usr/bin/env node
// Pane installer – adds pieces to any React project, no shadcn setup needed.
//
//   curl -sO https://pane.vercel.app/add.mjs && node add.mjs dither-field text-reveal ai-answer
//
// For each piece it downloads https://pane.vercel.app/r/<slug>.json and writes the file to
// <src>/components/... (src/ if the project has one). It also creates lib/utils.ts (the `cn` helper) when a piece
// needs it, checks that the "@/" import alias is set up, and prints the npm packages to install.
// Flags: --force (overwrite existing files), --dir <path> (project root, default: current folder).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const SITE = "https://pane.vercel.app"
const args = process.argv.slice(2)
const force = args.includes("--force")
const dirIdx = args.indexOf("--dir")
const root = path.resolve(dirIdx >= 0 ? args[dirIdx + 1] : ".")
const slugs = args.filter((a, i) => !a.startsWith("--") && !(dirIdx >= 0 && i === dirIdx + 1))
if (!slugs.length) {
  console.log("usage: node add.mjs <slug> [slug…] [--force] [--dir <project>]\nCatalog: " + SITE + "/llms.txt")
  process.exit(1)
}

const base = existsSync(path.join(root, "src")) ? path.join(root, "src") : root
const npmDeps = new Set()
let needsUtils = false
const written = []
const seen = new Set()

async function add(slug) {
  if (seen.has(slug)) return
  seen.add(slug)
  const res = await fetch(`${SITE}/r/${slug}.json`)
  if (!res.ok) throw new Error(`"${slug}" not found (${res.status}). See ${SITE}/llms.txt for slugs.`)
  const item = await res.json()
  for (const d of item.dependencies ?? []) npmDeps.add(d)
  for (const dep of item.registryDependencies ?? []) {
    if (dep === "utils") needsUtils = true
    else if (dep.startsWith(SITE)) await add(dep.split("/r/")[1].replace(/\.json$/, ""))
  }
  for (const f of item.files ?? []) {
    const rel = f.target ?? f.path.replace(/^src\//, "")
    const out = path.join(base, rel)
    if (existsSync(out) && !force) {
      console.log(`skip   ${path.relative(root, out)} (exists – use --force to overwrite)`)
      continue
    }
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(out, f.content)
    written.push(path.relative(root, out))
    if (/from "@\/lib\/utils"/.test(f.content)) needsUtils = true
    if (/from "lucide-react"/.test(f.content)) npmDeps.add("lucide-react")
  }
}

for (const s of slugs) await add(s)
for (const w of written) console.log(`added  ${w}`)

if (needsUtils) {
  const candidates = ["lib/utils.ts", "lib/utils.tsx", "lib/utils.js"].map((p) => path.join(base, p))
  if (!candidates.some(existsSync)) {
    mkdirSync(path.join(base, "lib"), { recursive: true })
    writeFileSync(candidates[0], `export function cn(...classes: (string | false | null | undefined)[]) {\n  return classes.filter(Boolean).join(" ")\n}\n`)
    console.log(`added  ${path.relative(root, candidates[0])} (cn helper)`)
  }
}

// "@/" alias check (tsconfig paths + bundler alias).
const readJson = (f) => {
  try {
    return readFileSync(f, "utf8")
  } catch {
    return ""
  }
}
const tsconfigs = ["tsconfig.json", "tsconfig.app.json", "jsconfig.json"].map((f) => readJson(path.join(root, f))).join("\n")
const viteCfg = ["vite.config.ts", "vite.config.js", "vite.config.mts"].map((f) => readJson(path.join(root, f))).join("\n")
const isNext = existsSync(path.join(root, "next.config.js")) || existsSync(path.join(root, "next.config.mjs")) || existsSync(path.join(root, "next.config.ts"))
const srcRel = path.relative(root, base) || "."
if (!/"@\/\*"/.test(tsconfigs)) {
  console.log(`\nwarn   the "@/" alias is missing from tsconfig. Add to compilerOptions:\n         "paths": { "@/*": ["./${srcRel === "." ? "" : srcRel + "/"}*"] }`)
}
if (viteCfg && !/["']@["']\s*:/.test(viteCfg) && !/alias/.test(viteCfg)) {
  console.log(`warn   vite needs the alias too: resolve: { alias: { "@": path.resolve(__dirname, "${srcRel}") } }`)
}
if (!viteCfg && !isNext && !/"@\/\*"/.test(tsconfigs)) console.log("warn   make sure your bundler resolves \"@/\" to your source folder")

const pkg = readJson(path.join(root, "package.json"))
const missing = [...npmDeps].filter((d) => !pkg.includes(`"${d}"`))
if (missing.length) console.log(`\nnext   npm i ${missing.join(" ")}`)
console.log(`\ndone   ${written.length} file(s). Dark mode: pieces follow a .dark class (or data-theme="dark") on an ancestor – see ${SITE}/llms.txt`)
