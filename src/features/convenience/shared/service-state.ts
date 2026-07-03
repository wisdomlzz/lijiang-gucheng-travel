import type { ConvenienceStatus } from "../../../shared/types"
import type { StatusKind } from "../../../shared/components/ui/status-badge"

/**
 * B端（便民服务人员）使用的订单状态视图。
 * 将后端的 ConvenienceStatus（11 个状态码）映射为 9 个业务阶段，
 * 便于 UI 展示和状态转换。
 */
export type BServiceState =
  | "pending"      // 待接单 (A10/A20)
  | "accepted"     // 已接单 (A30)
  | "quoted"       // 已核价，待用户支付 (A35)
  | "paid"         // 已收款 (A40)
  | "serving"      // 服务中 (S48)
  | "confirming"   // 待确认 (S55)
  | "done"         // 已完成 (S40)
  | "cancelled"    // 已取消 (S50)
  | "manual"       // 待人工处理 (S90)

/** B端状态 → UI展示（kind + label） */
export const B_SERVICE_STATE_META: Record<BServiceState, { kind: StatusKind; label: string }> = {
  pending:    { kind: "pending", label: "待接单" },
  accepted:   { kind: "active",  label: "已接单" },
  quoted:     { kind: "prepay",  label: "待用户支付" },
  paid:       { kind: "active",  label: "已收款" },
  serving:    { kind: "active",  label: "服务中" },
  confirming: { kind: "review",  label: "待确认" },
  done:       { kind: "done",    label: "已完成" },
  cancelled:  { kind: "closed",  label: "已取消" },
  manual:     { kind: "manual",  label: "待人工处理" },
}

/**
 * 后端状态码 → B端业务阶段
 */
export function convToBState(status: ConvenienceStatus | string | undefined): BServiceState {
  switch (status) {
    case "S10": case "A10": case "A20": return "pending"
    case "A30": return "accepted"
    case "A35": return "quoted"
    case "A40": return "paid"
    case "S48": return "serving"
    case "S55": return "confirming"
    case "S40": return "done"
    case "S50": return "cancelled"
    case "S90": return "manual"
    default: return "pending"
  }
}

/** 合法的 B 端状态转换（仅在详情页内可做的操作） */
export const B_STATE_TRANSITIONS: Record<BServiceState, BServiceState[]> = {
  pending:    ["accepted"],
  accepted:   ["quoted"],
  quoted:     ["paid"],
  paid:       ["serving"],
  serving:    ["confirming"],
  confirming: ["done"],
  manual:     ["done"],
  done:       [],
  cancelled:  [],
}

/** 正向流程步骤（详情页进度条用） */
export const B_SERVICE_STAGES: { key: BServiceState; label: string }[] = [
  { key: "accepted",  label: "已接单" },
  { key: "quoted",    label: "已核价" },
  { key: "paid",      label: "已收款" },
  { key: "serving",   label: "服务中" },
  { key: "confirming", label: "待确认" },
  { key: "done",      label: "已完成" },
]