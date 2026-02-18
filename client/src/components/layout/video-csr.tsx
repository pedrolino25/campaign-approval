"use client"

import { useEffect, useRef } from "react"

interface VideoCSRProps extends React.HTMLAttributes<HTMLVideoElement> {
  src: { src: string; type: string }[]
  poster?: string
}

export function VideoCSR({ src, poster, ...props }: VideoCSRProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hasPlayedRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // HARD REQUIREMENTS FOR MOBILE AUTOPLAY
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.setAttribute("muted", "")

    const safePlay = async () => {
      if (!video || hasPlayedRef.current) return
      try {
        await video.play()
        hasPlayedRef.current = true
      } catch {
        // Autoplay blocked — will retry on interaction
      }
    }

    const safePause = () => {
      if (!video) return
      video.pause()
      hasPlayedRef.current = false
    }

    const onIntersect = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (!video) return

      if (entry.isIntersecting) {
        if (video.readyState >= 2) {
          safePlay()
        } else {
          video.addEventListener("loadeddata", safePlay, { once: true })
        }
      } else {
        safePause()
      }
    }

    observerRef.current = new IntersectionObserver(onIntersect, {
      threshold: 0.3,
      rootMargin: "0px 0px -10% 0px",
    })

    observerRef.current.observe(video)

    // 🔓 iOS Unlock Fallback (first user interaction)
    const unlockOnInteraction = async () => {
      try {
        await video.play()
        video.pause()
      } catch {}
    }

    document.addEventListener("touchstart", unlockOnInteraction, {
      once: true,
    })
    document.addEventListener("click", unlockOnInteraction, {
      once: true,
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
      {...props}
    >
      {src.map((item, index) => (
        <source key={index} src={item.src} type={item.type} />
      ))}
    </video>
  )
}
