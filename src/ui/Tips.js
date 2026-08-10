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

export function renderTipsModal(state) {
  const step = Number(state?.settings?.tourStep || 0);
  const tip = TIPS[Math.min(step, TIPS.length - 1)] || TIPS[0];
  const last = step >= TIPS.length - 1;

  return `
    <div class="modal-backdrop modal-enter" data-stop>
      <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Tips" data-stop>
        <p class="eyebrow" style="color:var(--build)">Tip ${Math.min(step + 1, TIPS.length)} of ${TIPS.length}</p>
        <h2 class="display text-4xl mt-1">${escapeHtml(tip.title)}</h2>
        <p class="mt-3 text-sm" style="color:var(--mute)">${escapeHtml(tip.body)}</p>
        <div class="mt-6 flex gap-1" aria-hidden="true">
          ${TIPS.map((_, i) => `<span class="tip-dot ${i === step ? "is-active" : ""}"></span>`).join("")}
        </div>
        <button type="button" class="btn btn-primary w-full mt-5 !min-h-11" data-action="tour-next">
          ${last ? "Got it" : "Next tip"}
        </button>
      </div>
    </div>
  `;
}

export { TIPS };
