import { ArrowRight, ChevronDownIcon, Equal, MenuIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";
import logo from "@/assets/logo.svg";
import Image from "next/image";

export function LandingHeader() {
  return (
    <div className="relative group">
      <input
        type="checkbox"
        id="mobile-menu-toggle"
        className="peer hidden"
      />

      <nav className="z-20 fixed top-0 left-0 w-full flex justify-center items-center max-md:bg-white md:bg-[linear-gradient(rgb(255,255,255)_0%,rgb(255,255,255)_61%,rgba(0,0,0,0)_100%)] pt-3 px-5 pb-3 md:pb-10">
        <div className="container px-0 w-full flex justify-between items-center">
          <div className="flex items-center">
            <a href="/">
              <Image
                src={logo}
                alt="Worklient"
                width={100}
                height={100}
                className="mt-[-3px]"
              />
            </a>

            <div className="flex items-center gap-2 pl-4 hidden md:flex">
              <HoverCard openDelay={20} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="group flex items-center gap-2 font-normal"
                  >
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="group flex items-center gap-2 font-normal"
                  >
                    Solutions
                    <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent sideOffset={12} side="bottom" align="start">
                  <p>Worklient</p>
                </HoverCardContent>
              </HoverCard>

              <Button
                size="sm"
                variant="ghost"
                className="group flex items-center gap-2 font-normal"
              >
                Pricing
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="group flex items-center gap-2 font-normal hidden md:flex"
            >
              Login
            </Button>

            <Button size="sm" className="gap-2 group">
              <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
                Get Started
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>

            <label
              htmlFor="mobile-menu-toggle"
              className="relative pl-1 cursor-pointer md:hidden w-6 h-6 flex items-center justify-center"
            >
              <span
                className="
                  absolute w-5 h-[1px] bg-current
                  transition-all duration-300 ease-in-out
                  top-[10px]
                  group-has-[input:checked]:top-[12px]
                  group-has-[input:checked]:rotate-45
                "
              />

              <span
                className="
                  absolute w-5 h-[1px] bg-current
                  transition-all duration-300 ease-in-out
                  top-[16px]
                  group-has-[input:checked]:top-[12px]
                  group-has-[input:checked]:-rotate-45
                "
              />
            </label>
          </div>
        </div>
      </nav>

      <div
        className="
          fixed top-[60px] left-0 w-full
          bg-white z-10
          h-0 overflow-hidden
          transition-[height] duration-300 ease-in-out
          peer-checked:h-[calc(100vh-60px)]
          md:hidden
        "
      >
        <div className="flex flex-col p-6 gap-6 text-lg">
          <a href="#" className="font-medium">
            Product
          </a>
          <a href="#" className="font-medium">
            Solutions
          </a>
          <a href="#" className="font-medium">
            Pricing
          </a>
          <a href="#" className="font-medium">
            Login
          </a>
        </div>
      </div>
    </div>
  )
}
