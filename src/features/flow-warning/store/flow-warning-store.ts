import { create } from "zustand"
import { api } from "@/api/client"

// ============================================================
// 人流量预警 —— 区域数据由后端 API 提供;模拟波动为 Demo 功能
// ============================================================

export type WarningLevel = "green" | "yellow" | "orange" | "red"

export const LEVEL_META: Record<WarningLevel, { label: string; color: string; bg: string; threshold: string }> = {
  green: { label: "通畅", color: "text-emerald-600", bg: "bg-emerald-100", threshold: "< 60%" },
  yellow: { label: "偏多", color: "text-amber-600", bg: "bg-amber-100", threshold: "60%-80%" },
  orange: { label: "拥挤", color: "text-orange-600", bg: "bg-orange-100", threshold: "80%-95%" },
  red: { label: "预警", color: "text-red-600", bg: "bg-red-100", threshold: "> 95%" },
}

export interface WarningArea {
  id: string
  name: string
  capacity: number // 最大承载量
  current: number // 当前人流
  level: WarningLevel // 当前等级（由 current/capacity 推导）
  lng: number
  lat: number
}

export interface WarningRule {
  id: string
  areaId: string
  areaName: string
  yellowThreshold: number // 百分比 0-100
  orangeThreshold: number
  redThreshold: number
  enabled: boolean
}

export interface WarningEvent {
  id: string
  areaName: string
  level: WarningLevel
  current: number
  capacity: number
  triggeredAt: string
  status: "active" | "resolved"
  action?: string // 疏导措施
}

type FlowWarningState = {
  areas: WarningArea[]
  rules: WarningRule[]
  events: WarningEvent[]

  getAreaLevel: (areaId: string) => WarningLevel
  loadAreas: () => Promise<void>
  // 模拟人流变化（Demo：刷新即随机波动）
  simulateFlow: () => void
  // 触发预警（超阈值自动生成事件）
  triggerWarning: (areaId: string) => void
  resolveEvent: (id: string) => void

  // 规则管理
  updateRule: (id: string, patch: Partial<WarningRule>) => void
}

function calcLevel(current: number, capacity: number, rule?: WarningRule): WarningLevel {
  const pct = capacity > 0 ? (current / capacity) * 100 : 0
  if (!rule) {
    if (pct >= 95) return "red"
    if (pct >= 80) return "orange"
    if (pct >= 60) return "yellow"
    return "green"
  }
  if (pct >= rule.redThreshold) return "red"
  if (pct >= rule.orangeThreshold) return "orange"
  if (pct >= rule.yellowThreshold) return "yellow"
  return "green"
}

const SEED_AREAS: WarningArea[] = [
  { id: "area_sq", name: "四方街", capacity: 3000, current: 1850, level: "yellow", lng: 100.2345, lat: 26.868 },
  { id: "area_yh", name: "玉河广场", capacity: 2000, current: 1650, level: "orange", lng: 100.232, lat: 26.872 },
  { id: "area_mf", name: "木府", capacity: 1500, current: 420, level: "green", lng: 100.228, lat: 26.867 },
  { id: "area_nm", name: "古城南门", capacity: 2500, current: 2380, level: "red", lng: 100.237, lat: 26.865 },
  { id: "area_bm", name: "古城北门", capacity: 2500, current: 1200, level: "yellow", lng: 100.2325, lat: 26.8735 },
  { id: "area_sdj", name: "狮子山", capacity: 1000, current: 280, level: "green", lng: 100.229, lat: 26.87 },
]

const SEED_RULES: WarningRule[] = SEED_AREAS.map((a) => ({
  id: `rule_${a.id}`,
  areaId: a.id,
  areaName: a.name,
  yellowThreshold: 60,
  orangeThreshold: 80,
  redThreshold: 95,
  enabled: true,
}))

const SEED_EVENTS: WarningEvent[] = [
  {
    id: "we1",
    areaName: "古城南门",
    level: "red",
    current: 2380,
    capacity: 2500,
    triggeredAt: "2026-06-29 14:20",
    status: "active",
    action: "已启动单向通行疏导，增派 3 名引导员",
  },
  {
    id: "we2",
    areaName: "玉河广场",
    level: "orange",
    current: 1650,
    capacity: 2000,
    triggeredAt: "2026-06-29 13:45",
    status: "active",
    action: "建议游客分流至木府方向",
  },
  {
    id: "we3",
    areaName: "四方街",
    level: "yellow",
    current: 1850,
    capacity: 3000,
    triggeredAt: "2026-06-28 16:00",
    status: "resolved",
    action: "人流已回落",
  },
]

export const useFlowWarningStore = create<FlowWarningState>((set, get) => ({
  areas: [],
  rules: [],
  events: [],

  loadAreas: async () => {
    try {
      const data: any = await api.list("flow-areas", { pageSize: 50 })
      if (data?.items) {
        const areas = data.items.map((a: any) => ({
          id: a.id,
          name: a.name,
          capacity: a.capacity,
          current: a.current,
          level: a.level as WarningLevel,
          lng: a.lng,
          lat: a.lat,
        }))
        const rules = areas.map((a: any) => ({
          id: `rule_${a.id}`,
          areaId: a.id,
          areaName: a.name,
          yellowThreshold: 60,
          orangeThreshold: 80,
          redThreshold: 95,
          enabled: true,
        }))
        set({ areas, rules })
      }
    } catch {
      // API 不可用时保持空数组
    }
  },

  getAreaLevel: (areaId) => {
    const area = get().areas.find((a) => a.id === areaId)
    const rule = get().rules.find((r) => r.areaId === areaId && r.enabled)
    if (!area) return "green"
    return calcLevel(area.current, area.capacity, rule)
  },

  simulateFlow: () =>
    set((s) => ({
      areas: s.areas.map((a) => {
        const delta = Math.floor((Math.random() - 0.4) * a.capacity * 0.15)
        const current = Math.max(0, Math.min(a.capacity, a.current + delta))
        const rule = s.rules.find((r) => r.areaId === a.id && r.enabled)
        return { ...a, current, level: calcLevel(current, a.capacity, rule) }
      }),
    })),

  triggerWarning: (areaId) => {
    const area = get().areas.find((a) => a.id === areaId)
    if (!area) return
    const level = get().getAreaLevel(areaId)
    if (level === "green") return
    // 避免重复触发
    const exists = get().events.some((e) => e.areaName === area.name && e.status === "active")
    if (exists) return
    set((s) => ({
      events: [
        {
          id: `we${Date.now()}`,
          areaName: area.name,
          level,
          current: area.current,
          capacity: area.capacity,
          triggeredAt: new Date().toLocaleString("zh-CN"),
          status: "active",
          action: level === "red" ? "建议启动应急预案，单向通行" : level === "orange" ? "建议游客分流" : "持续监测",
        },
        ...s.events,
      ],
    }))
  },

  resolveEvent: (id) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, status: "resolved" } : e)) })),
  updateRule: (id, patch) => set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
}))
