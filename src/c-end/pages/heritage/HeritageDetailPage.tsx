import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PageHeader } from "../shop/PageHeader";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { ChevronLeft, ChevronRight, MapPin, FileText } from "lucide-react";
import { HeritageType, heritageTypeMeta, heritageExtraFields } from "../../types/heritage";
import { heritageData } from "../../data/heritage/index";
import { HeritageMap } from "../../components/HeritageMap";

function FieldRow({ label, value }: { label: string; value: string | string[] | boolean | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "是" : "否") : Array.isArray(value) ? value.join("、") : value;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border-light last:border-0">
      <span className="text-[13px] text-text-tertiary shrink-0 w-24">{label}</span>
      <span className="text-[13px] text-text-body text-right flex-1 ml-3">{display}</span>
    </div>
  );
}

export function HeritageDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);

  const heritageType = type as HeritageType;
  const items = heritageData[heritageType] || [];
  const item = items.find((h) => h.id === id) || items[0];

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
    );
  }

  const meta = heritageTypeMeta[heritageType];
  const extraFields = heritageExtraFields[heritageType] || [];
  const prevPhoto = () => setPhotoIndex((i) => (i === 0 ? item.photos.length - 1 : i - 1));
  const nextPhoto = () => setPhotoIndex((i) => (i === item.photos.length - 1 ? 0 : i + 1));

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title={`${meta?.label || "遗产"}详情`} back="/c/heritage" />

      <div className="flex-1 overflow-y-auto pb-6">
        {/* 照片轮播 */}
        {item.photos.length > 0 && (
          <div className="relative bg-black aspect-[16/9]">
            <ImageWithFallback
              src={item.photos[photoIndex]}
              alt={item.name}
              className="w-full h-full object-contain"
            />
            {item.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {item.photos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="px-4 py-4 space-y-3">
          {/* 1. 标题卡 */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h2 className="text-[17px] font-semibold text-text-heading">{item.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary-50 text-primary">
                {item.area}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                {meta?.label}
              </span>
              {item.heritageSubType && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
                  {item.heritageSubType}
                </span>
              )}
              {item.preservationStatus && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  {item.preservationStatus}
                </span>
              )}
            </div>
            {item.basicInfo && (
              <p className="text-[13px] text-text-secondary mt-2.5 leading-relaxed">
                {item.basicInfo}
              </p>
            )}
          </div>

          {/* 2. 扩展信息（灵活字段 — 轻量 key-value，优先展示） */}
          {extraFields.length > 0 && item.extra && (() => {
            const validFields = extraFields.filter(({ key }) => {
              const v = item.extra?.[key];
              return v !== undefined && v !== null && v !== "";
            });
            return validFields.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 bg-primary rounded-full" />
                  详细信息
                </h3>
                <div>
                  {validFields.map(({ key, label }) => (
                    <FieldRow key={key} label={label} value={item.extra![key] as string | boolean} />
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* 3. 位置与地图（合并，不重复） */}
          {item.location && item.location.lat > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {item.address && (
                <div className="px-4 pt-3 pb-2 flex items-start gap-2">
                  <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-[13px] text-text-body">{item.address}</span>
                </div>
              )}
              <HeritageMap
                lat={item.location.lat}
                lng={item.location.lng}
                name={item.name}
                address={item.address}
              />
            </div>
          )}

          {/* 4. 图纸资料 */}
          {item.drawings && item.drawings.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-1.5">
                <span className="w-1 h-3.5 bg-primary rounded-full" />
                图纸资料
              </h3>
              <div className="space-y-2">
                {item.drawings.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-primary">
                    <FileText size={14} />
                    <span className="truncate">{d.split(/[\\/]/).pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. 文字介绍（大段文本沉底） */}
          {item.description && (
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-1.5">
                <span className="w-1 h-3.5 bg-primary rounded-full" />
                文字介绍
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
