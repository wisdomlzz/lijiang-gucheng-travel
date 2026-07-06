import { Router } from "express"
import { upload } from "../middleware/upload.js"
import { ok, fail } from "../middleware/response.js"

const router = Router()

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.json(fail("未收到文件"))
  res.json(ok({ url: `/uploads/${req.file.filename}` }))
})

export default router
