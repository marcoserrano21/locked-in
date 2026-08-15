# Case study: Marco Locked-In

I built a schedule OS because the old flow made me work harder than the system. Took more than one wrong version. Still not perfect. The before/after is the point.

This is the portfolio writeup. Voice on purpose. Numbers where we have them. Gaps named.

Live: `https://locked-in-marco.vercel.app/`

---

## The problem

I was stacking a Tesla week, school deadlines, a 10k-mile lease, Monday outreach, and gym days. Then I was tracking that life in tools designed for a different person.

Habit apps wanted 24 circles. Calendars wanted clock-locked blocks. Gym apps wanted a subscription and a social feed. None of them would tell me, at a glance, whether the **next block** actually happened.

The fantasy week is easy to design for. The real week needs receipts.

## Constraints (the interesting part)

- Local-only. $0 cloud budget for v1. Export is the account.
- Phone-first PWA. 440px chrome. Bottom nav. Install from Safari/Chrome.
- Three themes: dark, light, high contrast. Barlow + mint. No emoji icons.
- One founder-user who also has to ship a blank track for friends.
- No fake AI. Coach is rules.

If I had started with accounts, I would still be on the login screen.

## What I tried

**V1 instinct:** put the whole life on one dashboard. That died. Dashboards are where next actions go to get lost.

**Retention model I actually shipped** (see [`docs/PRODUCT.md`](../PRODUCT.md)):

1. Commitment contract (Day X/N always visible)
2. Identity streaks on core only
3. Loss aversion near midnight, soft
4. Variable reward on seal
5. Edit friction mid-lock, logged for Day 30
6. Money truth with a soft-stop and a hard ceiling

**Onboarding:** Welcome is five steps and live. A second wizard still sits in the repo with no-op handlers. I left a second brain in the house. Testers should never see it. I should delete it. Still on the list.

**Fitness:** I put a Strong-ish session under a tab named Hustle. Gym-first people cannot find the gym. The empty state also reopens full setup even when prefs exist. I would not ship that in someone else's app. I shipped it in mine.

**What worked:** guest slots with isolated `localStorage`. Seal motion with reduced-motion. Complete vs End on workouts. Simple vs Full so blank tracks are not a five-tab tax.

## Outcome (honest)

Shipped: installable PWA, offline after first load, editable schedule, honest streaks, Uber soft-stop, fitness timer + rest + history, 10 guest URLs, docs aligned with most of the UI.

Not shipped: widgets, real push, App Store wrap, cloud sync, a nav label that says Train.

Beta proof is qualitative on purpose. There is no cross-user dashboard. If a friend seals three days and sends an export, that is the metric. Pageviews are not.

## What I would do next

Order is in [`01-recommended-approach.md`](01-recommended-approach.md): Today chrome, skip fitness setup, muscle picker hits, then rename the tab.

Then Capacitor + local notifications + a home-screen widget (Now + streak + Day X/N). Light accountability after that: one person sees the streak, not the whole life.

I am not going to fake Fitbod. I am not going to clock-lock checks. Those are the lines.

## Role / stack

Solo. Product, UX, UI, copy, engineering.

Vite, vanilla JS, Tailwind, localStorage (`marco-tracker-v4`), service worker v4, Vercel, `@vercel/analytics` (pageviews only).

## One line for a case-study grid

**Locked-In.** Local-first schedule OS. Next block. Proof over vibes. Core-only streak.
