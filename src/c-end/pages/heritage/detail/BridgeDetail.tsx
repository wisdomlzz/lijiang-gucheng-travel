import { useParams, useNavigate } from "react-router";
import { HeritageDetailLayout, FieldRow } from "./HeritageDetailLayout";
import { bridgesData } from "../../../data/heritage/bridges";

export function BridgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = bridgesData.find((h) => h.id === id) || bridgesData[0];
  if (!item) {
    return (
      <div className="min-h-full bg-surface-page flex flex-col items-center justify-center">
        <p className="text-text-tertiary text-[14px]">遗产记录不存在</p>
        <button onClick={() => navigate("/c/heritage")} className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-[13px]">返回列表</button>
      </div>
    );
  }
  return (
    <HeritageDetailLayout item={item}>
      {item.extra?.material && <FieldRow label="材质" value={item.extra.material as string} />}
      {item.extra?.loadCapacity && <FieldRow label="荷载" value={item.extra.loadCapacity as string} />}
      {item.extra?.bridgeHeight && <FieldRow label="高度" value={item.extra.bridgeHeight as string} />}
      {item.extra?.pointWidth && <FieldRow label="宽度" value={item.extra.pointWidth as string} />}
    </HeritageDetailLayout>
  );
}
