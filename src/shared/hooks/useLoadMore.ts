import { useState, useMemo, useCallback } from "react"

export function useLoadMore<T>(items: T[], pageSize = 10) {
  const [count, setCount] = useState(pageSize)

  const visible = useMemo(() => items.slice(0, count), [items, count])
  const hasMore = count < items.length
  const total = items.length

  const loadMore = useCallback(() => {
    setCount((prev) => prev + pageSize)
  }, [pageSize])

  // Reset when items change (e.g. filter applied)
  const reset = useCallback(() => {
    setCount(pageSize)
  }, [pageSize])

  return { visible, hasMore, loadMore, reset, total }
}
