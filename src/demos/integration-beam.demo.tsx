import { Calendar, Database, FileText, Mail, MessageSquare, Ticket } from "lucide-react"

import { IntegrationBeam } from "@/components/illustrations/integration-beam"
import type { StudioProps } from "@/components/motion/backdrop"

const ic = { size: 28, strokeWidth: 1.8 } as const
const LEFT = [
  { name: "Mail", icon: <Mail {...ic} />, color: "#ef5a3c" },
  { name: "Chat", icon: <MessageSquare {...ic} />, color: "#22a45d" },
  { name: "Docs", icon: <FileText {...ic} />, color: "#2f8ae6" },
]
const RIGHT = [
  { name: "Tickets", icon: <Ticket {...ic} />, color: "#e8a317" },
  { name: "Calendar", icon: <Calendar {...ic} />, color: "#8b5cf6" },
  { name: "Warehouse", icon: <Database {...ic} />, color: "#14a8a0" },
]

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <IntegrationBeam {...props} center={{ name: "Nova" }} left={LEFT} right={RIGHT} />
    </div>
  )
}

export const notes = [
  "The pulses are SVG paths drawn with stroke-dasharray (one 84-unit dash) and moved by animating stroke-dashoffset. Every frame a requestAnimationFrame clock sets the offset, so speed and pause are only 'how fast does the clock tick' and 'does it tick'.",
  "A dash can't carry a gradient that follows it, so each frame the tail and head of the dash are looked up with path.getPointAtLength() and written into a userSpaceOnUse <linearGradient> (clear tail, accent body, pale tip). A blurred copy of the same dash underneath is the glow.",
  "The beams are cubic Béziers whose control points sit halfway across, so they leave the tool horizontally and arrive at the hub horizontally; every tool tile is a real <button> with aria-pressed, hover or focus raises its beam and shows a tooltip, and a polite live region announces 'N of 6 connected'.",
  "The status chip glides to the width of its text: a hidden twin of the label is measured (offsetWidth) in a layout effect, converted to stage units and written to a CSS variable; CSS transitions width between the two pixel values because CSS can't transition to auto.",
  "The scene is drawn on a 620-unit stage; every length is calc(N * var(--u)) with --u = 100cqw / 620 (container query units), so it scales with its container without a ResizeObserver. An IntersectionObserver stops the loop while it is off screen.",
]
