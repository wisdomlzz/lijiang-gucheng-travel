import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, MapPin, ParkingCircle, LocateFixed, Navigation, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useContentManageStore } from "../../shared/stores/content-manage-store";
import { haversineDistance, formatDistance } from "../../shared/utils/geo";
import type { ParkingLot, ParkingType } from "../../shared/types/content-types";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";

const FILTERS: { key: "all" | ParkingType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "self_operated", label: "自营" },
  { key: "third_party", label: "第三方" },
];

const MARKER_COLORS = {
  self_operated: "#3B82F6",
  third_party: "#F97316",
  muted: "#9CA3AF",
} as const;

function getPosition(id: string): { top: string; left: string } {
  const positions: Record<string, { top: string; left: string }> = {
    p1: { top: "22%", left: "32%" },
    p2: { top: "58%", left: "62%" },
    p3: { top: "52%", left: "38%" },
    p4: { top: "72%", left: "58%" },
    p5: { top: "28%", left: "72%" },
  };
  return positions[id] || { top: "50%", left: "50%" };
}

function ParkingMarker({
  lot,
  isSelected,
  onClick,
  userLat,
  userLng,
}: {
  lot: ParkingLot;
  isSelected: boolean;
  onClick: () => void;
  userLat: number | null;
  userLng: number | null;
}) {
  const isOpen = lot.status !== "closed" && lot.status !== "full";
  const color = isOpen ? MARKER_COLORS[lot.type] : MARKER_COLORS.muted;
  const dist =
    userLat != null && userLng != null
      ? formatDistance(haversineDistance(userLat, userLng, lot.lat, lot.lng))
      : null;
  const pos = getPosition(lot.id);

  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
      style={{ top: pos.top, left: pos.left }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white transition-all"
        style={{
          backgroundColor: color,
          transform: isSelected ? "scale(1.2)" : "scale(1)",
          boxShadow: isSelected
            ? `0 0 0 4px ${color}40, 0 4px 12px rgba(0,0,0,0.3)`
            : "0 3px 8px rgba(0,0,0,0.25)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>
      <div className="text-[10px] text-center whitespace-nowrap px-1.5 py-0.5 rounded bg-white/90 text-text-body shadow-sm font-medium">
        {lot.name.replace("停车场", "")}
      </div>
      {dist && (
        <div className="text-[9px] text-center whitespace-nowrap px-1 py-0.5 rounded bg-primary/10 text-primary">
          {dist}
        </div>
      )}
      {lot.status === "full" && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
          满
        </div>
      )}
    </button>
  );
}

type DrawerMode = "list" | "detail";

export function ParkingPage() {
  const navigate = useNavigate();
  const parkings = useContentManageStore((s) => s.parkings);

  const [filter, setFilter] = useState<"all" | ParkingType>("all");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);

  const getDist = useCallback(
    (lot: ParkingLot) => {
      if (userLat == null || userLng == null) return null;
      return haversineDistance(userLat, userLng, lot.lat, lot.lng);
    },
    [userLat, userLng],
  );

  const sorted = useMemo(() => {
    const r = [...parkings];
    if (userLat != null && userLng != null) {
      r.sort((a, b) => (getDist(a) ?? Infinity) - (getDist(b) ?? Infinity));
    }
    return r;
  }, [parkings, userLat, userLng, getDist]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((p) => p.type === filter);
  }, [sorted, filter]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let watchId: number;
    const success = (pos: GeolocationPosition) => {
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
    };
    const error = () => {};
    watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const openDetail = (lot: ParkingLot) => {
    setSelectedId(lot.id);
    setDrawerMode("detail");
  };

  const openList = () => {
    setDrawerMode("list");
  };

  const goBackToList = () => {
    setSelectedId(null);
    setDrawerMode("list");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedId(null);
  };

  const selectedLot = selectedId ? parkings.find((p) => p.id === selectedId) ?? null : null;

  const selfParkingCount = parkings.filter((p) => p.type === "self_operated").length;
  const thirdParkingCount = parkings.filter((p) => p.type === "third_party").length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F5EFE2]">
      {/* SVG Map */}
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="800" height="600" fill="#E8DCC8" />
          <path d="M 120 100 L 680 100 L 680 500 L 120 500 Z" fill="#D4C4A8" stroke="#B8A080" strokeWidth="3" />
          <path d="M 120 200 L 680 200" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <path d="M 120 300 L 680 300" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <path d="M 120 400 L 680 400" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <path d="M 200 100 L 200 500" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <path d="M 400 100 L 400 500" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <path d="M 600 100 L 600 500" stroke="#C4B08A" strokeWidth="18" fill="none" />
          <ellipse cx="400" cy="300" rx="50" ry="35" fill="#D8CEB8" stroke="#B8A080" strokeWidth="2" />
          <text x="400" y="304" textAnchor="middle" fontSize="10" fill="#8B7355" fontWeight="bold">四方街</text>
          <circle cx="400" cy="130" r="22" fill="#C8BC9A" stroke="#A89878" strokeWidth="2" />
          <text x="400" y="134" textAnchor="middle" fontSize="8" fill="#6B5B3E">大水车</text>
          <rect x="180" y="220" width="80" height="60" rx="4" fill="#D0C4A0" stroke="#A89878" strokeWidth="2" />
          <text x="220" y="254" textAnchor="middle" fontSize="9" fill="#6B5B3E" fontWeight="bold">木府</text>
          <circle cx="290" cy="300" r="20" fill="#CCC4A0" stroke="#A89878" strokeWidth="2" />
          <text x="290" y="304" textAnchor="middle" fontSize="8" fill="#6B5B3E">玉河广场</text>
          <circle cx="330" cy="380" r="22" fill="#CCC4A0" stroke="#A89878" strokeWidth="2" />
          <text x="330" y="384" textAnchor="middle" fontSize="8" fill="#6B5B3E">白龙广场</text>
          <rect x="370" y="470" width="60" height="30" rx="4" fill="#B8A878" stroke="#8B7355" strokeWidth="2" />
          <text x="400" y="488" textAnchor="middle" fontSize="8" fill="#6B5B3E">南门</text>
          <rect x="370" y="100" width="60" height="25" rx="4" fill="#B8A878" stroke="#8B7355" strokeWidth="2" />
          <text x="400" y="117" textAnchor="middle" fontSize="8" fill="#6B5B3E">北门</text>
          <text x="140" y="60" fontSize="11" fill="#6B5B3E" fontWeight="bold">丽江古城导览图</text>
          <text x="140" y="75" fontSize="8" fill="#8B7355">Lijiang Old Town</text>
          <path
            d="M 620 120 Q 580 200 590 280 Q 600 360 560 420 Q 540 460 500 480"
            stroke="#7BAFD4" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.6"
          />
          <path
            d="M 620 120 Q 580 200 590 280 Q 600 360 560 420 Q 540 460 500 480"
            stroke="#5B9BD5" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 4" opacity="0.8"
          />
        </svg>
      </div>

      {/* Parking Markers */}
      {parkings.map((lot) => (
        <ParkingMarker
          key={lot.id}
          lot={lot}
          isSelected={lot.id === selectedId}
          onClick={() => openDetail(lot)}
          userLat={userLat}
          userLng={userLng}
        />
      ))}

      {/* User location dot */}
      {userLat != null && userLng != null && (
        <div
          className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.3)] animate-pulse"
          style={{ top: "45%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
      )}

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 rounded-lg px-3 py-2 text-[10px] space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-text-secondary">平台自营({selfParkingCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-text-secondary">第三方({thirdParkingCount})</span>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate("/c/home")}
        className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center"
      >
        <ChevronLeft size={20} className="text-text-body" />
      </button>

      {/* Filter pills */}
      <div className="absolute top-3 left-14 right-14 z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 h-8 px-4 rounded-full text-[12px] font-medium transition-all shadow-sm backdrop-blur-sm ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-white/90 text-text-secondary border border-gray-200/60 hover:bg-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl shadow-[0_6px_20px_rgba(60,120,200,0.15)] px-4 py-3 flex items-center z-10">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <ParkingCircle size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-text-body font-medium">停车服务</div>
          <div className="text-[11px] text-text-tertiary mt-0.5">
            平台自营 {selfParkingCount} 个 | 第三方 {thirdParkingCount} 个
          </div>
        </div>
        <button
          onClick={openList}
          className="h-9 px-4 rounded-full bg-primary text-white text-[13px] flex items-center gap-1.5"
        >
          <ParkingCircle size={14} />
          查看全部
        </button>
      </div>

      {/* Custom Bottom Sheet — constrained inside the 844px frame */}
      {drawerMode && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          onClick={closeDrawer}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(60,120,200,0.2)] flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mt-2.5 mb-1 h-1 w-9 rounded-full bg-gray-300 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                {drawerMode === "detail" && selectedLot && (
                  <button onClick={goBackToList} className="p-1 -ml-1">
                    <ChevronLeft size={18} className="text-text-secondary" />
                  </button>
                )}
                <ParkingCircle size={15} className="text-primary" />
                <span className="text-[14px] font-medium text-text-heading">
                  {drawerMode === "list" ? "停车场列表" : selectedLot?.name}
                </span>
              </div>
              <button onClick={closeDrawer} className="p-1">
                <X size={18} className="text-text-tertiary" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {drawerMode === "list" && (
                <>
                  <p className="text-[11px] text-text-tertiary">
                    共 {filtered.length} 个停车场 · 按距离由近到远排序
                  </p>
                  {filtered.map((lot) => {
                    const dist = getDist(lot);
                    const isSelected = lot.id === selectedId;
                    return (
                      <button
                        key={lot.id}
                        onClick={() => openDetail(lot)}
                        className={`w-full text-left rounded-xl p-3 transition-all ${
                          isSelected
                            ? "bg-primary/5 ring-1 ring-primary/30"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                lot.status === "full" || lot.status === "closed"
                                  ? MARKER_COLORS.muted
                                  : MARKER_COLORS[lot.type],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-text-body truncate">
                                {lot.name}
                              </span>
                              <span
                                className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                                  lot.status === "full"
                                    ? "bg-rose-50 text-rose-600"
                                    : lot.status === "closed"
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {lot.status === "full" ? "已停满" : lot.status === "closed" ? "已关闭" : "营业中"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {dist != null && (
                                <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                                  <MapPin size={10} />
                                  {dist}
                                </span>
                              )}
                              <span className="text-[11px] text-text-tertiary">
                                共 {lot.totalSpots} 位
                              </span>
                              <span className="text-[11px] text-text-tertiary truncate">
                                {lot.address}
                              </span>
                            </div>
                          </div>
                          <ChevronLeft size={14} className="text-text-tertiary rotate-180 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {drawerMode === "detail" && selectedLot && (
                <div className="space-y-3">
                  {/* 状态 + 地址 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full ${
                        selectedLot.status === "full"
                          ? "bg-rose-50 text-rose-600"
                          : selectedLot.status === "closed"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {selectedLot.status === "full" ? "已停满" : selectedLot.status === "closed" ? "已关闭" : "营业中"}
                    </span>
                    <span className="text-[12px] text-text-secondary">{selectedLot.address}</span>
                  </div>

                  {/* 图片 */}
                  <div className="rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={selectedLot.imageUrl || ""}
                      alt={selectedLot.name}
                      className="w-full h-36 object-cover"
                    />
                  </div>

                  {/* 信息卡片 */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-tertiary">总车位</span>
                      <span className="text-[14px] font-semibold text-primary">共 {selectedLot.totalSpots} 个车位</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-tertiary">营业时间</span>
                      <span className="text-[13px] text-text-body">{selectedLot.hours}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] text-text-tertiary shrink-0">收费标准</span>
                      <span className="text-[12px] text-text-body text-right">{selectedLot.rate}</span>
                    </div>
                  </div>

                  {/* 完整描述 */}
                  {selectedLot.description && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[12px] text-[#555] leading-relaxed whitespace-pre-wrap">
                        {selectedLot.description}
                      </p>
                    </div>
                  )}

                  {/* 导航按钮 */}
                  <button
                    onClick={() => {
                      if (selectedLot.lat && selectedLot.lng) {
                        window.open(
                          `https://uri.amap.com/marker?position=${selectedLot.lng},${selectedLot.lat}&name=${encodeURIComponent(selectedLot.name)}`,
                          "_blank",
                        );
                      }
                    }}
                    className="w-full h-11 rounded-full bg-primary text-white text-[14px] font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Navigation size={16} />
                    立即导航
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
