# Design System — Marco Locked-In (MASTER)

## Brand feel

Ink stage. Athletic type. Proof over chrome. One composition per screen. Track metaphor, not dashboard clutter.

## Tokens

| Token | Hex | Role |
|---|---|---|
| bg | `#070A10` | Page |
| surface | `#12161F` | Cards / sheets |
| border | `#262B38` | Hairlines |
| text | `#F2F4F8` | Primary |
| muted | `#8B93A7` | Secondary |
| build | `#3ECF8E` | Foundation / done / primary CTA |
| maintain | `#F5A623` | Maintenance / soft / warn |
| danger | `#FF5C5C` | Streak risk / overage |
| accent-ink | `#06231A` | Text on build CTA |

## Typography

- Display: Barlow Condensed (streaks, Day X/30, big numbers)
- Body: Barlow
- Import via Google Fonts
- Avoid Inter / Roboto / system-only stacks as the hero look

## Layout

- Mobile-first, max-width ~440px centered
- Sticky bottom nav (5 tabs: Today, Proof, Miles, Hustle, Profile)
- Touch targets ≥ 44px
- One primary CTA per viewport on Today
- Slightly lowered headers / tighter top rhythm

## Motion

- 150-300ms ease-out for UI
- Check seal: brief scale + color, no layout shift
- Honor `prefers-reduced-motion: reduce`

## Icons

SVG only (inline). No emoji icons.

## Themes

Supports `dark`, `light`, and `high` contrast via `data-theme` on `<html>`. Theme control lives on Profile.

## Surfaces

No outlined card borders. No accent top bars on panels. Elevation comes from surface fill + soft shadow only. Panel stack gap is at least 0.85rem. No em dashes in UI copy.

## Chips / pills

Never put light text on white chips. Use `--chip` / `--chip-ink` and `--soft-chip` / `--soft-chip-ink` pairs so tags stay readable in every theme.

## Task rows

Fixed min-height rows. Titles wrap up to two lines. Longer context lives in `details` (editor + Now card), so list rhythm stays even.

## Accessibility

- Visible focus rings
- Buttons for actions, not clickable divs
- Color is not the only state signal (check mark + label)
- Contrast ≥ 4.5:1 for body text
