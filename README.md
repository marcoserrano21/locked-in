# Marco Locked-In

Retention-first personal schedule OS. Next block. Proof over vibes.

## Run

```bash
npm install
npm run dev
```

Phone install: open the HTTPS/LAN URL in mobile Safari/Chrome → Add to Home Screen.

```bash
npm run build
npm run preview
```

---

## Guest beta (share with friends)

Ten isolated guest slots let friends try the app without sharing your data or hitting a login wall. Each slot is its own track on their phone.

### Public URLs

| Slot | Link |
|------|------|
| beta-01 | `https://locked-in-marco.vercel.app/?guest=beta-01` |
| beta-02 | `https://locked-in-marco.vercel.app/?guest=beta-02` |
| beta-03 | `https://locked-in-marco.vercel.app/?guest=beta-03` |
| beta-04 | `https://locked-in-marco.vercel.app/?guest=beta-04` |
| beta-05 | `https://locked-in-marco.vercel.app/?guest=beta-05` |
| beta-06 | `https://locked-in-marco.vercel.app/?guest=beta-06` |
| beta-07 | `https://locked-in-marco.vercel.app/?guest=beta-07` |
| beta-08 | `https://locked-in-marco.vercel.app/?guest=beta-08` |
| beta-09 | `https://locked-in-marco.vercel.app/?guest=beta-09` |
| beta-10 | `https://locked-in-marco.vercel.app/?guest=beta-10` |

**Founder track (no guest param):** `https://locked-in-marco.vercel.app/`

Copy links from **Profile → Beta** inside the app.

### How it works

1. **One link per person.** Assign `beta-01` to friend A, `beta-02` to friend B, and so on. Do not reuse a slot for two people if you want clean feedback.
2. **Isolated storage.** Each guest URL writes to its own localStorage key (`marco-tracker-v4:guest:beta-01`, etc.). Theme preference is mirrored (`marco-theme:guest:…`). No shared blob across friends.
3. **Blank start.** First open on a guest link boots a welcome flow with an empty profile (display name like "Beta 01"). No Marco demo data unless they choose it.
4. **On-device only.** Data stays on their phone. There is no cloud sync in beta. They can **Export JSON** (Profile → Data) and send you the file if you want qualitative review.
5. **Anonymous pageviews.** `@vercel/analytics` tracks aggregate visits. It does not expose per-user workout or streak data.

### Instructions for beta testers

Send this block (edit the slot name):

```
You're on the Marco Locked-In beta.

1. Open this link on your phone: https://locked-in-marco.vercel.app/?guest=beta-XX
2. Add to Home Screen (Safari Share → Add to Home Screen, or Chrome menu → Install).
3. Walk Welcome → pick Simple or Full → seal your first day on Today.
4. Optional: log a workout on Fitness (Freelance tab → Fitness).
5. After a week, Export JSON from Profile → Data and send it back if you want me to see your track.

What I need from you:
- Does Today feel usable on mobile?
- Did Fitness expand/drag/timer feel broken?
- Anything confusing in Profile or onboarding?

No login. Your data stays on your device.
```

### If the link asks for a Vercel login

That is **Deployment Protection** on the Vercel project (SSO / Vercel Authentication), not app auth.

**Fix:** Vercel dashboard → Project → Settings → Deployment Protection → disable for **Production** (or allow public access on the production domain).

### Founder checklist

- [ ] Production deployment protection off (public URL opens without Vercel sign-in)
- [ ] Assign guest slots in a spreadsheet (name → beta-0N)
- [ ] Install the PWA yourself on a second device with a guest URL to QA isolation
- [ ] After feedback, ask for JSON export only if you need to inspect their track

### Marketing playbook

See [`docs/BETA_MARKETING.md`](docs/BETA_MARKETING.md) for positioning, channels, and a 4-week launch cadence.

---

## Docs

- `docs/PRODUCT.md` — vision + retention model
- `docs/SCHEDULE.md` — human schedule source
- `docs/VOICE.md` — in-app copy rules
- `docs/BETA_MARKETING.md` — guest beta + digital marketing strategy
- `design-system/MASTER.md` — UI tokens
- `content/schedule.seed.json` — machine seed
