import { useId } from "react"

/** The Pane mark: a glass pane over a darker one. Same drawing as public/favicon.svg. */
export function PaneMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={["rounded-[25%] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.18)]", className].filter(Boolean).join(" ")} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".34" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".1" />
          <stop offset="1" stopColor="#fff" stopOpacity=".22" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0a0a0a" />
      <rect x="11" y="4.5" width="16.5" height="16.5" rx="4.5" fill="#fff" fillOpacity=".16" />
      <rect x="4.5" y="11" width="16.5" height="16.5" rx="4.5" fill={`url(#${id})`} stroke="#fff" strokeWidth="1.6" />
      <path d="M8.4 17.2 11.8 13.8M8.4 21.6 16.2 13.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".85" />
    </svg>
  )
}

