type Transition<T extends string | number> = {
  from: T
  to: T
  on?: string
}

export type StateMachine<T extends string | number> = {
  states: T[]
  transitions: Transition<T>[]
  timeouts?: { from: T; afterMs: number; to: T; on?: string }[]
}

export function createMachine<T extends string | number>(config: StateMachine<T>) {
  const transitionMap = new Map<string, T>()
  for (const t of config.transitions) {
    const key = `${t.from}->${t.on ?? "default"}`
    transitionMap.set(key, t.to)
  }

  const timeoutMap = new Map<string, { afterMs: number; to: T; on?: string }>()
  for (const t of config.timeouts ?? []) {
    timeoutMap.set(`${t.from}:${t.on ?? "default"}`, t)
  }

  function canTransition(from: T, to: T, action?: string): boolean {
    const key = `${from}->${action ?? "default"}`
    return transitionMap.get(key) === to
  }

  function next(from: T, action?: string): T | null {
    const key = `${from}->${action ?? "default"}`
    return transitionMap.get(key) ?? null
  }

  return { canTransition, next, timeoutMap, config }
}

// 创建一个通用的通知订阅机制
type Listener = () => void

const domainListeners = new Map<string, Set<Listener>>()

export function notifyDomain(domain: string) {
  domainListeners.get(domain)?.forEach((l) => l())
}

export function subscribeDomain(domain: string, listener: Listener) {
  if (!domainListeners.has(domain)) {
    domainListeners.set(domain, new Set())
  }
  domainListeners.get(domain)!.add(listener)
  return () => {
    domainListeners.get(domain)?.delete(listener)
  }
}

// 定时器管理（模拟超时自动流转）
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function startTimeout(
  key: string,
  ms: number,
  callback: () => void,
) {
  stopTimeout(key)
  timers.set(key, setTimeout(callback, ms))
}

export function stopTimeout(key: string) {
  const existing = timers.get(key)
  if (existing) {
    clearTimeout(existing)
    timers.delete(key)
  }
}

export function clearAllTimeouts() {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}
