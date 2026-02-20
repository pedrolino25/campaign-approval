import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import posterGreen from "@/assets/backgrounds/bg-card-green-poster.png";
import posterYellow from "@/assets/backgrounds/bg-card-yellow-poster.png";
import posterBlue from "@/assets/backgrounds/bg-card-blue-poster.png";
import posterPurple from "@/assets/backgrounds/bg-card-purple-poster.png";
import posterRed from "@/assets/backgrounds/bg-card-red-poster.png";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = {
  green: {
    backgroundVideoPoster: '/images/bg-card-green-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-green.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterGreen,
  },
  yellow: {
    backgroundVideoPoster: '/images/bg-card-yellow-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-yellow.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterYellow,
  },
  blue: {
    backgroundVideoPoster: '/images/bg-card-blue-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-blue.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterBlue,
  },
  purple: {
    backgroundVideoPoster: '/images/bg-card-purple-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-purple.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterPurple,
  },
  red: {
    backgroundVideoPoster: '/images/bg-card-red-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-red.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterRed,
  },
}


interface FeatureImageProps {
  theme: keyof typeof themes
  imageSrc: string | StaticImport;
}

export const FeatureImage = ({
  theme,
  imageSrc,
}: FeatureImageProps) => {
  const { backgroundVideoPoster, backgroundVideoSrc, backgroundImageSrc } = themes[theme]
  return (
    <div className="relative w-full h-full overflow-hidden rounded-sm">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-sm">
            <video
                autoPlay
                loop
                preload="auto"
                poster={backgroundVideoPoster}
                muted
                playsInline
                className="hidden sm:block hero-video pointer-events-none w-full h-full object-cover rounded-sm scale-125"
            >
                {backgroundVideoSrc.map((src, index) => (
                    <source key={index} src={src.src} type={src.type} />
                ))}
            </video>

            <Image
                src={backgroundImageSrc}
                alt="feature background"
                className="sm:hidden -z-10 w-full h-full object-cover md:rounded-bl-sm md:rounded-br-sm"
                priority
            />
        </div>
        <div className="absolute top-[50px] left-[50px] w-full h-full overflow-hidden rounded-sm border border-[#f0f0f0] shadow-[0_0_0_5px_#ffffff80]">
        <Image
            src={imageSrc}
            alt="feature background"
            fill
            className="object-cover rounded-sm"
        />
        </div>
    </div>
  );
};


interface FeatureCardProps {
  theme: keyof typeof themes
  imageSrc: string | StaticImport;
  title: string;
  description: string;
  reverse?: boolean;
}

export const FeatureCard = ({
  theme,
  imageSrc,
  title,
  description,
  reverse = false,
}: FeatureCardProps) => {
  return (
    <div className={cn("bg-[#f7f7f7] rounded-md p-5 lg:p-10 flex flex-col-reverse sm:flex-row items-stretch gap-10 border border-[#f0f0f0]", reverse && "sm:!flex-row-reverse")}>
      <div className="flex-1">
        <div className="w-full aspect-[1.16618/1]">
          <FeatureImage theme={theme} imageSrc={imageSrc} />
        </div>
      </div>
      <div className="w-full sm:w-[50%] lg:w-[400px] shrink-0 flex flex-col justify-center gap-4 text-start">
        <h3 className="text-h3 lg:text-h2">{title}</h3>
        <p className="text-body">{description}</p>
        <ButtonLink href="/signup" variant="outline" size="sm" className="group/feature gap-2 w-fit">
          <span className="transition-transform duration-300 group-hover/feature:-translate-x-0.5">
              Get Started
          </span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/feature:translate-x-0.5" />
        </ButtonLink>
      </div>
    </div>
  );
};

