import { create } from "zustand"
import type { Complaint as ComplaintType, ComplaintStatus } from "../types"

type ComplaintState = {
  complaints: ComplaintType[]
  complaintPhone: string
  createComplaint: (complaint: Omit<ComplaintType, "id" | "createdAt" | "status">) => void
  updateComplaintPhone: (phone: string) => void
  resolveWithResult: (id: string, result: string) => void
  reject: (id: string, reason: string) => void
}

const SEED: ComplaintType[] = [
  { id: "CP001", orderId: "CO20260511001", userId: "u_c_001", type: "服务态度", content: "便民服务人员沟通态度不好，希望平台提醒整改", images: ["https://images.unsplash.com/photo-1562621019-4d2f3980df96?w=400"], status: "C10", createdAt: "2026-05-11T14:30:00", targetName: "便民服务人员", reporterType: "游客", reporterName: "张小游", reporterGender: "女", reporterPhone: "13800001001", objectType: "个人", incidentArea: "大研街道", incidentLocation: "五一街片区", doorplate: "五一街42号", channelNote: "小程序自有投诉渠道" },
  { id: "CP002", orderId: "CO20260511007", userId: "u_c_001", type: "价格争议", content: "现场报价和参考价格差距较大，希望平台复核", images: ["https://images.unsplash.com/photo-1562572159-4efc207a5a1e?w=400"], status: "C40", createdAt: "2026-05-11T10:00:00", targetName: "送水服务", reporterType: "本地居民", reporterName: "和女士", reporterGender: "女", reporterPhone: "13988880002", objectType: "个人", incidentArea: "七一社区", incidentLocation: "七一街片区", doorplate: "七一街88号", channelNote: "小程序自有投诉渠道", result: "已与商家核实，现场报价为服务过程中的即时报价，已向用户解释说明。", handledAt: "2026-05-11 14:00" },
  { id: "CP003", orderId: "CO20260507002", userId: "u_c_001", type: "服务结果", content: "生活垃圾清运后现场仍有残留，需要重新处理", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], status: "C40", createdAt: "2026-05-08T16:20:00", targetName: "生活垃圾清运", reporterType: "工作人员", reporterName: "片区巡查员", reporterGender: "男", reporterPhone: "18800003001", objectType: "公共环境", incidentArea: "新华社区", incidentLocation: "新华街片区", doorplate: "新华街16号", channelNote: "小程序自有投诉渠道", result: "已通知服务人员复查并完成二次清运。", handledAt: "2026-05-09 10:30" },
  { id: "CP004", orderId: "CO20260509000", userId: "u_c_001", type: "服务时效", content: "行李搬运服务迟到半小时，影响入住安排", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], status: "CR", createdAt: "2026-05-11T09:00:00", targetName: "行李搬运", reporterType: "游客", reporterName: "游客张小游", reporterGender: "女", reporterPhone: "13800001001", objectType: "个人", incidentArea: "四方街社区", incidentLocation: "四方街", doorplate: "四方街12号", channelNote: "小程序自有投诉渠道", result: "经核实，服务人员因交通拥堵导致迟到，已向用户致歉并说明。", handledAt: "2026-05-11 11:00" },
]

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: SEED,
  complaintPhone: "0888-123456",
  createComplaint: (c) => set((s) => ({ complaints: [{ ...c, id: `CP${Date.now()}`, status: "C10" as ComplaintStatus, createdAt: new Date().toISOString() }, ...s.complaints] })),
  updateComplaintPhone: (phone) => set({ complaintPhone: phone }),
  resolveWithResult: (id, result) => set((s) => ({ complaints: s.complaints.map((c) => c.id === id ? { ...c, status: "C40" as ComplaintStatus, result, handledAt: new Date().toLocaleString("zh-CN") } : c) })),
  reject: (id, reason) => set((s) => ({ complaints: s.complaints.map((c) => c.id === id ? { ...c, status: "CR" as ComplaintStatus, result: reason, handledAt: new Date().toLocaleString("zh-CN") } : c) })),
}))

export type { ComplaintType as Complaint } from "../types"
