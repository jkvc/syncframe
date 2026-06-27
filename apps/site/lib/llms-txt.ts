import { SITE } from "./site";
import { DEMO_ROUTES, DOC_ROUTES } from "./site-routes";

function section(title: string, urls: string[]): string[] {
  if (urls.length === 0) return [];
  return [title, ...urls.map((url) => `- ${url}`), ""];
}

/** llms.txt body — derived from `SITE` + canonical doc/demo routes (same rules as `sitemap.ts`). */
export function buildLlmsTxt(): string {
  const docs = DOC_ROUTES.map((route) => `${SITE.url}${route.path}`);
  const demos = DEMO_ROUTES.map((route) => `${SITE.url}${route.path}`);

  const lines = [
    `# ${SITE.name}`,
    `> ${SITE.description}`,
    "",
    ...section("## Docs", docs),
    ...section("## Demos", demos),
    ...section("## Links", [SITE.github, SITE.author.url]),
  ];

  return lines.join("\n").trimEnd() + "\n";
}
