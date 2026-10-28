"use client"

import * as React from "react"
import {
  BookOpenText,
  ChevronDown,
  FileDown,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Menu,
  PenLine,
  Radar,
  RotateCcw,
  Search,
  Wallet,
  type LucideIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ResearchDeskProps = {
  /** Called with the label of a rail item the user clicked. */
  onNavigate?: (label: string) => void
  /** Extra controls rendered at the bottom of the rail, above the user. */
  sideTools?: React.ReactNode
}

type SourceKind = "SURVEY" | "DASHBOARD" | "NEWS" | "PDF" | "DATASET"
type Source = { no: number; title: string; domain: string; kind: SourceKind; relevance: number; read: boolean }
type Evidence = { loc: string; excerpt: string; match: string }
type ClaimData = { src?: number; found?: { src: number } & Evidence } & Partial<Evidence>
type Seg = string | readonly [claim: string, text: string]
type Note = { id: string; kind: "note" | "warn"; text: string; claim?: string; foundText?: string; late?: boolean }
type Para = { id: string; segs: Seg[]; notes: Note[] }
type Section = { id: string; no: string; title: string; dek: string; conf: number; err: number; paras: Para[]; live?: boolean }
type Phase = "write" | "verify" | "done"
type Run = { phase: Phase; typed: number }
type FindState = "searching" | "found"
type Pt = [number, number]
type Geo = { id: string | null; evTop: number; left: Pt[] | null; right: Pt[] | null; warn: boolean; hide: boolean; dots: [number, number][] }

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const SOURCES: Source[] = [
  { no: 1, title: "Leeds shopper pulse, Q3 2026", domain: "northwind-insights.co", kind: "SURVEY", relevance: 0.94, read: true },
  { no: 2, title: "Same-day orders by postcode", domain: "dashboards.harborfinch.internal", kind: "DASHBOARD", relevance: 0.91, read: true },
  { no: 3, title: "Courier rate card 2026-27", domain: "parcelwise.co.uk", kind: "PDF", relevance: 0.88, read: true },
  { no: 4, title: "Sheffield launch review", domain: "docs.harborfinch.internal", kind: "PDF", relevance: 0.86, read: true },
  { no: 5, title: "Delivery failures and refunds", domain: "dashboards.harborfinch.internal", kind: "DASHBOARD", relevance: 0.83, read: true },
  { no: 6, title: "Peak-hour order timing, 90 days", domain: "dashboards.harborfinch.internal", kind: "DASHBOARD", relevance: 0.81, read: true },
  { no: 7, title: "Driver supply in West Yorkshire", domain: "kestrel-labs.com", kind: "DATASET", relevance: 0.79, read: true },
  { no: 8, title: "Rival same-day coverage map", domain: "mapwatch.io", kind: "DATASET", relevance: 0.76, read: true },
  { no: 9, title: "Dark stores arrive on Kirkgate", domain: "leedsdigest.co.uk", kind: "NEWS", relevance: 0.72, read: true },
  { no: 10, title: "Northern online grocery sizing", domain: "fieldnote-analytics.com", kind: "PDF", relevance: 0.67, read: false },
  { no: 11, title: "Holbeck unit lease and fit-out", domain: "docs.harborfinch.internal", kind: "PDF", relevance: 0.62, read: false },
  { no: 12, title: "Clean-air zone, phase two", domain: "transport-notes.org", kind: "PDF", relevance: 0.58, read: true },
  { no: 13, title: "Packaging cost trend, H2", domain: "supplychain-weekly.com", kind: "NEWS", relevance: 0.41, read: true },
  { no: 14, title: "Northern footfall index", domain: "retailpulse.io", kind: "DATASET", relevance: 0.38, read: false },
]

const CLAIMS: Record<string, ClaimData> = {
  c1: { src: 1, loc: "p.9", excerpt: "…respondents ranked same-day delivery third of eleven reasons to choose a pantry retailer, behind price and range…", match: "ranked same-day delivery third of eleven" },
  c2: { src: 4, loc: "§ 3.2", excerpt: "Cost per drop crossed below the £4.10 contribution line in month four and stayed there.", match: "in month four" },
  c3: { src: 3, loc: "Table 2", excerpt: "Tier 3 pricing applies from 40 drops per route-day. Below that, routes revert to Tier 2 or Tier 1 rates.", match: "from 40 drops per route-day" },
  c4: { src: 2, loc: "tab Q3", excerpt: "LS1–LS8 accounted for 1,940 of 3,340 Leeds-area orders in Q3, from existing customers.", match: "1,940 of 3,340 Leeds-area orders" },
  c5: { src: 1, loc: "p.14", excerpt: "…61% said they would pay up to £2.50 extra for delivery on the same day.", match: "61% said they would pay up to £2.50 extra" },
  c6: { src: 1, loc: "p.3", excerpt: "Sample: 212 adults aged 18+, LS1–LS19, online panel, fieldwork 3–17 September.", match: "212 adults" },
  c7: { src: 2, loc: "tab Sheffield", excerpt: "Same-day share of Sheffield orders: month 1, 9%; month 12, 17%.", match: "month 12, 17%" },
  c8: { found: { src: 14, loc: "tab LS", excerpt: "Evening footfall in LS6 is up 18% year on year, the highest in the city.", match: "LS6 is up 18% year on year" } },
  c9: { src: 3, loc: "Table 2", excerpt: "Tier 2 (20–39 drops): £4.70 per drop. Tier 3 (40+): £3.85 per drop, all-in.", match: "Tier 3 (40+): £3.85 per drop" },
  c10: { src: 7, loc: "tab WY", excerpt: "West Yorkshire: 6.1 available same-day drivers per 1,000 weekly orders, down from 7.4 last year.", match: "6.1 available same-day drivers per 1,000 weekly orders" },
  c11: { src: 5, loc: "Sheffield, 12 mo", excerpt: "Failed first attempts add £2.30 mean cost per parcel (redelivery plus support contact).", match: "£2.30 mean cost per parcel" },
  c12: { src: 11, loc: "§ 6", excerpt: "Fit-out estimate for the Holbeck unit: £46,500 ex VAT, ten working days.", match: "£46,500 ex VAT" },
  c13: { src: 8, loc: "layer 2", excerpt: "Rival A: LS1–LS4, order cut-off 13:00. Rival B: LS1–LS4, order cut-off 13:00.", match: "LS1–LS4, order cut-off 13:00" },
  c14: { src: 9, loc: "para 3", excerpt: "The grocer will open two dark stores on Kirkgate by spring 2027, according to planning filings.", match: "two dark stores on Kirkgate by spring 2027" },
  c15: { found: { src: 8, loc: "layer 4", excerpt: "Delivery fee for both rivals: £3.99. No free same-day tier.", match: "No free same-day tier" } },
  c16: { src: 12, loc: "p.2", excerpt: "Phase two applies a £1.10 per-trip charge to diesel vans from March.", match: "£1.10 per-trip charge to diesel vans" },
  c17: { src: 6, loc: "tab Hourly", excerpt: "62% of same-day orders were placed between 17:00 and 20:00 over the last 90 days.", match: "between 17:00 and 20:00" },
  c18: { src: 10, loc: "p.22", excerpt: "Leeds city region: roughly 41,000 weekly online grocery-style drops, 2026 estimate.", match: "roughly 41,000 weekly online grocery-style drops" },
}

const SECTIONS: Section[] = [
  {
    id: "bottom",
    no: "01",
    title: "Bottom line",
    dek: "Go ahead, but as a six-week pilot with a hard density test.",
    conf: 0.84,
    err: 0.05,
    paras: [
      {
        id: "p1",
        segs: [
          "Expansion looks justified, but only as a pilot. ",
          ["c1", "Leeds shoppers rank same-day delivery third of eleven reasons to pick a pantry retailer"],
          ", and ",
          ["c2", "the Sheffield service passed break-even on cost per drop in its fourth month"],
          ". The open question is courier density: ",
          ["c3", "the rate card only becomes cheap above 40 drops per route-day"],
          ".",
        ],
        notes: [{ id: "n1", kind: "note", text: "Lead with the pilot, not the launch. The cost case only holds at density." }],
      },
      {
        id: "p2",
        segs: [
          "We recommend a six-week pilot across LS1–LS8. ",
          ["c4", "Those postcodes produced 58% of existing Leeds-area orders last quarter"],
          ", enough volume to test the 40-drop threshold on two routes.",
        ],
        notes: [],
      },
    ],
  },
  {
    id: "cost",
    no: "02",
    title: "Cost to serve",
    dek: "What a drop costs at pilot density, and what limits it.",
    conf: 0.86,
    err: 0.04,
    live: true,
    paras: [
      {
        id: "p5",
        segs: [
          "At 40 drops per route-day, blended cost to serve in Leeds comes to ",
          ["c9", "£3.85 a drop against a £4.10 contribution line"],
          ". Driver supply is the tighter limit: ",
          ["c10", "West Yorkshire has roughly 6 available same-day drivers per 1,000 weekly orders"],
          ", so the pilot should cap at two routes. Failed first attempts matter too – ",
          ["c11", "each one cost £2.30 extra in Sheffield"],
          " – and ",
          ["c12", "the Holbeck unit can be fitted out for under £48k"],
          ".",
        ],
        notes: [{ id: "n4", kind: "note", late: true, text: "Cost per drop falls fast up to 40 drops, then flattens. Two routes is the sensible ceiling." }],
      },
    ],
  },
  {
    id: "demand",
    no: "03",
    title: "Demand in Leeds",
    dek: "What shoppers say they want, and what Sheffield suggests they will do.",
    conf: 0.78,
    err: 0.09,
    paras: [
      {
        id: "p3",
        segs: [
          ["c5", "61% of surveyed Leeds shoppers said they would pay up to £2.50 extra for same-day delivery"],
          ", though ",
          ["c6", "the sample is 212 adults"],
          " and leans towards postcodes we already serve. Order data points the same way: ",
          ["c7", "same-day share of Sheffield orders grew from 9% to 17% in its first year"],
          ".",
        ],
        notes: [{ id: "n2", kind: "note", text: "Sample is small (n=212) – treat as directional." }],
      },
      {
        id: "p4",
        segs: ["We expect early demand to concentrate in the north-west: ", ["c8", "LS6 should be the strongest postcode, led by students and young professionals"], "."],
        notes: [
          {
            id: "n3",
            kind: "warn",
            claim: "c8",
            text: "Sage inferred this from Sheffield’s student postcodes. Treat it as a hypothesis.",
            foundText: "Evening footfall in LS6 is up 18% on last year (S14). The claim is now supported.",
          },
        ],
      },
    ],
  },
  {
    id: "rivals",
    no: "04",
    title: "Competitors and coverage",
    dek: "Who already promises same-day in the city, and where.",
    conf: 0.71,
    err: 0.11,
    paras: [
      {
        id: "p6",
        segs: [
          "Two rivals already promise same-day in parts of the city. ",
          ["c13", "Both cover LS1–LS4 only, with order cut-offs at 1pm"],
          ", and ",
          ["c14", "a third plans two dark stores on Kirkgate by spring 2027"],
          ". ",
          ["c15", "Neither offers free same-day delivery"],
          ", which leaves room to compete on the fee.",
        ],
        notes: [
          {
            id: "n5",
            kind: "warn",
            claim: "c15",
            text: "Neither rival’s pricing page was reachable during the search.",
            foundText: "Both rivals charge £3.99 with no free tier (S08). The claim is now supported.",
          },
          { id: "n6", kind: "note", text: "The coverage map is 11 days old. Recheck before launch." },
        ],
      },
    ],
  },
  {
    id: "risks",
    no: "05",
    title: "Risks and pilot design",
    dek: "Three things that could sink the pilot, each with an owner.",
    conf: 0.8,
    err: 0.07,
    paras: [
      {
        id: "p7",
        segs: [
          "Three risks need an owner. ",
          ["c16", "The phase-two clean-air zone adds £1.10 per trip for diesel vans from March"],
          ", so the pilot fleet should be electric or leased. ",
          ["c17", "Most same-day orders arrive between 5 and 8pm"],
          ", which argues for two late-starting routes rather than three early ones.",
        ],
        notes: [],
      },
      {
        id: "p8",
        segs: ["Finally, size the prize carefully: ", ["c18", "the Leeds city region generates about 41,000 weekly online grocery-style drops"], ", so even a 1.5% share would fill both pilot routes."],
        notes: [{ id: "n7", kind: "note", text: "The market size comes from a skimmed source (S10). Read it in full before sizing a second route." }],
      },
    ],
  },
]

const CLAIM_IDS = Object.keys(CLAIMS)
const SECTION_CLAIMS: Record<string, Set<string>> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, new Set(s.paras.flatMap((p) => p.segs.filter((g): g is readonly [string, string] => typeof g !== "string").map((g) => g[0])))]),
)
const CLAIM_ORDER = SECTIONS.flatMap((s) => s.paras.flatMap((p) => p.segs.filter((g): g is readonly [string, string] => typeof g !== "string").map((g) => g[0])))
const CLAIM_NO: Record<string, number> = Object.fromEntries(CLAIM_ORDER.map((id, i) => [id, i + 1]))
const LIVE_SECTION = SECTIONS.find((s) => s.live)!
const LIVE_SEGS = LIVE_SECTION.paras[0].segs
const segText = (g: Seg) => (typeof g === "string" ? g : g[1])
const LIVE_TEXT = LIVE_SEGS.map(segText).join("")
const LIVE_LEN = LIVE_TEXT.length

const NAV_CONSOLE: { label: string; icon: LucideIcon }[] = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]
const NAV_OPS: { label: string; icon: LucideIcon }[] = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]
const ACTIVE_NAV = "Research desk"

const START: Run = { phase: "write", typed: 0 }
const DONE: Run = { phase: "done", typed: LIVE_LEN }
const EMPTY_GEO: Geo = { id: null, evTop: 0, left: null, right: null, warn: false, hide: false, dots: [] }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ird {
  --ird-paper: #fafafa;
  --ird-sheet: #ffffff;
  --ird-ink: #0a0a0a;
  --ird-signal: #0060e2;
  --ird-accent: var(--ird-signal);
  --ird-surface: var(--ird-sheet);
  --ird-signal-soft: color-mix(in oklab, var(--ird-accent) 12%, transparent);
  --ird-t1: color-mix(in oklab, var(--ird-ink) 92%, transparent);
  --ird-t2: color-mix(in oklab, var(--ird-ink) 64%, transparent);
  --ird-t3: color-mix(in oklab, var(--ird-ink) 44%, transparent);
  --ird-t4: color-mix(in oklab, var(--ird-ink) 22%, transparent);
  --ird-rule: color-mix(in oklab, var(--ird-ink) 14%, transparent);
  --ird-rule-2: color-mix(in oklab, var(--ird-ink) 7%, transparent);
  --ird-ok: #1f8a4c;
  --ird-warn: #b7791f;
  --ird-bad: #c4321a;
  --ird-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ird-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ird-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ird-font: var(--ird-sans);
  --ird-ease: cubic-bezier(.2, .8, .2, 1);
  --ird-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  container: ird / inline-size;
  background: var(--ird-paper);
  font: 13px/20px var(--ird-font);
  color: var(--ird-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ird {
  --ird-paper: #0c0c0d;
  --ird-sheet: #1c1c1e;
  --ird-ink: #f5f5f5;
  --ird-signal: #4d8dff;
  --ird-ok: #43c47c;
  --ird-warn: #e2a63e;
  --ird-bad: #ff7a5c;
}
.ird *, .ird *::before, .ird *::after { box-sizing: border-box }
:where(.ird) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.ird :focus-visible { outline: 2px solid color-mix(in oklab, var(--ird-accent) 60%, transparent); outline-offset: 1px }
.ird h1, .ird h2, .ird h3, .ird p, .ird ul, .ird dl, .ird dd, .ird blockquote { margin: 0; padding: 0 }
.ird ul { list-style: none }
.ird-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.ird-lab { font: 500 10.5px/14px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }

/* ---------- Shell ---------- */
.ird-shell { position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden }
/* ---- rail ---- */
.ird-rlab { font-family: var(--ird-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }
.ird-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--ird-sheet); border-right: 1px solid var(--ird-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.ird-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--ird-serif); letter-spacing: -.01em; color: var(--ird-ink) }
.ird-brand svg { flex: none }
.ird-rgroup { padding: 0 12px; margin-top: 12px }
.ird-rgroup > .ird-rlab { padding: 0 6px; margin-bottom: 6px; display: block }
.ird-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ird-rule); background: var(--ird-paper); color: var(--ird-t1); transition: box-shadow .2s var(--ird-ease) }
.ird-ws:hover { box-shadow: 0 0 0 1px var(--ird-t4) }
.ird-ws svg { color: var(--ird-t3) }
.ird-rnav { position: relative; margin: 0 0 0 8px; padding: 0 }
.ird-rnav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--ird-rule) }
.ird-ritem { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--ird-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--ird-ease), background-color .2s var(--ird-ease) }
.ird-ritem:hover { color: var(--ird-t1); background: var(--ird-rule-2) }
.ird-ritem svg { flex: none; stroke-width: 1.5 }
.ird-ritem.is-active { color: var(--ird-ink) }
.ird-ritem.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--ird-accent); transform-origin: top; animation: ird-rtick .5s var(--ird-ease) backwards }
.ird-ragent { padding-left: 16px }
.ird-rdot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--ird-t4); position: relative }
.ird-rdot.ok { background: var(--ird-ok) }
.ird-rdot.live { background: var(--ird-accent) }
.ird-rdot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--ird-accent); animation: ird-rpulse 1.6s var(--ird-ease) infinite }
.ird-ragent .ird-rlab { margin-left: auto; font-size: 9.5px }
.ird-rspacer { flex: 1; min-height: 12px }
.ird-ruser { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--ird-rule) }
.ird-rav { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--ird-ink); color: var(--ird-paper); font: 600 10px/1 var(--ird-mono); letter-spacing: .04em }
.ird-ruser b { font-weight: 500; color: var(--ird-t1); display: block; line-height: 16px }
.ird-ruser div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--ird-t3) }
.ird-sidetools { padding: 8px 12px }
.ird-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--ird-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--ird-ease) }

/* ---- main + top bar ---- */
.ird-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--ird-rule); background: var(--ird-paper) }
.ird-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--ird-rule); background: var(--ird-sheet) }
.ird-ttl { min-width: 0 }
.ird-ttl .ird-crumb { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.ird-ttl h1 { margin: 0; font: 400 22px/24px var(--ird-serif); letter-spacing: -.01em; color: var(--ird-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ird-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.ird-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ird-rule); background: var(--ird-sheet); color: var(--ird-t3); transition: box-shadow .2s var(--ird-ease) }
.ird-search:hover { box-shadow: 0 0 0 1px var(--ird-t4) }
.ird-search span { flex: 1 }
.ird-search kbd { font: 500 10px/14px var(--ird-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ird-rule); color: var(--ird-t3) }
.ird-tbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ird-rule); background: var(--ird-sheet); color: var(--ird-t1); font-weight: 500; transition: box-shadow .2s var(--ird-ease), opacity .2s }
.ird-tbtn svg { flex: none }
.ird-tbtn:hover { box-shadow: 0 0 0 1px var(--ird-t3) }
.ird-tbtn.ink { background: var(--ird-ink); color: var(--ird-paper); box-shadow: none }
.ird-tbtn.ink:hover { opacity: .88 }
.ird-search input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; outline: 0; background: none; color: var(--ird-t1); font: inherit; -webkit-appearance: none; appearance: none }
.ird-search input::placeholder { color: var(--ird-t3); opacity: 1 }
.ird-search input::-webkit-search-cancel-button { display: none }
.ird-search:focus-within { box-shadow: 0 0 0 1px var(--ird-t3) }
@keyframes ird-rpulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes ird-rtick { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* ---- rail + top bar: responsive (shared by all Meridian screens) ---- */
@media (max-width: 1023px) {
  .ird-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--ird-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--ird-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .ird-shell.is-open .ird-rail { transform: none; visibility: visible; transition: transform .32s var(--ird-ease), visibility 0s }
  .ird-shell.is-open .ird-scrim { opacity: 1; pointer-events: auto }
  .ird-menu { display: grid }
}
@media (max-width: 1099px) { .ird-search { display: none } }
@media (max-width: 767px) {
  .ird-top { padding: 0 12px; gap: 10px }
  .ird-ttl .ird-crumb { display: none }
  .ird-ttl h1 { font-size: 21px }
}

.ird-main { position: relative; flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; container: irdm / inline-size }
@media (max-width: 767px) {
  .ird-tbtn .lbl { display: none }
  .ird-tbtn[data-icon] { width: 30px; padding: 0 }
}

/* ---------- Body ---------- */
.ird-body { position: relative; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain }
@container irdm (min-width: 1040px) {
  .ird-body { display: flex; flex-direction: column; overflow: hidden }
}

/* ---------- Brief header ---------- */
.ird-brief { position: relative; flex: none; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 18px 28px 14px; border-bottom: 1px solid var(--ird-rule) }
.ird-brief::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle, var(--ird-rule) .8px, transparent 1.1px) 0 0 / 8px 8px; -webkit-mask-image: radial-gradient(ellipse 70% 120% at 85% 0%, #000, transparent 75%); mask-image: radial-gradient(ellipse 70% 120% at 85% 0%, #000, transparent 75%); opacity: .8 }
.ird-brief > * { position: relative }
.ird-q { margin-top: 5px; max-width: 21em; font: 400 32px/36px var(--ird-serif); letter-spacing: -.01em; color: var(--ird-ink); text-wrap: balance }
.ird-q em { font-style: italic }
.ird-read { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 1px; align-self: end; background: var(--ird-rule); border: 1px solid var(--ird-rule); border-radius: 2px }
.ird-read > div { min-width: 0; padding: 8px 12px 9px; background: var(--ird-sheet) }
.ird-read dt { font: 500 10.5px/14px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }
.ird-read dd { margin-top: 2px; font: 500 18px/22px var(--ird-mono); font-variant-numeric: tabular-nums; color: var(--ird-ink); white-space: nowrap }
.ird-read dd small { margin-left: 4px; font: 400 11px/16px var(--ird-mono); color: var(--ird-t3) }
@container irdm (min-width: 1040px) {
  .ird-brief { grid-template-columns: minmax(0, 1fr) auto; column-gap: 36px }
  .ird-read { grid-template-columns: repeat(5, auto) }
  .ird-run { grid-column: 1 / -1 }
}
@container irdm (max-width: 767px) {
  .ird-brief { padding: 16px 16px 12px }
  .ird-read { grid-template-columns: repeat(6, 1fr) }
  .ird-read > div { grid-column: span 2 }
  .ird-read > div:nth-child(n + 4) { grid-column: span 3 }
  .ird-q { font-size: 26px; line-height: 30px }
}

/* ---------- Run ruler ---------- */
.ird-phases { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) }
.ird-ph { min-width: 0; padding-right: 8px; color: var(--ird-t3) }
.ird-ph b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 500 10.5px/14px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; transition: color .3s }
.ird-ph span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 11px/16px var(--ird-mono); color: var(--ird-t3) }
.ird-ph[data-s="done"] b { color: var(--ird-t2) }
.ird-ph[data-s="now"] b { color: var(--ird-ink) }
.ird-ph[data-s="now"] span { color: var(--ird-t2) }
.ird-ruler { position: relative; height: 18px; margin-top: 5px }
.ird-ruler::before { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--ird-rule) }
.ird-rticks, .ird-rfill { position: absolute; left: 0; right: 0; bottom: 1px; height: 5px; background: repeating-linear-gradient(90deg, var(--ird-t4) 0 1px, transparent 1px 2%) }
.ird-rfill { height: 6px; bottom: 0; background: repeating-linear-gradient(90deg, var(--ird-ink) 0 1px, transparent 1px 2%), linear-gradient(var(--ird-ink), var(--ird-ink)) bottom / 100% 1px no-repeat; transition: clip-path .7s var(--ird-ease); animation: ird-fill 1s var(--ird-ease-trace) backwards }
.ird-rmaj { position: absolute; bottom: 0; width: 1px; height: 11px; background: var(--ird-t3) }
.ird-rnow { position: absolute; bottom: -1px; width: 2px; height: 16px; margin-left: -1px; background: var(--ird-accent); transition: left .7s var(--ird-ease); animation: ird-tick .7s var(--ird-ease) backwards; transform-origin: bottom }
.ird-fig { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px }
.ird-fig .cap { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ird-replay { display: inline-flex; align-items: center; gap: 6px; flex: none; height: 20px; color: var(--ird-t2); transition: color .2s }
.ird-replay:hover { color: var(--ird-ink) }
@container irdm (max-width: 767px) {
  .ird-ph span { display: none }
  .ird-fig .cap { white-space: normal }
}

/* ---------- Columns ---------- */
.ird-cols { display: block }
@container irdm (min-width: 1040px) {
  .ird-cols { flex: 1; min-height: 0; display: grid; grid-template-columns: 248px minmax(0, 1fr) }
}

/* ---------- Sources ---------- */
.ird-src { min-width: 0; min-height: 0; display: flex; flex-direction: column; border-bottom: 1px solid var(--ird-rule) }
.ird-src-head { padding: 18px 16px 0 }
.ird-src-head h2, .ird-src-toggle h2 { margin-top: 3px; font: 400 22px/26px var(--ird-serif); letter-spacing: -.01em; color: var(--ird-ink) }
.ird-src-head p, .ird-src-toggle p { margin-top: 3px; color: var(--ird-t2); font-size: 12.5px; line-height: 18px }
.ird-src-toggle { display: none; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 14px 16px; text-align: left }
.ird-src-toggle svg { flex: none; color: var(--ird-t3); transition: transform .35s var(--ird-ease) }
.ird-src-toggle[aria-expanded="true"] svg { transform: rotate(180deg) }
.ird-fold { display: flex; flex-direction: column; flex: 1; min-height: 0 }
.ird-fold-in { display: flex; flex-direction: column; flex: 1; min-height: 0 }
.ird-seg { display: grid; grid-template-columns: repeat(3, 1fr); margin: 12px 16px 6px; border: 1px solid var(--ird-rule); border-radius: 2px; background: var(--ird-sheet) }
.ird-seg button { height: 28px; text-align: center; font: 500 10.5px/1 var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t2); transition: background-color .2s, color .2s }
.ird-seg button + button { border-left: 1px solid var(--ird-rule) }
.ird-seg button:hover { color: var(--ird-ink) }
.ird-seg button[aria-pressed="true"] { background: var(--ird-ink); color: var(--ird-paper) }
.ird-seg i { margin-left: 4px; font-style: normal; opacity: .6 }
.ird-src-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px 120px; overscroll-behavior: contain }
.ird-src-list { display: grid; grid-template-columns: 1fr; gap: 14px }
.ird-scard { position: relative; display: block; width: 100%; padding: 10px 12px 10px 14px; background: var(--ird-sheet); text-align: left; animation: ird-in .5s var(--ird-ease) backwards }
.ird-crop::before {
  content: ""; position: absolute; inset: -4px; pointer-events: none; --c: var(--ird-t4);
  background:
    linear-gradient(var(--c), var(--c)) 0 0 / 8px 1px no-repeat, linear-gradient(var(--c), var(--c)) 0 0 / 1px 8px no-repeat,
    linear-gradient(var(--c), var(--c)) 100% 0 / 8px 1px no-repeat, linear-gradient(var(--c), var(--c)) 100% 0 / 1px 8px no-repeat,
    linear-gradient(var(--c), var(--c)) 0 100% / 8px 1px no-repeat, linear-gradient(var(--c), var(--c)) 0 100% / 1px 8px no-repeat,
    linear-gradient(var(--c), var(--c)) 100% 100% / 8px 1px no-repeat, linear-gradient(var(--c), var(--c)) 100% 100% / 1px 8px no-repeat;
}
.ird-scard::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--ird-accent); transform: scaleY(0); transform-origin: top; transition: transform .35s var(--ird-ease) }
.ird-scard[data-active]::after { transform: none }
.ird-scard[data-active] .ttl { color: var(--ird-ink) }
.ird-scard .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 500 10.5px/14px var(--ird-mono); letter-spacing: .08em; color: var(--ird-t3) }
.ird-st { display: inline-flex; align-items: center; gap: 5px }
.ird-st::before { content: ""; width: 5px; height: 5px; border: 1px solid var(--ird-t3) }
.ird-st[data-r="read"] { color: var(--ird-t1) }
.ird-st[data-r="read"]::before { background: var(--ird-ink); border-color: var(--ird-ink) }
.ird-scard .ttl { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 5px; font-weight: 500; font-size: 13px; line-height: 18px; color: var(--ird-t1) }
.ird-scard .dom { margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 11px/16px var(--ird-mono); color: var(--ird-t3) }
.ird-scard .bot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; font: 500 10.5px/14px var(--ird-mono); letter-spacing: .06em; color: var(--ird-t3) }
.ird-scard .rel { display: inline-flex; align-items: center; gap: 7px; color: var(--ird-t2); font-variant-numeric: tabular-nums }
.ird-scard .cn { text-transform: uppercase }
.ird-scard .cn[data-n="0"] { color: var(--ird-t4) }
.ird-empty { padding: 20px 0; font: 400 italic 15px/20px var(--ird-serif); color: var(--ird-t3) }
@container irdm (min-width: 1040px) {
  .ird-src { border-right: 1px solid var(--ird-rule); border-bottom: 0 }
}
@container irdm (max-width: 1039px) {
  .ird-src { padding: 0 8px 0 4px }
  .ird-src-head { display: none }
  .ird-src-toggle { display: flex }
  .ird-fold { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .45s var(--ird-ease), visibility 0s linear .45s }
  .ird-fold[data-open] { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows .45s var(--ird-ease) }
  .ird-fold-in { overflow: hidden; display: block }
  .ird-src-scroll { overflow: visible; padding-bottom: 20px }
  .ird-src-list { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) }
}
@container irdm (max-width: 767px) {
  .ird-src { padding: 0 }
  .ird-seg { margin-left: 16px; margin-right: 16px }
}

/* ---------- Document ---------- */
.ird-doc { position: relative; min-width: 0; min-height: 0 }
@container irdm (min-width: 1040px) {
  .ird-doc { overflow-y: auto; overscroll-behavior: contain }
}
.ird-doc-in { padding: 24px 24px 160px }
.ird-row { --mw: 240px; display: grid; grid-template-columns: minmax(0, 1fr) }
@container irdm (min-width: 768px) {
  .ird-row { grid-template-columns: minmax(0, 700px) var(--mw); justify-content: center }
}
@container irdm (min-width: 1040px) { .ird-row { --mw: 272px } }
@container irdm (min-width: 1320px) { .ird-row { --mw: 288px } }
.ird-text { position: relative; padding: 0 32px; background: var(--ird-sheet); border-left: 1px solid var(--ird-rule); border-right: 1px solid var(--ird-rule) }
.ird-row[data-first] .ird-text { border-top: 1px solid var(--ird-rule); padding-top: 20px }
.ird-row[data-last] .ird-text { border-bottom: 1px solid var(--ird-rule); padding-bottom: 20px }
.ird-mast { display: flex; flex-wrap: wrap; gap: 4px 14px; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--ird-rule) }
.ird-sec-top { display: flex; align-items: center; gap: 10px; padding-top: 30px }
.ird-sec-top::after { content: ""; flex: 1; height: 1px; background: var(--ird-rule) }
.ird-sec-h { margin-top: 8px; font: 400 28px/32px var(--ird-serif); letter-spacing: -.01em; color: var(--ird-ink) }
.ird-dek { margin-top: 5px; color: var(--ird-t2); font-size: 13px; line-height: 20px }
.ird-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; padding-bottom: 8px; margin-top: 12px; font: 500 10.5px/16px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }
.ird-meta .cf { display: inline-flex; align-items: center; gap: 8px }
.ird-meta .v { color: var(--ird-ink); font-variant-numeric: tabular-nums }
.ird-meta .v small { color: var(--ird-t3); font-size: inherit }
.ird-meta .w { color: var(--ird-warn) }
.ird-tag { display: inline-flex; align-items: center; gap: 6px; color: var(--ird-t1) }
.ird-tag::before { content: ""; width: 5px; height: 5px; background: var(--ird-ink) }
.ird-p { padding: 10px 0 12px; font: 400 14.5px/25px var(--ird-sans); color: var(--ird-t1); text-wrap: pretty }
.ird-text[data-scan]::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--ird-accent); opacity: 0; animation: ird-sweep 1.2s var(--ird-ease) 2 }
.ird-marg { position: relative; padding: 12px 0 6px 20px }
@container irdm (max-width: 767px) {
  .ird-doc-in { padding: 16px 0 100px }
  .ird-text { padding: 0 18px; border-left: 0; border-right: 0 }
  .ird-row[data-first] .ird-text { border-top: 1px solid var(--ird-rule) }
  .ird-marg { padding: 0 18px 8px; background: var(--ird-sheet) }
  .ird-sec-h { font-size: 25px; line-height: 29px }
  .ird-p { font-size: 15px }
}

/* claims */
.ird-claim { cursor: pointer; border-radius: 1px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: var(--ird-t4); -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color .2s, text-decoration-color .2s }
.ird-claim:hover, .ird-claim[data-active], .ird-claim[data-hot] { background: var(--ird-signal-soft); text-decoration-color: var(--ird-accent) }
.ird-claim[data-warn] { text-decoration-style: dashed; text-decoration-color: var(--ird-warn) }
.ird-claim[data-warn]:hover, .ird-claim[data-warn][data-active] { background: color-mix(in oklab, var(--ird-warn) 14%, transparent); text-decoration-color: var(--ird-warn) }
.ird-claim[data-fresh] { animation: ird-flash .9s var(--ird-ease) backwards }
.ird-sup { display: inline-block; position: relative; top: -.62em; margin-left: 2px; font: 500 9.5px/0 var(--ird-mono); letter-spacing: 0; font-variant-numeric: tabular-nums; color: var(--ird-t3); text-decoration: none; animation: ird-in .4s var(--ird-ease) backwards }
.ird-claim[data-active] .ird-sup { color: var(--ird-accent) }
.ird-claim[data-warn] .ird-sup { color: var(--ird-warn) }

/* typewriter */
.ird-cursor { position: relative; display: inline-block; width: .56em; height: 1.1em; margin-left: 2px; vertical-align: text-bottom }
.ird-cursor i { position: absolute; inset: 0; background: var(--ird-ink); animation: ird-blink 1.05s steps(1) infinite }
.ird-flag { position: absolute; left: calc(100% + 7px); top: 50%; transform: translateY(-50%); padding: 0 6px; border-radius: 2px; background: var(--ird-ink); color: var(--ird-paper); font: 500 9.5px/16px var(--ird-mono); letter-spacing: .08em; white-space: nowrap; z-index: 2 }
.ird-live-pad { min-height: 25px }

/* margin notes */
.ird-note { position: relative; margin-bottom: 14px; animation: ird-in .5s var(--ird-ease) backwards }
.ird-note::before { content: ""; position: absolute; left: -20px; top: 8px; width: 20px; height: 1px; background: var(--ird-rule); transition: background-color .25s }
.ird-note::after { content: ""; position: absolute; left: -22px; top: 6px; width: 5px; height: 5px; background: var(--ird-t3) }
.ird-note .nl { display: flex; align-items: center; gap: 8px; font: 500 10.5px/16px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }
.ird-note p { margin-top: 2px; font: italic 400 15px/20px var(--ird-serif); color: var(--ird-t2) }
.ird-note[data-kind="warn"]::before { background: color-mix(in oklab, var(--ird-warn) 55%, transparent) }
.ird-note[data-kind="warn"]::after { background: var(--ird-warn) }
.ird-note[data-kind="warn"] .nl { color: var(--ird-warn) }
.ird-note[data-kind="ok"] .nl { color: var(--ird-ok) }
.ird-note[data-kind="ok"]::after { background: var(--ird-ok) }
.ird-note[data-hot]::before { background: var(--ird-accent) }
.ird-find { display: inline-flex; align-items: center; gap: 6px; height: 24px; margin-top: 8px; padding: 0 8px; border: 1px solid var(--ird-rule); border-radius: 2px; background: var(--ird-sheet); font: 500 10.5px/1 var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t1); transition: border-color .2s; position: relative; overflow: hidden }
.ird-find:hover:not(:disabled) { border-color: var(--ird-ink) }
.ird-find:disabled { cursor: progress; color: var(--ird-t2) }
.ird-find[data-busy]::after { content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 38%; background: var(--ird-ink); animation: ird-slide 1s var(--ird-ease-trace) infinite }
@container irdm (max-width: 767px) {
  .ird-note { padding-left: 14px; border-left: 1px solid var(--ird-rule); margin-bottom: 12px }
  .ird-note::before, .ird-note::after { display: none }
  .ird-note[data-kind="warn"] { border-left-color: var(--ird-warn) }
}

/* evidence */
.ird-ev { position: absolute; z-index: 5; top: var(--ev-top, 0); left: 20px; right: 0; padding: 0 12px 10px; background: var(--ird-sheet); box-shadow: 0 0 0 1px var(--ird-rule), 0 1px 0 var(--ird-rule), 0 12px 24px -16px rgb(0 0 0 / .25); border-radius: 0; animation: ird-in .3s var(--ird-ease) backwards }
.ird-ev-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 28px; font: 500 10.5px/14px var(--ird-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ird-t3) }
.ird-ev-h b { font-weight: 500; color: var(--ird-accent) }
.ird-scan { position: relative; animation: ird-reveal .55s var(--ird-ease) backwards }
.ird-scan::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--ird-accent); opacity: 0; animation: ird-sweep .55s var(--ird-ease) }
.ird-ev blockquote { font: 400 15px/20px var(--ird-serif); color: var(--ird-t1); padding-top: 2px }
.ird-ev mark { background: var(--ird-signal-soft); color: var(--ird-ink); box-shadow: inset 0 -1.5px 0 var(--ird-accent) }
.ird-ev-f { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; padding-top: 8px; border-top: 1px solid var(--ird-rule-2); font: 400 11px/14px var(--ird-mono); color: var(--ird-t3) }
.ird-ev-f span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
@container irdm (max-width: 767px) {
  .ird-ev { position: relative; top: auto; left: auto; margin: 0 0 12px; box-shadow: 0 0 0 1px var(--ird-rule) }
}

/* wires */
.ird-wire { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 20; pointer-events: none; overflow: hidden; transition: opacity .2s }
.ird-wire[data-hide] { opacity: 0 }
.ird-wire rect { fill: var(--ird-accent); transform-box: fill-box; animation: ird-grow-h .3s var(--ird-ease-trace) backwards }
.ird-wire rect.v { animation-name: ird-grow-v }
.ird-wire rect[data-w="warn"] { fill: var(--ird-warn) }
.ird-wire circle { fill: var(--ird-accent); animation: ird-fade .3s .4s backwards }
.ird-wire circle[data-w="warn"] { fill: var(--ird-warn) }
@container irdm (max-width: 767px) { .ird-wire { display: none } }

/* dither */
.ird-dither { display: block; flex: none; overflow: visible; shape-rendering: crispEdges }
.ird-dither .frame { fill: none; stroke: var(--ird-rule); stroke-width: 1 }
.ird-dither .ghost { fill: var(--ird-t4); opacity: .55 }
.ird-dither .dots { fill: currentColor; animation: ird-wipe .8s var(--ird-ease-trace) backwards }

/* keyframes */
@keyframes ird-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
@keyframes ird-tick { from { transform: scaleY(0) } }
@keyframes ird-fill { from { clip-path: inset(0 100% 0 0) } }
@keyframes ird-grow-h { from { transform: scaleX(0) } }
@keyframes ird-grow-v { from { transform: scaleY(0) } }
@keyframes ird-fade { from { opacity: 0 } }
@keyframes ird-in { from { opacity: 0; transform: translateY(3px) } }
@keyframes ird-reveal { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0) } }
@keyframes ird-wipe { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0) } }
@keyframes ird-sweep { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
@keyframes ird-slide { from { transform: translateX(-100%) } to { transform: translateX(270%) } }
@keyframes ird-flash { from { background-color: var(--ird-signal-soft) } }

@media (prefers-reduced-motion: reduce) {
  .ird *, .ird *::before, .ird *::after { animation: none !important; transition: none !important }
  .ird-cursor i { opacity: 1 }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

function useMatch(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)")
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

const fmt2 = (n: number) => n.toFixed(2)
const pad = (n: number) => String(n).padStart(2, "0")

function elapsed(typed: number) {
  const s = 192 + Math.round(typed * 0.03)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

/** Dots on a Bayer matrix: the density of ink is the value. */
const DitherBar = React.memo(function DitherBar({ value, cols = 26, rows = 4, cell = 2 }: { value: number; cols?: number; rows?: number; cell?: number }) {
  const { dots, ghost } = React.useMemo(() => {
    let d = ""
    let g = ""
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16
        if (t < value) d += `M${x * cell} ${y * cell}h${cell}v${cell}h-${cell}z`
        else g += `M${x * cell + cell / 2 - 0.5} ${y * cell + cell / 2 - 0.5}h1v1h-1z`
      }
    }
    return { dots: d, ghost: g }
  }, [value, cols, rows, cell])
  const w = cols * cell
  const h = rows * cell
  return (
    <svg className="ird-dither" width={w + 4} height={h + 4} viewBox={`-2 -2 ${w + 4} ${h + 4}`} role="img" aria-label={`${Math.round(value * 100)} percent`}>
      <rect className="frame" x={-1.5} y={-1.5} width={w + 3} height={h + 3} />
      <path className="ghost" d={ghost} />
      <path className="dots" key={value} d={dots} />
    </svg>
  )
})

/** Counts to its value with one tiny overshoot (under 2%) and settles. */
function Num({ value, format = (n: number) => String(Math.round(n)), ms = 900 }: { value: number; format?: (n: number) => string; ms?: number }) {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = React.useState(value)
  const prev = React.useRef(0)
  React.useEffect(() => {
    if (reduced) return
    const from = prev.current
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = p < 0.72 ? 1.015 * (1 - Math.pow(1 - p / 0.72, 3)) : 1.015 - 0.015 * (1 - Math.pow(1 - (p - 0.72) / 0.28, 2))
      setShown(from + (value - from) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms, reduced])
  return <>{format(reduced ? value : shown)}</>
}

function resolveClaim(id: string, found: Record<string, FindState>) {
  const c = CLAIMS[id]
  if (c.src) return { src: c.src, loc: c.loc!, excerpt: c.excerpt!, match: c.match!, late: false }
  if (c.found && found[id] === "found") return { ...c.found, late: true }
  return null
}

/* -------------------------------------------------------------------------- */
/*                                    Pieces                                  */
/* -------------------------------------------------------------------------- */

type RailHostProps = {
  hidden: boolean
  phase: Phase
  paused: boolean
  onNavigate: (label: string) => void
  sideTools?: React.ReactNode
}

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--ird-accent)" strokeWidth="1.5" />
    </svg>
  )
}

type RailAgent = { name: string; state: "ok" | "live" | "off" | "warn" | "bad"; note: string; still?: boolean }

function RailView({
  hidden,
  active,
  agents,
  userRole,
  onGo,
  sideTools,
}: {
  hidden: boolean
  active: string
  agents: RailAgent[]
  userRole: string
  onGo: (label: string) => void
  sideTools?: React.ReactNode
}) {
  const group = (name: string, items: { label: string; icon: LucideIcon }[]) => (
    <nav className="ird-rgroup" aria-label={name}>
      <span className="ird-rlab">{name}</span>
      <div className="ird-rnav">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`ird-ritem${label === active ? " is-active" : ""}`}
            aria-current={label === active ? "page" : undefined}
            onClick={() => onGo(label)}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
  return (
    <aside className="ird-rail" aria-label="Meridian navigation" inert={hidden}>
      <div className="ird-brand">
        <Glyph />
        Meridian
      </div>
      <div className="ird-rgroup" style={{ marginTop: 4 }}>
        <span className="ird-rlab">Workspace</span>
        <button type="button" className="ird-ws" aria-label="Switch workspace">
          Harbor &amp; Finch
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>
      {group("Console", NAV_CONSOLE)}
      {group("Operations", NAV_OPS)}
      <nav className="ird-rgroup" aria-label="Agents">
        <span className="ird-rlab">Agents</span>
        <div className="ird-rnav">
          {agents.map((a) => (
            <button key={a.name} type="button" className="ird-ritem ird-ragent" onClick={() => onGo(a.name)}>
              <span className={`ird-rdot ${a.state}${a.still ? " still" : ""}`} aria-hidden="true" />
              {a.name}
              <span className="ird-rlab">{a.note}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="ird-rspacer" />
      {sideTools ? <div className="ird-sidetools">{sideTools}</div> : null}
      <div className="ird-ruser">
        <span className="ird-rav" aria-hidden="true">
          AO
        </span>
        <div>
          <b>Ada Okafor</b>
          <span>{userRole}</span>
        </div>
      </div>
    </aside>
  )
}

const Rail = React.memo(function RailHost({ hidden, phase, paused, onNavigate, sideTools }: RailHostProps) {
  const sage = phase === "write" ? "Writing" : phase === "verify" ? "Verifying" : "Ready"
  const live = phase !== "done"
  const agents = React.useMemo<RailAgent[]>(
    () => [
      { name: "Atlas", state: "ok", note: "Ready" },
      { name: "Sage", state: live ? "live" : "ok", note: sage, still: live && paused },
      { name: "Quill", state: "off", note: "Idle" },
    ],
    [live, paused, sage],
  )
  return <RailView hidden={hidden} active={ACTIVE_NAV} agents={agents} userRole="Product lead" onGo={onNavigate} sideTools={sideTools} />
})

const Readout = React.memo(function Readout({ supported, conf }: { supported: number; conf: number }) {
  return (
    <dl className="ird-read" aria-label="Run readout">
      <div>
        <dt>Sources</dt>
        <dd>
          <Num value={14} />
        </dd>
      </div>
      <div>
        <dt>Read</dt>
        <dd>
          <Num value={11} />
        </dd>
      </div>
      <div>
        <dt>Claims</dt>
        <dd>
          <Num value={18} />
        </dd>
      </div>
      <div>
        <dt>Supported</dt>
        <dd>
          <Num value={supported} />
          <small>/18</small>
        </dd>
      </div>
      <div>
        <dt>Confidence</dt>
        <dd>
          <Num value={conf} format={fmt2} />
          <small>±0.06</small>
        </dd>
      </div>
    </dl>
  )
})

const RunRuler = React.memo(function RunRuler({ phase, typed, supported, onReplay }: { phase: Phase; typed: number; supported: number; onReplay: () => void }) {
  const p = typed / LIVE_LEN
  const pos = phase === "write" ? 50 + 25 * (0.8 + 0.2 * p) : phase === "verify" ? 91 : 100
  const idx = phase === "done" ? 4 : phase === "verify" ? 3 : 2
  const names = ["Search", "Read", "Draft", "Verify"]
  const vals = ["14 found", "11 read", phase === "write" ? "4/5 sections" : "5/5 sections", phase === "done" ? `${supported}/18 ok` : phase === "verify" ? "checking" : "queued"]
  return (
    <div className="ird-run">
      <ol className="ird-phases" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {names.map((n, i) => (
          <li key={n} className="ird-ph" data-s={i < idx - (phase === "done" ? 0 : 0) && i !== idx ? "done" : i === idx ? "now" : undefined}>
            <b>{`${pad(i + 1)} ${n}`}</b>
            <span>{vals[i]}</span>
          </li>
        ))}
      </ol>
      <div className="ird-ruler" role="progressbar" aria-label="Run progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}>
        <div className="ird-rticks" />
        <div className="ird-rfill" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        {[0, 25, 50, 75, 100].map((m) => (
          <i key={m} className="ird-rmaj" style={{ left: m === 100 ? "calc(100% - 1px)" : `${m}%` }} />
        ))}
        <i className="ird-rnow" style={{ left: `${pos}%` }} />
      </div>
      <div className="ird-fig ird-lab">
        <span className="cap">
          FIG. 1 — Run 0412, search to verify · elapsed {elapsed(typed)}
        </span>
        <button type="button" className="ird-replay ird-lab" onClick={onReplay} aria-label="Replay the run">
          <RotateCcw size={12} strokeWidth={1.5} aria-hidden />
          Replay
        </button>
      </div>
    </div>
  )
})

type SourcesProps = {
  filter: "all" | "cited" | "unused"
  onFilter: (f: "all" | "cited" | "unused") => void
  counts: Record<number, number>
  activeSrc: number | null
  onHover: (n: number | null) => void
  open: boolean
  onToggle: () => void
}

const SourcesPanel = React.memo(function SourcesPanel({ filter, onFilter, counts, activeSrc, onHover, open, onToggle }: SourcesProps) {
  const cited = SOURCES.filter((s) => (counts[s.no] ?? 0) > 0).length
  const list = SOURCES.filter((s) => (filter === "all" ? true : filter === "cited" ? (counts[s.no] ?? 0) > 0 : (counts[s.no] ?? 0) === 0))
  const opts: [typeof filter, string, number][] = [
    ["all", "All", SOURCES.length],
    ["cited", "Cited", cited],
    ["unused", "Unused", SOURCES.length - cited],
  ]
  return (
    <aside className="ird-src" aria-label="Sources">
      <div className="ird-src-head">
        <div className="ird-lab">Sources</div>
        <h2>Evidence on file</h2>
        <p>14 collected by Sage, 11 read in full. Relevance is Sage’s own ranking.</p>
      </div>
      <button type="button" className="ird-src-toggle" aria-expanded={open} aria-controls="ird-fold" onClick={onToggle}>
        <span>
          <span className="ird-lab">Sources · {cited} cited</span>
          <h2>Evidence on file</h2>
        </span>
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden />
      </button>
      <div className="ird-fold" id="ird-fold" data-open={open || undefined}>
        <div className="ird-fold-in">
          <div className="ird-seg" role="group" aria-label="Filter sources">
            {opts.map(([k, l, n]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => onFilter(k)}>
                {l}
                <i>{n}</i>
              </button>
            ))}
          </div>
          <div className="ird-src-scroll" data-scroll="src">
            {list.length === 0 ? (
              <p className="ird-empty">Nothing here.</p>
            ) : (
              <ul className="ird-src-list">
                {list.map((s, i) => {
                  const n = counts[s.no] ?? 0
                  return (
                    <li
                      key={s.no}
                      className="ird-scard ird-crop"
                      data-src={s.no}
                      data-active={activeSrc === s.no || undefined}
                      tabIndex={0}
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      onMouseEnter={() => onHover(s.no)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(s.no)}
                      onBlur={() => onHover(null)}
                      aria-label={`Source ${s.no}: ${s.title}, ${s.kind.toLowerCase()}, ${s.read ? "read" : "skimmed"}, supports ${n} claims`}
                    >
                      <div className="top">
                        <span>
                          S{pad(s.no)} · {s.kind}
                        </span>
                        <span className="ird-st" data-r={s.read ? "read" : "skim"}>
                          {s.read ? "READ" : "SKIMMED"}
                        </span>
                      </div>
                      <div className="ttl">{s.title}</div>
                      <div className="dom">{s.domain}</div>
                      <div className="bot">
                        <span className="rel">
                          <DitherBar value={s.relevance} />
                          {fmt2(s.relevance)}
                        </span>
                        <span className="cn" data-n={n}>
                          {n} {n === 1 ? "claim" : "claims"}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
})

function Highlight({ text, match }: { text: string; match: string }) {
  const i = text.indexOf(match)
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{match}</mark>
      {text.slice(i + match.length)}
    </>
  )
}

function EvidenceCard({ claimId, found, top }: { claimId: string; found: Record<string, FindState>; top: number }) {
  const r = resolveClaim(claimId, found)
  if (!r) return null
  const src = SOURCES.find((s) => s.no === r.src)!
  return (
    <aside className="ird-ev ird-crop" id={`ird-ev-${claimId}`} style={{ "--ev-top": `${top}px` } as React.CSSProperties} aria-label={`Evidence for claim ${CLAIM_NO[claimId]}`}>
      <div className="ird-ev-h">
        <span>
          Evidence · <b>S{pad(src.no)}</b>
        </span>
        <span>{r.loc}</span>
      </div>
      <div className="ird-scan" key={claimId}>
        <blockquote>
          <Highlight text={r.excerpt} match={r.match} />
        </blockquote>
      </div>
      <div className="ird-ev-f">
        <span>{src.domain}</span>
        <span>{fmt2(src.relevance)} REL</span>
      </div>
    </aside>
  )
}

function NoteView({ note, hot, state, onFind }: { note: Note; hot: boolean; state?: FindState; onFind: (id: string) => void }) {
  const foundNow = note.kind === "warn" && state === "found"
  const kind = foundNow ? "ok" : note.kind
  const label = foundNow ? "Evidence added" : note.kind === "warn" ? "No source" : "Sage · note"
  return (
    <div className="ird-note" data-kind={kind} data-hot={hot || undefined} data-note-for={note.claim}>
      <div className="nl">{label}</div>
      <p>{foundNow ? note.foundText : note.text}</p>
      {note.kind === "warn" && !foundNow && (
        <button type="button" className="ird-find" disabled={state === "searching"} data-busy={state === "searching" || undefined} onClick={() => note.claim && onFind(note.claim)}>
          <Search size={11} strokeWidth={1.5} aria-hidden />
          {state === "searching" ? "Searching" : "Find evidence"}
        </button>
      )}
    </div>
  )
}

type SectionProps = {
  sec: Section
  active: string | null
  pinned: string | null
  hotSrc: number | null
  found: Record<string, FindState>
  evTop: number | null
  first?: boolean
  last?: boolean
  phase?: Phase
  typed?: number
  onEnter: (id: string) => void
  onLeave: () => void
  onToggle: (id: string) => void
  onFind: (id: string) => void
}

const SectionView = React.memo(function SectionView(props: SectionProps) {
  const { sec, active, pinned, hotSrc, found, evTop, phase, typed = 0, onEnter, onLeave, onToggle, onFind } = props
  const live = sec.live === true
  const writing = live && phase === "write"
  const verifying = live && phase === "verify"
  const pending = writing || verifying
  const ids = [...SECTION_CLAIMS[sec.id]]
  const claimTotal = ids.length
  const unsupported = ids.filter((id) => !resolveClaim(id, found)).length

  const claim = (id: string, text: string, complete: boolean, order: number) => {
    const r = resolveClaim(id, found)
    const isActive = active === id
    const warn = !r
    const note = sec.paras.flatMap((p) => p.notes).find((n) => n.claim === id)
    return (
      <span
        key={id}
        className="ird-claim"
        role={complete ? "button" : undefined}
        tabIndex={complete ? 0 : undefined}
        aria-pressed={complete ? pinned === id : undefined}
        aria-describedby={isActive ? (warn && note ? undefined : `ird-ev-${id}`) : undefined}
        data-claim={id}
        data-src-id={r ? r.src : undefined}
        data-active={isActive || undefined}
        data-warn={warn || undefined}
        data-hot={(r && hotSrc === r.src) || undefined}
        data-fresh={verifying || undefined}
        style={verifying ? { animationDelay: `${order * 220}ms` } : undefined}
        onMouseEnter={complete ? () => onEnter(id) : undefined}
        onMouseLeave={complete ? onLeave : undefined}
        onFocus={complete ? () => onEnter(id) : undefined}
        onBlur={complete ? onLeave : undefined}
        onClick={complete ? () => onToggle(id) : undefined}
        onKeyDown={
          complete
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onToggle(id)
                }
              }
            : undefined
        }
      >
        {text}
        {complete && <sup className="ird-sup">{CLAIM_NO[id]}</sup>}
      </span>
    )
  }

  const renderSegs = (segs: Seg[]) => {
    let order = 0
    return segs.map((g, i) => (typeof g === "string" ? <React.Fragment key={i}>{g}</React.Fragment> : claim(g[0], g[1], true, order++)))
  }

  const renderLive = () => {
    let left = typed
    let order = 0
    const out: React.ReactNode[] = []
    for (let i = 0; i < LIVE_SEGS.length; i++) {
      const g = LIVE_SEGS[i]
      const t = segText(g)
      const take = Math.max(0, Math.min(left, t.length))
      left -= take
      if (take === 0 && typeof g !== "string") break
      if (take === 0) break
      const part = t.slice(0, take)
      if (typeof g === "string") out.push(<React.Fragment key={i}>{part}</React.Fragment>)
      else out.push(claim(g[0], part, take === t.length, order++))
      if (take < t.length) break
    }
    return out
  }

  const stateTag = writing ? "Drafting" : verifying ? "Verifying" : null
  const hotNote = (n: Note) => !!n.claim && active === n.claim

  return (
    <>
      <div className="ird-row" data-sec={sec.id}>
        <div className="ird-text">
          <div className="ird-sec-top ird-lab">§ {sec.no}</div>
          <h3 className="ird-sec-h">{sec.title}</h3>
          <p className="ird-dek">{sec.dek}</p>
          <div className="ird-meta">
            <span className="cf">
              Conf
              <DitherBar value={pending ? 0 : sec.conf} cols={24} />
              <span className="v">
                {pending ? "—" : fmt2(sec.conf)} <small>{pending ? "" : `±${fmt2(sec.err)}`}</small>
              </span>
            </span>
            <span>{claimTotal} claims</span>
            {unsupported > 0 && !pending && <span className="w">{unsupported} no source</span>}
            {stateTag && <span className="ird-tag">{stateTag}</span>}
          </div>
        </div>
        <div className="ird-marg" />
      </div>
      {sec.paras.map((p, pi) => {
        const own = (id: string | null) => (id && p.segs.some((g) => typeof g !== "string" && g[0] === id) ? id : null)
        const activeHere = own(active)
        const showEv = activeHere && evTop !== null && resolveClaim(activeHere, found)
        const isLast = props.last && pi === sec.paras.length - 1
        return (
          <div className="ird-row" key={p.id} data-last={isLast || undefined}>
            <div className="ird-text" data-scan={live && verifying ? "" : undefined}>
              <p className="ird-p" aria-live={live ? "off" : undefined}>
                {live ? renderLive() : renderSegs(p.segs)}
                {writing && (
                  <span className="ird-cursor">
                    <i />
                    <span className="ird-flag">SAGE · WRITING</span>
                  </span>
                )}
              </p>
            </div>
            <div className="ird-marg">
              {p.notes
                .filter((n) => !(n.late && pending))
                .map((n) => (
                  <NoteView key={n.id} note={n} hot={hotNote(n)} state={n.claim ? found[n.claim] : undefined} onFind={onFind} />
                ))}
              {showEv && activeHere && <EvidenceCard claimId={activeHere} found={found} top={evTop} />}
            </div>
          </div>
        )
      })}
    </>
  )
})

/** A hairline made of 1px rects that grow along the path, one segment after another. */
function Trace({ pts, delay, warn }: { pts: Pt[]; delay: number; warn?: boolean }) {
  const segs = pts.slice(1).map(([x, y], i) => {
    const [px, py] = pts[i]
    const horiz = py === y
    const len = horiz ? Math.abs(x - px) : Math.abs(y - py)
    return { x, y, px, py, horiz, len, dur: Math.max(0.1, len / 520) }
  })
  return (
    <>
      {segs.map(({ x, y, px, py, horiz, len, dur }, i) => {
        const at = delay + segs.slice(0, i).reduce((n, g) => n + g.dur, 0)
        const style = {
          animationDuration: `${dur}s`,
          animationDelay: `${at}s`,
          transformOrigin: horiz ? (x >= px ? "0 50%" : "100% 50%") : y >= py ? "50% 0" : "50% 100%",
        } as React.CSSProperties
        return <rect key={i} className={horiz ? "h" : "v"} data-w={warn ? "warn" : undefined} x={Math.min(px, x)} y={Math.min(py, y)} width={horiz ? len + 1 : 1} height={horiz ? 1 : len + 1} style={style} />
      })}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ResearchDesk                                */
/* -------------------------------------------------------------------------- */

export function ResearchDesk({ onNavigate, sideTools }: ResearchDeskProps) {
  const reduced = usePrefersReducedMotion()
  const narrow = useMatch("(max-width: 1023px)")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const mainRef = React.useRef<HTMLDivElement>(null)

  const [run, setRun] = React.useState<Run>(() => (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? DONE : START))
  const [hidden, setHidden] = React.useState(() => typeof document !== "undefined" && document.hidden)
  const [inView, setInView] = React.useState(true)
  const paused = hidden || !inView

  const [hover, setHover] = React.useState<string | null>(null)
  const [pin, setPin] = React.useState<string | null>("c3")
  const [hotSrc, setHotSrc] = React.useState<number | null>(null)
  const [filter, setFilter] = React.useState<"all" | "cited" | "unused">("all")
  const [srcOpen, setSrcOpen] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const [found, setFound] = React.useState<Record<string, FindState>>({})
  const [geo, setGeo] = React.useState<Geo>(EMPTY_GEO)

  const active = hover ?? pin
  const activeRef = React.useRef<string | null>(active)
  const userScrolled = React.useRef(false)
  const seenCaret = React.useRef(false)
  const timers = React.useRef(new Set<number>())
  const raf = React.useRef(0)
  const rafFallback = React.useRef(0)

  /* ---- timers: pause when hidden or offscreen, clean up on unmount ---- */
  React.useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((e) => setInView(e[e.length - 1].isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t) => window.clearTimeout(t))
      pending.clear()
    }
  }, [])

  /* typewriter: one character at a time, slower on punctuation */
  React.useEffect(() => {
    if (run.phase !== "write" || paused) return
    const ch = LIVE_TEXT[run.typed] ?? ""
    const delay = ch === "." ? 280 : ch === "," || ch === ":" || ch === "–" ? 130 : 20 + ((run.typed * 7) % 5) * 5
    const id = window.setTimeout(() => {
      setRun((r) => (r.phase !== "write" ? r : r.typed + 1 >= LIVE_LEN ? { phase: "verify", typed: LIVE_LEN } : { phase: "write", typed: r.typed + 1 }))
    }, delay)
    return () => window.clearTimeout(id)
  }, [run.phase, run.typed, paused])
  React.useEffect(() => {
    if (run.phase !== "verify" || paused) return
    const id = window.setTimeout(() => setRun(DONE), 2500)
    return () => window.clearTimeout(id)
  }, [run.phase, paused])

  /* follow the caret while Sage writes, until the reader scrolls */
  const scroller = React.useCallback(() => {
    const doc = rootRef.current?.querySelector<HTMLElement>(".ird-doc")
    if (doc && getComputedStyle(doc).overflowY === "auto") return doc
    return rootRef.current?.querySelector<HTMLElement>(".ird-body") ?? null
  }, [])
  React.useEffect(() => {
    if (run.phase !== "write" || paused) return
    const id = window.setInterval(() => {
      if (userScrolled.current) return
      const caret = rootRef.current?.querySelector(".ird-cursor")
      const sc = scroller()
      if (!caret || !sc) return
      const cr = caret.getBoundingClientRect()
      const sr = sc.getBoundingClientRect()
      if (cr.top > sr.top && cr.bottom < sr.bottom) seenCaret.current = true
      if (!seenCaret.current) return
      const limit = sr.bottom - 48
      if (cr.bottom > limit) sc.scrollBy({ top: cr.bottom - limit + 90, behavior: reduced ? "auto" : "smooth" })
    }, 350)
    return () => window.clearInterval(id)
  }, [run.phase, paused, reduced, scroller])

  /* ---- claims: hover, focus and pin ---- */
  const onEnter = React.useCallback((id: string) => setHover(id), [])
  const onLeave = React.useCallback(() => setHover(null), [])
  const onToggle = React.useCallback((id: string) => setPin((p) => (p === id ? null : id)), [])
  const onFind = React.useCallback((id: string) => {
    setFound((f) => (f[id] ? f : { ...f, [id]: "searching" }))
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      setFound((f) => ({ ...f, [id]: "found" }))
    }, 1800)
    timers.current.add(t)
  }, [])
  const onReplay = React.useCallback(() => {
    userScrolled.current = false
    seenCaret.current = false
    setRun(START)
  }, [])
  const onSrcHover = React.useCallback((n: number | null) => setHotSrc(n), [])
  const toggleSrc = React.useCallback(() => setSrcOpen((o) => !o), [])
  const closeNav = React.useCallback(() => setNavOpen(false), [])
  const navigate = React.useCallback(
    (label: string) => {
      setNavOpen(false)
      onNavigate?.(label)
    },
    [onNavigate],
  )

  /* ---- numbers ---- */
  const foundCount = Object.values(found).filter((s) => s === "found").length
  const supported = 16 + foundCount
  const conf = 0.82 + 0.01 * foundCount
  const counts = React.useMemo(() => {
    const c: Record<number, number> = {}
    for (const id of CLAIM_IDS) {
      const r = resolveClaim(id, found)
      if (r) c[r.src] = (c[r.src] ?? 0) + 1
    }
    return c
  }, [found])
  const activeRes = active ? resolveClaim(active, found) : null
  const activeSrc = activeRes ? activeRes.src : null

  /* ---- connectors: measured from the DOM, traced in as SVG ---- */
  const measure = React.useCallback(() => {
    const root = mainRef.current
    const id = activeRef.current
    if (!root || !id) return setGeo(EMPTY_GEO)
    const claimEl = root.querySelector<HTMLElement>(`[data-claim="${id}"]`)
    const row = claimEl?.closest<HTMLElement>(".ird-row")
    const text = row?.querySelector<HTMLElement>(".ird-text")
    const marg = row?.querySelector<HTMLElement>(".ird-marg")
    if (!claimEl || !text || !marg) return setGeo(EMPTY_GEO)
    const rects = claimEl.getClientRects()
    const lr = rects[rects.length - 1]
    if (!lr) return setGeo(EMPTY_GEO)
    const mode = root.clientWidth >= 1040 ? 3 : root.clientWidth >= 768 ? 2 : 1
    const set = (next: Geo) => setGeo((g) => (JSON.stringify(g) === JSON.stringify(next) ? g : next))
    if (mode === 1) return set({ ...EMPTY_GEO, id })
    const mr = root.getBoundingClientRect()
    const tr = text.getBoundingClientRect()
    const gr = marg.getBoundingClientRect()
    const cy = lr.top + lr.height / 2
    const clip = (mode === 3 ? root.querySelector(".ird-doc") : root.querySelector(".ird-body"))?.getBoundingClientRect()
    const hide = !clip || cy < clip.top + 6 || cy > clip.bottom - 6
    const X = (x: number) => Math.round(x - mr.left)
    const Y = (y: number) => Math.round(y - mr.top)
    const warn = claimEl.hasAttribute("data-warn")
    const notes = marg.querySelectorAll(".ird-note")
    const lastNote = notes[notes.length - 1]
    const evAbs = Math.max(cy - 14, lastNote ? lastNote.getBoundingClientRect().bottom + 6 : -Infinity)
    const dots: Pt[] = []
    let right: Pt[] | null = null
    let left: Pt[] | null = null
    if (warn) {
      const note = root.querySelector(`[data-note-for="${id}"]`)
      if (note) {
        const nr = note.getBoundingClientRect()
        right = [[X(tr.right), Y(cy)], [X(tr.right + 10), Y(cy)], [X(tr.right + 10), Y(nr.top + 8)], [X(nr.left), Y(nr.top + 8)]]
        dots.push([X(tr.right), Y(cy)])
      }
    } else {
      const ty = evAbs + 14
      right = Math.abs(ty - cy) < 2 ? [[X(tr.right), Y(cy)], [X(gr.left + 20), Y(cy)]] : [[X(tr.right), Y(cy)], [X(tr.right + 10), Y(cy)], [X(tr.right + 10), Y(ty)], [X(gr.left + 20), Y(ty)]]
      dots.push([X(tr.right), Y(cy)])
      const srcId = claimEl.dataset.srcId
      if (mode === 3 && srcId) {
        const card = root.querySelector(`[data-src="${srcId}"]`)
        const sc = root.querySelector(".ird-src-scroll")
        if (card && sc) {
          const c = card.getBoundingClientRect()
          const s = sc.getBoundingClientRect()
          const sy = Math.min(Math.max(c.top + c.height / 2, s.top + 10), s.bottom - 10)
          left = [[X(c.right + 5), Y(sy)], [X(tr.left + 10), Y(sy)], [X(tr.left + 10), Y(cy)], [X(tr.left + 18), Y(cy)]]
          dots.push([X(tr.left + 18), Y(cy)])
        }
      }
    }
    set({ id, evTop: Math.round(evAbs - gr.top), left, right, warn, hide, dots })
  }, [])
  const schedule = React.useCallback(() => {
    cancelAnimationFrame(raf.current)
    window.clearTimeout(rafFallback.current)
    raf.current = requestAnimationFrame(measure)
    rafFallback.current = window.setTimeout(measure, 120)
  }, [measure])
  React.useEffect(() => {
    activeRef.current = active
    schedule()
  }, [active, found, run.phase, filter, srcOpen, schedule])
  React.useEffect(() => {
    const el = mainRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    const inner = el.querySelector(".ird-doc-in")
    if (inner) ro.observe(inner)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      window.clearTimeout(rafFallback.current)
    }
  }, [schedule])

  /* bring the cited source card into view in the source column */
  React.useEffect(() => {
    if (activeSrc === null) return
    const root = mainRef.current
    const sc = root?.querySelector<HTMLElement>(".ird-src-scroll")
    const card = root?.querySelector<HTMLElement>(`[data-src="${activeSrc}"]`)
    if (!sc || !card || getComputedStyle(sc).overflowY !== "auto") return
    const top = card.offsetTop - sc.offsetTop
    const bottom = top + card.offsetHeight
    if (top < sc.scrollTop + 8) sc.scrollTo({ top: top - 12, behavior: reduced ? "auto" : "smooth" })
    else if (bottom > sc.scrollTop + sc.clientHeight - 8) sc.scrollTo({ top: bottom - sc.clientHeight + 16, behavior: reduced ? "auto" : "smooth" })
  }, [activeSrc, filter, reduced])

  const touch = React.useCallback(() => {
    userScrolled.current = true
  }, [])

  const status = run.phase === "write" ? "Sage is writing section 2, cost to serve." : run.phase === "verify" ? "Sage is verifying the draft." : "Draft verified."
  const evFor = (id: string) => (geo.id !== null && SECTION_CLAIMS[id].has(geo.id) ? geo.evTop : null)

  const secProps = (sec: Section, i: number) => ({
    sec,
    active: active && SECTION_CLAIMS[sec.id].has(active) ? active : null,
    pinned: pin && SECTION_CLAIMS[sec.id].has(pin) ? pin : null,
    hotSrc,
    found,
    evTop: active && geo.id === active ? evFor(sec.id) : null,
    last: i === SECTIONS.length - 1,
    phase: sec.live ? run.phase : undefined,
    typed: sec.live ? run.typed : undefined,
    onEnter,
    onLeave,
    onToggle,
    onFind,
  })

  return (
    <div className="ird" ref={rootRef}>
      <style href="research-desk" precedence="default">
        {CSS}
      </style>
      <div
        className={`ird-shell${navOpen ? " is-open" : ""}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (navOpen) setNavOpen(false)
            else setPin(null)
          }
        }}
      >
        <div className="ird-scrim" onClick={closeNav} aria-hidden />
        <Rail hidden={narrow && !navOpen} phase={run.phase} paused={paused} onNavigate={navigate} sideTools={sideTools} />

        <div className="ird-main" ref={mainRef} onWheel={touch} onTouchMove={touch} onPointerDown={touch}>
          <header className="ird-top">
            <button type="button" className="ird-menu" aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
              <Menu size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <div className="ird-ttl">
              <span className="ird-rlab ird-crumb">Console / Research desk</span>
              <h1>Research desk</h1>
            </div>
            <div className="ird-actions">
              <button type="button" className="ird-search" aria-label="Search, command K">
                <Search size={14} strokeWidth={1.5} aria-hidden />
                <span>Search</span>
                <kbd>⌘K</kbd>
              </button>
              <button type="button" className="ird-tbtn" data-icon aria-label="Export brief">
                <FileDown size={14} strokeWidth={1.5} aria-hidden />
                <span className="lbl">Export brief</span>
              </button>
              <button type="button" className="ird-tbtn ink">
                Ask Sage
              </button>
            </div>
          </header>

          <div className="ird-body" data-scroll="body" onScroll={schedule}>
            <section className="ird-brief" aria-label="Question and run">
              <div>
                <div className="ird-lab">Question · Run 0412</div>
                <h2 className="ird-q">
                  Should Harbor &amp; Finch expand <em>same-day delivery</em> to Leeds?
                </h2>
              </div>
              <Readout supported={supported} conf={conf} />
              <RunRuler phase={run.phase} typed={run.typed} supported={supported} onReplay={onReplay} />
            </section>

            <div className="ird-cols">
              <SourcesPanel filter={filter} onFilter={setFilter} counts={counts} activeSrc={activeSrc} onHover={onSrcHover} open={srcOpen} onToggle={toggleSrc} />
              <div className="ird-doc" data-scroll="doc" onScroll={schedule}>
                <div className="ird-doc-in">
                  <div className="ird-row" data-first>
                    <div className="ird-text">
                      <div className="ird-mast ird-lab">
                        <span>Brief · Draft 3</span>
                        <span>Prepared by Sage for Ops</span>
                        <span>14:02 UTC</span>
                      </div>
                    </div>
                    <div className="ird-marg" />
                  </div>
                  {SECTIONS.map((s, i) => (
                    <SectionView key={s.id} {...secProps(s, i)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <svg className="ird-wire" aria-hidden="true" data-hide={geo.hide || undefined}>
            {geo.left && <Trace key={`l-${geo.id}`} pts={geo.left} delay={0} />}
            {geo.right && <Trace key={`r-${geo.id}`} pts={geo.right} delay={geo.left ? 0.1 : 0} warn={geo.warn} />}
            {geo.dots.map(([x, y], i) => (
              <circle key={`${geo.id}-${i}`} cx={x} cy={y} r={2.5} data-w={geo.warn ? "warn" : undefined} />
            ))}
          </svg>
        </div>
      </div>
      <p className="ird-sr" role="status">
        {status}
      </p>
    </div>
  )
}
