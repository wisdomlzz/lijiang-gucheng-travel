import { Routes, Route, Navigate } from "react-router"
import { BLayout } from "../../BLayout"
import { ServiceWorkbench } from "./ServiceWorkbench"
import { ServiceTasks } from "./ServiceTasks"
import { ServiceHistory } from "./ServiceHistory"
import { ServiceProfile } from "./ServiceProfile"
import { QuoteAndPhotoFlow } from "./QuoteAndPhotoFlow"
import { BNotificationsPage } from "./BNotificationsPage"

export function ServiceApp() {
  return (
    <BLayout>
      <Routes>
        <Route index element={<Navigate to="/b/service/workbench" replace />} />
        <Route path="workbench" element={<ServiceWorkbench />} />
        <Route path="tasks" element={<ServiceTasks />} />
        <Route path="history" element={<ServiceHistory />} />
        <Route path="profile" element={<ServiceProfile />} />
        <Route path="quote" element={<QuoteAndPhotoFlow />} />
        <Route path="notifications" element={<BNotificationsPage />} />
        <Route path="*" element={<Navigate to="/b/service/workbench" replace />} />
      </Routes>
    </BLayout>
  )
}
