import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Phone, MapPin, ChevronRight, AlertTriangle, Wallet, CheckCircle2,
} from "lucide-react";
import { StatusBadge, StatusKind } from "@/shared/components/ui/status-badge";
import { Toast } from "../../components/Sheet";
import { ServiceOrderDetail, ServiceOrder, ServiceState } from "./ServiceOrderDetail";
import { useConvenienceStore } from "../../../shared/mock";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useSearch } from "@/shared/hooks/useSearch";
import { useLoadMore } from "@/shared/hooks/useLoadMore";
import type { ConvenienceOrder, ConvenienceStatus } from "../../../shared/types";

const TABS = ["已指派", "进行中", "已完成", "已取消"] as const;

const SERVICE_COLORS: Record<string, string> = {
  "行李搬运": "#F59E0B",
  "垃圾清运": "#0891B2",
  "送水服务": "#3B82F6",
  "布草配送": "#7C3AED",
  "应急医疗": "#DC2626",
};
function convStatusToServiceState(status: ConvenienceStatus): ServiceState {
  switch (status) {
    case "S10": case "A10": case "A20": return "pending";
    case "A30": return "accepted";
    case "A35": return "quoted";
    case "A38": return "negotiating";
    case "A40": return "paid";
    case "S48": return "serving";
    case "S55": return "confirming";
    case "S40": return "done";
    case "S50": return "cancelled";
    case "R80": return "cancelReview";
    case "S90": return "manual";
    default: return "pending";
  }
}

function mapConv(o: ConvenienceOrder, idx: number): ServiceOrder {
  const state = convStatusToServiceState(o.status);
  return {
    id: o.id, state,
    type: o.serviceType,
    typeColor: SERVICE_COLORS[o.serviceType] ?? "#6B7280",
    addr: o.addressTo ? `${o.address} → ${o.addressTo}` : o.address,
    buyer: o.userId.replace("u_c_", "用").slice(0, 3) + "**",
    buyerPhone: "****", time: o.createdAt,
    ref: o.refPrice ? `参考价 ¥${o.refPrice}` : "",
    amount: o.priceQuote ? `¥${o.priceQuote}` : undefined,
    pay: o.payMethod ?? undefined, note: o.note,
    images: o.images, paymentProof: o.paymentProof, completionPhotos: o.completionPhotos,
    pricingMode: "postQuote",
  };
}

const stateMeta: Record<ServiceState, { kind: StatusKind; label: string }> = {
  pending: { kind: "pending", label: "已指派" },
  accepted: { kind: "active", label: "已接单" },
  quoted: { kind: "prepay", label: "待用户支付" },
  paid: { kind: "active", label: "已收款" },
  serving: { kind: "active", label: "服务中" },
  confirming: { kind: "review", label: "待确认" },
  done: { kind: "done", label: "已完成" },
  cancelled: { kind: "closed", label: "已取消" },
  cancelReview: { kind: "review", label: "取消待审批" },
  manual: { kind: "manual", label: "待人工处理" },
};

export function ServiceTasks() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("已指派");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDispatch, setShowDispatch] = useState(true);
  const [lastDispatchId, setLastDispatchId] = useState<string | null>(null);
  const [counter, setCounter] = useState(300);
  const [toast, setToast] = useState("");

  const currentUser = useAuthStore((s) => s.user);
  const currentStaffId = currentUser?.staffId ?? "";
  const convOrders = useConvenienceStore((s) => s.orders);

  const orders = useMemo(() => {
    return convOrders.filter((o) => o.staffId === currentStaffId).map(mapConv).sort((a, b) => b.time.localeCompare(a.time));
  }, [convOrders, currentStaffId]);

  useEffect(() => {
    if (!showDispatch) return;
    const t = setInterval(() => setCounter((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [showDispatch]);

  useEffect(() => {
    const pending = orders.find((o) => o.state === "pending");
    if (pending && pending.id !== lastDispatchId) {
      setLastDispatchId(pending.id);
      setShowDispatch(true);
      setCounter(243);
    }
  }, [orders, lastDispatchId]);

  const urgent = counter <= 60;
  const tabFiltered = orders.filter((o) =>
    tab === "已指派" ? o.state === "pending"
    : tab === "进行中" ? (o.state !== "pending" && o.state !== "done" && o.state !== "cancelled" && o.state !== "cancelReview" && o.state !== "manual")
    : tab === "已完成" ? o.state === "done"
    : o.state === "cancelled"
  );
  const counts = {
    pending: orders.filter((o) => o.state === "pending").length,
    progress: orders.filter((o) => o.state !== "pending" && o.state !== "done" && o.state !== "cancelled").length,
    done: orders.filter((o) => o.state === "done").length,
    cancelled: orders.filter((o) => o.state === "cancelled").length,
  };
  const cancelReviewCount = orders.filter((o) => o.state === "cancelReview").length;
  const manualCount = orders.filter((o) => o.state === "manual").length;

  const searchFn = useCallback((item: ServiceOrder, query: string) => {
    const q = query.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.addr.toLowerCase().includes(q)
    );
  }, []);

  const { query, setQuery, filtered } = useSearch(tabFiltered, searchFn);
  const { visible, hasMore, loadMore, total } = useLoadMore(filtered, 10);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const opened = orders.find((o) => o.id === openId) ?? null;
  const nextPending = orders.find((o) => o.state === "pending");

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-surface-page/85 backdrop-blur-xl pt-3 pb-2 px-4">
        <h1 className="text-[18px] mb-3">派单任务</h1>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const cnt = t === "已指派" ? counts.pending : t === "进行中" ? counts.progress : t === "已完成" ? counts.done : counts.cancelled;
            return (
              <button key={t} onClick={() => { setTab(t); setQuery(""); }}
                className={`shrink-0 px-3 h-7 rounded-full text-[12px] transition ${tab === t ? "text-white shadow-[0_2px_8px_rgba(245,158,11,0.28)]" : "bg-white text-text-secondary"}`}
                style={tab === t ? { background: "#F59E0B" } : {}}
              >{t}{` ${cnt}`}</button>
            );
          })}
        </div>
      </div>

      {(manualCount > 0 || cancelReviewCount > 0) && (
        <div className="px-4 mt-2 space-y-1.5">
          {manualCount > 0 && (
            <button onClick={() => { const t = orders.find((o) => o.state === "manual"); if (t) setOpenId(t.id); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-red-50">
              <AlertTriangle className="size-4 shrink-0 text-red-700" />
              <span className="text-[12px] flex-1 text-red-700">{manualCount} 个待人工处理</span>
              <ChevronRight className="size-4 text-red-700" />
            </button>
          )}
          {cancelReviewCount > 0 && (
            <button onClick={() => { const t = orders.find((o) => o.state === "cancelReview"); if (t) setOpenId(t.id); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-amber-50">
              <AlertTriangle className="size-4 shrink-0 text-amber-800" />
              <span className="text-[12px] flex-1 text-amber-800">{cancelReviewCount} 个取消待审批</span>
              <ChevronRight className="size-4 text-amber-800" />
            </button>
          )}
        </div>
      )}

      <div className="px-4 mt-2">
        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索订单号、地址..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="px-4 mt-2 space-y-2">
        {visible.map((t) => {
          const m = stateMeta[t.state];
          return (
            <div key={t.id} onClick={() => setOpenId(t.id)}
              className="bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(60,120,200,0.08)] active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px]"
                    style={{ background: `${t.typeColor}14`, color: t.typeColor }}
                  >{t.type.length > 12 ? t.type.slice(0, 12) + "…" : t.type}</div>
                </div>
                <StatusBadge kind={m.kind}>{m.label}</StatusBadge>
              </div>
              <div className="flex items-start gap-1.5 text-[13px] text-text-heading">
                <MapPin className="size-3.5 text-text-tertiary mt-0.5 shrink-0" />
                <span>{t.addr}</span>
              </div>
              {t.ref && <div className="mt-1 text-[11px] text-text-tertiary">{t.ref}</div>}
              <div className="mt-2 flex items-center justify-between text-[11px] text-text-tertiary">
                <span>#{t.id}</span>
                <span>用户 {t.buyer} · {t.time.slice(11)}</span>
              </div>
              {t.amount && (
                <div className="mt-2 flex items-center gap-2 bg-primary-50/70 rounded-xl px-3 py-2">
                  <Wallet className="size-4 text-primary" />
                  <span className="text-[12px] text-text-secondary">{t.pay === "online" ? "线上支付" : "现金收款"}</span>
                  <span className="text-[15px] font-medium text-primary ml-auto">{t.amount}</span>
                </div>
              )}
              <div onClick={(e) => e.stopPropagation()} className="mt-3 flex items-center gap-2 border-t border-[#F0F0F0] pt-2.5">
                <button onClick={() => { setToast("拨打电话"); setTimeout(() => setToast(""), 1600); }}
                  className="size-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <Phone className="size-4 text-primary" />
                </button>
                <div className="flex-1" />
                <button onClick={() => setOpenId(t.id)}
                  className="px-3 h-8 rounded-full bg-primary-50 text-primary text-[12px] flex items-center gap-0.5">
                  详情 <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="text-center text-[12px] text-text-tertiary py-10">
            {query ? "没有匹配的订单" : "暂无订单"}
          </div>
        )}
        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
            加载更多
          </button>
        )}
      </div>

      {showDispatch && tab === "已指派" && nextPending && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[340px] mx-auto bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            style={{ background: urgent ? "linear-gradient(180deg, #FEE2E2 0%, #FFFFFF 35%)" : "linear-gradient(180deg, #FEF3C7 0%, #FFFFFF 35%)" }}>
            <div className="px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full flex items-center justify-center text-white"
                  style={{ background: urgent ? "#DC2626" : "#F59E0B" }}>
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium text-text-heading">{urgent ? "派单即将转派！" : "新派单"}</div>
                  <div className="text-[11px] text-text-tertiary">
                    便民服务派单 · 5 分钟内未响应将自动转派
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-2 text-center">
              <div className="inline-block px-4 py-2 rounded-2xl text-white text-[26px] font-medium tabular-nums"
                style={{ background: urgent ? "#DC2626" : "#F59E0B" }}>{fmt(counter)}</div>
            </div>
            <div className="mx-5 my-3 bg-primary-50/60 rounded-2xl p-3 space-y-1.5 text-[12px] text-text-body">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] text-text-heading">{nextPending.type}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <MapPin className="size-3.5" />
                <span>{nextPending.addr}</span>
              </div>
              {nextPending.ref && <div className="text-text-tertiary">{nextPending.ref}{nextPending.note ? ` · ${nextPending.note}` : ""}</div>}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setShowDispatch(false)}
                className="flex-1 h-11 rounded-2xl bg-white border border-[#E5E7EB] text-text-secondary text-[14px]">暂不接单</button>
              <button onClick={() => { setShowDispatch(false); setOpenId(nextPending.id); }}
                className="flex-1 h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(245,158,11,0.32)]"
                style={{ background: "#F59E0B" }}>查看详情</button>
            </div>
          </div>
        </div>
      )}

      <ServiceOrderDetail
        order={opened}
        onClose={() => setOpenId(null)}
        onStateChange={(id, next, pricingMode) => {
          const convStore = useConvenienceStore.getState();
          const conv = convStore.orders.find((c) => c.id === id);
          if (conv) {
            if (next === "accepted" && conv.status === "A20") convStore.acceptOrder(id);
            if (next === "paid" && conv.status === "A35") convStore.markPaid(id, conv.payMethod ?? "online");
            if (next === "paid" && conv.status === "A38") convStore.resolvePriceDispute(id, "override", conv.priceQuote);
            if (next === "serving" && conv.status === "A40") convStore.startService(id);
            if (next === "cancelled" && conv.status === "R80") convStore.approveCancel(id);
            if (next === "serving" && conv.status === "R80") convStore.rejectCancel(id);
            if (next === "done" && conv.status === "S90") convStore.forceCancel(id);
            return;
          }
        }}
      />
      <Toast show={!!toast} text={toast} />
    </div>
  );
}
