export function TextAction({
  label,
  onClick,
  color,
  bg,
}: {
  label: string
  onClick: () => void
  color: string
  bg?: string
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[12px] font-medium transition-all whitespace-nowrap"
      style={{ color, background: bg || `${color}0d` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}1a`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = bg || `${color}0d`)}
    >
      {label}
    </button>
  )
}