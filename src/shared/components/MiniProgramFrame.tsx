import { useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { Signal, Wifi, BatteryFull, SwitchCamera } from "lucide-react"
import { useZoomStore } from "../stores/zoom-store"
import { useAuthStore } from "../stores/auth-store"

type Props = {
  children: ReactNode
  className?: string
  footer?: ReactNode
}

export function MiniProgramFrame({ children, footer }: Props) {
  const scale = useZoomStore((s) => s.scale)
  const resetScale = useZoomStore((s) => s.resetScale)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentPlatform = useAuthStore((s) => s.currentPlatform)
  const switchPlatform = useAuthStore((s) => s.switchPlatform)
  const navigate = useNavigate()

  useEffect(() => { resetScale() }, [resetScale])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E5EDF6] p-4">
      {/* Wrapper dynamically matches scaled size for correct centering */}
      <div
        style={{ width: 390 * scale, height: 844 * scale, flexShrink: 0 }}
      >
        <div
          className="bg-white rounded-[40px] overflow-hidden flex flex-col relative"
          style={{
            width: 390,
            height: 844,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            boxShadow:
              "0 20px 50px rgba(60,120,200,0.18), 0 8px 20px rgba(60,120,200,0.10)",
            border: "1px solid rgba(0,0,0,0.06)",
            transition: "transform 0.2s ease",
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-[12px] text-text-heading shrink-0 z-20">
            <span className="font-medium">9:41</span>
            <span className="text-[14px] font-semibold text-text-heading/70">丽江古城游</span>
            <div className="flex items-center gap-1">
              {isLoggedIn && currentPlatform && (
                <button
                  onClick={() => {
                    const next = currentPlatform === "c" ? "/b" : "/c"
                    const nextPlatform = currentPlatform === "c" ? "b" : "c"
                    switchPlatform(nextPlatform)
                    navigate(next)
                  }}
                  className="mr-1 size-6 rounded-full bg-primary-50 flex items-center justify-center"
                  title="切换端"
                >
                  <SwitchCamera className="size-3 text-primary" />
                </button>
              )}
              <Signal className="size-3.5" />
              <Wifi className="size-3.5" />
              <BatteryFull className="size-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {children}
          </div>

          {footer && (
            <div className="shrink-0">
              {footer}
            </div>
          )}

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[110px] h-1 rounded-full bg-black/20 z-30" />
        </div>
      </div>
    </div>
  )
}
