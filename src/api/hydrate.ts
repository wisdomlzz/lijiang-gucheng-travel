import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "./client"
import { useConvenienceStore, useStaffStore, useZoneStore, useReviewStore, useSettlementStore } from "@/features/convenience/store"
import { useContentNewsStore, useContentGuideStore, useContentCourtyardStore, useContentMerchantStore, useContentPOIStore } from "@/features/content/store"
import { useHousingStore } from "@/features/housing/store/housing-store"
import { useComplaintStore } from "@/features/complaints/store"
import { usePointsStore } from "@/features/points/store/points-store"
import { useRulesStore, useTrustScoreStore } from "@/features/trust-score/store"
import { useVolunteerStore } from "@/features/volunteer/store"
import { useHomepageConfigStore } from "@/features/homepage/store/homepage-store"
import { useAIKnowledgeStore } from "@/features/ai-knowledge/store/store"
import { useFavoriteStore } from "@/features/favorite/store/favorite-store"
import { useAddressStore } from "@/features/address/store/address-store"
import { useBookingStore } from "@/features/booking/store/booking-store"
import { useCheckinStore } from "@/features/checkin/store"
import { useNaxiCheckinStore } from "@/features/checkin/store"
import { useSupplierStore } from "@/features/supplier/store/supplier-store"
import { useMerchantReviewStore, useMerchantRegistrationStore } from "@/features/merchant-review/store"
import { useAnnouncementStore } from "@/features/announcement/store/announcement-store"

/**
 * 全量 hydration：启动时从 API 加载所有数据到 zustand stores。
 * 后端不可用时全部清空，不使用 seed 数据。
 */
export function useApiHydrate() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading")

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        await api.list("staff", { pageSize: 1 })

        const results = await Promise.allSettled([
          api.list("staff", { pageSize: 200 }),
          api.list("orders", { pageSize: 200 }),
          api.list("zones", { pageSize: 200 }),
          api.list("complaints", { pageSize: 200 }),
          api.list("reviews", { pageSize: 200 }),
          api.list("points/rules", { pageSize: 200 }),
          api.list("trust-scores/rules", { pageSize: 200 }),
          api.list("trust-scores", { pageSize: 200 }),
          api.list("content/news", { pageSize: 200 }),
          api.list("content/routes", { pageSize: 200 }),
          api.list("content/courtyards", { pageSize: 200 }),
          api.list("content/merchants", { pageSize: 200 }),
          api.list("content/pois", { pageSize: 200 }),
          api.list("content/housing", { pageSize: 200 }),
          api.list("banners", { pageSize: 200 }),
          api.list("grid-items", { pageSize: 200 }),
          api.list("volunteers", { pageSize: 200 }),
          api.list("volunteer-activities", { pageSize: 200 }),
          api.list("ai-knowledge", { pageSize: 200 }),
          api.list("favorites", { pageSize: 200 }),
          api.list("addresses", { pageSize: 200 }),
          api.list("bookings", { pageSize: 200 }),
          api.list("checkins", { pageSize: 200 }),
          api.list("naxi-checkins", { pageSize: 200 }),
          api.list("incomes", { pageSize: 200 }),
          api.list("withdrawals", { pageSize: 200 }),
          api.list("suppliers", { pageSize: 200 }),
          api.list("supplier-applications", { pageSize: 200 }),
          api.list("merchant-registrations", { pageSize: 200 }),
          api.list("merchant-reviews", { pageSize: 200 }),
          api.list("announcements", { pageSize: 200 }),
        ])

        if (cancelled) return

        const r = results.map(r => r.status === "fulfilled" ? (r.value?.items || []) : [])

        useStaffStore.setState({ staff: r[0] })
        useConvenienceStore.setState({ orders: r[1] })
        useZoneStore.setState({ zones: r[2] })
        useComplaintStore.setState({ complaints: r[3] })
        useReviewStore.setState({ reviews: r[4] })
        usePointsStore.setState({ rules: r[5] })
        useRulesStore.setState({ rules: r[6] })
        useTrustScoreStore.setState({ scores: r[7] })
        useContentNewsStore.setState({ news: r[8] })
        useContentGuideStore.setState({ guides: r[9] })
        useContentCourtyardStore.setState({ courtyards: r[10] })
        useContentMerchantStore.setState({ merchants: r[11] })
        useContentPOIStore.setState({ pois: r[12] })
        useHousingStore.setState({ houses: r[13] })
        useHomepageConfigStore.setState({ banners: r[14], gridItems: r[15] })
        useVolunteerStore.setState({ volunteers: r[16], activities: r[17] })
        useAIKnowledgeStore.setState({ items: r[18] })
        useFavoriteStore.setState({ favorites: r[19] })
        useAddressStore.setState({ addresses: r[20] })
        useBookingStore.setState({ bookings: r[21] })
        useCheckinStore.setState({ checkins: r[22] })
        useNaxiCheckinStore.setState({ checkins: r[23] })
        useSettlementStore.setState({ incomes: r[24], withdrawals: r[25] })
        useSupplierStore.setState({ suppliers: r[26] })
        useMerchantRegistrationStore.setState({ requests: r[27] })
        useMerchantReviewStore.setState({ requests: r[28] })
        useAnnouncementStore.setState({ announcements: r[29] })
        // supplier-applications and merchant-registrations/reviews serve
        // their own stores in the features that own them

        if (!cancelled) setStatus("online")
      } catch (e) {
        console.error("后端不可用，请启动 server：cd server && npm run dev")
        if (!cancelled) {
          // 清空所有 store
          useStaffStore.setState({ staff: [] })
          useConvenienceStore.setState({ orders: [] })
          useZoneStore.setState({ zones: [] })
          useComplaintStore.setState({ complaints: [] })
          useReviewStore.setState({ reviews: [] })
          usePointsStore.setState({ rules: [] })
          useRulesStore.setState({ rules: [] })
          useTrustScoreStore.setState({ scores: [] })
          useContentNewsStore.setState({ news: [] })
          useContentGuideStore.setState({ guides: [] })
          useContentCourtyardStore.setState({ courtyards: [] })
          useContentMerchantStore.setState({ merchants: [] })
          useContentPOIStore.setState({ pois: [] })
          useHousingStore.setState({ houses: [] })
          useHomepageConfigStore.setState({ banners: [], gridItems: [] })
          useVolunteerStore.setState({ volunteers: [], activities: [] })
          useAIKnowledgeStore.setState({ items: [] })
          useFavoriteStore.setState({ favorites: [] })
          useAddressStore.setState({ addresses: [] })
          useBookingStore.setState({ bookings: [] })
          useCheckinStore.setState({ checkins: [] })
          useNaxiCheckinStore.setState({ checkins: [] })
          useSettlementStore.setState({ incomes: [], withdrawals: [] })
          useSupplierStore.setState({ suppliers: [] })
          useAnnouncementStore.setState({ announcements: [] })
          setStatus("offline")
          toast.error("无法连接到后端服务 (localhost:3001)，请启动 server", { duration: 8000 })
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [])

  return status
}