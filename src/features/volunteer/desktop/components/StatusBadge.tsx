export function StatusBadge({
  status,
  config,
}: {
  status: string
  config: Record<string, { label: string; bg: string; fg: string }>
}) {
  const c = config[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}