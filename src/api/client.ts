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
}

export const staffApi = {
  list: (p?: ListParams) => api.list("staff", p),
  create: (d: any) => api.create("staff", d),
  update: (id: string, d: any) => api.update("staff", id, d),
  remove: (id: string) => api.remove("staff", id),
}

export const reviewsApi = {
  list: (p?: ListParams) => api.list("reviews", p),
  stats: () => api.get("reviews", "stats"),
  create: (d: any) => api.create("reviews", d),
  update: (id: string, d: any) => api.update("reviews", id, d),
}

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
  news: {
    list: (p?: ListParams) => api.list("content/news", p),
    create: (d: any) => api.create("content/news", d),
    update: (id: string, d: any) => api.update("content/news", id, d),
    remove: (id: string) => api.remove("content/news", id),
  },
  routes: {
    list: (p?: ListParams) => api.list("content/routes", p),
    create: (d: any) => api.create("content/routes", d),
    update: (id: string, d: any) => api.update("content/routes", id, d),
    remove: (id: string) => api.remove("content/routes", id),
  },
  courtyards: {
    list: (p?: ListParams) => api.list("content/courtyards", p),
    create: (d: any) => api.create("content/courtyards", d),
    update: (id: string, d: any) => api.update("content/courtyards", id, d),
    remove: (id: string) => api.remove("content/courtyards", id),
  },
  merchants: {
    list: (p?: ListParams) => api.list("content/merchants", p),
    create: (d: any) => api.create("content/merchants", d),
    update: (id: string, d: any) => api.update("content/merchants", id, d),
    remove: (id: string) => api.remove("content/merchants", id),
  },
  pois: {
    list: (p?: ListParams) => api.list("content/pois", p),
    create: (d: any) => api.create("content/pois", d),
    update: (id: string, d: any) => api.update("content/pois", id, d),
    remove: (id: string) => api.remove("content/pois", id),
  },
  housing: {
    list: (p?: ListParams) => api.list("content/housing", p),
    create: (d: any) => api.create("content/housing", d),
    update: (id: string | number, d: any) => api.update("content/housing", id, d),
    remove: (id: string | number) => api.remove("content/housing", id),
  },
}

export const bannersApi = {
  list: (p?: ListParams) => api.list("banners", p),
  create: (d: any) => api.create("banners", d),
  update: (id: string, d: any) => api.update("banners", id, d),
  remove: (id: string) => api.remove("banners", id),
  reorder: (ids: string[]) => api.post("banners", "/reorder", { ids }),
}

export const gridApi = {
  list: (p?: ListParams) => api.list("grid-items", p),
  update: (id: string, d: any) => api.update("grid-items", id, d),
}

export const volunteerApi = {
  list: (p?: ListParams) => api.list("volunteers", p),
  activities: {
    list: (p?: ListParams) => api.list("volunteer-activities", p),
    create: (d: any) => api.create("volunteer-activities", d),
  },
}

export const aiKnowledgeApi = {
  list: (p?: ListParams) => api.list("ai-knowledge", p),
  create: (d: any) => api.create("ai-knowledge", d),
  update: (id: string, d: any) => api.update("ai-knowledge", id, d),
  remove: (id: string) => api.remove("ai-knowledge", id),
}

export const bookingsApi = {
  list: (p?: ListParams) => api.list("bookings", p),
  create: (d: any) => api.create("bookings", d),
  update: (id: string, d: any) => api.update("bookings", id, d),
  check: (code: string) => api.post("bookings", "/check", { code }),
}

export const addressesApi = {
  list: (p?: ListParams) => api.list("addresses", p),
  create: (d: any) => api.create("addresses", d),
  update: (id: string, d: any) => api.update("addresses", id, d),
  remove: (id: string) => api.remove("addresses", id),
}

export const favoritesApi = {
  list: (p?: ListParams) => api.list("favorites", p),
  create: (d: any) => api.create("favorites", d),
  remove: (id: string) => api.remove("favorites", id),
}

export const supplierApi = {
  list: (p?: ListParams) => api.list("supplier-applications", p),
  create: (d: any) => api.create("supplier-applications", d),
}

export const merchantRegApi = {
  list: (p?: ListParams) => api.list("merchant-registrations", p),
  create: (d: any) => api.create("merchant-registrations", d),
}