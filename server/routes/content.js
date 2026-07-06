import { Router } from "express"
import { crudRoutes } from "./crud.js"

const router = Router()

router.use("/news", crudRoutes("content_news", { searchField: "title" }))
router.use("/routes", crudRoutes("content_routes", { searchField: "name" }))
router.use("/courtyards", crudRoutes("content_courtyards", { searchField: "name" }))
router.use("/merchants", crudRoutes("content_merchants", { searchField: "name" }))
router.use("/pois", crudRoutes("content_pois", { searchField: "name", filters: ["category"] }))
router.use("/housing", crudRoutes("content_housing", { searchField: "name" }))

export default router