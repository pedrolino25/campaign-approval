import { ArrowRight, ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";

import IconCheck from "@/assets/icons/icon-check";
import IconClipboard from "@/assets/icons/icon-clipboard";
import IconSearch from "@/assets/icons/icon-search";
import IconSparkles from "@/assets/icons/icon-sparkles";
import IconVersion from "@/assets/icons/icon-version";
import Logo from "@/assets/logo.svg";
import { ButtonLink } from "@/components/ui/button-link";

import { NavbarMenuProducts } from "./navbar-menu";

const MobileMenuButton = () => {
  return (
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
  )
}


interface MobileMenuLinkItemProps {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}

const MobileMenuLinkItem = ({
  title,
  description,
  Icon,
  href,
}: MobileMenuLinkItemProps) => {
  return (
    <a
      href={href}
      className="group/product-link rounded-xs cursor-pointer transition-colors"
    >
      <div className="w-full flex gap-2">
        <div className="flex items-center justify-center p-2 rounded-xs bg-[#0000000d] transition-colors">
          <Icon className="w-5 h-5 text-[rgb(150,150,150)] transition-colors" />
        </div>

        <div className="flex flex-col">
          <span className="text-[#000000cc] font-normal text-sm">
            {title}
          </span>
          <span className="text-[#000000a3] font-normal text-xs">
            {description}
          </span>
        </div>
      </div>
    </a>
  );
};

const MobileMenu = () => {
  return (
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
      <div className="flex flex-col p-6 gap-4 text-lg">
        <div className="relative">
          <input
            type="checkbox"
            id="product-toggle"
            className="peer hidden"
          />
          <label
            htmlFor="product-toggle"
            className="flex items-center justify-between cursor-pointer"
          >
            <p className="font-medium text-2xl text-[#000000cc]">
              Product
            </p>
          </label>
          <ChevronDownIcon
            className="
              pointer-events-none hidden
              absolute -right-[6px] top-[6px]
              w-6 h-6 text-[#969696]
              transition-transform duration-300
              peer-checked:rotate-180
              group-has-[input:checked]:block
            "
          />
          <div
            className="
              grid
              grid-rows-[0fr]
              transition-all duration-300 ease-in-out
              peer-checked:grid-rows-[1fr]
            "
          >
            <div className="overflow-hidden flex flex-col gap-6 pt-2">
              <MobileMenuLinkItem
                title="Approval Workflows"
                description="Structured campaign progression"
                Icon={IconCheck}
                href="/approval-workflows"
              />
              <MobileMenuLinkItem
                title="Version Integrity"
                description="Eliminate asset confusion permanently"
                Icon={IconVersion}
                href="/version-integrity"
              />
              <MobileMenuLinkItem
                title="Operational Visibility"
                description="Complete approval status clarity"
                Icon={IconSearch}
                href="/operational-visibility"
              />
              <MobileMenuLinkItem
                title="Client Experience"
                description="Professional, frictionless reviews"
                Icon={IconSparkles}
                href="/client-experience"
              />
              <MobileMenuLinkItem
                title="Audit & Traceability"
                description="Every decision, permanently recorded"
                Icon={IconClipboard}
                href="/audit-traceability"
              />
            </div>
          </div>
        </div>

        <a href="/pricing" className="font-medium text-2xl text-[#000000cc]">
          Pricing
        </a>
        <a href="/login" className="font-medium text-2xl text-[#000000cc]">
          Login
        </a>
      </div>
    </div>
  )
}

export function Navbar() {
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
                src={Logo}
                alt="Worklient"
                width={130}
                className="md:mt-[-9px]"
              />
            </a>

            <div className="flex items-center gap-2 pl-4 hidden md:flex">
              <NavbarMenuProducts />

              <ButtonLink
                href="/pricing"
                size="sm"
                variant="ghost"
                className="group flex items-center gap-2 font-normal"
              >
                Pricing
              </ButtonLink>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ButtonLink
              href="/login"
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 font-normal hidden md:flex"
            >
              Login
            </ButtonLink>

            <ButtonLink href="/signup" size="sm" variant="secondary" className="group/navbar gap-2">
              <span className="transition-transform duration-300 group-hover/navbar:-translate-x-0.5">
                Get Started
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/navbar:translate-x-0.5" />
            </ButtonLink>
            <MobileMenuButton />
          </div>
        </div>
      </nav>
      <MobileMenu />
    </div>
  );
}
