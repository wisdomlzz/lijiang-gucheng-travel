import { useParams, useNavigate } from "react-router"
import { HeritageDetailLayout, FieldRow } from "./HeritageDetailLayout"
import { watersData } from "@/features/heritage/shared/data/waters"

export function WaterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const item = watersData.find((h) => h.id === id) || watersData[0]
  if (!item) {
    return (
      <div className="min-h-full bg-surface-page flex flex-col items-center justify-center">
        <p className="text-text-tertiary text-[14px]">遗产记录不存在</p>
        <button
          onClick={() => navigate("/c/heritage")}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-[13px]"
        >
          返回列表
        </button>
      </div>
    )
  }
  return (
    <HeritageDetailLayout item={item}>
      {item.extra?.flowDirection && <FieldRow label="流向" value={item.extra.flowDirection as string} />}
    </HeritageDetailLayout>
  )
}
