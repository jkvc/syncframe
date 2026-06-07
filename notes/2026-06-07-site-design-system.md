# Site Design System — Docs + Demo Reskin

**Date:** 2026-06-07

This note records the visual and component architecture of `apps/site` after the reskin pass. The site is a sibling to [jkvc](https://jkvc.com)'s neo-brutalist stamp language — same author, different product — not a copy of the portfolio.

## Design intent

jkvc reads as a warm technical handbook (paper `#f4f4f3`, spot red, Geist + Fraunces). Syncframe reads as a cool blueprint protocol doc (paper `#eef2f6`, teal accent, Space Grotesk + JetBrains Mono). Shared DNA:

- Sharp corners, 2px ink borders, hard offset shadows (no blur)
- Graph-paper page background (20×20px grid, blue-tinted, radial fade)
- Stamped cards and controls with physical lift-on-hover
- Bold uppercase section titles, mono eyebrows for meta labels
- API-doc appropriate — structured, scannable — without default SaaS chrome

Deliberately **not** carried over: back breadcrumbs, centered `── LABEL ──` dividers, fake version badges, wide header / narrow content mismatch.

## Palette (`apps/site/app/globals.css`)

| Token | HEX | Role |
|---|---|---|
| `--color-paper` | `#eef2f6` | Page background |
| `--color-surface` | `#ffffff` | Cards, code blocks |
| `--color-surface-2` | `#e2e8f0` | Chips, ref-list rows |
| `--color-ink` | `#0c1222` | Primary text, borders, shadows |
| `--color-ink-muted` | `#3d4f66` | Body copy |
| `--color-ink-faint` | `#8b9cb3` | Meta, footer |
| `--color-rule` | `#c5d0dc` | Dividers inside panels |
| `--color-hot` | `#0d9488` | Accent (keywords, arrows, wordmark) |

Shadows: `--shadow-sm` 2×2, `--shadow-md` 4×4, `--shadow-lg` 6×6 — all flat ink-colored offsets.

## Typography

- **Sans** — Space Grotesk (`font-sans`). Body 15px; doc prose 14px via `prose-doc`.
- **Mono** — JetBrains Mono (`font-mono`). Code blocks, `caption-mono` eyebrows (11px uppercase).
- **Wordmark** — `sync` + italic sans `frame` in `--color-hot`. Same family throughout; no serif accent.

Fonts loaded in `app/layout.tsx`. `--font-serif` / Instrument Serif remain from an earlier iteration but are unused — see [`TECH_DEBT.md`](../TECH_DEBT.md).

## Stamp system (`apps/site/lib/stamp.ts`)

Same lift-compensation model as jkvc: face translates −2px on hover while shadow offset grows +2px so the stamp appears pinned to the page.

| Token | Shadow | Use |
|---|---|---|
| `STAMP_CONTROL_SHADOW` | 2×2 | Pills, copy button, ref rows, code block shell |
| `STAMP_CARD_SHADOW` | 6×6 | Hero card, layer cards, page headers, timer demo |

Primitive: `components/ui/StampShell.tsx` — props `variant` (`card` \| `control`), `interactive`, `bleed`.

## Layout

Single column width everywhere: **`max-w-3xl`** via `lib/layout.ts` → `CONTENT_MAX`.

`ContentColumn` wraps header nav and footer text. `InteriorPageShell` uses the same max-width for page bodies (home, docs, demos). Horizontal padding: `px-5 sm:px-8` on shell and chrome.

Site copy lives in `lib/site.ts` (`SITE.name`, `SITE.tagline`, `SITE.description`) for metadata and hero subtitle.

## Component map

```
apps/site/
├── lib/
│   ├── stamp.ts          # Shadow/lift tokens
│   ├── layout.ts         # CONTENT_MAX
│   ├── site.ts           # Canonical copy
│   └── shiki.ts          # syncframe-light theme + highlighter singleton
└── components/
    ├── ui/
    │   ├── StampShell.tsx
    │   └── controlSize.ts
    ├── editorial/
    │   ├── Pill.tsx              # Stamped nav/control pills
    │   ├── KindStamp.tsx         # Eyebrow chip (Layer 1, Live demo, …)
    │   ├── PageStampHeader.tsx   # Interior page hero card
    │   ├── SectionHead.tsx       # Bold uppercase section title (no rule)
    │   └── InteriorPageShell.tsx
    ├── docs/
    │   ├── CodeBlock.tsx         # Async server — Shiki highlight
    │   ├── CodeBlockFrame.tsx    # Client — copy icon, note footer
    │   └── DocSection.tsx        # Section + RefList/RefRow, StepList, LayerCard
    └── site/
        ├── Wordmark.tsx
        ├── SiteHeader.tsx        # Wordmark + Docs/Demos pills
        ├── SiteFooter.tsx
        ├── ContentColumn.tsx
        └── PageChrome.tsx        # ActionRow + Pill re-exports
```

CSS modules were removed; all pages compose shared components + Tailwind tokens. Stable conventions: [`STYLE.md`](../STYLE.md).

## Docs patterns

- **Page hero** — `PageStampHeader` with `KindStamp` eyebrow. No trailing version strings.
- **Sections** — `DocSection` → `SectionHead` + `prose-doc` body.
- **Code** — `CodeBlock` with `code` string prop. Shiki `syncframe-light` theme, white background, full width. Optional `note` prop renders inside the stamped box below a `hairline` divider (same 14px body styling as prose).
- **Copy** — Icon button, top-right, hover-reveal on pointer devices; check icon + inverted stamp on success.
- **Reference rows** — `RefList` / `RefRow`: one stamped panel, aligned label column — not three floating chips.

## Home page patterns

- Hero stamp card with `STAMP_BLEED` for shadow room
- `SectionHead` + `StepList` / `StepItem` for numbered explainer
- `LayerCard` grid for `@syncframe/core` and `@syncframe/spatial`
- Use-case list: arrow aligned to first line (`items-start`, same 14px as body, `mt-[0.35em]` nudge)

## Navigation choices

- Header wordmark links home; Docs / Demos pills highlight by path prefix.
- No `← Back to home` breadcrumbs or back pills — navigation is header-only.
- Footer: `syncframe · © 2026`, no hairline above.

## Dependencies added for the site

- `tailwind-merge` — class composition on stamped components
- `shiki` — server-side syntax highlighting (`lib/shiki.ts`, custom light theme)

## Relationship to jkvc

| | jkvc | Syncframe site |
|---|---|---|
| Paper | Warm `#f4f4f3` | Cool `#eef2f6` |
| Accent | Red `#C0392B` | Teal `#0d9488` |
| Sans | Geist | Space Grotesk |
| Mono | Geist Mono | JetBrains Mono |
| Grid | 24px warm | 20px cool |
| Wordmark accent | Fraunces italic `kv` | Sans italic `frame` |

Stamp tokens and component roles (`StampShell`, `Pill`, `KindStamp`, `PageStampHeader`) mirror jkvc's structure but live in the syncframe repo — no cross-repo imports.

## Future cleanup (optional)

- Remove Instrument Serif — tracked in [`TECH_DEBT.md`](../TECH_DEBT.md)
- Spatial docs/demo pages are placeholders — reskin applies; content TBD
