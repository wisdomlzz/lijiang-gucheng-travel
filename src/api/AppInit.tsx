import { useApiHydrate } from "@/api/hydrate"
import { Wifi, WifiOff } from "lucide-react"

export function AppInit() {
  const status = useApiHydrate()

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {status === "online" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] shadow-sm">
          <Wifi className="size-3" />
          <span>已连接</span>
        </div>
      )}
      {status === "offline" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] shadow-sm">
          <WifiOff className="size-3" />
          <span>离线模式（本地数据）</span>
        </div>
      )}
      {status === "loading" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-[11px] shadow-sm animate-pulse">
          <span>连接中...</span>
        </div>
      )}
    </div>
  )
}