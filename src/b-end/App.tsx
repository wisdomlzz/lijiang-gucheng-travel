import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router"
import { useAuthStore } from "../shared/stores/auth-store"
import { LoginPageB } from "../shared/components/LoginPageB"
import { ServiceApp } from "./roles/service/App"

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
    <Routes>
      <Route index element={<Navigate to="/b/service/workbench" replace />} />
      <Route path="service/*" element={<ServiceApp />} />
      <Route path="*" element={<Navigate to="/b/service/workbench" replace />} />
    </Routes>
  )
}
