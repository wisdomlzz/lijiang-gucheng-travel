import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-surface-strong flex items-center justify-center mb-3">
        <Icon size={28} className="text-text-tertiary" />
      </div>
      <p className="text-[14px] text-text-tertiary">{title}</p>
      {description && <p className="text-[13px] text-text-caption mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 h-9 rounded-full bg-primary text-white text-[13px] font-medium active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
