import type { ReactElement } from "react"
import { useAuthStore } from "../stores/auth-store"
import { usePermissionStore } from "./store"

type PermissionGateProps = {
  code: string
  mode?: "hide" | "disable"
  children: ReactElement
}

export function PermissionGate({ code, mode = "hide", children }: PermissionGateProps) {
  const user = useAuthStore((s) => s.user)
  const roles = usePermissionStore((s) => s.roles)
  const hasPermission = usePermissionStore((s) => s.hasPermission)

  const roleMap: Record<string, string> = {
    platform_admin: "role_admin",
    supplier: "role_supplier",
  }
  const roleId = roleMap[user?.role ?? ""] ?? "role_supplier"
  const allowed = hasPermission(roleId, code)

  if (allowed) return children
  if (mode === "disable") {
    const disabled = { ...children, props: { ...children.props, disabled: true, className: `${children.props.className ?? ""} opacity-40 cursor-not-allowed` } }
    return disabled
  }
  return null
}
