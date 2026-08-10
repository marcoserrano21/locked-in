import { escapeHtml } from "./dom.js";

export function shouldShowWelcome() {
  return Boolean(window.__marcoNeedsWelcome);
}

export function renderWelcomeModal(ui) {
  const step = ui.welcomeStep || 1;
  const name = ui.welcomeName || "";
  const focus = ui.welcomeFocus || "both";

  if (step === 1) {
    return `
      <div class="modal-backdrop" data-stop>
        <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Welcome">
          <p class="eyebrow" style="color:var(--build)">Welcome</p>
          <h2 class="display text-4xl mt-1">Lock in your track.</h2>
          <p class="mt-2 text-sm" style="color:var(--mute)">Your schedule and logs stay on this device. No account needed.</p>
          <form class="mt-5 space-y-3" data-action="welcome-name">
            <div>
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="welcome-name">What should we call you?</label>
              <input class="input" id="welcome-name" name="displayName" required placeholder="Your name" value="${escapeHtml(name)}" autocomplete="nickname" />
            </div>
            <button type="submit" class="btn btn-primary w-full">Continue</button>
          </form>
          <button type="button" class="btn w-full mt-2 !text-xs" data-action="welcome-demo">Try Marco demo instead</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop" data-stop>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Choose focus">
        <p class="eyebrow">Step 2</p>
        <h2 class="display text-4xl mt-1">What are you locking in?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Pick your starting lane. You can use everything later.</p>
        <form class="mt-5 space-y-3" data-action="welcome-focus">
          <input type="hidden" name="displayName" value="${escapeHtml(name)}" />
          <div class="space-y-2">
            ${[
              { id: "schedule", label: "Schedule", detail: "Track daily blocks and streaks" },
              { id: "fitness", label: "Fitness", detail: "Log workouts, sets, and progress" },
              { id: "both", label: "Both", detail: "Schedule plus fitness growth" },
            ]
              .map(
                (opt) => `
              <label class="plan-row !min-h-[4.75rem] flex cursor-pointer items-start gap-3">
                <input type="radio" name="focus" value="${opt.id}" class="mt-1" ${focus === opt.id ? "checked" : ""} />
                <span>
                  <span class="task-title !min-h-0">${escapeHtml(opt.label)}</span>
                  <span class="task-meta">${escapeHtml(opt.detail)}</span>
                </span>
              </label>`
              )
              .join("")}
          </div>
          <div class="flex gap-2 pt-1">
            <button type="button" class="btn flex-1" data-action="welcome-back">Back</button>
            <button type="submit" class="btn btn-primary flex-1">Start my track</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
