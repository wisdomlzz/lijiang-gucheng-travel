import { create } from "zustand"
import type { Checkin } from "../types"

interface CheckinState {
  checkins: Checkin[];
  addCheckin: (checkin: Omit<Checkin, "id" | "createdAt" | "status">) => void;
  updateStatus: (id: string, status: Checkin["status"]) => void;
  getMyCheckins: (userId: string) => Checkin[];
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  checkins: [
    {
      id: "chk-1",
      courtyardId: "1",
      courtyardName: "木府",
      userId: "user-1",
      userName: "张三",
      photo: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8685, lng: 100.2312 },
      address: "古城光义街官门口",
      createdAt: "2026-05-18 10:30",
      status: "approved",
    },
    {
      id: "chk-2",
      courtyardId: "2",
      courtyardName: "方国瑜故居",
      userId: "user-2",
      userName: "李四",
      photo: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8692, lng: 100.2356 },
      address: "五一街文治巷42号",
      createdAt: "2026-05-19 14:20",
      status: "approved",
    },
    {
      id: "chk-3",
      courtyardId: "3",
      courtyardName: "万古楼",
      userId: "user-3",
      userName: "王五",
      photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8701, lng: 100.2298 },
      address: "狮子山万古楼景区",
      createdAt: "2026-05-20 09:15",
      status: "approved",
    },
    {
      id: "chk-4",
      courtyardId: "4",
      courtyardName: "大水车",
      userId: "user-4",
      userName: "赵六",
      photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8678, lng: 100.2330 },
      address: "古城北门大水车广场",
      createdAt: "2026-05-21 11:45",
      status: "approved",
    },
    {
      id: "chk-5",
      courtyardId: "5",
      courtyardName: "四方街",
      userId: "user-5",
      userName: "孙七",
      photo: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8680, lng: 100.2345 },
      address: "古城中心四方街",
      createdAt: "2026-05-22 16:30",
      status: "approved",
    },
    {
      id: "chk-6",
      courtyardId: "1",
      courtyardName: "木府",
      userId: "user-6",
      userName: "周八",
      photo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8685, lng: 100.2312 },
      address: "古城光义街官门口",
      createdAt: "2026-05-23 08:20",
      status: "approved",
    },
    {
      id: "chk-7",
      courtyardId: "2",
      courtyardName: "方国瑜故居",
      userId: "user-7",
      userName: "吴九",
      photo: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8692, lng: 100.2356 },
      address: "五一街文治巷42号",
      createdAt: "2026-05-24 13:10",
      status: "approved",
    },
    {
      id: "chk-8",
      courtyardId: "3",
      courtyardName: "万古楼",
      userId: "user-8",
      userName: "郑十",
      photo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8701, lng: 100.2298 },
      address: "狮子山万古楼景区",
      createdAt: "2026-05-25 10:05",
      status: "approved",
    },
    {
      id: "chk-9",
      courtyardId: "4",
      courtyardName: "大水车",
      userId: "user-9",
      userName: "钱一",
      photo: "https://images.unsplash.com/photo-1520810627419-35f592d9bfe3?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8678, lng: 100.2330 },
      address: "古城北门大水车广场",
      createdAt: "2026-05-26 15:55",
      status: "approved",
    },
    {
      id: "chk-10",
      courtyardId: "5",
      courtyardName: "四方街",
      userId: "user-10",
      userName: "沈二",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8680, lng: 100.2345 },
      address: "古城中心四方街",
      createdAt: "2026-05-26 17:30",
      status: "approved",
    },
    {
      id: "chk-11",
      courtyardId: "1",
      courtyardName: "木府",
      userId: "user-11",
      userName: "陈三",
      photo: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=400&q=70",
      location: { lat: 26.8685, lng: 100.2312 },
      address: "古城光义街官门口",
      createdAt: "2026-05-27 09:00",
      status: "approved",
    },
  ],

  addCheckin: (checkin) =>
    set((state) => ({
      checkins: [
        {
          ...checkin,
          id: `chk-${Date.now()}`,
          createdAt: new Date().toLocaleString("zh-CN"),
          status: "approved",
        },
        ...state.checkins,
      ],
    })),

  updateStatus: (id, status) =>
    set((state) => ({
      checkins: state.checkins.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    })),

  getMyCheckins: (userId) =>
    get().checkins.filter((c) => c.userId === userId),
}));
