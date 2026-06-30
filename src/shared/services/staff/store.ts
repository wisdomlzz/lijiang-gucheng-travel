import { create } from "zustand"
import type { ConvenienceServiceType } from "../types"

export interface StaffItem {
  id: string
  supplierId: string
  name: string
  phone: string
  enabled: boolean
  status: "online" | "busy" | "rest" | "offline"
  assignedOrders: number
  joinedAt: string
  serviceTypes?: ConvenienceServiceType[]
  zoneIds?: string[]
  lat?: number
  lng?: number
}

const SEED: StaffItem[] = [
  { id: "s1", supplierId: "sup_001", name: "李师傅", phone: "139****6666", enabled: true, status: "busy", assignedOrders: 9, joinedAt: "2026-02-01", serviceTypes: ["行李搬运", "送货服务"], lat: 26.872, lng: 100.231 },
  { id: "s5", supplierId: "sup_001", name: "王师傅", phone: "139****6670", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-03-15", serviceTypes: ["行李搬运", "送货服务"], lat: 26.870, lng: 100.235 },
  { id: "s2", supplierId: "sup_001", name: "赵丹", phone: "139****6667", enabled: true, status: "online", assignedOrders: 2, joinedAt: "2026-02-15", serviceTypes: ["行李搬运", "送货服务"], lat: 26.873, lng: 100.236 },
  { id: "s6", supplierId: "sup_001", name: "张环卫", phone: "139****6671", enabled: true, status: "online", assignedOrders: 1, joinedAt: "2026-01-10", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_core", "zone_south"], lat: 26.874, lng: 100.233 },
  { id: "s7", supplierId: "sup_001", name: "刘环卫", phone: "139****6672", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-04-01", serviceTypes: ["生活垃圾清运"], zoneIds: ["zone_inn"], lat: 26.879, lng: 100.238 },
  { id: "s3", supplierId: "sup_001", name: "马师傅", phone: "139****6668", enabled: true, status: "online", assignedOrders: 3, joinedAt: "2026-03-01", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_core"], lat: 26.871, lng: 100.229 },
  { id: "s8", supplierId: "sup_001", name: "送水工老赵", phone: "139****6673", enabled: true, status: "busy", assignedOrders: 5, joinedAt: "2026-02-20", serviceTypes: ["送水服务"], zoneIds: ["zone_core", "zone_inn"], lat: 26.876, lng: 100.232 },
  { id: "s9", supplierId: "sup_001", name: "送水工小陈", phone: "139****6674", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-05-01", serviceTypes: ["送水服务"], zoneIds: ["zone_south"], lat: 26.868, lng: 100.234 },
  { id: "s4", supplierId: "sup_001", name: "小陈", phone: "139****6669", enabled: true, status: "online", assignedOrders: 1, joinedAt: "2026-03-10", serviceTypes: ["布草配送", "送水服务"], zoneIds: ["zone_inn"], lat: 26.878, lng: 100.239 },
  { id: "s10", supplierId: "sup_001", name: "布草老黄", phone: "139****6675", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-03-05", serviceTypes: ["布草配送"], zoneIds: ["zone_core", "zone_inn"], lat: 26.875, lng: 100.237 },
  { id: "s11", supplierId: "sup_001", name: "建筑垃圾老王", phone: "139****6676", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-04-15", serviceTypes: ["建筑垃圾清运"], zoneIds: ["zone_outskirt"], lat: 26.863, lng: 100.226 },
]

type StaffState = {
  staff: StaffItem[]
  autoDispatch: boolean
  getStaffBySupplier: (supplierId: string) => StaffItem[]
  getAvailable: (supplierId: string) => StaffItem[]
  getConvenienceStaffByType: (serviceType: ConvenienceServiceType) => StaffItem[]
  getConvenienceStaffByZone: (zoneId: string, serviceType: ConvenienceServiceType) => StaffItem[]
  addStaff: (item: { supplierId: string; name: string; phone: string }) => void
  toggleEnabled: (id: string) => void
  setStaffStatus: (id: string, status: StaffItem["status"]) => void
  removeStaff: (id: string) => void
  setAutoDispatch: (val: boolean) => void
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: SEED,
  autoDispatch: false,
  getStaffBySupplier: (supplierId) => get().staff.filter((s) => s.supplierId === supplierId),
  getAvailable: (supplierId) => get().staff.filter((s) => s.supplierId === supplierId && s.enabled && s.status === "online"),
  getConvenienceStaffByType: (serviceType) => get().staff.filter((s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(serviceType)),
  getConvenienceStaffByZone: (zoneId, serviceType) => get().staff.filter((s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(serviceType) && s.zoneIds?.includes(zoneId)),
  addStaff: (item) => set((s) => ({ staff: [...s.staff, { id: `s${Date.now()}`, supplierId: item.supplierId, name: item.name, phone: item.phone, enabled: true, status: "offline", assignedOrders: 0, joinedAt: new Date().toISOString().slice(0, 10) }] })),
  toggleEnabled: (id) => set((s) => ({ staff: s.staff.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x) })),
  setStaffStatus: (id, status) => set((s) => ({ staff: s.staff.map((x) => x.id === id ? { ...x, status } : x) })),
  removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
  setAutoDispatch: (val) => set({ autoDispatch: val }),
}))
