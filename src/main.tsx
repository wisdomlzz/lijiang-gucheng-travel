import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { Suspense, lazy } from "react"
import { Toaster } from "sonner"
import { ZoomIn, ZoomOut } from "lucide-react"
import "./shared/styles/index.css"
import { LandingPage } from "./LandingPage"
import { DemoSwitcher } from "./DemoSwitcher"
import { useZoomStore } from "./shared/stores/zoom-store"

const CApp = lazy(() => import("./c-end/App").then(m => ({ default: m.CApp })))
const BApp = lazy(() => import("./b-end/App").then(m => ({ default: m.BApp })))
const DesktopApp = lazy(() => import("./desktop/App").then(m => ({ default: m.DesktopApp })))
const RequirementPage = lazy(() => import("./desktop/pages/RequirementPage").then(m => ({ default: m.RequirementPage })))

const MIN_SCALE = 0.4
const MAX_SCALE = 1
const STEP = 0.05

function ZoomControl() {
  const location = useLocation()
  const { scale, setScale } = useZoomStore()
  const isLanding = location.pathname === "/"
  const isDesktop = location.pathname.startsWith("/desktop")
  const isRequirement = location.pathname === "/requirement"

  // Only show on C/B end (phone shell pages)
  if (isLanding || isDesktop || isRequirement) return null

  const zoomIn = () => setScale(Math.min(MAX_SCALE, +(scale + STEP).toFixed(2)))
  const zoomOut = () => setScale(Math.max(MIN_SCALE, +(scale - STEP).toFixed(2)))

  return (
    <div className="fixed top-4 left-4 z-[9998] flex items-center gap-1 bg-white/85 backdrop-blur rounded-full shadow-lg border border-border-light p-0.5">
      <button
        onClick={zoomIn}
        disabled={scale >= MAX_SCALE}
        className="size-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-body disabled:opacity-30 transition-colors"
        title="放大"
      >
        <ZoomIn className="size-3.5" />
      </button>
      <span className="text-[11px] font-medium text-text-body tabular-nums w-10 text-center select-none">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={zoomOut}
        disabled={scale <= MIN_SCALE}
        className="size-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-body disabled:opacity-30 transition-colors"
        title="缩小"
      >
        <ZoomOut className="size-3.5" />
      </button>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/c/*" element={<CApp />} />
        <Route path="/b/*" element={<BApp />} />
        <Route path="/desktop/*" element={<DesktopApp />} />
        <Route path="/requirement" element={<RequirementPage />} />
      </Routes>
    </Suspense>
    <Toaster position="top-center" richColors />
    <DemoSwitcher />
    <ZoomControl />
  </BrowserRouter>
)
