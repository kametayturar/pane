// Landing Builder: accent colour helpers. Pane sections read the accent from `--pane-accent`; the builder derives a
// dark-mode value and a readable text colour for accent-filled buttons from the one colour the owner picks.

export type AccentPreset = { name: string; hex: string }

export const ACCENTS: AccentPreset[] = [
  { name: "Pane blue", hex: "#0060e2" },
  { name: "Indigo", hex: "#4338ca" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Forest", hex: "#2f6b3a" },
  { name: "Clay", hex: "#b4532a" },
  { name: "Crimson", hex: "#be123c" },
  { name: "Graphite", hex: "#27272a" },
]

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s.trim())

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex = (c: [number, number, number]) => `#${c.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

export function mix(a: string, b: string, t: number): string {
  const [ca, cb] = [rgb(a), rgb(b)]
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as [number, number, number])
}

/** White or near-black, whichever reads better on the accent. */
export function onAccent(accent: string): string {
  return contrast(accent, "#ffffff") >= contrast(accent, "#0a0a0a") ? "#ffffff" : "#0a0a0a"
}

/** The accent for dark pages: lifted toward white until it reads on a near-black surface (at least 4.5:1). */
export function darkAccent(accent: string): string {
  let c = accent
  for (let t = 0; t <= 0.7 && contrast(c, "#0a0a0a") < 4.5; t += 0.05) c = mix(accent, "#ffffff", t)
  return c
}
