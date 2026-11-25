import { LandingFaq } from "@/components/blocks/landing-faq"

export const notes = [
  "Each question is a `button` inside a heading, with `aria-expanded` and `aria-controls` pointing at a `role=\"region\"` labelled by that button. Closed answers carry `inert`, so their text and any links in them are skipped by Tab and by find-in-page focus.",
  "The answer opens with one eased height change: the region is a one-row grid whose row goes from `0fr` to `1fr`, and the content sits in a `min-height: 0; overflow: hidden` wrapper. No height is measured in JavaScript, so it works for any length of answer and any width.",
  "The plus becomes a minus by rotating its vertical stroke 90° about its own centre (`transform-box: fill-box`) until it lies on the horizontal one. Arrow Up and Down move focus between questions (wrapping), Home and End jump to the ends; Enter and Space toggle.",
  "`multiple` decides whether answers stay open together; without it, opening one closes the rest. Answers are plain strings, and a blank line starts a new paragraph, so the builder can save the whole section as JSON.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <LandingFaq />
      <LandingFaq
        title="Before you invite"
        titleMuted="your whole team."
        note="Short answers to what admins ask most."
        link={null}
        multiple
        defaultOpen={[0, 2]}
        items={[
          {
            question: "Who decides where a ticket goes?",
            answer:
              "Sage suggests a queue and an owner for each request, using the rules you set.\n\nA lead can change the rules at any time, and every routing decision is listed with the reason Sage made it.",
          },
          {
            question: "What happens to drafts when someone leaves?",
            answer: "They stay in the workspace and move to whoever takes over that inbox. Nothing is tied to a personal account.",
          },
          {
            question: "Is there a limit on seats?",
            answer: "Team covers up to ten seats. Above that, Scale has no seat limit and lets you group people by brand.",
          },
          {
            question: "Can we keep our data in the EU?",
            answer: "Yes. Choose the EU region when you create the workspace, and tickets, drafts and logs stay there.",
          },
        ]}
      />
    </div>
  )
}
