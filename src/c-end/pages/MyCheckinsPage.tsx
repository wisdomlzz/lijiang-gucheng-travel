import { useNavigate } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import { useCheckinStore } from "../../shared/stores/checkin-store";

export function MyCheckinsPage() {
  const navigate = useNavigate();
  const checkins = useCheckinStore((s) => s.checkins);
  const myCheckins = checkins.filter((c) => c.userId === "user-1");

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="我的打卡" back="/c/courtyards" />

      <div className="px-3 py-4 space-y-3">
        {myCheckins.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-text-tertiary">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MapPin size={24} className="opacity-30" />
            </div>
            <p className="text-[14px]">暂无打卡记录</p>
            <p className="text-[12px] mt-1">去文化院落完成一次打卡吧</p>
            <button
              onClick={() => navigate("/c/courtyards")}
              className="mt-4 px-6 h-9 rounded-full bg-primary text-white text-[13px]"
            >
              去打卡
            </button>
          </div>
        ) : (
          myCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <div className="h-36 relative">
                <ImageWithFallback
                  src={checkin.photo}
                  alt={checkin.courtyardName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                    <CheckCircle size={10} />
                    已打卡
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-white text-[15px] font-semibold">{checkin.courtyardName}</h3>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
                  <MapPin size={11} />
                  {checkin.address}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
                  <Clock size={11} />
                  {checkin.createdAt}
                </div>
                <button
                  onClick={() => navigate(`/c/courtyard/${checkin.courtyardId}`)}
                  className="w-full mt-2 h-8 rounded-full border border-primary text-primary text-[12px]"
                >
                  查看院落详情
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
