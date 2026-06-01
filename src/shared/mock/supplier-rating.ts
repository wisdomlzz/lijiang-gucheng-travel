import { create } from "zustand"

type SupplierRatingData = {
  totalRatings: number
  rating5Count: number
  rating4Count: number
  rating3Count: number
  rating2Count: number
  rating1Count: number
}

type SupplierRatingMap = Record<string, SupplierRatingData>

type SupplierRatingState = {
  ratings: SupplierRatingMap
  addRating: (supplierId: string, rating: number) => void
  getSupplierRating: (supplierId: string) => {
    avgRating: number
    goodRate: number
    creditScore: number
    totalRatings: number
  }
  getAll: () => [string, SupplierRatingData & { avgRating: number; goodRate: number; creditScore: number }][]
}

function compute(data: SupplierRatingData) {
  const total = data.totalRatings
  if (total === 0) return { avgRating: 0, goodRate: 0, creditScore: 0 }
  const avgRating = Math.round(
    (data.rating5Count * 5 + data.rating4Count * 4 + data.rating3Count * 3 + data.rating2Count * 2 + data.rating1Count * 1) / total * 10
  ) / 10
  const goodRate = Math.round((data.rating5Count + data.rating4Count) / total * 100)
  const creditScore = goodRate
  return { avgRating, goodRate, creditScore }
}

const SEED_SUPPLIER_RATINGS: SupplierRatingMap = {
  sup_001: { totalRatings: 1234, rating5Count: 980, rating4Count: 200, rating3Count: 30, rating2Count: 15, rating1Count: 9 },
  sup_002: { totalRatings: 356, rating5Count: 280, rating4Count: 50, rating3Count: 18, rating2Count: 6, rating1Count: 2 },
  sup_003: { totalRatings: 512, rating5Count: 390, rating4Count: 80, rating3Count: 28, rating2Count: 10, rating1Count: 4 },
  sup_004: { totalRatings: 128, rating5Count: 95, rating4Count: 22, rating3Count: 7, rating2Count: 3, rating1Count: 1 },
  sup_005: { totalRatings: 203, rating5Count: 160, rating4Count: 30, rating3Count: 8, rating2Count: 4, rating1Count: 1 },
  self: { totalRatings: 5420, rating5Count: 4800, rating4Count: 500, rating3Count: 80, rating2Count: 30, rating1Count: 10 },
}

export const useSupplierRatingStore = create<SupplierRatingState>((set, get) => ({
  ratings: SEED_SUPPLIER_RATINGS,

  addRating: (supplierId, rating) => {
    const star = Math.round(rating)
    if (star < 1 || star > 5) return
    set((s) => {
      const cur = s.ratings[supplierId]
      if (!cur) {
        const base = { totalRatings: 0, rating5Count: 0, rating4Count: 0, rating3Count: 0, rating2Count: 0, rating1Count: 0 }
        return { ratings: { ...s.ratings, [supplierId]: incrementCounts(base, star) } }
      }
      return { ratings: { ...s.ratings, [supplierId]: incrementCounts(cur, star) } }
    })
  },

  getSupplierRating: (supplierId) => {
    const data = get().ratings[supplierId]
    if (!data) return { avgRating: 0, goodRate: 0, creditScore: 0, totalRatings: 0 }
    return { ...data, ...compute(data) }
  },

  getAll: () => {
    return Object.entries(get().ratings).map(([id, data]) => [id, { ...data, ...compute(data) }])
  },
}))

function incrementCounts(data: SupplierRatingData, star: number): SupplierRatingData {
  return {
    ...data,
    totalRatings: data.totalRatings + 1,
    rating5Count: star === 5 ? data.rating5Count + 1 : data.rating5Count,
    rating4Count: star === 4 ? data.rating4Count + 1 : data.rating4Count,
    rating3Count: star === 3 ? data.rating3Count + 1 : data.rating3Count,
    rating2Count: star === 2 ? data.rating2Count + 1 : data.rating2Count,
    rating1Count: star === 1 ? data.rating1Count + 1 : data.rating1Count,
  }
}
