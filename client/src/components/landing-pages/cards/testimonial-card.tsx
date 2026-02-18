import Image from "next/image";
import testimonialCardBackground1 from "@/assets/testimonials-bg-1.png";
import testimonialCardBackground1SVG from "@/assets/testimonials-bg-1.svg";
import testimonialCardBackground2 from "@/assets/testimonials-bg-2.png";
import testimonialCardBackground2SVG from "@/assets/testimonials-bg-2.svg";

interface TestimonialCardProps {
  message: string;
  name: string;
  role: string;
  variant: "default" | "other";
}
const TestimonialCard = ({ message, name, role, variant }: TestimonialCardProps) => {
  return (
    <div className="rounded-md border border-gray-200 min-h-[150px] h-full w-full">
        <div className="relative h-full w-full">
          {variant === "default" ? (
            <>
              <Image src={testimonialCardBackground1} alt="Testimonial" fill className="absolute top-0 left-0 w-full h-full object-cover rounded-md" />
              <Image src={testimonialCardBackground1SVG} alt="Testimonial" className="absolute rounded-md top-0 right-0" />
            </>
          ) : (
            <>
              <Image src={testimonialCardBackground2} alt="Testimonial" fill className="absolute top-0 left-0 w-full h-full object-cover rounded-md" />
              <Image src={testimonialCardBackground2SVG} alt="Testimonial" className="absolute rounded-md top-0 right-0" />
            </>
          )}
          <div className="absolute bottom-0 left-0 w-full h-fit p-6">
            <p className="text-body text-black/80 pb-4">{`"${message}"`}</p>
            <div className="flex items-center gap-2">
              <span className="text-body text-black/80 !font-medium">{name}</span>
              <div className="bg-gray-300 rounded-full w-1 h-1"></div>
              <span className="text-body text-black/60 font-normal">{role}</span>
            </div>
          </div>
        </div>
    </div>
  )
}

export default TestimonialCard;