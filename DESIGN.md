# Design

> The visual contract. Do not introduce ad-hoc colors, radii, shadows, or motion durations. Compose from the tokens defined here.

## Tone

**Minimal, calm, Stripe-like.** Generous whitespace, soft shadows, large radii, restrained motion. Money is the data — typography and spacing should make numbers read clearly. No gradients-for-decoration. Color carries meaning (status, primary action), never just mood.

## Color tokens

All colors are exposed as CSS custom properties in `src/app.css`. The Tailwind config maps them to utilities like `bg-surface`, `text-primary`, etc.

### Light theme (default)

| Token | Value | Tailwind ref | Usage |
| --- | --- | --- | --- |
| `--bg` | `#f8fafc` | slate-50 | Page background |
| `--surface` | `#ffffff` | white | Cards, dialogs, popovers |
| `--surface-muted` | `#f1f5f9` | slate-100 | Inputs, hover backgrounds |
| `--border` | `#e2e8f0` | slate-200 | Hairlines, separators |
| `--border-strong` | `#cbd5e1` | slate-300 | Focus rings on neutrals |
| `--fg` | `#0f172a` | slate-900 | Primary text |
| `--fg-muted` | `#475569` | slate-600 | Secondary text |
| `--fg-subtle` | `#94a3b8` | slate-400 | Placeholder, hints |
| `--primary` | `#4f46e5` | indigo-600 | Brand, primary CTAs |
| `--primary-hover` | `#4338ca` | indigo-700 | Hover/active for primary |
| `--primary-fg` | `#ffffff` | white | Text on primary |
| `--primary-soft` | `#eef2ff` | indigo-50 | Selected backgrounds, info banners |
| `--success` | `#059669` | emerald-600 | Positive balances, confirmations |
| `--success-soft` | `#ecfdf5` | emerald-50 | |
| `--warning` | `#d97706` | amber-600 | Pending, caution |
| `--warning-soft` | `#fffbeb` | amber-50 | |
| `--danger` | `#e11d48` | rose-600 | Destructive actions, negative balances |
| `--danger-soft` | `#fff1f2` | rose-50 | |
| `--ring` | `#4f46e5` at 60% | — | Focus outline |

### Dark theme (`[data-theme="dark"]`)

| Token | Value | Tailwind ref |
| --- | --- | --- |
| `--bg` | `#020617` | slate-950 |
| `--surface` | `#0f172a` | slate-900 |
| `--surface-muted` | `#1e293b` | slate-800 |
| `--border` | `#1e293b` | slate-800 |
| `--border-strong` | `#334155` | slate-700 |
| `--fg` | `#f1f5f9` | slate-100 |
| `--fg-muted` | `#94a3b8` | slate-400 |
| `--fg-subtle` | `#64748b` | slate-500 |
| `--primary` | `#818cf8` | indigo-400 |
| `--primary-hover` | `#a5b4fc` | indigo-300 |
| `--primary-fg` | `#0f172a` | slate-900 |
| `--primary-soft` | `#1e1b4b` | indigo-950 |
| `--success` | `#34d399` | emerald-400 |
| `--success-soft` | `#022c22` | emerald-950 |
| `--warning` | `#fbbf24` | amber-400 |
| `--warning-soft` | `#451a03` | amber-950 |
| `--danger` | `#fb7185` | rose-400 |
| `--danger-soft` | `#4c0519` | rose-950 |

Theme is applied by setting `data-theme="dark"` on `<html>` (via `mode-watcher`). Persisted in a `theme` cookie so SSR matches.

### Contrast

- Body text on `--bg`: AA at all sizes (light: 15.8:1, dark: 14.6:1).
- `--fg-muted` on `--bg`: AA at 14px+ only.
- `--primary-fg` on `--primary`: AA Large in light theme; AA in dark.

## Typography

- **UI** — `Inter Variable`, fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. `font-feature-settings: 'cv11','ss01';` for clearer numerals.
- **Numerals** — `JetBrains Mono Variable` for displayed amounts, totals, and per-person shares (`font-mono`).

### Type scale

| Token | Size / line-height | Tailwind | Usage |
| --- | --- | --- | --- |
| `--text-xs` | 12 / 16 | `text-xs` | Captions, labels above inputs |
| `--text-sm` | 14 / 20 | `text-sm` | Secondary body, table cells |
| `--text-base` | 16 / 24 | `text-base` | Body |
| `--text-lg` | 18 / 28 | `text-lg` | Emphasised body |
| `--text-xl` | 20 / 28 | `text-xl` | Card section titles |
| `--text-2xl` | 24 / 32 | `text-2xl` | Card titles |
| `--text-3xl` | 30 / 36 | `text-3xl` | Page titles (mobile) |
| `--text-4xl` | 36 / 40 | `text-4xl` | Page titles (desktop) |
| `--text-5xl` | 48 / 52 | `text-5xl` | Hero, KPI numbers |

Headings: `font-semibold` (600). Numerals on tiles/totals: `font-mono font-medium` (500). Body: `font-normal` (400).

## Spacing & layout

- **Base unit**: 4px (Tailwind default).
- **Section gap**: 32 (between top-level sections on a page).
- **Card padding**: 24 (mobile 20).
- **Container**: max-width 1120px (`max-w-5xl`) for content pages, 1280px (`max-w-7xl`) for dashboards.
- **Form field gap**: 16 vertical between fields, 8 between label and input.

## Radii

| Token | Value | Used on |
| --- | --- | --- |
| `--radius-sm` | 6px | Tags, badges |
| `--radius-md` | 8px | Inputs, buttons |
| `--radius-lg` | 12px | Cards, list items |
| `--radius-xl` | 16px | Dialogs, prominent cards |
| `--radius-full` | 9999px | Avatars, pills |

## Elevation

Three levels only:

| Token | CSS | Used on |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)` | Resting cards |
| `--shadow-md` | `0 4px 6px rgb(15 23 42 / 0.05), 0 10px 15px rgb(15 23 42 / 0.08)` | Popovers, dropdowns |
| `--shadow-lg` | `0 10px 15px rgb(15 23 42 / 0.06), 0 20px 25px rgb(15 23 42 / 0.10)` | Dialogs |

In dark mode, opacities are doubled and the tint shifts to pure black.

## Motion

- **Micro** (hover, focus): 120ms.
- **Standard** (popover, dialog open): 200ms.
- **Page transitions**: 320ms.
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) for entrances, `cubic-bezier(0.4, 0, 1, 1)` (in) for exits.
- **Reduced motion**: when `prefers-reduced-motion: reduce` matches, durations collapse to 0ms and translations are removed (opacity-only).

## Iconography

- Library: [`lucide-svelte`](https://lucide.dev/) only. Replaces PrimeIcons.
- Default size 20px; 16px in tight UI; 24px on hero buttons.
- `stroke-width: 1.75`. Line caps round.

## Components

Every interactive component documents these states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`. Plus `selected` when applicable.

### Button

- **Primary** — solid `--primary`, `--primary-fg` text. Hover → `--primary-hover`. Focus ring 2px `--ring` offset 2.
- **Secondary** — `--surface`, 1px `--border`, `--fg`. Hover → `--surface-muted`.
- **Ghost** — transparent, `--fg`. Hover → `--surface-muted`.
- **Destructive** — solid `--danger`, white text. Hover darken 10%.
- **Sizes** — sm 32 / md 40 / lg 48 (height in px). Padding 12/16/20.
- **Loading** — spinner replaces leading icon; label remains; button stays the same width.
- **Disabled** — opacity 50, cursor not-allowed.

### Card

- Surface `--surface`, 1px `--border`, radius `--radius-xl`, padding 24, `--shadow-sm`.
- Header: 16px above title, 8px between title and description.
- Footer: top divider 1px `--border`, padding 16/24.
- No gradients in headers.

### Input / NumberInput

- Height 40 (md). Radius `--radius-md`. 1px border. Background `--surface-muted` in light, `--surface` in dark.
- Focus: border `--primary` + ring 3px `--primary` 20% opacity.
- Error: border `--danger`. Helper text below in `--danger`.

### Select / MultiSelect

- Same chrome as Input. Caret icon `lucide:chevron-down`.
- Listbox: `--shadow-md`, radius `--radius-lg`, max-height 320, internal scroll.
- Multi-select chips inside the trigger: radius `--radius-full`, height 24, `--surface-muted` background.

### Dialog

- Backdrop: `rgb(15 23 42 / 0.6)` with 4px blur.
- Container: max-width 480 (sm) / 640 (md) / 800 (lg). Radius `--radius-xl`. `--shadow-lg`.
- Header padded 24, body 24, footer 16/24 with top border.
- Close button top-right (`lucide:x`), 8px from edges.
- Focus is trapped; Escape closes; clicking the backdrop closes (unless explicitly disabled for forms with unsaved data).

### Toast

- Top-right anchored on desktop, top-center on mobile. Stack vertically with 8px gap.
- Width 360. Radius `--radius-lg`. `--shadow-md`.
- Severity icons leading: success `lucide:check-circle-2`, info `lucide:info`, warning `lucide:triangle-alert`, error `lucide:x-circle`.
- Auto-dismiss 4s; pause on hover; dismissible.

### Avatar

- Circle. Sizes 24 / 32 / 40 / 48. Falls back to initials on the muted surface when no image.

### Empty state

- Icon (24, `--fg-subtle`) + headline (`text-lg`, `font-semibold`) + description (`text-sm`, `--fg-muted`) + optional CTA. Centered, 320–480 wide, 48 vertical padding.

### Skeleton

- `--surface-muted` block with subtle 1.5s shimmer (gradient sweep). Disabled when `prefers-reduced-motion` is set.

## Page archetypes

| Page | Archetype |
| --- | --- |
| `/` | Calculator — connect/select group → bill cards → grand total |
| `/dashboard` | KPI tiles + balance bars + recent activity strip |
| `/expenses` | Data-density list with filters; detail pane on `[id]` |
| `/expenses/new` | Multi-step form (currency + category + members) |
| `/friends`, `/notifications` | List with empty/error states |
| `/about` | Hero card + feature list |

## Accessibility floor

- All interactive elements reachable by keyboard. `Tab` order matches visual order.
- Focus is visible at all times (never `outline: none` without an alternative).
- AA contrast minimum, AAA where it costs nothing.
- Form fields have programmatic labels (`<Label for>` or `aria-label`).
- Live totals announce via `aria-live="polite"` on the grand-total region.
- Dialogs trap focus, return it to the trigger on close, and have an accessible name (`aria-labelledby` to the header).
- All images have `alt`; decorative icons get `aria-hidden="true"`.
- Color is never the sole carrier of meaning — pair with icon and/or text.

## Component blueprints — quick reference

```
<Button variant="primary" size="md" loading?>…</Button>
<Card>
  <CardHeader>
    <CardTitle>…</CardTitle>
    <CardDescription>…</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
<Dialog open={…} onOpenChange={…}>
  <DialogContent>
    <DialogHeader>…</DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>…</DialogFooter>
  </DialogContent>
</Dialog>
```
