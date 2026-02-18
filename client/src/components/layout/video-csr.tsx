"use client"

import { useEffect, useRef } from "react"

interface VideoCSRProps extends React.HTMLAttributes<HTMLVideoElement> {
  src: { src: string; type: string }[]
  poster: string
}

export function VideoCSR({ src, poster, ...props }: VideoCSRProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return

        if (entry.isIntersecting) {
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise.catch(() => {})
          }
        } else {
          video.pause()
        }
      },
      {
        threshold: 0.05,
      }
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      loop
      poster={poster}
      {...props}
    >
      {src.map((item, index) => (
        <source key={index} src={item.src} type={item.type} />
      ))}
    </video>
  )
}
