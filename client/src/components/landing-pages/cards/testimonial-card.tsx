import Image from 'next/image'

import testimonialCardBackground1 from '@/assets/testimonials/testimonials-bg-1.png'
import testimonialCardBackground1SVG from '@/assets/testimonials/testimonials-bg-1.svg'
import testimonialCardBackground2 from '@/assets/testimonials/testimonials-bg-2.png'
import testimonialCardBackground2SVG from '@/assets/testimonials/testimonials-bg-2.svg'

interface TestimonialCardProps {
  message: string
  name: string
  role: string
  variant: 'default' | 'other'
}

const TestimonialCard = ({ message, name, role, variant }: TestimonialCardProps) => {
  return (
    <div className="relative rounded-md border border-gray-200 w-full overflow-hidden">
      {variant === 'default' ? (
        <>
          <Image
            src={testimonialCardBackground1}
            alt=""
            fill
            className="object-cover"
          />
          <Image
            src={testimonialCardBackground1SVG}
            alt=""
            className="absolute top-0 right-0"
          />
        </>
      ) : (
        <>
          <Image
            src={testimonialCardBackground2}
            alt=""
            fill
            className="object-cover"
          />
          <Image
            src={testimonialCardBackground2SVG}
            alt=""
            className="absolute bottom-0 right-0"
          />
        </>
      )}

      <div className="relative p-6 flex flex-col justify-between h-full">
        <p className="text-body italic lg:text-body-lg text-black/80 pb-4 break-words">
          {`"${message}"`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body text-black/80 !font-medium">{name}</span>

          <div className="bg-gray-300 rounded-full w-1 h-1" />

          <span className="text-body text-black/60">{role}</span>
        </div>
      </div>
    </div>
  )
}

export default TestimonialCard
