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
import { VideoCSR } from "@/components/layout/video-csr";

const features = [
  {
    title: "Approval Workflows",
    desc: "Move every asset through structured status transitions with controlled permissions and clear progression from draft to final approval.",
  },
  {
    title: "Version Integrity",
    desc: "Maintain clean version history with persistent feedback across every iteration and eliminate asset confusion permanently.",
  },
  {
    title: "Audit Traceability",
    desc: "Log every comment, status change, and approval in a permanent activity record that protects accountability.",
  },
  {
    title: "Automated Follow-Ups",
    desc: "Trigger reminders automatically to reduce approval delays and eliminate manual chasing across campaigns.",
  },
];


const Features = () => {
  const [active, setActive] = useState<string>("0");

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev: string) => String((parseInt(prev) + 1) % 4));
      }, 4000);

      return () => clearInterval(interval);
    }, []);

  return (
    <section className="container max-sm:px-0">
      <div className="w-full flex gap-20 items-stretch">
        <div className="w-full flex flex-col gap-6 justify-center">

          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <IconFeature width={24} height={24} className="text-[#969696]" />
              <p className="text-body text-black/80">Features</p>
            </div>

            <h2 className="text-h3 text-black/80">
              Your Campaign Approval System
            </h2>

            <p className="text-body text-black/80">
              An integrated approval platform built to manage campaign reviews at scale.
              From version control to final sign-off, it brings clarity and operational discipline to client collaboration.
            </p>

            <Button size="sm" variant="outline" className="group/features gap-2 w-fit">
              <span className="transition-transform duration-300 group-hover/features:-translate-x-0.5">
                Get Started
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/features:translate-x-0.5" />
            </Button>
          </div>

          <div className="w-fit flex gap-2">
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
                  className="text-[18px] font-medium text-black/80 hover:no-underline py-[12px]"
                >
                  {item.title}
                </AccordionTrigger>

                <AccordionContent>
                  <TextEffect
                    key={`${i}-${active}`} // retriggers animation
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
        </div>
        <div className="relative w-full">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-sm">
                <VideoCSR
                    src={[{ src: '/hero-videos/features.mp4', type: 'video/mp4' }]}
                    poster={'/home-hero-poster.png'}
                    className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover rounded-sm scale-125"
                />
            </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
