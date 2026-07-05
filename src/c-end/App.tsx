import { Suspense, useEffect } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "@/platform/auth"
import { LoginPageC } from "../shared/components/LoginPageC"
import { MiniProgramFrame } from "../shared/components/MiniProgramFrame"
import { RedirectTo } from "../shared/components/RedirectTo"
import { ErrorBoundary } from "../shared/components/ErrorBoundary"
import { PageSkeleton } from "../shared/components/mobile/Skeleton"
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
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route index element={<RedirectTo to="/c/home" />} />
            {cRoutes.map((route) => {
              if ("children" in route && route.children) {
                return (
                  <Route key={route.element?.toString()} element={route.element}>
                    {route.children.map((child: { path?: string; index?: boolean; element: React.ReactNode }) => (
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
              const cr = route as { path: string; element: React.ReactNode }
              return <Route key={cr.path} path={cr.path} element={cr.element} />
            })}
            <Route path="*" element={<RedirectTo to="/c/home" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </MiniProgramFrame>
  )
}
