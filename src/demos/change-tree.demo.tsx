import * as React from "react"

import { ChangeTree, CHANGE_TREE_SAMPLE, type ChangeTreeFile } from "@/components/ui/change-tree"

/** How many hunks each file's diff has, as a product would know from the diff itself. */
const HUNKS: Record<string, number> = {
  "src/api/users.ts": 3,
  "src/api/cache.ts": 2,
  "src/api/client.ts": 1,
  "src/api/types.ts": 2,
  "src/hooks/use-user.ts": 2,
  "src/hooks/use-retry.ts": 1,
  "src/components/profile/profile-card.tsx": 2,
  "src/components/profile/profile-settings-panel.tsx": 1,
  "tests/api/users.test.ts": 4,
}

const line = (f: ChangeTreeFile) => {
  const n = HUNKS[f.path] ?? 1
  return `${f.path}: ${n} ${n === 1 ? "hunk" : "hunks"} to review`
}

export default function Demo() {
  const first = CHANGE_TREE_SAMPLE[0]
  const [note, setNote] = React.useState(line(first))

  return (
    <div className="mx-auto flex w-full flex-col items-start gap-3" style={{ maxWidth: 420 }}>
      <ChangeTree agent="Atlas" caption="Cache user lookups" files={CHANGE_TREE_SAMPLE} defaultSelected={first.path} onSelect={(f) => setNote(line(f))} />
      <p aria-live="polite" className="px-1 text-[12.5px] text-neutral-700 tabular-nums dark:text-neutral-300">
        {note}
      </p>
    </div>
  )
}

export const notes = [
  "The piece takes a flat list of changed files and builds the tree itself: it splits each path into folders, adds every file's lines into each folder on the way up, then folds any folder that holds only one folder into it, so `tests` + `api` becomes one line, `tests/api/`. Folders sort first, then files by size of change (added + removed) or by name with numeric collation.",
  "Every row is the same strip of fixed columns: name, a word for anything that is not a plain edit, `+added −removed` in tabular figures, and a 40px bar scaled to the largest file. Additions are a solid ink segment, removals a 45° hatch from a repeating gradient in the same ink, so the shape of the change reads in Mono and without colour. A long name truncates in the middle: it is split into a head that shrinks with an ellipsis and a tail (the end of the name and its extension) that never shrinks.",
  "Opening a folder is one eased height change: its children sit in a one-row grid whose track transitions between 0fr and 1fr, inside an overflow-hidden clip that is `inert` and hidden while closed. A closed folder fades in the sum of its files and their count in the same columns its files used.",
  "It is a real `role=\"tree\"` with a roving tabindex: only one item is a tab stop, arrows move through the visible items, Right and Left open, close and climb, Home and End jump, typed letters within half a second form a prefix to jump to, and Enter or Space selects a file. When a folder is closed around the focused item, the tab stop moves to that folder. Selection is uncontrolled by default and calls `onSelect`; here the line under the card reads the selected file's hunk count.",
]
