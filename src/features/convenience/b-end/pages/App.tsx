import { Suspense } from "react"
import { Routes, Route } from "react-router"
import { BLayout } from "../../../../b-end/BLayout"
import { Skeleton } from "../../../../shared/components/ui/skeleton"
import { ServiceWorkbench } from "./ServiceWorkbench"
import { ServiceTasks } from "./ServiceTasks"
import { ServiceHistory } from "./ServiceHistory"
import { ServiceProfile } from "./ServiceProfile"
import { StaffRegister } from "./StaffRegister"
import { BNotificationsPage } from "./BNotificationsPage"
import { RedirectTo } from "../../../../shared/components/RedirectTo"

export function ServiceApp() {
  return (
    <BLayout>
      <Suspense
        fallback={
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
          <Route path="notifications" element={<BNotificationsPage />} />
          <Route path="*" element={<RedirectTo to="/b/service/workbench" />} />
        </Routes>
      </Suspense>
    </BLayout>
  )
}
