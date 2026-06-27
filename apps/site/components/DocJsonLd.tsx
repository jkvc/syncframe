import JsonLd from "@/components/JsonLd";
import { buildSoftwareApplicationJsonLd } from "@/lib/json-ld";
import type { SiteRoute } from "@/lib/site-routes";

export default function DocJsonLd({ route }: { route: SiteRoute }) {
  return <JsonLd data={buildSoftwareApplicationJsonLd(route)} />;
}
