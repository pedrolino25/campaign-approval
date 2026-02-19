import { Navbar } from "@/components/landing-pages/navbar/navbar";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/heros/home-hero.png";
import Hero from "@/components/landing-pages/sections/hero";
import approvalWorkflowsPoster from "@/assets/heros/approval-workflows-poster.png";
import { ButtonLink } from "@/components/ui/button-link";

const HeroSection = () => {
  return (
    <Hero.Root>
        <Hero.Background
            videoPoster={'/home-hero-poster.png'}
            videoSrc={[{ src: '/videos/approval-workflows.mp4', type: 'video/mp4' }]}
            imageSrc={approvalWorkflowsPoster}
        />
    
      <Hero.Container>
        <Hero.Content>
          <Button variant="outline" className="shadow-none py-0 px-2 text-xs cursor-default gap-2 items-center justify-center">
            <span className="text-small !font-semibold">⭐⭐⭐⭐⭐ 4.9</span><span className="text-small text-black/50">251 reviews</span>
          </Button>
          <TextEffect
            per="word"
            as="h1"
            preset="blur"
            speedReveal={2}
            className="text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] text-start md:text-center"
          >
            Structured Approval Workflows
          </TextEffect>
          <TextEffect
            per="word"
            as="h1"
            preset="blur"
            delay={0.5}
            speedReveal={2}
            className="text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] -mt-5 text-start md:text-center"
          >
            Built for Campaign Scale
          </TextEffect>
          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            speedReveal={100}
            delay={1}
            className="text-body lg:text-base text-black/50 text-start md:text-center"
          >
            Control status progression, enforce permissions, and eliminate approval ambiguity.
          </TextEffect>
          <TextEffect
            per="word"
            as="p"
            preset="fade-in-blur"
            delay={1.2}
            speedReveal={100}
            className="text-body lg:text-base text-black/50 -mt-5 text-start md:text-center"
          >
            Designed for agencies that operate with process, not chaos.
          </TextEffect>
          <ButtonLink href="/signup" variant="outline" size="sm" className="group/hero-button gap-2">
            <span className="transition-transform duration-300 group-hover/hero-button:-translate-x-0.5">
              Get Started
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:translate-x-0.5" />
          </ButtonLink>
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

export default function ApprovalWorkflows() {
  return (
    <>
      <Navbar />
      <HeroSection/>
    </>
  )
}
