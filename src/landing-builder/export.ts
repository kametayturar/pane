// Landing Builder: the three exports – install command, page file and a prompt for a coding agent.
import { darkAccent, isHex, onAccent } from "./color"
import { changedProps, resolveProps, type LandingDoc, type Registry } from "./doc"
import type { Content } from "./schema"
import { SITE } from "./sections"
import { cleanLine, commentSafe } from "./validate"

const visible = (doc: LandingDoc, reg: Registry) => doc.sections.filter((s) => !s.hidden && reg.has(s.slug))

/** Slugs of the visible sections, taken from the registry entries (never from the document's own strings). */
export function usedSlugs(doc: LandingDoc, reg: Registry): string[] {
  return [...new Set(visible(doc, reg).map((s) => reg.get(s.slug)!.slug))]
}

/** The accent, only ever written out as a validated hex colour. */
const safeAccent = (doc: LandingDoc) => (isHex(doc.brand.accent) ? doc.brand.accent.toLowerCase() : "#0060e2")

/* --------------------------------- install -------------------------------- */

export function installCommand(doc: LandingDoc, reg: Registry): string {
  const urls = usedSlugs(doc, reg).map((s) => `${SITE}/r/${s}.json`)
  if (!urls.length) return "# Add a section first."
  return ["npx shadcn@latest add", ...urls].join(" \\\n  ")
}

/* ------------------------------- TS literals ------------------------------- */

const pad = (n: number) => "  ".repeat(n)
const IDENT = /^[A-Za-z_$][\w$]*$/

/**
 * A string as a TypeScript literal: JSON.stringify, plus escapes for the line and paragraph separators and "</"
 * so the output is safe to paste anywhere, including inside an HTML script tag.
 */
export function str(v: string): string {
  return JSON.stringify(v).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/<\//g, "<\\/")
}

/** A value as a TypeScript literal, on one line when it fits, otherwise one entry per line. */
export function literal(v: unknown, depth: number, room = 80): string {
  if (v === null) return "null"
  if (typeof v === "string") return str(v)
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "0"
  if (typeof v === "boolean") return String(v)
  if (Array.isArray(v)) {
    if (!v.length) return "[]"
    const one = `[${v.map((x) => literal(x, 0, Infinity)).join(", ")}]`
    if (one.length <= room && !one.includes("\n")) return one
    return `[\n${v.map((x) => pad(depth + 1) + literal(x, depth + 1, room - 2)).join(",\n")},\n${pad(depth)}]`
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Content).filter(([, x]) => x !== undefined)
    if (!entries.length) return "{}"
    const key = (k: string) => (IDENT.test(k) ? k : str(k))
    const one = `{ ${entries.map(([k, x]) => `${key(k)}: ${literal(x, 0, Infinity)}`).join(", ")} }`
    if (one.length <= room) return one
    return `{\n${entries.map(([k, x]) => `${pad(depth + 1)}${key(k)}: ${literal(x, depth + 1, room - 2)}`).join(",\n")},\n${pad(depth)}}`
  }
  return "undefined"
}

/** Plain JSX attribute strings only for a strict set of characters; anything else goes through `str`. */
const PLAIN_ATTR = /^[\p{L}\p{N} .,:;!?'’“”()\-–—·/#@%+=©×_]*$/u

function jsxProp(name: string, v: unknown, depth: number): string {
  // Prop names come from the section's default content keys (validated on import), never free text.
  if (!IDENT.test(name)) return ""
  if (v === true) return name
  if (typeof v === "string" && PLAIN_ATTR.test(v)) return `${name}="${v}"`
  return `${name}={${literal(v, depth, 96 - depth * 2 - name.length)}}`
}

/* -------------------------------- page file -------------------------------- */

export function pageFile(doc: LandingDoc, reg: Registry): string {
  const secs = visible(doc, reg)
  const accent = safeAccent(doc)
  const dark = darkAccent(accent)
  const on = onAccent(accent)
  const name = commentSafe(doc.brand.name) || "the product"

  const imports = usedSlugs(doc, reg).map((slug) => `import { ${reg.get(slug)!.exportName} } from "@/components/blocks/${slug}"`)

  const onAccentLines: string[] = []
  if (on !== "#ffffff") {
    const vars = [...new Set(secs.flatMap((s) => reg.get(s.slug)!.onAccent ?? []))]
    if (vars.length) onAccentLines.push(` * Your accent is light, so text on accent buttons should be dark:`, ` *   ${vars.map((v) => `html .${v.slice(2).split("-")[0]} { ${v}: ${on} }`).join("\n *   ")}`)
  }

  const header = [
    "/**",
    ` * Landing page for ${name}, assembled in the Pane Landing Builder (${SITE}/#/landing-builder).`,
    " *",
    " * Accent: every section reads Pane's accent token, so set it once in your global CSS:",
    ` *   :root { --pane-accent: ${accent} }`,
    ` *   .dark { --pane-accent: ${dark} }`,
    ...onAccentLines,
    " *",
    " * Install the sections first (the Export panel's Install command), then render this page at your root route.",
    " */",
  ]

  const body = secs.map((s) => {
    const def = reg.get(s.slug)!
    const props = Object.entries(changedProps(def, s.content, doc.brand)).filter(([k]) => IDENT.test(k))
    if (!props.length) return `      <${def.exportName} />`
    const inline = props.map(([k, v]) => jsxProp(k, v, 4))
    const one = `      <${def.exportName} ${inline.join(" ")} />`
    if (one.length <= 100 && !one.includes("\n")) return one
    return [`      <${def.exportName}`, ...props.map(([k, v]) => `        ${jsxProp(k, v, 4)}`), "      />"].join("\n")
  })

  return [
    ...header,
    ...imports,
    "",
    "export default function LandingPage() {",
    "  return (",
    "    <>",
    ...(body.length ? body : ["      {/* Add sections in the builder. */}"]),
    "    </>",
    "  )",
    "}",
    "",
  ].join("\n")
}

/* --------------------------------- prompt --------------------------------- */

export function agentPrompt(doc: LandingDoc, reg: Registry): string {
  const secs = visible(doc, reg)
  const name = cleanLine(doc.brand.name).trim() || "the product"
  const base = cleanLine(doc.brand.baseUrl, 200).trim()
  const lines = secs.map((s, i) => {
    const def = reg.get(s.slug)!
    const summary = def.summary(resolveProps(def, s.content, doc.brand))
    return `${i + 1}. ${def.slug}${summary ? `: ${cleanLine(summary, 600)}` : ""}`
  })
  return [
    `Build the landing page for ${name} with Pane (${SITE}), a library of one-file React + Tailwind v4 sections.`,
    "",
    `Connect the Pane MCP server first: ${SITE}/api/mcp`,
    `(Claude Code: claude mcp add --transport http pane ${SITE}/api/mcp). Use it to read each section's props, then install them:`,
    installCommand(doc, reg),
    "",
    "Sections, top to bottom, with their key copy (pass it through each section's props):",
    ...lines,
    "",
    `Accent: ${safeAccent(doc)}. Set --pane-accent on :root and ${darkAccent(safeAccent(doc))} under .dark.${base ? ` Links that start with / point at ${base}.` : ""}`,
    "",
    "Taste:",
    "- Type carries the page: two-tone headlines, one plain sentence each, specific proof instead of adjectives.",
    "- One accent, ink-alpha neutrals, hairlines and air; no gradients, glows, emoji, coloured pills or tinted notice boxes.",
    "- Sections arrive once as they scroll in and nothing loops for decoration; respect reduced motion.",
  ].join("\n")
}
