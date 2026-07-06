import { Router } from "express"
import { crudRoutes } from "./crud.js"

const router = Router()
router.use("/", crudRoutes("flow_warnings"))
export default router