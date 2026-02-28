import { headers } from "next/headers";
import Image from "next/image";

import Logo from "@/assets/logo.svg";
import { ButtonLink } from "@/components/ui/button-link";

import { NavbarAuthButtons } from "./navbar-auth-buttons";
import { NavbarMenuProducts } from "./navbar-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";

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

export function Navbar() {
  const hasSession = headers().get("x-session-present") === "1"
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
            <NavbarAuthButtons hasSession={hasSession} />
            <MobileMenuButton />
          </div>
        </div>
      </nav>
      <NavbarMobileMenu hasSession={hasSession} />
    </div>
  );
}
