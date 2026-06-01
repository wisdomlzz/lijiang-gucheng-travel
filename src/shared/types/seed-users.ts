import type { User } from "./index"

export const seedUsers: User[] = [
  // C端游客
  { id: "u_c_001", name: "游客张小游", phone: "13800001001", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", platform: ["c"], role: "tourist" },

  // B端供应商（B端 + 桌面端均可登录）
  { id: "u_b_001", name: "古城文创·王老板", phone: "13900002001", avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100", platform: ["c", "b", "desktop"], role: "supplier", supplierId: "sup_001" },

  // B端便民服务人员
  { id: "u_s_001", name: "李师傅（便民服务）", phone: "13900002004", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s1", roleTag: "便民服务人员" },
  { id: "u_s_002", name: "赵丹（便民服务）", phone: "13900002005", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s2", roleTag: "便民服务人员" },
  { id: "u_s_003", name: "马师傅（便民服务）", phone: "13900002006", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s3", roleTag: "便民服务人员" },
  { id: "u_s_004", name: "小陈（便民服务）", phone: "13900002007", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s4", roleTag: "便民服务人员" },

  // 平台管理员（B端 + 桌面端）
  { id: "u_a_001", name: "平台管理员", phone: "18800003001", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", platform: ["b", "desktop"], role: "platform_admin" },

  // B端便民服务人员补充
  { id: "u_s_010", name: "布草老黄", phone: "13900002010", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s10", roleTag: "便民服务人员" },
  { id: "u_s_011", name: "建筑垃圾老王", phone: "13900002011", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", platform: ["b"], role: "service", staffType: "convenience", supplierId: "sup_001", staffId: "s11", roleTag: "便民服务人员" },
]
