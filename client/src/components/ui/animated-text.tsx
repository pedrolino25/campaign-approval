import { cn } from "@/lib/utils"

interface AnimatedTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: string
  delay?: number
  className?: string
}

export function AnimatedTitle({
  children,
  delay = 0,
  className,
}: AnimatedTitleProps) {
  const words = (children as string)?.split(" ")

  return (
    <h1
      className={cn(
        "text-3xl md:text-[38px] lg:text-[48px] font-medium tracking-[-0.04em] leading-[100%] text-start",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block opacity-0 animate-title-blur"
          style={{
            animationDelay: `${delay + i * 0.08}s`,
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </h1>
  )
}


interface AnimatedDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: string
  delay?: number
  className?: string
}

export function AnimatedDescription({
  children,
  delay = 0,
  className,
}: AnimatedDescriptionProps) {
  const words = (children as string)?.split(" ")

  return (
    <p
      className={cn(
        "text-body lg:text-base text-black/50 text-start",
        className
      )}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block opacity-0 animate-description-blur"
          style={{
            animationDelay: `${delay + i * 0.02}s`,
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </p>
  )
}