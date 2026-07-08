/**
 * 数据库迁移执行器
 * 启动时自动执行未执行的迁移文件
 *
 * 用法:
 *   import "./migrate.js"   // 在 Express 启动时自动运行
 *
 * 迁移文件放在 server/db/migrations/ 目录，命名: NNN_name.sql
 * migrate.js 自动按 NNN 前缀排序，跳过已执行的迁移
 */
import db from "./connection.js"

import { readdirSync, readFileSync } from "fs"
import { fileURLToPath } from "url"
import { join, dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, "migrations")

export function runMigrations() {
  // 创建迁移记录表
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      appliedAt TEXT DEFAULT (datetime('now'))
    )
  `).run()

  // 获取已执行列表
  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((r) => r.version),
  )

  // 读取迁移文件，按前缀排序
  let files
  try {
    files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort()
  } catch {
    // 目录不存在时跳过
    return
  }

  for (const file of files) {
    const version = file.split("_")[0]
    if (applied.has(version)) continue

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8")
    console.log(`[migrate] Applying ${file}...`)

    // 逐条执行（支持多语句文件）
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    const runInTransaction = db.transaction(() => {
      for (const stmt of statements) {
        db.prepare(stmt).run()
      }
      db.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(version, file)
    })

    runInTransaction()
    console.log(`[migrate] ${file} applied successfully`)
  }
}

// 自执行
runMigrations()

export default runMigrations