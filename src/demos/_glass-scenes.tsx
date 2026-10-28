import * as React from "react"

/* Illustrated backdrops for the glass demos. Busy on purpose: glass only reads over detail, colour and edges. */

export type SceneTone = "harbor" | "tram" | "bridge" | "coast" | "cliff"

const PALETTES: Record<SceneTone, { sky: [string, string, string]; sun: string; far: string; mid: string; near: string; water: [string, string]; roof: string; wall: string; win: string }> = {
  harbor: { sky: ["#3b3f8f", "#e7788a", "#ffd29a"], sun: "#fff0c2", far: "#8d5f9e", mid: "#5d3f7e", near: "#2d2457", water: ["#e9a089", "#4a3a7a"], roof: "#e0643f", wall: "#f6d9b5", win: "#2a2150" },
  tram: { sky: ["#f4a259", "#f7c873", "#fff2cf"], sun: "#fffbe8", far: "#d99060", mid: "#b8553a", near: "#7a2f2a", water: ["#f2c58b", "#c76a4a"], roof: "#c9482e", wall: "#fbe5c0", win: "#5a2623" },
  bridge: { sky: ["#1d3a6e", "#4f88c6", "#cfe6f6"], sun: "#ffffff", far: "#7aa7d1", mid: "#456f9f", near: "#1f3c66", water: ["#9fc7e6", "#27507f"], roof: "#d8dfe8", wall: "#eef3f8", win: "#1b3156" },
  coast: { sky: ["#0f766e", "#5fc2b3", "#e6f7e3"], sun: "#fffde0", far: "#69b79c", mid: "#2f8a78", near: "#14564f", water: ["#a4e0cf", "#17756a"], roof: "#f0e1b8", wall: "#fffaf0", win: "#0f4a44" },
  cliff: { sky: ["#ff8f70", "#ffc08a", "#fff0c9"], sun: "#fffbe3", far: "#d8826a", mid: "#a4465c", near: "#4d2457", water: ["#ffd2a6", "#a35a73"], roof: "#fff1da", wall: "#fffaf0", win: "#3e1d49" },
}

function rand(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** A layered town-by-the-water scene. Fills its parent (position it absolutely or give it a size). */
export function Scene({ tone = "harbor", className, style, seed = 7 }: { tone?: SceneTone; className?: string; style?: React.CSSProperties; seed?: number }) {
  const p = PALETTES[tone]
  const id = React.useId().replace(/:/g, "")
  const blocks = React.useMemo(() => {
    const r = rand(seed + tone.length * 13)
    const out: { x: number; y: number; w: number; h: number; roof: boolean; rows: number; cols: number; shade: number }[] = []
    let x = -10
    while (x < 640) {
      const w = 34 + r() * 46
      const h = 50 + r() * 90
      out.push({ x, y: 330 - h, w, h, roof: r() > 0.35, rows: Math.max(2, Math.round(h / 22)), cols: Math.max(2, Math.round(w / 16)), shade: r() })
      x += w + 2 + r() * 6
    }
    return out
  }, [seed, tone])
  return (
    <svg className={className} style={style} viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset=".55" stopColor={p.sky[1]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.water[0]} />
          <stop offset="1" stopColor={p.water[1]} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={p.sun} stopOpacity=".95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill={`url(#${id}s)`} />
      <circle cx="470" cy="236" r="120" fill={`url(#${id}g)`} />
      <circle cx="470" cy="236" r="30" fill={p.sun} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={60 + i * 90} y={70 + ((i * 37) % 60)} width={90 - (i % 2) * 20} height="5" rx="2.5" fill="#fff" opacity={0.28} />
      ))}
      <path d="M0 300 Q 80 240 170 285 T 340 270 T 520 280 T 640 262 V 340 H 0Z" fill={p.far} opacity=".85" />
      <path d="M0 320 Q 120 270 230 310 T 440 300 T 640 306 V 350 H 0Z" fill={p.mid} />
      <g>
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={p.wall} opacity={0.82 + b.shade * 0.18} />
            {b.roof && <path d={`M${b.x - 3} ${b.y} L${b.x + b.w / 2} ${b.y - 16 - b.shade * 8} L${b.x + b.w + 3} ${b.y}Z`} fill={p.roof} />}
            {Array.from({ length: b.rows * b.cols }).map((_, k) => {
              const cx = k % b.cols
              const cy = Math.floor(k / b.cols)
              return <rect key={k} x={b.x + 5 + cx * ((b.w - 8) / b.cols)} y={b.y + 8 + cy * 20} width="6" height="10" rx="1" fill={p.win} opacity=".62" />
            })}
          </g>
        ))}
      </g>
      <rect x="0" y="330" width="640" height="90" fill={`url(#${id}w)`} />
      {Array.from({ length: 16 }).map((_, i) => (
        <rect key={i} x={20 + ((i * 97) % 600)} y={340 + i * 5} width={40 + ((i * 53) % 90)} height="2" rx="1" fill="#fff" opacity=".35" />
      ))}
      <path d="M0 395 Q 160 360 320 392 T 640 380 V 420 H 0Z" fill={p.near} />
    </svg>
  )
}

/** A feed tile for the scrolling-feed demo: a gradient "photo" with a title below it. */
const TILE_TONES: SceneTone[] = ["harbor", "tram", "bridge", "coast", "cliff"]
export function FeedCard({ i, title, meta }: { i: number; title: string; meta: string }) {
  return (
    <article style={{ borderRadius: 22, overflow: "hidden", background: "rgb(255 255 255 / .92)", boxShadow: "0 1px 2px rgb(0 0 0 / .08)" }} className="dark:!bg-neutral-900">
      <div style={{ position: "relative", height: 150 }}>
        <Scene tone={TILE_TONES[i % TILE_TONES.length]} seed={i * 11 + 3} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">{title}</div>
        <div className="text-[12px] text-neutral-500 dark:text-neutral-400">{meta}</div>
      </div>
    </article>
  )
}
