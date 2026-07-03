import { Suspense, useEffect } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "../shared/stores/auth-store"
import { LoginPageB } from "../shared/components/LoginPageB"
import { ServiceApp } from "../features/convenience/b-end/pages/App"
import { RedirectTo } from "../shared/components/RedirectTo"

export function BApp() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentPlatform = useAuthStore((s) => s.currentPlatform)
  const user = useAuthStore((s) => s.user)
  const switchPlatform = useAuthStore((s) => s.switchPlatform)

  useEffect(() => {
    if (isLoggedIn && currentPlatform !== "b" && user?.platform.includes("b")) {
      switchPlatform("b")
    }
  }, [isLoggedIn, currentPlatform, user, switchPlatform])

  if (!isLoggedIn || currentPlatform !== "b") {
    return <LoginPageB />
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[400px] text-sm text-text-tertiary">加载中...</div>}>
    <Routes>
      <Route index element={<RedirectTo to="/b/service/workbench" />} />
      <Route path="service/*" element={<ServiceApp />} />
      <Route path="*" element={<RedirectTo to="/b/service/workbench" />} />
    </Routes>
    </Suspense>
  )
}
