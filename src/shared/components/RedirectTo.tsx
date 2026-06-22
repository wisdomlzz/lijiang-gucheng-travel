import { useEffect } from "react"
import { useNavigate } from "react-router"

/**
 * 替代 <Navigate> 的跳转组件
 * <Navigate> 返回 null 导致返回时页面一闪空白，
 * 此组件渲染"跳转中..."提示避免空白闪动。
 */
export function RedirectTo({ to, replace = true }: { to: string; replace?: boolean }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(to, { replace })
  }, [])

  return (
    <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-text-tertiary">
      跳转中...
    </div>
  )
}
