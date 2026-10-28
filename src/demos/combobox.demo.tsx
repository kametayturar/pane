import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

export const notes = [
  "It follows the ARIA combobox pattern: DOM focus never leaves the <input>; the highlighted row is announced through aria-activedescendant, the list is a role=listbox with role=option rows, and clicks on rows call preventDefault on mousedown so the input keeps focus.",
  "The grey highlight is a single absolutely positioned span. A layout effect reads the active row's offsetTop and writes a translateY and height onto it, and CSS transitions those over 90ms, so it glides between rows instead of each row flashing.",
  "The popover and the field animate their height by measuring their content with a ResizeObserver and transitioning between two pixel values, because CSS can't transition to height: auto. That is what lets the list glide while you filter and the field grow as chips wrap.",
  "Matches are highlighted by splitting the label at the first case-insensitive match and wrapping that slice in <mark>. Chips removed from the field stay rendered for a moment as aria-hidden 'ghosts' so they can fold away with a grid-template-columns 1fr → 0fr transition.",
  "Backspace in an empty field is a two-step delete: the first press only sets a highlight flag on the last chip, the second removes it, so a stray key never wipes a value by accident.",
]

const PEOPLE: ComboboxOption[] = [
  { value: "maya", label: "Maya Chen", hint: "Prompt engineer", avatar: true, group: "Evaluation" },
  { value: "jonas", label: "Jonas Weber", hint: "Eval lead", avatar: true, group: "Evaluation" },
  { value: "priya", label: "Priya Raman", hint: "Red team", avatar: true, group: "Evaluation" },
  { value: "sara", label: "Sara Okafor", hint: "Staff engineer", avatar: true, group: "Platform" },
  { value: "leo", label: "Leo Martins", hint: "Inference", avatar: true, group: "Platform" },
  { value: "nina", label: "Nina Petrova", hint: "Data", avatar: true, group: "Platform" },
  { value: "tom", label: "Tom Becker", hint: "Retrieval", avatar: true, group: "Platform" },
  { value: "elif", label: "Elif Yilmaz", hint: "Head of product", avatar: true, group: "Product" },
  { value: "daniel", label: "Daniel Kim", hint: "Product manager", avatar: true, group: "Product" },
  { value: "lucas", label: "Lucas Moreau", hint: "Analyst", avatar: true, group: "Product" },
]

const LABELS: ComboboxOption[] = [
  { value: "regression", label: "Regression", color: "#e5484d" },
  { value: "hallucination", label: "Hallucination", color: "#f5a524" },
  { value: "latency", label: "Latency", color: "#0060e2" },
  { value: "tone", label: "Tone", color: "#8e4ec6" },
  { value: "safety", label: "Safety", color: "#30a46c" },
]

const MODELS: ComboboxOption[] = [
  { value: "haiku", label: "Haiku", hint: "Fastest, cheapest", keywords: ["small"] },
  { value: "sonnet", label: "Sonnet", hint: "Balanced", keywords: ["default"] },
  { value: "opus", label: "Opus", hint: "Hardest problems", keywords: ["large"] },
  { value: "local", label: "Local model", hint: "Runs on your machine" },
]

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{children}</p>
}

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full max-w-[420px] flex-col gap-7">
      <Combobox label="Reviewers" placeholder="Add reviewers…" options={PEOPLE} defaultValue={["maya"]} />

      <div>
        <Heading>Labels with color dots, new ones on the fly</Heading>
        <Combobox
          options={LABELS}
          creatable
          maxVisibleTags={2}
          placeholder="Add labels…"
          createLabel={(t) => `Create label “${t}”`}
          onCreate={(text) => ({ value: text.toLowerCase(), label: text, color: "#6e6e73" })}
          defaultValue={["regression", "latency"]}
        />
      </div>

      <div>
        <Heading>Single choice</Heading>
        <Combobox multiple={false} options={MODELS} defaultValue={[]} placeholder="Pick a model…" />
      </div>
    </div>
  )
}
