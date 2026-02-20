import { Navbar } from "@/components/landing-pages/navbar/navbar";
import { Container } from "@/components/ui/container";
import FooterSection from "@/components/landing-pages/sections/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pricing for the Worklient platform.",
  keywords: [
    "pricing",
    "subscription",
    "subscription pricing",
  ],
  openGraph: {
    title: "Pricing",
    description:
      "Pricing for the Worklient platform.",
    url: "https://worklient.com/pricing",
    siteName: "Worklient",
    type: "website",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function Pricing() {
  return (
    <>
      <Navbar />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
      </Container>
      <FooterSection/>
    </>
  )
}
