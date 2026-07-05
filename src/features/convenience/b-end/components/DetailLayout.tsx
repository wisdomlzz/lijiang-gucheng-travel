import { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

export function DetailLayout({
  open,
  onClose,
  title,
  tint = "#2563EB",
  headerBg,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  tint?: string
  headerBg?: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="absolute inset-0 z-40 bg-surface-page flex flex-col"
      style={{ animation: "slideIn 0.22s ease-out" }}
    >
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      <div className="flex items-center px-3 pt-3 pb-2 shrink-0 z-10" style={{ background: headerBg || "transparent" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="返回"
          className="size-9 rounded-full bg-white/90 flex items-center justify-center shadow-[0_2px_8px_rgba(60,120,200,0.08)] active:scale-95 transition relative z-10"
        >
          <ChevronLeft className="size-4" style={{ color: tint }} />
        </button>
        <span className="flex-1 text-center text-[15px] text-text-heading -ml-9">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
      {footer && <div className="bg-white border-t border-[#F0F0F0] px-4 py-3 shrink-0">{footer}</div>}
    </div>
  )
}

export function InfoRow({
  label,
  value,
  mono,
  strong,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12px] text-text-tertiary shrink-0">{label}</span>
      <span
        className={`text-[12px] text-right ${
          mono ? "tabular-nums tracking-wider" : ""
        } ${strong ? "text-text-heading font-medium" : "text-text-secondary"}`}
      >
        {value}
      </span>
    </div>
  )
}

export function SectionCard({ title, extra, children }: { title?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[13px] text-text-heading">{title}</h4>
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}
