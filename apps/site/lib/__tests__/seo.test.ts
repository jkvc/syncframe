import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "@/lib/llms-txt";
import { DEMO_ROUTES, DOC_ROUTES } from "@/lib/site-routes";
import { SITE } from "@/lib/site";

describe("seo", () => {
  it("llms.txt lists every indexed doc and demo route", () => {
    const body = buildLlmsTxt();
    for (const route of [...DOC_ROUTES, ...DEMO_ROUTES]) {
      expect(body).toContain(`${SITE.url}${route.path}`);
    }
    expect(body).toContain(SITE.github);
  });
});
