import { create } from "zustand"
import type { ConvenienceServiceType } from "../../../shared/types"

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

/**
 * 便民服务人员派单候选池（6 人 × 覆盖全部 6 种服务类型）。
 * 仅李师傅有独立登录账号，其余为后台派单使用。
 */
const SEED: StaffItem[] =[]

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
  staff: [],
  autoDispatch: false,
  getStaffBySupplier: (supplierId) => get().staff.filter((s) => s.supplierId === supplierId),
  getAvailable: (supplierId) =>
    get().staff.filter((s) => s.supplierId === supplierId && s.enabled && s.status === "online"),
  getConvenienceStaffByType: (serviceType) =>
    get().staff.filter((s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(serviceType)),
  getConvenienceStaffByZone: (zoneId, serviceType) =>
    get().staff.filter(
      (s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(serviceType) && s.zoneIds?.includes(zoneId)
    ),
  addStaff: (item) =>
    set((s) => ({
      staff: [
        ...s.staff,
        {
          id: `s${Date.now()}`,
          supplierId: item.supplierId,
          name: item.name,
          phone: item.phone,
          enabled: true,
          status: "offline",
          assignedOrders: 0,
          joinedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    })),
  toggleEnabled: (id) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)) })),
  setStaffStatus: (id, status) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, status } : x)) })),
  removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
  setAutoDispatch: (val) => set({ autoDispatch: val }),
}))
