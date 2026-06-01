import { create } from "zustand"
import type { Zone, ServiceStation, ConvenienceServiceType } from "../types"

export const SEED_ZONES: Zone[] = [
  {
    id: "zone_core",
    name: "古城核心区",
    stations: [
      { id: "st_core_water", zoneId: "zone_core", serviceType: "送水服务", name: "古城送水站", address: "新华街翠文段", lat: 26.875, lng: 100.232 },
      { id: "st_core_trash", zoneId: "zone_core", serviceType: "生活垃圾清运", name: "古城垃圾中转站", address: "光义街", lat: 26.873, lng: 100.234 },
      { id: "st_core_wash", zoneId: "zone_core", serviceType: "布草配送", name: "古城洗涤厂", address: "七一街", lat: 26.874, lng: 100.236 },
    ],
  },
  {
    id: "zone_south",
    name: "古城南门",
    stations: [
      { id: "st_south_water", zoneId: "zone_south", serviceType: "送水服务", name: "南门送水站", address: "南门街", lat: 26.868, lng: 100.234 },
      { id: "st_south_trash", zoneId: "zone_south", serviceType: "生活垃圾清运", name: "南门垃圾站", address: "南门路", lat: 26.867, lng: 100.233 },
    ],
  },
  {
    id: "zone_inn",
    name: "客栈片区",
    stations: [
      { id: "st_inn_water", zoneId: "zone_inn", serviceType: "送水服务", name: "客栈区送水站", address: "五一街", lat: 26.879, lng: 100.238 },
      { id: "st_inn_wash", zoneId: "zone_inn", serviceType: "布草配送", name: "客栈洗涤厂", address: "振兴巷", lat: 26.880, lng: 100.240 },
      { id: "st_inn_trash", zoneId: "zone_inn", serviceType: "生活垃圾清运", name: "客栈垃圾站", address: "文治巷", lat: 26.878, lng: 100.239 },
    ],
  },
  {
    id: "zone_outskirt",
    name: "景区外围",
    stations: [
      { id: "st_out_construction", zoneId: "zone_outskirt", serviceType: "建筑垃圾清运", name: "建筑垃圾处理厂", address: "民主路", lat: 26.862, lng: 100.225 },
    ],
  },
]

type ZoneState = {
  zones: Zone[]
  getZoneByStation: (stationId: string) => Zone | undefined
  getStationsByType: (serviceType: ConvenienceServiceType) => ServiceStation[]
  getZoneByAddress: (address: string) => Zone | undefined
  addZone: (zone: Zone) => void
  removeZone: (zoneId: string) => void
  updateZone: (zoneId: string, patch: Partial<Zone>) => void
  addStation: (zoneId: string, station: ServiceStation) => void
  removeStation: (zoneId: string, stationId: string) => void
}

export const useZoneStore = create<ZoneState>((set, get) => ({
  zones: SEED_ZONES,

  getZoneByStation: (stationId) =>
    get().zones.find((z) => z.stations.some((s) => s.id === stationId)),

  getStationsByType: (serviceType) =>
    get().zones.flatMap((z) => z.stations.filter((s) => s.serviceType === serviceType)),

  getZoneByAddress: (address) => {
    const zones = get().zones
    for (const z of zones) {
      for (const s of z.stations) {
        if (address.includes(s.address.slice(0, 3))) return z
      }
    }
    return zones[0]
  },

  addZone: (zone) => set((s) => ({ zones: [...s.zones, zone] })),
  removeZone: (zoneId) => set((s) => ({ zones: s.zones.filter((z) => z.id !== zoneId) })),
  updateZone: (zoneId, patch) =>
    set((s) => ({ zones: s.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)) })),

  addStation: (zoneId, station) =>
    set((s) => ({
      zones: s.zones.map((z) =>
        z.id === zoneId ? { ...z, stations: [...z.stations, station] } : z
      ),
    })),

  removeStation: (zoneId, stationId) =>
    set((s) => ({
      zones: s.zones.map((z) =>
        z.id === zoneId
          ? { ...z, stations: z.stations.filter((st) => st.id !== stationId) }
          : z
      ),
    })),
}))
