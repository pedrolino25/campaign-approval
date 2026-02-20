"use client";

import IconFeature from "@/assets/icons/icon-feature";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import featuresImage1 from "@/assets/features/feature-1.png";
import featuresImage2 from "@/assets/features/feature-2.png";
import featuresImage3 from "@/assets/features/feature-3.png";
import featuresImage4 from "@/assets/features/feature-4.png";
import { ButtonLink } from "@/components/ui/button-link";

const features = [
  {
    title: "Approval Workflows",
    desc: "Move every asset through structured status transitions with controlled permissions and clear progression from draft to final approval.",
    image: featuresImage1,
  },
  {
    title: "Version Integrity",
    desc: "Maintain clean version history with persistent feedback across every iteration and eliminate asset confusion permanently.",
    image: featuresImage2,
  },
  {
    title: "Audit Traceability",
    desc: "Log every comment, status change, and approval in a permanent activity record that protects accountability.",
    image: featuresImage3,
  },
  {
    title: "Automated Follow-Ups",
    desc: "Trigger reminders automatically to reduce approval delays and eliminate manual chasing across campaigns.",
    image: featuresImage4,
  },
];


const FeaturesSection = () => {
    const [active, setActive] = useState<string>("0");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 640px)");

        const handleChange = () => setIsMobile(media.matches);

        handleChange();
        media.addEventListener("change", handleChange);

        return () => media.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        const interval = setInterval(() => {
            setActive((prev) => String((parseInt(prev) + 1) % features.length));
        }, 4000);

        return () => clearInterval(interval);
    }, [isMobile]);

  return (
    <section className="container !px-0">
      <div className="w-full flex gap-20 items-stretch">
        <div className="w-full md:w-[40%] flex flex-col gap-6 justify-center">

          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <IconFeature width={24} height={24} className="text-[#969696]" />
              <p className="text-body text-black/80">Features</p>
            </div>

            <h2 className="text-h3 lg:text-h2 text-black/80">
              Your Campaign Approval System
            </h2>

            <p className="text-body text-black/80">
              An integrated approval platform built to manage campaign reviews at scale.
              From version control to final sign-off, it brings clarity and operational discipline to client collaboration.
            </p>

            <ButtonLink href="/signup" size="sm" variant="outline" className="group/features gap-2 w-fit">
              <span className="transition-transform duration-300 group-hover/features:-translate-x-0.5">
                Get Started
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/features:translate-x-0.5" />
            </ButtonLink>
          </div>

          <div className="hidden sm:flex w-fit gap-2">
            {features.map((_, i) => (
              <div
                key={i}
                className={`h-[4px] w-[14px] rounded-[22px] transition-colors duration-300 ${
                  active === String(i)
                    ? "bg-[#c4c5f4]"
                    : "bg-black/10"
                }`}
              />
            ))}
          </div>

          {isMobile ? (
            <Accordion
                type="multiple"
                value={features.map((_, i) => String(i))}
                className="w-full flex flex-col border-none"
            >
                {features.map((item, i) => (
                <AccordionItem
                    key={i}
                    value={String(i)}
                    className="border-b last:border-b-0 border-black/10"
                >
                    <AccordionTrigger
                    hideIcon
                    className="text-[18px] font-medium text-black/80 py-[12px] hover:no-underline pointer-events-none"
                    >
                    {item.title}
                    </AccordionTrigger>

                    <AccordionContent>
                    <p className="text-body text-black/80">
                        {item.desc}
                    </p>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
            ) : (
            <Accordion
                type="single"
                collapsible
                value={active}
                onValueChange={(val) => {
                if (val) setActive(val);
                }}
                className="w-full flex flex-col border-none"
            >
                {features.map((item, i) => (
                <AccordionItem
                    key={i}
                    value={String(i)}
                    className="border-b last:border-b-0 border-black/10"
                >
                    <AccordionTrigger
                    hideIcon
                    className="text-[18px] font-medium text-black/80 py-[12px] hover:no-underline"
                    >
                    {item.title}
                    </AccordionTrigger>

                    <AccordionContent>
                    <TextEffect
                        key={`${i}-${active}`}
                        per="word"
                        as="p"
                        preset="fade-in-blur"
                        speedReveal={100}
                        className="text-body text-black/80"
                    >
                        {item.desc}
                    </TextEffect>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
            )}
        </div>
        <div className="relative min-h-[650px] w-[60%] hidden md:block overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-sm">
                <video
                    autoPlay
                    loop
                    preload="auto"
                    poster={'/images/bg-card-purple-poster.png'}
                    muted
                    playsInline
                    className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover rounded-sm scale-125"
                >
                    <source src={'/videos/bg-card-purple.mp4'} type="video/mp4" />
                </video>
            </div>
            <Image
              src={features[parseInt(active)].image}
              alt="Worklient Hero"
              fill
              className="object-cover mt-[50px] ml-[50px] rounded-sm border border-[#f0f0f0] shadow-[0_0_0_5px_#ffffff80]"
            />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
