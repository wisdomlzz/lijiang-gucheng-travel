import { getBadge } from "./getBadge"

interface TypeBadgeProps {
  type: string
  title: string
}

export function TypeBadge({ type, title }: TypeBadgeProps) {
  const badge = getBadge(type, title)
  return (
    <div
      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] text-white font-medium"
      style={{ backgroundColor: badge.color }}
    >
      {badge.label}
    </div>
  )
}
