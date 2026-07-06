import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Address } from "../../../shared/types"
import { addressesApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type AddressState = {
  addresses: Address[]
  getByUser: (userId: string) => Address[]
  upsert: (addr: Address) => void
  remove: (id: string) => void
  setDefault: (id: string) => void
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      getByUser: (userId) => get().addresses.filter((a) => a.userId === userId),
      upsert: (addr) => {
        const idx = get().addresses.findIndex((a) => a.id === addr.id)
        syncAction("upsertAddress", () => idx >= 0 ? addressesApi.update(addr.id, addr) : addressesApi.create(addr), () => {})
        set((s) => {
          let list = [...s.addresses]
          if (addr.isDefault) list = list.map((a) => ({ ...a, isDefault: false }))
          const idx2 = list.findIndex((a) => a.id === addr.id)
          if (idx2 >= 0) {
            list[idx2] = addr
          } else {
            list.push(addr)
          }
          return { addresses: list }
        })
      },
      remove: (id) => {
        syncAction("removeAddress", () => addressesApi.remove(id), () => {})
        set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }))
      },
      setDefault: (id) => set((s) => ({ addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })) })),
    }),
    {
      name: "lijiang-addresses",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
