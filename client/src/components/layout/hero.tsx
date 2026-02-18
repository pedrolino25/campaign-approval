import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import NextImage from "next/image"
import React from "react"
import { ImageProps, StaticImport } from "next/dist/shared/lib/get-img-props"

const Root = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <header
        ref={ref}
        className={cn("relative w-full h-[600px] md:h-[735px] xl:h-[860px] overflow-hidden px-0 md:px-16", className)}
        {...props}
    >
        {children}
    </header>
))

interface BackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    videoPoster: string;
    videoSrc: { src: string, type: string }[];
    imageSrc: string | StaticImport;
}
const Background = React.forwardRef<
  HTMLDivElement,
  BackgroundProps
>(({ className, children, videoPoster, videoSrc, imageSrc, ...props }, ref) => (
    <div className="absolute inset-0 md:px-12">
        <video
          autoPlay
          loop
          preload="auto" 
          poster={videoPoster}
          muted
          playsInline
          className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg"
        >
            {videoSrc.map((src) => (
                <source src={src.src} type={src.type} />
            ))}
        </video>
        <NextImage
          src={imageSrc}
          alt="Worklient Hero Poster"
          className="sm:hidden -z-10 w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg" 
          priority
        />
      </div>
))

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("container pt-[96px] md:pt-[120px] flex flex-col gap-10 md:gap-16 items-center", className)}
        {...props}
    >
        {children}
    </div>
))

const Image = React.forwardRef<
  HTMLElement,
  ImageProps
>(({ className, children, ...props }, ref) => (
    <div className="w-full max-w-none flex flex-col items-center gap-4">
        <div className="relative w-full md:min-w-[600px] aspect-[1.66957/1] rounded-xs border border-[#f0f0f0] shadow-[0_0_0_5px_#ffffff80] overflow-hidden">
        <NextImage
            ref={ref as React.RefObject<HTMLImageElement>} 
            {...props}
        />
        </div>
    </div>
))

const Content = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("max-w-full md:max-w-[800px] flex flex-col items-start md:items-center gap-5", className)}
        {...props}
    >
        {children}
    </div>
))

const Hero = {
    Root,
    Background,
    Container,
    Image,
    Content,
}

export default Hero;