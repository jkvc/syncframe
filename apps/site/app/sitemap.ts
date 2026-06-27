import type { MetadataRoute } from "next";
import { DEMO_ROUTES, DOC_ROUTES } from "@/lib/site-routes";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const docAndDemoRoutes: MetadataRoute.Sitemap = [...DOC_ROUTES, ...DEMO_ROUTES].map(
    (route) => ({
      url: `${SITE.url}${route.path}`,
      changeFrequency: route.changeFrequency ?? "monthly",
      priority: route.priority ?? 0.7,
    }),
  );

  return [...home, ...docAndDemoRoutes];
}
