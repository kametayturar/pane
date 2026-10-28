import { EmailDraft } from "@/components/ui/email-draft"

export const notes = [
  "The card's middle section animates its height with a ResizeObserver: it measures the inner content, writes that as an inline pixel height, and a CSS transition on height glides between the two numbers. Only that section moves; the header and the footer row stay in place.",
  "The text is derived, not copied: the shown text is edited ?? tone.body(contact). Picking a tone clears edited, switching recipient re-renders the tone for the new person, and typing sets edited so no tone looks selected. No effect has to keep two copies of the text in sync.",
  "The paragraph and the textarea share the same box (negative margin and matching padding), so swapping them in place doesn't shift the layout; the textarea grows by resetting its height to auto and then setting it to scrollHeight in a layout effect.",
  "The recipient menu is a real listbox: aria-haspopup, options with aria-selected, arrow-key movement, Escape to close and return focus, and a document pointerdown listener that closes it on an outside click and is removed on cleanup.",
  "Sending is a small phase machine (draft, sending, sent or discarded). onSend may return a promise; Promise.all waits for both it and a minimum spinner time. A run counter makes a late result from an undone send harmless. The narrow layout hides the email and the hint with a container query (@container), which reacts to the card's width, not the window's.",
]

export default function Demo() {
  return (
    <div className="w-full max-w-[480px]">
      <EmailDraft
        reference="INV-2047"
        account="Halcyon Robotics"
        amount="$2,400"
        status="Overdue 3 days"
        agent="Billing agent"
        contacts={[
          { name: "Priya Nair", email: "priya@halcyon.io" },
          { name: "Tom Becker", email: "tom@halcyon.io" },
          { name: "Finance team", email: "finance@halcyon.io" },
        ]}
        attachment="Invoice-2047.pdf"
        link={{ label: "View invoice", href: "#invoice-2047" }}
        onSend={(email) => new Promise((resolve) => window.setTimeout(() => resolve(email), 300))}
      />
    </div>
  )
}
