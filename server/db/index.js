// 简易 JSON 文件数据库 — 零依赖，数据存为 human-readable JSON 文件
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "data")

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

// 内存缓存
const tables = {}

function filePath(name) {
  return join(DATA_DIR, `${name}.json`)
}

export function initTable(name, seed = []) {
  const path = filePath(name)
  if (existsSync(path)) {
    tables[name] = JSON.parse(readFileSync(path, "utf-8"))
  } else {
    tables[name] = [...seed]
    saveTable(name)
  }
}

function saveTable(name) {
  writeFileSync(filePath(name), JSON.stringify(tables[name], null, 2), "utf-8")
}

export function all(table, where = {}, order = "-created_at") {
  let items = tables[table] || []
  const keys = Object.keys(where).filter(k => where[k] !== undefined && where[k] !== null && where[k] !== "")
  if (keys.length > 0) {
    items = items.filter(item => {
      return keys.every(k => {
        const val = where[k]
        if (typeof val === "string" && (val.includes("%") || val.includes("_"))) {
          const pattern = val.replace(/%/g, "").toLowerCase()
          const itemVal = String(item[k] || "").toLowerCase()
          return itemVal.includes(pattern)
        }
        return item[k] == val // loose equality for number/string
      })
    })
  }
  const dir = order.startsWith("-") ? -1 : 1
  const col = order.replace(/^-/, "")
  items = [...items].sort((a, b) => {
    const va = a[col] ?? ""
    const vb = b[col] ?? ""
    return va < vb ? -dir : va > vb ? dir : 0
  })
  return items
}

export function get(table, id, idField = "id") {
  const items = tables[table] || []
  return items.find(item => item[idField] == id) || null
}

export function insert(table, data) {
  const items = tables[table] || []
  const now = new Date().toISOString()
  const item = { ...data, createdAt: data.createdAt || now, updatedAt: data.updatedAt || now }
  items.push(item)
  saveTable(table)
  return item
}

export function update(table, id, fields, idField = "id") {
  const items = tables[table] || []
  const now = new Date().toISOString()
  const idx = items.findIndex(item => item[idField] == id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...fields, updatedAt: now }
  saveTable(table)
  return items[idx]
}

export function remove(table, id, idField = "id") {
  const items = tables[table] || []
  const idx = items.findIndex(item => item[idField] == id)
  if (idx === -1) return false
  items.splice(idx, 1)
  saveTable(table)
  return true
}

export function count(table) {
  return (tables[table] || []).length
}

export function getTable(name) {
  return tables[name] || []
}

export function setTable(name, data) {
  tables[name] = data
  saveTable(name)
}