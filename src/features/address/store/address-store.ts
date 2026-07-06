import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Address } from "../../../shared/types"
import { addressesApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type AddressState = {
  addresses: Address[]
  getByUser: (userId: string) => Address[]
  upsert: (addr: Address) => Promise<void>
  remove: (id: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      getByUser: (userId) => get().addresses.filter((a) => a.userId === userId),
      upsert: async (addr) => {
        const idx = get().addresses.findIndex((a) => a.id === addr.id)
        await syncAction(
          "upsertAddress",
          () => (idx >= 0 ? addressesApi.update(addr.id, addr) : addressesApi.create(addr)),
          (result) => {
            set((s) => {
              let list = [...s.addresses]
              if (result.isDefault) list = list.map((a) => ({ ...a, isDefault: false }))
              const idx2 = list.findIndex((a) => a.id === result.id)
              if (idx2 >= 0) {
                list[idx2] = result
              } else {
                list.push(result)
              }
              return { addresses: list }
            })
          },
        )
      },
      remove: async (id) => {
        await syncAction("removeAddress", () => addressesApi.remove(id), () => {
          set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }))
        })
      },
      setDefault: async (id) => {
        const all = get().addresses
        await syncAction(
          "setDefaultAddress",
          async () => {
            for (const a of all) {
              if (a.isDefault || a.id === id) {
                await addressesApi.update(a.id, { isDefault: a.id === id })
              }
            }
            return null
          },
          () => {
            set((s) => ({
              addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
            }))
          },
        )
      },
    }),
    {
      name: "lijiang-addresses",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
