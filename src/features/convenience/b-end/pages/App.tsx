import { Suspense } from "react"
import { Routes, Route } from "react-router"
import { BLayout } from "../../../../b-end/BLayout"
import { ServiceWorkbench } from "./ServiceWorkbench"
import { ServiceTasks } from "./ServiceTasks"
import { ServiceHistory } from "./ServiceHistory"
import { ServiceProfile } from "./ServiceProfile"
import { StaffRegister } from "./StaffRegister"
import { QuoteAndPhotoFlow } from "./QuoteAndPhotoFlow"
import { BNotificationsPage } from "./BNotificationsPage"
import { RedirectTo } from "../../../../shared/components/RedirectTo"

export function ServiceApp() {
  return (
    <BLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full min-h-[400px] text-sm text-text-tertiary">
            加载中...
          </div>
        }
      >
        <Routes>
          <Route index element={<RedirectTo to="/b/service/workbench" />} />
          <Route path="workbench" element={<ServiceWorkbench />} />
          <Route path="tasks" element={<ServiceTasks />} />
          <Route path="history" element={<ServiceHistory />} />
          <Route path="profile" element={<ServiceProfile />} />
          <Route path="register" element={<StaffRegister />} />
          <Route path="quote" element={<QuoteAndPhotoFlow {...({} as any)} />} />
          <Route path="notifications" element={<BNotificationsPage />} />
          <Route path="*" element={<RedirectTo to="/b/service/workbench" />} />
        </Routes>
      </Suspense>
    </BLayout>
  )
}
