import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, back }: { title: string; back?: string | (() => void) }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-border-light">
      <div className="flex items-center h-[44px] px-4 gap-4">
        <button
          onClick={() => {
            if (back) {
              if (typeof back === "function") back();
              else navigate(back);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center justify-center w-8 h-8 -ml-2 active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} className="text-text-body" />
        </button>
        <h1 className="text-[16px] font-semibold text-text-body truncate flex-1">{title}</h1>
      </div>
    </div>
  );
}