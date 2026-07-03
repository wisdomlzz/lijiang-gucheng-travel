import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "../shared/stores/auth-store"
import { LoginPageDesktop } from "../shared/components/LoginPageDesktop"
import { DesktopLayout } from "./DesktopLayout"
import { CrudRoutes } from "./components/common/CrudRoutes"
import { ProtectedRoute } from "./components/common/ProtectedRoute"
import { RedirectTo } from "../shared/components/RedirectTo"

// 懒加载页面组件
const Workbench = lazy(() => import("./pages/Workbench").then(m => ({ default: m.Workbench })))
const SupplierApplicationsList = lazy(() => import("./pages/supplier-applications/list"))
const SupplierApplicationsShow = lazy(() => import("./pages/supplier-applications/show"))
const SupplierEntryDesktop = lazy(() => import("./pages/supplier-applications/SupplierEntryDesktop").then(m => ({ default: m.SupplierEntryDesktop })))
const ConvenienceOverviewPage = lazy(() => import("../features/convenience/desktop/pages/ConvenienceOverviewPage"))
const ConveniencePage = lazy(() => import("../features/convenience/desktop/pages/ConveniencePage"))
const ZoneManagementPage = lazy(() => import("../features/convenience/desktop/pages/ZoneManagementPage"))
const DispatchConfigPage = lazy(() => import("../features/convenience/desktop/pages/DispatchConfigPage"))
const ConvenienceStaffPage = lazy(() => import("../features/convenience/desktop/pages/ConvenienceStaffPage"))
const PriceArbitrationPage = lazy(() => import("../features/convenience/desktop/pages/PriceArbitrationPage"))
const BannerManagePage = lazy(() => import("./pages/gates/BannerManagePage").then(m => ({ default: m.BannerManagePage })))
const GridSettingsPage = lazy(() => import("./pages/gates/GridSettingsPage").then(m => ({ default: m.GridSettingsPage })))
const ComplaintPage = lazy(() => import("./pages/gates/ComplaintPage"))
const PhotoRecordsList = lazy(() => import("./pages/photo-records/list"))
const PhotoRecordShow = lazy(() => import("./pages/photo-records/show"))
const VolunteerManagePage = lazy(() => import("./pages/VolunteerManagePage").then(m => ({ default: m.VolunteerManagePage })))
const AnnouncementManagePage = lazy(() => import("./pages/gates/AnnouncementManagePage").then(m => ({ default: m.AnnouncementManagePage })))
const PointRulesPage = lazy(() => import("./pages/gates/PointRulesPage").then(m => ({ default: m.PointRulesPage })))
const SettlementPage = lazy(() => import("../features/convenience/desktop/pages/SettlementPage").then(m => ({ default: m.SettlementPage })))
const MerchantReviewPage = lazy(() => import("./pages/gates/MerchantReviewPage").then(m => ({ default: m.MerchantReviewPage })))
const FlowWarningPage = lazy(() => import("./pages/gates/FlowWarningPage").then(m => ({ default: m.FlowWarningPage })))

function Loading() {
  return <div className="flex items-center justify-center h-screen">加载中...</div>
}

export function DesktopApp() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentPlatform = useAuthStore((s) => s.currentPlatform)
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === "platform_admin"

  if (isLoggedIn && currentPlatform === "desktop" && user?.role === "supplier") {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="supplier-entry" element={<SupplierEntryDesktop />} />
          <Route path="login" element={<LoginPageDesktop />} />
          <Route path="*" element={<RedirectTo to="/desktop/login" />} />
        </Routes>
      </Suspense>
    )
  }

  if (!isLoggedIn || currentPlatform !== "desktop") {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="supplier-entry" element={<SupplierEntryDesktop />} />
          <Route path="login" element={<LoginPageDesktop />} />
          <Route path="*" element={<RedirectTo to="/desktop/login" />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<DesktopLayout />}>
          <Route index element={<RedirectTo to="/desktop/workbench" />} />
          <Route path="workbench" element={<Workbench />} />

          {/* 便民服务管理 */}
          <Route path="convenience-overview" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<ConvenienceOverviewPage />} />} />
          <Route path="convenience" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<ConveniencePage />} />} />
          <Route path="zones" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<ZoneManagementPage />} />} />
          <Route path="dispatch-config" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<DispatchConfigPage />} />} />
          <Route path="convenience-staff" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<ConvenienceStaffPage />} />} />
          <Route path="price-arbitration" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<PriceArbitrationPage />} />} />

          {/* 商城管理后台 */}
          <Route path="supplier-applications">{CrudRoutes({ list: <SupplierApplicationsList />, show: <SupplierApplicationsShow /> })}</Route>

          {/* 运营管理 */}
          <Route path="banner" element={<BannerManagePage />} />
          <Route path="grid-settings" element={<GridSettingsPage />} />
          <Route path="announcements" element={<AnnouncementManagePage />} />
          <Route path="complaints" element={<ComplaintPage />} />
          <Route path="photo-records" element={<PhotoRecordsList />} />
          <Route path="photo-records/:id" element={<PhotoRecordShow />} />
          <Route path="volunteer" element={<VolunteerManagePage />} />

          {/* 结算管理 */}
          <Route path="settlement" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<SettlementPage />} />} />

          {/* 内容管理 */}
          <Route path="point-rules" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<PointRulesPage />} />} />

          {/* 商家管理 */}
          <Route path="merchant-review" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<MerchantReviewPage />} />} />

          {/* 人流量预警 */}
          <Route path="flow-warning" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<FlowWarningPage />} />} />

          <Route path="*" element={<RedirectTo to="/desktop/workbench" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
