import { lazy } from "react"
import { Navigate, useParams } from "react-router"
import { AppLayout } from "./pages/AppLayout"

function ServiceDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/c/orders/${id}`} replace />;
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
const InfoCreatePage = lazy(() => import("./pages/InfoCreatePage").then(m => ({ default: m.InfoCreatePage })))
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
const ParkingPage = lazy(() => import("./pages/ParkingPage").then(m => ({ default: m.ParkingPage })))
const SupplierEntryPage = lazy(() => import("./pages/SupplierEntryPage").then(m => ({ default: m.SupplierEntryPage })))
const SupplierStatusPage = lazy(() => import("./pages/SupplierStatusPage").then(m => ({ default: m.SupplierStatusPage })))
const VolunteerPlaceholderPage = lazy(() => import("./pages/VolunteerPlaceholderPage").then(m => ({ default: m.VolunteerPlaceholderPage })))
const VolunteerActivitiesPage = lazy(() => import("./pages/VolunteerActivitiesPage").then(m => ({ default: m.VolunteerActivitiesPage })))
const VolunteerActivityDetailPage = lazy(() => import("./pages/VolunteerActivityDetailPage").then(m => ({ default: m.VolunteerActivityDetailPage })))
const ComplaintFormPage = lazy(() => import("./pages/ComplaintFormPage").then(m => ({ default: m.ComplaintFormPage })))
const MyComplaintsPage = lazy(() => import("./pages/MyComplaintsPage").then(m => ({ default: m.MyComplaintsPage })))
const ComplaintDetailPage = lazy(() => import("./pages/ComplaintDetailPage").then(m => ({ default: m.ComplaintDetailPage })))

// 遗产详情（统一页面）
const HeritageDetailPage = lazy(() => import("./pages/heritage/HeritageDetailPage").then(m => ({ default: m.HeritageDetailPage })))

export const cRoutes = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
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
  { path: "heritage/:type/:id", element: <HeritageDetailPage /> },
  { path: "vr-tour", element: <VRTourPage /> },
  { path: "info", element: <InfoPage /> },
  { path: "info/create", element: <InfoCreatePage /> },
  { path: "info/:id", element: <InfoDetailPage /> },
  { path: "housing", element: <HousingPage /> },
  { path: "service-track/:id", element: <ServiceTrackingPage /> },
  { path: "service-detail/:id", element: <ServiceDetailRedirect /> },
  { path: "news", element: <NewsPage /> },
  { path: "my-posts", element: <MyPostsPage /> },
  { path: "favorites", element: <FavoritesPage /> },
  { path: "courtyards", element: <CulturalCourtyardsPage /> },
  { path: "courtyard/:id", element: <CulturalCourtyardDetailPage /> },
  { path: "courtyard/:id/vr", element: <CulturalCourtyardVRPage /> },
  { path: "my-checkins", element: <MyCheckinsPage /> },
  { path: "achievements", element: <Navigate to="/c/courtyards" replace /> },
  { path: "parking", element: <ParkingPage /> },
  { path: "volunteer", element: <VolunteerPlaceholderPage /> },
  { path: "volunteer/activities", element: <VolunteerActivitiesPage /> },
  { path: "volunteer/activities/:id", element: <VolunteerActivityDetailPage /> },
  { path: "photo-records", element: <PhotoRecordsPage /> },
  { path: "photo-records/:id", element: <PhotoRecordsDetailPage /> },
  { path: "photo-report", element: <PhotoReportPage /> },
  { path: "supplier-entry", element: <SupplierEntryPage /> },
  { path: "supplier-status", element: <SupplierStatusPage /> },
]
