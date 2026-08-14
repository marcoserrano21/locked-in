# Marketing strategy (post-beta)

Guest-beta week 0–4, slot mechanics, and DM templates stay in [`docs/BETA_MARKETING.md`](../BETA_MARKETING.md). This doc is what happens after those four weeks, and how the story stays sharp.

Personas: [`02-personas.md`](02-personas.md). Pitch: [`03-elevator-pitch.md`](03-elevator-pitch.md). Viral formats: [`05-viral-playbook.md`](05-viral-playbook.md).

---

## Category we are actually in

Not "another habit tracker." Not "another gym log."

**A local-first personal OS for the next block**, with a lift log and a money ceiling riding along.

Category leaders (Streaks, Strong, Structured) each win one job. We win the week that has all three. See [`09-competitive.md`](09-competitive.md).

Primary segment for public push: **fitness-first (Ava)** if the completion screen is shareable. Secondary: builders (Jordan). Hustle (Sam) is a premium-preview story, not the launch headline.

Pick one primary per month. Mixing all four personas in one post makes the product sound unfinished. It is unfinished. Do not advertise that as a feature.

---

## Three post-beta paths

Decide with the week-4 scorecard in BETA_MARKETING (install proxy, 3-day streak, fitness sessions, qualitative themes). Then pick **one**:

| Path | When | Story | Cost |
|---|---|---|---|
| Stay local-first | Testers seal days and do not ask for sync | Capacitor + local notifications + widget. Export stays the account. | Engineering time. $0 cloud. |
| Light accountability | Testers say "I would keep going if someone saw the streak" | One trusted person, streak only. Not a social feed. | Small backend or a share-link that expires. |
| Paid later | People hit the Hustle wall and still want it | Real Stripe + auth. Kill the client-side password. | This is a company, not a PWA. |

Do not start path 3 to avoid finishing path 1. Widget + "Add to Home Screen" is the retention feature testers will actually feel.

---

## Positioning, owned, paid

**One line:** The schedule OS that makes "did I actually do it?" obvious on your phone.

**Owned**

- Production URL as the landing page. One hero: Today + streak. Second shot: workout complete.
- README + Profile → Beta as the canonical link list.
- This package as the founder brain. Do not maintain a second Notion strategy.

**Organic (repeat the four pillars from BETA_MARKETING)**

1. Honest local-first
2. Seal the day
3. Fitness without bloat
4. Builder learning out loud

Channels: X thread, Instagram Reel, LinkedIn builder post, DMs (highest conversion), one community post where you already have a name.

**Paid:** skip until the PWA install rate on organic testers is boringly good. Paid to a login wall or a Vercel SSO page is lighting money on fire.

**Communities:** Indie Hackers, gym group chats, freelance Slacks you already sit in. Lead with a question. Offer 2–3 slots per thread, never all ten.

---

## Messaging by persona

| Persona | Hook | Do not say |
|---|---|---|
| Ava | "Log the workout. Seal the day. One app." | Hustle, Command, Uber, Day 30 rubric |
| Jordan | "One next block. Core-only streak." | Five tabs, Premium, scripts |
| Sam | "Monday Flow + receipts." | That Fitness is the whole product |
| Marco / hire | Constraints, Day 30 honesty, Demo Drive Hub as proof of shipping | Fake scale, "AI coach" |

CTA copy stays short:

`Trying a 10-person beta. No login. Install from link. DM for a slot.`

---

## Funnel you can actually measure

There is no cross-user dashboard. Stop pretending there is.

| Stage | Proxy | Goal after beta |
|---|---|---|
| Attention | Vercel pageviews, post impressions | Baseline, not vanity |
| Install | Survey: Add to Home Screen? | >60% of people who opened a guest link twice |
| Activation | 1 sealed day in 48h (export / conversation) | Majority of assigned slots |
| Retention | 3-day core streak | 3+ slots |
| Depth | 1 completed workout (fitness segment) | 1+ per fitness slot |
| Qual | Top 3 UX bugs | Written in STRATEGY, then shipped |

---

## Brand and compliance

- No health claims. Logging is not programming, not PT, not medical.
- Privacy: on-device. JSON export may contain names. Ask before they send it. Never post a tester export.
- Guest links are not security. Rotate after beta if a slot leaks.
- Premium preview is not a product. Do not put `test123!S` in public posts.
- Children: not targeted.

Visual: ink stage, mint CTA, Barlow. Share cards should look like proof (streak, sealed stamp, PR), not a screenshot of Profile.

---

## 90-day story (after week 4)

**Days 1–30:** Ship P0 from [`01-recommended-approach.md`](01-recommended-approach.md) (Today chrome, fitness skip-setup, muscle picker). Public posts are before/after from beta feedback.

**Days 31–60:** Nav naming + Proof first-run. One Reel that is only the seal. Decide Capacitor vs stay-PWA.

**Days 61–90:** Widget spec or light accountability spec. Portfolio case study published ([`07-case-study.md`](07-case-study.md)). Thank-you post to testers. No fake "version 2.0" launch.

If energy is scarce, skip days 61–90 marketing and ship the P0. The product is the campaign.
