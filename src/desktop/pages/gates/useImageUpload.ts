import { useCallback, useRef } from "react"

export function useImageUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const pickImage = useCallback((cb: (url: string) => void) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        cb(reader.result as string)
        inputRef.current = null
      }
      reader.readAsDataURL(file)
    }
    input.click()
    inputRef.current = input
  }, [])

  return { pickImage }
}
