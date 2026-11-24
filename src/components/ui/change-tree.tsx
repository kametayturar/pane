"use client"

/**
 * Change Tree – the files a coding agent touched in one task, as a tree of only the paths that changed.
 *
 * Not a folder browser: it shows changed paths only, and a folder that holds a single folder is folded into one line
 * ("tests/api/" instead of two levels). Every file says what happened to it in type: its added and removed lines as
 * tabular numbers ("+42 −7"), and a word only when it is not a plain edit ("new", "deleted" with the name struck,
 * "renamed from http.ts"). A thin bar in ink beside each file shows its size against the largest file, additions solid
 * and removals hatched, so the big files stand out without colour. The header says the whole change as a sentence:
 * "Atlas changed 9 files in 4 folders", then "+213 −58". A closed folder shows the sum of its files.
 *
 * ```tsx
 * <ChangeTree />                                    // Atlas's built-in change to a small TypeScript project
 * <ChangeTree
 *   agent="Atlas"
 *   files={files}                                   // { path, added, removed, status, from? }[], flat
 *   sort="size"                                     // folders first, then largest change ("size") or A to Z ("name")
 *   defaultSelected="src/api/users.ts"
 *   onSelect={(file) => openDiff(file.path)}
 * />
 * ```
 *
 * It is a real `role="tree"`: one tab stop, Up/Down move, Right opens a folder or goes to its first child, Left closes
 * it or goes to the parent, Home/End, type the first letters of a name to jump, Enter or Space selects a file (or opens
 * and closes a folder). Selection and sort are uncontrolled by default; pass `selected` or `sort` to control them.
 */

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ChangeTreeStatus = "modified" | "added" | "deleted" | "renamed"

export type ChangeTreeFile = {
  /** Path from the project root, with "/" between folders: "src/api/users.ts". */
  path: string
  /** Lines added. */
  added: number
  /** Lines removed. */
  removed: number
  /** What happened to the file. Only "modified" goes without a word. */
  status: ChangeTreeStatus
  /** For a renamed file, its old path. Shown as "renamed from user.ts" (the name alone when the folder is the same). */
  from?: string
}

/** Folders always come first. Then "size" puts the largest change first, "name" sorts A to Z. */
export type ChangeTreeSort = "size" | "name"

export type ChangeTreeProps = {
  /** Who made the change. Default "Atlas". */
  agent?: string
  /** The changed files, flat. The tree is built from their paths. Default: Atlas's change to a small TypeScript project. */
  files?: ChangeTreeFile[]
  /** Small line above the sentence, e.g. the task: "Cache user lookups". Default: none. */
  caption?: string
  /** Replaces the header sentence ("Atlas changed 9 files in 4 folders"). */
  title?: string
  /** Controlled sort. */
  sort?: ChangeTreeSort
  /** Starting sort when uncontrolled. Default "size". */
  defaultSort?: ChangeTreeSort
  /** Called when the person presses the sort word. */
  onSortChange?: (sort: ChangeTreeSort) => void
  /** Controlled selected file path (null for none). */
  selected?: string | null
  /** Starting selected file path when uncontrolled. */
  defaultSelected?: string | null
  /** Called when a file is selected by click, Enter or Space. A product opens the file's diff here. */
  onSelect?: (file: ChangeTreeFile) => void
  /** Which folders start open: true (all, the default), false (none) or a list of folder paths without the trailing slash ("src/api", "tests/api"). */
  defaultExpanded?: boolean | string[]
  /** Accessible name of the tree. Default "Changed files". */
  label?: string
  /** Stable name an agent uses for this piece (see docs/agent-operable.md). */
  agentId?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ctv {
  --ctv-ink: #000;
  --ctv-surface: #fff;
  --ctv-accent: #0060e2;
  --ctv-t1: color-mix(in oklab, var(--ctv-ink) 88%, transparent);
  --ctv-t2: color-mix(in oklab, var(--ctv-ink) 61%, transparent);
  --ctv-t3: color-mix(in oklab, var(--ctv-ink) 45%, transparent);
  --ctv-t4: color-mix(in oklab, var(--ctv-ink) 27%, transparent);
  --ctv-hov: color-mix(in oklab, var(--ctv-ink) 3.5%, transparent);
  --ctv-sel: color-mix(in oklab, var(--ctv-ink) 5%, transparent);
  --ctv-line: color-mix(in oklab, var(--ctv-ink) 7%, transparent);
  --ctv-guide: color-mix(in oklab, var(--ctv-ink) 9%, transparent);
  --ctv-trk: color-mix(in oklab, var(--ctv-ink) 5%, transparent);
  --ctv-bar: color-mix(in oklab, var(--ctv-ink) 52%, transparent);
  --ctv-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ctv-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --ctv-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 420px;
  font: 14px/20px var(--ctv-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--ctv-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ctv {
  --ctv-ink: #fff;
  --ctv-surface: #1c1c1e;
  --ctv-accent: #4d8dff;
  --ctv-t1: color-mix(in oklab, var(--ctv-ink) 90%, transparent);
  --ctv-t2: color-mix(in oklab, var(--ctv-ink) 62%, transparent);
  --ctv-t3: color-mix(in oklab, var(--ctv-ink) 46%, transparent);
  --ctv-t4: color-mix(in oklab, var(--ctv-ink) 28%, transparent);
  --ctv-hov: color-mix(in oklab, var(--ctv-ink) 5%, transparent);
  --ctv-sel: color-mix(in oklab, var(--ctv-ink) 7%, transparent);
  --ctv-line: color-mix(in oklab, var(--ctv-ink) 9%, transparent);
  --ctv-guide: color-mix(in oklab, var(--ctv-ink) 11%, transparent);
  --ctv-trk: color-mix(in oklab, var(--ctv-ink) 7%, transparent);
  --ctv-bar: color-mix(in oklab, var(--ctv-ink) 58%, transparent);
  --ctv-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ctv-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, one monospaced face, square corners; the bar and the words already carry everything */
html[data-style="mono"] .ctv {
  --ctv-ink: #000; --ctv-surface: #fff; --ctv-accent: #111;
  --ctv-shadow: 0 0 0 1px rgb(0 0 0 / .14); --ctv-drop: 0 0 0 0 transparent;
  --ctv-ease: cubic-bezier(.2, .9, .1, 1); --ctv-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --ctv-bar: color-mix(in oklab, var(--ctv-ink) 72%, transparent);
}
html[data-style="mono"].dark .ctv { --ctv-ink: #fff; --ctv-surface: #0a0a0a; --ctv-accent: #f2f2f2; --ctv-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .ctv-card { border-radius: 8px; font-size: 13px }
html[data-style="mono"] .ctv-big { font-size: clamp(18px, 5.2cqw, 22px); letter-spacing: -.01em }
html[data-style="mono"] .ctv-row { border-radius: 4px }
html[data-style="mono"] .ctv-row[data-sel]::before { border-radius: 0; width: 3px }
html[data-style="mono"] .ctv-b, html[data-style="mono"] .ctv-bi { border-radius: 0 }

/* Glass: the card carries the frost; the rows and bars sit on it in the Pane glass inks */
html[data-style="glass"] .ctv {
  --ctv-ink: var(--pane-ink); --ctv-surface: var(--pane-solid); --ctv-accent: var(--pane-accent); --ctv-shadow: var(--pane-shadow);
  --ctv-drop: 0 0 0 0 transparent; --ctv-ease: var(--pane-ease); --ctv-font: var(--pane-font);
  --ctv-t1: var(--pane-t1); --ctv-t2: var(--pane-t2); --ctv-t3: var(--pane-t3); --ctv-t4: var(--pane-t4);
  --ctv-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --ctv-guide: color-mix(in oklab, var(--pane-ink) 14%, transparent);
  --ctv-hov: color-mix(in oklab, var(--pane-ink) 6%, transparent);
  --ctv-sel: color-mix(in oklab, var(--pane-ink) 8%, transparent);
  --ctv-trk: color-mix(in oklab, var(--pane-ink) 9%, transparent);
  --ctv-bar: color-mix(in oklab, var(--pane-ink) 66%, transparent);
}
html[data-style="glass"] .ctv-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .ctv-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .ctv-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .ctv-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .ctv-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .ctv-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.ctv *, .ctv *::before, .ctv *::after { box-sizing: border-box }
:where(.ctv) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.ctv) p, :where(.ctv) ul, :where(.ctv) li { margin: 0; padding: 0; list-style: none }
.ctv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.ctv-card { --ctv-step: 16px; --ctv-chw: 16px; --ctv-chm: 6px; --ctv-bw: 40px; --ctv-pad: 24px; padding: 22px var(--ctv-pad) 14px; border-radius: 24px; background: var(--ctv-surface); box-shadow: var(--ctv-shadow), var(--ctv-drop) }

/* Header: the whole change as a sentence, then its lines */
.ctv-cap { color: var(--ctv-t2); font-size: 13px; line-height: 20px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ctv-big { font-size: clamp(22px, 6.6cqw, 28px); line-height: 1.18; font-weight: 500; letter-spacing: -.022em; color: var(--ctv-t1); text-wrap: balance; font-variant-numeric: tabular-nums }
.ctv-nw { white-space: nowrap }
.ctv-tot { display: flex; gap: 10px; margin-top: 6px; font-size: 17px; line-height: 24px; color: var(--ctv-t2); font-variant-numeric: tabular-nums; letter-spacing: -.005em }

/* Plain text actions */
.ctv-acts { display: flex; align-items: center; gap: 4px; margin: 14px -8px 6px; padding-top: 10px; border-top: 1px solid var(--ctv-line) }
.ctv-act { height: 28px; padding: 0 8px; border-radius: 8px; font-size: 13px; color: var(--ctv-t2); white-space: nowrap; transition: background-color .2s var(--ctv-ease), color .2s var(--ctv-ease) }
.ctv-act:first-child { margin-right: auto }
@media (hover: hover) { .ctv-act:not(:disabled):hover { background: var(--ctv-hov); color: var(--ctv-t1) } }
.ctv-act:not(:disabled):active { background: var(--ctv-sel) }
.ctv-act:disabled { cursor: default; color: var(--ctv-t4) }
.ctv-act:focus-visible { outline: 2px solid var(--ctv-accent); outline-offset: -2px }

/* The tree */
.ctv-tree { margin: 0 -8px }
.ctv-tree:focus { outline: none }
.ctv-item:focus { outline: none }
.ctv-row {
  --ctv-ind: calc(var(--lv) * var(--ctv-step));
  position: relative; display: flex; align-items: center; height: 32px; padding: 0 8px 0 calc(8px + var(--ctv-ind)); border-radius: 8px;
  cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; transition: background-color .2s var(--ctv-ease);
}
@media (hover: hover) { .ctv-row:hover { background: var(--ctv-hov) } }
.ctv-row:active { background: var(--ctv-sel) }
.ctv-item:focus-visible > .ctv-row { outline: 2px solid var(--ctv-accent); outline-offset: -2px }
.ctv-row[data-sel] { background: var(--ctv-sel) }
/* the accent hairline that marks the selected file */
.ctv-row[data-sel]::before { content: ""; position: absolute; left: 0; top: 7px; bottom: 7px; width: 2px; border-radius: 2px; background: var(--ctv-accent) }

.ctv-chev { flex: none; display: grid; place-items: center; width: var(--ctv-chw); height: 16px; margin-right: var(--ctv-chm); color: var(--ctv-t3); transition: transform .32s var(--ctv-ease) }
.ctv-chev svg { width: 14px; height: 14px }
.ctv-item[aria-expanded="true"] > .ctv-row .ctv-chev { transform: rotate(90deg) }

.ctv-main { flex: 1; min-width: 0; overflow: hidden; display: flex; align-items: baseline; gap: 8px }
/* Middle truncation: the head of a long name gives way first, the tail (file name, extension) always shows */
.ctv-nm { flex: 0 1 auto; min-width: 0; display: flex; white-space: nowrap; color: var(--ctv-t1) }
.ctv-hd { flex: 0 1 auto; min-width: 1ch; overflow: hidden; text-overflow: ellipsis }
.ctv-tl { flex: none }
.ctv-item[data-dir] > .ctv-row .ctv-nm { color: var(--ctv-t2) }
.ctv-row[data-sel] .ctv-nm { font-weight: 500 }
.ctv-row[data-st="deleted"] .ctv-nm { color: var(--ctv-t3) }
.ctv-row[data-st="deleted"] .ctv-hd, .ctv-row[data-st="deleted"] .ctv-tl { text-decoration: line-through; text-decoration-thickness: 1px; text-decoration-color: var(--ctv-t2) }
.ctv-kd { flex: 0 1000 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; color: var(--ctv-t3) }

/* Counts and bar, in fixed columns so every row lines up */
.ctv-n { flex: none; display: flex; gap: 6px; margin-left: 12px; font-size: 12.5px; color: var(--ctv-t2); font-variant-numeric: tabular-nums; white-space: nowrap }
.ctv-a { min-width: 4ch; text-align: right }
.ctv-r { min-width: 3.5ch; text-align: right }
.ctv-b { flex: none; position: relative; width: var(--ctv-bw); height: 6px; margin-left: 10px; border-radius: 1.5px; background: var(--ctv-trk); overflow: hidden }
.ctv-bi { display: flex; height: 100%; border-radius: 1.5px; overflow: hidden; transform-origin: left; animation: ctv-grow .56s var(--ctv-ease) calc(120ms + var(--i) * 28ms) backwards }
.ctv-ba { flex: none; height: 100%; background: var(--ctv-bar) }
.ctv-br { flex: none; height: 100%; background: repeating-linear-gradient(-45deg, var(--ctv-bar) 0 1px, transparent 1px 2.6px) }
.ctv-b[data-none] { visibility: hidden }
@keyframes ctv-grow { from { transform: scaleX(0) } }

/* A folder shows the sum of its files only while closed */
.ctv-item[data-dir] > .ctv-row :is(.ctv-n, .ctv-kd) { opacity: 0; transition: opacity .2s var(--ctv-ease) }
.ctv-item[data-dir][aria-expanded="false"] > .ctv-row :is(.ctv-n, .ctv-kd) { opacity: 1; transition-delay: .08s }

/* Opening a folder is one eased height change: a one-row grid whose track goes from 0fr to 1fr */
.ctv-grp { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s var(--ctv-ease) }
.ctv-grp[data-open] { grid-template-rows: 1fr }
.ctv-clip { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s linear .32s }
.ctv-grp[data-open] > .ctv-clip { visibility: visible; transition-delay: 0s }
.ctv-sub { position: relative }
/* a hairline guide under each open folder's chevron */
.ctv-sub::before { content: ""; position: absolute; top: 2px; bottom: 6px; left: calc(8px + (var(--lv) - 1) * var(--ctv-step) + var(--ctv-chw) / 2 - .5px); width: 1px; background: var(--ctv-guide) }

.ctv-empty { padding: 10px 0 8px; color: var(--ctv-t3); font-size: 13px }

@container (max-width: 388px) {
  .ctv-card { --ctv-pad: 20px; padding: 20px var(--ctv-pad) 12px; border-radius: 20px }
  .ctv-card { --ctv-bw: 32px }
  .ctv-b { margin-left: 8px }
  .ctv-n { margin-left: 8px; gap: 4px }
}
/* a phone-width sidebar: tighter steps, so names keep their room */
@container (max-width: 340px) {
  .ctv-card { --ctv-step: 12px; --ctv-chw: 14px; --ctv-chm: 4px; --ctv-bw: 26px }
  .ctv-b { margin-left: 6px }
  .ctv-n { margin-left: 6px }
}
@media (prefers-reduced-motion: reduce) {
  .ctv *, .ctv *::before, .ctv *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Sample change                               */
/* -------------------------------------------------------------------------- */

/** Atlas's change for "Cache user lookups": 9 files in 4 folders, +213 −58. */
export const CHANGE_TREE_SAMPLE: ChangeTreeFile[] = [
  { path: "src/api/users.ts", added: 42, removed: 7, status: "modified" },
  { path: "src/api/cache.ts", added: 58, removed: 0, status: "added" },
  { path: "src/api/client.ts", added: 6, removed: 4, status: "renamed", from: "src/api/http.ts" },
  { path: "src/api/types.ts", added: 9, removed: 8, status: "modified" },
  { path: "src/hooks/use-user.ts", added: 12, removed: 9, status: "modified" },
  { path: "src/hooks/use-retry.ts", added: 0, removed: 21, status: "deleted" },
  { path: "src/components/profile/profile-card.tsx", added: 18, removed: 6, status: "modified" },
  { path: "src/components/profile/profile-settings-panel.tsx", added: 4, removed: 3, status: "modified" },
  { path: "tests/api/users.test.ts", added: 64, removed: 0, status: "added" },
]

/* -------------------------------------------------------------------------- */
/*                                  The tree                                  */
/* -------------------------------------------------------------------------- */

type DirNode = { kind: "dir"; id: string; name: string; children: TreeNode[]; added: number; removed: number; count: number }
type FileNode = { kind: "file"; id: string; name: string; file: ChangeTreeFile }
type TreeNode = DirNode | FileNode

const clean = (p: string) => p.replace(/^\.?\/+/, "").replace(/\/+$/, "")
const dirOf = (p: string) => {
  const i = p.lastIndexOf("/")
  return i < 0 ? "" : p.slice(0, i)
}
const baseOf = (p: string) => p.slice(p.lastIndexOf("/") + 1)
const size = (n: TreeNode) => (n.kind === "dir" ? n.added + n.removed : n.file.added + n.file.removed)

/** Builds the tree from flat paths: sums each folder, folds a folder that holds one folder into it, sorts folders first. */
function buildTree(files: ChangeTreeFile[], sort: ChangeTreeSort): DirNode {
  const root: DirNode = { kind: "dir", id: "", name: "", children: [], added: 0, removed: 0, count: 0 }
  const dirs = new Map<string, DirNode>([["", root]])
  for (const f of files) {
    const path = clean(f.path)
    const parts = path.split("/")
    let parent = root
    let at = ""
    for (const seg of parts.slice(0, -1)) {
      at = at ? `${at}/${seg}` : seg
      let d = dirs.get(at)
      if (!d) {
        d = { kind: "dir", id: at, name: seg, children: [], added: 0, removed: 0, count: 0 }
        dirs.set(at, d)
        parent.children.push(d)
      }
      parent = d
    }
    parent.children.push({ kind: "file", id: path, name: parts[parts.length - 1], file: { ...f, path } })
  }
  const byName = (a: TreeNode, b: TreeNode) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  const finish = (d: DirNode) => {
    d.added = d.removed = d.count = 0
    for (let i = 0; i < d.children.length; i++) {
      let c = d.children[i]
      // a folder that only holds one folder becomes one line: "tests" + "api" -> "tests/api"
      while (c.kind === "dir" && c.children.length === 1 && c.children[0].kind === "dir") {
        const only: DirNode = c.children[0]
        c = { ...only, name: `${c.name}/${only.name}` }
      }
      d.children[i] = c
      if (c.kind === "dir") {
        finish(c)
        d.added += c.added
        d.removed += c.removed
        d.count += c.count
      } else {
        d.added += c.file.added
        d.removed += c.file.removed
        d.count += 1
      }
    }
    d.children.sort((a, b) => (a.kind !== b.kind ? (a.kind === "dir" ? -1 : 1) : sort === "size" ? size(b) - size(a) || byName(a, b) : byName(a, b)))
  }
  finish(root)
  return root
}

/** Splits a name so the head can shrink with an ellipsis while the tail stays: "profile-sett…panel.tsx". */
function splitName(name: string, dir: boolean): [string, string] {
  if (dir) {
    const i = name.lastIndexOf("/")
    return i < 0 ? ["", `${name}/`] : [name.slice(0, i + 1), `${name.slice(i + 1)}/`]
  }
  const dot = name.lastIndexOf(".")
  const ext = dot > 0 ? name.length - dot : 0
  const keep = Math.min(name.length, ext + 6)
  return [name.slice(0, name.length - keep), name.slice(name.length - keep)]
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const MINUS = "−"

function kindWord(f: ChangeTreeFile): string | null {
  if (f.status === "added") return "new"
  if (f.status === "deleted") return "deleted"
  if (f.status === "renamed") {
    if (!f.from) return "renamed"
    const from = clean(f.from)
    return `renamed from ${dirOf(from) === dirOf(f.path) ? baseOf(from) : from}`
  }
  return null
}

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

/* -------------------------------------------------------------------------- */
/*                          Agent bridge (inline stub)                        */
/* -------------------------------------------------------------------------- */

// Describes this piece to an agent: what it is, its state and the actions an agent may call.
// No import: the entry sits in a registry on globalThis that nothing reads until the app adds
// src/lib/agent-bridge.ts, so the piece works the same copied on its own. See docs/agent-operable.md.
type AgentArg = { name: string; type: "string" | "number" | "boolean"; enum?: readonly (string | number)[]; optional?: boolean; description?: string }
type AgentAction = {
  /** Goes through the piece's own handlers. May return a promise that resolves once the action has finished. */
  run: (args: Record<string, unknown>) => unknown
  args?: AgentArg[]
  description?: string
  /** Needs a person's approval. A string says what it does, for the person who is asked. */
  destructive?: boolean | string | ((args: Record<string, unknown>) => boolean | string)
  disabled?: boolean
}
type AgentNode = { id?: string; kind: string; label: string; value?: unknown; actions: Record<string, AgentAction> }
type AgentHost = { v: 1; nodes: Map<object, { el: () => Element | null; node: () => AgentNode }>; listeners: Set<(key: object) => void> }

function agentHost(): AgentHost {
  const g = globalThis as unknown as Record<symbol, AgentHost | undefined>
  return (g[Symbol.for("pane.agent")] ??= { v: 1, nodes: new Map(), listeners: new Set() })
}

function useAgentNode(el: React.RefObject<Element | null>, node: AgentNode) {
  const latest = React.useRef(node)
  const key = React.useRef<object | null>(null)
  React.useLayoutEffect(() => {
    latest.current = node
  })
  React.useEffect(() => {
    const host = agentHost()
    const k = (key.current = {})
    host.nodes.set(k, { el: () => el.current, node: () => latest.current })
    host.listeners.forEach((f) => f(k))
    return () => {
      host.nodes.delete(k)
      host.listeners.forEach((f) => f(k))
    }
  }, [el])
  // a change of state is reported, so the bridge can tag it as the agent's or the page's
  const sig = JSON.stringify(node.value)
  React.useEffect(() => {
    if (key.current) agentHost().listeners.forEach((f) => f(key.current!))
  }, [sig])
}

/* ------------------------------ end of stub ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                 ChangeTree                                 */
/* -------------------------------------------------------------------------- */

type Visible = { node: TreeNode; level: number; parent: string | null }

export function ChangeTree(props: ChangeTreeProps) {
  const {
    agent = "Atlas",
    files = CHANGE_TREE_SAMPLE,
    caption,
    title,
    sort: sortProp,
    defaultSort = "size",
    onSortChange,
    selected: selectedProp,
    defaultSelected = null,
    onSelect,
    defaultExpanded = true,
    label = "Changed files",
    agentId,
    className,
  } = props

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  const [innerSort, setInnerSort] = React.useState<ChangeTreeSort>(defaultSort)
  const sort = sortProp ?? innerSort
  const [innerSel, setInnerSel] = React.useState<string | null>(defaultSelected)
  const selected = selectedProp !== undefined ? selectedProp : innerSel

  const root = React.useMemo(() => buildTree(files, sort), [files, sort])

  // every folder id, every node's parent, and every node in tree order (for the bars' stagger)
  const { allDirs, parentOf, order } = React.useMemo(() => {
    const allDirs: string[] = []
    const parentOf = new Map<string, string | null>()
    const order = new Map<string, number>()
    const walk = (d: DirNode, parent: string | null) => {
      for (const c of d.children) {
        parentOf.set(c.id, parent)
        order.set(c.id, order.size)
        if (c.kind === "dir") {
          allDirs.push(c.id)
          walk(c, c.id)
        }
      }
    }
    walk(root, null)
    return { allDirs, parentOf, order }
  }, [root])

  // closed folders; anything not listed is open, so folders that arrive later start open
  const [closed, setClosed] = React.useState<Set<string>>(() => {
    if (defaultExpanded === true) return new Set()
    const open = new Set(defaultExpanded === false ? [] : defaultExpanded.map(clean))
    return new Set(allDirs.filter((d) => !open.has(d)))
  })

  const visible = React.useMemo(() => {
    const out: Visible[] = []
    const walk = (d: DirNode, level: number, parent: string | null) => {
      for (const c of d.children) {
        out.push({ node: c, level, parent })
        if (c.kind === "dir" && !closed.has(c.id)) walk(c, level + 1, c.id)
      }
    }
    walk(root, 0, null)
    return out
  }, [root, closed])
  const visIndex = React.useMemo(() => new Map(visible.map((v, i) => [v.node.id, i])), [visible])

  const [focusId, setFocusId] = React.useState<string | null>(null)
  // The one tab stop: the focused item, or its nearest visible folder when it was folded away, else the selection, else the first row.
  const nearestVisible = (id: string | null): string | null => {
    let cur = id
    while (cur !== null && cur !== undefined) {
      if (visIndex.has(cur)) return cur
      cur = parentOf.get(cur) ?? null
    }
    return null
  }
  const tabId = nearestVisible(focusId) ?? nearestVisible(selected) ?? visible[0]?.node.id ?? null

  const rootRef = React.useRef<HTMLDivElement>(null)
  const items = React.useRef(new Map<string, HTMLLIElement>())
  const typed = React.useRef({ text: "", at: 0 })
  const live = React.useRef(0)
  const [announce, setAnnounce] = React.useState("")
  const say = (t: string) => {
    live.current += 1
    setAnnounce(t + (live.current % 2 ? "" : "​"))
  }

  const fileCount = files.length
  const folderCount = new Set(files.map((f) => dirOf(clean(f.path)))).size
  const totalAdded = files.reduce((a, f) => a + f.added, 0)
  const totalRemoved = files.reduce((a, f) => a + f.removed, 0)
  const maxFile = Math.max(1, ...files.map((f) => f.added + f.removed))
  const sentence = title ?? (fileCount ? `${agent} changed ${plural(fileCount, "file")} in ${plural(folderCount, "folder")}` : `${agent} changed no files`)

  /* ---- actions ---- */
  const focusItem = (id: string) => {
    setFocusId(id)
    items.current.get(id)?.focus({ preventScroll: false })
  }
  const setOpen = (id: string, open: boolean) =>
    setClosed((s) => {
      if (s.has(id) === !open) return s
      const n = new Set(s)
      if (open) n.delete(id)
      else n.add(id)
      return n
    })
  const select = (f: ChangeTreeFile) => {
    if (selectedProp === undefined) setInnerSel(f.path)
    onSelect?.(f)
  }
  const activate = (n: TreeNode) => {
    if (n.kind === "dir") setOpen(n.id, closed.has(n.id))
    else select(n.file)
  }
  const expandAll = () => {
    setClosed(new Set())
    say("All folders open")
  }
  const collapseAll = () => {
    setClosed(new Set(allDirs))
    say("All folders closed")
  }
  const flipSort = () => {
    const next: ChangeTreeSort = sort === "size" ? "name" : "size"
    if (sortProp === undefined) setInnerSort(next)
    onSortChange?.(next)
    say(next === "size" ? "Sorted by size of change, largest first" : "Sorted by name")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || tabId === null) return
    const i = visIndex.get(tabId)
    if (i === undefined) return
    const cur = visible[i]
    const n = cur.node
    const isOpenDir = n.kind === "dir" && !closed.has(n.id)
    let handled = true
    switch (e.key) {
      case "ArrowDown":
        if (i < visible.length - 1) focusItem(visible[i + 1].node.id)
        break
      case "ArrowUp":
        if (i > 0) focusItem(visible[i - 1].node.id)
        break
      case "Home":
        focusItem(visible[0].node.id)
        break
      case "End":
        focusItem(visible[visible.length - 1].node.id)
        break
      case "ArrowRight":
        if (n.kind === "dir") {
          if (!isOpenDir) setOpen(n.id, true)
          else if (n.children[0]) focusItem(n.children[0].id)
        }
        break
      case "ArrowLeft":
        if (isOpenDir) setOpen(n.id, false)
        else if (cur.parent !== null) focusItem(cur.parent)
        break
      case "Enter":
      case " ":
        activate(n)
        break
      default: {
        // type-ahead: letters typed within half a second build one prefix
        if (e.key.length !== 1 || e.key === " " || e.key === "*") {
          handled = false
          break
        }
        const now = Date.now()
        const t = typed.current
        t.text = now - t.at > 500 ? e.key.toLowerCase() : t.text + e.key.toLowerCase()
        t.at = now
        const from = t.text.length === 1 ? i + 1 : i
        for (let k = 0; k < visible.length; k++) {
          const v = visible[(from + k) % visible.length]
          if (v.node.name.toLowerCase().startsWith(t.text)) {
            focusItem(v.node.id)
            break
          }
        }
      }
    }
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  /* ---- agent ---- */
  const filePaths = files.map((f) => clean(f.path))
  useAgentNode(rootRef, {
    id: agentId,
    kind: "change-tree",
    label: sentence,
    value: { selected, sort, closedFolders: [...closed], files: files.map((f) => ({ path: clean(f.path), added: f.added, removed: f.removed, status: f.status })) },
    actions: {
      select: {
        description: "Select a changed file, as a click on it would (a product opens its diff).",
        args: [{ name: "path", type: "string", enum: filePaths }],
        run: (a) => {
          const f = files.find((x) => clean(x.path) === a.path)
          if (f) select({ ...f, path: clean(f.path) })
        },
      },
      expandAll: { description: "Open every folder.", run: expandAll, disabled: closed.size === 0 },
      collapseAll: { description: "Close every folder; closed folders show the sum of their files.", run: collapseAll, disabled: closed.size === allDirs.length },
      sort: {
        description: "Sort the files by size of change or by name (folders stay first).",
        args: [{ name: "by", type: "string", enum: ["size", "name"] }],
        run: (a) => {
          if (a.by !== sort) flipSort()
        },
      },
    },
  })

  /* ---- render ---- */
  const renderNode = (n: TreeNode, level: number): React.ReactNode => {
    const isDir = n.kind === "dir"
    const open = isDir && !closed.has(n.id)
    const sel = !isDir && selected === n.id
    const added = isDir ? n.added : n.file.added
    const removed = isDir ? n.removed : n.file.removed
    const word = isDir ? plural(n.count, "file") : kindWord(n.file)
    const [head, tail] = splitName(n.name, isDir)
    const spoken = `${isDir ? `${n.name}/` : n.name}${word ? `, ${word}` : ""}, ${added} added, ${removed} removed`
    return (
      <li
        key={n.id}
        ref={(el) => {
          if (el) items.current.set(n.id, el)
          else items.current.delete(n.id)
        }}
        className="ctv-item"
        role="treeitem"
        aria-level={level + 1}
        aria-expanded={isDir ? open : undefined}
        aria-selected={isDir ? undefined : sel}
        aria-label={spoken}
        tabIndex={n.id === tabId ? 0 : -1}
        data-dir={isDir || undefined}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setFocusId(n.id)
        }}
      >
        <div
          className="ctv-row"
          style={{ "--lv": level } as React.CSSProperties}
          data-sel={sel || undefined}
          data-st={isDir ? undefined : n.file.status}
          title={isDir ? `${n.id}/` : `${n.id}${word ? ` (${word})` : ""}`}
          onClick={() => {
            focusItem(n.id)
            activate(n)
          }}
        >
          <span className="ctv-chev" aria-hidden>
            {isDir && <ChevronRight strokeWidth={1.75} />}
          </span>
          <span className="ctv-main">
            <span className="ctv-nm">
              {head && <span className="ctv-hd">{head}</span>}
              <span className="ctv-tl">{tail}</span>
            </span>
            {word && <span className="ctv-kd">{word}</span>}
          </span>
          <span className="ctv-n" aria-hidden>
            <span className="ctv-a">{added ? `+${added}` : ""}</span>
            <span className="ctv-r">{removed ? `${MINUS}${removed}` : ""}</span>
          </span>
          <span className="ctv-b" aria-hidden data-none={isDir || undefined}>
            {!isDir && (
              <span className="ctv-bi" style={{ "--i": order.get(n.id) ?? 0 } as React.CSSProperties}>
                <span className="ctv-ba" style={{ width: `${(added / maxFile) * 100}%` }} />
                <span className="ctv-br" style={{ width: `${(removed / maxFile) * 100}%` }} />
              </span>
            )}
          </span>
        </div>
        {isDir && (
          <div className="ctv-grp" data-open={open || undefined}>
            <div className="ctv-clip" inert={!open}>
              <ul className="ctv-sub" role="group" style={{ "--lv": level + 1 } as React.CSSProperties}>
                {n.children.map((c) => renderNode(c, level + 1))}
              </ul>
            </div>
          </div>
        )}
      </li>
    )
  }

  return (
    <div ref={rootRef} className={cn("ctv", className)} data-reduce={reduce || undefined}>
      <style href="change-tree" precedence="default">
        {CSS}
      </style>
      <p className="ctv-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <section className="ctv-card" aria-label={sentence}>
        {caption && <p className="ctv-cap">{caption}</p>}
        <p className="ctv-big">
          {title !== undefined || !fileCount ? (
            sentence
          ) : (
            // each count stays with its noun, so the sentence breaks as "Atlas changed 9 files / in 4 folders"
            <>
              {agent} changed <span className="ctv-nw">{plural(fileCount, "file")}</span> in <span className="ctv-nw">{plural(folderCount, "folder")}</span>
            </>
          )}
        </p>
        {fileCount > 0 && (
          <p className="ctv-tot">
            <span aria-hidden>+{totalAdded}</span>
            <span aria-hidden>
              {MINUS}
              {totalRemoved}
            </span>
            <span className="ctv-sr">
              {plural(totalAdded, "line")} added, {totalRemoved} removed
            </span>
          </p>
        )}
        {fileCount > 0 ? (
          <>
            <div className="ctv-acts">
              <button type="button" className="ctv-act" onClick={flipSort} aria-label={sort === "size" ? "Sorted by size, largest first. Sort by name" : "Sorted by name. Sort by size"}>
                {sort === "size" ? "Largest first" : "A to Z"}
              </button>
              <button type="button" className="ctv-act" onClick={expandAll} disabled={closed.size === 0 || allDirs.length === 0}>
                Expand all
              </button>
              <button type="button" className="ctv-act" onClick={collapseAll} disabled={allDirs.length === 0 || closed.size === allDirs.length}>
                Collapse all
              </button>
            </div>
            <ul className="ctv-tree" role="tree" aria-label={label} onKeyDown={onKeyDown}>
              {root.children.map((c) => renderNode(c, 0))}
            </ul>
          </>
        ) : (
          <p className="ctv-empty">Nothing to review.</p>
        )}
      </section>
    </div>
  )
}
