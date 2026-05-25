"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

interface UseUploadOptions {
  folder?: "posts" | "avatars" | "banners" | "communities"
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string) => void
}

export function useUpload(options: UseUploadOptions = {}) {
  const { folder = "posts", onSuccess, onError } = options
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error || "Upload failed"
        toast.error(msg)
        onError?.(msg)
        return null
      }

      setProgress(100)
      onSuccess?.(data)
      return data
    } catch {
      const msg = "Upload failed. Please try again."
      toast.error(msg)
      onError?.(msg)
      return null
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [folder, onSuccess, onError])

  return { upload, isUploading, progress }
}
