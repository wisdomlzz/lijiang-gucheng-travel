import { toast } from "sonner"

// 异步动作辅助：调 API，成功后更新本地 store；失败时 toast 报错
export async function syncAction(name, apiCall, localUpdate) {
  try {
    const result = await apiCall()
    localUpdate(result)
    return result
  } catch (e) {
    console.error(`[sync] ${name} failed:`, e.message)
    toast.error(`操作失败: ${e.message}`, { duration: 4000 })
    return null
  }
}