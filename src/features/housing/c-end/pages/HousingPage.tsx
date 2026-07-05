import { useState, useRef } from "react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { Search, Filter, ChevronLeft, ChevronRight, Play, Pause, MapPin, Home, FileText, Receipt } from "lucide-react"

const realHouses = [
  {
    id: 1,
    name: "光义街9号公房",
    addr: "丽江市古城区光义街9号（铺面）",
    status: "rented",
    statusText: "出租",
    area: "gucheng",
    areaName: "古城区",
    hasPano: true,
    meta: ["267.74㎡", "特色食品", "砖木结构"],
    photos: [
      { bg: "linear-gradient(135deg,#B5D4F4 0%,#85B7EB 100%)" },
      { bg: "linear-gradient(135deg,#85B7EB 0%,#378ADD 100%)" },
      { bg: "linear-gradient(135deg,#E6F1FB 0%,#B5D4F4 100%)" },
    ],
    basic: [
      { label: "出租状态", value: "出租", badge: "rented" },
      { label: "门牌号", value: "光义街9号（铺面）" },
      { label: "街道编号", value: "新院巷63号" },
      { label: "地图坐标", value: "26.86992,100.235449" },
      { label: "房屋状态", value: "正常", badge: "normal" },
      { label: "房产证地址", value: "丽江市古城区光义街63、64、65号营业用房公房B-8-13号A-19号" },
      { label: "商业类型", value: "特色食品" },
      { label: "房屋总面积(㎡)", value: "267.74" },
      { label: "证载总面积(㎡)", value: "267.74" },
      { label: "房屋结构", value: "砖木结构" },
      { label: "房屋用途", value: "公私掺杂院落" },
    ],
    contract: [
      { label: "租期开始日期", value: "2025-07-01" },
      { label: "租期结束日期", value: "2028-07-01" },
      { label: "签订日期", value: "2025-06-23" },
      { label: "合同年限", value: "3年" },
      { label: "月租金(元)", value: "6666.67", cls: "price" },
      { label: "押金金额(元)", value: "20000", cls: "price" },
      { label: "合同状态", value: "已签", badge: "signed" },
      { label: "商铺名称", value: "古城区靛青蓝服装店" },
    ],
    lease: [
      { label: "应缴金额(元)", value: "25000", cls: "price" },
      { label: "缴费状态", value: "已缴纳", badge: "paid" },
      { label: "实缴金额(元)", value: "25000", cls: "price" },
    ],
  },
  {
    id: 2,
    name: "新院巷63号公房",
    addr: "丽江市古城区新院巷63号",
    status: "idle",
    statusText: "未出租",
    area: "gucheng",
    areaName: "古城区",
    hasPano: true,
    meta: ["185.50㎡", "闲置", "木结构"],
    photos: [
      { bg: "linear-gradient(135deg,#C0DD97 0%,#85B7EB 100%)" },
      { bg: "linear-gradient(135deg,#9FE1CB 0%,#5DCAA5 100%)" },
      { bg: "linear-gradient(135deg,#E6F1FB 0%,#9FE1CB 100%)" },
      { bg: "linear-gradient(135deg,#B5D4F4 0%,#C0DD97 100%)" },
    ],
    basic: [
      { label: "出租状态", value: "未出租", badge: "idle" },
      { label: "门牌号", value: "新院巷63号" },
      { label: "街道编号", value: "新院巷63号" },
      { label: "地图坐标", value: "26.87125,100.232678" },
      { label: "房屋状态", value: "正常", badge: "normal" },
      { label: "房产证地址", value: "丽江市古城区新院巷63号营业用房" },
      { label: "商业类型", value: "闲置" },
      { label: "房屋总面积(㎡)", value: "185.50" },
      { label: "证载总面积(㎡)", value: "182.00" },
      { label: "房屋结构", value: "木结构" },
      { label: "房屋用途", value: "普通院落" },
    ],
    contract: [
      { label: "租期开始日期", value: "——" },
      { label: "租期结束日期", value: "——" },
      { label: "签订日期", value: "——" },
      { label: "合同年限", value: "——" },
      { label: "月租金(元)", value: "——" },
      { label: "押金金额(元)", value: "——" },
      { label: "合同状态", value: "未签", badge: "unsigned" },
      { label: "商铺名称", value: "——" },
    ],
    lease: [
      { label: "应缴金额(元)", value: "——" },
      { label: "缴费状态", value: "——" },
      { label: "实缴金额(元)", value: "——" },
    ],
  },
  {
    id: 3,
    name: "五一街32号公房",
    addr: "丽江市古城区五一街32号",
    status: "rented",
    statusText: "出租",
    area: "gucheng",
    areaName: "古城区",
    hasPano: false,
    meta: ["156.30㎡", "饰品", "砖混结构"],
    photos: [
      { bg: "linear-gradient(135deg,#FAC775 0%,#EF9F27 100%)" },
      { bg: "linear-gradient(135deg,#FAEEDA 0%,#FAC775 100%)" },
    ],
    basic: [
      { label: "出租状态", value: "出租", badge: "rented" },
      { label: "门牌号", value: "五一街32号" },
      { label: "街道编号", value: "五一街32号" },
      { label: "地图坐标", value: "26.87310,100.231890" },
      { label: "房屋状态", value: "异常", badge: "abnormal" },
      { label: "房产证地址", value: "丽江市古城区五一街32号营业用房公房C-5-08号" },
      { label: "商业类型", value: "饰品" },
      { label: "房屋总面积(㎡)", value: "156.30" },
      { label: "证载总面积(㎡)", value: "156.30" },
      { label: "房屋结构", value: "砖混结构" },
      { label: "房屋用途", value: "普通店铺" },
    ],
    contract: [
      { label: "租期开始日期", value: "2024-04-01" },
      { label: "租期结束日期", value: "2027-03-31" },
      { label: "签订日期", value: "2024-03-15" },
      { label: "合同年限", value: "3年" },
      { label: "月租金(元)", value: "4500", cls: "price" },
      { label: "押金金额(元)", value: "13500", cls: "price" },
      { label: "合同状态", value: "已签", badge: "signed" },
      { label: "商铺名称", value: "丽江银器坊" },
    ],
    lease: [
      { label: "应缴金额(元)", value: "25000", cls: "price" },
      { label: "缴费状态", value: "未缴纳", badge: "unpaid" },
      { label: "实缴金额(元)", value: "0", cls: "price" },
    ],
  },
  {
    id: 4,
    name: "兴文巷18号公房",
    addr: "丽江市古城区兴文巷18号",
    status: "rented",
    statusText: "出租",
    area: "gucheng",
    areaName: "古城区",
    hasPano: true,
    meta: ["320.00㎡", "餐饮", "砖木结构"],
    photos: [
      { bg: "linear-gradient(135deg,#B5D4F4 0%,#9FE1CB 100%)" },
      { bg: "linear-gradient(135deg,#9FE1CB 0%,#B5D4F4 100%)" },
      { bg: "linear-gradient(135deg,#E1F5EE 0%,#9FE1CB 100%)" },
    ],
    basic: [
      { label: "出租状态", value: "出租", badge: "rented" },
      { label: "门牌号", value: "兴文巷18号" },
      { label: "街道编号", value: "兴文巷18号" },
      { label: "地图坐标", value: "26.86850,100.233780" },
      { label: "房屋状态", value: "正常", badge: "normal" },
      { label: "房产证地址", value: "丽江市古城区兴文巷18号公房D-3-07号" },
      { label: "商业类型", value: "餐饮" },
      { label: "房屋总面积(㎡)", value: "320.00" },
      { label: "证载总面积(㎡)", value: "318.50" },
      { label: "房屋结构", value: "砖木结构" },
      { label: "房屋用途", value: "公私掺杂院落" },
    ],
    contract: [
      { label: "租期开始日期", value: "2023-08-01" },
      { label: "租期结束日期", value: "2028-07-31" },
      { label: "签订日期", value: "2023-08-01" },
      { label: "合同年限", value: "5年" },
      { label: "月租金(元)", value: "8200", cls: "price" },
      { label: "押金金额(元)", value: "24600", cls: "price" },
      { label: "合同状态", value: "已签", badge: "signed" },
      { label: "商铺名称", value: "古城小院餐厅" },
    ],
    lease: [
      { label: "应缴金额(元)", value: "25000", cls: "price" },
      { label: "缴费状态", value: "已缴纳", badge: "paid" },
      { label: "实缴金额(元)", value: "25000", cls: "price" },
    ],
  },
  {
    id: 5,
    name: "七一街8号公房",
    addr: "丽江市古城区七一街8号",
    status: "idle",
    statusText: "未出租",
    area: "gucheng",
    areaName: "古城区",
    hasPano: false,
    meta: ["98.60㎡", "房屋已收回", "砖混结构"],
    photos: [
      { bg: "linear-gradient(135deg,#E6F1FB 0%,#B5D4F4 100%)" },
      { bg: "linear-gradient(135deg,#B5D4F4 0%,#85B7EB 100%)" },
    ],
    basic: [
      { label: "出租状态", value: "未出租", badge: "idle" },
      { label: "门牌号", value: "七一街8号" },
      { label: "街道编号", value: "七一街8号" },
      { label: "地图坐标", value: "26.87015,100.234510" },
      { label: "房屋状态", value: "异常", badge: "abnormal" },
      { label: "房产证地址", value: "丽江市古城区七一街8号公房E-1-22号" },
      { label: "商业类型", value: "房屋已收回" },
      { label: "房屋总面积(㎡)", value: "98.60" },
      { label: "证载总面积(㎡)", value: "96.20" },
      { label: "房屋结构", value: "砖混结构" },
      { label: "房屋用途", value: "普通店铺" },
    ],
    contract: [
      { label: "租期开始日期", value: "2022-01-01" },
      { label: "租期结束日期", value: "2024-12-31" },
      { label: "签订日期", value: "2021-12-20" },
      { label: "合同年限", value: "3年" },
      { label: "月租金(元)", value: "3200", cls: "price" },
      { label: "押金金额(元)", value: "9600", cls: "price" },
      { label: "合同状态", value: "过期", badge: "expired" },
      { label: "商铺名称", value: "——" },
    ],
    lease: [
      { label: "应缴金额(元)", value: "——" },
      { label: "缴费状态", value: "——" },
      { label: "实缴金额(元)", value: "——" },
    ],
  },
]

const streets = ["光义街", "五一街", "七一街", "兴文巷", "新院巷", "新华街", "义尚街", "文治巷", "现云巷", "积善巷"]
const structures = ["砖木结构", "木结构", "砖混结构", "土木结构"]
const bizTypes = ["特色食品", "餐饮", "饰品", "手工艺", "茶叶", "银器", "客栈", "服装", "酒吧", "咖啡馆", "文创"]
const shopNames = [
  "丽江银器坊",
  "古城小院餐厅",
  "靛青蓝服装店",
  "云上花房",
  "雪山茶庄",
  "束河手作",
  "纳西织锦",
  "玉龙酒馆",
  "蓝月咖啡",
  "古城记忆文创",
]
const areas = ["古城区", "玉龙县", "永胜县", "华坪县", "宁蒗县"]

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const houses = [...realHouses] as House[]

for (let i = 0; i < 50; i++) {
  const street = randPick(streets)
  const num = randInt(1, 120)
  const isRented = Math.random() > 0.3
  const areaName = Math.random() > 0.3 ? "古城区" : randPick(areas.slice(1))
  const bizType = isRented ? randPick(bizTypes.slice(0, -2)) : randPick(["闲置", "房屋已收回"])
  const struct = randPick(structures)
  const areaVal = (randInt(30, 450) + Math.random()).toFixed(2)
  const certArea = (parseFloat(areaVal) - randInt(0, 5) - Math.random()).toFixed(2)
  const rentVal = isRented ? (randInt(800, 12000) + Math.random() * 100).toFixed(2) : "——"
  const deposit = isRented ? (parseInt(rentVal) * 3).toString() : "——"
  const contractYears = isRented ? randPick([1, 2, 3, 5]) : 0
  const contractStatus = isRented ? "已签" : Math.random() > 0.6 ? "过期" : "未签"
  const houseStatus = Math.random() > 0.15 ? "正常" : "异常"
  const payStatus = isRented ? (Math.random() > 0.2 ? "已缴纳" : "未缴纳") : "——"
  const leaseAmt = isRented ? (parseInt(rentVal) * contractYears * 12).toString() : "——"
  const paidAmt = payStatus === "已缴纳" ? leaseAmt : payStatus === "未缴纳" ? "0" : "——"

  const y1 = randInt(2022, 2025)
  const m1 = String(randInt(1, 12)).padStart(2, "0")
  const d1 = String(randInt(1, 28)).padStart(2, "0")
  const y2 = y1 + (isRented ? contractYears : 0)
  const signM = String(Math.max(1, parseInt(m1) - randInt(0, 2))).padStart(2, "0")
  const signD = String(randInt(1, 28)).padStart(2, "0")

  houses.push({
    id: 6 + i,
    name: `${street}${num}号公房`,
    addr: `丽江市${areaName}${street}${num}号`,
    status: isRented ? "rented" : "idle",
    statusText: isRented ? "出租" : "未出租",
    area: areaName === "古城区" ? "gucheng" : "other",
    areaName,
    hasPano: Math.random() > 0.4,
    meta: [`${areaVal}㎡`, bizType, struct],
    photos: Array.from({ length: randInt(1, 4) }, () => ({
      bg: `linear-gradient(135deg, ${randPick(["#B5D4F4", "#85B7EB", "#C0DD97", "#9FE1CB", "#FAC775", "#E6F1FB"])} 0%, ${randPick(["#85B7EB", "#378ADD", "#5DCAA5", "#EF9F27"])} 100%)`,
    })),
    basic: [
      { label: "出租状态", value: isRented ? "出租" : "未出租", badge: isRented ? "rented" : "idle" },
      { label: "门牌号", value: `${street}${num}号` },
      { label: "街道编号", value: `${street}${num}号` },
      {
        label: "地图坐标",
        value: `${(26.86 + Math.random() * 0.04).toFixed(5)},${(100.23 + Math.random() * 0.02).toFixed(6)}`,
      },
      { label: "房屋状态", value: houseStatus, badge: houseStatus === "正常" ? "normal" : "abnormal" },
      { label: "房产证地址", value: `丽江市${areaName}${street}${num}号营业用房` },
      { label: "商业类型", value: bizType },
      { label: "房屋总面积(㎡)", value: areaVal },
      { label: "证载总面积(㎡)", value: certArea },
      { label: "房屋结构", value: struct },
      { label: "房屋用途", value: randPick(["公私掺杂院落", "普通店铺", "普通院落", "临街铺面", "特色院落"]) },
    ],
    contract: [
      { label: "租期开始日期", value: isRented ? `${y1}-${m1}-${d1}` : "——" },
      { label: "租期结束日期", value: isRented ? `${y2}-${m1}-${d1}` : "——" },
      { label: "签订日期", value: isRented ? `${y1}-${signM}-${signD}` : "——" },
      { label: "合同年限", value: String(contractYears) + "年" },
      { label: "月租金(元)", value: rentVal, cls: isRented ? "price" : "" },
      { label: "押金金额(元)", value: deposit, cls: isRented ? "price" : "" },
      {
        label: "合同状态",
        value: contractStatus,
        badge: contractStatus === "已签" ? "signed" : contractStatus === "过期" ? "expired" : "unsigned",
      },
      { label: "商铺名称", value: isRented ? randPick(shopNames) : "——" },
    ],
    lease: [
      { label: "应缴金额(元)", value: leaseAmt, cls: isRented ? "price" : "" },
      {
        label: "缴费状态",
        value: payStatus,
        badge: payStatus === "已缴纳" ? "paid" : payStatus === "未缴纳" ? "unpaid" : "",
      },
      { label: "实缴金额(元)", value: paidAmt, cls: isRented ? "price" : "" },
    ],
  })
}

const PAGE_SIZE = 10

interface House {
  id: number
  name: string
  addr: string
  status: "rented" | "idle"
  statusText: string
  area: string
  areaName: string
  hasPano: boolean
  meta: string[]
  photos: { bg: string }[]
  basic: { label: string; value: string; badge?: string }[]
  contract: { label: string; value: string; cls?: string; badge?: string }[]
  lease: { label: string; value: string; cls?: string; badge?: string }[]
}

const badgeClass: Record<string, string> = {
  idle: "bg-[#DCFCE7] text-[#22C55E]",
  rented: "bg-[#DBEAFE] text-[#2563EB]",
  normal: "bg-[#DBEAFE] text-[#2563EB]",
  abnormal: "bg-[#FEE2E2] text-[#EF4444]",
  signed: "bg-[#DBEAFE] text-[#2563EB]",
  unsigned: "bg-[#FEE2E2] text-[#EF4444]",
  expired: "bg-[#FEF3C7] text-[#F59E0B]",
  paid: "bg-[#DCFCE7] text-[#22C55E]",
  unpaid: "bg-[#FEE2E2] text-[#EF4444]",
}

export function HousingPage() {
  const [showDetail, setShowDetail] = useState(false)
  const [currentHouse, setCurrentHouse] = useState<House | null>(null)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [currentFilter, setCurrentFilter] = useState<"all" | "rented" | "idle">("all")
  const [searchKw, setSearchKw] = useState("")
  const [showPano, setShowPano] = useState(false)
  const [panoPlaying, setPanoPlaying] = useState(false)
  const [panoProgress, setPanoProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const sliderRef = useRef<HTMLDivElement>(null)
  const panoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filtered = houses.filter((h) => {
    const matchStatus = currentFilter === "all" || h.status === currentFilter
    const matchSearch = !searchKw || h.name.toLowerCase().includes(searchKw.toLowerCase()) || h.addr.includes(searchKw)
    return matchStatus && matchSearch
  })

  const displayed = filtered.slice(0, currentPage * PAGE_SIZE)
  const hasMore = displayed.length < filtered.length

  const stats = {
    total: houses.length,
    rented: houses.filter((h) => h.status === "rented").length,
    idle: houses.filter((h) => h.status === "idle").length,
  }

  const openDetail = (house: House) => {
    setCurrentHouse(house)
    setCurrentPhoto(0)
    setShowDetail(true)
  }

  const closeDetail = () => {
    setShowDetail(false)
    stopPano()
  }

  const startPano = () => {
    setPanoPlaying(true)
    panoTimerRef.current = setInterval(() => {
      setPanoProgress((p) => {
        if (p >= 100) {
          stopPano()
          return 100
        }
        return p + 1
      })
    }, 80)
  }

  const stopPano = () => {
    setPanoPlaying(false)
    if (panoTimerRef.current) clearInterval(panoTimerRef.current)
  }

  const togglePano = () => {
    if (panoPlaying) stopPano()
    else startPano()
  }
  const prevPhoto = () => {
    if (!currentHouse) return
    setCurrentPhoto((p) => Math.max(0, p - 1))
  }
  const nextPhoto = () => {
    if (!currentHouse) return
    setCurrentPhoto((p) => Math.min(currentHouse.photos.length - 1, p + 1))
  }

  // 详情页
  if (showDetail && currentHouse) {
    return (
      <div className="min-h-full bg-surface-page flex flex-col">
        <PageHeader title="公房详情" back={closeDetail} />

        <div className="flex-1 overflow-y-auto pb-6">
          {/* 照片轮播 */}
          <div className="relative bg-black/5">
            <div className="overflow-hidden h-[200px]">
              <div
                className="flex h-full transition-transform duration-300"
                style={{
                  width: `${currentHouse.photos.length * 100}%`,
                  transform: `translateX(-${currentPhoto * (100 / currentHouse.photos.length)}%)`,
                }}
              >
                {currentHouse.photos.map((p, i) => (
                  <div
                    key={i}
                    className="h-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: p.bg }}
                  >
                    <span className="text-white/75 text-[12px]">第 {i + 1} 张 · 实景照片</span>
                  </div>
                ))}
              </div>
            </div>
            {currentHouse.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="text-[11px] text-white bg-black/40 px-2 py-0.5 rounded-full">
                {currentPhoto + 1} / {currentHouse.photos.length}
              </span>
              <div className="flex gap-1.5">
                {currentHouse.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPhoto ? "bg-white w-4" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </div>
            {currentHouse.hasPano && (
              <button
                onClick={() => setShowPano(true)}
                className="absolute top-3 right-3 bg-white/90 rounded-lg px-3 py-1.5 text-[12px] text-primary font-medium flex items-center gap-1 shadow"
              >
                <Play size={12} /> 全景
              </button>
            )}
          </div>

          {/* 详情头部 */}
          <div className="px-4 -mt-10 relative z-10">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-[17px] font-semibold text-text-heading">{currentHouse.name}</h2>
                    <p className="text-[12px] text-text-tertiary mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      {currentHouse.addr}
                    </p>
                  </div>
                  <span className={`text-[12px] px-3 py-1 rounded-full ${badgeClass[currentHouse.status]}`}>
                    {currentHouse.statusText}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 bg-primary/5 flex gap-4">
                {currentHouse.meta.map((m, i) => (
                  <span key={i} className="text-[12px] text-primary/80 bg-white px-2.5 py-1 rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 信息分组 */}
          <div className="px-4 mt-4 space-y-3">
            {[
              { title: "基础信息", rows: currentHouse.basic, icon: Home },
              { title: "合同信息", rows: currentHouse.contract, icon: FileText },
              { title: "租赁信息", rows: currentHouse.lease, icon: Receipt },
            ].map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-[#F3F3F3] flex items-center gap-2">
                  <section.icon size={16} className="text-primary" />
                  <span className="text-[14px] font-medium text-text-heading">{section.title}</span>
                </div>
                <div className="px-4 py-1">
                  {section.rows.map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-start justify-between py-3 ${i !== section.rows.length - 1 ? "border-b border-[#F9F9F9]" : ""}`}
                    >
                      <span className="text-[13px] text-text-secondary w-28 flex-shrink-0">{row.label}</span>
                      <span
                        className={`text-[13px] text-text-body text-right ${(row as any).cls === "price" ? "text-primary font-medium" : ""}`}
                      >
                        {row.badge ? (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeClass[row.badge]}`}>
                            {row.value}
                          </span>
                        ) : (
                          row.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 全景弹层 */}
        {showPano && (
          <div className="fixed inset-0 bg-[#042C53] z-50 flex flex-col items-center justify-center gap-6">
            <p className="text-white text-[16px] font-medium">720° 全景 · {currentHouse.name}</p>
            <div className="w-[320px] h-[210px] rounded-2xl bg-gradient-to-b from-[#042C53] via-[#185FA5] to-[#378ADD] flex flex-col items-center justify-center shadow-2xl">
              <button
                onClick={togglePano}
                className="w-14 h-14 rounded-full border-2 border-white/70 flex items-center justify-center active:scale-95 transition-transform"
              >
                {panoPlaying ? (
                  <Pause size={22} className="text-white" />
                ) : (
                  <Play size={22} className="text-white pl-0.5" />
                )}
              </button>
              <p className="text-white/85 text-[13px] mt-4">全景漫游 · 左右滑动旋转视角</p>
            </div>
            <div className="w-[280px] h-2 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${panoProgress}%` }}
              />
            </div>
            <p className="text-[#85B7EB] text-[13px]">
              {panoPlaying ? "播放中..." : panoProgress >= 100 ? "播放完成" : "点击播放"}
            </p>
            <button
              onClick={() => {
                setShowPano(false)
                stopPano()
              }}
              className="text-white text-[14px] px-8 py-2.5 rounded-full border border-white/30 bg-white/10"
            >
              关闭全景
            </button>
          </div>
        )}
      </div>
    )
  }

  // 列表页
  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="公房服务" back="/c/home" />

      {/* 搜索 + 筛选 */}
      <div className="px-4 py-3 bg-white space-y-3">
        <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-full h-11 px-4 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white transition-all">
          <Search size={18} className="text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索公房名称、地址..."
            value={searchKw}
            onChange={(e) => {
              setSearchKw(e.target.value)
              setCurrentPage(1)
            }}
            className="flex-1 bg-transparent text-[14px] text-text-body outline-none placeholder:text-text-tertiary"
          />
          <button onClick={() => {}} className="text-[12px] text-primary font-medium">
            筛选
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "rented", "idle"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setCurrentFilter(s)
                setCurrentPage(1)
              }}
              className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors ${
                currentFilter === s ? "bg-primary text-white" : "bg-[#F5F5F5] text-text-secondary"
              }`}
            >
              {s === "all" ? "全部" : s === "rented" ? "出租" : "未出租"}
            </button>
          ))}
        </div>
      </div>

      {/* 统计栏 */}
      <div className="px-4 py-4 bg-white border-t border-b border-border-light">
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-primary">{stats.total}</span>
            <span className="text-[11px] text-text-tertiary mt-0.5">全部</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-primary">{stats.rented}</span>
            <span className="text-[11px] text-text-tertiary mt-0.5">出租</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-bold text-[#22C55E]">{stats.idle}</span>
            <span className="text-[11px] text-text-tertiary mt-0.5">未出租</span>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-6">
        {displayed.map((house) => (
          <div
            key={house.id}
            onClick={() => openDetail(house)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="relative h-[100px]" style={{ background: house.photos[0].bg }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute bottom-2 left-3 text-[10px] text-white bg-black/40 px-2 py-0.5 rounded-full">
                {house.photos.length} 张照片
              </span>
              {house.hasPano && (
                <span className="absolute top-2 right-2 text-[10px] text-white bg-primary/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Play size={8} /> 全景
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[15px] font-semibold text-text-heading">{house.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeClass[house.status]}`}>
                  {house.statusText}
                </span>
              </div>
              <p className="text-[12px] text-text-tertiary mb-2 flex items-center gap-1">
                <MapPin size={11} className="text-text-tertiary" />
                {house.addr}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {house.meta.map((m, i) => (
                  <span key={i} className="text-[11px] text-text-secondary bg-surface-page px-2 py-0.5 rounded">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-text-tertiary text-[13px]">暂无符合条件的公房</div>
        ) : hasMore ? (
          <div className="text-center pt-2">
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="text-[13px] text-primary px-8 py-2.5 rounded-full border-2 border-primary/20 font-medium"
            >
              加载更多
            </button>
            <p className="text-[11px] text-text-tertiary mt-2">
              已显示 {displayed.length} / {filtered.length} 条
            </p>
          </div>
        ) : (
          <p className="text-center text-[12px] text-text-tertiary pt-4">共 {filtered.length} 条，已全部加载</p>
        )}
      </div>
    </div>
  )
}
