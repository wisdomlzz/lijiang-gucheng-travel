import type { User } from "./index"

/**
 * 种子用户 — 简明扼要，每个账号代表一个清晰的业务角色。
 *
 * 角色是叠加的（roles 数组），一个用户可同时是 tourist + supplier。
 *
 * 便民服务人员只保留一个登录账号（李师傅），其余人员（赵丹、张环卫等）
 * 在 staff/store.ts 中作为派单候选池存在，但不需要独立登录账号。
 */
export const seedUsers: User[] = [
  // ── C端 · 纯游客 ──
  { id: "u_c_001", name: "张小游", phone: "13800001001", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", platform: ["c"], roles: ["tourist"] },

  // ── C端 + B端 + 桌面端 · 游客兼商户（客栈老板）──
  // 叠加角色：既能逛古城用便民服务（游客），也能管理客栈后勤（商户）
  { id: "u_c_s_001", name: "张老板", phone: "13800001002", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", platform: ["c", "b", "desktop"], roles: ["tourist", "supplier"], supplierId: "sup_001", roleTag: "古城客栈" },

  // ── B端 · 便民服务人员 ──
  // 登录后进入服务人员工作台，可查看所有类型的指派任务
  { id: "u_s_001", name: "李师傅", phone: "13900002004", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", platform: ["b"], roles: ["service"], staffType: "convenience", supplierId: "sup_001", staffId: "s1", roleTag: "便民服务人员" },

  // ── B端 + 桌面端 · 平台管理员 ──
  { id: "u_a_001", name: "管理员", phone: "18800003001", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", platform: ["b", "desktop"], roles: ["platform_admin"] },
]