import { Suspense, useEffect } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "@/platform/auth"
import { LoginPageB } from "../shared/components/LoginPageB"
import { ServiceApp } from "../features/convenience/b-end/pages/App"
import { RedirectTo } from "../shared/components/RedirectTo"
import { ErrorBoundary } from "../shared/components/ErrorBoundary"
import { PageSkeleton } from "../shared/components/mobile/Skeleton"

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
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route index element={<RedirectTo to="/b/service/workbench" />} />
          <Route path="service/*" element={<ServiceApp />} />
          <Route path="*" element={<RedirectTo to="/b/service/workbench" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
