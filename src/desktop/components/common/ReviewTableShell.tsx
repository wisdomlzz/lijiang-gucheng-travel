import { Search } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"

interface ReviewTableShellProps {
  /** Total item count for the summary line */
  totalCount: number
  /** Pending count shown as a badge */
  pendingCount: number
  /** Current search query value */
  searchQuery: string
  /** Search query change handler */
  onSearchChange: (q: string) => void
  /** Search input placeholder text */
  searchPlaceholder?: string
  /** Icon shown before the summary line */
  summaryIcon?: React.ReactNode
  /** Summary text template: receives {count} and returns the label */
  summaryLabel?: string
  /** Pagination props */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  /** The table (or any content) rendered inside the white card */
  children: React.ReactNode
}

export function ReviewTableShell(props: ReviewTableShellProps) {
  return (
    <>
      {/* Summary info bar */}
      <div className="flex items-center gap-2 mb-4 text-[13px] text-text-secondary">
        {props.summaryIcon}
        {" "}
        {props.summaryLabel?.replace("{count}", String(props.totalCount)) ?? `共 ${props.totalCount} 条`}
        {props.pendingCount > 0 && <Badge className="bg-rose-500">待审核 {props.pendingCount}</Badge>}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={props.searchPlaceholder || "搜索..."}
          value={props.searchQuery}
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="pl-9 h-9 max-w-xs"
        />
      </div>

      {/* Content card */}
      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        {props.children}
      </div>

      {/* Pagination */}
      <PaginationBar
        page={props.page}
        totalPages={props.totalPages}
        onPageChange={props.onPageChange}
        pageSize={10}
        onPageSizeChange={() => {}}
        total={props.total}
      />
    </>
  )
}