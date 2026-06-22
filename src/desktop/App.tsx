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
const ConvenienceOverviewPage = lazy(() => import("./pages/gates/ConvenienceOverviewPage"))
const ConveniencePage = lazy(() => import("./pages/gates/ConveniencePage"))
const ZoneManagementPage = lazy(() => import("./pages/gates/ZoneManagementPage"))
const DispatchConfigPage = lazy(() => import("./pages/gates/DispatchConfigPage"))
const ConvenienceStaffPage = lazy(() => import("./pages/gates/ConvenienceStaffPage"))
const PriceArbitrationPage = lazy(() => import("./pages/gates/PriceArbitrationPage"))
const AccountPage = lazy(() => import("./pages/gates/AccountPage"))
const RolePage = lazy(() => import("./pages/gates/RolePage"))
const BannerManagePage = lazy(() => import("./pages/gates/BannerManagePage").then(m => ({ default: m.BannerManagePage })))
const GridSettingsPage = lazy(() => import("./pages/gates/GridSettingsPage").then(m => ({ default: m.GridSettingsPage })))
const ComplaintPage = lazy(() => import("./pages/gates/ComplaintPage"))
const PhotoRecordsList = lazy(() => import("./pages/photo-records/list"))
const PhotoRecordShow = lazy(() => import("./pages/photo-records/show"))
const VolunteerManagePage = lazy(() => import("./pages/VolunteerManagePage").then(m => ({ default: m.VolunteerManagePage })))
const AnnouncementManagePage = lazy(() => import("./pages/gates/AnnouncementManagePage").then(m => ({ default: m.AnnouncementManagePage })))

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

          {/* 系统管理 */}
          <Route path="users" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<AccountPage />} />} />
          <Route path="role-management" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<RolePage />} />} />

          <Route path="*" element={<RedirectTo to="/desktop/workbench" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
