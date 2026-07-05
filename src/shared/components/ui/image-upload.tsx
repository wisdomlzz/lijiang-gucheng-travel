import { useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    setPreview(null)
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="预览" className="w-full h-32 object-cover rounded-xl border" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            error ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <ImagePlus size={18} className="text-slate-400" />
          </div>
          <p className="text-[13px] text-slate-400">点击或拖拽上传营业执照</p>
          <p className="text-[11px] text-slate-300">支持 JPG、PNG，不超过 5MB</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  )
}
