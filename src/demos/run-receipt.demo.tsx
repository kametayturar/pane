import * as React from "react";

import { RunReceipt, type RunReceiptData } from "@/components/ui/run-receipt";

const OUTREACH: RunReceiptData = {
  agent: "Quill",
  task: "Draft check-up reminders",
  workspace: "Northwind Clinics",
  runId: "21c7e0",
  finishedAt: "28 Oct 2026 · 14:06",
  duration: "4m 12s",
  sections: [
    {
      title: "Model calls",
      countLabel: "Model calls",
      lines: [
        {
          label: "northstar-xl",
          detail: "9,860 in · 2,740 out",
          qty: 3,
          tokens: 12600,
          amount: 0.0707,
        },
        {
          label: "northstar-mini",
          detail: "52,400 in · 14,000 out",
          qty: 40,
          tokens: 66400,
          amount: 0.0306,
        },
      ],
    },
    {
      title: "Tool calls",
      countLabel: "Tool calls",
      lines: [
        { label: "crm.lookup", detail: "40 × $0.0008", qty: 40, amount: 0.032 },
        {
          label: "calendar.slots",
          detail: "6 × $0.0012",
          qty: 6,
          amount: 0.0072,
        },
        { label: "email.draft", detail: "40 × $0.0015", qty: 40, amount: 0.06 },
      ],
    },
    {
      title: "Credits",
      lines: [
        { label: "Prompt cache", detail: "20,000 tokens read", amount: -0.054 },
      ],
    },
  ],
};

const RUNS = [
  { id: "atlas", label: "Atlas · Invoices" },
  { id: "quill", label: "Quill · Reminders" },
] as const;

const SIZES = [
  { id: "md", label: "Regular" },
  { id: "lg", label: "Large" },
] as const;

function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-full bg-neutral-900/[0.06] p-0.5 dark:bg-white/[0.08]"
    >
      {items.map((r) => (
        <button
          key={r.id}
          type="button"
          aria-pressed={value === r.id}
          onClick={() => onChange(r.id)}
          className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 aria-pressed:bg-white aria-pressed:text-neutral-950 aria-pressed:shadow-[0_0_0_0.5px_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.08)] dark:text-neutral-400 dark:hover:text-white dark:aria-pressed:bg-white/15 dark:aria-pressed:text-white dark:aria-pressed:shadow-none"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function Demo() {
  const [run, setRun] = React.useState<(typeof RUNS)[number]["id"]>("atlas");
  const [size, setSize] = React.useState<(typeof SIZES)[number]["id"]>("md");

  return (
    <div
      className={`flex w-full flex-col gap-5 ${size === "lg" ? "max-w-[1080px]" : "max-w-[880px]"}`}
    >
      <div className="flex flex-wrap gap-3">
        <Segmented
          label="Choose a run"
          items={RUNS}
          value={run}
          onChange={setRun}
        />
        <Segmented
          label="Receipt size"
          items={SIZES}
          value={size}
          onChange={setSize}
        />
      </div>
      {run === "atlas" ? (
        <RunReceipt key="atlas" size={size} />
      ) : (
        <RunReceipt
          key="quill"
          size={size}
          receipt={OUTREACH}
          summary="Quill wrote 40 reminders for patients who are overdue for a check-up and held them for review."
          consequence={
            <>
              Billed to <b>Northwind Clinics</b> on 1 Nov. All 40 drafts wait in
              Quill&apos;s outbox, and <b>nothing has been sent</b> yet.
            </>
          }
        />
      )}
    </div>
  );
}

export const notes: string[] = [
  "The receipt feeds out of the slot because the whole paper strip (stub plus ticket) is one element that a CSS animation moves from `translateY(-height)` to 0 with `steps(N, jump-start)`. Every row has the same height, so each step advances the paper by exactly one line, and a clipped window under the printer slot hides the paper until it has been fed out.",
  "The perforation is a `clip-path: polygon()` with about 120 points: half-circle bites in the stub and in the receipt line up into round holes. The torn state is a second polygon with the same number of points, so CSS can transition `clip-path` between them and the holes turn into a ragged rip.",
  "Dragging uses Pointer Events with `setPointerCapture`. The pull is written straight to CSS variables on the element (no React render per move), follows the hand at 75% while the holes start to give (a third polygon between whole and torn), and rips once the pointer travels 48px; the torn piece then eases down onto the tray and tilts slightly. The pull tab is a real button, so Enter or Space tears it too.",
  "Money is summed as integers (amounts rounded to ten-thousandths of a dollar first), so the printed lines always add up to the printed total. The Copy and Download text is built from the same rows, padded to a fixed 38-character width.",
  "The dot-matrix look on the title and total is a radial-gradient dot grid used as text fill with `background-clip: text`. A `filter: drop-shadow()` on the wrapper follows the clipped, perforated outline, which a box-shadow could not.",
];
