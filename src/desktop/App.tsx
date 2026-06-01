import { Suspense, lazy } from "react"
import { Routes, Route, Navigate } from "react-router"
import { useAuthStore } from "../shared/stores/auth-store"
import { LoginPageDesktop } from "../shared/components/LoginPageDesktop"
import { DesktopLayout } from "./DesktopLayout"
import { CrudRoutes } from "./components/common/CrudRoutes"
import { ProtectedRoute } from "./components/common/ProtectedRoute"
import { LegacyPlaceholderPage } from "./pages/common/LegacyPlaceholderPage"

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
const SettingsPage = lazy(() => import("./pages/gates/SettingsPage"))
const BannerManagePage = lazy(() => import("./pages/gates/BannerManagePage").then(m => ({ default: m.BannerManagePage })))
const GridSettingsPage = lazy(() => import("./pages/gates/GridSettingsPage").then(m => ({ default: m.GridSettingsPage })))
const ComplaintPage = lazy(() => import("./pages/gates/ComplaintPage"))
const PhotoRecordsList = lazy(() => import("./pages/photo-records/list"))
const PhotoRecordShow = lazy(() => import("./pages/photo-records/show"))
const HeritageListPage = lazy(() => import("./pages/heritage/list"))
const HeritageShowPage = lazy(() => import("./pages/heritage/show"))
const HeritageCreatePage = lazy(() => import("./pages/heritage/create"))
const HeritageEditPage = lazy(() => import("./pages/heritage/edit"))
const AIKnowledgeBasePage = lazy(() => import("./pages/AIKnowledgeBasePage").then(m => ({ default: m.AIKnowledgeBasePage })))
const VolunteerManagePage = lazy(() => import("./pages/VolunteerManagePage").then(m => ({ default: m.VolunteerManagePage })))

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
          <Route path="*" element={<Navigate to="/desktop/login" replace />} />
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
          <Route path="*" element={<Navigate to="/desktop/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<DesktopLayout />}>
          <Route index element={<Navigate to="/desktop/workbench" replace={true} />} />
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

          {/* 内容管理 */}
          <Route path="scenic-news" element={<LegacyPlaceholderPage title="景区资讯" description="复用旧版后台：标题、图片、视频、作者、分类（资讯/公告/公房公告）、排序、图文内容；新增、编辑、删除、审核；按标题/审核状态检索。" />} />
          <Route path="travel-guides" element={<LegacyPlaceholderPage title="古城攻略" description="复用旧版后台：标题、摘要、图片、视频、作者、排序、图文内容；新增、编辑、删除、审核；按标题/审核状态检索。" />} />
          <Route path="service-center" element={<LegacyPlaceholderPage title="服务中心" description="复用旧版后台：服务中心图文介绍，支持新建、编辑、删除、审核、排序和官网展示。" />} />
          <Route path="policies" element={<LegacyPlaceholderPage title="政策法规" description="复用旧版后台：政策法规图文内容维护，审核通过后展示在官网景区资讯栏目。" />} />
          <Route path="protection-guide" element={<LegacyPlaceholderPage title="保护指南" description="复用旧版后台：保护指南图文内容维护，支持按标题和审核状态检索。" />} />
          <Route path="procedures" element={<LegacyPlaceholderPage title="办事流程" description="复用旧版后台：办事流程图文内容维护，支持排序、审核和发布状态。" />} />
          <Route path="heritage-fee" element={<LegacyPlaceholderPage title="古城维护费" description="复用旧版后台：古城维护费图文内容维护，审核通过后官网展示。" />} />
          <Route path="cultural-heritage" element={<LegacyPlaceholderPage title="文化古城" description="复用旧版后台：古城文化、东巴文化、民风民俗、纳西古乐等分类内容维护。" />} />
          <Route path="cultural-journal" element={<LegacyPlaceholderPage title="文化期刊" description="复用旧版后台：文化期刊 PDF 文件、排序、审核和官网展示维护。" />} />
          <Route path="image-library" element={<LegacyPlaceholderPage title="图片标识共享库" description="复用旧版后台：图片标识共享库图文内容、摘要、排序和审核维护。" />} />
          <Route path="videos" element={<LegacyPlaceholderPage title="古城视频" description="复用旧版后台：封面图、视频文件、排序、图文内容和审核维护。" />} />
          <Route path="featured-routes" element={<LegacyPlaceholderPage title="精选线路" description="复用旧版后台：线路名称、简介、线路大图、游览时长、交通方式、景点数量、排序和图文内容。" />} />
          <Route path="recommended-routes" element={<LegacyPlaceholderPage title="推荐线路" description="复用旧版后台：推荐线路封面、图文内容、价格、旅行社、电话、标签、排序和审核维护。" />} />

          {/* 遗产管理 */}
          <Route path="heritage" element={<LegacyPlaceholderPage title="遗产知识" description="遗产知识管理已迁移至老管理平台，支持遗产条目的增删改查、分类管理和地图标注。" />} />
          <Route path="heritage/*" element={<LegacyPlaceholderPage title="遗产知识" description="遗产知识管理已迁移至老管理平台，支持遗产条目的增删改查、分类管理和地图标注。" />} />

          {/* 运营管理 */}
          <Route path="banner" element={<BannerManagePage />} />
          <Route path="grid-settings" element={<GridSettingsPage />} />
          <Route path="complaints" element={<ComplaintPage />} />
          <Route path="photo-records" element={<PhotoRecordsList />} />
          <Route path="photo-records/:id" element={<PhotoRecordShow />} />
          <Route path="ai-knowledge" element={<LegacyPlaceholderPage title="AI知识库" description="AI知识库管理已迁移至老管理平台，支持知识条目的导入、问答配置和启用停用。" />} />
          <Route path="volunteer" element={<VolunteerManagePage />} />

          {/* 系统管理 */}
          <Route path="users" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<SettingsPage />} />} />
          <Route path="role-management" element={<ProtectedRoute isAllowed={isSuperAdmin} element={<SettingsPage />} />} />
          <Route path="data-analysis" element={<LegacyPlaceholderPage title="访问统计" description="复用旧版后台：站点累计访问量、热门栏目、热门访问时段；按日/月/年查询。" />} />
          <Route path="company-profile" element={<LegacyPlaceholderPage title="公司概况" description="复用旧版后台：公司名称、排序、图文内容、发布/未发布；同一时间仅一篇发布内容前端展示。" />} />
          <Route path="website-management" element={<LegacyPlaceholderPage title="网站管理" description="复用旧版后台：官网弹窗内容新建、编辑、删除、启用/停用和跳转地址维护。" />} />
          <Route path="merchant-review" element={<LegacyPlaceholderPage title="商家审核" description="复用旧版后台：查询小程序用户提交的入驻信息，支持按商家名称、商户类型、状态检索，并通过/不通过审核。" />} />
          <Route path="audit" element={<LegacyPlaceholderPage title="操作审计" description="复用旧版后台：操作日志记录与查询。" />} />

          <Route path="*" element={<Navigate to="/desktop/workbench" replace={true} />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
