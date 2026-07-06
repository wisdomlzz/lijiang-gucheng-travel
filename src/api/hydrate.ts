import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "./client"
import { useConvenienceStore, useStaffStore, useZoneStore, useReviewStore } from "@/features/convenience/store"
import { useContentNewsStore, useContentGuideStore, useContentCourtyardStore, useContentMerchantStore, useContentPOIStore } from "@/features/content/store"
import { useHousingStore } from "@/features/housing/store/housing-store"
import { useComplaintStore } from "@/features/complaints/store"
import { usePointsStore } from "@/features/points/store"
import { useRulesStore, useTrustScoreStore } from "@/features/trust-score/store"
import { useVolunteerStore } from "@/features/volunteer/store"
import { useHomepageConfigStore } from "@/features/homepage/store"
import { useAIKnowledgeStore } from "@/features/ai-knowledge/store"

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
        // 测试连接
        await api.list("staff", { pageSize: 1 })

        // 并行调所有 API
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