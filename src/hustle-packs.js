/** Hustle pack library for blank / non-Marco profiles. */

export const HUSTLE_PACKS = {
  freelance: {
    id: "freelance",
    label: "Freelance web",
    niche: "Local service businesses · landing pages and retainers",
    positioning: "I turn messy operations into clear websites that book work.",
    moneyBlock: "Monday money block: research, post, send, follow up.",
    weeklyFlow: [
      { id: "flow-research", label: "Research 5 targets", detail: "Local businesses that need a site or refresh" },
      { id: "flow-post", label: "Post once", detail: "Taking 1-2 projects this month" },
      { id: "flow-dm", label: "Send 5 warm DMs", detail: "People who already trust you" },
      { id: "flow-follow", label: "Follow up open threads", detail: "Older than 3 days" },
    ],
    ramp: [
      { id: "ramp-w1", label: "Week 1", items: ["Polish one case study", "Send 5 warm messages"] },
      { id: "ramp-w2", label: "Week 2", items: ["List on Contra or Upwork", "Join 2 niche groups"] },
      { id: "ramp-w3", label: "Week 3", items: ["Follow up all open threads"] },
      { id: "ramp-w4", label: "Week 4", items: ["First call or paid project"] },
    ],
    scripts: {
      warmDm:
        "Hey {name} — I help local businesses get clearer websites that book more work. Taking 1-2 projects this month. Open to a quick look?",
      contraHeadline: "Landing pages for local service businesses that convert",
      socialPost: "Taking 1-2 web projects this month for Orlando locals. Proof over vibes.",
      discoveryOpener: "What does a booked week look like for you right now?",
    },
  },
  "job-hunt": {
    id: "job-hunt",
    label: "Job hunt",
    niche: "Targeted applications + warm intros",
    positioning: "I ship proof, not hope. Applications with a clear story.",
    moneyBlock: "Daily hunt block: 3 apps max, quality over spray.",
    weeklyFlow: [
      { id: "jh-research", label: "Research 5 roles", detail: "Fit your story and skills" },
      { id: "jh-apply", label: "Send 3 tailored apps", detail: "Custom note, not spray" },
      { id: "jh-network", label: "2 warm intros", detail: "Alumni, coworkers, friends" },
      { id: "jh-follow", label: "Follow up", detail: "Apps older than 5 days" },
    ],
    ramp: [
      { id: "jh-r1", label: "Week 1", items: ["Resume + LinkedIn polish", "List 20 target companies"] },
      { id: "jh-r2", label: "Week 2", items: ["10 tailored apps", "5 warm intros"] },
      { id: "jh-r3", label: "Week 3", items: ["Mock interview", "Follow-ups"] },
      { id: "jh-r4", label: "Week 4", items: ["Close loops", "Book interviews"] },
    ],
    scripts: {
      warmDm:
        "Hey {name} — exploring roles in {field}. Would you be open to a 10-min chat about how you got in?",
      contraHeadline: "",
      socialPost: "Open to roles where I can ship product and marketing proof. DMs open.",
      discoveryOpener: "What does a strong first 90 days look like on your team?",
    },
  },
  content: {
    id: "content",
    label: "Content creator",
    niche: "Consistent posts that build proof and inbound",
    positioning: "Ship one piece a day. Audience compounds.",
    moneyBlock: "Content block: draft, publish, engage.",
    weeklyFlow: [
      { id: "ct-draft", label: "Draft 3 pieces", detail: "Hooks first" },
      { id: "ct-publish", label: "Publish 2", detail: "Best drafts only" },
      { id: "ct-engage", label: "Engage 20 mins", detail: "Reply to real people" },
      { id: "ct-review", label: "Review metrics", detail: "What earned attention?" },
    ],
    ramp: [
      { id: "ct-r1", label: "Week 1", items: ["Pick niche lane", "Batch 5 drafts"] },
      { id: "ct-r2", label: "Week 2", items: ["Publish daily for 5 days"] },
      { id: "ct-r3", label: "Week 3", items: ["Collaborate or quote 2 people"] },
      { id: "ct-r4", label: "Week 4", items: ["Offer / CTA test"] },
    ],
    scripts: {
      warmDm: "Loved your take on {topic}. Building in public on the same lane — open to a collab?",
      contraHeadline: "",
      socialPost: "Building in public. Proof over vibes. Day {n}.",
      discoveryOpener: "What content actually moved the needle for you last month?",
    },
  },
  blank: {
    id: "blank",
    label: "Blank",
    niche: "",
    positioning: "",
    moneyBlock: "",
    weeklyFlow: [
      { id: "blank-1", label: "Define this week's hustle", detail: "One outcome" },
      { id: "blank-2", label: "Ship one outreach", detail: "Message, post, or ask" },
      { id: "blank-3", label: "Log what worked", detail: "Keep the signal" },
    ],
    ramp: [
      { id: "blank-r1", label: "Week 1", items: ["Write your offer in one sentence"] },
      { id: "blank-r2", label: "Week 2", items: ["Talk to 5 people"] },
      { id: "blank-r3", label: "Week 3", items: ["Ship a proof artifact"] },
      { id: "blank-r4", label: "Week 4", items: ["Ask for the first yes"] },
    ],
    scripts: {
      warmDm: "",
      contraHeadline: "",
      socialPost: "",
      discoveryOpener: "",
    },
  },
};

export function getHustlePack(id) {
  return HUSTLE_PACKS[id] || HUSTLE_PACKS.blank;
}
