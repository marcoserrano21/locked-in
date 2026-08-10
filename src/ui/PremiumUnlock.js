import { escapeHtml } from "./dom.js";

/** MVP test password — replace with real billing before production. */
export const PREMIUM_TEST_PASSWORD = "test123!S";

export function renderPremiumUnlockCard() {
  return `
    <section class="panel premium-card space-y-3">
      <p class="eyebrow" style="color:var(--maintain)">Premium</p>
      <h2 class="display text-3xl leading-tight">Unlock Hustle command center</h2>
      <p class="text-sm" style="color:var(--mute)">Fitness stays free. Premium unlocks Brief, Flow, Ramp, Scripts, and full command-center editing.</p>
      <button type="button" class="btn btn-primary w-full" data-action="open-premium-unlock">Unlock Premium</button>
    </section>
  `;
}

export function renderPremiumUnlockModal(ui) {
  const err = ui.premiumError ? `<p class="text-xs mt-2" style="color:var(--danger)">${escapeHtml(ui.premiumError)}</p>` : "";
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Unlock Premium" data-stop>
        <p class="eyebrow" style="color:var(--maintain)">Premium</p>
        <h2 class="display text-3xl mt-1">Enter access code</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">For testing, use your Premium password. Real payments come later.</p>
        <form class="mt-5 space-y-3" data-action="unlock-premium">
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="premium-pass">Password</label>
            <input class="input" id="premium-pass" name="password" type="password" required autocomplete="current-password" />
          </div>
          ${err}
          <button type="submit" class="btn btn-primary w-full">Unlock Hustle</button>
        </form>
        <button type="button" class="btn w-full mt-2" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}
