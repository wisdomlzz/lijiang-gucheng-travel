import { lazy, type ReactNode } from "react"
import { useParams } from "react-router"
import { AppLayout } from "./pages/AppLayout"
import { RedirectTo } from "../shared/components/RedirectTo"

function lazyImport<T extends { [key: string]: any }>(importFn: () => Promise<T>, name: keyof T) {
  return lazy(() => importFn().then((m) => ({ default: m[name] })))
}

function ServiceDetailRedirect() {
  const { id } = useParams()
  return <RedirectTo to={`/c/orders/${id}`} />
}

// ── 懒加载：首页 & 个人 ──
const HomePage = lazyImport(() => import("../features/homepage/c-end/pages/HomePage"), "HomePage")
const AIChatPage = lazyImport(() => import("../features/ai-knowledge/c-end/pages/AIChatPage"), "AIChatPage")
const ProfilePage = lazyImport(() => import("../features/profile/c-end/pages/ProfilePage"), "ProfilePage")
const VisitorServicesPage = lazyImport(() => import("../features/homepage/c-end/pages/VisitorServicesPage"), "VisitorServicesPage")

// ── 懒加载：便民服务 ──
const ServicesPage = lazyImport(() => import("../features/convenience/c-end/pages/ServicesPage"), "ServicesPage")
const ServiceTrackingPage = lazyImport(() => import("../features/convenience/c-end/pages/ServiceTrackingPage"), "ServiceTrackingPage")
const OrderListPage = lazyImport(() => import("../features/convenience/c-end/pages/OrderListPage"), "OrderListPage")
const OrderDetailPage = lazyImport(() => import("../features/convenience/c-end/pages/OrderDetailPage"), "OrderDetailPage")

// ── 懒加载：地址管理 ──
const AddressListPage = lazyImport(() => import("../features/address/c-end/pages/AddressListPage"), "AddressListPage")
const AddressEditPage = lazyImport(() => import("../features/address/c-end/pages/AddressEditPage"), "AddressEditPage")

// ── 懒加载：商户 ──
const MerchantListPage = lazyImport(() => import("../features/content/c-end/pages/MerchantListPage"), "MerchantListPage")
const MerchantDetailPage = lazyImport(() => import("../features/content/c-end/pages/MerchantDetailPage"), "MerchantDetailPage")
const MerchantServicesPage = lazyImport(() => import("../features/merchant-review/c-end/pages/MerchantServicesPage"), "MerchantServicesPage")
const MyShopPage = lazyImport(() => import("../features/merchant-review/c-end/pages/MyShopPage"), "MyShopPage")
const MerchantRegistrationPage = lazyImport(() => import("../features/merchant-review/c-end/pages/MerchantRegistrationPage"), "MerchantRegistrationPage")
const SupplierEntryPage = lazyImport(() => import("../features/supplier/c-end/pages/SupplierEntryPage"), "SupplierEntryPage")

// ── 懒加载：路线 & 遗产 ──
const RoutesPage = lazyImport(() => import("../features/route/c-end/pages/RoutesPage"), "RoutesPage")
const RouteDetailPage = lazyImport(() => import("../features/route/c-end/pages/RouteDetailPage"), "RouteDetailPage")
const RoutePreviewPage = lazyImport(() => import("../features/route/c-end/pages/RoutePreviewPage"), "RoutePreviewPage")
const HeritagePage = lazyImport(() => import("../features/heritage/c-end/pages/HeritagePage"), "HeritagePage")

// ── 懒加载：遗产详情（按类型分立） ──
const RoadDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/RoadDetail"), "RoadDetail")
const WaterDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/WaterDetail"), "WaterDetail")
const WellDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/WellDetail"), "WellDetail")
const BridgeDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/BridgeDetail"), "BridgeDetail")
const AncientTreeDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/AncientTreeDetail"), "AncientTreeDetail")
const ProtectedHouseDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/ProtectedHouseDetail"), "ProtectedHouseDetail")
const HistoricBuildingDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/HistoricBuildingDetail"), "HistoricBuildingDetail")
const HumanEnvironmentDetail = lazyImport(() => import("../features/heritage/c-end/pages/detail/HumanEnvironmentDetail"), "HumanEnvironmentDetail")

// ── 懒加载：地图 & VR ──
const MapPage = lazyImport(() => import("../features/content/c-end/pages/MapPage"), "MapPage")
const VRTourPage = lazyImport(() => import("../features/content/c-end/pages/VRTourPage"), "VRTourPage")

// ── 懒加载：资讯 & 公告 ──
const InfoPage = lazyImport(() => import("../features/info/c-end/pages/InfoPage"), "InfoPage")
const InfoDetailPage = lazyImport(() => import("../features/info/c-end/pages/InfoDetailPage"), "InfoDetailPage")
const NewsPage = lazyImport(() => import("../features/info/c-end/pages/NewsPage"), "NewsPage")
const MyPostsPage = lazyImport(() => import("../features/info/c-end/pages/MyPostsPage"), "MyPostsPage")
const AnnouncementPage = lazyImport(() => import("../features/announcement/c-end/pages/AnnouncementPage"), "AnnouncementPage")
const AnnouncementDetailPage = lazyImport(() => import("../features/announcement/c-end/pages/AnnouncementDetailPage"), "AnnouncementDetailPage")

// ── 懒加载：通知 ──
const NotificationsPage = lazyImport(() => import("../features/notification/c-end/pages/NotificationsPage"), "NotificationsPage")

// ── 懒加载：积分 & 收藏 ──
const PointsCenterPage = lazyImport(() => import("../features/points/c-end/pages/PointsCenterPage"), "PointsCenterPage")
const FavoritesPage = lazyImport(() => import("../features/favorite/c-end/pages/FavoritesPage"), "FavoritesPage")

// ── 懒加载：文化院落 & 预约 ──
const CulturalCourtyardsPage = lazyImport(() => import("../features/booking/c-end/pages/CulturalCourtyardsPage"), "CulturalCourtyardsPage")
const CulturalCourtyardDetailPage = lazyImport(() => import("../features/booking/c-end/pages/CulturalCourtyardDetailPage"), "CulturalCourtyardDetailPage")
const CulturalCourtyardVRPage = lazyImport(() => import("../features/booking/c-end/pages/CulturalCourtyardVRPage"), "CulturalCourtyardVRPage")
const CourtyardBookingPage = lazyImport(() => import("../features/booking/c-end/pages/CourtyardBookingPage"), "CourtyardBookingPage")
const MyBookingsPage = lazyImport(() => import("../features/booking/c-end/pages/MyBookingsPage"), "MyBookingsPage")

// ── 懒加载：签到 & 打卡 ──
const MyCheckinsPage = lazyImport(() => import("../features/checkin/c-end/pages/MyCheckinsPage"), "MyCheckinsPage")
const PhotoRecordsPage = lazyImport(() => import("../features/checkin/c-end/pages/PhotoRecordsPage"), "PhotoRecordsPage")
const PhotoReportPage = lazyImport(() => import("../features/checkin/c-end/pages/PhotoReportPage"), "PhotoReportPage")
const PhotoRecordsDetailPage = lazyImport(() => import("../features/checkin/c-end/pages/PhotoRecordsDetailPage"), "PhotoRecordsDetailPage")
const NaxiCheckInPage = lazyImport(() => import("../features/checkin/c-end/pages/NaxiCheckInPage"), "NaxiCheckInPage")

// ── 懒加载：志愿服务 ──
const VolunteerPlaceholderPage = lazyImport(() => import("../features/volunteer/c-end/pages/VolunteerPlaceholderPage"), "VolunteerPlaceholderPage")
const VolunteerActivitiesPage = lazyImport(() => import("../features/volunteer/c-end/pages/VolunteerActivitiesPage"), "VolunteerActivitiesPage")
const VolunteerActivityDetailPage = lazyImport(() => import("../features/volunteer/c-end/pages/VolunteerActivityDetailPage"), "VolunteerActivityDetailPage")

// ── 懒加载：投诉 ──
const ComplaintFormPage = lazyImport(() => import("../features/complaints/c-end/pages/ComplaintFormPage"), "ComplaintFormPage")
const MyComplaintsPage = lazyImport(() => import("../features/complaints/c-end/pages/MyComplaintsPage"), "MyComplaintsPage")
const ComplaintDetailPage = lazyImport(() => import("../features/complaints/c-end/pages/ComplaintDetailPage"), "ComplaintDetailPage")

// ── 懒加载：公房 ──
const HousingPage = lazyImport(() => import("../features/housing/c-end/pages/HousingPage"), "HousingPage")

// ── 懒加载：搜索结果 ──
const SearchResultsPage = lazyImport(() => import("../features/homepage/c-end/pages/SearchResultsPage"), "SearchResultsPage")

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