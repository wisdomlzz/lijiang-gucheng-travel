import { useState, useRef, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router"
import { BookOpen, ExternalLink } from "lucide-react"

const endMap = [
  { prefix: "/c", label: "C端", color: "#2563EB" },
  { prefix: "/b", label: "B端", color: "#7C3AED" },
  { prefix: "/desktop", label: "桌面端", color: "#059669" },
]

const BTN = 40
const GAP = 16
const KEY = "demo-switcher-pos"

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === "number" && typeof p.y === "number") return p
    }
  } catch {}
  return { x: innerWidth - BTN - GAP, y: GAP }
}

export function DemoSwitcher() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(loadPos)
  const drag = useRef(false)
  const start = useRef({ x: 0, y: 0, bx: 0, by: 0 })
  const posRef = useRef(pos)
  posRef.current = pos
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === "/"

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(x, innerWidth - BTN)),
    y: Math.max(0, Math.min(y, innerHeight - BTN)),
  }), [])

  useEffect(() => {
    const onResize = () => setPos(p => clamp(p.x, p.y))
    addEventListener("resize", onResize)
    return () => removeEventListener("resize", onResize)
  }, [clamp])

  if (isLanding) return null

  const current = endMap.find((e) => location.pathname.startsWith(e.prefix))

  return (
    <div className="fixed z-[9999] select-none" style={{ left: pos.x, top: pos.y }}>
      <button
        onPointerDown={(e) => {
          e.preventDefault()
          drag.current = false
          start.current = { x: e.clientX, y: e.clientY, bx: pos.x, by: pos.y }
          setOpen(false)

          const move = (e: PointerEvent) => {
            const dx = e.clientX - start.current.x
            const dy = e.clientY - start.current.y
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current = true
            if (drag.current) setPos(clamp(start.current.bx + dx, start.current.by + dy))
          }

          const up = () => {
            removeEventListener("pointermove", move)
            removeEventListener("pointerup", up)
            if (drag.current) {
              try { localStorage.setItem(KEY, JSON.stringify(posRef.current)) } catch {}
            } else {
              setOpen(v => !v)
            }
            drag.current = false
          }

          addEventListener("pointermove", move)
          addEventListener("pointerup", up)
        }}
        className="size-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow border border-border-light text-text-tertiary hover:text-text-heading"
        title="切换端"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-40 bg-white rounded-xl shadow-xl border border-border-light overflow-hidden animate-scale-in">
            <div className="px-3 py-2 text-[11px] text-text-tertiary border-b border-border-light">
              当前：{current?.label ?? "未知"}
            </div>
            {endMap.map((end) => {
              const isCurrent = current?.prefix === end.prefix
              return (
                <button
                  key={end.prefix}
                  onClick={() => {
                    navigate(end.prefix)
                    setOpen(false)
                  }}
                  disabled={isCurrent}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  style={{ color: isCurrent ? end.color : undefined }}
                >
                  <span className="size-2 rounded-full" style={{ background: end.color }} />
                  {end.label}
                  {isCurrent && <span className="ml-auto text-[10px] opacity-60">当前</span>}
                </button>
              )
            })}
            <div className="h-px bg-border-light my-1" />
            <button
              onClick={() => { window.open("/requirement", "_blank"); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left text-text-body"
            >
              <BookOpen className="size-4 text-muted-foreground" />
              需求文档
              <ExternalLink className="ml-auto size-3 text-muted-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
