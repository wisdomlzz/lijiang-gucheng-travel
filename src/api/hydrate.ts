import { useEffect, useState } from "react"
import { api } from "./client"
import { useConvenienceStore } from "@/features/convenience/store"
import { useStaffStore } from "@/features/convenience/store"
import { useZoneStore } from "@/features/convenience/store"
import { useContentNewsStore } from "@/features/content/store"
import { useContentGuideStore } from "@/features/content/store"
import { useContentCourtyardStore } from "@/features/content/store"
import { useContentMerchantStore } from "@/features/content/store"
import { useContentPOIStore } from "@/features/content/store"
import { useHousingStore } from "@/features/housing/store/housing-store"
import { useComplaintStore } from "@/features/complaints/store"
import { useReviewStore } from "@/features/convenience/store"
import { usePointsStore } from "@/features/points/store"
import { useTrustScoreStore } from "@/features/trust-score/store"
import { useRulesStore } from "@/features/trust-score/store"
import { useVolunteerStore } from "@/features/volunteer/store"
import { useContentNewsStore as useAIKnowledgeStore } from "@/features/content/store"
import { useHomepageConfigStore } from "@/features/homepage/store"
import { useConvenienceStore as useSettlementStore } from "@/features/convenience/store"

// 从 API 加载所有数据到 zustand stores
export function useApiHydrate() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      try {
        // Test connection
        await api.list("auth/login")

        // Load convenience orders
        const ordersRes = await api.list("orders", { pageSize: 200 })
        if (ordersRes?.items) useConvenienceStore.setState({ orders: ordersRes.items })

        // Load staff
        const staffRes = await api.list("staff", { pageSize: 200 })
        if (staffRes?.items) useStaffStore.setState({ staff: staffRes.items })

        // Load zones
        const zonesRes = await api.list("zones", { pageSize: 200 })
        if (zonesRes?.items) useZoneStore.setState({ zones: zonesRes.items })

        // Load content
        const loadContent = async (store, endpoint) => {
          const res = await api.list(endpoint, { pageSize: 200 })
          if (res?.items) {
            if (endpoint === "content/news") store.setState({ news: res.items })
            else if (endpoint === "content/routes") store.setState({ guides: res.items })
            else if (endpoint === "content/courtyards") store.setState({ courtyards: res.items })
            else if (endpoint === "content/merchants") store.setState({ merchants: res.items })
            else if (endpoint === "content/pois") store.setState({ pois: res.items })
            else if (endpoint === "content/housing") store.setState({ houses: res.items })
          }
        }
        await loadContent(useContentNewsStore, "content/news")
        await loadContent(useContentGuideStore, "content/routes")
        await loadContent(useContentCourtyardStore, "content/courtyards")
        await loadContent(useContentMerchantStore, "content/merchants")
        await loadContent(useContentPOIStore, "content/pois")
        await loadContent(useHousingStore, "content/housing")

        // Load complaints
        const compRes = await api.list("complaints", { pageSize: 200 })
        if (compRes?.items) useComplaintStore.setState({ complaints: compRes.items })

        // Load reviews
        const revRes = await api.list("reviews", { pageSize: 200 })
        if (revRes?.items) useReviewStore.setState({ reviews: revRes.items })

        // Load points rules
        const prRes = await api.list("points/rules", { pageSize: 200 })
        if (prRes?.items) usePointsStore.setState({ rules: prRes.items })

        // Load score rules
        const srRes = await api.list("trust-scores/rules", { pageSize: 200 })
        if (srRes?.items) useRulesStore.setState({ rules: srRes.items })

        if (!cancelled) setLoaded(true)
      } catch (e) {
        console.warn("API not available, using seed data:", e.message)
        if (!cancelled) { setLoaded(true); setError(e.message) }
      }
    }
    hydrate()
    return () => { cancelled = true }
  }, [])

  return { loaded, error }
}