import { Suspense, useEffect } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "../shared/stores/auth-store"
import { LoginPageC } from "../shared/components/LoginPageC"
import { MiniProgramFrame } from "../shared/components/MiniProgramFrame"
import { RedirectTo } from "../shared/components/RedirectTo"
import { cRoutes } from "./routes"

export function CApp() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentPlatform = useAuthStore((s) => s.currentPlatform)
  const user = useAuthStore((s) => s.user)
  const switchPlatform = useAuthStore((s) => s.switchPlatform)

  useEffect(() => {
    if (isLoggedIn && currentPlatform !== "c" && user?.platform.includes("c")) {
      switchPlatform("c")
    }
  }, [isLoggedIn, currentPlatform, user, switchPlatform])

  if (!isLoggedIn || currentPlatform !== "c") {
    return <LoginPageC />
  }

  return (
    <MiniProgramFrame>
      <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[400px] text-sm text-text-tertiary">加载中...</div>}>
      <Routes>
        <Route index element={<RedirectTo to="/c/home" />} />
        {cRoutes.map((route) => {
          if ("children" in route && route.children) {
            return (
              <Route key={route.element?.toString()} element={route.element}>
                {route.children.map((child: any) => (
                  <Route
                    key={child.path ?? "index"}
                    index={child.index}
                    path={child.path}
                    element={child.element}
                  />
                ))}
              </Route>
            )
          }
          return (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          )
        })}
        <Route path="*" element={<RedirectTo to="/c/home" />} />
      </Routes>
      </Suspense>
    </MiniProgramFrame>
  )
}
