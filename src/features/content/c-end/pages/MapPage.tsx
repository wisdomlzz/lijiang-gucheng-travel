import { useState, useEffect } from "react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useContentPOIStore } from "@/features/content/store/poi-store"
import { useContentGuideStore } from "@/features/content/store/guide-store"
import { useFlowWarningStore, LEVEL_META } from "@/features/flow-warning/store"
import {
  Search,
  X,
  Navigation,
  Volume2,
  Share2,
  Info,
  Camera,
  Utensils,
  Hotel,
  Coffee,
  ShoppingBag,
  ParkingCircle,
  Landmark,
  Toilet,
  Building2,
  Store,
  MapPin,
  Accessibility,
  Droplets,
  Umbrella,
  ArrowLeftRight,
} from "lucide-react"
import { haversineDistance, formatDistance } from "@/shared/utils/geo"

type Category = {
  key: string
  label: string
  icon: any
  color: string
  count: number
}

const categories: Category[] = [
  { key: "view", label: "景点", icon: Camera, color: "#3DA5E0", count: 32 },
  { key: "courtyard", label: "院落", icon: Landmark, color: "#EC4899", count: 12 },
  { key: "service", label: "服务", icon: Accessibility, color: "#0EA5E9", count: 8 },
  { key: "parking", label: "停车", icon: ParkingCircle, color: "#F97316", count: 12 },
  { key: "handwash", label: "洗手台", icon: Droplets, color: "#14B8A6", count: 10 },
  { key: "toilet", label: "厕所", icon: Toilet, color: "#64748B", count: 15 },
  { key: "shelter", label: "应急避难", icon: Umbrella, color: "#EF4444", count: 6 },
  { key: "food", label: "餐饮", icon: Utensils, color: "#3B82F6", count: 58 },
  { key: "hotel", label: "住宿", icon: Hotel, color: "#6A5ACD", count: 74 },
  { key: "bar", label: "酒吧", icon: Coffee, color: "#3B82F6", count: 21 },
  { key: "entrance", label: "出入口", icon: ArrowLeftRight, color: "#10B981", count: 9 },
]

type Pin = {
  id: number
  name: string
  category: string
  top: string
  left: string
  image: string
  address: string
  desc: string
  lat?: number
  lng?: number
  totalSpots?: number
  description?: string
}

const pins: Pin[] = [
  {
    id: 1,
    name: "官门口",
    category: "view",
    top: "22%",
    left: "40%",
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=70",
    address: "丽江市古城区",
    desc: "官门口是旧江木土司衙署之前的街坊之一，木氏土司是古代丽江的世袭统治者（相当于附属的云南行政大员），木氏家族通过明清两朝大力经营，将丽江打造成一个重要的人文古都。木府曾多次扩建，最终成就了规模宏大的「丽江紫禁城」。官门口坐落在这条繁华的街道之上，是进入木府的重要通道。",
  },
  {
    id: 2,
    name: "四方街",
    category: "view",
    top: "36%",
    left: "52%",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=70",
    address: "古城中心",
    desc: "四方街是丽江古城的核心广场，自古以来为商贸集市之地。",
  },
  {
    id: 3,
    name: "木府",
    category: "view",
    top: "60%",
    left: "30%",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=70",
    address: "古城区光义街",
    desc: "木府为明代丽江木氏土司衙署建筑群，气势恢宏。",
  },
  {
    id: 4,
    name: "大水车",
    category: "view",
    top: "14%",
    left: "62%",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=70",
    address: "古城北入口",
    desc: "大水车是丽江古城的标志性景观，位于古城北入口。",
  },
  {
    id: 5,
    name: "万古楼",
    category: "view",
    top: "72%",
    left: "66%",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=70",
    address: "狮子山",
    desc: "万古楼雄踞狮子山顶，可俯瞰整个古城。",
  },
  {
    id: 6,
    name: "纳西人家",
    category: "food",
    top: "44%",
    left: "38%",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=70",
    address: "新华街",
    desc: "地道纳西族家宴菜。",
  },
  {
    id: 7,
    name: "阿妈意腊排骨",
    category: "food",
    top: "28%",
    left: "56%",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=70",
    address: "七一街",
    desc: "丽江特色腊排骨火锅。",
  },
  {
    id: 8,
    name: "花间堂",
    category: "hotel",
    top: "50%",
    left: "60%",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=70",
    address: "五一街",
    desc: "精品纳西风情客栈。",
  },
  {
    id: 9,
    name: "雪山清吧",
    category: "bar",
    top: "54%",
    left: "56%",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=70",
    address: "酒吧街",
    desc: "古城必打卡音乐酒吧。",
  },
  {
    id: 10,
    name: "木府院落",
    category: "courtyard",
    top: "58%",
    left: "32%",
    image: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=600&q=70",
    address: "光义街官门口",
    desc: "文化院落打卡点，支持到这去导航。",
  },
  {
    id: 11,
    name: "游客咨询服务点",
    category: "service",
    top: "30%",
    left: "44%",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=70",
    address: "玉河广场",
    desc: "提供游客咨询、便民服务指引。",
  },
  {
    id: 12,
    name: "北门洗手台",
    category: "handwash",
    top: "18%",
    left: "58%",
    image: "https://images.unsplash.com/photo-1589556264800-08ae9e129a29?auto=format&fit=crop&w=600&q=70",
    address: "大水车入口旁",
    desc: "导览地图洗手台点位信息。",
  },
  {
    id: 13,
    name: "四方街公厕",
    category: "toilet",
    top: "38%",
    left: "50%",
    image: "https://images.unsplash.com/photo-1583241801098-89ef566af2a4?auto=format&fit=crop&w=600&q=70",
    address: "四方街南侧",
    desc: "支持第三卫生间、无障碍等标签展示。",
  },
  {
    id: 14,
    name: "北门应急避难点",
    category: "shelter",
    top: "20%",
    left: "34%",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=600&q=70",
    address: "北门广场",
    desc: "应急避难点位置与说明。",
  },
  {
    id: 15,
    name: "北门入口",
    category: "entrance",
    top: "12%",
    left: "50%",
    image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=600&q=70",
    address: "古城北入口",
    desc: "古城出入口导览信息。",
  },
]

const detailTabs = [
  { key: "intro", label: "简介", icon: Info },
  { key: "nav", label: "导航", icon: Navigation },
  { key: "audio", label: "讲解", icon: Volume2 },
  { key: "share", label: "分享", icon: Share2 },
]

export function MapPage() {
  const [activeCat, setActiveCat] = useState<string>("view")
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [detailTab, setDetailTab] = useState("intro")
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

  const parkings = useContentPOIStore((s) => s.parkings)
  const warningAreas = useFlowWarningStore((s) => s.areas)
  const getAreaLevel = useFlowWarningStore((s) => s.getAreaLevel)
  const [showWarning, setShowWarning] = useState(false)
  const warningAreas2 = warningAreas // alias to avoid unused

  const current = categories.find((c) => c.key === activeCat)!
  const visiblePins = pins.filter((p) => p.category === activeCat)

  // 停车场数据：区分自营/第三方
  const parkingPins = activeCat === "parking" ? parkings : []
  const selfParkingCount = parkings.filter((p) => p.type === "self_operated").length
  const thirdParkingCount = parkings.filter((p) => p.type === "third_party").length

  const getParkingColor = (type: "self_operated" | "third_party") => (type === "self_operated" ? "#3B82F6" : "#F97316")

  const getParkingIcon = (type: "self_operated" | "third_party") => (type === "self_operated" ? Building2 : Store)

  // 停车场位置映射（简化：使用预定义位置）
  const parkingPositions = [
    { top: "18%", left: "30%" },
    { top: "28%", left: "65%" },
    { top: "50%", left: "35%" },
    { top: "65%", left: "55%" },
    { top: "25%", left: "70%" },
  ]

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="导览地图" back="/c/home" />

      {/* 人流量预警浮层（第⑤业务链 C 端联动）*/}
      <div className="px-3 pt-2">
        <button
          onClick={() => setShowWarning(!showWarning)}
          className="w-full bg-white rounded-xl p-3 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const worst = warningAreas2.reduce((max, a) => {
                const order = { green: 0, yellow: 1, orange: 2, red: 3 } as const
                return order[getAreaLevel(a.id)] > order[getAreaLevel(max.id)] ? a : max
              }, warningAreas2[0])
              const meta = LEVEL_META[getAreaLevel(worst.id)]
              return (
                <>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${meta.bg.replace("bg-", "bg-").replace("-100", "-500")}`}
                  />
                  <span className="text-[13px] font-medium text-text-heading">实时人流</span>
                  <span className={`text-[12px] ${meta.color}`}>
                    {worst.name} {meta.label}
                  </span>
                </>
              )
            })()}
          </div>
          <span className="text-[12px] text-primary">{showWarning ? "收起" : "查看全部"}</span>
        </button>
        {showWarning && (
          <div className="mt-2 bg-white rounded-xl p-3 grid grid-cols-3 gap-2">
            {warningAreas2.map((a) => {
              const level = getAreaLevel(a.id)
              const meta = LEVEL_META[level]
              const pct = Math.round((a.current / a.capacity) * 100)
              return (
                <div key={a.id} className={`rounded-lg p-2 ${meta.bg}`}>
                  <p className="text-[11px] font-medium text-text-heading truncate">{a.name}</p>
                  <p className={`text-[14px] font-bold ${meta.color}`}>{pct}%</p>
                  <p className={`text-[10px] ${meta.color}`}>{meta.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-white">
        <div className="flex items-center gap-2 bg-[#F5EFE2] rounded-full h-9 px-3">
          <Search size={14} className="text-text-tertiary" />
          <span className="flex-1 text-[13px] text-text-tertiary">搜索景点、商家、关键字</span>
        </div>
      </div>

      <div className="relative flex-1 flex">
        {/* Left category sidebar */}
        <div className="w-[62px] bg-white/85 backdrop-blur-sm py-2 overflow-y-auto border-r border-[#A8D0F5]">
          {categories.map((c) => {
            const Icon = c.icon
            const on = c.key === activeCat
            return (
              <button
                key={c.key}
                onClick={() => {
                  setActiveCat(c.key)
                  setSelectedPin(null)
                }}
                className="w-full flex flex-col items-center py-2 gap-1"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(60,120,200,0.12)] transition-transform"
                  style={{
                    backgroundColor: on ? c.color : "#fff",
                    border: on ? "none" : `1.5px solid ${c.color}40`,
                    transform: on ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <Icon size={18} color={on ? "#fff" : c.color} />
                </div>
                <span className="text-[11px]" style={{ color: on ? c.color : "#666" }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Map area */}
        <div className="relative flex-1 overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70"
            alt="古城地图"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface-page/10 via-transparent to-surface-page/30" />

          {activeCat === "parking" ? (
            // 停车场视图
            <>
              {parkingPins.map((p, idx) => {
                const pos = parkingPositions[idx] || { top: "50%", left: "50%" }
                const color = getParkingColor(p.type)
                const Icon = getParkingIcon(p.type)
                const isOpen = p.status !== "closed"
                const isFull = p.status === "full"
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPin({
                        id: p.id as unknown as number,
                        name: p.name,
                        category: "parking",
                        top: pos.top,
                        left: pos.left,
                        image: p.imageUrl || "",
                        address: p.address,
                        desc: `${p.totalSpots}个车位 · ${p.hours}`,
                        lat: p.lat,
                        lng: p.lng,
                        totalSpots: p.totalSpots,
                        description: p.description,
                      })
                      setDetailTab("intro")
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.2)] border-2 border-white"
                      style={{ backgroundColor: isOpen ? color : "#999" }}
                    >
                      <Icon size={16} color="#fff" />
                    </div>
                    <div className="mt-0.5 text-[10px] text-center whitespace-nowrap px-1 rounded bg-white/90 text-text-body shadow-sm">
                      {p.name}
                    </div>
                    {userLat != null && (
                      <div className="mt-0.5 text-[9px] text-center whitespace-nowrap px-1 rounded bg-primary/10 text-primary shadow-sm">
                        {formatDistance(haversineDistance(userLat, userLng!, p.lat, p.lng))}
                      </div>
                    )}
                    {isFull && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center">
                        满
                      </div>
                    )}
                  </button>
                )
              })}

              {/* 图例 */}
              <div className="absolute top-3 right-3 bg-white/90 rounded-lg px-2 py-1.5 text-[10px] space-y-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-text-secondary">平台自营({selfParkingCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-text-secondary">第三方({thirdParkingCount})</span>
                </div>
              </div>

              {userLat != null && (
                <div className="absolute" style={{ top: "42%", left: "50%" }}>
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.3)] animate-pulse" />
                  <div className="mt-0.5 text-[9px] text-center whitespace-nowrap px-1 rounded bg-white/90 text-blue-600 shadow-sm">
                    您的位置
                  </div>
                </div>
              )}
            </>
          ) : (
            // 普通标记点视图
            visiblePins.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPin(p)
                  setDetailTab("intro")
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: p.top, left: p.left }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.2)] border-2 border-white"
                  style={{ backgroundColor: current.color }}
                >
                  {(() => {
                    const Icon = current.icon
                    return <Icon size={15} color="#fff" />
                  })()}
                </div>
                <div className="mt-0.5 text-[10px] text-center whitespace-nowrap px-1 rounded bg-white/90 text-text-body shadow-sm">
                  {p.name}
                </div>
              </button>
            ))
          )}

          <button className="absolute bottom-24 right-3 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
            <Navigation size={18} className="text-primary" />
          </button>

          {/* Bottom count bar */}
          {!selectedPin && (
            <div className="absolute left-3 right-3 bottom-3 bg-white rounded-2xl shadow-[0_6px_20px_rgba(60,120,200,0.15)] px-4 py-3 flex items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${current.color}1A` }}
              >
                <current.icon size={18} color={current.color} />
              </div>
              <div className="flex-1">
                <div className="text-[14px] text-text-body">{current.label}</div>
                <div className="text-[11px] text-text-tertiary mt-0.5">
                  {activeCat === "parking"
                    ? `平台自营 ${selfParkingCount} 个 | 第三方 ${thirdParkingCount} 个`
                    : `此处共找到 ${current.count} 个`}
                </div>
              </div>
              <X size={18} className="text-text-tertiary" />
            </div>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      {selectedPin && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(60,120,200,0.15)] animate-in slide-in-from-bottom duration-200">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border-light">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${current.color}1A` }}
              >
                <current.icon size={14} color={current.color} />
              </div>
              <div className="text-[15px] text-text-body">{selectedPin.name}</div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="w-7 h-7 rounded-full bg-[#F5EFE2] flex items-center justify-center"
            >
              <X size={14} className="text-text-tertiary" />
            </button>
          </div>

          <div className="flex border-b border-border-light">
            {detailTabs.map((t) => {
              const Icon = t.icon
              const on = detailTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key)}
                  className="flex-1 flex flex-col items-center gap-1 py-2"
                  style={{ color: on ? "#3B82F6" : "#666" }}
                >
                  <Icon size={16} />
                  <span className="text-[12px]">{t.label}</span>
                  {on && <div className="h-0.5 w-6 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>

          <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
            {detailTab === "intro" && (
              <div>
                <div className="text-[13px] text-text-body mb-1">{selectedPin.address}</div>
                <div className="text-[12px] text-primary font-medium mb-3">共 {selectedPin.totalSpots ?? 0} 个车位</div>
                <div className="rounded-xl overflow-hidden mb-3">
                  <ImageWithFallback
                    src={selectedPin.image}
                    alt={selectedPin.name}
                    className="w-full h-40 object-cover"
                  />
                </div>
                {selectedPin.description ? (
                  <p className="text-[12px] text-[#555] leading-relaxed whitespace-pre-wrap">
                    {selectedPin.description}
                  </p>
                ) : (
                  <p className="text-[12px] text-[#555] leading-relaxed">{selectedPin.desc}</p>
                )}
              </div>
            )}
            {detailTab === "nav" && (
              <div className="py-6 text-center">
                <Navigation size={32} className="text-primary mx-auto mb-2" />
                <div className="text-[13px] text-text-body">开启导航前往「{selectedPin.name}」</div>
                <button
                  onClick={() => {
                    if (selectedPin.lat && selectedPin.lng) {
                      window.open(
                        `https://uri.amap.com/marker?position=${selectedPin.lng},${selectedPin.lat}&name=${encodeURIComponent(selectedPin.name)}`,
                        "_blank"
                      )
                    }
                  }}
                  className="mt-4 h-10 px-8 rounded-full bg-gradient-to-r from-primary-light to-primary text-white text-[13px]"
                >
                  立即导航
                </button>
              </div>
            )}
            {detailTab === "audio" && (
              <div className="py-6 text-center">
                <Volume2 size={32} className="text-primary mx-auto mb-2" />
                <div className="text-[13px] text-text-body">智能语音讲解 · 时长约 2 分 30 秒</div>
                <button className="mt-4 h-10 px-8 rounded-full bg-gradient-to-r from-primary to-primary text-white text-[13px]">
                  播放讲解
                </button>
              </div>
            )}
            {detailTab === "share" && (
              <div className="py-6 text-center">
                <Share2 size={32} className="text-[#6A5ACD] mx-auto mb-2" />
                <div className="text-[13px] text-text-body">分享「{selectedPin.name}」给好友</div>
                <div className="flex justify-center gap-3 mt-4">
                  <button className="h-9 px-5 rounded-full bg-[#F5EFE2] text-[12px] text-text-body">微信好友</button>
                  <button className="h-9 px-5 rounded-full bg-[#F5EFE2] text-[12px] text-text-body">朋友圈</button>
                  <button className="h-9 px-5 rounded-full bg-[#F5EFE2] text-[12px] text-text-body">复制链接</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
