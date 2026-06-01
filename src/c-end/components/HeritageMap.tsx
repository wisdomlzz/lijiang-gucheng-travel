import { MapPin, Navigation, ExternalLink } from "lucide-react";

interface HeritageMapProps {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

// 获取导航URL
function getNavigationUrl(lat: number, lng: number, name: string): string {
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&src=mypage&coordinate=gaode`;
}

export function HeritageMap({ lat, lng, name, address }: HeritageMapProps) {
  // 高德地图静态图API（需要key，这里用简化版本）
  // 实际项目中建议使用腾讯/百度地图或自建地图服务
  const mapUrl = `https://restapi.amap.com/v3/staticmap?center=${lng},${lat}&zoom=16&size=600*300&markers=mid,0xFF0000,${lng},${lat}&key=YOUR_AMAP_KEY`;

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
        <h3 className="text-[14px] font-medium text-text-heading flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          位置地图
        </h3>
        <a
          href={getNavigationUrl(lat, lng, name)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[13px] text-primary font-medium"
        >
          <Navigation size={14} />
          导航
          <ExternalLink size={12} />
        </a>
      </div>

      {/* 地图展示区域 */}
      <div className="relative h-[200px] bg-[#F5F5F5]">
        {/* 这里使用高德地图Web端嵌入 */}
        <iframe
          src={`https://restapi.amap.com/v3/staticmap?center=${lng},${lat}&zoom=16&size=750*400&markers=mid,0xEA4335,${lng},${lat}&key=d2d501fc84d4cf0e2c0c3f4e0c3f0e3c`}
          className="w-full h-full border-0"
          title="位置地图"
          loading="lazy"
        />
        {/* 遮罩层表示加载中 */}
        <div className="absolute inset-0 bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <MapPin size={32} className="text-text-tertiary mx-auto mb-2" />
            <p className="text-[12px] text-text-tertiary">地图加载中...</p>
          </div>
        </div>
      </div>

      {/* 坐标信息 */}
      <div className="px-4 py-2 bg-surface-page flex items-center justify-between">
        <span className="text-[12px] text-text-tertiary">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        {address && (
          <span className="text-[12px] text-text-secondary truncate ml-2">{address}</span>
        )}
      </div>
    </div>
  );
}