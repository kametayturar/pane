import { LandingSteps } from "@/components/blocks/landing-steps"

export const notes = [
  "The story is a small scheduler, not an animation library: an IntersectionObserver on the step row starts it once, then a chain of timeouts moves one step at a time to `play` and back to `done` after that step's length. Each mock reads its phase from `data-phase`, so all motion is CSS keyframes with `backwards` fill whose end frame is the element's natural style. If the timers never run, the finished frame is what you see.",
  "Three phases per mock: `idle` is the start frame (empty inbox, skeleton bars, For review), `play` attaches the keyframes with per-row delays from CSS variables, `done` removes them. Replaying is just switching back to `play`, which restarts every animation from its first frame.",
  "The progress line is one 1px segment per step under the stages. In a row, each segment reaches across the gap with a negative margin, so together they read as one line. The playing segment scales from 0 to 1 over that step's exact length; finished ones stay full.",
  "While a step plays, the other steps' text drops to 38% opacity; when the story ends every step is full strength again. Reduced motion skips the story entirely and shows every mock finished, the line full and all text at full strength.",
  "Layout follows the section's own width with container queries: one column, then two (for two or four steps) from 600px, three from 760px, four from 1000px. Every word, including the text inside the mocks, comes from plain props so the section saves as JSON.",
]

export default function Demo() {
  return (
    <div className="w-full space-y-16">
      <LandingSteps />
      <LandingSteps
        title="Answered once."
        titleMuted="Written up for good."
        note="Quill turns the tickets your team resolves into help-centre articles, and keeps a record of who changed what."
        link={{ label: "Read how articles are written", href: "#" }}
        replayOnHover
        steps={[
          { title: "Tickets are resolved", body: "Atlas and your team close the week's tickets. Quill groups the ones that asked the same thing." },
          { title: "Quill drafts the article", body: "The steps, the policy and the wording customers used are pulled in and checked, row by row." },
          { title: "A person reviews it", body: "Nothing goes live until someone on the team has read the draft and approved it." },
          { title: "It is on the record", body: "Every edit is logged with a time and a name, so you can see why a page says what it says." },
        ]}
        story={{
          inbox: {
            title: "Resolved",
            meta: "This week",
            from: "Atlas",
            subject: "12 tickets about late orders",
            file: "late-orders.csv",
            size: "18 KB",
            time: "16:20",
            earlierFrom: "Sage",
            earlierSubject: "Daily digest",
            earlierTime: "Tue",
          },
          work: {
            title: "Draft article",
            working: "Writing",
            done: "4 parts",
            rows: [
              { label: "Title", value: "Tracking a late order" },
              { label: "Section", value: "Shipping" },
              { label: "Sources", value: "12 tickets" },
              { label: "Reading time", value: "2 min" },
            ],
          },
          approve: { title: "Draft article", pending: "For review", approved: "Published", action: "Publish", note: "Published by Sam at 16:31" },
          log: {
            title: "Activity",
            meta: "Today",
            items: [
              { label: "Drafted by Quill", time: "16:22" },
              { label: "Edited by Sam", time: "16:29" },
              { label: "Published by Sam", time: "16:31" },
            ],
          },
        }}
      />
    </div>
  )
}
