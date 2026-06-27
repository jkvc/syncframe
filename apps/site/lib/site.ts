/** Canonical site copy — metadata, hero, footer, OG. */
export const SITE = {
  name: "Syncframe",
  tagline: "Sync continuous state across browsers",
  description:
    "Synchronize continuous state across devices without streaming. Broadcast anchors. Evaluate anywhere. Clients typically agree within ~30ms of server time.",
  /** Top-line categories — uppercase in OG masthead; explicit list so description edits don't break the card. */
  keywords: [
    "state sync",
    "anchor protocol",
    "multi-display",
    "browser sync",
  ] as const,
  /** Canonical origin without trailing slash. */
  url: "https://syncframe.jkvc.ai",
  github: "https://github.com/jkvc/syncframe",
  author: {
    name: "Junshen Kevin Chen",
    url: "https://jkvc.ai/about",
  },
} as const;
