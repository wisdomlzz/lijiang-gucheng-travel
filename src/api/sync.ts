// 异步动作辅助：先调 API，成功后更新本地 store；API 不可用时回退纯本地
export async function syncAction(name, apiCall, localUpdate) {
  try {
    const result = await apiCall()
    localUpdate(result)
    return result
  } catch (e) {
    // API 不可用或失败时，回退纯本地（Demo 友好降级）
    console.warn(`[sync] ${name} API failed, fallback to local:`, e.message)
    localUpdate()
    return null
  }
}