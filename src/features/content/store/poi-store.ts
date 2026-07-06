import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { ParkingLot, MapPOI } from "../../../shared/types/content-types"

type State = {
  parkings: ParkingLot[]
  pois: MapPOI[]
  addParking: (item: ParkingLot) => Promise<void>
  updateParking: (id: string, fields: Partial<ParkingLot>) => Promise<void>
  deleteParking: (id: string) => Promise<void>
  addPOI: (item: MapPOI) => Promise<void>
  updatePOI: (id: string, fields: Partial<MapPOI>) => Promise<void>
  deletePOI: (id: string) => Promise<void>
}

export const useContentPOIStore = create<State>((set) => ({
  parkings: [],
  pois: [],
  addParking: async (item) => {
    await syncAction("parking.add", () => contentApi.pois.create(item), (result) => {
      set((s) => ({ parkings: [result, ...s.parkings] }))
    })
  },
  updateParking: async (id, fields) => {
    await syncAction("parking.update", () => contentApi.pois.update(id, fields), (result) => {
      set((s) => ({ parkings: s.parkings.map((p) => (p.id === id ? result : p)) }))
    })
  },
  deleteParking: async (id) => {
    await syncAction("parking.delete", () => contentApi.pois.remove(id), () => {
      set((s) => ({ parkings: s.parkings.filter((p) => p.id !== id) }))
    })
  },
  addPOI: async (item) => {
    await syncAction("poi.add", () => contentApi.pois.create(item), (result) => {
      set((s) => ({ pois: [result, ...s.pois] }))
    })
  },
  updatePOI: async (id, fields) => {
    await syncAction("poi.update", () => contentApi.pois.update(id, fields), (result) => {
      set((s) => ({ pois: s.pois.map((p) => (p.id === id ? result : p)) }))
    })
  },
  deletePOI: async (id) => {
    await syncAction("poi.delete", () => contentApi.pois.remove(id), () => {
      set((s) => ({ pois: s.pois.filter((p) => p.id !== id) }))
    })
  },
}))
