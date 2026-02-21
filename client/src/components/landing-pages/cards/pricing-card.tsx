
import Image from "next/image";
import posterGreen from "@/assets/backgrounds/bg-card-green-poster.png";
import posterBlue from "@/assets/backgrounds/bg-card-blue-poster.png";
import posterPurple from "@/assets/backgrounds/bg-card-purple-poster.png";
import { cn } from "@/lib/utils";
import IconCheck from "@/assets/icons/icon-check";
import { ButtonLink } from "@/components/ui/button-link";

const themes = {
  green: {
    backgroundVideoPoster: '/images/bg-card-green-poster.png',
    backgroundVideoSrc: [{ src: '/videos/bg-card-green.mp4', type: 'video/mp4' }],
    backgroundImageSrc: posterGreen,
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
}


interface BackgroundProps {
  theme: keyof typeof themes
}

export const Background = ({
  theme,
}: BackgroundProps) => {
  const { backgroundVideoPoster, backgroundVideoSrc, backgroundImageSrc } = themes[theme]
  return (
    <div className="relative w-full h-full overflow-hidden rounded-sm">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-sm opacity-40">
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
                className="sm:hidden -z-10 w-full h-full object-cover md:rounded-bl-sm md:rounded-br-sm scale-125"
                priority
            />
        </div>
    </div>
  );
};


interface PriceCardProps {
  theme: keyof typeof themes
  title: string
  description: string
  oldPrice?: string
  price: string
  features: string[]
}

export const PriceCard = ({
  theme,
  title,
  description,
  oldPrice,
  price,
  features,
}: PriceCardProps) => {
  return (
    <div className={cn("relative bg-black/5 rounded-sm border border-[#a0affa] h-[350px] lg:h-[450px]", theme === "purple" && "border-[#a0affa]", theme === "green" && "border-[#4fad55]", theme === "blue" && "border-[#a0affa]")}>
      <Background theme={theme} />
      <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between p-4">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="text-h3 lg:text-h2 text-black/80">{title}</h3>
            <p className="text-body lg:text-body-lg text-black/50">{description}</p>
          </div>
          <p className="text-h3 text-black/80">
          {oldPrice && (
            <span className="text-[22px] !font-medium text-black/50 line-through mr-1">{oldPrice}</span>
          )}
          {price}
          </p>
          <div className="flex flex-col gap-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <IconCheck className="w-4 h-4 text-black/60 mt-1" />
                <p className="text-body lg:text-body-lg text-black/60">{feature}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={cn("w-full p-1 bg-white rounded-sm border", theme === "purple" && "border-[#a0affa]", theme === "green" && "border-[#4fad55]", theme === "blue" && "border-[#a0affa]")}>
          <ButtonLink variant="secondary" size="sm" className="w-full" href="/signup">Get Started</ButtonLink>
        </div>
      </div>
    </div>
  );
};
