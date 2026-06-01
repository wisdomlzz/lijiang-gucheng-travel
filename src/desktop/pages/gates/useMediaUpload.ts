import { useCallback, useRef } from "react"

export function useMediaUpload() {
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

  const pickVideo = useCallback((cb: (url: string, coverUrl?: string) => void) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "video/mp4,video/webm,video/ogg"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const videoUrl = reader.result as string
        generateVideoThumbnail(videoUrl).then((coverUrl) => {
          cb(videoUrl, coverUrl)
        }).catch(() => {
          cb(videoUrl)
        })
        inputRef.current = null
      }
      reader.readAsDataURL(file)
    }
    input.click()
    inputRef.current = input
  }, [])

  return { pickImage, pickVideo }
}

async function generateVideoThumbnail(videoUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.src = videoUrl
    video.currentTime = 1
    video.muted = true
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)
      resolve(canvas.toDataURL("image/jpeg"))
    }
    video.onerror = () => resolve(undefined)
  })
}
