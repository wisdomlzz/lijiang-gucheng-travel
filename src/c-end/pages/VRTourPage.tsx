import vrBgImage from "../../assets/VR.png";
import { PageHeader } from "./shop/PageHeader";

export function VRTourPage() {
  return (
    <div className="h-full bg-black relative overflow-hidden">
      <img src={vrBgImage} alt="虚拟游览" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10">
        <PageHeader title="虚拟游览" back="/c/home" variant="transparent" showBorder={false} />
      </div>
    </div>
  );
}
