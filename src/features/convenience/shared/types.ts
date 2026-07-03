export type ConvenienceServiceType =
  | "送货服务" | "行李搬运"
  | "建筑垃圾清运" | "生活垃圾清运" | "送水服务" | "布草配送"

export const POINT_TO_POINT_TYPES: ConvenienceServiceType[] = ["送货服务", "行李搬运"]
export const ZONE_BASED_TYPES: ConvenienceServiceType[] = ["建筑垃圾清运", "生活垃圾清运", "送水服务", "布草配送"]
export const ALL_CONVENIENCE_TYPES: ConvenienceServiceType[] = [...POINT_TO_POINT_TYPES, ...ZONE_BASED_TYPES]

export function isPointToPoint(type: string): boolean {
  return POINT_TO_POINT_TYPES.includes(type as ConvenienceServiceType)
}
export function isZoneBased(type: string): boolean {
  return ZONE_BASED_TYPES.includes(type as ConvenienceServiceType)
}