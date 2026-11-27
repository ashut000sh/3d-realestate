# Aawas design system (v2)

Calm, editorial, photo-first. Ivory page, one ink colour for text, green for the action,
gold as a small accent. Most structure comes from **space and hairlines, not boxes**.
Tokens live in `client/src/styles/index.css` (`@theme`). Principles: `REFERENCES.md`.

## Colour

| Token | Hex | Use |
|---|---|---|
| `background` | `#faf8f3` ivory | every page |
| `surface` | `#ffffff` | inputs, floating things (menus, dialogs, map cards) |
| `sand` | `#f1ede3` | skeletons, quiet fills (rare) |
| `text` / `ink` | `#16201d` / `#0e2a23` | all text / dark surfaces (tour viewer) |
| `muted` | `#5f6763` | secondary text (5.5:1 on ivory, 5.0:1 on sand) |
| `border` | `#e8e3d8` | hairlines (1px) and input borders |
| `primary` | `#1d5b4c` forest green | **the** action on a screen, links, selected states |
| `accent` | `#c39a4b` gold | marks only: underlines, focus ring, dots, text on `ink` |
| `accent-ink` | `#7d5f22` | gold **text** on light backgrounds (5.6:1). Plain gold text fails (2.5:1) |
| status | success / warning / danger / info | real statuses only (booking, scan, live) |

Rules: one green primary action per screen area. Gold never carries small text on light
backgrounds. No gradients, glows, blurred blobs or glass blur anywhere.

## Type: 6 sizes

| Token | Size / line | Font | Use |
|---|---|---|---|
| `text-display` | 48/52 (32/38 on phones) | Fraunces 500, −0.03em | one per page: hero, listing title |
| `text-title` | 32/38 (26/32 on phones) | Fraunces 500, −0.02em | page titles, section headings |
| `text-heading` | 20/28 | Inter 600 (or Fraunces for editorial blocks), −0.01em | sub-sections, prices |
| `text-body` | 16/24 | Inter 400 | body copy; long reading at 17/27 (`text-body` + `leading-relaxed`) |
| `text-small` | 14/20 | Inter 400/500 | meta, captions, table text, buttons |
| `text-label` | 12/16 | Inter 600, +0.12em uppercase | **at most one per section**, and only when it adds meaning |

Numbers that compare (prices, stats, tables) use `tabular-nums`.

## Spacing: 4px grid

Only 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px (Tailwind 1, 2, 3, 4, 6, 8, 12, 16, 24, 32).
- Inside a group (label → value, title → meta): 4–12.
- Between groups in a section: 24–32.
- Between page sections: 64–96 desktop, 48–64 phones.
- Page gutters: 16 phones, 24 tablet, 32 desktop; content max width 1200 (reading 680).

## Shape and elevation

- Radius: **8px** inputs/buttons (`rounded-lg`), **12px** photos (`rounded-xl`),
  **16px max** for the few real cards and dialogs (`rounded-2xl`). Full pills only for chips.
  Nothing above 20px.
- Elevation: one level, `shadow-float`, for things that float over content (menus, dialogs,
  map cards, toasts, sticky bars). Everything else: **no shadow, no border box**. Separate with
  whitespace and 1px `border` hairlines.

## Components

- **Button**: 44px tall (40px small), 8px radius, Inter 500 14–15px. `primary` (green), `secondary`
  (white with hairline), `ghost` (text). No gradients, no coloured shadows. Gold buttons are
  retired; the secondary action is `secondary`.
- **Chip**: full pill, 12px text, only for real states: listing type, 3D tour, verified,
  booking/scan status. Never marketing ("Nepal's first…", "New!").
- **Listing card**: the photo is the card (4:3, 12px radius, ivory skeleton until loaded), then
  title, place · area, and price in `text-heading`. No border, no shadow, no arrow button.
- **Facts**: a row of label/value pairs split by hairlines, not one card per fact.
- **Empty states**: one line-art illustration (`client/src/assets/illustrations/`), one sentence,
  one action. Not boxed.
- **Icons**: the existing 24×24, 1.8 stroke set only. Use one when it adds meaning a word
  can't (map pin, heart, 3D cube). No icon in every heading, no icon in a coloured circle.

## Illustrations

Inline SVG, line art, 1.5px stroke at 1×, `ink` lines with one `accent` (gold) detail, no fills
except ivory. Same viewBox grid and stroke caps everywhere: an architect's sketch, not clip-art.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | anything entering |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | anything moving |
| UI | 150–250 ms | hovers, toggles, menus, heart, chips |
| Page | 400–700 ms | page reveal (fade + 8px rise), images fading in |

No bounce, no looping decoration, no animation on every render. Numbers animate once.
`prefers-reduced-motion: reduce` → no animation, final states immediately.

## Banned

Cards inside cards · a bordered card around every section · random gradients, glows,
blurred colour blobs, glassmorphism · radius ≥ 24px on everyday elements · pills that carry no
information · rows of identical stat cards with an icon in a coloured circle · an icon in every
heading · emoji · centring everything · walls of equal-weight cards · "gradient hero + 3 feature
cards + CTA banner".
