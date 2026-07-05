import { ReactNode } from "react"
import { X } from "lucide-react"

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(60,120,200,0.18)] max-h-[85%] flex flex-col"
        style={{ animation: "sheetUp 0.22s ease-out" }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-surface-strong mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h3 className="text-[15px] text-text-heading mt-2">{title}</h3>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center">
            <X className="size-4 text-text-tertiary" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-6 pt-2 no-scrollbar">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  onClose,
  title,
  desc,
  warnings,
  cancel = "取消",
  confirm = "确认",
  onConfirm,
  tint = "#2563EB",
}: {
  open: boolean
  onClose: () => void
  title: string
  desc?: string
  warnings?: string[]
  cancel?: string
  confirm?: string
  onConfirm: () => void
  tint?: string
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <h3 className="text-[15px] text-text-heading">{title}</h3>
        {desc && <p className="mt-2 text-[12px] text-text-secondary leading-relaxed">{desc}</p>}
        {warnings && warnings.length > 0 && (
          <div className="mt-3 rounded-2xl px-3 py-2.5 space-y-1.5" style={{ background: "#FFF4E5" }}>
            {warnings.map((w, i) => (
              <div key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "#9A3412" }}>
                <span className="size-1 rounded-full bg-[#F97316] mt-1.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-2xl bg-white border border-[#E5E7EB] text-text-secondary text-[13px]"
          >
            {cancel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 h-10 rounded-2xl text-white text-[13px] font-medium"
            style={{
              background: tint,
              boxShadow: `0 4px 12px ${tint}55`,
            }}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ show, text }: { show: boolean; text: string }) {
  if (!show) return null
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-text-heading/90 text-white text-[12px] backdrop-blur-md shadow-lg">
      {text}
    </div>
  )
}
