import { ArrowRight, ChevronDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";
import Logo from "@/assets/logo.svg";
import ProductIcon from "@/assets/icon-product.svg";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ComponentType, SVGProps } from "react";
import { ButtonLink } from "../ui/button-link";

interface ProductLinkItemProps {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  color: { background: string; icon: string };
}
const ProductLinkItem = ({title, description, Icon, href, color }: ProductLinkItemProps) => {
  return (
    <a href={href} className="p-[6px] hover:bg-[#f7f7f7] rounded-xs cursor-pointer">
      <div className="w-full flex gap-2">
        <div className={cn("flex items-center justify-center p-2 bg-[#0000000d] rounded-xs", `hover:bg-[${color.background}]`)}>
          <Icon className={cn("w-5 h-5 transition-colors", `hover:text-[${color.icon}]`)} />
        </div>
        <div className="flex flex-col">
          <span className="text-[#000000cc] font-normal text-sm">{title}</span>
          <span className="text-[#000000a3] font-normal text-xs">{description}</span>
        </div>
      </div>
    </a>
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
                    <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent sideOffset={12} side="bottom" align="start" className="p-2 w-full">
                  <div className="w-full h-full flex flex-col gap-2">
                    <div className="w-full flex gap-2 pl-[6px]">
                      <Image src={ProductIcon} alt="Product" width={14} height={14} />
                      <span className="text-[#0000007a] font-medium text-xs">Product</span>
                    </div>
                    <ProductLinkItem
                      title="Approval Workflows"
                      description="Structured campaign progression"
                      Icon={ProductIcon}
                      href="/product/approval-workflows"
                      color={{ background: "#3ccc391a", icon: "#179c1080" }}
                    />
                    <ProductLinkItem
                      title="Version Integrity"
                      description="Eliminate asset confusion permanently"
                      Icon={ProductIcon}
                      href="/product/version-integrity"
                      color={{ background: "neutral-100", icon: "neutral-500" }}
                    />
                    <ProductLinkItem
                      title="Audit & Traceability"
                      description="Every decision, permanently recorded"
                      Icon={ProductIcon}
                      href="/product/audit-traceability"
                      color={{ background: "neutral-100", icon: "neutral-500" }}
                    />
                    <ProductLinkItem
                      title="Client Experience"
                      description="Professional, frictionless reviews"
                      Icon={ProductIcon}
                      href="/product/client-experience"
                      color={{ background: "neutral-100", icon: "neutral-500" }}
                    />
                    <ProductLinkItem
                      title="Operational Visibility"
                      description="Complete approval status clarity"
                      Icon={ProductIcon}
                      href="/product/operational-visibility"
                      color={{ background: "neutral-100", icon: "neutral-500" }}
                    />
                  </div>
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
              className="flex items-center gap-2 font-normal hidden md:flex"
            >
              Login
            </Button>

            <ButtonLink href="/signup" size="sm" variant="secondary" className="group/navbar gap-2">
              <span className="transition-transform duration-300 group-hover/navbar:-translate-x-0.5">
                Get Started
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/navbar:translate-x-0.5" />
            </ButtonLink>

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
