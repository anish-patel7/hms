"use client"

import { useEffect, useState } from "react"
import { fetchImageFromCloud } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { Image as ImageIcon } from "lucide-react"

interface CloudImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallbackSrc?: string
}

export function CloudImage({ src, className, fallbackSrc, alt, ...props }: CloudImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(false)

    async function loadSrc() {
      if (!src) {
        setLoading(false)
        setError(true)
        return
      }

      if (src.startsWith('supabase-img-')) {
        try {
          const base64 = await fetchImageFromCloud(src)
          if (isMounted) {
            if (base64) {
              setResolvedSrc(base64)
              setError(false)
            } else {
              setError(true)
            }
            setLoading(false)
          }
        } catch (e) {
          if (isMounted) {
            setError(true)
            setLoading(false)
          }
        }
      } else {
        // Standard URL
        if (isMounted) {
          setResolvedSrc(src)
          setLoading(false)
          setError(false)
        }
      }
    }

    loadSrc()

    return () => {
      isMounted = false
    }
  }, [src])

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-muted flex items-center justify-center", className)}>
        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
      </div>
    )
  }

  if (error || !resolvedSrc) {
    if (fallbackSrc) {
      return <img src={fallbackSrc} alt={alt || "Image"} className={className} {...props} />
    }
    return (
      <div className={cn("bg-muted flex flex-col items-center justify-center text-muted-foreground", className)}>
        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }

  return (
    <img 
      src={resolvedSrc} 
      alt={alt || "Image"} 
      className={className} 
      onError={() => setError(true)}
      {...props} 
    />
  )
}
