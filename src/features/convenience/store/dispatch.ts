import type { ConvenienceServiceType } from "../shared/types"
import { isPointToPoint } from "../shared/types"
import { useStaffStore } from "./staff-store"
import { useZoneStore } from "./zone-store"

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 按 ID 查找服务人员姓名（供手动派单使用） */
export function lookupStaff(staffId: string): { id: string; name: string; phone: string } | undefined {
  const s = useStaffStore.getState().staff.find((s) => s.id === staffId)
  return s ? { id: s.id, name: s.name, phone: s.phone } : undefined
}

/**
 * 派单引擎：为订单选择最合适的服务人员。
 *
 * - 点对点（行李搬运/送货）：按 Haversine 距离最近排序
 * - 片区型（垃圾清运/送水/布草）：按 zoneIds 严格匹配，无片区匹配时回退到全局
 */
export function pickStaff(
  orderServiceType: string,
  orderLat?: number,
  orderLng?: number
): {
  id: string
  name: string
  phone: string
} | null {
  const staffList = useStaffStore.getState().staff
  const zones = useZoneStore.getState().zones
  const type = orderServiceType as ConvenienceServiceType

  let candidates = staffList.filter((s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(type))
  if (candidates.length === 0) return null

  if (isPointToPoint(type)) {
    if (orderLat && orderLng) {
      candidates.sort((a, b) => {
        const dA = a.lat != null && a.lng != null ? haversineKm(a.lat, a.lng, orderLat, orderLng) : 999
        const dB = b.lat != null && b.lng != null ? haversineKm(b.lat, b.lng, orderLat, orderLng) : 999
        return dA - dB
      })
    }
    const best = candidates[0]
    return best ? { id: best.id, name: best.name, phone: best.phone } : null
  }

  // Zone-based: prefer staff whose zoneIds contain an eligible zone
  const eligibleZoneIds = zones.filter((z) => z.stations.some((st) => st.serviceType === type)).map((z) => z.id)
  const zoneMatches = candidates.filter((s) => s.zoneIds?.some((zid) => eligibleZoneIds.includes(zid)))
  const pool = zoneMatches.length > 0 ? zoneMatches : candidates
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return pick ? { id: pick.id, name: pick.name, phone: pick.phone } : null
}
