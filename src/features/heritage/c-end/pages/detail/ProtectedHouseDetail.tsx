import { useParams, useNavigate } from "react-router"
import { HeritageDetailLayout, FieldRow } from "./HeritageDetailLayout"
import { protectedHousesData } from "@/features/heritage/shared/data/protectedHouses"

export function ProtectedHouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const item = protectedHousesData.find((h) => h.id === id) || protectedHousesData[0]
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
      {item.extra?.buildingPattern && <FieldRow label="建筑格局" value={item.extra.buildingPattern as string} />}
      {item.extra?.heritageElements && <FieldRow label="遗产要素" value={item.extra.heritageElements as string} />}
      {item.extra?.propertyOwner && <FieldRow label="产权" value={item.extra.propertyOwner as string} />}
      {item.extra?.managementUnit && <FieldRow label="经营管理" value={item.extra.managementUnit as string} />}
      {item.extra?.remark && <FieldRow label="备注" value={item.extra.remark as string} />}
    </HeritageDetailLayout>
  )
}
