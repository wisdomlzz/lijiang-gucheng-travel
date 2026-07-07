import { create } from "zustand"
import { staffApi } from "@/api/client"
import { syncAction } from "@/api/sync"
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

type StaffState = {
  staff: StaffItem[]
  autoDispatch: boolean
  getStaffBySupplier: (supplierId: string) => StaffItem[]
  getAvailable: (supplierId: string) => StaffItem[]
  getConvenienceStaffByType: (serviceType: ConvenienceServiceType) => StaffItem[]
  getConvenienceStaffByZone: (zoneId: string, serviceType: ConvenienceServiceType) => StaffItem[]
  addStaff: (item: Partial<StaffItem> & { supplierId: string; name: string; phone: string }) => Promise<void>
  updateStaff: (id: string, patch: Partial<StaffItem>) => Promise<void>
  toggleEnabled: (id: string) => Promise<void>
  setStaffStatus: (id: string, status: StaffItem["status"]) => Promise<void>
  removeStaff: (id: string) => Promise<void>
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
  addStaff: async (item) => {
    await syncAction(
      "addStaff",
      () =>
        staffApi.create({
          supplierId: item.supplierId,
          name: item.name,
          phone: item.phone,
          enabled: item.enabled ?? true,
          status: item.status ?? "offline",
          assignedOrders: 0,
          joinedAt: item.joinedAt ?? new Date().toISOString().slice(0, 10),
          serviceTypes: item.serviceTypes ?? [],
          zoneIds: item.zoneIds ?? [],
        }),
      (result: StaffItem) => {
        set((s) => ({ staff: [...s.staff, result] }))
      }
    )
  },
  updateStaff: async (id, patch) => {
    await syncAction(
      "updateStaff",
      () => staffApi.update(id, patch),
      (result: StaffItem) => {
        set((s) => ({ staff: s.staff.map((x) => (x.id === id ? result : x)) }))
      }
    )
  },
  toggleEnabled: async (id) => {
    const current = get().staff.find((s) => s.id === id)
    if (!current) return
    await syncAction(
      "toggleEnabled",
      () => staffApi.update(id, { enabled: !current.enabled }),
      (result: StaffItem) => {
        set((s) => ({ staff: s.staff.map((x) => (x.id === id ? result : x)) }))
      }
    )
  },
  setStaffStatus: async (id, status) => {
    await syncAction(
      "setStaffStatus",
      () => staffApi.update(id, { status }),
      (result: StaffItem) => {
        set((s) => ({ staff: s.staff.map((x) => (x.id === id ? result : x)) }))
      }
    )
  },
  removeStaff: async (id) => {
    await syncAction(
      "removeStaff",
      () => staffApi.remove(id),
      () => {
        set((s) => ({ staff: s.staff.filter((x) => x.id !== id) }))
      }
    )
  },
  setAutoDispatch: (val) => set({ autoDispatch: val }),
}))
