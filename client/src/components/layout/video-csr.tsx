"use client"

import { useEffect, useRef, useState } from "react"

interface VideoSource {
  src: string
  type: string
}

interface VideoCSRProps extends React.HTMLAttributes<HTMLVideoElement> {
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

  const [isVisible, setIsVisible] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [sourcesLoaded, setSourcesLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.setAttribute("muted", "")
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          video.pause()
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -10% 0px",
      }
    )

    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || sourcesLoaded) return

    const video = videoRef.current
    if (!video) return

    setSourcesLoaded(true)

    requestAnimationFrame(() => {
      video.load()
    })
  }, [isVisible, sourcesLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !sourcesLoaded) return

    const handleCanPlay = async () => {
      try {
        await video.play()
        setIsReady(true)
      } catch {
        const unlock = async () => {
          try {
            await video.play()
            setIsReady(true)
          } catch {}
        }

        document.addEventListener("touchstart", unlock, { once: true })
        document.addEventListener("click", unlock, { once: true })
      }
    }

    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [sourcesLoaded])

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      className={`
        w-full h-full object-cover
        transition-opacity duration-100 ease-out
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
  )
}
