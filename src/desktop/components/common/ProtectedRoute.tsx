import { ReactNode } from "react"
import { Navigate } from "react-router"

interface ProtectedRouteProps {
  element: ReactNode
  isAllowed: boolean
  redirectTo?: string
}

export function ProtectedRoute({ element, isAllowed, redirectTo = "/desktop/workbench" }: ProtectedRouteProps) {
  return isAllowed ? element : <Navigate to={redirectTo} replace />
}
