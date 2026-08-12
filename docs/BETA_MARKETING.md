# Guest beta and digital marketing strategy

Marco Locked-In is a local-first PWA: proof over vibes, streak identity, fitness + schedule in one lane. This doc is the go-to-market plan for the 10-slot guest beta and the first public push.

---

## Positioning

**One line:** The schedule OS that makes "did I actually do it?" obvious on your phone.

**For who (beta):**
- Builders who already track habits but hate bloated apps
- Friends who lift and want a simple log without subscriptions
- Freelancers juggling Monday Flow + core blocks

**Not for (yet):**
- Teams needing shared calendars
- People who refuse to install a PWA
- Anyone expecting cloud sync on day one

**Differentiators to lead with:**
1. **No login.** Open link, install, go.
2. **Streak on core blocks only.** Identity, not checkbox spam.
3. **Fitness + Today in one app.** Session timer, sets, rest timer, completion screen.
4. **Export is the account.** Honest about local-only; backup is a feature, not fine print.

---

## Guest beta mechanics (marketing + product)

| Element | Message |
|---------|---------|
| 10 guest URLs | "Limited beta slots" creates scarcity without fake waitlists |
| Isolated storage | "Your track, your phone" privacy story |
| JSON export | Power users feel respected; you get qualitative data when they opt in |
| Profile → Beta | Founder copies links in-app; no separate Notion doc to maintain |
| Vercel Analytics | Aggregate traffic only; do not overclaim "we see your workouts" |

**Slot assignment:** Treat slots like invite codes. Name them in a sheet: `beta-03 → Alex (lifting)`, `beta-04 → Sam (freelance)`.

---

## Audience segments and hooks

### Segment A: Gym / fitness
- **Hook:** "Log the workout. Seal the day. One app."
- **Proof point:** Session timer, progressive overload hints, PR completion screen
- **Channel:** Instagram Stories, gym group chat, Strava-adjacent discords

### Segment B: Habit / productivity
- **Hook:** "Today is an open window. Check blocks when you do them, not when the clock says."
- **Proof point:** Streak rail, Yesterday catch-up, no punitive time locks
- **Channel:** X thread, Indie Hackers comment, personal newsletter

### Segment C: Freelance / side hustle
- **Hook:** "Monday Flow + miles + core blocks. Survive the week with receipts."
- **Proof point:** Hustle packs, outreach log, soft-stop on miles
- **Channel:** LinkedIn short post, freelance Slack communities

Pick **one primary segment for week 1** so messaging stays sharp. Fitness is the strongest demo moment (completion screen is shareable).

---

## Channel plan

### Owned
| Asset | Action |
|-------|--------|
| Landing | Production URL + one hero screenshot (Today + streak) |
| README / Profile Beta | Canonical link list for you; testers get one personalized URL |
| Export JSON | Ask for feedback export only from engaged testers (week 2+) |

### Social (organic)
| Platform | Format | Cadence |
|----------|--------|---------|
| X | 3-tweet thread: problem → demo GIF → guest link CTA | Launch day + week 2 |
| Instagram | 15s Reel: open PWA → check block → seal day | 2x in beta month |
| LinkedIn | Builder post: "local-first, no login, honest about export" | 1x launch week |
| TikTok (optional) | "POV: you finally log sets without 12 taps" | If you already post there |

**CTA copy (short):**  
`Trying a 10-person beta. No login. Install from link. DM for a slot.`  
Do not dump all 10 links publicly; assign one per person so you know who gave which feedback.

### Communities (light touch)
- Post once in communities where you're already a member (Indie Hackers, niche fitness discords, local builder groups)
- Lead with a question: "Would you use a PWA that doesn't sync but exports JSON?"
- Offer 2-3 slots per thread, not all 10

### Email / DMs (highest conversion)
Personal message template:

```
Hey [name] - I'm beta testing Marco Locked-In, a phone-first schedule + workout tracker (no login, data stays on device).

Would you try it for 7 days if I send you a personal link? I need honest mobile feedback on Today + Fitness.

Takes ~2 min to install (Add to Home Screen). No account.
```

---

## 4-week cadence

### Week 0 (pre-launch)
- [ ] Confirm Vercel production is public (no SSO wall)
- [ ] QA guest-01 on a second phone; confirm storage isolation
- [ ] Record 20-30s screen capture: Welcome → first seal → optional workout complete
- [ ] Fill slot spreadsheet (10 names or placeholders)

### Week 1 (launch)
- [ ] Send 5 personal DMs with unique guest links
- [ ] Publish X thread + one LinkedIn post
- [ ] Install prompt in message: "Add to Home Screen" is non-negotiable for retention
- [ ] Collect feedback in one place (Notion page, GitHub Discussions, or simple form)

### Week 2 (iterate + social proof)
- [ ] Ship 1 fix from top feedback (you already did UX pass; next is tester-driven)
- [ ] Ask 2 engaged users for a quote or screen recording (with permission)
- [ ] Second social post: before/after or "what changed from beta feedback"
- [ ] Remaining 5 guest slots to waitlist / replies

### Week 3 (retention check)
- [ ] Message testers who haven't sealed a day: "Stuck on onboarding or just busy?"
- [ ] Highlight Export JSON for anyone nervous about losing data
- [ ] Internal metric: how many slots hit 3+ sealed days?

### Week 4 (decision)
- [ ] Summarize: activation (installed PWA), retention (3-day streak), fitness sessions completed
- [ ] Decide: widen beta, Capacitor wrap, or backend for sync (see STRATEGY.md non-goals)
- [ ] Thank-you post; offer early access to next build for people who exported feedback

---

## Content pillars (repeatable)

1. **Honest local-first.** "No cloud yet. Export is your backup." Trust beats hype.
2. **Seal the day.** Visual of streak + core checkmarks. Identity loop.
3. **Fitness without bloat.** Timer, sets, rest, complete. Not another subscription spreadsheet.
4. **Builder learning out loud.** Short posts on what broke in beta and what you fixed.

Avoid: fake urgency, "AI-powered" filler, comparing to apps you haven't used in a month.

---

## Metrics (what you can actually measure)

| Metric | Source | Beta goal |
|--------|--------|-----------|
| Pageviews | Vercel Analytics | Baseline traffic |
| Installs (proxy) | Ask in survey: "Did you Add to Home Screen?" | >60% of active testers |
| Activation | Guest local insights / export review | 1 sealed day in first 48h |
| Retention | 3-day core streak per slot | 3+ slots hit this |
| Fitness depth | Completed workouts per slot | 1+ session for fitness segment |
| Qualitative | DM / form themes | Top 3 UX bugs documented |

You will **not** see cross-user dashboards without a backend. That is fine for beta. JSON exports and conversations are the qualitative layer.

---

## Risk and compliance

- **No health claims.** Fitness is logging, not medical advice.
- **Privacy:** Data on device; tell testers not to share JSON publicly (may contain names/notes).
- **Guest slots are not security.** Anyone with the link can use that slot. Rotate slots after beta if abused.
- **Children:** Not targeted; no COPPA-specific flows.

---

## Post-beta paths

1. **Stay local-first:** Capacitor + notifications + widget (STRATEGY.md Phase next)
2. **Light accountability:** One trusted person sees streak, not full data
3. **Paid tier later:** Premium preview in app today is client-side only; real billing needs Stripe + auth story

---

## Quick reference links

- Production: `https://locked-in-marco.vercel.app/`
- Guest pattern: `https://locked-in-marco.vercel.app/?guest=beta-01` … `beta-10`
- In-app copy links: Profile → Beta
- Technical README: [`README.md`](../README.md#guest-beta-share-with-friends)
