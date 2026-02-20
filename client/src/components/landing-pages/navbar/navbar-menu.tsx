import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronDownIcon } from "lucide-react";
import { ComponentType, SVGProps } from "react";
import Image from "next/image";
import IconCheck from "@/assets/icons/icon-check";
import IconVersion from "@/assets/icons/icon-version";
import IconSparkles from "@/assets/icons/icon-sparkles";
import IconSearch from "@/assets/icons/icon-search";
import IconClipboard from "@/assets/icons/icon-clipboard";
import ProductIcon from "@/assets/icon-product.svg";
import IconProduct from "@/assets/icons/icon-product";

interface MenuLinkItemProps {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  color: { background: string; icon: string };
}

const MenuLinkItem = ({
  title,
  description,
  Icon,
  href,
  color,
}: MenuLinkItemProps) => {
  return (
    <a
      href={href}
      className="group/product-link p-[6px] rounded-xs cursor-pointer transition-colors hover:bg-[#f7f7f7]"
      style={
        {
          "--hover-bg": color.background,
          "--hover-icon": color.icon,
        } as React.CSSProperties
      }
    >
      <div className="w-full flex gap-2">
        <div className="flex items-center justify-center p-2 rounded-xs bg-[#0000000d] transition-colors group-hover/product-link:bg-[color:var(--hover-bg)]">
          <Icon className="w-5 h-5 text-[#969696] transition-colors group-hover/product-link:text-[color:var(--hover-icon)]" />
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

export const NavbarMenuProducts = () => {
  return (
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
                    <IconProduct width={14} height={14} />
                    <span className="text-[#0000007a] font-medium text-xs">Product</span>
                </div>
                <MenuLinkItem
                    title="Approval Workflows"
                    description="Structured campaign progression"
                    Icon={IconCheck}
                    href="/approval-workflows"
                    color={{ background: "#3ccc391a", icon: "#179c1080" }}
                />
                <MenuLinkItem
                    title="Version Integrity"
                    description="Eliminate asset confusion permanently"
                    Icon={IconVersion}
                    href="/version-integrity"
                    color={{ background: "#ffa6001a", icon: "#ffb30080" }}
                />
                <MenuLinkItem
                    title="Audit & Traceability"
                    description="Every decision, permanently recorded"
                    Icon={IconClipboard}
                    href="/audit-traceability"
                    color={{ background: "#156ce51a", icon: "#156ce6cc" }}
                />
                <MenuLinkItem
                    title="Client Experience"
                    description="Professional, frictionless reviews"
                    Icon={IconSparkles}
                    href="/client-experience"
                    color={{ background: "#5239cc1a", icon: "#3300ff80" }}
                />
                <MenuLinkItem
                    title="Operational Visibility"
                    description="Complete approval status clarity"
                    Icon={IconSearch}
                    href="/operational-visibility"
                    color={{ background: "#cc39391a", icon: "#ff000080" }}
                />
            </div>
        </HoverCardContent>
    </HoverCard>
  );
};
