import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import image1 from '@/assets/blog/approval-bottlenecks-performance-marketing.png'
import image2 from '@/assets/blog/approval-traceability-agency-risk-management.png'
import image3 from '@/assets/blog/approval-workflow-software-vs-slack.png'
import image4 from '@/assets/blog/campaign-approval-delays-marketing-agencies.png'
import image5 from '@/assets/blog/campaign-review-bottlenecks-marketing-teams.png'
import image6 from '@/assets/blog/client-approval-delays-agencies.png'
import image7 from '@/assets/blog/client-approval-portals-vs-project-management-tools.png'
import image8 from '@/assets/blog/creative-approval-workflows-vs-ad-hoc-feedback.png'
import image9 from '@/assets/blog/creative-version-control-growing-agencies.png'
import image10 from '@/assets/blog/email-based-client-approvals-workflow-inefficiencies.png'
import image11 from '@/assets/blog/manual-approval-follow-ups-creative-teams.png'
import image12 from '@/assets/blog/professional-client-approval-process-agencies.png'
import BlogCard from '@/components/landing-pages/cards/blog-card'
import FooterSection from '@/components/landing-pages/sections/footer'
import { JsonLdSEO } from '@/components/layout/seo/jsonld-seo'
import { buildMetadataSEO, SEO_DEFAULTS } from '@/components/layout/seo/metadata-seo'
import { AnimatedTitle } from '@/components/ui/animated-text'
import { Container } from '@/components/ui/container'

const CANONICAL_PATH = '/blog'
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/blog`

export const metadata: Metadata = buildMetadataSEO({
  type: 'website',
  title: 'Blog | Agency Operations Insights',
  description:
    'Articles on approval workflows, client collaboration, and operational updates for modern agencies. Insights on campaign approvals, creative version control, and audit traceability.',
  canonicalPath: CANONICAL_PATH,
  keywords: [
    'agency blog',
    'approval workflows',
    'client collaboration',
    'campaign approvals',
    'agency operations',
  ],
  openGraphTitle: 'Blog | Agency Operations Insights | Worklient',
})

const BLOG_POSTS = [
  {
    title: 'Approval Bottlenecks in Performance Marketing',
    image: image1,
    link: '/blog/approval-bottlenecks-performance-marketing',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Approval Traceability in Agency Risk Management',
    image: image2,
    link: '/blog/approval-traceability-agency-risk-management',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Approval Workflow Software vs Slack',
    image: image3,
    link: '/blog/approval-workflow-software-vs-slack',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Campaign Approval Delays in Marketing Agencies',
    image: image4,
    link: '/blog/campaign-approval-delays-marketing-agencies',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Campaign Review Bottlenecks in Marketing Teams',
    image: image5,
    link: '/blog/campaign-review-bottlenecks-marketing-teams',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Client Approval Delays in Agencies',
    image: image6,
    link: '/blog/client-approval-delays-agencies',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Client Approval Portals vs Project Management Tools',
    image: image7,
    link: '/blog/client-approval-portals-vs-project-management-tools',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Creative Approval Workflows vs Ad-Hoc Feedback',
    image: image8,
    link: '/blog/creative-approval-workflows-vs-ad-hoc-feedback',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Creative Version Control in Growing Agencies',
    image: image9,
    link: '/blog/creative-version-control-growing-agencies',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Email-Based Client Approval Workflow Inefficiencies',
    image: image10,
    link: '/blog/email-based-client-approvals-workflow-inefficiencies',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Manual Approval Follow-Ups in Creative Teams',
    image: image11,
    link: '/blog/manual-approval-follow-ups-creative-teams',
    date: 'Jan 10, 2026 • 5 min read',
  },
  {
    title: 'Professional Client Approval Process in Agencies',
    image: image12,
    link: '/blog/professional-client-approval-process-agencies',
    date: 'Jan 10, 2026 • 5 min read',
  },
]

export default function Blog() {
  return (
    <>
      <Container>
        <div className="flex flex-col gap-20">
          <div className="flex flex-col md:flex-row gap-10 lg:gap-20">
            <div className="w-full flex flex-col gap-5 justify-center">
              <p className="text-body md:text-body-lg text-muted-foreground">Blog</p>
              <AnimatedTitle
                className={
                  'text-h3 md:text-h2 lg:text-hero-lg font-medium tracking-[-0.04em] leading-[100%] text-start text-black/80'
                }
              >
                Agency Operations Insights
              </AnimatedTitle>
              <p className="text-body md:text-body-lg text-muted-foreground">
                Articles on approval workflows, client collaboration, and operational updates for
                modern agencies.
              </p>
            </div>
            <Link
              href="/blog/client-approval-delays-agencies"
              className="w-full"
            >
              <div className="w-full border border-[#f0f0f0] rounded-md p-2 bg-[#f7f7f7] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200">
                <Image
                  src={image6}
                  alt="Client Approval Delays in Agencies"
                  className="w-full h-full object-cover rounded-md border border-[#f0f0f0]"
                />
              </div>
            </Link>
          </div>
          <div className="w-full border-b border-gray-200 border-dashed border[#000c]" />
          <div className="grid grid-cols-1 md:grid-cols-2  gap-5">
            {BLOG_POSTS.map((post) => (
              <BlogCard
                key={post.link}
                title={post.title}
                image={post.image}
                link={post.link}
                date={post.date}
              />
            ))}
          </div>
        </div>
      </Container>
      <FooterSection />
      <JsonLdSEO
        type="WebPage"
        name="Blog | Agency Operations Insights | Worklient"
        description="Articles on approval workflows, client collaboration, and operational updates for modern agencies."
        url={CANONICAL_URL}
      />
    </>
  )
}
