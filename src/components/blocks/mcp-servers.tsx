"use client"

import * as React from "react"
import {
  ArrowLeft,
  ArrowLeftRight,
  Bot,
  Cable,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Cloud,
  CreditCard,
  Database,
  Eye,
  FileText,
  GitBranch,
  Info,
  KeyRound,
  LifeBuoy,
  ListChecks,
  LoaderCircle,
  Mail,
  MessageSquare,
  NotebookText,
  Pencil,
  PenTool,
  Plug,
  Plus,
  Rocket,
  Search,
  Siren,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type McpTool = {
  /** Stable id, usually the tool name. */
  id: string
  /** The name the model sees, for example `create_issue`. Shown in the mono face. */
  name: string
  /** Read tools only fetch; write tools change something. Shown as an icon and a word. */
  access: "read" | "write"
  /** Tokens the tool's name, description and input schema take in context. */
  tokens: number
  /** Whether the tool is loaded into the agent's context. Defaults to on for read tools and off for write tools. */
  enabled?: boolean
}

export type McpPermission = "ask" | "allow-reads"

export type McpServer = {
  id: string
  name: string
  /** Picks the neutral glyph in the tile: repo, tracker, notes, chat, alerts, payments, database, design, deploy, cloud, docs, mail, calendar, analytics, support. Anything else gets the generic MCP mark. */
  brand?: string
  /** Your own mark. Replaces the glyph. */
  icon?: React.ReactNode
  transport: "remote" | "local"
  endpoint?: string
  status: "connected" | "needs-auth" | "error"
  /** Short message shown for a server in `error`. */
  error?: string
  /** What the agent does before running one of this server's tools. Defaults to `ask`. */
  permission?: McpPermission
  scopes?: string[]
  tools: McpTool[]
}

export type McpDirectoryEntry = {
  id: string
  name: string
  brand?: string
  icon?: React.ReactNode
  /** One line shown under the name. */
  description: string
  transport: "remote" | "local"
  endpoint?: string
  /** OAuth entries show the authorize step first. */
  auth: "oauth" | "none"
  scopes?: string[]
  tools: McpTool[]
}

export type McpConnectRequest = {
  kind: "directory" | "url" | "reconnect" | "retry"
  serverId: string
  name: string
  transport: "remote" | "local"
  endpoint?: string
}

export type McpServersProps = {
  /** The agent's servers. Leave it out for the simulated demo; passing a new array replaces the list. */
  servers?: McpServer[]
  /** What Add server offers. Entries whose id is already in the list read Added. */
  directory?: McpDirectoryEntry[]
  /** Tokens of context you are willing to spend on tool definitions. Past it the bar rescales and the overflow turns amber. */
  budget?: number
  /** Heading of the card. */
  title?: string
  /** Your agent's name on the authorize screen. */
  clientName?: string
  /** The signed in person shown on the authorize screen. */
  account?: { name: string; email: string; avatar?: string }
  /** Called when a tool is switched on or off in a server's list. */
  onToggleTool?: (serverId: string, toolId: string, enabled: boolean) => void
  /**
   * Called when a server connects. For OAuth servers it runs when Authorize is pressed, so open your consent window here.
   * Resolve with the tools the server reported, or with nothing to use the directory's tools. A rejection shows the error
   * with Try again. Without it the whole flow is simulated.
   */
  onConnect?: (request: McpConnectRequest) => void | McpTool[] | Promise<void | McpTool[]>
  /** Called once a removal's undo window closes (about 6 seconds, paused while the pointer or focus rests on the bar), or when another remove starts. */
  onRemove?: (serverId: string) => void
  /** Called when a server's default for tool calls changes. */
  onPermissionChange?: (serverId: string, permission: McpPermission) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

const t = (name: string, access: "read" | "write", tokens: number, enabled?: boolean): McpTool => ({
  id: name,
  name,
  access,
  tokens,
  enabled,
})

const DEFAULT_SERVERS: McpServer[] = [
  {
    id: "atlas",
    name: "Atlas Repos",
    brand: "repo",
    transport: "remote",
    endpoint: "https://mcp.atlas.example/repos/",
    status: "connected",
    permission: "allow-reads",
    tools: [
      t("search_code", "read", 420),
      t("get_pull_request", "read", 290),
      t("list_issues", "read", 400),
      t("create_issue", "write", 420, true),
      t("create_pull_request", "write", 640, true),
      t("merge_pull_request", "write", 360, false),
    ],
  },
  {
    id: "orbit",
    name: "Orbit Tracker",
    brand: "tracker",
    transport: "remote",
    endpoint: "https://mcp.orbit.example/v2",
    status: "connected",
    tools: [
      t("list_tasks", "read", 310),
      t("get_task", "read", 260),
      t("search_tasks", "read", 430),
      t("create_task", "write", 380, false),
      t("update_task", "write", 360, false),
    ],
  },
  {
    id: "sage",
    name: "Sage Notes",
    brand: "notes",
    transport: "remote",
    endpoint: "https://mcp.sagenotes.example/",
    status: "needs-auth",
    scopes: ["Read your pages and databases", "Create and edit pages when you allow it"],
    tools: [t("search_pages", "read", 300), t("read_page", "read", 250), t("create_page", "write", 400)],
  },
  {
    id: "relay",
    name: "Relay Chat",
    brand: "chat",
    transport: "remote",
    endpoint: "https://mcp.relay.example/chat",
    status: "connected",
    tools: [
      t("list_channels", "read", 250),
      t("read_thread", "read", 330),
      t("search_messages", "read", 420),
      t("post_message", "write", 380, false),
    ],
  },
  {
    id: "beacon",
    name: "Beacon Alerts",
    brand: "alerts",
    transport: "remote",
    endpoint: "https://mcp.beacon.example/alerts",
    status: "error",
    error: "The server closed the connection during tools/list.",
    tools: [t("list_alerts", "read", 280), t("get_event", "read", 330), t("resolve_alert", "write", 310)],
  },
  {
    id: "ledger",
    name: "Ledger Pay",
    brand: "payments",
    transport: "remote",
    endpoint: "https://mcp.ledgerpay.example/",
    status: "connected",
    tools: [
      t("list_invoices", "read", 320),
      t("get_customer", "read", 290),
      t("create_refund", "write", 410, false),
      t("create_invoice", "write", 360, false),
    ],
  },
  {
    id: "tidepool",
    name: "Tidepool DB",
    brand: "database",
    transport: "local",
    endpoint: "stdio: tidepool-mcp --read-only",
    status: "connected",
    tools: [t("list_tables", "read", 180), t("describe_table", "read", 220), t("run_query", "read", 330)],
  },
  {
    id: "canvas",
    name: "Canvas Studio",
    brand: "design",
    transport: "local",
    endpoint: "stdio: canvas-mcp",
    status: "connected",
    tools: [t("get_frame", "read", 420), t("export_asset", "read", 430), t("update_text", "write", 300, false)],
  },
]

const DEFAULT_DIRECTORY: McpDirectoryEntry[] = [
  {
    id: "deployhub",
    name: "Deploy Hub",
    brand: "deploy",
    description: "Deployments, build logs and project settings",
    transport: "remote",
    endpoint: "https://mcp.deployhub.example",
    auth: "oauth",
    scopes: ["Read projects, deployments and build logs", "Create preview deployments"],
    tools: [
      t("list_projects", "read", 240),
      t("list_deployments", "read", 310),
      t("get_build_logs", "read", 380),
      t("create_deployment", "write", 460),
      t("promote_deployment", "write", 330),
    ],
  },
  {
    id: "lakeview",
    name: "Lakeview Data",
    brand: "database",
    description: "Tables, SQL and edge functions",
    transport: "remote",
    endpoint: "https://mcp.lakeview.example",
    auth: "oauth",
    tools: [t("list_tables", "read", 190), t("run_sql", "read", 360), t("apply_migration", "write", 520)],
  },
  {
    id: "pulse",
    name: "Pulse Metrics",
    brand: "analytics",
    description: "Metrics, monitors and logs",
    transport: "remote",
    endpoint: "https://mcp.pulse.example",
    auth: "oauth",
    tools: [t("query_metrics", "read", 420), t("list_monitors", "read", 260), t("mute_monitor", "write", 290)],
  },
  {
    id: "edgeworks",
    name: "Edgeworks",
    brand: "cloud",
    description: "Workers, KV namespaces and DNS records",
    transport: "remote",
    endpoint: "https://mcp.edgeworks.example",
    auth: "oauth",
    tools: [t("list_workers", "read", 230), t("read_kv", "read", 200), t("update_dns_record", "write", 380)],
  },
  {
    id: "stackdrive",
    name: "Stack Drive",
    brand: "docs",
    description: "Search and read files in shared drives",
    transport: "remote",
    endpoint: "https://mcp.stackdrive.example",
    auth: "oauth",
    tools: [t("search_files", "read", 270), t("read_file", "read", 240), t("create_file", "write", 330)],
  },
  {
    id: "teamwiki",
    name: "Team Wiki",
    brand: "docs",
    description: "Pages, spaces and page history",
    transport: "remote",
    endpoint: "https://mcp.teamwiki.example",
    auth: "oauth",
    tools: [t("search_pages", "read", 280), t("get_page", "read", 230), t("update_page", "write", 410)],
  },
  {
    id: "reachcrm",
    name: "Reach CRM",
    brand: "support",
    description: "Contacts, companies and deals",
    transport: "remote",
    endpoint: "https://mcp.reach.example",
    auth: "oauth",
    tools: [t("search_contacts", "read", 300), t("get_deal", "read", 250), t("log_note", "write", 340)],
  },
  {
    id: "mailroom",
    name: "Mailroom",
    brand: "mail",
    description: "Read, search and draft email",
    transport: "remote",
    endpoint: "https://mcp.mailroom.example",
    auth: "oauth",
    tools: [t("search_mail", "read", 310), t("read_message", "read", 260), t("create_draft", "write", 350)],
  },
  {
    id: "daybook",
    name: "Daybook",
    brand: "calendar",
    description: "Events and availability",
    transport: "local",
    endpoint: "stdio: daybook-mcp",
    auth: "none",
    tools: [t("list_events", "read", 260), t("find_free_time", "read", 300), t("create_event", "write", 390)],
  },
]

const DEFAULT_ACCOUNT = { name: "Maya Brooks", email: "maya@northwind.example" }

/* -------------------------------------------------------------------------- */
/*                                   Marks                                    */
/* -------------------------------------------------------------------------- */

const GLYPHS: Record<string, LucideIcon> = {
  repo: GitBranch,
  tracker: ListChecks,
  notes: NotebookText,
  chat: MessageSquare,
  alerts: Siren,
  payments: CreditCard,
  database: Database,
  design: PenTool,
  deploy: Rocket,
  cloud: Cloud,
  docs: FileText,
  mail: Mail,
  calendar: CalendarDays,
  analytics: ChartNoAxesColumn,
  support: LifeBuoy,
}

function Mark({ brand, icon, size = 24 }: { brand?: string; icon?: React.ReactNode; size?: number }) {
  const Glyph = (brand && GLYPHS[brand]) || Plug
  return (
    <span className="mcs-mark" style={{ width: size, height: size }} aria-hidden>
      {icon ?? <Glyph size={Math.round(size * 0.6)} strokeWidth={1.75} />}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mcs {
  --mcs-ink: #000;
  --mcs-surface: #fff;
  --mcs-accent: #0060e2;
  --mcs-ok: #16803c;
  --mcs-warn: #b06a00;
  --mcs-err: #cb3a2e;
  --mcs-t1: color-mix(in oklab, var(--mcs-ink) 88%, transparent);
  --mcs-t2: color-mix(in oklab, var(--mcs-ink) 61%, transparent);
  --mcs-t3: color-mix(in oklab, var(--mcs-ink) 45%, transparent);
  --mcs-t4: color-mix(in oklab, var(--mcs-ink) 27%, transparent);
  --mcs-fill: color-mix(in oklab, var(--mcs-ink) 4.5%, transparent);
  --mcs-fill2: color-mix(in oklab, var(--mcs-ink) 8%, transparent);
  --mcs-line: color-mix(in oklab, var(--mcs-ink) 7%, transparent);
  --mcs-ring: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --mcs-sheet-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --mcs-scrim: rgb(0 0 0 / .16);
  --mcs-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--mcs-surface);
  color: var(--mcs-t1);
  border: 1px solid color-mix(in oklab, var(--mcs-ink) 7.5%, transparent);
  border-radius: 24px;
  overflow: clip;
  font-family: var(--mcs-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
.mcs[data-sheet] { min-height: 600px }
:is(.dark, [data-theme="dark"]) .mcs {
  --mcs-ink: #fff;
  --mcs-surface: #1c1c1e;
  --mcs-accent: #4d8dff;
  --mcs-ok: #4cc77e;
  --mcs-warn: #f0a63a;
  --mcs-err: #ff6f61;
  --mcs-t1: color-mix(in oklab, var(--mcs-ink) 90%, transparent);
  --mcs-t2: color-mix(in oklab, var(--mcs-ink) 62%, transparent);
  --mcs-t3: color-mix(in oklab, var(--mcs-ink) 46%, transparent);
  --mcs-t4: color-mix(in oklab, var(--mcs-ink) 28%, transparent);
  --mcs-fill: color-mix(in oklab, var(--mcs-ink) 6%, transparent);
  --mcs-fill2: color-mix(in oklab, var(--mcs-ink) 10%, transparent);
  --mcs-line: color-mix(in oklab, var(--mcs-ink) 8%, transparent);
  --mcs-ring: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4);
  --mcs-sheet-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 20px 48px 0 rgb(0 0 0 / .55);
  --mcs-scrim: rgb(0 0 0 / .5);
}
.mcs *, .mcs *::before, .mcs *::after { box-sizing: border-box }
:where(.mcs) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.mcs) input { font: inherit; color: inherit }
.mcs :focus-visible { outline: 2px solid color-mix(in oklab, var(--mcs-accent) 60%, transparent); outline-offset: 1px }
:where(.mcs) ul { list-style: none; margin: 0; padding: 0 }
:where(.mcs) :is(h2, h3, p) { margin: 0 }
.mcs-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.mcs-mono { font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace }
.mcs-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.mcs-header { padding: 18px 20px 18px; display: flex; flex-direction: column; gap: 16px }
.mcs-titlerow { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px }
.mcs-title { display: flex; align-items: center; gap: 10px; font-size: 16px; line-height: 17.6px; font-weight: 500; color: var(--mcs-t1) }
.mcs-title svg { color: var(--mcs-t1) }
.mcs-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 36px; padding: 0 14px 0 12px; border-radius: 18px;
  font-weight: 500; white-space: nowrap; color: var(--mcs-t1);
  background: var(--mcs-surface); box-shadow: var(--mcs-ring);
  transition: background-color .18s var(--mcs-ease), transform .18s var(--mcs-ease), opacity .18s var(--mcs-ease);
}
@media (hover: hover) { .mcs-btn:hover { background: color-mix(in oklab, var(--mcs-surface) 94%, var(--mcs-ink)) } }
.mcs-btn:active { transform: scale(.97) }
.mcs-btn[data-variant="primary"] { background: color-mix(in oklab, var(--mcs-ink) 90%, var(--mcs-surface)); color: var(--mcs-surface); box-shadow: none; padding: 0 18px; height: 40px; border-radius: 20px }
@media (hover: hover) { .mcs-btn[data-variant="primary"]:hover { background: var(--mcs-ink) } }
.mcs-btn[data-variant="primary"][disabled] { opacity: .35; cursor: default; transform: none }
.mcs-btn[data-variant="ghost"] { background: none; box-shadow: none; color: var(--mcs-t2); padding: 0 12px; height: 40px; border-radius: 20px }
@media (hover: hover) { .mcs-btn[data-variant="ghost"]:hover { background: var(--mcs-fill); color: var(--mcs-t1) } }
.mcs-btn[data-size="sm"] { height: 32px; padding: 0 12px; border-radius: 16px }
.mcs-btn[data-size="icon"] { width: 36px; padding: 0; color: var(--mcs-t2); background: none; box-shadow: none }
@media (hover: hover) { .mcs-btn[data-size="icon"]:hover { background: var(--mcs-fill); color: var(--mcs-t1) } }

.mcs-meter { display: flex; flex-direction: column; gap: 10px }
.mcs-meterline { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; min-height: 20px }
.mcs-metertext { color: var(--mcs-t2); display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 4.2px }
.mcs-metertext b { font-weight: 500; color: var(--mcs-t1) }
.mcs-dot { color: var(--mcs-t4); padding: 0 1.4px }
.mcs-budget { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); white-space: nowrap }
.mcs-budget[data-over] { color: var(--mcs-warn); font-weight: 500 }
.mcs-track { position: relative; display: flex; height: 8px; border-radius: 9999px; background: color-mix(in oklab, var(--mcs-ink) 5.5%, transparent); overflow: hidden }
.mcs-seg { position: relative; height: 100%; flex: none; padding-right: 2px; transition: width .6s var(--mcs-ease), opacity .3s var(--mcs-ease) }
.mcs-segfill { display: block; height: 100%; border-radius: 1.5px; background: color-mix(in oklab, var(--mcs-ink) 42%, transparent); transition: background-color .25s var(--mcs-ease) }
.mcs-track[data-hot] .mcs-segfill { background: color-mix(in oklab, var(--mcs-ink) 18%, transparent) }
.mcs-track[data-hot] .mcs-seg[data-hot] .mcs-segfill { background: var(--mcs-t1) }
.mcs-over { position: absolute; top: 0; bottom: 0; right: 0; background: var(--mcs-warn); border-radius: 0 9999px 9999px 0; transition: width .6s var(--mcs-ease); mix-blend-mode: normal }

/* ---- rows ---- */
.mcs-list { padding: 0 0 8px }
.mcs-item { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr; transition: grid-template-rows .36s var(--mcs-ease), opacity .24s var(--mcs-ease) }
.mcs-item > .mcs-itemin { min-height: 0; overflow: clip }
.mcs-item[data-removed] { grid-template-rows: 0fr; opacity: 0; pointer-events: none }
.mcs-item[data-new] { animation: mcs-grow .5s var(--mcs-ease) backwards }
.mcs-item[data-new] .mcs-headbtn { animation: mcs-tint 1.6s ease-out backwards }
@keyframes mcs-grow { from { grid-template-rows: 0fr; opacity: 0 } to { grid-template-rows: 1fr; opacity: 1 } }
@keyframes mcs-tint { 0% { background: color-mix(in oklab, var(--mcs-accent) 12%, transparent) } 100% { background: transparent } }
.mcs-head { position: relative }
.mcs-headbtn {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px;
  padding: 11px 20px; border-radius: 14px; transition: background-color .18s var(--mcs-ease);
}
@media (hover: hover) { .mcs-headbtn:hover { background: var(--mcs-fill) } }
.mcs-headbtn:focus-visible { outline-offset: -2px }
.mcs-headtext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px }
.mcs-name { font-weight: 500; color: var(--mcs-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.mcs-sub { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); min-width: 0; white-space: nowrap }
.mcs-status { display: inline-flex; align-items: center; gap: 5px; color: var(--mcs-t2) }
.mcs-status svg { flex: none }
.mcs-status[data-s="connected"] svg { color: var(--mcs-ok) }
.mcs-status[data-s="needs-auth"] svg { color: var(--mcs-warn) }
.mcs-status[data-s="error"] svg { color: var(--mcs-err) }
.mcs-spin { animation: mcs-spin .9s linear infinite }
@keyframes mcs-spin { to { transform: rotate(360deg) } }
.mcs-subdot { color: var(--mcs-t4) }
.mcs-meta { display: inline-flex; align-items: center; gap: 16px; white-space: nowrap; animation: mcs-fade .16s ease-out backwards }
.mcs-toolcount { color: var(--mcs-t3); display: inline-flex }
.mcs-tokens { font-weight: 500; color: var(--mcs-t1) }
.mcs-chev { flex: none; color: var(--mcs-t3); transition: transform .32s var(--mcs-ease) }
.mcs-headbtn[aria-expanded="true"] .mcs-chev { transform: rotate(180deg) }
.mcs-act { position: absolute; top: 50%; right: 48px; transform: translateY(-50%); animation: mcs-fade .16s ease-out backwards }
.mcs-act .mcs-btn { height: 32px; padding: 0 12px; border-radius: 16px }
.mcs-actspace { flex: none; width: 0 }
.mcs-headbtn[data-act] .mcs-actspace { width: 84px }
@keyframes mcs-fade { from { opacity: 0 } to { opacity: 1 } }

.mcs-panelgrid { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; transition: grid-template-rows .38s var(--mcs-ease) }
.mcs-panelgrid[data-open] { grid-template-rows: 1fr }
.mcs-panelclip { min-height: 0; overflow: clip }
.mcs-panel { padding: 0 20px 14px 56px; opacity: 0; transition: opacity .2s var(--mcs-ease) }
.mcs-panelgrid[data-open] .mcs-panel { opacity: 1; transition-duration: .3s; transition-delay: .06s }

.mcs-tools { display: flex; flex-direction: column }
.mcs-tool { display: flex; align-items: center; gap: 12px; min-height: 44px }
.mcs-toolname { flex: 1; min-width: 0; font-size: 13px; line-height: 18.2px; color: var(--mcs-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; transition: color .2s var(--mcs-ease) }
.mcs-tool[data-off] .mcs-toolname { color: var(--mcs-t3) }
.mcs-access { display: inline-flex; align-items: center; gap: 5px; width: 58px; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3) }
.mcs-access[data-a="write"] { color: var(--mcs-t2) }
.mcs-access[data-a="write"] svg { color: var(--mcs-warn) }
.mcs-tooltok { width: 40px; text-align: right; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3) }

.mcs-switch { position: relative; flex: none; width: 42px; height: 40px; display: flex; align-items: center; justify-content: flex-end }
.mcs-swtrack { display: block; width: 42px; height: 24px; padding: 3px; border-radius: 9999px; background: color-mix(in oklab, var(--mcs-ink) 11%, transparent); transition: background-color .22s var(--mcs-ease) }
.mcs-swthumb { display: block; width: 18px; height: 18px; border-radius: 9999px; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px 0 rgb(0 0 0 / .14), 0 2px 6px 0 rgb(0 0 0 / .06); transition: transform .28s var(--mcs-ease) }
.mcs-switch[aria-checked="true"] .mcs-swtrack { background: color-mix(in oklab, var(--mcs-ink) 88%, var(--mcs-surface)) }
.mcs-switch[aria-checked="true"] .mcs-swthumb { transform: translateX(18px) }
:is(.dark, [data-theme="dark"]) .mcs-switch[aria-checked="true"] .mcs-swthumb { background: #1c1c1e }

.mcs-setting { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding-top: 12px }
.mcs-setlabel { color: var(--mcs-t2) }
.mcs-seg2 { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; padding: 3px; gap: 2px; border-radius: 18px; background: var(--mcs-fill) }
.mcs-seg2thumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 8px) / 2); border-radius: 14px; background: var(--mcs-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .34s var(--mcs-ease) }
:is(.dark, [data-theme="dark"]) .mcs-seg2thumb { background: color-mix(in oklab, var(--mcs-surface) 78%, #fff) }
.mcs-seg2[data-i="1"] .mcs-seg2thumb { transform: translateX(calc(100% + 2px)) }
.mcs-seg2 button { position: relative; height: 30px; padding: 0 12px; border-radius: 14px; font-size: 12px; line-height: 16.8px; font-weight: 500; color: var(--mcs-t3); text-align: center; white-space: nowrap; transition: color .2s var(--mcs-ease) }
.mcs-seg2 button[aria-checked="true"] { color: var(--mcs-t1) }
.mcs-panelfoot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 10px }
.mcs-endpoint { min-width: 0; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mcs-remove { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; border-radius: 18px; color: var(--mcs-t2); font-weight: 500; flex: none; transition: background-color .18s var(--mcs-ease), color .18s var(--mcs-ease) }
@media (hover: hover) { .mcs-remove:hover { background: color-mix(in oklab, var(--mcs-err) 10%, transparent); color: var(--mcs-err) } }

/* ---- undo bar ---- */
.mcs-undo { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 44px; padding: 0 8px 0 16px; border-radius: 22px; background: color-mix(in oklab, var(--mcs-ink) 90%, var(--mcs-surface)); color: var(--mcs-surface); box-shadow: 0 8px 24px rgb(0 0 0 / .18); overflow: hidden; animation: mcs-undo-in .34s var(--mcs-ease) backwards }
.mcs-undo span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mcs-undo button { height: 32px; padding: 0 14px; border-radius: 16px; font-weight: 500; background: color-mix(in oklab, var(--mcs-surface) 16%, transparent) }
.mcs-undo i { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: color-mix(in oklab, var(--mcs-surface) 40%, transparent); transform-origin: left; animation: mcs-count 6s linear forwards }
.mcs-undo[data-paused] i { animation-play-state: paused }
@keyframes mcs-undo-in { from { opacity: 0; transform: translateY(10px) scale(.98) } to { opacity: 1; transform: none } }
@keyframes mcs-count { from { transform: scaleX(1) } to { transform: scaleX(0) } }

/* ---- sheet ---- */
.mcs-layer { position: absolute; inset: 0; z-index: 4; overflow: clip; border-radius: inherit }
.mcs-scrim { position: absolute; inset: 0; background: var(--mcs-scrim); animation: mcs-fade .3s ease-out backwards }
.mcs-sheet { position: absolute; left: 0; right: 0; bottom: 0; height: min(640px, calc(100% - 14px)); display: flex; flex-direction: column; background: var(--mcs-surface); border-radius: 20px 20px 0 0; box-shadow: var(--mcs-sheet-shadow); animation: mcs-rise .44s var(--mcs-ease) backwards }
.mcs-layer[data-closing] .mcs-sheet { animation: mcs-sink .26s cubic-bezier(.4, 0, 1, 1) forwards }
.mcs-layer[data-closing] .mcs-scrim { animation: mcs-fade-out .26s ease-in forwards }
@keyframes mcs-rise { from { transform: translateY(100%) } to { transform: none } }
@keyframes mcs-sink { from { transform: none } to { transform: translateY(100%) } }
@keyframes mcs-fade-out { from { opacity: 1 } to { opacity: 0 } }
.mcs-shead { display: grid; grid-template-columns: 36px 1fr 36px; align-items: center; gap: 8px; padding: 10px 12px; min-height: 57px }
.mcs-stitle { font-size: 16px; line-height: 17.6px; font-weight: 500; text-align: center; display: flex; justify-content: center; align-items: center; gap: 8px }
.mcs-sbody { position: relative; flex: 1; min-height: 0 }
.mcs-step { position: absolute; inset: 0; display: flex; flex-direction: column; animation: mcs-step-in .34s var(--mcs-ease) backwards }
.mcs-step[data-dir="back"] { animation-name: mcs-step-back }
@keyframes mcs-step-in { from { opacity: 0; transform: translateX(18px) } to { opacity: 1; transform: none } }
@keyframes mcs-step-back { from { opacity: 0; transform: translateX(-18px) } to { opacity: 1; transform: none } }
.mcs-sscroll { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px 16px; overscroll-behavior: contain }
.mcs-sfoot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px 16px; border-top: 1px solid var(--mcs-line); min-height: 72px }
.mcs-sfoot-note { font-size: 12px; line-height: 16.8px; color: var(--mcs-t2); min-width: 0 }
.mcs-sfoot-actions { display: flex; align-items: center; gap: 4px; flex: none }

.mcs-field { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; border-radius: 18px; background: var(--mcs-surface); box-shadow: var(--mcs-ring); transition: box-shadow .2s var(--mcs-ease) }
.mcs-field:focus-within { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--mcs-accent) 55%, transparent) }
.mcs-field svg { flex: none; color: var(--mcs-t3) }
.mcs-field input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: none; font-size: 14px }
.mcs-field input::placeholder { color: var(--mcs-t3) }
.mcs-field input:focus-visible { outline: 0 }
.mcs-clear { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 12px; color: var(--mcs-t3) }
@media (hover: hover) { .mcs-clear:hover { background: var(--mcs-fill2); color: var(--mcs-t1) } }
.mcs-dir { margin: 10px -6px 0; display: flex; flex-direction: column; gap: 2px }
.mcs-entry { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border-radius: 14px; min-height: 56px; transition: background-color .16s var(--mcs-ease) }
@media (hover: hover) { .mcs-entry:hover { background: var(--mcs-fill) } }
.mcs-entry:focus-visible { background: var(--mcs-fill); outline-offset: -2px }
.mcs-entry[disabled] { cursor: default; opacity: .6 }
.mcs-entry[disabled]:hover { background: none }
.mcs-entrytext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px }
.mcs-entrydesc { font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mcs-entrymeta { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); flex: none }
.mcs-empty { padding: 28px 8px; text-align: center; color: var(--mcs-t3) }
.mcs-url { padding: 14px 16px 16px; border-top: 1px solid var(--mcs-line); display: flex; flex-direction: column; gap: 8px }
.mcs-url label { font-size: 12px; line-height: 16.8px; color: var(--mcs-t2) }
.mcs-urlrow { display: flex; gap: 8px }
.mcs-urlrow .mcs-field { flex: 1; min-width: 0 }
.mcs-urlrow .mcs-btn { height: 44px; border-radius: 22px }
.mcs-mark { display: grid; place-items: center; flex: none; border-radius: 7px; background: var(--mcs-fill); color: var(--mcs-t1); box-shadow: inset 0 0 0 .5px var(--mcs-line) }

.mcs-auth { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px 16px; display: flex; flex-direction: column; align-items: center; text-align: center }
.mcs-simchip { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 13px; box-shadow: var(--mcs-ring); font-size: 12px; line-height: 16.8px; color: var(--mcs-t2) }
.mcs-pair { display: flex; align-items: center; gap: 12px; margin-top: 22px; color: var(--mcs-t3) }
.mcs-pair i { display: block; width: 28px; border-top: 1.5px dashed var(--mcs-t4) }
.mcs-tile { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--mcs-fill); color: var(--mcs-t1); box-shadow: inset 0 0 0 .5px var(--mcs-line) }
.mcs-tile[data-inv] { background: color-mix(in oklab, var(--mcs-ink) 90%, var(--mcs-surface)); color: var(--mcs-surface); box-shadow: none }
.mcs-authh { margin-top: 18px; font-size: 16px; line-height: 22px; font-weight: 500; max-width: 320px; text-wrap: balance }
.mcs-account { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; height: 36px; padding: 0 14px 0 4px; border-radius: 18px; box-shadow: var(--mcs-ring); font-size: 13px; max-width: 100% }
.mcs-account em { font-style: normal; color: var(--mcs-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mcs-avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 14px; background: color-mix(in oklab, var(--mcs-accent) 18%, var(--mcs-surface)); color: var(--mcs-accent); font-size: 11px; font-weight: 600; overflow: hidden; flex: none }
.mcs-avatar img { width: 100%; height: 100%; object-fit: cover }
.mcs-scopes { align-self: stretch; max-width: 360px; width: 100%; margin: 22px auto 0; text-align: left }
.mcs-scopes p { font-size: 12px; line-height: 16.8px; color: var(--mcs-t3); margin-bottom: 8px }
.mcs-scopes li { display: flex; gap: 10px; align-items: flex-start; padding: 4px 0; font-size: 13px; line-height: 18px }
.mcs-scopes li svg { margin-top: 2px; color: var(--mcs-ok); flex: none }

.mcs-disc { display: flex; align-items: center; gap: 12px; padding: 4px 4px 14px }
.mcs-disctext { display: flex; flex-direction: column; min-width: 0 }
.mcs-disclabel { font-weight: 500; display: inline-flex; align-items: center; gap: 6px }
.mcs-disclabel svg { color: var(--mcs-ok) }
.mcs-disclabel:focus-visible { outline: 0 }
.mcs-shimmer { position: relative }
.mcs-shimmer::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; background: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .82) 50%, transparent 62%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; animation: mcs-sweep 1.6s linear infinite }
:is(.dark, [data-theme="dark"]) .mcs-shimmer::after { background-image: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .5) 50%, transparent 62%) }
@keyframes mcs-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
.mcs-sheet .mcs-tool { animation: mcs-tool-in .34s var(--mcs-ease) backwards }
@keyframes mcs-tool-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
.mcs-err { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; background: color-mix(in oklab, var(--mcs-err) 8%, transparent); color: var(--mcs-t1); font-size: 13px; line-height: 18px }
.mcs-err svg { color: var(--mcs-err); margin-top: 1px; flex: none }

/* ---- narrow containers ---- */
@container (max-width: 520px) {
  .mcs-panel { padding-left: 20px }
  .mcs-wide { display: none }
}
@container (max-width: 400px) {
  .mcs-header { padding-inline: 16px }
  .mcs-headbtn { padding-inline: 16px }
  .mcs-act { right: 44px }
  .mcs-panel { padding-inline: 16px }
  .mcs-toolcount { display: none }
  .mcs-headbtn[data-act] .mcs-subtail { display: none }
  .mcs-meta { gap: 0 }
  .mcs-access { width: 16px }
  .mcs-access span { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
  .mcs-tooltok { width: 34px }
  .mcs-setting { flex-direction: column; align-items: stretch }
  .mcs-seg2 { width: 100% }
  .mcs-sscroll { padding-inline: 12px }
  .mcs-auth { padding-inline: 16px }
  .mcs-sfoot { flex-direction: column-reverse; align-items: stretch }
  .mcs-sfoot-actions { justify-content: flex-end }
}

@media (prefers-reduced-motion: reduce) {
  .mcs *, .mcs *::before, .mcs *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches
const getReducedServer = () => false

function compact(n: number, trim = false) {
  if (n < 1000) return String(Math.round(n))
  const s = (n / 1000).toFixed(1)
  return (trim ? s.replace(/\.0$/, "") : s) + "k"
}

/** A number that eases to its value and writes its text straight to the DOM (no React render per frame). */
function CountTo({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const ref = React.useRef<HTMLSpanElement>(null)
  const cur = React.useRef(value)
  const fmt = React.useRef(format)
  React.useEffect(() => {
    fmt.current = format
  })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      cur.current = value
      el.textContent = fmt.current(value)
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const diff = value - cur.current
      if (Math.abs(diff) < 0.02 * Math.max(1, Math.abs(value) / 100)) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 90))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt.current(cur.current)
  }, [])
  return (
    <>
      <span ref={ref} className="mcs-num" aria-hidden />
      <span className="mcs-sr">{format(value)}</span>
    </>
  )
}

/** Keeps its children mounted while it animates closed. */
function Collapse({ open, id, label, children }: { open: boolean; id: string; label: string; children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(open)
  const [entered, setEntered] = React.useState(open)
  if (open && !mounted) setMounted(true)
  React.useEffect(() => {
    if (open) {
      let b = 0
      const a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(a)
        cancelAnimationFrame(b)
      }
    }
    const tm = window.setTimeout(() => {
      setMounted(false)
      setEntered(false)
    }, 400)
    return () => window.clearTimeout(tm)
  }, [open])
  if (!mounted) return null
  const expanded = open && entered
  return (
    <div className="mcs-panelgrid" data-open={expanded || undefined} id={id} role="region" aria-label={label} inert={!expanded}>
      <div className="mcs-panelclip">
        <div className="mcs-panel">{children}</div>
      </div>
    </div>
  )
}

function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  labelledBy: string
  describedBy?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="mcs-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="mcs-swtrack">
        <span className="mcs-swthumb" />
      </span>
    </button>
  )
}

function ToolRow({ tool, serverName, onToggle }: { tool: McpTool & { enabled: boolean }; serverName: string; onToggle: (next: boolean) => void }) {
  const uid = React.useId()
  const lid = `${uid}-l`
  const did = `${uid}-d`
  const Icon = tool.access === "read" ? Eye : Pencil
  return (
    <li className="mcs-tool" data-off={!tool.enabled || undefined}>
      <span id={lid} className="mcs-toolname mcs-mono" onClick={() => onToggle(!tool.enabled)}>
        {tool.name}
      </span>
      <span className="mcs-access" data-a={tool.access} aria-hidden>
        <Icon size={13} strokeWidth={1.75} />
        <span>{tool.access === "read" ? "Read" : "Write"}</span>
      </span>
      <span className="mcs-tooltok mcs-num" aria-hidden>{tool.tokens}</span>
      <span id={did} className="mcs-sr">{`${tool.access === "read" ? "Read" : "Write"} tool of ${serverName}, ${tool.tokens} tokens`}</span>
      <Switch checked={tool.enabled} onChange={onToggle} labelledBy={lid} describedBy={did} />
    </li>
  )
}

type Norm = McpTool & { enabled: boolean }
type ServerState = Omit<McpServer, "tools"> & { tools: Norm[]; removed?: boolean }

function norm(tools: McpTool[]): Norm[] {
  return tools.map((x) => ({ ...x, enabled: x.enabled ?? x.access === "read" }))
}
function toState(s: McpServer): ServerState {
  return { ...s, permission: s.permission ?? "ask", tools: norm(s.tools) }
}
function onStats(s: ServerState) {
  if (s.status !== "connected") return { count: 0, tokens: 0 }
  let count = 0
  let tokens = 0
  for (const x of s.tools) {
    if (!x.enabled) continue
    count++
    tokens += x.tokens
  }
  return { count, tokens }
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
function hostOf(url: string) {
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`)
    return u.host
  } catch {
    return url
  }
}
function nameFromHost(host: string) {
  const parts = host.replace(/^(www|mcp|api)\./, "").split(".")
  const base = parts.length > 1 ? parts[parts.length - 2] : parts[0]
  return base ? base[0].toUpperCase() + base.slice(1) : "Custom server"
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type Entry = Pick<McpDirectoryEntry, "id" | "name" | "brand" | "icon" | "transport" | "endpoint" | "auth" | "scopes" | "tools">

type Sheet = {
  step: "directory" | "authorize" | "discover"
  dir: "fwd" | "back"
  kind: McpConnectRequest["kind"]
  entry?: Entry
  found: Norm[]
  stage: "working" | "done" | "error"
  error?: string
  closing?: boolean
}

const TOOL_STAGGER = 260

/**
 * Manages the MCP servers that give an agent its tools: what the enabled tools cost in context, which servers are
 * connected, and a per-tool switch. Add server opens a sheet with a directory, a simulated authorize step and tool discovery.
 */
export function McpServers({
  servers: serversProp,
  directory = DEFAULT_DIRECTORY,
  budget = 8000,
  title = "MCP servers",
  clientName = "Northwind agent",
  account = DEFAULT_ACCOUNT,
  onToggleTool,
  onConnect,
  onRemove,
  onPermissionChange,
  className,
}: McpServersProps) {
  const uid = React.useId()
  const [servers, setServers] = React.useState<ServerState[]>(() => (serversProp ?? DEFAULT_SERVERS).map(toState))
  const [seenProp, setSeenProp] = React.useState(serversProp)
  if (serversProp !== seenProp) {
    setSeenProp(serversProp)
    setServers((serversProp ?? DEFAULT_SERVERS).map(toState))
  }
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<Record<string, true>>({})
  const [hot, setHot] = React.useState<string | null>(null)
  const [newId, setNewId] = React.useState<string | null>(null)
  const [sheet, setSheet] = React.useState<Sheet | null>(null)
  const [pending, setPending] = React.useState<{ id: string; name: string; paused: boolean } | null>(null)
  const [status, setStatus] = React.useState("")

  const rootRef = React.useRef<HTMLDivElement>(null)
  const openerRef = React.useRef<HTMLElement | null>(null)
  const ticket = React.useRef(0)
  const timers = React.useRef(new Set<number>())
  const removeTimer = React.useRef<{ id: number; left: number; at: number } | null>(null)
  const cb = React.useRef({ onToggleTool, onConnect, onRemove, onPermissionChange })
  React.useEffect(() => {
    cb.current = { onToggleTool, onConnect, onRemove, onPermissionChange }
  })
  React.useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach((id) => window.clearTimeout(id))
      const r = removeTimer.current
      if (r) window.clearTimeout(r.id)
    }
  }, [])

  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])
  const announce = React.useCallback((msg: string) => setStatus(msg), [])

  /* ---- derived meter ---- */
  const live = servers.filter((s) => !s.removed)
  const stats = live.map((s) => ({ id: s.id, name: s.name, ...onStats(s) }))
  const totalTools = stats.reduce((a, s) => a + s.count, 0)
  const totalTokens = stats.reduce((a, s) => a + s.tokens, 0)
  const scale = Math.max(budget, totalTokens, 1)
  const over = totalTokens - budget

  /* ---- tools ---- */
  const toggleTool = (serverId: string, toolId: string, enabled: boolean) => {
    const s = servers.find((x) => x.id === serverId)
    const tool = s?.tools.find((x) => x.id === toolId)
    setServers((list) =>
      list.map((x) => (x.id === serverId ? { ...x, tools: x.tools.map((y) => (y.id === toolId ? { ...y, enabled } : y)) } : x)),
    )
    cb.current.onToggleTool?.(serverId, toolId, enabled)
    if (s && tool) announce(`${tool.name} ${enabled ? "on" : "off"}, ${s.name}. ${tool.tokens} tokens ${enabled ? "added to" : "removed from"} context.`)
  }
  const setPermission = (serverId: string, permission: McpPermission) => {
    setServers((list) => list.map((x) => (x.id === serverId ? { ...x, permission } : x)))
    cb.current.onPermissionChange?.(serverId, permission)
    announce(permission === "ask" ? "Ask every time before a tool runs." : "Read tools run without asking.")
  }

  /* ---- remove with undo ---- */
  const commitRemove = (id: string) => {
    const r = removeTimer.current
    if (r) window.clearTimeout(r.id)
    removeTimer.current = null
    setServers((list) => list.filter((x) => x.id !== id))
    setPending(null)
    cb.current.onRemove?.(id)
  }
  const startRemoveTimer = (id: string, ms: number, now: number) => {
    const timerId = window.setTimeout(() => commitRemove(id), ms)
    removeTimer.current = { id: timerId, left: ms, at: now }
  }
  const remove = (s: ServerState, now: number) => {
    if (pending) commitRemove(pending.id)
    setServers((list) => list.map((x) => (x.id === s.id ? { ...x, removed: true } : x)))
    setOpenId(null)
    setPending({ id: s.id, name: s.name, paused: false })
    startRemoveTimer(s.id, 6000, now)
    announce(`${s.name} removed. Press Undo or Command Z to bring it back.`)
    const idx = live.findIndex((x) => x.id === s.id)
    const next = live[idx + 1] ?? live[idx - 1]
    if (next) later(() => rootRef.current?.querySelector<HTMLElement>(`[data-mcs-row="${esc(next.id)}"]`)?.focus(), 60)
  }
  const undo = () => {
    if (!pending) return
    const r = removeTimer.current
    if (r) window.clearTimeout(r.id)
    removeTimer.current = null
    const id = pending.id
    setServers((list) => list.map((x) => (x.id === id ? { ...x, removed: false } : x)))
    setPending(null)
    announce(`${pending.name} restored.`)
    later(() => rootRef.current?.querySelector<HTMLElement>(`[data-mcs-row="${esc(id)}"]`)?.focus(), 60)
  }
  const pauseRemove = (e: { timeStamp: number }) => {
    const r = removeTimer.current
    if (!r || !pending || pending.paused) return
    window.clearTimeout(r.id)
    removeTimer.current = { ...r, left: Math.max(600, r.left - (e.timeStamp - r.at)) }
    setPending({ ...pending, paused: true })
  }
  const resumeRemove = (e: { timeStamp: number }) => {
    const r = removeTimer.current
    if (!r || !pending || !pending.paused) return
    startRemoveTimer(pending.id, r.left, e.timeStamp)
    setPending({ ...pending, paused: false })
  }
  React.useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && rootRef.current?.contains(document.activeElement)) {
        e.preventDefault()
        undo()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  /* ---- sheet: connect flow ---- */
  const closeSheet = React.useCallback(
    (restoreFocus = true) => {
      ticket.current++
      setSheet((s) => (s ? { ...s, closing: true } : s))
      later(() => {
        setSheet(null)
        if (restoreFocus) openerRef.current?.focus()
      }, 260)
    },
    [later],
  )

  const openSheet = (opener: HTMLElement | null, next: Sheet) => {
    openerRef.current = opener
    setSheet(next)
  }

  const discover = async (entry: Entry, kind: McpConnectRequest["kind"]) => {
    const my = ++ticket.current
    setSheet((s) => (s ? { ...s, step: "discover", dir: "fwd", entry, kind, found: [], stage: "working", error: undefined } : s))
    announce(`Connecting to ${entry.name}.`)
    let tools: Norm[]
    try {
      const request: McpConnectRequest = { kind, serverId: entry.id, name: entry.name, transport: entry.transport, endpoint: entry.endpoint }
      const result = cb.current.onConnect ? await cb.current.onConnect(request) : undefined
      if (!cb.current.onConnect) await new Promise<void>((r) => later(r, 900))
      tools = norm(result && result.length ? result : entry.tools)
    } catch (e) {
      if (my !== ticket.current) return
      const message = e instanceof Error && e.message ? e.message : "Could not reach the server."
      setSheet((s) => (s ? { ...s, stage: "error", error: message } : s))
      announce(`Could not connect to ${entry.name}. ${message}`)
      return
    }
    if (my !== ticket.current) return
    tools.forEach((tool, i) =>
      later(() => {
        if (my !== ticket.current) return
        const last = i === tools.length - 1
        setSheet((s) => (s ? { ...s, found: [...s.found, tool], stage: last ? "done" : "working" } : s))
        if (last) announce(`Found ${tools.length} tools on ${entry.name}.`)
      }, TOOL_STAGGER * (i + 1)),
    )
    if (tools.length === 0) {
      setSheet((s) => (s ? { ...s, stage: "done" } : s))
      announce(`${entry.name} reported no tools.`)
    }
  }

  const pickEntry = (entry: Entry, kind: McpConnectRequest["kind"]) => {
    if (entry.auth === "oauth") {
      setSheet((s) => (s ? { ...s, step: "authorize", dir: "fwd", kind, entry } : s))
      announce(`Sign in to ${entry.name}.`)
    } else {
      void discover(entry, kind)
    }
  }

  const connectUrl = (raw: string) => {
    const endpoint = raw.trim()
    const host = hostOf(endpoint)
    const name = nameFromHost(host)
    const stem = name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    void discover(
      {
        id: `custom-${stem}`,
        name,
        transport: "remote",
        endpoint: /^[a-z]+:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`,
        auth: "none",
        tools: [t(`${stem}_search`, "read", 250), t(`${stem}_get_item`, "read", 300), t(`${stem}_create_item`, "write", 360)],
      },
      "url",
    )
  }

  const finishSheet = () => {
    if (!sheet?.entry) return
    const { entry, found, kind } = sheet
    const existing = servers.find((s) => s.id === entry.id)
    const next: ServerState = {
      id: entry.id,
      name: entry.name,
      brand: entry.brand,
      icon: entry.icon,
      transport: entry.transport,
      endpoint: entry.endpoint,
      status: "connected",
      scopes: entry.scopes,
      permission: existing?.permission ?? "ask",
      tools: found,
    }
    if (existing) setServers((list) => list.map((s) => (s.id === entry.id ? { ...s, ...next, error: undefined } : s)))
    else setServers((list) => [next, ...list])
    if (!existing) {
      setNewId(entry.id)
      later(() => setNewId((cur) => (cur === entry.id ? null : cur)), 1800)
    }
    const on = found.filter((x) => x.enabled)
    announce(`${entry.name} ${kind === "reconnect" ? "reconnected" : "added"}. ${on.length} tools on, ${on.reduce((a, x) => a + x.tokens, 0)} tokens.`)
    closeSheet(false)
    later(() => rootRef.current?.querySelector<HTMLElement>(`[data-mcs-row="${esc(entry.id)}"]`)?.focus(), 300)
  }

  const reconnect = (s: ServerState, opener: HTMLElement | null) => {
    openSheet(opener, {
      step: "authorize",
      dir: "fwd",
      kind: "reconnect",
      found: [],
      stage: "working",
      entry: { id: s.id, name: s.name, brand: s.brand, icon: s.icon, transport: s.transport, endpoint: s.endpoint, auth: "oauth", scopes: s.scopes, tools: s.tools },
    })
    announce(`Sign in to ${s.name}.`)
  }

  const retry = async (s: ServerState) => {
    setBusy((b) => ({ ...b, [s.id]: true }))
    announce(`Retrying ${s.name}.`)
    try {
      const request: McpConnectRequest = { kind: "retry", serverId: s.id, name: s.name, transport: s.transport, endpoint: s.endpoint }
      const result = cb.current.onConnect ? await cb.current.onConnect(request) : undefined
      if (!cb.current.onConnect) await new Promise<void>((r) => later(r, 1500))
      setServers((list) =>
        list.map((x) => (x.id === s.id ? { ...x, status: "connected", error: undefined, tools: result && result.length ? norm(result) : x.tools } : x)),
      )
      announce(`${s.name} connected.`)
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "Could not reach the server."
      setServers((list) => list.map((x) => (x.id === s.id ? { ...x, status: "error", error: message } : x)))
      announce(`${s.name} failed again. ${message}`)
    }
    setBusy((b) => {
      const { [s.id]: _gone, ...rest } = b
      return rest
    })
    later(() => rootRef.current?.querySelector<HTMLElement>(`[data-mcs-row="${esc(s.id)}"]`)?.focus(), 40)
  }

  /* ---- keyboard on the list ---- */
  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement
    const rowId = target.getAttribute("data-mcs-row")
    if (!rowId) return
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-mcs-row]")).filter((r) => !r.closest("[data-removed]"))
    const i = rows.indexOf(target)
    let to: HTMLElement | undefined
    if (e.key === "ArrowDown") to = rows[Math.min(rows.length - 1, i + 1)]
    else if (e.key === "ArrowUp") to = rows[Math.max(0, i - 1)]
    else if (e.key === "Home") to = rows[0]
    else if (e.key === "End") to = rows[rows.length - 1]
    else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && openId === rowId) {
      const s = servers.find((x) => x.id === rowId)
      if (s) setPermission(rowId, e.key === "ArrowLeft" ? "ask" : "allow-reads")
      e.preventDefault()
      return
    }
    if (to) {
      e.preventDefault()
      to.focus()
    }
  }

  const sheetOpen = !!sheet

  return (
    <div ref={rootRef} className={["mcs", className].filter(Boolean).join(" ")} data-sheet={sheetOpen || undefined}>
      <style href="mcp-servers" precedence="default">
        {CSS}
      </style>

      <div className="mcs-main" inert={sheetOpen}>
        <header className="mcs-header">
          <div className="mcs-titlerow">
            <h2 className="mcs-title">
              <Cable size={18} strokeWidth={1.75} aria-hidden />
              {title}
            </h2>
            <button
              type="button"
              className="mcs-btn"
              onClick={(e) => openSheet(e.currentTarget, { step: "directory", dir: "fwd", kind: "directory", found: [], stage: "working" })}
            >
              <Plus size={16} strokeWidth={1.75} aria-hidden />
              Add server
            </button>
          </div>

          <div className="mcs-meter">
            <div className="mcs-meterline">
              <p className="mcs-metertext">
                <b>
                  <CountTo value={totalTools} />
                </b>
                <span>{totalTools === 1 ? "tool" : "tools"}</span>
                <span className="mcs-dot" aria-hidden>
                  ·
                </span>
                <b>
                  <CountTo value={totalTokens} format={(n) => compact(n)} />
                </b>
                <span>tokens of context</span>
              </p>
              <span className="mcs-budget" data-over={over > 0 || undefined}>
                {over > 0 ? <CircleAlert size={14} strokeWidth={1.75} aria-hidden /> : null}
                {over > 0 ? `${compact(over, true)} over ${compact(budget, true)} budget` : `${compact(budget, true)} budget`}
              </span>
            </div>
            <div
              className="mcs-track"
              role="meter"
              aria-label="Context used by tool definitions"
              aria-valuemin={0}
              aria-valuemax={budget}
              aria-valuenow={totalTokens}
              aria-valuetext={`${totalTokens.toLocaleString("en-US")} of ${budget.toLocaleString("en-US")} budgeted tokens${over > 0 ? `, ${over.toLocaleString("en-US")} over budget` : ""}`}
              data-hot={hot ? "" : undefined}
            >
              {stats
                .filter((s) => s.tokens > 0)
                .map((s) => (
                  <span key={s.id} className="mcs-seg" style={{ width: `${(s.tokens / scale) * 100}%` }} title={`${s.name}: ${compact(s.tokens, true)} tokens`} data-hot={hot === s.id || undefined}>
                    <span className="mcs-segfill" />
                  </span>
                ))}
              {over > 0 && <span className="mcs-over" style={{ width: `${(over / scale) * 100}%` }} aria-hidden />}
            </div>
          </div>
        </header>

        <ul className="mcs-list" onKeyDown={onListKey} aria-label="Servers">
          {servers.map((s) => (
            <ServerRow
              key={s.id}
              s={s}
              uid={uid}
              open={openId === s.id}
              busy={!!busy[s.id]}
              isNew={newId === s.id}
              onOpen={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
              onHot={(on) => setHot(on ? s.id : null)}
              onToggleTool={(toolId, enabled) => toggleTool(s.id, toolId, enabled)}
              onPermission={(p) => setPermission(s.id, p)}
              onRemove={(now) => remove(s, now)}
              onSignIn={(el) => reconnect(s, el)}
              onRetry={() => void retry(s)}
            />
          ))}
        </ul>
      </div>

      {pending && (
        <div
          className="mcs-undo"
          role="group"
          aria-label="Undo remove"
          data-paused={pending.paused || undefined}
          onPointerEnter={pauseRemove}
          onPointerLeave={resumeRemove}
          onFocus={pauseRemove}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) resumeRemove(e)
          }}
        >
          <span>{pending.name} removed</span>
          <button type="button" onClick={undo}>
            Undo
          </button>
          <i aria-hidden key={pending.id} />
        </div>
      )}

      {sheet && (
        <SheetView
          sheet={sheet}
          directory={directory}
          servers={servers}
          clientName={clientName}
          account={account}
          hasConnect={!!onConnect}
          onClose={() => closeSheet()}
          onPick={(entry) => pickEntry(entry, "directory")}
          onUrl={connectUrl}
          onBack={() => {
            ticket.current++
            setSheet((s) => (s ? { ...s, step: "directory", dir: "back", found: [], stage: "working" } : s))
          }}
          onAuthorize={() => sheet.entry && void discover(sheet.entry, sheet.kind)}
          onRetry={() => sheet.entry && void discover(sheet.entry, sheet.kind)}
          onToggle={(toolId, enabled) =>
            setSheet((s) => (s ? { ...s, found: s.found.map((x) => (x.id === toolId ? { ...x, enabled } : x)) } : s))
          }
          onDone={finishSheet}
        />
      )}

      <div className="mcs-sr" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  )
}

function esc(id: string) {
  return id.replace(/["\\]/g, "\\$&")
}

/* -------------------------------------------------------------------------- */
/*                                  Server row                                */
/* -------------------------------------------------------------------------- */

function StatusLabel({ s, busy }: { s: ServerState; busy: boolean }) {
  if (busy)
    return (
      <span className="mcs-status" data-s="busy" key="busy">
        <LoaderCircle size={14} strokeWidth={1.75} className="mcs-spin" aria-hidden />
        <span className="mcs-shimmer" data-text="Connecting">Connecting</span>
      </span>
    )
  if (s.status === "needs-auth")
    return (
      <span className="mcs-status" data-s="needs-auth" key="na">
        <KeyRound size={14} strokeWidth={1.75} aria-hidden />
        Needs sign in
      </span>
    )
  if (s.status === "error")
    return (
      <span className="mcs-status" data-s="error" key="er" title={s.error}>
        <CircleAlert size={14} strokeWidth={1.75} aria-hidden />
        Error
      </span>
    )
  return (
    <span className="mcs-status" data-s="connected" key="ok">
      <CircleCheck size={14} strokeWidth={1.75} aria-hidden />
      Connected
    </span>
  )
}

function ServerRow({
  s,
  uid,
  open,
  busy,
  isNew,
  onOpen,
  onHot,
  onToggleTool,
  onPermission,
  onRemove,
  onSignIn,
  onRetry,
}: {
  s: ServerState
  uid: string
  open: boolean
  busy: boolean
  isNew: boolean
  onOpen: () => void
  onHot: (on: boolean) => void
  onToggleTool: (toolId: string, enabled: boolean) => void
  onPermission: (p: McpPermission) => void
  onRemove: (now: number) => void
  onSignIn: (el: HTMLElement | null) => void
  onRetry: () => void
}) {
  const { count, tokens } = onStats(s)
  const panelId = `${uid}-p-${s.id}`
  const connected = s.status === "connected" && !busy
  const needsAuth = s.status === "needs-auth" && !busy
  const errored = s.status === "error" && !busy
  const action = needsAuth || errored
  const statusText = busy ? "Connecting" : needsAuth ? "Needs sign in" : errored ? "Error" : "Connected"
  const label = [
    s.name,
    statusText,
    s.transport === "remote" ? "Remote" : "Local",
    connected ? `${count} of ${s.tools.length} tools on` : null,
    connected ? `${tokens} tokens` : null,
    errored && s.error ? s.error : null,
  ]
    .filter(Boolean)
    .join(", ")
  const permission = s.permission ?? "ask"

  return (
    <li className="mcs-item" data-removed={s.removed || undefined} data-new={isNew || undefined}>
      <div className="mcs-itemin" inert={s.removed}>
        <div className="mcs-head" onPointerEnter={() => onHot(true)} onPointerLeave={() => onHot(false)}>
          <button
            type="button"
            className="mcs-headbtn"
            data-mcs-row={s.id}
            data-act={action || undefined}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={label}
            onFocus={() => onHot(true)}
            onBlur={() => onHot(false)}
            onClick={onOpen}
          >
            <Mark brand={s.brand} icon={s.icon} />
            <span className="mcs-headtext">
              <span className="mcs-name">{s.name}</span>
              <span className="mcs-sub">
                <StatusLabel s={s} busy={busy} />
                <span className="mcs-subdot mcs-subtail" aria-hidden>
                  ·
                </span>
                <span className="mcs-subtail">{s.transport === "remote" ? "Remote" : "Local"}</span>
              </span>
            </span>
            {connected ? (
              <span className="mcs-meta" key="meta">
                <span className="mcs-toolcount">
                  <CountTo value={count} />
                  <span>&nbsp;of {s.tools.length}</span>
                  <span className="mcs-wide">&nbsp;tools</span>
                </span>
                <span className="mcs-tokens">
                  <CountTo value={tokens} format={(n) => compact(n)} />
                </span>
              </span>
            ) : (
              <span className="mcs-actspace" />
            )}
            <ChevronDown className="mcs-chev" size={16} strokeWidth={1.75} aria-hidden />
          </button>
          {needsAuth && (
            <span className="mcs-act" key="act-auth">
              <button type="button" className="mcs-btn" onClick={(e) => onSignIn(e.currentTarget)}>
                <KeyRound size={15} strokeWidth={1.75} aria-hidden />
                Sign in
              </button>
            </span>
          )}
          {errored && (
            <span className="mcs-act" key="act-retry">
              <button type="button" className="mcs-btn" onClick={onRetry}>
                Retry
              </button>
            </span>
          )}
        </div>

        <Collapse open={open} id={panelId} label={`${s.name} tools`}>
          {errored && s.error ? (
            <div className="mcs-err" role="alert">
              <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
              <span>{s.error}</span>
            </div>
          ) : null}
          {!connected && !errored ? (
            <p className="mcs-setlabel" style={{ paddingBottom: 6 }}>
              {needsAuth ? "Sign in to load this server's tools. Its tools stay out of context until then." : "Connecting…"}
            </p>
          ) : null}
          <ul className="mcs-tools" aria-label={`${s.name} tools`} style={errored || needsAuth ? { opacity: 0.55, marginTop: 4 } : undefined}>
            {s.tools.map((tool) => (
              <ToolRow key={tool.id} tool={tool} serverName={s.name} onToggle={(next) => onToggleTool(tool.id, next)} />
            ))}
          </ul>
          <div className="mcs-setting">
            <span className="mcs-setlabel" id={`${panelId}-perm`}>
              Before a tool runs
            </span>
            <div
              className="mcs-seg2"
              role="radiogroup"
              aria-labelledby={`${panelId}-perm`}
              data-i={permission === "ask" ? 0 : 1}
            >
              <span className="mcs-seg2thumb" aria-hidden />
              <button type="button" role="radio" aria-checked={permission === "ask"} onClick={() => onPermission("ask")}>
                Ask every time
              </button>
              <button type="button" role="radio" aria-checked={permission === "allow-reads"} onClick={() => onPermission("allow-reads")}>
                Always allow reads
              </button>
            </div>
          </div>
          <div className="mcs-panelfoot">
            <code className="mcs-endpoint mcs-mono" title={s.endpoint}>
              {s.endpoint}
            </code>
            <button type="button" className="mcs-remove" onClick={(e) => onRemove(e.timeStamp)}>
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
              Remove
            </button>
          </div>
        </Collapse>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Sheet                                   */
/* -------------------------------------------------------------------------- */

function SheetView({
  sheet,
  directory,
  servers,
  clientName,
  account,
  hasConnect,
  onClose,
  onPick,
  onUrl,
  onBack,
  onAuthorize,
  onRetry,
  onToggle,
  onDone,
}: {
  sheet: Sheet
  directory: McpDirectoryEntry[]
  servers: ServerState[]
  clientName: string
  account: { name: string; email: string; avatar?: string }
  hasConnect: boolean
  onClose: () => void
  onPick: (e: McpDirectoryEntry) => void
  onUrl: (url: string) => void
  onBack: () => void
  onAuthorize: () => void
  onRetry: () => void
  onToggle: (toolId: string, enabled: boolean) => void
  onDone: () => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const { step, entry } = sheet

  // Focus follows the flow: search field, Authorize, then the step heading.
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const raf = requestAnimationFrame(() => {
      const target =
        step === "directory"
          ? el.querySelector<HTMLElement>("[data-mcs-search]")
          : step === "authorize"
            ? el.querySelector<HTMLElement>("[data-mcs-authorize]")
            : el.querySelector<HTMLElement>("[data-mcs-heading]")
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(raf)
  }, [step])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key === "Tab") {
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !ref.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const heading =
    step === "directory" ? "Add a server" : step === "authorize" ? `Sign in to ${entry?.name ?? ""}` : (entry?.name ?? "")
  const foundOn = sheet.found.filter((x) => x.enabled)
  const foundTokens = foundOn.reduce((a, x) => a + x.tokens, 0)

  return (
    <div className="mcs-layer" data-closing={sheet.closing || undefined}>
      <div className="mcs-scrim" onClick={onClose} aria-hidden />
      <div ref={ref} className="mcs-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <div className="mcs-shead">
          {step !== "directory" && sheet.kind !== "reconnect" ? (
            <button type="button" className="mcs-btn" data-size="icon" aria-label="Back" onClick={onBack}>
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            <span />
          )}
          <h3 className="mcs-stitle" id={titleId} key={heading} style={{ animation: "mcs-fade .2s ease-out backwards" }}>
            {heading}
          </h3>
          <button type="button" className="mcs-btn" data-size="icon" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="mcs-sbody">
          {step === "directory" && (
            <Directory key="dir" dir={sheet.dir} directory={directory} servers={servers} onPick={onPick} onUrl={onUrl} />
          )}

          {step === "authorize" && entry && (
            <div className="mcs-step" key="auth" data-dir={sheet.dir}>
              <div className="mcs-auth">
                <span className="mcs-simchip">
                  <Info size={13} strokeWidth={1.75} aria-hidden />
                  Simulated sign in
                </span>
                <div className="mcs-pair" aria-hidden>
                  <span className="mcs-tile" data-inv>
                    <Bot size={20} strokeWidth={1.75} />
                  </span>
                  <i />
                  <ArrowLeftRight size={16} strokeWidth={1.75} />
                  <i />
                  <span className="mcs-tile">{entry.icon ?? <Mark brand={entry.brand} size={40} />}</span>
                </div>
                <p className="mcs-authh">
                  {clientName} wants to use your {entry.name} account
                </p>
                <span className="mcs-account">
                  <span className="mcs-avatar">{account.avatar ? <img src={account.avatar} alt="" /> : initials(account.name)}</span>
                  <b style={{ fontWeight: 500 }}>{account.name}</b>
                  <em>{account.email}</em>
                </span>
                <div className="mcs-scopes">
                  <p>This lets the agent</p>
                  <ul>
                    {(entry.scopes && entry.scopes.length
                      ? entry.scopes
                      : [`Read data from ${entry.name}`, `Take actions in ${entry.name} only when you allow it`]
                    ).map((scope) => (
                      <li key={scope}>
                        <Check size={14} strokeWidth={2} aria-hidden />
                        {scope}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mcs-sfoot">
                <span className="mcs-sfoot-note">
                  {hasConnect ? `You will approve this with ${entry.name}.` : `No ${entry.name} account is contacted.`}
                </span>
                <span className="mcs-sfoot-actions">
                  <button type="button" className="mcs-btn" data-variant="ghost" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="button" className="mcs-btn" data-variant="primary" data-mcs-authorize onClick={onAuthorize}>
                    Authorize
                  </button>
                </span>
              </div>
            </div>
          )}

          {step === "discover" && entry && (
            <div className="mcs-step" key="disc" data-dir={sheet.dir}>
              <div className="mcs-sscroll">
                <div className="mcs-disc">
                  <Mark brand={entry.brand} icon={entry.icon} size={32} />
                  <div className="mcs-disctext">
                    <span className="mcs-disclabel" tabIndex={-1} data-mcs-heading>
                      {sheet.stage === "done" ? (
                        <>
                          <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
                          Found {sheet.found.length} {sheet.found.length === 1 ? "tool" : "tools"}
                        </>
                      ) : sheet.stage === "error" ? (
                        <>
                          <CircleAlert size={16} strokeWidth={1.75} aria-hidden style={{ color: "var(--mcs-err)" }} />
                          Could not connect
                        </>
                      ) : (
                        <span className="mcs-shimmer" data-text="Discovering tools">
                          Discovering tools
                        </span>
                      )}
                    </span>
                    <span className="mcs-endpoint mcs-mono">{entry.endpoint}</span>
                  </div>
                </div>

                {sheet.stage === "error" ? (
                  <div className="mcs-err" role="alert">
                    <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
                    <span>{sheet.error}</span>
                  </div>
                ) : (
                  <ul className="mcs-tools" aria-label={`${entry.name} tools`}>
                    {sheet.found.map((tool) => (
                      <ToolRow key={tool.id} tool={tool} serverName={entry.name} onToggle={(next) => onToggle(tool.id, next)} />
                    ))}
                  </ul>
                )}
              </div>
              <div className="mcs-sfoot">
                <span className="mcs-sfoot-note mcs-num">
                  {sheet.stage === "error" ? "Nothing was added." : `${foundOn.length} on · ${foundTokens.toLocaleString("en-US")} tokens`}
                </span>
                <span className="mcs-sfoot-actions">
                  {sheet.stage === "error" ? (
                    <button type="button" className="mcs-btn" data-variant="primary" onClick={onRetry}>
                      Try again
                    </button>
                  ) : (
                    <button type="button" className="mcs-btn" data-variant="primary" disabled={sheet.stage !== "done"} onClick={onDone}>
                      {sheet.kind === "reconnect" ? "Done" : "Add server"}
                    </button>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Directory({
  dir,
  directory,
  servers,
  onPick,
  onUrl,
}: {
  dir: "fwd" | "back"
  directory: McpDirectoryEntry[]
  servers: ServerState[]
  onPick: (e: McpDirectoryEntry) => void
  onUrl: (url: string) => void
}) {
  const uid = React.useId()
  const [query, setQuery] = React.useState("")
  const [url, setUrl] = React.useState("")
  const listRef = React.useRef<HTMLUListElement>(null)
  const q = query.trim().toLowerCase()
  const shown = q ? directory.filter((d) => `${d.name} ${d.description}`.toLowerCase().includes(q)) : directory
  const added = new Set(servers.filter((s) => !s.removed).map((s) => s.id))

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      listRef.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus()
    }
  }
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [])
    const i = items.indexOf(e.target as HTMLElement)
    if (e.key === "ArrowDown") items[Math.min(items.length - 1, i + 1)]?.focus()
    else if (i <= 0) (e.currentTarget.parentElement?.querySelector("[data-mcs-search]") as HTMLElement | null)?.focus()
    else items[i - 1]?.focus()
  }

  return (
    <div className="mcs-step" data-dir={dir}>
      <div className="mcs-sscroll">
        <div className="mcs-field">
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <label className="mcs-sr" htmlFor={`${uid}-search`}>
            Search servers
          </label>
          <input
            id={`${uid}-search`}
            data-mcs-search
            type="text"
            value={query}
            placeholder="Search servers"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
          />
          {query && (
            <button type="button" className="mcs-clear" aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="mcs-empty">No servers match “{query}”.</p>
        ) : (
          <ul className="mcs-dir" ref={listRef} onKeyDown={onListKey} aria-label="Server directory">
            {shown.map((d) => {
              const isAdded = added.has(d.id)
              return (
                <li key={d.id}>
                  <button type="button" className="mcs-entry" disabled={isAdded} onClick={() => onPick(d)}>
                    <Mark brand={d.brand} icon={d.icon} size={28} />
                    <span className="mcs-entrytext">
                      <span className="mcs-name">{d.name}</span>
                      <span className="mcs-entrydesc">{d.description}</span>
                    </span>
                    <span className="mcs-entrymeta">
                      {isAdded ? (
                        <>
                          <Check size={14} strokeWidth={2} aria-hidden />
                          Added
                        </>
                      ) : (
                        <>
                          {d.transport === "remote" ? "Remote" : "Local"}
                          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
                        </>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <form
        className="mcs-url"
        onSubmit={(e) => {
          e.preventDefault()
          if (url.trim()) onUrl(url)
        }}
      >
        <label htmlFor={`${uid}-url`}>Or connect by URL</label>
        <div className="mcs-urlrow">
          <div className="mcs-field">
            <input
              id={`${uid}-url`}
              type="text"
              inputMode="url"
              value={url}
              placeholder="https://mcp.example.com/mcp"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="mcs-btn" disabled={!url.trim()} style={!url.trim() ? { opacity: 0.5 } : undefined}>
            Connect
          </button>
        </div>
      </form>
    </div>
  )
}
