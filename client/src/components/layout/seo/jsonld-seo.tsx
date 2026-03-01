import Script from "next/script";

import { SEO_DEFAULTS } from "./metadata-seo";

export type JsonLdWebPageProps = {
  type: "WebPage";
  name: string;
  description: string;
  url: string;
};

export type JsonLdArticleProps = {
  type: "Article";
  headline: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified: string;
  articleSection?: string;
  keywords?: string[];
};

export type JsonLdSEOProps = JsonLdWebPageProps | JsonLdArticleProps;

const PUBLISHER = {
  "@type": "Organization" as const,
  name: SEO_DEFAULTS.siteName,
  logo: {
    "@type": "ImageObject" as const,
    url: SEO_DEFAULTS.defaultOgImage,
  },
};

const WEBSITE = {
  "@type": "WebSite" as const,
  name: SEO_DEFAULTS.siteName,
  url: SEO_DEFAULTS.siteUrl,
};

const AUTHOR = {
  "@type": "Organization" as const,
  name: SEO_DEFAULTS.siteName,
};

export function JsonLdSEO(props: JsonLdSEOProps) {
  const isArticle = props.type === "Article";
  const scriptId = isArticle ? "article-jsonld" : "webpage-jsonld";

  const jsonLd =
    props.type === "WebPage"
      ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: props.name,
        description: props.description,
        url: props.url,
        inLanguage: "en",
        isPartOf: WEBSITE,
        publisher: PUBLISHER,
      }
      : {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        inLanguage: "en",
        isAccessibleForFree: true,
        articleSection: props.articleSection,
        keywords: props.keywords,
        description: props.description,
        image: props.image,
        author: AUTHOR,
        publisher: PUBLISHER,
        datePublished: props.datePublished,
        dateModified: props.dateModified,
        mainEntityOfPage: {
          "@type": "WebPage" as const,
          "@id": props.url,
        },
      };

  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      strategy={isArticle ? undefined : "afterInteractive"}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}
