import { BeadStepper, type BeadStep } from "@/components/ui/bead-stepper"

const INTAKE: BeadStep[] = [
  { id: "read", label: "Read 214 referral PDFs", meta: "Sage, 38 s" },
  { id: "match", label: "Match patients to records", meta: "Sage, 1 min" },
  { id: "consent", label: "Confirm consent forms", meta: "You, 08:09" },
  { id: "draft", label: "Draft 31 appointment letters", meta: "Quill, 2 min" },
  { id: "approve", label: "Approve the outbound letters", blocked: "Needs your approval", unblock: "Approve 31 letters", meta: "You, 08:14" },
  { id: "queue", label: "Queue letters for print", meta: "Sage, 08:15" },
  { id: "notify", label: "Tell reception what goes out", meta: "Quill, 08:16" },
]

export default function Demo() {
  return (
    <div className="grid w-full max-w-[1120px] grid-cols-1 items-stretch justify-items-center gap-6 md:grid-cols-2">
      <BeadStepper className="h-full" />
      <BeadStepper
        className="h-full"
        title="Referral intake run"
        subtitle="Northwind Clinics"
        agent="Sage"
        steps={INTAKE}
        defaultCompleted={3}
        interval={1900}
        consequence="Mails 31 letters to patients on Monday at 08:00"
        doneConsequence="31 letters queued, mail goes out Monday at 08:00"
      />
    </div>
  )
}

export const notes = [
  "Every bead position is a CSS `calc()` on the rod's own width: finished beads sit at `var(--i) * var(--ibs-pitch)` from the left, waiting beads at `100% - bead - var(--k) * pitch` from the right. The bead only changes its `data-s` attribute, and `transition: left` does the slide. Positions are never computed in JavaScript.",
  "The amber bead stops half-way across the gap with the same `calc()` and a factor of .5, and a pill on the rod says why (\"Needs your signature\"). Pushing it plays a short `translate` shake, and a ring around the pill and the button gives the same message without motion.",
  "The small click is two keyframes started 380ms after the slide begins, once the bead reaches its neighbour: a squash with the individual `scale` property and a ring that grows and fades. They use `scale` and `translate` instead of `transform`, so they never fight the slide or the drag.",
  "At the end the beads turn green one after another because each bead's `transition-delay` is `var(--i) * 60ms`; `background-color` can transition while the highlight gradients stay put on top of it. The same `calc()` re-centres the packed beads, and a glint gradient sweeps through them with `animation-delay` per bead.",
  "Dragging writes `--dx` straight to the bead's style from pointer events (no React render per move), using `setPointerCapture`; JS only measures the rod once, at drag start, to know how far the bead can go. The keyboard does the same job with a roving tabindex: arrows walk, Enter pushes, Backspace slides the last bead back, and focus follows the bead after every action.",
  "The rod is only a picture of the list. The beads carry an `aria-label` with the step and its state in words, a polite live region announces changes, and the full `<ol>` sits behind an \"All steps\" disclosure that opens by animating `grid-template-rows` from `0fr` to `1fr`.",
]
