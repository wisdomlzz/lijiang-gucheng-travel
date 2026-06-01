import { create } from "zustand"
import type { RoleDef } from "./types"
import { seedRoles, allModules } from "./seed-roles"

type PermissionState = {
  roles: RoleDef[]
  modules: typeof allModules

  getRole: (roleId: string) => RoleDef | undefined
  hasPermission: (roleId: string, actionCode: string) => boolean
  addRole: (role: RoleDef) => void
  updateRole: (roleId: string, updates: Partial<RoleDef>) => void
  deleteRole: (roleId: string) => void
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  roles: seedRoles,
  modules: allModules,

  getRole: (roleId) => get().roles.find((r) => r.roleId === roleId),

  hasPermission: (roleId, actionCode) => {
    const role = get().roles.find((r) => r.roleId === roleId)
    if (!role) return false
    if (role.permissionCodes.includes("*")) return true
    return role.permissionCodes.includes(actionCode)
  },

  addRole: (role) =>
    set((s) => ({ roles: [...s.roles, role] })),

  updateRole: (roleId, updates) =>
    set((s) => ({
      roles: s.roles.map((r) => (r.roleId === roleId ? { ...r, ...updates } : r)),
    })),

  deleteRole: (roleId) =>
    set((s) => ({ roles: s.roles.filter((r) => r.roleId !== roleId) })),
}))
