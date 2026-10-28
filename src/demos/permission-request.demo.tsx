import * as React from "react"

import { PermissionRequest, type PermissionDecision } from "@/components/ui/permission-request"

const MAIL = (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path d="M2.5 4.5h11v7h-11v-7ZM2.8 4.8 8 8.6l5.2-3.8" />
  </svg>
)
const SERVER = (
  <svg viewBox="0 0 16 16" aria-hidden>
    <rect x="2.5" y="3" width="11" height="4" rx="1.2" />
    <rect x="2.5" y="9" width="11" height="4" rx="1.2" />
    <path d="M5 5h.01M5 11h.01" />
  </svg>
)

const describe = (d: PermissionDecision | null) =>
  d === null ? "waiting (null)" : `{ allow: ${d.allow}, scope: "${d.scope}"${d.until ? ", until: …" : ""} }`

export default function Demo() {
  const [log, setLog] = React.useState("onDecisionChange → nothing yet")

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-8">
      <PermissionRequest
        agent={{ name: "Courier", model: "Orbit 2" }}
        action="send the weekly digest"
        target="Postmark · production"
        toolIcon={MAIL}
        reason="The digest was approved on Friday and goes out every Monday at 9:00."
        previewLimit={2}
        preview={[
          { id: "1", label: "ops@northwind.example", meta: "Digest" },
          { id: "2", label: "finance@northwind.example", meta: "Digest" },
          { id: "3", label: "founders@northwind.example", meta: "Digest + KPIs" },
          { id: "4", label: "+ 41 subscribers", meta: "Digest" },
        ]}
        onDecisionChange={(d) => setLog(`onDecisionChange → ${describe(d)}`)}
      />

      {/* Destructive: Allow turns red and "Always" is never offered */}
      <PermissionRequest
        agent={{ name: "Janitor" }}
        action="delete 3 stale environments"
        target="Fly.io · northwind-prod"
        toolIcon={SERVER}
        risk="destructive"
        reason="They have had no traffic for 60 days and cost about €84 a month."
        preview={[
          { id: "a", label: "preview-pr-214", meta: "2.1 GB" },
          { id: "b", label: "preview-pr-231", meta: "1.8 GB" },
          { id: "c", label: "staging-eu-old", meta: "6.4 GB" },
        ]}
        onDecisionChange={(d) => setLog(`onDecisionChange → ${describe(d)}`)}
      />

      {/* Only short grants, safe risk, no tag */}
      <PermissionRequest
        agent={{ name: "Notetaker" }}
        action="read your calendar"
        target="Google Calendar"
        risk="safe"
        scopes={["once", "timed"]}
        duration={30}
        reason="To find a free slot for the demo call you asked for."
        onDecisionChange={(d) => setLog(`onDecisionChange → ${describe(d)}`)}
      />

      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {log} · ←/→ picks how long, Enter allows, Esc denies
      </p>
    </div>
  )
}

export const notes = [
  "The 'how long' control is a real `role=\"radiogroup\"` with roving `tabIndex`. The white thumb is one absolutely positioned element moved with `transform: translateX(calc(var(--i) * 100%))`, where `--i` and `--n` are CSS variables set from React, so the slide is a plain CSS transition.",
  "Preview rows rise one after another with a per-row `animation-delay` (`90ms + index × 70ms`) on a single `@keyframes` – staggering needs no JS timers.",
  "A timed grant stores `until` as an absolute timestamp, not a countdown. The component only derives the time left from a clock (`now` prop or a 1-second tick), so the decision survives reloads and the server can check `Date.now() < until` itself.",
  "The thin drain bar is a `transform: scaleX(var(--f))` with `transition: transform 1s linear`; updating `--f` once a second makes the bar slide continuously instead of jumping.",
  "Destructive requests filter `always` out of `scopes` before rendering, so a rule that matters (never grant forever for destructive actions) is enforced in the component rather than left to the caller.",
]
