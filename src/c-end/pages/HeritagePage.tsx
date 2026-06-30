import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { Search, MapPin, Navigation, X } from "lucide-react";
import { HeritageType, HeritageItem, heritageTypeMeta } from "../types/heritage";
import { heritageData } from "../data/heritage/index";
import { useLoadMore } from "../../shared/hooks/useLoadMore";

const tabs: { key: HeritageType | "all" | "nearby"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "road", label: "道路" },
  { key: "water", label: "水系" },
  { key: "well", label: "井/泉" },
  { key: "bridge", label: "古桥" },
  { key: "ancient-tree", label: "古树" },
  { key: "protected-house", label: "保护民居" },
  { key: "historic-building", label: "历史建筑" },
  { key: "human-environment", label: "人文环境" },
  { key: "nearby", label: "离我最近" },
];

// 计算两点间距离（米）
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 格式化距离
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
}

// 根据类型获取导航URL
function getNavigationUrl(lat: number, lng: number, name: string): string {
  // 使用高德地图坐标
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&src=mypage&coordinate=gaode`;
}

// 根据类型获取详情页路径（统一路由）
function getDetailPath(type: string, id: string): string {
  return `/c/heritage/${type}/${id}`;
}

// 获取列表显示的摘要信息（统一字段）
function getListSummary(item: HeritageItem): { title: string; subtitle: string; extra?: string } {
  const typeLabel = heritageTypeMeta[item.type]?.label || "";
  const subtitle = [item.area, item.heritageSubType || typeLabel].filter(Boolean).join(" · ");
  const extra = item.preservationStatus || item.basicInfo?.slice(0, 20);
  return { title: item.name, subtitle, extra };
}

export function HeritagePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<HeritageType | "all" | "nearby">("all");
  const [keyword, setKeyword] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  // 获取用户位置
  useEffect(() => {
    if (tab === "nearby") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(false);
        },
        (error) => {
          console.error("获取位置失败:", error);
          setLocationError(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [tab]);

  // 根据tab筛选数据
  const getData = () => {
    let data =
      tab === "all" || tab === "nearby"
        ? Object.values(heritageData).flat()
        : heritageData[tab] || [];

    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      data = data.filter(
        (h) =>
          h.name.toLowerCase().includes(lower) ||
          h.description.toLowerCase().includes(lower)
      );
    }

    // 如果是"离我最近"且有位置，按距离排序
    if (tab === "nearby" && userLocation) {
      data = data
        .filter((h) => h.location.lat > 0 && h.location.lng > 0)
        .map((h) => ({
          ...h,
          _distance: getDistance(userLocation.lat, userLocation.lng, h.location.lat, h.location.lng),
        }))
        .sort((a: any, b: any) => a._distance - b._distance);
    }

    return data;
  };

  const filtered = getData();
  const { visible, hasMore, loadMore, total } = useLoadMore(filtered, 10);

  // 处理"离我最近"点击
  const handleTabChange = (newTab: HeritageType | "all" | "nearby") => {
    setTab(newTab);
  };

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="遗产知识" back="/c/home" />

      {/* 位置提示 */}
      {tab === "nearby" && locationError && (
        <div className="px-4 py-2 bg-amber-50 flex items-center justify-between">
          <span className="text-[13px] text-amber-700">无法获取您的位置，请开启定位权限</span>
          <button onClick={() => setLocationError(false)}>
            <X size={16} className="text-amber-600" />
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="px-4 py-3 bg-white">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索遗产名称"
            className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] rounded-full text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 bg-white border-b border-border-light">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key as any)}
              className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "bg-[#F5F5F5] text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      <div className="px-4 py-3 space-y-3">
        {total === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
              <MapPin size={24} className="text-text-tertiary" />
            </div>
            <p className="text-[14px] text-text-secondary">
              {tab === "nearby" ? "暂未获取到位置信息" : "暂无相关遗产记录"}
            </p>
          </div>
        ) : (
          visible.map((item: any) => {
            const info = getListSummary(item);
            const distance =
              tab === "nearby" && userLocation && item.location.lat > 0
                ? getDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
                : null;

            return (
              <div
                key={item.id}
                onClick={() => navigate(getDetailPath(item.type, item.id))}
                className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <ImageWithFallback
                    src={item.photos?.[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white text-[15px] font-semibold">{info.title}</h3>
                    <p className="text-white/80 text-[12px] mt-0.5 flex items-center gap-1">
                      <MapPin size={12} />
                      {info.subtitle}
                    </p>
                  </div>
                  {distance !== null && (
                    <div className="absolute top-3 right-3 bg-primary text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation size={10} />
                      {formatDistance(distance)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] text-text-secondary line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  {info.extra && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-text-tertiary">{info.extra}</span>
                      {distance !== null && (
                        <span className="text-[11px] text-primary font-medium">
                          {formatDistance(distance)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
            加载更多
          </button>
        )}
      </div>
    </div>
  );
}