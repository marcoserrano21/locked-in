/** Starter block templates for blank setup wizard. */

export const BLOCK_PRESETS = {
  morning: [
    { label: "Wake + move", time: "7:00 AM", soft: false, tags: [{ label: "core", tone: "build" }] },
    { label: "Deep work", time: "9:00 AM", soft: false, tags: [{ label: "build", tone: "build" }] },
    { label: "Admin / inbox", time: "1:00 PM", soft: true, tags: [{ label: "soft", tone: "neutral" }] },
    { label: "Wind down", time: "8:00 PM", soft: true, tags: [{ label: "soft", tone: "neutral" }] },
  ],
  afternoon: [
    { label: "Plan the day", time: "11:00 AM", soft: true, tags: [{ label: "soft", tone: "neutral" }] },
    { label: "Main work block", time: "1:00 PM", soft: false, tags: [{ label: "core", tone: "build" }] },
    { label: "Outreach / admin", time: "4:00 PM", soft: false, tags: [{ label: "hustle", tone: "maintain" }] },
    { label: "Recovery", time: "8:00 PM", soft: true, tags: [{ label: "soft", tone: "neutral" }] },
  ],
  evening: [
    { label: "Day job / school", time: "9:00 AM", soft: false, tags: [{ label: "maintain", tone: "maintain" }] },
    { label: "Side project", time: "7:00 PM", soft: false, tags: [{ label: "build", tone: "build" }] },
    { label: "Workout", time: "8:30 PM", soft: false, tags: [{ label: "workout", tone: "build" }] },
    { label: "Shutdown", time: "10:00 PM", soft: true, tags: [{ label: "soft", tone: "neutral" }] },
  ],
};
