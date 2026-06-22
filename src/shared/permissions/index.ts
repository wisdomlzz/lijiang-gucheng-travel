import { create } from "zustand"

// ── 仅保留实际用到的两个角色定义 ──

export type RoleDef = {
  roleId: string
  roleName: string
  description: string
  permissionCodes: string[]
}

const seedRoles: RoleDef[] = [
  {
    roleId: "role_admin",
    roleName: "平台管理员",
    description: "全部数据与操作权限",
    permissionCodes: ["*"],
  },
  {
    roleId: "role_supplier",
    roleName: "供应商",
    description: "供应商入驻与商城后台单点登录",
    permissionCodes: [
      "mall.admin.open",
      "mall.supplier.view",
      "dashboard.view",
    ],
  },
]

type PermissionState = {
  roles: RoleDef[]
  hasPermission: (roleId: string, actionCode: string) => boolean
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  roles: seedRoles,

  hasPermission: (roleId, actionCode) => {
    const role = get().roles.find((r) => r.roleId === roleId)
    if (!role) return false
    if (role.permissionCodes.includes("*")) return true
    return role.permissionCodes.includes(actionCode)
  },
}))
