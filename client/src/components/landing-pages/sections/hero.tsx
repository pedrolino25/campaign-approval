import { cn } from "@/lib/utils"
import NextImage from "next/image"
import React from "react"
import { ImageProps, StaticImport } from "next/dist/shared/lib/get-img-props"
import { Button } from "@/components/ui/button"
import posterDefault from "@/assets/heros/home-hero-poster.png";
import posterGreen from "@/assets/heros/approval-workflows-poster.png";
import posterYellow from "@/assets/heros/version-integrity-poster.png";
import posterBlue from "@/assets/heros/audit-traceability-poster.png";
import posterPurple from "@/assets/heros/client-experience-poster.png";
import posterLightBlue from "@/assets/heros/operational-visibility-poster.png";
import { TextEffect } from "@/components/motion-primitives/text-effect"
import { ButtonLink } from "@/components/ui/button-link"
import { ArrowRight } from "lucide-react"
import heroImage from "@/assets/heros/home-hero.png";

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
    backgroundVideoPoster: '/images/home-hero-poster.png',
    backgroundVideoSrc: [{ src: '/videos/home.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterDefault,
    imageSrc: heroImage,
  },
  green: {
    backgroundVideoPoster: '/images/approval-workflows-poster.png',
    backgroundVideoSrc: [{ src: '/videos/approval-workflows.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterGreen,
    imageSrc: heroImage,
  },
  yellow: {
    backgroundVideoPoster: '/images/version-integrity-poster.png',
    backgroundVideoSrc: [{ src: '/videos/version-integrity.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterYellow,
    imageSrc: heroImage,
  },
  blue: {
    backgroundVideoPoster: '/images/audit-traceability-poster.png',
    backgroundVideoSrc: [{ src: '/videos/audit-traceability.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterBlue,
    imageSrc: heroImage,
  },
  purple: {
    backgroundVideoPoster: '/images/client-experience-poster.png',
    backgroundVideoSrc: [{ src: '/videos/client-experience.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterPurple,
    imageSrc: heroImage,
  },
  lightBlue: {
    backgroundVideoPoster: '/images/operational-visibility-poster.png',
    backgroundVideoSrc: [{ src: '/videos/operational-visibility.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterLightBlue,
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
            <span className="text-small !font-semibold">⭐⭐⭐⭐⭐ 4.9</span><span className="text-small text-black/50">251 reviews</span>
          </Button>
          {title.map((t, index) => (
            <TextEffect
              key={index}
              per="word"
              as="h1"
              preset="blur"
              delay={index === 0 ? 0 : 0.5}
              speedReveal={2}
              className={cn("text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] text-start md:text-center", index > 0 && "-mt-5")}
            >{t}</TextEffect>
          ))}
          {description.map((d, index) => (
            <TextEffect
              key={index}
              per="word"
              as="p"
              preset="fade-in-blur"
              delay={index === 0 ? 1 : 1.2}
              speedReveal={100}
              className={cn("text-body lg:text-base text-black/50 text-start md:text-center", index > 0 && "-mt-5")}
            >{d}</TextEffect>
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
