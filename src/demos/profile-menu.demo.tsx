import * as React from "react"

import { AppsIcon, BillingIcon, DocsIcon, LogoutIcon, ProfileMenu, SettingsIcon, type ProfileMenuItem } from "@/components/ui/profile-menu"

export const notes: string[] = [
  "The setup bar is a full-width fill that is scaled with the individual CSS `scale` property (`scale: 0.6 1`) from `transform-origin: left`. Scaling is cheap (no layout) and `transition: scale .9s` gives the fill-up; an IntersectionObserver flips it from 0 to the real ratio the first time the card is on screen.",
  "The list uses `role=\"menu\"` / `menuitem` with a roving tabindex: only one item is tabbable, and ArrowUp/Down/Home/End call `.focus()` on the neighbouring item through a ref array.",
  "The progress track exposes `role=\"progressbar\"` with `aria-valuenow` as a percentage, so the animation is purely visual while screen readers get the real number.",
  "Long names and emails stay on one line with `overflow: hidden; text-overflow: ellipsis` – this only works because the text block is a grid/flex child with `min-width: 0`, otherwise it would stretch the card.",
  "Colors are alpha mixes of one ink token (`color-mix(in oklab, var(--pm-ink) 45%, transparent)`), so dark mode only flips `--pm-ink` and a few surface tokens.",
]

export default function Demo() {
  const [last, setLast] = React.useState<string>("Nothing selected yet")

  const items: ProfileMenuItem[] = [
    { id: "settings", label: "Workspace settings", icon: <SettingsIcon />, onSelect: () => setLast("Opened workspace settings") },
    { id: "billing", label: "Billing and usage", icon: <BillingIcon />, onSelect: () => setLast("Opened billing") },
    { id: "docs", label: "API docs", icon: <DocsIcon />, onSelect: () => setLast("Opened API docs") },
    { id: "apps", label: "Integrations", icon: <AppsIcon />, badge: "3 new", onSelect: () => setLast("Opened integrations") },
    { id: "logout", label: "Sign out", icon: <LogoutIcon />, onSelect: () => setLast("Signed out") },
  ]

  return (
    <div className="flex w-full max-w-[260px] flex-col items-center gap-4">
      <ProfileMenu
        name="Mara Okonkwo"
        email="mara@northwind-labs.example"
        items={items}
        setup={{ done: 3, total: 5, next: "Connect your data source", onContinue: () => setLast("Continued setup") }}
      />
      <p className="text-[12px] text-neutral-400" aria-live="polite">
        {last}
      </p>
    </div>
  )
}
