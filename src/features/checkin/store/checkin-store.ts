import { create } from "zustand"
import type { Checkin } from "../../../shared/types"
import { usePointsStore } from "../../points/store"

// 25 个文化院落按权重生成约 90 条打卡记录
const COURTYARDS = [
  { id: "1", name: "木府", lat: 26.8685, lng: 100.2312, address: "古城光义街官门口", w: 12 },
  { id: "2", name: "方国瑜故居", lat: 26.8692, lng: 100.2356, address: "五一街文治巷42号", w: 9 },
  { id: "3", name: "万古楼", lat: 26.8701, lng: 100.2298, address: "狮子山万古楼景区", w: 6 },
  { id: "4", name: "纳西古乐会", lat: 26.8668, lng: 100.2298, address: "古城新义街纳西古乐会", w: 7 },
  { id: "5", name: "四方街", lat: 26.868, lng: 100.2345, address: "古城中心四方街", w: 11 },
  { id: "6", name: "文昌宫", lat: 26.8712, lng: 100.2285, address: "狮子山文昌宫", w: 11 },
  { id: "7", name: "恒裕公", lat: 26.8698, lng: 100.2338, address: "五一街文华巷", w: 8 },
  { id: "8", name: "王丕震纪念馆", lat: 26.8675, lng: 100.2342, address: "新华街翠文巷", w: 4 },
  { id: "9", name: "周霖故居", lat: 26.869, lng: 100.2365, address: "七一街兴文巷", w: 3 },
  { id: "10", name: "顾彼得旧居", lat: 26.8682, lng: 100.2328, address: "光义街金星巷", w: 3 },
  { id: "11", name: "洛克故居", lat: 26.8678, lng: 100.235, address: "五一街文生巷", w: 2 },
  { id: "12", name: "净莲寺", lat: 26.8705, lng: 100.2305, address: "狮子山净莲寺", w: 4 },
  { id: "13", name: "普贤寺", lat: 26.8672, lng: 100.2335, address: "七一街崇仁巷", w: 2 },
  { id: "14", name: "白马龙潭寺", lat: 26.866, lng: 100.226, address: "光义街白马龙潭寺", w: 6 },
  { id: "15", name: "三眼井", lat: 26.8695, lng: 100.2348, address: "五一街三眼井", w: 4 },
  { id: "16", name: "百岁坊", lat: 26.8688, lng: 100.2332, address: "新义街百岁坊", w: 3 },
  { id: "17", name: "天地院", lat: 26.8683, lng: 100.2325, address: "新华街翠文段", w: 4 },
  { id: "18", name: "银饰坊", lat: 26.8693, lng: 100.234, address: "七一街银饰坊", w: 3 },
  { id: "19", name: "东巴纸坊", lat: 26.867, lng: 100.2338, address: "七一街八一巷", w: 6 },
  { id: "20", name: "和志刚书斋", lat: 26.8696, lng: 100.2358, address: "五一街振兴巷", w: 2 },
  { id: "21", name: "古城画院", lat: 26.8686, lng: 100.232, address: "光义街现文巷", w: 8 },
  { id: "22", name: "忠义坊", lat: 26.8676, lng: 100.231, address: "木府前忠义坊", w: 7 },
  { id: "23", name: "官门口", lat: 26.8684, lng: 100.233, address: "四方街官门口", w: 3 },
  { id: "24", name: "大水车", lat: 26.872, lng: 100.232, address: "古城北门大水车广场", w: 7 },
  { id: "25", name: "纳西人家", lat: 26.8697, lng: 100.236, address: "五一街文明巷", w: 3 },
]
const USERS = [
  "张三",
  "李四",
  "王五",
  "赵六",
  "孙七",
  "周八",
  "吴九",
  "郑十",
  "钱一",
  "沈二",
  "陈三",
  "朱四",
  "黄五",
  "林六",
  "何七",
  "马八",
  "高九",
  "罗十",
  "梁一",
  "宋二",
  "唐三",
  "韩四",
  "杨五",
  "许六",
  "曹七",
]
const PHOTOS = [
  "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1520810627419-35f592d9bfe3?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=70",
]
function genSeeds(): Checkin[] {
  const r: Checkin[] = []
  let idx = 0
  COURTYARDS.forEach((c) => {
    for (let i = 0; i < c.w; i++) {
      idx++
      const month = idx <= 55 ? 5 : 6
      const day = month === 5 ? 15 + (idx % 17) : 1 + ((idx - 56) % 28)
      const hour = 8 + ((idx * 3) % 12)
      const min = (idx * 17) % 60
      r.push({
        id: `chk-${idx}`,
        courtyardId: c.id,
        courtyardName: c.name,
        userId: `user-${((idx * 3) % 30) + 1}`,
        userName: USERS[(idx * 7 + 3) % USERS.length],
        photo: PHOTOS[(idx * 5 + 1) % PHOTOS.length],
        location: { lat: c.lat + (((i * 3 + 1) % 7) - 3) * 0.0003, lng: c.lng + (((i * 5 + 2) % 7) - 3) * 0.0003 },
        address: c.address,
        createdAt: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        status: "approved",
      })
    }
  })
  return r
}

type CheckinState = {
  checkins: Checkin[]
  addCheckin: (checkin: Omit<Checkin, "id" | "createdAt" | "status">) => void
  updateStatus: (id: string, status: Checkin["status"]) => void
  getMyCheckins: (userId: string) => Checkin[]
  canCheckin: (userId: string, courtyardId: string) => { allowed: boolean; reason?: string }
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  checkins: genSeeds(),
  addCheckin: (c) => {
    const id = `chk-${Date.now()}`
    set((s) => ({
      checkins: [{ ...c, id, createdAt: new Date().toLocaleString("zh-CN"), status: "approved" }, ...s.checkins],
    }))
    // 跨域联动：打卡成功 → 积分入账（显式调用，非事件总线）
    usePointsStore.getState().transact(c.userId, "courtyard_checkin", id)
  },
  updateStatus: (id, status) => set((s) => ({ checkins: s.checkins.map((c) => (c.id === id ? { ...c, status } : c)) })),
  getMyCheckins: (userId) => get().checkins.filter((c) => c.userId === userId),
  canCheckin: (userId, courtyardId) => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const existing = get().checkins.find(
      (c) =>
        c.userId === userId &&
        c.courtyardId === courtyardId &&
        new Date(c.createdAt.replace(/\//g, "-")).getTime() >= start &&
        new Date(c.createdAt.replace(/\//g, "-")).getTime() < start + 86400000
    )
    return existing ? { allowed: false, reason: "今日已打卡" } : { allowed: true }
  },
}))

// export type { Checkin } from "../../../shared/types"
