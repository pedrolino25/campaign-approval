import { ArrowRight } from "lucide-react"
import type { ImageProps, StaticImport } from "next/dist/shared/lib/get-img-props"
import NextImage from "next/image"
import React from "react"

import posterBlue from "@/assets/backgrounds/bg-hero-blue-poster.png";
import posterDefault from "@/assets/backgrounds/bg-hero-default-poster.png";
import posterGreen from "@/assets/backgrounds/bg-hero-green-poster.png";
import posterPurple from "@/assets/backgrounds/bg-hero-purple-poster.png";
import posterRed from "@/assets/backgrounds/bg-hero-red-poster.png";
import posterYellow from "@/assets/backgrounds/bg-hero-yellow-poster.png";
import heroImage from "@/assets/heros/home-hero.png";
import IconSlack from "@/assets/icons/icon-slack"
import { AnimatedDescription, AnimatedTitle } from "@/components/ui/animated-text"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"

const Root = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "relative w-full h-[600px] md:h-[735px] xl:h-[860px] overflow-hidden px-0 md:px-16",
      className
    )}
    {...props}
  >
    {children}
  </header>
))

Root.displayName = "Root"

interface BackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  videoPoster: string
  videoSrc: { src: string; type: string }[]
  imageSrc: string | StaticImport
}

const Background = React.forwardRef<
  HTMLDivElement,
  BackgroundProps
>(({ className, children, videoPoster, videoSrc, imageSrc, ...props }, ref) => (
  <div
    ref={ref}
    className="absolute inset-0 md:px-12"
    {...props}
  >
    <video
      autoPlay
      loop
      preload="auto"
      poster={videoPoster}
      muted
      playsInline
      className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg"
    >
      {videoSrc.map((src, index) => (
        <source key={index} src={src.src} type={src.type} />
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

Background.displayName = "Background"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "container pt-[96px] md:pt-[120px] flex flex-col gap-10 md:gap-16 items-center",
      className
    )}
    {...props}
  >
    {children}
  </div>
))

Container.displayName = "Container"

const Image = React.forwardRef<
  HTMLImageElement,
  ImageProps
>(({ className, children, ...props }, ref) => (
  <div className="w-full max-w-none flex flex-col items-center gap-4">
    <div className="relative w-full md:min-w-[600px] aspect-[1.66957/1] rounded-xs border border-[#f0f0f0] shadow-[0_0_0_5px_#ffffff80] overflow-hidden">
      <NextImage
        ref={ref}
        className={className}
        {...props}
      />
    </div>
  </div>
))

Image.displayName = "Image"

const Content = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "max-w-full md:max-w-[800px] flex flex-col items-start md:items-center gap-5",
      className
    )}
    {...props}
  >
    {children}
  </div>
))

Content.displayName = "Content"

const themes = {
  default: {
    backgroundVideoPoster: '/images/bg-hero-default-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-default.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterDefault,
    imageSrc: heroImage,
  },
  green: {
    backgroundVideoPoster: '/images/bg-hero-green-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-green.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterGreen,
    imageSrc: heroImage,
  },
  yellow: {
    backgroundVideoPoster: '/images/bg-hero-yellow-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-yellow.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterYellow,
    imageSrc: heroImage,
  },
  blue: {
    backgroundVideoPoster: '/images/bg-hero-blue-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-blue.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterBlue,
    imageSrc: heroImage,
  },
  purple: {
    backgroundVideoPoster: '/images/bg-hero-purple-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-purple.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterPurple,
    imageSrc: heroImage,
  },
  red: {
    backgroundVideoPoster: '/images/bg-hero-red-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-hero-red.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterRed,
    imageSrc: heroImage,
  },
}

interface HeroSectionProps {
  theme: keyof typeof themes
  title: string[]
  description: string[]
}

const HeroSection = ({ theme, title, description }: HeroSectionProps) => {
  const { backgroundVideoPoster, backgroundVideoSrc, backgroundImageSrc, imageSrc } = themes[theme]
  return (
    <Root>
      <Background
        videoPoster={backgroundVideoPoster}
        videoSrc={backgroundVideoSrc}
        imageSrc={backgroundImageSrc}
      />
      <Container>
        <Content>
          <Button variant="outline" className="shadow-none py-0 px-2 text-xs cursor-default gap-2 items-center justify-center">
            <IconSlack className="w-4 h-4" /><span className="text-small text-black/50">Slack real-time notifications - Coming soon!</span>
          </Button>
          {title.map((t, index) => (
            <AnimatedTitle
              key={index}
              delay={index === 0 ? 0 : 0.5}
              className={index > 0 ? "-mt-5" : ""}
            >{t}</AnimatedTitle>
          ))}
          {description.map((d, index) => (
            <AnimatedDescription
              key={index}
              delay={index === 0 ? 1 : 1.2}
              className={index > 0 ? "-mt-5" : ""}
            >{d}</AnimatedDescription>
          ))}
          <ButtonLink href="/signup" variant="outline" size="sm" className="group/hero-button gap-2">
            <span className="transition-transform duration-300 group-hover/hero-button:-translate-x-0.5">
              Get Started
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:translate-x-0.5" />
          </ButtonLink>
        </Content>
        <Image
          src={imageSrc}
          alt="Worklient Hero"
          fill
          className="object-cover"
        />
      </Container>
    </Root>
  )
}

export default HeroSection
