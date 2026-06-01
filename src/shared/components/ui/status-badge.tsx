import { ReactNode } from "react";

export type StatusKind =
  | "pending" // 橙 — 等待操作
  | "active" // 蓝 — 进行中
  | "done" // 绿 — 已完成
  | "closed" // 灰 — 已取消/关闭
  | "review" // 黄 — 审批中
  | "prepay" // 紫 — 待预付
  | "manual"; // 深红 — 待人工处理

const DEFAULT_STYLE = { bg: "#F1F5F9", fg: "#64748B" };

const styles: Record<StatusKind, { bg: string; fg: string }> = {
  pending: { bg: "#FFF4E5", fg: "#F97316" },
  active: { bg: "#DBEAFE", fg: "#2563EB" },
  done: { bg: "#D1FAE5", fg: "#059669" },
  closed: { bg: "#F1F5F9", fg: "#64748B" },
  review: { bg: "#FEF3C7", fg: "#F59E0B" },
  prepay: { bg: "#EDE9FE", fg: "#7C3AED" },
  manual: { bg: "#FEE2E2", fg: "#9F1239" },
};

// Map convenience order status codes → { kind, label }
const ORDER_STATUS_MAP: Record<string, { kind: StatusKind; label: string }> = {
  S10: { kind: "pending", label: "已下单" },
  A10: { kind: "pending", label: "待派单" },
  A20: { kind: "pending", label: "已指派" },
  A30: { kind: "active", label: "已接单" },
  A35: { kind: "prepay", label: "已核价" },
  A38: { kind: "review", label: "协商中" },
  A40: { kind: "active", label: "已收款" },
  S48: { kind: "active", label: "服务中" },
  S55: { kind: "review", label: "完工待确认" },
  S40: { kind: "done", label: "已完成" },
  S50: { kind: "closed", label: "已取消" },
  R80: { kind: "review", label: "取消审批中" },
  S90: { kind: "manual", label: "待人工处理" },
};

// Map complaint status codes → { kind, label }
const COMPLAINT_STATUS_MAP: Record<string, { kind: StatusKind; label: string }> = {
  C10: { kind: "review", label: "已提交" },
  C40: { kind: "done", label: "已处理" },
  CR: { kind: "closed", label: "已驳回" },
};

// Legacy API: <StatusBadge status={label} color={hex} />
function StatusBadgeByColor({ status, color }: { status: string; color?: string }) {
  const fg = color ?? "#64748B";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]"
      style={{ background: `${fg}14`, color: fg }}
    >
      {status}
    </span>
  );
}

type StatusBadgeProps =
  | { kind: StatusKind; children: ReactNode; status?: never; color?: never }
  | { kind: "complaint"; status: string; children?: never; color?: never }
  | { kind: "order"; status: string; children?: never; color?: never }
  | { kind?: never; status: string; color?: string; children?: never };

export function StatusBadge(props: StatusBadgeProps) {
  // Legacy color API
  if ("color" in props && props.color !== undefined) {
    return <StatusBadgeByColor status={props.status!} color={props.color} />;
  }

  // Domain-specific status mapping
  if (props.kind === "complaint" && props.status) {
    const entry = COMPLAINT_STATUS_MAP[props.status];
    const s = styles[entry?.kind ?? "closed"];
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]" style={{ background: s.bg, color: s.fg }}>
        {entry?.label ?? props.status}
      </span>
    );
  }

  if (props.kind === "order" && props.status) {
    const entry = ORDER_STATUS_MAP[props.status];
    const s = styles[entry?.kind ?? "pending"];
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]" style={{ background: s.bg, color: s.fg }}>
        {entry?.label ?? props.status}
      </span>
    );
  }

  // Primary API: kind + children
  const kind = props.kind as StatusKind;
  const s = styles[kind] ?? DEFAULT_STYLE;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]" style={{ background: s.bg, color: s.fg }}>
      {props.children}
    </span>
  );
}
