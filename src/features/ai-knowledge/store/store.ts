import { create } from "zustand"

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  status: "enabled" | "disabled"
  createdAt: string
  updatedAt: string
}

const SEED: KnowledgeItem[] = [
  {
    id: "k1",
    question: "丽江古城开放时间是什么？",
    answer: "丽江古城为开放式景区，全天24小时开放。但部分收费景点（如木府、万古楼）有独立开放时间，一般为8:00-18:00。",
    status: "enabled",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
  },
  {
    id: "k2",
    question: "古城维护费多少钱？怎么缴纳？",
    answer: "古城维护费为80元/人次，72小时有效。可通过古城各入口的维护费征收点缴纳，也可在入住酒店时由酒店代收。",
    status: "enabled",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
  },
  {
    id: "k3",
    question: "有哪些推荐的游览路线？",
    answer:
      "推荐路线：\n1. 古城漫步·非遗之旅（6个景点，约4小时）\n2. 纳西文化·深度探索（5个景点，约3小时）\n3. 寻味古城·美食地图（8个打卡点，约半天）\n您可以根据时间灵活选择。",
    status: "enabled",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-02",
  },
  {
    id: "k4",
    question: "古城有哪些特色美食推荐？",
    answer:
      "丽江古城美食推荐：\n- 纳西人家餐厅：地道纳西菜\n- 阿妈意餐厅：纳西风味\n- 老四方街：传统小吃\n特色菜品包括腊排骨火锅、鸡豆凉粉、丽江粑粑等。",
    status: "enabled",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
  },
  {
    id: "k5",
    question: "怎么去丽江古城？交通方式？",
    answer:
      "到达丽江古城的方式：\n1. 飞机：丽江三义机场，乘机场大巴或打车至古城\n2. 火车：丽江站，乘4路/18路公交至古城入口\n3. 自驾：导航至「丽江古城」，周边有多个停车场\n古城内禁止机动车通行，建议步行游览。",
    status: "enabled",
    createdAt: "2026-05-02",
    updatedAt: "2026-05-02",
  },
  {
    id: "k6",
    question: "古城有哪些文化活动？",
    answer:
      "近期活动：\n- 三多节纳西族传统节庆（四方街民俗表演）\n- 东巴文化体验营（万古楼，需预约）\n- 纳西古乐演出（每晚固定场次）\n- 四方街篝火晚会（每晚20:00）",
    status: "enabled",
    createdAt: "2026-05-02",
    updatedAt: "2026-05-02",
  },
  {
    id: "k7",
    question: "遇到问题怎么投诉？",
    answer:
      "投诉方式：\n1. 在线投诉：通过小程序「一键投诉」提交\n2. 电话投诉：0888-5123437（工作时间）\n3. 现场投诉：古城游客服务中心\n投诉提交后可在小程序查看处理进度。",
    status: "enabled",
    createdAt: "2026-05-02",
    updatedAt: "2026-05-03",
  },
  {
    id: "k8",
    question: "古城有哪些文化院落可以参观？",
    answer:
      "主要文化院落：\n- 木府：古城标志性建筑，门票60元\n- 方国瑜故居：免费开放\n- 王家庄教堂：历史建筑\n- 雪山书院：文化展览\n各院落开放时间不一，建议提前查看详情。",
    status: "enabled",
    createdAt: "2026-05-03",
    updatedAt: "2026-05-03",
  },
]

type AIKnowledgeState = {
  items: KnowledgeItem[]
  addItem: (question: string, answer: string) => string
  updateItem: (id: string, fields: Partial<Pick<KnowledgeItem, "question" | "answer" | "status">>) => void
  removeItem: (id: string) => void
  batchImport: (data: { question: string; answer: string }[]) => { success: number; failed: number }
  search: (keyword: string) => KnowledgeItem[]
}

export const useAIKnowledgeStore = create<AIKnowledgeState>((set, get) => ({
  items: SEED,
  addItem: (question, answer) => {
    const id = `k-new-${Date.now()}`
    set((s) => ({
      items: [
        ...s.items,
        {
          id,
          question,
          answer,
          status: "enabled",
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    }))
    return id
  },
  updateItem: (id, fields) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...fields, updatedAt: new Date().toISOString().slice(0, 10) } : item
      ),
    })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
  batchImport: (data) => {
    let success = 0,
      failed = 0
    const newItems: KnowledgeItem[] = []
    for (const item of data) {
      if (!item.question || !item.answer) {
        failed++
        continue
      }
      newItems.push({
        id: `k-import-${Date.now()}-${success}`,
        question: item.question,
        answer: item.answer,
        status: "enabled",
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      })
      success++
    }
    if (newItems.length) set((s) => ({ items: [...s.items, ...newItems] }))
    return { success, failed }
  },
  search: (keyword) =>
    keyword.trim()
      ? get().items.filter((item) => item.question.includes(keyword) || item.answer.includes(keyword))
      : get().items,
}))
