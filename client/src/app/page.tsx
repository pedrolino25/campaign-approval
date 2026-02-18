import { Navbar } from "@/components/landing-pages/navbar/navbar";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/heros/home-hero.png";
import heroPoster from "@/assets/heros/home-hero-poster.png";
import Hero from "@/components/landing-pages/hero";
import BenchmarkCard from "@/components/landing-pages/cards/benchmark-card";
import TestimonialCard from "@/components/landing-pages/cards/testimonial-card";
import IconFeature from "@/assets/icons/icon-feature";
import Features from "@/components/landing-pages/sections/features";

const HeroSection = () => {
  return (
    <Hero.Root>
        <Hero.Background
            videoPoster={'/home-hero-poster.png'}
            videoSrc={[{ src: '/hero-videos/home.mp4', type: 'video/mp4' }]}
            imageSrc={heroPoster}
        />
    
      <Hero.Container>
        <Hero.Content>
          <Button variant="outline" className="shadow-none py-0 px-2 text-xs cursor-default">
            Jan 20: Introducing Search by Calibration Profile
          </Button>
          <TextEffect
            per="word"
            as="h1"
            preset="blur"
            speedReveal={2}
            className="text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] text-start md:text-center"
          >
            Campaign Approval Infrastructure
          </TextEffect>
          <TextEffect
            per="word"
            as="h1"
            preset="blur"
            delay={0.5}
            speedReveal={2}
            className="text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] -mt-5 text-start md:text-center"
          >
            Powering Modern Agencies
          </TextEffect>
          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            speedReveal={100}
            delay={1}
            className="text-body lg:text-base text-black/50 text-start md:text-center"
          >
            Centralize feedback, structure workflows, and gain full approval traceability.
          </TextEffect>
          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            delay={1.2}
            speedReveal={100}
            className="text-body lg:text-base text-black/50 -mt-5 text-start md:text-center"
          >
            Designed for agencies that take client collaboration seriously.
          </TextEffect>
          <Button variant="outline" size="sm" className="group/hero-button gap-2">
            <span className="transition-transform duration-300 group-hover/hero-button:-translate-x-0.5">
              Get Started
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:translate-x-0.5" />
          </Button>
        </Hero.Content>
        <Hero.Image
            src={heroImage}
            alt="Worklient Hero"
            fill
            className="object-cover"
        />
      </Hero.Container>
    </Hero.Root>
  )
}

const WhatCompaniesSay = () => {
  return (
    <section className="container max-sm:px-0">
      <div className="max-w-[300px] mx-auto">
        <h2 className="text-h3 text-center">What companies say about Workclient</h2>
      </div>
      <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full grid grid-cols-2 gap-4">
          <BenchmarkCard value="3x" description="Faster approval cycles"/>
          <BenchmarkCard value="90%" description="Reduction in manual follow-ups"/>
        </div>
        <TestimonialCard
          name="Elena Kovac"
          role="Chief Operating Officer"
          message="Version confusion is gone. Every comment is centralized, every decision logged, and nothing gets lost between iterations. It’s the first time our approval process actually feels scalable."
          variant="default"
        />
        <TestimonialCard
          name="Daniel Mercer"
          role="Marketing Director"
          message="Before worklient, campaign reviews lived across email threads and Slack messages. Now every asset moves through a defined workflow with full visibility. Our approval cycles are faster, and more importantly, predictable."
          variant="other"
        />
        <div className="w-full grid grid-cols-2 gap-4">
          <BenchmarkCard value="42%" description="Faster campaign launches"/>
          <BenchmarkCard value="$18k" description="Savings from reduced delays"/>
        </div>
      </div>
    </section>
  )
}



export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <div className="flex flex-col items-center h-fit w-full px-5 py-16 sm:px-10 sm:py-20">
        <WhatCompaniesSay />
      </div>
      <div className="flex flex-col items-center h-fit w-full px-5 py-16 sm:px-10 sm:py-20 bg-[#f8f8f8] border-y border-[#f0f0f0]">
        <Features />
      </div>
    </>
  )
}
