/** Indexed docs and demos — drives sitemap, llms.txt, and per-page metadata. */
export type SiteRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency?: "weekly" | "monthly";
  priority?: number;
  /** Defaults to true. Presentation/kiosk URLs should be false. */
  index?: boolean;
};

export const CORE_DOC: SiteRoute = {
  path: "/docs/core",
  title: "@syncframe/core",
  description:
    "Clock synchronization, anchor protocol, evaluators, smoother, and pluggable storage for deterministic state extrapolation.",
  changeFrequency: "monthly",
  priority: 0.9,
};

export const REDIS_DOC: SiteRoute = {
  path: "/docs/redis",
  title: "@syncframe/redis",
  description:
    "Redis-backed SyncStore and SyncTransport for production Syncframe deployments.",
  changeFrequency: "monthly",
  priority: 0.8,
};

export const SPATIAL_DOC: SiteRoute = {
  path: "/docs/spatial",
  title: "@syncframe/spatial",
  description:
    "Multi-display screen registry, world-coordinate poses, and presence on top of @syncframe/core.",
  changeFrequency: "monthly",
  priority: 0.9,
};

export const TIMER_DEMO: SiteRoute = {
  path: "/demo/timer",
  title: "Timer demo",
  description:
    "A single global countdown synced across every browser — open multiple tabs or scan the QR code.",
  changeFrequency: "monthly",
  priority: 0.8,
};

export const DOT_DEMO: SiteRoute = {
  path: "/demo/dot",
  title: "Dot demo",
  description:
    "Register browser windows as named screens, calibrate poses, and watch a bouncing dot span the seams.",
  changeFrequency: "monthly",
  priority: 0.8,
};

export const RING_DEMO: SiteRoute = {
  path: "/demo/ring",
  title: "Color ring demo",
  description:
    "Twelve colored circles orbit a shared world and spin across four quadrant displays.",
  changeFrequency: "monthly",
  priority: 0.8,
};

/** Fullscreen kiosk URLs — linked from operators but not indexed. */
export const DOT_DISPLAY: SiteRoute = {
  path: "/demo/dot/display",
  title: "Dot display",
  description: "Fullscreen dot demo display surface.",
  index: false,
};

export const RING_DISPLAY: SiteRoute = {
  path: "/demo/ring/display",
  title: "Ring display",
  description: "Fullscreen color ring demo display surface.",
  index: false,
};

export const DOC_ROUTES: SiteRoute[] = [CORE_DOC, REDIS_DOC, SPATIAL_DOC];

export const DEMO_ROUTES: SiteRoute[] = [TIMER_DEMO, DOT_DEMO, RING_DEMO];

export const PRESENTATION_ROUTES: SiteRoute[] = [DOT_DISPLAY, RING_DISPLAY];
