import type { PermissionModule, RoleDef } from "./types"

export const allModules: PermissionModule[] = [
  {
    code: "dashboard", label: "工作台",
    pages: [{ code: "dashboard", label: "工作台首页", actions: [{ code: "dashboard.view", label: "查看" }] }],
  },
  {
    code: "supplier", label: "供应商管理",
    pages: [
      { code: "supplier.list", label: "供应商列表", actions: [{ code: "supplier.list.view", label: "查看" }, { code: "supplier.list.export", label: "导出" }] },
      { code: "supplier.audit", label: "供应商审核", actions: [{ code: "supplier.audit.approve", label: "通过" }, { code: "supplier.audit.reject", label: "拒绝" }, { code: "supplier.audit.batch", label: "批量通过" }, { code: "supplier.audit.blacklist", label: "永久拒绝" }] },
      { code: "supplier.detail", label: "供应商详情", actions: [{ code: "supplier.detail.view", label: "查看" }, { code: "supplier.detail.disable", label: "禁用" }] },
    ],
  },
  {
    code: "staff", label: "服务人员管理",
    pages: [
      { code: "staff.list", label: "服务人员列表", actions: [{ code: "staff.list.view", label: "查看" }, { code: "staff.list.edit", label: "编辑" }, { code: "staff.list.disable", label: "禁用" }] },
      { code: "staff.schedule", label: "排班管理", actions: [{ code: "staff.schedule.set", label: "设置排班" }] },
      { code: "staff.dispatch", label: "派单管理", actions: [{ code: "staff.dispatch.view", label: "查看" }, { code: "staff.dispatch.assign", label: "指派" }, { code: "staff.dispatch.reassign", label: "重新指派" }] },
    ],
  },
  {
    code: "user", label: "用户管理",
    pages: [
      { code: "user.list", label: "用户列表", actions: [{ code: "user.list.view", label: "查看" }, { code: "user.list.ban", label: "封禁" }] },
    ],
  },
  {
    code: "content", label: "内容管理",
    pages: [
      { code: "content.banner", label: "轮播图管理", actions: [{ code: "content.banner.add", label: "新增" }, { code: "content.banner.edit", label: "编辑" }, { code: "content.banner.delete", label: "删除" }] },
      { code: "content.scenicNews", label: "景区资讯", actions: [{ code: "content.scenicNews.view", label: "查看" }, { code: "content.scenicNews.publish", label: "发布" }] },
      { code: "content.travelGuides", label: "古城攻略", actions: [{ code: "content.travelGuides.view", label: "查看" }, { code: "content.travelGuides.publish", label: "发布" }] },
    ],
  },
  {
    code: "complaint", label: "投诉管理",
    pages: [
      { code: "complaint.list", label: "投诉列表", actions: [{ code: "complaint.list.view", label: "查看" }, { code: "complaint.list.accept", label: "受理" }] },
      { code: "complaint.process", label: "投诉处理", actions: [{ code: "complaint.process.dispatch", label: "派单" }, { code: "complaint.process.review", label: "审核" }, { code: "complaint.process.arbitrate", label: "仲裁" }] },
    ],
  },
  {
    code: "convenience", label: "便民服务管理",
    pages: [
      { code: "convenience.orders", label: "订单管理", actions: [{ code: "convenience.orders.view", label: "查看" }, { code: "convenience.orders.dispatch", label: "手动派单" }, { code: "convenience.orders.cancelApprove", label: "取消审批" }] },
      { code: "convenience.monitor", label: "派单监控", actions: [{ code: "convenience.monitor.view", label: "查看" }] },
      { code: "convenience.grid", label: "片区网格管理", actions: [{ code: "convenience.grid.view", label: "查看" }, { code: "convenience.grid.edit", label: "编辑" }] },
    ],
  },
  {
    code: "finance", label: "财务管理",
    pages: [
      { code: "finance.ledger", label: "供应商台账", actions: [{ code: "finance.ledger.view", label: "查看" }, { code: "finance.ledger.generate", label: "生成对账单" }, { code: "finance.ledger.pay", label: "标记已打款" }] },
      { code: "finance.revenue", label: "自营收入", actions: [{ code: "finance.revenue.view", label: "查看" }, { code: "finance.revenue.export", label: "导出" }] },
    ],
  },
  {
    code: "mall", label: "商城管理后台",
    pages: [
      { code: "mall.admin", label: "商城后台入口", actions: [{ code: "mall.admin.open", label: "打开" }] },
      { code: "mall.supplier", label: "供应商入驻", actions: [{ code: "mall.supplier.view", label: "查看" }, { code: "mall.supplier.audit", label: "审核" }] },
    ],
  },
  {
    code: "analytics", label: "访问统计",
    pages: [
      { code: "analytics.overview", label: "数据总览", actions: [{ code: "analytics.overview.view", label: "查看" }, { code: "analytics.overview.export", label: "导出" }] },
    ],
  },
  {
    code: "scores", label: "诚信评分",
    pages: [
      { code: "scores.list", label: "评分列表", actions: [{ code: "scores.list.view", label: "查看" }] },
    ],
  },
  {
    code: "points", label: "积分管理",
    pages: [
      { code: "points.config", label: "积分配置", actions: [{ code: "points.config.view", label: "查看" }, { code: "points.config.edit", label: "编辑" }] },
      { code: "points.ledger", label: "积分台账", actions: [{ code: "points.ledger.view", label: "查看" }, { code: "points.ledger.export", label: "导出" }] },
    ],
  },
  {
    code: "system", label: "系统配置",
    pages: [
      { code: "system.role", label: "权限管理", actions: [{ code: "system.role.view", label: "查看" }, { code: "system.role.add", label: "新增角色" }, { code: "system.role.edit", label: "编辑角色" }, { code: "system.role.delete", label: "删除角色" }, { code: "system.role.assign", label: "分配权限" }] },
      { code: "system.audit", label: "操作审计", actions: [{ code: "system.audit.view", label: "查看" }, { code: "system.audit.export", label: "导出" }] },
    ],
  },
]

export const seedRoles: RoleDef[] = [
  {
    roleId: "role_admin",
    roleName: "平台管理员",
    description: "全部数据与操作权限",
    permissionCodes: ["*"],  // wildcard = all
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

export const supplierRoleTemplate: RoleDef = {
  roleId: "",
  roleName: "",
  description: "",
  permissionCodes: [],
}
