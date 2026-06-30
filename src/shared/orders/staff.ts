import { seedUsers } from "../types/seed-users"
import { useTrustScoreStore } from "../services/trust-score"

export interface StaffInfo {
  id: string
  name: string
  phone: string
  avatar: string
  trustScore: number
  trustStatus: string
  roleTag: string
}

export function resolveStaff(staffId: string): StaffInfo | null {
  const user = seedUsers.find((u) => u.staffId === staffId)
  if (!user) return null

  const trustScore = useTrustScoreStore.getState().getScore(staffId)
  const cleanName = user.name.replace(/（.*）/, "").replace(/^.*?[-]/, "")

  return {
    id: staffId,
    name: cleanName || user.name,
    phone: user.phone || "",
    avatar: user.avatar || "",
    trustScore: trustScore?.trustScore ?? 0,
    trustStatus: trustScore?.status ?? "正常",
    roleTag: trustScore?.roleTag ?? user.roleTag ?? "",
  }
}
