import { ReactNode } from "react"

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h1 className="text-lg">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}
