"use client";
import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      preload="auto" 
      poster={'/home_hero_poster.png'}
      muted
      playsInline
      className="hero-video pointer-events-none w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg"
    >
      <source src="/home_hero.webm" type="video/webm" />
      <source src="/home_hero.mp4" type="video/mp4" />
    </video>
  );
}
