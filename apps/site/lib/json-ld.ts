import { SITE } from "./site";
import type { SiteRoute } from "./site-routes";

const WEBSITE_ID = `${SITE.url}/#website`;

function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Site-wide identity — rendered from the root layout. */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    author: {
      "@type": "Person",
      name: SITE.author.name,
      url: SITE.author.url,
    },
  };
}

/** Package doc pages — npm libraries documented on the site. */
export function buildSoftwareApplicationJsonLd(route: SiteRoute) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: route.title,
    description: route.description,
    url: absoluteUrl(route.path),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    isPartOf: { "@id": WEBSITE_ID },
    author: {
      "@type": "Person",
      name: SITE.author.name,
      url: SITE.author.url,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
