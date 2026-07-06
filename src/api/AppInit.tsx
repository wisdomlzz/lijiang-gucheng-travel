import { useApiHydrate } from "@/api/hydrate"

// In the root component, add:
export function AppInit() {
  useApiHydrate()
  return null
}