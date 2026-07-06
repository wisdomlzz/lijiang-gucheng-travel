import multer from "multer"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { existsSync, mkdirSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, "../uploads")
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("仅支持图片"))
    cb(null, true)
  },
})
