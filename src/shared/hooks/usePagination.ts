import { useState, useMemo } from "react"

export function usePagination<T>(items: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  )

  // Reset to page 1 when items change and current page is out of range
  if (currentPage > totalPages) {
    setCurrentPage(1)
  }

  return { currentPage, setCurrentPage, totalPages, paginatedItems, total: items.length }
}
