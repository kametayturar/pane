import * as React from "react"
import { Building2, Calendar, Globe, Lock, Mail, MessageSquare } from "lucide-react"

import { ShareSheet, type ShareAccessOption, type SharePerson, type ShareChannel } from "@/components/ui/share-sheet"

export const notes: string[] = [
  "The trigger, the panel and the confirmation are the same element: one rounded shape whose `width`, `height` and `border-radius` follow springs (bouncy when growing, critically damped when folding) in a single requestAnimationFrame loop. An invisible ghost button in normal flow reserves the trigger's layout space.",
  "Each face is measured with a `ResizeObserver` while it is current, so opening the access list or adding an error line just retargets the springs – the shape never needs hard-coded heights.",
  "Picking a person animates a clone of their avatar with the Web Animations API (`element.animate`) on a separate absolutely positioned layer, from the recent row to the new chip. The scrolling chips row would clip it otherwise; the chip's own avatar stays `opacity: 0` until the flight finishes.",
  "The count in the Send button rolls: the number is a `key`ed span, so React remounts it on every change and a CSS keyframe slides it in from below or above depending on whether the count went up or down (direction kept with the 'adjust state during render' pattern).",
  "At 520px or narrower the panel renders through a portal as a fixed bottom sheet: a backdrop, a slide-up keyframe, and a grabber that follows the finger with pointer capture, closing on a distance or velocity threshold.",
]

const PEOPLE: SharePerson[] = [
  { id: "mira", name: "Mira Okafor" },
  { id: "jonas", name: "Jonas Weber" },
  { id: "lena", name: "Lena Park" },
  { id: "dev", name: "Dev Anand" },
  { id: "sofia", name: "Sofia Reyes" },
]

const ACCESS: ShareAccessOption[] = [
  { value: "team", label: "Anyone at Northwind", description: "Can view and comment", icon: <Building2 /> },
  { value: "invited", label: "Only people invited", description: "Needs an invite to open", icon: <Lock /> },
  { value: "public", label: "Anyone with the link", description: "Can view, no sign-in", icon: <Globe /> },
]

const CHANNELS: ShareChannel[] = [
  { id: "email", label: "Email", doneLabel: "Sent", icon: <Mail /> },
  { id: "chat", label: "Chat", doneLabel: "Posted", icon: <MessageSquare /> },
  { id: "cal", label: "Invite", doneLabel: "Added", icon: <Calendar /> },
]

export default function Demo() {
  const [fails, setFails] = React.useState(false)
  const [align, setAlign] = React.useState<"start" | "center" | "end">("center")
  const failsRef = React.useRef(fails)
  failsRef.current = fails
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => window.setTimeout(() => (failsRef.current ? reject(new Error("offline")) : resolve()), ms))

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex min-h-[560px] w-full justify-center pt-24">
        <ShareSheet
          key={align}
          title="Q3 launch plan"
          link="https://northwind.example/d/q3-launch-plan"
          people={PEOPLE}
          access={ACCESS}
          channels={CHANNELS}
          align={align}
          onSend={() => wait(900)}
          onChannel={() => wait(800)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-[13px]">
        <Seg label="Result" value={fails ? "fails" : "works"} options={[["works", "Send works"], ["fails", "Send fails"]]} onChange={(v) => setFails(v === "fails")} />
        <Seg label="Align" value={align} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} onChange={(v) => setAlign(v as typeof align)} />
      </div>
    </div>
  )
}

function Seg({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={"rounded-full px-3 py-1 " + (value === v ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-500")}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
