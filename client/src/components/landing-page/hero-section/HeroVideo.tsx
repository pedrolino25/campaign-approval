"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    mounted && (
      <video
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
    )
  );
}
