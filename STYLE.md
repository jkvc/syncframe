# STYLE.md

Visual design conventions for Syncframe demo sites, landing pages, and any published UI (the library itself ships no visuals; the calibration UI in `@syncframe/spatial` follows whatever the consumer wants).

## Palette

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background |
| `--fg` | `#f5f5f5` | Primary text |
| `--muted` | `#888` | Secondary text, captions |
| `--accent` | `#7dd3fc` | Links, primary buttons (sky-400) |
| `--border` | `#1f2937` | Subtle borders (zinc-800) |

Dark-first by default. Light mode is out of scope for now.

## Typography

- Body: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` (stack, no custom font loading).
- Display headings: same stack, `font-semibold` (600), tight tracking.
- Monospace: `ui-monospace, "SF Mono", Menlo, monospace` — used for code, technical HUD readouts, clock offsets.

## Shape Language

- Border radius: `rounded-md` (6px) for inputs and small controls, `rounded-lg` (8px) for cards and larger surfaces.
- Buttons: `rounded-md`, solid fill with text-on-accent (e.g. `bg-sky-400 text-zinc-900`). Ghost variants for secondary actions.
- Inputs: `rounded-md`, single-pixel border (`border-zinc-700`), focus ring via `focus:border-sky-400` (no outline ring).

## Layout

- Demo landing pages: single centered column, `max-w-2xl`, generous vertical spacing.
- Calibration / operator UIs: two-column with live previews on the left, controls on the right.

## Motion

- Transitions on interactive states only: `transition` + explicit `hover:` class changes.
- No entrance animations or gratuitous motion on first paint.

## Icons

Use **Font Awesome 7** (`@fortawesome/fontawesome-free`) for any iconography. Do not hand-draw inline SVGs unless a truly custom icon is needed.
