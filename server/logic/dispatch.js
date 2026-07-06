// 派单引擎 — 从前端 dispatch.ts 迁移
// Haversine distance in km
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function pickStaff(staffList, orderServiceType, orderLat, orderLng, zones) {
  const type = orderServiceType
  const candidates = staffList.filter(s => s.enabled && s.status === "online" && s.serviceTypes?.includes(orderServiceType))
  if (candidates.length === 0) return null

  const pointToPoint = ["送货服务", "行李搬运"]
  if (pointToPoint.includes(type)) {
    if (orderLat && orderLng) {
      candidates.sort((a, b) => {
        const dA = a.lat != null ? haversineKm(a.lat, a.lng, orderLat, orderLng) : 999
        const dB = b.lat != null ? haversineKm(b.lat, b.lng, orderLat, orderLng) : 999
        return dA - dB
      })
    }
    return candidates[0] || null
  }

  // Zone-based
  const eligibleZoneIds = zones
    .filter(z => z.stations?.some(st => st.serviceType === type))
    .map(z => z.id)
  const zoneMatches = candidates.filter(s => s.zoneIds?.some(zid => eligibleZoneIds.includes(zid)))
  const pool = zoneMatches.length > 0 ? zoneMatches : candidates
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return pick || null
}

export function lookupStaff(staffList, staffId) {
  return staffList.find(s => s.id === staffId) || null
}