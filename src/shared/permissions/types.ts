export type PermissionAction = {
  code: string
  label: string
}

export type PermissionPage = {
  code: string
  label: string
  actions: PermissionAction[]
}

export type PermissionModule = {
  code: string
  label: string
  pages: PermissionPage[]
}

export type RoleDef = {
  roleId: string
  roleName: string
  description: string
  permissionCodes: string[]
}

export type NavItem = {
  key: string
  label: string
  icon: string
  moduleCode: string
  pageCode: string
  children?: NavItem[]
}
