import * as React from "react"
import { Globe, Code2, FileText, Mail } from "lucide-react"

import {
  Field,
  FormSection,
  RulerSlider,
  SaveBar,
  Segmented,
  Select,
  Stepper,
  TextArea,
  TextInput,
  Toggle,
  type SelectOption,
} from "@/components/ui/instrument-form"

type Autonomy = "ask-always" | "ask-risky" | "autonomous"
type Settings = {
  name: string
  prompt: string
  model: string
  temperature: number
  maxSteps: number
  autonomy: Autonomy
  web: boolean
  code: boolean
  files: boolean
  email: boolean
  budget: number
}

const SAVED: Settings = {
  name: "Atlas",
  prompt:
    "You are Atlas, the research agent for the Harbor & Finch analytics team. Cite a source for every number. When two sources disagree, show both and say which you trust more.",
  model: "atlas",
  temperature: 0.7,
  maxSteps: 12,
  autonomy: "ask-risky",
  web: true,
  code: true,
  files: true,
  email: false,
  budget: 20,
}

const LABELS: Record<keyof Settings, string> = {
  name: "Name",
  prompt: "System prompt",
  model: "Model",
  temperature: "Temperature",
  maxSteps: "Max steps",
  autonomy: "Autonomy",
  web: "Web search",
  code: "Code interpreter",
  files: "File access",
  email: "Send email",
  budget: "Daily budget",
}

const MODELS: SelectOption[] = [
  { value: "nova", label: "Nova", description: "Fast and cheap. Good for triage.", meta: "128k" },
  { value: "atlas", label: "Atlas", description: "Balanced. The default for research.", meta: "200k" },
  { value: "sage", label: "Sage", description: "Slow, careful reasoning.", meta: "200k" },
  { value: "quill", label: "Quill", description: "Long-form writing and editing.", meta: "1M" },
]

const AUTONOMY = [
  { value: "ask-always", label: "Ask always" },
  { value: "ask-risky", label: "Ask for risky" },
  { value: "autonomous", label: "Autonomous" },
] as const

const AUTONOMY_HINT: Record<Autonomy, string> = {
  "ask-always": "Atlas pauses before every tool call and waits for you.",
  "ask-risky": "Atlas pauses before sending, deleting or spending. Reads and searches run freely.",
  autonomous: "Atlas runs to the end. You review the log afterwards.",
}

const usd = (n: number) => `$${n}`

export default function Demo() {
  const [saved, setSaved] = React.useState<Settings>(SAVED)
  const [s, setS] = React.useState<Settings>(SAVED)
  const [saving, setSaving] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  const set = <K extends keyof Settings>(key: K) => (v: Settings[K]) => setS((p) => ({ ...p, [key]: v }))
  const changed = (Object.keys(s) as (keyof Settings)[]).filter((k) => s[k] !== saved[k])
  const nameError = s.name.trim() ? undefined : "Give the agent a name."

  const save = () => {
    if (nameError) return
    setSaving(true)
    timer.current = setTimeout(() => {
      setSaved(s)
      setSaving(false)
    }, 700)
  }

  return (
    <div
      className="ifm"
      style={{ background: "var(--ifm-paper)", padding: "clamp(16px, 4vw, 40px)" }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <header style={{ paddingBottom: 28 }}>
          <span className="ifm-lab">AGT-0412 · Harbor &amp; Finch</span>
          <h1
            style={{
              margin: "6px 0 8px",
              font: "400 clamp(36px, 6vw, 54px)/1 var(--ifm-serif)",
              letterSpacing: "-.01em",
              color: "var(--ifm-ink)",
            }}
          >
            Agent <em>settings</em>
          </h1>
          <p style={{ margin: 0, maxWidth: "52ch", color: "var(--ifm-t2)" }}>
            How Atlas thinks, what it may touch and what it may spend. Changes apply to new runs; a run in progress keeps the settings it started with.
          </p>
        </header>

        <FormSection label="01 · Identity" title={<>Who <em>it is</em></>} description="The name shows in run logs and approvals. The prompt is sent first in every run.">
          <Field label="Name" error={nameError} hint="Shown to teammates. Up to 24 characters.">
            <TextInput value={s.name} maxLength={24} onChange={(e) => set("name")(e.target.value)} placeholder="Agent name" />
          </Field>
          <Field label="System prompt" hint="Plain text. Atlas reads it before anything else.">
            <TextArea
              value={s.prompt}
              minRows={4}
              maxRows={10}
              maxLength={1200}
              showCount
              onChange={(e) => set("prompt")(e.target.value)}
            />
          </Field>
        </FormSection>

        <FormSection label="02 · Model" title={<>How it <em>thinks</em></>} description="Pick the model, then how loose and how long it may run.">
          <Field label="Model">
            <Select options={MODELS} value={s.model} onChange={set("model")} />
          </Field>
          <Field label="Temperature" hint="Low is repeatable. High is varied. Research works best around 0.7.">
            <RulerSlider
              min={0}
              max={2}
              step={0.05}
              value={s.temperature}
              onChange={set("temperature")}
              format={(v) => v.toFixed(2)}
              marks={[{ value: 0.7, label: "default" }]}
              unit="temp"
            />
          </Field>
          <Field label="Max steps" unit="per run" hint="A step is one model turn or one tool call.">
            <Stepper value={s.maxSteps} min={1} max={50} onChange={set("maxSteps")} />
          </Field>
        </FormSection>

        <FormSection label="03 · Autonomy" title={<>How far it <em>goes</em></>} description="Decide when Atlas must stop and ask.">
          <Field label="Approval mode" hint={AUTONOMY_HINT[s.autonomy]}>
            <Segmented options={[...AUTONOMY]} value={s.autonomy} onChange={set("autonomy")} fullWidth />
          </Field>
        </FormSection>

        <FormSection label="04 · Tools" title={<>What it <em>can use</em></>} description="Each tool is off until you switch it on.">
          <div>
            <Toggle layout="row" showState label={<IconLabel icon={<Globe size={14} strokeWidth={1.5} />}>Web search</IconLabel>} description="Query the open web and read pages." checked={s.web} onChange={set("web")} />
            <Toggle layout="row" showState label={<IconLabel icon={<Code2 size={14} strokeWidth={1.5} />}>Code interpreter</IconLabel>} description="Run Python in a sandbox, no network." checked={s.code} onChange={set("code")} />
            <Toggle layout="row" showState label={<IconLabel icon={<FileText size={14} strokeWidth={1.5} />}>File access</IconLabel>} description="Read the shared research folder." checked={s.files} onChange={set("files")} />
            <Toggle layout="row" showState label={<IconLabel icon={<Mail size={14} strokeWidth={1.5} />}>Send email</IconLabel>} description="Draft and send from atlas@harborfinch.example." checked={s.email} onChange={set("email")} />
          </div>
        </FormSection>

        <FormSection label="05 · Budget" title={<>What it <em>may spend</em></>} description="A hard stop. Atlas finishes the current step and then halts.">
          <Field label="Daily budget" hint={`About ${usd(s.budget * 30)} over a 30-day month if it is used every day.`}>
            <RulerSlider
              min={0}
              max={50}
              step={1}
              value={s.budget}
              onChange={set("budget")}
              format={usd}
              tickLabel={usd}
              unit="/ day"
              marks={[{ value: 20, label: "default" }]}
            />
          </Field>
        </FormSection>

        <SaveBar
          changes={changed.length}
          saving={saving}
          message={changed.map((k) => LABELS[k]).join(" · ")}
          onDiscard={() => setS(saved)}
          onSave={save}
        />
      </div>
    </div>
  )
}

function IconLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "var(--ifm-t3)", display: "inline-flex" }}>{icon}</span>
      {children}
    </span>
  )
}

export const notes: string[] = [
  "The select is a button with role=combobox and a separate role=listbox. Focus never leaves the button: the highlighted option is announced through aria-activedescendant, and pointerdown on the list is cancelled so clicking an option does not blur the trigger.",
  "The ruler is built from absolutely positioned 1px ticks placed with left: n%. A 'nice' major step (1, 2 or 5 x 10^n) is derived from the range, so any min/max gets about five labelled ticks. The thumb is a role=slider element and the whole ruler uses pointer capture, so dragging keeps working outside the control.",
  "Segmented shares one sliding indicator: CSS custom properties --n (segments) and --i (selected index) drive width: calc(100% / var(--n)) and translateX(calc(var(--i) * 100%)), so the tick slides with a transition and no JavaScript measuring.",
  "The textarea grows by setting height to auto, reading scrollHeight and writing it back in a layout effect, before the browser paints. A ResizeObserver refits it when the width changes and text re-wraps.",
  "The SaveBar is always mounted and animates clip-path from inset(... 100% ...) to fully open, which scans it in left to right without layout shifts. A 1px pseudo-element sweeps across during the same time; visibility switches after the transition so the closed bar is not focusable.",
]
