import { CommentThread, type ThreadAuthor, type ThreadMessage } from "@/components/ui/comment-thread"

const orbit: ThreadAuthor = { name: "Orbit", assistant: true }
const me: ThreadAuthor = { name: "Maya Okafor" }

const MESSAGES: ThreadMessage[] = [
  {
    id: "1",
    author: { name: "Daniel Ruiz" },
    createdAt: "12min ago",
    text: "/summarize Turn the October interview notes into five findings for the roadmap doc.",
  },
  {
    id: "2",
    author: orbit,
    createdAt: "9min ago",
    text: "",
    status: {
      label: "Summary completed",
      details: ["Grouped 14 interviews into 5 themes", "Flagged 2 quotes that need participant consent", "Left the pricing section as it was"],
    },
  },
]

// A fake backend: it answers after a moment, so the thinking line shows.
function answer(text: string): Promise<ThreadMessage> {
  return new Promise((resolve) =>
    window.setTimeout(
      () =>
        resolve({
          id: `orbit-${Math.random().toString(36).slice(2, 7)}`,
          author: orbit,
          createdAt: "just now",
          text: /consent/i.test(text) ? "Both quotes are marked in yellow in the doc. I did not send any invitations." : "Done – I added a note under the first finding.",
          status: { label: "Reply posted" },
        }),
      1500
    )
  )
}

export const notes = [
  "onReply decides the whole flow: return nothing and the reply is just posted, return a promise and the thread shows Orbit's thinking line until it settles. The component only tracks a thinking boolean; it never knows how the answer is produced.",
  "The details fold open by transitioning grid-template-rows from 0fr to 1fr on the wrapper (CSS cannot animate to height: auto), and the bullets stagger in through a --i custom property used in transition-delay: calc(60ms + var(--i) * 60ms).",
  "The list's height follows its content: a ResizeObserver reads the list height and sets it as an inline pixel height on a wrapper that has transition: height, so new messages grow the card smoothly instead of jumping.",
  "The thinking text shimmers with a copy of itself (::after with content: attr(data-text)) painted by a moving linear-gradient and background-clip: text, so only the letters catch the light.",
  "Folded details carry the inert attribute, so their lines cannot be tabbed to while closed; the status line is a real button with aria-expanded.",
]

export default function Demo() {
  return (
    <div className="w-full max-w-[420px]">
      <CommentThread messages={MESSAGES} currentUser={me} assistant={orbit} onReply={(text) => (text.includes("@Orbit") ? answer(text) : undefined)} onClose={() => {}} />
    </div>
  )
}
