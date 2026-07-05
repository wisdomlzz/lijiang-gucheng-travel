import { create } from "zustand"
import type { ConvenienceService } from "../../../shared/types"

const imgGarbage = "https://images.unsplash.com/photo-1761479578279-ffbefd2408e4?auto=format&fit=crop&w=600&q=70"
const imgConstruction = "https://images.unsplash.com/photo-1761599933915-9953de089a66?auto=format&fit=crop&w=600&q=70"
const imgLinen = "https://images.unsplash.com/photo-1724847885015-be191f1a47ef?auto=format&fit=crop&w=600&q=70"
const imgWater = "https://images.unsplash.com/photo-1774557937035-1c049df69d07?auto=format&fit=crop&w=600&q=70"
const imgLuggage = "https://images.unsplash.com/photo-1603431022944-498d34260a16?auto=format&fit=crop&w=600&q=70"
const imgDelivery = "https://images.unsplash.com/photo-1620455800201-7f00aeef12ed?auto=format&fit=crop&w=600&q=70"

const DEFAULT: ConvenienceService[] = [
  {
    id: "garbage",
    name: "生活垃圾清运",
    price: "¥30/方 起",
    emoji: "🗑️",
    image: imgGarbage,
    tag: "定点网格",
    tagColor: "bg-[#0EA5E9]",
    unit: "方",
    type: "grid",
    description: "定点网格服务・系统自动绑定一编",
    priceNote: "起步价 ¥50/方，2 公里内不加价，超 2 公里按 ¥8/公里加收\n最终价格以工作人员现场确认为准",
  },
  {
    id: "construction",
    name: "建筑垃圾清运",
    price: "¥50/方 起",
    emoji: "🧱",
    image: imgConstruction,
    tag: "定点网格",
    tagColor: "bg-primary",
    unit: "方",
    type: "grid",
    description: "定点网格服务・系统自动绑定一编",
    priceNote: "起步价 ¥50/方，2 公里内不加价，超 2 公里按 ¥8/公里加收\n最终价格以工作人员现场确认为准",
  },
  {
    id: "linen",
    name: "布草配送",
    price: "¥15/包 起",
    emoji: "🧺",
    image: imgLinen,
    tag: "定点网格",
    tagColor: "bg-[#06B6D4]",
    unit: "包",
    type: "grid",
    description: "定点网格服务・系统自动绑定一编",
    priceNote: "请提前一天预约，系统会自动派单至区域网格\n最终价格以工作人员现场确认为准",
  },
  {
    id: "water",
    name: "送水服务",
    price: "¥10/桶 起",
    emoji: "💧",
    image: imgWater,
    tag: "定点网格",
    tagColor: "bg-[#2563EB]",
    unit: "桶",
    type: "grid",
    description: "定点网格服务・系统自动绑定一编",
    priceNote: "18L 桶装水 ¥10/桶，2 公里内免配送费，超 2 公里按 ¥2/公里加收配送费\n最终价格以工作人员现场确认为准",
  },
  {
    id: "luggage",
    name: "行李搬运",
    price: "¥10/件 起",
    emoji: "🧳",
    image: imgLuggage,
    tag: "点对点",
    tagColor: "bg-[#60A5FA]",
    unit: "件",
    type: "point",
    description: "为游览提供服务・起终点均在古镇范围",
    priceNote: "起步价 ¥30/趟，2 公里内不加价，超 2 公里按 ¥5/公里加收\n最终价格以工作人员现场确认为准",
  },
  {
    id: "delivery",
    name: "送货服务",
    price: "¥30/趟 起",
    emoji: "📦",
    image: imgDelivery,
    tag: "点对点",
    tagColor: "bg-[#1D4ED8]",
    unit: "趟",
    type: "point",
    description: "为游览提供服务・起终点均在古镇范围",
    priceNote: "起步价 ¥30/趟，2 公里内不加价，超 2 公里按 ¥5/公里加收\n最终价格以工作人员现场确认为准",
  },
]

type State = {
  services: ConvenienceService[]
  addService: (svc: Omit<ConvenienceService, "id">) => void
  updateService: (id: string, updates: Partial<ConvenienceService>) => void
  deleteService: (id: string) => void
  getService: (id: string) => ConvenienceService | undefined
}

export const useServiceConfigStore = create<State>((set, get) => ({
  services: DEFAULT,
  addService: (svc) => set((s) => ({ services: [...s.services, { ...svc, id: `svc_${Date.now()}` }] })),
  updateService: (id, updates) =>
    set((s) => ({ services: s.services.map((svc) => (svc.id === id ? { ...svc, ...updates } : svc)) })),
  deleteService: (id) => set((s) => ({ services: s.services.filter((svc) => svc.id !== id) })),
  getService: (id) => get().services.find((svc) => svc.id === id),
}))
