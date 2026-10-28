import * as React from "react"

import { ArrowRightIcon, ArrowUpIcon, Button, CheckIcon, CopyIcon, MoreIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/ui/button"

export const notes: string[] = [
  "Variants are `data-variant` attributes styled with CSS custom properties (`--btn-primary-bg`, `--btn-shadow`…), so light and dark mode only swap token values – the rules themselves never change.",
  "The width glide: the label row is wrapped in an inner span that a ResizeObserver measures (`borderBoxSize`, which ignores the 97% press scale). That number becomes the button's inline `width`, and a CSS `transition: width` animates between the two pixel values – CSS can't transition to `auto`.",
  "Text and icons swap by giving them a React `key`. A new key remounts the element, which restarts its `animation` (blur 3px + translateY → none). A tiny `useSwapped` flag keeps the very first render from animating.",
  "The loading shimmer is a pseudo-element that repeats the label via `content: attr(data-text)`, paints a moving gradient with `background-clip: text` and slides `background-position` forever – only the glint is drawn, on top of the dimmed label.",
  "Loading keeps the button focusable and sets `aria-busy` instead of `disabled`, and the click handler just returns early – so keyboard users don't lose their place when a request starts.",
]

function useTimer() {
  const id = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(id.current), [])
  return (fn: () => void, ms: number) => {
    window.clearTimeout(id.current)
    id.current = window.setTimeout(fn, ms)
  }
}

const row = "flex flex-wrap items-center justify-center gap-3"
const caption = "mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-neutral-400"

export default function Demo() {
  const later = useTimer()
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [upload, setUpload] = React.useState<"idle" | "loading" | "done">("idle")

  const save = () => {
    setSaving(true)
    later(() => setSaving(false), 2200)
  }
  const copy = () => {
    setCopied(true)
    later(() => setCopied(false), 1600)
  }
  const send = () => {
    setUpload("loading")
    later(() => {
      setUpload("done")
      later(() => setUpload("idle"), 1600)
    }, 1800)
  }

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-8">
      <div>
        <p className={caption}>Variants</p>
        <div className={row}>
          <Button onClick={save} loading={saving}>
            {saving ? "Saving…" : "Save prompt"}
          </Button>
          <Button variant="secondary">Run eval</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive" icon={<TrashIcon />}>
            Delete agent
          </Button>
        </div>
      </div>

      <div>
        <p className={caption}>Sizes and icons</p>
        <div className={row}>
          <Button variant="secondary" size="sm" icon={<PlusIcon />}>
            Add tool
          </Button>
          <Button iconRight={<ArrowRightIcon />}>Continue</Button>
          <Button variant="secondary" size="lg">
            Large
          </Button>
          <Button variant="ghost" aria-label="More options" icon={<MoreIcon />} />
          <Button size="sm" aria-label="Send message" icon={<ArrowUpIcon />} />
        </div>
      </div>

      <div>
        <p className={caption}>Feedback and states</p>
        <div className={row}>
          <Button variant="secondary" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={copy}>
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button
            variant="secondary"
            icon={upload === "done" ? <CheckIcon /> : <UploadIcon />}
            loading={upload === "loading"}
            onClick={send}
          >
            {upload === "loading" ? "Uploading…" : upload === "done" ? "Uploaded" : "Upload file"}
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </div>
    </div>
  )
}
