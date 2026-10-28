import * as React from "react"

import { ASSEMBLER_SAMPLE, Assembler, type AssemblerNode } from "@/components/ui/assembler"

export const notes = [
  "Each part is a keyed wrapper that starts as a skeleton. One setTimeout per id flips it to content; the content enters with a single keyframe (opacity, a 4px rise, blur 3px to 0) while a copy of the skeleton sits on top and fades out, so there is never a blank frame. The skeleton is shaped from the data (same bar count and relative heights, same table rows), so only its colour changes when it settles. Parts you mark pending stay skeletons until their data arrives.",
  "Slots are reserved. When a part lands below one that has not arrived yet, the missing one appears as a skeleton in its real place, so the content blurs in without shoving its neighbours. When something does move, FLIP glides it: a layout effect reads each part's offsetTop and offsetLeft after every render, compares them with the last render, and plays element.animate() from the old offset to none, picking up the live transform if a glide is still running.",
  "The chart builds in a fixed order: bars grow bottom-up with a 60ms stagger (CSS animation-delay from a --i variable), the dashed plan line is revealed left to right with an animated clip-path, then the last value counts up through a rAF loop that writes into one text node. React renders the final number, so a frozen rAF still shows it. A chart can set a base so growth is visible, and the header says where the axis starts.",
  "The card's height cannot transition to auto, so a ResizeObserver measures the content and writes pixel heights while CSS transitions between them. The lifted shadow lives on a wrapper, not on the card, so a theme such as Glass can restyle the card's own shadow. The building hairline is an SVG rect with pathLength=100: a bright dash and a dimmer tail share one stroke-dashoffset animation and travel the border at a constant speed.",
  "Buttons are gated by data: an action lists the part ids it needs, and until they have settled it is aria-disabled with a note that says what it is waiting for (ids that are not in the tree are ignored). Pressing one morphs it, draws the check with stroke-dashoffset, pulses a ring, turns the title badge green and rewrites the status line, so the one fact is stated in three places that agree. Undo only appears when you pass onUndo, and returns focus to the button.",
]

const CLINIC: { nodes: AssemblerNode[]; order: string[] } = {
  nodes: [
    { id: "title", type: "title", text: "Friday clinic day sheet", subtitle: "Northwind Clinics · Lakeside site · 8 clinicians", badge: "Live" },
    {
      id: "kpis",
      type: "kpis",
      items: [
        { label: "Booked", value: "38", delta: "4 vs last Fri", trend: "up" },
        { label: "Walk-ins", value: "6", delta: "vs last Fri", trend: "flat" },
        { label: "Average wait", value: "12 min", delta: "3 min", trend: "down", tone: "good" },
        { label: "No-show risk", value: "4", delta: "2 patients", trend: "up", tone: "bad" },
      ],
    },
    {
      id: "chart",
      type: "chart",
      title: "Bookings by hour",
      unit: "visits",
      series: [4, 5, 6, 5, 3, 4, 4, 4, 3],
      labels: ["8", "9", "10", "11", "12", "13", "14", "15", "16"],
      target: { value: 6, label: "Capacity 6" },
      highlight: 2,
      caption: "10:00 is full. 14:00 and 15:00 each have two open slots.",
    },
    {
      id: "table",
      type: "table",
      title: "Bookings at risk",
      columns: [{ label: "Slot", fr: 1 }, { label: "Clinician", fr: 2 }, { label: "Risk", align: "right", fr: 1 }],
      rows: [
        ["09:20", "Dr. Lindqvist", { text: "High", tone: "bad" }],
        ["11:40", "Dr. Okafor", "Medium"],
        ["13:10", "Dr. Lindqvist", { text: "High", tone: "bad" }],
        ["15:30", "Dr. Moreau", "Medium"],
      ],
      caption: "Dr. Lindqvist has both high-risk slots.",
    },
    {
      id: "actions",
      type: "actions",
      note: "Texts 4 patients at 15:00",
      items: [
        {
          id: "remind",
          label: "Send reminders",
          kind: "primary",
          needs: ["table"],
          doneLabel: "Reminders queued",
          doneNote: "Queued · 4 patients at 15:00",
        },
        { id: "open", label: "Open schedule" },
      ],
    },
  ],
  order: ["title", "kpis", "chart", "actions", "table"],
}

const SCENES = [
  { id: "investors", label: "Investor update", data: ASSEMBLER_SAMPLE as { nodes: readonly AssemblerNode[]; order: readonly string[] }, agent: "Atlas" },
  { id: "clinic", label: "Clinic day sheet", data: CLINIC, agent: "Sage" },
] as const

const SNIPPET = `{ "id": "chart", "type": "chart", "pending": true }
{ "id": "table", "type": "table", "rows": [ ... ] }
{ "id": "send", "needs": ["chart"], "doneLabel": "Queued" }`

const noop = () => {}

export default function Demo() {
  const [scene, setScene] = React.useState<(typeof SCENES)[number]["id"]>("investors")
  const s = SCENES.find((x) => x.id === scene) ?? SCENES[0]

  return (
    <div className="flex w-full max-w-[640px] flex-col items-stretch gap-5">
      <div role="group" aria-label="Scene" className="flex w-fit items-center gap-1 self-center rounded-xl bg-neutral-200/60 p-1 dark:bg-white/[.07]">
        {SCENES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={scene === x.id}
            onClick={() => setScene(x.id)}
            className={`rounded-lg px-3 py-1 text-[13px] transition-colors ${scene === x.id ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <Assembler key={s.id} nodes={[...s.data.nodes]} order={[...s.data.order]} agent={{ name: s.agent }} onUndo={noop} />
      <div className="mt-2 flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">What the agent streams</span>
        <pre className="m-0 whitespace-pre-wrap break-words rounded-xl bg-neutral-100 px-4 py-3 font-mono text-[11.5px] leading-[18px] text-neutral-500 dark:bg-white/[.04] dark:text-neutral-400">{SNIPPET}</pre>
      </div>
    </div>
  )
}
