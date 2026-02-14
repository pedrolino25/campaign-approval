import { LandingPageHeader } from "@/components/layout/landing-page-header";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/home_hero.png";
import Image from "next/image";

const HeroSection = () => {
  return (
    <header className="relative w-full h-[515px] md:h-[735px] xl:h-[860px] overflow-hidden px-0 md:px-16">
      
      {/* Background */}
      <div className="absolute inset-0 -z-10 md:px-12">
        <video
          src="https://pub-555ebc3d8fed45d59f65c8dc164ec44c.r2.dev/home_hero.mp4"
          loop
          preload="auto"
          poster="https://framerusercontent.com/images/IwOXTjWuAuYppuoPEcs1yJDuP5w.png?width=3016&height=1692"
          muted
          playsInline
          autoPlay
          className="w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg"
        />
      </div>

      {/* Content */}
      <div className="container pt-[96px] md:pt-[120px] flex flex-col gap-10 md:gap-16 items-center">
        
        <div className="max-w-full md:max-w-[800px] flex flex-col items-start md:items-center gap-5">
          <Button variant="outline" className="shadow-none py-0 px-2 text-xs cursor-default">
            Jan 20: Introducing Search by Calibration Profile
          </Button>

          <TextEffect
            per="word"
            as="h1"
            preset="fade-in-blur"
            speedReveal={2}
            className="text-3xl md:text-[38px] font-medium tracking-[-0.04em] leading-[100%] text-start md:text-center"
          >
            Campaign Approval Infrastructure
          </TextEffect>

          <TextEffect
            per="word"
            as="h1"
            preset="fade-in-blur"
            delay={0.5}
            speedReveal={2}
            className="text-3xl md:text-[38px] font-medium tracking-[-0.04em] leading-[100%] -mt-5 text-start md:text-center"
          >
            Powering Modern Agencies
          </TextEffect>

          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            speedReveal={100}
            delay={1}
            className="text-body text-black/50 text-start md:text-center"
          >
            Centralize feedback, structure workflows, and gain full approval traceability.
          </TextEffect>

          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            delay={1.2}
            speedReveal={100}
            className="text-body text-black/50 -mt-5 text-start md:text-center"
          >
            Designed for agencies that take client collaboration seriously.
          </TextEffect>

          <Button variant="secondary" size="sm" className="bg-white gap-2">
            <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
              Get Started
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Button>
        </div>

        <div className="w-full max-w-none md:max-w-[90%] flex flex-col items-center gap-4">
          <div className="relative w-full md:min-w-[600px] aspect-[1.66957/1] rounded-xs border border-[#f0f0f0] shadow-[0_0_0_5px_#ffffff80] overflow-hidden">
            <Image
              src={heroImage}
              alt="Worklient Hero"
              fill
              className="object-cover"
            />
          </div>
        </div>

      </div>
    </header>
  )
}

const ProductsSection = () => {
  return (
    <section className="w-full h-[500px]">

    </section>
  )
}


export default function Home() {
  return (
    <>
      <LandingPageHeader />
      <HeroSection/>
      <ProductsSection/>
    </>
  )
}
