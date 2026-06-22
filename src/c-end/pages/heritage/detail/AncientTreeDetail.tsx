import { useParams, useNavigate } from "react-router";
import { HeritageDetailLayout, FieldRow } from "./HeritageDetailLayout";
import { ancientTreesData } from "../../../data/heritage/ancientTrees";

export function AncientTreeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = ancientTreesData.find((h) => h.id === id) || ancientTreesData[0];
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
      {item.extra?.familyName && <FieldRow label="科名" value={item.extra.familyName as string} />}
      {item.extra?.genusName && <FieldRow label="属名" value={item.extra.genusName as string} />}
      {item.extra?.speciesName && <FieldRow label="树种名" value={item.extra.speciesName as string} />}
      {item.extra?.latinName && <FieldRow label="拉丁名" value={item.extra.latinName as string} />}
      {item.extra?.protectionLevel && <FieldRow label="保护等级" value={item.extra.protectionLevel as string} />}
      {item.extra?.treeAge && <FieldRow label="树龄" value={item.extra.treeAge as string} />}
      {item.extra?.treeHeight && <FieldRow label="树高" value={item.extra.treeHeight as string} />}
      {item.extra?.chestCircumference && <FieldRow label="胸围" value={item.extra.chestCircumference as string} />}
    </HeritageDetailLayout>
  );
}
