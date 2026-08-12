import { escapeHtml } from "./dom.js";

const TIPS = [
  {
    title: "Your next block lives here",
    body: "Do one decision at a time. Core blocks build your streak. Soft targets do not count.",
  },
  {
    title: "Edit builds your week",
    body: "Use Shifts for work days and Week templates for your rhythm. Track is for checking only. The lock does not rewrite itself to dodge hard work.",
  },
  {
    title: "Install keeps your track",
    body: "Add to home screen so your data stays on this device. No account. No fake streaks.",
  },
];

const FITNESS_TIPS = [
  {
    title: "Confirm your setup",
    body: "Level, gear, bodyweight, and goal seed the plan. Adjust anytime from Adjust gear.",
  },
  {
    title: "Pick the muscles",
    body: "Tap the body map or chips, then Build. We fill compounds and accessories for your gear.",
  },
  {
    title: "Log sets, then seal",
    body: "Check every set with weight and reps. Complete locks the session into History proof.",
  },
];

export function tipsForTrack(track = "today") {
  return track === "fitness" ? FITNESS_TIPS : TIPS;
}

export function renderTipsModal(state, ui = {}) {
  const track = ui.tipsTrack === "fitness" ? "fitness" : "today";
  const tips = tipsForTrack(track);
  const stepKey = track === "fitness" ? "fitnessTourStep" : "tourStep";
  const step = Number(state?.settings?.[stepKey] || 0);
  const tip = tips[Math.min(step, tips.length - 1)] || tips[0];
  const last = step >= tips.length - 1;

  return `
    <div class="modal-backdrop modal-enter" data-stop>
      <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Tips" data-stop>
        <p class="eyebrow" style="color:var(--build)">Tip ${Math.min(step + 1, tips.length)} of ${tips.length}</p>
        <h2 class="display text-4xl mt-1">${escapeHtml(tip.title)}</h2>
        <p class="mt-3 text-sm" style="color:var(--mute)">${escapeHtml(tip.body)}</p>
        <div class="mt-6 flex gap-1" aria-hidden="true">
          ${tips.map((_, i) => `<span class="tip-dot ${i === step ? "is-active" : ""}"></span>`).join("")}
        </div>
        <button type="button" class="btn btn-primary w-full mt-5 !min-h-11" data-action="tour-next">
          ${last ? "Got it" : "Next tip"}
        </button>
      </div>
    </div>
  `;
}

export { TIPS, FITNESS_TIPS };
