// Mock data for the Lijiang Ancient City admin backend

export const trendData = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(2026, 4, 2 + i)
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    amount: 80000 + Math.round(Math.sin(i) * 18000) + i * 5200,
    orders: 320 + Math.round(Math.cos(i) * 60) + i * 12,
  }
})

export const categoryData = [
  { name: "便民服务", value: 42 },
  { name: "购物信息", value: 28 },
  { name: "文化院落", value: 18 },
  { name: "游客咨询", value: 12 },
]

export const auditLogs = [
  {
    id: "L20260508-001",
    op: "审核通过",
    target: "供应商 古城东巴文创工坊",
    operator: "admin01",
    ip: "10.10.2.18",
    time: "2026-05-08 11:20",
  },
  {
    id: "L20260508-002",
    op: "取消审批",
    target: "便民服务订单 CO20260509002",
    operator: "ops02",
    ip: "10.10.2.31",
    time: "2026-05-08 10:45",
  },
  {
    id: "L20260508-003",
    op: "禁用供应商",
    target: "雪山下酒吧",
    operator: "admin01",
    ip: "10.10.2.18",
    time: "2026-05-08 10:20",
  },
  {
    id: "L20260508-004",
    op: "导出对账单",
    target: "2026年4月 全平台",
    operator: "finance01",
    ip: "10.10.2.50",
    time: "2026-05-08 09:50",
  },
]

export const guides = [
  {
    id: "g_001",
    name: "和师傅",
    source: "景区自营",
    supplierId: "self",
    langs: ["中文", "英文"],
    score: 4.8,
    orders: 126,
    status: "正常",
  },
  {
    id: "g_002",
    name: "李师傅",
    source: "景区自营",
    supplierId: "self",
    langs: ["中文"],
    score: 4.6,
    orders: 98,
    status: "正常",
  },
  {
    id: "g_003",
    name: "王师傅",
    source: "第三方",
    supplierId: "sup_001",
    langs: ["中文", "英文", "日文"],
    score: 4.9,
    orders: 203,
    status: "正常",
  },
  {
    id: "g_004",
    name: "赵师傅",
    source: "第三方",
    supplierId: "sup_002",
    langs: ["中文"],
    score: 4.3,
    orders: 67,
    status: "休息中",
  },
  {
    id: "g_005",
    name: "陈师傅",
    source: "景区自营",
    supplierId: "self",
    langs: ["中文", "英文"],
    score: 4.7,
    orders: 154,
    status: "正常",
  },
  {
    id: "g_006",
    name: "杨师傅",
    source: "第三方",
    supplierId: "sup_003",
    langs: ["中文"],
    score: 4.4,
    orders: 82,
    status: "已离职",
  },
]

export interface DesktopUser {
  id: string
  nickname: string
  phone: string
  level: "普通" | "银牌" | "金牌" | "钻石"
  points: number
  orders: number
  totalSpend: number
  regTime: string
  status: "正常" | "已封禁"
}

export const users: DesktopUser[] = [
  {
    id: "u_001",
    nickname: "纳西小旅人",
    phone: "138****5621",
    level: "金牌",
    points: 1280,
    orders: 16,
    totalSpend: 3520,
    regTime: "2025-12-01",
    status: "正常",
  },
  {
    id: "u_002",
    nickname: "古城漫步者",
    phone: "139****8732",
    level: "银牌",
    points: 560,
    orders: 8,
    totalSpend: 1280,
    regTime: "2026-01-15",
    status: "正常",
  },
  {
    id: "u_003",
    nickname: "玉龙探险家",
    phone: "186****4501",
    level: "钻石",
    points: 3200,
    orders: 42,
    totalSpend: 12500,
    regTime: "2025-06-20",
    status: "正常",
  },
  {
    id: "u_004",
    nickname: "束河摄影师",
    phone: "150****2398",
    level: "普通",
    points: 120,
    orders: 3,
    totalSpend: 480,
    regTime: "2026-03-10",
    status: "正常",
  },
  {
    id: "u_005",
    nickname: "白沙画匠",
    phone: "187****6712",
    level: "金牌",
    points: 980,
    orders: 21,
    totalSpend: 6200,
    regTime: "2025-09-05",
    status: "已封禁",
  },
  {
    id: "u_006",
    nickname: "雪山守护者",
    phone: "136****3344",
    level: "普通",
    points: 50,
    orders: 1,
    totalSpend: 200,
    regTime: "2026-04-01",
    status: "正常",
  },
  {
    id: "u_007",
    nickname: "东巴传人",
    phone: "187****1122",
    level: "钻石",
    points: 5600,
    orders: 68,
    totalSpend: 22000,
    regTime: "2024-11-01",
    status: "正常",
  },
  {
    id: "u_008",
    nickname: "茶马行者",
    phone: "139****5566",
    level: "金牌",
    points: 1650,
    orders: 24,
    totalSpend: 7800,
    regTime: "2025-08-15",
    status: "正常",
  },
  {
    id: "u_009",
    nickname: "束河小扎",
    phone: "186****7788",
    level: "银牌",
    points: 720,
    orders: 11,
    totalSpend: 3200,
    regTime: "2026-02-20",
    status: "正常",
  },
  {
    id: "u_010",
    nickname: "古城里的猫",
    phone: "150****9900",
    level: "普通",
    points: 180,
    orders: 4,
    totalSpend: 680,
    regTime: "2026-04-25",
    status: "已封禁",
  },
  {
    id: "u_011",
    nickname: "丽江小调",
    phone: "138****1234",
    level: "金牌",
    points: 2100,
    orders: 35,
    totalSpend: 9800,
    regTime: "2025-05-10",
    status: "正常",
  },
  {
    id: "u_012",
    nickname: "四方街掌柜",
    phone: "137****5678",
    level: "钻石",
    points: 4200,
    orders: 56,
    totalSpend: 18600,
    regTime: "2024-09-01",
    status: "正常",
  },
]
