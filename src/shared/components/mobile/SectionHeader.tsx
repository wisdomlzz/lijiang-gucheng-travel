import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"

interface SectionHeaderProps {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>
  title: string
  action?: { label: string; to: string }
}

export function SectionHeader({ icon: Icon, title, action }: SectionHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {Icon && (
          <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center">
            <Icon size={14} className="text-sky-deep" />
          </div>
        )}
        <h3 className="text-[15px] font-semibold text-text-heading">{title}</h3>
      </div>
      {action && (
        <button onClick={() => navigate(action.to)} className="flex items-center text-[12px] text-sky-deep font-medium">
          {action.label} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
