import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "./client"
import { useConvenienceStore, useStaffStore, useZoneStore, useReviewStore } from "@/features/convenience/store"
import { useContentNewsStore, useContentGuideStore, useContentCourtyardStore, useContentMerchantStore, useContentPOIStore } from "@/features/content/store"
import { useHousingStore } from "@/features/housing/store/housing-store"
import { useComplaintStore } from "@/features/complaints/store"
import { usePointsStore } from "@/features/points/store"
import { useRulesStore } from "@/features/trust-score/store"
import { useHomepageConfigStore } from "@/features/homepage/store"

// 从 API 加载所有数据，失败则清空 store（不 fallback seed）
export function useApiHydrate() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading")

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        await api.list("staff", { pageSize: 1 })

        const [staffRes, ordersRes, zonesRes, compRes, revRes, prRes, srRes, newsRes, routesRes, courtsRes, merchRes, poisRes, housesRes] = await Promise.allSettled([
          api.list("staff", { pageSize: 200 }),
          api.list("orders", { pageSize: 200 }),
          api.list("zones", { pageSize: 200 }),
          api.list("complaints", { pageSize: 200 }),
          api.list("reviews", { pageSize: 200 }),
          api.list("points/rules", { pageSize: 200 }),
          api.list("trust-scores/rules", { pageSize: 200 }),
          api.list("content/news", { pageSize: 200 }),
          api.list("content/routes", { pageSize: 200 }),
          api.list("content/courtyards", { pageSize: 200 }),
          api.list("content/merchants", { pageSize: 200 }),
          api.list("content/pois", { pageSize: 200 }),
          api.list("content/housing", { pageSize: 200 }),
        ])

        if (cancelled) return

        // 成功的数据覆盖 store，失败的保持空
        if (staffRes.status === "fulfilled" && staffRes.value?.items) useStaffStore.setState({ staff: staffRes.value.items })
        else useStaffStore.setState({ staff: [] })
        if (ordersRes.status === "fulfilled" && ordersRes.value?.items) useConvenienceStore.setState({ orders: ordersRes.value.items })
        else useConvenienceStore.setState({ orders: [] })
        if (zonesRes.status === "fulfilled" && zonesRes.value?.items) useZoneStore.setState({ zones: zonesRes.value.items })
        else useZoneStore.setState({ zones: [] })
        if (compRes.status === "fulfilled" && compRes.value?.items) useComplaintStore.setState({ complaints: compRes.value.items })
        else useComplaintStore.setState({ complaints: [] })
        if (revRes.status === "fulfilled" && revRes.value?.items) useReviewStore.setState({ reviews: revRes.value.items })
        else useReviewStore.setState({ reviews: [] })
        if (prRes.status === "fulfilled" && prRes.value?.items) usePointsStore.setState({ rules: prRes.value.items })
        else usePointsStore.setState({ rules: [] })
        if (srRes.status === "fulfilled" && srRes.value?.items) useRulesStore.setState({ rules: srRes.value.items })
        else useRulesStore.setState({ rules: [] })
        if (newsRes.status === "fulfilled" && newsRes.value?.items) useContentNewsStore.setState({ news: newsRes.value.items })
        else useContentNewsStore.setState({ news: [] })
        if (routesRes.status === "fulfilled" && routesRes.value?.items) useContentGuideStore.setState({ guides: routesRes.value.items })
        else useContentGuideStore.setState({ guides: [] })
        if (courtsRes.status === "fulfilled" && courtsRes.value?.items) useContentCourtyardStore.setState({ courtyards: courtsRes.value.items })
        else useContentCourtyardStore.setState({ courtyards: [] })
        if (merchRes.status === "fulfilled" && merchRes.value?.items) useContentMerchantStore.setState({ merchants: merchRes.value.items })
        else useContentMerchantStore.setState({ merchants: [] })
        if (poisRes.status === "fulfilled" && poisRes.value?.items) useContentPOIStore.setState({ pois: poisRes.value.items })
        else useContentPOIStore.setState({ pois: [] })
        if (housesRes.status === "fulfilled" && housesRes.value?.items) useHousingStore.setState({ houses: housesRes.value.items })
        else useHousingStore.setState({ houses: [] })

        if (!cancelled) setStatus("online")
      } catch (e) {
        console.error("后端服务不可用，请启动后端：cd server && npm run dev")
        if (!cancelled) {
          setStatus("offline")
          toast.error("无法连接到后端服务，请启动 server", { duration: 8000 })
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [])

  return status
}