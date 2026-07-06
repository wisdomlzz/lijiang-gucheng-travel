import { create } from "zustand"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { ConvenienceServiceType } from "../../../shared/types"

export interface ServiceStation {
  id: string
  zoneId: string
  serviceType: ConvenienceServiceType
  name: string
  address: string
  lat: number
  lng: number
}
export interface Zone {
  id: string
  name: string
  stations: ServiceStation[]
}

type ZoneState = {
  zones: Zone[]
  getStationsByType: (serviceType: ConvenienceServiceType) => ServiceStation[]
  /** Simple address-based zone lookup for dispatch simulation */
  getZoneByAddress: (address: string) => Zone | undefined
  addZone: (zone: Zone) => Promise<void>
  removeZone: (zoneId: string) => Promise<void>
  updateZone: (zoneId: string, patch: Partial<Zone>) => Promise<void>
  addStation: (zoneId: string, station: ServiceStation) => Promise<void>
  removeStation: (zoneId: string, stationId: string) => Promise<void>
}

export const useZoneStore = create<ZoneState>((set, get) => ({
  zones: [],
  getStationsByType: (serviceType) =>
    get().zones.flatMap((z) => z.stations.filter((s) => s.serviceType === serviceType)),
  getZoneByAddress: (address) =>
    get().zones.find((z) => z.stations.some((s) => address.includes(s.address.slice(0, 3)))) ?? get().zones[0],
  addZone: async (zone) => {
    await syncAction<Zone>(
      "zone.add",
      () => api.create("zones", zone),
      (result) => set((s) => ({ zones: [...s.zones, result] })),
    )
  },
  removeZone: async (zoneId) => {
    await syncAction(
      "zone.remove",
      () => api.remove("zones", zoneId),
      () => set((s) => ({ zones: s.zones.filter((z) => z.id !== zoneId) })),
    )
  },
  updateZone: async (zoneId, patch) => {
    await syncAction<Zone>(
      "zone.update",
      () => api.update("zones", zoneId, patch),
      (result) => set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? result : z)) })),
    )
  },
  addStation: async (zoneId, station) => {
    const zone = get().zones.find((z) => z.id === zoneId)
    if (!zone) return
    const newStations = [...zone.stations, station]
    await syncAction<Zone>(
      "zone.addStation",
      () => api.update("zones", zoneId, { stations: newStations }),
      (result) => set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? result : z)) })),
    )
  },
  removeStation: async (zoneId, stationId) => {
    const zone = get().zones.find((z) => z.id === zoneId)
    if (!zone) return
    const newStations = zone.stations.filter((st) => st.id !== stationId)
    await syncAction<Zone>(
      "zone.removeStation",
      () => api.update("zones", zoneId, { stations: newStations }),
      (result) => set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? result : z)) })),
    )
  },
}))

export type { Zone as ZoneModel } from "./zone-store"