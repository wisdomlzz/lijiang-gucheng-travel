import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { ChevronLeft, Maximize2 } from "lucide-react";
import { useContentCourtyardStore } from "../../features/content/store/courtyard-store"

export function CulturalCourtyardVRPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courtyards = useContentCourtyardStore((s) => s.courtyards);
  const courtyard = courtyards.find((c) => c.id === id);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!courtyard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <p className="text-white/60 text-[14px]">页面不存在</p>
        <button
          onClick={() => navigate("/c/courtyards")}
          className="mt-4 px-4 py-2 rounded-full bg-white/20 text-white text-[13px]"
        >
          返回
        </button>
      </div>
    );
  }

  const vrImage = courtyard.vrImageUrl || courtyard.imageUrl;

  return (
    <div className={`min-h-screen bg-black ${isFullscreen ? "fixed inset-0 z-[100]" : ""}`}>
      <img src={vrImage} alt="" className="w-full h-full object-cover" />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(`/c/courtyard/${courtyard.id}`)}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
        <p className="text-white text-[15px] font-medium">虚拟游览</p>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
              setIsFullscreen(false);
            } else {
              document.documentElement.requestFullscreen();
              setIsFullscreen(true);
            }
          }}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
        >
          <Maximize2 size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
