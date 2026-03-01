import type { MetadataRoute } from "next";

const BASE_URL = "https://worklient.com";

const BLOG_POST_SLUGS = [
  "approval-bottlenecks-performance-marketing",
  "approval-traceability-agency-risk-management",
  "approval-workflow-software-vs-slack",
  "campaign-approval-delays-marketing-agencies",
  "campaign-review-bottlenecks-marketing-teams",
  "client-approval-delays-agencies",
  "client-approval-portals-vs-project-management-tools",
  "creative-approval-workflows-vs-ad-hoc-feedback",
  "creative-version-control-growing-agencies",
  "email-based-client-approvals-workflow-inefficiencies",
  "manual-approval-follow-ups-creative-teams",
  "professional-client-approval-process-agencies",
] as const;

const BLOG_POST_LAST_MODIFIED = new Date("2026-01-10");

type ChangeFrequency =
  MetadataRoute.Sitemap[number]["changeFrequency"];
type SitemapEntry = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  lastModified?: Date;
};

const STATIC_PAGES: SitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/approval-workflows", changeFrequency: "monthly", priority: 0.9 },
  { path: "/version-integrity", changeFrequency: "monthly", priority: 0.9 },
  { path: "/audit-traceability", changeFrequency: "monthly", priority: 0.9 },
  { path: "/client-experience", changeFrequency: "monthly", priority: 0.9 },
  { path: "/operational-visibility", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(
    ({ path, changeFrequency, priority, lastModified }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: lastModified ?? new Date(),
      changeFrequency,
      priority,
    })
  );

  const blogPostEntries: MetadataRoute.Sitemap = BLOG_POST_SLUGS.map(
    (slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: BLOG_POST_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  return [...staticEntries, ...blogPostEntries];
}
