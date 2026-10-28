"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ReceiptLine = {
  /** What was bought, e.g. "northstar-xl" or "ledger.query". */
  label: string;
  /** Second, quieter line under it, e.g. "24,310 in · 4,180 out". */
  detail?: string;
  /** How many calls this line covers. Adds up into the section's call count. */
  qty?: number;
  /** Tokens used. Adds up into the receipt's token count. */
  tokens?: number;
  /** Cost of the line in the receipt currency. Negative for credits. */
  amount: number;
};

export type ReceiptSection = {
  /** Sentence case, e.g. "Model calls". Printed in small caps. */
  title: string;
  /** When set, the section's call count is printed above the total under this name, e.g. "Model calls". */
  countLabel?: string;
  lines: ReceiptLine[];
};

export type RunReceiptData = {
  /** Printed at the top. Defaults to "Run receipt". */
  title?: string;
  agent: string;
  task: string;
  workspace: string;
  runId: string;
  /** Finish time, already formatted, e.g. "28 Oct 2026 · 09:42". */
  finishedAt: string;
  /** Wall-clock time, e.g. "2m 41s". */
  duration: string;
  sections: ReceiptSection[];
  /** Symbol in front of every amount. Defaults to "$". */
  currency?: string;
  /** Decimals printed on every amount. Lines are rounded to this, so the total always adds up. Defaults to 4. */
  decimals?: number;
};

export type RunReceiptProps = {
  /** The run to print. Leave out for the built-in demo run. */
  receipt?: RunReceiptData;
  /** One or two sentences on what the run did, under the title. */
  summary?: React.ReactNode;
  /** What the cost means for the person: who is billed, when, how much budget is left. */
  consequence?: React.ReactNode;
  /** Print as soon as the piece is on screen. When false the slot stays empty until "Print receipt" is pressed. */
  autoPrint?: boolean;
  /** Printing speed multiplier. 1 prints a line every 90ms. */
  speed?: number;
  /** Called once the receipt has been torn off. */
  onTear?: () => void;
  /** Called with the plain-text receipt after Copy. */
  onCopy?: (text: string) => void;
  /** Called with the file name after Download. */
  onDownload?: (fileName: string) => void;
  /** "lg" prints a 1.25x receipt and a bigger headline for hero shots and film frames. Only applies from 900px wide. */
  size?: "md" | "lg";
  /** Text of the status chip. Defaults to "Run complete". */
  status?: string;
  /** Colour of the status chip: success (default), warning or danger. */
  statusTone?: "success" | "warning" | "danger";
  /** Level of the task heading, so it fits the page outline. Defaults to 3. */
  headingLevel?: 2 | 3 | 4 | 5;
  className?: string;
};

/* -------------------------------------------------------------------------- */
/*                                Demo content                                */
/* -------------------------------------------------------------------------- */

const DEMO_RECEIPT: RunReceiptData = {
  agent: "Atlas",
  task: "Reconcile Q3 invoices",
  workspace: "Harbor & Finch",
  runId: "8f3a21",
  finishedAt: "28 Oct 2026 · 09:42",
  duration: "2m 41s",
  sections: [
    {
      title: "Model calls",
      countLabel: "Model calls",
      lines: [
        {
          label: "northstar-xl",
          detail: "24,310 in · 4,180 out",
          qty: 6,
          tokens: 28490,
          amount: 0.1356,
        },
        {
          label: "northstar-mini",
          detail: "61,880 in · 9,240 out",
          qty: 21,
          tokens: 71120,
          amount: 0.027,
        },
        {
          label: "embed-s",
          detail: "142 chunks · 38,400 tokens",
          qty: 1,
          tokens: 38400,
          amount: 0.0008,
        },
      ],
    },
    {
      title: "Tool calls",
      countLabel: "Tool calls",
      lines: [
        {
          label: "ledger.query",
          detail: "18 × $0.0010",
          qty: 18,
          amount: 0.018,
        },
        {
          label: "bank.fetch_statements",
          detail: "4 × $0.0050",
          qty: 4,
          amount: 0.02,
        },
        {
          label: "pdf.extract",
          detail: "12 × $0.0035",
          qty: 12,
          amount: 0.042,
        },
      ],
    },
    {
      title: "Credits",
      lines: [
        {
          label: "Prompt cache",
          detail: "12,000 tokens read",
          amount: -0.0324,
        },
      ],
    },
  ],
};

const DEMO_SUMMARY =
  "Atlas matched 212 invoices against three bank feeds and drafted 9 follow-ups for the ones that did not line up.";
const DEMO_CONSEQUENCE = (
  <>
    Billed to <b>Harbor & Finch</b> on 1 Nov. Atlas has <b>$38.12</b> of its
    $40.00 budget left this month.
  </>
);

/* -------------------------------------------------------------------------- */
/*                                  Receipt model                             */
/* -------------------------------------------------------------------------- */

const PAPER_W = 320; // design width in px; the perforation geometry is stored in percent, so the paper can be any width

type Row =
  | { k: "gap" }
  | { k: "title"; text: string }
  | { k: "center"; text: string; dim?: boolean }
  | { k: "rule" }
  | { k: "section"; text: string }
  | { k: "item"; label: string; value: string; neg?: boolean }
  | { k: "detail"; text: string }
  | { k: "stat"; label: string; value: string }
  | { k: "total"; label: string; value: string }
  | { k: "bars"; seed: string };

type PlacedRow = { row: Row; u: number; units: number };

type Model = {
  rows: PlacedRow[];
  units: number;
  totalMicro: number;
  total: string;
  sectionTotals: {
    title: string;
    micro: number;
    text: string;
    calls: number;
    lineCount: number;
    counted: boolean;
  }[];
  text: string;
  fileName: string;
};

/* Round half away from zero, so a credit rounds the same way a charge does. */
const roundHalf = (x: number) => Math.sign(x) * Math.round(Math.abs(x)) || 0;

const fmt = (micro: number, scale: number, decimals: number, sym: string) =>
  `${micro < 0 ? "−" : ""}${sym}${(Math.abs(micro) / scale).toFixed(decimals)}`;

function buildModel(r: RunReceiptData): Model {
  const decimals = r.decimals ?? 4;
  const sym = r.currency ?? "$";
  const scale = 10 ** decimals;
  const money = (micro: number) => fmt(micro, scale, decimals, sym);
  const nf = new Intl.NumberFormat("en-US");

  const secs = r.sections.map((s) => ({
    ...s,
    lines: s.lines.map((l) => ({ ...l, micro: roundHalf(l.amount * scale) })),
  }));
  const sectionTotals = secs.map((s) => {
    const micro = s.lines.reduce((a, l) => a + l.micro, 0);
    return {
      title: s.title,
      micro,
      text: money(micro),
      calls: s.lines.reduce((a, l) => a + (l.qty ?? 0), 0),
      lineCount: s.lines.length,
      counted: Boolean(s.countLabel),
    };
  });
  const totalMicro = sectionTotals.reduce((a, s) => a + s.micro, 0);
  const tokens = secs.reduce(
    (a, s) => a + s.lines.reduce((b, l) => b + (l.tokens ?? 0), 0),
    0,
  );

  const raw: [Row, number][] = [];
  const push = (row: Row, units = 1) => raw.push([row, units]);
  push({ k: "gap" }, 2); // room for the pull tab
  push({ k: "title", text: (r.title ?? "Run receipt").toUpperCase() });
  push({ k: "center", text: `${r.agent} · ${r.task}` });
  push({ k: "center", text: `${r.workspace} · run ${r.runId}`, dim: true });
  push({ k: "center", text: `${r.finishedAt} · ${r.duration}`, dim: true });
  push({ k: "rule" });
  secs.forEach((s) => {
    push({ k: "section", text: s.title });
    s.lines.forEach((l) => {
      push({
        k: "item",
        label: l.qty != null && l.qty > 0 ? `${l.label} ×${l.qty}` : l.label,
        value: money(l.micro),
        neg: l.micro < 0,
      });
      if (l.detail) push({ k: "detail", text: l.detail });
    });
  });
  push({ k: "rule" });
  secs.forEach((s) => {
    if (!s.countLabel) return;
    push({
      k: "stat",
      label: s.countLabel,
      value: nf.format(s.lines.reduce((a, l) => a + (l.qty ?? 0), 0)),
    });
  });
  if (tokens > 0)
    push({ k: "stat", label: "Tokens", value: nf.format(tokens) });
  push({ k: "rule" });
  push({ k: "total", label: "TOTAL", value: money(totalMicro) }, 2);
  push({ k: "center", text: `Charged to ${r.workspace}`, dim: true });
  push({ k: "bars", seed: r.runId }, 2);
  push({ k: "gap" }, 1); // room for the cut edge

  let u = 0;
  const rows = raw.map(([row, units]) => {
    const placed = { row, u, units };
    u += units;
    return placed;
  });

  /* Plain-text twin of the receipt, 38 columns, for Copy and Download. */
  const W = 38;
  const ascii = (s: string) => s.replace(/−/g, "-").replace(/×/g, "x");
  const ctr = (s: string) =>
    " ".repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
  const lr = (a: string, b: string) =>
    a + " ".repeat(Math.max(1, W - a.length - b.length)) + b;
  const lines: string[] = [];
  rows.forEach(({ row }) => {
    switch (row.k) {
      case "title":
      case "center":
        lines.push(ctr(row.text));
        break;
      case "rule":
        lines.push("-".repeat(W));
        break;
      case "section":
        lines.push(row.text.toUpperCase());
        break;
      case "item":
      case "stat":
        lines.push(lr(row.k === "item" ? row.label : row.label, row.value));
        break;
      case "detail":
        lines.push("  " + row.text);
        break;
      case "total":
        lines.push(lr(row.label, row.value));
        break;
      default:
        break;
    }
  });
  const text = ascii(lines.join("\n")) + "\n";
  const fileName = `${r.runId.replace(/[^\w-]+/g, "-")}-receipt.txt`;

  return {
    rows,
    units: u,
    totalMicro,
    total: money(totalMicro),
    sectionTotals,
    text,
    fileName,
  };
}

/* -------------------------------------------------------------------------- */
/*                           Perforation and tear shapes                      */
/* -------------------------------------------------------------------------- */

/* The seam between the stub in the printer and the receipt is a stamp-style
   perforation: half-circle bites in both pieces that line up into round holes.
   Tearing morphs both edges into ragged rips. Both states are polygons with the
   same number of points, so CSS can transition `clip-path` between them. */

type Pt = { x: number; y: number };
const pct = (x: number) => `${((x / PAPER_W) * 100).toFixed(2)}%`;
const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
};

function perforationEdge(): Pt[] {
  const pts: Pt[] = [];
  const R = 7; // corner notches
  const r = 2.5; // round holes
  for (let i = 0; i <= 3; i++) {
    const a = (Math.PI / 2) * (1 - i / 3);
    pts.push({ x: R * Math.cos(a), y: R * Math.sin(a) });
  }
  const holes = Math.floor((PAPER_W - 36) / 12);
  const x0 = (PAPER_W - (holes - 1) * 12) / 2;
  for (let h = 0; h < holes; h++) {
    const xc = x0 + h * 12;
    for (let j = 0; j <= 4; j++) {
      const a = Math.PI - (Math.PI / 4) * j;
      pts.push({ x: xc + r * Math.cos(a), y: r * Math.sin(a) });
    }
  }
  for (let i = 0; i <= 3; i++) {
    const a = Math.PI - (Math.PI / 2) * (i / 3);
    pts.push({ x: PAPER_W + R * Math.cos(a), y: R * Math.sin(a) });
  }
  return pts;
}

function ripEdge(base: Pt[], seed: number, depth: number): Pt[] {
  const rnd = lcg(seed);
  let wave = 0;
  return base.map((p, i) => {
    wave = i % 3 === 0 ? rnd() : wave * 0.6 + rnd() * 0.4;
    return {
      x: Math.min(PAPER_W, Math.max(0, p.x + (rnd() - 0.5) * 2.2)),
      y: 1 + wave * depth,
    };
  });
}

const EDGE_A = perforationEdge();
const EDGE_TICKET_B = ripEdge(EDGE_A, 7, 8);
const EDGE_STUB_B = ripEdge(EDGE_A, 23, 7);
const EDGE_STRAIN = ripEdge(EDGE_A, 41, 2.6); // the first fibres give way while you pull

const ticketPoly = (top: Pt[]) => {
  const head = top.map((p) => `${pct(p.x)} ${p.y.toFixed(1)}px`);
  const teeth: string[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const x = PAPER_W - (PAPER_W / n) * i;
    teeth.push(`${pct(x)} calc(100% - ${i % 2 ? 3 : 0}px)`);
  }
  return `polygon(${[...head, ...teeth].join(", ")})`;
};
const stubPoly = (bottom: Pt[]) => {
  const tail = [...bottom]
    .reverse()
    .map((p) => `${pct(p.x)} calc(100% - ${p.y.toFixed(1)}px)`);
  return `polygon(0% 0px, 100% 0px, ${tail.join(", ")})`;
};
const TICKET_A = ticketPoly(EDGE_A);
const TICKET_B = ticketPoly(EDGE_TICKET_B);
const STUB_A = stubPoly(EDGE_A);
const STUB_B = stubPoly(EDGE_STUB_B);
const TICKET_S = ticketPoly(EDGE_STRAIN);
const STUB_S = stubPoly(EDGE_STRAIN);

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.irc {
  --irc-ink: #000;
  --irc-surface: #fff;
  --irc-accent: #0060e2;
  --irc-green: #0f7a42;
  --irc-red: #c4302b;
  --irc-amber: #96560a;
  --irc-t1: color-mix(in oklab, var(--irc-ink) 88%, transparent);
  --irc-t2: color-mix(in oklab, var(--irc-ink) 61%, transparent);
  --irc-t3: color-mix(in oklab, var(--irc-ink) 45%, transparent);
  --irc-t4: color-mix(in oklab, var(--irc-ink) 27%, transparent);
  --irc-fill: color-mix(in oklab, var(--irc-ink) 6%, transparent);
  --irc-line: color-mix(in oklab, var(--irc-ink) 6%, transparent);
  --irc-well: color-mix(in oklab, var(--irc-ink) 7%, transparent);
  --irc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --irc-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 6px 14px -6px rgb(0 0 0 / .2), 0 1px 2px 0 rgb(0 0 0 / .06);
  --irc-glint: rgb(255 255 255 / .82);
  --irc-edge: drop-shadow(0 0 .5px rgb(0 0 0 / .34)) drop-shadow(0 1px 1.5px rgb(0 0 0 / .08));
  --irc-edge-lift: drop-shadow(0 0 .5px rgb(0 0 0 / .34)) drop-shadow(0 12px 14px rgb(0 0 0 / .16)) drop-shadow(0 3px 4px rgb(0 0 0 / .1));
  --irc-ease: cubic-bezier(.22, 1, .36, 1);
  --irc-font: Inter, ui-sans-serif, system-ui, sans-serif;
  --irc-mono: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  /* The thermal paper keeps its own tokens: it stays light paper with dark ink in dark mode. */
  --irc-paper: var(--irc-surface);
  --irc-pink: var(--irc-ink);
  --irc-pgreen: #0f7a42;
  --irc-p1: color-mix(in oklab, var(--irc-pink) 88%, transparent);
  --irc-p2: color-mix(in oklab, var(--irc-pink) 64%, transparent);
  --irc-p3: color-mix(in oklab, var(--irc-pink) 54%, transparent);
  --irc-p4: color-mix(in oklab, var(--irc-pink) 30%, transparent);
  position: relative; container-type: inline-size; width: 100%; max-width: 880px;
  color: var(--irc-t1); font: 13px/20px var(--irc-font); -webkit-font-smoothing: antialiased;
}
.irc[data-size="lg"] { max-width: 1080px; }
:is(.dark, [data-theme="dark"]) .irc {
  --irc-ink: #fff; --irc-surface: #1c1c1e; --irc-accent: #4d8dff; --irc-green: #3dd68c;
  --irc-t1: color-mix(in oklab, var(--irc-ink) 90%, transparent);
  --irc-t2: color-mix(in oklab, var(--irc-ink) 62%, transparent);
  --irc-t3: color-mix(in oklab, var(--irc-ink) 46%, transparent);
  --irc-t4: color-mix(in oklab, var(--irc-ink) 28%, transparent);
  --irc-fill: color-mix(in oklab, var(--irc-ink) 8%, transparent);
  --irc-line: color-mix(in oklab, var(--irc-ink) 8%, transparent);
  --irc-well: rgb(0 0 0 / .36);
  --irc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --irc-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 6px 14px -6px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
  --irc-glint: rgb(255 255 255 / .5);
  --irc-paper: #efece4;
  --irc-pink: #15130f;
  --irc-edge: drop-shadow(0 0 .5px rgb(0 0 0 / .55)) drop-shadow(0 1px 2px rgb(0 0 0 / .45));
  --irc-edge-lift: drop-shadow(0 0 .5px rgb(0 0 0 / .55)) drop-shadow(0 14px 18px rgb(0 0 0 / .55)) drop-shadow(0 3px 4px rgb(0 0 0 / .4));
}
:where(.irc) *, :where(.irc) *::before, :where(.irc) *::after { box-sizing: border-box; }
:where(.irc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.irc :focus-visible { outline: 2px solid var(--irc-accent); outline-offset: 2px; }
.irc-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Stage ------------------------------------------------------------------ */
.irc-card { background: var(--irc-surface); border-radius: 22px; box-shadow: var(--irc-shadow); padding: 18px; }
.irc-grid { display: grid; gap: 22px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "mid" "desk" "foot"; }
.irc-head { grid-area: head; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.irc-mid { grid-area: mid; min-width: 0; }
.irc-foot { grid-area: foot; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
@container (min-width: 700px) {
  .irc-card { padding: 28px; }
  .irc-grid { grid-template-columns: minmax(0, 1fr) 364px; grid-template-areas: "head desk" "mid desk" "foot desk"; grid-template-rows: auto 1fr auto; gap: 28px 44px; }
  .irc-head { align-self: start; }
  .irc-mid { align-self: center; }
  .irc-foot { align-self: end; }
}
@container (min-width: 900px) {
  .irc-grid[data-size="lg"] { grid-template-columns: minmax(0, 1fr) 456px; gap: 32px 56px; }
  .irc-grid[data-size="lg"] .irc-h { font-size: 32px; line-height: 36px; letter-spacing: -.025em; }
  .irc-grid[data-size="lg"] .irc-p { font-size: 15px; line-height: 23px; }
  .irc-card[data-size="lg"] { padding: 36px; }
}
@container (max-width: 420px) {
  .irc-card { padding: 14px; border-radius: 18px; }
}

.irc-agent { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 8px 10px; }
@container (min-width: 480px) {
  .irc-agent { display: flex; flex-wrap: wrap; }
  .irc-agent .irc-chip { margin-left: auto; }
}
.irc-agent > div { min-width: 0; }
.irc-tile { width: 32px; height: 32px; border-radius: 10px; background: var(--irc-fill); display: grid; place-items: center; font: 500 14px/1 var(--irc-mono); color: var(--irc-t1); flex: none; }
.irc-who { font-weight: 500; font-size: 14px; color: var(--irc-t1); }
.irc-where { color: var(--irc-t3); font-size: 12.5px; white-space: nowrap; }
.irc-chip { --c: var(--irc-green); grid-column: 1 / -1; justify-self: start; display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 9px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap;
  color: var(--c); background: color-mix(in oklab, var(--c) 11%, transparent); }
.irc-chip[data-tone="warning"] { --c: var(--irc-amber); }
.irc-chip[data-tone="danger"] { --c: var(--irc-red); }
.irc-chip svg { width: 12px; height: 12px; }
.irc-h { margin: 0; font-size: 24px; line-height: 28px; font-weight: 500; letter-spacing: -.02em; color: var(--irc-t1); text-wrap: balance; }
.irc-p { margin: 0; color: var(--irc-t2); font-size: 13.5px; line-height: 21px; text-wrap: pretty; max-width: 46ch; }

.irc-split { display: flex; flex-direction: column; gap: 14px; }
.irc-split-h { margin: 0; font-size: 12.5px; font-weight: 500; color: var(--irc-t3); }
.irc-bar { display: flex; gap: 2px; height: 10px; border-radius: 5px; overflow: hidden; }
.irc-bar i { display: block; height: 100%; min-width: 3px; background: var(--c); transition: flex-grow .5s var(--irc-ease); }
.irc-legend { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.irc-legend li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; line-height: 18px; color: var(--irc-t1); }
.irc-legend li > span { display: flex; flex-direction: column; min-width: 0; }
.irc-legend small { font-size: 12px; line-height: 16px; color: var(--irc-t3); }
.irc-legend i { width: 10px; height: 10px; border-radius: 3px; background: var(--c); flex: none; }
.irc-legend i[data-credit] { background: repeating-linear-gradient(135deg, var(--irc-green) 0 1.5px, transparent 1.5px 3.5px); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--irc-green) 70%, transparent); }
.irc-legend b { margin-left: auto; font: 500 13px/20px var(--irc-mono); color: var(--irc-t1); font-variant-numeric: tabular-nums; }
.irc-legend b[data-neg] { color: var(--irc-green); }

.irc-conseq { display: flex; gap: 10px; align-items: flex-start; margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--irc-fill); color: var(--irc-t2); font-size: 13px; line-height: 20px; }
.irc-conseq svg { width: 16px; height: 16px; margin-top: 2px; flex: none; color: var(--irc-t3); }
.irc-conseq b { color: var(--irc-t1); font-weight: 500; }
.irc-hint { margin: 0; color: var(--irc-t2); font-size: 12.5px; min-height: 20px; }
.irc-acts { display: flex; flex-wrap: wrap; gap: 8px; }
.irc-btn { height: 34px; padding: 0 13px; border-radius: 9px; display: inline-flex; align-items: center; gap: 7px; font-weight: 500; font-size: 13px; white-space: nowrap;
  background: var(--irc-fill); color: var(--irc-t1); transition: background .2s var(--irc-ease), color .2s var(--irc-ease), transform .16s var(--irc-ease), opacity .2s var(--irc-ease); }
.irc-btn svg { width: 15px; height: 15px; flex: none; }
.irc-btn:active:not([aria-disabled="true"]) { transform: scale(.97); }
.irc-btn[aria-disabled="true"] { opacity: .45; cursor: default; }
.irc-btn[data-primary] { background: var(--irc-accent); color: var(--irc-surface); }
.irc-btn[data-ghost] { background: none; color: var(--irc-t2); padding: 0 8px; }
@media (hover: hover) {
  .irc-btn:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--irc-ink) 11%, transparent); }
  .irc-btn[data-primary]:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--irc-accent) 88%, #000); }
  .irc-btn[data-ghost]:hover:not([aria-disabled="true"]) { background: var(--irc-fill); color: var(--irc-t1); }
}
@container (max-width: 420px) {
  .irc-acts { display: grid; grid-template-columns: 1fr 1fr; }
  .irc-acts .irc-btn { justify-content: center; }
  .irc-acts .irc-btn[data-ghost] { grid-column: 1 / -1; }
}
.irc-swap { display: inline-grid; }
.irc-swap > span { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: 7px; transition: opacity .22s var(--irc-ease), filter .22s var(--irc-ease), transform .22s var(--irc-ease); }
.irc-swap > span + span { opacity: 0; filter: blur(3px); transform: translateY(4px); }
.irc-swap[data-on] > span:first-child { opacity: 0; filter: blur(3px); transform: translateY(-4px); }
.irc-swap[data-on] > span + span { opacity: 1; filter: none; transform: none; }

/* Desk, printer, paper ---------------------------------------------------- */
.irc-desk { --irc-row: 18px; --irc-fs: 12px; --irc-pw: 320px; --irc-h: calc(var(--irc-n) * var(--irc-row));
  grid-area: desk; position: relative; display: flex; flex-direction: column; align-items: center; background: var(--irc-well); border-radius: 18px; padding: 18px 20px 56px; min-width: 0; overflow: clip; }
@container (min-width: 900px) {
  .irc-desk[data-size="lg"] { --irc-row: 23px; --irc-fs: 15px; --irc-pw: 400px; padding: 22px 28px 68px; }
}
@container (max-width: 420px) { .irc-desk { padding: 14px 12px 40px; } }
.irc-printer { position: relative; z-index: 3; width: 100%; height: 36px; border-radius: 12px; background: var(--irc-surface); box-shadow: var(--irc-float);
  display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px 6px; font: 500 10.5px/1 var(--irc-mono); letter-spacing: .06em; color: var(--irc-t2); text-transform: uppercase; white-space: nowrap; }
@container (max-width: 420px) { .irc-printer { font-size: 9.5px; letter-spacing: .02em; padding: 0 10px 6px; } }
.irc-printer::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 6px; height: 3px; border-radius: 2px; background: color-mix(in oklab, var(--irc-ink) 70%, transparent); box-shadow: 0 1px 0 var(--irc-glint); }
.irc-led { width: 6px; height: 6px; border-radius: 50%; background: var(--irc-t4); flex: none; transition: background .3s var(--irc-ease); }
.irc-desk:not([data-torn]):not([data-idle]) .irc-led { background: var(--irc-green); }
.irc-st { display: inline-grid; margin-left: 8px; }
.irc-st > span { grid-area: 1 / 1; white-space: nowrap; transition: opacity .25s var(--irc-ease), filter .25s var(--irc-ease); }
.irc-st-print, .irc-st-torn { opacity: 0; filter: blur(3px); }
.irc-st-done { opacity: 1; }
.irc-lhs { display: inline-flex; align-items: center; }
.irc-desk[data-torn] .irc-st-done { opacity: 0; filter: blur(3px); }
.irc-desk[data-torn] .irc-st-torn { opacity: 1; filter: none; }

/* The window hides everything above the slot, so paper only exists once it has been fed out. */
.irc-win { position: relative; z-index: 1; width: 100%; margin-top: -6px; clip-path: inset(0 -80px -400px -80px); display: flex; flex-direction: column; align-items: center; }
.irc-strip { width: 100%; display: flex; flex-direction: column; align-items: center; }
.irc-fx { width: min(var(--irc-pw), calc(100% - 2px)); position: relative; filter: var(--irc-edge); }
.irc-stub-fx { height: calc(var(--irc-row) * 2); z-index: 1; }
.irc-stub { height: 100%; background: var(--irc-paper); clip-path: ${STUB_A}; transition: clip-path .3s var(--irc-ease); }
.irc-desk[data-pull] .irc-stub { clip-path: ${STUB_S}; transition-duration: .2s; }
.irc-stub-fx[data-torn] .irc-stub { clip-path: ${STUB_B}; }
.irc-tfx { height: var(--irc-h); z-index: 2; transform: translate3d(0, var(--irc-dy, 0px), 0) rotate(var(--irc-rot, 0deg)) scale(var(--irc-sc, 1)); transform-origin: 50% 50%;
  transition: transform .6s var(--irc-ease), filter .6s var(--irc-ease); cursor: grab; user-select: none; -webkit-user-select: none; text-rendering: geometricPrecision; }
.irc-tfx[data-drag] { transition: filter .3s var(--irc-ease); cursor: grabbing; will-change: transform; filter: var(--irc-edge-lift); }
.irc-tfx[data-torn] { filter: var(--irc-edge-lift); cursor: auto; user-select: text; -webkit-user-select: text; }
.irc-tfx[data-idle] { visibility: hidden; }
.irc-ticket { position: relative; height: 100%; background: var(--irc-paper); clip-path: ${TICKET_A}; transition: clip-path .34s var(--irc-ease);
  padding: 0 calc(var(--irc-fs) * 1.5); font: 400 var(--irc-fs)/var(--irc-row) var(--irc-mono); color: var(--irc-p1); font-variant-numeric: tabular-nums; }
@container (max-width: 420px) { .irc-ticket { padding: 0 14px; } }
.irc-ticket::before { content: ""; position: absolute; inset: 0 0 auto; height: calc(var(--irc-row) * 3); pointer-events: none; background: linear-gradient(180deg, var(--irc-glint), transparent); opacity: .5; }
.irc-desk[data-pull] .irc-ticket { clip-path: ${TICKET_S}; transition-duration: .2s; }
.irc-tfx[data-torn] .irc-ticket { clip-path: ${TICKET_B}; }
.irc-stub-fx[data-torn] { animation: irc-jolt .42s var(--irc-ease); }

.irc-grab { position: absolute; z-index: 2; left: 50%; top: calc(var(--irc-row) - 12px); transform: translateX(-50%); height: 24px; padding: 0 11px 0 9px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px;
  font: 500 11px/1 var(--irc-font); color: var(--irc-p2); background: color-mix(in oklab, var(--irc-pink) 7%, transparent); touch-action: none; white-space: nowrap;
  opacity: 0; visibility: hidden; transition: opacity .4s var(--irc-ease), visibility .4s, background .16s var(--irc-ease), color .16s var(--irc-ease); }
.irc-tfx[data-ready]:not([data-torn]) .irc-grab { opacity: 1; visibility: visible; }
.irc-grab svg { width: 12px; height: 12px; }
.irc-grab:hover { color: var(--irc-p1); background: color-mix(in oklab, var(--irc-pink) 12%, transparent); }
.irc-tfx[data-ready]:not([data-torn]):not([data-drag]) .irc-grab svg { animation: irc-nudge 2.2s var(--irc-ease) 1.2s 3; }
.irc-grab::before { content: ""; position: absolute; inset: -10px -6px; }

/* Rows ------------------------------------------------------------------- */
.irc-r { height: calc(var(--u) * var(--irc-row)); display: flex; align-items: center; min-width: 0; white-space: nowrap; }
.irc-r > * { min-width: 0; }
.irc-r-title { justify-content: center; font-weight: 600; font-size: 1.08em; letter-spacing: .24em; padding-left: .24em; }
.irc-r-center { justify-content: center; text-align: center; overflow: hidden; text-overflow: ellipsis; display: block; line-height: var(--irc-row); }
.irc-r-center[data-dim] { color: var(--irc-p3); font-size: .92em; }
.irc-r-rule::before { content: ""; flex: 1; height: 1px; background: repeating-linear-gradient(90deg, var(--irc-p4) 0 4px, transparent 4px 8px); }
.irc-r-section { font-size: .84em; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--irc-p2); }
.irc-lbl { overflow: hidden; text-overflow: ellipsis; flex: 0 1 auto; }
.irc-dots { flex: 1 0 12px; height: 1px; margin: 0 6px; align-self: flex-end; transform: translateY(calc(var(--irc-row) * -.3)); background: repeating-linear-gradient(90deg, var(--irc-p4) 0 1px, transparent 1px 4px); }
.irc-val { flex: none; }
.irc-val[data-neg] { color: var(--irc-pgreen); }
.irc-r-detail { font-size: .92em; color: var(--irc-p2); padding-left: 1.2em; overflow: hidden; text-overflow: ellipsis; display: block; line-height: var(--irc-row); }
.irc-r-stat { color: var(--irc-p2); }
.irc-r-total { font-weight: 600; }
.irc-tl { font-size: .92em; letter-spacing: .2em; }
.irc-tv { margin-left: auto; font-size: 2.2em; letter-spacing: -.01em; line-height: 1; font-weight: 700;
  background: radial-gradient(circle at 50% 50%, var(--irc-pink) .85px, transparent 1.15px) 0 0 / 2.1px 2.1px; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
.irc-bars { width: 100%; height: calc(var(--irc-row) * 1.5); color: var(--irc-p1); display: block; }
.irc-r-bars { align-items: center; }
.irc-r-title span { background: radial-gradient(circle at 50% 50%, var(--irc-pink) .75px, transparent 1.05px) 0 0 / 1.9px 1.9px; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }

/* Motion ----------------------------------------------------------------- */
@keyframes irc-feed { from { transform: translate3d(0, calc(var(--irc-n2) * var(--irc-row) * -1), 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes irc-slot { 0%, 94% { background: var(--irc-accent); box-shadow: 0 0 10px color-mix(in oklab, var(--irc-accent) 55%, transparent), 0 1px 0 var(--irc-glint); } }
@keyframes irc-swapout { 0%, 90% { opacity: 1; filter: none; } 100% { opacity: 0; filter: blur(3px); } }
@keyframes irc-swapin { 0%, 90% { opacity: 0; filter: blur(3px); } 100% { opacity: 1; filter: none; } }
@keyframes irc-led { from, to { background: var(--irc-accent); } }
@keyframes irc-nudge { 0%, 24%, 100% { transform: translateY(0); } 8% { transform: translateY(2.5px); } 16% { transform: translateY(0); } }
@keyframes irc-jolt { 0% { transform: translateY(0); } 25% { transform: translateY(-3px); } 100% { transform: translateY(0); } }
@keyframes irc-rise { from { opacity: 0; filter: blur(3px); transform: translateY(6px); } }

.irc[data-off] *, .irc[data-off] *::before, .irc[data-off] *::after { animation-play-state: paused !important; }

@media (prefers-reduced-motion: no-preference) {
  .irc-desk[data-printing] .irc-strip { animation: irc-feed calc(var(--irc-n2) * var(--irc-step)) steps(var(--irc-n2), jump-start) backwards; }
  .irc-desk[data-printing] .irc-printer::after { animation: irc-slot calc(var(--irc-n2) * var(--irc-step)) linear backwards; }
  .irc-desk[data-printing] .irc-st-print { animation: irc-swapout calc(var(--irc-n2) * var(--irc-step)) linear backwards; }
  .irc-desk[data-printing] .irc-st-done { animation: irc-swapin calc(var(--irc-n2) * var(--irc-step)) linear backwards; }
  .irc-desk[data-printing]:not([data-torn]) .irc-led { animation: irc-led calc(var(--irc-n2) * var(--irc-step)) linear backwards; }
  .irc-h, .irc-p, .irc-agent, .irc-split, .irc-conseq { animation: irc-rise .6s var(--irc-ease) backwards; }
  .irc-agent { animation-delay: 0ms; } .irc-h { animation-delay: 60ms; } .irc-p { animation-delay: 120ms; }
  .irc-split { animation-delay: 180ms; } .irc-conseq { animation-delay: 240ms; }
}

@media (prefers-reduced-motion: reduce) {
  .irc *, .irc *::before, .irc *::after { animation: none !important; transition: none !important; }
}

@media (forced-colors: active) {
  .irc-tv, .irc-r-title span { background: none; color: CanvasText; -webkit-text-fill-color: CanvasText; }
  .irc-fx, .irc-tfx[data-torn], .irc-tfx[data-drag] { filter: none; }
  .irc-ticket, .irc-stub { outline: 1px solid CanvasText; }
  .irc-btn[aria-disabled="true"] { opacity: 1; color: GrayText; }
}
`;

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const svg = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;
const IconCopy = () => (
  <svg {...svg}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="2" />
    <path d="M10.5 5.5V4.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1" />
  </svg>
);
const IconCheck = () => (
  <svg {...svg}>
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
const IconDownload = () => (
  <svg {...svg}>
    <path d="M8 2.5v7.5M4.8 7.2 8 10.4l3.2-3.2M3 13h10" />
  </svg>
);
const IconPrint = () => (
  <svg {...svg}>
    <path d="M4.5 6V2.5h7V6M4.5 11.5h-1a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1" />
    <path d="M4.5 9.5h7v4h-7z" />
  </svg>
);
const IconReceipt = () => (
  <svg {...svg}>
    <path d="M3.5 2.5h9v11l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1v-11ZM6 6h4M6 8.5h4" />
  </svg>
);
const IconChevrons = () => (
  <svg {...svg}>
    <path d="m4.5 3.5 3.5 3.5 3.5-3.5M4.5 8.5 8 12l3.5-3.5" />
  </svg>
);

/* Barcode drawn from the run id, so each receipt gets its own. */
function Bars({ seed }: { seed: string }) {
  const bars = React.useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++)
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    const rnd = lcg(h);
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 120) {
      const w = 1 + Math.floor(rnd() * 3);
      out.push({ x, w });
      x += w + 1 + Math.floor(rnd() * 2);
    }
    return { out, width: x };
  }, [seed]);
  return (
    <svg
      className="irc-bars"
      viewBox={`0 0 ${bars.width} 20`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.out.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y="0"
          width={b.w}
          height="20"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Hooks and utils                            */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const reducedNow = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeMotion, reducedNow, () => false);

const TEAR_PX = 48; // how far to pull before the paper rips
const PULL_FOLLOW = 0.75; // the paper follows the pointer this closely until it rips
const TORN_DY = 34; // px the torn receipt drops onto the tray
const TORN_ROT = -1.6; // deg it lands at
const TORN_SCALE = 1.012;
const SWAP_MS = 1700;

function swatch(i: number) {
  return `color-mix(in oklab, var(--irc-accent) ${[100, 52, 28, 70][i % 4]}%, transparent)`;
}

type CopyState = "idle" | "ok" | "fail";

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function RunReceipt({
  receipt = DEMO_RECEIPT,
  summary,
  consequence,
  autoPrint = true,
  speed = 1,
  size = "md",
  status: statusLabel = "Run complete",
  statusTone = "success",
  headingLevel = 3,
  onTear,
  onCopy,
  onDownload,
  className,
}: RunReceiptProps) {
  const model = React.useMemo(() => buildModel(receipt), [receipt]);
  const isDemo = receipt === DEMO_RECEIPT;
  const summaryText = summary ?? (isDemo ? DEMO_SUMMARY : undefined);
  const consequenceText =
    consequence ?? (isDemo ? DEMO_CONSEQUENCE : undefined);

  const reduced = useReducedMotion();
  const [run, setRun] = React.useState(autoPrint ? 1 : 0); // 0 = nothing printed yet
  const [fed, setFed] = React.useState(false); // the paper has finished feeding out
  const [torn, setTorn] = React.useState(false);
  const [copied, setCopied] = React.useState<CopyState>("idle");
  const ready = run > 0 && (reduced || fed);

  const step = Math.round(90 / Math.max(0.1, speed));
  const hintId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const deskRef = React.useRef<HTMLDivElement>(null);
  const tfxRef = React.useRef<HTMLDivElement>(null);
  const copyRef = React.useRef<HTMLButtonElement>(null);
  const drag = React.useRef<{
    id: number;
    y: number;
    captured: boolean;
  } | null>(null);
  const viaKeyboard = React.useRef(false);
  const timers = React.useRef<number[]>([]);

  /* Pause the print head off screen and in hidden tabs. */
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let visible = true;
    let shown = true;
    const apply = () => el.toggleAttribute("data-off", !(visible && shown));
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      apply();
    });
    io.observe(el);
    const onVis = () => {
      shown = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  React.useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  /* If animations never run (user stylesheet, test harness), the receipt is still usable. */
  React.useEffect(() => {
    if (run === 0) return;
    const id = window.setTimeout(
      () => setFed(true),
      (model.units + 2) * step + 500,
    );
    return () => window.clearTimeout(id);
  }, [run, model.units, step]);

  /* After a keyboard tear the pull tab disappears, so hand focus to Copy. */
  React.useEffect(() => {
    if (torn && viaKeyboard.current) {
      viaKeyboard.current = false;
      copyRef.current?.focus();
    }
  }, [torn]);

  const print = () => {
    setTorn(false);
    setFed(false);
    setCopied("idle");
    setRun((n) => n + 1);
  };

  const tear = (byKeyboard = false) => {
    if (torn || !ready) return;
    viaKeyboard.current = byKeyboard;
    const el = tfxRef.current;
    if (el) {
      /* Leave the torn pose inline so the paper eases from where the hand let go. */
      delete el.dataset.drag;
      el.style.setProperty("--irc-dy", `${TORN_DY}px`);
      el.style.setProperty("--irc-rot", `${TORN_ROT}deg`);
      el.style.setProperty("--irc-sc", String(TORN_SCALE));
    }
    deskRef.current?.removeAttribute("data-pull");
    drag.current = null;
    setTorn(true);
    onTear?.();
  };

  const flash = (state: CopyState) => {
    setCopied(state);
    timers.current.push(window.setTimeout(() => setCopied("idle"), SWAP_MS));
  };

  const copy = async () => {
    if (!torn) return;
    let ok = true;
    try {
      await navigator.clipboard.writeText(model.text);
    } catch {
      const prev = document.activeElement as HTMLElement | null;
      const ta = document.createElement("textarea");
      ta.value = model.text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
      prev?.focus?.();
    }
    flash(ok ? "ok" : "fail");
    if (ok) onCopy?.(model.text);
  };

  const download = () => {
    if (!torn) return;
    const url = URL.createObjectURL(
      new Blob([model.text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = model.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    timers.current.push(
      window.setTimeout(() => URL.revokeObjectURL(url), 1500),
    );
    onDownload?.(model.fileName);
  };

  /* Pull the receipt down against the perforation. The paper follows the hand,
     starts to give at the holes, and rips once you have pulled far enough. */
  const resetPull = () => {
    const el = tfxRef.current;
    if (el) {
      delete el.dataset.drag;
      el.style.removeProperty("--irc-dy");
      el.style.removeProperty("--irc-rot");
      el.style.removeProperty("--irc-sc");
    }
    deskRef.current?.removeAttribute("data-pull");
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (torn || !ready || e.button !== 0) return;
    if (
      e.pointerType === "touch" &&
      !(e.target as HTMLElement).closest(".irc-grab")
    )
      return;
    drag.current = { id: e.pointerId, y: e.clientY, captured: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = tfxRef.current;
    if (!d || d.id !== e.pointerId || !el) return;
    if (e.buttons === 0) {
      /* The button was let go outside the receipt before we captured the pointer. */
      drag.current = null;
      resetPull();
      return;
    }
    const dy = e.clientY - d.y;
    if (!d.captured) {
      if (Math.abs(dy) < 4) return;
      d.captured = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.dataset.drag = "1";
      deskRef.current?.setAttribute("data-pull", "");
    }
    const raw = Math.min(TEAR_PX, Math.max(0, dy));
    const t = raw / TEAR_PX;
    el.style.setProperty("--irc-dy", `${(raw * PULL_FOLLOW).toFixed(1)}px`);
    el.style.setProperty("--irc-rot", `${(-t * 1.1).toFixed(2)}deg`);
    el.style.setProperty("--irc-sc", (1 + t * (TORN_SCALE - 1)).toFixed(4));
    if (dy >= TEAR_PX) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      tear();
    }
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    resetPull();
  };

  const positive = model.sectionTotals
    .map((s, i) => ({ ...s, i }))
    .filter((s) => s.micro > 0);
  const posSum = positive.reduce((a, s) => a + s.micro, 0) || 1;
  const deskVars = {
    "--irc-n": model.units,
    "--irc-n2": model.units + 2,
    "--irc-step": `${step}ms`,
  } as React.CSSProperties;
  const H = `h${headingLevel}` as "h3";

  const status = torn
    ? "Receipt torn off. Copy and download are available."
    : ready
      ? "Receipt printed. Pull the tab down to tear it off."
      : run > 0
        ? "Printing receipt."
        : "No receipt printed yet.";

  return (
    <div
      ref={rootRef}
      className={cn("irc", className)}
      data-size={size === "lg" ? "lg" : undefined}
    >
      <style href="run-receipt" precedence="default">
        {CSS}
      </style>
      <section
        className="irc-card"
        data-size={size}
        aria-label={`${receipt.title ?? "Run receipt"}: ${receipt.agent}, ${receipt.task}`}
      >
        <div className="irc-grid" data-size={size}>
          <div className="irc-head">
            <div className="irc-agent">
              <span className="irc-tile" aria-hidden>
                {receipt.agent.slice(0, 1)}
              </span>
              <div>
                <div className="irc-who">{receipt.agent}</div>
                <div className="irc-where">{receipt.workspace}</div>
              </div>
              <span className="irc-chip" data-tone={statusTone}>
                <IconCheck />
                {statusLabel} · {receipt.duration}
              </span>
            </div>
            <H className="irc-h">{receipt.task}</H>
            {summaryText ? <p className="irc-p">{summaryText}</p> : null}
          </div>

          <div className="irc-mid">
            <div className="irc-split">
              <p className="irc-split-h">Where the cost went</p>
              <div
                className="irc-bar"
                role={positive.length ? "img" : undefined}
                aria-hidden={positive.length ? undefined : true}
                aria-label={
                  positive.length
                    ? positive.map((s) => `${s.title} ${s.text}`).join(", ")
                    : undefined
                }
              >
                {positive.map((s) => (
                  <i
                    key={s.i}
                    style={
                      {
                        flexGrow: s.micro / posSum,
                        flexBasis: 0,
                        "--c": swatch(s.i),
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <ul className="irc-legend">
                {model.sectionTotals.map((s, i) => (
                  <li key={i}>
                    <i
                      data-credit={s.micro < 0 ? "" : undefined}
                      style={{ "--c": swatch(i) } as React.CSSProperties}
                    />
                    <span>
                      {s.title}
                      <small>
                        {s.micro < 0
                          ? "Credit applied"
                          : s.counted && s.calls > 0
                            ? `${s.calls} calls · ${Math.round((s.micro / posSum) * 100)}% of spend`
                            : `${s.lineCount} ${s.lineCount === 1 ? "line" : "lines"} · ${Math.round((s.micro / posSum) * 100)}% of spend`}
                      </small>
                    </span>
                    <b data-neg={s.micro < 0 ? "" : undefined}>{s.text}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            key={run}
            ref={deskRef}
            className="irc-desk"
            style={deskVars}
            data-size={size}
            data-printing={run > 0 ? "" : undefined}
            data-torn={torn ? "" : undefined}
            data-idle={run === 0 ? "" : undefined}
          >
            <div className="irc-printer" aria-hidden>
              <span className="irc-lhs">
                <span className="irc-led" />
                <span className="irc-st">
                  <span className="irc-st-print">Printing…</span>
                  <span className="irc-st-done">
                    {run > 0
                      ? `Printed · ${model.rows.filter((r) => r.row.k !== "gap").length} lines`
                      : "Ready"}
                  </span>
                  <span className="irc-st-torn">Torn off</span>
                </span>
              </span>
              <span>run {receipt.runId}</span>
            </div>

            <div className="irc-win">
              <div
                className="irc-strip"
                onAnimationEnd={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    e.animationName === "irc-feed"
                  )
                    setFed(true);
                }}
              >
                <div
                  className="irc-fx irc-stub-fx"
                  data-torn={torn ? "" : undefined}
                  aria-hidden
                >
                  <div className="irc-stub" />
                </div>

                <div
                  ref={tfxRef}
                  className="irc-fx irc-tfx"
                  data-torn={torn ? "" : undefined}
                  data-ready={ready ? "" : undefined}
                  data-idle={run === 0 ? "" : undefined}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onLostPointerCapture={endDrag}
                >
                  <div className="irc-ticket" role="group" aria-label="Receipt">
                    {model.rows.map(({ row, units }, idx) => (
                      <div
                        key={idx}
                        className={`irc-r irc-r-${row.k}`}
                        data-dim={
                          row.k === "center" && row.dim ? "" : undefined
                        }
                        style={{ "--u": units } as React.CSSProperties}
                      >
                        <RowBody row={row} />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="irc-grab"
                      tabIndex={ready && !torn ? 0 : -1}
                      onClick={() => tear(true)}
                    >
                      <IconChevrons />
                      Pull to tear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="irc-foot">
            {consequenceText ? (
              <p className="irc-conseq">
                <IconReceipt />
                <span>{consequenceText}</span>
              </p>
            ) : null}
            <p className="irc-hint" id={hintId}>
              {torn
                ? "Torn off. Copy or download it before Print again replaces it."
                : run === 0
                  ? "Print the receipt to see where the cost went."
                  : !ready
                    ? "Printing your receipt…"
                    : "Pull the tab to tear it off."}
            </p>
            <div className="irc-acts">
              <button
                ref={copyRef}
                type="button"
                className="irc-btn"
                data-primary={torn ? "" : undefined}
                aria-disabled={!torn}
                aria-describedby={torn ? undefined : hintId}
                onClick={copy}
              >
                <span
                  className="irc-swap"
                  data-on={copied !== "idle" ? "" : undefined}
                >
                  <span>
                    <IconCopy />
                    Copy text
                  </span>
                  <span aria-hidden>
                    <IconCheck />
                    {copied === "fail" ? "Copy failed" : "Copied"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="irc-btn"
                aria-disabled={!torn}
                aria-describedby={torn ? undefined : hintId}
                onClick={download}
              >
                <IconDownload />
                Download .txt
              </button>
              <button
                type="button"
                className="irc-btn"
                data-primary={run === 0 ? "" : undefined}
                data-ghost={run > 0 ? "" : undefined}
                onClick={print}
              >
                <IconPrint />
                {run === 0 ? "Print receipt" : "Print again"}
              </button>
            </div>
            <span className="irc-sr" role="status" aria-live="polite">
              {status}
              {copied === "ok" ? " Copied to clipboard." : ""}
              {copied === "fail"
                ? " Copy failed. Select the text and copy it by hand."
                : ""}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function RowBody({ row }: { row: Row }) {
  switch (row.k) {
    case "title":
      return <span>{row.text}</span>;
    case "center":
      return <>{row.text}</>;
    case "section":
      return <>{row.text}</>;
    case "item":
      return (
        <>
          <span className="irc-lbl">{row.label}</span>
          <span className="irc-dots" aria-hidden />
          <span className="irc-val" data-neg={row.neg ? "" : undefined}>
            {row.value}
          </span>
        </>
      );
    case "detail":
      return <>{row.text}</>;
    case "stat":
      return (
        <>
          <span className="irc-lbl">{row.label}</span>
          <span className="irc-dots" aria-hidden />
          <span className="irc-val">{row.value}</span>
        </>
      );
    case "total":
      return (
        <>
          <span className="irc-tl">{row.label}</span>
          <span className="irc-tv">{row.value}</span>
        </>
      );
    case "bars":
      return <Bars seed={row.seed} />;
    default:
      return null;
  }
}
