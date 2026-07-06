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

// 不依赖 API 的 store 直接从 seed 加载，不需要 hydrate
// 本函数只加载需要从 API 同步的 store

export function useApiHydrate() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading")

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        // 测试连接
        await api.list("staff", { pageSize: 1 })

        // 并行加载所有数据
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

        // 每个资源独立处理：成功则覆盖 seed，失败则保留 seed
        if (staffRes.status === "fulfilled" && staffRes.value?.items) useStaffStore.setState({ staff: staffRes.value.items })
        if (ordersRes.status === "fulfilled" && ordersRes.value?.items) useConvenienceStore.setState({ orders: ordersRes.value.items })
        if (zonesRes.status === "fulfilled" && zonesRes.value?.items) useZoneStore.setState({ zones: zonesRes.value.items })
        if (compRes.status === "fulfilled" && compRes.value?.items) useComplaintStore.setState({ complaints: compRes.value.items })
        if (revRes.status === "fulfilled" && revRes.value?.items) useReviewStore.setState({ reviews: revRes.value.items })
        if (prRes.status === "fulfilled" && prRes.value?.items) usePointsStore.setState({ rules: prRes.value.items })
        if (srRes.status === "fulfilled" && srRes.value?.items) useRulesStore.setState({ rules: srRes.value.items })
        if (newsRes.status === "fulfilled" && newsRes.value?.items) useContentNewsStore.setState({ news: newsRes.value.items })
        if (routesRes.status === "fulfilled" && routesRes.value?.items) useContentGuideStore.setState({ guides: routesRes.value.items })
        if (courtsRes.status === "fulfilled" && courtsRes.value?.items) useContentCourtyardStore.setState({ courtyards: courtsRes.value.items })
        if (merchRes.status === "fulfilled" && merchRes.value?.items) useContentMerchantStore.setState({ merchants: merchRes.value.items })
        if (poisRes.status === "fulfilled" && poisRes.value?.items) useContentPOIStore.setState({ pois: poisRes.value.items })
        if (housesRes.status === "fulfilled" && housesRes.value?.items) useHousingStore.setState({ houses: housesRes.value.items })

        if (!cancelled) {
          setStatus("online")
          toast.success("已连接到后端服务")
        }
      } catch (e) {
        console.warn("后端服务不可用，使用浏览器本地数据（seed）：", e.message)
        if (!cancelled) {
          setStatus("offline")
          toast.warning("后端服务未启动，使用本地演示数据", { duration: 4000 })
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [])

  return status
}