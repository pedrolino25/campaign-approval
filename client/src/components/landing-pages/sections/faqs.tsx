import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import faqsPoster from "@/assets/faqs/faqs-bg.png";
import Image from "next/image"
import { ButtonLink } from "@/components/ui/button-link";

const faqs = [
  {
    title: "What makes this different from project management tools?",
    desc: "Project management platforms manage tasks. This platform governs approvals. It is purpose-built to structure campaign reviews, enforce status progression, preserve version history, and maintain traceable approval records.",
  },
  {
    title: "Do clients need to create accounts?",
    desc: "No. Clients access assets through secure, scoped review links. They can provide feedback and approve deliverables without onboarding complexity or exposure to other campaigns.",
  },
  {
    title: "How are versions handled?",
    desc: "Each asset maintains a structured version history. When a new file is uploaded, previous iterations remain accessible and feedback threads persist without losing context.",
  },
  {
    title: "Can approvals be tracked historically?",
    desc: "Yes. Every status change, comment, upload, and approval is recorded in an immutable activity log with timestamps for full traceability.",
  },
  {
    title: "What types of assets can be reviewed?",
    desc: "The platform supports images, videos, PDFs, URLs such as landing pages, and HTML files such as email templates — all within a unified approval workflow.",
  },
  {
    title: "How does this reduce approval delays?",
    desc: "Structured workflows, real-time status visibility, and automated reminders eliminate manual follow-ups and reduce ambiguity around who needs to act next.",
  },
  {
    title: "Is this secure for client-facing collaboration?",
    desc: "Yes. Clients only access specific review items via shared links. Organizations retain full control over visibility, permissions, and workflow actions.",
  },
  {
    title: "Can this replace email-based approvals?",
    desc: "That is the goal. Instead of scattered email threads and informal confirmations, approvals are centralized, structured, and permanently recorded.",
  },
];

const FAQsSection = () => {
  return (
    <section className="container relative py-[60px] flex items-center justify-center">
        <div className="absolute bottom-0 left-0 -z-10">
          <video
            autoPlay
            loop
            preload="auto"
            poster={'/home-hero-poster.png'}
            muted
            playsInline
            className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover rounded-bl-lg rounded-br-lg"
          >
            <source src={'/videos/faqs.mp4'} type='video/mp4' />
          </video>

          <Image
            src={faqsPoster}
            alt="Worklient Hero Poster"
            className="sm:hidden -z-10 w-full h-full object-cover rounded-bl-lg rounded-br-lg"
            priority
          />
        </div>
        <div className="flex flex-col gap-10 w-full max-w-full md:max-w-[540px]">
            <h2 className="text-h3 md:text-[32px] font-medium text-black/80">Frequently Asked Questions</h2>
            <Accordion
                type="single"
                collapsible
                className="w-full flex flex-col border-none"
            >
                {faqs.map((item, i) => (
                    <AccordionItem
                        key={i}
                        value={String(i)}
                        className="border-b last:border-b-0 border-black/10"
                    >
                        <AccordionTrigger
                            className="text-[18px] font-medium text-start text-black/80 hover:no-underline"
                        >
                            {item.title}
                        </AccordionTrigger>

                        <AccordionContent>
                            <p
                                key={`faq-${i}`}
                                className="text-body text-black/80"
                            >
                                {item.desc}
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <ButtonLink href="/signup" variant="outline" size="sm" className="group/hero-button gap-2 w-fit">
                <span className="transition-transform duration-300 group-hover/hero-button:-translate-x-0.5">
                    Get Started
                </span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:translate-x-0.5" />
            </ButtonLink>
        </div>
    </section>
  );
};

export default FAQsSection;
