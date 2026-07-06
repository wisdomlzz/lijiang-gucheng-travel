export function ok(data, msg = "ok") {
  return { ok: true, data, msg }
}

export function fail(msg, code = 400) {
  return { ok: false, msg, code }
}

export function paginate(items, page = 1, pageSize = 20) {
  const total = items.length
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}