import Database from "better-sqlite3"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, "data.db"))

// 开启外键约束
db.pragma("foreign_keys = ON")
// 不开 WAL,用默认 journal mode(单文件部署最干净)

export default db