import { create } from "zustand"
import type { NewsItem } from "../../types/content-types"

const DEFAULT: NewsItem[] = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "丽江古城12处直管公房公开招租公告", tag: "热门活动", tagColor: "#3B82F6", date: "2026-04-21", summary: "丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", title: "丽江古城有限公司直管公房公开招租相关公告", tag: "优惠活动", tagColor: "#10B981", date: "2026-04-21", summary: "本次公告面向古城五一街、新华街片区公房进行公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["本次公告面向古城五一街、新华街片区公房进行公开招租"], subImage: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70" },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70", title: "丽江古城直管公房公开招租相关公告（原魔代医院）", tag: "公告", tagColor: "#64748B", date: "2026-04-20", summary: "原魔代医院地块公房整体拟公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["原魔代医院地块公房整体拟公开招租"], subImage: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70" },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日开幕", category: "其它", body: ["丽江古城春日文化节将于4月25日开幕"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
  { id: "5", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70", title: "新义街三层老宅整院出租 · 年租 18 万", tag: "房屋信息", tagColor: "#F97316", date: "2026-04-19", summary: "本院位于新义街核心地段，适合客栈或文创业态", category: "房屋信息", heroTitle: "古城老宅出租信息", body: ["本院位于新义街核心地段，三进院落，产权清晰，适合客栈或文创业态"], subImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70" },
  { id: "6", imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70", title: "古城文创店招聘店员", tag: "举贤纳仕", tagColor: "#10B981", date: "2026-04-15", summary: "古城文创店招聘店员，要求熟悉旅游接待和本地文创产品", category: "举贤纳仕", heroTitle: "古城文创店招聘", body: ["古城文创店招聘店员，要求熟悉旅游接待和本地文创产品"], subImage: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70" },
  { id: "7", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", title: "关于古城水系清淤维护的通知", tag: "通知", tagColor: "#64748B", date: "2026-04-12", summary: "4月25日-4月28日对四方街至玉河广场段水系进行清淤", category: "其它", heroTitle: "古城水系维护通知", body: ["4月25日-4月28日对四方街至玉河广场段水系进行清淤"], subImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70" },
  { id: "8", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节即将开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日开幕", category: "其它", body: ["丽江古城春日文化节将于4月25日开幕"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
  { id: "9", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "公房出租公告", tag: "公告", tagColor: "#64748B", date: "04-12", summary: "丽江古城公房出租，欢迎咨询", category: "公房公告", body: ["丽江古城公房出租，欢迎咨询"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
  { id: "10", imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70", title: "古城游览安全提醒", tag: "公告", tagColor: "#2563EB", date: "04-10", summary: "游览古城请注意人身财产安全", category: "其它", body: ["游览古城请注意人身财产安全"], subImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70" },
]

type State = { news: NewsItem[]; addNews: (item: NewsItem) => void; updateNews: (id: string, fields: Partial<NewsItem>) => void; deleteNews: (id: string) => void }

export const useContentNewsStore = create<State>((set) => ({
  news: DEFAULT,
  addNews: (item) => set((s) => ({ news: [...s.news, item] })),
  updateNews: (id, fields) => set((s) => ({ news: s.news.map((n) => n.id === id ? { ...n, ...fields } : n) })),
  deleteNews: (id) => set((s) => ({ news: s.news.filter((n) => n.id !== id) })),
}))
