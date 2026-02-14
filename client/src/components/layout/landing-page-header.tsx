import { ArrowRight, ChevronDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";
import logo from "@/assets/logo.svg";
import Image from "next/image";

export function LandingPageHeader() {
  return (
    <nav className="z-10 fixed top-0 left-0 w-full flex justify-center items-center bg-[linear-gradient(rgb(255,255,255)_0%,rgb(255,255,255)_61%,rgba(0,0,0,0)_100%)] pt-3 px-5 pb-10">
      <div className="container px-0 w-full flex justify-between items-center">
        <div className="flex items-center">
          <a href="/">
            <Image src={logo} alt="Worklient" width={100} height={100} className="mt-[-3px]" />
          </a>
          <div className="flex items-center gap-2 pl-4 max-md:hidden">
            <HoverCard openDelay={20} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button size="sm" variant="ghost" className="group flex items-center gap-2 font-normal">
                  Product 
                  <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent sideOffset={12} side="bottom" align="start">
                <p>Worklient</p>
              </HoverCardContent>
            </HoverCard>
            <HoverCard openDelay={20} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button size="sm" variant="ghost" className="group flex items-center gap-2 font-normal">
                  Solutions 
                  <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent sideOffset={12} side="bottom" align="start">
                <p>Worklient</p>
              </HoverCardContent>
            </HoverCard>
            <Button size="sm" variant="ghost" className="group flex items-center gap-2 font-normal">
              Pricing
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="group flex items-center gap-2 font-normal">
            Login
          </Button>
          <Button size="sm" className="gap-2">
            <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
              Get Started
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"/>
          </Button>
        </div>
      </div>
    </nav>
  )
}
