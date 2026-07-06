import { create } from "zustand"
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

const SEED: Zone[] =[]

type ZoneState = {
  zones: Zone[]
  getStationsByType: (serviceType: ConvenienceServiceType) => ServiceStation[]
  /** Simple address-based zone lookup for dispatch simulation */
  getZoneByAddress: (address: string) => Zone | undefined
  addZone: (zone: Zone) => void
  removeZone: (zoneId: string) => void
  updateZone: (zoneId: string, patch: Partial<Zone>) => void
  addStation: (zoneId: string, station: ServiceStation) => void
  removeStation: (zoneId: string, stationId: string) => void
}

export const useZoneStore = create<ZoneState>((set, get) => ({
  zones: [],
  getStationsByType: (serviceType) =>
    get().zones.flatMap((z) => z.stations.filter((s) => s.serviceType === serviceType)),
  getZoneByAddress: (address) =>
    get().zones.find((z) => z.stations.some((s) => address.includes(s.address.slice(0, 3)))) ?? get().zones[0],
  addZone: (zone) => set((s) => ({ zones: [...s.zones, zone] })),
  removeZone: (zoneId) => set((s) => ({ zones: s.zones.filter((z) => z.id !== zoneId) })),
  updateZone: (zoneId, patch) =>
    set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)) })),
  addStation: (zoneId, station) =>
    set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? { ...z, stations: [...z.stations, station] } : z)) })),
  removeStation: (zoneId, stationId) =>
    set((s) => ({
      zones: s.zones.map((z) =>
        z.id === zoneId ? { ...z, stations: z.stations.filter((st) => st.id !== stationId) } : z
      ),
    })),
}))

export type { Zone as ZoneModel } from "./zone-store"
