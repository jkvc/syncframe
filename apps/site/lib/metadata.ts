import type { Metadata } from "next";
import type { SiteRoute } from "./site-routes";
import { SITE } from "./site";

/** Per-page metadata aligned with root layout title template and social tags. */
export function pageMetadata(route: SiteRoute): Metadata {
  const url = `${SITE.url}${route.path}`;
  const index = route.index !== false;

  return {
    title: route.title,
    description: route.description,
    openGraph: {
      type: "website",
      title: route.title,
      description: route.description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
    },
    alternates: {
      canonical: url,
    },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}
