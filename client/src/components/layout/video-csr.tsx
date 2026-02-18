"use client"

import { useEffect, useRef, useState } from "react"

interface VideoSource {
  src: string
  type: string
}

interface VideoCSRProps
  extends React.HTMLAttributes<HTMLVideoElement> {
  src: VideoSource[]
  poster?: string
}

export function VideoCSR({
  src,
  poster,
  className,
  ...props
}: VideoCSRProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [sourcesLoaded, setSourcesLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.setAttribute("muted", "")

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          video.pause()
        }
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -10% 0px",
      }
    )

    observer.observe(video)
    observerRef.current = observer

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || sourcesLoaded) return
    setSourcesLoaded(true)
  }, [isVisible, sourcesLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !sourcesLoaded) return

    const handleCanPlay = async () => {
      try {
        await video.play()
        setIsReady(true)
      } catch {}
    }

    video.addEventListener("canplay", handleCanPlay, { once: true })

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [sourcesLoaded])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
        poster={poster}
        className={`
          w-full h-full object-cover
          transition-opacity duration-700 ease-out
          ${isReady ? "opacity-100" : "opacity-0"}
          ${className ?? ""}
        `}
        {...props}
      >
        {sourcesLoaded &&
          src.map((item, index) => (
            <source key={index} src={item.src} type={item.type} />
          ))}
      </video>
    </div>
  )
}
