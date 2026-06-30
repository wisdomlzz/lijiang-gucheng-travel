import { useState, useRef } from "react";
import { useAddressStore } from "../../shared/services/address"
import { useConvenienceStore } from "../../shared/services/convenience";
import { useServiceConfigStore } from "../../shared/services/convenience/services-store";
import type { ConvenienceService } from "../../shared/types";
import { useAuthStore } from "../../shared/stores/auth-store";
import { useNavigate } from "react-router";
import { X, Upload, MapPin, User, Clock, ChevronRight, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { StatusProgress } from "../components/StatusProgress";
import { PageHeader } from "../components/PageHeader";
import type { ConvenienceOrder } from "../../shared/types";
import { ConvenienceStatusLabel } from "../../shared/types";

const CONVENIENCE_STEP_LABELS = ["已下单", "已派单", "已核价", "已付款", "服务中", "已完成"];

function getConvenienceStepIndex(status: string): number {
  const map: Record<string, number> = {
    "S10": 0, "A20": 0,
    "A30": 1,
    "A35": 2, "A38": 2,
    "A40": 3,
    "S48": 4, "S55": 4,
    "S40": 5,
  };
  return map[status] ?? -1;
}

function getConvenienceSteps(status: string): { label: string; completed: boolean }[] {
  const idx = getConvenienceStepIndex(status);
  return CONVENIENCE_STEP_LABELS.map((label, i) => ({
    label,
    completed: idx >= 0 && i <= idx,
  }));
}

function getServiceEmoji(type: string): string {
  if (type.includes("垃圾")) return "🗑️";
  if (type.includes("行李")) return "🧳";
  if (type.includes("水")) return "💧";
  if (type.includes("布草")) return "🧺";
  if (type.includes("送货")) return "📦";
  return "📦";
}

interface OrderModalProps {
  service: ConvenienceService;
  onClose: () => void;
}

function OrderModal({ service, onClose }: OrderModalProps) {
  const isLateNight = new Date().getHours() >= 22 || new Date().getHours() < 7;
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [serviceTime, setServiceTime] = useState<"now" | "schedule">(isLateNight ? "schedule" : "now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addresses = useAddressStore((s) => s.addresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find(a => a.isDefault)?.id || addresses[0]?.id || null
  );
  const [selectedEndAddressId, setSelectedEndAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressPickerType, setAddressPickerType] = useState<"start" | "end">("start");

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const selectedEndAddress = addresses.find(a => a.id === selectedEndAddressId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("图片大小不能超过 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages((prev) => {
          if (prev.length >= 5) return prev;
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      toast.error("请至少上传1张现场照片");
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const id = `CO${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const formatAddr = (addr: typeof selectedAddress) => {
      if (!addr) return "";
      return `${addr.province}${addr.city}${addr.district} ${addr.detail}`;
    };

    const user = useAuthStore.getState().user;

    const newOrder: ConvenienceOrder = {
      id,
      userId: user?.id || "",
      serviceType: service.name,
      address: formatAddr(selectedAddress),
      addressTo: service.type === "point" ? formatAddr(selectedEndAddress) : undefined,
      images: uploadedImages,
      note: description,
      preferredTime: serviceTime === "now" ? "尽快" : `${scheduleDate} ${scheduleTime}`,
      status: "S10",
      createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };

    useConvenienceStore.getState().createOrder(newOrder);
    onClose();
    navigate(`/c/orders/${id}`);
  };

  const getPlaceholderText = () => {
    if (service.id === "garbage") return "请备注垃圾类型和大概体积";
    if (service.id === "construction") return "请备注垃圾类型和大概方数";
    if (service.id === "linen") return "请备注布草类型和包数以及期望收送时间";
    if (service.id === "water") return "请备注水的种类和数量";
    if (service.id === "luggage") return "请备注行李件数和大小";
    if (service.id === "delivery") return "请备注货物内容";
    return `请填写${service.unit}数`;
  };

  const getDescriptionHint = () => {
    if (service.id === "garbage") {
      return "可补充大件说明（如：废弃砖块 3 方）";
    }
    if (service.id === "construction") {
      return "请备注垃圾类型和大概方数";
    }
    if (service.id === "water") {
      return "请填写水桶类（如 18L 桶装水）/ 数量";
    }
    if (service.id === "linen") {
      return "请填写布草类型 / 数量 / 期望收送时间";
    }
    if (service.id === "luggage") {
      return "请描述行李数量（如：纸箱或成件 ×2）";
    }
    if (service.id === "delivery") {
      return "请备注货物内容";
    }
    return "";
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-[20px] max-h-[85vh] overflow-y-auto pb-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-[17px] text-text-body font-medium">{service.name}</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-surface-page to-primary-100 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[24px] shadow-sm">
                {service.emoji}
              </div>
              <div className="flex-1">
                <p className="text-[14px] text-text-body font-medium">{service.name}</p>
                <p className="text-[11px] text-text-tertiary">{service.description}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[3px] h-[14px] bg-primary rounded-full"></div>
              <span className="text-[14px] text-text-body font-medium">服务地址</span>
            </div>

            {/* Start address */}
            <button
              onClick={() => { setAddressPickerType("start"); setShowAddressPicker(true); }}
              className="w-full bg-white border border-border-light rounded-xl p-3 flex items-center gap-3 mb-2"
            >
              <MapPin size={18} className="text-primary flex-shrink-0" />
              <div className="flex-1 text-left">
                {selectedAddress ? (
                  <>
                    <p className="text-[13px] text-text-body">{selectedAddress.name} {selectedAddress.phone}</p>
                    <p className="text-[11px] text-text-tertiary truncate">{selectedAddress.province}{selectedAddress.city}{selectedAddress.district} {selectedAddress.detail}</p>
                  </>
                ) : (
                  <p className="text-[13px] text-text-tertiary">请选择{service.type === "grid" ? "服务" : "起点"}地址</p>
                )}
              </div>
              <ChevronRight size={14} className="text-text-tertiary" />
            </button>

            {/* End address (point-to-point only) */}
            {service.type === "point" && (
              <button
                onClick={() => { setAddressPickerType("end"); setShowAddressPicker(true); }}
                className="w-full bg-white border border-border-light rounded-xl p-3 flex items-center gap-3"
              >
                <MapPin size={18} className="text-[#EF4444] flex-shrink-0" />
                <div className="flex-1 text-left">
                  {selectedEndAddress ? (
                    <>
                      <p className="text-[13px] text-text-body">{selectedEndAddress.name} {selectedEndAddress.phone}</p>
                      <p className="text-[11px] text-text-tertiary truncate">{selectedEndAddress.province}{selectedEndAddress.city}{selectedEndAddress.district} {selectedEndAddress.detail}</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-text-tertiary">请选择终点地址</p>
                  )}
                </div>
                <ChevronRight size={14} className="text-text-tertiary" />
              </button>
            )}

            {/* Auto-fill hint for grid services */}
            {service.type === "grid" && (
              <p className="text-[11px] text-text-tertiary mt-1">
                {service.unit === "方" ? "终点自动绑定垃圾站" : service.id === "water" ? "起点自动绑定水房" : "系统自动绑定最近网点"}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[3px] h-[14px] bg-primary rounded-full"></div>
              <span className="text-[14px] text-text-body font-medium">订单描述</span>
              <span className="text-[12px] text-primary">· 必填</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getPlaceholderText()}
              rows={2}
              className="w-full px-4 py-3 border border-border-light rounded-xl focus:outline-none focus:border-primary text-[13px] resize-none"
              required
            />
            {getDescriptionHint() && (
              <p className="text-[11px] text-text-tertiary mt-1">{getDescriptionHint()}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[3px] h-[14px] bg-primary rounded-full"></div>
              <span className="text-[14px] text-text-body font-medium">现场照片</span>
              <span className="text-[12px] text-[#f54900]">· 至多 5 张</span>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt={`上传的照片 ${index + 1}`} className="w-20 h-20 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadedImages.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-8 flex flex-col items-center justify-center gap-2 active:bg-[#f8fafc] transition-colors"
              >
                <Upload size={32} className="text-[#cbd5e1]" />
                <span className="text-[13px] text-text-tertiary">上传</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-[11px] text-text-tertiary mt-1">最多 5 张，支持从相册选择或拍照</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[3px] h-[14px] bg-primary rounded-full"></div>
              <span className="text-[14px] text-text-body font-medium">服务时间</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setServiceTime("now")}
                disabled={isLateNight}
                className={`py-3 rounded-xl text-[14px] font-medium transition-all ${
                  isLateNight
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : serviceTime === "now"
                      ? "bg-gradient-to-r from-primary to-primary text-white shadow-lg shadow-primary/25"
                      : "bg-[#f8fafc] text-text-secondary"
                }`}
              >
                即刻上门
              </button>
              <button
                type="button"
                onClick={() => setServiceTime("schedule")}
                className={`py-3 rounded-xl text-[14px] font-medium transition-all ${
                  serviceTime === "schedule"
                    ? "bg-gradient-to-r from-primary to-primary text-white shadow-lg shadow-primary/25"
                    : "bg-[#f8fafc] text-text-secondary"
                }`}
              >
                预约时间
              </button>
            </div>

            {isLateNight && (
              <p className="text-[11px] text-[#EF4444] mt-1">该时段仅支持预约明日7:00后的服务</p>
            )}

            {/* Time picker - shown when schedule is selected */}
            {serviceTime === "schedule" && (
              <div className="mt-3 space-y-2">
                {/* Quick date selector */}
                <div>
                  <p className="text-[12px] text-text-tertiary mb-1.5">选择日期</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      if (isLateNight) d.setDate(d.getDate() + 1); // start from tomorrow during late night
                      d.setDate(d.getDate() + i);
                      const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
                      const dayStr = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
                      const key = `${d.getMonth()}-${d.getDate()}`;
                      const isSelected = scheduleDate === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setScheduleDate(key)}
                          className={`flex-shrink-0 w-16 py-2 rounded-xl text-center ${
                            isSelected ? "bg-primary text-white" : "bg-white border border-border-light"
                          }`}
                        >
                          <p className={`text-[11px] ${isSelected ? "text-white/80" : "text-text-tertiary"}`}>{dayStr}</p>
                          <p className={`text-[13px] font-medium ${isSelected ? "text-white" : "text-text-body"}`}>{dateStr}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {scheduleDate && (
                  <div>
                    <p className="text-[12px] text-text-tertiary mb-1.5">选择时段</p>
                    <div className="grid grid-cols-4 gap-2">
                      {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((t) => {
                        const hour = parseInt(t);
                        const isEarly = isLateNight && scheduleDate === `${new Date().getMonth()}-${new Date().getDate() + 1}` && hour < 7;
                        if (isEarly) return null;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setScheduleTime(t)}
                            className={`py-2 rounded-lg text-[12px] ${
                              scheduleTime === t ? "bg-primary text-white" : "bg-white border border-border-light text-text-body"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-[14px]">💡</span>
              <div className="flex-1">
                <p className="text-[11px] text-text-heading font-medium mb-1">计价参考</p>
                <p className="text-[11px] text-text-heading whitespace-pre-line leading-relaxed">
                  {service.priceNote}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary text-white py-4 rounded-xl text-[16px] font-medium shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
            >
              提交订单
            </button>
          </div>
        {showAddressPicker && (
          <div className="fixed inset-0 bg-black/40 z-[70] flex items-end" onClick={() => setShowAddressPicker(false)}>
            <div
              className="bg-white w-full rounded-t-[20px] max-h-[60vh] overflow-y-auto pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between z-10">
                <h3 className="text-[16px] text-text-body font-medium">
                  选择{addressPickerType === "start" ? (service.type === "grid" ? "服务" : "起点") : "终点"}地址
                </h3>
                <button onClick={() => setShowAddressPicker(false)} className="p-1">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      if (addressPickerType === "start") setSelectedAddressId(addr.id);
                      else setSelectedEndAddressId(addr.id);
                      setShowAddressPicker(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border ${
                      (addressPickerType === "start" ? selectedAddressId : selectedEndAddressId) === addr.id
                        ? "border-primary bg-primary-50" : "border-border-light"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-text-body font-medium">{addr.name}</span>
                      <span className="text-[12px] text-text-tertiary">{addr.phone}</span>
                      {addr.isDefault && <span className="text-[10px] bg-primary-100 text-primary px-1.5 py-0.5 rounded">默认</span>}
                    </div>
                    <p className="text-[12px] text-text-tertiary mt-1">{addr.province}{addr.city}{addr.district} {addr.detail}</p>
                  </button>
                ))}
                <button
                  onClick={() => { setShowAddressPicker(false); navigate("/c/addresses/edit/new"); }}
                  className="w-full py-3 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] text-primary flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> 新增地址
                </button>
              </div>
            </div>
          </div>
        )}
        </form>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const [selectedService, setSelectedService] = useState<ConvenienceService | null>(null);
  const navigate = useNavigate();
  const orders = useConvenienceStore((s) => s.orders);
  const user = useAuthStore((s) => s.user);
  const services = useServiceConfigStore((s) => s.services);
  const recentOrder = (() => {
    const userOrders = user ? orders.filter((o) => o.userId === user.id && o.status !== "S50") : orders.filter((o) => o.status !== "S50");
    return userOrders.length > 0 ? userOrders[0] : null;
  })();

  return (
    <div className="min-h-full bg-gradient-to-b from-primary-100 via-primary-50 to-surface-page flex flex-col">
      <PageHeader title="一键服务" back="/c/home" />
      <div className="pt-4 pb-3 text-center">
        <span className="text-[16px] text-white tracking-wider font-medium drop-shadow-sm">一键服务</span>
      </div>

      <div className="flex-1 px-3 pb-4">
        <div className="mb-3">
          <h2 className="text-[14px] text-primary font-medium border-b-2 border-primary inline-block pb-1">
            便民服务
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border-light active:scale-[0.98] transition-transform"
            >
              <div className="relative h-[99px] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-2 left-2 ${service.tagColor} text-white text-[11px] px-2 py-1 rounded-full`}>
                  {service.tag}
                </div>
                <div className="absolute top-[60px] left-[123px] bg-white/90 h-[31px] w-[34px] rounded-full flex items-center justify-center text-[18px]">
                  {service.emoji}
                </div>
              </div>
              <div className="px-2.5 pt-2.5 pb-2">
                <p className="text-[14px] text-text-body font-medium mb-0.5 text-left">
                  {service.name}
                </p>
                <p className="text-[12px] text-primary font-medium text-left">
                  {service.price}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 最近订单卡片 */}
        {recentOrder && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] text-primary font-medium">最近订单</h2>
              <button
                onClick={() => navigate("/c/orders?type=convenience")}
                className="text-[12px] text-primary flex items-center"
              >
                查看全部 <ChevronRight size={12} />
              </button>
            </div>

            <div
              onClick={() => navigate(`/c/orders/${recentOrder.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border-light active:scale-[0.98] transition-transform"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-surface-page to-primary-100 border-b border-border-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{getServiceEmoji(recentOrder.serviceType)}</span>
                    <span className="text-[15px] text-text-body font-medium">{recentOrder.serviceType}</span>
                  </div>
                  <span className="text-[12px] text-primary bg-primary-100 px-3 py-1 rounded-full">
                    {ConvenienceStatusLabel[recentOrder.status]}
                  </span>
                </div>
              </div>

              <div className="px-4">
                <StatusProgress steps={getConvenienceSteps(recentOrder.status)} />
              </div>

              <div className="px-4 py-3 border-t border-border-light space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-secondary">订单号</span>
                  <span className="text-[12px] text-text-body">{recentOrder.id}</span>
                </div>
                {recentOrder.address && (
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-text-secondary">服务地址</span>
                    <span className="text-[12px] text-text-body max-w-[200px] text-right">{recentOrder.address}</span>
                  </div>
                )}
                {recentOrder.addressTo && (
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-text-secondary">终点地址</span>
                    <span className="text-[12px] text-text-body max-w-[200px] text-right">{recentOrder.addressTo}</span>
                  </div>
                )}
                {recentOrder.note && (
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-text-secondary">订单描述</span>
                    <span className="text-[12px] text-text-body max-w-[200px] text-right">{recentOrder.note}</span>
                  </div>
                )}
              </div>

              {recentOrder.staffId && (
                <div className="px-4 py-3 border-t border-border-light">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-primary" />
                      <span className="text-[12px] text-text-secondary">服务人员</span>
                    </div>
                    <span className="text-[12px] text-text-body">已派单</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedService && (
        <OrderModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
}
