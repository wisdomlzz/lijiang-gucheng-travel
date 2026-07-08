export const VOL_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待审核", bg: "#FEF3C7", fg: "#D97706" },
  approved: { label: "已通过", bg: "#D1FAE5", fg: "#059669" },
  rejected: { label: "已驳回", bg: "#FEE2E2", fg: "#DC2626" },
}

export const ACT_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "草稿", bg: "#FEF3C7", fg: "#D97706" },
  published: { label: "已发布", bg: "#D1FAE5", fg: "#059669" },
  in_progress: { label: "进行中", bg: "#A7F3D0", fg: "#047857" },
  ended: { label: "已结束", bg: "#F1F5F9", fg: "#64748B" },
  cancelled: { label: "已取消", bg: "#F1F5F9", fg: "#94A3B8" },
}

export const DAILY_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待签到", bg: "#DBEAFE", fg: "#2563EB" },
  checked_in: { label: "已签到", bg: "#D1FAE5", fg: "#059669" },
  checked_out: { label: "已签退", bg: "#F1F5F9", fg: "#64748B" },
  no_show: { label: "未参与", bg: "#FEF3C7", fg: "#B45309" },
  checkout_overdue: { label: "待补签退", bg: "#FEF3C7", fg: "#D97706" },
}