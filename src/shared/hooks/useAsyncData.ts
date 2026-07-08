import { useState, useEffect, useCallback } from "react"

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
  setData: (data: T) => void
}

/**
 * 通用异步数据加载 hook
 * 自动管理 loading/error/data 三态
 * 适用于所有 API 驱动的页面
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e: any) {
      setError(e?.message || "数据加载失败")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refresh: fetch, setData }
}