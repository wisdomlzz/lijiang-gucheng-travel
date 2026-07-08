export type TabKey =
  | "all"
  | "pending-review"
  | "manual"
  | "cancel-approval"
  | "price-review"
  | "payment-proof"

export const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部订单" },
  { key: "pending-review", label: "待派单" },
  { key: "manual", label: "人工处理" },
  { key: "cancel-approval", label: "取消审批" },
  { key: "price-review", label: "报价审核" },
  { key: "payment-proof", label: "付款凭证" },
]