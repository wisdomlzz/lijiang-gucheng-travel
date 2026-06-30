import { lazy } from "react"
import { useParams } from "react-router"
import { AppLayout } from "./pages/AppLayout"
import { RedirectTo } from "../shared/components/RedirectTo"

function ServiceDetailRedirect() {
  const { id } = useParams();
  return <RedirectTo to={`/c/orders/${id}`} />;
}

// 懒加载所有页面组件
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })))
const AIChatPage = lazy(() => import("./pages/AIChatPage").then(m => ({ default: m.AIChatPage })))
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })))
const ServicesPage = lazy(() => import("./pages/ServicesPage").then(m => ({ default: m.ServicesPage })))
const OrderListPage = lazy(() => import("./pages/OrderListPage").then(m => ({ default: m.OrderListPage })))
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage").then(m => ({ default: m.OrderDetailPage })))
const AddressListPage = lazy(() => import("./pages/AddressListPage").then(m => ({ default: m.AddressListPage })))
const AddressEditPage = lazy(() => import("./pages/AddressEditPage").then(m => ({ default: m.AddressEditPage })))
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })))
const MerchantListPage = lazy(() => import("./pages/MerchantListPage").then(m => ({ default: m.MerchantListPage })))
const MerchantDetailPage = lazy(() => import("./pages/MerchantDetailPage").then(m => ({ default: m.MerchantDetailPage })))
const RouteDetailPage = lazy(() => import("./pages/RouteDetailPage").then(m => ({ default: m.RouteDetailPage })))
const RoutePreviewPage = lazy(() => import("./pages/RoutePreviewPage").then(m => ({ default: m.RoutePreviewPage })))
const HeritagePage = lazy(() => import("./pages/HeritagePage").then(m => ({ default: m.HeritagePage })))
const MapPage = lazy(() => import("./pages/MapPage").then(m => ({ default: m.MapPage })))
const NewsPage = lazy(() => import("./pages/NewsPage").then(m => ({ default: m.NewsPage })))
const RoutesPage = lazy(() => import("./pages/RoutesPage").then(m => ({ default: m.RoutesPage })))
const InfoPage = lazy(() => import("./pages/InfoPage").then(m => ({ default: m.InfoPage })))
const VRTourPage = lazy(() => import("./pages/VRTourPage").then(m => ({ default: m.VRTourPage })))
const InfoDetailPage = lazy(() => import("./pages/InfoDetailPage").then(m => ({ default: m.InfoDetailPage })))
const HousingPage = lazy(() => import("./pages/HousingPage").then(m => ({ default: m.HousingPage })))
const ServiceTrackingPage = lazy(() => import("./pages/ServiceTrackingPage").then(m => ({ default: m.ServiceTrackingPage })))
const MyPostsPage = lazy(() => import("./pages/MyPostsPage").then(m => ({ default: m.MyPostsPage })))
const FavoritesPage = lazy(() => import("./pages/FavoritesPage").then(m => ({ default: m.FavoritesPage })))
const CulturalCourtyardsPage = lazy(() => import("./pages/CulturalCourtyardsPage").then(m => ({ default: m.CulturalCourtyardsPage })))
const CulturalCourtyardDetailPage = lazy(() => import("./pages/CulturalCourtyardDetailPage").then(m => ({ default: m.CulturalCourtyardDetailPage })))
const CulturalCourtyardVRPage = lazy(() => import("./pages/CulturalCourtyardVRPage").then(m => ({ default: m.CulturalCourtyardVRPage })))
const MyCheckinsPage = lazy(() => import("./pages/MyCheckinsPage").then(m => ({ default: m.MyCheckinsPage })))
const PhotoRecordsPage = lazy(() => import("./pages/PhotoRecordsPage").then(m => ({ default: m.PhotoRecordsPage })))
const PhotoReportPage = lazy(() => import("./pages/PhotoReportPage").then(m => ({ default: m.PhotoReportPage })))
const PhotoRecordsDetailPage = lazy(() => import("./pages/PhotoRecordsDetailPage").then(m => ({ default: m.PhotoRecordsDetailPage })))
const VolunteerPlaceholderPage = lazy(() => import("./pages/VolunteerPlaceholderPage").then(m => ({ default: m.VolunteerPlaceholderPage })))
const VolunteerActivitiesPage = lazy(() => import("./pages/VolunteerActivitiesPage").then(m => ({ default: m.VolunteerActivitiesPage })))
const VolunteerActivityDetailPage = lazy(() => import("./pages/VolunteerActivityDetailPage").then(m => ({ default: m.VolunteerActivityDetailPage })))
const ComplaintFormPage = lazy(() => import("./pages/ComplaintFormPage").then(m => ({ default: m.ComplaintFormPage })))
const MyComplaintsPage = lazy(() => import("./pages/MyComplaintsPage").then(m => ({ default: m.MyComplaintsPage })))
const ComplaintDetailPage = lazy(() => import("./pages/ComplaintDetailPage").then(m => ({ default: m.ComplaintDetailPage })))
const AnnouncementPage = lazy(() => import("./pages/AnnouncementPage").then(m => ({ default: m.AnnouncementPage })))
const AnnouncementDetailPage = lazy(() => import("./pages/AnnouncementDetailPage").then(m => ({ default: m.AnnouncementDetailPage })))
const PointsCenterPage = lazy(() => import("./pages/PointsCenterPage").then(m => ({ default: m.PointsCenterPage })))
const NaxiCheckInPage = lazy(() => import("./pages/NaxiCheckInPage").then(m => ({ default: m.NaxiCheckInPage })))
const CourtyardBookingPage = lazy(() => import("./pages/CourtyardBookingPage").then(m => ({ default: m.CourtyardBookingPage })))
const MyBookingsPage = lazy(() => import("./pages/MyBookingsPage").then(m => ({ default: m.MyBookingsPage })))
const MyShopPage = lazy(() => import("./pages/MyShopPage").then(m => ({ default: m.MyShopPage })))

// 遗产详情（按类型分立）
const RoadDetail = lazy(() => import("./pages/heritage/detail/RoadDetail").then(m => ({ default: m.RoadDetail })))
const WaterDetail = lazy(() => import("./pages/heritage/detail/WaterDetail").then(m => ({ default: m.WaterDetail })))
const WellDetail = lazy(() => import("./pages/heritage/detail/WellDetail").then(m => ({ default: m.WellDetail })))
const BridgeDetail = lazy(() => import("./pages/heritage/detail/BridgeDetail").then(m => ({ default: m.BridgeDetail })))
const AncientTreeDetail = lazy(() => import("./pages/heritage/detail/AncientTreeDetail").then(m => ({ default: m.AncientTreeDetail })))
const ProtectedHouseDetail = lazy(() => import("./pages/heritage/detail/ProtectedHouseDetail").then(m => ({ default: m.ProtectedHouseDetail })))
const HistoricBuildingDetail = lazy(() => import("./pages/heritage/detail/HistoricBuildingDetail").then(m => ({ default: m.HistoricBuildingDetail })))
const HumanEnvironmentDetail = lazy(() => import("./pages/heritage/detail/HumanEnvironmentDetail").then(m => ({ default: m.HumanEnvironmentDetail })))

export const cRoutes = [
  {
    element: <AppLayout />,
    children: [
      { path: "home", element: <HomePage /> },
      { path: "ai", element: <AIChatPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "services", element: <ServicesPage /> },
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
  { path: "nearby", element: <MerchantListPage /> },
  { path: "merchant/:id", element: <MerchantDetailPage /> },
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
]
