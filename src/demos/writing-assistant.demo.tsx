import * as React from "react"

import { WritingAssistant, type WritingAssistantSpeech } from "@/components/ui/writing-assistant"

const SUGGESTIONS = ["Polish my cover letter", "Shorten this email", "Sound less formal", "Draft a thank-you"]

const REPLIES: { match: RegExp; reply: string }[] = [
  {
    match: /cover|polish/i,
    reply:
      "Here's a sharper opening for your cover letter:\n\nI've spent four years turning messy support data into decisions that teams actually act on. Your analytics role is the first one where I'd get to do that from the first customer call to the final dashboard.\n\nI led with your strongest result and dropped the \"I am writing to apply\" line.",
  },
  {
    match: /short|email|trim/i,
    reply:
      "Shorter version:\n\nHi Priya, the Q3 numbers are in the shared sheet. Two things need your call by Friday: the vendor renewal and the new hire budget. Everything else can wait.\n\nThat's 31 words instead of 74, with the deadline up front.",
  },
  {
    match: /formal|casual|friend/i,
    reply:
      "A looser take:\n\nHey team, quick heads-up: the launch moves to next Tuesday so QA has room to breathe. Nothing changes on your end unless you hear from me.\n\nI swapped \"please be advised\" for plain talk and kept the one date that matters.",
  },
  {
    match: /thank|note|update|project/i,
    reply:
      "Here's a short draft:\n\nThanks for your time on Thursday, Marcus. Your feedback on the onboarding flow changed how we're approaching the first screen. I'll send a prototype by the end of next week.\n\nWant a version that mentions the budget question too?",
  },
]

const FALLBACK =
  "Happy to help. Paste the text you want reworked and tell me who will read it, and I'll draft a version in a tone that fits.\n\nI can also keep your phrasing and only fix what's clumsy."

function respond(message: string) {
  const reply = REPLIES.find((r) => r.match.test(message))?.reply ?? FALLBACK
  return new Promise<string>((resolve) => window.setTimeout(() => resolve(reply), 1200))
}

export default function Demo() {
  const [speech, setSpeech] = React.useState<WritingAssistantSpeech>("auto")

  return (
    <div className="flex flex-col items-center gap-5">
      <WritingAssistant
        name="Margin"
        tagline="Edits that keep your voice."
        greeting="What needs a better draft?"
        suggestions={SUGGESTIONS}
        placeholder="Ask anything…"
        respond={respond}
        speech={speech}
        dictation="Turn these notes into a short project update."
      />

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>Voice</span>
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
          {(["auto", "simulate"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={speech === mode}
              onClick={() => setSpeech(mode)}
              className={
                "rounded px-2 py-0.5 font-medium transition-colors " +
                (speech === mode
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "hover:text-neutral-900 dark:hover:text-neutral-100")
              }
            >
              {mode === "auto" ? "Microphone" : "Simulated"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
