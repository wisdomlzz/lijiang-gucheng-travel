import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "./utils"
import { Button } from "./button"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DataToolbarProps {
  /** Current search query value */
  query: string
  /** Callback when search query changes */
  onQueryChange: (query: string) => void
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Current page number (1-based) */
  page: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Current page size */
  pageSize: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void
  /** Total number of items (for display) */
  total: number
  /** Additional class names */
  className?: string
}

/* ------------------------------------------------------------------ */
/*  DataToolbar                                                        */
/* ------------------------------------------------------------------ */

function DataToolbar({
  query,
  onQueryChange,
  searchPlaceholder = "搜索...",
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  total,
  className,
}: DataToolbarProps) {
  return (
    <div
      data-slot="data-toolbar"
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      {/* Search input */}
      <div className="relative flex-1 max-w-sm">
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Pagination controls */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        total={total}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PaginationBar (standalone pagination controls)                     */
/* ------------------------------------------------------------------ */

interface PaginationBarProps {
  /** Current page number (1-based) */
  page: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Current page size */
  pageSize: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void
  /** Total number of items (for display) */
  total: number
  /** Additional class names */
  className?: string
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  total,
  className,
}: PaginationBarProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div data-slot="pagination-bar" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {/* Item count display */}
      <span className="text-muted-foreground whitespace-nowrap">
        {total > 0 ? `${startItem}-${endItem} / ${total}` : "暂无数据"}
      </span>

      {/* Page size selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">每页</span>
        <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="上一页"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        <span className="min-w-[4rem] text-center tabular-nums">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="下一页"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { DataToolbar, PaginationBar }
export type { DataToolbarProps, PaginationBarProps }
