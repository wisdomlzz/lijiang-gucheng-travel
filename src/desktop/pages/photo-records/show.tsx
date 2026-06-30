import { useParams, useNavigate } from "react-router";
import { PageLayout } from "../../components/common/PageLayout";
import { Button } from "../../../shared/components/ui/button";
import { useCheckinStore } from "../../../shared/services/checkin";
import { ArrowLeft, MapPin, Clock, User } from "lucide-react";

export default function PhotoRecordShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const checkins = useCheckinStore((s) => s.checkins);
  const checkin = checkins.find((c) => c.id === id);

  if (!checkin) {
    return (
      <PageLayout
        title="文化院落打卡详情"
        breadcrumbs={[{ label: "运营管理" }, { label: "文化院落打卡记录" }, { label: "详情" }]}
      >
        <div className="text-center py-20 text-text-tertiary">记录不存在</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="文化院落打卡详情"
      breadcrumbs={[{ label: "运营管理" }, { label: "文化院落打卡记录" }, { label: checkin.courtyardName }]}
    >
      <div className="max-w-2xl">
        <div className="rounded-xl overflow-hidden mb-6">
          <img src={checkin.photo} alt="打卡照片" className="w-full object-cover max-h-96" />
        </div>

        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-heading">{checkin.courtyardName}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">已打卡</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <User size={14} className="text-text-tertiary" />
              {checkin.userName}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock size={14} className="text-text-tertiary" />
              {checkin.createdAt}
            </div>
            <div className="col-span-2 flex items-start gap-2 text-sm text-text-secondary">
              <MapPin size={14} className="text-text-tertiary mt-0.5" />
              {checkin.address}
            </div>
            <div className="col-span-2 text-xs text-text-tertiary">
              坐标：{checkin.location.lat.toFixed(6)}, {checkin.location.lng.toFixed(6)}
            </div>
          </div>
        </div>

        <Button variant="outline" className="mt-4" onClick={() => navigate("/desktop/photo-records")}>
          <ArrowLeft size={16} className="mr-1" />
          返回列表
        </Button>
      </div>
    </PageLayout>
  );
}
