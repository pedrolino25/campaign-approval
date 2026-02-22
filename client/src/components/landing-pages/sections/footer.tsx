import Logo from "@/assets/icon.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const Title = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-body !font-medium",
      className
    )}
    {...props}
  >
    {children}
  </p>
))

Title.displayName = "Title"

const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "!text-body text-black/50 hover:text-black",
      className
    )}
    {...props}
  >
    {children}
  </a>
))

Link.displayName = "Link"

const FooterSection = () => {
  return (
    <footer className="container flex flex-col lg:flex-row gap-5 lg:gap-[250px] pb-20">
      <div><Image src={Logo} alt="Worklient Logo" width={50} height={50} /></div>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
            <Title>Product</Title>
            <div className="flex flex-col">
                <Link href="/approval-workflows">Approval Workflows</Link>
                <Link href="/version-integrity">Version Integrity</Link>
                <Link href="/operational-visibility">Operational Visibility</Link>
                <Link href="/client-experience">Client Experience</Link>
                <Link href="/audit-traceability">Audit & Traceability</Link>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <Title>Company</Title>
            <div className="flex flex-col">
                <Link href="/blog">Blog</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="mailto:info@worklient.com">Contacts</Link>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <Title>Legal & Compliance</Title>
            <div className="flex flex-col">
                <Link href="/legal/terms-of-service">Terms of Service</Link>
                <Link href="/legal/privacy-policy">Privacy Policy</Link>
            </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterSection;