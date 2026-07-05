import { ReactNode } from "react"
import { Input } from "../../../shared/components/ui/input"
import { Search, Download, Plus } from "lucide-react"
import { Button } from "../../../shared/components/ui/button"

export function DataToolbar({
  search = true,
  placeholder = "搜索关键字",
  onSearch,
  filters,
  right,
  onExport,
  onCreate,
}: {
  search?: boolean
  placeholder?: string
  onSearch?: (v: string) => void
  filters?: ReactNode
  right?: ReactNode
  onExport?: () => void
  onCreate?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {search && (
        <div className="relative w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder={placeholder} onChange={(e) => onSearch?.(e.target.value)} />
        </div>
      )}
      {filters}
      <div className="flex-1" />
      {right}
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="size-3.5 mr-1" />
          导出
        </Button>
      )}
      {onCreate && (
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={onCreate}>
          <Plus className="size-3.5 mr-1" />
          新建
        </Button>
      )}
    </div>
  )
}
