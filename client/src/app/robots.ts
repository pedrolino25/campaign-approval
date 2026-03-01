import type { MetadataRoute } from "next";

const BASE_URL = "https://worklient.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/reviewer-activate",
          "/complete-signup/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/review-items",
          "/notifications",
          "/projects",
          "/organization",
          "/maintenance",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/reviewer-activate",
          "/complete-signup/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/review-items",
          "/notifications",
          "/projects",
          "/organization",
          "/maintenance",
        ],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
