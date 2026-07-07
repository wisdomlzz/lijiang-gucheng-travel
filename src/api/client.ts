// API 客户端 — 所有前端请求统一出口
import { useAuthStore } from "@/platform/auth"
import type { ApiResponse, Paginated, ListParams } from "./types"

const BASE_URL = "http://localhost:3001/api/v1"

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = useAuthStore.getState().token
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const json: ApiResponse<T> = await res.json()

  if (json.code === 401) {
    useAuthStore.getState().logout()
    if (typeof window !== "undefined") window.location.href = "/"
    throw new Error("登录已过期")
  }
  if (!json.ok) throw new Error(json.msg || "API error")
  return json.data
}

export const api = {
  // Auth
  login: (phone: string): Promise<{ token: string; user: any }> =>
    request("POST", "/auth/login", { phone }),
  getMe: (): Promise<any> => request("GET", "/auth/me"),

  // Generic CRUD
  list: <T = any>(resource: string, params: ListParams = {}): Promise<Paginated<T>> => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&")
    return request("GET", `/${resource}${qs ? "?" + qs : ""}`)
  },
  get: <T = any>(resource: string, id: string | number): Promise<T> =>
    request("GET", `/${resource}/${id}`),
  create: <T = any>(resource: string, data: unknown): Promise<T> =>
    request("POST", `/${resource}`, data),
  update: <T = any>(resource: string, id: string | number, data: unknown): Promise<T> =>
    request("PATCH", `/${resource}/${id}`, data),
  remove: (resource: string, id: string | number): Promise<null> =>
    request("DELETE", `/${resource}/${id}`),
  post: <T = any>(resource: string, path: string, data?: unknown): Promise<T> =>
    request("POST", `/${resource}${path}`, data),
}

function crudApi<T = any, O extends Record<string, (...args: any[]) => Promise<T>> = {}>(
  resource: string,
  overrides?: O
): {
  list: (params?: ListParams) => Promise<Paginated<T[]>>
  get: (id: string | number) => Promise<T>
  create: (data: unknown) => Promise<T>
  update: (id: string | number, data: unknown) => Promise<T>
  remove: (id: string | number) => Promise<null>
} & O {
  return {
    list: (params?: ListParams) => api.list<T[]>(resource, params),
    get: (id: string | number) => api.get<T>(resource, id),
    create: (data: unknown) => api.create<T>(resource, data),
    update: (id: string | number, data: unknown) => api.update<T>(resource, id, data),
    remove: (id: string | number) => api.remove(resource, id),
    ...overrides,
  } as any
}

// 文件上传 helper
export async function uploadFile(file: File): Promise<string> {
  const token = useAuthStore.getState().token
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data.url
}

// ===== 推导式资源 API(供 store 直接调用)=====
export const ordersApi = {
  list: (params?: ListParams) => api.list("orders", params),
  get: (id: string) => api.get("orders", id),
  create: (data: any) => api.create("orders", data),
  update: (id: string, data: any) => api.update("orders", id, data),
  remove: (id: string) => api.remove("orders", id),
  transition: (id: string, action: string, fields?: Record<string, unknown>) =>
    api.post("orders", `/${id}/transition`, { action, ...fields }),
  dispatch: (id: string, mode: "auto" | "manual", staffId?: string) =>
    api.post("orders", `/${id}/dispatch`, { mode, staffId }),
  // MVP 新增
  arriveCheckin: (id: string, staffId?: string) =>
    api.post("orders", `/${id}/arrive-checkin`, { staffId }),
  lockPayment: (id: string, paymentMethod: "online" | "cash", userId?: string) =>
    api.post("orders", `/${id}/lock-payment`, { paymentMethod, userId }),
  payOnline: (id: string, userId?: string) =>
    api.post("orders", `/${id}/pay-online`, { userId }),
  confirmCash: (id: string, staffId?: string) =>
    api.post("orders", `/${id}/confirm-cash`, { staffId }),
  rate: (id: string, data: { rating: number; content?: string; images?: string[]; userId?: string; userName?: string }) =>
    api.post("orders", `/${id}/rate`, data),
  rejectQuote: (id: string, reason: string, userId?: string) =>
    api.post("orders", `/${id}/reject-quote`, { reason, userId }),
  restoreQuote: (id: string, adminId?: string) =>
    api.post("orders", `/${id}/restore-quote`, { adminId }),
}

export const staffApi = crudApi("staff")

export const reviewsApi = crudApi("reviews", { stats: () => api.get("reviews", "stats") })

export const complaintsApi = {
  list: (p?: ListParams) => api.list("complaints", p),
  create: (d: any) => api.create("complaints", d),
  update: (id: string, d: any) => api.update("complaints", id, d),
  resolve: (id: string, result: string) => api.post("complaints", `/${id}/resolve`, { result }),
  reject: (id: string, reason: string) => api.post("complaints", `/${id}/reject`, { reason }),
}

export const pointsApi = {
  account: (uid: string) => api.get("points/account", uid),
  transact: (d: any) => api.post("points", "/transact", d),
  rules: {
    list: (p?: ListParams) => api.list("points/rules", p),
    create: (d: any) => api.create("points/rules", d),
    update: (id: string, d: any) => api.update("points/rules", id, d),
    remove: (id: string) => api.remove("points/rules", id),
  },
}

export const trustApi = {
  scores: { list: (p?: ListParams) => api.list("trust-scores", p) },
  rules: {
    list: (p?: ListParams) => api.list("trust-scores/rules", p),
    create: (d: any) => api.create("trust-scores/rules", d),
    update: (id: string, d: any) => api.update("trust-scores/rules", id, d),
    remove: (id: string) => api.remove("trust-scores/rules", id),
  },
  threshold: {
    get: () => api.get("trust-scores", "threshold"),
    update: (d: any) => api.post("trust-scores", "/threshold", d),
  },
}

export const contentApi = {
  news: crudApi("content/news"),
  routes: crudApi("content/routes"),
  courtyards: crudApi("content/courtyards"),
  merchants: crudApi("content/merchants"),
  pois: crudApi("content/pois"),
  housing: crudApi("content/housing"),
}

export const bannersApi = crudApi("banners", { reorder: (ids: string[]) => api.post("banners", "/reorder", { ids }) })

export const gridApi = crudApi("grid-items")

export const volunteerApi = {
  list: (p?: ListParams) => api.list("volunteers", p),
  activities: {
    list: (p?: ListParams) => api.list("volunteer-activities", p),
    create: (d: any) => api.create("volunteer-activities", d),
  },
}

export const aiKnowledgeApi = crudApi("ai-knowledge")

export const bookingsApi = crudApi("bookings", { check: (code: string) => api.post("bookings", "/check", { code }) })

export const addressesApi = crudApi("addresses")

export const favoritesApi = crudApi("favorites")

export const supplierApi = crudApi("supplier-applications")

export const merchantRegApi = crudApi("merchant-registrations")