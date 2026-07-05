import { lazy, type ReactNode } from "react"
import { useParams } from "react-router"
import { AppLayout } from "./pages/AppLayout"
import { RedirectTo } from "../shared/components/RedirectTo"

function ServiceDetailRedirect() {
  const { id } = useParams()
  return <RedirectTo to={`/c/orders/${id}`} />
}

// ── 懒加载：首页 & 个人 ──
const HomePage = lazy(() => import("../features/homepage/c-end/pages/HomePage").then((m) => ({ default: m.HomePage })))
const AIChatPage = lazy(() =>
  import("../features/ai-knowledge/c-end/pages/AIChatPage").then((m) => ({ default: m.AIChatPage }))
)
const ProfilePage = lazy(() =>
  import("../features/profile/c-end/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
)
const VisitorServicesPage = lazy(() =>
  import("../features/homepage/c-end/pages/VisitorServicesPage").then((m) => ({ default: m.VisitorServicesPage }))
)

// ── 懒加载：便民服务 ──
const ServicesPage = lazy(() =>
  import("../features/convenience/c-end/pages/ServicesPage").then((m) => ({ default: m.ServicesPage }))
)
const ServiceTrackingPage = lazy(() =>
  import("../features/convenience/c-end/pages/ServiceTrackingPage").then((m) => ({ default: m.ServiceTrackingPage }))
)
const OrderListPage = lazy(() =>
  import("../features/convenience/c-end/pages/OrderListPage").then((m) => ({ default: m.OrderListPage }))
)
const OrderDetailPage = lazy(() =>
  import("../features/convenience/c-end/pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
)

// ── 懒加载：地址管理 ──
const AddressListPage = lazy(() =>
  import("../features/address/c-end/pages/AddressListPage").then((m) => ({ default: m.AddressListPage }))
)
const AddressEditPage = lazy(() =>
  import("../features/address/c-end/pages/AddressEditPage").then((m) => ({ default: m.AddressEditPage }))
)

// ── 懒加载：商户 ──
const MerchantListPage = lazy(() =>
  import("../features/content/c-end/pages/MerchantListPage").then((m) => ({ default: m.MerchantListPage }))
)
const MerchantDetailPage = lazy(() =>
  import("../features/content/c-end/pages/MerchantDetailPage").then((m) => ({ default: m.MerchantDetailPage }))
)
const MerchantServicesPage = lazy(() =>
  import("../features/merchant-review/c-end/pages/MerchantServicesPage").then((m) => ({
    default: m.MerchantServicesPage,
  }))
)
const MyShopPage = lazy(() =>
  import("../features/merchant-review/c-end/pages/MyShopPage").then((m) => ({ default: m.MyShopPage }))
)
const MerchantRegistrationPage = lazy(() =>
  import("../features/merchant-review/c-end/pages/MerchantRegistrationPage").then((m) => ({
    default: m.MerchantRegistrationPage,
  }))
)
const SupplierEntryPage = lazy(() =>
  import("../features/supplier/c-end/pages/SupplierEntryPage").then((m) => ({ default: m.SupplierEntryPage }))
)

// ── 懒加载：路线 & 遗产 ──
const RoutesPage = lazy(() =>
  import("../features/route/c-end/pages/RoutesPage").then((m) => ({ default: m.RoutesPage }))
)
const RouteDetailPage = lazy(() =>
  import("../features/route/c-end/pages/RouteDetailPage").then((m) => ({ default: m.RouteDetailPage }))
)
const RoutePreviewPage = lazy(() =>
  import("../features/route/c-end/pages/RoutePreviewPage").then((m) => ({ default: m.RoutePreviewPage }))
)
const HeritagePage = lazy(() =>
  import("../features/heritage/c-end/pages/HeritagePage").then((m) => ({ default: m.HeritagePage }))
)

// ── 懒加载：遗产详情（按类型分立） ──
const RoadDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/RoadDetail").then((m) => ({ default: m.RoadDetail }))
)
const WaterDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/WaterDetail").then((m) => ({ default: m.WaterDetail }))
)
const WellDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/WellDetail").then((m) => ({ default: m.WellDetail }))
)
const BridgeDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/BridgeDetail").then((m) => ({ default: m.BridgeDetail }))
)
const AncientTreeDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/AncientTreeDetail").then((m) => ({ default: m.AncientTreeDetail }))
)
const ProtectedHouseDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/ProtectedHouseDetail").then((m) => ({
    default: m.ProtectedHouseDetail,
  }))
)
const HistoricBuildingDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/HistoricBuildingDetail").then((m) => ({
    default: m.HistoricBuildingDetail,
  }))
)
const HumanEnvironmentDetail = lazy(() =>
  import("../features/heritage/c-end/pages/detail/HumanEnvironmentDetail").then((m) => ({
    default: m.HumanEnvironmentDetail,
  }))
)

// ── 懒加载：地图 & VR ──
const MapPage = lazy(() => import("../features/content/c-end/pages/MapPage").then((m) => ({ default: m.MapPage })))
const VRTourPage = lazy(() =>
  import("../features/content/c-end/pages/VRTourPage").then((m) => ({ default: m.VRTourPage }))
)

// ── 懒加载：资讯 & 公告 ──
const InfoPage = lazy(() => import("../features/info/c-end/pages/InfoPage").then((m) => ({ default: m.InfoPage })))
const InfoDetailPage = lazy(() =>
  import("../features/info/c-end/pages/InfoDetailPage").then((m) => ({ default: m.InfoDetailPage }))
)
const NewsPage = lazy(() => import("../features/info/c-end/pages/NewsPage").then((m) => ({ default: m.NewsPage })))
const MyPostsPage = lazy(() =>
  import("../features/info/c-end/pages/MyPostsPage").then((m) => ({ default: m.MyPostsPage }))
)
const AnnouncementPage = lazy(() =>
  import("../features/announcement/c-end/pages/AnnouncementPage").then((m) => ({ default: m.AnnouncementPage }))
)
const AnnouncementDetailPage = lazy(() =>
  import("../features/announcement/c-end/pages/AnnouncementDetailPage").then((m) => ({
    default: m.AnnouncementDetailPage,
  }))
)

// ── 懒加载：通知 ──
const NotificationsPage = lazy(() =>
  import("../features/notification/c-end/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
)

// ── 懒加载：积分 & 收藏 ──
const PointsCenterPage = lazy(() =>
  import("../features/points/c-end/pages/PointsCenterPage").then((m) => ({ default: m.PointsCenterPage }))
)
const FavoritesPage = lazy(() =>
  import("../features/favorite/c-end/pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage }))
)

// ── 懒加载：文化院落 & 预约 ──
const CulturalCourtyardsPage = lazy(() =>
  import("../features/booking/c-end/pages/CulturalCourtyardsPage").then((m) => ({ default: m.CulturalCourtyardsPage }))
)
const CulturalCourtyardDetailPage = lazy(() =>
  import("../features/booking/c-end/pages/CulturalCourtyardDetailPage").then((m) => ({
    default: m.CulturalCourtyardDetailPage,
  }))
)
const CulturalCourtyardVRPage = lazy(() =>
  import("../features/booking/c-end/pages/CulturalCourtyardVRPage").then((m) => ({
    default: m.CulturalCourtyardVRPage,
  }))
)
const CourtyardBookingPage = lazy(() =>
  import("../features/booking/c-end/pages/CourtyardBookingPage").then((m) => ({ default: m.CourtyardBookingPage }))
)
const MyBookingsPage = lazy(() =>
  import("../features/booking/c-end/pages/MyBookingsPage").then((m) => ({ default: m.MyBookingsPage }))
)

// ── 懒加载：签到 & 打卡 ──
const MyCheckinsPage = lazy(() =>
  import("../features/checkin/c-end/pages/MyCheckinsPage").then((m) => ({ default: m.MyCheckinsPage }))
)
const PhotoRecordsPage = lazy(() =>
  import("../features/checkin/c-end/pages/PhotoRecordsPage").then((m) => ({ default: m.PhotoRecordsPage }))
)
const PhotoReportPage = lazy(() =>
  import("../features/checkin/c-end/pages/PhotoReportPage").then((m) => ({ default: m.PhotoReportPage }))
)
const PhotoRecordsDetailPage = lazy(() =>
  import("../features/checkin/c-end/pages/PhotoRecordsDetailPage").then((m) => ({ default: m.PhotoRecordsDetailPage }))
)
const NaxiCheckInPage = lazy(() =>
  import("../features/checkin/c-end/pages/NaxiCheckInPage").then((m) => ({ default: m.NaxiCheckInPage }))
)

// ── 懒加载：志愿服务 ──
const VolunteerPlaceholderPage = lazy(() =>
  import("../features/volunteer/c-end/pages/VolunteerPlaceholderPage").then((m) => ({
    default: m.VolunteerPlaceholderPage,
  }))
)
const VolunteerActivitiesPage = lazy(() =>
  import("../features/volunteer/c-end/pages/VolunteerActivitiesPage").then((m) => ({
    default: m.VolunteerActivitiesPage,
  }))
)
const VolunteerActivityDetailPage = lazy(() =>
  import("../features/volunteer/c-end/pages/VolunteerActivityDetailPage").then((m) => ({
    default: m.VolunteerActivityDetailPage,
  }))
)

// ── 懒加载：投诉 ──
const ComplaintFormPage = lazy(() =>
  import("../features/complaints/c-end/pages/ComplaintFormPage").then((m) => ({ default: m.ComplaintFormPage }))
)
const MyComplaintsPage = lazy(() =>
  import("../features/complaints/c-end/pages/MyComplaintsPage").then((m) => ({ default: m.MyComplaintsPage }))
)
const ComplaintDetailPage = lazy(() =>
  import("../features/complaints/c-end/pages/ComplaintDetailPage").then((m) => ({ default: m.ComplaintDetailPage }))
)

// ── 懒加载：公房 ──
const HousingPage = lazy(() =>
  import("../features/housing/c-end/pages/HousingPage").then((m) => ({ default: m.HousingPage }))
)

// ── 懒加载：搜索结果 ──
const SearchResultsPage = lazy(() =>
  import("../features/homepage/c-end/pages/SearchResultsPage").then((m) => ({ default: m.SearchResultsPage }))
)

type CRoute =
  | { path: string; element: ReactNode }
  | { element: ReactNode; children: { path?: string; index?: boolean; element: ReactNode }[] }

export const cRoutes: CRoute[] = [
  {
    element: <AppLayout />,
    children: [
      { path: "home", element: <HomePage /> },
      { path: "ai", element: <AIChatPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "visitor-services", element: <VisitorServicesPage /> },
      { path: "merchant-services", element: <MerchantServicesPage /> },
    ],
  },
  { path: "orders", element: <OrderListPage /> },
  { path: "orders/:id", element: <OrderDetailPage /> },
  { path: "addresses", element: <AddressListPage /> },
  { path: "addresses/edit/:id", element: <AddressEditPage /> },
  { path: "notifications", element: <NotificationsPage /> },
  { path: "complaint", element: <ComplaintFormPage /> },
  { path: "my-complaints", element: <MyComplaintsPage /> },
  { path: "complaint/:id", element: <ComplaintDetailPage /> },
  { path: "merchants", element: <MerchantListPage /> },
  { path: "merchant/:id", element: <MerchantDetailPage /> },
  { path: "search", element: <SearchResultsPage /> },
  { path: "routes", element: <RoutesPage /> },
  { path: "routes/:id", element: <RouteDetailPage /> },
  { path: "routes/:id/preview", element: <RoutePreviewPage /> },
  { path: "map", element: <MapPage /> },
  { path: "heritage", element: <HeritagePage /> },
  { path: "heritage/road/:id", element: <RoadDetail /> },
  { path: "heritage/water/:id", element: <WaterDetail /> },
  { path: "heritage/well/:id", element: <WellDetail /> },
  { path: "heritage/bridge/:id", element: <BridgeDetail /> },
  { path: "heritage/ancient-tree/:id", element: <AncientTreeDetail /> },
  { path: "heritage/protected-house/:id", element: <ProtectedHouseDetail /> },
  { path: "heritage/historic-building/:id", element: <HistoricBuildingDetail /> },
  { path: "heritage/human-environment/:id", element: <HumanEnvironmentDetail /> },
  { path: "vr-tour", element: <VRTourPage /> },
  { path: "info", element: <InfoPage /> },
  { path: "info/:id", element: <InfoDetailPage /> },
  { path: "housing", element: <HousingPage /> },
  { path: "service-track/:id", element: <ServiceTrackingPage /> },
  { path: "service-detail/:id", element: <ServiceDetailRedirect /> },
  { path: "news", element: <NewsPage /> },
  { path: "notice", element: <AnnouncementPage /> },
  { path: "announcement/:id", element: <AnnouncementDetailPage /> },
  { path: "my-posts", element: <MyPostsPage /> },
  { path: "favorites", element: <FavoritesPage /> },
  { path: "courtyards", element: <CulturalCourtyardsPage /> },
  { path: "courtyard/:id", element: <CulturalCourtyardDetailPage /> },
  { path: "courtyard/:id/vr", element: <CulturalCourtyardVRPage /> },
  { path: "my-checkins", element: <MyCheckinsPage /> },
  { path: "achievements", element: <RedirectTo to="/c/courtyards" /> },
  { path: "volunteer", element: <VolunteerPlaceholderPage /> },
  { path: "volunteer/activities", element: <VolunteerActivitiesPage /> },
  { path: "volunteer/activities/:id", element: <VolunteerActivityDetailPage /> },
  { path: "photo-records", element: <PhotoRecordsPage /> },
  { path: "photo-records/:id", element: <PhotoRecordsDetailPage /> },
  { path: "photo-report", element: <PhotoReportPage /> },
  { path: "points", element: <PointsCenterPage /> },
  { path: "naxi-checkin", element: <NaxiCheckInPage /> },
  { path: "courtyard/:id/booking", element: <CourtyardBookingPage /> },
  { path: "my-bookings", element: <MyBookingsPage /> },
  { path: "my-shop", element: <MyShopPage /> },
  { path: "merchant-register", element: <MerchantRegistrationPage /> },
  { path: "supplier-entry", element: <SupplierEntryPage /> },
]
