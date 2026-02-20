import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import posterGreen from "@/assets/backgrounds/bg-hero-green-poster.png";
import posterYellow from "@/assets/backgrounds/bg-hero-yellow-poster.png";
import posterBlue from "@/assets/backgrounds/bg-hero-blue-poster.png";
import posterPurple from "@/assets/backgrounds/bg-hero-purple-poster.png";
import posterRed from "@/assets/backgrounds/bg-hero-red-poster.png";

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


interface FeatureBackgroundProps {
  theme: keyof typeof themes
  imageSrc: string | StaticImport;
}

export const FeatureBackground = ({
  theme,
  imageSrc,
}: FeatureBackgroundProps) => {
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
                className="sm:hidden -z-10 w-full h-full object-cover md:rounded-bl-lg md:rounded-br-lg"
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

