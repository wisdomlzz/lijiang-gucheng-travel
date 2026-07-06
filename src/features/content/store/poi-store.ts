import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { ParkingLot, MapPOI } from "../../../shared/types/content-types"

const DEFAULT_PARKINGS: ParkingLot[] = []

const DEFAULT_POIS: MapPOI[] = []

type State = {
  parkings: ParkingLot[]
  pois: MapPOI[]
  addParking: (item: ParkingLot) => void
  updateParking: (id: string, fields: Partial<ParkingLot>) => void
  deleteParking: (id: string) => void
  addPOI: (item: MapPOI) => void
  updatePOI: (id: string, fields: Partial<MapPOI>) => void
  deletePOI: (id: string) => void
}

export const useContentPOIStore = create<State>((set) => ({
  parkings: [],
  pois: [],
  addParking: (item) => {
    syncAction("parking.add", () => contentApi.pois.create(item), () => {})
    set((s) => ({ parkings: [...s.parkings, item] }))
  },
  updateParking: (id, fields) => {
    syncAction("parking.update", () => contentApi.pois.update(id, fields), () => {})
    set((s) => ({ parkings: s.parkings.map((p) => (p.id === id ? { ...p, ...fields } : p)) }))
  },
  deleteParking: (id) => {
    syncAction("parking.delete", () => contentApi.pois.remove(id), () => {})
    set((s) => ({ parkings: s.parkings.filter((p) => p.id !== id) }))
  },
  addPOI: (item) => {
    syncAction("poi.add", () => contentApi.pois.create(item), () => {})
    set((s) => ({ pois: [...s.pois, item] }))
  },
  updatePOI: (id, fields) => {
    syncAction("poi.update", () => contentApi.pois.update(id, fields), () => {})
    set((s) => ({ pois: s.pois.map((p) => (p.id === id ? { ...p, ...fields } : p)) }))
  },
  deletePOI: (id) => {
    syncAction("poi.delete", () => contentApi.pois.remove(id), () => {})
    set((s) => ({ pois: s.pois.filter((p) => p.id !== id) }))
  },
}))
