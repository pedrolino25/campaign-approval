import { cn } from "@/lib/utils"
import React from "react"
import NextImage from "next/image"
import poster from "@/assets/backgrounds/bg-hero-purple-poster.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { useRouter } from "next/navigation";

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <section ref={ref} className={cn("container relative flex justify-center px-5 sm:px-10 lg:px-10", className)} {...props}>
        <div className="absolute bottom-0 left-0 -z-10">
          <video
            autoPlay
            loop
            preload="auto"
            poster={'/images/bg-hero-purple-poster.png'}
            muted
            playsInline
            className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover rounded-bl-lg rounded-br-lg"
          >
            <source src={'/videos/bg-hero-purple.mp4'} type='video/mp4' />
          </video>

          <NextImage
            src={poster}
            alt="Worklient Hero Poster"
            className="sm:hidden -z-10 w-full h-full object-cover rounded-bl-lg rounded-br-lg"
            priority
          />
        </div>
        <div className="flex flex-col gap-10 w-full max-w-full md:max-w-[680px] pb-[200px]">
            {children}
        </div>
    </section>
))

Container.displayName = "Blog.Container"

const Date = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
    <span ref={ref} className="text-body text-black/50" {...props}>{children}</span>
))

Date.displayName = "Blog.Date"


const Title = ({ children }: { children: string }) => (
    <TextEffect
        per="word"
        as="h1"
        preset="blur"
        speedReveal={2}
        className={cn("text-h3 font-medium tracking-[-0.04em] leading-[100%] text-start")}
    >{children}</TextEffect>
)

Title.displayName = "Blog.Title"

const Image = ({ src, alt }: { src: string | StaticImport, alt: string }) => (
    <NextImage
        src={src}
        alt="Worklient Hero Poster"
        className="w-full object-cover rounded-md border border-black/5"
        priority
    />
)

Image.displayName = "Blog.Image"

const Subtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
    <h3 ref={ref} className="text-[18px] font-medium mt-5 tracking-[-0.02em] leading-[100%] text-black/80" {...props}>{children}</h3>
))

Subtitle.displayName = "Blog.Subtitle"

const Text = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
    <p ref={ref} className="text-body-lg text-black/80 mt-5" {...props}>{children}</p>
))

Text.displayName = "Blog.Text"

const Strong = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
    <span ref={ref} className="font-medium" {...props}>{children}</span>
))

Strong.displayName = "Blog.Strong"

const Blog = {
    Container,
    Date,
    Title,
    Image,
    Subtitle,
    Text,
    Strong,
}

export default Blog