import { useState } from "react";
import { useParams } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { useNavigate } from "react-router";

interface ReportRecord {
  id: string;
  images: string[];
  area: string;
  type: string;
  object: string;
  location: string;
  address: string;
  description: string;
  status: "pending" | "processed" | "rejected";
  createdAt: string;
  submitter: string;
  processResult?: string;
}

const mockRecords: Record<string, ReportRecord> = {
  r1: {
    id: "r1",
    images: [
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=200&h=200&fit=crop",
    ],
    area: "古城片区",
    type: "历史街巷",
    object: "四方街-卖草场",
    location: "云南省丽江市古城区四方街附近",
    address: "云南省丽江市古城区四方街12号",
    description: "发现四方街广场地面有多处地砖松动，存在行人绊倒的安全隐患，建议尽快安排人员进行维修处理。",
    status: "rejected",
    createdAt: "2026-05-16 17:02",
    submitter: "张三",
    processResult: "照片模糊，请重新拍摄清晰照片",
  },
  r2: {
    id: "r2",
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=200&h=200&fit=crop",
    ],
    area: "束河古镇",
    type: "水系",
    object: "新华街",
    location: "云南省丽江市束河古镇茶马古道博物馆旁",
    address: "束河古镇茶马古道博物馆旁",
    description: "绿化带内有大量落叶和垃圾堆积，影响古镇环境卫生和游客体验。",
    status: "processed",
    createdAt: "2026-05-16 10:15",
    submitter: "李四",
    processResult: "经核查，问题属实，已安排人员处理",
  },
  r3: {
    id: "r3",
    images: [
      "https://images.unsplash.com/photo-1585500568057-5d6c66be8c94?w=200&h=200&fit=crop",
    ],
    area: "古城片区",
    type: "历史街巷",
    object: "四方街",
    location: "云南省丽江市古城区四方街广场",
    address: "四方街广场",
    description: "商户占道经营，在主街道两旁摆摊设点，影响游客正常通行和古城形象。",
    status: "pending",
    createdAt: "2026-04-20 16:45",
    submitter: "王五",
  },
  r4: {
    id: "r4",
    images: [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1552581234-26160f608093?w=200&h=200&fit=crop",
    ],
    area: "古城片区",
    type: "古树名木",
    object: "五一街",
    location: "云南省丽江市古城区木府-忠义市场附近",
    address: "木府-忠义市场附近",
    description: "古建筑屋檐瓦片松动，有脱落危险过往行人请注意安全。",
    status: "pending",
    createdAt: "2026-05-15 09:20",
    submitter: "赵六",
  },
  r5: {
    id: "r5",
    images: [
      "https://images.unsplash.com/photo-1542219550-37153d387c27?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=200&h=200&fit=crop",
    ],
    area: "古城片区",
    type: "水系",
    object: "七一街",
    location: "云南省丽江市古城区黑龙潭-玉泉公园",
    address: "黑龙潭-玉泉公园",
    description: "停车场内垃圾较多，特别是塑料瓶和食品包装袋，影响景区环境。",
    status: "processed",
    createdAt: "2026-05-14 15:45",
    submitter: "钱七",
    processResult: "经核查，问题属实，已安排人员处理",
  },
};

const statusMeta = {
  pending: { label: "待处理", color: "text-primary", bg: "bg-primary-50" },
  processed: { label: "已核实", color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  rejected: { label: "驳回", color: "text-destructive", bg: "bg-destructive/10" },
};

export function PhotoRecordsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const record = mockRecords[id || ""];
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (!record) {
    return (
      <div className="min-h-full bg-surface-page flex flex-col">
        <PageHeader title="随手拍详情" back="/c/photo-records" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-[14px] text-text-tertiary">记录不存在</p>
          <button onClick={() => navigate("/c/photo-records")} className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-[13px]">返回列表</button>
        </div>
      </div>
    );
  }

  const s = statusMeta[record.status];

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="随手拍详情" back="/c/photo-records" />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20">
        {/* 基础信息 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
            <span className="text-[15px] font-semibold text-text-heading">基础信息</span>
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
              {s.label}
            </span>
          </div>

          <div className="px-4 py-3 border-b border-border-light">
            <span className="text-[14px] text-text-body font-medium">遗产要素</span>
          </div>

          {/* 片区 / 类型 / 对象 */}
          <div className="flex gap-2 px-4 py-3 border-b border-border-light">
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">片区</label>
              <div className="h-11 rounded-xl bg-[#F3F3F5] px-4 flex items-center text-[14px] text-text-secondary">
                {record.area}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">类型</label>
              <div className="h-11 rounded-xl bg-[#F3F3F5] px-4 flex items-center text-[14px] text-text-secondary">
                {record.type}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">对象</label>
              <div className="h-11 rounded-xl bg-[#F3F3F5] px-4 flex items-center text-[14px] text-text-secondary">
                {record.object}
              </div>
            </div>
          </div>

          {/* 位置 */}
          <div className="px-4 py-3 border-b border-border-light">
            <label className="text-[14px] text-text-body mb-1.5 block">位置</label>
            <div className="h-11 rounded-xl bg-[#F3F3F5] px-4 flex items-center text-[14px] text-text-secondary">
              {record.location}
            </div>
          </div>

          {/* 详细地址 */}
          <div className="px-4 py-3">
            <label className="text-[14px] text-text-body mb-1.5 block">详细地址</label>
            <div className="h-11 rounded-xl bg-[#F3F3F5] px-4 flex items-center text-[14px] text-text-secondary">
              {record.address}
            </div>
          </div>
        </div>

        {/* 补充信息 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
            <span className="text-[15px] font-semibold text-text-heading">补充信息</span>
          </div>

          {/* 异常描述 */}
          <div className="px-4 py-3 border-b border-border-light">
            <label className="text-[14px] text-text-body mb-1.5 block">异常情况描述</label>
            <div className="min-h-[80px] rounded-xl bg-[#F3F3F5] px-4 py-3 text-[14px] text-text-secondary leading-relaxed">
              {record.description}
            </div>
          </div>

          {/* 现场照片 */}
          <div className="px-4 py-3">
            <label className="text-[14px] text-text-body mb-2 block">现场照片</label>
            <div className="grid grid-cols-3 gap-2">
              {record.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-[#F3F3F5] cursor-pointer active:scale-95 transition-transform"
                  onClick={() => setPreviewIndex(i)}
                >
                  <img src={img} alt={`现场照片${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 处理信息 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border-light">
            <span className="text-[15px] font-semibold text-text-heading">处理信息</span>
          </div>

          {record.processResult && (
            <div className="px-4 py-3 border-b border-border-light">
              <label className="text-[14px] text-text-body mb-1.5 block">核实结果</label>
              <div className="min-h-[60px] rounded-xl bg-[#F3F3F5] px-4 py-3 text-[14px] text-text-secondary leading-relaxed">
                {record.processResult}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <span className="text-[13px] text-text-tertiary">提交时间</span>
            <span className="text-[13px] text-text-body">{record.createdAt}</span>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] text-text-tertiary">提交人</span>
            <span className="text-[13px] text-text-body">{record.submitter}</span>
          </div>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 pb-6 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30">
        <button
          onClick={() => navigate("/c/photo-records")}
          className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform"
        >
          返回
        </button>
      </div>

      {/* 照片预览 */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <img
            src={record.images[previewIndex]}
            alt="预览"
            className="max-w-[90%] max-h-[90%] rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
