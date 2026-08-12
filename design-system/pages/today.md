# Today page overrides

- Segmented **Track | Edit** under the header
- Hero hierarchy: **stats rail** (Day X/N · Streak · Core M/T) sits under the title; soft-target note is a chip on the Now card
- Track: Now card, List|Timeline toggle, week pills, blocks, Coming up, refresh
- Timeline: vertical time axis from block start times; Now marker on today; focus block highlighted
- Edit: embedded Plan (templates / shifts / one day / birthdays)
- Opening Today nav always lands in Track on today's date
- Soft targets demoted (tag + muted weight)
- Yesterday catch-up when settings allow; show subtle catch-up chip
- Stale backup banner (after Day 3) with Export JSON / Not now — dismissible via `backupNudgeDismissed`
- Partial DOM patches on block toggle: update stats rail, Now card, day panel without remounting nav
- One primary CTA on Now card: Check this block
