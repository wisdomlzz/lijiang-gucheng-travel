// API 客户端 — 所有前端请求统一出口
const BASE_URL = "http://localhost:3001/api/v1"

async function request(method, path, body = undefined) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg || "API error")
  return json.data
}

export const api = {
  // Auth
  login: (phone) => request("POST", "/auth/login", { phone }),
  getMe: () => request("GET", "/auth/me"),

  // Generic CRUD (used by resource APIs below)
  list: (resource, params = {}) => {
    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&")
    return request("GET", `/${resource}${qs ? "?" + qs : ""}`)
  },
  get: (resource, id) => request("GET", `/${resource}/${id}`),
  create: (resource, data) => request("POST", `/${resource}`, data),
  update: (resource, id, data) => request("PATCH", `/${resource}/${id}`, data),
  remove: (resource, id) => request("DELETE", `/${resource}/${id}`),
  post: (resource, path, data) => request("POST", `/${resource}${path}`, data),
}

// 推导式资源 API（供 store 直接调用）
export const ordersApi = {
  list: (params) => api.list("orders", params),
  get: (id) => api.get("orders", id),
  create: (data) => api.create("orders", data),
  update: (id, data) => api.update("orders", id, data),
  remove: (id) => api.remove("orders", id),
  transition: (id, action) => api.post("orders", `/${id}/transition`, { action }),
  dispatch: (id, mode, staffId) => api.post("orders", `/${id}/dispatch`, { mode, staffId }),
}

export const staffApi = { list: (p) => api.list("staff", p), create: (d) => api.create("staff", d), update: (id, d) => api.update("staff", id, d), remove: (id) => api.remove("staff", id) }
export const reviewsApi = { list: (p) => api.list("reviews", p), stats: () => api.get("reviews", "stats"), create: (d) => api.create("reviews", d), update: (id, d) => api.update("reviews", id, d) }
export const complaintsApi = { list: (p) => api.list("complaints", p), create: (d) => api.create("complaints", d), update: (id, d) => api.update("complaints", id, d), resolve: (id, result) => api.post("complaints", `/${id}/resolve`, { result }), reject: (id, reason) => api.post("complaints", `/${id}/reject`, { reason }) }
export const pointsApi = { account: (uid) => api.get("points/account", uid), transact: (d) => api.post("points", "/transact", d), rules: { list: (p) => api.list("points/rules", p), create: (d) => api.create("points/rules", d), update: (id, d) => api.update("points/rules", id, d), remove: (id) => api.remove("points/rules", id) } }
export const trustApi = { scores: { list: (p) => api.list("trust-scores", p) }, rules: { list: (p) => api.list("trust-scores/rules", p), create: (d) => api.create("trust-scores/rules", d), update: (id, d) => api.update("trust-scores/rules", id, d), remove: (id) => api.remove("trust-scores/rules", id) }, threshold: { get: () => api.get("trust-scores", "threshold"), update: (d) => api.post("trust-scores", "/threshold", d) } }
export const contentApi = {
  news: { list: (p) => api.list("content/news", p), create: (d) => api.create("content/news", d), update: (id, d) => api.update("content/news", id, d), remove: (id) => api.remove("content/news", id) },
  routes: { list: (p) => api.list("content/routes", p), create: (d) => api.create("content/routes", d), update: (id, d) => api.update("content/routes", id, d), remove: (id) => api.remove("content/routes", id) },
  courtyards: { list: (p) => api.list("content/courtyards", p), create: (d) => api.create("content/courtyards", d), update: (id, d) => api.update("content/courtyards", id, d), remove: (id) => api.remove("content/courtyards", id) },
  merchants: { list: (p) => api.list("content/merchants", p), create: (d) => api.create("content/merchants", d), update: (id, d) => api.update("content/merchants", id, d), remove: (id) => api.remove("content/merchants", id) },
  pois: { list: (p) => api.list("content/pois", p), create: (d) => api.create("content/pois", d), update: (id, d) => api.update("content/pois", id, d), remove: (id) => api.remove("content/pois", id) },
  housing: { list: (p) => api.list("content/housing", p), create: (d) => api.create("content/housing", d), update: (id, d) => api.update("content/housing", id, d), remove: (id) => api.remove("content/housing", id) },
}
export const bannersApi = { list: (p) => api.list("banners", p), create: (d) => api.create("banners", d), update: (id, d) => api.update("banners", id, d), remove: (id) => api.remove("banners", id), reorder: (ids) => api.post("banners", "/reorder", { ids }) }
export const gridApi = { list: (p) => api.list("grid-items", p), update: (id, d) => api.update("grid-items", id, d) }
export const volunteerApi = { list: (p) => api.list("volunteers", p), activities: { list: (p) => api.list("volunteer-activities", p), create: (d) => api.create("volunteer-activities", d) } }
export const aiKnowledgeApi = { list: (p) => api.list("ai-knowledge", p), create: (d) => api.create("ai-knowledge", d), update: (id, d) => api.update("ai-knowledge", id, d), remove: (id) => api.remove("ai-knowledge", id) }
export const bookingsApi = { list: (p) => api.list("bookings", p), create: (d) => api.create("bookings", d) }
export const addressesApi = { list: (p) => api.list("addresses", p), create: (d) => api.create("addresses", d), update: (id, d) => api.update("addresses", id, d), remove: (id) => api.remove("addresses", id) }
export const favoritesApi = { list: (p) => api.list("favorites", p), create: (d) => api.create("favorites", d), remove: (id) => api.remove("favorites", id) }
export const supplierApi = { list: (p) => api.list("supplier-applications", p), create: (d) => api.create("supplier-applications", d) }
export const merchantRegApi = { list: (p) => api.list("merchant-registrations", p), create: (d) => api.create("merchant-registrations", d) }