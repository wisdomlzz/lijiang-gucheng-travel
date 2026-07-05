/** In-memory timeout manager for convenience order timers */
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function setTimer(key: string, ms: number, cb: () => void) {
  clearTimer(key)
  timers.set(key, setTimeout(cb, ms))
}

export function clearTimer(key: string) {
  const t = timers.get(key)
  if (t) {
    clearInterval(t)
    timers.delete(key)
  }
}

export function clearAllTimers() {
  for (const [key, t] of timers) {
    clearInterval(t)
  }
  timers.clear()
}
