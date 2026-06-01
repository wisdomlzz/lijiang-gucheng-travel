import { X } from "lucide-react";

interface BottomSheetPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}

export function BottomSheetPicker({ open, onClose, title, options, value, onSelect }: BottomSheetPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-[20px] max-h-[60vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-border-light flex items-center justify-between shrink-0">
          <h3 className="text-[16px] text-text-body font-medium">{title}</h3>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-text-tertiary" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-1.5 pb-8">
          {options.map(opt => {
            const active = value === opt;
            return (
              <button
                key={opt}
                onClick={() => { onSelect(opt); onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-[14px] transition-colors ${
                  active
                    ? "bg-primary-50 text-primary font-medium"
                    : "text-text-body active:bg-[#F5F5F5]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
