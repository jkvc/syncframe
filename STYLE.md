# STYLE.md

Visual design for **`apps/site`** — the Syncframe docs, demo, and landing pages. The npm packages ship no UI; `@syncframe/spatial` calibration chrome will follow these conventions when built.

Architectural context and jkvc sibling comparison: [`notes/2026-06-07-site-design-system.md`](notes/2026-06-07-site-design-system.md).

## Palette

Tokens live in `apps/site/app/globals.css` under `@theme inline`.

| Token | HEX | Usage |
|---|---|---|
| `--color-paper` | `#eef2f6` | Page background (cool blueprint paper) |
| `--color-surface` | `#ffffff` | Cards, code blocks, stamped faces |
| `--color-surface-2` | `#e2e8f0` | Chips, ref-list backgrounds |
| `--color-surface-sunken` | `#e8edf2` | Recessed areas (reserved) |
| `--color-ink` | `#0c1222` | Primary text, borders, stamp shadows |
| `--color-ink-muted` | `#3d4f66` | Body copy, doc prose |
| `--color-ink-faint` | `#8b9cb3` | Meta, footer, captions |
| `--color-rule` | `#c5d0dc` | Hairline dividers inside panels |
| `--color-hot` | `#0d9488` | Accent — links, eyebrows, wordmark, arrows |
| `--color-hot-deep` | `#0f766e` | Accent hover/active |

Light-first. No dark mode yet.

### Shadows

Flat ink-colored offsets — no blur:

| Token | Offset |
|---|---|
| `--shadow-sm` | 2×2px |
| `--shadow-md` | 4×4px |
| `--shadow-lg` | 6×6px |

## Page background

Fixed 20×20px blueprint grid on `body::before` (cool-tinted lines, radial mask fading toward bottom). Selection inverts to teal on white.

## Typography

- **Sans** — Space Grotesk (`font-sans`). Default body 15px. Section titles: `font-black uppercase`. Wordmark: `sync` + italic sans `frame` in `--color-hot`.
- **Mono** — JetBrains Mono (`font-mono`). Code blocks, ref labels, `caption-mono` utility.
- **Doc prose** — `prose-doc` utility: 14px, `text-ink-muted`, hot underlined links.

Do **not** re-spell raw mono eyebrow classes — use `caption-mono` + a color token.

## Shapes

- **Sharp corners everywhere** — all `--radius-*` are `0px` except `rounded-full` for circular controls if needed.
- **Stamps** — 2px ink border + hard offset shadow on the same face element.
- **Hairline rules** — `hairline` utility (2px `--color-rule` top border). Used inside panels (code notes, ref rows) — not under section titles.
- **Dashed borders** — empty states and placeholders only.

## Stamp system (`apps/site/lib/stamp.ts`)

Face lifts −2px on hover; shadow offset grows +2px so the stamp stays pinned. Requires `group` on the interactive ancestor.

| Token / component | Idle shadow | Hover |
|---|---|---|
| `STAMP_FACE` | — | `border-2 border-ink transition-all duration-200 ease-out` |
| `STAMP_CONTROL_SHADOW` / `variant="control"` | 2×2 | `STAMP_CONTROL_LIFT` when interactive |
| `STAMP_CARD_SHADOW` / `variant="card"` | 6×6 | `STAMP_CARD_LIFT` when interactive |
| `STAMP_BLEED` | — | `p-2 -m-2` — isolated hero cards only |

Primitive: **`StampShell`** (`components/ui/StampShell.tsx`). Use for cards and one-off stamped surfaces. Use **`Pill`** for nav and action controls — do not hand-roll stamp chrome.

## Layout

- **Column width** — `max-w-3xl` everywhere via `lib/layout.ts` (`CONTENT_MAX`) and `ContentColumn`. Header, footer, and page bodies share the same width and horizontal padding (`px-5 sm:px-8`).
- **Interior pages** — `InteriorPageShell` wrapper; hero via `PageStampHeader`.
- **Site copy** — canonical strings in `lib/site.ts` (metadata, hero subtitle).

## CSS utilities (`globals.css`)

| Class | Role |
|---|---|
| `caption-mono` | 11px mono uppercase eyebrow |
| `hairline` | 2px rule divider |
| `prose-doc` | Doc body typography |
| `scrollbar-hidden` | Scroll without visible bar |

## Components

| Component | Role |
|---|---|
| `Wordmark` | Header brand link |
| `SiteHeader` / `SiteFooter` | Global chrome |
| `Pill` | Stamped nav and action buttons |
| `KindStamp` | Eyebrow chip on page headers |
| `PageStampHeader` | Interior page hero card |
| `SectionHead` | Bold uppercase section title (no flanking lines) |
| `CodeBlock` | Shiki-highlighted code (`code` prop, optional `note` inside box) |
| `RefList` / `RefRow` | Single-panel reference rows |
| `DocSection` | Section wrapper for docs |
| `LayerCard` | Home page package cards |

## Docs patterns

- Code blocks: white background, full width, copy icon (hover-reveal on pointer devices).
- Code notes: `note` prop on `CodeBlock` — renders inside the stamped box below a hairline, same prose styling as body.
- No back breadcrumbs — navigation is header-only.

## Icons

Small inline SVGs where needed (e.g. code-block copy/check). No icon font loaded on the site today.

## Do / don't

| Do | Don't |
|---|---|
| Import stamp tokens from `lib/stamp.ts` | Hand-roll offset shadows or 2px borders |
| Use `StampShell`, `Pill`, `ContentColumn` | Mix `max-w-5xl` header with `max-w-3xl` content |
| Use `SectionHead` for section breaks | Use centered `── LABEL ──` dividers |
| Pass `note` to `CodeBlock` for code footnotes | Render notes as siblings outside the box |
| Use `caption-mono` for eyebrows | Fake version badges or decorative meta |
