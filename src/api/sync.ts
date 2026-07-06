import { toast } from "sonner"

/**
 * Server-authoritative syncAction:
 * - 调用 API,成功用返回值更新本地 state(在 localUpdate 回调内 set)
 * - 失败:toast 报错,本地 state 不动,返回 null
 * - 禁止乐观更新
 */
export async function syncAction<T>(
  name: string,
  apiCall: () => Promise<T>,
  localUpdate: (result: T) => void,
): Promise<T | null> {
  try {
    const result = await apiCall()
    localUpdate(result)
    return result
  } catch (e) {
    console.error(`[sync] ${name} failed:`, (e as Error).message)
    toast.error(`操作失败: ${(e as Error).message}`, { duration: 4000 })
    return null
  }
}