import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  AlertTriangle, CheckCircle2, ChevronRight, ClipboardList, Store,
  MessageCircleWarning, Camera, Users, Landmark, ShoppingBag, ParkingCircle, Clock,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useConvenienceStore } from "../../features/convenience/store"
import { useComplaintStore } from "../../features/complaints/store";
import { PageHeader } from "../components/common/PageHeader";
import { useAuthStore } from "../../shared/stores/auth-store";
import { useSupplierStore } from "../../shared/services/supplier";
import { useCheckinStore } from "../../features/checkin/store";
import { useContentMerchantStore } from "../../features/content/store/merchant-store"
import { useContentCourtyardStore } from "../../features/content/store/courtyard-store"
import { useContentPOIStore } from "../../features/content/store/poi-store"
import { useNavigate } from "react-router";
import { CRMEB_ADMIN_URL } from "../../shared/constants";

export function Workbench() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const orders = useConvenienceStore((s) => s.orders);
  const complaints = useComplaintStore((s) => s.complaints);
  const applications = useSupplierStore((s) => s.applications);
  const checkins = useCheckinStore((s) => s.checkins);
  const merchants = useContentMerchantStore((s) => s.merchants);
  const courtyards = useContentCourtyardStore((s) => s.courtyards);
  const parkings = useContentPOIStore((s) => s.parkings);

  const pendingDispatch = orders.filter((o) => o.status === "S10" || o.status === "A10" || o.status === "S90").length;
  const cancelPending = orders.filter((o) => o.cancelRequested).length;
  const activeOrders = orders.filter((o) => ["A20", "A30", "A35", "A40", "S48", "S55"].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === "S40").length;
  const complaintTodo = complaints.filter((c) => c.status === "C10").length;
  const supplierPending = applications.filter((a) => a.status === "pending").length;

  const summaryCards = [
    { label: "便民服务订单", value: orders.length, desc: `${activeOrders} 单处理中`, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "待派单/人工处理", value: pendingDispatch, desc: "便民服务派单", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "投诉处理中", value: complaintTodo, desc: "含已提交/已处理/已驳回", icon: MessageCircleWarning, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "供应商待审核", value: supplierPending, desc: "通过后进入商城后台", icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const todoItems = [
    { label: "便民服务派单处理", count: pendingDispatch, target: "convenience", urgent: pendingDispatch > 0, note: "仅便民服务，不含商城派单" },
    { label: "取消申请审核", count: cancelPending, target: "convenience", urgent: cancelPending > 0, note: "便民服务取消审批" },
    { label: "投诉管理", count: complaintTodo, target: "complaints", urgent: complaintTodo > 0, note: "受理、处理、完结投诉" },
    { label: "供应商入驻审核", count: supplierPending, target: "supplier-applications", urgent: supplierPending > 0, note: "审核资质，后续进商城后台" },
  ];

  const chartData = [
    { name: "待派单", value: pendingDispatch },
    { name: "处理中", value: activeOrders },
    { name: "已完成", value: completedOrders },
    { name: "投诉", value: complaintTodo },
    { name: "入驻", value: supplierPending },
  ];

  const informationItems = [
    { label: "购物/餐饮/住宿/酒吧", value: merchants.length, target: "shopping", icon: ShoppingBag },
    { label: "文化院落", value: courtyards.length, target: "courtyards", icon: Landmark },
    { label: "停车场", value: parkings.length, target: "parking", icon: ParkingCircle },
    { label: "打卡记录", value: checkins.length, target: "photo-records", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="平台运营工作台"
        desc={`${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })} · ${user?.name ?? "平台管理员"}，当前后台聚焦便民服务、游客服务信息维护、供应商入驻与投诉治理`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(CRMEB_ADMIN_URL, "_blank")}>打开商城后台</Button>
          </div>
        }
      />
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{card.label}</div>
                  <div className={`size-9 rounded-lg ${card.bg} ${card.color} grid place-items-center`}>
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-2xl font-semibold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.desc}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 rounded-lg">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">本期业务总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">后台边界</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>本后台处理平台运营、便民服务和信息维护。</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>供应商通过审核后，商品、订单、核销、售后转入商城后台。</span>
            </div>
            <Button className="w-full mt-2" variant="outline" onClick={() => navigate("/desktop/supplier-applications")}>
              查看入驻审核 <ChevronRight className="size-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 rounded-lg">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">待处理事项</CardTitle>
            <span className="text-xs text-muted-foreground">实时刷新</span>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {todoItems.map((it) => (
                <li key={it.label} className="flex items-center py-3">
                  <div className="size-8 rounded-md bg-amber-50 grid place-items-center text-amber-700 mr-3">
                    {it.urgent ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      {it.label}
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{it.count}</Badge>
                      {it.urgent && (
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                          需及时处理
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{it.note}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/desktop/${it.target}`)}>
                    去处理 <ChevronRight className="size-3 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader><CardTitle className="text-base">信息维护概况</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {informationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(`/desktop/${item.target}`)}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-slate-100 grid place-items-center text-slate-600">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.value} 条数据</p>
                  </div>
                  <ChevronRight className="size-4 text-slate-300" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
