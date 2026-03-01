import type { StaticImport } from 'next/dist/shared/lib/get-img-props'
import Image from 'next/image'
import Link from 'next/link'

import worklientLogo from '@/assets/icon.png'

const BlogCard = ({
  title,
  image,
  link,
  date,
}: {
  title: string
  image: string | StaticImport
  link: string
  date: string
}) => {
  return (
    <Link href={link}>
      <div className="w-full border border-[#f0f0f0] rounded-md p-2 bg-[#f7f7f7] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200">
        <div className="flex flex-col gap-4">
          <Image
            src={image}
            alt={title}
            className="w-full h-full object-cover rounded-md border border-[#f0f0f0]"
          />
          <div className="flex flex-col gap-4 px-2 pb-2">
            <p className="text-[12px] text-black/60">{date}</p>
            <p className="text-[18px] font-medium tracking-[-0.02em] leading-[100%] text-black/80">
              {title}
            </p>
            <div className="w-full border-b border-gray-200 border-dashed border[#000c]" />
            <div className="text-body text-black/60 flex items-center gap-2">
              by:{' '}
              <Image
                src={worklientLogo}
                alt="Worklient logo"
                className="w-5 h-5 object-contain"
              ></Image>
              <span className="text-black/80">Worklient</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BlogCard
