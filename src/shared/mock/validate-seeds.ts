import { seedConvenienceOrders } from "./seed"
import { validateSeedCoverage } from "./seed-factory"

const result = validateSeedCoverage(seedConvenienceOrders)

if (result.convMissing.length > 0) {
  throw new Error(`便民订单缺失状态: ${result.convMissing.join(", ")}`)
}
