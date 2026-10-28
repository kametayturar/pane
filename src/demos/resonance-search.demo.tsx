import * as React from "react"

import { ResonanceSearch, type ResonanceItem } from "@/components/ui/resonance-search"

export const notes = [
  "Each result carries one SVG path that is a real standing wave: y = A · sin(nπx) · cos(ωt), pinned to zero at both ends. A is the relevance in pixels, n is the mode (a strong match rings in its fundamental, a single arch; a weak one in a busier higher harmonic) and a gentle taper keeps the ends fixed even while n eases between whole numbers. Two quiet overtones and a lagging trail are drawn from the same function, and the colour runs from ink to accent with the score.",
  "One requestAnimationFrame loop for the whole list writes every path's d attribute straight to the DOM, so typing never re-renders React per frame. A keystroke 'strikes' the strings: a ringing factor e rises in about 40 ms and decays as exp(-t/340ms), amplitude is boosted by up to 1.6x while it rings, and the shape is (1 - e) · still + e · oscillating, so the strings settle into their frozen shape with no jump. The loop stops itself when nothing moves and when the card is off screen or the tab is hidden.",
  "Rows reorder with FLIP: after React puts them in rank order, a layout effect compares each li's offsetTop with the last one and plays a Web Animations translateY from the old spot to 0 (new rows blur in the same way, from JS, because a CSS animation would restart whenever React moves a node). The code keeps the start time and evaluates the same cubic-bezier, so a keystroke that arrives mid-reorder starts from where the row visibly is. The tray height is rows x row height, a CSS transition, so the footer rides up and down with the result count.",
  "The lifted tile behind the active row is not measured at all: rows have a fixed height, so it is translateY(calc(var(--irz-i) * var(--irz-rh))) and a CSS transition glides it. Keyboard focus never leaves the input; the highlighted row is announced with aria-activedescendant on a combobox over a listbox. Enter plays the lock-in: the chosen string snaps to one full arch, a last ring runs through it, the tile pulses and the other strings go flat.",
  "Relevance here comes from a small stand-in scorer (stemmed words, whole tag phrases and title hits worth most, then tags, then snippet words; articles that share words with the leader get a graded share of its score and the ladder is strictly descending). Pass `scores` (id to 0-1, from a vector search) or `score`, kept referentially stable, to drive it with real embeddings. Props: items, defaultQuery, limit, openLabel, onOpen. Reduced motion skips the typist, the ringing and the FLIP and shows the settled strings.",
]

const RUNBOOKS: ResonanceItem[] = [
  {
    id: "cert",
    title: "Rotate an expiring TLS certificate",
    source: "Platform",
    snippet: "Issue the new certificate, stage it on one edge node, check the chain, then promote it. Old certificates stay valid for 24 hours.",
    tags: ["ssl", "https", "renew", "expiry", "expires", "chain"],
  },
  {
    id: "queue",
    title: "Drain a stuck job queue",
    source: "Workers",
    snippet: "Pause producers, move dead letters to the holding queue, restart the workers one pool at a time and replay.",
    tags: ["backlog", "stalled", "jobs", "retry", "dead letter"],
  },
  {
    id: "failover",
    title: "Fail over the primary database",
    source: "Data",
    snippet: "Promote the replica with the least lag, repoint the connection string and confirm writes before telling support.",
    tags: ["postgres", "replica", "outage", "promote", "switchover"],
  },
  {
    id: "pager",
    title: "Hand over the pager",
    source: "On call",
    snippet: "Write the open incidents, the flaky alerts and the one thing you are watching into the handover note.",
    tags: ["rotation", "shift", "handoff", "escalation"],
  },
  {
    id: "keys",
    title: "Rotate a leaked API key",
    source: "Security",
    snippet: "Revoke the key, issue a replacement, deploy it to the three services that read it and search the logs for use.",
    tags: ["secret", "token", "credential", "compromised", "revoke"],
  },
]

type Scene = "help" | "runbooks"

export default function Demo() {
  const [scene, setScene] = React.useState<Scene>("help")
  const [run, setRun] = React.useState(0)
  const [opened, setOpened] = React.useState<string | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Scene" className="inline-flex rounded-lg bg-neutral-100 p-0.5 dark:bg-white/10">
          {(
            [
              ["help", "Help center"],
              ["runbooks", "Your own data"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={scene === id}
              onClick={() => {
                setScene(id)
                setOpened(null)
                setRun((r) => r + 1)
              }}
              className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                scene === id
                  ? "bg-white text-neutral-900 shadow-[0_0_0_.5px_rgb(0_0_0/.08),0_1px_2px_rgb(0_0_0/.06)] dark:bg-neutral-700 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpened(null)
            setRun((r) => r + 1)
          }}
          className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
        >
          Replay
        </button>
      </div>

      {scene === "help" ? (
        <ResonanceSearch key={`help-${run}`} />
      ) : (
        <ResonanceSearch
          key={`books-${run}`}
          items={RUNBOOKS}
          defaultQuery="rotate the leaked key and certificate"
          limit={4}
          title="Search runbooks"
          context="Meridian Labs on call"
          placeholder="What is broken?"
          openLabel={(item) => `Open “${item.title}” and page Sage with it`}
          openedLabel="Opened"
          onOpen={(item) => setOpened(item.title)}
        />
      )}

      <p className="text-center text-[12.5px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {scene === "runbooks" && opened ? (
          <>
            Opened <span className="font-medium text-neutral-700 dark:text-neutral-200">{opened}</span>
          </>
        ) : scene === "help" ? (
          "Taller string, better match. The best answer rings as one clean arch."
        ) : (
          "Your runbooks, ranked live. Press Enter to open one and page Sage."
        )}
      </p>
    </div>
  )
}
