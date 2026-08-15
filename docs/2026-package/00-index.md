# August 2026 product and GTM package

This folder is the strategy layer on top of the live PWA. It does not replace as-built flow docs. It answers: who it is for, how to talk about it, who we compete with, and what to ship next.

**North star stays the same.** Next block. Proof over vibes. Streak on core only. Export is the account.

## How to use this

| If you need | Open |
|---|---|
| What to build next, in order | [01-recommended-approach.md](01-recommended-approach.md) |
| Who the product is for | [02-personas.md](02-personas.md) |
| How to say it in 8 seconds or 2 minutes | [03-elevator-pitch.md](03-elevator-pitch.md) |
| Post-beta go-to-market | [04-marketing-strategy.md](04-marketing-strategy.md) |
| Share loops, Reels, scarcity | [05-viral-playbook.md](05-viral-playbook.md) |
| 10-slide talk | [06-presentation.md](06-presentation.md) |
| Portfolio case study | [07-case-study.md](07-case-study.md) |
| Site / DM / interview paste | [08-portfolio.md](08-portfolio.md) |
| Vs Streaks, Strong, Hevy, Structured | [09-competitive.md](09-competitive.md) |
| Every screen, modal, button scored | [10-ux-review.md](10-ux-review.md) |

Guest-beta week 0–4 still lives in [`docs/BETA_MARKETING.md`](../BETA_MARKETING.md). Do not fork that cadence here.

Interactive scorecard (competitive matrix + screen grades): open [locked-in-2026-scorecard](C:/Users/mhmja/.cursor/projects/c-Users-mhmja-OneDrive-Desktop-Cursor-Projects-Marco-s-Weekly-Schedule/canvases/locked-in-2026-scorecard.canvas.tsx) beside chat in Cursor.

## Source of truth elsewhere

- Vision + retention model: [`docs/PRODUCT.md`](../PRODUCT.md)
- Shipped backlog + non-goals: [`docs/STRATEGY.md`](../STRATEGY.md)
- As-built journeys: [`docs/flows/00-overview.md`](../flows/00-overview.md)
- In-app copy: [`docs/VOICE.md`](../VOICE.md)
- Tokens: [`design-system/MASTER.md`](../../design-system/MASTER.md)

## Rules for this package

- Docs only. No `src/` changes landed with this pass.
- Recommendations cite live files (`src/ui/Today.js`, not a fantasy IA).
- Voice for pitch, case study, viral, portfolio: human, compressed, no em dashes, no emoji icons.
- Competitive and UX review stay specific. Steal vs refuse is named.

## Later implementation order

Named here so a future coding pass does not invent a new queue:

1. Today chrome (one Check, fewer banners)
2. Fitness activation (skip prefs when they exist)
3. Muscle picker hit-targets
4. Nav naming (Hustle vs Train)
5. Proof first-run (one card, not a dashboard)
6. Profile density
